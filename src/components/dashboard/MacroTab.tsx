'use client';

import { useState } from 'react';
import { Clock, Plus, Trash2, Settings, MessageSquare, Play, StopCircle, Info } from 'lucide-react';
import { useBotStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from './Modals';

/**
 * MacroTab: 정기적 채팅 메시지(매크로)를 관리하는 컴포넌트
 */
export default function MacroTab({ onSend }: { onSend: (msg: any) => void }) {
  const { macros } = useBotStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMacro, setNewMacro] = useState({ interval: 10, message: '' });

  const handleSave = () => {
    if (!newMacro.message || newMacro.interval < 1) return;
    onSend({ type: 'addMacro', data: newMacro });
    setNewMacro({ interval: 10, message: '' });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-10">
      <header className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-black text-white flex items-center gap-3">
            <Clock className="text-emerald-500" size={28} /> 정기 매크로 관리
          </h3>
          <p className="text-gray-500 font-medium">일정한 시간마다 자동으로 채팅창에 메시지를 보냅니다.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-500 text-black px-8 py-4 rounded-2xl font-black hover:scale-105 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
        >
          <Plus size={20} /> <span>매크로 추가</span>
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AnimatePresence>
          {macros.length === 0 ? (
            <div className="col-span-full py-32 bg-white/[0.02] border border-dashed border-white/10 rounded-[3.5rem] flex flex-col items-center justify-center text-gray-600">
              <Clock size={64} strokeWidth={1} className="mb-4 opacity-20" />
              <p className="text-xl font-bold tracking-tight">등록된 매크로가 없습니다.</p>
            </div>
          ) : (
            macros.map((macro, i) => (
              <motion.div 
                layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                key={macro.id || i} 
                className="bg-[#0a0a0a] border border-white/5 p-10 rounded-[3.5rem] flex items-center justify-between group hover:border-emerald-500/30 transition-all duration-500"
              >
                <div className="flex items-center gap-8">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-3xl flex flex-col items-center justify-center text-emerald-500 border border-emerald-500/20">
                    <span className="text-2xl font-black leading-none">{macro.interval}</span>
                    <span className="text-[10px] font-black uppercase mt-1">Min</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-white font-black text-xl tracking-tighter">자동 공지 매크로</span>
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded-full uppercase tracking-widest">Active</span>
                    </div>
                    <p className="text-gray-500 font-medium text-lg line-clamp-1 group-hover:text-gray-300 transition-colors">{macro.message}</p>
                  </div>
                </div>
                
                <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-all">
                  <button 
                    onClick={() => onSend({ type: 'removeMacro', data: { id: macro.id } })}
                    className="p-5 bg-red-500/10 rounded-2xl hover:bg-red-500 text-red-500 hover:text-white transition-all shadow-lg"
                  >
                    <Trash2 size={22} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="새 매크로 설정" onSave={handleSave}>
        <div className="space-y-10 py-4">
          <div className="space-y-4">
            <div className="flex justify-between items-end px-1">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">실행 간격 (분)</label>
              <span className="text-emerald-500 font-black text-xl">{newMacro.interval}분 마다</span>
            </div>
            <input 
              type="range" min="1" max="120" step="1"
              value={newMacro.interval} onChange={e => setNewMacro({...newMacro, interval: parseInt(e.target.value)})}
              className="w-full accent-emerald-500"
            />
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">전송할 메시지</label>
            <textarea 
              value={newMacro.message} onChange={e => setNewMacro({...newMacro, message: e.target.value})}
              className="w-full bg-white/5 border border-white/10 p-6 rounded-[1.5rem] focus:border-emerald-500 transition-all outline-none font-medium text-lg h-40 resize-none"
              placeholder="주기적으로 알릴 내용을 입력하세요..."
            />
          </div>
          <div className="bg-blue-500/5 border border-blue-500/10 p-6 rounded-2xl flex gap-4 text-blue-400/60 text-sm font-medium">
            <Info className="shrink-0" />
            <p>매크로는 방송이 활성화된 상태에서만 작동하며, 너무 짧은 간격은 채팅 금지 사유가 될 수 있습니다.</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
