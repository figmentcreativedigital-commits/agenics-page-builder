import { IMAGE_KINDS } from "./modules";
import type { ImageKind, ImageVal } from "./types";

/*
  How a picture meets its frame. Photos fill the frame and are cropped to its shape; cut-outs
  (transparent background) are fitted inside it whole. The headshot frame is a circle.
*/

/**
 * Is this image a cut-out (transparent background)? Uploads are measured when added. Images
 * from before the check keep the look they had, so they count as photos.
 */
export function isCutout(im: ImageVal | undefined): boolean {
  if (!im || (!im.id && !im.src)) return false;
  return im.cutout === true;
}

/** "fill": cropped to the frame. "fit": shown whole inside it. */
export function fitOf(im: ImageVal | undefined, kind: ImageKind): "fill" | "fit" {
  return kind === "product" || isCutout(im) ? "fit" : "fill";
}

export type FrameCrop = {
  /** The part of the image the frame keeps, in % of the image */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Share of the image inside the frame's box, 0 to 1 */
  kept: number;
  /** Share of the image that shows, 0 to 1 (the circle's corners count as lost) */
  shown: number;
  /** The image's own shape, such as "16:9" */
  shape: string;
  wide: boolean;
  round: boolean;
};

/** "16:9" style label for a width/height ratio, from the common photo shapes */
function shapeName(r: number): string {
  const shapes: [number, string][] = [
    [16 / 9, "16:9"],
    [3 / 2, "3:2"],
    [4 / 3, "4:3"],
    [1, "square"],
    [4 / 5, "4:5"],
    [5 / 7, "5:7"],
    [2 / 3, "2:3"],
    [9 / 16, "9:16"],
    [2, "2:1"],
    [3, "3:1"],
  ];
  return shapes.reduce((best, s) => (Math.abs(Math.log(s[0] / r)) < Math.abs(Math.log(best[0] / r)) ? s : best))[1];
}

/** Below this share of the photo inside the frame, the crop is worth a design tip */
export const KEEP_ENOUGH = 0.6;

/** What a frame keeps of a photo that fills it. Null when the size is unknown or the image is fitted, not cropped. */
export function frameCrop(im: ImageVal | undefined, kind: ImageKind): FrameCrop | null {
  if (!im || (!im.id && !im.src) || !im.w || !im.h || fitOf(im, kind) === "fit") return null;
  const frame = IMAGE_KINDS[kind].r;
  const r = im.w / im.h;
  const zoom = Math.max(1, im.zoom ?? 1);
  const w = (r > frame ? frame / r : 1) / zoom;
  const h = (r > frame ? 1 : r / frame) / zoom;
  const round = kind === "headshot";
  const f = im.focus ?? { x: 50, y: 50 };
  return { x: (1 - w) * f.x, y: (1 - h) * f.y, w: w * 100, h: h * 100, kept: w * h, shown: w * h * (round ? Math.PI / 4 : 1), shape: shapeName(r), wide: r > frame, round };
}
