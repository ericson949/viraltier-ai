import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { api } from './_generated/api';
import { Id } from './_generated/dataModel';
import { auth } from './auth';

const http = httpRouter();

auth.addHttpRoutes(http);

/**
 * Worker progress callback endpoint.
 * The Docker worker calls this to update render progress.
 * Protected by WORKER_SECRET header.
 */
http.route({
  path: '/worker/update-render',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    // Validate worker secret
    const secret = request.headers.get('x-worker-secret');
    if (!secret || secret !== process.env['WORKER_SECRET']) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json() as {
      renderId: string;
      progress: number;
      stage: string;
      errorMessage?: string;
    };

    await ctx.runMutation(api.renders.updateProgress, {
      renderId: body.renderId as Id<'renders'>,
      progress: body.progress,
      stage: body.stage,
      errorMessage: body.errorMessage,
    });

    return new Response('OK', { status: 200 });
  }),
});

/**
 * Worker completion endpoint.
 * Worker calls this when render is done and uploads the output file.
 */
http.route({
  path: '/worker/complete-render',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const secret = request.headers.get('x-worker-secret');
    if (!secret || secret !== process.env['WORKER_SECRET']) {
      return new Response('Unauthorized', { status: 401 });
    }

    // The worker sends the output file as a multipart form
    const formData = await request.formData();
    const renderId = formData.get('renderId') as string;
    const file = formData.get('file') as File | null;

    if (!file) {
      return new Response('Missing file', { status: 400 });
    }

    // Upload to Convex Storage
    const uploadUrl = await ctx.storage.generateUploadUrl();
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: file,
      headers: { 'Content-Type': 'video/mp4' },
    });

    if (!uploadResponse.ok) {
      return new Response('Upload failed', { status: 500 });
    }

    const { storageId } = await uploadResponse.json() as { storageId: string };

    await ctx.runMutation(api.renders.updateProgress, {
      renderId: renderId as Id<'renders'>,
      progress: 100,
      stage: 'done',
      outputStorageId: storageId as Id<'_storage'>,
    });

    return new Response('OK', { status: 200 });
  }),
});

/**
 * Worker pending-renders poll endpoint.
 * The Docker worker polls this to get queued render jobs.
 */
http.route({
  path: '/worker/pending-renders',
  method: 'GET',
  handler: httpAction(async (ctx, request) => {
    const secret = request.headers.get('x-worker-secret');
    if (!secret || secret !== process.env['WORKER_SECRET']) {
      return new Response('Unauthorized', { status: 401 });
    }

    const pending = await ctx.runQuery(api.renders.getPendingForWorker, {});

    return new Response(JSON.stringify(pending), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
});

export default http;
