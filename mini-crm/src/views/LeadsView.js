import { AddNewCard, bindAddNewCard } from "../components/AddNewCard.js";
import { EmptyState, bindEmptyState } from "../components/EmptyState.js";
import { bindSwipeableRows, SwipeableLeadRow } from "../components/SwipeableLeadRow.js";
import { getStageTheme } from "../core/utils/stageTheme.js";
import { STAGES } from "../core/utils/UrgencyDetector.js";

const STAGE_FILTERS = ["All", ...STAGES];

const SORT_OPTIONS = [
  { id: "lastContact-desc", label: "Last contact · Newest" },
  { id: "lastContact-asc", label: "Last contact · Oldest" },
  { id: "created-desc", label: "Created · Newest" },
  { id: "created-asc", label: "Created · Oldest" },
  { id: "name-asc", label: "Name · A to Z" },
  { id: "name-desc", label: "Name · Z to A" },
  { id: "value-desc", label: "Value · High to low" },
  { id: "value-asc", label: "Value · Low to high" },
];

export class LeadsView {
  constructor({ store, onOpenLead }) {
    this.store = store;
    this.onOpenLead = onOpenLead;
    this.searchQuery = "";
    this.stageFilter = "All";
    this.sortBy = "lastContact-desc";
    this.openMenu = null;
  }

  render() {
    const activeTheme = getStageTheme(this.stageFilter === "All" ? "All" : this.stageFilter);

    return `
      <main
        class="view-enter px-4 pb-32 pt-2 sm:px-5 lg:px-6 lg:pb-8"
        style="${this.stageFilter !== "All" ? `background: linear-gradient(180deg, ${activeTheme.fill} 0%, rgba(242,242,247,0) 12rem);` : ""}"
      >
        ${this.toolbarTemplate()}
        ${this.stageStripTemplate()}
        <section class="mt-4">
          <div class="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0 xl:grid-cols-3" data-leads-list>
            ${this.listTemplate(this.getFilteredLeads())}
          </div>
        </section>
      </main>
    `;
  }

