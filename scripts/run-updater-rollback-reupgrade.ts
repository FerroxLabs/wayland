#!/usr/bin/env bun
/**
 * Gate the real signed-package update -> rollback -> re-upgrade receipt.
 *
 * A caller-authored JSON receipt is not runtime evidence. Until a trusted
 * packaged-runtime observation adapter captures nonce-bound process events and
 * state snapshots, this command always fails closed after validating evidence
 * presence and claim shape. Missing evidence also fails closed as JSON.
 */

import { lstat, mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { validateUpdateJourneyReceipt } from '../src/process/services/updateAcceptanceReceipt';

type Options = {
  candidateArtifact?: string;
  rollbackArtifact?: string;
  journeyReceipt?: string;
  out?: string;
};

type Result = {
  contract: 'wayland-updater-rollback-reupgrade-run/1.0';
  status: 'blocked';
  code: string;
  detail: string;
  observedAt: string;
};

function parseArgs(argv: string[]): Options {
  const options: Options = {};
  const flags: Record<string, keyof Options> = {
    '--candidate-artifact': 'candidateArtifact',
    '--rollback-artifact': 'rollbackArtifact',
    '--journey-receipt': 'journeyReceipt',
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

async function regularFile(input: string | undefined, label: string): Promise<string> {
  if (!input) throw new Error(`M8C_REQUIRED_EVIDENCE_MISSING:${label}`);
  const resolved = path.resolve(input);
  const stats = await lstat(resolved).catch(() => undefined);
  if (!stats?.isFile() || stats.isSymbolicLink()) throw new Error(`M8C_REQUIRED_EVIDENCE_INVALID:${label}`);
  return realpath(resolved);
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
    await regularFile(options.candidateArtifact, 'signed-candidate-artifact');
    await regularFile(options.rollbackArtifact, 'signed-rollback-artifact');
    const receiptPath = await regularFile(options.journeyReceipt, 'packaged-journey-receipt');
    validateUpdateJourneyReceipt(JSON.parse(await readFile(receiptPath, 'utf8')));
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
