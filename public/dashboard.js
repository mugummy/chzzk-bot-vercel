// ============================================
// Chzzk Bot Dashboard - Secure & Functional
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
        // 캐시를 무시하고 최신 세션 상태를 가져옴
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
    document.getElementById('landing-page').classList.remove('hidden');
    document.getElementById('app-container').classList.add('hidden');
    document.getElementById('login-overlay').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('landing-page').classList.add('hidden');
    document.getElementById('login-overlay').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    
    if (currentUser) {
        const username = document.getElementById('header-username');
        const sidebarName = document.getElementById('sidebar-name');
        const avatar = document.getElementById('header-avatar');
        const sidebarAvatar = document.getElementById('sidebar-avatar');
        
        if(username) username.textContent = currentUser.channelName;
        if(sidebarName) sidebarName.textContent = currentUser.channelName;
        if(currentUser.channelImageUrl) {
            if(avatar) avatar.style.backgroundImage = `url(${currentUser.channelImageUrl})`;
            if(sidebarAvatar) sidebarAvatar.style.backgroundImage = `url(${currentUser.channelImageUrl})`;
        }
    }
}

function initWebSocket() {
    if (socket) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let wsUrl = window.getServerWebSocketUrl ? window.getServerWebSocketUrl() : `${wsProtocol}//${window.location.host}`;

    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
        console.log('[WS] Connected');
        if (currentUser) {
            socket.send(JSON.stringify({ type: 'connect', data: { channel: currentUser.channelId } }));
        }
        setTimeout(() => { socket.send(JSON.stringify({ type: 'requestData', dataType: 'all' })); }, 500);
    };

    socket.onclose = () => {
        socket = null;
        if (!document.getElementById('app-container').classList.contains('hidden')) {
            setTimeout(initWebSocket, 3000);
        }
    };

    socket.onmessage = (event) => {
        try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'authStatus' && !msg.authenticated) {
                handleLogout(); // 세션 만료 시 로그아웃 처리
            }
            // (기타 메시지 핸들러...)
        } catch (e) {}
    };
}

function setupUI() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            document.getElementById(`${item.dataset.tab}-tab`)?.classList.add('active');
            item.classList.add('active');
        });
    });

    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
}

async function handleLogout() {
    if (confirm('로그아웃 하시겠습니까?')) {
        try {
            await fetch('/auth/logout', { method: 'POST' });
        } catch(e) {}
        
        // 로컬 상태 초기화 및 페이지 새로고침 (가장 확실한 방법)
        currentUser = null;
        if (socket) socket.close();
        
        // 쿠키와 세션이 완전히 날아가도록 페이지를 아예 새로고침합니다.
        window.location.href = '/'; 
    }
}

window.handleLogout = handleLogout;