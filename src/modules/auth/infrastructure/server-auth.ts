import { cookies } from "next/headers";
import { AUTH_SESSION_COOKIE } from "../domain/auth-session";
import { getRequiredEnv } from "./env";
import { verifySessionToken } from "./session-token";

export async function hasValidSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(AUTH_SESSION_COOKIE)?.value;

  try {
    return verifySessionToken(sessionToken, getRequiredEnv("SESSION_SECRET"));
  } catch {
    return false;
  }
}
