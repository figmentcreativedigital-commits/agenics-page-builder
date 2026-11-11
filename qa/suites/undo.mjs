// Undo for every change: photos, text, links, descriptions and notes are all steps.
import { caretToEnd, activeDoc, blurAll, check, mod, openBuilder, openPageNamed, same, selectBlock, settingsTab, startSuite } from "../lib.mjs";

const undo = (page) => page.keyboard.press(`${mod}+z`);
const redo = (page) => page.keyboard.press(`${mod}+Shift+z`);
const settle = (page, ms = 250) => page.waitForTimeout(ms);

export default async function undoSuite(browser) {
  startSuite("Undo for every change");
  const { ctx, page, errors } = await openBuilder(browser);
  await openPageNamed(page, "Example — ST108");
  const original = await activeDoc(page);

  // ---- A photo, then undo: that photo comes back and nothing else changes
  await selectBlock(page, 0);
  await page.locator(".pb-right").getByRole("button", { name: "Library" }).first().click();
  await settle(page);
  const current = original.modules[0].data.image?.src;
  const pick = page.locator(".pb-lib-item:not(.is-on)").first();
  await pick.click();
  await settle(page, 400);
  const changed = await activeDoc(page);
  const photoChanged = changed.modules[0].data.image?.src !== current;
  await blurAll(page);
  await undo(page);
  await settle(page);
  const back = await activeDoc(page);
  check("Changing a photo, then ⌘Z, brings that photo back", photoChanged && back.modules[0].data.image?.src === current, `${changed.modules[0].data.image?.src?.split("/").pop()} → ${back.modules[0].data.image?.src?.split("/").pop()}`);
  check("…and nothing else changes", back.modules.length === original.modules.length && same(back.modules, original.modules), `${back.modules.length} of ${original.modules.length} blocks, content ${same(back.modules, original.modules) ? "identical" : "differs"}`);
  await redo(page);
  await settle(page);
  check("⌘⇧Z puts the new photo back", (await activeDoc(page)).modules[0].data.image?.src === changed.modules[0].data.image?.src);
  await undo(page);
  await settle(page);

  // ---- A typed word is one step
  const para = page.locator(".pb-frame").nth(1).locator(".agx-prose p.agx-ed, p.agx-ed").first();
  await para.scrollIntoViewIfNeeded();
  const path = await para.getAttribute("data-path");
  const uid = await para.getAttribute("data-uid");
  const textOf = async () => {
    const d = await activeDoc(page);
    const m = d.modules.find((x) => x.uid === uid);
    return path.split(".").reduce((v, k) => v?.[k], m.data);
  };
  const t0 = await textOf();
  await para.click();
  await caretToEnd(page);
  await page.keyboard.type(" quickly", { delay: 40 });
  await page.keyboard.press("Escape");
  await blurAll(page);
  const t1 = await textOf();
  await undo(page);
  await settle(page);
  const t2 = await textOf();
  check("A typed word undoes in one step", t1 !== t0 && t2 === t0, `“…${String(t1).slice(-16)}” → “…${String(t2).slice(-16)}”`);
  await redo(page);
  await settle(page);
  check("Redo brings the word back", (await textOf()) === t1);
  await undo(page);
  await settle(page);

  // ---- Two bursts with a pause between them are two steps
  await para.click();
  await caretToEnd(page);
  await page.keyboard.type(" one", { delay: 30 });
  await page.waitForTimeout(1700);
  await page.keyboard.type(" two", { delay: 30 });
  await page.keyboard.press("Escape");
  await blurAll(page);
  await undo(page);
  await settle(page);
  const afterOne = await textOf();
  await undo(page);
  await settle(page);
  const afterTwo = await textOf();
  check("A pause in typing starts a new step", String(afterOne).endsWith(" one") && afterTwo === t0, `“…${String(afterOne).slice(-8)}”, then “…${String(afterTwo).slice(-8)}”`);

  // ---- Steps that changed nothing are skipped
  const order = async () => (await activeDoc(page)).modules.map((m) => m.uid);
  const o0 = await order();
  const third = page.locator(".pb-frame").nth(2);
  await third.scrollIntoViewIfNeeded();
  await third.hover();
  await third.locator(".pb-frame__bar button[aria-label='Move down']").click();
  await settle(page);
  const o1 = await order();
  await para.click();
  await caretToEnd(page);
  await page.keyboard.type("x");
  await page.keyboard.press("Backspace");
  await page.keyboard.press("Escape");
  await blurAll(page);
  await undo(page);
  await settle(page);
  check("Typing then deleting it is skipped by undo", !same(o0, o1) && same(await order(), o0) && (await textOf()) === t0, same(await order(), o0) ? "one ⌘Z undid the move" : "the move is still there");

  // ---- Links
  const hero = await selectBlock(page, 0);
  const chip = hero.locator(".agx-linkchip__btn").first();
  await chip.click();
  const linkInput = hero.locator(".agx-linkchip__pop input").first();
  const href0 = await linkInput.inputValue();
  await linkInput.fill("/qa-test-link");
  await linkInput.press("Enter");
  await blurAll(page);
  const hrefNow = JSON.stringify((await activeDoc(page)).modules[0].data).includes("/qa-test-link");
  await undo(page);
  await settle(page);
  const hrefBack = !JSON.stringify((await activeDoc(page)).modules[0].data).includes("/qa-test-link");
  check("A link change undoes", hrefNow && hrefBack, `“${href0}” → “/qa-test-link” → back`);

  // ---- Image descriptions (alt text)
  await selectBlock(page, 0);
  const alt = page.locator(".pb-right input[aria-label$='alt text']").first();
  const alt0 = await alt.inputValue();
  await alt.fill("QA description");
  await blurAll(page);
  await undo(page);
  await settle(page);
  check("An image description undoes", (await alt.inputValue()) === alt0, `“${(await alt.inputValue()).slice(0, 40)}”`);

  // ---- Notes for the team
  await settingsTab(page, "Style");
  const note = page.locator(".pb-right textarea").first();
  await note.fill("QA note");
  await blurAll(page);
  const noted = (await activeDoc(page)).modules[0].note === "QA note";
  await undo(page);
  await settle(page);
  check("A team note undoes", noted && !(await activeDoc(page)).modules[0].note);

  // ---- Back where we started, with no errors
  check("After undoing everything the page matches how it opened", same((await activeDoc(page)).modules, original.modules));
  check("No errors while undoing", !errors.length, errors[0] ?? "");
  await ctx.close();
}
