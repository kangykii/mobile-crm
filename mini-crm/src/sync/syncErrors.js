export function parseGoogleSheetsError(detail = "") {
  const text = typeof detail === "string" ? detail : JSON.stringify(detail);

  try {
    const json = JSON.parse(text);
    const message = json.error?.message || text;
    const status = json.error?.status || "";

    if (status === "PERMISSION_DENIED" || message.includes("Google Sheets API has not been")) {
      return "Google Sheets API is not enabled. In Google Cloud Console → APIs & Services → Library, enable “Google Sheets API”, then try Sync again.";
    }

    if (message.includes("Unable to parse range") || message.includes("not found")) {
      return 'Could not find a sheet tab named "Leads". Rename your tab to Leads (exact name) and paste the header row in A1.';
    }

    return message;
  } catch {
    if (text.includes("Google Sheets is not configured")) {
      return "Add your Spreadsheet ID in Settings (paste the full Google Sheets URL or ID).";
    }
    return text || "Google Sheets request failed.";
  }
}

export function isRetryableSyncError(message = "") {
  const lower = String(message).toLowerCase();

  if (
    lower.includes("not configured") ||
    lower.includes("spreadsheet id") ||
    lower.includes("permission_denied") ||
    lower.includes("sheets api") ||
    lower.includes("unable to parse range") ||
    lower.includes('sheet tab named "leads"')
  ) {
    return false;
  }

  return true;
}
