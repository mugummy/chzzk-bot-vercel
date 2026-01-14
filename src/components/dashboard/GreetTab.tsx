'use client';

import { useState, useRef, useMemo } from 'react';
import { HandHelping, Sparkles, Clock, History, Trash2, Save, Info, AlertTriangle, Edit3, HelpCircle } from 'lucide-react';
import { useBotStore } from '@/lib/store';
import { motion } from 'framer-motion';

// 인사 전용 헬퍼 데이터
const GREET_HELPER: Record<string, any> = {
  "/user": { title: "/user", sub: "입장한 시청자 닉네임", msg: "무거미님 어서와요!" },
  "/channel": { title: "/channel", sub: "스트리머 닉네임", msg: "무거미 방송!" },
  "/uptime": { title: "/uptime", sub: "현재 방송 시간", msg: "1시간 30분 째 방송 중!" },
  "/viewer": { title: "/viewer", sub: "현재 시청자 수", msg: "120명 시청 중!" },
  "/follower": { title: "/follower", sub: "총 팔로워 수", msg: "2,794명 팔로워!" },
  "/dday": { title: "/dday", sub: "기념일 디데이", msg: "300일 째!" },
};

export default function GreetTab({ onSend }: { onSend: (msg: any) => void }) {
  const { greet } = useBotStore();
  const [tempMessage, setTempMessage] = useState(greet.settings?.message || '');
  const [activeHelper, setActiveHelper] = useState<any>({ ...GREET_HELPER["/user"] });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const notify = (msg: string, type: 'success' | 'info' = 'success') => {
    if (typeof window !== 'undefined' && (window as any).ui?.notify) {
      (window as any).ui.notify(msg, type);
    }
  };

  const handleSave = () => {
    onSend({ type: 'updateGreetSettings', data: { message: tempMessage } });
    notify('인사 문구가 저장되었습니다.');
  };

  const handleTypeChange = (type: number) => {
    onSend({ type: 'updateGreetSettings', data: { type } });
    notify(type === 1 ? '최초 1회 모드로 변경되었습니다.' : '매일 1회 모드로 변경되었습니다.', 'info');
  };

  const insertFunction = (func: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const result = tempMessage.substring(0, start) + func + tempMessage.substring(end);
    setTempMessage(result);
    setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + func.length, start + func.length); }, 0);
  };

  const previewText = useMemo(() => {
    if (!tempMessage) return "미리보기가 표시됩니다.";
    let res = tempMessage;
    Object.keys(GREET_HELPER).forEach(key => {
      res = res.split(key).join(`<span class="text-emerald-400 font-bold">${GREET_HELPER[key].msg}</span>`);
    });
    return res;
  }, [tempMessage]);

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* 설정 영역 */}
        <div className="xl:col-span-8 bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-12 space-y-10 relative overflow-hidden group">
          <header className="flex justify-between items-center relative z-10">
            <div>
              <h3 className="text-2xl font-black flex items-center gap-3 text-white">
                <Sparkles className="text-emerald-500" size={24} /> 환영 인사 설정
              </h3>
              <p className="text-gray-500 font-medium mt-1">새로운 시청자가 채팅을 칠 때 봇이 자동으로 응답합니다.</p>
            </div>
            <button onClick={handleSave} className="bg-emerald-500 text-black px-8 py-4 rounded-2xl font-black hover:scale-105 transition-all flex items-center gap-2 shadow-xl"><Save size={20} /> 설정 저장</button>
          </header>

          <div className="space-y-6 relative z-10">
            <div className="relative group/input">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">인사 메시지</label>
              <textarea 
                ref={textareaRef}
                value={tempMessage}
                onChange={e => setTempMessage(e.target.value)}
                className="w-full bg-white/5 border border-white/10 p-8 rounded-[2rem] focus:border-emerald-500/50 transition-all outline-none font-medium text-xl h-48 resize-none leading-relaxed tracking-tight text-white"
                placeholder="인사말을 입력하세요..."
              />
              <div className="mt-4 grid grid-cols-4 md:grid-cols-6 gap-2">
                {Object.keys(GREET_HELPER).map(f => (
                  <button key={f} onClick={() => insertFunction(f)} onMouseEnter={() => setActiveHelper({...GREET_HELPER[f], title: f})} className="py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-gray-400 hover:bg-emerald-500 hover:text-black transition-all">{f}</button>
                ))}
              </div>
            </div>

            {/* 실시간 미리보기 & 헬퍼 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-black/40 border border-white/5 rounded-[2rem] p-6 relative overflow-hidden h-32">
                <h4 className="text-lg font-black text-white mb-1">{activeHelper.title}</h4>
                <p className="text-emerald-400 text-xs font-bold mb-2">{activeHelper.sub}</p>
                <p className="text-[10px] text-gray-500 font-mono bg-white/5 p-2 rounded-lg">{activeHelper.msg}</p>
                <HelpCircle className="absolute -bottom-6 -right-6 text-white/5" size={100} />
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem] p-6 h-32 overflow-y-auto custom-scrollbar">
                <h4 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-2">Live Preview</h4>
                <p className="text-gray-300 text-sm font-medium leading-relaxed italic" dangerouslySetInnerHTML={{ __html: previewText }} />
              </div>
            </div>

            {/* 모드 선택 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <button onClick={() => handleTypeChange(1)} className={`p-6 rounded-[2rem] border transition-all text-left group ${greet.settings?.type === 1 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5 hover:border-white/10'}`}>
                <div className="flex items-center gap-4 mb-2"><HandHelping size={20} className={greet.settings?.type === 1 ? 'text-emerald-500' : 'text-gray-500'} /><span className={`font-black text-lg ${greet.settings?.type === 1 ? 'text-emerald-400' : 'text-gray-400'}`}>평생 최초 1회</span></div>
                <p className="text-xs text-gray-500 font-medium">채널 방문 시 단 한 번만 인사합니다.</p>
              </button>
              <button onClick={() => handleTypeChange(2)} className={`p-6 rounded-[2rem] border transition-all text-left group ${greet.settings?.type === 2 ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-white/5 border-white/5 hover:border-white/10'}`}>
                <div className="flex items-center gap-4 mb-2"><Clock size={20} className={greet.settings?.type === 2 ? 'text-cyan-500' : 'text-gray-500'} /><span className={`font-black text-lg ${greet.settings?.type === 2 ? 'text-cyan-400' : 'text-gray-400'}`}>매일마다 최초 1회</span></div>
                <p className="text-xs text-gray-500 font-medium">날짜가 바뀌면 다시 인사합니다.</p>
              </button>
            </div>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="xl:col-span-4 space-y-8">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 flex flex-col items-center text-center shadow-2xl group hover:border-white/10 transition-all">
            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-emerald-500 mb-6 group-hover:scale-110 transition-transform duration-500"><History size={40} /></div>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mb-2">총 방문 기억 시청자</p>
            <div className="flex items-end gap-2 mb-8"><span className="text-7xl font-black text-white tracking-tighter leading-none">{greet.historyCount || 0}</span><span className="text-xl font-black text-emerald-500 pb-1">명</span></div>
            <button onClick={() => confirm('모든 방문 기록을 삭제하시겠습니까?') && onSend({ type: 'resetGreetHistory' })} className="w-full py-5 rounded-[1.5rem] bg-red-500/5 text-red-500 font-black hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-3 border border-red-500/10"><Trash2 size={18} /> <span>방문 기록 초기화</span></button>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-[2.5rem] p-8 flex gap-4"><AlertTriangle className="text-amber-500 shrink-0" size={20} /><p className="text-xs text-amber-500/80 font-medium leading-relaxed">너무 잦은 인사는 채팅창을 혼잡하게 만들 수 있습니다. 시청자 수에 따라 모드를 조정하세요.</p></div>
        </div>

      </div>
    </div>
  );
}
