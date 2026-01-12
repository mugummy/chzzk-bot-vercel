'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';

interface VoteOption {
  id: string;
  text: string;
}

export default function VotesPage() {
  const { botConnected, voteState, send, on } = useWebSocket();
  const [showModal, setShowModal] = useState(false);
  const [showDrawModal, setShowDrawModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [drawCount, setDrawCount] = useState(1);
  const [formData, setFormData] = useState({
    question: '',
    options: ['', ''],
    duration: 60,
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

  const handleAddOption = () => {
    if (formData.options.length < 10) {
      setFormData({
        ...formData,
        options: [...formData.options, ''],
      });
    }
  };

  const handleRemoveOption = (index: number) => {
    if (formData.options.length > 2) {
      const newOptions = [...formData.options];
      newOptions.splice(index, 1);
      setFormData({ ...formData, options: newOptions });
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const handleCreateVote = (e: React.FormEvent) => {
    e.preventDefault();

    const validOptions = formData.options.filter((opt) => opt.trim());
    if (validOptions.length < 2) {
      alert('최소 2개의 옵션이 필요합니다.');
      return;
    }

    send({
      type: 'createVote',
      question: formData.question,
      options: validOptions,
      durationSeconds: formData.duration,
    });

    setShowModal(false);
    setFormData({ question: '', options: ['', ''], duration: 60 });
  };

  const handleStartVote = () => {
    send({ type: 'startVote' });
  };

  const handleEndVote = () => {
    send({ type: 'endVote' });
  };

  const handleResetVote = () => {
    send({ type: 'resetVote' });
  };

  const handleDrawVote = () => {
    send({
      type: 'drawVote',
      count: drawCount,
      optionId: selectedOption,
    });
    setShowDrawModal(false);
  };

  const status = voteState?.status || 'idle';
  const totalVotes = voteState?.results
    ? Object.values(voteState.results).reduce((a, b) => a + b, 0)
    : 0;

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">투표 관리</h1>
          <p className="text-gray-400">시청자 참여형 투표를 관리합니다</p>
        </div>
        {status === 'idle' && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            새 투표
          </button>
        )}
      </div>

      {/* Draw Animation Overlay */}
      {drawAnimation && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="text-6xl mb-6">🎰</div>
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 min-w-[300px]">
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
                className="mt-6 px-6 py-2 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition"
              >
                닫기
              </button>
            )}
          </div>
        </div>
      )}

      {/* Active/Created Vote */}
      {(status === 'created' || status === 'running' || status === 'ended') && voteState && (
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                status === 'created' ? 'bg-yellow-500/20 text-yellow-400' :
                status === 'running' ? 'bg-green-500/20 text-green-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {status === 'created' ? '준비됨' : status === 'running' ? '진행 중' : '종료됨'}
              </span>
              <span className="text-gray-400 text-sm">{totalVotes}명 참여</span>
            </div>
            <div className="flex gap-2">
              {status === 'created' && (
                <button
                  onClick={handleStartVote}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm transition"
                >
                  시작
                </button>
              )}
              {status === 'running' && (
                <button
                  onClick={handleEndVote}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm transition"
                >
                  종료
                </button>
              )}
              {status === 'ended' && (
                <>
                  <button
                    onClick={() => setShowDrawModal(true)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg text-white text-sm transition flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                    추첨
                  </button>
                  <button
                    onClick={handleResetVote}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white text-sm transition"
                  >
                    초기화
                  </button>
                </>
              )}
            </div>
          </div>

          <h3 className="text-2xl font-bold text-white mb-4">{voteState.question}</h3>

          <div className="space-y-3">
            {voteState.options?.map((option) => {
              const count = voteState.results?.[option.id] || 0;
              const percentage = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
              const isWinner = status === 'ended' && count === Math.max(...Object.values(voteState.results || {}));

              return (
                <div
                  key={option.id}
                  className={`relative rounded-lg p-4 ${isWinner ? 'bg-purple-500/30 ring-2 ring-purple-400' : 'bg-white/5'}`}
                >
                  <div className="flex justify-between mb-2 relative z-10">
                    <span className="text-white font-medium">
                      {option.text}
                      {isWinner && status === 'ended' && (
                        <span className="ml-2 text-purple-400">👑</span>
                      )}
                    </span>
                    <span className="text-white">
                      {count}표 ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden relative z-10">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isWinner ? 'bg-purple-400' : 'bg-white/30'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Voters list */}
          {voteState.voterChoices && voteState.voterChoices.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-gray-400 text-sm mb-2">참여자 ({voteState.voterChoices.length}명)</p>
              <div className="flex flex-wrap gap-1">
                {voteState.voterChoices.slice(0, 50).map((voter, i) => (
                  <span key={i} className="px-2 py-1 bg-white/5 rounded text-xs text-gray-300">
                    {voter.nickname}
                  </span>
                ))}
                {voteState.voterChoices.length > 50 && (
                  <span className="px-2 py-1 text-xs text-gray-500">
                    외 {voteState.voterChoices.length - 50}명
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {status === 'idle' && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            진행 중인 투표가 없습니다
          </h3>
          <p className="text-gray-400 mb-6">
            새 투표를 만들어 시청자들과 소통해보세요!
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl text-white font-medium transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            새 투표 만들기
          </button>
        </div>
      )}

      {/* Info */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
        <h4 className="font-medium text-gray-300 mb-2">사용 방법</h4>
        <ul className="text-sm text-gray-500 space-y-1">
          <li>1. "새 투표" 버튼을 눌러 질문과 옵션을 설정합니다</li>
          <li>2. "시작" 버튼을 누르면 채팅에서 숫자로 투표할 수 있습니다 (예: 1, 2)</li>
          <li>3. 투표가 끝나면 "추첨" 기능으로 참여자 중 당첨자를 뽑을 수 있습니다</li>
        </ul>
      </div>

      {/* Create Vote Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">새 투표 만들기</h2>
            <form onSubmit={handleCreateVote} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  질문 *
                </label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="오늘 플레이할 게임은?"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  옵션
                </label>
                <div className="space-y-2">
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <span className="w-8 h-10 flex items-center justify-center bg-purple-600/20 text-purple-400 rounded-lg font-medium">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`옵션 ${index + 1}`}
                        className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                      />
                      {formData.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(index)}
                          className="text-gray-400 hover:text-red-400 px-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {formData.options.length < 10 && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="mt-2 text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    옵션 추가
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  투표 시간 (초)
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                  min="10"
                  max="600"
                  className="w-32 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition"
                >
                  생성하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Draw Modal */}
      {showDrawModal && voteState && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-xl font-bold text-white mb-4">투표 참여자 추첨</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  추첨 대상
                </label>
                <select
                  value={selectedOption || ''}
                  onChange={(e) => setSelectedOption(e.target.value || null)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="">전체 참여자</option>
                  {voteState.options?.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.text} ({voteState.results?.[opt.id] || 0}명)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  당첨자 수
                </label>
                <input
                  type="number"
                  value={drawCount}
                  onChange={(e) => setDrawCount(parseInt(e.target.value) || 1)}
                  min="1"
                  max="10"
                  className="w-24 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowDrawModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition"
                >
                  취소
                </button>
                <button
                  onClick={handleDrawVote}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg transition"
                >
                  추첨하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
