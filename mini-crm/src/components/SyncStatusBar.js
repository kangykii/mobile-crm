import { formatRelativeTime } from "../core/utils/formatters.js";

export function SyncStatusBar({
  online = true,
  flushing = false,
  pulling = false,
  pending = 0,
  lastSyncedAt = null,
  lastSyncError = null,
} = {}) {
  let label;

  if (flushing || pulling) {
    label = "Syncing...";
  } else if (!online) {
    label = pending > 0 ? `${pending} pending · offline` : "Offline";
  } else if (pending > 0) {
    label = `${pending} pending · tap to retry`;
  } else {
    const relativeTime = lastSyncedAt
      ? formatRelativeTime(new Date(lastSyncedAt).toISOString())
      : "just now";
    label = `Synced · ${relativeTime}`;
  }

  const dotClass = flushing || pulling
    ? "animate-pulse bg-[#FFB75D]"
    : !online || pending > 0
      ? "bg-[#FFB75D]"
      : "bg-[#2E844A]";

  const title = lastSyncError && pending > 0 ? `${label}\n\n${lastSyncError}` : label;

  return `
    <button
      type="button"
      class="inline-flex max-w-[11rem] items-center gap-1.5 rounded-full border border-[rgba(60,60,67,0.12)] bg-white/70 px-2.5 py-1 text-[10px] font-bold leading-none text-[#706E6B] backdrop-blur-md transition hover:border-[#0176D3] hover:text-[#0176D3]"
      data-sync-status-bar
      title="${title.replace(/"/g, "&quot;")}"
      aria-label="${label}"
    >
      <span class="h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}" aria-hidden="true"></span>
      <span class="truncate">${label}</span>
    </button>
  `;
}

export function bindSyncStatusBar(root, { onRetry } = {}) {
  root.querySelector("[data-sync-status-bar]")?.addEventListener("click", () => {
    onRetry?.();
  });
}
