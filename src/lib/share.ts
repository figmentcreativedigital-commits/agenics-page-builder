"use client";

import { imageSlots } from "./exporters";
import { getImageBlob } from "./images";
import { setAt } from "./path";
import type { ImageVal, PageDoc, ShareInfo } from "./types";

/*
  Publishing a preview link: the page is copied, every uploaded image is sent to
  storage (once; the URL is remembered), and the copy is saved under a short id.
  Viewers get a read-only page at /share/<id>. Only this browser holds the secret
  that updates or turns off the link.
*/

export class ShareError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

const UPLOADS = "agenics-page-builder:uploads";
const SENDABLE = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX = 3_800_000;

function uploads(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(UPLOADS) ?? "{}");
  } catch {
    return {};
  }
}

function remember(id: string, url: string) {
  try {
    localStorage.setItem(UPLOADS, JSON.stringify({ ...uploads(), [id]: url }));
  } catch {
    /* storage full: the image is just sent again next time */
  }
}

async function decode(blob: Blob): Promise<CanvasImageSource & { width: number; height: number }> {
  try {
    return await createImageBitmap(blob);
  } catch {
    const url = URL.createObjectURL(blob);
    try {
      const im = new Image();
      im.src = url;
      await im.decode();
      return im;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

/** Large or unusual files are re-encoded (max 2,400 px, WebP keeps transparency). */
async function sendable(blob: Blob): Promise<Blob> {
  if (blob.size <= MAX && SENDABLE.includes(blob.type)) return blob;
  const img = await decode(blob);
  const scale = Math.min(1, 2400 / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  const type = blob.type === "image/jpeg" ? "image/jpeg" : "image/webp";
  const out = await new Promise<Blob | null>((r) => canvas.toBlob(r, type, 0.86));
  if (!out) throw new ShareError("An image could not be prepared for sharing.");
  return out;
}

async function call<T>(url: string, init: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new ShareError("Could not reach the server. Check your connection and try again.");
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ShareError(body.error ?? `Something went wrong (${res.status}).`, body.code);
  return body as T;
}

async function uploadImage(id: string): Promise<string> {
  const cached = uploads()[id];
  if (cached) return cached;
  const blob = await getImageBlob(id);
  if (!blob) throw new ShareError("An image is missing from this browser. Replace it and try again.");
  const file = await sendable(blob);
  const { url } = await call<{ url: string }>("/api/share/image", {
    method: "POST",
    headers: { "Content-Type": file.type },
    body: file,
  });
  remember(id, url);
  return url;
}

/** Create the page's preview link, or update it with the latest version. */
export async function publishShare(page: PageDoc, onStep?: (msg: string) => void): Promise<ShareInfo> {
  const snapshot: PageDoc = structuredClone(page);
  delete snapshot.share;

  const slots = imageSlots(page).filter((s) => s.image?.id);
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    onStep?.(`Uploading images (${i + 1} of ${slots.length})…`);
    const url = await uploadImage(s.image.id!);
    const mod = snapshot.modules[s.moduleIndex];
    const next: ImageVal = { ...s.image, id: null, src: url };
    mod.data = setAt(mod.data, s.path, next);
  }

  onStep?.("Publishing the page…");
  return call<ShareInfo>("/api/share", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: page.share?.id, secret: page.share?.secret, page: snapshot }),
  });
}

/** Turn the link off for everyone. */
export async function stopShare(share: ShareInfo): Promise<void> {
  await call("/api/share", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: share.id, secret: share.secret }),
  });
}
