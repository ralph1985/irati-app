#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";

const [
  startedAt,
  finishedAt,
  status,
  fileName,
  fileSizeBytes,
  sha256,
  durationMs,
  retainedCount,
  errorMessage,
] = process.argv.slice(2);

if (!startedAt || !finishedAt || !status || !durationMs || !retainedCount) {
  console.error(
    "Usage: record-supabase-backup-run.mjs <started_at> <finished_at> <status> <file_name> <file_size_bytes> <sha256> <duration_ms> <retained_count> <error_message>",
  );
  process.exit(1);
}

const scriptDir = path.dirname(new URL(import.meta.url).pathname);
const repoRoot = path.resolve(scriptDir, "..");
const config = await readSupabaseConfig();
const payload = {
  started_at: startedAt,
  finished_at: finishedAt,
  status,
  file_name: fileName || null,
  file_size_bytes: fileSizeBytes ? Number(fileSizeBytes) : null,
  sha256: sha256 || null,
  duration_ms: Number(durationMs),
  retained_count: Number(retainedCount),
  error_message: errorMessage || null,
};

const response = await fetch(`${config.url}/rest/v1/developer_backup_runs`, {
  method: "POST",
  headers: {
    apikey: config.serviceRoleKey,
    authorization: `Bearer ${config.serviceRoleKey}`,
    "content-type": "application/json",
    prefer: "return=minimal",
  },
  body: JSON.stringify(payload),
});

if (!response.ok) {
  throw new Error(`Could not record backup run: ${response.status}`);
}

async function readSupabaseConfig() {
  const [baseEnv, localEnv] = await Promise.all([
    readEnvFile(path.join(repoRoot, ".env")),
    readEnvFile(path.join(repoRoot, ".env.local")),
  ]);
  const combinedEnv = {
    ...baseEnv,
    ...localEnv,
    ...process.env,
  };
  const url = combinedEnv.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = combinedEnv.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  return { serviceRoleKey, url: url.replace(/\/$/, "") };
}

async function readEnvFile(filePath) {
  try {
    const content = await readFile(filePath, "utf8");

    return Object.fromEntries(
      content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#") && line.includes("="))
        .map((line) => {
          const separatorIndex = line.indexOf("=");
          const key = line.slice(0, separatorIndex);
          const value = line.slice(separatorIndex + 1);

          return [key, stripEnvQuotes(value)];
        }),
    );
  } catch {
    return {};
  }
}

function stripEnvQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}
