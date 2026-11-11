"use client";

import { createStore, get, set } from "idb-keyval";
import type { PageDoc } from "./types";
import { upgradePage } from "./upgrade";

/*
  Version history, kept in this browser (IndexedDB) per page.
  Automatic versions: when a page is opened and every few minutes while it is
  edited. Named versions: whenever someone clicks "Save a version".
*/

export interface Version {
  id: string;
  at: number;
  label: string;
  auto: boolean;
  page: PageDoc;
}

const store = typeof indexedDB !== "undefined" ? createStore("agenics-page-builder-history", "versions") : undefined;
const MAX_AUTO = 40;
const MAX_ALL = 120;

const fingerprint = (p: PageDoc) => JSON.stringify([p.name, p.slug, p.seoTitle, p.metaDescription, p.modules]);
const listeners = new Set<() => void>();
export const onVersionsChange = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

export async function listVersions(pageId: string): Promise<Version[]> {
  if (!store) return [];
  const list = (await get<Version[]>(pageId, store)) ?? [];
  // Versions saved by an older builder show and restore in today's form
  return list.map((v) => {
    const page = upgradePage(v.page);
    return page === v.page ? v : { ...v, page };
  });
}

/** Save a version unless it is identical to the newest one. Returns false when nothing changed. */
export async function saveVersion(page: PageDoc, label: string, auto: boolean): Promise<boolean> {
  if (!store) return false;
  const list = await listVersions(page.id);
  if (list[0] && fingerprint(list[0].page) === fingerprint(page) && auto) return false;
  const copy = structuredClone(page);
  delete copy.share;
  const version: Version = { id: crypto.randomUUID(), at: Date.now(), label, auto, page: copy };
  let next = [version, ...list];
  // Keep every named version; trim the oldest automatic ones
  let autos = 0;
  next = next.filter((v) => !v.auto || ++autos <= MAX_AUTO).slice(0, MAX_ALL);
  await set(page.id, next, store);
  listeners.forEach((fn) => fn());
  return true;
}

export async function deleteVersion(pageId: string, id: string) {
  if (!store) return;
  const list = await listVersions(pageId);
  await set(
    pageId,
    list.filter((v) => v.id !== id),
    store,
  );
  listeners.forEach((fn) => fn());
}
