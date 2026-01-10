'use client';

import { useState, useEffect } from 'react';

interface Command {
  id: string;
  trigger: string;
  response: string;
  aliases: string[];
  cooldown: number;
  user_level: string;
  enabled: boolean;
  use_count: number;
}

export default function CommandsPage() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCommand, setEditingCommand] = useState<Command | null>(null);
  const [formData, setFormData] = useState({
    trigger: '',
    response: '',
    aliases: '',
    cooldown: 5,
    user_level: 'everyone',
  });

  useEffect(() => {
    fetchCommands();
  }, []);

  const fetchCommands = async () => {
    try {
      const res = await fetch('/api/commands');
      const data = await res.json();
      setCommands(data);
    } catch (error) {
      console.error('Failed to fetch commands:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      aliases: formData.aliases
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean),
    };

    try {
      if (editingCommand) {
        await fetch(`/api/commands/${editingCommand.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/commands', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      setShowModal(false);
      setEditingCommand(null);
      setFormData({
        trigger: '',
        response: '',
        aliases: '',
        cooldown: 5,
        user_level: 'everyone',
      });
      fetchCommands();
    } catch (error) {
      console.error('Failed to save command:', error);
    }
  };

  const handleEdit = (command: Command) => {
    setEditingCommand(command);
    setFormData({
      trigger: command.trigger,
      response: command.response,
      aliases: command.aliases.join(', '),
      cooldown: command.cooldown,
      user_level: command.user_level,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말로 이 명령어를 삭제하시겠습니까?')) return;

    try {
      await fetch(`/api/commands/${id}`, { method: 'DELETE' });
      fetchCommands();
    } catch (error) {
      console.error('Failed to delete command:', error);
    }
  };

  const handleToggle = async (command: Command) => {
    try {
      await fetch(`/api/commands/${command.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !command.enabled }),
      });
      fetchCommands();
    } catch (error) {
      console.error('Failed to toggle command:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">명령어 관리</h1>
          <p className="text-gray-400">커스텀 채팅 명령어를 관리합니다</p>
        </div>
        <button
          onClick={() => {
            setEditingCommand(null);
            setFormData({
              trigger: '',
              response: '',
              aliases: '',
              cooldown: 5,
              user_level: 'everyone',
            });
            setShowModal(true);
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          명령어 추가
        </button>
      </div>

      {/* Commands List */}
      {commands.length === 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">💬</div>
          <h3 className="text-lg font-semibold text-white mb-2">
            아직 명령어가 없습니다
          </h3>
          <p className="text-gray-400 mb-4">
            첫 번째 명령어를 만들어보세요!
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition"
          >
            명령어 만들기
          </button>
        </div>
      ) : (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  트리거
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  응답
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  사용 횟수
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {commands.map((command) => (
                <tr key={command.id} className="hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-purple-400 font-mono">
                      {command.trigger}
                    </span>
                    {command.aliases.length > 0 && (
                      <span className="ml-2 text-xs text-gray-500">
                        +{command.aliases.length} 별칭
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-300 truncate block max-w-md">
                      {command.response}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                    {command.use_count}회
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggle(command)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        command.enabled
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {command.enabled ? '활성' : '비활성'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleEdit(command)}
                      className="text-gray-400 hover:text-white mr-3"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(command.id)}
                      className="text-gray-400 hover:text-red-400"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-lg mx-4 p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingCommand ? '명령어 수정' : '새 명령어'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  트리거 *
                </label>
                <input
                  type="text"
                  value={formData.trigger}
                  onChange={(e) =>
                    setFormData({ ...formData, trigger: e.target.value })
                  }
                  placeholder="!hello"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  응답 *
                </label>
                <textarea
                  value={formData.response}
                  onChange={(e) =>
                    setFormData({ ...formData, response: e.target.value })
                  }
                  placeholder="안녕하세요, {user}님!"
                  rows={3}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none resize-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {'{user}'}, {'{channel}'}, {'{count}'} 등 변수 사용 가능
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  별칭 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  value={formData.aliases}
                  onChange={(e) =>
                    setFormData({ ...formData, aliases: e.target.value })
                  }
                  placeholder="!hi, !hey"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    쿨다운 (초)
                  </label>
                  <input
                    type="number"
                    value={formData.cooldown}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cooldown: parseInt(e.target.value) || 0,
                      })
                    }
                    min="0"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    사용 권한
                  </label>
                  <select
                    value={formData.user_level}
                    onChange={(e) =>
                      setFormData({ ...formData, user_level: e.target.value })
                    }
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="everyone">모든 시청자</option>
                    <option value="subscriber">구독자</option>
                    <option value="moderator">매니저</option>
                    <option value="broadcaster">스트리머</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCommand(null);
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition"
                >
                  {editingCommand ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
