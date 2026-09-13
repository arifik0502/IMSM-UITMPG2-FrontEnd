/**
 * Thin wrapper around jQuery's $.ajax for talking to the Laravel API.
 * - Attaches the bearer token from localStorage automatically.
 * - Always sends Accept: application/json so Laravel's exception handler
 *   renders JSON (401/403/404/422/500) instead of an HTML error page.
 * - Normalizes Laravel's {message, errors: {field: [msgs]}} validation
 *   shape into a single readable string for easy display.
 */

const Api = {
    base: () => window.ATTENDANCE_API_BASE,

    token() {
        return localStorage.getItem('att_token');
    },

    setToken(token) {
        localStorage.setItem('att_token', token);
    },

    clearToken() {
        localStorage.removeItem('att_token');
        localStorage.removeItem('att_user');
    },

    currentUser() {
        const raw = localStorage.getItem('att_user');
        return raw ? JSON.parse(raw) : null;
    },

    setCurrentUser(user) {
        localStorage.setItem('att_user', JSON.stringify(user));
    },

    isLoggedIn() {
        return !!this.token();
    },

    isAdmin() {
        const u = this.currentUser();
        return !!u && u.role === 'admin';
    },

    /**
     * @param {string} method GET/POST/PUT/DELETE
     * @param {string} path   e.g. '/attendance/status' (no leading /api)
     * @param {object|null} data  request body, JSON-encoded
     */
    request(method, path, data) {
        const headers = { Accept: 'application/json' };
        const token = this.token();
        if (token) {
            headers.Authorization = 'Bearer ' + token;
        }

        const options = {
            url: this.base() + path,
            method: method,
            headers: headers,
            dataType: 'json',
        };

        if (data !== undefined && data !== null) {
            options.contentType = 'application/json';
            options.data = JSON.stringify(data);
        }

        return $.ajax(options).catch((jqXHR) => {
            throw Api.formatError(jqXHR);
        });
    },

    get(path) {
        return this.request('GET', path);
    },
    post(path, data) {
        return this.request('POST', path, data === undefined ? {} : data);
    },
    put(path, data) {
        return this.request('PUT', path, data === undefined ? {} : data);
    },
    del(path, data) {
        return this.request('DELETE', path, data);
    },

    /**
     * Turns a failed jqXHR into a plain string message, preferring Laravel's
     * validation error details when present.
     */
    formatError(jqXHR) {
        const body = jqXHR.responseJSON;

        if (jqXHR.status === 0) {
            return 'Could not reach the API. Is ATTENDANCE_API_BASE in assets/js/config.js correct, and is the backend running?';
        }

        if (!body) {
            return `Request failed (HTTP ${jqXHR.status}).`;
        }

        if (body.errors) {
            return Object.values(body.errors).flat().join(' ');
        }

        return body.message || `Request failed (HTTP ${jqXHR.status}).`;
    },
};

/**
 * Small helper for showing a dismissible Bootstrap alert inside a
 * container, used the same way on every page.
 */
function showAlert(containerSelector, message, type) {
    type = type || 'danger';
    const el = $(containerSelector);
    el.html(
        `<div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${$('<div>').text(message).html()}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>`
    );
}

function clearAlert(containerSelector) {
    $(containerSelector).empty();
}
