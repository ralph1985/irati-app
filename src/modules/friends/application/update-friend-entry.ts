import { normalizeFriendEntryInput, type FriendEntryInput } from "../domain/friend-entry";
import type { FriendMutationRepository } from "./friend-repository";

export async function updateFriendEntry(
  repository: Pick<FriendMutationRepository, "updateFriendEntry">,
  id: string,
  input: FriendEntryInput,
) {
  return repository.updateFriendEntry(id, normalizeFriendEntryInput(input));
}
