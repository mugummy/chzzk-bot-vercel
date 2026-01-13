/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'nng-phinf.pstatic.net' },
      { protocol: 'https', hostname: 'static-cp.pstatic.net' }
    ],
  },
  // 프론트엔드의 /api 요청을 Railway 서버로 전달 (에러 원천 차단)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://web-production-19eef.up.railway.app/api/:path*',
      },
    ];
  },
};

export default nextConfig;