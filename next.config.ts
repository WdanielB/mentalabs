import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Server actions aceptan 1 MB por defecto; las imágenes pueden llegar a 10 MB.
  // Al migrar a DigitalOcean Spaces, añadir aquí su hostname (*.digitaloceanspaces.com).
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'mnqbglyoeqkhzgzysnrx.supabase.co', pathname: '/storage/v1/object/public/**' },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: '11mb' },
    staleTimes: {
      dynamic: 60,  // client-side router cache for dynamic pages: 60s
      static: 300,  // static pages: 5m
    },
  },
};

export default nextConfig;
