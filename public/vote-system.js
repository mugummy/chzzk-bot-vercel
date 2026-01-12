// ========================================
// Vote System - 시청자 추첨, 숫자 투표, 룰렛 통합 관리
// ========================================

// ========== 상태 변수 ==========
let activeFeature = null;
let voteOptionCount = 2;
let rouletteItemCount = 0;

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
    
    if (tabName === 'settings') {
        const settingsContent = document.getElementById('settings-subtab');
        if (settingsContent) {
            settingsContent.classList.add('active');
            settingsContent.style.display = 'block';
        }
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
    
    setActiveFeature('draw');
    showNotification('참여 수집을 시작했습니다.', 'success');
    
    const keywordDisplay = document.getElementById('draw-keyword-display');
    if (keywordDisplay) keywordDisplay.textContent = keyword;
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
    sendWebSocket({ type: 'hideOverlay' });
    setActiveFeature(null);

    const winnerCard = document.getElementById('winner-card');
    if (winnerCard) winnerCard.style.display = 'none';

    showNotification('시청자 추첨이 초기화되었습니다.', 'info');
}

function clearPreviousWinners() {
    if (confirm('이전 당첨자 목록을 모두 초기화하시겠습니까?')) {
        sendWebSocket({ type: 'clearPreviousWinners' });
        showNotification('이전 당첨자 목록이 초기화되었습니다.', 'success');
    }
}

function removeDrawParticipant(userIdHash) {
    sendWebSocket({
        type: 'removeDrawParticipant',
        payload: { userIdHash: userIdHash }
    });
}

