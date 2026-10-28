"use client";

import { useMemo, useRef } from "react";
import { checkPage, measure } from "@/lib/checks";
import { saveImage, useImageUrl } from "@/lib/images";
import { IMAGE_KINDS, MODULES, imageSpecLabel, limitLabel, moduleFields } from "@/lib/modules";
import { getAt, itemNumber, slugify } from "@/lib/path";
import { RECIPES } from "@/lib/recipes";
import { activePage, useBuilder } from "@/lib/store";
import type { CtaVal, ImageVal, ModuleInstance } from "@/lib/types";

function numbered(label: string, path: string) {
  const n = itemNumber(path);
  return n ? `${label} ${n}` : label;
}

function ImageRow({ mod, path, label, kind }: { mod: ModuleInstance; path: string; label: string; kind: keyof typeof IMAGE_KINDS }) {
  const update = useBuilder((s) => s.updateField);
  const im = (getAt(mod.data, path) ?? { id: null, alt: "" }) as ImageVal;
  const url = useImageUrl(im.id);
  const input = useRef<HTMLInputElement>(null);
  const k = IMAGE_KINDS[kind];
  const small = im.id && im.w && im.h && (im.w < k.w * 0.75 || im.h < k.h * 0.75);
  const offRatio = im.id && im.w && im.h && Math.abs(im.w / im.h - k.r) / k.r > 0.08;
  return (
    <div className="pb-imgrow">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="pb-thumb" src={url} alt="" />
      ) : (
        <span className="pb-thumb">{k.ratio}</span>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
        <b style={{ fontSize: 13 }}>{label}</b>
        <span style={{ fontSize: 12, color: "var(--ag-gray)" }}>{imageSpecLabel(kind)}</span>
        {im.id ? (
          <span style={{ fontSize: 12, color: "var(--ag-gray)" }}>
            Uploaded: {im.w}×{im.h}
            {im.name ? ` · ${im.name}` : ""}
          </span>
        ) : null}
        {small ? <span className="pb-warn">Smaller than spec; it may look soft.</span> : null}
        {offRatio ? <span className="pb-warn">Not {k.ratio}; it will be cropped.</span> : null}
        <label className="pb-field">
          Alt text{kind === "doc" ? " (optional for covers)" : ""}
          <input
            value={im.alt}
            placeholder="Describe the photo in one sentence"
            onChange={(e) => update(mod.uid, `${path}.alt`, e.target.value)}
          />
        </label>
        {im.id && !im.alt && kind !== "doc" ? <span className="pb-err">Alt text missing</span> : null}
        <div className="pb-actions">
          <button type="button" className="pb-btn pb-btn--sm" onClick={() => input.current?.click()}>
            {im.id ? "Replace" : "Upload"}
          </button>
          {im.id ? (
            <button type="button" className="pb-btn pb-btn--sm" onClick={() => update(mod.uid, path, { id: null, alt: im.alt })}>
              Remove
            </button>
          ) : null}
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
    </div>
  );
}

