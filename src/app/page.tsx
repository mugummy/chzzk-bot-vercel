'use client';

import { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  ShieldCheck, Zap, Music, MessageSquare, BarChart3, Users, 
  ChevronRight, Globe, Lock, Cpu, Star, ArrowRight, MousePointer2, Sparkles 
} from 'lucide-react';

/**
 * gummybot Premium Landing Page
 * 최첨단 리액트 애니메이션과 고해상도 디자인이 적용된 최종 버전입니다.
 */
export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollYProgress } = useScroll();
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    const params = new URLSearchParams(window.location.search);
    if (params.get('error')) {
      alert('로그인 세션이 만료되었거나 오류가 발생했습니다.');
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = () => {
    localStorage.removeItem('chzzk_session_token');
    window.location.href = 'https://web-production-19eef.up.railway.app/auth/login';
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans selection:bg-pink-500/30 overflow-x-hidden">
      {/* --- High-End Background Effects --- */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-500/10 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[30%] left-[40%] w-[30%] h-[30%] bg-blue-500/5 blur-[120px] rounded-full" />
      </div>

      {/* --- Global Navigation --- */}
      <nav className={`fixed top-0 inset-x-0 z-[100] transition-all duration-700 border-b ${isScrolled ? 'bg-black/80 backdrop-blur-2xl border-white/10 py-4' : 'bg-transparent border-transparent py-10'}`}>
        <div className="max-w-7xl mx-auto px-10 flex justify-between items-center">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 via-purple-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(236,72,153,0.3)] group-hover:rotate-[360deg] transition-transform duration-1000">
              <Zap size={28} className="text-white" fill="currentColor" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-black tracking-tighter uppercase leading-none italic">gummybot</h1>
              <span className="text-[10px] font-bold text-emerald-500 tracking-[0.3em] uppercase">Enterprise</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-12 text-xs font-black uppercase tracking-[0.2em] text-gray-400">
            <a href="#features" className="hover:text-emerald-400 transition-colors">Technology</a>
            <a href="#details" className="hover:text-pink-400 transition-colors">Ecosystem</a>
            <button onClick={handleLogin} className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-emerald-600 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000"></div>
              <div className="relative bg-white text-black px-10 py-3.5 rounded-full font-black hover:bg-emerald-500 transition-all active:scale-95">Start Free</div>
            </button>
          </div>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <section className="relative pt-64 pb-40 px-10 text-center z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-3 px-6 py-2.5 bg-white/5 border border-white/10 rounded-full text-white text-[10px] font-black uppercase tracking-[0.4em] mb-12 shadow-2xl backdrop-blur-md"
        >
          <Sparkles size={14} className="text-pink-500" /> <span>Next Generation AI Chat Engine</span>
        </motion.div>
        
        <motion.h2 
          initial={{ opacity: 0, y: 40 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-8xl md:text-[11rem] font-black tracking-tighter mb-12 leading-[0.8] text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/20"
        >
          SWEET & <br /> POWERFUL.
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.4 }}
          className="max-w-3xl mx-auto text-xl md:text-2xl text-gray-400 font-medium leading-relaxed mb-20 tracking-tight"
        >
          <span className="text-white font-bold">gummybot</span>은 치지직 스트리머를 위한 가장 세련된 도구입니다. <br />
          복잡한 설정 없이, 한 번의 클릭으로 방송의 모든 것을 자동화하세요.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.6 }}
          className="flex flex-col md:flex-row justify-center items-center gap-8"
        >
          <button onClick={handleLogin} className="group relative bg-emerald-500 text-black px-16 py-8 rounded-[3rem] text-2xl font-black shadow-[0_20px_50px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-5">
            <span>Connect Chzzk</span>
            <ChevronRight size={32} className="group-hover:translate-x-2 transition-transform duration-500" />
          </button>
          <button onClick={() => window.location.href='/demo'} className="px-16 py-8 rounded-[3rem] bg-white/5 border border-white/10 font-black text-2xl hover:bg-white/10 transition-all flex items-center gap-5 backdrop-blur-xl">
            <Globe size={28} /> <span>Live Demo</span>
          </button>
        </motion.div>
      </section>

      {/* --- Feature Grid (The Core Technology) --- */}
      <section id="features" className="max-w-7xl mx-auto px-10 py-40 border-t border-white/5 relative">
        <div className="mb-24 text-left">
          <h3 className="text-emerald-500 font-black text-sm uppercase tracking-[0.5em] mb-4">Core Technology</h3>
          <h2 className="text-6xl font-black tracking-tighter">Everything you need <br /> to grow your channel.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          <FeatureCard 
            icon={<Cpu size={36} className="text-emerald-400" />}
            title="Real-time Node Engine"
            desc="WebSocket 기술을 기반으로 대시보드와 봇이 밀리초 단위로 동기화됩니다. 지연 시간 제로를 경험하세요."
            delay={0.1}
          />
          <FeatureCard 
            icon={<Music size={36} className="text-pink-400" />}
            title="Smart Jukebox"
            desc="후원 메시지에서 유튜브 링크를 자동 추출하여 재생합니다. 썸네일과 곡 정보를 대시보드에서 실시간으로 확인하세요."
            delay={0.2}
          />
          <FeatureCard 
            icon={<BarChart3 size={36} className="text-cyan-400" />}
            title="Deep Analytics"
            desc="단순한 봇을 넘어 시청자의 활동 데이터를 분석합니다. 참여왕 랭킹과 포인트 시스템으로 충성도를 높이세요."
            delay={0.3}
          />
          <FeatureCard 
            icon={<ShieldCheck size={36} className="text-blue-400" />}
            title="Safe Persistence"
            desc="모든 데이터는 Supabase 클라우드에 원자적으로 저장됩니다. 서버가 꺼져도 당신의 설정은 영원히 안전합니다."
            delay={0.4}
          />
          <FeatureCard 
            icon={<MessageSquare size={36} className="text-purple-400" />}
            title="AI Engagement"
            desc="사용자별 방문 주기에 따른 지능형 인사 시스템. 시청자 한 명 한 명에게 특별한 경험을 제공합니다."
            delay={0.5}
          />
          <FeatureCard 
            icon={<Lock size={36} className="text-amber-400" />}
            title="OAuth2 Security"
            desc="치지직 공식 인증 시스템을 사용하여 스트리머의 계정 정보를 철저히 보호합니다. 안심하고 사용하세요."
            delay={0.6}
          />
        </div>
      </section>

      {/* --- System Ecosystem Section --- */}
      <section id="details" className="bg-white/5 py-40">
        <div className="max-w-7xl mx-auto px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <span className="text-pink-500 font-black text-sm uppercase tracking-[0.5em] mb-6 block">Seamless Workflow</span>
              <h2 className="text-7xl font-black tracking-tighter mb-10 leading-none">당신은 방송에만 <br /> 집중하세요.</h2>
              <div className="space-y-8">
                <StepItem num="01" title="치지직 계정 연동" desc="복잡한 API 키 입력 없이 네이버 아이디로 간편하게 시작합니다." />
                <StepItem num="02" title="실시간 대시보드 설정" desc="반응형 웹 UI를 통해 스마트폰에서도 봇의 모든 기능을 제어합니다." />
                <StepItem num="03" title="자동화 엔진 가동" desc="설정 즉시 봇이 채팅창에 입장하여 당신의 방송을 돕기 시작합니다." />
              </div>
            </motion.div>
            <div className="relative">
              <div className="aspect-square bg-gradient-to-tr from-emerald-500/20 to-pink-500/20 rounded-[4rem] border border-white/10 flex items-center justify-center shadow-3xl overflow-hidden group">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="p-20 opacity-20 group-hover:opacity-40 transition-opacity duration-1000">
                  <Cpu size={400} />
                </motion.div>
                <div className="absolute inset-0 bg-black/40 backdrop-blur-3xl flex flex-col items-center justify-center p-12 text-center">
                  <Star size={64} className="text-pink-500 mb-6 animate-bounce" fill="currentColor" />
                  <h4 className="text-3xl font-black mb-4 tracking-tight">Enterprise Stability</h4>
                  <p className="text-gray-400 font-bold leading-relaxed italic">"수천 명의 시청자가 동시에 채팅을 쳐도 <br /> gummybot의 엔진은 멈추지 않습니다."</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="max-w-7xl mx-auto px-10 py-32 flex flex-col md:flex-row justify-between items-center gap-16 border-t border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
            <Zap size={20} className="text-black" fill="currentColor" />
          </div>
          <span className="font-black text-2xl tracking-tighter">gummybot</span>
        </div>
        <div className="flex flex-col items-center md:items-end gap-4">
          <p className="text-gray-600 font-bold text-xs uppercase tracking-widest leading-none">© 2026 Gummy Ecosystem. Hand-crafted for streamers.</p>
          <div className="flex gap-10 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="https://github.com" className="hover:text-white transition-colors">Github</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc, delay }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="bg-[#0a0a0a] p-12 rounded-[3.5rem] border border-white/5 hover:border-emerald-500/30 hover:bg-[#111] transition-all duration-500 group relative overflow-hidden shadow-2xl"
    >
      <div className="mb-10 p-5 bg-white/5 rounded-2xl w-fit group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500 shadow-xl">{icon}</div>
      <h3 className="text-2xl font-black mb-5 tracking-tight text-white group-hover:text-emerald-400 transition-colors">{title}</h3>
      <p className="text-gray-500 font-medium leading-relaxed group-hover:text-gray-300 transition-colors">{desc}</p>
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
}

function StepItem({ num, title, desc }: any) {
  return (
    <div className="flex gap-8 group">
      <span className="text-4xl font-black text-white/10 group-hover:text-emerald-500/40 transition-colors duration-500 leading-none pt-1">{num}</span>
      <div>
        <h4 className="text-xl font-black mb-2 tracking-tight group-hover:translate-x-2 transition-transform duration-500">{title}</h4>
        <p className="text-gray-500 text-sm font-medium leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}