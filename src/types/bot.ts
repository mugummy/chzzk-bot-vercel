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
        theme: string;
        accentColor: string;
        opacity: number;
        scale: number;
        backgroundColor?: string;
        textColor?: string;
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

// [Fix] DrawState 인터페이스 명시
export interface DrawState {
    isCollecting: boolean; // 이 부분이 누락되었던 것으로 추정
    participantCount: number;
    participantsList?: string[];
    settings: any | null;
    status: 'idle' | 'rolling' | 'completed';
    winners: any[];
}

export interface VoteState {
    currentVote: any | null;
    remainingSeconds?: number;
}

export interface RouletteState {
    items: any[];
    selected?: any;
}

export interface OverlayState {
    isVisible: boolean;
    currentView: 'none' | 'vote' | 'draw' | 'roulette';
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
    
    // [Fix] 명시된 인터페이스 사용
    vote: VoteState;
    draw: DrawState;
    roulette: RouletteState;
    overlay: OverlayState;
}
