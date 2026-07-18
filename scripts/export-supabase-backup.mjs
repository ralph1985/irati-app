#!/usr/bin/env node

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const [schemaOutputPath, dataOutputPath] = process.argv.slice(2);

if (!schemaOutputPath || !dataOutputPath) {
  console.error("Usage: export-supabase-backup.mjs <schema.sql> <data.sql>");
  process.exit(1);
}

const scriptDir = path.dirname(new URL(import.meta.url).pathname);
const repoRoot = path.resolve(scriptDir, "..");
const migrationsDir = path.join(repoRoot, "supabase", "migrations");

const tableDefinitions = [
  {
    name: "baby_profiles",
    order: "created_at.asc",
    columns: ["id", "name", "birth_date", "created_at", "updated_at"],
    conflictColumns: ["id"],
  },
  {
    name: "planned_vaccine_doses",
    order: "planned_date.asc",
    columns: [
      "id",
      "vaccine_name",
      "dose_label",
      "planned_date",
      "age_label",
      "notes",
      "created_at",
      "updated_at",
    ],
    conflictColumns: ["id"],
  },
  {
    name: "weight_entries",
    order: "measured_on.asc",
    columns: ["id", "measured_on", "weight_grams", "place", "notes", "created_at", "updated_at"],
    conflictColumns: ["id"],
  },
  {
    name: "applied_vaccine_doses",
    order: "applied_on.asc",
    columns: [
      "id",
      "planned_dose_id",
      "applied_on",
      "vaccine_name",
      "dose_label",
      "place",
      "lot",
      "notes",
      "created_at",
      "updated_at",
    ],
    conflictColumns: ["id"],
  },
  {
    name: "developer_backup_runs",
    order: "created_at.asc",
    columns: [
      "id",
      "started_at",
      "finished_at",
      "status",
      "file_name",
      "file_size_bytes",
      "sha256",
      "duration_ms",
      "retained_count",
      "error_message",
      "created_at",
    ],
    conflictColumns: ["id"],
  },
];

const config = await readSupabaseConfig();
const rowsByTable = Object.fromEntries(
  await Promise.all(
    tableDefinitions.map(async (table) => [table.name, await fetchRows(table.name, table.order)]),
  ),
);

await writeFile(schemaOutputPath, await buildSchemaSql(), "utf8");
await writeFile(dataOutputPath, buildDataSql(rowsByTable), "utf8");

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

async function fetchRows(tableName, order) {
  const params = new URLSearchParams({ select: "*" });
  params.set("order", order);

  const response = await fetch(`${config.url}/rest/v1/${tableName}?${params.toString()}`, {
    headers: {
      apikey: config.serviceRoleKey,
      authorization: `Bearer ${config.serviceRoleKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Could not fetch ${tableName}: ${response.status}`);
  }

  return response.json();
}

async function buildSchemaSql() {
  const migrationFiles = (await readdir(migrationsDir))
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort();
  const migrations = await Promise.all(
    migrationFiles.map(async (fileName) => {
      const content = await readFile(path.join(migrationsDir, fileName), "utf8");

      return `-- ${fileName}\n${content.trim()}\n`;
    }),
  );

  return [
    "-- Irati Supabase schema backup",
    `-- Generated at ${new Date().toISOString()}`,
    "",
    ...migrations,
  ].join("\n");
}

function buildDataSql(rowsByTable) {
  const statements = [
    "-- Irati Supabase data backup",
    `-- Generated at ${new Date().toISOString()}`,
    "",
    "begin;",
    "",
    "delete from public.applied_vaccine_doses;",
    "delete from public.weight_entries;",
    "delete from public.planned_vaccine_doses;",
    "delete from public.baby_profiles;",
    "delete from public.developer_backup_runs;",
    "",
    ...tableDefinitions.map((table) =>
      buildInsertStatement(
        table.name,
        table.columns,
        rowsByTable[table.name] ?? [],
        table.conflictColumns,
      ),
    ),
    "commit;",
    "",
  ];

  return statements.filter(Boolean).join("\n");
}

function buildInsertStatement(tableName, columns, rows, conflictColumns) {
  if (rows.length === 0) {
    return "";
  }

  const columnList = columns.map((column) => `"${column}"`).join(", ");
  const values = rows
    .map((row) => `(${columns.map((column) => sqlValue(row[column])).join(", ")})`)
    .join(",\n");
  const conflictTarget = conflictColumns.map((column) => `"${column}"`).join(", ");
  const updateColumns = columns.filter((column) => !conflictColumns.includes(column));
  const updateClause =
    updateColumns.length > 0
      ? ` do update set ${updateColumns
          .map((column) => `"${column}" = excluded."${column}"`)
          .join(", ")}`
      : " do nothing";

  return `insert into public.${tableName} (${columnList}) values\n${values}\non conflict (${conflictTarget})${updateClause};\n`;
}

function sqlValue(value) {
  if (value === null || value === undefined) {
    return "null";
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "null";
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return sqlString(value);
}

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}
