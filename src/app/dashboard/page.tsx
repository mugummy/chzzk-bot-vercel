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
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 via-fuchsia-600/20 to-pink-600/20 rounded-3xl blur-3xl" />
        <div className="relative bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 rounded-3xl border border-white/10 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-pink-500/30 via-transparent to-transparent" />
          </div>

          <div className="relative p-8 lg:p-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-5">
                {session?.channelImageUrl ? (
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-pink-500 rounded-2xl blur-lg opacity-50" />
                    <img
                      src={session.channelImageUrl}
                      alt={session.channelName}
                      className="relative w-20 h-20 rounded-2xl object-cover ring-2 ring-white/20"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-pink-500 rounded-2xl blur-lg opacity-50" />
                    <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-3xl font-bold text-white">
                      {session?.channelName?.charAt(0)}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-violet-300 text-sm font-medium mb-1">Welcome back</p>
                  <h1 className="text-3xl lg:text-4xl font-bold text-white">
                    {session?.channelName}
                  </h1>
                  <p className="text-gray-400 mt-1">치지직 봇 대시보드</p>
                </div>
              </div>

              {/* Bot Status Badge */}
              <div className={`
                inline-flex items-center gap-3 px-6 py-3 rounded-2xl border backdrop-blur-xl
                ${isBotActive
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-slate-800/50 border-white/10'}
              `}>
                <div className={`relative flex h-3 w-3`}>
                  {isBotActive && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  )}
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${isBotActive ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                </div>
                <span className={`font-semibold ${isBotActive ? 'text-emerald-400' : 'text-gray-400'}`}>
                  {isBotActive ? '봇 활성화됨' : '봇 비활성화'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: '명령어',
            value: commandCount || 0,
            href: '/dashboard/commands',
            gradient: 'from-blue-500 to-cyan-400',
            bgGlow: 'bg-blue-500/20',
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            ),
          },
          {
            label: '시청자',
            value: viewerCount || 0,
            href: '/dashboard/points',
            gradient: 'from-violet-500 to-purple-400',
            bgGlow: 'bg-violet-500/20',
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            ),
          },
          {
            label: '노래 대기',
            value: 0,
            href: '/dashboard/songs',
            gradient: 'from-pink-500 to-rose-400',
            bgGlow: 'bg-pink-500/20',
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            ),
          },
          {
            label: '투표',
            value: 0,
            href: '/dashboard/votes',
            gradient: 'from-amber-500 to-orange-400',
            bgGlow: 'bg-amber-500/20',
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            ),
          },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group relative bg-slate-900/50 hover:bg-slate-800/50 border border-white/5 hover:border-white/10 rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bgGlow} rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            <div className="relative">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white mb-4 shadow-lg`}>
                {stat.icon}
              </div>
              <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
              <p className="text-2xl lg:text-3xl font-bold text-white mt-1">
                {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
              </p>
            </div>
            <div className="absolute top-5 right-5 text-gray-600 group-hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-white/5 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-sm">
              ⚡
            </span>
            빠른 작업
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { name: '명령어 추가', href: '/dashboard/commands', icon: '💬', color: 'from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border-blue-500/20' },
              { name: '투표 생성', href: '/dashboard/votes', icon: '📊', color: 'from-violet-500/20 to-purple-500/20 hover:from-violet-500/30 hover:to-purple-500/30 border-violet-500/20' },
              { name: '추첨 시작', href: '/dashboard/draw', icon: '🎁', color: 'from-pink-500/20 to-rose-500/20 hover:from-pink-500/30 hover:to-rose-500/30 border-pink-500/20' },
              { name: '봇 설정', href: '/dashboard/settings', icon: '⚙️', color: 'from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border-amber-500/20' },
            ].map((action) => (
              <Link
                key={action.name}
                href={action.href}
                className={`flex flex-col items-center justify-center gap-2 p-5 rounded-xl bg-gradient-to-br ${action.color} border transition-all duration-200 hover:scale-105`}
              >
                <span className="text-2xl">{action.icon}</span>
                <span className="text-sm font-medium text-white text-center">{action.name}</span>
              </Link>
            ))}
          </div>

          {/* Bot Control */}
          <div className="mt-6 p-5 rounded-xl bg-gradient-to-r from-slate-800/50 to-slate-800/30 border border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isBotActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-gray-400'}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-white">봇 상태</p>
                  <p className="text-sm text-gray-400">{isBotActive ? '현재 채팅에서 활동 중입니다' : '봇이 비활성화 상태입니다'}</p>
                </div>
              </div>
              <Link
                href="/dashboard/settings"
                className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                  isBotActive
                    ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
                    : 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:opacity-90'
                }`}
              >
                {isBotActive ? '관리하기' : '시작하기'}
              </Link>
            </div>
          </div>
        </div>

        {/* Top Viewers */}
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-sm">
                🏆
              </span>
              상위 시청자
            </h2>
            <Link href="/dashboard/points" className="text-sm text-violet-400 hover:text-violet-300 transition">
              전체 보기
            </Link>
          </div>

          {topViewers && topViewers.length > 0 ? (
            <div className="space-y-3">
              {topViewers.map((viewer, index) => (
                <div
                  key={viewer.id}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    index === 0 ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20' : 'bg-slate-800/50'
                  }`}
                >
                  <div className={`
                    w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm
                    ${index === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' :
                      index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800' :
                      index === 2 ? 'bg-gradient-to-br from-orange-600 to-orange-700 text-white' :
                      'bg-slate-700 text-gray-400'}
                  `}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">
                      {viewer.viewer_nickname}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-violet-400">
                      {viewer.points.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">{user?.bot_settings?.points_name || '포인트'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-gray-400 font-medium">아직 데이터가 없습니다</p>
              <p className="text-gray-600 text-sm mt-1">봇을 활성화하면 시청자 데이터가 수집됩니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
