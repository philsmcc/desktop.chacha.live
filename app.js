// HoverCam Desktop OS - v2.0 with Backend Integration
class DesktopOS {
    constructor() {
        this.currentUser = null;
        this.token = null;
        this.windows = new Map();
        this.windowZIndex = 100;
        this.darkMode = false;
        this.isFullscreen = false;
        this.wallpaper = 'gradient-light1';
        this.wallpaperType = 'gradient'; // gradient, image, color
        this.wallpaperColor = '#f5f7fa';
        this.systemWallpapers = [];
        this.userWallpapers = [];
        this.iconPositions = {};
        this.apps = this.defineApps();
        
        this.init();
    }

    // Gradient wallpaper presets - Light mode defaults first
    gradientPresets = [
        { id: 'gradient-light1', name: 'Clean White', gradient: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 50%, #dfe4ea 100%)' },
        { id: 'gradient-light2', name: 'Soft Blue', gradient: 'linear-gradient(135deg, #e8f4fc 0%, #d4e9f7 50%, #c5dff0 100%)' },
        { id: 'gradient-light3', name: 'Warm Cream', gradient: 'linear-gradient(135deg, #fdfbf7 0%, #f7f3eb 50%, #f0e9dc 100%)' },
        { id: 'gradient-light4', name: 'Mint Fresh', gradient: 'linear-gradient(135deg, #e8f5f0 0%, #d4ece4 50%, #c5e3d8 100%)' },
        { id: 'gradient-light5', name: 'Lavender', gradient: 'linear-gradient(135deg, #f3f0f7 0%, #e8e3f0 50%, #ddd6e8 100%)' },
        { id: 'gradient-light6', name: 'Peach', gradient: 'linear-gradient(135deg, #fdf5f0 0%, #f7e8e0 50%, #f0dbd0 100%)' },
        { id: 'gradient1', name: 'Dark Ocean', gradient: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)' },
        { id: 'gradient2', name: 'Sunset', gradient: 'linear-gradient(135deg, #1a1a2e 0%, #2d1f3d 50%, #4a2545 100%)' },
        { id: 'gradient3', name: 'Aurora', gradient: 'linear-gradient(135deg, #0f1923 0%, #1a3a4a 50%, #0f4c5c 100%)' },
        { id: 'gradient4', name: 'Ember', gradient: 'linear-gradient(135deg, #1a0f0f 0%, #2e1a1a 50%, #3e2016 100%)' },
        { id: 'gradient5', name: 'Forest', gradient: 'linear-gradient(135deg, #0f1a0f 0%, #1a2e1a 50%, #163e20 100%)' },
        { id: 'gradient6', name: 'Midnight', gradient: 'linear-gradient(135deg, #0a0a1a 0%, #151530 50%, #1a1a40 100%)' }
    ];

    defineApps() {
        const baseApps = [
            {
                id: "whiteboard",
                name: "Whiteboard",
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>',
                defaultSize: { width: 900, height: 600 },
                content: () => this.renderWhiteboardApp()
            },
            {
                id: "camera",
                name: "Camera",
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>',
                defaultSize: { width: 640, height: 520 },
                content: () => this.renderCameraApp()
            },

            {
                id: "browser",
                name: "Browser",
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
                defaultSize: { width: 1000, height: 700 },
                content: () => this.renderBrowserApp()
            },
            {
                id: "welcome",
                name: "Welcome",
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
                defaultSize: { width: 600, height: 450 },
                content: () => this.renderWelcomeApp()
            },
            {
                id: "files",
                name: "Files",
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>',
                defaultSize: { width: 700, height: 500 },
                content: () => this.renderFilesApp()
            },
            {
                id: "terminal",
                name: "Terminal",
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
                defaultSize: { width: 650, height: 400 },
                content: () => this.renderTerminalApp()
            },
            {
                id: "settings",
                name: "Settings",
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
                defaultSize: { width: 650, height: 600 },
                content: () => this.renderSettingsApp()
            },
            {
                id: "lessonplanner",
                name: "Lesson Planner",
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg>',
                defaultSize: { width: 1100, height: 750 },
                content: () => this.renderLessonPlannerApp()
            },
            {
                id: "shoutouts",
                name: "Shoutouts",
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="9" y1="10" x2="15" y2="10"/></svg>',
                defaultSize: { width: 450, height: 600 },
                content: () => this.renderShoutoutsApp()
            },
            {
                id: "printquizzes",
                name: "Print Quizzes",
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>',
                defaultSize: { width: 900, height: 700 },
                content: () => this.renderPrintQuizzesApp()
            }
        ];
        
        // Admin-only apps
        const adminApps = [
            {
                id: "usermanager",
                name: "User Manager",
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
                defaultSize: { width: 1000, height: 700 },
                content: () => this.renderUserManagerApp(),
                adminOnly: true
            },
            {
                id: "aisettings",
                name: "AI Settings",
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73v.27h1a7 7 0 0 1 7 7h.27c.34-.6.99-1 1.73-1a2 2 0 0 1 0 4c-.74 0-1.39-.4-1.73-1H21a7 7 0 0 1-7 7v.27c.6.34 1 .99 1 1.73a2 2 0 0 1-4 0c0-.74.4-1.39 1-1.73V21a7 7 0 0 1-7-7h-.27c-.34.6-.99 1-1.73 1a2 2 0 0 1 0-4c.74 0 1.39.4 1.73 1H5a7 7 0 0 1 7-7v-.27c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
                defaultSize: { width: 900, height: 700 },
                content: () => this.renderAISettingsApp(),
                adminOnly: true
            },
            {
                id: "welcomeeditor",
                name: "Welcome Editor",
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
                defaultSize: { width: 900, height: 600 },
                content: () => this.renderWelcomeEditorApp(),
                adminOnly: true
            }
        ];
        
        // Return base apps + admin apps if user is super admin
        if (this.currentUser && this.currentUser.isSuperAdmin) {
            return [...baseApps, ...adminApps];
        }
        return baseApps;
    }

    async init() {
        // Load saved theme preference
        const savedTheme = localStorage.getItem("hovercam_theme");
        if (savedTheme !== null) {
            this.darkMode = savedTheme === "dark";
        }
        this.applyTheme();

        // Check for existing session
        const session = localStorage.getItem("hovercam_session");
        const token = localStorage.getItem("hovercam_token");
        
        if (session && token) {
            this.currentUser = JSON.parse(session);
            this.token = token;
            await this.loadUserPreferences();
            this.showDesktop();
        }

        this.bindEvents();
        this.startClock();
        this.bindFullscreenEvents();
    }

    // API Helper
    async api(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = 'Bearer ' + this.token;
        }

        const response = await fetch('/api' + endpoint, {
            ...options,
            headers
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || 'Request failed');
        }

        return response.json();
    }

    async loadUserPreferences() {
        try {
            const prefs = await this.api('/preferences');
            if (prefs.theme) {
                this.darkMode = prefs.theme === 'dark';
                this.applyTheme();
            }
            if (prefs.wallpaperType) {
                this.wallpaperType = prefs.wallpaperType;
            }
            if (prefs.wallpaper) {
                this.wallpaper = prefs.wallpaper;
            }
            if (prefs.wallpaperColor) {
                this.wallpaperColor = prefs.wallpaperColor;
            }
            if (prefs.iconPositions) {
                this.iconPositions = prefs.iconPositions;
            }
            this.applyWallpaper();
            
            // Load wallpapers
            await this.loadSystemWallpapers();
            await this.loadUserWallpapers();
            
            // Load user profile from S3
            await this.loadUserProfile();
        } catch (error) {
            console.log('Could not load preferences:', error.message);
        }
    }
    
    async loadUserProfile() {
        try {
            const profile = await this.api('/profile');
            if (this.currentUser) {
                this.currentUser.displayName = profile.displayName || '';
                this.currentUser.title = profile.title || '';
                this.currentUser.organization = profile.organization || null;
            }
            // Update topbar with display name
            const currentUserEl = document.getElementById('current-user');
            if (currentUserEl && profile.displayName) {
                currentUserEl.textContent = profile.displayName;
            }
        } catch (error) {
            console.log('Could not load profile:', error.message);
        }
    }

    async loadSystemWallpapers() {
        try {
            this.systemWallpapers = await this.api('/wallpapers/system');
        } catch (error) {
            console.log('Could not load system wallpapers:', error.message);
            this.systemWallpapers = [];
        }
    }

    async savePreferences(updates) {
        try {
            await this.api('/preferences', {
                method: 'PUT',
                body: JSON.stringify(updates)
            });
        } catch (error) {
            console.log('Could not save preferences:', error.message);
        }
    }

    bindEvents() {
        document.getElementById("login-form").addEventListener("submit", (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Auth tab switching
        document.querySelectorAll(".auth-tab").forEach(tab => {
            tab.addEventListener("click", () => {
                document.querySelectorAll(".auth-tab").forEach(t => t.classList.remove("active"));
                tab.classList.add("active");
                
                const tabName = tab.dataset.tab;
                if (tabName === "login") {
                    document.getElementById("login-form").classList.remove("hidden");
                    document.getElementById("register-form").classList.add("hidden");
                } else {
                    document.getElementById("login-form").classList.add("hidden");
                    document.getElementById("register-form").classList.remove("hidden");
                }
            });
        });

        // Registration form
        document.getElementById("register-form").addEventListener("submit", (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Verification screen buttons
        document.getElementById("resend-btn").addEventListener("click", () => {
            this.resendVerificationEmail();
        });

        document.getElementById("back-to-login").addEventListener("click", () => {
            document.getElementById("verification-screen").classList.add("hidden");
            document.getElementById("login-form").classList.remove("hidden");
            document.querySelectorAll(".auth-tab").forEach(t => t.classList.remove("active"));
            document.querySelector('[data-tab="login"]').classList.add("active");
        });

        // Forgot password handlers
        document.getElementById("forgot-password-link").addEventListener("click", () => {
            document.getElementById("login-form").classList.add("hidden");
            document.getElementById("forgot-password-form").classList.remove("hidden");
            document.querySelectorAll(".auth-tab").forEach(t => t.classList.remove("active"));
        });

        document.getElementById("back-to-login-from-forgot").addEventListener("click", () => {
            document.getElementById("forgot-password-form").classList.add("hidden");
            document.getElementById("login-form").classList.remove("hidden");
            document.querySelectorAll(".auth-tab").forEach(t => t.classList.remove("active"));
            document.querySelector('[data-tab="login"]').classList.add("active");
            document.getElementById("forgot-error").textContent = "";
            document.getElementById("forgot-success").classList.add("hidden");
        });

        document.getElementById("forgot-password-form").addEventListener("submit", (e) => {
            e.preventDefault();
            this.handleForgotPassword();
        });

        // Handle URL params for verification result
        this.handleVerificationResult();

        document.getElementById("logout-btn").addEventListener("click", () => {
            this.handleLogout();
        });

        document.getElementById("settings-btn").addEventListener("click", () => {
            this.openApp("settings");
        });

        // Topbar fullscreen button
        document.getElementById("topbar-fullscreen").addEventListener("click", () => {
            this.toggleFullscreen();
        });
        
        // Topbar restore button
        document.getElementById("topbar-restore").addEventListener("click", () => {
            this.restoreMaximizedWindow();
        });
        
        // Desktop drop zone for camera snapshots
        const iconContainer = document.getElementById("icon-container");
        if (iconContainer) {
            iconContainer.addEventListener('dragover', (e) => {
                // Check if it's a camera snapshot
                if (e.dataTransfer.types.includes('application/x-camera-snapshot') ||
                    e.dataTransfer.types.includes('text/uri-list')) {
                    e.preventDefault();
                    iconContainer.classList.add('drag-over');
                }
            });
            
            iconContainer.addEventListener('dragleave', (e) => {
                if (!iconContainer.contains(e.relatedTarget)) {
                    iconContainer.classList.remove('drag-over');
                }
            });
            
            iconContainer.addEventListener('drop', (e) => {
                iconContainer.classList.remove('drag-over');
                const dataUrl = e.dataTransfer.getData('application/x-camera-snapshot') ||
                               e.dataTransfer.getData('text/uri-list') ||
                               e.dataTransfer.getData('text/plain');
                
                if (dataUrl && dataUrl.startsWith('data:image')) {
                    e.preventDefault();
                    // Create a desktop icon for the snapshot
                    this.createDesktopSnapshot(dataUrl, e.clientX, e.clientY);
                }
            });
        }
    }
    
    createDesktopSnapshot(dataUrl, x, y) {
        // Upload snapshot to Desktop folder in S3
        this.uploadSnapshotToDesktop(dataUrl);
    }

    bindFullscreenEvents() {
        document.addEventListener("fullscreenchange", () => {
            this.isFullscreen = !!document.fullscreenElement;
            this.updateFullscreenButton();
        });

        document.addEventListener("webkitfullscreenchange", () => {
            this.isFullscreen = !!document.webkitFullscreenElement;
            this.updateFullscreenButton();
        });
    }

    updateFullscreenButton() {
        const enterIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>';
        const exitIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3"/></svg>';
        
        // Update settings fullscreen button
        const settingsBtn = document.getElementById("fullscreen-toggle");
        if (settingsBtn) {
            settingsBtn.innerHTML = this.isFullscreen ? exitIcon : enterIcon;
            settingsBtn.title = this.isFullscreen ? "Exit Fullscreen" : "Fullscreen";
        }
        
        // Update topbar fullscreen button
        const topbarBtn = document.getElementById("topbar-fullscreen");
        if (topbarBtn) {
            topbarBtn.innerHTML = this.isFullscreen ? exitIcon : enterIcon;
            topbarBtn.title = this.isFullscreen ? "Exit Fullscreen" : "Fullscreen";
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
            }
            this.isFullscreen = true;
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
            this.isFullscreen = false;
        }
        this.updateFullscreenButton();
    }

    toggleTheme() {
        this.darkMode = !this.darkMode;
        localStorage.setItem("hovercam_theme", this.darkMode ? "dark" : "light");
        this.applyTheme();
        this.updateThemeToggle();
        this.savePreferences({ theme: this.darkMode ? "dark" : "light" });
    }

    applyTheme() {
        if (this.darkMode) {
            document.body.classList.remove("light-mode");
            document.body.classList.add("dark-mode");
        } else {
            document.body.classList.remove("dark-mode");
            document.body.classList.add("light-mode");
        }
    }

    showNotification(message, type = 'info') {
        // Remove existing notification if any
        const existing = document.querySelector('.desktop-notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = 'desktop-notification notification-' + type;
        
        const icons = {
            success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
            error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
            info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
        };
        
        notification.innerHTML = (icons[type] || icons.info) + '<span>' + message + '</span>';
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    updateThemeToggle() {
        const toggle = document.getElementById("theme-toggle");
        if (toggle) {
            toggle.classList.toggle("active", this.darkMode);
        }
    }

    applyWallpaper() {
        const desktopArea = document.getElementById("desktop-area");
        if (!desktopArea) return;

        if (this.wallpaperType === 'image' && this.wallpaper) {
            desktopArea.style.background = 'url(' + this.wallpaper + ') center/cover no-repeat';
        } else if (this.wallpaperType === 'gradient' && this.wallpaper) {
            const preset = this.gradientPresets.find(g => g.id === this.wallpaper);
            if (preset) {
                desktopArea.style.background = preset.gradient;
            }
        } else if (this.wallpaperType === 'color') {
            desktopArea.style.background = this.wallpaperColor;
        } else {
            // Default gradient
            desktopArea.style.background = this.gradientPresets[0].gradient;
        }
    }

    async setWallpaper(type, value) {
        this.wallpaperType = type;
        if (type === 'color') {
            this.wallpaperColor = value;
            this.wallpaper = null;
        } else {
            this.wallpaper = value;
        }
        this.applyWallpaper();
        await this.savePreferences({
            wallpaperType: type,
            wallpaper: type === 'color' ? null : value,
            wallpaperColor: type === 'color' ? value : this.wallpaperColor
        });
    }

    async handleLogin() {
        const email = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;
        const errorDiv = document.getElementById("login-error");
        const loginBtn = document.querySelector(".login-btn");

        if (!email || !password) {
            errorDiv.textContent = "Please enter email and password";
            return;
        }

        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span>Signing in...</span>';

        try {
            const response = await this.api('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            this.token = response.token;
            this.currentUser = response.user;
            
            localStorage.setItem("hovercam_token", this.token);
            localStorage.setItem("hovercam_session", JSON.stringify(this.currentUser));
            
            // Clean up old shared whiteboard data (from before user-specific storage)
            localStorage.removeItem('hovercam_whiteboard_canvas');
            localStorage.removeItem('hovercam_whiteboard_bgColor');
            localStorage.removeItem('hovercam_whiteboard_objects');
            
            errorDiv.textContent = "";
            await this.loadUserPreferences();
            this.showDesktop();
        } catch (error) {
            errorDiv.textContent = error.message || "Login failed";
        } finally {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<span>Sign In</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
        }
    }

    async handleRegister() {
        const username = document.getElementById("reg-username").value.trim();
        const email = document.getElementById("reg-email").value.trim();
        const password = document.getElementById("reg-password").value;
        const confirm = document.getElementById("reg-confirm").value;
        const errorDiv = document.getElementById("register-error");
        const registerBtn = document.querySelector(".register-btn");

        // Validation
        if (!username || !email || !password) {
            errorDiv.textContent = "All fields are required";
            return;
        }

        if (username.length < 3) {
            errorDiv.textContent = "Username must be at least 3 characters";
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errorDiv.textContent = "Please enter a valid email address";
            return;
        }

        if (password.length < 6) {
            errorDiv.textContent = "Password must be at least 6 characters";
            return;
        }

        if (password !== confirm) {
            errorDiv.textContent = "Passwords do not match";
            return;
        }

        registerBtn.disabled = true;
        registerBtn.innerHTML = '<span>Creating account...</span>';

        try {
            const response = await fetch("https://desktop.chacha.live/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password, email })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || "Registration failed");
            }

            // Registration successful - show verification screen
            if (data.requiresVerification) {
                this.pendingEmail = email;
                this.pendingUsername = username;
                this.showVerificationScreen(email);
            } else if (data.token) {
                // Direct login (if verification was disabled)
                this.token = data.token;
                this.currentUser = data.user;
                localStorage.setItem("hovercam_token", this.token);
                localStorage.setItem("hovercam_session", JSON.stringify(this.currentUser));
                localStorage.removeItem('hovercam_whiteboard_canvas');
                localStorage.removeItem('hovercam_whiteboard_bgColor');
                localStorage.removeItem('hovercam_whiteboard_objects');
                errorDiv.textContent = "";
                await this.loadUserPreferences();
                this.showDesktop();
                this.showNotification("Welcome to HoverCam Desktop, " + username + "!", "success");
            }
        } catch (error) {
            errorDiv.style.color = "";
            errorDiv.textContent = error.message || "Registration failed";
        } finally {
            registerBtn.disabled = false;
            registerBtn.innerHTML = '<span>Create Account</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>';
        }
    }

    showVerificationScreen(email) {
        document.getElementById("login-form").classList.add("hidden");
        document.getElementById("register-form").classList.add("hidden");
        document.getElementById("verification-screen").classList.remove("hidden");
        document.getElementById("verification-email").textContent = email;
        document.querySelectorAll(".auth-tab").forEach(t => t.classList.remove("active"));
        
        // Clear the form
        document.getElementById("reg-username").value = "";
        document.getElementById("reg-email").value = "";
        document.getElementById("reg-password").value = "";
        document.getElementById("reg-confirm").value = "";
        document.getElementById("register-error").textContent = "";
    }

    async resendVerificationEmail() {
        const resendBtn = document.getElementById("resend-btn");
        if (!this.pendingEmail || !this.pendingUsername) {
            this.showNotification("Please register again", "error");
            return;
        }

        resendBtn.disabled = true;
        resendBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg><span>Sending...</span>';

        try {
            const response = await fetch("https://desktop.chacha.live/api/auth/resend-verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: this.pendingEmail, username: this.pendingUsername })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || "Failed to resend");
            }

            this.showNotification("Verification email sent!", "success");
        } catch (error) {
            this.showNotification(error.message || "Failed to resend email", "error");
        } finally {
            resendBtn.disabled = false;
            resendBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg><span>Resend Verification Email</span>';
        }
    }

    handleVerificationResult() {
        const urlParams = new URLSearchParams(window.location.search);
        const verified = urlParams.get('verified');
        const error = urlParams.get('error');
        const loginContainer = document.querySelector('.login-container');
        
        // Clear URL params
        if (verified || error) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        
        if (verified === 'true') {
            // Show success message
            const alert = document.createElement('div');
            alert.className = 'auth-alert success';
            alert.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                    <path d="M22 4L12 14.01l-3-3"/>
                </svg>
                <span>Email verified! You can now sign in.</span>
            `;
            loginContainer.insertBefore(alert, loginContainer.querySelector('.auth-tabs'));
            setTimeout(() => alert.remove(), 8000);
        } else if (error) {
            const messages = {
                'invalid_token': 'Invalid verification link. Please register again.',
                'token_expired': 'Verification link has expired. Please register again.',
                'user_not_found': 'Account not found. Please register again.'
            };
            const message = messages[error] || 'Verification failed. Please try again.';
            
            const alert = document.createElement('div');
            alert.className = 'auth-alert error';
            alert.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                <span>${message}</span>
            `;
            loginContainer.insertBefore(alert, loginContainer.querySelector('.auth-tabs'));
            setTimeout(() => alert.remove(), 8000);
        }
    }

    async handleForgotPassword() {
        const email = document.getElementById("forgot-email").value.trim();
        const errorDiv = document.getElementById("forgot-error");
        const successDiv = document.getElementById("forgot-success");
        const submitBtn = document.querySelector("#forgot-password-form .login-btn");

        errorDiv.textContent = "";
        successDiv.classList.add("hidden");

        if (!email) {
            errorDiv.textContent = "Please enter your email address";
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errorDiv.textContent = "Please enter a valid email address";
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Sending...</span>';

        try {
            const response = await fetch("https://desktop.chacha.live/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to send reset email");
            }

            // Show success message
            successDiv.textContent = "If an account exists with this email, you'll receive a password reset link shortly.";
            successDiv.classList.remove("hidden");
            document.getElementById("forgot-email").value = "";
        } catch (error) {
            errorDiv.textContent = error.message || "Failed to send reset email";
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Send Reset Link</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>';
        }
    }

    handleLogout() {
        localStorage.removeItem("hovercam_session");
        localStorage.removeItem("hovercam_token");
        this.currentUser = null;
        this.token = null;
        this.windows.clear();
        document.getElementById("windows-container").innerHTML = "";
        document.getElementById("taskbar-apps").innerHTML = "";
        document.getElementById("desktop").classList.add("hidden");
        document.getElementById("login-screen").classList.remove("hidden");
        document.getElementById("username").value = "";
        document.getElementById("password").value = "";
    }

    showDesktop() {
        document.getElementById("login-screen").classList.add("hidden");
        document.getElementById("desktop").classList.remove("hidden");
        document.getElementById("current-user").textContent = this.currentUser.displayName || this.currentUser.username;
        
        // Refresh apps list to include admin apps if user is super admin
        this.apps = this.defineApps();
        
        this.renderTaskbar();
        this.renderDesktopIcons();
        this.applyWallpaper();
        this.setupDesktopDropZone();
        
        setTimeout(() => this.openApp("welcome"), 300);
    }
    
    setupDesktopDropZone() {
        const desktop = document.getElementById("desktop-icons");
        const self = this;
        
        desktop.addEventListener('dragover', (e) => {
            // Check if it's a file from the Files app, camera snapshot, or external file
            const types = Array.from(e.dataTransfer.types);
            
            if (types.includes('application/hovercam-file') ||
                types.includes('application/x-camera-snapshot') ||
                types.includes('text/uri-list') ||
                types.includes('Files')) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                desktop.classList.add('drop-target');
            }
        });
        
        desktop.addEventListener('dragleave', (e) => {
            if (!desktop.contains(e.relatedTarget)) {
                desktop.classList.remove('drop-target');
            }
        });
        
        desktop.addEventListener('drop', async (e) => {
            e.preventDefault();
            desktop.classList.remove('drop-target');
            
            // Handle files from Files app
            const hovercamFile = e.dataTransfer.getData('application/hovercam-file');
            
            if (hovercamFile) {
                try {
                    const fileData = JSON.parse(hovercamFile);
                    
                    // Only move if not already on desktop
                    if (fileData.source !== 'desktop') {
                        // Check if file is from shared folder (key starts with 'shared/')
                        const isFromShared = fileData.key.startsWith('shared/');
                        const endpoint = isFromShared ? '/shared/copy-to-user' : '/files/move';
                        
                        const response = await self.api(endpoint, {
                            method: 'POST',
                            body: JSON.stringify({
                                sourceKey: fileData.key,
                                destinationFolder: 'Desktop'
                            })
                        });
                        
                        // Refresh desktop icons
                        await self.renderDesktopIcons();
                        
                        // Refresh any open Files window
                        const filesWindow = document.querySelector('.window[id^="files"]');
                        if (filesWindow) {
                            const refreshEvent = new CustomEvent('refreshFiles');
                            filesWindow.dispatchEvent(refreshEvent);
                        }
                        
                        self.showNotification('Copied to Desktop: ' + fileData.name, 'success');
                    }
                } catch (err) {
                    console.error('Failed to move file to desktop:', err);
                    self.showNotification('Failed to move file', 'error');
                }
                return;
            }
            
            // Handle external file drops (from computer)
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                e.preventDefault();
                for (const file of e.dataTransfer.files) {
                    const isImage = file.type.startsWith('image/');
                    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
                    
                    if (isImage || isPDF) {
                        try {
                            const formData = new FormData();
                            formData.append('file', file);
                            
                            const uploadResponse = await fetch('/api/files/upload?folder=Desktop', {
                                method: 'POST',
                                headers: {
                                    'Authorization': 'Bearer ' + self.token
                                },
                                body: formData
                            });
                            
                            if (!uploadResponse.ok) {
                                throw new Error('Upload failed');
                            }
                            
                            self.showNotification('Uploaded: ' + file.name, 'success');
                        } catch (err) {
                            console.error('Failed to upload file:', err);
                            self.showNotification('Failed to upload: ' + file.name, 'error');
                        }
                    } else {
                        self.showNotification('Only images and PDFs are supported', 'error');
                    }
                }
                // Refresh desktop icons after all uploads
                await self.renderDesktopIcons();
                return;
            }
            
            // Handle camera snapshots
            const dataUrl = e.dataTransfer.getData('application/x-camera-snapshot') ||
                           e.dataTransfer.getData('text/uri-list') ||
                           e.dataTransfer.getData('text/plain');
            
            if (dataUrl && dataUrl.startsWith('data:image')) {
                e.preventDefault();
                await self.uploadSnapshotToDesktop(dataUrl);
            }
        });
    }
    
    async uploadSnapshotToDesktop(dataUrl) {
        try {
            // Convert data URL to blob
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const filename = 'snapshot-' + Date.now() + '.jpg';
            
            // Create FormData for upload
            const formData = new FormData();
            formData.append('file', blob, filename);
            
            // Upload to Desktop folder
            const uploadResponse = await fetch('/api/files/upload?folder=Desktop', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + this.token
                },
                body: formData
            });
            
            if (!uploadResponse.ok) {
                throw new Error('Upload failed');
            }
            
            // Refresh desktop icons
            await this.renderDesktopIcons();
            this.showNotification('Snapshot saved to Desktop', 'success');
        } catch (err) {
            console.error('Failed to save snapshot to desktop:', err);
            this.showNotification('Failed to save snapshot', 'error');
        }
    }

    renderTaskbar() {
        const container = document.getElementById("taskbar-apps");
        container.innerHTML = this.apps.map(app => 
            '<button class="taskbar-app" data-app="' + app.id + '" title="' + app.name + '">' + app.icon + '</button>'
        ).join("");

        container.querySelectorAll(".taskbar-app").forEach(btn => {
            btn.addEventListener("click", () => {
                const appId = btn.dataset.app;
                if (this.windows.has(appId)) {
                    const win = this.windows.get(appId);
                    // If maximized, restore to windowed mode
                    if (win.element.classList.contains("maximized")) {
                        this.maximizeWindow(appId);
                    } else if (win.minimized) {
                        this.focusWindow(appId);
                    } else {
                        // Already open and visible - minimize it
                        this.minimizeWindow(appId);
                    }
                } else {
                    this.openApp(appId);
                }
            });
        });
    }

    async renderDesktopIcons() {
        const container = document.getElementById("desktop-icons");
        container.innerHTML = "";
        
        let iconIndex = 0;
        
        // Render app icons
        this.apps.forEach((app) => {
            const icon = document.createElement("div");
            icon.className = "desktop-icon";
            icon.dataset.app = app.id;
            icon.innerHTML = 
                '<div class="desktop-icon-img">' + app.icon + '</div>' +
                '<span class="desktop-icon-label">' + app.name + '</span>';
            
            // Apply saved position or default grid position
            const savedPos = this.iconPositions[app.id];
            if (savedPos) {
                icon.style.position = "absolute";
                icon.style.left = savedPos.x + "px";
                icon.style.top = savedPos.y + "px";
            } else {
                // Default grid layout
                const col = Math.floor(iconIndex / 5);
                const row = iconIndex % 5;
                icon.style.position = "absolute";
                icon.style.left = (24 + col * 100) + "px";
                icon.style.top = (24 + row * 100) + "px";
            }
            
            container.appendChild(icon);
            this.makeIconDraggable(icon);
            
            // Double-click to open app
            icon.addEventListener("dblclick", (e) => {
                e.preventDefault();
                this.openApp(app.id);
            });
            
            iconIndex++;
        });
        
        // Load and render desktop files
        await this.loadDesktopFiles(container, iconIndex);
    }
    
    async loadDesktopFiles(container, startIndex) {
        try {
            const response = await this.api('/desktop');
            const items = response.items || [];
            
            items.forEach((item, i) => {
                const iconIndex = startIndex + i;
                const icon = document.createElement("div");
                icon.className = "desktop-icon desktop-file";
                icon.dataset.file = item.key;
                icon.dataset.name = item.name;
                
                const isImage = item.type === 'image';
                const isPDF = item.name.toLowerCase().endsWith('.pdf');
                let iconSvg;
                if (isImage) {
                    iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>';
                } else if (isPDF) {
                    iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><text x="7" y="17" font-size="6" fill="#ef4444" stroke="none" font-weight="bold">PDF</text></svg>';
                } else {
                    iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
                }
                
                icon.innerHTML = 
                    '<div class="desktop-icon-img file-icon-img">' + iconSvg + '</div>' +
                    '<span class="desktop-icon-label">' + item.name + '</span>';
                
                // Apply saved position or default grid position
                const savedPos = this.iconPositions['file_' + item.name];
                if (savedPos) {
                    icon.style.position = "absolute";
                    icon.style.left = savedPos.x + "px";
                    icon.style.top = savedPos.y + "px";
                } else {
                    const col = Math.floor(iconIndex / 5);
                    const row = iconIndex % 5;
                    icon.style.position = "absolute";
                    icon.style.left = (24 + col * 100) + "px";
                    icon.style.top = (24 + row * 100) + "px";
                }
                
                container.appendChild(icon);
                
                // Use native drag API for file transfers
                icon.setAttribute('draggable', 'true');
                
                let dragStartPos = null;
                
                icon.addEventListener('dragstart', (e) => {
                    dragStartPos = { x: icon.offsetLeft, y: icon.offsetTop };
                    e.dataTransfer.setData('application/hovercam-file', JSON.stringify({
                        key: item.key,
                        name: item.name,
                        type: item.type,
                        source: 'desktop'
                    }));
                    e.dataTransfer.effectAllowed = 'move';
                    icon.classList.add('dragging-file');
                    
                    // Create drag image
                    const dragImage = icon.cloneNode(true);
                    dragImage.style.position = 'absolute';
                    dragImage.style.top = '-1000px';
                    document.body.appendChild(dragImage);
                    e.dataTransfer.setDragImage(dragImage, 40, 40);
                    setTimeout(() => dragImage.remove(), 0);
                });
                
                icon.addEventListener('dragend', (e) => {
                    icon.classList.remove('dragging-file');
                    
                    // If dropped on desktop (not in a valid drop target), reposition the icon
                    if (e.dataTransfer.dropEffect === 'none' && dragStartPos) {
                        // Calculate new position based on where it was dropped
                        const desktop = document.getElementById('desktop-icons');
                        const rect = desktop.getBoundingClientRect();
                        let newX = e.clientX - rect.left - 40;
                        let newY = e.clientY - rect.top - 40;
                        
                        // Constrain to desktop bounds
                        newX = Math.max(0, Math.min(newX, rect.width - 80));
                        newY = Math.max(0, Math.min(newY, rect.height - 80));
                        
                        icon.style.left = newX + 'px';
                        icon.style.top = newY + 'px';
                        
                        // Save position
                        const iconId = 'file_' + item.name;
                        this.iconPositions[iconId] = { x: newX, y: newY };
                        this.saveIconPositions();
                    }
                    dragStartPos = null;
                });
                
                // Double-click to open file
                icon.addEventListener("dblclick", async (e) => {
                    e.preventDefault();
                    await this.openDesktopFile(item);
                });
            });
        } catch (error) {
            console.error('Failed to load desktop files:', error);
        }
    }
    
    async openDesktopFile(item) {
        try {
            // Get signed URL for the file
            const response = await this.api('/files/url?path=' + encodeURIComponent(item.path));
            const url = response.url;
            
            if (item.type === 'image') {
                // Open image in a viewer window
                this.openImageViewer(item.name, url);
            } else if (item.name.toLowerCase().endsWith('.pdf')) {
                // Open PDF in viewer window
                this.openPDFViewer(item.name, url);
            } else if (item.name.toLowerCase().endsWith('.html') || item.name.toLowerCase().endsWith('.htm')) {
                // Open HTML files in the ChaCha browser
                this.openBrowserWithUrl(url);
            } else {
                // Download other files
                window.open(url, '_blank');
            }
        } catch (error) {
            console.error('Failed to open file:', error);
        }
    }
    
    openImageViewer(name, url) {
        const windowId = 'imageviewer-' + Date.now();
        const container = document.getElementById("windows-container");
        
        const offset = this.windows.size * 30;
        const left = 150 + offset;
        const top = 80 + offset;

        const windowEl = document.createElement("div");
        windowEl.className = "window";
        windowEl.id = windowId;
        windowEl.style.cssText = 
            "left: " + left + "px; " +
            "top: " + top + "px; " +
            "width: 800px; " +
            "height: 600px; " +
            "z-index: " + (++this.windowZIndex) + ";";

        windowEl.innerHTML = 
            '<div class="window-header">' +
                '<div class="window-title">🖼️<span>' + name + '</span></div>' +
                '<div class="window-controls">' +
                    '<button class="window-control minimize" title="Minimize">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
                    '</button>' +
                    '<button class="window-control maximize" title="Maximize">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>' +
                    '</button>' +
                    '<button class="window-control close" title="Close">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
                    '</button>' +
                '</div>' +
            '</div>' +
            '<div class="window-content" style="display: flex; flex-direction: column; padding: 0; overflow: hidden;">' +
                '<div class="image-viewer-toolbar" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--bg-secondary); border-bottom: 1px solid var(--border-color);">' +
                    '<button class="zoom-btn" data-action="zoom-out" title="Zoom Out" style="padding: 4px 8px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-primary); color: var(--text-primary); cursor: pointer; font-size: 16px;">−</button>' +
                    '<span class="zoom-level" style="min-width: 60px; text-align: center; font-size: 14px; color: var(--text-primary);">100%</span>' +
                    '<button class="zoom-btn" data-action="zoom-in" title="Zoom In" style="padding: 4px 8px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-primary); color: var(--text-primary); cursor: pointer; font-size: 16px;">+</button>' +
                    '<button class="zoom-btn" data-action="zoom-fit" title="Fit to Window" style="padding: 4px 8px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-primary); color: var(--text-primary); cursor: pointer; font-size: 12px;">Fit</button>' +
                    '<button class="zoom-btn" data-action="zoom-actual" title="Actual Size" style="padding: 4px 8px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-primary); color: var(--text-primary); cursor: pointer; font-size: 12px;">100%</button>' +
                '</div>' +
                '<div class="image-viewer-container" style="flex: 1; overflow: auto; display: flex; align-items: center; justify-content: center; background: var(--bg-tertiary, #1a1a2e);">' +
                    '<img class="viewer-image" src="" alt="' + name + '" style="transform-origin: center; transition: transform 0.1s ease;">' +
                '</div>' +
            '</div>' +
            '<div class="window-resize"></div>';

        container.appendChild(windowEl);
        this.windows.set(windowId, { element: windowEl, minimized: false });
        this.bindWindowEvents(windowEl, windowId);
        
        // Initialize image viewer
        this.initImageViewer(windowEl, url);
    }
    
    initImageViewer(windowEl, url) {
        const img = windowEl.querySelector('.viewer-image');
        const zoomDisplay = windowEl.querySelector('.zoom-level');
        const imageContainer = windowEl.querySelector('.image-viewer-container');
        let currentZoom = 100;
        
        // Load image and determine initial zoom
        img.onload = () => {
            const naturalWidth = img.naturalWidth;
            const naturalHeight = img.naturalHeight;
            
            // If image is larger than 2000px in any direction, start at 50%
            if (naturalWidth > 2000 || naturalHeight > 2000) {
                currentZoom = 50;
            } else {
                currentZoom = 100;
            }
            
            updateZoom();
        };
        
        img.src = url;
        
        const updateZoom = () => {
            img.style.transform = 'scale(' + (currentZoom / 100) + ')';
            zoomDisplay.textContent = currentZoom + '%';
        };
        
        // Zoom button handlers
        windowEl.querySelectorAll('.zoom-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.dataset.action;
                
                switch (action) {
                    case 'zoom-in':
                        currentZoom = Math.min(currentZoom + 25, 500);
                        break;
                    case 'zoom-out':
                        currentZoom = Math.max(currentZoom - 25, 25);
                        break;
                    case 'zoom-fit':
                        // Calculate fit zoom
                        const containerRect = imageContainer.getBoundingClientRect();
                        const scaleX = (containerRect.width - 40) / img.naturalWidth;
                        const scaleY = (containerRect.height - 40) / img.naturalHeight;
                        currentZoom = Math.round(Math.min(scaleX, scaleY) * 100);
                        currentZoom = Math.max(25, Math.min(currentZoom, 100));
                        break;
                    case 'zoom-actual':
                        currentZoom = 100;
                        break;
                }
                
                updateZoom();
            });
            
            // Hover effect
            btn.addEventListener('mouseenter', () => {
                btn.style.background = 'var(--bg-hover, #333)';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.background = 'var(--bg-primary)';
            });
        });
        
