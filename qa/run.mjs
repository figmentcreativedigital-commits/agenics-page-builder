// Runs the QA suites against a production build (`next start`).
//
//   npm run build && npm run qa            every suite
//   npm run qa -- undo typing              some suites
//   npm run qa -- --app ../other-checkout  test another checkout's build (for a baseline)
//
// Each suite opens fresh browser contexts; .share-data is cleared before the server starts.
import { spawn } from "node:child_process";
import { cpSync, existsSync, rmSync } from "node:fs";
import path from "node:path";
import { BASE, QA_DIR, launch, report } from "./lib.mjs";

const ORDER = ["smoke", "undo", "upgrade", "export", "view", "tips", "typing", "tour", "axe", "screens"];

const args = process.argv.slice(2);
const appArg = args.indexOf("--app");
const appDir = path.resolve(appArg >= 0 ? args[appArg + 1] : path.join(QA_DIR, ".."));
const picked = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--app");
const suites = picked.length ? ORDER.filter((s) => picked.includes(s)) : ORDER;
const port = new URL(BASE).port || "3210";

async function waitForServer(url, ms = 30000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try {
      const r = await fetch(url);
      if (r.ok) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

// Never test whatever else happens to be running on the port
if (await fetch(BASE + "/").then(() => true, () => false)) {
  console.error(`Something is already running on ${BASE}. Stop it first, so the suites test this build.`);
  process.exit(1);
}
rmSync(path.join(appDir, ".share-data"), { recursive: true, force: true });
// A share link made by the last release, for the old-pages, accessibility and screenshot suites
const fixtureShares = path.join(QA_DIR, "fixtures", "share-data");
if (existsSync(fixtureShares)) cpSync(fixtureShares, path.join(appDir, ".share-data"), { recursive: true });
const server = spawn(path.join(appDir, "node_modules/.bin/next"), ["start", "-p", port], {
  cwd: appDir,
  stdio: ["ignore", "ignore", "inherit"],
  detached: true,
  env: { ...process.env, BLOB_READ_WRITE_TOKEN: "" },
});
let code = 1;
try {
  if (!(await waitForServer(BASE + "/"))) throw new Error(`The app didn't start on ${BASE}. Run npm run build first.`);
  console.log(`Testing ${appDir} at ${BASE}`);
  const browser = await launch();
  try {
    for (const name of suites) {
      const run = (await import(`./suites/${name}.mjs`)).default;
      try {
        await run(browser, { appDir });
      } catch (e) {
        const { check } = await import("./lib.mjs");
        check(`${name} suite finished`, false, e instanceof Error ? e.message.split("\n")[0] : String(e));
      }
    }
  } finally {
    await browser.close();
  }
  code = report().failed ? 1 : 0;
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
} finally {
  try {
    process.kill(-server.pid);
  } catch {
    server.kill();
  }
}
process.exit(code);
