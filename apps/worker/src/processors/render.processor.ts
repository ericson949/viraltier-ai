import path from 'path';
import fs from 'fs';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import type { Job } from 'bullmq';
import type { RenderJobPayload } from '@viraltier/types';
import { extractClip, normalizeAudio } from '../services/ffmpeg.service';
import { concatClips } from '../services/ffmpeg.service';
import { mergeMusicAndVideo } from '../services/ffmpeg.service';
import { reportProgress, uploadOutput } from '../services/convex.service';

export async function processRender(job: Job<RenderJobPayload>): Promise<void> {
  const { renderId, editingPlan, mediaUrls, musicUrl } = job.data;

  // Working directory for this render
  const workDir = path.join(os.tmpdir(), 'viraltier', renderId);
  fs.mkdirSync(workDir, { recursive: true });

  console.log(`[render:${renderId}] Starting — workDir: ${workDir}`);

  try {
    // ── Stage 1: Prepare assets (10%) ────────────────────────────────────
    await reportProgress(renderId, 10, 'preparing');
    await job.updateProgress(10);

    // Download and extract each clip in display order
    const clipPaths: string[] = [];
    const itemsInDisplayOrder = editingPlan.displayOrder
      .map((rank) => editingPlan.items.find((i) => i.rank === rank && i.included))
      .filter(Boolean) as (typeof editingPlan.items)[number][];

    // ── Stage 2: Extract clips (10–60%) ──────────────────────────────────
    for (let idx = 0; idx < itemsInDisplayOrder.length; idx++) {
      const item = itemsInDisplayOrder[idx]!;
      const sourceUrl = mediaUrls[item.mediaItemId];

      if (!sourceUrl) {
        console.warn(`[render:${renderId}] No URL for media ${item.mediaItemId}, skipping`);
        continue;
      }

      const clipPath = path.join(workDir, `clip_${item.rank}.mp4`);
      await extractClip({
        sourceUrl,
        startTime: item.startTime,
        endTime: item.endTime,
        outputPath: clipPath,
        ...(item.crop ? { crop: item.crop } : {}),
      });

      // Normalize audio
      const normPath = path.join(workDir, `clip_${item.rank}_norm.mp4`);
      await normalizeAudio(clipPath, normPath);

      clipPaths.push(normPath);

      const progress = 10 + Math.round(((idx + 1) / itemsInDisplayOrder.length) * 50);
      await reportProgress(renderId, progress, 'extracting');
      await job.updateProgress(progress);
    }

    if (clipPaths.length === 0) {
      throw new Error('No valid clips to render');
    }

    // ── Stage 3: Concatenate clips (60–75%) ──────────────────────────────
    await reportProgress(renderId, 65, 'compositing');
    await job.updateProgress(65);

    const concatPath = path.join(workDir, 'concat.mp4');
    await concatClips(clipPaths, concatPath);

    // ── Stage 4: Merge music (75–90%) ────────────────────────────────────
    await reportProgress(renderId, 75, 'merging');
    await job.updateProgress(75);

    const outputPath = path.join(workDir, 'output_final.mp4');

    if (musicUrl && editingPlan.audio.musicVolume > 0) {
      await mergeMusicAndVideo({
        videoPath: concatPath,
        musicUrl,
        musicVolume: editingPlan.audio.musicVolume,
        outputPath,
      });
    } else {
      fs.copyFileSync(concatPath, outputPath);
    }

    // ── Stage 5: Upload output (90–100%) ─────────────────────────────────
    await reportProgress(renderId, 90, 'uploading');
    await job.updateProgress(90);

    await uploadOutput(renderId, outputPath);

    await job.updateProgress(100);
    console.log(`[render:${renderId}] Complete ✓`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[render:${renderId}] Error: ${msg}`);
    await reportProgress(renderId, 0, 'done', msg);
    throw err;
  } finally {
    // Clean up working directory
    try {
      fs.rmSync(workDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }
}
