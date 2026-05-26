export function EmptyState({
  title,
  description,
  actionLabel,
  actionTarget,
  icon = "leads",
} = {}) {
  const icons = {
    leads: `<svg class="h-8 w-8 text-[#0176D3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M16 11a4 4 0 1 0-8 0"></path><path d="M20 21a8 8 0 0 0-16 0"></path></svg>`,
    timeline: `<svg class="h-8 w-8 text-[#0176D3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 8v4l3 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"></path></svg>`,
  };

  return `
    <div class="rounded-2xl bg-white px-4 py-10 text-center" data-empty-state>
      <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF5FE]">
        ${icons[icon] || icons.leads}
      </div>
      <p class="text-sm font-bold text-[#181818]">${title}</p>
      <p class="mt-2 text-sm leading-6 text-[#706E6B]">${description}</p>
      ${
        actionLabel && actionTarget
          ? `<button
              type="button"
              class="mt-5 w-full rounded-xl bg-[#0176D3] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#014486]"
              data-empty-action="${actionTarget}"
            >
              ${actionLabel}
            </button>`
          : ""
      }
    </div>
  `;
}

export function bindEmptyState(root) {
  root.querySelectorAll("[data-empty-action]").forEach((button) => {
    button.addEventListener("click", () => {
      window.dispatchEvent(new CustomEvent("mini-crm:navigate", { detail: button.dataset.emptyAction }));
    });
  });
}
