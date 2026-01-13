// vote-system.js - Stable Integrated Subtab Controller

function startDraw() {
    const kw = document.getElementById('draw-keyword').value;
    const ct = document.getElementById('draw-winner-count').value;
    sendWebSocket({ type: 'startDraw', payload: { keyword: kw, settings: { winnerCount: parseInt(ct) } } });
}

function stopDrawCollecting() { sendWebSocket({ type: 'stopDrawCollecting' }); }
function executeDraw() { sendWebSocket({ type: 'executeDraw', payload: { count: document.getElementById('draw-winner-count').value } }); }
function resetDraw() { sendWebSocket({ type: 'resetDraw' }); }

function createVote() {
    const q = document.getElementById('vote-question').value;
    const d = document.getElementById('vote-duration').value;
    const opts = Array.from(document.querySelectorAll('#vote-options-container input')).map(i => i.value).filter(v => v);
    if (q && opts.length >= 2) sendWebSocket({ type: 'createVote', data: { question: q, options: opts, durationSeconds: parseInt(d) } });
    else ui.notify('제목과 최소 2개의 항목이 필요합니다.', 'warning');
}

function addVoteOption() {
    const c = document.getElementById('vote-options-container');
    const d = document.createElement('div');
    d.className = 'vote-option-item';
    d.innerHTML = `<input type="text" class="form-input" placeholder="항목 ${c.children.length + 1}"><button class="btn-icon btn-danger" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>`;
    c.appendChild(d);
}

function startVote() { sendWebSocket({ type: 'startVote' }); }
function endVote() { sendWebSocket({ type: 'endVote' }); }
function resetVote() { sendWebSocket({ type: 'resetVote' }); }

function addRouletteItem(txt = '', weight = 1) {
    const c = document.getElementById('roulette-items-container');
    const d = document.createElement('div');
    d.className = 'vote-option-item';
    d.innerHTML = `<input type="text" class="form-input" placeholder="항목 이름" value="${txt}"><input type="number" class="form-input" style="width:70px" value="${weight}"><button class="btn-icon btn-danger" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>`;
    c.appendChild(d);
}

function createRoulette() {
    const items = Array.from(document.querySelectorAll('#roulette-items-container .vote-option-item')).map(el => ({
        text: el.querySelector('input[type="text"]').value,
        weight: parseInt(el.querySelector('input[type="number"]').value)
    })).filter(i => i.text);
    if (items.length >= 2) sendWebSocket({ type: 'createRoulette', payload: { items } });
    else ui.notify('최소 2개의 항목이 필요합니다.', 'warning');
}

function spinRoulette() { sendWebSocket({ type: 'spinRoulette' }); }
function resetRoulette() { 
    document.getElementById('roulette-items-container').innerHTML = '';
    addRouletteItem('항목 1', 1); addRouletteItem('항목 2', 1);
    sendWebSocket({ type: 'resetRoulette' }); 
}

function updateDrawUI(state) {
    const s = state.currentSession;
    document.getElementById('draw-status').textContent = s ? (s.isCollecting ? '모집 중' : '마감됨') : '대기 중';
    document.getElementById('draw-participant-count').textContent = s?.participants.length || 0;
    const startBtn = document.getElementById('start-draw-btn');
    const stopBtn = document.getElementById('stop-draw-btn');
    const execBtn = document.getElementById('execute-draw-btn');
    if (startBtn) startBtn.style.display = !s ? 'inline-flex' : 'none';
    if (stopBtn) stopBtn.style.display = (s && s.isCollecting) ? 'inline-flex' : 'none';
    if (execBtn) execBtn.style.display = (s && !s.isCollecting) ? 'inline-flex' : 'none';
}

function updateVoteUI(state) {
    const v = state.currentVote;
    const d = document.getElementById('current-vote-display');
    const c = document.getElementById('vote-controls');
    if (!v) { d.innerHTML = '<p>진행 중인 투표가 없습니다.</p>'; if(c) c.style.display = 'none'; return; }
    if(c) c.style.display = 'block';
    const total = Object.values(v.results || {}).reduce((a, b) => a + b, 0);
    d.innerHTML = `<h4 class="mb-10">${v.question}</h4>` + v.options.map(o => {
        const count = v.results[o.id] || 0;
        const pct = total > 0 ? Math.round((count/total)*100) : 0;
        return `<div class="mb-10"><span>${o.text} (${count}표)</span><div class="progress-bg"><div class="progress-fill" style="width:${pct}%"></div></div></div>`;
    }).join('');
}

function updateRouletteUI(state) {
    const c = document.getElementById('roulette-container');
    const s = document.getElementById('spin-roulette-btn');
    if (state.currentSession) {
        c.innerHTML = `<div class="roulette-ready">룰렛 준비됨 (${state.currentSession.items.length}개 항목)</div>`;
        if (s) s.style.display = 'inline-flex';
    } else {
        c.innerHTML = '<div class="empty-state">룰렛을 생성하세요.</div>';
        if (s) s.style.display = 'none';
    }
}

// Global Bridge
window.handleVoteSystemMessage = (data) => {
    switch (data.type) {
        case 'drawStateUpdate': updateDrawUI(data.payload); break;
        case 'voteStateUpdate': updateVoteUI(data.payload); break;
        case 'rouletteStateUpdate': updateRouletteUI(data.payload); break;
    }
};

window.switchVoteSubTab = (tab) => {
    document.querySelectorAll('.vote-sub-tab').forEach(b => b.classList.toggle('active', b.dataset.voteSubtab === tab));
    document.querySelectorAll('.vote-subtab').forEach(c => c.classList.toggle('active', c.id === `${tab}-subtab`));
};

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.vote-sub-tab').forEach(btn => btn.onclick = () => window.switchVoteSubTab(btn.dataset.voteSubtab));
    // Roulette Initial Items
    const rContainer = document.getElementById('roulette-items-container');
    if (rContainer && rContainer.children.length === 0) { addRouletteItem('항목 1', 1); addRouletteItem('항목 2', 1); }
});

window.startDraw = startDraw;
window.stopDrawCollecting = stopDrawCollecting;
window.executeDraw = executeDraw;
window.resetDraw = resetDraw;
window.addVoteOption = addVoteOption;
window.createVote = createVote;
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
    ui.notify('URL 복사 완료!', 'success');
};
window.saveOverlaySettings = () => {
    const os = { backgroundOpacity: parseInt(document.getElementById('overlay-opacity').value), themeColor: document.getElementById('overlay-color').value };
    sendWebSocket({ type: 'updateOverlaySettings', payload: os });
};
