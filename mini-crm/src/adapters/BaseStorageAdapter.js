export class BaseStorageAdapter {
  async connect() {
    throw new Error("connect() must be implemented by a storage adapter.");
  }

  async fetchLeads() {
    throw new Error("fetchLeads() must be implemented by a storage adapter.");
  }

  async addLead() {
    throw new Error("addLead() must be implemented by a storage adapter.");
  }

  async updateLead() {
    throw new Error("updateLead() must be implemented by a storage adapter.");
  }

  async deleteLead() {
    throw new Error("deleteLead() must be implemented by a storage adapter.");
  }

  async appendTimelineEntry() {
    throw new Error("appendTimelineEntry() must be implemented by a storage adapter.");
  }
}
