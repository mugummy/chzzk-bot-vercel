// vote-system.js - Genuine Chzzk-Vote Logic Replication

function startDraw() {
    const kw = document.getElementById('draw-keyword')?.value || '!참여';
    const ct = document.getElementById('draw-winner-count')?.value || 1;
    sendWebSocket({ type: 'startDraw', payload: { keyword: kw, settings: { winnerCount: parseInt(ct) } } });
}

function stopDrawCollecting() { sendWebSocket({ type: 'stopDrawCollecting' }); }
function executeDraw() { sendWebSocket({ type: 'executeDraw', payload: { count: document.getElementById('draw-winner-count')?.value || 1 } }); }
function resetDraw() { sendWebSocket({ type: 'resetDraw' }); }

/**
 * chzzk-vote 사이트의 투표 생성 핵심 로직
 */
function createVote() {
    const qEl = document.getElementById('vote-question');
    const dEl = document.getElementById('vote-duration');
    const q = qEl ? qEl.value.trim() : '';
    const d = dEl ? parseInt(dEl.value) : 60;
    
    // 비어있지 않은 모든 input 값을 옵션으로 수집
    const opts = Array.from(document.querySelectorAll('#vote-options-container input'))
        .map(i => i.value.trim())
        .filter(v => v !== '');
    
    if (!q) return ui.notify('질문을 입력해주세요.', 'warning');
    if (opts.length < 2) return ui.notify('최소 2개의 선택지가 필요합니다.', 'warning');
    
    // 서버에 생성 및 시작 명령 동시 전송 (사이트 동작 방식)
    sendWebSocket({ 
        type: 'createVote', 
        data: { question: q, options: opts, durationSeconds: d } 
    });
    
    // 약간의 딜레이 후 시작 명령 (서버 동기화 보장)
    setTimeout(() => {
        sendWebSocket({ type: 'startVote' });
        ui.notify('투표가 시작되었습니다!', 'success');
    }, 100);
}

function addVoteOption() {
    const container = document.getElementById('vote-options-container');
    if(!container) return;
    
    const count = container.children.length + 1;
    const div = document.createElement('div');
    div.className = 'vote-option-item';
    div.innerHTML = `
        <div class="option-index">${count}</div>
        <input type="text" class="form-input" placeholder="항목 내용을 입력하세요">
        <button class="btn-icon btn-danger" onclick="window.removeVoteOption(this)">
            <i class="fas fa-times"></i>
        </button>
    `;
    container.appendChild(div);
    // 입력창으로 포커스 이동
    div.querySelector('input').focus();
}

function removeVoteOption(btn) {
    const container = document.getElementById('vote-options-container');
    if (container.children.length <= 2) {
        return ui.notify('최소 2개의 항목은 유지해야 합니다.', 'warning');
    }
    btn.parentElement.remove();
    // 번호 재정렬
    Array.from(container.children).forEach((item, idx) => {
        item.querySelector('.option-index').textContent = idx + 1;
    });
}

function endVote() { sendWebSocket({ type: 'endVote' }); }
function resetVote() { 
    if(confirm('투표를 초기화하고 처음으로 돌아갑니다.')) {
        sendWebSocket({ type: 'resetVote' }); 
        const container = document.getElementById('vote-options-container');
        container.innerHTML = `
            <div class="vote-option-item"><div class="option-index">1</div><input type="text" class="form-input" placeholder="항목 1"></div>
            <div class="vote-option-item"><div class="option-index">2</div><input type="text" class="form-input" placeholder="항목 2"></div>
        `;
        document.getElementById('vote-question').value = '';
    }
}

/**
 * 실시간 결과 렌더링 (chzzk-vote 스타일 고도화)
 */
