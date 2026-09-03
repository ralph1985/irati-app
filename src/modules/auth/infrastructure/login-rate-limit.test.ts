import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import type { Database } from "@/shared/infrastructure/supabase/database.types";
import { clearLoginAttempts, getLoginClientKey, reserveLoginAttempt } from "./login-rate-limit";

type ServerSupabaseClient = SupabaseClient<Database>;

function createSupabaseMock(results: boolean[] = [true]): ServerSupabaseClient {
  const rpc = vi.fn();

  for (const result of results) {
    rpc.mockResolvedValueOnce({ data: result, error: null });
  }

  return { rpc } as unknown as ServerSupabaseClient;
}

describe("login rate limit", () => {
  it("uses a keyed digest of Vercel's client IP header", () => {
    const headers = new Headers({
      "x-vercel-forwarded-for": "198.51.100.10, 203.0.113.20",
      "x-forwarded-for": "203.0.113.30",
    });

    const key = getLoginClientKey(headers, "test-secret");

    expect(key).toMatch(/^[a-f0-9]{64}$/);
    expect(getLoginClientKey(headers, "test-secret")).toBe(key);
    expect(getLoginClientKey(headers, "other-secret")).not.toBe(key);
  });

  it("does not trust a client-supplied x-forwarded-for fallback", () => {
    const trustedHeaders = new Headers({ "x-vercel-forwarded-for": "198.51.100.10" });
    const spoofedHeaders = new Headers({ "x-forwarded-for": "198.51.100.10" });

    expect(getLoginClientKey(spoofedHeaders, "test-secret")).toBe(
      getLoginClientKey(new Headers(), "test-secret"),
    );
    expect(getLoginClientKey(trustedHeaders, "test-secret")).not.toBe(
      getLoginClientKey(spoofedHeaders, "test-secret"),
    );
  });

  it("blocks the sixth reserved attempt inside the time window", async () => {
    const supabase = createSupabaseMock([true, true, true, true, true, false]);
    const key = "a".repeat(64);

    const attempts = await Promise.all(
      Array.from({ length: 6 }, () => reserveLoginAttempt(supabase, key)),
    );

    expect(attempts).toEqual([true, true, true, true, true, false]);
  });

  it("propagates a persistence error", async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: new Error("database unavailable") }),
    } as unknown as ServerSupabaseClient;

    await expect(reserveLoginAttempt(supabase, "a".repeat(64))).rejects.toThrow(
      "database unavailable",
    );
  });

  it("clears the shared bucket after a successful login", async () => {
    const supabase = createSupabaseMock();
    const key = "b".repeat(64);

    await clearLoginAttempts(supabase, key);

    expect(supabase.rpc).toHaveBeenCalledWith("clear_login_attempts", { p_client_key: key });
  });
});
