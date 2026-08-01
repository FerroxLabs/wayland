#!/usr/bin/env bun
/**
 * Verify an attested packaged-runtime update -> rollback -> re-upgrade
 * observation. The observation manifest binds the exact artifacts, package
 * smoke, nonce-bound lifecycle events, and four state snapshots. The canonical
 * verifier rejects caller-authored claims that lack GitHub provenance.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const { verifyUpdaterObservation } = require('./release-acceptance/verifyUpdaterObservation');

type Options = {
  observation?: string;
  out?: string;
};

type Result =
  | {
      contract: 'wayland-updater-rollback-reupgrade-run/1.0';
      status: 'accepted';
      trustedReceipt: {
        contract: 'wayland-updater-trusted-observation/1.0';
        candidate: { commit: string; tree: string };
        authority: 'nonce-bound-packaged-runtime-observer';
        receiptSha256: string;
      };
      observedAt: string;
    }
  | {
      contract: 'wayland-updater-rollback-reupgrade-run/1.0';
      status: 'blocked';
      code: string;
      detail: string;
      observedAt: string;
    };

function parseArgs(argv: string[]): Options {
  const options: Options = {};
  const flags: Record<string, keyof Options> = {
    '--observation': 'observation',
    '--out': 'out',
  };
  for (let index = 0; index < argv.length; index += 1) {
    const key = flags[argv[index]];
    if (!key) throw new Error(`M8C_ARGUMENT_INVALID:unknown:${argv[index]}`);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`M8C_ARGUMENT_INVALID:missing-value:${argv[index]}`);
    options[key] = value;
    index += 1;
  }
  return options;
}

function errorParts(error: unknown): { code: string; detail: string } {
  const message = error instanceof Error ? error.message : String(error);
  const separator = message.indexOf(':');
  if (separator === -1) return { code: 'M8C_UNCLASSIFIED_BLOCKER', detail: message };
  return { code: message.slice(0, separator), detail: message.slice(separator + 1) };
}

async function emit(result: Result, outputPath?: string): Promise<void> {
  const serialized = `${JSON.stringify(result, null, 2)}\n`;
  if (outputPath) {
    const resolved = path.resolve(outputPath);
    await mkdir(path.dirname(resolved), { recursive: true });
    await writeFile(resolved, serialized, { flag: 'w', mode: 0o600 });
  }
  process.stdout.write(serialized);
}

async function main(): Promise<void> {
  let options: Options = {};
  try {
    options = parseArgs(process.argv.slice(2));
    if (!options.observation) throw new Error('M8C_REQUIRED_EVIDENCE_MISSING:attested-packaged-observation');
    const trustedReceipt = verifyUpdaterObservation({ observationPath: path.resolve(options.observation) });
    await emit(
      {
        contract: 'wayland-updater-rollback-reupgrade-run/1.0',
        status: 'accepted',
        trustedReceipt,
        observedAt: new Date().toISOString(),
      },
      options.out
    );
  } catch (error) {
    const { code, detail } = errorParts(error);
    await emit(
      {
        contract: 'wayland-updater-rollback-reupgrade-run/1.0',
        status: 'blocked',
        code,
        detail,
        observedAt: new Date().toISOString(),
      },
      options.out
    );
    process.exitCode = 1;
  }
}

void main();
