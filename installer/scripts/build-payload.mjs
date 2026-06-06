#!/usr/bin/env node
/**
 * Assemble the publishable `getwayland` payload from the app build.
 *
 *   1. build the web renderer + the headless server bundle (in ../../)
 *   2. copy dist-server/ and out/renderer/ into ./payload/
 *   3. sync the package version to the app version
 *
 * Run from app/installer:  node scripts/build-payload.mjs   (then `npm publish`)
 */
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG = resolve(HERE, '..');
const APP = resolve(PKG, '..'); // app/
const PAYLOAD = join(PKG, 'payload');

function run(cmd, args) {
  console.log(`\n$ ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { cwd: APP, stdio: 'inherit' });
  if (r.status !== 0) { console.error(`✗ ${cmd} ${args.join(' ')} failed`); process.exit(1); }
}

console.log('Building Wayland headless payload…');
run('bun', ['run', 'build:renderer:web']);
run('bun', ['run', 'build:server']);

const distServer = join(APP, 'dist-server');
const renderer = join(APP, 'out', 'renderer');
for (const [p, label] of [[distServer, 'dist-server'], [renderer, 'out/renderer']]) {
  if (!existsSync(p)) { console.error(`✗ expected build output missing: ${label} (${p})`); process.exit(1); }
}

rmSync(PAYLOAD, { recursive: true, force: true });
mkdirSync(join(PAYLOAD, 'out'), { recursive: true });
cpSync(distServer, join(PAYLOAD, 'dist-server'), { recursive: true });
cpSync(renderer, join(PAYLOAD, 'out', 'renderer'), { recursive: true });

// Sync version to the app.
const appPkg = JSON.parse(readFileSync(join(APP, 'package.json'), 'utf8'));
const myPkgPath = join(PKG, 'package.json');
const myPkg = JSON.parse(readFileSync(myPkgPath, 'utf8'));
myPkg.version = appPkg.version;
writeFileSync(myPkgPath, JSON.stringify(myPkg, null, 2) + '\n');

console.log(`\n✓ payload assembled (v${appPkg.version}) → ${PAYLOAD}`);
console.log('  Publish:  cd app/installer && npm publish --access public');
