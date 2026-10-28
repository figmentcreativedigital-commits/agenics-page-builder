"use client";

import {
  createContext,
  createElement,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react";
import { measure } from "@/lib/checks";
import { saveImage, useImageUrl } from "@/lib/images";
import { IMAGE_KINDS, MODULES, fieldSpec, limitLabel, type FieldSpec } from "@/lib/modules";
import { getAt } from "@/lib/path";
import { useBuilder } from "@/lib/store";
import type { CtaVal, ImageVal, ModuleData, ModuleType } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Module context                                                      */
/* ------------------------------------------------------------------ */

export interface ModCtx {
  uid: string;
  type: ModuleType;
  variant: string;
  data: ModuleData;
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

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

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
  onChange,
  onFocus,
  onBlur,
}: {
  as: ElementType;
  className?: string;
  value: string;
  over: boolean;
  label: string;
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
  const update = useBuilder((s) => s.updateField);
  const setFocus = useBuilder((s) => s.setFocus);
  const value = String(getAt(ctx.data, path) ?? "");
  const spec = specFor(ctx.type, path);

  if (!ctx.editing) return createElement(as, { className }, value);
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
        onChange={(v) => update(ctx.uid, path, v)}
        onFocus={() => setFocus({ uid: ctx.uid, path })}
        onBlur={() => setFocus(null)}
      />
    </>
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

function LinkChip({ path, href }: { path: string; href: string }) {
  const ctx = useMod();
  const update = useBuilder((s) => s.updateField);
  const [open, setOpen] = useState(false);
  const missing = !href || href === "#";
  return (
    <span className="agx-linkchip">
      <button
        type="button"
        className={cx("agx-linkchip__btn", missing && "is-missing")}
        aria-label={missing ? "Add a link" : `Link: ${href}`}
        title={missing ? "No link yet" : href}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        <LinkIcon />
      </button>
      {open ? (
        <span className="agx-linkchip__pop" onClick={(e) => e.stopPropagation()}>
          <label>
            <span>Link to</span>
            <input
              autoFocus
              type="text"
              placeholder="/shop/p/rapidcheck or https://…"
              defaultValue={href}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "Escape") setOpen(false);
              }}
              onChange={(e) => update(ctx.uid, `${path}.href`, e.target.value.trim())}
              onBlur={() => setOpen(false)}
            />
          </label>
        </span>
      ) : null}
    </span>
  );
}

export function Btn({ path, variant, arrow = false, note = true }: { path: string; variant: BtnVariant; arrow?: boolean; note?: boolean }) {
  const ctx = useMod();
  const c = (getAt(ctx.data, path) ?? { label: "", href: "" }) as CtaVal;
  const cls = variant.startsWith("link") ? cx("agx-link", variant === "link-light" && "agx-link--light") : cx("agx-btn", `agx-btn--${variant}`);
  const spec = specFor(ctx.type, path);

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
      </span>
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
  const update = useBuilder((s) => s.updateField);
  const im = (getAt(ctx.data, path) ?? { id: null, alt: "" }) as ImageVal;
  const spec = specFor(ctx.type, path);
  const kind = spec?.image ?? "feature";
  const url = useImageUrl(im.id);
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);

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
    // Local blob URLs from IndexedDB; next/image cannot optimize these
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={im.alt} style={{ objectFit: fit, objectPosition: position }} />
  ) : (
    <Placeholder kind={kind} editing={ctx.editing && controls === "overlay"} />
  );

  if (!ctx.editing) return <span className={cx("agx-img", className)}>{media}</span>;

  const dropProps = {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setDrag(true);
    },
    onDragLeave: () => setDrag(false),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
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
            Remove
          </button>
        ) : null}
        {ctx.specs ? (
          <span className="agx-imgbar__spec">
            {spec?.label} · {k.ratio} · {k.w}×{k.h}
          </span>
        ) : null}
        {url && !im.alt ? <span className="agx-imgbar__warn">No alt text</span> : null}
      </span>
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
  if (!ctx.editing) return null;
  const g = MODULES[ctx.type].groups.find((x) => x.key === group);
  const list = (getAt(ctx.data, group) as unknown[]) ?? [];
  if (!g || list.length >= g.max) return null;
  return (
    <button
      type="button"
      className={cx("agx-itemadd", dark && "agx-itemadd--dark")}
      onClick={(e) => {
        e.stopPropagation();
        add(ctx.uid, group);
      }}
    >
      + Add {g.label} ({list.length}/{g.max})
    </button>
  );
}
