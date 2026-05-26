export const STAGES = ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"];

export const URGENCY_THRESHOLDS = {
  New: 3,
  Contacted: 7,
  Qualified: 10,
  Proposal: 5,
  Won: null,
  Lost: null,
};

export function getLeadStaleDays(lead, now = new Date()) {
  if (!lead.LastContactedAt) {
    return 0;
  }

  const lastContacted = new Date(lead.LastContactedAt);
  if (Number.isNaN(lastContacted.getTime())) {
    return 0;
  }

  return (now.getTime() - lastContacted.getTime()) / (1000 * 60 * 60 * 24);
}

export function getLeadUrgency(lead, now = new Date()) {
  const threshold = URGENCY_THRESHOLDS[lead.Stage];
  if (!threshold) {
    return "none";
  }

  const elapsedDays = getLeadStaleDays(lead, now);
  if (elapsedDays < threshold) {
    return "none";
  }

  if (elapsedDays >= threshold * 1.5) {
    return "alert";
  }

  return "touch";
}

export function isLeadStagnant(lead, now = new Date()) {
  return getLeadUrgency(lead, now) !== "none";
}

export function getNextStage(stage) {
  if (stage === "Won" || stage === "Lost") {
    return null;
  }

  const idx = STAGES.indexOf(stage);
  if (idx < 0) {
    return null;
  }

  const next = STAGES[idx + 1];
  if (!next || next === "Lost") {
    return null;
  }

  return next;
}
