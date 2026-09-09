// Dark Mode Toggle - Applied to all pages
(function () {
    const DarkMode = {};

    // Check saved preference or system preference
    function getSavedMode() {
        return localStorage.getItem('darkMode') ||
               (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }

    // Apply mode to page
    function applyMode(mode) {
        const isDark = mode === 'dark';
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        document.body.classList.toggle('dark-mode', isDark);
        localStorage.setItem('darkMode', mode);

        // Update toggle button if exists
        const toggle = document.getElementById('dark-mode-toggle');
        if (toggle) {
            toggle.textContent = isDark ? '☀️' : '🌙';
            toggle.setAttribute('aria-label', isDark ? 'Light mode' : 'Dark mode');
            toggle.title = isDark ? 'Light mode' : 'Dark mode';
        }
    }

    // Toggle between modes
    DarkMode.toggle = function() {
        const current = localStorage.getItem('darkMode') || 'light';
        const newMode = current === 'light' ? 'dark' : 'light';
        applyMode(newMode);
    };

    // Initialize
    DarkMode.init = function() {
        const savedMode = getSavedMode();
        applyMode(savedMode);

        // Listen to system preference changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (!localStorage.getItem('darkMode')) {
                    applyMode(e.matches ? 'dark' : 'light');
                }
            });
        }
    };

    // Create toggle button
    DarkMode.createToggle = function() {
        if (document.getElementById('dark-mode-toggle')) return;

        const toggle = document.createElement('button');
        toggle.id = 'dark-mode-toggle';
        toggle.className = 'dark-mode-toggle';
        toggle.setAttribute('aria-label', 'Toggle dark mode');

        const savedMode = localStorage.getItem('darkMode') || 'light';
        toggle.textContent = savedMode === 'dark' ? '☀️' : '🌙';
        toggle.onclick = () => DarkMode.toggle();

        // Add to quick actions or footer
        const quickActions = document.querySelector('.quick');
        const footer = document.querySelector('.foot');
        const target = quickActions || footer;

        if (target) {
            if (quickActions) {
                target.appendChild(toggle);
            } else {
                target.insertBefore(toggle, target.firstChild);
            }
        }
    };

    // Auto-init on document ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            DarkMode.init();
            DarkMode.createToggle();
        });
    } else {
        DarkMode.init();
        setTimeout(() => DarkMode.createToggle(), 100);
    }

    window.DarkMode = DarkMode;
})();
