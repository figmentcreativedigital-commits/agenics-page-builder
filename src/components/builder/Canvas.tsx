"use client";

import { useEffect, useRef, useState } from "react";
import { measure } from "@/lib/checks";
import { MODULES } from "@/lib/modules";
import { getAt } from "@/lib/path";
import { activePage, useBuilder } from "@/lib/store";
import type { ModuleInstance, ModuleType } from "@/lib/types";
import { elementFor, specFor } from "../page/edit";
import { PageRenderer } from "../page/PageRenderer";
import { BlockPicker, DRAG_TYPE } from "./Blocks";
import { Icon } from "./ui";

/* ------------------------------------------------------------------ */
/* "+" between blocks                                                  */
/* ------------------------------------------------------------------ */

function InsertPoint({ index, active }: { index: number; active: boolean }) {
  const add = useBuilder((s) => s.addModule);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={`pb-insert ${open ? "is-open" : ""} ${active ? "is-drop" : ""}`}>
      <span className="pb-insert__line" aria-hidden="true" />
      {active ? <span className="pb-insert__drop">Drop to add here</span> : null}
      <button type="button" className="pb-insert__btn" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Add a block here" title="Add a block here">
        <Icon name="plus" size={16} />
      </button>
      {open ? (
        <div className="pb-picker" role="dialog" aria-label="Add a block">
          <BlockPicker
            compact
            onPick={(t) => {
              add(t, index);
              setOpen(false);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Toolbar on the selected / hovered block                             */
/* ------------------------------------------------------------------ */

function FrameBar({ mod, index, total }: { mod: ModuleInstance; index: number; total: number }) {
  const meta = MODULES[mod.type];
  const move = useBuilder((s) => s.moveModule);
  const dup = useBuilder((s) => s.duplicateModule);
  const remove = useBuilder((s) => s.removeModule);
  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };
  const removed = mod.hidden?.filter((h) => meta.elements.some((e) => e.id === h)).length ?? 0;
  return (
    <div className="pb-frame__bar" onClick={(e) => e.stopPropagation()}>
      <strong>{meta.name}</strong>
      {removed ? (
        <span className="pb-frame__chip" title="Hidden elements can be turned back on in the Show / hide tab">
          {removed} hidden
        </span>
      ) : null}
      <button type="button" title="Move up" aria-label="Move up" disabled={index === 0} onClick={stop(() => move(mod.uid, -1))}>
        <Icon name="up" size={16} />
      </button>
      <button type="button" title="Move down" aria-label="Move down" disabled={index === total - 1} onClick={stop(() => move(mod.uid, 1))}>
        <Icon name="down" size={16} />
      </button>
      <button type="button" title="Duplicate (⌘D)" aria-label="Duplicate block" onClick={stop(() => dup(mod.uid))}>
        <Icon name="copy" size={16} />
      </button>
      <button type="button" title="Delete (Delete key)" aria-label="Delete block" onClick={stop(() => remove(mod.uid))}>
        <Icon name="trash" size={16} />
      </button>
    </div>
  );
}

function NoteBadge({ mod }: { mod: ModuleInstance }) {
  if (!mod.note) return null;
  return (
    <div className="pb-note">
      <Icon name="note" size={14} />
      <span>
        <b>Note for the team:</b> {mod.note}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Floating bar over the text being edited: name, count, remove        */
/* ------------------------------------------------------------------ */

function ElementBar() {
  const focus = useBuilder((s) => s.focus);
  const page = useBuilder((s) => activePage(s));
  const setElement = useBuilder((s) => s.setElement);
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!focus) return;
    let raf = 0;
    const sel = `[data-uid="${focus.uid}"][data-path="${focus.path}"]`;
    const tick = () => {
      const el = document.querySelector(sel);
      const b = bar.current;
      if (el && b) {
        const r = el.getBoundingClientRect();
        const top = r.top - b.offsetHeight - 8;
        b.style.top = `${top < 64 ? r.bottom + 8 : top}px`;
        b.style.left = `${Math.max(8, Math.min(r.left, window.innerWidth - b.offsetWidth - 8))}px`;
        b.style.opacity = "1";
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [focus]);

  if (!focus || !page) return null;
  const mod = page.modules.find((m) => m.uid === focus.uid);
  if (!mod) return null;
  const spec = specFor(mod.type, focus.path);
  const value = String(getAt(mod.data, focus.path) ?? "");
  const r = measure(value, spec?.limit);
  const el = elementFor(mod.type, focus.path);
  const isButton = focus.path.endsWith(".label");

  return (
    <div ref={bar} className="pb-elbar" role="status" style={{ opacity: 0 }}>
      <b>{isButton ? `${spec?.label ?? "Button"} text` : spec?.label ?? "Text"}</b>
      {r ? (
        <span className={r.over ? "is-over" : ""}>
          {r.over ? `${r.used - r.max} over · ` : ""}
          {r.used}/{r.max} {r.unit}
        </span>
      ) : null}
      {el ? (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            (document.activeElement as HTMLElement | null)?.blur();
            setElement(mod.uid, el.id, false);
          }}
        >
          <Icon name="eyeOff" size={14} /> Remove {el.label.toLowerCase()}
        </button>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Canvas                                                              */
/* ------------------------------------------------------------------ */

export function Canvas() {
  const page = useBuilder((s) => activePage(s));
  const viewport = useBuilder((s) => s.viewport);
  const showSpecs = useBuilder((s) => s.showSpecs);
  const preview = useBuilder((s) => s.preview);
  const selected = useBuilder((s) => s.selectedUid);
  const select = useBuilder((s) => s.select);
  const add = useBuilder((s) => s.addModule);
  const stage = useRef<HTMLDivElement>(null);
  const [drop, setDrop] = useState<number | null>(null);

  if (!page) return <div className="pb-canvas" />;
  const total = page.modules.length;

  const dropIndex = (y: number) => {
    const frames = Array.from(stage.current?.querySelectorAll<HTMLElement>(".pb-frame") ?? []);
    for (let i = 0; i < frames.length; i++) {
      const r = frames[i].getBoundingClientRect();
      if (y < r.top + r.height / 2) return i;
    }
    return frames.length;
  };

  const dragProps = preview
    ? {}
    : {
        onDragOver: (e: React.DragEvent) => {
          if (!Array.from(e.dataTransfer.types).includes(DRAG_TYPE)) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
          const i = dropIndex(e.clientY);
          if (i !== drop) setDrop(i);
        },
        onDragLeave: (e: React.DragEvent) => {
          if (!stage.current?.contains(e.relatedTarget as Node)) setDrop(null);
        },
        onDrop: (e: React.DragEvent) => {
          const t = e.dataTransfer.getData(DRAG_TYPE) as ModuleType;
          if (!t) return;
          e.preventDefault();
          add(t, dropIndex(e.clientY));
          setDrop(null);
        },
      };

  return (
    <div
      className="pb-canvas"
      onClick={(e) => {
        if (e.target === e.currentTarget) select(null);
      }}
    >
      <div ref={stage} className={`pb-stage pb-stage--${viewport}`} {...dragProps}>
        <PageRenderer
          page={page}
          editing={!preview}
          specs={showSpecs}
          globalWrap={(kind, node) =>
            preview ? (
              node
            ) : (
              <div className="pb-global" onClick={() => select(null)}>
                <span className="pb-global__tag">Site {kind} · same on every page</span>
                {node}
              </div>
            )
          }
          wrap={(mod, index, node) =>
            preview ? (
              <div key={mod.uid}>{node}</div>
            ) : (
              <div key={mod.uid}>
                <InsertPoint index={index} active={drop === index} />
                <div
                  id={`mod-${mod.uid}`}
                  className={`pb-frame ${selected === mod.uid ? "is-selected" : ""}`}
                  onClickCapture={() => selected !== mod.uid && select(mod.uid)}
                >
                  <FrameBar mod={mod} index={index} total={total} />
                  {node}
                  <NoteBadge mod={mod} />
                </div>
                {index === total - 1 ? <InsertPoint index={total} active={drop === total} /> : null}
              </div>
            )
          }
        />
        {!preview && total === 0 ? (
          <div className={`pb-empty ${drop !== null ? "is-drop" : ""}`}>
            <h2>Start with a block</h2>
            <p>Drag one in from the left, or pick one here. Most pages open with a Hero.</p>
            <BlockPicker compact search={false} onPick={(t) => add(t, 0)} />
          </div>
        ) : null}
      </div>
      {!preview ? <ElementBar /> : null}
    </div>
  );
}
