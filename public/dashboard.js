// chzzk-bot-v2/public/dashboard.js - Ultimate Expert Edition (100% Full Source)

let socket = null;
let botConnected = false;
let isChatEnabled = true;
let currentUser = null;
const SESSION_KEY = 'chzzk_session_token';

// Global Data Store
window.dashboardData = {
    commands: [],
    macros: [],
    counters: []
};

const ui = {
    esc: (s) => {
        if (!s) return '';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
            .replace(/\//g, '&#x2F;');
    },
    notify: (msg, type = 'info') => {
        const c = document.getElementById('notification-container');
        if (!c) return;
        const n = document.createElement('div');
        n.className = `notification ${type} show`;
        n.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> <span>${msg}</span>`;
        c.appendChild(n);
        setTimeout(() => { n.classList.replace('show', 'hide'); setTimeout(() => n.remove(), 300); }, 4000);
    },
    modal: (id, show = true) => {
        const m = document.getElementById(id);
        if (m) show ? m.classList.add('show') : m.classList.remove('show');
    }
};

const utils = { esc: ui.esc };
window.ui = ui;
window.utils = utils;

const helperData = {
    "/user": { sub: "채팅을 친 시청자의 닉네임을 가져와요!", tip: "", input: "나하", output: "/user님 나하!", msg: "무거미님 나하!" },
    "/uptime": { sub: "현재 방송의 길이를 가져와요!", tip: "x일 x시간 x분 x초 형식", input: "!업타임", output: "/uptime 동안 방송중!", msg: "19일 1시간 32분 40초 동안 방송중!" },
    "/viewer": { sub: "시청자 수를 가져와요!", tip: "", input: "!시청자", output: "현재 /viewer 분과 함께!", msg: "현재 106분과 함께!" },
    "/random": { sub: "문장 중 하나를 랜덤으로 가져와요!", tip: "문장 사이에 /random 을 넣으세요.", input: "!메뉴", output: "치킨/random피자", msg: "피자" },
    "/count": { sub: "명령어 사용 횟수를 기록해요!", tip: "시청자마다 별개로 기록됩니다.", input: "!죽음", output: "/count번 죽었습니다.", msg: "51번 죽었습니다." }
};

// ============================================
// Auth & WebSocket
// ============================================
async function initAuth() {
    console.log('[Auth] Initializing...');
    const params = new URLSearchParams(window.location.search);
    const session = params.get('session');
    
    if (session) {
        localStorage.setItem(SESSION_KEY, session);
        window.history.replaceState({}, document.title, window.location.pathname);
        ui.notify('로그인이 완료되었습니다.', 'success');
        await new Promise(r => setTimeout(r, 1500));
    }
    
    const token = localStorage.getItem(SESSION_KEY);
    if (!token) return (window.location.href = '/');

    try {
        const res = await fetch('/api/auth/session', { 
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.authenticated) {
            currentUser = data.user;
            renderUserBasics(currentUser);
        } else {
            window.location.href = '/?error=expired';
        }
    } catch (e) { 
        window.location.href = '/?error=error'; 
    }
}

function initWebSocket() {
    const token = localStorage.getItem(SESSION_KEY);
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/?token=${token}`;
    
    socket = new WebSocket(wsUrl);
    window.socket = socket;

    socket.onopen = () => {
        console.log('[WS] Connected');
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
            updateBotStatusUI(botConnected, isChatEnabled);
            if(data.channelInfo) renderStreamerStatus(data.channelInfo, data.liveStatus);
            break;
        case 'settingsUpdate': syncSettings(data.payload); break;
        case 'overlaySettingsUpdate': syncOverlay(data.payload); break;
        case 'commandsUpdate': window.dashboardData.commands = data.payload; renderList('commands-list', data.payload, 'deleteCommand', 'editCommand'); break;
        case 'macrosUpdate': window.dashboardData.macros = data.payload; renderList('macros-list', data.payload, 'deleteMacro', 'editMacro'); break;
        case 'countersUpdate': window.dashboardData.counters = data.payload; renderList('counters-list', data.payload, 'deleteCounter', 'editCounter'); break;
        case 'songStateUpdate': renderSongUI(data.payload); break;
        case 'participationStateUpdate': renderParticipationUI(data.payload); break;
        case 'newChat': renderChatLine(data.payload); break;
        case 'error': ui.notify(data.message, 'error'); break;
    }
}

// ============================================
// UI Renderers
// ============================================
function renderUserBasics(user) {
    const avatarEls = document.querySelectorAll('#sidebar-avatar, #header-avatar, #main-channel-avatar');
    avatarEls.forEach(el => { if (user.channelImageUrl) el.style.backgroundImage = `url(${user.channelImageUrl})`; });
    document.getElementById('sidebar-name').textContent = user.channelName;
    document.getElementById('header-username').textContent = user.channelName;
    document.getElementById('header-profile').style.display = 'flex';
    document.getElementById('sidebar-profile').style.display = 'flex';
}

function renderStreamerStatus(info, live) {
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

function renderList(id, list, deleteFn, editFn) {
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
    if (list) list.innerHTML = state.queue.length ? state.queue.map(s => `<div class="queue-item"><span>${ui.esc(s.title)}</span></div>`).join('') : '<div class="empty-state">대기열 비어있음</div>';
    if (state.currentSong) {
        document.getElementById('current-song-thumbnail').src = state.currentSong.thumbnail || '';
        document.getElementById('current-song').textContent = state.currentSong.title;
    }
    document.getElementById('queue-count').textContent = state.queue.length;
}

function renderParticipationUI(state) {
    document.getElementById('waiting-count').textContent = state.queue.length;
    document.getElementById('active-count').textContent = state.participants.length;
    const waitList = document.getElementById('waiting-queue');
    if (waitList) waitList.innerHTML = state.queue.map(p => `<div class="participant-item"><span>${ui.esc(p.nickname)}</span><button class="btn-sm btn-primary" onclick="window.approveParticipant('${p.userIdHash}')">승인</button></div>`).join('');
    const activeList = document.getElementById('active-participants');
    if (activeList) activeList.innerHTML = state.participants.map(p => `<div class="participant-item"><i class="fas fa-user-check"></i> ${ui.esc(p.nickname)}</div>`).join('');
}

function renderChatLine(chat) {
    if (!chat || !chat.profile || !chat.message) return;
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
// Actions & Logic
// ============================================
window.insertFunction = (targetId, func) => {
    const el = document.getElementById(targetId);
    if (!el) return;
    const start = el.selectionStart;
    el.value = el.value.substring(0, start) + func + el.value.substring(el.selectionEnd);
    el.focus();
    const preId = targetId.includes('command') ? 'cmd-preview' : targetId.includes('macro') ? 'macro-preview' : 'counter-preview';
    window.updatePreview(targetId, preId);
};

window.showHelper = (func) => {
    const data = helperData[func];
    if (!data) return;
    const title = document.getElementById('h-title');
    if (title) title.textContent = func;
    const sub = document.getElementById('h-sub');
    if (sub) sub.textContent = data.sub;
    const tip = document.getElementById('h-tip');
    if (tip) tip.textContent = data.tip;
};

window.updatePreview = (srcId, preId) => {
    const src = document.getElementById(srcId);
    const pre = document.getElementById(preId);
    if (!src || !pre) return;
    const map = { '/user': '무거미', '/uptime': '02:15:30', '/viewer': '120', '/random': '결과A', '/count': '1' };
    let val = src.value || '미리보기가 표시됩니다.';
    Object.keys(map).forEach(key => {
        val = val.split(key).join(`<span style="color:#00ff94; font-weight:bold">${map[key]}</span>`);
    });
    pre.innerHTML = `봇: ${val}`;
};

window.addCommand = () => {
    const t = document.getElementById('new-command-trigger').value.trim();
    const r = document.getElementById('new-command-response').value.trim();
    if (t && r) { sendWebSocket({ type: 'addCommand', data: { trigger: t, response: r } }); ui.modal('add-command-modal', false); }
};

window.saveSongSettings = () => {
    const mode = document.querySelector('input[name="songRequestMode"]:checked')?.value;
    const cooldown = document.getElementById('song-cooldown').value;
    const amount = document.getElementById('song-min-donation').value;
    sendWebSocket({ type: 'updateSettings', data: { songRequestMode: mode, songRequestCooldown: parseInt(cooldown), minDonationAmount: parseInt(amount) } });
};

window.saveParticipationSettings = () => {
    const cmd = document.getElementById('participation-command').value;
    const max = document.getElementById('max-participants-slider').value;
    sendWebSocket({ type: 'updateSettings', data: { participationCommand: cmd } });
    sendWebSocket({ type: 'updateMaxParticipants', payload: { count: parseInt(max) } });
    ui.notify('설정이 저장되었습니다.', 'success');
};

window.savePointsSettings = () => {
    const per = document.getElementById('points-per-chat').value;
    const cool = document.getElementById('points-cooldown').value;
    const name = document.getElementById('points-unit-name').value;
    sendWebSocket({ type: 'updateSettings', data: { pointsPerChat: parseInt(per), pointsCooldown: parseInt(cool), pointsName: name } });
    ui.notify('설정 저장 완료', 'success');
};

window.saveOverlaySettings = () => {
    const s = { backgroundOpacity: parseInt(document.getElementById('overlay-opacity').value), autoHideDelay: parseInt(document.getElementById('overlay-auto-hide').value) * 1000, themeColor: document.getElementById('overlay-color').value };
    sendWebSocket({ type: 'updateOverlaySettings', payload: s });
    ui.notify('오버레이 설정 저장 완료', 'success');
};

function syncSettings(s) {
    if (s.chatEnabled !== undefined) {
        document.getElementById('bot-chat-toggle').checked = s.chatEnabled;
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
    const op = document.getElementById('overlay-opacity'); if (op) { op.value = os.backgroundOpacity || 70; document.getElementById('overlay-opacity-value').textContent = op.value+'%'; }
    const ah = document.getElementById('overlay-auto-hide'); if (ah) { ah.value = (os.autoHideDelay || 5000) / 1000; document.getElementById('overlay-auto-hide-value').textContent = ah.value+'초'; }
    if (os.themeColor) document.getElementById('overlay-color').value = os.themeColor;
    const baseUrl = window.location.origin;
    document.getElementById('overlay-url').value = `${baseUrl}/vote_overlay.html?token=${localStorage.getItem(SESSION_KEY)}`;
}

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
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });
    document.getElementById('bot-chat-toggle')?.addEventListener('change', (e) => sendWebSocket({ type: 'updateSettings', data: { chatEnabled: e.target.checked } }));
    document.getElementById('max-participants-slider')?.addEventListener('input', (e) => document.getElementById('max-participants-value').textContent = e.target.value);
    
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

window.showModal = (id) => { document.getElementById(id).classList.add('show'); };
window.hideModal = (id) => { document.getElementById(id).classList.remove('show'); };
window.openPlayer = () => window.open('/player.html', '_blank', 'width=850,height=650');
window.handleLogout = () => { localStorage.removeItem(SESSION_KEY); window.location.href = '/'; };
window.copyOverlayUrl = () => { const el = document.getElementById('overlay-url'); el.select(); document.execCommand('copy'); ui.notify('URL 복사 완료!', 'success'); };
window.syncRangeValue = (el, id) => document.getElementById(id).textContent = el.id.includes('opacity') ? el.value+'%' : el.value+'초';
window.editCommand = (t) => { const c = window.dashboardData.commands.find(x => x.trigger === t); if(c){ document.getElementById('new-command-trigger').value = c.trigger; document.getElementById('new-command-response').value = c.response; window.showModal('add-command-modal'); } };
window.editMacro = (id) => { const m = window.dashboardData.macros.find(x => x.id === id); if(m){ document.getElementById('new-macro-interval').value = m.interval; document.getElementById('new-macro-message').value = m.message; window.showModal('add-macro-modal'); } };
window.editCounter = (t) => { const c = window.dashboardData.counters.find(x => x.trigger === t); if(c){ document.getElementById('new-counter-trigger').value = c.trigger; document.getElementById('new-counter-response').value = c.response; window.showModal('add-counter-modal'); } };
window.deleteMacro = (id) => confirm('삭제할까요?') && sendWebSocket({ type: 'removeMacro', data: { id } });
window.deleteCounter = (t) => confirm('삭제할까요?') && sendWebSocket({ type: 'removeCounter', data: { trigger: t } });
window.approveParticipant = (id) => sendWebSocket({ type: 'moveToParticipants', data: { userIdHash: id } });
window.toggleParticipation = () => sendWebSocket({ type: 'toggleParticipation' });
window.clearParticipants = () => confirm('데이터를 초기화할까요?') && sendWebSocket({ type: 'clearParticipants' });
window.saveGreetSettings = () => { const type = document.querySelector('input[name="greetType"]:checked').value; sendWebSocket({ type: 'updateGreetSettings', data: { type: parseInt(type) } }); ui.notify('저장 완료', 'success'); };
window.saveGreetEditor = () => { const msg = document.getElementById('edit-greet-input').value; sendWebSocket({ type: 'updateGreetSettings', data: { message: msg } }); window.hideModal('edit-greet-modal'); };
window.resetGreetHistory = () => confirm('기록을 초기화할까요?') && sendWebSocket({ type: 'resetGreetHistory' });