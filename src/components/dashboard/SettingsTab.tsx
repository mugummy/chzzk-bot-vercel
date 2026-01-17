'use client';

import { useEffect, useState, useCallback } from 'react';
import { useBotStore } from '@/lib/store';
import { Settings, Copy, Eye, EyeOff, CheckCircle, Monitor, ExternalLink, Vote, Gift, Disc, RefreshCw, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsTab({ onSend }: { onSend: (msg: any) => void }) {
  const { currentUser, overlay } = useBotStore();
  const [showUrl, setShowUrl] = useState(false);
  const [copied, setCopied] = useState(false);

  // 현재 세션 토큰은 로컬스토리지나 URL에서 가져와야 함 (여기선 currentUser에 있다고 가정하거나 임시 토큰 사용)
  const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('chzzk_session_token') : '';
  const overlayUrl = `https://${window.location.host}/overlay/vote?token=${sessionToken}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(overlayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openOverlayPreview = () => {
    window.open(overlayUrl, '_blank', 'width=1920,height=1080');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 오버레이 URL 섹션 */}
      <div className="bg-white/5 border border-white/5 p-6 md:p-8 rounded-2xl">
        <h3 className="text-xl md:text-2xl font-black mb-6 flex items-center gap-3">
          <Monitor className="text-emerald-500" /> 오버레이 설정
        </h3>

        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-wider">OBS 브라우저 소스 URL</label>
            <div className="flex flex-col md:flex-row gap-2">
              <div className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-gray-300 font-mono text-sm truncate flex items-center justify-between">
                <span className="truncate">{showUrl ? overlayUrl : '••••••••••••••••••••••••••••••••••••'}</span>
                <button onClick={() => setShowUrl(!showUrl)} className="text-gray-500 hover:text-white ml-4 shrink-0">
                  {showUrl ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="flex gap-2">
                <motion.button
                  onClick={copyToClipboard}
                  className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    copied ? 'bg-emerald-500 text-black' : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  {copied ? <CheckCircle size={18} /> : <Copy size={18} />} {copied ? '복사됨' : '복사'}
                </motion.button>
                <motion.button
                  onClick={openOverlayPreview}
                  className="px-4 py-3 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black transition-all"
                  title="새 창에서 미리보기"
                  whileTap={{ scale: 0.95 }}
                >
                  <ExternalLink size={18} />
                </motion.button>
              </div>
            </div>
            <div className="flex items-start gap-2 text-xs text-gray-500 ml-1 bg-white/5 p-3 rounded-lg">
              <Info size={14} className="shrink-0 mt-0.5 text-emerald-500" />
              <span>이 URL을 OBS Studio의 브라우저 소스에 추가하세요. 권장 해상도: <span className="text-emerald-400 font-bold">1920x1080</span></span>
            </div>
          </div>

          {/* 오버레이 컨트롤 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 오버레이 표시 토글 */}
            <div className="bg-black/20 p-5 rounded-xl border border-white/5">
              <p className="font-bold text-white mb-3 flex items-center gap-2">
                <Eye size={16} className="text-emerald-500" /> 오버레이 표시
              </p>
              <div className="flex gap-2">
                <motion.button
                  onClick={() => onSend({ type: 'toggleOverlay', visible: true })}
                  className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                    overlay.isVisible
                      ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30'
                      : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  ON
                </motion.button>
                <motion.button
                  onClick={() => onSend({ type: 'toggleOverlay', visible: false })}
                  className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                    !overlay.isVisible
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                      : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  OFF
                </motion.button>
              </div>
            </div>

            {/* 현재 오버레이 뷰 */}
            <div className="bg-black/20 p-5 rounded-xl border border-white/5">
              <p className="font-bold text-white mb-3 flex items-center gap-2">
                <Monitor size={16} className="text-indigo-500" /> 현재 보기
              </p>
              <div className="flex gap-2">
                <motion.button
                  onClick={() => onSend({ type: 'toggleOverlay', visible: true, view: 'vote' })}
                  className={`flex-1 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                    overlay.currentView === 'vote'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                      : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <Vote size={14} /> 투표
                </motion.button>
                <motion.button
                  onClick={() => onSend({ type: 'toggleOverlay', visible: true, view: 'draw' })}
                  className={`flex-1 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                    overlay.currentView === 'draw'
                      ? 'bg-pink-500/20 text-pink-400 border border-pink-500/50'
                      : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <Gift size={14} /> 추첨
                </motion.button>
                <motion.button
                  onClick={() => onSend({ type: 'toggleOverlay', visible: true, view: 'roulette' })}
                  className={`flex-1 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                    overlay.currentView === 'roulette'
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50'
                      : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <Disc size={14} /> 룰렛
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 사용 가이드 */}
      <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 p-6 md:p-8 rounded-2xl">
        <h3 className="text-xl font-black mb-4 flex items-center gap-3">
          <Info className="text-indigo-400" /> 사용 가이드
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-black/20 p-4 rounded-xl">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-3">
              <Vote className="text-emerald-500" size={20} />
            </div>
            <h4 className="font-bold text-white mb-2">실시간 투표</h4>
            <p className="text-sm text-gray-400">
              시청자가 채팅으로 투표할 수 있습니다. 투표 항목 번호를 채팅에 입력하면 자동 집계됩니다.
            </p>
          </div>

          <div className="bg-black/20 p-4 rounded-xl">
            <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center mb-3">
              <Gift className="text-pink-500" size={20} />
            </div>
            <h4 className="font-bold text-white mb-2">추첨</h4>
            <p className="text-sm text-gray-400">
              채팅 참여자 또는 후원자 중에서 랜덤으로 당첨자를 뽑습니다. 슬롯머신 애니메이션으로 재미있게!
            </p>
          </div>

          <div className="bg-black/20 p-4 rounded-xl">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-3">
              <Disc className="text-indigo-500" size={20} />
            </div>
            <h4 className="font-bold text-white mb-2">룰렛</h4>
            <p className="text-sm text-gray-400">
              룰렛을 돌려서 결과를 정합니다. 벌칙 게임, 메뉴 선택 등 다양하게 활용하세요!
            </p>
          </div>
        </div>
      </div>

      {/* 상태 표시 */}
      <div className="bg-white/5 border border-white/5 p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${overlay.isVisible ? 'bg-emerald-500 animate-pulse' : 'bg-gray-600'}`} />
          <span className="text-sm font-bold text-gray-400">
            오버레이 상태: <span className={overlay.isVisible ? 'text-emerald-400' : 'text-gray-500'}>
              {overlay.isVisible ? '표시 중' : '숨김'}
            </span>
            {overlay.isVisible && overlay.currentView && (
              <span className="text-indigo-400 ml-2">
                ({overlay.currentView === 'vote' ? '투표' : overlay.currentView === 'draw' ? '추첨' : '룰렛'})
              </span>
            )}
          </span>
        </div>
        <motion.button
          onClick={() => onSend({ type: 'requestData' })}
          className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          title="새로고침"
          whileTap={{ scale: 0.9, rotate: 180 }}
        >
          <RefreshCw size={18} />
        </motion.button>
      </div>
    </div>
  );
}
