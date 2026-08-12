import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import os from 'os';
import type { CropRegion } from '@viraltier/types';

/**
 * Extract a clip from a source URL (or local path) using FFmpeg.
 * Output is scaled/cropped to 1080×1920 (9:16).
 */
export function extractClip(opts: {
  sourceUrl: string;
  startTime: number;
  endTime: number;
  outputPath: string;
  crop?: CropRegion;
}): Promise<void> {
  const { sourceUrl, startTime, endTime, outputPath, crop } = opts;
  const duration = endTime - startTime;

  return new Promise((resolve, reject) => {
    let vf = 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920';

    if (crop) {
      // Apply user-defined crop before scaling
      vf = `crop=${crop.width}:${crop.height}:${crop.x}:${crop.y},${vf}`;
    }

    ffmpeg(sourceUrl)
      .inputOptions([`-ss ${startTime}`, `-t ${duration}`])
      .videoFilter(vf)
      .outputOptions([
        '-c:v libx264',
        '-c:a aac',
        '-preset fast',
        '-crf 23',
        '-movflags +faststart',
        '-y',
      ])
      .output(outputPath)
      .on('start', (cmd) => console.log(`[ffmpeg] extractClip: ${cmd}`))
      .on('error', reject)
      .on('end', () => resolve())
      .run();
  });
}

/**
 * Normalize audio loudness to -23 LUFS (EBU R128).
 */
export function normalizeAudio(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFilter('loudnorm=I=-23:LRA=7:TP=-2')
      .outputOptions(['-c:v copy', '-y'])
      .output(outputPath)
      .on('error', reject)
      .on('end', () => resolve())
      .run();
  });
}

/**
 * Concatenate multiple clip files into a single video.
 * Uses FFmpeg concat demuxer (lossless, fast).
 */
export async function concatClips(clipPaths: string[], outputPath: string): Promise<void> {
  // Write concat list file
  const listPath = path.join(path.dirname(outputPath), 'concat_list.txt');
  const lines = clipPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n');
  fs.writeFileSync(listPath, lines);

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(listPath)
      .inputOptions(['-f concat', '-safe 0'])
      .outputOptions(['-c copy', '-movflags +faststart', '-y'])
      .output(outputPath)
      .on('error', reject)
      .on('end', () => {
        fs.unlinkSync(listPath);
        resolve();
      })
      .run();
  });
}

/**
 * Merge background music into the video.
 * Music is mixed under the video's existing audio at the specified volume.
 */
export function mergeMusicAndVideo(opts: {
  videoPath: string;
  musicUrl: string;
  musicVolume: number;
  outputPath: string;
}): Promise<void> {
  const { videoPath, musicUrl, musicVolume, outputPath } = opts;

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(videoPath)
      .input(musicUrl)
      .complexFilter([
        `[1:a]volume=${musicVolume}[music]`,
        '[0:a][music]amix=inputs=2:duration=first:dropout_transition=2[a]',
      ])
      .outputOptions([
        '-map 0:v',
        '-map [a]',
        '-c:v libx264',
        '-c:a aac',
        '-b:v 6000k',
        '-b:a 192k',
        '-preset fast',
        '-movflags +faststart',
        '-y',
      ])
      .output(outputPath)
      .on('error', reject)
      .on('end', () => resolve())
      .run();
  });
}

/**
 * Get video metadata (duration, width, height).
 */
export function getVideoMetadata(
  filePath: string,
): Promise<{ duration: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, meta) => {
      if (err) return reject(err);
      const videoStream = meta.streams.find((s) => s.codec_type === 'video');
      resolve({
        duration: meta.format.duration ?? 0,
        width: videoStream?.width ?? 0,
        height: videoStream?.height ?? 0,
      });
    });
  });
}
