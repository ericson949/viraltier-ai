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
import type { Id, Doc } from '@/convex/_generated/dataModel';
import type { EditingPlan, RankingItem, RankingStyle, DisplayOrderMode } from '@viraltier/types';
import { SortableRankingItemRow } from './SortableRankingItemRow';

interface Props {
  plan: EditingPlan;
  mediaItems: Doc<'mediaItems'>[];
  projectId: Id<'projects'>;
  onPlanChange: (plan: EditingPlan) => void;
}

const RANKING_STYLES: { id: RankingStyle; label: string; preview: string }[] = [
  { id: 'numeric', label: '#1 #2 #3', preview: '#1' },
  { id: 'ordinal', label: '1st 2nd 3rd', preview: '1st' },
  { id: 'emoji', label: '🥇 🥈 🥉', preview: '🥇' },
];

const DISPLAY_MODES: { id: DisplayOrderMode; label: string; desc: string }[] = [
  { id: 'countdown', label: 'Countdown ↓', desc: 'Reveal from lowest rank to #1' },
  { id: 'sequential', label: 'Sequential ↑', desc: 'Show from #1 to last rank' },
  { id: 'custom', label: 'Custom', desc: 'Drag items to set custom order' },
];

function computeDisplayOrder(items: RankingItem[], mode: DisplayOrderMode): number[] {
  const ranks = items.filter((i) => i.included).map((i) => i.rank);
  if (mode === 'countdown') return [...ranks].sort((a, b) => b - a);
  if (mode === 'sequential') return [...ranks].sort((a, b) => a - b);
  return ranks;
}

export function ManualRankingEditor({ plan, mediaItems, projectId, onPlanChange }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleStyleChange(style: RankingStyle) {
    onPlanChange({ ...plan, rankingStyle: { type: style } });
  }

  function handleDisplayModeChange(mode: DisplayOrderMode) {
    const displayOrder = computeDisplayOrder(plan.items, mode);
    onPlanChange({ ...plan, displayOrderMode: mode, displayOrder });
  }

  function handleItemChange(itemId: string, updates: Partial<RankingItem>) {
    const updatedItems = plan.items.map((item) =>
      item.id === itemId ? { ...item, ...updates } : item,
    );
    const displayOrder = computeDisplayOrder(updatedItems, plan.displayOrderMode);
    onPlanChange({ ...plan, items: updatedItems, displayOrder });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIdx = plan.items.findIndex((i) => i.id === active.id);
    const newIdx = plan.items.findIndex((i) => i.id === over.id);

    const reordered = arrayMove(plan.items, oldIdx, newIdx).map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

    const displayOrder = computeDisplayOrder(reordered, plan.displayOrderMode);
    onPlanChange({ ...plan, items: reordered, displayOrder });
  }

  return (
    <div className="space-y-6">
      {/* Mode Badge */}
      <div className="flex items-center justify-between">
        <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
          ✋ Manual Mode — Full Control
        </span>
        <span className="text-xs text-secondary font-mono">
          {plan.items.filter((i) => i.included).length} clips included
        </span>
      </div>

      {/* Global Video Settings */}
      <div className="glass-card p-5 space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-secondary">
          Overlay & Ranking Style
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium mb-1.5 block text-secondary">
              Main Video Title (Overlay)
            </label>
            <input
              className="input-base text-sm"
              placeholder="Top 5 Funniest Moments..."
              value={plan.titleOverlay.text}
              onChange={(e) =>
                onPlanChange({
                  ...plan,
                  titleOverlay: { ...plan.titleOverlay, text: e.target.value },
                })
              }
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block text-secondary">
              Rank Badge Style
            </label>
            <div className="flex gap-2">
              {RANKING_STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleStyleChange(s.id)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                    plan.rankingStyle.type === s.id
                      ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 border'
                      : 'bg-surface border-border border text-secondary'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Display Order Selector */}
      <div className="glass-card p-5 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-secondary">
          Display & Reveal Order
        </h3>
        <div className="grid md:grid-cols-3 gap-3">
          {DISPLAY_MODES.map((dm) => (
            <button
              key={dm.id}
              onClick={() => handleDisplayModeChange(dm.id)}
              className={`p-3 rounded-xl text-left transition-all ${
                plan.displayOrderMode === dm.id
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 border'
                  : 'bg-surface border-border border text-secondary'
              }`}
            >
              <p className="text-xs font-bold text-white mb-0.5">{dm.label}</p>
              <p className="text-[11px] text-secondary">{dm.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Drag & Drop Ranking Items */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-sm">
            Ranking Items ({plan.items.filter((i) => i.included).length} clips)
          </h3>
          <span className="text-xs text-secondary">Drag handle ≡ to re-rank</span>
        </div>

        {plan.items.length === 0 ? (
          <div className="p-10 text-center text-secondary">
            <p className="text-3xl mb-2">📥</p>
            <p className="text-xs">Upload video clips above to start ranking.</p>
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
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Manual Effects & Audio Controls */}
      <div className="glass-card p-5 space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-secondary">
          Effects & Audio Settings
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border cursor-pointer">
            <input
              type="checkbox"
              checked={plan.effects.autoZoom}
              onChange={(e) =>
                onPlanChange({
                  ...plan,
                  effects: { ...plan.effects, autoZoom: e.target.checked },
                })
              }
              className="accent-purple-500 w-4 h-4"
            />
            <div>
              <p className="text-xs font-semibold text-white">Dynamic Auto-Zoom</p>
              <p className="text-[11px] text-secondary">Subtle motion on static video clips</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border cursor-pointer">
            <input
              type="checkbox"
              checked={plan.effects.transitions}
              onChange={(e) =>
                onPlanChange({
                  ...plan,
                  effects: { ...plan.effects, transitions: e.target.checked },
                })
              }
              className="accent-purple-500 w-4 h-4"
            />
            <div>
              <p className="text-xs font-semibold text-white">Smooth Clip Transitions</p>
              <p className="text-[11px] text-secondary">Fade & slide between clips</p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
