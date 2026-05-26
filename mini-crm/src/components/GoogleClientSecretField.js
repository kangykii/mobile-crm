function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Optional — required only for Google "Web application" OAuth clients. */
export function GoogleClientSecretField({ value = "" } = {}) {
  return `
    <details class="mt-3 rounded-lg border border-[rgba(60,60,67,0.12)] bg-white/60">
      <summary class="cursor-pointer px-3 py-2.5 text-xs font-bold text-[#706E6B] marker:content-none [&::-webkit-details-marker]:hidden">
        Web OAuth client? Add client secret
      </summary>
      <div class="border-t border-[rgba(60,60,67,0.08)] px-3 py-3">
        <label class="block">
          <span class="text-[10px] font-semibold text-[#969492]">Google client secret</span>
          <input
            type="password"
            name="googleClientSecret"
            value="${escapeHtml(value)}"
            autocomplete="off"
            placeholder="GOCSPX-… (from Google Cloud → Credentials → your Web client)"
            class="mt-1.5 w-full rounded-lg border border-[rgba(60,60,67,0.12)] bg-white px-3 py-2.5 font-mono text-xs text-[#181818] outline-none placeholder:text-[#969492] focus:border-[#0176D3] focus:ring-2 focus:ring-[#0176D3]/15"
          />
        </label>
        <p class="mt-2 text-[10px] leading-4 text-[#969492]">
          <strong class="text-[#706E6B]">Desktop app</strong> clients: leave blank.
          <strong class="text-[#706E6B]">Web application</strong> clients: paste the secret from Google Cloud (same row as your Client ID). Stored only in this browser — do not deploy a public build with a secret embedded.
        </p>
      </div>
    </details>
  `;
}
