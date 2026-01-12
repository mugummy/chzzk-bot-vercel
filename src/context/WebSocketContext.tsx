'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useSession } from './SessionContext';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'wss://chzzk-bot-server.up.railway.app';

interface WebSocketContextType {
  isConnected: boolean;
  botConnected: boolean;
  voteState: VoteState | null;
  drawState: DrawState | null;
  rouletteState: RouletteState | null;
  send: (data: any) => void;
  on: (type: string, callback: (data: any) => void) => () => void;
}

interface VoteState {
  isActive: boolean;
  status: 'idle' | 'created' | 'running' | 'ended';
  question: string;
  options: Array<{ id: string; text: string }>;
  results: Record<string, number>;
  voterChoices: Array<{ odId: string; odName: string; odKey: string; nickname: string }>;
  durationSeconds: number;
  startTime: number | null;
  remainingTime: number;
}

interface DrawState {
  isActive: boolean;
  keyword: string;
  participants: Array<{ odId: string; odName: string; odKey: string; nickname: string; joinedAt: number }>;
  winners: Array<{ odId: string; odName: string; odKey: string; nickname: string }>;
  previousWinners: Array<{ odId: string; nickname: string; odKey: string }>;
  settings: {
    allowDuplicate: boolean;
    excludePreviousWinners: boolean;
    subscriberOnly: boolean;
    minPoints: number;
  };
}

interface RouletteState {
  items: Array<{ id: string; text: string; weight: number }>;
  isSpinning: boolean;
  lastResult: { id: string; text: string } | null;
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  botConnected: false,
  voteState: null,
  drawState: null,
  rouletteState: null,
  send: () => {},
  on: () => () => {},
});

class WebSocketManager {
  private ws: WebSocket | null = null;
  private userId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private isConnecting = false;

  connect(userId: string) {
    if (this.isConnecting || (this.ws?.readyState === WebSocket.OPEN && this.userId === userId)) {
      return;
    }

    this.userId = userId;
    this.isConnecting = true;

    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        console.log('[WS] Connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.send({ type: 'auth', userId });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notifyListeners(data.type, data);
        } catch (err) {
          console.error('[WS] Failed to parse message:', err);
        }
      };

      this.ws.onclose = () => {
        console.log('[WS] Disconnected');
        this.isConnecting = false;
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('[WS] Error:', error);
        this.isConnecting = false;
      };
    } catch (err) {
      console.error('[WS] Failed to connect:', err);
      this.isConnecting = false;
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts || !this.userId) {
      console.log('[WS] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (this.userId) {
        this.connect(this.userId);
      }
    }, delay);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.userId = null;
    this.reconnectAttempts = 0;
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('[WS] Cannot send, not connected');
    }
  }

  on(type: string, callback: (data: any) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);

    return () => {
      this.listeners.get(type)?.delete(callback);
    };
  }

  private notifyListeners(type: string, data: any) {
    this.listeners.get(type)?.forEach(cb => cb(data));
    this.listeners.get('*')?.forEach(cb => cb(data));
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

const wsManager = new WebSocketManager();

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [botConnected, setBotConnected] = useState(false);
  const [voteState, setVoteState] = useState<VoteState | null>(null);
  const [drawState, setDrawState] = useState<DrawState | null>(null);
  const [rouletteState, setRouletteState] = useState<RouletteState | null>(null);

  useEffect(() => {
    if (!session?.userId) return;

    wsManager.connect(session.userId);

    const unsubAuth = wsManager.on('authResult', (data) => {
      setIsConnected(true);
      setBotConnected(data.botConnected);
    });

    const unsubStatus = wsManager.on('botStatus', (data) => {
      setBotConnected(data.payload?.connected ?? false);
    });

    const unsubVote = wsManager.on('voteUpdate', (data) => {
      setVoteState(data.payload);
    });

    const unsubDraw = wsManager.on('drawUpdate', (data) => {
      setDrawState(data.payload);
    });

    const unsubRoulette = wsManager.on('rouletteUpdate', (data) => {
      setRouletteState(data.payload);
    });

    return () => {
      unsubAuth();
      unsubStatus();
      unsubVote();
      unsubDraw();
      unsubRoulette();
    };
  }, [session?.userId]);

  const send = useCallback((data: any) => {
    wsManager.send(data);
  }, []);

  const on = useCallback((type: string, callback: (data: any) => void) => {
    return wsManager.on(type, callback);
  }, []);

  return (
    <WebSocketContext.Provider value={{
      isConnected,
      botConnected,
      voteState,
      drawState,
      rouletteState,
      send,
      on,
    }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  return useContext(WebSocketContext);
}
