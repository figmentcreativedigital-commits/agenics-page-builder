"use client";

import { Fragment } from "react";
import { getAt } from "@/lib/path";
import { useBuilder } from "@/lib/store";
import type { ModuleType } from "@/lib/types";
import { Btn, IconSlot, Img, ItemAdd, ItemRemove, Note, Paras, Section, T, useMod, useShown } from "./edit";

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
  const body = (
    <div className="agx-hero__body">
      <T path="eyebrow" as="p" className="agx-eyebrow agx-eyebrow--cyan" />
      <T path="h1" as="h1" className="agx-h1" />
      <T path="sub" as="p" className="agx-hero__sub" />
      <T path="body" as="p" className="agx-hero__more" />
      <div className="agx-btns">
        <Btn path="cta1" variant="cyan" />
        <Btn path="cta2" variant="outline-light" />
      </div>
    </div>
  );
  if (variant === "split") {
    return (
      <Section base="agx-hero agx-hero--split" label="Hero">
        <div className="agx-hero__split">
          {body}
          <Img path="image" className="agx-hero__splitimg" />
        </div>
      </Section>
    );
  }
  return (
    <Section base="agx-hero" label="Hero">
      <Img path="image" className="agx-hero__media" position="72% 50%" controls="chip" />
      <div className="agx-hero__shade" aria-hidden="true" />
      <div className="agx-wrap agx-hero__inner">{body}</div>
    </Section>
  );
}

/* M02 ---------------------------------------------------------------- */
function Trust() {
  const { data } = useMod();
  return (
    <Section base="agx-trust" label="Proof points">
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
    </Section>
  );
}

/* M03 ---------------------------------------------------------------- */
function Intro() {
  const { data, variant } = useMod();
  return (
    <Section label="Introduction">
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
    </Section>
  );
}

/* M04 ---------------------------------------------------------------- */
function Feature() {
  const { data, variant } = useMod();
  const benefits = useShown("benefits");
  return (
    <Section label="Feature">
      <div className={`agx-wrap agx-feature ${variant === "image-right" ? "agx-feature--right" : ""}`}>
        <div className="agx-feature__media">
          <Img path="image" className="agx-ratio-4x5 agx-rounded" />
        </div>
        <div className="agx-feature__body">
          <T path="eyebrow" as="p" className="agx-eyebrow" />
          <T path="h2" as="h2" className="agx-h2" />
          {benefits ? (
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
          ) : null}
          <div className="agx-btns">
            <Btn path="cta" variant="outline" />
          </div>
        </div>
      </div>
    </Section>
  );
}

