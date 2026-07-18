import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/shared/infrastructure/supabase/database.types";

const STALE_AFTER_HOURS = 6;
const STALE_AFTER_MS = STALE_AFTER_HOURS * 60 * 60 * 1000;

export type BackupHealth =
  | {
      status: "empty";
      staleAfterHours: number;
      latestSuccess: null;
      latestFailure: BackupRunSummary | null;
    }
  | {
      status: "success" | "stale";
      staleAfterHours: number;
      latestSuccess: BackupRunSummary;
      latestFailure: BackupRunSummary | null;
    }
  | {
      status: "failed";
      staleAfterHours: number;
      latestSuccess: BackupRunSummary | null;
      latestFailure: BackupRunSummary;
    }
  | {
      status: "unavailable";
      staleAfterHours: number;
      latestSuccess: null;
      latestFailure: null;
    };

export type BackupRunSummary = {
  finishedAt: string;
  fileName: string | null;
  fileSizeBytes: number | null;
  durationMs: number;
  retainedCount: number;
  errorMessage: string | null;
};

type BackupRunRow = Database["public"]["Tables"]["developer_backup_runs"]["Row"];

export async function getBackupHealth(
  supabase: SupabaseClient<Database>,
  now = new Date(),
): Promise<BackupHealth> {
  const { data, error } = await supabase
    .from("developer_backup_runs")
    .select("finished_at,status,file_name,file_size_bytes,duration_ms,retained_count,error_message")
    .order("finished_at", { ascending: false })
    .limit(10);

  if (error) {
    return {
      status: "unavailable",
      staleAfterHours: STALE_AFTER_HOURS,
      latestSuccess: null,
      latestFailure: null,
    };
  }

  const runs = data ?? [];
  const latestSuccess = runs.find((run) => run.status === "success") ?? null;
  const latestFailure = runs.find((run) => run.status === "failed") ?? null;

  if (!latestSuccess && latestFailure) {
    return {
      status: "failed",
      staleAfterHours: STALE_AFTER_HOURS,
      latestSuccess: null,
      latestFailure: toSummary(latestFailure),
    };
  }

  if (!latestSuccess) {
    return {
      status: "empty",
      staleAfterHours: STALE_AFTER_HOURS,
      latestSuccess: null,
      latestFailure: latestFailure ? toSummary(latestFailure) : null,
    };
  }

  const latestSuccessFinishedAt = new Date(latestSuccess.finished_at);
  const latestSuccessIsStale = now.getTime() - latestSuccessFinishedAt.getTime() > STALE_AFTER_MS;

  return {
    status: latestSuccessIsStale ? "stale" : "success",
    staleAfterHours: STALE_AFTER_HOURS,
    latestSuccess: toSummary(latestSuccess),
    latestFailure: latestFailure ? toSummary(latestFailure) : null,
  };
}

function toSummary(
  run: Pick<
    BackupRunRow,
    | "duration_ms"
    | "error_message"
    | "file_name"
    | "file_size_bytes"
    | "finished_at"
    | "retained_count"
  >,
): BackupRunSummary {
  return {
    finishedAt: run.finished_at,
    fileName: run.file_name,
    fileSizeBytes: run.file_size_bytes,
    durationMs: run.duration_ms,
    retainedCount: run.retained_count,
    errorMessage: run.error_message,
  };
}
