"use client";

import { useRef, useState } from "react";
import { saveImage, useImageUrl } from "@/lib/images";
import { BACKGROUNDS, IMAGE_KINDS, MODULES, bgOf, moduleFields } from "@/lib/modules";
import { anchorFor, getAt, itemNumber, slugify } from "@/lib/path";
import { RECIPES } from "@/lib/recipes";
import { activePage, useBuilder } from "@/lib/store";
import type { CtaVal, ImageKind, ImageVal, ModuleInstance, Space } from "@/lib/types";
import { ModuleThumb } from "./thumbs";
import { BG_SWATCH, Icon } from "./ui";

function numbered(label: string, path: string) {
  const n = itemNumber(path);
  return n ? `${label} ${n}` : label;
}

const plural = (s: string) => (s.endsWith("s") ? s : `${s}s`);
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

function ImageRow({ mod, path, label, kind }: { mod: ModuleInstance; path: string; label: string; kind: ImageKind }) {
  const update = useBuilder((s) => s.updateField);
  const im = (getAt(mod.data, path) ?? { id: null, alt: "" }) as ImageVal;
  const stored = useImageUrl(im.id);
  const url = stored ?? (im.id ? null : im.src ?? null);
  const input = useRef<HTMLInputElement>(null);
  const k = IMAGE_KINDS[kind];
  const has = !!(im.id || im.src);
  const small = has && im.w && im.h && (im.w < k.w * 0.75 || im.h < k.h * 0.75);
  return (
    <div className="pb-imgrow">
      <button type="button" className="pb-thumb" onClick={() => input.current?.click()} title={has ? "Replace image" : "Add image"}>
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" />
        ) : (
          <span>{k.ratio}</span>
        )}
      </button>
      <div className="pb-imgrow__body">
        <b>{label}</b>
        <small>
          {k.ratio} · {k.w}×{k.h}
          {kind === "product" ? " · transparent PNG" : ""}
        </small>
        <input
          className={has && !im.alt && kind !== "doc" ? "is-missing" : ""}
          value={im.alt}
          aria-label={`${label} alt text`}
          placeholder="Describe the image (alt text)"
          onChange={(e) => update(mod.uid, `${path}.alt`, e.target.value)}
        />
        {small ? <span className="pb-warn">A bit small; it may look soft.</span> : null}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          const saved = await saveImage(f);
          update(mod.uid, path, { ...saved, alt: im.alt });
        }}
      />
    </div>
  );
}

function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className={`pb-switch ${on ? "is-on" : ""}`} onClick={() => onChange(!on)}>
      <i />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Block inspector                                                     */
/* ------------------------------------------------------------------ */

type ITab = "content" | "style" | "elements";

