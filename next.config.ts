import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ssl.pstatic.net',
      },
      {
        protocol: 'https',
        hostname: 'nng-phinf.pstatic.net',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://web-production-19eef.up.railway.app/api/:path*',
      },
      {
        source: '/auth/:path*',
        destination: 'https://web-production-19eef.up.railway.app/auth/:path*',
      },
    ];
  },
};

export default nextConfig;
