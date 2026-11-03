/**
 * Storage for shared preview links (server only).
 *
 * - On Vercel: a Vercel Blob store connected to the project (BLOB_READ_WRITE_TOKEN
 *   or BLOB_STORE_ID is set automatically when the store is connected). Works with
 *   public or private stores; set BLOB_ACCESS=private for a private store.
 * - Running locally without a store: files go in ./.share-data so the feature can
 *   be tried end to end.
 * - On Vercel without a store: sharing is off and the API says how to switch it on.
 */
import { del, get, put } from "@vercel/blob";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export type Mode = "blob" | "local" | "off";

export function storageMode(): Mode {
  if (process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID) return "blob";
  if (process.env.VERCEL) return "off";
  return "local";
}

let access: "public" | "private" = process.env.BLOB_ACCESS === "private" ? "private" : "public";

const LOCAL_DIR = path.join(process.cwd(), ".share-data");
const localPath = (key: string) => {
  const p = path.join(LOCAL_DIR, key);
  if (!p.startsWith(LOCAL_DIR + path.sep)) throw new Error("Bad key");
  return p;
};

/** URL the browser uses for a stored file. Public blobs are served straight from the CDN. */
const fileRoute = (key: string) => `/share/file/${key}`;

async function blobPut(key: string, body: Blob | string | ArrayBuffer, contentType: string, overwrite: boolean) {
  const opts = { contentType, addRandomSuffix: false, allowOverwrite: overwrite, cacheControlMaxAge: 60 };
  try {
    return await put(key, body as Blob, { ...opts, access });
  } catch (e) {
    // A store is either public or private; if we guessed wrong, switch once and retry
    if (e instanceof Error && /access|private|public/i.test(`${e.name} ${e.message}`)) {
      access = access === "public" ? "private" : "public";
      return await put(key, body as Blob, { ...opts, access });
    }
    throw e;
  }
}

export async function saveJson(key: string, data: unknown): Promise<void> {
  const text = JSON.stringify(data);
  if (storageMode() === "blob") {
    await blobPut(key, text, "application/json", true);
    return;
  }
  const p = localPath(key);
  await mkdir(path.dirname(p), { recursive: true });
  await writeFile(p, text, "utf8");
}

export async function loadJson<T>(key: string): Promise<T | null> {
  if (storageMode() === "blob") {
    const res = await get(key, { access, useCache: false }).catch(() => null);
    if (!res || res.statusCode !== 200) return null;
    return JSON.parse(await new Response(res.stream).text()) as T;
  }
  try {
    return JSON.parse(await readFile(localPath(key), "utf8")) as T;
  } catch {
    return null;
  }
}

export async function saveFile(key: string, body: ArrayBuffer, contentType: string): Promise<string> {
  if (storageMode() === "blob") {
    const res = await blobPut(key, new Blob([body], { type: contentType }), contentType, false);
    return access === "public" ? res.url : fileRoute(key);
  }
  const p = localPath(key);
  await mkdir(path.dirname(p), { recursive: true });
  await writeFile(p, Buffer.from(body));
  await writeFile(`${p}.type`, contentType, "utf8");
  return fileRoute(key);
}

export async function loadFile(key: string): Promise<{ body: BodyInit; contentType: string } | null> {
  if (storageMode() === "blob") {
    const res = await get(key, { access }).catch(() => null);
    if (!res || res.statusCode !== 200) return null;
    return { body: res.stream, contentType: res.blob.contentType };
  }
  try {
    const p = localPath(key);
    const [buf, type] = await Promise.all([readFile(p), readFile(`${p}.type`, "utf8").catch(() => "application/octet-stream")]);
    return { body: new Uint8Array(buf), contentType: type };
  } catch {
    return null;
  }
}

export async function remove(key: string): Promise<void> {
  if (storageMode() === "blob") {
    await del(key).catch(() => undefined);
    return;
  }
  await rm(localPath(key), { force: true });
}
