#!/usr/bin/env bun
/**
 * Validate the real signed-package update -> rollback -> re-upgrade receipt.
 *
 * This command never manufactures lifecycle evidence. It independently hashes
 * the supplied artifacts, executes the platform-native publisher gate, verifies
 * the compiled v0.11.8 rollback artifact, and then validates a receipt emitted
 * by the disposable packaged-app journey. Missing evidence fails closed as JSON.
 */

import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { lstat, mkdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { validateUpdateJourneyReceipt } from '../src/process/services/updateAcceptanceReceipt';
import { prepareClassicBinaryFromReleaseArtifact } from '../src/process/services/recovery/externalRecoveryLauncher';
import {
  currentClassicRecoveryTarget,
  verifyClassicRecoveryReleaseArtifact,
} from '../src/process/services/recovery/classicReleaseTrust';

const execFileAsync = promisify(execFile);

type Options = {
  candidateArtifact?: string;
  rollbackArtifact?: string;
  journeyReceipt?: string;
  out?: string;
};

type Result = {
  contract: 'wayland-updater-rollback-reupgrade-run/1.0';
  status: 'accepted' | 'blocked';
  code: string;
  detail: string;
  observedAt: string;
  receipt?: unknown;
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

async function hashFile(filePath: string, algorithm: 'sha256' | 'sha512', encoding: 'hex' | 'base64'): Promise<string> {
  const hash = createHash(algorithm);
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest(encoding);
}

async function verifyCandidatePublisher(artifactPath: string): Promise<void> {
  if (process.platform === 'darwin') {
    if (path.extname(artifactPath).toLowerCase() !== '.dmg')
      throw new Error('M8C_CANDIDATE_PUBLISHER_INVALID:expected-dmg');
    await execFileAsync(path.resolve('scripts/release-smoke-macos.sh'), ['--dmg', artifactPath], {
      cwd: path.resolve('.'),
      maxBuffer: 8 * 1024 * 1024,
    });
    return;
  }
  if (process.platform === 'win32') {
    if (path.extname(artifactPath).toLowerCase() !== '.exe')
      throw new Error('M8C_CANDIDATE_PUBLISHER_INVALID:expected-exe');
    await execFileAsync('pwsh', [path.resolve('scripts/release-smoke-windows.ps1'), '-Exe', artifactPath], {
      cwd: path.resolve('.'),
      maxBuffer: 8 * 1024 * 1024,
    });
    return;
  }
  throw new Error('M8C_LINUX_PUBLISHER_KEY_UNPINNED:no-compiled-wayland-release-keyring');
}

async function verifyRollbackPublisher(artifactPath: string): Promise<void> {
  if (process.platform === 'linux') {
    throw new Error('M8C_ROLLBACK_PUBLISHER_UNAVAILABLE:v0.11.8-linux-is-digest-only');
  }
  if (process.platform === 'win32') {
    const target = currentClassicRecoveryTarget();
    await verifyClassicRecoveryReleaseArtifact({ artifactPath, ...target });
    await execFileAsync('pwsh', [path.resolve('scripts/release-smoke-windows.ps1'), '-Exe', artifactPath], {
      cwd: path.resolve('.'),
      maxBuffer: 8 * 1024 * 1024,
    });
    return;
  }
  const destinationParent = await realpath(
    await mkdir(path.join(tmpdir(), 'wayland-m8c'), { recursive: true }).then(() => path.join(tmpdir(), 'wayland-m8c'))
  );
  const prepared = await prepareClassicBinaryFromReleaseArtifact({ artifactPath, destinationParent });
  await rm(prepared.runtimeRoot, { recursive: true, force: true });
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
    const candidatePath = await regularFile(options.candidateArtifact, 'signed-candidate-artifact');
    const rollbackPath = await regularFile(options.rollbackArtifact, 'signed-rollback-artifact');
    const receiptPath = await regularFile(options.journeyReceipt, 'packaged-journey-receipt');
    const receipt = validateUpdateJourneyReceipt(JSON.parse(await readFile(receiptPath, 'utf8')));
    const currentTarget = `${process.platform}-${process.arch}`;
    if (receipt.candidate.target !== currentTarget || receipt.rollback.target !== currentTarget) {
      throw new Error(
        `M8C_TARGET_MISMATCH:receipt=${receipt.candidate.target}/${receipt.rollback.target},host=${currentTarget}`
      );
    }

    if (path.resolve(receipt.candidate.path) !== candidatePath)
      throw new Error('M8C_CANDIDATE_PATH_MISMATCH:receipt-versus-input');
    if (path.resolve(receipt.rollback.path) !== rollbackPath)
      throw new Error('M8C_ROLLBACK_PATH_MISMATCH:receipt-versus-input');

    const candidateStats = await lstat(candidatePath);
    const rollbackStats = await lstat(rollbackPath);
    const [candidateSha256, candidateSha512, rollbackSha256] = await Promise.all([
      hashFile(candidatePath, 'sha256', 'hex'),
      hashFile(candidatePath, 'sha512', 'base64'),
      hashFile(rollbackPath, 'sha256', 'hex'),
    ]);
    if (
      candidateSha256 !== receipt.candidate.observedSha256 ||
      candidateStats.size !== receipt.candidate.observedSize
    ) {
      throw new Error('M8C_CANDIDATE_BYTES_CHANGED:post-journey');
    }
    if (
      candidateSha512 !== receipt.candidate.updateMetadata.observedSha512 ||
      candidateStats.size !== receipt.candidate.updateMetadata.observedSize
    ) {
      throw new Error('M8C_UPDATE_METADATA_MISMATCH:artifact-versus-receipt');
    }
    if (rollbackSha256 !== receipt.rollback.observedSha256 || rollbackStats.size !== receipt.rollback.observedSize) {
      throw new Error('M8C_ROLLBACK_BYTES_CHANGED:post-journey');
    }

    await verifyCandidatePublisher(candidatePath);
    await verifyRollbackPublisher(rollbackPath);
    validateUpdateJourneyReceipt(receipt);
    await emit(
      {
        contract: 'wayland-updater-rollback-reupgrade-run/1.0',
        status: 'accepted',
        code: 'M8C_ACCEPTED',
        detail: 'signed artifacts and packaged lifecycle receipt agree',
        observedAt: new Date().toISOString(),
        receipt,
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
