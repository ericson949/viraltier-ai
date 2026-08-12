'use client';

import { useQuery } from 'convex/react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { AppHeader } from '@/components/layout/AppHeader';
import { Suspense } from 'react';

const STAGE_ICONS: Record<string, string> = {
  preparing: '⏳',
  extracting: '⚙️',
  compositing: '✨',
  merging: '🎵',
  uploading: '📦',
  done: '✅',
};

const STAGE_LABELS: Record<string, string> = {
  preparing: 'Preparing assets...',
  extracting: 'Processing clips...',
  compositing: 'Compositing layers...',
  merging: 'Adding music...',
  uploading: 'Finalizing output...',
  done: 'Done!',
};

function RenderProgressContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const renderId = searchParams.get('renderId');
  const router = useRouter();

  // Convex reactive query — auto-updates in real-time without polling
  const render = useQuery(
    api.renders.get,
    renderId ? { renderId: renderId as Id<'renders'> } : 'skip',
  );

  const downloadUrl = useQuery(
    api.renders.getDownloadUrl,
    render?.status === 'done' && renderId
      ? { renderId: renderId as Id<'renders'> }
      : 'skip',
  );

  const stage = render?.stage ?? 'preparing';
  const progress = render?.progress ?? 0;
  const isDone = render?.status === 'done';
  const isError = render?.status === 'error';

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <AppHeader />
      <main className="max-w-2xl mx-auto px-6 py-16 text-center">
        {/* Status icon */}
        <div className="text-7xl mb-6">
          {isError ? '❌' : isDone ? '🎉' : STAGE_ICONS[stage] ?? '⏳'}
        </div>

        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>
          {isError ? 'Render Failed' : isDone ? 'Your Video is Ready!' : 'Generating Your Video'}
        </h1>

        {!isDone && !isError && (
          <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
            {STAGE_LABELS[stage] ?? 'Working...'}
          </p>
        )}

        {/* Progress bar */}
        {!isDone && !isError && (
          <div className="mb-10">
            <div className="progress-bar mb-3" style={{ height: '12px' }}>
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-lg font-bold" style={{ color: '#a855f7' }}>{progress}%</p>
          </div>
        )}

        {/* Stage log */}
        {!isDone && !isError && (
          <div className="glass-card p-5 text-left space-y-2 mb-8">
            {(['preparing', 'extracting', 'compositing', 'merging', 'uploading'] as const).map((s) => {
              const stageIdx = ['preparing', 'extracting', 'compositing', 'merging', 'uploading'].indexOf(s);
              const currentIdx = ['preparing', 'extracting', 'compositing', 'merging', 'uploading'].indexOf(stage);
              const isPast = stageIdx < currentIdx;
              const isCurrent = s === stage;

              return (
                <div key={s} className="flex items-center gap-3 text-sm">
                  <span className="flex-shrink-0">
                    {isPast ? '✅' : isCurrent ? STAGE_ICONS[s] : '○'}
                  </span>
                  <span style={{
                    color: isCurrent ? 'var(--text-primary)' : isPast ? '#10b981' : 'var(--text-secondary)',
                    fontWeight: isCurrent ? 600 : 400,
                  }}>
                    {STAGE_LABELS[s]}
                  </span>
                  {isCurrent && (
                    <div className="ml-auto flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-purple-400"
                          style={{ animation: `bounce 1.4s ${i * 0.2}s infinite` }} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="glass-card p-6 mb-8 text-left"
            style={{ border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>
            <p className="font-semibold mb-2" style={{ color: '#ef4444' }}>Error details</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {render?.errorMessage ?? 'An unknown error occurred.'}
            </p>
          </div>
        )}

        {/* Done state — video player + download */}
        {isDone && (
          <div className="space-y-6">
            {downloadUrl && (
              <div className="glass-card overflow-hidden">
                <video
                  src={downloadUrl}
                  controls
                  className="w-full max-h-[500px]"
                  style={{ background: '#000' }}
                />
              </div>
            )}

            <div className="flex gap-3 justify-center">
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  download="viraltier_output.mp4"
                  className="btn-primary"
                >
                  ⬇ Download MP4
                </a>
              )}
              <button
                onClick={() => router.push(`/projects/${id}`)}
                className="btn-secondary">
                ✏ Edit & re-render
              </button>
              <button
                onClick={() => router.push('/projects/new')}
                className="btn-ghost">
                + New project
              </button>
            </div>
          </div>
        )}

        {/* Error actions */}
        {isError && (
          <div className="flex gap-3 justify-center">
            <button onClick={() => router.push(`/projects/${id}`)} className="btn-primary">
              ← Back to editor
            </button>
          </div>
        )}
      </main>

      <style jsx>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default function RenderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: 'var(--background)' }} />}>
      <RenderProgressContent />
    </Suspense>
  );
}
