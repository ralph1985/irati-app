import { describe, expect, it } from "vitest";
import { updateBabyProfile } from "./update-baby-profile";

describe("updateBabyProfile", () => {
  it("normalizes and saves the CIPA", async () => {
    const result = await updateBabyProfile(
      {
        async updateBabyProfile(profile) {
          return {
            name: "Irati",
            birthDate: "2026-07-02",
            cipa: profile.cipa,
          };
        },
      },
      { cipa: "  1234567890  " },
    );

    expect(result.cipa).toBe("1234567890");
  });

  it("allows clearing the CIPA with an empty value", async () => {
    const result = await updateBabyProfile(
      {
        async updateBabyProfile(profile) {
          return {
            name: "Irati",
            birthDate: "2026-07-02",
            cipa: profile.cipa,
          };
        },
      },
      { cipa: " " },
    );

    expect(result.cipa).toBeNull();
  });

  it("rejects invalid CIPA values", async () => {
    await expect(
      updateBabyProfile(
        {
          async updateBabyProfile(profile) {
            return {
              name: "Irati",
              birthDate: "2026-07-02",
              cipa: profile.cipa,
            };
          },
        },
        { cipa: "a".repeat(33) },
      ),
    ).rejects.toThrow("El CIPA no puede superar 32 caracteres.");
  });
});
