// ============================================
// Chzzk Bot Dashboard - Complete & Fixed
// ============================================

let socket = null;
window.socket = null;
let currentUser = null;

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Dashboard] Initializing...');
    
    // 1. Session Check
    try {
        await checkSession();
    } catch (e) {
        console.error('Session check failed:', e);
        showLoginScreen();
    }

    // 2. UI Setup
    setupUI();
    
    // 3. Init Tabs
    if (typeof initTabs === 'function') initTabs();
});

async function checkSession() {
    try {
        const res = await fetch('/api/auth/session', { cache: 'no-store' });
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
    const landing = document.getElementById('landing-page');
    const app = document.getElementById('app-container');
    const overlay = document.getElementById('login-overlay');
    
    if (landing) landing.classList.remove('hidden');
    if (app) app.classList.add('hidden');
    if (overlay) overlay.classList.add('hidden');
}

function showDashboard() {
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
    
    // Channel Info Card
    const channelAvatarLg = document.getElementById('channel-avatar'); // ID fix based on HTML
    const channelNameLg = document.getElementById('channel-name');
    
    if (user.channelImageUrl) {
        if(headerAvatar) headerAvatar.style.backgroundImage = `url(${user.channelImageUrl})`;
        if(sidebarAvatar) sidebarAvatar.style.backgroundImage = `url(${user.channelImageUrl})`;
        if(channelAvatarLg) channelAvatarLg.style.backgroundImage = `url(${user.channelImageUrl})`;
    }
    if(headerUsername) headerUsername.textContent = user.channelName;
    if(sidebarName) sidebarName.textContent = user.channelName;
    if(channelNameLg) channelNameLg.textContent = user.channelName;
}

// ============================================
// WebSocket
// ============================================

function initWebSocket() {
    if (socket) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let wsUrl = window.getServerWebSocketUrl ? window.getServerWebSocketUrl() : `${wsProtocol}//${window.location.host}`;

    console.log('[WS] Connecting to:', wsUrl);
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
        console.log('[WS] Disconnected');
        updateBotStatus(false);
        socket = null;
        window.socket = null;
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
            if (!msg.authenticated) handleLogout();
            break;
        case 'botStatus':
            updateBotStatus(msg.payload?.connected);
            break;
        case 'commands': updateList('commands-list', msg.data, renderCommandItem); break;
        case 'macros': updateList('macros-list', msg.data, renderMacroItem); break;
        case 'counters': updateList('counters-list', msg.data, renderCounterItem); break;
        
        case 'songStateUpdate': updateSongState(msg.payload); break;
        case 'participationStateUpdate': updateParticipationState(msg.payload); break;
        case 'voteStateUpdate': if(window.updateVoteUI) window.updateVoteUI(msg.payload); break;
        case 'drawStateUpdate': if(window.updateDrawUI) window.updateDrawUI(msg.payload); break;
        case 'rouletteStateUpdate': if(window.updateRouletteUI) window.updateRouletteUI(msg.payload); break;
        case 'newChat': addChatMessage(msg.payload); break;
        case 'pointsUpdate': updatePointsData(msg.payload); break;
    }
}

function sendWebSocket(data) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(data));
    }
}

function updateBotStatus(connected) {
    const indicator = document.getElementById('bot-status-indicator');
    const text = document.getElementById('bot-status-text');
    if (indicator) indicator.className = `status-indicator ${connected ? 'online' : ''}`;
    if (text) text.textContent = connected ? '봇 연결됨' : '봇 미연결';
}

// ============================================
// UI & Listeners
// ============================================

function setupUI() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.dataset.tab;
            switchTab(tabId);
        });
    });

    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
    
    // Button Listeners
    const safeAddListener = (id, handler) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', handler);
    };

    safeAddListener('add-command-btn', () => showModal('add-command-modal'));
    safeAddListener('save-points-settings', savePointsSettings);
    safeAddListener('save-song-settings', saveSongSettings);
    safeAddListener('toggle-participation-btn', toggleParticipation);
    safeAddListener('clear-participation-btn', clearParticipation);
    safeAddListener('play-pause-btn', togglePlayPause);
    safeAddListener('skip-btn', skipSong);
    safeAddListener('stop-song-btn', stopSong);
    
    // Sliders
    const maxSlider = document.getElementById('max-participants-slider');
    const maxInput = document.getElementById('max-participants');
    const maxVal = document.getElementById('max-participants-val');
    
    if (maxSlider && maxInput) {
        maxSlider.oninput = () => { 
            maxInput.value = maxSlider.value; 
            if(maxVal) maxVal.textContent = maxSlider.value;
        };
        maxSlider.onchange = () => { 
            sendWebSocket({ type: 'updateMaxParticipants', data: { max: parseInt(maxSlider.value) } });
        };
    }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    
    document.getElementById(`${tabId}-tab`)?.classList.add('active');
    document.querySelector(`.nav-item[data-tab="${tabId}"]`)?.classList.add('active');
}

