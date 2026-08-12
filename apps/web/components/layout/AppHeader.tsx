'use client';

import { useConvexAuth, useQuery } from 'convex/react';
import { useAuthActions } from '@convex-dev/auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/convex/_generated/api';

export function AppHeader() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const router = useRouter();
  const balance = useQuery(api.credits.getBalance, isAuthenticated ? {} : 'skip');

  async function handleSignOut() {
    await signOut();
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-4"
      style={{
        background: 'rgba(10,10,15,0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
      }}>
      <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <span className="text-xl">⚡</span>
        <span className="font-bold" style={{ fontFamily: 'Space Grotesk' }}>
          viral<span className="gradient-text">Tier</span>.ai
        </span>
      </Link>

      {isAuthenticated && (
        <div className="flex items-center gap-4">
          <Link href="/library/music" className="btn-ghost text-sm">
            🎵 Music
          </Link>
          <Link href="/account" className="credit-badge">
            ⚡ {balance ?? '—'} credits
          </Link>
          <button id="sign-out-btn" onClick={handleSignOut} className="btn-ghost text-sm">
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}
