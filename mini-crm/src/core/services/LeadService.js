import { appendTimelineEntry } from "../utils/TimelineParser.js";
import { getNextStage } from "../utils/UrgencyDetector.js";
import { createId } from "../utils/uuid.js";

export function createLead(input, now = new Date()) {
  const timestamp = now.toISOString();

  return {
    ID: createId(),
    Name: input.Name,
    Company: input.Company || "",
    Email: input.Email || "",
    Phone: input.Phone || "",
    Value: Number(input.Value || 0),
    Stage: input.Stage || "New",
    LastContactedAt: timestamp,
    CreatedAt: timestamp,
    NotesTimeline: input.Note
      ? appendTimelineEntry("", { date: timestamp, type: "Note", text: input.Note })
      : "",
    OwnerEmail: input.ownerEmail || "",
  };
}

export function addNote(lead, { type, text }, now = new Date()) {
  const timestamp = now.toISOString();

  return {
    ...lead,
    LastContactedAt: timestamp,
    NotesTimeline: appendTimelineEntry(lead.NotesTimeline, {
      date: timestamp,
      type,
      text,
    }),
  };
}

export function advanceStage(lead, stage, now = new Date()) {
  const nextStage = stage || getNextStage(lead.Stage);
  if (!nextStage) {
    return lead;
  }

  const timestamp = now.toISOString();

  return {
    ...lead,
    Stage: nextStage,
    LastContactedAt: timestamp,
    NotesTimeline: appendTimelineEntry(lead.NotesTimeline, {
      date: timestamp,
      type: "StageChange",
      text: `Moved to ${nextStage}`,
    }),
  };
}

export function updateLeadFields(lead, patch) {
  const nextLead = { ...lead, ...patch };

  if (patch.Value !== undefined) {
    nextLead.Value = Number(patch.Value || 0);
  }

  return nextLead;
}
