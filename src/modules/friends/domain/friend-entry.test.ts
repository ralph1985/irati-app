import { describe, expect, it } from "vitest";
import {
  filterFriendGroups,
  groupFriendEntries,
  normalizeFriendEntryInput,
  FriendEntryValidationError,
  type FriendEntry,
} from "./friend-entry";

const entries: FriendEntry[] = [
  {
    adultsLabel: "Familia A",
    childrenLabel: "Niña A",
    groupLabel: "Grupo A",
    id: "a-2",
    sortOrder: 20,
  },
  {
    adultsLabel: "Familia sin grupo",
    childrenLabel: "Niño B",
    groupLabel: null,
    id: "b-1",
    sortOrder: 30,
  },
  {
    adultsLabel: "Familia A primera",
    childrenLabel: "Niño C y Niña D",
    groupLabel: "Grupo A",
    id: "a-1",
    sortOrder: 10,
  },
];

describe("groupFriendEntries", () => {
  it("orders entries and preserves the first-seen order of groups", () => {
    expect(groupFriendEntries(entries)).toEqual([
      {
        label: "Grupo A",
        entries: [entries[2], entries[0]],
      },
      {
        label: "Sin grupo",
        entries: [entries[1]],
      },
    ]);
  });

  it("does not mutate the source list", () => {
    const source = [...entries];
    groupFriendEntries(source);
    expect(source).toEqual(entries);
  });

  it("filters entries by parents or children without accents", () => {
    const groups = groupFriendEntries(entries);

    expect(filterFriendGroups(groups, "nina d")).toEqual([
      {
        label: "Grupo A",
        entries: [entries[2]],
      },
    ]);
    expect(filterFriendGroups(groups, "familia sin grupo")).toEqual([
      {
        label: "Sin grupo",
        entries: [entries[1]],
      },
    ]);
  });
});

describe("normalizeFriendEntryInput", () => {
  it("recorta etiquetas y convierte un grupo vacío en null", () => {
    expect(
      normalizeFriendEntryInput({
        adultsLabel: "  Coral y David  ",
        childrenLabel: "  Darío, Alma y Luna  ",
        groupLabel: "   ",
      }),
    ).toEqual({
      adultsLabel: "Coral y David",
      childrenLabel: "Darío, Alma y Luna",
      groupLabel: null,
    });
  });

  it("rechaza adultos o niños vacíos", () => {
    expect(() =>
      normalizeFriendEntryInput({
        adultsLabel: " ",
        childrenLabel: "Leire",
        groupLabel: "Kamikazes",
      }),
    ).toThrow(FriendEntryValidationError);
  });
});
