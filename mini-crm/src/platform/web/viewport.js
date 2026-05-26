/** Sync CSS viewport height to the visible area (browser chrome, zoom, mobile URL bar). */
export function syncViewportVars() {
  const height = window.visualViewport?.height ?? window.innerHeight;
  const width = window.visualViewport?.width ?? window.innerWidth;
  const root = document.documentElement;

  root.style.setProperty("--app-vh", `${Math.round(height)}px`);
  root.style.setProperty("--app-vw", `${Math.round(width)}px`);
}

export function bindViewportVars() {
  syncViewportVars();
  window.addEventListener("resize", syncViewportVars);
  window.visualViewport?.addEventListener("resize", syncViewportVars);
  window.visualViewport?.addEventListener("scroll", syncViewportVars);
}
