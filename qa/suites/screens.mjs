// Screenshots at desktop (1,280), tablet (834) and phone (390) for review: the builder with the
// ST108 example, the same page in preview, and the share preview. Written to qa/out/screens.
import { mkdirSync } from "node:fs";
import path from "node:path";
import { BASE, OUT, check, fixture, openBuilder, openPageNamed, startSuite, watchErrors } from "../lib.mjs";

const SIZES = [
  ["desktop", 1280, 800],
  ["tablet", 834, 1112],
  ["phone", 390, 844],
];

export default async function screens(browser) {
  startSuite("Screenshots");
  const dir = path.join(OUT, "screens");
  mkdirSync(dir, { recursive: true });
  const share = fixture("share.json");
  let shots = 0;
  const problems = [];
  for (const [name, w, h] of SIZES) {
    const { ctx, page, errors } = await openBuilder(browser, { width: w, height: h });
    await openPageNamed(page, "Example — ST108");
    await page.screenshot({ path: path.join(dir, `builder-${name}.png`) });
    // Nothing in the top bar may spill out of it
    const spill = await page.evaluate(() => {
      const bar = document.querySelector(".pb-top")?.getBoundingClientRect();
      return [...document.querySelectorAll(".pb-top > *")].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width && (r.right > window.innerWidth + 1 || r.bottom > (bar?.bottom ?? 0) + 1);
      }).length;
    });
    if (spill) problems.push(`${name}: ${spill} top-bar items spill out`);
    await page.locator("[data-tour=preview]").click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(dir, `preview-${name}.png`) });
    if (errors.length) problems.push(`${name}: ${errors[0]}`);
    await ctx.close();

    const c = await browser.newContext({ viewport: { width: w, height: h } });
    const p = await c.newPage();
    const errs = watchErrors(p);
    await p.goto(`${BASE}/share/${share.id}`);
    await p.waitForTimeout(900);
    await p.screenshot({ path: path.join(dir, `share-${name}.png`) });
    const wide = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    if (wide) problems.push(`${name}: share preview scrolls sideways`);
    if (errs.length) problems.push(`${name} share: ${errs[0]}`);
    await c.close();
    shots += 3;
  }
  check("Screenshots at 1,280, 834 and 390 px, nothing spilling out", !problems.length, problems[0] ?? `${shots} screenshots in qa/out/screens`);
}
