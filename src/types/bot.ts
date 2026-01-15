// 기존 타입 확장

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
    overlay: {
        backgroundColor: string;
        textColor: string;
        accentColor: string;
        opacity: number;
        scale: number;
    };
}

export interface CommandItem {
    id: string;
    triggers: string[];
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
    currentUser: any;
    channelInfo: any;
    liveStatus: any;
    settings: BotSettings | null;
    commands: CommandItem[];
    counters: any[];
    macros: any[];
    songs: {
        queue: SongItem[];
        current: SongItem | null;
        isPlaying: boolean;
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
    points: { [key: string]: any };
    chatHistory: any[];
    
    // [New Features]
    vote: {
        currentVote: any | null;
    };
    draw: {
        isCollecting: boolean;
        participantCount: number;
        participantsList?: string[]; // [New]
        settings: any | null;
        status: 'idle' | 'rolling' | 'completed';
        winners: any[];
    };
    roulette: {
        items: any[];
    };
    overlay: {
        isVisible: boolean;
        currentView: 'none' | 'vote' | 'draw' | 'roulette';
    };
}