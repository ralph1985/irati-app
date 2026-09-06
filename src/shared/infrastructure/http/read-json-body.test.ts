import { describe, expect, it } from "vitest";
import { MAX_JSON_BODY_BYTES, readJsonBody, toJsonBodyError } from "./read-json-body";

describe("readJsonBody", () => {
  it("parses a JSON request within the size limit", async () => {
    const request = new Request("http://irati.test/api", {
      body: JSON.stringify({ kind: "nap" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    await expect(readJsonBody(request)).resolves.toEqual({ kind: "nap" });
  });

  it("rejects malformed JSON without exposing parser details", async () => {
    const request = new Request("http://irati.test/api", {
      body: "{ malformed",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    await expect(readJsonBody(request)).rejects.toMatchObject({
      message: "Invalid JSON",
      status: 400,
    });
  });

  it("rejects non-JSON media types", async () => {
    const request = new Request("http://irati.test/api", {
      body: "{}",
      headers: { "Content-Type": "text/plain" },
      method: "POST",
    });

    await expect(readJsonBody(request)).rejects.toMatchObject({
      message: "Unsupported media type",
      status: 415,
    });
  });

  it("rejects a body above the limit even without Content-Length", async () => {
    const request = new Request("http://irati.test/api", {
      body: "x".repeat(MAX_JSON_BODY_BYTES + 1),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    await expect(readJsonBody(request)).rejects.toMatchObject({
      message: "Payload too large",
      status: 413,
    });
  });

  it("rejects a declared body above the limit before reading it", async () => {
    const request = new Request("http://irati.test/api", {
      body: "{}",
      headers: {
        "Content-Length": String(MAX_JSON_BODY_BYTES + 1),
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    await expect(readJsonBody(request)).rejects.toMatchObject({
      message: "Payload too large",
      status: 413,
    });
  });
});

describe("toJsonBodyError", () => {
  it("normalizes unexpected parser failures", () => {
    expect(toJsonBodyError(new Error("internal parser detail"))).toMatchObject({
      message: "Invalid JSON",
      status: 400,
    });
  });
});
