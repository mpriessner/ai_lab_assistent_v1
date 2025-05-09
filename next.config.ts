import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    allowedDevOrigins: ['http://127.0.0.1:54305', 'http://127.0.0.1:61530', 'http://localhost:9002'],
    serverActions: {
      allowedOrigins: ['127.0.0.1:54305', '127.0.0.1:61530', 'localhost:9002'],
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
