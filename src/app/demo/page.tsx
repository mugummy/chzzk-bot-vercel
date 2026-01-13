'use client';

import { useEffect, useState, useRef } from 'react';
import { 
  Home, Terminal, Clock, Calculator, Music, HandHelping, 
  BarChart3, Users, Coins, LogOut, Activity, ShieldCheck, X, RefreshCw, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// 데모용 정적 컴포넌트들 (Mock Props 전달)
import DashboardHome from '@/components/dashboard/DashboardHome';
import CommandTab from '@/components/dashboard/CommandTab';
import VotePanel from '@/components/dashboard/VotePanel';

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Demo Mock Store
  const [mockStore, setMockStore] = useState<any>({
    isConnected: true,
    currentUser: { channelName: 'DEMO_USER', channelImageUrl: 'https://via.placeholder.com/150' },
    channelInfo: { followerCount: 1250 },
    liveStatus: { liveTitle: '데모 방송 중입니다!', concurrentUserCount: 42, category: 'Talk' },
    commands: [
      { triggers: ['!안녕'], response: '반가워요! 데모 모드입니다.', enabled: true },
      { triggers: ['!도움말'], response: '명령어 목록을 확인하세요.', enabled: true }
    ],
    counters: [{ trigger: '!죽음', response: '현재 {count}번 죽었습니다', count: 5 }],
    macros: [],
    votes: [],
    songs: { queue: [], current: null },
    participation: { queue: [], active: [], isActive: false, max: 10, ranking: [] },
    greet: { settings: { enabled: true, type: 1, message: "환영합니다!" }, historyCount: 15 },
    chatHistory: [
      { profile: { nickname: 'Viewer_A', color: '#00ff94' }, message: '와 정말 대단해요!' },
      { profile: { nickname: 'Viewer_B', color: '#00d4ff' }, message: '데모 모드 체험 중입니다.' }
    ]
  });

  // 가상 채팅 시뮬레이션
  useEffect(() => {
    const interval = setInterval(() => {
      const msgs = ['투표 참여해도 되나요?', '노래 신청합니다!', '반가워요~', '봇 성능이 좋네요', '디자인이 예뻐요'];
      const users = ['Buzzk_Fan', 'Chzzk_Master', 'Expert_Dev', 'New_Viewer'];
      const newChat = {
        profile: { nickname: users[Math.floor(Math.random() * users.length)], color: '#00ff94' },
        message: msgs[Math.floor(Math.random() * msgs.length)]
      };
      setMockStore((prev: any) => ({
        ...prev,
        chatHistory: [newChat, ...prev.chatHistory].slice(0, 10)
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // 데모 전용 액션 핸들러 (서버에 보내는 대신 로컬 상태 변경)
  const mockSend = (msg: any) => {
    console.log('[Demo Action]', msg);
    if (msg.type === 'createVote') {
      const newVote = {
        question: msg.data.question,
        options: msg.data.options.map((o: string, i: number) => ({ id: String(i+1), text: o })),
        results: msg.data.options.reduce((acc: any, optionName: string, i: number) => ({ ...acc, [String(i+1)]: 0 }), {}),
        isActive: true
      };
      setMockStore((prev: any) => ({ ...prev, votes: [newVote] }));
    }
    if (msg.type === 'removeCommand') {
      setMockStore((prev: any) => ({ ...prev, commands: prev.commands.filter((c: any) => (c.triggers?.[0] || c.trigger) !== msg.data.trigger) }));
    }
  };

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans relative">
      {/* Demo Notice Banner */}
      <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500 z-[100] animate-pulse" />
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500 text-black px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl flex items-center gap-2">
        <Sparkles size={14} /> <span>Interactive Demo Mode</span>
      </div>

      {/* Sidebar (Same as Dashboard) */}
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-24'} bg-[#0a0a0a] border-r border-white/5 flex flex-col transition-all duration-500 z-50`}>
        <div className="p-8 flex items-center gap-4">
          <Activity className="text-emerald-500" size={28} />
          {isSidebarOpen && <h1 className="font-black text-2xl tracking-tighter">BUZZK</h1>}
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-8">
          <NavItem id="dashboard" icon={<Home size={22}/>} label="대시보드" active={activeTab} setter={setActiveTab} collapsed={!isSidebarOpen} />
          <NavItem id="commands" icon={<Terminal size={22}/>} label="명령어" active={activeTab} setter={setActiveTab} collapsed={!isSidebarOpen} />
          <NavItem id="votes" icon={<BarChart3 size={22}/>} label="투표/추첨" active={activeTab} setter={setActiveTab} collapsed={!isSidebarOpen} />
        </nav>
        <div className="p-6 mt-auto">
          <button onClick={() => window.location.href = '/'} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-white/5 text-gray-400 font-bold hover:text-white transition-all">
            <LogOut size={22} /> {isSidebarOpen && <span>나가기</span>}
          </button>
        </div>
      </aside>

      {/* Main Viewport */}
      <main className="flex-1 overflow-y-auto custom-scrollbar relative p-12 pt-20">
        <header className="flex justify-between items-end mb-16">
          <h2 className="text-7xl font-black tracking-tighter text-white capitalize">{activeTab}</h2>
          <div className="flex items-center gap-6 bg-white/5 p-3 pr-10 rounded-[2.5rem] border border-white/5 shadow-2xl">
            <div className="w-20 h-20 rounded-[1.5rem] bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20"><Users size={32} className="text-emerald-500" /></div>
            <div>
              <p className="text-white font-black text-2xl mb-2">Visitor</p>
              <span className="text-[11px] text-emerald-500 font-black uppercase tracking-widest animate-pulse">Previewing System</span>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
            {activeTab === 'dashboard' && <DashboardHome store={mockStore} />}
            {activeTab === 'commands' && <CommandTab onSend={mockSend} />}
            {activeTab === 'votes' && <VotePanel onSend={mockSend} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavItem({ id, icon, label, active, setter, collapsed }: any) {
  const isActive = active === id;
  return (
    <button onClick={() => setter(id)} className={`w-full flex items-center gap-5 px-6 py-5 rounded-[1.5rem] transition-all duration-500 relative ${isActive ? 'bg-emerald-500 text-black font-black shadow-2xl shadow-emerald-500/30 scale-[1.02]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
      <span className={`${isActive ? 'text-black' : 'text-gray-500'}`}>{icon}</span>
      {!collapsed && <span className="tracking-tighter text-lg">{label}</span>}
    </button>
  );
}
