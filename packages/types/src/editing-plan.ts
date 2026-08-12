// =============================================================================
// viralTier.ai — Core EditingPlan types
// This is the central data structure consumed by the rendering pipeline.
// AI never touches video directly — it only produces/modifies this JSON.
// =============================================================================

export type RankingStyle = 'numeric' | 'ordinal' | 'emoji';
// numeric: #1, #2, #3
// ordinal: 1st, 2nd, 3rd
// emoji:   🥇 🥈 🥉 for top 3, then #4, #5...

export type TransitionType = 'cut' | 'fade' | 'slide' | 'zoom';

export type DisplayOrderMode = 'countdown' | 'sequential' | 'custom';

export interface CropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Transition {
  type: TransitionType;
  /** Duration in seconds */
  duration: number;
}

export interface AIGeneratedFlags {
  title: boolean;
  startTime: boolean;
  endTime: boolean;
}

export interface RankingItem {
  id: string;
  /** 1 = best (#1). Determines the rank label shown on screen. */
  rank: number;
  /** Reference to the Convex media document _id */
  mediaItemId: string;
  /** Label shown on screen, e.g. "Epic Trash Fail 😂". Max 30 chars. */
  title: string;
  /** Clip start time in seconds (within the source video) */
  startTime: number;
  /** Clip end time in seconds (within the source video) */
  endTime: number;
  /** Optional crop region for the source frame */
  crop?: CropRegion;
  /** Transition to apply at the END of this clip (before next clip) */
  transition?: Transition;
  /** Tracks which fields were AI-generated */
  aiGenerated?: AIGeneratedFlags;
  /** Whether this item is included in the output */
  included: boolean;
}

export interface AudioConfig {
  /** Reference to a music_tracks Convex document _id */
  musicTrackId?: string;
  /** Direct storage path (if custom track uploaded) */
  musicStoragePath?: string;
  /** 0 to 1. Default 0.25 */
  musicVolume: number;
  /** Whether music was auto-selected by AI */
  musicAutoSelected?: boolean;
}

export interface EffectsConfig {
  autoZoom: boolean;
  transitions: boolean;
  soundEffects: boolean;
}

export interface TitleOverlay {
  text: string;
  position: 'top' | 'bottom';
  style: 'default' | 'bold' | 'minimal';
}

export interface EditingPlan {
  template: 'ranking';
  /** Permanent top overlay text, e.g. "Ranking Funniest Trash Fails" */
  title: string;
  aspectRatio: '9:16';
  /** Total video duration in seconds (auto-computed from items) */
  targetDuration: number;

  rankingStyle: {
    type: RankingStyle;
  };

  /**
   * All ranking items, ordered by rank ascending (rank 1 = first in array).
   * rank determines the LABEL (#1, 🥇, etc.)
   * displayOrder determines when each clip APPEARS in the timeline.
   */
  items: RankingItem[];

  /**
   * Rank values in the order they appear in the video timeline.
   * e.g. [5, 4, 3, 2, 1] = countdown from worst to best
   *      [1, 2, 3, 4, 5] = sequential best to worst
   *      custom array    = user-defined order
   */
  displayOrder: number[];

  /** Mode that generated displayOrder (for UI display) */
  displayOrderMode: DisplayOrderMode;

  audio: AudioConfig;
  effects: EffectsConfig;
  titleOverlay: TitleOverlay;
}

// =============================================================================
// Mode types
// =============================================================================

export type ProjectMode = 'ai' | 'assisted' | 'manual';
export type ProjectStatus = 'draft' | 'ready' | 'rendering' | 'done' | 'error';
export type RenderStatus = 'queued' | 'processing' | 'done' | 'error';
export type MediaType = 'video' | 'audio' | 'image';

export interface AssistedModeConfig {
  detectBestMoments: boolean;  // 3 credits per video
  generateTitles: boolean;     // 1 credit per item
  selectMusic: boolean;        // 1 credit per project
}

// =============================================================================
// AI Analysis result (stored in Convex)
// =============================================================================

export type ContentType = 'fail' | 'sports' | 'food' | 'animal' | 'reaction' | 'other';
export type ActionLevel = 'low' | 'medium' | 'high';

export interface InterestingMoment {
  startSeconds: number;
  endSeconds: number;
  reason: string;
}

export interface VideoAnalysisResult {
  contentType: ContentType;
  facesDetected: boolean;
  speechDetected: boolean;
  actionLevel: ActionLevel;
  qualityScore: number; // 0–100
  interestingMoments: InterestingMoment[];
  /** Ideal clip length in seconds (2–6s) */
  suggestedClipDuration: number;
}

// =============================================================================
// Worker job payload (sent via BullMQ / Convex HTTP actions)
// =============================================================================

export interface RenderJobPayload {
  renderId: string;
  projectId: string;
  editingPlan: EditingPlan;
  /** Map of mediaItemId → signed download URL for the source video */
  mediaUrls: Record<string, string>;
  /** Optional music file URL */
  musicUrl?: string;
}

export interface RenderProgressUpdate {
  renderId: string;
  progress: number; // 0–100
  stage: 'preparing' | 'extracting' | 'compositing' | 'merging' | 'uploading' | 'done';
  errorMessage?: string;
}

// =============================================================================
// Credit costs (kept here for use across frontend + backend)
// =============================================================================

export const CREDIT_COSTS = {
  BEST_MOMENT_DETECTION: 3,  // per video
  TITLE_GENERATION: 1,       // per item
  MUSIC_SELECTION: 1,        // per project
  SIGNUP_BONUS: 50,
} as const;
