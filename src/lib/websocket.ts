'use client';

// WebSocket 서버 URL
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'wss://chzzk-bot-server.up.railway.app';

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

        // 인증 메시지 전송
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

  off(type: string, callback: (data: any) => void) {
    this.listeners.get(type)?.delete(callback);
  }

  private notifyListeners(type: string, data: any) {
    // 특정 타입 리스너 호출
    this.listeners.get(type)?.forEach(cb => cb(data));
    // 전체 메시지 리스너 호출
    this.listeners.get('*')?.forEach(cb => cb(data));
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// 싱글톤 인스턴스
export const wsManager = new WebSocketManager();

// React Hook
import { useEffect, useState, useCallback } from 'react';

export function useWebSocket(userId: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const [botConnected, setBotConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    wsManager.connect(userId);

    const unsubAuth = wsManager.on('authResult', (data) => {
      setIsConnected(true);
      setBotConnected(data.botConnected);
    });

    const unsubStatus = wsManager.on('botStatus', (data) => {
      setBotConnected(data.payload?.connected ?? false);
    });

    return () => {
      unsubAuth();
      unsubStatus();
    };
  }, [userId]);

  const send = useCallback((data: any) => {
    wsManager.send(data);
  }, []);

  const on = useCallback((type: string, callback: (data: any) => void) => {
    return wsManager.on(type, callback);
  }, []);

  return { isConnected, botConnected, send, on };
}

export function useWebSocketEvent<T = any>(type: string, callback: (data: T) => void) {
  useEffect(() => {
    return wsManager.on(type, callback);
  }, [type, callback]);
}
