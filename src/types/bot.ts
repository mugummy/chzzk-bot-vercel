// chzzk-bot-v2/src/types/bot.ts - Expert Type Definitions

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
  triggers?: string[]; // 복수형 (배열)
  trigger?: string;    // 단수형 (레거시 대응용)
  response: string;
  enabled: boolean;
}

export interface GreetData {
  settings: {
    enabled: boolean;
    type: 1 | 2;
    message: string;
  };
  historyCount: number;
}

export interface BotState {
  isConnected: boolean;
  isReconnecting: boolean;
  currentUser: any | null;
  channelInfo: any | null;
  liveStatus: any | null;
  commands: CommandItem[];
  macros: any[];
  counters: any[];
  votes: any[];
  songs: {
    queue: any[];
    current: any | null;
  };
  participation: {
    queue: any[];
    active: any[];
    isActive: boolean;
    max: number;
    ranking: any[];
  };
  greet: GreetData;
  points: { [userId: string]: any };
  chatHistory: any[];
}