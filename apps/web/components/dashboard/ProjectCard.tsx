'use client';

import Link from 'next/link';
import { useMutation } from 'convex/react';
import { useRouter } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import type { Doc } from '@/convex/_generated/dataModel';

const STATUS_COLORS: Record<string, string> = {
  draft: '#8b8ba7',
  ready: '#10b981',
  rendering: '#f59e0b',
  done: '#10b981',
  error: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  ready: 'Ready',
  rendering: '⚙️ Rendering...',
  done: '✅ Done',
  error: '❌ Error',
};

const MODE_ICONS: Record<string, string> = {
  ai: '🤖',
  assisted: '🧠',
  manual: '✋',
};

interface Props {
  project: Doc<'projects'>;
}

export function ProjectCard({ project }: Props) {
  const deleteProject = useMutation(api.projects.remove);
  const duplicateProject = useMutation(api.projects.duplicate);
  const router = useRouter();

  const ago = getRelativeTime(project.updatedAt);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    if (!confirm('Delete this project? This cannot be undone.')) return;
    await deleteProject({ id: project._id });
  }

  async function handleDuplicate(e: React.MouseEvent) {
    e.preventDefault();
    const newId = await duplicateProject({ id: project._id });
    router.push(`/projects/${newId}`);
  }

  return (
    <Link href={`/projects/${project._id}`} className="block">
      <div className="glass-card-hover p-6 h-full flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span>{MODE_ICONS[project.mode]}</span>
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Ranking · {project.mode}
              </span>
            </div>
            <h3 className="font-bold text-base truncate">{project.name}</h3>
          </div>
          <div className="flex-shrink-0">
            <span className="text-xs font-medium px-2 py-1 rounded-full"
              style={{
                background: `${STATUS_COLORS[project.status]}20`,
                color: STATUS_COLORS[project.status],
                border: `1px solid ${STATUS_COLORS[project.status]}40`,
              }}>
              {STATUS_LABELS[project.status]}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-2"
          style={{ borderTop: '1px solid var(--border)' }}>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {ago}
          </span>
          <div className="flex gap-1">
            <button
              id={`duplicate-${project._id}`}
              onClick={handleDuplicate}
              className="btn-ghost text-xs px-2 py-1"
              title="Duplicate">
              ⧉
            </button>
            <button
              id={`delete-${project._id}`}
              onClick={handleDelete}
              className="btn-ghost text-xs px-2 py-1"
              style={{ color: '#ef4444' }}
              title="Delete">
              ✕
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

function getRelativeTime(ms: number): string {
  const seconds = Math.floor((Date.now() - ms) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
