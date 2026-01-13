// ============================================
// Chzzk Bot Dashboard - Main JavaScript
// ============================================

// ============================================
// Global Variables
// ============================================
let socket = null;
window.socket = null;
let botConnected = false;
let isChatEnabled = true; // 봇 채팅 활성화 여부
let currentUser = null;
let isLegacyMode = false;
let isOAuthConfigured = false;

// Data
let commands = [];
let macros = [];
let counters = [];
let songQueue = [];
let currentVote = null;
let participantQueue = [];
let activeParticipants = [];
let maxParticipants = 10;
let currentChannelData = null;
let isParticipationActive = false;

// Draw/Roulette State
let draw = {
    isActive: false,
    keyword: '!참여',
    participants: [],
    previousWinners: []
};
let roulette = {
    items: [],
    isSpinning: false,
    previousResults: []
};
let rouletteItems = [];
let rouletteCreated = false;
let isRouletteSpinning = false;

// Constants
const STORAGE_KEY = 'chzzk_bot_channel';
const REMEMBER_KEY = 'chzzk_bot_remember';

// ============================================
// Utility Functions
// ============================================
function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/`/g, '&#96;')
        .replace(/\//g, '&#x2F;');
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// ============================================
// Notification System
// ============================================
function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) return;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${escapeHTML(message)}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(notification);
    
    // 애니메이션 트리거
    requestAnimationFrame(() => {
        notification.classList.add('show');
    });
    
    // 5초 후 자동 제거
    setTimeout(() => {
        notification.classList.add('hide');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// ============================================
// Modal System
// ============================================
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// Alias functions for modal
function openModal(modalId) {
    showModal(modalId);
}

function closeModal(modalId) {
    hideModal(modalId);
}

// Close modal on backdrop click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('show');
        document.body.style.overflow = '';
    }
});

// Close modal on ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.show').forEach(modal => {
            modal.classList.remove('show');
        });
        document.body.style.overflow = '';
    }
});

// ============================================
// WebSocket Connection
// ============================================
function initWebSocket() {
    try {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}`;
        console.log('[WS] Connecting to:', wsUrl);
        
        socket = new WebSocket(wsUrl);
        window.socket = socket;
        
        socket.onopen = () => {
            console.log('[WS] Connected');
            
            // 즉시 데이터 요청
            setTimeout(() => {
                const requestMsg = { type: 'requestData', dataType: 'all' };
                console.log('[WS] Sending initial request:', requestMsg);
                socket.send(JSON.stringify(requestMsg));
                
                if (currentUser) {
                     socket.send(JSON.stringify({
                        type: 'connect',
                        data: { channel: currentUser.channelId || currentUser.id }
                    }));
                }
            }, 500);
        };
        
        socket.onclose = () => {
            console.log('[WS] Disconnected');
            updateBotStatus(false);
            window.socket = null;
            setTimeout(initWebSocket, 5000);
        };
        
        socket.onerror = (err) => console.error('[WS] Error:', err);
        
        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            } catch (err) {
                console.error('[WS] Parse error:', err);
            }
        };
    } catch (err) {
        console.error('[WS] Init error:', err);
    }
}

function sendWebSocket(data) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        // 보안 검사: 데이터를 변경하는 요청은 로그인 필수
        const writeOperations = ['update', 'add', 'remove', 'create', 'start', 'stop', 'save', 'set', 'perform', 'execute', 'clear', 'spin', 'control'];
        const isWriteOp = writeOperations.some(op => data.type.startsWith(op));

        if (isWriteOp && !currentUser) {
            console.warn('[Security] Blocked write operation due to no session:', data.type);
            showNotification('로그인이 필요한 기능입니다.', 'error');
            return;
        }

        socket.send(JSON.stringify(data));
    }
}

// ============================================
// WebSocket Message Handler
// ============================================
function handleWebSocketMessage(data) {
    console.log('[WS] Message:', data.type);
    
    switch (data.type) {
        case 'authStatus':
            handleAuthStatus(data);
            break;
            
        case 'error':
            if (data.requireAuth) {
                showLoginScreen();
            }
            showNotification(data.message || '오류가 발생했습니다', 'error');
            break;
            
        case 'connectResult':
            if (data.success) {
                updateBotStatus(true);
                if (data.channelInfo) {
                    updateStreamerInfo(data.channelInfo, data.liveStatus);
                }
                showNotification(data.message || '연결되었습니다', 'success');
                setTimeout(() => {
                    sendWebSocket({ type: 'requestData', dataType: 'all' });
                }, 500);
            } else {
                updateBotStatus(false);
                showNotification(data.message || '연결 실패', 'error');
            }
            break;
            
        case 'disconnectResult':
            updateBotStatus(false);
            showNotification(data.message || '연결 해제됨', 'info');
            clearAllData();
            break;
            
        case 'botStatus':
            updateBotStatus(data.payload?.connected || false);
            break;
            
        case 'commands':
        case 'commandsUpdate':
            updateCommands(data.data || data.payload || []);
            break;
            
        case 'macros':
        case 'macrosUpdate':
            updateMacros(data.data || data.payload || []);
            break;
            
        case 'counters':
        case 'countersUpdate':
            updateCounters(data.data || data.payload || []);
            break;
            
        case 'settingsUpdate':
            updateSettings(data.payload || {});
            break;
            
        case 'pointsUpdate':
            updatePointsData(data.payload || {});
            break;
            
        case 'songStateUpdate':
            updateSongState(data.payload);
            break;
            
        case 'participationStateUpdate':
            updateParticipationState(data.payload);
            break;
            
        case 'voteStateUpdate':
            updateVoteState(data.payload);
            break;
            
        case 'drawStateUpdate':
            updateDrawState(data.payload);
            break;
            
        case 'newChat':
            addChatMessage(data.payload);
            break;
            
        case 'commandResult':
        case 'macroResult':
        case 'counterResult':
        case 'songSettingResult':
        case 'voteResult':
        case 'participationResult':
            showNotification(data.message, data.success ? 'success' : 'error');
            break;
            
        case 'drawResult':
            if (data.success && data.payload?.winners) {
                displayDrawWinners(data.payload.winners);
            }
            showNotification(data.message, data.success ? 'success' : 'error');
            break;
    }
}

// ============================================
// Authentication (Token Based)
// ============================================
const SESSION_KEY = 'chzzk_session_token';

async function initAuth() {
    console.log('[Auth] Initializing...');
    
    // 1. URL 파라미터에서 토큰 확인 (로그인 직후 리다이렉트)
    const urlParams = new URLSearchParams(window.location.search);
    const urlSession = urlParams.get('session');
    
    if (urlSession) {
        console.log('[Auth] Found session in URL, saving...');
        localStorage.setItem(SESSION_KEY, urlSession);
        // URL 깨끗하게 정리
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // 중요: 서버가 DB에 세션을 저장할 시간을 줌 (1초 대기)
        await new Promise(r => setTimeout(r, 1000));
    }
    
    // 2. 저장된 토큰 가져오기
    const token = localStorage.getItem(SESSION_KEY);
    let sessionUser = null;
    
    if (token) {
        try {
            // 토큰 헤더 인증
            const res = await fetch('/api/auth/session', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                if (data.authenticated && data.user) {
                    sessionUser = data.user;
                } else {
                    console.log('[Auth] Token invalid or expired');
                    localStorage.removeItem(SESSION_KEY); // 만료된 토큰 삭제
                }
            }
        } catch (e) {
            console.error('[Auth] Session check failed:', e);
        }
    }
    
    if (sessionUser) {
        currentUser = sessionUser;
        updateUserProfile(currentUser);
        // 봇 연결 (토큰 포함)
        connectToBot(currentUser.channelId, token);
    } else {
        console.log('[Auth] No valid session found. Redirecting to home...');
        // 세션 없으면 홈으로 쫓아냄
        window.location.href = '/';
    }
}

function connectToBot(channelId, token) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        console.log('[Auth] Connecting to bot with channel:', channelId);
        socket.send(JSON.stringify({
            type: 'connect',
            data: { 
                channel: channelId,
                token: token // 소켓 연결 시에도 토큰 전송
            }
        }));
        
        setTimeout(() => {
            socket.send(JSON.stringify({ type: 'requestData', dataType: 'all' }));
        }, 1000);
    } else {
        setTimeout(() => connectToBot(channelId, token), 1000);
    }
}

function handleAuthStatus(data) {
    console.log('[Auth] Status:', data);
    
    if (data.authenticated) {
        if (data.legacyMode) {
            isLegacyMode = true;
            checkSavedLogin();
        } else if (data.user) {
            currentUser = data.user;
            updateUserProfile(data.user);
            hideLoginScreen();
            
            setTimeout(() => {
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({
                        type: 'connect',
                        data: { channel: currentUser.channelId }
                    }));
                }
            }, 500);
        }
    } else {
        showLoginScreen();
    }
}

function showLoginScreen() {
    if (isLegacyMode) {
        showLegacyLoginScreen();
    } else {
        showOAuthLoginScreen();
    }
}

function showOAuthLoginScreen() {
    const overlay = document.getElementById('login-overlay');
    const oauth = document.getElementById('login-oauth-state');
    const legacy = document.getElementById('login-legacy-state');
    const success = document.getElementById('login-success-state');
    
    if (overlay) overlay.classList.remove('hidden');
    if (oauth) oauth.style.display = 'block';
    if (legacy) legacy.style.display = 'none';
    if (success) success.style.display = 'none';
}

function showLegacyLoginScreen() {
    const overlay = document.getElementById('login-overlay');
    const oauth = document.getElementById('login-oauth-state');
    const legacy = document.getElementById('login-legacy-state');
    const success = document.getElementById('login-success-state');
    
    if (overlay) overlay.classList.remove('hidden');
    if (oauth) oauth.style.display = 'none';
    if (legacy) legacy.style.display = 'block';
    if (success) success.style.display = 'none';
    
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        const input = document.getElementById('login-channel-input');
        if (input) input.value = saved;
    }
}

function hideLoginScreen() {
    const overlay = document.getElementById('login-overlay');
    if (overlay) overlay.classList.add('hidden');
}

function showLoginSuccess(channelName) {
    const oauth = document.getElementById('login-oauth-state');
    const legacy = document.getElementById('login-legacy-state');
    const success = document.getElementById('login-success-state');
    const name = document.getElementById('success-channel-name');
    
    if (oauth) oauth.style.display = 'none';
    if (legacy) legacy.style.display = 'none';
    if (success) success.style.display = 'block';
    if (name) name.textContent = `${channelName} 연결됨`;
    
    setTimeout(() => {
        hideLoginScreen();
        setTimeout(() => {
            if (isLegacyMode && legacy) legacy.style.display = 'block';
            if (!isLegacyMode && oauth) oauth.style.display = 'block';
            if (success) success.style.display = 'none';
        }, 500);
    }, 1500);
}

