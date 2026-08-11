/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Install receipts, and the uninstall that reads them.
 *
 * UNINSTALL GOES BY MANIFEST, NEVER BY NAME.
 *
 * A name-driven uninstall ("delete everything that looks like codex") deletes
 * things the installer never created. This module writes a receipt at install
 * time recording exactly what landed, and `uninstallAgent` removes only the
 * prefix that receipt names. No receipt → nothing is removed, and the caller is
 * told why. A receipt that disagrees with the computed prefix (tampered, hand
 * edited, copied from another profile) is refused rather than followed.
 */

import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { type AcpLaunchSpec, isAcpLaunchSpec } from '@/common/types/acpTypes';

import { resolveAgentInstallPrefix } from './installPrefix';

/** Receipt filename, written at the root of the agent's install prefix. */
export const RECEIPT_FILENAME = '.wayland-agent-install.json';

export interface AgentInstallReceipt {
  agentId: string;
  npmPackage: string;
  /** Exact version that was installed. */
  version: string;
  /** Absolute install prefix. The only thing uninstall is allowed to remove. */
  prefix: string;
  /** The launch spec resolved at install time. */
  launchSpec: AcpLaunchSpec;
  /** ISO-8601 timestamp. */
  installedAt: string;
}

/** Thrown when a receipt exists but does not describe the agent being uninstalled. */
export class ReceiptMismatchError extends Error {
  constructor(agentId: string, detail: string) {
    super(`Refusing to uninstall "${agentId}": ${detail}`);
    this.name = 'ReceiptMismatchError';
  }
}

/** Path of the receipt for a given install prefix. */
export function resolveReceiptPath(prefix: string): string {
  return path.join(prefix, RECEIPT_FILENAME);
}

/** Write (or overwrite) the receipt for an install. */
export function writeInstallReceipt(receipt: AgentInstallReceipt): void {
  mkdirSync(receipt.prefix, { recursive: true });
  const target = resolveReceiptPath(receipt.prefix);
  // Write-then-rename so a crash mid-write cannot leave a truncated receipt,
  // which readInstallReceipt would treat as "no receipt" and refuse to act on.
  const scratch = `${target}.tmp`;
  writeFileSync(scratch, `${JSON.stringify(receipt, null, 2)}\n`, 'utf-8');
  renameSync(scratch, target);
}

/**
 * Read and validate a receipt. Returns null when it is absent, unreadable, or
 * malformed — all of which must behave identically at the uninstall seam: do
 * not delete anything.
 */
export function readInstallReceipt(prefix: string): AgentInstallReceipt | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(resolveReceiptPath(prefix), 'utf-8'));
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;

  const candidate = parsed as Record<string, unknown>;
  const strings = ['agentId', 'npmPackage', 'version', 'prefix', 'installedAt'] as const;
  for (const key of strings) {
    if (typeof candidate[key] !== 'string' || (candidate[key] as string).length === 0) return null;
  }
  if (!isAcpLaunchSpec(candidate.launchSpec)) return null;

  return {
    agentId: candidate.agentId as string,
    npmPackage: candidate.npmPackage as string,
    version: candidate.version as string,
    prefix: candidate.prefix as string,
    launchSpec: candidate.launchSpec,
    installedAt: candidate.installedAt as string,
  };
}

export interface UninstallReport {
  agentId: string;
  /** The prefix that was considered. */
  prefix: string;
  removed: boolean;
  /** Why nothing was removed. Absent when `removed` is true. */
  reason?: 'receipt-missing';
}

/**
 * Remove exactly what the receipt lists.
 *
 * The receipt's own `prefix` must match the prefix computed from the agent id
 * and userData root; anything else is a mismatch and is refused, so a doctored
 * receipt cannot aim the recursive remove at an arbitrary directory.
 */
export function uninstallAgent(agentId: string, userDataDir?: string): UninstallReport {
  // Validates the id before any filesystem access.
  const prefix = resolveAgentInstallPrefix(agentId, userDataDir);

  const receipt = readInstallReceipt(prefix);
  if (!receipt) return { agentId, prefix, removed: false, reason: 'receipt-missing' };

  if (receipt.agentId !== agentId) {
    throw new ReceiptMismatchError(agentId, `receipt names agent "${receipt.agentId}"`);
  }
  if (path.resolve(receipt.prefix) !== path.resolve(prefix)) {
    throw new ReceiptMismatchError(agentId, `receipt names prefix "${receipt.prefix}", expected "${prefix}"`);
  }

  rmSync(receipt.prefix, { recursive: true, force: true });
  return { agentId, prefix, removed: true };
}
