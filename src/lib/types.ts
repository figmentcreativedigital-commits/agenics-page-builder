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
}

export type Limit = { chars?: number; words?: number };

export type ImageKind = "hero" | "feature" | "landscape" | "product" | "headshot" | "doc";

export type Viewport = "desktop" | "tablet" | "phone";
