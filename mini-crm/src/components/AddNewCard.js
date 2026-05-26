export function AddNewCard({ label, action = "add" } = {}) {
  return `
    <button
      type="button"
      data-add-new="${action}"
      class="flex w-full flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-[rgba(60,60,67,0.18)] bg-[#F2F2F7] px-6 py-10 text-center transition hover:border-[#0176D3]/40 hover:bg-[#EAF5FE]/50 active:scale-[0.99]"
      aria-label="${label}"
    >
      <span class="mb-3 text-3xl font-light leading-none text-[#181818]">+</span>
      <span class="text-base font-bold text-[#181818]">${label}</span>
    </button>
  `;
}

export function AddNewColumnCard({ label, action = "add" } = {}) {
  return `
    <div class="flex min-h-[62vh] w-[82vw] max-w-[320px] shrink-0 items-stretch p-1">
      <button
        type="button"
        data-add-new="${action}"
        class="flex h-full w-full flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-[rgba(60,60,67,0.18)] bg-[#F2F2F7] px-6 py-10 text-center transition hover:border-[#0176D3]/40 hover:bg-[#EAF5FE]/50 active:scale-[0.99]"
        aria-label="${label}"
      >
        <span class="mb-3 text-3xl font-light leading-none text-[#181818]">+</span>
        <span class="text-base font-bold text-[#181818]">${label}</span>
      </button>
    </div>
  `;
}

export function bindAddNewCard(root) {
  root.querySelectorAll("[data-add-new]").forEach((button) => {
    button.addEventListener("click", () => {
      window.dispatchEvent(new CustomEvent("mini-crm:navigate", { detail: button.dataset.addNew || "add" }));
    });
  });
}
