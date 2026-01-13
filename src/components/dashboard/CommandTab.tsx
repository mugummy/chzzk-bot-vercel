'use client';

import { useState } from 'react';
import { Terminal, Plus, Settings, Trash2, Search, Zap, Calculator, Clock, Edit3, Info } from 'lucide-react';
import { useBotStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from './Modals';
import { CommandItem } from '@/types/bot';

export default function CommandTab({ onSend }: { onSend: (msg: any) => void }) {
  const { commands, counters } = useBotStore();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'counter'>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [cmdData, setCmdData] = useState({ trigger: '', response: '' });
  const [cntData, setCntData] = useState({ trigger: '', response: '', oncePerDay: false });

  const getFirstTrigger = (cmd: CommandItem) => cmd.triggers?.[0] || cmd.trigger || '';

  const handleOpenEdit = (cmd: CommandItem) => {
    const trigger = getFirstTrigger(cmd);
    setCmdData({ trigger, response: cmd.response });
    setEditingId(trigger);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (modalMode === 'edit') {
      onSend({ type: 'updateCommand', data: { oldTrigger: editingId, ...cmdData } });
    } else if (modalMode === 'add') {
      onSend({ type: 'addCommand', data: cmdData });
    } else {
      onSend({ type: 'addCounter', data: cntData });
    }
    setIsModalOpen(false);
    setCmdData({ trigger: '', response: '' });
  };

  return (
    <div className="space-y-12">
      <header className="flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="relative group w-full lg:w-96">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-white/5 border border-white/5 pl-14 pr-6 py-5 rounded-[2rem] outline-none focus:border-emerald-500/50 transition-all text-white" placeholder="검색어 입력..." />
        </div>
        <div className="flex gap-4 w-full lg:w-auto">
          <button onClick={() => { setModalMode('add'); setIsModalOpen(true); }} className="flex-1 lg:flex-none bg-emerald-500 text-black px-10 py-5 rounded-[2rem] font-black hover:scale-105 transition-all shadow-xl flex items-center justify-center gap-3"><Zap size={20} fill="currentColor" /> 명령어 추가</button>
          <button onClick={() => { setModalMode('counter'); setIsModalOpen(true); }} className="flex-1 lg:flex-none bg-white/5 border border-white/10 px-10 py-5 rounded-[2rem] font-black hover:bg-white/10 transition-all flex items-center justify-center gap-3 text-white"><Calculator size={20} /> 카운터 추가</button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <AnimatePresence>
          {commands.filter(c => getFirstTrigger(c).includes(search)).map((cmd, i) => (
            <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={i} className="bg-[#0a0a0a] border border-white/5 p-10 rounded-[3.5rem] flex items-center justify-between group hover:border-emerald-500/30 transition-all">
              <div className="flex items-center gap-8">
                <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-emerald-500"><Terminal size={32} /></div>
                <div>
                  <div className="flex items-center gap-3 mb-2"><span className="text-white font-black text-2xl">!{getFirstTrigger(cmd)}</span><span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded-full uppercase">Command</span></div>
                  <p className="text-gray-500 font-medium text-lg line-clamp-1">{cmd.response}</p>
                </div>
              </div>
              <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => handleOpenEdit(cmd)} className="p-5 bg-white/5 rounded-2xl hover:bg-white/10 text-gray-400"><Edit3 size={22} /></button>
                <button onClick={() => onSend({ type: 'removeCommand', data: { trigger: getFirstTrigger(cmd) } })} className="p-5 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-lg"><Trash2 size={22} /></button>
              </div>
            </motion.div>
          ))}
          {counters.filter(c => (c.trigger || '').includes(search)).map((cnt, i) => (
            <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={`cnt-${i}`} className="bg-[#0a0a0a] border border-cyan-500/10 p-10 rounded-[3.5rem] flex items-center justify-between group hover:border-cyan-500/30 transition-all">
              <div className="flex items-center gap-8">
                <div className="w-16 h-16 bg-cyan-500/5 rounded-3xl flex items-center justify-center text-cyan-500 font-black text-2xl">{cnt.count || 0}</div>
                <div><div className="flex items-center gap-3 mb-2"><span className="text-white font-black text-2xl">{cnt.trigger}</span><span className="px-3 py-1 bg-cyan-500/10 text-cyan-500 text-[10px] font-black rounded-full uppercase">Counter</span></div><p className="text-gray-500 font-medium line-clamp-1">{cnt.response}</p></div>
              </div>
              <button onClick={() => onSend({ type: 'removeCounter', data: { trigger: cnt.trigger } })} className="p-5 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={22} /></button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'counter' ? '카운터 설정' : '명령어 설정'} onSave={handleSave}>
        {modalMode === 'counter' ? (
          <div className="space-y-8">
            <input value={cntData.trigger} onChange={e => setCntData({...cntData, trigger: e.target.value})} className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl outline-none font-black text-2xl text-white" placeholder="!키워드" />
            <textarea value={cntData.response} onChange={e => setCntData({...cntData, response: e.target.value})} className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl outline-none font-medium h-32 text-white" placeholder="응답 메시지 {count} 변수 사용 가능" />
            <label className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5 cursor-pointer hover:bg-white/10 transition-all">
              <span className="font-black text-white">하루 한 번만 실행</span>
              <input type="checkbox" checked={cntData.oncePerDay} onChange={e => setCntData({...cntData, oncePerDay: e.target.checked})} className="w-6 h-6 accent-emerald-500" />
            </label>
          </div>
        ) : (
          <div className="space-y-8">
            <input value={cmdData.trigger} onChange={e => setCmdData({...cmdData, trigger: e.target.value})} className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl outline-none font-black text-2xl text-white" placeholder="!명령어 / !다중" />
            <textarea value={cmdData.response} onChange={e => setCmdData({...cmdData, response: e.target.value})} className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl outline-none font-medium h-48 text-white" placeholder="봇의 응답 내용을 입력하세요..." />
          </div>
        )}
      </Modal>
    </div>
  );
}
