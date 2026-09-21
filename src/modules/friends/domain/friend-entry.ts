export type FriendEntry = {
  id: string;
  groupLabel: string | null;
  adultsLabel: string;
  childrenLabel: string;
  sortOrder: number;
};

export type FriendEntryInput = {
  groupLabel: string | null | undefined;
  adultsLabel: string;
  childrenLabel: string;
};

export class FriendEntryValidationError extends Error {
  constructor(public readonly messages: string[]) {
    super(messages.join(" "));
    this.name = "FriendEntryValidationError";
  }
}

export function normalizeFriendEntryInput(input: FriendEntryInput): {
  groupLabel: string | null;
  adultsLabel: string;
  childrenLabel: string;
} {
  const groupLabel = input.groupLabel?.trim() || null;
  const adultsLabel = input.adultsLabel.trim();
  const childrenLabel = input.childrenLabel.trim();
  const messages: string[] = [];

  if (!adultsLabel) messages.push("Indica los adultos.");
  if (!childrenLabel) messages.push("Indica los niños.");

  if (messages.length > 0) {
    throw new FriendEntryValidationError(messages);
  }

  return { adultsLabel, childrenLabel, groupLabel };
}

export type FriendGroup = {
  label: string;
  entries: FriendEntry[];
};

export function groupFriendEntries(entries: FriendEntry[]): FriendGroup[] {
  const groups = new Map<string, FriendGroup>();

  for (const entry of [...entries].sort((first, second) => first.sortOrder - second.sortOrder)) {
    const label = entry.groupLabel ?? "Sin grupo";
    const group = groups.get(label) ?? { label, entries: [] };

    group.entries.push(entry);
    groups.set(label, group);
  }

  return [...groups.values()];
}

export function filterFriendGroups(groups: FriendGroup[], query: string): FriendGroup[] {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) return groups;

  return groups
    .map((group) => ({
      ...group,
      entries: group.entries.filter((entry) =>
        [entry.adultsLabel, entry.childrenLabel].some((label) =>
          normalizeSearchText(label).includes(normalizedQuery),
        ),
      ),
    }))
    .filter((group) => group.entries.length > 0);
}

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
