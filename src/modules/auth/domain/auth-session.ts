export const AUTH_SESSION_COOKIE = "irati_session";

export type AuthSession = {
  authenticatedAt: number;
  expiresAt: number;
};

export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;
