import { getAppRedirectUri } from "../auth/redirectUri.js";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row(label, ok, detail) {
  const icon = ok ? "✓" : "○";
  const tone = ok ? "text-[#027A48]" : "text-[#8C4B02]";
  return `
    <li class="flex gap-2 text-xs leading-5">
      <span class="shrink-0 font-bold ${tone}">${icon}</span>
      <span class="text-[#706E6B]"><strong class="text-[#181818]">${label}</strong> — ${detail}</span>
    </li>
  `;
}

export function OAuthDiagnostics({ settings, tokenManager } = {}) {
  const redirectUri = getAppRedirectUri();
  const clientId = settings?.getGoogleClientId?.()?.trim() || "";
  const secret = settings?.getGoogleClientSecret?.()?.trim() || "";
  const spreadsheetId = settings?.getSpreadsheetId?.()?.trim() || "";
  const signedIn = tokenManager?.isSignedIn?.() || false;
  const provider = tokenManager?.getProvider?.() || null;
  const pathname = globalThis.location?.pathname || "/";
  const indexHtmlWarning =
    pathname.includes("index.html") && redirectUri.endsWith("/")
      ? `<p class="mt-2 rounded-lg bg-[#FFF8E6] px-3 py-2 text-[10px] leading-4 text-[#8C4B02]">You opened <code class="font-mono">${escapeHtml(pathname)}</code> but OAuth uses <code class="font-mono">${escapeHtml(redirectUri)}</code>. Register the root URI in Google (not /index.html).</p>`
      : "";

  return `
    <div class="mt-4 rounded-xl border border-[rgba(60,60,67,0.12)] bg-white p-3" data-oauth-diagnostics>
      <p class="text-xs font-bold text-[#181818]">Connection checklist</p>
      <ul class="mt-2 space-y-1.5">
        ${row("Redirect URI", true, `<code class="font-mono text-[10px]">${escapeHtml(redirectUri)}</code> — register in Google → Clients`)}
        ${row("Client ID", Boolean(clientId), clientId ? "Saved" : "Paste and save")}
        ${row("Client secret", Boolean(secret), secret ? "Saved (Web client)" : "Required for Web clients; leave empty for Desktop app")}
        ${row("Signed in", signedIn, signedIn ? `Yes (${provider || "unknown"})` : "Not yet")}
        ${
          signedIn && provider === "google"
            ? row("Spreadsheet ID", Boolean(spreadsheetId), spreadsheetId ? "Saved" : "Add after sign-in in Settings")
            : ""
        }
      </ul>
      ${indexHtmlWarning}
      <p class="mt-2 text-[10px] leading-4 text-[#969492]">
        Enable <strong>Google Sheets API</strong> in Google Cloud → APIs &amp; Services → Library. Add your Gmail under Auth Platform → Audience → Test users.
      </p>
    </div>
  `;
}
