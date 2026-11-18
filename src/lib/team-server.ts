/**
 * Cloud save access (server only). The team shares one passcode, set in Vercel as
 * TEAM_PASSCODE. Entering it once sets an httpOnly cookie on that browser; the
 * cookie holds an HMAC of the passcode, so changing the passcode signs everyone out.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { MODULES } from "./modules";
import type { PageDoc } from "./types";

export const TEAM_COOKIE = "apb_team";
export const CLOUD_FORMAT = "agenics-cloud@1";

const passcode = () => (process.env.TEAM_PASSCODE ?? "").trim();
export const teamConfigured = () => passcode().length > 0;

export const teamToken = () => createHmac("sha256", passcode()).update("agenics-page-builder:team:v1").digest("hex");

function same(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function checkPasscode(input: unknown): boolean {
  return teamConfigured() && typeof input === "string" && same(input.trim(), passcode());
}

export function isTeam(req: NextRequest): boolean {
  if (!teamConfigured()) return false;
  const c = req.cookies.get(TEAM_COOKIE)?.value;
  return !!c && same(c, teamToken());
}

/* ------------------------------------------------------------------ */
/* Stored pages: pages/<id>/<updatedAt>.json, tombstones deleted-<at>  */
/* ------------------------------------------------------------------ */

export const validPageId = (id: unknown): id is string => typeof id === "string" && /^[A-Za-z0-9_-]{6,64}$/.test(id);

export interface CloudDoc {
  format: typeof CLOUD_FORMAT;
  page: PageDoc;
  /** Uploaded image id → stored file URL, so another browser can fetch the bytes. */
  uploads: Record<string, string>;
  savedAt: number;
}

export interface CloudEntry {
  id: string;
  updatedAt: number;
  deleted?: boolean;
}

/** Parse "pages/<id>/<n>.json" or "pages/<id>/deleted-<n>.json". */
export function parseKey(key: string): (CloudEntry & { key: string }) | null {
  const m = /^pages\/([A-Za-z0-9_-]{6,64})\/(deleted-)?(\d{1,16})\.json$/.exec(key);
  if (!m) return null;
  return { key, id: m[1], updatedAt: Number(m[3]), deleted: !!m[2] || undefined };
}

export const pageKey = (id: string, updatedAt: number) => `pages/${id}/${updatedAt}.json`;
export const tombstoneKey = (id: string, at: number) => `pages/${id}/deleted-${at}.json`;

/** The newest entry per page id. */
export function latest(keys: string[]): Map<string, CloudEntry & { key: string }> {
  const out = new Map<string, CloudEntry & { key: string }>();
  for (const k of keys) {
    const e = parseKey(k);
    if (!e) continue;
    const cur = out.get(e.id);
    // A tombstone wins a tie, so a delete is never undone by an older save
    if (!cur || e.updatedAt > cur.updatedAt || (e.updatedAt === cur.updatedAt && e.deleted)) out.set(e.id, e);
  }
  return out;
}

const SAFE_URL = /^(\/share\/file\/[A-Za-z0-9/._-]+|https:\/\/[a-z0-9.-]+\.blob\.vercel-storage\.com\/[^\s"'<>]+)$/i;

/** A page as the builder saves it, or null. Keeps the share secret: cloud storage is team-only. */
export function cleanCloudPage(input: unknown, id: string): PageDoc | null {
  const p = input as PageDoc;
  if (!p || typeof p !== "object" || p.id !== id) return null;
  if (typeof p.name !== "string" || !Array.isArray(p.modules) || p.modules.length > 40) return null;
  if (typeof p.updatedAt !== "number" || !Number.isFinite(p.updatedAt) || p.updatedAt <= 0) return null;
  if (!p.modules.every((m) => m && typeof m === "object" && m.type in MODULES && typeof m.data === "object")) return null;
  // Who saved it last: a short first name typed when cloud save was turned on
  if (p.editedBy !== undefined && (typeof p.editedBy !== "string" || p.editedBy.length > 40)) return null;
  return p;
}

export function cleanUploads(input: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!input || typeof input !== "object") return out;
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (/^[A-Za-z0-9_-]{6,64}$/.test(k) && typeof v === "string" && SAFE_URL.test(v)) out[k] = v;
  }
  return out;
}
