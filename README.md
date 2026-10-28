# Agenics Page Builder

A wireframe-style page builder for agenics.com. Pages are assembled from eleven approved modules, filled in place, checked against the content specs, and exported as a build brief for Squarespace.

Built by Figment Creative for Agenics Labs. Follows the **Agenics Corporate Graphic Standards Guide**.

## What it does

- **Add, remove, reorder and duplicate modules** — from the module library, the "Insert module" points between sections, the drag-to-reorder outline, or the toolbar on each module.
- **Add and remove content blocks inside a module** — product cards, steps, benefits, FAQ items, table rows, resource cards — within each module's min/max.
- **Switch layouts** where a module has them (hero photo vs split, image left vs right, quote with or without stats).
- **Edit copy in place.** Every slot shows its limit; the field status bar counts characters or words as you type and flags anything over.
- **Drop in images.** Each image slot is fixed to one of five ratios (16:9, 4:5, 1:1 product, 1:1 headshot, 5:7 document). Uploads are checked for size and ratio; alt text is required.
- **Set links** on every button from the link chip or the inspector.
- **Page checks** — one hero/H1, hero first and CTA band last, 6–9 modules, placeholder copy left, over-limit fields, missing links, images, alt text, SEO title, meta description and slug.
- **Five page recipes** (Home, Product line, Product or campaign landing, Program or company, Resource hub) plus the master template and a worked Dental Water example.
- **Preview** at desktop, tablet and phone widths, in the builder or in a new tab (`/preview`).
- **Export** a handoff package (.zip: brief, renamed images, page file), a content brief (.md), or a page file (.json) that can be imported in another browser.
- **Spec sheet** at `/specs`, generated from the same module definitions the builder uses.

## Brand implementation

| Element | Implementation |
| --- | --- |
| Colors | Cyan `#00BBF2`, Navy `#004278`, Silver `#B6B7BA`, AG Gray `#646B70`, Charcoal `#4A4A4C` (tokens in `src/app/globals.css`) |
| Headlines | Raleway ExtraBold / Light, self-hosted in `src/app/fonts` (SIL OFL), lining figures on |
| Body + subheads | Neue Kabel via Adobe Fonts (`NEXT_PUBLIC_ADOBE_FONTS_KIT_ID`); falls back to Trebuchet MS, the guide's digital alternative |
| Logo | Vector SVGs traced from the guide in `public/brand` — full color, reversed, reversed with cyan, and the mark |
| Contrast | Cyan is used for accents and on navy only (2.2:1 on white). Body text is Charcoal (8.8:1); secondary text AG Gray (5.4:1) |

## Where things live

| Path | What |
| --- | --- |
| `src/lib/modules.ts` | The eleven modules: slots, limits, image specs, layouts, item ranges, default copy. Change a limit here and the editor, checks, exports and spec sheet all follow. |
| `src/lib/recipes.ts` | Page recipes and the Dental Water example |
| `src/components/page/modules.tsx` | How each module renders |
| `src/components/page/page.css` | Page styles (brand) |
| `src/components/builder/*` | The builder UI |
| `src/lib/checks.ts` | Page checks |
| `src/lib/exporters.ts` | Brief, zip and page-file export/import |

## Saving

Pages are stored in the browser (localStorage; images in IndexedDB). Nothing is sent to a server. To move a page between people or computers, use **Export › Page file (.json)** and **Import page file**. Shared server-side storage (for example Vercel Blob or a database) can be added later if several people need to edit the same pages.

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build check
```

## Deploy with GitHub and Vercel

1. Push this folder to a GitHub repository (private is fine).
2. In Vercel: **Add New › Project › Import** the repository. Vercel detects Next.js; no settings to change.
3. Add environment variables (Settings › Environment Variables), then redeploy:
   - `NEXT_PUBLIC_ADOBE_FONTS_KIT_ID` — the Adobe Fonts web project ID with Neue Kabel
   - `BASIC_AUTH_USER` / `BASIC_AUTH_PASSWORD` — optional password for the whole app
4. In Adobe Fonts, add the Vercel domain (and any custom domain) to the web project.
5. From then on every push to `main` deploys to production, and every pull request gets its own preview URL.

The app sends `X-Robots-Tag: noindex` and a disallow-all `robots.txt`; it is an internal tool, not part of agenics.com.
