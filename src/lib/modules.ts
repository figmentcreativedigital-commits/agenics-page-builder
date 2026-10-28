import type { ImageKind, Limit, ModuleData, ModuleType } from "./types";
import { expand, toPattern } from "./path";

/* ------------------------------------------------------------------ */
/* Image specs: every image slot uses one of these five               */
/* ------------------------------------------------------------------ */

export const IMAGE_KINDS: Record<
  ImageKind,
  { ratio: string; r: number; w: number; h: number; label: string; file: string; note: string }
> = {
  hero: {
    ratio: "16:9",
    r: 16 / 9,
    w: 2400,
    h: 1350,
    label: "Hero",
    file: "JPG under 500 KB",
    note: "Subject in the right third; left half quiet enough for type",
  },
  feature: {
    ratio: "4:5",
    r: 4 / 5,
    w: 1600,
    h: 2000,
    label: "Feature",
    file: "JPG",
    note: "Implied action, plenty of negative space",
  },
  product: {
    ratio: "1:1",
    r: 1,
    w: 1200,
    h: 1200,
    label: "Product",
    file: "Transparent PNG",
    note: "Product fills about 80% of the frame, same scale on every card",
  },
  headshot: {
    ratio: "1:1",
    r: 1,
    w: 800,
    h: 800,
    label: "Headshot",
    file: "JPG",
    note: "Head and shoulders, eyes on the upper third",
  },
  doc: {
    ratio: "5:7",
    r: 5 / 7,
    w: 1000,
    h: 1400,
    label: "Document cover",
    file: "PNG or JPG",
    note: "Page 1 of the PDF",
  },
};

/* ------------------------------------------------------------------ */
/* Field specs                                                         */
/* ------------------------------------------------------------------ */

export type FieldKind = "text" | "cta" | "href" | "image";

export interface FieldSpec {
  label: string;
  kind: FieldKind;
  limit?: Limit;
  image?: ImageKind;
  optional?: boolean;
  guidance: string;
}

export interface ItemGroup {
  key: string;
  label: string;
  min: number;
  max: number;
  recMin: number;
  recMax: number;
  make: () => ModuleData;
}

export interface ModuleMeta {
  type: ModuleType;
  code: string;
  name: string;
  status: "required" | "core" | "optional";
  summary: string;
  squarespace: string;
  replaces: string;
  variants: { id: string; label: string }[];
  groups: ItemGroup[];
  fields: Record<string, FieldSpec>;
  defaults: () => ModuleData;
}

const cta = (label: string) => ({ label, href: "" });
const img = () => ({ id: null, alt: "" });

/* ------------------------------------------------------------------ */
/* The eleven modules                                                  */
/* ------------------------------------------------------------------ */

const hero: ModuleMeta = {
  type: "hero",
  code: "M01",
  name: "Hero",
  status: "required",
  summary: "Opens every page: one H1, one promise, one action.",
  squarespace: "Section with a background image; set the focal point on the subject. Same layout on every page.",
  replaces: "Six hero treatments across the home page, /dental-water, /medical, /enterprise and the image-free page headers",
  variants: [
    { id: "photo", label: "Photo background" },
    { id: "split", label: "Split, image right" },
  ],
  groups: [],
  fields: {
    eyebrow: { label: "Eyebrow", kind: "text", limit: { chars: 30 }, guidance: "Audience or product line" },
    h1: { label: "H1", kind: "text", limit: { chars: 45 }, guidance: "The outcome, not the company name. The only H1 on the page." },
    sub: { label: "Subhead", kind: "text", limit: { chars: 120 }, guidance: "One sentence: who it is for and what they get" },
    cta1: { label: "Primary button", kind: "cta", limit: { chars: 25 }, guidance: "Verb + object. Links to a product page or form." },
    cta2: { label: "Secondary button", kind: "cta", limit: { chars: 25 }, optional: true, guidance: "Lower-commitment action" },
    image: { label: "Hero image", kind: "image", image: "hero", guidance: "Lab or practice photography" },
  },
  defaults: () => ({
    eyebrow: "[For dental practices]",
    h1: "[Outcome headline in 45 characters or fewer]",
    sub: "[Who this page is for and what they get from it, in one plain sentence.]",
    cta1: cta("[Shop dental tests]"),
    cta2: cta("[Talk to a water expert]"),
    image: img(),
  }),
};

