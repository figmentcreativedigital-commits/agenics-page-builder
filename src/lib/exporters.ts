"use client";

import JSZip from "jszip";
import { checkPage, isPlaceholder, measure } from "./checks";
import { blobToDataUrl, dataUrlToBlob, getImageBlob, putImage } from "./images";
import { IMAGE_KINDS, MODULES, moduleFields } from "./modules";
import { expand, getAt, itemNumber, slugify, uid } from "./path";
import type { CtaVal, ImageVal, PageDoc } from "./types";

const FORMAT = "agenics-page-builder@1";

function extFor(type?: string, name?: string) {
  if (type?.includes("png")) return "png";
  if (type?.includes("webp")) return "webp";
  if (type?.includes("svg")) return "svg";
  if (type?.includes("jpeg") || type?.includes("jpg")) return "jpg";
  const fromName = name?.split(".").pop();
  return fromName && fromName.length <= 4 ? fromName.toLowerCase() : "jpg";
}

/** Every image slot in the page with the file name it should be uploaded under. */
export function imageSlots(page: PageDoc) {
  const out: { moduleIndex: number; path: string; label: string; image: ImageVal; file: string; ratio: string }[] = [];
  const slug = page.slug || slugify(page.name) || "page";
  page.modules.forEach((m, mi) => {
    const meta = MODULES[m.type];
    for (const [pattern, spec] of Object.entries(meta.fields)) {
      if (spec.kind !== "image") continue;
      for (const path of expand(pattern, m.data)) {
        const im = getAt(m.data, path) as ImageVal;
        const k = IMAGE_KINDS[spec.image!];
        const idx = itemNumber(path).replace(/\./g, "-");
        const file = `agenics-${slug}-${String(mi + 1).padStart(2, "0")}-${meta.code.toLowerCase()}-${slugify(spec.label)}${
          idx ? `-${idx}` : ""
        }-${k.ratio.replace(":", "x")}.${extFor(im?.type, im?.name)}`;
        out.push({ moduleIndex: mi, path, label: spec.label, image: im, file, ratio: k.ratio });
      }
    }
  });
  return out;
}

export function buildBrief(page: PageDoc): string {
  const lines: string[] = [];
  const slots = imageSlots(page);
  const issues = checkPage(page);
  lines.push(`# ${page.name}`, "");
  lines.push(`- **URL slug:** /${page.slug || "[set a slug]"}`);
  lines.push(`- **SEO title:** ${page.seoTitle || "[missing]"} (${page.seoTitle.length}/60)`);
  lines.push(`- **Meta description:** ${page.metaDescription || "[missing]"} (${page.metaDescription.length}/160)`);
  lines.push(`- **Modules:** ${page.modules.length}`);
  lines.push(`- **Exported:** ${new Date().toLocaleString("en-US")}`, "");
  lines.push(
    "Build each module below as one Squarespace section, in this order. Fonts, colors and button styles come from Site Styles. Upload each image under the file name shown.",
    "",
  );

  page.modules.forEach((m, mi) => {
    const meta = MODULES[m.type];
    const variant = meta.variants.find((v) => v.id === m.variant)?.label;
    lines.push(`## ${mi + 1}. ${meta.code} ${meta.name}${variant ? ` — ${variant}` : ""}`, "");
    lines.push(`_Squarespace: ${meta.squarespace}_`, "");
    for (const { path, spec } of moduleFields(m.type, m.variant, m.data)) {
      {
        const v = getAt(m.data, path);
        const n = itemNumber(path);
        const label = `${spec.label}${n ? ` ${n}` : ""}`;
        if (spec.kind === "text") {
          const s = String(v ?? "");
          if (!s && spec.optional) continue;
          const r = measure(s, spec.limit);
          const flag = isPlaceholder(s) ? " ⚠ placeholder" : r?.over ? ` ⚠ over limit (${r.used}/${r.max})` : "";
          lines.push(`- **${label}:** ${s || "—"}${flag}`);
        } else if (spec.kind === "cta") {
          const c = v as CtaVal;
          if (!c?.label && spec.optional) continue;
          lines.push(`- **${label}:** ${c?.label || "—"} → ${c?.href || "⚠ no link"}`);
        } else if (spec.kind === "href") {
          lines.push(`- **${label}:** ${v || "⚠ no link"}`);
        } else if (spec.kind === "image") {
          const slot = slots.find((s) => s.moduleIndex === mi && s.path === path);
          const im = v as ImageVal;
          lines.push(
            `- **${label} (${slot?.ratio}):** ${im?.id ? `images/${slot?.file}` : "⚠ no image yet"} · alt: ${
              im?.alt ? `"${im.alt}"` : "⚠ missing"
            }`,
          );
        }
      }
    }
    lines.push("");
  });

  if (issues.length) {
    lines.push("## Open items", "");
    issues.forEach((i) => lines.push(`- ${i.level === "error" ? "**Fix:**" : "Check:"} ${i.message}`));
    lines.push("");
  }
  return lines.join("\n");
}

function download(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

const baseName = (page: PageDoc) => `agenics-${page.slug || slugify(page.name) || "page"}`;

export function downloadBrief(page: PageDoc) {
  download(new Blob([buildBrief(page)], { type: "text/markdown" }), `${baseName(page)}-brief.md`);
}

export async function downloadHandoffZip(page: PageDoc) {
  const zip = new JSZip();
  zip.file("brief.md", buildBrief(page));
  const slots = imageSlots(page);
  const folder = zip.folder("images")!;
  for (const s of slots) {
    if (!s.image?.id) continue;
    const blob = await getImageBlob(s.image.id);
    if (blob) folder.file(s.file, blob);
  }
  zip.file("page.json", JSON.stringify({ format: FORMAT, page }, null, 2));
  const out = await zip.generateAsync({ type: "blob" });
  download(out, `${baseName(page)}-handoff.zip`);
}

export async function downloadPageJson(page: PageDoc) {
  const images: Record<string, string> = {};
  for (const s of imageSlots(page)) {
    if (!s.image?.id || images[s.image.id]) continue;
    const blob = await getImageBlob(s.image.id);
    if (blob) images[s.image.id] = await blobToDataUrl(blob);
  }
  const json = JSON.stringify({ format: FORMAT, page, images }, null, 2);
  download(new Blob([json], { type: "application/json" }), `${baseName(page)}.page.json`);
}

/** Import a .page.json file. Returns a fresh page (new ids) with its images restored. */
export async function importPageJson(file: File): Promise<PageDoc> {
  const parsed = JSON.parse(await file.text());
  if (parsed?.format !== FORMAT || !parsed.page?.modules) throw new Error("This file is not an Agenics page export.");
  const images: Record<string, string> = parsed.images ?? {};
  for (const [id, dataUrl] of Object.entries(images)) {
    await putImage(id, await dataUrlToBlob(dataUrl));
  }
  const page = parsed.page as PageDoc;
  return {
    ...page,
    id: uid(),
    name: `${page.name} (imported)`,
    modules: page.modules.map((m) => ({ ...m, uid: uid() })),
    updatedAt: Date.now(),
  };
}
