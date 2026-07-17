import { afterEach, describe, expect, it, vi } from "vitest";
import { createServerSupabaseClient } from "./server-client";

describe("createServerSupabaseClient", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("requires server Supabase environment variables", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    expect(() => createServerSupabaseClient()).toThrow(
      "Missing Supabase server environment variables",
    );
  });

  it("creates a server client when environment variables exist", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");

    expect(createServerSupabaseClient()).toBeDefined();
  });
});
