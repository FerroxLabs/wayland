/**
 * verify-packaged-resources.js
 *
 * Fail-hard gate run AFTER electron-builder packaging. Asserts that every
 * bundled resource that the running app needs is physically present inside the
 * packaged output. Exists because electron-builder SILENTLY skips any
 * `extraResources` whose source folder is absent at pack time (exit 0, no
 * warning) - which is exactly how 0.11.4/0.11.5 shipped with the entire
 * skills-library + bundled-workflows missing, breaking all skills and
 * workflows for every user.
 *
 * CRITICAL entries abort the build (exit 1) when missing - the app is broken
 * without them. OPTIONAL entries only warn (degraded feature, app still works).
 *
 * Usage:
 *   node scripts/verify-packaged-resources.js [--out <dir>]
 *   (defaults to ./out, electron-builder's directories.output)
 *
 * Locates the unpacked app Resources dir under <out> across mac/win/linux
 * layouts and checks each entry there.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const TAG = '[verify-packaged-resources]';

// resource path (relative to the app Resources dir) -> {critical, kind}
// kind 'file' = must exist and be non-empty; 'dir' = must exist and be non-empty.
const REQUIRED = [
  { rel: 'skills-library/index.json', critical: true, kind: 'file' },
  { rel: 'bundled-workflows/index.json', critical: true, kind: 'file' },
  { rel: 'bundled-wayland-core', critical: true, kind: 'dir' },
  { rel: 'bundled-bun', critical: true, kind: 'dir' },
  { rel: 'modelsdev-snapshot.json', critical: true, kind: 'file' },
  { rel: 'voice-models', critical: true, kind: 'dir' },
  // Degradable features - warn loudly but do not block the release.
  { rel: 'hub', critical: false, kind: 'dir' },
  { rel: 'whatsapp-bridge', critical: false, kind: 'dir' },
  { rel: 'signal-cli-runtime', critical: false, kind: 'dir' },
];

function parseOutDir() {
  const i = process.argv.indexOf('--out');
  const raw = i !== -1 ? process.argv[i + 1] : 'out';
  return path.resolve(process.cwd(), raw);
}

/**
 * Find every app "Resources" directory under the electron-builder output.
 * macOS:  <out>/<mac*>/<Name>.app/Contents/Resources
 * win:    <out>/<*-unpacked>/resources
 * linux:  <out>/<*-unpacked>/resources
 */
function findResourceDirs(outDir) {
  const found = [];
  if (!fs.existsSync(outDir)) return found;

  for (const entry of fs.readdirSync(outDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(outDir, entry.name);

    // macOS: look for *.app/Contents/Resources
    for (const sub of fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory())) {
      if (sub.name.endsWith('.app')) {
        const res = path.join(dir, sub.name, 'Contents', 'Resources');
        if (fs.existsSync(res)) found.push(res);
      }
    }

    // win/linux: *-unpacked/resources
    if (entry.name.endsWith('-unpacked')) {
      const res = path.join(dir, 'resources');
      if (fs.existsSync(res)) found.push(res);
    }
  }
  return found;
}

function isNonEmpty(p, kind) {
  try {
    const st = fs.statSync(p);
    if (kind === 'file') return st.isFile() && st.size > 0;
    if (!st.isDirectory()) return false;
    return fs.readdirSync(p).length > 0;
  } catch {
    return false;
  }
}

function main() {
  const outDir = parseOutDir();
  const resourceDirs = findResourceDirs(outDir);

  if (resourceDirs.length === 0) {
    console.error(`${TAG} ERROR: no packaged app Resources dir found under ${outDir}`);
    console.error(`${TAG} (expected <out>/<mac*>/<App>.app/Contents/Resources or <out>/*-unpacked/resources)`);
    process.exit(1);
  }

  let criticalFailures = 0;
  let warnings = 0;

  for (const resDir of resourceDirs) {
    console.log(`${TAG} checking ${resDir}`);
    for (const req of REQUIRED) {
      const target = path.join(resDir, req.rel);
      const ok = isNonEmpty(target, req.kind);
      if (ok) {
        console.log(`${TAG}   OK   ${req.rel}`);
      } else if (req.critical) {
        console.error(`${TAG}   FAIL ${req.rel}  <-- CRITICAL, missing or empty`);
        criticalFailures += 1;
      } else {
        console.warn(`${TAG}   WARN ${req.rel}  (optional, missing or empty)`);
        warnings += 1;
      }
    }
  }

  if (criticalFailures > 0) {
    console.error(
      `\n${TAG} ${criticalFailures} CRITICAL resource(s) missing from the packaged app. ` +
        `Refusing to ship a broken build. This is the guard that stops the 0.11.5 skills/workflows regression from recurring.`
    );
    process.exit(1);
  }

  console.log(
    `\n${TAG} PASS - all critical bundled resources present${warnings ? ` (${warnings} optional warning(s))` : ''}.`
  );
}

main();
