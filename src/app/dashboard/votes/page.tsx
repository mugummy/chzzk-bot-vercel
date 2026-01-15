'use client';

import { useWebSocket } from '@/context/WebSocketContext';
import VotePanel from '@/components/dashboard/VotePanel';

/**
 * VotesPage: 최신 VotePanel 컴포넌트를 사용하여 투표 기능을 제공합니다.
 */
export default function VotesPage() {
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
        <h1 className="text-4xl font-black text-white">투표 시스템</h1>
        <p className="text-gray-500 font-bold mt-2">Real-time Voting & Analysis</p>
      </header>
      
      {/* 통합 투표 패널 컴포넌트 호출 */}
      <VotePanel onSend={handleSend} />
    </div>
  );
}