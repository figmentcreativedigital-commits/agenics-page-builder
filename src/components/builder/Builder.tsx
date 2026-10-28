"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { checkPage } from "@/lib/checks";
import { downloadBrief, downloadHandoffZip, downloadPageJson, importPageJson } from "@/lib/exporters";
import { activePage, useBuilder } from "@/lib/store";
import type { Viewport } from "@/lib/types";
import "../page/page.css";
import "./builder.css";
import { Canvas } from "./Canvas";
import { Inspector } from "./Inspector";
import { LeftPanel } from "./LeftPanel";

function ExportMenu() {
  const page = useBuilder((s) => activePage(s));
  const addPage = useBuilder((s) => s.addPage);
  const toast = useBuilder((s) => s.showToast);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!page) return null;
  const run = (fn: () => unknown) => async () => {
    setOpen(false);
    try {
      await fn();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Export failed");
    }
  };

  return (
    <div className="pb-menu" ref={ref}>
      <button type="button" className="pb-btn pb-btn--primary" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        Export ▾
      </button>
      {open ? (
        <div className="pb-menu__list" role="menu">
          <button type="button" role="menuitem" onClick={run(() => downloadHandoffZip(page))}>
            Handoff package (.zip)
            <small>Content brief, renamed images and the page file, for the Squarespace build</small>
          </button>
          <button type="button" role="menuitem" onClick={run(() => downloadBrief(page))}>
            Content brief (.md)
            <small>Every slot, link and alt text, module by module</small>
          </button>
          <button type="button" role="menuitem" onClick={run(() => downloadPageJson(page))}>
            Page file (.json)
            <small>The whole page with its images, to open in another browser</small>
          </button>
          <hr />
          <button type="button" role="menuitem" onClick={() => file.current?.click()}>
            Import page file…
            <small>Open a .page.json exported from this app</small>
          </button>
          <a role="menuitem" href="/preview" target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>
            Open preview in a new tab
            <small>The clean page, as visitors would see it</small>
          </a>
        </div>
      ) : null}
      <input
        ref={file}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          setOpen(false);
          if (!f) return;
          try {
            const p = await importPageJson(f);
            addPage(p);
            toast(`Imported “${p.name}”`);
          } catch (err) {
            toast(err instanceof Error ? err.message : "Import failed");
          }
        }}
      />
    </div>
  );
}

function TopBar() {
  const page = useBuilder((s) => activePage(s));
  const updatePage = useBuilder((s) => s.updatePage);
  const viewport = useBuilder((s) => s.viewport);
  const setViewport = useBuilder((s) => s.setViewport);
  const showSpecs = useBuilder((s) => s.showSpecs);
  const toggleSpecs = useBuilder((s) => s.toggleSpecs);
  const preview = useBuilder((s) => s.preview);
  const setPreview = useBuilder((s) => s.setPreview);
  const canUndo = useBuilder((s) => s.past.length > 0 && s.past[s.past.length - 1].pageId === s.activeId);
  const canRedo = useBuilder((s) => s.future.length > 0 && s.future[s.future.length - 1].pageId === s.activeId);
  const undo = useBuilder((s) => s.undo);
  const redo = useBuilder((s) => s.redo);
  const issues = useMemo(() => (page ? checkPage(page) : []), [page]);
  const errors = issues.filter((i) => i.level === "error").length;

  const vps: { id: Viewport; label: string }[] = [
    { id: "desktop", label: "Desktop" },
    { id: "tablet", label: "Tablet" },
    { id: "phone", label: "Phone" },
  ];

  return (
    <header className="pb-top">
      <Link href="/" className="pb-brand" aria-label="Agenics Page Builder">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/agenics-logo-color.svg" alt="Agenics Labs" />
        <span>Page Builder</span>
      </Link>
      {page ? (
        <input className="pb-pagename" value={page.name} aria-label="Page name" onChange={(e) => updatePage({ name: e.target.value })} />
      ) : null}
      <span className="pb-spacer" />
      <div className="pb-seg" role="group" aria-label="Screen size">
        {vps.map((v) => (
          <button key={v.id} type="button" aria-pressed={viewport === v.id} onClick={() => setViewport(v.id)}>
            {v.label}
          </button>
        ))}
      </div>
      {!preview ? (
        <>
          <button type="button" className="pb-btn pb-icon" aria-label="Undo" title="Undo (⌘Z)" disabled={!canUndo} onClick={undo}>
            ↶
          </button>
          <button type="button" className="pb-btn pb-icon" aria-label="Redo" title="Redo (⌘⇧Z)" disabled={!canRedo} onClick={redo}>
            ↷
          </button>
          <button
            type="button"
            className={`pb-btn ${showSpecs ? "pb-btn--on" : ""}`}
            aria-pressed={showSpecs}
            onClick={toggleSpecs}
            title="Show the limit and file spec on every slot"
          >
            Specs
          </button>
          <span className={`pb-badge ${errors ? "pb-badge--err" : issues.length ? "pb-badge--warn" : ""}`} title="Page checks">
            {issues.length ? `${issues.length} checks` : "All checks pass"}
          </span>
        </>
      ) : null}
      <button type="button" className={`pb-btn ${preview ? "pb-btn--on" : ""}`} aria-pressed={preview} onClick={() => setPreview(!preview)}>
        {preview ? "Back to editing" : "Preview"}
      </button>
      <ExportMenu />
      <Link href="/specs" className="pb-btn" target="_blank">
        Spec sheet
      </Link>
    </header>
  );
}

function Toast() {
  const toast = useBuilder((s) => s.toast);
  const clear = useBuilder((s) => s.clearToast);
  const undo = useBuilder((s) => s.undo);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clear, 6000);
    return () => clearTimeout(t);
  }, [toast, clear]);
  if (!toast) return null;
  return (
    <div className="pb-toast" role="status">
      <span>{toast.msg}</span>
      {toast.undo ? (
        <button type="button" onClick={undo}>
          Undo
        </button>
      ) : null}
      <button type="button" aria-label="Dismiss" onClick={clear}>
        ✕
      </button>
    </div>
  );
}

export function Builder() {
  const [ready, setReady] = useState(false);
  const preview = useBuilder((s) => s.preview);

  useEffect(() => {
    Promise.resolve(useBuilder.persist.rehydrate()).then(() => {
      useBuilder.getState().seedIfEmpty();
      setReady(true);
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName);
      if (typing) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) useBuilder.getState().redo();
        else useBuilder.getState().undo();
      } else if (e.key === "Escape") {
        const s = useBuilder.getState();
        if (s.preview) s.setPreview(false);
        else s.select(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!ready) return <div className="pb-loading">Loading the page builder…</div>;

  return (
    <div className={`pb ${preview ? "pb--preview" : ""}`}>
      <TopBar />
      {!preview ? <LeftPanel /> : null}
      <Canvas />
      {!preview ? <Inspector /> : null}
      <Toast />
    </div>
  );
}
