// 봇 인스턴스 관리자 - 각 사용자별 봇 인스턴스를 관리
import { ChzzkClient, ChzzkChat, ChatEvent, DonationEvent } from 'chzzk';
import { createServiceClient } from '@/lib/supabase/server';

interface BotConfig {
  userId: string;
  channelId: string;
  nidAuth?: string;
  nidSession?: string;
}

interface Command {
  id: string;
  trigger: string;
  response: string;
  aliases: string[];
  cooldown: number;
  user_level: string;
  enabled: boolean;
}

interface BotSettings {
  bot_enabled: boolean;
  command_prefix: string;
  points_enabled: boolean;
  points_per_chat: number;
  points_interval: number;
}

export class BotInstance {
  private client: ChzzkClient;
  private chat: ChzzkChat | null = null;
  private userId: string;
  private channelId: string;
  private commands: Map<string, Command> = new Map();
  private triggerCache: Set<string> = new Set();
  private settings: BotSettings | null = null;
  private lastPointsTime: Map<string, number> = new Map();
  private cooldowns: Map<string, number> = new Map();

  constructor(config: BotConfig) {
    this.userId = config.userId;
    this.channelId = config.channelId;
    this.client = new ChzzkClient({
      nidAuth: config.nidAuth,
      nidSession: config.nidSession,
    });
  }

  async init(): Promise<void> {
    const supabase = createServiceClient();

    // 설정 로드
    const { data: settings } = await supabase
      .from('bot_settings')
      .select('*')
      .eq('user_id', this.userId)
      .single();

    this.settings = settings;

    // 명령어 로드
    const { data: commands } = await supabase
      .from('commands')
      .select('*')
      .eq('user_id', this.userId)
      .eq('enabled', true);

    if (commands) {
      this.commands.clear();
      this.triggerCache.clear();

      for (const cmd of commands) {
        this.commands.set(cmd.trigger, cmd);
        this.triggerCache.add(cmd.trigger);

        // 별칭도 캐시에 추가
        if (cmd.aliases) {
          for (const alias of cmd.aliases) {
            this.triggerCache.add(alias);
          }
        }
      }
    }
  }

  async connect(): Promise<void> {
    if (!this.settings?.bot_enabled) {
      throw new Error('Bot is disabled');
    }

    const liveDetail = await this.client.live.detail(this.channelId);
    if (!liveDetail?.chatChannelId) {
      throw new Error('Channel is not live');
    }

    this.chat = this.client.chat({
      channelId: this.channelId,
      chatChannelId: liveDetail.chatChannelId,
    });

    this.setupListeners();
    await this.chat.connect();
  }

  private setupListeners(): void {
    if (!this.chat) return;

    this.chat.on('chat', async (chat: ChatEvent) => {
      await this.handleChat(chat);
    });

    this.chat.on('donation', async (donation: DonationEvent) => {
      await this.handleDonation(donation);
    });
  }

  private async handleChat(chat: ChatEvent): Promise<void> {
    const msg = chat.message?.trim();
    if (!msg || chat.hidden) return;

    // 포인트 지급
    if (this.settings?.points_enabled) {
      await this.awardPoints(chat);
    }

    // 명령어 체크
    const firstWord = msg.split(' ')[0];
    if (this.triggerCache.has(firstWord)) {
      await this.executeCommand(chat, firstWord);
    }
  }

  private async awardPoints(chat: ChatEvent): Promise<void> {
    if (!this.settings?.points_enabled) return;

    const viewerId = chat.profile.userIdHash;
    const now = Date.now();
    const lastTime = this.lastPointsTime.get(viewerId) || 0;
    const interval = (this.settings.points_interval || 30) * 1000;

    if (now - lastTime < interval) return;

    this.lastPointsTime.set(viewerId, now);

    const supabase = createServiceClient();

    // 포인트 업데이트 또는 생성
    const { data: existing } = await supabase
      .from('viewer_points')
      .select('id, points')
      .eq('user_id', this.userId)
      .eq('viewer_id', viewerId)
      .single();

    if (existing) {
      await supabase
        .from('viewer_points')
        .update({
          points: existing.points + (this.settings.points_per_chat || 1),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await supabase.from('viewer_points').insert({
        user_id: this.userId,
        viewer_id: viewerId,
        viewer_name: chat.profile.nickname,
        points: this.settings.points_per_chat || 1,
      });
    }
  }

  private async executeCommand(chat: ChatEvent, trigger: string): Promise<void> {
    // 명령어 찾기 (트리거 또는 별칭으로)
    let command = this.commands.get(trigger);

    if (!command) {
      // 별칭에서 찾기
      for (const [_, cmd] of this.commands) {
        if (cmd.aliases?.includes(trigger)) {
          command = cmd;
          break;
        }
      }
    }

    if (!command || !command.enabled) return;

    // 쿨다운 체크
    const cooldownKey = `${command.id}_${chat.profile.userIdHash}`;
    const now = Date.now();
    const lastUse = this.cooldowns.get(cooldownKey) || 0;

    if (now - lastUse < (command.cooldown || 0) * 1000) return;

    this.cooldowns.set(cooldownKey, now);

    // 응답 처리
    let response = command.response;

    // 변수 치환
    response = response.replace(/{user}/g, chat.profile.nickname);
    response = response.replace(/{channel}/g, this.channelId);

    // 사용 횟수 업데이트
    const supabase = createServiceClient();
    await supabase
      .from('commands')
      .update({ use_count: (command as any).use_count + 1 })
      .eq('id', command.id);

    // 채팅 전송
    this.chat?.sendChat(response);
  }

  private async handleDonation(donation: DonationEvent): Promise<void> {
    // 후원 처리 로직
    console.log(`[Bot] Donation received: ${donation.message}`);
  }

  async disconnect(): Promise<void> {
    if (this.chat) {
      await this.chat.disconnect();
      this.chat = null;
    }
  }

  isConnected(): boolean {
    return this.chat?.connected ?? false;
  }

  sendChat(message: string): void {
    this.chat?.sendChat(message);
  }
}

// 봇 인스턴스 매니저 - 모든 사용자의 봇 인스턴스를 관리
class BotManager {
  private instances: Map<string, BotInstance> = new Map();

  async startBot(userId: string, channelId: string): Promise<BotInstance> {
    // 기존 인스턴스가 있으면 종료
    const existing = this.instances.get(userId);
    if (existing) {
      await existing.disconnect();
    }

    const bot = new BotInstance({
      userId,
      channelId,
    });

    await bot.init();
    await bot.connect();

    this.instances.set(userId, bot);
    return bot;
  }

  async stopBot(userId: string): Promise<void> {
    const bot = this.instances.get(userId);
    if (bot) {
      await bot.disconnect();
      this.instances.delete(userId);
    }
  }

  getBot(userId: string): BotInstance | undefined {
    return this.instances.get(userId);
  }

  isRunning(userId: string): boolean {
    const bot = this.instances.get(userId);
    return bot?.isConnected() ?? false;
  }
}

export const botManager = new BotManager();
