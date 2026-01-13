// vote-system.js - Stable Subtab Controller ( एक्सपर्ट )

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
    const duration = document.getElementById('vote-duration').value;
    const options = Array.from(document.querySelectorAll('#vote-options-container input')).map(i => i.value).filter(v => v);
    if (question && options.length >= 2) sendWebSocket({ type: 'createVote', data: { question, options, durationSeconds: parseInt(duration) } });
}

function addVoteOption() {
    const container = document.getElementById('vote-options-container');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-input mb-10';
    input.placeholder = `항목 ${container.children.length + 1}`;
    container.appendChild(input);
}

function startVote() { sendWebSocket({ type: 'startVote' }); }
function endVote() { sendWebSocket({ type: 'endVote' }); }
function resetVote() { sendWebSocket({ type: 'resetVote' }); }

function addRouletteItem() {
    const container = document.getElementById('roulette-items-container');
    const div = document.createElement('div');
    div.className = 'roulette-item';
    div.style.display = 'flex';
    div.style.gap = '10px';
    div.style.marginBottom = '10px';
    div.innerHTML = `<input type="text" class="form-input" placeholder="항목 이름"><input type="number" class="form-input" style="width:80px" value="1"><button class="btn-icon btn-danger" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>`;
    container.appendChild(div);
}

function createRoulette() {
    const items = Array.from(document.querySelectorAll('.roulette-item')).map(item => ({
        text: item.querySelector('input[type="text"]').value,
        weight: parseInt(item.querySelector('input[type="number"]').value)
    })).filter(i => i.text);
    if (items.length >= 2) sendWebSocket({ type: 'createRoulette', payload: { items } });
}

function spinRoulette() { sendWebSocket({ type: 'spinRoulette' }); }
function resetRoulette() { sendWebSocket({ type: 'resetRoulette' }); }

function updateDrawUI(state) {
    const session = state.currentSession;
    document.getElementById('draw-status').textContent = session ? (session.isCollecting ? '수집 중' : '마감됨') : '대기 중';
    document.getElementById('draw-participant-count').textContent = session?.participants.length || 0;
    
    const startBtn = document.getElementById('start-draw-btn');
    const stopBtn = document.getElementById('stop-draw-btn');
    const execBtn = document.getElementById('execute-draw-btn');
    
    if (startBtn) startBtn.style.display = (!session) ? 'inline-flex' : 'none';
    if (stopBtn) stopBtn.style.display = (session && session.isCollecting) ? 'inline-flex' : 'none';
    if (execBtn) execBtn.style.display = (session && !session.isCollecting) ? 'inline-flex' : 'none';
}

function updateVoteUI(state) {
    const vote = state.currentVote;
    const display = document.getElementById('current-vote-display');
    if (!vote) { display.innerHTML = '<p>진행 중인 투표 없음</p>'; return; }
    display.innerHTML = `<h4 style="color:#00ff94">${vote.question}</h4>` + vote.options.map(o => `<div>${o.text}: ${vote.results[o.id] || 0}표</div>`).join('');
}

function updateRouletteUI(state) {
    const container = document.getElementById('roulette-container');
    const spinBtn = document.getElementById('spin-roulette-btn');
    if (state.currentSession) {
        container.innerHTML = `<div class="roulette-info">룰렛 준비됨 (${state.currentSession.items.length}개 항목)</div>`;
        if (spinBtn) spinBtn.style.display = 'inline-flex';
    } else {
        container.innerHTML = '<div class="empty-state">룰렛을 생성하세요</div>';
        if (spinBtn) spinBtn.style.display = 'none';
    }
}

// Global Message Handler Bridge
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
    document.querySelectorAll('.vote-sub-tab').forEach(btn => {
        btn.onclick = () => window.switchVoteSubTab(btn.dataset.voteSubtab);
    });
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