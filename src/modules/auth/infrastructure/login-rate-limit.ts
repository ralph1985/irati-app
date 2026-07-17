type AttemptBucket = {
  count: number;
  resetAt: number;
};

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map<string, AttemptBucket>();

export function canAttemptLogin(key: string, now = Date.now()): boolean {
  const bucket = attempts.get(key);

  return !bucket || bucket.resetAt <= now || bucket.count < MAX_ATTEMPTS;
}

export function recordFailedLogin(key: string, now = Date.now()): void {
  const bucket = attempts.get(key);

  if (!bucket || bucket.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }

  bucket.count += 1;
}

export function clearLoginAttempts(key: string): void {
  attempts.delete(key);
}
