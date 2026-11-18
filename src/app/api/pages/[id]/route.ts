import { NextResponse, type NextRequest } from "next/server";
import { listKeys, loadJson, remove, saveJson, storageMode } from "@/lib/share-store";
import {
  CLOUD_FORMAT,
  cleanCloudPage,
  cleanUploads,
  isTeam,
  latest,
  pageKey,
  parseKey,
  tombstoneKey,
  validPageId,
  type CloudDoc,
} from "@/lib/team-server";

const MAX = 4_000_000;

function guard(req: NextRequest, id: string) {
  if (storageMode() === "off") return NextResponse.json({ error: "Cloud save isn't set up.", code: "not-configured" }, { status: 503 });
  if (!isTeam(req)) return NextResponse.json({ error: "Enter the team passcode to use cloud save.", code: "locked" }, { status: 401 });
  if (!validPageId(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return null;
}

const keysFor = async (id: string) => (await listKeys(`pages/${id}/`)).filter((k) => parseKey(k)?.id === id);

/** The newest saved copy of one page, with the addresses of its uploaded images. */
export async function GET(req: NextRequest, ctx: RouteContext<"/api/pages/[id]">) {
  const { id } = await ctx.params;
  const bad = guard(req, id);
  if (bad) return bad;
  const entry = latest(await keysFor(id)).get(id);
  if (!entry || entry.deleted) return NextResponse.json({ error: "This page was deleted or never saved." }, { status: 404 });
  const doc = await loadJson<CloudDoc>(entry.key);
  if (!doc) return NextResponse.json({ error: "This page could not be read." }, { status: 404 });
  return NextResponse.json({ page: doc.page, uploads: doc.uploads ?? {} }, { headers: { "Cache-Control": "no-store" } });
}

/** Save a page. Older copies of it are removed once the new one is stored. */
export async function PUT(req: NextRequest, ctx: RouteContext<"/api/pages/[id]">) {
  const { id } = await ctx.params;
  const bad = guard(req, id);
  if (bad) return bad;
  if (Number(req.headers.get("content-length") ?? 0) > MAX) return NextResponse.json({ error: "This page is too large to save." }, { status: 413 });
  const body = (await req.json().catch(() => null)) as { page?: unknown; uploads?: unknown } | null;
  const page = cleanCloudPage(body?.page, id);
  if (!page) return NextResponse.json({ error: "That is not a page from the Agenics Page Builder." }, { status: 400 });

  const keys = await keysFor(id);
  const current = latest(keys).get(id);
  if (current?.deleted && current.updatedAt >= page.updatedAt) {
    return NextResponse.json({ error: "This page was deleted on another computer.", code: "deleted" }, { status: 409 });
  }
  if (current && !current.deleted && current.updatedAt > page.updatedAt) {
    return NextResponse.json({ error: "A newer copy of this page is already saved.", code: "stale", updatedAt: current.updatedAt }, { status: 409 });
  }
  const key = pageKey(id, page.updatedAt);
  const doc: CloudDoc = { format: CLOUD_FORMAT, page, uploads: cleanUploads(body?.uploads), savedAt: Date.now() };
  await saveJson(key, doc);
  await remove(keys.filter((k) => k !== key));
  return NextResponse.json({ ok: true, updatedAt: page.updatedAt });
}

/** Delete a page for everyone. A small marker stays so other computers delete their copy too. */
export async function DELETE(req: NextRequest, ctx: RouteContext<"/api/pages/[id]">) {
  const { id } = await ctx.params;
  const bad = guard(req, id);
  if (bad) return bad;
  const keys = await keysFor(id);
  const at = Date.now();
  await saveJson(tombstoneKey(id, at), { id, deletedAt: at });
  await remove(keys);
  return NextResponse.json({ ok: true });
}
