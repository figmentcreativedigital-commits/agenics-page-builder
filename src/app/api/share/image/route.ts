import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { saveFile, storageMode } from "@/lib/share-store";

const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};
const MAX = 4_000_000;

/** Store one image for a shared preview. The browser shrinks anything over the limit first. */
export async function POST(req: NextRequest) {
  if (storageMode() === "off") return NextResponse.json({ error: "Sharing is not set up yet.", code: "not-configured" }, { status: 503 });
  const type = (req.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  const ext = TYPES[type];
  if (!ext) return NextResponse.json({ error: "Only JPG, PNG, WebP, GIF or AVIF images can be shared." }, { status: 415 });
  const body = await req.arrayBuffer();
  if (!body.byteLength || body.byteLength > MAX) return NextResponse.json({ error: "Image is too large to share." }, { status: 413 });
  const key = `files/${randomBytes(12).toString("hex")}.${ext}`;
  const url = await saveFile(key, body, type);
  return NextResponse.json({ url });
}
