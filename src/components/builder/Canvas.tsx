"use client";

import { useEffect, useRef, useState } from "react";
import { measure } from "@/lib/checks";
import { SCREEN_LABEL, fitScreen, fitStyle, useRoom } from "@/lib/devices";
import { MODULES } from "@/lib/modules";
import { getAt } from "@/lib/path";
import { plainText } from "@/lib/richtext";
import { activePage, useBuilder } from "@/lib/store";
import type { ModuleInstance, ModuleType } from "@/lib/types";
import { ITEM_DRAG, elementFor, itemDrag, specFor } from "../page/edit";
import { PageRenderer } from "../page/PageRenderer";
import { BlockPicker, DRAG_TYPE, MOVE_TYPE } from "./Blocks";
import { Icon } from "./ui";

/* ------------------------------------------------------------------ */
/* "+" between blocks                                                  */
/* ------------------------------------------------------------------ */

function InsertPoint({ index, active, moving = false }: { index: number; active: boolean; moving?: boolean }) {
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
    <div ref={ref} className={`pb-insert ${open ? "is-open" : ""} ${active ? "is-drop" : ""}`} data-index={index}>
      <span className="pb-insert__line" aria-hidden="true" />
      {active ? <span className="pb-insert__drop">{moving ? "Drop to move here" : "Drop to add here"}</span> : null}
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
      <span
        className="pb-frame__drag"
        draggable
        title="Drag to move this block"
        aria-hidden="true"
        onDragStart={(e) => {
          e.dataTransfer.setData(MOVE_TYPE, mod.uid);
          e.dataTransfer.effectAllowed = "move";
          // A small labelled ghost reads better than a snapshot of the whole section
          const ghost = document.createElement("div");
          ghost.className = "pb-dragghost";
          ghost.textContent = `Move ${meta.name}`;
          document.body.appendChild(ghost);
          e.dataTransfer.setDragImage(ghost, 16, 16);
          setTimeout(() => ghost.remove(), 0);
          const frame = e.currentTarget.closest<HTMLElement>(".pb-frame");
          requestAnimationFrame(() => frame?.classList.add("is-moving"));
        }}
        onDragEnd={(e) => e.currentTarget.closest(".pb-frame")?.classList.remove("is-moving")}
      >
        <Icon name="drag" size={14} />
      </span>
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
      <MoreMenu mod={mod} index={index} />
    </div>
  );
}

