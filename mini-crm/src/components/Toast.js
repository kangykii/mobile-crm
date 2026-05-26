const TYPE_STYLES = {
  success: "border-[#45C65A]/30 bg-[#ECFDF3] text-[#027A48]",
  error: "border-[#FE5C4C]/30 bg-[#FEF1EE] text-[#BA0517]",
  info: "border-[#0176D3]/30 bg-[#EAF5FE] text-[#014486]",
};

export class Toast {
  constructor() {
    this.container = document.createElement("div");
    this.container.className = "pointer-events-none fixed left-1/2 top-4 z-50 w-[min(92vw,390px)] -translate-x-1/2 space-y-2 lg:left-auto lg:right-6 lg:translate-x-0";
    document.body.append(this.container);
  }

  show(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = [
      "toast-enter pointer-events-auto rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg shadow-[#181818]/10",
      TYPE_STYLES[type] || TYPE_STYLES.info,
    ].join(" ");
    toast.textContent = message;
    this.container.append(toast);

    window.setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(-10px)";
      toast.style.transition = "opacity 180ms ease, transform 180ms ease";
      window.setTimeout(() => toast.remove(), 190);
    }, 2800);
  }
}
