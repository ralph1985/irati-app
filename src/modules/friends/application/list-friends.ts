import { groupFriendEntries, type FriendGroup } from "../domain/friend-entry";
import type { FriendRepository } from "./friend-repository";

export type Friends = {
  groups: FriendGroup[];
};

export async function listFriends(repository: FriendRepository): Promise<Friends> {
  return { groups: groupFriendEntries(await repository.listFriendEntries()) };
}
