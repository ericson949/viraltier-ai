import IORedis from 'ioredis';

const redisUrl = process.env['REDIS_URL'] ?? 'redis://localhost:6379';

export const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

connection.on('connect', () => console.log('[redis] Connected'));
connection.on('error', (err) => console.error('[redis] Error:', err.message));
