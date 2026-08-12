'use client';

import { useQuery } from 'convex/react';
import { useState, useRef } from 'react';
import { api } from '@/convex/_generated/api';
import { AppHeader } from '@/components/layout/AppHeader';

const MOODS = ['All', 'energetic', 'chill', 'funny', 'dramatic', 'upbeat'] as const;

export default function MusicLibraryPage() {
  const [selectedMood, setSelectedMood] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [playing, setPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const tracks = useQuery(api.music.list, {
    mood: selectedMood === 'All' ? undefined : selectedMood,
  });

  function handlePlay(trackId: string, url: string) {
    if (playing === trackId) {
      audioRef.current?.pause();
      setPlaying(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.play();
      setPlaying(trackId);
    }
  }

  const filtered = (tracks ?? []).filter((t) =>
    !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <AppHeader />
      <audio ref={audioRef} onEnded={() => setPlaying(null)} />

      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>
          Music Library
        </h1>
        <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
          Royalty-free tracks for your ranking videos
        </p>

        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <input
            className="input-base flex-1"
            placeholder="Search tracks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="flex gap-2 flex-wrap">
            {MOODS.map((mood) => (
              <button
                key={mood}
                id={`mood-${mood}`}
                onClick={() => setSelectedMood(mood)}
                className="px-3 py-1.5 rounded-full text-sm font-medium transition-all capitalize"
                style={{
                  background: selectedMood === mood ? 'rgba(124,58,237,0.2)' : 'var(--surface)',
                  border: `1px solid ${selectedMood === mood ? 'rgba(124,58,237,0.5)' : 'var(--border)'}`,
                  color: selectedMood === mood ? '#a855f7' : 'var(--text-secondary)',
                }}>
                {mood}
              </button>
            ))}
          </div>
        </div>

        {/* Track list */}
        {tracks === undefined ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="glass-card p-4">
                <div className="skeleton h-5 w-48 mb-2" />
                <div className="skeleton h-3 w-32" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🎵</p>
            <p style={{ color: 'var(--text-secondary)' }}>No tracks found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((track) => (
              <div key={track._id} className="glass-card-hover p-4 flex items-center gap-4">
                {/* Play button */}
                <button
                  id={`play-${track._id}`}
                  onClick={() => handlePlay(track._id, track.publicUrl)}
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    background: playing === track._id ? 'rgba(168,85,247,0.3)' : 'var(--surface-2)',
                    border: '1px solid var(--border)',
                  }}>
                  {playing === track._id ? '⏸' : '▶'}
                </button>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{track.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {track.artist ?? 'Unknown artist'}
                    {track.bpm && ` · ${track.bpm} BPM`}
                    {track.duration && ` · ${Math.round(track.duration / 60)}:${String(Math.round(track.duration % 60)).padStart(2, '0')}`}
                  </p>
                </div>

                {/* Mood tags */}
                <div className="flex gap-1 flex-wrap flex-shrink-0 max-w-32">
                  {track.mood.map((m) => (
                    <span key={m} className="text-xs px-2 py-0.5 rounded-full capitalize"
                      style={{ background: 'rgba(124,58,237,0.1)', color: '#a855f7', border: '1px solid rgba(124,58,237,0.2)' }}>
                      {m}
                    </span>
                  ))}
                </div>

                {/* Genre */}
                {track.genre && (
                  <span className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>
                    {track.genre}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
