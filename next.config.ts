import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 60,  // client-side router cache for dynamic pages: 60s
      static: 300,  // static pages: 5m
    },
  },
};

export default nextConfig;
