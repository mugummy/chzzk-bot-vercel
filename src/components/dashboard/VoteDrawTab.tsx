'use client';

import { useState, useEffect, useMemo } from 'react';
import { useBotStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift, Vote, Disc, Play, Square, Plus, Trash2, Users, Trophy,
  RefreshCw, Sparkles, X, Clock, Timer, Coins
} from 'lucide-react';
import SlotMachine from './vote/SlotMachine';
import RouletteWheel from './vote/RouletteWheel';
import ChatBox from './vote/ChatBox';

interface VoteDrawTabProps {
  onSend: (msg: any) => void;
}

type TabType = 'draw' | 'vote' | 'donate' | 'roulette';

export default function VoteDrawTab({ onSend }: VoteDrawTabProps) {
  const { vote, draw, roulette } = useBotStore();
  const [activeTab, setActiveTab] = useState<TabType>('draw');

  // ===== DRAW STATE =====
  const [drawMode, setDrawMode] = useState<'any' | 'keyword'>('any');
  const [drawKeyword, setDrawKeyword] = useState('!참여');
  const [drawSubsOnly, setDrawSubsOnly] = useState(false);
  const [drawExcludeWinners, setDrawExcludeWinners] = useState(false);
  const [drawTimerEnabled, setDrawTimerEnabled] = useState(false);
  const [drawTimerSeconds, setDrawTimerSeconds] = useState(60);
  const [drawTimerRemaining, setDrawTimerRemaining] = useState(0);
  const [isDrawRolling, setIsDrawRolling] = useState(false);
  const [drawWinner, setDrawWinner] = useState<any>(null);
  const [showChatArea, setShowChatArea] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ text: string; emoji?: string }[]>([]);

  // ===== VOTE STATE =====
  const [voteTitle, setVoteTitle] = useState('');
  const [voteOptions, setVoteOptions] = useState(['', '']);
  const [voteTimerEnabled, setVoteTimerEnabled] = useState(false);
  const [voteTimerSeconds, setVoteTimerSeconds] = useState(60);
  const [voteAllowMultiple, setVoteAllowMultiple] = useState(false);
  const [minDonation, setMinDonation] = useState(1000);
  const [isVoteRolling, setIsVoteRolling] = useState(false);
  const [voteWinner, setVoteWinner] = useState<any>(null);
  const [selectedVoteOption, setSelectedVoteOption] = useState<any>(null);

  // ===== ROULETTE STATE =====
  const [rouletteItems, setRouletteItems] = useState([
    { label: '꽝', weight: 30 },
    { label: '당첨', weight: 10 },
    { label: '한번 더', weight: 20 }
  ]);
  const [isRouletteSpinning, setIsRouletteSpinning] = useState(false);
  const [rouletteResult, setRouletteResult] = useState<any>(null);

  // Calculate roulette total weight and percentages
  const rouletteTotalWeight = useMemo(() =>
    rouletteItems.reduce((sum, item) => sum + (item.weight || 0), 0),
    [rouletteItems]
  );

  // TTS Function
  const playTTS = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 1.0;
      speechSynthesis.speak(utterance);
    }
  };

  // Timer for draw
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (draw.isRecruiting && drawTimerEnabled && drawTimerRemaining > 0) {
      interval = setInterval(() => {
        setDrawTimerRemaining(prev => {
          if (prev <= 1) {
            handleStopDraw();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [draw.isRecruiting, drawTimerEnabled, drawTimerRemaining]);

  // Listen for server events
  useEffect(() => {
    const handleDrawWinner = (e: CustomEvent) => {
      const winner = e.detail;
      if (winner) {
        setDrawWinner(winner);
        setIsDrawRolling(true);
      }
    };

    const handleRouletteResult = (e: CustomEvent) => {
      setRouletteResult(e.detail);
    };

    const handleVoteWinner = (e: CustomEvent) => {
      const winner = e.detail;
      if (winner) {
        setVoteWinner(winner);
        setIsVoteRolling(true);
      }
    };

    window.addEventListener('drawWinnerResult', handleDrawWinner as EventListener);
    window.addEventListener('rouletteResult', handleRouletteResult as EventListener);
    window.addEventListener('voteWinnerResult', handleVoteWinner as EventListener);

    return () => {
      window.removeEventListener('drawWinnerResult', handleDrawWinner as EventListener);
      window.removeEventListener('rouletteResult', handleRouletteResult as EventListener);
      window.removeEventListener('voteWinnerResult', handleVoteWinner as EventListener);
    };
  }, []);

  // Sync roulette items from server
  useEffect(() => {
    if (roulette.items && roulette.items.length > 0) {
      setRouletteItems(roulette.items.map(item => ({
        label: item.label,
        weight: item.weight
      })));
    }
  }, [roulette.items]);

  // ===== DRAW HANDLERS =====
  const handleStartDraw = () => {
    const keyword = drawMode === 'keyword' ? drawKeyword : null;
    onSend({
      type: 'startDraw',
      keyword,
      subsOnly: drawSubsOnly,
      excludeWinners: drawExcludeWinners
    });
    if (drawTimerEnabled) {
      setDrawTimerRemaining(drawTimerSeconds);
    }
  };

  const handleStopDraw = () => {
    onSend({ type: 'stopDraw' });
    setDrawTimerRemaining(0);
  };

  const handlePickDrawWinner = () => {
    onSend({ type: 'pickDrawWinner' });
  };

  const handleDrawFinish = (winner: any) => {
    setIsDrawRolling(false);
    setShowChatArea(true);
    playTTS(`축하합니다! ${winner.nickname}님 당첨!`);

    // Add chat messages
    setChatMessages([]);
    const messages = [
      { text: '와 축하드려요!', emoji: '🎉' },
      { text: 'ㅊㅋㅊㅋ' },
      { text: '대박 ㄹㅇ', emoji: '👏' }
    ];
    messages.forEach((msg, idx) => {
      setTimeout(() => {
        setChatMessages(prev => [...prev, msg]);
      }, (idx + 1) * 800);
    });
  };

  const handleResetDraw = () => {
    onSend({ type: 'resetDraw' });
    setDrawWinner(null);
    setShowChatArea(false);
    setChatMessages([]);
    setIsDrawRolling(false);
  };

  // ===== VOTE HANDLERS =====
  const handleCreateVote = (mode: 'chat' | 'donation') => {
    if (!voteTitle.trim()) return alert('투표 제목을 입력하세요');
    const validOptions = voteOptions.filter(o => o.trim());
    if (validOptions.length < 2) return alert('최소 2개의 항목이 필요합니다');

    onSend({
      type: 'createVote',
      title: voteTitle,
      options: validOptions,
      mode,
      allowMultiple: voteAllowMultiple,
      minDonation: mode === 'donation' ? minDonation : 1000,
      timerSeconds: voteTimerEnabled ? voteTimerSeconds : null
    });
    onSend({ type: 'startVote' });
  };

  const handleEndVote = () => {
    onSend({ type: 'endVote' });
  };

  const handleResetVote = () => {
    onSend({ type: 'resetVote' });
    setVoteTitle('');
    setVoteOptions(['', '']);
    setSelectedVoteOption(null);
    setVoteWinner(null);
    setIsVoteRolling(false);
  };

  const handlePickVoteWinner = (optionId: string) => {
    onSend({ type: 'pickVoteWinner', optionId });
  };

  const handleVoteFinish = (winner: any) => {
    setIsVoteRolling(false);
    setShowChatArea(true);
    playTTS(`${winner.nickname}님이 당첨되었습니다!`);

    setChatMessages([]);
    const messages = [
      { text: '축하해요!', emoji: '🎊' },
      { text: 'ㄴㅇㅅ' }
    ];
    messages.forEach((msg, idx) => {
      setTimeout(() => {
        setChatMessages(prev => [...prev, msg]);
      }, (idx + 1) * 800);
    });
  };

  // ===== ROULETTE HANDLERS =====
  const handleAddRouletteItem = () => {
    setRouletteItems([...rouletteItems, { label: '', weight: 10 }]);
  };

  const handleRemoveRouletteItem = (idx: number) => {
    setRouletteItems(rouletteItems.filter((_, i) => i !== idx));
  };

  const handleSaveRoulette = () => {
    const validItems = rouletteItems.filter(i => i.label.trim());
    if (validItems.length < 2) return alert('최소 2개의 항목이 필요합니다');
    onSend({ type: 'updateRoulette', items: validItems });
  };

  const handleSpinRoulette = () => {
    const itemsToUse = roulette.items?.length > 0 ? roulette.items : rouletteItems;
    if (itemsToUse.length < 2) return alert('먼저 룰렛 항목을 저장하세요');
    setIsRouletteSpinning(true);
    setRouletteResult(null);
    onSend({ type: 'spinRoulette' });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const tabs = [
    { id: 'draw' as TabType, name: '시청자 추첨', icon: <Gift size={18} /> },
    { id: 'vote' as TabType, name: '숫자 투표', icon: <Vote size={18} /> },
    { id: 'donate' as TabType, name: '도네 투표', icon: <Coins size={18} /> },
    { id: 'roulette' as TabType, name: '룰렛', icon: <Disc size={18} /> }
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="flex bg-[#1a1a1a] p-1 rounded-xl mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold transition ${
              activeTab === tab.id
                ? 'bg-[#00ff80] text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.icon}
            {tab.name}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* ===== DRAW TAB ===== */}
        {activeTab === 'draw' && (
          <>
            {/* Settings Panel */}
            <div className="w-[380px] bg-[#111] rounded-2xl p-5 border border-[#333] flex flex-col gap-4 overflow-y-auto">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Gift className="text-[#00ff80]" /> 추첨 설정
              </h3>

              {/* Participation Mode */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400">참여 방식</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDrawMode('any')}
                    disabled={draw.isRecruiting}
                    className={`flex-1 py-2 rounded-lg font-bold transition ${
                      drawMode === 'any' ? 'bg-[#00ff80] text-black' : 'bg-[#262626] text-gray-400'
                    }`}
                  >
                    아무 채팅
                  </button>
                  <button
                    onClick={() => setDrawMode('keyword')}
                    disabled={draw.isRecruiting}
                    className={`flex-1 py-2 rounded-lg font-bold transition ${
                      drawMode === 'keyword' ? 'bg-[#00ff80] text-black' : 'bg-[#262626] text-gray-400'
                    }`}
                  >
                    특정 단어
                  </button>
                </div>
              </div>

              {/* Keyword Input */}
              {drawMode === 'keyword' && (
                <div>
                  <label className="text-xs font-bold text-gray-400 mb-2 block">참여 명령어</label>
                  <input
                    type="text"
                    value={drawKeyword}
                    onChange={e => setDrawKeyword(e.target.value)}
                    className="w-full bg-[#262626] border border-[#333] rounded-xl px-4 py-3 text-white"
                    placeholder="!참여"
                    disabled={draw.isRecruiting}
                  />
                </div>
              )}

              {/* Options */}
              <div
                onClick={() => !draw.isRecruiting && setDrawSubsOnly(!drawSubsOnly)}
                className="flex justify-between items-center p-4 bg-[#262626] rounded-xl cursor-pointer"
              >
                <span>구독자 전용</span>
                <div className={`w-12 h-7 rounded-full relative transition ${drawSubsOnly ? 'bg-[#00ff80]' : 'bg-gray-600'}`}>
                  <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition ${drawSubsOnly ? 'translate-x-5' : ''}`} />
                </div>
              </div>

              <div
                onClick={() => !draw.isRecruiting && setDrawExcludeWinners(!drawExcludeWinners)}
                className="flex justify-between items-center p-4 bg-[#262626] rounded-xl cursor-pointer"
              >
                <div>
                  <span>기존 당첨자 제외</span>
                  <p className="text-xs text-gray-500">{draw.previousWinnersCount || 0}명 제외됨</p>
                </div>
                <div className={`w-12 h-7 rounded-full relative transition ${drawExcludeWinners ? 'bg-[#00ff80]' : 'bg-gray-600'}`}>
                  <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition ${drawExcludeWinners ? 'translate-x-5' : ''}`} />
                </div>
              </div>

              {/* Timer */}
              <div className="bg-[#262626] rounded-xl p-4">
                <div
                  onClick={() => !draw.isRecruiting && setDrawTimerEnabled(!drawTimerEnabled)}
                  className="flex justify-between items-center cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Timer size={18} />
                    <span>타이머 사용</span>
                  </div>
                  <div className={`w-12 h-7 rounded-full relative transition ${drawTimerEnabled ? 'bg-[#00ff80]' : 'bg-gray-600'}`}>
                    <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition ${drawTimerEnabled ? 'translate-x-5' : ''}`} />
                  </div>
                </div>
                {drawTimerEnabled && (
                  <div className="mt-3">
                    <input
                      type="number"
                      value={drawTimerSeconds}
                      onChange={e => setDrawTimerSeconds(Math.max(10, parseInt(e.target.value) || 60))}
                      className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-white"
                      placeholder="초"
                      disabled={draw.isRecruiting}
                    />
                  </div>
                )}
              </div>

              {/* Buttons */}
              <button
                onClick={draw.isRecruiting ? handleStopDraw : handleStartDraw}
                className={`w-full py-4 rounded-xl font-black text-lg transition active:scale-95 ${
                  draw.isRecruiting ? 'bg-red-500 text-white' : 'bg-[#00ff80] text-black'
                }`}
              >
                {draw.isRecruiting ? '모집 종료' : '모집 시작'}
              </button>
            </div>

            {/* Display Panel */}
            <div className="flex-1 bg-[#111] rounded-2xl border border-[#333] relative overflow-hidden flex flex-col items-center justify-center p-10">
              {/* Idle State */}
              {!draw.isRecruiting && !drawWinner && draw.participantCount === 0 && (
                <div className="text-center text-gray-500">
                  <Gift size={64} className="mx-auto mb-4 opacity-30" />
                  <h2 className="text-3xl font-bold">대기 중</h2>
                  <p className="text-sm mt-2">모집을 시작하면 참여자가 표시됩니다</p>
                </div>
              )}

              {/* Recruiting State */}
              {draw.isRecruiting && (
                <div className="text-center">
                  <div className="text-[8rem] font-black text-white leading-none">
                    {draw.participantCount}
                    <span className="text-4xl">명</span>
                  </div>
                  {drawTimerEnabled && drawTimerRemaining > 0 && (
                    <div className="text-4xl font-mono text-[#00ff80] mt-4">
                      {formatTime(drawTimerRemaining)}
                    </div>
                  )}
                  <p className="text-gray-400 mt-4">
                    {drawMode === 'keyword'
                      ? <>채팅에 <span className="text-[#00ff80] font-bold">{drawKeyword}</span> 입력으로 참여</>
                      : '아무 채팅이나 입력하면 참여됩니다'
                    }
                  </p>
                </div>
              )}

              {/* Ready to Pick */}
              {!draw.isRecruiting && draw.participantCount > 0 && !drawWinner && !isDrawRolling && (
                <div className="text-center">
                  <Users size={48} className="mx-auto mb-4 text-[#00ff80]" />
                  <p className="text-4xl font-black">{draw.participantCount}명 참여</p>
                  <button
                    onClick={handlePickDrawWinner}
                    className="mt-8 px-12 py-4 bg-white text-black font-black text-xl rounded-full hover:scale-105 transition"
                  >
                    추첨하기
                  </button>
                  <button
                    onClick={handleResetDraw}
                    className="mt-4 block mx-auto text-gray-500 hover:text-white transition"
                  >
                    초기화
                  </button>
                </div>
              )}

              {/* Rolling / Winner Overlay */}
              {(isDrawRolling || drawWinner) && (
                <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-8">
                  <div className="w-full max-w-lg">
                    <SlotMachine
                      candidates={draw.participants || []}
                      isRolling={isDrawRolling}
                      isOpen={showChatArea}
                      winner={drawWinner}
                      onFinish={handleDrawFinish}
                    />
                    <ChatBox
                      visible={showChatArea}
                      messages={chatMessages}
                      winnerName={drawWinner?.nickname || ''}
                    />
                  </div>

                  {drawWinner && !isDrawRolling && (
                    <div className="flex gap-4 mt-8">
                      <button
                        onClick={handleResetDraw}
                        className="px-6 py-2 bg-[#333] rounded-lg font-bold hover:bg-[#444] transition"
                      >
                        닫기
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* ===== VOTE TAB (숫자 투표) ===== */}
        {activeTab === 'vote' && (
          <>
            {/* Settings Panel */}
            <div className="w-[380px] bg-[#111] rounded-2xl p-5 border border-[#333] flex flex-col gap-4 overflow-y-auto">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Vote className="text-blue-500" /> 숫자 투표 설정
              </h3>

              {!vote.currentVote || vote.currentVote.status === 'ended' ? (
                <>
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-2 block">투표 제목</label>
                    <input
                      type="text"
                      value={voteTitle}
                      onChange={e => setVoteTitle(e.target.value)}
                      className="w-full bg-[#262626] border border-[#333] rounded-xl px-4 py-3 text-white"
                      placeholder="오늘 저녁 메뉴는?"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-2 block">투표 항목</label>
                    <div className="space-y-2">
                      {voteOptions.map((opt, idx) => (
                        <div key={idx} className="flex gap-2">
                          <span className="w-8 h-10 flex items-center justify-center bg-blue-500/20 text-blue-500 rounded-lg font-bold">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={opt}
                            onChange={e => {
                              const newOpts = [...voteOptions];
                              newOpts[idx] = e.target.value;
                              setVoteOptions(newOpts);
                            }}
                            className="flex-1 bg-[#262626] border border-[#333] rounded-lg px-3 py-2 text-white"
                            placeholder={`항목 ${idx + 1}`}
                          />
                          {voteOptions.length > 2 && (
                            <button
                              onClick={() => setVoteOptions(voteOptions.filter((_, i) => i !== idx))}
                              className="p-2 text-red-500 hover:bg-red-500/20 rounded-lg"
                            >
                              <X size={18} />
                            </button>
                          )}
                        </div>
                      ))}
                      {voteOptions.length < 6 && (
                        <button
                          onClick={() => setVoteOptions([...voteOptions, ''])}
                          className="w-full py-2 border border-dashed border-[#333] rounded-lg text-gray-400 hover:text-white hover:border-[#555] transition flex items-center justify-center gap-2"
                        >
                          <Plus size={16} /> 항목 추가
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Timer */}
                  <div className="bg-[#262626] rounded-xl p-4">
                    <div
                      onClick={() => setVoteTimerEnabled(!voteTimerEnabled)}
                      className="flex justify-between items-center cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Timer size={18} />
                        <span>타이머 사용</span>
                      </div>
                      <div className={`w-12 h-7 rounded-full relative transition ${voteTimerEnabled ? 'bg-blue-500' : 'bg-gray-600'}`}>
                        <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition ${voteTimerEnabled ? 'translate-x-5' : ''}`} />
                      </div>
                    </div>
                    {voteTimerEnabled && (
                      <div className="mt-3">
                        <input
                          type="number"
                          value={voteTimerSeconds}
                          onChange={e => setVoteTimerSeconds(Math.max(10, parseInt(e.target.value) || 60))}
                          className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-white"
                          placeholder="초"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleCreateVote('chat')}
                    className="w-full py-4 rounded-xl font-black text-lg bg-blue-500 text-white transition active:scale-95"
                  >
                    <Play size={20} className="inline mr-2" /> 투표 시작
                  </button>
                </>
              ) : (
                <>
                  <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4">
                    <p className="text-blue-500 font-bold">투표 진행 중</p>
                    <p className="text-2xl font-black mt-1">{vote.currentVote?.title}</p>
                  </div>

                  <button
                    onClick={handleEndVote}
                    className="w-full py-4 rounded-xl font-black text-lg bg-red-500 text-white transition active:scale-95"
                  >
                    <Square size={20} className="inline mr-2" /> 투표 종료
                  </button>

                  <button
                    onClick={handleResetVote}
                    className="w-full py-3 rounded-xl font-bold text-gray-400 bg-[#262626] hover:bg-[#333] transition"
                  >
                    <RefreshCw size={16} className="inline mr-2" /> 초기화
                  </button>
                </>
              )}
            </div>

            {/* Display Panel */}
            <div className="flex-1 bg-[#111] rounded-2xl border border-[#333] relative overflow-hidden p-8">
              {!vote.currentVote ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <Vote size={64} className="mb-4 opacity-30" />
                  <p className="text-xl font-bold">대기 중</p>
                  <p className="text-sm">투표를 시작하면 결과가 표시됩니다</p>
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <p className="text-gray-400 text-sm">{vote.currentVote.title}</p>
                      <p className="text-4xl font-black">{vote.currentVote.totalVotes}표</p>
                    </div>
                    {vote.remainingSeconds > 0 && (
                      <div className="text-4xl font-mono text-blue-500">
                        {formatTime(vote.remainingSeconds)}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {vote.currentVote.options?.map((option: any, idx: number) => (
                      <div
                        key={option.id}
                        className="relative group cursor-pointer"
                        onClick={() => vote.currentVote?.status === 'ended' && setSelectedVoteOption(option)}
                      >
                        <div className="flex justify-between mb-1 z-10 relative px-2">
                          <span className="font-bold">{option.label}</span>
                          <span className="text-blue-500">{option.percent}%</span>
                        </div>
                        <div className="h-12 bg-[#222] rounded-lg relative overflow-hidden border border-[#333]">
                          <div
                            className="h-full bg-blue-500/50 transition-all duration-700 ease-out"
                            style={{ width: `${option.barPercent || 0}%` }}
                          />
                          <div className="absolute inset-0 flex items-center justify-end pr-4">
                            <span className="text-gray-400 text-sm">({option.count}표)</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {vote.currentVote.status === 'ended' && (
                    <p className="text-center text-gray-500 text-sm mt-4">
                      항목을 클릭하여 해당 항목 투표자 중 추첨할 수 있습니다
                    </p>
                  )}
                </div>
              )}

              {/* Vote Winner Selection Modal */}
              {selectedVoteOption && (
                <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center">
                  <h2 className="text-2xl font-bold mb-8">{selectedVoteOption.label} 추첨</h2>
                  <p className="text-gray-400 mb-4">{selectedVoteOption.voters?.length || 0}명 참여</p>
                  <button
                    onClick={() => handlePickVoteWinner(selectedVoteOption.id)}
                    className="px-8 py-3 bg-blue-500 text-white font-bold rounded-lg mb-4 hover:bg-blue-600 transition"
                  >
                    추첨하기
                  </button>
                  <button
                    onClick={() => setSelectedVoteOption(null)}
                    className="text-gray-500 hover:text-white transition"
                  >
                    닫기
                  </button>

                  {/* Vote Slot Overlay */}
                  {(isVoteRolling || voteWinner) && (
                    <div className="absolute inset-0 bg-black flex flex-col items-center justify-center p-8">
                      <div className="w-full max-w-lg">
                        <SlotMachine
                          candidates={selectedVoteOption.voters?.map((v: any) => ({ nickname: v.nickname })) || []}
                          isRolling={isVoteRolling}
                          isOpen={showChatArea}
                          winner={voteWinner ? { nickname: voteWinner.nickname } : null}
                          onFinish={handleVoteFinish}
                        />
                        <ChatBox
                          visible={showChatArea}
                          messages={chatMessages}
                          winnerName={voteWinner?.nickname || ''}
                        />
                      </div>
                      {voteWinner && !isVoteRolling && (
                        <button
                          onClick={() => {
                            setVoteWinner(null);
                            setShowChatArea(false);
                            setChatMessages([]);
                            setSelectedVoteOption(null);
                          }}
                          className="mt-8 px-6 py-2 bg-[#333] rounded-lg font-bold hover:bg-[#444] transition"
                        >
                          닫기
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* ===== DONATE TAB (도네 투표) ===== */}
        {activeTab === 'donate' && (
          <>
            {/* Settings Panel */}
            <div className="w-[380px] bg-[#111] rounded-2xl p-5 border border-[#333] flex flex-col gap-4 overflow-y-auto">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Coins className="text-pink-500" /> 도네 투표 설정
              </h3>

              {!vote.currentVote || vote.currentVote.status === 'ended' ? (
                <>
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-2 block">투표 제목</label>
                    <input
                      type="text"
                      value={voteTitle}
                      onChange={e => setVoteTitle(e.target.value)}
                      className="w-full bg-[#262626] border border-[#333] rounded-xl px-4 py-3 text-white"
                      placeholder="오늘 저녁 메뉴는?"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-2 block">1표당 후원 금액</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={minDonation}
                        onChange={e => setMinDonation(Math.max(100, parseInt(e.target.value) || 1000))}
                        className="flex-1 bg-[#262626] border border-[#333] rounded-xl px-4 py-3 text-white"
                        placeholder="1000"
                      />
                      <span className="text-gray-400">원</span>
                    </div>
                  </div>

                  <div
                    onClick={() => setVoteAllowMultiple(!voteAllowMultiple)}
                    className="flex justify-between items-center p-4 bg-[#262626] rounded-xl cursor-pointer"
                  >
                    <div>
                      <span>복수 투표 허용</span>
                      <p className="text-xs text-gray-500">같은 사람이 여러 번 투표 가능</p>
                    </div>
                    <div className={`w-12 h-7 rounded-full relative transition ${voteAllowMultiple ? 'bg-pink-500' : 'bg-gray-600'}`}>
                      <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition ${voteAllowMultiple ? 'translate-x-5' : ''}`} />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-2 block">투표 항목</label>
                    <div className="space-y-2">
                      {voteOptions.map((opt, idx) => (
                        <div key={idx} className="flex gap-2">
                          <span className="w-8 h-10 flex items-center justify-center bg-pink-500/20 text-pink-500 rounded-lg font-bold">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={opt}
                            onChange={e => {
                              const newOpts = [...voteOptions];
                              newOpts[idx] = e.target.value;
                              setVoteOptions(newOpts);
                            }}
                            className="flex-1 bg-[#262626] border border-[#333] rounded-lg px-3 py-2 text-white"
                            placeholder={`항목 ${idx + 1}`}
                          />
                          {voteOptions.length > 2 && (
                            <button
                              onClick={() => setVoteOptions(voteOptions.filter((_, i) => i !== idx))}
                              className="p-2 text-red-500 hover:bg-red-500/20 rounded-lg"
                            >
                              <X size={18} />
                            </button>
                          )}
                        </div>
                      ))}
                      {voteOptions.length < 6 && (
                        <button
                          onClick={() => setVoteOptions([...voteOptions, ''])}
                          className="w-full py-2 border border-dashed border-[#333] rounded-lg text-gray-400 hover:text-white hover:border-[#555] transition flex items-center justify-center gap-2"
                        >
                          <Plus size={16} /> 항목 추가
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Timer */}
                  <div className="bg-[#262626] rounded-xl p-4">
                    <div
                      onClick={() => setVoteTimerEnabled(!voteTimerEnabled)}
                      className="flex justify-between items-center cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Timer size={18} />
                        <span>타이머 사용</span>
                      </div>
                      <div className={`w-12 h-7 rounded-full relative transition ${voteTimerEnabled ? 'bg-pink-500' : 'bg-gray-600'}`}>
                        <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition ${voteTimerEnabled ? 'translate-x-5' : ''}`} />
                      </div>
                    </div>
                    {voteTimerEnabled && (
                      <div className="mt-3">
                        <input
                          type="number"
                          value={voteTimerSeconds}
                          onChange={e => setVoteTimerSeconds(Math.max(10, parseInt(e.target.value) || 60))}
                          className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-white"
                          placeholder="초"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleCreateVote('donation')}
                    className="w-full py-4 rounded-xl font-black text-lg bg-pink-500 text-white transition active:scale-95"
                  >
                    <Play size={20} className="inline mr-2" /> 투표 시작
                  </button>
                </>
              ) : (
                <>
                  <div className="bg-pink-500/20 border border-pink-500/30 rounded-xl p-4">
                    <p className="text-pink-500 font-bold">도네 투표 진행 중</p>
                    <p className="text-2xl font-black mt-1">{vote.currentVote?.title}</p>
                    <p className="text-sm text-gray-400 mt-1">{vote.currentVote?.minDonation || 1000}원 = 1표</p>
                  </div>

                  <button
                    onClick={handleEndVote}
                    className="w-full py-4 rounded-xl font-black text-lg bg-red-500 text-white transition active:scale-95"
                  >
                    <Square size={20} className="inline mr-2" /> 투표 종료
                  </button>

                  <button
                    onClick={handleResetVote}
                    className="w-full py-3 rounded-xl font-bold text-gray-400 bg-[#262626] hover:bg-[#333] transition"
                  >
                    <RefreshCw size={16} className="inline mr-2" /> 초기화
                  </button>
                </>
              )}
            </div>

            {/* Display Panel - Same as vote */}
            <div className="flex-1 bg-[#111] rounded-2xl border border-[#333] relative overflow-hidden p-8">
              {!vote.currentVote ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <Coins size={64} className="mb-4 opacity-30" />
                  <p className="text-xl font-bold">대기 중</p>
                  <p className="text-sm">도네 투표를 시작하면 결과가 표시됩니다</p>
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <p className="text-gray-400 text-sm">{vote.currentVote.title}</p>
                      <p className="text-4xl font-black">{vote.currentVote.totalVotes}표</p>
                    </div>
                    {vote.remainingSeconds > 0 && (
                      <div className="text-4xl font-mono text-pink-500">
                        {formatTime(vote.remainingSeconds)}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {vote.currentVote.options?.map((option: any, idx: number) => (
                      <div
                        key={option.id}
                        className="relative group cursor-pointer"
                        onClick={() => vote.currentVote?.status === 'ended' && setSelectedVoteOption(option)}
                      >
                        <div className="flex justify-between mb-1 z-10 relative px-2">
                          <span className="font-bold">{option.label}</span>
                          <span className="text-pink-500">{option.percent}%</span>
                        </div>
                        <div className="h-12 bg-[#222] rounded-lg relative overflow-hidden border border-[#333]">
                          <div
                            className="h-full bg-pink-500/50 transition-all duration-700 ease-out"
                            style={{ width: `${option.barPercent || 0}%` }}
                          />
                          <div className="absolute inset-0 flex items-center justify-end pr-4">
                            <span className="text-gray-400 text-sm">({option.count}표)</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {vote.currentVote.status === 'ended' && (
                    <p className="text-center text-gray-500 text-sm mt-4">
                      항목을 클릭하여 해당 항목 투표자 중 추첨할 수 있습니다
                    </p>
                  )}
                </div>
              )}

              {/* Vote Winner Selection Modal */}
              {selectedVoteOption && (
                <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center">
                  <h2 className="text-2xl font-bold mb-8">{selectedVoteOption.label} 추첨</h2>
                  <p className="text-gray-400 mb-4">{selectedVoteOption.voters?.length || 0}명 참여</p>
                  <button
                    onClick={() => handlePickVoteWinner(selectedVoteOption.id)}
                    className="px-8 py-3 bg-pink-500 text-white font-bold rounded-lg mb-4 hover:bg-pink-600 transition"
                  >
                    추첨하기
                  </button>
                  <button
                    onClick={() => setSelectedVoteOption(null)}
                    className="text-gray-500 hover:text-white transition"
                  >
                    닫기
                  </button>

                  {(isVoteRolling || voteWinner) && (
                    <div className="absolute inset-0 bg-black flex flex-col items-center justify-center p-8">
                      <div className="w-full max-w-lg">
                        <SlotMachine
                          candidates={selectedVoteOption.voters?.map((v: any) => ({ nickname: v.nickname })) || []}
                          isRolling={isVoteRolling}
                          isOpen={showChatArea}
                          winner={voteWinner ? { nickname: voteWinner.nickname } : null}
                          onFinish={handleVoteFinish}
                        />
                        <ChatBox
                          visible={showChatArea}
                          messages={chatMessages}
                          winnerName={voteWinner?.nickname || ''}
                        />
                      </div>
                      {voteWinner && !isVoteRolling && (
                        <button
                          onClick={() => {
                            setVoteWinner(null);
                            setShowChatArea(false);
                            setChatMessages([]);
                            setSelectedVoteOption(null);
                          }}
                          className="mt-8 px-6 py-2 bg-[#333] rounded-lg font-bold hover:bg-[#444] transition"
                        >
                          닫기
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* ===== ROULETTE TAB ===== */}
        {activeTab === 'roulette' && (
          <>
            {/* Settings Panel */}
            <div className="w-[380px] bg-[#111] rounded-2xl p-5 border border-[#333] flex flex-col gap-4 overflow-y-auto">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Disc className="text-purple-500" /> 룰렛 설정
              </h3>

              <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                {rouletteItems.map((item, idx) => {
                  const percent = rouletteTotalWeight > 0
                    ? ((item.weight / rouletteTotalWeight) * 100).toFixed(1)
                    : '0.0';
                  return (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={item.label}
                        onChange={e => {
                          const newItems = [...rouletteItems];
                          newItems[idx].label = e.target.value;
                          setRouletteItems(newItems);
                        }}
                        className="flex-1 bg-[#262626] border border-[#333] rounded-lg px-3 py-2 text-white"
                        placeholder="항목명"
                      />
                      <input
                        type="number"
                        value={item.weight}
                        onChange={e => {
                          const newItems = [...rouletteItems];
                          newItems[idx].weight = Math.max(1, parseInt(e.target.value) || 1);
                          setRouletteItems(newItems);
                        }}
                        className="w-16 bg-[#262626] border border-[#333] rounded-lg px-2 py-2 text-white text-center"
                        min={1}
                      />
                      <span className="w-14 text-right text-purple-400 font-mono text-sm">
                        {percent}%
                      </span>
                      {rouletteItems.length > 2 && (
                        <button
                          onClick={() => handleRemoveRouletteItem(idx)}
                          className="p-2 text-red-500 hover:bg-red-500/20 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleAddRouletteItem}
                className="w-full py-2 border border-dashed border-[#333] rounded-lg text-gray-400 hover:text-white hover:border-[#555] transition flex items-center justify-center gap-2"
              >
                <Plus size={16} /> 항목 추가
              </button>

              <div className="space-y-2 mt-4">
                <button
                  onClick={handleSaveRoulette}
                  className="w-full py-3 rounded-xl font-bold bg-purple-500 text-white transition active:scale-95"
                >
                  저장
                </button>
                <button
                  onClick={handleSpinRoulette}
                  disabled={isRouletteSpinning}
                  className="w-full py-4 rounded-xl font-black text-lg bg-[#00ff80] text-black transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Disc size={20} className={isRouletteSpinning ? 'animate-spin' : ''} />
                  {isRouletteSpinning ? '돌리는 중...' : '돌리기'}
                </button>
              </div>
            </div>

            {/* Display Panel */}
            <div className="flex-1 bg-[#111] rounded-2xl border border-[#333] flex flex-col items-center justify-center overflow-hidden">
              <RouletteWheel
                items={(roulette.items?.length > 0 ? roulette.items : rouletteItems).map((item, idx) => ({
                  id: (item as any).id || String(idx),
                  label: item.label,
                  weight: item.weight
                }))}
                isSpinning={isRouletteSpinning}
                result={rouletteResult}
                onSpinEnd={() => setIsRouletteSpinning(false)}
              />

              {rouletteResult && !isRouletteSpinning && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 text-center"
                >
                  <Sparkles className="mx-auto text-yellow-500 mb-2" size={32} />
                  <p className="text-3xl font-black text-[#00ff80]">{rouletteResult.label}</p>
                </motion.div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
