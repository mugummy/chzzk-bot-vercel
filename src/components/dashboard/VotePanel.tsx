'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, PieChart, Play, StopCircle, Plus, Trash2, 
  RotateCw, ExternalLink, Settings2, Trophy, Users, 
  Coins, Copy, Eye, EyeOff, Dices, UserCheck, ShieldCheck, Palette, Save, Clock
} from 'lucide-react';
import { useBotStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import Toggle from '@/components/ui/Toggle';
import NumberInput from '@/components/ui/NumberInput';

/**
 * SlotMachine: 추첨 중일 때 이름이 빠르게 돌아가는 효과를 주는 컴포넌트
 */
const SlotMachine = ({ candidates }: { candidates: any[] }) => {
  const [display, setDisplay] = useState("추첨 중...");
  
  useEffect(() => {
    if (!candidates || candidates.length === 0) return;
    const interval = setInterval(() => {
      const randomCandidate = candidates[Math.floor(Math.random() * candidates.length)];
      if (randomCandidate) setDisplay(randomCandidate.nickname);
    }, 50);
    return () => clearInterval(interval);
  }, [candidates]);

  return (
    <motion.div 
      key={display}
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="text-6xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] italic uppercase"
    >
      {display}
    </motion.div>
  );
};

/**
 * VotePanel: 투표, 룰렛, 추첨 기능을 총괄하는 하이엔드 통합 패널
 */
export default function VotePanel({ onSend }: { onSend: (msg: any) => void }) {
  const { votes, voteHistory, roulette, draw, settings } = useBotStore();
  const [activeSubTab, setActiveSubTab] = useState<'vote' | 'roulette' | 'viewerDraw' | 'donationDraw' | 'settings'>('vote');

  // --- [상태] 실시간 투표 ---
  const [voteQuestion, setVoteQuestion] = useState('');
  const [voteOptions, setVoteOptions] = useState([{ id: '1', text: '' }, { id: '2', text: '' }]);
  const [showVoters, setShowVoters] = useState(false);
  const [revealNicknames, setRevealNicknames] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  // --- [상태] 룰렛 ---
  const [rouletteItems, setRouletteItems] = useState([{ id: '1', text: '', weight: 1, color: '#10b981' }]);

  // --- [상태] 추첨 설정 ---
  const [chatType, setChatType] = useState<'any' | 'command'>('command');
  const [chatCommand, setChatCommand] = useState('!참가');
  const [donationType, setDonationType] = useState<'all' | 'specific'>('all');
  const [donationAmount, setDonationAmount] = useState(1000);
  const [drawCount, setDrawCount] = useState(1);

  // --- [상태] 오버레이 설정 ---
  const [showUrl, setShowUrl] = useState(false);
  const [overlayConfig, setOverlayConfig] = useState(settings?.overlay || {
    backgroundColor: '#000000',
    textColor: '#ffffff',
    accentColor: '#10b981',
    opacity: 0.9,
    scale: 1.0
  });

  // 서버 설정값 동기화
  useEffect(() => {
    if (settings?.overlay) setOverlayConfig(settings.overlay);
  }, [settings?.overlay]);

  const currentVote = votes?.[0];
  const overlayUrl = typeof window !== 'undefined' ? `${window.location.origin}/overlay/vote?token=${localStorage.getItem('chzzk_session_token')}` : '';

  const notify = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    if (typeof window !== 'undefined' && (window as any).ui?.notify) (window as any).ui.notify(msg, type);
  };

  // --- [핸들러] 실시간 투표 ---
  const handleAddVoteOption = () => {
    if (voteOptions.length >= 6) return notify('최대 6개까지만 가능합니다.', 'info');
    setVoteOptions([...voteOptions, { id: Date.now().toString(), text: '' }]);
  };

  const handleRemoveVoteOption = (index: number) => {
    if (voteOptions.length <= 2) return notify('최소 2개는 있어야 합니다.', 'error');
    setVoteOptions(voteOptions.filter((_, i) => i !== index));
  };

  const handleCreateVote = () => {
    if (!voteQuestion || voteOptions.some(o => !o.text)) return notify('질문과 모든 항목을 채워주세요.', 'error');
    onSend({ type: 'createVote', data: { question: voteQuestion, options: voteOptions } });
    notify('투표 세션이 생성되었습니다.');
  };

  const handleResetVote = () => {
    onSend({ type: 'resetVote' });
    setVoteQuestion('');
    setVoteOptions([{id:'1',text:''},{id:'2',text:''}]);
    notify('투표가 초기화되었습니다.', 'info');
  };

  const handleEndVote = () => {
    onSend({ type: 'endVote' });
    notify('투표를 마감합니다.');
  };

  const maskName = (name: string) => revealNicknames ? name : (name[0] || '') + '***';

  // --- [핸들러] 행운의 룰렛 ---
  const handleAddRouletteItem = () => {
    if (rouletteItems.length >= 12) return notify('최대 12개까지만 가능합니다.', 'info');
    setRouletteItems([...rouletteItems, { id: Date.now().toString(), text: '', weight: 1, color: '#10b981' }]);
  };

  const handleRemoveRouletteItem = (index: number) => {
    if (rouletteItems.length <= 1) return;
    setRouletteItems(rouletteItems.filter((_, i) => i !== index));
  };

  const handleCreateRoulette = () => {
    if (rouletteItems.some(i => !i.text)) return notify('항목 내용을 모두 입력해주세요.', 'error');
    onSend({ type: 'createRoulette', payload: { items: rouletteItems } });
    notify('룰렛판이 준비되었습니다.');
  };

  const handleResetRoulette = () => {
    onSend({ type: 'resetRoulette' });
    setRouletteItems([{id:'1',text:'',weight:1,color:'#10b981'}]);
    notify('룰렛이 초기화되었습니다.', 'info');
  };

  const handleSpinRoulette = () => {
    onSend({ type: 'spinRoulette' });
    notify('룰렛을 돌립니다!');
  };

  // --- [핸들러] 추첨 시스템 ---
  const handleToggleDraw = (mode: 'chat' | 'donation') => {
    if (draw.isActive) {
      onSend({ type: 'stopDraw' });
      notify('모집을 마감했습니다.');
    } else {
      // 봇 안내 멘트를 위해 설정을 함께 보냄
      onSend({ 
        type: 'startDraw', 
        payload: { 
          settings: { 
            mode, 
            chatType, 
            chatCommand, 
            donationType, 
            donationAmount 
          } 
        } 
      });
      notify('모집을 시작했습니다.');
    }
  };

  const handleExecuteDraw = (fromVote: boolean = false, voteId?: string) => {
    onSend({ type: 'executeDraw', payload: { count: drawCount, fromVote, voteId } });
    notify('추첨을 진행합니다!');
  };

  const handleResetDraw = () => {
    onSend({ type: 'resetDraw' });
    notify('추첨 데이터를 초기화했습니다.', 'info');
  };

  // --- [핸들러] 오버레이 설정 ---
  const handleSaveOverlay = () => {
    onSend({ type: 'updateSettings', data: { overlay: overlayConfig } });
    notify('오버레이 설정이 저장되었습니다.');
  };

  return (
    <div className="space-y-8">
      {/* 탭 내비게이션 */}
      <header className="flex gap-3 p-2 bg-white/5 rounded-[2.5rem] border border-white/5 w-fit overflow-x-auto custom-scrollbar">
        {[
          { id: 'vote', icon: <BarChart3 size={18}/>, label: '실시간 투표' },
          { id: 'roulette', icon: <PieChart size={18}/>, label: '행운의 룰렛' },
          { id: 'viewerDraw', icon: <Users size={18}/>, label: '시청자 추첨' },
          { id: 'donationDraw', icon: <Coins size={18}/>, label: '후원 추첨' },
          { id: 'settings', icon: <Settings2 size={18}/>, label: '오버레이 설정' }
        ].map(tab => (
          <button 
            key={tab.id} onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-6 py-3.5 rounded-[1.8rem] font-black text-sm flex items-center gap-3 transition-all whitespace-nowrap ${activeSubTab === tab.id ? 'bg-emerald-500 text-black shadow-xl shadow-emerald-500/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </header>

      {/* 1. 투표 탭 */}
      {activeSubTab === 'vote' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          <div className="xl:col-span-5 space-y-8">
            {/* 만들기 카드 */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 shadow-2xl space-y-8">
              <h3 className="text-2xl font-black text-white flex items-center gap-3"><BarChart3 className="text-emerald-500"/> 투표 만들기</h3>
              <div className="space-y-4">
                <input value={voteQuestion} onChange={e => setVoteQuestion(e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none font-bold text-lg text-white focus:border-emerald-500/50 transition-all" placeholder="투표 질문을 입력하세요" />
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {voteOptions.map((opt, i) => (
                    <div key={opt.id} className="flex gap-3">
                      <input value={opt.text} onChange={e => { const n = [...voteOptions]; n[i].text = e.target.value; setVoteOptions(n); }} className="flex-1 bg-white/5 border border-white/10 p-4 rounded-xl outline-none text-white font-medium focus:border-emerald-500/30" placeholder={`옵션 ${i + 1}`} />
                      <button onClick={() => handleRemoveVoteOption(i)} className="p-4 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={20}/></button>
                    </div>
                  ))}
                </div>
                <button onClick={handleAddVoteOption} className="w-full py-4 border border-dashed border-white/20 text-gray-500 hover:text-emerald-500 rounded-xl font-bold flex justify-center gap-2 transition-all"><Plus size={18}/> 항목 추가</button>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <button onClick={handleCreateVote} className="bg-white text-black py-5 rounded-2xl font-black hover:bg-emerald-500 transition-all shadow-xl">투표 생성</button>
                <button onClick={handleResetVote} className="bg-white/5 text-gray-400 py-5 rounded-2xl font-black hover:bg-white/10 transition-all">초기화</button>
              </div>
            </div>
            {/* 투표 기록 카드 */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 shadow-xl space-y-6">
              <h3 className="text-xl font-black text-white flex items-center gap-2"><Clock size={20} className="text-gray-500"/> 투표 기록</h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {voteHistory?.map((vote) => (
                  <div key={vote.id} className="bg-white/5 p-5 rounded-3xl border border-white/5 hover:border-emerald-500/30 transition-all group">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-white text-lg line-clamp-1">{vote.question}</h4>
                        <p className="text-[10px] text-gray-500 uppercase font-bold">{new Date(vote.endTime || 0).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => setSelectedHistoryId(selectedHistoryId === vote.id ? null : vote.id)} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 text-white"><Eye size={16}/></button>
                        <button onClick={() => handleExecuteDraw(true, vote.id)} className="p-2 bg-amber-500/20 text-amber-500 rounded-lg hover:bg-amber-500 hover:text-black"><Trophy size={16}/></button>
                        <button onClick={() => onSend({ type: 'deleteVoteHistory', payload: { id: vote.id } })} className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white"><Trash2 size={16}/></button>
                      </div>
                    </div>
                    {selectedHistoryId === vote.id && (
                      <div className="space-y-2 mt-4 pt-4 border-t border-white/10">
                        {vote.options.map((opt, i) => {
                          const percent = Math.round((vote.results[opt.id] / (vote.totalVotes || 1)) * 100);
                          return (
                            <div key={i} className="flex justify-between items-center text-sm">
                              <span className="text-gray-300">{opt.text}</span>
                              <span className="font-bold text-emerald-500">{vote.results[opt.id]}표 ({percent}%)</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
                {(!voteHistory || voteHistory.length === 0) && <div className="text-center text-gray-600 py-10 font-bold italic">마감된 기록이 없습니다.</div>}
              </div>
            </div>
          </div>

          {/* 우측: 실시간 현황 */}
          <div className="xl:col-span-7 space-y-8">
            <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 shadow-2xl flex flex-col items-center justify-center text-center min-h-[450px] relative overflow-hidden">
              {currentVote ? (
                <div className="w-full space-y-8 relative z-10">
                  <h2 className="text-4xl font-black text-white tracking-tighter leading-tight">{currentVote.question}</h2>
                  <div className="space-y-4 text-left">
                    {currentVote.options.map((opt, i) => {
                      const total = currentVote.totalVotes || 1;
                      const percent = Math.round((currentVote.results[opt.id] / total) * 100);
                      return (
                        <div key={opt.id} className="bg-white/5 p-5 rounded-2xl border border-white/5 flex justify-between items-center relative overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 1 }} className="absolute left-0 top-0 bottom-0 bg-emerald-500/10" />
                          <span className="relative z-10 font-bold text-lg"><span className="text-emerald-500 mr-3">{i+1}.</span>{opt.text}</span>
                          <div className="relative z-10 text-right leading-none">
                            <span className="text-2xl font-black text-emerald-500 block">{currentVote.results[opt.id]}표</span>
                            <span className="text-[10px] text-gray-500 font-bold">{percent}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-center gap-4 mt-8">
                    <button onClick={() => onSend({ type: 'startVote' })} disabled={currentVote.isActive} className="px-10 py-4 bg-emerald-500 text-black rounded-2xl font-black hover:scale-105 transition-all disabled:opacity-30 flex items-center gap-2"><Play size={20}/> 시작</button>
                    <button onClick={handleEndVote} disabled={!currentVote.isActive} className="px-10 py-4 bg-red-500 text-white rounded-2xl font-black hover:scale-105 transition-all disabled:opacity-30 flex items-center gap-2"><StopCircle size={20}/> 종료</button>
                    <button onClick={() => handleExecuteDraw(true)} className="px-10 py-4 bg-amber-500 text-black rounded-2xl font-black hover:scale-105 flex items-center gap-2 shadow-xl shadow-amber-500/20"><Trophy size={20}/> 투표자 추첨</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6 opacity-20"><BarChart3 size={80} /><p className="text-2xl font-black italic">투표를 먼저 생성해주세요.</p></div>
              )}
            </div>
            
            {/* 참여자 명단 */}
            {currentVote && (
              <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 shadow-xl">
                <header className="flex justify-between items-center mb-8">
                  <h4 className="text-xl font-black text-white flex items-center gap-3"><UserCheck className="text-cyan-500"/> 실시간 참여자 명단 <span className="text-cyan-500/50">{currentVote.voters?.length || 0}</span></h4>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                      <span className="text-[10px] font-black text-gray-500 uppercase">Reveal Names</span>
                      <Toggle checked={revealNicknames} onChange={setRevealNicknames} />
                    </div>
                    <button onClick={() => setShowVoters(!showVoters)} className="text-gray-500 hover:text-white transition-colors">{showVoters ? <EyeOff size={20}/> : <Eye size={20}/>}</button>
                  </div>
                </header>
                <AnimatePresence>
                  {showVoters && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 overflow-hidden">
                      {currentVote.voters?.map((v: any, i: number) => (
                        <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col">
                          <span className="font-bold text-white text-sm">{maskName(v.nickname)}</span>
                          <span className="text-[9px] text-gray-500 font-bold uppercase mt-1 tracking-tighter">Voted for #{v.optionId.slice(-1)}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. 룰렛 탭 */}
      {activeSubTab === 'roulette' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          <div className="xl:col-span-5 bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 shadow-2xl space-y-8">
            <h3 className="text-2xl font-black text-white flex items-center gap-3"><PieChart className="text-pink-500"/> 룰렛 설정</h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {rouletteItems.map((item, i) => (
                <div key={item.id} className="flex gap-3">
                  <input value={item.text} onChange={e => { const n = [...rouletteItems]; n[i].text = e.target.value; setRouletteItems(n); }} className="flex-1 bg-white/5 border border-white/10 p-4 rounded-xl outline-none text-white font-medium focus:border-pink-500/30" placeholder={`항목 ${i + 1}`} />
                  <button onClick={() => handleRemoveRouletteItem(i)} className="p-4 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 transition-all"><Trash2 size={20}/></button>
                </div>
              ))}
            </div>
            <button onClick={handleAddRouletteItem} className="w-full py-4 border border-dashed border-white/20 text-gray-500 hover:text-pink-500 rounded-xl font-bold flex justify-center gap-2 transition-all"><Plus size={18}/> 항목 추가</button>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <button onClick={handleCreateRoulette} className="bg-white text-black py-5 rounded-2xl font-black hover:bg-pink-500 transition-all shadow-xl">룰렛 생성</button>
              <button onClick={handleResetRoulette} className="bg-white/5 text-gray-400 py-5 rounded-2xl font-black hover:bg-white/10 transition-all">초기화</button>
            </div>
          </div>
          <div className="xl:col-span-7 bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 shadow-2xl flex flex-col items-center justify-center min-h-[450px]">
            {roulette?.items?.length > 0 ? (
              <div className="text-center space-y-10 w-full flex flex-col items-center">
                <motion.div animate={{ rotate: roulette.isSpinning ? 3600 : 0 }} transition={{ duration: 3, ease: "circOut" }} className="w-72 h-72 rounded-full border-[12px] border-white/5 flex items-center justify-center relative shadow-[0_0_50px_rgba(236,72,153,0.1)] bg-black overflow-hidden">
                  <div className="absolute inset-0 rounded-full overflow-hidden">
                    {roulette.items.map((item, i) => (
                      <div key={i} className="absolute w-full h-full left-0 top-0 origin-center border-r border-white/5" style={{ transform: `rotate(${(360 / roulette.items.length) * i}deg)`, background: `conic-gradient(from 0deg, ${i%2===0?'#1a1a1a':'#0a0a0a'} 0deg ${(360/roulette.items.length)}deg, transparent ${(360/roulette.items.length)}deg)` }}></div>
                    ))}
                  </div>
                  <PieChart size={120} className="text-pink-500 relative z-10" />
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] border-t-white z-20 drop-shadow-xl" />
                </motion.div>
                <AnimatePresence>
                  {roulette.winner && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-pink-500/20 text-pink-400 px-10 py-5 rounded-3xl font-black text-3xl border border-pink-500/30 shadow-2xl">🎉 {roulette.winner.text}</motion.div>
                  )}
                </AnimatePresence>
                <button onClick={handleSpinRoulette} disabled={roulette.isSpinning} className="w-full max-w-md bg-emerald-500 text-black py-5 rounded-2xl font-black hover:scale-105 transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">
                  <RotateCw size={24} className={roulette.isSpinning ? 'animate-spin' : ''} /> <span>{roulette.isSpinning ? '회전 중...' : '룰렛 돌리기'}</span>
                </button>
              </div>
            ) : <div className="opacity-20 flex flex-col items-center gap-6"><PieChart size={80} /><p className="text-2xl font-black italic">룰렛 항목을 먼저 생성하세요.</p></div>}
          </div>
        </div>
      )}

      {/* 3. 추첨 탭 (시청자/후원) */}
      {['viewerDraw', 'donationDraw'].includes(activeSubTab) && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          <div className="xl:col-span-5 bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 shadow-2xl space-y-8">
            <h3 className="text-2xl font-black text-white flex items-center gap-3">{activeSubTab === 'viewerDraw' ? <Users className="text-cyan-500"/> : <Coins className="text-amber-500"/>} {activeSubTab === 'viewerDraw' ? '시청자' : '후원자'} 추첨</h3>
            <div className="space-y-6">
              <div className="flex gap-2 bg-white/5 p-2 rounded-2xl">
                <button onClick={() => activeSubTab === 'viewerDraw' ? setChatType('any') : setDonationType('all')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeSubTab === 'viewerDraw' ? (chatType === 'any' ? 'bg-cyan-500 text-black' : 'text-gray-500') : (donationType === 'all' ? 'bg-amber-500 text-black' : 'text-gray-500')}`}>{activeSubTab === 'viewerDraw' ? '아무 채팅' : '모든 후원'}</button>
                <button onClick={() => activeSubTab === 'viewerDraw' ? setChatType('command') : setDonationType('specific')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeSubTab === 'viewerDraw' ? (chatType === 'command' ? 'bg-cyan-500 text-black' : 'text-gray-500') : (donationType === 'specific' ? 'bg-amber-500 text-black' : 'text-gray-500')}`}>{activeSubTab === 'viewerDraw' ? '명령어' : '특정 금액'}</button>
              </div>
              {activeSubTab === 'viewerDraw' && chatType === 'command' && <div className="space-y-2"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">응모 명령어</label><input value={chatCommand} onChange={e => setChatCommand(e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none font-bold text-white focus:border-cyan-500/50" /></div>}
              {activeSubTab === 'donationDraw' && donationType === 'specific' && <div className="space-y-2"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">설정 금액 (치즈)</label><NumberInput value={donationAmount} onChange={setDonationAmount} step={100} min={100} unit="치즈" /></div>}
              <div className="space-y-3"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">당첨 인원</label><NumberInput value={drawCount} onChange={setDrawCount} min={1} max={10} className="bg-white/5" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => handleToggleDraw(activeSubTab === 'viewerDraw' ? 'chat' : 'donation')} className={`py-5 rounded-2xl font-black transition-all shadow-xl ${draw.isActive ? 'bg-red-500 text-white' : 'bg-white text-black hover:bg-cyan-500'}`}>{draw.isActive ? '모집 마감' : '모집 시작'}</button>
              <button onClick={() => handleExecuteDraw(false)} disabled={draw.isRolling} className={`text-black py-5 rounded-2xl font-black hover:scale-105 shadow-xl flex items-center justify-center gap-2 ${activeSubTab === 'viewerDraw' ? 'bg-cyan-500' : 'bg-amber-500'}`}><Trophy size={20}/> 추첨하기</button>
            </div>
            <button onClick={handleResetDraw} className="w-full py-4 bg-white/5 text-gray-500 rounded-2xl font-bold text-xs hover:bg-white/10 transition-all">초기화</button>
          </div>
          <div className="xl:col-span-7 bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 shadow-2xl flex flex-col items-center justify-center min-h-[450px]">
            {draw.isActive ? (
              <div className="text-center space-y-6 w-full">
                <div className={`text-7xl font-black animate-pulse ${activeSubTab === 'viewerDraw' ? 'text-cyan-500 shadow-cyan-500/20' : 'text-amber-500 shadow-amber-500/20'}`}>{draw.candidatesCount}명</div>
                <p className="text-white font-bold text-xl uppercase tracking-[0.3em]">응모 집계 중...</p>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2 w-full p-6 bg-black/40 rounded-[2.5rem] max-h-[300px] overflow-y-auto custom-scrollbar border border-white/5">
                  {draw.candidates.map((c, i) => <span key={i} className="text-[10px] bg-white/5 px-3 py-2 rounded-xl text-gray-400 truncate font-bold border border-white/5">{maskName(c.nickname)}</span>)}
                </div>
              </div>
            ) : draw.isRolling ? (
              <div className="text-center space-y-8">
                <SlotMachine candidates={draw.candidates} />
                <p className={`font-black animate-pulse tracking-widest ${activeSubTab === 'viewerDraw' ? 'text-cyan-500' : 'text-amber-500'}`}>운명의 당첨자를 고르는 중...</p>
              </div>
            ) : draw.winners.length > 0 ? (
              <div className="w-full space-y-4">
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.5em] mb-6 text-center">Lucky Winner</h4>
                {draw.winners.map((w, i) => (
                  <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} transition={{delay:i*0.1}} key={i} className={`${activeSubTab === 'viewerDraw' ? 'bg-cyan-500' : 'bg-amber-500'} text-black p-8 rounded-[2.5rem] font-black text-4xl flex justify-between items-center shadow-2xl`}>
                    <span>{w.nickname}</span><Trophy size={32} fill="currentColor" />
                  </motion.div>
                ))}
              </div>
            ) : <div className="flex flex-col items-center gap-6 opacity-20"><Dices size={80} /><p className="text-2xl font-black italic">모집 시작 버튼을 눌러주세요.</p></div>}
          </div>
        </div>
      )}

      {/* 5. 오버레이 설정 */}
      {activeSubTab === 'settings' && (
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-12 shadow-2xl space-y-10">
          <div className="flex items-center gap-6"><div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center text-emerald-500 shadow-2xl shadow-emerald-500/10"><Settings2 size={40} /></div><div><h3 className="text-3xl font-black text-white tracking-tighter">Overlay Configuration</h3><p className="text-gray-500 font-bold mt-1">방송 화면 레이아웃 및 디자인을 커스터마이징하세요.</p></div></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white/[0.02] p-10 rounded-[3.5rem] border border-white/5 space-y-8 flex flex-col justify-center">
              <h4 className="text-xl font-black text-white flex items-center gap-3"><ExternalLink className="text-emerald-500" /> 주소 복사</h4>
              <div className="flex gap-3">
                <div className="flex-1 relative group">
                  <input type={showUrl ? "text" : "password"} value={overlayUrl} readOnly className="w-full bg-black/40 border border-white/10 p-6 rounded-2xl text-emerald-400 font-mono text-xs outline-none focus:border-emerald-500/50 transition-all" />
                  <button onClick={() => setShowUrl(!showUrl)} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-gray-500 hover:text-white transition-colors">{showUrl ? <EyeOff size={20}/> : <Eye size={20}/>}</button>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(overlayUrl); notify('주소가 클립보드에 복사되었습니다.'); }} className="bg-emerald-500 text-black px-10 rounded-2xl font-black hover:bg-emerald-400 transition-all flex items-center gap-3 shadow-xl"><Copy size={20}/> <span>복사</span></button>
              </div>
              <div className="flex gap-4 p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 items-start">
                <ShieldCheck className="text-emerald-500 shrink-0" size={20}/>
                <p className="text-[11px] text-gray-500 leading-relaxed font-medium">이 주소를 OBS 브라우저 소스에 추가하세요. 투표, 룰렛, 추첨 이벤트 발생 시 자동으로 화면에 나타납니다.</p>
              </div>
            </div>
            <div className="bg-white/[0.02] p-10 rounded-[3.5rem] border border-white/5 space-y-8">
              <h4 className="text-xl font-black text-white flex items-center gap-3"><Palette className="text-emerald-500" /> 디자인 설정</h4>
              <div className="space-y-6">
                <div className="bg-white/5 p-6 rounded-[2rem] flex justify-between items-center border border-white/5 hover:border-emerald-500/30 transition-all">
                  <div className="flex items-center gap-4"><div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500"><Palette size={20}/></div><span className="font-bold text-gray-300">포인트 컬러</span></div>
                  <div className="relative w-12 h-12 rounded-full overflow-hidden ring-4 ring-white/10 shadow-2xl"><input type="color" value={overlayConfig.accentColor} onChange={e => setOverlayConfig({...overlayConfig, accentColor: e.target.value})} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] cursor-pointer p-0 border-0" /></div>
                </div>
                <div className="bg-white/5 p-6 rounded-[2rem] flex flex-col gap-4 border border-white/5">
                  <div className="flex justify-between items-center"><span className="font-bold text-gray-300 flex items-center gap-3"><Eye size={20} className="text-emerald-500"/> 배경 투명도</span><span className="font-black text-emerald-500 text-xl">{Math.round(overlayConfig.opacity * 100)}%</span></div>
                  <input type="range" min="0" max="1" step="0.1" value={overlayConfig.opacity} onChange={e => setOverlayConfig({...overlayConfig, opacity: parseFloat(e.target.value)})} className="w-full accent-emerald-500 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer" />
                </div>
                <button onClick={handleSaveOverlay} className="w-full py-6 bg-emerald-500 text-black rounded-[2.5rem] font-black text-xl hover:scale-[1.02] transition-all shadow-2xl shadow-emerald-500/20 flex items-center justify-center gap-3 active:scale-95"><Save size={24}/> 설정 저장하기</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}