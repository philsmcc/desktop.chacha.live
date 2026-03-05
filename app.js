// HoverCam Desktop OS - v2.0 with Backend Integration
class DesktopOS {
    constructor() {
        this.currentUser = null;
        this.token = null;
        this.windows = new Map();
        this.windowZIndex = 100;
        this.darkMode = true;
        this.isFullscreen = false;
        this.wallpaper = null;
        this.wallpaperType = 'gradient'; // gradient, image, color
        this.wallpaperColor = '#0f0f1a';
        this.systemWallpapers = [];
        this.userWallpapers = [];
        this.iconPositions = {};
        this.apps = this.defineApps();
        
        this.init();
    }

    // Gradient wallpaper presets
    gradientPresets = [
        { id: 'gradient1', name: 'Dark Ocean', gradient: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)' },
        { id: 'gradient2', name: 'Sunset', gradient: 'linear-gradient(135deg, #1a1a2e 0%, #2d1f3d 50%, #4a2545 100%)' },
        { id: 'gradient3', name: 'Aurora', gradient: 'linear-gradient(135deg, #0f1923 0%, #1a3a4a 50%, #0f4c5c 100%)' },
        { id: 'gradient4', name: 'Ember', gradient: 'linear-gradient(135deg, #1a0f0f 0%, #2e1a1a 50%, #3e2016 100%)' },
        { id: 'gradient5', name: 'Forest', gradient: 'linear-gradient(135deg, #0f1a0f 0%, #1a2e1a 50%, #163e20 100%)' },
        { id: 'gradient6', name: 'Midnight', gradient: 'linear-gradient(135deg, #0a0a1a 0%, #151530 50%, #1a1a40 100%)' }
    ];

