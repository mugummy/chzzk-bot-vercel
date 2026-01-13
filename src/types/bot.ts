// chzzk-bot-v2/src/types/bot.ts - Expert Enterprise Standard

export interface BotSettings {
  chatEnabled: boolean;
  songRequestMode: 'all' | 'cooldown' | 'donation' | 'off';
  songRequestCooldown: number;
  minDonationAmount: number;
  pointsPerChat: number;
  pointsCooldown: number;
  pointsName: string;
  participationCommand: string;
  maxParticipants: number;
}

export interface CommandItem {
  id?: string;
  triggers?: string[];
  trigger?: string;
  response: string;
  enabled: boolean;
}

export interface SongItem {
  videoId: string;
  title: string;
  thumbnail: string;
  requester: string;
  requestedAt: number;
}

export interface BotState {
  isConnected: boolean;
  isReconnecting: boolean;
  currentUser: {
    channelId: string;
    channelName: string;
    channelImageUrl: string;
  } | null;
  channelInfo: any | null;
  liveStatus: any | null;
  settings: BotSettings | null;
  commands: CommandItem[];
  counters: any[];
  macros: any[];
  votes: any[];
  songs: {
    queue: SongItem[];
    current: SongItem | null;
  };
  participation: {
    queue: any[];
    active: any[];
    isActive: boolean;
    max: number;
    ranking: any[];
  };
  greet: {
    settings: any;
    historyCount: number;
  };
  points: { [userId: string]: { nickname: string; points: number; lastMessageTime: number } };
  chatHistory: any[];
}
