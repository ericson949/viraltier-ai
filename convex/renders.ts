import { query, mutation, action } from './_generated/server';
import { v } from 'convex/values';
import { requireUser } from './lib/auth';
import { api } from './_generated/api';
import { Id } from './_generated/dataModel';

// ── Queue a render job ────────────────────────────────────────────────────
export const queue = mutation({
  args: { projectId: v.id('projects') },
  handler: async (ctx, { projectId }) => {
    const userId = await requireUser(ctx);
    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== userId) throw new Error('Not found');

    // Check: only 1 concurrent render per user
    const activeRender = await ctx.db
      .query('renders')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) =>
        q.or(
          q.eq(q.field('status'), 'queued'),
          q.eq(q.field('status'), 'processing'),
        ),
      )
      .first();

    if (activeRender) {
      throw new Error('You already have a render in progress');
    }

    // Get latest editing plan
    const plan = await ctx.db
      .query('editingPlans')
      .withIndex('by_project', (q) => q.eq('projectId', projectId))
      .order('desc')
      .first();

    if (!plan) throw new Error('No editing plan found');

    const renderId = await ctx.db.insert('renders', {
      projectId,
      editingPlanId: plan._id,
      userId,
      status: 'queued',
      progress: 0,
    });

    // Update project status
    await ctx.db.patch(projectId, { status: 'rendering', updatedAt: Date.now() });

    // Schedule the action that calls the worker HTTP endpoint
    await ctx.scheduler.runAfter(0, api.renders.dispatchToWorker, {
      renderId,
    });

    return renderId;
  },
});

// ── Dispatch render to the Docker worker via HTTP ─────────────────────────
export const dispatchToWorker = action({
  args: { renderId: v.id('renders') },
  handler: async (ctx, { renderId }) => {
    const render = await ctx.runQuery(api.renders.get, { renderId });
    if (!render) throw new Error('Render not found');

    const plan = await ctx.runQuery(api.editingPlans.getCurrent, {
      projectId: render.projectId,
    });

    if (!plan) throw new Error('No editing plan');

    // Build mediaUrls map
    const mediaItems = await ctx.runQuery(api.media.list, {
      projectId: render.projectId,
    });

    const mediaUrls: Record<string, string> = {};
    for (const item of mediaItems) {
      if (item.storageId) {
        const url = await ctx.storage.getUrl(item.storageId);
        if (url) mediaUrls[item._id] = url;
      } else if (item.publicUrl) {
        mediaUrls[item._id] = item.publicUrl;
      }
    }

    // Get music URL if specified
    let musicUrl: string | undefined;
    const editingPlan = plan.plan as Record<string, unknown>;
    const audio = editingPlan['audio'] as Record<string, unknown> | undefined;

    if (audio?.musicTrackId) {
      const track = await ctx.runQuery(api.music.getById, {
        id: audio.musicTrackId as Id<'musicTracks'>,
      });
      if (track) musicUrl = track.publicUrl;
    }

    const workerUrl = process.env['CONVEX_WORKER_URL'];
    const workerSecret = process.env['WORKER_SECRET'];

    if (!workerUrl || !workerSecret) {
      // In dev mode without worker, mark as error
      await ctx.runMutation(api.renders.updateProgress, {
        renderId,
        progress: 0,
        stage: 'done',
        errorMessage: 'Worker not configured (set CONVEX_WORKER_URL)',
      });
      return;
    }

    // Notify the Docker worker
    const response = await fetch(`${workerUrl}/render`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-worker-secret': workerSecret,
      },
      body: JSON.stringify({
        renderId,
        projectId: render.projectId,
        editingPlan: plan.plan,
        mediaUrls,
        musicUrl,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      await ctx.runMutation(api.renders.updateProgress, {
        renderId,
        progress: 0,
        stage: 'done',
        errorMessage: `Worker error: ${errorText}`,
      });
    }
  },
});

// ── Get render status (reactive — Convex auto-updates clients) ────────────
export const get = query({
  args: { renderId: v.id('renders') },
  handler: async (ctx, { renderId }) => {
    const userId = await requireUser(ctx);
    const render = await ctx.db.get(renderId);
    if (!render || render.userId !== userId) return null;
    return render;
  },
});

// ── List renders for a project ────────────────────────────────────────────
export const listForProject = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, { projectId }) => {
    const userId = await requireUser(ctx);
    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== userId) return [];

    return ctx.db
      .query('renders')
      .withIndex('by_project', (q) => q.eq('projectId', projectId))
      .order('desc')
      .collect();
  },
});

// ── Worker calls this to update progress ──────────────────────────────────
// This is also called from the HTTP action endpoint
export const updateProgress = mutation({
  args: {
    renderId: v.id('renders'),
    progress: v.number(),
    stage: v.string(),
    errorMessage: v.optional(v.string()),
    outputStorageId: v.optional(v.id('_storage')),
  },
  handler: async (ctx, args) => {
    const render = await ctx.db.get(args.renderId);
    if (!render) throw new Error('Render not found');

    const isComplete = args.progress === 100 || args.stage === 'done';
    const isError = !!args.errorMessage;

    const updates: Partial<{
      progress: number;
      stage: string;
      status: 'queued' | 'processing' | 'done' | 'error';
      errorMessage: string;
      outputStorageId: string;
      outputUrl: string;
      startedAt: number;
      completedAt: number;
    }> = {
      progress: args.progress,
      stage: args.stage,
    };

    if (isError) {
      await ctx.db.patch(args.renderId, {
        progress: args.progress,
        stage: args.stage,
        status: 'error',
        errorMessage: args.errorMessage,
        completedAt: Date.now(),
      });
    } else if (isComplete && args.outputStorageId) {
      const outputUrl = (await ctx.storage.getUrl(args.outputStorageId)) ?? undefined;
      await ctx.db.patch(args.renderId, {
        progress: 100,
        stage: 'done',
        status: 'done',
        outputStorageId: args.outputStorageId,
        outputUrl,
        completedAt: Date.now(),
      });
    } else {
      await ctx.db.patch(args.renderId, {
        progress: args.progress,
        stage: args.stage,
        status: args.progress > 0 ? 'processing' : 'queued',
        startedAt: render.startedAt ?? Date.now(),
      });
    }

    // Update project status
    if (isError) {
      await ctx.db.patch(render.projectId, { status: 'error', updatedAt: Date.now() });
    } else if (isComplete) {
      await ctx.db.patch(render.projectId, { status: 'done', updatedAt: Date.now() });
    }
  },
});

// ── Get signed download URL for completed render ──────────────────────────
export const getDownloadUrl = query({
  args: { renderId: v.id('renders') },
  handler: async (ctx, { renderId }) => {
    const userId = await requireUser(ctx);
    const render = await ctx.db.get(renderId);
    if (!render || render.userId !== userId) return null;
    if (!render.outputStorageId) return render.outputUrl ?? null;
    return ctx.storage.getUrl(render.outputStorageId);
  },
});

// ── Worker polls this to pick up queued jobs ──────────────────────────────
export const getPendingForWorker = query({
  args: {},
  handler: async (ctx) => {
    // No auth required — validated by WORKER_SECRET in HTTP layer
    return ctx.db
      .query('renders')
      .withIndex('by_status', (q) => q.eq('status', 'queued'))
      .take(5);
  },
});
