/*
  Design tips: the graphic choices a page builder can get wrong without breaking a rule.
  Each tip says what is happening, why it matters, and offers fixes that can be applied with
  one click (or kept as is). Shown on the page where it applies and in Review under
  "Design tips". Pure functions: no DOM, so the rules are easy to test.

  The three rules:
    rhythm  the same background, block after block (White included)
    crop    a photo that loses a large share to its frame
    ink     a text color that does not belong on its background (cyan is never text on white)
*/
import { effectiveBg } from "./checks";
import { KEEP_ENOUGH, frameCrop, type FrameCrop } from "./crop";
import { TEXT_COLORS, inkAllowed, toneOf } from "./ink";
import { BACKGROUNDS, IMAGE_KINDS, MODULES, isShown, moduleFields } from "./modules";
import { getAt, itemNumber, toPattern } from "./path";
import type { Bg, ImageVal, ModuleInstance, ModuleStyle, PageDoc, Space, TextColor } from "./types";

export type FixAction =
  /** Change block styles in one step: backgrounds or spacing */
  | { kind: "restyle"; changes: { uid: string; patch: ModuleStyle }[] }
  /** Open the photo library (with upload) for one image slot */
  | { kind: "replace"; uid: string; path: string }
  /** Open Focus and zoom for one image */
  | { kind: "crop"; uid: string; path: string }
  /** Put pieces of text back to the color their background sets */
  | { kind: "ink"; uid: string; paths: string[] };

export type Fix = { label: string; action: FixAction; primary?: boolean };

export type Advice = {
  /** Stable while the situation lasts, so "Keep as is" sticks */
  id: string;
  topic: "rhythm" | "crop" | "ink";
  /** The block it belongs to; for rhythm, the second block of the run */
  uid: string;
  /** The image or text it is about, if any */
  path?: string;
  /** The short label on the page */
  chip: string;
  title: string;
  why: string;
  fixes: Fix[];
  /** Rhythm: the run of backgrounds now and after the main fix */
  run?: { names: string[]; now: Bg[]; after?: Bg[] };
  /** Crop: the part of the photo the frame keeps */
  keep?: FrameCrop & { frame: string };
  /** Ink: the color picked and the background it sits on */
  ink?: { color: TextColor; bg: Bg };
};

/** Desktop padding above and below a block's content, by spacing (page.css, at 1,280 px) */
const PAD: Record<Space, number> = { compact: 56, regular: 90, roomy: 128 };
/** Blocks with their own fixed treatment have no spacing setting */
const fixed = (m: ModuleInstance) => MODULES[m.type].backgrounds.length === 0;
const padOf = (m: ModuleInstance) => (m.type === "hero" || m.type === "cta" ? 0 : PAD[m.style?.space ?? "regular"]);

const COUNT = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
const count = (n: number) => COUNT[n] ?? String(n);
const shade = (bg: Bg) => (bg === "white" ? "white" : bg === "navy" ? "navy" : bg === "silver" ? "silver" : "cyan");

function share(n: number): string {
  if (n < 0.3) return "about a quarter";
  if (n < 0.4) return "about a third";
  if (n < 0.47) return "less than half";
  if (n < 0.56) return "about half";
  return `${Math.round(n * 100)}%`;
}

/* ------------------------------------------------------------------ */
/* Same background, block after block                                   */
/* ------------------------------------------------------------------ */

