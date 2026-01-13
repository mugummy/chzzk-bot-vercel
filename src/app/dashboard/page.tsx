'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  Home, Terminal, Clock, Calculator, Music, HandHelping, 
  BarChart3, Users, Coins, LogOut, Activity, Globe, ShieldCheck, Menu, ChevronRight, X, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBotStore } from '@/lib/store';

import DashboardHome from '@/components/dashboard/DashboardHome';
import CommandTab from '@/components/dashboard/CommandTab';
import MacroTab from '@/components/dashboard/MacroTab';
import SongTab from '@/components/dashboard/SongTab';
import GreetTab from '@/components/dashboard/GreetTab';
import VotePanel from '@/components/dashboard/VotePanel';
import ParticipationTab from '@/components/dashboard/ParticipationTab';
import PointTab from '@/components/dashboard/PointTab';
import ToastContainer from '@/components/ui/Toast';

export default function DashboardPage() {
  const store = useBotStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  const [winner, setWinner] = useState<any | null>(null);
  const [winnerChats, setWinnerChats] = useState<any[]>([]);
  const lastSpokenMsgRef = useRef<string>('');

  const getServerUrl = () => {
    return process.env.NEXT_PUBLIC_SERVER_URL || 'web-production-19eef.up.railway.app';
  };

  const speak = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    if (lastSpokenMsgRef.current === text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    window.speechSynthesis.speak(utterance);
    lastSpokenMsgRef.current = text;
  };

  const handleIncomingData = useCallback((data: any) => {
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
      case 'participationRankingUpdate': store.updateParticipationRanking(data.payload); break;
      case 'greetStateUpdate': store.updateGreet(data.payload); break;
      case 'newChat': 
        store.addChat(data.payload); 
        if (winner && data.payload.profile.userIdHash === winner.userIdHash) {
          setWinnerChats(prev => [data.payload, ...prev].slice(0, 10));
          speak(data.payload.message);
        }
        break;
      case 'drawWinnerResult':
        const winPlayer = data.payload.winners[0];
        setWinner(winPlayer);
        setWinnerChats([]);
        if (typeof window !== 'undefined' && (window as any).ui?.notify) {
          (window as any).ui.notify(`${winPlayer.nickname}님이 당첨되었습니다!`, 'success');
        }
        break;
    }
  }, [store, winner]);

  const connectWS = useCallback((token: string) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${getServerUrl()}/?token=${token}`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      store.setBotStatus(true, false);
      ws.send(JSON.stringify({ type: 'connect' }));
      ws.send(JSON.stringify({ type: 'requestData' }));
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        handleIncomingData(data);
      } catch (err) {}
    };

    ws.onclose = () => {
      store.setBotStatus(false, true);
      setTimeout(() => connectWS(token), 3000);
    };

    setSocket(ws);
  }, [store, handleIncomingData]);

  const closeWinnerPopup = () => {
    setWinner(null);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const send = (msg: any) => {
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(msg));
  };

  useEffect(() => {
    const token = localStorage.getItem('chzzk_session_token');
    if (!token) { window.location.href = '/'; return; }
    
    fetch(`https://${getServerUrl()}/api/auth/session`, { 
      headers: { 'Authorization': `Bearer ${token}` } 
    }).then(res => res.json()).then(data => {
      if (data.authenticated) {
        store.setAuth(data.user);
        connectWS(token);
      } else { window.location.href = '/'; }
    }).catch(() => { window.location.href = '/'; });

    return () => { if (socket) socket.close(); };
  }, [connectWS]);

  if (isLoading && !store.currentUser) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center gap-6">
        <Activity className="text-emerald-500 animate-spin" size={48} />
        <p className="text-gray-500 font-black tracking-widest uppercase animate-pulse">Estabishing Connection...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans">
      <AnimatePresence>
        {store.isReconnecting && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-md flex flex-col items-center justify-center gap-6">
            <RefreshCw className="text-emerald-500 animate-spin" size={48} />
            <p className="text-xl font-black tracking-widest uppercase animate-pulse">Reconnecting...</p>
          </motion.div>
        )}
      </AnimatePresence>

      <aside className={`${isSidebarOpen ? 'w-72' : 'w-24'} bg-[#0a0a0a] border-r border-white/5 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] z-50`}>
        <div className="p-8 flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl">
            <Activity className="text-black" size={28} />
          </div>
          {isSidebarOpen && <h1 className="font-black text-2xl tracking-tighter">BUZZK PRO</h1>}
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-8">
          <NavItem id="dashboard" icon={<Home size={22}/>} label="대시보드" active={activeTab} setter={setActiveTab} collapsed={!isSidebarOpen} />
          <NavItem id="commands" icon={<Terminal size={22}/>} label="명령어" active={activeTab} setter={setActiveTab} collapsed={!isSidebarOpen} />
          <NavItem id="macros" icon={<Clock size={22}/>} label="매크로" active={activeTab} setter={setActiveTab} collapsed={!isSidebarOpen} />
          <NavItem id="songs" icon={<Music size={22}/>} label="신청곡" active={activeTab} setter={setActiveTab} collapsed={!isSidebarOpen} />
          <NavItem id="greet" icon={<HandHelping size={22}/>} label="인사 관리" active={activeTab} setter={setActiveTab} collapsed={!isSidebarOpen} />
          <NavItem id="votes" icon={<BarChart3 size={22}/>} label="투표/추첨" active={activeTab} setter={setActiveTab} collapsed={!isSidebarOpen} />
          <NavItem id="participation" icon={<Users size={22}/>} label="시청자 참여" active={activeTab} setter={setActiveTab} collapsed={!isSidebarOpen} />
          <NavItem id="points" icon={<Coins size={22}/>} label="포인트" active={activeTab} setter={setActiveTab} collapsed={!isSidebarOpen} />
        </nav>

        <div className="p-6 mt-auto">
          <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-red-500/5 text-red-500 font-bold hover:bg-red-500 hover:text-white transition-all duration-300">
            <LogOut size={22} /> {isSidebarOpen && <span>로그아웃</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto custom-scrollbar relative p-12">
        <header className="flex justify-between items-end mb-16">
          <h2 className="text-7xl font-black tracking-tighter text-white capitalize">{activeTab}</h2>
          <div className="flex items-center gap-6 bg-white/5 p-3 pr-10 rounded-[2.5rem] border border-white/5 shadow-2xl">
            <div className="w-20 h-20 rounded-[1.5rem] bg-cover bg-center ring-4 ring-emerald-500/10 shadow-2xl" style={{ backgroundImage: `url(${store.currentUser?.channelImageUrl})` }} />
            <div>
              <p className="text-white font-black text-2xl mb-2">{store.currentUser?.channelName}</p>
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${store.isConnected ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : 'bg-red-500 animate-pulse'}`} />
                <span className="text-[11px] text-gray-400 font-black uppercase tracking-widest">{store.isConnected ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
            {activeTab === 'dashboard' && <DashboardHome store={store} />}
            {activeTab === 'commands' && <CommandTab onSend={send} />}
            {activeTab === 'macros' && <MacroTab onSend={send} />}
            {activeTab === 'songs' && <SongTab onControl={(a) => send({type:'controlMusic', action: a})} />}
            {activeTab === 'greet' && <GreetTab onSend={send} />}
            {activeTab === 'votes' && <VotePanel onSend={send} />}
            {activeTab === 'participation' && <ParticipationTab onSend={send} />}
            {activeTab === 'points' && <PointTab onSend={send} />}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {winner && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.8, y: 100 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: 100 }} className="w-full max-w-2xl bg-black/90 backdrop-blur-3xl border border-emerald-500/30 rounded-[4rem] p-12 shadow-2xl pointer-events-auto text-center relative overflow-hidden">
                <button onClick={closeWinnerPopup} className="absolute top-10 right-10 p-4 bg-white/5 rounded-full hover:bg-red-500 transition-all"><X size={24} /></button>
                <div className="w-32 h-32 bg-emerald-500 rounded-full mx-auto mb-8 flex items-center justify-center"><Users size={64} className="text-black" /></div>
                <h2 className="text-6xl font-black tracking-tighter text-white mb-12">{winner.nickname}</h2>
                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 text-left h-40 overflow-y-auto space-y-4 pr-4 custom-scrollbar">
                  {winnerChats.map((chat, i) => (
                    <div key={i} className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                      <p className="text-emerald-400 text-sm font-bold leading-relaxed">{chat.message}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <ToastContainer />
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