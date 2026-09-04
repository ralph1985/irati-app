import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as ts from "typescript";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../");
const appRoot = join(projectRoot, "src", "app");

function listFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
  });
}

function relativeAppPath(filePath: string): string {
  return relative(appRoot, filePath).replaceAll("\\", "/");
}

function isProtectedPage(filePath: string): boolean {
  const path = relativeAppPath(filePath);
  return path.endsWith("/page.tsx") && (path.includes("(app)/") || path === "sueno/atajo/page.tsx");
}

function isProtectedApi(filePath: string): boolean {
  return relativeAppPath(filePath).startsWith("api/") && filePath.endsWith("/route.ts");
}

function isServerActions(filePath: string): boolean {
  const path = relativeAppPath(filePath);
  return path.includes("(app)/") && path.endsWith("/actions.ts");
}

function readEntrypoint(filePath: string): string {
  return readFileSync(filePath, "utf8");
}

describe("protected server entrypoints", () => {
  it("keeps every private page and API behind the session guard", () => {
    const entrypoints = listFiles(appRoot).filter(
      (filePath) => isProtectedPage(filePath) || isProtectedApi(filePath),
    );

    expect(entrypoints.length).toBeGreaterThan(0);

    for (const filePath of entrypoints) {
      const source = readEntrypoint(filePath);

      expect(source, relativeAppPath(filePath)).toContain("hasValidSession");
      expect(source, relativeAppPath(filePath)).toMatch(/await\s+hasValidSession\s*\(/);
    }
  });

  it("keeps every exported server action behind its session guard", () => {
    const actionFiles = listFiles(appRoot).filter(isServerActions);

    expect(actionFiles.length).toBeGreaterThan(0);

    for (const filePath of actionFiles) {
      const source = readEntrypoint(filePath);
      const sourceFile = ts.createSourceFile(
        filePath,
        source,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS,
      );
      const exportedActions = sourceFile.statements.filter(
        (statement): statement is ts.FunctionDeclaration =>
          ts.isFunctionDeclaration(statement) &&
          !!statement.name &&
          !!statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword),
      );

      expect(exportedActions.length, relativeAppPath(filePath)).toBeGreaterThan(0);

      for (const action of exportedActions) {
        const actionSource = action.body ? source.slice(action.body.pos, action.body.end) : "";

        expect(actionSource, `${relativeAppPath(filePath)}:${action.name?.text}`).toMatch(
          /(?:await\s+)?(?:requireSession|hasValidSession)\s*\(/,
        );
      }
    }
  });
});
