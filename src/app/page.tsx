import Link from 'next/link';
import { getSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getSession();

  return (
    <main className="min-h-screen bg-[#030014] overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-pink-500/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-500/10 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#030014]/80 backdrop-blur-xl border-b border-white/5">
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <span className="text-white font-bold">C</span>
              </div>
              <span className="text-xl font-bold text-white">Chzzk Bot</span>
            </Link>
            <div className="flex items-center gap-4">
              {session ? (
                <Link
                  href="/dashboard"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-medium hover:opacity-90 transition shadow-lg shadow-violet-500/25"
                >
                  대시보드
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-medium hover:opacity-90 transition shadow-lg shadow-violet-500/25"
                >
                  로그인
                </Link>
              )}
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-6 pt-20">
          <div className="text-center max-w-5xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm text-gray-300">치지직 공식 API 연동</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight">
              <span className="text-white">치지직 방송을 위한</span>
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                올인원 챗봇
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              명령어, 포인트, 투표, 노래 신청, 추첨까지
              <br className="hidden md:block" />
              방송에 필요한 모든 기능을 무료로 사용하세요.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={session ? "/dashboard" : "/login"}
                className="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold text-lg hover:opacity-90 transition shadow-2xl shadow-violet-500/25"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  무료로 시작하기
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>
              <a
                href="#features"
                className="px-8 py-4 rounded-2xl border border-white/10 text-white font-semibold text-lg hover:bg-white/5 transition"
              >
                기능 살펴보기
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-20 max-w-2xl mx-auto">
              {[
                { value: '100%', label: '무료' },
                { value: '24/7', label: '안정적 운영' },
                { value: '실시간', label: '명령어 반영' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                    {stat.value}
                  </p>
                  <p className="text-gray-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-32 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                강력한 기능들
              </h2>
              <p className="text-gray-400 text-lg">
                방송을 더욱 풍성하게 만들어줄 다양한 기능
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: '💬',
                  title: '커스텀 명령어',
                  description: '무제한 명령어 생성, 변수 활용, 쿨다운 설정까지',
                  gradient: 'from-blue-500/20 to-cyan-500/20',
                  border: 'border-blue-500/20 hover:border-blue-500/40',
                },
                {
                  icon: '🎵',
                  title: '노래 신청',
                  description: '유튜브 링크 감지, 대기열 관리, 자동 재생',
                  gradient: 'from-pink-500/20 to-rose-500/20',
                  border: 'border-pink-500/20 hover:border-pink-500/40',
                },
                {
                  icon: '💰',
                  title: '포인트 시스템',
                  description: '채팅 참여 보상, 랭킹 시스템, 포인트 상점',
                  gradient: 'from-amber-500/20 to-orange-500/20',
                  border: 'border-amber-500/20 hover:border-amber-500/40',
                },
                {
                  icon: '📊',
                  title: '실시간 투표',
                  description: '시청자 참여 투표, 실시간 결과, OBS 오버레이',
                  gradient: 'from-violet-500/20 to-purple-500/20',
                  border: 'border-violet-500/20 hover:border-violet-500/40',
                },
                {
                  icon: '🎁',
                  title: '추첨 시스템',
                  description: '키워드 참여, 랜덤 추첨, 화려한 당첨 연출',
                  gradient: 'from-emerald-500/20 to-teal-500/20',
                  border: 'border-emerald-500/20 hover:border-emerald-500/40',
                },
                {
                  icon: '🎨',
                  title: 'OBS 오버레이',
                  description: '투표, 추첨, 노래 정보를 방송 화면에 표시',
                  gradient: 'from-fuchsia-500/20 to-pink-500/20',
                  border: 'border-fuchsia-500/20 hover:border-fuchsia-500/40',
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className={`group relative bg-gradient-to-br ${feature.gradient} backdrop-blur-xl rounded-2xl p-6 border ${feature.border} transition-all duration-300 hover:scale-[1.02]`}
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-6">
          <div className="container mx-auto max-w-4xl">
            <div className="relative rounded-3xl overflow-hidden">
              {/* Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600" />

              <div className="relative px-8 py-16 md:px-16 md:py-20 text-center">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                  지금 바로 시작하세요
                </h2>
                <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
                  치지직 계정으로 로그인하면 바로 봇을 사용할 수 있습니다.
                  <br />복잡한 설정 없이 클릭 몇 번이면 끝!
                </p>
                <Link
                  href={session ? "/dashboard" : "/login"}
                  className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl bg-white text-violet-600 font-bold text-lg hover:bg-white/90 transition shadow-2xl"
                >
                  무료로 시작하기
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 py-8 px-6">
          <div className="container mx-auto text-center">
            <p className="text-gray-500 text-sm">
              © 2025 Chzzk Bot. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