function ModuleInspector({ mod, index, total }: { mod: ModuleInstance; index: number; total: number }) {
  const meta = MODULES[mod.type];
  const setVariant = useBuilder((s) => s.setVariant);
  const addItem = useBuilder((s) => s.addItem);
  const removeItem = useBuilder((s) => s.removeItem);
  const update = useBuilder((s) => s.updateField);
  const move = useBuilder((s) => s.moveModule);
  const dup = useBuilder((s) => s.duplicateModule);
  const remove = useBuilder((s) => s.removeModule);

  const fields = moduleFields(mod.type, mod.variant, mod.data);
  const ctas = fields.filter((f) => f.spec.kind === "cta" || f.spec.kind === "href");
  const images = fields.filter((f) => f.spec.kind === "image");
  const texts = fields.filter((f) => f.spec.kind === "text" && f.spec.limit);

  return (
    <div className="pb-insp">
      <div className="pb-insp__head">
        <div className="pb-insp__title">
          <span className={`pb-code ${meta.status === "required" ? "pb-code--req" : ""}`}>{meta.code}</span>
          <h2>{meta.name}</h2>
          <span className="pb-status">{meta.status}</span>
        </div>
        <p>{meta.summary}</p>
        <p>
          <b style={{ color: "var(--ag-charcoal)" }}>Squarespace:</b> {meta.squarespace}
        </p>
        <p>
          <b style={{ color: "var(--ag-charcoal)" }}>Replaces:</b> {meta.replaces}
        </p>
      </div>

      {meta.variants.length ? (
        <section>
          <h3>Layout</h3>
          <div className="pb-seg" role="group" aria-label="Layout">
            {meta.variants.map((v) => (
              <button key={v.id} type="button" aria-pressed={mod.variant === v.id} onClick={() => setVariant(mod.uid, v.id)}>
                {v.label}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {meta.groups.length ? (
        <section>
          <h3>Content blocks</h3>
          {meta.groups.map((g) => {
            const n = ((getAt(mod.data, g.key) as unknown[]) ?? []).length;
            const rec = g.recMin === g.recMax ? `${g.recMin}` : `${g.recMin}–${g.recMax}`;
            return (
              <div key={g.key} className="pb-counter">
                <span>
                  {g.label[0].toUpperCase() + g.label.slice(1)}s <small style={{ color: "var(--ag-gray)" }}>· {rec} recommended</small>
                </span>
                <span className="pb-counter__ctl">
                  <button
                    type="button"
                    className="pb-btn pb-btn--sm pb-icon"
                    aria-label={`Remove last ${g.label}`}
                    disabled={n <= g.min}
                    onClick={() => removeItem(mod.uid, g.key, n - 1)}
                  >
                    −
                  </button>
                  <span>
                    {n}/{g.max}
                  </span>
                  <button
                    type="button"
                    className="pb-btn pb-btn--sm pb-icon"
                    aria-label={`Add ${g.label}`}
                    disabled={n >= g.max}
                    onClick={() => addItem(mod.uid, g.key)}
                  >
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
          {ctas.map(({ path, spec }) => {
            const isCta = spec.kind === "cta";
            const c = isCta ? ((getAt(mod.data, path) ?? { label: "", href: "" }) as CtaVal) : null;
            const href = isCta ? c!.href : String(getAt(mod.data, path) ?? "");
            return (
              <label key={path} className="pb-field">
                {numbered(spec.label, path)}
                {c?.label ? <span className="pb-help">“{c.label}”</span> : null}
                <input
                  value={href}
                  placeholder="/shop/p/… · /agenics-contact · https://…"
                  onChange={(e) => update(mod.uid, isCta ? `${path}.href` : path, e.target.value.trim())}
                  style={!href ? { borderColor: "#e8c46a", background: "#fff9e8" } : undefined}
                />
              </label>
            );
          })}
          <p>Point every button at the exact product, form or file — never a category page or the top of another long page.</p>
        </section>
      ) : null}

      {images.length ? (
        <section>
          <h3>Images</h3>
          {images.map(({ path, spec }) => (
            <ImageRow key={path} mod={mod} path={path} label={numbered(spec.label, path)} kind={spec.image!} />
          ))}
        </section>
      ) : null}

      {texts.length ? (
        <section>
          <h3>Copy limits</h3>
          {texts.map(({ path, spec }) => {
            const r = measure(String(getAt(mod.data, path) ?? ""), spec.limit)!;
            const pct = Math.min(100, Math.round((r.used / r.max) * 100));
            return (
              <div key={path} className={`pb-limit ${r.over ? "is-over" : ""}`} title={spec.guidance}>
                <span>{numbered(spec.label, path)}</span>
                <b>
                  {r.used}/{r.max}
                </b>
                <span className="pb-limit__bar">
                  <i style={{ width: `${pct}%` }} />
                </span>
              </div>
            );
          })}
          <p>Limits: {[...new Set(texts.map((t) => limitLabel(t.spec.limit)))].slice(0, 3).join(" · ")}. Cut copy rather than shrinking type.</p>
        </section>
      ) : null}

      <section>
        <h3>Module</h3>
        <div className="pb-actions">
          <button type="button" className="pb-btn pb-btn--sm" disabled={index === 0} onClick={() => move(mod.uid, -1)}>
            Move up
          </button>
          <button type="button" className="pb-btn pb-btn--sm" disabled={index === total - 1} onClick={() => move(mod.uid, 1)}>
            Move down
          </button>
          <button type="button" className="pb-btn pb-btn--sm" onClick={() => dup(mod.uid)}>
            Duplicate
          </button>
          <button type="button" className="pb-btn pb-btn--sm pb-btn--danger" onClick={() => remove(mod.uid)}>
            Remove
          </button>
        </div>
      </section>
    </div>
  );
}

function Count({ n, min, max }: { n: number; min?: number; max: number }) {
  const bad = n > max || (min !== undefined && n > 0 && n < min);
  return (
    <span className={`pb-count ${bad ? "is-over" : ""}`}>
      {n}
      {min ? `/${min}–${max}` : `/${max}`} characters
    </span>
  );
}

function PageInspector() {
  const page = useBuilder((s) => activePage(s));
  const updatePage = useBuilder((s) => s.updatePage);
  const issues = useMemo(() => (page ? checkPage(page) : []), [page]);
  if (!page) return null;
  const recipe = RECIPES.find((r) => r.id === page.recipe);
  const errors = issues.filter((i) => i.level === "error").length;
  return (
    <div className="pb-insp">
      <div className="pb-insp__head">
        <div className="pb-insp__title">
          <h2>Page settings</h2>
        </div>
        <p>Select a module on the page to edit its layout, content blocks, links and images.</p>
      </div>
      <section>
        <label className="pb-field">
          Page name
          <input value={page.name} onChange={(e) => updatePage({ name: e.target.value })} />
        </label>
        <label className="pb-field">
          URL slug
          <input
            value={page.slug}
            placeholder="dental-water"
            onChange={(e) => updatePage({ slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
          />
          <span className="pb-help">agenics.com/{page.slug || "…"} · lowercase words joined by hyphens</span>
        </label>
        {!page.slug ? (
          <button type="button" className="pb-btn pb-btn--sm" onClick={() => updatePage({ slug: slugify(page.name) })}>
            Use “{slugify(page.name)}”
          </button>
        ) : null}
        <label className="pb-field">
          SEO title
          <input value={page.seoTitle} placeholder="Dental Waterline Testing | Agenics Labs" onChange={(e) => updatePage({ seoTitle: e.target.value })} />
          <Count n={page.seoTitle.length} max={60} />
        </label>
        <label className="pb-field">
          Meta description
          <textarea value={page.metaDescription} onChange={(e) => updatePage({ metaDescription: e.target.value })} />
          <Count n={page.metaDescription.length} min={140} max={160} />
        </label>
      </section>
      <section>
        <h3>Recipe</h3>
        <p>
          <b style={{ color: "var(--ag-charcoal)" }}>{recipe?.name ?? page.recipe}</b>
          {recipe?.useFor ? ` · ${recipe.useFor}` : ""}
        </p>
        <p>{page.modules.length} modules on the page.</p>
      </section>
      <section>
        <h3>Page checks</h3>
        <p>
          {issues.length === 0
            ? "Every check passes."
            : `${errors} to fix, ${issues.length - errors} to check. See the Checks tab on the left.`}
        </p>
      </section>
    </div>
  );
}

export function Inspector() {
  const page = useBuilder((s) => activePage(s));
  const selected = useBuilder((s) => s.selectedUid);
  const index = page?.modules.findIndex((m) => m.uid === selected) ?? -1;
  return (
    <aside className="pb-right" aria-label="Inspector">
      {page && index >= 0 ? (
        <ModuleInspector key={selected} mod={page.modules[index]} index={index} total={page.modules.length} />
      ) : (
        <PageInspector />
      )}
    </aside>
  );
}
