/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Turn an installed npm package into an {@link AcpLaunchSpec}.
 *
 * WHY A SPEC AND NOT A PATH
 * -------------------------
 * The generic ACP spawn runs with `shell: false` and has no `.cmd`/`.bat`
 * branch (`acpConnectors.ts`). Node cannot execute a Windows shim that way, and
 * the legacy `cliPath` string path also goes through `parseWindowsCliPath`,
 * which shreds paths containing spaces. So this module never emits a path into
 * `node_modules/.bin` and never emits a bare string: it emits `{command, args}`
 * where `command` is a real executable.
 *
 * RESOLUTION ORDER
 * ----------------
 *  1. A native per-triple executable, preferred whenever one exists. It needs
 *     no JS runtime at launch time, which matters because the bundled Bun is
 *     ABSENT on win32-arm64 and on non-AVX2 win32-x64.
 *  2. Otherwise the package's `bin` entry, when it is a plain `.js`/`.mjs`/
 *     `.cjs` script, launched through the runtime `resolveJsRuntime()` picks.
 *  3. Otherwise a named throw. Never a half-built spec.
 *
 * NATIVE LAYOUTS COVERED
 * ----------------------
 * Two shapes have been observed in the wild, so both are probed:
 *  - the vendor tree inside the package itself
 *    (`<pkg>/vendor/<triple>/…`), and
 *  - the vendor tree in the platform-specific optional dependency
 *    (`<pkg>-<platform>-<arch>/vendor/<triple>/…`), which is what
 *    `@openai/codex@0.147.0` actually ships:
 *    `@openai/codex-darwin-arm64/vendor/aarch64-apple-darwin/bin/codex`.
 */

import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import type { AcpLaunchSpec } from '@/common/types/acpTypes';
import { resolveJsRuntime } from '@process/utils/jsRuntime';

/** Thrown when an installed package yields neither a native binary nor a JS entry. */
export class LaunchSpecUnresolvedError extends Error {
  readonly npmPackage: string;
  readonly prefix: string;

  constructor(npmPackage: string, prefix: string, detail: string) {
    super(`Cannot resolve a launch spec for "${npmPackage}" under ${prefix}: ${detail}`);
    this.name = 'LaunchSpecUnresolvedError';
    this.npmPackage = npmPackage;
    this.prefix = prefix;
  }
}

/**
 * Rust target triples keyed by `<platform>:<arch>`. Mirrors the table inside
 * `@openai/codex`'s own `bin/codex.js`, which is the authority for the vendor
 * directory names we probe.
 */
const TRIPLE_BY_PLATFORM_ARCH: Readonly<Record<string, string>> = Object.freeze({
  'linux:x64': 'x86_64-unknown-linux-musl',
  'linux:arm64': 'aarch64-unknown-linux-musl',
  'darwin:x64': 'x86_64-apple-darwin',
  'darwin:arm64': 'aarch64-apple-darwin',
  'win32:x64': 'x86_64-pc-windows-msvc',
  'win32:arm64': 'aarch64-pc-windows-msvc',
});

/** The target triple for a platform/arch pair, or null when there is no mapping. */
export function resolveTargetTriple(platform: NodeJS.Platform, arch: string): string | null {
  return TRIPLE_BY_PLATFORM_ARCH[`${platform}:${arch}`] ?? null;
}

/** Script extensions the JS runtime can execute directly. */
const JS_ENTRY_EXTENSIONS = new Set(['.js', '.mjs', '.cjs']);

export interface LaunchSpecInputs {
  /** Install prefix; the package lives at `<prefix>/node_modules/<npmPackage>`. */
  prefix: string;
  npmPackage: string;
  platform: NodeJS.Platform;
  arch: string;
  /** Executable used to run a plain `.js`/`.mjs`/`.cjs` entry. */
  jsRuntimeCommand: string;
  /**
   * Env that `jsRuntimeCommand` itself needs, from the same `resolveJsRuntime()`
   * answer. UNPACKAGED that is `{ ELECTRON_RUN_AS_NODE: '1' }` and dropping it
   * launches an Electron window instead of Node; packaged runtimes need nothing
   * and pass `{}`. Recorded on the spec only when non-empty, so a packaged
   * receipt is byte-identical to one written before `env` existed.
   */
  jsRuntimeEnv?: Record<string, string>;
}

function isFile(candidate: string): boolean {
  try {
    return existsSync(candidate) && statSync(candidate).isFile();
  } catch {
    return false;
  }
}

/** The directory an installed package occupies inside a prefix. */
export function resolvePackageDir(prefix: string, npmPackage: string): string {
  return path.join(prefix, 'node_modules', ...npmPackage.split('/'));
}

interface PackageBin {
  /** Command name the package publishes (`codex`, `kimi`, `openclaw`). */
  name: string;
  /** Entry path relative to the package directory. */
  entry: string;
}

/**
 * Read the `bin` field. npm allows either a string (bin name = unscoped package
 * name) or an object of name → entry; the first object entry is used, matching
 * how a single-bin package is always written.
 */
