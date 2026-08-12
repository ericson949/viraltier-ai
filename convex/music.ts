import { query } from './_generated/server';
import { v } from 'convex/values';

// ── List music tracks with optional filters ───────────────────────────────
export const list = query({
  args: {
    mood: v.optional(v.string()),
    genre: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { mood, genre, limit = 50 }) => {
    let tracks = await ctx.db.query('musicTracks').collect();

    if (mood) {
      tracks = tracks.filter((t) =>
        t.mood.includes(mood as 'energetic' | 'chill' | 'funny' | 'dramatic' | 'upbeat'),
      );
    }

    if (genre) {
      tracks = tracks.filter((t) => t.genre === genre);
    }

    return tracks.slice(0, limit);
  },
});

// ── Get a single track by ID ──────────────────────────────────────────────
export const getById = query({
  args: { id: v.id('musicTracks') },
  handler: async (ctx, { id }) => {
    return ctx.db.get(id);
  },
});

// ── Search tracks by name ─────────────────────────────────────────────────
export const search = query({
  args: { q: v.string() },
  handler: async (ctx, { q }) => {
    return ctx.db
      .query('musicTracks')
      .withSearchIndex('search_name', (s) => s.search('name', q))
      .take(20);
  },
});
