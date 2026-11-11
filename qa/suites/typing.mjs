// Speed: typing stays fast on a long page (19 sections), the page doesn't jump while typing,
// and adding a section is quick.
import { caretToEnd, check, metric, mod, openBuilder, openPageNamed, openPanel, pct, selectBlock, startSuite } from "../lib.mjs";

export default async function typing(browser) {
  startSuite("Speed on a 19-section page");
  const { ctx, page, errors } = await openBuilder(browser);
  await openPageNamed(page, "Example — ST108");

  // Make the page 19 sections long
  await selectBlock(page, 1);
  while ((await page.locator(".pb-frame").count()) < 19) {
    await page.keyboard.press(`${mod}+d`);
    await page.waitForTimeout(60);
  }
  const count = await page.locator(".pb-frame").count();
  check("The page has 19 sections", count === 19, `${count}`);

  // Typing: time from each key press to the next frame drawn after it
  const para = page.locator(".pb-frame").nth(1).locator("p.agx-ed").first();
  await para.scrollIntoViewIfNeeded();
  await para.click();
  await caretToEnd(page);
  await page.evaluate(() => {
    const w = window;
    w.__lat = [];
    w.__shift = { input: 0, other: 0 };
    document.addEventListener(
      "keydown",
      () => {
        const t0 = performance.now();
        requestAnimationFrame(() => setTimeout(() => w.__lat.push(performance.now() - t0), 0));
      },
      true,
    );
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.hadRecentInput) w.__shift.input += e.value;
        else w.__shift.other += e.value;
      }
    }).observe({ type: "layout-shift" });
  });
  const text = " The quick brown fox jumps over the lazy dog while the sterilizer runs";
  await page.keyboard.type(text, { delay: 70 });
  await page.waitForTimeout(400);
  const { lat, shift } = await page.evaluate(() => ({ lat: window.__lat, shift: window.__shift }));
  const p75 = pct(lat, 75);
  const worst = Math.max(...lat);
  metric("keystrokes", lat.length);
  metric("p75_ms", Math.round(p75 * 10) / 10);
  metric("p50_ms", Math.round(pct(lat, 50) * 10) / 10);
  metric("worst_ms", Math.round(worst * 10) / 10);
  metric("layout_shift_without_input", Math.round(shift.other * 10000) / 10000);
  check("Typing p75 is under 50 ms", lat.length >= text.length - 2 && p75 < 50, `p75 ${p75.toFixed(1)} ms, median ${pct(lat, 50).toFixed(1)} ms, worst ${worst.toFixed(1)} ms over ${lat.length} keys`);
  check("Nothing on the page jumps while typing", shift.other < 0.01, `layout shift ${shift.other.toFixed(4)}`);
  await page.keyboard.press("Escape");

  // Adding a section from the Add panel
  const times = [];
  for (let i = 0; i < 5; i++) {
    // The Add panel folds away after each add, to give the page room
    await openPanel(page, "Add");
    const ms = await page.evaluate(
      () =>
        new Promise((resolve) => {
          const n0 = document.querySelectorAll(".pb-frame").length;
          const tile = document.querySelectorAll(".pb-blocks .pb-tile")[3];
          const t0 = performance.now();
          tile.click();
          const tick = () => {
            if (document.querySelectorAll(".pb-frame").length > n0) requestAnimationFrame(() => resolve(performance.now() - t0));
            else requestAnimationFrame(tick);
          };
          tick();
        }),
    );
    times.push(ms);
    await page.waitForTimeout(300);
  }
  const add = pct(times, 50);
  metric("add_section_ms", Math.round(add));
  check("Adding a section takes about 120 ms or less", add < 160, `median ${Math.round(add)} ms (${times.map((t) => Math.round(t)).join(", ")})`);
  check("No errors on the long page", !errors.length, errors[0] ?? "");
  await ctx.close();
}
