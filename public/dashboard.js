// dashboard.js - Full Functional Controller (100% Restored)

let socket = null;
let botConnected = false;
let currentUser = null;
const SESSION_KEY = 'chzzk_session_token';

const utils = {
    esc: (s) => !s ? '' : String(s).replace(/[&<>"'`\/]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;', '`': '&#96;', '/': '&#x2F;' }[m])),
    notify: (msg, type = 'info') => {
        const c = document.getElementById('notification-container');
        if (!c) return;
        const n = document.createElement('div');
        n.className = `notification ${type} show`;
        n.innerHTML = `<span>${msg}</span>`;
        c.appendChild(n);
        setTimeout(() => { n.classList.replace('show', 'hide'); setTimeout(() => n.remove(), 300); }, 3500);
    }
};

// ============================================
// Auth & WebSocket
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
        sendWebSocket({ type: 'connect', data: { channel: currentUser?.channelId } });
        sendWebSocket({ type: 'requestData' });
    };

    socket.onmessage = (e) => {
        try {
            const data = JSON.parse(e.data);
            handleMessage(data);
            if (window.handleVoteSystemMessage) window.handleVoteSystemMessage(data);
        } catch (err) {}
    };
    socket.onclose = () => setTimeout(initWebSocket, 3000);
}

function sendWebSocket(data) { if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(data)); }

function handleMessage(data) {
    switch (data.type) {
        case 'connectResult': 
            botConnected = data.success;
            updateBotStatusUI(botConnected, true);
            if(data.channelInfo) updateStreamerInfo(data.channelInfo, data.liveStatus);
            break;
        case 'settingsUpdate': syncSettings(data.payload); break;
        case 'overlaySettingsUpdate': syncOverlay(data.payload); break;
        case 'commandsUpdate': renderList('commands-list', data.payload, 'deleteCommand'); break;
        case 'macrosUpdate': renderList('macros-list', data.payload, 'deleteMacro'); break;
        case 'countersUpdate': renderList('counters-list', data.payload, 'deleteCounter'); break;
        case 'songStateUpdate': syncSongState(data.payload); break;
        case 'participationStateUpdate': syncParticipationState(data.payload); break;
        case 'newChat': addChatLine(data.payload); break;
        case 'error': utils.notify(data.message, 'error'); break;
    }
}

// ============================================
// Sync Helpers
// ============================================
function syncSettings(s) {
    if (s.chatEnabled !== undefined) updateBotStatusUI(botConnected, s.chatEnabled);
    if (s.songRequestMode) {
        const rad = document.querySelector(`input[name="songRequestMode"][value="${s.songRequestMode}"]`);
        if (rad) rad.checked = true;
    }
    if (s.songRequestCooldown) document.getElementById('song-cooldown').value = s.songRequestCooldown;
    if (s.minDonationAmount !== undefined) document.getElementById('song-min-donation').value = s.minDonationAmount;
    if (s.pointsPerChat) document.getElementById('points-per-chat').value = s.pointsPerChat;
}

function syncOverlay(os) {
    if (document.getElementById('overlay-opacity')) document.getElementById('overlay-opacity').value = os.backgroundOpacity || 70;
    if (document.getElementById('overlay-auto-hide')) document.getElementById('overlay-auto-hide-value').textContent = `${(os.autoHideDelay || 5000) / 1000}초`;
}

function renderList(id, list, deleteFn) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = list.length ? list.map(item => `
        <div class="item-card card">
            <div class="item-info">
                <b>${utils.esc(item.triggers ? item.triggers[0] : item.trigger)}</b>
                <span>${utils.esc(item.response || item.message)}</span>
            </div>
            <div class="item-actions">
                <button class="btn-icon btn-danger" onclick="window.${deleteFn}('${item.id || item.trigger}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>`).join('') : '<div class="empty-state">내용이 없습니다.</div>';
}

function updateStreamerInfo(info, live) {
    document.getElementById('channel-name').textContent = info.channelName;
    document.getElementById('follower-count').innerHTML = `<i class="fas fa-heart"></i><span>${info.followerCount?.toLocaleString()} 팔로워</span>`;
    if (info.channelImageUrl) document.getElementById('channel-avatar').style.backgroundImage = `url(${info.channelImageUrl})`;
    if (live) {
        document.getElementById('stream-title').textContent = live.liveTitle || '방송 제목 없음';
        document.getElementById('viewer-count').textContent = `${live.concurrentUserCount?.toLocaleString() || 0}명`;
        const badge = document.querySelector('.status-badge');
        if (badge) {
            badge.className = `status-badge ${live.status === 'OPEN' ? 'live' : 'offline'}`;
            badge.textContent = live.status === 'OPEN' ? 'LIVE' : 'OFFLINE';
        }
    }
}

function syncSongState(state) {
    const list = document.getElementById('song-queue-list');
    if (list) list.innerHTML = state.queue.length ? state.queue.map(s => `<div class="queue-item"><span>${utils.esc(s.title)}</span></div>`).join('') : '<div class="empty-state">비어있음</div>';
    const cur = document.getElementById('current-song');
    if (cur) cur.textContent = state.currentSong ? state.currentSong.title : '재생 중인 곡 없음';
    document.getElementById('queue-count').textContent = state.queue.length;
}

