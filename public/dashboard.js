// ============================================
// Chzzk Bot Dashboard - Main JavaScript (FULL RESTORED)
// ============================================

// ============================================
// Global Variables
// ============================================
let socket = null;
window.socket = null;
let botConnected = false;
let currentUser = null;
let isLegacyMode = false;
let isOAuthConfigured = false;

// Data
let commands = [];
let macros = [];
let counters = [];
let songQueue = [];
let participationState = {
    isParticipationActive: false,
    queue: [],
    participants: [],
    maxParticipants: 10,
    userParticipationHistory: {}
};

// Constants
const STORAGE_KEY = 'chzzk_bot_channel';
const REMEMBER_KEY = 'chzzk_bot_remember';

// ============================================
// Utility Functions
// ============================================
function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

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
    
    requestAnimationFrame(() => notification.classList.add('show'));
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
        resetModalContent(modalId);
    }
}

function closeModal(modalId) { hideModal(modalId); }
function openModal(modalId) { showModal(modalId); }

function resetModalContent(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.querySelectorAll('input[type="text"], input[type="number"], textarea').forEach(input => {
        if (input.id === 'new-macro-interval') input.value = '5';
        else if (!input.readOnly) input.value = '';
    });
    modal.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
}

// ============================================
// WebSocket Connection
// ============================================
function initWebSocket() {
    try {
        const wsUrl = (typeof window.getServerWebSocketUrl === 'function') 
            ? window.getServerWebSocketUrl() 
            : `wss://${window.location.host}`;
            
        console.log('[WS] Connecting to:', wsUrl);
        
        socket = new WebSocket(wsUrl);
        window.socket = socket; 
        
        socket.onopen = () => {
            console.log('[WS] Connected');
            updateBotStatus(true);
            // [연동 추가] 여러 사용자 지원을 위해 현재 로그인한 사용자의 channelId를 전송
            if (currentUser && currentUser.channelId) {
                socket.send(JSON.stringify({ type: 'connect', data: { channel: currentUser.channelId } }));
            }
            setTimeout(() => {
                socket.send(JSON.stringify({ type: 'requestData', dataType: 'all' }));
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
                
                // [연동 추가] 실시간 정보(팔로워, 제목) 업데이트
                if (data.type === 'connectResult' && data.success && data.channelInfo) {
                    const fEl = document.getElementById('follower-count');
                    if(fEl) fEl.innerHTML = `<i class="fas fa-heart" style="color:#ff4757;"></i><span>${formatNumber(data.channelInfo.followerCount)} 팔로워</span>`;
                    if(data.liveStatus) {
                        const tEl = document.getElementById('stream-title'); if(tEl) tEl.textContent = data.liveStatus.liveTitle;
                        const cEl = document.getElementById('stream-category'); if(cEl) cEl.innerHTML = `<i class="fas fa-gamepad"></i><span>${data.liveStatus.category || '카테고리 없음'}</span>`;
                        const sBadge = document.querySelector('.status-badge');
                        if(sBadge) {
                            const isLive = data.liveStatus.status === 'OPEN';
                            sBadge.className = `status-badge ${isLive ? 'live' : 'offline'}`;
                            sBadge.textContent = isLive ? '라이브' : '오프라인';
                        }
                    }
                }
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
        socket.send(JSON.stringify(data));
    } else {
        showNotification('서버와 연결이 끊어졌습니다', 'error');
    }
}

function handleWebSocketMessage(data) {
    switch (data.type) {
        case 'authStatus': handleAuthStatus(data); break;
        case 'error':
            if (data.requireAuth) showLoginScreen();
            showNotification(data.message || '오류가 발생했습니다', 'error');
            break;
        case 'connectResult':
            if (data.success) {
                updateBotStatus(true);
                if (data.channelInfo) updateStreamerInfo(data.channelInfo, data.liveStatus);
                showNotification(data.message || '연결되었습니다', 'success');
                setTimeout(() => sendWebSocket({ type: 'requestData', dataType: 'all' }), 500);
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
        case 'botStatus': updateBotStatus(data.payload?.connected || false); break;
        
        case 'commands':
        case 'commandsUpdate': updateCommands(data.data || data.payload || []); break;
        
        case 'macros':
        case 'macrosUpdate': updateMacros(data.data || data.payload || []); break;
        
        case 'counters':
        case 'countersUpdate': updateCounters(data.data || data.payload || []); break;
        
        case 'settingsUpdate': updateSettings(data.payload || {}); break;
        case 'pointsUpdate': updatePointsData(data.payload || {}); break;
        
        case 'songStateUpdate': updateSongState(data.payload); break;
        case 'participationStateUpdate': updateParticipationState(data.payload); break;
        
        // 투표 관련은 vote-system.js로 위임
        case 'voteStateUpdate':
            if (window.updateVoteUI) window.updateVoteUI(data.payload);
            break;
        case 'drawStateUpdate':
            if (window.updateDrawUI) window.updateDrawUI(data.payload);
            break;
        case 'rouletteStateUpdate':
            if (window.updateRouletteUI) window.updateRouletteUI(data.payload);
            break;
        
        case 'newChat': addChatMessage(data.payload); break;
        
        case 'commandResult':
        case 'macroResult':
        case 'counterResult':
        case 'songSettingResult':
        case 'participationResult':
            showNotification(data.message, data.success ? 'success' : 'error');
            break;
    }
}

// ============================================
// Auth & Channel Info
// ============================================
async function initAuth() {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error) {
        showLoginError(error);
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    try {
        // [연동 추가] Vercel 환경에서 세션 쿠키 전송을 위해 credentials: 'include' 필수
        const res = await fetch('/api/auth/session', { cache: 'no-store', credentials: 'include' });
        const data = await res.json();
        
        if (data.authenticated && data.user) {
            currentUser = data.user;
            updateUserProfile(data.user);
            hideLoginScreen();
            initWebSocket();
            return;
        }

        const configRes = await fetch('/api/auth/config');
        const config = await configRes.json();
        isOAuthConfigured = config.configured;
        
        if (!isOAuthConfigured) {
            isLegacyMode = true;
            showLegacyLoginScreen();
            checkSavedLogin();
        } else {
            // OAuth 모드인데 세션 없으면 홈으로 (랜딩 페이지)
            if (window.location.pathname.startsWith('/dashboard')) {
                window.location.href = '/';
            } else {
                showOAuthLoginScreen();
            }
        }
    } catch (e) {
        console.error('[Auth] Error:', e);
        isLegacyMode = true;
        showLegacyLoginScreen();
    }
}

function handleAuthStatus(data) {
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
                    socket.send(JSON.stringify({ type: 'connect', data: { channel: currentUser.channelId } }));
                }
            }, 500);
        }
    } else {
        if (window.location.pathname.startsWith('/dashboard')) {
            window.location.href = '/';
        } else {
            showLoginScreen();
        }
    }
}

