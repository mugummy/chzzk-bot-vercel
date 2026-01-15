'use client';

import { useState, useRef, useMemo } from 'react';
import { Terminal, Plus, Settings, Trash2, Search, Zap, Calculator, Edit3, Info, Sparkles, MessageSquare, HelpCircle } from 'lucide-react';
import { useBotStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from './Modals';
import { CommandItem } from '@/types/bot';
import Toggle from '@/components/ui/Toggle';

const HELPER_DATA: Record<string, any> = {
  "/user": { title: "/user", sub: "시청자 닉네임", msg: "무거미" },
  "/channel": { title: "/channel", sub: "스트리머 닉네임", msg: "나디아" },
  "/uptime": { title: "/uptime", sub: "방송 진행 시간", msg: "1시간 30분 20초" },
  "/viewer": { title: "/viewer", sub: "현재 시청자 수", msg: "1,205" },
  "/follower": { title: "/follower", sub: "총 팔로워 수", msg: "3,500" },
  "/random": { title: "/random", sub: "무작위 선택", msg: "치킨" },
  "/count": { title: "/count", sub: "개인별 실행 횟수", msg: "5" },
  "/countall": { title: "/countall", sub: "전체 통합 횟수", msg: "100" },
  "/dday": { title: "/dday", sub: "디데이 계산", msg: "300" },
  "/title": { title: "/title", sub: "방송 제목", msg: "저챗 방송중!" },
  "/category": { title: "/category", sub: "카테고리", msg: "Talk" }
};

export default function CommandTab({ onSend }: { onSend: (msg: any) => void }) {
  const { commands, counters } = useBotStore();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'counter'>('add');
  const [editingOldTrigger, setEditingOldTrigger] = useState<string | null>(null);
  
  const [cmdData, setCmdData] = useState({ trigger: '', response: '' });
  const [cntData, setCntData] = useState({ trigger: '', response: '', oncePerDay: false });
  const [activeHelper, setActiveHelper] = useState<any>(HELPER_DATA["/user"]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const getDisplayTrigger = (cmd: CommandItem) => cmd.triggers?.[0] || '';

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingOldTrigger(null);
    setCmdData({ trigger: '', response: '' });
    setCntData({ trigger: '', response: '', oncePerDay: false });
  };

  const handleOpenEdit = (cmd: CommandItem) => {
    const trigger = getDisplayTrigger(cmd);
    setCmdData({ trigger, response: cmd.response });
    setEditingOldTrigger(trigger);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const notify = (msg: string) => {
    if (typeof window !== 'undefined' && (window as any).ui?.notify) {
      (window as any).ui.notify(msg, 'success');
    }
  };

  const handleSave = () => {
    if (modalMode === 'edit') {
      onSend({ type: 'updateCommand', data: { oldTrigger: editingOldTrigger, ...cmdData } });
      notify('수정되었습니다.');
    } else if (modalMode === 'add') {
      onSend({ type: 'addCommand', data: cmdData });
      notify('추가되었습니다.');
    } else {
      onSend({ type: 'addCounter', data: cntData });
      notify('카운터가 추가되었습니다.');
    }
    handleCloseModal();
  };

  const handleDelete = (trigger: string, isCounter = false) => {
    if (confirm(`'${trigger}' 항목을 삭제하시겠습니까?`)) {
      onSend({ type: isCounter ? 'removeCounter' : 'removeCommand', data: { trigger } });
      notify('삭제되었습니다.');
    }
  };

  const insertFunction = (func: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart, end = textarea.selectionEnd;
    const text = modalMode === 'counter' ? cntData.response : cmdData.response;
    const result = text.substring(0, start) + func + text.substring(end);
    if (modalMode === 'counter') setCntData({ ...cntData, response: result });
    else setCmdData({ ...cmdData, response: result });
    setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + func.length, start + func.length); }, 0);
  };

  const previewText = useMemo(() => {
    const text = modalMode === 'counter' ? cntData.response : cmdData.response;
    if (!text) return "응답 미리보기가 여기에 표시됩니다.";
    let res = text;
    Object.keys(HELPER_DATA).forEach(key => {
      res = res.split(key).join(`<span class="text-emerald-400 font-bold">${HELPER_DATA[key].msg}</span>`);
    });
    return res;
  }, [cmdData.response, cntData.response, modalMode]);

  return (
    <div className="space-y-12">
      <header className="flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="relative group w-full lg:w-96">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-white/5 border border-white/5 pl-14 pr-6 py-5 rounded-[2rem] outline-none focus:border-emerald-500/50 transition-all text-white" placeholder="검색..." />
        </div>
        <div className="flex gap-4">
          <button onClick={() => { setModalMode('add'); setIsModalOpen(true); }} className="bg-emerald-500 text-black px-10 py-5 rounded-[2.5rem] font-black hover:scale-105 transition-all flex items-center gap-2 shadow-xl"><Zap size={20} fill="currentColor" /> 명령어 추가</button>
          <button onClick={() => { setModalMode('counter'); setIsModalOpen(true); }} className="bg-white/5 border border-white/10 px-10 py-5 rounded-[2.5rem] font-black hover:bg-white/10 transition-all flex items-center gap-2 text-white"><Calculator size={20}/> 카운터 추가</button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <AnimatePresence>
          {commands.filter(c => getDisplayTrigger(c).includes(search)).map((cmd, i) => (
            <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={`cmd-${i}`} className="bg-[#0a0a0a] border border-white/5 p-10 rounded-[3.5rem] flex items-center justify-between group hover:border-emerald-500/30 transition-all">
              <div className="flex items-center gap-8">
                <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-emerald-500"><Terminal size={32} /></div>
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <span className="text-white font-black text-2xl tracking-tighter">{getDisplayTrigger(cmd)}</span>
                    <Toggle checked={cmd.enabled} onChange={(val) => onSend({type:'toggleCommand', data:{trigger:getDisplayTrigger(cmd), enabled:val}})} />
                  </div>
                  <p className="text-gray-500 font-medium line-clamp-1">{cmd.response}</p>
                </div>
              </div>
              <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => handleOpenEdit(cmd)} className="p-5 bg-white/5 rounded-2xl hover:bg-white/10 text-gray-400"><Edit3 size={22} /></button>
                <button onClick={() => handleDelete(getDisplayTrigger(cmd))} className="p-5 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 transition-all"><Trash2 size={22} /></button>
              </div>
            </motion.div>
          ))}
          {counters.filter(c => (c.trigger || '').includes(search)).map((cnt, i) => (
            <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={`cnt-${i}`} className="bg-[#0a0a0a] border border-cyan-500/10 p-10 rounded-[3.5rem] flex items-center justify-between group hover:border-cyan-500/30 transition-all">
              <div className="flex items-center gap-8">
                <div className="w-16 h-16 bg-cyan-500/5 rounded-3xl flex items-center justify-center text-cyan-500 font-black text-2xl">{cnt.count || 0}</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <span className="text-white font-black text-2xl">{cnt.trigger}</span>
                    <Toggle checked={cnt.enabled} onChange={(val) => onSend({type:'toggleCounter', data:{trigger:cnt.trigger, enabled:val}})} />
                  </div>
                  <p className="text-gray-500 font-medium line-clamp-1">{cnt.response}</p>
                </div>
              </div>
              <button onClick={() => handleDelete(cnt.trigger, true)} className="p-5 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={22} /></button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={modalMode === 'counter' ? '카운터 설정' : (modalMode === 'edit' ? '명령어 수정' : '새 명령어 추가')} onSave={handleSave}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-8 py-4">
            <input value={modalMode === 'counter' ? cntData.trigger : cmdData.trigger} onChange={e => modalMode === 'counter' ? setCntData({...cntData, trigger: e.target.value}) : setCmdData({...cmdData, trigger: e.target.value})} className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl outline-none font-black text-2xl text-white" placeholder="!키워드" />
            <textarea ref={textareaRef} value={modalMode === 'counter' ? cntData.response : cmdData.response} onChange={e => modalMode === 'counter' ? setCntData({...cntData, response: e.target.value}) : setCmdData({...cmdData, response: e.target.value})} className="w-full bg-white/5 border border-white/10 p-6 rounded-[1.5rem] outline-none font-medium h-48 text-white resize-none" placeholder="응답 메시지..." />
            
            {/* [수정] 못생긴 체크박스 -> 고급 토글로 교체 */}
            {modalMode === 'counter' && (
              <div className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-all">
                <div>
                  <span className="font-black text-white block text-lg">1일 1회 제한</span>
                  <span className="text-xs text-gray-500">한 유저당 하루에 한 번만 카운트합니다.</span>
                </div>
                <Toggle checked={cntData.oncePerDay} onChange={val => setCntData({...cntData, oncePerDay: val})} />
              </div>
            )}

            <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
              {Object.keys(HELPER_DATA).filter(f => !modalMode.includes('counter') || !['/any'].includes(f)).map(f => (
                <button key={f} onClick={() => insertFunction(f)} onMouseEnter={() => setActiveHelper({...HELPER_DATA[f], title: f})} className="py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-gray-400 hover:bg-emerald-500 hover:text-black transition-all">{f}</button>
              ))}
            </div>
          </div>
          <div className="lg:col-span-5 py-4 space-y-6">
            <div className="bg-black/40 border border-white/5 rounded-[2rem] p-8 h-[220px] relative overflow-hidden">
              <h4 className="text-xl font-black text-white mb-2">{activeHelper.title}</h4>
              <p className="text-emerald-400 text-sm font-bold mb-6">{activeHelper.sub}</p>
              <div className="space-y-1"><span className="text-[9px] font-black text-gray-600 uppercase">Example Value</span><p className="bg-white/5 p-3 rounded-xl text-xs font-mono text-gray-400">{activeHelper.msg}</p></div>
              <HelpCircle className="absolute -bottom-10 -right-10 text-white/5" size={150} />
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem] p-8 h-[220px]">
              <h4 className="text-sm font-black text-emerald-500 uppercase tracking-widest mb-4 flex items-center gap-2"><MessageSquare size={16}/> Live Preview</h4>
              <div className="bg-black/40 p-5 rounded-2xl border border-white/5 h-24 overflow-y-auto">
                <p className="text-gray-300 text-sm font-medium leading-relaxed italic" dangerouslySetInnerHTML={{ __html: previewText }} />
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
