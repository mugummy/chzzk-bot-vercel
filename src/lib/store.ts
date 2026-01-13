import { create } from 'zustand';
import { BotState, CommandItem } from '@/types/bot';

interface BotStore extends BotState {
  currentUser: any;
  setAuth: (user: any) => void;
  setBotStatus: (connected: boolean, chatEnabled: boolean) => void;
  setStreamInfo: (info: any, live: any) => void;
  updateSettings: (settings: any) => void;
  updateCommands: (cmds: CommandItem[]) => void;
  updateSongs: (payload: any) => void;
  updateParticipation: (payload: any) => void;
  updateGreet: (payload: any) => void;
  addChat: (chat: any) => void;
  chatHistory: any[];
}

export const useBotStore = create<BotStore>((set) => ({
  isConnected: false,
  currentUser: null,
  channelInfo: null,
  liveStatus: null,
  commands: [],
  macros: [],
  counters: [],
  songs: { queue: [], current: null },
  participation: { queue: [], active: [], isActive: false, max: 10 },
  greet: { settings: { enabled: true, type: 1, message: "반갑습니다!" }, historyCount: 0 },
  points: {},
  chatHistory: [],

  setAuth: (user) => set({ currentUser: user }),
  setBotStatus: (connected, chatEnabled) => set({ isConnected: connected }),
  setStreamInfo: (info, live) => set({ channelInfo: info, liveStatus: live }),
  updateSettings: (settings) => set((state) => ({ ...state, ...settings })),
  updateCommands: (cmds) => set({ commands: cmds }),
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