function showLoginScreen() { isLegacyMode ? showLegacyLoginScreen() : showOAuthLoginScreen(); }
function showOAuthLoginScreen() {
    const overlay = document.getElementById('login-overlay');
    if (overlay) overlay.classList.remove('hidden');
    document.getElementById('login-oauth-state').style.display = 'block';
    document.getElementById('login-legacy-state').style.display = 'none';
    document.getElementById('login-success-state').style.display = 'none';
}
function showLegacyLoginScreen() {
    const overlay = document.getElementById('login-overlay');
    if (overlay) overlay.classList.remove('hidden');
    document.getElementById('login-oauth-state').style.display = 'none';
    document.getElementById('login-legacy-state').style.display = 'block';
    document.getElementById('login-success-state').style.display = 'none';
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) document.getElementById('login-channel-input').value = saved;
}
function hideLoginScreen() { 
    const overlay = document.getElementById('login-overlay');
    if (overlay) overlay.classList.add('hidden'); 
}
function showLoginSuccess(channelName) {
    document.getElementById('login-oauth-state').style.display = 'none';
    document.getElementById('login-legacy-state').style.display = 'none';
    document.getElementById('login-success-state').style.display = 'block';
    document.getElementById('success-channel-name').textContent = `${channelName} 연결됨`;
    setTimeout(() => { hideLoginScreen(); }, 1500);
}
function showLoginError(message) {
    const errorEl = isLegacyMode ? document.getElementById('login-error-legacy') : document.getElementById('login-error');
    const errorText = isLegacyMode ? document.getElementById('login-error-text-legacy') : document.getElementById('login-error-text');
    if (errorEl) { errorEl.style.display = 'flex'; errorEl.classList.add('show'); }
    if (errorText) errorText.textContent = message;
    setTimeout(() => { if (errorEl) errorEl.style.display = 'none'; }, 5000);
}
function handleLegacyLogin() {
    const channel = document.getElementById('login-channel-input')?.value.trim();
    if (!channel) return showLoginError('채널명을 입력해주세요');
    localStorage.setItem(STORAGE_KEY, channel);
    connectToChannel(channel, true);
}
function checkSavedLogin() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) autoConnectWithChannel(saved);
    else showLegacyLoginScreen();
}
function autoConnectWithChannel(channel) {
    const overlay = document.getElementById('login-overlay');
    if (overlay) overlay.classList.remove('hidden');
    document.getElementById('login-channel-input').value = channel;
    waitForWebSocket(() => connectToChannel(channel, true));
}
function waitForWebSocket(callback, maxAttempts = 20) {
    let attempts = 0;
    const check = () => {
        if (socket && socket.readyState === WebSocket.OPEN) callback();
        else if (attempts++ < maxAttempts) setTimeout(check, 250);
        else showLoginError('서버 연결 실패');
    };
    check();
}
function connectToChannel(channel, isFromLogin = false) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'connect', data: { channel } }));
        if (isFromLogin) showLoginSuccess(channel);
    } else showLoginError('서버 미연결');
}
async function handleLogout() {
    if (confirm('로그아웃 하시겠습니까?')) {
        try { await fetch('/auth/logout', { method: 'POST', credentials: 'include' }); } catch (e) {}
        localStorage.removeItem(STORAGE_KEY);
        currentUser = null;
        if (socket && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'disconnect' }));
        updateBotStatus(false);
        clearAllData();
        window.location.href = '/';
    }
}

