import { NextRequest, NextResponse } from "next/server";
import { AUTH_SESSION_COOKIE, SESSION_DURATION_SECONDS } from "@/modules/auth/domain/auth-session";
import { getRequiredEnv } from "@/modules/auth/infrastructure/env";
import {
  canAttemptLogin,
  clearLoginAttempts,
  recordFailedLogin,
} from "@/modules/auth/infrastructure/login-rate-limit";
import { verifyPasscode } from "@/modules/auth/infrastructure/passcode-hash";
import { shouldUseSecureSessionCookie } from "@/modules/auth/infrastructure/session-cookie-security";
import { createSessionToken } from "@/modules/auth/infrastructure/session-token";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const passcode = String(formData.get("passcode") ?? "");
  const redirectUrl = new URL("/", request.url);
  const clientKey = getClientKey(request);

  if (!canAttemptLogin(clientKey)) {
    redirectUrl.searchParams.set("error", "rate-limit");
    return NextResponse.redirect(redirectUrl, 303);
  }

  const passcodeHash = getEnvOrRedirect("IRATI_PASSCODE_HASH", redirectUrl);

  if (passcodeHash instanceof NextResponse) {
    return passcodeHash;
  }

  if (!verifyPasscode(passcode, passcodeHash)) {
    recordFailedLogin(clientKey);
    redirectUrl.searchParams.set("error", "invalid");
    return NextResponse.redirect(redirectUrl, 303);
  }

  clearLoginAttempts(clientKey);

  const sessionSecret = getEnvOrRedirect("SESSION_SECRET", redirectUrl);

  if (sessionSecret instanceof NextResponse) {
    return sessionSecret;
  }

  const response = NextResponse.redirect(redirectUrl, 303);
  response.cookies.set(AUTH_SESSION_COOKIE, createSessionToken(sessionSecret), {
    httpOnly: true,
    maxAge: SESSION_DURATION_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: shouldUseSecureSessionCookie(request),
  });

  return response;
}

function getClientKey(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

function getEnvOrRedirect(name: string, redirectUrl: URL): string | NextResponse {
  try {
    return getRequiredEnv(name);
  } catch {
    redirectUrl.searchParams.set("error", "config");
    return NextResponse.redirect(redirectUrl, 303);
  }
}
