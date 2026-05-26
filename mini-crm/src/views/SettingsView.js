import { GoogleClientSecretField } from "../components/GoogleClientSecretField.js";
import { OAuthDiagnostics } from "../components/OAuthDiagnostics.js";
import { OAuthQuickSetup, SpreadsheetQuickSetup, bindOAuthSetupPanel } from "../components/OAuthSetupPanel.js";
import { saveOAuthCredentialsFromRoot } from "../utils/saveOAuthCredentials.js";
import { SyncInstructions, bindSyncInstructions } from "../components/SyncInstructions.js";

export class SettingsView {
  constructor({ settings, tokenManager, notifier, syncManager }) {
    this.settings = settings;
    this.tokenManager = tokenManager;
    this.notifier = notifier;
    this.syncManager = syncManager;
  }

  render() {
    const googleClientId = this.settings.getGoogleClientId();
    const googleClientSecret = this.settings.getGoogleClientSecret();
    const microsoftClientId = this.settings.getMicrosoftClientId();
    const spreadsheetId = this.settings.getSpreadsheetId();
    const userCompany = this.settings.getUserCompany();
    const signedIn = this.tokenManager?.isSignedIn() || false;
    const provider = this.tokenManager?.getProvider() || null;
    const user = signedIn ? this.tokenManager.getUserInfo() : null;
    const needsSheetSetup = signedIn && provider === "google" && !this.settings.hasSpreadsheetConfigured();
    const activeProviderLabel = this.providerLabel(provider);

    return `
      <main class="view-enter px-5 pb-32 pt-2 lg:mx-auto lg:max-w-3xl lg:px-8 lg:pb-8">
        <section class="rounded-2xl bg-white p-4">
          <div class="flex items-center gap-3">
            <span class="inline-avatar inline-avatar-lg">${this.initials(user?.name || "U")}</span>
            <div class="min-w-0 flex-1">
              <h2 class="truncate text-xl font-bold text-[#181818]">${user?.name || "Your profile"}</h2>
              <p class="truncate text-sm text-[#706E6B]">${user?.email || "Sign in to sync"}</p>
            </div>
          </div>

          <form class="mt-5 space-y-3 border-t border-[rgba(60,60,67,0.08)] pt-4" data-profile-form>
            ${this.readOnlyField("Name", user?.name || "—")}
            ${this.readOnlyField("Email", user?.email || "—")}
            <label class="block">
              <span class="text-sm font-semibold text-[#706E6B]">Company</span>
              <input
                class="mt-2 w-full rounded-xl border border-[rgba(60,60,67,0.12)] bg-[#F2F2F7] px-4 py-3 text-sm font-semibold text-[#181818] outline-none placeholder:text-[#969492] focus:border-[#0176D3] focus:ring-2 focus:ring-[#0176D3]/20"
                name="userCompany"
                value="${userCompany}"
                placeholder="Your company name"
                autocomplete="organization"
              />
            </label>
            <button type="submit" class="w-full rounded-xl border border-[rgba(60,60,67,0.12)] bg-white px-4 py-3 text-sm font-bold text-[#181818] transition hover:border-[#0176D3]">
              Save profile
            </button>
          </form>

          ${
            signedIn
              ? `<div class="mt-4 rounded-xl bg-[#EAF5FE] px-3 py-2 text-sm font-semibold text-[#0176D3]">
                  Active backend: ${activeProviderLabel}
                </div>`
              : ""
          }

          ${this.providerSection({
            title: "Google Sheets",
            description: signedIn && provider === "google" ? "Connected to Google Sheets." : "Sync leads with Google Sheets.",
            provider: "google",
            activeProvider: provider,
            signedIn,
            user,
            accentClass: "bg-[#EAF5FE] text-[#0176D3]",
            buttonClass: "bg-[#0176D3] hover:bg-[#014486]",
            connectLabel: "Connect Google Sheets",
          })}

          ${this.providerSection({
            title: "Microsoft OneDrive",
            description: signedIn && provider === "microsoft" ? "Connected to SoloCRM.xlsx in OneDrive." : "Sync leads with Excel in OneDrive.",
            provider: "microsoft",
            activeProvider: provider,
            signedIn,
            user,
            accentClass: "bg-[#EEF3FC] text-[#0A66C2]",
            buttonClass: "bg-[#0A66C2] hover:bg-[#004182]",
            connectLabel: "Connect Microsoft / OneDrive",
          })}
        </section>

        ${
          needsSheetSetup
            ? `<section class="mt-4 rounded-2xl border border-[#0176D3]/20 bg-[#EAF5FE] p-4">
                <h3 class="text-base font-bold text-[#181818]">Set up your sheet</h3>
                <p class="mt-1 text-sm leading-6 text-[#706E6B]">Paste your full Google Sheets link or just the Spreadsheet ID.</p>
                ${SpreadsheetQuickSetup()}
                <form class="mt-4 space-y-3" data-spreadsheet-form>
                  <input
                    class="w-full rounded-xl border border-[rgba(60,60,67,0.12)] bg-white px-4 py-3 text-sm font-semibold text-[#181818] outline-none placeholder:text-[#969492] focus:border-[#0176D3] focus:ring-2 focus:ring-[#0176D3]/20"
                    name="spreadsheetId"
                    value="${spreadsheetId}"
                    placeholder="https://docs.google.com/spreadsheets/d/…/edit or Spreadsheet ID"
                    autocomplete="off"
                  />
                  <button type="submit" class="w-full rounded-xl bg-[#0176D3] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#014486]">Save Spreadsheet</button>
                </form>
              </section>`
            : ""
        }

        ${OAuthDiagnostics({ settings: this.settings, tokenManager: this.tokenManager })}

        <form class="mt-4 space-y-4 rounded-2xl bg-white p-4" data-settings-form>
          ${this.clientField("Google Client ID", "googleClientId", googleClientId, "Used for Google Sheets OAuth")}
          ${GoogleClientSecretField({ value: googleClientSecret })}
          ${this.clientField("Microsoft Client ID", "microsoftClientId", microsoftClientId, "Used for OneDrive Excel OAuth")}
          ${
            signedIn && provider === "google"
              ? this.clientField("Spreadsheet ID", "spreadsheetId", spreadsheetId, "The ID from docs.google.com/spreadsheets/d/…/edit")
              : ""
          }
          <button class="w-full rounded-xl bg-[#0176D3] px-4 py-4 text-sm font-bold text-white transition hover:bg-[#014486]" type="submit">Save Settings</button>
        </form>

        <section class="mt-4 rounded-2xl bg-white p-4">
          <h3 class="text-sm font-bold text-[#181818]">Sync</h3>
          <p class="mt-1 text-xs leading-5 text-[#706E6B]">If changes stay pending, fix the issue below then tap Retry sync.</p>
          <div class="mt-3 grid gap-2 sm:grid-cols-2">
            <button type="button" data-sync-retry class="rounded-xl bg-[#0176D3] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#014486]">
              Retry sync
            </button>
            <button type="button" data-sync-clear-queue class="rounded-xl border border-[rgba(60,60,67,0.12)] bg-white px-4 py-3 text-sm font-bold text-[#181818] transition hover:border-[#BA0517] hover:text-[#BA0517]">
              Clear pending queue
            </button>
          </div>
        </section>

        <section class="mt-4 rounded-2xl bg-white p-4">
          <div class="flex items-center justify-between text-sm">
            <span class="text-[#706E6B]">App Version</span>
            <span class="font-bold text-[#181818]">0.1.0-static</span>
          </div>
        </section>
      </main>
    `;
  }

