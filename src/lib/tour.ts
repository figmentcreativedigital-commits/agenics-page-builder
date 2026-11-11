import type { Viewport } from "./types";

/* ============================================================
   THE GUIDED TOUR SCRIPT

   Shown once, automatically, the first time someone opens the
   builder, and any time after from the Tour button at the foot of
   the left rail (or Help). Steps point at parts of
   the tool by selector (most carry a data-tour attribute so a
   restyle can't break them). A step whose target isn't on screen
   is skipped, so editing the tool never strands the tour.

   Plain language throughout: the reader may never have used a
   page builder.
   ============================================================ */

export type TourTab = "add" | "layers" | "pages" | "review" | "history";

export interface TourStep {
  id: string;
  /** Selector, or several in preference order; the first visible match wins.
      No target = a card in the middle of the screen. */
  target?: string | string[];
  title: string;
  body: string;
  /** Keyboard shortcuts worth knowing at this step, shown as keys. */
  keys?: string[];
  /** Only shown when the page has at least one block (skipped on an empty page). */
  needsBlock?: boolean;
  /** Set the tool up before pointing: open a side panel, select a block. */
  setup?: { tab?: TourTab; select?: "first" | "none"; viewport?: Viewport };
  /** Where the card sits. Default: below the target, else above it. */
  place?: "top" | "bottom" | "left" | "right" | "center";
}

export interface TourChapter {
  id: string;
  label: string;
  steps: TourStep[];
}

export const TOUR: TourChapter[] = [
  {
    id: "welcome",
    label: "Welcome",
    steps: [
      {
        id: "welcome",
        title: "Welcome to the Page Builder",
        body: "You build Agenics web pages here from approved blocks, so every page stays on brand. This tour shows you around in about two minutes. Use Next and Back or the arrow keys. Escape ends it, and the Tour button at the bottom left brings it back any time.",
        setup: { select: "none", viewport: "desktop" },
        place: "center",
      },
    ],
  },
  {
    id: "page",
    label: "Your page",
    steps: [
      {
        id: "canvas",
        target: '[data-tour="canvas"]',
        title: "This is your page",
        body: "It's drawn the way visitors will see it, with the real Agenics fonts, colors and layouts. Click any text on it and type to change it.",
        setup: { select: "none" },
        place: "center",
      },
      {
        id: "block",
        needsBlock: true,
        target: ".pb-frame.is-selected",
        title: "Pages are made of blocks",
        body: "A hero, a list of steps, a call to action: each one is a block. Click a block to select it. The cyan outline always shows what you're working on.",
        setup: { select: "first" },
        place: "right",
      },
      {
        id: "toolbar",
        needsBlock: true,
        target: ".pb-frame.is-selected > .pb-frame__bar",
        title: "The block toolbar",
        body: "Drag the handle to move the block, or use the arrows. Duplicate or delete it here too. The ⋯ menu copies the block, or saves it to My blocks so you can reuse it.",
        keys: ["⌘D", "⌘C", "⌘V", "Delete"],
        setup: { select: "first" },
      },
      {
        id: "settings",
        needsBlock: true,
        target: '[data-tour="settings"]',
        title: "Settings for the selected block",
        body: "Pick a layout and a background, switch optional pieces on or off, and fill in links. Every change shows on the page straight away.",
        setup: { select: "first" },
        place: "left",
      },
      {
        id: "insert",
        needsBlock: true,
        target: ['.pb-insert[data-index="1"] .pb-insert__btn', ".pb-insert .pb-insert__btn"],
        title: "Add a block anywhere",
        body: "Hover between two blocks and a + appears. Click it to pick a block for that spot.",
        setup: { select: "none" },
      },
    ],
  },
  {
    id: "panels",
    label: "Side panels",
    steps: [
      {
        id: "add",
        target: '[data-tour="panel"]',
        title: "Add",
        body: "Every block, grouped by what it's for. Drag one onto the page, or click it to add it below the block you've selected. The panel then closes to give the page room. Blocks you save appear at the top under My blocks. Click an icon on this rail again to close its panel.",
        setup: { tab: "add" },
        place: "right",
      },
      {
        id: "layers",
        target: '[data-tour="panel"]',
        title: "Layers",
        body: "A map of the whole page. Each block shows its real background color, so you can see how the page alternates. Drag to reorder. Tidy backgrounds alternates the colors in one click.",
        setup: { tab: "layers" },
        place: "right",
      },
      {
        id: "pages",
        target: '[data-tour="panel"]',
        title: "Pages",
        body: "Every page you've made in this browser. New page starts from a ready layout or a finished example. Pages save as you work.",
        setup: { tab: "pages" },
        place: "right",
      },
      {
        id: "history",
        target: '[data-tour="panel"]',
        title: "History",
        body: "Versions save on their own. Name one before a big change. You can view any version and restore it, and a restore can be undone.",
        setup: { tab: "history" },
        place: "right",
      },
    ],
  },
  {
    id: "check",
    label: "Check and share",
    steps: [
      {
        id: "devices",
        target: '[data-tour="devices"]',
        title: "Desktop, tablet and phone",
        body: "See the page at each screen size. Every view uses the real screen width, scaled to fit, so what you see is what visitors get.",
      },
      {
        id: "view",
        target: '[data-tour="view"]',
        title: "Zoom, guides and focus",
        body: "Zoom in to read closely or fit the page to your screen. Guides adds the size limit on every text and image slot. Focus mode hides the side panels so the page gets the whole screen.",
        keys: ["⌘+", "⌘−", "⌘0", "⌘\\"],
      },
      {
        id: "review",
        target: '[data-tour="review"]',
        title: "Review",
        body: "A short list of what's left: missing links, text over its limit, images without a description. Click an item to jump to it. When the button says Ready, the page is done.",
        setup: { tab: "review" },
      },
      {
        id: "preview",
        target: '[data-tour="preview"]',
        title: "Preview",
        body: "Hides the tools so you see only the page.",
        keys: ["P"],
      },
      {
        id: "share",
        target: '[data-tour="share"]',
        title: "Share a preview link",
        body: "Makes a link anyone can open on any device, without editing access. After changes, update it and the link stays the same.",
      },
      {
        id: "export",
        target: '[data-tour="export"]',
        title: "Export",
        body: "When the page is approved, Export makes the handoff package for the website build: the brief, the images and the page file.",
      },
      {
        id: "help",
        target: '[data-tour="help"]',
        title: "Help",
        body: "Keyboard shortcuts, the spec sheet and this tour, whenever you need them.",
        keys: ["?"],
      },
    ],
  },
  {
    id: "done",
    label: "Finish",
    steps: [
      {
        id: "done",
        target: '[data-tour="tour"]',
        title: "You're ready",
        body: "Open Pages and start a new page, or practice on one of the examples. Anything you do can be undone. To see this tour again, click Tour, here at the bottom of the rail.",
        keys: ["⌘Z"],
        setup: { tab: "pages", select: "none" },
        place: "right",
      },
    ],
  },
];

export type FlatStep = TourStep & { chapter: string; label: string };

export const TOUR_STEPS: FlatStep[] = TOUR.flatMap((c) => c.steps.map((s) => ({ ...s, chapter: c.id, label: c.label })));

const SEEN_KEY = "agenics-page-builder:tour";

export function tourSeen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === "seen";
  } catch {
    return true; // storage blocked: don't nag on every load
  }
}

export function markTourSeen() {
  try {
    localStorage.setItem(SEEN_KEY, "seen");
  } catch {
    /* ignore */
  }
}
