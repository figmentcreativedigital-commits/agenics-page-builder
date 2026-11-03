# Agenics Page Builder

A page builder for agenics.com that anyone on the team can use without training. You stack brand-approved blocks, type straight onto the page, and export a build brief for Squarespace.

Built by Figment Creative for Agenics Labs. Follows the **Agenics Corporate Graphic Standards Guide**.

## How it works: three steps

1. **Add blocks.** Drag a block from the left onto the page, or click a **+** between blocks. Sixteen blocks, grouped as Open, Explain, Lists and grids, Products and proof, Support, Close.
2. **Edit in place.** Click any text to type. Drop an image on any image slot. Click an icon to swap it. A small bar above the text you're editing shows its limit while you type.
3. **Review and export.** **Review** in the top bar lists what's left, grouped by block, in plain sentences. **Export** makes the handoff package.

## Things you can do

- **Format paragraphs.** Bold, italic and links inside any paragraph slot, from the bar above the text or with ⌘B, ⌘I and ⌘K. Links can point at a page, a file, a full address or a section of the same page. Headings and buttons stay plain, as the brand guide sets them.
- **Drag on the page.** Grab a block by the handle in its toolbar to move it. Grab any card, point, question, list item or paragraph by its handle to reorder it inside the block (or focus the handle and use the arrow keys).
- **Copy, paste and reuse.** ⌘C / ⌘V copies a block, also between pages. **⋯ › Save to My blocks** keeps a finished block at the top of the Add panel for reuse.
- **Photos.** Every image slot has a **Library** with Agenics photography and everything uploaded in this browser. **Focus and zoom** in the settings panel sets the part of the photo that stays in view when the slot crops it; the brief passes the focal point on to Squarespace.
- **Version history.** Versions save on their own when a page is opened and every few minutes while it changes, and whenever a preview link is created or updated. Save a named version any time, view any version, and restore it (restoring can be undone).

- **Hide anything optional.** Hover a button and click ×, or use the bar above a text slot, or switch it off in **Show / hide**. Hidden elements keep their text, so they come back with one switch. The brief tells the developer to leave them out.
- **Pick a layout** from thumbnails (for example, an Icon grid can be 3 across, 4 across, 2 × 2, or a heading with a 2 × 2 grid beside it).
- **Pick a background** from the brand-safe set each block allows: White, Silver 18%, Cyan 12% or Navy. **Tidy backgrounds** alternates them in one click so sections stand apart, and Review flags two same-colored sections in a row.
- **Link to a section on the same page.** The link popover lists the page's sections; picking one gives it a short anchor such as `#what-is-st108`.
- **Leave a note for the team** on any block. Notes show on the canvas while editing and are listed in the brief. They are never published.
- **Change the number of items** (points, cards, questions, paragraphs) within each block's limits.
- **Preview** at desktop, tablet and phone widths, or open the clean page in a new tab. Each view is laid out at a real screen width (desktop 1,280 px or wider, tablet 834, phone 390) and scaled to fit the window, so desktop always shows the desktop layout and the full agenics.com menu, and the views always read largest to smallest. The line above the page shows the width and the scale.
- **Share a preview link.** **Share** in the top bar makes a link such as `/share/5dBw9qSUx9` that anyone can open on any device. Viewers see the page as visitors would, with a desktop / tablet / phone switch, and can't edit it. The link shows the version you published: after changes, **Update the link** refreshes it at the same address, and **Stop sharing** turns it off. Only the browser that created a link can update or stop it.
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

## Saving and sharing

Pages are stored in the browser (localStorage; uploaded images in IndexedDB). Nothing leaves the browser until you share a preview link: then a copy of that page and its images is stored in the project's Vercel Blob store. To move an editable page between people or computers, use **Export › Page file (.json)** and **Open a page file**.

Preview links need a Vercel Blob store connected to the project (one-time setup, below). Running locally without one, links are stored in `./.share-data` so the feature can be tried.

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build check
```

## Deploy with GitHub and Vercel

1. In Vercel: **Add New › Project › Import** this repository. Vercel detects Next.js; no settings to change.
2. For preview links: **Storage › Create › Blob**, connect it to this project (Vercel adds the access token), then redeploy. If you choose a private store, also add `BLOB_ACCESS=private`.
3. Add environment variables (Settings › Environment Variables), then redeploy:
   - `NEXT_PUBLIC_ADOBE_FONTS_KIT_ID`: the Adobe Fonts web project ID with Neue Kabel
4. In Adobe Fonts, add the Vercel domain (and any custom domain) to the web project.
5. Every push to `main` deploys to production; every pull request gets its own preview URL.

The app sends `X-Robots-Tag: noindex` and a disallow-all `robots.txt`; it is an internal tool, not part of agenics.com.
