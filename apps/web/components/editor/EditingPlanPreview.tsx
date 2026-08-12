'use client';

import type { EditingPlan, RankingStyle } from '@viraltier/types';
import type { Doc } from '@/convex/_generated/dataModel';

interface Props {
  plan: EditingPlan;
  mediaItems: Doc<'mediaItems'>[];
}

function getRankLabel(rank: number, style: RankingStyle): string {
  if (style === 'emoji') {
    const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
    return medals[rank] ?? `#${rank}`;
  }
  if (style === 'ordinal') {
    const suffix = rank === 1 ? 'st' : rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th';
    return `${rank}${suffix}`;
  }
  return `#${rank}`;
}

export function EditingPlanPreview({ plan, mediaItems }: Props) {
  const itemsInOrder = plan.displayOrder
    .map((rank) => plan.items.find((i) => i.rank === rank && i.included))
    .filter(Boolean) as typeof plan.items;

  const totalDuration = plan.items
    .filter((i) => i.included)
    .reduce((sum, i) => sum + (i.endTime - i.startTime), 0);

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="glass-card p-5 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold gradient-text" style={{ fontFamily: 'Space Grotesk' }}>
            {itemsInOrder.length}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>clips</p>
        </div>
        <div>
          <p className="text-2xl font-bold gradient-text" style={{ fontFamily: 'Space Grotesk' }}>
            {totalDuration.toFixed(1)}s
          </p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>total duration</p>
        </div>
        <div>
          <p className="text-2xl font-bold gradient-text" style={{ fontFamily: 'Space Grotesk' }}>
            {getRankLabel(1, plan.rankingStyle.type)}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>top rank style</p>
        </div>
      </div>

      {/* Horizontal thumbnail strip */}
      {itemsInOrder.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
            DISPLAY ORDER (left to right)
          </p>
          <div className="flex gap-3 overflow-x-auto pb-3">
            {itemsInOrder.map((item, idx) => {
              const media = mediaItems.find((m) => m._id === item.mediaItemId);
              return (
                <div key={item.id} className="flex-shrink-0 w-24">
                  <div className="w-24 h-16 rounded-lg overflow-hidden relative mb-2 flex items-center justify-center text-2xl"
                    style={{ background: `hsl(${(idx * 50) % 360}, 40%, 20%)` }}>
                    🎬
                    <div className="absolute top-1 left-1 text-xs font-bold px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(0,0,0,0.7)' }}>
                      {getRankLabel(item.rank, plan.rankingStyle.type)}
                    </div>
                  </div>
                  <p className="text-xs truncate text-center" style={{ color: 'var(--text-secondary)' }}>
                    {item.title}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detailed table */}
      <div className="glass-card overflow-hidden">
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {itemsInOrder.map((item) => {
            const media = mediaItems.find((m) => m._id === item.mediaItemId);
            const clipDuration = item.endTime - item.startTime;
            return (
              <div key={item.id} className="px-5 py-4 flex items-center gap-4">
                <div className="flex-shrink-0 w-12 text-lg font-bold text-center">
                  {getRankLabel(item.rank, plan.rankingStyle.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{media?.originalFilename ?? '—'}</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {item.startTime.toFixed(1)}s → {item.endTime.toFixed(1)}s
                  </p>
                </div>
                <div className="flex-1 min-w-0 max-w-[180px]">
                  <p className="text-sm italic truncate" style={{ color: '#a855f7' }}>
                    &ldquo;{item.title}&rdquo;
                  </p>
                  {item.aiGenerated?.title && (
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>✨ AI title</p>
                  )}
                </div>
                <div className="flex-shrink-0 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                  {clipDuration.toFixed(1)}s
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Music & effects */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h3 className="text-xs font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>AUDIO</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Music</span>
              <span>{plan.audio.musicTrackId ? '✅ Selected' : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Music volume</span>
              <span>{Math.round(plan.audio.musicVolume * 100)}%</span>
            </div>
          </div>
        </div>
        <div className="glass-card p-5">
          <h3 className="text-xs font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>EFFECTS</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Auto zoom</span>
              <span>{plan.effects.autoZoom ? '✅' : '○'}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Transitions</span>
              <span>{plan.effects.transitions ? '✅' : '○'}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Sound FX</span>
              <span>{plan.effects.soundEffects ? '✅' : '○'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
