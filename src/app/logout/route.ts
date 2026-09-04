import { NextResponse } from "next/server";
import { AUTH_SESSION_COOKIE } from "@/modules/auth/domain/auth-session";
import { getSessionCookieOptions } from "@/modules/auth/infrastructure/session-cookie-security";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url), 303);

  response.cookies.set(AUTH_SESSION_COOKIE, "", {
    ...getSessionCookieOptions(request),
    expires: new Date(0),
    maxAge: 0,
  });

  return response;
}
