"use client";

import { useState } from "react";
import { LIBRARY, MODULES } from "@/lib/modules";
import type { ModuleType } from "@/lib/types";
import { ModuleThumb } from "./thumbs";

export const DRAG_TYPE = "application/x-agenics-block";

/** Block tiles grouped by category. Click to add, or drag onto the page. */
export function BlockPicker({ onPick, compact = false, search = true }: { onPick: (t: ModuleType) => void; compact?: boolean; search?: boolean }) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const groups = LIBRARY.map((g) => ({
    ...g,
    types: g.types.filter((t) => {
      if (!needle) return true;
      const m = MODULES[t];
      return `${m.name} ${m.summary} ${g.category}`.toLowerCase().includes(needle);
    }),
  })).filter((g) => g.types.length);

  return (
    <div className={`pb-blocks ${compact ? "pb-blocks--compact" : ""}`}>
      {search ? (
        <input className="pb-search" type="search" placeholder="Search blocks" aria-label="Search blocks" value={q} onChange={(e) => setQ(e.target.value)} />
      ) : null}
      {groups.map((g) => (
        <div key={g.category} className="pb-blocks__group">
          <p className="pb-blocks__cat">{g.category}</p>
          <div className="pb-blocks__grid">
            {g.types.map((t) => {
              const m = MODULES[t];
              return (
                <button
                  key={t}
                  type="button"
                  className="pb-tile"
                  title={m.summary}
                  draggable={!compact}
                  onDragStart={(e) => {
                    e.dataTransfer.setData(DRAG_TYPE, t);
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  onClick={() => onPick(t)}
                >
                  <ModuleThumb type={t} variant={m.variants[0]?.id} />
                  <span>{m.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {!groups.length ? <p className="pb-hint">No blocks match “{q}”.</p> : null}
    </div>
  );
}
