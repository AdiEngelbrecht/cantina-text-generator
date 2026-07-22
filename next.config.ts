import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // Remotion compositions are bundled separately by @remotion/bundler,
  // so nothing Remotion-specific is required here.
  experimental: {
    // Large video uploads (cantina response clips)
    serverActions: {bodySizeLimit: '200mb'},
  },
};

export default nextConfig;
