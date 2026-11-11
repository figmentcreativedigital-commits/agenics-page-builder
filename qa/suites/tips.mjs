// Guidance: design tips (background rhythm, photo crop, text color), templates that start
// balanced, text colors by the Agenics rules, and cut-outs (transparent images).
import { readFileSync } from "node:fs";
import path from "node:path";
import { FIXTURES, activeDoc, blurAll, check, mod, openBuilder, openPageNamed, openPanel, settingsTab, startSuite } from "../lib.mjs";

const IMG = (name) => path.join(FIXTURES, "images", name);
const wait = (page, ms = 250) => page.waitForTimeout(ms);
const chips = (page) => page.locator(".pb-tipchip").allInnerTexts().then((t) => t.map((x) => x.trim()));
const undo = async (page) => {
  await blurAll(page);
  await page.keyboard.press(`${mod}+KeyZ`);
  await wait(page);
};
const bgs = async (page) => (await activeDoc(page)).modules.map((m) => m.style?.bg ?? "-");
/** Select a block by its toolbar title (short blocks have no room for a click inside them). */
const pick = async (page, index) => {
  const frame = page.locator(".pb-frame").nth(index);
  await frame.scrollIntoViewIfNeeded();
  const h = (await frame.boundingBox()).height;
  await frame.hover({ position: { x: 30, y: Math.min(60, Math.round(h * 0.6)) } });
  await frame.locator(":scope > .pb-frame__bar strong").click();
  await blurAll(page);
};
const setBg = async (page, index, label) => {
  await pick(page, index);
  await settingsTab(page, "Style");
  await page.locator(".pb-swatches button", { hasText: label }).first().click();
  await wait(page);
};
const brief = async (page) => {
  await page.locator(".pb-menu button", { hasText: "Export" }).first().click();
  const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("menuitem", { name: /Content brief/ }).click()]);
  return readFileSync(await dl.path(), "utf8");
};

