// Records pages from a released build, so the upgrade suite can check that later builds open
// them. Run it against the build that is live before a data change:
//
//   (in a checkout of main)  npm run build && npx next start -p 3210
//   (here)                   node qa/capture-fixtures.mjs --app <that checkout>
//
// Writes qa/fixtures: browser storage, a page file and a share link, plus the same pages in the
// shape the builder saved before its October 2026 data change (to exercise lib/upgrade).
import { cpSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { FIXTURES, STORE_KEY, activeDoc, blurAll, caretToEnd, launch, openBuilder, openPageNamed, selectBlock, settingsTab } from "./lib.mjs";
import { MODULES_HIDDEN_BY_DEFAULT } from "./fixtures/hidden-by-default.mjs";

const args = process.argv.slice(2);
const appDir = path.resolve(args[args.indexOf("--app") + 1] ?? ".");

const browser = await launch();
const { ctx, page } = await openBuilder(browser);

// Ordinary edits on the ST108 example: text, a hidden element, a note, an anchor, a background
await openPageNamed(page, "Example — ST108");
await page.locator(".pb-top .pb-pagename").fill("QA saved page");
const para = page.locator(".pb-frame").nth(1).locator("p.agx-ed").first();
await para.click();
await caretToEnd(page);
await page.keyboard.type(" Saved before the release.");
await page.keyboard.press("Escape");
await selectBlock(page, 2);
await settingsTab(page, "Style");
await page.locator(".pb-right textarea").first().fill("Saved before the release");
await page.locator(".pb-right .pb-hash input").fill("saved-before");
await settingsTab(page, "Show / hide");
const on = page.locator(".pb-right [role=switch][aria-checked=true]").first();
if (await on.count()) await on.click();
await settingsTab(page, "Style");
const swatch = page.locator(".pb-right .pb-swatches [role=radio]:not([aria-checked=true])").first();
if (await swatch.count()) await swatch.click();
await blurAll(page);
await page.waitForTimeout(600);

const stored = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), STORE_KEY);
writeFileSync(path.join(FIXTURES, "browser-storage.json"), JSON.stringify(stored, null, 2));

// An uploaded photo goes in the page file and the share link
await selectBlock(page, 0);
await settingsTab(page, "Content");
await page.locator(".pb-right input[type=file]").first().setInputFiles(path.join(FIXTURES, "photo.jpg"));
await page.waitForTimeout(800);
await page.locator(".pb-menu button", { hasText: "Export" }).first().click();
const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("menuitem", { name: /Page file/ }).click()]);
const pageFile = JSON.parse(readFileSync(await dl.path(), "utf8"));
writeFileSync(path.join(FIXTURES, "page-file.page.json"), JSON.stringify(pageFile, null, 2));

await page.locator("[data-tour=share]").click();
await page.getByRole("button", { name: "Create link" }).click();
await page.waitForSelector(".pb-share__link input", { timeout: 15000 });
const url = await page.locator(".pb-share__link input").inputValue();
const shareId = url.split("/share/")[1];
rmSync(path.join(FIXTURES, "share-data"), { recursive: true, force: true });
cpSync(path.join(appDir, ".share-data"), path.join(FIXTURES, "share-data"), { recursive: true });
writeFileSync(path.join(FIXTURES, "share.json"), JSON.stringify({ id: shareId, name: (await activeDoc(page)).name }, null, 2));

// The same pages as the builder saved them before the optional hero and CTA lines existed
const strip = (p) => ({
  ...p,
  modules: p.modules.map((m) => {
    const keys = MODULES_HIDDEN_BY_DEFAULT[m.type] ?? [];
    if (!keys.length) return m;
    const data = { ...m.data };
    keys.forEach((k) => delete data[k]);
    return { ...m, data, hidden: (m.hidden ?? []).filter((h) => !keys.includes(h)) };
  }),
});
writeFileSync(
  path.join(FIXTURES, "browser-storage-v1.json"),
  JSON.stringify({ version: 1, state: { ...stored.state, seeded: undefined, pages: stored.state.pages.map(strip) } }, null, 2),
);
writeFileSync(path.join(FIXTURES, "page-file-v1.page.json"), JSON.stringify({ ...pageFile, page: strip(pageFile.page) }, null, 2));

await ctx.close();
await browser.close();
console.log(`Fixtures written to ${FIXTURES} (share link ${shareId})`);
