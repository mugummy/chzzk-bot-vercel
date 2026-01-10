'use client';

import { useState, useEffect } from 'react';

interface VoteOption {
  id: string;
  text: string;
}

interface Vote {
  id: string;
  question: string;
  options: VoteOption[];
  results: Record<string, number>;
  is_active: boolean;
  duration_seconds: number;
  start_time: string | null;
  voters: string[];
  created_at: string;
}

export default function VotesPage() {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    question: '',
    options: ['', ''],
    duration: 60,
  });

  useEffect(() => {
    fetchVotes();
  }, []);

  const fetchVotes = async () => {
    try {
      const res = await fetch('/api/votes');
      const data = await res.json();
      setVotes(data);
    } catch (error) {
      console.error('Failed to fetch votes:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validOptions = formData.options.filter((opt) => opt.trim());
    if (validOptions.length < 2) {
      alert('최소 2개의 옵션이 필요합니다.');
      return;
    }

    try {
      await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: formData.question,
          options: validOptions,
          duration_seconds: formData.duration,
        }),
      });

      setShowModal(false);
      setFormData({ question: '', options: ['', ''], duration: 60 });
      fetchVotes();
    } catch (error) {
      console.error('Failed to create vote:', error);
    }
  };

  const activeVote = votes.find((v) => v.is_active);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
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
        <button
          onClick={() => setShowModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          새 투표
        </button>
      </div>

      {/* Active Vote */}
      {activeVote && (
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">진행 중인 투표</h3>
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm text-white">
              {activeVote.voters.length}명 참여
            </span>
          </div>
          <p className="text-xl font-bold text-white mb-4">{activeVote.question}</p>
          <div className="space-y-2">
            {activeVote.options.map((option) => {
              const count = activeVote.results[option.id] || 0;
              const total = Object.values(activeVote.results).reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? (count / total) * 100 : 0;

              return (
                <div key={option.id} className="bg-white/10 rounded-lg p-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-white">{option.text}</span>
                    <span className="text-white/80">
                      {count}표 ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="bg-white/20 rounded-full h-2">
                    <div
                      className="bg-white rounded-full h-2 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vote History */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">투표 기록</h2>
        {votes.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-white mb-2">
              아직 투표가 없습니다
            </h3>
            <p className="text-gray-400 mb-4">
              첫 번째 투표를 만들어보세요!
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {votes
              .filter((v) => !v.is_active)
              .map((vote) => {
                const total = Object.values(vote.results).reduce((a, b) => a + b, 0);
                const winner = vote.options.reduce((a, b) =>
                  (vote.results[a.id] || 0) > (vote.results[b.id] || 0) ? a : b
                );

                return (
                  <div
                    key={vote.id}
                    className="bg-gray-800 border border-gray-700 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-white">{vote.question}</h4>
                      <span className="text-sm text-gray-400">
                        {new Date(vote.created_at).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-400">총 {total}표</span>
                      <span className="text-purple-400">
                        1위: {winner.text} ({vote.results[winner.id] || 0}표)
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Create Vote Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">새 투표 만들기</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  질문 *
                </label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) =>
                    setFormData({ ...formData, question: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration: parseInt(e.target.value) || 60,
                    })
                  }
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
                  투표 시작
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
