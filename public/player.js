let ytPlayer;
let isPlayerReady = false;
let serverState = { currentSong: null, queue: [], isPlaying: false };
let currentVolume = 50;
let progressInterval;
let ws = null;

// 플레이어 전용 WebSocket 연결 초기화
function initPlayerWebSocket() {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}`;
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = function() {
        console.log('[Player] WebSocket connected');
        // 초기 데이터 요청
        ws.send(JSON.stringify({ type: 'requestData', dataType: 'all' }));
    };
    
    ws.onmessage = function(event) {
        try {
            const data = JSON.parse(event.data);
            handlePlayerWebSocketMessage(data);
        } catch (error) {
            console.error('[Player] Error parsing WebSocket message:', error);
        }
    };
    
    ws.onclose = function() {
        console.log('[Player] WebSocket disconnected, attempting to reconnect...');
        setTimeout(initPlayerWebSocket, 3000);
    };
    
    ws.onerror = function(error) {
        console.error('[Player] WebSocket error:', error);
    };
}

// 플레이어 관련 WebSocket 메시지 처리 함수
function handlePlayerWebSocketMessage(data) {
    if (data.type === 'songStateUpdate') {
        const oldSongId = serverState.currentSong?.id;
        serverState = data.payload;
        render(oldSongId !== serverState.currentSong?.id);
    } else if (data.type === 'volumeChange') {
        currentVolume = data.payload;
        const volumeSlider = document.getElementById('volume-slider');
        if (volumeSlider) volumeSlider.value = currentVolume;
        if (isPlayerReady) ytPlayer.setVolume(currentVolume);
    }
}

const sendControl = (action, payload = null) => {
    // 전역 ws 변수가 존재하고 연결되어 있는지 확인
    if (typeof ws !== 'undefined' && ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "controlMusic", action, payload }));
    } else {
        console.warn('[player.js] WebSocket is not connected. Cannot send control message.');
    }
};

window.onYouTubeIframeAPIReady = () => {
    ytPlayer = new YT.Player('youtube-player', {
        height: '360',
        width: '640',
        playerVars: { 'autoplay': 1, 'controls': 0, 'rel': 0, 'iv_load_policy': 3, 'modestbranding': 1, 'disablekb': 1 },
        events: { 'onReady': onPlayerReady, 'onStateChange': onPlayerStateChange, 'onError': onPlayerError }
    });
};

function onPlayerReady(event) {
    isPlayerReady = true;
    event.target.setVolume(currentVolume);
    render();
}

function onPlayerStateChange(event) {
    clearInterval(progressInterval);
    if (event.data === YT.PlayerState.PLAYING) {
        progressInterval = setInterval(updateProgress, 250);
        if (!serverState.isPlaying) {
            sendControl('togglePlayPause');
        }
    } else if (event.data === YT.PlayerState.ENDED) {
        sendControl('skip');
    } else if (event.data === YT.PlayerState.CUED && serverState.isPlaying) {
        ytPlayer.playVideo();
    }
}

function onPlayerError(event) {
    console.error("YouTube Player Error:", event.data);
    // On error, try to skip to the next song
    sendControl('skip');
}

function render(isNewSong = false) {
    const song = serverState.currentSong;
    const isPlaying = serverState.isPlaying;
    const queue = serverState.queue;

    // Update background and album art
    const background = document.getElementById('background');
    const albumArt = document.getElementById('album-art');
    const albumArtPlaceholder = document.getElementById('album-art-placeholder');
    if (song && song.thumbnail) {
        background.style.backgroundImage = `url(${song.thumbnail})`;
        albumArt.style.backgroundImage = `url(${song.thumbnail})`;
        albumArtPlaceholder.classList.add('hidden');
    } else {
        background.style.backgroundImage = '';
        albumArt.style.backgroundImage = '';
        albumArtPlaceholder.classList.remove('hidden');
    }

    // Update song info
    document.getElementById('song-title').textContent = song ? song.title : '재생 대기 중...';
    document.getElementById('requester-info').textContent = song ? `신청자: ${song.requester}` : '-';
    
    // Update controls
    document.getElementById('play-pause-btn').innerHTML = `<i class="fas ${isPlaying ? 'fa-pause-circle' : 'fa-play-circle'}"></i>`;

    updateQueue(queue, song?.id);

    if (isPlayerReady) {
        const currentVideoId = ytPlayer.getVideoData?.().video_id;
        if (song && song.id) {
            if (currentVideoId !== song.id) {
                ytPlayer.loadVideoById(song.id);
            } else {
                const playerState = ytPlayer.getPlayerState();
                if (isPlaying && playerState !== YT.PlayerState.PLAYING) {
                    ytPlayer.playVideo();
                } else if (!isPlaying && playerState === YT.PlayerState.PLAYING) {
                    ytPlayer.pauseVideo();
                }
            }
        } else {
            if (ytPlayer.getPlayerState() !== YT.PlayerState.UNSTARTED) {
                 ytPlayer.stopVideo();
            }
        }
    }
}

function updateQueue(queue, currentSongId) {
    const list = document.getElementById('queue-list');
    document.getElementById('queue-count').textContent = `(${queue.length}곡)`;
    
    list.innerHTML = queue.length > 0 ? queue.map(song => `
        <div class="queue-item ${song.id === currentSongId ? 'playing' : ''}" data-id="${song.id}">
            <img src="${song.thumbnail || ''}" alt="thumbnail">
            <div class="queue-item-info">
                <p class="queue-item-title">${song.title}</p>
                <p class="queue-item-requester">신청자: ${song.requester}</p>
            </div>
            <div class="queue-item-actions">
                <button class="queue-action-btn play-queue-btn" title="재생"><i class="fas fa-play"></i></button>
            </div>
        </div>`).join("") : '<p class="queue-empty">대기열이 비어있습니다.</p>';

    list.querySelectorAll('.play-queue-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const songId = e.currentTarget.closest('.queue-item').dataset.id;
            sendControl('playFromQueue', songId);
        });
    });
}

function updateProgress() {
    if (ytPlayer?.getDuration) {
        const progress = (ytPlayer.getCurrentTime() / ytPlayer.getDuration()) * 100;
        document.getElementById("progress-bar").style.width = `${progress}%`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // WebSocket 연결 초기화
    initPlayerWebSocket();
    
    document.getElementById("play-pause-btn").addEventListener("click", () => sendControl('togglePlayPause'));
    document.getElementById("skip-btn").addEventListener("click", () => sendControl('skip'));
    document.getElementById("delete-btn").addEventListener("click", () => {
        if (confirm('현재 곡을 삭제하시겠습니까?')) sendControl('deleteCurrent');
    });
    document.getElementById("volume-slider").addEventListener("input", e => sendControl('changeVolume', parseInt(e.target.value, 10)));
    document.getElementById("progress-container").addEventListener("click", e => {
        if (ytPlayer?.getDuration) {
            const rect = e.currentTarget.getBoundingClientRect();
            const newTime = ((e.clientX - rect.left) / rect.width) * ytPlayer.getDuration();
            ytPlayer.seekTo(newTime, true);
        }
    });
});
