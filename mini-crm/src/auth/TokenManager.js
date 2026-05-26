import { getAppRedirectUri } from "./redirectUri.js";

const STORAGE_PREFIX = "crm_";
const REFRESH_BUFFER_MS = 5 * 60 * 1000;
const GRAPH_ME_URL = "https://graph.microsoft.com/v1.0/me?$select=displayName,mail,userPrincipalName";

export const AUTH_PROVIDERS = {
  google: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/spreadsheets",
    ],
  },
  microsoft: {
    authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    scopes: ["User.Read", "Files.ReadWrite", "offline_access", "openid", "profile", "email"],
  },
};

export class TokenManager {
  constructor({ redirectUri, getGoogleClientId, getGoogleClientSecret, getMicrosoftClientId, getClientId } = {}) {
    this.getGoogleClientId = getGoogleClientId || getClientId || (() => "");
    this.getGoogleClientSecret = getGoogleClientSecret || (() => "");
    this.getMicrosoftClientId = getMicrosoftClientId || (() => "");
    this.redirectUri = redirectUri || getAppRedirectUri();
  }

  #googleClientSecret() {
    return this.getGoogleClientSecret?.()?.trim() || "";
  }

  #withGoogleSecret(params, provider) {
    if (this.#normalizeProvider(provider) !== "google") {
      return params;
    }

    const secret = this.#googleClientSecret();
    if (secret) {
      params.client_secret = secret;
    }
    return params;
  }

  #storageKey(name) {
    return `${STORAGE_PREFIX}${name}`;
  }

  #getItem(name) {
    return localStorage.getItem(this.#storageKey(name));
  }

  #setItem(name, value) {
    localStorage.setItem(this.#storageKey(name), value);
  }

  #removeItem(name) {
    localStorage.removeItem(this.#storageKey(name));
  }

  #normalizeProvider(provider) {
    return provider === "microsoft" ? "microsoft" : "google";
  }

  #providerConfig(provider) {
    return AUTH_PROVIDERS[this.#normalizeProvider(provider)];
  }

  base64UrlEncode(bytes) {
    return btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }

  async #createCodeChallenge(verifier) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
    return this.base64UrlEncode(new Uint8Array(digest));
  }

  #resolveClientId(provider) {
    const normalized = this.#normalizeProvider(provider);

    if (normalized === "microsoft") {
      const clientId = this.getMicrosoftClientId()?.trim();
      if (!clientId) {
        throw new Error("Microsoft Client ID is required. Add it in Settings before connecting.");
      }
      return clientId;
    }

    const clientId = this.getGoogleClientId()?.trim();
    if (!clientId) {
      throw new Error("Google Client ID is required. Add it in Settings before connecting.");
    }
    return clientId;
  }

  getProvider() {
    return this.#getItem("provider") || null;
  }

  async signIn(provider = "google") {
    const normalized = this.#normalizeProvider(provider);
    const config = this.#providerConfig(normalized);
    const clientId = this.#resolveClientId(normalized);
    const verifierBytes = crypto.getRandomValues(new Uint8Array(64));
    const verifier = this.base64UrlEncode(verifierBytes);
    const challenge = await this.#createCodeChallenge(verifier);

    this.#setItem("pending_provider", normalized);
    this.#setItem("code_verifier", verifier);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: this.redirectUri,
      response_type: "code",
      scope: config.scopes.join(" "),
      code_challenge: challenge,
      code_challenge_method: "S256",
      prompt: "consent",
    });

    if (normalized === "google") {
      params.set("access_type", "offline");
      params.set("include_granted_scopes", "true");
    }

    globalThis.location.assign(`${config.authUrl}?${params.toString()}`);
  }

  async signOut() {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }

  isSignedIn() {
    return Boolean(this.#getItem("access_token"));
  }

  getUserInfo() {
    const cachedProfile = this.#getItem("user_profile");
    if (cachedProfile) {
      try {
        const parsed = JSON.parse(cachedProfile);
        return {
          name: parsed.name || "",
          email: parsed.email || "",
        };
      } catch {
        this.#removeItem("user_profile");
      }
    }

    const idToken = this.#getItem("id_token");
    if (!idToken) {
      return null;
    }

    try {
      const payloadSegment = idToken.split(".")[1];
      const base64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
      const payload = JSON.parse(atob(padded));
      return {
        name: payload.name || payload.displayName || "",
        email: payload.email || payload.preferred_username || payload.upn || "",
      };
    } catch {
      return null;
    }
  }

  async getAccessToken() {
    const accessToken = this.#getItem("access_token");
    if (!accessToken) {
      return null;
    }

    const expiresAt = Number(this.#getItem("expires_at") || 0);
    if (expiresAt - Date.now() < REFRESH_BUFFER_MS) {
      return this.refreshAccessToken();
    }

    return accessToken;
  }

  async refreshAccessToken() {
    const refreshToken = this.#getItem("refresh_token");
    if (!refreshToken) {
      await this.signOut();
      return null;
    }

    const provider = this.getProvider() || "google";
    const config = this.#providerConfig(provider);
    const clientId = this.#resolveClientId(provider);
    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(
        this.#withGoogleSecret(
          {
            client_id: clientId,
            grant_type: "refresh_token",
            refresh_token: refreshToken,
            ...(provider === "microsoft" ? { scope: config.scopes.join(" ") } : {}),
          },
          provider,
        ),
      ),
    });

    if (!response.ok) {
      await this.signOut();
      return null;
    }

    const tokens = await response.json();
    await this.#storeTokenResponse(tokens, { provider, preserveRefreshToken: true });
    return this.#getItem("access_token");
  }

  async handleRedirectCallback() {
    const params = new URLSearchParams(globalThis.location.search);
    const code = params.get("code");
    const error = params.get("error");

    if (error) {
      this.#cleanAuthUrl();
      throw new Error(error);
    }

    if (!code) {
      return false;
    }

    const provider = this.#normalizeProvider(this.#getItem("pending_provider") || this.getProvider() || "google");
    const config = this.#providerConfig(provider);
    const verifier = this.#getItem("code_verifier");

    if (!verifier) {
      this.#cleanAuthUrl();
      throw new Error("Missing PKCE verifier. Try connecting again.");
    }

    const clientId = this.#resolveClientId(provider);
    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(
        this.#withGoogleSecret(
          {
            client_id: clientId,
            code,
            code_verifier: verifier,
            grant_type: "authorization_code",
            redirect_uri: this.redirectUri,
            ...(provider === "microsoft" ? { scope: config.scopes.join(" ") } : {}),
          },
          provider,
        ),
      ),
    });

    this.#removeItem("code_verifier");
    this.#removeItem("pending_provider");
    this.#cleanAuthUrl();

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(this.#formatTokenError(detail, provider));
    }

    const tokens = await response.json();
    await this.#storeTokenResponse(tokens, { provider });
    return true;
  }

  async #storeTokenResponse(tokens, { provider, preserveRefreshToken = false } = {}) {
    if (tokens.access_token) {
      this.#setItem("access_token", tokens.access_token);
    }

    if (tokens.refresh_token) {
      this.#setItem("refresh_token", tokens.refresh_token);
    } else if (!preserveRefreshToken && !this.#getItem("refresh_token")) {
      this.#removeItem("refresh_token");
    }

    if (tokens.id_token) {
      this.#setItem("id_token", tokens.id_token);
    }

    if (provider) {
      this.#setItem("provider", this.#normalizeProvider(provider));
    }

    const expiresIn = Number(tokens.expires_in || 3600);
    this.#setItem("expires_at", String(Date.now() + expiresIn * 1000));

    if (this.getProvider() === "microsoft") {
      await this.#cacheMicrosoftProfile(tokens.access_token);
    } else if (tokens.id_token) {
      const profile = this.getUserInfo();
      if (profile) {
        this.#setItem("user_profile", JSON.stringify(profile));
      }
    }
  }

  async #cacheMicrosoftProfile(accessToken) {
    if (!accessToken) {
      return;
    }

    try {
      const response = await fetch(GRAPH_ME_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        return;
      }

      const profile = await response.json();
      this.#setItem(
        "user_profile",
        JSON.stringify({
          name: profile.displayName || "",
          email: profile.mail || profile.userPrincipalName || "",
        }),
      );
    } catch {
      // Profile fetch is best-effort after sign-in.
    }
  }

  #cleanAuthUrl() {
    const hash = globalThis.location.hash || "";
    globalThis.history.replaceState(null, "", `${globalThis.location.pathname}${hash}`);
  }

  #formatTokenError(detail, provider) {
    const normalized = this.#normalizeProvider(provider);
    const text = typeof detail === "string" ? detail : JSON.stringify(detail);
    const lower = text.toLowerCase();

    if (lower.includes("redirect_uri_mismatch") || lower.includes("redirect_uri")) {
      return [
        "Redirect URI mismatch — the URI registered in Google must match exactly.",
        `This app uses: ${this.redirectUri}`,
        "In Google Auth Platform → Clients → your client, add that URI under Authorized redirect URIs (use the root / path, not /index.html).",
      ].join(" ");
    }

    if (lower.includes("client_secret") || lower.includes("client secret")) {
      if (normalized === "microsoft") {
        return [
          "Microsoft rejected sign-in: this app cannot use a client secret in the browser.",
          "In Azure Portal → App registrations → your app → Authentication, add a",
          "Single-page application (SPA) redirect URI (not “Web”). Remove Web-only platform entries if you added both.",
          "Paste the Application (client) ID from Overview — not a secret.",
        ].join(" ");
      }

      return [
        "Google expects a client secret for your OAuth client type (usually “Web application”).",
        "Option A: Expand “Web OAuth client? Add client secret”, paste the secret from Google Cloud → Credentials → your client (starts with GOCSPX-), save, and connect again.",
        `Option B: Create a new OAuth client as Desktop app, add redirect URI ${this.redirectUri}, use Client ID only (no secret).`,
      ].join(" ");
    }

    try {
      const json = JSON.parse(text);
      if (json.error_description) {
        return json.error_description;
      }
      if (json.error) {
        return String(json.error);
      }
    } catch {
      // Not JSON — use raw text below.
    }

    return text || `${normalized} token exchange failed.`;
  }
}