function updateDrawUI(state) {
    if (!state) return;

    const session = state.currentSession;
    const statusBadge = document.getElementById('draw-status');
    const participantCount = document.getElementById('draw-participant-count');
    const participantList = document.getElementById('draw-participants');
    const winnerCard = document.getElementById('winner-card');
    const winnerList = document.getElementById('winner-list');
    
    const startBtn = document.getElementById('start-draw-btn');
    const stopBtn = document.getElementById('stop-draw-btn');
    const executeBtn = document.getElementById('execute-draw-btn');
    const resetBtn = document.getElementById('reset-draw-btn');
    
    if (!session) {
        if (startBtn) { startBtn.disabled = false; startBtn.style.display = 'inline-flex'; }
        if (stopBtn) { stopBtn.disabled = true; stopBtn.style.display = 'none'; }
        if (executeBtn) { executeBtn.disabled = true; executeBtn.style.display = 'none'; }
        if (resetBtn) { resetBtn.disabled = true; }
        if (statusBadge) {
            statusBadge.textContent = '대기 중';
            statusBadge.className = 'status-badge waiting';
        }
    } else if (session.isCollecting) {
        if (startBtn) { startBtn.disabled = true; startBtn.style.display = 'none'; }
        if (stopBtn) { stopBtn.disabled = false; stopBtn.style.display = 'inline-flex'; }
        if (executeBtn) { executeBtn.disabled = true; executeBtn.style.display = 'none'; }
        if (resetBtn) { resetBtn.disabled = false; }
        if (statusBadge) {
            statusBadge.textContent = '참여 수집 중';
            statusBadge.className = 'status-badge collecting';
        }
    } else if (session.isActive) {
        if (startBtn) { startBtn.disabled = true; startBtn.style.display = 'none'; }
        if (stopBtn) { stopBtn.disabled = true; stopBtn.style.display = 'none'; }
        if (executeBtn) { executeBtn.disabled = false; executeBtn.style.display = 'inline-flex'; }
        if (resetBtn) { resetBtn.disabled = false; }
        if (statusBadge) {
            statusBadge.textContent = '수집 마감';
            statusBadge.className = 'status-badge stopped';
        }
    } else {
        if (startBtn) { startBtn.disabled = true; startBtn.style.display = 'inline-flex'; }
        if (stopBtn) { stopBtn.disabled = true; stopBtn.style.display = 'none'; }
        if (executeBtn) { executeBtn.disabled = true; executeBtn.style.display = 'none'; }
        if (resetBtn) { resetBtn.disabled = false; }
        if (statusBadge) {
            statusBadge.textContent = '추첨 완료';
            statusBadge.className = 'status-badge completed';
        }
    }
    
    if (participantCount) {
        const count = session?.participants?.length || 0;
        participantCount.textContent = count;
    }
    
    if (participantList) {
        if (!session || !session.participants || session.participants.length === 0) {
            participantList.innerHTML = '<div class="empty-state"><i class="fas fa-user-plus"></i><p>참여 시작 후 시청자가 표시됩니다</p></div>';
        } else {
            participantList.innerHTML = session.participants.map(p => `
                <div class="participant-tag" data-user-id="${p.userIdHash}">
                    <span class="participant-name">${p.nickname}</span>
                    <button class="participant-remove" onclick="removeDrawParticipant('${p.userIdHash}')" title="제거">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('');
        }
    }
    
    if (session?.winners && session.winners.length > 0) {
        if (winnerCard) winnerCard.style.display = 'block';
        if (winnerList) {
            winnerList.innerHTML = session.winners.map(w => 
                `<span class="winner-name-tag">🎉 ${w.nickname}</span>`
            ).join('');
        }
    }
}

// 시청자 추첨 슬롯머신 애니메이션
function showDrawWinners(winners, animationDuration, allParticipants) {
    const winnerCard = document.getElementById('winner-card');
    const winnerList = document.getElementById('winner-list');

    if (!winners || winners.length === 0) return;

    // 서버에서 받은 애니메이션 시간 사용 (동기화)
    const duration = animationDuration || 4000;

    // 실제 참가자 목록 사용 (없으면 당첨자만 사용)
    const winnerNames = winners.map(w => w.nickname);
    const candidates = allParticipants && allParticipants.length >= 3
        ? allParticipants
        : [...winnerNames, ...winnerNames, ...winnerNames];

    // 슬롯머신 모달 생성
    showSlotMachineAnimation(candidates, duration, () => {
        if (winnerCard && winnerList) {
            winnerList.innerHTML = winners.map(w =>
                `<span class="winner-name-tag">🎉 ${w.nickname}</span>`
            ).join('');
            winnerCard.style.display = 'block';
        }
    });
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
    const container = document.getElementById('vote-options-container');
    
    if (optionDiv && container && container.querySelectorAll('.vote-option-item').length > 2) {
        optionDiv.remove();
        updateVoteOptionNumbers();
    } else {
        showNotification('최소 2개의 선택지가 필요합니다.', 'error');
    }
}

function updateVoteOptionNumbers() {
    document.querySelectorAll('.vote-option-item').forEach((item, idx) => {
        const numSpan = item.querySelector('.vote-option-number');
        if (numSpan) numSpan.textContent = idx + 1;
    });
    voteOptionCount = document.querySelectorAll('.vote-option-item').length;
}

function createVote() {
    const question = document.getElementById('vote-question')?.value.trim();
    const durationSeconds = parseInt(document.getElementById('vote-duration')?.value) || 60;
    
    // 문자열 배열로 전송 (서버가 기대하는 형식)
    const options = [];
    document.querySelectorAll('#vote-options-container .vote-option-item input').forEach((input) => {
        const text = input.value.trim();
        if (text) {
            options.push(text);
        }
    });
    
    if (!question) {
        showNotification('투표 질문을 입력해주세요.', 'error');
        return;
    }
    
    if (options.length < 2) {
        showNotification('최소 2개의 선택지가 필요합니다.', 'error');
        return;
    }
    
    sendWebSocket({
        type: 'createVote',
        data: { question, options, durationSeconds }
    });
    
    setActiveFeature('vote');
    showNotification('투표가 생성되었습니다.', 'success');
}

function startVote() {
    sendWebSocket({ type: 'startVote' });
    showNotification('투표가 시작되었습니다.', 'success');
}

function endVote() {
    sendWebSocket({ type: 'endVote' });
    showNotification('투표가 종료되었습니다.', 'info');
}

function resetVote() {
    sendWebSocket({ type: 'resetVote' });
    sendWebSocket({ type: 'hideOverlay' });
    setActiveFeature(null);
    
    const question = document.getElementById('vote-question');
    if (question) question.value = '';
    
    const container = document.getElementById('vote-options-container');
    if (container) {
        container.innerHTML = `
            <div class="vote-option-item">
                <span class="vote-option-number">1</span>
                <input type="text" class="form-input" placeholder="항목 1">
                <button class="btn btn-danger btn-icon" onclick="removeVoteOption(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="vote-option-item">
                <span class="vote-option-number">2</span>
                <input type="text" class="form-input" placeholder="항목 2">
                <button class="btn btn-danger btn-icon" onclick="removeVoteOption(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        voteOptionCount = 2;
    }
    
    showNotification('투표가 초기화되었습니다.', 'info');
}

function updateVoteUI(state) {
    if (!state) return;

    const vote = state.currentVote;
    const voteDisplay = document.getElementById('current-vote-display');
    const voteControls = document.getElementById('vote-controls');

    // 투표 기록 업데이트
    renderVoteHistory(state.votesHistory);

    if (!vote) {
        // 현재 투표 없음
        if (voteDisplay) {
            voteDisplay.innerHTML = '<div class="empty-state"><i class="fas fa-poll"></i><p>진행 중인 투표가 없습니다</p></div>';
        }
        if (voteControls) voteControls.style.display = 'none';
        window.currentVote = null;
        return;
    }

    window.currentVote = vote;

    const totalVotes = Object.values(vote.results || {}).reduce((sum, count) => sum + count, 0);

    // 현재 투표 내용 표시
    if (voteDisplay) {
        let html = `
            <div class="vote-current-info">
                <h4 class="vote-question-display">${vote.question || '제목 없음'}</h4>
                <div class="vote-options-results">
        `;

        if (vote.options) {
            vote.options.forEach((opt, idx) => {
                const optText = typeof opt === 'object' ? opt.text : opt;
                const optId = typeof opt === 'object' ? opt.id : String(idx + 1);
                const count = vote.results[optId] || 0;
                const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                html += `
                    <div class="vote-result-item">
                        <div class="vote-result-header">
                            <span class="vote-option-badge">${idx + 1}</span>
                            <span class="vote-option-text">${optText}</span>
                            <span class="vote-count">${count}표 (${percentage}%)</span>
                        </div>
                        <div class="vote-progress-bar">
                            <div class="vote-progress-fill" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                `;
            });
        }

        html += `
                </div>
                <div class="vote-total-count">총 ${totalVotes}명 참여</div>
            </div>
        `;
        voteDisplay.innerHTML = html;
    }

    // 버튼 표시 제어
    const startBtn = document.getElementById('start-vote-btn');
    const endBtn = document.getElementById('end-vote-btn');
    const votersBtn = document.getElementById('show-voters-btn');
    const drawBtn = document.getElementById('draw-vote-btn');

    const isPending = !vote.isActive && !vote.startTime;
    const isActive = vote.isActive;
    const isEnded = !vote.isActive && vote.startTime;

    // 투표가 있으면 컨트롤 표시
    if (voteControls) voteControls.style.display = 'flex';

    // 투표자 보기 버튼은 투표 데이터가 있을 때만 표시
    const hasVoters = vote.voters && vote.voters.length > 0;
    if (votersBtn) votersBtn.style.display = hasVoters ? 'inline-flex' : 'none';

    // 추첨 버튼은 종료된 투표에서만 표시
    if (drawBtn) drawBtn.style.display = isEnded && hasVoters ? 'inline-flex' : 'none';

    if (isPending) {
        if (startBtn) startBtn.style.display = 'inline-flex';
        if (endBtn) endBtn.style.display = 'none';
    } else if (isActive) {
        if (startBtn) startBtn.style.display = 'none';
        if (endBtn) endBtn.style.display = 'inline-flex';
    } else if (isEnded) {
        if (startBtn) startBtn.style.display = 'none';
        if (endBtn) endBtn.style.display = 'none';
    }
}

// 투표 기록 렌더링
function renderVoteHistory(votes) {
    const container = document.getElementById('vote-history');
    if (!container) return;

    if (!votes || votes.length === 0) {
        container.innerHTML = '<div class="empty-state">기록이 없습니다</div>';
        return;
    }

    // 유효한 투표만 필터링 (endTime이 있는 것만)
    const validVotes = votes.filter(v => v && v.endTime && v.question);

    if (validVotes.length === 0) {
        container.innerHTML = '<div class="empty-state">기록이 없습니다</div>';
        return;
    }

    // 최신순 정렬
    const sortedVotes = [...validVotes].sort((a, b) => (b.endTime || 0) - (a.endTime || 0));

    container.innerHTML = sortedVotes.map(vote => {
        const totalVotes = Object.values(vote.results || {}).reduce((sum, count) => sum + count, 0);
        // endTime 유효성 검사
        let dateStr = '날짜 없음';
        if (vote.endTime && typeof vote.endTime === 'number' && vote.endTime > 0) {
            const dateObj = new Date(vote.endTime);
            if (!isNaN(dateObj.getTime())) {
                dateStr = dateObj.toLocaleString('ko-KR');
            }
        }

        return `
            <div class="vote-history-item card">
                <div class="vote-history-header">
                    <span class="vote-date">${dateStr}</span>
                    <button class="btn-icon btn-danger btn-sm" onclick="deleteVoteRecord('${vote.id}')" title="삭제">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <h4 class="vote-question">${vote.question || '제목 없음'}</h4>
                <div class="vote-stats">
                    <span><i class="fas fa-user"></i> 총 ${totalVotes}명 참여</span>
                </div>
                <div class="vote-history-actions">
                    <button class="btn btn-sm btn-info" onclick="showVotersModalFor('${vote.id}')">
                        <i class="fas fa-users"></i> 투표자
                    </button>
                    <button class="btn btn-sm btn-success" onclick="drawFromVoteId('${vote.id}')">
                        <i class="fas fa-trophy"></i> 추첨
                    </button>
                    <button class="btn btn-sm btn-purple" onclick="importVoteToRouletteFromId('${vote.id}')">
                        <i class="fas fa-dharmachakra"></i> 룰렛으로
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function deleteVoteRecord(voteId) {
    if (confirm('이 투표 기록을 삭제하시겠습니까?')) {
        sendWebSocket({
            type: 'deleteVoteRecord',
            payload: { voteId }
        });
    }
}

function drawFromVoteId(voteId) {
    const count = prompt('추첨할 인원 수를 입력하세요:', '1');
    if (!count) return;
    
    const numCount = parseInt(count);
    if (isNaN(numCount) || numCount < 1) {
        showNotification('올바른 인원 수를 입력하세요.', 'error');
        return;
    }
    
    sendWebSocket({
        type: 'drawVote',
        payload: {
            type: 'all',
            count: numCount,
            voteId: voteId
        }
    });
}

function showVotersModalFor(voteId) {
    sendWebSocket({
        type: 'getVoteDetails',
        voteId: voteId
    });
}

function importVoteToRouletteFromId(voteId) {
    sendWebSocket({
        type: 'importVoteToRoulette',
        payload: { voteId: voteId }
    });
    switchVoteSubTab('roulette');
    showNotification('투표 결과를 룰렛으로 가져왔습니다.', 'success');
}

// 투표 추첨 함수
function drawFromVote() {
    if (!window.currentVote) {
        showNotification('추첨할 투표가 없습니다.', 'error');
        return;
    }
    
    const count = prompt('추첨할 인원 수를 입력하세요:', '1');
    if (!count) return;
    
    const numCount = parseInt(count);
    if (isNaN(numCount) || numCount < 1) {
        showNotification('올바른 인원 수를 입력하세요.', 'error');
        return;
    }
    
    sendWebSocket({
        type: 'drawVote',
        payload: {
            type: 'all',
            count: numCount,
            voteId: window.currentVote.id
        }
    });
}

// 투표자 보기 모달
function showVotersModal() {
    if (!window.currentVote) {
        showNotification('투표 정보가 없습니다.', 'error');
        return;
    }
    
    sendWebSocket({
        type: 'getVoteDetails',
        voteId: window.currentVote.id
    });
}

function displayVotersModal(vote, voterNames) {
    const existingModal = document.getElementById('voters-modal');
    if (existingModal) existingModal.remove();
    
    const votersByOption = {};
    if (vote.voterChoices && Array.isArray(vote.voterChoices)) {
        vote.voterChoices.forEach(vc => {
            if (!votersByOption[vc.optionId]) {
                votersByOption[vc.optionId] = [];
            }
            const nickname = vc.nickname || voterNames.find(v => v.userIdHash === vc.userIdHash)?.nickname || '알 수 없음';
            votersByOption[vc.optionId].push(nickname);
        });
    }
    
    const modal = document.createElement('div');
    modal.id = 'voters-modal';
    modal.className = 'voters-modal-overlay';
    modal.innerHTML = `
        <div class="voters-modal">
            <div class="voters-modal-header">
                <h3><i class="fas fa-users"></i> 투표자 목록</h3>
                <div class="header-actions">
                    <button class="btn btn-sm btn-secondary" id="toggle-names-btn" onclick="toggleVoterNames()">
                        <i class="fas fa-eye-slash"></i> 닉네임 보기
                    </button>
                    <button class="modal-close-btn" onclick="closeVotersModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="voters-modal-body" id="voters-list-body">
                ${generateVotersListHtml(vote, votersByOption, false)}
            </div>
        </div>
    `;
    
    // 데이터 저장을 위해 전역 변수나 요소 속성에 저장
    modal.dataset.voteData = JSON.stringify({ vote, votersByOption });
    modal.dataset.showNames = 'false';
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
    
    // 토글 함수 전역 등록 (필요시)
    window.toggleVoterNames = function() {
        const modal = document.getElementById('voters-modal');
        if (!modal) return;
        
        const showNames = modal.dataset.showNames === 'true';
        const newShowNames = !showNames;
        modal.dataset.showNames = newShowNames;
        
        const btn = document.getElementById('toggle-names-btn');
        if (btn) {
            btn.innerHTML = newShowNames ? '<i class="fas fa-eye"></i> 닉네임 숨기기' : '<i class="fas fa-eye-slash"></i> 닉네임 보기';
        }
        
        const data = JSON.parse(modal.dataset.voteData);
        document.getElementById('voters-list-body').innerHTML = generateVotersListHtml(data.vote, data.votersByOption, newShowNames);
    };
}

function generateVotersListHtml(vote, votersByOption, showNames) {
    return vote.options.map(opt => {
        const optText = typeof opt === 'object' ? opt.text : opt;
        const optId = typeof opt === 'object' ? opt.id : opt;
        const voters = votersByOption[optId] || [];
        return `
            <div class="voter-option-group">
                <h4>${optText} (${voters.length}명)</h4>
                <div class="voter-list">
                    ${voters.length > 0 
                        ? voters.map(n => `<span class="voter-tag">${showNames ? n : '익명'}</span>`).join('')
                        : '<span class="no-voters">투표자 없음</span>'
                    }
                </div>
            </div>
        `;
    }).join('');
}

function closeVotersModal() {
    const modal = document.getElementById('voters-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

// ========== 룰렛 (Roulette) 함수들 ==========
function addRouletteItem() {
    const container = document.getElementById('roulette-items-container');
    if (!container) return;
    
    // 현재 항목 수 기반으로 번호 계산
    const currentItems = container.querySelectorAll('.roulette-item').length;
    const newNumber = currentItems + 1;
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'roulette-item';
    itemDiv.innerHTML = `
        <input type="text" class="form-input" placeholder="항목 ${newNumber}">
        <input type="number" class="form-input weight-input" value="1" min="1" placeholder="가중치" title="가중치">
        <button class="btn btn-danger btn-icon" onclick="removeRouletteItem(this)">
            <i class="fas fa-trash"></i>
        </button>
    `;
    container.appendChild(itemDiv);
    
    // 스크롤 최하단으로
    container.scrollTop = container.scrollHeight;
}

function removeRouletteItem(btn) {
    const itemDiv = btn.closest('.roulette-item');
    const container = document.getElementById('roulette-items-container');
    
    if (itemDiv && container && container.querySelectorAll('.roulette-item').length > 1) {
        itemDiv.remove();
        updateRouletteItemNumbers();
    } else {
        showNotification('최소 1개의 항목이 필요합니다.', 'error');
    }
}

function updateRouletteItemNumbers() {
    const container = document.getElementById('roulette-items-container');
    if (!container) return;
    
    container.querySelectorAll('.roulette-item').forEach((item, idx) => {
        const textInput = item.querySelector('input[type="text"]');
        if (textInput && !textInput.value) {
            textInput.placeholder = `항목 ${idx + 1}`;
        }
    });
}

function createRoulette() {
    const container = document.getElementById('roulette-items-container');
    if (!container) return;
    
    const items = [];
    container.querySelectorAll('.roulette-item').forEach((itemDiv) => {
        const textInput = itemDiv.querySelector('input[type="text"]');
        const weightInput = itemDiv.querySelector('.weight-input');
        const text = textInput?.value.trim();
        const weight = parseInt(weightInput?.value) || 1;
        
        if (text) {
            items.push({ text, weight });
        }
    });
    
    if (items.length < 2) {
        showNotification('최소 2개의 항목이 필요합니다.', 'error');
        return;
    }
    
    sendWebSocket({
        type: 'createRoulette',
        payload: { items }
    });
    
    setActiveFeature('roulette');
    showNotification('룰렛이 생성되었습니다.', 'success');
}

function spinRoulette() {
    sendWebSocket({ type: 'spinRoulette' });
}

function resetRoulette() {
    sendWebSocket({ type: 'resetRoulette' });
    sendWebSocket({ type: 'hideOverlay' });
    setActiveFeature(null);

    const rouletteContainer = document.getElementById('roulette-container');
    if (rouletteContainer) {
        rouletteContainer.innerHTML = '<div class="empty-state"><i class="fas fa-dharmachakra"></i><p>룰렛을 생성하세요</p></div>';
    }

    const controls = document.getElementById('roulette-controls');
    if (controls) controls.style.display = 'none';

    const result = document.getElementById('roulette-result');
    if (result) result.style.display = 'none';

    const itemsContainer = document.getElementById('roulette-items-container');
    if (itemsContainer) {
        itemsContainer.innerHTML = `
            <div class="roulette-item">
                <input type="text" class="form-input" placeholder="항목 이름">
                <input type="number" class="form-input weight-input" value="1" min="1" placeholder="가중치">
                <button class="btn-icon btn-danger" onclick="removeRouletteItem(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }

    showNotification('룰렛이 초기화되었습니다.', 'info');
}

function importVoteToRoulette() {
    if (!window.currentVote) {
        showNotification('가져올 투표 결과가 없습니다.', 'error');
        return;
    }
    
    sendWebSocket({
        type: 'importVoteToRoulette',
        payload: { voteId: window.currentVote.id }
    });
    
    switchVoteSubTab('roulette');
    showNotification('투표 결과를 룰렛으로 가져왔습니다.', 'success');
}

function updateRouletteUI(state) {
    if (!state) return;

    const session = state.currentSession;
    const container = document.getElementById('roulette-container');
    const controls = document.getElementById('roulette-controls');
    const resultDisplay = document.getElementById('roulette-result');

    if (session && session.items && session.items.length > 0) {
        renderRouletteWheel(session.items);
        if (controls) controls.style.display = 'block';
    } else {
        if (container) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-dharmachakra"></i><p>룰렛을 생성하세요</p></div>';
        }
        if (controls) controls.style.display = 'none';
        if (resultDisplay) resultDisplay.style.display = 'none';
    }
}

function renderRouletteWheel(items) {
    const container = document.getElementById('roulette-container');
    if (!container || !items || items.length === 0) return;
    
    const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1), 0);
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1'];
    
    let svgContent = '';
    let currentAngle = 0;
    const cx = 150, cy = 150, r = 140;
    
    items.forEach((item, index) => {
        const sliceAngle = ((item.weight || 1) / totalWeight) * 360;
        const color = item.color || colors[index % colors.length];
        
        if (items.length === 1) {
            // 항목이 1개일 때는 전체 원 그리기
            svgContent += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" stroke="#fff" stroke-width="2"/>`;
        } else {
            const startAngle = currentAngle;
            const endAngle = currentAngle + sliceAngle;
            
            const startRad = (startAngle - 90) * Math.PI / 180;
            const endRad = (endAngle - 90) * Math.PI / 180;
            
            const x1 = cx + r * Math.cos(startRad);
            const y1 = cy + r * Math.sin(startRad);
            const x2 = cx + r * Math.cos(endRad);
            const y2 = cy + r * Math.sin(endRad);
            
            const largeArcFlag = sliceAngle > 180 ? 1 : 0;
            
            svgContent += `<path d="M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z" fill="${color}" stroke="#fff" stroke-width="2"/>`;
        }
        
        // 텍스트 위치 계산 (항목이 1개일 때는 중앙 정렬)
        const midAngle = items.length === 1 ? 0 : ((currentAngle + currentAngle + sliceAngle) / 2 - 90) * Math.PI / 180;
        // 항목 1개일 때 텍스트 위치 조정 (중앙)
        const textR = items.length === 1 ? 0 : r * 0.6;
        
        const textX = cx + textR * Math.cos(midAngle);
        const textY = cy + textR * Math.sin(midAngle);
        const displayText = item.text.length > 6 ? item.text.substring(0, 6) + '..' : item.text;
        
        svgContent += `<text x="${textX}" y="${textY}" text-anchor="middle" dominant-baseline="middle" fill="#fff" font-size="14" font-weight="bold">${displayText}</text>`;

        currentAngle += sliceAngle;
    });

    container.innerHTML = `
        <div class="roulette-wheel-wrapper">
            <div class="roulette-pointer">▼</div>
            <div class="roulette-wheel" id="roulette-wheel">
                <svg viewBox="0 0 300 300">${svgContent}</svg>
            </div>
        </div>
    `;
}

// 룰렛 애니메이션 (서버에서 받은 시간으로 동기화)
function spinRouletteAnimation(spinDegree, result, serverDuration) {
    const wheel = document.getElementById('roulette-wheel');
    const resultDisplay = document.getElementById('roulette-result');
    const resultValue = document.getElementById('roulette-result-value');

    // 서버에서 받은 애니메이션 시간 사용 (동기화)
    const spinDuration = serverDuration ? serverDuration / 1000 : 5;

    if (wheel) {
        // 기존 트랜지션 초기화
        wheel.style.transition = 'none';
        wheel.style.transform = 'rotate(0deg)';

        // 강제 리플로우
        wheel.offsetHeight;

        // 새 애니메이션 시작 (감속 효과: cubic-bezier)
        wheel.style.transition = `transform ${spinDuration}s cubic-bezier(0.15, 0.85, 0.35, 1.0)`;
        wheel.style.transform = `rotate(${spinDegree}deg)`;
    }

    // 결과 표시 초기화
    if (resultDisplay) {
        resultDisplay.style.display = 'none';
        resultDisplay.classList.remove('result-appear');
    }

    // 회전 종료 후 결과 표시 (서버 시간 + 약간의 여유)
    setTimeout(() => {
        if (resultDisplay && resultValue && result) {
            resultValue.textContent = result.text;
            resultDisplay.style.display = 'block';

            // 화려한 등장 효과
            requestAnimationFrame(() => {
                resultDisplay.classList.add('result-appear');
            });

            // 당첨자 모달도 표시
            showWinnerModal([result.text], '🎰 룰렛 결과');
        }
    }, (spinDuration * 1000) + 100);
}

// ========== 공통 당첨자 모달 ==========
function showWinnerModal(winners, title = '🎉 당첨자 발표!') {
    const existingModal = document.getElementById('winner-modal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'winner-modal';
    modal.className = 'winner-modal-overlay';
    modal.innerHTML = `
        <div class="winner-modal">
            <div class="winner-modal-header">
                <h2>${title}</h2>
            </div>
            <div class="winner-modal-body">
                <div class="winner-names">
                    ${winners.map((name, idx) => `<span class="winner-badge" style="animation-delay: ${idx * 0.1}s">🏆 ${name}</span>`).join('')}
                </div>
            </div>
            <div class="winner-modal-footer">
                <button class="btn btn-primary" onclick="closeWinnerModal()">확인</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
}

function closeWinnerModal() {
    const modal = document.getElementById('winner-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

// ========== 슬롯머신 애니메이션 ==========
// candidates: 후보자 목록, durationOrCallback: 애니메이션 시간(ms) 또는 콜백, onComplete: 콜백
function showSlotMachineAnimation(candidates, durationOrCallback, onComplete) {
    // 인자 처리 (기존 호환성 유지)
    let duration, callback;
    if (typeof durationOrCallback === 'function') {
        duration = 3000 + Math.random() * 2000;
        callback = durationOrCallback;
    } else {
        duration = durationOrCallback || (3000 + Math.random() * 2000);
        callback = onComplete;
    }

    if (!candidates || candidates.length === 0) {
        if (callback) callback();
        return;
    }

    const existingModal = document.getElementById('slot-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'slot-modal';
    modal.className = 'slot-modal-overlay';
    modal.innerHTML = `
        <div class="slot-modal">
            <div class="slot-header">
                <h2>🎰 추첨 중...</h2>
            </div>
            <div class="slot-container">
                <div class="slot-window">
                    <div class="slot-reel" id="slot-reel">
                        ${candidates.map(c => `<div class="slot-item">${c}</div>`).join('')}
                    </div>
                </div>
            </div>
            <div class="slot-footer">
                <div class="slot-status">추첨이 진행 중입니다...</div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);

    const reel = document.getElementById('slot-reel');
    const itemHeight = 80;
    const totalItems = candidates.length;

    // 릴 복제하여 무한 스크롤 효과
    for (let i = 0; i < 3; i++) {
        candidates.forEach(c => {
            const item = document.createElement('div');
            item.className = 'slot-item';
            item.textContent = c;
            reel.appendChild(item);
        });
    }

    // 마지막 당첨자는 첫 번째 후보 (실제 당첨자는 이미 결정됨)
    const winnerIdx = 0;
    const winner = candidates[winnerIdx];

    const targetPosition = (totalItems * 2 + winnerIdx) * itemHeight;

    let startTime = null;
    let currentPosition = 0;

    function animate(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // 이징 함수 (easeOutCubic)
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        currentPosition = targetPosition * easeProgress;

        reel.style.transform = `translateY(-${currentPosition}px)`;

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // 완료
            setTimeout(() => {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.remove();
                    showWinnerModal([winner]);
                    if (callback) callback();
                }, 300);
            }, 500);
        }
    }

    setTimeout(() => requestAnimationFrame(animate), 500);
}

