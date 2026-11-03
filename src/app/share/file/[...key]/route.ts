import { type NextRequest } from "next/server";
import { loadFile } from "@/lib/share-store";

/** Serves stored preview images (private stores and local development). */
export async function GET(_req: NextRequest, ctx: RouteContext<"/share/file/[...key]">) {
  const { key } = await ctx.params;
  const joined = key.join("/");
  if (!/^files\/[a-f0-9]{24}\.(jpg|png|webp|gif|avif)$/.test(joined)) return new Response("Not found", { status: 404 });
  const file = await loadFile(joined);
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(file.body, {
    headers: { "Content-Type": file.contentType, "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
