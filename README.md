# Agenics Page Builder

A page builder for agenics.com that anyone on the team can use without training. You stack brand-approved blocks, type straight onto the page, and export a build brief for Squarespace.

Built by Figment Creative for Agenics Labs. Follows the **Agenics Corporate Graphic Standards Guide**.

## How it works: three steps

1. **Add blocks.** Drag a block from the left onto the page, or click a **+** between blocks. Sixteen blocks, grouped as Open, Explain, Lists and grids, Products and proof, Support, Close.
2. **Edit in place.** Click any text to type. Drop an image on any image slot. Click an icon to swap it. The bar above the page shows the field you're editing and its limit while you type, so it never covers the text.
3. **Review and export.** **Review** in the top bar lists what's left, grouped by block, in plain sentences. **Export** makes the handoff package.

## Things you can do

- **Take the guided tour.** It opens by itself the first time someone uses the builder in a browser, and any time from the **Tour** button at the foot of the left rail (or **Help › Take the guided tour**). Clicking Tour while it runs starts it again from the top. Eighteen short steps spotlight the page, the side panels and the top bar, with Next / Back, the arrow keys, a chapter menu, and Escape to leave. The speaker on each card turns on **Read aloud** (off by default, remembered in this browser). The script is plain text in `src/lib/tour.ts`; a step whose target isn't on screen is skipped, so changing the tool never breaks it.

- **Format paragraphs.** Bold, italic and links inside any paragraph slot, from the bar above the page or with ⌘B, ⌘I and ⌘K. Links can point at a page, a file, a full address or a section of the same page. Headings and buttons stay plain, as the brand guide sets them.
- **Drag on the page.** Grab a block by the handle in its toolbar to move it. Grab any card, point, question, list item or paragraph by its handle to reorder it inside the block (or focus the handle and use the arrow keys).
- **Copy, paste and reuse.** ⌘C / ⌘V copies a block, also between pages. **⋯ › Save to My blocks** keeps a finished block at the top of the Add panel for reuse.
- **Right-click a block** (or select it and press ⇧F10) for its actions: move, duplicate, copy, paste below, save to My blocks, settings, delete. Arrow keys move through the menu, never between blocks.
- **Make room to work.** The **View** menu in the top bar (it shows the zoom, such as 54%) zooms the page: Fit to screen, 50%, 75% or 100%, or ⌘+ ⌘− ⌘0, which work even while typing. The zoom you pick is kept. **Guides**, also in View, shows the size limit on every text and image slot. Click the open tab on the left rail to fold its panel away; the Add panel folds by itself after you add a block. The settings panel folds to a strip. **Focus mode** (⌘\\ or View › Focus mode) hides the rail and both panels so the page gets the whole screen. From 961 to 1,200 px wide, the left panel opens over the page instead of squeezing it, and goes away when you work on the page.
- **Photos.** Every image slot has a **Library** with Agenics photography and everything uploaded in this browser. **Focus and zoom** in the settings panel sets the part of the photo that stays in view when the slot crops it; the brief passes the focal point on to Squarespace.
- **Version history.** Versions save on their own when a page is opened and every few minutes while it changes, and whenever a preview link is created or updated. Save a named version any time, view any version, and restore it (restoring can be undone).

- **Hide anything optional.** Hover a button and click ×, or use the bar above the page while you type, or switch it off in **Show / hide**. Hidden elements keep their text, so they come back with one switch. The brief tells the developer to leave them out.
- **Pick a layout** from thumbnails (for example, an Icon grid can be 3 across, 4 across, 2 × 2, or a heading with a 2 × 2 grid beside it).
- **Pick a background** from the brand-safe set each block allows: White, Silver 18%, Cyan 12% or Navy. **Tidy backgrounds** alternates them in one click so sections stand apart. New pages from every template start with alternating backgrounds.
- **Design tips.** The builder points out three graphic choices that weaken a page, where they happen, with a picture of the problem and one-click fixes (or **Keep as is**). Tips show as amber chips on the page and under **Design tips** in Review, count toward what is left, hide in Preview, and each fix is one undo step.
  - *The same background, block after block* (White included): **Alternate the backgrounds** uses only the colors each block allows, Silver 18% first and Cyan 12% only if the page has no cyan block yet; **Tighten the gaps** sets compact spacing.
  - *A photo that loses a large share to its frame* (under 60% showing): the chip says how much shows; **Choose a 4:5 photo** opens the library, **Adjust the crop** opens Focus and zoom on that photo.
  - *A text color that doesn't belong on its background*, such as cyan text after a navy block turns white. The page shows the standard color until you choose.
