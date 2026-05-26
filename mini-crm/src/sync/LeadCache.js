const CACHE_KEY = "crm_leads_cache";

export class LeadCache {
  async save(leads) {
    await idbKeyval.set(CACHE_KEY, {
      leads,
      cachedAt: new Date().toISOString(),
    });
  }

  async load() {
    const snapshot = await idbKeyval.get(CACHE_KEY);
    if (!snapshot?.leads) {
      return null;
    }

    return snapshot;
  }

  async clear() {
    await idbKeyval.del(CACHE_KEY);
  }
}
