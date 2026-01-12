// 📱 Mobile Optimization System
// FontAwesome icons and mobile interface optimization
class MobileOptimization {
    constructor() {
        this.isMobile = false;
        this.isTablet = false;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.sidebarOpen = false;
        this.init();
    }

    init() {
        this.detectDevice();
        this.setupViewport();
        this.createMobileNavigation();
        this.setupTouchGestures();
        this.setupResponsiveElements();
        this.setupPWA();
        this.optimizeForMobile();
    }

    detectDevice() {
        const userAgent = navigator.userAgent.toLowerCase();
        this.isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        this.isTablet = /ipad|android(?!.*mobile)/i.test(userAgent);
        
        // Set CSS classes for device detection
        document.documentElement.classList.toggle('mobile', this.isMobile);
        document.documentElement.classList.toggle('tablet', this.isTablet);
        document.documentElement.classList.toggle('desktop', !this.isMobile && !this.isTablet);
    }

    setupViewport() {
        // Ensure proper viewport meta tag
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }
        viewport.content = 'width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover';

        // Prevent zoom on input focus (iOS)
        if (this.isMobile) {
            const inputs = document.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.addEventListener('focus', () => {
                    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
                });
                input.addEventListener('blur', () => {
                    viewport.content = 'width=device-width, initial-scale=1.0, user-scalable=no';
                });
            });
        }
    }

    createMobileNavigation() {
        if (!this.isMobile) return;

        // Create mobile header
        this.createMobileHeader();
        
        // Create hamburger menu
        this.createHamburgerMenu();
        
        // Create mobile sidebar overlay
        this.createMobileSidebarOverlay();
        
        // Modify existing sidebar for mobile
        this.setupMobileSidebar();
    }

    createMobileHeader() {
        const existingHeader = document.querySelector('.header');
        if (existingHeader) {
            existingHeader.style.display = 'none';
        }

        const mobileHeader = document.createElement('div');
        mobileHeader.className = 'mobile-header';
        mobileHeader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 60px;
            background: var(--bg-secondary);
            border-bottom: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 16px;
            z-index: 1000;
        `;

        mobileHeader.innerHTML = `
            <button id="mobile-menu-btn" style="
                background: none;
                border: none;
                color: var(--text-primary);
                font-size: 20px;
                padding: 8px;
                cursor: pointer;
                border-radius: 4px;
            ">
                <i class="fas fa-bars"></i>
            </button>
            <h1 style="
                font-size: 18px;
                font-weight: 600;
                color: var(--text-primary);
                margin: 0;
            ">치지직 봇</h1>
            <div id="mobile-bot-status" style="
                display: flex;
                align-items: center;
                gap: 8px;
            ">
                <div class="status-indicator offline" id="mobile-status-indicator"></div>
                <span style="font-size: 12px; color: var(--text-secondary);" id="mobile-status-text">미연결</span>
            </div>
        `;

        document.body.insertBefore(mobileHeader, document.body.firstChild);

        // Add menu button functionality
        document.getElementById('mobile-menu-btn').addEventListener('click', () => {
            this.toggleMobileSidebar();
        });
    }

    createHamburgerMenu() {
        // Hamburger menu animations
        const style = document.createElement('style');
        style.textContent = `
            .hamburger-menu {
                position: relative;
                width: 24px;
                height: 24px;
                cursor: pointer;
            }
            
            .hamburger-line {
                position: absolute;
                width: 100%;
                height: 3px;
                background: var(--text-primary);
                border-radius: 2px;
                transition: all 0.3s ease;
            }
            
            .hamburger-line:nth-child(1) { top: 0; }
            .hamburger-line:nth-child(2) { top: 50%; transform: translateY(-50%); }
            .hamburger-line:nth-child(3) { bottom: 0; }
            
            .hamburger-menu.active .hamburger-line:nth-child(1) {
                top: 50%;
                transform: translateY(-50%) rotate(45deg);
            }
            
            .hamburger-menu.active .hamburger-line:nth-child(2) {
                opacity: 0;
            }
            
            .hamburger-menu.active .hamburger-line:nth-child(3) {
                bottom: 50%;
                transform: translateY(50%) rotate(-45deg);
            }
        `;
        document.head.appendChild(style);
    }

    createMobileSidebarOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'mobile-sidebar-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        `;

        overlay.addEventListener('click', () => {
            this.closeMobileSidebar();
        });

        document.body.appendChild(overlay);
    }

    setupMobileSidebar() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;

        sidebar.style.cssText += `
            position: fixed;
            top: 60px;
            left: 0;
            height: calc(100vh - 60px);
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            z-index: 1001;
            box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
        `;
    }

    toggleMobileSidebar() {
        if (this.sidebarOpen) {
            this.closeMobileSidebar();
        } else {
            this.openMobileSidebar();
        }
    }

    openMobileSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('mobile-sidebar-overlay');
        const menuBtn = document.getElementById('mobile-menu-btn');

        if (sidebar) {
            sidebar.style.transform = 'translateX(0)';
        }
        
        if (overlay) {
            overlay.style.opacity = '1';
            overlay.style.visibility = 'visible';
        }

        if (menuBtn) {
            menuBtn.classList.add('active');
        }

        this.sidebarOpen = true;
        document.body.style.overflow = 'hidden';
    }

    closeMobileSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('mobile-sidebar-overlay');
        const menuBtn = document.getElementById('mobile-menu-btn');

        if (sidebar) {
            sidebar.style.transform = 'translateX(-100%)';
        }
        
        if (overlay) {
            overlay.style.opacity = '0';
            overlay.style.visibility = 'hidden';
        }

        if (menuBtn) {
            menuBtn.classList.remove('active');
        }

        this.sidebarOpen = false;
        document.body.style.overflow = 'auto';
    }

    setupTouchGestures() {
        if (!this.isMobile) return;

        // Swipe to open/close sidebar
        document.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const deltaX = touchEndX - this.touchStartX;
            const deltaY = touchEndY - this.touchStartY;

            // Horizontal swipe detection
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                if (deltaX > 0 && this.touchStartX < 50 && !this.sidebarOpen) {
                    // Swipe right from left edge - open sidebar
                    this.openMobileSidebar();
                } else if (deltaX < 0 && this.sidebarOpen) {
                    // Swipe left - close sidebar
                    this.closeMobileSidebar();
                }
            }
        }, { passive: true });

        // Pull to refresh (disable)
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 1) return;
            
            const touch = e.touches[0];
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            
            // Prevent pull to refresh on main content
            if (window.pageYOffset === 0 && touch.clientY > this.touchStartY) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    setupResponsiveElements() {
        // Make buttons touch-friendly
        this.optimizeButtonSizes();
        
        // Optimize form inputs
        this.optimizeFormInputs();
        
        // Optimize modal sizes
        this.optimizeModals();
        
        // Optimize tables
        this.optimizeTables();
    }

    optimizeButtonSizes() {
        if (!this.isMobile) return;

        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px) {
                .btn {
                    min-height: 44px !important;
                    padding: 12px 16px !important;
                    font-size: 16px !important;
                }
                
                .action-btn {
                    min-width: 44px !important;
                    min-height: 44px !important;
                    padding: 12px !important;
                }
                
                .quick-tab-large {
                    min-height: 60px !important;
                    padding: 16px !important;
                }
                
                .nav-item {
                    min-height: 48px !important;
                    padding: 12px 16px !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    optimizeFormInputs() {
        if (!this.isMobile) return;

        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px) {
                .form-input,
                .creation-input,
                .creation-textarea {
                    min-height: 44px !important;
                    font-size: 16px !important;
                    padding: 12px 16px !important;
                }
                
                textarea {
                    min-height: 120px !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    optimizeModals() {
        if (!this.isMobile) return;

        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px) {
                .modal-content {
                    margin: 20px !important;
                    max-height: calc(100vh - 40px) !important;
                    overflow-y: auto !important;
                }
                
                .command-creation-modal {
                    width: calc(100vw - 40px) !important;
                    max-width: none !important;
                }
                
                .command-creation-grid {
                    grid-template-columns: 1fr !important;
                    gap: 20px !important;
                }
                
                .functions-grid {
                    grid-template-columns: repeat(2, 1fr) !important;
                    gap: 8px !important;
                }
                
                .function-tag {
                    padding: 8px !important;
                    font-size: 12px !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    optimizeTables() {
        if (!this.isMobile) return;

        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px) {
                .dashboard-grid {
                    grid-template-columns: 1fr !important;
                    gap: 16px !important;
                }
                
                .stats-grid {
                    grid-template-columns: repeat(2, 1fr) !important;
                    gap: 12px !important;
                }
                
                .quick-nav-grid {
                    grid-template-columns: 1fr !important;
                    gap: 12px !important;
                }
                
                .item-card {
                    flex-direction: column !important;
                    gap: 12px !important;
                }
                
                .item-info {
                    flex-direction: column !important;
                    align-items: flex-start !important;
                    gap: 8px !important;
                }
                
                .item-actions {
                    align-self: stretch !important;
                    justify-content: space-around !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    setupPWA() {
        // Add PWA meta tags
        const manifest = {
            name: "치지직 봇 대시보드",
            short_name: "치지직봇",
            description: "치지직 스트리밍을 위한 채팅 봇 대시보드",
            start_url: "/",
            display: "standalone",
            background_color: "#1a1a1a",
            theme_color: "#00ff94",
            icons: [
                {
                    src: "/favicon.ico",
                    sizes: "32x32",
                    type: "image/x-icon"
                }
            ]
        };

        const manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        manifestLink.href = 'data:application/json;charset=utf-8;base64,' + btoa(unescape(encodeURIComponent(JSON.stringify(manifest))));
        document.head.appendChild(manifestLink);

        // Add other PWA meta tags
        const metaTags = [
            { name: 'apple-mobile-web-app-capable', content: 'yes' },
            { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
            { name: 'apple-mobile-web-app-title', content: '치지직봇' },
            { name: 'mobile-web-app-capable', content: 'yes' },
            { name: 'msapplication-TileColor', content: '#1a1a1a' },
            { name: 'msapplication-tap-highlight', content: 'no' }
        ];

        metaTags.forEach(tag => {
            const meta = document.createElement('meta');
            meta.name = tag.name;
            meta.content = tag.content;
            document.head.appendChild(meta);
        });
    }

    optimizeForMobile() {
        if (!this.isMobile) return;

        // Adjust main container for mobile header
        const mainContainer = document.querySelector('.main-container');
        if (mainContainer) {
            mainContainer.style.paddingTop = '60px';
            mainContainer.style.paddingLeft = '0';
        }

        // Hide desktop elements
        const desktopElements = document.querySelectorAll('.desktop-only');
        desktopElements.forEach(el => {
            el.style.display = 'none';
        });

        // Optimize floating elements
        this.optimizeFloatingElements();

        // Add mobile-specific event listeners
        this.addMobileEventListeners();
    }

    optimizeFloatingElements() {
        // Adjust floating chat for mobile
        const floatingChat = document.getElementById('floating-chat');
        if (floatingChat) {
            floatingChat.style.cssText += `
                @media (max-width: 768px) {
                    width: calc(100vw - 20px) !important;
                    height: 60vh !important;
                    top: 80px !important;
                    right: 10px !important;
                }
            `;
        }

        // Adjust theme toggle for mobile
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.style.top = '10px';
            themeToggle.style.right = '10px';
            themeToggle.style.width = '40px';
            themeToggle.style.height = '40px';
        }

        // Adjust chat toggle button for mobile
        const chatToggle = document.getElementById('chatToggleBtn');
        if (chatToggle) {
            chatToggle.style.bottom = '80px';
            chatToggle.style.right = '20px';
        }
    }

    addMobileEventListeners() {
        // Prevent zoom on double tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (event) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                // Recalculate layout after orientation change
                this.handleOrientationChange();
            }, 500);
        });

        // Handle resize for dynamic viewport
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));
    }

    handleOrientationChange() {
        // Close sidebar on orientation change
        if (this.sidebarOpen) {
            this.closeMobileSidebar();
        }

        // Recalculate viewport
        this.setupViewport();

        // Trigger layout recalculation
        document.body.style.height = window.innerHeight + 'px';
        setTimeout(() => {
            document.body.style.height = 'auto';
        }, 100);
    }

    handleResize() {
        // Handle keyboard showing/hiding on mobile
        if (this.isMobile) {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Public methods
    isMobileDevice() {
        return this.isMobile;
    }

    isTabletDevice() {
        return this.isTablet;
    }

    isSidebarOpen() {
        return this.sidebarOpen;
    }
}

// Initialize mobile optimization
window.mobileOptimization = new MobileOptimization();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileOptimization;
}
