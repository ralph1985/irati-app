import { createHmac, timingSafeEqual } from "node:crypto";
import { AuthSession, SESSION_DURATION_SECONDS } from "../domain/auth-session";

export function createSessionToken(secret: string, now = new Date()): string {
  const authenticatedAt = Math.floor(now.getTime() / 1000);
  const session: AuthSession = {
    authenticatedAt,
    expiresAt: authenticatedAt + SESSION_DURATION_SECONDS,
  };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const signature = sign(payload, secret);

  return `${payload}.${signature}`;
}

export function verifySessionToken(
  token: string | undefined,
  secret: string,
  now = new Date(),
): boolean {
  if (!token) {
    return false;
  }

  const [payload, signature] = token.split(".");

  if (!payload || !signature || !safeEqual(signature, sign(payload, secret))) {
    return false;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AuthSession;
    const currentTimestamp = Math.floor(now.getTime() / 1000);

    return session.expiresAt > currentTimestamp;
  } catch {
    return false;
  }
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(value: string, expected: string): boolean {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);

  return (
    valueBuffer.length === expectedBuffer.length && timingSafeEqual(valueBuffer, expectedBuffer)
  );
}
