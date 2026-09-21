import { normalizeFriendEntryInput, type FriendEntryInput } from "../domain/friend-entry";
import type { FriendMutationRepository } from "./friend-repository";

export async function createFriendEntry(
  repository: Pick<FriendMutationRepository, "createFriendEntry">,
  input: FriendEntryInput & { id: string; sortOrder: number },
) {
  return repository.createFriendEntry({
    ...input,
    ...normalizeFriendEntryInput(input),
  });
}
