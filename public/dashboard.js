// ============================================
// Chzzk Bot Dashboard - Secure & Functional
// ============================================

// Global State
let socket = null;
let currentUser = null;
let isConfigured = false;

// ============================================
// Initialization & Auth Logic
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Dashboard] Initializing...');
    
    // 1. Check server configuration & Session
    try {
        await checkSession();
    } catch (e) {
        console.error('Session check failed:', e);
        showLoginScreen();
    }

    // 2. Setup UI events
    setupUI();
});

async function checkSession() {
    try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        
        if (data.authenticated && data.user) {
            console.log('[Auth] Session valid:', data.user);
            currentUser = data.user;
            showDashboard();
            initWebSocket();
        } else {
            console.log('[Auth] No session');
            showLoginScreen();
        }
    } catch (e) {
        console.error('[Auth] Error checking session:', e);
        showLoginScreen();
    }
}

function showLoginScreen() {
    document.getElementById('landing-page').classList.remove('hidden');
    document.getElementById('app-container').classList.add('hidden');
    document.getElementById('login-overlay').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('landing-page').classList.add('hidden');
    document.getElementById('login-overlay').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    
    // Update Profile UI
    if (currentUser) {
        updateProfileUI(currentUser);
    }
}

function updateProfileUI(user) {
    const avatar = document.getElementById('header-avatar');
    const username = document.getElementById('header-username');
    const sidebarAvatar = document.getElementById('sidebar-avatar');
    const sidebarName = document.getElementById('sidebar-name');
    
    if (user.channelImageUrl) {
        if(avatar) avatar.style.backgroundImage = `url(${user.channelImageUrl})`;
        if(sidebarAvatar) sidebarAvatar.style.backgroundImage = `url(${user.channelImageUrl})`;
    }
    if(username) username.textContent = user.channelName;
    if(sidebarName) sidebarName.textContent = user.channelName;
}

// ============================================
// WebSocket Logic
// ============================================

function initWebSocket() {
    if (socket) return; // Already connected

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let wsUrl;
    if (window.getServerWebSocketUrl) {
        wsUrl = window.getServerWebSocketUrl();
    } else {
        wsUrl = `${wsProtocol}//${window.location.host}`;
    }

    console.log('[WS] Connecting to:', wsUrl);
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
        console.log('[WS] Connected');
        updateBotStatus(true);
        // Request initial data
        if (currentUser) {
            socket.send(JSON.stringify({ 
                type: 'connect', 
                data: { channel: currentUser.channelId } 
            }));
        }
        setTimeout(() => {
            socket.send(JSON.stringify({ type: 'requestData', dataType: 'all' }));
        }, 500);
    };

    socket.onclose = () => {
        console.log('[WS] Disconnected');
        updateBotStatus(false);
        socket = null;
        // Reconnect after 3s if still on dashboard
        if (!document.getElementById('app-container').classList.contains('hidden')) {
            setTimeout(initWebSocket, 3000);
        }
    };

    socket.onmessage = (event) => {
        try {
            const msg = JSON.parse(event.data);
            handleMessage(msg);
        } catch (e) {
            console.error('[WS] Parse error:', e);
        }
    };
}

function handleMessage(msg) {
    switch (msg.type) {
        case 'authStatus':
            if (!msg.authenticated) {
                console.warn('[WS] Auth failed, redirecting to login');
                // Session invalid, force logout
                handleLogout();
            }
            break;
        case 'botStatus':
            updateBotStatus(msg.payload?.connected);
            break;
        // ... (Data updates)
        case 'commands': updateList('commands-list', msg.data, renderCommandItem); break;
        case 'macros': updateList('macros-list', msg.data, renderMacroItem); break;
        case 'counters': updateList('counters-list', msg.data, renderCounterItem); break;
        // ... (Add other handlers as needed)
    }
}

function updateBotStatus(connected) {
    const indicator = document.getElementById('bot-status-indicator');
    const text = document.getElementById('bot-status-text');
    if (indicator) {
        indicator.className = `status-indicator ${connected ? 'online' : ''}`;
    }
    if (text) text.textContent = connected ? '봇 연결됨' : '봇 미연결';
}

// ============================================
// UI Functions
// ============================================

function setupUI() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.dataset.tab;
            switchTab(tabId);
        });
    });

    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
    document.querySelector('.header-logout')?.addEventListener('click', handleLogout);
}

function switchTab(tabId) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    
    // Show selected
    document.getElementById(`${tabId}-tab`)?.classList.add('active');
    document.querySelector(`.nav-item[data-tab="${tabId}"]`)?.classList.add('active');
    
    // Update header title
    const titles = {
        'dashboard': '대시보드',
        'commands': '명령어',
        'macros': '매크로',
        'counters': '카운터',
        'songs': '신청곡',
        'votes': '투표',
        'participation': '참여',
        'points': '포인트'
    };
    const titleEl = document.getElementById('header-title');
    if (titleEl) titleEl.textContent = titles[tabId] || '대시보드';
}

async function handleLogout() {
    try {
        await fetch('/auth/logout', { method: 'POST' });
    } catch(e) {}
    
    currentUser = null;
    if (socket) socket.close();
    showLoginScreen();
}

// Helper for rendering lists
function updateList(containerId, items, renderFunc) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (!items || items.length === 0) {
        container.innerHTML = '<div class="empty-state">데이터가 없습니다.</div>';
        return;
    }
    
    container.innerHTML = items.map((item, index) => renderFunc(item, index)).join('');
}

function renderCommandItem(cmd, index) {
    // Return HTML string for command item (using original style)
    return `
        <div class="item-card">
            <div class="item-info">
                <span class="item-trigger">${cmd.trigger || (cmd.triggers ? cmd.triggers[0] : '')}</span>
                <span class="item-response">${cmd.response}</span>
            </div>
            <!-- Actions... -->
        </div>
    `;
}

// ... (Other render functions) ...

// Export globally for inline onclick handlers
window.handleLogout = handleLogout;
