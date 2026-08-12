import { internalMutation } from './_generated/server';

/**
 * Seed the music library with royalty-free tracks.
 * Run with: npx convex run seed:seedMusicTracks
 */
export const seedMusicTracks = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query('musicTracks').first();
    if (existing) {
      console.log('Music tracks already seeded, skipping.');
      return;
    }

    const tracks = [
      {
        name: 'Energetic Hip Hop',
        artist: 'Free Music Archive',
        publicUrl:
          'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        duration: 372,
        bpm: 128,
        mood: ['energetic', 'upbeat'] as ('energetic' | 'upbeat')[],
        genre: 'hip-hop',
      },
      {
        name: 'Chill Lo-Fi Beat',
        artist: 'Free Music Archive',
        publicUrl:
          'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        duration: 240,
        bpm: 85,
        mood: ['chill'] as ('chill')[],
        genre: 'lo-fi',
      },
      {
        name: 'Dramatic Cinematic',
        artist: 'Free Music Archive',
        publicUrl:
          'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        duration: 290,
        bpm: 90,
        mood: ['dramatic'] as ('dramatic')[],
        genre: 'cinematic',
      },
      {
        name: 'Fun Party Vibes',
        artist: 'Free Music Archive',
        publicUrl:
          'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
        duration: 180,
        bpm: 140,
        mood: ['funny', 'upbeat', 'energetic'] as ('funny' | 'upbeat' | 'energetic')[],
        genre: 'pop',
      },
      {
        name: 'Upbeat Corporate',
        artist: 'Free Music Archive',
        publicUrl:
          'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
        duration: 210,
        bpm: 110,
        mood: ['upbeat', 'energetic'] as ('upbeat' | 'energetic')[],
        genre: 'corporate',
      },
    ];

    for (const track of tracks) {
      await ctx.db.insert('musicTracks', track);
    }

    console.log(`Seeded ${tracks.length} music tracks.`);
  },
});
