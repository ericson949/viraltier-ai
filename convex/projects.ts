import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { requireUser } from './lib/auth';

// ── List all projects for the authenticated user ───────────────────────────
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    return ctx.db
      .query('projects')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .collect();
  },
});

// ── Get a single project (with ownership check) ───────────────────────────
export const get = query({
  args: { id: v.id('projects') },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const project = await ctx.db.get(id);
    if (!project || project.userId !== userId) return null;
    return project;
  },
});

// ── Create a new project ──────────────────────────────────────────────────
export const create = mutation({
  args: {
    name: v.string(),
    mode: v.union(v.literal('ai'), v.literal('assisted'), v.literal('manual')),
    assistedConfig: v.optional(
      v.object({
        detectBestMoments: v.boolean(),
        generateTitles: v.boolean(),
        selectMusic: v.boolean(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const now = Date.now();

    const projectId = await ctx.db.insert('projects', {
      userId,
      name: args.name,
      template: 'ranking',
      status: 'draft',
      mode: args.mode,
      assistedConfig: args.assistedConfig,
      updatedAt: now,
    });

    // Seed default editing plan
    await ctx.db.insert('editingPlans', {
      projectId,
      version: 1,
      createdBy: 'user',
      plan: {
        template: 'ranking',
        title: args.name,
        aspectRatio: '9:16',
        targetDuration: 0,
        rankingStyle: { type: 'emoji' },
        items: [],
        displayOrder: [],
        displayOrderMode: 'countdown',
        audio: {
          musicVolume: 0.25,
        },
        effects: {
          autoZoom: true,
          transitions: true,
          soundEffects: true,
        },
        titleOverlay: {
          text: args.name,
          position: 'top',
          style: 'default',
        },
      },
    });

    return projectId;
  },
});

// ── Update project metadata ───────────────────────────────────────────────
export const update = mutation({
  args: {
    id: v.id('projects'),
    name: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal('draft'),
        v.literal('ready'),
        v.literal('rendering'),
        v.literal('done'),
        v.literal('error'),
      ),
    ),
  },
  handler: async (ctx, { id, ...updates }) => {
    const userId = await requireUser(ctx);
    const project = await ctx.db.get(id);
    if (!project || project.userId !== userId) throw new Error('Not found');

    await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });
    return id;
  },
});

// ── Delete a project (cascades via Convex) ────────────────────────────────
export const remove = mutation({
  args: { id: v.id('projects') },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const project = await ctx.db.get(id);
    if (!project || project.userId !== userId) throw new Error('Not found');

    // Delete child records
    const mediaItems = await ctx.db
      .query('mediaItems')
      .withIndex('by_project', (q) => q.eq('projectId', id))
      .collect();
    for (const item of mediaItems) {
      if (item.storageId) await ctx.storage.delete(item.storageId);
      await ctx.db.delete(item._id);
    }

    const plans = await ctx.db
      .query('editingPlans')
      .withIndex('by_project', (q) => q.eq('projectId', id))
      .collect();
    for (const plan of plans) await ctx.db.delete(plan._id);

    const renders = await ctx.db
      .query('renders')
      .withIndex('by_project', (q) => q.eq('projectId', id))
      .collect();
    for (const render of renders) {
      if (render.outputStorageId) await ctx.storage.delete(render.outputStorageId);
      await ctx.db.delete(render._id);
    }

    await ctx.db.delete(id);
    return { success: true };
  },
});

// ── Duplicate a project ───────────────────────────────────────────────────
export const duplicate = mutation({
  args: { id: v.id('projects') },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const original = await ctx.db.get(id);
    if (!original || original.userId !== userId) throw new Error('Not found');

    const now = Date.now();
    const newProjectId = await ctx.db.insert('projects', {
      userId,
      name: `${original.name} (copy)`,
      template: original.template,
      status: 'draft',
      mode: original.mode,
      assistedConfig: original.assistedConfig,
      updatedAt: now,
    });

    // Copy the latest editing plan
    const plans = await ctx.db
      .query('editingPlans')
      .withIndex('by_project', (q) => q.eq('projectId', id))
      .order('desc')
      .first();

    if (plans) {
      await ctx.db.insert('editingPlans', {
        projectId: newProjectId,
        plan: plans.plan,
        version: 1,
        createdBy: plans.createdBy,
      });
    }

    return newProjectId;
  },
});
