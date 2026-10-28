"use client";

import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react";
import { measure } from "@/lib/checks";
import { saveImage, useImageUrl } from "@/lib/images";
import { IMAGE_KINDS, MODULES, bgOf, fieldSpec, isHidden, isOff, limitLabel, type ElementSpec, type FieldSpec } from "@/lib/modules";
import { anchorFor, getAt, toPattern } from "@/lib/path";
import { activePage, useBuilder } from "@/lib/store";
import type { CtaVal, ImageVal, ModuleData, ModuleStyle, ModuleType } from "@/lib/types";
import { ICONS, ICON_NAMES, IconGlyph } from "./icons";

/* ------------------------------------------------------------------ */
/* Module context                                                      */
/* ------------------------------------------------------------------ */

export interface ModCtx {
  uid: string;
  type: ModuleType;
  variant: string;
  data: ModuleData;
  hidden?: string[];
  style?: ModuleStyle;
  anchor?: string;
  editing: boolean;
  specs: boolean;
}

const Ctx = createContext<ModCtx | null>(null);
export const ModuleProvider = Ctx.Provider;
export function useMod(): ModCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useMod outside a module");
  return c;
}

/** Spec for a path; a CTA's ".label" resolves to the CTA's own spec. */
export function specFor(type: ModuleType, path: string): FieldSpec | undefined {
  return fieldSpec(type, path) ?? (path.endsWith(".label") ? fieldSpec(type, path.slice(0, -6)) : undefined);
}

/** The removable element a path belongs to, if any. */
export function elementFor(type: ModuleType, path: string): ElementSpec | undefined {
  const pattern = toPattern(path.endsWith(".label") ? path.slice(0, -6) : path);
  return MODULES[type].elements.find((e) => e.keys.some((k) => pattern === k || pattern.startsWith(`${k}.`)));
}

/** Is this slot on the page? (Not hidden by the layout, not removed by the editor.) */
export function useShown(path: string): boolean {
  const { type, variant, hidden } = useMod();
  const pattern = toPattern(path);
  return !isHidden(type, variant, pattern) && !isOff(type, hidden, pattern);
}

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/* ------------------------------------------------------------------ */
/* Section wrapper: background, spacing and anchor from the inspector  */
/* ------------------------------------------------------------------ */

export function Section({
  base = "agx-sec",
  className,
  label,
  children,
}: {
  base?: string;
  className?: string;
  label: string;
  children: ReactNode;
}) {
  const { type, style, anchor } = useMod();
  const bg = bgOf({ type, style });
  return (
    <section
      id={anchor || undefined}
      className={cx(base, bg && `agx-bg--${bg}`, style?.space && style.space !== "regular" && `agx-space--${style.space}`, className)}
      aria-label={label}
    >
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Spec note (the amber tag shown in edit mode)                        */
/* ------------------------------------------------------------------ */

export function Note({ children }: { children: ReactNode }) {
  const { editing, specs } = useMod();
  if (!editing || !specs) return null;
  return <span className="agx-note">{children}</span>;
}

function noteText(spec?: FieldSpec) {
  if (!spec) return "";
  const lim = spec.limit ? limitLabel(spec.limit) : "";
  return [spec.label, lim, spec.optional ? "optional" : ""].filter(Boolean).join(" · ");
}

/* ------------------------------------------------------------------ */
/* Editable text                                                       */
/* ------------------------------------------------------------------ */

function Editable({
  as,
  className,
  value,
  over,
  label,
  uid,
  path,
  removable,
  onChange,
  onFocus,
  onBlur,
}: {
  as: ElementType;
  className?: string;
  value: string;
  over: boolean;
  label: string;
  uid: string;
  path: string;
  removable: boolean;
  onChange: (v: string) => void;
  onFocus: () => void;
  onBlur: () => void;
}) {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.textContent !== value) el.textContent = value;
  }, [value]);

  const Tag = as;
  return (
    <Tag
      ref={ref}
      className={cx(className, "agx-ed")}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      role="textbox"
      aria-label={label}
      data-label={label}
      data-uid={uid}
      data-path={path}
      data-removable={removable ? "true" : undefined}
      data-over={over ? "true" : undefined}
      spellCheck
      onInput={(e: React.FormEvent<HTMLElement>) => onChange(e.currentTarget.textContent ?? "")}
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === "Enter" || e.key === "Escape") {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      onPaste={(e: React.ClipboardEvent<HTMLElement>) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain").replace(/\s+/g, " ");
        document.execCommand("insertText", false, text);
      }}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  );
}