// ========== 투표 추첨 당첨자 표시 ==========
function showVoteDrawWinners(winners, message, animationDuration, allParticipants) {
    if (!winners || winners.length === 0) return;

    const winnerNames = winners.map(w => w.nickname);

    // 실제 참가자 목록 사용 (없으면 당첨자만 사용)
    let candidates = allParticipants && allParticipants.length >= 3
        ? [...allParticipants]
        : [...winnerNames, ...winnerNames, ...winnerNames];

    // 당첨자를 맨 앞에 배치 (슬롯머신이 첫 번째를 당첨자로 표시함)
    const firstWinner = winnerNames[0];
    const idx = candidates.indexOf(firstWinner);
    if (idx > 0) {
        candidates.splice(idx, 1);
    }
    if (idx !== 0) {
        candidates.unshift(firstWinner);
    }

    // 서버에서 받은 애니메이션 시간 사용 (오버레이와 동기화)
    const duration = animationDuration || 4000;

    // 슬롯머신 애니메이션으로 표시
    showSlotMachineAnimation(candidates, duration, () => {
        showWinnerModal(winnerNames, message || '🎉 투표 추첨 결과');
    });
}

// ========== 오버레이 설정 ==========
function saveOverlaySettings() {
    const autoHideSeconds = parseInt(document.getElementById('overlay-auto-hide')?.value) || 5;

    const settings = {
        backgroundOpacity: parseInt(document.getElementById('overlay-opacity')?.value) || 70,
        themeColor: document.getElementById('overlay-color')?.value || '#00ff94',
        position: document.getElementById('overlay-position')?.value || 'center',
        size: document.getElementById('overlay-size')?.value || 'medium',
        showAnimation: document.getElementById('overlay-animation')?.checked ?? true,
        showConfetti: document.getElementById('overlay-confetti')?.checked ?? true,
        enableTTS: document.getElementById('overlay-tts')?.checked ?? false,
        ttsVolume: parseInt(document.getElementById('overlay-tts-volume')?.value) || 50,
        autoHideDelay: autoHideSeconds * 1000
    };

    sendWebSocket({
        type: 'updateOverlaySettings',
        payload: settings
    });

    showNotification('오버레이 설정이 저장되었습니다.', 'success');
}

