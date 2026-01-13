'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Music, MessageSquare, BarChart3, ChevronRight, Globe } from 'lucide-react';

/**
 * Landing Page: 서비스의 첫 관문
 * 자동 리다이렉트를 제거하여 루프를 방지하고 사용자의 명시적 로그인을 유도합니다.
 */
export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    // URL 에러 파라미터 처리 (예: ?error=expired)
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    if (error === 'expired') {
      alert('세션이 만료되었습니다. 다시 로그인해주세요.');
    } else if (error) {
      alert('로그인 중 오류가 발생했습니다.');
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = () => {
    // [중요] 기존 토큰이 루프를 유발할 수 있으므로 로그인 시도 시 먼저 비움
    localStorage.removeItem('chzzk_session_token');
    window.location.href = 'https://web-production-19eef.up.railway.app/auth/login';
  };

  const handleDemo = () => {
    window.location.href = '/demo';
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 border-b ${isScrolled ? 'bg-black/80 backdrop-blur-xl border-white/10 py-4' : 'bg-transparent border-transparent py-8'}`}>
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] group-hover:scale-110 transition-transform text-black font-black">
              <Zap size={24} fill="currentColor" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic">Buzzk Pro</h1>
          </div>
          
          <div className="hidden md:flex items-center gap-10 text-sm font-black uppercase tracking-widest text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <button onClick={handleLogin} className="bg-white text-black px-8 py-3 rounded-full hover:bg-emerald-500 transition-all active:scale-95">Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-8 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-3 px-5 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] mb-10 shadow-2xl">
          <ShieldCheck size={14} /> <span>Strict TypeScript Ecosystem</span>
        </motion.div>
        
        <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-7xl md:text-9xl font-black tracking-tighter mb-10 leading-[0.85] text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">
          THE ULTIMATE <br /> CHZZK BOT <br /> ENGINE.
        </motion.h2>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="flex flex-col md:flex-row justify-center items-center gap-6">
          <button onClick={handleLogin} className="group bg-emerald-500 text-black px-12 py-6 rounded-[2.5rem] text-xl font-black shadow-2xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-4">
            <span>Login with Chzzk</span>
            <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button onClick={handleDemo} className="px-12 py-6 rounded-[2.5rem] bg-white/5 border border-white/10 font-black text-xl hover:bg-white/10 transition-all flex items-center gap-4">
            <Globe size={24} /> <span>Launch Demo</span>
          </button>
        </motion.div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="max-w-7xl mx-auto px-8 py-32 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-12">
        <FeatureCard icon={<Zap size={32} className="text-amber-400" fill="currentColor" />} title="0.1s Real-time Sync" desc="서버와 클라이언트가 밀리초 단위로 동기화되는 고성능 엔진." />
        <FeatureCard icon={<Music size={32} className="text-cyan-400" />} title="Smart Multimedia" desc="후원과 연동되어 썸네일까지 완벽 지원하는 신청곡 시스템." />
        <FeatureCard icon={<BarChart3 size={32} className="text-emerald-400" />} title="Advanced Analytics" desc="시청자 활동 데이터를 수집하여 참여왕과 포인트 랭킹 산출." />
      </section>

      <footer className="max-w-7xl mx-auto px-8 py-20 border-t border-white/5 flex justify-between items-center text-gray-600 font-bold text-sm">
        <div className="flex items-center gap-3">
          <Zap size={20} fill="currentColor" className="text-emerald-500" />
          <span>BUZZK PRO SYSTEM</span>
        </div>
        <span>© 2026 Professional Enterprise Solution.</span>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: any) {
  return (
    <div className="bg-[#0a0a0a] p-12 rounded-[3.5rem] border border-white/5 hover:border-emerald-500/30 transition-all duration-500 group relative overflow-hidden">
      <div className="mb-8 p-4 bg-white/5 rounded-2xl w-fit group-hover:scale-110 transition-all">{icon}</div>
      <h3 className="text-2xl font-black mb-4 text-white tracking-tight">{title}</h3>
      <p className="text-gray-500 font-medium leading-relaxed">{desc}</p>
    </div>
  );
}
