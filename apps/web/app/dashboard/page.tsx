'use client';

import { useConvexAuth, useQuery, useMutation } from 'convex/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/convex/_generated/api';
import { AppHeader } from '@/components/layout/AppHeader';
import { EmptyProjects } from '@/components/dashboard/EmptyProjects';
import { ProjectCard } from '@/components/dashboard/ProjectCard';

export default function DashboardPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const projects = useQuery(api.projects.list, isAuthenticated ? {} : 'skip');
  const initCredits = useMutation(api.credits.initCredits);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [mounted, isAuthenticated, isLoading, router]);

  // Initialize credits on first login
  useEffect(() => {
    if (mounted && isAuthenticated) {
      initCredits().catch(() => {});
    }
  }, [mounted, isAuthenticated, initCredits]);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <AppHeader />
      <main className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>My Projects</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {projects?.length ?? 0} project{projects?.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link href="/projects/new" id="create-project-btn" className="btn-primary">
            + New video
          </Link>
        </div>

        {projects === undefined ? (
          // Loading skeleton
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-6" style={{ height: '200px' }}>
                <div className="skeleton h-5 w-3/4 mb-3" />
                <div className="skeleton h-4 w-1/2 mb-6" />
                <div className="skeleton h-3 w-full mb-2" />
                <div className="skeleton h-3 w-2/3" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <EmptyProjects />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
