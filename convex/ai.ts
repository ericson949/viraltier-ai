import { action, mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { api } from './_generated/api';
import { Id } from './_generated/dataModel';
import type { VideoAnalysisResult, EditingPlan, RankingItem } from '@viraltier/types';

const OPENROUTER_BASE_URL =
  process.env['OPENROUTER_API_KEY_BASE'] ??
  process.env['OPENROUTER_BASE_URL'] ??
  'https://openrouter.ai/api/v1';

/** Call OpenRouter with any OpenAI-compatible payload */
async function callOpenRouter(payload: Record<string, unknown>): Promise<unknown> {
  const apiKey = process.env['OPENROUTER_API_KEY'];
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured');

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://viraltier.ai',
      'X-Title': 'viralTier.ai',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${err}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0]?.message.content;
}

// ── Store analysis mutation ───────────────────────────────────────────────
export const storeAnalysis = mutation({
  args: {
    mediaItemId: v.id('mediaItems'),
    result: v.any(),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert('aiAnalyses', {
      mediaItemId: args.mediaItemId,
      result: args.result,
      model: args.model,
    });
  },
});

// ── Get analysis query ───────────────────────────────────────────────────
export const getAnalysis = query({
  args: { mediaItemId: v.id('mediaItems') },
  handler: async (ctx, { mediaItemId }) => {
    const analysis = await ctx.db
      .query('aiAnalyses')
      .withIndex('by_media', (q) => q.eq('mediaItemId', mediaItemId))
      .first();
    return (analysis?.result as VideoAnalysisResult) ?? null;
  },
});

// ── Analyze a video media item (keyframe-based via GPT-4o Vision) ─────────
export const analyzeVideo = action({
  args: {
    mediaItemId: v.id('mediaItems'),
    projectId: v.id('projects'),
  },
  handler: async (ctx, { mediaItemId, projectId }) => {
    // Get the media URL
    const url: string | null = await ctx.runQuery(api.media.getUrl, { mediaItemId });
    if (!url) throw new Error('Media not found or no URL');

    // Debit credits before calling AI
    await ctx.runMutation(api.credits.debit, {
      amount: 3,
      reason: 'Best moment detection',
      projectId,
    });

    const ANALYSIS_PROMPT = `You are analyzing a short video clip for social media content creation.
Analyze the visual content and return a JSON object with:
{
  "contentType": "fail | sports | food | animal | reaction | other",
  "facesDetected": boolean,
  "speechDetected": boolean,
  "actionLevel": "low | medium | high",
  "qualityScore": number (0-100),
  "interestingMoments": [
    { "startSeconds": number, "endSeconds": number, "reason": string }
  ],
  "suggestedClipDuration": number (ideal clip length in seconds, 2-6)
}
Return ONLY valid JSON, no markdown, no explanation.`;

    let result: VideoAnalysisResult;

    try {
      const content = await callOpenRouter({
        model: 'openai/gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: ANALYSIS_PROMPT },
              {
                type: 'image_url',
                image_url: {
                  url,
                  detail: 'low', // save tokens
                },
              },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.1,
      });

      result = JSON.parse(content as string) as VideoAnalysisResult;
    } catch {
      // Fallback result if AI fails
      result = {
        contentType: 'other',
        facesDetected: false,
        speechDetected: false,
        actionLevel: 'medium',
        qualityScore: 50,
        interestingMoments: [{ startSeconds: 0, endSeconds: 4, reason: 'Default clip' }],
        suggestedClipDuration: 4,
      };
    }

    // Store analysis result
    // Cast API reference to break circular inference loop on initial push
    const storeFn = (api.ai as Record<string, unknown>)['storeAnalysis'] as Parameters<typeof ctx.runMutation>[0];
    const analysisId = (await ctx.runMutation(storeFn, {
      mediaItemId,
      result,
      model: 'openai/gpt-4o',
    })) as Id<'aiAnalyses'>;

    return { analysisId, result };
  },
});