async function handleLogout() {
    if (confirm('로그아웃 하시겠습니까?')) {
        try { await fetch('/auth/logout', { method: 'POST' }); } catch(e) {}
        currentUser = null;
        if (socket) socket.close();
        window.location.href = '/'; 
    }
}

window.handleLogout = handleLogout;

// ============================================
// Features
// ============================================

function updateList(containerId, items, renderFunc) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!items || items.length === 0) {
        container.innerHTML = '<div class="empty-state" style="padding:20px;text-align:center;color:#666;">데이터가 없습니다.</div>';
        return;
    }
    container.innerHTML = items.map((item, index) => renderFunc(item, index)).join('');
}

function renderCommandItem(cmd) {
    const triggers = cmd.triggers || (cmd.trigger ? [cmd.trigger] : []);
    const triggerStr = triggers.join(', ');
    return `
        <div class="item-card" style="display:flex;justify-content:space-between;padding:10px;border-bottom:1px solid #333;">
            <div class="item-info">
                <span class="item-trigger" style="color:#00ff94;font-weight:bold;margin-right:10px;">${triggerStr}</span>
                <span class="item-response">${escapeHTML(cmd.response)}</span>
            </div>
            <div class="item-actions">
                <button class="btn-icon btn-danger" onclick="deleteCommand('${triggerStr}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `;
}

function renderMacroItem(macro) {
    return `
        <div class="item-card" style="display:flex;justify-content:space-between;padding:10px;border-bottom:1px solid #333;">
            <div class="item-info">
                <span class="item-trigger" style="color:#7047eb;margin-right:10px;">${macro.interval}분</span>
                <span class="item-response">${escapeHTML(macro.message)}</span>
            </div>
             <div class="item-actions">
                <button class="btn-icon btn-danger" onclick="deleteMacro(${macro.id})"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `;
}

function renderCounterItem(counter) {
    return `
        <div class="item-card" style="display:flex;justify-content:space-between;padding:10px;border-bottom:1px solid #333;">
            <div class="item-info">
                <span class="item-trigger" style="font-weight:bold;">${counter.trigger}</span>
                <span class="item-response" style="color:#aaa;margin-left:10px;">${escapeHTML(counter.response)}</span>
                <span class="item-count" style="margin-left:10px;background:#333;padding:2px 6px;border-radius:4px;">#${counter.state?.totalCount || 0}</span>
            </div>
             <div class="item-actions">
                <button class="btn-icon btn-danger" onclick="deleteCounter('${counter.trigger}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `;
}

// Global functions for inline onclick handlers
window.deleteCommand = (trigger) => {
    if(confirm('삭제하시겠습니까?')) sendWebSocket({ type: 'removeCommand', data: { trigger } });
};
window.deleteMacro = (id) => {
    if(confirm('삭제하시겠습니까?')) sendWebSocket({ type: 'removeMacro', data: { id } });
};
window.deleteCounter = (trigger) => {
    if(confirm('삭제하시겠습니까?')) sendWebSocket({ type: 'removeCounter', data: { trigger } });
};
window.addCommand = () => {
    const trigger = document.getElementById('new-command-trigger').value;
    const response = document.getElementById('new-command-response').value;
    if(trigger && response) {
        sendWebSocket({ type: 'addCommand', data: { trigger, response } });
        hideModal('add-command-modal');
        document.getElementById('new-command-trigger').value = '';
        document.getElementById('new-command-response').value = '';
    }
};

// Song Functions
function updateSongState(state) {
    if (!state) return;
    const current = document.getElementById('current-song');
    const queueList = document.getElementById('song-queue-list');
    const count = document.getElementById('queue-count');
    
    if (count) count.textContent = state.queue.length;
    
    if (current) {
        if (state.currentSong) {
            current.innerHTML = `<div style="font-size:18px;font-weight:bold;margin-bottom:5px;">${escapeHTML(state.currentSong.title)}</div><div style="font-size:14px;color:#aaa">신청: ${escapeHTML(state.currentSong.requester)}</div>`;
        } else {
            current.innerHTML = '<div class="no-song">재생 중인 곡 없음</div>';
        }
    }
    
    const playBtn = document.getElementById('play-pause-btn');
    if(playBtn) {
        playBtn.innerHTML = state.isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
    }
    
    if (queueList) {
        if (state.queue.length > 0) {
            queueList.innerHTML = state.queue.map(s => 
                `<div class="item-card" style="padding:10px;border-bottom:1px solid #333;display:flex;justify-content:space-between;align-items:center;">
                    <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;margin-right:10px;">${escapeHTML(s.title)}</div>
                    <button class="btn-icon btn-danger" onclick="removeSong('${s.id}')"><i class="fas fa-times"></i></button>
                </div>`
            ).join('');
        } else {
            queueList.innerHTML = '<div class="empty-state" style="padding:20px;text-align:center;color:#666;">대기열 없음</div>';
        }
    }
}

