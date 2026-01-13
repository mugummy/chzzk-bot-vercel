// ========================================
// Vote System - 시청자 추첨, 숫자 투표, 룰렛 통합 관리
// ========================================

// ========== 상태 변수 ==========
let activeFeature = null;
let voteOptionCount = 2;

// ========== 서브탭 전환 ==========
function switchVoteSubTab(tabName) {
    console.log('[VoteSystem] Switching to subtab:', tabName);
    
    document.querySelectorAll('.vote-sub-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelectorAll('.vote-subtab').forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
    });
    
    const selectedBtn = document.querySelector(`.vote-sub-tab[data-vote-subtab="${tabName}"]`);
    const selectedContent = document.getElementById(`${tabName}-subtab`);
    
    if (selectedBtn) selectedBtn.classList.add('active');
    if (selectedContent) {
        selectedContent.classList.add('active');
        selectedContent.style.display = 'block';
    }
}

// ========== 시청자 추첨 (Draw) 함수들 ==========
function startDraw() {
    const keyword = document.getElementById('draw-keyword')?.value.trim() || '!참여';
    const subscriberOnly = document.getElementById('draw-subscriber-only')?.checked || false;
    const excludePrevious = document.getElementById('draw-exclude-previous')?.checked !== false;
    const winnerCount = parseInt(document.getElementById('draw-winner-count')?.value) || 1;
    
    sendWebSocket({
        type: 'startDraw',
        payload: {
            keyword: keyword,
            settings: {
                subscriberOnly: subscriberOnly,
                excludePreviousWinners: excludePrevious,
                winnerCount: winnerCount
            }
        }
    });
    
    activeFeature = 'draw';
    showNotification('참여 수집을 시작했습니다.', 'success');
}

function stopDrawCollecting() {
    sendWebSocket({ type: 'stopDrawCollecting' });
    showNotification('참여 수집을 마감했습니다.', 'info');
}

function executeDraw() {
    const winnerCount = parseInt(document.getElementById('draw-winner-count')?.value) || 1;
    sendWebSocket({
        type: 'executeDraw',
        payload: { count: winnerCount }
    });
}

function resetDraw() {
    sendWebSocket({ type: 'resetDraw' });
    activeFeature = null;
    const winnerCard = document.getElementById('winner-card');
    if (winnerCard) winnerCard.style.display = 'none';
    showNotification('시청자 추첨이 초기화되었습니다.', 'info');
}

function updateDrawUI(state) {
    if (!state) return;
    const session = state.currentSession;
    const statusBadge = document.getElementById('draw-status');
    const participantCount = document.getElementById('draw-participant-count');
    const participantList = document.getElementById('draw-participants');
    
    const startBtn = document.getElementById('start-draw-btn');
    const stopBtn = document.getElementById('stop-draw-btn');
    const executeBtn = document.getElementById('execute-draw-btn');
    
    if (!session) {
        if (startBtn) startBtn.style.display = 'inline-flex';
        if (stopBtn) stopBtn.style.display = 'none';
        if (executeBtn) executeBtn.style.display = 'none';
        if (statusBadge) statusBadge.textContent = '대기 중';
    } else if (session.isCollecting) {
        if (startBtn) startBtn.style.display = 'none';
        if (stopBtn) stopBtn.style.display = 'inline-flex';
        if (executeBtn) executeBtn.style.display = 'none';
        if (statusBadge) statusBadge.textContent = '참여 수집 중';
    } else {
        if (startBtn) startBtn.style.display = 'none';
        if (stopBtn) stopBtn.style.display = 'none';
        if (executeBtn) executeBtn.style.display = 'inline-flex';
        if (statusBadge) statusBadge.textContent = '수집 마감';
    }
    
    if (participantCount) participantCount.textContent = session?.participants?.length || 0;
    
    if (participantList && session?.participants) {
        participantList.innerHTML = session.participants.map(p => `
            <div class="participant-tag">
                <span>${p.nickname}</span>
            </div>
        `).join('');
    }
}

// ========== 숫자 투표 (Vote) 함수들 ==========
function addVoteOption() {
    const container = document.getElementById('vote-options-container');
    if (!container) return;
    
    voteOptionCount++;
    const optionDiv = document.createElement('div');
    optionDiv.className = 'vote-option-item';
    optionDiv.innerHTML = `
        <span class="vote-option-number">${voteOptionCount}</span>
        <input type="text" class="form-input" placeholder="항목 ${voteOptionCount}">
        <button class="btn btn-danger btn-icon" onclick="removeVoteOption(this)">
            <i class="fas fa-trash"></i>
        </button>
    `;
    container.appendChild(optionDiv);
}

function removeVoteOption(btn) {
    const optionDiv = btn.closest('.vote-option-item');
    if (optionDiv) {
        optionDiv.remove();
        updateVoteOptionNumbers();
    }
}

function updateVoteOptionNumbers() {
    const items = document.querySelectorAll('.vote-option-item');
    items.forEach((item, idx) => {
        item.querySelector('.vote-option-number').textContent = idx + 1;
    });
    voteOptionCount = items.length;
}

function createVote() {
    const question = document.getElementById('vote-question')?.value.trim();
    const duration = parseInt(document.getElementById('vote-duration')?.value) || 60;
    const options = [];
    document.querySelectorAll('#vote-options-container input').forEach(input => {
        if (input.value.trim()) options.push(input.value.trim());
    });
    
    if (!question || options.length < 2) {
        showNotification('제목과 최소 2개의 항목을 입력해주세요.', 'error');
        return;
    }
    
    sendWebSocket({ type: 'createVote', data: { question, options, durationSeconds: duration } });
    showNotification('투표가 생성되었습니다.', 'success');
}

