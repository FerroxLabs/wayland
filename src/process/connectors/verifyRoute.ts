/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Post-write live verification for Flux connector config changes. After a
 * connector writes a config file, this runs an INJECTED probe (in production a
 * live Flux connection test) and, if it does not confirm a working route,
 * restores the pre-write backup over the config — keeping the system in a known
 * state. The probe is never a real network call here; callers wire it.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

type RestoreFn = (backupPath: string, configPath: string) => Promise<void>;

type VerifyRouteOpts = {
  configPath: string;
  backupPath: string;
  probe: () => Promise<boolean>;
  restore?: RestoreFn;
};

type VerifyRouteResult = {
  ok: boolean;
  rolledBack: boolean;
};

/**
 * Default restore: atomically copy backupPath over configPath (temp + rename).
 * If backupPath does not exist, there was no prior config, so delete the config
 * we just wrote instead.
 */
async function defaultRestore(backupPath: string, configPath: string): Promise<void> {
  let backupContent: Buffer;
  try {
    backupContent = await fs.readFile(backupPath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      // No prior config existed — remove the one we wrote.
      await fs.rm(configPath, { force: true });
      return;
    }
    throw err;
  }

  const tmpPath = path.join(
    path.dirname(configPath),
    `.${path.basename(configPath)}.restore-${process.pid}-${Date.now()}.tmp`,
  );
  await fs.writeFile(tmpPath, backupContent);
  await fs.rename(tmpPath, configPath);
}

/**
 * Run the injected probe; on failure (false OR throw) restore the backup.
 *
 * Return contract:
 * - probe true  → { ok: true,  rolledBack: false } (config left as written)
 * - probe false/throws, restore succeeds → { ok: false, rolledBack: true }
 * - restore itself throws → { ok: false, rolledBack: false }. We could neither
 *   verify the route nor cleanly roll back; the config is in an UNKNOWN state.
 *   We do not re-throw so the caller gets a status, but rolledBack:false is the
 *   signal to surface this to the user (manual cleanup may be needed).
 */
export async function verifyRouteOrRollback(opts: VerifyRouteOpts): Promise<VerifyRouteResult> {
  const restore = opts.restore ?? defaultRestore;

  let probeOk = false;
  try {
    probeOk = await opts.probe();
  } catch {
    probeOk = false;
  }

  if (probeOk) {
    return { ok: true, rolledBack: false };
  }

  try {
    await restore(opts.backupPath, opts.configPath);
    return { ok: false, rolledBack: true };
  } catch {
    return { ok: false, rolledBack: false };
  }
}
