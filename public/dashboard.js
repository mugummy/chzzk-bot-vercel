// ============================================
// Chzzk Bot Dashboard - Main JavaScript (Optimized & Complete)
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
    
    // Notification System이 로드되어 있다면 그것을 사용
    if (window.notificationSystem) {
        let notiType = type;
        if (type === 'error') notiType = 'error';
        else if (type === 'success') notiType = 'success';
        
        window.notificationSystem.show(type === 'error' ? '오류' : '알림', {
            message: message,
            type: notiType
        });
        return;
    }
    
    // Fallback notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${escapeHTML(message)}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
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
            setTimeout(() => {
                socket.send(JSON.stringify({ type: 'requestData', dataType: 'all' }));
            }, 500);
            setTimeout(initAuth, 300);
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
        
        case 'voteStateUpdate':
            if (window.updateVoteUI) window.updateVoteUI(data.payload);
            break;
        case 'drawStateUpdate':
            if (window.updateDrawUI) window.updateDrawUI(data.payload);
            break;
        case 'rouletteStateUpdate':
            if (window.updateRouletteUI) window.updateRouletteUI(data.payload);
            break;
        case 'overlaySettingsUpdate':
            if (window.updateOverlaySettingsUI) window.updateOverlaySettingsUI(data.payload);
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
        if (window.showLoginOverlay) window.showLoginOverlay();
        showLoginError(error);
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    try {
        const res = await fetch('/api/auth/config');
        const config = await res.json();
        isOAuthConfigured = config.configured;
    } catch (e) {
        console.error('Auth config fetch failed:', e);
    }
}

function handleAuthStatus(data) {
    if (data.authenticated) {
        if (data.user) {
            currentUser = data.user;
            updateUserProfile(data.user);
            
            // 로그인 성공 시 랜딩 페이지 숨김
            const landingPage = document.getElementById('landing-page');
            const loginOverlay = document.getElementById('login-overlay');
            if (landingPage) landingPage.classList.add('hidden');
            if (loginOverlay) loginOverlay.classList.add('hidden');
            
            setTimeout(() => {
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ type: 'connect', data: { channel: currentUser.channelId } }));
                }
            }, 500);
        }
    } else {
        // 비로그인 상태: 랜딩 페이지 유지
        const landingPage = document.getElementById('landing-page');
        if (landingPage) landingPage.classList.remove('hidden');
    }
}

function showLoginError(message) {
    const errorEl = document.getElementById('login-error');
    const errorText = document.getElementById('login-error-text');
    if (errorEl) { errorEl.style.display = 'flex'; errorEl.classList.add('show'); }
    if (errorText) errorText.textContent = message;
    setTimeout(() => { if (errorEl) errorEl.style.display = 'none'; }, 5000);
}

