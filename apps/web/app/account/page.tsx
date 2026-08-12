'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { AppHeader } from '@/components/layout/AppHeader';
import { useAuthActions } from '@convex-dev/auth/react';
import { useRouter } from 'next/navigation';

export default function AccountPage() {
  const balance = useQuery(api.credits.getBalance);
  const transactions = useQuery(api.credits.getTransactions);
  const { signOut } = useAuthActions();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push('/');
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <AppHeader />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-8" style={{ fontFamily: 'Space Grotesk' }}>Account</h1>

        {/* Credits card */}
        <div className="glass-card p-8 mb-6 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(168,85,247,0.05))' }}>
          <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Credit Balance</p>
          <p className="text-6xl font-black gradient-text mb-2" style={{ fontFamily: 'Space Grotesk' }}>
            {balance ?? '—'}
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>credits remaining</p>
        </div>

        {/* Credit cost reference */}
        <div className="glass-card p-5 mb-6">
          <h2 className="font-semibold mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
            CREDIT COSTS
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Best moment detection', cost: '3 per video' },
              { label: 'Title generation', cost: '1 per item' },
              { label: 'Music auto-selection', cost: '1 per project' },
              { label: 'Manual mode + rendering', cost: 'Free' },
            ].map(({ label, cost }) => (
              <div key={label} className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                <span className="font-medium" style={{ color: cost === 'Free' ? '#10b981' : '#a855f7' }}>{cost}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction history */}
        <div className="glass-card overflow-hidden mb-6">
          <div className="p-5" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>
              TRANSACTION HISTORY
            </h2>
          </div>
          {transactions === undefined ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-10 w-full rounded-lg" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
              No transactions yet.
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {transactions.map((tx) => (
                <div key={tx._id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm">{tx.reason}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(tx._creationTime).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="font-bold text-sm"
                    style={{ color: tx.amount > 0 ? '#10b981' : '#ef4444' }}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={handleSignOut} className="btn-secondary w-full justify-center">
          Sign out
        </button>
      </main>
    </div>
  );
}
