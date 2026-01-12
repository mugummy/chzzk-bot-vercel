// 💬 Enhanced Chat System
class EnhancedChatSystem {
    constructor() {
        this.chatMessages = [];
        this.isFloatingVisible = false;
        this.filters = {
            badWords: ['욕설1', '욕설2'], // 실제 욕설 목록은 서버에서 관리
            spamDetection: true,
            linkProtection: true,
            capsLimit: 70 // 대문자 비율 제한 (%)
        };
        this.emojis = {
            ':)': '😊',
            ':(': '😢',
            ':D': '😃',
            ':P': '😛',
            '<3': '❤️',
            '</3': '💔',
            'ㅠㅠ': '😭',
            'ㅋㅋ': '😂',
            'ㄷㄷ': '😱',
            'ㅇㅇ': '👍',
            'ㄴㄴ': '👎'
        };
        this.init();
    }

    init() {
        this.createFloatingChat();
        this.createChatToggleButton();
        this.setupEventListeners();
    }

    createFloatingChat() {
        // Check if floating chat already exists
        if (document.getElementById('floating-chat')) return;

        const floatingChat = document.createElement('div');
        floatingChat.id = 'floating-chat';
        floatingChat.className = 'floating-chat hidden';
        floatingChat.style.cssText = "
            position: fixed;
            top: 100px;
            right: 20px;
            width: 350px;
            height: 400px;
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-card);
            z-index: 1200;
            display: flex;
            flex-direction: column;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        ";

        // Chat header
        const chatHeader = document.createElement('div');
        chatHeader.id = 'chatHeader';
        chatHeader.style.cssText = "
            padding: 12px 16px;
            background: var(--bg-tertiary);
            border-bottom: 1px solid var(--border-color);
            border-radius: var(--radius-md) var(--radius-md) 0 0;
            font-weight: 600;
            color: var(--text-primary);
            display: flex;
            align-items: center;
            justify-content: space-between;
        ";
        chatHeader.innerHTML = "
            <span>실시간 채팅</span>
            <button id=\"close-floating-chat\" style=\" 
                background: none;
                border: none;
                color: var(--text-secondary);
                font-size: 18px;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
            \">×</button>
        ";

        // Chat log
        const chatLog = document.createElement('div');
        chatLog.id = 'floatingChatLog';
        chatLog.style.cssText = "
            flex: 1;
            overflow-y: auto;
            padding: 12px;
            background: var(--bg-primary);
            scrollbar-width: thin;
            scrollbar-color: var(--border-color) transparent;
        ";
        chatLog.innerHTML = "
            <div class=\"chat-placeholder\" style=\" 
                text-align: center;
                color: var(--text-secondary);
                padding: 40px 20px;
                font-size: 14px;
            \">
                <i class=\"fas fa-comments\" style=\"font-size: 32px; margin-bottom: 12px; opacity: 0.5;\"></i>
                <p>채팅이 여기에 표시됩니다...</p>
            </div>
        ";

        // Chat input
        const chatInputContainer = document.createElement('div');
        chatInputContainer.className = 'chat-input-container';
        chatInputContainer.style.cssText = "
            padding: 12px;
            border-top: 1px solid var(--border-color);
            background: var(--bg-secondary);
            border-radius: 0 0 var(--radius-md) var(--radius-md);
        ";

        const chatInput = document.createElement('input');
        chatInput.id = 'floatingChatInput';
        chatInput.type = 'text';
        chatInput.placeholder = '채팅 입력...';
        chatInput.style.cssText = "
            width: 100%;
            padding: 8px 12px;
            border: 1px solid var(--border-color);
            border-radius: 20px;
            background: var(--bg-primary);
            color: var(--text-primary);
            font-size: 14px;
            outline: none;
        ";

        chatInputContainer.appendChild(chatInput);

        // Assemble floating chat
        floatingChat.appendChild(chatHeader);
        floatingChat.appendChild(chatLog);
        floatingChat.appendChild(chatInputContainer);