window.removeSong = (id) => sendWebSocket({ type: 'controlMusic', action: 'removeFromQueue', payload: id });
function skipSong() { sendWebSocket({ type: 'controlMusic', action: 'skip' }); }
function stopSong() { sendWebSocket({ type: 'controlMusic', action: 'deleteCurrent' }); }
function togglePlayPause() { sendWebSocket({ type: 'controlMusic', action: 'togglePlayPause' }); }
function saveSongSettings() {
    const cd = document.getElementById('song-cooldown').value;
    const md = document.getElementById('song-min-donation').value;
    const mode = document.getElementById('song-request-mode').value;
    
    sendWebSocket({ type: 'updateSongSetting', data: { setting: 'songRequestCooldown', value: cd } });
    sendWebSocket({ type: 'updateSongSetting', data: { setting: 'songRequestMinDonation', value: md } });
    sendWebSocket({ type: 'updateSongSetting', data: { setting: 'songRequestMode', value: mode } });
    alert('저장되었습니다.');
}

// Participation Functions
function updateParticipationState(state) {
    if (!state) return;
    const queue = document.getElementById('waiting-queue');
    const active = document.getElementById('active-participants');
    const wCount = document.getElementById('waiting-count');
    const aCount = document.getElementById('active-count');
    
    if(wCount) wCount.textContent = state.queue.length;
    if(aCount) aCount.textContent = state.participants.length;
    
    if(queue) queue.innerHTML = state.queue.map(p => `<div style="padding:5px;border-bottom:1px solid #333;">${p.nickname}</div>`).join('') || '<div style="text-align:center;color:#666;padding:10px;">없음</div>';
    if(active) active.innerHTML = state.participants.map(p => `<div style="padding:5px;border-bottom:1px solid #333;">${p.nickname}</div>`).join('') || '<div style="text-align:center;color:#666;padding:10px;">없음</div>';
    
    const btn = document.getElementById('toggle-participation-btn');
    if(btn) {
        btn.textContent = state.isParticipationActive ? '마감' : '시작';
        btn.className = state.isParticipationActive ? 'btn btn-danger' : 'btn btn-primary';
    }
}

function toggleParticipation() {
    const btn = document.getElementById('toggle-participation-btn');
    if (btn.textContent === '시작') {
        sendWebSocket({ type: 'startParticipation' });
    } else {
        sendWebSocket({ type: 'stopParticipation' });
    }
}
function clearParticipation() {
    if(confirm('초기화?')) sendWebSocket({ type: 'clearAllParticipation' });
}

// Points Functions
function savePointsSettings() {
    const points = document.getElementById('points-per-chat').value;
    const cd = document.getElementById('points-cooldown').value;
    const unit = document.getElementById('points-unit').value;
    
    sendWebSocket({ type: 'updateSetting', data: { setting: 'pointsPerChat', value: points } });
    sendWebSocket({ type: 'updateSetting', data: { setting: 'pointCooldown', value: cd } });
    sendWebSocket({ type: 'updateSetting', data: { setting: 'pointsUnit', value: unit } });
    alert('저장되었습니다.');
}

function updatePointsData(data) {
    const list = document.getElementById('points-ranking');
    if (!list || !data.leaderboard) return;
    
    list.innerHTML = data.leaderboard.slice(0, 10).map((u, i) => `
        <div style="display:flex;justify-content:space-between;padding:10px;border-bottom:1px solid #333;">
            <span>${i+1}. ${escapeHTML(u.nickname)}</span>
            <span style="color:#00ff94;font-weight:bold;">${u.points.toLocaleString()}</span>
        </div>
    `).join('');
}

// Chat
function addChatMessage(data) {
    const c = document.getElementById('chat-messages');
    if(!c) return;
    
    // Remove empty state
    const empty = c.querySelector('.chat-empty');
    if(empty) empty.remove();
    
    const div = document.createElement('div');
    div.className = 'chat-message';
    div.innerHTML = `<span style="font-weight:bold;color:#00ff94;margin-right:5px;">${escapeHTML(data.profile.nickname)}</span> <span style="color:#ddd;">${escapeHTML(data.message)}</span>`;
    c.prepend(div);
    if(c.children.length > 50) c.lastChild.remove();
}

// Utils
function showModal(id) { 
    const el = document.getElementById(id);
    if(el) {
        el.classList.remove('hidden');
        el.classList.add('show');
    }
}
function hideModal(id) { 
    const el = document.getElementById(id);
    if(el) {
        el.classList.remove('show');
        el.classList.add('hidden');
    }
}
function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

window.hideModal = hideModal;
window.showModal = showModal;