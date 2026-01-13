'use client';

import { useEffect, useState } from 'react';
import { useBotStore } from '@/lib/store';
import { 
  Home, Terminal, Clock, Calculator, Music, HandHelping, 
  Poll, Users, Coins, LogOut, LayoutGrid, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfessionalDashboard() {
  const store = useBotStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('chzzk_session_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    // 서버 데이터 페칭 및 소켓 연결
    // (여기서부터 진짜 프로페셔널한 동기화가 시작됩니다)
    setIsLoaded(true);
  }, []);

  if (!isLoaded) return <div className="bg-black min-h-screen" />;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar: Premium Glass Design */}
      <aside className="w-72 bg-[#0a0a0a] border-r border-white/5 flex flex-col p-6">
        <div className="flex items-center gap-4 mb-12 px-2">
          <div className="w-12 h-12 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Activity className="text-black" size={28} />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tight text-white">PRO CONTROL</h1>
            <p className="text-[10px] text-emerald-500 font-bold tracking-widest uppercase">Expert System</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem id="dashboard" icon={<Home size={20}/>} label="대시보드" active={activeTab} setter={setActiveTab} />
          <NavItem id="commands" icon={<Terminal size={20}/>} label="명령어" active={activeTab} setter={setActiveTab} />
          <NavItem id="macros" icon={<Clock size={20}/>} label="매크로" active={activeTab} setter={setActiveTab} />
          <NavItem id="counters" icon={<Calculator size={20}/>} label="카운터" active={activeTab} setter={setActiveTab} />
          <NavItem id="songs" icon={<Music size={20}/>} label="신청곡" active={activeTab} setter={setActiveTab} />
          <NavItem id="greet" icon={<HandHelping size={20}/>} label="인사" active={activeTab} setter={setActiveTab} />
          <NavItem id="votes" icon={<Poll size={20}/>} label="투표/추첨" active={activeTab} setter={setActiveTab} />
        </nav>

        <div className="mt-auto space-y-4">
          <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Bot Connectivity</span>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-sm font-bold text-white">System Operational</p>
          </div>
          <button 
            className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl bg-red-500/10 text-red-500 font-bold hover:bg-red-500 hover:text-white transition-all duration-300"
            onClick={() => { localStorage.clear(); window.location.href = '/'; }}
          >
            <LogOut size={20} />
            <span>로그아웃</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 bg-[#050505] p-12 overflow-y-auto relative">
        <div className="max-w-6xl mx-auto">
          <header className="flex justify-between items-end mb-16">
            <div>
              <h2 className="text-5xl font-black tracking-tighter text-white mb-2 capitalize">{activeTab}</h2>
              <p className="text-gray-500 font-medium tracking-tight text-lg">Professional streaming management environment.</p>
            </div>
            
            <div className="flex items-center gap-6 bg-white/5 p-3 pr-8 rounded-3xl border border-white/5 backdrop-blur-xl">
              <div 
                className="w-16 h-16 rounded-2xl bg-cover bg-center ring-2 ring-emerald-500/20 shadow-2xl"
                style={{ backgroundImage: `url(${store.currentUser?.channelImageUrl})` }}
              />
              <div>
                <p className="text-white font-black text-xl leading-none mb-1">{store.currentUser?.channelName || 'Loading...'}</p>
                <p className="text-emerald-500 text-xs font-black uppercase tracking-widest">Verified Account</p>
              </div>
            </div>
          </header>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {activeTab === 'dashboard' && <DashboardContent store={store} />}
              {activeTab === 'commands' && <ListContent type="명령어" data={store.commands} />}
              {/* Other tabs follow the same component pattern */}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function NavItem({ id, icon, label, active, setter }: any) {
  const isActive = active === id;
  return (
    <button
      onClick={() => setter(id)}
      className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${
        isActive 
          ? 'bg-emerald-500 text-black font-black shadow-lg shadow-emerald-500/20 scale-105' 
          : 'text-gray-500 hover:text-white hover:bg-white/5'
      }`}
    >
      <span className={`${isActive ? 'text-black' : 'text-gray-500 group-hover:text-emerald-500'} transition-colors`}>{icon}</span>
      <span className="tracking-tight">{label}</span>
    </button>
  );
}

function DashboardContent({ store }: any) {
  return (
    <div className="grid grid-cols-12 gap-8">
      {/* Live Card */}
      <div className="col-span-8 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-[3rem] p-12 text-black relative overflow-hidden group shadow-2xl shadow-emerald-500/10">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="px-4 py-1.5 bg-black/10 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" /> Live Status
            </div>
          </div>
          <h2 className="text-6xl font-black tracking-tighter mb-8 leading-none max-w-lg">
            {store.liveStatus?.liveTitle || 'Currently Offline'}
          </h2>
          <div className="flex gap-4">
            <div className="bg-black px-6 py-3 rounded-2xl text-white font-black flex items-center gap-3">
              <Users size={20} />
              <span>{store.liveStatus?.concurrentUserCount?.toLocaleString() || 0} Viewers</span>
            </div>
            <div className="bg-black/10 px-6 py-3 rounded-2xl font-black">
              {store.liveStatus?.category || 'No Category'}
            </div>
          </div>
        </div>
        <LayoutGrid size={300} className="absolute -right-20 -bottom-20 text-black/5 group-hover:rotate-12 transition-transform duration-1000" />
      </div>

      {/* Stats Quick View */}
      <div className="col-span-4 space-y-8">
        <div className="bg-[#111] p-10 rounded-[3rem] border border-white/5">
          <p className="text-gray-500 font-bold mb-2 uppercase tracking-widest text-xs">Total Interactions</p>
          <p className="text-6xl font-black text-white tracking-tighter">{store.commands.length + store.counters.length}</p>
        </div>
        <div className="bg-[#111] p-10 rounded-[3rem] border border-white/5">
          <p className="text-gray-500 font-bold mb-2 uppercase tracking-widest text-xs">Song Queue</p>
          <p className="text-6xl font-black text-white tracking-tighter">{store.songs.queue.length}</p>
        </div>
      </div>
    </div>
  );
}

function ListContent({ type, data }: any) {
  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-black text-white">Manage {type}</h3>
        <button className="bg-white text-black px-8 py-4 rounded-2xl font-black hover:bg-emerald-500 transition-colors">
          + Create New
        </button>
      </div>
      <div className="grid grid-cols-2 gap-6">
        {data.map((item: any, i: number) => (
          <div key={i} className="bg-[#111] p-8 rounded-[2.5rem] border border-white/5 flex items-center justify-between group hover:border-emerald-500/30 transition-all duration-500">
            <div>
              <p className="text-emerald-500 font-black text-xl mb-1">!{item.triggers?.[0] || item.trigger}</p>
              <p className="text-gray-400 font-medium text-lg line-clamp-1">{item.response || item.message}</p>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 text-white transition-colors">
                <Settings size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