function showLoginError(message) {
    const errorEl = isLegacyMode ? 
        document.getElementById('login-error-legacy') :
        document.getElementById('login-error');
    const errorText = isLegacyMode ?
        document.getElementById('login-error-text-legacy') :
        document.getElementById('login-error-text');
    const btn = document.getElementById('login-btn');
    
    if (errorEl) {
        errorEl.style.display = 'flex';
        errorEl.classList.add('show');
    }
    if (errorText) errorText.textContent = message;
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-plug"></i><span>연결</span>';
    }
    
    setTimeout(() => {
        if (errorEl) {
            errorEl.style.display = 'none';
            errorEl.classList.remove('show');
        }
    }, 5000);
}

function handleLegacyLogin() {
    const input = document.getElementById('login-channel-input');
    const remember = document.getElementById('login-remember');
    const btn = document.getElementById('login-btn');
    
    const channel = input?.value.trim();
    const shouldRemember = remember?.checked ?? true;
    
    if (!channel) {
        showLoginError('채널명을 입력해주세요');
        return;
    }
    
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>연결 중...</span>';
    }
    
    if (shouldRemember) {
        localStorage.setItem(STORAGE_KEY, channel);
        localStorage.setItem(REMEMBER_KEY, 'true');
    } else {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(REMEMBER_KEY, 'false');
    }
    
    connectToChannel(channel, true);
}

function checkSavedLogin() {
    const saved = localStorage.getItem(STORAGE_KEY);
    const shouldRemember = localStorage.getItem(REMEMBER_KEY) !== 'false';
    
    if (saved && shouldRemember) {
        autoConnectWithChannel(saved);
    } else {
        showLegacyLoginScreen();
    }
}

function autoConnectWithChannel(channel) {
    const overlay = document.getElementById('login-overlay');
    const input = document.getElementById('login-channel-input');
    const btn = document.getElementById('login-btn');
    
    if (overlay) overlay.classList.remove('hidden');
    if (input) input.value = channel;
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>연결 중...</span>';
    }
    
    waitForWebSocket(() => connectToChannel(channel, true));
}

function waitForWebSocket(callback, maxAttempts = 20) {
    let attempts = 0;
    const check = () => {
        attempts++;
        if (socket && socket.readyState === WebSocket.OPEN) {
            callback();
        } else if (attempts < maxAttempts) {
            setTimeout(check, 250);
        } else {
            showLoginError('서버 연결 실패');
        }
    };
    check();
}

function connectToChannel(channel, isFromLogin = false) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        const originalHandler = socket.onmessage;
        
        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                if (data.type === 'connectResult') {
                    if (data.success) {
                        if (isFromLogin) {
                            showLoginSuccess(channel);
                        } else {
                            hideLoginScreen();
                        }
                    } else {
                        localStorage.removeItem(STORAGE_KEY);
                        showLoginError(data.message || '연결 실패');
                    }
                }
                
                handleWebSocketMessage(data);
            } catch (e) {
                console.error('Parse error:', e);
            }
        };
        
        socket.send(JSON.stringify({
            type: 'connect',
            data: { channel }
        }));
    } else {
        showLoginError('서버 미연결');
    }
}

async function handleLogout() {
    if (confirm('로그아웃 하시겠습니까?')) {
        try {
            await fetch('/auth/logout', { method: 'POST' });
        } catch (e) {}
        
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem('chzzk_session_token'); // 토큰 삭제
        currentUser = null;
        
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'disconnect' }));
        }
        
        updateBotStatus(false);
        
        // 메인 페이지로 이동
        window.location.href = '/';
    }
}

// ============================================
// User Profile Update
// ============================================
function updateUserProfile(user) {
    if (!user) return;
    
    // Header
    const headerProfile = document.getElementById('header-profile');
    const headerAvatar = document.getElementById('header-avatar');
    const headerUsername = document.getElementById('header-username');
    
    if (headerProfile) headerProfile.style.display = 'flex';
    if (headerAvatar && user.channelImageUrl) {
        headerAvatar.style.backgroundImage = `url(${user.channelImageUrl})`;
    }
    if (headerUsername) headerUsername.textContent = user.channelName || '';
    
    // Sidebar
    const sidebarProfile = document.getElementById('sidebar-profile');
    const sidebarAvatar = document.getElementById('sidebar-avatar');
    const sidebarName = document.getElementById('sidebar-name');
    
    if (sidebarProfile) sidebarProfile.style.display = 'flex';
    if (sidebarAvatar && user.channelImageUrl) {
        sidebarAvatar.style.backgroundImage = `url(${user.channelImageUrl})`;
    }
    if (sidebarName) sidebarName.textContent = user.channelName || '';
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.style.display = 'flex';
}

// ============================================
// Bot Status
// ============================================
function updateBotStatus(connected) {
    botConnected = connected;
    updateBotStatusUI(isChatEnabled);
}

function updateBotStatusUI(enabled) {
    isChatEnabled = enabled;
    
    const indicator = document.getElementById('bot-status-indicator');
    const text = document.getElementById('bot-status-text');
    const toggle = document.getElementById('bot-chat-toggle');
    
    if (toggle) toggle.checked = enabled;
    
    if (!botConnected) {
        if (indicator) indicator.className = 'status-indicator offline'; // 회색
        if (text) text.textContent = '봇 미연결';
        return;
    }
    
    if (enabled) {
        if (indicator) indicator.className = 'status-indicator online'; // 초록색
        if (text) text.textContent = '봇 작동중';
    } else {
        if (indicator) indicator.className = 'status-indicator idle'; // 노란색 (CSS 추가 필요)
        if (text) text.textContent = '봇 대기중';
    }
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.style.display = botConnected ? 'flex' : 'none';
    }
}

// ============================================
// Streamer Info Update
// ============================================
function updateStreamerInfo(channel, live) {
    currentChannelData = { channel, live };
    
    // Channel Avatar
    const channelAvatar = document.getElementById('channel-avatar');
    if (channelAvatar && channel?.channelImageUrl) {
        channelAvatar.style.backgroundImage = `url(${channel.channelImageUrl})`;
    }
    
    // Channel Name
    const channelName = document.getElementById('channel-name');
    if (channelName) {
        channelName.textContent = channel?.channelName || '채널명';
    }
    
    // Follower Count
    const followerCount = document.getElementById('follower-count');
    if (followerCount && channel) {
        followerCount.innerHTML = `<i class="fas fa-heart"></i><span>${formatNumber(channel.followerCount || 0)} 팔로워</span>`;
    }
    
    // Stream Status
    const streamStatus = document.getElementById('stream-status');
    if (streamStatus) {
        const isLive = live?.status === 'OPEN';
        const badge = streamStatus.querySelector('.status-badge');
        const viewerCount = streamStatus.querySelector('.viewer-count');
        
        if (badge) {
            badge.className = `status-badge ${isLive ? 'live' : 'offline'}`;
            badge.textContent = isLive ? '라이브' : '오프라인';
        }
        if (viewerCount) {
            viewerCount.textContent = isLive ? `${formatNumber(live.concurrentUserCount || 0)}명` : '';
        }
    }
    
    // Stream Title
    const streamTitle = document.getElementById('stream-title');
    if (streamTitle) {
        streamTitle.textContent = live?.liveTitle || '방송 제목';
    }
    
    // Stream Category
    const streamCategory = document.getElementById('stream-category');
    if (streamCategory) {
        streamCategory.innerHTML = `<i class="fas fa-gamepad"></i><span>${live?.category || '카테고리'}</span>`;
    }
    
    // Header Profile
    const headerAvatar = document.getElementById('header-avatar');
    const headerUsername = document.getElementById('header-username');
    const headerProfile = document.getElementById('header-profile');
    
    if (headerProfile) headerProfile.style.display = 'flex';
    if (headerAvatar && channel?.channelImageUrl) {
        headerAvatar.style.backgroundImage = `url(${channel.channelImageUrl})`;
    }
    if (headerUsername) {
        headerUsername.textContent = channel?.channelName || '';
    }
    
    // Sidebar Profile
    const sidebarProfile = document.getElementById('sidebar-profile');
    const sidebarAvatar = document.getElementById('sidebar-avatar');
    const sidebarName = document.getElementById('sidebar-name');
    const sidebarStatusDot = document.getElementById('sidebar-status-dot');
    const sidebarStatusText = document.getElementById('sidebar-status-text');
    
    if (sidebarProfile) sidebarProfile.style.display = 'flex';
    if (sidebarAvatar && channel?.channelImageUrl) {
        sidebarAvatar.style.backgroundImage = `url(${channel.channelImageUrl})`;
    }
    if (sidebarName) sidebarName.textContent = channel?.channelName || '';
    if (sidebarStatusDot) {
        const isLive = live?.status === 'OPEN';
        sidebarStatusDot.className = `status-dot ${isLive ? 'live' : 'online'}`;
    }
    if (sidebarStatusText) {
        const isLive = live?.status === 'OPEN';
        sidebarStatusText.textContent = isLive ? '라이브 중' : '연결됨';
    }
}

// ============================================
// Clear All Data
// ============================================
function clearAllData() {
    commands = [];
    macros = [];
    counters = [];
    songQueue = [];
    currentVote = null;
    currentChannelData = null;
    
    updateCommands([]);
    updateMacros([]);
    updateCounters([]);
    updateSongState(null);
    updateVoteState(null);
    
    // Reset streamer info
    updateStreamerInfo(null, null);
}

// ============================================
// Tab Navigation
// ============================================
function switchTab(tabName) {
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    const selectedTab = document.getElementById(tabName + '-tab');
    if (selectedTab) selectedTab.classList.add('active');
    
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const selectedNav = document.querySelector(`[data-tab="${tabName}"]`);
    if (selectedNav) selectedNav.classList.add('active');
    
    // Update header title
    const titles = {
        'dashboard': '대시보드',
        'commands': '명령어 관리',
        'macros': '매크로 관리',
        'counters': '카운터 관리',
        'songs': '신청곡 관리',
        'votes': '투표',
        'participation': '시청자 참여',
        'points': '포인트 관리'
    };
    const headerTitle = document.getElementById('header-title');
    if (headerTitle) headerTitle.textContent = titles[tabName] || tabName;
    
    // Close mobile sidebar
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('open');
}