function rhythm(mods: ModuleInstance[]): Advice[] {
  const out: Advice[] = [];
  const shades = mods.map(effectiveBg);
  let i = 0;
  while (i < mods.length) {
    let j = i;
    while (j + 1 < mods.length && shades[j + 1] === shades[i]) j++;
    if (j > i) {
      const run = mods.slice(i, j + 1);
      const bg = shades[i];
      // The widest join in the run, at desktop
      const gap = Math.max(...run.slice(1).map((m, k) => padOf(run[k]) + padOf(m)));

      // Main fix: every second block takes a quiet alternate it allows. White runs take
      // Silver 18% first; Cyan 12% is the page's one highlight, so it is the last resort.
      const after = [...shades];
      const changes: { uid: string; patch: ModuleStyle }[] = [];
      const prefer: Bg[] = bg === "white" ? ["silver", "cyan"] : bg === "silver" ? ["white", "cyan"] : ["white", "silver", "cyan"];
      const place = (k: number) => {
        if (fixed(mods[k])) return false;
        const allowed = MODULES[mods[k].type].backgrounds;
        const pick = prefer.find((b) => allowed.includes(b) && b !== after[k - 1] && b !== after[k + 1] && (b !== "cyan" || !after.includes("cyan")));
        if (!pick) return false;
        after[k] = pick;
        changes.push({ uid: mods[k].uid, patch: { bg: pick } });
        return true;
      };
      for (let k = i + 1; k <= j; k += 2) {
        // When the second block of a pair can't change, the first one may
        if (!place(k) && k === i + 1 && j === i + 1) place(i);
      }
      // Tighter gaps: compact spacing on every block of the run that has a spacing setting
      const loosen = run.filter((m) => !fixed(m) && (m.style?.space ?? "regular") !== "compact");
      const tighter = Math.max(...run.slice(1).map((m, k) => (loosen.includes(run[k]) ? PAD.compact : padOf(run[k])) + (loosen.includes(m) ? PAD.compact : padOf(m))));

      const fixes: Fix[] = [];
      if (changes.length)
        fixes.push({
          label: changes.length === 1 ? "Alternate the backgrounds" : `Alternate the backgrounds (${changes.length} blocks)`,
          action: { kind: "restyle", changes },
          primary: true,
        });
      if (bg !== "navy" && loosen.length && tighter < gap)
        fixes.push({
          label: `Tighten the gaps (${gap} to ${tighter} px)`,
          action: { kind: "restyle", changes: loosen.map((m) => ({ uid: m.uid, patch: { space: "compact" } })) },
          primary: !changes.length,
        });
      // Two light blocks with compact spacing on either side sit close enough: a choice, not a problem.
      // Two navy blocks read as one whatever the spacing. Blocks with a fixed navy treatment
      // (Testimonial, then Call to action) have nothing to change, so they get no tip.
      if (fixes.length && (bg === "navy" || gap > PAD.compact + PAD.regular))
        out.push({
          id: `rhythm:${run.map((m) => m.uid).join(",")}:${bg}`,
          topic: "rhythm",
          uid: run[1].uid,
          chip: `${count(run.length)} ${shade(bg)} in a row`,
          title: `${count(run.length)} ${shade(bg)} blocks in a row`,
          why:
            bg === "navy"
              ? `Navy blocks back to back read as one long block, and the page loses its strongest accent. Alternating backgrounds shows where each block starts.`
              : `Each block has its own space above and below, so back to back they leave up to ${gap} px of empty ${shade(bg)} between them and read as one long block. Alternating backgrounds shows where each block starts.`,
          fixes,
          run: { names: run.map((m) => MODULES[m.type].name), now: shades.slice(i, j + 1), after: changes.length ? after.slice(i, j + 1) : undefined },
        });
    }
    i = j + 1;
  }
  return out;
}

/** The same blocks with every run of one background alternating, as the main rhythm fix does. */
export function alternated(mods: ModuleInstance[]): ModuleInstance[] {
  const changes = rhythm(mods).flatMap((a) => (a.fixes[0]?.primary && a.fixes[0].action.kind === "restyle" ? a.fixes[0].action.changes : []));
  if (!changes.some((c) => c.patch.bg)) return mods;
  return mods.map((m) => {
    const c = changes.find((x) => x.uid === m.uid && x.patch.bg);
    return c ? { ...m, style: { ...m.style, bg: c.patch.bg } } : m;
  });
}

/* ------------------------------------------------------------------ */
/* A photo that loses a large share to its frame                        */
/* ------------------------------------------------------------------ */

