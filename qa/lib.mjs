// Shared helpers for the QA suites. Each check prints PASS or FAIL in plain words.
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const QA_DIR = path.dirname(fileURLToPath(import.meta.url));
export const OUT = path.join(QA_DIR, "out");
export const FIXTURES = path.join(QA_DIR, "fixtures");
export const BASE = process.env.QA_BASE ?? "http://localhost:3210";
export const STORE_KEY = "agenics-page-builder:v1";
export const TOUR_KEY = "agenics-page-builder:tour";
mkdirSync(OUT, { recursive: true });

const results = [];
const metrics = {};
let suite = "";

export function startSuite(name) {
  suite = name;
  console.log(`\n${name}`);
}

/** Record one check. `detail` says what was seen, in plain words. */
export function check(name, ok, detail = "") {
  results.push({ suite, name, ok: !!ok, detail });
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? `: ${detail}` : ""}`);
  return !!ok;
}

export function metric(key, value) {
  metrics[`${suite}.${key}`] = value;
}

export function report() {
  const failed = results.filter((r) => !r.ok);
  writeFileSync(path.join(OUT, "results.json"), JSON.stringify({ results, metrics }, null, 2));
  console.log(`\n${results.length - failed.length} of ${results.length} checks passed`);
  if (failed.length) {
    console.log("Failed:");
    failed.forEach((f) => console.log(`  ${f.suite} › ${f.name}${f.detail ? `: ${f.detail}` : ""}`));
  }
  return { failed: failed.length, total: results.length, metrics };
}

export async function launch() {
  return chromium.launch();
}

/**
 * A fresh browser context on the builder. The guided tour is marked seen unless the suite is
 * about the tour. `state` preloads browser storage (a saved page from an earlier build).
 */
export async function openBuilder(browser, { width = 1440, height = 900, tour = false, state = null, extra = {} } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, acceptDownloads: true, ...extra });
  const init = [];
  if (!tour) init.push(`localStorage.setItem(${JSON.stringify(TOUR_KEY)}, "seen");`);
  if (state) init.push(`if (!sessionStorage.getItem("qa-seeded")) { localStorage.setItem(${JSON.stringify(STORE_KEY)}, ${JSON.stringify(JSON.stringify(state))}); sessionStorage.setItem("qa-seeded", "1"); }`);
  if (init.length) await ctx.addInitScript(init.join("\n"));
  const page = await ctx.newPage();
  const errors = watchErrors(page);
  await page.goto(BASE + "/");
  await page.waitForSelector(".pb-top");
  await page.waitForTimeout(400);
  return { ctx, page, errors };
}

/** Collect console errors and uncaught exceptions on a page. */
export function watchErrors(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`);
  });
  return errors;
}

export async function storeState(page) {
  return page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? "null")?.state ?? null, STORE_KEY);
}

export async function activeDoc(page) {
  const st = await storeState(page);
  return st?.pages.find((p) => p.id === st.activeId) ?? null;
}

export async function openPanel(page, label) {
  const btn = page.locator(".pb-rail button", { hasText: label }).first();
  // The open tab's own button folds its panel away, so only click a tab that isn't open
  if ((await btn.getAttribute("aria-pressed")) === "true") return;
  await btn.click();
  await page.waitForTimeout(150);
}

/** Open a page from the Pages panel by the start of its name. */
export async function openPageNamed(page, startsWith) {
  await openPanel(page, "Pages");
  await page.locator(".pb-pagecard__name", { hasText: startsWith }).first().click();
  await page.waitForTimeout(400);
}

/** Select a block by its position on the canvas (click an empty spot inside it). */
export async function selectBlock(page, index) {
  const frame = page.locator(".pb-frame").nth(index);
  await frame.scrollIntoViewIfNeeded();
  await frame.hover({ position: { x: 30, y: 60 } });
  const bar = frame.locator(":scope > .pb-frame__bar strong");
  if (await bar.isVisible()) await bar.click();
  else await frame.click({ position: { x: 30, y: 60 } });
  await page.waitForTimeout(120);
  await blurAll(page);
  return frame;
}

/** Put the caret at the very end of the focused text field. */
export async function caretToEnd(page) {
  await page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return;
    const r = document.createRange();
    r.selectNodeContents(el);
    r.collapse(false);
    const s = getSelection();
    s.removeAllRanges();
    s.addRange(r);
  });
}

/** Switch the settings panel to Content, Style or Show / hide. */
export async function settingsTab(page, label) {
  await page.locator(".pb-right .pb-itabs [role=tab]", { hasText: label }).first().click();
  await page.waitForTimeout(100);
}

/** Click somewhere neutral so no text field has focus (keyboard shortcuts then reach the builder). */
export async function blurAll(page) {
  await page.evaluate(() => {
    const el = document.activeElement;
    if (el && el instanceof HTMLElement) el.blur();
  });
  await page.waitForTimeout(80);
}

export const mod = process.platform === "darwin" ? "Meta" : "Control";

export function fixture(name) {
  return JSON.parse(readFileSync(path.join(FIXTURES, name), "utf8"));
}

export function same(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Page content without the parts that are allowed to differ (ids, timestamps). */
export function content(doc) {
  return doc.modules.map((m) => ({ ...m, uid: undefined }));
}

export function pct(values, p) {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)];
}
