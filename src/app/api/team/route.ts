import { NextResponse, type NextRequest } from "next/server";
import { storageMode } from "@/lib/share-store";
import { TEAM_COOKIE, checkPasscode, isTeam, teamConfigured, teamToken } from "@/lib/team-server";

/** Is cloud save set up, and has this browser entered the team passcode? */
export async function GET(req: NextRequest) {
  return NextResponse.json(
    { configured: teamConfigured(), storage: storageMode() !== "off", member: isTeam(req) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/** Enter the team passcode: sets a year-long cookie on this browser. */
export async function POST(req: NextRequest) {
  if (!teamConfigured() || storageMode() === "off") {
    return NextResponse.json({ error: "Cloud save isn't set up for this builder yet.", code: "not-configured" }, { status: 503 });
  }
  const body = (await req.json().catch(() => ({}))) as { passcode?: unknown };
  if (!checkPasscode(body.passcode)) {
    // A short pause makes guessing slow
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: "That passcode didn't match. Check it and try again." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(TEAM_COOKIE, teamToken(), {
    httpOnly: true,
    secure: req.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}

/** Turn cloud save off on this browser. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(TEAM_COOKIE);
  return res;
}