async function handleLogout() {
    if (confirm('로그아웃 하시겠습니까?')) {
        try { await fetch('/auth/logout', { method: 'POST' }); } catch (e) {}
        currentUser = null;
        if (socket) socket.send(JSON.stringify({ type: 'disconnect' }));
        updateBotStatus(false);
        clearAllData();
        
        // 로그아웃 시 랜딩 페이지 표시
        const landingPage = document.getElementById('landing-page');
        if (landingPage) landingPage.classList.remove('hidden');
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
    if (indicator) {
        indicator.className = `status-indicator ${connected ? 'online' : 'offline'}`;
    }
    if (text) text.textContent = connected ? '봇 연결됨' : '봇 미연결';
    
    // 모바일 헤더 상태 업데이트
    const mobileIndicator = document.getElementById('mobile-status-indicator');
    const mobileText = document.getElementById('mobile-status-text');
    if (mobileIndicator) {
        mobileIndicator.className = `status-indicator ${connected ? 'online' : 'offline'}`;
    }
    if (mobileText) mobileText.textContent = connected ? '봇 연결됨' : '봇 미연결';
}

function updateStreamerInfo(channel, live) {
    // currentChannelData = { channel, live };
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
// Tabs
// ============================================
function initTabs() {
    document.querySelectorAll('.nav-item').forEach(n => {
        n.onclick = () => switchTab(n.dataset.tab);
    });
    document.querySelectorAll('.quick-btn').forEach(b => {
        b.onclick = () => switchTab(b.dataset.tab);
    });
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    const tabContent = document.getElementById(tabName + '-tab');
    if (tabContent) tabContent.classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navItem = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
    if (navItem) navItem.classList.add('active');
    
    // 모바일 사이드바 닫기
    if (window.mobileOptimization && window.mobileOptimization.isSidebarOpen()) {
        window.mobileOptimization.closeMobileSidebar();
    }
}

// ============================================
// Feature Updates (Commands, Macros, etc.)
// ============================================
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
                    <span class="item-trigger">${escapeHTML(triggers.join(', '))}</span>
                    <span class="item-response">${escapeHTML(cmd.response)}</span>
                </div>
                <div class="item-actions">
                    <label class="toggle-switch">
                        <input type="checkbox" ${cmd.enabled ? 'checked' : ''} onchange="toggleCommand(${index}, this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                    <button class="btn-icon" onclick="editCommand(${index})"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon btn-danger" onclick="deleteCommand(${index})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    }).join('');
}

function toggleCommand(index, enabled) {
    const cmd = commands[index];
    const triggers = cmd.triggers || (cmd.trigger ? [cmd.trigger] : []);
    sendWebSocket({
        type: 'updateCommand',
        data: { oldTrigger: triggers[0], newTrigger: triggers.join('/'), response: cmd.response, enabled: enabled }
    });
}

function deleteCommand(index) {
    if(!confirm('삭제하시겠습니까?')) return;
    const cmd = commands[index];
    const triggers = cmd.triggers || (cmd.trigger ? [cmd.trigger] : []);
    sendWebSocket({ type: 'removeCommand', data: { trigger: triggers[0] } });
}

function addCommand() {
    const trigger = document.getElementById('new-command-trigger').value;
    const response = document.getElementById('new-command-response').value;
    if(!trigger || !response) return showNotification('내용을 입력해주세요', 'error');
    sendWebSocket({ type: 'addCommand', data: { trigger, response } });
    hideModal('add-command-modal');
}

function editCommand(index) {
    window.editingCommandIndex = index;
    const cmd = commands[index];
    const triggers = cmd.triggers || (cmd.trigger ? [cmd.trigger] : []);
    document.getElementById('edit-command-trigger').value = triggers.join('/');
    document.getElementById('edit-command-response').value = cmd.response;
    showModal('edit-command-modal');
}

function updateCommand() {
    const index = window.editingCommandIndex;
    const cmd = commands[index];
    const newTrigger = document.getElementById('edit-command-trigger').value;
    const newResponse = document.getElementById('edit-command-response').value;
    const triggers = cmd.triggers || (cmd.trigger ? [cmd.trigger] : []);
    
    sendWebSocket({ 
        type: 'updateCommand', 
        data: { oldTrigger: triggers[0], newTrigger: newTrigger, response: newResponse, enabled: cmd.enabled } 
    });
    hideModal('edit-command-modal');
}

function updateMacros(list) {
    macros = list || [];
    const container = document.getElementById('macros-list');
    if (!container) return;
    if (macros.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-clock"></i><p>등록된 매크로가 없습니다</p></div>`;
        return;
    }
    container.innerHTML = macros.map((m, index) => `
        <div class="item-card ${m.enabled ? '' : 'disabled'}">
            <div class="item-info">
                <span class="item-interval">${m.interval}분</span>
                <span class="item-response">${escapeHTML(m.message)}</span>
            </div>
            <div class="item-actions">
                <label class="toggle-switch">
                    <input type="checkbox" ${m.enabled ? 'checked' : ''} onchange="toggleMacro(${index}, this.checked)">
                    <span class="toggle-slider"></span>
                </label>
                <button class="btn-icon" onclick="editMacro(${index})"><i class="fas fa-edit"></i></button>
                <button class="btn-icon btn-danger" onclick="deleteMacro(${index})"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function addMacro() {
    const interval = document.getElementById('new-macro-interval').value;
    const message = document.getElementById('new-macro-message').value;
    sendWebSocket({ type: 'addMacro', data: { interval: parseInt(interval), message } });
    hideModal('add-macro-modal');
}

function toggleMacro(index, enabled) {
    const m = macros[index];
    sendWebSocket({ type: 'updateMacro', data: { id: m.id, interval: m.interval, message: m.message, enabled: enabled } });
}

function deleteMacro(index) {
    if(!confirm('삭제하시겠습니까?')) return;
    sendWebSocket({ type: 'removeMacro', data: { id: macros[index].id } });
}

function editMacro(index) {
    window.editingMacroIndex = index;
    const m = macros[index];
    document.getElementById('edit-macro-interval').value = m.interval;
    document.getElementById('edit-macro-message').value = m.message;
    showModal('edit-macro-modal');
}

function updateMacro() {
    const index = window.editingMacroIndex;
    const m = macros[index];
    const interval = document.getElementById('edit-macro-interval').value;
    const message = document.getElementById('edit-macro-message').value;
    sendWebSocket({ type: 'updateMacro', data: { id: m.id, interval: parseInt(interval), message, enabled: m.enabled } });
    hideModal('edit-macro-modal');
}

function updateCounters(list) {
    counters = list || [];
    const container = document.getElementById('counters-list');
    if (!container) return;
    if (counters.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-calculator"></i><p>등록된 카운터가 없습니다</p></div>`;
        return;
    }
    container.innerHTML = counters.map((c, index) => `
        <div class="item-card ${c.enabled ? '' : 'disabled'}">
            <div class="item-info">
                <span class="item-trigger">${escapeHTML(c.trigger)}</span>
                <span class="item-response">${escapeHTML(c.response)}</span>
                <span class="item-count">#${c.state?.totalCount || 0}</span>
            </div>
            <div class="item-actions">
                <label class="toggle-switch">
                    <input type="checkbox" ${c.enabled ? 'checked' : ''} onchange="toggleCounter(${index}, this.checked)">
                    <span class="toggle-slider"></span>
                </label>
                <button class="btn-icon" onclick="editCounter(${index})"><i class="fas fa-edit"></i></button>
                <button class="btn-icon btn-danger" onclick="deleteCounter(${index})"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function addCounter() {
    const trigger = document.getElementById('new-counter-trigger').value;
    const response = document.getElementById('new-counter-response').value;
    sendWebSocket({ type: 'addCounter', data: { trigger, response } });
    hideModal('add-counter-modal');
}

function toggleCounter(index, enabled) {
    const c = counters[index];
    sendWebSocket({ type: 'updateCounter', data: { oldTrigger: c.trigger, newTrigger: c.trigger, response: c.response, enabled: enabled } });
}

function deleteCounter(index) {
    if(!confirm('삭제하시겠습니까?')) return;
    sendWebSocket({ type: 'removeCounter', data: { trigger: counters[index].trigger } });
}

function editCounter(index) {
    window.editingCounterIndex = index;
    const c = counters[index];
    document.getElementById('edit-counter-trigger').value = c.trigger;
    document.getElementById('edit-counter-response').value = c.response;
    document.getElementById('edit-counter-count').value = c.state?.totalCount || 0;
    showModal('edit-counter-modal');
}

function updateCounter() {
    const index = window.editingCounterIndex;
    const c = counters[index];
    const newTrig = document.getElementById('edit-counter-trigger').value;
    const newResp = document.getElementById('edit-counter-response').value;
    sendWebSocket({ type: 'updateCounter', data: { oldTrigger: c.trigger, newTrigger: newTrig, response: newResp, enabled: c.enabled } });
    hideModal('edit-counter-modal');
}

function updateSettings(s) {
    if(s.songRequestCooldown) document.getElementById('song-cooldown').value = s.songRequestCooldown;
    if(s.songMinDonation !== undefined) document.getElementById('song-min-donation').value = s.songMinDonation;
    if(s.songRequestMode) {
        const radio = document.querySelector(`input[name="songRequestMode"][value="${s.songRequestMode}"]`);
        if(radio) radio.checked = true;
    }
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
            <span class="ranking-position">${i+1}</span>
            <span class="ranking-name">${escapeHTML(u.nickname)}</span>
            <span class="ranking-points">${u.points.toLocaleString()}P</span>
        </div>
    `).join('');
}

function savePointsSettings() {
    const perChat = document.getElementById('points-per-chat').value;
    const cooldown = document.getElementById('points-cooldown').value;
    const unit = document.getElementById('points-unit').value;
    sendWebSocket({ type: 'updateSetting', data: { setting: 'pointsPerChat', value: perChat } });
    sendWebSocket({ type: 'updateSetting', data: { setting: 'pointCooldown', value: cooldown } });
    sendWebSocket({ type: 'updateSetting', data: { setting: 'pointsUnit', value: unit } });
    showNotification('저장되었습니다', 'success');
}

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
    sendWebSocket({ type: 'updateSongSetting', data: { setting: 'songRequestCooldown', value: cd } });
    sendWebSocket({ type: 'updateSongSetting', data: { setting: 'songRequestMinDonation', value: md } });
    sendWebSocket({ type: 'updateSongSetting', data: { setting: 'songRequestMode', value: mode } });
    showNotification('저장되었습니다', 'success');
}
function openPlayer() { window.open('/player.html', '_blank'); }

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
    renderSessionRanking(state.sessionRanking || []);
    renderTotalRanking(state.totalRanking || []);
}

