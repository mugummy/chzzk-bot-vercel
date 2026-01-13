import { create } from 'zustand';
import { BotState, CommandItem } from '@/types/bot';

/**
 * Global Store: 대시보드와 오버레이의 모든 상태를 하나로 통합 관리합니다.
 * 100% 완전 교체된 최종 버전입니다.
 */
interface BotStore {
  isConnected: boolean;
  isReconnecting: boolean;
  currentUser: any | null;
  channelInfo: any | null;
  liveStatus: any | null;
  commands: CommandItem[];
  counters: any[];
  macros: any[];
  votes: any[];
  songs: { queue: any[]; current: any | null };
  participation: { queue: any[]; active: any[]; isActive: boolean; max: number; ranking: any[] };
  greet: { settings: any; historyCount: number };
  points: { [userId: string]: any };
  chatHistory: any[];

  setAuth: (user: any) => void;
  setBotStatus: (connected: boolean, reconnecting?: boolean) => void;
  setStreamInfo: (info: any, live: any) => void;
  updateSettings: (settings: any) => void;
  updateCommands: (cmds: any[]) => void;
  updateCounters: (counters: any[]) => void;
  updateMacros: (macros: any[]) => void;
  updateVotes: (payload: any) => void;
  updateSongs: (payload: any) => void;
  updateParticipation: (payload: any) => void;
  updateParticipationRanking: (ranking: any[]) => void;
  updateGreet: (payload: any) => void;
  addChat: (chat: any) => void;
}

export const useBotStore = create<BotStore>((set) => ({
  isConnected: false,
  isReconnecting: false,
  currentUser: null,
  channelInfo: null,
  liveStatus: null,
  commands: [],
  counters: [],
  macros: [],
  votes: [],
  songs: { queue: [], current: null },
  participation: { queue: [], active: [], isActive: false, max: 10, ranking: [] },
  greet: { settings: { enabled: true, type: 1, message: "반갑습니다!" }, historyCount: 0 },
  points: {},
  chatHistory: [],

  setAuth: (user) => set({ currentUser: user }),
  setBotStatus: (connected, reconnecting = false) => set({ isConnected: connected, isReconnecting: reconnecting }),
  setStreamInfo: (info, live) => set({ channelInfo: info, liveStatus: live }),
  updateSettings: (settings) => set((state) => ({ ...state, ...settings })),
  updateCommands: (cmds) => set({ commands: cmds }),
  updateCounters: (counters) => set({ counters }),
  updateMacros: (macros) => set({ macros }),
  updateVotes: (payload) => set({ votes: payload.currentVote ? [payload.currentVote] : [] }),
  updateSongs: (payload) => set({ songs: { queue: payload.queue, current: payload.currentSong } }),
  updateParticipation: (payload) => set((state) => ({ 
    participation: { ...state.participation, queue: payload.queue, active: payload.participants, isActive: payload.isParticipationActive, max: payload.maxParticipants }
  })),
  updateParticipationRanking: (ranking) => set((state) => ({ 
    participation: { ...state.participation, ranking }
  })),
  updateGreet: (payload) => set({ greet: { settings: payload.settings, historyCount: payload.historyCount } }),
  addChat: (chat) => set((state) => ({ 
    chatHistory: [chat, ...state.chatHistory].slice(0, 50) 
  })),
}));