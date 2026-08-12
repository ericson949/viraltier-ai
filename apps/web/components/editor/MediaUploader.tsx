'use client';

import { useState, useRef } from 'react';
import { useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id, Doc } from '@/convex/_generated/dataModel';
import type { EditingPlan, RankingItem } from '@viraltier/types';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  projectId: Id<'projects'>;
  mediaItems: Doc<'mediaItems'>[];
  plan: EditingPlan | undefined;
  onPlanChange: (plan: EditingPlan) => void;
}

const ACCEPTED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska'];
const MAX_SIZE_MB = 500;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

interface UploadState {
  id: string;
  filename: string;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  error?: string;
}

export function MediaUploader({ projectId, mediaItems, plan, onPlanChange }: Props) {
  const generateUploadUrl = useMutation(api.media.generateUploadUrl);
  const registerMedia = useMutation(api.media.register);
  const removeMedia = useMutation(api.media.remove);
  const downloadAndRegisterUrl = useAction(api.media.downloadAndRegisterUrl);

  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [dragging, setDragging] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const registerUrl = useMutation(api.media.registerUrl);

  function updateUpload(id: string, update: Partial<UploadState>) {
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, ...update } : u)));
  }

  async function uploadFile(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      alert(`Unsupported format: ${file.type}. Use MP4, MOV, WebM, or MKV.`);
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      alert(`File too large: ${file.name}. Max 500 MB.`);
      return;
    }

    const uploadId = uuidv4();
    setUploads((prev) => [
      ...prev,
      { id: uploadId, filename: file.name, progress: 0, status: 'uploading' },
    ]);

    try {
      // Get signed upload URL from Convex
      const uploadUrl = await generateUploadUrl();

      // Upload directly to Convex Storage (XHR for progress tracking)
      const storageId = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 90);
            updateUpload(uploadId, { progress: pct });
          }
        });
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const { storageId } = JSON.parse(xhr.responseText) as { storageId: string };
            resolve(storageId);
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        });
        xhr.addEventListener('error', () => reject(new Error('Network error')));
        xhr.open('POST', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      updateUpload(uploadId, { progress: 95 });

      // Register in Convex DB
      const { mediaItemId } = await registerMedia({
        projectId,
        storageId: storageId as Id<'_storage'>,
        originalFilename: file.name,
        type: 'video',
      });

      // Add to editing plan
      if (plan && onPlanChange) {
        const newItem: RankingItem = {
          id: uuidv4(),
          rank: (plan.items.length || 0) + 1,
          mediaItemId,
          title: file.name.replace(/\.[^.]+$/, '').slice(0, 30),
          startTime: 0,
          endTime: 4,
          included: true,
        };
        const updatedPlan: EditingPlan = {
          ...plan,
          items: [...plan.items, newItem],
          displayOrder:
            plan.displayOrderMode === 'countdown'
              ? [...plan.items.map((i) => i.rank), newItem.rank].sort((a, b) => b - a)
              : [...plan.displayOrder, newItem.rank],
        };
        onPlanChange(updatedPlan);
      }

      updateUpload(uploadId, { progress: 100, status: 'done' });
      setTimeout(() => setUploads((prev) => prev.filter((u) => u.id !== uploadId)), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      updateUpload(uploadId, { status: 'error', error: msg });
    }
  }

  function handleFiles(files: FileList | File[]) {
    const remaining = 20 - mediaItems.filter((m) => m.type === 'video').length;
    const toUpload = Array.from(files).slice(0, remaining);
    toUpload.forEach(uploadFile);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  async function handleRemove(mediaItemId: Id<'mediaItems'>) {
    await removeMedia({ mediaItemId });
    if (plan && onPlanChange) {
      const updatedPlan: EditingPlan = {
        ...plan,
        items: plan.items.filter((i) => i.mediaItemId !== mediaItemId),
        displayOrder: plan.displayOrder.filter((rank) =>
          plan.items.some((i) => i.mediaItemId !== mediaItemId && i.rank === rank),
        ),
      };
      onPlanChange(updatedPlan);
    }
  }

  async function handleAddUrl() {
    const url = urlInput.trim();
    if (!url) return;

    const uploadId = uuidv4();
    const filename = url.split('/').pop()?.split('?')[0] || 'video.mp4';

    setUploads((prev) => [
      ...prev,
      { id: uploadId, filename: `🌐 Fetching & processing ${filename}...`, progress: 60, status: 'uploading' },
    ]);

    try {
      const { mediaItemId } = await downloadAndRegisterUrl({
        projectId,
        url,
      });

      // Add to editing plan
      if (plan && onPlanChange) {
        const newRank = (plan.items.length || 0) + 1;
        const newItem: RankingItem = {
          id: uuidv4(),
          rank: newRank,
          mediaItemId,
          title: filename.replace(/\.[^.]+$/, '').slice(0, 30),
          startTime: 0,
          endTime: 6,
          included: true,
        };
        const updatedPlan: EditingPlan = {
          ...plan,
          items: [...plan.items, newItem],
          displayOrder:
            plan.displayOrderMode === 'countdown'
              ? [...plan.items.map((i) => i.rank), newItem.rank].sort((a, b) => b - a)
              : [...plan.displayOrder, newItem.rank],
        };
        onPlanChange(updatedPlan);
      }

      updateUpload(uploadId, { progress: 100, status: 'done', filename: `✓ ${filename}` });
      setTimeout(() => setUploads((prev) => prev.filter((u) => u.id !== uploadId)), 3000);
      setUrlInput('');
      setShowUrlInput(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Download failed';
      updateUpload(uploadId, { status: 'error', error: msg });
    }
  }

  return (
    <div>
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="rounded-2xl p-8 text-center cursor-pointer transition-all"
        style={{
          border: `2px dashed ${dragging ? '#a855f7' : 'var(--border)'}`,
          background: dragging ? 'rgba(124,58,237,0.08)' : 'var(--surface)',
        }}
      >
        <div className="text-4xl mb-3">📁</div>
        <p className="font-medium mb-1">Drop videos here or click to browse</p>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          MP4, MOV, WebM, MKV · Max 500 MB each · Up to 20 videos
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* URL input */}
      <div className="flex gap-2 mt-3">
        {!showUrlInput ? (
          <button onClick={() => setShowUrlInput(true)} className="btn-ghost text-sm">
            🔗 Add from URL
          </button>
        ) : (
          <>
            <input
              className="input-base flex-1 text-sm"
              placeholder="Paste YouTube, TikTok or direct video URL..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
            />
            <button onClick={handleAddUrl} className="btn-secondary text-sm px-4">Download & Add</button>
            <button onClick={() => setShowUrlInput(false)} className="btn-ghost text-sm px-2">✕</button>
          </>
        )}
      </div>

      {/* Active uploads */}
      {uploads.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploads.map((u) => (
            <div key={u.id} className="glass-card px-4 py-3 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{u.filename}</p>
                {u.status === 'uploading' && (
                  <div className="progress-bar mt-1.5">
                    <div className="progress-fill" style={{ width: `${u.progress}%` }} />
                  </div>
                )}
                {u.status === 'error' && (
                  <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{u.error}</p>
                )}
              </div>
              <span className="text-sm flex-shrink-0" style={{
                color: u.status === 'done' ? '#10b981' : u.status === 'error' ? '#ef4444' : 'var(--text-secondary)',
              }}>
                {u.status === 'done' ? '✓' : u.status === 'error' ? '✕' : `${u.progress}%`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded media list */}
      {mediaItems.length > 0 && (
        <div className="mt-4 space-y-2">
          {mediaItems
            .filter((m) => m.type === 'video')
            .map((item) => (
              <div key={item._id} className="glass-card px-4 py-3 flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: 'var(--surface-2)' }}>
                  🎥
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.originalFilename}</p>
                  {item.duration && (
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {item.duration.toFixed(1)}s
                    </p>
                  )}
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                  ✓ uploaded
                </span>
                <button
                  onClick={() => handleRemove(item._id)}
                  className="btn-ghost text-xs px-2 py-1 flex-shrink-0"
                  style={{ color: '#ef4444' }}>
                  ✕
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
