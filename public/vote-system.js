// vote-system.js - WisdomIT/chzzk-vote Professional Re-implementation

const VoteSystem = {
    // 투표 시작 시 서버에 전달할 설정값 수집
    getSettings: () => {
        return {
            mode: document.querySelector('input[name="voteMode"]:checked')?.value || 'command',
            allowDonation: document.getElementById('vote-allow-donation')?.checked || false,
            donationWeight: parseInt(document.getElementById('vote-donation-weight')?.value || "100"),
            subscriberOnly: document.getElementById('vote-subscriber-only')?.checked || false,
            duration: parseInt(document.getElementById('vote-duration')?.value || "60")
        };
    },

    createVote: () => {
        const question = document.getElementById('vote-question').value.trim();
        const options = Array.from(document.querySelectorAll('#vote-options-container .form-input'))
            .map(i => i.value.trim())
            .filter(v => v !== '');

        if (!question) return ui.notify('질문을 입력하세요.', 'warning');
        if (options.length < 2) return ui.notify('선택지는 최소 2개 이상이어야 합니다.', 'warning');

        const settings = VoteSystem.getSettings();

        // 1. 투표 데이터 생성
        sendWebSocket({
            type: 'createVote',
            data: { question, options, settings }
        });

        // 2. 즉시 시작 명령
        setTimeout(() => {
            sendWebSocket({ type: 'startVote' });
            ui.notify('투표가 시작되었습니다!', 'success');
        }, 150);
    },

    addOption: () => {
        const container = document.getElementById('vote-options-container');
        const index = container.children.length + 1;
        const div = document.createElement('div');
        div.className = 'vote-option-item';
        div.style.cssText = 'display:flex; gap:10px; margin-bottom:10px; align-items:center; animation: fadeIn 0.3s ease;';
        div.innerHTML = `
            <div style="width:30px; height:30px; display:flex; align-items:center; justify-content:center; background:#00ff94; color:#000; border-radius:8px; font-weight:900;">${index}</div>
            <input type="text" class="form-input" placeholder="옵션 내용을 입력하세요">
            <button class="btn-icon btn-danger" onclick="this.parentElement.remove(); VoteSystem.reorder();">
                <i class="fas fa-trash"></i>
            </button>
        `;
        container.appendChild(div);
        div.querySelector('input').focus();
    },

    reorder: () => {
        document.querySelectorAll('#vote-options-container .vote-option-item').forEach((el, i) => {
            el.querySelector('div').textContent = i + 1;
        });
    },

    endVote: () => sendWebSocket({ type: 'endVote' }),
    resetVote: () => confirm('투표를 초기화하시겠습니까?') && sendWebSocket({ type: 'resetVote' }),

    render: (state) => {
        const vote = state.currentVote;
        const display = document.getElementById('current-vote-display');
        const controls = document.getElementById('vote-controls');
        
        if (!display) return;

        if (!vote) {
            display.innerHTML = '<div class="empty-state"><i class="fas fa-poll-h"></i><p>진행 중인 투표가 없습니다.</p></div>';
            if (controls) controls.style.display = 'none';
            return;
        }

        if (controls) controls.style.display = 'block';
        const total = vote.totalVotes || 0;

        let html = `<div class="chzzk-vote-panel">
            <div class="vote-header-row">
                <h2 class="vote-title">${utils.esc(vote.question)}</h2>
                <div class="vote-timer-badge">${vote.isActive ? 'LIVE' : 'ENDED'}</div>
            </div>
            <div class="vote-options-list">`;

        vote.options.forEach((opt, idx) => {
            const count = vote.results[opt.id] || 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const colors = ['#00ff94', '#00d4ff', '#9966ff', '#ff6b6b', '#ffd93d'];
            const color = colors[idx % colors.length];

            html += `
                <div class="v-item">
                    <div class="v-info">
                        <span class="v-label"><b>${idx + 1}.</b> ${utils.esc(opt.text)}</span>
                        <span class="v-val">${pct}% (${count}표)</span>
                    </div>
                    <div class="v-bar-bg"><div class="v-bar-fill" style="width:${pct}%; background:${color}"></div></div>
                </div>`;
        });

        html += `</div><div class="v-footer">총 ${total.toLocaleString()}표가 집계되었습니다.</div></div>`;
        display.innerHTML = html;
    }
};

// Global Exposure
window.createVote = VoteSystem.createVote;
window.addVoteOption = VoteSystem.addOption;
window.endVote = VoteSystem.endVote;
window.resetVote = VoteSystem.resetVote;
window.removeVoteOption = (btn) => btn.parentElement.remove();

window.handleVoteSystemMessage = (data) => {
    if (data.type === 'voteStateUpdate') VoteSystem.render(data.payload);
};