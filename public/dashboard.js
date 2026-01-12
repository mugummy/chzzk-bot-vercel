// ============================================
// Chzzk Bot Dashboard - Secure & Sync Optimized
// ============================================

let socket = null;
let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Dashboard] Initializing...');
    await checkSession();
    setupUI();
});

async function checkSession() {
    try {
        const res = await fetch('/api/auth/session', { cache: 'no-store', credentials: 'include' });
        const data = await res.json();
        
        if (data.authenticated && data.user) {
            console.log('[Auth] Logged in as:', data.user.channelName);
            currentUser = data.user;
            
            // 로그인 상태이면 즉시 대시보드 표시 및 정보 업데이트
            showDashboard();
            updateProfileUI(data.user);
            initWebSocket();
        } else {
            console.log('[Auth] No session found');
            showLanding();
        }
    } catch (e) {
        console.error('[Auth] Session check error:', e);
        showLanding();
    }
}

function showLanding() {
    document.getElementById('landing-page').classList.remove('hidden');
    document.getElementById('app-container').style.display = 'none';
    document.getElementById('app-container').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('landing-page').classList.add('hidden');
    document.getElementById('app-container').style.display = 'flex';
    document.getElementById('app-container').classList.remove('hidden');
}

function updateProfileUI(user) {
    if (!user) return;
    
    console.log('[UI] Updating profile for:', user.channelName);

    // 1. Sidebar Profile
    const sidebarAvatar = document.getElementById('sidebar-avatar');
    const sidebarName = document.getElementById('sidebar-name');
    if (sidebarAvatar && user.channelImageUrl) sidebarAvatar.style.backgroundImage = `url(${user.channelImageUrl})`;
    if (sidebarName) sidebarName.textContent = user.channelName;

    // 2. Header Profile
    const headerAvatar = document.getElementById('header-avatar');
    const headerUsername = document.getElementById('header-username');
    if (headerAvatar && user.channelImageUrl) headerAvatar.style.backgroundImage = `url(${user.channelImageUrl})`;
    if (headerUsername) headerUsername.textContent = user.channelName;

    // 3. Channel Tab Card
    const channelAvatarLg = document.getElementById('channel-avatar-lg');
    const channelNameLg = document.getElementById('channel-name-lg');
    if (channelAvatarLg && user.channelImageUrl) channelAvatarLg.style.backgroundImage = `url(${user.channelImageUrl})`;
    if (channelNameLg) channelNameLg.textContent = user.channelName;
}

function initWebSocket() {
    if (socket) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let wsUrl = window.getServerWebSocketUrl ? window.getServerWebSocketUrl() : `${wsProtocol}//${window.location.host}`;

    socket = new WebSocket(wsUrl);
    window.socket = socket;

    socket.onopen = () => {
        console.log('[WS] Connected');
        updateBotStatus(true);
        if (currentUser) {
            socket.send(JSON.stringify({ type: 'connect', data: { channel: currentUser.channelId } }));
        }
        setTimeout(() => { socket.send(JSON.stringify({ type: 'requestData', dataType: 'all' })); }, 500);
    };

    socket.onclose = () => {
        updateBotStatus(false);
        socket = null;
        if (!document.getElementById('app-container').classList.contains('hidden')) {
            setTimeout(initWebSocket, 3000);
        }
    };

    socket.onmessage = (event) => {
        try {
            const msg = JSON.parse(event.data);
            handleMessage(msg);
        } catch (e) {}
    };
}

