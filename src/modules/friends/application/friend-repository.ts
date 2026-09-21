import type { FriendEntry, FriendEntryInput } from "../domain/friend-entry";

export type FriendRepository = {
  listFriendEntries(): Promise<FriendEntry[]>;
};

export type FriendMutationRepository = FriendRepository & {
  createFriendEntry(
    input: FriendEntryInput & { id: string; sortOrder: number },
  ): Promise<FriendEntry>;
  updateFriendEntry(id: string, input: FriendEntryInput): Promise<FriendEntry>;
  renameFriendGroup(currentLabel: string, nextLabel: string): Promise<void>;
};
