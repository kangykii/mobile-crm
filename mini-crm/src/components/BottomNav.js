const NAV_ITEMS = [
  { id: "home", label: "Home", icon: "M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.5Z" },
  { id: "leads", label: "Leads", icon: "M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11Zm4 1.75h8M8 12h8M8 15.75h5" },
  { id: "timeline", label: "Timeline", icon: "M12 8v4l3 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" },
];

export class BottomNav {
  constructor(onNavigate) {
    this.onNavigate = onNavigate;
  }

  render(activeView) {
    return `${this.renderMobile(activeView)}${this.renderSidebar(activeView)}`;
  }

  renderMobile(activeView) {
    return `
      <nav class="glass-nav fixed left-1/2 z-30 w-[calc(100%-2.5rem)] max-w-[360px] -translate-x-1/2 rounded-[1.75rem] px-2.5 pb-2.5 pt-3 lg:hidden" style="bottom: calc(1.35rem + var(--safe-bottom));">
        <div class="glass-nav-inner grid grid-cols-3 gap-1.5">
          ${NAV_ITEMS.map((item) => this.itemTemplate(item, activeView, "mobile")).join("")}
        </div>
      </nav>
    `;
  }

  renderSidebar(activeView) {
    return `
      <aside class="app-sidebar hidden lg:flex lg:shrink-0 lg:flex-col">
        <div class="mb-3 shrink-0 px-1">
          <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-[#969492]">Mini CRM</p>
        </div>
        <nav class="glass-nav flex min-h-0 flex-1 flex-col rounded-[1.25rem] p-2.5">
          <div class="glass-nav-inner flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
            ${NAV_ITEMS.map((item) => this.itemTemplate(item, activeView, "sidebar")).join("")}
          </div>
          <div class="mt-2 shrink-0 border-t border-[rgba(60,60,67,0.08)] pt-2">
            ${this.itemTemplate({ id: "add", label: "Add lead", icon: "M12 5v14M5 12h14" }, activeView, "sidebar")}
            ${this.itemTemplate({ id: "profile", label: "Settings", icon: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" }, activeView, "sidebar")}
          </div>
        </nav>
      </aside>
    `;
  }

  bind(root) {
    root.querySelectorAll("[data-nav]").forEach((button) => {
      button.addEventListener("click", () => this.onNavigate(button.dataset.nav));
    });
  }

  itemTemplate(item, activeView, variant) {
    const isActive = item.id === activeView;
    const activeClasses = isActive
      ? "bg-[#0176D3] text-white shadow-sm"
      : "text-[#706E6B] hover:bg-white/45 hover:text-[#0176D3]";

    if (variant === "sidebar") {
      return `
        <button data-nav="${item.id}" class="inline-flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-sm font-semibold transition ${activeClasses}" aria-label="${item.label}">
          <svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="${item.icon}"></path>
          </svg>
          <span>${item.label}</span>
        </button>
      `;
    }

    return `
      <button data-nav="${item.id}" class="inline-flex w-full min-w-[5rem] items-center justify-center gap-1.5 rounded-xl px-2 py-3.5 text-[11px] font-semibold transition ${activeClasses}" aria-label="${item.label}">
        <svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="${item.icon}"></path>
        </svg>
        <span>${item.label}</span>
      </button>
    `;
  }
}
