import { ActivityTimelineItem } from "../components/ActivityTimelineItem.js";
import { EmptyState, bindEmptyState } from "../components/EmptyState.js";

export class TimelineView {
  constructor({ store, onOpenLead }) {
    this.store = store;
    this.onOpenLead = onOpenLead;
  }

  render() {
    const { followUps, activity } = this.store.getTimelineFeed();
    const hasLeads = this.store.getLeads().length > 0;

    return `
      <main class="view-enter px-5 pb-32 pt-2 lg:px-8 lg:pb-8">
        ${
          !hasLeads
            ? EmptyState({
                title: "No timeline yet",
                description: "Add a lead to start tracking follow-ups and recent activity.",
                actionLabel: "Add lead",
                actionTarget: "add",
                icon: "timeline",
              })
            : `<div class="lg:grid lg:grid-cols-2 lg:gap-6">
              <section>
                <h2 class="mb-3 text-lg font-bold text-[#181818]">Pending Follow-Ups</h2>
                <div class="rounded-2xl bg-white p-4 lg:p-5">
                  ${
                    followUps.length
                      ? `<div class="space-y-4">${followUps.map((item) => this.followUpTemplate(item)).join("")}</div>`
                      : `<p class="py-2 text-sm font-medium text-[#706E6B]">No pending follow-ups.</p>`
                  }
                </div>
              </section>

              <section class="mt-6 lg:mt-0">
                <h2 class="mb-3 text-lg font-bold text-[#181818]">Recent Activity</h2>
                <div class="rounded-2xl bg-white p-4 lg:p-5">
                  ${
                    activity.length
                      ? `<div class="activity-spine">${activity.map((item) => ActivityTimelineItem(item)).join("")}</div>`
                      : `<p class="py-2 text-sm font-medium text-[#706E6B]">No activity yet.</p>`
                  }
                </div>
              </section>
            </div>`
        }
      </main>
    `;
  }

  followUpTemplate(item) {
    return `
      <button
        type="button"
        class="flex w-full items-start gap-3 text-left transition active:opacity-80"
        data-follow-up
        data-lead-id="${item.lead.ID}"
      >
        <span class="mt-1.5 inline-flex h-3 w-3 shrink-0 rounded-full bg-[#0176D3]" aria-hidden="true"></span>
        <span class="min-w-0">
          <span class="block text-sm font-bold leading-5 text-[#181818]">${item.title}</span>
          <span class="mt-0.5 block text-xs font-medium text-[#706E6B]">${item.subtitle}</span>
        </span>
      </button>
    `;
  }

  bind(root) {
    bindEmptyState(root);

    const openById = (leadId) => {
      const lead = this.store.getLead(leadId);
      if (lead) {
        this.onOpenLead?.(lead);
      }
    };

    root.querySelectorAll("[data-follow-up]").forEach((button) => {
      button.addEventListener("click", () => openById(button.dataset.leadId));
    });

    root.querySelectorAll("[data-activity-item]").forEach((button) => {
      button.addEventListener("click", () => openById(button.dataset.leadId));
    });
  }
}
