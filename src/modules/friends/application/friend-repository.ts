import type { FriendEntry } from "../domain/friend-entry";

export type FriendRepository = {
  listFriendEntries(): Promise<FriendEntry[]>;
};
