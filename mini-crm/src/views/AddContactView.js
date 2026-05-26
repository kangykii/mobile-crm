const ADD_LEAD_STAGES = ["New", "Contacted", "Proposal"];

const QUICKFILL_CONTACTS = {
  Name: "Sarah Cooper",
  Company: "GreenTech Solutions",
  Email: "sarah@greentech.com",
  Phone: "+1 234 567 8902",
  Value: "25000",
  Stage: "Contacted",
  Note: "Imported from device contacts.",
};

const QUICKFILL_LINKEDIN = {
  Name: "Alex Morgan",
  Company: "ScalePath",
  Email: "alex.morgan@scalepath.io",
  Phone: "+1 415 555 0198",
  Value: "32000",
  Stage: "New",
  Note: "Imported from LinkedIn profile.",
};

export class AddContactView {
  constructor({ store, notifier, onCreated }) {
    this.store = store;
    this.notifier = notifier;
    this.onCreated = onCreated;
    this.selectedStage = "New";
  }

  render() {
    return `
      <main class="view-enter px-5 pb-28 pt-2 lg:mx-auto lg:max-w-2xl lg:px-8 lg:pb-8">
        ${this.quickFillTemplate()}
        <form class="space-y-4 rounded-2xl bg-white p-4" data-add-contact-form>
          ${this.field("Name", "Name", "text", "Sarah Cooper")}
          ${this.field("Company", "Company", "text", "GreenTech Solutions")}
          ${this.field("Email", "Email", "email", "sarah@company.com")}
          ${this.field("Phone", "Phone", "tel", "+1 234 567 8901")}
          ${this.field("Value", "Value", "number", "15000")}
          ${this.stageSegmented()}
          <label class="block">
            <span class="text-sm font-semibold text-[#706E6B]">Initial note</span>
            <textarea class="mt-2 min-h-28 w-full resize-none rounded-xl border border-[rgba(60,60,67,0.12)] bg-[#F2F2F7] px-4 py-3 text-sm text-[#181818] outline-none placeholder:text-[#969492] focus:border-[#0176D3] focus:ring-2 focus:ring-[#0176D3]/20" name="Note" placeholder="How did this lead enter your pipeline?"></textarea>
          </label>
          <button class="w-full rounded-xl bg-[#0176D3] px-4 py-4 text-sm font-bold text-white transition hover:bg-[#014486]" type="submit">Save Lead</button>
        </form>
      </main>
    `;
  }

  quickFillTemplate() {
    return `
      <section class="mb-4 rounded-2xl bg-white p-4">
        <p class="text-sm font-semibold text-[#706E6B]">Quick fill</p>
        <div class="mt-3 grid grid-cols-2 gap-3">
          <button
            type="button"
            data-quickfill="contacts"
            class="flex items-center justify-center gap-2 rounded-xl bg-[#F2F2F7] px-3 py-3.5 text-sm font-semibold text-[#181818] transition active:scale-[0.98] hover:bg-[#E5E5EA]"
          >
            <svg class="h-5 w-5 text-[#0176D3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="M16 11a4 4 0 1 0-8 0"></path>
              <path d="M20 21a8 8 0 0 0-16 0"></path>
            </svg>
            Contacts
          </button>
          <button
            type="button"
            data-quickfill="linkedin"
            class="flex items-center justify-center gap-2 rounded-xl bg-[#F2F2F7] px-3 py-3.5 text-sm font-semibold text-[#181818] transition active:scale-[0.98] hover:bg-[#E5E5EA]"
          >
            <svg class="h-5 w-5 text-[#0A66C2]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.5 2h-17A1.5 1.5 0 0 0 2 3.5v17A1.5 1.5 0 0 0 3.5 22h17a1.5 1.5 0 0 0 1.5-1.5v-17A1.5 1.5 0 0 0 20.5 2ZM8 19H5v-9h3v9Zm-1.5-10.3c-1 0-1.7-.7-1.7-1.6s.7-1.6 1.7-1.6 1.7.7 1.7 1.6-.7 1.6-1.7 1.6ZM19 19h-3v-4.6c0-1.1 0-2.5-1.5-2.5s-1.7 1.2-1.7 2.4V19h-3v-9h2.9v1.2h.1c.4-.8 1.4-1.6 2.9-1.6 3.1 0 3.7 2 3.7 4.6V19Z"></path>
            </svg>
            LinkedIn
          </button>
        </div>
      </section>
    `;
  }

