/**
 * Call Nav.render() at the top of every page's <body>, and
 * Nav.requireAuth() / Nav.requireAdmin() on pages that need it.
 * Include this AFTER api.js.
 */
const Nav = {
    render(active, base) {
        base = base || '';
        const loggedIn = Api.isLoggedIn();
        const user = Api.currentUser();
        const admin = Api.isAdmin();

        const link = (href, label, key) =>
            `<a class="nav-link ${active === key ? 'active fw-semibold' : ''}" href="${base}${href}">${label}</a>`;

        let links = '';
        if (loggedIn) {
            links += link('dashboard.html', 'Dashboard', 'dashboard');
            links += link('history.html', 'History', 'history');
            links += link('leave.html', 'Leave', 'leave');
            links += link('borrow.html', 'Borrow', 'borrow');
            links += link('chat.html', 'Chat <span id="chat-badge" class="badge bg-danger ms-1 d-none"></span>', 'chat');
            links += link('profile.html', 'Profile', 'profile');
            if (admin) {
                links += link('admin/dashboard.html', 'Admin', 'admin');
            }
        } else {
            links += link('guest-leave.html', 'Guest Leave', 'guest-leave');
            links += link('borrow.html', 'Borrow Equipment', 'borrow');
        }

        const right = loggedIn
            ? `<span class="navbar-text text-white-50 me-3">${user ? user.name : ''}</span>
               <button id="logout-btn" class="btn btn-outline-light btn-sm">Log out</button>`
            : `<a class="btn btn-outline-light btn-sm me-2" href="${base}index.html">Log in</a>
               <a class="btn btn-light btn-sm" href="${base}register.html">Register</a>`;

        $('#app-nav').html(`
            <nav class="navbar navbar-expand-lg navbar-dark bg-dark px-3">
                <a class="navbar-brand" href="${base}${loggedIn ? (admin ? 'admin/dashboard.html' : 'dashboard.html') : 'index.html'}">Attendance System</a>
                <div class="d-flex flex-wrap">${links}</div>
                <div class="ms-auto d-flex align-items-center">${right}</div>
            </nav>
        `);

        $('#logout-btn').on('click', () => {
            Api.post('/auth/logout').always(() => {
                Api.clearToken();
                window.location.href = base + 'index.html';
            });
        });

        if (loggedIn) {
            this.pollUnreadChat();
        }
    },

    /** Redirect to login if there's no token. Call at the top of protected pages. */
    requireAuth() {
        if (!Api.isLoggedIn()) {
            window.location.href = 'index.html';
        }
    },

    /** Redirect non-admins away from /admin pages. */
    requireAdmin() {
        this.requireAuth();
        if (!Api.isAdmin()) {
            window.location.href = '../dashboard.html';
        }
    },

    pollUnreadChat() {
        Api.get('/chat/unread-count')
            .done((res) => {
                const badge = $('#chat-badge');
                if (res.count > 0) {
                    badge.text(res.count).removeClass('d-none');
                } else {
                    badge.addClass('d-none');
                }
            })
            .fail(() => {});
    },
};
