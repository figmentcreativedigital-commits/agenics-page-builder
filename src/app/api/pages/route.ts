import { NextResponse, type NextRequest } from "next/server";
import { listKeys, storageMode } from "@/lib/share-store";
import { isTeam, latest } from "@/lib/team-server";

/** Every page saved to the cloud: id, last change and whether it was deleted. */
export async function GET(req: NextRequest) {
  if (storageMode() === "off") return NextResponse.json({ error: "Cloud save isn't set up.", code: "not-configured" }, { status: 503 });
  if (!isTeam(req)) return NextResponse.json({ error: "Enter the team passcode to use cloud save.", code: "locked" }, { status: 401 });
  const newest = latest(await listKeys("pages/"));
  const pages = [...newest.values()].map(({ id, updatedAt, deleted }) => ({ id, updatedAt, ...(deleted ? { deleted } : {}) }));
  return NextResponse.json({ pages }, { headers: { "Cache-Control": "no-store" } });
}
