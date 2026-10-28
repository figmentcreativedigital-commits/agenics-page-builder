import type { Metadata } from "next";
import Link from "next/link";
import { IMAGE_KINDS, MODULES, MODULE_ORDER, limitLabel } from "@/lib/modules";
import { RECIPES } from "@/lib/recipes";
import "./specs.css";

export const metadata: Metadata = { title: "Spec sheet · Agenics Page Builder" };

const COLORS = [
  { name: "Agenics Cyan", hex: "#00BBF2", cmyk: "77 / 0 / 0 / 0", rgb: "0 / 187 / 242", use: "Accents, buttons on navy, type on navy. 2.2:1 on white — not for text on white." },
  { name: "Agenics Navy", hex: "#004278", cmyk: "97 / 57 / 0 / 43", rgb: "0 / 66 / 120", use: "Headlines, primary buttons, links, navy sections (10.2:1 with white)." },
  { name: "Agenics Silver", hex: "#B6B7BA", cmyk: "0 / 0 / 0 / 33", rgb: "182 / 183 / 186", use: "Logo rings, rules, borders, the “before” figure on navy." },
  { name: "AG Gray", hex: "#646B70", cmyk: "6 / 0 / 0 / 70", rgb: "101 / 108 / 113", use: "Most body text in short blocks; captions and meta (5.4:1)." },
  { name: "Charcoal", hex: "#4A4A4C", cmyk: "0 / 0 / 0 / 86", rgb: "74 / 75 / 76", use: "Long and small body text on screen (8.8:1); footer background." },
];

const TINTS = [
  { name: "Silver 18%", hex: "#F2F2F3", use: "Alternate section background, image tiles" },
  { name: "Cyan 12%", hex: "#E0F7FD", use: "Document type tags" },
];

