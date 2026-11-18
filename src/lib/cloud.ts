"use client";

/*
  Cloud save. Pages live in this browser (localStorage) and, once someone enters the
  team passcode, also in the project's private Blob store, so everyone on the team
  (Figment and Agenics) sees the same pages on any computer. Sync is simple and predictable:

  - Each page carries updatedAt. The newer copy wins, in either direction.
  - A page nobody has changed since it was made (an example, or a template just opened)
    stays in its own browser, so the team never collects a copy of the examples per person.
  - Each save carries the name of whoever made it, shown on the page's card.
  - A deleted page leaves a marker, so other computers drop their copy too.
  - Uploaded images go up once (the same upload sharing uses); another computer
    fetches the bytes the first time it opens the page.
*/

import { create } from "zustand";
import { getImageBlob, putImage } from "./images";
import { uploadImage } from "./share";
import { useBuilder } from "./store";
import type { PageDoc } from "./types";

export type CloudStatus = "checking" | "local" | "locked" | "syncing" | "saved" | "offline" | "error";

interface CloudState {
  status: CloudStatus;
  lastSync: number;
  message: string;
}

export const useCloud = create<CloudState>(() => ({ status: "checking", lastSync: 0, message: "" }));

/** Nobody has changed this page since it was made: an example or a template just opened. */
const untouched = (p: PageDoc) => p.updatedAt === p.createdAt;

/* The name that goes with this browser's saves */
const NAME_KEY = "agenics-page-builder:cloud-name";
export function cloudName(): string {
  try {
    return (localStorage.getItem(NAME_KEY) ?? "").trim().slice(0, 40);
  } catch {
    return "";
  }
}
export function setCloudName(name: string) {
  try {
    localStorage.setItem(NAME_KEY, name.trim().slice(0, 40));
  } catch {
    /* private window: saves go up without a name */
  }
}

type Remote = { id: string; updatedAt: number; deleted?: boolean };

class CloudError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status = 0,
  ) {
    super(message);
  }
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  } catch {
    throw new CloudError("offline", "offline");
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new CloudError(body.error ?? `Error ${res.status}`, body.code, res.status);
  return body as T;
}

const active = () => ["syncing", "saved", "offline", "error"].includes(useCloud.getState().status);

/** Every uploaded image id in a page, shown or hidden. */
function uploadIds(page: PageDoc): string[] {
  const out = new Set<string>();
  const walk = (n: unknown) => {
    if (Array.isArray(n)) n.forEach(walk);
    else if (n && typeof n === "object") {
      const o = n as Record<string, unknown>;
      if ("alt" in o && typeof o.id === "string" && o.id) out.add(o.id);
      Object.values(o).forEach(walk);
    }
  };
  page.modules.forEach((m) => walk(m.data));
  return [...out];
}

/* ------------------------------------------------------------------ */
/* Push and pull                                                       */
/* ------------------------------------------------------------------ */

/** Ids removed because another computer deleted them: not deleted again from here. */
const droppedRemotely = new Set<string>();
const pushed = new Map<string, number>();

async function push(local: PageDoc) {
  // The save carries this browser's name; the local copy gets it too, without counting as an edit
  const by = cloudName();
  const page: PageDoc = by ? { ...local, editedBy: by } : local;
  const uploads: Record<string, string> = {};
  for (const id of uploadIds(page)) {
    try {
      uploads[id] = await uploadImage(id);
    } catch {
      /* a missing image is skipped; the page still saves */
    }
  }
  try {
    await api(`/api/pages/${encodeURIComponent(page.id)}`, { method: "PUT", body: JSON.stringify({ page, uploads }) });
    pushed.set(page.id, page.updatedAt);
    if (by) useBuilder.getState().stampEditor(local.id, by);
  } catch (e) {
    // A newer copy elsewhere: take it instead of overwriting it
    if (e instanceof CloudError && e.code === "stale") await pull(page.id);
    else if (e instanceof CloudError && e.code === "deleted") drop(page.id);
    else throw e;
  }
}

async function pull(id: string) {
  const { page, uploads } = await api<{ page: PageDoc; uploads: Record<string, string> }>(`/api/pages/${encodeURIComponent(id)}`);
  // Fetch image bytes this browser has never seen; the page shows them as they arrive
  await Promise.all(
    Object.entries(uploads ?? {}).map(async ([imgId, url]) => {
      if (await getImageBlob(imgId)) return;
      try {
        const res = await fetch(url);
        if (res.ok) await putImage(imgId, await res.blob());
      } catch {
        /* the image shows as missing until the next sync */
      }
    }),
  );
  pushed.set(page.id, page.updatedAt);
  const isNew = !useBuilder.getState().pages.some((p) => p.id === page.id);
  useBuilder.getState().upsertPage(page);
  if (isNew) arrived.push(page.name);
}

/** Pages that arrived from the team during this sync, to announce once it finishes. */
const arrived: string[] = [];
function announce() {
  if (!arrived.length) return;
  const names = arrived.splice(0);
  useBuilder.getState().showToast(names.length === 1 ? `New from the team: “${names[0]}”. Find it under Pages.` : `${names.length} pages from the team were added. Find them under Pages.`);
}