- **Text colors.** While typing in body text, **Color** in the bar above the page offers the brand colors that belong on that background: Navy, AG Gray and Charcoal on White, Silver 18% and Cyan 12%; White and Cyan on Navy. Cyan is never offered or shown on a light background. Headlines and buttons keep the color the brand sets. The brief writes each pick in words with its value, such as `text color: Navy (#004278)`.
- **Cut-outs.** An upload with a transparent background is spotted and shown whole inside its frame instead of cropped. The brief says how every image meets its frame: `fill the 4:5 frame, cropped to fit (object-fit: cover)` or `whole image inside the frame, not cropped (object-fit: contain)`.
- **Link to a section on the same page.** The link popover lists the page's sections; picking one gives it a short anchor such as `#what-is-st108`.
- **Leave a note for the team** on any block. Notes show on the canvas while editing and are listed in the brief. They are never published.
- **Change the number of items** (points, cards, questions, paragraphs) within each block's limits.
- **Preview** at desktop, tablet and phone widths, or open the clean page in a new tab. Each view is laid out at a real screen width (desktop 1,280 px or wider, tablet 834, phone 390) and scaled to fit the window, so desktop always shows the desktop layout and the full agenics.com menu, and the views always read largest to smallest. The bar above the page shows the width; the View button shows the scale.
- **Share a preview link.** **Share** in the top bar makes a link such as `/share/5dBw9qSUx9` that anyone can open on any device. Viewers see the page as visitors would, with a desktop / tablet / phone switch, and can't edit it. The link shows the version you published: after changes, **Update the link** refreshes it at the same address, and **Stop sharing** turns it off. Only the browser that created a link can update or stop it.
- **Undo everything.** ⌘Z / ⌘⇧Z undo and redo every change: blocks, text, photos, links, image descriptions, notes and section links. A burst of typing in one field is one step, and a step that changed nothing in the end is skipped. While the cursor is in a text slot, ⌘Z undoes typing inside it. Press **?** for all shortcuts.

## How the color works in the tool

| Color | Job in the builder |
| --- | --- |
| Navy | The tool's own navigation: top bar and left rail. Never part of the page you're building. |
| Cyan | What you're working on: the selected block, the active tab, the chosen layout or background. |
| Amber | Needs attention: missing links, team notes, items to fix. |
| Section colors | The Layers panel shows each block's real background as a color band, so the page's rhythm is visible at a glance. |

## Worked examples

