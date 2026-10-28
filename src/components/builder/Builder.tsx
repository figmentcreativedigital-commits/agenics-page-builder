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
import { LeftPanel, NewPageDialog, type Tab } from "./LeftPanel";
import { Icon } from "./ui";

function useOutside(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, close]);
  return ref;
}

function ExportMenu() {
  const page = useBuilder((s) => activePage(s));
  const addPage = useBuilder((s) => s.addPage);
  const toast = useBuilder((s) => s.showToast);
  const [open, setOpen] = useState(false);
  const ref = useOutside(open, () => setOpen(false));
  const file = useRef<HTMLInputElement>(null);

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
      <button type="button" className="pb-btn pb-btn--cta" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Icon name="download" size={16} /> Export
      </button>
      {open ? (
        <div className="pb-menu__list" role="menu">
          <button type="button" role="menuitem" onClick={run(() => downloadHandoffZip(page))}>
            Handoff package (.zip)
            <small>Brief, renamed images and the page file, ready for the website build</small>
          </button>
          <button type="button" role="menuitem" onClick={run(() => downloadBrief(page))}>
            Content brief (.md)
            <small>Every word, link and image, block by block</small>
          </button>
          <button type="button" role="menuitem" onClick={run(() => downloadPageJson(page))}>
            Page file (.json)
            <small>Send the page to someone, or open it in another browser</small>
          </button>
          <hr />
          <button type="button" role="menuitem" onClick={() => file.current?.click()}>
            Open a page file…
            <small>A .page.json someone sent you</small>
          </button>
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
            toast(`Opened “${p.name}”`);
          } catch (err) {
            toast(err instanceof Error ? err.message : "Import failed");
          }
        }}
      />
    </div>
  );
}

function HelpMenu({ onShortcuts }: { onShortcuts: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useOutside(open, () => setOpen(false));
  return (
    <div className="pb-menu" ref={ref}>
      <button type="button" className="pb-topicon" aria-label="Help" title="Help" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Icon name="help" />
      </button>
      {open ? (
        <div className="pb-menu__list" role="menu">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onShortcuts();
            }}
          >
            Keyboard shortcuts
            <small>Press ? any time</small>
          </button>
          <a role="menuitem" href="/specs" target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>
            Spec sheet and brand rules
            <small>Every block, limit, color and icon</small>
          </a>
          <a role="menuitem" href="/preview" target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>
            Open preview in a new tab
            <small>The page as visitors will see it</small>
          </a>
        </div>
      ) : null}
    </div>
  );
}

function TopBar({ onReview, onShortcuts }: { onReview: () => void; onShortcuts: () => void }) {
  const page = useBuilder((s) => activePage(s));
  const updatePage = useBuilder((s) => s.updatePage);
  const viewport = useBuilder((s) => s.viewport);
  const setViewport = useBuilder((s) => s.setViewport);
  const showSpecs = useBuilder((s) => s.showSpecs);
  const toggleSpecs = useBuilder((s) => s.toggleSpecs);
  const preview = useBuilder((s) => s.preview);
  const setPreview = useBuilder((s) => s.setPreview);
  const savedAt = useBuilder((s) => s.savedAt);
  const canUndo = useBuilder((s) => s.past.length > 0 && s.past[s.past.length - 1].pageId === s.activeId);
  const canRedo = useBuilder((s) => s.future.length > 0 && s.future[s.future.length - 1].pageId === s.activeId);
  const undo = useBuilder((s) => s.undo);
  const redo = useBuilder((s) => s.redo);
  const issues = useMemo(() => (page ? checkPage(page) : []), [page]);
  const errors = issues.filter((i) => i.level === "error").length;
  const todo = new Set(issues.map((i) => i.moduleUid ?? "page")).size;

  const vps: { id: Viewport; label: string }[] = [
    { id: "desktop", label: "Desktop" },
    { id: "tablet", label: "Tablet" },
    { id: "phone", label: "Phone" },
  ];

  return (
    <header className="pb-top">
      <Link href="/" className="pb-brand" aria-label="Agenics Page Builder home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/agenics-logo-reversed-cyan.svg" alt="Agenics Labs" />
        <span>Page Builder</span>
      </Link>
      {page ? (
        <span className="pb-docname">
          <input className="pb-pagename" value={page.name} aria-label="Page name" onChange={(e) => updatePage({ name: e.target.value })} />
          <span className="pb-saved" title={savedAt ? `Saved in this browser at ${new Date(savedAt).toLocaleTimeString("en-US")}` : "Saved in this browser"}>
            <Icon name="review" size={14} /> Saved
          </span>
        </span>
      ) : null}
      <span className="pb-spacer" />
      <div className="pb-seg pb-seg--dark" role="group" aria-label="Screen size">
        {vps.map((v) => (
          <button key={v.id} type="button" aria-pressed={viewport === v.id} aria-label={v.label} title={v.label} onClick={() => setViewport(v.id)}>
            <Icon name={v.id} />
          </button>
        ))}
      </div>
      {!preview ? (
        <>
          <button type="button" className="pb-topicon" aria-label="Undo" title="Undo (⌘Z)" disabled={!canUndo} onClick={undo}>
            <Icon name="undo" />
          </button>
          <button type="button" className="pb-topicon" aria-label="Redo" title="Redo (⌘⇧Z)" disabled={!canRedo} onClick={redo}>
            <Icon name="redo" />
          </button>
          <button
            type="button"
            className={`pb-topbtn ${showSpecs ? "is-on" : ""}`}
            aria-pressed={showSpecs}
            onClick={toggleSpecs}
            title="Show the size limit on every text slot and image"
          >
            Guides
          </button>
          <button type="button" className={`pb-topbtn pb-review ${errors ? "is-err" : issues.length ? "is-warn" : "is-ok"}`} onClick={onReview} title="What is left to do">
            <Icon name="review" size={16} />
            {issues.length ? (errors ? `${errors} to fix` : `${todo} to finish`) : "Ready"}
          </button>
        </>
      ) : null}
      <button type="button" className={`pb-topbtn ${preview ? "is-on" : ""}`} aria-pressed={preview} onClick={() => setPreview(!preview)}>
        <Icon name="eye" size={16} /> {preview ? "Back to editing" : "Preview"}
      </button>
      <ExportMenu />
      <HelpMenu onShortcuts={onShortcuts} />
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
        <Icon name="close" size={14} />
      </button>
    </div>
  );
}

