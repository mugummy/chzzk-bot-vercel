'use client';

import { useState, useEffect } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';

interface Settings {
  prefix: string;
  points_enabled: boolean;
  points_per_chat: number;
  points_cooldown: number;
  points_name: string;
  song_request_enabled: boolean;
  song_request_mode: string;
  song_request_cooldown: number;
  song_request_min_donation: number;
}

interface User {
  id: string;
  channel_id: string;
  channel_name: string;
}

export default function SettingsPage() {
  const { isConnected, botConnected, send, on } = useWebSocket();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [botStarting, setBotStarting] = useState(false);
  const [botStopping, setBotStopping] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // 봇 상태 변경 리스너
  useEffect(() => {
    const unsubStarting = on('botStarting', () => {
      setBotStarting(true);
    });

    const unsubStopping = on('botStopping', () => {
      setBotStopping(true);
    });

    const unsubStatus = on('botStatus', () => {
      setBotStarting(false);
      setBotStopping(false);
    });

    const unsubError = on('botError', (data: any) => {
      setBotStarting(false);
      setBotStopping(false);
      alert(`봇 오류: ${data.payload?.message || '알 수 없는 오류'}`);
    });

    return () => {
      unsubStarting();
      unsubStopping();
      unsubStatus();
      unsubError();
    };
  }, [on]);

  const fetchData = async () => {
    try {
      const [settingsRes, userRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/user'),
      ]);
      const settingsData = await settingsRes.json();
      const userData = await userRes.json();
      setSettings(settingsData);
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);

    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      alert('설정이 저장되었습니다.');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('설정 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleStartBot = () => {
    send({ type: 'startBot' });
    setBotStarting(true);
  };

  const handleStopBot = () => {
    send({ type: 'stopBot' });
    setBotStopping(true);
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">설정</h1>
        <p className="text-gray-400">봇 설정을 관리합니다</p>
      </div>

      {/* Bot Control */}
      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
              botConnected ? 'bg-emerald-500/20' : 'bg-gray-700/50'
            }`}>
              <svg className={`w-7 h-7 ${botConnected ? 'text-emerald-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">봇 상태</h2>
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  botConnected ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'
                }`} />
                <span className={botConnected ? 'text-emerald-400' : 'text-gray-400'}>
                  {botConnected ? '활성화됨' : '비활성화됨'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            {!botConnected ? (
              <button
                onClick={handleStartBot}
                disabled={botStarting || !isConnected}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center gap-2"
              >
                {botStarting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    시작 중...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    봇 시작
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleStopBot}
                disabled={botStopping}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center gap-2"
              >
                {botStopping ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    중지 중...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                    봇 중지
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {!isConnected && (
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-400 text-sm">
              서버와 연결 중입니다. 잠시만 기다려주세요...
            </p>
          </div>
        )}
      </div>

      {/* Channel Info */}
      {user?.channel_name && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">채널 정보</h2>
          <div className="flex items-center gap-4 p-4 bg-gray-900 rounded-lg">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
              {user.channel_name.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-white">{user.channel_name}</p>
              <p className="text-sm text-gray-500">치지직 OAuth로 연동됨</p>
            </div>
          </div>
        </div>
      )}

      {/* Bot Settings */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">기본 설정</h2>
        <div className="space-y-4">
          {/* Command Prefix */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              명령어 접두사
            </label>
            <input
              type="text"
              value={settings.prefix}
              onChange={(e) =>
                setSettings({ ...settings, prefix: e.target.value })
              }
              className="w-32 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              명령어 앞에 붙는 문자 (예: !명령어)
            </p>
          </div>
        </div>
      </div>

      {/* Points Settings */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">포인트 시스템</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">포인트 시스템 활성화</p>
              <p className="text-sm text-gray-400">채팅 시 포인트를 지급합니다</p>
            </div>
            <button
              onClick={() =>
                setSettings({
                  ...settings,
                  points_enabled: !settings.points_enabled,
                })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                settings.points_enabled ? 'bg-purple-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  settings.points_enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                채팅당 포인트
              </label>
              <input
                type="number"
                value={settings.points_per_chat}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    points_per_chat: parseInt(e.target.value) || 0,
                  })
                }
                min="0"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                쿨다운 (초)
              </label>
              <input
                type="number"
                value={settings.points_cooldown}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    points_cooldown: parseInt(e.target.value) || 0,
                  })
                }
                min="0"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              포인트 이름
            </label>
            <input
              type="text"
              value={settings.points_name}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  points_name: e.target.value,
                })
              }
              placeholder="포인트"
              className="w-32 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Song Request Settings */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">노래 신청</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">노래 신청 활성화</p>
              <p className="text-sm text-gray-400">시청자가 노래를 신청할 수 있습니다</p>
            </div>
            <button
              onClick={() =>
                setSettings({
                  ...settings,
                  song_request_enabled: !settings.song_request_enabled,
                })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                settings.song_request_enabled ? 'bg-purple-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  settings.song_request_enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              신청 모드
            </label>
            <select
              value={settings.song_request_mode}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  song_request_mode: e.target.value,
                })
              }
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
            >
              <option value="cooldown">쿨다운</option>
              <option value="donation">후원 전용</option>
              <option value="free">제한 없음</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                쿨다운 (초)
              </label>
              <input
                type="number"
                value={settings.song_request_cooldown}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    song_request_cooldown: parseInt(e.target.value) || 0,
                  })
                }
                min="0"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                최소 후원 금액
              </label>
              <input
                type="number"
                value={settings.song_request_min_donation}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    song_request_min_donation: parseInt(e.target.value) || 0,
                  })
                }
                min="0"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              저장 중...
            </>
          ) : (
            '설정 저장'
          )}
        </button>
      </div>
    </div>
  );
}