- **Example — Dental Water**: the Product line recipe rebuilt from /dental-water.
- **Example — ST108 (Affirm), rev 2**: every line of the 10.26 copy deck, built with the newer blocks (Explainer + list, Icon grid, Who it's for, Statement, Text + image), hidden elements, navy and cyan sections, in-page anchors and the client's photography. The kit-chooser block is an addition, with a note saying so. Rev 2 follows the client's feedback of Nov 10, 2026: tables for the three water categories, the routine monitoring standards and the testing frequencies (typed out as real tables), a qualification and steam testing callout, the sample report with turnaround and in range or out of range, and a route to a person from the FAQ.

Both can be added again at any time from **Pages › New page › Start from a finished example**. Browsers that used an earlier version receive the current ST108 example once, alongside their own pages (an earlier copy of it stays).
- **Tables.** The Table block holds up to ten rows and eight columns, with an optional intro, notes under the table and a button. It is a real HTML table, so search engines can read it, and it scrolls sideways on phones.

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
| `src/lib/advice.ts`, `src/components/builder/Advice.tsx` | Design tips: the three rules and their fixes, and the chips and cards that show them |
| `src/lib/ink.ts`, `src/lib/crop.ts` | Text colors allowed on each background; how a photo or cut-out meets its frame |
| `src/lib/exporters.ts` | Brief, zip and page-file export and import |
| `src/lib/upgrade.ts` | Saved-page upgrades: pages from older versions of the builder open in today's form |
| `qa/` | Quality checks: end-to-end, undo, old pages, export parity, view, design tips, speed, tour, accessibility and screenshot suites |
| `src/lib/tour.ts`, `src/components/builder/Tour.tsx` | The guided tour: its script, and the spotlight that runs it |
| `src/lib/narration.ts`, `src/lib/speech.ts`, `src/app/api/voice/` | Read aloud: what may be voiced, the player with its browser-voice fallback, and the server route that voices a card once and caches it |
| `public/examples/` | Photography used by the worked examples |

## Saving and sharing

Pages are stored in the browser (localStorage; uploaded images in IndexedDB). Nothing leaves the browser until you share a preview link: then a copy of that page and its images is stored in the project's Vercel Blob store. To move an editable page between people or computers, use **Export › Page file (.json)** and **Open a page file**.

Preview links need a Vercel Blob store connected to the project (one-time setup, below). Running locally without one, links are stored in `./.share-data` so the feature can be tried.

## Old pages keep working

Pages come back from many places: this browser, page files, share links, version history, My blocks and the block clipboard. Whenever the shape of page data changes, add an upgrade to `src/lib/upgrade.ts` so all of them open in today's form. An upgrade leaves a page alone when it doesn't apply, is safe to run twice, and never deletes content (it hides it instead, so **Show** brings it back). Before the data change ships, record pages from the current release with `qa/capture-fixtures.mjs`; the old-pages suite then checks they still open.

## Quality checks

The suites in `qa/` drive a production build in Chromium with Playwright and print PASS or FAIL for each check in plain words.

```bash
npm run build
npm run qa                 # every suite, against next start on port 3210
npm run qa -- undo typing  # some suites
```

| Suite | What it checks |
| --- | --- |
| `smoke` | The builder and both examples open with no errors; adding, typing, reordering, preview, every export, opening a page file, a share link, /specs and /preview |
| `undo` | A photo, a typed word, a link, an image description and a note each undo in one step and nothing else; redo; empty steps are skipped |
| `upgrade` | Browser storage, page files and a share link made by the last release open with nothing lost; pages from before October 2026 are upgraded on purpose |
| `export` | The brief, zip and page file match the recorded baseline (`qa/baseline`); record a new one with `QA_RECORD=1` when a change is intended |
| `view` | Zoom and Fit (menu and keys, also while typing, kept after a reload), folding panels, focus mode, the floating left panel at 1,024 px, the text bar above the page, the block menu (right-click and ⇧F10, keys stay inside it), hover outlines, one shared Review count, old view settings |
| `tips` | Every template and example starts with no design tips; the three tips, their cards, fixes, undo and Keep as is; text colors by background (never cyan on light); cut-outs; the brief and page file carry colors and image fit |
| `typing` | Typing p75 under 50 ms on a 19-section page, no layout shift while typing, adding a section in about 120 ms |
| `tour` | The tour opens once, every step has its target, the keys and the Tour button work; 18 steps or fewer; Read aloud turns on and is remembered; the narrator voices tour cards only |
| `axe` | No accessibility violations beyond the known list in `qa/baseline/axe.json`, on every panel, menu and dialog, the share preview and the spec sheet |
| `screens` | Screenshots at 1,280, 834 and 390 px in `qa/out/screens`, with nothing spilling out |

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
   - `GOOGLE_TTS_API_KEY` (optional, the tour narrator): a Google Cloud key with the Text-to-Speech API on; the key the Figment Page Builder uses works. The tour's **Read aloud** then uses Google's Chirp 3 HD voices (Charon by default), voiced on the server once per card and voice and cached across deploys. The whole tour is about 3,500 characters per voice. Only tour cards can be voiced, and the key never reaches the browser. Without the key, Read aloud uses the browser's own voice.
4. In Adobe Fonts, add the Vercel domain (and any custom domain) to the web project.
5. Every push to `main` deploys to production; every pull request gets its own preview URL.

The app sends `X-Robots-Tag: noindex` and a disallow-all `robots.txt`; it is an internal tool, not part of agenics.com.
