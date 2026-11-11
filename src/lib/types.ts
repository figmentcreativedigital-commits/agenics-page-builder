export type ModuleType =
  | "hero"
  | "trust"
  | "intro"
  | "feature"
  | "products"
  | "steps"
  | "proof"
  | "compare"
  | "resources"
  | "faq"
  | "cta"
  | "explainer"
  | "grid"
  | "audience"
  | "statement"
  | "story";

export type CtaVal = { label: string; href: string };

export type ImageVal = {
  id: string | null;
  alt: string;
  /** A file served by the app (worked examples). Uploads use `id` instead. */
  src?: string;
  w?: number;
  h?: number;
  name?: string;
  type?: string;
  /** Has a transparent background (a cut-out). Measured on upload; library photos say so. */
  cutout?: boolean;
  /** The part of the photo to keep in view when the slot crops it, in % of width and height. */
  focus?: { x: number; y: number };
  /** 1 = fit the slot; up to 2 = zoomed in around the focal point. */
  zoom?: number;
};

// Module content is a plain JSON tree; each module's shape is defined by its defaults in lib/modules.ts.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ModuleData = Record<string, any>;

/** Brand-safe section backgrounds. Each module lists the ones it allows. */
export type Bg = "white" | "silver" | "cyan" | "navy";
export type Space = "compact" | "regular" | "roomy";

export interface ModuleStyle {
  bg?: Bg;
  space?: Space;
}

export interface ModuleInstance {
  uid: string;
  type: ModuleType;
  variant: string;
  data: ModuleData;
  /** Elements removed from this module (field patterns or group keys). Content is kept so they can be restored. */
  hidden?: string[];
  style?: ModuleStyle;
  /** Section id for in-page links, e.g. "what-is-st108" → #what-is-st108 */
  anchor?: string;
  /** Note for the team; shown on the canvas and listed in the brief. */
  note?: string;
  /** Text colors picked in the builder, by field path ("sub", "cards.2.body"). Unset = the background's default. */
  colors?: Record<string, TextColor>;
}

/** A brand color picked for a piece of body text. Headlines keep the color the brand sets. */
export type TextColor = "navy" | "gray" | "charcoal" | "white" | "cyan";

/** A shared preview link for a page. The secret lets this browser update or turn off the link. */
export interface ShareInfo {
  id: string;
  secret: string;
  url: string;
  publishedAt: number;
}

export interface PageDoc {
  id: string;
  name: string;
  slug: string;
  seoTitle: string;
  metaDescription: string;
  recipe: string;
  modules: ModuleInstance[];
  createdAt: number;
  updatedAt: number;
  share?: ShareInfo;
  /** Design tips someone chose to keep as is (ids from lib/advice). */
  keep?: string[];
}

export type Limit = { chars?: number; words?: number };

export type ImageKind = "hero" | "feature" | "landscape" | "product" | "headshot" | "doc";

export type Viewport = "desktop" | "tablet" | "phone";
