import { BottomNav } from "./components/BottomNav.js";
import { ContactDrawer } from "./components/ContactDrawer.js";
import { bindPageHeader, PageHeader } from "./components/PageHeader.js";
import { Toast } from "./components/Toast.js";
import { createStorageAdapter } from "./adapters/AdapterFactory.js";
import { TokenManager } from "./auth/TokenManager.js";
import { initials } from "./core/utils/formatters.js";
import { createWebPlatform } from "./platform/web/createWebPlatform.js";
import { LeadStore } from "./store/LeadStore.js";
import { LeadCache } from "./sync/LeadCache.js";
import { OfflineQueue } from "./sync/OfflineQueue.js";
import { SyncManager } from "./sync/SyncManager.js";
import { AddContactView } from "./views/AddContactView.js";
import { ConnectView } from "./views/ConnectView.js";
import { HomeView } from "./views/HomeView.js";
import { LeadsView } from "./views/LeadsView.js";
import { SettingsView } from "./views/SettingsView.js";
import { TimelineView } from "./views/TimelineView.js";

const appRoot = document.querySelector("#app");
const drawerRoot = document.querySelector("#drawer-root");

const toast = new Toast();
window.toast = toast;

const platform = createWebPlatform({ toast });

const tokenManager = new TokenManager({
  getGoogleClientId: () => platform.settings.getGoogleClientId(),
  getGoogleClientSecret: () => platform.settings.getGoogleClientSecret(),
  getMicrosoftClientId: () => platform.settings.getMicrosoftClientId(),
});

const offlineQueue = new OfflineQueue();
const leadCache = new LeadCache();

function createActiveAdapter() {
  const provider = tokenManager.getProvider() || "google";
  return createStorageAdapter(provider, {
    tokenManager,
    getSpreadsheetId: () => platform.settings.getSpreadsheetId(),
  });
}

let storageAdapter = createActiveAdapter();

const syncManager = new SyncManager({
  adapter: storageAdapter,
  offlineQueue,
  notifier: platform.notifier,
});

function refreshActiveAdapter() {
  storageAdapter = createActiveAdapter();
  syncManager.setAdapter(storageAdapter);
}

function getHydrateOptions() {
  return {
    adapter: storageAdapter,
    settings: platform.settings,
    tokenManager,
    leadCache,
    syncManager,
  };
}

const store = new LeadStore({
  repository: platform.repository,
  notifier: platform.notifier,
  syncManager,
});

class MiniCrmApp {
  constructor(root, drawerMount) {
    this.root = root;
    this.store = store;
    this.settings = platform.settings;
    this.notifier = platform.notifier;
    this.tokenManager = tokenManager;
    this.syncManager = syncManager;
    this.syncStatus = syncManager.getStatus();
    this.activeView = "home";
    this.authReady = false;
    this.signedIn = false;
    this.nav = new BottomNav((view) => this.navigate(view));
    this.drawer = new ContactDrawer(drawerMount, {
      store: this.store,
      notifier: this.notifier,
    });

    window.addEventListener("mini-crm:navigate", (event) => this.navigate(event.detail));
    window.addEventListener("hashchange", () => this.navigate(location.hash.replace("#", "") || "home", false));
    window.addEventListener("mini-crm:auth-changed", () => {
      this.handleAuthChanged();
    });
    window.addEventListener("mini-crm:sync-pulled", (event) => {
      this.handleRemotePull(event.detail?.leads);
    });
    window.addEventListener("mini-crm:sync-retry", () => {
      this.retrySync();
    });
    this.store.subscribe(() => {
      if (this.signedIn) {
        this.render();
      }
    });
    this.unsubscribeSync = this.syncManager.subscribe(async ({ event, leads, status }) => {
      this.syncStatus = status || this.syncManager.getStatus();

      if (event === "pulled" && this.signedIn && this.store.hydrationState !== "loading") {
        await this.handleRemotePull(leads);
        return;
      }

      if (this.signedIn) {
        this.render();
      }
    });
  }

  async retrySync() {
    if (!this.signedIn) {
      return;
    }

    try {
      refreshActiveAdapter();
      const leads = await this.syncManager.syncCycle();
      if (Array.isArray(leads)) {
        await this.handleRemotePull(leads);
      }
      const status = this.syncManager.getStatus();
      if (status.pending === 0 && !status.lastSyncError) {
        this.notifier.show("Sync complete.", "success");
      } else if (status.lastSyncError) {
        this.notifier.show(status.lastSyncError, "error");
      }
      this.render();
    } catch (error) {
      this.notifier.show(error.message || "Sync failed.", "error");
      this.render();
    }
  }

  async handleRemotePull(leads) {
    if (!this.signedIn || !Array.isArray(leads)) {
      return;
    }

    this.store.userEmail = this.tokenManager.getUserInfo()?.email?.trim() || this.store.userEmail;
    await this.store.applyRemoteLeads(leads, leadCache);
    this.render();
  }