function updateVoteUI(state) {
    const v = state.currentVote;
    const display = document.getElementById('current-vote-display');
    const controls = document.getElementById('vote-controls');
    const statusBadge = document.getElementById('vote-status-badge');

    if (!display) return;

    if (!v) { 
        display.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon"><i class="fas fa-poll"></i></div>
                <p>현재 진행 중인 투표가 없습니다.</p>
                <small>좌측 폼에서 새 투표를 생성하고 시작하세요.</small>
            </div>`; 
        if(controls) controls.style.display = 'none'; 
        if(statusBadge) { statusBadge.className = 'status-badge offline'; statusBadge.textContent = '대기 중'; }
        return; 
    }

    if(controls) controls.style.display = 'block';
    if(statusBadge) {
        statusBadge.className = v.isActive ? 'status-badge live' : 'status-badge stopped';
        statusBadge.textContent = v.isActive ? '투표 진행 중' : '투표 종료됨';
    }

    const total = Object.values(v.results || {}).reduce((a, b) => a + b, 0);
    
    let html = `<div class="vote-result-view">
        <h2 class="vote-display-q">${v.question}</h2>
        <div class="vote-bars-stack">`;

    v.options.forEach((o, idx) => {
        const count = v.results[o.id] || 0;
        const pct = total > 0 ? Math.round((count/total)*100) : 0;
        
        html += `
            <div class="v-bar-wrapper">
                <div class="v-bar-info">
                    <span class="v-bar-name">${o.text}</span>
                    <span class="v-bar-percent">${pct}% (${count}표)</span>
                </div>
                <div class="v-bar-bg">
                    <div class="v-bar-fill" style="width:${pct}%; background: ${getVoteColor(idx)}"></div>
                </div>
            </div>`;
    });

    html += `</div>
        <div class="vote-meta-info">
            <span class="total-tag">TOTAL</span>
            <span class="total-count">${total.toLocaleString()}명 참여</span>
        </div>
    </div>`;
    
    display.innerHTML = html;
}

function getVoteColor(idx) {
    const colors = ['#00ff94', '#00d4ff', '#9966ff', '#ff6b6b', '#ffd93d'];
    return colors[idx % colors.length];
}

// === 룰렛 시스템 (디자인 통일) ===
function addRouletteItem() {
    const c = document.getElementById('roulette-items-container');
    const div = document.createElement('div');
    div.className = 'vote-option-item';
    div.innerHTML = `
        <input type="text" class="form-input" placeholder="항목 이름">
        <input type="number" class="form-input" style="width:70px" value="1">
        <button class="btn-icon btn-danger" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>`;
    c.appendChild(div);
}

function createRoulette() {
    const items = Array.from(document.querySelectorAll('#roulette-items-container .vote-option-item')).map(el => ({
        text: el.querySelector('input[type="text"]').value,
        weight: parseInt(el.querySelector('input[type="number"]').value)
    })).filter(i => i.text);
    if (items.length >= 2) {
        sendWebSocket({ type: 'createRoulette', payload: { items } });
        ui.notify('룰렛이 준비되었습니다.', 'success');
    }
}

function spinRoulette() { sendWebSocket({ type: 'spinRoulette' }); }
function resetRoulette() { 
    document.getElementById('roulette-items-container').innerHTML = '';
    addRouletteItem(); addRouletteItem();
    sendWebSocket({ type: 'resetRoulette' }); 
}

// WebSocket Message Handler
window.handleVoteSystemMessage = (data) => {
    switch (data.type) {
        case 'drawStateUpdate': updateDrawUI(data.payload); break;
        case 'voteStateUpdate': updateVoteUI(data.payload); break;
        case 'rouletteStateUpdate': 
            const container = document.getElementById('roulette-container');
            const spinBtn = document.getElementById('spin-roulette-btn');
            if (data.payload.currentSession) {
                container.innerHTML = `<div class="roulette-status-msg">룰렛이 활성화되었습니다. (${data.payload.currentSession.items.length}개 항목)</div>`;
                if(spinBtn) spinBtn.style.display = 'block';
            } else {
                container.innerHTML = '<p class="empty-state">룰렛을 먼저 생성하세요.</p>';
                if(spinBtn) spinBtn.style.display = 'none';
            }
            break;
    }
};

window.switchVoteSubTab = (tab) => {
    document.querySelectorAll('.vote-sub-tab').forEach(b => b.classList.toggle('active', b.dataset.voteSubtab === tab));
    document.querySelectorAll('.vote-subtab').forEach(c => c.classList.toggle('active', c.id === `${tab}-subtab`));
};

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.vote-sub-tab').forEach(btn => btn.onclick = () => window.switchVoteSubTab(btn.dataset.voteSubtab));
});

// Export Global
window.startDraw = startDraw;
window.stopDrawCollecting = stopDrawCollecting;
window.executeDraw = executeDraw;
window.resetDraw = resetDraw;
window.createVote = createVote;
window.addVoteOption = addVoteOption;
window.removeVoteOption = removeVoteOption;
window.startVote = startVote;
window.endVote = endVote;
window.resetVote = resetVote;
window.addRouletteItem = addRouletteItem;
window.createRoulette = createRoulette;
window.spinRoulette = spinRoulette;
window.resetRoulette = resetRoulette;
window.copyOverlayUrl = () => {
    const el = document.getElementById('overlay-url');
    el.select(); document.execCommand('copy');
    ui.notify('복사되었습니다!', 'success');
};
window.saveOverlaySettings = () => {
    const os = { backgroundOpacity: parseInt(document.getElementById('overlay-opacity').value), themeColor: document.getElementById('overlay-color').value };
    sendWebSocket({ type: 'updateOverlaySettings', payload: os });
};