function drop(id: string) {
  droppedRemotely.add(id);
  pushed.delete(id);
  useBuilder.getState().dropPage(id);
}

let running = false;
let again = false;

/** Bring this browser and the cloud level with each other. */
export async function syncNow(): Promise<void> {
  if (!active()) return;
  if (running) {
    again = true;
    return;
  }
  running = true;
  useCloud.setState({ status: "syncing" });
  try {
    const { pages: remote } = await api<{ pages: Remote[] }>("/api/pages");
    const local = new Map(useBuilder.getState().pages.map((p) => [p.id, p]));
    for (const r of remote) {
      const l = local.get(r.id);
      if (r.deleted) {
        if (l && l.updatedAt <= r.updatedAt) drop(r.id);
      } else if (!l || r.updatedAt > l.updatedAt) {
        await pull(r.id);
      } else {
        pushed.set(r.id, r.updatedAt);
      }
    }
    const byId = new Map(remote.map((r) => [r.id, r]));
    for (const p of useBuilder.getState().pages) {
      const r = byId.get(p.id);
      if (!r ? !untouched(p) : p.updatedAt > r.updatedAt) await push(p);
    }
    useCloud.setState({ status: "saved", lastSync: Date.now(), message: "" });
    announce();
  } catch (e) {
    if (e instanceof CloudError && e.code === "locked") useCloud.setState({ status: "locked", message: "" });
    else if (e instanceof CloudError && e.code === "offline") useCloud.setState({ status: "offline", message: "" });
    else useCloud.setState({ status: "error", message: e instanceof Error ? e.message : "Cloud save stopped." });
  } finally {
    running = false;
    if (again) {
      again = false;
      void syncNow();
    }
  }
}

/* ------------------------------------------------------------------ */
/* Watching edits                                                      */
/* ------------------------------------------------------------------ */

const timers = new Map<string, ReturnType<typeof setTimeout>>();
let watching = false;

function watch() {
  if (watching) return;
  watching = true;
  useBuilder.subscribe((s, prev) => {
    if (!active() || s.pages === prev.pages) return;
    const now = new Set(s.pages.map((p) => p.id));
    for (const p of prev.pages) {
      if (now.has(p.id)) continue;
      if (droppedRemotely.delete(p.id)) continue;
      // A page that never went up has nothing to delete for everyone else
      if (!pushed.has(p.id)) continue;
      pushed.delete(p.id);
      void api(`/api/pages/${encodeURIComponent(p.id)}`, { method: "DELETE" }).catch(() => undefined);
    }
    for (const p of s.pages) {
      if ((pushed.get(p.id) ?? 0) >= p.updatedAt || untouched(p)) continue;
      clearTimeout(timers.get(p.id));
      timers.set(
        p.id,
        setTimeout(async () => {
          timers.delete(p.id);
          const page = useBuilder.getState().pages.find((x) => x.id === p.id);
          if (!page || (pushed.get(page.id) ?? 0) >= page.updatedAt) {
            // Nothing left to send (it went up with an earlier save)
            if (!timers.size && useCloud.getState().status === "syncing") useCloud.setState({ status: "saved", lastSync: Date.now(), message: "" });
            return;
          }
          useCloud.setState({ status: "syncing" });
          try {
            await push(page);
            if (!timers.size) useCloud.setState({ status: "saved", lastSync: Date.now(), message: "" });
          } catch (e) {
            const offline = e instanceof CloudError && e.code === "offline";
            useCloud.setState({ status: offline ? "offline" : "error", message: offline ? "" : e instanceof Error ? e.message : "" });
          }
        }, 1500),
      );
    }
  });
  window.addEventListener("focus", () => void syncNow());
  window.addEventListener("online", () => void syncNow());
  setInterval(() => void syncNow(), 60_000);
}

/* ------------------------------------------------------------------ */
/* Start, unlock, sign out                                             */
/* ------------------------------------------------------------------ */

let started: Promise<void> | null = null;

/** Check whether cloud save is set up and unlocked here; if so, sync before the first paint of pages. */
export function startCloud(): Promise<void> {
  if (started) return started;
  started = (async () => {
    let team: { configured: boolean; storage: boolean; member: boolean };
    try {
      team = await api("/api/team");
    } catch {
      useCloud.setState({ status: "offline" });
      return;
    }
    if (!team.configured || !team.storage) {
      useCloud.setState({ status: "local" });
      return;
    }
    if (!team.member) {
      useCloud.setState({ status: "locked" });
      return;
    }
    useCloud.setState({ status: "syncing" });
    watch();
    await syncNow();
  })();
  return started;
}

/** Enter the team passcode. Returns an error message, or null when cloud save is on. */
export async function unlock(passcode: string): Promise<string | null> {
  try {
    await api("/api/team", { method: "POST", body: JSON.stringify({ passcode }) });
  } catch (e) {
    return e instanceof Error && e.message !== "offline" ? e.message : "Could not reach the server. Check your connection.";
  }
  useCloud.setState({ status: "syncing" });
  watch();
  await syncNow();
  return null;
}

/** Stop cloud save on this browser. Pages stay here. */
export async function signOut(): Promise<void> {
  await api("/api/team", { method: "DELETE" }).catch(() => undefined);
  useCloud.setState({ status: "locked" });
}
