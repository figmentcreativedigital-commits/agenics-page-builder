import { IMAGE_KINDS, MODULES, bgOf, isShown, moduleFields } from "./modules";
import { countWords, getAt } from "./path";
import type { Bg, CtaVal, ImageVal, Limit, ModuleInstance, PageDoc } from "./types";

/** The color a section shows: its chosen background, or its fixed navy treatment. */
export function effectiveBg(m: ModuleInstance): Bg {
  if (m.type === "hero" || m.type === "proof" || m.type === "cta") return "navy";
  return bgOf(m) ?? "white";
}

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
    out.push({ level: "error", message: "The page is empty. Add a Hero block to start." });
    return out;
  }
  if (mods[0].type !== "hero") out.push({ level: "error", message: "Start the page with a Hero block." });
  if (mods[mods.length - 1].type !== "cta") out.push({ level: "error", message: "End the page with a Call to action block." });
  const heroes = mods.filter((m) => m.type === "hero");
  if (heroes.length > 1)
    out.push({ level: "error", message: `${heroes.length} Hero blocks. Keep one, so the page has one main headline (H1).`, moduleUid: heroes[1].uid });
  if (page.recipe !== "master") {
    if (mods.length > 10) out.push({ level: "warn", message: `${mods.length} blocks is long. Past ten, split the page in two.` });
    if (mods.length < 6 && page.recipe !== "blank")
      out.push({ level: "warn", message: `Only ${mods.length} blocks. Most pages use six to ten.` });
    if (page.recipe !== "hub" && !mods.some((m) => m.type === "proof"))
      out.push({ level: "warn", message: "No Testimonial yet. Pages that sell work better with one customer voice." });
  }

  // Page settings
  if (!page.slug) out.push({ level: "warn", message: "Give the page a web address in Page settings." });
  else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(page.slug))
    out.push({ level: "error", message: "Web address: use lowercase words joined by hyphens, like dental-water." });
  else if (/-(?=[a-z0-9]*\d)(?=[a-z0-9]*[a-z])[a-z0-9]{4,6}$/.test(page.slug))
    out.push({ level: "warn", message: "The web address ends in what looks like an auto-added code. Remove it." });
  if (!page.seoTitle) out.push({ level: "warn", message: "Write a Google title in Page settings (60 characters max)." });
  else if (page.seoTitle.length > 60)
    out.push({ level: "error", message: `Google title is ${page.seoTitle.length}/60 characters. Shorten it.` });
  if (!page.metaDescription) out.push({ level: "warn", message: "Write a Google description in Page settings (140–160 characters)." });
  else if (page.metaDescription.length < 140 || page.metaDescription.length > 160)
    out.push({ level: "warn", message: `Google description is ${page.metaDescription.length} characters; aim for 140–160.` });

  // In-page links must point at a section anchor that exists
  const anchors = new Set(mods.map((m) => m.anchor).filter(Boolean));
  const seen = new Set<string>();
  mods.forEach((m) => {
    if (!m.anchor) return;
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(m.anchor))
      out.push({ level: "error", moduleUid: m.uid, message: `${MODULES[m.type].name}: section link #${m.anchor} should be lowercase words joined by hyphens.` });
    if (seen.has(m.anchor)) out.push({ level: "error", moduleUid: m.uid, message: `Two sections use #${m.anchor}. Section links must be unique.` });
    seen.add(m.anchor);
  });
  const anchorProblem = (href: string) => {
    const h = href.trim();
    if (h.startsWith("#") && h.length > 1 && !anchors.has(h.slice(1))) return `points to ${h}, which is not a section on this page`;
    return null;
  };

  // Neighbouring sections with the same colored background blur into one
  const shades = mods.map(effectiveBg);
  for (let i = 1; i < mods.length; i++) {
    const a = shades[i - 1];
    if (a && a !== "white" && a === shades[i])
      out.push({
        level: "warn",
        moduleUid: mods[i].uid,
        message: `${MODULES[mods[i - 1].type].name} and ${MODULES[mods[i].type].name} are both ${a === "navy" ? "navy" : a === "cyan" ? "cyan" : "silver"}. Change one background, or use Tidy backgrounds.`,
      });
  }

  // Modules
  mods.forEach((m) => {
    const meta = MODULES[m.type];
    const tag = `${meta.name} (block ${mods.indexOf(m) + 1})`;
    let placeholders = 0;

    for (const group of meta.groups) {
      if (!isShown(m, group.key)) continue;
      const list = (getAt(m.data, group.key) as unknown[]) ?? [];
      if (list.length < group.recMin || list.length > group.recMax) {
        const range = group.recMin === group.recMax ? `${group.recMin}` : `${group.recMin}–${group.recMax}`;
        out.push({ level: "warn", moduleUid: m.uid, message: `${tag}: ${list.length} ${group.label}${list.length === 1 ? "" : "s"}; ${range} works best.` });
      }
    }

    // Fields hidden by the layout or removed by the editor are skipped by moduleFields
    for (const { path, spec } of moduleFields(m.type, m.variant, m.data, m.hidden)) {
      {
        const v = getAt(m.data, path);
        if (spec.kind === "text") {
          const s = String(v ?? "");
          if (!s.trim() && !spec.optional) out.push({ level: "warn", moduleUid: m.uid, path, message: `${tag}: ${spec.label} is empty.` });
          if (isPlaceholder(s)) placeholders++;
          const r = measure(s, spec.limit);
          if (r?.over) out.push({ level: "error", moduleUid: m.uid, path, message: `${tag}: ${spec.label} is ${r.used}/${r.max} ${r.unit}. Shorten it.` });
        } else if (spec.kind === "cta") {
          const c = (v ?? { label: "", href: "" }) as CtaVal;
          if (spec.optional && !c.label.trim()) continue;
          if (isPlaceholder(c.label)) placeholders++;
          const r = measure(c.label, spec.limit);
          if (r?.over) out.push({ level: "error", moduleUid: m.uid, path, message: `${tag}: ${spec.label} text is ${r.used}/${r.max} characters. Shorten it.` });
          const bad = badHref(c.href) ?? anchorProblem(c.href);
          if (bad) out.push({ level: "warn", moduleUid: m.uid, path, message: `${tag}: "${c.label}" ${bad}.` });
        } else if (spec.kind === "href") {
          const bad = badHref(String(v ?? "")) ?? anchorProblem(String(v ?? ""));
          if (bad) out.push({ level: "warn", moduleUid: m.uid, path, message: `${tag}: ${spec.label} ${bad}.` });
        } else if (spec.kind === "image") {
          const im = (v ?? { id: null, alt: "" }) as ImageVal;
          const k = IMAGE_KINDS[spec.image!];
          if (!im.id && !im.src) {
            out.push({ level: "warn", moduleUid: m.uid, path, message: `${tag}: ${spec.label} needs an image (${k.ratio}).` });
            continue;
          }
          if (!im.alt.trim() && spec.image !== "doc")
            out.push({ level: "error", moduleUid: m.uid, path, message: `${tag}: ${spec.label} needs alt text (a one-line description for screen readers).` });
          if (im.w && im.h) {
            if (im.w < k.w * 0.75 || im.h < k.h * 0.75)
              out.push({ level: "warn", moduleUid: m.uid, path, message: `${tag}: ${spec.label} is small (${im.w}×${im.h}); use ${k.w}×${k.h} so it stays sharp.` });
            const ratio = im.w / im.h;
            if (Math.abs(ratio - k.r) / k.r > 0.08)
              out.push({ level: "warn", moduleUid: m.uid, path, message: `${tag}: ${spec.label} is not ${k.ratio}, so its edges will be cropped.` });
          }
        }
      }
    }
    if (placeholders)
      out.push({
        level: "warn",
        moduleUid: m.uid,
        message: `${tag}: ${placeholders} [bracketed] placeholder${placeholders > 1 ? "s" : ""} to replace.`,
      });
  });

  return out.sort((a, b) => (a.level === b.level ? 0 : a.level === "error" ? -1 : 1));
}
