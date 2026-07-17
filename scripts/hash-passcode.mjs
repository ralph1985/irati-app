import { randomBytes, scryptSync } from "node:crypto";

const [passcode] = process.argv.slice(2).filter((argument) => argument !== "--");

if (!passcode) {
  console.error("Usage: pnpm auth:hash -- <passcode>");
  process.exit(1);
}

const N = 16384;
const r = 8;
const p = 1;
const salt = randomBytes(16);
const hash = scryptSync(passcode, salt, 64, { N, r, p });

console.log(
  ["scrypt", "v1", N, r, p, salt.toString("base64url"), hash.toString("base64url")].join(":"),
);