function startVote() { sendWebSocket({ type: 'startVote' }); }
function endVote() { sendWebSocket({ type: 'endVote' }); }
function resetVote() { sendWebSocket({ type: 'resetVote' }); }

function updateVoteUI(state) {
    if (!state) return;
    const vote = state.currentVote;
    const display = document.getElementById('current-vote-display');
    const controls = document.getElementById('vote-controls');
    
    if (!vote) {
        if (display) display.innerHTML = '<div class="empty-state">진행 중인 투표가 없습니다</div>';
        if (controls) controls.style.display = 'none';
        return;
    }
    
    if (controls) controls.style.display = 'block';
    const startBtn = document.getElementById('start-vote-btn');
    const endBtn = document.getElementById('end-vote-btn');
    
    if (vote.isActive) {
        if (startBtn) startBtn.style.display = 'none';
        if (endBtn) endBtn.style.display = 'inline-flex';
    } else {
        if (startBtn) startBtn.style.display = 'inline-flex';
        if (endBtn) endBtn.style.display = 'none';
    }
    
    if (display) {
        const total = Object.values(vote.results || {}).reduce((a, b) => a + b, 0);
        let html = `<h4>${vote.question}</h4><div class="vote-results-list">`;
        vote.options.forEach(opt => {
            const count = vote.results[opt.id] || 0;
            const pct = total > 0 ? Math.round((count/total)*100) : 0;
            html += `<div class="vote-res-item"><span>${opt.text}</span><span>${count}표 (${pct}%)</span></div>`;
        });
        html += `</div><div style="margin-top:10px; font-size:0.9rem; color:#aaa;">총 ${total}명 참여</div>`;
        display.innerHTML = html;
    }
}

// ========== 룰렛 (Roulette) 함수들 ==========
function addRouletteItem() {
    const container = document.getElementById('roulette-items-container');
    if (!container) return;
    
    const count = container.querySelectorAll('.roulette-item').length + 1;
    const itemDiv = document.createElement('div');
    itemDiv.className = 'roulette-item';
    itemDiv.innerHTML = `
        <input type="text" class="form-input" placeholder="항목 ${count}">
        <input type="number" class="form-input weight-input" value="1" min="1">
        <button class="btn-icon btn-danger" onclick="removeRouletteItem(this)">
            <i class="fas fa-trash"></i>
        </button>
    `;
    container.appendChild(itemDiv);
}

function removeRouletteItem(btn) {
    const item = btn.closest('.roulette-item');
    if (item) item.remove();
}

function createRoulette() {
    const items = [];
    document.querySelectorAll('.roulette-item').forEach(el => {
        const text = el.querySelector('input[type="text"]').value.trim();
        const weight = parseInt(el.querySelector('.weight-input').value) || 1;
        if (text) items.push({ text, weight });
    });
    
    if (items.length < 2) {
        showNotification('최소 2개의 항목을 입력해주세요.', 'error');
        return;
    }
    
    sendWebSocket({ type: 'createRoulette', payload: { items } });
    showNotification('룰렛이 생성되었습니다.', 'success');
}

function spinRoulette() { sendWebSocket({ type: 'spinRoulette' }); }
function resetRoulette() { sendWebSocket({ type: 'resetRoulette' }); }

function updateRouletteUI(state) {
    const container = document.getElementById('roulette-container');
    const controls = document.getElementById('roulette-controls');
    if (!container) return;
    
    if (state.currentSession) {
        container.innerHTML = `<div class="roulette-info">룰렛 준비됨 (${state.currentSession.items.length}개 항목)</div>`;
        if (controls) controls.style.display = 'block';
    } else {
        container.innerHTML = '<div class="empty-state">룰렛을 생성하세요</div>';
        if (controls) controls.style.display = 'none';
    }
}

// ========== 공통 WebSocket 핸들러 연결 ==========
function handleVoteSystemMessage(data) {
    switch (data.type) {
        case 'drawStateUpdate': updateDrawUI(data.payload); break;
        case 'voteStateUpdate': updateVoteUI(data.payload); break;
        case 'rouletteStateUpdate': updateRouletteUI(data.payload); break;
    }
}

// 전역 노출
window.switchVoteSubTab = switchVoteSubTab;
window.startDraw = startDraw;
window.stopDrawCollecting = stopDrawCollecting;
window.executeDraw = executeDraw;
window.resetDraw = resetDraw;
window.addVoteOption = addVoteOption;
window.removeVoteOption = removeVoteOption;
window.createVote = createVote;
window.startVote = startVote;
window.endVote = endVote;
window.resetVote = resetVote;
window.addRouletteItem = addRouletteItem;
window.removeRouletteItem = removeRouletteItem;
window.createRoulette = createRoulette;
window.spinRoulette = spinRoulette;
window.resetRoulette = resetRoulette;
window.handleVoteSystemMessage = handleVoteSystemMessage;

document.addEventListener('DOMContentLoaded', () => {
    // 탭 이벤트 연결
    document.querySelectorAll('.vote-sub-tab').forEach(btn => {
        btn.addEventListener('click', () => switchVoteSubTab(btn.dataset.voteSubtab));
    });
});