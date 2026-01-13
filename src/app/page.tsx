'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Music, MessageSquare, BarChart3, Users, ChevronRight, Globe, Lock } from 'lucide-react';

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    // URL에 에러가 있는지 체크
    const params = new URLSearchParams(window.location.search);
    if (params.get('error')) {
      alert('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = () => {
    window.location.href = 'https://web-production-19eef.up.railway.app/auth/login';
  };

  const handleDemo = () => {
    // 체험용 데모 페이지로 이동
    window.location.href = '/demo';
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 border-b ${isScrolled ? 'bg-black/80 backdrop-blur-xl border-white/10 py-4' : 'bg-transparent border-transparent py-8'}`}>
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] group-hover:scale-110 transition-transform">
              <Zap size={24} className="text-black" fill="currentColor" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter">BUZZK PRO</h1>
          </div>
          
          <div className="hidden md:flex items-center gap-10 text-sm font-black uppercase tracking-widest text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <button onClick={handleLogin} className="bg-white text-black px-8 py-3 rounded-full hover:bg-emerald-500 transition-all active:scale-95">Start Free</button>
          </div>
        </div>
      </nav>

      <section className="relative pt-48 pb-32 px-8 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-3 px-5 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] mb-10 shadow-2xl">
          <ShieldCheck size={14} /> <span>Next-Gen Streaming Management</span>
        </motion.div>
        
        <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-7xl md:text-9xl font-black tracking-tighter mb-10 leading-[0.85] text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">
          CONTROL YOUR <br /> STREAM LIKE <br /> A PRO.
        </motion.h2>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="max-w-2xl mx-auto text-lg md:text-xl text-gray-500 font-medium leading-relaxed mb-16">
          가장 안정적이고 강력한 리액트 기반 봇 시스템. <br /> 실시간 명령어, 투표, 신청곡을 한 번에 제어하세요.
        </motion.p>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="flex flex-col md:flex-row justify-center items-center gap-6">
          <button onClick={handleLogin} className="group bg-emerald-500 text-black px-12 py-6 rounded-[2.5rem] text-xl font-black shadow-2xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-4">
            <span>Get Started with Chzzk</span>
            <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button onClick={handleDemo} className="px-12 py-6 rounded-[2.5rem] bg-white/5 border border-white/10 font-black text-xl hover:bg-white/10 transition-all flex items-center gap-4">
            <Globe size={24} /> <span>Live Demo</span>
          </button>
        </motion.div>
      </section>

      <section id="features" className="max-w-7xl mx-auto px-8 py-32 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-8">
        <FeatureCard icon={<Zap size={32} className="text-amber-400" fill="currentColor" />} title="Real-time Engine" desc="Zustand와 WebSocket을 통한 0.1초 동기화 시스템." />
        <FeatureCard icon={<Music size={32} className="text-cyan-400" />} title="Song Manager" desc="후원과 연동된 스마트한 유튜브 신청곡 플레이어." />
        <FeatureCard icon={<BarChart3 size={32} className="text-emerald-400" />} title="Vote & Draw" desc="chzzk-vote의 로직을 100% 이식한 투표/추첨 패널." />
      </section>

      <footer className="max-w-7xl mx-auto px-8 py-20 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10">
        <div className="flex items-center gap-3">
          <Zap size={24} className="text-emerald-500" fill="currentColor" />
          <span className="font-black text-xl tracking-tighter">BUZZK PRO</span>
        </div>
        <p className="text-gray-600 font-bold text-sm">© 2026 Professional Bot System. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: any) {
  return (
    <div className="bg-[#0a0a0a] p-10 rounded-[3rem] border border-white/5 hover:border-emerald-500/30 transition-all duration-500 group relative overflow-hidden">
      <div className="mb-8 p-4 bg-white/5 rounded-2xl w-fit group-hover:scale-110 transition-all">{icon}</div>
      <h3 className="text-2xl font-black mb-4 text-white">{title}</h3>
      <p className="text-gray-500 font-medium">{desc}</p>
    </div>
  );
}
