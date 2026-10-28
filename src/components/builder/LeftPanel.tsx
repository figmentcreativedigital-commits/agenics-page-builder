"use client";

import { DndContext, PointerSensor, KeyboardSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, useState } from "react";
import { checkPage } from "@/lib/checks";
import { MODULES, MODULE_ORDER } from "@/lib/modules";
import { RECIPES } from "@/lib/recipes";
import { activePage, useBuilder } from "@/lib/store";
import type { ModuleInstance } from "@/lib/types";

type Tab = "add" | "outline" | "pages" | "checks";

const scrollTo = (uid: string) =>
  requestAnimationFrame(() => document.getElementById(`mod-${uid}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));

function LibraryTab() {
  const add = useBuilder((s) => s.addModule);
  const selected = useBuilder((s) => s.selectedUid);
  return (
    <div className="pb-panel">
      <p className="pb-hint">
        Click a module to add it {selected ? "after the selected module" : "above the CTA band"}. Or hover between modules on the page and use
        “Insert module”.
      </p>
      {MODULE_ORDER.map((t) => {
        const m = MODULES[t];
        return (
          <button key={t} type="button" className="pb-lib" onClick={() => add(t)}>
            <span className={`pb-code ${m.status === "required" ? "pb-code--req" : ""}`}>{m.code}</span>
            <span>
              <b>
                {m.name} <span className="pb-status">{m.status}</span>
              </b>
              <small>{m.summary}</small>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function OutlineRow({ mod, index, total }: { mod: ModuleInstance; index: number; total: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: mod.uid });
  const selected = useBuilder((s) => s.selectedUid === mod.uid);
  const select = useBuilder((s) => s.select);
  const move = useBuilder((s) => s.moveModule);
  const remove = useBuilder((s) => s.removeModule);
  const meta = MODULES[mod.type];
  const variant = meta.variants.find((v) => v.id === mod.variant)?.label;
  const h = String(mod.data.h1 ?? mod.data.h2 ?? mod.data.quote ?? "");
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`pb-row ${selected ? "is-selected" : ""} ${isDragging ? "is-dragging" : ""}`}
    >
      <button type="button" className="pb-handle" aria-label={`Drag ${meta.name}`} {...attributes} {...listeners}>
        ⠿
      </button>
      <span className={`pb-code ${meta.status === "required" ? "pb-code--req" : ""}`}>{meta.code}</span>
      <button
        type="button"
        className="pb-row__main"
        onClick={() => {
          select(mod.uid);
          scrollTo(mod.uid);
        }}
      >
        <b>{meta.name}</b>
        <small>
          {variant ? `${variant} · ` : ""}
          {h || "—"}
        </small>
      </button>
      <button type="button" className="pb-mini" aria-label="Move up" disabled={index === 0} onClick={() => move(mod.uid, -1)}>
        ↑
      </button>
      <button type="button" className="pb-mini" aria-label="Move down" disabled={index === total - 1} onClick={() => move(mod.uid, 1)}>
        ↓
      </button>
      <button type="button" className="pb-mini" aria-label="Remove" onClick={() => remove(mod.uid)}>
        ✕
      </button>
    </div>
  );
}

function OutlineTab() {
  const page = useBuilder((s) => activePage(s));
  const reorder = useBuilder((s) => s.reorder);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  if (!page) return null;
  const onEnd = (e: DragEndEvent) => {
    if (e.over && e.active.id !== e.over.id) reorder(String(e.active.id), String(e.over.id));
  };
  return (
    <div className="pb-panel">
      <p className="pb-hint">Drag to reorder. {page.modules.length} modules on this page; most recipes use six to nine.</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onEnd}>
        <SortableContext items={page.modules.map((m) => m.uid)} strategy={verticalListSortingStrategy}>
          <div className="pb-outline">
            {page.modules.map((m, i) => (
              <OutlineRow key={m.uid} mod={m} index={i} total={page.modules.length} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function PagesTab() {
  const pages = useBuilder((s) => s.pages);
  const activeId = useBuilder((s) => s.activeId);
  const setActive = useBuilder((s) => s.setActive);
  const create = useBuilder((s) => s.createPage);
  const dup = useBuilder((s) => s.duplicatePage);
  const del = useBuilder((s) => s.deletePage);
  const [name, setName] = useState("");
  const [recipe, setRecipe] = useState("product-line");
  const [confirm, setConfirm] = useState<string | null>(null);
  const r = RECIPES.find((x) => x.id === recipe);

  return (
    <div className="pb-panel">
      <h2>New page</h2>
      <form
        className="pb-panel"
        style={{ padding: 0 }}
        onSubmit={(e) => {
          e.preventDefault();
          create(name.trim() || r?.name || "New page", recipe);
          setName("");
        }}
      >
        <label className="pb-field">
          Page name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sterile Processing" />
        </label>
        <label className="pb-field">
          Start from recipe
          <select value={recipe} onChange={(e) => setRecipe(e.target.value)}>
            {RECIPES.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name} ({x.modules.length})
              </option>
            ))}
          </select>
          {r ? (
            <span className="pb-help">
              {r.useFor}
              {r.replaces ? `. Replaces ${r.replaces}.` : "."}
            </span>
          ) : null}
        </label>
        <button type="submit" className="pb-btn pb-btn--primary">
          Create page
        </button>
      </form>

      <h2 style={{ marginTop: 10 }}>Pages in this browser ({pages.length})</h2>
      {pages.map((p) => (
        <div key={p.id} className={`pb-pagecard ${p.id === activeId ? "is-active" : ""}`}>
          <button type="button" className="pb-pagecard__name" onClick={() => setActive(p.id)}>
            {p.name}
          </button>
          <small>
            {p.modules.length} modules · {RECIPES.find((x) => x.id === p.recipe)?.name ?? p.recipe} · edited{" "}
            {new Date(p.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </small>
          <div className="pb-actions">
            {p.id !== activeId ? (
              <button type="button" className="pb-btn pb-btn--sm" onClick={() => setActive(p.id)}>
                Open
              </button>
            ) : null}
            <button type="button" className="pb-btn pb-btn--sm" onClick={() => dup(p.id)}>
              Duplicate
            </button>
            {confirm === p.id ? (
              <>
                <button type="button" className="pb-btn pb-btn--sm pb-btn--danger" onClick={() => del(p.id)}>
                  Delete for good
                </button>
                <button type="button" className="pb-btn pb-btn--sm" onClick={() => setConfirm(null)}>
                  Keep
                </button>
              </>
            ) : (
              <button type="button" className="pb-btn pb-btn--sm pb-btn--danger" onClick={() => setConfirm(p.id)}>
                Delete
              </button>
            )}
          </div>
        </div>
      ))}
      <p className="pb-hint">
        Pages are saved in this browser. Use Export › Page file to move a page to another computer or to send it to Figment.
      </p>
    </div>
  );
}

function ChecksTab() {
  const page = useBuilder((s) => activePage(s));
  const select = useBuilder((s) => s.select);
  const issues = useMemo(() => (page ? checkPage(page) : []), [page]);
  if (!page) return null;
  const errors = issues.filter((i) => i.level === "error").length;
  return (
    <div className="pb-panel">
      <p className="pb-hint">
        {errors} to fix · {issues.length - errors} to check. Fix the red items before handing the page to the Squarespace build.
      </p>
      {issues.length === 0 ? <div className="pb-ok">This page passes every check.</div> : null}
      {issues.map((i, n) => (
        <button
          key={n}
          type="button"
          className="pb-issue"
          onClick={() => {
            if (i.moduleUid) {
              select(i.moduleUid);
              scrollTo(i.moduleUid);
            } else select(null);
          }}
        >
          <span className={`pb-dot ${i.level === "error" ? "pb-dot--err" : ""}`} aria-hidden="true" />
          <span>
            <span className="sr-only">{i.level === "error" ? "Fix: " : "Check: "}</span>
            {i.message}
          </span>
        </button>
      ))}
    </div>
  );
}

export function LeftPanel() {
  const [tab, setTab] = useState<Tab>("add");
  const page = useBuilder((s) => activePage(s));
  const issues = useMemo(() => (page ? checkPage(page) : []), [page]);
  const errors = issues.filter((i) => i.level === "error").length;
  const tabs: { id: Tab; label: string }[] = [
    { id: "add", label: "Add" },
    { id: "outline", label: "Outline" },
    { id: "pages", label: "Pages" },
    { id: "checks", label: "Checks" },
  ];
  return (
    <aside className="pb-left" aria-label="Modules and pages">
      <div className="pb-tabs" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
            {t.id === "checks" && issues.length ? (
              <span className={`pb-badge ${errors ? "pb-badge--err" : "pb-badge--warn"}`}>{issues.length}</span>
            ) : null}
          </button>
        ))}
      </div>
      {tab === "add" ? <LibraryTab /> : null}
      {tab === "outline" ? <OutlineTab /> : null}
      {tab === "pages" ? <PagesTab /> : null}
      {tab === "checks" ? <ChecksTab /> : null}
    </aside>
  );
}