function updateUserProfile(user) {
    if (!user) return;
    const headerProfile = document.getElementById('header-profile');
    const headerAvatar = document.getElementById('header-avatar');
    const headerUsername = document.getElementById('header-username');
    if (headerProfile) headerProfile.style.display = 'flex';
    if (headerAvatar && user.channelImageUrl) headerAvatar.style.backgroundImage = `url(${user.channelImageUrl})`;
    if (headerUsername) headerUsername.textContent = user.channelName || '';
    
    const sidebarProfile = document.getElementById('sidebar-profile');
    const sidebarAvatar = document.getElementById('sidebar-avatar');
    const sidebarName = document.getElementById('sidebar-name');
    if (sidebarProfile) sidebarProfile.style.display = 'flex';
    if (sidebarAvatar && user.channelImageUrl) sidebarAvatar.style.backgroundImage = `url(${user.channelImageUrl})`;
    if (sidebarName) sidebarName.textContent = user.channelName || '';
}

function updateStreamerInfo(channel, live) {
    currentChannelData = { channel, live };
    const avatar = document.getElementById('channel-avatar');
    if (avatar && channel?.channelImageUrl) avatar.style.backgroundImage = `url(${channel.channelImageUrl})`;
    const name = document.getElementById('channel-name');
    if (name) name.textContent = channel?.channelName || '채널명';
    const followers = document.getElementById('follower-count');
    if (followers && channel) followers.innerHTML = `<i class="fas fa-heart"></i><span>${formatNumber(channel.followerCount || 0)} 팔로워</span>`;
    
    const status = document.getElementById('stream-status');
    if (status) {
        const isLive = live?.status === 'OPEN';
        const badge = status.querySelector('.status-badge');
        const viewer = status.querySelector('.viewer-count');
        if (badge) {
            badge.className = `status-badge ${isLive ? 'live' : 'offline'}`;
            badge.textContent = isLive ? '라이브' : '오프라인';
        }
        if (viewer) viewer.textContent = isLive ? `${formatNumber(live.concurrentUserCount || 0)}명` : '';
    }
    const title = document.getElementById('stream-title');
    if (title) title.textContent = live?.liveTitle || '방송 제목';
    const category = document.getElementById('stream-category');
    if (category) category.innerHTML = `<i class="fas fa-gamepad"></i><span>${live?.category || '카테고리'}</span>`;
}

