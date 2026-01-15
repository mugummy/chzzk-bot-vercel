'use client';

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useBotStore, BotStore } from '@/lib/store';
import { useSearchParams } from 'next/navigation';

const WebSocketContext = createContext<WebSocket | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<WebSocket | null>(null);
  const searchParams = useSearchParams();
  const store = useBotStore() as BotStore; // Store 접근

  useEffect(() => {
    const session = searchParams.get('session');
    if (!session) return;

    // 개발/배포 환경에 따른 주소 설정
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';
    const ws = new WebSocket(`${wsUrl}?session=${session}`);

    ws.onopen = () => {
      console.log('✅ Connected to Bot Server');
      store.setBotStatus(true);
      ws.send(JSON.stringify({ type: 'connect' }));
    };

    ws.onclose = () => {
      console.log('❌ Disconnected from Bot Server');
      store.setBotStatus(false);
      // 재연결 로직 (간단 구현)
      setTimeout(() => window.location.reload(), 5000);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const { type, payload } = message;

        // [핵심] 서버 신호를 스토어 액션에 연결
        switch (type) {
          case 'connectResult':
            store.setStreamInfo(payload.channelInfo, payload.liveStatus);
            break;
          case 'settingsUpdate':
            store.updateSettings(payload);
            break;
          case 'commandsUpdate':
            store.updateCommands(payload);
            break;
          case 'countersUpdate':
            store.updateCounters(payload);
            break;
          case 'macrosUpdate':
            store.updateMacros(payload);
            break;
          
          // [수정] 투표, 룰렛, 추첨, 노래, 참여 상태 동기화 추가
          case 'voteStateUpdate':
            store.updateVotes(payload);
            break;
          case 'rouletteStateUpdate':
            store.updateRoulette(payload);
            break;
          case 'drawStateUpdate':
            store.updateDraw(payload);
            break;
          case 'songStateUpdate':
            store.updateSongs(payload);
            break;
          case 'participationStateUpdate':
            store.updateParticipation(payload);
            break;
          case 'participationRankingUpdate':
            store.updateParticipationRanking(payload);
            break;
          case 'greetStateUpdate':
            store.updateGreet(payload);
            break;
          
          case 'newChat':
            store.addChat(payload);
            break;
          case 'chatHistoryLoad':
            store.setChatHistory(payload);
            break;
        }
      } catch (error) {
        console.error('WS Message Error:', error);
      }
    };

    socketRef.current = ws;

    return () => {
      ws.close();
    };
  }, [searchParams]);

  return (
    <WebSocketContext.Provider value={socketRef.current}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  return useContext(WebSocketContext);
}