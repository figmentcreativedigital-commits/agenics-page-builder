"use client";

/*
  Design tips in the builder: a small chip on the page where a graphic choice could be
  better, a card that shows the problem and offers fixes, and the same cards in Review.
  The rules live in lib/advice.
*/
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { adviseOn, type Advice, type Fix } from "@/lib/advice";
import { useImageUrl } from "@/lib/images";
import { TEXT_COLORS } from "@/lib/ink";
import { BACKGROUNDS } from "@/lib/modules";
import { getAt } from "@/lib/path";
import { activePage, useBuilder } from "@/lib/store";
import type { ImageVal } from "@/lib/types";
import { BG_SWATCH, Icon } from "./ui";

/** Every design tip for the page being edited. */
export function usePageAdvice(): Advice[] {
  const page = useBuilder((s) => activePage(s));
  return page ? adviseOn(page) : [];
}

const scrollToBlock = (uid: string) =>
  requestAnimationFrame(() => document.getElementById(`mod-${uid}`)?.scrollIntoView({ behavior: "smooth", block: "center" }));

/** Carry out a tip's fix. Changes to the page are one undo step and say so. */
function apply(fix: Fix) {
  const s = useBuilder.getState();
  const a = fix.action;
  if (a.kind === "restyle") {
    s.restyle(a.changes);
    const bg = a.changes.some((c) => c.patch.bg);
    s.showToast(!bg ? "Gaps tightened" : a.changes.length === 1 ? "Background changed" : "Backgrounds now alternate", true);
  } else if (a.kind === "replace") {
    s.select(a.uid);
    s.setLibrary({ uid: a.uid, path: a.path });
  } else if (a.kind === "crop") {
    s.select(a.uid);
    s.setPanel("right", true);
    s.requestCrop({ uid: a.uid, path: a.path });
  } else if (a.kind === "ink") {
    s.clearTextColors(a.uid, a.paths);
    s.showToast("Text is back to its standard color", true);
  }
}

/* ------------------------------------------------------------------ */
/* Pictures that explain the tip                                       */
/* ------------------------------------------------------------------ */

/** Blocks as stacked bands: neighbours with one background melt into one slab */
function RunPicture({ run }: { run: NonNullable<Advice["run"]> }) {
  const col = (bgs: string[], label: string) => (
    <figure className="pb-tip__run">
      <figcaption>{label}</figcaption>
      <div>
        {bgs.map((b, i) => (
          <span key={i} style={{ background: BG_SWATCH[b] }} className={b === "navy" ? "is-dark" : ""}>
            {run.names[i]}
          </span>
        ))}
      </div>
    </figure>
  );
  return (
    <div className="pb-tip__pic">
      {col(run.now, "Now")}
      {run.after ? (
        <>
          <Icon name="chevronDown" size={16} />
          {col(run.after, "Alternating")}
        </>
      ) : null}
    </div>
  );
}

