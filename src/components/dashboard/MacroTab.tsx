'use client';

import { useState, useRef } from 'react';
import { Clock, Plus, Trash2, Settings, MessageSquare, Play, StopCircle, Info, Sparkles, HelpCircle } from 'lucide-react';
import { useBotStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from './Modals';
import Toggle from '@/components/ui/Toggle';

const MACRO_HELPER: Record<string, any> = {
  "/channel": { sub: "스트리머 닉네임", msg: "무거미 방송!" },
  "/uptime": { sub: "방송 업타임", msg: "1시간 30분 째 방송 중!" },
  "/viewer": { sub: "현재 시청자 수", msg: "120명 시청 중!" },
  "/follower": { sub: "총 팔로워 수", msg: "2,794명 팔로워!" },
  "/random": { sub: "무작위 선택", msg: "행운의 메시지!" },
  "/dday": { sub: "기념일 디데이", msg: "데뷔 300일!" },
  "/title": { sub: "방송 제목", msg: "오늘의 방송 제목!" },
  "/category": { sub: "방송 카테고리", msg: "Talk" }
};

export default function MacroTab({ onSend }: { onSend: (msg: any) => void }) {
  const { macros } = useBotStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMacro, setNewMacro] = useState({ interval: 10, message: '' });
  const [activeHelper, setActiveHelper] = useState<any>(MACRO_HELPER["/uptime"]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const notify = (msg: string) => {
    if (typeof window !== 'undefined' && (window as any).ui?.notify) {
      (window as any).ui.notify(msg, 'success');
    }
  };

  const handleSave = () => {
    if (!newMacro.message || newMacro.interval < 1) return;
    onSend({ type: 'addMacro', data: newMacro });
    notify('새 매크로가 설정되었습니다.');
    setNewMacro({ interval: 10, message: '' });
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('이 매크로를 삭제하시겠습니까?')) {
      onSend({ type: 'removeMacro', data: { id } });
      notify('매크로가 삭제되었습니다.');
    }
  };

  const insertFunction = (func: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart, end = textarea.selectionEnd;
    const text = newMacro.message;
    const result = text.substring(0, start) + func + text.substring(end);
    setNewMacro({ ...newMacro, message: result });
    setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + func.length, start + func.length); }, 0);
  };

  return (
    <div className="space-y-10">
      <header className="flex justify-between items-center">
        <div><h3 className="text-2xl font-black text-white flex items-center gap-3"><Clock className="text-emerald-500" size={28} /> 매크로 관리</h3><p className="text-gray-500 font-medium">정기적으로 메시지를 전송합니다.</p></div>
        <button onClick={() => setIsModalOpen(true)} className="bg-emerald-500 text-black px-8 py-4 rounded-[2rem] font-black hover:scale-105 transition-all shadow-xl flex items-center gap-2"><Plus size={20} /> 매크로 추가</button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AnimatePresence>
          {macros.map((m, i) => (
            <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={m.id || i} className="bg-[#0a0a0a] border border-white/5 p-10 rounded-[3.5rem] flex items-center justify-between group hover:border-emerald-500/30 transition-all duration-500">
              <div className="flex items-center gap-8">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-3xl flex flex-col items-center justify-center text-emerald-500">
                  <span className="text-2xl font-black leading-none">{m.interval}</span>
                  <span className="text-[10px] font-black uppercase mt-1">Min</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-white font-black text-xl">자동 공지</span>
                    <Toggle checked={m.enabled} onChange={(val) => onSend({type:'toggleMacro', data:{id:m.id, enabled:val}})} />
                  </div>
                  <p className="text-gray-500 font-medium line-clamp-1">{m.message}</p>
                </div>
              </div>
              <button onClick={() => handleDelete(m.id)} className="p-5 bg-red-500/10 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-lg opacity-0 group-hover:opacity-100"><Trash2 size={22} /></button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="새 매크로 설정" onSave={handleSave}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-10 py-4">
            <div className="space-y-4">
              <div className="flex justify-between items-end px-1"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">실행 간격 (분)</label><span className="text-emerald-500 font-black text-xl">{newMacro.interval}분</span></div>
              <input type="range" min="1" max="120" value={newMacro.interval} onChange={e => setNewMacro({...newMacro, interval: parseInt(e.target.value)})} className="w-full accent-emerald-500" />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">메시지 내용</label>
              <textarea ref={textareaRef} value={newMacro.message} onChange={e => setNewMacro({...newMacro, message: e.target.value})} className="w-full bg-white/5 border border-white/10 p-6 rounded-[1.5rem] outline-none font-medium text-lg h-40 resize-none text-white" placeholder="메시지를 입력하세요..." />
              <div className="grid grid-cols-4 gap-2">
                {Object.keys(MACRO_HELPER).map(f => (
                  <button key={f} onClick={() => insertFunction(f)} onMouseEnter={() => setActiveHelper({...MACRO_HELPER[f], title: f})} className="py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-gray-400 hover:bg-emerald-500 hover:text-black transition-all">{f}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 py-4">
            <div className="bg-black/40 border border-white/5 rounded-[2rem] p-8 h-full relative overflow-hidden">
              <h4 className="text-xl font-black text-white mb-2">{activeHelper.title}</h4>
              <p className="text-emerald-400 text-sm font-bold mb-6">{activeHelper.sub}</p>
              <div className="space-y-1"><span className="text-[9px] font-black text-gray-600 uppercase">Preview</span><p className="bg-white/5 p-3 rounded-xl text-xs font-mono text-gray-400">{activeHelper.msg}</p></div>
              <HelpCircle className="absolute -bottom-10 -right-10 text-white/5" size={150} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
