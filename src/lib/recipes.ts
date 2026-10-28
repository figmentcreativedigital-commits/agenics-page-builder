import { MODULES } from "./modules";
import { uid } from "./path";
import type { ModuleInstance, ModuleType, PageDoc } from "./types";

export interface Recipe {
  id: string;
  name: string;
  useFor: string;
  replaces: string;
  modules: (ModuleType | `${ModuleType}:${string}`)[];
}

export const RECIPES: Recipe[] = [
  {
    id: "home",
    name: "Home",
    useFor: "Route each audience to its page fast",
    replaces: "/ and its duplicate /home",
    modules: ["hero", "intro:paths", "trust", "feature", "products", "proof", "cta"],
  },
  {
    id: "product-line",
    name: "Product line",
    useFor: "Dental Water · Sterile Processing",
    replaces: "/dental-water (17 sections), /medical (10 sections)",
    modules: ["hero", "trust", "intro", "compare", "products", "proof", "resources", "faq", "cta"],
  },
  {
    id: "landing",
    name: "Product or campaign landing",
    useFor: "Email and ad destinations, launches, distributor co-brands",
    replaces: "/benco, /redeem-promotions, /insights-app, /insights-dashboard",
    modules: ["hero", "feature", "steps", "proof", "products", "faq", "cta"],
  },
  {
    id: "program",
    name: "Program or company",
    useFor: "Enterprise program · About",
    replaces: "/enterprise + /consultation-the-lead, /about-us",
    modules: ["hero", "feature", "steps", "proof", "feature:image-right", "cta"],
  },
  {
    id: "hub",
    name: "Resource hub",
    useFor: "Resource Library",
    replaces: "/library + /edlanding, /doc-links",
    modules: ["hero", "intro:text", "resources", "resources", "resources", "faq", "cta"],
  },
  {
    id: "master",
    name: "Master template (all 11 modules)",
    useFor: "Reference: every module in order, to copy from",
    replaces: "",
    modules: ["hero", "trust", "intro", "feature", "products", "steps", "proof", "compare", "resources", "faq", "cta"],
  },
  {
    id: "blank",
    name: "Blank",
    useFor: "Start from the hero and CTA band only",
    replaces: "",
    modules: ["hero", "cta"],
  },
];

export function makeModule(type: ModuleType, variant?: string): ModuleInstance {
  const meta = MODULES[type];
  return {
    uid: uid(),
    type,
    variant: variant ?? meta.variants[0]?.id ?? "default",
    data: meta.defaults(),
  };
}

export function pageFromRecipe(recipeId: string, name: string): PageDoc {
  const recipe = RECIPES.find((r) => r.id === recipeId) ?? RECIPES[RECIPES.length - 1];
  const now = Date.now();
  return {
    id: uid(),
    name,
    slug: "",
    seoTitle: "",
    metaDescription: "",
    recipe: recipe.id,
    modules: recipe.modules.map((m) => {
      const [type, variant] = m.split(":") as [ModuleType, string | undefined];
      return makeModule(type, variant);
    }),
    createdAt: now,
    updatedAt: now,
  };
}

/* ------------------------------------------------------------------ */
/* Worked example: /dental-water rebuilt with the Product line recipe  */
/* Copy is taken from agenics.com; [brackets] still need confirming.   */
/* ------------------------------------------------------------------ */

const link = (label: string, href: string) => ({ label, href });
const noImg = (alt: string) => ({ id: null, alt });

