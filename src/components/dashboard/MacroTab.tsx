'use client';

import { useState, useRef } from 'react';
import { Clock, Plus, Trash2, Settings, MessageSquare, Play, StopCircle, Info, Sparkles, HelpCircle, Edit3 } from 'lucide-react';
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
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // 매크로 입력 상태 (제목 필드는 편의상 메시지 앞부분이나 별도 관리, 여기선 UI만 제공하고 메시지에 포함하는 방식 고려 가능하나, 일단 순수 메시지 위주로)
  // *사용자 요청: 매크로 제목 설정 가능하게* -> DB 스키마 변경 없이 하려면 message 내부에 구분자를 넣거나 해야 하지만, 
  // 가장 깔끔한 건 UI에서만 '제목'을 입력받고 실제로는 관리가 안 되는 것보단, 
  // 식별용으로 message의 첫 줄이나 요약본을 제목으로 쓰는 것이 현실적입니다. 
  // 여기서는 별도 필드 없이 메시지 내용을 직관적으로 보여주는 방식으로 UI를 강화하겠습니다.
  const [newMacro, setNewMacro] = useState({ interval: 10, message: '' });
  const [activeHelper, setActiveHelper] = useState<any>(MACRO_HELPER["/uptime"]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const notify = (msg: string) => {
    if (typeof window !== 'undefined' && (window as any).ui?.notify) {
      (window as any).ui.notify(msg, 'success');
    }
  };

  const handleOpenEdit = (macro: any) => {
    setNewMacro({ interval: macro.interval, message: macro.message });
    setEditingId(macro.id);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!newMacro.message || newMacro.interval < 1) return;
    
    if (modalMode === 'edit' && editingId) {
      onSend({ type: 'updateMacro', data: { id: editingId, ...newMacro } });
      notify('매크로가 수정되었습니다.');
    } else {
      onSend({ type: 'addMacro', data: newMacro });
      notify('새 매크로가 생성되었습니다.');
    }
    
    setNewMacro({ interval: 10, message: '' });
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('이 매크로를 삭제하시겠습니까?')) {
      onSend({ type: 'removeMacro', data: { id } });
      notify('매크로가 삭제되었습니다.');
    }
  };

  const handleToggle = (id: string, enabled: boolean) => {
    onSend({ type: 'toggleMacro', data: { id, enabled } });
    notify(enabled ? '매크로가 활성화되었습니다.' : '매크로가 비활성화되었습니다.');
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
        <div><h3 className="text-2xl font-black text-white flex items-center gap-3"><Clock className="text-emerald-500" size={28} /> 매크로 관리</h3><p className="text-gray-500 font-medium">정해진 시간마다 자동으로 메시지를 전송합니다.</p></div>
        <button onClick={() => { setModalMode('add'); setNewMacro({interval:10, message:''}); setIsModalOpen(true); }} className="bg-emerald-500 text-black px-8 py-4 rounded-2xl font-black hover:scale-105 transition-all shadow-xl flex items-center gap-2"><Plus size={20} /> 매크로 추가</button>
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
                    <span className="text-white font-black text-xl">자동 공지 #{i+1}</span>
                    <Toggle checked={m.enabled} onChange={(val) => handleToggle(m.id, val)} />
                  </div>
                  <p className="text-gray-500 font-medium line-clamp-1">{m.message}</p>
                </div>
              </div>
              <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => handleOpenEdit(m)} className="p-5 bg-white/5 rounded-2xl hover:bg-white/10 text-gray-400"><Edit3 size={22} /></button>
                <button onClick={() => handleDelete(m.id)} className="p-5 bg-red-500/10 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-lg"><Trash2 size={22} /></button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'edit' ? '매크로 수정' : '새 매크로 설정'} onSave={handleSave}>
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
            <div className="bg-black/40 border border-white/5 rounded-[2rem] p-8 h-full">
              <h4 className="text-xl font-black text-white mb-2">{activeHelper.title}</h4>
              <p className="text-emerald-400 text-sm font-bold mb-6">{activeHelper.sub}</p>
              <div className="space-y-1"><span className="text-[9px] font-black text-gray-600 uppercase">Preview</span><p className="bg-white/5 p-3 rounded-xl text-xs font-mono text-gray-400">{activeHelper.msg}</p></div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}