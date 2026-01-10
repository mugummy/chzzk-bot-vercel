'use client';

import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function LoginPage() {
  const handleNaverLogin = () => {
    signIn('naver', { callbackUrl: '/dashboard' });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        {/* Back to Home */}
        <Link
          href="/"
          className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          홈으로 돌아가기
        </Link>

        {/* Login Card */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              <span className="text-purple-400">Chzzk</span> Bot
            </h1>
            <p className="text-gray-400">
              네이버 계정으로 로그인하세요
            </p>
          </div>

          {/* Naver Login Button */}
          <button
            onClick={handleNaverLogin}
            className="w-full bg-[#03C75A] hover:bg-[#02b350] text-white font-semibold py-4 px-6 rounded-lg flex items-center justify-center gap-3 transition"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.273 12.845L7.376 0H0v24h7.726V11.155L16.624 24H24V0h-7.727z"/>
            </svg>
            네이버로 로그인
          </button>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>로그인 시 치지직 채널과 연동됩니다</p>
          </div>

          {/* Info Box */}
          <div className="mt-8 bg-gray-900/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">
              왜 네이버 로그인인가요?
            </h3>
            <p className="text-xs text-gray-500">
              치지직은 네이버의 서비스입니다. 네이버 계정으로 로그인하면
              자동으로 치지직 채널 정보와 연동됩니다.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-sm mt-8">
          로그인하면 서비스 이용약관에 동의하는 것으로 간주됩니다.
        </p>
      </div>
    </main>
  );
}
