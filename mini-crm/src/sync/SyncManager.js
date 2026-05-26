import { isRetryableSyncError } from "./syncErrors.js";

const ADAPTER_METHODS = {
  addLead: "addLead",
  updateLead: "updateLead",
  deleteLead: "deleteLead",
  appendTimelineEntry: "appendTimelineEntry",
};

export class SyncManager {
  #listeners = new Set();

  constructor({ adapter, offlineQueue, notifier } = {}) {
    this.adapter = adapter;
    this.offlineQueue = offlineQueue;
    this.notifier = notifier;
    this.isOnline = navigator.onLine;
    this.isFlushing = false;
    this.isPulling = false;
    this.lastSyncedAt = null;
    this.lastSyncError = null;
    this.pendingCount = 0;

    window.addEventListener("online", () => {
      this.isOnline = true;
      this.#notifyStatus();
      this.syncCycle().catch((error) => {
        console.warn("Sync cycle failed after reconnect.", error);
      });
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      this.#notifyStatus();
    });

    this.#refreshPendingCount().then(() => {
      this.#notifyStatus();
    });
  }

  subscribe(listener) {
    this.#listeners.add(listener);
    listener(this.getStatus());
    return () => this.#listeners.delete(listener);
  }

  getStatus() {
    return {
      online: this.isOnline,
      flushing: this.isFlushing,
      pulling: this.isPulling,
      pending: this.pendingCount,
      lastSyncedAt: this.lastSyncedAt,
      lastSyncError: this.lastSyncError,
    };
  }

  setAdapter(adapter) {
    this.adapter = adapter;
  }

  async #ensureConnected() {
    if (!this.adapter || typeof this.adapter.connect !== "function") {
      return { connected: true };
    }

    return this.adapter.connect();
  }

  async queueOrSync(operation, payload) {
    if (!this.adapter || !this.offlineQueue) {
      return;
    }

    if (!this.isOnline) {
      await this.offlineQueue.enqueue(operation, payload);
      await this.#refreshPendingCount();
      this.notifier?.show("Saved offline — will sync when online", "info");
      this.#notifyStatus();
      return;
    }

    const connection = await this.#ensureConnected();
    if (connection.connected === false) {
      this.lastSyncError = connection.reason || "Backend not configured.";
      this.notifier?.show(this.lastSyncError, "error");
      this.#notifyStatus();
      return;
    }

    try {
      await this.#applyOperation(operation, payload);
      this.lastSyncedAt = Date.now();
      this.lastSyncError = null;
      this.#emit("synced", { operation, payload });
      this.#notifyStatus();
    } catch (error) {
      const message = error.message || "Sync failed.";
      this.lastSyncError = message;

      if (!isRetryableSyncError(message)) {
        this.notifier?.show(message, "error");
        this.#notifyStatus();
        return;
      }

      await this.offlineQueue.enqueue(operation, payload);
      await this.#refreshPendingCount();
      this.notifier?.show("Saved locally — will retry sync", "info");
      this.#notifyStatus();
      console.warn("Remote sync failed; queued for later.", error);
    }
  }

  async pullRemote() {
    if (!this.isOnline || !this.adapter || typeof this.adapter.fetchLeads !== "function") {
      return null;
    }

    const connection = await this.#ensureConnected();
    if (connection.connected === false) {
      this.lastSyncError = connection.reason || "Backend not configured.";
      this.#notifyStatus();
      return null;
    }

    this.isPulling = true;
    this.#notifyStatus();

    try {
      const leads = await this.adapter.fetchLeads();
      this.lastSyncedAt = Date.now();
      this.lastSyncError = null;
      this.#emit("pulled", { leads });
      return leads;
    } catch (error) {
      this.lastSyncError = error.message || "Could not pull leads.";
      this.notifier?.show(this.lastSyncError, "error");
      return null;
    } finally {
      this.isPulling = false;
      this.#notifyStatus();
    }
  }

  async syncCycle() {
    await this.flushQueue();
    return this.pullRemote();
  }

  async flushQueue() {
    if (!this.isOnline || this.isFlushing || !this.offlineQueue || !this.adapter) {
      return;
    }

    const connection = await this.#ensureConnected();
    if (connection.connected === false) {
      this.lastSyncError = connection.reason || "Backend not configured.";
      this.#notifyStatus();
      return;
    }

    this.isFlushing = true;
    this.#notifyStatus();

    try {
      const entries = await this.offlineQueue.getAll();
      let syncedAny = false;

      for (const entry of entries) {
        try {
          await this.#applyOperation(entry.operation, entry.payload);
          await this.offlineQueue.remove(entry.id);
          syncedAny = true;
          this.#emit("synced", { operation: entry.operation, payload: entry.payload });
        } catch (error) {
          const message = error.message || "Sync failed.";
          this.lastSyncError = message;
          this.#emit("syncError", { entry, error });

          if (!isRetryableSyncError(message)) {
            await this.offlineQueue.remove(entry.id);
            this.notifier?.show(message, "error");
            continue;
          }

          this.notifier?.show(message || "Sync failed. Changes kept in queue.", "error");
          break;
        }
      }

      if (syncedAny) {
        this.lastSyncedAt = Date.now();
        if (this.pendingCount === 0) {
          this.lastSyncError = null;
        }
      }
    } finally {
      this.isFlushing = false;
      await this.#refreshPendingCount();
      this.#notifyStatus();
    }
  }

  async clearQueue() {
    if (!this.offlineQueue) {
      return;
    }

    await this.offlineQueue.clear();
    await this.#refreshPendingCount();
    this.#notifyStatus();
  }

  async #refreshPendingCount() {
    this.pendingCount = this.offlineQueue ? await this.offlineQueue.count() : 0;
  }

  async #applyOperation(operation, payload) {
    const methodName = ADAPTER_METHODS[operation];
    if (!methodName || typeof this.adapter[methodName] !== "function") {
      throw new Error(`Unsupported sync operation: ${operation}`);
    }

    return this.adapter[methodName](payload);
  }

  #emit(event, detail = {}) {
    this.#listeners.forEach((listener) => listener({ event, ...detail, status: this.getStatus() }));
    window.dispatchEvent(new CustomEvent(`mini-crm:sync-${event}`, { detail }));
  }

  #notifyStatus() {
    this.#emit("status");
  }
}