  providerSection({ title, description, provider, activeProvider, signedIn, user, accentClass, buttonClass, connectLabel }) {
    const isActive = signedIn && activeProvider === provider;
    const canSwitch = signedIn && activeProvider && activeProvider !== provider;

    return `
      <div class="mt-5 border-t border-[rgba(60,60,67,0.08)] pt-4">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h3 class="text-base font-bold text-[#181818]">${title}</h3>
            <p class="mt-1 text-sm text-[#706E6B]">${description}</p>
          </div>
          ${
            isActive
              ? `<span class="inline-flex items-center gap-1 rounded-full ${accentClass} px-3 py-1.5 text-xs font-black">Active</span>`
              : `<span class="inline-flex items-center gap-1 rounded-full bg-[#FFF8E6] px-3 py-1.5 text-xs font-black text-[#8C4B02]">Inactive</span>`
          }
        </div>

        <div class="mt-4">
          ${!isActive && !canSwitch ? `${OAuthQuickSetup({ provider })}${provider === "google" ? GoogleClientSecretField({ value: this.settings.getGoogleClientSecret() }) : ""}` : ""}
          ${
            isActive
              ? `<div class="flex items-center gap-3 rounded-xl bg-[#F2F2F7] p-3">
                  <span class="inline-avatar inline-avatar-lg">${this.initials(user?.name || title[0])}</span>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-bold text-[#181818]">${user?.name || title}</p>
                    <p class="truncate text-xs text-[#706E6B]">${user?.email || ""}</p>
                  </div>
                </div>
                <button type="button" data-provider-disconnect class="mt-3 w-full rounded-xl border border-[rgba(60,60,67,0.12)] bg-white px-4 py-3 text-sm font-bold text-[#181818] transition hover:border-[#0176D3]">Disconnect</button>`
              : canSwitch
                ? `<button type="button" data-switch-provider="${provider}" class="w-full rounded-xl border border-[rgba(60,60,67,0.12)] bg-white px-4 py-3 text-sm font-bold text-[#181818] transition hover:border-[#0176D3]">
                    Switch to ${this.providerLabel(provider)}
                  </button>`
                : `<button type="button" data-provider-connect="${provider}" class="w-full rounded-xl ${buttonClass} px-4 py-3 text-sm font-bold text-white transition">
                    ${connectLabel}
                  </button>`
          }
          <details class="mt-3 group">
            <summary class="cursor-pointer text-xs font-bold text-[#0176D3] marker:content-none [&::-webkit-details-marker]:hidden">
              <span class="inline-flex items-center gap-1">Sheet &amp; sync details <span class="text-[#969492] group-open:rotate-180">▾</span></span>
            </summary>
            <div class="mt-2">${SyncInstructions({ provider, compact: true })}</div>
          </details>
        </div>
      </div>
    `;
  }

  bind(root) {
    bindOAuthSetupPanel(root, { notifier: this.notifier });
    bindSyncInstructions(root, { notifier: this.notifier });

    root.querySelector("[data-profile-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      this.settings.saveUserCompany(String(formData.get("userCompany") || ""));
      this.notifier?.show("Profile saved.", "success");
    });

    root.querySelectorAll("[data-provider-connect]").forEach((button) => {
      button.addEventListener("click", async () => {
        await this.connectProvider(button.dataset.providerConnect, root);
      });
    });

    root.querySelectorAll("[data-switch-provider]").forEach((button) => {
      button.addEventListener("click", async () => {
        await this.switchProvider(button.dataset.switchProvider);
      });
    });

    root.querySelector("[data-provider-disconnect]")?.addEventListener("click", async () => {
      await this.tokenManager.signOut();
      this.notifier?.show("Disconnected.", "info");
      window.dispatchEvent(new CustomEvent("mini-crm:auth-changed"));
    });

    root.querySelector("[data-spreadsheet-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      this.settings.saveSpreadsheetId(String(formData.get("spreadsheetId") || ""));
      this.notifier?.show("Spreadsheet saved.", "success");
      window.dispatchEvent(new CustomEvent("mini-crm:auth-changed"));
    });

