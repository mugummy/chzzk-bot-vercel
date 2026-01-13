'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  Home, Terminal, Clock, Calculator, Music, HandHelping, 
  Poll, Users, Coins, LogOut, Activity, Globe, ShieldCheck, Menu, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBotStore } from '@/lib/store';

// 모든 탭 컴포넌트 임포트 (100% 교체된 리액트 버전)
import DashboardHome from '@/components/dashboard/DashboardHome';
import CommandTab from '@/components/dashboard/CommandTab';
import SongTab from '@/components/dashboard/SongTab';
import GreetTab from '@/components/dashboard/GreetTab';
import VotePanel from '@/components/dashboard/VotePanel';
import ParticipationTab from '@/components/dashboard/ParticipationTab';
import PointTab from '@/components/dashboard/PointTab';

export default function DashboardPage() {
  const store = useBotStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // WebSocket 연결 매커니즘 (재시도 및 상태 동기화)
  const connectWS = useCallback((token: string) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Railway 서버 주소와 통일
    const wsUrl = `wss://web-production-19eef.up.railway.app/?token=${token}`;
    
    console.log('[Dashboard] Connecting to WS:', wsUrl);
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('[Dashboard] WebSocket Connected Successfully');
      ws.send(JSON.stringify({ type: 'connect' }));
      ws.send(JSON.stringify({ type: 'requestData' }));
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        handleIncomingData(data);
      } catch (err) { console.error('[WS] Sync Error:', err); }
    };

    ws.onclose = () => {
      console.warn('[WS] Connection Lost. Retrying in 3s...');
      setTimeout(() => connectWS(token), 3000);
    };

    setSocket(ws);
  }, []);

  const handleIncomingData = (data: any) => {
    console.log('[WS] Received:', data.type);
    switch (data.type) {
      case 'connectResult': 
        store.setBotStatus(data.success);
        if (data.channelInfo) store.setStreamInfo(data.channelInfo, data.liveStatus);
        setIsLoading(false);
        break;
      case 'settingsUpdate': store.updateSettings(data.payload); break;
      case 'commandsUpdate': store.updateCommands(data.payload); break;
      case 'countersUpdate': store.updateCounters(data.payload); break;
      case 'macrosUpdate': store.updateMacros(data.payload); break;
      case 'songStateUpdate': store.updateSongs(data.payload); break;
      case 'participationStateUpdate': store.updateParticipation(data.payload); break;
      case 'greetStateUpdate': store.updateGreet(data.payload); break;
      case 'newChat': store.addChat(data.payload); break;
      case 'error': 
        // 전역 알림 시스템 연동 (window.ui.notify)
        if(window.ui) window.ui.notify(data.message, 'error');
        break;
    }
  };

  const send = (msg: any) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(msg));
    } else {
      console.error('[WS] Send failed: Socket not connected');
    }
  };

  // 초기 로드 및 세션 검증
  useEffect(() => {
    const token = localStorage.getItem('chzzk_session_token');
    const params = new URLSearchParams(window.location.search);
    const session = params.get('session');

    if (session) {
      localStorage.setItem('chzzk_session_token', session);
      window.history.replaceState({}, document.title, window.location.pathname);
      window.location.reload();
      return;
    }

    if (!token) {
      window.location.href = '/';
      return;
    }

    fetch('https://web-production-19eef.up.railway.app/api/auth/session', { 
      headers: { 'Authorization': `Bearer ${token}` } 
    })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          store.setAuth(data.user);
          connectWS(token);
        } else {
          window.location.href = '/';
        }
      })
      .catch(() => window.location.href = '/');

    // 윈도우 전역 헬퍼 설정 (기존 vote-system.js 등과의 호환성)
    (window as any).sendWebSocket = send;
    (window as any).ui = {
      notify: (msg: string, type: string) => {
        // 커스텀 알림 로직 (React 상태로 처리 가능)
        console.log(`[Notify] ${type}: ${msg}`);
      }
    };

    return () => socket?.close();
  }, [connectWS]);

  if (isLoading && !store.currentUser) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center gap-6">
        <Activity className="text-emerald-500 animate-spin" size={48} />
        <p className="text-gray-500 font-black tracking-widest uppercase animate-pulse">Syncing with Server...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans selection:bg-emerald-500/30">
      {/* Sidebar: Premium Glass Design */}
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-24'} bg-[#0a0a0a] border-r border-white/5 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] relative z-50`}>
        <div className="p-8 flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/20 shrink-0">
            <Activity className="text-black" size={28} />
          </div>
          {isSidebarOpen && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
              <h1 className="font-black text-2xl tracking-tighter leading-none">BUZZK</h1>
              <p className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.2em] mt-1">Pro System</p>
            </motion.div>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-8">
          <NavItem id="dashboard" icon={<Home size={22}/>} label="대시보드" active={activeTab} setter={setActiveTab} collapsed={!isSidebarOpen} />
          <NavItem id="commands" icon={<Terminal size={22}/>} label="명령어" active={activeTab} setter={setActiveTab} collapsed={!isSidebarOpen} />
          <NavItem id="songs" icon={<Music size={22}/>} label="신청곡" active={activeTab} setter={setActiveTab} collapsed={!isSidebarOpen} />
          <NavItem id="greet" icon={<HandHelping size={22}/>} label="인사 관리" active={activeTab} setter={setActiveTab} collapsed={!isSidebarOpen} />
          <NavItem id="votes" icon={<Poll size={22}/>} label="투표/추첨" active={activeTab} setter={setActiveTab} collapsed={!isSidebarOpen} />
          <NavItem id="participation" icon={<Users size={22}/>} label="시청자 참여" active={activeTab} setter={setActiveTab} collapsed={!isSidebarOpen} />
          <NavItem id="points" icon={<Coins size={22}/>} label="포인트" active={activeTab} setter={setActiveTab} collapsed={!isSidebarOpen} />
        </nav>

        <div className="p-6 mt-auto">
          <button 
            onClick={() => { localStorage.clear(); window.location.href = '/'; }}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-red-500/5 text-red-500 font-bold hover:bg-red-500 hover:text-white transition-all duration-300 group"
          >
            <LogOut size={22} className="group-hover:rotate-12 transition-transform" />
            {isSidebarOpen && <span>로그아웃</span>}
          </button>
        </div>

        {/* Sidebar Toggle */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#111] border border-white/10 rounded-full flex items-center justify-center text-gray-500 hover:text-white transition-colors z-50"
        >
          {isSidebarOpen ? <Menu size={14} /> : <ChevronRight size={14} />}
        </button>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 overflow-y-auto custom-scrollbar relative">
        <div className="p-12 max-w-[1400px] mx-auto">
          {/* Dashboard Header */}
          <header className="flex justify-between items-end mb-16">
            <div>
              <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-[0.3em] mb-4">
                <ShieldCheck size={14} /> <span>Admin Secured Access</span>
              </div>
              <h2 className="text-7xl font-black tracking-tighter text-white capitalize">{activeTab}</h2>
            </div>
            
            <div className="flex items-center gap-6 bg-white/5 p-3 pr-10 rounded-[2.5rem] border border-white/5 backdrop-blur-3xl shadow-2xl">
              <div 
                className="w-20 h-20 rounded-[1.5rem] bg-cover bg-center ring-4 ring-emerald-500/10 shadow-2xl"
                style={{ backgroundImage: `url(${store.currentUser?.channelImageUrl})` }}
              />
              <div>
                <p className="text-white font-black text-2xl tracking-tight leading-none mb-2">{store.currentUser?.channelName || 'Syncing...'}</p>
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${store.isConnected ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : 'bg-red-500 animate-pulse'}`} />
                  <span className="text-[11px] text-gray-400 font-black uppercase tracking-widest">{store.isConnected ? 'Server Online' : 'Connecting...'}</span>
                </div>
              </div>
            </div>
          </header>

          {/* Dynamic Tab Content with Animation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {activeTab === 'dashboard' && <DashboardHome store={store} />}
              {activeTab === 'commands' && <CommandTab onSend={send} />}
              {activeTab === 'songs' && <SongTab onControl={(a) => send({type:'controlMusic', action: a})} />}
              {activeTab === 'greet' && <GreetTab onSend={send} />}
              {activeTab === 'votes' && <VotePanel onSend={send} />}
              {activeTab === 'participation' && <ParticipationTab onSend={send} />}
              {activeTab === 'points' && <PointTab onSend={send} />}
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
      className={`w-full flex items-center gap-5 px-6 py-5 rounded-[1.5rem] transition-all duration-500 group relative ${
        isActive 
          ? 'bg-emerald-500 text-black font-black shadow-2xl shadow-emerald-500/30 scale-[1.02]' 
          : 'text-gray-500 hover:text-white hover:bg-white/5'
      }`}
    >
      <span className={`${isActive ? 'text-black' : 'text-gray-500 group-hover:text-emerald-500'} transition-colors duration-300`}>{icon}</span>
      {!collapsed && <span className="tracking-tighter text-lg">{label}</span>}
    </button>
  );
}