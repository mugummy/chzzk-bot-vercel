'use client';

import { useState } from 'react';
import { useBotStore } from '@/lib/store';
import { useWebSocket } from '@/context/WebSocketContext';
import { Save, RefreshCw, Power } from 'lucide-react';
import Toggle from '@/components/ui/Toggle';

export default function SettingsPage() {
  const socket = useWebSocket();
  const { settings, isConnected } = useBotStore();
  
  // 로컬 상태 (설정 변경 시 즉각 반응을 위해)
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSend = (msg: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(msg));
    }
  };

  const handleSave = () => {
    if (localSettings) {
      handleSend({ type: 'updateSettings', data: localSettings });
      alert('설정이 저장되었습니다.');
    }
  };

  if (!settings) return <div className="p-10 text-white">설정 로딩 중...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-10">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-white">시스템 설정</h1>
          <p className="text-gray-500 font-bold mt-2">System Configuration</p>
        </div>
        <div className={`px-4 py-2 rounded-full font-bold flex items-center gap-2 ${isConnected ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </header>

      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-10 space-y-8">
        <h3 className="text-2xl font-black text-white flex items-center gap-3"><Power size={24} className="text-emerald-500"/> 기본 기능 제어</h3>
        
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white/5 p-6 rounded-2xl">
            <div>
              <h4 className="font-bold text-white text-lg">챗봇 응답 활성화</h4>
              <p className="text-sm text-gray-500">봇이 채팅에 반응하도록 합니다.</p>
            </div>
            <Toggle 
              checked={localSettings?.chatEnabled ?? true} 
              onChange={(val) => setLocalSettings(prev => prev ? ({ ...prev, chatEnabled: val }) : null)} 
            />
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex justify-end gap-4">
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-white/5 text-gray-400 rounded-xl font-bold hover:bg-white/10 flex items-center gap-2"><RefreshCw size={18}/> 새로고침</button>
          <button onClick={handleSave} className="px-8 py-3 bg-emerald-500 text-black rounded-xl font-black hover:bg-emerald-400 flex items-center gap-2"><Save size={18}/> 설정 저장</button>
        </div>
      </div>
    </div>
  );
}