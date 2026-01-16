import { useState, useEffect, useRef } from 'react';
import { useBotStore } from '@/lib/store';
import { Plus, Trash2, Play, Square, Activity, DollarSign, Vote, Users, List, RefreshCw, Eye, EyeOff, Trophy, RotateCcw, ChevronRight, X, CheckCircle } from 'lucide-react';
import { Modal } from './Modals';
import { motion, AnimatePresence } from 'framer-motion';

export default function VoteTab({ onSend }: { onSend: (msg: any) => void }) {
  const { vote } = useBotStore();
  const currentVote = vote.currentVote;
  
  const [activeView, setActiveView] = useState<'current' | 'history'>('current');
  const [ballots, setBallots] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  
  const [isBallotModalOpen, setIsBallotModalOpen] = useState(false);
  const [isPickModalOpen, setIsPickModalOpen] = useState(false);
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);
  
  const [targetVoteId, setTargetVoteId] = useState<string | null>(null);
  const [pickCount, setPickCount] = useState(1);
  const [pickFilter, setPickFilter] = useState<'all' | 'win' | 'lose'>('all');

  const [winners, setWinners] = useState<any[]>([]);
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'accel' | 'spin' | 'decel' | 'stop'>('idle');
  
  const [showNicknames, setShowNicknames] = useState(false);
  
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [mode, setMode] = useState<'normal' | 'donation'>('normal');

  useEffect(() => {
    const handleBallots = (e: any) => { setBallots(e.detail); setIsBallotModalOpen(true); };
    const handleHistory = (e: any) => { setHistory(e.detail); };
    
    // [Fix] 애니메이션 시간 연장 및 단계 세분화
    const handleWinner = (e: any) => { 
        setWinners(e.detail); 
        setIsPickModalOpen(false); 
        setIsWinnerModalOpen(true); 
        
        setAnimationPhase('accel');
        setTimeout(() => setAnimationPhase('spin'), 1000); // 1초 가속
        setTimeout(() => setAnimationPhase('decel'), 4000); // 3초 고속 회전
        setTimeout(() => setAnimationPhase('stop'), 6000); // 2초 감속 후 정지 (총 6초)
    };

    window.addEventListener('voteBallotsResponse', handleBallots);
    window.addEventListener('voteHistoryResponse', handleHistory);
    window.addEventListener('voteWinnerResult', handleWinner);

    if (activeView === 'history') onSend({ type: 'getVoteHistory' });

    return () => {
        window.removeEventListener('voteBallotsResponse', handleBallots);
        window.removeEventListener('voteHistoryResponse', handleHistory);
        window.removeEventListener('voteWinnerResult', handleWinner);
    };
  }, [activeView]);

  const handleCreate = () => {
    const validOptions = options.filter(o => o.trim());
    if (!title.trim() || validOptions.length < 2) return alert('제목과 최소 2개의 항목이 필요합니다.');
    onSend({ type: 'createVote', title, options: validOptions, mode });
    setTitle(''); setOptions(['', '']);
  };

  const handleShowBallots = (voteId: string) => onSend({ type: 'getBallots', voteId });
  
  const handleReset = () => {
      if (confirm('현재 투표를 초기화하시겠습니까? (기록에는 남습니다)')) {
          onSend({ type: 'resetVote' });
          setTitle(''); setOptions(['', '']);
      }
  };

  const handleMoveToHistory = () => {
      onSend({ type: 'resetVote' }); 
      setActiveView('history');      
      setTimeout(() => onSend({ type: 'getVoteHistory' }), 1000); 
  };

  const openPickModal = (voteId: string) => {
      onSend({ type: 'getBallots', voteId });
      setTargetVoteId(voteId);
      setPickCount(1);
      setPickFilter('all');
      setIsPickModalOpen(true);
  };

  const executePick = () => {
      if (!targetVoteId) return;
      onSend({ type: 'pickVoteWinner', voteId: targetVoteId, count: pickCount, filter: pickFilter, optionId: null });
  };

  const sliderStyle = {
      background: `linear-gradient(to right, #10b981 0%, #10b981 ${(pickCount - 1) * (100 / 9)}%, #374151 ${(pickCount - 1) * (100 / 9)}%, #374151 100%)`
  };

  // [Fix] 슬롯머신 디자인 개선 (속도 조절, 구분선 삭제, 중앙 강조 확대)
  const SlotColumn = ({ winnerName, delay }: { winnerName: string, delay: number }) => {
      const pool = ballots.map(b => b.nickname);
      // 데이터가 적을 때 반복해서 채워줌
      const rollingItems = pool.length > 0 
        ? Array(20).fill(pool).flat().slice(0, 50) 
        : Array(50).fill("집계 중...");
      
      const itemHeight = 100; // 칸 높이 확대
      const totalHeight = rollingItems.length * itemHeight;

      return (
          <div className="w-72 h-[300px] bg-[#222] rounded-3xl border-4 border-[#444] overflow-hidden relative shadow-2xl flex flex-col justify-center">
              {/* 회전부 */}
              <motion.div
                  initial={{ y: -totalHeight + 300 }} 
                  animate={
                      animationPhase === 'accel' ? { y: [-100, 0], transition: { duration: 1, ease: "easeIn" } } :
                      animationPhase === 'spin' ? { y: [-totalHeight/2, 0], transition: { repeat: Infinity, duration: 0.8, ease: "linear" } } : // 속도 조절 (0.5 -> 0.8)
                      animationPhase === 'decel' ? { y: [0, 200], transition: { duration: 2, ease: "easeOut" } } : 
                      { y: 0 } 
                  }
                  className="flex flex-col-reverse items-center w-full absolute top-0 w-full"
                  style={{ top: animationPhase === 'stop' ? '50%' : 'auto', transform: animationPhase === 'stop' ? 'translateY(-50%)' : 'none' }}
              >
                  {/* 회전 중 보여줄 아이템들 */}
                  {animationPhase !== 'stop' && rollingItems.map((name, i) => (
                      <div key={i} style={{ height: itemHeight }} className="flex items-center justify-center w-full">
                          <span className="text-4xl font-black text-white/50 truncate px-4">{name}</span>
                      </div>
                  ))}
                  
                  {/* 최종 결과 아이템 */}
                  {animationPhase === 'stop' && (
                      <div style={{ height: itemHeight }} className="flex items-center justify-center w-full">
                          <span className="text-5xl font-black text-emerald-400 truncate px-2 scale-110">{winnerName}</span>
                      </div>
                  )}
              </motion.div>
              
              {/* [Design] 마스크 및 중앙 하이라이트 (구분선 삭제) */}
              <div className="absolute top-0 left-0 w-full h-[100px] bg-gradient-to-b from-[#111] to-transparent z-10 pointer-events-none" />
              <div className="absolute top-[100px] left-0 w-full h-[100px] bg-white/5 z-0 rounded-lg" /> {/* 중앙 강조 */}
              <div className="absolute bottom-0 left-0 w-full h-[100px] bg-gradient-to-t from-[#111] to-transparent z-10 pointer-events-none" />
          </div>
      );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex gap-4 border-b border-white/10 pb-4">
          <button onClick={() => setActiveView('current')} className={`px-6 py-2 rounded-xl font-bold transition-all ${activeView === 'current' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>진행 중인 투표</button>
          <button onClick={() => { setActiveView('history'); onSend({ type: 'getVoteHistory' }); }} className={`px-6 py-2 rounded-xl font-bold transition-all ${activeView === 'history' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>투표 기록</button>
      </div>

      {activeView === 'current' && (
          <div className="grid grid-cols-12 gap-8">
              <div className="col-span-4 bg-white/5 border border-white/5 p-8 rounded-[2rem] h-fit">
                  <h3 className="text-xl font-black mb-6 flex items-center gap-3"><Vote className="text-emerald-500" /> 새 투표</h3>
                  <div className="space-y-6">
                    <div><label className="block text-xs font-bold text-gray-400 mb-2 ml-1">주제</label><input value={title} onChange={e => setTitle(e.target.value)} placeholder="투표 제목 입력" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all font-bold" /></div>
                    <div className="grid grid-cols-2 gap-2"><button onClick={() => setMode('normal')} className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${mode === 'normal' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 'bg-black/20 border-white/5 text-gray-500 hover:bg-white/5'}`}><Users size={20} /><span className="text-xs font-bold">일반 (1인1표)</span></button><button onClick={() => setMode('donation')} className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${mode === 'donation' ? 'bg-pink-500/20 border-pink-500 text-pink-500' : 'bg-black/20 border-white/5 text-gray-500 hover:bg-white/5'}`}><DollarSign size={20} /><span className="text-xs font-bold">후원 (금액비례)</span></button></div>
                    <div className="space-y-3"><label className="block text-xs font-bold text-gray-400 ml-1">항목</label>{options.map((opt, i) => (<div key={i} className="flex gap-2 items-center"><span className="text-xs text-gray-500 w-4 font-bold">{i+1}</span><input value={opt} onChange={e => {const n=[...options]; n[i]=e.target.value; setOptions(n);}} placeholder={`항목 ${i + 1}`} className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white" />{options.length > 2 && <button onClick={() => setOptions(options.filter((_, idx) => idx !== i))} className="text-gray-600 hover:text-red-500"><X size={16} /></button>}</div>))}<div className="flex justify-end"><button onClick={() => setOptions([...options, ''])} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold flex items-center gap-2 transition-all"><Plus size={14} /> 항목 추가</button></div></div>
                    <div className="flex gap-2"><button onClick={handleCreate} className="flex-[3] py-4 bg-emerald-500 text-black font-black rounded-xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20">투표 시작하기</button><button onClick={handleReset} className="flex-1 py-4 bg-red-500/10 text-red-500 font-bold rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20" title="초기화"><RotateCcw size={20} className="mx-auto" /></button></div>
                  </div>
              </div>

              <div className="col-span-8 relative">
                  {(!currentVote) ? (
                      <div className="h-full bg-white/5 border border-white/5 p-8 rounded-[2rem] flex flex-col items-center justify-center text-gray-500">
                          <Activity size={48} className="mb-4 opacity-30" />
                          <p className="font-bold">진행 중인 투표가 없습니다.</p>
                      </div>
                  ) : (
                      <div className="h-full bg-white/5 border border-white/5 p-8 rounded-[2rem] flex flex-col relative overflow-hidden">
                          <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                          <div className="flex justify-between items-start mb-8 z-10">
                              <div>
                                  <div className="flex items-center gap-3 mb-2"><span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${currentVote.status === 'active' ? 'bg-emerald-500 text-black animate-pulse' : 'bg-gray-600 text-white'}`}>{currentVote.status === 'active' ? 'Live' : 'Ended'}</span><span className="text-xs font-bold text-gray-400">{currentVote.mode === 'normal' ? '1인 1표' : '후원 금액 비례'}</span></div>
                                  <h2 className="text-4xl font-black tracking-tight">{currentVote.title}</h2>
                              </div>
                              <div className="flex gap-2"><button onClick={handleReset} className="p-2 bg-white/5 rounded-lg hover:bg-red-500 hover:text-white text-gray-500 transition-all" title="초기화"><RotateCcw size={18}/></button><button onClick={() => onSend({ type: 'toggleOverlay', visible: true, view: 'vote' })} className="px-3 py-2 bg-white/10 rounded-lg text-xs font-bold hover:bg-white/20">오버레이 띄우기</button></div>
                          </div>
                          <div className="flex-1 space-y-4 z-10 overflow-y-auto custom-scrollbar pr-2 max-h-[500px]">
                              {currentVote.options && currentVote.options.map((opt: any, i: number) => {
                                  const total = currentVote.totalParticipants || 1; 
                                  const count = opt.count || 0;
                                  const percent = total === 0 ? 0 : Math.round((count / total) * 100);
                                  const label = typeof opt === 'string' ? opt : (opt.label || `항목 ${i+1}`);
                                  return (
                                      <div key={opt.id || i} className="group relative h-16 bg-black/40 rounded-2xl overflow-hidden border border-white/5 hover:border-emerald-500/30 transition-all">
                                          <div className="absolute top-0 left-0 h-full bg-emerald-500/20 transition-all duration-1000 ease-out" style={{ width: `${percent}%` }} />
                                          <div className="absolute inset-0 flex items-center justify-between px-6">
                                              <span className="font-bold text-lg flex items-center gap-3"><span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-emerald-500 font-black">{i + 1}</span> {label}</span>
                                              <div className="text-right"><span className="font-black text-xl tabular-nums block">{count}</span><span className="text-[10px] text-gray-500 font-bold">{percent}%</span></div>
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                          <div className="mt-8 flex gap-3 z-10 pt-6 border-t border-white/10">
                              {currentVote.status === 'ready' && <button onClick={() => onSend({ type: 'startVote' })} className="flex-1 py-4 bg-emerald-500 text-black font-black rounded-2xl hover:scale-[1.02] transition-all">투표 시작</button>}
                              {currentVote.status === 'active' && <button onClick={() => onSend({ type: 'endVote' })} className="flex-1 py-4 bg-red-500 text-white font-black rounded-2xl hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all">투표 마감</button>}
                              {currentVote.status === 'ended' && (
                                  <>
                                      <button onClick={handleMoveToHistory} className="flex-1 py-4 bg-gray-700 text-white font-bold rounded-2xl hover:bg-gray-600 transition-all flex items-center justify-center gap-2">기록으로 이동 <ChevronRight size={18} /></button>
                                      <button onClick={() => openPickModal(currentVote.id)} className="px-6 bg-emerald-500/20 text-emerald-500 font-black rounded-2xl hover:bg-emerald-500 hover:text-black transition-all border border-emerald-500/50 flex items-center gap-2"><Trophy size={18} /> 결과 추첨</button>
                                  </>
                              )}
                              <button onClick={() => handleShowBallots(currentVote.id)} className="px-5 bg-white/5 rounded-2xl font-bold hover:bg-white/10 transition-all border border-white/5" title="투표자 보기"><List size={20}/></button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}

      {activeView === 'history' && (
          <div className="space-y-4">
              {history.length === 0 ? <div className="text-center py-20 text-gray-500 bg-white/5 rounded-[2rem] border border-white/5"><RefreshCw size={48} className="mx-auto mb-4 opacity-50" /><p>투표 기록이 없습니다.</p></div> : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {history.map((v) => (
                          <div key={v.id} className="bg-black/20 p-6 rounded-3xl border border-white/5 hover:border-emerald-500/30 transition-all group">
                              <div className="flex justify-between items-start mb-4">
                                  <div><h4 className="font-bold text-xl text-white mb-1">{v.title}</h4><p className="text-xs text-gray-500">{new Date(v.created_at).toLocaleString()} • {v.mode === 'normal' ? '일반' : '후원'}</p></div>
                                  <div className="flex gap-1 opacity-50 group-hover:opacity-100 transition-all"><button onClick={() => { if(confirm('삭제하시겠습니까?')) { onSend({type:'deleteVote', voteId:v.id}); setTimeout(() => onSend({type:'getVoteHistory'}), 500); } }} className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg"><Trash2 size={18}/></button></div>
                              </div>
                              <div className="flex gap-2 mt-auto">
                                  <button onClick={() => { handleShowBallots(v.id); setIsBallotModalOpen(true); }} className="flex-1 py-3 bg-white/5 rounded-xl text-sm font-bold hover:bg-white/10">투표자 목록</button>
                                  <button onClick={() => openPickModal(v.id)} className="flex-1 py-3 bg-emerald-500/10 text-emerald-500 rounded-xl text-sm font-bold hover:bg-emerald-500 hover:text-black transition-all flex items-center justify-center gap-2"><Trophy size={16}/> 추첨하기</button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      )}

      {/* [Fix] 투표자 보기 모달 (항목별 그룹화 복구) */}
      <Modal isOpen={isBallotModalOpen} onClose={() => setIsBallotModalOpen(false)} title="투표자 상세 현황">
          <div className="space-y-6">
              <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                  <span className="font-bold text-white">총 {ballots.length}명 참여</span>
                  <button onClick={() => setShowNicknames(!showNicknames)} className="flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 transition-all">{showNicknames ? <EyeOff size={14} /> : <Eye size={14} />} {showNicknames ? '닉네임 가리기' : '닉네임 보기'}</button>
              </div>
              <div className="max-h-[500px] overflow-y-auto custom-scrollbar space-y-6 pr-2">
                  {/* 현재 투표 정보가 있으면 항목별 그룹화 */}
                  {currentVote && currentVote.options ? currentVote.options.map((opt: any) => {
                      const voters = ballots.filter(b => b.optionId === opt.id);
                      const percent = ballots.length === 0 ? 0 : Math.round((voters.length / ballots.length) * 100);
                      const label = typeof opt === 'string' ? opt : (opt.label || '항목');

                      return (
                          <div key={opt.id} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                              <div className="flex justify-between items-end mb-2"><h4 className="font-bold text-lg text-white">{label}</h4><span className="text-xs font-bold text-emerald-500">{voters.length}명 ({percent}%)</span></div>
                              <div className="h-1.5 bg-black/40 rounded-full overflow-hidden mb-4"><div className="h-full bg-emerald-500" style={{ width: `${percent}%` }} /></div>
                              <div className="flex flex-wrap gap-2">{voters.map((b, idx) => (<div key={idx} className="inline-flex items-center gap-2 bg-black/20 px-3 py-2 rounded-lg border border-white/5"><div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-black text-gray-400">{idx+1}</div><span className="text-sm font-medium text-gray-300">{showNicknames ? b.nickname : `익명(${b.userIdHash.substring(0,4)})`}</span></div>))}</div>
                          </div>
                      );
                  }) : (
                      // 투표 기록에서 열어서 옵션 정보가 없을 때: 전체 리스트 표시
                      <div className="flex flex-wrap gap-2">{ballots.map((b, idx) => (<div key={idx} className="inline-flex items-center gap-2 bg-black/20 px-3 py-2 rounded-lg border border-white/5"><span className="text-sm font-medium text-gray-300 truncate">{showNicknames ? b.nickname : `익명(${b.userIdHash.substring(0,4)})`}</span></div>))}</div>
                  )}
              </div>
          </div>
      </Modal>

      {/* 모달 2: 추첨 설정 */}
      <Modal isOpen={isPickModalOpen} onClose={() => setIsPickModalOpen(false)} title="당첨자 추첨 설정">
          <div className="space-y-8 py-4">
              <div>
                  <label className="block text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest">추첨 인원 ({pickCount}명)</label>
                  <div className="flex items-center gap-4">
                      <input type="range" min="1" max="10" value={pickCount} onChange={e => setPickCount(Number(e.target.value))} className="flex-1 h-3 rounded-lg appearance-none cursor-pointer bg-gray-700" style={sliderStyle} />
                      <input type="number" min="1" max="99" value={pickCount} onChange={e => setPickCount(Number(e.target.value))} className="w-16 bg-black/40 border border-white/10 rounded-xl px-2 py-2 text-center font-bold text-white" />
                  </div>
              </div>
              <div>
                  <label className="block text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest">추첨 대상 (Filter)</label>
                  <div className="grid grid-cols-3 gap-3">
                      {[ { id: 'all', label: '전체 참여자' }, { id: 'win', label: '이긴 항목 (승)' }, { id: 'lose', label: '진 항목 (패)' } ].map((f) => (
                          <button key={f.id} onClick={() => setPickFilter(f.id as any)} className={`py-4 rounded-xl text-sm font-black border transition-all ${pickFilter === f.id ? 'bg-emerald-500 text-black border-emerald-500 shadow-lg' : 'bg-black/20 border-white/10 text-gray-400 hover:text-white'}`}>{f.label}</button>
                      ))}
                  </div>
              </div>
              <button onClick={executePick} className="w-full py-5 bg-emerald-500 text-black font-black rounded-2xl hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 text-lg flex items-center justify-center gap-2"><Trophy size={24}/> 추첨 시작</button>
          </div>
      </Modal>

      {/* 모달 3: 결과 슬롯머신 (고품질 애니메이션) */}
      <AnimatePresence>
          {isWinnerModalOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl">
                  <div className="relative w-full max-w-6xl p-10 flex flex-col items-center">
                      <button onClick={() => setIsWinnerModalOpen(false)} className="absolute top-0 right-0 p-4 text-gray-500 hover:text-white"><X size={32} /></button>
                      
                      {animationPhase !== 'stop' ? (
                          <div className="flex flex-col items-center gap-12 w-full">
                              <h2 className="text-6xl font-black text-white italic uppercase tracking-tighter drop-shadow-2xl">Drawing...</h2>
                              <div className="flex gap-6 justify-center w-full flex-wrap">
                                  {Array.from({length: Math.min(3, pickCount)}).map((_, i) => (
                                      <SlotColumn key={i} winnerName={winners[i]?.nickname || '???'} delay={i * 0.2} />
                                  ))}
                              </div>
                              <p className="text-emerald-500 font-black animate-pulse text-3xl uppercase tracking-[0.5em] drop-shadow-2xl mt-8">Spinning...</p>
                          </div>
                      ) : (
                          <div className="flex flex-col items-center gap-10 w-full animate-in zoom-in duration-500">
                              <div className="flex items-center gap-4"><Trophy size={80} className="text-yellow-400 animate-bounce" /><h2 className="text-7xl font-black text-white italic uppercase tracking-tighter drop-shadow-2xl">Winners!</h2></div>
                              <div className={`grid gap-8 w-full ${winners.length > 3 ? 'grid-cols-4' : 'grid-cols-' + winners.length} justify-center`}>
                                  {winners.map((w, i) => (
                                      <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.2 }} key={i} className="bg-gradient-to-br from-emerald-500/20 to-black border border-emerald-500/50 p-10 rounded-[3rem] flex flex-col items-center gap-6 shadow-[0_0_50px_rgba(16,185,129,0.3)] hover:scale-105 transition-transform">
                                          <div className="w-20 h-20 bg-emerald-500 text-black rounded-full flex items-center justify-center font-black text-3xl shadow-xl">{i+1}</div>
                                          <div className="text-4xl font-black text-white text-center break-all leading-tight">{w.nickname}</div>
                                      </motion.div>
                                  ))}
                              </div>
                              <button onClick={() => setIsWinnerModalOpen(false)} className="px-12 py-4 bg-white/10 rounded-full font-bold hover:bg-white/20 transition-all mt-10 text-lg">닫기</button>
                          </div>
                      )}
                  </div>
              </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
}