function ModuleInspector({ mod }: { mod: ModuleInstance }) {
  const meta = MODULES[mod.type];
  const page = useBuilder((s) => activePage(s));
  const setVariant = useBuilder((s) => s.setVariant);
  const addItem = useBuilder((s) => s.addItem);
  const removeItem = useBuilder((s) => s.removeItem);
  const update = useBuilder((s) => s.updateField);
  const setElement = useBuilder((s) => s.setElement);
  const setStyle = useBuilder((s) => s.setStyle);
  const setAnchor = useBuilder((s) => s.setAnchor);
  const setNote = useBuilder((s) => s.setNote);
  const dup = useBuilder((s) => s.duplicateModule);
  const remove = useBuilder((s) => s.removeModule);
  const [tab, setTab] = useState<ITab>("content");

  const fields = moduleFields(mod.type, mod.variant, mod.data, mod.hidden);
  const ctas = fields.filter((f) => f.spec.kind === "cta" || f.spec.kind === "href");
  const images = fields.filter((f) => f.spec.kind === "image");
  const hiddenCount = meta.elements.filter((e) => mod.hidden?.includes(e.id)).length;
  const bg = bgOf(mod);
  const anchors = (page?.modules ?? []).filter((m) => m.anchor && m.uid !== mod.uid).map((m) => `#${m.anchor}`);
  const heading = String(mod.data.h1 ?? mod.data.h2 ?? meta.name);

  return (
    <div className="pb-insp">
      <div className="pb-insp__head">
        <ModuleThumb type={mod.type} variant={mod.variant} className="pb-insp__thumb" />
        <div>
          <h2>{meta.name}</h2>
          <p>{meta.summary}</p>
        </div>
      </div>

      <div className="pb-itabs" role="tablist">
        {(
          [
            ["content", "Content"],
            ["style", "Style"],
            ["elements", hiddenCount ? `Show / hide · ${hiddenCount}` : "Show / hide"],
          ] as [ITab, string][]
        ).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {tab === "content" ? (
        <>
          {meta.variants.length > 1 ? (
            <section>
              <h3>Layout</h3>
              <div className="pb-variants">
                {meta.variants.map((v) => (
                  <button key={v.id} type="button" aria-pressed={mod.variant === v.id} onClick={() => setVariant(mod.uid, v.id)}>
                    <ModuleThumb type={mod.type} variant={v.id} />
                    <span>{v.label}</span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {meta.groups.length ? (
            <section>
              <h3>How many</h3>
              {meta.groups.map((g) => {
                const n = ((getAt(mod.data, g.key) as unknown[]) ?? []).length;
                const rec = g.recMin === g.recMax ? `${g.recMin}` : `${g.recMin}–${g.recMax}`;
                return (
                  <div key={g.key} className="pb-counter" title={`${rec} works best`}>
                    <span>{cap(plural(g.label))}</span>
                    <span className="pb-counter__ctl">
                      <button type="button" className="pb-btn pb-icon" aria-label={`Remove last ${g.label}`} disabled={n <= g.min} onClick={() => removeItem(mod.uid, g.key, n - 1)}>
                        −
                      </button>
                      <span>{n}</span>
                      <button type="button" className="pb-btn pb-icon" aria-label={`Add ${g.label}`} disabled={n >= g.max} onClick={() => addItem(mod.uid, g.key)}>
                        +
                      </button>
                    </span>
                  </div>
                );
              })}
            </section>
          ) : null}

          {ctas.length ? (
            <section>
              <h3>Links</h3>
              <datalist id={`anchors-${mod.uid}`}>
                {anchors.map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
              {ctas.map(({ path, spec }) => {
                const isCta = spec.kind === "cta";
                const c = isCta ? ((getAt(mod.data, path) ?? { label: "", href: "" }) as CtaVal) : null;
                const href = isCta ? c!.href : String(getAt(mod.data, path) ?? "");
                return (
                  <label key={path} className="pb-field">
                    <span className="pb-field__label">
                      {c?.label ? `“${c.label}”` : numbered(spec.label, path)}
                    </span>
                    <input
                      className={!href ? "is-missing" : ""}
                      value={href}
                      list={`anchors-${mod.uid}`}
                      placeholder="/shop/p/… or #section"
                      onChange={(e) => update(mod.uid, isCta ? `${path}.href` : path, e.target.value.trim())}
                    />
                  </label>
                );
              })}
            </section>
          ) : null}

          {images.length ? (
            <section>
              <h3>Images</h3>
              {images.map(({ path, spec }) => (
                <ImageRow key={path} mod={mod} path={path} label={numbered(spec.label, path)} kind={spec.image ?? "feature"} />
              ))}
            </section>
          ) : null}

          {!meta.variants.length && !meta.groups.length && !ctas.length && !images.length ? (
            <section>
              <p>Click any text on the page to edit it.</p>
            </section>
          ) : null}
        </>
      ) : null}

      {tab === "style" ? (
        <>
          <section>
            <h3>Background</h3>
            {meta.backgrounds.length ? (
              <>
                <div className="pb-swatches" role="radiogroup" aria-label="Background">
                  {meta.backgrounds.map((b) => (
                    <button
                      key={b}
                      type="button"
                      role="radio"
                      aria-checked={bg === b}
                      title={BACKGROUNDS[b].note}
                      onClick={() => setStyle(mod.uid, { bg: b })}
                    >
                      <i style={{ background: BG_SWATCH[b] }} />
                      <span>{BACKGROUNDS[b].label.replace(" 18%", "").replace(" 12%", " tint")}</span>
                    </button>
                  ))}
                </div>
                <p>Alternate backgrounds so each section stands apart. Only brand-approved colors are offered.</p>
              </>
            ) : (
              <p>This block always uses navy, as the brand guide sets for it.</p>
            )}
          </section>
          {mod.type !== "hero" && mod.type !== "cta" ? (
            <section>
              <h3>Spacing</h3>
              <div className="pb-seg" role="group" aria-label="Spacing">
                {(["compact", "regular", "roomy"] as Space[]).map((sp) => (
                  <button key={sp} type="button" aria-pressed={(mod.style?.space ?? "regular") === sp} onClick={() => setStyle(mod.uid, { space: sp })}>
                    {cap(sp)}
                  </button>
                ))}
              </div>
            </section>
          ) : null}
          <section>
            <h3>Section link</h3>
            <label className="pb-field">
              <span className="pb-field__label">Buttons can jump here with #{mod.anchor || "…"}</span>
              <span className="pb-hash">
                <b>#</b>
                <input value={mod.anchor ?? ""} placeholder={anchorFor(heading)} onChange={(e) => setAnchor(mod.uid, e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))} />
              </span>
            </label>
            {!mod.anchor ? (
              <button type="button" className="pb-btn pb-btn--sm" onClick={() => setAnchor(mod.uid, anchorFor(heading))}>
                Use #{anchorFor(heading)}
              </button>
            ) : null}
          </section>
          <section>
            <h3>Note for the team</h3>
            <label className="pb-field">
              <textarea value={mod.note ?? ""} placeholder="e.g. Waiting on final prices" onChange={(e) => setNote(mod.uid, e.target.value)} />
              <span className="pb-field__help">Shows on the page while editing and in the brief. Never published.</span>
            </label>
          </section>
          <details className="pb-about">
            <summary>For the developer</summary>
            <p>
              <b>Squarespace:</b> {meta.squarespace}
            </p>
            <p>
              <b>Replaces:</b> {meta.replaces}
            </p>
            <p>
              <b>Block code:</b> {meta.code}
            </p>
          </details>
        </>
      ) : null}

      {tab === "elements" ? (
        <section>
          <h3>Show / hide</h3>
          {meta.elements.length ? (
            <>
              <div className="pb-elements">
                {meta.elements.map((e) => {
                  const on = !mod.hidden?.includes(e.id);
                  return (
                    <div key={e.id} className={`pb-element ${on ? "" : "is-off"}`}>
                      <span>{e.label}</span>
                      <Switch on={on} label={`${on ? "Hide" : "Show"} ${e.label}`} onChange={(v) => setElement(mod.uid, e.id, v)} />
                    </div>
                  );
                })}
              </div>
              <p>Hidden elements keep their text, so you can switch them back on any time.</p>
            </>
          ) : (
            <p>Everything in this block is required.</p>
          )}
        </section>
      ) : null}

      <div className="pb-insp__foot">
        <button type="button" className="pb-btn pb-btn--sm" onClick={() => dup(mod.uid)}>
          <Icon name="copy" size={14} /> Duplicate
        </button>
        <button type="button" className="pb-btn pb-btn--sm pb-btn--danger" onClick={() => remove(mod.uid)}>
          <Icon name="trash" size={14} /> Delete block
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page settings                                                       */
/* ------------------------------------------------------------------ */

function Count({ n, min, max }: { n: number; min?: number; max: number }) {
  const bad = n > max || (min !== undefined && n > 0 && n < min);
  return (
    <span className={`pb-count ${bad ? "is-over" : ""}`}>
      {n}/{max}
    </span>
  );
}

function PageInspector() {
  const page = useBuilder((s) => activePage(s));
  const updatePage = useBuilder((s) => s.updatePage);
  const tidy = useBuilder((s) => s.tidyBackgrounds);
  if (!page) return null;
  const recipe = RECIPES.find((r) => r.id === page.recipe);
  return (
    <div className="pb-insp">
      <div className="pb-insp__head pb-insp__head--page">
        <div>
          <h2>Page settings</h2>
          <p>Click a block on the page to edit it. These settings are for the whole page.</p>
        </div>
      </div>
      <section>
        <label className="pb-field">
          <span className="pb-field__label">Page name</span>
          <input value={page.name} onChange={(e) => updatePage({ name: e.target.value })} />
        </label>
        <label className="pb-field">
          <span className="pb-field__label">Web address</span>
          <span className="pb-hash pb-hash--url">
            <b>agenics.com/</b>
            <input
              value={page.slug}
              placeholder={slugify(page.name)}
              onChange={(e) => updatePage({ slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
            />
          </span>
        </label>
      </section>
      <section>
        <h3>How it looks on Google</h3>
        <div className="pb-serp" aria-label="Google preview">
          <span className="pb-serp__url">agenics.com › {page.slug || slugify(page.name)}</span>
          <span className="pb-serp__title">{page.seoTitle || page.name}</span>
          <span className="pb-serp__desc">{page.metaDescription || "Write a description so Google shows your words, not a guess."}</span>
        </div>
        <label className="pb-field">
          <span className="pb-field__label">
            Google title <Count n={page.seoTitle.length} max={60} />
          </span>
          <input value={page.seoTitle} placeholder="Dental Waterline Testing | Agenics Labs" onChange={(e) => updatePage({ seoTitle: e.target.value })} />
        </label>
        <label className="pb-field">
          <span className="pb-field__label">
            Google description <Count n={page.metaDescription.length} min={140} max={160} />
          </span>
          <textarea value={page.metaDescription} onChange={(e) => updatePage({ metaDescription: e.target.value })} />
        </label>
      </section>
      <section>
        <h3>Look</h3>
        <button type="button" className="pb-btn pb-btn--block" onClick={tidy}>
          <Icon name="sparkle" size={16} /> Tidy backgrounds
        </button>
        <p>
          Started from: <b>{recipe?.name ?? page.recipe}</b> · {page.modules.length} blocks
        </p>
      </section>
    </div>
  );
}

export function Inspector() {
  const page = useBuilder((s) => activePage(s));
  const selected = useBuilder((s) => s.selectedUid);
  const mod = page?.modules.find((m) => m.uid === selected);
  return (
    <aside className="pb-right" aria-label="Settings">
      {mod ? <ModuleInspector key={mod.uid} mod={mod} /> : <PageInspector />}
    </aside>
  );
}
