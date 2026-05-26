/** Read Google/Microsoft credential fields from any visible form and persist them. */
export function saveOAuthCredentialsFromRoot(root, settings) {
  let googleClientId = settings.getGoogleClientId();
  let googleClientSecret = settings.getGoogleClientSecret();
  let microsoftClientId = settings.getMicrosoftClientId();

  root.querySelectorAll("[data-settings-form], [data-connect-form]").forEach((form) => {
    const formData = new FormData(form);

    if (formData.has("googleClientId")) {
      googleClientId = String(formData.get("googleClientId") || "").trim();
    }
    if (formData.has("googleClientSecret")) {
      googleClientSecret = String(formData.get("googleClientSecret") || "").trim();
    }
    if (formData.has("microsoftClientId")) {
      microsoftClientId = String(formData.get("microsoftClientId") || "").trim();
    }
  });

  settings.saveCredentials({ googleClientId, googleClientSecret, microsoftClientId });
  return { googleClientId, googleClientSecret, microsoftClientId };
}
