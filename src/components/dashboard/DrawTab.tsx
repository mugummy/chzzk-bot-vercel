import { useState, useEffect } from 'react';
import { useBotStore } from '@/lib/store';
import { Gift, Users, Trophy, DollarSign, Play, CheckCircle2, RotateCcw } from 'lucide-react';
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
          setTimeout(() => setIsRolling(false), 500);
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

  return (
    <div className="grid grid-cols-12 gap-8 h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 왼쪽: 설정 */}
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
                {draw.isCollecting ? '참여자 모집 중...' : '추첨 시작 (모집)'}
            </button>
        </div>
      </div>

      {/* 오른쪽: 결과 및 애니메이션 */}
      <div className="col-span-8 space-y-6">
          <div className="bg-white/5 border border-white/5 p-8 rounded-[2rem] flex items-center justify-between relative overflow-hidden h-40 shadow-2xl">
             <div className="absolute top-0 right-0 p-32 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
             <div>
                 <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Entry Pool</p>
                 <h2 className="text-4xl font-black text-white italic">{draw.isCollecting ? 'Collecting Chat...' : 'Ready to Spin'}</h2>
             </div>
             <div className="flex items-center gap-4 z-10">
                 <div className="bg-black/40 px-8 py-4 rounded-[2rem] border border-white/5 text-right">
                     <p className="text-[10px] font-black text-pink-500 uppercase tracking-[0.2em] mb-1">Total Entries</p>
                     <p className="text-5xl font-black tabular-nums text-white">{draw.participantCount}</p>
                 </div>
                 <button onClick={reset} className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><RotateCcw size={24}/></button>
             </div>
          </div>

          {draw.isCollecting && (
              <button onClick={pickWinners} className="w-full py-8 bg-emerald-500 text-black font-black text-3xl rounded-[2.5rem] hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_50px_rgba(16,185,129,0.3)] flex items-center justify-center gap-4">
                  <Trophy size={40} /> 당첨자 뽑기
              </button>
          )}

          {/* 대시보드 슬롯머신 애니메이션 */}
          <AnimatePresence mode="wait">
              {(isRolling || draw.winners.length > 0) && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-black/60 border-2 border-white/10 rounded-[3rem] p-10 min-h-[350px] flex flex-col items-center justify-center relative overflow-hidden"
                  >
                      {isRolling ? (
                          <div className="flex flex-col items-center gap-6">
                              <div className="flex gap-4">
                                  {Array.from({length: Math.min(3, winnerCount)}).map((_, slotIdx) => (
                                      <div key={slotIdx} className="w-48 h-64 bg-white/5 rounded-3xl border-2 border-pink-500/30 overflow-hidden relative">
                                          <motion.div 
                                            animate={{ y: [-1000, 0] }}
                                            transition={{ repeat: Infinity, duration: 0.3, ease: "linear" }}
                                            className="flex flex-col gap-8 py-4 items-center"
                                          >
                                              {['닉네임_A', '닉네임_B', '닉네임_C', '사용자_X', '시청자_Y', '치지직_Z'].map((name, i) => (
                                                  <div key={i} className="text-xl font-black text-gray-600 blur-[1px]">{name}</div>
                                              ))}
                                          </motion.div>
                                          <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none" />
                                      </div>
                                  ))}
                              </div>
                              <p className="text-pink-500 font-black animate-pulse text-xl uppercase tracking-[0.3em]">Spinning Slots...</p>
                          </div>
                      ) : (
                          <div className="w-full space-y-8">
                              <div className="flex items-center justify-center gap-4 mb-4">
                                  <Trophy className="text-yellow-400" size={48} />
                                  <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter">Congratulations!</h3>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
                                  {draw.winners.map((w: any, i: number) => (
                                      <motion.div 
                                        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: i * 0.1, type: 'spring' }}
                                        key={i} className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6 rounded-[2rem] flex flex-col items-center gap-3 shadow-2xl"
                                      >
                                          <div className="w-12 h-12 bg-yellow-400 text-black flex items-center justify-center rounded-full font-black text-xl shadow-[0_0_20px_rgba(250,204,21,0.4)]">{i+1}</div>
                                          <span className="text-2xl font-black text-white text-center break-all leading-tight">{w.nickname || w.nick}</span>
                                          {w.amount && <span className="text-xs font-bold text-emerald-400 font-mono">₩{w.amount.toLocaleString()}</span>}
                                      </motion.div>
                                  ))}
                              </div>
                              <button onClick={() => { setIsRolling(false); onSend({type:'startDraw', settings: draw.settings}); }} className="mt-8 text-gray-500 hover:text-white text-xs font-bold transition-all uppercase tracking-widest">새로 추첨하기</button>
                          </div>
                      )}
                  </motion.div>
              )}
          </AnimatePresence>
      </div>
    </div>
  );
}
