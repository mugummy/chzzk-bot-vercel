import Link from 'next/link';
import { auth } from '@/auth';

export default async function Home() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <nav className="flex justify-between items-center mb-16">
          <div className="text-2xl font-bold text-white">
            <span className="text-purple-400">Chzzk</span> Bot
          </div>
          <div>
            {session ? (
              <Link
                href="/dashboard"
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition"
              >
                대시보드
              </Link>
            ) : (
              <Link
                href="/login"
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition"
              >
                로그인
              </Link>
            )}
          </div>
        </nav>

        {/* Hero Section */}
        <div className="text-center py-20">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            치지직 방송을 위한
            <br />
            <span className="text-purple-400">올인원 챗봇</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            명령어, 포인트 시스템, 투표, 노래 신청, 시청자 참여 등
            <br />
            방송에 필요한 모든 기능을 한 곳에서 관리하세요.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href={session ? "/dashboard" : "/login"}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition"
            >
              무료로 시작하기
            </Link>
            <Link
              href="#features"
              className="border border-purple-500 text-purple-400 hover:bg-purple-500/20 px-8 py-4 rounded-lg text-lg font-semibold transition"
            >
              기능 보기
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <section id="features" className="py-20">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            주요 기능
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '💬',
                title: '커스텀 명령어',
                description: '무제한 명령어를 만들고 변수를 활용해 동적인 응답을 설정하세요.',
              },
              {
                icon: '🎵',
                title: '노래 신청',
                description: '시청자가 유튜브 링크로 노래를 신청하고, 대기열을 관리하세요.',
              },
              {
                icon: '💰',
                title: '포인트 시스템',
                description: '채팅 참여에 따른 포인트 지급과 랭킹 시스템을 운영하세요.',
              },
              {
                icon: '📊',
                title: '실시간 투표',
                description: '시청자 참여형 투표를 만들고 결과를 실시간으로 확인하세요.',
              },
              {
                icon: '🎰',
                title: '시청자 추첨',
                description: '참여한 시청자 중 당첨자를 뽑고 화려한 연출과 함께 발표하세요.',
              },
              {
                icon: '🎨',
                title: 'OBS 오버레이',
                description: '투표, 추첨, 룰렛 결과를 OBS에서 바로 표시하세요.',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-purple-500 transition"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 text-center">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              지금 바로 시작하세요
            </h2>
            <p className="text-white/80 mb-8">
              회원가입 후 바로 봇을 설정하고 사용할 수 있습니다.
            </p>
            <Link
              href={session ? "/dashboard" : "/login"}
              className="bg-white text-purple-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition"
            >
              무료로 시작하기
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-800 pt-8 mt-16 text-center text-gray-500">
          <p>© 2025 Chzzk Bot. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}
