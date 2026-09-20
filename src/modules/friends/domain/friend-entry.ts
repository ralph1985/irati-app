export type FriendEntry = {
  id: string;
  groupLabel: string | null;
  adultsLabel: string;
  childrenLabel: string;
  sortOrder: number;
};

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
