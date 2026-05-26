import { getAppRedirectUri } from "../auth/redirectUri.js";

const LINKS = {
  google: {
    createClient: "https://console.cloud.google.com/auth/clients/create",
    testUsers: "https://console.cloud.google.com/auth/audience",
    credentials: "https://console.cloud.google.com/apis/credentials",
    newSheet: "https://sheets.new",
  },
  microsoft: {
    registrations: "https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade",
    createApp: "https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/CreateApplicationBlade/quickStartType/SinglePageApplication",
  },
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function linkButton(href, label, accent) {
  return `
    <a
      href="${href}"
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[rgba(60,60,67,0.12)] bg-white px-3 py-2.5 text-xs font-bold ${accent} transition hover:border-current"
    >
      ${label}
      <svg class="h-3.5 w-3.5 shrink-0 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 20 4"/></svg>
    </a>
  `;
}

export function OAuthQuickSetup({ provider = "google" } = {}) {
  const redirectUri = getAppRedirectUri();
  const isGoogle = provider === "google";
  const accent = isGoogle ? "text-[#0176D3]" : "text-[#0A66C2]";
  const border = isGoogle ? "border-[#0176D3]/20 bg-[#EAF5FE]/50" : "border-[#0A66C2]/20 bg-[#EEF3FC]/50";
  const links = LINKS[provider] || LINKS.google;

  const steps = isGoogle
    ? `
      <li class="flex gap-2 text-xs leading-5 text-[#706E6B]">
        <span class="shrink-0 font-bold ${accent}">1</span>
        <span>Copy <strong class="text-[#181818]">redirect URI</strong> below → open <strong class="text-[#181818]">Create OAuth client</strong> → type <strong class="text-[#181818]">Desktop app</strong> → paste URI if asked → copy <strong class="text-[#181818]">Client ID only</strong>.</span>
      </li>
      <li class="flex gap-2 text-xs leading-5 text-[#706E6B]">
        <span class="shrink-0 font-bold ${accent}">2</span>
        <span>Add your Gmail under <strong class="text-[#181818]">Test users</strong> while the app is in Testing.</span>
      </li>
      <li class="flex gap-2 text-xs leading-5 text-[#706E6B]">
        <span class="shrink-0 font-bold ${accent}">3</span>
        <span>Paste Client ID here → <strong class="text-[#181818]">Connect</strong>.</span>
      </li>
    `
    : `
      <li class="flex gap-2 text-xs leading-5 text-[#706E6B]">
        <span class="shrink-0 font-bold ${accent}">1</span>
        <span>Copy <strong class="text-[#181818]">redirect URI</strong> → Azure app → <strong class="text-[#181818]">SPA</strong> platform (not Web) → paste URI.</span>
      </li>
      <li class="flex gap-2 text-xs leading-5 text-[#706E6B]">
        <span class="shrink-0 font-bold ${accent}">2</span>
        <span>Copy <strong class="text-[#181818]">Application (client) ID</strong> — never a client secret.</span>
      </li>
      <li class="flex gap-2 text-xs leading-5 text-[#706E6B]">
        <span class="shrink-0 font-bold ${accent}">3</span>
        <span>Paste here → <strong class="text-[#181818]">Connect</strong>.</span>
      </li>
    `;

  const actionLinks = isGoogle
    ? `
      <div class="mt-3 grid gap-2 sm:grid-cols-2">
        ${linkButton(links.createClient, "Create OAuth client (Desktop)", accent)}
        ${linkButton(links.testUsers, "Add test users", accent)}
      </div>
      <div class="mt-2">
        ${linkButton(links.credentials, "All credentials", accent)}
      </div>
    `
    : `
      <div class="mt-3 grid gap-2">
        ${linkButton(links.createApp, "Register SPA app", accent)}
        ${linkButton(links.registrations, "My app registrations", accent)}
      </div>
    `;

  return `
    <div class="oauth-quick-setup rounded-xl border ${border} p-3" data-oauth-setup="${provider}">
      <p class="text-xs font-bold text-[#181818]">Quick setup (3 steps)</p>
      <ol class="mt-2 space-y-2">${steps}</ol>

      <label class="mt-3 block text-[10px] font-bold uppercase tracking-wide text-[#969492]">Your redirect URI — register this in Google/Azure</label>
      <div class="mt-1 flex gap-2">
        <input
          type="text"
          readonly
          value="${escapeHtml(redirectUri)}"
          data-oauth-redirect-uri
          class="min-w-0 flex-1 rounded-lg border border-[rgba(60,60,67,0.12)] bg-white px-3 py-2 font-mono text-[10px] text-[#181818] outline-none"
          aria-label="OAuth redirect URI"
        />
        <button
          type="button"
          data-copy-oauth-redirect
          class="shrink-0 rounded-lg border border-[rgba(60,60,67,0.12)] bg-white px-3 py-2 text-xs font-bold ${accent} transition hover:bg-white/80"
        >
          Copy
        </button>
      </div>

      ${actionLinks}

      <p class="mt-2 text-[10px] leading-4 text-[#969492]">
        ${
          isGoogle
            ? "Use a Desktop app client — Web clients need a secret this browser app cannot use."
            : "Use Single-page application (SPA) — Web platform requires a client secret."
        }
      </p>
    </div>
  `;
}

export function SpreadsheetQuickSetup() {
  return `
    <div class="mt-3 rounded-xl border border-[#0176D3]/15 bg-white/60 p-3" data-spreadsheet-quick-setup>
      <p class="text-xs font-bold text-[#181818]">Google Sheet</p>
      <p class="mt-1 text-xs leading-5 text-[#706E6B]">Create a sheet, paste the header row from the instructions below, then paste your spreadsheet link or ID.</p>
      <div class="mt-2 grid gap-2 sm:grid-cols-2">
        ${linkButton(LINKS.google.newSheet, "Create new Google Sheet", "text-[#0176D3]")}
      </div>
    </div>
  `;
}

export function bindOAuthSetupPanel(root, { notifier } = {}) {
  root.querySelectorAll("[data-copy-oauth-redirect]").forEach((button) => {
    button.addEventListener("click", async () => {
      const input = button.parentElement?.querySelector("[data-oauth-redirect-uri]");
      const text = input?.value || getAppRedirectUri();

      try {
        await navigator.clipboard.writeText(text);
        notifier?.show("Redirect URI copied. Paste it when creating your OAuth client.", "success");
      } catch {
        input?.select();
        notifier?.show("Select the URI and copy manually (Ctrl+C).", "info");
      }
    });
  });
}
