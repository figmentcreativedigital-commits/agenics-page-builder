import { LIBRARY, MODULES } from "./modules";
import { uid } from "./path";
import type { ImageVal, ModuleInstance, ModuleStyle, ModuleType, PageDoc } from "./types";

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
    id: "explainer",
    name: "Standard or topic explainer",
    useFor: "ST108 · regulations · a test method, with the product that answers it",
    replaces: "/medical, /stateregulation and the long ST108 blog posts",
    modules: ["hero", "explainer:numbered", "grid:split", "products", "grid:cols-3", "audience", "statement", "story", "faq", "cta"],
  },
  {
    id: "master",
    name: "Master template (all 16 modules)",
    useFor: "Reference: every module in order, to copy from",
    replaces: "",
    modules: LIBRARY.flatMap((g) => g.types),
  },
  {
    id: "blank",
    name: "Blank",
    useFor: "Just a Hero and a Call to action",
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
    ...(meta.hiddenByDefault?.length ? { hidden: [...meta.hiddenByDefault] } : {}),
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
/** An image shipped with the app (public/examples), so worked examples open with their photography. */
const fileImg = (src: string, w: number, h: number, alt: string): ImageVal => ({
  id: null,
  src,
  w,
  h,
  alt,
  name: src.split("/").pop(),
  type: src.endsWith(".png") ? "image/png" : "image/jpeg",
});

type Extra = { hidden?: string[]; style?: ModuleStyle; anchor?: string; note?: string };

const m = (type: ModuleType, variant: string, data: Record<string, unknown>, extra: Extra = {}): ModuleInstance => {
  const hidden = extra.hidden ?? MODULES[type].hiddenByDefault ?? [];
  return {
    uid: uid(),
    type,
    variant,
    data: { ...MODULES[type].defaults(), ...data },
    ...(hidden.length ? { hidden: [...hidden] } : {}),
    ...(extra.style ? { style: extra.style } : {}),
    ...(extra.anchor ? { anchor: extra.anchor } : {}),
    ...(extra.note ? { note: extra.note } : {}),
  };
};

export function exampleDentalWater(): PageDoc {
  const now = Date.now();
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
      m(
        "compare",
        "default",
        {
        h2: "Compare dental water tests",
        columns: ["Test", "Method", "Results in", "What it measures", "Best for"],
        rows: [
          { cells: ["RapidCheck™", "Flow cytometry", "24 hours", "Live and dead bacteria, pH, TDS", "High-volume clinics avoiding long chair downtime"] },
          { cells: ["StandardCheck™", "R2A culture", "5 days", "CFU, TDS, pH, plate photo", "[Best-for line — confirm]"] },
          { cells: ["SimCheck™", "Enzyme substrate (HPC)", "[confirm]", "[confirm]", "[Best-for line — confirm]"] },
          { cells: ["MyCheck™", "In-office HPC paddle", "As early as 2 days", "CFU count, not a range", "[Best-for line — confirm]"] },
        ],
        },
        { anchor: "compare" },
      ),
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

/* ------------------------------------------------------------------ */
/* Worked example 2: the ST108 page, built from the 10.26 copy deck    */
/* Shows the newer features: element removal, section backgrounds,     */
/* in-page anchors, icon grids, team notes and bundled photography.    */
/* ------------------------------------------------------------------ */

const ST108 = "/examples/st108";

export function exampleST108(): PageDoc {
  const now = Date.now();
  return {
    id: uid(),
    name: "Example — ST108 (Affirm)",
    slug: "st108-water-testing",
    seoTitle: "ST108 Water Quality Testing Kits | Agenics Labs",
    metaDescription:
      "Agenics Affirm™ mail-in kits make ANSI/AAMI ST108 water quality testing simple: all materials included, no contracts, and results delivered online.",
    recipe: "explainer",
    createdAt: now,
    updatedAt: now,
    modules: [
      m(
        "hero",
        "photo",
        {
          eyebrow: "Sterile processing water testing",
          h1: "Simplify ST108 Water Quality Testing",
          sub: "Agenics Affirm™ makes it easy to qualify and routinely monitor sterile processing water quality with convenient mail-in test kits.",
          body: "Everything you need is included. Ordering is simple, pricing is straightforward with no contracts, and results are delivered online in a clear, user-friendly report.",
          cta1: link("Order a test kit", "#order"),
          cta2: link("Learn about ST108", "#what-is-st108"),
          image: fileImg(`${ST108}/st108-hero-sterilizer-16x9.jpg`, 2119, 1192, "Gloved hand loading instrument trays into a sterilizer"),
        },
        { hidden: ["eyebrow"] },
      ),
      m(
        "explainer",
        "numbered",
        {
          h2: "What Is ST108?",
          paras: [
            "ANSI/AAMI ST108 is the first comprehensive U.S. standard focused specifically on the quality of water used for processing medical devices. It establishes requirements for water quality management programs, including testing, monitoring, documentation, review, and corrective actions.",
            "The standard recognizes water quality itself as an important patient safety variable in medical device processing.",
          ],
          listTitle: "ST108 water quality management includes:",
          items: [
            "Assessing current water systems and quality",
            "Implementing a water management plan",
            "Validating that systems meet water quality requirements",
            "Routinely monitoring water quality",
          ],
        },
        { hidden: ["eyebrow", "cta"], anchor: "what-is-st108" },
      ),
      m(
        "grid",
        "split",
        {
          h2: "ST108 Testing Without the Complexity",
          intro:
            "For many outpatient facilities, traditional water quality solutions may be more extensive than what is needed. Agenics Affirm™ provides a simpler option specifically designed around ST108 water quality testing.",
          items: [
            { icon: "cart", title: "Easy to Order", body: "Order test kits online when you need them." },
            { icon: "kit", title: "Everything Included", body: "Each kit includes all needed testing materials." },
            { icon: "unlock", title: "No Contracts", body: "Straightforward pricing without long-term contracts." },
            { icon: "online", title: "Easy-to-Understand Results", body: "Results are delivered online in a user-friendly report." },
          ],
          cta: link("Order Agenics Affirm", "#order"),
        },
        { hidden: ["eyebrow"], style: { bg: "silver" } },
      ),
      m(
        "products",
        "default",
        {
          h2: "Choose your Affirm kit",
          intro:
            "Pick the kit for the ST108 water category you are testing: AffirmCritical™ for critical water, AffirmUtility™ for utility water. Each kit includes all needed testing materials.",
          cards: [
            {
              type: "Critical water · monthly",
              name: "AffirmCritical™",
              tagline: "For ST108 critical water sources",
              bullets: ["Reports endotoxin and bacteria", "Monthly testing for critical water", "Critical+ adds pH, hardness and more"],
              price: "From $[price]",
              cta: link("Order AffirmCritical", "/shop/p/affirmcritical-9bepc"),
              link: link("Sample submission form", "/s/GP40000-Affirm_Critical_Sample-Submission-Form.pdf"),
              image: fileImg(`${ST108}/st108-affirm-critical-kit-1x1.png`, 1200, 1200, "AffirmCritical test kit with sample vials, instructions and mailer"),
            },
            {
              type: "Utility water · quarterly",
              name: "AffirmUtility™",
              tagline: "For ST108 utility water sources",
              bullets: ["Reports bacteria", "Quarterly testing for utility water", "Utility+ adds pH, hardness and more"],
              price: "From $[price]",
              cta: link("Order AffirmUtility", "/shop/p/affirmutility-5b8af"),
              link: link("Sample submission form", "/s/GP40010-Affirm_Utility_Sample-Submission-Form.pdf"),
              image: fileImg(`${ST108}/st108-affirm-utility-kit-1x1.png`, 1200, 1200, "AffirmUtility test kit with sample vials, instructions and mailer"),
            },
          ],
        },
        {
          hidden: ["cards.*.price"],
          anchor: "order",
          note: "Added by Figment, not in the 10.26 copy deck: every “Order a test kit” button lands here (#order) so visitors pick Critical or Utility. Copy adapted from agenics.com/medical and the Affirm sell sheet. Prices are switched off until confirmed. Delete this block if it is not wanted.",
        },
      ),
      m(
        "grid",
        "cols-3",
        {
          h2: "Why Water Quality Matters",
          intro: "ST108 puts greater focus on the role water quality plays in medical device processing. Three primary areas of impact include:",
          items: [
            { icon: "patient", title: "Patients", body: "Water quality management can help reduce risks associated with microbial or endotoxin contamination." },
            { icon: "instruments", title: "Devices", body: "Proper water quality can help reduce corrosion, pitting and scaling that affect equipment performance and longevity." },
            { icon: "facility", title: "Facilities", body: "Better water quality management can improve water system effectiveness while reducing maintenance associated with scaling and buildup." },
          ],
        },
        { hidden: ["eyebrow", "cta"], style: { bg: "navy" } },
      ),
      m(
        "audience",
        "list",
        {
          h2: "Built for Outpatient Healthcare",
          sub: "Designed for the Facilities That Need a Simpler Solution",
          body: "Agenics Affirm™ is particularly well suited for smaller healthcare environments that need to monitor sterile processing water quality without the complexity of a large-scale water management service.",
          items: [
            { icon: "clinic", title: "Ambulatory Surgery Centers", body: "Including orthopedic, ophthalmology, gastroenterology, ENT and multispecialty surgery centers." },
            { icon: "stethoscope", title: "Office-Based Surgical Practices", body: "Including oral surgery, OMS, periodontics, plastic surgery and dermatology practices." },
            { icon: "community", title: "Community-Based Healthcare", body: "Including FQHCs, community health centers and rural health clinics." },
          ],
        },
        { hidden: ["eyebrow", "cta"] },
      ),
      m(
        "statement",
        "center",
        {
          h2: "A Simpler Alternative to Traditional Water Quality Testing",
          paras: [
            "Facilities commonly rely on water treatment providers, environmental laboratories, or internal monitoring. Each approach can present limitations, particularly for smaller outpatient environments.",
            "Agenics Affirm™ offers another option: an easy mail-in testing solution specifically designed around ST108 water quality requirements.",
          ],
          statement: "No contracts. No complicated service model. All needed testing materials included.",
          cta: link("Order a test kit", "#order"),
        },
        { hidden: ["eyebrow"], style: { bg: "cyan" } },
      ),
      m(
        "story",
        "image-right",
        {
          h2: "Understand Your Water. Document Your Results.",
          paras: [
            "ST108 calls for water quality management programs that include testing, monitoring, documentation, review and corrective actions.",
            "Agenics Affirm™ provides a simple option for testing and reporting, with results delivered online in a user-friendly format.",
            "That gives the facility the information it needs to incorporate testing results into its broader ST108 water quality management program.",
          ],
          image: fileImg(`${ST108}/st108-sterilizer-chamber-3x2.jpg`, 1254, 837, "Open sterilizer with wrapped instrument packs loaded on its racks"),
        },
        { hidden: ["eyebrow", "cta"] },
      ),
      m(
        "faq",
        "default",
        {
          h2: "Frequently asked questions",
          items: [
            {
              q: "What is ST108?",
              a: "ANSI/AAMI ST108 is a U.S. standard focused on the quality of water used to process medical devices. It establishes requirements for water quality management programs that include testing, monitoring, documentation, review and corrective actions.",
            },
            { q: "What is Agenics Affirm™?", a: "Agenics Affirm™ is a mail-in water testing kit designed specifically for ST108 water quality testing." },
            { q: "What’s included?", a: "Affirm test kits include all needed materials." },
            { q: "How do I receive my results?", a: "Results are delivered online in a user-friendly report." },
            { q: "Do I need a contract?", a: "No. Affirm offers straightforward pricing without contracts." },
            {
              q: "Is ST108 only relevant to hospitals?",
              a: "No. Agenics Affirm™ is designed with non-acute and outpatient healthcare in mind, including ambulatory surgery centers, office-based surgical practices and community-based healthcare facilities.",
            },
          ],
        },
        { hidden: ["support"], style: { bg: "silver" }, anchor: "faq" },
      ),
      m(
        "cta",
        "button",
        {
          h2: "Make ST108 Testing Easier",
          line: "Agenics Affirm™ gives outpatient healthcare facilities a simple way to test and monitor sterile processing water quality.",
          assure: "Easy online ordering. All needed materials included. No contracts. Online results.",
          cta: link("Order a test kit", "#order"),
        },
        { hidden: [] },
      ),
    ],
  };
}

/** Worked examples anyone can load from the Pages tab or the new-page gallery. */
export const EXAMPLES: { id: string; name: string; blurb: string; make: () => PageDoc }[] = [
  {
    id: "dental-water",
    name: "Dental Water",
    blurb: "Product line recipe rebuilt from /dental-water: comparison table, product cards, customer proof.",
    make: exampleDentalWater,
  },
  {
    id: "st108",
    name: "ST108 (Affirm)",
    blurb: "Explainer recipe from the 10.26 copy deck: icon grids, navy and cyan bands, anchors, removed elements, photography.",
    make: exampleST108,
  },
];
