'use strict';

// Executed from the protected observer checkout. Candidate files are DATA:
// never require a candidate module or execute its package lifecycle scripts.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const protectedAuthority = require('./whatsapp-bridge-source.json');
const REQUIRED_FILES = Object.keys(protectedAuthority.files).sort();

function assertCandidateIdentity(sourceRoot, expectedIdentity) {
  if (
    !/^[a-f0-9]{40,64}$/.test(expectedIdentity?.commit || '') ||
    !/^[a-f0-9]{40,64}$/.test(expectedIdentity?.tree || '')
  ) {
    throw new Error('Candidate WhatsApp source requires a verified commit/tree identity');
  }
  const git = (...args) => execFileSync('git', args, { cwd: sourceRoot, encoding: 'utf8' }).trim();
  if (
    git('rev-parse', 'HEAD') !== expectedIdentity.commit ||
    git('rev-parse', 'HEAD^{tree}') !== expectedIdentity.tree ||
    git('status', '--porcelain=v1', '--untracked-files=all')
  ) {
    throw new Error('Candidate WhatsApp source identity changed or worktree is dirty');
  }
}

function regularFile(root, relative) {
  let current = root;
  const parts = relative.split('/');
  for (let index = 0; index < parts.length; index++) {
    current = path.join(current, parts[index]);
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink() || (index === parts.length - 1 ? !stat.isFile() : !stat.isDirectory())) {
      throw new Error(`Candidate WhatsApp source must be regular files: ${relative}`);
    }
  }
  return current;
}

function dependencyManifestVariants(root, sourceDir) {
  const rootPackage = JSON.parse(fs.readFileSync(regularFile(root, 'package.json'), 'utf8'));
  const overrideNames = new Set();
  for (const field of ['resolutions', 'overrides']) {
    const map = rootPackage[field];
    if (map === undefined) continue;
    if (!map || typeof map !== 'object' || Array.isArray(map))
      throw new Error('Candidate dependency overrides must be string maps');
    for (const [name, range] of Object.entries(map)) {
      if (
        !/^[a-zA-Z0-9@][a-zA-Z0-9@/._-]*$/.test(name) ||
        typeof range !== 'string' ||
        !range ||
        range.includes('\0')
      ) {
        throw new Error('Candidate dependency overrides must be string maps');
      }
      overrideNames.add(name);
    }
  }
  const variants = {};
  const digest = (bytes) => ({ size: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') });
  const visit = (directory) => {
    if (!fs.existsSync(directory)) return;
    if (!fs.lstatSync(directory).isDirectory()) throw new Error('Candidate dependency directory is redirected');
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const full = path.join(directory, entry.name);
      if (entry.name.startsWith('@') || entry.name === 'node_modules') {
        visit(full);
        continue;
      }
      const file = path.join(full, 'package.json');
      if (fs.existsSync(file)) {
        const relative = path.relative(sourceDir, file).split(path.sep).join('/');
        const bytes = fs.readFileSync(regularFile(sourceDir, relative));
        const pkg = JSON.parse(bytes.toString('utf8'));
        let changed = false;
        for (const field of ['dependencies', 'optionalDependencies']) {
          const deps = pkg[field];
          if (deps === undefined) continue;
          if (
            !deps ||
            typeof deps !== 'object' ||
            Array.isArray(deps) ||
            Object.values(deps).some((range) => typeof range !== 'string')
          ) {
            throw new Error(`Invalid reconstructed dependency manifest: ${relative}`);
          }
          for (const name of Object.keys(deps)) {
            if (overrideNames.has(name) && deps[name] !== '*') {
              deps[name] = '*';
              changed = true;
            }
          }
        }
        // Reproduce ONLY the protected producer's patchOverriddenDepRanges
        // transformation. Installed bytes never enter this derivation.
        if (changed)
          variants[relative] = {
            pristine: digest(bytes),
            normalized: digest(Buffer.from(JSON.stringify(pkg, null, 2) + '\n')),
          };
      }
      visit(path.join(full, 'node_modules'));
    }
  };
  visit(path.join(sourceDir, 'node_modules'));
  return variants;
}

function resolveCandidateWhatsAppSource(sourceRoot, expectedIdentity) {
  const root = fs.realpathSync(sourceRoot);
  assertCandidateIdentity(root, expectedIdentity);
  const authority = JSON.parse(fs.readFileSync(regularFile(root, 'scripts/whatsapp-bridge-source.json'), 'utf8'));
  if (
    JSON.stringify(Object.keys(authority).sort()) !== JSON.stringify(['contract', 'files']) ||
    authority.contract !== protectedAuthority.contract ||
    !authority.files ||
    Array.isArray(authority.files) ||
    JSON.stringify(Object.keys(authority.files).sort()) !== JSON.stringify(REQUIRED_FILES)
  ) {
    throw new Error('Candidate WhatsApp authority must retain the protected contract and exact required file set');
  }
  const sourceDir = path.join(root, 'src/process/channels/whatsapp-bridge');
  for (const relative of REQUIRED_FILES) {
    const expected = authority.files[relative];
    if (
      !expected ||
      JSON.stringify(Object.keys(expected).sort()) !== JSON.stringify(['sha256', 'size']) ||
      !Number.isSafeInteger(expected.size) ||
      expected.size < 0 ||
      !/^[a-f0-9]{64}$/.test(expected.sha256 || '')
    ) {
      throw new Error(`Candidate WhatsApp authority has an invalid file pin: ${relative}`);
    }
    const file = regularFile(root, `src/process/channels/whatsapp-bridge/${relative}`);
    const bytes = fs.readFileSync(file);
    if (bytes.length !== expected.size || crypto.createHash('sha256').update(bytes).digest('hex') !== expected.sha256) {
      throw new Error(`Candidate WhatsApp source differs from its committed pin: ${relative}`);
    }
  }
  return {
    whatsappSourceDir: sourceDir,
    whatsappAuthority: authority,
    whatsappDependencyManifestVariants: dependencyManifestVariants(root, sourceDir),
  };
}

function prepareCandidateWhatsAppSource(sourceRoot, expectedIdentity, execute = execFileSync) {
  const resolved = resolveCandidateWhatsAppSource(sourceRoot, expectedIdentity);
  const version = String(execute('bun', ['--version'], { encoding: 'utf8' })).trim();
  if (version !== '1.3.14')
    throw new Error(`Protected WhatsApp reconstruction requires Bun 1.3.14, received ${version}`);
  execute('bun', ['install', '--frozen-lockfile', '--ignore-scripts'], {
    cwd: resolved.whatsappSourceDir,
    stdio: 'inherit',
  });
  // A frozen install must not change the pinned source inputs.
  return resolveCandidateWhatsAppSource(sourceRoot, expectedIdentity);
}

module.exports = { resolveCandidateWhatsAppSource, prepareCandidateWhatsAppSource };
if (require.main === module) {
  try {
    prepareCandidateWhatsAppSource(process.cwd(), {
      commit: process.env.EXPECTED_COMMIT,
      tree: process.env.EXPECTED_TREE,
    });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
