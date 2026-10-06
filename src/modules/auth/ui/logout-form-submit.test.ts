import { describe, expect, it } from "vitest";
import { clearAndSubmitLogout } from "./logout-form-submit";

describe("clearAndSubmitLogout", () => {
  it("submits the captured form after clearing local data", async () => {
    const events: string[] = [];
    const form = {
      submit: () => events.push("submitted"),
    };

    await clearAndSubmitLogout(form, async () => {
      events.push("cleared");
    });

    expect(events).toEqual(["cleared", "submitted"]);
  });

  it("does not submit when clearing local data fails", async () => {
    let submitted = false;
    const form = {
      submit: () => {
        submitted = true;
      },
    };

    await expect(
      clearAndSubmitLogout(form, async () => {
        throw new Error("clear failed");
      }),
    ).rejects.toThrow("clear failed");

    expect(submitted).toBe(false);
  });
});