    defineApps() {
        return [
            {
                id: "whiteboard",
                name: "Whiteboard",
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>',
                defaultSize: { width: 900, height: 600 },
                content: () => this.renderWhiteboardApp()
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
            }
        ];
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
        } catch (error) {
            console.log('Could not load preferences:', error.message);
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
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        const errorDiv = document.getElementById("login-error");
        const loginBtn = document.querySelector(".login-btn");

        if (!username || !password) {
            errorDiv.textContent = "Please enter username and password";
            return;
        }

        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span>Signing in...</span>';

        try {
            const response = await this.api('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });

            this.token = response.token;
            this.currentUser = response.user;
            
            localStorage.setItem("hovercam_token", this.token);
            localStorage.setItem("hovercam_session", JSON.stringify(this.currentUser));
            
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
        document.getElementById("current-user").textContent = this.currentUser.username;
        
        this.renderTaskbar();
        this.renderDesktopIcons();
        this.applyWallpaper();
        
        setTimeout(() => this.openApp("welcome"), 300);
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

    renderDesktopIcons() {
        const container = document.getElementById("desktop-icons");
        container.innerHTML = "";
        
        this.apps.forEach((app, index) => {
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
                const col = Math.floor(index / 5);
                const row = index % 5;
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
        });
    }

    makeIconDraggable(icon) {
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
                const appId = icon.dataset.app;
                this.iconPositions[appId] = {
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
            this.setWallpaper('image', data.wallpaper.url);
            
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
        
        win.element.style.zIndex = ++this.windowZIndex;
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
        
        if (!isMaximized) {
            // Save current position/size before maximizing
            win.savedState = {
                left: win.element.style.left,
                top: win.element.style.top,
                width: win.element.style.width,
                height: win.element.style.height
            };
            win.element.classList.add("maximized");
        } else {
            // Restore previous position/size
            if (win.savedState) {
                win.element.style.left = win.savedState.left;
                win.element.style.top = win.savedState.top;
                win.element.style.width = win.savedState.width;
                win.element.style.height = win.savedState.height;
            }
            win.element.classList.remove("maximized");
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
            '</div>' +
        '</div>';
    }

    initWhiteboard(windowEl) {
        const container = windowEl.querySelector('.wb-canvas-container');
        const canvas = windowEl.querySelector('.wb-canvas');
        const ctx = canvas.getContext('2d');
        const toolbar = windowEl.querySelector('.wb-floating-toolbar');
        
        // Whiteboard state
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
            activeSlideout: null
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

        // Resize canvas to fit container
        const resizeCanvas = () => {
            const rect = container.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            
            const imageData = canvas.width > 0 ? ctx.getImageData(0, 0, canvas.width, canvas.height) : null;
            
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            canvas.style.width = rect.width + 'px';
            canvas.style.height = rect.height + 'px';
            
            ctx.scale(dpr, dpr);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            ctx.fillStyle = state.bgColor;
            ctx.fillRect(0, 0, rect.width, rect.height);
            
            if (imageData) {
                ctx.putImageData(imageData, 0, 0);
            }
        };

        // Save state to history
        const saveState = () => {
            state.historyIndex++;
            state.history = state.history.slice(0, state.historyIndex);
            state.history.push(canvas.toDataURL());
            if (state.history.length > 50) {
                state.history.shift();
                state.historyIndex--;
            }
        };

        // Restore state from history
        const restoreState = (index) => {
            if (index < 0 || index >= state.history.length) return;
            const img = new Image();
            img.onload = () => {
                const dpr = window.devicePixelRatio || 1;
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                ctx.scale(dpr, dpr);
            };
            img.src = state.history[index];
        };

        // Get coordinates from event
        const getCoords = (e) => {
            const rect = canvas.getBoundingClientRect();
            if (e.touches && e.touches.length > 0) {
                return {
                    x: e.touches[0].clientX - rect.left,
                    y: e.touches[0].clientY - rect.top
                };
            }
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        };

        // Start drawing
        const startDrawing = (e) => {
            e.preventDefault();
            closeAllSlideouts();
            state.isDrawing = true;
            const coords = getCoords(e);
            state.lastX = coords.x;
            state.lastY = coords.y;
            
            ctx.beginPath();
            ctx.arc(coords.x, coords.y, state.size / 2, 0, Math.PI * 2);
            ctx.fillStyle = state.tool === 'eraser' ? state.bgColor : state.color;
            if (state.tool === 'highlighter') {
                ctx.globalAlpha = 0.3;
            }
            ctx.fill();
            ctx.globalAlpha = 1;
        };

        // Draw
        const draw = (e) => {
            if (!state.isDrawing) return;
            e.preventDefault();
            
            const coords = getCoords(e);
            
            ctx.beginPath();
            ctx.moveTo(state.lastX, state.lastY);
            ctx.lineTo(coords.x, coords.y);
            
            if (state.tool === 'eraser') {
                ctx.strokeStyle = state.bgColor;
                ctx.lineWidth = state.size * 3;
                ctx.globalAlpha = 1;
            } else if (state.tool === 'highlighter') {
                ctx.strokeStyle = state.color;
                ctx.lineWidth = state.size * 2;
                ctx.globalAlpha = 0.3;
            } else {
                ctx.strokeStyle = state.color;
                ctx.lineWidth = state.size;
                ctx.globalAlpha = 1;
            }
            
            ctx.stroke();
            ctx.globalAlpha = 1;
            
            state.lastX = coords.x;
            state.lastY = coords.y;
        };

        // Stop drawing
        const stopDrawing = () => {
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

        // Canvas events - touch
        canvas.addEventListener('touchstart', startDrawing, { passive: false });
        canvas.addEventListener('touchmove', draw, { passive: false });
        canvas.addEventListener('touchend', stopDrawing);
        canvas.addEventListener('touchcancel', stopDrawing);

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
                
                // Update eraser button state
                toolbar.querySelector('.wb-eraser-btn').classList.remove('active');
                
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
                
                // Switch to pen if eraser was active
                if (state.tool === 'eraser') {
                    state.tool = 'pen';
                    updateToolIcon('pen');
                    toolbar.querySelector('.wb-eraser-btn').classList.remove('active');
                    toolbar.querySelectorAll('.wb-slideout-btn[data-tool]').forEach(b => b.classList.remove('active'));
                    const penBtn = toolbar.querySelector('.wb-slideout-btn[data-tool="pen"]');
                    if (penBtn) penBtn.classList.add('active');
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
                        toolbar.querySelectorAll('.wb-slideout-btn[data-tool]').forEach(b => b.classList.remove('active'));
                    }
                } else if (action === 'clear') {
                    if (confirm('Clear the entire whiteboard?')) {
                        const rect = container.getBoundingClientRect();
                        ctx.fillStyle = state.bgColor;
                        ctx.fillRect(0, 0, rect.width, rect.height);
                        saveState();
                    }
                }
            });
        });

        // Close slideouts when clicking canvas
        canvas.addEventListener('click', closeAllSlideouts);

        // Initialize previews
        updateColorPreview();
        updateSizePreview();

        // Initial setup
        resizeCanvas();
        saveState();

        // Observe resize
        const resizeObserver = new ResizeObserver(() => {
            resizeCanvas();
        });
        resizeObserver.observe(container);

        // Store reference for cleanup
        windowEl.whiteboardCleanup = () => {
            resizeObserver.disconnect();
        };
    }

    renderWelcomeApp() {
        return '<div class="welcome-content">' +
            '<h2>Welcome to HoverCam Desktop</h2>' +
            '<p>Your personal workspace is ready. Explore the apps in the taskbar or double-click desktop icons to get started.</p>' +
            '<div class="welcome-stats">' +
                '<div class="stat-card"><h3>' + this.apps.length + '</h3><p>Apps Available</p></div>' +
                '<div class="stat-card"><h3>v2.0</h3><p>System Version</p></div>' +
                '<div class="stat-card"><h3>100%</h3><p>System Health</p></div>' +
            '</div>' +
        '</div>';
    }

    renderFilesApp() {
        const folders = ["Documents", "Pictures", "Videos", "Music", "Downloads"];
        return '<div class="files-app">' +
            '<div class="files-toolbar">' +
                '<button class="files-btn">Home</button>' +
                '<button class="files-btn">Documents</button>' +
                '<button class="files-btn">Downloads</button>' +
            '</div>' +
            '<div class="files-grid">' + folders.map(folder => 
                '<div class="folder-item"><svg viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg><span>' + folder + '</span></div>'
            ).join("") + '</div>' +
        '</div>';
    }

    renderTerminalApp() {
        return '<div class="terminal-app">' +
            '<div class="terminal-line"><span class="term-user">hovercam@desktop</span>:<span class="term-path">~</span>$ <span class="term-cmd">welcome</span></div>' +
            '<pre class="terminal-ascii">' +
'██╗  ██╗ ██████╗ ██╗   ██╗███████╗██████╗  ██████╗ █████╗ ███╗   ███╗\n' +
'██║  ██║██╔═══██╗██║   ██║██╔════╝██╔══██╗██╔════╝██╔══██╗████╗ ████║\n' +
'███████║██║   ██║██║   ██║█████╗  ██████╔╝██║     ███████║██╔████╔██║\n' +
'██╔══██║██║   ██║╚██╗ ██╔╝██╔══╝  ██╔══██╗██║     ██╔══██║██║╚██╔╝██║\n' +
'██║  ██║╚██████╔╝ ╚████╔╝ ███████╗██║  ██║╚██████╗██║  ██║██║ ╚═╝ ██║\n' +
'╚═╝  ╚═╝ ╚═════╝   ╚═══╝  ╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝     ╚═╝</pre>' +
            '<div class="terminal-info">Welcome to HoverCam Desktop Terminal v2.0</div>' +
            '<div class="terminal-hint">Type "help" for available commands.</div>' +
            '<div class="terminal-line"><span class="term-user">hovercam@desktop</span>:<span class="term-path">~</span>$ <span class="term-cursor">▋</span></div>' +
        '</div>';
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
                        '<span>Account</span>' +
                    '</div>' +
                    chevronIcon +
                '</div>' +
                '<div class="category-content expanded">' +
                    '<div class="settings-card">' +
                        '<div class="user-profile">' +
                            '<div class="user-avatar">' + initial + '</div>' +
                            '<div class="user-info">' +
                                '<div class="user-name">' + username + '</div>' +
                                '<div class="user-role">Administrator</div>' +
                            '</div>' +
                        '</div>' +
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
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    window.desktopOS = new DesktopOS();
});
