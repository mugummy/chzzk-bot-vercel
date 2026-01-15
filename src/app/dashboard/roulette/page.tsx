'use client';

import { useWebSocket } from '@/context/WebSocketContext';
import VotePanel from '@/components/dashboard/VotePanel';

export default function RoulettePage() {
  const socket = useWebSocket();

  const handleSend = (msg: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(msg));
    } else {
      console.warn('Socket not connected');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="mb-8">
        <h1 className="text-4xl font-black text-white">룰렛 시스템</h1>
        <p className="text-gray-500 font-bold mt-2">Roulette & Draw System</p>
      </header>
      
      {/* 투표 패널 컴포넌트 재사용 (룰렛 기능 포함) */}
      <VotePanel onSend={handleSend} />
    </div>
  );
}