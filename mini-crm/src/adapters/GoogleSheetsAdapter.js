import { BaseStorageAdapter } from "./BaseStorageAdapter.js";
import { LEADS_SHEET_NAME, leadToRow, rowToLead } from "./columnMap.js";
import { parseGoogleSheetsError } from "../sync/syncErrors.js";

export class GoogleSheetsAdapter extends BaseStorageAdapter {
  constructor({ tokenManager, getSpreadsheetId } = {}) {
    super();
    this.tokenManager = tokenManager;
    this.getSpreadsheetId = getSpreadsheetId || (() => "");
  }

  async connect() {
    const spreadsheetId = this.getSpreadsheetId()?.trim();
    const accessToken = await this.tokenManager?.getAccessToken();

    if (!accessToken) {
      return {
        provider: "google",
        connected: false,
        spreadsheetId: "",
        reason: "Sign in to Google again from Settings.",
      };
    }

    if (!spreadsheetId) {
      return {
        provider: "google",
        connected: false,
        spreadsheetId: "",
        reason: "Add your Spreadsheet ID in Settings (paste the sheet URL or ID).",
      };
    }

    return {
      provider: "google",
      connected: true,
      spreadsheetId,
    };
  }

  async #request(url, options = {}) {
    const accessToken = await this.tokenManager?.getAccessToken();
    const spreadsheetId = this.getSpreadsheetId()?.trim();

    if (!accessToken) {
      throw new Error("Sign in to Google again from Settings.");
    }

    if (!spreadsheetId) {
      throw new Error("Add your Spreadsheet ID in Settings.");
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(parseGoogleSheetsError(detail));
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  async #getRows() {
    const spreadsheetId = this.getSpreadsheetId().trim();
    const data = await this.#request(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(`${LEADS_SHEET_NAME}!A:K`)}`,
    );
    return data.values || [];
  }

  async #findRowNumber(id) {
    const rows = await this.#getRows();
    for (let index = 1; index < rows.length; index += 1) {
      if (rows[index][0] === id) {
        return index + 1;
      }
    }
    return -1;
  }

  async fetchLeads() {
    const rows = await this.#getRows();
    return rows.slice(1).filter((row) => row[0]).map((row) => rowToLead(row));
  }

  async addLead({ lead }) {
    const spreadsheetId = this.getSpreadsheetId().trim();
    await this.#request(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(`${LEADS_SHEET_NAME}!A:K`)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: "POST",
        body: JSON.stringify({ values: [leadToRow(lead)] }),
      },
    );
  }

  async updateLead({ lead }) {
    const rowNumber = await this.#findRowNumber(lead.ID);
    if (rowNumber < 0) {
      return this.addLead({ lead });
    }

    const spreadsheetId = this.getSpreadsheetId().trim();
    await this.#request(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(`${LEADS_SHEET_NAME}!A${rowNumber}:K${rowNumber}`)}?valueInputOption=USER_ENTERED`,
      {
        method: "PUT",
        body: JSON.stringify({ values: [leadToRow(lead)] }),
      },
    );
  }

  async deleteLead({ id }) {
    const rowNumber = await this.#findRowNumber(id);
    if (rowNumber < 0) {
      return;
    }

    const spreadsheetId = this.getSpreadsheetId().trim();
    const metadata = await this.#request(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`);
    const sheet = metadata.sheets?.find((item) => item.properties?.title === LEADS_SHEET_NAME) || metadata.sheets?.[0];
    const sheetId = sheet?.properties?.sheetId;

    if (sheetId === undefined) {
      throw new Error("Could not resolve Google Sheet tab for delete.");
    }

    await this.#request(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: "POST",
      body: JSON.stringify({
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: "ROWS",
                startIndex: rowNumber - 1,
                endIndex: rowNumber,
              },
            },
          },
        ],
      }),
    });
  }

  async appendTimelineEntry({ lead }) {
    return this.updateLead({ lead });
  }
}
