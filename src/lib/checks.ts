import { IMAGE_KINDS, MODULES, moduleFields } from "./modules";
import { countWords, getAt } from "./path";
import type { CtaVal, ImageVal, Limit, PageDoc } from "./types";

export type Issue = {
  level: "error" | "warn";
  message: string;
  moduleUid?: string;
  path?: string;
};

const PLACEHOLDER = /\[[^\]]*\]/;

export function measure(value: string, limit?: Limit): { used: number; max: number; unit: string; over: boolean } | null {
  if (!limit) return null;
  if (limit.chars) {
    const used = value.length;
    return { used, max: limit.chars, unit: "characters", over: used > limit.chars };
  }
  if (limit.words) {
    const used = countWords(value);
    return { used, max: limit.words, unit: "words", over: used > limit.words };
  }
  return null;
}

export function isPlaceholder(v: string) {
  return PLACEHOLDER.test(v);
}

/** Links that go nowhere: empty, "#", or a bare category page. */
export function badHref(href: string): string | null {
  const h = (href || "").trim();
  if (!h || h === "#") return "has no link";
  return null;
}

export function checkPage(page: PageDoc): Issue[] {
  const out: Issue[] = [];
  const mods = page.modules;

  // Page structure
  if (!mods.length) {
    out.push({ level: "error", message: "The page has no modules." });
    return out;
  }
  if (mods[0].type !== "hero") out.push({ level: "error", message: "Start the page with M01 Hero." });
  if (mods[mods.length - 1].type !== "cta") out.push({ level: "error", message: "End the page with M11 CTA band." });
  const heroes = mods.filter((m) => m.type === "hero");
  if (heroes.length > 1)
    out.push({ level: "error", message: `${heroes.length} heroes on the page. Keep one, so the page has one H1.`, moduleUid: heroes[1].uid });
  if (page.recipe !== "master") {
    if (mods.length > 9) out.push({ level: "warn", message: `${mods.length} modules. Past nine, split the page in two.` });
    if (mods.length < 6 && page.recipe !== "blank")
      out.push({ level: "warn", message: `Only ${mods.length} modules. Most recipes use six to nine.` });
    if (page.recipe !== "hub" && !mods.some((m) => m.type === "proof"))
      out.push({ level: "warn", message: "No M07 Proof. Sales pages need one customer voice." });
  }

  // Page settings
  if (!page.slug) out.push({ level: "warn", message: "Set the URL slug in Page settings." });
  else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(page.slug))
    out.push({ level: "error", message: "URL slug: lowercase words joined by hyphens only." });
  else if (/-(?=[a-z0-9]*\d)(?=[a-z0-9]*[a-z])[a-z0-9]{4,6}$/.test(page.slug))
    out.push({ level: "warn", message: "URL slug ends in what looks like an auto-added suffix. Remove it." });
  if (!page.seoTitle) out.push({ level: "warn", message: "Write an SEO title (60 characters max)." });
  else if (page.seoTitle.length > 60)
    out.push({ level: "error", message: `SEO title is ${page.seoTitle.length}/60 characters.` });
  if (!page.metaDescription) out.push({ level: "warn", message: "Write a meta description (140–160 characters)." });
  else if (page.metaDescription.length < 140 || page.metaDescription.length > 160)
    out.push({ level: "warn", message: `Meta description is ${page.metaDescription.length} characters; aim for 140–160.` });

  // Modules
  mods.forEach((m) => {
    const meta = MODULES[m.type];
    const tag = `${meta.code} ${meta.name}`;
    let placeholders = 0;

    for (const group of meta.groups) {
      const list = (getAt(m.data, group.key) as unknown[]) ?? [];
      if (list.length < group.recMin || list.length > group.recMax) {
        const range = group.recMin === group.recMax ? `${group.recMin}` : `${group.recMin}–${group.recMax}`;
        out.push({ level: "warn", moduleUid: m.uid, message: `${tag}: ${list.length} ${group.label}s; ${range} recommended.` });
      }
    }

    // Fields hidden by the layout variant are skipped by moduleFields
    for (const { path, spec } of moduleFields(m.type, m.variant, m.data)) {
      {
        const v = getAt(m.data, path);
        if (spec.kind === "text") {
          const s = String(v ?? "");
          if (!s.trim() && !spec.optional) out.push({ level: "warn", moduleUid: m.uid, path, message: `${tag}: ${spec.label} is empty.` });
          if (isPlaceholder(s)) placeholders++;
          const r = measure(s, spec.limit);
          if (r?.over) out.push({ level: "error", moduleUid: m.uid, path, message: `${tag}: ${spec.label} is ${r.used}/${r.max} ${r.unit}.` });
        } else if (spec.kind === "cta") {
          const c = (v ?? { label: "", href: "" }) as CtaVal;
          if (spec.optional && !c.label.trim()) continue;
          if (isPlaceholder(c.label)) placeholders++;
          const r = measure(c.label, spec.limit);
          if (r?.over) out.push({ level: "error", moduleUid: m.uid, path, message: `${tag}: ${spec.label} label is ${r.used}/${r.max} characters.` });
          const bad = badHref(c.href);
          if (bad) out.push({ level: "warn", moduleUid: m.uid, path, message: `${tag}: "${c.label}" ${bad}.` });
        } else if (spec.kind === "href") {
          const bad = badHref(String(v ?? ""));
          if (bad) out.push({ level: "warn", moduleUid: m.uid, path, message: `${tag}: ${spec.label} ${bad}.` });
        } else if (spec.kind === "image") {
          const im = (v ?? { id: null, alt: "" }) as ImageVal;
          const k = IMAGE_KINDS[spec.image!];
          if (!im.id) {
            out.push({ level: "warn", moduleUid: m.uid, path, message: `${tag}: ${spec.label} needs an image (${k.ratio}).` });
            continue;
          }
          if (!im.alt.trim() && spec.image !== "doc")
            out.push({ level: "error", moduleUid: m.uid, path, message: `${tag}: ${spec.label} has no alt text.` });
          if (im.w && im.h) {
            if (im.w < k.w * 0.75 || im.h < k.h * 0.75)
              out.push({ level: "warn", moduleUid: m.uid, path, message: `${tag}: ${spec.label} is ${im.w}×${im.h}; spec is ${k.w}×${k.h}.` });
            const ratio = im.w / im.h;
            if (Math.abs(ratio - k.r) / k.r > 0.08)
              out.push({ level: "warn", moduleUid: m.uid, path, message: `${tag}: ${spec.label} is not ${k.ratio} and will be cropped.` });
          }
        }
      }
    }
    if (placeholders)
      out.push({
        level: "warn",
        moduleUid: m.uid,
        message: `${tag}: ${placeholders} slot${placeholders > 1 ? "s" : ""} still hold [bracketed] placeholder copy.`,
      });
  });

  return out.sort((a, b) => (a.level === b.level ? 0 : a.level === "error" ? -1 : 1));
}
