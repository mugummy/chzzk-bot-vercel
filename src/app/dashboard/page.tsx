import { auth } from '@/auth';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await auth();
  const supabase = await createClient();

  // 사용자 정보 가져오기
  const { data: user } = await supabase
    .from('users')
    .select('*, bot_settings(*)')
    .eq('chzzk_id', session?.user?.id)
    .single();

  // 통계 가져오기
  const { count: commandCount } = await supabase
    .from('commands')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id);

  const { count: viewerCount } = await supabase
    .from('viewer_points')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id);

  const stats = [
    {
      name: '등록된 명령어',
      value: commandCount || 0,
      icon: '💬',
      href: '/dashboard/commands',
    },
    {
      name: '시청자 수',
      value: viewerCount || 0,
      icon: '👥',
      href: '/dashboard/points',
    },
    {
      name: '봇 상태',
      value: user?.bot_settings?.bot_enabled ? '활성' : '비활성',
      icon: '🤖',
      href: '/dashboard/settings',
      color: user?.bot_settings?.bot_enabled ? 'text-green-400' : 'text-red-400',
    },
  ];

  const quickActions = [
    {
      name: '명령어 추가',
      description: '새로운 커스텀 명령어를 만들어보세요',
      href: '/dashboard/commands',
      icon: '➕',
    },
    {
      name: '투표 만들기',
      description: '시청자 참여형 투표를 시작하세요',
      href: '/dashboard/votes',
      icon: '📊',
    },
    {
      name: '추첨 시작',
      description: '시청자 중 당첨자를 뽑아보세요',
      href: '/dashboard/draw',
      icon: '🎰',
    },
    {
      name: '설정',
      description: '봇 설정을 변경하세요',
      href: '/dashboard/settings',
      icon: '⚙️',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-white mb-2">
          안녕하세요, {session?.user?.name}님!
        </h1>
        <p className="text-white/80">
          치지직 봇 대시보드에 오신 것을 환영합니다.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-purple-500 transition"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">{stat.icon}</span>
              <div>
                <p className="text-sm text-gray-400">{stat.name}</p>
                <p className={`text-2xl font-bold ${stat.color || 'text-white'}`}>
                  {stat.value}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">빠른 작업</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-purple-500 transition group"
            >
              <span className="text-3xl block mb-3">{action.icon}</span>
              <h3 className="font-semibold text-white group-hover:text-purple-400 transition">
                {action.name}
              </h3>
              <p className="text-sm text-gray-400 mt-1">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Channel Connection */}
      {!user?.channel_id && (
        <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-xl p-6">
          <h3 className="font-semibold text-yellow-400 mb-2">
            치지직 채널 연동 필요
          </h3>
          <p className="text-gray-300 text-sm mb-4">
            봇을 사용하려면 치지직 채널을 연동해야 합니다.
            설정 페이지에서 채널 ID를 입력해주세요.
          </p>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-4 py-2 rounded-lg transition"
          >
            설정으로 이동
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}
