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
  | "cta";

export type CtaVal = { label: string; href: string };

export type ImageVal = {
  id: string | null;
  alt: string;
  w?: number;
  h?: number;
  name?: string;
  type?: string;
};

// Module content is a plain JSON tree; each module's shape is defined by its defaults in lib/modules.ts.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ModuleData = Record<string, any>;

export interface ModuleInstance {
  uid: string;
  type: ModuleType;
  variant: string;
  data: ModuleData;
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

export type ImageKind = "hero" | "feature" | "product" | "headshot" | "doc";

export type Viewport = "desktop" | "tablet" | "phone";