// ============================================
// Commands Management
// ============================================
function updateCommands(list) {
    commands = list || [];
    const container = document.getElementById('commands-list');
    const stat = document.getElementById('stat-commands');
    
    if (stat) stat.textContent = commands.length;
    if (!container) return;
    
    if (commands.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-terminal"></i>
                <p>등록된 명령어가 없습니다</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = commands.map((cmd, index) => {
        const triggers = cmd.triggers || (cmd.trigger ? [cmd.trigger] : []);
        const displayTrigger = triggers.join(', ') || '없음';
        
        return `
            <div class="item-card ${cmd.enabled ? '' : 'disabled'}">
                <div class="item-info">
                    <span class="item-trigger">${escapeHTML(displayTrigger)}</span>
                    <span class="item-response">${escapeHTML(cmd.response || '')}</span>
                </div>
                <div class="item-actions">
                    <div class="item-toggle ${cmd.enabled ? 'active' : ''}" 
                         onclick="toggleCommand(${index})" title="${cmd.enabled ? '비활성화' : '활성화'}"></div>
                    <button class="btn-icon" onclick="editCommand(${index})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-danger" onclick="deleteCommand(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function addCommand() {
    const trigger = document.getElementById('new-command-trigger')?.value.trim();
    const response = document.getElementById('new-command-response')?.value.trim();
    
    if (!trigger || !response) {
        showNotification('명령어와 응답을 모두 입력해주세요', 'error');
        return;
    }
    
    if (!trigger.startsWith('!')) {
        showNotification('명령어는 !로 시작해야 합니다', 'error');
        return;
    }
    
    sendWebSocket({
        type: 'addCommand',
        data: { trigger, response }
    });
    
    document.getElementById('new-command-trigger').value = '';
    document.getElementById('new-command-response').value = '';
    hideModal('add-command-modal');
}

function editCommand(index) {
    const cmd = commands[index];
    if (!cmd) return;
    
    const triggers = cmd.triggers || (cmd.trigger ? [cmd.trigger] : []);
    
    document.getElementById('edit-command-trigger').value = triggers.join('/');
    document.getElementById('edit-command-response').value = cmd.response || '';
    
    window.editingCommandIndex = index;
    showModal('edit-command-modal');
}

function updateCommand() {
    const index = window.editingCommandIndex;
    const cmd = commands[index];
    if (!cmd) return;
    
    const newTrigger = document.getElementById('edit-command-trigger')?.value.trim();
    const newResponse = document.getElementById('edit-command-response')?.value.trim();
    
    if (!newTrigger || !newResponse) {
        showNotification('명령어와 응답을 모두 입력해주세요', 'error');
        return;
    }
    
    const triggers = cmd.triggers || (cmd.trigger ? [cmd.trigger] : []);
    
    sendWebSocket({
        type: 'updateCommand',
        data: {
            oldTrigger: triggers[0],
            newTrigger: newTrigger,
            response: newResponse,
            enabled: cmd.enabled
        }
    });
    
    hideModal('edit-command-modal');
}

function toggleCommand(index) {
    const cmd = commands[index];
    if (!cmd) return;
    
    const triggers = cmd.triggers || (cmd.trigger ? [cmd.trigger] : []);
    
    sendWebSocket({
        type: 'updateCommand',
        data: {
            oldTrigger: triggers[0],
            newTrigger: triggers.join('/'),
            response: cmd.response,
            enabled: !cmd.enabled
        }
    });
}

function deleteCommand(index) {
    const cmd = commands[index];
    if (!cmd) return;
    
    const triggers = cmd.triggers || (cmd.trigger ? [cmd.trigger] : []);
    
    if (confirm(`"${triggers[0]}" 명령어를 삭제하시겠습니까?`)) {
        sendWebSocket({
            type: 'removeCommand',
            data: { trigger: triggers[0] }
        });
    }
}

// ============================================
// Macros Management
// ============================================
function updateMacros(list) {
    macros = list || [];
    const container = document.getElementById('macros-list');
    
    if (!container) return;
    
    if (macros.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clock"></i>
                <p>등록된 매크로가 없습니다</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = macros.map((macro, index) => `
        <div class="item-card ${macro.enabled ? '' : 'disabled'}">
            <div class="item-info">
                <span class="item-interval">${macro.interval || 5}분</span>
                <span class="item-response">${escapeHTML(macro.message || '')}</span>
            </div>
            <div class="item-actions">
                <div class="item-toggle ${macro.enabled ? 'active' : ''}" 
                     onclick="toggleMacro(${index})" title="${macro.enabled ? '비활성화' : '활성화'}"></div>
                <button class="btn-icon" onclick="editMacro(${index})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-danger" onclick="deleteMacro(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function addMacro() {
    const interval = parseInt(document.getElementById('new-macro-interval')?.value) || 5;
    const message = document.getElementById('new-macro-message')?.value.trim();
    
    if (!message) {
        showNotification('메시지를 입력해주세요', 'error');
        return;
    }
    
    if (interval < 1) {
        showNotification('간격은 1분 이상이어야 합니다', 'error');
        return;
    }
    
    sendWebSocket({
        type: 'addMacro',
        data: { interval, message }
    });
    
    document.getElementById('new-macro-interval').value = '5';
    document.getElementById('new-macro-message').value = '';
    hideModal('add-macro-modal');
}

function editMacro(index) {
    const macro = macros[index];
    if (!macro) return;
    
    document.getElementById('edit-macro-interval').value = macro.interval || 5;
    document.getElementById('edit-macro-message').value = macro.message || '';
    
    window.editingMacroIndex = index;
    showModal('edit-macro-modal');
}

function updateMacro() {
    const index = window.editingMacroIndex;
    const macro = macros[index];
    if (!macro) return;
    
    const newInterval = parseInt(document.getElementById('edit-macro-interval')?.value) || 5;
    const newMessage = document.getElementById('edit-macro-message')?.value.trim();
    
    if (!newMessage) {
        showNotification('메시지를 입력해주세요', 'error');
        return;
    }
    
    sendWebSocket({
        type: 'updateMacro',
        data: {
            id: macro.id,
            interval: newInterval,
            message: newMessage,
            enabled: macro.enabled
        }
    });
    
    hideModal('edit-macro-modal');
}

function toggleMacro(index) {
    const macro = macros[index];
    if (!macro) return;
    
    sendWebSocket({
        type: 'updateMacro',
        data: {
            id: macro.id,
            interval: macro.interval,
            message: macro.message,
            enabled: !macro.enabled
        }
    });
}

function deleteMacro(index) {
    const macro = macros[index];
    if (!macro) return;
    
    if (confirm('이 매크로를 삭제하시겠습니까?')) {
        sendWebSocket({
            type: 'removeMacro',
            data: { id: macro.id }
        });
    }
}

// ============================================
// Counters Management
// ============================================
function updateCounters(list) {
    counters = list || [];
    const container = document.getElementById('counters-list');
    
    if (!container) return;
    
    if (counters.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calculator"></i>
                <p>등록된 카운터가 없습니다</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = counters.map((counter, index) => {
        const triggers = counter.triggers || (counter.trigger ? [counter.trigger] : []);
        const displayTrigger = triggers.join(', ') || '없음';
        const count = counter.state?.totalCount || 0;
        
        return `
            <div class="item-card ${counter.enabled ? '' : 'disabled'}">
                <div class="item-info">
                    <span class="item-trigger">${escapeHTML(displayTrigger)}</span>
                    <span class="item-response">${escapeHTML(counter.response || '')}</span>
                    <span class="item-count">#${count}</span>
                </div>
                <div class="item-actions">
                    <div class="item-toggle ${counter.enabled ? 'active' : ''}" 
                         onclick="toggleCounter(${index})" title="${counter.enabled ? '비활성화' : '활성화'}"></div>
                    <button class="btn-icon" onclick="editCounter(${index})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-danger" onclick="deleteCounter(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function addCounter() {
    const trigger = document.getElementById('new-counter-trigger')?.value.trim();
    const response = document.getElementById('new-counter-response')?.value.trim();
    
    if (!trigger || !response) {
        showNotification('명령어와 응답을 모두 입력해주세요', 'error');
        return;
    }
    
    if (!trigger.startsWith('!')) {
        showNotification('명령어는 !로 시작해야 합니다', 'error');
        return;
    }
    
    sendWebSocket({
        type: 'addCounter',
        data: { trigger, response }
    });
    
    document.getElementById('new-counter-trigger').value = '';
    document.getElementById('new-counter-response').value = '';
    hideModal('add-counter-modal');
}

function editCounter(index) {
    const counter = counters[index];
    if (!counter) return;
    
    const triggers = counter.triggers || (counter.trigger ? [counter.trigger] : []);
    
    document.getElementById('edit-counter-trigger').value = triggers.join('/');
    document.getElementById('edit-counter-response').value = counter.response || '';
    document.getElementById('edit-counter-count').value = counter.state?.totalCount || 0;
    
    window.editingCounterIndex = index;
    showModal('edit-counter-modal');
}

function updateCounter() {
    const index = window.editingCounterIndex;
    const counter = counters[index];
    if (!counter) return;
    
    const newTrigger = document.getElementById('edit-counter-trigger')?.value.trim();
    const newResponse = document.getElementById('edit-counter-response')?.value.trim();
    const newCount = parseInt(document.getElementById('edit-counter-count')?.value) || 0;
    
    if (!newTrigger || !newResponse) {
        showNotification('명령어와 응답을 모두 입력해주세요', 'error');
        return;
    }
    
    const triggers = counter.triggers || (counter.trigger ? [counter.trigger] : []);
    
    sendWebSocket({
        type: 'updateCounter',
        data: {
            oldTrigger: triggers[0],
            newTrigger: newTrigger,
            response: newResponse,
            enabled: counter.enabled,
            count: newCount
        }
    });
    
    hideModal('edit-counter-modal');
}

function toggleCounter(index) {
    const counter = counters[index];
    if (!counter) return;
    
    const triggers = counter.triggers || (counter.trigger ? [counter.trigger] : []);
    
    sendWebSocket({
        type: 'updateCounter',
        data: {
            oldTrigger: triggers[0],
            newTrigger: triggers.join('/'),
            response: counter.response,
            enabled: !counter.enabled,
            count: counter.state?.totalCount || 0
        }
    });
}

function deleteCounter(index) {
    const counter = counters[index];
    if (!counter) return;
    
    const triggers = counter.triggers || (counter.trigger ? [counter.trigger] : []);
    
    if (confirm(`"${triggers[0]}" 카운터를 삭제하시겠습니까?`)) {
        sendWebSocket({
            type: 'removeCounter',
            data: { trigger: triggers[0] }
        });
    }
}

// ============================================
// Settings & Points Updates
// ============================================
function updateSettings(settings) {
    if (!settings) return;
    
    // Bot Chat Toggle
    const chatToggle = document.getElementById('bot-chat-toggle');
    if (chatToggle && settings.chatEnabled !== undefined) {
        chatToggle.checked = settings.chatEnabled;
    }
    
    // Song settings
    const modeSelect = document.querySelector(`input[name="songRequestMode"][value="${settings.songRequestMode}"]`);
    if (modeSelect) modeSelect.checked = true;
    
    updateSongSettingsUI(settings.songRequestMode);

    const cooldownInput = document.getElementById('song-cooldown');
    const minDonationInput = document.getElementById('song-min-donation');
    
    if (cooldownInput && settings.songRequestCooldown !== undefined) {
        cooldownInput.value = settings.songRequestCooldown;
    }
    if (minDonationInput && settings.minDonationAmount !== undefined) {
        minDonationInput.value = settings.minDonationAmount;
    }

    // Points settings
    const pointsPerChat = document.getElementById('points-per-chat');
    if (pointsPerChat) pointsPerChat.value = settings.pointsPerChat || 1;
    
    const pointsCooldown = document.getElementById('points-cooldown');
    if (pointsCooldown) pointsCooldown.value = settings.pointsCooldown || 60;
}

// UI 상태 업데이트 함수 (비활성화 처리)
function updateSongSettingsUI(mode) {
    const cooldownGroup = document.getElementById('song-cooldown')?.closest('.setting-item');
    const donationGroup = document.getElementById('song-min-donation')?.closest('.setting-item');
    
    if (cooldownGroup) {
        if (mode === 'off' || mode === 'donation') {
            cooldownGroup.classList.add('disabled-group');
        } else {
            cooldownGroup.classList.remove('disabled-group');
        }
    }
    
    if (donationGroup) {
        if (mode === 'off' || mode === 'cooldown' || mode === 'all') {
            donationGroup.classList.add('disabled-group');
        } else {
            donationGroup.classList.remove('disabled-group');
        }
    }
}

function updatePointsData(pointsData) {
    console.log('[Points] Received points data:', pointsData);
    if (!pointsData) return;
    
    // Update points ranking
    const rankingList = document.getElementById('points-ranking');
    if (!rankingList) return;
    
    const leaderboard = pointsData.leaderboard || [];
    
    if (leaderboard.length === 0) {
        rankingList.innerHTML = '<div class="empty-state">데이터가 없습니다</div>';
        return;
    }
    
    rankingList.innerHTML = leaderboard.slice(0, 10).map((entry, index) => `
        <div class="ranking-item">
            <span class="rank">#${index + 1}</span>
            <span class="name">${escapeHTML(entry.nickname || entry.name || '알 수 없음')}</span>
            <span class="points">${entry.points || 0}P</span>
        </div>
    `).join('');
}

// ============================================
// Songs Management
// ============================================
function updateSongState(state) {
    if (!state) {
        document.getElementById('current-song').innerHTML = '<div class="no-song">재생 중인 곡이 없습니다</div>';
        document.getElementById('song-queue-list').innerHTML = '<div class="empty-state">대기열이 비어있습니다</div>';
        document.getElementById('queue-count').textContent = '0';
        document.getElementById('stat-songs').textContent = '0';
        return;
    }
    
    const { queue, currentSong, isPlaying, settings } = state;
    
    // Update queue count
    const queueCount = queue?.length || 0;
    document.getElementById('queue-count').textContent = queueCount;
    document.getElementById('stat-songs').textContent = queueCount;
    
    // Update current song
    const currentSongEl = document.getElementById('current-song');
    if (currentSong) {
        currentSongEl.innerHTML = `
            <div class="song-title">${escapeHTML(currentSong.title || '제목 없음')}</div>
            <div class="song-requester">신청자: ${escapeHTML(currentSong.requester || '알 수 없음')}</div>
        `;
    } else {
        currentSongEl.innerHTML = '<div class="no-song">재생 중인 곡이 없습니다</div>';
    }
    
    // Update play/pause button
    const playPauseBtn = document.getElementById('play-pause-btn');
    if (playPauseBtn) {
        playPauseBtn.disabled = !currentSong;
        playPauseBtn.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
    }
    
    // Update queue list
    const queueList = document.getElementById('song-queue-list');
    if (queue && queue.length > 0) {
        queueList.innerHTML = queue.map((song, index) => `
            <div class="queue-item">
                <div class="song-info">
                    <div class="song-title">${escapeHTML(song.title || '제목 없음')}</div>
                    <div class="song-requester">신청자: ${escapeHTML(song.requester || '알 수 없음')}</div>
                </div>
                <div class="item-actions">
                    <button class="btn-icon" onclick="playSongFromQueue('${song.id}')" title="재생">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="btn-icon btn-danger" onclick="removeSongFromQueue('${song.id}')" title="삭제">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `).join('');
    } else {
        queueList.innerHTML = '<div class="empty-state">대기열이 비어있습니다</div>';
    }
    
    // Update settings
    if (settings) {
        const cooldownInput = document.getElementById('song-cooldown');
        const minDonationInput = document.getElementById('song-min-donation');
        
        if (cooldownInput && settings.cooldown !== undefined) {
            cooldownInput.value = settings.cooldown;
        }
        if (minDonationInput && settings.minDonation !== undefined) {
            minDonationInput.value = settings.minDonation;
        }
    }
}

function playSongFromQueue(songId) {
    sendWebSocket({ type: 'controlMusic', action: 'playFromQueue', payload: songId });
}

function removeSongFromQueue(songId) {
    sendWebSocket({ type: 'controlMusic', action: 'removeFromQueue', payload: songId });
}

function skipSong() {
    sendWebSocket({ type: 'controlMusic', action: 'skip' });
}

function stopSong() {
    sendWebSocket({ type: 'controlMusic', action: 'deleteCurrent' });
}

function togglePlayPause() {
    sendWebSocket({ type: 'controlMusic', action: 'togglePlayPause' });
}

function saveSongSettings() {
    const cooldown = parseInt(document.getElementById('song-cooldown')?.value) || 30;
    const minDonation = parseInt(document.getElementById('song-min-donation')?.value) || 0;
    
    sendWebSocket({
        type: 'updateSongSettings',
        data: { cooldown, minDonation }
    });
    
    showNotification('설정이 저장되었습니다', 'success');
}

function openPlayer() {
    window.open('/player.html', '_blank');
}

// ============================================
// Vote System
// ============================================
let voteTimerInterval = null;

function updateVoteState(state) {
    currentVote = state?.currentVote || null;
    
    updateCurrentVoteDisplay();
    updateVoteHistory(state?.votesHistory || []);
    
    // Update stats
    const statVotes = document.getElementById('stat-votes');
    if (statVotes) {
        statVotes.textContent = currentVote ? '1' : '0';
    }
    
    setupVoteTimer();
}

function updateCurrentVoteDisplay() {
    const display = document.getElementById('current-vote-display');
    const controls = document.getElementById('vote-controls');
    const startBtn = document.getElementById('start-vote-btn');
    const endBtn = document.getElementById('end-vote-btn');
    
    if (!display) return;
    
    if (!currentVote) {
        display.innerHTML = '<div class="empty-state">진행 중인 투표가 없습니다</div>';
        if (controls) controls.style.display = 'none';
        return;
    }
    
    const totalVotes = Object.values(currentVote.results || {}).reduce((sum, c) => sum + c, 0);
    const remainingTime = currentVote.startTime && currentVote.isActive ?
        Math.max(0, (currentVote.durationSeconds || 60) - Math.floor((Date.now() - currentVote.startTime) / 1000)) : 0;
    
    display.innerHTML = `
        <div class="vote-active">
            <div class="vote-header">
                <span class="status-badge ${currentVote.isActive ? 'live' : 'offline'}">
                    ${currentVote.isActive ? '진행 중' : '대기 중'}
                </span>
                ${currentVote.isActive ? `<span class="vote-timer">${remainingTime}초</span>` : ''}
            </div>
            <h4 class="vote-question">${escapeHTML(currentVote.question || '')}</h4>
            <div class="vote-options">
                ${(currentVote.options || []).map((opt, i) => {
                    const votes = currentVote.results?.[opt.id] || 0;
                    const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                    return `
                        <div class="vote-option-result">
                            <div class="option-info">
                                <span class="option-number">${i + 1}</span>
                                <span class="option-text">${escapeHTML(opt.text || '')}</span>
                                <span class="option-votes">${votes}표 (${pct}%)</span>
                            </div>
                            <div class="option-bar">
                                <div class="option-fill" style="width: ${pct}%"></div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="vote-footer">
                <span>총 ${totalVotes}표</span>
                <span>참여자 ${currentVote.voters?.length || 0}명</span>
            </div>
        </div>
    `;
    
    if (controls) controls.style.display = 'flex';
    if (startBtn) startBtn.style.display = currentVote.isActive ? 'none' : 'inline-flex';
    if (endBtn) endBtn.style.display = currentVote.isActive ? 'inline-flex' : 'none';
}

function setupVoteTimer() {
    if (voteTimerInterval) {
        clearInterval(voteTimerInterval);
        voteTimerInterval = null;
    }
    
    if (currentVote?.isActive && currentVote?.startTime) {
        voteTimerInterval = setInterval(() => {
            if (!currentVote?.isActive) {
                clearInterval(voteTimerInterval);
                voteTimerInterval = null;
                return;
            }
            updateCurrentVoteDisplay();
        }, 1000);
    }
}

function updateVoteHistory(history) {
    const container = document.getElementById('vote-history');
    if (!container) return;
    
    const completed = (history || []).filter(v => !v.isActive && v.startTime);
    
    if (completed.length === 0) {
        container.innerHTML = '<div class="empty-state">기록이 없습니다</div>';
        return;
    }
    
    container.innerHTML = completed.map(vote => `
        <div class="vote-history-item">
            <div class="vote-history-header">
                <span class="vote-question">${escapeHTML(vote.question || '')}</span>
                <div class="vote-history-actions">
                    <button class="btn-icon" onclick="showVoteDetails('${vote.id}')" title="상세보기">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon btn-danger" onclick="deleteVoteRecord('${vote.id}')" title="삭제">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="vote-history-results">
                ${(vote.options || []).map(opt => {
                    const votes = vote.results?.[opt.id] || 0;
                    const total = Object.values(vote.results || {}).reduce((s, c) => s + c, 0);
                    const pct = total > 0 ? Math.round((votes / total) * 100) : 0;
                    return `<span>${escapeHTML(opt.text)}: ${votes}표 (${pct}%)</span>`;
                }).join(' | ')}
            </div>
            <div class="vote-history-meta">
                <span>${vote.voters?.length || 0}명 참여</span>
                <span>${vote.startTime ? new Date(vote.startTime).toLocaleDateString('ko-KR') : ''}</span>
            </div>
        </div>
    `).join('');
}

function addVoteOption() {
    const container = document.getElementById('vote-options-container');
    if (!container) return;
    
    const count = container.children.length + 1;
    const item = document.createElement('div');
    item.className = 'vote-option-item';
    item.innerHTML = `
        <span class="option-number">${count}</span>
        <input type="text" class="form-input" placeholder="항목 ${count}">
        <button class="btn-icon btn-danger" onclick="removeVoteOption(this)">
            <i class="fas fa-trash"></i>
        </button>
    `;
    container.appendChild(item);
    renumberVoteOptions();
}

function removeVoteOption(btn) {
    const container = document.getElementById('vote-options-container');
    if (container && container.children.length > 2) {
        btn.closest('.vote-option-item').remove();
        renumberVoteOptions();
    } else {
        showNotification('최소 2개의 항목이 필요합니다', 'error');
    }
}

function renumberVoteOptions() {
    const container = document.getElementById('vote-options-container');
    if (!container) return;
    
    Array.from(container.children).forEach((item, index) => {
        const num = item.querySelector('.option-number');
        const input = item.querySelector('input');
        if (num) num.textContent = index + 1;
        if (input && !input.value) input.placeholder = `항목 ${index + 1}`;
    });
}

function createVote() {
    const question = document.getElementById('vote-question')?.value.trim();
    const duration = parseInt(document.getElementById('vote-duration')?.value) || 60;
    const inputs = document.querySelectorAll('#vote-options-container input');
    
    if (!question) {
        showNotification('투표 제목을 입력해주세요', 'error');
        return;
    }
    
    if (duration < 10) {
        showNotification('투표 시간은 최소 10초입니다', 'error');
        return;
    }
    
    const options = Array.from(inputs).map(i => i.value.trim()).filter(v => v);
    
    if (options.length < 2) {
        showNotification('최소 2개의 항목이 필요합니다', 'error');
        return;
    }
    
    sendWebSocket({
        type: 'createVote',
        data: { question, options, durationSeconds: duration }
    });
    
    showNotification('투표가 생성되었습니다', 'success');
}

function startVote() {
    sendWebSocket({ type: 'startVote' });
}

function endVote() {
    sendWebSocket({ type: 'endVote' });
}

function resetVote() {
    document.getElementById('vote-question').value = '';
    document.getElementById('vote-duration').value = '60';
    
    const container = document.getElementById('vote-options-container');
    if (container) {
        container.innerHTML = `
            <div class="vote-option-item">
                <span class="option-number">1</span>
                <input type="text" class="form-input" placeholder="항목 1">
                <button class="btn-icon btn-danger" onclick="removeVoteOption(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="vote-option-item">
                <span class="option-number">2</span>
                <input type="text" class="form-input" placeholder="항목 2">
                <button class="btn-icon btn-danger" onclick="removeVoteOption(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }
    
    sendWebSocket({ type: 'resetVote' });
    showNotification('초기화되었습니다', 'info');
}

function showVoteDetails(voteId) {
    sendWebSocket({ type: 'getVoteDetails', voteId });
}

async function deleteVoteRecord(voteId) {
    if (!confirm('이 기록을 삭제하시겠습니까?')) return;
    
    try {
        const res = await fetch(`/api/vote/${voteId}`, { method: 'DELETE' });
        if (res.ok) {
            showNotification('삭제되었습니다', 'success');
            sendWebSocket({ type: 'requestData', dataType: 'votes' });
        } else {
            showNotification('삭제 실패', 'error');
        }
    } catch (e) {
        showNotification('삭제 중 오류', 'error');
    }
}

function clearVoteHistory() {
    if (!confirm('모든 투표 기록을 삭제하시겠습니까?')) return;
    sendWebSocket({ type: 'clearVoteHistory' });
}


// ============================================
// Draw System (시청자 추첨)
// ============================================
function updateDrawState(state) {
    if (!state) return;
    
    draw = {
        isActive: state.isActive || false,
        keyword: state.keyword || '!참여',
        participants: state.participants || [],
        previousWinners: state.previousWinners || []
    };
    
    updateDrawDisplay();
}

function updateDrawDisplay() {
    const keywordInput = document.getElementById('draw-keyword');
    const participantsList = document.getElementById('draw-participants');
    const winnersList = document.getElementById('draw-winners');
    const participantCount = document.getElementById('draw-participant-count');
    const startBtn = document.getElementById('draw-start-btn');
    const drawBtn = document.getElementById('draw-perform-btn');
    
    // 키워드 업데이트
    if (keywordInput && draw.keyword) {
        keywordInput.value = draw.keyword;
    }
    
    // 참여자 수 업데이트
    if (participantCount) {
        participantCount.textContent = draw.participants.length;
    }
    
    // 버튼 상태
    if (startBtn) {
        startBtn.innerHTML = draw.isActive ? 
            '<i class="fas fa-stop"></i> 참여 중지' : 
            '<i class="fas fa-play"></i> 참여 시작';
        startBtn.className = draw.isActive ? 'btn btn-danger' : 'btn btn-primary';
    }
    
    if (drawBtn) {
        drawBtn.disabled = draw.participants.length === 0;
    }
    
    // 참여자 목록
    if (participantsList) {
        if (draw.participants.length > 0) {
            participantsList.innerHTML = draw.participants.map((p, i) => `
                <div class="participant-item">
                    <span class="participant-number">${i + 1}</span>
                    <span class="participant-name">${escapeHTML(p.nickname || p.name || '익명')}</span>
                    <button class="btn-icon btn-danger" onclick="removeDrawParticipant('${p.odaId || p.id}')" title="제외">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('');
        } else {
            participantsList.innerHTML = '<div class="empty-state">참여자가 없습니다</div>';
        }
    }
    
    // 당첨자 목록
    if (winnersList) {
        if (draw.previousWinners && draw.previousWinners.length > 0) {
            winnersList.innerHTML = draw.previousWinners.map((w, i) => `
                <div class="winner-item">
                    <span class="winner-rank">${i + 1}등</span>
                    <span class="winner-name">${escapeHTML(w.nickname || w.name || '익명')}</span>
                    <span class="winner-time">${new Date(w.time || Date.now()).toLocaleTimeString()}</span>
                </div>
            `).join('');
        } else {
            winnersList.innerHTML = '<div class="empty-state">당첨자가 없습니다</div>';
        }
    }
}

function saveDrawKeyword() {
    const keyword = document.getElementById('draw-keyword')?.value.trim();
    if (!keyword) {
        showNotification('키워드를 입력해주세요', 'error');
        return;
    }
    
    sendWebSocket({
        type: 'updateDrawSettings',
        data: { keyword }
    });
    
    showNotification('키워드가 저장되었습니다', 'success');
}

function toggleDraw() {
    if (draw.isActive) {
        sendWebSocket({ type: 'stopDraw' });
        showNotification('참여가 중지되었습니다', 'info');
    } else {
        const keyword = document.getElementById('draw-keyword')?.value.trim() || '!참여';
        sendWebSocket({ 
            type: 'startDraw',
            data: { keyword }
        });
        showNotification('참여가 시작되었습니다', 'success');
    }
}

function performDraw() {
    const winnerCount = parseInt(document.getElementById('draw-winner-count')?.value) || 1;
    
    if (draw.participants.length === 0) {
        showNotification('참여자가 없습니다', 'error');
        return;
    }
    
    if (winnerCount > draw.participants.length) {
        showNotification(`참여자(${draw.participants.length}명)보다 당첨자 수가 많습니다`, 'error');
        return;
    }
    
    sendWebSocket({
        type: 'performDraw',
        data: { winnerCount }
    });
}

function displayDrawWinners(winners) {
    if (!winners || winners.length === 0) return;
    
    // 모달로 당첨자 표시
    const modal = document.getElementById('modal-draw-result');
    const content = document.getElementById('draw-result-content');
    
    if (modal && content) {
        content.innerHTML = `
            <div class="draw-result-animation">
                <div class="confetti"></div>
                <h2>🎉 당첨자 발표! 🎉</h2>
                <div class="winners-list">
                    ${winners.map((w, i) => `
                        <div class="winner-card" style="animation-delay: ${i * 0.2}s">
                            <span class="winner-rank">${i + 1}등</span>
                            <span class="winner-name">${escapeHTML(w.nickname || w.name || '익명')}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        openModal('modal-draw-result');
    }
    
    // 당첨자 목록 업데이트
    draw.previousWinners = winners;
    updateDrawDisplay();
}

function removeDrawParticipant(odaId) {
    sendWebSocket({
        type: 'removeDrawParticipant',
        data: { odaId }
    });
}

function resetDraw() {
    if (!confirm('참여자 목록을 초기화하시겠습니까?')) return;
    
    sendWebSocket({ type: 'resetDraw' });
    showNotification('초기화되었습니다', 'info');
}

function clearDrawWinners() {
    if (!confirm('당첨자 목록을 초기화하시겠습니까?')) return;
    
    draw.previousWinners = [];
    updateDrawDisplay();
    showNotification('당첨자 목록이 초기화되었습니다', 'info');
}


// ============================================
// Roulette System (룰렛)
// ============================================
// rouletteItems is declared at the top of the file

function updateRouletteState(state) {
    if (!state) return;
    
    roulette = {
        items: state.items || [],
        isSpinning: state.isSpinning || false,
        previousResults: state.previousResults || []
    };
    
    rouletteItems = roulette.items;
    updateRouletteDisplay();
}

function updateRouletteDisplay() {
    const itemsList = document.getElementById('roulette-items');
    const resultsList = document.getElementById('roulette-results');
    const spinBtn = document.getElementById('roulette-spin-btn');
    
    // 항목 목록
    if (itemsList) {
        if (rouletteItems.length > 0) {
            itemsList.innerHTML = rouletteItems.map((item, i) => `
                <div class="roulette-item" data-index="${i}">
                    <span class="item-color" style="background: ${getRouletteColor(i)}"></span>
                    <input type="text" class="form-input" value="${escapeHTML(item.text || item)}" 
                           onchange="updateRouletteItem(${i}, this.value)" placeholder="항목 ${i + 1}">
                    <button class="btn-icon btn-danger" onclick="removeRouletteItem(${i})" title="삭제">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('');
        } else {
            itemsList.innerHTML = '<div class="empty-state">항목을 추가해주세요</div>';
        }
    }
    
    // 스핀 버튼 상태
    if (spinBtn) {
        spinBtn.disabled = rouletteItems.length < 2 || isRouletteSpinning;
        spinBtn.innerHTML = isRouletteSpinning ? 
            '<i class="fas fa-spinner fa-spin"></i> 돌리는 중...' :
            '<i class="fas fa-sync-alt"></i> 돌리기';
    }
    
    // 결과 목록
    if (resultsList && roulette.previousResults) {
        if (roulette.previousResults.length > 0) {
            resultsList.innerHTML = roulette.previousResults.slice(0, 10).map((r, i) => `
                <div class="roulette-result-item">
                    <span class="result-number">${i + 1}</span>
                    <span class="result-text">${escapeHTML(r.text || r)}</span>
                    <span class="result-time">${r.time ? new Date(r.time).toLocaleTimeString() : ''}</span>
                </div>
            `).join('');
        } else {
            resultsList.innerHTML = '<div class="empty-state">결과가 없습니다</div>';
        }
    }
    
    // 룰렛 휠 렌더링
    renderRouletteWheel();
}

function getRouletteColor(index) {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
        '#F8B500', '#00CED1', '#FF69B4', '#32CD32', '#FFD700'
    ];
    return colors[index % colors.length];
}

function renderRouletteWheel() {
    const wheel = document.getElementById('roulette-wheel');
    if (!wheel || rouletteItems.length === 0) return;
    
    const size = 300;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;
    
    let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
    
    const segmentAngle = 360 / rouletteItems.length;
    
    rouletteItems.forEach((item, i) => {
        const startAngle = i * segmentAngle - 90;
        const endAngle = (i + 1) * segmentAngle - 90;
        
        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;
        
        const x1 = centerX + radius * Math.cos(startRad);
        const y1 = centerY + radius * Math.sin(startRad);
        const x2 = centerX + radius * Math.cos(endRad);
        const y2 = centerY + radius * Math.sin(endRad);
        
        const largeArc = segmentAngle > 180 ? 1 : 0;
        
        const path = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
        
        svg += `<path d="${path}" fill="${getRouletteColor(i)}" stroke="#fff" stroke-width="2"/>`;
        
        // 텍스트 레이블
        const midAngle = ((startAngle + endAngle) / 2 * Math.PI) / 180;
        const textRadius = radius * 0.65;
        const textX = centerX + textRadius * Math.cos(midAngle);
        const textY = centerY + textRadius * Math.sin(midAngle);
        
        const text = typeof item === 'string' ? item : (item.text || '');
        const displayText = text.length > 8 ? text.substring(0, 8) + '...' : text;
        
        svg += `
            <text x="${textX}" y="${textY}" text-anchor="middle" dominant-baseline="middle" 
                  fill="#fff" font-size="12" font-weight="bold" 
                  transform="rotate(${(startAngle + endAngle) / 2 + 90}, ${textX}, ${textY})">
                ${escapeHTML(displayText)}
            </text>
        `;
    });
    
    // 중앙 원
    svg += `<circle cx="${centerX}" cy="${centerY}" r="20" fill="#333" stroke="#fff" stroke-width="3"/>`;
    svg += '</svg>';
    
    // 화살표
    svg += `
        <div class="roulette-pointer">
            <i class="fas fa-caret-down"></i>
        </div>
    `;
    
    wheel.innerHTML = svg;
}

function addRouletteItem() {
    const input = document.getElementById('new-roulette-item');
    const text = input?.value.trim();
    
    if (!text) {
        showNotification('항목을 입력해주세요', 'error');
        return;
    }
    
    rouletteItems.push({ text, id: Date.now() });
    if (input) input.value = '';
    
    updateRouletteDisplay();
    saveRouletteItems();
}

function updateRouletteItem(index, text) {
    if (index >= 0 && index < rouletteItems.length) {
        if (typeof rouletteItems[index] === 'object') {
            rouletteItems[index].text = text;
        } else {
            rouletteItems[index] = { text, id: Date.now() };
        }
        saveRouletteItems();
    }
}

function removeRouletteItem(index) {
    if (index >= 0 && index < rouletteItems.length) {
        rouletteItems.splice(index, 1);
        updateRouletteDisplay();
        saveRouletteItems();
    }
}

function saveRouletteItems() {
    sendWebSocket({
        type: 'updateRouletteItems',
        data: { items: rouletteItems }
    });
}

function spinRoulette() {
    if (rouletteItems.length < 2) {
        showNotification('최소 2개의 항목이 필요합니다', 'error');
        return;
    }
    
    if (isRouletteSpinning) return;
    
    isRouletteSpinning = true;
    updateRouletteDisplay();
    
    sendWebSocket({ type: 'spinRoulette' });
    
    // 로컬 애니메이션
    const wheel = document.getElementById('roulette-wheel');
    if (wheel) {
        const randomRotation = 1800 + Math.random() * 1800; // 5-10 바퀴
        wheel.style.transition = 'transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
        wheel.style.transform = `rotate(${randomRotation}deg)`;
        
        setTimeout(() => {
            isRouletteSpinning = false;
            wheel.style.transition = '';
            updateRouletteDisplay();
        }, 5000);
    }
}

function handleRouletteResult(result) {
    isRouletteSpinning = false;
    
    if (result && result.winner) {
        // 결과 모달 표시
        const modal = document.getElementById('modal-roulette-result');
        const content = document.getElementById('roulette-result-content');
        
        if (modal && content) {
            content.innerHTML = `
                <div class="roulette-result-animation">
                    <div class="result-icon">🎯</div>
                    <h2>결과</h2>
                    <div class="result-winner">${escapeHTML(result.winner.text || result.winner)}</div>
                </div>
            `;
            openModal('modal-roulette-result');
        }
        
        // 결과 목록에 추가
        if (!roulette.previousResults) roulette.previousResults = [];
        roulette.previousResults.unshift({
            text: result.winner.text || result.winner,
            time: Date.now()
        });
    }
    
    updateRouletteDisplay();
}

function resetRoulette() {
    if (!confirm('룰렛 항목을 모두 초기화하시겠습니까?')) return;
    
    rouletteItems = [];
    roulette.previousResults = [];
    updateRouletteDisplay();
    saveRouletteItems();
    showNotification('초기화되었습니다', 'info');
}


// ============================================
// Participation System (참여 관리)
// ============================================
let participationState = {
    isActive: false,
    keyword: '!참가',
    participants: [],
    maxParticipants: 100
};

function updateParticipationState(state) {
    if (!state) return;
    
    participationState = {
        isActive: state.isActive || false,
        keyword: state.keyword || '!참가',
        participants: state.participants || [],
        maxParticipants: state.maxParticipants || 100
    };
    
    updateParticipationDisplay();
}

function updateParticipationDisplay() {
    const keywordInput = document.getElementById('participation-keyword');
    const maxInput = document.getElementById('participation-max');
    const participantsList = document.getElementById('participation-list');
    const participantCount = document.getElementById('participation-count');
    const toggleBtn = document.getElementById('participation-toggle-btn');
    
    // 설정값 업데이트
    if (keywordInput) keywordInput.value = participationState.keyword;
    if (maxInput) maxInput.value = participationState.maxParticipants;
    
    // 참여자 수
    if (participantCount) {
        participantCount.textContent = `${participationState.participants.length}/${participationState.maxParticipants}`;
    }
    
    // 토글 버튼 상태
    if (toggleBtn) {
        toggleBtn.innerHTML = participationState.isActive ?
            '<i class="fas fa-stop"></i> 참여 중지' :
            '<i class="fas fa-play"></i> 참여 시작';
        toggleBtn.className = participationState.isActive ? 'btn btn-danger' : 'btn btn-primary';
    }
    
    // 참여자 목록
    if (participantsList) {
        if (participationState.participants.length > 0) {
            participantsList.innerHTML = participationState.participants.map((p, i) => `
                <div class="participant-item">
                    <span class="participant-number">${i + 1}</span>
                    <span class="participant-name">${escapeHTML(p.nickname || p.name || '익명')}</span>
                    <span class="participant-time">${p.time ? new Date(p.time).toLocaleTimeString() : ''}</span>
                    <button class="btn-icon btn-danger" onclick="removeParticipant('${p.odaId || p.id}')" title="제외">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('');
        } else {
            participantsList.innerHTML = '<div class="empty-state">참여자가 없습니다</div>';
        }
    }
    
    // 통계 업데이트
    const statParticipants = document.getElementById('stat-participants');
    if (statParticipants) {
        statParticipants.textContent = participationState.participants.length;
    }
}

function saveParticipationSettings() {
    const keyword = document.getElementById('participation-keyword')?.value.trim() || '!참가';
    const maxParticipants = parseInt(document.getElementById('participation-max')?.value) || 100;
    
    sendWebSocket({
        type: 'updateParticipationSettings',
        data: { keyword, maxParticipants }
    });
    
    showNotification('설정이 저장되었습니다', 'success');
}

function toggleParticipation() {
    if (participationState.isActive) {
        sendWebSocket({ type: 'stopParticipation' });
        showNotification('참여가 중지되었습니다', 'info');
    } else {
        const keyword = document.getElementById('participation-keyword')?.value.trim() || '!참가';
        const maxParticipants = parseInt(document.getElementById('participation-max')?.value) || 100;
        
        sendWebSocket({
            type: 'startParticipation',
            data: { keyword, maxParticipants }
        });
        showNotification('참여가 시작되었습니다', 'success');
    }
}

function removeParticipant(odaId) {
    sendWebSocket({
        type: 'removeParticipant',
        data: { odaId }
    });
}

function clearParticipants() {
    if (!confirm('참여자 목록을 초기화하시겠습니까?')) return;
    
    sendWebSocket({ type: 'clearParticipants' });
    showNotification('참여자 목록이 초기화되었습니다', 'info');
}

function exportParticipants() {
    if (participationState.participants.length === 0) {
        showNotification('내보낼 참여자가 없습니다', 'error');
        return;
    }
    
    const csv = ['번호,닉네임,시간'];
    participationState.participants.forEach((p, i) => {
        csv.push(`${i + 1},"${(p.nickname || p.name || '익명').replace(/"/g, '""')}",${p.time ? new Date(p.time).toLocaleString() : ''}`);
    });
    
    const blob = new Blob(['\ufeff' + csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `participants_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification('참여자 목록이 내보내기되었습니다', 'success');
}

// ============================================
// Floating Chat (플로팅 채팅)
// ============================================
let chatMessages = [];
const MAX_CHAT_MESSAGES = 100;
let floatingChatVisible = false;

function addChatMessage(data) {
    if (!data) return;
    
    const message = {
        id: data.id || Date.now(),
        nickname: data.nickname || data.profile?.nickname || '익명',
        message: data.message || data.content || '',
        badges: data.badges || [],
        time: data.time || Date.now(),
        type: data.type || 'normal'
    };
    
    chatMessages.unshift(message);
    
    // 최대 개수 유지
    if (chatMessages.length > MAX_CHAT_MESSAGES) {
        chatMessages = chatMessages.slice(0, MAX_CHAT_MESSAGES);
    }
    
    renderChatMessages();
    
    // 채팅 통계 업데이트
    const statChats = document.getElementById('stat-chats');
    if (statChats) {
        const current = parseInt(statChats.textContent) || 0;
        statChats.textContent = current + 1;
    }
}

function renderChatMessages() {
    const chatContainer = document.getElementById('floating-chat-messages');
    if (!chatContainer) return;
    
    const fragment = document.createDocumentFragment();
    
    chatMessages.slice(0, 50).forEach(msg => {
        const div = document.createElement('div');
        div.className = `chat-message ${msg.type === 'donation' ? 'donation' : ''}`;
        
        // 배지 HTML
        let badgeHtml = '';
        if (msg.badges && msg.badges.length > 0) {
            badgeHtml = msg.badges.map(b => 
                `<img src="${b.imageUrl || b}" class="chat-badge" alt="badge">`
            ).join('');
        }
        
        div.innerHTML = `
            <div class="chat-header">
                ${badgeHtml}
                <span class="chat-nickname">${escapeHTML(msg.nickname)}</span>
                <span class="chat-time">${new Date(msg.time).toLocaleTimeString()}</span>
            </div>
            <div class="chat-content">${escapeHTML(msg.message)}</div>
        `;
        
        fragment.appendChild(div);
    });
    
    chatContainer.innerHTML = '';
    chatContainer.appendChild(fragment);
}

function toggleFloatingChat() {
    const chat = document.getElementById('floating-chat');
    if (!chat) return;
    
    floatingChatVisible = !floatingChatVisible;
    chat.style.display = floatingChatVisible ? 'flex' : 'none';
    
    const btn = document.getElementById('chat-toggle-btn');
    if (btn) {
        btn.innerHTML = floatingChatVisible ? 
            '<i class="fas fa-comments"></i> 채팅 숨기기' :
            '<i class="fas fa-comments"></i> 채팅 보기';
    }
}

function clearChat() {
    chatMessages = [];
    renderChatMessages();
    showNotification('채팅이 초기화되었습니다', 'info');
}

function minimizeFloatingChat() {
    const chat = document.getElementById('floating-chat');
    if (!chat) return;
    
    chat.classList.toggle('minimized');
}

function closeFloatingChat() {
    const chat = document.getElementById('floating-chat');
    if (!chat) return;
    
    floatingChatVisible = false;
    chat.style.display = 'none';
    
    const btn = document.getElementById('chat-toggle-btn');
    if (btn) {
        btn.innerHTML = '<i class="fas fa-comments"></i>';
    }
}

// Drag & Resize functionality for floating chat
function initFloatingChat() {
    const chat = document.getElementById('floating-chat');
    if (!chat) return;
    
    const header = chat.querySelector('.floating-chat-header');
    const resizeHandle = chat.querySelector('.floating-chat-resize');
    
    let isDragging = false;
    let isResizing = false;
    let startX, startY, startLeft, startTop, startWidth, startHeight;
    
    // Drag functionality
    if (header) {
        header.style.cursor = 'move';
        
        header.addEventListener('mousedown', startDrag);
        header.addEventListener('touchstart', startDrag, { passive: false });
    }
    
    function startDrag(e) {
        if (e.target.closest('button')) return;
        
        isDragging = true;
        chat.style.transition = 'none';
        
        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
        
        startX = clientX;
        startY = clientY;
        startLeft = chat.offsetLeft;
        startTop = chat.offsetTop;
        
        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', stopDrag);
        document.addEventListener('touchmove', onDrag, { passive: false });
        document.addEventListener('touchend', stopDrag);
        
        e.preventDefault();
    }
    
    function onDrag(e) {
        if (!isDragging) return;
        
        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
        
        const dx = clientX - startX;
        const dy = clientY - startY;
        
        const newLeft = Math.max(0, Math.min(window.innerWidth - chat.offsetWidth, startLeft + dx));
        const newTop = Math.max(0, Math.min(window.innerHeight - chat.offsetHeight, startTop + dy));
        
        chat.style.left = newLeft + 'px';
        chat.style.top = newTop + 'px';
        chat.style.right = 'auto';
        chat.style.bottom = 'auto';
        
        e.preventDefault();
    }
    
    function stopDrag() {
        isDragging = false;
        chat.style.transition = '';
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('mouseup', stopDrag);
        document.removeEventListener('touchmove', onDrag);
        document.removeEventListener('touchend', stopDrag);
    }
    
    // Resize functionality
    if (resizeHandle) {
        resizeHandle.style.cursor = 'nwse-resize';
        
        resizeHandle.addEventListener('mousedown', startResize);
        resizeHandle.addEventListener('touchstart', startResize, { passive: false });
    }
    
    function startResize(e) {
        isResizing = true;
        chat.style.transition = 'none';
        
        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
        
        startX = clientX;
        startY = clientY;
        startWidth = chat.offsetWidth;
        startHeight = chat.offsetHeight;
        
        document.addEventListener('mousemove', onResize);
        document.addEventListener('mouseup', stopResize);
        document.addEventListener('touchmove', onResize, { passive: false });
        document.addEventListener('touchend', stopResize);
        
        e.preventDefault();
        e.stopPropagation();
    }
    
    function onResize(e) {
        if (!isResizing) return;
        
        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
        
        const dx = clientX - startX;
        const dy = clientY - startY;
        
        const newWidth = Math.max(280, Math.min(600, startWidth + dx));
        const newHeight = Math.max(200, Math.min(600, startHeight + dy));
        
        chat.style.width = newWidth + 'px';
        chat.style.height = newHeight + 'px';
        
        e.preventDefault();
    }
    
    function stopResize() {
        isResizing = false;
        chat.style.transition = '';
        document.removeEventListener('mousemove', onResize);
        document.removeEventListener('mouseup', stopResize);
        document.removeEventListener('touchmove', onResize);
        document.removeEventListener('touchend', stopResize);
    }
}


// ============================================
// Response Preview (응답 미리보기)
// ============================================
function previewResponse(type, data) {
    const modal = document.getElementById('modal-response-preview');
    const content = document.getElementById('response-preview-content');
    
    if (!modal || !content) return;
    
    let previewHtml = '';
    
    switch (type) {
        case 'command':
            previewHtml = generateCommandPreview(data);
            break;
        case 'macro':
            previewHtml = generateMacroPreview(data);
            break;
        case 'counter':
            previewHtml = generateCounterPreview(data);
            break;
        default:
            previewHtml = `<pre>${escapeHTML(JSON.stringify(data, null, 2))}</pre>`;
    }
    
    content.innerHTML = previewHtml;
    openModal('modal-response-preview');
}

function generateCommandPreview(cmd) {
    if (!cmd) return '<div class="empty-state">데이터 없음</div>';
    
    const sampleUser = '테스트유저';
    let response = cmd.response || '';
    
    // 변수 치환 미리보기
    response = response
        .replace(/\{user\}/gi, sampleUser)
        .replace(/\{count\}/gi, '42')
        .replace(/\{uptime\}/gi, '3시간 25분')
        .replace(/\{followers\}/gi, '1,234')
        .replace(/\{game\}/gi, '게임명')
        .replace(/\{title\}/gi, '방송 제목');
    
    return `
        <div class="preview-container">
            <div class="preview-header">
                <h4>명령어 미리보기</h4>
                <span class="preview-trigger">${escapeHTML(cmd.trigger || cmd.triggers?.[0] || '!명령어')}</span>
            </div>
            <div class="preview-chat">
                <div class="preview-message user">
                    <span class="preview-nick">${sampleUser}</span>
                    <span class="preview-text">${escapeHTML(cmd.trigger || cmd.triggers?.[0] || '!명령어')}</span>
                </div>
                <div class="preview-message bot">
                    <span class="preview-nick">🤖 봇</span>
                    <span class="preview-text">${escapeHTML(response)}</span>
                </div>
            </div>
            <div class="preview-variables">
                <h5>사용 가능한 변수</h5>
                <ul>
                    <li><code>{user}</code> - 명령어 사용자</li>
                    <li><code>{count}</code> - 카운터 값</li>
                    <li><code>{uptime}</code> - 방송 시간</li>
                    <li><code>{followers}</code> - 팔로워 수</li>
                    <li><code>{game}</code> - 현재 게임</li>
                    <li><code>{title}</code> - 방송 제목</li>
                </ul>
            </div>
        </div>
    `;
}

function generateMacroPreview(macro) {
    if (!macro) return '<div class="empty-state">데이터 없음</div>';
    
    return `
        <div class="preview-container">
            <div class="preview-header">
                <h4>매크로 미리보기</h4>
                <span class="preview-interval">${macro.interval || 5}분마다</span>
            </div>
            <div class="preview-chat">
                <div class="preview-message bot">
                    <span class="preview-nick">🤖 봇</span>
                    <span class="preview-text">${escapeHTML(macro.message || '')}</span>
                </div>
            </div>
            <div class="preview-info">
                <p>이 메시지는 ${macro.interval || 5}분마다 자동으로 전송됩니다.</p>
            </div>
        </div>
    `;
}

function generateCounterPreview(counter) {
    if (!counter) return '<div class="empty-state">데이터 없음</div>';
    
    const sampleUser = '테스트유저';
    let response = counter.response || '{count}';
    response = response
        .replace(/\{user\}/gi, sampleUser)
        .replace(/\{count\}/gi, String(counter.count || 0));
    
    return `
        <div class="preview-container">
            <div class="preview-header">
                <h4>카운터 미리보기</h4>
                <span class="preview-trigger">${escapeHTML(counter.trigger || '!카운터')}</span>
            </div>
            <div class="preview-chat">
                <div class="preview-message user">
                    <span class="preview-nick">${sampleUser}</span>
                    <span class="preview-text">${escapeHTML(counter.trigger || '!카운터')}</span>
                </div>
                <div class="preview-message bot">
                    <span class="preview-nick">🤖 봇</span>
                    <span class="preview-text">${escapeHTML(response)}</span>
                </div>
            </div>
            <div class="preview-info">
                <p>현재 카운트: <strong>${counter.count || 0}</strong></p>
            </div>
        </div>
    `;
}

// Quick preview buttons
function previewCommand(id) {
    const cmd = commands.find(c => c.id === id);
    if (cmd) previewResponse('command', cmd);
}

function previewMacro(id) {
    const macro = macros.find(m => m.id === id);
    if (macro) previewResponse('macro', macro);
}

function previewCounter(id) {
    const counter = counters.find(c => c.id === id);
    if (counter) previewResponse('counter', counter);
}

// ============================================
// Points System (포인트)
// ============================================
let pointsState = {
    enabled: false,
    earnRate: 10,
    earnInterval: 5,
    leaderboard: []
};

function updatePointsState(state) {
    if (!state) return;
    
    pointsState = {
        enabled: state.enabled || false,
        earnRate: state.earnRate || 10,
        earnInterval: state.earnInterval || 5,
        leaderboard: state.leaderboard || []
    };
    
    updatePointsDisplay();
}

function updatePointsDisplay() {
    const enabledToggle = document.getElementById('points-enabled');
    const earnRateInput = document.getElementById('points-earn-rate');
    const earnIntervalInput = document.getElementById('points-earn-interval');
    const leaderboardList = document.getElementById('points-leaderboard');
    
    if (enabledToggle) enabledToggle.checked = pointsState.enabled;
    if (earnRateInput) earnRateInput.value = pointsState.earnRate;
    if (earnIntervalInput) earnIntervalInput.value = pointsState.earnInterval;
    
    // 리더보드
    if (leaderboardList) {
        if (pointsState.leaderboard.length > 0) {
            leaderboardList.innerHTML = pointsState.leaderboard.slice(0, 10).map((user, i) => `
                <div class="leaderboard-item ${i < 3 ? 'top-' + (i + 1) : ''}">
                    <span class="leaderboard-rank">${i + 1}</span>
                    <span class="leaderboard-name">${escapeHTML(user.nickname || user.name || '익명')}</span>
                    <span class="leaderboard-points">${formatNumber(user.points || 0)} P</span>
                </div>
            `).join('');
        } else {
            leaderboardList.innerHTML = '<div class="empty-state">데이터가 없습니다</div>';
        }
    }
}

function savePointsSettings() {
    const enabled = document.getElementById('points-enabled')?.checked || false;
    const earnRate = parseInt(document.getElementById('points-earn-rate')?.value) || 10;
    const earnInterval = parseInt(document.getElementById('points-earn-interval')?.value) || 5;
    
    sendWebSocket({
        type: 'updatePointsSettings',
        data: { enabled, earnRate, earnInterval }
    });
    
    showNotification('포인트 설정이 저장되었습니다', 'success');
}

function givePoints() {
    const nickname = document.getElementById('points-give-user')?.value.trim();
    const amount = parseInt(document.getElementById('points-give-amount')?.value) || 0;
    
    if (!nickname) {
        showNotification('닉네임을 입력해주세요', 'error');
        return;
    }
    
    if (amount <= 0) {
        showNotification('포인트를 입력해주세요', 'error');
        return;
    }
    
    sendWebSocket({
        type: 'givePoints',
        data: { nickname, amount }
    });
    
    document.getElementById('points-give-user').value = '';
    document.getElementById('points-give-amount').value = '';
    
    showNotification(`${nickname}님에게 ${amount}P를 지급했습니다`, 'success');
}

function resetPoints() {
    if (!confirm('모든 포인트를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    
    sendWebSocket({ type: 'resetPoints' });
    showNotification('포인트가 초기화되었습니다', 'info');
}

// ============================================
// Overlay Settings
// ============================================
function initOverlayUrl() {
    const urlInput = document.getElementById('overlay-url');
    if (urlInput) {
        const baseUrl = window.location.origin;
        urlInput.value = `${baseUrl}/overlay/vote`;
    }
}

function copyOverlayUrl() {
    const urlInput = document.getElementById('overlay-url');
    if (!urlInput) return;
    
    navigator.clipboard.writeText(urlInput.value).then(() => {
        showNotification('URL이 클립보드에 복사되었습니다', 'success');
    }).catch(() => {
        // Fallback
        urlInput.select();
        document.execCommand('copy');
        showNotification('URL이 클립보드에 복사되었습니다', 'success');
    });
}

function saveOverlaySettings() {
    const opacity = parseInt(document.getElementById('overlay-opacity')?.value) || 70;
    const color = document.getElementById('overlay-color')?.value || '#00ff94';
    const animation = document.getElementById('overlay-animation')?.checked || false;
    const confetti = document.getElementById('overlay-confetti')?.checked || false;
    
    sendWebSocket({
        type: 'updateOverlaySettings',
        data: { opacity, color, animation, confetti }
    });
    
    showNotification('오버레이 설정이 저장되었습니다', 'success');
}

// ============================================
// Max Participants Update
// ============================================
function updateMaxParticipants(value) {
    maxParticipants = value;
    sendWebSocket({
        type: 'updateParticipationSettings',
        data: { maxParticipants: value }
    });
}


// ============================================
// Additional WebSocket Handlers
// ============================================
function handleAdditionalMessages(data) {
    switch (data.type) {
        case 'rouletteResult':
            handleRouletteResult(data.payload);
            break;
            
        case 'rouletteStateUpdate':
            updateRouletteState(data.payload);
            break;
            
        case 'pointsStateUpdate':
            updatePointsState(data.payload);
            break;
            
        case 'channelInfo':
            updateChannelInfo(data.payload);
            break;
            
        case 'stats':
            updateStats(data.payload);
            break;
    }
}

function updateChannelInfo(info) {
    if (!info) return;
    
    currentChannelData = info;
    
    const channelName = document.getElementById('channel-name');
    const channelImage = document.getElementById('channel-image');
    const viewerCount = document.getElementById('viewer-count');
    const streamStatus = document.getElementById('stream-status');
    
    if (channelName) channelName.textContent = info.channelName || info.name || '채널';
    if (channelImage && info.channelImageUrl) channelImage.src = info.channelImageUrl;
    if (viewerCount) viewerCount.textContent = formatNumber(info.concurrentUserCount || 0);
    if (streamStatus) {
        const isLive = info.openLive || info.isLive;
        streamStatus.innerHTML = isLive ? 
            '<span class="status-badge live">LIVE</span>' : 
            '<span class="status-badge offline">오프라인</span>';
    }
    
    // 헤더 타이틀 업데이트
    const headerTitle = document.getElementById('header-title');
    if (headerTitle && info.channelName) {
        headerTitle.textContent = `${info.channelName} 대시보드`;
    }
}

function updateStats(stats) {
    if (!stats) return;
    
    if (stats.chatCount !== undefined) {
        const statChats = document.getElementById('stat-chats');
        if (statChats) statChats.textContent = formatNumber(stats.chatCount);
    }
    
    if (stats.commandCount !== undefined) {
        const statCommands = document.getElementById('stat-commands');
        if (statCommands) statCommands.textContent = formatNumber(stats.commandCount);
    }
}

// ============================================
// Vote Subtabs
// ============================================
function initVoteSubtabs() {
    const subtabs = document.querySelectorAll('.vote-tab');
    
    subtabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.subtab;
            
            // 활성 탭 변경
            subtabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // 콘텐츠 전환
            document.querySelectorAll('.vote-subtab').forEach(content => {
                content.classList.remove('active');
            });
            
            const targetContent = document.getElementById(`${target}-subtab`);
            if (targetContent) targetContent.classList.add('active');
        });
    });
}

// ============================================
// Tab Navigation
// ============================================
function initTabs() {
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetTab = item.dataset.tab;
            
            // 네비게이션 활성화
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // 탭 콘텐츠 전환
            tabContents.forEach(content => {
                content.classList.remove('active');
            });
            
            const targetContent = document.getElementById(`${targetTab}-tab`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
            
            // 헤더 타이틀 업데이트
            updateHeaderTitle(targetTab);
        });
    });
}

function updateHeaderTitle(tab) {
    const titles = {
        'commands': '명령어 관리',
        'macros': '매크로 관리',
        'counters': '카운터 관리',
        'songs': '신청곡 관리',
        'votes': '투표/추첨/룰렛',
        'participation': '시청자 참여',
        'points': '포인트 시스템',
        'settings': '설정'
    };
    
    const headerTitle = document.getElementById('header-title');
    if (headerTitle) {
        const channelName = currentChannelData?.channelName || currentUser?.channelName || '';
        headerTitle.textContent = channelName ? `${channelName} - ${titles[tab] || '대시보드'}` : (titles[tab] || '대시보드');
    }
}

// ============================================
// Button Event Listeners
// ============================================
function initButtonListeners() {
    console.log('[Dashboard] Initializing button listeners...');

    const safeAddListener = (id, event, handler) => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener(event, handler);
        } else {
            console.warn(`[Dashboard] Button not found: ${id}`);
        }
    };

    // Bot Chat Toggle
    safeAddListener('bot-chat-toggle', 'change', (e) => {
        const isEnabled = e.target.checked;
        
        // 1. 설정 저장 (서버가 알아서 알림 채팅 보냄)
        sendWebSocket({
            type: 'updateSettings',
            data: { chatEnabled: isEnabled }
        });
        
        // 2. UI 상태 즉시 반영
        updateBotStatusUI(isEnabled);
        
        showNotification(isEnabled ? '봇이 활성화되었습니다.' : '봇이 비활성화되었습니다.', isEnabled ? 'success' : 'warning');
    });

    // Commands
    safeAddListener('add-command-btn', 'click', () => showModal('add-command-modal'));
    
    // Macros
    safeAddListener('add-macro-btn', 'click', () => showModal('add-macro-modal'));
    
    // Counters
    safeAddListener('add-counter-btn', 'click', () => showModal('add-counter-modal'));
    
    // Songs
    safeAddListener('save-song-settings', 'click', saveSongSettings);
    
    // Song Mode Radio Change
    document.querySelectorAll('input[name="songRequestMode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            updateSongSettingsUI(e.target.value);
        });
    });
    
    // Vote
    safeAddListener('add-vote-option-btn', 'click', addVoteOption);
    safeAddListener('create-vote-btn', 'click', createVote);
    safeAddListener('start-vote-btn', 'click', startVote);
    safeAddListener('end-vote-btn', 'click', endVote);
    safeAddListener('reset-vote-btn', 'click', resetVote);
    
    // Draw
    safeAddListener('start-draw-btn', 'click', toggleDraw);
    safeAddListener('execute-draw-btn', 'click', performDraw);
    safeAddListener('reset-draw-btn', 'click', resetDraw);
    // safeAddListener('draw-save-keyword-btn', 'click', saveDrawKeyword); // HTML에 없음 (자동 저장됨)
    
    // Roulette
    safeAddListener('add-roulette-item-btn', 'click', addRouletteItem);
    safeAddListener('spin-roulette-btn', 'click', spinRoulette);
    safeAddListener('reset-roulette-btn', 'click', resetRoulette);
    
    // Participation
    safeAddListener('toggle-participation-btn', 'click', toggleParticipation);
    safeAddListener('clear-participation-btn', 'click', clearParticipants);
    
    // Participation slider
    const maxSlider = document.getElementById('max-participants-slider');
    const maxInput = document.getElementById('max-participants');
    if (maxSlider && maxInput) {
        maxSlider.addEventListener('input', () => {
            maxInput.value = maxSlider.value;
            updateMaxParticipants(parseInt(maxSlider.value));
        });
        maxInput.addEventListener('change', () => {
            maxSlider.value = maxInput.value;
            updateMaxParticipants(parseInt(maxInput.value));
        });
    }
    
    // Points
    safeAddListener('save-points-settings', 'click', savePointsSettings);
    
    // Overlay settings
    safeAddListener('copy-overlay-url', 'click', copyOverlayUrl);
    safeAddListener('save-overlay-settings', 'click', saveOverlaySettings);
    
    // Overlay sliders
    const opacitySlider = document.getElementById('overlay-opacity');
    const opacityValue = document.getElementById('overlay-opacity-value');
    if (opacitySlider && opacityValue) {
        opacitySlider.addEventListener('input', () => {
            opacityValue.textContent = opacitySlider.value + '%';
        });
    }
    
    // Color presets
    document.querySelectorAll('.color-preset').forEach(btn => {
        btn.addEventListener('click', () => {
            const color = btn.dataset.color;
            const colorInput = document.getElementById('overlay-color');
            if (colorInput) colorInput.value = color;
        });
    });
    
    console.log('[Dashboard] Button listeners initialized');
}

// ============================================
// Final Initialization
// ============================================
async function initDashboard() {
    console.log('[Dashboard] Initializing...');
    
    // 1. 인증 확인 (URL에서 토큰 추출 및 저장 최우선)
    await initAuth();
    
    // 2. WebSocket 연결 (이제 최신 토큰을 사용함)
    initWebSocket();
    
    // 3. 탭 네비게이션 및 기타 UI 초기화
    initTabs();
    initVoteSubtabs();
    initFloatingChat();
    initButtonListeners();
    initOverlayUrl();
    
    // 모달 외부 클릭 닫기
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
    
    console.log('[Dashboard] Initialization complete');
}

// 추가 메시지 핸들러를 기존 handleWebSocketMessage에 연결
const originalHandleWebSocketMessage = handleWebSocketMessage;
handleWebSocketMessage = function(event) {
    originalHandleWebSocketMessage(event);
    
    try {
        const data = JSON.parse(event.data);
        handleAdditionalMessages(data);
    } catch (e) {
        // 이미 처리됨
    }
};

// DOM 로드 완료 시 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}

// Expose functions to global scope for HTML onclick attributes
window.addCommand = addCommand;
window.updateCommand = updateCommand;
window.addMacro = addMacro;
window.updateMacro = updateMacro;
window.addCounter = addCounter;
window.updateCounter = updateCounter;
window.saveSongSettings = saveSongSettings;
window.savePointsSettings = savePointsSettings;
window.saveOverlaySettings = saveOverlaySettings;
window.toggleParticipation = toggleParticipation;
window.clearParticipants = clearParticipants;
window.handleLegacyLogin = handleLegacyLogin;
window.handleLogout = handleLogout;
window.showModal = showModal;
window.hideModal = hideModal;
window.closeModal = hideModal;
