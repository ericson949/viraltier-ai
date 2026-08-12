'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import type { Doc } from '@/convex/_generated/dataModel';
import type { RankingItem, RankingStyle, TransitionType } from '@viraltier/types';
import { TrimSlider } from './TrimSlider';

interface Props {
  item: RankingItem;
  media?: Doc<'mediaItems'>;
  rankingStyle: RankingStyle;
  onChange: (updates: Partial<RankingItem>) => void;
}

function RankBadge({ rank, style }: { rank: number; style: RankingStyle }) {
  if (style === 'emoji') {
    const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
    return (
      <div className={rank <= 3 ? 'rank-badge-' + rank as 'rank-badge-1' | 'rank-badge-2' | 'rank-badge-3' : 'rank-badge-default'}>
        {medals[rank] ?? `#${rank}`}
      </div>
    );
  }
  if (style === 'ordinal') {
    const suffix = rank === 1 ? 'st' : rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th';
    return <div className={rank <= 3 ? `rank-badge-${rank}` as 'rank-badge-1' | 'rank-badge-2' | 'rank-badge-3' : 'rank-badge-default'}>{rank}{suffix}</div>;
  }
  return <div className={rank <= 3 ? `rank-badge-${rank}` as 'rank-badge-1' | 'rank-badge-2' | 'rank-badge-3' : 'rank-badge-default'}>#{rank}</div>;
}

const TRANSITIONS: TransitionType[] = ['cut', 'fade', 'slide', 'zoom'];

export function SortableRankingItemRow({ item, media, rankingStyle, onChange }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const [expanded, setExpanded] = useState(true);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="px-5 py-4" style={{
        background: !item.included ? 'rgba(0,0,0,0.2)' : undefined,
        opacity: !item.included ? 0.6 : 1,
      }}>
        <div className="flex items-center gap-4">
          {/* Drag handle */}
          <div className="drag-handle flex-shrink-0 cursor-grab" {...attributes} {...listeners}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 5h2v2H9V5zm0 4h2v2H9V9zm0 4h2v2H9v-2zm4-8h2v2h-2V5zm0 4h2v2h-2V9zm0 4h2v2h-2v-2z"/>
            </svg>
          </div>

          {/* Rank badge */}
          <div className="flex-shrink-0">
            <RankBadge rank={item.rank} style={rankingStyle} />
          </div>

          {/* Filename */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-secondary)' }}>
              {media?.originalFilename ?? 'Unknown'}
            </p>
            <p className="text-xs" style={{ color: '#8b8ba7' }}>
              {item.startTime.toFixed(1)}s → {item.endTime.toFixed(1)}s
            </p>
          </div>

          {/* Title input */}
          <div className="flex-1 min-w-0 max-w-[200px]">
            <input
              className="input-base text-sm py-1.5"
              placeholder="Item title..."
              value={item.title}
              onChange={(e) => onChange({ title: e.target.value.slice(0, 30) })}
              maxLength={30}
            />
            {item.aiGenerated?.title && (
              <p className="text-xs mt-0.5" style={{ color: '#a855f7' }}>✨ AI</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setExpanded(!expanded)}
              className="btn-ghost text-xs px-2.5 py-1 flex items-center gap-1 font-medium"
              style={{ color: expanded ? '#a855f7' : 'var(--text-secondary)' }}
              title={expanded ? 'Hide timeline trim controls' : 'Show timeline trim controls'}>
              <span>⏱ Trim</span>
              <span>{expanded ? '▲' : '▼'}</span>
            </button>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={item.included}
                onChange={(e) => onChange({ included: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 rounded-full transition-all"
                style={{
                  background: item.included ? '#7c3aed' : 'var(--surface-2)',
                  border: '1px solid var(--border)',
                }}>
                <div className="w-3.5 h-3.5 rounded-full bg-white transition-all mt-[2px]"
                  style={{ marginLeft: item.included ? '18px' : '2px' }} />
              </div>
            </label>
          </div>
        </div>

        {/* Expanded trim controls */}
        {expanded && (
          <div className="mt-4 ml-10 space-y-4">
            <TrimSlider
              startTime={item.startTime}
              endTime={item.endTime}
              duration={media?.duration ?? 10}
              onChange={(start, end) => onChange({ startTime: start, endTime: end })}
            />

            <div className="flex items-center gap-4">
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                  Transition
                </label>
                <div className="flex gap-1">
                  {TRANSITIONS.map((t) => (
                    <button
                      key={t}
                      onClick={() => onChange({ transition: { type: t, duration: 0.3 } })}
                      className="px-2 py-1 rounded text-xs capitalize"
                      style={{
                        background: item.transition?.type === t ? 'rgba(124,58,237,0.2)' : 'var(--surface)',
                        border: `1px solid ${item.transition?.type === t ? 'rgba(124,58,237,0.5)' : 'var(--border)'}`,
                        color: item.transition?.type === t ? '#a855f7' : 'var(--text-secondary)',
                      }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
