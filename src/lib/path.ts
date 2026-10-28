/* eslint-disable @typescript-eslint/no-explicit-any */

/** Read a value at a dotted path such as "cards.0.bullets.2". */
export function getAt(obj: any, path: string): any {
  if (!path) return obj;
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

/** Immutable set at a dotted path; clones each container along the way. */
export function setAt<T>(obj: T, path: string, value: any): T {
  const keys = path.split(".");
  const root: any = Array.isArray(obj) ? [...(obj as any)] : { ...(obj as any) };
  let cur = root;
  let src: any = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    const next = src?.[k];
    cur[k] = Array.isArray(next) ? [...next] : { ...(next ?? {}) };
    cur = cur[k];
    src = next;
  }
  cur[keys[keys.length - 1]] = value;
  return root;
}

/** "cards.0.bullets.2" -> "cards.*.bullets.*" */
export function toPattern(path: string): string {
  return path
    .split(".")
    .map((s) => (/^\d+$/.test(s) ? "*" : s))
    .join(".");
}

/** Expand a pattern against data into concrete paths. */
export function expand(pattern: string, data: any): string[] {
  const parts = pattern.split(".");
  const out: string[] = [];
  const walk = (node: any, i: number, acc: string[]) => {
    if (i === parts.length) {
      out.push(acc.join("."));
      return;
    }
    const p = parts[i];
    if (p === "*") {
      if (!Array.isArray(node)) return;
      node.forEach((child, idx) => walk(child, i + 1, [...acc, String(idx)]));
    } else {
      if (node == null || !(p in node)) return;
      walk(node[p], i + 1, [...acc, p]);
    }
  };
  walk(data, 0, []);
  return out;
}

/** "cards.1.bullets.0" -> "2.1"; "cta1" -> "" (only numeric path segments count). */
export function itemNumber(path: string): string {
  return path
    .split(".")
    .filter((s) => /^\d+$/.test(s))
    .map((s) => String(Number(s) + 1))
    .join(".");
}

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** A short section anchor from a heading: whole words, at most 32 characters. */
export function anchorFor(heading: string): string {
  const words = slugify(heading).split("-").filter(Boolean);
  let out = "";
  for (const w of words.slice(0, 5)) {
    const next = out ? `${out}-${w}` : w;
    if (next.length > 32) break;
    out = next;
  }
  return out || "section";
}

export function countWords(s: string): number {
  const t = s.trim();
  return t ? t.split(/\s+/).length : 0;
}
