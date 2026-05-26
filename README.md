# Mini CRM

A **web-native** progressive web app (PWA) for managing sales leads. Data syncs to **Google Sheets** or **Microsoft OneDrive Excel** — no desktop wrapper required. Optimized for phone and laptop screens.

The app lives in [`mini-crm/`](mini-crm/).

---

## Quick start

1. Serve the app over HTTP (required for ES modules and OAuth):

   ```bash
   cd mini-crm
   npx --yes serve -l 4173
   ```

2. Open **http://127.0.0.1:4173/** (use this exact URL for OAuth — not `index.html`).

3. Follow [Google setup](#google-sheets-setup) below, then connect in the app.

4. After code changes, hard-refresh or unregister the old service worker (cache version in `mini-crm/service-worker.js`).

---

## Features

| Area | Behavior |
|------|----------|
| **Backends** | Google Sheets (shared team sheet) or OneDrive `SoloCRM.xlsx` (per user) |
| **Multi-user** | Shared spreadsheet; each user signs in with their own Google account; sees only leads they own (`OwnerEmail` column) |
| **Offline** | Local-first edits; queue pushes when back online |
| **Sync** | Push on each change when online; pull on load and reconnect |
| **UI** | Mobile bottom nav; laptop sidebar; responsive layouts |

---

## Google Sheets setup

### 1. Google Cloud

1. [Google Cloud Console](https://console.cloud.google.com/) → create/select a project.
2. **APIs & Services → Library** → enable **Google Sheets API**.
3. **OAuth consent screen** → External → add your Gmail under **Test users** (while app is in Testing).
4. **Clients** → create OAuth client:
   - **Recommended:** Application type **Desktop app** → use **Client ID only** (no secret).
   - **Alternative:** **Web application** → requires **Client secret** in the app (see below).
5. Register redirect URI **exactly**:

   ```text
   http://127.0.0.1:4173/
   ```

   The app always uses `origin + /` (root path). Do not register `/index.html`.

### 2. OAuth in Mini CRM

On **Connect** or **Settings**:

- Use **Quick setup** → copy redirect URI → open **Create OAuth client**.
- Paste **Client ID**.
- If using a **Web** client: expand **“Web OAuth client? Add client secret”** and paste `GOCSPX-…` from Google Cloud.
- **Connect Google Sheets**.

### 3. Spreadsheet structure

| Requirement | Detail |
|-------------|--------|
| **Tab name** | Bottom tab must be **`Leads`** — not `Sheet1`. The file title can be anything. |
| **Header row** | Row 1, columns A–K (use **Copy header row** in the app) |

Header columns:

```text
ID	Name	Company	Email	Phone	Value	Stage	LastContactedAt	CreatedAt	NotesTimeline	OwnerEmail
```

4. **Settings** → paste full Google Sheets URL or Spreadsheet ID → **Save**.
5. Share the sheet with teammates as **Editors** (same Spreadsheet ID for everyone).

---

## Microsoft OneDrive (optional)

1. Azure **App registration** → Authentication → platform **Single-page application (SPA)** — not Web.
2. Add the same redirect URI: `http://127.0.0.1:4173/`
3. Paste **Application (client) ID** only — no client secret.
4. First sync creates `SoloCRM.xlsx` with a `Leads` table.

---

## How sync works

| Event | What happens |
|-------|----------------|
| You edit a lead (online) | UI updates immediately → push to sheet |
| You edit (offline) | Saved locally → **pending** until online |
| App load / sign-in | Flush queue → pull from sheet |
| Browser back online | Flush queue → pull |
| **Tap status pill** or **Settings → Retry sync** | Manual flush + pull |

Status bar:

- **Green** — synced, no pending items  
- **Orange + “N pending”** — queued or misconfigured; hover/tap for hint  
- **Syncing…** — push/pull in progress  

---

## Troubleshooting

### OAuth errors

| Error | Fix |
|-------|-----|
| `redirect_uri_mismatch` | Register `http://127.0.0.1:4173/` in Google/Azure; open app at that URL (not `/index.html`). |
| `access_denied` / not verified | Add your Gmail under **Auth Platform → Audience → Test users**. |
| `client_secret is missing` | Use **Desktop** OAuth client **or** paste Web client secret in the app. |
| Stuck **pending** | See [Sync pending](#sync-stays-pending) below. |

### Sync stays pending

Usually the sheet push failed and items stayed in the queue:

1. Rename tab **`Sheet1` → `Leads`**.
2. Enable **Google Sheets API** in Cloud Console.
3. Save **Spreadsheet ID** in Settings (full URL is OK).
4. **Settings → Retry sync** or tap the status pill.
5. If setup was wrong and the queue is stuck: **Clear pending queue** (local leads remain; re-sync after fixing config).

Non-retryable errors (missing spreadsheet, wrong tab, API disabled) are no longer queued forever — you get a clear toast instead.

---

## Changelog — fixes & improvements

This section documents work merged into the current codebase.

### Multi-user & data model

- Added **`OwnerEmail`** column (K) in `columnMap.js`; Google/Microsoft adapters use range `A:K`.
- New leads stamp `OwnerEmail` from signed-in user email.
- `filterLeadsForUser()` hides other users’ rows and legacy rows with empty `OwnerEmail`.
- Filtered leads cached per device for correct offline view.

### Profile & UX

- Profile: name, email (OAuth), editable **company**; **initials-only** avatar (no photos).
- **SyncInstructions** with copy-paste header row and setup steps on Connect/Settings.
- **OAuth quick setup**: redirect URI copy, links to Google/Azure consoles, 3-step checklist.
- **OAuth diagnostics** connection checklist on Connect/Settings.
- Optional **Google client secret** field for Web OAuth clients.
- **Spreadsheet URL parsing** — paste full `docs.google.com/...` URL; ID extracted automatically.

### OAuth & auth fixes

- PKCE browser flow without secret for **Desktop** clients.
- Optional `client_secret` on token exchange/refresh for **Web** clients.
- Normalized redirect URI to **`{origin}/`** to avoid `/index.html` mismatch.
- Actionable error messages for `redirect_uri_mismatch`, `client_secret`, and Google API errors.
- Credentials saved from forms before **Connect** (Settings provider button).

### Sync fixes

- `parseGoogleSheetsError()` — readable errors (API disabled, missing `Leads` tab, etc.).
- Do not queue non-retryable config errors (stops infinite **pending**).
- Drop bad queue entries on flush when error is not retryable.
- **Retry sync** (status pill + Settings) and **Clear pending queue**.
- `connect()` preflight: spreadsheet ID and token checks before API calls.

### Layout (web-native, laptop)

- No Tauri/desktop shell — PWA only.
- Responsive shell: `max-w-7xl` on large screens; sidebar nav on `lg+`; bottom nav on mobile.
- Home/Leads/Timeline multi-column layouts on wide screens.

### Service worker

- Cache name bumped through **v32** (bump in `service-worker.js` after deploys; hard-refresh when testing).

---

## Project structure

```text
mini-crm/
  index.html          # Shell, Tailwind CDN, global styles
  manifest.json       # PWA manifest
  service-worker.js   # Offline shell cache
  src/
    app.js            # Bootstrap, routing, auth gate
    auth/             # TokenManager (Google + Microsoft PKCE)
    adapters/         # Google Sheets, Microsoft Graph
    store/LeadStore.js
    sync/             # SyncManager, OfflineQueue, LeadCache
    views/            # Home, Leads, Timeline, Connect, Settings
    components/       # UI pieces (nav, drawer, OAuth helpers)
```

---

## Development notes

- Run only over **http://** or **https://** — not `file://`.
- Google OAuth while Testing: every user must be a **Test user** or publish the app.
- Team Google Sheets: one Spreadsheet ID, each person uses their own OAuth Client ID (or shared) and own sign-in.
- **Do not commit** client secrets or `.env` files to git.

---

## License

Private / project use — add a license if you open-source this repo.
