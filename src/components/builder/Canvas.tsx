"use client";

import { useEffect, useRef, useState } from "react";
import { measure } from "@/lib/checks";
import { MODULES, MODULE_ORDER } from "@/lib/modules";
import { getAt } from "@/lib/path";
import { activePage, useBuilder } from "@/lib/store";
import type { ModuleInstance, ModuleType } from "@/lib/types";
import { specFor } from "../page/edit";
import { PageRenderer } from "../page/PageRenderer";

function ModulePicker({ onPick, onClose }: { onPick: (t: ModuleType) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
  return (
    <div className="pb-picker" ref={ref} role="menu">
      {MODULE_ORDER.map((t) => {
        const m = MODULES[t];
        return (
          <button key={t} type="button" className="pb-lib" role="menuitem" onClick={() => onPick(t)}>
            <span className={`pb-code ${m.status === "required" ? "pb-code--req" : ""}`}>{m.code}</span>
            <span>
              <b>{m.name}</b>
              <small>{m.summary}</small>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function InsertPoint({ index }: { index: number }) {
  const add = useBuilder((s) => s.addModule);
  const [open, setOpen] = useState(false);
  return (
    <div className={`pb-insert ${open ? "is-open" : ""}`}>
      <button type="button" className="pb-insert__btn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        + Insert module
      </button>
      {open ? (
        <ModulePicker
          onClose={() => setOpen(false)}
          onPick={(t) => {
            add(t, index);
            setOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

function FrameBar({ mod, index, total }: { mod: ModuleInstance; index: number; total: number }) {
  const meta = MODULES[mod.type];
  const move = useBuilder((s) => s.moveModule);
  const dup = useBuilder((s) => s.duplicateModule);
  const remove = useBuilder((s) => s.removeModule);
  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };
  return (
    <div className="pb-frame__bar" onClick={(e) => e.stopPropagation()}>
      <span className="pb-code">{meta.code}</span>
      <strong>{meta.name}</strong>
      <button type="button" title="Move up" aria-label="Move up" disabled={index === 0} onClick={stop(() => move(mod.uid, -1))}>
        ↑
      </button>
      <button type="button" title="Move down" aria-label="Move down" disabled={index === total - 1} onClick={stop(() => move(mod.uid, 1))}>
        ↓
      </button>
      <button type="button" title="Duplicate" aria-label="Duplicate module" onClick={stop(() => dup(mod.uid))}>
        ⧉
      </button>
      <button type="button" title="Remove" aria-label="Remove module" onClick={stop(() => remove(mod.uid))}>
        ✕
      </button>
    </div>
  );
}

function FieldStatus() {
  const focus = useBuilder((s) => s.focus);
  const page = useBuilder((s) => activePage(s));
  if (!focus || !page) return null;
  const mod = page.modules.find((m) => m.uid === focus.uid);
  if (!mod) return null;
  const spec = specFor(mod.type, focus.path);
  const value = String(getAt(mod.data, focus.path) ?? "");
  const r = measure(value, spec?.limit);
  return (
    <div className="pb-field-status" role="status">
      <span>
        <b>{MODULES[mod.type].code}</b> {spec?.label ?? focus.path}
      </span>
      {r ? (
        <span className={r.over ? "is-over" : ""}>
          {r.used}/{r.max} {r.unit}
        </span>
      ) : null}
      {spec?.guidance ? <span style={{ opacity: 0.8 }}>{spec.guidance}</span> : null}
    </div>
  );
}

export function Canvas() {
  const page = useBuilder((s) => activePage(s));
  const viewport = useBuilder((s) => s.viewport);
  const showSpecs = useBuilder((s) => s.showSpecs);
  const preview = useBuilder((s) => s.preview);
  const selected = useBuilder((s) => s.selectedUid);
  const select = useBuilder((s) => s.select);

  if (!page) return <div className="pb-canvas" />;
  const total = page.modules.length;

  return (
    <div
      className="pb-canvas"
      onClick={(e) => {
        if (e.target === e.currentTarget) select(null);
      }}
    >
      <div className={`pb-stage pb-stage--${viewport}`}>
        <PageRenderer
          page={page}
          editing={!preview}
          specs={showSpecs}
          globalWrap={(kind, node) =>
            preview ? (
              node
            ) : (
              <div className="pb-global" onClick={() => select(null)}>
                <span className="pb-global__tag">Global {kind} · set once in Squarespace</span>
                {node}
              </div>
            )
          }
          wrap={(mod, index, node) =>
            preview ? (
              <div key={mod.uid}>{node}</div>
            ) : (
              <div key={mod.uid}>
                <InsertPoint index={index} />
                <div
                  id={`mod-${mod.uid}`}
                  className={`pb-frame ${selected === mod.uid ? "is-selected" : ""}`}
                  onClickCapture={() => selected !== mod.uid && select(mod.uid)}
                >
                  <FrameBar mod={mod} index={index} total={total} />
                  {node}
                </div>
                {index === total - 1 ? <InsertPoint index={total} /> : null}
              </div>
            )
          }
        />
        {!preview && total === 0 ? (
          <div style={{ padding: 40 }}>
            <InsertPoint index={0} />
          </div>
        ) : null}
      </div>
      {!preview ? <FieldStatus /> : null}
    </div>
  );
}
