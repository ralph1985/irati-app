import { scryptSync, timingSafeEqual } from "node:crypto";

type ParsedScryptHash = {
  N: number;
  r: number;
  p: number;
  salt: Buffer;
  hash: Buffer;
};

export function verifyPasscode(passcode: string, encodedHash: string): boolean {
  const parsedHash = parseScryptHash(encodedHash);

  if (!parsedHash) {
    return false;
  }

  const candidate = scryptSync(passcode, parsedHash.salt, parsedHash.hash.length, {
    N: parsedHash.N,
    r: parsedHash.r,
    p: parsedHash.p,
  });

  return timingSafeEqual(candidate, parsedHash.hash);
}

function parseScryptHash(encodedHash: string): ParsedScryptHash | null {
  const [algorithm, version, N, r, p, salt, hash] = encodedHash.split(":");

  if (algorithm !== "scrypt" || version !== "v1" || !N || !r || !p || !salt || !hash) {
    return null;
  }

  return {
    N: Number(N),
    r: Number(r),
    p: Number(p),
    salt: Buffer.from(salt, "base64url"),
    hash: Buffer.from(hash, "base64url"),
  };
}