const trust: ModuleMeta = {
  type: "trust",
  code: "M02",
  name: "Trust strip",
  status: "optional",
  summary: "Four facts Agenics can source, right under the hero.",
  squarespace: "One row of four text blocks; swap for a logo gallery on partner pages.",
  replaces: "Affiliate, distributor and accreditation logo walls on the home page",
  variants: [],
  groups: [
    {
      key: "items",
      label: "proof point",
      min: 2,
      max: 4,
      recMin: 4,
      recMax: 4,
      make: () => ({ title: "[Proof point]", detail: "[Supporting detail]" }),
    },
  ],
  fields: {
    "items.*.title": { label: "Proof point", kind: "text", limit: { chars: 28 }, guidance: "Certification, program, turnaround or distribution" },
    "items.*.detail": { label: "Detail", kind: "text", limit: { chars: 40 }, guidance: "Source or specifics" },
  },
  defaults: () => ({
    items: [
      { title: "[Proof point one]", detail: "[e.g. CDC ELITE Program participant]" },
      { title: "[Proof point two]", detail: "[e.g. CLIA-certified laboratory]" },
      { title: "[Proof point three]", detail: "[e.g. Results in as few as 24 hours]" },
      { title: "[Proof point four]", detail: "[e.g. Sold through major distributors]" },
    ],
  }),
};

const intro: ModuleMeta = {
  type: "intro",
  code: "M03",
  name: "Intro + paths",
  status: "optional",
  summary: "States the problem, then routes each audience to its page.",
  squarespace: "Centered text block plus 2–3 linked cards.",
  replaces: "\"Simplifying Your Water Quality Compliance\" with the Dental / Sterile icons; \"Explore Dental Water Tests\"",
  variants: [
    { id: "paths", label: "With path cards" },
    { id: "text", label: "Text only" },
  ],
  groups: [
    {
      key: "paths",
      label: "path card",
      min: 2,
      max: 3,
      recMin: 2,
      recMax: 3,
      make: () => ({ title: "[Path]", line: "[Who should click this card.]", link: cta("[Explore]") }),
    },
  ],
  fields: {
    h2: { label: "H2", kind: "text", limit: { chars: 60 }, guidance: "The problem this page solves" },
    body: { label: "Intro", kind: "text", limit: { words: 60 }, guidance: "Name the guideline or risk in plain words" },
    "paths.*.title": { label: "Path title", kind: "text", limit: { chars: 30 }, guidance: "Audience or option" },
    "paths.*.line": { label: "Path line", kind: "text", limit: { chars: 80 }, guidance: "Who should click" },
    "paths.*.link": { label: "Path link", kind: "cta", limit: { chars: 25 }, guidance: "Each card routes to a different page" },
  },
  defaults: () => ({
    h2: "[The problem this page solves, stated in one line]",
    body: "[Why it matters to a practice or department right now. Name the guideline or risk in plain words. Two or three sentences.]",
    paths: [
      { title: "[e.g. Dental unit water]", line: "[Who should click this card, in one line.]", link: cta("[Explore dental tests]") },
      { title: "[e.g. Sterile processing]", line: "[Who should click this card, in one line.]", link: cta("[Explore ST108 tests]") },
    ],
  }),
};

