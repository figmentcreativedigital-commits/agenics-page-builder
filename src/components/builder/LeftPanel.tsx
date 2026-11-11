"use client";

import { DndContext, PointerSensor, KeyboardSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useMemo, useRef, useState } from "react";
import { checkPage, effectiveBg, leftToDo } from "@/lib/checks";
import { MODULES } from "@/lib/modules";
import { listVersions, onVersionsChange, saveVersion, type Version } from "@/lib/history";
import { EXAMPLES, RECIPES } from "@/lib/recipes";
import { activePage, useBuilder } from "@/lib/store";
import type { ModuleInstance, ModuleType } from "@/lib/types";
import { PageRenderer } from "../page/PageRenderer";
import { AdviceList, usePageAdvice } from "./Advice";
import { BlockPicker, DRAG_TYPE } from "./Blocks";
import { ModuleThumb } from "./thumbs";
import { BG_SWATCH, Icon } from "./ui";

export type Tab = "add" | "layers" | "pages" | "review" | "history";

const scrollTo = (uid: string) =>
  requestAnimationFrame(() => document.getElementById(`mod-${uid}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));

/* ------------------------------------------------------------------ */
/* Add                                                                 */
/* ------------------------------------------------------------------ */

function MyBlocks() {
  const saved = useBuilder((s) => s.saved);
  const insertSaved = useBuilder((s) => s.insertSaved);
  const del = useBuilder((s) => s.deleteSaved);
  if (!saved.length) return null;
  return (
    <div className="pb-blocks__group">
      <p className="pb-blocks__cat">My blocks</p>
      <div className="pb-blocks__grid">
        {saved.map((b) => (
          <div key={b.id} className="pb-tile pb-tile--saved">
            <button
              type="button"
              className="pb-tile__main"
              title={`${MODULES[b.module.type].name}, saved ${new Date(b.savedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData(DRAG_TYPE, `saved:${b.id}`);
                e.dataTransfer.effectAllowed = "copy";
              }}
              onClick={() => insertSaved(b.id)}
            >
              <ModuleThumb type={b.module.type} variant={b.module.variant} />
              <span>{b.name}</span>
            </button>
            <button type="button" className="pb-tile__x" aria-label={`Remove ${b.name} from My blocks`} title="Remove from My blocks" onClick={() => del(b.id)}>
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddTab() {
  const add = useBuilder((s) => s.addModule);
  const setPanel = useBuilder((s) => s.setPanel);
  return (
    <div className="pb-panel">
      <p className="pb-hint">Drag a block onto the page, or click to add it below the selected block. The panel closes to give the page room.</p>
      <MyBlocks />
      <BlockPicker
        onPick={(t) => {
          add(t);
          setPanel("left", false);
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Layers: the page map                                                */
/* ------------------------------------------------------------------ */

function LayerRow({ mod, index, total }: { mod: ModuleInstance; index: number; total: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: mod.uid });
  const selected = useBuilder((s) => s.selectedUid === mod.uid);
  const select = useBuilder((s) => s.select);
  const move = useBuilder((s) => s.moveModule);
  const remove = useBuilder((s) => s.removeModule);
  const meta = MODULES[mod.type];
  const bg = effectiveBg(mod);
  const h = String(mod.data.h1 ?? mod.data.h2 ?? mod.data.quote ?? "");
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`pb-layer ${selected ? "is-selected" : ""} ${isDragging ? "is-dragging" : ""}`}
    >
      <span className={`pb-layer__band pb-layer__band--${bg}`} style={{ background: BG_SWATCH[bg] }} title={`Background: ${bg}`} />
      <button type="button" className="pb-handle" aria-label={`Drag ${meta.name}`} {...attributes} {...listeners}>
        <Icon name="drag" size={14} />
      </button>
      <button
        type="button"
        className="pb-layer__main"
        onClick={() => {
          select(mod.uid);
          scrollTo(mod.uid);
        }}
      >
        <b>{meta.name}</b>
        <small>{h || "—"}</small>
      </button>
      <span className="pb-layer__tools">
        <button type="button" className="pb-mini" aria-label="Move up" title="Move up" disabled={index === 0} onClick={() => move(mod.uid, -1)}>
          <Icon name="up" size={14} />
        </button>
        <button type="button" className="pb-mini" aria-label="Move down" title="Move down" disabled={index === total - 1} onClick={() => move(mod.uid, 1)}>
          <Icon name="down" size={14} />
        </button>
        <button type="button" className="pb-mini" aria-label="Delete" title="Delete" onClick={() => remove(mod.uid)}>
          <Icon name="trash" size={14} />
        </button>
      </span>
    </div>
  );
}

function LayersTab() {
  const page = useBuilder((s) => activePage(s));
  const reorder = useBuilder((s) => s.reorder);
  const tidy = useBuilder((s) => s.tidyBackgrounds);
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
      <div className="pb-panel__row">
        <p className="pb-hint">Drag to reorder. The color band is each section’s background.</p>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onEnd}>
        <SortableContext items={page.modules.map((m) => m.uid)} strategy={verticalListSortingStrategy}>
          <div className="pb-layers">
            {page.modules.map((m, i) => (
              <LayerRow key={m.uid} mod={m} index={i} total={page.modules.length} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <button type="button" className="pb-btn pb-btn--block" onClick={tidy} title="Alternate section backgrounds so neighbouring sections stand apart">
        <Icon name="sparkle" size={16} /> Tidy backgrounds
      </button>
      <div className="pb-legend" aria-label="Background colors">
        {(["white", "silver", "cyan", "navy"] as const).map((b) => (
          <span key={b}>
            <i style={{ background: BG_SWATCH[b] }} />
            {b === "white" ? "White" : b === "silver" ? "Silver" : b === "cyan" ? "Cyan tint" : "Navy"}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pages + new page gallery                                            */
/* ------------------------------------------------------------------ */

function Filmstrip({ types }: { types: string[] }) {
  return (
    <span className="pb-film" aria-hidden="true">
      {types.slice(0, 6).map((t, i) => {
        const [type, variant] = t.split(":") as [ModuleType, string | undefined];
        return <ModuleThumb key={i} type={type} variant={variant} className="pb-film__thumb" />;
      })}
    </span>
  );
}

export function NewPageDialog({ onClose }: { onClose: () => void }) {
  const create = useBuilder((s) => s.createPage);
  const addExample = useBuilder((s) => s.addExample);
  const [name, setName] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const recipes = RECIPES.filter((r) => r.id !== "master");
  return (
    <div className="pb-modal" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pb-dialog" role="dialog" aria-modal="true" aria-labelledby="np-title" ref={ref}>
        <div className="pb-dialog__head">
          <h2 id="np-title">New page</h2>
          <button type="button" className="pb-mini" aria-label="Close" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        <label className="pb-field">
          Page name
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sterile Processing" />
        </label>
        <p className="pb-dialog__sub">Pick a starting layout. You can add, remove and reorder blocks afterwards.</p>
        <div className="pb-gallery">
          {recipes.map((r) => (
            <button
              key={r.id}
              type="button"
              className="pb-gcard"
              onClick={() => {
                create(name.trim() || r.name, r.id);
                onClose();
              }}
            >
              <Filmstrip types={r.modules} />
              <b>{r.name}</b>
              <small>
                {r.modules.length} blocks · {r.useFor}
              </small>
            </button>
          ))}
        </div>
        <p className="pb-dialog__sub">Or start from a finished example</p>
        <div className="pb-gallery pb-gallery--ex">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.id}
              type="button"
              className="pb-gcard"
              onClick={() => {
                addExample(ex.id);
                onClose();
              }}
            >
              <Filmstrip types={ex.make().modules.map((m) => `${m.type}:${m.variant}`)} />
              <b>Example: {ex.name}</b>
              <small>{ex.blurb}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PagesTab({ onNew }: { onNew: () => void }) {
  const pages = useBuilder((s) => s.pages);
  const activeId = useBuilder((s) => s.activeId);
  const setActive = useBuilder((s) => s.setActive);
  const dup = useBuilder((s) => s.duplicatePage);
  const del = useBuilder((s) => s.deletePage);
  const [confirm, setConfirm] = useState<string | null>(null);

  return (
    <div className="pb-panel">
      <button type="button" className="pb-btn pb-btn--primary pb-btn--block" onClick={onNew}>
        <Icon name="plus" size={16} /> New page
      </button>
      {pages.map((p) => (
        <div key={p.id} className={`pb-pagecard ${p.id === activeId ? "is-active" : ""}`}>
          <button type="button" className="pb-pagecard__name" onClick={() => setActive(p.id)}>
            {p.name}
            <small>
              {p.modules.length} blocks · edited {new Date(p.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </small>
          </button>
          <div className="pb-actions">
            <button type="button" className="pb-btn pb-btn--sm" onClick={() => dup(p.id)}>
              Duplicate
            </button>
            {confirm === p.id ? (
              <>
                <button type="button" className="pb-btn pb-btn--sm pb-btn--danger" onClick={() => del(p.id)}>
                  Yes, delete
                </button>
                <button type="button" className="pb-btn pb-btn--sm" onClick={() => setConfirm(null)}>
                  Keep
                </button>
              </>
            ) : (
              <button type="button" className="pb-btn pb-btn--sm pb-btn--ghost" onClick={() => setConfirm(p.id)}>
                Delete
              </button>
            )}
          </div>
        </div>
      ))}
      <p className="pb-hint">Pages save in this browser as you work. To share one, use Export › Page file.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Review                                                              */
/* ------------------------------------------------------------------ */

function ReviewTab() {
  const page = useBuilder((s) => activePage(s));
  const select = useBuilder((s) => s.select);
  const issues = useMemo(() => (page ? checkPage(page) : []), [page]);
  const [open, setOpen] = useState<string | null>(null);
  const tips = usePageAdvice();
  if (!page) return null;
  const errors = issues.filter((i) => i.level === "error");
  const go = (uid?: string) => {
    if (uid) {
      select(uid);
      scrollTo(uid);
    } else select(null);
  };
  // Group by block so a long list reads as a short one
  const pageLevel = issues.filter((i) => !i.moduleUid);
  const blocks = page.modules
    .map((m, n) => ({ m, n, list: issues.filter((i) => i.moduleUid === m.uid) }))
    .filter((b) => b.list.length);

  return (
    <div className="pb-panel">
      {issues.length + tips.length === 0 ? (
        <div className="pb-ok">
          <Icon name="review" size={22} />
          <span>
            <b>Ready to hand off.</b> Every check passes. Export the handoff package from the top bar.
          </span>
        </div>
      ) : (
        <div className={`pb-score ${errors.length ? "pb-score--err" : ""}`}>
          <b>{errors.length ? `${errors.length} to fix` : `${leftToDo(issues, tips).todo} to finish`}</b>
          <span>Click an item to jump to it</span>
        </div>
      )}
      {pageLevel.length ? (
        <div className="pb-issues">
          <p className="pb-blocks__cat">Whole page</p>
          {pageLevel.map((i, n) => (
            <button key={n} type="button" className="pb-issue" onClick={() => go()}>
              <span className={`pb-dot ${i.level === "error" ? "pb-dot--err" : ""}`} aria-hidden="true" />
              <span>{i.message}</span>
            </button>
          ))}
        </div>
      ) : null}
      {blocks.length ? (
        <div className="pb-issues">
          <p className="pb-blocks__cat">Blocks</p>
          {blocks.map(({ m, n, list }) => {
            const isOpen = open === m.uid;
            const err = list.some((i) => i.level === "error");
            const name = `${MODULES[m.type].name} (block ${n + 1})`;
            return (
              <div key={m.uid} className={`pb-rgroup ${isOpen ? "is-open" : ""}`}>
                <button
                  type="button"
                  className="pb-rgroup__head"
                  aria-expanded={isOpen}
                  onClick={() => {
                    setOpen(isOpen ? null : m.uid);
                    go(m.uid);
                  }}
                >
                  <span className={`pb-dot ${err ? "pb-dot--err" : ""}`} aria-hidden="true" />
                  <b>{MODULES[m.type].name}</b>
                  <small>block {n + 1}</small>
                  <i>{list.length}</i>
                </button>
                {isOpen ? (
                  <ul>
                    {list.map((i, k) => (
                      <li key={k}>{i.message.startsWith(`${name}: `) ? i.message.slice(name.length + 2) : i.message}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
      <AdviceList />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Version history                                                     */
/* ------------------------------------------------------------------ */

const stamp = (t: number) => {
  const d = new Date(t);
  const today = new Date();
  const day =
    d.toDateString() === today.toDateString()
      ? "Today"
      : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  return `${day}, ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
};

function VersionPreview({ version, onClose, onRestore }: { version: Version; onClose: () => void; onRestore: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="pb-modal" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pb-dialog pb-version" role="dialog" aria-modal="true" aria-labelledby="ver-title">
        <div className="pb-dialog__head">
          <h2 id="ver-title">
            {version.label} <small>{stamp(version.at)}</small>
          </h2>
          <span className="pb-actions">
            <button type="button" className="pb-btn pb-btn--cta" onClick={onRestore}>
              Restore this version
            </button>
            <button type="button" className="pb-mini" aria-label="Close" onClick={onClose}>
              <Icon name="close" />
            </button>
          </span>
        </div>
        <div className="pb-version__page">
          <PageRenderer page={version.page} editing={false} specs={false} />
        </div>
      </div>
    </div>
  );
}

function HistoryTab() {
  const page = useBuilder((s) => activePage(s));
  const restore = useBuilder((s) => s.restoreVersion);
  const [versions, setVersions] = useState<Version[] | null>(null);
  const [name, setName] = useState("");
  const [viewing, setViewing] = useState<Version | null>(null);
  const pageId = page?.id;

  useEffect(() => {
    if (!pageId) return;
    let live = true;
    const load = () => listVersions(pageId).then((v) => live && setVersions(v));
    load();
    const off = onVersionsChange(load);
    return () => {
      live = false;
      off();
    };
  }, [pageId]);

  if (!page) return null;
  const doRestore = async (v: Version) => {
    await saveVersion(page, "Before restoring", false);
    restore(v.page, stamp(v.at));
    setViewing(null);
  };

  return (
    <div className="pb-panel">
      <p className="pb-hint">Versions save on their own when you open a page and every few minutes while you work. Restoring can be undone.</p>
      <form
        className="pb-saveversion"
        onSubmit={async (e) => {
          e.preventDefault();
          await saveVersion(page, name.trim() || "Saved version", false);
          setName("");
        }}
      >
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name this version (optional)" aria-label="Version name" />
        <button type="submit" className="pb-btn pb-btn--primary">
          Save
        </button>
      </form>
      {versions === null ? <p className="pb-hint">Loading…</p> : null}
      {versions?.length === 0 ? <p className="pb-hint">No versions yet.</p> : null}
      <div className="pb-versions">
        {versions?.map((v, i) => (
          <div key={v.id} className={`pb-ver ${v.auto ? "" : "is-named"}`}>
            <span className="pb-ver__dot" aria-hidden="true" />
            <div className="pb-ver__main">
              <b>{v.label}</b>
              <small>
                {stamp(v.at)} · {v.page.modules.length} blocks{i === 0 ? " · latest" : ""}
              </small>
            </div>
            <span className="pb-ver__tools">
              <button type="button" className="pb-btn pb-btn--sm" onClick={() => setViewing(v)}>
                View
              </button>
              <button type="button" className="pb-btn pb-btn--sm" onClick={() => doRestore(v)}>
                Restore
              </button>
            </span>
          </div>
        ))}
      </div>
      {viewing ? <VersionPreview version={viewing} onClose={() => setViewing(null)} onRestore={() => doRestore(viewing)} /> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Rail + panel                                                        */
/* ------------------------------------------------------------------ */

export function LeftPanel({
  tab,
  setTab,
  onNewPage,
  onTour,
  touring = false,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
  onNewPage: () => void;
  onTour: () => void;
  touring?: boolean;
}) {
  const page = useBuilder((s) => activePage(s));
  const open = useBuilder((s) => s.panels.left && !s.focusMode);
  const setPanel = useBuilder((s) => s.setPanel);
  const issues = useMemo(() => (page ? checkPage(page) : []), [page]);
  const tips = usePageAdvice();
  const { errors, todo } = leftToDo(issues, tips);
  const title = (t: Tab) => (t === "add" ? "Add a block" : t === "layers" ? "Page layers" : t === "pages" ? "Your pages" : t === "review" ? "Review" : "Version history");
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "add", label: "Add", icon: "add" },
    { id: "layers", label: "Layers", icon: "layers" },
    { id: "pages", label: "Pages", icon: "pages" },
    { id: "review", label: "Review", icon: "review" },
    { id: "history", label: "History", icon: "history" },
  ];
  return (
    <>
      <nav className="pb-rail" aria-label="Builder">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={open && tab === t.id}
            aria-controls={open ? "pb-panel" : undefined}
            title={open && tab === t.id ? `Close ${t.label}` : title(t.id)}
            onClick={() => {
              // The open tab's own button folds the panel away; any other opens it
              if (open && tab === t.id) setPanel("left", false);
              else {
                setTab(t.id);
                setPanel("left", true);
              }
            }}
          >
            <Icon name={t.icon} size={20} />
            <span>{t.label}</span>
            {/* The same number the top bar shows */}
            {t.id === "review" && issues.length + tips.length ? <i className={`pb-rail__badge ${errors ? "is-err" : ""}`}>{errors || todo}</i> : null}
          </button>
        ))}
        {/* Always here, for anyone who wants the walkthrough again */}
        <button
          type="button"
          className={`pb-rail__tour ${touring ? "is-on" : ""}`}
          data-tour="tour"
          title={touring ? "Start the tour again from the beginning" : "Take the guided tour"}
          aria-label="Take the guided tour"
          onClick={onTour}
        >
          <Icon name="tour" size={20} />
          <span>Tour</span>
        </button>
      </nav>
      {open ? (
        <aside id="pb-panel" className="pb-left" data-tour="panel" aria-label={tabs.find((t) => t.id === tab)?.label}>
          <div className="pb-left__title">
            <h2>{title(tab)}</h2>
            <button type="button" className="pb-panelx" aria-label="Hide panel" title="Hide panel" onClick={() => setPanel("left", false)}>
              <Icon name="panelLeft" size={18} />
            </button>
          </div>
          {tab === "add" ? <AddTab /> : null}
          {tab === "layers" ? <LayersTab /> : null}
          {tab === "pages" ? <PagesTab onNew={onNewPage} /> : null}
          {tab === "review" ? <ReviewTab /> : null}
          {tab === "history" ? <HistoryTab /> : null}
        </aside>
      ) : null}
    </>
  );
}