  async handleAuthChanged() {
    this.signedIn = this.tokenManager.isSignedIn();
    if (!this.signedIn) {
      this.navigate("connect", true);
      return;
    }

    refreshActiveAdapter();
    await this.store.hydrate(getHydrateOptions());
    this.render();
  }

  async start() {
    try {
      const completedAuth = await this.tokenManager.handleRedirectCallback();
      if (completedAuth) {
        refreshActiveAdapter();
        const provider = this.tokenManager.getProvider();
        const label = provider === "microsoft" ? "Microsoft" : "Google";
        this.notifier.show(`Connected to ${label}`, "success");
      }
    } catch (error) {
      this.notifier.show(error.message || "Sign-in failed.", "error");
    }

    this.signedIn = this.tokenManager.isSignedIn();
    if (this.signedIn) {
      refreshActiveAdapter();
      await this.store.hydrate(getHydrateOptions());
    }

    this.authReady = true;

    const hashView = location.hash.replace("#", "");
    this.navigate(this.signedIn ? hashView || "home" : "connect", false);
  }

  navigate(view, updateHash = true) {
    if (view === "pipeline") {
      view = "timeline";
    }

    if (!this.signedIn) {
      this.activeView = "connect";
      if (updateHash) {
        history.replaceState(null, "", `#connect`);
      }
      this.render();
      return;
    }

    this.activeView = ["home", "leads", "timeline", "add", "profile"].includes(view) ? view : "home";
    if (updateHash) {
      history.replaceState(null, "", `#${this.activeView}`);
    }
    this.render();
  }

  pageTitle() {
    if (!this.signedIn) {
      return "Connect";
    }

    const titles = {
      home: "Home",
      leads: "Leads",
      timeline: "Timeline",
      profile: "Settings",
      add: "Add Lead",
    };

    return titles[this.activeView] || "Home";
  }

  profileInitials() {
    const name = this.tokenManager.getUserInfo()?.name || "";
    return initials(name) || "?";
  }

  render() {
    if (!this.authReady || (this.signedIn && this.store.hydrationState === "loading")) {
      this.root.innerHTML = `
        <div class="app-frame mx-auto flex min-h-screen w-full max-w-[430px] items-center justify-center bg-[#F2F2F7] px-5 lg:max-w-7xl">
          <p class="text-sm font-semibold text-[#706E6B]">Loading Mini CRM…</p>
        </div>
      `;
      return;
    }

    const view = this.createView();
    const showNav = this.signedIn && this.activeView !== "add";

    this.root.innerHTML = `
      <div class="app-frame mx-auto min-h-screen w-full max-w-[430px] bg-[#F2F2F7] lg:max-w-7xl lg:px-6">
        <div class="lg:flex lg:min-h-screen lg:gap-6">
          ${showNav ? this.nav.renderSidebar(this.activeView) : ""}
          <div class="app-content min-w-0 flex-1">
            ${PageHeader({
              title: this.pageTitle(),
              profileActive: this.activeView === "profile",
              showBack: this.activeView === "add",
              syncStatus: this.signedIn ? this.syncStatus : null,
              profileInitials: this.signedIn ? this.profileInitials() : "?",
            })}
            <div id="view-root">${view.render()}</div>
            ${showNav ? this.nav.renderMobile(this.activeView) : ""}
          </div>
        </div>
      </div>
    `;

    bindPageHeader(this.root, {
      onProfile: () => this.navigate("profile"),
      onBack: () => this.navigate("home"),
      onSyncRetry: () => this.retrySync(),
    });

    view.bind?.(this.root);
    if (showNav) {
      this.nav.bind(this.root);
    }
  }

  createView() {
    if (!this.signedIn) {
      return new ConnectView({
        settings: this.settings,
        tokenManager: this.tokenManager,
        notifier: this.notifier,
        onConnected: () => {
          this.signedIn = true;
          refreshActiveAdapter();
          this.navigate("home");
        },
      });
    }

    if (this.activeView === "timeline") {
      return new TimelineView({
        store: this.store,
        onOpenLead: (lead) => this.drawer.open(lead),
      });
    }

    if (this.activeView === "add") {
      return new AddContactView({
        store: this.store,
        notifier: this.notifier,
        onCreated: () => this.navigate("leads"),
      });
    }

    if (this.activeView === "profile") {
      return new SettingsView({
        settings: this.settings,
        tokenManager: this.tokenManager,
        notifier: this.notifier,
        syncManager: this.syncManager,
      });
    }

    if (this.activeView === "home") {
      return new HomeView({
        store: this.store,
        onOpenLead: (lead) => this.drawer.open(lead),
      });
    }

    return new LeadsView({
      store: this.store,
      onOpenLead: (lead) => this.drawer.open(lead),
    });
  }
}

const app = new MiniCrmApp(appRoot, drawerRoot);
app.start();
