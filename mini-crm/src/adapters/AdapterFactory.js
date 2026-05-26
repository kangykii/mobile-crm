import { GoogleSheetsAdapter } from "./GoogleSheetsAdapter.js";
import { MicrosoftGraphAdapter } from "./MicrosoftGraphAdapter.js";

export function createStorageAdapter(provider, options = {}) {
  if (provider === "google") {
    return new GoogleSheetsAdapter(options);
  }

  if (provider === "microsoft") {
    return new MicrosoftGraphAdapter(options);
  }

  throw new Error(`Unknown storage provider: ${provider}`);
}
