import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile workspace packages
  transpilePackages: ['@viraltier/types'],

  // Allow images from Convex storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.convex.cloud',
      },
    ],
  },

  webpack(config) {
    config.resolve.alias['@/convex'] = path.resolve(__dirname, '../../convex');
    return config;
  },
};

export default nextConfig;

