import type { Bg, ImageKind, Limit, ModuleData, ModuleInstance, ModuleType } from "./types";
import { expand, toPattern } from "./path";

/* ------------------------------------------------------------------ */
/* Image specs: every image slot uses one of these six                */
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
  landscape: {
    ratio: "3:2",
    r: 3 / 2,
    w: 1500,
    h: 1000,
    label: "Landscape",
    file: "JPG",
    note: "Equipment or environment; subject off-center, room for a crop to 4:3 on phones",
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

export type FieldKind = "text" | "cta" | "href" | "image" | "icon";

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
  make: () => unknown;
}

/** An element the editor can remove from a module and bring back later. */
export interface ElementSpec {
  id: string;
  label: string;
  /** Field patterns or group keys the element covers. */
  keys: string[];
}

export type Category = "Open" | "Explain" | "Lists and grids" | "Products and proof" | "Support" | "Close";

export interface ModuleMeta {
  type: ModuleType;
  code: string;
  name: string;
  category: Category;
  status: "required" | "core" | "optional";
  summary: string;
  squarespace: string;
  replaces: string;
  variants: { id: string; label: string }[];
  groups: ItemGroup[];
  fields: Record<string, FieldSpec>;
  /** Removable elements. Anything not listed here is required by the module. */
  elements: ElementSpec[];
  /** Section backgrounds allowed, default first. Empty: the module has a fixed treatment. */
  backgrounds: Bg[];
  /** Elements a newly added module starts without. */
  hiddenByDefault?: string[];
  defaults: () => ModuleData;
}

const cta = (label: string) => ({ label, href: "" });
const img = () => ({ id: null, alt: "" });
const el = (id: string, label: string, keys: string[] = [id]): ElementSpec => ({ id, label, keys });

export const BACKGROUNDS: Record<Bg, { label: string; hex: string; note: string }> = {
  white: { label: "White", hex: "#FFFFFF", note: "Default for most sections" },
  silver: { label: "Silver 18%", hex: "#F2F2F3", note: "Alternate sections; cards stay white" },
  cyan: { label: "Cyan 12%", hex: "#E0F7FD", note: "One highlight per page; navy type 9.2:1" },
  navy: { label: "Navy", hex: "#004278", note: "White type 10.2:1, cyan accents 4.6:1, cyan buttons" },
};

/* ------------------------------------------------------------------ */
/* The sixteen modules                                                 */
/* ------------------------------------------------------------------ */

const hero: ModuleMeta = {
  type: "hero",
  code: "M01",
  name: "Hero",
  category: "Open",
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
    eyebrow: { label: "Eyebrow", kind: "text", limit: { chars: 30 }, optional: true, guidance: "Audience or product line" },
    h1: { label: "H1", kind: "text", limit: { chars: 45 }, guidance: "The outcome, not the company name. The only H1 on the page." },
    sub: { label: "Subhead", kind: "text", limit: { chars: 140 }, guidance: "One sentence: who it is for and what they get" },
    body: { label: "Supporting paragraph", kind: "text", limit: { words: 35 }, optional: true, guidance: "What is included and how it works" },
    cta1: { label: "Primary button", kind: "cta", limit: { chars: 25 }, guidance: "Verb + object. Links to a product page or form." },
    cta2: { label: "Secondary button", kind: "cta", limit: { chars: 25 }, optional: true, guidance: "Lower-commitment action" },
    image: { label: "Hero image", kind: "image", image: "hero", guidance: "Lab or practice photography" },
  },
  elements: [el("eyebrow", "Eyebrow"), el("body", "Supporting paragraph"), el("cta2", "Secondary button")],
  backgrounds: [],
  hiddenByDefault: ["body"],
  defaults: () => ({
    eyebrow: "[For dental practices]",
    h1: "[Outcome headline in 45 characters or fewer]",
    sub: "[Who this page is for and what they get from it, in one plain sentence.]",
    body: "[Optional second paragraph: what is included and how it works.]",
    cta1: cta("[Shop dental tests]"),
    cta2: cta("[Talk to a water expert]"),
    image: img(),
  }),
};

