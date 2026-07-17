import { describe, expect, it } from "vitest";
import { getBabyProfile } from "./get-baby-profile";

describe("getBabyProfile", () => {
  it("returns the database profile when available", async () => {
    const result = await getBabyProfile({
      async getBabyProfile() {
        return {
          name: "Irati",
          birthDate: "2026-07-02",
        };
      },
    });

    expect(result).toEqual({
      profile: {
        name: "Irati",
        birthDate: "2026-07-02",
      },
      source: "database",
    });
  });

  it("falls back to the configured Irati profile when unavailable", async () => {
    const result = await getBabyProfile({
      async getBabyProfile() {
        return null;
      },
    });

    expect(result.source).toBe("fallback");
    expect(result.profile.name).toBe("Irati");
  });
});
