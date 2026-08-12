'use client';

import { useRef } from 'react';

interface Props {
  startTime: number;
  endTime: number;
  duration: number;
  onChange: (startTime: number, endTime: number) => void;
}

export function TrimSlider({ startTime, endTime, duration, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const safeMax = Math.max(duration, 1);

  const startPct = (startTime / safeMax) * 100;
  const endPct = (endTime / safeMax) * 100;

  function handleStartChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Math.min(parseFloat(e.target.value), endTime - 0.5);
    onChange(Math.max(0, val), endTime);
  }

  function handleEndChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Math.max(parseFloat(e.target.value), startTime + 0.5);
    onChange(startTime, Math.min(safeMax, val));
  }

  const clipDuration = endTime - startTime;

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
        <span>Trim range</span>
        <span className="font-mono" style={{ color: '#a855f7' }}>
          {clipDuration.toFixed(1)}s clip
        </span>
      </div>

      {/* Visual track */}
      <div ref={containerRef} className="relative h-8 rounded-lg overflow-hidden mb-3"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
        {/* Inactive before start */}
        <div className="absolute top-0 left-0 h-full"
          style={{ width: `${startPct}%`, background: 'rgba(0,0,0,0.4)' }} />

        {/* Active region */}
        <div className="absolute top-0 h-full"
          style={{
            left: `${startPct}%`,
            width: `${endPct - startPct}%`,
            background: 'rgba(124,58,237,0.3)',
            borderLeft: '2px solid #a855f7',
            borderRight: '2px solid #a855f7',
          }} />

        {/* Inactive after end */}
        <div className="absolute top-0 right-0 h-full"
          style={{ width: `${100 - endPct}%`, background: 'rgba(0,0,0,0.4)' }} />

        {/* Time labels */}
        <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
          <span className="text-xs font-mono" style={{ color: '#a855f7' }}>{startTime.toFixed(1)}s</span>
          <span className="text-xs font-mono" style={{ color: '#a855f7' }}>{endTime.toFixed(1)}s</span>
        </div>
      </div>

      {/* Sliders (stacked) */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-xs w-10 text-right" style={{ color: 'var(--text-secondary)' }}>Start</span>
          <input
            type="range"
            min={0}
            max={safeMax}
            step={0.1}
            value={startTime}
            onChange={handleStartChange}
            className="flex-1 h-1 rounded-full appearance-none"
            style={{ accentColor: '#7c3aed' }}
          />
          <span className="text-xs font-mono w-12" style={{ color: 'var(--text-secondary)' }}>
            {startTime.toFixed(1)}s
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs w-10 text-right" style={{ color: 'var(--text-secondary)' }}>End</span>
          <input
            type="range"
            min={0}
            max={safeMax}
            step={0.1}
            value={endTime}
            onChange={handleEndChange}
            className="flex-1 h-1 rounded-full appearance-none"
            style={{ accentColor: '#a855f7' }}
          />
          <span className="text-xs font-mono w-12" style={{ color: 'var(--text-secondary)' }}>
            {endTime.toFixed(1)}s
          </span>
        </div>
      </div>
    </div>
  );
}