const trust: ModuleMeta = {
  type: "trust",
  code: "M02",
  name: "Trust bar",
  category: "Open",
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
  elements: [el("items.*.detail", "Details")],
  backgrounds: ["white", "silver"],
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
  name: "Intro + choices",
  category: "Explain",
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
  elements: [el("body", "Intro paragraph"), el("paths.*.line", "Path lines")],
  backgrounds: ["white", "silver", "cyan"],
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
  name: "Image + benefits",
  category: "Explain",
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
  elements: [el("eyebrow", "Eyebrow"), el("benefits", "Benefits list"), el("cta", "Button")],
  backgrounds: ["silver", "white", "cyan"],
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
  category: "Products and proof",
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
  elements: [
    el("intro", "Intro"),
    el("cards.*.type", "Test type labels"),
    el("cards.*.tagline", "Taglines"),
    el("cards.*.bullets", "Bullets"),
    el("cards.*.price", "Prices"),
    el("cards.*.link", "Secondary links"),
  ],
  backgrounds: ["white", "silver"],
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
  category: "Lists and grids",
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
  elements: [el("steps.*.body", "Step descriptions")],
  backgrounds: ["silver", "white", "cyan"],
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
  name: "Testimonial",
  category: "Products and proof",
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
  elements: [el("image", "Headshot"), el("link", "Case study link")],
  backgrounds: [],
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
  category: "Products and proof",
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
  elements: [],
  backgrounds: ["white", "silver"],
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
  name: "Downloads",
  category: "Support",
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
  elements: [el("link", "Library link"), el("cards.*.tag", "Type tags"), el("cards.*.meta", "File meta"), el("cards.*.image", "Covers")],
  backgrounds: ["silver", "white"],
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
  category: "Support",
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
  elements: [el("support", "Support line and link", ["help", "helpLink"])],
  backgrounds: ["white", "silver", "cyan"],
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
  name: "Call to action",
  category: "Close",
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
    line: { label: "Line", kind: "text", limit: { chars: 130 }, guidance: "What happens after the click" },
    assure: { label: "Reassurance line", kind: "text", limit: { chars: 100 }, optional: true, guidance: "Short facts that remove doubt: no contracts, all materials included" },
    cta: { label: "Primary button", kind: "cta", limit: { chars: 25 }, guidance: "One primary only" },
    phone: { label: "Phone", kind: "text", limit: { chars: 16 }, optional: true, guidance: "Shown as a text link" },
  },
  elements: [el("line", "Line"), el("assure", "Reassurance line")],
  backgrounds: [],
  hiddenByDefault: ["assure"],
  defaults: () => ({
    h2: "[One clear next step]",
    line: "[What happens after they click, in one sentence.]",
    assure: "[e.g. No contracts. All materials included.]",
    cta: cta("[Schedule a consultation]"),
    phone: "719-466-5592",
  }),
};

/* M12 ---------------------------------------------------------------- */
const explainer: ModuleMeta = {
  type: "explainer",
  code: "M12",
  name: "Explainer + list",
  category: "Explain",
  status: "optional",
  summary: "Explains a standard or topic, with a checklist or numbered list beside it.",
  squarespace: "Two columns: text blocks left, a list block in a Silver 18% box right. Stack on phones.",
  replaces: "\"What is ST108?\" and \"The Four Steps to Effective Water Management\" on /medical; regulation explainers in blog posts",
  variants: [
    { id: "checklist", label: "Checklist beside" },
    { id: "numbered", label: "Numbered list beside" },
    { id: "stacked", label: "List below text" },
  ],
  groups: [
    { key: "paras", label: "paragraph", min: 1, max: 3, recMin: 1, recMax: 3, make: () => "[Another paragraph, 60 words max.]" },
    { key: "items", label: "list item", min: 2, max: 6, recMin: 3, recMax: 5, make: () => "[List item]" },
  ],
  fields: {
    eyebrow: { label: "Eyebrow", kind: "text", limit: { chars: 30 }, optional: true, guidance: "Topic or standard name" },
    h2: { label: "H2", kind: "text", limit: { chars: 60 }, guidance: "The question the reader is asking" },
    "paras.*": { label: "Paragraph", kind: "text", limit: { words: 60 }, guidance: "Plain-language definition first, then why it matters" },
    listTitle: { label: "List heading", kind: "text", limit: { chars: 60 }, optional: true, guidance: "Introduces the list, e.g. “It includes:”" },
    "items.*": { label: "List item", kind: "text", limit: { chars: 70 }, guidance: "Parallel phrasing, each starting with a verb or noun" },
    cta: { label: "Button", kind: "cta", limit: { chars: 25 }, optional: true, guidance: "Link to the standard or a guide" },
  },
  elements: [el("eyebrow", "Eyebrow"), el("listTitle", "List heading"), el("cta", "Button")],
  backgrounds: ["white", "silver", "cyan"],
  hiddenByDefault: ["cta"],
  defaults: () => ({
    eyebrow: "[Topic]",
    h2: "[What the reader needs to understand]",
    paras: ["[Define the standard or topic in plain words. Say who it applies to and what it asks of them. Two or three sentences.]"],
    listTitle: "[It includes:]",
    items: ["[First item]", "[Second item]", "[Third item]", "[Fourth item]"],
    cta: cta("[Read the overview]"),
  }),
};

