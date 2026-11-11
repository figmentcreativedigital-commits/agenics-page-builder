// Editing feel: zoom and Fit, folding panels, focus mode, the View menu, the text bar docked
// above the page, and the block menu (right-click or ⇧F10).
import { STORE_KEY, activeDoc, blurAll, caretToEnd, check, mod, openBuilder, openPageNamed, openPanel, selectBlock, startSuite } from "../lib.mjs";

const zoomOf = (page) => page.evaluate(() => Number(document.querySelector(".pb-stage")?.style.zoom || 1));
const viewLabel = async (page) => (await page.locator("[data-tour=view] > button").innerText()).trim();
const box = (page, sel) => page.evaluate((s) => {
  const r = document.querySelector(s)?.getBoundingClientRect();
  return r ? { x: r.x, y: r.y, w: r.width, h: r.height, top: r.top, bottom: r.bottom, left: r.left, right: r.right } : null;
}, sel);
const order = async (page) => (await activeDoc(page)).modules.map((m) => m.uid);
/** The selected block's frame id (the selection isn't saved, so it's read from the page). */
const live = (page) => page.evaluate(() => document.querySelector(".pb-frame.is-selected")?.id ?? null);
const overlaps = (a, b) => !!a && !!b && !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
const wait = (page, ms = 200) => page.waitForTimeout(ms);

