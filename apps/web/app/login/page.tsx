'use client';

import { useAuthActions } from '@convex-dev/auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import Link from 'next/link';

function AuthForm() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const params = useSearchParams();
  const isSignUp = params.get('signup') === 'true';

  const [mode, setMode] = useState<'signin' | 'signup'>(isSignUp ? 'signup' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      formData.append('flow', mode === 'signup' ? 'signUp' : 'signIn');
      if (mode === 'signup' && name) {
        formData.append('name', name);
      }

      await signIn('password', formData);
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      console.error('Auth error:', err);
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-4 overflow-hidden" style={{ background: 'var(--background)' }}>
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 20%, rgba(124,58,237,0.12) 0%, transparent 70%)' }} />

      <div className="w-full max-w-md relative my-auto">
        {/* Logo */}
        <div className="text-center mb-4">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <span className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>
              viral<span className="gradient-text">Tier</span>.ai
            </span>
          </Link>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
            {mode === 'signup' ? 'Create your account — get 50 free credits' : 'Welcome back'}
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-7">
          {/* Toggle */}
          <div className="flex rounded-xl overflow-hidden mb-5 p-1"
            style={{ background: 'var(--surface)' }}>
            <button
              className="flex-1 py-2 text-sm font-medium rounded-lg transition-all"
              style={{
                background: mode === 'signin' ? 'var(--surface-2)' : 'transparent',
                color: mode === 'signin' ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
              onClick={() => setMode('signin')}
            >
              Sign in
            </button>
            <button
              className="flex-1 py-2 text-sm font-medium rounded-lg transition-all"
              style={{
                background: mode === 'signup' ? 'var(--surface-2)' : 'transparent',
                color: mode === 'signup' ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
              onClick={() => setMode('signup')}
            >
              Create account
            </button>
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={() => signIn('google', { redirectTo: '/dashboard' })}
            className="btn-secondary w-full justify-center py-2.5 mb-4 flex items-center gap-2 text-sm font-medium"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative flex py-1 items-center mb-4">
            <div className="flex-grow border-t" style={{ borderColor: 'var(--border)' }}></div>
            <span className="flex-shrink mx-3 text-xs" style={{ color: 'var(--text-secondary)' }}>or with email</span>
            <div className="flex-grow border-t" style={{ borderColor: 'var(--border)' }}></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  className="input-base"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Email address
              </label>
              <input
                id="email"
                type="email"
                className="input-base"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                className="input-base"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg text-sm"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                {error}
              </div>
            )}

            <button
              id="submit-auth"
              type="submit"
              className="btn-primary w-full justify-center py-3 text-sm font-semibold mt-2"
              disabled={loading}
            >
              {loading ? '...' : mode === 'signup' ? 'Create account' : 'Sign in'}
            </button>
          </form>

          {mode === 'signup' && (
            <p className="mt-4 text-center text-xs" style={{ color: 'var(--text-secondary)' }}>
              🎁 You&apos;ll receive <strong style={{ color: '#a855f7' }}>50 free credits</strong> on sign-up
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: 'var(--background)' }} />}>
      <AuthForm />
    </Suspense>
  );
}
