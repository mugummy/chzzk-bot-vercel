'use client';

import { useState } from 'react';
import { HandHelping, Sparkles, Clock, History, Trash2, Save, Info, AlertTriangle } from 'lucide-react';
import { useBotStore } from '@/lib/store';
import { motion } from 'framer-motion';

/**
 * GreetTab: 시청자 환영 인사를 관리하는 컴포넌트
 */
export default function GreetTab({ onSend }: { onSend: (msg: any) => void }) {
  const { greet } = useBotStore();
  const [tempMessage, setTempMessage] = useState(greet.settings?.message || '');

  const handleSave = () => {
    onSend({ 
      type: 'updateGreetSettings', 
      data: { message: tempMessage } 
    });
    if (typeof window !== 'undefined' && (window as any).ui?.notify) {
      (window as any).ui.notify('인사 문구가 저장되었습니다.', 'success');
    }
  };

  const handleTypeChange = (type: number) => {
    onSend({ 
      type: 'updateGreetSettings', 
      data: { type } 
    });
  };

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        <div className="xl:col-span-8 bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-12 space-y-10 relative overflow-hidden group">
          <header className="flex justify-between items-center relative z-10">
            <div>
              <h3 className="text-2xl font-black flex items-center gap-3 text-white">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                  <Sparkles size={24} fill="currentColor" />
                </div>
                환영 인사 메시지 설정
              </h3>
              <p className="text-gray-500 font-medium mt-1">새로운 시청자가 채팅을 칠 때 봇이 자동으로 응답합니다.</p>
            </div>
            <button 
              onClick={handleSave}
              className="bg-emerald-500 text-black px-8 py-4 rounded-2xl font-black hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-2"
            >
              <Save size={20} /> <span>설정 저장</span>
            </button>
          </header>

          <div className="space-y-6 relative z-10 text-white">
            <div className="relative group/input">
              <textarea 
                value={tempMessage}
                onChange={e => setTempMessage(e.target.value)}
                className="w-full bg-white/5 border border-white/10 p-8 rounded-[2rem] focus:border-emerald-500/50 transition-all outline-none font-medium text-xl h-48 resize-none leading-relaxed tracking-tight text-white"
                placeholder="인사말을 입력하세요. (예: {user}님, 반갑습니다!)"
              />
              <div className="absolute right-6 bottom-6 flex items-center gap-2 text-gray-500">
                <Info size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{'{user}'} 변수 사용 가능</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => handleTypeChange(1)}
                className={`p-8 rounded-[2rem] border transition-all text-left group ${greet.settings?.type === 1 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${greet.settings?.type === 1 ? 'bg-emerald-500 text-black' : 'bg-white/5 text-gray-400'}`}>
                    <HandHelping size={20} />
                  </div>
                  <span className={`font-black text-lg ${greet.settings?.type === 1 ? 'text-emerald-400' : 'text-gray-400'}`}>평생 최초 1회</span>
                </div>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">채널 방문 시 단 한 번만 인사합니다.</p>
              </button>

              <button 
                onClick={() => handleTypeChange(2)}
                className={`p-8 rounded-[2rem] border transition-all text-left group ${greet.settings?.type === 2 ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${greet.settings?.type === 2 ? 'bg-cyan-500 text-black' : 'bg-white/5 text-gray-400'}`}>
                    <Clock size={20} />
                  </div>
                  <span className={`font-black text-lg ${greet.settings?.type === 2 ? 'text-cyan-400' : 'text-gray-400'}`}>매일마다 최초 1회</span>
                </div>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">날짜가 바뀌고 첫 채팅 때마다 인사합니다.</p>
              </button>
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 space-y-8">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 flex flex-col items-center text-center shadow-2xl group hover:border-white/10 transition-all">
            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-emerald-500 mb-6 group-hover:scale-110 transition-transform duration-500">
              <History size={40} />
            </div>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mb-2">총 방문 기억 시청자</p>
            <div className="flex items-end gap-2 mb-8">
              <span className="text-7xl font-black text-white tracking-tighter leading-none">{greet.historyCount || 0}</span>
              <span className="text-xl font-black text-emerald-500 pb-1">명</span>
            </div>
            <button 
              onClick={() => confirm('모든 방문 기록을 삭제하시겠습니까?') && onSend({ type: 'resetGreetHistory' })}
              className="w-full py-5 rounded-[1.5rem] bg-red-500/5 text-red-500 font-black hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-3 border border-red-500/10"
            >
              <Trash2 size={18} /> <span>방문 기록 전체 초기화</span>
            </button>
          </div>

          <div className="bg-amber-500/5 border border-amber-500/10 rounded-[2.5rem] p-8">
            <div className="flex items-center gap-3 mb-4 text-amber-500">
              <AlertTriangle size={20} />
              <h4 className="font-black tracking-tight uppercase text-xs">주의사항</h4>
            </div>
            <p className="text-sm text-amber-500/60 font-medium leading-relaxed">
              너무 많은 시청자에게 동시에 인사할 경우 채팅 금지 사유가 될 수 있습니다.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}