const feature: ModuleMeta = {
  type: "feature",
  code: "M04",
  name: "Split feature",
  status: "core",
  summary: "One image beside the main reason to choose Agenics.",
  squarespace: "Image block and text blocks side by side. Flip the image when the module repeats.",
  replaces: "\"Why Agenics?\" on the home page, the /medical intro, We Achieve / We Aim on /about-us",
  variants: [
    { id: "image-left", label: "Image left" },
    { id: "image-right", label: "Image right" },
  ],
  groups: [
    {
      key: "benefits",
      label: "benefit",
      min: 2,
      max: 4,
      recMin: 3,
      recMax: 3,
      make: () => ({ title: "[Benefit]", body: "[What the customer gets and why it matters.]" }),
    },
  ],
  fields: {
    eyebrow: { label: "Eyebrow", kind: "text", limit: { chars: 30 }, optional: true, guidance: "Optional label above the heading" },
    h2: { label: "H2", kind: "text", limit: { chars: 50 }, guidance: "The main reason to choose this" },
    "benefits.*.title": { label: "Benefit title", kind: "text", limit: { chars: 40 }, guidance: "One benefit per item" },
    "benefits.*.body": { label: "Benefit body", kind: "text", limit: { words: 30 }, guidance: "Proof for the benefit" },
    cta: { label: "Button", kind: "cta", limit: { chars: 25 }, optional: true, guidance: "Secondary style" },
    image: { label: "Feature image", kind: "image", image: "feature", guidance: "Implied action, negative space" },
  },
  defaults: () => ({
    eyebrow: "[Why Agenics]",
    h2: "[The main reason to choose this, in one line]",
    benefits: [
      { title: "[Benefit one]", body: "[What the customer gets and why it matters, in two sentences at most.]" },
      { title: "[Benefit two]", body: "[What the customer gets and why it matters, in two sentences at most.]" },
      { title: "[Benefit three]", body: "[What the customer gets and why it matters, in two sentences at most.]" },
    ],
    cta: cta("[About our lab]"),
    image: img(),
  }),
};

const productCard = () => ({
  type: "[Test type · e.g. Mail-in R2A]",
  name: "[Product name]",
  tagline: "[What it does best, 50 characters max]",
  bullets: ["[Benefit, 40 characters max]", "[Benefit, 40 characters max]", "[Benefit, 40 characters max]"],
  price: "From $[price]",
  cta: cta("[Shop product name]"),
  link: cta("[Sample report]"),
  image: img(),
});

const products: ModuleMeta = {
  type: "products",
  code: "M05",
  name: "Product cards",
  status: "optional",
  summary: "One to three products, each button going to its product page.",
  squarespace: "One card = image + text + button blocks. Keep bullet counts equal across cards.",
  replaces: "\"Our Most Trusted Products\" on the home page; six shop rows on /dental-water; the Affirm pair on /medical",
  variants: [],
  groups: [{ key: "cards", label: "product card", min: 1, max: 3, recMin: 1, recMax: 3, make: productCard }],
  fields: {
    h2: { label: "H2", kind: "text", limit: { chars: 50 }, guidance: "Help the reader choose" },
    intro: { label: "Intro", kind: "text", limit: { words: 40 }, guidance: "What separates the options" },
    "cards.*.type": { label: "Test type", kind: "text", limit: { chars: 30 }, guidance: "e.g. Mail-in R2A" },
    "cards.*.name": { label: "Product name", kind: "text", limit: { chars: 24 }, guidance: "With ™ where it applies" },
    "cards.*.tagline": { label: "Tagline", kind: "text", limit: { chars: 50 }, guidance: "What it does best" },
    "cards.*.bullets.*": { label: "Bullet", kind: "text", limit: { chars: 40 }, guidance: "Same number of bullets on every card" },
    "cards.*.price": { label: "Price", kind: "text", limit: { chars: 16 }, guidance: "Match the store price" },
    "cards.*.cta": { label: "Shop button", kind: "cta", limit: { chars: 25 }, guidance: "\"Shop [product]\" → that product's page" },
    "cards.*.link": { label: "Secondary link", kind: "cta", limit: { chars: 25 }, optional: true, guidance: "Sample report, IFU or guide" },
    "cards.*.image": { label: "Product image", kind: "image", image: "product", guidance: "Transparent PNG" },
  },
  defaults: () => ({
    h2: "[Choose the right test]",
    intro: "[One or two sentences that help the reader pick between these options.]",
    cards: [productCard(), productCard(), productCard()],
  }),
};

