'use client';

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useBotStore, BotStore } from '@/lib/store';
import { useSearchParams } from 'next/navigation';

const WebSocketContext = createContext<WebSocket | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<WebSocket | null>(null);
  const searchParams = useSearchParams();
  const store = useBotStore() as BotStore;

  useEffect(() => {
    const session = searchParams.get('session');
    if (!session) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';
    const ws = new WebSocket(`${wsUrl}?session=${session}`);

    ws.onopen = () => {
      console.log('✅ Connected to Bot Server');
      store.setBotStatus(true);
      // [핵심] 연결 즉시 초기 데이터 요청
      ws.send(JSON.stringify({ type: 'connect' }));
    };

    ws.onclose = () => {
      console.log('❌ Disconnected from Bot Server');
      store.setBotStatus(false);
      // 재연결 시도 (페이지 리로드 X)
      setTimeout(() => {
        // 간단한 재연결 트리거 (실제 프로덕션에선 더 복잡한 로직 필요할 수 있음)
        console.log('🔄 Reconnecting...');
      }, 3000);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const { type, payload } = message;

        // [디버깅] 데이터 흐름 확인
        if (type.includes('StateUpdate')) {
            console.log(`[WS] ${type}:`, payload);
        }

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
          
          // [핵심] 상태 동기화
          case 'voteStateUpdate':
            store.updateVote(payload);
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