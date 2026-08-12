import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { requireUser } from './lib/auth';

// ── Get the current (latest) editing plan for a project ───────────────────
export const getCurrent = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, { projectId }) => {
    const userId = await requireUser(ctx);
    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== userId) return null;

    return ctx.db
      .query('editingPlans')
      .withIndex('by_project', (q) => q.eq('projectId', projectId))
      .order('desc')
      .first();
  },
});

// ── Get all plan versions for a project ───────────────────────────────────
export const listVersions = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, { projectId }) => {
    const userId = await requireUser(ctx);
    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== userId) return [];

    return ctx.db
      .query('editingPlans')
      .withIndex('by_project', (q) => q.eq('projectId', projectId))
      .order('desc')
      .collect();
  },
});

// ── Save / auto-save the editing plan (creates a new version) ─────────────
export const save = mutation({
  args: {
    projectId: v.id('projects'),
    plan: v.any(), // EditingPlan JSON
    createdBy: v.optional(v.union(v.literal('user'), v.literal('ai'))),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) throw new Error('Not found');

    // Get current version number
    const latest = await ctx.db
      .query('editingPlans')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .order('desc')
      .first();

    const version = (latest?.version ?? 0) + 1;

    const planId = await ctx.db.insert('editingPlans', {
      projectId: args.projectId,
      plan: args.plan,
      version,
      createdBy: args.createdBy ?? 'user',
    });

    // Update project updatedAt
    await ctx.db.patch(args.projectId, { updatedAt: Date.now() });

    return { planId, version };
  },
});

// ── Overwrite the current plan in-place (for auto-save without versioning) ─
export const updateCurrent = mutation({
  args: {
    projectId: v.id('projects'),
    plan: v.any(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) throw new Error('Not found');

    const latest = await ctx.db
      .query('editingPlans')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .order('desc')
      .first();

    if (latest) {
      await ctx.db.patch(latest._id, { plan: args.plan });
    } else {
      await ctx.db.insert('editingPlans', {
        projectId: args.projectId,
        plan: args.plan,
        version: 1,
        createdBy: 'user',
      });
    }

    await ctx.db.patch(args.projectId, { updatedAt: Date.now() });
    return { success: true };
  },
});
