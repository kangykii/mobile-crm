/** OAuth redirect URI — must match exactly what is registered in Google/Azure. */
export function getAppRedirectUri() {
  const origin = globalThis.location?.origin || "";
  if (!origin) {
    return "/";
  }
  // Always use site root so /index.html does not break OAuth registration.
  return `${origin}/`;
}
