/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Startup bundle-integrity self-check (#755, #738).
 *
 * On hardened-runtime macOS, a broken codesign seal on Wayland.app makes the
 * OS deny exec for every child process the app spawns ("Operation not
 * permitted", exit 126) - the app looks alive but can't run a single command.
 * The #755 root cause was a runtime write into the signed bundle
 * (`app.asar.unpacked/.ijfw/.layout-version`); this check makes any future
 * seal breakage diagnosable in seconds instead of presenting as a mystery
 * "agent can't run commands" cluster.
 *
 * Lightweight by design: one async `codesign --verify --deep --strict` run,
 * fired-and-forgotten after startup, macOS packaged builds only. On failure it
 * logs the offending `file added:` / `file modified:` lines prominently and
 * emits a system notification through the existing notification plumbing.
 *
 * Before that check it restores a self-updated OfficeCLI binary to its pinned
 * bytes (see officeCliRepair.ts), the one known writer that breaks the seal from
 * outside Wayland. The same verify-then-repair runs before an update install
 * ({@link checkBundleSealBeforeUpdate}): Squirrel.Mac refuses to update a bundle
 * whose seal is broken, and until now that failed silently.
 */

// eslint-disable-next-line no-restricted-imports -- read-only codesign verification probe, spawns no user-controlled input (reviewed for #755).
import { execFile } from 'node:child_process';
import * as path from 'node:path';
import log from 'electron-log';
import type { OfficeCliRepairOutcome } from './officeCliRepair';

const CODESIGN_TIMEOUT_MS = 120_000;
const CODESIGN_MAX_BUFFER = 4 * 1024 * 1024;

export interface CodesignVerifyReport {
  /** True when codesign exited 0 (seal intact). */
  valid: boolean;
  /**
   * The high-signal diagnostic lines: `file added:` / `file modified:` /
   * `file missing:` plus the summary line(s) such as
   * `a sealed resource is missing or invalid`.
   */
  violations: string[];
}

/**
 * Parse `codesign --verify --deep --strict --verbose=2` diagnostics (codesign
 * writes them to stderr). Pure so it can be unit-tested on captured output
 * without shelling out to codesign.
 */
export function parseCodesignVerifyOutput(stderr: string, exitCode: number | null): CodesignVerifyReport {
  if (exitCode === 0) return { valid: true, violations: [] };
  const violations: string[] = [];
  for (const rawLine of stderr.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0) continue;
    if (/^file (added|modified|missing): /.test(line)) {
      violations.push(line);
      continue;
    }
    // Summary lines are prefixed with the bundle path, e.g.
    // "/Applications/Wayland.app: a sealed resource is missing or invalid".
    if (
      /(a sealed resource is missing or invalid|code signature invalid|invalid signature|code object is not signed)/i.test(
        line
      )
    ) {
      violations.push(line);
    }
  }
  if (violations.length === 0) {
    violations.push(`codesign verification failed (exit ${exitCode ?? 'null'}) with unrecognized output`);
  }
  return { valid: false, violations };
}

/**
 * Locate the `.app` bundle root that contains `p` (normally process.execPath =
 * `/Applications/Wayland.app/Contents/MacOS/Wayland`). Returns null when `p`
 * is not inside a bundle (dev builds, non-mac).
 */
export function findBundleRoot(p: string): string | null {
  // .app bundles only exist on macOS, so parse with POSIX semantics
  // unconditionally — win32 path.normalize would flip the separators.
  const normalized = path.posix.normalize(p);
  const segments = normalized.split('/');
  for (let i = segments.length - 1; i >= 0; i--) {
    if (segments[i]!.endsWith('.app')) {
      const root = segments.slice(0, i + 1).join('/');
      return root.length > 0 ? root : null;
    }
  }
  return null;
}

/** Run `codesign --verify`; null when codesign could not run (not a verdict). */
function verifySeal(bundleRoot: string): Promise<CodesignVerifyReport | null> {
  return new Promise<CodesignVerifyReport | null>((resolve) => {
    execFile(
      'codesign',
      ['--verify', '--deep', '--strict', '--verbose=2', bundleRoot],
      { timeout: CODESIGN_TIMEOUT_MS, maxBuffer: CODESIGN_MAX_BUFFER },
      (error, _stdout, stderr) => {
        if (!error) {
          resolve(parseCodesignVerifyOutput(stderr ?? '', 0));
          return;
        }
        // Spawn-level failure (codesign missing, timeout) - not a verdict.
        const code = (error as NodeJS.ErrnoException & { code?: number | string }).code;
        if (typeof code !== 'number') {
          log.warn('[Integrity] codesign could not be executed - skipping self-check', { err: error.message });
          resolve(null);
          return;
        }
        resolve(parseCodesignVerifyOutput(stderr ?? '', code));
      }
    );
  });
}

export interface BundleIntegrityDeps {
  /** True only for a packaged macOS build (the only place a seal exists). */
  isMacPackaged: () => Promise<boolean>;
  bundleRoot: () => string | null;
  verify: (bundleRoot: string) => Promise<CodesignVerifyReport | null>;
  repairOfficeCli: () => Promise<OfficeCliRepairOutcome>;
  notify: (title: string, body: string) => Promise<void>;
  /** Tell the updater whether the seal is intact, so a quit never hands Squirrel a doomed bundle. */
  setSealInvalid: (invalid: boolean) => Promise<void>;
}

const defaultDeps: BundleIntegrityDeps = {
  isMacPackaged: async () => {
    if (process.platform !== 'darwin') return false;
    try {
      const { getPlatformServices } = await import('@/common/platform');
      return getPlatformServices().paths.isPackaged();
    } catch {
      return false;
    }
  },
  bundleRoot: () => findBundleRoot(process.execPath),
  verify: verifySeal,
  repairOfficeCli: async () => {
    const { repairBundledOfficeCli } = await import('./officeCliRepair');
    return repairBundledOfficeCli(process.resourcesPath, 'darwin', process.arch as 'arm64' | 'x64');
  },
  notify: async (title, body) => {
    const { showNotification } = await import('@process/bridge/notificationBridge');
    await showNotification({ title, body });
  },
  setSealInvalid: async (invalid) => {
    const { autoUpdaterService } = await import('@process/services/autoUpdaterService');
    autoUpdaterService.setBundleSealInvalid(invalid);
  },
};

/** True when a repair was needed and could not be completed. */
function repairFailed(repair: OfficeCliRepairOutcome): boolean {
  return repair.status === 'failed';
}

function logRepair(repair: OfficeCliRepairOutcome): void {
  if (repair.status === 'repaired') {
    log.warn(`[Integrity] OfficeCLI had been replaced inside the bundle; restored the pinned bytes from ${repair.url}`);
  } else if (repair.status === 'failed') {
    log.error(
      `[Integrity] OfficeCLI inside the bundle is not the pinned binary and could not be restored ` +
        `(${repair.reason}: ${repair.detail}). Reinstall Wayland from the DMG.`
    );
  }
}

async function runRepair(deps: BundleIntegrityDeps): Promise<OfficeCliRepairOutcome> {
  try {
    const repair = await deps.repairOfficeCli();
    logRepair(repair);
    return repair;
  } catch (error) {
    log.warn('[Integrity] OfficeCLI repair could not start', { err: error });
    return { status: 'failed', reason: 'write-failed', detail: String(error) };
  }
}

/**
 * Run the self-check. No-op outside macOS packaged builds. Never throws.
 * Returns the report (or null when skipped) so callers/tests can observe it.
 */
export async function runBundleIntegrityCheck(
  deps: BundleIntegrityDeps = defaultDeps
): Promise<CodesignVerifyReport | null> {
  if (!(await deps.isMacPackaged())) return null;

  const bundleRoot = deps.bundleRoot();
  if (!bundleRoot) return null;

  const repair = await runRepair(deps);
  const report = await deps.verify(bundleRoot);

  if (report === null) return null;
  await deps.setSealInvalid(!report.valid).catch((err) => log.warn('[Integrity] updater not told', { err }));
  if (report.valid) {
    log.info(`[Integrity] codesign seal OK: ${bundleRoot}`);
    return report;
  }

  // Prominent, greppable log block - these lines are the remediation payload
  // (the stray files are typically ADDED, so deleting them restores the seal
  // without reinstalling).
  log.error('[Integrity] BUNDLE SIGNATURE INVALID - macOS will block child processes (#738/#755)');
  log.error(`[Integrity] bundle: ${bundleRoot}`);
  for (const line of report.violations) {
    log.error(`[Integrity] ${line}`);
  }
  log.error(
    '[Integrity] Remediation: delete the added files listed above (or reinstall Wayland), then relaunch. ' +
      'Verify with: codesign --verify --deep --strict --verbose=2 ' +
      bundleRoot
  );

  // Surface to the user via the existing notification plumbing (no new UI).
  try {
    await deps.notify(
      'Wayland installation is damaged',
      'The app bundle failed its code-signature check, so macOS may block Wayland from running commands. ' +
        (repairFailed(repair) ? 'Wayland tried to repair it automatically but could not. ' : '') +
        'Please reinstall Wayland. Details are in the log.'
    );
  } catch (err) {
    log.warn('[Integrity] failed to emit user notification', { err });
  }

  return report;
}

export type BundleSealGate = { ok: true } | { ok: false; repairAttempted: boolean; violations: string[] };

/**
 * Gate an update install on macOS: Squirrel.Mac will not update a bundle whose
 * code seal is broken, so verify it first, try the OfficeCLI repair once if it
 * is broken, and verify again. `ok: false` means the install must not be
 * attempted. Anything that is not a verdict (not macOS, not packaged, codesign
 * unavailable) passes. Never throws.
 */
export async function checkBundleSealBeforeUpdate(deps: BundleIntegrityDeps = defaultDeps): Promise<BundleSealGate> {
  if (!(await deps.isMacPackaged())) return { ok: true };
  const bundleRoot = deps.bundleRoot();
  if (!bundleRoot) return { ok: true };

  const first = await deps.verify(bundleRoot);
  if (first === null || first.valid) {
    await deps.setSealInvalid(false).catch(() => {});
    return { ok: true };
  }
  log.error(`[Integrity] Update install blocked: bundle seal invalid (${first.violations.join('; ')})`);

  const repair = await runRepair(deps);
  let report = first;
  if (repair.status === 'repaired') {
    const second = await deps.verify(bundleRoot);
    if (second === null || second.valid) {
      log.info('[Integrity] Bundle seal restored by the OfficeCLI repair; continuing with the update.');
      await deps.setSealInvalid(false).catch(() => {});
      return { ok: true };
    }
    report = second;
  }
  await deps.setSealInvalid(true).catch(() => {});
  return {
    ok: false,
    repairAttempted: repair.status !== 'intact' && repair.status !== 'absent',
    violations: report.violations,
  };
}
