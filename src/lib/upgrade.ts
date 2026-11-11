import { MODULES } from "./modules";
import type { ModuleInstance, PageDoc } from "./types";

/*
  Saved-page upgrades.

  A page can come back from many places: this browser, a page file (.json), a share link,
  version history, My blocks, the block clipboard. Whenever the shape of page data changes,
  add an upgrade below so every one of them opens in today's form with nothing lost.

  Rules for an upgrade:
  - Return the module unchanged (the same object) when it doesn't apply.
  - Be safe to run again on a module it already upgraded.
  - Never delete content. Hide it instead, so Show brings it back.
*/

type ModuleUpgrade = {
  /** When the data changed, for the record. */
  since: string;
  run: (m: ModuleInstance) => ModuleInstance;
};

const MODULE_UPGRADES: ModuleUpgrade[] = [
  {
    // Optional slots added after the first release (the hero's supporting paragraph, the
    // call to action's reassurance line) start switched off on pages made before them.
    since: "Oct 2026",
    run: (m) => {
      const meta = MODULES[m.type];
      if (!meta) return m;
      const missing = (meta.hiddenByDefault ?? []).filter((k) => !(k in m.data));
      if (!missing.length) return m;
      const defaults = meta.defaults();
      const data = { ...m.data };
      missing.forEach((k) => (data[k] = defaults[k]));
      return { ...m, data, hidden: [...new Set([...(m.hidden ?? []), ...missing])] };
    },
  },
];

export function upgradeModule(m: ModuleInstance): ModuleInstance {
  return MODULE_UPGRADES.reduce((mod, u) => u.run(mod), m);
}

type PageUpgrade = { since: string; run: (p: PageDoc) => PageDoc };

const PAGE_UPGRADES: PageUpgrade[] = [
  {
    // The Dental Water example shipped with four white blocks in a row. Copies whose
    // backgrounds were never touched take the alternating backgrounds the example has now
    // (Silver 18% on the second and fourth). A copy someone restyled is left alone.
    since: "Nov 2026",
    run: (p) => {
      if (p.recipe !== "product-line" || !p.name.startsWith("Example — Dental Water")) return p;
      const run = p.modules.slice(1, 5);
      if (run.map((m) => m.type).join() !== "trust,intro,compare,products" || run.some((m) => m.style?.bg)) return p;
      const silver = new Set([run[1].uid, run[3].uid]);
      return { ...p, modules: p.modules.map((m) => (silver.has(m.uid) ? { ...m, style: { ...m.style, bg: "silver" as const } } : m)) };
    },
  },
];

/** Today's form of a saved page. The same object when nothing needed to change. */
export function upgradePage(p: PageDoc): PageDoc {
  if (!Array.isArray(p?.modules)) return p;
  const modules = p.modules.map(upgradeModule);
  const page = modules.some((m, i) => m !== p.modules[i]) ? { ...p, modules } : p;
  return PAGE_UPGRADES.reduce((doc, u) => u.run(doc), page);
}
