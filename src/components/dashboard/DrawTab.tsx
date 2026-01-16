import { useState, useEffect, useMemo } from 'react';
import { useBotStore } from '@/lib/store';
import { Gift, Users, Trophy, DollarSign, Play, CheckCircle2, RotateCcw, StopCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DrawTab({ onSend }: { onSend: (msg: any) => void }) {
  const { draw } = useBotStore();
  const [subTab, setSubTab] = useState<'chat' | 'donation'>('chat');
  
  const [command, setCommand] = useState('!참여');
  const [useCommand, setUseCommand] = useState(true);
  const [subscriberOnly, setSubscriberOnly] = useState(false);
  const [winnerCount, setWinnerCount] = useState(1);
  const [allowDuplicate, setAllowDuplicate] = useState(false);
  
  const [donationMode, setDonationMode] = useState<'all' | 'min'>('all');
  const [minAmount, setMinAmount] = useState(1000);

  const [isRolling, setIsRolling] = useState(false);

  useEffect(() => {
      if (draw.status === 'rolling') {
          setIsRolling(true);
      } else if (draw.status === 'completed') {
          setTimeout(() => setIsRolling(false), 4500); 
      }
  }, [draw.status]);

  const startDraw = () => {
    let target: any = subTab === 'donation' ? 'donation' : (useCommand ? 'chat' : 'all');
    if (subTab === 'chat' && subscriberOnly) target = 'subscriber';

    onSend({
      type: 'startDraw',
      settings: { target, winnerCount, command: useCommand ? command : null, minAmount: donationMode === 'min' ? minAmount : 0, allowDuplicate }
    });
  };

  const stopDraw = () => {
      onSend({ type: 'stopDraw' });
  };

  const pickWinners = () => {
    onSend({ type: 'pickWinners' });
    onSend({ type: 'toggleOverlay', visible: true, view: 'draw' });
  };

  const reset = () => {
      if (confirm('추첨 상태를 초기화하시겠습니까?')) {
          onSend({ type: 'resetDraw' });
          setIsRolling(false);
      }
  };

  // [Fix] SlotColumn 내부에서 rollingItems 자체 생성
  const SlotColumn = ({ winnerName, delay }: { winnerName: string, delay: number }) => {
      const pool = draw.participantsList && draw.participantsList.length > 0 ? draw.participantsList : ["..."];
      // 데이터 불리기
      const repeatCount = Math.ceil(50 / pool.length) + 1;
      const dummyItems = Array(repeatCount).fill(pool).flat();
      const finalItems = [...dummyItems, winnerName];
      
      const itemHeight = 100;
      const totalHeight = finalItems.length * itemHeight;
      const finalY = -((finalItems.length - 1) * itemHeight) + (300 - itemHeight) / 2;

      return (
          <div className="w-72 h-[300px] bg-[#222] rounded-3xl border-4 border-[#444] overflow-hidden relative shadow-2xl flex flex-col justify-start">
              <motion.div
                  initial={{ y: 0 }} 
                  animate={{ y: finalY }}
                  transition={{ 
                      duration: 4, 
                      delay: delay,
                      ease: [0.1, 0.9, 0.2, 1.0] 
                  }}
                  className="flex flex-col items-center w-full absolute top-0"
              >
                  {finalItems.map((name, i) => (
                      <div key={i} style={{ height: itemHeight }} className="flex items-center justify-center w-full flex-shrink-0">
                          <span className={`truncate px-4 ${i === finalItems.length - 1 ? 'text-5xl font-black text-emerald-400 scale-110' : 'text-4xl font-black text-white/30 blur-[0.5px]'}`}>
                              {name}
                          </span>
                      </div>
                  ))}
              </motion.div>
              
              <div className="absolute top-0 left-0 w-full h-[100px] bg-gradient-to-b from-[#111] to-transparent z-10 pointer-events-none" />
              <div className="absolute top-[100px] left-0 w-full h-[100px] bg-white/5 z-0 rounded-lg" /> 
              <div className="absolute bottom-0 left-0 w-full h-[100px] bg-gradient-to-t from-[#111] to-transparent z-10 pointer-events-none" />
          </div>
      );
  };

  return (
    <div className="grid grid-cols-12 gap-8 h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 왼쪽: 설정 패널 */}
      <div className="col-span-4 bg-white/5 border border-white/5 p-6 rounded-[2rem] h-fit">
        <div className="flex gap-2 mb-6 bg-black/20 p-1 rounded-xl">
            <button onClick={() => setSubTab('chat')} className={`flex-1 py-2 rounded-lg font-bold transition-all ${subTab === 'chat' ? 'bg-pink-500 text-white' : 'text-gray-500'}`}>시청자 추첨</button>
            <button onClick={() => setSubTab('donation')} className={`flex-1 py-2 rounded-lg font-bold transition-all ${subTab === 'donation' ? 'bg-yellow-500 text-black' : 'text-gray-500'}`}>후원 추첨</button>
        </div>

        <div className="space-y-6">
            {subTab === 'chat' && (
                <>
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-widest">Entry Method</label>
                        <div className="flex gap-2">
                            <button onClick={() => setUseCommand(false)} className={`flex-1 py-3 border rounded-xl font-bold transition-all ${!useCommand ? 'bg-pink-500/10 border-pink-500 text-pink-500' : 'border-white/5 text-gray-500 hover:bg-white/5'}`}>모든 채팅</button>
                            <button onClick={() => setUseCommand(true)} className={`flex-1 py-3 border rounded-xl font-bold transition-all ${useCommand ? 'bg-pink-500/10 border-pink-500 text-pink-500' : 'border-white/5 text-gray-500 hover:bg-white/5'}`}>명령어 입력</button>
                        </div>
                        {useCommand && <input value={command} onChange={e => setCommand(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:border-pink-500 outline-none" />}
                    </div>
                    <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${subscriberOnly ? 'bg-pink-500/10 border-pink-500/30' : 'bg-black/20 border-white/5'}`}>
                        <div>
                            <p className="font-bold text-white">구독자 전용</p>
                            <p className="text-[10px] text-gray-500">구독 중인 시청자만 참여 가능</p>
                        </div>
                        <input type="checkbox" checked={subscriberOnly} onChange={e => setSubscriberOnly(e.target.checked)} className="w-6 h-6 accent-pink-500" />
                    </div>
                </>
            )}

            {subTab === 'donation' && (
                <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-widest">Amount Filter</label>
                    <div className="flex gap-2">
                        <button onClick={() => setDonationMode('all')} className={`flex-1 py-3 border rounded-xl font-bold ${donationMode === 'all' ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500' : 'border-white/5 text-gray-500'}`}>모든 금액</button>
                        <button onClick={() => setDonationMode('min')} className={`flex-1 py-3 border rounded-xl font-bold ${donationMode === 'min' ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500' : 'border-white/5 text-gray-500'}`}>특정 금액</button>
                    </div>
                    {donationMode === 'min' && <input type="number" value={minAmount} onChange={e => setMinAmount(Number(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:border-yellow-500 outline-none" />}
                </div>
            )}

            <div className="space-y-3">
                <div className="flex justify-between items-center ml-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Winners</label>
                    <span className="text-pink-500 font-black">{winnerCount}명</span>
                </div>
                <div className="flex items-center gap-4">
                    <input type="range" min="1" max="50" value={winnerCount} onChange={e => setWinnerCount(Number(e.target.value))} className="flex-1 accent-pink-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                    <input type="number" value={winnerCount} onChange={e => setWinnerCount(Number(e.target.value))} className="w-16 bg-black/40 border border-white/10 rounded-xl px-2 py-2 text-center font-bold" />
                </div>
            </div>

            <button onClick={startDraw} disabled={draw.isCollecting} className={`w-full py-4 rounded-xl font-black text-lg shadow-xl transition-all ${draw.isCollecting ? 'bg-white/5 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:scale-[1.02]'}`}>
                {draw.isCollecting ? '참여자 모집 중...' : '모집 시작'}
            </button>
        </div>
      </div>

      {/* 오른쪽: 결과 및 애니메이션 */}
      <div className="col-span-8 space-y-6">
          <div className="bg-white/5 border border-white/5 p-8 rounded-[2rem] flex items-center justify-between relative overflow-hidden h-40 shadow-2xl">
             <div className="absolute top-0 right-0 p-32 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
             <div>
                 <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                 <h2 className="text-4xl font-black text-white italic">{draw.isCollecting ? 'Collecting...' : (draw.status === 'completed' ? 'Done' : 'Ready')}</h2>
             </div>
             <div className="flex items-center gap-4 z-10">
                 <div className="bg-black/40 px-8 py-4 rounded-[2rem] border border-white/5 text-right">
                     <p className="text-[10px] font-black text-pink-500 uppercase tracking-[0.2em] mb-1">Entries</p>
                     <p className="text-5xl font-black tabular-nums text-white">{draw.participantCount}</p>
                 </div>
                 <button onClick={reset} className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all" title="초기화"><RotateCcw size={24}/></button>
             </div>
          </div>

          {/* 참여자 리스트 (대기 중일 때) */}
          {draw.status !== 'rolling' && draw.status !== 'completed' && (
              <div className="bg-black/20 p-4 rounded-2xl border border-white/5 max-h-32 overflow-y-auto custom-scrollbar">
                  <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                      {draw.isCollecting ? 'Live Participants' : 'Entries Closed'} ({draw.participantsList?.length || 0})
                  </p>
                  <div className="flex flex-wrap gap-2">
                      {draw.participantsList && draw.participantsList.length > 0 ? (
                          draw.participantsList.map((p, i) => (
                              <span key={i} className="px-2 py-1 bg-white/5 rounded text-xs font-medium text-gray-300 border border-white/5">{p}</span>
                          ))
                      ) : (
                          <span className="text-gray-600 text-xs italic">참여자가 없습니다.</span>
                      )}
                  </div>
              </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex gap-4">
              {draw.isCollecting && (
                  <button onClick={stopDraw} className="flex-1 py-6 bg-red-500 text-white font-black text-2xl rounded-[2.5rem] hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
                      <StopCircle size={32} /> 모집 마감
                  </button>
              )}
              {!draw.isCollecting && draw.status !== 'completed' && draw.participantCount > 0 && (
                  <button onClick={pickWinners} className="flex-1 py-6 bg-emerald-500 text-black font-black text-2xl rounded-[2.5rem] hover:scale-[1.02] transition-all shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center justify-center gap-3">
                      <Trophy size={32} /> 당첨자 뽑기
                  </button>
              )}
          </div>

          {/* 대시보드 슬롯머신 애니메이션 */}
          <AnimatePresence mode="wait">
              {(isRolling || draw.winners.length > 0) && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl"
                  >
                      <div className="relative w-full max-w-6xl p-10 flex flex-col items-center">
                          <button onClick={() => { setIsRolling(false); onSend({type:'startDraw', settings: draw.settings}); }} className="absolute top-0 right-0 p-4 text-gray-500 hover:text-white"><X size={32} /></button>
                          
                          {isRolling ? (
                              <div className="flex flex-col items-center gap-12 w-full">
                                  <h2 className="text-6xl font-black text-white italic uppercase tracking-tighter drop-shadow-2xl">Drawing...</h2>
                                  <div className="flex gap-6 justify-center w-full flex-wrap">
                                      {/* 당첨 인원수만큼 슬롯 생성 */}
                                      {Array.from({length: Math.min(3, winnerCount)}).map((_, i) => (
                                          <SlotColumn key={i} winnerName={draw.winners[i]?.nickname || draw.winners[i]?.nick || '???'} delay={i * 0.2} />
                                      ))}
                                  </div>
                                  <p className="text-pink-500 font-black animate-pulse text-3xl uppercase tracking-[0.5em] drop-shadow-2xl mt-8">Spinning...</p>
                              </div>
                          ) : (
                              <div className="flex flex-col items-center gap-10 w-full animate-in zoom-in duration-500">
                                  <div className="flex items-center gap-4"><Trophy size={80} className="text-yellow-400 animate-bounce" /><h2 className="text-7xl font-black text-white italic uppercase tracking-tighter drop-shadow-2xl">Winners!</h2></div>
                                  <div className={`grid gap-8 w-full ${draw.winners.length > 3 ? 'grid-cols-4' : 'grid-cols-' + draw.winners.length} justify-center px-4`}>
                                      {draw.winners.map((w: any, i: number) => (
                                          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.2 }} key={i} className="bg-gradient-to-br from-pink-500/20 to-black border border-pink-500/50 p-10 rounded-[3rem] flex flex-col items-center gap-6 shadow-[0_0_50px_rgba(236,72,153,0.3)] hover:scale-105 transition-transform">
                                              <div className="w-20 h-20 bg-pink-500 text-black rounded-full flex items-center justify-center font-black text-3xl shadow-xl">{i+1}</div>
                                              <div className="text-4xl font-black text-white text-center break-all leading-tight">{w.nickname || w.nick}</div>
                                              {w.amount && <span className="text-sm font-bold text-yellow-400 font-mono bg-black/40 px-4 py-1 rounded-full mt-2">₩{w.amount.toLocaleString()}</span>}
                                          </motion.div>
                                      ))}
                                  </div>
                                  <div className="text-center mt-10">
                                      <button onClick={() => { setIsRolling(false); onSend({type:'startDraw', settings: draw.settings}); }} className="px-12 py-4 bg-white/10 rounded-full font-bold hover:bg-white/20 transition-all text-lg">닫기 / 다시 시작</button>
                                  </div>
                              </div>
                          )}
                      </div>
                  </motion.div>
              )}
          </AnimatePresence>
      </div>
    </div>
  );
}
