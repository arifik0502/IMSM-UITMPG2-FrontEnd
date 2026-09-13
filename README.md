# Attendance System — Frontend (jQuery/AJAX)

A plain multi-page HTML/jQuery frontend that talks to the Laravel Attendance
API entirely over AJAX. No build step, no framework — open `index.html` in
a browser (via a local server, not `file://`) or deploy the folder as-is to
Vercel.

## 1. Point it at your API

Edit **`assets/js/config.js`**:

```js
window.ATTENDANCE_API_BASE = 'https://your-api.onrender.com/api';
```

That's the only file you need to touch. Everything else reads from it.

## 2. Run it locally

Because this makes `fetch`/AJAX calls, opening `index.html` directly via
`file://` will hit CORS issues in most browsers — serve it over HTTP instead:

```bash
cd attendance-frontend
python3 -m http.server 5500
# then open http://localhost:5500
```

Or use the VS Code "Live Server" extension, or any static file server.

Make sure your API's `FRONTEND_URL` env var includes whatever origin you're
serving this from (e.g. `http://localhost:5500`), so CORS allows it — see
the backend's `DEPLOYMENT.md`.

## 3. Deploy to Vercel

```bash
cd attendance-frontend
git init && git add . && git commit -m "Attendance frontend"
git branch -M main
git remote add origin https://github.com/<you>/attendance-frontend.git
git push -u origin main
```

Then in the Vercel dashboard: **Add New... → Project**, import the repo.
Vercel auto-detects this as a static site (no framework, no build command
needed) — just click **Deploy**.

Once deployed, copy the `https://your-app.vercel.app` URL and:
1. Set it as `FRONTEND_URL` in your Render backend's environment variables.
2. Nothing to change on the frontend side — it's already pointed at the API
   via `config.js`.

## Pages

| Page | Notes |
|---|---|
| `index.html` | Login |
| `register.html` | Employee registration |
| `forgot-password.html` / `reset-password.html` | Email-code password reset |
| `dashboard.html` | Clock in/out (webcam selfie), breaks, live status |
| `history.html` | Daily/weekly/monthly attendance history |
| `leave.html` | Employee's own leave requests |
| `guest-leave.html` | Public leave form, no login |
| `borrow.html` | Equipment booking — works for guests and logged-in users |
| `chat.html` | Direct messages between employees (polling, no websockets) |
| `profile.html` | Update details, change password, delete account |
| `admin/dashboard.html` | Admin stats overview |
| `admin/employees.html` / `admin/employee.html` | Browse employees + per-employee attendance |
| `admin/leave.html` | Approve/reject leave requests |
| `admin/borrow.html` | Approve/reject/return equipment bookings |

## How auth works

On login/register, the API returns a bearer token (Laravel Sanctum). It's
stored in `localStorage` (`att_token`) and sent as `Authorization: Bearer
<token>` on every subsequent request — see `assets/js/api.js`. There are no
cookies or sessions involved, which is what makes it safe to host the
frontend and backend on completely different domains.

## Camera permissions

The webcam selfie capture on the dashboard uses `navigator.mediaDevices.
getUserMedia`, which browsers only allow on `https://` origins (or
`localhost`). Once deployed to Vercel this is automatic (Vercel serves
everything over HTTPS); for local testing, `http://localhost:...` also
works, but a plain HTTP IP address won't.
