import { describe, expect, it } from "vitest";
import { listFriends } from "./list-friends";
import type { FriendEntry } from "../domain/friend-entry";

const rows: FriendEntry[] = [
  {
    adultsLabel: "Familia B",
    childrenLabel: "Niño B",
    groupLabel: "Grupo B",
    id: "b",
    sortOrder: 20,
  },
  {
    adultsLabel: "Familia A",
    childrenLabel: "Niña A",
    groupLabel: "Grupo A",
    id: "a",
    sortOrder: 10,
  },
];

describe("listFriends", () => {
  it("returns entries grouped for the UI", async () => {
    await expect(listFriends({ listFriendEntries: async () => rows })).resolves.toEqual({
      groups: [
        { label: "Grupo A", entries: [rows[1]] },
        { label: "Grupo B", entries: [rows[0]] },
      ],
    });
  });
});
