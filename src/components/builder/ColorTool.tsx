"use client";

import { useEffect, useRef, useState } from "react";
import { effectiveBg } from "@/lib/checks";
import { TEXT_COLORS, inksFor, toneOf, type Tone } from "@/lib/ink";
import { BACKGROUNDS } from "@/lib/modules";
import { useBuilder } from "@/lib/store";
import type { ModuleInstance, TextColor } from "@/lib/types";
import { Icon } from "./ui";

const slotEl = (uid: string, path: string) => document.querySelector<HTMLElement>(`[data-uid="${uid}"][data-path="${path}"]`);

/** Is the surface right behind a text slot light or dark? Read from the page, so cards inside a block count. */
function surfaceTone(el: HTMLElement): Tone | null {
  for (let n: HTMLElement | null = el; n && !n.classList.contains("pb-stage"); n = n.parentElement) {
    const c = getComputedStyle(n).backgroundColor.match(/[\d.]+/g)?.map(Number);
    if (!c || (c.length > 3 && c[3] < 0.5)) continue;
    const lum = (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
    return lum < 0.5 ? "dark" : "light";
  }
  return null;
}

/**
 * Text color for body text: the standard color for its background, or one of the brand
 * colors that belong on it. Headlines and buttons keep the color the brand sets, so they
 * get no menu. Cyan is offered on navy only.
 */
export function ColorTool({ mod, path }: { mod: ModuleInstance; path: string }) {
  const setTextColor = useBuilder((s) => s.setTextColor);
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLSpanElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const bg = effectiveBg(mod);
  const tone = toneOf(bg);
  // Offered only where the text sits on the block's own background (not on a card of another tone)
  // (read once: the tool is made again for each piece of text)
  const [ok] = useState(() => {
    const el = slotEl(mod.uid, path);
    return !!el && !/^H[1-6]$/.test(el.tagName) && surfaceTone(el) === tone;
  });

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!ok) return null;
  const picked = mod.colors?.[path] ?? null;
  const current = picked && TEXT_COLORS[picked]?.on === tone ? picked : null;
  const options: { id: TextColor | null; label: string; hex: string | null }[] = [
    { id: null, label: "Standard", hex: null },
    ...inksFor(tone).map((id) => ({ id, label: TEXT_COLORS[id].label, hex: TEXT_COLORS[id].hex })),
  ];
  const now = current ? TEXT_COLORS[current] : null;

  const pick = (id: TextColor | null, fromKeyboard: boolean) => {
    setTextColor(mod.uid, path, id);
    setOpen(false);
    if (fromKeyboard) slotEl(mod.uid, path)?.focus();
  };

  const onMenuKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>("button"));
    const at = items.indexOf(document.activeElement as HTMLButtonElement);
    const go = (i: number) => items[(i + items.length) % items.length]?.focus();
    // Keys stay in the menu, so Delete or the arrows never reach the page shortcuts
    e.stopPropagation();
    const to = { ArrowDown: at + 1, ArrowUp: at - 1, Home: 0, End: items.length - 1 }[e.key];
    if (to !== undefined) {
      e.preventDefault();
      go(to);
    } else if (e.key === "Escape" || e.key === "Tab") {
      e.preventDefault();
      setOpen(false);
      trigger.current?.focus();
    }
  };

  return (
    <span className="pb-elbar__color" ref={wrap}>
      <button
        ref={trigger}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Text color"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span className={`pb-swatch${now ? "" : " is-default"}`} style={now ? { background: now.hex } : undefined} aria-hidden="true" />
        <span>{now ? now.label : "Color"}</span>
        <Icon name="chevronDown" size={12} />
      </button>
      {open ? (
        <div
          className="pb-colormenu"
          role="menu"
          aria-label={`Text color on ${BACKGROUNDS[bg].label}`}
          onKeyDown={onMenuKey}
          ref={(el) => {
            // Opened from the keyboard: start on the color in use
            if (el && document.activeElement === trigger.current) el.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus();
          }}
        >
          {options.map((o) => (
            <button
              key={o.id ?? "default"}
              type="button"
              role="menuitemradio"
              aria-checked={current === o.id}
              title={o.id ? `${o.label} ${o.hex}` : `The color this text has on ${BACKGROUNDS[bg].label}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => pick(o.id, e.detail === 0)}
            >
              <span className={`pb-swatch${o.hex ? "" : " is-default"}`} style={o.hex ? { background: o.hex } : undefined} aria-hidden="true" />
              <span>{o.label}</span>
              {current === o.id ? <Icon name="check" size={14} /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </span>
  );
}
