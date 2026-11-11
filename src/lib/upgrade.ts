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

/** Today's form of a saved page. The same object when nothing needed to change. */
export function upgradePage(p: PageDoc): PageDoc {
  if (!Array.isArray(p?.modules)) return p;
  const modules = p.modules.map(upgradeModule);
  return modules.some((m, i) => m !== p.modules[i]) ? { ...p, modules } : p;
}