export function T({
  path,
  as = "span",
  className,
  note = true,
}: {
  path: string;
  as?: ElementType;
  className?: string;
  note?: boolean;
}) {
  const ctx = useMod();
  const shown = useShown(path);
  const update = useBuilder((s) => s.updateField);
  const setFocus = useBuilder((s) => s.setFocus);
  const value = String(getAt(ctx.data, path) ?? "");
  const spec = specFor(ctx.type, path);

  if (!shown) return null;
  if (!ctx.editing) return value ? createElement(as, { className }, value) : null;
  const r = measure(value, spec?.limit);
  return (
    <>
      {note && spec ? <Note>{noteText(spec)}</Note> : null}
      <Editable
        as={as}
        className={className}
        value={value}
        over={!!r?.over}
        label={spec?.label ?? path}
        uid={ctx.uid}
        path={path}
        removable={!!elementFor(ctx.type, path)}
        onChange={(v) => update(ctx.uid, path, v)}
        onFocus={() => setFocus({ uid: ctx.uid, path })}
        onBlur={() => setFocus(null)}
      />
    </>
  );
}

/** A list of paragraphs (an item group of strings) with add and remove in edit mode. */
export function Paras({ group = "paras", className }: { group?: string; className?: string }) {
  const { data, editing } = useMod();
  const list = (getAt(data, group) as string[]) ?? [];
  return (
    <div className={cx("agx-paras", className)}>
      {list.map((_, i) =>
        editing ? (
          <div className="agx-item agx-para" key={i}>
            <T path={`${group}.${i}`} as="p" note={i === 0} />
            <ItemRemove group={group} index={i} />
          </div>
        ) : (
          <T key={i} path={`${group}.${i}`} as="p" />
        ),
      )}
      <ItemAdd group={group} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Remove an element (buttons, eyebrows, subheads…)                    */
/* ------------------------------------------------------------------ */

export function ElementRemove({ path, label }: { path: string; label?: string }) {
  const ctx = useMod();
  const setElement = useBuilder((s) => s.setElement);
  const el = elementFor(ctx.type, path);
  if (!ctx.editing || !el) return null;
  return (
    <button
      type="button"
      className="agx-elx"
      aria-label={`Remove ${label ?? el.label}`}
      title={`Remove ${label ?? el.label} (restore it from the Elements tab)`}
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => {
        e.stopPropagation();
        setElement(ctx.uid, el.id, false);
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
        <path d="M6 6l12 12M18 6 6 18" />
      </svg>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Buttons and links                                                   */
/* ------------------------------------------------------------------ */

export type BtnVariant = "primary" | "cyan" | "outline" | "outline-light" | "link" | "link-light";

function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
      <path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
    </svg>
  );
}

/** Sections on the current page that a link can point to. */
function usePageSections() {
  const page = useBuilder((s) => activePage(s));
  return (page?.modules ?? []).map((m) => {
    const heading = String(m.data.h1 ?? m.data.h2 ?? MODULES[m.type].name);
    return { uid: m.uid, heading, anchor: m.anchor, suggested: anchorFor(heading) };
  });
}

export function LinkEditor({ value, onChange, onDone, autoFocus = false }: { value: string; onChange: (v: string) => void; onDone?: () => void; autoFocus?: boolean }) {
  const ctx = useContext(Ctx);
  const sections = usePageSections().filter((s) => s.uid !== ctx?.uid);
  const setAnchor = useBuilder((s) => s.setAnchor);
  return (
    <span className="agx-linked">
      <label>
        <span>Link to a page, file or URL</span>
        <input
          autoFocus={autoFocus}
          type="text"
          placeholder="/shop/p/rapidcheck or https://…"
          value={value}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Escape") onDone?.();
          }}
          onChange={(e) => onChange(e.target.value.trim())}
        />
      </label>
      {sections.length ? (
        <span className="agx-linked__sections">
          <span>Or a section on this page</span>
          {sections.map((s) => {
            const target = `#${s.anchor || s.suggested}`;
            return (
              <button
                key={s.uid}
                type="button"
                className={value === target ? "is-on" : ""}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  if (!s.anchor) setAnchor(s.uid, s.suggested);
                  onChange(target);
                  onDone?.();
                }}
              >
                <span>{s.heading}</span>
                <small>{target}</small>
              </button>
            );
          })}
        </span>
      ) : null}
    </span>
  );
}

