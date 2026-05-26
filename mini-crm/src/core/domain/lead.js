export { STAGES } from "../utils/UrgencyDetector.js";

export const TERMINAL_STAGES = ["Won", "Lost"];

export function isOpenLead(lead) {
  return !TERMINAL_STAGES.includes(lead.Stage);
}
