import * as fs from 'fs';
import * as path from 'path';

export type UsageBreakdownItem = {
  label: string;
  bytes: number;
  color: string;
};

export type UsageResult = {
  total: number;
  used: number;
  breakdown: UsageBreakdownItem[];
  computedAt: number;
};

/** Walk a directory recursively and sum file sizes. Returns 0 if the dir does not exist. */
async function dirSize(dirPath: string): Promise<number> {
  if (!fs.existsSync(dirPath)) return 0;

  let total = 0;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        total += await dirSize(full);
      } else if (entry.isFile()) {
        try {
          const stat = fs.statSync(full);
          total += stat.size;
        } catch {
          // ignore permission errors on individual files
        }
      }
    })
  );

  return total;
}

let cachedResult: UsageResult | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function computeUsage(userData: string, logsDir: string): Promise<UsageResult> {
  if (cachedResult && Date.now() - cachedResult.computedAt < CACHE_TTL_MS) {
    return cachedResult;
  }

  const conversationsDir = path.join(userData, 'conversations');
  const cacheDir = path.join(userData, 'cache');

  const [conversationBytes, cacheBytes, logBytes] = await Promise.all([
    dirSize(conversationsDir),
    dirSize(cacheDir),
    dirSize(logsDir),
  ]);

  const used = conversationBytes + cacheBytes + logBytes;

  const result: UsageResult = {
    total: 0, // disk total not queried - renderer shows used only
    used,
    breakdown: [
      { label: 'conversations', bytes: conversationBytes, color: 'var(--primary)' },
      { label: 'cache', bytes: cacheBytes, color: 'var(--warning)' },
      { label: 'logs', bytes: logBytes, color: 'var(--text-muted)' },
    ],
    computedAt: Date.now(),
  };

  cachedResult = result;
  return result;
}

/** Force-invalidate the cache (call after clear/reset operations). */
export function invalidateUsageCache(): void {
  cachedResult = null;
}