        // Mouse wheel zoom
        imageContainer.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY < 0) {
                currentZoom = Math.min(currentZoom + 10, 500);
            } else {
                currentZoom = Math.max(currentZoom - 10, 25);
            }
            updateZoom();
        });
    }
    
    openPDFViewer(name, url) {
        const windowId = 'pdfviewer-' + Date.now();
        const container = document.getElementById("windows-container");
        
        const offset = this.windows.size * 30;
        const left = 100 + offset;
        const top = 50 + offset;

        const windowEl = document.createElement("div");
        windowEl.className = "window";
        windowEl.id = windowId;
        windowEl.style.cssText = 
            "left: " + left + "px; " +
            "top: " + top + "px; " +
            "width: 900px; " +
            "height: 700px; " +
            "z-index: " + (++this.windowZIndex) + ";";

        windowEl.innerHTML = 
            '<div class="window-header">' +
                '<div class="window-title">📄<span>' + name + '</span></div>' +
                '<div class="window-controls">' +
                    '<button class="window-control minimize" title="Minimize">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
                    '</button>' +
                    '<button class="window-control maximize" title="Maximize">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>' +
                    '</button>' +
                    '<button class="window-control close" title="Close">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
                    '</button>' +
                '</div>' +
            '</div>' +
            '<div class="window-content" style="padding: 0; overflow: hidden;">' +
                '<iframe class="pdf-viewer-frame" src="' + url + '" style="width: 100%; height: 100%; border: none;"></iframe>' +
            '</div>' +
            '<div class="window-resize"></div>';

        container.appendChild(windowEl);
        this.windows.set(windowId, { element: windowEl, minimized: false });
        this.bindWindowEvents(windowEl, windowId);
    }

    openBrowserWithUrl(url) {
        // Check if browser window already exists
        if (this.windows.has('browser')) {
            const win = this.windows.get('browser');
            win.element.classList.remove('minimized');
            win.element.style.zIndex = ++this.windowZIndex;
            win.minimized = false;
            // Navigate to the URL in the existing browser
            const iframe = win.element.querySelector('.browser-iframe');
            const urlInput = win.element.querySelector('.browser-url-input');
            const homepageContainer = win.element.querySelector('.browser-homepage-container');
            if (iframe) {
                iframe.classList.remove('hidden');
                iframe.src = url;
            }
            if (homepageContainer) {
                homepageContainer.classList.add('hidden');
            }
            if (urlInput) {
                urlInput.value = url;
            }
        } else {
            // Open browser app first
            this.openApp('browser');
            // Wait a bit for the browser to initialize, then navigate
            setTimeout(() => {
                if (this.windows.has('browser')) {
                    const win = this.windows.get('browser');
                    const iframe = win.element.querySelector('.browser-iframe');
                    const urlInput = win.element.querySelector('.browser-url-input');
                    const homepageContainer = win.element.querySelector('.browser-homepage-container');
                    if (iframe) {
                        iframe.classList.remove('hidden');
                        iframe.src = url;
                    }
                    if (homepageContainer) {
                        homepageContainer.classList.add('hidden');
                    }
                    if (urlInput) {
                        urlInput.value = url;
                    }
                }
            }, 300);
        }
    }

        makeIconDraggable(icon, customId = null) {
        let isDragging = false;
        let hasMoved = false;
        let startX, startY, startLeft, startTop;
        let clickTimeout;

        const onMouseDown = (e) => {
            if (e.button !== 0) return; // Only left click
            
            isDragging = true;
            hasMoved = false;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = icon.offsetLeft;
            startTop = icon.offsetTop;
            
            icon.classList.add("dragging");
            icon.style.zIndex = "100";
            
            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
            
            e.preventDefault();
        };

        const onMouseMove = (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            // Only consider it a drag if moved more than 5px
            if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
                hasMoved = true;
            }
            
            const container = document.getElementById("desktop-icons");
            const containerRect = container.getBoundingClientRect();
            
            let newLeft = startLeft + deltaX;
            let newTop = startTop + deltaY;
            
            // Constrain to container bounds
            newLeft = Math.max(0, Math.min(newLeft, containerRect.width - icon.offsetWidth));
            newTop = Math.max(0, Math.min(newTop, containerRect.height - icon.offsetHeight));
            
            icon.style.left = newLeft + "px";
            icon.style.top = newTop + "px";
        };

        const onMouseUp = (e) => {
            if (!isDragging) return;
            
            isDragging = false;
            icon.classList.remove("dragging");
            icon.style.zIndex = "";
            
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
            
            // Save position if moved
            if (hasMoved) {
                const iconId = customId || icon.dataset.app;
                this.iconPositions[iconId] = {
                    x: icon.offsetLeft,
                    y: icon.offsetTop
                };
                this.saveIconPositions();
            }
        };

        icon.addEventListener("mousedown", onMouseDown);
    }

    async saveIconPositions() {
        try {
            await this.api('/preferences', {
                method: 'PUT',
                body: JSON.stringify({ iconPositions: this.iconPositions })
            });
        } catch (error) {
            console.log('Could not save icon positions:', error.message);
        }
    }

    openApp(appId) {
        if (this.windows.has(appId)) {
            this.focusWindow(appId);
            return;
        }

        const app = this.apps.find(a => a.id === appId);
        if (!app) return;

        const windowId = "window-" + appId;
        const container = document.getElementById("windows-container");
        
        const offset = this.windows.size * 30;
        const left = 100 + offset;
        const top = 50 + offset;

        const windowEl = document.createElement("div");
        windowEl.className = "window";
        windowEl.id = windowId;
        windowEl.style.cssText = 
            "left: " + left + "px; " +
            "top: " + top + "px; " +
            "width: " + app.defaultSize.width + "px; " +
            "height: " + app.defaultSize.height + "px; " +
            "z-index: " + (++this.windowZIndex) + ";";

        windowEl.innerHTML = 
            '<div class="window-header">' +
                '<div class="window-title">' + app.icon + '<span>' + app.name + '</span></div>' +
                '<div class="window-controls">' +
                    '<button class="window-control minimize" title="Minimize">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
                    '</button>' +
                    '<button class="window-control maximize" title="Maximize">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>' +
                    '</button>' +
                    '<button class="window-control close" title="Close">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
                    '</button>' +
                '</div>' +
            '</div>' +
            '<div class="window-content">' + app.content() + '</div>' +
            '<div class="window-resize"></div>';

        container.appendChild(windowEl);
        this.windows.set(appId, { element: windowEl, minimized: false });
        
        this.updateTaskbarActive(appId, true);
        this.bindWindowEvents(windowEl, appId);

        if (appId === "settings") {
            this.bindSettingsEvents(windowEl);
        }
        
        if (appId === "whiteboard") {
            // Small delay to ensure DOM is ready
            setTimeout(() => this.initWhiteboard(windowEl), 50);
        }
        
        if (appId === "browser") {
            setTimeout(() => this.initBrowser(windowEl), 50);
        }
        
        if (appId === "files") {
            setTimeout(() => this.initFiles(windowEl), 50);
        }
        
        if (appId === "camera") {
            setTimeout(() => this.initCamera(windowEl), 50);
        }
        
        if (appId === "usermanager") {
            setTimeout(() => this.initUserManager(windowEl), 50);
        }
        
        if (appId === "terminal") {
            setTimeout(() => this.initTerminal(windowEl), 50);
        }
        
        if (appId === "aisettings") {
            setTimeout(() => this.initAISettings(windowEl), 50);
        }
        
        if (appId === "welcomeeditor") {
            setTimeout(() => this.initWelcomeEditor(windowEl), 50);
        }
        
        if (appId === "lessonplanner") {
            setTimeout(() => this.initLessonPlanner(windowEl), 50);
        }
        
        if (appId === "shoutouts") {
            setTimeout(() => this.initShoutouts(windowEl), 50);
        }
        
        if (appId === "printquizzes") {
            setTimeout(() => this.initPrintQuizzes(windowEl), 50);
        }
    }

    bindSettingsEvents(windowEl) {
        // Category collapse/expand
        windowEl.querySelectorAll(".category-header").forEach(header => {
            header.addEventListener("click", () => {
                const category = header.closest(".settings-category");
                const content = category.querySelector(".category-content");
                content.classList.toggle("expanded");
                category.classList.toggle("collapsed");
            });
        });

        // Theme toggle
        const themeToggle = windowEl.querySelector("#theme-toggle");
        if (themeToggle) {
            themeToggle.addEventListener("click", () => this.toggleTheme());
        }

        // Fullscreen toggle
        const fullscreenToggle = windowEl.querySelector("#fullscreen-toggle");
        if (fullscreenToggle) {
            fullscreenToggle.addEventListener("click", () => this.toggleFullscreen());
        }

        // System wallpapers
        this.renderSystemWallpapers(windowEl);

        // Gradient wallpaper selection
        windowEl.querySelectorAll(".gradient-option").forEach(option => {
            option.addEventListener("click", () => {
                this.clearWallpaperSelections(windowEl);
                option.classList.add("selected");
                this.setWallpaper("gradient", option.dataset.gradientId);
            });
        });

        // Color picker
        const colorPicker = windowEl.querySelector("#wallpaper-color");
        if (colorPicker) {
            colorPicker.addEventListener("change", (e) => {
                this.clearWallpaperSelections(windowEl);
                this.setWallpaper("color", e.target.value);
            });
        }

        // File upload
        const uploadInput = windowEl.querySelector("#wallpaper-upload");
        const uploadBtn = windowEl.querySelector("#upload-wallpaper-btn");
        if (uploadBtn && uploadInput) {
            uploadBtn.addEventListener("click", () => uploadInput.click());
            uploadInput.addEventListener("change", (e) => this.handleWallpaperUpload(e));
        }

        // Render user wallpapers
        this.refreshWallpaperGrid();
        
        // Profile save handler
        const saveProfileBtn = windowEl.querySelector('#save-profile-btn');
        const self = this;
        if (saveProfileBtn) {
            saveProfileBtn.addEventListener('click', async () => {
                const nameInput = windowEl.querySelector('#profile-name');
                const titleInput = windowEl.querySelector('#profile-title');
                
                const displayName = nameInput?.value?.trim() || '';
                const title = titleInput?.value?.trim() || '';
                
                saveProfileBtn.disabled = true;
                saveProfileBtn.textContent = 'Saving...';
                
                try {
                    await self.api('/profile', {
                        method: 'PUT',
                        body: JSON.stringify({ displayName, title })
                    });
                    
                    // Update local user data (in-memory only, DB is source of truth)
                    if (self.currentUser) {
                        self.currentUser.displayName = displayName;
                        self.currentUser.title = title;
                    }
                    
                    // Update UI
                    const userInfo = windowEl.querySelector('.user-info');
                    if (userInfo) {
                        userInfo.querySelector('.user-name').textContent = displayName || self.currentUser?.username || 'User';
                        userInfo.querySelector('.user-role').textContent = title || 'User';
                    }
                    
                    // Update avatar initial
                    const avatar = windowEl.querySelector('.user-avatar');
                    if (avatar && displayName) {
                        avatar.textContent = displayName.charAt(0).toUpperCase();
                    }
                    
                    // Update topbar
                    const currentUserEl = document.getElementById('current-user');
                    if (currentUserEl) {
                        currentUserEl.textContent = displayName || self.currentUser?.username || 'User';
                    }
                    
                    self.showNotification('Profile saved successfully', 'success');
                    saveProfileBtn.textContent = 'Saved!';
                    setTimeout(() => {
                        saveProfileBtn.textContent = 'Save Profile';
                        saveProfileBtn.disabled = false;
                    }, 2000);
                } catch (error) {
                    console.error('Failed to save profile:', error);
                    self.showNotification('Failed to save profile', 'error');
                    saveProfileBtn.textContent = 'Save Profile';
                    saveProfileBtn.disabled = false;
                }
            });
        }
    }

    clearWallpaperSelections(windowEl) {
        windowEl.querySelectorAll(".gradient-option").forEach(o => o.classList.remove("selected"));
        windowEl.querySelectorAll(".system-wallpaper").forEach(o => o.classList.remove("selected"));
        windowEl.querySelectorAll(".wallpaper-thumb").forEach(o => o.classList.remove("selected"));
    }

    renderSystemWallpapers(windowEl) {
        const grid = windowEl.querySelector("#system-wallpapers-grid");
        if (!grid) return;

        if (this.systemWallpapers.length === 0) {
            grid.innerHTML = '<p class="no-wallpapers">No system wallpapers available</p>';
            return;
        }

        grid.innerHTML = this.systemWallpapers.map(wp => 
            '<div class="system-wallpaper' + (this.wallpaper === wp.url ? ' selected' : '') + '" data-url="' + wp.url + '" data-id="' + wp.id + '" style="background-image: url(' + wp.url + ')" title="' + wp.name + '"></div>'
        ).join("");

        grid.querySelectorAll(".system-wallpaper").forEach(thumb => {
            thumb.addEventListener("click", () => {
                this.clearWallpaperSelections(windowEl);
                thumb.classList.add("selected");
                this.setWallpaper("image", thumb.dataset.url);
            });
        });
    }

    async handleWallpaperUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('wallpaper', file);

        try {
            const response = await fetch('/api/wallpapers/upload', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + this.token
                },
                body: formData
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            this.setWallpaper('image', data.url);
            
            // Refresh user wallpapers
            await this.loadUserWallpapers();
            this.refreshWallpaperGrid();
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload wallpaper');
        }
    }

    async loadUserWallpapers() {
        try {
            this.userWallpapers = await this.api('/wallpapers/user');
        } catch (error) {
            console.log('Could not load user wallpapers');
            this.userWallpapers = [];
        }
    }

    refreshWallpaperGrid() {
        const grid = document.querySelector(".user-wallpapers-grid");
        if (!grid) return;

        const windowEl = grid.closest(".window");

        if (this.userWallpapers.length === 0) {
            grid.innerHTML = '<p class="no-wallpapers">No custom wallpapers yet. Upload one above!</p>';
        } else {
            grid.innerHTML = this.userWallpapers.map(wp => 
                '<div class="wallpaper-thumb' + (this.wallpaper === wp.url ? ' selected' : '') + '" data-url="' + wp.url + '" style="background-image: url(' + wp.url + ')"></div>'
            ).join("");

            grid.querySelectorAll(".wallpaper-thumb").forEach(thumb => {
                thumb.addEventListener("click", () => {
                    if (windowEl) this.clearWallpaperSelections(windowEl);
                    thumb.classList.add("selected");
                    this.setWallpaper("image", thumb.dataset.url);
                });
            });
        }
    }

    bindWindowEvents(windowEl, appId) {
        const header = windowEl.querySelector(".window-header");
        const closeBtn = windowEl.querySelector(".window-control.close");
        const minBtn = windowEl.querySelector(".window-control.minimize");
        const maxBtn = windowEl.querySelector(".window-control.maximize");
        const resizer = windowEl.querySelector(".window-resize");

        windowEl.addEventListener("mousedown", () => this.focusWindow(appId));
        closeBtn.addEventListener("click", (e) => { e.stopPropagation(); this.closeWindow(appId); });
        minBtn.addEventListener("click", (e) => { e.stopPropagation(); this.minimizeWindow(appId); });
        maxBtn.addEventListener("click", (e) => { e.stopPropagation(); this.maximizeWindow(appId); });

        this.makeDraggable(windowEl, header);
        this.makeResizable(windowEl, resizer);
    }

    makeDraggable(windowEl, handle) {
        let isDragging = false;
        let startX, startY, startLeft, startTop;

        handle.addEventListener("mousedown", (e) => {
            if (windowEl.classList.contains("maximized")) return;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = windowEl.offsetLeft;
            startTop = windowEl.offsetTop;
            document.body.style.userSelect = "none";
        });

        document.addEventListener("mousemove", (e) => {
            if (!isDragging) return;
            windowEl.style.left = (startLeft + e.clientX - startX) + "px";
            windowEl.style.top = (startTop + e.clientY - startY) + "px";
        });

        document.addEventListener("mouseup", () => {
            isDragging = false;
            document.body.style.userSelect = "";
        });
    }

    makeResizable(windowEl, handle) {
        let isResizing = false;
        let startX, startY, startWidth, startHeight;

        handle.addEventListener("mousedown", (e) => {
            if (windowEl.classList.contains("maximized")) return;
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = windowEl.offsetWidth;
            startHeight = windowEl.offsetHeight;
            document.body.style.userSelect = "none";
            e.stopPropagation();
        });

        document.addEventListener("mousemove", (e) => {
            if (!isResizing) return;
            windowEl.style.width = Math.max(400, startWidth + e.clientX - startX) + "px";
            windowEl.style.height = Math.max(300, startHeight + e.clientY - startY) + "px";
        });

        document.addEventListener("mouseup", () => {
            isResizing = false;
            document.body.style.userSelect = "";
        });
    }

    focusWindow(appId) {
        const win = this.windows.get(appId);
        if (!win) return;
        
        if (win.minimized) {
            win.element.classList.remove("minimized");
            win.minimized = false;
        }
        
        // Always bring to front with a new z-index (unless another window is always-on-top)
        this.windowZIndex++;
        win.element.style.zIndex = win.element.classList.contains('always-on-top') ? '99999' : this.windowZIndex;
        
        // Re-apply z-index to any always-on-top windows so they stay on top
        this.windows.forEach((w) => {
            if (w.element.classList.contains('always-on-top')) {
                w.element.style.zIndex = '99999';
            }
        });
        
        const app = this.apps.find(a => a.id === appId);
        document.getElementById("topbar-title").textContent = app ? app.name : "Desktop";
    }

    closeWindow(appId) {
        const win = this.windows.get(appId);
        if (!win) return;
        win.element.remove();
        this.windows.delete(appId);
        this.updateTaskbarActive(appId, false);
        document.getElementById("topbar-title").textContent = "Desktop";
        this.updateRestoreButton();
    }

    minimizeWindow(appId) {
        const win = this.windows.get(appId);
        if (!win) return;
        win.element.classList.add("minimized");
        win.minimized = true;
    }

    maximizeWindow(appId) {
        const win = this.windows.get(appId);
        if (!win) return;
        
        const isMaximized = win.element.classList.contains("maximized");
        const restoreBtn = document.getElementById("topbar-restore");
        
        if (!isMaximized) {
            // Save current position/size before maximizing
            win.savedState = {
                left: win.element.style.left,
                top: win.element.style.top,
                width: win.element.style.width,
                height: win.element.style.height
            };
            win.element.classList.add("maximized");
            this.maximizedWindowId = appId;
            if (restoreBtn) restoreBtn.classList.remove("hidden");
        } else {
            // Restore previous position/size
            if (win.savedState) {
                win.element.style.left = win.savedState.left;
                win.element.style.top = win.savedState.top;
                win.element.style.width = win.savedState.width;
                win.element.style.height = win.savedState.height;
            }
            win.element.classList.remove("maximized");
            this.maximizedWindowId = null;
            this.updateRestoreButton();
        }
    }
    
    updateRestoreButton() {
        const restoreBtn = document.getElementById("topbar-restore");
        if (!restoreBtn) return;
        let hasMaximized = false;
        this.windows.forEach((win, appId) => {
            if (win.element.classList.contains("maximized")) {
                hasMaximized = true;
                this.maximizedWindowId = appId;
            }
        });
        restoreBtn.classList.toggle("hidden", !hasMaximized);
        if (!hasMaximized) this.maximizedWindowId = null;
    }
    
    restoreMaximizedWindow() {
        if (this.maximizedWindowId) {
            this.maximizeWindow(this.maximizedWindowId);
        }
    }

    updateTaskbarActive(appId, isActive) {
        const btn = document.querySelector('.taskbar-app[data-app="' + appId + '"]');
        if (btn) btn.classList.toggle("active", isActive);
    }

    startClock() {
        const updateClock = () => {
            const now = new Date();
            document.getElementById("topbar-time").textContent = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
            document.getElementById("topbar-date").textContent = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
        };
        updateClock();
        setInterval(updateClock, 1000);
    }

    renderWhiteboardApp() {
        return '<div class="whiteboard-app" data-app-id="whiteboard">' +
            '<div class="wb-canvas-container">' +
                '<canvas class="wb-canvas"></canvas>' +
            '</div>' +
            '<div class="wb-floating-toolbar">' +
                // Select tool button (always visible)
                '<button class="wb-action-btn wb-select-btn" data-action="select" title="Select Objects (S)">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/></svg>' +
                '</button>' +
                // Tool button with slide-out
                '<div class="wb-toolbar-item" data-popup="tools">' +
                    '<button class="wb-main-btn wb-tool-main" title="Drawing Tool">' +
                        '<svg class="wb-tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>' +
                    '</button>' +
                    '<div class="wb-slideout">' +
                        '<button class="wb-slideout-btn active" data-tool="pen">' +
                            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>' +
                        '</button>' +
                        '<button class="wb-slideout-btn" data-tool="highlighter">' +
                            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/></svg>' +
                        '</button>' +
                    '</div>' +
                '</div>' +
                // Color button with slide-out
                '<div class="wb-toolbar-item" data-popup="colors">' +
                    '<button class="wb-main-btn wb-color-main" title="Color">' +
                        '<span class="wb-color-preview" style="background:#000000;"></span>' +
                    '</button>' +
                    '<div class="wb-slideout wb-slideout-colors">' +
                        '<button class="wb-color-btn active" data-color="#000000" style="background:#000000;"></button>' +
                        '<button class="wb-color-btn" data-color="#e53935" style="background:#e53935;"></button>' +
                        '<button class="wb-color-btn" data-color="#f57c00" style="background:#f57c00;"></button>' +
                        '<button class="wb-color-btn" data-color="#fdd835" style="background:#fdd835;"></button>' +
                        '<button class="wb-color-btn" data-color="#43a047" style="background:#43a047;"></button>' +
                        '<button class="wb-color-btn" data-color="#1e88e5" style="background:#1e88e5;"></button>' +
                        '<button class="wb-color-btn" data-color="#8e24aa" style="background:#8e24aa;"></button>' +
                        '<button class="wb-color-btn" data-color="#ffffff" style="background:#ffffff;"></button>' +
                    '</div>' +
                '</div>' +
                // Size button with slide-out
                '<div class="wb-toolbar-item" data-popup="sizes">' +
                    '<button class="wb-main-btn wb-size-main" title="Brush Size">' +
                        '<span class="wb-size-preview"></span>' +
                    '</button>' +
                    '<div class="wb-slideout wb-slideout-sizes">' +
                        '<button class="wb-size-btn" data-size="3"><span class="wb-size-dot" style="width:6px;height:6px;"></span></button>' +
                        '<button class="wb-size-btn active" data-size="8"><span class="wb-size-dot" style="width:10px;height:10px;"></span></button>' +
                        '<button class="wb-size-btn" data-size="16"><span class="wb-size-dot" style="width:16px;height:16px;"></span></button>' +
                        '<button class="wb-size-btn" data-size="32"><span class="wb-size-dot" style="width:24px;height:24px;"></span></button>' +
                    '</div>' +
                '</div>' +
                // Divider
                '<div class="wb-divider"></div>' +
                // Always visible: Undo
                '<button class="wb-action-btn" data-action="undo" title="Undo">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>' +
                '</button>' +
                // Always visible: Redo
                '<button class="wb-action-btn" data-action="redo" title="Redo">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>' +
                '</button>' +
                // Always visible: Eraser
                '<button class="wb-action-btn wb-eraser-btn" data-action="eraser" title="Eraser">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>' +
                '</button>' +
                // Always visible: Clear
                '<button class="wb-action-btn wb-clear-btn" data-action="clear" title="Clear All">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>' +
                '</button>' +
                // Navigator controls
                '<div class="wb-divider"></div>' +
                '<button class="wb-action-btn" data-action="zoom-out" title="Zoom Out">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M8 11h6"/></svg>' +
                '</button>' +
                '<span class="wb-zoom-label">100%</span>' +
                '<button class="wb-action-btn" data-action="zoom-in" title="Zoom In">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6"/><path d="M8 11h6"/></svg>' +
                '</button>' +
                '<button class="wb-action-btn" data-action="reset-view" title="Reset View">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h6v6"/><path d="M21 21h-6v-6"/><path d="M3 9V3h6"/><path d="M21 15v6h-6"/></svg>' +
                '</button>' +
            '</div>' +
            // Mini-map navigator
            '<div class="wb-minimap">' +
                '<div class="wb-minimap-viewport"></div>' +
            '</div>' +
        '</div>';
    }

    initWhiteboard(windowEl) {
        const container = windowEl.querySelector('.wb-canvas-container');
        const canvas = windowEl.querySelector('.wb-canvas');
        const ctx = canvas.getContext('2d');
        const toolbar = windowEl.querySelector('.wb-floating-toolbar');
        const self = this;
        
        // User-specific storage keys
        const userId = self.currentUser?.username || 'guest';
        const storageKey = (key) => `hovercam_wb_${userId}_${key}`;
        
        // Create object overlay layer for manipulable objects
        const objectLayer = document.createElement('div');
        objectLayer.className = 'wb-object-layer';
        container.appendChild(objectLayer);
        
        // Whiteboard state - fixed large canvas with viewport
        const CANVAS_WIDTH = 4000;
        const CANVAS_HEIGHT = 3000;
        
        const state = {
            isDrawing: false,
            tool: 'pen',
            color: '#000000',
            size: 8,
            bgColor: '#ffffff',
            history: [],
            historyIndex: -1,
            lastX: 0,
            lastY: 0,
            activeSlideout: null,
            // Viewport state
            viewX: 0,
            viewY: 0,
            zoom: 1,
            isPanning: false,
            panStartX: 0,
            panStartY: 0,
            viewStartX: 0,
            viewStartY: 0,
            // Object manipulation state
            objects: [],
            selectedObject: null,
            isDragging: false,
            isResizing: false,
            resizeHandle: null,
            dragStartX: 0,
            dragStartY: 0,
            objectStartX: 0,
            objectStartY: 0,
            objectStartW: 0,
            objectStartH: 0,
            // Multi-touch state
            touches: [],
            initialPinchDistance: 0,
            initialPinchCenter: null,
            pinchStartWidth: 0,
            pinchStartHeight: 0
        };

        // Close all slideouts
        const closeAllSlideouts = () => {
            toolbar.querySelectorAll('.wb-toolbar-item').forEach(item => {
                item.classList.remove('open');
            });
            state.activeSlideout = null;
        };

        // Toggle slideout
        const toggleSlideout = (item) => {
            const wasOpen = item.classList.contains('open');
            closeAllSlideouts();
            if (!wasOpen) {
                item.classList.add('open');
                state.activeSlideout = item;
            }
        };

        // Update color preview
        const updateColorPreview = () => {
            const preview = toolbar.querySelector('.wb-color-preview');
            if (preview) preview.style.background = state.color;
        };

        // Update size preview
        const updateSizePreview = () => {
            const preview = toolbar.querySelector('.wb-size-preview');
            if (preview) {
                const displaySize = Math.min(Math.max(state.size * 0.8, 6), 20);
                preview.style.width = displaySize + 'px';
                preview.style.height = displaySize + 'px';
            }
        };

        // Update tool icon
        const updateToolIcon = (tool) => {
            const iconEl = toolbar.querySelector('.wb-tool-icon');
            const icons = {
                pen: '<path d="M17 3a2.85 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5Z"/>',
                highlighter: '<path d="M9 11l-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>'
            };
            if (iconEl) iconEl.innerHTML = icons[tool] || icons.pen;
        };
        
        // ==================== OBJECT LAYER SYSTEM ====================
        
        // Create a new image object
        const createImageObject = (imgSrc, x, y, width, height) => {
            const id = 'obj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const obj = {
                id,
                type: 'image',
                src: imgSrc,
                x,
                y,
                width,
                height,
                rotation: 0
            };
            state.objects.push(obj);
            renderObject(obj);
            selectObject(obj);
            saveObjectsState();
            return obj;
        };
        
        // Render an object to the object layer
        const renderObject = (obj) => {
            // Remove existing element if any
            const existing = objectLayer.querySelector('[data-obj-id="' + obj.id + '"]');
            if (existing) existing.remove();
            
            const wrapper = document.createElement('div');
            wrapper.className = 'wb-object' + (state.selectedObject?.id === obj.id ? ' selected' : '');
            wrapper.dataset.objId = obj.id;
            wrapper.style.cssText = 'left:' + obj.x + 'px;top:' + obj.y + 'px;width:' + obj.width + 'px;height:' + obj.height + 'px;';
            
            if (obj.type === 'image') {
                const img = document.createElement('img');
                img.src = obj.src;
                img.draggable = false;
                wrapper.appendChild(img);
            }
            
            // Add resize handles
            const handles = ['nw', 'ne', 'sw', 'se'];
            handles.forEach(pos => {
                const handle = document.createElement('div');
                handle.className = 'wb-resize-handle wb-handle-' + pos;
                handle.dataset.handle = pos;
                wrapper.appendChild(handle);
            });
            
            // Add delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'wb-object-delete';
            deleteBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteObject(obj.id);
            });
            wrapper.appendChild(deleteBtn);
            
            objectLayer.appendChild(wrapper);
            bindObjectEvents(wrapper, obj);
        };
        
        // Bind events to an object element
        const bindObjectEvents = (wrapper, obj) => {
            // Mouse events
            wrapper.addEventListener('mousedown', (e) => {
                if (state.tool !== 'select') return;
                e.stopPropagation();
                
                const handle = e.target.closest('.wb-resize-handle');
                if (handle) {
                    startResize(e, obj, handle.dataset.handle);
                } else if (!e.target.closest('.wb-object-delete')) {
                    selectObject(obj);
                    startDrag(e, obj);
                }
            });
            
            // Touch events for object manipulation
            wrapper.addEventListener('touchstart', (e) => {
                if (state.tool !== 'select') return;
                e.stopPropagation();
                
                if (e.touches.length === 1) {
                    const handle = e.target.closest('.wb-resize-handle');
                    if (handle) {
                        startResize(e, obj, handle.dataset.handle);
                    } else if (!e.target.closest('.wb-object-delete')) {
                        selectObject(obj);
                        startDrag(e, obj);
                    }
                } else if (e.touches.length === 2) {
                    // Pinch gesture for resize
                    selectObject(obj);
                    startPinch(e, obj);
                }
            }, { passive: false });
        };
        
        // Select an object
        const selectObject = (obj) => {
            state.selectedObject = obj;
            objectLayer.querySelectorAll('.wb-object').forEach(el => {
                el.classList.toggle('selected', el.dataset.objId === obj.id);
            });
        };
        
        // Deselect all objects
        const deselectAll = () => {
            state.selectedObject = null;
            objectLayer.querySelectorAll('.wb-object').forEach(el => {
                el.classList.remove('selected');
            });
        };
        
        // Delete an object
        const deleteObject = (objId) => {
            state.objects = state.objects.filter(o => o.id !== objId);
            const el = objectLayer.querySelector('[data-obj-id="' + objId + '"]');
            if (el) el.remove();
            if (state.selectedObject?.id === objId) {
                state.selectedObject = null;
            }
            saveObjectsState();
        };
        
        // Start dragging an object
        const startDrag = (e, obj) => {
            state.isDragging = true;
            const coords = getEventCoords(e);
            state.dragStartX = coords.x;
            state.dragStartY = coords.y;
            state.objectStartX = obj.x;
            state.objectStartY = obj.y;
        };
        
        // Start resizing an object
        const startResize = (e, obj, handle) => {
            e.preventDefault();
            state.isResizing = true;
            state.resizeHandle = handle;
            const coords = getEventCoords(e);
            state.dragStartX = coords.x;
            state.dragStartY = coords.y;
            state.objectStartX = obj.x;
            state.objectStartY = obj.y;
            state.objectStartW = obj.width;
            state.objectStartH = obj.height;
        };
        
        // Start pinch gesture
        const startPinch = (e, obj) => {
            e.preventDefault();
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            state.initialPinchDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
            state.initialPinchCenter = {
                x: (touch1.clientX + touch2.clientX) / 2,
                y: (touch1.clientY + touch2.clientY) / 2
            };
            state.pinchStartWidth = obj.width;
            state.pinchStartHeight = obj.height;
            state.objectStartX = obj.x;
            state.objectStartY = obj.y;
        };
        
        // Get coordinates from mouse or touch event (converted to canvas space)
        const getEventCoords = (e) => {
            if (e.touches && e.touches.length > 0) {
                return screenToCanvas(e.touches[0].clientX, e.touches[0].clientY);
            }
            return screenToCanvas(e.clientX, e.clientY);
        };
        
        // Handle object dragging/resizing during mouse/touch move
        const handleObjectMove = (e) => {
            if (!state.selectedObject) return;
            
            if (state.isDragging) {
                const coords = getEventCoords(e);
                const dx = coords.x - state.dragStartX;
                const dy = coords.y - state.dragStartY;
                state.selectedObject.x = state.objectStartX + dx;
                state.selectedObject.y = state.objectStartY + dy;
                updateObjectPosition(state.selectedObject);
            } else if (state.isResizing) {
                const coords = getEventCoords(e);
                const dx = coords.x - state.dragStartX;
                const dy = coords.y - state.dragStartY;
                
                let newX = state.objectStartX;
                let newY = state.objectStartY;
                let newW = state.objectStartW;
                let newH = state.objectStartH;
                
                const aspectRatio = state.objectStartW / state.objectStartH;
                
                // Resize based on handle position
                if (state.resizeHandle.includes('e')) {
                    newW = Math.max(50, state.objectStartW + dx);
                    newH = newW / aspectRatio;
                }
                if (state.resizeHandle.includes('w')) {
                    const widthChange = -dx;
                    newW = Math.max(50, state.objectStartW + widthChange);
                    newH = newW / aspectRatio;
                    newX = state.objectStartX - (newW - state.objectStartW);
                }
                if (state.resizeHandle.includes('s')) {
                    newH = Math.max(50, state.objectStartH + dy);
                    newW = newH * aspectRatio;
                }
                if (state.resizeHandle.includes('n')) {
                    const heightChange = -dy;
                    newH = Math.max(50, state.objectStartH + heightChange);
                    newW = newH * aspectRatio;
                    newY = state.objectStartY - (newH - state.objectStartH);
                }
                
                state.selectedObject.x = newX;
                state.selectedObject.y = newY;
                state.selectedObject.width = newW;
                state.selectedObject.height = newH;
                updateObjectPosition(state.selectedObject);
            }
        };
        
        // Handle pinch gesture for resizing
        const handlePinch = (e) => {
            if (!state.selectedObject || e.touches.length !== 2) return;
            e.preventDefault();
            
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const currentDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
            
            const scale = currentDistance / state.initialPinchDistance;
            const newWidth = Math.max(50, state.pinchStartWidth * scale);
            const newHeight = Math.max(50, state.pinchStartHeight * scale);
            
            // Keep object centered during pinch
            const centerX = state.objectStartX + state.pinchStartWidth / 2;
            const centerY = state.objectStartY + state.pinchStartHeight / 2;
            
            state.selectedObject.width = newWidth;
            state.selectedObject.height = newHeight;
            state.selectedObject.x = centerX - newWidth / 2;
            state.selectedObject.y = centerY - newHeight / 2;
            
            updateObjectPosition(state.selectedObject);
        };
        
        // Stop object manipulation
        const stopObjectManipulation = () => {
            if (state.isDragging || state.isResizing) {
                saveObjectsState();
            }
            state.isDragging = false;
            state.isResizing = false;
            state.resizeHandle = null;
            state.initialPinchDistance = 0;
        };
        
        // Update object position in DOM
        const updateObjectPosition = (obj) => {
            const el = objectLayer.querySelector('[data-obj-id="' + obj.id + '"]');
            if (el) {
                el.style.left = obj.x + 'px';
                el.style.top = obj.y + 'px';
                el.style.width = obj.width + 'px';
                el.style.height = obj.height + 'px';
            }
        };
        
        // Save objects state to localStorage
        const saveObjectsState = () => {
            try {
                const objectsData = state.objects.map(obj => ({...obj}));
                localStorage.setItem(storageKey('objects'), JSON.stringify(objectsData));
            } catch(e) {
                console.warn('Could not save objects:', e);
            }
        };
        
        // Load objects from localStorage
        const loadObjectsState = () => {
            try {
                const saved = localStorage.getItem(storageKey('objects'));
                if (saved) {
                    const objects = JSON.parse(saved);
                    objects.forEach(obj => {
                        state.objects.push(obj);
                        renderObject(obj);
                    });
                    return true;
                }
            } catch(e) {
                console.warn('Could not load objects:', e);
            }
            return false;
        };
        
        // Flatten all objects to canvas (for saving/exporting)
        const flattenObjectsToCanvas = () => {
            const dpr = window.devicePixelRatio || 1;
            state.objects.forEach(obj => {
                if (obj.type === 'image') {
                    const img = new Image();
                    img.onload = () => {
                        ctx.drawImage(img, obj.x, obj.y, obj.width, obj.height);
                    };
                    img.src = obj.src;
                }
            });
        };
        
        // ==================== END OBJECT LAYER SYSTEM ====================


        // Resize canvas to fit container
        // The "virtual" canvas is large (4000x3000), but we render to a display canvas
        // that fills the container. We track viewX, viewY, zoom to determine what part
        // of the virtual canvas to show.
        
        // Off-screen canvas holds the full drawing
        const virtualCanvas = document.createElement('canvas');
        virtualCanvas.width = CANVAS_WIDTH;
        virtualCanvas.height = CANVAS_HEIGHT;
        const virtualCtx = virtualCanvas.getContext('2d');
        virtualCtx.lineCap = 'round';
        virtualCtx.lineJoin = 'round';
        virtualCtx.fillStyle = state.bgColor;
        virtualCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Initialize display canvas to fill container
        const initCanvas = () => {
            const w = container.offsetWidth || 800;
            const h = container.offsetHeight || 600;
            canvas.width = w;
            canvas.height = h;
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';
            renderViewport();
        };
        
        // Render the visible portion of virtual canvas to display canvas
        const renderViewport = () => {
            const w = canvas.width;
            const h = canvas.height;
            
            // Clear and draw the visible portion
            ctx.fillStyle = '#e0e0e0'; // gray for areas outside virtual canvas
            ctx.fillRect(0, 0, w, h);
            
            // Calculate source rectangle from virtual canvas
            const srcX = state.viewX / state.zoom;
            const srcY = state.viewY / state.zoom;
            const srcW = w / state.zoom;
            const srcH = h / state.zoom;
            
            // Draw the portion of virtual canvas
            ctx.drawImage(virtualCanvas, srcX, srcY, srcW, srcH, 0, 0, w, h);
        };
        
        // Update viewport (re-render canvas and transform object layer)
        const updateViewport = () => {
            renderViewport();
            // Transform object layer to match viewport
            objectLayer.style.transform = `translate(${-state.viewX}px, ${-state.viewY}px) scale(${state.zoom})`;
            objectLayer.style.transformOrigin = '0 0';
        };
        
        // Convert screen coords to canvas coords
        const screenToCanvas = (screenX, screenY) => {
            const rect = container.getBoundingClientRect();
            return {
                x: (screenX - rect.left + state.viewX) / state.zoom,
                y: (screenY - rect.top + state.viewY) / state.zoom
            };
        };
        
        // Calculate minimum zoom to fill container
        const getMinZoom = () => {
            const containerW = container.offsetWidth || 800;
            const containerH = container.offsetHeight || 600;
            // Minimum zoom where canvas still fills container
            return Math.max(containerW / CANVAS_WIDTH, containerH / CANVAS_HEIGHT);
        };
        
        // Zoom controls
        const zoomIn = () => {
            state.zoom = Math.min(state.zoom * 1.2, 3);
            clampViewport();
            updateViewport();
        };
        
        const zoomOut = () => {
            const minZoom = getMinZoom();
            state.zoom = Math.max(state.zoom / 1.2, minZoom);
            clampViewport();
            updateViewport();
        };
        
        const resetView = () => {
            state.viewX = 0;
            state.viewY = 0;
            state.zoom = 1;
            updateViewport();
        };
        
        // Clamp viewport to valid range
        const clampViewport = () => {
            const containerW = container.offsetWidth || 800;
            const containerH = container.offsetHeight || 600;
            const maxX = Math.max(0, CANVAS_WIDTH * state.zoom - containerW);
            const maxY = Math.max(0, CANVAS_HEIGHT * state.zoom - containerH);
            state.viewX = Math.max(0, Math.min(state.viewX, maxX));
            state.viewY = Math.max(0, Math.min(state.viewY, maxY));
        };
        
        // Update zoom label display
        const updateZoomLabel = () => {
            const label = toolbar.querySelector('.wb-zoom-label');
            if (label) {
                label.textContent = Math.round(state.zoom * 100) + '%';
            }
        };
        
        // Update minimap viewport indicator
        const updateMinimap = () => {
            const minimap = windowEl.querySelector('.wb-minimap');
            const viewport = windowEl.querySelector('.wb-minimap-viewport');
            if (!minimap || !viewport) return;
            
            const containerRect = container.getBoundingClientRect();
            const minimapW = minimap.offsetWidth;
            const minimapH = minimap.offsetHeight;
            
            // Scale factors
            const scaleX = minimapW / CANVAS_WIDTH;
            const scaleY = minimapH / CANVAS_HEIGHT;
            
            // Viewport position and size in minimap
            const viewW = (containerRect.width / state.zoom) * scaleX;
            const viewH = (containerRect.height / state.zoom) * scaleY;
            const viewL = state.viewX * scaleX;
            const viewT = state.viewY * scaleY;
            
            viewport.style.left = viewL + 'px';
            viewport.style.top = viewT + 'px';
            viewport.style.width = viewW + 'px';
            viewport.style.height = viewH + 'px';
        };
        
        // Pan canvas by drag (space+drag or middle mouse)
        let isPanning = false;
        let panStartX = 0;
        let panStartY = 0;
        let viewStartX = 0;
        let viewStartY = 0;
        let spacePressed = false;
        
        // Track space key
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && document.activeElement === document.body) {
                spacePressed = true;
                container.classList.add('panning');
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                spacePressed = false;
                if (!isPanning) container.classList.remove('panning');
            }
        });
        
        // Mouse wheel zoom
        container.addEventListener('wheel', (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const delta = -e.deltaY * 0.001;
                const minZoom = getMinZoom();
                const newZoom = Math.min(Math.max(state.zoom * (1 + delta), minZoom), 3);
                
                // Zoom towards cursor position
                const rect = container.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                // Calculate new viewX/viewY to keep cursor position fixed
                const canvasX = (mouseX + state.viewX) / state.zoom;
                const canvasY = (mouseY + state.viewY) / state.zoom;
                
                state.zoom = newZoom;
                state.viewX = canvasX * state.zoom - mouseX;
                state.viewY = canvasY * state.zoom - mouseY;
                
                // Clamp view position
                clampViewport();
                
                updateViewport();
                updateZoomLabel();
                updateMinimap();
            }
        }, { passive: false });
        
        // Minimap click/drag to pan
        const minimap = windowEl.querySelector('.wb-minimap');
        if (minimap) {
            minimap.addEventListener('mousedown', (e) => {
                e.preventDefault();
                const rect = minimap.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const clickY = e.clientY - rect.top;
                
                // Convert to canvas position
                const scaleX = minimap.offsetWidth / CANVAS_WIDTH;
                const scaleY = minimap.offsetHeight / CANVAS_HEIGHT;
                
                const containerRect = container.getBoundingClientRect();
                const viewW = containerRect.width / state.zoom;
                const viewH = containerRect.height / state.zoom;
                
                // Center the view on clicked position
                state.viewX = (clickX / scaleX - viewW / 2) * state.zoom;
                state.viewY = (clickY / scaleY - viewH / 2) * state.zoom;
                
                // Clamp
                state.viewX = Math.max(0, Math.min(state.viewX, CANVAS_WIDTH * state.zoom - containerRect.width));
                state.viewY = Math.max(0, Math.min(state.viewY, CANVAS_HEIGHT * state.zoom - containerRect.height));
                
                updateViewport();
                updateMinimap();
            });
        }

        // Save state to history
        const saveState = () => {
            state.historyIndex++;
            state.history = state.history.slice(0, state.historyIndex);
            state.history.push(virtualCanvas.toDataURL());
            if (state.history.length > 50) {
                state.history.shift();
                state.historyIndex--;
            }
            // Persist to localStorage
            persistCanvas();
        };
        
        // Persist canvas to localStorage
        const persistCanvas = () => {
            try {
                const canvasData = virtualCanvas.toDataURL('image/png');
                localStorage.setItem(storageKey('canvas'), canvasData);
                localStorage.setItem(storageKey('bgColor'), state.bgColor);
            } catch(e) {
                console.warn('Could not persist whiteboard:', e);
            }
        };
        
        // Load persisted canvas
        const loadPersistedCanvas = () => {
            try {
                const savedCanvas = localStorage.getItem(storageKey('canvas'));
                const savedBgColor = localStorage.getItem(storageKey('bgColor'));
                
                if (savedBgColor) {
                    state.bgColor = savedBgColor;
                    virtualCtx.fillStyle = state.bgColor;
                }
                
                if (savedCanvas) {
                    const img = new Image();
                    img.onload = () => {
                        // Fill with background first
                        virtualCtx.fillStyle = state.bgColor;
                        virtualCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                        // Draw saved content (may be smaller than new canvas)
                        virtualCtx.drawImage(img, 0, 0);
                        // Save to history after loading
                        state.history = [virtualCanvas.toDataURL()];
                        state.historyIndex = 0;
                        renderViewport();
                    };
                    img.src = savedCanvas;
                    return true;
                }
            } catch(e) {
                console.warn('Could not load persisted whiteboard:', e);
            }
            return false;
        };

        // Expose save function for external calls (e.g., paste image)
        windowEl.whiteboardSaveState = saveState;

        // Restore state from history
        const restoreState = (index) => {
            if (index < 0 || index >= state.history.length) return;
            const img = new Image();
            img.onload = () => {
                virtualCtx.fillStyle = state.bgColor;
                virtualCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                virtualCtx.drawImage(img, 0, 0);
                renderViewport();
            };
            img.src = state.history[index];
        };

        // Get coordinates from event - convert screen to virtual canvas coords
        const getCoords = (e) => {
            const rect = canvas.getBoundingClientRect();
            let clientX, clientY;
            
            if (e.touches && e.touches.length > 0) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }
            
            // Convert screen position to virtual canvas position
            const screenX = clientX - rect.left;
            const screenY = clientY - rect.top;
            
            // Account for viewport offset and zoom
            return {
                x: (screenX / state.zoom) + (state.viewX / state.zoom),
                y: (screenY / state.zoom) + (state.viewY / state.zoom)
            };
        };

        // Start drawing
        const startDrawing = (e) => {
            // Check for panning (space+drag or middle mouse)
            if (spacePressed || e.button === 1) {
                e.preventDefault();
                isPanning = true;
                panStartX = e.clientX;
                panStartY = e.clientY;
                viewStartX = state.viewX;
                viewStartY = state.viewY;
                container.classList.add('panning-active');
                return;
            }
            
            // Don't draw in select mode
            if (state.tool === 'select') {
                // Deselect if clicking on empty canvas
                deselectAll();
                return;
            }
            e.preventDefault();
            closeAllSlideouts();
            state.isDrawing = true;
            const coords = getCoords(e);
            state.lastX = coords.x;
            state.lastY = coords.y;
            
            // Draw on virtual canvas
            virtualCtx.beginPath();
            virtualCtx.arc(coords.x, coords.y, state.size / 2, 0, Math.PI * 2);
            virtualCtx.fillStyle = state.tool === 'eraser' ? state.bgColor : state.color;
            if (state.tool === 'highlighter') {
                virtualCtx.globalAlpha = 0.3;
            }
            virtualCtx.fill();
            virtualCtx.globalAlpha = 1;
            renderViewport();
        };

        // Draw
        const draw = (e) => {
            // Handle panning
            if (isPanning) {
                e.preventDefault();
                const dx = e.clientX - panStartX;
                const dy = e.clientY - panStartY;
                state.viewX = viewStartX - dx;
                state.viewY = viewStartY - dy;
                
                // Clamp
                clampViewport();
                
                updateViewport();
                updateMinimap();
                return;
            }
            
            // Handle object manipulation in select mode
            if (state.tool === 'select') {
                handleObjectMove(e);
                return;
            }
            if (!state.isDrawing) return;
            e.preventDefault();
            
            const coords = getCoords(e);
            
            // Draw on virtual canvas
            virtualCtx.beginPath();
            virtualCtx.moveTo(state.lastX, state.lastY);
            virtualCtx.lineTo(coords.x, coords.y);
            
            if (state.tool === 'eraser') {
                virtualCtx.strokeStyle = state.bgColor;
                virtualCtx.lineWidth = state.size * 3;
                virtualCtx.globalAlpha = 1;
            } else if (state.tool === 'highlighter') {
                virtualCtx.strokeStyle = state.color;
                virtualCtx.lineWidth = state.size * 2;
                virtualCtx.globalAlpha = 0.3;
            } else {
                virtualCtx.strokeStyle = state.color;
                virtualCtx.lineWidth = state.size;
                virtualCtx.globalAlpha = 1;
            }
            
            virtualCtx.stroke();
            virtualCtx.globalAlpha = 1;
            renderViewport();
            
            state.lastX = coords.x;
            state.lastY = coords.y;
        };

        // Stop drawing
        const stopDrawing = () => {
            // Stop panning
            if (isPanning) {
                isPanning = false;
                container.classList.remove('panning-active');
                if (!spacePressed) container.classList.remove('panning');
                return;
            }
            
            if (state.tool === 'select') {
                stopObjectManipulation();
                return;
            }
            if (state.isDrawing) {
                state.isDrawing = false;
                saveState();
            }
        };

        // Canvas events - mouse
        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseleave', stopDrawing);

        // Canvas events - touch (with special handling for pinch)
        canvas.addEventListener('touchstart', (e) => {
            if (state.tool === 'select' && e.touches.length === 2 && state.selectedObject) {
                startPinch(e, state.selectedObject);
            } else {
                startDrawing(e);
            }
        }, { passive: false });
        canvas.addEventListener('touchmove', (e) => {
            if (state.tool === 'select' && e.touches.length === 2) {
                handlePinch(e);
            } else {
                draw(e);
            }
        }, { passive: false });
        canvas.addEventListener('touchend', stopDrawing);
        canvas.addEventListener('touchcancel', stopDrawing);

        // Global mouse/touch handlers for object manipulation
        document.addEventListener('mousemove', (e) => {
            if (state.tool === 'select' && (state.isDragging || state.isResizing)) {
                handleObjectMove(e);
            }
        });
        document.addEventListener('mouseup', () => {
            if (state.tool === 'select') {
                stopObjectManipulation();
            }
        });
        document.addEventListener('touchmove', (e) => {
            if (state.tool === 'select' && e.touches.length === 2 && state.selectedObject) {
                handlePinch(e);
            } else if (state.tool === 'select' && (state.isDragging || state.isResizing)) {
                handleObjectMove(e);
            }
        }, { passive: false });
        document.addEventListener('touchend', () => {
            if (state.tool === 'select') {
                stopObjectManipulation();
            }
        });

        // Slideout triggers - main buttons
        toolbar.querySelectorAll('.wb-toolbar-item').forEach(item => {
            const mainBtn = item.querySelector('.wb-main-btn');
            if (mainBtn) {
                mainBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleSlideout(item);
                });
            }
        });

        // Tool selection
        toolbar.querySelectorAll('.wb-slideout-btn[data-tool]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                toolbar.querySelectorAll('.wb-slideout-btn[data-tool]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.tool = btn.dataset.tool;
                updateToolIcon(state.tool);
                
                // Update eraser and select button states
                toolbar.querySelector('.wb-eraser-btn')?.classList.remove('active');
                toolbar.querySelector('.wb-select-btn')?.classList.remove('active');
                deselectAll();
                
                closeAllSlideouts();
            });
        });

        // Color selection
        toolbar.querySelectorAll('.wb-color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                toolbar.querySelectorAll('.wb-color-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.color = btn.dataset.color;
                updateColorPreview();
                
                // Switch to pen if eraser or select was active
                if (state.tool === 'eraser' || state.tool === 'select') {
                    state.tool = 'pen';
                    updateToolIcon('pen');
                    toolbar.querySelector('.wb-eraser-btn')?.classList.remove('active');
                    toolbar.querySelector('.wb-select-btn')?.classList.remove('active');
                    toolbar.querySelectorAll('.wb-slideout-btn[data-tool]').forEach(b => b.classList.remove('active'));
                    const penBtn = toolbar.querySelector('.wb-slideout-btn[data-tool="pen"]');
                    if (penBtn) penBtn.classList.add('active');
                    deselectAll();
                }
                
                closeAllSlideouts();
            });
        });

        // Size selection
        toolbar.querySelectorAll('.wb-size-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                toolbar.querySelectorAll('.wb-size-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.size = parseInt(btn.dataset.size);
                updateSizePreview();
                closeAllSlideouts();
            });
        });

        // Action buttons
        toolbar.querySelectorAll('.wb-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                closeAllSlideouts();
                
                const action = btn.dataset.action;
                if (action === 'undo' && state.historyIndex > 0) {
                    state.historyIndex--;
                    restoreState(state.historyIndex);
                } else if (action === 'redo' && state.historyIndex < state.history.length - 1) {
                    state.historyIndex++;
                    restoreState(state.historyIndex);
                } else if (action === 'select') {
                    // Toggle select mode
                    const isSelect = state.tool === 'select';
                    if (isSelect) {
                        state.tool = 'pen';
                        btn.classList.remove('active');
                        updateToolIcon('pen');
                        deselectAll();
                    } else {
                        state.tool = 'select';
                        btn.classList.add('active');
                        toolbar.querySelector('.wb-eraser-btn')?.classList.remove('active');
                        toolbar.querySelectorAll('.wb-slideout-btn[data-tool]').forEach(b => b.classList.remove('active'));
                    }
                } else if (action === 'eraser') {
                    // Toggle eraser
                    const isEraser = state.tool === 'eraser';
                    if (isEraser) {
                        state.tool = 'pen';
                        btn.classList.remove('active');
                        updateToolIcon('pen');
                    } else {
                        state.tool = 'eraser';
                        btn.classList.add('active');
                        toolbar.querySelector('.wb-select-btn')?.classList.remove('active');
                        toolbar.querySelectorAll('.wb-slideout-btn[data-tool]').forEach(b => b.classList.remove('active'));
                    }
                } else if (action === 'clear') {
                    // Show in-app confirmation instead of browser confirm()
                    showClearConfirmation();
                } else if (action === 'zoom-in') {
                    zoomIn();
                    updateZoomLabel();
                    updateMinimap();
                } else if (action === 'zoom-out') {
                    zoomOut();
                    updateZoomLabel();
                    updateMinimap();
                } else if (action === 'reset-view') {
                    resetView();
                    updateZoomLabel();
                    updateMinimap();
                }
            });
        });
        
        // In-app clear confirmation modal
        const showClearConfirmation = () => {
            // Remove existing modal if any
            const existing = container.querySelector('.wb-confirm-modal');
            if (existing) existing.remove();
            
            const modal = document.createElement('div');
            modal.className = 'wb-confirm-modal';
            modal.innerHTML = 
                '<div class="wb-confirm-content">' +
                    '<div class="wb-confirm-icon">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>' +
                    '</div>' +
                    '<h3>Clear Whiteboard?</h3>' +
                    '<p>This will erase all drawings and images.</p>' +
                    '<div class="wb-confirm-buttons">' +
                        '<button class="wb-confirm-cancel">Cancel</button>' +
                        '<button class="wb-confirm-yes">Clear All</button>' +
                    '</div>' +
                '</div>';
            
            container.appendChild(modal);
            
            // Animate in
            requestAnimationFrame(() => modal.classList.add('visible'));
            
            // Cancel button
            modal.querySelector('.wb-confirm-cancel').addEventListener('click', () => {
                modal.classList.remove('visible');
                setTimeout(() => modal.remove(), 200);
            });
            
            // Clear button
            modal.querySelector('.wb-confirm-yes').addEventListener('click', () => {
                // Clear the VIRTUAL canvas (the actual drawing surface)
                virtualCtx.fillStyle = state.bgColor;
                virtualCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                // Update display
                renderViewport();
                // Clear persisted canvas
                localStorage.removeItem(storageKey('canvas'));
                // Clear objects
                state.objects = [];
                objectLayer.innerHTML = '';
                localStorage.removeItem(storageKey('objects'));
                state.selectedObject = null;
                // Reset history
                state.history = [];
                state.historyIndex = -1;
                saveState();
                
                modal.classList.remove('visible');
                setTimeout(() => modal.remove(), 200);
                
                self.showNotification('Whiteboard cleared', 'success');
            });
            
            // Click outside to cancel
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('visible');
                    setTimeout(() => modal.remove(), 200);
                }
            });
        };

        // Close slideouts when clicking canvas
        canvas.addEventListener('click', closeAllSlideouts);
        
        // Helper to add image as object
        const addImageAsObject = (imgSrc, dropEvent) => {
            const img = new Image();
            img.onload = () => {
                const containerRect = container.getBoundingClientRect();
                const screenX = dropEvent.clientX - containerRect.left;
                const screenY = dropEvent.clientY - containerRect.top;
                
                // Convert screen coords to virtual canvas coords
                const dropX = (screenX / state.zoom) + (state.viewX / state.zoom);
                const dropY = (screenY / state.zoom) + (state.viewY / state.zoom);
                
                // Scale image to reasonable size (max 400px, which is reasonable in virtual canvas)
                const maxSize = 400;
                let width = img.width;
                let height = img.height;
                
                if (width > maxSize || height > maxSize) {
                    if (width > height) {
                        height = height * (maxSize / width);
                        width = maxSize;
                    } else {
                        width = width * (maxSize / height);
                        height = maxSize;
                    }
                }
                
                // Center on drop point (in virtual canvas coords)
                const x = dropX - width / 2;
                const y = dropY - height / 2;
                
                createImageObject(imgSrc, x, y, width, height);
                
                // Switch to select mode so user can manipulate immediately
                state.tool = 'select';
                toolbar.querySelector('.wb-select-btn')?.classList.add('active');
                toolbar.querySelector('.wb-eraser-btn')?.classList.remove('active');
                
                self.showNotification('Image added! Drag to move, use handles to resize.', 'success');
            };
            img.onerror = () => {
                // Try with CORS proxy
                const proxyImg = new Image();
                proxyImg.crossOrigin = 'anonymous';
                proxyImg.onload = () => {
                    img.onload();
                };
                proxyImg.onerror = () => {
                    self.showNotification('Could not load image', 'error');
                };
                proxyImg.src = 'https://corsproxy.io/?' + encodeURIComponent(imgSrc);
            };
            img.src = imgSrc;
        };
        
        // Drag and drop image support
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            container.classList.add('drag-over');
        });
        
        container.addEventListener('dragleave', (e) => {
            if (!container.contains(e.relatedTarget)) {
                container.classList.remove('drag-over');
            }
        });
        
        container.addEventListener('drop', (e) => {
            e.preventDefault();
            container.classList.remove('drag-over');
            
            // Check for camera snapshot
            const cameraSnapshot = e.dataTransfer.getData('application/x-camera-snapshot');
            if (cameraSnapshot) {
                addImageAsObject(cameraSnapshot, e);
                return;
            }
            
            // Check for files from computer
            if (e.dataTransfer.files.length > 0) {
                const file = e.dataTransfer.files[0];
                const isImage = file.type.startsWith('image/'); const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'); if (isImage || isPDF) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        addImageAsObject(event.target.result, e);
                    };
                    reader.readAsDataURL(file);
                }
                return;
            }
            
            // Check for image from Files app
            const hovercamData = e.dataTransfer.getData('application/hovercam-image');
            if (hovercamData) {
                try {
                    const imageData = JSON.parse(hovercamData);
                    addImageAsObject(imageData.url || imageData.data, e);
                } catch(err) {
                    console.error('Failed to parse image data:', err);
                }
                return;
            }
            
            // Check for image URL
            const imageUrl = e.dataTransfer.getData('text/plain');
            if (imageUrl && (imageUrl.startsWith('data:image') || imageUrl.startsWith('http') || imageUrl.match(/\.(jpg|jpeg|png|gif|webp)/i))) {
                addImageAsObject(imageUrl, e);
            }
        });

        // Initialize previews
        updateColorPreview();
        updateSizePreview();

        // Initial setup
        initCanvas();
        updateViewport();
        updateZoomLabel();
        // Delay minimap init to allow layout
        setTimeout(updateMinimap, 100);
        
        // Try to load persisted canvas, otherwise save initial state
        if (!loadPersistedCanvas()) {
            saveState();
        }
        
        // Load persisted objects
        loadObjectsState();

        // Resize observer to update display canvas when container resizes
        const resizeObserver = new ResizeObserver(() => {
            initCanvas();
        });
        resizeObserver.observe(container);

        // Keyboard shortcuts
        windowEl.addEventListener('keydown', (e) => {
            if (e.key === 's' || e.key === 'S') {
                // Toggle select mode
                const selectBtn = toolbar.querySelector('.wb-select-btn');
                if (selectBtn) selectBtn.click();
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                // Delete selected object
                if (state.selectedObject) {
                    deleteObject(state.selectedObject.id);
                }
            } else if (e.key === 'Escape') {
                deselectAll();
            }
        });

        // Store reference for cleanup
        windowEl.whiteboardCleanup = () => {
            resizeObserver.disconnect();
        };
    }

    renderWelcomeApp() {
        // Return a container that will be populated with custom or default content
        setTimeout(() => this.loadWelcomeContent(), 100);
        return '<div class="welcome-content" id="welcome-content-container">' +
            '<div class="welcome-loading">Loading...</div>' +
        '</div>';
    }
    
    async loadWelcomeContent() {
        const container = document.getElementById('welcome-content-container');
        if (!container) return;
        
        try {
            const response = await this.api('/admin/welcome-page');
            if (response.html && response.html.trim()) {
                container.innerHTML = response.html;
            } else {
                container.innerHTML = this.getDefaultWelcomeHTML();
            }
        } catch (error) {
            container.innerHTML = this.getDefaultWelcomeHTML();
        }
    }
    
    getDefaultWelcomeHTML() {
        return '<h2>Welcome to HoverCam Desktop</h2>' +
            '<p>Your personal workspace is ready. Explore the apps in the taskbar or double-click desktop icons to get started.</p>' +
            '<div class="welcome-stats">' +
                '<div class="stat-card"><h3>' + this.apps.length + '</h3><p>Apps Available</p></div>' +
                '<div class="stat-card"><h3>v2.0</h3><p>System Version</p></div>' +
                '<div class="stat-card"><h3>100%</h3><p>System Health</p></div>' +
            '</div>';
    }
    
    renderWelcomeEditorApp() {
        return '<div class="welcome-editor-app">' +
            '<div class="welcome-editor-header">' +
                '<h2>📝 Welcome Page Editor</h2>' +
                '<p>Edit the HTML that appears in the Welcome window for all users</p>' +
            '</div>' +
            '<div class="welcome-editor-content">' +
                '<div class="welcome-editor-toolbar">' +
                    '<button class="admin-btn" id="welcome-load-btn">🔄 Load Current</button>' +
                    '<button class="admin-btn" id="welcome-preview-btn">👁️ Preview</button>' +
                    '<button class="admin-btn" id="welcome-reset-btn">↩️ Reset to Default</button>' +
                    '<button class="admin-btn save" id="welcome-save-btn">💾 Save Changes</button>' +
                '</div>' +
                '<div class="welcome-editor-main">' +
                    '<div class="welcome-editor-code">' +
                        '<h4>HTML Code</h4>' +
                        '<textarea id="welcome-html-editor" placeholder="Enter your custom HTML here..."></textarea>' +
                    '</div>' +
                    '<div class="welcome-editor-preview">' +
                        '<h4>Preview</h4>' +
                        '<div class="welcome-preview-frame" id="welcome-preview-frame"></div>' +
                    '</div>' +
                '</div>' +
                '<div class="welcome-editor-status" id="welcome-editor-status"></div>' +
            '</div>' +
        '</div>';
    }

    renderBrowserApp() {
        const homepageHtml = `
            <div class="browser-homepage">
                <div class="homepage-header">
                    <h1>Educational Resources</h1>
                    <p>Click any resource below to explore. Images can be copied to the Whiteboard!</p>
                </div>
                <div class="homepage-grid">
                    <a href="https://www.wikipedia.org" class="homepage-card" data-url="https://www.wikipedia.org">
                        <div class="card-icon">📚</div>
                        <h3>Wikipedia</h3>
                        <p>The free encyclopedia with millions of articles</p>
                    </a>
                    <a href="https://commons.wikimedia.org" class="homepage-card" data-url="https://commons.wikimedia.org">
                        <div class="card-icon">🖼️</div>
                        <h3>Wikimedia Commons</h3>
                        <p>Free images, videos, and media files</p>
                    </a>
                    <a href="https://simple.wikipedia.org" class="homepage-card" data-url="https://simple.wikipedia.org">
                        <div class="card-icon">📖</div>
                        <h3>Simple Wikipedia</h3>
                        <p>Wikipedia in simple English for students</p>
                    </a>
                    <a href="https://en.wikibooks.org" class="homepage-card" data-url="https://en.wikibooks.org">
                        <div class="card-icon">📕</div>
                        <h3>Wikibooks</h3>
                        <p>Free textbooks and educational materials</p>
                    </a>
                    <a href="https://en.wikiversity.org" class="homepage-card" data-url="https://en.wikiversity.org">
                        <div class="card-icon">🎓</div>
                        <h3>Wikiversity</h3>
                        <p>Free learning resources and courses</p>
                    </a>
                    <a href="https://species.wikimedia.org" class="homepage-card" data-url="https://species.wikimedia.org">
                        <div class="card-icon">🦋</div>
                        <h3>Wikispecies</h3>
                        <p>Directory of species for biology studies</p>
                    </a>
                </div>
                <div class="homepage-tip">
                    <strong>💡 Tip:</strong> Right-click any image → "Copy Image Address" → Click the clip button above → Paste URL → Add to Whiteboard
                </div>
            </div>
        `;
        
        return '<div class="browser-app" data-app-id="browser">' +
            '<div class="browser-toolbar">' +
                '<div class="browser-nav-buttons">' +
                    '<button class="browser-nav-btn" data-action="back" title="Back">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>' +
                    '</button>' +
                    '<button class="browser-nav-btn" data-action="forward" title="Forward">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' +
                    '</button>' +
                    '<button class="browser-nav-btn" data-action="refresh" title="Refresh">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>' +
                    '</button>' +
                    '<button class="browser-nav-btn browser-home-btn" data-action="home" title="Home">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' +
                    '</button>' +
                '</div>' +
                '<div class="browser-url-bar">' +
                    '<svg class="browser-url-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>' +
                    '<input type="text" class="browser-url-input" placeholder="Enter URL or search Wikipedia...">' +
                    '<button class="browser-go-btn" title="Go">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' +
                    '</button>' +
                '</div>' +
                '<div class="browser-actions">' +
                    '<button class="browser-action-btn browser-clip-btn" data-action="clip" title="Send Image to Whiteboard">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>' +
                    '</button>' +
                '</div>' +
            '</div>' +
            '<div class="browser-clip-banner hidden">' +
                '<div class="clip-banner-content">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>' +
                    '<span>Paste image URL to add to Whiteboard:</span>' +
                    '<input type="text" class="clip-url-input" placeholder="https://upload.wikimedia.org/...">' +
                    '<button class="clip-add-btn">Add to Whiteboard</button>' +
                    '<button class="clip-close-btn" title="Close">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
                    '</button>' +
                '</div>' +
            '</div>' +
            '<div class="browser-content">' +
                '<div class="browser-homepage-container">' + homepageHtml + '</div>' +
                '<iframe class="browser-iframe hidden" sandbox="allow-same-origin allow-scripts allow-popups allow-forms"></iframe>' +
            '</div>' +
            '<div class="browser-status-bar">' +
                '<span class="browser-status-text">Home</span>' +
                '<span class="browser-status-hint">Select an educational resource to begin</span>' +
            '</div>' +
        '</div>';
    }

    initBrowser(windowEl) {
        const urlInput = windowEl.querySelector('.browser-url-input');
        const iframe = windowEl.querySelector('.browser-iframe');
        const homepageContainer = windowEl.querySelector('.browser-homepage-container');
        const goBtn = windowEl.querySelector('.browser-go-btn');
        const statusText = windowEl.querySelector('.browser-status-text');
        const statusHint = windowEl.querySelector('.browser-status-hint');
        const clipBanner = windowEl.querySelector('.browser-clip-banner');
        const clipBtn = windowEl.querySelector('.browser-clip-btn');
        const clipUrlInput = windowEl.querySelector('.clip-url-input');
        const clipAddBtn = windowEl.querySelector('.clip-add-btn');
        const clipCloseBtn = windowEl.querySelector('.clip-close-btn');
        
        let isHome = true;

        // Show homepage
        const showHomepage = () => {
            isHome = true;
            homepageContainer.classList.remove('hidden');
            iframe.classList.add('hidden');
            iframe.src = 'about:blank';
            urlInput.value = '';
            statusText.textContent = 'Home';
            statusHint.textContent = 'Select an educational resource to begin';
        };

        // Navigate to URL
        const navigate = (url) => {
            let finalUrl = url.trim();
            if (!finalUrl) {
                showHomepage();
                return;
            }
            
            if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
                if (finalUrl.includes('.') && !finalUrl.includes(' ')) {
                    finalUrl = 'https://' + finalUrl;
                } else {
                    // Search Wikipedia instead of Google
                    finalUrl = 'https://en.wikipedia.org/w/index.php?search=' + encodeURIComponent(finalUrl);
                }
            }
            
            isHome = false;
            urlInput.value = finalUrl;
            homepageContainer.classList.add('hidden');
            iframe.classList.remove('hidden');
            iframe.src = finalUrl;
            statusText.textContent = 'Loading...';
            statusHint.textContent = 'Right-click images → Copy Image Address → Use clip button';
        };

        // Homepage card clicks
        homepageContainer.addEventListener('click', (e) => {
            const card = e.target.closest('.homepage-card');
            if (card) {
                e.preventDefault();
                const url = card.dataset.url;
                if (url) {
                    navigate(url);
                }
            }
        });

        // URL input handlers
        urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                navigate(urlInput.value);
            }
        });

        goBtn.addEventListener('click', () => navigate(urlInput.value));

        // Navigation buttons
        windowEl.querySelectorAll('.browser-nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                if (action === 'back') {
                    if (isHome) return;
                    try { iframe.contentWindow.history.back(); } catch(e) {}
                } else if (action === 'forward') {
                    try { iframe.contentWindow.history.forward(); } catch(e) {}
                } else if (action === 'refresh') {
                    if (isHome) return;
                    iframe.src = iframe.src;
                    statusText.textContent = 'Refreshing...';
                } else if (action === 'home') {
                    showHomepage();
                }
            });
        });

        // Iframe load handler
        iframe.addEventListener('load', () => {
            if (!isHome) {
                statusText.textContent = 'Ready';
                try {
                    const newUrl = iframe.contentWindow.location.href;
                    if (newUrl && newUrl !== 'about:blank') {
                        urlInput.value = newUrl;
                    }
                } catch(e) {
                    // Cross-origin - can't access URL
                }
            }
        });

        // Clip banner toggle
        clipBtn.addEventListener('click', () => {
            const isVisible = !clipBanner.classList.contains('hidden');
            if (isVisible) {
                clipBanner.classList.add('hidden');
                clipBtn.classList.remove('active');
            } else {
                clipBanner.classList.remove('hidden');
                clipBtn.classList.add('active');
                clipUrlInput.focus();
            }
        });

        // Close clip banner
        clipCloseBtn.addEventListener('click', () => {
            clipBanner.classList.add('hidden');
            clipBtn.classList.remove('active');
        });

        // Add image to whiteboard
        const addImageToWhiteboard = () => {
            const imageUrl = clipUrlInput.value.trim();
            if (!imageUrl) {
                statusText.textContent = 'Please enter an image URL';
                return;
            }
            
            statusText.textContent = 'Adding image to Whiteboard...';
            this.pasteImageToWhiteboard(imageUrl);
            clipUrlInput.value = '';
            
            // Close the banner after adding
            setTimeout(() => {
                clipBanner.classList.add('hidden');
                clipBtn.classList.remove('active');
            }, 500);
        };

        clipAddBtn.addEventListener('click', addImageToWhiteboard);
        
        clipUrlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addImageToWhiteboard();
            }
        });
    }

    // Paste image to whiteboard canvas
    pasteImageToWhiteboard(imageSrc) {
        console.log('Pasting image to whiteboard:', imageSrc);
        
        // Find or open whiteboard
        let whiteboardData = this.windows.get('whiteboard');
        if (!whiteboardData) {
            this.openApp('whiteboard');
            // Need a small delay for the whiteboard to initialize
            setTimeout(() => this.pasteImageToWhiteboard(imageSrc), 200);
            return;
        }

        const windowEl = whiteboardData.element;
        if (!windowEl) {
            console.error('Whiteboard window element not found');
            this.showNotification('Could not find Whiteboard window', 'error');
            return;
        }

        const canvas = windowEl.querySelector('.wb-canvas');
        if (!canvas) {
            console.error('Whiteboard canvas not found');
            this.showNotification('Could not find Whiteboard canvas', 'error');
            return;
        }

        const ctx = canvas.getContext('2d');
        const self = this;
        
        const drawImageToCanvas = (img) => {
            console.log('Image loaded:', img.width, 'x', img.height);
            
            // Scale image to fit nicely on canvas
            const dpr = window.devicePixelRatio || 1;
            const canvasWidth = canvas.width / dpr;
            const canvasHeight = canvas.height / dpr;
            const maxWidth = canvasWidth * 0.4;
            const maxHeight = canvasHeight * 0.4;
            
            let width = img.width;
            let height = img.height;
            
            if (width > maxWidth) {
                height = height * (maxWidth / width);
                width = maxWidth;
            }
            if (height > maxHeight) {
                width = width * (maxHeight / height);
                height = maxHeight;
            }
            
            // Draw in center
            const x = (canvasWidth - width) / 2;
            const y = (canvasHeight - height) / 2;
            
            console.log('Drawing at:', x, y, 'size:', width, height);
            ctx.drawImage(img, x, y, width, height);
            
            // Save state for undo and persistence
            if (windowEl.whiteboardSaveState) {
                windowEl.whiteboardSaveState();
            }
            
            self.showNotification('Image added to Whiteboard!', 'success');
        };
        
        // Try loading without CORS first (works for display, but can't save to canvas state properly)
        // Then try with CORS for images that support it
        const img = new Image();
        
        img.onload = () => {
            drawImageToCanvas(img);
        };
        
        img.onerror = (e) => {
            console.error('Image load error, trying with proxy...');
            // Try using a CORS proxy as fallback
            const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(imageSrc);
            const proxyImg = new Image();
            proxyImg.crossOrigin = 'anonymous';
            proxyImg.onload = () => {
                drawImageToCanvas(proxyImg);
            };
            proxyImg.onerror = () => {
                self.showNotification('Could not load image - try a different image URL', 'error');
            };
            proxyImg.src = proxyUrl;
        };
        
        // First try direct load (no CORS attribute for maximum compatibility)
        img.src = imageSrc;
    }

    // Save whiteboard state (called after paste)
    saveWhiteboardState() {
        const whiteboardData = this.windows.get('whiteboard');
        if (whiteboardData && whiteboardData.element && whiteboardData.element.whiteboardSaveState) {
            whiteboardData.element.whiteboardSaveState();
        }
    }
    
    // Draw image on whiteboard at drop position
    drawImageOnWhiteboard(canvas, ctx, imageSrc, dropEvent, state, saveState) {
        const img = new Image();
        img.onload = () => {
            const dpr = window.devicePixelRatio || 1;
            const canvasRect = canvas.getBoundingClientRect();
            const canvasWidth = canvas.width / dpr;
            const canvasHeight = canvas.height / dpr;
            
            // Calculate drop position relative to canvas
            let dropX = (dropEvent.clientX - canvasRect.left);
            let dropY = (dropEvent.clientY - canvasRect.top);
            
            // Scale image to reasonable size (max 30% of canvas)
            const maxWidth = canvasWidth * 0.3;
            const maxHeight = canvasHeight * 0.3;
            let width = img.width;
            let height = img.height;
            
            if (width > maxWidth) {
                height = height * (maxWidth / width);
                width = maxWidth;
            }
            if (height > maxHeight) {
                width = width * (maxHeight / height);
                height = maxHeight;
            }
            
            // Center image on drop point
            const x = dropX - width / 2;
            const y = dropY - height / 2;
            
            ctx.drawImage(img, x, y, width, height);
            saveState();
            
            this.showNotification('Image added to Whiteboard!', 'success');
        };
        img.onerror = () => {
            this.showNotification('Could not load image', 'error');
        };
        img.src = imageSrc;
    }

    renderFilesApp() {
        return '<div class="files-app" data-app-id="files">' +
            '<div class="files-toolbar">' +
                '<div class="files-nav">' +
                    '<button class="files-nav-btn" data-action="back" title="Back">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>' +
                    '</button>' +
                    '<button class="files-nav-btn" data-action="home" title="Home">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' +
                    '</button>' +
                '</div>' +
                '<div class="files-path">' +
                    '<span class="path-segment" data-path="/">My Files</span>' +
                '</div>' +
                '<div class="files-actions">' +
                    '<button class="files-action-btn" data-action="newfolder" title="New Folder">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>' +
                        '<span>New Folder</span>' +
                    '</button>' +
                    '<button class="files-action-btn" data-action="upload" title="Upload Files">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' +
                        '<span>Upload</span>' +
                    '</button>' +
                '</div>' +
            '</div>' +
            '<div class="files-container">' +
                '<div class="files-dropzone">' +
                    '<div class="dropzone-content">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' +
                        '<p>Drop files here to upload</p>' +
                        '<span>or click Upload button</span>' +
                    '</div>' +
                '</div>' +
                '<div class="files-grid"></div>' +
                '<div class="files-empty hidden">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>' +
                    '<p>This folder is empty</p>' +
                    '<span>Drop files here or create a new folder</span>' +
                '</div>' +
            '</div>' +
            '<div class="files-statusbar">' +
                '<span class="files-status">Ready</span>' +
                '<span class="files-hint">Drag images to Whiteboard or drop files from your computer</span>' +
            '</div>' +
            '<input type="file" class="files-upload-input" multiple accept="image/*" style="display:none">' +
        '</div>';
    }

    initCamera(windowEl) {
        const app = windowEl.querySelector('.camera-app');
        if (!app) return;
        
        let video = app.querySelector('.camera-video');
        const canvas = app.querySelector('.camera-canvas');
        const optionsBtn = app.querySelector('.camera-options-btn');
        const optionsMenu = app.querySelector('.camera-options-menu');
        const sourceSelect = app.querySelector('.camera-source-select');
        const resolutionSelect = app.querySelector('.camera-resolution-select');
        const focusSelect = app.querySelector('.camera-focus-select');
        const focusSlider = app.querySelector('.camera-focus-slider');
        const resolutionBadge = app.querySelector('.camera-resolution-badge');
        const self = this;
        
        let stream = null;
        let mirrored = false;
        let rotation = 0;
        let frozen = false;
        let currentDeviceId = null;
        let currentResolution = '1080';
        let isStarting = false;
        
        // Smart Mode variables
        let smartModeEnabled = false;
        let smartModeAnimationFrame = null;
        let detectedCorners = null;
        let lockedCorners = null;  // Stores corners when locked
        let cornersLocked = false; // Lock state
        const overlayCanvas = app.querySelector('.camera-overlay-canvas');
        const overlayCtx = overlayCanvas ? overlayCanvas.getContext('2d') : null;
        const smartToggle = app.querySelector('.camera-smart-toggle');
        const smartStatus = app.querySelector('.smart-mode-status');
        const smartBadge = app.querySelector('.camera-smart-badge');
        const smartLockBtn = app.querySelector('.smart-lock-btn');
        const smartLockDesc = app.querySelector('.smart-lock-desc');
        const smartModeDesc = app.querySelector('.smart-mode-desc');
        
        // 8.5 x 11 aspect ratio (letter size)
        const LETTER_ASPECT = 8.5 / 11;
        const MARGIN_PERCENT = 0.03; // 3% margin
        
        // Resolution presets - use exact constraints for reliability
        const resolutions = {
            '4k': { width: 3840, height: 2160, label: '4K' },
            '1080': { width: 1920, height: 1080, label: '1080p' },
            '720': { width: 1280, height: 720, label: '720p' },
            'auto': { width: 4096, height: 2160, label: 'Auto' }
        };
        
        // Show loading state
        const showLoading = (show) => {
            if (show) {
                resolutionBadge.textContent = 'Loading...';
                resolutionBadge.style.color = '#fbbf24';
            } else {
                resolutionBadge.style.color = '#4ade80';
            }
        };
        
        const updateResolutionBadge = () => {
            if (resolutionBadge && video.videoWidth) {
                const w = video.videoWidth, h = video.videoHeight;
                let label = w + '×' + h;
                if (w >= 3840) label = '4K';
                else if (w >= 1920) label = '1080p';
                else if (w >= 1280) label = '720p';
                else label = h + 'p';
                resolutionBadge.textContent = label;
                resolutionBadge.style.color = '#4ade80';
            }
        };
        
        const loadCameraSources = async () => {
            try {
                // First get permission with minimal constraints
                const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
                tempStream.getTracks().forEach(t => t.stop());
                
                // Now enumerate devices
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(d => d.kind === 'videoinput');
                
                sourceSelect.innerHTML = '';
                videoDevices.forEach((device, i) => {
                    const opt = document.createElement('option');
                    opt.value = device.deviceId;
                    opt.textContent = device.label || ('Camera ' + (i + 1));
                    sourceSelect.appendChild(opt);
                });
                
                // Return first device ID, preferring external cameras
                const externalCamera = videoDevices.find(d => 
                    d.label.toLowerCase().includes('hovercam') || 
                    d.label.toLowerCase().includes('solo') ||
                    d.label.toLowerCase().includes('usb') ||
                    d.label.toLowerCase().includes('document')
                );
                
                return externalCamera?.deviceId || videoDevices[0]?.deviceId;
            } catch (err) {
                console.error('Camera enumeration error:', err);
                sourceSelect.innerHTML = '<option>No camera access</option>';
                return null;
            }
        };
        
        const stopCurrentStream = () => {
            if (stream) {
                stream.getTracks().forEach(track => {
                    track.stop();
                });
                stream = null;
            }
            video.srcObject = null;
        };
        
        const startCamera = async (deviceId, resolution = currentResolution, retryCount = 0) => {
            if (isStarting) {
                console.log('Camera already starting, queuing request...');
                // Queue the request
                setTimeout(() => startCamera(deviceId, resolution, 0), 500);
                return;
            }
            isStarting = true;
            
            // Stop any existing stream completely
            stopCurrentStream();
            frozen = false;
            updateFreezeButton(false);
            showLoading(true);
            
            // Longer delay to ensure hardware is fully released
            await new Promise(resolve => setTimeout(resolve, 300));
            
            try {
                const res = resolutions[resolution] || resolutions['1080'];
                
                // Build constraints with EXACT values for more reliable switching
                const constraints = { 
                    video: { 
                        width: { exact: res.width },
                        height: { exact: res.height }
                    },
                    audio: false
                };
                
                if (deviceId) {
                    constraints.video.deviceId = { exact: deviceId };
                }
                
                console.log('Starting camera with constraints:', JSON.stringify(constraints));
                
                // Try exact constraints first
                try {
                    stream = await navigator.mediaDevices.getUserMedia(constraints);
                } catch (exactErr) {
                    console.log('Exact resolution not supported, trying ideal:', exactErr.message);
                    // Fallback to ideal constraints
                    const idealConstraints = {
                        video: {
                            width: { ideal: res.width },
                            height: { ideal: res.height },
                            deviceId: deviceId ? { exact: deviceId } : undefined
                        },
                        audio: false
                    };
                    stream = await navigator.mediaDevices.getUserMedia(idealConstraints);
                }
                
                // Verify we got a stream
                const videoTrack = stream.getVideoTracks()[0];
                if (!videoTrack) {
                    throw new Error('No video track obtained');
                }
                
                // Log actual settings
                const settings = videoTrack.getSettings();
                console.log('Camera started with actual settings:', settings.width + 'x' + settings.height);
                
                // Check if we got the resolution we asked for
                if (resolution !== 'auto' && (settings.width !== res.width || settings.height !== res.height)) {
                    console.log('Requested ' + res.width + 'x' + res.height + ' but got ' + settings.width + 'x' + settings.height);
                }
                
                // Create fresh video element to avoid browser caching
                const newVideo = document.createElement('video');
                newVideo.autoplay = true;
                newVideo.playsInline = true;
                newVideo.muted = true;
                newVideo.className = video.className;
                newVideo.style.cssText = video.style.cssText;
                newVideo.draggable = true;
                
                // Set stream on new video
                newVideo.srcObject = stream;
                
                // Wait for metadata
                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        // Don't reject, just resolve - video might still work
                        console.log('Video metadata timeout, continuing...');
                        resolve();
                    }, 3000);
                    
                    newVideo.onloadedmetadata = () => {
                        clearTimeout(timeout);
                        resolve();
                    };
                });
                
                // Play the video
                try {
                    await newVideo.play();
                } catch (playErr) {
                    console.log('Auto-play blocked, user interaction needed:', playErr.message);
                }
                
                // Replace old video element with new one
                video.replaceWith(newVideo);
                video = newVideo;
                
                // Re-attach drag listener
                video.addEventListener('dragstart', (e) => {
                    const dataUrl = captureSnapshot();
                    if (dataUrl) {
                        e.dataTransfer.setData('text/uri-list', dataUrl);
                        e.dataTransfer.setData('application/x-camera-snapshot', dataUrl);
                    }
                });
                
                // Update state
                currentDeviceId = deviceId;
                currentResolution = resolution;
                
                // Update UI immediately and again after delay
                updateResolutionBadge();
                setTimeout(() => {
                    updateResolutionBadge();
                    applyFocusMode(focusSelect.value);
                }, 500);
                
                isStarting = false;
                
            } catch (err) {
                console.error('Camera error:', err);
                isStarting = false;
                showLoading(false);
                
                // Retry logic for transient failures
                if (retryCount < 2) {
                    console.log('Retrying camera start, attempt', retryCount + 2);
                    await new Promise(resolve => setTimeout(resolve, 800));
                    return startCamera(deviceId, resolution, retryCount + 1);
                }
                
                // If resolution failed, try lower resolution
                if (retryCount === 2) {
                    if (resolution === '4k') {
                        console.log('4K not supported, trying 1080p');
                        resolutionSelect.value = '1080';
                        return startCamera(deviceId, '1080', 0);
                    } else if (resolution === '1080') {
                        console.log('1080p not supported, trying 720p');
                        resolutionSelect.value = '720';
                        return startCamera(deviceId, '720', 0);
                    } else if (resolution !== 'auto') {
                        console.log('Falling back to auto resolution');
                        resolutionSelect.value = 'auto';
                        return startCamera(deviceId, 'auto', 0);
                    }
                }
                
                resolutionBadge.textContent = 'Error';
                resolutionBadge.style.color = '#ef4444';
                if (self && self.showNotification) self.showNotification('Camera error: ' + err.message, 'error');
            }
        };
        
        const applyFocusMode = async (mode) => {
            if (!stream) return;
            const track = stream.getVideoTracks()[0];
            if (!track) return;
            
            try {
                const capabilities = track.getCapabilities();
                if (capabilities.focusMode) {
                    if (mode === 'manual' && capabilities.focusMode.includes('manual')) {
                        await track.applyConstraints({ advanced: [{ focusMode: 'manual' }] });
                        focusSlider.classList.remove('hidden');
                    } else if (capabilities.focusMode.includes('continuous')) {
                        await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] });
                        focusSlider.classList.add('hidden');
                    }
                }
            } catch (err) {
                console.log('Focus mode not supported:', err.message);
            }
        };
        
        const applyFocusDistance = async (value) => {
            if (!stream) return;
            const track = stream.getVideoTracks()[0];
            if (!track) return;
            
            try {
                const capabilities = track.getCapabilities();
                if (capabilities.focusDistance) {
                    const min = capabilities.focusDistance.min;
                    const max = capabilities.focusDistance.max;
                    const distance = min + (max - min) * (value / 100);
                    await track.applyConstraints({ advanced: [{ focusDistance: distance }] });
                }
            } catch (err) {
                console.log('Focus distance not supported');
            }
        };
        
        const updateFreezeButton = (isFrozen) => {
            const btn = optionsMenu.querySelector('[data-action="freeze"]');
            if (btn) btn.classList.toggle('active', isFrozen);
        };
        
        const captureSnapshot = () => {
            if (!stream && !frozen) return null;
            if (!video.videoWidth || !video.videoHeight) return null;
            
            const ctx = canvas.getContext('2d');
            const vw = video.videoWidth, vh = video.videoHeight;
            
            // If Smart Mode is enabled and we have detected corners, apply perspective transform
            if (smartModeEnabled && detectedCorners && detectedCorners.length === 4 && typeof cv !== 'undefined') {
                try {
                    // Create temp canvas at full resolution
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = vw;
                    tempCanvas.height = vh;
                    const tempCtx = tempCanvas.getContext('2d');
                    
                    // Draw video (with mirroring if needed)
                    if (mirrored) {
                        tempCtx.translate(vw, 0);
                        tempCtx.scale(-1, 1);
                    }
                    tempCtx.drawImage(video, 0, 0);
                    
                    // Get image data and create OpenCV mat
                    const imageData = tempCtx.getImageData(0, 0, vw, vh);
                    const src = cv.matFromImageData(imageData);
                    
                    // Apply perspective transform
                    const transformed = applyPerspectiveTransform(src, detectedCorners);
                    
                    if (transformed) {
                        // Set canvas size to transformed image size
                        canvas.width = transformed.cols;
                        canvas.height = transformed.rows;
                        
                        // Draw transformed image to canvas
                        const transformedData = new ImageData(
                            new Uint8ClampedArray(transformed.data),
                            transformed.cols,
                            transformed.rows
                        );
                        ctx.putImageData(transformedData, 0, 0);
                        
                        // Clean up
                        transformed.delete();
                        src.delete();
                        
                        console.log('Smart Mode snapshot captured:', canvas.width + 'x' + canvas.height);
                        return canvas.toDataURL('image/jpeg', 0.95);
                    }
                    
                    src.delete();
                } catch (err) {
                    console.error('Smart Mode snapshot error:', err);
                    // Fall through to normal snapshot
                }
            }
            
            // Normal snapshot (no Smart Mode)
            // Handle rotation
            if (rotation === 90 || rotation === 270) {
                canvas.width = vh;
                canvas.height = vw;
            } else {
                canvas.width = vw;
                canvas.height = vh;
            }
            
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(rotation * Math.PI / 180);
            
            if (mirrored) {
                ctx.scale(-1, 1);
            }
            
            ctx.drawImage(video, -vw / 2, -vh / 2);
            ctx.restore();
            
            return canvas.toDataURL('image/jpeg', 0.95);
        };
        
        // Options toggle
        optionsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            optionsMenu.classList.toggle('hidden');
        });
        
        app.addEventListener('click', () => optionsMenu.classList.add('hidden'));
        optionsMenu.addEventListener('click', (e) => e.stopPropagation());
        
        // Source change - fully restart camera
        sourceSelect.addEventListener('change', (e) => {
            console.log('Camera source changed to:', e.target.value);
            startCamera(e.target.value, currentResolution);
        });
        
        // Resolution change - fully restart camera
        resolutionSelect.addEventListener('change', (e) => {
            console.log('Resolution changed to:', e.target.value);
            startCamera(currentDeviceId, e.target.value);
        });
        
        // Focus mode change
        focusSelect.addEventListener('change', (e) => {
            applyFocusMode(e.target.value);
        });
        
        // Focus slider
        focusSlider.addEventListener('input', (e) => {
            applyFocusDistance(e.target.value);
        });
        
        // Option buttons
        optionsMenu.addEventListener('click', (e) => {
            const btn = e.target.closest('.camera-opt-btn');
            if (!btn) return;
            
            const action = btn.dataset.action;
            
            if (action === 'mirror') {
                mirrored = !mirrored;
                btn.classList.toggle('active', mirrored);
                const transform = [];
                if (mirrored) transform.push('scaleX(-1)');
                if (rotation) transform.push('rotate(' + rotation + 'deg)');
                video.style.transform = transform.join(' ') || '';
                
            } else if (action === 'rotate') {
                rotation = (rotation + 90) % 360;
                btn.classList.toggle('active', rotation !== 0);
                const transform = [];
                if (mirrored) transform.push('scaleX(-1)');
                if (rotation) transform.push('rotate(' + rotation + 'deg)');
                video.style.transform = transform.join(' ') || '';
                
            } else if (action === 'ontop') {
                const isOnTop = windowEl.classList.toggle('always-on-top');
                btn.classList.toggle('active', isOnTop);
                windowEl.style.zIndex = isOnTop ? '99999' : '';
                
            } else if (action === 'freeze') {
                frozen = !frozen;
                updateFreezeButton(frozen);
                if (frozen) {
                    video.pause();
                } else {
                    video.play();
                }
                
            } else if (action === 'snapshot') {
                const dataUrl = captureSnapshot();
                if (dataUrl) {
                    const link = document.createElement('a');
                    link.download = 'snapshot-' + Date.now() + '.jpg';
                    link.href = dataUrl;
                    link.click();
                }
                
            } else if (action === 'fullscreen') {
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                } else {
                    app.requestFullscreen();
                }
            }
        });
        
        // Drag support
        video.draggable = true;
        video.addEventListener('dragstart', (e) => {
            const dataUrl = captureSnapshot();
            if (dataUrl) {
                e.dataTransfer.setData('text/uri-list', dataUrl);
                e.dataTransfer.setData('application/x-camera-snapshot', dataUrl);
            }
        });
        
        // Cleanup
        windowEl.cameraCleanup = () => {
            stopCurrentStream();
        };
        
        // ========== SMART MODE FUNCTIONS ==========
        
        // Wait for OpenCV to be ready
        const waitForOpenCV = () => {
            return new Promise((resolve) => {
                if (typeof cv !== 'undefined' && cv.Mat) {
                    resolve(true);
                } else {
                    const checkInterval = setInterval(() => {
                        if (typeof cv !== 'undefined' && cv.Mat) {
                            clearInterval(checkInterval);
                            resolve(true);
                        }
                    }, 100);
                    // Timeout after 10 seconds
                    setTimeout(() => {
                        clearInterval(checkInterval);
                        resolve(false);
                    }, 10000);
                }
            });
        };
        
        // Detect document corners using OpenCV
        const detectDocumentCorners = (srcMat) => {
            if (typeof cv === 'undefined') return null;
            
            try {
                // Convert to grayscale
                const gray = new cv.Mat();
                cv.cvtColor(srcMat, gray, cv.COLOR_RGBA2GRAY);
                
                // Apply Gaussian blur to reduce noise
                const blurred = new cv.Mat();
                cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
                
                // Apply Canny edge detection
                const edges = new cv.Mat();
                cv.Canny(blurred, edges, 50, 150);
                
                // Dilate edges to connect gaps
                const dilated = new cv.Mat();
                const kernel = cv.Mat.ones(3, 3, cv.CV_8U);
                cv.dilate(edges, dilated, kernel);
                
                // Find contours
                const contours = new cv.MatVector();
                const hierarchy = new cv.Mat();
                cv.findContours(dilated, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
                
                // Find the largest quadrilateral contour
                let maxArea = 0;
                let bestContour = null;
                let bestApprox = null;
                
                const imageArea = srcMat.rows * srcMat.cols;
                const minArea = imageArea * 0.1; // At least 10% of image
                
                for (let i = 0; i < contours.size(); i++) {
                    const contour = contours.get(i);
                    const area = cv.contourArea(contour);
                    
                    if (area > minArea && area > maxArea) {
                        // Approximate contour to polygon
                        const approx = new cv.Mat();
                        const peri = cv.arcLength(contour, true);
                        cv.approxPolyDP(contour, approx, 0.02 * peri, true);
                        
                        // Check if it's a quadrilateral
                        if (approx.rows === 4) {
                            // Check if it's convex
                            if (cv.isContourConvex(approx)) {
                                maxArea = area;
                                if (bestApprox) bestApprox.delete();
                                bestApprox = approx;
                                bestContour = contour;
                            } else {
                                approx.delete();
                            }
                        } else {
                            approx.delete();
                        }
                    }
                }
                
                // Clean up
                gray.delete();
                blurred.delete();
                edges.delete();
                dilated.delete();
                kernel.delete();
                hierarchy.delete();
                
                if (bestApprox && bestApprox.rows === 4) {
                    // Extract corners
                    const corners = [];
                    for (let i = 0; i < 4; i++) {
                        corners.push({
                            x: bestApprox.data32S[i * 2],
                            y: bestApprox.data32S[i * 2 + 1]
                        });
                    }
                    
                    // Order corners: top-left, top-right, bottom-right, bottom-left
                    const orderedCorners = orderCorners(corners);
                    
                    bestApprox.delete();
                    for (let i = 0; i < contours.size(); i++) {
                        contours.get(i).delete();
                    }
                    contours.delete();
                    
                    return orderedCorners;
                }
                
                // Clean up contours
                for (let i = 0; i < contours.size(); i++) {
                    contours.get(i).delete();
                }
                contours.delete();
                if (bestApprox) bestApprox.delete();
                
                return null;
            } catch (err) {
                console.error('Corner detection error:', err);
                return null;
            }
        };
        
        // Order corners consistently: TL, TR, BR, BL
        const orderCorners = (corners) => {
            // Find center
            const center = corners.reduce((acc, c) => ({ x: acc.x + c.x / 4, y: acc.y + c.y / 4 }), { x: 0, y: 0 });
            
            // Sort by angle from center
            const sorted = corners.map(c => ({
                ...c,
                angle: Math.atan2(c.y - center.y, c.x - center.x)
            })).sort((a, b) => a.angle - b.angle);
            
            // Find top-left (smallest x+y sum)
            let tlIndex = 0;
            let minSum = Infinity;
            sorted.forEach((c, i) => {
                const sum = c.x + c.y;
                if (sum < minSum) {
                    minSum = sum;
                    tlIndex = i;
                }
            });
            
            // Rotate array so TL is first
            const result = [];
            for (let i = 0; i < 4; i++) {
                const corner = sorted[(tlIndex + i) % 4];
                result.push({ x: corner.x, y: corner.y });
            }
            
            return result;
        };
        
        // Apply perspective transform to get de-skewed 8.5x11 image
        // Automatically rotates landscape documents to portrait for maximum pixel utilization
        const applyPerspectiveTransform = (srcMat, corners) => {
            if (typeof cv === 'undefined' || !corners || corners.length !== 4) return null;
            
            try {
                // Calculate document dimensions from corners
                const width1 = Math.hypot(corners[1].x - corners[0].x, corners[1].y - corners[0].y);
                const width2 = Math.hypot(corners[2].x - corners[3].x, corners[2].y - corners[3].y);
                const height1 = Math.hypot(corners[3].x - corners[0].x, corners[3].y - corners[0].y);
                const height2 = Math.hypot(corners[2].x - corners[1].x, corners[2].y - corners[1].y);
                
                const docWidth = Math.max(width1, width2);
                const docHeight = Math.max(height1, height2);
                
                // Check if document is landscape (wider than tall)
                const isLandscape = docWidth > docHeight;
                
                // Always output in portrait orientation (taller than wide)
                // This maximizes pixel usage when user rotates paper to match camera aspect ratio
                let outWidth, outHeight;
                if (isLandscape) {
                    // Document is landscape - we'll rotate it 90° CCW to portrait
                    // Use the document width (which becomes height after rotation) to determine size
                    outHeight = Math.round(docWidth);
                    outWidth = Math.round(outHeight * (8.5 / 11));
                } else {
                    // Document is already portrait
                    outHeight = Math.round(docHeight);
                    outWidth = Math.round(outHeight * (8.5 / 11));
                }
                
                // Add margin
                const marginX = Math.round(outWidth * MARGIN_PERCENT);
                const marginY = Math.round(outHeight * MARGIN_PERCENT);
                outWidth += marginX * 2;
                outHeight += marginY * 2;
                
                // Source points (detected corners: TL, TR, BR, BL)
                const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
                    corners[0].x, corners[0].y,
                    corners[1].x, corners[1].y,
                    corners[2].x, corners[2].y,
                    corners[3].x, corners[3].y
                ]);
                
                // Destination points - if landscape, rotate 90° counter-clockwise
                // This maps: TL->BL, TR->TL, BR->TR, BL->BR (90° CCW rotation)
                let dstPoints;
                if (isLandscape) {
                    // Rotate 90° CCW: source corners map to rotated positions
                    // TL(0) -> BL, TR(1) -> TL, BR(2) -> TR, BL(3) -> BR
                    dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
                        marginX, outHeight - marginY,           // TL -> BL
                        marginX, marginY,                       // TR -> TL  
                        outWidth - marginX, marginY,            // BR -> TR
                        outWidth - marginX, outHeight - marginY // BL -> BR
                    ]);
                } else {
                    // No rotation needed - standard mapping
                    dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
                        marginX, marginY,
                        outWidth - marginX, marginY,
                        outWidth - marginX, outHeight - marginY,
                        marginX, outHeight - marginY
                    ]);
                }
                
                // Get perspective transform matrix
                const M = cv.getPerspectiveTransform(srcPoints, dstPoints);
                
                // Apply transform
                const dst = new cv.Mat();
                cv.warpPerspective(srcMat, dst, M, new cv.Size(outWidth, outHeight), cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar(255, 255, 255, 255));
                
                // Clean up
                srcPoints.delete();
                dstPoints.delete();
                M.delete();
                
                return dst;
            } catch (err) {
                console.error('Perspective transform error:', err);
                return null;
            }
        };
        
        // Draw detected corners on overlay canvas
        const drawCornerOverlay = (corners) => {
            if (!overlayCanvas || !overlayCtx) return;
            
            // Match overlay canvas size to video display size
            const rect = video.getBoundingClientRect();
            overlayCanvas.width = rect.width;
            overlayCanvas.height = rect.height;
            
            // Calculate scale factors
            const scaleX = rect.width / video.videoWidth;
            const scaleY = rect.height / video.videoHeight;
            
            // Clear previous drawing
            overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
            
            if (!corners || corners.length !== 4) return;
            
            // Scale corners to display size
            const scaledCorners = corners.map(c => ({
                x: c.x * scaleX,
                y: c.y * scaleY
            }));
            
            // Draw semi-transparent overlay outside document
            overlayCtx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            overlayCtx.fillRect(0, 0, overlayCanvas.width, overlayCanvas.height);
            
            // Cut out document area
            overlayCtx.globalCompositeOperation = 'destination-out';
            overlayCtx.beginPath();
            overlayCtx.moveTo(scaledCorners[0].x, scaledCorners[0].y);
            for (let i = 1; i < 4; i++) {
                overlayCtx.lineTo(scaledCorners[i].x, scaledCorners[i].y);
            }
            overlayCtx.closePath();
            overlayCtx.fill();
            overlayCtx.globalCompositeOperation = 'source-over';
            
            // Draw corner markers
            overlayCtx.strokeStyle = '#10b981';
            overlayCtx.lineWidth = 3;
            overlayCtx.lineJoin = 'round';
            
            // Draw document outline
            overlayCtx.beginPath();
            overlayCtx.moveTo(scaledCorners[0].x, scaledCorners[0].y);
            for (let i = 1; i < 4; i++) {
                overlayCtx.lineTo(scaledCorners[i].x, scaledCorners[i].y);
            }
            overlayCtx.closePath();
            overlayCtx.stroke();
            
            // Draw corner circles
            overlayCtx.fillStyle = '#10b981';
            scaledCorners.forEach(corner => {
                overlayCtx.beginPath();
                overlayCtx.arc(corner.x, corner.y, 8, 0, Math.PI * 2);
                overlayCtx.fill();
                overlayCtx.strokeStyle = 'white';
                overlayCtx.lineWidth = 2;
                overlayCtx.stroke();
            });
        };
        
        // Smart Mode processing loop
        const processSmartMode = () => {
            if (!smartModeEnabled || !video.videoWidth || frozen) {
                if (overlayCtx) overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
                video.style.opacity = '1';
                return;
            }
            
            try {
                // Create temporary canvas for processing at full resolution (for transform quality)
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = video.videoWidth;
                tempCanvas.height = video.videoHeight;
                const tempCtx = tempCanvas.getContext('2d');
                
                // Apply mirroring if needed
                if (mirrored) {
                    tempCtx.translate(tempCanvas.width, 0);
                    tempCtx.scale(-1, 1);
                }
                
                tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
                
                // Get image data at full resolution for transform
                const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                const src = cv.matFromImageData(imageData);
                
                // Use locked corners if available, otherwise detect
                let cornersToUse = null;
                
                if (cornersLocked && lockedCorners) {
                    // Use the locked corners (already at full resolution)
                    cornersToUse = lockedCorners;
                    detectedCorners = lockedCorners;
                } else {
                    // Detect corners using lower resolution for speed
                    const detectScale = 0.5;
                    const detectCanvas = document.createElement('canvas');
                    detectCanvas.width = video.videoWidth * detectScale;
                    detectCanvas.height = video.videoHeight * detectScale;
                    const detectCtx = detectCanvas.getContext('2d');
                    
                    if (mirrored) {
                        detectCtx.translate(detectCanvas.width, 0);
                        detectCtx.scale(-1, 1);
                    }
                    detectCtx.drawImage(video, 0, 0, detectCanvas.width, detectCanvas.height);
                    
                    const detectImageData = detectCtx.getImageData(0, 0, detectCanvas.width, detectCanvas.height);
                    const detectSrc = cv.matFromImageData(detectImageData);
                    
                    const corners = detectDocumentCorners(detectSrc);
                    detectSrc.delete();
                    
                    if (corners) {
                        // Scale corners back to full resolution
                        cornersToUse = corners.map(c => ({
                            x: c.x / detectScale,
                            y: c.y / detectScale
                        }));
                        detectedCorners = cornersToUse;
                    }
                }
                
                if (cornersToUse) {
                    // Apply perspective transform for live preview (using full res corners)
                    const transformed = applyPerspectiveTransform(src, cornersToUse);
                    
                    if (transformed) {
                        // Hide the video and show the transformed preview on overlay canvas
                        video.style.opacity = '0';
                        
                        // Size the overlay canvas to fit the container while maintaining aspect ratio
                        const containerRect = app.getBoundingClientRect();
                        const docAspect = transformed.cols / transformed.rows;
                        const containerAspect = containerRect.width / containerRect.height;
                        
                        let displayWidth, displayHeight, offsetX, offsetY;
                        
                        if (docAspect > containerAspect) {
                            // Document is wider - fit to width
                            displayWidth = containerRect.width;
                            displayHeight = containerRect.width / docAspect;
                            offsetX = 0;
                            offsetY = (containerRect.height - displayHeight) / 2;
                        } else {
                            // Document is taller - fit to height
                            displayHeight = containerRect.height;
                            displayWidth = containerRect.height * docAspect;
                            offsetX = (containerRect.width - displayWidth) / 2;
                            offsetY = 0;
                        }
                        
                        overlayCanvas.width = containerRect.width;
                        overlayCanvas.height = containerRect.height;
                        
                        // Fill background
                        overlayCtx.fillStyle = '#1a1a2e';
                        overlayCtx.fillRect(0, 0, overlayCanvas.width, overlayCanvas.height);
                        
                        // Draw transformed document
                        const transformedData = new ImageData(
                            new Uint8ClampedArray(transformed.data),
                            transformed.cols,
                            transformed.rows
                        );
                        
                        // Create temp canvas for the transformed image
                        const previewCanvas = document.createElement('canvas');
                        previewCanvas.width = transformed.cols;
                        previewCanvas.height = transformed.rows;
                        previewCanvas.getContext('2d').putImageData(transformedData, 0, 0);
                        
                        // Draw scaled to fit
                        overlayCtx.drawImage(previewCanvas, offsetX, offsetY, displayWidth, displayHeight);
                        
                        // Draw border - different color if locked
                        overlayCtx.strokeStyle = cornersLocked ? '#f59e0b' : '#10b981';
                        overlayCtx.lineWidth = 2;
                        overlayCtx.strokeRect(offsetX, offsetY, displayWidth, displayHeight);
                        
                        // Show lock indicator
                        if (cornersLocked) {
                            overlayCtx.fillStyle = 'rgba(245, 158, 11, 0.9)';
                            overlayCtx.font = 'bold 14px system-ui';
                            overlayCtx.fillText('🔒 LOCKED', offsetX + 10, offsetY + 24);
                        }
                        
                        transformed.delete();
                    } else {
                        // Transform failed, show corner overlay instead
                        video.style.opacity = '1';
                        drawCornerOverlay(detectedCorners);
                    }
                } else {
                    detectedCorners = null;
                    video.style.opacity = '1';
                    if (overlayCtx) overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
                }
                
                src.delete();
            } catch (err) {
                console.error('Smart mode processing error:', err);
                video.style.opacity = '1';
            }
            
            // Continue processing loop (throttled to ~15fps for smoother preview)
            smartModeAnimationFrame = setTimeout(() => {
                requestAnimationFrame(processSmartMode);
            }, 66);
        };
        
        // Start Smart Mode
        const startSmartMode = async () => {
            const cvReady = await waitForOpenCV();
            if (!cvReady) {
                console.error('OpenCV not available');
                if (self && self.showNotification) {
                    self.showNotification('Smart Mode requires OpenCV - please refresh', 'error');
                }
                smartToggle.checked = false;
                return;
            }
            
            smartModeEnabled = true;
            app.classList.add('smart-mode-active');
            if (smartBadge) smartBadge.classList.remove('hidden');
            if (smartStatus) smartStatus.textContent = 'On';
            
            processSmartMode();
        };
        
        // Stop Smart Mode
        const stopSmartMode = () => {
            smartModeEnabled = false;
            app.classList.remove('smart-mode-active');
            if (smartBadge) smartBadge.classList.add('hidden');
            if (smartStatus) smartStatus.textContent = 'Off';
            
            if (smartModeAnimationFrame) {
                clearTimeout(smartModeAnimationFrame);
                smartModeAnimationFrame = null;
            }
            
            if (overlayCtx) {
                overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
            }
            
            // Restore video visibility
            video.style.opacity = '1';
            
            // Clear lock state
            cornersLocked = false;
            lockedCorners = null;
            if (smartLockBtn) smartLockBtn.classList.remove('active');
            if (smartLockDesc) smartLockDesc.classList.add('hidden');
            if (smartModeDesc) smartModeDesc.classList.remove('hidden');
            
            detectedCorners = null;
        };
        
        // Smart Mode toggle handler
        if (smartToggle) {
            smartToggle.addEventListener('change', (e) => {
                if (e.target.checked) {
                    startSmartMode();
                } else {
                    stopSmartMode();
                }
            });
        }
        
        // Lock button handler
        if (smartLockBtn) {
            smartLockBtn.addEventListener('click', () => {
                if (!smartModeEnabled) {
                    // If Smart Mode is off, enable it first
                    smartToggle.checked = true;
                    startSmartMode();
                    return;
                }
                
                if (cornersLocked) {
                    // Currently locked - unlock and re-detect once
                    cornersLocked = false;
                    lockedCorners = null;
                    smartLockBtn.classList.remove('active');
                    if (smartLockDesc) smartLockDesc.classList.add('hidden');
                    if (smartModeDesc) smartModeDesc.classList.remove('hidden');
                    
                    // Briefly unlock to detect new corners, then lock again
                    setTimeout(() => {
                        if (detectedCorners && detectedCorners.length === 4) {
                            lockedCorners = [...detectedCorners];
                            cornersLocked = true;
                            smartLockBtn.classList.add('active');
                            if (smartLockDesc) smartLockDesc.classList.remove('hidden');
                            if (smartModeDesc) smartModeDesc.classList.add('hidden');
                        }
                    }, 500); // Give time for one detection cycle
                } else {
                    // Not locked - lock current corners
                    if (detectedCorners && detectedCorners.length === 4) {
                        lockedCorners = [...detectedCorners];
                        cornersLocked = true;
                        smartLockBtn.classList.add('active');
                        if (smartLockDesc) smartLockDesc.classList.remove('hidden');
                        if (smartModeDesc) smartModeDesc.classList.add('hidden');
                    } else {
                        // No corners detected yet
                        if (self && self.showNotification) {
                            self.showNotification('Position document in view first', 'warning');
                        }
                    }
                }
            });
        }
        
        // ========== END SMART MODE FUNCTIONS ==========
        
        // Auto-start with 1080p - with retry logic
        const initializeCamera = async () => {
            showLoading(true);
            const deviceId = await loadCameraSources();
            if (deviceId) {
                // Select the device in dropdown
                sourceSelect.value = deviceId;
                await startCamera(deviceId, '1080');
            } else {
                showLoading(false);
                resolutionBadge.textContent = 'No Camera';
                resolutionBadge.style.color = '#ef4444';
            }
        };
        
        initializeCamera();
    }


    initFiles(windowEl) {
        const filesGrid = windowEl.querySelector('.files-grid');
        const filesEmpty = windowEl.querySelector('.files-empty');
        const filesDropzone = windowEl.querySelector('.files-dropzone');
        const filesContainer = windowEl.querySelector('.files-container');
        const pathDisplay = windowEl.querySelector('.files-path');
        const statusText = windowEl.querySelector('.files-status');
        const uploadInput = windowEl.querySelector('.files-upload-input');
        const self = this;
        
        let currentPath = '';
        let currentFiles = [];
        let currentFolders = [];
        let isInSharedFolder = false;
        let sharedFolderAvailable = false;
        let organizationDomain = null;
        
        // Check if user has access to shared folder
        const checkSharedFolder = async () => {
            try {
                const response = await self.api('/shared');
                sharedFolderAvailable = response.available;
                organizationDomain = response.organization || null;
            } catch (e) {
                sharedFolderAvailable = false;
            }
        };
        
        // Load files from S3 (or shared folder)
        const loadFiles = async () => {
            statusText.textContent = 'Loading...';
            try {
                let response;
                if (isInSharedFolder) {
                    // Load from shared folder
                    const sharedPath = currentPath.replace('Shared/', '');
                    response = await self.api('/shared?folder=' + encodeURIComponent(sharedPath));
                } else {
                    response = await self.api('/files?folder=' + encodeURIComponent(currentPath));
                }
                currentFolders = response.folders || [];
                currentFiles = response.files || [];
                renderFiles();
                statusText.textContent = 'Ready';
            } catch (error) {
                console.error('Failed to load files:', error);
                statusText.textContent = 'Failed to load files';
                currentFolders = [];
                currentFiles = [];
                renderFiles();
            }
        };
        
        // Render files and folders
        const renderFiles = () => {
            // Check if we should show shared folder (at root level and if available)
            const showSharedFolder = !currentPath && sharedFolderAvailable && !isInSharedFolder;
            const hasContent = currentFolders.length > 0 || currentFiles.length > 0 || showSharedFolder;
            
            if (!hasContent) {
                filesGrid.innerHTML = '';
                filesEmpty.classList.remove('hidden');
            } else {
                filesEmpty.classList.add('hidden');
                
                let html = '';
                
                // Show Shared folder at root level if available
                if (showSharedFolder) {
                    html += '<div class="file-item folder-item shared-folder-item" data-type="shared-folder" data-path="Shared">' +
                        '<div class="file-icon shared-folder-icon">' +
                            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                                '<path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>' +
                                '<circle cx="18" cy="6" r="4" fill="#10b981" stroke="#10b981"/>' +
                                '<path d="M18 4v4M16 6h4" stroke="white" stroke-width="1.5"/>' +
                            '</svg>' +
                        '</div>' +
                        '<span class="file-name">Shared (' + organizationDomain + ')</span>' +
                    '</div>';
                }
                
                // Render regular folders
                currentFolders.forEach(folder => {
                    html += '<div class="file-item folder-item" data-type="folder" data-path="' + folder.name + '">' +
                        '<div class="file-icon folder-icon">' +
                            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>' +
                        '</div>' +
                        '<span class="file-name">' + folder.name + '</span>' +
                    '</div>';
                });
                
                // Render files
                currentFiles.forEach((file, index) => {
                    const isImage = file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                    const isPDF = file.name.match(/\.pdf$/i);
                    let fileIconHtml;
                    
                    if (isImage) {
                        fileIconHtml = '<img src="" alt="' + file.name + '" data-path="' + file.path + '" class="file-thumbnail">';
                    } else if (isPDF) {
                        fileIconHtml = '<svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><text x="7" y="17" font-size="6" fill="#ef4444" stroke="none" font-weight="bold">PDF</text></svg>';
                    } else {
                        fileIconHtml = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
                    }
                    
                    html += '<div class="file-item' + (isPDF ? ' pdf-file' : '') + '" data-type="file" data-index="' + index + '" data-path="' + file.path + '" data-name="' + file.name + '" draggable="true">' +
                        '<div class="file-icon' + (isImage ? ' image-icon' : '') + '">' +
                            fileIconHtml +
                        '</div>' +
                        '<span class="file-name">' + file.name + '</span>' +
                    '</div>';
                });
                
                filesGrid.innerHTML = html;
                
                // Load thumbnails for images and store signed URLs
                filesGrid.querySelectorAll('.file-thumbnail').forEach(async img => {
                    try {
                        const endpoint = isInSharedFolder ? '/shared/url' : '/files/url';
                        const response = await self.api(endpoint + '?path=' + encodeURIComponent(img.dataset.path));
                        img.src = response.url;
                        // Store the signed URL on the parent file-item for drag operations
                        const fileItem = img.closest('.file-item');
                        if (fileItem) {
                            fileItem.dataset.signedUrl = response.url;
                        }
                    } catch (e) {
                        console.error('Failed to load thumbnail:', e);
                    }
                });
                
                // Add click handlers for folders (including shared folder)
                filesGrid.querySelectorAll('.folder-item').forEach(item => {
                    item.addEventListener('dblclick', () => {
                        const folderType = item.dataset.type;
                        const folderName = item.dataset.path;
                        
                        if (folderType === 'shared-folder') {
                            // Entering shared folder
                            isInSharedFolder = true;
                            currentPath = '';
                            updatePath();
                            loadFiles();
                        } else {
                            // Regular folder navigation
                            currentPath = currentPath ? currentPath + '/' + folderName : folderName;
                            updatePath();
                            loadFiles();
                        }
                    });
                    
                    // Add drop handlers for moving files into folders
                    item.addEventListener('dragover', (e) => {
                        if (e.dataTransfer.types.includes('application/hovercam-file')) {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                            item.classList.add('drop-target');
                        }
                    });
                    
                    item.addEventListener('dragleave', () => {
                        item.classList.remove('drop-target');
                    });
                    
                    item.addEventListener('drop', async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        item.classList.remove('drop-target');
                        const hovercamFile = e.dataTransfer.getData('application/hovercam-file');
                        
                        if (hovercamFile) {
                            try {
                                const fileData = JSON.parse(hovercamFile);
                                const folderType = item.dataset.type;
                                const folderName = item.dataset.path;
                                
                                let targetPath;
                                let endpoint;
                                
                                if (folderType === 'shared-folder') {
                                    // Moving to shared folder root
                                    targetPath = '';
                                    endpoint = '/shared/move';
                                } else {
                                    // Moving to a regular folder
                                    targetPath = currentPath ? currentPath + '/' + folderName : folderName;
                                    endpoint = isInSharedFolder ? '/shared/move' : '/files/move';
                                }
                                statusText.textContent = 'Moving: ' + fileData.name;
                                
                                const response = await self.api(endpoint, {
                                    method: 'POST',
                                    body: JSON.stringify({
                                        sourceKey: fileData.key,
                                        destinationFolder: targetPath
                                    })
                                });
                                statusText.textContent = 'Moved: ' + fileData.name;
                                await loadFiles();
                                
                                if (fileData.source === 'desktop') {
                                    await self.renderDesktopIcons();
                                }
                            } catch (err) {
                                console.error('Failed to move file:', err);
                                statusText.textContent = 'Failed to move file';
                            }
                        }
                    });
                });
                
                // Add double-click handlers for files (images and PDFs)
                filesGrid.querySelectorAll('.file-item[data-type="file"]').forEach(item => {
                    item.addEventListener('dblclick', async () => {
                        const fileName = item.dataset.name;
                        const filePath = item.dataset.path;
                        const isImage = fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                        const isPDF = fileName.match(/\.pdf$/i);
                        const isHTML = fileName.match(/\.html?$/i);
                        
                        if (isImage || isPDF || isHTML) {
                            try {
                                // Get signed URL for the file
                                const endpoint = isInSharedFolder ? '/shared/url' : '/files/url';
                                const response = await self.api(endpoint + '?path=' + encodeURIComponent(filePath));
                                const url = response.url;
                                
                                if (isImage) {
                                    self.openImageViewer(fileName, url);
                                } else if (isPDF) {
                                    self.openPDFViewer(fileName, url);
                                } else if (isHTML) {
                                    self.openBrowserWithUrl(url);
                                }
                            } catch (error) {
                                console.error('Failed to open file:', error);
                                self.showNotification('Failed to open file', 'error');
                            }
                        }
                    });
                });
                
                // Add drag handlers for all files
                filesGrid.querySelectorAll('.file-item[data-type="file"]').forEach(item => {
                    item.addEventListener('dragstart', (e) => {
                        const fileName = item.dataset.name;
                        const filePath = item.dataset.path;
                        const isImage = fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                        
                        // Set file move data for all files
                        const fileData = {
                            key: filePath,
                            name: fileName,
                            type: isImage ? 'image' : 'file',
                            source: 'files',
                            sourceFolder: currentPath
                        };
                        e.dataTransfer.setData('application/hovercam-file', JSON.stringify(fileData));
                        e.dataTransfer.effectAllowed = 'move';
                        item.classList.add('dragging');
                        
                        // For images, also set the signed URL if available
                        const signedUrl = item.dataset.signedUrl;
                        if (signedUrl) {
                            e.dataTransfer.setData('text/plain', signedUrl);
                            e.dataTransfer.setData('application/hovercam-image', JSON.stringify({
                                name: fileName,
                                url: signedUrl
                            }));
                        }
                    });
                    
                    item.addEventListener('dragend', (e) => {
                        item.classList.remove('dragging');
                    });
                });
                
                // Add context menu for delete
                filesGrid.querySelectorAll('.file-item').forEach(item => {
                    item.addEventListener('contextmenu', (e) => {
                        e.preventDefault();
                        showContextMenu(e, item);
                    });
                });
            }
        };
        
        // Update path display
        const updatePath = () => {
            const parts = currentPath.split('/').filter(p => p);
            let html = '';
            
            if (isInSharedFolder) {
                // Shared folder path display
                html = '<span class="path-segment path-shared" data-path="" data-shared="exit">My Files</span>';
                html += '<span class="path-sep">/</span><span class="path-segment path-shared-active" data-path="" data-shared="root">🔗 Shared (' + organizationDomain + ')</span>';
                let buildPath = '';
                parts.forEach(part => {
                    buildPath = buildPath ? buildPath + '/' + part : part;
                    html += '<span class="path-sep">/</span><span class="path-segment" data-path="' + buildPath + '">' + part + '</span>';
                });
            } else {
                // Regular path display
                html = '<span class="path-segment" data-path="">My Files</span>';
                let buildPath = '';
                parts.forEach(part => {
                    buildPath = buildPath ? buildPath + '/' + part : part;
                    html += '<span class="path-sep">/</span><span class="path-segment" data-path="' + buildPath + '">' + part + '</span>';
                });
            }
            
            pathDisplay.innerHTML = html;
            
            // Add click handlers
            pathDisplay.querySelectorAll('.path-segment').forEach(seg => {
                seg.addEventListener('click', () => {
                    if (seg.dataset.shared === 'exit') {
                        // Exit shared folder, go to My Files root
                        isInSharedFolder = false;
                        currentPath = '';
                    } else if (seg.dataset.shared === 'root') {
                        // Go to shared folder root
                        currentPath = '';
                    } else {
                        currentPath = seg.dataset.path;
                    }
                    updatePath();
                    loadFiles();
                });
            });
        };
        
        // Context menu
        const showContextMenu = (e, item) => {
            // Remove existing menu
            const existingMenu = document.querySelector('.files-context-menu');
            if (existingMenu) existingMenu.remove();
            
            const menu = document.createElement('div');
            menu.className = 'files-context-menu';
            menu.innerHTML = '<button data-action="delete">Delete</button>';
            menu.style.left = e.clientX + 'px';
            menu.style.top = e.clientY + 'px';
            document.body.appendChild(menu);
            
            menu.querySelector('[data-action="delete"]').addEventListener('click', async () => {
                const type = item.dataset.type;
                let pathToDelete;
                
                if (type === 'folder') {
                    pathToDelete = currentPath ? currentPath + '/' + item.dataset.path : item.dataset.path;
                } else {
                    // Extract relative path from full S3 path
                    const fullPath = item.dataset.path;
                    const filesIndex = fullPath.indexOf('/files/');
                    pathToDelete = filesIndex !== -1 ? fullPath.substring(filesIndex + 7) : fullPath;
                }
                
                statusText.textContent = 'Deleting...';
                try {
                    if (isInSharedFolder) {
                        // Delete from shared folder
                        await self.api('/shared', {
                            method: 'DELETE',
                            body: JSON.stringify({ path: pathToDelete, type })
                        });
                    } else {
                        // Delete from user's folder
                        await self.api('/files', {
                            method: 'DELETE',
                            body: JSON.stringify({ path: pathToDelete, type })
                        });
                    }
                    statusText.textContent = 'Deleted successfully';
                    loadFiles();
                } catch (error) {
                    console.error('Delete failed:', error);
                    statusText.textContent = 'Failed to delete';
                }
                menu.remove();
            });
            
            // Close menu on click outside
            setTimeout(() => {
                document.addEventListener('click', function closeMenu() {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                });
            }, 10);
        };
        
        // Create new folder
        const createFolder = async () => {
            const name = prompt('Enter folder name:');
            if (name && name.trim()) {
                const folderName = name.trim();
                statusText.textContent = 'Creating folder...';
                try {
                    if (isInSharedFolder) {
                        // Create in shared folder - API expects name and path separately
                        await self.api('/shared/folder', {
                            method: 'POST',
                            body: JSON.stringify({ name: folderName, path: currentPath })
                        });
                    } else {
                        // Create in user's folder - API expects full path
                        const folderPath = currentPath ? currentPath + '/' + folderName : folderName;
                        await self.api('/files/folder', {
                            method: 'POST',
                            body: JSON.stringify({ path: folderPath })
                        });
                    }
                    statusText.textContent = 'Folder created: ' + folderName;
                    loadFiles();
                } catch (error) {
                    console.error('Failed to create folder:', error);
                    statusText.textContent = 'Failed to create folder';
                }
            }
        };
        
        // Handle file upload
        const handleFileUpload = async (fileList) => {
            for (const file of fileList) {
                const isImage = file.type.startsWith('image/'); const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'); if (isImage || isPDF) {
                    statusText.textContent = 'Uploading: ' + file.name;
                    
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('folder', currentPath);
                    
                    try {
                        console.log('Uploading to folder:', currentPath, 'isShared:', isInSharedFolder);
                        const endpoint = isInSharedFolder ? '/api/shared/upload' : '/api/files/upload?folder=' + encodeURIComponent(currentPath);
                        const response = await fetch(endpoint, {
                            method: 'POST',
                            headers: {
                                'Authorization': 'Bearer ' + self.token
                            },
                            body: formData
                        });
                        
                        console.log('Upload response status:', response.status);
                        if (!response.ok) {
                            const errorData = await response.json().catch(() => ({}));
                            console.error('Upload error response:', errorData);
                            throw new Error(errorData.error || 'Upload failed');
                        }
                        
                        statusText.textContent = 'Uploaded: ' + file.name;
                        // Small delay to ensure S3 consistency, then reload
                        await new Promise(r => setTimeout(r, 500));
                        await loadFiles();
                    } catch (error) {
                        console.error('Upload failed:', error);
                        statusText.textContent = 'Failed to upload: ' + file.name;
                    }
                } else {
                    statusText.textContent = 'Only images and PDFs are supported';
                }
            }
        };
        
        // Drag and drop handlers
        filesContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            filesDropzone.classList.add('active');
        });
        
        filesContainer.addEventListener('dragleave', (e) => {
            if (!filesContainer.contains(e.relatedTarget)) {
                filesDropzone.classList.remove('active');
            }
        });
        
        filesContainer.addEventListener('drop', async (e) => {
            e.preventDefault();
            filesDropzone.classList.remove('active');
            
            // Check for file move from desktop or another folder
            const hovercamFile = e.dataTransfer.getData('application/hovercam-file');
            if (hovercamFile) {
                try {
                    const fileData = JSON.parse(hovercamFile);
                    statusText.textContent = 'Moving: ' + fileData.name;
                    
                    // Use appropriate endpoint for shared vs regular folders
                    const endpoint = isInSharedFolder ? '/shared/move' : '/files/move';
                    const response = await self.api(endpoint, {
                        method: 'POST',
                        body: JSON.stringify({
                            sourceKey: fileData.key,
                            destinationFolder: currentPath
                        })
                    });
                    
                    statusText.textContent = 'Moved: ' + fileData.name;
                    await loadFiles();
                    
                    // Refresh desktop if file came from there
                    if (fileData.source === 'desktop') {
                        await self.renderDesktopIcons();
                    }
                } catch (err) {
                    console.error('Failed to move file:', err);
                    statusText.textContent = 'Failed to move file';
                }
                return;
            }
            
            // Check for camera snapshot
            const dataUrl = e.dataTransfer.getData('application/x-camera-snapshot') ||
                           e.dataTransfer.getData('text/uri-list') ||
                           e.dataTransfer.getData('text/plain');
            
            if (dataUrl && dataUrl.startsWith('data:image')) {
                // Convert data URL to file and upload
                try {
                    const response = await fetch(dataUrl);
                    const blob = await response.blob();
                    const filename = `snapshot-${Date.now()}.jpg`;
                    const file = new File([blob], filename, { type: 'image/jpeg' });
                    handleFileUpload([file]);
                } catch (err) {
                    console.error('Failed to upload camera snapshot:', err);
                }
                return;
            }
            
            if (e.dataTransfer.files.length > 0) {
                handleFileUpload(e.dataTransfer.files);
            }
        });
        
        // Upload button
        windowEl.querySelector('[data-action="upload"]').addEventListener('click', () => {
            uploadInput.click();
        });
        
        uploadInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileUpload(e.target.files);
                e.target.value = '';
            }
        });
        
        // New folder button
        windowEl.querySelector('[data-action="newfolder"]').addEventListener('click', createFolder);
        
        // Navigation buttons
        windowEl.querySelector('[data-action="back"]').addEventListener('click', () => {
            if (currentPath) {
                // Navigate up within current context
                const lastSlash = currentPath.lastIndexOf('/');
                currentPath = lastSlash > 0 ? currentPath.substring(0, lastSlash) : '';
                updatePath();
                loadFiles();
            } else if (isInSharedFolder) {
                // Exit shared folder when at its root
                isInSharedFolder = false;
                currentPath = '';
                updatePath();
                loadFiles();
            }
        });
        
        windowEl.querySelector('[data-action="home"]').addEventListener('click', () => {
            // Always go to My Files root
            isInSharedFolder = false;
            currentPath = '';
            updatePath();
            loadFiles();
        });
        
        // Initial load - wait for shared folder check
        checkSharedFolder().then(() => {
            loadFiles();
            updatePath();
        });
        
        // Listen for refresh events from desktop drop
        windowEl.addEventListener('refreshFiles', () => {
            loadFiles();
        });
    }


    renderCameraApp() {
        return '<div class="camera-app">' +
            '<video class="camera-video" autoplay playsinline></video>' +
            '<canvas class="camera-canvas"></canvas>' +
            '<canvas class="camera-overlay-canvas"></canvas>' +
            '<div class="camera-info-overlay">' +
                '<span class="camera-resolution-badge">1080p</span>' +
                '<span class="camera-smart-badge hidden">📄 Smart</span>' +
            '</div>' +
            '<div class="camera-options-btn" title="Settings">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>' +
            '</div>' +
            '<div class="camera-options-menu hidden">' +
                '<div class="camera-menu-header">Camera Settings</div>' +
                '<div class="camera-option-group">' +
                    '<label>Camera Source</label>' +
                    '<select class="camera-source-select"><option>Loading...</option></select>' +
                '</div>' +
                '<div class="camera-option-group">' +
                    '<label>Resolution</label>' +
                    '<select class="camera-resolution-select">' +
                        '<option value="1080">1080p Full HD (1920×1080)</option>' +
                        '<option value="4k">4K UHD (3840×2160)</option>' +
                        '<option value="720">720p HD (1280×720)</option>' +
                        '<option value="auto">Auto (Best Available)</option>' +
                    '</select>' +
                '</div>' +
                '<div class="camera-option-group">' +
                    '<label>Focus</label>' +
                    '<select class="camera-focus-select">' +
                        '<option value="auto">Auto Focus</option>' +
                        '<option value="manual">Manual Focus</option>' +
                    '</select>' +
                    '<input type="range" class="camera-focus-slider hidden" min="0" max="100" value="50">' +
                '</div>' +
                '<div class="camera-option-divider"></div>' +
                '<div class="camera-option-group smart-mode-group">' +
                    '<label class="smart-mode-label">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;vertical-align:middle;margin-right:4px;"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8M16 17H8M10 9H8"/></svg>' +
                        'Smart Mode (Document Scan)' +
                    '</label>' +
                    '<div class="smart-mode-controls">' +
                        '<div class="smart-mode-toggle">' +
                            '<input type="checkbox" class="camera-smart-toggle" id="camera-smart-toggle">' +
                            '<label for="camera-smart-toggle" class="toggle-switch"></label>' +
                            '<span class="smart-mode-status">Off</span>' +
                        '</div>' +
                        '<button class="smart-lock-btn" title="Lock/Refresh corners - click to capture current document position">' +
                            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>' +
                            '<span>Lock</span>' +
                        '</button>' +
                    '</div>' +
                    '<p class="smart-mode-desc">Auto-detect document edges, de-skew, and crop to 8.5×11</p>' +
                    '<p class="smart-lock-desc hidden">🔒 Corners locked - click Lock again to refresh</p>' +
                '</div>' +
                '<div class="camera-option-divider"></div>' +
                '<div class="camera-option-row">' +
                    '<button class="camera-opt-btn" data-action="mirror" title="Mirror/Flip horizontally">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18"/><path d="M8 7l-4 5 4 5"/><path d="M16 7l4 5-4 5"/></svg>' +
                        '<span>Mirror</span>' +
                    '</button>' +
                    '<button class="camera-opt-btn" data-action="rotate" title="Rotate 90°">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>' +
                        '<span>Rotate</span>' +
                    '</button>' +
                '</div>' +
                '<div class="camera-option-row">' +
                    '<button class="camera-opt-btn" data-action="ontop" title="Keep window on top">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>' +
                        '<span>On Top</span>' +
                    '</button>' +
                    '<button class="camera-opt-btn" data-action="freeze" title="Freeze frame">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>' +
                        '<span>Freeze</span>' +
                    '</button>' +
                '</div>' +
                '<div class="camera-option-divider"></div>' +
                '<div class="camera-option-row">' +
                    '<button class="camera-opt-btn primary" data-action="snapshot" title="Take snapshot">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>' +
                        '<span>Snapshot</span>' +
                    '</button>' +
                    '<button class="camera-opt-btn" data-action="fullscreen" title="Fullscreen">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>' +
                        '<span>Fullscreen</span>' +
                    '</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    renderTerminalApp() {
        const username = this.currentUser?.displayName || this.currentUser?.username || 'teacher';
        return '<div class="terminal-app">' +
            '<div class="terminal-output" id="terminal-output">' +
                '<div class="terminal-welcome">' +
                    '<pre class="terminal-ascii">' +
' ██████╗██╗  ██╗ █████╗  ██████╗██╗  ██╗ █████╗ \n' +
'██╔════╝██║  ██║██╔══██╗██╔════╝██║  ██║██╔══██╗\n' +
'██║     ███████║███████║██║     ███████║███████║\n' +
'██║     ██╔══██║██╔══██║██║     ██╔══██║██╔══██║\n' +
'╚██████╗██║  ██║██║  ██║╚██████╗██║  ██║██║  ██║\n' +
' ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝</pre>' +
                    '<div class="terminal-info">ChaCha Terminal v1.0 - Your friendly AI assistant</div>' +
                    '<div class="terminal-hint">Type a message and press Enter to chat. Type "clear" to clear, "help" for commands.</div>' +
                '</div>' +
            '</div>' +
            '<div class="terminal-input-line">' +
                '<span class="term-prompt">' + username + '@chacha:~$</span>' +
                '<input type="text" id="terminal-input" class="terminal-input" placeholder="Say hello..." autocomplete="off" spellcheck="false">' +
            '</div>' +
        '</div>';
    }
    
    initTerminal(windowEl) {
        const self = this;
        const output = windowEl.querySelector('#terminal-output');
        const input = windowEl.querySelector('#terminal-input');
        let isProcessing = false;
        
        // Focus input when clicking anywhere in terminal
        windowEl.querySelector('.terminal-app').addEventListener('click', () => {
            input.focus();
        });
        
        input.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter' && !isProcessing) {
                const message = input.value.trim();
                if (!message) return;
                
                // Handle special commands
                if (message.toLowerCase() === 'clear') {
                    output.innerHTML = '<div class="terminal-hint">Chat cleared. Say hi!</div>';
                    input.value = '';
                    return;
                }
                
                if (message.toLowerCase() === 'help') {
                    self.addTerminalLine(output, 'user', message);
                    self.addTerminalLine(output, 'system', 
                        'Commands:\n' +
                        '  clear   - Clear the chat display\n' +
                        '  help    - Show this help message\n' +
                        '  context - Show what ChaCha remembers about you\n' +
                        '  forget  - Clear ChaCha\'s memory of you\n' +
                        '\nOr just type anything to chat with ChaCha!'
                    );
                    input.value = '';
                    return;
                }
                
                if (message.toLowerCase() === 'context') {
                    self.addTerminalLine(output, 'user', message);
                    try {
                        const ctx = await self.api('/chat/context');
                        let contextInfo = '=== ChaCha\'s Memory ===\n\n';
                        
                        if (ctx.memories && ctx.memories.length > 0) {
                            contextInfo += '📝 What I remember about you:\n';
                            ctx.memories.forEach(m => {
                                contextInfo += '  • ' + m + '\n';
                            });
                        } else {
                            contextInfo += '📝 No memories stored yet.\n';
                        }
                        
                        contextInfo += '\n💬 Recent conversation: ' + (ctx.conversationHistory?.length || 0) + ' messages\n';
                        contextInfo += '🕐 Last chat: ' + (ctx.lastChat ? new Date(ctx.lastChat).toLocaleString() : 'Never');
                        
                        self.addTerminalLine(output, 'system', contextInfo);
                    } catch (error) {
                        self.addTerminalLine(output, 'error', 'Failed to get context: ' + error.message);
                    }
                    input.value = '';
                    return;
                }
                
                if (message.toLowerCase() === 'forget') {
                    self.addTerminalLine(output, 'user', message);
                    try {
                        await self.api('/chat/context', { method: 'DELETE' });
                        self.addTerminalLine(output, 'system', 'Memory cleared. It\'s like we just met! 👋');
                    } catch (error) {
                        self.addTerminalLine(output, 'error', 'Failed to clear memory: ' + error.message);
                    }
                    input.value = '';
                    return;
                }
                
                // Add user message to output
                self.addTerminalLine(output, 'user', message);
                input.value = '';
                isProcessing = true;
                
                // Show typing indicator
                const typingId = 'typing-' + Date.now();
                self.addTerminalLine(output, 'typing', '...', typingId);
                
                try {
                    const response = await self.api('/chat', {
                        method: 'POST',
                        body: JSON.stringify({ message })
                    });
                    
                    // Remove typing indicator
                    const typingEl = output.querySelector('#' + typingId);
                    if (typingEl) typingEl.remove();
                    
                    // Add ChaCha's response
                    self.addTerminalLine(output, 'chacha', response.response);
                    
                } catch (error) {
                    // Remove typing indicator
                    const typingEl = output.querySelector('#' + typingId);
                    if (typingEl) typingEl.remove();
                    
                    self.addTerminalLine(output, 'error', 'Oops! ' + (error.message || 'Something went wrong. Try again?'));
                }
                
                isProcessing = false;
                input.focus();
            }
        });
        
        // Auto-greet on first open
        setTimeout(async () => {
            try {
                const context = await self.api('/chat/context');
                if (!context.lastChat) {
                    // First time user - send initial greeting
                    self.addTerminalLine(output, 'typing', '...', 'initial-typing');
                    const response = await self.api('/chat', {
                        method: 'POST',
                        body: JSON.stringify({ message: 'Hello!' })
                    });
                    const typingEl = output.querySelector('#initial-typing');
                    if (typingEl) typingEl.remove();
                    self.addTerminalLine(output, 'chacha', response.response);
                }
            } catch (error) {
                console.log('Initial greeting skipped:', error.message);
            }
        }, 500);
        
        input.focus();
    }
    
    addTerminalLine(output, type, text, id = null) {
        const line = document.createElement('div');
        line.className = 'terminal-message terminal-' + type;
        if (id) line.id = id;
        
        const username = this.currentUser?.displayName || this.currentUser?.username || 'you';
        
        if (type === 'user') {
            line.innerHTML = '<span class="msg-prefix">' + username + ':</span> ' + this.escapeHtml(text);
        } else if (type === 'chacha') {
            line.innerHTML = '<span class="msg-prefix chacha">chacha:</span> ' + this.escapeHtml(text);
        } else if (type === 'system') {
            line.innerHTML = '<span class="msg-prefix system">[system]</span>\n' + this.escapeHtml(text);
        } else if (type === 'typing') {
            line.innerHTML = '<span class="msg-prefix chacha">chacha:</span> <span class="typing-dots">thinking</span>';
        } else if (type === 'error') {
            line.innerHTML = '<span class="msg-prefix error">[error]</span> ' + this.escapeHtml(text);
        }
        
        output.appendChild(line);
        output.scrollTop = output.scrollHeight;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML.replace(/\n/g, '<br>');
    }

    renderSettingsApp() {
        const initial = this.currentUser?.username?.charAt(0).toUpperCase() || "U";
        const username = this.currentUser?.username || "User";
        const themeActiveClass = this.darkMode ? "active" : "";
        const fullscreenIcon = this.isFullscreen ? 
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3"/></svg>' :
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>';
        
        const gradientsHtml = this.gradientPresets.map(g => 
            '<div class="gradient-option' + (this.wallpaper === g.id ? ' selected' : '') + '" data-gradient-id="' + g.id + '" style="background: ' + g.gradient + '" title="' + g.name + '"></div>'
        ).join("");

        const chevronIcon = '<svg class="category-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>';
        
        const userIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
        const displayIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>';
        const wallpaperIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
        const infoIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';

        return '<div class="settings-app">' +
            
            // Account Category
            '<div class="settings-category" data-category="account">' +
                '<div class="category-header">' +
                    '<div class="category-header-left">' +
                        userIcon +
                        '<span>Account & Profile</span>' +
                    '</div>' +
                    chevronIcon +
                '</div>' +
                '<div class="category-content expanded">' +
                    '<div class="settings-card">' +
                        '<div class="user-profile">' +
                            '<div class="user-avatar">' + initial + '</div>' +
                            '<div class="user-info">' +
                                '<div class="user-name">' + (this.currentUser?.displayName || username) + '</div>' +
                                '<div class="user-role">' + (this.currentUser?.title || 'User') + '</div>' +
                                '<div class="user-email">' + username + '</div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="profile-form">' +
                            '<div class="profile-field">' +
                                '<label>Display Name</label>' +
                                '<input type="text" id="profile-name" placeholder="Enter your name" value="' + (this.currentUser?.displayName || '') + '">' +
                            '</div>' +
                            '<div class="profile-field">' +
                                '<label>Title / Role (optional)</label>' +
                                '<input type="text" id="profile-title" placeholder="e.g. Teacher, Engineer, Designer" value="' + (this.currentUser?.title || '') + '">' +
                            '</div>' +
                            '<button class="profile-save-btn" id="save-profile-btn">Save Profile</button>' +
                        '</div>' +
                        (this.currentUser?.organization ? 
                            '<div class="organization-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>Organization: ' + this.currentUser.organization.domain + '</div>' :
                            '<div class="no-org-badge">Personal Account (no shared folder)</div>'
                        ) +
                    '</div>' +
                '</div>' +
            '</div>' +

            // Display Category
            '<div class="settings-category" data-category="display">' +
                '<div class="category-header">' +
                    '<div class="category-header-left">' +
                        displayIcon +
                        '<span>Display</span>' +
                    '</div>' +
                    chevronIcon +
                '</div>' +
                '<div class="category-content expanded">' +
                    '<div class="settings-card">' +
                        '<div class="settings-row">' +
                            '<div class="settings-row-info">' +
                                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="settings-icon"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>' +
                                '<span>Dark Mode</span>' +
                            '</div>' +
                            '<div id="theme-toggle" class="toggle ' + themeActiveClass + '"><div class="toggle-knob"></div></div>' +
                        '</div>' +
                        '<div class="settings-row">' +
                            '<div class="settings-row-info">' +
                                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="settings-icon"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>' +
                                '<span>Fullscreen Mode</span>' +
                            '</div>' +
                            '<button id="fullscreen-toggle" class="fullscreen-btn" title="Toggle Fullscreen">' + fullscreenIcon + '</button>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // Wallpaper Category
            '<div class="settings-category" data-category="wallpaper">' +
                '<div class="category-header">' +
                    '<div class="category-header-left">' +
                        wallpaperIcon +
                        '<span>Wallpaper</span>' +
                    '</div>' +
                    chevronIcon +
                '</div>' +
                '<div class="category-content expanded">' +
                    '<div class="settings-card">' +
                        '<div class="wallpaper-section">' +
                            '<h4>System Wallpapers</h4>' +
                            '<div class="system-wallpapers-grid" id="system-wallpapers-grid"></div>' +
                        '</div>' +
                        '<div class="wallpaper-section">' +
                            '<h4>Gradient Backgrounds</h4>' +
                            '<div class="gradient-grid">' + gradientsHtml + '</div>' +
                        '</div>' +
                        '<div class="wallpaper-section">' +
                            '<h4>Solid Color</h4>' +
                            '<div class="color-picker-row">' +
                                '<input type="color" id="wallpaper-color" value="' + this.wallpaperColor + '">' +
                                '<span>Choose a color</span>' +
                            '</div>' +
                        '</div>' +
                        '<div class="wallpaper-section">' +
                            '<h4>Custom Wallpaper</h4>' +
                            '<input type="file" id="wallpaper-upload" accept="image/*" style="display:none">' +
                            '<button id="upload-wallpaper-btn" class="upload-btn">' +
                                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' +
                                '<span>Upload Image</span>' +
                            '</button>' +
                            '<div class="user-wallpapers-grid"></div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // About Category
            '<div class="settings-category" data-category="about">' +
                '<div class="category-header">' +
                    '<div class="category-header-left">' +
                        infoIcon +
                        '<span>About</span>' +
                    '</div>' +
                    chevronIcon +
                '</div>' +
                '<div class="category-content">' +
                    '<div class="settings-card">' +
                        '<div class="info-row"><span>Version</span><span>2.0.0</span></div>' +
                        '<div class="info-row"><span>Build</span><span>2026.03.05</span></div>' +
                        '<div class="info-row"><span>Platform</span><span>Web</span></div>' +
                        '<div class="info-row"><span>Theme</span><span>' + (this.darkMode ? "Dark" : "Light") + '</span></div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    

    
    renderAISettingsApp() {
        return '<div class="ai-settings-app">' +
            '<div class="admin-header">' +
                '<h2>🤖 AI Settings - ChaCha Configuration</h2>' +
            '</div>' +
            '<div class="ai-settings-content">' +
                '<div class="ai-settings-section">' +
                    '<h3>Model Configuration</h3>' +
                    '<div class="setting-group">' +
                        '<label>Model ID</label>' +
                        '<input type="text" id="ai-model-id" placeholder="us.amazon.nova-pro-v1:0">' +
                        '<span class="setting-hint">e.g., us.amazon.nova-pro-v1:0, amazon.titan-text-premier-v1:0</span>' +
                    '</div>' +
                    '<div class="setting-row">' +
                        '<div class="setting-group half">' +
                            '<label>Temperature</label>' +
                            '<input type="number" id="ai-temperature" min="0" max="1" step="0.1" placeholder="0.7">' +
                            '<span class="setting-hint">0 = focused, 1 = creative</span>' +
                        '</div>' +
                        '<div class="setting-group half">' +
                            '<label>Max Tokens</label>' +
                            '<input type="number" id="ai-max-tokens" min="100" max="4000" step="100" placeholder="500">' +
                            '<span class="setting-hint">Response length limit</span>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="ai-settings-section">' +
                    '<h3>System Prompt</h3>' +
                    '<div class="setting-group full-width">' +
                        '<span class="setting-hint">Define ChaCha\'s personality and behavior</span>' +
                        '<textarea id="ai-system-prompt" rows="12" placeholder="You are ChaCha, a friendly AI assistant..."></textarea>' +
                    '</div>' +
                '</div>' +
                '<div class="ai-settings-section">' +
                    '<h3>Product Information</h3>' +
                    '<div class="setting-group full-width">' +
                        '<span class="setting-hint">HoverCam product details for tech support</span>' +
                        '<textarea id="ai-product-info" rows="12" placeholder="HoverCam Product Information..."></textarea>' +
                    '</div>' +
                '</div>' +
                '<div class="ai-settings-actions">' +
                    '<button id="ai-settings-save" class="admin-btn save">💾 Save Settings</button>' +
                    '<button id="ai-settings-reset" class="admin-btn cancel">↩️ Reset to Defaults</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    }
    
    initAISettings(windowEl) {
        const self = this;
        
        const modelInput = windowEl.querySelector('#ai-model-id');
        const tempInput = windowEl.querySelector('#ai-temperature');
        const tokensInput = windowEl.querySelector('#ai-max-tokens');
        const promptInput = windowEl.querySelector('#ai-system-prompt');
        const productInput = windowEl.querySelector('#ai-product-info');
        const saveBtn = windowEl.querySelector('#ai-settings-save');
        const resetBtn = windowEl.querySelector('#ai-settings-reset');
        
        // Load current settings
        async function loadSettings() {
            try {
                const settings = await self.api('/admin/ai-settings');
                modelInput.value = settings.model_id || '';
                tempInput.value = settings.temperature || '0.7';
                tokensInput.value = settings.max_tokens || '500';
                promptInput.value = settings.system_prompt || '';
                productInput.value = settings.product_info || '';
            } catch (error) {
                self.showNotification('Failed to load AI settings: ' + error.message, 'error');
            }
        }
        
        // Save settings
        saveBtn.addEventListener('click', async () => {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';
            
            try {
                await self.api('/admin/ai-settings', {
                    method: 'PUT',
                    body: JSON.stringify({
                        model_id: modelInput.value,
                        temperature: tempInput.value,
                        max_tokens: tokensInput.value,
                        system_prompt: promptInput.value,
                        product_info: productInput.value
                    })
                });
                self.showNotification('AI settings saved successfully!');
            } catch (error) {
                self.showNotification('Failed to save settings: ' + error.message, 'error');
            } finally {
                saveBtn.disabled = false;
                saveBtn.textContent = '💾 Save Settings';
            }
        });
        
        // Reset to defaults
        resetBtn.addEventListener('click', async () => {
            if (!confirm('Reset all AI settings to defaults? This cannot be undone.')) return;
            
            const defaultPrompt = `You are ChaCha, a friendly and helpful AI assistant for teachers. You have a warm, encouraging personality and love to help educators with their daily challenges.

Your personality traits:
- Warm and supportive - you genuinely care about teachers' wellbeing
- Playful sense of humor - you enjoy sharing clean, family-friendly jokes
- Good listener - you remember what teachers tell you and reference it later
- Encouraging - you celebrate their wins and offer support during tough days
- Knowledgeable but humble - you help with teaching ideas but acknowledge you're learning too

When chatting:
- Keep responses concise (1-3 sentences for casual chat)
- Ask follow-up questions to get to know them better
- Remember their name, subjects they teach, grade levels, hobbies
- Offer a joke if they seem stressed
- Be genuinely interested in their day and their students
- Use occasional emoji sparingly to add warmth

You are NOT a lesson planning tool (that comes later). You're here to be a friendly presence, a stress reliever, and someone who gets to know each teacher personally.

Start by introducing yourself warmly and asking their name if you don't know it yet!`;

            modelInput.value = 'us.amazon.nova-pro-v1:0';
            tempInput.value = '0.7';
            tokensInput.value = '500';
            promptInput.value = defaultPrompt;
            productInput.value = '';
            
            self.showNotification('Settings reset to defaults. Click Save to apply.');
        });
        
        loadSettings();
    }


    initWelcomeEditor(windowEl) {
        const self = this;
        
        const editor = windowEl.querySelector('#welcome-html-editor');
        const preview = windowEl.querySelector('#welcome-preview-frame');
        const status = windowEl.querySelector('#welcome-editor-status');
        const loadBtn = windowEl.querySelector('#welcome-load-btn');
        const previewBtn = windowEl.querySelector('#welcome-preview-btn');
        const resetBtn = windowEl.querySelector('#welcome-reset-btn');
        const saveBtn = windowEl.querySelector('#welcome-save-btn');
        
        // Load current welcome HTML
        async function loadWelcomeHTML() {
            status.textContent = 'Loading...';
            status.className = 'welcome-editor-status loading';
            try {
                const response = await self.api('/admin/welcome-page');
                editor.value = response.html || '';
                updatePreview();
                status.textContent = 'Loaded successfully';
                status.className = 'welcome-editor-status success';
            } catch (error) {
                status.textContent = 'Failed to load: ' + error.message;
                status.className = 'welcome-editor-status error';
            }
        }
        
        // Update preview
        function updatePreview() {
            preview.innerHTML = editor.value || '<p style="color: #888;">Preview will appear here...</p>';
        }
        
        // Get default HTML
        function getDefaultHTML() {
            return `<h2>Welcome to HoverCam Desktop</h2>
<p>Your personal workspace is ready. Explore the apps in the taskbar or double-click desktop icons to get started.</p>
<div class="welcome-stats">
    <div class="stat-card">
        <h3>8</h3>
        <p>Apps Available</p>
    </div>
    <div class="stat-card">
        <h3>v2.0</h3>
        <p>System Version</p>
    </div>
    <div class="stat-card">
        <h3>100%</h3>
        <p>System Health</p>
    </div>
</div>`;
        }
        
        // Event listeners
        loadBtn.addEventListener('click', loadWelcomeHTML);
        
        previewBtn.addEventListener('click', updatePreview);
        
        resetBtn.addEventListener('click', () => {
            if (confirm('Reset to default welcome page? Your custom HTML will be cleared.')) {
                editor.value = getDefaultHTML();
                updatePreview();
                status.textContent = 'Reset to default - click Save to apply';
                status.className = 'welcome-editor-status';
            }
        });
        
        saveBtn.addEventListener('click', async () => {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';
            status.textContent = 'Saving...';
            status.className = 'welcome-editor-status loading';
            
            try {
                await self.api('/admin/welcome-page', {
                    method: 'PUT',
                    body: JSON.stringify({ html: editor.value })
                });
                status.textContent = 'Saved successfully! Users will see the new welcome page.';
                status.className = 'welcome-editor-status success';
                self.showNotification('Welcome page saved!', 'success');
            } catch (error) {
                status.textContent = 'Failed to save: ' + error.message;
                status.className = 'welcome-editor-status error';
                self.showNotification('Failed to save: ' + error.message, 'error');
            } finally {
                saveBtn.disabled = false;
                saveBtn.textContent = '💾 Save Changes';
            }
        });
        
        // Live preview on typing (debounced)
        let previewTimeout;
        editor.addEventListener('input', () => {
            clearTimeout(previewTimeout);
            previewTimeout = setTimeout(updatePreview, 500);
        });
        
        // Initial load
        loadWelcomeHTML();
    }

        renderUserManagerApp() {
        const self = this;
        
        return '<div class="user-manager-app">' +
            '<div class="admin-header">' +
                '<h2>User Manager</h2>' +
                '<div class="admin-tabs">' +
                    '<button class="admin-tab active" data-tab="users">Users</button>' +
                    '<button class="admin-tab" data-tab="domains">Domains</button>' +
                    '<button class="admin-tab" data-tab="stats">Stats</button>' +
                '</div>' +
            '</div>' +
            '<div class="admin-content">' +
                '<div class="admin-panel active" data-panel="users">' +
                    '<div class="search-bar">' +
                        '<input type="text" id="user-search" placeholder="Search users by email or name...">' +
                        '<select id="tier-filter">' +
                            '<option value="">All Tiers</option>' +
                            '<option value="free">Free</option>' +
                            '<option value="premium">Premium</option>' +
                            '<option value="enterprise">Enterprise</option>' +
                        '</select>' +
                        '<button id="search-btn" class="admin-btn">Search</button>' +
                    '</div>' +
                    '<div class="users-table-container">' +
                        '<table class="users-table">' +
                            '<thead>' +
                                '<tr>' +
                                    '<th>User</th>' +
                                    '<th>Email</th>' +
                                    '<th>Domain</th>' +
                                    '<th>Tier</th>' +
                                    '<th>Admin</th>' +
                                    '<th>Actions</th>' +
                                '</tr>' +
                            '</thead>' +
                            '<tbody id="users-tbody"></tbody>' +
                        '</table>' +
                    '</div>' +
                    '<div class="pagination" id="users-pagination"></div>' +
                '</div>' +
                '<div class="admin-panel" data-panel="domains">' +
                    '<div class="domains-grid" id="domains-grid"></div>' +
                '</div>' +
                '<div class="admin-panel" data-panel="stats">' +
                    '<div class="stats-grid" id="stats-grid"></div>' +
                '</div>' +
            '</div>' +
        '</div>';
    }
    
    initUserManager(windowEl) {
        const self = this;
        let currentPage = 1;
        const limit = 20;
        
        // Tab switching
        windowEl.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                windowEl.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
                windowEl.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                windowEl.querySelector('[data-panel="' + tab.dataset.tab + '"]').classList.add('active');
                
                if (tab.dataset.tab === 'domains') loadDomains();
                if (tab.dataset.tab === 'stats') loadStats();
            });
        });
        
        // Search functionality
        const searchBtn = windowEl.querySelector('#search-btn');
        const searchInput = windowEl.querySelector('#user-search');
        const tierFilter = windowEl.querySelector('#tier-filter');
        
        searchBtn.addEventListener('click', () => {
            currentPage = 1;
            loadUsers();
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                currentPage = 1;
                loadUsers();
            }
        });
        
        tierFilter.addEventListener('change', () => {
            currentPage = 1;
            loadUsers();
        });
        
        async function loadUsers() {
            const tbody = windowEl.querySelector('#users-tbody');
            const pagination = windowEl.querySelector('#users-pagination');
            const search = searchInput.value;
            const tier = tierFilter.value;
            
            try {
                const params = new URLSearchParams();
                if (search) params.append('search', search);
                if (tier) params.append('tier', tier);
                params.append('page', currentPage);
                params.append('limit', limit);
                
                const response = await self.api('/admin/users?' + params.toString());
                
                tbody.innerHTML = response.users.map(user => {
                    const domain = user.email.split('@')[1];
                    return '<tr>' +
                        '<td>' +
                            '<div class="user-cell">' +
                                '<div class="user-avatar-small">' + (user.display_name || user.username || 'U').charAt(0).toUpperCase() + '</div>' +
                                '<span>' + (user.display_name || user.username || '-') + '</span>' +
                            '</div>' +
                        '</td>' +
                        '<td>' + user.email + '</td>' +
                        '<td>' + domain + '</td>' +
                        '<td><span class="tier-badge tier-' + (user.subscription_tier || 'free') + '">' + (user.subscription_tier || 'free') + '</span></td>' +
                        '<td>' + (user.is_super_admin ? '<span class="admin-badge">Admin</span>' : '-') + '</td>' +
                        '<td>' +
                            '<button class="action-btn edit-btn" data-user-id="' + user.id + '" title="Edit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>' +
                            '<button class="action-btn delete-btn" data-user-id="' + user.id + '" data-email="' + user.email + '" title="Delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>' +
                        '</td>' +
                    '</tr>';
                }).join('');
                
                // Add edit/delete handlers
                tbody.querySelectorAll('.edit-btn').forEach(btn => {
                    btn.addEventListener('click', () => editUser(btn.dataset.userId));
                });
                
                tbody.querySelectorAll('.delete-btn').forEach(btn => {
                    btn.addEventListener('click', () => deleteUser(btn.dataset.userId, btn.dataset.email));
                });
                
                // Pagination
                const { page, pages, total } = response.pagination;
                pagination.innerHTML = '<span>Page ' + page + ' of ' + pages + ' (' + total + ' users)</span>' +
                    '<div class="page-btns">' +
                        '<button class="page-btn" ' + (page <= 1 ? 'disabled' : '') + ' data-page="' + (page - 1) + '">Prev</button>' +
                        '<button class="page-btn" ' + (page >= pages ? 'disabled' : '') + ' data-page="' + (page + 1) + '">Next</button>' +
                    '</div>';
                
                pagination.querySelectorAll('.page-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        if (!btn.disabled) {
                            currentPage = parseInt(btn.dataset.page);
                            loadUsers();
                        }
                    });
                });
                
            } catch (error) {
                console.error('Failed to load users:', error);
                tbody.innerHTML = '<tr><td colspan="6">Failed to load users</td></tr>';
            }
        }
        
        async function loadDomains() {
            const grid = windowEl.querySelector('#domains-grid');
            
            try {
                const response = await self.api('/admin/domains');
                
                grid.innerHTML = response.domains.map(domain => {
                    const sub = response.domainSubscriptions.find(s => s.domain === domain.domain);
                    return '<div class="domain-card">' +
                        '<div class="domain-header">' +
                            '<h3>' + domain.domain + '</h3>' +
                            '<span class="tier-badge tier-' + (sub?.subscription_tier || 'free') + '">' + (sub?.subscription_tier || 'free') + '</span>' +
                        '</div>' +
                        '<div class="domain-stats">' +
                            '<div class="stat"><span class="stat-value">' + domain.user_count + '</span><span class="stat-label">Users</span></div>' +
                            '<div class="stat"><span class="stat-value">' + domain.premium_count + '</span><span class="stat-label">Premium</span></div>' +
                            '<div class="stat"><span class="stat-value">' + domain.free_count + '</span><span class="stat-label">Free</span></div>' +
                        '</div>' +
                        '<div class="domain-actions">' +
                            '<button class="admin-btn" onclick="window.desktopOS.editDomain(\''+domain.domain+'\')">Manage</button>' +
                        '</div>' +
                    '</div>';
                }).join('');
                
            } catch (error) {
                console.error('Failed to load domains:', error);
                grid.innerHTML = '<div class="error">Failed to load domains</div>';
            }
        }
        
        async function loadStats() {
            const grid = windowEl.querySelector('#stats-grid');
            
            try {
                const response = await self.api('/admin/stats');
                
                grid.innerHTML = '<div class="stats-cards">' +
                    '<div class="stat-card">' +
                        '<div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div>' +
                        '<div class="stat-info"><span class="stat-value">' + response.totalUsers + '</span><span class="stat-label">Total Users</span></div>' +
                    '</div>' +
                    '<div class="stat-card">' +
                        '<div class="stat-icon premium"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>' +
                        '<div class="stat-info"><span class="stat-value">' + response.premiumUsers + '</span><span class="stat-label">Premium Users</span></div>' +
                    '</div>' +
                    '<div class="stat-card">' +
                        '<div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg></div>' +
                        '<div class="stat-info"><span class="stat-value">' + response.totalDomains + '</span><span class="stat-label">Domains</span></div>' +
                    '</div>' +
                    '<div class="stat-card">' +
                        '<div class="stat-icon admin"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>' +
                        '<div class="stat-info"><span class="stat-value">' + response.adminUsers + '</span><span class="stat-label">Admins</span></div>' +
                    '</div>' +
                '</div>';
                
            } catch (error) {
                console.error('Failed to load stats:', error);
                grid.innerHTML = '<div class="error">Failed to load stats</div>';
            }
        }
        
        async function editUser(userId) {
            const response = await self.api('/admin/users?search=' + userId);
            const user = response.users.find(u => u.id == userId);
            if (!user) return;
            
            const modal = document.createElement('div');
            modal.className = 'admin-modal';
            modal.innerHTML = '<div class="modal-content">' +
                '<h3>Edit User: ' + user.email + '</h3>' +
                '<div class="modal-form">' +
                    '<label>Display Name</label>' +
                    '<input type="text" id="edit-display-name" value="' + (user.display_name || '') + '">' +
                    '<label>Title</label>' +
                    '<input type="text" id="edit-title" value="' + (user.title || '') + '">' +
                    '<label>Subscription Tier</label>' +
                    '<select id="edit-tier">' +
                        '<option value="free"' + (user.subscription_tier === 'free' ? ' selected' : '') + '>Free</option>' +
                        '<option value="premium"' + (user.subscription_tier === 'premium' ? ' selected' : '') + '>Premium</option>' +
                        '<option value="enterprise"' + (user.subscription_tier === 'enterprise' ? ' selected' : '') + '>Enterprise</option>' +
                    '</select>' +
                    '<label><input type="checkbox" id="edit-admin"' + (user.is_super_admin ? ' checked' : '') + '> Super Admin</label>' +
                '</div>' +
                '<div class="modal-actions">' +
                    '<button class="admin-btn cancel">Cancel</button>' +
                    '<button class="admin-btn save">Save</button>' +
                '</div>' +
            '</div>';
            
            windowEl.appendChild(modal);
            
            modal.querySelector('.cancel').addEventListener('click', () => modal.remove());
            modal.querySelector('.save').addEventListener('click', async () => {
                try {
                    await self.api('/admin/users/' + userId, {
                        method: 'PUT',
                        body: JSON.stringify({
                            display_name: modal.querySelector('#edit-display-name').value,
                            title: modal.querySelector('#edit-title').value,
                            subscription_tier: modal.querySelector('#edit-tier').value,
                            is_super_admin: modal.querySelector('#edit-admin').checked
                        })
                    });
                    modal.remove();
                    loadUsers();
                    self.showNotification('User updated successfully');
                } catch (error) {
                    self.showNotification('Failed to update user: ' + error.message, 'error');
                }
            });
        }
        
        async function deleteUser(userId, email) {
            if (!confirm('Delete user ' + email + '? This cannot be undone.')) return;
            
            try {
                await self.api('/admin/users/' + userId, { method: 'DELETE' });
                loadUsers();
                self.showNotification('User deleted');
            } catch (error) {
                self.showNotification('Failed to delete user: ' + error.message, 'error');
            }
        }
        
        // Initial load
        loadUsers();
    }
    
    editDomain(domain) {
        const self = this;
        const modal = document.createElement('div');
        modal.className = 'admin-modal';
        modal.innerHTML = '<div class="modal-content">' +
            '<h3>Manage Domain: ' + domain + '</h3>' +
            '<div class="modal-form">' +
                '<label>Subscription Tier</label>' +
                '<select id="domain-tier">' +
                    '<option value="free">Free</option>' +
                    '<option value="premium">Premium</option>' +
                    '<option value="enterprise">Enterprise</option>' +
                '</select>' +
                '<label>Max Users (optional)</label>' +
                '<input type="number" id="domain-max-users" placeholder="Leave empty for unlimited">' +
                '<label>Contact Email</label>' +
                '<input type="email" id="domain-contact-email" placeholder="billing@domain.com">' +
                '<label>Contact Name</label>' +
                '<input type="text" id="domain-contact-name" placeholder="John Doe">' +
                '<label>Notes</label>' +
                '<textarea id="domain-notes" placeholder="Internal notes..."></textarea>' +
            '</div>' +
            '<div class="modal-actions">' +
                '<button class="admin-btn cancel">Cancel</button>' +
                '<button class="admin-btn save">Save</button>' +
            '</div>' +
        '</div>';
        
        document.body.appendChild(modal);
        
        modal.querySelector('.cancel').addEventListener('click', () => modal.remove());
        modal.querySelector('.save').addEventListener('click', async () => {
            try {
                await self.api('/admin/domains/' + encodeURIComponent(domain), {
                    method: 'PUT',
                    body: JSON.stringify({
                        subscription_tier: modal.querySelector('#domain-tier').value,
                        max_users: modal.querySelector('#domain-max-users').value || null,
                        contact_email: modal.querySelector('#domain-contact-email').value || null,
                        contact_name: modal.querySelector('#domain-contact-name').value || null,
                        notes: modal.querySelector('#domain-notes').value || null
                    })
                });
                modal.remove();
                self.showNotification('Domain subscription updated');
            } catch (error) {
                self.showNotification('Failed to update domain: ' + error.message, 'error');
            }
        });
    }


    
    // ===== SHOUTOUTS APP =====
    
    renderShoutoutsApp() {
        return '<div class="shoutouts-app">' +
            '<div class="shoutouts-header">' +
                '<h2>📢 ChaCha Shoutouts</h2>' +
                '<p class="shoutouts-domain">Loading...</p>' +
            '</div>' +
            '<div class="shoutouts-compose">' +
                '<textarea id="shoutout-input" placeholder="What\'s happening?" maxlength="500"></textarea>' +
                '<div class="shoutouts-compose-footer">' +
                    '<span class="char-count">500</span>' +
                    '<button id="shoutout-post-btn" class="shoutout-btn">Post</button>' +
                '</div>' +
            '</div>' +
            '<div class="shoutouts-feed" id="shoutouts-feed">' +
                '<div class="shoutouts-loading"><div class="spinner"></div><p>Loading shoutouts...</p></div>' +
            '</div>' +
        '</div>';
    }
    
    initShoutouts(windowEl) {
        const self = this;
        const feedEl = windowEl.querySelector('#shoutouts-feed');
        const inputEl = windowEl.querySelector('#shoutout-input');
        const postBtn = windowEl.querySelector('#shoutout-post-btn');
        const charCount = windowEl.querySelector('.char-count');
        const domainEl = windowEl.querySelector('.shoutouts-domain');
        
        // Update character count
        inputEl.addEventListener('input', () => {
            const remaining = 500 - inputEl.value.length;
            charCount.textContent = remaining;
            charCount.style.color = remaining < 50 ? '#e74c3c' : remaining < 100 ? '#f39c12' : 'var(--text-secondary)';
        });
        
        // Load shoutouts
        async function loadShoutouts() {
            try {
                const response = await self.api('/shoutouts');
                domainEl.textContent = '@' + response.domain;
                
                if (response.shoutouts.length === 0) {
                    feedEl.innerHTML = '<div class="shoutouts-empty"><p>No shoutouts yet!</p><p>Be the first to post something.</p></div>';
                    return;
                }
                
                feedEl.innerHTML = response.shoutouts.map(shoutout => {
                    const date = new Date(shoutout.created_at);
                    const timeAgo = getTimeAgo(date);
                    const initial = (shoutout.user_name || shoutout.user_email)[0].toUpperCase();
                    
                    return '<div class="shoutout-item">' +
                        '<div class="shoutout-avatar">' + initial + '</div>' +
                        '<div class="shoutout-content">' +
                            '<div class="shoutout-meta">' +
                                '<span class="shoutout-name">' + (shoutout.user_name || shoutout.user_email.split('@')[0]) + '</span>' +
                                '<span class="shoutout-time">' + timeAgo + '</span>' +
                            '</div>' +
                            '<p class="shoutout-text">' + escapeHtml(shoutout.content) + '</p>' +
                        '</div>' +
                    '</div>';
                }).join('');
            } catch (error) {
                feedEl.innerHTML = '<div class="shoutouts-error"><p>Failed to load shoutouts</p></div>';
            }
        }
        
        // Post shoutout
        async function postShoutout() {
            const content = inputEl.value.trim();
            if (!content) return;
            
            postBtn.disabled = true;
            postBtn.textContent = 'Posting...';
            
            try {
                await self.api('/shoutouts', {
                    method: 'POST',
                    body: JSON.stringify({ content })
                });
                
                inputEl.value = '';
                charCount.textContent = '500';
                charCount.style.color = 'var(--text-secondary)';
                await loadShoutouts();
                self.showNotification('Shoutout posted!', 'success');
            } catch (error) {
                self.showNotification('Failed to post: ' + error.message, 'error');
            } finally {
                postBtn.disabled = false;
                postBtn.textContent = 'Post';
            }
        }
        
        // Helper functions
        function getTimeAgo(date) {
            const seconds = Math.floor((new Date() - date) / 1000);
            if (seconds < 60) return 'just now';
            const minutes = Math.floor(seconds / 60);
            if (minutes < 60) return minutes + 'm ago';
            const hours = Math.floor(minutes / 60);
            if (hours < 24) return hours + 'h ago';
            const days = Math.floor(hours / 24);
            if (days < 7) return days + 'd ago';
            return date.toLocaleDateString();
        }
        
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        // Event listeners
        postBtn.addEventListener('click', postShoutout);
        inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                postShoutout();
            }
        });
        
        // Initial load
        loadShoutouts();
        
        // Auto-refresh every 30 seconds
        const refreshInterval = setInterval(loadShoutouts, 30000);
        
        // Clean up on window close
        windowEl.addEventListener('windowclose', () => {
            clearInterval(refreshInterval);
        });
    }