function crops(m: ModuleInstance): Advice[] {
  // The hero photo runs edge to edge behind the headline: its crop follows the screen, not a frame
  if (m.type === "hero") return [];
  const meta = MODULES[m.type];
  const out: Advice[] = [];
  for (const { path, spec } of moduleFields(m.type, m.variant, m.data, m.hidden)) {
    if (spec.kind !== "image" || !spec.image) continue;
    const im = getAt(m.data, path) as ImageVal | undefined;
    const keep = frameCrop(im, spec.image);
    if (!keep || keep.kept >= KEEP_ENOUGH) continue;
    const k = IMAGE_KINDS[spec.image];
    const n = itemNumber(path);
    const name = `${spec.label}${n ? ` ${n}` : ""}`;
    const frame = keep.round ? "circle" : k.ratio;
    const zoomed = (im!.zoom ?? 1) > 1;
    out.push({
      id: `crop:${m.uid}:${path}:${im!.id ?? im!.src}:${im!.zoom ?? 1}`,
      topic: "crop",
      uid: m.uid,
      path,
      chip: `Shows ${Math.round(keep.shown * 100)}%`,
      title: `${meta.name}: the frame shows ${share(keep.shown)} of this photo`,
      why: `${name} sits in a ${keep.round ? "circle" : `${k.ratio} frame`} and this photo is ${keep.shape}${zoomed ? `, zoomed to ${Math.round((im!.zoom ?? 1) * 100)}%` : ""}, so its ${keep.wide ? "sides" : "top and bottom"} are cut off${keep.round ? " and the circle trims the corners" : ""}. A photo shot ${keep.round ? "square, with the face in the middle," : `at ${k.ratio}`} keeps the subject whole.`,
      keep: { ...keep, frame },
      fixes: [
        { label: keep.round ? "Choose a square photo" : `Choose a ${k.ratio} photo`, action: { kind: "replace", uid: m.uid, path }, primary: true },
        { label: "Adjust the crop", action: { kind: "crop", uid: m.uid, path } },
      ],
    });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* A text color that does not belong on its background                  */
/* ------------------------------------------------------------------ */

/** The picked colors that show: the ones allowed on the block's background. */
export function shownInk(m: Pick<ModuleInstance, "type" | "style" | "colors">, path: string): TextColor | undefined {
  const c = m.colors?.[path];
  return c && TEXT_COLORS[c] && inkAllowed(c, effectiveBg(m as ModuleInstance)) ? c : undefined;
}

function inks(m: ModuleInstance): Advice[] {
  if (!m.colors) return [];
  const bg = effectiveBg(m);
  const off = Object.entries(m.colors).filter(([path, c]) => TEXT_COLORS[c] && !inkAllowed(c, bg) && isShown(m, toPattern(path)) && getAt(m.data, path) !== undefined);
  if (!off.length) return [];
  const meta = MODULES[m.type];
  // One tip per color, so the sentence stays exact
  const byColor = new Map<TextColor, string[]>();
  off.forEach(([path, c]) => byColor.set(c, [...(byColor.get(c) ?? []), path]));
  return [...byColor].map(([color, paths]) => {
    const ink = TEXT_COLORS[color].label;
    const on = BACKGROUNDS[bg].label;
    const light = toneOf(bg) === "light";
    const navyOk = MODULES[m.type].backgrounds.includes("navy");
    const fixes: Fix[] = [{ label: light ? "Use the standard dark text" : "Use the standard white text", action: { kind: "ink", uid: m.uid, paths }, primary: true }];
    if (light && navyOk) fixes.push({ label: "Make the background navy", action: { kind: "restyle", changes: [{ uid: m.uid, patch: { bg: "navy" } }] } });
    return {
      id: `ink:${m.uid}:${color}:${bg}:${paths.join(",")}`,
      topic: "ink" as const,
      uid: m.uid,
      path: paths[0],
      chip: `${ink} text on ${shade(bg)}`,
      title: `${meta.name}: ${ink.toLowerCase()} text on a ${shade(bg)} background`,
      why:
        color === "cyan"
          ? `Cyan is never text on a light background: on ${on} it is too faint to read (2.2:1 on white). The page shows this text in its standard color until you choose.`
          : `${ink} text does not show on ${on}. The page shows this text in its standard color until you choose.`,
      fixes,
      ink: { color, bg },
    };
  });
}

/* ------------------------------------------------------------------ */

const cache = new WeakMap<PageDoc, Advice[]>();

/** Every design tip for a page, minus the ones kept as is. */
export function adviseOn(page: PageDoc): Advice[] {
  const hit = cache.get(page);
  if (hit) return hit;
  const kept = new Set(page.keep ?? []);
  const all = [...rhythm(page.modules), ...page.modules.flatMap((m) => [...crops(m), ...inks(m)])].filter((a) => !kept.has(a.id));
  cache.set(page, all);
  return all;
}
