import { describe, expect, it } from "vitest";
import { getSessionCookieOptions, shouldUseSecureSessionCookie } from "./session-cookie-security";

describe("getSessionCookieOptions", () => {
  it("uses strict, host-only session cookie defaults", () => {
    expect(
      getSessionCookieOptions({
        headers: new Headers({ "x-forwarded-proto": "https" }),
        nodeEnv: "production",
        url: "https://irati.example/login",
      }),
    ).toEqual({
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "strict",
      secure: true,
    });
  });
});

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
