'use client';

import { useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id, Doc } from '@/convex/_generated/dataModel';
import type { EditingPlan, RankingItem, RankingStyle } from '@viraltier/types';
import { CREDIT_COSTS } from '@viraltier/types';
import { SortableRankingItemRow } from './SortableRankingItemRow';

interface Props {
  plan: EditingPlan;
  mediaItems: Doc<'mediaItems'>[];
  projectId: Id<'projects'>;
  projectMode: 'ai' | 'assisted';
  onPlanChange: (plan: EditingPlan) => void;
}

export function AutoRankingEditor({ plan, mediaItems, projectId, projectMode, onPlanChange }: Props) {
  const [runningAI, setRunningAI] = useState(false);
  const analyzeVideo = useAction(api.ai.analyzeVideo);
  const generateTitles = useAction(api.ai.generateTitles);

  const creditCost = mediaItems.length * CREDIT_COSTS.BEST_MOMENT_DETECTION + mediaItems.length * CREDIT_COSTS.TITLE_GENERATION;

  async function handleRunAI() {
    if (mediaItems.length === 0) return;
    setRunningAI(true);

    try {
      for (const item of mediaItems) {
        await analyzeVideo({ mediaItemId: item._id, projectId });
      }

      await generateTitles({
        projectId,
        overallTitle: plan.titleOverlay.text || 'Ranking Video',
      });
    } catch (err: unknown) {
      console.error('AI Error:', err);
    } finally {
      setRunningAI(false);
    }
  }

  function handleItemChange(itemId: string, updates: Partial<RankingItem>) {
    const updatedItems = plan.items.map((item) =>
      item.id === itemId ? { ...item, ...updates } : item,
    );
    onPlanChange({ ...plan, items: updatedItems });
  }

  return (
    <div className="space-y-6">
      {/* Mode Badge & AI Trigger */}
      <div className="flex items-center justify-between">
        <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium">
          {projectMode === 'ai' ? '🤖 Full AI Automation' : '🧠 Assisted AI Mode'}
        </span>

        {mediaItems.length > 0 && (
          <button
            onClick={handleRunAI}
            disabled={runningAI}
            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            <span>{runningAI ? '🤖 Analyzing Vision...' : '✨ Run AI Vision & Auto-Title'}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20">
              ~{creditCost} cr
            </span>
          </button>
        )}
      </div>

      {/* Items list */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-sm">
            AI Ranked Items ({plan.items.filter((i) => i.included).length} clips)
          </h3>
        </div>

        <div className="divide-y border-border">
          {plan.items.map((item) => {
            const media = mediaItems.find((m) => m._id === item.mediaItemId);
            return (
              <SortableRankingItemRow
                key={item.id}
                item={item}
                media={media}
                rankingStyle={plan.rankingStyle.type}
                onChange={(updates) => handleItemChange(item.id, updates)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
