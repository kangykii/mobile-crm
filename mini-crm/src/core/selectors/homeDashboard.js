import { isOpenLead, STAGES } from "../domain/lead.js";

export function getHomeDashboard(leads) {
  const openLeads = leads.filter(isOpenLead);
  const totalPipeline = openLeads.reduce((sum, lead) => sum + Number(lead.Value || 0), 0);
  const hotLead = openLeads.find((lead) => lead.Stage === "Proposal") || openLeads[0] || null;

  return {
    totalPipeline,
    openLeadCount: openLeads.length,
    stageCount: STAGES.length,
    wonCount: leads.filter((lead) => lead.Stage === "Won").length,
    staleCount: leads.filter((lead) => ["New", "Proposal"].includes(lead.Stage)).length,
    hotLead,
  };
}
