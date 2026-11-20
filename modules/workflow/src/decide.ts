// FP09 (D68, P17.14): a decision goes straight to the task's own component, at the address derived from that
// component's ID, never the one in the projection; with the task's version and an idempotency key, the same key when
// the user asks again after an unconfirmed answer. The worklist is not told: its next read shows the task gone.
export function decisionPath(component: string, task: string): string {
  const m = /^[a-z]+\/([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(component);
  if (!m || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(task)) {
    throw new Error(`no decision entry for ${component} ${task}`);
  }
  return `/api/${m[1]}/flow/tasks/${task}/decisions`;
}

export interface Decision {
  version: number;
  decision: "approve" | "reject";
  comment: string | null;
}
