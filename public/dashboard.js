// chzzk-bot-v2/public/dashboard.js - High-End Production Edition

let socket = null;
let botConnected = false;
let isChatEnabled = true;
let currentUser = null;
const SESSION_KEY = 'chzzk_session_token';

// ============================================
// Enhanced UI Utilities
// ============================================
const ui = {
    escape: (s) => !s ? '' : String(s).replace(/[&<>"'`\/]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;', '`': '&#96;', '/': '&#x2F;' }[m])),
    
    notify: (msg, type = 'info') => {
        const c = document.getElementById('notification-container');
        if (!c) return;
        const n = document.createElement('div');
        n.className = `notification ${type} show`;
        n.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> <span>${msg}</span>`;
        c.appendChild(n);
        setTimeout(() => { n.classList.replace('show', 'hide'); setTimeout(() => n.remove(), 300); }, 4000);
    },

    setLoading: (btnId, isLoading) => {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        if (isLoading) {
            btn.dataset.originalHtml = btn.innerHTML;
            btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> 처리 중...`;
            btn.disabled = true;
        } else {
            btn.innerHTML = btn.dataset.originalHtml || btn.innerHTML;
            btn.disabled = false;
        }
    },

    modal: (id, show = true) => {
        const m = document.getElementById(id);
        if (m) {
            show ? m.classList.add('show') : m.classList.remove('show');
            if (show) m.querySelector('input')?.focus();
        }
    }
};

// ============================================
// Data Synchronization
// ============================================
async function initAuth() {
    const params = new URLSearchParams(window.location.search);
    const session = params.get('session');
    if (session) {
        localStorage.setItem(SESSION_KEY, session);
        window.history.replaceState({}, document.title, window.location.pathname);
        await new Promise(r => setTimeout(r, 1000));
    }
    const token = localStorage.getItem(SESSION_KEY);
    if (!token) return (window.location.href = '/');

    try {
        const res = await fetch('/api/auth/session', { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        if (data.authenticated) {
            currentUser = data.user;
            document.getElementById('sidebar-name').textContent = currentUser.channelName;
            if (currentUser.channelImageUrl) {
                document.getElementById('sidebar-avatar').style.backgroundImage = `url(${currentUser.channelImageUrl})`;
                document.getElementById('header-avatar').style.backgroundImage = `url(${currentUser.channelImageUrl})`;
            }
            document.getElementById('header-username').textContent = currentUser.channelName;
            document.getElementById('header-profile').style.display = 'flex';
            document.getElementById('sidebar-profile').style.display = 'flex';
        } else window.location.href = '/';
    } catch (e) { window.location.href = '/'; }
}

function initWebSocket() {
    const token = localStorage.getItem(SESSION_KEY);
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    socket = new WebSocket(`${protocol}//${window.location.host}/?token=${token}`);
    window.socket = socket;

    socket.onopen = () => {
        console.log('[WS] Connection Established');
        sendWebSocket({ type: 'connect' });
        sendWebSocket({ type: 'requestData' });
    };

    socket.onmessage = (e) => {
        try {
            const data = JSON.parse(e.data);
            handleServerMessage(data);
            if (window.handleVoteSystemMessage) window.handleVoteSystemMessage(data);
        } catch (err) {}
    };
    
    socket.onclose = () => {
        console.warn('[WS] Lost connection, reconnecting...');
        setTimeout(initWebSocket, 3000);
    };
}

function sendWebSocket(data) {
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(data));
}

function handleServerMessage(data) {
    switch (data.type) {
        case 'connectResult': 
            botConnected = data.success;
            updateBotStatusUI(botConnected, true);
            if(data.channelInfo) updateStreamerInfo(data.channelInfo);
            break;
        case 'settingsUpdate': syncSettings(data.payload); break;
        case 'overlaySettingsUpdate': syncOverlay(data.payload); break;
        case 'commandsUpdate': renderList('commands-list', data.payload, 'deleteCommand', i => `<b>${ui.escape(i.triggers[0])}</b><span>${ui.escape(i.response)}</span>`); break;
        case 'macrosUpdate': renderList('macros-list', data.payload, 'deleteMacro', i => `<b>${i.interval}분 간격</b><span>${ui.escape(i.message)}</span>`); break;
        case 'countersUpdate': renderList('counters-list', data.payload, 'deleteCounter', i => `<b>${ui.escape(i.trigger)}</b><span>현재: ${i.state?.totalCount || 0}회</span>`); break;
        case 'songStateUpdate': updateSongUI(data.payload); break;
        case 'participationStateUpdate': updateParticipationUI(data.payload); break;
        case 'newChat': addChatLine(data.payload); break;
        case 'error': ui.notify(data.message, 'error'); break;
    }
}

// ============================================
// Dynamic Renderers
// ============================================
function renderList(id, list, deleteFn, htmlFn) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = list.length ? list.map(item => `
        <div class="item-card card">
            <div class="item-info">${htmlFn(item)}</div>
            <div class="item-actions">
                <button class="btn-icon btn-danger" onclick="window.${deleteFn}('${item.id || item.trigger}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>`).join('') : '<div class="empty-state">등록된 데이터가 없습니다.</div>';
}

function updateSongUI(state) {
    const list = document.getElementById('song-queue-list');
    if (list) list.innerHTML = state.queue.length ? state.queue.map(s => `
        <div class="queue-item">
            <i class="fas fa-music"></i>
            <div class="queue-info">
                <span class="q-title">${ui.escape(s.title)}</span>
                <span class="q-req">신청: ${ui.escape(s.requester)}</span>
            </div>
        </div>`).join('') : '<div class="empty-state">대기열이 비어있습니다.</div>';
    
    const cur = document.getElementById('current-song');
    if (cur) cur.innerHTML = state.currentSong ? 
        `<div class="active-song"><i class="fas fa-play-circle"></i> ${ui.escape(state.currentSong.title)}</div>` : 
        '재생 중인 곡이 없습니다.';
}

function updateParticipationUI(state) {
    document.getElementById('waiting-count').textContent = state.queue.length;
    document.getElementById('active-count').textContent = state.participants.length;
    
    const waitList = document.getElementById('waiting-queue');
    if (waitList) waitList.innerHTML = state.queue.length ? state.queue.map(p => `
        <div class="participant-item">
            <span>${ui.escape(p.nickname)}</span>
            <button class="btn-sm btn-primary" onclick="window.approveParticipant('${p.userIdHash}')">승인</button>
        </div>`).join('') : '<div class="empty-state">대기자 없음</div>';

    const activeList = document.getElementById('active-participants');
    if (activeList) activeList.innerHTML = state.participants.map(p => `
        <div class="participant-item">
            <i class="fas fa-user-check"></i>
            <span>${ui.escape(p.nickname)}</span>
        </div>`).join('');
}

function addChatLine(chat) {
    const box = document.getElementById('chat-messages');
    if (!box) return;
    if (box.querySelector('.chat-empty')) box.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'chat-line';
    div.innerHTML = `<span class="c-name" style="color:${chat.profile.color || '#00ff94'}">${ui.escape(chat.profile.nickname)}</span> <span class="c-msg">${ui.escape(chat.message)}</span>`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
    if (box.children.length > 50) box.removeChild(box.firstChild);
}

// ============================================
// Actions
// ============================================
window.addCommand = () => {
    const t = document.getElementById('new-command-trigger').value.trim();
    const r = document.getElementById('new-command-response').value.trim();
    if (!t || !r) return ui.notify('모든 필드를 채워주세요.', 'warning');
    sendWebSocket({ type: 'addCommand', data: { trigger: t, response: r } });
    ui.modal('add-command-modal', false);
    document.getElementById('new-command-trigger').value = '';
    document.getElementById('new-command-response').value = '';
};

window.deleteCommand = (t) => confirm('이 명령어를 삭제할까요?') && sendWebSocket({ type: 'removeCommand', data: { trigger: t } });

window.addMacro = () => {
    const i = document.getElementById('new-macro-interval').value;
    const m = document.getElementById('new-macro-message').value.trim();
    if (!m) return ui.notify('메시지를 입력하세요.', 'warning');
    sendWebSocket({ type: 'addMacro', data: { interval: parseInt(i), message: m } });
    ui.modal('add-macro-modal', false);
};

window.deleteMacro = (id) => confirm('이 매크로를 삭제할까요?') && sendWebSocket({ type: 'removeMacro', data: { id } });

window.addCounter = () => {
    const t = document.getElementById('new-counter-trigger').value.trim();
    const r = document.getElementById('new-counter-response').value.trim();
    if (!t || !r) return ui.notify('모든 필드를 채워주세요.', 'warning');
    sendWebSocket({ type: 'addCounter', data: { trigger: t, response: r } });
    ui.modal('add-counter-modal', false);
};

window.deleteCounter = (t) => confirm('이 카운터를 삭제할까요?') && sendWebSocket({ type: 'removeCounter', data: { trigger: t } });

window.saveSongSettings = () => {
    const mode = document.querySelector('input[name="songRequestMode"]:checked')?.value;
    const cooldown = document.getElementById('song-cooldown').value;
    const amount = document.getElementById('song-min-donation').value;
    sendWebSocket({ type: 'updateSettings', data: { songRequestMode: mode, songRequestCooldown: parseInt(cooldown), minDonationAmount: parseInt(amount) } });
    ui.notify('신청곡 설정이 저장되었습니다.', 'success');
};

window.savePointsSettings = () => {
    const perChat = document.getElementById('points-per-chat').value;
    sendWebSocket({ type: 'updateSettings', data: { pointsPerChat: parseInt(perChat) } });
    ui.notify('포인트 설정이 저장되었습니다.', 'success');
};

window.saveOverlaySettings = () => {
    const s = {
        backgroundOpacity: parseInt(document.getElementById('overlay-opacity').value),
        autoHideDelay: parseInt(document.getElementById('overlay-auto-hide').value) * 1000,
        themeColor: document.getElementById('overlay-color').value,
        showAnimation: document.getElementById('overlay-animation').checked,
        showConfetti: document.getElementById('overlay-confetti').checked
    };
    sendWebSocket({ type: 'updateOverlaySettings', payload: s });
    ui.notify('오버레이 설정이 저장되었습니다.', 'success');
};

window.toggleParticipation = () => sendWebSocket({ type: 'toggleParticipation' });
window.clearParticipants = () => confirm('모든 참여 데이터를 초기화할까요?') && sendWebSocket({ type: 'clearParticipants' });
window.approveParticipant = (id) => sendWebSocket({ type: 'moveToParticipants', data: { userIdHash: id } });

// UI Sync Helpers
function syncSettings(s) {
    if (s.chatEnabled !== undefined) updateBotStatusUI(botConnected, s.chatEnabled);
    if (s.songRequestMode) { const r = document.querySelector(`input[name="songRequestMode"][value="${s.songRequestMode}"]`); if(r) r.checked = true; }
    if (s.songRequestCooldown !== undefined) document.getElementById('song-cooldown').value = s.songRequestCooldown;
    if (s.minDonationAmount !== undefined) document.getElementById('song-min-donation').value = s.minDonationAmount;
    if (s.pointsPerChat !== undefined) document.getElementById('points-per-chat').value = s.pointsPerChat;
}

function syncOverlay(os) {
    if (document.getElementById('overlay-opacity')) document.getElementById('overlay-opacity').value = os.backgroundOpacity || 70;
    if (document.getElementById('overlay-auto-hide')) document.getElementById('overlay-auto-hide').value = (os.autoHideDelay || 5000) / 1000;
    if (document.getElementById('overlay-color')) document.getElementById('overlay-color').value = os.themeColor || '#00ff94';
    if (document.getElementById('overlay-animation')) document.getElementById('overlay-animation').checked = os.showAnimation ?? true;
    if (document.getElementById('overlay-confetti')) document.getElementById('overlay-confetti').checked = os.showConfetti ?? true;
}

function updateBotStatusUI(connected, chatEnabled) {
    const ind = document.getElementById('bot-status-indicator');
    const txt = document.getElementById('bot-status-text');
    const tgl = document.getElementById('bot-chat-toggle');
    if (tgl) tgl.checked = chatEnabled;
    if (ind) ind.className = `status-indicator ${connected ? (chatEnabled ? 'online' : 'idle') : 'offline'}`;
    if (txt) txt.textContent = connected ? (chatEnabled ? '봇 작동중' : '봇 대기중') : '봇 미연결';
}

function updateStreamerInfo(info) {
    const name = document.getElementById('channel-name');
    const followers = document.getElementById('follower-count');
    if (name) name.textContent = info.channelName;
    if (followers) followers.innerHTML = `<i class="fas fa-heart"></i><span>${info.followerCount?.toLocaleString()} 팔로워</span>`;
}

// ============================================
// Final Init
// ============================================
async function main() {
    await initAuth();
    initWebSocket();
    
    document.addEventListener('mousemove', (e) => {
        document.querySelectorAll('.card').forEach(c => {
            const r = c.getBoundingClientRect();
            c.style.setProperty('--mouse-x', `${e.clientX - r.left}px`);
            c.style.setProperty('--mouse-y', `${e.clientY - r.top}px`);
        });
    });

    document.getElementById('bot-chat-toggle')?.addEventListener('change', (e) => {
        sendWebSocket({ type: 'updateSettings', data: { chatEnabled: e.target.checked } });
    });

    // Sidebar navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.onclick = () => {
            const target = item.dataset.tab;
            document.querySelectorAll('.nav-item').forEach(i => i.classList.toggle('active', i === item));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === `${target}-tab`));
            document.getElementById('header-title').textContent = item.querySelector('span').textContent;
        };
    });
}

document.addEventListener('DOMContentLoaded', main);
window.showModal = ui.modal;
window.hideModal = (id) => ui.modal(id, false);
window.handleLogout = async () => {
    localStorage.removeItem(SESSION_KEY);
    await fetch('/auth/logout', { method: 'POST' });
    window.location.href = '/';
};
