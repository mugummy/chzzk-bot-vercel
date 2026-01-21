import { useState } from 'react';
import { Vote, Gift, Disc, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VoteTab from './VoteTab';
import DrawTab from './DrawTab';
import RouletteTab from './RouletteTab'; // 룰렛 탭이 아직 없다면 생성 필요
import SettingsTab from './SettingsTab';

export default function VotesLayout({ onSend }: { onSend: (msg: any) => void }) {
  const [activeSubTab, setActiveSubTab] = useState<'vote' | 'draw' | 'roulette' | 'settings'>('vote');

  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-4 mb-8 border-b border-white/5 pb-2">
        <button onClick={() => setActiveSubTab('vote')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeSubTab === 'vote' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}><Vote size={20}/> 투표</button>
        <button onClick={() => setActiveSubTab('draw')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeSubTab === 'draw' ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}><Gift size={20}/> 추첨</button>
        <button onClick={() => setActiveSubTab('roulette')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeSubTab === 'roulette' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}><Disc size={20}/> 룰렛</button>
        <div className="flex-1" />
        <button onClick={() => setActiveSubTab('settings')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeSubTab === 'settings' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}><Settings size={20}/> 설정</button>
      </div>

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={activeSubTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full">
            {activeSubTab === 'vote' && <VoteTab onSend={onSend} />}
            {activeSubTab === 'draw' && <DrawTab onSend={onSend} />}
            {activeSubTab === 'roulette' && <RouletteTab onSend={onSend} />}
            {activeSubTab === 'settings' && <SettingsTab onSend={onSend} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