  stageStripTemplate() {
    const filters = STAGE_FILTERS;

    return `
        <section class="mt-3" data-stage-strip>
          <p class="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#969492]">Pipeline stage · double-tap a lead to open</p>
        <div class="scroll-soft flex gap-2 overflow-x-auto pb-1">
          ${filters
            .map((stage) => {
              const theme = getStageTheme(stage === "All" ? "All" : stage);
              const active = this.stageFilter === stage;
              return `
                <button
                  type="button"
                  data-stage-filter="${stage}"
                  class="shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition ${
                    active ? "shadow-sm" : "opacity-80 hover:opacity-100"
                  }"
                  style="${active ? `background:${theme.accent}; color:#ffffff;` : `background:${theme.fill}; color:${theme.text};`}"
                  aria-pressed="${active}"
                >
                  ${stage}
                </button>
              `;
            })
            .join("")}
        </div>
      </section>
    `;
  }

  toolbarTemplate() {
    const filterActive = this.stageFilter !== "All";
    const sortActive = this.sortBy !== "lastContact-desc";

    return `
      <section class="relative" data-leads-toolbar>
        <div class="flex items-center gap-2">
          <label class="relative min-w-0 flex-1">
            <svg class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#969492]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <circle cx="11" cy="11" r="7"></circle>
              <path d="M20 20l-3.5-3.5"></path>
            </svg>
            <input
              class="w-full rounded-2xl border border-[rgba(60,60,67,0.12)] bg-white/80 py-3 pl-10 pr-3 text-sm font-medium text-[#181818] outline-none backdrop-blur-sm placeholder:text-[#969492] focus:border-[#0176D3] focus:ring-2 focus:ring-[#0176D3]/15"
              type="search"
              placeholder="Search leads"
              value="${this.searchQuery}"
              data-leads-search
            />
          </label>

          <div class="relative shrink-0">
            <button
              type="button"
              data-menu-toggle="filter"
              class="${this.toolbarButtonClass(filterActive)}"
              aria-label="Filter leads"
              aria-expanded="${this.openMenu === "filter"}"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path d="M4 6h16M7 12h10M10 18h4"></path>
              </svg>
            </button>
            ${this.filterMenu()}
          </div>

          <div class="relative shrink-0">
            <button
              type="button"
              data-menu-toggle="sort"
              class="${this.toolbarButtonClass(sortActive)}"
              aria-label="Sort leads"
              aria-expanded="${this.openMenu === "sort"}"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path d="M8 9l4-4 4 4M8 15l4 4 4-4"></path>
              </svg>
            </button>
            ${this.sortMenu()}
          </div>
        </div>
      </section>
    `;
  }

  toolbarButtonClass(active) {
    return [
      "inline-flex h-11 w-11 items-center justify-center rounded-2xl border backdrop-blur-sm transition hover:border-[#0176D3] hover:text-[#0176D3]",
      active
        ? "border-[#0176D3] bg-[#EAF5FE] text-[#0176D3]"
        : "border-[rgba(60,60,67,0.12)] bg-white/80 text-[#706E6B]",
    ].join(" ");
  }

  bind(root) {
    this.bindToolbar(root);
    this.bindLeadRows(root);
    bindAddNewCard(root);

    root.querySelector("#view-root")?.addEventListener("click", (event) => {
      const stageButton = event.target.closest("[data-stage-filter]");
      if (stageButton) {
        event.stopPropagation();
        this.stageFilter = stageButton.dataset.stageFilter;
        this.openMenu = null;
        this.syncToolbar(root);
        this.refreshView(root);
        return;
      }

      const sortButton = event.target.closest("[data-sort-option]");
      if (sortButton) {
        event.stopPropagation();
        this.sortBy = sortButton.dataset.sortOption;
        this.openMenu = null;
        this.syncToolbar(root);
        this.refreshList(root);
      }
    });

    this.onOutsideClick = (event) => {
      const toolbar = root.querySelector("[data-leads-toolbar]");
      if (toolbar && !toolbar.contains(event.target) && this.openMenu) {
        this.openMenu = null;
        this.syncToolbar(root);
      }
    };

    document.addEventListener("click", this.onOutsideClick);
  }

  bindToolbar(root) {
    root.querySelector("[data-leads-search]")?.addEventListener("input", (event) => {
      this.searchQuery = event.target.value;
      this.refreshList(root);
    });

    root.querySelectorAll("[data-menu-toggle]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        const menu = button.dataset.menuToggle;
        this.openMenu = this.openMenu === menu ? null : menu;
        this.syncToolbar(root);
      });
    });
  }

  syncToolbar(root) {
    const toolbar = root.querySelector("[data-leads-toolbar]");
    if (!toolbar) {
      return;
    }

    toolbar.outerHTML = this.toolbarTemplate();
    this.bindToolbar(root);
  }

  refreshView(root) {
    const main = root.querySelector("#view-root main");
    if (!main) {
      this.refreshList(root);
      return;
    }

    main.outerHTML = this.render().match(/<main[\s\S]*<\/main>/)?.[0] || "";
    this.bindToolbar(root);
    this.bindLeadRows(root);
    bindAddNewCard(root);
  }

  bindLeadRows(root) {
    bindEmptyState(root);
    bindSwipeableRows(root, {
      leads: this.getFilteredLeads(),
      onOpenLead: this.onOpenLead,
    });
  }

  refreshList(root) {
    const list = root.querySelector("[data-leads-list]");
    if (!list) {
      return;
    }

    list.innerHTML = this.listTemplate(this.getFilteredLeads());
    this.bindLeadRows(root);
    bindAddNewCard(root);
  }

  filterMenu() {
    return `
      <div data-filter-menu class="${this.openMenu === "filter" ? "" : "hidden"} absolute right-0 top-[calc(100%+0.5rem)] z-20 w-44 overflow-hidden rounded-2xl border border-[rgba(60,60,67,0.12)] bg-white/95 p-1.5 shadow-lg backdrop-blur-xl">
        ${STAGE_FILTERS.map((stage) => {
          const active = this.stageFilter === stage;
          return `
            <button
              type="button"
              data-stage-filter="${stage}"
              class="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition ${active ? "bg-[#EAF5FE] text-[#0176D3]" : "text-[#181818] hover:bg-[#F2F2F7]"}"
            >
              ${stage}
              ${active ? `<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg>` : ""}
            </button>
          `;
        }).join("")}
      </div>
    `;
  }

  sortMenu() {
    return `
      <div data-sort-menu class="${this.openMenu === "sort" ? "" : "hidden"} absolute right-0 top-[calc(100%+0.5rem)] z-20 w-52 overflow-hidden rounded-2xl border border-[rgba(60,60,67,0.12)] bg-white/95 p-1.5 shadow-lg backdrop-blur-xl">
        ${SORT_OPTIONS.map((option) => {
          const active = this.sortBy === option.id;
          return `
            <button
              type="button"
              data-sort-option="${option.id}"
              class="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition ${active ? "bg-[#EAF5FE] text-[#0176D3]" : "text-[#181818] hover:bg-[#F2F2F7]"}"
            >
              <span>${option.label}</span>
              ${active ? `<svg class="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg>` : ""}
            </button>
          `;
        }).join("")}
      </div>
    `;
  }

  listTemplate(leads) {
    if (!this.store.getLeads().length) {
      return EmptyState({
        title: "No leads yet",
        description: "Add your first lead to start building your pipeline.",
        actionLabel: "Add lead",
        actionTarget: "add",
      });
    }

    if (!leads.length) {
      return `
        <div class="rounded-2xl bg-white px-4 py-10 text-center">
          <p class="text-sm font-bold text-[#181818]">No leads match your search</p>
          <p class="mt-1 text-xs text-[#706E6B]">Try a different name, company, filter, or sort.</p>
        </div>
        ${AddNewCard({ label: "New lead" })}
      `;
    }

    return `${leads.map((lead) => SwipeableLeadRow(lead)).join("")}${AddNewCard({ label: "New lead" })}`;
  }

  getFilteredLeads() {
    return this.store.getLeadsList({
      search: this.searchQuery,
      stageFilter: this.stageFilter,
      sortBy: this.sortBy,
    });
  }
}
