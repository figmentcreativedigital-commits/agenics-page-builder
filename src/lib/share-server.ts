/** Shared preview links: ids, secrets and validation (server only). */
import { createHash, randomBytes } from "node:crypto";
import { MODULES } from "./modules";
import type { PageDoc } from "./types";

export const SHARE_FORMAT = "agenics-share@1";

export interface ShareDoc {
  format: typeof SHARE_FORMAT;
  id: string;
  /** sha256 of the editing secret; the secret itself stays with whoever published the link */
  secretHash: string;
  publishedAt: number;
  page: PageDoc;
}

const ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function token(len: number) {
  const bytes = randomBytes(len);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export const newId = () => token(10);
export const newSecret = () => token(32);
export const hashSecret = (s: string) => createHash("sha256").update(s).digest("hex");
export const shareKey = (id: string) => `shares/${id}.json`;
export const validId = (id: unknown): id is string => typeof id === "string" && /^[A-Za-z0-9]{10}$/.test(id);

/** Images may only point at the app's own example files or at stored share files. */
function safeSrc(src: unknown): string | undefined {
  if (typeof src !== "string") return undefined;
  if (src.startsWith("/examples/") || src.startsWith("/share/file/")) return src;
  if (/^https:\/\/[a-z0-9.-]+\.blob\.vercel-storage\.com\//i.test(src)) return src;
  return undefined;
}

function scrub(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(scrub);
  if (node && typeof node === "object") {
    const o = node as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(o)) out[k] = scrub(v);
    if ("alt" in o && "id" in o) {
      // an image slot: the viewer has no access to the publisher's browser storage
      out.id = null;
      const src = safeSrc(o.src);
      if (src) out.src = src;
      else delete out.src;
    }
    return out;
  }
  if (typeof node === "string") return node.slice(0, 5000);
  return node;
}

/** Returns a clean copy of the page, or null when it is not a page from this app. */
export function cleanPage(input: unknown): PageDoc | null {
  const p = input as PageDoc;
  if (!p || typeof p !== "object" || typeof p.name !== "string" || !Array.isArray(p.modules)) return null;
  if (p.modules.length > 40) return null;
  if (!p.modules.every((m) => m && typeof m === "object" && m.type in MODULES && typeof m.data === "object")) return null;
  const page = scrub(p) as PageDoc & { share?: unknown };
  delete page.share;
  return page;
}
