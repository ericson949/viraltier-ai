import { query, mutation, action } from './_generated/server';
import { api } from './_generated/api';
import { v } from 'convex/values';
import { requireUser } from './lib/auth';
import type { Id } from './_generated/dataModel';

// ── Generate a signed upload URL (direct client → Convex Storage upload) ──
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    return ctx.storage.generateUploadUrl();
  },
});

// ── Register a media item after client uploads to Convex Storage ──────────
export const register = mutation({
  args: {
    projectId: v.id('projects'),
    storageId: v.id('_storage'),
    originalFilename: v.string(),
    type: v.union(v.literal('video'), v.literal('audio'), v.literal('image')),
    duration: v.optional(v.number()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) throw new Error('Project not found');

    // Check 20-video limit
    const existing = await ctx.db
      .query('mediaItems')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .filter((q) => q.eq(q.field('type'), 'video'))
      .collect();

    if (args.type === 'video' && existing.length >= 20) {
      throw new Error('Maximum 20 videos per project');
    }

    const publicUrl = await ctx.storage.getUrl(args.storageId);

    const mediaItemId = await ctx.db.insert('mediaItems', {
      projectId: args.projectId,
      userId,
      type: args.type,
      originalFilename: args.originalFilename,
      storageId: args.storageId,
      publicUrl: publicUrl ?? undefined,
      duration: args.duration,
      width: args.width,
      height: args.height,
      uploadStatus: 'uploaded',
    });

    return { mediaItemId, publicUrl };
  },
});

// ── List media items for a project ────────────────────────────────────────
export const list = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, { projectId }) => {
    const userId = await requireUser(ctx);
    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== userId) return [];

    return ctx.db
      .query('mediaItems')
      .withIndex('by_project', (q) => q.eq('projectId', projectId))
      .collect();
  },
});

// ── Get URL for a media item ──────────────────────────────────────────────
export const getUrl = query({
  args: { mediaItemId: v.id('mediaItems') },
  handler: async (ctx, { mediaItemId }) => {
    const userId = await requireUser(ctx);
    const item = await ctx.db.get(mediaItemId);
    if (!item || item.userId !== userId) return null;

    if (!item.storageId) return item.publicUrl ?? null;
    return ctx.storage.getUrl(item.storageId);
  },
});

// ── Remove a media item ───────────────────────────────────────────────────
export const remove = mutation({
  args: { mediaItemId: v.id('mediaItems') },
  handler: async (ctx, { mediaItemId }) => {
    const userId = await requireUser(ctx);
    const item = await ctx.db.get(mediaItemId);
    if (!item || item.userId !== userId) throw new Error('Not found');

    if (item.storageId) await ctx.storage.delete(item.storageId);
    if (item.thumbnailStorageId) await ctx.storage.delete(item.thumbnailStorageId);

    await ctx.db.delete(mediaItemId);
    return { success: true };
  },
});

// ── Register media via external URL (paste URL flow) ─────────────────────
export const registerUrl = mutation({
  args: {
    projectId: v.id('projects'),
    publicUrl: v.string(),
    originalFilename: v.string(),
    type: v.union(v.literal('video'), v.literal('audio'), v.literal('image')),
    duration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) throw new Error('Project not found');

    const mediaItemId = await ctx.db.insert('mediaItems', {
      projectId: args.projectId,
      userId,
      type: args.type,
      originalFilename: args.originalFilename,
      publicUrl: args.publicUrl,
      duration: args.duration ?? 15,
      uploadStatus: 'uploaded',
    });

    return { mediaItemId, publicUrl: args.publicUrl };
  },
});

// ── Action to resolve YouTube / TikTok / Social URLs to HD direct MP4 streams ──
export const downloadAndRegisterUrl = action({
  args: {
    projectId: v.id('projects'),
    url: v.string(),
  },
  handler: async (ctx, args): Promise<{ mediaItemId: Id<'mediaItems'>; publicUrl: string }> => {
    const rawUrl = args.url.trim();
    if (!rawUrl) throw new Error('URL is required');

    let directMp4Url = rawUrl;
    let title = rawUrl.split('/').pop()?.split('?')[0] || 'social_video.mp4';

    // If social media URL (YouTube, TikTok, Shorts, Instagram, Twitter)
    const isSocial = /youtube\.com|youtu\.be|tiktok\.com|instagram\.com|twitter\.com|x\.com/.test(rawUrl);

    if (isSocial) {
      try {
        const cobaltRes = await fetch('https://api.cobalt.tools/api/json', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'viralTier/1.0',
          },
          body: JSON.stringify({
            url: rawUrl,
            videoQuality: '1080',
          }),
        });

        if (cobaltRes.ok) {
          const data = await cobaltRes.json() as { status?: string; url?: string; filename?: string };
          if ((data.status === 'stream' || data.status === 'redirect') && data.url) {
            directMp4Url = data.url;
            if (data.filename) title = data.filename;
          }
        }
      } catch (err) {
        console.warn('Cobalt API resolution failed, falling back to direct URL:', err);
      }
    }

    // Register resolved HD direct MP4 in Convex DB
    const res = await ctx.runMutation(api.media.registerUrl, {
      projectId: args.projectId,
      publicUrl: directMp4Url,
      originalFilename: title.endsWith('.mp4') ? title : `${title}.mp4`,
      type: 'video',
    });

    return res;
  },
});
