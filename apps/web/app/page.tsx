import Link from 'next/link';

const features = [
  {
    icon: '🤖',
    title: 'AI-Powered Analysis',
    description: 'GPT-4o Vision detects the best moments in every clip automatically.',
  },
  {
    icon: '🎬',
    title: 'Ranking Template',
    description: 'Pro-grade #1 to #N countdown videos, optimized for viral engagement.',
  },
  {
    icon: '✋',
    title: 'Manual Mode — Free',
    description: 'Full control with zero AI calls. Trim, rank, and render for free.',
  },
  {
    icon: '⚡',
    title: 'Lightning Fast Render',
    description: 'FFmpeg + Remotion pipeline. A 30-second video renders in under 2 minutes.',
  },
  {
    icon: '📱',
    title: '9:16 Native Output',
    description: 'Perfect for YouTube Shorts, TikTok, and Instagram Reels. 1080×1920.',
  },
  {
    icon: '🎵',
    title: 'Built-in Music Library',
    description: 'Royalty-free tracks, AI-matched to your video energy.',
  },
];

const steps = [
  { num: '01', title: 'Upload your clips', desc: 'Drop up to 20 videos. We handle all formats.' },
  { num: '02', title: 'Rank & trim', desc: 'Drag to reorder. Set start/end or let AI do it.' },
  { num: '03', title: 'Generate & share', desc: 'One click. Download your viral short in minutes.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ background: 'rgba(10,10,15,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <span className="font-bold text-lg" style={{ fontFamily: 'Space Grotesk' }}>
            viral<span className="gradient-text">Tier</span>.ai
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost">Sign in</Link>
          <Link href="/login?signup=true" className="btn-primary">
            Start for free →
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="pt-36 pb-24 px-6 text-center relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 40% at 50% 20%, rgba(124,58,237,0.15) 0%, transparent 70%)',
          }} />

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
            style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)' }}>
            <span className="text-sm">🔥</span>
            <span className="text-sm font-medium" style={{ color: '#a855f7' }}>
              50 free credits on sign-up
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight" style={{ fontFamily: 'Space Grotesk' }}>
            Turn your clips into{' '}
            <span className="gradient-text">viral ranking</span>{' '}
            videos
          </h1>

          <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            AI-powered editor that transforms raw footage into #1-to-#5 countdown
            Shorts, optimized for TikTok, YouTube, and Reels.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login?signup=true"
              className="btn-primary text-base px-8 py-4"
              style={{ borderRadius: '12px', fontSize: '16px' }}>
              Create your first video — free
            </Link>
            <button className="btn-secondary text-base px-8 py-4" style={{ borderRadius: '12px', fontSize: '16px' }}>
              ▶ Watch demo
            </button>
          </div>

          <p className="text-sm mt-5" style={{ color: 'var(--text-secondary)' }}>
            No credit card required · Manual mode is always free
          </p>
        </div>

        {/* ── Mock ranking video preview ─────────────────────────────────── */}
        <div className="mt-20 max-w-xs mx-auto relative">
          <div className="rounded-3xl overflow-hidden relative"
            style={{
              background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
              border: '2px solid rgba(124,58,237,0.3)',
              aspectRatio: '9/16',
              boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 60px var(--accent-glow)',
            }}>
            {/* Video mock content */}
            <div className="absolute inset-0 flex flex-col">
              {/* Top overlay */}
              <div className="p-4 text-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
                <p className="text-sm font-bold text-white">Ranking Funniest Fails</p>
              </div>
              {/* Video area */}
              <div className="flex-1 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)' }}>
                <span style={{ fontSize: '80px' }}>😂</span>
              </div>
              {/* Rank label */}
              <div className="absolute top-16 left-4">
                <div className="rank-badge-1" style={{ fontSize: '28px', width: '56px', height: '56px', borderRadius: '12px' }}>
                  🥇
                </div>
              </div>
              {/* Title bar */}
              <div className="p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
                <p className="text-base font-bold text-white">Epic Trash Fail 😂</p>
                <div className="flex gap-1 mt-2">
                  {['#5','#4','#3','#2','#1'].map((r) => (
                    <div key={r} className="h-1 flex-1 rounded-full"
                      style={{ background: r === '#1' ? '#a855f7' : 'rgba(255,255,255,0.2)' }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Floating badges */}
          <div className="absolute -right-8 top-1/4 glass-card px-3 py-2 text-xs font-medium"
            style={{ transform: 'rotate(3deg)' }}>
            🤖 AI Mode
          </div>
          <div className="absolute -left-8 top-1/2 glass-card px-3 py-2 text-xs font-medium"
            style={{ transform: 'rotate(-3deg)' }}>
            ⚡ 28.4s video
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section className="py-24 px-6 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-16" style={{ fontFamily: 'Space Grotesk' }}>
          From clips to viral in 3 steps
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.num} className="glass-card p-8 text-center relative overflow-hidden">
              <div className="absolute -top-4 -right-4 text-8xl font-black opacity-5" style={{ fontFamily: 'Space Grotesk' }}>
                {step.num}
              </div>
              <div className="text-5xl font-black gradient-text mb-4" style={{ fontFamily: 'Space Grotesk' }}>
                {step.num}
              </div>
              <h3 className="text-lg font-bold mb-2">{step.title}</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section className="py-24 px-6"
        style={{ background: 'rgba(124,58,237,0.03)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4" style={{ fontFamily: 'Space Grotesk' }}>
            Everything you need
          </h2>
          <p className="text-center mb-16" style={{ color: 'var(--text-secondary)' }}>
            Professional-grade tools. Zero video editing experience required.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="glass-card-hover p-6">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-base mb-2">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk' }}>
          Simple, pay-as-you-go credits
        </h2>
        <p className="mb-12" style={{ color: 'var(--text-secondary)' }}>
          Manual mode is always free. Credits are only used for AI features.
        </p>
        <div className="grid md:grid-cols-2 gap-6 text-left">
          {[
            { feature: 'Manual mode + rendering', cost: 'Free forever', highlight: true },
            { feature: 'Best moment detection', cost: '3 credits / video' },
            { feature: 'Title generation', cost: '1 credit / item' },
            { feature: 'Music auto-selection', cost: '1 credit / project' },
          ].map((row) => (
            <div key={row.feature} className={`glass-card p-5 flex justify-between items-center ${row.highlight ? 'border-purple-500/30' : ''}`}
              style={row.highlight ? { borderColor: 'rgba(168,85,247,0.3)', background: 'rgba(124,58,237,0.05)' } : {}}>
              <span className="text-sm">{row.feature}</span>
              <span className={`text-sm font-bold ${row.highlight ? 'gradient-text' : ''}`}
                style={!row.highlight ? { color: '#a855f7' } : {}}>
                {row.cost}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-8 p-4 rounded-2xl text-sm"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981' }}>
          🎁 Get <strong>50 free credits</strong> on sign-up — no credit card needed
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(124,58,237,0.08) 0%, transparent 70%)' }} />
        <div className="relative max-w-2xl mx-auto">
          <h2 className="text-4xl font-black mb-4" style={{ fontFamily: 'Space Grotesk' }}>
            Ready to go <span className="gradient-text">viral</span>?
          </h2>
          <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
            Join creators turning raw footage into viral content every day.
          </p>
          <Link href="/login?signup=true" className="btn-primary text-lg px-10 py-4" style={{ borderRadius: '14px' }}>
            Start creating for free →
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="px-6 py-8 text-center text-sm"
        style={{ borderTop: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
        © 2025 viralTier.ai · Built with Next.js, Convex & FFmpeg
      </footer>
    </div>
  );
}
