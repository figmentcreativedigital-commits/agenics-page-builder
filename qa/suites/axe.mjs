// Accessibility: axe on the builder's panels, menus and dialogs, the share preview and the spec
// sheet. Known issues in views a phase hasn't touched are listed in qa/baseline/axe.json; a
// view passes when it has no violations beyond that list. Record a new list with QA_RECORD=1.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { BASE, QA_DIR, check, fixture, metric, openBuilder, openPageNamed, openPanel, selectBlock, settingsTab, startSuite } from "../lib.mjs";

const require = createRequire(import.meta.url);
const AXE = require.resolve("axe-core/axe.min.js");
const KNOWN = path.join(QA_DIR, "baseline", "axe.json");
const RECORD = process.env.QA_RECORD === "1";
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function scan(page, { exclude = [] } = {}) {
  await page.addScriptTag({ path: AXE });
  return page.evaluate(
    async ({ exclude, tags }) => {
      const r = await window.axe.run({ exclude: exclude.map((s) => [s]) }, { runOnly: { type: "tag", values: tags }, resultTypes: ["violations"] });
      return r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help, target: v.nodes[0]?.target?.join(" ") }));
    },
    { exclude, tags: TAGS },
  );
}

export default async function axeSuite(browser) {
  startSuite("Accessibility (axe)");
  const known = existsSync(KNOWN) && !RECORD ? JSON.parse(readFileSync(KNOWN, "utf8")) : {};
  const found = {};
  const report = (name, v) => {
    found[name] = v.map((x) => x.id).sort();
    const list = v.map((x) => `${x.id} (${x.nodes}) at ${x.target}`).join("; ");
    if (RECORD) return check(`${name}: recorded`, true, list || "none");
    const extra = v.filter((x) => !(known[name] ?? []).includes(x.id));
    check(`${name}: no new axe violations`, !extra.length, extra.length ? extra.map((x) => `${x.id} (${x.nodes}) at ${x.target}`).join("; ") : v.length ? `known from the last release: ${list}` : "none");
  };
  const { ctx, page } = await openBuilder(browser);
  // The page being built is the client's content; the builder around it is what these views test
  const tool = { exclude: [".pb-stage"] };

  const views = [
    ["Builder, Add panel", async () => openPanel(page, "Add"), tool],
    ["Layers panel", async () => openPanel(page, "Layers"), tool],
    ["Pages panel", async () => openPanel(page, "Pages"), tool],
    ["Review panel", async () => openPageNamed(page, "Example — ST108").then(() => openPanel(page, "Review")), tool],
    ["History panel", async () => openPanel(page, "History"), tool],
    ["Settings: Content", async () => selectBlock(page, 0).then(() => settingsTab(page, "Content")), tool],
    ["Settings: Style", async () => settingsTab(page, "Style"), tool],
    ["Settings: Show / hide", async () => settingsTab(page, "Show / hide"), tool],
    ["Export menu", async () => page.locator(".pb-menu button", { hasText: "Export" }).first().click(), tool],
    ["Help menu", async () => page.keyboard.press("Escape").then(() => page.locator("[data-tour=help] > button").click()), tool],
    ["Keyboard shortcuts", async () => page.locator("[data-tour=help] > button").click().then(() => page.keyboard.press("?")), tool],
    ["Share dialog", async () => page.keyboard.press("Escape").then(() => page.locator("[data-tour=share]").click()), tool],
    ["Photo library", async () => page.keyboard.press("Escape").then(() => selectBlock(page, 0)).then(() => settingsTab(page, "Content")).then(() => page.locator(".pb-right").getByRole("button", { name: "Library" }).first().click()), tool],
    ["New page dialog", async () => page.keyboard.press("Escape").then(() => openPanel(page, "Pages")).then(() => page.getByRole("button", { name: /New page/ }).first().click()), tool],
    ["Page being built (editing)", async () => page.keyboard.press("Escape"), { exclude: [".pb-top", ".pb-rail", ".pb-left", ".pb-right"] }],
  ];
  for (const [name, open, opts] of views) {
    await open();
    await page.waitForTimeout(250);
    const v = await scan(page, opts);
    report(name, v);
  }
  await ctx.close();

  // Viewers and the spec sheet
  const share = existsSync(path.join(QA_DIR, "fixtures", "share.json")) ? fixture("share.json") : null;
  for (const [name, url] of [
    ["Share preview", share ? `/share/${share.id}` : null],
    ["Spec sheet", "/specs"],
  ]) {
    if (!url) continue;
    const c = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const p = await c.newPage();
    await p.goto(BASE + url);
    await p.waitForTimeout(800);
    const v = await scan(p, name === "Share preview" ? { exclude: [".sv-stage"] } : {});
    report(name, v);
    await c.close();
  }
  metric("views_with_known_issues", Object.values(found).filter((v) => v.length).length);
  if (RECORD) writeFileSync(KNOWN, JSON.stringify(found, null, 2));
}
