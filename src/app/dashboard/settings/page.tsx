'use client';

import { useState, useEffect } from 'react';

interface Settings {
  bot_enabled: boolean;
  command_prefix: string;
  points_enabled: boolean;
  points_per_chat: number;
  points_interval: number;
  song_request_enabled: boolean;
  max_song_queue: number;
  vote_enabled: boolean;
}

interface User {
  id: string;
  channel_id: string;
  channel_name: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [channelId, setChannelId] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

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
      setChannelId(userData.channel_id || '');
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

  const handleChannelConnect = async () => {
    if (!channelId.trim()) {
      alert('채널 ID를 입력해주세요.');
      return;
    }

    try {
      await fetch('/api/user/channel', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel_id: channelId }),
      });
      alert('채널이 연동되었습니다.');
      fetchData();
    } catch (error) {
      console.error('Failed to connect channel:', error);
      alert('채널 연동에 실패했습니다.');
    }
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

      {/* Channel Connection */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">채널 연동</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              치지직 채널 ID
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                placeholder="채널 ID를 입력하세요"
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
              <button
                onClick={handleChannelConnect}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition"
              >
                연동
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              치지직 채널 URL에서 확인할 수 있습니다 (예: chzzk.naver.com/채널ID)
            </p>
          </div>
          {user?.channel_name && (
            <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-3">
              <p className="text-green-400 text-sm">
                현재 연동된 채널: <strong>{user.channel_name}</strong>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bot Settings */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">봇 설정</h2>
        <div className="space-y-4">
          {/* Bot Enable Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">봇 활성화</p>
              <p className="text-sm text-gray-400">봇의 전체 기능을 켜거나 끕니다</p>
            </div>
            <button
              onClick={() =>
                setSettings({ ...settings, bot_enabled: !settings.bot_enabled })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                settings.bot_enabled ? 'bg-purple-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  settings.bot_enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Command Prefix */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              명령어 접두사
            </label>
            <input
              type="text"
              value={settings.command_prefix}
              onChange={(e) =>
                setSettings({ ...settings, command_prefix: e.target.value })
              }
              className="w-32 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
            />
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
                지급 간격 (초)
              </label>
              <input
                type="number"
                value={settings.points_interval}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    points_interval: parseInt(e.target.value) || 0,
                  })
                }
                min="0"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
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
              최대 대기열 수
            </label>
            <input
              type="number"
              value={settings.max_song_queue}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  max_song_queue: parseInt(e.target.value) || 0,
                })
              }
              min="1"
              className="w-32 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
            />
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
