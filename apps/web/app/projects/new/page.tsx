'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { useRouter } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import { AppHeader } from '@/components/layout/AppHeader';
import type { ProjectMode, AssistedModeConfig } from '@viraltier/types';

const MODES: { id: ProjectMode; icon: string; title: string; desc: string; badge?: string }[] = [
  {
    id: 'ai',
    icon: '🤖',
    title: 'AI Mode',
    desc: 'Full automation. AI analyzes clips, detects best moments, generates titles, and selects music.',
    badge: '~7 credits/video',
  },
  {
    id: 'assisted',
    icon: '🧠',
    title: 'Assisted Mode',
    desc: 'Choose which tasks to delegate to AI. Full control over what&apos;s automated.',
    badge: 'Flexible credits',
  },
  {
    id: 'manual',
    icon: '✋',
    title: 'Manual Mode',
    desc: 'Zero AI. Set everything yourself. Rendering is always free.',
    badge: 'Free',
  },
];

export default function NewProjectPage() {
  const createProject = useMutation(api.projects.create);
  const router = useRouter();

  const [step, setStep] = useState<'mode' | 'name' | 'assisted-config'>('mode');
  const [name, setName] = useState('');
  const [mode, setMode] = useState<ProjectMode>('ai');
  const [assisted, setAssisted] = useState<AssistedModeConfig>({
    detectBestMoments: true,
    generateTitles: true,
    selectMusic: true,
  });
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const id = await createProject({
        name: name.trim(),
        mode,
        assistedConfig: mode === 'assisted' ? assisted : undefined,
      });
      router.push(`/projects/${id}`);
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <AppHeader />
      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Back */}
        <button onClick={() => router.back()} className="btn-ghost mb-8">
          ← Back
        </button>

        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>
          New Video
        </h1>
        <p className="mb-10" style={{ color: 'var(--text-secondary)' }}>
          Set up your ranking video project
        </p>

        {/* Template (only ranking for MVP) */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
            TEMPLATE
          </h2>
          <div className="glass-card p-5 flex items-center gap-4"
            style={{ borderColor: 'rgba(124,58,237,0.4)', background: 'rgba(124,58,237,0.05)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'rgba(124,58,237,0.2)' }}>🏆</div>
            <div>
              <p className="font-semibold">Ranking Template</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Countdown-style #1 to #N short video
              </p>
            </div>
            <div className="ml-auto">
              <div className="w-5 h-5 rounded-full border-2 border-purple-500 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              </div>
            </div>
          </div>
          <p className="text-xs mt-2 ml-1" style={{ color: 'var(--text-secondary)' }}>
            More templates coming soon (Battle, React, Best-of...)
          </p>
        </section>

        {/* Mode selection */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
            EDITING MODE
          </h2>
          <div className="space-y-3">
            {MODES.map((m) => (
              <button
                key={m.id}
                id={`mode-${m.id}`}
                onClick={() => setMode(m.id)}
                className="w-full text-left glass-card p-5 flex items-start gap-4 transition-all"
                style={{
                  borderColor: mode === m.id ? 'rgba(124,58,237,0.5)' : 'var(--border)',
                  background: mode === m.id ? 'rgba(124,58,237,0.08)' : undefined,
                }}>
                <span className="text-2xl mt-0.5">{m.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold">{m.title}</span>
                    {m.badge && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: m.id === 'manual' ? 'rgba(16,185,129,0.1)' : 'rgba(124,58,237,0.1)',
                          color: m.id === 'manual' ? '#10b981' : '#a855f7',
                          border: `1px solid ${m.id === 'manual' ? 'rgba(16,185,129,0.2)' : 'rgba(124,58,237,0.2)'}`,
                        }}>
                        {m.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}
                    dangerouslySetInnerHTML={{ __html: m.desc }} />
                </div>
                <div className="w-5 h-5 rounded-full border-2 flex-shrink-0 mt-1 flex items-center justify-center"
                  style={{ borderColor: mode === m.id ? '#a855f7' : 'var(--border)' }}>
                  {mode === m.id && <div className="w-2.5 h-2.5 rounded-full bg-purple-400" />}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Assisted config */}
        {mode === 'assisted' && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
              AI FEATURES TO ENABLE
            </h2>
            <div className="glass-card p-5 space-y-4">
              {[
                { key: 'detectBestMoments' as const, label: 'Detect best moments', cost: '3 credits / video' },
                { key: 'generateTitles' as const, label: 'Generate item titles', cost: '1 credit / item' },
                { key: 'selectMusic' as const, label: 'Auto-select music', cost: '1 credit / project' },
              ].map(({ key, label, cost }) => (
                <label key={key} className="flex items-center gap-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assisted[key]}
                    onChange={(e) => setAssisted({ ...assisted, [key]: e.target.checked })}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: '#a855f7' }}
                  />
                  <span className="flex-1 text-sm">{label}</span>
                  <span className="text-xs" style={{ color: '#a855f7' }}>{cost}</span>
                </label>
              ))}
            </div>
          </section>
        )}

        {/* Project name */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
            PROJECT NAME
          </h2>
          <input
            id="project-name"
            type="text"
            className="input-base"
            placeholder='e.g. "Ranking Funniest Trash Fails"'
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            maxLength={80}
          />
        </section>

        <button
          id="create-project-submit"
          onClick={handleCreate}
          className="btn-primary w-full justify-center py-3 text-base"
          disabled={!name.trim() || loading}
        >
          {loading ? 'Creating...' : 'Create project →'}
        </button>
      </main>
    </div>
  );
}