function handleMessage(msg) {
    switch (msg.type) {
        case 'authStatus':
            if (!msg.authenticated) window.location.href = '/';
            break;
        case 'connectResult':
            if (msg.success && msg.channelInfo) {
                const followerEl = document.getElementById('follower-count');
                if (followerEl) followerEl.innerHTML = `<i class="fas fa-heart" style="color:#ff4757;"></i> ${msg.channelInfo.followerCount.toLocaleString()} 팔로워`;
            }
            break;
        case 'botStatus':
            updateBotStatus(msg.payload?.connected);
            break;
        
        // Data Updates
        case 'commands': updateList('commands-list', msg.data, renderCommandItem); break;
        case 'macros': updateList('macros-list', msg.data, renderMacroItem); break;
        case 'counters': updateList('counters-list', msg.data, renderCounterItem); break;
        
        case 'songStateUpdate': updateSongState(msg.payload); break;
        case 'participationStateUpdate': updateParticipationState(msg.payload); break;
        case 'pointsUpdate': updatePointsData(msg.payload); break;
        case 'newChat': addChatMessage(msg.payload); break;
    }
}

function updateBotStatus(connected) {
    const indicator = document.getElementById('bot-status-indicator');
    const text = document.getElementById('bot-status-text');
    if (indicator) indicator.className = `status-indicator ${connected ? 'online' : ''}`;
    if (text) text.textContent = connected ? '봇 연결됨' : '봇 미연결';
}

function setupUI() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.dataset.tab;
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            document.getElementById(`${tabId}-tab`)?.classList.add('active');
            item.classList.add('active');
            document.getElementById('header-title').textContent = item.textContent.trim();
        });
    });

    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
}

async function handleLogout() {
    if (confirm('로그아웃 하시겠습니까?')) {
        try { await fetch('/auth/logout', { method: 'POST', credentials: 'include' }); } catch(e) {}
        window.location.href = '/'; 
    }
}

// Rendering Helpers
function updateList(id, items, renderFunc) {
    const el = document.getElementById(id);
    if (!el) return;
    if (!items || items.length === 0) { el.innerHTML = '<div style="text-align:center;padding:20px;color:#666;">데이터가 없습니다.</div>'; return; }
    el.innerHTML = items.map(renderFunc).join('');
}

function renderCommandItem(cmd) {
    const triggers = cmd.triggers || [cmd.trigger];
    return `<div class="item-card"><div class="item-info"><span class="item-trigger">${triggers.join(', ')}</span><span class="item-response">${cmd.response}</span></div><button class="btn-icon btn-danger" onclick="deleteCommand('${triggers[0]}')"><i class="fas fa-trash"></i></button></div>`;
}

function renderMacroItem(m) {
    return `<div class="item-card"><div class="item-info"><span class="item-trigger">${m.interval}분</span><span>${m.message}</span></div><button class="btn-icon btn-danger" onclick="deleteMacro(${m.id})"><i class="fas fa-trash"></i></button></div>`;
}

function renderCounterItem(c) {
    return `<div class="item-card"><div class="item-info"><span class="item-trigger">${c.trigger}</span><span>#${c.state?.totalCount || 0}</span></div><button class="btn-icon btn-danger" onclick="deleteCounter('${c.trigger}')"><i class="fas fa-trash"></i></button></div>`;
}

// Global functions for HTML onclick compatibility
window.deleteCommand = (t) => { if(confirm('삭제?')) socket.send(JSON.stringify({ type: 'removeCommand', data: { trigger: t } })); };
window.deleteMacro = (id) => { if(confirm('삭제?')) socket.send(JSON.stringify({ type: 'removeMacro', data: { id } })); };
window.deleteCounter = (t) => { if(confirm('삭제?')) socket.send(JSON.stringify({ type: 'removeCounter', data: { trigger: t } })); };
window.addCommand = () => {
    const t = document.getElementById('new-command-trigger').value;
    const r = document.getElementById('new-command-response').value;
    if(t && r) { socket.send(JSON.stringify({ type: 'addCommand', data: { trigger: t, response: r } })); hideModal('add-command-modal'); }
};

function updateSongState(s) { /* Implementation */ }
function updateParticipationState(s) { /* Implementation */ }
function updatePointsData(d) { /* Implementation */ }
function addChatMessage(c) { /* Implementation */ }

window.showModal = (id) => document.getElementById(id)?.classList.add('show');
window.hideModal = (id) => document.getElementById(id)?.classList.remove('show');
