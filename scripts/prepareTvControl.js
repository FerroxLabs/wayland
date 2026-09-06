#!/usr/bin/env node
'use strict';

// Install only the committed lock's integrity-checked archives. No dependency
// lifecycle scripts or global cache lookup forms part of the shipped runtime.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const authority = require('./tvcontrol/authority.json');

function treeDigest(root) {
  const entries = [];
  function visit(dir, prefix) {
    if (!fs.lstatSync(dir).isDirectory()) throw new Error('TVControl directory is not a real directory');
    for (const name of fs.readdirSync(dir).sort()) {
      const file = path.join(dir, name);
      const rel = prefix ? `${prefix}/${name}` : name;
      const stat = fs.lstatSync(file);
      if (stat.isDirectory()) visit(file, rel);
      else if (stat.isFile())
        entries.push([rel, crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')]);
      else throw new Error(`TVControl contains a non-regular entry: ${rel}`);
    }
  }
  visit(root, '');
  return crypto.createHash('sha256').update(JSON.stringify(entries)).digest('hex');
}

function verifyTvControl(root, expected = authority) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'node_modules/@ferroxlabs/tvcontrol/package.json'), 'utf8'));
    return (
      pkg.name === '@ferroxlabs/tvcontrol' &&
      pkg.version === expected.version &&
      treeDigest(path.join(root, 'node_modules')) === expected.treeSha256
    );
  } catch {
    return false;
  }
}

function prepareTvControl() {
  const output = path.resolve(__dirname, '../resources/bundled-tvcontrol');
  if (verifyTvControl(output)) return output;
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-tvcontrol-'));
  try {
    for (const name of ['package.json', 'package-lock.json'])
      fs.copyFileSync(path.join(__dirname, 'tvcontrol', name), path.join(temp, name));
    execFileSync(
      process.platform === 'win32' ? 'npm.cmd' : 'npm',
      ['ci', '--ignore-scripts', '--bin-links=false', '--omit=dev', '--no-audit', '--no-fund'],
      { cwd: temp, stdio: 'inherit', shell: process.platform === 'win32' }
    );
    // npm's install receipt contains platform-specific bookkeeping, not code.
    fs.rmSync(path.join(temp, 'node_modules/.package-lock.json'), { force: true });
    if (!verifyTvControl(temp)) throw new Error('TVControl 2.4.7 dependency tree differs from the pinned authority');
    if (fs.existsSync(output))
      throw new Error('Invalid existing TVControl staging directory; preserve it before restaging');
    fs.mkdirSync(output, { recursive: true });
    fs.cpSync(path.join(temp, 'node_modules'), path.join(output, 'node_modules'), { recursive: true });
    if (!verifyTvControl(output)) throw new Error('TVControl staging verification failed');
    return output;
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

module.exports = prepareTvControl;
module.exports.treeDigest = treeDigest;
module.exports.verifyTvControl = verifyTvControl;
if (require.main === module) prepareTvControl();