// ── Generate titles for all items in the editing plan ────────────────────
export const generateTitles = action({
  args: {
    projectId: v.id('projects'),
    overallTitle: v.string(),
  },
  handler: async (ctx, { projectId, overallTitle }) => {
    const plan = await ctx.runQuery(api.editingPlans.getCurrent, { projectId });
    if (!plan) throw new Error('No editing plan');

    const editingPlan = plan.plan as EditingPlan;
    const items = editingPlan.items.filter((i) => i.included);

    // Debit 1 credit per item
    await ctx.runMutation(api.credits.debit, {
      amount: items.length,
      reason: `Title generation for ${items.length} clips`,
      projectId,
    });

    const TITLE_PROMPT = (contentType: string, actionLevel: string) =>
      `Generate a short, engaging title for a social media ranking video item.
Context: The overall video is titled "${overallTitle}".
This clip shows: ${contentType}, action level: ${actionLevel}.
Rules:
- Max 30 characters
- Funny and engaging
- Can include 1 emoji
- No hashtags
Return ONLY the title text, nothing else.`;

    const updatedItems: RankingItem[] = [];
    const getAnalysisFn = (api.ai as Record<string, unknown>)['getAnalysis'] as Parameters<typeof ctx.runQuery>[0];

    for (const item of editingPlan.items) {
      if (!item.included) {
        updatedItems.push(item);
        continue;
      }

      // Get analysis for this item
      const analysis = (await ctx.runQuery(
        getAnalysisFn,
        { mediaItemId: item.mediaItemId as Id<'mediaItems'> },
      )) as VideoAnalysisResult | null;

      const contentType = analysis?.contentType ?? 'other';
      const actionLevel = analysis?.actionLevel ?? 'medium';

      try {
        const title = await callOpenRouter({
          model: 'openai/gpt-4o-mini',
          messages: [
            { role: 'user', content: TITLE_PROMPT(contentType, actionLevel) },
          ],
          max_tokens: 50,
          temperature: 0.7,
        });

        updatedItems.push({
          ...item,
          title: (title as string).trim().slice(0, 30),
          aiGenerated: { ...item.aiGenerated, title: true, startTime: false, endTime: false },
        });
      } catch {
        updatedItems.push(item);
      }
    }

    // Save updated plan
    const updatedPlan: EditingPlan = { ...editingPlan, items: updatedItems };
    await ctx.runMutation(api.editingPlans.updateCurrent, {
      projectId,
      plan: updatedPlan,
    });

    return updatedItems;
  },
});

// ── Auto-select music for a project ──────────────────────────────────────
export const selectMusic = action({
  args: { projectId: v.id('projects') },
  handler: async (ctx, { projectId }) => {
    const plan = await ctx.runQuery(api.editingPlans.getCurrent, { projectId });
    if (!plan) throw new Error('No editing plan');

    // Debit 1 credit
    await ctx.runMutation(api.credits.debit, {
      amount: 1,
      reason: 'Music auto-selection',
      projectId,
    });

    const editingPlan = plan.plan as EditingPlan;
    const tracks = (await ctx.runQuery(api.music.list, {})) as Array<{
      _id: string;
      mood: Array<'energetic' | 'chill' | 'funny' | 'dramatic' | 'upbeat'>;
    }>;

    if (tracks.length === 0) return null;

    const energyMoods = ['energetic', 'upbeat'];
    const energeticTracks = tracks.filter((t) =>
      t.mood.some((m) => energyMoods.includes(m)),
    );

    const selected = energeticTracks[0] ?? tracks[0];
    if (!selected) return null;

    const updatedPlan: EditingPlan = {
      ...editingPlan,
      audio: {
        ...editingPlan.audio,
        musicTrackId: selected._id,
        musicAutoSelected: true,
      },
    };

    await ctx.runMutation(api.editingPlans.updateCurrent, {
      projectId,
      plan: updatedPlan,
    });

    return selected;
  },
});
