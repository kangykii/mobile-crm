/** Accept a raw Spreadsheet ID or a full Google Sheets URL. */
export function parseSpreadsheetId(input = "") {
  const trimmed = String(input).trim();
  if (!trimmed) {
    return "";
  }

  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : trimmed;
}
