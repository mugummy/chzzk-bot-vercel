'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [isLoading, setIsLoading] = useState(false);

  const handleChzzkLogin = () => {
    setIsLoading(true);
    window.location.href = '/api/auth/chzzk';
  };

  return (
    <main className="min-h-screen bg-[#030014] flex items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-violet-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-fuchsia-500/20 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          홈으로 돌아가기
        </Link>

        {/* Login Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <span className="text-white text-2xl font-bold">C</span>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              로그인
            </h1>
            <p className="text-gray-400">
              치지직 계정으로 시작하세요
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
              <p className="text-red-400 text-sm text-center">
                로그인에 실패했습니다. 다시 시도해주세요.
              </p>
            </div>
          )}

          {/* Login Button */}
          <button
            onClick={handleChzzkLogin}
            disabled={isLoading}
            className="w-full relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#00FFA3] to-[#00D68F] rounded-2xl blur-lg opacity-50 group-hover:opacity-70 transition" />
            <div className={`
              relative flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-semibold text-lg transition-all
              ${isLoading
                ? 'bg-[#00D68F]/80 text-black/70 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#00FFA3] to-[#00D68F] text-black hover:shadow-lg hover:shadow-[#00FFA3]/25'}
            `}>
              {isLoading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>로그인 중...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <span>치지직으로 로그인</span>
                </>
              )}
            </div>
          </button>

          {/* Info */}
          <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-300 mb-1">안전한 로그인</p>
                <p className="text-xs text-gray-500">
                  치지직 공식 OAuth를 사용합니다. 비밀번호는 저장되지 않습니다.
                </p>
              </div>
            </div>
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#030014] flex items-center justify-center">
        <div className="text-white">로딩 중...</div>
      </main>
    }>
      <LoginContent />
    </Suspense>
  );
}
