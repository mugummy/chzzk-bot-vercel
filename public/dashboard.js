// ============================================
// Chzzk Bot Dashboard - Secured Dynamic URL & Tab Routing
// ============================================

let socket = null;
window.socket = null;
let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Dashboard] Initializing...');
    await checkSession();
    
    // 세션 체크 후 UI 설정 및 초기 탭 로드
    setupUI();
    if (typeof initTabs === 'function') initTabs();
    
    // URL 기반 초기 탭 설정
    handleInitialTab();
    
    // 뒤로가기/앞으로가기 처리
    window.addEventListener('popstate', handlePopState);
});

async function checkSession() {
    try {
        const res = await fetch('/api/auth/session', { cache: 'no-store', credentials: 'include' });
        const data = await res.json();
        
        // 현재 경로 분석
        const path = window.location.pathname;
        const parts = path.split('/').filter(p => p); // 빈 문자열 제거
        const isDashboardPath = parts[0] === 'dashboard';
        
        if (data.authenticated && data.user) {
            console.log('[Auth] Logged in:', data.user.channelName);
            currentUser = data.user;
            
            // 권한 검사 (URL의 채널명과 내 채널명이 다르면 내 걸로 강제 이동)
            if (isDashboardPath && parts[1] && decodeURIComponent(parts[1]) !== currentUser.channelName) {
                alert('본인의 대시보드만 접근할 수 있습니다.');
                const tab = parts[2] || 'dashboard';
                window.location.href = `/dashboard/${currentUser.channelName}/${tab}`;
                return;
            }

            // 대시보드 표시
            showDashboard();
            updateProfileUI(currentUser);
            initWebSocket();
            
            // 루트나 이상한 경로로 왔으면 기본 대시보드로 이동
            if (!isDashboardPath) {
                const newUrl = `/dashboard/${currentUser.channelName}/dashboard`;
                history.replaceState(null, '', newUrl);
            }
        } else {
            console.log('[Auth] No session');
            // 대시보드 경로로 접근했지만 비로그인 상태면 홈으로
            if (isDashboardPath) {
                window.location.href = '/';
            } else {
                showLanding();
            }
        }
    } catch (e) {
        console.error('[Auth] Error:', e);
        showLanding();
    }
}

function handleInitialTab() {
    const path = window.location.pathname;
    const parts = path.split('/').filter(p => p);
    
    // /dashboard/{channelName}/{tabName} 구조라고 가정
    if (parts.length >= 3) {
        const tabName = parts[2];
        if (document.getElementById(`${tabName}-tab`)) {
            switchTab(tabName, false); // false = history push 안 함 (이미 URL에 있으니까)
        }
    }
}

function handlePopState() {
    // 뒤로가기 시 URL에 맞춰 탭 변경
    const path = window.location.pathname;
    const parts = path.split('/').filter(p => p);
    if (parts.length >= 3) {
        switchTab(parts[2], false);
    } else {
        switchTab('dashboard', false);
    }
}

function showLanding() {
    document.getElementById('landing-layer').classList.remove('hidden');
    document.getElementById('app-container').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('landing-layer').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    document.getElementById('app-container').style.display = 'flex';
}

function updateProfileUI(user) {
    const ids = {
        headerAvatar: 'header-avatar',
        headerName: 'header-username',
        sidebarAvatar: 'sidebar-avatar',
        sidebarName: 'sidebar-name',
        cardAvatar: 'channel-avatar-lg',
        cardName: 'channel-name-lg'
    };

    const setBg = (id, url) => { const el = document.getElementById(id); if(el) el.style.backgroundImage = `url(${url})`; };
    const setText = (id, txt) => { const el = document.getElementById(id); if(el) el.textContent = txt; };

    if (user.channelImageUrl) {
        setBg(ids.headerAvatar, user.channelImageUrl);
        setBg(ids.sidebarAvatar, user.channelImageUrl);
        setBg(ids.cardAvatar, user.channelImageUrl);
    }
    setText(ids.headerName, user.channelName);
    setText(ids.sidebarName, user.channelName);
    setText(ids.cardName, user.channelName);
}