/** The photo with its frame drawn where it lands; the rest is dimmed */
function CropPicture({ im, keep }: { im: ImageVal; keep: NonNullable<Advice["keep"]> }) {
  const stored = useImageUrl(im.id);
  const url = stored ?? (im.id ? null : im.src ?? null);
  const r = im.w && im.h ? im.w / im.h : 1;
  return (
    <div className="pb-tip__pic">
      <figure className="pb-tip__crop" style={{ aspectRatio: String(r) }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {url ? <img src={url} alt="" /> : null}
        <i className={keep.round ? "is-round" : ""} style={{ left: `${keep.x}%`, top: `${keep.y}%`, width: `${keep.w}%`, height: `${keep.h}%` }} />
        <figcaption>{Math.round(keep.shown * 100)}% shows</figcaption>
      </figure>
    </div>
  );
}

/** The picked color on its background, next to the standard one */
function InkPicture({ ink }: { ink: NonNullable<Advice["ink"]> }) {
  const bg = BACKGROUNDS[ink.bg];
  const standard = ink.bg === "navy" ? "#FFFFFF" : "#4A4A4C";
  const sample = (hex: string, label: string) => (
    <figure className="pb-tip__ink">
      <figcaption>{label}</figcaption>
      <div style={{ background: bg.hex, color: hex }} aria-hidden="true">
        Water testing
      </div>
    </figure>
  );
  return (
    <div className="pb-tip__pic">
      {sample(TEXT_COLORS[ink.color].hex, `${TEXT_COLORS[ink.color].label} on ${bg.label}`)}
      {sample(standard, "Standard")}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The card                                                            */
/* ------------------------------------------------------------------ */

export function AdviceCard({ advice, onDone, headingLevel = 3 }: { advice: Advice; onDone?: () => void; headingLevel?: 2 | 3 }) {
  const page = useBuilder((s) => activePage(s));
  const keepAdvice = useBuilder((s) => s.keepAdvice);
  const mod = page?.modules.find((m) => m.uid === advice.uid);
  const im = mod && advice.topic === "crop" && advice.path ? (getAt(mod.data, advice.path) as ImageVal | undefined) : undefined;
  const H = `h${headingLevel}` as "h2" | "h3";
  return (
    <div className="pb-tip">
      <H className="pb-tip__title">
        <Icon name="bulb" size={16} /> {advice.title}
      </H>
      {advice.run ? <RunPicture run={advice.run} /> : null}
      {advice.keep && im ? <CropPicture im={im} keep={advice.keep} /> : null}
      {advice.ink ? <InkPicture ink={advice.ink} /> : null}
      <p className="pb-tip__why">{advice.why}</p>
      <div className="pb-tip__fixes">
        {advice.fixes.map((f) => (
          <button
            key={f.label}
            type="button"
            className={`pb-btn pb-btn--sm ${f.primary ? "pb-btn--primary" : ""}`}
            onClick={() => {
              apply(f);
              onDone?.();
            }}
          >
            {f.label}
          </button>
        ))}
        <button
          type="button"
          className="pb-tip__keep"
          onClick={() => {
            keepAdvice(advice.id);
            onDone?.();
          }}
        >
          Keep as is
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The chip on the page, and its card                                  */
/* ------------------------------------------------------------------ */

function Popover({ anchor, onClose, children }: { anchor: HTMLElement; onClose: () => void; children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  // Placed under the chip (above it near the bottom of the screen), and kept with it as the page scrolls
  useLayoutEffect(() => {
    const place = () => {
      if (!anchor.isConnected) return onClose();
      const a = anchor.getBoundingClientRect();
      const w = box.current?.offsetWidth ?? 340;
      const h = box.current?.offsetHeight ?? 300;
      const left = Math.max(12, Math.min(window.innerWidth - w - 12, a.left + a.width / 2 - w / 2));
      const below = a.bottom + 8;
      const top = below + h > window.innerHeight - 12 ? Math.max(12, a.top - h - 8) : below;
      setPos({ left, top });
    };
    place();
    const onScroll = (e: Event) => {
      if (!box.current?.contains(e.target as Node)) place();
    };
    window.addEventListener("resize", place);
    document.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", place);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, [anchor, onClose]);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!box.current?.contains(t) && !anchor.contains(t)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        anchor.focus();
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [anchor, onClose]);
  // Once placed (and visible), the main fix takes focus, so Enter applies it
  const placed = !!pos;
  useEffect(() => {
    if (placed) box.current?.querySelector<HTMLElement>(".pb-btn--primary, button")?.focus({ preventScroll: true });
  }, [placed]);
  return createPortal(
    <div ref={box} className="pb-tippop" role="dialog" aria-label="Design tip" style={pos ? { left: pos.left, top: pos.top } : { visibility: "hidden" }}>
      {children}
    </div>,
    document.querySelector(".pb") ?? document.body,
  );
}

/** A tip's chip on the page. "seam" sits on the line between two blocks; "image" in the corner of a picture. */
export function AdviceChip({ advice, at }: { advice: Advice; at: "seam" | "image" }) {
  // The open chip is the popover's anchor
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const close = useCallback(() => setAnchor(null), []);
  return (
    <>
      <button
        type="button"
        className={`pb-tipchip pb-tipchip--${at}`}
        aria-haspopup="dialog"
        aria-expanded={!!anchor}
        title={advice.title}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          setAnchor(anchor ? null : e.currentTarget);
        }}
      >
        <Icon name="bulb" size={14} />
        <span>{advice.chip}</span>
      </button>
      {anchor ? (
        <Popover anchor={anchor} onClose={close}>
          <AdviceCard advice={advice} headingLevel={2} onDone={() => setAnchor(null)} />
        </Popover>
      ) : null}
    </>
  );
}

/** Tips that sit on the top edge of a block: its background run and its text colors */
export function SeamAdvice({ uid }: { uid: string }) {
  const tips = usePageAdvice().filter((a) => a.topic !== "crop" && a.uid === uid);
  if (!tips.length) return null;
  return (
    <div className="pb-tipseam">
      {tips.map((a) => (
        <AdviceChip key={a.id} advice={a} at="seam" />
      ))}
    </div>
  );
}

/** A tip about one picture, for the picture's corner */
export function ImageAdvice({ uid, path }: { uid: string; path: string }) {
  const tip = usePageAdvice().find((a) => a.topic === "crop" && a.uid === uid && a.path === path);
  return tip ? <AdviceChip advice={tip} at="image" /> : null;
}

/* ------------------------------------------------------------------ */
/* In Review                                                           */
/* ------------------------------------------------------------------ */

export function AdviceList() {
  const tips = usePageAdvice();
  const page = useBuilder((s) => activePage(s));
  const updatePage = useBuilder((s) => s.updatePage);
  const select = useBuilder((s) => s.select);
  const [open, setOpen] = useState<string | null>(null);
  const kept = page?.keep?.length ?? 0;
  if (!tips.length && !kept) return null;
  return (
    <div className="pb-issues pb-tips">
      <p className="pb-blocks__cat">Design tips</p>
      {tips.map((a) => {
        const isOpen = open === a.id;
        return (
          <div key={a.id} className={`pb-rgroup ${isOpen ? "is-open" : ""}`}>
            <button
              type="button"
              className="pb-rgroup__head"
              aria-expanded={isOpen}
              onClick={() => {
                setOpen(isOpen ? null : a.id);
                select(a.uid);
                scrollToBlock(a.uid);
              }}
            >
              <Icon name="bulb" size={14} />
              <b>{a.title}</b>
            </button>
            {isOpen ? <AdviceCard advice={a} onDone={() => setOpen(null)} /> : null}
          </div>
        );
      })}
      {kept ? (
        <button type="button" className="pb-tips__again" onClick={() => updatePage({ keep: [] })}>
          Show {kept} tip{kept > 1 ? "s" : ""} kept as is
        </button>
      ) : null}
    </div>
  );
}
