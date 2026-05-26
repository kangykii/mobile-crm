import { SyncStatusBar, bindSyncStatusBar } from "./SyncStatusBar.js";

export function PageHeader({
  title,
  profileActive = false,
  showBack = false,
  syncStatus = null,
  profileInitials = "?",
  onSyncRetry = null,
} = {}) {
  const profileClasses = profileActive
    ? "border-[#0176D3] bg-[#0176D3] text-white shadow-md shadow-[#0176D3]/20"
    : "border-[rgba(60,60,67,0.1)] bg-white/45 text-[#0176D3] hover:border-[#0176D3] hover:bg-white/65";

  return `
    <header class="glass-header">
      <div class="glass-header-inner flex items-end gap-3 px-5 pb-1">
        ${
          showBack
            ? `<button type="button" data-page-back class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(60,60,67,0.1)] bg-white/45 text-[#706E6B] backdrop-blur-md transition hover:border-[#0176D3] hover:bg-white/70 hover:text-[#0176D3]" aria-label="Go back">
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M15 18l-6-6 6-6"></path>
                </svg>
              </button>`
            : ""
        }
        <h1 class="min-w-0 flex-1 font-sans text-[2.125rem] font-extrabold leading-none tracking-tight text-[#181818]">${title}</h1>
        <div class="flex shrink-0 items-center gap-2">
          ${syncStatus ? SyncStatusBar(syncStatus) : ""}
          <button type="button" data-open-profile class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border backdrop-blur-md lg:hidden ${profileClasses} text-xs font-semibold transition" aria-label="Open profile">
            ${profileInitials}
          </button>
        </div>
      </div>
    </header>
  `;
}

export function bindPageHeader(root, { onProfile, onBack, onSyncRetry } = {}) {
  root.querySelector("[data-open-profile]")?.addEventListener("click", () => onProfile?.());
  root.querySelector("[data-page-back]")?.addEventListener("click", () => onBack?.());
  bindSyncStatusBar(root, { onRetry: onSyncRetry });
}
