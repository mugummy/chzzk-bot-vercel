// vote-system.js - Stable Subtab Controller

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

function startVote() { sendWebSocket({ type: 'startVote' }); }
function endVote() { sendWebSocket({ type: 'endVote' }); }
function resetVote() { sendWebSocket({ type: 'resetVote' }); }

function addRouletteItem() {
    const container = document.getElementById('roulette-items-container');
    const div = document.createElement('div');
    div.className = 'roulette-item';
    div.innerHTML = `<input type="text" class="form-input" placeholder="항목 이름"><input type="number" class="form-input weight-input" value="1"><button class="btn-icon btn-danger" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>`;
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
}

function updateVoteUI(state) {
    const vote = state.currentVote;
    const display = document.getElementById('current-vote-display');
    if (!vote) { display.innerHTML = '<p>진행 중인 투표 없음</p>'; return; }
    display.innerHTML = `<h4>${vote.question}</h4>` + vote.options.map(o => `<div>${o.text}: ${vote.results[o.id] || 0}표</div>`).join('');
}

function updateRouletteUI(state) {
    const container = document.getElementById('roulette-container');
    container.innerHTML = state.currentSession ? `<p>룰렛 생성됨: ${state.currentSession.items.length}개 항목</p>` : '<p>룰렛을 생성하세요</p>';
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

window.addRouletteItem = addRouletteItem;
window.createRoulette = createRoulette;
window.spinRoulette = spinRoulette;
window.resetRoulette = resetRoulette;
