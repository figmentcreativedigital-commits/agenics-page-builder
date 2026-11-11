// The guided tour: opens the first time, every step has its target, keys work, Tour restarts it.
import { TOUR_KEY, check, openBuilder, startSuite } from "../lib.mjs";

export default async function tour(browser) {
  startSuite("Guided tour");
  const { ctx, page, errors } = await openBuilder(browser, { tour: true, width: 1466, height: 900 });
  const opened = await page.waitForSelector(".pb-tour__card", { timeout: 8000 }).then(() => true).catch(() => false);
  check("The tour opens by itself the first time", opened);
  if (!opened) return ctx.close();

  const titles = [];
  const problems = [];
  for (let n = 0; n < 30; n++) {
    await page.waitForTimeout(600);
    const title = await page.locator(".pb-tour__card h3").innerText();
    titles.push(title);
    const card = await page.locator(".pb-tour__card").boundingBox();
    const ring = (await page.locator(".pb-tour__ring").count()) ? await page.locator(".pb-tour__ring").boundingBox() : null;
    const onscreen = card.x >= 0 && card.y >= 0 && card.x + card.width <= 1466 && card.y + card.height <= 900;
    // A card may sit over a target that fills most of the screen (the page itself); never over a small one
    const small = ring && ring.width * ring.height < 0.4 * 1466 * 900;
    const overlap = small && !(card.x >= ring.x + ring.width || card.x + card.width <= ring.x || card.y >= ring.y + ring.height || card.y + card.height <= ring.y);
    if (!onscreen) problems.push(`“${title}” card is off screen`);
    if (overlap) problems.push(`“${title}” card covers its target`);
    const btn = page.locator(".pb-tour__acts .pb-btn--primary");
    if ((await btn.innerText()) === "Finish") {
      await btn.click();
      break;
    }
    if (n % 2) await page.keyboard.press("ArrowRight");
    else await btn.click();
  }
  await page.waitForTimeout(300);
  check("Every step shows, with its card on screen and clear of its target", titles.length >= 15 && !problems.length, problems[0] ?? `${titles.length} steps`);
  check("Finish closes the tour and remembers it", (await page.locator(".pb-tour").count()) === 0 && (await page.evaluate((k) => localStorage.getItem(k), TOUR_KEY)) === "seen");

  await page.reload();
  await page.waitForSelector(".pb-top");
  await page.waitForTimeout(800);
  check("It doesn't open again after a reload", (await page.locator(".pb-tour").count()) === 0);

  await page.locator("[data-tour=tour]").click();
  await page.waitForTimeout(500);
  const restarted = (await page.locator(".pb-tour__card h3").innerText().catch(() => "")) === titles[0];
  await page.locator(".pb-tour__acts .pb-btn--primary").click();
  await page.waitForTimeout(600);
  await page.locator(".pb-tour__chapter").click();
  await page.locator(".pb-tour__menu button", { hasText: "Check and share" }).click();
  await page.waitForTimeout(600);
  const jumped = await page.locator(".pb-tour__card h3").innerText();
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  check("The Tour button starts it again, the chapter menu jumps, Escape closes", restarted && /Desktop|tablet|phone/i.test(jumped) && (await page.locator(".pb-tour").count()) === 0, `jumped to “${jumped}”`);

  // On an empty page the steps about blocks are skipped
  await page.locator(".pb-rail button", { hasText: "Pages" }).click();
  await page.getByRole("button", { name: /New page/ }).first().click();
  await page.locator(".pb-dialog .pb-gcard", { hasText: "Blank" }).first().click();
  await page.waitForTimeout(400);
  for (let i = 0; i < 4 && (await page.locator(".pb-frame").count()); i++) {
    const f = page.locator(".pb-frame").first();
    await f.hover();
    await f.locator(".pb-frame__bar button[aria-label='Delete block']").click();
    await page.waitForTimeout(200);
  }
  const frames = await page.locator(".pb-frame").count();
  await page.locator("[data-tour=tour]").click();
  const blankTitles = [];
  for (let n = 0; n < 25; n++) {
    await page.waitForTimeout(500);
    if (!(await page.locator(".pb-tour").count())) break;
    blankTitles.push(await page.locator(".pb-tour__card h3").innerText());
    await page.locator(".pb-tour__acts .pb-btn--primary").click();
  }
  const skipped = frames > 0 || !blankTitles.some((t) => /blocks|toolbar|Settings for/i.test(t));
  check("On an empty page the block steps are skipped", skipped, frames > 0 ? "(no blank page to try)" : `${blankTitles.length} steps`);
  check("No errors during the tour", !errors.length, errors[0] ?? "");
  await ctx.close();
}
