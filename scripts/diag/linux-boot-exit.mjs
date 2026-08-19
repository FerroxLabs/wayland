// THROWAWAY DIAGNOSTIC. Not for main.
// Answers one question: when the 0.11.8 linux AppImage rollback anchor is booted the
// way the updater observer boots it, does the process eventually exit, and if so when?
// Runs the REAL bootInstalledRuntime so the launch, env and shutdown path are identical.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { bootInstalledRuntime } from '../release-acceptance/produceNativeUpdaterObservation.mjs';

const EXTENDED_WAIT_MS = 180000;

function tree(label) {
  try {
    const out = execFileSync('ps', ['-axo', 'pid=,ppid=,etime=,stat=,command='], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
    const rows = out
      .split('\n')
      .filter((line) => /wayland|Wayland|xvfb|Xvfb|electron|squashfs|mount/i.test(line))
      .slice(0, 60);
    console.log(`--- ${label} process table (filtered) ---\n${rows.join('\n')}\n--- end ---`);
  } catch (error) {
    console.log(`--- ${label} ps failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function run(label, executablePath, userDataRoot) {
  fs.mkdirSync(userDataRoot, { recursive: true, mode: 0o700 });
  let captured = null;
  const startedAt = Date.now();
  const dependencies = {
    spawn: (command, args, options) => {
      const child = spawn(command, args, options);
      captured = child;
      console.log(`[${label}] spawned pid=${child.pid} cmd=${command} args=${JSON.stringify(args)}`);
      return child;
    },
    terminateProcessTree: async (child, platform, deps, descendants) => {
      console.log(`[${label}] observer would have killed the tree here. Holding instead.`);
      console.log(`[${label}] descendants observed by the monitor: ${descendants.length}`);
      for (const record of descendants.slice(0, 25)) {
        console.log(`[${label}]   pid=${record.pid} ppid=${record.parentPid} ${String(record.command).slice(0, 160)}`);
      }
      tree(label);
      const deadline = Date.now() + EXTENDED_WAIT_MS;
      while (Date.now() < deadline) {
        if (child.exitCode !== null || child.signalCode !== null) {
          console.log(
            `[${label}] EXITED LATE after ${Date.now() - startedAt}ms total ` +
              `(code=${child.exitCode} signal=${child.signalCode})`
          );
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      console.log(`[${label}] STILL ALIVE after ${EXTENDED_WAIT_MS}ms of extra waiting`);
      tree(`${label} after extended wait`);
      try {
        child.kill('SIGKILL');
      } catch {}
    },
  };
  try {
    const result = await bootInstalledRuntime(
      { executablePath, platform: 'linux', userDataRoot, label },
      dependencies
    );
    console.log(`[${label}] CLEAN EXIT inside the observer budget after ${Date.now() - startedAt}ms`);
    console.log(`[${label}] descendantsObserved=${result.descendantsObserved}`);
  } catch (error) {
    console.log(`[${label}] observer verdict: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (captured && captured.exitCode === null && captured.signalCode === null) {
    try {
      captured.kill('SIGKILL');
    } catch {}
  }
}

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-diag-'));
const deb = process.argv[2];
const appImage = process.argv[3];

const debRoot = path.join(root, 'deb');
fs.mkdirSync(debRoot, { recursive: true, mode: 0o700 });
execFileSync('dpkg-deb', ['-x', deb, debRoot], { stdio: 'pipe' });
const debExe = execFileSync('find', [debRoot, '-type', 'f', '-name', 'wayland'], { encoding: 'utf8' })
  .split('\n')
  .map((value) => value.trim())
  .filter(Boolean)
  .find((candidate) => fs.statSync(candidate).size > 1024 * 1024);
console.log(`deb executable: ${debExe}`);

const appRoot = path.join(root, 'appimage');
fs.mkdirSync(appRoot, { recursive: true, mode: 0o700 });
const appExe = path.join(appRoot, path.basename(appImage));
fs.copyFileSync(appImage, appExe);
fs.chmodSync(appExe, 0o700);

await run('CONTROL deb 0.11.18', debExe, path.join(root, 'state-deb'));
await run('SUBJECT appimage 0.11.8', appExe, path.join(root, 'state-app'));
