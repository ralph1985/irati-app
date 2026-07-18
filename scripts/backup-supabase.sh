#!/usr/bin/env bash
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="${IRATI_SUPABASE_BACKUP_DIR:-$REPO_ROOT/var/backups/supabase}"
LOG_DIR="${IRATI_SUPABASE_LOG_DIR:-$REPO_ROOT/var/log}"
RETENTION_DAYS="${IRATI_SUPABASE_BACKUP_RETENTION_DAYS:-14}"
NODE_BIN="${NODE_BIN:-node}"

STARTED_AT="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
STAMP="$(date -u +"%Y%m%dT%H%M%SZ")"
START_SECONDS="$(date -u +%s)"
ARCHIVE_NAME="irati-supabase-${STAMP}.sql.tar.gz"
ARCHIVE_PATH="$BACKUP_DIR/$ARCHIVE_NAME"
TEMP_DIR=""

cleanup() {
  if [[ -n "$TEMP_DIR" && -d "$TEMP_DIR" ]]; then
    rm -rf "$TEMP_DIR"
  fi
}

duration_ms() {
  local finished_seconds
  finished_seconds="$(date -u +%s)"
  printf "%s" "$(((finished_seconds - START_SECONDS) * 1000))"
}

count_retained_backups() {
  find "$BACKUP_DIR" -type f -name "irati-supabase-*.sql.tar.gz" | wc -l | tr -d " "
}

record_backup_run() {
  "$NODE_BIN" "$SCRIPT_DIR/record-supabase-backup-run.mjs" "$@"
}

run_backup() {
  mkdir -p "$BACKUP_DIR" "$LOG_DIR"
  TEMP_DIR="$(mktemp -d)"

  "$NODE_BIN" "$SCRIPT_DIR/export-supabase-backup.mjs" \
    "$TEMP_DIR/schema.sql" \
    "$TEMP_DIR/data.sql" || return 1

  {
    printf "backup_started_at=%s\n" "$STARTED_AT"
    printf "backup_file=%s\n" "$ARCHIVE_NAME"
    printf "schema_file=schema.sql\n"
    printf "data_file=data.sql\n"
  } > "$TEMP_DIR/manifest.txt"

  tar -czf "$ARCHIVE_PATH.tmp" -C "$TEMP_DIR" schema.sql data.sql manifest.txt || return 1
  mv "$ARCHIVE_PATH.tmp" "$ARCHIVE_PATH" || return 1

  find "$BACKUP_DIR" -type f -name "irati-supabase-*.sql.tar.gz" -mtime +"$RETENTION_DAYS" -delete
}

main() {
  trap cleanup EXIT

  if run_backup; then
    local finished_at
    local file_size_bytes
    local sha256
    local retained_count

    finished_at="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    file_size_bytes="$(stat -c "%s" "$ARCHIVE_PATH")"
    sha256="$(sha256sum "$ARCHIVE_PATH" | awk '{print $1}')"
    retained_count="$(count_retained_backups)"

    record_backup_run \
      "$STARTED_AT" \
      "$finished_at" \
      "success" \
      "$ARCHIVE_NAME" \
      "$file_size_bytes" \
      "$sha256" \
      "$(duration_ms)" \
      "$retained_count" \
      "" || printf "Backup created, but metadata could not be recorded in Supabase.\n" >&2

    printf "Backup created: %s\n" "$ARCHIVE_PATH"
    return 0
  fi

  local finished_at
  local retained_count
  finished_at="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  mkdir -p "$BACKUP_DIR"
  retained_count="$(count_retained_backups)"

  record_backup_run \
    "$STARTED_AT" \
    "$finished_at" \
    "failed" \
    "" \
    "" \
    "" \
    "$(duration_ms)" \
    "$retained_count" \
    "Supabase backup command failed." || true

  printf "Supabase backup failed.\n" >&2
  return 1
}

main "$@"
