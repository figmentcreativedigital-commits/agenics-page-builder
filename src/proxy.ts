import { NextResponse, type NextRequest } from "next/server";

/**
 * Optional password gate. Set BASIC_AUTH_USER and BASIC_AUTH_PASSWORD in Vercel
 * to require a login; leave them unset to keep the app open (or use Vercel's own
 * Deployment Protection instead).
 */
export function proxy(req: NextRequest) {
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASSWORD;
  if (!user || !pass) return NextResponse.next();

  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    const decoded = atob(auth.slice(6));
    const i = decoded.indexOf(":");
    if (i > -1 && decoded.slice(0, i) === user && decoded.slice(i + 1) === pass) return NextResponse.next();
  }
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Agenics Page Builder"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|brand/|icon|robots.txt).*)"],
};
