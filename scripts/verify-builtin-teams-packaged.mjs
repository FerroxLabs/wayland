#!/usr/bin/env node
/**
 * Packaged-build verification for the native waylandteams catalog.
 * Asserts the unpacked .app actually ships resources/builtin-extensions via
 * extraResources, and that the packaged bytes pass the same reference-integrity
 * check as the source tree (every record's contextFile + avatar resolves, all
 * 88 present: 60 teams + 28 specialists). Run AFTER an electron-builder --dir
 * build. Exit 0 on pass, 1 on any failure.
 */
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.cwd(), 'out');

function findApp() {
  if (!fs.existsSync(OUT)) return null;
  for (const d of fs.readdirSync(OUT)) {
    const app = path.join(OUT, d, 'Wayland.app');
    if (fs.existsSync(app)) return app;
  }
  return null;
}

const app = findApp();
if (!app) {
  console.error('FAIL: no Wayland.app found under out/*/');
  process.exit(1);
}
console.log('app:', app);

const root = path.join(app, 'Contents', 'Resources', 'builtin-extensions', 'waylandteams');
const fails = [];
const need = (rel) => {
  if (!fs.existsSync(path.join(root, rel))) fails.push(`missing: ${rel}`);
};

if (!fs.existsSync(root)) {
  console.error(`FAIL: extraResources did not ship the tree - ${root} absent`);
  process.exit(1);
}
need('aion-extension.json');
need('contributes/assistants.json');
need('contributes/skills.json');

const A = JSON.parse(fs.readFileSync(path.join(root, 'contributes/assistants.json'), 'utf8'));
const teams = A.filter((a) => a.kind === 'team').length;
const specialists = A.filter((a) => a.kind === 'specialist').length;

let missCtx = 0;
let missIcon = 0;
for (const a of A) {
  if (a.contextFile && !fs.existsSync(path.join(root, a.contextFile))) missCtx++;
  if (a.avatar && !fs.existsSync(path.join(root, a.avatar))) missIcon++;
}

const icons = fs.existsSync(path.join(root, 'icons'))
  ? fs.readdirSync(path.join(root, 'icons')).filter((f) => f.endsWith('.svg')).length
  : 0;

console.log(`records: ${A.length} (teams ${teams}, specialists ${specialists})`);
console.log(`icons on disk: ${icons}`);
console.log(`missing contextFiles: ${missCtx} | missing icons: ${missIcon}`);

if (A.length !== 88) fails.push(`expected 88 records, got ${A.length}`);
if (teams !== 60) fails.push(`expected 60 teams, got ${teams}`);
if (specialists !== 28) fails.push(`expected 28 specialists, got ${specialists}`);
if (missCtx !== 0) fails.push(`${missCtx} contextFiles unresolved in packaged tree`);
if (missIcon !== 0) fails.push(`${missIcon} icons unresolved in packaged tree`);
if (icons < 88) fails.push(`expected >=88 packaged icons, got ${icons}`);

// The tree must ship OUTSIDE app.asar (real paths for fs scan + asset protocol).
if (root.includes('.asar')) fails.push('tree is inside app.asar - must be unpacked');

if (fails.length) {
  console.error('FAIL:\n  ' + fails.join('\n  '));
  process.exit(1);
}
console.log('PASS: native waylandteams catalog ships in the packaged .app and all references resolve.');
