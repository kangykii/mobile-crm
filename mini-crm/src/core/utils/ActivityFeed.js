import { parseTimeline } from "./TimelineParser.js";
import { getLeadStaleDays, getLeadUrgency } from "./UrgencyDetector.js";

const ACTIVITY_ICONS = {
  Call: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.77.63 2.6a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.48-1.2a2 2 0 0 1 2.11-.45c.83.3 1.7.51 2.6.63A2 2 0 0 1 22 16.92Z",
  Email: "M4 6h16v12H4V6Zm0 1 8 6 8-6",
  SMS: "M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z",
  Meeting: "M6 3v2M18 3v2M4 8h16M6 6h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z",
  Note: "M8 6h8M8 10h8M8 14h5M6 4h12a2 2 0 0 1 2 2v12l-3-2-3 2-3-2-3 2V6a2 2 0 0 1 2-2Z",
  StageChange: "M5 7h4v12H5V7Zm5-3h4v15h-4V4Zm5 6h4v9h-4v-9Z",
};

const ACTIVITY_TITLES = {
  Call: "Outbound phone call with",
  Email: "Email with",
  SMS: "Text message with",
  Meeting: "Meeting with",
  Note: "Note logged for",
  StageChange: "Stage update for",
};

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

const dayFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
});

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatLoggedTime(dateValue, now = new Date()) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return "Logged recently";
  }

  const time = timeFormatter.format(date);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (isSameDay(date, now)) {
    return `Logged ${time} Today`;
  }

  if (isSameDay(date, yesterday)) {
    return `Logged ${time} Yesterday`;
  }

  return `Logged ${time} ${dayFormatter.format(date)}`;
}

export function getActivityIcon(type) {
  return ACTIVITY_ICONS[type] || ACTIVITY_ICONS.Note;
}

export function getActivityTitle(event, lead) {
  const prefix = ACTIVITY_TITLES[event.type] || "Activity with";
  return `${prefix} ${lead.Name} (${lead.Company})`;
}

export function getPendingFollowUps(leads, now = new Date()) {
  return leads
    .filter((lead) => !["Won", "Lost"].includes(lead.Stage))
    .map((lead) => {
      const urgency = getLeadUrgency(lead, now);
      if (urgency === "none") {
        return null;
      }

      const staleDays = Math.max(1, Math.round(getLeadStaleDays(lead, now)));
      const subtitle =
        urgency === "alert" ? `${staleDays} days overdue` : `${staleDays} days since last touch`;

      return {
        lead,
        urgency,
        staleDays,
        title: `Follow up with ${lead.Name} (${lead.Company})`,
        subtitle,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.urgency !== b.urgency) {
        return a.urgency === "alert" ? -1 : 1;
      }

      return b.staleDays - a.staleDays;
    });
}

export function getRecentActivity(leads, limit = 20) {
  const items = leads.flatMap((lead) =>
    parseTimeline(lead.NotesTimeline).map((event) => ({
      ...event,
      leadId: lead.ID,
      leadName: lead.Name,
      leadCompany: lead.Company,
      lead,
    })),
  );

  return items
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}
