// 🔔 Enhanced Notification System
class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.container = null;
        this.maxNotifications = 5;
        this.defaultDuration = 4000;
        this.init();
    }

    init() {
        // Create notification container
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.className = 'notification-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 400px;
            width: 100%;
            pointer-events: none;
            display: flex;
            flex-direction: column;
            gap: 8px;
        `;
        document.body.appendChild(this.container);

        // Request notification permission
        this.requestPermission();
    }

    async requestPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            try {
                await Notification.requestPermission();
            } catch (error) {
                console.log('Notification permission not granted');
            }
        }
    }

    show(title, options = {}) {
        const notificationData = {
            id: Date.now() + Math.random(),
            title: title || '알림',
            message: options.body || options.message || '',
            type: options.type || 'info',
            duration: options.duration || this.defaultDuration,
            sound: options.sound || false,
            icon: options.icon || null
        };

        // Add to notifications array
        this.notifications.push(notificationData);

        // Remove oldest if exceeding max
        if (this.notifications.length > this.maxNotifications) {
            const oldest = this.notifications.shift();
            this.removeNotification(oldest.id);
        }

        // Create and show notification
        this.createNotificationElement(notificationData);

        // Play sound if requested
        if (notificationData.sound) {
            this.playNotificationSound();
        }

        // Show browser notification if available
        if (options.browser && this.canShowBrowserNotification()) {
            this.showBrowserNotification(notificationData);
        }

        return notificationData.id;
    }

    createNotificationElement(data) {
        const notification = document.createElement('div');
        notification.id = `notification-${data.id}`;
        notification.className = `notification notification-${data.type}`;
        notification.style.cssText = `
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-left: 4px solid ${this.getTypeColor(data.type)};
            border-radius: var(--radius-md);
            padding: 16px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            transform: translateX(100%);
            transition: all 0.3s ease;
            pointer-events: auto;
            position: relative;
            word-wrap: break-word;
            min-width: 300px;
        `;

        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 8px;
            right: 12px;
            background: none;
            border: none;
            color: var(--text-secondary);
            font-size: 18px;
            cursor: pointer;
            padding: 0;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        closeBtn.addEventListener('click', () => this.removeNotification(data.id));

        // Add icon if provided
        let iconHTML = '';
        if (data.icon) {
            iconHTML = `<img src="${data.icon}" style="width: 24px; height: 24px; margin-right: 12px; border-radius: 50%;">`;
        } else {
            iconHTML = `<div style="width: 24px; height: 24px; margin-right: 12px; display: flex; align-items: center; justify-content: center; color: ${this.getTypeColor(data.type)};">
                ${this.getTypeIcon(data.type)}
            </div>`;
        }

        notification.innerHTML = `
            <div style="display: flex; align-items: flex-start;">
                ${iconHTML}
                <div style="flex: 1; margin-right: 20px;">
                    <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px; font-size: 14px;">
                        ${this.escapeHTML(data.title)}
                    </div>
                    ${data.message ? `<div style="color: var(--text-secondary); font-size: 13px; line-height: 1.4;">
                        ${this.escapeHTML(data.message)}
                    </div>` : ''}
                </div>
            </div>
        `;

        notification.appendChild(closeBtn);
        
        // Add to bottom of container (notifications stack downward)
        this.container.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Auto remove after duration
        if (data.duration > 0) {
            setTimeout(() => {
                this.removeNotification(data.id);
            }, data.duration);
        }

        return notification;
    }

    removeNotification(id) {
        const notification = document.getElementById(`notification-${id}`);
        if (notification) {
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }

        // Remove from array
        this.notifications = this.notifications.filter(n => n.id !== id);
    }

    clear() {
        this.notifications.forEach(notification => {
            this.removeNotification(notification.id);
        });
        this.notifications = [];
    }

    getTypeColor(type) {
        const colors = {
            success: '#00ff94',
            error: '#ff4757',
            warning: '#ffa502',
            info: '#3742fa',
            follower: '#00ff94',
            donation: '#ffd700',
            system: '#3742fa'
        };
        return colors[type] || colors.info;
    }

    getTypeIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ',
            follower: '👥',
            donation: '💝',
            system: '⚙'
        };
        return icons[type] || icons.info;
    }

    canShowBrowserNotification() {
        return 'Notification' in window && Notification.permission === 'granted';
    }

    showBrowserNotification(data) {
        if (!this.canShowBrowserNotification()) return;

        const notification = new Notification(data.title, {
            body: data.message,
            icon: data.icon || '/icon.png',
            badge: '/badge.png',
            tag: `chzzk-bot-${data.type}`,
            silent: !data.sound
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
        };

        // Auto close browser notification
        setTimeout(() => {
            notification.close();
        }, data.duration);
    }

    playNotificationSound() {
        try {
            // Use a simple beep sound
            this.playBeepSound();
        } catch (error) {
            console.log('Could not play notification sound:', error);
        }
    }

    playBeepSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            console.log('Could not play beep sound:', error);
        }
    }

    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Event handlers for specific notification types
    showFollowerNotification(username) {
        return this.show('새 팔로워!', {
            message: `${username}님이 팔로우했습니다!`,
            type: 'follower',
            sound: true,
            browser: true,
            duration: 5000
        });
    }

    showDonationNotification(username, amount, message) {
        return this.show('후원 감사합니다!', {
            message: `${username}님이 ${amount}원 후원했습니다!${message ? ` - ${message}` : ''}`,
            type: 'donation',
            sound: true,
            browser: true,
            duration: 7000
        });
    }

    showSystemNotification(message, type = 'system') {
        return this.show('시스템 알림', {
            message: message,
            type: type,
            sound: false,
            browser: false,
            duration: 4000
        });
    }

    showCommandNotification(message, success = true) {
        return this.show(success ? '성공' : '오류', {
            message: message,
            type: success ? 'success' : 'error',
            sound: false,
            browser: false,
            duration: 3000
        });
    }
}

// Initialize global notification system
window.notificationSystem = new NotificationSystem();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationSystem;
}
