'use client';

import { useEffect, useState, useCallback } from 'react';
import { useBotStore } from '@/lib/store';
import { Settings, Copy, Eye, EyeOff, CheckCircle, Palette, Monitor, Layers, Box } from 'lucide-react';

const THEMES = [
    { id: 'basic', label: 'Basic', desc: '깔끔한 기본 스타일' },
    { id: 'neon', label: 'Neon', desc: '화려한 네온 글로우' },
    { id: 'glass', label: 'Glass', desc: '세련된 유리 질감' },
    { id: 'pixel', label: 'Pixel', desc: '레트로 픽셀 아트' }
];

const COLORS = [
    { id: '#10b981', label: 'Emerald' },
    { id: '#ec4899', label: 'Pink' },
    { id: '#3b82f6', label: 'Blue' },
    { id: '#8b5cf6', label: 'Purple' },
    { id: '#eab308', label: 'Yellow' },
    { id: '#f97316', label: 'Orange' },
    { id: '#ef4444', label: 'Red' },
    { id: '#ffffff', label: 'White' }
];

export default function SettingsTab({ onSend }: { onSend: (msg: any) => void }) {
  const { overlay, settings } = useBotStore();
  const [showUrl, setShowUrl] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // 로컬 상태 (디바운싱 없이 즉시 반영하려면 store 상태 사용, 여기선 편의상 로컬+useEffect 조합 가능하나 바로 전송)
  const currentSettings = settings?.overlay || {
      theme: 'basic',
      accentColor: '#10b981',
      opacity: 0.9,
      scale: 1.0,
      backgroundColor: '#000000'
  };

  const updateOverlaySettings = (key: string, value: any) => {
      onSend({ 
          type: 'updateSettings', 
          data: { 
              overlay: { ...currentSettings, [key]: value } 
          } 
      });
  };

  const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('chzzk_session_token') : '';
  const overlayUrl = `https://${window.location.host}/overlay/vote?token=${sessionToken}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(overlayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. 오버레이 연결 & 제어 */}
      <div className="bg-white/5 border border-white/5 p-8 rounded-[2rem]">
        <h3 className="text-2xl font-black mb-6 flex items-center gap-3"><Monitor className="text-gray-400" /> 연결 및 제어</h3>
        
        <div className="space-y-6">
          <div className="flex gap-4 items-end">
              <div className="flex-1 space-y-2">
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
              </div>
              
              <div className="bg-black/20 p-2 rounded-xl border border-white/5 flex gap-2 h-fit">
                 <button onClick={() => onSend({ type: 'toggleOverlay', visible: true })} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${overlay.isVisible ? 'bg-emerald-500 text-black shadow-lg' : 'bg-white/5 text-gray-500 hover:text-white'}`}>ON</button>
                 <button onClick={() => onSend({ type: 'toggleOverlay', visible: false })} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${!overlay.isVisible ? 'bg-red-500 text-white shadow-lg' : 'bg-white/5 text-gray-500 hover:text-white'}`}>OFF</button>
              </div>
          </div>
        </div>
      </div>

      {/* 2. 스타일 커스터마이징 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* 테마 & 색상 */}
          <div className="bg-white/5 border border-white/5 p-8 rounded-[2rem]">
              <h3 className="text-xl font-black mb-6 flex items-center gap-3"><Palette className="text-pink-500" /> 디자인 테마</h3>
              
              <div className="space-y-6">
                  {/* 테마 선택 */}
                  <div>
                      <label className="text-xs font-bold text-gray-400 mb-3 block uppercase tracking-widest">Theme Style</label>
                      <div className="grid grid-cols-2 gap-3">
                          {THEMES.map(t => (
                              <button 
                                key={t.id} 
                                onClick={() => updateOverlaySettings('theme', t.id)}
                                className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${currentSettings.theme === t.id ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10 bg-black/20 hover:bg-black/40'}`}
                              >
                                  <span className={`block font-black text-lg ${currentSettings.theme === t.id ? 'text-emerald-400' : 'text-white'}`}>{t.label}</span>
                                  <span className="text-xs text-gray-500">{t.desc}</span>
                                  {currentSettings.theme === t.id && <div className="absolute top-0 right-0 p-2 text-emerald-500"><CheckCircle size={16} /></div>}
                              </button>
                          ))}
                      </div>
                  </div>

                  {/* 색상 선택 */}
                  <div>
                      <label className="text-xs font-bold text-gray-400 mb-3 block uppercase tracking-widest">Accent Color</label>
                      <div className="flex flex-wrap gap-3">
                          {COLORS.map(c => (
                              <button 
                                key={c.id} 
                                onClick={() => updateOverlaySettings('accentColor', c.id)}
                                className={`w-10 h-10 rounded-full border-2 transition-all ${currentSettings.accentColor === c.id ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'}`}
                                style={{ backgroundColor: c.id }}
                                title={c.label}
                              />
                          ))}
                          <input 
                            type="color" 
                            value={currentSettings.accentColor} 
                            onChange={(e) => updateOverlaySettings('accentColor', e.target.value)}
                            className="w-10 h-10 rounded-full bg-transparent cursor-pointer overflow-hidden border-0 p-0" 
                          />
                      </div>
                  </div>
              </div>
          </div>

          {/* 크기 & 투명도 */}
          <div className="bg-white/5 border border-white/5 p-8 rounded-[2rem]">
              <h3 className="text-xl font-black mb-6 flex items-center gap-3"><Layers className="text-blue-500" /> 레이아웃 설정</h3>
              
              <div className="space-y-8">
                  {/* 투명도 슬라이더 */}
                  <div>
                      <div className="flex justify-between mb-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Box Opacity</label>
                          <span className="text-sm font-black text-white">{Math.round(currentSettings.opacity * 100)}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="1" step="0.05" 
                        value={currentSettings.opacity} 
                        onChange={(e) => updateOverlaySettings('opacity', parseFloat(e.target.value))} 
                        className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-2">상자 배경의 투명도를 조절합니다. (0% = 투명, 100% = 불투명)</p>
                  </div>

                  {/* 크기(Scale) 슬라이더 */}
                  <div>
                      <div className="flex justify-between mb-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Overlay Scale</label>
                          <span className="text-sm font-black text-white">x{currentSettings.scale}</span>
                      </div>
                      <input 
                        type="range" min="0.5" max="2.0" step="0.1" 
                        value={currentSettings.scale} 
                        onChange={(e) => updateOverlaySettings('scale', parseFloat(e.target.value))} 
                        className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-2">OBS 화면 크기에 맞춰 오버레이 전체 크기를 조절하세요.</p>
                  </div>

                  {/* 미리보기 (Box) */}
                  <div className="mt-8 p-6 rounded-2xl bg-[url('https://transparent-textures.googlecode.com/gh/images/bg.png')] bg-repeat border border-white/10 text-center">
                      <p className="text-xs text-gray-500 mb-4">Preview on Transparent Background</p>
                      <div 
                        className="mx-auto p-6 rounded-xl transition-all duration-300"
                        style={{ 
                            backgroundColor: `rgba(0,0,0, ${currentSettings.opacity})`,
                            border: currentSettings.theme === 'neon' ? `2px solid ${currentSettings.accentColor}` : '1px solid rgba(255,255,255,0.1)',
                            boxShadow: currentSettings.theme === 'neon' ? `0 0 20px ${currentSettings.accentColor}40` : 'none',
                            transform: `scale(${currentSettings.scale})`,
                            color: settings?.overlay?.textColor || '#fff'
                        }}
                      >
                          <h4 className="text-2xl font-black" style={{ color: currentSettings.accentColor }}>Preview Title</h4>
                          <p className="font-bold opacity-80">Content goes here...</p>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}
