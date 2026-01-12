'use client';

import { SessionProvider } from '@/context/SessionContext';
import { WebSocketProvider } from '@/context/WebSocketContext';
import { ReactNode } from 'react';

export default function DashboardClientWrapper({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <WebSocketProvider>
        {children}
      </WebSocketProvider>
    </SessionProvider>
  );
}
