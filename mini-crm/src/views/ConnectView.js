import { GoogleClientSecretField } from "../components/GoogleClientSecretField.js";
import { OAuthDiagnostics } from "../components/OAuthDiagnostics.js";
import { OAuthQuickSetup, bindOAuthSetupPanel } from "../components/OAuthSetupPanel.js";
import { saveOAuthCredentialsFromRoot } from "../utils/saveOAuthCredentials.js";
import { SyncHowItWorks, SyncInstructions, bindSyncInstructions } from "../components/SyncInstructions.js";

export class ConnectView {
  constructor({ settings, tokenManager, notifier, onConnected }) {
    this.settings = settings;
    this.tokenManager = tokenManager;
    this.notifier = notifier;
    this.onConnected = onConnected;
  }

  render() {
    const googleClientId = this.settings.getGoogleClientId();
    const googleClientSecret = this.settings.getGoogleClientSecret();
    const microsoftClientId = this.settings.getMicrosoftClientId();

    return `
      <main class="view-enter flex min-h-[70vh] flex-col justify-center px-5 pb-32 pt-8 lg:mx-auto lg:max-w-2xl lg:px-8 lg:pb-8">
        <section class="rounded-2xl bg-white p-6">
          <div class="text-center">
            <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF5FE]">
              <svg class="h-8 w-8 text-[#0176D3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path d="M12 8v4l3 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"></path>
              </svg>
            </div>
            <h2 class="font-sans text-2xl font-extrabold tracking-tight text-[#181818]">Connect your backend</h2>
            <p class="mt-2 text-sm leading-6 text-[#706E6B]">
              Choose Google Sheets or OneDrive Excel. Each teammate signs in with their own account and only sees their own leads.
            </p>
          </div>

          <form class="mt-6 space-y-4" data-connect-form="google">
            ${OAuthQuickSetup({ provider: "google" })}
            <label class="block">
              <span class="text-sm font-semibold text-[#706E6B]">Google Client ID</span>
              <input
                class="mt-2 w-full rounded-xl border border-[rgba(60,60,67,0.12)] bg-[#F2F2F7] px-4 py-3 text-sm font-semibold text-[#181818] outline-none placeholder:text-[#969492] focus:border-[#0176D3] focus:ring-2 focus:ring-[#0176D3]/20"
                name="googleClientId"
                value="${googleClientId}"
                placeholder="Paste Google OAuth Client ID"
                autocomplete="off"
              />
            </label>
            ${GoogleClientSecretField({ value: googleClientSecret })}
            <button
              type="submit"
              class="w-full rounded-xl bg-[#0176D3] px-4 py-4 text-sm font-bold text-white transition hover:bg-[#014486]"
            >
              Connect Google Sheets
            </button>
            <details class="group">
              <summary class="cursor-pointer text-xs font-bold text-[#0176D3] marker:content-none [&::-webkit-details-marker]:hidden">
                <span class="inline-flex items-center gap-1">Sheet &amp; sync details <span class="text-[#969492] group-open:rotate-180">▾</span></span>
              </summary>
              <div class="mt-2">${SyncInstructions({ provider: "google", compact: true })}</div>
            </details>
          </form>

          <div class="my-5 flex items-center gap-3">
            <span class="h-px flex-1 bg-[rgba(60,60,67,0.12)]"></span>
            <span class="text-xs font-bold uppercase tracking-wide text-[#969492]">or</span>
            <span class="h-px flex-1 bg-[rgba(60,60,67,0.12)]"></span>
          </div>

          <form class="space-y-4" data-connect-form="microsoft">
            ${OAuthQuickSetup({ provider: "microsoft" })}
            <label class="block">
              <span class="text-sm font-semibold text-[#706E6B]">Microsoft Client ID</span>
              <input
                class="mt-2 w-full rounded-xl border border-[rgba(60,60,67,0.12)] bg-[#F2F2F7] px-4 py-3 text-sm font-semibold text-[#181818] outline-none placeholder:text-[#969492] focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/20"
                name="microsoftClientId"
                value="${microsoftClientId}"
                placeholder="Paste Microsoft OAuth Client ID"
                autocomplete="off"
              />
            </label>
            <button
              type="submit"
              class="w-full rounded-xl bg-[#0A66C2] px-4 py-4 text-sm font-bold text-white transition hover:bg-[#004182]"
            >
              Connect Microsoft / OneDrive
            </button>
            <details class="group">
              <summary class="cursor-pointer text-xs font-bold text-[#0A66C2] marker:content-none [&::-webkit-details-marker]:hidden">
                <span class="inline-flex items-center gap-1">Sync details <span class="text-[#969492] group-open:rotate-180">▾</span></span>
              </summary>
              <div class="mt-2">${SyncInstructions({ provider: "microsoft", compact: true })}</div>
            </details>
          </form>

          ${OAuthDiagnostics({ settings: this.settings, tokenManager: this.tokenManager })}
          ${SyncHowItWorks()}
        </section>
      </main>
    `;
  }

  bind(root) {
    bindOAuthSetupPanel(root, { notifier: this.notifier });
    bindSyncInstructions(root, { notifier: this.notifier });

    root.querySelector('[data-connect-form="google"]')?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const googleClientId = String(formData.get("googleClientId") || "").trim();
      const googleClientSecret = String(formData.get("googleClientSecret") || "").trim();

      if (!googleClientId) {
        this.notifier?.show("Add your Google Client ID first.", "error");
        return;
      }

      this.settings.saveCredentials({ googleClientId, googleClientSecret });

      try {
        await this.tokenManager.signIn("google");
      } catch (error) {
        this.notifier?.show(error.message || "Could not start Google sign-in.", "error");
      }
    });

    root.querySelector('[data-connect-form="microsoft"]')?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const microsoftClientId = String(formData.get("microsoftClientId") || "").trim();

      if (!microsoftClientId) {
        this.notifier?.show("Add your Microsoft Client ID first.", "error");
        return;
      }

      this.settings.saveCredentials({ microsoftClientId });

      try {
        await this.tokenManager.signIn("microsoft");
      } catch (error) {
        this.notifier?.show(error.message || "Could not start Microsoft sign-in.", "error");
      }
    });
  }
}
