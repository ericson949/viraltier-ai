import express from 'express';
import { Queue } from 'bullmq';
import { connection } from './queue/connection';
import { startWorker } from './queue/worker';
import type { RenderJobPayload } from '@viraltier/types';

const app = express();
app.use(express.json({ limit: '10mb' }));

const renderQueue = new Queue<RenderJobPayload>('renders', { connection });

// ── Health check ──────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

// ── Receive render job from Convex ────────────────────────────────────────
app.post('/render', async (req, res) => {
  const secret = req.headers['x-worker-secret'];
  if (!secret || secret !== process.env['WORKER_SECRET']) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const payload = req.body as RenderJobPayload;

  if (!payload.renderId || !payload.editingPlan) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  await renderQueue.add('render', payload, {
    jobId: payload.renderId,
    attempts: 2,
    backoff: { type: 'fixed', delay: 5000 },
  });

  console.log(`[worker] Queued render job: ${payload.renderId}`);
  return res.json({ queued: true, renderId: payload.renderId });
});

const PORT = parseInt(process.env['PORT'] ?? '3002', 10);

// Start BullMQ worker
startWorker();

app.listen(PORT, () => {
  console.log(`[worker] HTTP server listening on :${PORT}`);
});
