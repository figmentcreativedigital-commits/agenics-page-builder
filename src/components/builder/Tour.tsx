"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { activePage, useBuilder } from "@/lib/store";
import { TOUR, TOUR_STEPS, markTourSeen, type TourTab } from "@/lib/tour";
import { Icon } from "./ui";

/* ============================================================
   GUIDED TOUR

   A spotlight on one part of the tool at a time, with a card that
   says what it does. The dim is the ring's own shadow, so the
   highlighted element stays lit and nothing on the page is covered
   or blocked. Steps name elements by selector and resolve them at
   run time; a step whose target isn't there is skipped.
   ============================================================ */

const CARD_W = 352;
const GAP = 14;
const PAD = 6;
const EDGE = 12;

type Box = { top: number; left: number; width: number; height: number };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function find(target?: string | string[]): HTMLElement | null {
  if (!target) return null;
  for (const sel of Array.isArray(target) ? target : [target]) {
    const el = document.querySelector<HTMLElement>(sel);
    if (el && el.getClientRects().length > 0) return el;
  }
  return null;
}

/** The element's box, padded, and clipped to the window so a tall target still gets a ring that fits. */
function boxOf(el: HTMLElement): Box {
  const r = el.getBoundingClientRect();
  const top = Math.max(EDGE / 2, r.top - PAD);
  const left = Math.max(EDGE / 2, r.left - PAD);
  const bottom = Math.min(window.innerHeight - EDGE / 2, r.bottom + PAD);
  const right = Math.min(window.innerWidth - EDGE / 2, r.right + PAD);
  return { top, left, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
}

const same = (a: Box | null, b: Box | null) =>
  !!a && !!b && Math.abs(a.top - b.top) < 0.5 && Math.abs(a.left - b.left) < 0.5 && Math.abs(a.width - b.width) < 0.5 && Math.abs(a.height - b.height) < 0.5;

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function Tour({ tab, setTab, onClose }: { tab: TourTab; setTab: (t: TourTab) => void; onClose: () => void }) {
  const [i, setI] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  /** True while a step is still finding its target, so the card never flashes for a step that gets skipped. */
  const [pending, setPending] = useState(false);
  const [menu, setMenu] = useState(false);
  const [cardH, setCardH] = useState(220);
  const [win, setWin] = useState(() => (typeof window === "undefined" ? { w: 0, h: 0 } : { w: window.innerWidth, h: window.innerHeight }));
  const cardRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  /** Which way the visitor is moving, so a missing step is skipped in that direction. */
  const dir = useRef(1);
  const run = useRef(0);
  /** How the tool looked when the tour began, to put it back if the tour is left early. */
  const startState = useRef<{ tab: TourTab; viewport: ReturnType<typeof useBuilder.getState>["viewport"] } | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const step = TOUR_STEPS[i];
  const last = i === TOUR_STEPS.length - 1;

  useEffect(() => {
    startState.current = { tab, viewport: useBuilder.getState().viewport };
    returnFocus.current = document.activeElement as HTMLElement | null;
    const size = () => setWin({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", size);
    return () => {
      window.removeEventListener("resize", size);
      delete document.documentElement.dataset.tourStep;
      returnFocus.current?.focus?.({ preventScroll: true });
    };
    // Captured once, when the tour opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const end = useCallback(
    (how: "finish" | "skip") => {
      markTourSeen();
      run.current++;
      if (how === "skip" && startState.current) {
        setTab(startState.current.tab);
        useBuilder.getState().setViewport(startState.current.viewport);
        if (i === 0) useBuilder.getState().showToast("You can take the tour any time with Tour, at the bottom of the left rail.");
      }
      onClose();
    },
    [i, onClose, setTab],
  );

  const go = useCallback(
    (n: number) => {
      if (n >= TOUR_STEPS.length) return end("finish");
      if (n < 0) return;
      markTourSeen(); // answered the first card: don't offer it again on the next visit
      dir.current = n >= i ? 1 : -1;
      setMenu(false);
      setI(n);
    },
    [end, i],
  );

  /* Set the tool up for the step, then find what it points at. */
  useEffect(() => {
    const token = ++run.current;
    const stale = () => run.current !== token;
    const skip = () => {
      const n = i + dir.current;
      if (n >= 0 && n < TOUR_STEPS.length) setI(n);
      else if (n >= TOUR_STEPS.length) end("finish");
      else setPending(false);
    };
    (async () => {
      setBox(null);
      setPending(!!step.target);
      const s = useBuilder.getState();
      const setup = step.setup ?? {};
      if (step.needsBlock && !activePage(s)?.modules.length) return skip();
      if (s.preview) s.setPreview(false);
      if (setup.viewport && s.viewport !== setup.viewport) s.setViewport(setup.viewport);
      // The tour points at both side panels: bring back any that were folded away
      if (s.focusMode) s.setFocusMode(false);
      if (step.id === "settings" && !s.panels.right) s.setPanel("right", true);
      if (setup.tab) {
        setTab(setup.tab);
        if (!s.panels.left) s.setPanel("left", true);
      }
      if (setup.select === "first") {
        const uid = activePage(s)?.modules[0]?.uid ?? null;
        if (uid && s.selectedUid !== uid) s.select(uid);
      } else if (setup.select === "none" && s.selectedUid) s.select(null);
      document.documentElement.dataset.tourStep = step.id;
      if (!step.target) return;

      // Let the panel or selection render, and give late content a moment
      let el: HTMLElement | null = null;
      for (let tries = 0; tries < 10 && !el; tries++) {
        await sleep(tries ? 90 : 40);
        if (stale()) return;
        el = find(step.target);
      }
      // Not on screen: move on in the same direction
      if (!el) return skip();
      const r = el.getBoundingClientRect();
      if (r.top < 60 || r.bottom > window.innerHeight - 16) {
        el.scrollIntoView({ block: r.height > window.innerHeight * 0.6 ? "start" : "center", behavior: reducedMotion() ? "auto" : "smooth" });
        await sleep(reducedMotion() ? 30 : 380);
        if (stale()) return;
      }
      setBox(boxOf(el));
      setPending(false);
    })();
    // Runs once per step; the step's own setup is what changes the tool
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  /* Keep the ring on its element while the page scrolls or a panel settles. */
  useEffect(() => {
    if (!box || !step.target) return;
    let raf = 0;
    const tick = () => {
      const el = find(step.target);
      if (el) {
        const b = boxOf(el);
        setBox((cur) => (same(cur, b) ? cur : b));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [box, step]);

  /* The card's real height feeds the placement maths; it changes with the copy. */
  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const h = el.offsetHeight;
      setCardH((cur) => (Math.abs(cur - h) > 2 ? h : cur));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* Each step puts focus on Next, so the keyboard and screen readers follow along. */
  useEffect(() => {
    nextRef.current?.focus({ preventScroll: true });
  }, [i]);

  /* Arrow keys and Escape belong to the tour while it runs (captured before the builder's own shortcuts). */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName);
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        if (menu) setMenu(false);
        else end("skip");
      } else if (!typing && e.key === "ArrowRight") {
        e.preventDefault();
        e.stopPropagation();
        go(i + 1);
      } else if (!typing && e.key === "ArrowLeft") {
        e.preventDefault();
        e.stopPropagation();
        go(i - 1);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [i, go, end, menu]);

  /* Card position: beside, below or above the ring, always fully on screen. */
  const card: CSSProperties = (() => {
    const vw = win.w || 1280;
    const vh = win.h || 800;
    const w = Math.min(CARD_W, vw - EDGE * 2);
    const clampTop = (t: number) => Math.max(EDGE, Math.min(t, vh - cardH - EDGE));
    const clampLeft = (l: number) => Math.max(EDGE, Math.min(l, vw - w - EDGE));
    if (!box || step.place === "center") return { width: w, left: (vw - w) / 2, top: clampTop((vh - cardH) / 2) };

    const roomRight = vw - (box.left + box.width) - GAP;
    const roomLeft = box.left - GAP;
    const below = vh - (box.top + box.height) - GAP;
    const above = box.top - GAP;
    const centered = clampLeft(box.left + box.width / 2 - w / 2);

    if (step.place === "right" && roomRight >= w + EDGE) return { width: w, left: box.left + box.width + GAP, top: clampTop(box.top + 24) };
    if (step.place === "left" && roomLeft >= w + EDGE) return { width: w, left: box.left - GAP - w, top: clampTop(box.top + 24) };
    if (step.place === "top" && above >= cardH + EDGE) return { width: w, left: centered, top: box.top - GAP - cardH };
    if (below >= cardH + EDGE) return { width: w, left: centered, top: box.top + box.height + GAP };
    if (above >= cardH + EDGE) return { width: w, left: centered, top: box.top - GAP - cardH };
    if (roomRight >= w + EDGE) return { width: w, left: box.left + box.width + GAP, top: clampTop(box.top + 24) };
    if (roomLeft >= w + EDGE) return { width: w, left: box.left - GAP - w, top: clampTop(box.top + 24) };
    return { width: w, left: centered, top: clampTop(vh - cardH - EDGE) };
  })();

  const chapter = TOUR.find((c) => c.id === step.chapter)!;
  const inChapter = chapter.steps.findIndex((s) => s.id === step.id) + 1;

  return (
    <div className="pb-tour" data-tour-ui>
      {box ? (
        <div className="pb-tour__ring" style={{ top: box.top, left: box.left, width: box.width, height: box.height }} />
      ) : (
        <div className="pb-tour__dim" />
      )}
      <div ref={cardRef} className={`pb-tour__card ${pending ? "is-pending" : ""}`} style={card} role="dialog" aria-labelledby="pb-tour-title" aria-describedby="pb-tour-body">
        <div className="pb-tour__top">
          <button type="button" className="pb-tour__chapter" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
            {step.label}
            {chapter.steps.length > 1 ? (
              <span>
                {" "}
                · {inChapter} of {chapter.steps.length}
              </span>
            ) : null}
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className={menu ? "is-open" : ""}>
              <path d="M2 3.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" className="pb-tour__x" aria-label="End the tour" title="End the tour (Esc)" onClick={() => end("skip")}>
            <Icon name="close" size={14} />
          </button>
        </div>

        {menu ? (
          <ul className="pb-tour__menu" aria-label="Jump to a part of the tour">
            {TOUR.map((c) => {
              const at = TOUR_STEPS.findIndex((s) => s.chapter === c.id);
              return (
                <li key={c.id}>
                  <button type="button" className={c.id === step.chapter ? "is-on" : undefined} onClick={() => go(at)}>
                    {c.label}
                    <small>
                      {c.steps.length} {c.steps.length === 1 ? "step" : "steps"}
                    </small>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}

        <h3 id="pb-tour-title">{step.title}</h3>
        <p id="pb-tour-body" className="pb-tour__body">
          {step.body}
        </p>
        {step.keys?.length ? (
          <p className="pb-tour__keys">
            {step.keys.map((k) => (
              <kbd key={k}>{k}</kbd>
            ))}
          </p>
        ) : null}

        <div className="pb-tour__foot">
          <span className="pb-tour__count" aria-live="polite">
            {i + 1} of {TOUR_STEPS.length}
          </span>
          <span className="pb-tour__acts">
            {i === 0 ? (
              <button type="button" className="pb-btn pb-btn--ghost" onClick={() => end("skip")}>
                Not now
              </button>
            ) : (
              <button type="button" className="pb-btn pb-btn--ghost" onClick={() => go(i - 1)}>
                Back
              </button>
            )}
            <button ref={nextRef} type="button" className="pb-btn pb-btn--primary" onClick={() => go(i + 1)}>
              {i === 0 ? "Show me around" : last ? "Finish" : "Next"}
            </button>
          </span>
        </div>
        <div className="pb-tour__rail" aria-hidden="true">
          <i style={{ width: `${((i + 1) / TOUR_STEPS.length) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
