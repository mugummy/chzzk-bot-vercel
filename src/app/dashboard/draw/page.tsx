'use client';

import { useState, useEffect } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';

export default function DrawPage() {
  const { botConnected, drawState, send, on } = useWebSocket();
  const [keyword, setKeyword] = useState('');
  const [winnerCount, setWinnerCount] = useState(1);
  const [settings, setSettings] = useState({
    allowDuplicate: false,
    excludePreviousWinners: true,
    subscriberOnly: false,
    minPoints: 0,
  });
  const [drawAnimation, setDrawAnimation] = useState<{
    active: boolean;
    winners: Array<{ nickname: string }>;
    allParticipants: string[];
    currentName: string;
  } | null>(null);

  // 추첨 결과 수신
  useEffect(() => {
    const unsub = on('drawWinnerResult', (data: any) => {
      if (data.success && data.payload) {
        const { winners, allParticipants, animationDuration } = data.payload;

        // 슬롯머신 애니메이션 시작
        setDrawAnimation({
          active: true,
          winners,
          allParticipants,
          currentName: allParticipants[0] || '',
        });

        // 이름 롤링 애니메이션
        let tick = 0;
        const interval = setInterval(() => {
          setDrawAnimation(prev => {
            if (!prev) return null;
            const randomIndex = Math.floor(Math.random() * prev.allParticipants.length);
            return { ...prev, currentName: prev.allParticipants[randomIndex] };
          });
          tick++;
          if (tick > animationDuration / 50) {
            clearInterval(interval);
            // 최종 당첨자 표시
            setDrawAnimation(prev => {
              if (!prev) return null;
              return { ...prev, active: false, currentName: prev.winners.map(w => w.nickname).join(', ') };
            });
          }
        }, 50);
      }
    });

    return unsub;
  }, [on]);

  const handleStart = () => {
    if (!keyword.trim()) {
      alert('참여 키워드를 입력해주세요.');
      return;
    }
    send({
      type: 'startDraw',
      keyword: keyword.trim(),
      settings,
    });
  };

  const handleStop = () => {
    send({ type: 'stopDrawCollecting' });
  };

  const handleDraw = () => {
    if (!drawState?.participants || drawState.participants.length === 0) {
      alert('참가자가 없습니다.');
      return;
    }
    send({
      type: 'executeDraw',
      count: winnerCount,
    });
  };

  const handleReset = () => {
    send({ type: 'resetDraw' });
    setKeyword('');
  };

  const handleClearPreviousWinners = () => {
    send({ type: 'clearPreviousWinners' });
  };

  const isActive = drawState?.isActive || false;
  const participants = drawState?.participants || [];
  const winners = drawState?.winners || [];
  const previousWinners = drawState?.previousWinners || [];

  if (!botConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="text-6xl mb-4">🤖</div>
        <h2 className="text-xl font-bold text-white mb-2">봇이 연결되지 않았습니다</h2>
        <p className="text-gray-400 mb-4">설정 페이지에서 봇을 먼저 시작해주세요.</p>
        <a
          href="/dashboard/settings"
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition"
        >
          설정으로 이동
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">시청자 추첨</h1>
        <p className="text-gray-400">채팅 참여자 중 당첨자를 뽑습니다</p>
      </div>

      {/* Draw Animation Overlay */}
      {drawAnimation && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="text-6xl mb-6">🎰</div>
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-8 min-w-[300px]">
              <p className="text-white/80 text-lg mb-2">
                {drawAnimation.active ? '추첨 중...' : '당첨자!'}
              </p>
              <p className={`text-4xl font-bold text-white ${drawAnimation.active ? 'animate-pulse' : ''}`}>
                {drawAnimation.currentName}
              </p>
            </div>
            {!drawAnimation.active && (
              <button
                onClick={() => setDrawAnimation(null)}
                className="mt-6 px-6 py-2 bg-white text-orange-600 rounded-lg font-semibold hover:bg-gray-100 transition"
              >
                닫기
              </button>
            )}
          </div>
        </div>
      )}

      {/* Control Panel */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Settings */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                참여 키워드
              </label>
              <input
                type="text"
                value={drawState?.keyword || keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="!참여"
                disabled={isActive}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                당첨자 수
              </label>
              <input
                type="number"
                value={winnerCount}
                onChange={(e) => setWinnerCount(parseInt(e.target.value) || 1)}
                min="1"
                max="100"
                className="w-32 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>

            {/* 추가 설정 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.excludePreviousWinners}
                  onChange={(e) => setSettings({ ...settings, excludePreviousWinners: e.target.checked })}
                  disabled={isActive}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-300">이전 당첨자 제외</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.subscriberOnly}
                  onChange={(e) => setSettings({ ...settings, subscriberOnly: e.target.checked })}
                  disabled={isActive}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-300">구독자 전용</span>
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              {!isActive ? (
                <button
                  onClick={handleStart}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  추첨 시작
                </button>
              ) : (
                <button
                  onClick={handleStop}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                  참여 마감
                </button>
              )}

              <button
                onClick={handleDraw}
                disabled={participants.length === 0}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
                추첨하기
              </button>

              <button
                onClick={handleReset}
                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition"
              >
                초기화
              </button>
            </div>
          </div>

          {/* Status */}
          <div className="bg-gray-900 rounded-lg p-4">
            <h3 className="font-semibold text-white mb-3">추첨 상태</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">상태</span>
                <span
                  className={`font-medium ${
                    isActive ? 'text-green-400' : 'text-gray-500'
                  }`}
                >
                  {isActive ? '참여 중' : '대기'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">참가자</span>
                <span className="text-white">{participants.length}명</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">키워드</span>
                <span className="text-purple-400">{drawState?.keyword || keyword || '-'}</span>
              </div>
              {previousWinners.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">이전 당첨자</span>
                  <span className="text-gray-500">{previousWinners.length}명</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Winner Display */}
      {winners.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-2">당첨자!</h2>
          <div className="flex flex-wrap justify-center gap-2">
            {winners.map((winner, i) => (
              <span key={i} className="px-4 py-2 bg-white/20 rounded-lg text-xl font-bold text-white">
                {winner.nickname}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Participants List */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h3 className="font-semibold text-white mb-4">
          참가자 목록 ({participants.length}명)
        </h3>
        {participants.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {isActive ? (
              <div>
                <p className="mb-2">채팅에서 <span className="text-purple-400 font-bold">"{drawState?.keyword || keyword}"</span>를 입력하면 참가됩니다</p>
                <div className="flex justify-center gap-1 mt-4">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            ) : (
              <p>추첨을 시작하면 참가자가 표시됩니다</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-64 overflow-y-auto">
            {participants.map((p, i) => (
              <div
                key={i}
                className={`bg-gray-900 rounded px-3 py-2 text-sm text-center ${
                  winners.find(w => w.nickname === p.nickname)
                    ? 'ring-2 ring-yellow-400 bg-yellow-500/20'
                    : ''
                }`}
              >
                <span className="text-white">{p.nickname}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Previous Winners */}
      {previousWinners.length > 0 && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">
              이전 당첨자 ({previousWinners.length}명)
            </h3>
            <button
              onClick={handleClearPreviousWinners}
              className="text-sm text-gray-400 hover:text-white transition"
            >
              초기화
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {previousWinners.map((winner, i) => (
              <span key={i} className="px-3 py-1 bg-gray-700 rounded text-sm text-gray-300">
                {winner.nickname}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
        <h4 className="font-medium text-gray-300 mb-2">사용 방법</h4>
        <ul className="text-sm text-gray-500 space-y-1">
          <li>1. 참여 키워드를 설정하고 "추첨 시작"을 클릭합니다</li>
          <li>2. 시청자가 채팅에 키워드를 입력하면 자동으로 참가됩니다</li>
          <li>3. 참여가 충분히 모이면 "참여 마감"을 클릭합니다</li>
          <li>4. "추첨하기" 버튼을 눌러 당첨자를 선정합니다</li>
        </ul>
      </div>
    </div>
  );
}