// ===== PRINT QUIZZES APP =====
    
    renderPrintQuizzesApp() {
        return '<div class="print-quizzes-app">' +
            '<div class="pq-header">' +
                '<h2>🖨️ Print Quizzes</h2>' +
                '<p>Select a lesson to print its quiz</p>' +
            '</div>' +
            '<div class="pq-content">' +
                '<div class="pq-sidebar">' +
                    '<h3>Lessons with Quizzes</h3>' +
                    '<div class="pq-lesson-list" id="pq-lesson-list">' +
                        '<p class="loading-text">Loading lessons...</p>' +
                    '</div>' +
                '</div>' +
                '<div class="pq-preview">' +
                    '<div class="pq-preview-placeholder" id="pq-preview-area">' +
                        '<p>👈 Select a lesson from the list to preview its quiz</p>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    }
    
    initPrintQuizzes(windowEl) {
        const self = this;
        const lessonListEl = windowEl.querySelector('#pq-lesson-list');
        const previewAreaEl = windowEl.querySelector('#pq-preview-area');
        let selectedLesson = null;
        
        // Load lessons with quizzes
        async function loadLessonsWithQuizzes() {
            try {
                const response = await fetch('/api/lesson/with-quizzes', {
                    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                });
                
                if (!response.ok) throw new Error('Failed to load lessons');
                
                const data = await response.json();
                
                if (data.lessons && data.lessons.length > 0) {
                    lessonListEl.innerHTML = data.lessons.map(lesson => {
                        const date = new Date(lesson.created_at).toLocaleDateString();
                        const questionCount = lesson.quiz_data?.questions?.length || 0;
                        return '<div class="pq-lesson-item" data-id="' + lesson.id + '">' +
                            '<div class="pq-lesson-title">' + escapeHtml(lesson.topic || 'Untitled') + '</div>' +
                            '<div class="pq-lesson-meta">' +
                                '<span>' + escapeHtml(lesson.subject || '') + '</span>' +
                                '<span>' + escapeHtml(lesson.grade || '') + '</span>' +
                                '<span>' + questionCount + ' questions</span>' +
                            '</div>' +
                            '<div class="pq-lesson-date">' + date + '</div>' +
                        '</div>';
                    }).join('');
                    
                    // Add click handlers
                    lessonListEl.querySelectorAll('.pq-lesson-item').forEach(item => {
                        item.addEventListener('click', () => {
                            lessonListEl.querySelectorAll('.pq-lesson-item').forEach(i => i.classList.remove('selected'));
                            item.classList.add('selected');
                            loadQuizPreview(item.dataset.id);
                        });
                    });
                } else {
                    lessonListEl.innerHTML = '<div class="pq-no-quizzes">' +
                        '<p>📝 No quizzes found</p>' +
                        '<p>To create a quiz:</p>' +
                        '<ol>' +
                            '<li>Open the <strong>Lesson Planner</strong> app</li>' +
                            '<li>Create or select a lesson plan</li>' +
                            '<li>Click <strong>Generate Quiz</strong></li>' +
                            '<li>Save the quiz</li>' +
                        '</ol>' +
                    '</div>';
                }
            } catch (error) {
                console.error('Error loading lessons:', error);
                lessonListEl.innerHTML = '<p class="error-text">Failed to load lessons</p>';
            }
        }
        
        // Load quiz preview
        async function loadQuizPreview(lessonId) {
            previewAreaEl.innerHTML = '<p class="loading-text">Loading quiz...</p>';
            
            try {
                const response = await fetch('/api/lesson/' + lessonId, {
                    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                });
                
                if (!response.ok) throw new Error('Failed to load lesson');
                
                const data = await response.json();
                selectedLesson = data;
                
                if (!data.quizData || !data.quizData.questions || data.quizData.questions.length === 0) {
                    previewAreaEl.innerHTML = '<div class="pq-no-quiz-msg">' +
                        '<p>⚠️ This lesson does not have a quiz yet.</p>' +
                        '<p>Open the Lesson Planner to generate a quiz for this lesson.</p>' +
                    '</div>';
                    return;
                }
                
                renderQuizPreview(data);
            } catch (error) {
                console.error('Error loading quiz:', error);
                previewAreaEl.innerHTML = '<p class="error-text">Failed to load quiz</p>';
            }
        }
        
        // Render quiz preview
        function renderQuizPreview(lessonData) {
            const quiz = lessonData.quizData;
            const questions = quiz.questions || [];
            const quizCode = quiz.quizCode || '------';
            const title = lessonData.lessonPlan?.title || lessonData.topic || 'Quiz';
            
            // Split questions into two columns (6 each max)
            const col1 = questions.slice(0, 6);
            const col2 = questions.slice(6, 12);
            
            let html = '<div class="pq-quiz-preview">' +
                '<div class="pq-preview-header">' +
                    '<button class="pq-print-btn" id="pq-print-btn">🖨️ Print Quiz</button>' +
                    '<button class="pq-print-key-btn" id="pq-print-key-btn">📋 Print Answer Key</button>' +
                '</div>' +
                '<div class="pq-quiz-paper" id="pq-quiz-paper">' +
                    '<div class="quiz-header-print">' +
                        '<div class="quiz-title-print">' + escapeHtml(title) + '</div>' +
                        '<div class="quiz-code-print">Quiz Code: ' + quizCode + '</div>' +
                    '</div>' +
                    '<div class="quiz-student-name-print">' +
                        '<label>Student Name: </label>' +
                        '<span class="name-line">_________________________________</span>' +
                    '</div>' +
                    '<div class="quiz-columns">' +
                        '<div class="quiz-column">' + renderQuestionColumn(col1, 0) + '</div>' +
                        '<div class="quiz-column">' + renderQuestionColumn(col2, 6) + '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';
            
            previewAreaEl.innerHTML = html;
            
            // Print button handlers
            windowEl.querySelector('#pq-print-btn').addEventListener('click', () => printQuiz(false));
            windowEl.querySelector('#pq-print-key-btn').addEventListener('click', () => printQuiz(true));
        }
        
        function renderQuestionColumn(questions, startIndex) {
            if (questions.length === 0) return '';
            
            return questions.map((q, idx) => {
                const num = startIndex + idx + 1;
                let html = '<div class="quiz-question-print">' +
                    '<div class="q-number">' + num + '.</div>' +
                    '<div class="q-content">' +
                        '<div class="q-text">' + escapeHtml(q.question) + '</div>';
                
                if (q.type === 'Multiple Choice' && q.options) {
                    html += '<div class="q-options">';
                    q.options.forEach((opt, optIdx) => {
                        const letter = String.fromCharCode(65 + optIdx);
                        html += '<div class="q-option">' +
                            '<span class="opt-letter">' + letter + '.</span> ' +
                            '<span class="opt-text">' + escapeHtml(opt) + '</span>' +
                        '</div>';
                    });
                    html += '</div>';
                } else if (q.type === 'True/False') {
                    html += '<div class="q-tf">' +
                        '<span class="tf-choice">○ True</span>' +
                        '<span class="tf-choice">○ False</span>' +
                    '</div>';
                } else {
                    html += '<div class="q-answer-line">____________________________________</div>';
                }
                
                html += '</div></div>';
                return html;
            }).join('');
        }
        
        function printQuiz(includeAnswers) {
            const quizPaper = windowEl.querySelector('#pq-quiz-paper');
            if (!quizPaper || !selectedLesson) return;
            
            const quiz = selectedLesson.quizData;
            const questions = quiz.questions || [];
            const quizCode = quiz.quizCode || '------';
            const title = selectedLesson.lessonPlan?.title || selectedLesson.topic || 'Quiz';
            
            const col1 = questions.slice(0, 6);
            const col2 = questions.slice(6, 12);
            
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
    <title>${includeAnswers ? 'Answer Key - ' : ''}${title}</title>
    <style>
        @page { margin: 0.5in; size: letter; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.4; }
        .quiz-paper { padding: 20px; max-width: 8.5in; margin: 0 auto; }
        .quiz-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .quiz-title { font-size: 18pt; font-weight: bold; flex: 1; }
        .quiz-code { font-size: 12pt; font-weight: bold; text-align: right; }
        .quiz-code span { font-family: monospace; letter-spacing: 2px; }
        .student-name { margin-bottom: 20px; font-size: 12pt; }
        .student-name .line { display: inline-block; border-bottom: 1px solid #333; width: 300px; margin-left: 10px; }
        .quiz-columns { display: flex; gap: 30px; }
        .quiz-column { flex: 1; }
        .question { margin-bottom: 15px; display: flex; gap: 8px; }
        .q-num { font-weight: bold; min-width: 20px; }
        .q-body { flex: 1; }
        .q-text { margin-bottom: 6px; }
        .options { margin-left: 5px; }
        .option { margin-bottom: 3px; }
        .tf-options { display: flex; gap: 20px; margin-top: 5px; }
        .answer-line { border-bottom: 1px solid #999; margin-top: 8px; height: 20px; }
        .answer-key { color: #c00; font-weight: bold; margin-top: 5px; padding: 3px 8px; background: #ffe0e0; border-radius: 3px; display: inline-block; }
        ${includeAnswers ? '' : '.answer-key { display: none; }'}
        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
    </style>
</head>
<body>
    <div class="quiz-paper">
        <div class="quiz-header">
            <div class="quiz-title">${includeAnswers ? '📋 ANSWER KEY: ' : ''}${escapeHtml(title)}</div>
            <div class="quiz-code">Quiz Code: <span>${quizCode}</span></div>
        </div>
        <div class="student-name">
            Student Name: <span class="line"></span>
        </div>
        <div class="quiz-columns">
            <div class="quiz-column">
                ${renderPrintColumn(col1, 0, includeAnswers)}
            </div>
            <div class="quiz-column">
                ${renderPrintColumn(col2, 6, includeAnswers)}
            </div>
        </div>
    </div>
    <script>window.onload = function() { window.print(); }</script>
</body>
</html>`);
            printWindow.document.close();
        }
        
        function renderPrintColumn(questions, startIndex, showAnswers) {
            if (questions.length === 0) return '';
            
            return questions.map((q, idx) => {
                const num = startIndex + idx + 1;
                let html = '<div class="question"><div class="q-num">' + num + '.</div><div class="q-body">' +
                    '<div class="q-text">' + escapeHtml(q.question) + '</div>';
                
                if (q.type === 'Multiple Choice' && q.options) {
                    html += '<div class="options">';
                    q.options.forEach((opt, optIdx) => {
                        const letter = String.fromCharCode(65 + optIdx);
                        html += '<div class="option">' + letter + '. ' + escapeHtml(opt) + '</div>';
                    });
                    html += '</div>';
                } else if (q.type === 'True/False') {
                    html += '<div class="tf-options"><span>○ True</span><span>○ False</span></div>';
                } else {
                    html += '<div class="answer-line"></div>';
                }
                
                if (showAnswers) {
                    html += '<div class="answer-key">Answer: ' + escapeHtml(q.answer) + '</div>';
                }
                
                html += '</div></div>';
                return html;
            }).join('');
        }
        
        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        // Initial load
        loadLessonsWithQuizzes();
    }

// ===== LESSON PLANNER APP =====
    
    renderLessonPlannerApp() {
        return '<div class="lesson-planner-app">' +
            '<div class="lesson-header">' +
                '<h2>📚 Lesson Plan Generator</h2>' +
                '<p class="lesson-subtitle">AI-powered lesson planning with blended learning suggestions</p>' +
            '</div>' +
            '<div class="lesson-content">' +
                '<div class="lesson-sidebar">' +
                    '<div class="lesson-steps">' +
                        '<div class="step active" data-step="1"><span class="step-num">1</span><span class="step-label">Gather Info</span></div>' +
                        '<div class="step" data-step="2"><span class="step-num">2</span><span class="step-label">Generate Plan</span></div>' +
                        '<div class="step" data-step="3"><span class="step-num">3</span><span class="step-label">Review & Edit</span></div>' +
                        '<div class="step" data-step="4"><span class="step-num">4</span><span class="step-label">Find Images</span></div>' +
                        '<div class="step" data-step="5"><span class="step-num">5</span><span class="step-label">Save & Export</span></div>' +
                        '<div class="step" data-step="6"><span class="step-num">6</span><span class="step-label">Reading</span></div>' +
                        '<div class="step" data-step="7"><span class="step-num">7</span><span class="step-label">Quiz</span></div>' +
                    '</div>' +
                    '<div class="lesson-history"><h4>Recent Lessons</h4><div class="history-list"></div></div>' +
                '</div>' +
                '<div class="lesson-main">' +
                    '<div class="lesson-panel active" id="lesson-step-1">' +
                        '<div class="chat-container">' +
                            '<div class="chat-messages" id="lesson-chat-messages">' +
                                '<div class="chat-message assistant"><div class="message-content"><strong>📚 Lesson Planner</strong><br><br>Hi! I\'m here to help you create an engaging lesson plan.<br><br>What subject and topic would you like to teach today?</div></div>' +
                            '</div>' +
                            '<div class="chat-input-area"><textarea id="lesson-chat-input" placeholder="Type your response..." rows="2"></textarea><button id="lesson-chat-send" class="send-btn">Send</button></div>' +
                        '</div>' +
                        '<div class="lesson-quick-info">' +
                            '<h4>Lesson Details</h4>' +
                            '<div class="quick-info-grid">' +
                                '<div class="info-item"><label>Subject:</label><span id="info-subject">-</span></div>' +
                                '<div class="info-item"><label>Grade:</label><span id="info-grade">-</span></div>' +
                                '<div class="info-item"><label>Topic:</label><span id="info-topic">-</span></div>' +
                                '<div class="info-item"><label>Standard:</label><span id="info-standard">-</span></div>' +
                                '<div class="info-item"><label>Duration:</label><span id="info-duration">-</span></div>' +
                            '</div>' +
                            '<button id="lesson-generate-btn" class="generate-btn" disabled>🚀 Generate Lesson Plan</button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="lesson-panel" id="lesson-step-2">' +
                        '<div class="generating-container"><div class="spinner"></div><h3>Generating Your Lesson Plan...</h3><p class="generating-status">Analyzing requirements...</p><div class="progress-bar"><div class="progress-fill"></div></div></div>' +
                    '</div>' +
                    '<div class="lesson-panel" id="lesson-step-3">' +
                        '<div class="lesson-review"><div class="review-header"><h3 id="review-title">Lesson Plan Review</h3><div class="review-actions"><button id="lesson-regenerate" class="action-btn">🔄 Regenerate</button><button id="lesson-find-images" class="action-btn">🖼️ Find Images</button><button id="lesson-generate-reading" class="action-btn">📖 Generate Reading</button><button id="lesson-generate-quiz" class="action-btn">📝 Generate Quiz</button><button id="lesson-export-btn" class="action-btn primary">💾 Save & Export</button></div></div><div class="lesson-sections" id="lesson-sections"></div></div>' +
                    '</div>' +
                    '<div class="lesson-panel" id="lesson-step-4">' +
                        '<div class="image-search-container">' +
                            '<div class="image-search-header"><h3>🖼️ Find Visual Resources</h3><p>Search for educational images to include with your lesson plan</p></div>' +
                            '<div class="image-search-input"><input type="text" id="image-search-query" placeholder="Search Wikipedia for images..."><button id="image-search-btn" class="search-btn">🔍 Search</button><button id="image-generate-btn" class="search-btn ai">✨ Generate AI Image</button></div>' +
                            '<div class="image-results" id="image-results"><p class="placeholder-text">Enter a search term to find images from Wikipedia and Wikimedia Commons</p></div>' +
                            '<div class="selected-images"><h4>Selected Images (<span id="selected-count">0</span>)</h4><div id="selected-images-list"></div></div>' +
                            '<div class="image-actions"><button id="image-back-btn" class="action-btn">← Back to Plan</button><button id="image-continue-btn" class="action-btn primary">Continue to Export →</button></div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="lesson-panel" id="lesson-step-5">' +
                        '<div class="export-container"><div class="export-preview" id="pdf-preview"></div><div class="export-options"><h4>Export Options</h4><label class="checkbox-label"><input type="checkbox" id="include-images" checked> Include selected images</label><label class="checkbox-label"><input type="checkbox" id="include-standards" checked> Include standards alignment</label><label class="checkbox-label"><input type="checkbox" id="include-blended" checked> Include blended learning suggestions</label><label class="checkbox-label"><input type="checkbox" id="include-reading" checked> Include student reading material</label><div class="export-buttons"><button id="save-to-files-btn" class="download-btn primary">💾 Save to My Files</button><button id="download-pdf-btn" class="download-btn">📥 Download PDF</button></div><p class="export-note" id="export-status"></p></div></div>' +
                    '</div>' +
                    '<div class="lesson-panel" id="lesson-step-6">' +
                        '<div class="reading-container">' +
                            '<div class="reading-header"><h3>📖 Student Reading Material</h3><p>AI-generated reading content aligned with your lesson standards</p></div>' +
                            '<div class="reading-status" id="reading-status"></div>' +
                            '<div class="reading-content" id="reading-content"><p class="placeholder-text">Click "Generate Reading" to create student reading material based on your lesson plan and standards.</p></div>' +
                            '<div class="reading-actions"><button id="reading-back-btn" class="action-btn">← Back to Plan</button><button id="reading-regenerate-btn" class="action-btn">🔄 Regenerate</button><button id="reading-continue-btn" class="action-btn primary">Continue to Export →</button></div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="lesson-panel" id="lesson-step-7">' +
                        '<div class="quiz-container">' +
                            '<div class="quiz-header">' +
                                '<h3>📝 Quiz Generator</h3>' +
                                '<p>AI-generated quiz aligned with your lesson and standards</p>' +
                                '<div class="quiz-code-display">Quiz Code: <span id="quiz-code">------</span></div>' +
                            '</div>' +
                            '<div class="quiz-status" id="quiz-status"></div>' +
                            '<div class="quiz-content" id="quiz-content">' +
                                '<p class="placeholder-text">Click "Generate Quiz" to create a 12-question quiz based on your lesson plan, reading material, and standards.</p>' +
                            '</div>' +
                            '<div class="quiz-actions">' +
                                '<button id="quiz-back-btn" class="action-btn">← Back to Plan</button>' +
                                '<button id="quiz-regenerate-btn" class="action-btn">🔄 Regenerate</button>' +
                                '<button id="quiz-save-btn" class="action-btn primary" disabled>✓ Save Quiz</button>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    }
    
    initLessonPlanner(windowEl) {
        const self = this;
        let conversationHistory = [];
        let lessonData = { subject: '', grade: '', topic: '', standard: '', duration: '', objectives: [], requirements: '', teacherContext: null };
        let generatedPlan = null;
        let currentLessonId = null;
        
        const chatMessages = windowEl.querySelector('#lesson-chat-messages');
        const chatInput = windowEl.querySelector('#lesson-chat-input');
        const sendBtn = windowEl.querySelector('#lesson-chat-send');
        const generateBtn = windowEl.querySelector('#lesson-generate-btn');
        const steps = windowEl.querySelectorAll('.step');
        const panels = windowEl.querySelectorAll('.lesson-panel');
        
        async function loadTeacherContext() {
            try {
                const response = await self.api('/lesson/context');
                lessonData.teacherContext = response;
                if (response.recentTopics && response.recentTopics.length > 0) {
                    addMessage('assistant', 'I see you\'ve been working on some great lessons! Recently you\'ve covered: ' + response.recentTopics.slice(0,3).join(', ') + '. Would you like to continue building on those themes, or explore something new?');
                }
            } catch (error) { console.log('No existing context found'); }
        }
        
        function goToStep(stepNum) {
            steps.forEach(s => s.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            const targetStep = windowEl.querySelector('.step[data-step="' + stepNum + '"]');
            const targetPanel = windowEl.querySelector('#lesson-step-' + stepNum);
            if (targetStep) targetStep.classList.add('active');
            if (targetPanel) targetPanel.classList.add('active');
        }
        
        function addMessage(role, content) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'chat-message ' + role;
            messageDiv.innerHTML = '<div class="message-content">' + content + '</div>';
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        
        function updateQuickInfo() {
            windowEl.querySelector('#info-subject').textContent = lessonData.subject || '-';
            windowEl.querySelector('#info-grade').textContent = lessonData.grade || '-';
            windowEl.querySelector('#info-topic').textContent = lessonData.topic || '-';
            windowEl.querySelector('#info-standard').textContent = lessonData.standard || '-';
            windowEl.querySelector('#info-duration').textContent = lessonData.duration || '-';
            generateBtn.disabled = !(lessonData.subject && lessonData.grade && lessonData.topic);
        }
        
        async function sendMessage() {
            const message = chatInput.value.trim();
            if (!message) return;
            addMessage('user', message);
            chatInput.value = '';
            sendBtn.disabled = true;
            conversationHistory.push({ role: 'user', content: message });
            try {
                const response = await self.api('/lesson/chat', {
                    method: 'POST',
                    body: JSON.stringify({ message, conversationHistory, currentData: lessonData })
                });
                conversationHistory.push({ role: 'assistant', content: response.message });
                addMessage('assistant', response.message);
                if (response.extractedData) { Object.assign(lessonData, response.extractedData); updateQuickInfo(); }
                if (response.readyToGenerate) { generateBtn.classList.add('pulse'); }
            } catch (error) { addMessage('assistant', 'Sorry, I had trouble processing that. Could you try again?'); }
            finally { sendBtn.disabled = false; }
        }
        
        async function generateLessonPlan() {
            goToStep(2);
            const statusEl = windowEl.querySelector('.generating-status');
            const progressFill = windowEl.querySelector('.progress-fill');
            const stages = [{ text: 'Analyzing requirements...', progress: 10 }, { text: 'Researching standards alignment...', progress: 25 }, { text: 'Creating learning objectives...', progress: 40 }, { text: 'Developing lesson content...', progress: 55 }, { text: 'Adding discussion topics...', progress: 70 }, { text: 'Generating blended learning ideas...', progress: 85 }, { text: 'Finalizing lesson plan...', progress: 95 }];
            let stageIndex = 0;
            const stageInterval = setInterval(() => { if (stageIndex < stages.length) { statusEl.textContent = stages[stageIndex].text; progressFill.style.width = stages[stageIndex].progress + '%'; stageIndex++; } }, 2000);
            try {
                const response = await self.api('/lesson/generate', { method: 'POST', body: JSON.stringify({ lessonData, conversationHistory }) });
                clearInterval(stageInterval);
                progressFill.style.width = '100%';
                statusEl.textContent = 'Complete!';
                generatedPlan = response.lessonPlan;
                currentLessonId = response.lessonId;
                console.log('Lesson saved with ID:', currentLessonId);
                setTimeout(() => { goToStep(3); setTimeout(() => renderLessonPlan(generatedPlan), 50); }, 500);
            } catch (error) { clearInterval(stageInterval); statusEl.textContent = 'Error: ' + error.message; progressFill.style.backgroundColor = '#e74c3c'; }
        }
        
        function renderLessonPlan(plan) {
            const sectionsContainer = windowEl.querySelector('#lesson-sections');
            const reviewTitle = windowEl.querySelector('#review-title');
            reviewTitle.textContent = plan.title || 'Lesson Plan';
            sectionsContainer.innerHTML = '';
            const sections = [{ key: 'overview', title: '📋 Overview' }, { key: 'objectives', title: '🎯 Learning Objectives' }, { key: 'materials', title: '📦 Materials Needed' }, { key: 'introduction', title: '👋 Introduction/Hook' }, { key: 'directInstruction', title: '📖 Direct Instruction' }, { key: 'guidedPractice', title: '🤝 Guided Practice' }, { key: 'independentPractice', title: '✍️ Independent Practice' }, { key: 'discussion', title: '💬 Discussion Topics' }, { key: 'funFacts', title: '🌟 Fun Facts' }, { key: 'assessment', title: '📊 Assessment' }, { key: 'closure', title: '🏁 Closure' }, { key: 'blendedLearning', title: '🔀 Blended Learning' }, { key: 'differentiation', title: '🎭 Differentiation' }, { key: 'standards', title: '📜 Standards Alignment' }];
            sections.forEach(section => {
                if (plan[section.key]) {
                    const sectionEl = document.createElement('div');
                    sectionEl.className = 'lesson-section';
                    sectionEl.innerHTML = '<div class="section-header"><label class="section-toggle"><input type="checkbox" checked data-section="' + section.key + '"><span class="toggle-slider"></span></label><h4>' + section.title + '</h4><button class="section-collapse">▼</button></div><div class="section-content">' + formatSectionContent(section.key, plan[section.key]) + '</div>';
                    sectionsContainer.appendChild(sectionEl);
                    const collapseBtn = sectionEl.querySelector('.section-collapse');
                    const content = sectionEl.querySelector('.section-content');
                    collapseBtn.addEventListener('click', () => { content.classList.toggle('collapsed'); collapseBtn.textContent = content.classList.contains('collapsed') ? '▶' : '▼'; });
                }
            });
        }
        
        // Convert camelCase to Title Case (e.g., "technologyIntegration" -> "Technology Integration")
        function camelToTitle(str) {
            return str.replace(/([A-Z])/g, ' $1').replace(/^./, function(s) { return s.toUpperCase(); }).trim();
        }
        
        function formatSectionContent(key, content) {
            if (Array.isArray(content)) return '<ul>' + content.map(item => '<li>' + item + '</li>').join('') + '</ul>';
            if (typeof content === 'object') return '<div class="content-block">' + Object.entries(content).map(([k, v]) => '<div class="content-item"><strong>' + camelToTitle(k) + ':</strong> ' + (Array.isArray(v) ? v.join(', ') : v) + '</div>').join('') + '</div>';
            return '<div class="content-text">' + content + '</div>';
        }
        
        // Selected images for the lesson
        let selectedImages = [];
        
        async function searchImages() {
            const query = windowEl.querySelector('#image-search-query').value.trim();
            if (!query) return;
            
            const resultsEl = windowEl.querySelector('#image-results');
            resultsEl.innerHTML = '<div class="loading-images"><div class="spinner"></div><p>Searching for images...</p></div>';
            
            try {
                const response = await self.api('/lesson/search-images', { method: 'POST', body: JSON.stringify({ query, count: 8 }) });
                
                if (response.images && response.images.length > 0) {
                    resultsEl.innerHTML = '<div class="image-grid">' + response.images.map((img, idx) => 
                        '<div class="image-result" data-idx="' + idx + '">' +
                            '<img src="' + img.url + '" alt="' + (img.title || 'Image') + '" loading="lazy" onerror="this.parentElement.style.display=\'none\'">' +
                            '<div class="image-info"><p class="image-title">' + (img.title || 'Untitled').substring(0, 50) + '</p><span class="image-source">' + img.source + '</span></div>' +
                            '<button class="select-image-btn">+ Add</button>' +
                        '</div>'
                    ).join('') + '</div>';
                    
                    // Store images data for selection
                    resultsEl.querySelectorAll('.image-result').forEach((el, idx) => {
                        el.querySelector('.select-image-btn').addEventListener('click', () => {
                            const img = response.images[idx];
                            if (!selectedImages.find(i => i.url === img.url)) {
                                selectedImages.push(img);
                                updateSelectedImages();
                                el.classList.add('selected');
                            }
                        });
                    });
                } else {
                    resultsEl.innerHTML = '<p class="no-results">No images found. Try a different search term.</p>';
                }
            } catch (error) {
                resultsEl.innerHTML = '<p class="error-text">Failed to search images: ' + error.message + '</p>';
            }
        }
        
        async function generateAIImage() {
            const query = windowEl.querySelector('#image-search-query').value.trim() || lessonData.topic;
            if (!query) {
                self.showNotification('Please enter a description for the image', 'warning');
                return;
            }
            
            const resultsEl = windowEl.querySelector('#image-results');
            resultsEl.innerHTML = '<div class="loading-images"><div class="spinner"></div><p>Generating AI image... This may take a moment.</p></div>';
            
            try {
                const response = await self.api('/lesson/generate-image', { method: 'POST', body: JSON.stringify({ prompt: query }) });
                
                resultsEl.innerHTML = '<div class="image-grid"><div class="image-result generated">' +
                    '<img src="' + response.url + '" alt="' + query + '">' +
                    '<div class="image-info"><p class="image-title">' + query.substring(0, 50) + '</p><span class="image-source">AI Generated</span></div>' +
                    '<button class="select-image-btn">+ Add</button>' +
                '</div></div>';
                
                resultsEl.querySelector('.select-image-btn').addEventListener('click', () => {
                    if (!selectedImages.find(i => i.url === response.url)) {
                        selectedImages.push(response);
                        updateSelectedImages();
                        resultsEl.querySelector('.image-result').classList.add('selected');
                    }
                });
            } catch (error) {
                resultsEl.innerHTML = '<p class="error-text">Failed to generate image: ' + error.message + '</p>';
            }
        }
        
        function updateSelectedImages() {
            const listEl = windowEl.querySelector('#selected-images-list');
            const countEl = windowEl.querySelector('#selected-count');
            countEl.textContent = selectedImages.length;
            
            listEl.innerHTML = selectedImages.map((img, idx) => 
                '<div class="selected-image-item">' +
                    '<img src="' + img.url + '" alt="' + (img.title || 'Image') + '">' +
                    '<span>' + (img.title || 'Image').substring(0, 30) + '</span>' +
                    '<button class="remove-image-btn" data-idx="' + idx + '">×</button>' +
                '</div>'
            ).join('');
            
            listEl.querySelectorAll('.remove-image-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    selectedImages.splice(parseInt(btn.dataset.idx), 1);
                    updateSelectedImages();
                });
            });
        }
        
        async function exportToPDF() {
            goToStep(5);
            const includedSections = {};
            windowEl.querySelectorAll('.section-toggle input:checked').forEach(input => { includedSections[input.dataset.section] = true; });
            const includeImages = windowEl.querySelector('#include-images').checked;
            const includeStandards = windowEl.querySelector('#include-standards').checked;
            const includeBlended = windowEl.querySelector('#include-blended').checked;
            const includeReading = windowEl.querySelector('#include-reading').checked;
            try {
                const response = await self.api('/lesson/export-pdf', { method: 'POST', body: JSON.stringify({ lessonPlan: generatedPlan, includedSections, options: { includeImages, includeStandards, includeBlended } }) });
                const previewEl = windowEl.querySelector('#pdf-preview');
                previewEl.innerHTML = '<iframe src="' + response.previewUrl + '" frameborder="0"></iframe>';
                windowEl.querySelector('#download-pdf-btn').onclick = () => { window.open(response.downloadUrl, '_blank'); };
            } catch (error) { self.showNotification('Failed to generate PDF: ' + error.message, 'error'); }
        }
        
        async function saveToFiles() {
            const statusEl = windowEl.querySelector('#export-status');
            statusEl.textContent = 'Saving lesson plan to your files...';
            statusEl.className = 'export-note saving';
            
            const includedSections = {};
            windowEl.querySelectorAll('.section-toggle input:checked').forEach(input => { includedSections[input.dataset.section] = true; });
            const includeStandards = windowEl.querySelector('#include-standards').checked;
            const includeBlended = windowEl.querySelector('#include-blended').checked;
            const includeReading = windowEl.querySelector('#include-reading')?.checked || false;
            
            try {
                const response = await self.api('/lesson/save-to-files', { 
                    method: 'POST', 
                    body: JSON.stringify({ 
                        lessonPlan: generatedPlan, 
                        includedSections, 
                        options: { includeStandards, includeBlended, includeReading },
                        readingContent: includeReading ? generatedReading : null,
                        images: selectedImages
                    }) 
                });
                
                statusEl.innerHTML = '✅ ' + response.message + '<br><button id="open-in-browser-btn" class="open-browser-btn">🌐 Open in Browser</button>';
                statusEl.className = 'export-note success';
                self.showNotification('Lesson saved to ' + response.folder, 'success');
                
                const openBtn = statusEl.querySelector('#open-in-browser-btn');
                if (openBtn && response.htmlUrl) {
                    openBtn.addEventListener('click', () => {
                        self.openBrowserWithUrl(response.htmlUrl);
                    });
                }
            } catch (error) {
                statusEl.textContent = '❌ Failed to save: ' + error.message;
                statusEl.className = 'export-note error';
                self.showNotification('Failed to save lesson: ' + error.message, 'error');
            }
        }
        
        async function loadHistory() {
            try {
                const history = await self.api('/lesson/history');
                const historyList = windowEl.querySelector('.history-list');
                historyList.innerHTML = history.map(lesson => '<div class="history-item" data-id="' + lesson.id + '"><span class="history-subject">' + lesson.subject + '</span><span class="history-topic">' + lesson.topic + '</span><span class="history-date">' + new Date(lesson.created_at).toLocaleDateString() + '</span></div>').join('');
                historyList.querySelectorAll('.history-item').forEach(item => { item.addEventListener('click', () => loadLesson(item.dataset.id)); });
            } catch (error) { console.log('No history available'); }
        }
        
        async function loadLesson(id) {
            try {
                const lesson = await self.api('/lesson/' + id);
                generatedPlan = lesson.plan;
                lessonData = lesson.data;
                currentLessonId = parseInt(id);
                generatedReading = lesson.readingContent || null;
                if (lesson.quizData) {
                    generatedQuiz = lesson.quizData.questions || null;
                    quizCode = lesson.quizData.quizCode || null;
                }
                console.log('Loaded lesson ID:', currentLessonId, 'Has reading:', !!generatedReading, 'Has quiz:', !!generatedQuiz);
                renderLessonPlan(generatedPlan);
                goToStep(3);
            } catch (error) { self.showNotification('Failed to load lesson', 'error'); }
        }
        
        
        // Reading material state
        let generatedReading = null;
        let generatedQuiz = null;
        let quizCode = null;
        
        
        // Generate 6-digit quiz code
        function generateQuizCode() {
            return Math.floor(100000 + Math.random() * 900000).toString();
        }
        
        async function generateQuiz(forceRegenerate = false) {
            console.log('generateQuiz called');
            if (!generatedPlan) {
                self.showNotification('Please generate a lesson plan first', 'warning');
                return;
            }
            
            goToStep(7);
            const statusEl = windowEl.querySelector('#quiz-status');
            const contentEl = windowEl.querySelector('#quiz-content');
            const saveBtn = windowEl.querySelector('#quiz-save-btn');
            const quizCodeEl = windowEl.querySelector('#quiz-code');
            
            // If we already have quiz and not forcing regeneration, just display it
            if (generatedQuiz && !forceRegenerate) {
                statusEl.innerHTML = '<p class="success-status">✅ Quiz loaded from saved lesson</p>';
                renderQuizEditor(generatedQuiz);
                quizCodeEl.textContent = quizCode || generateQuizCode();
                saveBtn.disabled = false;
                return;
            }
            
            // Disable buttons
            const generateQuizBtn = windowEl.querySelector('#lesson-generate-quiz');
            const regenerateBtn = windowEl.querySelector('#quiz-regenerate-btn');
            if (generateQuizBtn) generateQuizBtn.disabled = true;
            if (regenerateBtn) regenerateBtn.disabled = true;
            saveBtn.disabled = true;
            
            // Generate new quiz code
            quizCode = generateQuizCode();
            quizCodeEl.textContent = quizCode;
            
            statusEl.innerHTML = '<div class="generating-quiz"><div class="spinner"></div><p>Generating 12-question quiz... This may take 30-60 seconds.</p></div>';
            contentEl.innerHTML = '<div class="loading-placeholder"><p>Creating a mix of short answer, true/false, and multiple choice questions...</p></div>';
            
            try {
                const response = await self.api('/lesson/generate-quiz', {
                    method: 'POST',
                    body: JSON.stringify({ 
                        lessonPlan: generatedPlan, 
                        lessonData,
                        readingContent: generatedReading
                    })
                });
                
                statusEl.innerHTML = '<p class="success-status">✅ Quiz generated! Edit questions below, then save.</p>';
                generatedQuiz = response.questions;
                
                renderQuizEditor(generatedQuiz);
                
                // Save quiz to database
                if (currentLessonId) {
                    try {
                        await self.api('/lesson/save-quiz', {
                            method: 'POST',
                            body: JSON.stringify({ 
                                lessonId: currentLessonId, 
                                quizData: { questions: generatedQuiz, quizCode }
                            })
                        });
                    } catch (saveErr) {
                        console.error('Failed to auto-save quiz:', saveErr);
                    }
                }
                
                saveBtn.disabled = false;
                
            } catch (error) {
                statusEl.innerHTML = '<p class="error-status">❌ Failed to generate: ' + error.message + '</p>';
                contentEl.innerHTML = '<p class="placeholder-text">Click "Regenerate" to try again.</p>';
            } finally {
                if (generateQuizBtn) generateQuizBtn.disabled = false;
                if (regenerateBtn) regenerateBtn.disabled = false;
            }
        }
        
        function renderQuizEditor(questions) {
            const contentEl = windowEl.querySelector('#quiz-content');
            
            let html = '<div class="quiz-editor">';
            html += '<div class="quiz-student-info">';
            html += '<label>Student Name: <input type="text" class="student-name-field" placeholder="________________" readonly></label>';
            html += '</div>';
            html += '<div class="quiz-questions">';
            
            questions.forEach((q, idx) => {
                html += '<div class="quiz-question-item" data-index="' + idx + '">';
                html += '<div class="question-header">';
                html += '<span class="question-number">Q' + (idx + 1) + '</span>';
                html += '<span class="question-type ' + q.type.toLowerCase().replace(/\s+/g, '-') + '">' + q.type + '</span>';
                html += '<button class="remove-question-btn" title="Remove question">✕</button>';
                html += '</div>';
                html += '<div class="question-text-edit">';
                html += '<textarea class="question-text" rows="2">' + escapeHtml(q.question) + '</textarea>';
                html += '</div>';
                
                if (q.type === 'Multiple Choice' && q.options) {
                    html += '<div class="question-options">';
                    q.options.forEach((opt, optIdx) => {
                        const letter = String.fromCharCode(65 + optIdx);
                        const isCorrect = opt === q.answer || letter === q.answer;
                        html += '<div class="option-item ' + (isCorrect ? 'correct' : '') + '">';
                        html += '<input type="radio" name="q' + idx + '" ' + (isCorrect ? 'checked' : '') + ' data-opt="' + optIdx + '">';
                        html += '<span class="option-letter">' + letter + '.</span>';
                        html += '<input type="text" class="option-text" value="' + escapeHtml(opt) + '">';
                        html += '</div>';
                    });
                    html += '</div>';
                } else if (q.type === 'True/False') {
                    html += '<div class="tf-options">';
                    html += '<label><input type="radio" name="q' + idx + '" value="True" ' + (q.answer === 'True' ? 'checked' : '') + '> True</label>';
                    html += '<label><input type="radio" name="q' + idx + '" value="False" ' + (q.answer === 'False' ? 'checked' : '') + '> False</label>';
                    html += '</div>';
                } else {
                    html += '<div class="answer-field">';
                    html += '<label>Answer: <input type="text" class="answer-text" value="' + escapeHtml(q.answer) + '"></label>';
                    html += '</div>';
                }
                
                html += '</div>';
            });
            
            html += '</div></div>';
            contentEl.innerHTML = html;
            
            // Add remove button handlers
            contentEl.querySelectorAll('.remove-question-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const item = e.target.closest('.quiz-question-item');
                    const idx = parseInt(item.dataset.index);
                    generatedQuiz.splice(idx, 1);
                    renderQuizEditor(generatedQuiz);
                    self.showNotification('Question removed', 'info');
                });
            });
        }
        
        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        async function saveQuiz() {
            const saveBtn = windowEl.querySelector('#quiz-save-btn');
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';
            
            // Collect edited quiz data from the form
            const questions = [];
            windowEl.querySelectorAll('.quiz-question-item').forEach((item, idx) => {
                const q = {
                    question: item.querySelector('.question-text').value,
                    type: generatedQuiz[idx]?.type || 'Short Answer',
                    answer: ''
                };
                
                if (q.type === 'Multiple Choice') {
                    q.options = [];
                    item.querySelectorAll('.option-text').forEach(opt => {
                        q.options.push(opt.value);
                    });
                    const checkedOpt = item.querySelector('input[type="radio"]:checked');
                    if (checkedOpt) {
                        const optIdx = parseInt(checkedOpt.dataset.opt);
                        q.answer = q.options[optIdx];
                    }
                } else if (q.type === 'True/False') {
                    const checkedTF = item.querySelector('input[type="radio"]:checked');
                    q.answer = checkedTF ? checkedTF.value : 'True';
                } else {
                    q.answer = item.querySelector('.answer-text')?.value || '';
                }
                
                questions.push(q);
            });
            
            generatedQuiz = questions;
            
            try {
                if (currentLessonId) {
                    await self.api('/lesson/save-quiz', {
                        method: 'POST',
                        body: JSON.stringify({ 
                            lessonId: currentLessonId, 
                            quizData: { questions: generatedQuiz, quizCode }
                        })
                    });
                }
                self.showNotification('Quiz saved successfully!', 'success');
                windowEl.querySelector('#quiz-status').innerHTML = '<p class="success-status">✅ Quiz saved!</p>';
            } catch (error) {
                self.showNotification('Failed to save quiz: ' + error.message, 'error');
            } finally {
                saveBtn.disabled = false;
                saveBtn.textContent = '✓ Save Quiz';
            }
        }
        
async function generateReadingMaterial(forceRegenerate = false) {
            console.log('generateReadingMaterial called, generatedPlan:', generatedPlan, 'existing reading:', !!generatedReading);
            if (!generatedPlan) {
                self.showNotification('Please generate a lesson plan first', 'warning');
                return;
            }
            
            goToStep(6);
            const statusEl = windowEl.querySelector('#reading-status');
            const contentEl = windowEl.querySelector('#reading-content');
            
            // If we already have reading content and not forcing regeneration, just display it
            if (generatedReading && !forceRegenerate) {
                statusEl.innerHTML = '<p class="success-status">✅ Reading material loaded from saved lesson</p>';
                contentEl.innerHTML = '<div class="reading-preview">' + generatedReading + '</div>';
                return;
            }
            
            // Disable buttons to prevent multiple clicks
            const generateReadingBtn = windowEl.querySelector('#lesson-generate-reading');
            const regenerateBtn = windowEl.querySelector('#reading-regenerate-btn');
            if (generateReadingBtn) generateReadingBtn.disabled = true;
            if (regenerateBtn) regenerateBtn.disabled = true;
            
            statusEl.innerHTML = '<div class="generating-reading"><div class="spinner"></div><p>Generating student reading material aligned with standards... This may take 30-60 seconds.</p></div>';
            contentEl.innerHTML = '<div class="loading-placeholder"><p>Please wait while the AI creates comprehensive reading material for your students...</p></div>';
            
            try {
                const response = await self.api('/lesson/generate-reading', {
                    method: 'POST',
                    body: JSON.stringify({ lessonPlan: generatedPlan, lessonData })
                });
                
                statusEl.innerHTML = '<p class="success-status">✅ Reading material generated successfully!</p>';
                generatedReading = response.readingContent;
                
                // Display the reading content with styling
                contentEl.innerHTML = '<div class="reading-preview">' + response.readingContent + '</div>';
                
                // Save reading to database if we have a lesson ID
                if (currentLessonId) {
                    try {
                        await self.api('/lesson/save-reading', {
                            method: 'POST',
                            body: JSON.stringify({ lessonId: currentLessonId, readingContent: generatedReading })
                        });
                        console.log('Reading content saved to lesson', currentLessonId);
                    } catch (saveErr) {
                        console.error('Failed to save reading:', saveErr);
                    }
                }
                
                // Re-enable buttons
                if (generateReadingBtn) generateReadingBtn.disabled = false;
                if (regenerateBtn) regenerateBtn.disabled = false;
                
            } catch (error) {
                statusEl.innerHTML = '<p class="error-status">❌ Failed to generate: ' + error.message + '</p>';
                contentEl.innerHTML = '<p class="placeholder-text">Click "Regenerate" to try again.</p>';
                
                // Re-enable buttons on error
                if (generateReadingBtn) generateReadingBtn.disabled = false;
                if (regenerateBtn) regenerateBtn.disabled = false;
            }
        }
        
sendBtn.addEventListener('click', sendMessage);
        chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
        generateBtn.addEventListener('click', generateLessonPlan);
        windowEl.querySelector('#lesson-export-btn').addEventListener('click', exportToPDF);
        windowEl.querySelector('#lesson-regenerate').addEventListener('click', () => { goToStep(1); generateBtn.disabled = false; });
        
        // Image search bindings
        windowEl.querySelector('#lesson-find-images').addEventListener('click', () => { 
            goToStep(4);
            windowEl.querySelector('#image-search-query').value = lessonData.topic || '';
        });
        windowEl.querySelector('#image-search-btn').addEventListener('click', searchImages);
        windowEl.querySelector('#image-generate-btn').addEventListener('click', generateAIImage);
        windowEl.querySelector('#image-search-query').addEventListener('keydown', (e) => { if (e.key === 'Enter') searchImages(); });
        windowEl.querySelector('#image-back-btn').addEventListener('click', () => goToStep(3));
        windowEl.querySelector('#image-continue-btn').addEventListener('click', () => goToStep(5));
        windowEl.querySelector('#save-to-files-btn').addEventListener('click', saveToFiles);
        // Reading material bindings
        const readingBtn = windowEl.querySelector('#lesson-generate-reading');
        console.log('Reading button found:', readingBtn);
        if (readingBtn) {
            readingBtn.addEventListener('click', () => {
                console.log('Reading button clicked!');
                generateReadingMaterial();
            });
        } else {
            console.error('Could not find #lesson-generate-reading button');
        }
        windowEl.querySelector('#reading-back-btn').addEventListener('click', () => goToStep(3));
        windowEl.querySelector('#reading-regenerate-btn').addEventListener('click', () => generateReadingMaterial(true));
        windowEl.querySelector('#reading-continue-btn').addEventListener('click', () => goToStep(5));
        // Quiz bindings
        windowEl.querySelector('#lesson-generate-quiz').addEventListener('click', () => generateQuiz(false));
        windowEl.querySelector('#quiz-back-btn').addEventListener('click', () => goToStep(3));
        windowEl.querySelector('#quiz-regenerate-btn').addEventListener('click', () => generateQuiz(true));
        windowEl.querySelector('#quiz-save-btn').addEventListener('click', saveQuiz);
        

        

        
        loadTeacherContext();
        loadHistory();
    }

}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    window.desktopOS = new DesktopOS();
});
