import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { authTables } from '@convex-dev/auth/server';

export default defineSchema({
  ...authTables,

  // ── Projects ─────────────────────────────────────────────────────────────
  projects: defineTable({
    userId: v.string(), // from Convex Auth identity
    name: v.string(),
    template: v.literal('ranking'),
    status: v.union(
      v.literal('draft'),
      v.literal('ready'),
      v.literal('rendering'),
      v.literal('done'),
      v.literal('error'),
    ),
    mode: v.union(v.literal('ai'), v.literal('assisted'), v.literal('manual')),
    assistedConfig: v.optional(
      v.object({
        detectBestMoments: v.boolean(),
        generateTitles: v.boolean(),
        selectMusic: v.boolean(),
      }),
    ),
    updatedAt: v.number(), // Unix timestamp ms
  })
    .index('by_user', ['userId'])
    .index('by_user_status', ['userId', 'status']),

  // ── Media Items ───────────────────────────────────────────────────────────
  mediaItems: defineTable({
    projectId: v.id('projects'),
    userId: v.string(),
    type: v.union(v.literal('video'), v.literal('audio'), v.literal('image')),
    originalFilename: v.string(),
    storageId: v.optional(v.id('_storage')), // Convex Storage file
    publicUrl: v.optional(v.string()),
    duration: v.optional(v.number()), // seconds
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    thumbnailStorageId: v.optional(v.id('_storage')),
    metadata: v.optional(v.any()),
    uploadStatus: v.union(
      v.literal('pending'),
      v.literal('uploaded'),
      v.literal('error'),
    ),
  })
    .index('by_project', ['projectId'])
    .index('by_user', ['userId']),

  // ── Editing Plans ─────────────────────────────────────────────────────────
  editingPlans: defineTable({
    projectId: v.id('projects'),
    plan: v.any(), // EditingPlan JSON
    version: v.number(),
    createdBy: v.union(v.literal('user'), v.literal('ai')),
  })
    .index('by_project', ['projectId'])
    .index('by_project_version', ['projectId', 'version']),

  // ── Renders ───────────────────────────────────────────────────────────────
  renders: defineTable({
    projectId: v.id('projects'),
    editingPlanId: v.id('editingPlans'),
    userId: v.string(),
    status: v.union(
      v.literal('queued'),
      v.literal('processing'),
      v.literal('done'),
      v.literal('error'),
    ),
    progress: v.number(), // 0–100
    stage: v.optional(v.string()),
    outputStorageId: v.optional(v.id('_storage')),
    outputUrl: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index('by_project', ['projectId'])
    .index('by_user', ['userId'])
    .index('by_status', ['status']),

  // ── AI Analyses ───────────────────────────────────────────────────────────
  aiAnalyses: defineTable({
    mediaItemId: v.id('mediaItems'),
    result: v.any(), // VideoAnalysisResult JSON
    model: v.optional(v.string()),
  }).index('by_media', ['mediaItemId']),

  // ── Credits ───────────────────────────────────────────────────────────────
  credits: defineTable({
    userId: v.string(),
    balance: v.number(),
    updatedAt: v.number(),
  }).index('by_user', ['userId']),

  // ── Credit Transactions ───────────────────────────────────────────────────
  creditTransactions: defineTable({
    userId: v.string(),
    amount: v.number(), // positive = credit, negative = debit
    reason: v.string(),
    projectId: v.optional(v.id('projects')),
  }).index('by_user', ['userId']),

  // ── Music Tracks ──────────────────────────────────────────────────────────
  musicTracks: defineTable({
    name: v.string(),
    artist: v.optional(v.string()),
    storageId: v.optional(v.id('_storage')),
    publicUrl: v.string(),
    duration: v.optional(v.number()),
    bpm: v.optional(v.number()),
    mood: v.array(
      v.union(
        v.literal('energetic'),
        v.literal('chill'),
        v.literal('funny'),
        v.literal('dramatic'),
        v.literal('upbeat'),
      ),
    ),
    genre: v.optional(v.string()),
  })
    .index('by_genre', ['genre'])
    .searchIndex('search_name', { searchField: 'name' }),
});
