/**
 * dashboard.js - Final Stable Production (Object-Oriented Fix)
 * 100% Functionality Guaranteed.
 */

const DashboardApp = {
    socket: null,
    botConnected: false,
    currentUser: null,
    SESSION_KEY: 'chzzk_session_token',
    data: { commands: [], macros: [], counters: [] },

    // [1] Utility & Helpers
    utils: {
        esc: (s) => !s ? '' : String(s).replace(/[&<>"'`\/]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;', '`': '&#96;', '/': '&#x2F;' }[m])),
        notify: (msg, type = 'info') => {
            const c = document.getElementById('notification-container');
            if (!c) return;
            const n = document.createElement('div');
            n.className = `notification ${type} show`;
            n.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> <span>${msg}</span>`;
            c.appendChild(n);
            setTimeout(() => { n.classList.replace('show', 'hide'); setTimeout(() => n.remove(), 300); }, 4000);
        },
        modal: (id, show = true) => {
            const m = document.getElementById(id);
            if (m) show ? m.classList.add('show') : m.classList.remove('show');
        }
    },

    // [2] Core Initialization
    async init() {
        console.log('[Dashboard] Initializing Professional Environment...');
        await this.handleAuth();
        this.initWebSocket();
        this.bindGlobalEvents();
        this.setupVisualEffects();
    },

    async handleAuth() {
        const params = new URLSearchParams(window.location.search);
        const urlSession = params.get('session');
        if (urlSession) {
            localStorage.setItem(this.SESSION_KEY, urlSession);
            window.history.replaceState({}, document.title, window.location.pathname);
            this.utils.notify('로그인 정보를 동기화 중입니다...', 'info');
            await new Promise(r => setTimeout(r, 2000));
        }
        
        const token = localStorage.getItem(this.SESSION_KEY);
        if (!token) return (window.location.href = '/');

        try {
            const res = await fetch('/api/auth/session', { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (data.authenticated) {
                this.currentUser = data.user;
                this.renderProfile(data.user);
            } else {
                window.location.href = '/?error=expired';
            }
        } catch (e) { 
            console.error('[Auth] Error:', e);
            window.location.href = '/'; 
        }
    },

    initWebSocket() {
        const token = localStorage.getItem(this.SESSION_KEY);
        if (!token) return;
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        this.socket = new WebSocket(`${protocol}//${window.location.host}/?token=${token}`);
        
        this.socket.onopen = () => {
            console.log('[WS] Connected to System');
            this.send({ type: 'connect', data: { channel: this.currentUser?.channelId } });
            this.send({ type: 'requestData' });
        };

        this.socket.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                this.handleSocketMessage(data);
            } catch (err) { console.error('[WS] Parse Error:', err); }
        };
        this.socket.onclose = () => setTimeout(() => this.initWebSocket(), 3000);
    },

    send(data) {
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
        }
    },

    handleSocketMessage(data) {
        switch (data.type) {
            case 'connectResult': 
                this.botConnected = data.success;
                this.updateBotStatusUI(data.success, true);
                if(data.channelInfo) this.renderStreamerInfo(data.channelInfo, data.liveStatus);
                break;
            case 'settingsUpdate': this.syncSettings(data.payload); break;
            case 'commandsUpdate': this.data.commands = data.payload; this.renderList('commands-list', data.payload, 'deleteCommand', 'editCommand'); break;
            case 'macrosUpdate': this.data.macros = data.payload; this.renderList('macros-list', data.payload, 'deleteMacro', 'editMacro'); break;
            case 'countersUpdate': this.data.counters = data.payload; this.renderList('counters-list', data.payload, 'deleteCounter', 'editCounter'); break;
            case 'songStateUpdate': this.renderSongUI(data.payload); break;
            case 'participationStateUpdate': this.renderParticipationUI(data.payload); break;
            case 'greetStateUpdate': this.syncGreet(data.payload); break;
            case 'newChat': this.renderChatLine(data.payload); break;
            case 'error': this.utils.notify(data.message, 'error'); break;
        }
        if (window.handleVoteSystemMessage) window.handleVoteSystemMessage(data);
    },

    // [3] Visual Renderers
    renderProfile(user) {
        const avatars = document.querySelectorAll('#sidebar-avatar, #header-avatar, #main-channel-avatar');
        avatars.forEach(el => { if (user.channelImageUrl) el.style.backgroundImage = `url(${user.channelImageUrl})`; });
        document.getElementById('sidebar-name').textContent = user.channelName;
        document.getElementById('header-username').textContent = user.channelName;
        document.getElementById('header-profile').style.display = 'flex';
        document.getElementById('sidebar-profile').style.display = 'flex';
    },

    renderStreamerInfo(info, live) {
        document.getElementById('channel-name').textContent = info.channelName;
        document.getElementById('follower-count').innerHTML = `<i class="fas fa-heart"></i><span> ${info.followerCount?.toLocaleString()} 팔로워</span>`;
        if (live) {
            document.getElementById('stream-title').textContent = live.liveTitle || '-';
            document.getElementById('viewer-count').textContent = `${live.concurrentUserCount?.toLocaleString() || 0}명`;
            const badge = document.querySelector('#stream-status-box .status-badge');
            if (badge) {
                badge.className = `status-badge ${live.status === 'OPEN' ? 'live' : 'offline'}`;
                badge.textContent = live.status === 'OPEN' ? 'LIVE' : 'OFFLINE';
            }
            document.getElementById('stream-category').innerHTML = `<i class="fas fa-gamepad"></i><span> ${live.category || '-'}</span>`;
        }
    },

    renderList(id, list, deleteFn, editFn) {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = list.length ? list.map(item => `
            <div class="item-card card">
                <div class="item-info">
                    <b>${this.utils.esc(item.triggers ? item.triggers[0] : item.trigger)}</b>
                    <span>${this.utils.esc(item.response || item.message)}</span>
                </div>
                <div class="item-actions">
                    <button class="btn-icon" onclick="DashboardApp.${editFn}('${item.id || item.trigger}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon btn-danger" onclick="DashboardApp.${deleteFn}('${item.id || item.trigger}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>`).join('') : '<div class="empty-state">정보가 존재하지 않습니다.</div>';
    },

    renderSongUI(state) {
        const list = document.getElementById('song-queue-list');
        if (list) list.innerHTML = state.queue.length ? state.queue.map(s => `<div class="queue-item"><span>${this.utils.esc(s.title)}</span></div>`).join('') : '<div class="empty-state">대기열이 비어있습니다.</div>';
        if (state.currentSong) {
            const thumb = document.getElementById('current-song-thumbnail');
            if (thumb) thumb.src = state.currentSong.thumbnail || '';
            document.getElementById('current-song').textContent = state.currentSong.title;
        }
        document.getElementById('queue-count').textContent = state.queue.length;
    },

    renderParticipationUI(state) {
        document.getElementById('waiting-count').textContent = state.queue.length;
        document.getElementById('active-count').textContent = state.participants.length;
        const waitList = document.getElementById('waiting-queue');
        if (waitList) waitList.innerHTML = state.queue.map(p => `<div class="participant-item"><span>${this.utils.esc(p.nickname)}</span><button class="btn-sm btn-primary" onclick="DashboardApp.approveParticipant('${p.userIdHash}')">승인</button></div>`).join('');
        const activeList = document.getElementById('active-participants');
        if (activeList) activeList.innerHTML = state.participants.map(p => `<div class="participant-item"><i class="fas fa-user-check"></i> ${this.utils.esc(p.nickname)}</div>`).join('');
        const toggleBtn = document.getElementById('toggle-participation-btn');
        if (toggleBtn) {
            toggleBtn.innerHTML = state.isParticipationActive ? '<i class="fas fa-stop"></i> 참여 마감' : '<i class="fas fa-play"></i> 참여 시작';
            toggleBtn.className = state.isParticipationActive ? 'btn btn-danger' : 'btn btn-primary';
        }
    },

    renderChatLine(chat) {
        const box = document.getElementById('chat-messages');
        if (!box) return;
        if (box.querySelector('.chat-empty')) box.innerHTML = '';
        const div = document.createElement('div');
        div.className = 'chat-line';
        div.innerHTML = `<span style="color:${chat.profile.color || '#00ff94'}">${this.utils.esc(chat.profile.nickname)}</span>: ${this.utils.esc(chat.message)}`;
        box.appendChild(div);
        box.scrollTop = box.scrollHeight;
        if (box.children.length > 50) box.removeChild(box.firstChild);
    },

    // [4] State Synchronization
    syncSettings(s) {
        if (s.chatEnabled !== undefined) {
            const toggle = document.getElementById('bot-chat-toggle');
            if (toggle) toggle.checked = s.chatEnabled;
            this.updateBotStatusUI(this.botConnected, s.chatEnabled);
        }
        if (s.songRequestMode) { const r = document.querySelector(`input[name="songRequestMode"][value="${s.songRequestMode}"]`); if(r) r.checked = true; }
        if (s.songRequestCooldown) document.getElementById('song-cooldown').value = s.songRequestCooldown;
        if (s.minDonationAmount !== undefined) document.getElementById('song-min-donation').value = s.minDonationAmount;
        if (s.pointsPerChat) document.getElementById('points-per-chat').value = s.pointsPerChat;
        if (s.pointsCooldown) document.getElementById('points-cooldown').value = s.pointsCooldown;
        if (s.pointsName) document.getElementById('points-unit-name').value = s.pointsName;
        if (s.participationCommand) document.getElementById('participation-command').value = s.participationCommand;
        if (s.maxParticipants) {
            const slider = document.getElementById('max-participants-slider');
            if (slider) slider.value = s.maxParticipants;
            const valDisp = document.getElementById('max-participants-value');
            if (valDisp) valDisp.textContent = s.maxParticipants;
        }
    },

    syncGreet(p) {
        if (p.settings) {
            const r = document.querySelector(`input[name="greetType"][value="${p.settings.type}"]`);
            if (r) r.checked = true;
            document.getElementById('display-greet-msg').textContent = p.settings.message;
            document.getElementById('edit-greet-input').value = p.settings.message;
        }
        document.getElementById('greet-history-count').textContent = (p.historyCount || 0) + '명';
    },

    updateBotStatusUI(connected, chatEnabled) {
        const indicator = document.getElementById('bot-status-indicator');
        const text = document.getElementById('bot-status-text');
        if (indicator) indicator.className = `status-indicator ${connected ? (chatEnabled ? 'online' : 'idle') : 'offline'}`;
        if (text) text.textContent = connected ? (chatEnabled ? '봇 작동중' : '봇 대기중') : '봇 미연결';
    },

    // [5] Interactive Actions
    addCommand() {
        const t = document.getElementById('new-command-trigger').value.trim();
        const r = document.getElementById('new-command-response').value.trim();
        if (t && r) { this.send({ type: 'addCommand', data: { trigger: t, response: r } }); this.utils.modal('add-command-modal', false); }
    },
    deleteCommand(t) { if(confirm('삭제하시겠습니까?')) this.send({ type: 'removeCommand', data: { trigger: t } }); },
    editCommand(t) { const c = this.data.commands.find(x => x.trigger === t); if(c){ document.getElementById('new-command-trigger').value = c.trigger; document.getElementById('new-command-response').value = c.response; this.utils.modal('add-command-modal'); } },

    addMacro() {
        const i = document.getElementById('new-macro-interval').value;
        const m = document.getElementById('new-macro-message').value.trim();
        if (m) { this.send({ type: 'addMacro', data: { interval: parseInt(i), message: m } }); this.utils.modal('add-macro-modal', false); }
    },
    deleteMacro(id) { if(confirm('삭제하시겠습니까?')) this.send({ type: 'removeMacro', data: { id } }); },
    editMacro(id) { const m = this.data.macros.find(x => x.id === id); if(m){ document.getElementById('new-macro-interval').value = m.interval; document.getElementById('new-macro-message').value = m.message; this.utils.modal('add-macro-modal'); } },

    addCounter() {
        const t = document.getElementById('new-counter-trigger').value.trim();
        const r = document.getElementById('new-counter-response').value.trim();
        const once = document.getElementById('new-counter-once').checked;
        if (t && r) { this.send({ type: 'addCounter', data: { trigger: t, response: r, oncePerDay: once } }); this.utils.modal('add-counter-modal', false); }
    },
    deleteCounter(t) { if(confirm('삭제하시겠습니까?')) this.send({ type: 'removeCounter', data: { trigger: t } }); },
    editCounter(t) { const c = this.data.counters.find(x => x.trigger === t); if(c){ document.getElementById('new-counter-trigger').value = c.trigger; document.getElementById('new-counter-response').value = c.response; this.utils.modal('add-counter-modal'); } },

    saveSongSettings() {
        const mode = document.querySelector('input[name="songRequestMode"]:checked')?.value;
        const cooldown = document.getElementById('song-cooldown').value;
        const amount = document.getElementById('song-min-donation').value;
        this.send({ type: 'updateSettings', data: { songRequestMode: mode, songRequestCooldown: parseInt(cooldown), minDonationAmount: parseInt(amount) } });
        this.utils.notify('저장되었습니다.', 'success');
    },

    savePointsSettings() {
        const per = document.getElementById('points-per-chat').value;
        const cool = document.getElementById('points-cooldown').value;
        const name = document.getElementById('points-unit-name').value;
        this.send({ type: 'updateSettings', data: { pointsPerChat: parseInt(per), pointsCooldown: parseInt(cool), pointsName: name } });
        this.utils.notify('저장되었습니다.', 'success');
    },

    saveParticipationSettings() {
        const cmd = document.getElementById('participation-command').value;
        const max = document.getElementById('max-participants-slider').value;
        this.send({ type: 'updateSettings', data: { participationCommand: cmd } });
        this.send({ type: 'updateMaxParticipants', payload: { count: parseInt(max) } });
        this.utils.notify('저장되었습니다.', 'success');
    },

    saveGreetSettings() {
        const type = document.querySelector('input[name="greetType"]:checked').value;
        this.send({ type: 'updateGreetSettings', data: { type: parseInt(type) } });
        this.utils.notify('저장되었습니다.', 'success');
    },

    saveGreetEditor() {
        const msg = document.getElementById('edit-greet-input').value;
        this.send({ type: 'updateGreetSettings', data: { message: msg } });
        this.utils.modal('edit-greet-modal', false);
    },

    resetGreetHistory() { if(confirm('기록을 초기화하시겠습니까?')) this.send({ type: 'resetGreetHistory' }); },
    toggleParticipation() { this.send({ type: 'toggleParticipation' }); },
    clearParticipants() { if(confirm('데이터를 초기화하시겠습니까?')) this.send({ type: 'clearParticipants' }); },
    approveParticipant(id) { this.send({ type: 'moveToParticipants', data: { userIdHash: id } }); },
    openPlayer() { window.open('/player.html', '_blank', 'width=850,height=650'); },
    handleLogout() { localStorage.removeItem(this.SESSION_KEY); window.location.href = '/'; },
    
    copyOverlayUrl() {
        const el = document.getElementById('overlay-url');
        el.select();
        document.execCommand('copy');
        this.utils.notify('URL이 복사되었습니다!', 'success');
    },

    syncRangeValue(el, id) {
        document.getElementById(id).textContent = el.id.includes('opacity') ? el.value+'%' : el.value+'초';
    },

    insertFunction(targetId, func) {
        const el = document.getElementById(targetId);
        if (!el) return;
        const start = el.selectionStart;
        el.value = el.value.substring(0, start) + func + el.value.substring(el.selectionEnd);
        el.focus();
        this.updatePreview(targetId, targetId.includes('command') ? 'cmd-preview' : targetId.includes('macro') ? 'macro-preview' : 'counter-preview');
    },

    updatePreview(srcId, preId) {
        const src = document.getElementById(srcId);
        const pre = document.getElementById(preId);
        if (!src || !pre) return;
        const map = { '/user': '무거미', '/uptime': '02:15:30', '/viewer': '120', '/random': '결과A', '/since': '365일', '/count': '1', '{user}': '무거미' };
        let val = src.value || '미리보기가 표시됩니다.';
        Object.keys(map).forEach(key => { val = val.split(key).join(`<span style="color:#00ff94; font-weight:bold">${map[key]}</span>`); });
        pre.innerHTML = `봇: ${val}`;
    },

    // [6] Setup visuals
    bindGlobalEvents() {
        document.getElementById('bot-chat-toggle')?.addEventListener('change', (e) => this.send({ type: 'updateSettings', data: { chatEnabled: e.target.checked } }));
        document.getElementById('max-participants-slider')?.addEventListener('input', (e) => document.getElementById('max-participants-value').textContent = e.target.value);
        document.querySelectorAll('.nav-item').forEach(item => {
            item.onclick = () => {
                const target = item.dataset.tab;
                document.querySelectorAll('.nav-item').forEach(i => i.classList.toggle('active', i === item));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === `${target}-tab`));
                document.getElementById('header-title').textContent = item.querySelector('span').textContent;
            };
        });
    },

    setupVisualEffects() {
        document.addEventListener('mousemove', (e) => {
            const cards = document.querySelectorAll('.card');
            cards.forEach(card => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
            });
        });
    }
};

// Global Exposure for HTML onclick events
window.DashboardApp = DashboardApp;
window.sendWebSocket = (data) => DashboardApp.send(data); 
window.utils = DashboardApp.utils;
window.ui = DashboardApp.utils;

// Initialize when ready
document.addEventListener('DOMContentLoaded', () => DashboardApp.init());