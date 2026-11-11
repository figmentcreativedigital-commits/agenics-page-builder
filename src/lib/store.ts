"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { effectiveBg } from "./checks";
import { MODULES } from "./modules";
import { setAt, getAt, uid } from "./path";
import { EXAMPLES, exampleDentalWater, exampleST108, makeModule, pageFromRecipe } from "./recipes";
import type { Zoom } from "./devices";
import { remapColors } from "./ink";
import type { ModuleInstance, ModuleStyle, ModuleType, PageDoc, ShareInfo, TextColor, Viewport } from "./types";
import { upgradeModule, upgradePage } from "./upgrade";

export interface SavedBlock {
  id: string;
  name: string;
  module: ModuleInstance;
  savedAt: number;
}

const CLIPBOARD = "agenics-page-builder:clipboard";

/** Bump when a new worked example ships, so browsers that already have pages get it too. */
const SEED_VERSION = 2;

type Snapshot = { pageId: string; modules: ModuleInstance[] };

interface BuilderState {
  pages: PageDoc[];
  activeId: string | null;
  selectedUid: string | null;
  viewport: Viewport;
  showSpecs: boolean;
  preview: boolean;
  /** The zoom picked in the View menu. "fit" scales the page to the space on screen. */
  zoom: Zoom;
  /** The zoom on screen now, for the View menu button (fit works it out from the space). */
  shownZoom: number;
  /** Side panels folded away or open. Focus mode hides both, and the rail. */
  panels: { left: boolean; right: boolean };
  focusMode: boolean;
  focus: { uid: string; path: string } | null;
  /** The image slot the photo library is choosing for. */
  library: { uid: string; path: string } | null;
  past: Snapshot[];
  future: Snapshot[];
  toast: { msg: string; undo?: boolean } | null;
  seeded: number;
  savedAt: number;
  /** Blocks saved for reuse ("My blocks"), kept in this browser. */
  saved: SavedBlock[];

  // pages
  seedIfEmpty: () => void;
  addExample: (id: string) => void;
  createPage: (name: string, recipeId: string) => string;
  addPage: (page: PageDoc) => string;
  duplicatePage: (id: string) => void;
  deletePage: (id: string) => void;
  setActive: (id: string) => void;
  updatePage: (patch: Partial<Omit<PageDoc, "id" | "modules">>) => void;
  setShare: (pageId: string, share: ShareInfo | undefined) => void;

  // modules
  select: (uid: string | null) => void;
  addModule: (type: ModuleType, index?: number) => void;
  insertModule: (mod: ModuleInstance, index?: number) => void;
  copyBlock: (uid: string) => void;
  pasteBlock: (index?: number) => void;
  saveBlock: (uid: string, name?: string) => void;
  deleteSaved: (id: string) => void;
  insertSaved: (id: string, index?: number) => void;
  removeModule: (uid: string) => void;
  moveModule: (uid: string, dir: -1 | 1) => void;
  reorder: (fromUid: string, toUid: string) => void;
  moveTo: (uid: string, index: number) => void;
  moveItem: (uid: string, group: string, from: number, to: number) => void;
  duplicateModule: (uid: string) => void;
  setVariant: (uid: string, variant: string) => void;
  updateField: (uid: string, path: string, value: unknown) => void;
  addItem: (uid: string, group: string) => void;
  removeItem: (uid: string, group: string, index: number) => void;
  setElement: (uid: string, elementId: string, on: boolean) => void;
  setStyle: (uid: string, patch: ModuleStyle) => void;
  /** Style several blocks in one undo step (a design tip's fix). */
  restyle: (changes: { uid: string; patch: ModuleStyle }[]) => void;
  /** A brand color for one piece of body text; null puts it back to the background's standard color. */
  setTextColor: (uid: string, path: string, color: TextColor | null) => void;
  /** Put several pieces of text back to their standard color, in one undo step. */
  clearTextColors: (uid: string, paths: string[]) => void;
  /** "Keep as is" on a design tip. */
  keepAdvice: (id: string) => void;
  /** Open Focus and zoom for one image, in the settings panel. */
  cropRequest: { uid: string; path: string } | null;
  requestCrop: (target: { uid: string; path: string } | null) => void;
  setAnchor: (uid: string, anchor: string) => void;
  setNote: (uid: string, note: string) => void;
  selectAdjacent: (dir: -1 | 1) => void;
  tidyBackgrounds: () => number;
  restoreVersion: (doc: PageDoc, when: string) => void;

