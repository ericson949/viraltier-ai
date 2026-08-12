import Link from 'next/link';

export function EmptyProjects() {
  return (
    <div className="text-center py-10">
      <div className="text-6xl mb-4">🎬</div>
      <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>
        No projects yet
      </h2>
      <p className="mb-6 text-sm max-w-sm mx-auto" style={{ color: 'var(--text-secondary)' }}>
        Create your first ranking video. It takes less than 5 minutes.
      </p>
      <Link href="/projects/new" id="empty-create-btn" className="btn-primary py-2.5 px-5 text-sm">
        + Create your first video
      </Link>
    </div>
  );
}
