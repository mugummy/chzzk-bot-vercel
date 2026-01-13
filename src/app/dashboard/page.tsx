'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  Home, Terminal, Clock, Calculator, Music, HandHelping, 
  Poll, Users, Coins, LogOut, Settings, Play, SkipForward,
  UserCheck, AlertCircle, PlusCircle, Activity, Globe, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBotStore } from '@/lib/store';

// Sub-components (Tabs)
import DashboardHome from '@/components/dashboard/DashboardHome';
import CommandList from '@/components/dashboard/CommandList';
import SongManager from '@/components/dashboard/SongManager';
import GreetPanel from '@/components/dashboard/GreetPanel';
import VoteSystem from '@/components/dashboard/VotePanel';

export default function Dashboard() {
  const store = useBotStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // WebSocket 연결 및 이벤트 핸들링 (단일 지점 관리)
  const connectWS = useCallback((token: string) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/?token=${token}`);
    
    ws.onopen = () => {
      console.log('[Dashboard] WebSocket Connected');
      ws.send(JSON.stringify({ type: 'connect' }));
      ws.send(JSON.stringify({ type: 'requestData' }));
    };

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      handleIncomingData(data);
    };

    ws.onclose = () => {
      console.log('[Dashboard] WebSocket Closed. Retrying...');
      setTimeout(() => connectWS(token), 3000);
    };

    setSocket(ws);
  }, []);

  const handleIncomingData = (data: any) => {
    switch (data.type) {
      case 'connectResult': 
        store.setBotStatus(data.success, true);
        if (data.channelInfo) store.setStreamInfo(data.channelInfo, data.liveStatus);
        break;
      case 'settingsUpdate': store.updateSettings(data.payload); break;
      case 'commandsUpdate': store.updateCommands(data.payload); break;
      case 'songStateUpdate': store.updateSongs(data.payload); break;
      case 'participationStateUpdate': store.updateParticipation(data.payload); break;
      case 'greetStateUpdate': store.updateGreet(data.payload); break;
      case 'newChat': store.addChat(data.payload); break;
    }
  };

  const send = (msg: any) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(msg));
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('chzzk_session_token');
    if (!token) return (window.location.href = '/login');

    fetch('/api/auth/session', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          store.setAuth(data.user);
          connectWS(token);
        } else window.location.href = '/login';
      });

    return () => socket?.close();
  }, []);

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden selection:bg-emerald-500/30">
      {/* Sidebar: Premium Bento Style */}
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-20'} bg-[#0a0a0a] border-r border-white/5 flex flex-col transition-all duration-500 ease-in-out`}>
        <div className="p-6 flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
            <Globe className="text-black" size={24} />
          </div>
          {isSidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h1 className="font-black text-xl tracking-tighter">BUZZK PRO</h1>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest leading-none">Management</p>
            </motion.div>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-6">
          <NavItem id="dashboard" icon={<Home size={20}/>} label="대시보드" active={activeTab} setter={setActiveTab} collapsed={!isSidebarOpen} />
          <NavItem id="commands" icon={<Terminal size={20}/>} label="명령어" active={activeTab} setter={setActiveTab} collapsed={!isSidebarOpen} />
          <NavItem id="songs" icon={<Music size={20}/>} label="신청곡" active={activeTab} setter={setActiveTab} collapsed={!isSidebarOpen} />
          <NavItem id="greet" icon={<HandHelping size={20}/>} label="인사 관리" active={activeTab} setter={setActiveTab} collapsed={!isSidebarOpen} />
          <NavItem id="votes" icon={<Poll size={20}/>} label="투표/추첨" active={activeTab} setter={setActiveTab} collapsed={!isSidebarOpen} />
          <NavItem id="participation" icon={<Users size={20}/>} label="시청자 참여" active={activeTab} setter={setActiveTab} collapsed={!isSidebarOpen} />
          <NavItem id="points" icon={<Coins size={20}/>} label="포인트" active={activeTab} setter={setActiveTab} collapsed={!isSidebarOpen} />
        </nav>

        <div className="p-4 mt-auto">
          <button 
            onClick={() => { localStorage.clear(); window.location.href = '/'; }}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl bg-red-500/5 text-red-500 font-bold hover:bg-red-500 hover:text-white transition-all duration-300"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span>로그아웃</span>}
          </button>
        </div>
      </aside>

      {/* Main Viewport */}
      <main className="flex-1 overflow-y-auto custom-scrollbar relative">
        <div className="p-12 max-w-7xl mx-auto">
          {/* Header */}
          <header className="flex justify-between items-end mb-16">
            <div>
              <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-[0.2em] mb-3">
                <ShieldCheck size={14} /> <span>Secure Admin Panel</span>
              </div>
              <h2 className="text-6xl font-black tracking-tighter text-white capitalize">{activeTab}</h2>
            </div>
            
            <div className="flex items-center gap-6 bg-white/5 p-3 pr-8 rounded-3xl border border-white/5 backdrop-blur-3xl shadow-2xl">
              <div 
                className="w-16 h-16 rounded-2xl bg-cover bg-center ring-2 ring-emerald-500/20"
                style={{ backgroundImage: `url(${store.currentUser?.channelImageUrl})` }}
              />
              <div>
                <p className="text-white font-black text-xl leading-none mb-1">{store.currentUser?.channelName || 'Loading...'}</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${store.isConnected ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500'}`} />
                  <span className="text-[10px] text-gray-400 font-black uppercase">{store.isConnected ? 'Connected' : 'Offline'}</span>
                </div>
              </div>
            </div>
          </header>

          {/* Dynamic Content Rendering */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {activeTab === 'dashboard' && <DashboardHome store={store} />}
              {activeTab === 'commands' && <CommandList data={store.commands} onSend={send} />}
              {activeTab === 'songs' && <SongManager store={store} onSend={send} />}
              {activeTab === 'greet' && <GreetPanel store={store} onSend={send} />}
              {activeTab === 'votes' && <VoteSystem store={store} onSend={send} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function NavItem({ id, icon, label, active, setter, collapsed }: any) {
  const isActive = active === id;
  return (
    <button
      onClick={() => setter(id)}
      className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group ${
        isActive 
          ? 'bg-emerald-500 text-black font-black shadow-xl shadow-emerald-500/20' 
          : 'text-gray-500 hover:text-white hover:bg-white/5'
      }`}
    >
      <span className={`${isActive ? 'text-black' : 'text-gray-500 group-hover:text-emerald-500'}`}>{icon}</span>
      {!collapsed && <span className="tracking-tight">{label}</span>}
    </button>
  );
}