function resetOverlay() {
    sendWebSocket({ type: 'hideOverlay' });
    showNotification('오버레이가 초기화되었습니다.', 'info');
}

function copyOverlayLink() {
    const linkInput = document.getElementById('overlay-url');
    if (linkInput) {
        linkInput.select();
        navigator.clipboard.writeText(linkInput.value).then(() => {
            showNotification('오버레이 URL이 복사되었습니다!', 'success');
        }).catch(() => {
            // fallback
            document.execCommand('copy');
            showNotification('오버레이 URL이 복사되었습니다!', 'success');
        });
    }
}

// ========== 헬퍼 함수들 ==========
function setActiveFeature(feature) {
    activeFeature = feature;
}

function sendWebSocket(data) {
    if (window.socket && window.socket.readyState === WebSocket.OPEN) {
        window.socket.send(JSON.stringify(data));
    } else {
        console.error('[VoteSystem] WebSocket not connected');
        showNotification('서버와 연결되지 않았습니다.', 'error');
    }
}

// ========== WebSocket 메시지 핸들러 ==========
function handleVoteSystemMessage(data) {
    switch (data.type) {
        case 'drawStateUpdate':
            updateDrawUI(data.payload);
            break;

        case 'rouletteStateUpdate':
            updateRouletteUI(data.payload);
            break;

        case 'voteStateUpdate':
            updateVoteUI(data.payload);
            break;

        case 'overlaySettingsUpdate':
            updateOverlaySettingsUI(data.payload);
            break;

        case 'drawWinnerResult':
            if (data.success && data.payload?.winners) {
                showDrawWinners(data.payload.winners, data.payload.animationDuration, data.payload.allParticipants);
            }
            break;

        case 'rouletteSpinResult':
            if (data.success && data.payload) {
                spinRouletteAnimation(data.payload.spinDegree, data.payload.result, data.payload.animationDuration);
            }
            break;

        case 'drawResult':
            if (data.success && data.payload?.winners) {
                showVoteDrawWinners(
                    data.payload.winners,
                    data.message,
                    data.payload.animationDuration,
                    data.payload.allParticipants
                );
            } else if (!data.success && data.message) {
                showNotification(data.message, 'error');
            }
            break;

        case 'voteDetails':
            if (data.payload) {
                displayVotersModal(data.payload.vote, data.payload.voterNames);
            }
            break;

        case 'rouletteResult':
        case 'voteResult':
            if (!data.success && data.message) {
                showNotification(data.message, 'error');
            }
            break;
    }
}

