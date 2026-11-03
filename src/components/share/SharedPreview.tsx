"use client";

import { useRef, useState } from "react";
import { PageRenderer } from "@/components/page/PageRenderer";
import "@/components/page/page.css";
import { fitScreen, fitStyle, useRoom } from "@/lib/devices";
import type { PageDoc, Viewport } from "@/lib/types";
import "./share.css";

const SIZES: { id: Viewport; label: string; d: string }[] = [
  { id: "desktop", label: "Desktop", d: "M2.5 3.5h15v10h-15zM7 17h6M10 13.5V17" },
  { id: "tablet", label: "Tablet", d: "M4.5 2.5h11v15h-11zM9 15h2" },
  { id: "phone", label: "Phone", d: "M6 2.5h8v15H6zM9.2 15h1.6" },
];

/** Read-only page for people the link was shared with. */
export function SharedPreview({ page, updated }: { page: PageDoc; updated: string }) {
  const [picked, setSize] = useState<Viewport | null>(null);
  const body = useRef<HTMLDivElement>(null);
  const room = useRoom(body);
  // Until a size is picked, show the view that matches the visitor's screen
  const size: Viewport = picked ?? (!room || room >= 1100 ? "desktop" : room >= 600 ? "tablet" : "phone");
  // Desktop fills a wide window however wide it is. On a phone (no size switch) the page is
  // simply drawn at the phone's own width.
  const fit = room && room <= 560 ? { width: room, zoom: 1 } : fitScreen(size, room, { desktopMax: Infinity, nested: false });
  return (
    <div className="sv">
      <header className="sv-bar">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="sv-bar__logo" src="/brand/agenics-logo-reversed-cyan.svg" alt="Agenics Labs" />
        <div className="sv-bar__title">
          <b>{page.name}</b>
          <span>Draft preview · updated {updated}</span>
        </div>
        <span className="sv-bar__spacer" />
        <div className="sv-sizes" role="group" aria-label="Screen size">
          {SIZES.map((s) => (
            <button key={s.id} type="button" aria-pressed={size === s.id} aria-label={s.label} title={s.label} onClick={() => setSize(s.id)}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={s.d} />
              </svg>
            </button>
          ))}
        </div>
      </header>
      <div ref={body} className="sv-body">
        <main className={`sv-stage sv-stage--${size}`} style={fitStyle(fit)}>
          <PageRenderer page={page} editing={false} specs={false} />
        </main>
      </div>
    </div>
  );
}