const steps: ModuleMeta = {
  type: "steps",
  code: "M06",
  name: "Steps",
  status: "optional",
  summary: "Three to five numbered steps; the numbers carry the order.",
  squarespace: "One text block per step in a row.",
  replaces: "Four Steps to Effective Water Management (/medical); the 5-Step Enterprise Program accordion",
  variants: [],
  groups: [
    {
      key: "steps",
      label: "step",
      min: 3,
      max: 5,
      recMin: 3,
      recMax: 5,
      make: () => ({ title: "[Step]", body: "[What happens in this step and who does it.]" }),
    },
  ],
  fields: {
    h2: { label: "H2", kind: "text", limit: { chars: 40 }, guidance: "\"How it works\" or the program name" },
    "steps.*.title": { label: "Step title", kind: "text", limit: { chars: 30 }, guidance: "Say who does it" },
    "steps.*.body": { label: "Step body", kind: "text", limit: { words: 25 }, guidance: "What happens" },
  },
  defaults: () => ({
    h2: "[How it works]",
    steps: [
      { title: "[Step one]", body: "[What happens in this step and who does it.]" },
      { title: "[Step two]", body: "[What happens in this step and who does it.]" },
      { title: "[Step three]", body: "[What happens in this step and who does it.]" },
      { title: "[Step four]", body: "[What happens in this step and who does it.]" },
    ],
  }),
};

const proof: ModuleMeta = {
  type: "proof",
  code: "M07",
  name: "Proof",
  status: "core",
  summary: "One customer voice, with an optional before-and-after figure.",
  squarespace: "Navy section; image block with circle crop + quote block. One voice per page.",
  replaces: "The two testimonial bands on the home page; AltaMed + Dental Ed bands on /dental-water; the /benco pass-rate story",
  variants: [
    { id: "stats", label: "Quote + stat pair" },
    { id: "quote", label: "Quote only" },
  ],
  groups: [],
  fields: {
    quote: { label: "Quote", kind: "text", limit: { words: 40 }, guidance: "The customer's own words, approved in writing" },
    name: { label: "Name", kind: "text", limit: { chars: 40 }, guidance: "Credentials after the name" },
    role: { label: "Title, organization", kind: "text", limit: { chars: 70 }, guidance: "Title and organization" },
    "stats.*.value": { label: "Stat value", kind: "text", limit: { chars: 6 }, guidance: "Verified figures only" },
    "stats.*.label": { label: "Stat label", kind: "text", limit: { chars: 40 }, guidance: "What the figure measures" },
    link: { label: "Case study link", kind: "cta", limit: { chars: 30 }, optional: true, guidance: "Link the source of the figures" },
    image: { label: "Headshot", kind: "image", image: "headshot", guidance: "Circle crop" },
  },
  defaults: () => ({
    quote: "[Customer quote in their own words. One idea, 40 words max.]",
    name: "[Full name, credentials]",
    role: "[Title, Organization]",
    stats: [
      { value: "[XX%]", label: "[Before · e.g. U.S. average pass rate]" },
      { value: "[XX%]", label: "[After · e.g. with an Agenics program]" },
    ],
    link: cta("[Read the case study]"),
    image: img(),
  }),
};

const compare: ModuleMeta = {
  type: "compare",
  code: "M08",
  name: "Comparison table",
  status: "optional",
  summary: "Up to four tests side by side, as a real table.",
  squarespace: "Code block holding an HTML table, styled once in Custom CSS. Never a picture of a table.",
  replaces: "The teal product finder on /dental-water; the testing-frequency tables saved as images on /medical",
  variants: [],
  groups: [
    {
      key: "rows",
      label: "row",
      min: 2,
      max: 4,
      recMin: 2,
      recMax: 4,
      make: () => ({ cells: ["[Product]", "[Method]", "[Turnaround]", "[Metrics]", "[Use case]"] }),
    },
  ],
  fields: {
    h2: { label: "H2", kind: "text", limit: { chars: 45 }, guidance: "What is being compared" },
    "columns.*": { label: "Column heading", kind: "text", limit: { chars: 20 }, guidance: "Units in the heading" },
    "rows.*.cells.*": { label: "Cell", kind: "text", limit: { words: 8 }, guidance: "Short phrases, not sentences" },
  },
  defaults: () => ({
    h2: "[Compare tests at a glance]",
    columns: ["Test", "[Method]", "[Results in]", "[What it measures]", "[Best for]"],
    rows: [
      { cells: ["[Product A]", "[e.g. Flow cytometry]", "[e.g. 24 hours]", "[e.g. Live and dead bacteria, pH, TDS]", "[One-line use case]"] },
      { cells: ["[Product B]", "[Method]", "[Turnaround]", "[Metrics]", "[One-line use case]"] },
      { cells: ["[Product C]", "[Method]", "[Turnaround]", "[Metrics]", "[One-line use case]"] },
    ],
  }),
};

