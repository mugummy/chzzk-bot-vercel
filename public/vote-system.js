// vote-system.js - Expert Finalized Version

function startDraw() {
    const keyword = document.getElementById('draw-keyword').value;
    const count = document.getElementById('draw-winner-count').value;
    sendWebSocket({ type: 'startDraw', payload: { keyword, settings: { winnerCount: parseInt(count) } } });
}

function stopDrawCollecting() { sendWebSocket({ type: 'stopDrawCollecting' }); }
function executeDraw() { sendWebSocket({ type: 'executeDraw', payload: { count: document.getElementById('draw-winner-count').value } }); }
function resetDraw() { sendWebSocket({ type: 'resetDraw' }); }

function createVote() {
    const question = document.getElementById('vote-question').value;
    const duration = document.getElementById('vote-duration')?.value || 60;
    const options = Array.from(document.querySelectorAll('#vote-options-container input')).map(i => i.value).filter(v => v);
    if (question && options.length >= 2) sendWebSocket({ type: 'createVote', data: { question, options, durationSeconds: parseInt(duration) } });
    else ui.notify('제목과 최소 2개의 항목이 필요합니다.', 'warning');
}

function addVoteOption() {
    const container = document.getElementById('vote-options-container');
    const div = document.createElement('div');
    div.className = 'vote-option-item';
    div.innerHTML = `<input type="text" class="form-input" placeholder="항목 ${container.children.length + 1}"><button class="btn-icon btn-danger" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>`;
    container.appendChild(div);
}

function startVote() { sendWebSocket({ type: 'startVote' }); }
function endVote() { sendWebSocket({ type: 'endVote' }); }
function resetVote() { sendWebSocket({ type: 'resetVote' }); }

function addRouletteItem(txt = '', weight = 1) {
    const container = document.getElementById('roulette-items-container');
    const div = document.createElement('div');
    div.className = 'vote-option-item';
    div.innerHTML = `<input type="text" class="form-input" placeholder="항목 이름" value="${txt}"><input type="number" class="form-input" style="width:70px" value="${weight}"><button class="btn-icon btn-danger" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>`;
    container.appendChild(div);
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
    d.innerHTML = `<h4>${v.question}</h4>` + v.options.map(o => {
        const count = v.results[o.id] || 0;
        const pct = total > 0 ? Math.round((count/total)*100) : 0;
        return `<div class="mb-10"><span>${o.text} (${count}표)</span><div class="progress-bg"><div class="progress-fill" style="width:${pct}%"></div></div></div>`;
    }).join('');
}

function updateRouletteUI(state) {
    const c = document.getElementById('roulette-container');
    const s = document.getElementById('spin-roulette-btn');
    if (state.currentSession) {
        c.innerHTML = `<div class="roulette-info">룰렛 준비됨 (${state.currentSession.items.length}개 항목)</div>`;
        if (s) s.style.display = 'inline-flex';
    } else {
        c.innerHTML = '<div class="empty-state">룰렛을 생성하세요.</div>';
        if (s) s.style.display = 'none';
    }
}

// Global Sync Bridge
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
    const rContainer = document.getElementById('roulette-items-container');
    if (rContainer && rContainer.children.length === 0) { addRouletteItem('항목 1', 1); addRouletteItem('항목 2', 1); }
});

window.startDraw = startDraw;
window.stopDrawCollecting = stopDrawCollecting;
window.executeDraw = executeDraw;
window.resetDraw = resetDraw;
window.createVote = createVote;
window.addVoteOption = addVoteOption;
window.startVote = startVote;
window.endVote = endVote;
window.resetVote = resetVote;
window.addRouletteItem = addRouletteItem;
window.createRoulette = createRoulette;
window.spinRoulette = spinRoulette;
window.resetRoulette = resetRoulette;
