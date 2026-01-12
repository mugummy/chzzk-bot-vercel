// 🌙 Dark/Light Theme System
class ThemeSystem {
    constructor() {
        this.currentTheme = 'dark'; // default theme
        this.systemPreference = null;
        this.init();
    }

    init() {
        // Detect system preference
        this.detectSystemPreference();
        
        // Load saved theme or use system preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            this.currentTheme = savedTheme;
        } else {
            this.currentTheme = this.systemPreference || 'dark';
        }
        
        // Apply theme
        this.applyTheme(this.currentTheme);
        
        // Create theme toggle button
        this.createThemeToggle();
        
        // Listen for system theme changes
        this.listenForSystemChanges();
    }

    detectSystemPreference() {
        if (window.matchMedia) {
            const darkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            this.systemPreference = darkMediaQuery.matches ? 'dark' : 'light';
        }
    }

    listenForSystemChanges() {
        if (window.matchMedia) {
            const darkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            darkMediaQuery.addListener((e) => {
                this.systemPreference = e.matches ? 'dark' : 'light';
                
                // Auto-apply if user hasn't manually set a theme
                const savedTheme = localStorage.getItem('theme');
                if (!savedTheme) {
                    this.setTheme(this.systemPreference);
                }
            });
        }
    }

    createThemeToggle() {
        // Check if toggle already exists
        const existingToggle = document.getElementById('theme-toggle');
        if (existingToggle) return;

        // Create theme toggle button
        const themeToggle = document.createElement('button');
        themeToggle.id = 'theme-toggle';
        themeToggle.className = 'theme-toggle-btn';
        themeToggle.innerHTML = `
            <i class="fas ${this.currentTheme === 'dark' ? 'fa-sun' : 'fa-moon'}" id="theme-icon"></i>
        `;
        
        // Style the button
        themeToggle.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            width: 44px;
            height: 44px;
            border: none;
            border-radius: 50%;
            background: var(--bg-secondary);
            color: var(--text-primary);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            box-shadow: var(--shadow-card);
            transition: all 0.3s ease;
            z-index: 1000;
            border: 1px solid var(--border-color);
        `;

        // Add hover effects
        themeToggle.addEventListener('mouseenter', () => {
            themeToggle.style.transform = 'scale(1.1)';
            themeToggle.style.background = 'var(--accent-primary)';
            themeToggle.style.color = 'var(--bg-primary)';
        });

        themeToggle.addEventListener('mouseleave', () => {
            themeToggle.style.transform = 'scale(1)';
            themeToggle.style.background = 'var(--bg-secondary)';
            themeToggle.style.color = 'var(--text-primary)';
        });

        // Add click handler
        themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Add to page
        document.body.appendChild(themeToggle);
    }

    applyTheme(theme) {
        const root = document.documentElement;
        
        if (theme === 'light') {
            // Light theme variables
            root.style.setProperty('--bg-primary', '#ffffff');
            root.style.setProperty('--bg-secondary', '#f8f9fa');
            root.style.setProperty('--bg-tertiary', '#e9ecef');
            root.style.setProperty('--text-primary', '#212529');
            root.style.setProperty('--text-secondary', '#6c757d');
            root.style.setProperty('--text-tertiary', '#adb5bd');
            root.style.setProperty('--accent-primary', '#007bff');
            root.style.setProperty('--accent-danger', '#dc3545');
            root.style.setProperty('--border-color', '#dee2e6');
            root.style.setProperty('--shadow-card', '0 4px 20px rgba(0, 0, 0, 0.1)');
        } else {
            // Dark theme variables (default)
            root.style.setProperty('--bg-primary', '#1a1a1a');
            root.style.setProperty('--bg-secondary', '#2a2a2a');
            root.style.setProperty('--bg-tertiary', '#3a3a3a');
            root.style.setProperty('--text-primary', '#ffffff');
            root.style.setProperty('--text-secondary', '#b0b0b0');
            root.style.setProperty('--text-tertiary', '#808080');
            root.style.setProperty('--accent-primary', '#00ff94');
            root.style.setProperty('--accent-danger', '#ff4757');
            root.style.setProperty('--border-color', '#404040');
            root.style.setProperty('--shadow-card', '0 4px 20px rgba(0, 0, 0, 0.3)');
        }

        // Set data attribute for theme-specific styling
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update meta theme-color for mobile browsers
        this.updateMetaThemeColor(theme);
    }

    updateMetaThemeColor(theme) {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        
        metaThemeColor.content = theme === 'light' ? '#ffffff' : '#1a1a1a';
    }

    setTheme(theme) {
        this.currentTheme = theme;
        this.applyTheme(theme);
        localStorage.setItem('theme', theme);
        
        // Update toggle icon
        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            themeIcon.className = `fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`;
        }
        
        // Dispatch theme change event
        const event = new CustomEvent('themeChanged', { 
            detail: { theme: theme } 
        });
        document.dispatchEvent(event);
        
        // Show notification
        if (window.notificationSystem) {
            window.notificationSystem.showSystemNotification(
                `${theme === 'dark' ? '다크' : '라이트'} 테마로 변경되었습니다.`,
                'info'
            );
        }
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    resetToSystem() {
        localStorage.removeItem('theme');
        this.detectSystemPreference();
        this.setTheme(this.systemPreference || 'dark');
    }
}

// Initialize theme system
window.themeSystem = new ThemeSystem();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeSystem;
}