  stageSegmented() {
    return `
      <div class="flex items-center gap-3">
        <span class="shrink-0 text-sm font-semibold text-[#706E6B]">Stage</span>
        <div class="stage-segmented min-w-0 flex-1" data-stage-segmented role="group" aria-label="Lead stage">
          <div class="stage-segmented-track flex w-full rounded-[10px] bg-[#E5E5EA] p-0.5">
            ${ADD_LEAD_STAGES.map((stage) => this.stageButton(stage)).join("")}
          </div>
          <input type="hidden" name="Stage" value="${this.selectedStage}" data-stage-input />
        </div>
      </div>
    `;
  }

  stageButton(stage) {
    const active = stage === this.selectedStage;
    return `
      <button
        type="button"
        data-stage-option="${stage}"
        aria-pressed="${active}"
        class="stage-segment min-w-0 flex-1 rounded-[8px] px-1 py-1.5 text-center text-[11px] transition ${
          active
            ? "stage-segment-active bg-white font-bold text-[#181818] shadow-sm"
            : "font-medium text-[#181818]"
        }"
      >
        ${stage}
      </button>
    `;
  }

  bind(root) {
    const form = root.querySelector("[data-add-contact-form]");
    if (!form) {
      return;
    }

    root.querySelector('[data-quickfill="contacts"]')?.addEventListener("click", () => {
      this.applyQuickFill(form, QUICKFILL_CONTACTS);
      this.notifier?.show("Filled from Contacts.", "success");
    });

    root.querySelector('[data-quickfill="linkedin"]')?.addEventListener("click", () => {
      this.applyQuickFill(form, QUICKFILL_LINKEDIN);
      this.notifier?.show("Filled from LinkedIn.", "success");
    });

    form.querySelector("[data-stage-segmented]")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-stage-option]");
      if (!button) {
        return;
      }

      this.setStage(form, button.dataset.stageOption);
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget).entries());

      await this.store.createLead({
        Name: data.Name,
        Company: data.Company,
        Email: data.Email,
        Phone: data.Phone,
        Value: data.Value,
        Stage: data.Stage,
        Note: data.Note,
      });

      event.currentTarget.reset();
      this.setStage(form, "New");
      this.onCreated?.();
    });
  }

  applyQuickFill(form, data) {
    Object.entries(data).forEach(([key, value]) => {
      if (key === "Stage") {
        this.setStage(form, value);
        return;
      }

      const field = form.elements.namedItem(key);
      if (field) {
        field.value = value;
      }
    });
  }

  setStage(form, stage) {
    if (!ADD_LEAD_STAGES.includes(stage)) {
      stage = "New";
    }

    this.selectedStage = stage;
    const input = form.querySelector("[data-stage-input]");
    if (input) {
      input.value = stage;
    }

    form.querySelectorAll("[data-stage-option]").forEach((button) => {
      const active = button.dataset.stageOption === stage;
      button.setAttribute("aria-pressed", active ? "true" : "false");
      button.classList.toggle("stage-segment-active", active);
      button.classList.toggle("bg-white", active);
      button.classList.toggle("font-bold", active);
      button.classList.toggle("shadow-sm", active);
      button.classList.toggle("font-medium", !active);
    });
  }

  field(label, name, type, placeholder) {
    return `
      <label class="block">
        <span class="text-sm font-semibold text-[#706E6B]">${label}</span>
        <input class="mt-2 w-full rounded-xl border border-[rgba(60,60,67,0.12)] bg-[#F2F2F7] px-4 py-3 text-sm font-semibold text-[#181818] outline-none placeholder:text-[#969492] focus:border-[#0176D3] focus:ring-2 focus:ring-[#0176D3]/20" name="${name}" type="${type}" placeholder="${placeholder}" ${name === "Name" ? "required" : ""} />
      </label>
    `;
  }
}
