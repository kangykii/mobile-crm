import { formatLoggedTime, getActivityIcon, getActivityTitle } from "../core/utils/ActivityFeed.js";

export function ActivityTimelineItem(activity) {
  const iconPath = getActivityIcon(activity.type);
  const title = getActivityTitle(activity, activity.lead);

  return `
    <button
      type="button"
      class="activity-item relative w-full pb-6 text-left last:pb-0"
      data-activity-item
      data-lead-id="${activity.leadId}"
    >
      <span class="activity-node absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(60,60,67,0.12)] bg-[#E5E5EA]">
        <svg class="h-4 w-4 text-[#0176D3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="${iconPath}"></path>
        </svg>
      </span>
      <div class="pl-12">
        <p class="text-xs font-medium text-[#969492]">${formatLoggedTime(activity.date)}</p>
        <p class="mt-1 text-sm font-bold leading-5 text-[#181818]">${title}</p>
        <p class="mt-1 text-sm leading-6 text-[#706E6B]">${activity.text}</p>
      </div>
    </button>
  `;
}
