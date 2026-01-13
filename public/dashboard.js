// dashboard.js - Final Expert Implementation (Stabilized)

let socket = null;
let botConnected = false;
let currentUser = null;
const SESSION_KEY = 'chzzk_session_token';

const ui = {
    esc: (s) => !s ? '' : String(s).replace(/[&<>"'`\/]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;', '`': '&#96;', '/': '&#x2F;' }[m])),
    notify: (msg, type = 'info') => {
        const c = document.getElementById('notification-container');
        if (!c) return;
        const n = document.createElement('div');
        n.className = `notification ${type} show`;
        n.innerHTML = `<span>${msg}</span>`;
        c.appendChild(n);
        setTimeout(() => { n.classList.replace('show', 'hide'); setTimeout(() => n.remove(), 300); }, 3000);
    }
};

// ============================================
// Auth & Connection
// ============================================
async function initAuth() {
    const params = new URLSearchParams(window.location.search);
    const session = params.get('session');
    if (session) {
        localStorage.setItem(SESSION_KEY, session);
        window.history.replaceState({}, document.title, window.location.pathname);
        await new Promise(r => setTimeout(r, 1000)); // 서버 DB 싱크 대기
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
        console.log('[WS] Connected');
        sendWebSocket({ type: 'connect', data: { channel: currentUser?.channelId } });
        // 접속 즉시 모든 데이터 요청
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
    console.log('[WS] Recv:', data.type);
    switch (data.type) {
        case 'connectResult': 
            botConnected = data.success;
            if(data.channelInfo) renderStreamerInfo(data.channelInfo, data.liveStatus);
            break;
        case 'settingsUpdate': syncSettings(data.payload); break;
        case 'overlaySettingsUpdate': syncOverlay(data.payload); break;
        case 'commandsUpdate': renderList('commands-list', data.payload, 'deleteCommand'); break;
        case 'macrosUpdate': renderList('macros-list', data.payload, 'deleteMacro'); break;
        case 'countersUpdate': renderList('counters-list', data.payload, 'deleteCounter'); break;
        case 'songStateUpdate': renderSongState(data.payload); break;
        case 'participationStateUpdate': renderParticipation(data.payload); break;
        case 'newChat': renderChatLine(data.payload); break;
    }
}

// ============================================
// UI Renderers
// ============================================
function renderProfile(user) {
    document.getElementById('sidebar-name').textContent = user.channelName;
    document.getElementById('header-username').textContent = user.channelName;
    document.getElementById('header-profile').style.display = 'flex';
    document.getElementById('sidebar-profile').style.display = 'flex';
    if (user.channelImageUrl) {
        document.getElementById('sidebar-avatar').style.backgroundImage = `url(${user.channelImageUrl})`;
        document.getElementById('header-avatar').style.backgroundImage = `url(${user.channelImageUrl})`;
    }
}

function renderStreamerInfo(info, live) {
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
        document.getElementById('stream-category').innerHTML = `<i class="fas fa-gamepad"></i><span>${live.category || '-'}</span>`;
    }
}

function renderList(id, list, deleteFn) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = list.length ? list.map(item => `
        <div class="item-card card">
            <div class="item-info">
                <b>${ui.esc(item.triggers ? item.triggers[0] : item.trigger)}</b>
                <span>${ui.esc(item.response || item.message)}</span>
            </div>
            <div class="item-actions">
                <button class="btn-icon btn-danger" onclick="window.${deleteFn}('${item.id || item.trigger}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>`).join('') : '<div class="empty-state">데이터가 없습니다.</div>';
}

function renderSongState(state) {
    const list = document.getElementById('song-queue-list');
    if (list) list.innerHTML = state.queue.length ? state.queue.map(s => `<div class="queue-item"><span>${ui.esc(s.title)}</span></div>`).join('') : '<div class="empty-state">대기열이 비어있습니다.</div>';
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

function renderChatLine(chat) {
    const box = document.getElementById('chat-messages');
    if (!box) return;
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
window.deleteCommand = (t) => confirm('삭제하시겠습니까?') && sendWebSocket({ type: 'removeCommand', data: { trigger: t } });

window.addMacro = () => {
    const i = document.getElementById('new-macro-interval').value;
    const m = document.getElementById('new-macro-message').value.trim();
    if (m) { sendWebSocket({ type: 'addMacro', data: { interval: parseInt(i), message: m } }); window.hideModal('add-macro-modal'); }
};
window.deleteMacro = (id) => confirm('삭제할까요?') && sendWebSocket({ type: 'removeMacro', data: { id } });

window.addCounter = () => {
    const t = document.getElementById('new-counter-trigger').value.trim();
    const r = document.getElementById('new-counter-response').value.trim();
    if (t && r) { sendWebSocket({ type: 'addCounter', data: { trigger: t, response: r } }); window.hideModal('add-counter-modal'); }
};
window.deleteCounter = (t) => confirm('삭제할까요?') && sendWebSocket({ type: 'removeCounter', data: { trigger: t } });

window.saveSongSettings = () => {
    const mode = document.querySelector('input[name="songRequestMode"]:checked')?.value;
    const cooldown = document.getElementById('song-cooldown').value;
    const amount = document.getElementById('song-min-donation').value;
    sendWebSocket({ type: 'updateSettings', data: { songRequestMode: mode, songRequestCooldown: parseInt(cooldown), minDonationAmount: parseInt(amount) } });
    ui.notify('설정이 저장되었습니다.', 'success');
};

window.savePointsSettings = () => {
    const perChat = document.getElementById('points-per-chat').value;
    const cooldown = document.getElementById('points-cooldown').value;
    const name = document.getElementById('points-unit-name').value;
    sendWebSocket({ type: 'updateSettings', data: { pointsPerChat: parseInt(perChat), pointsCooldown: parseInt(cooldown), pointsName: name } });
    ui.notify('포인트 설정이 저장되었습니다.', 'success');
};

window.saveParticipationSettings = () => {
    const cmd = document.getElementById('participation-command').value;
    const max = document.getElementById('max-participants').value;
    sendWebSocket({ type: 'updateSettings', data: { participationCommand: cmd } });
    sendWebSocket({ type: 'updateMaxParticipants', payload: { count: parseInt(max) } });
    ui.notify('참여 설정이 저장되었습니다.', 'success');
};

window.saveOverlaySettings = () => {
    const s = { backgroundOpacity: parseInt(document.getElementById('overlay-opacity').value), autoHideDelay: parseInt(document.getElementById('overlay-auto-hide').value) * 1000 };
    sendWebSocket({ type: 'updateOverlaySettings', payload: s });
    ui.notify('오버레이 설정이 저장되었습니다.', 'success');
};

// ... (Sync Helpers)
function syncSettings(s) {
    if (s.chatEnabled !== undefined) {
        const t = document.getElementById('bot-chat-toggle'); if (t) t.checked = s.chatEnabled;
        document.getElementById('bot-status-indicator').className = `status-indicator ${botConnected ? (s.chatEnabled ? 'online' : 'idle') : 'offline'}`;
        document.getElementById('bot-status-text').textContent = botConnected ? (s.chatEnabled ? '봇 작동중' : '봇 대기중') : '봇 미연결';
    }
    if (s.songRequestMode) { const r = document.querySelector(`input[name="songRequestMode"][value="${s.songRequestMode}"]`); if(r) r.checked = true; }
    if (s.songRequestCooldown) document.getElementById('song-cooldown').value = s.songRequestCooldown;
    if (s.minDonationAmount !== undefined) document.getElementById('song-min-donation').value = s.minDonationAmount;
    if (s.pointsPerChat) document.getElementById('points-per-chat').value = s.pointsPerChat;
    if (s.pointsCooldown) document.getElementById('points-cooldown').value = s.pointsCooldown;
    if (s.pointsName) document.getElementById('points-unit-name').value = s.pointsName;
    if (s.participationCommand) document.getElementById('participation-command').value = s.participationCommand;
}

function syncOverlay(os) {
    const op = document.getElementById('overlay-opacity'); if (op) op.value = os.backgroundOpacity || 70;
    const ah = document.getElementById('overlay-auto-hide'); if (ah) ah.value = (os.autoHideDelay || 5000) / 1000;
}

// ... (Utility Helpers)
window.showModal = (id) => document.getElementById(id).classList.add('show');
window.hideModal = (id) => document.getElementById(id).classList.remove('show');
window.insertFunction = (targetId, func) => {
    const el = document.getElementById(targetId);
    const start = el.selectionStart; el.value = el.value.substring(0, start) + func + el.value.substring(el.selectionEnd);
    el.focus(); window.updatePreview(targetId, targetId.replace('response','preview'));
};
window.updatePreview = (srcId, preId) => {
    const src = document.getElementById(srcId); const pre = document.getElementById(preId);
    if (src && pre) pre.innerHTML = src.value.replace(/{user}/g, '<span style="color:#00ff94">무거미</span>');
};
window.syncRangeValue = (el, targetId) => document.getElementById(targetId).textContent = (el.id.includes('opacity') ? el.value + '%' : el.value + '초');
window.openPlayer = () => window.open('/player.html', '_blank');
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
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active')); item.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(`${item.dataset.tab}-tab`).classList.add('active');
            document.getElementById('header-title').textContent = item.querySelector('span').textContent;
        };
    });
}
document.addEventListener('DOMContentLoaded', main);