export function exampleDentalWater(): PageDoc {
  const now = Date.now();
  const m = (type: ModuleType, variant: string, data: Record<string, unknown>): ModuleInstance => ({
    uid: uid(),
    type,
    variant,
    data: { ...MODULES[type].defaults(), ...data },
  });
  return {
    id: uid(),
    name: "Example — Dental Water",
    slug: "dental-water",
    seoTitle: "Dental Waterline Testing | Agenics Labs",
    metaDescription:
      "In-office and mail-in dental waterline tests with lab results you can act on. Compare RapidCheck, StandardCheck, SimCheck and MyCheck by method and turnaround.",
    recipe: "product-line",
    createdAt: now,
    updatedAt: now,
    modules: [
      m("hero", "photo", {
        eyebrow: "Dental unit water testing",
        h1: "Compliance without compromise",
        sub: "In-office and mail-in tests for dental waterlines, with lab results you can act on.",
        cta1: link("Compare tests", "#compare"),
        cta2: link("Talk to a water expert", "/agenics-contact"),
        image: noImg("Gloved hand holding a petri dish of bacterial colonies against a light background"),
      }),
      m("trust", "default", {
        items: [
          { title: "CDC ELITE validated", detail: "For Legionella testing" },
          { title: "Results in 24 hours", detail: "With RapidCheck" },
          { title: "Photo documentation", detail: "Included with StandardCheck" },
          { title: "At your distributor", detail: "Patterson, Henry Schein, Benco and more" },
        ],
      }),
      m("intro", "paths", {
        h2: "Why waterline testing matters",
        body: "Dental unit waterlines build up biofilm that can push bacteria past the CDC limit of 500 CFU/mL. Routine testing shows whether your treatment protocol is working and documents compliance when your state board or an auditor asks.",
        paths: [
          { title: "In-office testing", line: "Monitor between lab tests with a paddle you read in your office.", link: link("See MyCheck", "/shop/p/mycheck") },
          { title: "Mail-in lab testing", line: "Send samples to our lab for counts you can document.", link: link("Compare lab tests", "#compare") },
        ],
      }),
      m("compare", "default", {
        h2: "Compare dental water tests",
        columns: ["Test", "Method", "Results in", "What it measures", "Best for"],
        rows: [
          { cells: ["RapidCheck™", "Flow cytometry", "24 hours", "Live and dead bacteria, pH, TDS", "High-volume clinics avoiding long chair downtime"] },
          { cells: ["StandardCheck™", "R2A culture", "5 days", "CFU, TDS, pH, plate photo", "[Best-for line — confirm]"] },
          { cells: ["SimCheck™", "Enzyme substrate (HPC)", "[confirm]", "[confirm]", "[Best-for line — confirm]"] },
          { cells: ["MyCheck™", "In-office HPC paddle", "As early as 2 days", "CFU count, not a range", "[Best-for line — confirm]"] },
        ],
      }),
      m("products", "default", {
        h2: "Our most-ordered dental tests",
        intro: "Save on mail-in bacteria testing with an annual kit, available on each product page.",
        cards: [
          {
            type: "Mail-in · flow cytometry",
            name: "RapidCheck™",
            tagline: "Greatest accuracy, fastest turnaround",
            bullets: ["Results in 24 hours", "Live and dead bacteria counts", "Counts hard-to-culture bacteria"],
            price: "From $34.99",
            cta: link("Shop RapidCheck", "/shop/p/rapidcheck"),
            link: link("Flow cytometry guide", ""),
            image: noImg("RapidCheck mail-in test kit"),
          },
          {
            type: "Mail-in · R2A culture",
            name: "StandardCheck™",
            tagline: "The gold standard in dental water testing",
            bullets: ["Results in 5 days", "Includes CFU, TDS and pH", "Photo documentation included"],
            price: "From $[confirm]",
            cta: link("Shop StandardCheck", ""),
            link: link("Sample report", ""),
            image: noImg("StandardCheck mail-in test kit"),
          },
          {
            type: "In-office · HPC paddle",
            name: "MyCheck™",
            tagline: "The easiest quantified in-office test",
            bullets: ["Results in as early as 2 days", "A CFU count, not a range", "Log sheet in every box"],
            price: "From $25.99",
            cta: link("Shop MyCheck", "/shop/p/mycheck"),
            link: link("MyCheck IFU", ""),
            image: noImg("Box of MyCheck in-office test paddles"),
          },
        ],
      }),
      m("proof", "stats", {
        quote: "Working with Agenics has been a true collaboration centered on prioritizing patient safety above all else.",
        name: "Dr. Huy Than, DDS",
        role: "Site Dental Director, AltaMed Community Health Center",
        stats: [
          { value: "69%", label: "U.S. average waterline pass rate" },
          { value: "98%", label: "AltaMed pass rate with Agenics" },
        ],
        link: link("Read the AltaMed story", ""),
        image: noImg("Dr. Huy Than, DDS"),
      }),
      m("resources", "default", {
        h2: "Submission forms and instructions",
        link: link("See the full library", "/library"),
        cards: [
          { tag: "Form", title: "RapidCheck submission form", meta: "PDF · [size]", href: "", image: noImg("") },
          { tag: "Form", title: "StandardCheck submission form", meta: "PDF · [size]", href: "", image: noImg("") },
          { tag: "Form", title: "SimCheck submission form", meta: "PDF · [size]", href: "", image: noImg("") },
          { tag: "IFU", title: "MyCheck instructions and log", meta: "PDF · [size]", href: "", image: noImg("") },
        ],
      }),
      m("faq", "default", {
        h2: "Shipping and sampling questions",
        help: "Still have a question?",
        helpLink: link("Contact support", "/agenics-contact"),
        items: [
          { q: "How are mail-in kits shipped?", a: "[Answer from the current FAQ page, trimmed to 80 words.]" },
          { q: "Do I need overnight shipping for samples?", a: "[Answer from the current FAQ page.]" },
          { q: "Are there state restrictions for shipping?", a: "[Answer from the current FAQ page.]" },
          { q: "When should I collect samples?", a: "[Answer from the current FAQ page.]" },
        ],
      }),
      m("cta", "phone", {
        h2: "Not sure which test fits?",
        line: "Schedule a consultation with an Agenics dental water expert.",
        cta: link("Schedule a consultation", "/agenics-contact"),
        phone: "719-466-5592",
      }),
    ],
  };
}
