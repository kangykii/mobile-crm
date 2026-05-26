import { getPendingFollowUps, getRecentActivity } from "../core/utils/ActivityFeed.js";
import { filterLeadsForUser } from "../core/selectors/leadOwnership.js";
import { getHomeDashboard } from "../core/selectors/homeDashboard.js";
import { getLeadsList } from "../core/selectors/leadsQuery.js";
import { addNote, advanceStage, createLead, updateLeadFields } from "../core/services/LeadService.js";
import { getNextStage } from "../core/utils/UrgencyDetector.js";

export class LeadStore {
  #listeners = new Set();

  constructor({ repository, notifier, syncManager } = {}) {
    this.repository = repository;
    this.notifier = notifier;
    this.syncManager = syncManager;
    this.leads = [];
    this.hydrationState = "idle";
    this.hydrationError = null;
    this.userEmail = "";
  }

  subscribe(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  #emit() {
    this.#listeners.forEach((listener) => listener(this));
  }

  #setUserEmail(tokenManager) {
    this.userEmail = tokenManager?.getUserInfo?.()?.email?.trim() || "";
  }

  #filterForCurrentUser(leads) {
    return filterLeadsForUser(leads, this.userEmail);
  }

  async #replaceLeads(leads, leadCache) {
    const ownedLeads = this.#filterForCurrentUser(leads);
    await this.repository.replaceAll(ownedLeads);
    this.leads = await this.repository.listLeads();

    if (leadCache) {
      await leadCache.save(this.leads);
    }

    return this.leads;
  }

  async hydrate({ adapter, settings, tokenManager, leadCache, syncManager } = {}) {
    this.hydrationState = "loading";
    this.hydrationError = null;
    this.#setUserEmail(tokenManager);
    this.#emit();

    const signedIn = tokenManager?.isSignedIn?.() || false;
    const provider = tokenManager?.getProvider?.() || "google";
    const backendConfigured = signedIn && settings?.hasBackendConfigured(provider);

    try {
      if (!backendConfigured) {
        await this.repository.replaceAll([]);
        this.hydrationState = "ready";
      } else if (!navigator.onLine) {
        const loadedCache = await this.#loadFromCache(leadCache);
        this.hydrationState = loadedCache ? "cached" : "ready";
      } else {
        const activeSyncManager = syncManager || this.syncManager;
        const remoteLeads = await activeSyncManager?.syncCycle();

        if (Array.isArray(remoteLeads)) {
          await this.#replaceLeads(remoteLeads, leadCache);
          this.hydrationState = "ready";
        } else {
          const loadedCache = await this.#loadFromCache(leadCache);
          this.hydrationState = loadedCache ? "cached" : "ready";
        }
      }
    } catch (error) {
      this.hydrationError = error.message || "Could not load leads from your backend.";
      const loadedCache = await this.#loadFromCache(leadCache);
      this.hydrationState = loadedCache ? "cached" : "error";

      if (!loadedCache) {
        await this.repository.replaceAll([]);
      }
    }

    this.leads = await this.repository.listLeads();
    this.#emit();
  }

  async reloadFromRemote({ adapter, leadCache, syncManager, tokenManager } = {}) {
    const activeSyncManager = syncManager || this.syncManager;
    const activeAdapter = adapter || activeSyncManager?.adapter;

    if (tokenManager) {
      this.#setUserEmail(tokenManager);
    }

    if (!activeAdapter || !navigator.onLine) {
      return this.leads;
    }

    this.hydrationState = "loading";
    this.hydrationError = null;
    this.#emit();

    try {
      await activeSyncManager?.flushQueue();
      const remoteLeads = await activeAdapter.fetchLeads();
      await this.#replaceLeads(remoteLeads, leadCache);
      this.hydrationState = "ready";
    } catch (error) {
      this.hydrationError = error.message || "Could not reload leads.";
      const loadedCache = await this.#loadFromCache(leadCache);
      this.hydrationState = loadedCache ? "cached" : "error";
    }

    this.leads = await this.repository.listLeads();
    this.#emit();
    return this.leads;
  }

  async applyRemoteLeads(leads = [], leadCache) {
    await this.#replaceLeads(leads, leadCache);
    this.#emit();
    return this.leads;
  }

  async #loadFromCache(leadCache) {
    if (!leadCache) {
      await this.repository.replaceAll([]);
      return false;
    }

    const snapshot = await leadCache.load();
    if (!snapshot?.leads) {
      await this.repository.replaceAll([]);
      return false;
    }

    await this.repository.replaceAll(snapshot.leads);
    return true;
  }

  async #persistLocal(lead) {
    await this.repository.saveLead(lead);
    this.leads = await this.repository.listLeads();
    this.#emit();
    return lead;
  }

  async #removeLocal(id) {
    await this.repository.deleteLead(id);
    this.leads = await this.repository.listLeads();
    this.#emit();
  }

  getLeads() {
    return this.leads;
  }

  getLead(id) {
    return this.leads.find((lead) => lead.ID === id) || null;
  }

  getHomeDashboard() {
    return getHomeDashboard(this.leads);
  }

  getLeadsList(options) {
    return getLeadsList(this.leads, options);
  }

  getTimelineFeed() {
    return {
      followUps: getPendingFollowUps(this.leads),
      activity: getRecentActivity(this.leads),
    };
  }

  async createLead(input) {
    const lead = createLead({ ...input, ownerEmail: this.userEmail });
    await this.#persistLocal(lead);
    await this.syncManager?.queueOrSync("addLead", { lead });
    return lead;
  }

  async updateLead(id, patch) {
    const lead = this.getLead(id);
    if (!lead) {
      return null;
    }

    const nextLead = updateLeadFields(lead, patch);
    await this.#persistLocal(nextLead);
    await this.syncManager?.queueOrSync("updateLead", { lead: nextLead });
    return nextLead;
  }

  async addNote(id, { type, text }) {
    const lead = this.getLead(id);
    if (!lead) {
      return null;
    }

    const nextLead = addNote(lead, { type, text });
    await this.#persistLocal(nextLead);
    await this.syncManager?.queueOrSync("appendTimelineEntry", { lead: nextLead });
    return nextLead;
  }

  async advanceStage(id, stage) {
    const lead = this.getLead(id);
    if (!lead) {
      return null;
    }

    const nextStage = stage || getNextStage(lead.Stage);
    if (!nextStage) {
      return lead;
    }

    const nextLead = advanceStage(lead, nextStage);
    await this.#persistLocal(nextLead);
    await this.syncManager?.queueOrSync("updateLead", { lead: nextLead });
    this.notifier?.show(`Moved lead to ${nextStage}.`, "success");
    return nextLead;
  }

  async deleteLead(id) {
    const lead = this.getLead(id);
    if (!lead) {
      return null;
    }

    await this.#removeLocal(id);
    await this.syncManager?.queueOrSync("deleteLead", { id });
    return lead;
  }
}
