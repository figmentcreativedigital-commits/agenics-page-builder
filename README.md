# Agenics Page Builder

A page builder for agenics.com that anyone on the team can use without training. You stack brand-approved blocks, type straight onto the page, and export a build brief for Squarespace.

Built by Figment Creative for Agenics Labs. Follows the **Agenics Corporate Graphic Standards Guide**.

## How it works: three steps

1. **Add blocks.** Drag a block from the left onto the page, or click a **+** between blocks. Sixteen blocks, grouped as Open, Explain, Lists and grids, Products and proof, Support, Close.
2. **Edit in place.** Click any text to type. Drop an image on any image slot. Click an icon to swap it. A small bar above the text you're editing shows its limit while you type.
3. **Review and export.** **Review** in the top bar lists what's left, grouped by block, in plain sentences. **Export** makes the handoff package.

## Things you can do

- **Hide anything optional.** Hover a button and click ×, or use the bar above a text slot, or switch it off in **Show / hide**. Hidden elements keep their text, so they come back with one switch. The brief tells the developer to leave them out.
- **Pick a layout** from thumbnails (for example, an Icon grid can be 3 across, 4 across, 2 × 2, or a heading with a 2 × 2 grid beside it).
- **Pick a background** from the brand-safe set each block allows: White, Silver 18%, Cyan 12% or Navy. **Tidy backgrounds** alternates them in one click so sections stand apart, and Review flags two same-colored sections in a row.
- **Link to a section on the same page.** The link popover lists the page's sections; picking one gives it a short anchor such as `#what-is-st108`.
- **Leave a note for the team** on any block. Notes show on the canvas while editing and are listed in the brief. They are never published.
- **Change the number of items** (points, cards, questions, paragraphs) within each block's limits.
- **Preview** at desktop, tablet and phone widths, or open the clean page in a new tab.
- **Undo everything.** ⌘Z / ⌘⇧Z. Press **?** for all shortcuts.

## How the color works in the tool

| Color | Job in the builder |
| --- | --- |
| Navy | The tool's own navigation: top bar and left rail. Never part of the page you're building. |
| Cyan | What you're working on: the selected block, the active tab, the chosen layout or background. |
| Amber | Needs attention: missing links, team notes, items to fix. |
| Section colors | The Layers panel shows each block's real background as a color band, so the page's rhythm is visible at a glance. |

## Worked examples

- **Example — Dental Water**: the Product line recipe rebuilt from /dental-water.
- **Example — ST108 (Affirm)**: every line of the 10.26 copy deck, built with the newer blocks (Explainer + list, Icon grid, Who it's for, Statement, Text + image), hidden elements, navy and cyan sections, in-page anchors and the client's photography. The kit-chooser block is an addition, with a note saying so.

Both can be added again at any time from **Pages › New page › Start from a finished example**. Browsers that used an earlier version receive the ST108 example once, alongside their own pages.

## Brand implementation

| Element | Implementation |
| --- | --- |
| Colors | Cyan `#00BBF2`, Navy `#004278`, Silver `#B6B7BA`, AG Gray `#646B70`, Charcoal `#4A4A4C`; tints Silver 18% `#F2F2F3`, Cyan 12% `#E0F7FD` (tokens in `src/app/globals.css`) |
| Headlines | Raleway ExtraBold / Light, self-hosted in `src/app/fonts` (SIL OFL), lining figures throughout |
| Body + subheads | Neue Kabel via Adobe Fonts (`NEXT_PUBLIC_ADOBE_FONTS_KIT_ID`); falls back to Trebuchet MS, the guide's digital alternative |
| Logo | Vector SVGs traced from the guide in `public/brand` |
| Icons | A 25-icon line set drawn for this template (`src/components/page/icons.tsx`), shown in a navy disc ringed in silver; SVGs download from `/specs` |
| Contrast | Cyan is never text on white (2.2:1). On navy: white 10.2:1, cyan 4.6:1. On Cyan 12%: navy 9.2:1, AG Gray 4.9:1 |

## Where things live

| Path | What |
| --- | --- |
| `src/lib/modules.ts` | The sixteen blocks: slots, limits, image specs, layouts, item ranges, hideable elements, allowed backgrounds, default copy. Change it here and the editor, checks, exports and spec sheet follow. |
| `src/lib/recipes.ts` | Starting layouts and the two worked examples |
| `src/components/page/` | How blocks render (`modules.tsx`), in-place editing (`edit.tsx`), icons, page styles |
| `src/components/builder/` | The builder: top bar, rail and panels, canvas, settings panel, block thumbnails |
| `src/lib/checks.ts` | Review checks |
| `src/lib/exporters.ts` | Brief, zip and page-file export and import |
| `public/examples/` | Photography used by the worked examples |

## Saving

Pages are stored in the browser (localStorage; uploaded images in IndexedDB). Nothing is sent to a server. To move a page between people or computers, use **Export › Page file (.json)** and **Open a page file**. Shared server-side storage can be added later if several people need to edit the same pages.

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build check
```

## Deploy with GitHub and Vercel

1. In Vercel: **Add New › Project › Import** this repository. Vercel detects Next.js; no settings to change.
2. Add environment variables (Settings › Environment Variables), then redeploy:
   - `NEXT_PUBLIC_ADOBE_FONTS_KIT_ID`: the Adobe Fonts web project ID with Neue Kabel
   - `BASIC_AUTH_USER` / `BASIC_AUTH_PASSWORD`: optional password for the whole app
3. In Adobe Fonts, add the Vercel domain (and any custom domain) to the web project.
4. Every push to `main` deploys to production; every pull request gets its own preview URL.

The app sends `X-Robots-Tag: noindex` and a disallow-all `robots.txt`; it is an internal tool, not part of agenics.com.
