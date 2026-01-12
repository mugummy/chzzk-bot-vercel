// ============================================
// Chzzk Bot Dashboard - High Performance
// ============================================

let socket = null;
let currentUser = null;

// ============================================
// Auth & Initialization
// ============================================

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
            
            // 데이터 로드 전 UI 업데이트 (즉각적인 피드백)
            updateProfileUI(data.user);
            showDashboard();
            initWebSocket();
        } else {
            console.log('[Auth] No active session');
            showLanding();
        }
    } catch (e) {
        console.error('[Auth] Session check error:', e);
        showLanding();
    }
}

function showLanding() {
    document.getElementById('landing-page').classList.remove('hidden');
    document.getElementById('app-container').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('landing-page').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
}

function updateProfileUI(user) {
    if (!user) return;

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

    // 3. Main Content Card (Channel Info)
    const channelAvatarLg = document.getElementById('channel-avatar-lg');
    const channelNameLg = document.getElementById('channel-name-lg');
    if (channelAvatarLg && user.channelImageUrl) channelAvatarLg.style.backgroundImage = `url(${user.channelImageUrl})`;
    if (channelNameLg) channelNameLg.textContent = user.channelName;
}

// ============================================
// WebSocket
// ============================================

function initWebSocket() {
    if (socket) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let wsUrl = window.getServerWebSocketUrl ? window.getServerWebSocketUrl() : `${wsProtocol}//${window.location.host}`;

    socket = new WebSocket(wsUrl);
    window.socket = socket;

    socket.onopen = () => {
        console.log('[WS] Connected to Server');
        updateBotStatus(true);
        // 서버에 봇 연결 요청 (채널 ID 전달)
        if (currentUser) {
            socket.send(JSON.stringify({ type: 'connect', data: { channel: currentUser.channelId } }));
        }
        // 초기 데이터 요청
        setTimeout(() => { socket.send(JSON.stringify({ type: 'requestData', dataType: 'all' })); }, 500);
    };

    socket.onclose = () => {
        console.log('[WS] Disconnected');
        updateBotStatus(false);
        socket = null;
        // 재연결 시도
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
                // 서버에서 가져온 최신 채널 정보(팔로워 수 등) 반영
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

// ============================================
// UI Handlers
// ============================================

function setupUI() {
    // Tab Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.dataset.tab;
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            document.getElementById(`${tabId}-tab`)?.classList.add('active');
            item.classList.add('active');
            
            const titleEl = document.getElementById('header-title');
            if (titleEl) titleEl.textContent = item.textContent.trim();
        });
    });

    // Logout
    window.handleLogout = async () => {
        if (confirm('로그아웃 하시겠습니까?')) {
            try { await fetch('/auth/logout', { method: 'POST', credentials: 'include' }); } catch(e) {}
            window.location.href = '/'; 
        }
    };
}

// ... (Rendering functions like renderCommandItem, updateList same as previous version)
function updateList(id, items, renderFunc) {
    const el = document.getElementById(id);
    if (!el) return;
    if (!items || items.length === 0) { el.innerHTML = '<div style="text-align:center;padding:20px;color:#666;">데이터가 없습니다.</div>'; return; }
    el.innerHTML = items.map(renderFunc).join('');
}

function renderCommandItem(cmd) {
    const triggers = cmd.triggers || [cmd.trigger];
    return `<div class="item-card" style="display:flex;justify-content:space-between;padding:15px;background:rgba(255,255,255,0.03);border-radius:10px;margin-bottom:10px;">
        <div><span style="color:#00ff94;font-weight:bold;margin-right:10px;">${triggers.join(', ')}</span><span>${cmd.response}</span></div>
        <button class="btn-icon btn-danger" onclick="deleteCommand('${triggers[0]}')"><i class="fas fa-trash"></i></button>
    </div>`;
}

function renderMacroItem(m) {
    return `<div class="item-card" style="display:flex;justify-content:space-between;padding:15px;background:rgba(255,255,255,0.03);border-radius:10px;margin-bottom:10px;">
        <div><span style="color:#7047eb;font-weight:bold;margin-right:10px;">${m.interval}분</span><span>${m.message}</span></div>
        <button class="btn-icon btn-danger" onclick="deleteMacro(${m.id})"><i class="fas fa-trash"></i></button>
    </div>`;
}

function renderCounterItem(c) {
    return `<div class="item-card" style="display:flex;justify-content:space-between;padding:15px;background:rgba(255,255,255,0.03);border-radius:10px;margin-bottom:10px;">
        <div><span style="font-weight:bold;margin-right:10px;">${c.trigger}</span><span>#${c.state?.totalCount || 0}</span></div>
        <button class="btn-icon btn-danger" onclick="deleteCounter('${c.trigger}')"><i class="fas fa-trash"></i></button>
    </div>`;
}

// Global Action Functions
window.deleteCommand = (t) => { if(confirm('삭제?')) socket.send(JSON.stringify({ type: 'removeCommand', data: { trigger: t } })); };
window.deleteMacro = (id) => { if(confirm('삭제?')) socket.send(JSON.stringify({ type: 'removeMacro', data: { id } })); };
window.deleteCounter = (t) => { if(confirm('삭제?')) socket.send(JSON.stringify({ type: 'removeCounter', data: { trigger: t } })); };
window.addCommand = () => {
    const t = document.getElementById('new-command-trigger').value;
    const r = document.getElementById('new-command-response').value;
    if(t && r) { socket.send(JSON.stringify({ type: 'addCommand', data: { trigger: t, response: r } })); hideModal('add-command-modal'); }
};

// Utils
window.showModal = (id) => document.getElementById(id)?.classList.remove('hidden');
window.hideModal = (id) => document.getElementById(id)?.classList.add('hidden');
function escapeHTML(s) { return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

// Placeholder for other features
function updateSongState(s) { /* ... */ }
function updateParticipationState(s) { /* ... */ }
function updatePointsData(d) { /* ... */ }
function addChatMessage(c) { /* ... */ }