/* M13 ---------------------------------------------------------------- */
const gridItem = (icon = "check") => ({ icon, title: "[Benefit or impact]", body: "[One sentence on what it means for the customer.]" });

const grid: ModuleMeta = {
  type: "grid",
  code: "M13",
  name: "Icon grid",
  category: "Lists and grids",
  status: "optional",
  summary: "Two to eight short points, each with an icon from the Agenics set.",
  squarespace: "Grid of text blocks with an SVG icon above each title. Icons download from the spec sheet.",
  replaces: "\"Why Agenics?\" icon rows; the Patients / Devices / Facilities blocks in the ST108 posts",
  variants: [
    { id: "cols-3", label: "3 across" },
    { id: "split", label: "Heading left, 2 × 2 right" },
    { id: "cols-4", label: "4 across" },
    { id: "cols-2", label: "2 × 2" },
  ],
  groups: [{ key: "items", label: "point", min: 2, max: 8, recMin: 3, recMax: 6, make: () => gridItem() }],
  fields: {
    eyebrow: { label: "Eyebrow", kind: "text", limit: { chars: 30 }, optional: true, guidance: "Optional label above the heading" },
    h2: { label: "H2", kind: "text", limit: { chars: 60 }, guidance: "The idea the points add up to" },
    intro: { label: "Intro", kind: "text", limit: { words: 50 }, optional: true, guidance: "Sets up the points in one or two sentences" },
    "items.*.icon": { label: "Icon", kind: "icon", guidance: "From the Agenics icon set; one idea per icon" },
    "items.*.title": { label: "Point title", kind: "text", limit: { chars: 40 }, guidance: "Two to four words" },
    "items.*.body": { label: "Point text", kind: "text", limit: { words: 30 }, guidance: "One sentence" },
    cta: { label: "Button", kind: "cta", limit: { chars: 25 }, optional: true, guidance: "Primary style; one per module" },
  },
  elements: [el("eyebrow", "Eyebrow"), el("intro", "Intro"), el("items.*.icon", "Icons"), el("items.*.body", "Point text"), el("cta", "Button")],
  backgrounds: ["white", "silver", "cyan", "navy"],
  hiddenByDefault: ["eyebrow"],
  defaults: () => ({
    eyebrow: "[Why it matters]",
    h2: "[The idea these points add up to]",
    intro: "[One or two sentences that set up the points below.]",
    items: [gridItem("droplet"), gridItem("shield"), gridItem("report")],
    cta: cta("[Order a test kit]"),
  }),
};

/* M14 ---------------------------------------------------------------- */
const audienceItem = (icon = "clinic") => ({ icon, title: "[Segment]", body: "[Including the specialties or facility types in this group.]" });

