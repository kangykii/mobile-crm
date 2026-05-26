import { BaseStorageAdapter } from "./BaseStorageAdapter.js";
import { COLUMN_FIELDS, leadToRow, rowToLead } from "./columnMap.js";
import { MINIMAL_XLSX_BASE64 } from "./minimalWorkbook.js";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";
const WORKBOOK_NAME = "SoloCRM.xlsx";
const WORKSHEET_NAME = "Leads";
const TABLE_NAME = "LeadsTable";
const FILE_ID_KEY = "crm_ms_file_id";

export class MicrosoftGraphAdapter extends BaseStorageAdapter {
  constructor({ tokenManager } = {}) {
    super();
    this.tokenManager = tokenManager;
  }

  async connect() {
    const accessToken = await this.tokenManager?.getAccessToken();
    if (!accessToken) {
      return { provider: "microsoft", connected: false };
    }

    await this.findOrCreateWorkbook();
    return { provider: "microsoft", connected: true };
  }

  async #request(url, options = {}) {
    const accessToken = await this.tokenManager?.getAccessToken();
    if (!accessToken) {
      throw new Error("Microsoft account is not connected.");
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(options.body &&
        !(options.body instanceof Blob) &&
        !(options.body instanceof Uint8Array) &&
        typeof options.body === "string"
          ? { "Content-Type": "application/json" }
          : {}),
        ...(options.headers || {}),
      },
    });

    if (response.status === 404) {
      const error = new Error("Not found");
      error.status = 404;
      throw error;
    }

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || "Microsoft Graph request failed.");
    }

    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return response.json();
    }

    return response;
  }

  #workbookPath(fileId, suffix) {
    return `${GRAPH_BASE}/me/drive/items/${fileId}/workbook/${suffix}`;
  }

  async findOrCreateWorkbook() {
    const cachedId = localStorage.getItem(FILE_ID_KEY);
    if (cachedId) {
      try {
        await this.#request(`${GRAPH_BASE}/me/drive/items/${cachedId}`);
        return cachedId;
      } catch (error) {
        if (error.status !== 404) {
          throw error;
        }
        localStorage.removeItem(FILE_ID_KEY);
      }
    }

    try {
      const existing = await this.#request(
        `${GRAPH_BASE}/me/drive/root:/${encodeURIComponent(WORKBOOK_NAME)}`,
      );
      localStorage.setItem(FILE_ID_KEY, existing.id);
      await this.#ensureWorkbookStructure(existing.id);
      return existing.id;
    } catch (error) {
      if (error.status !== 404) {
        throw error;
      }
    }

    const bytes = Uint8Array.from(atob(MINIMAL_XLSX_BASE64), (char) => char.charCodeAt(0));
    const created = await this.#request(
      `${GRAPH_BASE}/me/drive/root:/${encodeURIComponent(WORKBOOK_NAME)}:/content`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
        body: bytes,
      },
    );

    const fileId = created?.id;
    if (!fileId) {
      const item = await this.#request(`${GRAPH_BASE}/me/drive/root:/${encodeURIComponent(WORKBOOK_NAME)}`);
      localStorage.setItem(FILE_ID_KEY, item.id);
      await this.#ensureWorkbookStructure(item.id);
      return item.id;
    }

    localStorage.setItem(FILE_ID_KEY, fileId);
    await this.#ensureWorkbookStructure(fileId);
    return fileId;
  }

  async #ensureWorkbookStructure(fileId) {
    const worksheets = await this.#request(this.#workbookPath(fileId, "worksheets"));
    let leadsWorksheet = worksheets.value?.find((sheet) => sheet.name === WORKSHEET_NAME);

    if (!leadsWorksheet) {
      const defaultSheet = worksheets.value?.[0];
      if (defaultSheet?.name && defaultSheet.name !== WORKSHEET_NAME) {
        await this.#request(this.#workbookPath(fileId, `worksheets/${defaultSheet.name}`), {
          method: "PATCH",
          body: JSON.stringify({ name: WORKSHEET_NAME }),
        });
      } else if (!defaultSheet) {
        await this.#request(this.#workbookPath(fileId, "worksheets/add"), {
          method: "POST",
          body: JSON.stringify({ name: WORKSHEET_NAME }),
        });
      }
    }

    await this.#request(this.#workbookPath(fileId, `worksheets('${WORKSHEET_NAME}')/range(address='A1:K1')`), {
      method: "PATCH",
      body: JSON.stringify({ values: [COLUMN_FIELDS] }),
    });

    try {
      await this.#request(this.#workbookPath(fileId, `tables/${TABLE_NAME}`));
    } catch (error) {
      if (error.status !== 404) {
        throw error;
      }

      const createdTable = await this.#request(this.#workbookPath(fileId, "tables/add"), {
        method: "POST",
        body: JSON.stringify({
          address: `${WORKSHEET_NAME}!A1:K1`,
          hasHeaders: true,
        }),
      });

      if (createdTable?.name && createdTable.name !== TABLE_NAME) {
        await this.#request(this.#workbookPath(fileId, `tables/${createdTable.name}`), {
          method: "PATCH",
          body: JSON.stringify({ name: TABLE_NAME }),
        });
      }
    }
  }

  async #getFileId() {
    return this.findOrCreateWorkbook();
  }

  async fetchLeads() {
    const fileId = await this.#getFileId();
    const data = await this.#request(this.#workbookPath(fileId, `tables/${TABLE_NAME}/rows`));
    return (data.value || []).map((row) => rowToLead(row.values?.[0] || []));
  }

  async #getTableRows(fileId) {
    const data = await this.#request(this.#workbookPath(fileId, `tables/${TABLE_NAME}/rows`));
    return data.value || [];
  }

  async #findRowIndex(fileId, id) {
    const rows = await this.#getTableRows(fileId);
    for (let index = 0; index < rows.length; index += 1) {
      if (rows[index].values?.[0]?.[0] === id) {
        return index;
      }
    }
    return -1;
  }

  async addLead({ lead }) {
    const fileId = await this.#getFileId();
    await this.#request(this.#workbookPath(fileId, `tables/${TABLE_NAME}/rows/add`), {
      method: "POST",
      body: JSON.stringify({
        values: [leadToRow(lead)],
      }),
    });
  }

  async updateLead({ lead }) {
    const fileId = await this.#getFileId();
    const rowIndex = await this.#findRowIndex(fileId, lead.ID);

    if (rowIndex < 0) {
      return this.addLead({ lead });
    }

    await this.#request(this.#workbookPath(fileId, `tables/${TABLE_NAME}/rows/itemAt(index=${rowIndex})`), {
      method: "PATCH",
      body: JSON.stringify({
        values: [leadToRow(lead)],
      }),
    });
  }

  async deleteLead({ id }) {
    const fileId = await this.#getFileId();
    const rowIndex = await this.#findRowIndex(fileId, id);

    if (rowIndex < 0) {
      return;
    }

    await this.#request(this.#workbookPath(fileId, `tables/${TABLE_NAME}/rows/itemAt(index=${rowIndex})`), {
      method: "DELETE",
    });
  }

  async appendTimelineEntry({ lead }) {
    return this.updateLead({ lead });
  }
}