function updateBotStatus(connected) {
    botConnected = connected;
    const ind = document.getElementById('bot-status-indicator');
    const txt = document.getElementById('bot-status-text');
    if (ind) ind.className = `status-indicator ${connected ? 'online' : ''}`;
    if (txt) txt.textContent = connected ? '봇 연결됨' : '봇 미연결';
}

function clearAllData() {
    commands = []; macros = []; counters = []; songQueue = []; currentVote = null; currentChannelData = null;
    updateCommands([]); updateMacros([]); updateCounters([]);
    updateSongState(null); updateVoteState(null); updateStreamerInfo(null, null);
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    const selectedTab = document.getElementById(tabName + '-tab');
    if (selectedTab) selectedTab.classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const selectedNav = document.querySelector(`[data-tab="${tabName}"]`);
    if (selectedNav) selectedNav.classList.add('active');
    
    const titles = {
        'dashboard': '대시보드', 'commands': '명령어 관리', 'macros': '매크로 관리',
        'counters': '카운터 관리', 'songs': '신청곡 관리', 'votes': '투표',
        'participation': '시청자 참여', 'points': '포인트 관리'
    };
    const headerTitle = document.getElementById('header-title');
    if (headerTitle) headerTitle.textContent = titles[tabName] || tabName;
    
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('open');
}