const audience: ModuleMeta = {
  type: "audience",
  code: "M14",
  name: "Who it’s for",
  category: "Lists and grids",
  status: "optional",
  summary: "Who it is for: two to six segments, each with a line of examples.",
  squarespace: "Two columns: heading and intro left, a list of text blocks with dividers right.",
  replaces: "\"Who we serve\" lists; the outpatient segments on the ST108 page",
  variants: [
    { id: "list", label: "Heading left, list right" },
    { id: "cards", label: "Cards" },
    { id: "image", label: "Photo + list" },
  ],
  groups: [{ key: "items", label: "segment", min: 2, max: 6, recMin: 3, recMax: 5, make: () => audienceItem() }],
  fields: {
    eyebrow: { label: "Eyebrow", kind: "text", limit: { chars: 30 }, optional: true, guidance: "Optional label above the heading" },
    h2: { label: "H2", kind: "text", limit: { chars: 50 }, guidance: "Who the product is built for" },
    sub: { label: "Subhead", kind: "text", limit: { chars: 70 }, optional: true, guidance: "Raleway Light; sharpens the heading" },
    body: { label: "Intro", kind: "text", limit: { words: 50 }, optional: true, guidance: "What these segments have in common" },
    "items.*.icon": { label: "Icon", kind: "icon", guidance: "From the Agenics icon set" },
    "items.*.title": { label: "Segment", kind: "text", limit: { chars: 40 }, guidance: "The name customers use for themselves" },
    "items.*.body": { label: "Examples", kind: "text", limit: { words: 25 }, guidance: "Specialties or facility types" },
    cta: { label: "Button", kind: "cta", limit: { chars: 25 }, optional: true, guidance: "Outline style" },
    image: { label: "Photo", kind: "image", image: "landscape", guidance: "The setting these customers work in" },
  },
  elements: [el("eyebrow", "Eyebrow"), el("sub", "Subhead"), el("body", "Intro"), el("items.*.icon", "Icons"), el("cta", "Button")],
  backgrounds: ["white", "silver", "cyan"],
  hiddenByDefault: ["eyebrow", "cta"],
  defaults: () => ({
    eyebrow: "[Who it is for]",
    h2: "[Built for the people who use it]",
    sub: "[A line that sharpens the heading]",
    body: "[What these customers have in common and why the product fits them.]",
    items: [audienceItem("clinic"), audienceItem("instruments"), audienceItem("community")],
    cta: cta("[Talk to our team]"),
    image: img(),
  }),
};

/* M15 ---------------------------------------------------------------- */
const statement: ModuleMeta = {
  type: "statement",
  code: "M15",
  name: "Statement",
  category: "Explain",
  status: "optional",
  summary: "A short argument that lands on one bold line and a button.",
  squarespace: "Full-width colored section, text blocks centered; the statement line set in Raleway Light.",
  replaces: "Mid-page \"why switch\" bands and the alternating text panels on campaign pages",
  variants: [
    { id: "center", label: "Centered" },
    { id: "split", label: "Heading left" },
  ],
  groups: [{ key: "paras", label: "paragraph", min: 1, max: 3, recMin: 1, recMax: 3, make: () => "[Another paragraph, 50 words max.]" }],
  fields: {
    eyebrow: { label: "Eyebrow", kind: "text", limit: { chars: 30 }, optional: true, guidance: "Optional label above the heading" },
    h2: { label: "H2", kind: "text", limit: { chars: 60 }, guidance: "The claim" },
    "paras.*": { label: "Paragraph", kind: "text", limit: { words: 50 }, guidance: "The problem, then the alternative" },
    statement: { label: "Statement line", kind: "text", limit: { chars: 100 }, optional: true, guidance: "Three short sentences at most; reads as the takeaway" },
    cta: { label: "Button", kind: "cta", limit: { chars: 25 }, optional: true, guidance: "Primary style" },
  },
  elements: [el("eyebrow", "Eyebrow"), el("statement", "Statement line"), el("cta", "Button")],
  backgrounds: ["cyan", "navy", "silver", "white"],
  hiddenByDefault: ["eyebrow"],
  defaults: () => ({
    eyebrow: "[The alternative]",
    h2: "[The claim, in one line]",
    paras: ["[What customers do today and where it falls short.]", "[What Agenics offers instead.]"],
    statement: "[No contracts. No complicated setup. Everything included.]",
    cta: cta("[Order a test kit]"),
  }),
};