        document.body.appendChild(floatingChat);
    }

    createChatToggleButton() {
        // Check if toggle button already exists
        if (document.getElementById('chatToggleBtn')) return;

        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'chatToggleBtn';
        toggleBtn.style.cssText = "
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 60px;
            height: 60px;
            border: none;
            border-radius: 50%;
            background: var(--accent-primary);
            color: var(--bg-primary);
            cursor: pointer;
            font-size: 24px;
            box-shadow: 0 4px 20px rgba(0, 255, 148, 0.3);
            z-index: 1100;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        ";
        toggleBtn.innerHTML = '<i class="fas fa-comments"></i>';

        // Add hover effects
        toggleBtn.addEventListener('mouseenter', () => {
            toggleBtn.style.transform = 'scale(1.1)';
            toggleBtn.style.boxShadow = '0 6px 25px rgba(0, 255, 148, 0.4)';
        });

        toggleBtn.addEventListener('mouseleave', () => {
            toggleBtn.style.transform = 'scale(1)';
            toggleBtn.style.boxShadow = '0 4px 20px rgba(0, 255, 148, 0.3)';
        });

        toggleBtn.addEventListener('click', () => {
            this.toggleFloatingChat();
        });

        document.body.appendChild(toggleBtn);
    }

    setupEventListeners() {
        // Close floating chat
        document.addEventListener('click', (e) => {
            if (e.target.id === 'close-floating-chat') {
                this.hideFloatingChat();
            }
        });
        
        // 드래그 기능 추가
        this.setupDragFunctionality();

        // Chat input submission
        document.addEventListener('keypress', (e) => {
            if (e.target.id === 'floatingChatInput' && e.key === 'Enter') {
                this.sendChatMessage(e.target.value);
                e.target.value = '';
            }
        });

        // Expand chat button in dashboard
        const expandBtn = document.getElementById('expand-chat-btn');
        if (expandBtn) {
            expandBtn.addEventListener('click', () => {
                this.showFloatingChat();
            });
        }

        // Listen for theme changes
        document.addEventListener('themeChanged', () => {
            this.updateFloatingChatStyles();
        });
    }

    toggleFloatingChat() {
        if (this.isFloatingVisible) {
            this.hideFloatingChat();
        } else {
            this.showFloatingChat();
        }
    }

    showFloatingChat() {
        const floatingChat = document.getElementById('floating-chat');
        if (floatingChat) {
            floatingChat.classList.remove('hidden');
            setTimeout(() => {
                floatingChat.style.transform = 'translateX(0)';
            }, 10);
            this.isFloatingVisible = true;
        }
    }

    hideFloatingChat() {
        const floatingChat = document.getElementById('floating-chat');
        if (floatingChat) {
            floatingChat.style.transform = 'translateX(100%)';
            setTimeout(() => {
                floatingChat.classList.add('hidden');
            }, 300);
            this.isFloatingVisible = false;
        }
    }

    addChatMessage(messageData) {
        const processedMessage = this.processMessage(messageData);
        this.chatMessages.push(processedMessage);

        // Limit chat history
        if (this.chatMessages.length > 200) {
            this.chatMessages.shift();
        }

        // Update both dashboard and floating chat
        this.updateChatDisplay();
        this.updateFloatingChatDisplay();
    }

    processMessage(messageData) {
        let message = messageData.message || '';
        
        // Apply emoji conversion
        message = this.convertEmojis(message);
        
        // Apply chat filters
        if (this.filters.badWords.length > 0 && this.containsBadWords(message)) {
            message = this.censorBadWords(message);
        }
        
        // Check caps lock
        if (this.filters.capsLimit > 0 && this.isTooMuchCaps(message)) {
            message = message.toLowerCase();
        }
        
        // chzzk ChatEvent 구조에 맞게 처리
        return {
            ...messageData,
            message: message,
            timestamp: messageData.timestamp || new Date(),
            profile: messageData.profile || { nickname: messageData.username || 'Unknown' },
            hidden: messageData.hidden || false,
            processed: true
        };
    }

    convertEmojis(text) {
        let result = text;
        for (const [emoticon, emoji] of Object.entries(this.emojis)) {
            const regex = new RegExp(this.escapeRegExp(emoticon), 'g');
            result = result.replace(regex, emoji);
        }
        return result;
    }

    containsBadWords(text) {
        const lowercaseText = text.toLowerCase();
        return this.filters.badWords.some(word => 
            lowercaseText.includes(word.toLowerCase())
        );
    }

    censorBadWords(text) {
        let result = text;
        this.filters.badWords.forEach(word => {
            const regex = new RegExp(this.escapeRegExp(word), 'gi');
            result = result.replace(regex, '*'.repeat(word.length));
        });
        return result;
    }

    isTooMuchCaps(text) {
        const upperCaseCount = (text.match(/[A-Z]/g) || []).length;
        const letterCount = (text.match(/[a-zA-Z]/g) || []).length;
        
        if (letterCount < 3) return false; // Too short to judge
        
        const capsPercentage = (upperCaseCount / letterCount) * 100;
        return capsPercentage > this.filters.capsLimit;
    }

    updateChatDisplay() {
        const chatContainer = document.getElementById('chat-messages');
        if (!chatContainer) return;

        // Remove placeholder
        const placeholder = chatContainer.querySelector('.chat-placeholder');
        if (placeholder && this.chatMessages.length > 0) {
            placeholder.remove();
        }

        // Render messages
        const messagesHTML = this.chatMessages.slice(-50).map(msg => 
            this.renderChatMessage(msg)
        ).join('');

        chatContainer.innerHTML = messagesHTML;
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    updateFloatingChatDisplay() {
        const chatContainer = document.getElementById('floatingChatLog');
        if (!chatContainer) return;

        // Remove placeholder
        const placeholder = chatContainer.querySelector('.chat-placeholder');
        if (placeholder && this.chatMessages.length > 0) {
            placeholder.remove();
        }

        // Render messages
        const messagesHTML = this.chatMessages.slice(-50).map(msg => 
            this.renderChatMessage(msg, true)
        ).join('');

        chatContainer.innerHTML = messagesHTML;
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    renderChatMessage(messageData, isFloating = false) {
        const { profile, message, hidden, timestamp } = messageData;
        const timeStr = timestamp ? new Date(timestamp).toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit'
        }) : '';

        const baseStyle = "
            margin-bottom: 8px;
            padding: " + (isFloating ? '6px 8px' : '8px 12px') + ",
            background: var(--bg-tertiary);
            border-radius: var(--radius-sm);
            font-size: " + (isFloating ? '13px' : '14px') + ",
            line-height: 1.4;
            word-wrap: break-word;
        ";

        return " 
            <div class=\"chat-message\" style=\"" + baseStyle + "\">
                <div style=\"display: flex; align-items: baseline; gap: 8px; margin-bottom: 2px;\">
                    <strong style=\"color: var(--accent-primary); font-size: " + (isFloating ? '12px' : '13px') + ";\">
                        " + this.escapeHTML(profile?.nickname || 'Unknown') + "
                    </strong>
                    " + (timeStr ? `<span style=\"color: var(--text-tertiary); font-size: 11px;\">${timeStr}</span>` : '') + "
                </div>
                <div style=\"color: var(--text-primary);\">
                    " + (hidden ? 
                        '<span style="color: var(--text-tertiary); font-style: italic;">[블라인드]</span>' : 
                        this.escapeHTML(message || '')
                    ) + "
                </div>
            </div>
        ";
    }

    sendChatMessage(message) {
        if (!message.trim()) return;

        // Send via WebSocket if available (check both socket and window.ws for compatibility)
        const webSocket = window.socket || window.ws;
        if (webSocket && webSocket.readyState === WebSocket.OPEN) {
            webSocket.send(JSON.stringify({
                type: 'sendChat',
                payload: message.trim()
            }));
        } else {
            if (window.notificationSystem) {
                window.notificationSystem.showCommandNotification('봇이 연결되지 않았습니다.', false);
            }
        }
    }

    updateFloatingChatStyles() {
        // This method is called when theme changes
        // CSS custom properties will automatically update the styles
    }

    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\\]/g, '\\$&');
    }

    // Configuration methods
    setFilters(newFilters) {
        this.filters = { ...this.filters, ...newFilters };
    }

    addEmoji(emoticon, emoji) {
        this.emojis[emoticon] = emoji;
    }

    removeEmoji(emoticon) {
        delete this.emojis[emoticon];
    }

    clearChatHistory() {
        this.chatMessages = [];
        this.updateChatDisplay();
        this.updateFloatingChatDisplay();
    }

    setupDragFunctionality() {
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };
        
        const chatHeader = document.getElementById('chatHeader');
        const floatingChat = document.getElementById('floating-chat');
        
        if (!chatHeader || !floatingChat) return;
        
        // 헤더를 드래그 핸들로 설정
        chatHeader.style.cursor = 'move';
        chatHeader.style.userSelect = 'none';
        
        chatHeader.addEventListener('mousedown', (e) => {
            // 닫기 버튼이 아닌 경우에만 드래그 시작
            if (e.target.id === 'close-floating-chat') return;
            
            isDragging = true;
            const rect = floatingChat.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
            
            // 드래그 중 선택 방지
            document.body.style.userSelect = 'none';
            chatHeader.style.cursor = 'grabbing';
            
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;
            
            // 화면 경계 제한
            const maxX = window.innerWidth - floatingChat.offsetWidth;
            const maxY = window.innerHeight - floatingChat.offsetHeight;
            
            const constrainedX = Math.max(0, Math.min(newX, maxX));
            const constrainedY = Math.max(0, Math.min(newY, maxY));
            
            floatingChat.style.left = constrainedX + 'px';
            floatingChat.style.top = constrainedY + 'px';
            floatingChat.style.right = 'auto'; // right 속성 제거
            
            e.preventDefault();
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                document.body.style.userSelect = '';
                chatHeader.style.cursor = 'move';
            }
        });
        
        // 터치 이벤트 지원 (모바일)
        chatHeader.addEventListener('touchstart', (e) => {
            if (e.target.id === 'close-floating-chat') return;
            
            isDragging = true;
            const touch = e.touches[0];
            const rect = floatingChat.getBoundingClientRect();
            dragOffset.x = touch.clientX - rect.left;
            dragOffset.y = touch.clientY - rect.top;
            
            e.preventDefault();
        });
        
        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            const touch = e.touches[0];
            const newX = touch.clientX - dragOffset.x;
            const newY = touch.clientY - dragOffset.y;
            
            // 화면 경계 제한
            const maxX = window.innerWidth - floatingChat.offsetWidth;
            const maxY = window.innerHeight - floatingChat.offsetHeight;
            
            const constrainedX = Math.max(0, Math.min(newX, maxX));
            const constrainedY = Math.max(0, Math.min(newY, maxY));
            
            floatingChat.style.left = constrainedX + 'px';
            floatingChat.style.top = constrainedY + 'px';
            floatingChat.style.right = 'auto'; // right 속성 제거
            
            e.preventDefault();
        });
        
        document.addEventListener('touchend', () => {
            if (isDragging) {
                isDragging = false;
            }
        });
    }
}

// Initialize enhanced chat system
window.enhancedChatSystem = new EnhancedChatSystem();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedChatSystem;
}
