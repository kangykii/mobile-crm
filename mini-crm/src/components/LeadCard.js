import { getLeadUrgency } from "../core/utils/UrgencyDetector.js";
import { actionHref, formatCurrency, formatRelativeTime } from "../core/utils/formatters.js";
const ACTIONS = [
  { kind: "call", label: "Call", icon: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.77.63 2.6a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.48-1.2a2 2 0 0 1 2.11-.45c.83.3 1.7.51 2.6.63A2 2 0 0 1 22 16.92Z" },
  { kind: "email", label: "Email", icon: "M4 6h16v12H4V6Zm0 1 8 6 8-6" },
  { kind: "sms", label: "SMS", icon: "M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" },
];

function urgencyAccent(urgency) {
  if (urgency === "alert") {
    return `
      <p class="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#BA0517]">
        <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M12 9v4M12 17h.01"></path>
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"></path>
        </svg>
        Overdue
      </p>
    `;
  }

  if (urgency === "touch") {
    return `
      <p class="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#8C4B02]">
        <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="12" cy="12" r="9"></circle>
          <path d="M12 7v5l3 2"></path>
        </svg>
        Follow up
      </p>
    `;
  }

  return "";
}

export function LeadCard(lead, { compact = false } = {}) {
  const urgency = getLeadUrgency(lead);
  const cardSpacing = compact ? "p-3" : "p-4";

  return `
    <article
      class="lead-card bg-white ${cardSpacing}"
      data-lead-id="${lead.ID}"
      data-urgency="${urgency}"
    >
      <div class="flex items-start gap-3">
        <span class="mt-0.5 inline-flex h-6 w-6 shrink-0 rounded-full border-2 border-[#C7C7CC]" aria-hidden="true"></span>
        <div class="min-w-0 flex-1">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h3 class="truncate text-base font-bold text-[#181818]">${lead.Name}</h3>
              <p class="mt-0.5 truncate text-xs font-medium text-[#706E6B]">${lead.Company}</p>
              <p class="mt-1 text-[11px] font-medium text-[#969492]">${lead.Stage} · ${formatRelativeTime(lead.LastContactedAt)}</p>
              ${urgencyAccent(urgency)}
            </div>
            <p class="text-right text-base font-bold text-[#0176D3]">${formatCurrency(lead.Value)}</p>
          </div>
          ${
            compact
              ? ""
              : `<div class="mt-3 flex flex-wrap gap-2">
                  ${ACTIONS.map((action) => actionButton(action, lead)).join("")}
                </div>`
          }
        </div>
      </div>
    </article>
  `;
}

function actionButton(action, lead) {
  const value = action.kind === "email" ? lead.Email : lead.Phone;

  return `
    <a
      class="quick-action inline-flex items-center gap-1.5 rounded-full bg-[#F2F2F7] px-3 py-2 text-xs font-bold text-[#0176D3] transition hover:bg-[#EAF5FE]"
      href="${actionHref(action.kind, value)}"
      data-action="${action.kind}"
      aria-label="${action.label} ${lead.Name}"
    >
      <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="${action.icon}"></path>
      </svg>
      ${action.label}
    </a>
  `;
}