function updateCommands(list) {
    commands = list || [];
    const container = document.getElementById('commands-list');
    const stat = document.getElementById('stat-commands');
    if (stat) stat.textContent = commands.length;
    if (!container) return;
    if (commands.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-terminal"></i><p>등록된 명령어가 없습니다</p></div>`;
        return;
    }
    container.innerHTML = commands.map((cmd, index) => {
        const triggers = cmd.triggers || (cmd.trigger ? [cmd.trigger] : []);
        return `
            <div class="item-card ${cmd.enabled ? '' : 'disabled'}">
                <div class="item-info">
                    <span class="item-trigger">${escapeHTML(triggers.join(', ')) || '없음'}</span>
                    <span class="item-response">${escapeHTML(cmd.response || '')}</span>
                </div>
                <div class="item-actions">
                    <div class="item-toggle ${cmd.enabled ? 'active' : ''}" onclick="toggleCommand(${index})"></div>
                    <button class="btn-icon" onclick="editCommand(${index})"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon btn-danger" onclick="deleteCommand(${index})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    }).join('');
}

function addCommand() {
    const trigger = document.getElementById('new-command-trigger')?.value.trim();
    const response = document.getElementById('new-command-response')?.value.trim();
    if (!trigger || !response) return;
    sendWebSocket({ type: 'addCommand', data: { trigger, response } });
    hideModal('add-command-modal');
}

function toggleCommand(index) {
    const cmd = commands[index];
    if (!cmd) return;
    const triggers = cmd.triggers || [cmd.trigger];
    sendWebSocket({ type: 'updateCommand', data: { oldTrigger: triggers[0], newTrigger: triggers.join('/'), response: cmd.response, enabled: !cmd.enabled } });
}

function editCommand(index) {
    const cmd = commands[index];
    if (!cmd) return;
    const triggers = cmd.triggers || [cmd.trigger];
    document.getElementById('edit-command-trigger').value = triggers.join('/');
    document.getElementById('edit-command-response').value = cmd.response || '';
    window.editingCommandIndex = index;
    showModal('edit-command-modal');
}

function updateCommand() {
    const index = window.editingCommandIndex;
    const cmd = commands[index];
    const newTrigger = document.getElementById('edit-command-trigger')?.value.trim();
    const newResponse = document.getElementById('edit-command-response')?.value.trim();
    if (!newTrigger || !newResponse) return;
    const triggers = cmd.triggers || [cmd.trigger];
    sendWebSocket({ type: 'updateCommand', data: { oldTrigger: triggers[0], newTrigger, response: newResponse, enabled: cmd.enabled } });
    hideModal('edit-command-modal');
}

function deleteCommand(index) {
    const cmd = commands[index];
    const triggers = cmd.triggers || [cmd.trigger];
    if (confirm(`"${triggers[0]}" 명령어를 삭제하시겠습니까?`)) {
        sendWebSocket({ type: 'removeCommand', data: { trigger: triggers[0] } });
    }
}

function updateMacros(list) {
    macros = list || [];
    const container = document.getElementById('macros-list');
    if (!container) return;
    if (macros.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-clock"></i><p>등록된 매크로가 없습니다</p></div>`;
        return;
    }
    container.innerHTML = macros.map((m, i) => `
        <div class="item-card ${m.enabled ? '' : 'disabled'}">
            <div class="item-info">
                <span class="item-interval">${m.interval || 5}분</span>
                <span class="item-response">${escapeHTML(m.message || '')}</span>
            </div>
            <div class="item-actions">
                <div class="item-toggle ${m.enabled ? 'active' : ''}" onclick="toggleMacro(${i})"></div>
                <button class="btn-icon" onclick="editMacro(${i})"><i class="fas fa-edit"></i></button>
                <button class="btn-icon btn-danger" onclick="deleteMacro(${i})"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function addMacro() {
    const interval = parseInt(document.getElementById('new-macro-interval')?.value) || 5;
    const message = document.getElementById('new-macro-message')?.value.trim();
    if (!message) return;
    sendWebSocket({ type: 'addMacro', data: { interval, message } });
    hideModal('add-macro-modal');
}

function toggleMacro(i) {
    const m = macros[i];
    if(!m) return;
    sendWebSocket({ type: 'updateMacro', data: { id: m.id, interval: m.interval, message: m.message, enabled: !m.enabled } });
}

function editMacro(i) {
    const m = macros[i];
    document.getElementById('edit-macro-interval').value = m.interval || 5;
    document.getElementById('edit-macro-message').value = m.message || '';
    window.editingMacroIndex = i;
    showModal('edit-macro-modal');
}

function updateMacro() {
    const i = window.editingMacroIndex;
    const m = macros[i];
    const newI = parseInt(document.getElementById('edit-macro-interval')?.value) || 5;
    const newM = document.getElementById('edit-macro-message')?.value.trim();
    if(!newM) return;
    sendWebSocket({ type: 'updateMacro', data: { id: m.id, interval: newI, message: newM, enabled: m.enabled } });
    hideModal('edit-macro-modal');
}

function deleteMacro(i) {
    if (confirm('이 매크로를 삭제하시겠습니까?')) {
        sendWebSocket({ type: 'removeMacro', data: { id: macros[i].id } });
    }
}

function updateCounters(list) {
    counters = list || [];
    const container = document.getElementById('counters-list');
    if (!container) return;
    if (counters.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-calculator"></i><p>등록된 카운터가 없습니다</p></div>`;
        return;
    }
    container.innerHTML = counters.map((c, i) => {
        const triggers = c.triggers || [c.trigger];
        return `
            <div class="item-card ${c.enabled ? '' : 'disabled'}">
                <div class="item-info">
                    <span class="item-trigger">${escapeHTML(triggers.join(', '))}</span>
                    <span class="item-response">${escapeHTML(c.response || '')}</span>
                    <span class="item-count">#${c.state?.totalCount || 0}</span>
                </div>
                <div class="item-actions">
                    <div class="item-toggle ${c.enabled ? 'active' : ''}" onclick="toggleCounter(${i})"></div>
                    <button class="btn-icon" onclick="editCounter(${i})"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon btn-danger" onclick="deleteCounter(${i})" title="삭제"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    }).join('');
}

function addCounter() {
    const trigger = document.getElementById('new-counter-trigger')?.value.trim();
    const response = document.getElementById('new-counter-response')?.value.trim();
    if (!trigger || !response) return;
    sendWebSocket({ type: 'addCounter', data: { trigger, response } });
    hideModal('add-counter-modal');
}

function toggleCounter(i) {
    const c = counters[i];
    if(!c) return;
    const triggers = c.triggers || [c.trigger];
    sendWebSocket({ type: 'updateCounter', data: { oldTrigger: triggers[0], newTrigger: triggers.join('/'), response: c.response, enabled: !c.enabled, count: c.state?.totalCount || 0 } });
}

function editCounter(i) {
    const c = counters[i];
    const triggers = c.triggers || [c.trigger];
    document.getElementById('edit-counter-trigger').value = triggers.join('/');
    document.getElementById('edit-counter-response').value = c.response || '';
    document.getElementById('edit-counter-count').value = c.state?.totalCount || 0;
    window.editingCounterIndex = i;
    showModal('edit-counter-modal');
}

function updateCounter() {
    const i = window.editingCounterIndex;
    const c = counters[i];
    const newT = document.getElementById('edit-counter-trigger')?.value.trim();
    const newR = document.getElementById('edit-counter-response')?.value.trim();
    const newC = parseInt(document.getElementById('edit-counter-count')?.value) || 0;
    if (!newT || !newR) return;
    const triggers = c.triggers || [c.trigger];
    sendWebSocket({ type: 'updateCounter', data: { oldTrigger: triggers[0], newTrigger: newT, response: newR, enabled: c.enabled, count: newC } });
    hideModal('edit-counter-modal');
}

function deleteCounter(i) {
    const triggers = counters[i].triggers || [counters[i].trigger];
    if (confirm(`"${triggers[0]}" 카운터를 삭제하시겠습니까?`)) {
        sendWebSocket({ type: 'removeCounter', data: { trigger: triggers[0] } });
    }
}

function updateSongState(state) {
    if (!state) {
        document.getElementById('current-song').innerHTML = '<div class="no-song">재생 중인 곡이 없습니다</div>';
        document.getElementById('song-queue-list').innerHTML = '<div class="empty-state">대기열이 비어있습니다</div>';
        document.getElementById('queue-count').textContent = '0';
        document.getElementById('stat-songs').textContent = '0';
        return;
    }
    const { queue, currentSong, isPlaying, settings } = state;
    document.getElementById('queue-count').textContent = queue?.length || 0;
    document.getElementById('stat-songs').textContent = queue?.length || 0;
    const curEl = document.getElementById('current-song');
    if (currentSong) curEl.innerHTML = `<div class="song-title">${escapeHTML(currentSong.title)}</div><div class="song-requester">신청자: ${escapeHTML(currentSong.requester)}</div>`;
    else curEl.innerHTML = '<div class="no-song">재생 중인 곡이 없습니다</div>';
    const playBtn = document.getElementById('play-pause-btn');
    if (playBtn) { playBtn.disabled = !currentSong; playBtn.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>'; }
    const qList = document.getElementById('song-queue-list');
    if (queue && queue.length > 0) {
        qList.innerHTML = queue.map(s => `
            <div class="queue-item">
                <div class="song-info"><div class="song-title">${escapeHTML(s.title)}</div><div class="song-requester">신청자: ${escapeHTML(s.requester)}</div></div>
                <div class="item-actions">
                    <button class="btn-icon" onclick="playSongFromQueue('${s.id}')"><i class="fas fa-play"></i></button>
                    <button class="btn-icon btn-danger" onclick="removeSongFromQueue('${s.id}')"><i class="fas fa-times"></i></button>
                </div>
            </div>
        `).join('');
    } else qList.innerHTML = '<div class="empty-state">대기열이 비어있습니다</div>';
    if (settings) {
        document.getElementById('song-cooldown').value = settings.cooldown;
        document.getElementById('song-min-donation').value = settings.minDonation;
        const radio = document.querySelector(`input[name="songRequestMode"][value="${settings.mode || 'all'}"]`);
        if(radio) radio.checked = true;
    }
}
function playSongFromQueue(id) { sendWebSocket({ type: 'controlMusic', action: 'playFromQueue', payload: id }); }
function removeSongFromQueue(id) { sendWebSocket({ type: 'controlMusic', action: 'removeFromQueue', payload: id }); }
function skipSong() { sendWebSocket({ type: 'controlMusic', action: 'skip' }); }
function stopSong() { sendWebSocket({ type: 'controlMusic', action: 'deleteCurrent' }); }
function togglePlayPause() { sendWebSocket({ type: 'controlMusic', action: 'togglePlayPause' }); }
function saveSongSettings() {
    const cd = parseInt(document.getElementById('song-cooldown')?.value) || 30;
    const min = parseInt(document.getElementById('song-min-donation')?.value) || 0;
    const mode = document.querySelector('input[name="songRequestMode"]:checked')?.value || 'all';
    sendWebSocket({ type: 'updateSongSettings', data: { cooldown: cd, minDonation: min, mode: mode } });
}
function openPlayer() { window.open('/player.html', '_blank'); }

function updateSettings(s) {
    if(s.pointsPerChat !== undefined) document.getElementById('points-per-chat').value = s.pointsPerChat;
    if(s.pointCooldown !== undefined) document.getElementById('points-cooldown').value = s.pointCooldown;
    if(s.pointsUnit !== undefined) document.getElementById('points-unit').value = s.pointsUnit;
}
function updatePointsData(d) {
    const list = document.getElementById('points-ranking');
    if(!list || !d.leaderboard) return;
    if(d.leaderboard.length === 0) { list.innerHTML = '<div class="empty-state">데이터가 없습니다</div>'; return; }
    list.innerHTML = d.leaderboard.slice(0, 10).map((u, i) => `
        <div class="ranking-item">
            <span class="ranking-position ${i < 3 ? (i===0?'gold':i===1?'silver':'bronze') : ''}">${i + 1}</span>
            <span class="ranking-name">${escapeHTML(u.nickname || '익명')}</span>
            <span class="ranking-points">${(u.points || 0).toLocaleString()} P</span>
        </div>
    `).join('');
}
function savePointsSettings() {
    const p = parseInt(document.getElementById('points-per-chat')?.value) || 1;
    const c = parseInt(document.getElementById('points-cooldown')?.value) || 60;
    const u = document.getElementById('points-unit')?.value || '포인트';
    sendWebSocket({ type: 'updateSetting', data: { setting: 'pointsPerChat', value: p } });
    sendWebSocket({ type: 'updateSetting', data: { setting: 'pointCooldown', value: c } });
    sendWebSocket({ type: 'updateSetting', data: { setting: 'pointsUnit', value: u } });
}

function updateParticipationState(state) {
    if (!state) return;
    participationState = state;
    document.getElementById('active-count').textContent = state.participants.length;
    document.getElementById('waiting-count').textContent = state.queue.length;
    document.getElementById('max-participants').value = state.maxParticipants;
    document.getElementById('max-participants-slider').value = state.maxParticipants;
    const btn = document.getElementById('toggle-participation-btn');
    if(state.isParticipationActive) { btn.innerHTML = '<i class="fas fa-stop"></i> 참여 마감'; btn.className = 'btn btn-danger'; }
    else { btn.innerHTML = '<i class="fas fa-play"></i> 참여 시작'; btn.className = 'btn btn-primary'; }
    renderPartList('waiting-queue', state.queue, true);
    renderPartList('active-participants', state.participants, false);
    renderSessionRanking(state.sessionRanking || []);
    renderTotalRanking(state.totalRanking || []);
    const stat = document.getElementById('stat-participants');
    if(stat) stat.textContent = state.participants.length;
}
function renderPartList(id, list, isQueue) {
    const el = document.getElementById(id);
    if(!el) return;
    if(list.length === 0) { el.innerHTML = '<div class="empty-state">없음</div>'; return; }
    el.innerHTML = list.map(p => `
        <div class="participant-item">
            <span class="participant-name">${escapeHTML(p.nickname)}</span>
            <div class="participant-actions">
                ${isQueue ? `<button class="btn-icon btn-success" onclick="moveFromQueue('${p.userIdHash}')"><i class="fas fa-arrow-right"></i></button>` : ''}
                <button class="btn-icon btn-danger" onclick="removeFromParticipation('${p.userIdHash}')"><i class="fas fa-times"></i></button>
            </div>
        </div>
    `).join('');
}
function moveFromQueue(id) { sendWebSocket({ type: 'moveToParticipants', data: { userIdHash: id } }); }
function removeFromParticipation(id) { sendWebSocket({ type: 'removeFromQueue', data: { userIdHash: id } }); }
function toggleParticipation() { sendWebSocket({ type: participationState.isParticipationActive ? 'stopParticipation' : 'startParticipation' }); }
function clearParticipants() { if(confirm('전체 초기화?')) sendWebSocket({ type: 'clearAllParticipation' }); }
function updateMaxParticipants(val) { sendWebSocket({ type: 'updateMaxParticipants', data: { max: parseInt(val) } }); }

function renderSessionRanking(ranking) {
    const list = document.getElementById('session-ranking-list');
    if (!list) return;
    if (ranking.length === 0) { list.innerHTML = '<div class="empty-state">기록 없음</div>'; return; }
    list.innerHTML = ranking.map((r, i) => `<div class="ranking-item"><span>${i+1}. ${escapeHTML(r.nickname)}</span><span>${r.count}회</span></div>`).join('');
}
function renderTotalRanking(ranking) {
    const list = document.getElementById('total-ranking-list');
    if (!list) return;
    if (ranking.length === 0) { list.innerHTML = '<div class="empty-state">기록 없음</div>'; return; }
    list.innerHTML = ranking.slice(0, 10).map((r, i) => `<div class="ranking-item"><span>${i+1}. ${escapeHTML(r.nickname)}</span><span>${r.count}회</span></div>`).join('');
}

function updateVoteState(payload) { if(window.updateVoteUI) window.updateVoteUI(payload); }
function updateDrawState(payload) { if(window.updateDrawUI) window.updateDrawUI(payload); }
function displayDrawWinners(winners) { if(window.showDrawWinners) window.showDrawWinners(winners); }
function handleRouletteResult(res) { if(window.spinRouletteAnimation) window.spinRouletteAnimation(res.spinDegree, res.result); }

function addChatMessage(data) {
    const c = document.getElementById('chat-messages');
    if(!c) return;
    const empty = c.querySelector('.chat-empty');
    if(empty) empty.remove();
    const div = document.createElement('div');
    div.className = 'chat-message';
    div.innerHTML = `<span class="chat-nickname">${escapeHTML(data.profile?.nickname)}</span>: <span class="chat-content">${escapeHTML(data.message)}</span>`;
    c.prepend(div);
    if(c.children.length > 50) c.lastChild.remove();
}

function initFunctionChips() {
    document.querySelectorAll('.fn-chip').forEach(chip => {
        chip.onclick = () => {
            const modal = chip.closest('.modal');
            const input = modal.querySelector('textarea, input[type=text]');
            if(input) { input.value += chip.dataset.fn; input.focus(); }
        };
    });
}

function initButtonListeners() {
    document.getElementById('sidebar-toggle')?.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
    document.getElementById('add-command-btn')?.addEventListener('click', () => showModal('add-command-modal'));
    document.getElementById('add-macro-btn')?.addEventListener('click', () => showModal('add-macro-modal'));
    document.getElementById('add-counter-btn')?.addEventListener('click', () => showModal('add-counter-modal'));
    document.getElementById('save-song-settings')?.addEventListener('click', saveSongSettings);
    document.getElementById('play-pause-btn')?.addEventListener('click', togglePlayPause);
    document.getElementById('skip-song-btn')?.addEventListener('click', skipSong);
    document.getElementById('stop-song-btn')?.addEventListener('click', stopSong);
    document.getElementById('toggle-participation-btn')?.addEventListener('click', toggleParticipation);
    document.getElementById('clear-participation-btn')?.addEventListener('click', clearParticipants);
    document.getElementById('save-points-settings')?.addEventListener('click', savePointsSettings);
    
    const maxSlider = document.getElementById('max-participants-slider');
    const maxInput = document.getElementById('max-participants');
    if(maxSlider && maxInput) {
        maxSlider.oninput = () => { maxInput.value = maxSlider.value; updateMaxParticipants(maxSlider.value); };
        maxInput.onchange = () => { maxSlider.value = maxInput.value; updateMaxParticipants(maxInput.value); };
    }
}

function initDashboard() {
    console.log('[Dashboard] Init');
    initWebSocket();
    initButtonListeners();
    initFunctionChips();
    initOverlayUrl();
    document.querySelectorAll('.nav-item').forEach(n => n.onclick = () => switchTab(n.dataset.tab));
}

function initOverlayUrl() { 
    const input = document.getElementById('overlay-url');
    if(input) input.value = `${window.location.origin}/overlay/vote`;
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initDashboard);
else initDashboard();
