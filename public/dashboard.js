// dashboard.js - Integrated High-End Controller

let socket = null;
let botConnected = false;
let isChatEnabled = true;
let currentUser = null;
const SESSION_KEY = 'chzzk_session_token';

// Global Storage for Edit
window.dashboardData = { commands: [], macros: [], counters: [] };

const ui = {
    esc: (s) => !s ? '' : String(s).replace(/[&<>"'`\/]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;', '`': '&#96;', '/': '&#x2F;' }[m])),
    notify: (msg, type = 'info') => {
        const c = document.getElementById('notification-container');
        if (!c) return;
        const n = document.createElement('div');
        n.className = `notification ${type} show`;
        n.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> <span>${msg}</span>`;
        c.appendChild(n);
        setTimeout(() => { n.classList.replace('show', 'hide'); setTimeout(() => n.remove(), 300); }, 4000);
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
        ui.notify('로그인 완료!', 'success');
        await new Promise(r => setTimeout(r, 1000));
    }
    const token = localStorage.getItem(SESSION_KEY);
    if (!token) return (window.location.href = '/');

    try {
        const res = await fetch('/api/auth/session', { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        if (data.authenticated) {
            currentUser = data.user;
            document.getElementById('header-username').textContent = currentUser.channelName;
            document.getElementById('sidebar-name').textContent = currentUser.channelName;
            document.getElementById('header-profile').style.display = 'flex';
            document.getElementById('sidebar-profile').style.display = 'flex';
            if (currentUser.channelImageUrl) {
                document.getElementById('sidebar-avatar').style.backgroundImage = `url(${currentUser.channelImageUrl})`;
                document.getElementById('header-avatar').style.backgroundImage = `url(${currentUser.channelImageUrl})`;
            }
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
    console.log('[WS]', data.type);
    switch (data.type) {
        case 'connectResult': 
            botConnected = data.success;
            updateBotStatusUI(botConnected, true);
            if(data.channelInfo) updateStreamerInfo(data.channelInfo, data.liveStatus);
            break;
        case 'settingsUpdate': syncSettings(data.payload); break;
        case 'overlaySettingsUpdate': syncOverlay(data.payload); break;
        case 'commandsUpdate': window.dashboardData.commands = data.payload; renderItemList('commands-list', data.payload, 'deleteCommand', 'editCommand'); break;
        case 'macrosUpdate': window.dashboardData.macros = data.payload; renderItemList('macros-list', data.payload, 'deleteMacro', 'editMacro'); break;
        case 'countersUpdate': window.dashboardData.counters = data.payload; renderItemList('counters-list', data.payload, 'deleteCounter', 'editCounter'); break;
        case 'songStateUpdate': renderSongUI(data.payload); break;
        case 'participationStateUpdate': renderParticipationUI(data.payload); break;
        case 'newChat': addChatLine(data.payload); break;
        case 'error': ui.notify(data.message, 'error'); break;
    }
}

// ============================================
// Sync & Render Logic
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
    if (document.getElementById('overlay-opacity')) {
        document.getElementById('overlay-opacity').value = os.backgroundOpacity || 70;
        document.getElementById('overlay-opacity-value').textContent = `${os.backgroundOpacity}%`;
    }
    if (document.getElementById('overlay-auto-hide')) {
        document.getElementById('overlay-auto-hide').value = (os.autoHideDelay || 5000) / 1000;
        document.getElementById('overlay-auto-hide-value').textContent = `${(os.autoHideDelay || 5000) / 1000}초`;
    }
}

function updateStreamerInfo(info, live) {
    document.getElementById('channel-name').textContent = info.channelName;
    document.getElementById('follower-count').innerHTML = `<i class="fas fa-heart"></i><span>${info.followerCount?.toLocaleString()} 팔로워</span>`;
    if (info.channelImageUrl) document.getElementById('channel-avatar').style.backgroundImage = `url(${info.channelImageUrl})`;
    if (live) {
        document.getElementById('stream-title').textContent = live.liveTitle || '방송 제목 없음';
        document.getElementById('viewer-count').textContent = `${live.concurrentUserCount?.toLocaleString() || 0}명`;
        const badge = document.querySelector('#stream-status-box .status-badge');
        if (badge) { badge.className = `status-badge ${live.status === 'OPEN' ? 'live' : 'offline'}`; badge.textContent = live.status === 'OPEN' ? 'LIVE' : 'OFFLINE'; }
    }
}

function renderItemList(id, list, deleteFn, editFn) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = list.length ? list.map(item => `
        <div class="item-card card">
            <div class="item-info">
                <b>${ui.esc(item.triggers ? item.triggers[0] : item.trigger)}</b>
                <span>${ui.esc(item.response || item.message)}</span>
            </div>
            <div class="item-actions">
                <button class="btn-icon" onclick="window.${editFn}('${item.id || item.trigger}')"><i class="fas fa-edit"></i></button>
                <button class="btn-icon btn-danger" onclick="window.${deleteFn}('${item.id || item.trigger}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>`).join('') : '<div class="empty-state">내용이 없습니다.</div>';
}

function renderSongUI(state) {
    const list = document.getElementById('song-queue-list');
    if (list) list.innerHTML = state.queue.length ? state.queue.map(s => `<div class="queue-item"><span>${ui.esc(s.title)}</span></div>`).join('') : '<div class="empty-state">비어있음</div>';
    const cur = document.getElementById('current-song');
    if (cur) cur.textContent = state.currentSong ? state.currentSong.title : '재생 중인 곡 없음';
    document.getElementById('queue-count').textContent = state.queue.length;
    document.getElementById('stat-songs').textContent = state.queue.length;
}

function renderParticipation(state) {
    document.getElementById('waiting-count').textContent = state.queue.length;
    document.getElementById('active-count').textContent = state.participants.length;
    document.getElementById('stat-participants').textContent = state.participants.length;
    const wait = document.getElementById('waiting-queue');
    if (wait) wait.innerHTML = state.queue.map(p => `<div class="participant-item"><span>${ui.esc(p.nickname)}</span><button class="btn-sm" onclick="sendWebSocket({type:'moveToParticipants',data:{userIdHash:'${p.userIdHash}'}})">승인</button></div>`).join('');
    const active = document.getElementById('active-participants');
    if (active) active.innerHTML = state.participants.map(p => `<div class="participant-item">${ui.esc(p.nickname)}</div>`).join('');
}

function addChatLine(chat) {
    const box = document.getElementById('chat-messages');
    if (!box) return;
    if (box.querySelector('.chat-empty')) box.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'chat-line';
    div.innerHTML = `<span style="color:${chat.profile.color || '#00ff94'}">${ui.esc(chat.profile.nickname)}</span>: ${ui.esc(chat.message)}`;
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
    if (t && r) { sendWebSocket({ type: 'addCommand', data: { trigger: t, response: r } }); window.hideModal('add-command-modal'); }
};
window.editCommand = (trigger) => {
    const cmd = window.dashboardData.commands.find(c => (c.triggers && c.triggers[0] === trigger) || c.trigger === trigger);
    if (cmd) { document.getElementById('new-command-trigger').value = cmd.triggers ? cmd.triggers[0] : cmd.trigger; document.getElementById('new-command-response').value = cmd.response; window.showModal('add-command-modal'); }
};
window.deleteCommand = (t) => confirm('삭제할까요?') && sendWebSocket({ type: 'removeCommand', data: { trigger: t } });

window.addMacro = () => {
    const i = document.getElementById('new-macro-interval').value;
    const m = document.getElementById('new-macro-message').value.trim();
    if (m) { sendWebSocket({ type: 'addMacro', data: { interval: parseInt(i), message: m } }); window.hideModal('add-macro-modal'); }
};
window.editMacro = (id) => {
    const m = window.dashboardData.macros.find(x => x.id === id);
    if (m) { document.getElementById('new-macro-interval').value = m.interval; document.getElementById('new-macro-message').value = m.message; window.showModal('add-macro-modal'); }
};
window.deleteMacro = (id) => confirm('삭제할까요?') && sendWebSocket({ type: 'removeMacro', data: { id } });

window.addCounter = () => {
    const t = document.getElementById('new-counter-trigger').value.trim();
    const r = document.getElementById('new-counter-response').value.trim();
    if (t && r) { sendWebSocket({ type: 'addCounter', data: { trigger: t, response: r } }); window.hideModal('add-counter-modal'); }
};
window.editCounter = (trigger) => {
    const c = window.dashboardData.counters.find(x => x.trigger === trigger);
    if (c) { document.getElementById('new-counter-trigger').value = c.trigger; document.getElementById('new-counter-response').value = c.response; window.showModal('add-counter-modal'); }
};
window.deleteCounter = (t) => confirm('삭제할까요?') && sendWebSocket({ type: 'removeCounter', data: { trigger: t } });

window.saveSongSettings = () => {
    const mode = document.querySelector('input[name="songRequestMode"]:checked')?.value;
    const cooldown = document.getElementById('song-cooldown').value;
    const amount = document.getElementById('song-min-donation').value;
    sendWebSocket({ type: 'updateSettings', data: { songRequestMode: mode, songRequestCooldown: parseInt(cooldown), minDonationAmount: parseInt(amount) } });
    ui.notify('설정 저장 완료!', 'success');
};

window.savePointsSettings = () => {
    const val = document.getElementById('points-per-chat').value;
    sendWebSocket({ type: 'updateSettings', data: { pointsPerChat: parseInt(val) } });
    ui.notify('설정 저장 완료!', 'success');
};

window.saveOverlaySettings = () => {
    const os = { backgroundOpacity: parseInt(document.getElementById('overlay-opacity').value), autoHideDelay: parseInt(document.getElementById('overlay-auto-hide').value) * 1000 };
    sendWebSocket({ type: 'updateOverlaySettings', payload: os });
    ui.notify('오버레이 저장 완료!', 'success');
};

window.toggleParticipation = () => sendWebSocket({ type: 'toggleParticipation' });
window.clearParticipants = () => confirm('초기화할까요?') && sendWebSocket({ type: 'clearParticipants' });

window.insertFunction = (targetId, func) => {
    const el = document.getElementById(targetId);
    if (!el) return;
    const start = el.selectionStart;
    el.value = el.value.substring(0, start) + func + el.value.substring(el.selectionEnd);
    el.focus();
    window.updatePreview(targetId, targetId.replace('new-','').replace('response','preview'));
};

window.updatePreview = (srcId, preId) => {
    const src = document.getElementById(srcId);
    const pre = document.getElementById(preId);
    if (src && pre) pre.textContent = src.value.replace(/{user}/g, '무거미').replace(/{uptime}/g, '01:20:30').replace(/{count}/g, '1');
};

window.openPlayer = () => window.open('/player.html', '_blank', 'width=800,height=600');
window.handleLogout = () => { localStorage.removeItem(SESSION_KEY); window.location.href = '/'; };
window.showModal = (id) => document.getElementById(id).classList.add('show');
window.hideModal = (id) => document.getElementById(id).classList.remove('show');
window.copyOverlayUrl = () => { const el = document.getElementById('overlay-url'); el.select(); document.execCommand('copy'); ui.notify('URL 복사 완료!', 'success'); };

function updateBotStatusUI(connected, chatEnabled) {
    const indicator = document.getElementById('bot-status-indicator');
    const text = document.getElementById('bot-status-text');
    const toggle = document.getElementById('bot-chat-toggle');
    if (toggle) toggle.checked = chatEnabled;
    if (indicator) indicator.className = `status-indicator ${connected ? (chatEnabled ? 'online' : 'idle') : 'offline'}`;
    if (text) text.textContent = connected ? (chatEnabled ? '봇 작동중' : '봇 대기중') : '봇 미연결';
}

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
            document.querySelectorAll('.nav-item').forEach(i => i.classList.toggle('active', i === item));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === `${target}-tab`));
            document.getElementById('header-title').textContent = item.querySelector('span').textContent;
        };
    });
}
document.addEventListener('DOMContentLoaded', main);
