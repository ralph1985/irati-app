import { describe, expect, it } from "vitest";
import { getBackupHealth } from "./backup-health";

function supabaseWithRuns(runs: unknown[]) {
  return {
    from: () => ({
      select: () => ({
        order: () => ({
          limit: () => Promise.resolve({ data: runs, error: null }),
        }),
      }),
    }),
  } as never;
}

function failingSupabase() {
  return {
    from: () => ({
      select: () => ({
        order: () => ({
          limit: () => Promise.resolve({ data: null, error: new Error("nope") }),
        }),
      }),
    }),
  } as never;
}

describe("getBackupHealth", () => {
  it("marks backup as successful when the latest success is recent", async () => {
    const health = await getBackupHealth(
      supabaseWithRuns([
        {
          status: "success",
          finished_at: "2026-07-18T10:00:00Z",
          file_name: "irati-supabase.sql.tar.gz",
          file_size_bytes: 1024,
          duration_ms: 1000,
          retained_count: 1,
          error_message: null,
        },
      ]),
      new Date("2026-07-18T12:00:00Z"),
    );

    expect(health.status).toBe("success");
  });

  it("marks backup as stale when the latest success is older than six hours", async () => {
    const health = await getBackupHealth(
      supabaseWithRuns([
        {
          status: "success",
          finished_at: "2026-07-18T04:00:00Z",
          file_name: "irati-supabase.sql.tar.gz",
          file_size_bytes: 1024,
          duration_ms: 1000,
          retained_count: 1,
          error_message: null,
        },
      ]),
      new Date("2026-07-18T12:00:00Z"),
    );

    expect(health.status).toBe("stale");
  });

  it("reports failure when there is no successful backup", async () => {
    const health = await getBackupHealth(
      supabaseWithRuns([
        {
          status: "failed",
          finished_at: "2026-07-18T10:00:00Z",
          file_name: null,
          file_size_bytes: null,
          duration_ms: 1000,
          retained_count: 0,
          error_message: "Supabase backup command failed.",
        },
      ]),
      new Date("2026-07-18T12:00:00Z"),
    );

    expect(health.status).toBe("failed");
  });

  it("reports unavailable when metadata cannot be read", async () => {
    const health = await getBackupHealth(failingSupabase());

    expect(health.status).toBe("unavailable");
  });
});
