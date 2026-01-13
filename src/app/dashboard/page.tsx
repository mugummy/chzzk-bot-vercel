'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  Home, Terminal, Clock, Calculator, Music, HandHelping, 
  BarChart3, Users, Coins, LogOut, Activity, Globe, ShieldCheck, Menu, ChevronRight, X, RefreshCw, AlertCircle, Zap
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
import Toggle from '@/components/ui/Toggle';

export default function DashboardPage() {
  const store = useBotStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const [winner, setWinner] = useState<any | null>(null);
  const [winnerChats, setWinnerChats] = useState<any[]>([]);
  
  const socketRef = useRef<WebSocket | null>(null);

  const getServerUrl = () => process.env.NEXT_PUBLIC_SERVER_URL || 'web-production-19eef.up.railway.app';

  const handleIncomingData = useCallback((data: any) => {
    const { type, payload } = data;
    const currentStore = useBotStore.getState();

    switch (type) {
      case 'connectResult': 
        currentStore.setBotStatus(data.success);
        if (data.channelInfo) currentStore.setStreamInfo(data.channelInfo, data.liveStatus);
        setIsLoading(false);
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({ type: 'requestData' }));
        }
        break;
      case 'settingsUpdate': currentStore.updateSettings(payload); break;
      case 'commandsUpdate': currentStore.updateCommands(payload); break;
      case 'countersUpdate': currentStore.updateCounters(payload); break;
      case 'macrosUpdate': currentStore.updateMacros(payload); break;
      case 'songStateUpdate': currentStore.updateSongs(payload); break;
      case 'participationStateUpdate': currentStore.updateParticipation(payload); break;
      case 'participationRankingUpdate': currentStore.updateParticipationRanking(payload); break;
      case 'greetStateUpdate': currentStore.updateGreet(payload); break;
      case 'chatHistoryLoad': currentStore.setChatHistory(payload); break;
      case 'newChat': 
        currentStore.addChat(payload); 
        if (winner && payload.profile.userIdHash === winner.userIdHash) {
          setWinnerChats(prev => [payload, ...prev].slice(0, 10));
          if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(new SpeechSynthesisUtterance(payload.message));
          }
        }
        break;
      case 'drawWinnerResult':
        const winPlayer = payload.winners[0];
        setWinner(winPlayer);
        setWinnerChats([]);
        if (typeof window !== 'undefined' && (window as any).ui?.notify) {
          (window as any).ui.notify(`${winPlayer.nickname}님이 당첨되었습니다!`, 'success');
        }
        break;
      case 'playerControl':
        // 대시보드 UI에서도 재생/멈춤 상태를 알 수 있도록 처리 가능 (필요 시)
        break;
    }
  }, [winner]);

  const connectWS = useCallback((token: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${getServerUrl()}/?token=${token}`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;
    ws.onopen = () => {
      useBotStore.getState().setBotStatus(true, false);
      ws.send(JSON.stringify({ type: 'connect' }));
    };
    ws.onmessage = (e) => { try { handleIncomingData(JSON.parse(e.data)); } catch (err) {} };
    ws.onclose = () => {
      useBotStore.getState().setBotStatus(false, true);
      socketRef.current = null;
      setTimeout(() => connectWS(token), 3000);
    };
    setSocket(ws);
  }, [handleIncomingData]);

  const send = useCallback((msg: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    }
  }, []);

  // [중요] 윈도우 전역 헬퍼에 send 함수를 바인딩하여 SongTab 등에서 접근 가능하게 함
  useEffect(() => {
    (window as any).sendWebSocket = send;
  }, [send]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const sessionFromUrl = params.get('session');
    if (sessionFromUrl) {
      localStorage.setItem('chzzk_session_token', sessionFromUrl);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    const token = localStorage.getItem('chzzk_session_token');
    if (!token) { window.location.href = '/'; return; }
    
    fetch(`https://${getServerUrl()}/api/auth/session?t=${Date.now()}`, { 
      headers: { 'Authorization': `Bearer ${token}` } 
    })
    .then(res => res.json())
    .then(data => {
      if (data.authenticated && data.user) {
        store.setAuth(data.user);
        connectWS(token);
      } else {
        localStorage.removeItem('chzzk_session_token');
        window.location.href = '/';
      }
    })
    .catch(() => setAuthError('서버 통신 장애'));
    
    return () => { if (socketRef.current) socketRef.current.close(); };
  }, [connectWS]);

  if (isLoading && !store.currentUser) return <div className="h-screen bg-black flex items-center justify-center"><Activity className="text-emerald-500 animate-spin" size={48} /></div>;

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans">
      <AnimatePresence>{store.isReconnecting && <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-md flex flex-col items-center justify-center gap-6"><RefreshCw className="text-emerald-500 animate-spin" size={48} /><p className="text-xl font-black uppercase animate-pulse italic">Reconnecting...</p></motion.div>}</AnimatePresence>

      <aside className={`${isSidebarOpen ? 'w-72' : 'w-24'} bg-[#0a0a0a] border-r border-white/5 flex flex-col transition-all duration-500 z-50 shadow-2xl`}>
        <div className="p-8 flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-2xl">
            <Zap className="text-white" size={28} fill="currentColor" />
          </div>
          {isSidebarOpen && <h1 className="font-black text-2xl tracking-tighter uppercase italic">gummybot</h1>}
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
          <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-red-500/5 text-red-500 font-bold hover:bg-red-500 transition-all duration-300">
            <LogOut size={22} /> {isSidebarOpen && <span>로그아웃</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto custom-scrollbar relative p-12">
        <header className="flex justify-between items-end mb-16">
          <h2 className="text-7xl font-black tracking-tighter text-white capitalize">{activeTab}</h2>
          <div className="flex items-center gap-6 bg-white/5 p-3 pr-10 rounded-[2.5rem] border border-white/5 shadow-2xl backdrop-blur-xl">
            <div className="w-20 h-20 rounded-[1.5rem] bg-cover bg-center ring-4 ring-emerald-500/10 shadow-2xl" style={{ backgroundImage: `url(${store.currentUser?.channelImageUrl || 'https://ssl.pstatic.net/static/nng/glstat/game/favicon.ico'})` }} />
            <div>
              <p className="text-white font-black text-2xl mb-2 leading-none">{store.currentUser?.channelName}</p>
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${store.isConnected ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : 'bg-red-500 animate-pulse'}`} />
                <span className="text-[11px] text-gray-400 font-black uppercase tracking-widest">{store.isConnected ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
            {activeTab === 'dashboard' && <DashboardHome store={store} />}
            {activeTab === 'commands' && <CommandTab onSend={send} />}
            {activeTab === 'macros' && <MacroTab onSend={send} />}
            {/* [수정] onSend 프롭을 확실하게 전달하여 설정 저장을 보장함 */}
            {activeTab === 'songs' && <SongTab onControl={(a, idx) => send({type:'controlMusic', action: a, index: idx})} onSend={send} />}
            {activeTab === 'greet' && <GreetTab onSend={send} />}
            {activeTab === 'votes' && <VotePanel onSend={send} />}
            {activeTab === 'participation' && <ParticipationTab onSend={send} />}
            {activeTab === 'points' && <PointTab onSend={send} />}
          </motion.div>
        </AnimatePresence>

        <ToastContainer />
      </main>
    </div>
  );
}

function NavItem({ id, icon, label, active, setter, collapsed }: any) {
  const isActive = active === id;
  return (
    <button onClick={() => setter(id)} className={`w-full flex items-center gap-5 px-6 py-5 rounded-[1.5rem] transition-all duration-500 relative ${isActive ? 'bg-emerald-500 text-black font-black shadow-2xl scale-[1.02]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
      <span className={`${isActive ? 'text-black' : 'text-gray-500'}`}>{icon}</span>
      {!collapsed && <span className="tracking-tighter text-lg">{label}</span>}
    </button>
  );
}