export default async function tips(browser) {
  startSuite("Design tips, balanced templates, text colors and cut-outs");
  const { ctx, page, errors } = await openBuilder(browser);

  /* ---------------- Templates start balanced ---------------- */
  const withTips = [];
  await openPanel(page, "Pages");
  await page.getByRole("button", { name: /New page/ }).first().click();
  const cards = await page.locator(".pb-dialog .pb-gcard").count();
  await page.keyboard.press("Escape");
  for (let i = 0; i < cards; i++) {
    await openPanel(page, "Pages");
    await page.getByRole("button", { name: /New page/ }).first().click();
    const card = page.locator(".pb-dialog .pb-gcard").nth(i);
    const name = (await card.locator("b").innerText()).trim();
    await card.click();
    await wait(page, 350);
    const n = await page.locator(".pb-tipchip").count();
    if (n) withTips.push(`${name} (${n})`);
  }
  check("Every template and example starts with no design tips", cards >= 8 && !withTips.length, withTips.join(", ") || `${cards} starting points`);

  /* ---------------- Same background, block after block ---------------- */
  await openPageNamed(page, "Master template");
  await page.locator(".pb-rail button", { hasText: "Pages" }).click();
  const before = await bgs(page);
  const topBefore = (await page.locator("[data-tour=review]").innerText()).match(/\d+/)?.[0];
  await setBg(page, 1, "White");
  const run = await chips(page);
  const topAfter = (await page.locator("[data-tour=review]").innerText()).match(/\d+/)?.[0];
  check("Two white blocks in a row get a chip on the join", run.length === 1 && /Two white in a row/.test(run[0]), run.join(", "));

  await page.locator(".pb-tipchip").first().click();
  await wait(page);
  const card = page.locator(".pb-tippop");
  const title = await card.locator(".pb-tip__title").innerText();
  const cols = await card.locator(".pb-tip__run").count();
  const fixes = await card.locator(".pb-tip__fixes button").allInnerTexts();
  const focused = await page.evaluate(() => document.activeElement?.textContent?.trim());
  check(
    "The card shows the run now and alternating, with one-click fixes and Keep as is",
    /Two white blocks in a row/.test(title) && cols === 2 && fixes.some((f) => /Alternate/.test(f)) && fixes.some((f) => /Tighten the gaps/.test(f)) && fixes.some((f) => /Keep as is/.test(f)) && /Alternate/.test(focused ?? ""),
    fixes.join(" · "),
  );

  await card.getByRole("button", { name: /Alternate the backgrounds/ }).click();
  await wait(page);
  const alt = await bgs(page);
  const fixedChips = await chips(page);
  await undo(page);
  const undone = await bgs(page);
  // White runs take Silver 18% first: one of the two blocks is silver now, and no cyan was added
  const changed = alt.filter((b, i) => b !== undone[i]);
  check("Alternate the backgrounds uses Silver 18% first, clears the tip, and undoes in one step", !fixedChips.length && changed.length === 1 && changed[0] === "silver" && (await chips(page)).length === 1, `${undone.slice(0, 4).join(" ")} → ${alt.slice(0, 4).join(" ")}`);

  await page.locator(".pb-tipchip").first().click();
  await page.locator(".pb-tippop").getByRole("button", { name: /Tighten the gaps/ }).click();
  await wait(page);
  const spaces = (await activeDoc(page)).modules.slice(1, 3).map((m) => m.style?.space);
  const tightChips = await chips(page);
  await undo(page);
  check("Tighten the gaps sets compact spacing on the run, clears the tip, and undoes in one step", spaces.every((s) => s === "compact") && !tightChips.length && (await chips(page)).length === 1, spaces.join(", "));

  // The same tip in Review, counted with what is left
  await openPanel(page, "Review");
  const listed = await page.locator(".pb-tips .pb-rgroup__head").allInnerTexts();
  const badge = (await page.locator(".pb-rail__badge").innerText()).trim();
  const summary = (await page.locator(".pb-score b").innerText()).match(/\d+/)?.[0];
  check("Review lists it under Design tips, and every count agrees", listed.some((t) => /Two white blocks in a row/.test(t)) && topAfter === badge && badge === summary && Number(topAfter) >= Number(topBefore), `top bar ${topBefore} → ${topAfter}, badge ${badge}, summary ${summary}`);
  await page.locator(".pb-tips .pb-rgroup__head").first().click();
  await page.locator(".pb-tips .pb-tip__keep").click();
  await wait(page);
  const keptGone = (await chips(page)).length === 0;
  await page.reload();
  await page.waitForSelector(".pb-top");
  await wait(page, 600);
  const keptAfterReload = (await chips(page)).length === 0;
  await openPanel(page, "Review");
  await page.locator(".pb-tips__again").click();
  await wait(page);
  check("Keep as is puts the tip away, also after a reload, and Review can show it again", keptGone && keptAfterReload && (await chips(page)).length === 1);
  await setBg(page, 1, "Silver");
  await page.locator(".pb-rail button", { hasText: "Review" }).click();
  check("Changing a background by hand clears the tip too", (await chips(page)).length === 0 && JSON.stringify(await bgs(page)) !== JSON.stringify(before.map(() => "x")));

  /* ---------------- A photo that loses a large share to its frame ---------------- */
  const feature = page.locator(".pb-frame").nth(3);
  await feature.scrollIntoViewIfNeeded();
  await feature.locator("input[type=file]").first().setInputFiles(IMG("wide-3x1.jpg"));
  await wait(page, 900);
  const cropChip = await chips(page);
  check("A 3:1 photo in the 4:5 frame gets a chip that says how much shows", cropChip.length === 1 && /^Shows 27%$/.test(cropChip[0]), cropChip.join(", "));
  await feature.locator(".pb-tipchip--image").click();
  await wait(page);
  const why = await page.locator(".pb-tippop .pb-tip__why").innerText();
  const pic = await page.locator(".pb-tippop .pb-tip__crop i").count();
  await page.locator(".pb-tippop").getByRole("button", { name: "Adjust the crop" }).click();
  await wait(page, 400);
  const asked = await page.locator(".pb-imgrow.is-asked .pb-focus").count();
  check("The card shows what the frame keeps, and Adjust the crop opens Focus and zoom on that photo", /4:5 frame/.test(why) && /3:1/.test(why) && pic === 1 && asked === 1, why);
  await feature.locator(".pb-tipchip--image").click();
  await page.locator(".pb-tippop").getByRole("button", { name: /Choose a 4:5 photo/ }).click();
  await wait(page, 400);
  const library = await page.locator(".pb-modal").count();
  await page.keyboard.press("Escape");
  await wait(page);
  await feature.locator("input[type=file]").first().setInputFiles(IMG("upright-4x5.jpg"));
  await wait(page, 900);
  check("Choose a 4:5 photo opens the photo library, and a 4:5 photo clears the tip", library === 1 && (await chips(page)).length === 0);

  /* ---------------- Cut-outs ---------------- */
  await feature.locator("input[type=file]").first().setInputFiles(IMG("cutout.png"));
  await wait(page, 900);
  const cut = (await activeDoc(page)).modules[3].data.image;
  const fit = await feature.locator(".agx-img img").first().evaluate((el) => getComputedStyle(el).objectFit);
  check("A transparent image is spotted on upload and shown whole, with no crop tip", cut.cutout === true && fit === "contain" && (await chips(page)).length === 0, `cutout ${cut.cutout}, object-fit ${fit}`);
  const cutBrief = await brief(page);
  check("The brief says the cut-out is not cropped", /Feature image \(4:5\):.*whole image inside the frame, not cropped \(object-fit: contain\)/.test(cutBrief));
  await feature.locator("input[type=file]").first().setInputFiles(IMG("upright-4x5.jpg"));
  await wait(page, 900);

  /* ---------------- Text colors ---------------- */
  const para = feature.locator(".agx-ed[data-path='benefits.0.body']");
  await para.click();
  await wait(page);
  await page.locator(".pb-elbar__color > button").click();
  const onLight = await page.locator(".pb-colormenu button").allInnerTexts().then((t) => t.map((x) => x.trim()));
  await page.locator(".pb-colormenu").getByRole("menuitemradio", { name: "Navy" }).click();
  await wait(page);
  const navy = await para.evaluate((el) => getComputedStyle(el).color);
  const paraPath = await para.getAttribute("data-path");
  const saved = (await activeDoc(page)).modules[3].colors;
  check("Body text on a light background offers Navy, AG Gray and Charcoal, never Cyan", JSON.stringify(onLight) === JSON.stringify(["Standard", "Navy", "AG Gray", "Charcoal"]), onLight.join(", "));
  check("Picking Navy colors that text and is saved with the page", navy === "rgb(0, 66, 120)" && saved?.[paraPath] === "navy", `${navy}, ${JSON.stringify(saved)}`);
  const colorBrief = await brief(page);
  check("The brief names the color in words with its value, and how each image fits", /text color: Navy \(#004278\)/.test(colorBrief) && /fit: fill the 4:5 frame, cropped to fit \(object-fit: cover\)/.test(colorBrief));
  await undo(page);
  const back = (await activeDoc(page)).modules[3].colors;
  check("A text color undoes in one step", !back || !back[paraPath], JSON.stringify(back ?? {}));

  await feature.locator("h2.agx-ed").first().click();
  await wait(page);
  const onHeadline = await page.locator(".pb-elbar__color").count();
  await page.keyboard.press("Escape");
  await blurAll(page);
  check("Headlines keep the brand's color: no color menu", onHeadline === 0);

  // On navy: white and cyan. Then the background turns light: cyan never shows on it.
  const gridIndex = (await activeDoc(page)).modules.findIndex((m) => m.type === "grid");
  await setBg(page, gridIndex, "Navy");
  const grid = page.locator(".pb-frame").nth(gridIndex);
  const cell = grid.locator(".agx-ed[data-path='items.0.body']");
  await cell.click();
  await wait(page);
  await page.locator(".pb-elbar__color > button").click();
  const onNavy = await page.locator(".pb-colormenu button").allInnerTexts().then((t) => t.map((x) => x.trim()));
  await page.locator(".pb-colormenu").getByRole("menuitemradio", { name: "Cyan" }).click();
  await wait(page);
  const cyan = await cell.evaluate((el) => getComputedStyle(el).color);
  await page.keyboard.press("Escape");
  await blurAll(page);
  const navyChips = await chips(page);
  check("On navy the menu offers White and Cyan, and cyan shows", JSON.stringify(onNavy) === JSON.stringify(["Standard", "White", "Cyan"]) && cyan === "rgb(0, 187, 242)", `${onNavy.join(", ")}; ${cyan}`);

  await setBg(page, gridIndex, "White");
  const light = await cell.evaluate((el) => getComputedStyle(el).color);
  const inkChips = (await chips(page)).filter((c) => !navyChips.includes(c));
  check("When the background turns white, the cyan text goes back to its standard color and a tip says why", light !== "rgb(0, 187, 242)" && inkChips.some((c) => /Cyan text on white/.test(c)), `${light}; ${inkChips.join(", ")}`);
  await grid.locator(".pb-tipchip", { hasText: "Cyan text" }).click();
  await wait(page);
  const inkWhy = await page.locator(".pb-tippop .pb-tip__why").innerText();
  await page.locator(".pb-tippop").getByRole("button", { name: /Use the standard dark text/ }).click();
  await wait(page);
  const cleared = !(await activeDoc(page)).modules[gridIndex].colors;
  const noInk = !(await chips(page)).some((c) => /Cyan text/.test(c));
  await undo(page);
  const again = (await chips(page)).some((c) => /Cyan text/.test(c));
  check("The tip's fix clears the color in one undo step", /never text on a light background/.test(inkWhy) && cleared && noInk && again, inkWhy);
  await page.locator(".pb-tipchip", { hasText: "Cyan text" }).click();
  await page.locator(".pb-tippop").getByRole("button", { name: /Use the standard dark text/ }).click();
  await wait(page);

  /* ---------------- Preview, page file ---------------- */
  await setBg(page, 1, "White");
  await page.locator("[data-tour=preview]").click();
  await wait(page, 400);
  const inPreview = await page.locator(".pb-tipchip:visible").count();
  await page.locator("[data-tour=preview]").click();
  await wait(page, 300);
  check("Preview hides the tips", inPreview === 0 && (await chips(page)).length >= 1);

  await para.click();
  await page.locator(".pb-elbar__color > button").click();
  await page.locator(".pb-colormenu").getByRole("menuitemradio", { name: "Charcoal" }).click();
  await page.keyboard.press("Escape");
  await blurAll(page);
  await page.locator(".pb-menu button", { hasText: "Export" }).first().click();
  const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("menuitem", { name: /Page file/ }).click()]);
  const file = await dl.path();
  const exported = JSON.parse(readFileSync(file, "utf8")).page;
  await page.locator(".pb-menu button", { hasText: "Export" }).first().click();
  await page.locator(".pb-menu input[type=file]").setInputFiles(file);
  await wait(page, 600);
  const imported = await activeDoc(page);
  check("A page file carries text colors and comes back with them", exported.modules[3].colors?.[paraPath] === "charcoal" && imported.modules[3].colors?.[paraPath] === "charcoal" && imported.id !== exported.id);

  check("No errors", !errors.length, errors[0] ?? "");
  await ctx.close();
}
