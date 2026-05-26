const ENTRY_DELIMITER = " || ";
const ENTRY_PATTERN = /^\[(?<date>[^\]|]+)\|(?<type>[^\]]+)\]:\s?(?<text>.*)$/;

export const EVENT_TYPES = ["Call", "Email", "SMS", "Meeting", "Note", "StageChange"];

export function parseTimeline(value = "") {
  if (!value.trim()) {
    return [];
  }

  return value
    .split(ENTRY_DELIMITER)
    .map((entry) => {
      const match = entry.match(ENTRY_PATTERN);
      if (!match?.groups) {
        return null;
      }

      return {
        date: match.groups.date,
        type: match.groups.type,
        text: match.groups.text,
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function formatTimelineEntry({ date, type, text }) {
  return `[${date}|${type}]: ${text}`;
}

export function appendTimelineEntry(timeline, entry) {
  const nextEntry = formatTimelineEntry(entry);
  return timeline?.trim() ? `${timeline}${ENTRY_DELIMITER}${nextEntry}` : nextEntry;
}
