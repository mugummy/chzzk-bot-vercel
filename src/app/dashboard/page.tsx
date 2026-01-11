import { getSession } from '@/lib/auth/session';
import { createServiceClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await getSession();
  const supabase = createServiceClient();

  // 사용자 정보 가져오기
  const { data: user } = await supabase
    .from('users')
    .select('*, bot_settings(*), bot_sessions(*)')
    .eq('chzzk_id', session?.channelId)
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

  const { data: topViewers } = await supabase
    .from('viewer_points')
    .select('*')
    .eq('user_id', user?.id)
    .order('points', { ascending: false })
    .limit(5);

  const isBotActive = user?.bot_sessions?.is_active || false;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 p-8">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-4 mb-4">
            {session?.channelImageUrl ? (
              <img
                src={session.channelImageUrl}
                alt={session.channelName}
                className="w-16 h-16 rounded-2xl border-2 border-white/20 shadow-xl"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold text-white">
                {session?.channelName?.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-white/70 text-sm">환영합니다</p>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">
                {session?.channelName}님
              </h1>
            </div>
          </div>
          <p className="text-white/80 max-w-xl">
            치지직 봇 대시보드에서 명령어, 포인트, 투표 등 모든 기능을 관리하세요.
          </p>
        </div>
      </div>

      {/* Bot Status Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`
          col-span-1 lg:col-span-2 rounded-2xl p-6 border transition-all
          ${isBotActive
            ? 'bg-emerald-500/10 border-emerald-500/30'
            : 'bg-gray-800/50 border-white/5'}
        `}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`
                w-14 h-14 rounded-xl flex items-center justify-center
                ${isBotActive
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-white/5 text-gray-400'}
              `}>
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-sm">봇 상태</p>
                <p className={`text-xl font-semibold ${isBotActive ? 'text-emerald-400' : 'text-gray-300'}`}>
                  {isBotActive ? '활성화됨' : '비활성화됨'}
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/settings"
              className={`
                px-5 py-2.5 rounded-xl font-medium transition-all
                ${isBotActive
                  ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                  : 'bg-purple-500 text-white hover:bg-purple-600'}
              `}
            >
              {isBotActive ? '설정 보기' : '봇 시작하기'}
            </Link>
          </div>
        </div>

        {/* Quick Stat */}
        <div className="rounded-2xl bg-gray-800/50 border border-white/5 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="text-gray-400 text-sm">총 시청자</span>
          </div>
          <p className="text-3xl font-bold text-white">{viewerCount?.toLocaleString() || 0}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            name: '명령어',
            value: commandCount || 0,
            href: '/dashboard/commands',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            ),
            color: 'from-blue-500 to-cyan-500',
            bgColor: 'bg-blue-500/10',
            textColor: 'text-blue-400',
          },
          {
            name: '포인트',
            value: user?.bot_settings?.points_name || '포인트',
            href: '/dashboard/points',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            color: 'from-amber-500 to-orange-500',
            bgColor: 'bg-amber-500/10',
            textColor: 'text-amber-400',
            isText: true,
          },
          {
            name: '노래 신청',
            value: '관리',
            href: '/dashboard/songs',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            ),
            color: 'from-pink-500 to-rose-500',
            bgColor: 'bg-pink-500/10',
            textColor: 'text-pink-400',
            isText: true,
          },
          {
            name: '투표/추첨',
            value: '관리',
            href: '/dashboard/votes',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            ),
            color: 'from-violet-500 to-purple-500',
            bgColor: 'bg-violet-500/10',
            textColor: 'text-violet-400',
            isText: true,
          },
        ].map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="group relative rounded-2xl bg-gray-800/50 border border-white/5 p-5 hover:border-white/10 transition-all hover:scale-[1.02]"
          >
            <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center ${stat.textColor} mb-3`}>
              {stat.icon}
            </div>
            <p className="text-gray-400 text-sm mb-1">{stat.name}</p>
            <p className={`text-2xl font-bold ${stat.isText ? 'text-lg' : ''} text-white`}>
              {stat.isText ? stat.value : stat.value.toLocaleString()}
            </p>
            <div className={`absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-white group-hover:bg-white/10 transition`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="rounded-2xl bg-gray-800/50 border border-white/5 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">빠른 작업</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: '명령어 추가', href: '/dashboard/commands', icon: '➕' },
              { name: '투표 만들기', href: '/dashboard/votes', icon: '📊' },
              { name: '추첨 시작', href: '/dashboard/draw', icon: '🎁' },
              { name: '설정 변경', href: '/dashboard/settings', icon: '⚙️' },
            ].map((action) => (
              <Link
                key={action.name}
                href={action.href}
                className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition group"
              >
                <span className="text-xl">{action.icon}</span>
                <span className="text-sm font-medium text-gray-300 group-hover:text-white transition">
                  {action.name}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Top Viewers */}
        <div className="rounded-2xl bg-gray-800/50 border border-white/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">포인트 상위 시청자</h2>
            <Link
              href="/dashboard/points"
              className="text-sm text-purple-400 hover:text-purple-300 transition"
            >
              전체 보기
            </Link>
          </div>
          {topViewers && topViewers.length > 0 ? (
            <div className="space-y-3">
              {topViewers.map((viewer, index) => (
                <div
                  key={viewer.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5"
                >
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm
                    ${index === 0 ? 'bg-amber-500/20 text-amber-400' :
                      index === 1 ? 'bg-gray-400/20 text-gray-400' :
                      index === 2 ? 'bg-orange-600/20 text-orange-400' :
                      'bg-white/5 text-gray-500'}
                  `}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {viewer.viewer_nickname}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-purple-400">
                    {viewer.points.toLocaleString()} {user?.bot_settings?.points_name || 'P'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">아직 시청자 데이터가 없습니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
