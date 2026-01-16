'use client';

import { useState } from 'react';
import { Vote, Gift, Disc, Settings } from 'lucide-react';
import VoteTab from './VoteTab';
import DrawTab from './DrawTab';
import RouletteTab from './RouletteTab';
import SettingsTab from './SettingsTab';

type SubTabType = 'vote' | 'draw' | 'roulette' | 'settings';

const tabs: { id: SubTabType; label: string; icon: typeof Vote; activeColor: string }[] = [
  { id: 'vote', label: '실시간 투표', icon: Vote, activeColor: 'bg-emerald-500 text-black' },
  { id: 'draw', label: '추첨', icon: Gift, activeColor: 'bg-pink-500 text-white' },
  { id: 'roulette', label: '룰렛', icon: Disc, activeColor: 'bg-indigo-500 text-white' },
  { id: 'settings', label: '설정', icon: Settings, activeColor: 'bg-gray-600 text-white' },
];

export default function VotesLayout({ onSend }: { onSend: (msg: any) => void }) {
  const [subTab, setSubTab] = useState<SubTabType>('vote');

  return (
    <div className="space-y-6">
      {/* Sub Navigation - 모바일 대응 */}
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-2 md:gap-3 bg-white/5 p-1.5 md:p-2 rounded-xl md:rounded-2xl w-fit min-w-full md:min-w-0 border border-white/5">
          {tabs.map(({ id, label, icon: Icon, activeColor }) => (
            <button
              key={id}
              onClick={() => setSubTab(id)}
              className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-3 rounded-lg md:rounded-xl font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap text-sm md:text-base ${
                subTab === id
                  ? `${activeColor} shadow-lg`
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={18} className="md:w-5 md:h-5" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{label.split(' ').pop()}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[500px] md:min-h-[600px]">
        {subTab === 'vote' && <VoteTab onSend={onSend} />}
        {subTab === 'draw' && <DrawTab onSend={onSend} />}
        {subTab === 'roulette' && <RouletteTab onSend={onSend} />}
        {subTab === 'settings' && <SettingsTab onSend={onSend} />}
      </div>
    </div>
  );
}