// WebSocket Logic
function initWebSocket() {
    if (socket) return;
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let wsUrl = window.getServerWebSocketUrl ? window.getServerWebSocketUrl() : `${wsProtocol}//${window.location.host}`;
    
    socket = new WebSocket(wsUrl);
    window.socket = socket;

    socket.onopen = () => {
        updateBotStatus(true);
        if (currentUser) socket.send(JSON.stringify({ type: 'connect', data: { channel: currentUser.channelId } }));
        setTimeout(() => socket.send(JSON.stringify({ type: 'requestData', dataType: 'all' })), 500);
    };

    socket.onclose = () => {
        updateBotStatus(false);
        socket = null;
        if (currentUser) setTimeout(initWebSocket, 3000);
    };

    socket.onmessage = (event) => {
        try { handleMessage(JSON.parse(event.data)); } catch (e) {}
    };
}

function handleMessage(msg) {
    switch (msg.type) {
        case 'authStatus': if (!msg.authenticated) handleLogout(); break;
        case 'botStatus': updateBotStatus(msg.payload?.connected); break;
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
        case 'connectResult': 
            if(msg.success && msg.channelInfo) {
                const el = document.getElementById('follower-count');
                if(el) el.innerHTML = `<i class="fas fa-heart" style="color:#fa5252"></i> ${msg.channelInfo.followerCount.toLocaleString()} 팔로워`;
            }
            break;
    }
}

function updateBotStatus(connected) {
    const ind = document.getElementById('bot-status-indicator');
    const txt = document.getElementById('bot-status-text');
    if (ind) ind.className = `status-indicator ${connected ? 'online' : ''}`;
    if (txt) txt.textContent = connected ? '연결됨' : '미연결';
}

// UI Setup & Tab Switching
function setupUI() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.dataset.tab;
            switchTab(tabId, true); // true = URL 변경 함
        });
    });

    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);

    // Button Bindings
    const bind = (id, fn) => { const el = document.getElementById(id); if(el) el.addEventListener('click', fn); };
    
    bind('add-command-btn', () => showModal('add-command-modal'));
    bind('add-macro-btn', () => showModal('add-macro-modal'));
    bind('add-counter-btn', () => showModal('add-counter-modal'));
    bind('save-song-settings', saveSongSettings);
    bind('play-pause-btn', togglePlayPause);
    bind('skip-btn', skipSong);
    bind('stop-song-btn', stopSong);
    bind('toggle-participation-btn', toggleParticipation);
    bind('clear-participation-btn', clearParticipation);
    bind('save-points-settings', savePointsSettings);
}

function switchTab(tabId, updateHistory = true) {
    // 탭 UI 업데이트
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    const targetTab = document.getElementById(`${tabId}-tab`);
    const targetNav = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
    
    if (targetTab) targetTab.classList.add('active');
    if (targetNav) targetNav.classList.add('active');
    
    // URL 업데이트
    if (updateHistory && currentUser) {
        const newUrl = `/dashboard/${currentUser.channelName}/${tabId}`;
        history.pushState({ tab: tabId }, '', newUrl);
    }
}

async function handleLogout() {
    if (confirm('로그아웃 하시겠습니까?')) {
        try { await fetch('/auth/logout', { method: 'POST', credentials: 'include' }); } catch(e) {}
        window.location.href = '/'; 
    }
}

// Helpers & Renderers
function updateList(id, items, render) {
    const el = document.getElementById(id);
    if(el) el.innerHTML = (items && items.length) ? items.map(render).join('') : '<div class="empty-state">데이터 없음</div>';
}

function renderCommandItem(c) {
    const t = c.trigger || c.triggers?.[0];
    return `<div class="item-card"><div class="item-info"><span class="item-trigger">${t}</span><span class="item-response">${c.response}</span></div><div class="item-actions"><button class="btn-icon" onclick="deleteCommand('${t}')"><i class="fas fa-trash"></i></button></div></div>`;
}

function renderMacroItem(m) {
    return `<div class="item-card"><div class="item-info"><span class="item-trigger">${m.interval}분</span><span class="item-response">${m.message}</span></div><div class="item-actions"><button class="btn-icon" onclick="deleteMacro(${m.id})"><i class="fas fa-trash"></i></button></div></div>`;
}

function renderCounterItem(c) {
    return `<div class="item-card"><div class="item-info"><span class="item-trigger">${c.trigger}</span><span class="item-response">#${c.state?.totalCount||0}</span></div><div class="item-actions"><button class="btn-icon" onclick="deleteCounter('${c.trigger}')"><i class="fas fa-trash"></i></button></div></div>`;
}

// Global Actions (Socket send)
function send(type, data) { if(socket && socket.readyState === 1) socket.send(JSON.stringify({ type, data })); }

