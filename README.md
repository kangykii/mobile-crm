# Mini CRM

**A lightweight sales CRM that runs in your browser and stores leads in a spreadsheet you already control.**

No proprietary database. No monthly CRM subscription required for storage. You connect **Google Sheets** or **Microsoft OneDrive Excel**, sign in with your own account, and manage leads from your phone or laptop like a native app.

Repository: [github.com/kangykii/mobile-crm](https://github.com/kangykii/mobile-crm)

---

## What problem does this solve?

Most small teams already track deals in a spreadsheet. Mini CRM adds a **mobile-friendly app** on top of that sheet:

- Add and update leads with a clean UI
- See pipeline stage, follow-ups, and recent activity
- Work **offline** — changes queue and sync when you're back online
- **Share one Google Sheet** with teammates; each person only sees the leads they created

Your data stays in **your** Google Sheet or OneDrive file. The app is a smart client, not a data silo.

---

## Who is this for?

| You might use Mini CRM if… | You might not need it if… |
|-----------------------------|---------------------------|
| You live in Google Sheets today and want a better mobile UI | You need enterprise CRM (Salesforce, HubSpot, etc.) |
| You're a solo rep or small team (2–10 people) | You need complex automation, email sequences, or reporting |
| You want offline-capable lead capture in the field | You don't want to set up Google Cloud OAuth |
| You're comfortable pasting a Spreadsheet ID and Client ID once | You need a fully hosted SaaS with zero setup |

---

## How it works (30-second version)

```text
You (browser)  →  Mini CRM PWA  →  Google Sheets / OneDrive
                      │
                      ├─ Sign in with Google or Microsoft (OAuth)
                      ├─ Edit leads locally (fast UI)
                      └─ Sync rows to/from your spreadsheet
```

1. **Connect** — paste OAuth Client ID, sign in, paste Spreadsheet ID (Google) or let OneDrive create `SoloCRM.xlsx` (Microsoft).
2. **Use the app** — Home dashboard, Leads list, Timeline, contact drawer per lead.
3. **Sync** — changes push to the sheet when online; app pulls fresh data on load and reconnect.

**Multi-user (Google Sheets):** everyone uses the **same Spreadsheet ID**, signs in with **their own Google account**, and only sees rows where `OwnerEmail` matches their email.

---

## What's in the app

| Screen | What you do there |
|--------|-------------------|
| **Home** | Pipeline total, stats, shortcuts |
| **Leads** | Search, filter by stage, double-tap a card to open details |
| **Timeline** | Follow-ups and recent touchpoints |
| **Add lead** | Create a contact with stage and value |
| **Settings** | OAuth credentials, spreadsheet ID, sync retry, profile |

Lead cards are **color-tinted by stage** (New, Contacted, Qualified, etc.). Open a lead to **move to the next stage**, call/email, add notes, and view timeline history.

Works as a **PWA** (installable on phone) and adapts to **laptop screens** with a sidebar nav.

---

## Quick start (local dev)

All app code lives in [`mini-crm/`](mini-crm/).

```bash
cd mini-crm
npx --yes serve -l 4173
```

Open **http://127.0.0.1:4173/** — use this exact URL for OAuth (not `/index.html`).

Then in the app:

1. **Connect** → follow the on-screen **Quick setup** (copy redirect URI, create OAuth client, add test user).
2. Sign in with Google.
3. Create a sheet, rename tab to **`Leads`**, paste header row from the app.
4. **Settings** → paste Spreadsheet URL or ID → **Save** → **Retry sync**.

After deploys or updates, hard-refresh once (service worker cache in `mini-crm/service-worker.js`).

---

## Google Sheets setup

### Google Cloud (one-time)

1. [Google Cloud Console](https://console.cloud.google.com/) → create a project.
2. Enable **Google Sheets API** (APIs & Services → Library).
3. **OAuth consent screen** → External → add your Gmail under **Test users** (required while app is in Testing).
4. **Clients** → Create OAuth client:
   - **Recommended:** type **Desktop app** → Client ID only (no secret in the app).
   - **Alternative:** type **Web application** → also paste **Client secret** in the app (`GOCSPX-…`).
5. Register redirect URI **exactly**:

   ```text
   http://127.0.0.1:4173/
   ```

### Your spreadsheet

| Rule | Detail |
|------|--------|
| Tab name | **`Leads`** (rename `Sheet1` — this breaks sync if wrong) |
| Header row | Row 1, columns A–K — use **Copy header row** in the app |

```text
ID	Name	Company	Email	Phone	Value	Stage	LastContactedAt	CreatedAt	NotesTimeline	OwnerEmail
```

Paste your sheet URL or ID in **Settings**. Share the file with teammates as **Editors** for team use.

---

## Microsoft OneDrive (optional)

1. Azure app registration → **Single-page application (SPA)** platform (not Web).
2. Redirect URI: `http://127.0.0.1:4173/`
3. Paste **Application (client) ID** only — no client secret.
4. First sync creates **`SoloCRM.xlsx`** in your OneDrive.

Each Microsoft user gets their own file. For a shared team sheet, use Google Sheets.

---

## Sync & offline behavior

| Situation | Behavior |
|-----------|----------|
| Edit while online | UI updates instantly → pushes to sheet |
| Edit while offline | Saved locally → **pending** until online |
| App open / sign-in | Pulls latest from sheet |
| Back online | Flushes queue, then pulls |
| Status pill orange | Pending changes or config issue — tap to retry |

**Settings → Retry sync** or tap the status pill in the header. If setup was wrong, fix the sheet tab / Spreadsheet ID first, then retry.

---

## Common issues

| Symptom | Fix |
|---------|-----|
| `redirect_uri_mismatch` | Register `http://127.0.0.1:4173/` in Google/Azure; open app at that URL |
| `access_denied` | Add your Gmail under OAuth **Test users** |
| `client_secret is missing` | Use Desktop OAuth client, **or** paste Web client secret in Settings |
| Sync stays **pending** | Tab must be **`Leads`**; enable Sheets API; save Spreadsheet ID; Retry sync |
| Empty leads list | You only see rows you own (`OwnerEmail` = your signed-in email) |
| Changes not on sheet | Check status pill; Settings → Retry sync |

---

## Tech stack

- **Vanilla JS** (ES modules) — no React/Vue build step
- **Tailwind CSS** (CDN)
- **PWA** — service worker + manifest for offline shell
- **OAuth 2.0 + PKCE** — Google Sheets API & Microsoft Graph
- **IndexedDB** — offline queue and lead cache via `idb-keyval`

```
mini-crm/
  index.html              App shell
  manifest.json           PWA manifest
  service-worker.js       Offline caching
  src/
    app.js                Routing, auth gate, layout
    auth/                 TokenManager (Google + Microsoft)
    adapters/             Google Sheets & OneDrive adapters
    store/LeadStore.js    Local state + sync hooks
    sync/                 SyncManager, OfflineQueue, LeadCache
    views/                Home, Leads, Timeline, Connect, Settings
    components/           Cards, drawer, nav, OAuth helpers
```

---

## Deploying (e.g. Vercel)

1. Deploy the `mini-crm/` folder as a static site.
2. Update OAuth redirect URIs in Google/Azure to your production URL (e.g. `https://your-app.vercel.app/`).
3. Users open the deployed URL, paste Client ID + Spreadsheet ID in Settings.

Do **not** commit client secrets to git. For production Web OAuth clients, prefer server-side token exchange or Desktop-style clients for personal use.

---

## Security notes

- OAuth tokens and settings stay in **browser localStorage** on the device.
- Each user should use their **own** Google/Microsoft sign-in.
- Shared sheets: teammates need **Editor** access on the file; row visibility is filtered by `OwnerEmail`.
- Legacy rows without `OwnerEmail` are hidden until re-created with an owner.

---

## License

Private / project use — add a license if you open-source this repo.
