export class LeadRepository {
  async listLeads() {
    throw new Error("listLeads() must be implemented by a repository.");
  }

  async getLead() {
    throw new Error("getLead() must be implemented by a repository.");
  }

  async saveLead() {
    throw new Error("saveLead() must be implemented by a repository.");
  }

  async deleteLead() {
    throw new Error("deleteLead() must be implemented by a repository.");
  }
}