window.deleteCommand = (trigger) => { if(confirm('삭제?')) send('removeCommand', { trigger }); };
window.deleteMacro = (id) => { if(confirm('삭제?')) send('removeMacro', { id }); };
window.deleteCounter = (trigger) => { if(confirm('삭제?')) send('removeCounter', { trigger }); };

window.addCommand = () => {
    const t = document.getElementById('new-command-trigger').value;
    const r = document.getElementById('new-command-response').value;
    if(t && r) { send('addCommand', { trigger: t, response: r }); hideModal('add-command-modal'); }
};
window.addMacro = () => {
    const i = document.getElementById('new-macro-interval').value;
    const m = document.getElementById('new-macro-message').value;
    if(i && m) { send('addMacro', { interval: parseInt(i), message: m }); hideModal('add-macro-modal'); }
};
window.addCounter = () => {
    const t = document.getElementById('new-counter-trigger').value;
    const r = document.getElementById('new-counter-response').value;
    if(t && r) { send('addCounter', { trigger: t, response: r }); hideModal('add-counter-modal'); }
};

// Feature Functions
function updateSongState(s) {
    if(!s) return;
    document.getElementById('queue-count').textContent = s.queue.length;
    const cur = document.getElementById('current-song');
    if(cur) cur.innerHTML = s.currentSong ? `<div>${s.currentSong.title}</div><small>${s.currentSong.requester}</small>` : '재생 중인 곡 없음';
    
    const list = document.getElementById('song-queue-list');
    if(list) list.innerHTML = s.queue.map(q => `<div class="item-card"><span>${q.title}</span><button class="btn-icon" onclick="removeSong('${q.id}')"><i class="fas fa-times"></i></button></div>`).join('');
}
window.removeSong = (id) => { send('controlMusic', {action:'removeFromQueue', payload:id}); };
function togglePlayPause() { send('controlMusic', {action:'togglePlayPause'}); }
function skipSong() { send('controlMusic', {action:'skip'}); }
function stopSong() { send('controlMusic', {action:'deleteCurrent'}); }
function saveSongSettings() {
    const cd = document.getElementById('song-cooldown').value;
    const min = document.getElementById('song-min-donation').value;
    send('updateSongSetting', { setting:'songRequestCooldown', value: cd });
    send('updateSongSetting', { setting:'songRequestMinDonation', value: min });
    alert('저장됨');
}

function updateParticipationState(s) {
    if(!s) return;
    document.getElementById('waiting-count').textContent = s.queue.length;
    document.getElementById('active-count').textContent = s.participants.length;
    document.getElementById('waiting-queue').innerHTML = s.queue.map(p => `<div>${p.nickname}</div>`).join('');
    document.getElementById('active-participants').innerHTML = s.participants.map(p => `<div>${p.nickname}</div>`).join('');
    
    const btn = document.getElementById('toggle-participation-btn');
    if(btn) {
        btn.textContent = s.isParticipationActive ? '마감' : '시작';
        btn.className = s.isParticipationActive ? 'btn btn-danger' : 'btn btn-primary';
    }
}
function toggleParticipation() {
    const btn = document.getElementById('toggle-participation-btn');
    send(btn.textContent === '시작' ? 'startParticipation' : 'stopParticipation');
}
function clearParticipation() { if(confirm('초기화?')) send('clearAllParticipation'); }

function updatePointsData(d) {
    const list = document.getElementById('points-ranking');
    if(list && d.leaderboard) list.innerHTML = d.leaderboard.slice(0,10).map((u,i)=>`<div class="item-card"><span>${i+1}. ${u.nickname}</span><span>${u.points}P</span></div>`).join('');
}
function savePointsSettings() {
    const p = document.getElementById('points-per-chat').value;
    const c = document.getElementById('points-cooldown').value;
    send('updateSetting', { setting:'pointsPerChat', value: p });
    send('updateSetting', { setting:'pointCooldown', value: c });
    alert('저장됨');
}

function addChatMessage(c) {
    const box = document.getElementById('chat-messages');
    if(box) {
        box.innerHTML = `<div style="padding:5px;border-bottom:1px solid #333"><b>${c.profile.nickname}</b>: ${c.message}</div>` + box.innerHTML;
        if(box.children.length > 50) box.lastChild.remove();
    }
}

// Utils
function showModal(id) { document.getElementById(id)?.classList.add('show'); }
function hideModal(id) { document.getElementById(id)?.classList.remove('show'); }
window.hideModal = hideModal;
window.handleLogout = handleLogout;