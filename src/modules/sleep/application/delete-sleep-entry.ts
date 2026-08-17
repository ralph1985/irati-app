import type { SleepRepository } from "./sleep-repository";

export async function deleteSleepEntry(
  repository: Pick<SleepRepository, "deleteSleepEntry">,
  id: string,
): Promise<void> {
  if (!id) {
    throw new Error("Missing sleep entry id");
  }

  await repository.deleteSleepEntry(id);
}
