import { LeadCard } from "./LeadCard.js";
import { getNextStage } from "../core/utils/UrgencyDetector.js";
const REVEAL_WIDTH = 88;
const SNAP_THRESHOLD = 40;

export function SwipeableLeadRow(lead, { compact = false } = {}) {
  const nextStage = getNextStage(lead.Stage);
  const swipeEnabled = Boolean(nextStage);

  return `
    <div
      class="swipe-row relative overflow-hidden rounded-2xl bg-[#F2F2F7]"
      data-swipe-row
      data-lead-id="${lead.ID}"
      data-swipe-enabled="${swipeEnabled ? "true" : "false"}"
      data-next-stage="${nextStage || ""}"
    >
      ${
        swipeEnabled
          ? `<div class="swipe-action absolute inset-y-0 left-0 flex w-[88px] items-center justify-center bg-[#34C759] px-2">
              <button type="button" data-swipe-advance class="px-1 text-center text-[10px] font-bold leading-tight text-white">
                Move to Next Stage
              </button>
            </div>`
          : ""
      }
      <div class="swipe-content relative rounded-2xl bg-white transition-transform duration-200 ease-out will-change-transform">
        ${LeadCard(lead, { compact })}
      </div>
    </div>
  `;
}

export function bindSwipeableRows(root, { onAdvanceStage, onOpenLead, leads = [] } = {}) {
  root.querySelectorAll("[data-swipe-row]").forEach((row) => {
    if (row.dataset.swipeBound === "true") {
      return;
    }

    row.dataset.swipeBound = "true";
    const content = row.querySelector(".swipe-content");
    const enabled = row.dataset.swipeEnabled === "true";
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let dragging = false;
    let moved = false;
    let axisLock = null;

    const setTranslate = (x) => {
      currentX = Math.max(0, Math.min(REVEAL_WIDTH, x));
      content.style.transform = `translateX(${currentX}px)`;
    };

    const snap = (open) => {
      setTranslate(open ? REVEAL_WIDTH : 0);
    };

    const closeOthers = () => {
      root.querySelectorAll("[data-swipe-row]").forEach((other) => {
        if (other === row) {
          return;
        }

        const otherContent = other.querySelector(".swipe-content");
        if (otherContent) {
          otherContent.style.transform = "translateX(0)";
        }
      });
    };

    const onPointerDown = (event) => {
      if (!enabled) {
        return;
      }

      dragging = true;
      moved = false;
      axisLock = null;
      startX = event.clientX - currentX;
      startY = event.clientY;
      content.setPointerCapture?.(event.pointerId);
    };

    const onPointerMove = (event) => {
      if (!dragging || !enabled) {
        return;
      }

      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;

      if (!axisLock) {
        if (Math.abs(deltaX) < 6 && Math.abs(deltaY) < 6) {
          return;
        }

        axisLock = Math.abs(deltaX) > Math.abs(deltaY) ? "x" : "y";
      }

      if (axisLock !== "x") {
        dragging = false;
        return;
      }

      event.preventDefault();
      if (Math.abs(deltaX) > 6) {
        moved = true;
        closeOthers();
      }

      setTranslate(deltaX);
    };

    const onPointerUp = () => {
      if (!dragging) {
        return;
      }

      dragging = false;
      snap(currentX >= SNAP_THRESHOLD);
    };

    content.addEventListener("pointerdown", onPointerDown);
    content.addEventListener("pointermove", onPointerMove);
    content.addEventListener("pointerup", onPointerUp);
    content.addEventListener("pointercancel", onPointerUp);

    row.querySelector("[data-swipe-advance]")?.addEventListener("click", (event) => {
      event.stopPropagation();
      const leadId = row.dataset.leadId;
      const nextStage = row.dataset.nextStage;
      if (leadId && nextStage) {
        onAdvanceStage?.(leadId, nextStage);
      }
      snap(false);
    });

    row.querySelector(".lead-card")?.addEventListener("click", (event) => {
      if (moved) {
        moved = false;
        return;
      }

      if (event.target.closest(".quick-action")) {
        return;
      }

      const lead = leads.find((item) => item.ID === row.dataset.leadId);
      if (lead) {
        onOpenLead?.(lead);
      }
    });
  });
}

export function resetSwipeableRows(root) {
  root.querySelectorAll("[data-swipe-row] .swipe-content").forEach((content) => {
    content.style.transform = "translateX(0)";
  });
}
