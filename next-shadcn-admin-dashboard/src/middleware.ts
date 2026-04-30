import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function hasLaravelSessionCookie(request: NextRequest) {
  const token = request.cookies.get("inventory_token")?.value;
  return Boolean(token && token.trim() !== "");
}

export async function middleware(request: NextRequest) {
  const authenticated = hasLaravelSessionCookie(request);

  if (authenticated) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/auth/v2/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
