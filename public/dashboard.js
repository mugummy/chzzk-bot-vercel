// ============================================
// Chzzk Bot Dashboard - Main JavaScript (Optimized)
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
            // 여러 사용자를 위해 현재 로그인한 사용자의 channelId를 전송
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
        const res = await fetch('/api/auth/config');
        const config = await res.json();
        isOAuthConfigured = config.configured;
        
        if (!isOAuthConfigured) {
            isLegacyMode = true;
            showLegacyLoginScreen();
            checkSavedLogin();
        }
    } catch (e) {
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
        showLoginScreen();
    }
}

function showLoginScreen() { isLegacyMode ? showLegacyLoginScreen() : showOAuthLoginScreen(); }
function showOAuthLoginScreen() {
    document.getElementById('login-overlay').classList.remove('hidden');
    document.getElementById('login-oauth-state').style.display = 'block';
    document.getElementById('login-legacy-state').style.display = 'none';
    document.getElementById('login-success-state').style.display = 'none';
}
function showLegacyLoginScreen() {
    document.getElementById('login-overlay').classList.remove('hidden');
    document.getElementById('login-oauth-state').style.display = 'none';
    document.getElementById('login-legacy-state').style.display = 'block';
    document.getElementById('login-success-state').style.display = 'none';
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) document.getElementById('login-channel-input').value = saved;
}
function hideLoginScreen() { document.getElementById('login-overlay').classList.add('hidden'); }
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
    document.getElementById('login-overlay').classList.remove('hidden');
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
        try { await fetch('/auth/logout', { method: 'POST' }); } catch (e) {}
        localStorage.removeItem(STORAGE_KEY);
        currentUser = null;
        if (socket) socket.send(JSON.stringify({ type: 'disconnect' }));
        updateBotStatus(false);
        clearAllData();
        showLoginScreen();
    }
}

function updateUserProfile(user) {
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
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.style.display = 'flex';
}

function updateBotStatus(connected) {
    botConnected = connected;
    const indicator = document.getElementById('bot-status-indicator');
    const text = document.getElementById('bot-status-text');
    if (indicator) indicator.classList.toggle('online', connected);
    if (text) text.textContent = connected ? '봇 연결됨' : '봇 미연결';
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.style.display = connected ? 'flex' : 'none';
}

function updateStreamerInfo(channel, live) {
    currentChannelData = { channel, live };
    const channelAvatar = document.getElementById('channel-avatar');
    if (channelAvatar && channel?.channelImageUrl) channelAvatar.style.backgroundImage = `url(${channel.channelImageUrl})`;
    const channelName = document.getElementById('channel-name');
    if (channelName) channelName.textContent = channel?.channelName || '채널명';
    const followerCount = document.getElementById('follower-count');
    if (followerCount && channel) followerCount.innerHTML = `<i class="fas fa-heart"></i><span>${formatNumber(channel.followerCount || 0)} 팔로워</span>`;
    
    const streamStatus = document.getElementById('stream-status');
    if (streamStatus) {
        const isLive = live?.status === 'OPEN';
        const badge = streamStatus.querySelector('.status-badge');
        const viewerCount = streamStatus.querySelector('.viewer-count');
        if (badge) {
            badge.className = `status-badge ${isLive ? 'live' : 'offline'}`;
            badge.textContent = isLive ? '라이브' : '오프라인';
        }
        if (viewerCount) viewerCount.textContent = isLive ? `${formatNumber(live.concurrentUserCount || 0)}명` : '';
    }
    const streamTitle = document.getElementById('stream-title');
    if (streamTitle) streamTitle.textContent = live?.liveTitle || '방송 제목';
    const streamCategory = document.getElementById('stream-category');
    if (streamCategory) streamCategory.innerHTML = `<i class="fas fa-gamepad"></i><span>${live?.category || '카테고리'}</span>`;
}

function clearAllData() {
    commands = []; macros = []; counters = []; songQueue = [];
    updateCommands([]); updateMacros([]); updateCounters([]);
    updateSongState(null); updateParticipationState(null);
}

