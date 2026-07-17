import { describe, expect, it } from "vitest";
import { createSessionToken, verifySessionToken } from "./session-token";

describe("session tokens", () => {
  it("accepts a signed and unexpired session", () => {
    const token = createSessionToken("secret", new Date("2026-07-17T00:00:00Z"));

    expect(verifySessionToken(token, "secret", new Date("2026-07-18T00:00:00Z"))).toBe(true);
  });

  it("rejects tokens signed with a different secret", () => {
    const token = createSessionToken("secret", new Date("2026-07-17T00:00:00Z"));

    expect(verifySessionToken(token, "other-secret", new Date("2026-07-18T00:00:00Z"))).toBe(false);
  });

  it("rejects expired sessions", () => {
    const token = createSessionToken("secret", new Date("2026-07-17T00:00:00Z"));

    expect(verifySessionToken(token, "secret", new Date("2026-08-17T00:00:01Z"))).toBe(false);
  });
});
