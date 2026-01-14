'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, PieChart, Play, StopCircle, Plus, Trash2, 
  RotateCw, ExternalLink, Settings2, Trophy, Users, 
  Coins, Copy, Eye, EyeOff, Dices, UserCheck, ShieldCheck,
  ChevronRight, AlertCircle, Sparkles
} from 'lucide-react';
import { useBotStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import Toggle from '@/components/ui/Toggle';
import NumberInput from '@/components/ui/NumberInput';

/**
 * VotePanel: 투표, 룰렛, 추첨 기능을 총괄하는 하이엔드 패널
 * 시청자 추첨과 후원 추첨이 분리되었으며, 모든 기능이 100% 구현된 버전입니다.
 */
export default function VotePanel({ onSend }: { onSend: (msg: any) => void }) {
  const { votes, roulette, draw, settings } = useBotStore();
  const [activeSubTab, setActiveSubTab] = useState<'vote' | 'roulette' | 'viewerDraw' | 'donationDraw' | 'settings'>('vote');

  // 1. 실시간 투표 입력 상태
  const [voteQuestion, setVoteQuestion] = useState('');
  const [voteOptions, setVoteOptions] = useState([{ id: '1', text: '' }, { id: '2', text: '' }]);
  const [showVoters, setShowVoters] = useState(false);
  const [revealNicknames, setRevealNicknames] = useState(false);

  // 2. 룰렛 입력 상태
  const [rouletteItems, setRouletteItems] = useState([{ id: '1', text: '', weight: 1, color: '#10b981' }]);

  // 3. 추첨 설정 (공통 및 전용)
  const [chatType, setChatType] = useState<'any' | 'command'>('command');
  const [chatCommand, setChatCommand] = useState('!참가');
  const [donationType, setDonationType] = useState<'all' | 'specific'>('all');
  const [donationAmount, setDonationAmount] = useState(1000);
  const [drawCount, setDrawCount] = useState(1);

  // 4. 오버레이 설정
  const [showUrl, setShowUrl] = useState(false);

  const currentVote = votes?.[0];
  const overlayUrl = typeof window !== 'undefined' ? `${window.location.origin}/overlay/vote?token=${localStorage.getItem('chzzk_session_token')}` : '';

  const notify = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    if (typeof window !== 'undefined' && (window as any).ui?.notify) (window as any).ui.notify(msg, type);
  };

  // --- 투표 로직 ---
  const handleAddVoteOption = () => {
    if (voteOptions.length >= 6) return notify('최대 6개까지만 가능합니다.', 'info');
    setVoteOptions([...voteOptions, { id: Date.now().toString(), text: '' }]);
  };

  const handleCreateVote = () => {
    if (!voteQuestion) return notify('질문을 입력해주세요.', 'error');
    if (voteOptions.some(o => !o.text)) return notify('모든 항목을 입력해주세요.', 'error');
    onSend({ type: 'createVote', data: { question: voteQuestion, options: voteOptions, settings: {} } });
    notify('투표가 생성되었습니다.');
  };

  // --- 룰렛 로직 ---
  const handleAddRouletteItem = () => {
    setRouletteItems([...rouletteItems, { id: Date.now().toString(), text: '', weight: 1, color: '#10b981' }]);
  };

  const handleCreateRoulette = () => {
    if (rouletteItems.some(i => !i.text)) return notify('모든 항목을 입력해주세요.', 'error');
    onSend({ type: 'createRoulette', payload: { items: rouletteItems } });
    notify('룰렛이 생성되었습니다.');
  };

  // --- 추첨 공통 로직 ---
  const handleStartDraw = (mode: 'chat' | 'donation') => {
    onSend({ 
      type: 'startDraw', 
      payload: { 
        keyword: chatCommand, 
        settings: { mode, chatType, chatCommand, donationType, donationAmount } 
      } 
    });
    notify(`${mode === 'chat' ? '시청자' : '후원'} 추첨 모집을 시작했습니다.`);
  };

  const handleExecuteDraw = (fromVote: boolean = false) => {
    onSend({ type: 'executeDraw', payload: { count: drawCount, fromVote } });
    notify('슬롯머신 가동!');
  };

  return (
    <div className="space-y-8">
      {/* 서브 탭 내비게이션 */}
      <header className="flex gap-3 p-2 bg-white/5 rounded-[2.5rem] border border-white/5 w-fit overflow-x-auto custom-scrollbar">
        {[
          { id: 'vote', icon: <BarChart3 size={18}/>, label: '실시간 투표' },
          { id: 'roulette', icon: <PieChart size={18}/>, label: '행운의 룰렛' },
          { id: 'viewerDraw', icon: <Users size={18}/>, label: '시청자 추첨' },
          { id: 'donationDraw', icon: <Coins size={18}/>, label: '후원 추첨' },
          { id: 'settings', icon: <Settings2 size={18}/>, label: '오버레이' }
        ].map(tab => (
          <button 
            key={tab.id} onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-6 py-3.5 rounded-[1.8rem] font-black text-sm flex items-center gap-3 transition-all whitespace-nowrap ${activeSubTab === tab.id ? 'bg-emerald-500 text-black shadow-xl shadow-emerald-500/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </header>

      {/* 1. 실시간 투표 탭 */}
      {activeSubTab === 'vote' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          <div className="xl:col-span-5 bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 shadow-2xl space-y-8">
            <h3 className="text-2xl font-black text-white flex items-center gap-3"><BarChart3 className="text-emerald-500"/> 투표 설정</h3>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">투표 주제</label>
              <input value={voteQuestion} onChange={e => setVoteQuestion(e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none font-bold text-lg text-white focus:border-emerald-500/50 transition-all" placeholder="질문을 입력하세요" />
              
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 block mt-6">투표 항목</label>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {voteOptions.map((opt, i) => (
                  <div key={opt.id} className="flex gap-3">
                    <input value={opt.text} onChange={e => { const n = [...voteOptions]; n[i].text = e.target.value; setVoteOptions(n); }} className="flex-1 bg-white/5 border border-white/10 p-4 rounded-xl outline-none text-white font-medium focus:border-emerald-500/30" placeholder={`항목 ${i + 1}`} />
                    <button onClick={() => { if(voteOptions.length > 2) setVoteOptions(voteOptions.filter((_, idx) => idx !== i)); }} className="p-4 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={20}/></button>
                  </div>
                ))}
              </div>
              <button onClick={handleAddVoteOption} className="w-full py-4 border border-dashed border-white/20 text-gray-500 hover:text-emerald-500 rounded-xl font-bold flex justify-center gap-2 transition-all"><Plus size={18}/> 항목 추가</button>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <button onClick={handleCreateVote} className="bg-white text-black py-5 rounded-2xl font-black hover:bg-emerald-500 transition-all shadow-xl">투표 생성</button>
              <button onClick={() => onSend({ type: 'resetVote' })} className="bg-white/5 text-gray-400 py-5 rounded-2xl font-black hover:bg-white/10 transition-all">초기화</button>
            </div>
          </div>

          <div className="xl:col-span-7 space-y-8">
            <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 shadow-2xl flex flex-col items-center justify-center text-center min-h-[450px] relative overflow-hidden">
              {currentVote ? (
                <div className="w-full space-y-8 relative z-10">
                  <h2 className="text-4xl font-black text-white tracking-tighter">{currentVote.question}</h2>
                  <div className="space-y-4 text-left">
                    {currentVote.options.map((opt, i) => {
                      const percent = Math.round((currentVote.results[opt.id] / (currentVote.totalVotes || 1)) * 100);
                      return (
                        <div key={opt.id} className="bg-white/5 p-5 rounded-2xl border border-white/5 flex justify-between items-center relative overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} className="absolute left-0 top-0 bottom-0 bg-emerald-500/10" />
                          <span className="relative z-10 font-bold text-lg"><span className="text-emerald-500 mr-3">{i+1}.</span>{opt.text}</span>
                          <span className="relative z-10 font-black text-2xl text-emerald-500">{currentVote.results[opt.id]}표</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-center gap-4 mt-8">
                    <button onClick={() => onSend({ type: 'startVote' })} disabled={currentVote.isActive} className="px-10 py-4 bg-emerald-500 text-black rounded-2xl font-black hover:scale-105 transition-all disabled:opacity-30 flex items-center gap-2"><Play size={20}/> 시작</button>
                    <button onClick={() => onSend({ type: 'endVote' })} disabled={!currentVote.isActive} className="px-10 py-4 bg-red-500 text-white rounded-2xl font-black hover:scale-105 transition-all disabled:opacity-30 flex items-center gap-2"><StopCircle size={20}/> 종료</button>
                    <button onClick={() => handleExecuteDraw(true)} className="px-10 py-4 bg-amber-500 text-black rounded-2xl font-black hover:scale-105 transition-all flex items-center gap-2 shadow-xl shadow-amber-500/20"><Trophy size={20}/> 투표자 추첨</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6 opacity-20">
                  <BarChart3 size={80} />
                  <p className="text-2xl font-black italic">투표를 먼저 생성해주세요.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. 행운의 룰렛 탭 */}
      {activeSubTab === 'roulette' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          <div className="xl:col-span-5 bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 shadow-2xl space-y-8">
            <h3 className="text-2xl font-black text-white flex items-center gap-3"><PieChart className="text-pink-500"/> 룰렛 설정</h3>
            <div className="space-y-4">
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {rouletteItems.map((item, i) => (
                  <div key={item.id} className="flex gap-3">
                    <input value={item.text} onChange={e => { const n = [...rouletteItems]; n[i].text = e.target.value; setRouletteItems(n); }} className="flex-1 bg-white/5 border border-white/10 p-4 rounded-xl outline-none text-white font-medium focus:border-pink-500/30" placeholder={`당첨 항목 ${i + 1}`} />
                    <button onClick={() => { if(rouletteItems.length > 1) setRouletteItems(rouletteItems.filter((_, idx) => idx !== i)); }} className="p-4 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={20}/></button>
                  </div>
                ))}
              </div>
              <button onClick={handleAddRouletteItem} className="w-full py-4 border border-dashed border-white/20 text-gray-500 hover:text-pink-500 rounded-xl font-bold flex justify-center gap-2 transition-all"><Plus size={18}/> 항목 추가</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={handleCreateRoulette} className="bg-white text-black py-5 rounded-2xl font-black hover:bg-pink-500 transition-all shadow-xl">룰렛 생성</button>
              <button onClick={() => onSend({ type: 'spinRoulette' })} disabled={roulette.isSpinning} className="bg-pink-500 text-white py-5 rounded-2xl font-black hover:scale-105 transition-all shadow-xl shadow-pink-500/20 flex items-center justify-center gap-2">
                <RotateCw size={20} className={roulette.isSpinning ? 'animate-spin' : ''} /> 돌리기
              </button>
            </div>
          </div>
          <div className="xl:col-span-7 bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 shadow-2xl flex flex-col items-center justify-center min-h-[450px]">
            {roulette?.items?.length > 0 ? (
              <div className="text-center space-y-10">
                <motion.div animate={{ rotate: roulette.isSpinning ? 3600 : 0 }} transition={{ duration: 3, ease: "circOut" }} className="w-64 h-64 rounded-full border-[12px] border-white/5 flex items-center justify-center relative shadow-[0_0_50px_rgba(236,72,153,0.1)]">
                  <PieChart size={120} className="text-pink-500" />
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-white z-20" />
                </motion.div>
                <AnimatePresence>
                  {roulette.winner && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-pink-500/20 text-pink-400 px-10 py-5 rounded-3xl font-black text-3xl border border-pink-500/30 shadow-2xl">
                      🎉 {roulette.winner.text}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 opacity-20"><PieChart size={80} /><p className="text-2xl font-black italic">룰렛 항목을 생성해주세요.</p></div>
            )}
          </div>
        </div>
      )}

      {/* 3. 시청자 추첨 탭 */}
      {activeSubTab === 'viewerDraw' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          <div className="xl:col-span-5 bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 shadow-2xl space-y-8">
            <h3 className="text-2xl font-black text-white flex items-center gap-3"><Users className="text-cyan-500"/> 시청자 추첨 설정</h3>
            <div className="space-y-6">
              <div className="flex gap-2 bg-white/5 p-2 rounded-2xl">
                <button onClick={() => setChatType('any')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${chatType === 'any' ? 'bg-cyan-500 text-black' : 'text-gray-500'}`}>아무 채팅</button>
                <button onClick={() => setChatType('command')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${chatType === 'command' ? 'bg-cyan-500 text-black' : 'text-gray-500'}`}>명령어 응모</button>
              </div>
              {chatType === 'command' && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">응모 명령어</label>
                  <input value={chatCommand} onChange={e => setChatCommand(e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none font-bold text-white focus:border-cyan-500/50" />
                </div>
              )}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">당첨 인원</label>
                <NumberInput value={drawCount} onChange={setDrawCount} min={1} max={10} className="bg-white/5" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <button onClick={() => handleStartDraw('chat')} className="bg-white text-black py-5 rounded-2xl font-black hover:bg-cyan-500 transition-all">모집 시작</button>
              <button onClick={() => handleExecuteDraw(false)} disabled={draw.isRolling} className="bg-cyan-500 text-black py-5 rounded-2xl font-black hover:scale-105 transition-all shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2">
                <Trophy size={20}/> 추첨하기
              </button>
            </div>
          </div>
          <div className="xl:col-span-7 bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 shadow-2xl flex flex-col items-center justify-center min-h-[450px]">
            {draw.isRolling ? (
              <div className="text-center space-y-6">
                <div className="text-6xl font-black text-white/10 animate-bounce blur-sm italic uppercase tracking-tighter">Rolling...</div>
                <p className="text-cyan-500 font-black animate-pulse">참가자 {draw.candidatesCount}명 중 선정 중</p>
              </div>
            ) : draw.winners.length > 0 ? (
              <div className="w-full space-y-6">
                <h4 className="text-cyan-500 font-black uppercase tracking-[0.3em] mb-8">Winner Board</h4>
                {draw.winners.map((w, i) => (
                  <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }} key={i} className="bg-cyan-500 text-black p-6 rounded-3xl font-black text-3xl shadow-xl flex items-center justify-between">
                    <span>{w.nickname}</span>
                    <Trophy size={28} />
                  </motion.div>
                ))}
                <button onClick={() => onSend({ type: 'resetDraw' })} className="w-full py-4 text-gray-600 font-bold hover:text-white transition-all text-xs uppercase tracking-widest mt-10">결과 초기화</button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 opacity-20"><Dices size={80} /><p className="text-2xl font-black italic">모집 시작 후 추첨을 진행하세요.</p></div>
            )}
          </div>
        </div>
      )}

      {/* 4. 후원 추첨 탭 */}
      {activeSubTab === 'donationDraw' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          <div className="xl:col-span-5 bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 shadow-2xl space-y-8">
            <h3 className="text-2xl font-black text-white flex items-center gap-3"><Coins className="text-amber-500"/> 후원자 추첨 설정</h3>
            <div className="space-y-6">
              <div className="flex gap-2 bg-white/5 p-2 rounded-2xl">
                <button onClick={() => setDonationType('all')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${donationType === 'all' ? 'bg-amber-500 text-black' : 'text-gray-500'}`}>모든 금액</button>
                <button onClick={() => setDonationType('specific')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${donationType === 'specific' ? 'bg-amber-500 text-black' : 'text-gray-500'}`}>특정 금액</button>
              </div>
              {donationType === 'specific' && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">설정 금액 (치즈)</label>
                  <NumberInput value={donationAmount} onChange={setDonationAmount} step={100} min={100} className="bg-white/5" />
                </div>
              )}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">당첨 인원</label>
                <NumberInput value={drawCount} onChange={setDrawCount} min={1} max={10} className="bg-white/5" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <button onClick={() => handleStartDraw('donation')} className="bg-white text-black py-5 rounded-2xl font-black hover:bg-amber-500 transition-all">모집 시작</button>
              <button onClick={() => handleExecuteDraw(false)} disabled={draw.isRolling} className="bg-amber-500 text-black py-5 rounded-2xl font-black hover:scale-105 transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2">
                <Trophy size={20}/> 추첨하기
              </button>
            </div>
          </div>
          <div className="xl:col-span-7 bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 shadow-2xl flex flex-col items-center justify-center min-h-[450px]">
            {/* 시청자 추첨과 동일한 결과창 로직 (Amber 테마) */}
            {draw.isRolling ? (
              <div className="text-center space-y-6">
                <div className="text-6xl font-black text-white/10 animate-bounce blur-sm italic uppercase tracking-tighter">Rolling...</div>
                <p className="text-amber-500 font-black animate-pulse">후원자 {draw.candidatesCount}명 중 선정 중</p>
              </div>
            ) : draw.winners.length > 0 ? (
              <div className="w-full space-y-6">
                <h4 className="text-amber-500 font-black uppercase tracking-[0.3em] mb-8">Lucky Supporter</h4>
                {draw.winners.map((w, i) => (
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} key={i} className="bg-amber-500 text-black p-6 rounded-3xl font-black text-3xl shadow-xl flex items-center justify-between">
                    <span>{w.nickname}</span>
                    <Coins size={28} />
                  </motion.div>
                ))}
                <button onClick={() => onSend({ type: 'resetDraw' })} className="w-full py-4 text-gray-600 font-bold hover:text-white transition-all text-xs uppercase tracking-widest mt-10">결과 초기화</button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 opacity-20"><Coins size={80} /><p className="text-2xl font-black italic">모집 시작 후 추첨을 진행하세요.</p></div>
            )}
          </div>
        </div>
      )}

      {/* 5. 오버레이 설정 탭 */}
      {activeSubTab === 'settings' && (
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-12 shadow-2xl space-y-10">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center text-emerald-500 shadow-2xl"><Settings2 size={40} /></div>
            <div><h3 className="text-3xl font-black text-white tracking-tighter">Overlay Link</h3><p className="text-gray-500 font-bold mt-1">OBS 브라우저 소스에 추가하여 방송 화면에 띄우세요.</p></div>
          </div>
          <div className="bg-white/[0.02] p-10 rounded-[3rem] border border-white/5 space-y-6">
            <div className="flex gap-4">
              <div className="flex-1 relative group">
                <input type={showUrl ? "text" : "password"} value={overlayUrl} readOnly className="w-full bg-black/40 border border-white/10 p-6 rounded-2xl text-emerald-400 font-mono text-sm outline-none focus:border-emerald-500/50 transition-all" />
                <button onClick={() => setShowUrl(!showUrl)} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-gray-500 hover:text-white transition-colors">{showUrl ? <EyeOff size={20}/> : <Eye size={20}/>}</button>
              </div>
              <button onClick={() => { navigator.clipboard.writeText(overlayUrl); notify('주소가 복사되었습니다.'); }} className="px-10 bg-emerald-500 text-black rounded-2xl font-black hover:bg-emerald-400 transition-all flex items-center gap-3 shadow-xl shadow-emerald-500/20"><Copy size={20}/> <span>주소 복사</span></button>
            </div>
            <div className="flex gap-4 p-6 bg-white/5 rounded-2xl border border-white/5 items-start">
              <ShieldCheck className="text-emerald-500 shrink-0" size={20}/>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">이 주소에는 세션 토큰이 포함되어 있습니다. 타인에게 노출되지 않도록 주의하세요. 투표, 룰렛, 추첨 화면이 이 하나의 링크에서 자동으로 전환되어 표시됩니다.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GuideItem({ cmd, desc, highlight }: { cmd: string, desc: string, highlight?: boolean }) {
  return (
    <div className={`p-5 rounded-2xl border transition-all ${highlight ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
      <code className={`text-sm font-black mb-1 block ${highlight ? 'text-emerald-400' : 'text-white'}`}>{cmd}</code>
      <p className="text-[11px] text-gray-500 font-bold leading-tight">{desc}</p>
    </div>
  );
}