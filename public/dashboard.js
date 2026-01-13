// ============================================
// Chzzk Bot Dashboard - Main JavaScript (REFINED)
// ============================================

let socket = null;
window.socket = null;
let botConnected = false;
let isChatEnabled = true;
let currentUser = null;

// Data
let commands = [];
let macros = [];
let counters = [];
let songQueue = [];
let currentChannelData = null;

const STORAGE_KEY = 'chzzk_bot_channel';
const SESSION_KEY = 'chzzk_session_token';

// ============================================
// Utility Functions
// ============================================
function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/`/g, '&#96;')
        .replace(/\//g, '&#x2F;');
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) return;
    const notification = document.createElement('div');
    notification.className = `notification ${type} show`;
    notification.innerHTML = `<span>${escapeHTML(message)}</span>`;
    container.appendChild(notification);
    setTimeout(() => {
        notification.classList.replace('show', 'hide');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('show');
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('show');
}

// ============================================
// WebSocket Connection
// ============================================
function initWebSocket() {
    const token = localStorage.getItem(SESSION_KEY);
    const wsUrl = getServerWebSocketUrl(); // api-adapter.js에서 제공
    
    console.log('[WS] Connecting to:', wsUrl);
    socket = new WebSocket(wsUrl);
    window.socket = socket;

    socket.onopen = () => {
        console.log('[WS] Connected');
        if (currentUser) {
            socket.send(JSON.stringify({ type: 'connect', data: { channel: currentUser.channelId, token } }));
        }
        socket.send(JSON.stringify({ type: 'requestData', dataType: 'all' }));
    };

    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
            if (window.handleVoteSystemMessage) window.handleVoteSystemMessage(data);
        } catch (e) { console.error('[WS] Error:', e); }
    };

    socket.onclose = () => {
        console.log('[WS] Disconnected, retrying...');
        setTimeout(initWebSocket, 5000);
    };
}

function sendWebSocket(data) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        // 보안 검사: 쓰기 작업은 로그인 필수
        const writeOps = ['update', 'add', 'remove', 'create', 'start', 'stop', 'save', 'set', 'spin', 'control'];
        if (writeOps.some(op => data.type.startsWith(op)) && !currentUser) {
            showNotification('로그인이 필요한 기능입니다.', 'error');
            return;
        }
        socket.send(JSON.stringify(data));
    }
}

function handleWebSocketMessage(data) {
    switch (data.type) {
        case 'connectResult':
            if (data.success) {
                updateBotStatus(true);
                if (data.channelInfo) updateStreamerInfo(data.channelInfo, data.liveStatus);
                showNotification('서버와 연결되었습니다.', 'success');
            }
            break;
        case 'commands':
        case 'commandsUpdate': updateCommands(data.payload || data.data || []); break;
        case 'macros':
        case 'macrosUpdate': updateMacros(data.payload || data.data || []); break;
        case 'counters':
        case 'countersUpdate': updateCounters(data.payload || data.data || []); break;
        case 'settingsUpdate': updateSettings(data.payload || {}); break;
        case 'songStateUpdate': updateSongState(data.payload); break;
        case 'pointsUpdate': updatePointsData(data.payload); break;
        case 'participationStateUpdate': updateParticipationState(data.payload); break;
        case 'error': showNotification(data.message, 'error'); break;
    }
}

// ============================================
// Authentication
// ============================================
async function initAuth() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlSession = urlParams.get('session');
    
    if (urlSession) {
        localStorage.setItem(SESSION_KEY, urlSession);
        window.history.replaceState({}, document.title, window.location.pathname);
        await new Promise(r => setTimeout(r, 1000)); // 서버 DB 저장 대기
    }
    
    const token = localStorage.getItem(SESSION_KEY);
    if (!token) return;

    try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
            const data = await res.json();
            if (data.authenticated) {
                currentUser = data.user;
                updateUserProfile(currentUser);
            }
        }
    } catch (e) { console.error('[Auth] Error:', e); }
}

function updateUserProfile(user) {
    const nameEl = document.getElementById('sidebar-name');
    const avatarEl = document.getElementById('sidebar-avatar');
    if (nameEl) nameEl.textContent = user.channelName;
    if (avatarEl && user.channelImageUrl) avatarEl.style.backgroundImage = `url(${user.channelImageUrl})`;
}

// ============================================
// Settings & Commands Logic
// ============================================
function updateCommands(list) {
    commands = list;
    const container = document.getElementById('commands-list');
    if (!container) return;
    container.innerHTML = list.length ? list.map((cmd, idx) => `
        <div class="item-card card">
            <div class="item-info">
                <span class="item-trigger">${escapeHTML(cmd.triggers?.join(', ') || cmd.trigger)}</span>
                <span class="item-response">${escapeHTML(cmd.response)}</span>
            </div>
            <div class="item-actions">
                <button class="btn-icon" onclick="deleteCommand('${cmd.trigger}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('') : '<div class="empty-state">명령어가 없습니다.</div>';
}

