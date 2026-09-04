import { SESSION_DURATION_SECONDS } from "../domain/auth-session";

type SecureCookieInput = {
  headers: Pick<Headers, "get">;
  nodeEnv?: string;
  url: string;
};

export type SessionCookieOptions = {
  httpOnly: true;
  maxAge: number;
  path: "/";
  sameSite: "strict";
  secure: boolean;
};

export function shouldUseSecureSessionCookie({
  headers,
  nodeEnv = process.env.NODE_ENV,
  url,
}: SecureCookieInput): boolean {
  if (nodeEnv !== "production") {
    return false;
  }

  const forwardedProto = headers.get("x-forwarded-proto")?.split(",")[0]?.trim();

  if (forwardedProto) {
    return forwardedProto === "https";
  }

  return new URL(url).protocol === "https:";
}

export function getSessionCookieOptions(input: SecureCookieInput): SessionCookieOptions {
  return {
    httpOnly: true,
    maxAge: SESSION_DURATION_SECONDS,
    path: "/",
    sameSite: "strict",
    secure: shouldUseSecureSessionCookie(input),
  };
}