function renderSessionRanking(ranking) {
    const list = document.getElementById('session-ranking-list');
    const countBadge = document.getElementById('session-ranking-count');
    if (!list) return;
    if (countBadge) countBadge.textContent = ranking.length;
    if (ranking.length === 0) { list.innerHTML = '<div class="empty-state">참여 기록이 없습니다</div>'; return; }
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
    if (ranking.length === 0) { list.innerHTML = '<div class="empty-state">참여 기록이 없습니다</div>'; if (loadMoreBtn) loadMoreBtn.style.display = 'none'; return; }
    
    // Paging logic needed or just show top 5
    const displayList = ranking.slice(0, 5); 
    list.innerHTML = displayList.map((r, i) => `
        <div class="ranking-item ${i < 3 ? 'top-' + (i + 1) : ''}">
            <span class="ranking-position">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</span>
            <span class="ranking-name">${escapeHTML(r.nickname)}</span>
            <span class="ranking-points">${r.count}회</span>
        </div>
    `).join('');
    if (loadMoreBtn) loadMoreBtn.style.display = ranking.length > 5 ? 'block' : 'none';
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

function addChatMessage(data) {
    const c = document.getElementById('chat-messages');
    if(!c) return;
    const div = document.createElement('div');
    div.className = 'chat-message';
    div.innerHTML = `<span class="chat-message-user">${escapeHTML(data.profile?.nickname)}</span> <span class="chat-message-text">${escapeHTML(data.message)}</span>`;
    c.prepend(div);
    if(c.children.length > 50) c.lastChild.remove();
}

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

function initDraggableChat() {
    // Already implemented in enhanced-chat.js if loaded, 
    // but basic implementation here for fallback
}

function initOverlayUrl() { 
    const el = document.getElementById('overlay-url');
    if(el) el.value = `${window.location.origin}/overlay/vote`; 
}
function copyOverlayUrl() {
    const url = document.getElementById('overlay-url');
    url.select(); document.execCommand('copy'); showNotification('복사됨', 'success');
}
function saveOverlaySettings() {
    // Handled in vote-system.js usually, but here for compatibility
    const op = document.getElementById('overlay-opacity').value;
    const col = document.getElementById('overlay-color').value;
    const anim = document.getElementById('overlay-animation').checked;
    const conf = document.getElementById('overlay-confetti').checked;
    sendWebSocket({ type: 'updateOverlaySettings', payload: { backgroundOpacity: parseInt(op), themeColor: col, showAnimation: anim, showConfetti: conf } });
    showNotification('저장되었습니다', 'success');
}
function clearVoteHistory() {
    if(confirm('전체 삭제?')) sendWebSocket({ type: 'clearVoteHistory' });
}

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
    
    const maxSlider = document.getElementById('max-participants-slider');
    const maxInput = document.getElementById('max-participants');
    if(maxSlider && maxInput) {
        maxSlider.oninput = () => { maxInput.value = maxSlider.value; };
        maxSlider.onchange = () => { updateMaxParticipants(maxSlider.value); };
        maxInput.onchange = () => { maxSlider.value = maxInput.value; updateMaxParticipants(maxInput.value); };
    }
}

