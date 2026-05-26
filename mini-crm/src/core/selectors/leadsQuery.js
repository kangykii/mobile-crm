export function getLeadsList(leads, { search = "", stageFilter = "All", sortBy = "lastContact-desc" } = {}) {
  const query = search.trim().toLowerCase();

  const filtered = leads.filter((lead) => {
    const matchesStage = stageFilter === "All" || lead.Stage === stageFilter;
    if (!matchesStage) {
      return false;
    }

    if (!query) {
      return true;
    }

    return [lead.Name, lead.Company, lead.Email, lead.Phone]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query));
  });

  return sortLeads(filtered, sortBy);
}

function sortLeads(leads, sortBy) {
  const sorted = [...leads];

  sorted.sort((a, b) => {
    switch (sortBy) {
      case "lastContact-asc":
        return new Date(a.LastContactedAt).getTime() - new Date(b.LastContactedAt).getTime();
      case "created-desc":
        return new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime();
      case "created-asc":
        return new Date(a.CreatedAt).getTime() - new Date(b.CreatedAt).getTime();
      case "name-asc":
        return a.Name.localeCompare(b.Name);
      case "name-desc":
        return b.Name.localeCompare(a.Name);
      case "value-desc":
        return Number(b.Value || 0) - Number(a.Value || 0);
      case "value-asc":
        return Number(a.Value || 0) - Number(b.Value || 0);
      case "lastContact-desc":
      default:
        return new Date(b.LastContactedAt).getTime() - new Date(a.LastContactedAt).getTime();
    }
  });

  return sorted;
}
