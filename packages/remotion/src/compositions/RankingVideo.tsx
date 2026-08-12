import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from 'remotion';
import type { EditingPlan, RankingStyle } from '@viraltier/types';

// ── Rank label components ──────────────────────────────────────────────────

function NumericLabel({ rank }: { rank: number }) {
  return (
    <div style={{
      fontSize: 72,
      fontWeight: 900,
      color: '#fff',
      fontFamily: 'Inter, sans-serif',
      textShadow: '0 2px 20px rgba(0,0,0,0.8)',
    }}>
      #{rank}
    </div>
  );
}

function OrdinalLabel({ rank }: { rank: number }) {
  const suffix = rank === 1 ? 'st' : rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th';
  return (
    <div style={{
      fontSize: 72,
      fontWeight: 900,
      color: '#fff',
      fontFamily: 'Inter, sans-serif',
      textShadow: '0 2px 20px rgba(0,0,0,0.8)',
    }}>
      {rank}<sup style={{ fontSize: 40 }}>{suffix}</sup>
    </div>
  );
}

function EmojiLabel({ rank }: { rank: number }) {
  const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
  return (
    <div style={{
      fontSize: rank <= 3 ? 88 : 64,
      textShadow: '0 2px 20px rgba(0,0,0,0.6)',
    }}>
      {medals[rank] ?? `#${rank}`}
    </div>
  );
}

function RankingLabel({ rank, style }: { rank: number; style: RankingStyle }) {
  return (
    <div style={{
      position: 'absolute',
      top: 80,
      left: 40,
      zIndex: 10,
    }}>
      {style === 'numeric' && <NumericLabel rank={rank} />}
      {style === 'ordinal' && <OrdinalLabel rank={rank} />}
      {style === 'emoji' && <EmojiLabel rank={rank} />}
    </div>
  );
}

// ── Item title overlay ─────────────────────────────────────────────────────

function ItemTitle({ title }: { title: string }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div style={{
      position: 'absolute',
      bottom: 120,
      left: 0,
      right: 0,
      padding: '0 40px',
      zIndex: 10,
      opacity,
    }}>
      <div style={{
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(10px)',
        borderRadius: 16,
        padding: '16px 24px',
        borderLeft: '4px solid #a855f7',
      }}>
        <p style={{
          fontSize: 40,
          fontWeight: 800,
          color: '#fff',
          fontFamily: 'Inter, sans-serif',
          margin: 0,
          textShadow: '0 2px 10px rgba(0,0,0,0.5)',
        }}>
          {title}
        </p>
      </div>
    </div>
  );
}

// ── Progress bar (which clip we're on) ────────────────────────────────────

function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div style={{
      position: 'absolute',
      bottom: 60,
      left: 40,
      right: 40,
      display: 'flex',
      gap: 8,
      zIndex: 10,
    }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            background: i <= current ? '#a855f7' : 'rgba(255,255,255,0.3)',
            transition: 'background 0.3s',
          }}
        />
      ))}
    </div>
  );
}

// ── Top title overlay ──────────────────────────────────────────────────────

function TitleOverlay({ text, position }: { text: string; position: 'top' | 'bottom' }) {
  const isTop = position === 'top';
  return (
    <div style={{
      position: 'absolute',
      [isTop ? 'top' : 'bottom']: 0,
      left: 0,
      right: 0,
      padding: isTop ? '40px 40px 80px' : '80px 40px 40px',
      background: isTop
        ? 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)'
        : 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
      zIndex: 5,
    }}>
      <p style={{
        fontSize: 32,
        fontWeight: 700,
        color: '#fff',
        fontFamily: 'Inter, sans-serif',
        margin: 0,
        opacity: 0.9,
      }}>
        {text}
      </p>
    </div>
  );
}

// ── Clip layer (video background) ─────────────────────────────────────────

function ClipLayer({ videoUrl, autoZoom }: { videoUrl: string; autoZoom: boolean }) {
  const frame = useCurrentFrame();

  // Auto-zoom: slowly scale from 100% to 110%
  const scale = autoZoom
    ? interpolate(frame, [0, 90], [1, 1.1], { extrapolateRight: 'clamp' })
    : 1;

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <video
        src={videoUrl}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale})`,
        }}
        autoPlay
        muted
        playsInline
      />
    </AbsoluteFill>
  );
}

// ── Main RankingVideo composition ─────────────────────────────────────────

interface RankingVideoProps {
  plan: EditingPlan;
  /** Map of mediaItemId → video URL (provided by the rendering worker) */
  mediaUrls: Record<string, string>;
}

const FPS = 30;

function getItemDurationInFrames(item: EditingPlan['items'][number]): number {
  return Math.round((item.endTime - item.startTime) * FPS);
}

function getFrameStart(index: number, items: EditingPlan['items']): number {
  let start = 0;
  for (let i = 0; i < index; i++) {
    start += getItemDurationInFrames(items[i]!);
  }
  return start;
}

export function RankingVideo({ plan, mediaUrls }: RankingVideoProps) {
  const itemsInOrder = plan.displayOrder
    .map((rank) => plan.items.find((i) => i.rank === rank && i.included))
    .filter(Boolean) as typeof plan.items;

  return (
    <AbsoluteFill style={{ background: '#0a0a0f' }}>
      {/* Top title overlay (always visible) */}
      <TitleOverlay text={plan.titleOverlay.text} position={plan.titleOverlay.position} />

      {/* Progress dots */}
      <ProgressDots total={itemsInOrder.length} current={-1} />

      {/* Render each clip in display order */}
      {itemsInOrder.map((item, index) => {
        const frameStart = getFrameStart(index, itemsInOrder);
        const durationInFrames = getItemDurationInFrames(item);
        const videoUrl = mediaUrls[item.mediaItemId] ?? '';

        return (
          <Sequence
            key={item.id}
            from={frameStart}
            durationInFrames={durationInFrames}
          >
            {/* Video background */}
            <ClipLayer videoUrl={videoUrl} autoZoom={plan.effects.autoZoom} />

            {/* Rank label */}
            <RankingLabel rank={item.rank} style={plan.rankingStyle.type} />

            {/* Item title */}
            <ItemTitle title={item.title} />

            {/* Progress indicator for this clip */}
            <AbsoluteFill style={{ pointerEvents: 'none' }}>
              <ProgressDots total={itemsInOrder.length} current={index} />
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}
