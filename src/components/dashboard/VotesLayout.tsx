'use client';

import { useState } from 'react';
import { Vote, Gift, Disc } from 'lucide-react';
import VoteTab from './VoteTab';
import DrawTab from './DrawTab';
import RouletteTab from './RouletteTab';

export default function VotesLayout({ onSend }: { onSend: (msg: any) => void }) {
  const [subTab, setSubTab] = useState<'vote' | 'draw' | 'roulette'>('vote');

  return (
    <div className="space-y-8">
      {/* Sub Navigation */}
      <div className="flex gap-4 bg-white/5 p-2 rounded-[1.5rem] w-fit border border-white/5">
        <button 
          onClick={() => setSubTab('vote')}
          className={`px-8 py-3 rounded-2xl font-black flex items-center gap-2 transition-all ${subTab === 'vote' ? 'bg-emerald-500 text-black shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <Vote size={20} /> 실시간 투표
        </button>
        <button 
          onClick={() => setSubTab('draw')}
          className={`px-8 py-3 rounded-2xl font-black flex items-center gap-2 transition-all ${subTab === 'draw' ? 'bg-pink-500 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <Gift size={20} /> 추첨(Draw)
        </button>
        <button 
          onClick={() => setSubTab('roulette')}
          className={`px-8 py-3 rounded-2xl font-black flex items-center gap-2 transition-all ${subTab === 'roulette' ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <Disc size={20} /> 룰렛
        </button>
      </div>

      {/* Content Area */}
      <div className="min-h-[600px]">
        {subTab === 'vote' && <VoteTab onSend={onSend} />}
        {subTab === 'draw' && <DrawTab onSend={onSend} />}
        {subTab === 'roulette' && <RouletteTab onSend={onSend} />}
      </div>
    </div>
  );
}
