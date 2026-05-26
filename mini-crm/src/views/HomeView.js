import { bindSwipeableRows, SwipeableLeadRow } from "../components/SwipeableLeadRow.js";
import { EmptyState, bindEmptyState } from "../components/EmptyState.js";
import { formatCurrency } from "../core/utils/formatters.js";

export class HomeView {
  constructor({ store, onOpenLead }) {
    this.store = store;
    this.onOpenLead = onOpenLead;
  }

  render() {
    const dashboard = this.store.getHomeDashboard();
    const isEmpty = dashboard.openLeadCount === 0;

    return `
      <main class="view-enter px-5 pb-32 pt-2 lg:px-8 lg:pb-8">
        ${
          this.store.hydrationState === "cached"
            ? `<p class="mb-4 rounded-xl bg-[#FFF8E6] px-4 py-3 text-sm font-semibold text-[#8C4B02]">Showing cached data while offline.</p>`
            : ""
        }

        <section class="rounded-2xl bg-white p-5 lg:p-6">
          <p class="text-4xl font-black text-[#0176D3] lg:text-5xl">${formatCurrency(dashboard.totalPipeline)}</p>
          <p class="mt-2 text-sm leading-6 text-[#706E6B]">
            ${
              isEmpty
                ? "Add your first lead to start tracking your pipeline."
                : `${dashboard.openLeadCount} active deals across ${dashboard.stageCount} stages.`
            }
          </p>
        </section>

        <section class="mt-4 grid grid-cols-3 gap-3 lg:mt-6 lg:gap-4">
          ${this.stat("Active", dashboard.openLeadCount)}
          ${this.stat("Won", dashboard.wonCount)}
          ${this.stat("Stale", dashboard.staleCount)}
        </section>

        ${
          isEmpty
            ? `<section class="mt-6">
                ${EmptyState({
                  title: "No leads yet",
                  description: "Create your first lead to unlock follow-ups, timelines, and pipeline stats.",
                  actionLabel: "Add your first lead",
                  actionTarget: "add",
                })}
              </section>`
            : ""
        }

        <section class="mt-6 lg:grid lg:grid-cols-2 lg:gap-6">
          <div>
          <div class="mb-3 flex items-center justify-between">
            <h2 class="text-lg font-bold text-[#181818]">Today</h2>
            <button class="text-sm font-bold text-[#0176D3]" data-home-add>Add lead</button>
          </div>
          <div class="grid gap-3">
            <button class="rounded-2xl bg-white p-4 text-left transition active:scale-[0.99]" data-home-nav="leads">
              <p class="inline-flex items-center gap-2 text-sm font-black text-[#181818]">
                <svg class="h-4 w-4 text-[#0176D3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11Z"/></svg>
                Work your lead list
              </p>
              <p class="mt-1 text-xs leading-5 text-[#706E6B]">Call, email, text, and open contact timelines.</p>
            </button>
            <button class="rounded-2xl bg-white p-4 text-left transition active:scale-[0.99]" data-home-nav="timeline">
              <p class="inline-flex items-center gap-2 text-sm font-black text-[#181818]">
                <svg class="h-4 w-4 text-[#0176D3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 8v4l3 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"/></svg>
                Review your timeline
              </p>
              <p class="mt-1 text-xs leading-5 text-[#706E6B]">See follow-ups and recent touchpoints.</p>
            </button>
          </div>
          </div>

        ${
          dashboard.hotLead
            ? `<div class="lg:mt-0">
                <h2 class="mb-3 text-lg font-bold text-[#181818]">Priority Lead</h2>
                ${SwipeableLeadRow(dashboard.hotLead)}
              </div>`
            : ""
        }
        </section>
      </main>
    `;
  }

  bind(root) {
    root.querySelectorAll("[data-home-nav]").forEach((button) => {
      button.addEventListener("click", () => {
        window.dispatchEvent(new CustomEvent("mini-crm:navigate", { detail: button.dataset.homeNav }));
      });
    });

    root.querySelector("[data-home-add]")?.addEventListener("click", () => {
      window.dispatchEvent(new CustomEvent("mini-crm:navigate", { detail: "add" }));
    });

    bindEmptyState(root);
    bindSwipeableRows(root, {
      leads: this.store.getLeads(),
      onOpenLead: this.onOpenLead,
      onAdvanceStage: (leadId, stage) => this.store.advanceStage(leadId, stage),
    });
  }

  stat(label, value) {
    return `
      <div class="rounded-2xl bg-white p-4 text-center">
        <p class="text-2xl font-bold text-[#0176D3]">${value}</p>
        <p class="mt-1 text-[11px] font-bold text-[#706E6B]">${label}</p>
      </div>
    `;
  }
}
