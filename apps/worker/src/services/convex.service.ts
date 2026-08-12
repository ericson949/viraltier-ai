import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

const convexUrl = process.env['CONVEX_HTTP_URL'];
const workerSecret = process.env['WORKER_SECRET'];

function convexHttpUrl(endpoint: string): string {
  if (!convexUrl) throw new Error('CONVEX_HTTP_URL not set');
  return `${convexUrl}${endpoint}`;
}

/**
 * Report render progress to Convex via HTTP action.
 */
export async function reportProgress(
  renderId: string,
  progress: number,
  stage: string,
  errorMessage?: string,
): Promise<void> {
  try {
    const res = await fetch(convexHttpUrl('/worker/update-render'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-worker-secret': workerSecret ?? '',
      },
      body: JSON.stringify({ renderId, progress, stage, errorMessage }),
    });

    if (!res.ok) {
      console.warn(`[convex] reportProgress failed: ${res.status} ${await res.text()}`);
    }
  } catch (err) {
    console.warn('[convex] reportProgress error (non-fatal):', err);
  }
}

/**
 * Upload the final output file to Convex Storage via the completion endpoint.
 */
export async function uploadOutput(renderId: string, filePath: string): Promise<void> {
  const form = new FormData();
  form.append('renderId', renderId);
  form.append('file', fs.createReadStream(filePath), {
    filename: `render_${renderId}.mp4`,
    contentType: 'video/mp4',
  });

  const res = await fetch(convexHttpUrl('/worker/complete-render'), {
    method: 'POST',
    headers: {
      ...form.getHeaders(),
      'x-worker-secret': workerSecret ?? '',
    },
    body: form,
  });

  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status} ${await res.text()}`);
  }

  console.log(`[convex] Output uploaded for render ${renderId}`);
}
