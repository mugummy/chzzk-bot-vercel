// 데이터 무결성을 위한 전역 타입 정의 (TypeScript)

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
  triggers: string[];
  response: string;
  enabled: boolean;
}

export interface GreetData {
  settings: {
    enabled: boolean;
    type: 1 | 2; // 1: 최초, 2: 매일
    message: string;
  };
  historyCount: number;
}

export interface BotState {
  isConnected: boolean;
  channelInfo: {
    channelId: string;
    channelName: string;
    channelImageUrl: string;
    followerCount: number;
  } | null;
  liveStatus: {
    liveTitle: string;
    status: 'OPEN' | 'CLOSE';
    concurrentUserCount: number;
    category: string;
  } | null;
  commands: CommandItem[];
  macros: any[];
  counters: any[];
  songs: {
    queue: any[];
    current: any | null;
  };
  participation: {
    queue: any[];
    active: any[];
    isActive: boolean;
    max: number;
  };
  greet: GreetData;
  points: { [userId: string]: any };
}