function addCommand() {
    const trigger = document.getElementById('new-command-trigger')?.value.trim();
    const response = document.getElementById('new-command-response')?.value.trim();
    if (!trigger || !response) return showNotification('내용을 입력하세요.', 'error');
    sendWebSocket({ type: 'addCommand', data: { trigger, response } });
    hideModal('add-command-modal');
}

function deleteCommand(trigger) {
    if (confirm('삭제하시겠습니까?')) sendWebSocket({ type: 'removeCommand', data: { trigger } });
}

function saveSongSettings() {
    const mode = document.querySelector('input[name="songRequestMode"]:checked')?.value;
    const cooldown = parseInt(document.getElementById('song-cooldown').value);
    const amount = parseInt(document.getElementById('song-min-donation').value);
    sendWebSocket({ type: 'updateSettings', data: { songRequestMode: mode, songRequestCooldown: cooldown, minDonationAmount: amount } });
    showNotification('설정이 저장되었습니다.', 'success');
}

function updateSettings(s) {
    if (s.chatEnabled !== undefined) updateBotStatusUI(s.chatEnabled);
    if (s.songRequestMode) {
        const rad = document.querySelector(`input[name="songRequestMode"][value="${s.songRequestMode}"]`);
        if (rad) rad.checked = true;
        updateSongSettingsUI(s.songRequestMode);
    }
    if (s.songRequestCooldown) document.getElementById('song-cooldown').value = s.songRequestCooldown;
}

function updateSongSettingsUI(mode) {
    const group = document.getElementById('song-cooldown').closest('.setting-item');
    if (group) mode === 'off' ? group.classList.add('disabled-group') : group.classList.remove('disabled-group');
}

function updateBotStatus(connected) {
    botConnected = connected;
    updateBotStatusUI(isChatEnabled);
}

function updateBotStatusUI(enabled) {
    isChatEnabled = enabled;
    const indicator = document.getElementById('bot-status-indicator');
    const text = document.getElementById('bot-status-text');
    if (indicator) indicator.className = `status-indicator ${botConnected ? (enabled ? 'online' : 'idle') : 'offline'}`;
    if (text) text.textContent = botConnected ? (enabled ? '봇 작동중' : '봇 대기중') : '봇 미연결';
}

// ============================================
// Init
// ============================================
async function initDashboard() {
    await initAuth();
    initWebSocket();
    
    // Mouse Effect
    document.addEventListener('mousemove', (e) => {
        document.querySelectorAll('.card').forEach(card => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
            card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
        });
    });
}

document.addEventListener('DOMContentLoaded', initDashboard);

// Global Exposure
window.addCommand = addCommand;
window.deleteCommand = deleteCommand;
window.saveSongSettings = saveSongSettings;
window.handleLogout = async () => {
    localStorage.removeItem(SESSION_KEY);
    await fetch('/auth/logout', { method: 'POST' });
    window.location.href = '/';
};
window.showModal = showModal;
window.hideModal = hideModal;