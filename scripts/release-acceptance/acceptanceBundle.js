'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const COMMIT = /^[a-f0-9]{40,64}$/;
const SHA256 = /^sha256:[a-f0-9]{64}$/;

function fail(code, detail) {
  throw new Error(`${code}:${detail}`);
}

function exactKeys(value, expected, code) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(code, 'expected-object');
  const actual = Object.keys(value).sort();
  if (JSON.stringify(actual) !== JSON.stringify([...expected].sort())) {
    fail(code, 'missing-or-unknown-critical-field');
  }
  return value;
}

function candidateIdentity(value, code = 'M8I_CANDIDATE_INVALID') {
  const candidate = exactKeys(value, ['commit', 'tree'], code);
  if (!COMMIT.test(String(candidate.commit)) || !COMMIT.test(String(candidate.tree))) {
    fail(code, 'malformed-identity');
  }
  return { commit: candidate.commit, tree: candidate.tree };
}

function sha256(bytes) {
  return `sha256:${crypto.createHash('sha256').update(bytes).digest('hex')}`;
}

function safeRelativePath(value, code) {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.includes('\\') ||
    path.isAbsolute(value) ||
    value.split('/').some((part) => !part || part === '.' || part === '..')
  ) {
    fail(code, 'unsafe-relative-path');
  }
  return value;
}

function regularFile(root, relative, code) {
  const safe = safeRelativePath(relative, code);
  const absoluteRoot = fs.realpathSync(root);
  const absolute = path.resolve(absoluteRoot, safe);
  const relativeToRoot = path.relative(absoluteRoot, absolute);
  if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) fail(code, 'path-escapes-root');
  let stat;
  try {
    stat = fs.lstatSync(absolute);
  } catch {
    fail(code, `missing:${safe}`);
  }
  if (!stat.isFile() || stat.isSymbolicLink()) fail(code, `not-regular-file:${safe}`);
  const real = fs.realpathSync(absolute);
  const realRelative = path.relative(absoluteRoot, real);
  if (realRelative.startsWith('..') || path.isAbsolute(realRelative)) fail(code, `path-escapes-root:${safe}`);
  return { absolute, relative: safe, bytes: fs.readFileSync(absolute) };
}

function readJsonFile(root, relative, code) {
  const file = regularFile(root, relative, code);
  try {
    return { ...file, value: JSON.parse(file.bytes.toString('utf8')) };
  } catch {
    fail(code, `invalid-json:${relative}`);
  }
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
}

function copyRegularFile(sourceRoot, relative, destinationRoot, destinationRelative = relative) {
  const source = regularFile(sourceRoot, relative, 'M8I_SOURCE_EVIDENCE_INVALID');
  const destination = path.resolve(destinationRoot, safeRelativePath(destinationRelative, 'M8I_OUTPUT_PATH_INVALID'));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source.absolute, destination, fs.constants.COPYFILE_EXCL);
  fs.chmodSync(destination, 0o600);
  return { path: destination, sha256: sha256(source.bytes) };
}

function assertDigest(value, code) {
  if (!SHA256.test(String(value))) fail(code, 'invalid-sha256');
  return value;
}

module.exports = {
  assertDigest,
  candidateIdentity,
  copyRegularFile,
  exactKeys,
  fail,
  readJsonFile,
  regularFile,
  safeRelativePath,
  sha256,
  writeJson,
};
