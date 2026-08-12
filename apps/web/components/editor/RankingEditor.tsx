'use client';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id, Doc } from '@/convex/_generated/dataModel';
import type { EditingPlan, RankingItem, RankingStyle, DisplayOrderMode } from '@viraltier/types';
import { CREDIT_COSTS } from '@viraltier/types';
import { SortableRankingItemRow } from './SortableRankingItemRow';

interface Props {
  plan: EditingPlan;
  mediaItems: Doc<'mediaItems'>[];
  projectId: Id<'projects'>;
  projectMode: 'ai' | 'assisted' | 'manual';
  onPlanChange: (plan: EditingPlan) => void;
}

const RANKING_STYLES: { id: RankingStyle; label: string; preview: string }[] = [
  { id: 'numeric', label: '#1 #2 #3', preview: '#1' },
  { id: 'ordinal', label: '1st 2nd 3rd', preview: '1st' },
  { id: 'emoji', label: '🥇 🥈 🥉', preview: '🥇' },
];

const DISPLAY_MODES: { id: DisplayOrderMode; label: string; desc: string }[] = [
  { id: 'countdown', label: 'Countdown ↓', desc: 'Reveal from lowest rank to #1 (most viral)' },
  { id: 'sequential', label: 'Sequential ↑', desc: 'Show from #1 to last rank' },
  { id: 'custom', label: 'Custom', desc: 'Drag items to set reveal order' },
];

function computeDisplayOrder(items: RankingItem[], mode: DisplayOrderMode): number[] {
  const ranks = items.filter((i) => i.included).map((i) => i.rank);
  if (mode === 'countdown') return [...ranks].sort((a, b) => b - a);
  if (mode === 'sequential') return [...ranks].sort((a, b) => a - b);
  return ranks; // custom — preserve as-is
}

export function RankingEditor({ plan, mediaItems, projectId, projectMode, onPlanChange }: Props) {
  const [runningAI, setRunningAI] = useState(false);
  const analyzeVideo = useAction(api.ai.analyzeVideo);
  const generateTitles = useAction(api.ai.generateTitles);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function updatePlan(updates: Partial<EditingPlan>) {
    onPlanChange({ ...plan, ...updates });
  }

  function handleItemChange(itemId: string, updates: Partial<RankingItem>) {
    const updatedItems = plan.items.map((i) =>
      i.id === itemId ? { ...i, ...updates } : i,
    );
    updatePlan({
      items: updatedItems,
      displayOrder: computeDisplayOrder(updatedItems, plan.displayOrderMode),
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = plan.items.findIndex((i) => i.id === active.id);
    const newIndex = plan.items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(plan.items, oldIndex, newIndex).map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));

    updatePlan({
      items: reordered,
      displayOrder: computeDisplayOrder(reordered, plan.displayOrderMode),
    });
  }

  function handleDisplayModeChange(mode: DisplayOrderMode) {
    updatePlan({
      displayOrderMode: mode,
      displayOrder: computeDisplayOrder(plan.items, mode),
    });
  }

  async function handleRunAI() {
    if (runningAI) return;
    setRunningAI(true);
    try {
      for (const item of plan.items) {
        if (!item.included) continue;
        await analyzeVideo({ mediaItemId: item.mediaItemId as Id<'mediaItems'>, projectId });
      }
      await generateTitles({ projectId, overallTitle: plan.title });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'AI analysis failed');
    } finally {
      setRunningAI(false);
    }
  }

  const creditCost =
    plan.items.filter((i) => i.included).length * CREDIT_COSTS.BEST_MOMENT_DETECTION +
    plan.items.filter((i) => i.included).length * CREDIT_COSTS.TITLE_GENERATION;

  return (
    <div className="space-y-6">
      {/* Title & Style row */}
      <div className="glass-card p-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Video Title (overlay)
            </label>
            <input
              id="plan-title"
              className="input-base"
              placeholder="e.g. Ranking Funniest Trash Fails"
              value={plan.titleOverlay.text}
              onChange={(e) =>
                updatePlan({
                  titleOverlay: { ...plan.titleOverlay, text: e.target.value },
                  title: e.target.value,
                })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Ranking Style
            </label>
            <div className="flex gap-2">
              {RANKING_STYLES.map((s) => (
                <button
                  key={s.id}
                  id={`style-${s.id}`}
                  onClick={() => updatePlan({ rankingStyle: { type: s.id } })}
                  className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: plan.rankingStyle.type === s.id ? 'rgba(124,58,237,0.2)' : 'var(--surface)',
                    border: `1px solid ${plan.rankingStyle.type === s.id ? 'rgba(124,58,237,0.5)' : 'var(--border)'}`,
                    color: plan.rankingStyle.type === s.id ? '#a855f7' : 'var(--text-secondary)',
                  }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Display order */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
          DISPLAY ORDER
        </h3>
        <div className="flex gap-2 flex-wrap">
          {DISPLAY_MODES.map((dm) => (
            <button
              key={dm.id}
              id={`display-mode-${dm.id}`}
              onClick={() => handleDisplayModeChange(dm.id)}
              title={dm.desc}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: plan.displayOrderMode === dm.id ? 'rgba(124,58,237,0.2)' : 'var(--surface)',
                border: `1px solid ${plan.displayOrderMode === dm.id ? 'rgba(124,58,237,0.5)' : 'var(--border)'}`,
                color: plan.displayOrderMode === dm.id ? '#a855f7' : 'var(--text-secondary)',
              }}>
              {dm.label}
            </button>
          ))}
        </div>
      </div>

      {/* Items list */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="font-semibold">
            Ranking Items ({plan.items.filter((i) => i.included).length} clips)
          </h3>
          {projectMode !== 'manual' && plan.items.length > 0 && (
            <button
              id="run-ai-btn"
              onClick={handleRunAI}
              disabled={runningAI}
              className="btn-secondary text-sm">
              {runningAI ? '🤖 Analyzing...' : `🤖 Run AI Analysis (~${creditCost} credits)`}
            </button>
          )}
        </div>

        {plan.items.length === 0 ? (
          <div className="p-12 text-center" style={{ color: 'var(--text-secondary)' }}>
            <p className="text-3xl mb-3">📭</p>
            <p className="text-sm">Upload videos above to add ranking items.</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={plan.items.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
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
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Effects */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>
          EFFECTS
        </h3>
        <div className="flex gap-6">
          {[
            { key: 'autoZoom' as const, label: '⚡ Auto Zoom' },
            { key: 'transitions' as const, label: '✨ Transitions' },
            { key: 'soundEffects' as const, label: '🔊 Sound FX' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={plan.effects[key]}
                onChange={(e) =>
                  updatePlan({ effects: { ...plan.effects, [key]: e.target.checked } })
                }
                style={{ accentColor: '#a855f7', width: 16, height: 16 }}
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
