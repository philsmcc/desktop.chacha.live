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
        
        if (appId === "browser") {
            setTimeout(() => this.initBrowser(windowEl), 50);
        }
        
        if (appId === "files") {
            setTimeout(() => this.initFiles(windowEl), 50);
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
            // Persist to localStorage
            persistCanvas();
        };
        
        // Persist canvas to localStorage
        const persistCanvas = () => {
            try {
                const canvasData = canvas.toDataURL('image/png');
                localStorage.setItem('hovercam_whiteboard_canvas', canvasData);
                localStorage.setItem('hovercam_whiteboard_bgColor', state.bgColor);
            } catch(e) {
                console.warn('Could not persist whiteboard:', e);
            }
        };
        
        // Load persisted canvas
        const loadPersistedCanvas = () => {
            try {
                const savedCanvas = localStorage.getItem('hovercam_whiteboard_canvas');
                const savedBgColor = localStorage.getItem('hovercam_whiteboard_bgColor');
                
                if (savedBgColor) {
                    state.bgColor = savedBgColor;
                }
                
                if (savedCanvas) {
                    const img = new Image();
                    img.onload = () => {
                        const dpr = window.devicePixelRatio || 1;
                        ctx.setTransform(1, 0, 0, 1, 0, 0);
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0);
                        ctx.scale(dpr, dpr);
                        // Save to history after loading
                        state.history = [savedCanvas];
                        state.historyIndex = 0;
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
                        // Clear persisted canvas
                        localStorage.removeItem('hovercam_whiteboard_canvas');
                        // Reset history
                        state.history = [];
                        state.historyIndex = -1;
                        saveState();
                    }
                }
            });
        });

        // Close slideouts when clicking canvas
        canvas.addEventListener('click', closeAllSlideouts);
        
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
            
            // Check for files from computer
            if (e.dataTransfer.files.length > 0) {
                const file = e.dataTransfer.files[0];
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        this.drawImageOnWhiteboard(canvas, ctx, event.target.result, e, state, saveState);
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
                    this.drawImageOnWhiteboard(canvas, ctx, imageData.data, e, state, saveState);
                } catch(err) {
                    console.error('Failed to parse image data:', err);
                }
                return;
            }
            
            // Check for image URL
            const imageUrl = e.dataTransfer.getData('text/plain');
            if (imageUrl && (imageUrl.startsWith('data:image') || imageUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i))) {
                this.drawImageOnWhiteboard(canvas, ctx, imageUrl, e, state, saveState);
            }
        });

        // Initialize previews
        updateColorPreview();
        updateSizePreview();

        // Initial setup
        resizeCanvas();
        
        // Try to load persisted canvas, otherwise save initial state
        if (!loadPersistedCanvas()) {
            saveState();
        }

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

    initFiles(windowEl) {
        const filesGrid = windowEl.querySelector('.files-grid');
        const filesEmpty = windowEl.querySelector('.files-empty');
        const filesDropzone = windowEl.querySelector('.files-dropzone');
        const filesContainer = windowEl.querySelector('.files-container');
        const pathDisplay = windowEl.querySelector('.files-path');
        const statusText = windowEl.querySelector('.files-status');
        const uploadInput = windowEl.querySelector('.files-upload-input');
        
        let currentPath = '/';
        let files = [];
        let folders = [];
        
        // Default folders
        const defaultFolders = ['Documents', 'Pictures', 'Videos'];
        
        // Load files from localStorage (will integrate with S3 later)
        const loadFiles = () => {
            const savedData = localStorage.getItem('hovercam_files_' + this.currentUser?.username);
            if (savedData) {
                const data = JSON.parse(savedData);
                files = data.files || [];
                folders = data.folders || defaultFolders.map(f => ({ name: f, path: '/' + f }));
            } else {
                folders = defaultFolders.map(f => ({ name: f, path: '/' + f }));
                files = [];
            }
            renderFiles();
        };
        
        // Save files to localStorage
        const saveFiles = () => {
            const data = { files, folders };
            localStorage.setItem('hovercam_files_' + this.currentUser?.username, JSON.stringify(data));
        };
        
        // Render files and folders
        const renderFiles = () => {
            const currentFolders = folders.filter(f => {
                const parentPath = f.path.substring(0, f.path.lastIndexOf('/')) || '/';
                return parentPath === currentPath;
            });
            
            const currentFiles = files.filter(f => f.folder === currentPath);
            
            if (currentFolders.length === 0 && currentFiles.length === 0) {
                filesGrid.innerHTML = '';
                filesEmpty.classList.remove('hidden');
            } else {
                filesEmpty.classList.add('hidden');
                
                let html = '';
                
                // Render folders
                currentFolders.forEach(folder => {
                    html += '<div class="file-item folder-item" data-type="folder" data-path="' + folder.path + '">' +
                        '<div class="file-icon folder-icon">' +
                            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>' +
                        '</div>' +
                        '<span class="file-name">' + folder.name + '</span>' +
                    '</div>';
                });
                
                // Render files
                currentFiles.forEach((file, index) => {
                    const isImage = file.type && file.type.startsWith('image/');
                    html += '<div class="file-item" data-type="file" data-index="' + index + '" draggable="' + isImage + '">' +
                        '<div class="file-icon' + (isImage ? ' image-icon' : '') + '">' +
                            (isImage && file.thumbnail ? 
                                '<img src="' + file.thumbnail + '" alt="' + file.name + '">' :
                                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'
                            ) +
                        '</div>' +
                        '<span class="file-name">' + file.name + '</span>' +
                    '</div>';
                });
                
                filesGrid.innerHTML = html;
                
                // Add click handlers for folders
                filesGrid.querySelectorAll('.folder-item').forEach(item => {
                    item.addEventListener('dblclick', () => {
                        currentPath = item.dataset.path;
                        updatePath();
                        renderFiles();
                    });
                });
                
                // Add drag handlers for image files
                filesGrid.querySelectorAll('.file-item[draggable="true"]').forEach(item => {
                    item.addEventListener('dragstart', (e) => {
                        const index = parseInt(item.dataset.index);
                        const file = currentFiles[index];
                        if (file && file.data) {
                            e.dataTransfer.setData('text/plain', file.data);
                            e.dataTransfer.setData('application/hovercam-image', JSON.stringify({
                                name: file.name,
                                data: file.data
                            }));
                            item.classList.add('dragging');
                        }
                    });
                    
                    item.addEventListener('dragend', () => {
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
            let html = '<span class="path-segment" data-path="/">My Files</span>';
            let buildPath = '';
            parts.forEach(part => {
                buildPath += '/' + part;
                html += '<span class="path-sep">/</span><span class="path-segment" data-path="' + buildPath + '">' + part + '</span>';
            });
            pathDisplay.innerHTML = html;
            
            // Add click handlers
            pathDisplay.querySelectorAll('.path-segment').forEach(seg => {
                seg.addEventListener('click', () => {
                    currentPath = seg.dataset.path;
                    updatePath();
                    renderFiles();
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
            
            menu.querySelector('[data-action="delete"]').addEventListener('click', () => {
                if (item.dataset.type === 'folder') {
                    const path = item.dataset.path;
                    folders = folders.filter(f => !f.path.startsWith(path));
                    files = files.filter(f => !f.folder.startsWith(path));
                } else {
                    const index = parseInt(item.dataset.index);
                    const currentFiles = files.filter(f => f.folder === currentPath);
                    const fileToDelete = currentFiles[index];
                    files = files.filter(f => f !== fileToDelete);
                }
                saveFiles();
                renderFiles();
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
        const createFolder = () => {
            const name = prompt('Enter folder name:');
            if (name && name.trim()) {
                const folderPath = currentPath === '/' ? '/' + name.trim() : currentPath + '/' + name.trim();
                if (!folders.find(f => f.path === folderPath)) {
                    folders.push({ name: name.trim(), path: folderPath });
                    saveFiles();
                    renderFiles();
                    statusText.textContent = 'Folder created: ' + name.trim();
                } else {
                    statusText.textContent = 'Folder already exists';
                }
            }
        };
        
        // Handle file upload
        const handleFiles = (fileList) => {
            Array.from(fileList).forEach(file => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const newFile = {
                            name: file.name,
                            type: file.type,
                            size: file.size,
                            data: e.target.result,
                            thumbnail: e.target.result,
                            folder: currentPath,
                            uploaded: Date.now()
                        };
                        files.push(newFile);
                        saveFiles();
                        renderFiles();
                        statusText.textContent = 'Uploaded: ' + file.name;
                    };
                    reader.readAsDataURL(file);
                } else {
                    statusText.textContent = 'Only image files are supported';
                }
            });
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
        
        filesContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            filesDropzone.classList.remove('active');
            
            if (e.dataTransfer.files.length > 0) {
                handleFiles(e.dataTransfer.files);
            }
        });
        
        // Upload button
        windowEl.querySelector('[data-action="upload"]').addEventListener('click', () => {
            uploadInput.click();
        });
        
        uploadInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFiles(e.target.files);
                e.target.value = '';
            }
        });
        
        // New folder button
        windowEl.querySelector('[data-action="newfolder"]').addEventListener('click', createFolder);
        
        // Navigation buttons
        windowEl.querySelector('[data-action="back"]').addEventListener('click', () => {
            if (currentPath !== '/') {
                currentPath = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/';
                updatePath();
                renderFiles();
            }
        });
        
        windowEl.querySelector('[data-action="home"]').addEventListener('click', () => {
            currentPath = '/';
            updatePath();
            renderFiles();
        });
        
        // Initial load
        loadFiles();
        updatePath();
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
