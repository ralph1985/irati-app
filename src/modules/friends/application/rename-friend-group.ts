import { FriendEntryValidationError } from "../domain/friend-entry";
import type { FriendMutationRepository } from "./friend-repository";

export async function renameFriendGroup(
  repository: Pick<FriendMutationRepository, "renameFriendGroup">,
  currentLabel: string,
  nextLabel: string,
) {
  const current = currentLabel.trim();
  const next = nextLabel.trim();

  if (!current || !next || current === next) {
    throw new FriendEntryValidationError(["El nombre del grupo no es válido."]);
  }

  await repository.renameFriendGroup(current, next);
}
