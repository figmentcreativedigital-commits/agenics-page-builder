// Old pages: pages saved, exported and shared by an earlier build open with nothing lost.
// Fixtures come from qa/capture-fixtures.mjs, run against the build released before.
import { cpSync } from "node:fs";
import path from "node:path";
import { BASE, FIXTURES, activeDoc, check, content, fixture, openBuilder, openPageNamed, same, startSuite, storeState, watchErrors } from "../lib.mjs";
import { MODULES_HIDDEN_BY_DEFAULT } from "../fixtures/hidden-by-default.mjs";

/**
 * November 2026, on purpose: an untouched copy of the Dental Water example takes Silver 18% on
 * its second and fourth light blocks, so it opens with no design tip. This puts those two
 * backgrounds back for comparison, and says whether they were changed.
 */
function withoutExampleBackgrounds(page) {
  if (!page?.name?.startsWith("Example — Dental Water")) return { modules: page?.modules, changed: null };
  let changed = 0;
  const modules = page.modules.map((m, i) => {
    if ((i !== 2 && i !== 4) || m.style?.bg !== "silver") return m;
    changed++;
    const style = { ...m.style };
    delete style.bg;
    const out = { ...m, style };
    if (!Object.keys(style).length) delete out.style;
    return out;
  });
  return { modules, changed };
}

/** The optional hero and CTA lines are back, hidden, and nothing else differs. */
function upgradedOnPurpose(oldPage, newPageAsSaved) {
  const problems = [];
  const newPage = { ...newPageAsSaved, modules: withoutExampleBackgrounds(newPageAsSaved).modules };
  oldPage.modules.forEach((m, i) => {
    const n = newPage.modules[i];
    if (!n) return problems.push(`block ${i + 1} missing`);
    const keys = MODULES_HIDDEN_BY_DEFAULT[m.type] ?? [];
    for (const k of keys) {
      if (!(k in n.data)) problems.push(`${m.type} has no ${k}`);
      if (!(n.hidden ?? []).includes(k)) problems.push(`${m.type} ${k} not hidden`);
    }
    const strip = (x) => {
      const data = { ...x.data };
      keys.forEach((k) => delete data[k]);
      return { ...x, uid: undefined, data, hidden: (x.hidden ?? []).filter((h) => !keys.includes(h)) };
    };
    if (!same(strip(m), strip(n))) problems.push(`${m.type} content changed`);
  });
  return problems;
}

export default async function upgradeSuite(browser, { appDir }) {
  startSuite("Old pages");

  // ---- Browser storage from the last release
  const stored = fixture("browser-storage.json");
  {
    const { ctx, page, errors } = await openBuilder(browser, { state: stored });
    const st = await storeState(page);
    const before = stored.state.pages;
    const after = st.pages.filter((p) => before.some((b) => b.id === p.id));
    const unchanged = before.every((b) => same(b.modules, withoutExampleBackgrounds(after.find((a) => a.id === b.id)).modules));
    const example = withoutExampleBackgrounds(after.find((a) => a.name.startsWith("Example — Dental Water")));
    check("Pages saved in this browser by the last release open unchanged", after.length === before.length && unchanged && !errors.length, errors[0] ?? `${after.length} of ${before.length} pages, content ${unchanged ? "identical" : "changed"}`);
    if (example.changed !== null) {
      await openPageNamed(page, "Example — Dental Water");
      const tips = await page.locator(".pb-tipchip").count();
      check("…the Dental Water example takes alternating backgrounds on purpose, and shows no design tip", example.changed === 2 && tips === 0, `${example.changed} backgrounds changed, ${tips} tips`);
    }
    await openPageNamed(page, "QA saved page");
    const doc = await activeDoc(page);
    check("…and the edited one shows its edits", (await page.locator(".pb-frame").count()) === doc.modules.length && doc.modules[2].note === "Saved before the release", `${doc.modules.length} blocks, note “${doc.modules[2].note}”`);
    await ctx.close();
  }

  // ---- Browser storage from before the October data change
  const old = fixture("browser-storage-v1.json");
  {
    const { ctx, page, errors } = await openBuilder(browser, { state: old });
    const st = await storeState(page);
    const problems = [];
    old.state.pages.forEach((p) => {
      const now = st.pages.find((x) => x.id === p.id);
      if (!now) problems.push(`${p.name} missing`);
      else problems.push(...upgradedOnPurpose(p, now).map((e) => `${p.name}: ${e}`));
    });
    check("Pages saved before the October change open upgraded on purpose", !problems.length && !errors.length, problems[0] ?? errors[0] ?? "the new optional lines are there, hidden; nothing else changed");
    await ctx.close();
  }

  // ---- Page files
  for (const [name, file, expectUpgrade] of [
    ["A page file exported by the last release", "page-file.page.json", false],
    ["A page file from before the October change", "page-file-v1.page.json", true],
  ]) {
    const { ctx, page, errors } = await openBuilder(browser);
    await page.locator(".pb-menu button", { hasText: "Export" }).first().click();
    const [chooser] = await Promise.all([page.waitForEvent("filechooser"), page.getByRole("menuitem", { name: /Open a page file/ }).click()]);
    await chooser.setFiles(path.join(FIXTURES, file));
    await page.waitForTimeout(800);
    const doc = await activeDoc(page);
    const src = fixture(file).page;
    const problems = expectUpgrade ? upgradedOnPurpose(src, doc) : same(content(doc), content(src)) ? [] : ["content changed"];
    const hero = page.locator(".pb-frame").first().locator("img").first();
    await hero.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const loaded = await hero.evaluate((img) => img.complete && img.naturalWidth > 0).catch(() => false);
    check(`${name} opens with nothing lost`, doc.name.endsWith("(imported)") && !problems.length && !errors.length, problems[0] ?? errors[0] ?? `${doc.modules.length} blocks`);
    check(`…and its uploaded photo comes with it`, loaded);
    await ctx.close();
  }

  // ---- A share link made by the last release
  cpSync(path.join(FIXTURES, "share-data"), path.join(appDir, ".share-data"), { recursive: true });
  const share = fixture("share.json");
  const shareDoc = fixture(`share-data/shares/${share.id}.json`);
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errors = watchErrors(page);
    const res = await page.goto(`${BASE}/share/${share.id}`);
    await page.waitForSelector(".sv-stage h1", { timeout: 15000 }).catch(() => {});
    const h1 = await page.locator(".sv-stage h1").first().innerText().catch(() => "");
    const sections = await page.locator(".sv-stage section").count();
    const imgs = await page.locator(".sv-stage img").evaluateAll((list) => list.filter((i) => i.loading !== "lazy").map((i) => i.complete && i.naturalWidth > 0));
    const want = shareDoc.page.modules.filter((m) => m.data).length;
    check("A share link made by the last release still opens", res?.ok() && h1.includes("ST108") && sections >= want - 1 && !errors.length, errors[0] ?? `HTTP ${res?.status()}, “${h1}”, ${sections} sections`);
    check("…with its uploaded photo", imgs.length > 0 && imgs.every(Boolean), `${imgs.filter(Boolean).length} of ${imgs.length} images loaded`);
    await ctx.close();
  }
}
