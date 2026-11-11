// End to end: the builder's main jobs work, and the two worked examples open clean.
import { readFileSync } from "node:fs";
import { BASE, activeDoc, caretToEnd, check, content, openBuilder, openPageNamed, openPanel, startSuite, watchErrors } from "../lib.mjs";

export default async function smoke(browser) {
  startSuite("End to end");
  const { ctx, page, errors } = await openBuilder(browser);

  check("The builder opens with no errors", (await page.locator(".pb-frame").count()) > 0 && !errors.length, errors[0] ?? `${await page.locator(".pb-frame").count()} blocks on the page`);

  for (const name of ["Example — Dental Water", "Example — ST108"]) {
    errors.length = 0;
    await openPageNamed(page, name);
    const review = (await page.locator(".pb-review").innerText()).trim();
    const blocks = await page.locator(".pb-frame").count();
    check(`${name} opens with no errors`, !errors.length && blocks > 0 && !/to fix/.test(review), errors[0] ?? `${blocks} blocks, Review says “${review}”`);
  }

  // Add a block from the Add panel
  await openPageNamed(page, "Master template");
  const before = await page.locator(".pb-frame").count();
  await openPanel(page, "Add");
  await page.locator(".pb-blocks .pb-tile").first().click();
  await page.waitForTimeout(300);
  const after = await page.locator(".pb-frame").count();
  check("A block from the Add panel lands on the page", after === before + 1, `${before} → ${after} blocks`);

  // Type into a text slot
  const slot = page.locator(".pb-frame").first().locator(".agx-ed").first();
  await slot.scrollIntoViewIfNeeded();
  await slot.click();
  await caretToEnd(page);
  await page.keyboard.type(" QA");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  const path = await slot.getAttribute("data-path");
  const doc = await activeDoc(page);
  const typed = String(doc.modules[0].data[path.split(".")[0]] ?? "");
  check("Typing on the page saves the text", JSON.stringify(doc.modules[0].data).includes(" QA"), `${path}: “${typed.slice(-40)}”`);

  // Move a block down with its toolbar
  const names = async () => page.locator(".pb-frame__bar strong").allInnerTexts();
  const n0 = await names();
  const second = page.locator(".pb-frame").nth(1);
  await second.hover();
  await second.locator(".pb-frame__bar button[aria-label='Move down']").click();
  await page.waitForTimeout(200);
  const n1 = await names();
  check("Move down reorders blocks", n1[1] === n0[2] && n1[2] === n0[1], `${n0[1]} / ${n0[2]} → ${n1[1]} / ${n1[2]}`);

  // Preview mode
  await page.locator("[data-tour=preview]").click();
  await page.waitForTimeout(200);
  const previewing = (await page.locator("[data-tour=preview]").innerText()).includes("Back to editing");
  await page.locator("[data-tour=preview]").click();
  check("Preview hides the tools and comes back", previewing && (await page.locator(".pb-frame").count()) > 0);

  // Exports
  await openPageNamed(page, "Example — ST108");
  const exportFile = async (label) => {
    await page.locator(".pb-menu button", { hasText: "Export" }).first().click();
    const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("menuitem", { name: new RegExp(label) }).click()]);
    const file = await dl.path();
    return { name: dl.suggestedFilename(), file };
  };
  const brief = await exportFile("Content brief");
  const briefText = readFileSync(brief.file, "utf8");
  check("Content brief downloads", briefText.includes("ST108") && briefText.length > 2000, `${brief.name}, ${briefText.length} characters`);
  const zip = await exportFile("Handoff package");
  check("Handoff package downloads", zip.name.endsWith(".zip") && readFileSync(zip.file).length > 10000, `${zip.name}, ${Math.round(readFileSync(zip.file).length / 1024)} KB`);
  const pageFile = await exportFile("Page file");
  const exported = JSON.parse(readFileSync(pageFile.file, "utf8"));
  check("Page file downloads", exported.format && exported.page?.modules?.length > 0, `${pageFile.name}, ${exported.page.modules.length} blocks`);

  // Open the page file again
  const source = await activeDoc(page);
  await page.locator(".pb-menu button", { hasText: "Export" }).first().click();
  const [chooser] = await Promise.all([page.waitForEvent("filechooser"), page.getByRole("menuitem", { name: /Open a page file/ }).click()]);
  await chooser.setFiles(pageFile.file);
  await page.waitForTimeout(600);
  const opened = await activeDoc(page);
  check("A page file opens as a new page with the same content", opened.name.endsWith("(imported)") && JSON.stringify(content(opened)) === JSON.stringify(content(source)), opened.name);

  // Share a preview link
  await openPageNamed(page, "Example — ST108");
  await page.locator("[data-tour=share]").click();
  await page.getByRole("button", { name: "Create link" }).click();
  await page.waitForSelector(".pb-share__link input", { timeout: 15000 });
  const url = await page.locator(".pb-share__link input").inputValue();
  await page.locator(".pb-dialog .pb-mini[aria-label=Close]").click();
  const viewer = await ctx.newPage();
  const viewerErrors = watchErrors(viewer);
  await viewer.goto(url.replace(/^https?:\/\/[^/]+/, BASE));
  await viewer.waitForSelector(".sv-stage h1", { timeout: 15000 });
  const h1 = await viewer.locator(".sv-stage h1").first().innerText();
  check("A shared link opens the page for viewers", h1.includes("ST108") && !viewerErrors.length, viewerErrors[0] ?? `“${h1}”`);
  await viewer.close();

  // Other routes
  for (const route of ["/specs", "/preview"]) {
    const p = await ctx.newPage();
    const errs = watchErrors(p);
    const res = await p.goto(BASE + route);
    await p.waitForTimeout(800);
    check(`${route} opens`, res?.ok() && !errs.length, errs[0] ?? `HTTP ${res?.status()}`);
    await p.close();
  }
  await ctx.close();
}