// 오버레이 설정 UI 업데이트
function updateOverlaySettingsUI(settings) {
    if (!settings) return;

    const opacitySlider = document.getElementById('overlay-opacity');
    const opacityValue = document.getElementById('overlay-opacity-value');
    const colorInput = document.getElementById('overlay-color');
    const autoHideSlider = document.getElementById('overlay-auto-hide');
    const autoHideValue = document.getElementById('overlay-auto-hide-value');
    const animationCheckbox = document.getElementById('overlay-animation');
    const confettiCheckbox = document.getElementById('overlay-confetti');

    if (opacitySlider && settings.backgroundOpacity !== undefined) {
        opacitySlider.value = settings.backgroundOpacity;
        if (opacityValue) opacityValue.textContent = `${settings.backgroundOpacity}%`;
    }

    if (autoHideSlider && settings.autoHideDelay !== undefined) {
        const seconds = Math.round(settings.autoHideDelay / 1000);
        autoHideSlider.value = seconds;
        if (autoHideValue) autoHideValue.textContent = `${seconds}초`;
    }

    if (animationCheckbox && settings.showAnimation !== undefined) {
        animationCheckbox.checked = settings.showAnimation;
    }

    if (confettiCheckbox && settings.showConfetti !== undefined) {
        confettiCheckbox.checked = settings.showConfetti;
    }

    if (colorInput && settings.themeColor) {
        colorInput.value = settings.themeColor;

        // 색상 프리셋 버튼 활성화 상태 업데이트
        document.querySelectorAll('.color-preset').forEach(preset => {
            if (preset.dataset.color === settings.themeColor) {
                preset.classList.add('active');
            } else {
                preset.classList.remove('active');
            }
        });
    }
}

