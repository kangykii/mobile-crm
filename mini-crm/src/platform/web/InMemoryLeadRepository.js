import { LeadRepository } from "../LeadRepository.js";

export class InMemoryLeadRepository extends LeadRepository {
  constructor(seed = []) {
    super();
    this.leads = seed.map((lead) => ({ ...lead }));
  }

  async listLeads() {
    return this.leads.map((lead) => ({ ...lead }));
  }

  async getLead(id) {
    const lead = this.leads.find((item) => item.ID === id);
    return lead ? { ...lead } : null;
  }

  async saveLead(lead) {
    const index = this.leads.findIndex((item) => item.ID === lead.ID);
    if (index >= 0) {
      this.leads[index] = { ...lead };
    } else {
      this.leads.unshift({ ...lead });
    }

    return { ...lead };
  }

  async deleteLead(id) {
    this.leads = this.leads.filter((item) => item.ID !== id);
  }

  async replaceAll(leads = []) {
    this.leads = leads.map((lead) => ({ ...lead }));
  }
}
