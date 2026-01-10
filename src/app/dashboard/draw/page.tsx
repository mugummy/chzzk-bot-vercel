'use client';

import { useState } from 'react';

interface Participant {
  id: string;
  nickname: string;
  joinedAt: string;
}

export default function DrawPage() {
  const [keyword, setKeyword] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [winner, setWinner] = useState<Participant | null>(null);
  const [winnerCount, setWinnerCount] = useState(1);

  const handleStart = () => {
    if (!keyword.trim()) {
      alert('참여 키워드를 입력해주세요.');
      return;
    }
    setIsActive(true);
    setWinner(null);
    setParticipants([]);
    // 실제로는 API를 통해 추첨 세션 시작
  };

  const handleStop = () => {
    setIsActive(false);
  };

  const handleDraw = () => {
    if (participants.length === 0) {
      alert('참가자가 없습니다.');
      return;
    }

    const randomIndex = Math.floor(Math.random() * participants.length);
    setWinner(participants[randomIndex]);
  };

  const handleReset = () => {
    setParticipants([]);
    setWinner(null);
    setIsActive(false);
    setKeyword('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">시청자 추첨</h1>
        <p className="text-gray-400">채팅 참여자 중 당첨자를 뽑습니다</p>
      </div>

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
                value={keyword}
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

            <div className="flex gap-3">
              {!isActive ? (
                <button
                  onClick={handleStart}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
                >
                  추첨 시작
                </button>
              ) : (
                <button
                  onClick={handleStop}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
                >
                  참여 마감
                </button>
              )}

              <button
                onClick={handleDraw}
                disabled={participants.length === 0}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition"
              >
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
                <span className="text-purple-400">{keyword || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Winner Display */}
      {winner && (
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-white mb-2">당첨!</h2>
          <p className="text-4xl font-bold text-white">{winner.nickname}</p>
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
              <p>채팅에서 "{keyword}"를 입력하면 참가됩니다</p>
            ) : (
              <p>추첨을 시작하면 참가자가 표시됩니다</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-64 overflow-y-auto">
            {participants.map((p) => (
              <div
                key={p.id}
                className={`bg-gray-900 rounded px-3 py-2 text-sm text-center ${
                  winner?.id === p.id
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
