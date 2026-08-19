// THROWAWAY DIAGNOSTIC. Not for main.
// Two questions the updater observer cannot answer while it dies at the first one:
//   1. does installing a second build remove the first build's install root?
//   2. does installing an OLDER build over a newer one abort (NSIS allowDowngrade)?
// Uses only published release assets, so it needs no candidate build.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-windiag-'));

function listing(directory) {
  if (!fs.existsSync(directory)) return '<absent>';
  try {
    return fs.readdirSync(directory).slice(0, 40).join(', ') || '<empty>';
  } catch (error) {
    return `<unreadable ${error instanceof Error ? error.message : String(error)}>`;
  }
}

function install(label, installerPath, installRoot) {
  fs.mkdirSync(installRoot, { recursive: true });
  const startedAt = Date.now();
  let outcome = 'ok';
  try {
    execFileSync(installerPath, ['/S', `/D=${installRoot}`], {
      stdio: 'pipe',
      timeout: 15 * 60 * 1000,
      windowsHide: true,
    });
  } catch (error) {
    outcome = `THREW ${error instanceof Error ? error.message : String(error)}`;
  }
  console.log(`[${label}] install finished in ${Math.round((Date.now() - startedAt) / 1000)}s: ${outcome}`);
  console.log(`[${label}] its own root now holds: ${listing(installRoot)}`);
}

const [initialInstaller, rollbackInstaller] = process.argv.slice(2);
const initialRoot = path.join(root, 'initial', 'installed');
const rollbackRoot = path.join(root, 'rollback', 'installed');
const perUser = path.join(process.env.LOCALAPPDATA || '', 'Programs');

install('A 0.11.18', initialInstaller, initialRoot);
console.log(`[A] %LOCALAPPDATA%\\Programs holds: ${listing(perUser)}`);

install('B 0.11.8 downgrade', rollbackInstaller, rollbackRoot);
console.log(`[B] A's root ${initialRoot} now holds: ${listing(initialRoot)}`);
console.log(`[B] %LOCALAPPDATA%\\Programs holds: ${listing(perUser)}`);

console.log(`VERDICT question 1 (second install destroys the first): ${fs.existsSync(initialRoot) ? 'NO' : 'YES'}`);
console.log(`VERDICT question 2 (downgrade install produced a payload): ${listing(rollbackRoot) === '<empty>' || listing(rollbackRoot) === '<absent>' ? 'NO' : 'YES'}`);
