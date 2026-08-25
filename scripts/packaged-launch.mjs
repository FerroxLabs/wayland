#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';

import { outDirNameForTrack, packagedExecutableName, resolveTrackedPackagedApp } from './lib/packagedAppResolver.mjs';

function parseArgs(argv) {
  const flags = new Set(argv.filter((x) => x.startsWith('--')));
  const values = argv.filter((x) => !x.startsWith('--'));
  return { flags, values };
}

function isWindows() {
  return process.platform === 'win32';
}

function killProcessByName(name) {
  return new Promise((resolve) => {
    const args = isWindows() ? ['/F', '/IM', name] : ['-f', name];
    const cmd = isWindows() ? 'taskkill' : 'pkill';
    const child = spawn(cmd, args, { stdio: 'ignore', shell: false });
    child.on('exit', () => resolve());
    child.on('error', () => resolve());
  });
}

async function main() {
  const { flags, values } = parseArgs(process.argv.slice(2));
  const projectRoot = process.cwd();
  const dryRun = flags.has('--dry-run');
  const shouldClean = !flags.has('--no-clean');
  const passthroughArgs = values;

  // #1034: which track to launch is stated, never guessed. The old local
  // resolver looked only in out/ for a hardcoded `Wayland`/`wayland`, so it
  // could not launch a preview build at all - electron-builder writes the
  // preview launcher as `Wayland Preview`, with the space.
  const track = process.env.WAYLAND_RELEASE_TRACK ?? 'stable';
  let packaged;
  try {
    packaged = resolveTrackedPackagedApp({ projectRoot, track });
  } catch (error) {
    console.error(`[packaged-launch] ${error.message}`);
    console.error(
      `[packaged-launch] Run \`just build-package\` (or set WAYLAND_RELEASE_TRACK to the track you built).`
    );
    process.exit(1);
  }

  if (shouldClean) {
    // Reap only THIS track's launcher: killing `Wayland` from a preview run
    // would take down the stable app a developer had open beside it.
    await killProcessByName(packagedExecutableName(packaged.track, 'win32'));
    await killProcessByName(packagedExecutableName(packaged.track, process.platform));
    await killProcessByName('electron.exe');
    await killProcessByName('electron');
  }

  const env = {
    ...process.env,
    WAYLAND_EXTENSIONS_PATH: path.join(projectRoot, 'examples'),
  };

  console.log(`[packaged-launch] track: ${packaged.track} (${outDirNameForTrack(packaged.track)}/)`);
  console.log(`[packaged-launch] executable: ${packaged.executablePath}`);
  console.log(`[packaged-launch] cwd: ${packaged.cwd}`);
  console.log(`[packaged-launch] WAYLAND_EXTENSIONS_PATH: ${env.WAYLAND_EXTENSIONS_PATH}`);

  if (dryRun) return;

  const child = spawn(packaged.executablePath, passthroughArgs, {
    cwd: packaged.cwd,
    env,
    stdio: 'inherit',
    shell: false,
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error('[packaged-launch] Failed:', error);
  process.exit(1);
});
