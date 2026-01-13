'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, ZapOff, Music, MessageSquare, BarChart3, Users, ChevronRight, Globe, Lock } from 'lucide-react';

/**
 * Main Landing Page: 서비스의 첫 관문이자 로그인 유도 페이지
 */
export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = () => {
    // Railway 서버의 인증 엔드포인트로 리다이렉트
    window.location.href = 'https://web-production-19eef.up.railway.app/auth/login';
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      {/* Dynamic Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 border-b ${isScrolled ? 'bg-black/80 backdrop-blur-xl border-white/10 py-4' : 'bg-transparent border-transparent py-8'}`}>
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] group-hover:scale-110 transition-transform">
              <Zap size={24} className="text-black" fill="currentColor" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter">BUZZK PRO</h1>
          </div>
          
          <div className="hidden md:flex items-center gap-10 text-sm font-black uppercase tracking-widest text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#" className="hover:text-white transition-colors">Docs</a>
            <button 
              onClick={handleLogin}
              className="bg-white text-black px-8 py-3 rounded-full hover:bg-emerald-500 transition-all active:scale-95"
            >
              Start Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 px-5 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] mb-10 shadow-2xl"
          >
            <ShieldCheck size={14} /> <span>Next-Gen Streaming Management</span>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-7xl md:text-9xl font-black tracking-tighter mb-10 leading-[0.85] text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40"
          >
            CONTROL YOUR <br /> STREAM LIKE <br /> A PRO.
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto text-lg md:text-xl text-gray-500 font-medium leading-relaxed mb-16"
          >
            치지직 방송을 위한 가장 강력하고 세련된 매니지먼트 시스템. <br /> 
            실시간 명령어, 투표, 신청곡, 그리고 통계까지 한 번에 관리하세요.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
            className="flex flex-col md:flex-row justify-center items-center gap-6"
          >
            <button 
              onClick={handleLogin}
              className="group bg-emerald-500 text-black px-12 py-6 rounded-[2.5rem] text-xl font-black shadow-2xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
            >
              <span>Get Started with Chzzk</span>
              <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-12 py-6 rounded-[2.5rem] bg-white/5 border border-white/10 font-black text-xl hover:bg-white/10 transition-all flex items-center gap-4">
              <Globe size={24} /> <span>Live Demo</span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="max-w-7xl mx-auto px-8 py-32 border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Zap size={32} className="text-amber-400" fill="currentColor" />}
            title="Real-time Engine"
            desc="서버와 클라이언트가 0.1초 이내로 동기화됩니다. 지연 없는 실시간 관리를 경험하세요."
          />
          <FeatureCard 
            icon={<Music size={32} className="text-cyan-400" />}
            title="Song Manager"
            desc="유튜브 API를 활용한 완벽한 신청곡 시스템. 도네이션과 연동되어 수익 창출을 돕습니다."
          />
          <FeatureCard 
            icon={<BarChart3 size={32} className="text-emerald-400" />}
            title="Advanced Analytics"
            desc="시청자의 활동과 포인트 획득량을 실시간으로 분석하고 랭킹을 산출합니다."
          />
          <FeatureCard 
            icon={<Users size={32} className="text-purple-400" />}
            title="Participation Sys"
            desc="번거로운 시참 관리는 이제 그만. 봇이 자동으로 대기열을 관리하고 정리합니다."
          />
          <FeatureCard 
            icon={<MessageSquare size={32} className="text-pink-400" />}
            title="AI Chat Greet"
            desc="방문 시점에 따른 정교한 인사 시스템으로 시청자들에게 환영받는 기분을 선사하세요."
          />
          <FeatureCard 
            icon={<Lock size={32} className="text-gray-400" />}
            title="Secure Sessions"
            desc="치지직 공식 API와 보안 토큰을 사용하여 스트리머의 소중한 정보를 완벽히 보호합니다."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-8 py-20 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg">
            <Zap size={18} className="text-black" fill="currentColor" />
          </div>
          <span className="font-black text-xl tracking-tighter">BUZZK PRO</span>
        </div>
        <p className="text-gray-600 font-bold text-sm uppercase tracking-widest">© 2026 Professional Bot System. All rights reserved.</p>
        <div className="flex gap-8 text-gray-500 text-sm font-bold uppercase tracking-widest">
          <a href="#" className="hover:text-white">Privacy</a>
          <a href="#" className="hover:text-white">Terms</a>
          <a href="#" className="hover:text-white">Github</a>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="bg-[#0a0a0a] p-10 rounded-[3rem] border border-white/5 hover:border-emerald-500/30 hover:bg-[#111] transition-all duration-500 group relative overflow-hidden">
      <div className="mb-8 p-4 bg-white/5 rounded-2xl w-fit group-hover:scale-110 group-hover:bg-white/10 transition-all">
        {icon}
      </div>
      <h3 className="text-2xl font-black mb-4 tracking-tight text-white">{title}</h3>
      <p className="text-gray-500 font-medium leading-relaxed">{desc}</p>
      {/* Decorative Gradient */}
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full" />
    </div>
  );
}