/**
 * "Add to Home Screen" popup.
 *
 * Include this one script tag on every page (after api.js):
 *   <script src="/assets/js/pwa-install.js"></script>
 *
 * It handles everything else itself:
 * - injects the <link rel="manifest">, theme-color and apple-touch-icon
 *   tags into <head> so no other HTML file needs to change
 * - registers the service worker
 * - on Chrome/Edge/Android, listens for the native `beforeinstallprompt`
 *   event and shows a bottom banner with an "Install" button
 * - on iOS Safari, which has no such event, shows a banner with manual
 *   "tap Share, then Add to Home Screen" instructions instead
 * - remembers a dismissal for 7 days (localStorage), and never shows again
 *   once the app is actually installed
 */
(function () {
    const DISMISS_KEY = 'att_pwa_install_dismissed_until';
    const INSTALLED_KEY = 'att_pwa_installed';
    const DISMISS_DAYS = 7;

    function isStandalone() {
        return (
            window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true
        );
    }

    function isDismissed() {
        const until = parseInt(localStorage.getItem(DISMISS_KEY) || '0', 10);
        return Date.now() < until;
    }

    function dismissFor(days) {
        const until = Date.now() + days * 24 * 60 * 60 * 1000;
        localStorage.setItem(DISMISS_KEY, String(until));
    }

    function injectHeadTags() {
        const head = document.head;

        if (!document.querySelector('link[rel="manifest"]')) {
            const manifestLink = document.createElement('link');
            manifestLink.rel = 'manifest';
            manifestLink.href = '/manifest.json';
            head.appendChild(manifestLink);
        }

        if (!document.querySelector('meta[name="theme-color"]')) {
            const theme = document.createElement('meta');
            theme.name = 'theme-color';
            theme.content = '#0d6efd';
            head.appendChild(theme);
        }

        if (!document.querySelector('link[rel="apple-touch-icon"]')) {
            const appleIcon = document.createElement('link');
            appleIcon.rel = 'apple-touch-icon';
            appleIcon.href = '/assets/icons/icon-192.png';
            head.appendChild(appleIcon);
        }
    }

    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {
                // Non-fatal — the site still works without offline support.
            });
        }
    }

    function isIos() {
        return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    }

    function isSafari() {
        const ua = window.navigator.userAgent;
        return /safari/i.test(ua) && !/crios|fxios|edgios|chrome/i.test(ua);
    }

    function buildBanner(bodyHtml, buttonsHtml) {
        const wrap = document.createElement('div');
        wrap.id = 'pwa-install-banner';
        wrap.style.cssText =
            'position:fixed;left:0;right:0;bottom:0;z-index:1080;' +
            'background:#212529;color:#fff;padding:0.75rem 1rem;' +
            'box-shadow:0 -2px 10px rgba(0,0,0,0.2);';
        wrap.innerHTML =
            '<div class="d-flex align-items-center flex-wrap gap-2" style="max-width:960px;margin:0 auto;">' +
            '<img src="/assets/icons/icon-192.png" width="36" height="36" style="border-radius:8px;flex-shrink:0;">' +
            '<div class="flex-grow-1" style="min-width:200px;">' + bodyHtml + '</div>' +
            '<div class="d-flex align-items-center gap-2">' + buttonsHtml + '</div>' +
            '</div>';
        document.body.appendChild(wrap);
        return wrap;
    }

    function showChromeBanner(deferredPrompt) {
        const banner = buildBanner(
            '<strong>Install Attendance System</strong>' +
                '<div class="small text-white-50">Add it to your home screen for quick, full-screen access.</div>',
            '<button type="button" class="btn btn-primary btn-sm" id="pwa-install-btn">Install</button>' +
                '<button type="button" class="btn btn-outline-light btn-sm" id="pwa-dismiss-btn">Not now</button>'
        );

        document.getElementById('pwa-install-btn').addEventListener('click', async () => {
            banner.remove();
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                localStorage.setItem(INSTALLED_KEY, '1');
            } else {
                dismissFor(DISMISS_DAYS);
            }
        });

        document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
            dismissFor(DISMISS_DAYS);
            banner.remove();
        });
    }

    function showIosBanner() {
        const banner = buildBanner(
            '<strong>Install Attendance System</strong>' +
                '<div class="small text-white-50">Tap the Share icon, then "Add to Home Screen".</div>',
            '<button type="button" class="btn btn-outline-light btn-sm" id="pwa-dismiss-btn">Got it</button>'
        );

        document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
            dismissFor(DISMISS_DAYS);
            banner.remove();
        });
    }

    function init() {
        injectHeadTags();
        registerServiceWorker();

        if (isStandalone() || localStorage.getItem(INSTALLED_KEY) === '1' || isDismissed()) {
            return;
        }

        if (isIos() && isSafari()) {
            // No native prompt exists on iOS Safari — show instructions instead.
            setTimeout(showIosBanner, 1500);
            return;
        }

        window.addEventListener('beforeinstallprompt', (event) => {
            event.preventDefault();
            setTimeout(() => showChromeBanner(event), 1500);
        });

        window.addEventListener('appinstalled', () => {
            localStorage.setItem(INSTALLED_KEY, '1');
            const existing = document.getElementById('pwa-install-banner');
            if (existing) existing.remove();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