const resourceCard = (tag = "[IFU]") => ({ tag, title: "[Document title]", meta: "[PDF · size]", href: "", image: img() });

const resources: ModuleMeta = {
  type: "resources",
  code: "M09",
  name: "Resources",
  status: "optional",
  summary: "Four or eight documents, linked from the Resource Library.",
  squarespace: "Image + text blocks per card. Files live once in the Resource Library; this module links to them.",
  replaces: "Download grids on /library, /edlanding and /medical; the Forms section of /dental-water",
  variants: [],
  groups: [{ key: "cards", label: "document", min: 2, max: 8, recMin: 4, recMax: 8, make: () => resourceCard() }],
  fields: {
    h2: { label: "H2", kind: "text", limit: { chars: 45 }, guidance: "What the reader will find" },
    link: { label: "Library link", kind: "cta", limit: { chars: 25 }, optional: true, guidance: "To the full Resource Library" },
    "cards.*.tag": { label: "Type tag", kind: "text", limit: { chars: 16 }, guidance: "IFU, Form, Guide, Sample report, Regulation" },
    "cards.*.title": { label: "Document title", kind: "text", limit: { chars: 40 }, guidance: "Plain name of the file" },
    "cards.*.meta": { label: "File meta", kind: "text", limit: { chars: 20 }, guidance: "File type and size" },
    "cards.*.href": { label: "File link", kind: "href", guidance: "The PDF itself" },
    "cards.*.image": { label: "Cover", kind: "image", image: "doc", guidance: "Page 1 of the PDF" },
  },
  defaults: () => ({
    h2: "[Instructions, forms and guides]",
    link: cta("[See the full library]"),
    cards: [resourceCard("[IFU]"), resourceCard("[Form]"), resourceCard("[Guide]"), resourceCard("[Sample report]")],
  }),
};

const faq: ModuleMeta = {
  type: "faq",
  code: "M10",
  name: "FAQ",
  status: "optional",
  summary: "Four to eight questions people actually ask support.",
  squarespace: "Accordion block.",
  replaces: "FAQs on /medical, the /faq page, FAQ accordions inside blog posts",
  variants: [],
  groups: [
    {
      key: "items",
      label: "question",
      min: 2,
      max: 8,
      recMin: 4,
      recMax: 8,
      make: () => ({ q: "[Question?]", a: "[Answer first, in the first sentence.]" }),
    },
  ],
  fields: {
    h2: { label: "H2", kind: "text", limit: { chars: 45 }, guidance: "Topic of the questions" },
    help: { label: "Support line", kind: "text", limit: { chars: 40 }, optional: true, guidance: "Lead-in to the support link" },
    helpLink: { label: "Support link", kind: "cta", limit: { chars: 25 }, optional: true, guidance: "Contact page" },
    "items.*.q": { label: "Question", kind: "text", limit: { chars: 80 }, guidance: "Phrased the way customers ask it" },
    "items.*.a": { label: "Answer", kind: "text", limit: { words: 80 }, guidance: "Answer in the first sentence" },
  },
  defaults: () => ({
    h2: "[Common questions]",
    help: "[Still have a question?]",
    helpLink: cta("[Contact support]"),
    items: [
      { q: "[Question one, phrased the way a customer asks it?]", a: "[Direct answer first. Then one or two sentences of detail or a link to the source.]" },
      { q: "[Question two?]", a: "[Answer.]" },
      { q: "[Question three?]", a: "[Answer.]" },
      { q: "[Question four?]", a: "[Answer.]" },
    ],
  }),
};