function LinkChip({ path, href }: { path: string; href: string }) {
  const ctx = useMod();
  const update = useBuilder((s) => s.updateField);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const missing = !href || href === "#";

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <span className="agx-linkchip" ref={ref}>
      <button
        type="button"
        className={cx("agx-linkchip__btn", missing && "is-missing", href.startsWith("#") && "is-anchor")}
        aria-label={missing ? "Add a link" : `Link: ${href}`}
        title={missing ? "No link yet" : href}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        {href.startsWith("#") ? <span aria-hidden="true">#</span> : <LinkIcon />}
      </button>
      {open ? (
        <span className="agx-linkchip__pop" onClick={(e) => e.stopPropagation()}>
          <LinkEditor autoFocus value={href} onChange={(v) => update(ctx.uid, `${path}.href`, v)} onDone={() => setOpen(false)} />
        </span>
      ) : null}
    </span>
  );
}

export function Btn({ path, variant, arrow = false, note = true }: { path: string; variant: BtnVariant; arrow?: boolean; note?: boolean }) {
  const ctx = useMod();
  const shown = useShown(path);
  const c = (getAt(ctx.data, path) ?? { label: "", href: "" }) as CtaVal;
  const cls = variant.startsWith("link") ? cx("agx-link", variant === "link-light" && "agx-link--light") : cx("agx-btn", `agx-btn--${variant}`);
  const spec = specFor(ctx.type, path);

  if (!shown) return null;
  if (!ctx.editing) {
    if (!c.label) return null;
    return (
      <a className={cls} href={c.href || "#"}>
        {c.label}
        {arrow ? " →" : null}
      </a>
    );
  }
  return (
    <span className="agx-btnwrap">
      {note && spec ? <Note>{noteText(spec)}</Note> : null}
      <span className="agx-btnrow">
        <a className={cls} href={c.href || "#"} onClick={(e) => e.preventDefault()} data-nolink={!c.href ? "true" : undefined}>
          <T path={`${path}.label`} note={false} />
          {arrow ? <span aria-hidden="true"> →</span> : null}
        </a>
        <LinkChip path={path} href={c.href} />
        <ElementRemove path={path} />
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Icons                                                               */
/* ------------------------------------------------------------------ */

export function IconSlot({ path }: { path: string }) {
  const ctx = useMod();
  const shown = useShown(path);
  const update = useBuilder((s) => s.updateField);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const name = String(getAt(ctx.data, path) ?? "check");

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

  if (!shown) return null;
  const badge = (
    <span className="agx-icon">
      <IconGlyph name={name} size={26} />
    </span>
  );
  if (!ctx.editing) return badge;
  return (
    <span className="agx-iconslot" ref={ref}>
      <button
        type="button"
        className="agx-iconslot__btn"
        aria-label={`Icon: ${ICONS[name]?.label ?? name}. Change icon`}
        title="Change icon"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        {badge}
      </button>
      {open ? (
        <span className="agx-iconpick" role="listbox" aria-label="Agenics icons" onClick={(e) => e.stopPropagation()}>
          {ICON_NAMES.map((n) => (
            <button
              key={n}
              type="button"
              role="option"
              aria-selected={n === name}
              title={ICONS[n].label}
              onClick={() => {
                update(ctx.uid, path, n);
                setOpen(false);
              }}
            >
              <IconGlyph name={n} size={22} />
              <small>{ICONS[n].label}</small>
            </button>
          ))}
        </span>
      ) : null}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Images                                                              */
/* ------------------------------------------------------------------ */

function Placeholder({ kind, editing }: { kind: keyof typeof IMAGE_KINDS; editing: boolean }) {
  const k = IMAGE_KINDS[kind];
  return (
    <span className="agx-ph" aria-hidden="true">
      <span className="agx-ph__ratio">{k.ratio}</span>
      <span className="agx-ph__px">
        {k.w.toLocaleString("en-US")} × {k.h.toLocaleString("en-US")} px
      </span>
      {editing ? <span className="agx-ph__hint">Click or drop an image</span> : null}
    </span>
  );
}

const hasFiles = (e: React.DragEvent) => Array.from(e.dataTransfer.types).includes("Files");

export function Img({
  path,
  className,
  fit = "cover",
  position,
  controls = "overlay",
}: {
  path: string;
  className?: string;
  fit?: "cover" | "contain";
  position?: string;
  /** "overlay": the whole image is the drop target. "chip": a button only (for images behind text). */
  controls?: "overlay" | "chip";
}) {
  const ctx = useMod();
  const shown = useShown(path);
  const update = useBuilder((s) => s.updateField);
  const im = (getAt(ctx.data, path) ?? { id: null, alt: "" }) as ImageVal;
  const spec = specFor(ctx.type, path);
  const kind = spec?.image ?? "feature";
  const stored = useImageUrl(im.id);
  const url = stored ?? (im.id ? null : im.src ?? null);
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!shown) return null;

  const accept = async (file?: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    setBusy(true);
    try {
      const saved = await saveImage(file);
      update(ctx.uid, path, { ...saved, alt: im.alt });
    } finally {
      setBusy(false);
    }
  };

  const k = IMAGE_KINDS[kind];
  const media = url ? (
    // Local blob URLs from IndexedDB or files bundled with the app; next/image cannot optimize blob URLs
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={im.alt} style={{ objectFit: fit, objectPosition: position }} />
  ) : (
    <Placeholder kind={kind} editing={ctx.editing && controls === "overlay"} />
  );

  if (!ctx.editing) return <span className={cx("agx-img", className)}>{media}</span>;

  const dropProps = {
    onDragOver: (e: React.DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      e.stopPropagation();
      setDrag(true);
    },
    onDragLeave: () => setDrag(false),
    onDrop: (e: React.DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      e.stopPropagation();
      setDrag(false);
      accept(e.dataTransfer.files?.[0]);
    },
  };

  return (
    <span
      className={cx("agx-img", "agx-img--edit", className, drag && "is-drag")}
      {...(controls === "overlay" ? dropProps : {})}
      onClick={controls === "overlay" ? () => input.current?.click() : undefined}
    >
      {media}
      <span className={cx("agx-imgbar", controls === "chip" && "agx-imgbar--chip")} {...(controls === "chip" ? dropProps : {})}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            input.current?.click();
          }}
        >
          {busy ? "Saving…" : url ? "Replace" : "Add image"}
        </button>
        {url ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              update(ctx.uid, path, { id: null, alt: im.alt });
            }}
          >
            Clear
          </button>
        ) : null}
        {ctx.specs ? (
          <span className="agx-imgbar__spec">
            {spec?.label} · {k.ratio} · {k.w}×{k.h}
          </span>
        ) : null}
        {url && !im.alt ? <span className="agx-imgbar__warn">No alt text</span> : null}
      </span>
      {elementFor(ctx.type, path) ? (
        <span className="agx-imgx">
          <ElementRemove path={path} />
        </span>
      ) : null}
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          accept(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Repeatable items                                                    */
/* ------------------------------------------------------------------ */

export function ItemRemove({ group, index }: { group: string; index: number }) {
  const ctx = useMod();
  const remove = useBuilder((s) => s.removeItem);
  if (!ctx.editing) return null;
  const g = MODULES[ctx.type].groups.find((x) => x.key === group);
  const list = (getAt(ctx.data, group) as unknown[]) ?? [];
  if (!g || list.length <= g.min) return null;
  return (
    <button
      type="button"
      className="agx-itemx"
      aria-label={`Remove ${g.label} ${index + 1}`}
      title={`Remove ${g.label}`}
      onClick={(e) => {
        e.stopPropagation();
        remove(ctx.uid, group, index);
      }}
    >
      ×
    </button>
  );
}

export function ItemAdd({ group, dark = false }: { group: string; dark?: boolean }) {
  const ctx = useMod();
  const add = useBuilder((s) => s.addItem);
  const shown = useShown(group);
  if (!ctx.editing || !shown) return null;
  const g = MODULES[ctx.type].groups.find((x) => x.key === group);
  const list = (getAt(ctx.data, group) as unknown[]) ?? [];
  if (!g || list.length >= g.max) return null;
  return (
    <button
      type="button"
      className={cx("agx-itemadd", dark && "agx-itemadd--dark")}
      title={`${list.length} of ${g.max}`}
      onClick={(e) => {
        e.stopPropagation();
        add(ctx.uid, group);
      }}
    >
      + Add {g.label}
    </button>
  );
}
