'use client';

import { useEffect, useState } from 'react';
import { useBotStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Users } from 'lucide-react';

/**
 * VoteOverlay: OBS 방송 화면 전용 실시간 투표 컴포넌트
 */
export default function VoteOverlay() {
  const store = useBotStore();
  const currentVote = store.votes.length > 0 ? store.votes[store.votes.length - 1] : null;
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`wss://web-production-19eef.up.railway.app/?token=${token}`);
    
    ws.onopen = () => ws.send(JSON.stringify({ type: 'connect' }));
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'voteStateUpdate') store.updateVotes(data.payload);
    };

    setSocket(ws);
    return () => ws.close();
  }, []);

  if (!currentVote || !currentVote.isActive) return null;

  const total = Object.values(currentVote.results as Record<string, number>).reduce((a, b) => a + b, 0);

  return (
    <div className="p-10 w-[500px] bg-black/60 backdrop-blur-md rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden font-sans">
      <motion.div 
        initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }}
        className="space-y-8"
      >
        <div className="flex justify-between items-start">
          <h2 className="text-3xl font-black tracking-tighter text-white drop-shadow-lg leading-tight border-l-4 border-emerald-500 pl-5">
            {currentVote.question}
          </h2>
          <div className="bg-emerald-500 text-black px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest animate-pulse shadow-lg">Live</div>
        </div>

        <div className="space-y-6">
          {currentVote.options.map((opt: any, i: number) => {
            const count = (currentVote.results as any)[opt.id] || 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const colors = ['#10b981', '#06b6d4', '#8b5cf6', '#f43f5e'];

            return (
              <div key={i} className="relative h-12 bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="absolute inset-y-0 left-0"
                  style={{ background: `linear-gradient(90deg, ${colors[i % colors.length]}, #fff2)` }}
                />
                <div className="absolute inset-0 flex justify-between items-center px-5 font-black">
                  <span className="text-white text-lg drop-shadow-md">{i + 1}. {opt.text}</span>
                  <span className="text-emerald-400 text-xl drop-shadow-md">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center items-center gap-2 text-gray-400 font-black text-xs uppercase tracking-[0.2em] pt-4 border-t border-white/5">
          <Users size={14} /> <span>{total.toLocaleString()}명 참여 중</span>
        </div>
      </motion.div>
    </div>
  );
}