/* M16 ---------------------------------------------------------------- */
const story: ModuleMeta = {
  type: "story",
  code: "M16",
  name: "Text + image",
  category: "Explain",
  status: "optional",
  summary: "A few paragraphs beside one landscape photo.",
  squarespace: "Text blocks beside an image block; flip the image when the module repeats.",
  replaces: "Long text sections on /medical, /about-us and the blog landing pages",
  variants: [
    { id: "image-right", label: "Image right" },
    { id: "image-left", label: "Image left" },
  ],
  groups: [{ key: "paras", label: "paragraph", min: 1, max: 4, recMin: 1, recMax: 3, make: () => "[Another paragraph, 60 words max.]" }],
  fields: {
    eyebrow: { label: "Eyebrow", kind: "text", limit: { chars: 30 }, optional: true, guidance: "Optional label above the heading" },
    h2: { label: "H2", kind: "text", limit: { chars: 50 }, guidance: "The point of the section" },
    "paras.*": { label: "Paragraph", kind: "text", limit: { words: 60 }, guidance: "One idea per paragraph" },
    cta: { label: "Button", kind: "cta", limit: { chars: 25 }, optional: true, guidance: "Outline style" },
    image: { label: "Image", kind: "image", image: "landscape", guidance: "Equipment, lab or setting" },
  },
  elements: [el("eyebrow", "Eyebrow"), el("cta", "Button"), el("image", "Image")],
  backgrounds: ["white", "silver"],
  hiddenByDefault: ["eyebrow"],
  defaults: () => ({
    eyebrow: "[Label]",
    h2: "[The point of this section]",
    paras: ["[First paragraph: the situation.]", "[Second paragraph: what changes with Agenics.]"],
    cta: cta("[Learn more]"),
    image: img(),
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
  explainer,
  grid,
  audience,
  statement,
  story,
};

/** Code order (M01–M16): spec sheet and the master template. */
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
  "explainer",
  "grid",
  "audience",
  "statement",
  "story",
];

/** Library order: grouped the way people look for blocks. */
export const CATEGORIES: Category[] = ["Open", "Explain", "Lists and grids", "Products and proof", "Support", "Close"];
export const LIBRARY: { category: Category; types: ModuleType[] }[] = CATEGORIES.map((category) => ({
  category,
  types: MODULE_ORDER.filter((t) => MODULES[t].category === category),
}));

/** Fields a layout variant does not show. */
export function isHidden(type: ModuleType, variant: string, pattern: string): boolean {
  if (type === "intro" && variant === "text" && pattern.startsWith("paths")) return true;
  if (type === "proof" && variant === "quote" && pattern.startsWith("stats")) return true;
  if (type === "cta" && variant === "button" && pattern === "phone") return true;
  if (type === "audience" && variant !== "image" && pattern === "image") return true;
  return false;
}

/** True when a field pattern belongs to an element the editor removed. */
export function isOff(type: ModuleType, hidden: string[] | undefined, pattern: string): boolean {
  if (!hidden?.length) return false;
  return MODULES[type].elements.some(
    (e) => hidden.includes(e.id) && e.keys.some((k) => pattern === k || pattern.startsWith(`${k}.`)),
  );
}

/** Layout or editor hides it: either way it is not on the page. */
export function isShown(mod: Pick<ModuleInstance, "type" | "variant" | "hidden">, pattern: string): boolean {
  return !isHidden(mod.type, mod.variant, pattern) && !isOff(mod.type, mod.hidden, pattern);
}

export function bgOf(mod: Pick<ModuleInstance, "type" | "style">): Bg | null {
  const allowed = MODULES[mod.type].backgrounds;
  if (!allowed.length) return null;
  const want = mod.style?.bg;
  return want && allowed.includes(want) ? want : allowed[0];
}

/** Every concrete field of a module, in reading order: single fields first, then each item's fields together. */
export function moduleFields(type: ModuleType, variant: string, data: ModuleData, hidden?: string[]) {
  const meta = MODULES[type];
  const rows: { path: string; pattern: string; spec: FieldSpec; pi: number; group: string; nums: number[] }[] = [];
  Object.entries(meta.fields).forEach(([pattern, spec], pi) => {
    if (isHidden(type, variant, pattern) || isOff(type, hidden, pattern)) return;
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
  // A repeating group sits where its first field is declared; its items stay together in item order
  const anchorOf = new Map<string, number>();
  rows.forEach((r) => r.group && anchorOf.set(r.group, Math.min(anchorOf.get(r.group) ?? Infinity, r.pi)));
  const at = (r: (typeof rows)[number]) => (r.group ? anchorOf.get(r.group)! : r.pi);
  return rows.sort((a, b) => {
    if (at(a) !== at(b)) return at(a) - at(b);
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
