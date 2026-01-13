import { create } from 'zustand';

interface BotState {
  isConnected: boolean;
  isChatEnabled: boolean;
  currentUser: any | null;
  channelInfo: any | null;
  liveStatus: any | null;
  commands: any[];
  macros: any[];
  counters: any[];
  songs: { queue: any[]; current: any | null };
  participation: { queue: any[]; active: any[]; isActive: boolean; max: number };
  greet: { settings: any; historyCount: number };
  
  // Actions
  setAuth: (user: any) => void;
  setBotStatus: (connected: boolean, chatEnabled: boolean) => void;
  setStreamInfo: (info: any, live: any) => void;
  updateCommands: (cmds: any[]) => void;
  updateMacros: (macros: any[]) => void;
  updateCounters: (counters: any[]) => void;
  updateSongs: (payload: any) => void;
  updateParticipation: (payload: any) => void;
  updateGreet: (payload: any) => void;
}

export const useBotStore = create<BotState>((set) => ({
  isConnected: false,
  isChatEnabled: true,
  currentUser: null,
  channelInfo: null,
  liveStatus: null,
  commands: [],
  macros: [],
  counters: [],
  songs: { queue: [], current: null },
  participation: { queue: [], active: [], isActive: false, max: 10 },
  greet: { settings: null, historyCount: 0 },

  setAuth: (user) => set({ currentUser: user }),
  setBotStatus: (connected, chatEnabled) => set({ isConnected: connected, isChatEnabled: chatEnabled }),
  setStreamInfo: (info, live) => set({ channelInfo: info, liveStatus: live }),
  updateCommands: (cmds) => set({ commands: cmds }),
  updateMacros: (macros) => set({ macros: macros }),
  updateCounters: (counters) => set({ counters: counters }),
  updateSongs: (payload) => set({ songs: { queue: payload.queue, current: payload.currentSong } }),
  updateParticipation: (payload) => set({ participation: { 
    queue: payload.queue, 
    active: payload.participants, 
    isActive: payload.isParticipationActive, 
    max: payload.maxParticipants 
  }}),
  updateGreet: (payload) => set({ greet: { settings: payload.settings, historyCount: payload.historyCount } }),
}));