export default function SpecsPage() {
  return (
    <div className="sp">
      <header className="sp-top">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/agenics-logo-color.svg" alt="Agenics Labs" className="sp-logo" />
        <Link href="/" className="sp-back">
          ← Back to the builder
        </Link>
      </header>
      <main className="sp-main">
        <p className="sp-eyebrow">Agenics page template · spec sheet</p>
        <h1>Content slot specifications</h1>
        <p className="sp-lead">
          Every module, slot, limit and file spec the page builder enforces, with the brand rules from the Agenics Corporate Graphic
          Standards Guide. Content that fits these numbers drops into the Squarespace build without layout changes.
        </p>

        <section>
          <h2>Page rules</h2>
          <ul className="sp-rules">
            <li>
              <b>One H1, in the hero.</b> Every other heading is H2 (module title) or H3 (item title).
            </li>
            <li>
              <b>Six to nine modules.</b> M01 opens and M11 closes every page; the recipe sets what goes between.
            </li>
            <li>
              <b>Buttons go somewhere specific:</b> a product page, a form or a file. Never a category page.
            </li>
            <li>
              <b>SEO fields before publish.</b> SEO title 60 characters max, brand once; meta description 140–160 characters.
            </li>
            <li>
              <b>Clean URL slugs:</b> lowercase words joined by hyphens, no auto-added suffixes such as -9bepc.
            </li>
            <li>
              <b>Alt text on every image.</b> One sentence on what the photo shows.
            </li>
          </ul>
        </section>

        <section>
          <h2>Brand: color</h2>
          <div className="sp-swatches">
            {COLORS.map((c) => (
              <div key={c.hex} className="sp-swatch">
                <span style={{ background: c.hex }} aria-hidden="true" />
                <div>
                  <b>{c.name}</b>
                  <code>{c.hex}</code>
                  <small>
                    RGB {c.rgb} · CMYK {c.cmyk}
                  </small>
                  <p>{c.use}</p>
                </div>
              </div>
            ))}
            {TINTS.map((c) => (
              <div key={c.hex} className="sp-swatch">
                <span style={{ background: c.hex, border: "1px solid #B6B7BA" }} aria-hidden="true" />
                <div>
                  <b>{c.name}</b>
                  <code>{c.hex}</code>
                  <p>{c.use}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2>Brand: type</h2>
          <div className="sp-type">
            <div>
              <p className="sp-raleway-xb">Raleway ExtraBold 0123456789</p>
              <p className="sp-raleway-l">Raleway Light 0123456789</p>
              <small>All headlines and key messaging. Lining figures (no descenders).</small>
            </div>
            <div>
              <p className="sp-kabel-b">Neue Kabel Bold</p>
              <p className="sp-kabel">Neue Kabel Light and Book for body text and supporting subheads.</p>
              <small>Loaded from the Agenics Adobe Fonts project. Trebuchet MS stands in where it cannot load, as the guide allows.</small>
            </div>
          </div>
        </section>

        <section>
          <h2>Brand: logo</h2>
          <div className="sp-logos">
            <figure>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/agenics-logo-color.svg" alt="Agenics Labs logo, full color" />
              <figcaption>Primary full color, on white or light backgrounds</figcaption>
            </figure>
            <figure className="sp-navy">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/agenics-logo-reversed.svg" alt="Agenics Labs logo, reversed" />
              <figcaption>Reversed, on brand colors or black</figcaption>
            </figure>
            <figure className="sp-navy">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/agenics-logo-reversed-cyan.svg" alt="Agenics Labs logo, reversed with cyan" />
              <figcaption>Alternate reversed, white and Agenics Cyan</figcaption>
            </figure>
          </div>
          <ul className="sp-rules">
            <li>Keep clear space around the logo equal to the height of the capital A.</li>
            <li>Never stretch, rotate, recolor, add gradients, shadows or effects, or place it on an image where it is not readable.</li>
          </ul>
        </section>

        <section>
          <h2>Five image ratios</h2>
          <table className="sp-table">
            <thead>
              <tr>
                <th scope="col">Use</th>
                <th scope="col">Ratio</th>
                <th scope="col">Export size</th>
                <th scope="col">File</th>
                <th scope="col">Guidance</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(IMAGE_KINDS).map(([key, k]) => (
                <tr key={key}>
                  <th scope="row">{k.label}</th>
                  <td>{k.ratio}</td>
                  <td>
                    {k.w.toLocaleString("en-US")} × {k.h.toLocaleString("en-US")} px
                  </td>
                  <td>{k.file}</td>
                  <td>{k.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="sp-note">
            Imagery style: medical minimalism, implied action (a gloved hand holding a vial rather than the sampling itself), plain or
            transparent backgrounds or strong focal depth, Halyard Blue Nitrile gloves in every new shoot.
          </p>
        </section>

        <section>
          <h2>Buttons</h2>
          <div className="sp-btns">
            <span className="sp-btn sp-btn--primary">Shop RapidCheck</span>
            <span className="sp-btn sp-btn--outline">Compare tests</span>
            <span className="sp-navybox">
              <span className="sp-btn sp-btn--cyan">Schedule a consultation</span>
            </span>
            <span className="sp-link">Download the IFU →</span>
          </div>
          <p className="sp-note">
            Verb + object, sentence case, 25 characters max, one primary per module. Retire: shop · SHOP · Shop Now · purchase · PARTNER
            NOW · YES, PLEASE! · click to read the full story.
          </p>
        </section>

        <section>
          <h2>Modules and slots</h2>
          {MODULE_ORDER.map((t) => {
            const m = MODULES[t];
            return (
              <article key={t} className="sp-mod">
                <h3>
                  <span className="sp-code">{m.code}</span> {m.name} <span className="sp-status">{m.status}</span>
                </h3>
                <p>{m.summary}</p>
                <p>
                  <b>Squarespace:</b> {m.squarespace}
                </p>
                <p>
                  <b>Replaces:</b> {m.replaces}
                </p>
                {m.variants.length ? (
                  <p>
                    <b>Layouts:</b> {m.variants.map((v) => v.label).join(" · ")}
                  </p>
                ) : null}
                {m.groups.length ? (
                  <p>
                    <b>Content blocks:</b>{" "}
                    {m.groups
                      .map((g) => `${g.min}–${g.max} ${g.label}s (${g.recMin === g.recMax ? g.recMin : `${g.recMin}–${g.recMax}`} recommended)`)
                      .join(" · ")}
                  </p>
                ) : null}
                <div className="sp-tablebox">
                  <table className="sp-table">
                    <thead>
                      <tr>
                        <th scope="col">Slot</th>
                        <th scope="col">Type</th>
                        <th scope="col">Limit / file</th>
                        <th scope="col">Guidance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(m.fields).map(([pattern, f]) => (
                        <tr key={pattern}>
                          <th scope="row">
                            {f.label}
                            {f.optional ? <small> (optional)</small> : null}
                          </th>
                          <td>{f.kind === "cta" ? "Button" : f.kind === "href" ? "Link" : f.kind === "image" ? "Image" : "Text"}</td>
                          <td>
                            {f.kind === "image" && f.image
                              ? `${IMAGE_KINDS[f.image].ratio} · ${IMAGE_KINDS[f.image].w}×${IMAGE_KINDS[f.image].h}`
                              : limitLabel(f.limit) || "—"}
                          </td>
                          <td>{f.guidance}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            );
          })}
        </section>

        <section>
          <h2>Page recipes</h2>
          <table className="sp-table">
            <thead>
              <tr>
                <th scope="col">Recipe</th>
                <th scope="col">Use for</th>
                <th scope="col">Modules, in order</th>
                <th scope="col">Replaces</th>
              </tr>
            </thead>
            <tbody>
              {RECIPES.map((r) => (
                <tr key={r.id}>
                  <th scope="row">{r.name}</th>
                  <td>{r.useFor}</td>
                  <td>{r.modules.map((x) => MODULES[x.split(":")[0] as keyof typeof MODULES].code).join(" · ")}</td>
                  <td>{r.replaces || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}
