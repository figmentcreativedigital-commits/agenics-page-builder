// Cloud save: with the team passcode, pages made or changed in one browser show up in another,
// with the name of whoever saved them. Runs against local storage with a test-only passcode.
import { BASE, activeDoc, blurAll, caretToEnd, check, openBuilder, openPageNamed, openPanel, startSuite } from "../lib.mjs";

const PASSCODE = "qa-only-passcode";
const wait = (page, ms = 300) => page.waitForTimeout(ms);
const names = (page) => page.locator(".pb-pagecard__name").evaluateAll((els) => els.map((e) => e.childNodes[0].textContent.trim()));
const status = (page) => page.locator(".pb-saved").first().getAttribute("aria-label");

async function turnOn(page, name, code = PASSCODE) {
  await page.locator("[data-cloud=off]").click();
  await page.locator(".pb-dialog input[type=text]").fill(name);
  await page.locator(".pb-dialog input[type=password]").fill(code);
  await page.locator(".pb-dialog button[type=submit]").click();
}
const sync = async (page) => {
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await wait(page, 1500);
};

export default async function cloud(browser) {
  startSuite("Cloud save");
  // The server side refuses anyone without the passcode
  const anon = await fetch(`${BASE}/api/pages`);
  const team = await fetch(`${BASE}/api/team`).then((r) => r.json());
  check("Without the passcode the saved pages can't be listed", anon.status === 401 && team.configured === true && team.member === false, `HTTP ${anon.status}`);

  const a = await openBuilder(browser);
  await openPanel(a.page, "Pages");
  const before = await names(a.page);
  check("Cloud save starts off, with a button to turn it on", (await a.page.locator("[data-cloud=off]").count()) === 1);

  await turnOn(a.page, "Brianna", "wrong-passcode");
  await wait(a.page, 1200);
  const wrong = await a.page.locator(".pb-dialog [role=alert]").innerText().catch(() => "");
  check("A wrong passcode is refused, in plain words", /didn't match/.test(wrong), wrong);
  await a.page.locator(".pb-dialog input[type=password]").fill(PASSCODE);
  await a.page.locator(".pb-dialog button[type=submit]").click();
  await wait(a.page, 2000);
  const listA = await fetch(`${BASE}/api/pages`, { headers: { cookie: (await a.ctx.cookies()).map((c) => `${c.name}=${c.value}`).join("; ") } }).then((r) => r.json());
  check("With the passcode it turns on, and untouched examples stay in their own browser", /Saved to cloud/.test((await status(a.page)) ?? "") && listA.pages.length === 0, `${await status(a.page)}; ${listA.pages.length} pages in the cloud`);

  // Brianna makes a page of her own: a copy of the ST108 example, renamed and edited
  await openPageNamed(a.page, "Example — ST108");
  await a.page.locator(".pb-pagecard.is-active").getByRole("button", { name: "Duplicate" }).click();
  await wait(a.page, 400);
  await a.page.locator(".pb-pagename").fill("ST108 rev 2.2 (BN)");
  const head = a.page.locator(".pb-frame").nth(0).locator(".agx-ed").first();
  await head.click();
  await caretToEnd(a.page);
  await a.page.keyboard.type(" Today");
  await a.page.keyboard.press("Escape");
  await blurAll(a.page);
  await wait(a.page, 3500);
  const saved = await status(a.page);

  // Walter, on another computer
  const b = await openBuilder(browser);
  await turnOn(b.page, "Walter");
  await wait(b.page, 2500);
  await openPanel(b.page, "Pages");
  const seen = await names(b.page);
  const toast = await b.page.locator(".pb-toast").innerText().catch(() => "");
  const card = await b.page.locator(".pb-pagecard", { hasText: "ST108 rev 2.2 (BN)" }).locator("small").innerText().catch(() => "");
  check("A page made in one browser shows up in another, and says so", /Saved to cloud/.test(saved ?? "") && seen.includes("ST108 rev 2.2 (BN)") && /New from the team/.test(toast), `first browser: ${saved}; ${seen.length} pages; “${toast.replace(/\s+/g, " ").slice(0, 70)}”`);
  check("Its card names who saved it", /by Brianna/.test(card), card.replace(/\s+/g, " "));
  await openPageNamed(b.page, "ST108 rev 2.2 (BN)");
  const h1 = await b.page.locator(".pb-frame").nth(0).locator(".agx-ed").first().innerText();
  const imgs = await b.page.locator(".pb-stage img").evaluateAll((els) => els.filter((i) => i.complete && i.naturalWidth > 0).length);
  check("It opens there with its text and pictures", /Today$/.test(h1.trim()) && imgs >= 4 && !b.errors.length, `“${h1.trim()}”, ${imgs} pictures`);
  check("Each browser keeps its own untouched examples, with no second set", seen.length === before.length + 1, `${before.length} → ${seen.length} pages`);

  // Walter changes it; Brianna gets the change
  const sub = b.page.locator(".pb-frame").nth(0).locator(".agx-ed").nth(1);
  await sub.click();
  await caretToEnd(b.page);
  await b.page.keyboard.type(" Checked.");
  await b.page.keyboard.press("Escape");
  await blurAll(b.page);
  await wait(b.page, 3500);
  await sync(a.page);
  await openPageNamed(a.page, "ST108 rev 2.2 (BN)");
  const subA = await a.page.locator(".pb-frame").nth(0).locator(".agx-ed").nth(1).innerText();
  await openPanel(a.page, "Pages");
  const cardA = await a.page.locator(".pb-pagecard", { hasText: "ST108 rev 2.2 (BN)" }).locator("small").innerText();
  check("A change made in the second browser reaches the first, with the new name on it", /Checked\.$/.test(subA.trim()) && /by Walter/.test(cardA), cardA.replace(/\s+/g, " "));

  // Deleting it removes it for everyone
  await openPanel(b.page, "Pages");
  const cardB = b.page.locator(".pb-pagecard", { hasText: "ST108 rev 2.2 (BN)" });
  await cardB.getByRole("button", { name: "Delete" }).click();
  await cardB.getByRole("button", { name: "Yes, delete" }).click();
  await wait(b.page, 1500);
  await sync(a.page);
  check("Deleting a page in one browser removes it in the other", !(await names(a.page)).includes("ST108 rev 2.2 (BN)") && (await names(a.page)).length === before.length);

  // Turning it off keeps the pages here
  await b.page.locator(".pb-saved--btn").first().click();
  await b.page.getByRole("button", { name: "Turn off on this computer" }).click();
  await wait(b.page, 800);
  check("Turning it off on a computer leaves its pages there", (await b.page.locator("[data-cloud=off]").count()) === 1 && (await names(b.page)).length === before.length);
  // (The wrong passcode above answers 401, which the browser logs; that one is expected)
  const real = [...a.errors, ...b.errors].filter((e) => !/401/.test(e));
  check("No errors", !real.length, real[0] ?? "");
  await a.ctx.close();
  await b.ctx.close();
}
