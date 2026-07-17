import { describe, expect, it } from "vitest";
import { canAttemptLogin, recordFailedLogin } from "./login-rate-limit";

describe("login rate limit", () => {
  it("blocks the sixth failed attempt inside the time window", () => {
    const key = "test-ip-sixth-attempt";
    const now = Date.parse("2026-07-17T00:00:00Z");

    for (let attempt = 0; attempt < 5; attempt += 1) {
      recordFailedLogin(key, now);
    }

    expect(canAttemptLogin(key, now)).toBe(false);
  });

  it("allows attempts again after the time window", () => {
    const key = "test-ip-reset";
    const now = Date.parse("2026-07-17T00:00:00Z");

    for (let attempt = 0; attempt < 5; attempt += 1) {
      recordFailedLogin(key, now);
    }

    expect(canAttemptLogin(key, now + 16 * 60 * 1000)).toBe(true);
  });
});