function readPackageBin(pkgDir: string): PackageBin | null {
  let parsed: { name?: unknown; bin?: unknown };
  try {
    parsed = JSON.parse(readFileSync(path.join(pkgDir, 'package.json'), 'utf-8')) as typeof parsed;
  } catch {
    return null;
  }

  if (typeof parsed.bin === 'string' && parsed.bin.length > 0) {
    const declared = typeof parsed.name === 'string' ? parsed.name : '';
    const unscoped = declared.startsWith('@') ? declared.split('/')[1] : declared;
    if (!unscoped) return null;
    return { name: unscoped, entry: parsed.bin };
  }

  if (parsed.bin !== null && typeof parsed.bin === 'object') {
    for (const [name, entry] of Object.entries(parsed.bin as Record<string, unknown>)) {
      if (typeof entry === 'string' && entry.length > 0) return { name, entry };
    }
  }

  return null;
}

/**
 * Candidate native executable paths inside one vendor root, in preference
 * order. `<vendorRoot>/vendor/<triple>/` is the shared prefix.
 */
function nativeCandidates(vendorRoot: string, triple: string, binName: string, platform: NodeJS.Platform): string[] {
  const exe = platform === 'win32' ? '.exe' : '';
  const base = path.join(vendorRoot, 'vendor', triple);
  return [
    path.join(base, 'bin', `${binName}${exe}`),
    path.join(base, binName, `${binName}${exe}`),
    path.join(base, `${binName}${exe}`),
  ];
}

/**
 * The native per-triple executable an installed package ships, or null.
 *
 * Extracted from {@link resolveLaunchSpecWith} step 1 because a SECOND caller
 * needs the same answer for a different reason: `@agentclientprotocol/codex-acp`
 * is a JS bridge that drives a native `codex` binary, and the binary it should
 * drive is the one in the same prefix, named absolutely, rather than whatever
 * `codex` resolution the bridge would perform for itself. Both probe layouts
 * and both vendor roots are shared, so they cannot drift apart.
 */
export function resolveNativeExecutable(inputs: {
  prefix: string;
  npmPackage: string;
  /** Command name inside the vendor tree (`codex`), not the package name. */
  binName: string;
  platform: NodeJS.Platform;
  arch: string;
}): string | null {
  const triple = resolveTargetTriple(inputs.platform, inputs.arch);
  if (!triple) return null;
  const pkgDir = resolvePackageDir(inputs.prefix, inputs.npmPackage);
  const vendorRoots = [pkgDir, `${pkgDir}-${inputs.platform}-${inputs.arch}`];
  for (const vendorRoot of vendorRoots) {
    for (const candidate of nativeCandidates(vendorRoot, triple, inputs.binName, inputs.platform)) {
      if (isFile(candidate)) return candidate;
    }
  }
  return null;
}

/** True when `child` is inside `parent` (or is `parent`). */
function isContained(parent: string, child: string): boolean {
  const rel = path.relative(path.resolve(parent), path.resolve(child));
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
}

/**
 * Pure resolution core: takes platform/arch/runtime explicitly so the decision
 * is unit testable against fixture trees on any host. Mirrors the
 * `resolveJsRuntimeWith` / `resolveJsRuntime` split this repo already uses.
 */
export function resolveLaunchSpecWith(inputs: LaunchSpecInputs): AcpLaunchSpec {
  const { prefix, npmPackage, platform, arch, jsRuntimeCommand, jsRuntimeEnv } = inputs;
  const pkgDir = resolvePackageDir(prefix, npmPackage);

  const bin = readPackageBin(pkgDir);
  if (!bin) {
    throw new LaunchSpecUnresolvedError(npmPackage, prefix, 'package.json is missing or declares no usable "bin"');
  }

  // 1. Native per-triple executable, preferred.
  const native = resolveNativeExecutable({ prefix, npmPackage, binName: bin.name, platform, arch });
  if (native) return { command: native, args: [] };

  // 2. JS entry through the resolved runtime.
  const entryPath = path.join(pkgDir, bin.entry);
  if (!isContained(pkgDir, entryPath)) {
    // `bin` comes from a downloaded package.json; never follow it out of the package.
    throw new LaunchSpecUnresolvedError(npmPackage, prefix, `"bin" entry escapes the package directory: ${bin.entry}`);
  }
  if (JS_ENTRY_EXTENSIONS.has(path.extname(entryPath).toLowerCase()) && isFile(entryPath)) {
    // Only this branch can need an env: the native branch above returns a real
    // executable that runs on its own. Omit the key entirely when there is
    // nothing to carry, rather than writing an empty object into the receipt.
    const hasEnv = jsRuntimeEnv !== undefined && Object.keys(jsRuntimeEnv).length > 0;
    return hasEnv
      ? { command: jsRuntimeCommand, args: [entryPath], env: { ...jsRuntimeEnv } }
      : { command: jsRuntimeCommand, args: [entryPath] };
  }

  // 3. Nothing resolved.
  throw new LaunchSpecUnresolvedError(
    npmPackage,
    prefix,
    `no native binary for ${resolveTargetTriple(platform, arch) ?? `${platform}/${arch}`} and no runnable JS entry at ${entryPath}`
  );
}

/** Resolve a launch spec for the current process's platform, arch and runtime. */
export function resolveLaunchSpec(prefix: string, npmPackage: string): AcpLaunchSpec {
  // Both halves of the SAME answer. Taking `.command` without `.env` is the bug
  // this pair exists to prevent (see AcpLaunchSpec.env).
  const runtime = resolveJsRuntime();
  return resolveLaunchSpecWith({
    prefix,
    npmPackage,
    platform: process.platform,
    arch: process.arch,
    jsRuntimeCommand: runtime.command,
    jsRuntimeEnv: runtime.env,
  });
}