const SHORTCUTS: [string, string][] = [
  ["Undo / redo", "⌘Z · ⌘⇧Z"],
  ["Select the block above / below", "↑ · ↓"],
  ["Move the selected block", "⌥↑ · ⌥↓"],
  ["Duplicate the selected block", "⌘D"],
  ["Delete the selected block", "Delete"],
  ["Preview on / off", "P"],
  ["Deselect · close", "Esc"],
  ["This list", "?"],
];

function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => (e.key === "Escape" || e.key === "?") && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="pb-modal" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pb-dialog pb-dialog--sm" role="dialog" aria-modal="true" aria-labelledby="ks-title">
        <div className="pb-dialog__head">
          <h2 id="ks-title">Keyboard shortcuts</h2>
          <button type="button" className="pb-mini" aria-label="Close" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        <dl className="pb-keys">
          {SHORTCUTS.map(([what, keys]) => (
            <div key={what}>
              <dt>{what}</dt>
              <dd>
                {keys.split(" · ").map((k) => (
                  <kbd key={k}>{k}</kbd>
                ))}
              </dd>
            </div>
          ))}
        </dl>
        <p className="pb-dialog__sub">On Windows, use Ctrl for ⌘ and Alt for ⌥.</p>
      </div>
    </div>
  );
}

export function Builder() {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("add");
  const [newPage, setNewPage] = useState(false);
  const [keys, setKeys] = useState(false);
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
      if (document.querySelector(".pb-modal")) return;
      const s = useBuilder.getState();
      const mod = e.metaKey || e.ctrlKey;
      const sel = s.selectedUid;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) s.redo();
        else s.undo();
      } else if (mod && e.key.toLowerCase() === "d" && sel) {
        e.preventDefault();
        s.duplicateModule(sel);
      } else if ((e.key === "Delete" || e.key === "Backspace") && sel && !s.preview) {
        e.preventDefault();
        s.removeModule(sel);
      } else if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown") && sel) {
        e.preventDefault();
        s.moveModule(sel, e.key === "ArrowUp" ? -1 : 1);
      } else if (!mod && !e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown") && sel && !s.preview) {
        e.preventDefault();
        s.selectAdjacent(e.key === "ArrowUp" ? -1 : 1);
      } else if (!mod && e.key.toLowerCase() === "p") {
        s.setPreview(!s.preview);
      } else if (e.key === "?") {
        setKeys(true);
      } else if (e.key === "Escape") {
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
      <TopBar
        onReview={() => {
          useBuilder.getState().select(null);
          setTab("review");
        }}
        onShortcuts={() => setKeys(true)}
      />
      {!preview ? <LeftPanel tab={tab} setTab={setTab} onNewPage={() => setNewPage(true)} /> : null}
      <Canvas />
      {!preview ? <Inspector /> : null}
      <Toast />
      {newPage ? <NewPageDialog onClose={() => setNewPage(false)} /> : null}
      {keys ? <ShortcutsDialog onClose={() => setKeys(false)} /> : null}
    </div>
  );
}
