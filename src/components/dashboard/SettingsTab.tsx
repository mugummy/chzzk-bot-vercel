'use client';

import { useEffect, useState, useCallback } from 'react';
import { useBotStore } from '@/lib/store';
import { Settings, Copy, Eye, EyeOff, CheckCircle } from 'lucide-react';

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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white/5 border border-white/5 p-8 rounded-[2rem]">
        <h3 className="text-2xl font-black mb-6 flex items-center gap-3"><Settings className="text-gray-400" /> 오버레이 설정</h3>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 ml-1">오버레이 URL (OBS 브라우저 소스)</label>
            <div className="flex gap-2">
              <div className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-gray-300 font-mono truncate flex items-center justify-between">
                <span>{showUrl ? overlayUrl : '••••••••••••••••••••••••••••••••••••••••••••••••••'}</span>
                <button onClick={() => setShowUrl(!showUrl)} className="text-gray-500 hover:text-white ml-4">
                  {showUrl ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <button onClick={copyToClipboard} className={`px-6 rounded-xl font-bold transition-all flex items-center gap-2 ${copied ? 'bg-emerald-500 text-black' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
                {copied ? <CheckCircle size={18} /> : <Copy size={18} />} {copied ? '복사됨' : '복사'}
              </button>
            </div>
            <p className="text-xs text-gray-500 ml-1">※ 이 주소를 OBS 브라우저 소스에 추가하세요. (해상도 1920x1080 권장)</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                 <p className="font-bold text-gray-300 mb-2">오버레이 표시</p>
                 <div className="flex gap-2">
                     <button onClick={() => onSend({ type: 'toggleOverlay', visible: true })} className={`flex-1 py-2 rounded-lg text-sm font-bold ${overlay.isVisible ? 'bg-emerald-500 text-black' : 'bg-white/5 text-gray-500'}`}>ON</button>
                     <button onClick={() => onSend({ type: 'toggleOverlay', visible: false })} className={`flex-1 py-2 rounded-lg text-sm font-bold ${!overlay.isVisible ? 'bg-red-500 text-white' : 'bg-white/5 text-gray-500'}`}>OFF</button>
                 </div>
             </div>
             {/* 추후 스타일 설정 추가 가능 */}
          </div>
        </div>
      </div>
    </div>
  );
}