function syncParticipationState(state) {
    document.getElementById('waiting-count').textContent = state.queue.length;
    document.getElementById('active-count').textContent = state.participants.length;
    const wait = document.getElementById('waiting-queue');
    if (wait) wait.innerHTML = state.queue.map(p => `<div class="participant-item"><span>${utils.esc(p.nickname)}</span><button class="btn-sm" onclick="window.approveParticipant('${p.userIdHash}')">승인</button></div>`).join('');
    const active = document.getElementById('active-participants');
    if (active) active.innerHTML = state.participants.map(p => `<div class="participant-item">${utils.esc(p.nickname)}</div>`).join('');
}

function addChatLine(chat) {
    const box = document.getElementById('chat-messages');
    if (!box) return;
    const div = document.createElement('div');
    div.className = 'chat-line';
    div.innerHTML = `<span style="color:${chat.profile.color || '#00ff94'}">${utils.esc(chat.profile.nickname)}</span>: ${utils.esc(chat.message)}`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
    if (box.children.length > 50) box.removeChild(box.firstChild);
}

// ============================================
// Functional Actions (All Restored)
// ============================================
window.addCommand = () => {
    const t = document.getElementById('new-command-trigger').value.trim();
    const r = document.getElementById('new-command-response').value.trim();
    if (t && r) { sendWebSocket({ type: 'addCommand', data: { trigger: t, response: r } }); window.hideModal('add-command-modal'); }
};
window.deleteCommand = (t) => confirm('삭제할까요?') && sendWebSocket({ type: 'removeCommand', data: { trigger: t } });

window.addMacro = () => {
    const i = document.getElementById('new-macro-interval').value;
    const m = document.getElementById('new-macro-message').value.trim();
    if (m) { sendWebSocket({ type: 'addMacro', data: { interval: parseInt(i), message: m } }); window.hideModal('add-macro-modal'); }
};
window.deleteMacro = (id) => confirm('매크로를 삭제할까요?') && sendWebSocket({ type: 'removeMacro', data: { id } });

window.addCounter = () => {
    const t = document.getElementById('new-counter-trigger').value.trim();
    const r = document.getElementById('new-counter-response').value.trim();
    if (t && r) { sendWebSocket({ type: 'addCounter', data: { trigger: t, response: r } }); window.hideModal('add-counter-modal'); }
};
window.deleteCounter = (t) => confirm('카운터를 삭제할까요?') && sendWebSocket({ type: 'removeCounter', data: { trigger: t } });

window.saveSongSettings = () => {
    const mode = document.querySelector('input[name="songRequestMode"]:checked')?.value;
    const cooldown = document.getElementById('song-cooldown').value;
    const amount = document.getElementById('song-min-donation').value;
    sendWebSocket({ type: 'updateSettings', data: { songRequestMode: mode, songRequestCooldown: parseInt(cooldown), minDonationAmount: parseInt(amount) } });
};

window.savePointsSettings = () => {
    const val = document.getElementById('points-per-chat').value;
    sendWebSocket({ type: 'updateSettings', data: { pointsPerChat: parseInt(val) } });
};

window.saveOverlaySettings = () => {
    const os = { backgroundOpacity: parseInt(document.getElementById('overlay-opacity').value), autoHideDelay: parseInt(document.getElementById('overlay-auto-hide').value) * 1000 };
    sendWebSocket({ type: 'updateOverlaySettings', payload: os });
};

window.toggleParticipation = () => sendWebSocket({ type: 'toggleParticipation' });
window.clearParticipants = () => confirm('초기화할까요?') && sendWebSocket({ type: 'clearParticipants' });
window.approveParticipant = (id) => sendWebSocket({ type: 'moveToParticipants', data: { userIdHash: id } });

window.insertFunction = (targetId, func) => {
    const el = document.getElementById(targetId);
    if (!el) return;
    const start = el.selectionStart;
    el.value = el.value.substring(0, start) + func + el.value.substring(el.selectionEnd);
    el.focus();
    window.updatePreview(targetId, 'cmd-preview');
};

window.updatePreview = (srcId, preId) => {
    const src = document.getElementById(srcId);
    const pre = document.getElementById(preId);
    if (src && pre) pre.textContent = src.value.replace(/{user}/g, '시청자');
};

function updateBotStatusUI(connected, chatEnabled) {
    const indicator = document.getElementById('bot-status-indicator');
    const text = document.getElementById('bot-status-text');
    const toggle = document.getElementById('bot-chat-toggle');
    if (toggle) toggle.checked = chatEnabled;
    if (indicator) indicator.className = `status-indicator ${connected ? (chatEnabled ? 'online' : 'idle') : 'offline'}`;
    if (text) text.textContent = connected ? (chatEnabled ? '봇 작동중' : '봇 대기중') : '봇 미연결';
}

// Initializer
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
window.showModal = (id) => document.getElementById(id).classList.add('show');
window.hideModal = (id) => document.getElementById(id).classList.remove('show');
window.openPlayer = () => window.open('/player.html', '_blank', 'width=800,height=600');
window.handleLogout = () => { localStorage.removeItem(SESSION_KEY); window.location.href = '/'; };