import { NextRequest, NextResponse } from "next/server";
import { AUTH_SESSION_COOKIE, SESSION_DURATION_SECONDS } from "@/modules/auth/domain/auth-session";
import { getRequiredEnv } from "@/modules/auth/infrastructure/env";
import {
  clearLoginAttempts,
  getLoginClientKey,
  reserveLoginAttempt,
} from "@/modules/auth/infrastructure/login-rate-limit";
import { verifyPasscode } from "@/modules/auth/infrastructure/passcode-hash";
import { shouldUseSecureSessionCookie } from "@/modules/auth/infrastructure/session-cookie-security";
import { createSessionToken } from "@/modules/auth/infrastructure/session-token";
import { createServerSupabaseClient } from "@/shared/infrastructure/supabase/server-client";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const passcode = String(formData.get("passcode") ?? "");
  const redirectUrl = new URL("/", request.url);

  const passcodeHash = getEnvOrRedirect("IRATI_PASSCODE_HASH", redirectUrl);

  if (passcodeHash instanceof NextResponse) {
    return passcodeHash;
  }

  const sessionSecret = getEnvOrRedirect("SESSION_SECRET", redirectUrl);

  if (sessionSecret instanceof NextResponse) {
    return sessionSecret;
  }

  let supabase: ReturnType<typeof createServerSupabaseClient>;

  try {
    supabase = createServerSupabaseClient();
  } catch {
    redirectUrl.searchParams.set("error", "config");
    return NextResponse.redirect(redirectUrl, 303);
  }

  const clientKey = getLoginClientKey(request.headers, sessionSecret);

  let canAttempt: boolean;

  try {
    canAttempt = await reserveLoginAttempt(supabase, clientKey);
  } catch {
    redirectUrl.searchParams.set("error", "config");
    return NextResponse.redirect(redirectUrl, 303);
  }

  if (!canAttempt) {
    redirectUrl.searchParams.set("error", "rate-limit");
    return NextResponse.redirect(redirectUrl, 303);
  }

  if (!verifyPasscode(passcode, passcodeHash)) {
    redirectUrl.searchParams.set("error", "invalid");
    return NextResponse.redirect(redirectUrl, 303);
  }

  try {
    await clearLoginAttempts(supabase, clientKey);
  } catch {
    redirectUrl.searchParams.set("error", "config");
    return NextResponse.redirect(redirectUrl, 303);
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
function getEnvOrRedirect(name: string, redirectUrl: URL): string | NextResponse {
  try {
    return getRequiredEnv(name);
  } catch {
    redirectUrl.searchParams.set("error", "config");
    return NextResponse.redirect(redirectUrl, 303);
  }
}
