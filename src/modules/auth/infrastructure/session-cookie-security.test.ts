import { describe, expect, it } from "vitest";
import { shouldUseSecureSessionCookie } from "./session-cookie-security";

describe("shouldUseSecureSessionCookie", () => {
  it("does not mark cookies secure in local production over http", () => {
    expect(
      shouldUseSecureSessionCookie({
        headers: new Headers(),
        nodeEnv: "production",
        url: "http://localhost:3000/login",
      }),
    ).toBe(false);
  });

  it("marks cookies secure behind an https proxy", () => {
    expect(
      shouldUseSecureSessionCookie({
        headers: new Headers({ "x-forwarded-proto": "https" }),
        nodeEnv: "production",
        url: "http://localhost:3000/login",
      }),
    ).toBe(true);
  });

  it("does not mark cookies secure outside production", () => {
    expect(
      shouldUseSecureSessionCookie({
        headers: new Headers({ "x-forwarded-proto": "https" }),
        nodeEnv: "development",
        url: "https://irati.example/login",
      }),
    ).toBe(false);
  });
});
