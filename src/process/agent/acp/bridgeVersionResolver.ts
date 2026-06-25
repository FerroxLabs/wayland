/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Resolve the LATEST published version of an ACP bridge npm package at runtime,
 * so Wayland always spawns the newest bridge (new models, new features) instead
 * of a hardcoded pin that silently goes stale. Wayland was pinned to
 * claude-agent-acp@0.33.1 (default model Opus 4.7) while the registry was at
 * 0.44.0 (Opus 4.8) - that whole class of staleness disappears when we discover
 * the latest instead of pinning.
 *
 * Safety net: the supplied `fallback` version is used when the registry is
 * unreachable (offline, blocked, slow). The result is cached per package for a
 * few hours so we query at most once per window, not once per agent spawn.
 */

const REGISTRY = 'https://registry.npmjs.org';
const RESOLVE_TIMEOUT_MS = 4000;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

type CacheEntry = { version: string; at: number };
const versionCache = new Map<string, CacheEntry>();

/** Allow an explicit pin via env to override discovery (e.g. when a latest release breaks). */
function envOverride(pkgName: string): string | null {
  // CLAUDE_AGENT_ACP_VERSION style: uppercase, non-alnum -> underscore, suffix _VERSION.
  const key = `${pkgName.replace(/[^a-z0-9]+/gi, '_').toUpperCase().replace(/^_+|_+$/g, '')}_VERSION`;
  const v = process.env[key];
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : null;
}

/**
 * Return the latest published version of `pkgName`, falling back to `fallback`
 * on any failure. An env override (see envOverride) wins over discovery.
 */
export async function resolveLatestBridgeVersion(pkgName: string, fallback: string): Promise<string> {
  const override = envOverride(pkgName);
  if (override) return override;

  const cached = versionCache.get(pkgName);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.version;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), RESOLVE_TIMEOUT_MS);
    let version: string;
    try {
      const res = await fetch(`${REGISTRY}/${pkgName}/latest`, {
        signal: controller.signal,
        headers: { accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`registry responded ${res.status}`);
      const data = (await res.json()) as { version?: unknown };
      if (typeof data.version !== 'string' || data.version.length === 0) {
        throw new Error('registry response had no version');
      }
      version = data.version;
    } finally {
      clearTimeout(timer);
    }
    versionCache.set(pkgName, { version, at: Date.now() });
    return version;
  } catch (err) {
    console.warn(`[bridgeVersion] could not resolve latest ${pkgName}; using fallback ${fallback}:`, err);
    return fallback;
  }
}

/**
 * Build the `<name>@<version>` string to hand to npx/bunx, resolving the latest
 * version with a fallback. The `fallbackPackage` is the full pinned string (e.g.
 * `@scope/name@0.44.0`); its name is reused and its version is the fallback.
 */
export async function resolveBridgePackage(fallbackPackage: string): Promise<string> {
  const { name, version } = splitPackage(fallbackPackage);
  if (!name) return fallbackPackage;
  const resolved = await resolveLatestBridgeVersion(name, version || 'latest');
  return `${name}@${resolved}`;
}

/** Split `@scope/name@1.2.3` (or `name@1.2.3`) into { name, version }. */
export function splitPackage(pkg: string): { name: string; version: string } {
  const at = pkg.lastIndexOf('@');
  // A leading '@' (scope) is not a version separator.
  if (at <= 0) return { name: pkg, version: '' };
  return { name: pkg.slice(0, at), version: pkg.slice(at + 1) };
}
