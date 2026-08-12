import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { RankingVideo } from './compositions/RankingVideo';
import type { EditingPlan } from '@viraltier/types';

const DEFAULT_PLAN: EditingPlan = {
  template: 'ranking',
  title: 'My Ranking Video',
  aspectRatio: '9:16',
  targetDuration: 20,
  rankingStyle: { type: 'emoji' },
  items: [
    { id: '1', rank: 1, mediaItemId: '', title: 'Top Clip 🥇', startTime: 0, endTime: 4, included: true },
    { id: '2', rank: 2, mediaItemId: '', title: 'Second Place', startTime: 0, endTime: 4, included: true },
    { id: '3', rank: 3, mediaItemId: '', title: 'Third Place', startTime: 0, endTime: 4, included: true },
  ],
  displayOrder: [3, 2, 1],
  displayOrderMode: 'countdown',
  audio: { musicVolume: 0.25 },
  effects: { autoZoom: true, transitions: true, soundEffects: true },
  titleOverlay: { text: 'My Ranking Video', position: 'top', style: 'default' },
};

const DEFAULT_MEDIA_URLS: Record<string, string> = {};

registerRoot(() => (
  <Composition
    id="RankingVideo"
    component={RankingVideo}
    durationInFrames={Math.round(DEFAULT_PLAN.targetDuration * 30)}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={{
      plan: DEFAULT_PLAN,
      mediaUrls: DEFAULT_MEDIA_URLS,
    }}
  />
));
