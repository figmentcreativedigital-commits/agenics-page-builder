"use client";

import { useLayoutEffect, useState, type CSSProperties, type RefObject } from "react";
import type { Viewport } from "./types";

/**
 * Screen widths each view is drawn at, in CSS pixels. The page is always laid out at the
 * real width (so desktop gets the full menu and multi-column layouts) and then scaled to
 * fit the space on screen, the way design tools show a canvas.
 */
export const SCREEN = { desktop: 1280, desktopMax: 1440, tablet: 834, phone: 390 } as const;

export const SCREEN_LABEL: Record<Viewport, string> = { desktop: "Desktop", tablet: "Tablet", phone: "Phone" };

/** Tablet and phone never take more than this share of the space, so the three views
 *  always read largest to smallest, even on a small laptop. */
const SHARE: Record<Viewport, number> = { desktop: 1, tablet: 0.8, phone: 0.55 };

export interface Fit {
  /** Layout width of the page, in CSS pixels. */
  width: number;
  /** How far it is scaled to fit on screen (1 = actual size). */
  zoom: number;
}

/**
 * `room` is the width available on screen. In the editor, tablet and phone keep to a share
 * of it (`nested`); on a shared link each view simply fills the visitor's window.
 */
export function fitScreen(viewport: Viewport, room: number, { desktopMax = SCREEN.desktopMax as number, nested = true } = {}): Fit {
  if (viewport === "desktop") {
    if (!room || room >= SCREEN.desktop) return { width: room ? Math.min(Math.floor(room), desktopMax) : SCREEN.desktop, zoom: 1 };
    return { width: SCREEN.desktop, zoom: round(room / SCREEN.desktop) };
  }
  const width = SCREEN[viewport];
  if (!room) return { width, zoom: 1 };
  return { width, zoom: round(Math.min(1, (room * (nested ? SHARE[viewport] : 1)) / width)) };
}

const round = (z: number) => Math.max(0.2, Math.floor(z * 1000) / 1000);

/** "fit" scales the page to the space on screen; a number shows it at that share of actual size. */
export type Zoom = "fit" | number;

/** The fixed zoom levels, smallest first. ⌘+ and ⌘− step through them; 100% is the most. */
export const ZOOM_STEPS = [0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1] as const;

/** The page at a chosen zoom: laid out at its real width (desktop 1280 to 1440 px), scrolled if wider than the space. */
export function fitZoom(viewport: Viewport, room: number, zoom: Zoom): Fit {
  if (zoom === "fit") return fitScreen(viewport, room);
  if (viewport !== "desktop") return { width: SCREEN[viewport], zoom };
  const width = room ? Math.round(Math.min(SCREEN.desktopMax, Math.max(SCREEN.desktop, room / zoom))) : SCREEN.desktop;
  return { width, zoom };
}

/** The next zoom level up or down from what is on screen now (which may be a fitted, in-between value). */
export function stepZoom(current: number, dir: 1 | -1): number {
  if (dir > 0) return ZOOM_STEPS.find((z) => z > current + 0.005) ?? 1;
  return [...ZOOM_STEPS].reverse().find((z) => z < current - 0.005) ?? ZOOM_STEPS[0];
}

/** Style for the element the page is drawn in. `--pb-unzoom` lets editing tools inside it stay full size. */
export function fitStyle(fit: Fit): CSSProperties {
  return { width: fit.width, zoom: fit.zoom, ["--pb-unzoom" as string]: String(round4(1 / fit.zoom)) };
}

const round4 = (n: number) => Math.round(n * 10000) / 10000;

/** The width available inside an element (its content box), kept up to date as it resizes. */
export function useRoom(ref: RefObject<HTMLElement | null>): number {
  const [room, setRoom] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => {
      const s = getComputedStyle(el);
      const w = el.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight);
      setRoom((r) => (Math.abs(r - w) < 1 ? r : w));
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return room;
}