    root.querySelector("[data-sync-retry]")?.addEventListener("click", () => {
      window.dispatchEvent(new CustomEvent("mini-crm:sync-retry"));
    });

    root.querySelector("[data-sync-clear-queue]")?.addEventListener("click", async () => {
      const confirmed = globalThis.confirm(
        "Clear all pending sync items? Local leads stay in the app but unsynced changes will not be pushed automatically.",
      );
      if (!confirmed) {
        return;
      }

      await this.syncManager?.clearQueue();
      this.notifier?.show("Pending queue cleared.", "info");
      window.dispatchEvent(new CustomEvent("mini-crm:sync-retry"));
    });

    root.querySelector("[data-settings-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      this.settings.saveCredentials({
        googleClientId: String(formData.get("googleClientId") || ""),
        googleClientSecret: String(formData.get("googleClientSecret") || ""),
        microsoftClientId: String(formData.get("microsoftClientId") || ""),
      });

      if (this.tokenManager?.isSignedIn() && this.tokenManager.getProvider() === "google") {
        this.settings.saveSpreadsheetId(String(formData.get("spreadsheetId") || ""));
      }

      this.notifier?.show("Settings saved.", "success");
    });
  }

  readOnlyField(label, value) {
    return `
      <div>
        <span class="text-sm font-semibold text-[#706E6B]">${label}</span>
        <p class="mt-2 rounded-xl border border-[rgba(60,60,67,0.12)] bg-[#F2F2F7] px-4 py-3 text-sm font-semibold text-[#181818]">${value}</p>
      </div>
    `;
  }

  providerLabel(provider) {
    return provider === "microsoft" ? "OneDrive Excel" : "Google Sheets";
  }

  async connectProvider(provider, root = null) {
    if (root) {
      saveOAuthCredentialsFromRoot(root, this.settings);
    }

    if (provider === "google" && !this.settings.getGoogleClientId().trim()) {
      this.notifier?.show("Add your Google Client ID first.", "error");
      return;
    }

    if (provider === "microsoft" && !this.settings.getMicrosoftClientId().trim()) {
      this.notifier?.show("Add your Microsoft Client ID first.", "error");
      return;
    }

    if (provider === "google" && !this.settings.getGoogleClientSecret().trim()) {
      const proceed = globalThis.confirm(
        "No Google client secret is saved. Web OAuth clients need one; Desktop app clients do not.\n\nContinue anyway (Desktop client)?",
      );
      if (!proceed) {
        return;
      }
    }

    try {
      await this.tokenManager.signIn(provider);
    } catch (error) {
      this.notifier?.show(error.message || "Could not start sign-in.", "error");
    }
  }

  async switchProvider(provider) {
    const confirmed = globalThis.confirm(
      "Switching providers will not transfer local data automatically. Continue?",
    );

    if (!confirmed) {
      return;
    }

    await this.tokenManager.signOut();
    window.dispatchEvent(new CustomEvent("mini-crm:auth-changed"));

    await this.connectProvider(provider);
  }

  initials(name) {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }

  clientField(label, name, value, helpText) {
    return `
      <label class="block">
        <span class="text-sm font-semibold text-[#706E6B]">${label}</span>
        <input class="mt-2 w-full rounded-xl border border-[rgba(60,60,67,0.12)] bg-[#F2F2F7] px-4 py-3 text-sm font-semibold text-[#181818] outline-none placeholder:text-[#969492] focus:border-[#0176D3] focus:ring-2 focus:ring-[#0176D3]/20" name="${name}" value="${value}" placeholder="Paste value" autocomplete="off" />
        <span class="mt-2 block text-xs leading-5 text-[#969492]">${helpText}</span>
      </label>
    `;
  }
}