// ========== 초기화 ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('[VoteSystem] Initializing...');

    // 서브탭 버튼 이벤트
    document.querySelectorAll('.vote-sub-tab').forEach(btn => {
        btn.addEventListener('click', function() {
            const subtab = this.dataset.voteSubtab;
            if (subtab) switchVoteSubTab(subtab);
        });
    });

    // ========== 시청자 추첨 (Draw) ==========
    document.getElementById('start-draw-btn')?.addEventListener('click', startDraw);
    document.getElementById('stop-draw-btn')?.addEventListener('click', stopDrawCollecting);
    document.getElementById('execute-draw-btn')?.addEventListener('click', executeDraw);
    document.getElementById('reset-draw-btn')?.addEventListener('click', resetDraw);

    // ========== 숫자 투표 (Vote) ==========
    // 투표 옵션 추가 버튼 (HTML에서는 add-vote-option-btn)
    document.getElementById('add-vote-option-btn')?.addEventListener('click', addVoteOption);

    // 투표 생성 버튼
    document.getElementById('create-vote-btn')?.addEventListener('click', createVote);

    // 투표 초기화 버튼
    document.getElementById('reset-vote-btn')?.addEventListener('click', resetVote);

    // 투표 시작/종료 버튼
    document.getElementById('start-vote-btn')?.addEventListener('click', startVote);
    document.getElementById('end-vote-btn')?.addEventListener('click', endVote);

    // 투표 추첨 버튼
    document.getElementById('draw-vote-btn')?.addEventListener('click', drawFromVote);

    // 투표자 보기 버튼
    document.getElementById('show-voters-btn')?.addEventListener('click', showVotersModal);

    // ========== 룰렛 (Roulette) ==========
    // 룰렛 항목 추가 버튼 (HTML에서는 add-roulette-item-btn)
    document.getElementById('add-roulette-item-btn')?.addEventListener('click', addRouletteItem);

    // 투표 가져오기 버튼
    document.getElementById('import-vote-btn')?.addEventListener('click', importVoteToRoulette);

    // 룰렛 생성 버튼
    document.getElementById('create-roulette-btn')?.addEventListener('click', createRoulette);

    // 룰렛 초기화 버튼
    document.getElementById('reset-roulette-btn')?.addEventListener('click', resetRoulette);

    // 룰렛 돌리기 버튼
    document.getElementById('spin-roulette-btn')?.addEventListener('click', spinRoulette);

    // ========== 설정 (Settings) ==========
    // 오버레이 설정 저장 (HTML에서는 save-overlay-settings)
    document.getElementById('save-overlay-settings')?.addEventListener('click', saveOverlaySettings);

    // 오버레이 URL 복사 (HTML에서는 copy-overlay-url)
    document.getElementById('copy-overlay-url')?.addEventListener('click', copyOverlayLink);

    // 오버레이 투명도 슬라이더
    const opacitySlider = document.getElementById('overlay-opacity');
    const opacityValue = document.getElementById('overlay-opacity-value');
    opacitySlider?.addEventListener('input', (e) => {
        if (opacityValue) opacityValue.textContent = `${e.target.value}%`;
    });

    // 자동 숨김 시간 슬라이더
    const autoHideSlider = document.getElementById('overlay-auto-hide');
    const autoHideValue = document.getElementById('overlay-auto-hide-value');
    autoHideSlider?.addEventListener('input', (e) => {
        if (autoHideValue) autoHideValue.textContent = `${e.target.value}초`;
    });

    // 색상 프리셋 (HTML에서는 overlay-color)
    document.querySelectorAll('.color-preset').forEach(preset => {
        preset.addEventListener('click', function() {
            const color = this.dataset.color;
            const colorInput = document.getElementById('overlay-color');
            if (colorInput) colorInput.value = color;

            document.querySelectorAll('.color-preset').forEach(p => p.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // 오버레이 URL 설정 (HTML에서는 overlay-url)
    const overlayUrlInput = document.getElementById('overlay-url');
    if (overlayUrlInput) {
        overlayUrlInput.value = `${window.location.origin}/overlay/vote`;
    }

    // 초기 서브탭 활성화
    switchVoteSubTab('draw');

    console.log('[VoteSystem] Initialized');
});

// WebSocket 연결 후 핸들러 추가
(function() {
    const checkSocket = setInterval(() => {
        if (window.socket && window.socket.readyState === WebSocket.OPEN) {
            clearInterval(checkSocket);
            
            const originalOnMessage = window.socket.onmessage;
            window.socket.onmessage = function(event) {
                try {
                    const data = JSON.parse(event.data);
                    handleVoteSystemMessage(data);
                } catch (e) {
                    // 파싱 오류 무시
                }
                
                if (originalOnMessage) {
                    originalOnMessage.call(window.socket, event);
                }
            };
            
            console.log('[VoteSystem] WebSocket handler attached');
        }
    }, 500);
    
    setTimeout(() => clearInterval(checkSocket), 30000);
})();

// 전역 함수 등록
window.switchVoteSubTab = switchVoteSubTab;
window.startDraw = startDraw;
window.stopDrawCollecting = stopDrawCollecting;
window.executeDraw = executeDraw;
window.resetDraw = resetDraw;
window.clearPreviousWinners = clearPreviousWinners;
window.removeDrawParticipant = removeDrawParticipant;
window.addVoteOption = addVoteOption;
window.removeVoteOption = removeVoteOption;
window.createVote = createVote;
window.startVote = startVote;
window.endVote = endVote;
window.resetVote = resetVote;
window.drawFromVote = drawFromVote;
window.showVotersModal = showVotersModal;
window.closeVotersModal = closeVotersModal;
window.deleteVoteRecord = deleteVoteRecord;
window.drawFromVoteId = drawFromVoteId;
window.showVotersModalFor = showVotersModalFor;
window.importVoteToRouletteFromId = importVoteToRouletteFromId;
window.addRouletteItem = addRouletteItem;
window.removeRouletteItem = removeRouletteItem;
window.createRoulette = createRoulette;
window.spinRoulette = spinRoulette;
window.resetRoulette = resetRoulette;
window.importVoteToRoulette = importVoteToRoulette;
window.saveOverlaySettings = saveOverlaySettings;
window.resetOverlay = resetOverlay;
window.copyOverlayLink = copyOverlayLink;
window.showWinnerModal = showWinnerModal;
window.closeWinnerModal = closeWinnerModal;
window.showSlotMachineAnimation = showSlotMachineAnimation;
