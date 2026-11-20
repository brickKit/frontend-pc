// FP19 (protocol 20's versions and old clients, UI15): the build carries its version in /version.json (never cached);
// the shell asks for it every 5 minutes and when the window regains focus, polling, and offers a reload when the
// deployment serves another build. A page with an unsaved form asks to save first (the page's own guard).
export const VERSION_PATH = "/version.json";
export const CHECK_MS = 5 * 60 * 1000;

export interface BuildInfo {
  version: string; // the component's version
  commit: string;
}

/** Whether the deployed build is not the one running. An unreadable answer is not a new build. */
export function outdated(running: BuildInfo, deployed: unknown): boolean {
  const d = deployed as Partial<BuildInfo> | null;
  if (!d || typeof d.version !== "string" || typeof d.commit !== "string") return false;
  return d.version !== running.version || d.commit !== running.commit;
}
