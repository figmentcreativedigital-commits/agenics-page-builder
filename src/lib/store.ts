"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { MODULES } from "./modules";
import { setAt, getAt, uid } from "./path";
import { exampleDentalWater, makeModule, pageFromRecipe } from "./recipes";
import type { ModuleInstance, ModuleType, PageDoc, Viewport } from "./types";

type Snapshot = { pageId: string; modules: ModuleInstance[] };

interface BuilderState {
  pages: PageDoc[];
  activeId: string | null;
  selectedUid: string | null;
  viewport: Viewport;
  showSpecs: boolean;
  preview: boolean;
  focus: { uid: string; path: string } | null;
  past: Snapshot[];
  future: Snapshot[];
  toast: { msg: string; undo?: boolean } | null;

  // pages
  seedIfEmpty: () => void;
  createPage: (name: string, recipeId: string) => string;
  addPage: (page: PageDoc) => string;
  duplicatePage: (id: string) => void;
  deletePage: (id: string) => void;
  setActive: (id: string) => void;
  updatePage: (patch: Partial<Omit<PageDoc, "id" | "modules">>) => void;

  // modules
  select: (uid: string | null) => void;
  addModule: (type: ModuleType, index?: number) => void;
  removeModule: (uid: string) => void;
  moveModule: (uid: string, dir: -1 | 1) => void;
  reorder: (fromUid: string, toUid: string) => void;
  duplicateModule: (uid: string) => void;
  setVariant: (uid: string, variant: string) => void;
  updateField: (uid: string, path: string, value: unknown) => void;
  addItem: (uid: string, group: string) => void;
  removeItem: (uid: string, group: string, index: number) => void;

  // ui
  setViewport: (v: Viewport) => void;
  toggleSpecs: () => void;
  setPreview: (on: boolean) => void;
  setFocus: (f: { uid: string; path: string } | null) => void;
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
      /** Apply a change to the active page's modules, recording undo history. */
      const commit = (fn: (mods: ModuleInstance[]) => ModuleInstance[], record = true) => {
        const s = get();
        const page = activePage(s);
        if (!page) return;
        const next = fn(page.modules);
        if (next === page.modules) return;
        set({
          pages: s.pages.map((p) => (p.id === page.id ? { ...p, modules: next, updatedAt: Date.now() } : p)),
          ...(record
            ? { past: [...s.past, { pageId: page.id, modules: page.modules }].slice(-HISTORY), future: [] }
            : {}),
        });
      };

      return {
        pages: [],
        activeId: null,
        selectedUid: null,
        viewport: "desktop",
        showSpecs: true,
        preview: false,
        focus: null,
        past: [],
        future: [],
        toast: null,

        seedIfEmpty: () => {
          if (get().pages.length) {
            if (!get().activeId || !activePage(get())) set({ activeId: get().pages[0].id });
            return;
          }
          const master = pageFromRecipe("master", "Master template");
          const example = exampleDentalWater();
          set({ pages: [master, example], activeId: master.id });
        },

        createPage: (name, recipeId) => {
          const page = pageFromRecipe(recipeId, name);
          set((s) => ({ pages: [...s.pages, page], activeId: page.id, selectedUid: null, past: [], future: [] }));
          return page.id;
        },

        addPage: (page) => {
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

        updatePage: (patch) =>
          set((s) => ({
            pages: s.pages.map((p) => (p.id === s.activeId ? { ...p, ...patch, updatedAt: Date.now() } : p)),
          })),

        select: (u) => set({ selectedUid: u }),

        addModule: (type, index) => {
          const mod = makeModule(type);
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
          commit(
            (mods) => mods.map((m) => (m.uid === u ? { ...m, data: setAt(m.data, path, value) } : m)),
            false,
          ),

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
              return { ...m, data: setAt(m.data, groupKey, list.filter((_, i) => i !== index)) };
            }),
          ),

        setViewport: (v) => set({ viewport: v }),
        toggleSpecs: () => set((s) => ({ showSpecs: !s.showSpecs })),
        setPreview: (on) => set({ preview: on, selectedUid: on ? null : get().selectedUid }),
        setFocus: (f) => set({ focus: f }),
        showToast: (msg, undo) => set({ toast: { msg, undo } }),
        clearToast: () => set({ toast: null }),

        undo: () => {
          const s = get();
          const snap = s.past[s.past.length - 1];
          const page = activePage(s);
          if (!snap || !page || snap.pageId !== page.id) return;
          set({
            pages: s.pages.map((p) => (p.id === page.id ? { ...p, modules: snap.modules, updatedAt: Date.now() } : p)),
            past: s.past.slice(0, -1),
            future: [...s.future, { pageId: page.id, modules: page.modules }],
            toast: null,
          });
        },

        redo: () => {
          const s = get();
          const snap = s.future[s.future.length - 1];
          const page = activePage(s);
          if (!snap || !page || snap.pageId !== page.id) return;
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
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ pages: s.pages, activeId: s.activeId, viewport: s.viewport, showSpecs: s.showSpecs }),
    },
  ),
);
