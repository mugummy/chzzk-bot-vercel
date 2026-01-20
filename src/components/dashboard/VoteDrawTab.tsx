'use client';

import { useState, useEffect } from 'react';
import { useBotStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Vote, Gift, Disc, Play, Square, Plus, Trash2, Users, Trophy,
  RefreshCw, ChevronRight, Sparkles, X
} from 'lucide-react';
import SlotMachine from './vote/SlotMachine';
import RouletteWheel from './vote/RouletteWheel';
import ChatBox from './vote/ChatBox';

interface VoteDrawTabProps {
  onSend: (msg: any) => void;
}

type SubTab = 'draw' | 'vote' | 'roulette';

export default function VoteDrawTab({ onSend }: VoteDrawTabProps) {
  const { vote, draw, roulette } = useBotStore();
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('draw');

  // Vote state
  const [voteTitle, setVoteTitle] = useState('');
  const [voteOptions, setVoteOptions] = useState(['', '', '']);
  const [voteMode, setVoteMode] = useState<'chat' | 'donation'>('chat');

  // Draw state
  const [drawKeyword, setDrawKeyword] = useState('!참여');
  const [drawSubsOnly, setDrawSubsOnly] = useState(false);
  const [showDrawResult, setShowDrawResult] = useState(false);
  const [isDrawAnimating, setIsDrawAnimating] = useState(false);

  // Roulette state
  const [rouletteItems, setRouletteItems] = useState([
    { label: '꽝', weight: 30 },
    { label: '당첨', weight: 10 },
    { label: '한번 더', weight: 20 }
  ]);
  const [isRouletteSpinning, setIsRouletteSpinning] = useState(false);
  const [rouletteResult, setRouletteResult] = useState<any>(null);

  // ChatBox state
  const [chatMessages, setChatMessages] = useState<{ text: string; emoji?: string }[]>([]);
  const [showChatBox, setShowChatBox] = useState(false);

  // TTS function
  const playTTS = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 1.0;
      speechSynthesis.speak(utterance);
    }
  };

  // Listen for server responses
  useEffect(() => {
    const handleDrawWinner = (e: CustomEvent) => {
      setIsDrawAnimating(true);
      setChatMessages([]);
      setShowChatBox(false);
      setTimeout(() => {
        setShowDrawResult(true);
        setIsDrawAnimating(false);
        // TTS for draw winner
        if (e.detail?.nickname) {
          playTTS(`축하합니다! ${e.detail.nickname}님 당첨!`);
          setShowChatBox(true);
          // Add sample chat messages for demo
          const sampleMessages = [
            { text: '와 축하드려요!', emoji: '🎉' },
            { text: 'ㅊㅋㅊㅋ' },
            { text: '대박 ㄹㅇ', emoji: '👏' }
          ];
          sampleMessages.forEach((msg, idx) => {
            setTimeout(() => {
              setChatMessages(prev => [...prev, msg]);
            }, (idx + 1) * 800);
          });
        }
      }, 6500);
    };

    const handleRouletteResult = (e: CustomEvent) => {
      setRouletteResult(e.detail);
      setTimeout(() => {
        setIsRouletteSpinning(false);
      }, 4000);
    };

    const handleVoteWinner = (e: CustomEvent) => {
      if (e.detail?.nickname) {
        playTTS(`${e.detail.nickname}님이 당첨되었습니다!`);
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

  const subTabs = [
    { id: 'draw' as SubTab, name: '시청자 추첨', icon: <Gift size={18} /> },
    { id: 'vote' as SubTab, name: '투표', icon: <Vote size={18} /> },
    { id: 'roulette' as SubTab, name: '룰렛', icon: <Disc size={18} /> }
  ];

  // --- Vote Handlers ---
  const handleCreateVote = () => {
    if (!voteTitle.trim()) return alert('투표 제목을 입력하세요');
    const validOptions = voteOptions.filter(o => o.trim());
    if (validOptions.length < 2) return alert('최소 2개의 항목이 필요합니다');

    onSend({
      type: 'createVote',
      title: voteTitle,
      options: validOptions,
      mode: voteMode,
      allowMultiple: voteMode === 'donation'
    });
    onSend({ type: 'startVote' });
  };

  const handleEndVote = () => {
    onSend({ type: 'endVote' });
  };

  const handleResetVote = () => {
    if (confirm('투표를 초기화하시겠습니까?')) {
      onSend({ type: 'resetVote' });
      setVoteTitle('');
      setVoteOptions(['', '', '']);
    }
  };

  const handlePickVoteWinner = (optionId: string) => {
    onSend({ type: 'pickVoteWinner', optionId });
  };

  // --- Draw Handlers ---
  const handleStartDraw = () => {
    onSend({ type: 'startDraw', keyword: drawKeyword, subsOnly: drawSubsOnly });
  };

  const handleStopDraw = () => {
    onSend({ type: 'stopDraw' });
  };

  const handlePickDrawWinner = () => {
    setIsDrawAnimating(true);
    onSend({ type: 'pickDrawWinner' });
  };

  const handleResetDraw = () => {
    if (confirm('추첨을 초기화하시겠습니까?')) {
      onSend({ type: 'resetDraw' });
      setShowDrawResult(false);
      setIsDrawAnimating(false);
      setShowChatBox(false);
      setChatMessages([]);
    }
  };

  // --- Roulette Handlers ---
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
    if (roulette.items.length < 2) return alert('먼저 룰렛 항목을 저장하세요');
    setIsRouletteSpinning(true);
    setRouletteResult(null);
    onSend({ type: 'spinRoulette' });
  };

  return (
    <div className="space-y-6">
      {/* Sub Tab Navigation */}
      <div className="flex gap-2 bg-white/5 p-2 rounded-2xl">
        {subTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${
              activeSubTab === tab.id
                ? 'bg-emerald-500 text-black'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.icon}
            {tab.name}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Draw Tab */}
        {activeSubTab === 'draw' && (
          <motion.div
            key="draw"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Settings Panel */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Gift className="text-pink-500" /> 추첨 설정
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 mb-2 block">참여 명령어</label>
                  <input
                    type="text"
                    value={drawKeyword}
                    onChange={e => setDrawKeyword(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                    placeholder="!참여"
                    disabled={draw.isRecruiting}
                  />
                </div>

                <div
                  onClick={() => !draw.isRecruiting && setDrawSubsOnly(!drawSubsOnly)}
                  className="flex justify-between items-center p-4 bg-black/20 rounded-xl cursor-pointer"
                >
                  <span>구독자 전용</span>
                  <div className={`w-12 h-7 rounded-full relative transition ${drawSubsOnly ? 'bg-emerald-500' : 'bg-gray-600'}`}>
                    <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition ${drawSubsOnly ? 'translate-x-5' : ''}`} />
                  </div>
                </div>

                <button
                  onClick={draw.isRecruiting ? handleStopDraw : handleStartDraw}
                  className={`w-full py-4 rounded-xl font-black text-lg transition active:scale-95 flex items-center justify-center gap-2 ${
                    draw.isRecruiting ? 'bg-red-500 text-white' : 'bg-emerald-500 text-black'
                  }`}
                >
                  {draw.isRecruiting ? <><Square size={20} /> 모집 종료</> : <><Play size={20} /> 모집 시작</>}
                </button>

                {draw.participantCount > 0 && !draw.isRecruiting && (
                  <button
                    onClick={handlePickDrawWinner}
                    className="w-full py-4 rounded-xl font-black text-lg bg-pink-500 text-white transition active:scale-95 flex items-center justify-center gap-2"
                    disabled={isDrawAnimating}
                  >
                    <Trophy size={20} /> 추첨하기
                  </button>
                )}

                <button
                  onClick={handleResetDraw}
                  className="w-full py-3 rounded-xl font-bold text-gray-400 bg-white/5 hover:bg-white/10 transition flex items-center justify-center gap-2"
                >
                  <RefreshCw size={16} /> 초기화
                </button>
              </div>
            </div>

            {/* Display Panel */}
            <div className="lg:col-span-2 bg-white/5 rounded-2xl p-6 border border-white/5 min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden">
              {!draw.isRecruiting && !draw.winner && draw.participantCount === 0 && (
                <div className="text-center text-gray-500">
                  <Gift size={64} className="mx-auto mb-4 opacity-30" />
                  <p className="text-xl font-bold">대기 중</p>
                  <p className="text-sm">모집을 시작하면 참여자가 표시됩니다</p>
                </div>
              )}

              {draw.isRecruiting && (
                <div className="text-center">
                  <div className="text-[8rem] font-black text-emerald-500 leading-none">
                    {draw.participantCount}
                    <span className="text-4xl text-white">명</span>
                  </div>
                  <p className="text-gray-400 mt-4">
                    채팅에 <span className="text-emerald-500 font-bold">{drawKeyword}</span> 입력으로 참여
                  </p>
                </div>
              )}

              {!draw.isRecruiting && draw.participantCount > 0 && !draw.winner && !isDrawAnimating && (
                <div className="text-center">
                  <Users size={48} className="mx-auto mb-4 text-emerald-500" />
                  <p className="text-4xl font-black">{draw.participantCount}명 참여</p>
                  <p className="text-gray-400 mt-2">추첨 버튼을 눌러 당첨자를 선정하세요</p>
                </div>
              )}

              {/* Slot Machine Animation */}
              {(isDrawAnimating || draw.winner) && (
                <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-8">
                  <SlotMachine
                    candidates={draw.participants || []}
                    isRolling={isDrawAnimating}
                    winner={draw.winner}
                    onFinish={() => {
                      setIsDrawAnimating(false);
                      setShowDrawResult(true);
                    }}
                  />

                  {showDrawResult && draw.winner && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-8 text-center w-full max-w-md"
                    >
                      <Sparkles className="mx-auto text-yellow-500 mb-2" size={32} />
                      <p className="text-2xl font-black text-emerald-500">{draw.winner.nickname}</p>
                      <p className="text-gray-400">축하합니다!</p>

                      {/* ChatBox */}
                      <ChatBox
                        visible={showChatBox}
                        messages={chatMessages}
                        winnerName={draw.winner.nickname}
                      />

                      <button
                        onClick={() => {
                          setShowDrawResult(false);
                          setShowChatBox(false);
                          setChatMessages([]);
                          handleResetDraw();
                        }}
                        className="mt-4 px-6 py-2 bg-white/10 rounded-lg font-bold hover:bg-white/20"
                      >
                        닫기
                      </button>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Vote Tab */}
        {activeSubTab === 'vote' && (
          <motion.div
            key="vote"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Settings Panel */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Vote className="text-blue-500" /> 투표 설정
              </h3>

              {!vote.currentVote?.status || vote.currentVote?.status === 'ended' ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-2 block">투표 제목</label>
                    <input
                      type="text"
                      value={voteTitle}
                      onChange={e => setVoteTitle(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                      placeholder="오늘 저녁 메뉴는?"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-2 block">투표 모드</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setVoteMode('chat')}
                        className={`flex-1 py-2 rounded-lg font-bold transition ${
                          voteMode === 'chat' ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-400'
                        }`}
                      >
                        숫자 투표
                      </button>
                      <button
                        onClick={() => setVoteMode('donation')}
                        className={`flex-1 py-2 rounded-lg font-bold transition ${
                          voteMode === 'donation' ? 'bg-pink-500 text-white' : 'bg-white/10 text-gray-400'
                        }`}
                      >
                        도네 투표
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-2 block">투표 항목</label>
                    <div className="space-y-2">
                      {voteOptions.map((opt, idx) => (
                        <div key={idx} className="flex gap-2">
                          <span className="w-8 h-10 flex items-center justify-center bg-emerald-500/20 text-emerald-500 rounded-lg font-bold">
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
                            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white"
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
                          className="w-full py-2 border border-dashed border-white/20 rounded-lg text-gray-400 hover:text-white hover:border-white/40 transition flex items-center justify-center gap-2"
                        >
                          <Plus size={16} /> 항목 추가
                        </button>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleCreateVote}
                    className="w-full py-4 rounded-xl font-black text-lg bg-emerald-500 text-black transition active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Play size={20} /> 투표 시작
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-4">
                    <p className="text-emerald-500 font-bold">투표 진행 중</p>
                    <p className="text-2xl font-black mt-1">{vote.currentVote?.title}</p>
                  </div>

                  <button
                    onClick={handleEndVote}
                    className="w-full py-4 rounded-xl font-black text-lg bg-red-500 text-white transition active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Square size={20} /> 투표 종료
                  </button>

                  <button
                    onClick={handleResetVote}
                    className="w-full py-3 rounded-xl font-bold text-gray-400 bg-white/5 hover:bg-white/10 transition flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={16} /> 초기화
                  </button>
                </div>
              )}
            </div>

            {/* Results Panel */}
            <div className="lg:col-span-2 bg-white/5 rounded-2xl p-6 border border-white/5 min-h-[400px]">
              {!vote.currentVote ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <Vote size={64} className="mb-4 opacity-30" />
                  <p className="text-xl font-bold">대기 중</p>
                  <p className="text-sm">투표를 시작하면 결과가 표시됩니다</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-gray-400 text-sm">{vote.currentVote.title}</p>
                      <p className="text-4xl font-black">{vote.currentVote.totalVotes}표</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                      vote.currentVote.status === 'active' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {vote.currentVote.status === 'active' ? '진행 중' : '종료됨'}
                    </div>
                  </div>

                  <div className="space-y-3 mt-6">
                    {vote.currentVote.options?.map((option: any, idx: number) => (
                      <div
                        key={option.id}
                        className="relative bg-black/20 rounded-xl p-4 border border-white/5 overflow-hidden cursor-pointer hover:border-emerald-500/30 transition group"
                        onClick={() => vote.currentVote?.status === 'ended' && handlePickVoteWinner(option.id)}
                      >
                        <div
                          className="absolute inset-0 bg-emerald-500/20 transition-all duration-700"
                          style={{ width: `${option.barPercent || 0}%` }}
                        />
                        <div className="relative flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 flex items-center justify-center bg-emerald-500/30 text-emerald-500 rounded-lg font-bold">
                              {idx + 1}
                            </span>
                            <span className="font-bold">{option.label}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-emerald-500 font-bold">{option.percent}%</span>
                            <span className="text-gray-400">({option.count}표)</span>
                            {vote.currentVote?.status === 'ended' && (
                              <ChevronRight size={16} className="text-gray-500 group-hover:text-emerald-500 transition" />
                            )}
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
            </div>
          </motion.div>
        )}

        {/* Roulette Tab */}
        {activeSubTab === 'roulette' && (
          <motion.div
            key="roulette"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Settings Panel */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Disc className="text-purple-500" /> 룰렛 설정
              </h3>

              <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                {rouletteItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={item.label}
                      onChange={e => {
                        const newItems = [...rouletteItems];
                        newItems[idx].label = e.target.value;
                        setRouletteItems(newItems);
                      }}
                      className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white"
                      placeholder="항목명"
                    />
                    <input
                      type="number"
                      value={item.weight}
                      onChange={e => {
                        const newItems = [...rouletteItems];
                        newItems[idx].weight = parseInt(e.target.value) || 1;
                        setRouletteItems(newItems);
                      }}
                      className="w-20 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-center"
                      placeholder="가중치"
                      min={1}
                    />
                    {rouletteItems.length > 2 && (
                      <button
                        onClick={() => handleRemoveRouletteItem(idx)}
                        className="p-2 text-red-500 hover:bg-red-500/20 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleAddRouletteItem}
                className="w-full py-2 border border-dashed border-white/20 rounded-lg text-gray-400 hover:text-white hover:border-white/40 transition flex items-center justify-center gap-2 mb-4"
              >
                <Plus size={16} /> 항목 추가
              </button>

              <div className="space-y-2">
                <button
                  onClick={handleSaveRoulette}
                  className="w-full py-3 rounded-xl font-bold bg-purple-500 text-white transition active:scale-95"
                >
                  저장
                </button>
                <button
                  onClick={handleSpinRoulette}
                  disabled={isRouletteSpinning}
                  className="w-full py-4 rounded-xl font-black text-lg bg-emerald-500 text-black transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Disc size={20} className={isRouletteSpinning ? 'animate-spin' : ''} />
                  {isRouletteSpinning ? '돌리는 중...' : '돌리기'}
                </button>
              </div>
            </div>

            {/* Roulette Display */}
            <div className="lg:col-span-2 bg-white/5 rounded-2xl p-6 border border-white/5 min-h-[500px] flex flex-col items-center justify-center">
              <RouletteWheel
                items={roulette.items?.length > 0 ? roulette.items : rouletteItems.map((item, idx) => ({
                  id: String(idx),
                  ...item
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
                  <p className="text-3xl font-black text-emerald-500">{rouletteResult.label}</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
