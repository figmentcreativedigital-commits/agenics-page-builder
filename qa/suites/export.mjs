// Export parity: the brief, zip and page file match the recorded baseline except for intended
// changes. Record a new baseline with QA_RECORD=1 when a change to the exports is intended.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import JSZip from "jszip";
import { QA_DIR, activeDoc, check, content, openBuilder, openPageNamed, startSuite } from "../lib.mjs";

const BASELINE = path.join(QA_DIR, "baseline");
const RECORD = process.env.QA_RECORD === "1";

/** Lines that change on every export (the time it was made). */
const normal = (brief) => brief.replace(/^- \*\*Exported:\*\* .*$/m, "- **Exported:** (time)");

function diffLines(a, b) {
  const A = a.split("\n");
  const B = b.split("\n");
  const out = [];
  const n = Math.max(A.length, B.length);
  for (let i = 0; i < n && out.length < 6; i++) if (A[i] !== B[i]) out.push(`line ${i + 1}: “${(A[i] ?? "").slice(0, 70)}” → “${(B[i] ?? "").slice(0, 70)}”`);
  return out;
}

export default async function exportSuite(browser) {
  startSuite(RECORD ? "Exports (recording the baseline)" : "Exports match the baseline");
  mkdirSync(BASELINE, { recursive: true });
  const { ctx, page } = await openBuilder(browser);
  const download = async (label) => {
    await page.locator(".pb-menu button", { hasText: "Export" }).first().click();
    const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("menuitem", { name: new RegExp(label) }).click()]);
    return readFileSync(await dl.path());
  };

  for (const [name, slug] of [
    ["Example — Dental Water", "dental-water"],
    ["Example — ST108", "st108"],
  ]) {
    await openPageNamed(page, name);
    const brief = normal((await download("Content brief")).toString("utf8"));
    const zip = await JSZip.loadAsync(await download("Handoff package"));
    const files = Object.keys(zip.files).sort();
    const zipBrief = normal(await zip.file("brief.md").async("string"));
    const zipPage = JSON.parse(await zip.file("page.json").async("string"));
    const pageFile = JSON.parse((await download("Page file")).toString("utf8"));
    const doc = await activeDoc(page);
    const record = { files, page: content(pageFile.page) };

    const briefPath = path.join(BASELINE, `brief-${slug}.md`);
    const recPath = path.join(BASELINE, `export-${slug}.json`);
    if (RECORD || !existsSync(briefPath)) {
      writeFileSync(briefPath, brief);
      writeFileSync(recPath, JSON.stringify(record, null, 2));
      check(`${name}: baseline recorded`, true, `${brief.length} characters, ${files.length} files in the zip`);
      continue;
    }
    const was = readFileSync(briefPath, "utf8");
    const base = JSON.parse(readFileSync(recPath, "utf8"));
    const d = diffLines(was, brief);
    check(`${name}: the brief matches the baseline`, !d.length, d.join("; ") || `${brief.length} characters`);
    check(`${name}: the zip has the same files`, JSON.stringify(files) === JSON.stringify(base.files), `${files.length} files`);
    check(`${name}: the zip's brief and page match the downloads`, zipBrief === brief && JSON.stringify(content(zipPage.page)) === JSON.stringify(content(pageFile.page)));
    check(`${name}: the page file matches the baseline and the page`, JSON.stringify(record.page) === JSON.stringify(base.page) && JSON.stringify(content(doc)) === JSON.stringify(record.page));
  }
  await ctx.close();
}
