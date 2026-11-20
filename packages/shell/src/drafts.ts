// FP13 (D24, protocol 20's offline drafts): a form's content kept in the browser while the backend cannot be reached.
// Isolated by entry, user, legal entity and form; only the fields the module allows (restricted fields never); kept 7
// days and at most 5 MiB per user; never shown as submitted. The user confirms the submission when back online; the
// backend checks as always. At a logout a shared terminal clears the user's drafts, but one being submitted keeps its
// idempotency key until its result is known or it expires (UI30): the next login asks with the same key.
import type { DraftForm } from "./module.ts";

export const ENTRY = "pc";
export const KEEP_MS = 7 * 24 * 3600 * 1000;
export const LIMIT_BYTES = 5 * 1024 * 1024;

export interface DraftKey {
  entry: string;
  user: string;
  legalEntity: string;
  form: string;
  id: string; // the draft's own identity (a new form) or the record's
}

export interface Draft {
  key: DraftKey;
  formVersion: number;
  baseRevision?: string; // the record revision the draft started from: a change shows a difference (UI13)
  values: Record<string, unknown>;
  savedAt: number;
  state: "local" | "submitting";
  idempotencyKey?: string;
}

/** Where drafts live: IndexedDB in the browser (idbStore), memory in tests. */
export interface DraftStore {
  all(): Promise<Draft[]>;
  put(d: Draft): Promise<void>;
  delete(key: DraftKey): Promise<void>;
}

export class DraftsFull extends Error {}

export function keyString(k: DraftKey): string {
  return [k.entry, k.user, k.legalEntity, k.form, k.id].join("\u0000");
}

export function size(d: Draft): number {
  return new TextEncoder().encode(JSON.stringify(d)).length;
}

export class Drafts {
  constructor(private readonly store: DraftStore, private readonly user: string, private readonly now: () => number) {}

  private async mine(): Promise<Draft[]> {
    const out: Draft[] = [];
    for (const d of await this.store.all()) {
      if (d.key.entry !== ENTRY || d.key.user !== this.user) continue; // another user's are not this user's (UI10)
      if (this.now() - d.savedAt > KEEP_MS) {
        await this.store.delete(d.key); // expired
        continue;
      }
      out.push(d);
    }
    return out;
  }

  async save(form: string, allowed: DraftForm, legalEntity: string, id: string, values: Record<string, unknown>,
    baseRevision?: string): Promise<Draft> {
    const kept: Record<string, unknown> = {};
    for (const f of allowed.fields) if (f in values) kept[f] = values[f]; // restricted fields stay out (UI14)
    const d: Draft = { key: { entry: ENTRY, user: this.user, legalEntity, form, id }, formVersion: allowed.version,
      baseRevision, values: kept, savedAt: this.now(), state: "local" };
    const others = (await this.mine()).filter((x) => keyString(x.key) !== keyString(d.key));
    if (others.reduce((n, x) => n + size(x), size(d)) > LIMIT_BYTES) throw new DraftsFull("drafts over 5 MiB");
    await this.store.put(d);
    return d;
  }

  /** This user's drafts in a legal entity (or every one): a draft of another form version is the caller's to show. */
  async list(legalEntity?: string): Promise<Draft[]> {
    return (await this.mine()).filter((d) => legalEntity === undefined || d.key.legalEntity === legalEntity);
  }

  /** The user confirmed the submission: the key goes with the draft, so a lost answer is asked again with it. */
  async submitting(d: Draft, idempotencyKey: string): Promise<Draft> {
    const s: Draft = { ...d, state: "submitting", idempotencyKey };
    await this.store.put(s);
    return s;
  }

  /** The backend accepted it: the draft is gone. */
  async accepted(d: Draft): Promise<void> {
    await this.store.delete(d.key);
  }

  /** Refused (rights, validation, a changed revision): back to a local draft with the reason shown by the page. */
  async refused(d: Draft): Promise<Draft> {
    const l: Draft = { ...d, state: "local", idempotencyKey: undefined };
    await this.store.put(l);
    return l;
  }

  /** At a logout: a shared terminal clears the local drafts; one being submitted stays with its key (UI30). */
  async logout(sharedTerminal: boolean): Promise<void> {
    if (!sharedTerminal) return;
    for (const d of await this.mine()) if (d.state === "local") await this.store.delete(d.key);
  }
}

export function memoryStore(): DraftStore {
  const m = new Map<string, Draft>();
  return {
    all: async () => [...m.values()].map((d) => structuredClone(d)),
    put: async (d) => void m.set(keyString(d.key), structuredClone(d)),
    delete: async (k) => void m.delete(keyString(k)),
  };
}

/** The browser's store: one IndexedDB object store keyed by the draft's key. */
export function idbStore(factory: IDBFactory = indexedDB, name = "be-drafts"): DraftStore {
  const open = () => new Promise<IDBDatabase>((resolve, reject) => {
    const r = factory.open(name, 1);
    r.onupgradeneeded = () => r.result.createObjectStore("drafts");
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  const run = async <T>(mode: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
    const db = await open();
    try {
      return await new Promise<T>((resolve, reject) => {
        const r = f(db.transaction("drafts", mode).objectStore("drafts"));
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      });
    } finally {
      db.close();
    }
  };
  return {
    all: () => run<Draft[]>("readonly", (s) => s.getAll() as IDBRequest<Draft[]>),
    put: async (d) => void (await run("readwrite", (s) => s.put(d, keyString(d.key)))),
    delete: async (k) => void (await run("readwrite", (s) => s.delete(keyString(k)))),
  };
}
