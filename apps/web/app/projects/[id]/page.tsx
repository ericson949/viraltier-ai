'use client';

import { useQuery, useMutation, useConvexAuth } from 'convex/react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useCallback, useRef, useState } from 'react';
import { api } from '@/convex/_generated/api';
import type { Id, Doc } from '@/convex/_generated/dataModel';
import { AppHeader } from '@/components/layout/AppHeader';
import { MediaUploader } from '@/components/editor/MediaUploader';
import { ManualRankingEditor } from '@/components/editor/ManualRankingEditor';
import { AutoRankingEditor } from '@/components/editor/AutoRankingEditor';
import { LivePreviewPlayer } from '@/components/editor/LivePreviewPlayer';
import type { EditingPlan } from '@viraltier/types';

export default function ProjectEditorPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const project = useQuery(api.projects.get, isAuthenticated ? { id: id as Id<'projects'> } : 'skip');
  const mediaItems = useQuery(api.media.list, isAuthenticated ? { projectId: id as Id<'projects'> } : 'skip');
  const currentPlan = useQuery(api.editingPlans.getCurrent, isAuthenticated ? { projectId: id as Id<'projects'> } : 'skip');
  const updatePlan = useMutation(api.editingPlans.updateCurrent);
  const queueRender = useMutation(api.renders.queue);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [mounted, isAuthenticated, authLoading, router]);

  // Debounced auto-save
  const handlePlanChange = useCallback(
    (newPlan: EditingPlan) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        updatePlan({
          projectId: id as Id<'projects'>,
          plan: newPlan,
        });
      }, 1500);
    },
    [id, updatePlan],
  );

  async function handleRender() {
    try {
      const renderId = await queueRender({ projectId: id as Id<'projects'> });
      router.push(`/projects/${id}/render?renderId=${renderId}`);
    } catch (err) {
      console.error(err);
    }
  }

  if (!mounted || authLoading || project === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Project not found.</p>
      </div>
    );
  }

  const plan = currentPlan?.plan as EditingPlan | undefined;
  const isRenderable = (plan?.items.filter((i) => i.included).length ?? 0) > 0;

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <AppHeader />
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button onClick={() => router.push('/dashboard')} className="btn-ghost text-xs mb-1">
              ← Dashboard
            </button>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>
              {project.name}
            </h1>
            <p className="text-xs mt-0.5 text-secondary">
              {['🤖 AI', '🧠 Assisted', '✋ Manual'][['ai', 'assisted', 'manual'].indexOf(project.mode)]} · Ranking template
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => router.push(`/projects/${id}/plan`)} className="btn-secondary text-sm">
              Preview plan
            </button>
            <button
              id="render-btn"
              onClick={handleRender}
              className="btn-primary text-sm"
              disabled={!isRenderable || project.status === 'rendering'}
            >
              {project.status === 'rendering' ? '⚙️ Rendering...' : '🎬 Generate Video'}
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (7 cols): Controls, Uploads, Ranking items */}
          <div className="lg:col-span-7 space-y-6">
            {/* Media uploader */}
            <section>
              <h2 className="text-xs font-semibold mb-2.5 uppercase tracking-wider text-secondary">
                MEDIA — {mediaItems?.filter((m: Doc<'mediaItems'>) => m.type === 'video').length ?? 0} / 20 videos
              </h2>
              <MediaUploader
                projectId={id as Id<'projects'>}
                mediaItems={mediaItems ?? []}
                plan={plan}
                onPlanChange={handlePlanChange}
              />
            </section>

            {/* Isolated Mode Editors */}
            {plan && (
              <section>
                {project.mode === 'manual' ? (
                  <ManualRankingEditor
                    plan={plan}
                    mediaItems={mediaItems ?? []}
                    projectId={id as Id<'projects'>}
                    onPlanChange={handlePlanChange}
                  />
                ) : (
                  <AutoRankingEditor
                    plan={plan}
                    mediaItems={mediaItems ?? []}
                    projectId={id as Id<'projects'>}
                    projectMode={project.mode}
                    onPlanChange={handlePlanChange}
                  />
                )}
              </section>
            )}
          </div>

          {/* Right Column (5 cols): Live 9:16 Preview Player */}
          {plan && (
            <div className="lg:col-span-5">
              <LivePreviewPlayer plan={plan} mediaItems={mediaItems ?? []} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
