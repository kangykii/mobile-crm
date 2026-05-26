import { getStageTheme } from "../core/utils/stageTheme.js";
import { LeadCard } from "./LeadCard.js";

export function SwipeableLeadRow(lead, { compact = false } = {}) {
  const theme = getStageTheme(lead.Stage);

  return `
    <div
      class="lead-row cursor-pointer overflow-hidden rounded-2xl transition hover:brightness-[0.98]"
      data-lead-row
      data-lead-id="${lead.ID}"
      title="Double-tap to open"
      style="background:${theme.fill}; box-shadow: inset 0 0 0 1px ${theme.accent}28;"
    >
      ${LeadCard(lead, { compact, theme })}
    </div>
  `;
}

export function bindSwipeableRows(root, { onOpenLead, leads = [] } = {}) {
  root.querySelectorAll("[data-lead-row]").forEach((row) => {
    if (row.dataset.leadBound === "true") {
      return;
    }

    row.dataset.leadBound = "true";
    let lastTap = 0;

    const openLead = () => {
      const lead = leads.find((item) => item.ID === row.dataset.leadId);
      if (lead) {
        onOpenLead?.(lead);
      }
    };

    row.addEventListener("dblclick", (event) => {
      if (event.target.closest(".quick-action")) {
        return;
      }

      event.preventDefault();
      openLead();
    });

    row.addEventListener("click", (event) => {
      if (event.target.closest(".quick-action")) {
        return;
      }

      const now = Date.now();
      if (now - lastTap < 360) {
        event.preventDefault();
        openLead();
        lastTap = 0;
        return;
      }

      lastTap = now;
    });
  });
}

export function resetSwipeableRows() {
  // No-op — kept for callers that reset swipe state after re-render.
}
