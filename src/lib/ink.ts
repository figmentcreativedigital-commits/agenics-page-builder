import type { Bg, TextColor } from "./types";

/*
  Text colors (Corporate Graphic Standards: type is set in a primary or secondary color, or
  reversed). Body text can take one of these; headlines keep the color the brand sets.
  Which ones are offered depends on what the text sits on:
    light backgrounds (White, Silver 18%, Cyan 12%): Navy, AG Gray, Charcoal
    Navy: White, Cyan
  Cyan is never text on a light background (2.2:1 on white).
*/

export type Tone = "light" | "dark";

export const TEXT_COLORS: Record<TextColor, { label: string; hex: string; on: Tone }> = {
  navy: { label: "Navy", hex: "#004278", on: "light" },
  gray: { label: "AG Gray", hex: "#646B70", on: "light" },
  charcoal: { label: "Charcoal", hex: "#4A4A4C", on: "light" },
  white: { label: "White", hex: "#FFFFFF", on: "dark" },
  cyan: { label: "Cyan", hex: "#00BBF2", on: "dark" },
};

export const toneOf = (bg: Bg): Tone => (bg === "navy" ? "dark" : "light");

/** The colors offered for text on a light or dark surface. */
export function inksFor(tone: Tone): TextColor[] {
  return (Object.keys(TEXT_COLORS) as TextColor[]).filter((c) => TEXT_COLORS[c].on === tone);
}

/** May this color be used for text on this background? */
export function inkAllowed(color: TextColor, bg: Bg): boolean {
  return TEXT_COLORS[color]?.on === toneOf(bg);
}

/**
 * Keep picked text colors with their items when a list changes. `map` gives each old index
 * its new index, or -1 when the item is gone.
 */
export function remapColors(colors: Record<string, TextColor> | undefined, group: string, map: (i: number) => number) {
  if (!colors) return colors;
  const prefix = `${group}.`;
  const out: Record<string, TextColor> = {};
  for (const [path, c] of Object.entries(colors)) {
    if (!path.startsWith(prefix)) {
      out[path] = c;
      continue;
    }
    const rest = path.slice(prefix.length);
    const dot = rest.indexOf(".");
    const i = Number(dot < 0 ? rest : rest.slice(0, dot));
    if (!Number.isInteger(i)) {
      out[path] = c;
      continue;
    }
    const j = map(i);
    if (j >= 0) out[`${prefix}${j}${dot < 0 ? "" : rest.slice(dot)}`] = c;
  }
  return Object.keys(out).length ? out : undefined;
}