function initDashboard() {
    console.log('[Dashboard] Init');
    initWebSocket();
    initTabs();
    initButtonListeners();
    initFunctionChips();
    initOverlayUrl();
    
    // 미리보기 업데이트 리스너 연결
    const cmdResp = document.getElementById('new-command-response');
    if(cmdResp) cmdResp.oninput = updateCommandPreview;
    
    const editCmdResp = document.getElementById('edit-command-response');
    if(editCmdResp) editCmdResp.oninput = updateEditCommandPreview;
    
    const macroMsg = document.getElementById('new-macro-message');
    if(macroMsg) macroMsg.oninput = updateMacroPreview;
    
    const editMacroMsg = document.getElementById('edit-macro-message');
    if(editMacroMsg) editMacroMsg.oninput = updateEditMacroPreview;
    
    const countResp = document.getElementById('new-counter-response');
    if(countResp) countResp.oninput = updateCounterPreview;
    
    const editCountResp = document.getElementById('edit-counter-response');
    if(editCountResp) editCountResp.oninput = updateEditCounterPreview;
}

function updateCommandPreview() {
    const val = document.getElementById('new-command-response').value;
    document.getElementById('command-preview').innerHTML = val ? previewText(val) : '';
}
function updateEditCommandPreview() {
    const val = document.getElementById('edit-command-response').value;
    document.getElementById('edit-command-preview').innerHTML = val ? previewText(val) : '';
}
function updateMacroPreview() {
    const val = document.getElementById('new-macro-message').value;
    document.getElementById('macro-preview').innerHTML = val ? previewText(val) : '';
}
function updateEditMacroPreview() {
    const val = document.getElementById('edit-macro-message').value;
    document.getElementById('edit-macro-preview').innerHTML = val ? previewText(val) : '';
}
function updateCounterPreview() {
    const val = document.getElementById('new-counter-response').value;
    document.getElementById('counter-preview').innerHTML = val ? previewText(val, true) : '';
}
function updateEditCounterPreview() {
    const val = document.getElementById('edit-counter-response').value;
    document.getElementById('edit-counter-preview').innerHTML = val ? previewText(val, true) : '';
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initDashboard);
else initDashboard();