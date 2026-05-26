import { parseSpreadsheetId } from "../../utils/spreadsheetId.js";

export class WebSettingsStore {
  getGoogleClientId() {
    return localStorage.getItem("mini-crm:google-client-id") || "";
  }

  getGoogleClientSecret() {
    return localStorage.getItem("mini-crm:google-client-secret") || "";
  }

  getMicrosoftClientId() {
    return localStorage.getItem("mini-crm:microsoft-client-id") || "";
  }

  getSpreadsheetId() {
    return localStorage.getItem("crm_spreadsheet_id") || "";
  }

  getUserCompany() {
    return localStorage.getItem("crm_user_company") || "";
  }

  hasSpreadsheetConfigured() {
    return Boolean(this.getSpreadsheetId().trim());
  }

  hasBackendConfigured(provider) {
    if (provider === "microsoft") {
      return true;
    }

    return this.hasSpreadsheetConfigured();
  }

  saveCredentials({ googleClientId = "", microsoftClientId = "", googleClientSecret = "" } = {}) {
    localStorage.setItem("mini-crm:google-client-id", googleClientId);
    localStorage.setItem("mini-crm:microsoft-client-id", microsoftClientId);
    localStorage.setItem("mini-crm:google-client-secret", googleClientSecret);
  }

  saveSpreadsheetId(spreadsheetId = "") {
    localStorage.setItem("crm_spreadsheet_id", parseSpreadsheetId(spreadsheetId));
  }

  saveUserCompany(company = "") {
    localStorage.setItem("crm_user_company", company.trim());
  }

  signOut() {
    localStorage.removeItem("mini-crm:tokens");
  }
}
