"use client";

import { createStore, del, get, set } from "idb-keyval";
import { useCallback, useSyncExternalStore } from "react";
import { uid } from "./path";
import type { ImageVal } from "./types";

// Images live in IndexedDB (they are too large for localStorage). Pages store only the id.
const store = typeof indexedDB !== "undefined" ? createStore("agenics-page-builder", "images") : undefined;

const urlCache = new Map<string, string>();
const listeners = new Map<string, Set<() => void>>();

export async function saveImage(file: Blob, name?: string): Promise<ImageVal> {
  if (!store) throw new Error("IndexedDB is not available");
  const id = uid();
  await set(id, file, store);
  const { w, h } = await measure(file);
  return { id, alt: "", w, h, name: name ?? (file instanceof File ? file.name : undefined), type: file.type };
}

export async function putImage(id: string, blob: Blob) {
  if (!store) return;
  await set(id, blob, store);
  const old = urlCache.get(id);
  if (old) URL.revokeObjectURL(old);
  urlCache.delete(id);
  load(id);
}

export async function getImageBlob(id: string): Promise<Blob | undefined> {
  if (!store) return undefined;
  return get<Blob>(id, store);
}

export async function deleteImage(id: string) {
  if (!store) return;
  await del(id, store);
  const old = urlCache.get(id);
  if (old) URL.revokeObjectURL(old);
  urlCache.delete(id);
}

async function measure(file: Blob): Promise<{ w: number; h: number }> {
  try {
    const bmp = await createImageBitmap(file);
    const out = { w: bmp.width, h: bmp.height };
    bmp.close();
    return out;
  } catch {
    // SVG and some formats cannot be decoded by createImageBitmap
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const im = new Image();
      im.onload = () => {
        resolve({ w: im.naturalWidth, h: im.naturalHeight });
        URL.revokeObjectURL(url);
      };
      im.onerror = () => resolve({ w: 0, h: 0 });
      im.src = url;
    });
  }
}

const loading = new Set<string>();

function load(id: string) {
  if (urlCache.has(id) || loading.has(id)) return;
  loading.add(id);
  getImageBlob(id).then((blob) => {
    loading.delete(id);
    if (!blob) return;
    urlCache.set(id, URL.createObjectURL(blob));
    listeners.get(id)?.forEach((fn) => fn());
  });
}

/** Object URL for a stored image id, or null while loading / when missing. */
export function useImageUrl(id: string | null | undefined): string | null {
  const subscribe = useCallback(
    (fn: () => void) => {
      if (!id) return () => {};
      if (!listeners.has(id)) listeners.set(id, new Set());
      listeners.get(id)!.add(fn);
      load(id);
      return () => {
        listeners.get(id)?.delete(fn);
      };
    },
    [id],
  );
  return useSyncExternalStore(
    subscribe,
    () => (id ? urlCache.get(id) ?? null : null),
    () => null,
  );
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}
