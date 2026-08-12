'use client';

import { useState, useRef, useEffect } from 'react';
import type { EditingPlan, RankingStyle } from '@viraltier/types';
import type { Doc } from '@/convex/_generated/dataModel';

interface Props {
  plan: EditingPlan;
  mediaItems: Doc<'mediaItems'>[];
}

function getRankBadge(rank: number, style: RankingStyle) {
  if (style === 'emoji') {
    const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
    return <span className="text-4xl">{medals[rank] ?? `#${rank}`}</span>;
  }
  if (style === 'ordinal') {
    const suffix = rank === 1 ? 'st' : rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th';
    return (
      <span className="text-3xl font-black text-white drop-shadow-md">
        {rank}<sup className="text-lg font-bold">{suffix}</sup>
      </span>
    );
  }
  return <span className="text-3xl font-black text-white drop-shadow-md">#{rank}</span>;
}

export function LivePreviewPlayer({ plan, mediaItems }: Props) {
  const itemsInOrder = plan.displayOrder
    .map((rank) => plan.items.find((i) => i.rank === rank && i.included))
    .filter(Boolean) as typeof plan.items;

  const [activeIdx, setActiveIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const activeItem = itemsInOrder[activeIdx] ?? itemsInOrder[0];
  const activeMedia = activeItem
    ? mediaItems.find((m) => m._id === activeItem.mediaItemId)
    : undefined;

  // React to play/pause state change
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isPlaying]);

  // Handle clip end and clip switching
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeItem) return;

    video.currentTime = activeItem.startTime;

    function handleTimeUpdate() {
      if (video && video.currentTime >= activeItem.endTime) {
        if (activeIdx < itemsInOrder.length - 1) {
          setActiveIdx((prev) => prev + 1);
        } else {
          setActiveIdx(0);
          setIsPlaying(false);
        }
      }
    }

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [activeIdx, activeItem, itemsInOrder.length]);

  function togglePlay() {
    setIsPlaying((prev) => !prev);
  }

  return (
    <div className="glass-card p-4 sticky top-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <span>📺 Live 9:16 Preview</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
            Realtime
          </span>
        </h3>
        <span className="text-xs text-secondary font-mono">
          {itemsInOrder.length > 0 ? `${activeIdx + 1}/${itemsInOrder.length}` : '0/0'}
        </span>
      </div>

      {/* 9:16 Vertical Video Frame */}
      <div
        className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden bg-black flex flex-col justify-between shadow-2xl border border-white/10"
        style={{ background: '#0a0a0f' }}
      >
        {/* Background Media / Video */}
        {activeMedia?.publicUrl ? (
          <video
            ref={videoRef}
            src={activeMedia.publicUrl}
            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ${
              plan.effects.autoZoom ? 'scale-105' : 'scale-100'
            }`}
            playsInline
            muted={isMuted}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white/40">
            <span className="text-5xl mb-2">🎬</span>
            <p className="text-xs">Add clips to see live ranking video preview</p>
          </div>
        )}

        {/* Top Overlay Banner */}
        <div className="relative z-10 p-4 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between">
          <p className="text-center font-bold text-sm text-white drop-shadow-md tracking-wide uppercase flex-1">
            {plan.titleOverlay.text || 'Ranking Video'}
          </p>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="z-30 p-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs border border-white/20 hover:scale-110 transition-transform"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>

        {/* Center / Rank Badge Overlay */}
        {activeItem && (
          <div className="relative z-10 px-4 flex items-center justify-between">
            <div className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 shadow-lg">
              {getRankBadge(activeItem.rank, plan.rankingStyle.type)}
            </div>
          </div>
        )}

        {/* Bottom Item Title Overlay & Progress */}
        <div className="relative z-10 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent space-y-3">
          {activeItem && (
            <div className="p-3 rounded-xl bg-black/75 backdrop-blur-md border-l-4 border-purple-500 shadow-xl">
              <p className="text-xs text-purple-300 font-semibold uppercase tracking-wider mb-0.5">
                #{activeItem.rank}
              </p>
              <p className="text-sm font-bold text-white line-clamp-2">
                {activeItem.title || `Clip #${activeItem.rank}`}
              </p>
            </div>
          )}

          {/* Dots progress indicator */}
          <div className="flex gap-1.5">
            {itemsInOrder.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`flex-1 h-1 rounded-full transition-all ${
                  i === activeIdx ? 'bg-purple-500 shadow-glow' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Controls Overlay */}
        <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-[2px]">
          <button
            onClick={togglePlay}
            className="w-14 h-14 rounded-full bg-purple-600/90 text-white text-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
        </div>
      </div>

      {/* Navigation & Controls Bar */}
      <div className="flex items-center justify-between mt-3 text-xs">
        <button
          onClick={() => setActiveIdx((prev) => Math.max(0, prev - 1))}
          disabled={activeIdx === 0}
          className="btn-ghost text-xs px-2 py-1 disabled:opacity-30"
        >
          ◀ Prev
        </button>

        <button
          onClick={togglePlay}
          className="btn-secondary text-xs px-3 py-1 font-semibold flex items-center gap-1"
        >
          <span>{isPlaying ? '⏸ Pause' : '▶ Play'}</span>
        </button>

        <button
          onClick={() => setActiveIdx((prev) => Math.min(itemsInOrder.length - 1, prev + 1))}
          disabled={activeIdx === itemsInOrder.length - 1}
          className="btn-ghost text-xs px-2 py-1 disabled:opacity-30"
        >
          Next ▶
        </button>
      </div>
    </div>
  );
}