  // ui
  setViewport: (v: Viewport) => void;
  toggleSpecs: () => void;
  setPreview: (on: boolean) => void;
  setZoom: (z: Zoom) => void;
  setShownZoom: (z: number) => void;
  setPanel: (side: "left" | "right", open: boolean) => void;
  setFocusMode: (on: boolean) => void;
  setFocus: (f: { uid: string; path: string } | null) => void;
  setLibrary: (target: { uid: string; path: string } | null) => void;
  showToast: (msg: string, undo?: boolean) => void;
  clearToast: () => void;

  undo: () => void;
  redo: () => void;
}

const HISTORY = 60;

export const activePage = (s: Pick<BuilderState, "pages" | "activeId">) =>
  s.pages.find((p) => p.id === s.activeId) ?? null;

export const useBuilder = create<BuilderState>()(
  persist(
    (set, get) => {
      /**
       * The field last changed and when, so a burst of typing in one field is one undo step.
       * Any other change starts a new step.
       */
      let lastEdit = { key: "", t: 0 };

      /** Apply a change to the active page's modules, recording undo history. */
      const commit = (fn: (mods: ModuleInstance[]) => ModuleInstance[], record = true) => {
        const s = get();
        const page = activePage(s);
        if (!page) return;
        const next = fn(page.modules);
        if (next === page.modules) return;
        if (record) lastEdit = { key: "", t: 0 };
        set({
          pages: s.pages.map((p) => (p.id === page.id ? { ...p, modules: next, updatedAt: Date.now() } : p)),
          savedAt: Date.now(),
          ...(record
            ? { past: [...s.past, { pageId: page.id, modules: page.modules }].slice(-HISTORY), future: [] }
            : {}),
        });
      };

      /**
       * A change to one field (text, photo, link, description, note, anchor). Every one can be
       * undone; changes to the same field without a pause of 1.5 s join one step, so undo takes
       * back a word, not a letter.
       */
      const edit = (key: string, fn: (mods: ModuleInstance[]) => ModuleInstance[]) => {
        const now = Date.now();
        const join = lastEdit.key === key && now - lastEdit.t < 1500;
        commit(fn, !join);
        lastEdit = { key, t: now };
      };

      /** Put a block on the active page: at index, else after the selected block, else above the closing CTA. */
      const insert = (mod: ModuleInstance, index?: number) => {
        commit((mods) => {
          const sel = get().selectedUid;
          let at = index;
          if (at === undefined) {
            const selIdx = mods.findIndex((m) => m.uid === sel);
            if (selIdx >= 0) at = selIdx + 1;
            else if (mods.length && mods[mods.length - 1].type === "cta") at = mods.length - 1;
            else at = mods.length;
          }
          const next = [...mods];
          next.splice(at, 0, mod);
          return next;
        });
        set({ selectedUid: mod.uid });
        if (typeof window !== "undefined") {
          requestAnimationFrame(() =>
            document.getElementById(`mod-${mod.uid}`)?.scrollIntoView({ behavior: "smooth", block: "start" }),
          );
        }
      };

      return {
        pages: [],
        activeId: null,
        selectedUid: null,
        viewport: "desktop",
        showSpecs: false,
        preview: false,
        zoom: "fit",
        shownZoom: 1,
        panels: { left: true, right: true },
        focusMode: false,
        focus: null,
        library: null,
        past: [],
        future: [],
        toast: null,
        seeded: 0,
        savedAt: 0,
        saved: [],

        seedIfEmpty: () => {
          const s = get();
          if (!s.pages.length) {
            const master = pageFromRecipe("master", "Master template");
            set({ pages: [master, exampleDentalWater(), exampleST108()], activeId: master.id, seeded: SEED_VERSION });
            return;
          }
          if (s.seeded < SEED_VERSION) {
            // Existing browsers: add the examples that shipped since their last visit, leave their pages alone
            const add = s.pages.some((p) => p.name.startsWith("Example — ST108")) ? [] : [exampleST108()];
            set({ pages: [...s.pages, ...add], seeded: SEED_VERSION });
          }
          if (!get().activeId || !activePage(get())) set({ activeId: get().pages[0].id });
        },

        addExample: (id) => {
          const ex = EXAMPLES.find((e) => e.id === id);
          if (!ex) return;
          const page = ex.make();
          set((s) => ({ pages: [...s.pages, page], activeId: page.id, selectedUid: null, past: [], future: [], preview: false }));
        },

        createPage: (name, recipeId) => {
          const page = pageFromRecipe(recipeId, name);
          set((s) => ({ pages: [...s.pages, page], activeId: page.id, selectedUid: null, past: [], future: [] }));
          return page.id;
        },

        addPage: (incoming) => {
          // Page files can come from an older version of the builder
          const page = upgradePage(incoming);
          set((s) => ({ pages: [...s.pages, page], activeId: page.id, selectedUid: null, past: [], future: [] }));
          return page.id;
        },

        duplicatePage: (id) => {
          const src = get().pages.find((p) => p.id === id);
          if (!src) return;
          const copy: PageDoc = {
            ...structuredClone(src),
            id: uid(),
            name: `${src.name} (copy)`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          delete copy.share; // a copy gets its own link when shared
          copy.modules = copy.modules.map((m) => ({ ...m, uid: uid() }));
          set((s) => ({ pages: [...s.pages, copy], activeId: copy.id, selectedUid: null, past: [], future: [] }));
        },

        deletePage: (id) => {
          set((s) => {
            const pages = s.pages.filter((p) => p.id !== id);
            return {
              pages,
              activeId: s.activeId === id ? pages[0]?.id ?? null : s.activeId,
              selectedUid: null,
              past: [],
              future: [],
            };
          });
        },

        setActive: (id) => set({ activeId: id, selectedUid: null, past: [], future: [], preview: false }),

        setShare: (pageId, share) =>
          set((s) => ({
            // Publishing is not an edit, so updatedAt stays as it was
            pages: s.pages.map((p) => {
              if (p.id !== pageId) return p;
              const next = { ...p, share };
              if (!share) delete next.share;
              return next;
            }),
          })),

        updatePage: (patch) =>
          set((s) => ({
            pages: s.pages.map((p) => (p.id === s.activeId ? { ...p, ...patch, updatedAt: Date.now() } : p)),
            savedAt: Date.now(),
          })),

        select: (u) => set({ selectedUid: u }),

        addModule: (type, index) => insert(makeModule(type), index),

        // Pasted and saved blocks can come from an older version of the builder
        insertModule: (mod, index) => insert({ ...upgradeModule(structuredClone(mod)), uid: uid() }, index),

        copyBlock: (u) => {
          const mod = activePage(get())?.modules.find((m) => m.uid === u);
          if (!mod) return;
          try {
            localStorage.setItem(CLIPBOARD, JSON.stringify(mod));
          } catch {
            /* ignore */
          }
          get().showToast(`${MODULES[mod.type].name} copied. Paste it on any page with ⌘V.`);
        },

        pasteBlock: (index) => {
          let mod: ModuleInstance | null = null;
          try {
            mod = JSON.parse(localStorage.getItem(CLIPBOARD) ?? "null");
          } catch {
            mod = null;
          }
          if (!mod || !(mod.type in MODULES)) {
            get().showToast("Nothing to paste yet. Copy a block first.");
            return;
          }
          get().insertModule(mod, index);
          get().showToast(`${MODULES[mod.type].name} pasted`, true);
        },

        saveBlock: (u, name) => {
          const mod = activePage(get())?.modules.find((m) => m.uid === u);
          if (!mod) return;
          const heading = String(mod.data.h1 ?? mod.data.h2 ?? MODULES[mod.type].name).replace(/[[\]]/g, "");
          const block: SavedBlock = { id: uid(), name: (name ?? heading).slice(0, 60), module: structuredClone(mod), savedAt: Date.now() };
          set((s) => ({ saved: [block, ...s.saved].slice(0, 60) }));
          get().showToast(`Saved to My blocks as “${block.name}”`);
        },

        deleteSaved: (id) => set((s) => ({ saved: s.saved.filter((b) => b.id !== id) })),

        insertSaved: (id, index) => {
          const block = get().saved.find((b) => b.id === id);
          if (block) get().insertModule(block.module, index);
        },

        removeModule: (u) => {
          const page = activePage(get());
          const mod = page?.modules.find((m) => m.uid === u);
          commit((mods) => mods.filter((m) => m.uid !== u));
          set((s) => ({ selectedUid: s.selectedUid === u ? null : s.selectedUid }));
          if (mod) get().showToast(`${MODULES[mod.type].code} ${MODULES[mod.type].name} removed`, true);
        },

        moveModule: (u, dir) =>
          commit((mods) => {
            const i = mods.findIndex((m) => m.uid === u);
            const j = i + dir;
            if (i < 0 || j < 0 || j >= mods.length) return mods;
            const next = [...mods];
            [next[i], next[j]] = [next[j], next[i]];
            return next;
          }),

        moveTo: (u, index) =>
          commit((mods) => {
            const from = mods.findIndex((m) => m.uid === u);
            if (from < 0) return mods;
            const to = index > from ? index - 1 : index;
            if (to === from) return mods;
            const next = [...mods];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return next;
          }),

        moveItem: (u, groupKey, from, to) =>
          commit((mods) =>
            mods.map((m) => {
              if (m.uid !== u || from === to) return m;
              const list = [...(((getAt(m.data, groupKey) as unknown[]) ?? []))];
              if (from < 0 || from >= list.length || to < 0 || to >= list.length) return m;
              const [moved] = list.splice(from, 1);
              list.splice(to, 0, moved);
              // Picked text colors travel with their item
              const colors = remapColors(m.colors, groupKey, (i) => {
                if (i === from) return to;
                if (from < to && i > from && i <= to) return i - 1;
                if (from > to && i >= to && i < from) return i + 1;
                return i;
              });
              return { ...m, data: setAt(m.data, groupKey, list), colors };
            }),
          ),

        reorder: (fromUid, toUid) =>
          commit((mods) => {
            const from = mods.findIndex((m) => m.uid === fromUid);
            const to = mods.findIndex((m) => m.uid === toUid);
            if (from < 0 || to < 0 || from === to) return mods;
            const next = [...mods];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return next;
          }),

        duplicateModule: (u) => {
          const newUid = uid();
          commit((mods) => {
            const i = mods.findIndex((m) => m.uid === u);
            if (i < 0) return mods;
            const copy = { ...structuredClone(mods[i]), uid: newUid };
            const next = [...mods];
            next.splice(i + 1, 0, copy);
            return next;
          });
          set({ selectedUid: newUid });
        },

        setVariant: (u, variant) =>
          commit((mods) => mods.map((m) => (m.uid === u ? { ...m, variant } : m))),

        updateField: (u, path, value) =>
          edit(`${u}:${path}`, (mods) => mods.map((m) => (m.uid === u ? { ...m, data: setAt(m.data, path, value) } : m))),

        addItem: (u, groupKey) =>
          commit((mods) =>
            mods.map((m) => {
              if (m.uid !== u) return m;
              const group = MODULES[m.type].groups.find((g) => g.key === groupKey);
              const list = (getAt(m.data, groupKey) as unknown[]) ?? [];
              if (!group || list.length >= group.max) return m;
              return { ...m, data: setAt(m.data, groupKey, [...list, group.make()]) };
            }),
          ),

        removeItem: (u, groupKey, index) =>
          commit((mods) =>
            mods.map((m) => {
              if (m.uid !== u) return m;
              const group = MODULES[m.type].groups.find((g) => g.key === groupKey);
              const list = (getAt(m.data, groupKey) as unknown[]) ?? [];
              if (!group || list.length <= group.min) return m;
              const colors = remapColors(m.colors, groupKey, (i) => (i === index ? -1 : i > index ? i - 1 : i));
              return { ...m, data: setAt(m.data, groupKey, list.filter((_, i) => i !== index)), colors };
            }),
          ),

        setElement: (u, elementId, on) => {
          const page = activePage(get());
          const mod = page?.modules.find((m) => m.uid === u);
          if (!mod) return;
          const spec = MODULES[mod.type].elements.find((e) => e.id === elementId);
          if (!spec) return;
          commit((mods) =>
            mods.map((m) => {
              if (m.uid !== u) return m;
              const hidden = new Set(m.hidden ?? []);
              if (on) hidden.delete(elementId);
              else hidden.add(elementId);
              return { ...m, hidden: [...hidden] };
            }),
          );
          if (!on) get().showToast(`${spec.label} hidden. Bring it back from Show / hide.`, true);
        },

        setStyle: (u, patch) =>
          commit((mods) => mods.map((m) => (m.uid === u ? { ...m, style: { ...m.style, ...patch } } : m))),

        restyle: (changes) =>
          commit((mods) =>
            mods.map((m) => {
              const patch = changes.filter((c) => c.uid === m.uid).reduce<ModuleStyle>((a, c) => ({ ...a, ...c.patch }), {});
              return Object.keys(patch).length ? { ...m, style: { ...m.style, ...patch } } : m;
            }),
          ),

        setTextColor: (u, path, color) =>
          commit((mods) =>
            mods.map((m) => {
              if (m.uid !== u || (m.colors?.[path] ?? null) === color) return m;
              const colors = { ...(m.colors ?? {}) };
              if (color) colors[path] = color;
              else delete colors[path];
              return { ...m, colors: Object.keys(colors).length ? colors : undefined };
            }),
          ),

        clearTextColors: (u, paths) =>
          commit((mods) =>
            mods.map((m) => {
              if (m.uid !== u || !m.colors) return m;
              const colors = Object.fromEntries(Object.entries(m.colors).filter(([p]) => !paths.includes(p)));
              return { ...m, colors: Object.keys(colors).length ? colors : undefined };
            }),
          ),

        keepAdvice: (id) =>
          set((s) => ({
            pages: s.pages.map((p) => (p.id === s.activeId ? { ...p, keep: [...new Set([...(p.keep ?? []), id])], updatedAt: Date.now() } : p)),
            savedAt: Date.now(),
          })),

        cropRequest: null,
        requestCrop: (target) => set({ cropRequest: target }),

        setAnchor: (u, anchor) =>
          edit(`${u}:#anchor`, (mods) => mods.map((m) => (m.uid === u ? { ...m, anchor: anchor || undefined } : m))),

        setNote: (u, note) =>
          edit(`${u}:#note`, (mods) => mods.map((m) => (m.uid === u ? { ...m, note: note || undefined } : m))),

        restoreVersion: (saved, when) => {
          const page = activePage(get());
          if (!page || page.id !== saved.id) return;
          const doc = upgradePage(saved);
          commit(() => structuredClone(doc.modules));
          set((s) => ({
            pages: s.pages.map((p) =>
              p.id === page.id
                ? { ...p, name: doc.name, slug: doc.slug, seoTitle: doc.seoTitle, metaDescription: doc.metaDescription, updatedAt: Date.now() }
                : p,
            ),
            selectedUid: null,
          }));
          get().showToast(`Restored the version from ${when}`, true);
        },

        tidyBackgrounds: () => {
          // Give neighbouring sections different backgrounds, using only the colors each block allows
          let changed = 0;
          commit((mods) => {
            const out = mods.map((m) => ({ ...m }));
            for (let i = 1; i < out.length; i++) {
              const prev = effectiveBg(out[i - 1]);
              const cur = effectiveBg(out[i]);
              const next = out[i + 1] ? effectiveBg(out[i + 1]) : null;
              const allowed = MODULES[out[i].type].backgrounds;
              const clash = cur === prev && (cur !== "white" || (out[i - 1].type !== "hero" && allowed.includes("silver")));
              if (!allowed.length || !clash) continue;
              const pick = (["white", "silver", "cyan"] as const).find((b) => allowed.includes(b) && b !== prev && b !== next) ??
                allowed.find((b) => b !== prev);
              if (pick && pick !== cur) {
                out[i] = { ...out[i], style: { ...out[i].style, bg: pick } };
                changed++;
              }
            }
            return changed ? out : mods;
          });
          get().showToast(changed ? `Changed ${changed} background${changed > 1 ? "s" : ""} so sections stand apart` : "Backgrounds already alternate", !!changed);
          return changed;
        },

        selectAdjacent: (dir) => {
          const s = get();
          const page = activePage(s);
          if (!page?.modules.length) return;
          const i = page.modules.findIndex((m) => m.uid === s.selectedUid);
          const j = i < 0 ? (dir > 0 ? 0 : page.modules.length - 1) : Math.min(page.modules.length - 1, Math.max(0, i + dir));
          const next = page.modules[j];
          set({ selectedUid: next.uid });
          requestAnimationFrame(() =>
            document.getElementById(`mod-${next.uid}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
          );
        },

        setViewport: (v) => set({ viewport: v }),
        toggleSpecs: () => set((s) => ({ showSpecs: !s.showSpecs })),
        setPreview: (on) => set({ preview: on, selectedUid: on ? null : get().selectedUid }),
        setZoom: (z) => set({ zoom: z }),
        setShownZoom: (z) => (get().shownZoom === z ? undefined : set({ shownZoom: z })),
        // Opening a panel by hand ends focus mode
        setPanel: (side, open) => set((s) => ({ panels: { ...s.panels, [side]: open }, focusMode: open ? false : s.focusMode })),
        setFocusMode: (on) => set({ focusMode: on }),
        setFocus: (f) => set({ focus: f }),
        setLibrary: (target) => set({ library: target }),
        showToast: (msg, undo) => set({ toast: { msg, undo } }),
        clearToast: () => set({ toast: null }),

        undo: () => {
          const s = get();
          const page = activePage(s);
          if (!page) return;
          // Skip steps that changed nothing in the end (text typed, then taken back inside the field)
          const same = JSON.stringify(page.modules);
          let i = s.past.length - 1;
          while (i >= 0 && s.past[i].pageId === page.id && JSON.stringify(s.past[i].modules) === same) i--;
          const snap = s.past[i];
          if (!snap || snap.pageId !== page.id) return;
          lastEdit = { key: "", t: 0 };
          set({
            pages: s.pages.map((p) => (p.id === page.id ? { ...p, modules: snap.modules, updatedAt: Date.now() } : p)),
            past: s.past.slice(0, i),
            future: [...s.future, { pageId: page.id, modules: page.modules }],
            toast: null,
          });
        },

        redo: () => {
          const s = get();
          const snap = s.future[s.future.length - 1];
          const page = activePage(s);
          if (!snap || !page || snap.pageId !== page.id) return;
          lastEdit = { key: "", t: 0 };
          set({
            pages: s.pages.map((p) => (p.id === page.id ? { ...p, modules: snap.modules, updatedAt: Date.now() } : p)),
            future: s.future.slice(0, -1),
            past: [...s.past, { pageId: page.id, modules: page.modules }],
          });
        },
      };
    },
    {
      name: "agenics-page-builder:v1",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({
        pages: s.pages,
        activeId: s.activeId,
        viewport: s.viewport,
        showSpecs: s.showSpecs,
        zoom: s.zoom,
        panels: s.panels,
        focusMode: s.focusMode,
        seeded: s.seeded,
        saved: s.saved,
      }),
      migrate: (persisted, version) => {
        const state = persisted as { pages?: PageDoc[]; seeded?: number };
        // Page data upgrades live in lib/upgrade and run in merge below, for every saved page
        if (version < 2) state.seeded = state.seeded ?? 1;
        return state as unknown as BuilderState;
      },
      // Pages and My blocks saved by an older version open in today's form (see lib/upgrade)
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<BuilderState>;
        return {
          ...current,
          ...p,
          ...(Array.isArray(p.pages) ? { pages: p.pages.map(upgradePage) } : {}),
          ...(Array.isArray(p.saved) ? { saved: p.saved.map((b) => ({ ...b, module: upgradeModule(b.module) })) } : {}),
          // View settings: anything unexpected falls back to the defaults
          zoom: p.zoom === "fit" || (typeof p.zoom === "number" && p.zoom >= 0.2 && p.zoom <= 1) ? p.zoom : current.zoom,
          panels: { left: p.panels?.left !== false, right: p.panels?.right !== false },
          focusMode: p.focusMode === true,
        };
      },
    },
  ),
);
