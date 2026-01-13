/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // 봇 시스템의 특성상 이중 렌더링 방지를 위해 false 권장
  swcMinify: true,
  // 외부 이미지 허용 (치지직 프로필 이미지 등)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nng-phinf.pstatic.net',
      },
      {
        protocol: 'https',
        hostname: 'static-cp.pstatic.net',
      }
    ],
  },
};

export default nextConfig;
