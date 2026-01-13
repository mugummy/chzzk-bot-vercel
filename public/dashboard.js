// dashboard.js - Final Expert Controller

let socket = null;
let botConnected = false;
let currentUser = null;
const SESSION_KEY = 'chzzk_session_token';

// Global access for other scripts
window.ui = {
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

window.utils = { esc: window.ui.esc };

// ============================================
// Core Auth & Logic
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
            renderProfile(currentUser);
        } else window.location.href = '/';
    } catch (e) { window.location.href = '/'; }
}

function initWebSocket() {
    const token = localStorage.getItem(SESSION_KEY);
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    socket = new WebSocket(`${protocol}//${window.location.host}/?token=${token}`);
    window.socket = socket;

    socket.onopen = () => {
        sendWebSocket({ type: 'connect' });
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
window.sendWebSocket = sendWebSocket;

function handleMessage(data) {
    switch (data.type) {
        case 'connectResult': 
            botConnected = data.success;
            if(data.channelInfo) renderStreamerInfo(data.channelInfo, data.liveStatus);
            break;
        case 'settingsUpdate': syncSettings(data.payload); break;
        case 'commandsUpdate': renderList('commands-list', data.payload, 'deleteCommand'); break;
        case 'songStateUpdate': renderSongUI(data.payload); break;
        case 'newChat': addChatLine(data.payload); break;
    }
}

function renderProfile(user) {
    const avatarEls = document.querySelectorAll('#sidebar-avatar, #header-avatar, #main-channel-avatar');
    avatarEls.forEach(el => { if (user.channelImageUrl) el.style.backgroundImage = `url(${user.channelImageUrl})`; });
    document.getElementById('sidebar-name').textContent = user.channelName;
    document.getElementById('header-username').textContent = user.channelName;
    document.getElementById('header-profile').style.display = 'flex';
    document.getElementById('sidebar-profile').style.display = 'flex';
}

function renderStreamerInfo(info, live) {
    document.getElementById('channel-name').textContent = info.channelName;
    document.getElementById('follower-count').innerHTML = `<i class="fas fa-heart"></i><span> ${info.followerCount?.toLocaleString()} 팔로워</span>`;
    if (live) {
        document.getElementById('stream-title').textContent = live.liveTitle || '-';
        document.getElementById('viewer-count').textContent = `${live.concurrentUserCount?.toLocaleString() || 0}명`;
        const badge = document.querySelector('#stream-status-box .status-badge');
        if (badge) {
            badge.className = `status-badge ${live.status === 'OPEN' ? 'live' : 'offline'}`;
            badge.textContent = live.status === 'OPEN' ? 'LIVE' : 'OFFLINE';
        }
        document.getElementById('stream-category').innerHTML = `<i class="fas fa-gamepad"></i><span> ${live.category || '-'}</span>`;
    }
}

function renderList(id, list, deleteFn) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = list.length ? list.map(item => `
        <div class="item-card card">
            <div class="item-info">
                <b>${window.ui.esc(item.triggers ? item.triggers[0] : item.trigger)}</b>
                <span>${window.ui.esc(item.response || item.message)}</span>
            </div>
            <button class="btn-icon btn-danger" onclick="window.${deleteFn}('${item.id || item.trigger}')"><i class="fas fa-trash"></i></button>
        </div>`).join('') : '<div class="empty-state">내용이 없습니다.</div>';
}

function renderSongUI(state) {
    const list = document.getElementById('song-queue-list');
    if (list) list.innerHTML = state.queue.length ? state.queue.map(s => `<div class="queue-item"><span>${window.ui.esc(s.title)}</span></div>`).join('') : '<div class="empty-state">비어있음</div>';
    if (state.currentSong) {
        document.getElementById('current-song-thumbnail').src = state.currentSong.thumbnail || '';
        document.getElementById('current-song').textContent = state.currentSong.title;
    }
    document.getElementById('queue-count').textContent = state.queue.length;
}

function addChatLine(chat) {
    const box = document.getElementById('chat-messages');
    if (!box) return;
    const div = document.createElement('div');
    div.className = 'chat-line';
    div.innerHTML = `<span style="color:${chat.profile.color || '#00ff94'}">${window.ui.esc(chat.profile.nickname)}</span>: ${window.ui.esc(chat.message)}`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
    if (box.children.length > 50) box.removeChild(box.firstChild);
}

function syncSettings(s) {
    if (s.chatEnabled !== undefined) document.getElementById('bot-chat-toggle').checked = s.chatEnabled;
    if (s.songRequestMode) { const r = document.querySelector(`input[name="songRequestMode"][value="${s.songRequestMode}"]`); if(r) r.checked = true; }
    if (s.songRequestCooldown) document.getElementById('song-cooldown').value = s.songRequestCooldown;
    if (s.minDonationAmount !== undefined) document.getElementById('song-min-donation').value = s.minDonationAmount;
}

// Actions
window.addCommand = () => {
    const t = document.getElementById('new-command-trigger').value.trim();
    const r = document.getElementById('new-command-response').value.trim();
    if (t && r) { sendWebSocket({ type: 'addCommand', data: { trigger: t, response: r } }); window.hideModal('add-command-modal'); }
};
window.deleteCommand = (t) => confirm('삭제할까요?') && sendWebSocket({ type: 'removeCommand', data: { trigger: t } });
window.saveSongSettings = () => {
    const mode = document.querySelector('input[name="songRequestMode"]:checked')?.value;
    const cooldown = document.getElementById('song-cooldown').value;
    const amount = document.getElementById('song-min-donation').value;
    sendWebSocket({ type: 'updateSettings', data: { songRequestMode: mode, songRequestCooldown: parseInt(cooldown), minDonationAmount: parseInt(amount) } });
    window.ui.notify('설정이 저장되었습니다.', 'success');
};

window.showModal = (id) => document.getElementById(id).classList.add('show');
window.hideModal = (id) => document.getElementById(id).classList.remove('show');
window.openPlayer = () => window.open('/player.html', '_blank', 'width=800,height=600');
window.handleLogout = () => { localStorage.removeItem(SESSION_KEY); window.location.href = '/'; };

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
    document.getElementById('bot-chat-toggle')?.addEventListener('change', (e) => sendWebSocket({ type: 'updateSettings', data: { chatEnabled: e.target.checked } }));
    document.querySelectorAll('.nav-item').forEach(item => {
        item.onclick = () => {
            const target = item.dataset.tab;
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active')); item.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(`${item.dataset.tab}-tab`).classList.add('active');
            document.getElementById('header-title').textContent = item.querySelector('span').textContent;
        };
    });
}
document.addEventListener('DOMContentLoaded', main);