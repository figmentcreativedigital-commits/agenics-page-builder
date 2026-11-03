import { NextResponse, type NextRequest } from "next/server";
import { loadJson, remove, saveJson, storageMode } from "@/lib/share-store";
import { SHARE_FORMAT, cleanPage, hashSecret, newId, newSecret, shareKey, validId, type ShareDoc } from "@/lib/share-server";

const NOT_SET_UP = {
  error: "Sharing needs a one-time setup: connect a Vercel Blob store to this project, then redeploy.",
  code: "not-configured",
};

async function authorised(id: unknown, secret: unknown): Promise<ShareDoc | null> {
  if (!validId(id) || typeof secret !== "string") return null;
  const doc = await loadJson<ShareDoc>(shareKey(id));
  if (!doc || doc.secretHash !== hashSecret(secret)) return null;
  return doc;
}

/** Create a preview link, or update it when the id and secret are sent. */
export async function POST(req: NextRequest) {
  if (storageMode() === "off") return NextResponse.json(NOT_SET_UP, { status: 503 });
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > 1_500_000) return NextResponse.json({ error: "This page is too large to share." }, { status: 413 });

  let body: { id?: string; secret?: string; page?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Could not read the page." }, { status: 400 });
  }
  const page = cleanPage(body.page);
  if (!page) return NextResponse.json({ error: "That is not a page from the Agenics Page Builder." }, { status: 400 });

  let id: string;
  let secret: string;
  if (body.id) {
    const existing = await authorised(body.id, body.secret);
    if (!existing) return NextResponse.json({ error: "This link can only be updated from the browser that created it." }, { status: 403 });
    id = existing.id;
    secret = body.secret as string;
  } else {
    id = newId();
    secret = newSecret();
  }

  const publishedAt = Date.now();
  const doc: ShareDoc = { format: SHARE_FORMAT, id, secretHash: hashSecret(secret), publishedAt, page };
  await saveJson(shareKey(id), doc);
  return NextResponse.json({ id, secret, url: `${req.nextUrl.origin}/share/${id}`, publishedAt });
}

/** Stop sharing: the link stops working for everyone. */
export async function DELETE(req: NextRequest) {
  if (storageMode() === "off") return NextResponse.json(NOT_SET_UP, { status: 503 });
  const body = (await req.json().catch(() => ({}))) as { id?: string; secret?: string };
  const doc = await authorised(body.id, body.secret);
  if (!doc) return NextResponse.json({ error: "This link can only be turned off from the browser that created it." }, { status: 403 });
  await remove(shareKey(doc.id));
  return NextResponse.json({ ok: true });
}
