import { create } from 'zustand';
import { BotState, CommandItem } from '@/types/bot';

/**
 * Global Store: 대시보드와 오버레이의 모든 상태를 하나로 통합 관리합니다.
 * 모든 업데이트 로직이 포함된 최종 버전입니다.
 */
interface BotStore {
  isConnected: boolean;
  currentUser: any | null;
  channelInfo: any | null;
  liveStatus: any | null;
  commands: CommandItem[];
  counters: any[];
  macros: any[];
  votes: any[];
  songs: { queue: any[]; current: any | null };
  participation: { queue: any[]; active: any[]; isActive: boolean; max: number };
  greet: { settings: any; historyCount: number };
  chatHistory: any[];

  setAuth: (user: any) => void;
  setBotStatus: (connected: boolean) => void;
  setStreamInfo: (info: any, live: any) => void;
  updateSettings: (settings: any) => void;
  updateCommands: (cmds: any[]) => void;
  updateCounters: (counters: any[]) => void;
  updateMacros: (macros: any[]) => void;
  updateVotes: (payload: any) => void;
  updateSongs: (payload: any) => void;
  updateParticipation: (payload: any) => void;
  updateGreet: (payload: any) => void;
  addChat: (chat: any) => void;
}

export const useBotStore = create<BotStore>((set) => ({
  isConnected: false,
  currentUser: null,
  channelInfo: null,
  liveStatus: null,
  commands: [],
  counters: [],
  macros: [],
  votes: [],
  songs: { queue: [], current: null },
  participation: { queue: [], active: [], isActive: false, max: 10 },
  greet: { settings: { enabled: true, type: 1, message: "반갑습니다!" }, historyCount: 0 },
  chatHistory: [],

  setAuth: (user) => set({ currentUser: user }),
  setBotStatus: (connected) => set({ isConnected: connected }),
  setStreamInfo: (info, live) => set({ channelInfo: info, liveStatus: live }),
  updateSettings: (settings) => set((state) => ({ ...state, ...settings })),
  updateCommands: (cmds) => set({ commands: cmds }),
  updateCounters: (counters) => set({ counters }),
  updateMacros: (macros) => set({ macros }),
  updateVotes: (payload) => set({ votes: payload.currentVote ? [payload.currentVote] : [] }),
  updateSongs: (payload) => set({ songs: { queue: payload.queue, current: payload.currentSong } }),
  updateParticipation: (payload) => set({ 
    participation: { 
      queue: payload.queue, 
      active: payload.participants, 
      isActive: payload.isParticipationActive, 
      max: payload.maxParticipants 
    }
  }),
  updateGreet: (payload) => set({ greet: { settings: payload.settings, historyCount: payload.historyCount } }),
  addChat: (chat) => set((state) => ({ 
    chatHistory: [chat, ...state.chatHistory].slice(0, 50) 
  })),
}));
