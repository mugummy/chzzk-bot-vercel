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
      ws.send(JSON.stringify({ type: 'connect' }));
    };

    ws.onclose = () => {
      console.log('❌ Disconnected from Bot Server');
      store.setBotStatus(false);
      setTimeout(() => window.location.reload(), 5000);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const { type, payload } = message;

        // [디버깅] 상태 업데이트 로그 (개발자 도구에서 확인 가능)
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
          
          case 'voteStateUpdate':
            store.updateVotes(payload);
            break;
          case 'rouletteStateUpdate':
            store.updateRoulette(payload); // payload: { items, isSpinning, winner }
            break;
          case 'drawStateUpdate':
            store.updateDraw(payload); // payload: { isActive, candidates, ... }
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
