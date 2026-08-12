'use client';

import { useQuery, useMutation } from 'convex/react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import type { EditingPlan } from '@viraltier/types';
import { AppHeader } from '@/components/layout/AppHeader';
import { EditingPlanPreview } from '@/components/editor/EditingPlanPreview';

export default function PlanReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const project = useQuery(api.projects.get, { id: id as Id<'projects'> });
  const currentPlan = useQuery(api.editingPlans.getCurrent, { projectId: id as Id<'projects'> });
  const mediaItems = useQuery(api.media.list, { projectId: id as Id<'projects'> });
  const queueRender = useMutation(api.renders.queue);

  const plan = currentPlan?.plan as EditingPlan | undefined;

  async function handleRender() {
    try {
      const renderId = await queueRender({ projectId: id as Id<'projects'> });
      router.push(`/projects/${id}/render?renderId=${renderId}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to start render');
    }
  }

  if (!project || !plan) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <AppHeader />
        <div className="max-w-3xl mx-auto px-6 py-10">
          <div className="skeleton h-8 w-64 mb-8" />
          <div className="skeleton h-96 w-full" />
        </div>
      </div>
    );
  }

  const isRenderable = plan.items.filter((i) => i.included).length > 0;

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <AppHeader />
      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button onClick={() => router.back()} className="btn-ghost text-sm mb-2">← Back to editor</button>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>
              Plan Review
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {project.name}
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => router.back()} className="btn-secondary">
              Edit
            </button>
            <button
              id="generate-video-btn"
              onClick={handleRender}
              className="btn-primary"
              disabled={!isRenderable}
            >
              🎬 Generate Video
            </button>
          </div>
        </div>

        {!isRenderable && (
          <div className="p-4 rounded-xl mb-6 text-sm"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b' }}>
            ⚠️ Add at least one included clip to generate a video.
          </div>
        )}

        <EditingPlanPreview plan={plan} mediaItems={mediaItems ?? []} />
      </main>
    </div>
  );
}