const ctaBand: ModuleMeta = {
  type: "cta",
  code: "M11",
  name: "CTA band",
  status: "required",
  summary: "Closes every page with one primary action.",
  squarespace: "Navy section with the wave divider. One primary button.",
  replaces: "\"Looking for Additional Support?\" wave band; the closing bands on /dental-product-guide and /library",
  variants: [
    { id: "phone", label: "Button + phone" },
    { id: "button", label: "Button only" },
  ],
  groups: [],
  fields: {
    h2: { label: "H2", kind: "text", limit: { chars: 45 }, guidance: "One next step" },
    line: { label: "Line", kind: "text", limit: { chars: 90 }, guidance: "What happens after the click" },
    cta: { label: "Primary button", kind: "cta", limit: { chars: 25 }, guidance: "One primary only" },
    phone: { label: "Phone", kind: "text", limit: { chars: 16 }, optional: true, guidance: "Shown as a text link" },
  },
  defaults: () => ({
    h2: "[One clear next step]",
    line: "[What happens after they click, in one sentence.]",
    cta: cta("[Schedule a consultation]"),
    phone: "719-466-5592",
  }),
};

export const MODULES: Record<ModuleType, ModuleMeta> = {
  hero,
  trust,
  intro,
  feature,
  products,
  steps,
  proof,
  compare,
  resources,
  faq,
  cta: ctaBand,
};

export const MODULE_ORDER: ModuleType[] = [
  "hero",
  "trust",
  "intro",
  "feature",
  "products",
  "steps",
  "proof",
  "compare",
  "resources",
  "faq",
  "cta",
];

/** Fields a layout variant does not show. */
export function isHidden(type: ModuleType, variant: string, pattern: string): boolean {
  if (type === "intro" && variant === "text" && pattern.startsWith("paths")) return true;
  if (type === "proof" && variant === "quote" && pattern.startsWith("stats")) return true;
  if (type === "cta" && variant === "button" && pattern === "phone") return true;
  return false;
}

/** Every concrete field of a module, in reading order: single fields first, then each item's fields together. */
export function moduleFields(type: ModuleType, variant: string, data: ModuleData) {
  const meta = MODULES[type];
  const rows: { path: string; pattern: string; spec: FieldSpec; pi: number; group: string; nums: number[] }[] = [];
  Object.entries(meta.fields).forEach(([pattern, spec], pi) => {
    if (isHidden(type, variant, pattern)) return;
    for (const path of expand(pattern, data)) {
      rows.push({
        path,
        pattern,
        spec,
        pi,
        group: pattern.includes("*") ? pattern.split(".")[0] : "",
        nums: path
          .split(".")
          .filter((s) => /^\d+$/.test(s))
          .map(Number),
      });
    }
  });
  const groups = [...new Set(rows.filter((r) => r.group).map((r) => r.group))];
  return rows.sort((a, b) => {
    const ga = a.group ? 1 + groups.indexOf(a.group) : 0;
    const gb = b.group ? 1 + groups.indexOf(b.group) : 0;
    if (ga !== gb) return ga - gb;
    const a0 = a.nums[0] ?? -1;
    const b0 = b.nums[0] ?? -1;
    if (a0 !== b0) return a0 - b0;
    if (a.pi !== b.pi) return a.pi - b.pi;
    return (a.nums[1] ?? -1) - (b.nums[1] ?? -1);
  });
}

export function fieldSpec(type: ModuleType, path: string): FieldSpec | undefined {
  return MODULES[type].fields[toPattern(path)];
}

export function limitLabel(limit?: Limit): string {
  if (!limit) return "";
  if (limit.chars) return `${limit.chars} characters max`;
  if (limit.words) return `${limit.words} words max`;
  return "";
}

export function imageSpecLabel(kind: ImageKind): string {
  const k = IMAGE_KINDS[kind];
  return `${k.ratio} · ${k.w.toLocaleString("en-US")} × ${k.h.toLocaleString("en-US")} px · ${k.file}`;
}
