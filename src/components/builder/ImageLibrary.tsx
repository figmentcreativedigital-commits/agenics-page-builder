"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { imageSize, listImages, saveImage } from "@/lib/images";
import { IMAGE_KINDS } from "@/lib/modules";
import { getAt } from "@/lib/path";
import { AGENICS_PHOTOS } from "@/lib/photos";
import { activePage, useBuilder } from "@/lib/store";
import type { ImageVal } from "@/lib/types";
import { specFor } from "../page/edit";
import { Icon } from "./ui";

type Upload = { id: string; url: string; blob: Blob };

/** Pick any photo already in this browser, or Agenics photography that ships with the builder. */
export function ImageLibrary() {
  const target = useBuilder((s) => s.library);
  const close = useBuilder((s) => s.setLibrary);
  const page = useBuilder((s) => activePage(s));
  const update = useBuilder((s) => s.updateField);
  const [uploads, setUploads] = useState<Upload[] | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const mod = page?.modules.find((m) => m.uid === target?.uid);
  const current = (mod && target ? getAt(mod.data, target.path) : null) as ImageVal | null;
  const kind = mod && target ? specFor(mod.type, target.path)?.image : undefined;

  useEffect(() => {
    if (!target) return;
    let urls: string[] = [];
    let live = true;
    listImages().then((list) => {
      if (!live) return;
      const items = list.map(({ id, blob }) => ({ id, blob, url: URL.createObjectURL(blob) }));
      urls = items.map((i) => i.url);
      setUploads(items.reverse());
    });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close(null);
    document.addEventListener("keydown", onKey);
    return () => {
      live = false;
      urls.forEach((u) => URL.revokeObjectURL(u));
      document.removeEventListener("keydown", onKey);
      setUploads(null);
    };
  }, [target, close]);

  const used = useMemo(() => {
    // Images used on any page, so the newest work is easy to find
    const ids = new Set<string>();
    const walk = (n: unknown) => {
      if (Array.isArray(n)) n.forEach(walk);
      else if (n && typeof n === "object") {
        const o = n as Record<string, unknown>;
        if (typeof o.id === "string" && "alt" in o) ids.add(o.id);
        Object.values(o).forEach(walk);
      }
    };
    useBuilder.getState().pages.forEach((p) => walk(p.modules));
    return ids;
  }, []);

  if (!target || !mod) return null;
  const k = kind ? IMAGE_KINDS[kind] : null;

  const choose = (val: ImageVal) => {
    update(mod.uid, target.path, { ...val, alt: current?.alt || val.alt });
    close(null);
  };

  return (
    <div className="pb-modal" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && close(null)}>
      <div className="pb-dialog pb-lib-dialog" role="dialog" aria-modal="true" aria-labelledby="lib-title">
        <div className="pb-dialog__head">
          <h2 id="lib-title">Photo library</h2>
          <button type="button" className="pb-mini" aria-label="Close" onClick={() => close(null)}>
            <Icon name="close" />
          </button>
        </div>
        {k ? (
          <p className="pb-dialog__sub">
            This slot is {k.ratio} ({k.w.toLocaleString("en-US")} × {k.h.toLocaleString("en-US")} px). Photos in another shape are cropped; set the focal point
            afterwards in the settings panel.
          </p>
        ) : null}

        <div className="pb-lib-head">
          <p className="pb-blocks__cat">Agenics photography</p>
        </div>
        <div className="pb-lib-grid">
          {AGENICS_PHOTOS.map((p) => (
            <button key={p.src} type="button" className={`pb-lib-item ${current?.src === p.src ? "is-on" : ""}`} onClick={() => choose({ id: null, ...p })}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.src} alt="" />
              <span>{p.label}</span>
            </button>
          ))}
        </div>

        <div className="pb-lib-head">
          <p className="pb-blocks__cat">Your uploads in this browser</p>
          <button type="button" className="pb-btn pb-btn--sm" onClick={() => input.current?.click()}>
            <Icon name="plus" size={14} /> Upload
          </button>
        </div>
        {uploads === null ? (
          <p className="pb-hint">Loading…</p>
        ) : uploads.length ? (
          <div className="pb-lib-grid">
            {uploads.map((u) => (
              <button
                key={u.id}
                type="button"
                className={`pb-lib-item ${current?.id === u.id ? "is-on" : ""}`}
                onClick={async () => {
                  const { w, h } = await imageSize(u.blob);
                  choose({ id: u.id, alt: "", w, h, type: u.blob.type });
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u.url} alt="" />
                <span>{used.has(u.id) ? "On a page" : "Not used yet"}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="pb-hint">Nothing uploaded yet. Upload a photo, or drop one straight onto any image slot.</p>
        )}
        <input
          ref={input}
          type="file"
          accept="image/*"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            const saved = await saveImage(f);
            choose(saved);
          }}
        />
      </div>
    </div>
  );
}
