/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Install a pinned agent package into its own prefix.
 *
 * The command is the one that was verified against the real binaries:
 *
 *   <bun> install --cwd <prefix> --ignore-scripts --no-save <pkg>@<version>
 *
 * `--ignore-scripts` is LOAD-BEARING and must never be dropped. Installing
 * these agents pulls in transitive dependencies that declare install hooks
 * (kimi-code drags in node-pty; openclaw's tree has five). Without the flag,
 * `bun install` would execute arbitrary vendor code inside the user's profile
 * as a side effect of clicking "install". A test asserts on the literal argv
 * for exactly this reason.
 *
 * Bun is not universally available: `getBundledBunDir()` returns null on
 * win32-arm64 (no bun asset is published for that target, and we ship it) and
 * on non-AVX2 win32-x64 (the baseline build is pinned but never staged for
 * win32). That case raises {@link BundledBunUnavailableError} — a named error,
 * never a crash and never a silent no-op — and nothing is written to disk.
 */

import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import type { AcpLaunchSpec } from '@/common/types/acpTypes';
import { getBundledBunDir } from '@process/utils/shellEnv';

import { getAgentPackage } from './agentPackages';
import { type AgentInstallReceipt, readInstallReceipt, writeInstallReceipt } from './installManifest';
import { assertValidAgentId, resolveAgentInstallPrefix } from './installPrefix';
import { resolveLaunchSpec, resolvePackageDir } from './launchSpecResolver';

/** Thrown when no bundled bun exists for this platform/arch. */
export class BundledBunUnavailableError extends Error {
  readonly agentId: string;

  constructor(agentId: string) {
    super(
      `Cannot install "${agentId}": no bundled bun runtime for ${process.platform}/${process.arch}. ` +
        `Agent installs require the bundled bun; this build does not ship one for this target.`
    );
    this.name = 'BundledBunUnavailableError';
    this.agentId = agentId;
  }
}

/** Thrown when the install process exits non-zero. */
export class InstallCommandFailedError extends Error {
  readonly exitCode: number | null;
  readonly stderr: string;

  constructor(agentId: string, exitCode: number | null, stderr: string) {
    super(`Install of "${agentId}" failed with exit code ${String(exitCode)}: ${stderr.trim().slice(0, 500)}`);
    this.name = 'InstallCommandFailedError';
    this.exitCode = exitCode;
    this.stderr = stderr;
  }
}

/** Thrown when the install reported success but the package is not on disk. */
export class PackageNotInstalledError extends Error {
  constructor(agentId: string, npmPackage: string, prefix: string) {
    super(`Install of "${agentId}" reported success but ${npmPackage} is not present under ${prefix}`);
    this.name = 'PackageNotInstalledError';
  }
}

export interface InstallSpawnResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

/** The process runner. Injected in tests so nothing hits the network. */
export type InstallSpawn = (command: string, args: string[]) => Promise<InstallSpawnResult>;

export interface InstallAgentOptions {
  /** Override the userData root. Tests pass a temp dir. */
  userDataDir?: string;
  /**
   * Override bun resolution. Pass `null` to exercise the unavailable path.
   * Omit entirely to resolve the real bundled bun.
   */
  bunPath?: string | null;
  spawn?: InstallSpawn;
  now?: () => Date;
}

/** Binary name of the bundled bun on a platform. */
function bunBinaryName(platform: NodeJS.Platform): string {
  return platform === 'win32' ? 'bun.exe' : 'bun';
}

/** Full path to the bundled bun binary, or null when this build ships none. */
export function resolveBundledBunPath(): string | null {
  const dir = getBundledBunDir();
  return dir === null ? null : path.join(dir, bunBinaryName(process.platform));
}

/**
 * Pin the install to THIS directory by giving it its own package.json.
 *
 * `bun install --cwd <dir>` does not stay in <dir>: it walks UP looking for a
 * package root, and if any ancestor already has node_modules it installs THERE
 * and leaves <dir> empty. Verified by execution - installing into a nested
 * prefix under a directory that already had node_modules put the package in the
 * parent and created nothing in the target at all.
 *
 * In the shipped layout agent prefixes are siblings under <userData>/agents, so
 * nothing should sit above them - but "should" is doing a lot of work there.
 * A userData path inside a checkout, or any future directory that acquires a
 * node_modules, silently turns per-agent isolation into one shared tree. An
 * anchor file costs nothing and removes the class.
 *
 * `private: true` so the directory can never be mistaken for a publishable
 * package. Written only when absent, so a reinstall keeps whatever bun wrote.
 */
function anchorPrefix(prefix: string, agentId: string): void {
  const manifestPath = path.join(prefix, 'package.json');
  if (existsSync(manifestPath)) return;
  writeFileSync(
    manifestPath,
    `${JSON.stringify({ name: `wayland-agent-${agentId}`, private: true, version: '0.0.0' }, null, 2)}\n`,
    'utf-8'
  );
}

/**
 * The verified install argv. `--ignore-scripts` and `--no-save` are part of the
 * contract, not conveniences.
 */
export function buildInstallArgs(prefix: string, npmPackage: string, version: string): string[] {
  return ['install', '--cwd', prefix, '--ignore-scripts', '--no-save', `${npmPackage}@${version}`];
}

const defaultInstallSpawn: InstallSpawn = (command, args) =>
  new Promise((resolve) => {
    execFile(
      command,
      args,
      { shell: false, windowsHide: true, maxBuffer: 8 * 1024 * 1024, encoding: 'utf-8' },
      (error, stdout, stderr) => {
        if (!error) return resolve({ code: 0, stdout, stderr });
        const code = typeof (error as { code?: unknown }).code === 'number' ? (error as { code: number }).code : 1;
        resolve({ code, stdout, stderr: stderr || error.message });
      }
    );
  });

/** True when the package directory really landed under the prefix. */
function packageIsPresent(prefix: string, npmPackage: string): boolean {
  return existsSync(path.join(resolvePackageDir(prefix, npmPackage), 'package.json'));
}

export interface AgentInstallReport extends AgentInstallReceipt {
  launchSpec: AcpLaunchSpec;
}

/**
 * Install an agent end to end.
 *
 * Order matters: the id is validated and bun is resolved BEFORE anything is
 * created on disk, so a bad id or a missing bun leaves the filesystem untouched.
 */
export async function installAgent(agentId: string, options: InstallAgentOptions = {}): Promise<AgentInstallReport> {
  assertValidAgentId(agentId);
  const pkg = getAgentPackage(agentId);
  const prefix = resolveAgentInstallPrefix(agentId, options.userDataDir);

  const bunPath = options.bunPath !== undefined ? options.bunPath : resolveBundledBunPath();
  if (bunPath === null || bunPath === '') throw new BundledBunUnavailableError(agentId);

  mkdirSync(prefix, { recursive: true });
  anchorPrefix(prefix, agentId);

  const args = buildInstallArgs(prefix, pkg.npmPackage, pkg.version);
  const spawn = options.spawn ?? defaultInstallSpawn;
  const result = await spawn(bunPath, args);
  if (result.code !== 0) throw new InstallCommandFailedError(agentId, result.code, result.stderr);

  if (!packageIsPresent(prefix, pkg.npmPackage)) {
    throw new PackageNotInstalledError(agentId, pkg.npmPackage, prefix);
  }

  const launchSpec = resolveLaunchSpec(prefix, pkg.npmPackage);
  const receipt: AgentInstallReceipt = {
    agentId,
    npmPackage: pkg.npmPackage,
    version: pkg.version,
    prefix,
    launchSpec,
    installedAt: (options.now?.() ?? new Date()).toISOString(),
  };
  writeInstallReceipt(receipt);
  return receipt;
}

/**
 * Why an install is not usable. A prefix that exists is NOT evidence of an
 * install: a run that died between `mkdir` and the receipt write leaves the
 * directory behind, and reporting that as installed hides the failure.
 */
export type AgentInstallStatusReason =
  | 'ok'
  | 'prefix-missing'
  | 'package-missing'
  | 'receipt-missing'
  | 'launch-target-missing';

export interface AgentInstallStatus {
  agentId: string;
  prefix: string;
  installed: boolean;
  reason: AgentInstallStatusReason;
  receipt: AgentInstallReceipt | null;
}

/** Report whether an agent is actually installed and launchable. */
export function getAgentInstallStatus(agentId: string, userDataDir?: string): AgentInstallStatus {
  const prefix = resolveAgentInstallPrefix(agentId, userDataDir);
  const base = { agentId, prefix, installed: false, receipt: null as AgentInstallReceipt | null };

  if (!existsSync(prefix)) return { ...base, reason: 'prefix-missing' };

  const receipt = readInstallReceipt(prefix);
  if (!packageIsPresent(prefix, getAgentPackage(agentId).npmPackage)) {
    return { ...base, receipt, reason: 'package-missing' };
  }
  if (!receipt) return { ...base, reason: 'receipt-missing' };

  // For a native spec the command IS the payload; for the JS fallback the
  // command is the runtime (always present) and the script in args[0] is the
  // thing that can go missing. Check both, or a deleted entry point reads as ok.
  const payload = receipt.launchSpec.args[0] ?? receipt.launchSpec.command;
  if (!existsSync(receipt.launchSpec.command) || !existsSync(payload)) {
    return { ...base, receipt, reason: 'launch-target-missing' };
  }

  return { agentId, prefix, installed: true, reason: 'ok', receipt };
}
