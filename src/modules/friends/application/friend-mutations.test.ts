import { describe, expect, it } from "vitest";
import { createFriendEntry } from "./create-friend-entry";
import type { FriendEntry } from "../domain/friend-entry";
import { renameFriendGroup } from "./rename-friend-group";
import { updateFriendEntry } from "./update-friend-entry";

function mutationRepository() {
  const calls: Record<string, unknown[]> = { create: [], rename: [], update: [] };
  const repository = {
    createFriendEntry: async (input: FriendEntry) => {
      calls.create.push(input);
      return input;
    },
    renameFriendGroup: async (current: string, next: string) => {
      calls.rename.push({ current, next });
    },
    updateFriendEntry: async (id: string, input: FriendEntry) => {
      calls.update.push({ id, input });
      return { ...input, id, sortOrder: 10 };
    },
  };

  return { calls, repository };
}

describe("friend mutation use cases", () => {
  it("normalizes a new entry before saving it", async () => {
    const { calls, repository } = mutationRepository();

    await createFriendEntry(repository, {
      adultsLabel: " Coral y David ",
      childrenLabel: " Darío, Alma y Luna ",
      groupLabel: " Palomares ",
      id: "friend-1",
      sortOrder: 250,
    });

    expect(calls.create).toEqual([
      {
        adultsLabel: "Coral y David",
        childrenLabel: "Darío, Alma y Luna",
        groupLabel: "Palomares",
        id: "friend-1",
        sortOrder: 250,
      },
    ]);
  });

  it("updates the requested entry without changing its literal id", async () => {
    const { calls, repository } = mutationRepository();

    await updateFriendEntry(repository, "palomares-coral-david", {
      adultsLabel: "Coral y David",
      childrenLabel: "Darío, Alma y Luna",
      groupLabel: "Palomares",
    });

    expect(calls.update).toEqual([
      {
        id: "palomares-coral-david",
        input: {
          adultsLabel: "Coral y David",
          childrenLabel: "Darío, Alma y Luna",
          groupLabel: "Palomares",
        },
      },
    ]);
  });

  it("renames a group after trimming both labels", async () => {
    const { calls, repository } = mutationRepository();

    await renameFriendGroup(repository, " Kamikazes ", " Amigos del parque ");

    expect(calls.rename).toEqual([{ current: "Kamikazes", next: "Amigos del parque" }]);
  });
});