function MoreMenu({ mod, index }: { mod: ModuleInstance; index: number }) {
  const copy = useBuilder((s) => s.copyBlock);
  const paste = useBuilder((s) => s.pasteBlock);
  const save = useBuilder((s) => s.saveBlock);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  const run = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    fn();
  };
  return (
    <span className="pb-more" ref={ref}>
      <button type="button" title="More" aria-label="More actions" aria-expanded={open} onClick={(e) => (e.stopPropagation(), setOpen((o) => !o))}>
        <Icon name="more" size={16} />
      </button>
      {open ? (
        <span className="pb-more__menu" role="menu">
          <button type="button" role="menuitem" onClick={run(() => copy(mod.uid))}>
            Copy block <kbd>⌘C</kbd>
          </button>
          <button type="button" role="menuitem" onClick={run(() => paste(index + 1))}>
            Paste below <kbd>⌘V</kbd>
          </button>
          <button type="button" role="menuitem" onClick={run(() => save(mod.uid))}>
            Save to My blocks
          </button>
        </span>
      ) : null}
    </span>
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

const slotEl = (uid: string, path: string) => document.querySelector<HTMLElement>(`[data-uid="${uid}"][data-path="${path}"]`);

function linkAtSelection(root: HTMLElement | null): HTMLAnchorElement | null {
  const node = window.getSelection()?.anchorNode;
  const el = node?.nodeType === 3 ? node.parentElement : (node as HTMLElement | null);
  const a = el?.closest?.("a") ?? null;
  return a && root?.contains(a) ? (a as HTMLAnchorElement) : null;
}

/** Bold, italic and link controls for paragraph slots (also ⌘B, ⌘I, ⌘K). */
function FormatTools({ uid, path }: { uid: string; path: string }) {
  const page = useBuilder((s) => activePage(s));
  const setFocus = useBuilder((s) => s.setFocus);
  const [state, setState] = useState({ b: false, i: false, a: false });
  const [link, setLink] = useState<null | { href: string; range: Range | null; existing: HTMLAnchorElement | null }>(null);
  const [hint, setHint] = useState("");

  const openLink = () => {
    const sel = window.getSelection();
    const range = sel?.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
    const existing = linkAtSelection(slotEl(uid, path));
    if (!existing && (!range || range.collapsed)) {
      setHint("Select the words to link first");
      setTimeout(() => setHint(""), 2200);
      return;
    }
    setLink({ href: existing?.getAttribute("href") ?? "", range, existing });
  };

  useEffect(() => {
    const onSel = () => {
      const ed = slotEl(uid, path);
      if (!ed || document.activeElement !== ed) return;
      setState({ b: document.queryCommandState("bold"), i: document.queryCommandState("italic"), a: !!linkAtSelection(ed) });
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k" && document.activeElement === slotEl(uid, path)) {
        e.preventDefault();
        openLink();
      }
    };
    document.addEventListener("selectionchange", onSel);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("selectionchange", onSel);
      document.removeEventListener("keydown", onKey);
    };
    // openLink reads the live selection; re-binding when the slot changes is enough
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, path]);

  const changed = (ed: HTMLElement | null) => ed?.dispatchEvent(new Event("input", { bubbles: true }));
  const exec = (cmd: "bold" | "italic") => {
    document.execCommand(cmd);
    changed(slotEl(uid, path));
  };

  const apply = (href: string) => {
    const ed = slotEl(uid, path);
    if (!ed || !link) return;
    ed.focus();
    if (link.existing) {
      if (href) link.existing.setAttribute("href", href);
      else link.existing.replaceWith(...Array.from(link.existing.childNodes));
    } else if (href && link.range) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(link.range);
      document.execCommand("createLink", false, href);
      sel?.collapseToEnd();
    }
    changed(ed);
    setLink(null);
  };

  const anchors = (page?.modules ?? []).filter((m) => m.anchor).map((m) => `#${m.anchor}`);
  const keep = (e: React.MouseEvent) => e.preventDefault();

  if (link) {
    return (
      <form
        className="pb-elbar__link"
        onSubmit={(e) => {
          e.preventDefault();
          apply(link.href.trim());
        }}
      >
        <input
          autoFocus
          value={link.href}
          list="pb-anchor-list"
          placeholder="/shop/p/… · #section · https://…"
          aria-label="Link address"
          onChange={(e) => setLink({ ...link, href: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              setLink(null);
              slotEl(uid, path)?.focus();
            }
          }}
          onBlur={(e) => {
            const to = e.relatedTarget as HTMLElement | null;
            if (!to?.closest?.(".pb-elbar") && to !== slotEl(uid, path)) {
              setLink(null);
              setFocus(null);
            }
          }}
        />
        <datalist id="pb-anchor-list">
          {anchors.map((a) => (
            <option key={a} value={a} />
          ))}
        </datalist>
        <button type="submit">Apply</button>
        {link.existing ? (
          <button type="button" onClick={() => apply("")}>
            Remove link
          </button>
        ) : null}
      </form>
    );
  }

  return (
    <span className="pb-elbar__fmt" role="group" aria-label="Formatting">
      <button type="button" aria-pressed={state.b} title="Bold (⌘B)" aria-label="Bold" onMouseDown={keep} onClick={() => exec("bold")}>
        <b>B</b>
      </button>
      <button type="button" aria-pressed={state.i} title="Italic (⌘I)" aria-label="Italic" onMouseDown={keep} onClick={() => exec("italic")}>
        <i>I</i>
      </button>
      <button type="button" aria-pressed={state.a} title="Link (⌘K)" aria-label="Link" onMouseDown={keep} onClick={openLink}>
        <Icon name="link" size={14} />
      </button>
      {hint ? <em className="pb-elbar__hint">{hint}</em> : null}
    </span>
  );
}