/* M05 ---------------------------------------------------------------- */
function Products() {
  const { data } = useMod();
  const bullets = useShown("cards.0.bullets.0");
  const cards = list(data, "cards");
  return (
    <Section label="Products">
      <div className="agx-wrap">
        <div className="agx-head agx-center">
          <T path="h2" as="h2" className="agx-h2" />
          <T path="intro" as="p" className="agx-lead" />
        </div>
        <div className={`agx-cards agx-cards--${cards.length}`}>
          {cards.map((card, i) => (
            <article className="agx-card agx-item" key={i}>
              <div className="agx-card__tile">
                <Img path={`cards.${i}.image`} className="agx-ratio-1x1" fit="contain" />
              </div>
              <div className="agx-card__body">
                <T path={`cards.${i}.type`} as="p" className="agx-kicker" note={i === 0} />
                <T path={`cards.${i}.name`} as="h3" className="agx-h3 agx-card__name" note={i === 0} />
                <T path={`cards.${i}.tagline`} as="p" note={i === 0} />
                {bullets ? (
                  <ul className="agx-bullets">
                    {(card.bullets as string[]).map((_, b) => (
                      <Fragment key={b}>
                        <li>
                          <T path={`cards.${i}.bullets.${b}`} note={i === 0 && b === 0} />
                        </li>
                      </Fragment>
                    ))}
                  </ul>
                ) : null}
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
    </Section>
  );
}

/* M06 ---------------------------------------------------------------- */
function Steps() {
  const { data } = useMod();
  return (
    <Section label="How it works">
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
    </Section>
  );
}

/* M07 ---------------------------------------------------------------- */
function Proof() {
  const { data, variant } = useMod();
  const photo = useShown("image");
  return (
    <Section className="agx-sec--navy" label="Customer proof">
      <div className={`agx-wrap agx-proof ${photo ? "" : "agx-proof--solo"}`}>
        {photo ? (
          <div className="agx-proof__photo">
            <Img path="image" className="agx-ratio-1x1 agx-circle" />
          </div>
        ) : null}
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
    </Section>
  );
}

/* M08 ---------------------------------------------------------------- */
function Compare() {
  const { data } = useMod();
  const columns = list(data, "columns");
  return (
    <Section label="Comparison">
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
    </Section>
  );
}

/* M09 ---------------------------------------------------------------- */
function Resources() {
  const { data } = useMod();
  return (
    <Section label="Resources">
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
    </Section>
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
  const support = useShown("help");
  return (
    <Section label="Questions">
      <div className="agx-wrap agx-faq">
        <div className="agx-faq__side">
          <T path="h2" as="h2" className="agx-h2" />
          {support ? (
            <p className="agx-small">
              <T path="help" /> <Btn path="helpLink" variant="link" note={false} />
            </p>
          ) : null}
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
    </Section>
  );
}

/* M11 ---------------------------------------------------------------- */
function CtaBand() {
  const { variant, data, editing } = useMod();
  const phone = String(data.phone ?? "");
  return (
    <Section base="agx-ctaband" label="Next step">
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
        <T path="assure" as="p" className="agx-ctaband__assure" />
      </div>
    </Section>
  );
}

/* M12 ---------------------------------------------------------------- */
function Explainer() {
  const { data, variant } = useMod();
  const items = list(data, "items");
  const Tag = variant === "numbered" ? "ol" : "ul";
  return (
    <Section label="Explainer">
      <div className={`agx-wrap agx-explainer ${variant === "stacked" ? "agx-explainer--stacked" : ""}`}>
        <div className="agx-explainer__text">
          <T path="eyebrow" as="p" className="agx-eyebrow" />
          <T path="h2" as="h2" className="agx-h2" />
          <Paras className="agx-prose" />
          <div className="agx-btns">
            <Btn path="cta" variant="outline" />
          </div>
        </div>
        <div className="agx-listcard">
          <T path="listTitle" as="h3" className="agx-listcard__title" />
          <Tag className={`agx-checklist ${variant === "numbered" ? "agx-checklist--num" : ""}`}>
            {items.map((_, i) => (
              <li className="agx-item" key={i}>
                <span className="agx-checklist__mark" aria-hidden="true">
                  {variant === "numbered" ? (
                    i + 1
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m5 12.5 4.5 4.5L19 7.5" />
                    </svg>
                  )}
                </span>
                <T path={`items.${i}`} note={i === 0} />
                <ItemRemove group="items" index={i} />
              </li>
            ))}
          </Tag>
          <ItemAdd group="items" />
        </div>
      </div>
    </Section>
  );
}

/* M13 ---------------------------------------------------------------- */
function Grid() {
  const { data, variant } = useMod();
  const items = list(data, "items");
  const head = (
    <div className={`agx-grid__head ${variant === "split" ? "" : "agx-center"}`}>
      <T path="eyebrow" as="p" className="agx-eyebrow" />
      <T path="h2" as="h2" className="agx-h2" />
      <T path="intro" as="p" className="agx-lead" />
    </div>
  );
  const cells = (
    <div className={`agx-grid__items agx-grid__items--${variant}`}>
      {items.map((_, i) => (
        <div className="agx-gridcard agx-item" key={i}>
          <IconSlot path={`items.${i}.icon`} />
          <T path={`items.${i}.title`} as="h3" className="agx-h3" note={i === 0} />
          <T path={`items.${i}.body`} as="p" note={i === 0} />
          <ItemRemove group="items" index={i} />
        </div>
      ))}
    </div>
  );
  const button = (
    <div className={`agx-btns ${variant === "split" ? "" : "agx-btns--center"}`}>
      <Btn path="cta" variant="primary" />
    </div>
  );
  return (
    <Section label="Key points">
      <div className={`agx-wrap agx-grid agx-grid--${variant}`}>
        {variant === "split" ? (
          <>
            <div className="agx-grid__side">
              {head}
              {button}
            </div>
            <div>
              {cells}
              <ItemAdd group="items" />
            </div>
          </>
        ) : (
          <>
            {head}
            {cells}
            <ItemAdd group="items" />
            {button}
          </>
        )}
      </div>
    </Section>
  );
}

/* M14 ---------------------------------------------------------------- */
function Audience() {
  const { data, variant } = useMod();
  const items = list(data, "items");
  return (
    <Section label="Who it is for">
      <div className={`agx-wrap agx-aud agx-aud--${variant}`}>
        <div className="agx-aud__intro">
          {variant === "image" ? <Img path="image" className="agx-ratio-3x2 agx-rounded agx-aud__img" /> : null}
          <T path="eyebrow" as="p" className="agx-eyebrow" />
          <T path="h2" as="h2" className="agx-h2" />
          <T path="sub" as="p" className="agx-subhead" />
          <T path="body" as="p" />
          <div className="agx-btns">
            <Btn path="cta" variant="outline" />
          </div>
        </div>
        <div className="agx-aud__list">
          {items.map((_, i) => (
            <div className="agx-aud__item agx-item" key={i}>
              <IconSlot path={`items.${i}.icon`} />
              <div className="agx-col">
                <T path={`items.${i}.title`} as="h3" className="agx-h3" note={i === 0} />
                <T path={`items.${i}.body`} as="p" className="agx-aud__examples" note={i === 0} />
              </div>
              <ItemRemove group="items" index={i} />
            </div>
          ))}
          <ItemAdd group="items" />
        </div>
      </div>
    </Section>
  );
}

/* M15 ---------------------------------------------------------------- */
function Statement() {
  const { variant } = useMod();
  return (
    <Section label="Statement">
      <div className={`agx-wrap agx-stmt agx-stmt--${variant}`}>
        <div className="agx-stmt__head">
          <T path="eyebrow" as="p" className="agx-eyebrow" />
          <T path="h2" as="h2" className="agx-h2" />
        </div>
        <div className="agx-stmt__body">
          <Paras className="agx-prose" />
          <T path="statement" as="p" className="agx-stmt__line" />
          <div className={`agx-btns ${variant === "center" ? "agx-btns--center" : ""}`}>
            <Btn path="cta" variant="primary" />
          </div>
        </div>
      </div>
    </Section>
  );
}

/* M16 ---------------------------------------------------------------- */
function Story() {
  const { variant } = useMod();
  const image = useShown("image");
  return (
    <Section label="Story">
      <div className={`agx-wrap agx-story ${variant === "image-left" ? "agx-story--left" : ""} ${image ? "" : "agx-story--solo"}`}>
        <div className="agx-story__body">
          <T path="eyebrow" as="p" className="agx-eyebrow" />
          <T path="h2" as="h2" className="agx-h2" />
          <Paras className="agx-prose" />
          <div className="agx-btns">
            <Btn path="cta" variant="outline" />
          </div>
        </div>
        {image ? (
          <div className="agx-story__media">
            <Img path="image" className="agx-ratio-3x2 agx-rounded" />
          </div>
        ) : null}
      </div>
    </Section>
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
  explainer: Explainer,
  grid: Grid,
  audience: Audience,
  statement: Statement,
  story: Story,
};
