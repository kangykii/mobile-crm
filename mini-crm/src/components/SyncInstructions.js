import {
  COLUMN_FIELDS,
  LEADS_HEADER_ROW_TSV,
  LEADS_SHEET_NAME,
} from "../adapters/columnMap.js";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function googleSheetSetupBlock() {
  const columnsList = COLUMN_FIELDS.map((name) => `<li><code class="rounded bg-white/80 px-1 py-0.5 text-[10px] font-semibold text-[#181818]">${name}</code></li>`).join("");

  return `
    <div class="mt-4 rounded-xl border border-[#0176D3]/15 bg-white/60 p-3">
      <p class="text-xs font-bold text-[#181818]">Sheet setup (copy &amp; paste)</p>
      <ol class="mt-2 space-y-2 text-xs leading-5 text-[#706E6B]">
        <li>Create a new Google Sheet (or open an existing one).</li>
        <li>
          Rename the bottom tab to <strong class="text-[#181818]">${LEADS_SHEET_NAME}</strong> (exact spelling, capital L).
        </li>
        <li>Click cell <strong class="text-[#181818]">A1</strong>, paste the header row below, and press Enter. Columns A–K should fill in one row.</li>
        <li>Leave row 2 empty — the app adds leads starting on the next row.</li>
      </ol>
      <label class="mt-3 block text-[10px] font-bold uppercase tracking-wide text-[#969492]">Header row (row 1, starting at A1)</label>
      <textarea
        class="mt-1.5 w-full resize-none rounded-lg border border-[rgba(60,60,67,0.12)] bg-white px-3 py-2 font-mono text-[10px] leading-5 text-[#181818] outline-none focus:border-[#0176D3] focus:ring-2 focus:ring-[#0176D3]/15"
        rows="2"
        readonly
        data-leads-header-tsv
        aria-label="Leads table header row"
      >${escapeHtml(LEADS_HEADER_ROW_TSV)}</textarea>
      <button
        type="button"
        data-copy-leads-header
        class="mt-2 w-full rounded-lg border border-[rgba(60,60,67,0.12)] bg-white px-3 py-2 text-xs font-bold text-[#0176D3] transition hover:border-[#0176D3] hover:bg-[#EAF5FE]"
      >
        Copy header row
      </button>
      <p class="mt-2 text-[10px] leading-4 text-[#969492]">Columns (${COLUMN_FIELDS.length}):</p>
      <ul class="mt-1 grid grid-cols-2 gap-1 sm:grid-cols-3">${columnsList}</ul>
    </div>
  `;
}

export function SyncInstructions({ provider = "google", compact = false } = {}) {
  const googleSteps = [
    "Follow the <strong>Quick setup</strong> above (copy redirect URI, create <strong>Desktop app</strong> client, add test users).",
    "Paste the Client ID and click Connect.",
    `Set up the sheet tab named <strong>${LEADS_SHEET_NAME}</strong> with the header row below (columns A–K).`,
    "Share the spreadsheet with teammates as <strong>Editors</strong> (same file, each person signs in with their own Google account).",
    `Copy the Spreadsheet ID from the URL (<code class='rounded bg-white/80 px-1 text-[10px]'>docs.google.com/spreadsheets/d/<strong>THIS_PART</strong>/edit</code>) → Settings → Save Spreadsheet ID.`,
  ];

  const microsoftSteps = [
    "Register an Azure app → Authentication → add platform <strong>Single-page application (SPA)</strong> with your redirect URI (not “Web” — Web requires a client secret). Paste only the Application (client) ID above.",
    "Click Connect and sign in with Microsoft.",
    "On first sync the app creates <strong>SoloCRM.xlsx</strong> in OneDrive with a <strong>Leads</strong> table and the same column headers as Google Sheets.",
    "Each account uses its own OneDrive file. For a shared team sheet, use Google Sheets.",
  ];

  const steps = provider === "microsoft" ? microsoftSteps : googleSteps;
  const title = provider === "microsoft" ? "How to sync with OneDrive" : "How to sync with Google Sheets";

  return `
    <div class="mt-4 rounded-xl border border-[rgba(60,60,67,0.08)] bg-[#F2F2F7] p-4 ${compact ? "text-left" : ""}">
      <h4 class="text-sm font-bold text-[#181818]">${title}</h4>
      ${
        !compact
          ? `<p class="mt-2 text-xs leading-5 text-[#706E6B]">
              Changes save locally first, push to your sheet when online, and pull again on load or reconnect. The status bar shows sync state.
            </p>`
          : ""
      }
      <ol class="mt-3 space-y-2 text-left">
        ${steps
          .map(
            (step, index) => `
          <li class="flex gap-2 text-xs leading-5 text-[#706E6B]">
            <span class="shrink-0 font-bold text-[#0176D3]">${index + 1}.</span>
            <span>${step}</span>
          </li>`,
          )
          .join("")}
      </ol>
      ${provider === "google" ? googleSheetSetupBlock() : ""}
      ${
        provider === "google"
          ? `<p class="mt-3 text-xs leading-5 text-[#706E6B]">Each person only sees leads they created (matched by <strong>OwnerEmail</strong>). Rows without OwnerEmail are hidden.</p>`
          : ""
      }
    </div>
  `;
}

export function bindSyncInstructions(root, { notifier } = {}) {
  root.querySelectorAll("[data-copy-leads-header]").forEach((button) => {
    button.addEventListener("click", async () => {
      const textarea = button.parentElement?.querySelector("[data-leads-header-tsv]");
      const text = textarea?.value || LEADS_HEADER_ROW_TSV;

      try {
        await navigator.clipboard.writeText(text);
        notifier?.show("Header row copied. Paste into cell A1 on the Leads tab.", "success");
      } catch {
        textarea?.select();
        notifier?.show("Select the header text and copy manually (Ctrl+C).", "info");
      }
    });
  });
}

export function SyncHowItWorks() {
  return `
    <div class="mt-6 rounded-xl border border-[rgba(60,60,67,0.08)] bg-white p-4">
      <h4 class="text-sm font-bold text-[#181818]">How sync works</h4>
      <p class="mt-2 text-xs leading-5 text-[#706E6B]">
        Edits appear in the app immediately. When you are online, changes push to your sheet and pull back on load or reconnect. You only see leads you own.
      </p>
    </div>
  `;
}
