export function filterLeadsForUser(leads, userEmail) {
  if (!userEmail) {
    return [];
  }

  const normalized = userEmail.trim().toLowerCase();
  return leads.filter((lead) => (lead.OwnerEmail || "").trim().toLowerCase() === normalized);
}
