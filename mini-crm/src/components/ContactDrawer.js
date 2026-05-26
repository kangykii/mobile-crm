import { EVENT_TYPES, parseTimeline } from "../core/domain/timelineEvent.js";
import { getNextStage } from "../core/utils/UrgencyDetector.js";
import { getStageTheme } from "../core/utils/stageTheme.js";
import { actionHref, formatCurrency, formatDateTime, formatPhone, formatRelativeTime, initials } from "../core/utils/formatters.js";

const EDITABLE_FIELDS = new Set(["Phone", "Email", "Value"]);

export class ContactDrawer {
  constructor(root, { store, notifier } = {}) {
    this.root = root;
    this.store = store;
    this.notifier = notifier;
    this.activeLead = null;
  }
  open(lead) {
    this.activeLead = lead;
    this.root.innerHTML = this.template(lead);
    document.body.classList.add("overflow-hidden");
    this.bind();
  }

  close() {
    this.root.innerHTML = "";
    this.activeLead = null;
    document.body.classList.remove("overflow-hidden");
  }

  bind() {
    this.root.querySelectorAll("[data-close-drawer]").forEach((element) => {
      element.addEventListener("click", () => this.close());
    });

    const panel = this.root.querySelector("[data-drawer-panel]");
    panel?.addEventListener("click", (event) => event.stopPropagation());

    const form = this.root.querySelector("[data-note-form]");
    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const text = String(formData.get("note") || "").trim();
      const type = String(formData.get("type") || "Note");

      if (!text) {
        this.notifier?.show("Add a note before submitting.", "error");
        return;
      }

      const nextLead = await this.store.addNote(this.activeLead.ID, { type, text });
      if (nextLead) {
        this.open(nextLead);
      }
    });
    this.bindEditableFields();

    this.root.querySelector("[data-advance-stage]")?.addEventListener("click", async () => {
      if (!this.activeLead) {
        return;
      }

      const nextStage = getNextStage(this.activeLead.Stage);
      if (!nextStage) {
        return;
      }

      const updated = await this.store.advanceStage(this.activeLead.ID, nextStage);
      if (updated) {
        this.open(updated);
      }
    });

    this.root.querySelector("[data-edit-lead]")?.addEventListener("click", () => {
      this.notifier?.show("Edit action is stubbed for Phase 1.", "info");
    });

    this.root.querySelector("[data-delete-lead]")?.addEventListener("click", async () => {
      if (!this.activeLead) {
        return;
      }

      await this.store.deleteLead(this.activeLead.ID);
      this.notifier?.show("Lead deleted.", "success");
      this.close();
    });
  }

  bindEditableFields() {
    this.root.querySelectorAll("[data-editable-field]").forEach((card) => {
      card.addEventListener("dblclick", (event) => {
        if (event.target.closest("[data-field-action]")) {
          return;
        }

        this.startFieldEdit(card);
      });

      let lastTap = 0;
      card.addEventListener("touchend", (event) => {
        if (event.target.closest("[data-field-action]")) {
          return;
        }

        const now = Date.now();
        if (now - lastTap < 320) {
          event.preventDefault();
          this.startFieldEdit(card);
          lastTap = 0;
          return;
        }

        lastTap = now;
      });
    });
  }

  startFieldEdit(card) {
    if (card.dataset.editing === "true") {
      return;
    }

    const field = card.dataset.editableField;
    if (!EDITABLE_FIELDS.has(field)) {
      return;
    }

    const type = card.dataset.fieldType || "text";
    const valueEl = card.querySelector("[data-editable-value]");
    if (!valueEl) {
      return;
    }

    card.dataset.editing = "true";
    const input = document.createElement("input");
    input.type = type;
    input.value = String(this.activeLead[field] ?? "");
    input.dataset.editableInput = "true";
    input.className =
      "mt-1 w-full rounded-lg border border-[#0176D3] bg-white px-2 py-1 text-sm font-bold text-[#181818] outline-none focus:ring-2 focus:ring-[#0176D3]/20";
    input.setAttribute("aria-label", `Edit ${field}`);

    valueEl.replaceWith(input);
    input.focus();
    input.select();

    const cancelEdit = () => {
      card.dataset.editing = "false";
      input.replaceWith(this.valueNode(field, this.activeLead[field]));
    };

    let cancelled = false;

    const commitEdit = async () => {
      if (cancelled) {
        return;
      }

      const raw = input.value.trim();
      if (!raw && field !== "Value") {
        cancelEdit();
        return;
      }

      const nextValue = field === "Value" ? Number(raw || 0) : raw;
      if (nextValue === this.activeLead[field]) {
        cancelEdit();
        return;
      }

      await this.store.updateLead(this.activeLead.ID, { [field]: nextValue });
      this.activeLead = this.store.getLead(this.activeLead.ID) || this.activeLead;
      card.dataset.editing = "false";
      input.replaceWith(this.valueNode(field, this.activeLead[field]));
      this.notifier?.show(`${field} updated.`, "success");
    };
    input.addEventListener("blur", commitEdit);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        input.blur();
      }

      if (event.key === "Escape") {
        event.preventDefault();
        cancelled = true;
        cancelEdit();
      }
    });
  }

  valueNode(field, value) {
    const span = document.createElement("p");
    span.dataset.editableValue = "true";
    span.className = `mt-1 text-sm font-bold ${field === "Value" ? "text-[#0176D3]" : "text-[#181818]"} ${field === "Email" ? "truncate" : ""}`;
    span.title = "Double-tap to edit";

    if (field === "Phone") {
      span.textContent = formatPhone(value);
    } else if (field === "Value") {
      span.textContent = formatCurrency(value);
    } else {
      span.textContent = value;
    }

    return span;
  }

  editableCard({ field, type = "text", label, icon, valueHtml, actionHref: href }) {
    return `
      <div
        class="rounded-xl border border-[#C9C9C9] bg-[#E5E5EA] p-4"
        data-editable-field="${field}"
        data-field-type="${type}"
        title="Double-tap to edit"
      >
        <div class="flex items-start justify-between gap-2">
          <p class="inline-flex items-center gap-1 text-sm font-semibold text-[#706E6B]">
            ${icon}
            ${label}
          </p>
          ${
            href
              ? `<a class="shrink-0 rounded-full p-1 text-[#0176D3] transition hover:bg-white/70" href="${href}" data-field-action aria-label="${label} ${this.activeLead?.Name || "lead"}">
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M7 17L17 7M8 7h9v9"/></svg>
                </a>`
              : ""
          }
        </div>
        ${valueHtml}
      </div>
    `;
  }

  template(lead) {
    const events = parseTimeline(lead.NotesTimeline);
    const nextStage = getNextStage(lead.Stage);
    const theme = getStageTheme(lead.Stage);

    return `
      <div class="fixed inset-0 z-40 bg-[#181818]/25 backdrop-blur-sm" data-close-drawer>
        <section
          class="drawer-enter drawer-shell fixed bottom-0 flex max-h-[92vh] w-full max-w-[430px] flex-col overflow-hidden rounded-t-[2rem] border border-[#C9C9C9] bg-white shadow-2xl shadow-[#181818]/20 lg:rounded-[1.5rem]"
          data-drawer-panel
          role="dialog"
          aria-modal="true"
          aria-label="${lead.Name} details"
        >
          <div class="scroll-soft overflow-y-auto px-5 pb-8 pt-5" style="padding-bottom: calc(2rem + var(--safe-bottom));">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h2 class="inline-flex items-center gap-2 text-2xl font-bold text-[#181818]">
                  <span class="inline-avatar inline-avatar-lg" style="background:${theme.fill}; color:${theme.text};">${initials(lead.Name)}</span>
                  ${lead.Name}
                </h2>
                <p class="mt-1 text-sm font-medium text-[#706E6B]">${lead.Company}</p>
                <p class="mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide" style="background:${theme.fill}; color:${theme.text};">
                  ${lead.Stage} · ${formatRelativeTime(lead.LastContactedAt)}
                </p>
              </div>
              <button class="rounded-full border border-[#C9C9C9] bg-white p-2 text-[#706E6B] transition hover:border-[#0176D3] hover:text-[#0176D3]" data-close-drawer aria-label="Close drawer">
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                  <path d="M6 6l12 12M18 6 6 18"></path>
                </svg>
              </button>
            </div>

            ${
              nextStage
                ? `<button
                    type="button"
                    data-advance-stage
                    class="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#34C759] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#2E844A]"
                  >
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                    Move to ${nextStage}
                  </button>`
                : ""
            }

            <div class="mt-6 grid grid-cols-2 gap-3">
              ${this.editableCard({
                field: "Phone",
                type: "tel",
                label: "Phone",
                icon: `<svg class="h-3.5 w-3.5 text-[#0176D3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.77.63 2.6a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.48-1.2a2 2 0 0 1 2.11-.45c.83.3 1.7.51 2.6.63A2 2 0 0 1 22 16.92Z"/></svg>`,
                valueHtml: `<p class="mt-1 text-sm font-bold text-[#181818]" data-editable-value title="Double-tap to edit">${formatPhone(lead.Phone)}</p>`,
                actionHref: actionHref("call", lead.Phone),
              })}
              ${this.editableCard({
                field: "Email",
                type: "email",
                label: "Email",
                icon: `<svg class="h-3.5 w-3.5 text-[#0176D3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 6h16v12H4V6Zm0 1 8 6 8-6"/></svg>`,
                valueHtml: `<p class="mt-1 truncate text-sm font-bold text-[#181818]" data-editable-value title="Double-tap to edit">${lead.Email}</p>`,
                actionHref: actionHref("email", lead.Email),
              })}
              ${this.editableCard({
                field: "Value",
                type: "number",
                label: "Value",
                icon: "",
                valueHtml: `<p class="mt-1 text-sm font-bold text-[#0176D3]" data-editable-value title="Double-tap to edit">${formatCurrency(lead.Value)}</p>`,
              })}
              <div class="rounded-xl border border-[#C9C9C9] bg-[#E5E5EA] p-4">
                <p class="inline-flex items-center gap-1 text-sm font-semibold text-[#706E6B]">
                  <svg class="h-3.5 w-3.5 text-[#0176D3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                  Last touch
                </p>
                <p class="mt-1 text-sm font-bold text-[#181818]">${formatDateTime(lead.LastContactedAt)}</p>
              </div>
            </div>

            <form class="mt-6 rounded-2xl border border-[#0176D3]/20 bg-[#EAF5FE] p-4" data-note-form>
              <div class="flex items-center justify-between gap-3">
                <h3 class="text-lg font-bold text-[#181818]">Add Note</h3>
                <select class="rounded-lg border border-[#C9C9C9] bg-white px-3 py-2 text-xs font-bold text-[#181818] outline-none focus:border-[#0176D3]" name="type">
                  ${EVENT_TYPES.map((type) => `<option value="${type}">${type}</option>`).join("")}
                </select>
              </div>
              <textarea class="mt-3 min-h-24 w-full resize-none rounded-xl border border-[#C9C9C9] bg-white p-3 text-sm text-[#181818] outline-none placeholder:text-[#969492] focus:border-[#0176D3] focus:ring-2 focus:ring-[#0176D3]/20" name="note" placeholder="What happened with this lead?"></textarea>
              <button class="mt-3 w-full rounded-xl bg-[#0176D3] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#014486]" type="submit">Submit Note</button>
            </form>

            <div class="mt-6">
              <div class="mb-3 flex items-center justify-between">
                <h3 class="text-lg font-bold text-[#181818]">Timeline</h3>
                <span class="text-xs font-bold text-[#706E6B]">${events.length} events</span>
              </div>
              <div class="space-y-3">
                ${events.length ? events.map((event) => this.eventTemplate(event)).join("") : `<p class="rounded-xl border border-[#C9C9C9] bg-[#E5E5EA] p-4 text-sm text-[#706E6B]">No timeline entries yet.</p>`}
              </div>
            </div>

            <div class="mt-6 grid grid-cols-2 gap-3">
              <button class="rounded-xl border border-[#C9C9C9] bg-white px-4 py-3 text-sm font-bold text-[#181818] transition hover:border-[#0176D3]" data-edit-lead>Edit</button>
              <button class="rounded-xl border border-[#FE5C4C]/30 bg-[#FEF1EE] px-4 py-3 text-sm font-bold text-[#BA0517] transition hover:border-[#FE5C4C]" data-delete-lead>Delete</button>
            </div>
          </div>
        </section>
      </div>
    `;
  }

  eventTemplate(event) {
    return `
      <article class="rounded-xl border border-[#C9C9C9] bg-[#E5E5EA] p-4">
        <div class="flex items-center justify-between gap-3">
          <span class="inline-flex items-center gap-1 rounded-full bg-[#EAF5FE] px-2.5 py-1 text-[11px] font-black text-[#0176D3]">${event.type}</span>
          <time class="text-xs font-semibold text-[#706E6B]">${formatDateTime(event.date)}</time>
        </div>
        <p class="mt-3 text-sm leading-6 text-[#181818]">${event.text}</p>
      </article>
    `;
  }
}
