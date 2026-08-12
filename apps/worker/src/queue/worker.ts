import { Worker } from 'bullmq';
import { connection } from './connection';
import { processRender } from '../processors/render.processor';
import type { RenderJobPayload } from '@viraltier/types';

export function startWorker(): void {
  const worker = new Worker<RenderJobPayload>('renders', processRender, {
    connection,
    concurrency: 1, // 1 render at a time (FFmpeg is CPU-intensive)
    limiter: {
      max: 1,
      duration: 1000,
    },
  });

  worker.on('completed', (job) => {
    console.log(`[worker] Job completed: ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[worker] Job failed: ${job?.id}`, err.message);
  });

  worker.on('progress', (job, progress) => {
    console.log(`[worker] Job ${job.id} progress: ${progress}%`);
  });

  console.log('[worker] BullMQ worker started, listening for render jobs...');
}
