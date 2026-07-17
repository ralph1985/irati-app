import { describe, expect, it } from "vitest";
import { verifyPasscode } from "./passcode-hash";

const hash =
  "scrypt:v1:16384:8:1:Ard8hKQ-6UtLmQoGJk-zhA:eyaqkuzXUzxNHTz-4i92LNFrrBQTgUx-X0dbfqXNbuoXofWRY-7eaUTUUoNTsUpO0AYyhlTCYvyY61fEjo1dmw";

describe("verifyPasscode", () => {
  it("accepts the matching passcode", () => {
    expect(verifyPasscode("1234", hash)).toBe(true);
  });

  it("rejects a different passcode", () => {
    expect(verifyPasscode("0000", hash)).toBe(false);
  });

  it("rejects malformed hashes", () => {
    expect(verifyPasscode("1234", "not-a-hash")).toBe(false);
  });
});