// ============================================
// Commands / Macros / Counters
// ============================================
function previewText(text, isCounter = false) {
    if (!text) return '';
    let preview = text;
    preview = preview.replace(/\{user\}/gi, '<span class="fn-highlight">테스트유저</span>');
    preview = preview.replace(/\{count\}/gi, '<span class="fn-highlight">42</span>');
    preview = preview.replace(/\{channel\}/gi, '<span class="fn-highlight">테스트채널</span>');
    preview = preview.replace(/\{uptime\}/gi, '<span class="fn-highlight">1시간 23분</span>');
    preview = preview.replace(/\{viewers\}/gi, '<span class="fn-highlight">1,234</span>');
    preview = preview.replace(/\{followers\}/gi, '<span class="fn-highlight">5,678</span>');
    preview = preview.replace(/\{game\}/gi, '<span class="fn-highlight">Just Chatting</span>');
    preview = preview.replace(/\{title\}/gi, '<span class="fn-highlight">오늘의 방송!</span>');
    preview = preview.replace(/\{date\}/gi, '<span class="fn-highlight">2026-01-01</span>');
    preview = preview.replace(/\{time\}/gi, '<span class="fn-highlight">12:34:56</span>');
    return preview;
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
        const isEnabled = cmd.enabled !== false;
        return `
            <div class="item-card ${isEnabled ? '' : 'disabled'}">
                <div class="item-info">
                    <span class="item-trigger">${escapeHTML(triggers.join(', '))}</span>
                    <span class="item-response">${escapeHTML(cmd.response)}</span>
                </div>
                <div class="item-actions">
                    <label class="toggle-switch" title="${isEnabled ? '비활성화' : '활성화'}">
                        <input type="checkbox" ${isEnabled ? 'checked' : ''} onchange="toggleCommand(${index}, this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                    <button class="btn-icon" onclick="editCommand(${index})" title="수정"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon btn-danger" onclick="deleteCommand(${index})" title="삭제"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    }).join('');
}

function toggleCommand(index, enabled) {
    const cmd = commands[index];
    if (!cmd) return;
    const triggers = cmd.triggers || (cmd.trigger ? [cmd.trigger] : []);
    sendWebSocket({
        type: 'updateCommand',
        data: {
            oldTrigger: triggers[0],
            newTrigger: triggers[0],
            response: cmd.response,
            enabled: enabled
        }
    });
}
function addCommand() {
    const trigger = document.getElementById('new-command-trigger')?.value.trim();
    const response = document.getElementById('new-command-response')?.value.trim();
    if (!trigger || !response) return showNotification('내용을 입력해주세요', 'error');
    sendWebSocket({ type: 'addCommand', data: { trigger, response } });
    hideModal('add-command-modal');
}
function editCommand(index) {
    const cmd = commands[index];
    if (!cmd) return;
    const triggers = cmd.triggers || (cmd.trigger ? [cmd.trigger] : []);
    document.getElementById('edit-command-trigger').value = triggers.join('/');
    document.getElementById('edit-command-response').value = cmd.response;
    window.editingCommandIndex = index;
    showModal('edit-command-modal');
}
function updateCommand() {
    const index = window.editingCommandIndex;
    const cmd = commands[index];
    const newTrigger = document.getElementById('edit-command-trigger').value.trim();
    const newResponse = document.getElementById('edit-command-response').value.trim();
    const triggers = cmd.triggers || (cmd.trigger ? [cmd.trigger] : []);
    sendWebSocket({ type: 'updateCommand', data: { oldTrigger: triggers[0], newTrigger, response: newResponse, enabled: cmd.enabled } });
    hideModal('edit-command-modal');
}
function deleteCommand(index) {
    const cmd = commands[index];
    const triggers = cmd.triggers || (cmd.trigger ? [cmd.trigger] : []);
    if (confirm('삭제하시겠습니까?')) sendWebSocket({ type: 'removeCommand', data: { trigger: triggers[0] } });
}
function updateCommandPreview() {
    const val = document.getElementById('new-command-response').value;
    document.getElementById('command-preview').innerHTML = val ? previewText(val) : '';
}
function updateEditCommandPreview() {
    const val = document.getElementById('edit-command-response').value;
    document.getElementById('edit-command-preview').innerHTML = val ? previewText(val) : '';
}

function updateMacros(list) {
    macros = list || [];
    const container = document.getElementById('macros-list');
    if(!container) return;
    if (macros.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-clock"></i><p>매크로가 없습니다</p></div>`;
        return;
    }
    container.innerHTML = macros.map((m, i) => {
        const isEnabled = m.enabled !== false;
        return `
            <div class="item-card ${isEnabled ? '' : 'disabled'}">
                <div class="item-info"><span class="item-interval">${m.interval}분</span><span class="item-response">${escapeHTML(m.message)}</span></div>
                <div class="item-actions">
                    <label class="toggle-switch" title="${isEnabled ? '비활성화' : '활성화'}">
                        <input type="checkbox" ${isEnabled ? 'checked' : ''} onchange="toggleMacro(${i}, this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                    <button class="btn-icon" onclick="editMacro(${i})" title="수정"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon btn-danger" onclick="deleteMacro(${i})" title="삭제"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    }).join('');
}

function toggleMacro(index, enabled) {
    const m = macros[index];
    if (!m) return;
    sendWebSocket({
        type: 'updateMacro',
        data: {
            id: m.id,
            message: m.message,
            interval: m.interval,
            enabled: enabled
        }
    });
}
function addMacro() {
    const interval = document.getElementById('new-macro-interval').value;
    const message = document.getElementById('new-macro-message').value;
    sendWebSocket({ type: 'addMacro', data: { interval: parseInt(interval), message } });
    hideModal('add-macro-modal');
}
function editMacro(i) {
    const m = macros[i];
    document.getElementById('edit-macro-interval').value = m.interval;
    document.getElementById('edit-macro-message').value = m.message;
    window.editingMacroIndex = i;
    showModal('edit-macro-modal');
}
function updateMacro() {
    const i = window.editingMacroIndex;
    const m = macros[i];
    const interval = document.getElementById('edit-macro-interval').value;
    const message = document.getElementById('edit-macro-message').value;
    sendWebSocket({ type: 'updateMacro', data: { id: m.id, interval: parseInt(interval), message, enabled: m.enabled } });
    hideModal('edit-macro-modal');
}
function deleteMacro(i) {
    if(confirm('삭제?')) sendWebSocket({ type: 'removeMacro', data: { id: macros[i].id } });
}
function updateMacroPreview() {
    const val = document.getElementById('new-macro-message').value;
    document.getElementById('macro-preview').innerHTML = val ? previewText(val) : '';
}
function updateEditMacroPreview() {
    const val = document.getElementById('edit-macro-message').value;
    document.getElementById('edit-macro-preview').innerHTML = val ? previewText(val) : '';
}

function updateCounters(list) {
    counters = list || [];
    const container = document.getElementById('counters-list');
    if(!container) return;
    if (counters.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-calculator"></i><p>카운터가 없습니다</p></div>`;
        return;
    }
    container.innerHTML = counters.map((c, i) => {
        const isEnabled = c.enabled !== false;
        return `
            <div class="item-card ${isEnabled ? '' : 'disabled'}">
                <div class="item-info"><span class="item-trigger">${escapeHTML(c.trigger)}</span><span class="item-response">${escapeHTML(c.response)}</span><span class="item-count">#${c.count || 0}</span></div>
                <div class="item-actions">
                    <label class="toggle-switch" title="${isEnabled ? '비활성화' : '활성화'}">
                        <input type="checkbox" ${isEnabled ? 'checked' : ''} onchange="toggleCounter(${i}, this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                    <button class="btn-icon" onclick="editCounter(${i})" title="수정"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon btn-danger" onclick="deleteCounter(${i})" title="삭제"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    }).join('');
}

function toggleCounter(index, enabled) {
    const c = counters[index];
    if (!c) return;
    sendWebSocket({
        type: 'updateCounter',
        data: {
            oldTrigger: c.trigger,
            newTrigger: c.trigger,
            response: c.response,
            enabled: enabled
        }
    });
}
function addCounter() {
    const trigger = document.getElementById('new-counter-trigger').value;
    const response = document.getElementById('new-counter-response').value;
    sendWebSocket({ type: 'addCounter', data: { trigger, response } });
    hideModal('add-counter-modal');
}
function editCounter(i) {
    const c = counters[i];
    document.getElementById('edit-counter-trigger').value = c.trigger;
    document.getElementById('edit-counter-response').value = c.response;
    document.getElementById('edit-counter-count').value = c.count || 0;
    window.editingCounterIndex = i;
    showModal('edit-counter-modal');
}
function updateCounter() {
    const i = window.editingCounterIndex;
    const c = counters[i];
    const newTrig = document.getElementById('edit-counter-trigger').value;
    const newResp = document.getElementById('edit-counter-response').value;
    const newCount = document.getElementById('edit-counter-count').value;
    sendWebSocket({ type: 'updateCounter', data: { oldTrigger: c.trigger, newTrigger: newTrig, response: newResp, enabled: c.enabled, count: parseInt(newCount) } });
    hideModal('edit-counter-modal');
}
function deleteCounter(i) {
    if(confirm('삭제?')) sendWebSocket({ type: 'removeCounter', data: { trigger: counters[i].trigger } });
}
function updateCounterPreview() {
    const val = document.getElementById('new-counter-response').value;
    document.getElementById('counter-preview').innerHTML = val ? previewText(val, true) : '';
}
function updateEditCounterPreview() {
    const val = document.getElementById('edit-counter-response').value;
    document.getElementById('edit-counter-preview').innerHTML = val ? previewText(val, true) : '';
}

// ============================================
// Songs & Points
// ============================================
function updateSongState(state) {
    const current = document.getElementById('current-song');
    const queue = document.getElementById('song-queue-list');
    const count = document.getElementById('queue-count');
    const stat = document.getElementById('stat-songs');
    if (!state) return;
    
    if(count) count.textContent = state.queue.length;
    if(stat) stat.textContent = state.queue.length;
    if(current) {
        if(state.currentSong) current.innerHTML = `<div class="song-title">${escapeHTML(state.currentSong.title)}</div><div class="song-requester">${escapeHTML(state.currentSong.requester)}</div>`;
        else current.innerHTML = '<div class="no-song">재생 중인 곡이 없습니다</div>';
    }
    const playBtn = document.getElementById('play-pause-btn');
    if(playBtn) playBtn.innerHTML = state.isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
    
    if(queue) {
        if(state.queue.length > 0) {
            queue.innerHTML = state.queue.map(s => `
                <div class="queue-item">
                    <div class="song-info"><div class="song-title">${escapeHTML(s.title)}</div><div class="song-requester">${escapeHTML(s.requester)}</div></div>
                    <div class="item-actions">
                        <button class="btn-icon" onclick="playSongFromQueue('${s.id}')"><i class="fas fa-play"></i></button>
                        <button class="btn-icon btn-danger" onclick="removeSongFromQueue('${s.id}')"><i class="fas fa-times"></i></button>
                    </div>
                </div>
            `).join('');
        } else queue.innerHTML = '<div class="empty-state">대기열 없음</div>';
    }
}
function playSongFromQueue(id) { sendWebSocket({ type: 'controlMusic', action: 'playFromQueue', payload: id }); }
function removeSongFromQueue(id) { sendWebSocket({ type: 'controlMusic', action: 'removeFromQueue', payload: id }); }
function skipSong() { sendWebSocket({ type: 'controlMusic', action: 'skip' }); }
function stopSong() { sendWebSocket({ type: 'controlMusic', action: 'deleteCurrent' }); }
function togglePlayPause() { sendWebSocket({ type: 'controlMusic', action: 'togglePlayPause' }); }
function saveSongSettings() {
    const cd = document.getElementById('song-cooldown').value;
    const md = document.getElementById('song-min-donation').value;
    const mode = document.querySelector('input[name="songRequestMode"]:checked')?.value || 'all';
    
    sendWebSocket({ type: 'updateSongSetting', data: { setting: 'songRequestCooldown', value: parseInt(cd) } });
    sendWebSocket({ type: 'updateSongSetting', data: { setting: 'songMinDonation', value: parseInt(md) } });
    sendWebSocket({ type: 'updateSongSetting', data: { setting: 'songRequestMode', value: mode } });
    
    showNotification('설정이 저장되었습니다', 'success');
}
function openPlayer() { window.open('/player.html', '_blank'); }

function updateSettings(s) {
    if(s.songRequestCooldown) document.getElementById('song-cooldown').value = s.songRequestCooldown;
    if(s.songMinDonation !== undefined) document.getElementById('song-min-donation').value = s.songMinDonation;
    if(s.songRequestMode) {
        const radio = document.querySelector(`input[name="songRequestMode"][value="${s.songRequestMode}"]`);
        if(radio) radio.checked = true;
    }
    
    // Points settings
    if(s.pointsPerChat !== undefined) document.getElementById('points-per-chat').value = s.pointsPerChat;
    if(s.pointCooldown !== undefined) document.getElementById('points-cooldown').value = s.pointCooldown;
    if(s.pointsUnit !== undefined) document.getElementById('points-unit').value = s.pointsUnit;
}
function updatePointsData(d) {
    const list = document.getElementById('points-ranking');
    if(!list || !d.leaderboard) return;
    if(d.leaderboard.length === 0) { list.innerHTML = '<div class="empty-state">데이터가 없습니다</div>'; return; }
    list.innerHTML = d.leaderboard.slice(0, 10).map((u, i) => {
        const nickname = u && u.nickname ? u.nickname : '알 수 없음';
        const points = u && typeof u.points === 'number' ? u.points.toLocaleString() : '0';
        return `
            <div class="ranking-item">
                <span class="ranking-position">${i+1}</span>
                <span class="ranking-name">${escapeHTML(nickname)}</span>
                <span class="ranking-points">${points}P</span>
            </div>
        `;
    }).join('');
}
function savePointsSettings() {
    const perChat = document.getElementById('points-per-chat').value;
    const cooldown = document.getElementById('points-cooldown').value;
    const unit = document.getElementById('points-unit').value;
    sendWebSocket({ type: 'updateSetting', data: { setting: 'pointsPerChat', value: parseInt(perChat) } });
    sendWebSocket({ type: 'updateSetting', data: { setting: 'pointCooldown', value: parseInt(cooldown) } }); // pointCooldown matches backend
    sendWebSocket({ type: 'updateSetting', data: { setting: 'pointsUnit', value: unit } });
    showNotification('포인트 설정 저장됨', 'success');
}

// ============================================
// Participation
// ============================================
let rankingDisplayCount = 5;  // 처음에 5명만 표시

function updateParticipationState(state) {
    if (!state) return;
    participationState = state;
    document.getElementById('active-count').textContent = `${state.participants.length} / ${state.maxParticipants}`;
    document.getElementById('waiting-count').textContent = state.queue.length;
    document.getElementById('max-participants').value = state.maxParticipants;
    document.getElementById('max-participants-slider').value = state.maxParticipants;

    const btn = document.getElementById('toggle-participation-btn');
    if(state.isParticipationActive) {
        btn.innerHTML = '<i class="fas fa-stop"></i> 참여 마감';
        btn.className = 'btn btn-danger';
        btn.onclick = () => sendWebSocket({ type: 'stopParticipation' });
    } else {
        btn.innerHTML = '<i class="fas fa-play"></i> 참여 시작';
        btn.className = 'btn btn-primary';
        btn.onclick = () => sendWebSocket({ type: 'startParticipation' });
    }

    renderPartList('waiting-queue', state.queue, true);
    renderPartList('active-participants', state.participants, false);

    // 현재 세션 참여 랭킹 표시
    renderSessionRanking(state.sessionRanking || []);

    // 전체 누적 참여왕 랭킹 표시
    renderTotalRanking(state.totalRanking || []);
}

function renderSessionRanking(ranking) {
    const list = document.getElementById('session-ranking-list');
    const countBadge = document.getElementById('session-ranking-count');
    if (!list) return;

    if (countBadge) countBadge.textContent = ranking.length;

    if (ranking.length === 0) {
        list.innerHTML = '<div class="empty-state">참여 기록이 없습니다</div>';
        return;
    }

    list.innerHTML = ranking.map((r, i) => `
        <div class="ranking-item">
            <span class="ranking-position">${i + 1}</span>
            <span class="ranking-name">${escapeHTML(r.nickname)}</span>
            <span class="ranking-points">${r.count}회</span>
        </div>
    `).join('');
}

function renderTotalRanking(ranking) {
    const list = document.getElementById('total-ranking-list');
    const countBadge = document.getElementById('total-ranking-count');
    const loadMoreBtn = document.getElementById('load-more-ranking');
    if (!list) return;

    if (countBadge) countBadge.textContent = ranking.length;

    if (ranking.length === 0) {
        list.innerHTML = '<div class="empty-state">참여 기록이 없습니다</div>';
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        return;
    }

    const displayList = ranking.slice(0, rankingDisplayCount);
    list.innerHTML = displayList.map((r, i) => `
        <div class="ranking-item ${i < 3 ? 'top-' + (i + 1) : ''}">
            <span class="ranking-position">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</span>
            <span class="ranking-name">${escapeHTML(r.nickname)}</span>
            <span class="ranking-points">${r.count}회</span>
        </div>
    `).join('');

    // 더보기 버튼 표시 여부
    if (loadMoreBtn) {
        if (ranking.length > rankingDisplayCount) {
            loadMoreBtn.style.display = 'block';
            loadMoreBtn.textContent = `더보기 (${ranking.length - rankingDisplayCount}명 더)`;
        } else {
            loadMoreBtn.style.display = 'none';
        }
    }
}

function loadMoreRanking() {
    rankingDisplayCount += 5;
    if (participationState && participationState.totalRanking) {
        renderTotalRanking(participationState.totalRanking);
    }
}
function renderPartList(id, list, isQueue) {
    const el = document.getElementById(id);
    if(!el) return;
    if(list.length === 0) { el.innerHTML = '<div class="empty-state">없음</div>'; return; }
    el.innerHTML = list.map((p, i) => `
        <div class="participant-item">
            <div class="participant-info">
                <span class="participant-number">#${i+1}</span>
                <span class="participant-name">${escapeHTML(p.nickname)}</span>
                ${p.participationCount > 0 ? `<span class="badge"><i class="fas fa-history"></i> ${p.participationCount}회</span>` : ''}
            </div>
            <div class="participant-actions">
                ${isQueue ? `<button class="btn-icon btn-success" onclick="moveFromQueue('${p.userIdHash}')"><i class="fas fa-arrow-right"></i></button>` : `<button class="btn-icon btn-success" onclick="finishParticipation('${p.userIdHash}')"><i class="fas fa-check"></i></button>`}
                <button class="btn-icon btn-danger" onclick="${isQueue ? 'removeFromQueue' : 'finishParticipation'}('${p.userIdHash}')"><i class="fas fa-times"></i></button>
            </div>
        </div>
    `).join('');
}
function moveFromQueue(id) { sendWebSocket({ type: 'moveToParticipants', data: { userIdHash: id } }); }
function removeFromQueue(id) { sendWebSocket({ type: 'removeFromQueue', data: { userIdHash: id } }); }
function finishParticipation(id) { sendWebSocket({ type: 'finishParticipation', data: { userIdHash: id } }); }
function clearAllParticipation() { if(confirm('전체 초기화?')) sendWebSocket({ type: 'clearAllParticipation' }); }
function updateMaxParticipants(val) { sendWebSocket({ type: 'updateMaxParticipants', data: { max: parseInt(val) } }); }
function toggleParticipation() {
    if (participationState && participationState.isParticipationActive) {
        sendWebSocket({ type: 'stopParticipation' });
    } else {
        sendWebSocket({ type: 'startParticipation' });
    }
}

// ============================================
// Chat & Overlay & Misc
// ============================================
function addChatMessage(data) {
    const c = document.getElementById('chat-messages');
    if(!c) return;
    const div = document.createElement('div');
    div.className = 'chat-message';
    div.innerHTML = `<span class="chat-nickname">${escapeHTML(data.profile?.nickname)}</span> <span class="chat-content">${escapeHTML(data.message)}</span>`;
    c.prepend(div);
    if(c.children.length > 50) c.lastChild.remove();
}
function initOverlayUrl() { document.getElementById('overlay-url').value = `${window.location.origin}/overlay/vote`; }
function copyOverlayUrl() {
    const url = document.getElementById('overlay-url');
    url.select(); document.execCommand('copy'); showNotification('복사됨', 'success');
}
function saveOverlaySettings() {
    // vote-system.js handles this logic mostly, but if button is in dashboard:
    const op = document.getElementById('overlay-opacity').value;
    const col = document.getElementById('overlay-color').value;
    const anim = document.getElementById('overlay-animation').checked;
    const conf = document.getElementById('overlay-confetti').checked;
    sendWebSocket({ type: 'updateOverlaySettings', payload: { backgroundOpacity: parseInt(op), themeColor: col, showAnimation: anim, showConfetti: conf } });
    showNotification('오버레이 설정 저장됨', 'success');
}
function clearVoteHistory() {
    if(confirm('투표 기록 전체 삭제?')) sendWebSocket({ type: 'clearVoteHistory' });
}

// Function Chips
function initFunctionChips() {
    document.querySelectorAll('.fn-chip').forEach(chip => {
        chip.onclick = (e) => {
            e.preventDefault();
            const fn = chip.dataset.fn;
            const modal = chip.closest('.modal');
            if(!modal) return;
            let input = modal.querySelector('textarea:not([readonly])') || modal.querySelector('input[type=text]:not([readonly])');
            if(input) {
                const start = input.selectionStart || 0;
                const end = input.selectionEnd || 0;
                input.value = input.value.substring(0, start) + fn + input.value.substring(end);
                input.focus();
                input.selectionStart = input.selectionEnd = start + fn.length;
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        };
    });
}

// Draggable Chat
function initDraggableChat() {
    const chat = document.getElementById('floating-chat');
    const header = document.getElementById('floating-chat-header');
    if(!chat || !header) return;

    let isDragging = false;
    let startX = 0, startY = 0;
    let initLeft = 0, initTop = 0;

    header.addEventListener('mousedown', (e) => {
        // 버튼 클릭 시 드래그 방지
        if(e.target.closest('button')) return;

        e.preventDefault();
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;

        // 현재 위치 계산 (right/bottom에서 left/top으로 변환)
        const rect = chat.getBoundingClientRect();
        initLeft = rect.left;
        initTop = rect.top;

        // 드래그 시작 시 right/bottom을 auto로 설정하고 left/top 사용
        chat.style.left = initLeft + 'px';
        chat.style.top = initTop + 'px';
        chat.style.right = 'auto';
        chat.style.bottom = 'auto';

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    function onMouseMove(e) {
        if (!isDragging) return;
        e.preventDefault();

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        chat.style.left = (initLeft + deltaX) + 'px';
        chat.style.top = (initTop + deltaY) + 'px';
    }

    function onMouseUp() {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }
}
function toggleFloatingChat() {
    const c = document.getElementById('floating-chat');
    c.style.display = c.style.display === 'none' ? 'flex' : 'none';
}
function minimizeFloatingChat() { document.getElementById('floating-chat').classList.toggle('minimized'); }
function closeFloatingChat() { document.getElementById('floating-chat').style.display = 'none'; }

function initButtonListeners() {
    document.getElementById('add-command-btn')?.addEventListener('click', () => showModal('add-command-modal'));
    document.getElementById('add-macro-btn')?.addEventListener('click', () => showModal('add-macro-modal'));
    document.getElementById('add-counter-btn')?.addEventListener('click', () => showModal('add-counter-modal'));
    document.getElementById('save-song-settings')?.addEventListener('click', saveSongSettings);
    document.getElementById('skip-song-btn')?.addEventListener('click', skipSong);
    document.getElementById('stop-song-btn')?.addEventListener('click', stopSong);
    document.getElementById('play-pause-btn')?.addEventListener('click', togglePlayPause);
    document.getElementById('save-points-settings')?.addEventListener('click', savePointsSettings);
    document.getElementById('toggle-participation-btn')?.addEventListener('click', toggleParticipation);
    document.getElementById('clear-participation-btn')?.addEventListener('click', clearAllParticipation);
    document.getElementById('clear-vote-history-btn')?.addEventListener('click', clearVoteHistory);
    
    // Sliders
    const maxSlider = document.getElementById('max-participants-slider');
    const maxInput = document.getElementById('max-participants');
    if(maxSlider && maxInput) {
        maxSlider.oninput = () => { maxInput.value = maxSlider.value; };
        maxSlider.onchange = () => { updateMaxParticipants(maxSlider.value); };
        maxInput.onchange = () => { maxSlider.value = maxInput.value; updateMaxParticipants(maxInput.value); };
    }
}

// Tab Navigation
function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(tab + '-tab')?.classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');
}
function initTabs() {
    document.querySelectorAll('.nav-item').forEach(n => n.onclick = () => switchTab(n.dataset.tab));
    document.querySelectorAll('.quick-btn').forEach(b => b.onclick = () => switchTab(b.dataset.tab));
}

// Init
function initDashboard() {
    console.log('[Dashboard] Init');
    initWebSocket();
    initTabs();
    initButtonListeners();
    initFunctionChips();
    initDraggableChat();
    initOverlayUrl();
    // Vote Subtabs are handled by vote-system.js

    // 참여왕 랭킹 더보기 버튼
    const loadMoreBtn = document.getElementById('load-more-ranking');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreRanking);
    }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initDashboard);
else initDashboard();