export default async function view(browser) {
  startSuite("Zoom, panels, focus mode, text bar and block menu");
  const { ctx, page, errors } = await openBuilder(browser);
  await openPageNamed(page, "Example — ST108");

  /* ---------------- Zoom ---------------- */
  const fit = await zoomOf(page);
  const fitLabel = await viewLabel(page);
  check("The View button shows the zoom on screen", fitLabel === `${Math.round(fit * 100)}%`, `${fitLabel}, page drawn at ${fit}`);
  await page.keyboard.press(`${mod}+Equal`);
  await wait(page);
  const up = await zoomOf(page);
  await page.keyboard.press(`${mod}+Minus`);
  await page.keyboard.press(`${mod}+Minus`);
  await wait(page);
  const down = await zoomOf(page);
  await page.keyboard.press(`${mod}+Digit0`);
  await wait(page);
  const back = await zoomOf(page);
  check("⌘+ and ⌘− step through the zoom levels, ⌘0 fits again", up > fit && down < up && Math.abs(back - fit) < 0.002, `${fit} → ${up} → ${down} → ${back}`);

  await page.locator("[data-tour=view] > button").click();
  await page.getByRole("menuitemradio", { name: /^100%/ }).click();
  await wait(page, 300);
  const actual = await zoomOf(page);
  const scrolls = await page.evaluate(() => {
    const c = document.querySelector(".pb-canvas");
    return c.scrollWidth > c.clientWidth + 1;
  });
  check("100% shows the page at actual size and scrolls sideways when it's wider than the space", actual === 1 && scrolls && (await viewLabel(page)) === "100%", `zoom ${actual}`);

  // Zoom keys work while typing, and type nothing
  const slot = page.locator(".pb-frame").nth(1).locator(".agx-ed").first();
  await slot.scrollIntoViewIfNeeded();
  await slot.click();
  const textBefore = await slot.innerText();
  await page.keyboard.press(`${mod}+Minus`);
  await wait(page);
  const typingZoom = await zoomOf(page);
  const stillFocused = await slot.evaluate((el) => document.activeElement === el);
  check("Zoom keys work while typing and leave the text alone", typingZoom < 1 && stillFocused && (await slot.innerText()) === textBefore, `zoom ${typingZoom}, still typing: ${stillFocused}`);
  await page.keyboard.press("Escape");
  await blurAll(page);

  await page.reload();
  await page.waitForSelector(".pb-top");
  await wait(page, 600);
  const kept = await zoomOf(page);
  check("The zoom you pick is kept after a reload", Math.abs(kept - typingZoom) < 0.002, `${kept}`);
  await page.keyboard.press(`${mod}+Digit0`);
  await wait(page);

  /* ---------------- Panels ---------------- */
  await openPanel(page, "Pages");
  const w0 = (await box(page, ".pb-canvas")).w;
  const z0 = await zoomOf(page);
  await page.locator(".pb-rail button", { hasText: "Pages" }).click();
  await wait(page);
  const w1 = (await box(page, ".pb-canvas")).w;
  const pagesBtn = page.locator(".pb-rail button", { hasText: "Pages" });
  check(
    "Clicking the open tab on the rail folds its panel away and the page grows",
    (await page.locator(".pb-left").count()) === 0 && (await pagesBtn.getAttribute("aria-pressed")) === "false" && !(await pagesBtn.getAttribute("aria-controls")) && w1 > w0 + 200 && (await zoomOf(page)) > z0,
    `page area ${Math.round(w0)} → ${Math.round(w1)} px, zoom ${z0} → ${await zoomOf(page)}`,
  );

  await openPanel(page, "Add");
  const n0 = await page.locator(".pb-frame").count();
  await page.locator(".pb-blocks .pb-tile").first().click();
  await wait(page, 300);
  check("Adding a block from the Add panel folds the panel away", (await page.locator(".pb-frame").count()) === n0 + 1 && (await page.locator(".pb-left").count()) === 0);
  await blurAll(page);
  await page.keyboard.press(`${mod}+KeyZ`);
  await wait(page);

  await selectBlock(page, 2);
  await page.locator(".pb-panelx--right").click();
  await wait(page);
  const strip = page.locator(".pb-rstrip button");
  const frameSettings = page.locator(".pb-frame.is-selected > .pb-frame__bar button[aria-label='Show settings']");
  const folded = (await page.locator(".pb-right").count()) === 0 && (await strip.isVisible()) && (await frameSettings.count()) === 1;
  await frameSettings.click();
  await wait(page);
  check("Settings fold to a strip, and the block toolbar brings them back", folded && (await page.locator(".pb-right").count()) === 1);

  await openPanel(page, "Pages");
  await page.locator(".pb-left .pb-panelx").click();
  await page.locator(".pb-panelx--right").click();
  await page.reload();
  await page.waitForSelector(".pb-top");
  await wait(page, 600);
  const keptFold = (await page.locator(".pb-left").count()) === 0 && (await page.locator(".pb-rstrip").count()) === 1;
  await page.locator(".pb-rstrip button").click();
  await openPanel(page, "Pages");
  check("Folded panels stay folded after a reload", keptFold);

  /* ---------------- Focus mode ---------------- */
  await blurAll(page);
  await page.keyboard.press(`${mod}+Backslash`);
  await wait(page, 300);
  const wrap = await box(page, ".pb-canvaswrap");
  const railShown = await page.locator(".pb-rail").isVisible();
  check(
    "⌘\\ hides the rail and both panels, and the page gets the whole width",
    !railShown && (await page.locator(".pb-left, .pb-right, .pb-rstrip").count()) === 0 && wrap.w >= 1440 - 2 && (await page.locator(".pb-focusexit").isVisible()),
    `page area ${Math.round(wrap.w)} px wide`,
  );
  await slot.scrollIntoViewIfNeeded();
  await slot.click();
  await page.keyboard.press(`${mod}+Backslash`);
  await wait(page, 300);
  const outWhileTyping = (await page.locator(".pb-rail").isVisible()) && (await slot.evaluate((el) => document.activeElement === el));
  check("⌘\\ works while typing too", outWhileTyping);
  await page.keyboard.press("Escape");
  await blurAll(page);

  await page.locator("[data-tour=view] > button").click();
  await page.getByRole("menuitemcheckbox", { name: /Focus mode/ }).click();
  await wait(page, 300);
  const onFromMenu = !(await page.locator(".pb-rail").isVisible());
  await page.locator(".pb-focusexit").click();
  await wait(page, 300);
  check("The View menu turns focus mode on, and Exit focus mode brings the panels back", onFromMenu && (await page.locator(".pb-rail").isVisible()) && (await page.locator(".pb-left").count()) === 1 && (await page.locator(".pb-right").count()) === 1);

  /* ---------------- Text bar ---------------- */
  await blurAll(page);
  const cap = (await page.locator(".pb-ctx__cap").innerText()).trim();
  check("Above the page: the screen size when you're not typing", /^Desktop · 1280 px wide/.test(cap), cap);
  const head = page.locator(".pb-frame").nth(0).locator(".agx-ed").first();
  await head.scrollIntoViewIfNeeded();
  const stageBefore = await box(page, ".pb-stage");
  await head.click();
  await caretToEnd(page);
  await wait(page);
  const bar = await box(page, ".pb-ctx .pb-elbar");
  const slotBox = await head.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
  });
  const stageAfter = await box(page, ".pb-stage");
  const count0 = await page.locator(".pb-elbar__count").innerText();
  await page.keyboard.type("abc");
  await wait(page);
  const count1 = await page.locator(".pb-elbar__count").innerText();
  const n = (t) => Number(t.replace(/^.*?(\d+)\/.*$/, "$1"));
  check(
    "While typing, the text bar sits above the page, never on the text, and nothing moves",
    !!bar && !overlaps(bar, slotBox) && Math.abs(stageBefore.top - stageAfter.top) < 1,
    `bar at ${Math.round(bar?.top ?? -1)}–${Math.round(bar?.bottom ?? -1)} px, text at ${Math.round(slotBox.top)}–${Math.round(slotBox.bottom)} px, page top ${Math.round(stageBefore.top)} → ${Math.round(stageAfter.top)} px`,
  );
  check("The text bar names the field and counts as you type", (await page.locator(".pb-elbar b").innerText()).length > 0 && n(count1) === n(count0) + 3, `${count0} → ${count1}`);
  for (let i = 0; i < 3; i++) await page.keyboard.press("Backspace");
  await page.keyboard.press("Escape");
  await blurAll(page);

  /* ---------------- Block menu ---------------- */
  const frame2 = page.locator(".pb-frame").nth(2);
  await frame2.scrollIntoViewIfNeeded();
  const before = await order(page);
  await frame2.click({ button: "right", position: { x: 300, y: 120 } });
  await wait(page);
  const menu = page.locator(".pb-ctxmenu");
  const name = await menu.getAttribute("aria-label").catch(() => null);
  const firstFocused = await page.evaluate(() => document.activeElement?.closest(".pb-ctxmenu") && document.activeElement.textContent.trim());
  const selId = await live(page);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  const moved = await page.evaluate(() => document.activeElement?.closest(".pb-ctxmenu") && document.activeElement.textContent.trim());
  await page.keyboard.press("Delete");
  await wait(page);
  const afterKeys = await order(page);
  const selAfter = await live(page);
  check(
    "Right-click opens the block's menu; arrows and Delete stay inside it",
    !!name && /actions$/.test(name) && /Move/.test(firstFocused || "") && moved && moved !== firstFocused && selId === `mod-${before[2]}` && selAfter === selId && JSON.stringify(afterKeys) === JSON.stringify(before),
    `${name}; focus “${firstFocused}” → “${moved}”`,
  );
  await page.keyboard.press("Escape");
  await wait(page);
  check("Escape closes it and leaves the block selected", (await menu.count()) === 0 && (await live(page)) === selId);

  await page.keyboard.press("Shift+F10");
  await wait(page);
  const viaKey = (await menu.count()) === 1;
  await menu.getByRole("menuitem", { name: /Move down/ }).click();
  await wait(page);
  const afterMove = await order(page);
  await page.keyboard.press(`${mod}+KeyZ`);
  await wait(page);
  check("⇧F10 opens it too; Move down works and undoes in one step", viaKey && afterMove[3] === before[2] && JSON.stringify(await order(page)) === JSON.stringify(before));

  await frame2.click({ button: "right", position: { x: 300, y: 120 } });
  await menu.getByRole("menuitem", { name: /^Delete/ }).click();
  await wait(page);
  const afterDelete = (await order(page)).length;
  await page.keyboard.press(`${mod}+KeyZ`);
  await wait(page);
  check("Delete from the menu removes the block, and undo brings it back", afterDelete === before.length - 1 && JSON.stringify(await order(page)) === JSON.stringify(before));

  // Right-click inside text being typed keeps the browser's own menu (spelling, paste)
  await slot.click();
  await slot.click({ button: "right" });
  await wait(page);
  check("Right-click in text you're typing keeps the browser's menu", (await menu.count()) === 0);
  await page.keyboard.press("Escape");
  await blurAll(page);

  // Other menus: arrows and Delete don't reach the page either
  await selectBlock(page, 2);
  const sel2 = await live(page);
  await page.locator("[data-tour=view] > button").click();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Delete");
  await wait(page);
  const viewSafe = (await live(page)) === sel2 && (await order(page)).length === before.length;
  await page.keyboard.press("Escape");
  await wait(page);
  check("With the View menu open, arrows and Delete don't act on the page, and Escape closes it", viewSafe && (await page.locator(".pb-menu__list").count()) === 0);

  /* ---------------- Selection, counts, landmarks ---------------- */
  await page.keyboard.press("Escape");
  await blurAll(page);
  const outlines = await page.evaluate(async () => {
    const frames = [...document.querySelectorAll(".pb-frame:not(.is-selected)")];
    const navy = frames.find((f) => f.querySelector(":scope > :is(.agx-hero, .agx-ctaband, .agx-bg--navy, .agx-sec--navy)"));
    const light = frames.find((f) => f.querySelector(":scope > .agx-bg--white"));
    return { navy: navy?.id, light: light?.id };
  });
  const hoverColor = async (id) => {
    const f = page.locator(`#${id}`);
    await f.scrollIntoViewIfNeeded();
    await f.hover({ position: { x: 300, y: 100 } });
    await wait(page, 120);
    return f.evaluate((el) => getComputedStyle(el).outlineColor);
  };
  const onLight = outlines.light ? await hoverColor(outlines.light) : "";
  const onNavy = outlines.navy ? await hoverColor(outlines.navy) : "";
  check("Hover shows a quiet navy line, white on navy blocks", /0, 66, 120/.test(onLight) && /255, 255, 255/.test(onNavy), `${onLight} · ${onNavy}`);

  await openPanel(page, "Review");
  const top = (await page.locator("[data-tour=review]").innerText()).match(/\d+/)?.[0];
  const badge = (await page.locator(".pb-rail__badge").innerText().catch(() => "")).trim();
  const summary = (await page.locator(".pb-score b").innerText().catch(() => "")).match(/\d+/)?.[0];
  check("The top bar, the Review badge and the Review summary give the same count", !!top && top === badge && top === summary, `${top} · ${badge} · ${summary}`);

  const landmarks = await page.evaluate(() => ({
    region: document.querySelectorAll("section[aria-label='Page']").length,
    h1: document.querySelector("h1")?.textContent ?? "",
  }));
  check("The page area is a named region and the builder has a heading", landmarks.region === 1 && /Agenics Page Builder: Example — ST108/.test(landmarks.h1), landmarks.h1);

  /* ---------------- Tour ---------------- */
  await page.locator("[data-tour=tour]").click();
  await wait(page, 500);
  await page.locator(".pb-tour__acts .pb-btn--primary").click();
  await wait(page, 500);
  await page.locator(".pb-tour__chapter").click();
  await page.locator(".pb-tour__menu button", { hasText: "Check and share" }).click();
  await wait(page, 600);
  await page.keyboard.press("ArrowRight");
  await wait(page, 700);
  const step = await page.locator(".pb-tour__card h3").innerText();
  const ring = await box(page, ".pb-tour__ring");
  const target = await box(page, "[data-tour=view]");
  await page.keyboard.press("Escape");
  check("The tour shows the View menu step, pointing at it", step === "Zoom, guides and focus" && overlaps(ring, target), step);
  check("No errors", !errors.length, errors[0] ?? "");
  await ctx.close();

  /* ---------------- Small laptop: the left panel floats ---------------- */
  const small = await openBuilder(browser, { width: 1024, height: 768 });
  await openPageNamed(small.page, "Example — ST108");
  const crowded = await small.page.evaluate(() => {
    const bar = document.querySelector(".pb-top").getBoundingClientRect();
    const items = [...document.querySelectorAll(".pb-top > :not(.sr-only):not(.pb-spacer)")].map((el) => el.getBoundingClientRect()).filter((r) => r.width);
    const out = items.filter((r) => r.left < bar.left - 1 || r.right > bar.right + 1 || r.top < bar.top - 1 || r.bottom > bar.bottom + 1).length;
    let hits = 0;
    for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) if (items[i].right > items[j].left + 1 && items[j].right > items[i].left + 1) hits++;
    return { out, hits, n: items.length };
  });
  check("At 1,024 px nothing in the top bar overlaps or spills out", !crowded.out && !crowded.hits, `${crowded.n} items, ${crowded.hits} overlapping, ${crowded.out} outside`);
  const pos = await small.page.locator(".pb-left").evaluate((el) => getComputedStyle(el).position);
  const cb = await box(small.page, ".pb-canvas");
  const cw0 = cb.w;
  // A click on the page, to the right of the floating panel
  await small.page.mouse.click(Math.round(cb.right - 40), 300);
  await wait(small.page, 300);
  const cw1 = (await box(small.page, ".pb-canvas")).w;
  check("At 1,024 px the left panel floats over the page, and working on the page puts it away", pos === "fixed" && Math.abs(cw0 - cw1) < 2 && (await small.page.locator(".pb-left").count()) === 0, `page area ${Math.round(cw0)} px either way`);
  check("No errors at 1,024 px", !small.errors.length, small.errors[0] ?? "");
  await small.ctx.close();

  /* ---------------- View settings saved by an older build ---------------- */
  const probe = await openBuilder(browser);
  const saved = await probe.page.evaluate((k) => JSON.parse(localStorage.getItem(k)), STORE_KEY);
  await probe.ctx.close();
  const old = structuredClone(saved);
  delete old.state.zoom;
  delete old.state.panels;
  delete old.state.focusMode;
  const odd = structuredClone(saved);
  Object.assign(odd.state, { zoom: 7, panels: "open", focusMode: "yes" });
  const outcomes = [];
  for (const state of [old, odd]) {
    const o = await openBuilder(browser, { state });
    await o.page.locator("[data-tour=view] > button").click();
    const fitOn = await o.page.getByRole("menuitemradio", { name: /Fit to screen/ }).getAttribute("aria-checked");
    const focusOn = await o.page.getByRole("menuitemcheckbox", { name: /Focus mode/ }).getAttribute("aria-checked");
    const label = await viewLabel(o.page);
    outcomes.push(fitOn === "true" && focusOn === "false" && label !== "700%" && (await o.page.locator(".pb-rail").isVisible()) && (await o.page.locator(".pb-left").count()) === 1 && (await o.page.locator(".pb-right").count()) === 1 && !o.errors.length);
    await o.ctx.close();
  }
  check("Saved builders without view settings, or with odd ones, open with Fit and both panels", outcomes.every(Boolean), outcomes.join(", "));
}