function ElementBar() {
  const focus = useBuilder((s) => s.focus);
  const page = useBuilder((s) => activePage(s));
  const setElement = useBuilder((s) => s.setElement);
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!focus) return;
    let raf = 0;
    const tick = () => {
      const el = slotEl(focus.uid, focus.path);
      const b = bar.current;
      if (el && b) {
        const r = el.getBoundingClientRect();
        const left = Math.max(8, Math.min(r.left, window.innerWidth - b.offsetWidth - 8));
        let top = r.top - b.offsetHeight - 8;
        // Below the text when there is no room above it, or when the block's own toolbar is in the way
        const fb = document.querySelector(`#mod-${focus.uid} > .pb-frame__bar`)?.getBoundingClientRect();
        const hitsBar = !!fb && fb.height > 0 && top < fb.bottom && top + b.offsetHeight > fb.top && left < fb.right && left + b.offsetWidth > fb.left;
        if (top < 64 || hitsBar) top = r.bottom + 8;
        b.style.top = `${top}px`;
        b.style.left = `${left}px`;
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
  const r = measure(spec?.rich ? plainText(value) : value, spec?.limit);
  const el = elementFor(mod.type, focus.path);
  const isButton = focus.path.endsWith(".label");

  return (
    <div ref={bar} className="pb-elbar" role="toolbar" aria-label="Text tools" style={{ opacity: 0 }}>
      <b>{isButton ? `${spec?.label ?? "Button"} text` : spec?.label ?? "Text"}</b>
      {r ? (
        <span className={r.over ? "is-over" : ""}>
          {r.over ? `${r.used - r.max} over · ` : ""}
          {r.used}/{r.max} {r.unit}
        </span>
      ) : null}
      {spec?.rich ? <FormatTools key={`${focus.uid}:${focus.path}`} uid={focus.uid} path={focus.path} /> : null}
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
  const moveTo = useBuilder((s) => s.moveTo);
  const insertSaved = useBuilder((s) => s.insertSaved);
  const moveItem = useBuilder((s) => s.moveItem);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const room = useRoom(canvas);
  // Full-screen preview: desktop fills the window, as a visitor's browser would
  const fit = fitScreen(viewport, room, preview ? { desktopMax: Infinity } : undefined);
  const [drop, setDrop] = useState<number | null>(null);
  const [dropMove, setDropMove] = useState(false);

  if (!page) return <div ref={canvas} className="pb-canvas" />;
  const total = page.modules.length;

  const dropIndex = (y: number) => {
    const frames = Array.from(stage.current?.querySelectorAll<HTMLElement>(".pb-frame") ?? []);
    for (let i = 0; i < frames.length; i++) {
      const r = frames[i].getBoundingClientRect();
      if (y < r.top + r.height / 2) return i;
    }
    return frames.length;
  };

  const clearTargets = () => document.querySelectorAll(".agx-item.is-target").forEach((el) => el.classList.remove("is-target"));
  /** The item a dragged item would take the place of: same block, same list. */
  const itemTarget = (e: React.DragEvent) => {
    const el = (e.target as HTMLElement).closest?.<HTMLElement>(".agx-item[data-group]");
    if (!el || !itemDrag || el.dataset.uid !== itemDrag.uid || el.dataset.group !== itemDrag.group) return null;
    return el;
  };

  const dragProps = preview
    ? {}
    : {
        onDragOver: (e: React.DragEvent) => {
          const types = Array.from(e.dataTransfer.types);
          if (types.includes(ITEM_DRAG)) {
            const el = itemTarget(e);
            if (!el) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            if (!el.classList.contains("is-target")) {
              clearTargets();
              if (Number(el.dataset.index) !== itemDrag?.index) el.classList.add("is-target");
            }
            return;
          }
          if (!types.includes(DRAG_TYPE) && !types.includes(MOVE_TYPE)) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = types.includes(MOVE_TYPE) ? "move" : "copy";
          const i = dropIndex(e.clientY);
          if (i !== drop) setDrop(i);
          if (types.includes(MOVE_TYPE) !== dropMove) setDropMove(types.includes(MOVE_TYPE));
        },
        onDragLeave: (e: React.DragEvent) => {
          if (!stage.current?.contains(e.relatedTarget as Node)) {
            setDrop(null);
            clearTargets();
          }
        },
        onDrop: (e: React.DragEvent) => {
          if (Array.from(e.dataTransfer.types).includes(ITEM_DRAG)) {
            const el = itemTarget(e);
            clearTargets();
            if (!el || !itemDrag) return;
            e.preventDefault();
            moveItem(itemDrag.uid, itemDrag.group, itemDrag.index, Number(el.dataset.index));
            return;
          }
          const moving = e.dataTransfer.getData(MOVE_TYPE);
          const t = e.dataTransfer.getData(DRAG_TYPE);
          if (!moving && !t) return;
          e.preventDefault();
          if (moving) moveTo(moving, dropIndex(e.clientY));
          else if (t.startsWith("saved:")) insertSaved(t.slice(6), dropIndex(e.clientY));
          else add(t as ModuleType, dropIndex(e.clientY));
          setDrop(null);
        },
      };

  return (
    <div
      ref={canvas}
      className="pb-canvas"
      data-tour="canvas"
      onClick={(e) => {
        if (e.target === e.currentTarget) select(null);
      }}
    >
      {!preview && room ? (
        <p className="pb-stagecap" style={{ width: Math.round(fit.width * fit.zoom) }}>
          {SCREEN_LABEL[viewport]} · {fit.width} px
          {fit.zoom < 0.995 ? <span> · shown at {Math.round(fit.zoom * 100)}%</span> : null}
        </p>
      ) : null}
      <div ref={stage} className={`pb-stage pb-stage--${viewport}`} style={fitStyle(fit)} {...dragProps}>
        <PageRenderer
          page={page}
          editing={!preview}
          specs={showSpecs}
          globalWrap={(kind, node) =>
            preview ? (
              node
            ) : (
              <div className={`pb-global pb-global--${kind}`} onClick={() => select(null)}>
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
                <InsertPoint index={index} active={drop === index} moving={dropMove} />
                <div
                  id={`mod-${mod.uid}`}
                  className={`pb-frame ${selected === mod.uid ? "is-selected" : ""}`}
                  onClickCapture={() => selected !== mod.uid && select(mod.uid)}
                >
                  <FrameBar mod={mod} index={index} total={total} />
                  {node}
                  <NoteBadge mod={mod} />
                </div>
                {index === total - 1 ? <InsertPoint index={total} active={drop === total} moving={dropMove} /> : null}
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
