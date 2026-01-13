'use client';

import { useState } from 'react';
import { Terminal, Plus, Settings, Trash2, Search, Zap, Calculator, Sliders, Info } from 'lucide-react';
import { useBotStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from './Modals';

/**
 * CommandTab: 명령어와 카운터를 관리하는 통합 탭
 * 사용자가 생성한 모든 자동 응답 로직을 시각적으로 관리합니다.
 */
export default function CommandTab({ onSend }: { onSend: (msg: any) => void }) {
  const { commands, counters } = useBotStore();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'command' | 'counter'>('command');
  
  const [newCmd, setNewCmd] = useState({ trigger: '', response: '' });
  const [newCnt, setNewCnt] = useState({ trigger: '', response: '', oncePerDay: false });

  // 명령어 추가 핸들러
  const handleSaveCommand = () => {
    if (!newCmd.trigger || !newCmd.response) return;
    onSend({ type: 'addCommand', data: newCmd });
    setNewCmd({ trigger: '', response: '' });
    setIsModalOpen(false);
  };

  // 카운터 추가 핸들러
  const handleSaveCounter = () => {
    if (!newCnt.trigger || !newCnt.response) return;
    onSend({ type: 'addCounter', data: newCnt });
    setNewCnt({ trigger: '', response: '', oncePerDay: false });
    setIsModalOpen(false);
  };

  const filteredCommands = commands.filter(c => 
    (c.triggers?.[0] || c.trigger || '').includes(search)
  );

  const filteredCounters = counters.filter(c => 
    (c.trigger || '').includes(search)
  );

  return (
    <div className="space-y-12">
      {/* Upper Control Bar */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="relative group w-full lg:w-96">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-emerald-500 transition-colors" size={20} />
          <input 
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/5 pl-14 pr-6 py-5 rounded-[2rem] focus:border-emerald-500/50 focus:bg-white/[0.08] transition-all outline-none font-medium tracking-tight"
            placeholder="명령어 또는 키워드 검색..."
          />
        </div>
        
        <div className="flex gap-4 w-full lg:w-auto">
          <button 
            onClick={() => { setModalMode('command'); setIsModalOpen(true); }}
            className="flex-1 lg:flex-none bg-emerald-500 text-black px-10 py-5 rounded-[2rem] font-black hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3"
          >
            <Zap size={20} fill="currentColor" /> <span>명령어 추가</span>
          </button>
          <button 
            onClick={() => { setModalMode('counter'); setIsModalOpen(true); }}
            className="flex-1 lg:flex-none bg-white/5 text-white border border-white/10 px-10 py-5 rounded-[2rem] font-black hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <Calculator size={20} /> <span>카운터 추가</span>
          </button>
        </div>
      </header>

      {/* Grid List */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <AnimatePresence>
          {/* 1. 명령어 렌더링 */}
          {filteredCommands.map((cmd, i) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={cmd.id || i} 
              className="bg-[#0a0a0a] border border-white/5 p-10 rounded-[3.5rem] flex items-center justify-between group hover:border-emerald-500/30 hover:bg-[#111] transition-all duration-500"
            >
              <div className="flex items-center gap-8">
                <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-black transition-all duration-500">
                  <Terminal size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-white font-black text-2xl tracking-tighter">!{cmd.triggers?.[0] || cmd.trigger}</span>
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded-full uppercase tracking-widest">Command</span>
                  </div>
                  <p className="text-gray-500 font-medium text-lg line-clamp-1 group-hover:text-gray-300 transition-colors">{cmd.response}</p>
                </div>
              </div>
              
              <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                <button className="p-5 bg-white/5 rounded-2xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                  <Settings size={22} />
                </button>
                <button 
                  onClick={() => onSend({ type: 'removeCommand', data: { trigger: cmd.triggers?.[0] || cmd.trigger } })}
                  className="p-5 bg-red-500/10 rounded-2xl hover:bg-red-500 text-red-500 hover:text-white transition-all shadow-lg"
                >
                  <Trash2 size={22} />
                </button>
              </div>
            </motion.div>
          ))}

          {/* 2. 카운터 렌더링 */}
          {filteredCounters.map((cnt, i) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              key={cnt.id || i} 
              className="bg-[#0a0a0a] border border-cyan-500/10 p-10 rounded-[3.5rem] flex items-center justify-between group hover:border-cyan-500/30 hover:bg-[#111] transition-all duration-500"
            >
              <div className="flex items-center gap-8">
                <div className="w-16 h-16 bg-cyan-500/5 rounded-3xl flex items-center justify-center text-cyan-500 group-hover:bg-cyan-500 group-hover:text-black transition-all duration-500 text-2xl font-black">
                  {cnt.state?.totalCount || 0}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-white font-black text-2xl tracking-tighter">{cnt.trigger}</span>
                    <span className="px-3 py-1 bg-cyan-500/10 text-cyan-500 text-[10px] font-black rounded-full uppercase tracking-widest">Counter</span>
                    {cnt.oncePerDay && <span className="px-2 py-1 bg-amber-500/10 text-amber-500 text-[9px] font-black rounded-md">DAILY LIMIT</span>}
                  </div>
                  <p className="text-gray-500 font-medium text-lg line-clamp-1 group-hover:text-gray-300 transition-colors">{cnt.response}</p>
                </div>
              </div>
              
              <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                <button 
                  onClick={() => onSend({ type: 'removeCounter', data: { trigger: cnt.trigger } })}
                  className="p-5 bg-red-500/10 rounded-2xl hover:bg-red-500 text-red-500 hover:text-white transition-all shadow-lg"
                >
                  <Trash2 size={22} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredCommands.length === 0 && filteredCounters.length === 0 && (
        <div className="py-40 text-center space-y-6">
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto text-gray-700">
            <Info size={48} strokeWidth={1} />
          </div>
          <p className="text-xl font-bold text-gray-600 tracking-tight italic">검색 결과가 없거나 데이터가 비어있습니다.</p>
        </div>
      )}

      {/* Unified Modal System */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={modalMode === 'command' ? '새 명령어 생성' : '새 카운터 생성'}
        onSave={modalMode === 'command' ? handleSaveCommand : handleSaveCounter}
      >
        {modalMode === 'command' ? (
          <div className="space-y-10 py-4">
            <div className="space-y-4">
              <div className="flex justify-between items-end px-1">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">명령어 트리거</label>
                <span className="text-[10px] text-emerald-500 font-bold">슬래시(/)로 다중 등록 가능</span>
              </div>
              <input 
                value={newCmd.trigger} onChange={e => setNewCmd({...newCmd, trigger: e.target.value})}
                className="w-full bg-white/5 border border-white/10 p-6 rounded-[1.5rem] focus:border-emerald-500 transition-all outline-none font-black text-2xl tracking-tighter"
                placeholder="!안녕 / !ㅎㅇ"
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">응답 메시지</label>
              <textarea 
                value={newCmd.response} onChange={e => setNewCmd({...newCmd, response: e.target.value})}
                className="w-full bg-white/5 border border-white/10 p-6 rounded-[1.5rem] focus:border-emerald-500 transition-all outline-none font-medium text-lg h-40 resize-none leading-relaxed"
                placeholder="봇이 대답할 내용을 입력하세요..."
              />
            </div>
          </div>
        ) : (
          <div className="space-y-10 py-4">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">카운터 키워드</label>
              <input 
                value={newCnt.trigger} onChange={e => setNewCnt({...newCnt, trigger: e.target.value})}
                className="w-full bg-white/5 border border-white/10 p-6 rounded-[1.5rem] focus:border-emerald-500 transition-all outline-none font-black text-2xl tracking-tighter"
                placeholder="!죽음"
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">응답 템플릿</label>
              <textarea 
                value={newCnt.response} onChange={e => setNewCnt({...newCnt, response: e.target.value})}
                className="w-full bg-white/5 border border-white/10 p-6 rounded-[1.5rem] focus:border-emerald-500 transition-all outline-none font-medium text-lg h-32 resize-none"
                placeholder="현재 {count}번 죽었습니다!"
              />
            </div>
            <label className="flex items-center justify-between p-6 bg-white/5 rounded-[1.5rem] border border-white/5 cursor-pointer hover:bg-white/[0.08] transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="font-black tracking-tight">하루 한 번만 실행</p>
                  <p className="text-xs text-gray-500 font-bold">사용자별로 매일 최초 1회만 카운트합니다.</p>
                </div>
              </div>
              <input 
                type="checkbox" className="hidden"
                checked={newCnt.oncePerDay} onChange={e => setNewCnt({...newCnt, oncePerDay: e.target.checked})}
              />
              <div className={`w-14 h-7 rounded-full p-1 transition-all duration-300 ${newCnt.oncePerDay ? 'bg-emerald-500' : 'bg-gray-700'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-300 ${newCnt.oncePerDay ? 'translate-x-7' : 'translate-x-0'}`} />
              </div>
            </label>
          </div>
        )}
      </Modal>
    </div>
  );
}