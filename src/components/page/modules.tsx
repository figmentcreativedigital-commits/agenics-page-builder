"use client";

import { Fragment } from "react";
import { getAt } from "@/lib/path";
import { useBuilder } from "@/lib/store";
import type { ModuleType } from "@/lib/types";
import { Btn, Img, ItemAdd, ItemRemove, Note, T, useMod } from "./edit";

/* eslint-disable @typescript-eslint/no-explicit-any */

const list = (data: any, key: string): any[] => (getAt(data, key) as any[]) ?? [];

function RingIcon({ dark = false }: { dark?: boolean }) {
  // Echoes the Agenics mark: concentric rings with a check
  return (
    <svg className="agx-ringicon" width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
      <circle cx="22" cy="22" r="20" fill="none" stroke={dark ? "#FFFFFF" : "var(--ag-silver)"} strokeWidth="3" />
      <circle cx="22" cy="22" r="13" fill="var(--ag-navy)" />
      <path d="M16.5 22.5l3.8 3.8 7.4-8" fill="none" stroke="var(--ag-cyan)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true" className="agx-pathicon">
      <circle cx="32" cy="32" r="30" fill="var(--ag-cyan)" />
      <circle cx="32" cy="32" r="22" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />
      <path d="M25 39l13-13m-8 0h8v8" fill="none" stroke="var(--ag-navy)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* M01 ---------------------------------------------------------------- */
function Hero() {
  const { variant } = useMod();
  if (variant === "split") {
    return (
      <section className="agx-hero agx-hero--split" aria-label="Hero">
        <div className="agx-hero__split">
          <div className="agx-hero__body">
            <T path="eyebrow" as="p" className="agx-eyebrow agx-eyebrow--cyan" />
            <T path="h1" as="h1" className="agx-h1" />
            <T path="sub" as="p" className="agx-hero__sub" />
            <div className="agx-btns">
              <Btn path="cta1" variant="cyan" />
              <Btn path="cta2" variant="outline-light" />
            </div>
          </div>
          <Img path="image" className="agx-hero__splitimg" />
        </div>
      </section>
    );
  }
  return (
    <section className="agx-hero" aria-label="Hero">
      <Img path="image" className="agx-hero__media" position="75% 50%" controls="chip" />
      <div className="agx-hero__shade" aria-hidden="true" />
      <div className="agx-wrap agx-hero__inner">
        <div className="agx-hero__body">
          <T path="eyebrow" as="p" className="agx-eyebrow agx-eyebrow--cyan" />
          <T path="h1" as="h1" className="agx-h1" />
          <T path="sub" as="p" className="agx-hero__sub" />
          <div className="agx-btns">
            <Btn path="cta1" variant="cyan" />
            <Btn path="cta2" variant="outline-light" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* M02 ---------------------------------------------------------------- */
function Trust() {
  const { data } = useMod();
  return (
    <section className="agx-trust" aria-label="Proof points">
      <div className="agx-wrap">
        <div className="agx-trust__grid">
          {list(data, "items").map((_, i) => (
            <div className="agx-trust__item agx-item" key={i}>
              <RingIcon />
              <div className="agx-col">
                <T path={`items.${i}.title`} as="p" className="agx-trust__title" note={i === 0} />
                <T path={`items.${i}.detail`} as="p" className="agx-trust__detail" note={i === 0} />
              </div>
              <ItemRemove group="items" index={i} />
            </div>
          ))}
        </div>
        <ItemAdd group="items" />
      </div>
    </section>
  );
}

/* M03 ---------------------------------------------------------------- */
function Intro() {
  const { data, variant } = useMod();
  return (
    <section className="agx-sec" aria-label="Introduction">
      <div className="agx-wrap agx-center">
        <div className="agx-intro">
          <T path="h2" as="h2" className="agx-h2" />
          <T path="body" as="p" className="agx-lead" />
        </div>
        {variant !== "text" ? (
          <>
            <div className="agx-paths">
              {list(data, "paths").map((_, i) => (
                <div className="agx-path agx-item" key={i}>
                  <ArrowIcon />
                  <div className="agx-col">
                    <T path={`paths.${i}.title`} as="h3" className="agx-h3" note={i === 0} />
                    <T path={`paths.${i}.line`} as="p" className="agx-small" note={i === 0} />
                    <Btn path={`paths.${i}.link`} variant="link" arrow note={i === 0} />
                  </div>
                  <ItemRemove group="paths" index={i} />
                </div>
              ))}
            </div>
            <ItemAdd group="paths" />
          </>
        ) : null}
      </div>
    </section>
  );
}

/* M04 ---------------------------------------------------------------- */
function Feature() {
  const { data, variant } = useMod();
  return (
    <section className="agx-sec agx-sec--tint" aria-label="Feature">
      <div className={`agx-wrap agx-feature ${variant === "image-right" ? "agx-feature--right" : ""}`}>
        <div className="agx-feature__media">
          <Img path="image" className="agx-ratio-4x5 agx-rounded" />
        </div>
        <div className="agx-feature__body">
          <T path="eyebrow" as="p" className="agx-eyebrow" />
          <T path="h2" as="h2" className="agx-h2" />
          <div className="agx-benefits">
            {list(data, "benefits").map((_, i) => (
              <div className="agx-benefit agx-item" key={i}>
                <span className="agx-benefit__mark" aria-hidden="true" />
                <div className="agx-col">
                  <T path={`benefits.${i}.title`} as="h3" className="agx-h3" note={i === 0} />
                  <T path={`benefits.${i}.body`} as="p" note={i === 0} />
                </div>
                <ItemRemove group="benefits" index={i} />
              </div>
            ))}
            <ItemAdd group="benefits" />
          </div>
          <div className="agx-btns">
            <Btn path="cta" variant="outline" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* M05 ---------------------------------------------------------------- */
function Products() {
  const { data } = useMod();
  return (
    <section className="agx-sec" aria-label="Products">
      <div className="agx-wrap">
        <div className="agx-head agx-center">
          <T path="h2" as="h2" className="agx-h2" />
          <T path="intro" as="p" className="agx-lead" />
        </div>
        <div className="agx-cards">
          {list(data, "cards").map((card, i) => (
            <article className="agx-card agx-item" key={i}>
              <div className="agx-card__tile">
                <Img path={`cards.${i}.image`} className="agx-ratio-1x1" fit="contain" />
              </div>
              <div className="agx-card__body">
                <T path={`cards.${i}.type`} as="p" className="agx-kicker" note={i === 0} />
                <T path={`cards.${i}.name`} as="h3" className="agx-h3 agx-card__name" note={i === 0} />
                <T path={`cards.${i}.tagline`} as="p" note={i === 0} />
                <ul className="agx-bullets">
                  {(card.bullets as string[]).map((_, b) => (
                    <Fragment key={b}>
                      <li>
                        <T path={`cards.${i}.bullets.${b}`} note={i === 0 && b === 0} />
                      </li>
                    </Fragment>
                  ))}
                </ul>
                <T path={`cards.${i}.price`} as="p" className="agx-price" note={i === 0} />
                <div className="agx-btns agx-card__actions">
                  <Btn path={`cards.${i}.cta`} variant="primary" note={i === 0} />
                  <Btn path={`cards.${i}.link`} variant="link" arrow note={false} />
                </div>
              </div>
              <ItemRemove group="cards" index={i} />
            </article>
          ))}
        </div>
        <ItemAdd group="cards" />
      </div>
    </section>
  );
}

/* M06 ---------------------------------------------------------------- */
function Steps() {
  const { data } = useMod();
  return (
    <section className="agx-sec agx-sec--tint" aria-label="How it works">
      <div className="agx-wrap">
        <div className="agx-head">
          <T path="h2" as="h2" className="agx-h2" />
        </div>
        <ol className="agx-steps">
          {list(data, "steps").map((_, i) => (
            <li className="agx-step agx-item" key={i}>
              <span className="agx-step__n">{i + 1}</span>
              <T path={`steps.${i}.title`} as="h3" className="agx-h3" note={i === 0} />
              <T path={`steps.${i}.body`} as="p" note={i === 0} />
              <ItemRemove group="steps" index={i} />
            </li>
          ))}
        </ol>
        <ItemAdd group="steps" />
      </div>
    </section>
  );
}

/* M07 ---------------------------------------------------------------- */
function Proof() {
  const { data, variant } = useMod();
  return (
    <section className="agx-sec agx-sec--navy" aria-label="Customer proof">
      <div className="agx-wrap agx-proof">
        <div className="agx-proof__photo">
          <Img path="image" className="agx-ratio-1x1 agx-circle" />
        </div>
        <div className="agx-proof__body">
          <blockquote className="agx-quote">
            <p>
              <span aria-hidden="true">“</span>
              <T path="quote" note={true} />
              <span aria-hidden="true">”</span>
            </p>
            <footer>
              <T path="name" as="strong" className="agx-quote__name" />
              <T path="role" as="span" className="agx-quote__role" />
            </footer>
          </blockquote>
          {variant === "stats" ? (
            <div className="agx-stats">
              {list(data, "stats").map((_, i) => (
                <div className={`agx-stat ${i === 1 ? "agx-stat--after" : ""}`} key={i}>
                  <T path={`stats.${i}.value`} as="p" className="agx-stat__value" note={i === 0} />
                  <T path={`stats.${i}.label`} as="p" className="agx-stat__label" note={i === 0} />
                </div>
              ))}
            </div>
          ) : null}
          <div className="agx-btns">
            <Btn path="link" variant="link-light" arrow />
          </div>
        </div>
      </div>
    </section>
  );
}

/* M08 ---------------------------------------------------------------- */
function Compare() {
  const { data } = useMod();
  const columns = list(data, "columns");
  return (
    <section className="agx-sec" aria-label="Comparison">
      <div className="agx-wrap">
        <div className="agx-head">
          <T path="h2" as="h2" className="agx-h2" />
          <Note>Live HTML table · 4 rows × 5 columns max · cells 8 words max</Note>
        </div>
        <div className="agx-tablebox">
          <table className="agx-table">
            <thead>
              <tr>
                {columns.map((_, c) => (
                  <th scope="col" key={c}>
                    <T path={`columns.${c}`} note={false} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list(data, "rows").map((row, r) => (
                <tr key={r} className="agx-item">
                  {(row.cells as string[]).map((_, c) =>
                    c === 0 ? (
                      <th scope="row" key={c}>
                        <T path={`rows.${r}.cells.${c}`} note={false} />
                        <ItemRemove group="rows" index={r} />
                      </th>
                    ) : (
                      <td key={c}>
                        <T path={`rows.${r}.cells.${c}`} note={false} />
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ItemAdd group="rows" />
      </div>
    </section>
  );
}

/* M09 ---------------------------------------------------------------- */
function Resources() {
  const { data } = useMod();
  return (
    <section className="agx-sec agx-sec--tint" aria-label="Resources">
      <div className="agx-wrap">
        <div className="agx-head agx-head--row">
          <T path="h2" as="h2" className="agx-h2" />
          <Btn path="link" variant="link" arrow />
        </div>
        <div className="agx-docs">
          {list(data, "cards").map((_, i) => (
            <div className="agx-doc agx-item" key={i}>
              <Img path={`cards.${i}.image`} className="agx-ratio-5x7" />
              <div className="agx-doc__body">
                <T path={`cards.${i}.tag`} as="span" className="agx-tag" note={i === 0} />
                <T path={`cards.${i}.title`} as="h3" className="agx-doc__title" note={i === 0} />
                <T path={`cards.${i}.meta`} as="p" className="agx-meta" note={i === 0} />
                <DocLink index={i} />
              </div>
              <ItemRemove group="cards" index={i} />
            </div>
          ))}
        </div>
        <ItemAdd group="cards" />
      </div>
    </section>
  );
}

function DocLink({ index }: { index: number }) {
  const { data, editing } = useMod();
  const href = String(getAt(data, `cards.${index}.href`) ?? "");
  if (!editing) return <a className="agx-link" href={href || "#"}>Download PDF</a>;
  return <DocLinkEdit index={index} href={href} />;
}

function DocLinkEdit({ index, href }: { index: number; href: string }) {
  const { uid } = useMod();
  const update = useBuilder((s) => s.updateField);
  return (
    <label className="agx-doclink" onClick={(e) => e.stopPropagation()}>
      <span className="agx-link">Download PDF</span>
      <input
        type="text"
        value={href}
        placeholder="Paste the PDF link"
        aria-label="PDF link"
        data-missing={!href ? "true" : undefined}
        onChange={(e) => update(uid, `cards.${index}.href`, e.target.value.trim())}
      />
    </label>
  );
}

/* M10 ---------------------------------------------------------------- */
function Faq() {
  const { data, editing } = useMod();
  return (
    <section className="agx-sec" aria-label="Questions">
      <div className="agx-wrap agx-faq">
        <div className="agx-faq__side">
          <T path="h2" as="h2" className="agx-h2" />
          <p className="agx-small">
            <T path="help" /> <Btn path="helpLink" variant="link" note={false} />
          </p>
        </div>
        <div className="agx-faq__list">
          {list(data, "items").map((_, i) =>
            editing ? (
              <div className="agx-faq__item agx-item" key={i}>
                <T path={`items.${i}.q`} as="p" className="agx-faq__q" note={i === 0} />
                <T path={`items.${i}.a`} as="p" note={i === 0} />
                <ItemRemove group="items" index={i} />
              </div>
            ) : (
              <details className="agx-faq__item" key={i} open={i === 0}>
                <summary className="agx-faq__q">{data.items[i].q}</summary>
                <p>{data.items[i].a}</p>
              </details>
            ),
          )}
          <ItemAdd group="items" />
        </div>
      </div>
    </section>
  );
}

/* M11 ---------------------------------------------------------------- */
function CtaBand() {
  const { variant, data, editing } = useMod();
  const phone = String(data.phone ?? "");
  return (
    <section className="agx-ctaband" aria-label="Next step">
      <svg className="agx-wave" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 0 H1440 V22 C1180 62 980 4 720 24 C460 44 260 60 0 30 Z" fill="currentColor" />
      </svg>
      <div className="agx-wrap agx-center agx-ctaband__inner">
        <T path="h2" as="h2" className="agx-h2 agx-h2--light" />
        <T path="line" as="p" className="agx-ctaband__line" />
        <div className="agx-btns agx-btns--center">
          <Btn path="cta" variant="cyan" />
          {variant === "phone" ? (
            editing ? (
              <span className="agx-phone">
                Call <T path="phone" note={false} />
              </span>
            ) : phone ? (
              <a className="agx-phone" href={`tel:+1${phone.replace(/\D/g, "")}`}>
                Call {phone}
              </a>
            ) : null
          ) : null}
        </div>
      </div>
    </section>
  );
}

export const RENDERERS: Record<ModuleType, () => React.ReactElement> = {
  hero: Hero,
  trust: Trust,
  intro: Intro,
  feature: Feature,
  products: Products,
  steps: Steps,
  proof: Proof,
  compare: Compare,
  resources: Resources,
  faq: Faq,
  cta: CtaBand,
};
