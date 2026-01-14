'use client';

import { useEffect, useState } from 'react';
import { useBotStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, BarChart3, Trophy, X } from 'lucide-react';

/**
 * OverlayVote: 투표 및 룰렛 통합 오버레이 (OBS용)
 * 평소에는 투명하다가 이벤트 발생 시 자동으로 UI가 나타납니다.
 */
export default function OverlayVote() {
  const store = useBotStore();
  const { votes, roulette } = store;
  const currentVote = votes?.[0];
  
  // 상태 동기화
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`wss://web-production-19eef.up.railway.app/?token=${token}`);
    
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'connect' }));
      ws.send(JSON.stringify({ type: 'requestData' }));
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'voteStateUpdate') store.updateVotes(data.payload);
        if (data.type === 'rouletteStateUpdate') {
            // 룰렛 데이터 구조 맞추기
            useBotStore.setState(state => ({ 
                roulette: { 
                    items: data.payload.items, 
                    isSpinning: data.payload.isSpinning, 
                    winner: data.payload.winner 
                } 
            }));
        }
        if (data.type === 'connectResult') {
            // 초기 데이터 로드
        }
      } catch (err) {}
    };
    setSocket(ws);

    return () => ws.close();
  }, []);

  // [화면 전환 로직]
  // 1. 룰렛이 돌고 있거나 결과가 나왔을 때 -> 룰렛 화면
  // 2. 투표가 진행 중일 때 -> 투표 화면
  // 3. 둘 다 아니면 -> 숨김 (투명)

  const showRoulette = roulette.isSpinning || roulette.winner;
  const showVote = currentVote?.isActive;

  if (!showRoulette && !showVote) return null; // 아무것도 안 함 (투명)

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-transparent overflow-hidden font-sans p-10">
      <AnimatePresence mode="wait">
        
        {/* 1. 룰렛 오버레이 */}
        {showRoulette && (
          <motion.div 
            key="roulette"
            initial={{ scale: 0, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            exit={{ scale: 0, opacity: 0 }}
            className="bg-[#0a0a0a]/90 backdrop-blur-xl border-4 border-white/10 rounded-[3rem] p-12 shadow-2xl flex flex-col items-center gap-8 min-w-[500px]"
          >
            <div className="relative">
              {/* 룰렛 휠 애니메이션 */}
              <motion.div 
                animate={{ rotate: roulette.isSpinning ? 3600 : 0 }} 
                transition={{ duration: 5, ease: "circOut" }} // 점점 느려지게
                className="w-80 h-80 rounded-full border-8 border-pink-500/30 bg-black flex items-center justify-center relative overflow-hidden"
                style={{ background: 'conic-gradient(from 0deg, #ec4899 0deg 90deg, #8b5cf6 90deg 180deg, #3b82f6 180deg 270deg, #10b981 270deg 360deg)' }}
              >
                <div className="w-72 h-72 bg-[#0a0a0a] rounded-full flex items-center justify-center z-10">
                   <PieChart size={100} className="text-pink-500" />
                </div>
              </motion.div>
              {/* 화살표 */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] border-t-white z-20 drop-shadow-lg" />
            </div>

            <div className="text-center space-y-4">
              {roulette.winner ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1.2, rotate: [0, -5, 5, 0] }} className="space-y-2">
                  <p className="text-pink-400 font-black text-xl uppercase tracking-widest">Winner</p>
                  <h2 className="text-6xl font-black text-white drop-shadow-[0_0_20px_rgba(236,72,153,0.5)]">{roulette.winner.text}</h2>
                </motion.div>
              ) : (
                <h2 className="text-4xl font-black text-white animate-pulse">추첨 진행 중...</h2>
              )}
            </div>
          </motion.div>
        )}

        {/* 2. 투표 오버레이 */}
        {!showRoulette && showVote && currentVote && (
          <motion.div 
            key="vote"
            initial={{ y: 100, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 100, opacity: 0 }}
            className="bg-[#0a0a0a]/90 backdrop-blur-xl border-4 border-emerald-500/30 rounded-[3rem] p-10 shadow-2xl w-full max-w-4xl"
          >
            <div className="flex items-center gap-6 mb-8">
              <div className="bg-emerald-500 text-black p-4 rounded-2xl shadow-lg shadow-emerald-500/20">
                <BarChart3 size={40} strokeWidth={2.5} />
              </div>
              <h1 className="text-4xl font-black text-white tracking-tight leading-none">{currentVote.question}</h1>
            </div>

            <div className="space-y-4">
              {currentVote.options.map((opt, i) => {
                const total = currentVote.totalVotes || 1;
                const percent = Math.round((currentVote.results[opt.id] / total) * 100);
                
                return (
                  <div key={opt.id} className="relative">
                    {/* 배경 바 */}
                    <div className="bg-white/5 rounded-2xl h-20 w-full overflow-hidden border border-white/5 flex items-center px-6 relative z-0">
                      {/* 게이지 바 */}
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ type: "spring", stiffness: 50 }}
                        className="absolute left-0 top-0 bottom-0 bg-emerald-500/20"
                      />
                      
                      {/* 텍스트 내용 */}
                      <div className="relative z-10 flex justify-between items-center w-full">
                        <div className="flex items-center gap-4">
                          <span className="bg-emerald-500 text-black w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl">{i + 1}</span>
                          <span className="text-2xl font-bold text-white">{opt.text}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-3xl font-black text-emerald-400">{percent}%</span>
                          <span className="text-sm font-bold text-gray-500 ml-2">({currentVote.results[opt.id]}표)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 text-center">
              <p className="text-emerald-500/70 font-black text-sm uppercase tracking-[0.3em] animate-pulse">
                채팅창에 번호를 입력하여 투표하세요!
              </p>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}