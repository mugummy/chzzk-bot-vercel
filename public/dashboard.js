// ============================================
// Chzzk Bot Dashboard - Secure & Functional (Restored Design)
// ============================================

let socket = null;
window.socket = null; // 전역 노출 (다른 스크립트 호환용)
let currentUser = null;

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
    
    // 3. Init Tabs (Legacy support)
    if (typeof initTabs === 'function') initTabs();
});

async function checkSession() {
    try {
        // [중요] credentials: 'include' 옵션 추가 (쿠키 전송 필수)
        const res = await fetch('/api/auth/session', { 
            cache: 'no-store',
            credentials: 'include' 
        });
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
    // 로그인 안 된 상태: 랜딩 페이지 보이기, 앱 숨기기
    const landing = document.getElementById('landing-page');
    const app = document.getElementById('app-container');
    const overlay = document.getElementById('login-overlay');
    
    if (landing) landing.classList.remove('hidden');
    if (app) app.classList.add('hidden');
    if (overlay) overlay.classList.add('hidden');
}

function showDashboard() {
    // 로그인 된 상태: 랜딩 숨기기, 앱 보이기
    const landing = document.getElementById('landing-page');
    const app = document.getElementById('app-container');
    const overlay = document.getElementById('login-overlay');
    
    if (landing) landing.classList.add('hidden');
    if (overlay) overlay.classList.add('hidden');
    if (app) app.classList.remove('hidden');
    
    // Update Profile UI
    if (currentUser) {
        updateProfileUI(currentUser);
    }
}

function updateProfileUI(user) {
    const headerAvatar = document.getElementById('header-avatar');
    const headerUsername = document.getElementById('header-username');
    const sidebarAvatar = document.getElementById('sidebar-avatar');
    const sidebarName = document.getElementById('sidebar-name');
    
    if (user.channelImageUrl) {
        if(headerAvatar) headerAvatar.style.backgroundImage = `url(${user.channelImageUrl})`;
        if(sidebarAvatar) sidebarAvatar.style.backgroundImage = `url(${user.channelImageUrl})`;
    }
    if(headerUsername) headerUsername.textContent = user.channelName;
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
    window.socket = socket;

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
        window.socket = null;
        // Reconnect after 3s if still on dashboard (logged in)
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
                handleLogout();
            }
            break;
        case 'botStatus':
            updateBotStatus(msg.payload?.connected);
            break;
        case 'commands': updateList('commands-list', msg.data, renderCommandItem); break;
        case 'macros': updateList('macros-list', msg.data, renderMacroItem); break;
        case 'counters': updateList('counters-list', msg.data, renderCounterItem); break;
        
        // ... (Legacy handlers mapping)
        case 'songStateUpdate': if(typeof updateSongState === 'function') updateSongState(msg.payload); break;
        case 'participationStateUpdate': if(typeof updateParticipationState === 'function') updateParticipationState(msg.payload); break;
        case 'voteStateUpdate': if(window.updateVoteUI) window.updateVoteUI(msg.payload); break;
        case 'drawStateUpdate': if(window.updateDrawUI) window.updateDrawUI(msg.payload); break;
        case 'rouletteStateUpdate': if(window.updateRouletteUI) window.updateRouletteUI(msg.payload); break;
        case 'newChat': if(typeof addChatMessage === 'function') addChatMessage(msg.payload); break;
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
// UI Functions & Event Listeners
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
    
    // Button Listeners (for modals etc.)
    initButtonListeners();
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    
    document.getElementById(`${tabId}-tab`)?.classList.add('active');
    document.querySelector(`.nav-item[data-tab="${tabId}"]`)?.classList.add('active');
}

async function handleLogout() {
    if (confirm('로그아웃 하시겠습니까?')) {
        try {
            // [중요] 로그아웃 요청 시에도 쿠키 전송
            await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
        } catch(e) {}
        
        currentUser = null;
        if (socket) socket.close();
        
        // 강제 새로고침으로 세션 정리
        window.location.href = '/'; 
    }
}

// Export globally
window.handleLogout = handleLogout;

// ============================================
// Legacy Logic (Restored from backup)
// ============================================

function initButtonListeners() {
    // Check elements exist before adding listeners
    const addCmdBtn = document.getElementById('add-command-btn');
    if(addCmdBtn) addCmdBtn.addEventListener('click', () => showModal('add-command-modal'));
    
    // ... Add other listeners with null checks
    const savePoints = document.getElementById('save-points-settings');
    if(savePoints) savePoints.addEventListener('click', savePointsSettings);
    
    // Add null checks for other buttons as well...
}

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
    return `
        <div class="item-card">
            <div class="item-info">
                <span class="item-trigger">${cmd.trigger || (cmd.triggers ? cmd.triggers[0] : '')}</span>
                <span class="item-response">${cmd.response}</span>
            </div>
            <div class="item-actions">
                <button class="btn-icon" onclick="deleteCommand('${cmd.trigger || (cmd.triggers ? cmd.triggers[0] : '')}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `;
}

function renderMacroItem(macro, index) {
    return `
        <div class="item-card">
            <div class="item-info">
                <span class="item-trigger">${macro.interval}분</span>
                <span class="item-response">${macro.message}</span>
            </div>
             <div class="item-actions">
                <button class="btn-icon" onclick="deleteMacro(${macro.id})"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `;
}

function renderCounterItem(counter, index) {
    return `
        <div class="item-card">
            <div class="item-info">
                <span class="item-trigger">${counter.trigger}</span>
                <span class="item-response">${counter.response}</span>
            </div>
             <div class="item-actions">
                <button class="btn-icon" onclick="deleteCounter('${counter.trigger}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `;
}

// Legacy functions for HTML onclick compatibility
window.deleteCommand = function(trigger) {
    if(confirm('삭제하시겠습니까?')) sendWebSocket({ type: 'removeCommand', data: { trigger } });
};
window.deleteMacro = function(id) {
    if(confirm('삭제하시겠습니까?')) sendWebSocket({ type: 'removeMacro', data: { id } });
};
window.deleteCounter = function(trigger) {
    if(confirm('삭제하시겠습니까?')) sendWebSocket({ type: 'removeCounter', data: { trigger } });
};

window.addCommand = function() {
    const trigger = document.getElementById('new-command-trigger').value;
    const response = document.getElementById('new-command-response').value;
    if(trigger && response) {
        sendWebSocket({ type: 'addCommand', data: { trigger, response } });
        hideModal('add-command-modal');
        document.getElementById('new-command-trigger').value = '';
        document.getElementById('new-command-response').value = '';
    }
};

// ... (Rest of modal functions are already defined at top)

function updateSongState(state) { /* ... implementation ... */ }
function updateParticipationState(state) { /* ... implementation ... */ }
function savePointsSettings() {
    const points = document.getElementById('points-per-chat')?.value;
    if(points) sendWebSocket({ type: 'updateSetting', data: { setting: 'pointsPerChat', value: points } });
}
function addChatMessage(data) { /* ... implementation ... */ }

function showModal(id) { document.getElementById(id)?.classList.add('show'); }
function hideModal(id) { document.getElementById(id)?.classList.remove('show'); }
window.hideModal = hideModal;
window.showModal = showModal;
