'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { execFileSync, spawnSync } = require('node:child_process');
const yaml = require('js-yaml');
const { resolvePackagedTarget, verifyPackagedResources } = require('../verify-packaged-resources');

const CONTRACT = 'wayland-mac-release-checkpoint/1';
const archiveScript = path.join(__dirname, 'macReleaseCheckpointArchive.py');
const digest = (file, algorithm = 'sha256', encoding = 'hex') =>
  crypto.createHash(algorithm).update(fs.readFileSync(file)).digest(encoding);

function identity(arch, env = process.env, cwd = process.cwd()) {
  if (!['arm64', 'x64'].includes(arch)) throw new Error('Invalid Mac architecture');
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8' }).trim();
  const tree = execFileSync('git', ['rev-parse', 'HEAD^{tree}'], { cwd, encoding: 'utf8' }).trim();
  if (commit !== env.GITHUB_SHA || !/^\d+$/.test(env.GITHUB_RUN_ID || ''))
    throw new Error('Checkpoint requires the exact GitHub producer source');
  if (!/^[\w.-]+\/[\w.-]+$/.test(env.GITHUB_REPOSITORY || '')) throw new Error('Missing repository identity');
  if (!/^[A-Z0-9]{10}$/.test(env.WAYLAND_MAC_TEAM_ID || '')) throw new Error('Missing expected Mac signing team');
  return {
    repository: env.GITHUB_REPOSITORY,
    producerRunId: env.GITHUB_RUN_ID,
    sourceCommit: commit,
    sourceTree: tree,
    platform: 'darwin',
    arch,
    version: JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8')).version,
    teamId: env.WAYLAND_MAC_TEAM_ID,
  };
}

function appDigest(app) {
  const entries = [];
  const walk = (dir, prefix = '') => {
    for (const name of fs.readdirSync(dir).toSorted()) {
      const file = path.join(dir, name),
        rel = prefix ? `${prefix}/${name}` : name;
      const st = fs.lstatSync(file);
      if (st.isSymbolicLink()) entries.push([rel, 'link', fs.readlinkSync(file)]);
      else if (st.isDirectory()) walk(file, rel);
      else if (st.isFile()) entries.push([rel, st.mode & 0o777, digest(file)]);
      else throw new Error('Unsupported app entry');
    }
  };
  walk(app);
  return crypto.createHash('sha256').update(JSON.stringify(entries)).digest('hex');
}

function verifyApp(app, expected) {
  const run = (command, args) => execFileSync(command, args, { stdio: 'pipe' });
  run('/usr/bin/codesign', ['--verify', '--deep', '--strict', app]);
  const signature = spawnSync('/usr/bin/codesign', ['-dv', '--verbose=4', app], { encoding: 'utf8' });
  const details = `${signature.stdout}\n${signature.stderr}`;
  if (
    signature.status !== 0 ||
    !details.includes('Identifier=com.ferroxlabs.wayland\n') ||
    !details.includes(`TeamIdentifier=${expected.teamId}\n`) ||
    !details.includes('Authority=Developer ID Application:')
  )
    throw new Error('Checkpoint app publisher identity differs');
  run('/usr/sbin/spctl', ['--assess', '--type', 'execute', '--verbose=2', app]);
  run('/usr/bin/xcrun', ['stapler', 'validate', app]);
  const version = execFileSync(
    '/usr/libexec/PlistBuddy',
    ['-c', 'Print :CFBundleShortVersionString', path.join(app, 'Contents/Info.plist')],
    { encoding: 'utf8' }
  ).trim();
  if (version !== expected.version) throw new Error('Checkpoint app version differs');
  const runtime = `darwin-${expected.arch}`;
  verifyPackagedResources({
    argv: [
      'node',
      'verify-packaged-resources',
      '--out',
      path.dirname(app),
      '--target-platform',
      'darwin',
      '--target-arch',
      expected.arch,
      '--resources-dir',
      path.join(app, 'Contents/Resources'),
      '--app-executable',
      path.join(app, 'Contents/MacOS/Wayland'),
      '--wcore-runtime',
      runtime,
      '--wnano-runtime',
      runtime,
      '--officecli-runtime',
      runtime,
      '--require-darwin-signature',
    ],
  });
}

function validateReceipt(receipt, expected, attempt, restoring = false) {
  if (
    JSON.stringify(Object.keys(receipt).toSorted()) !==
    JSON.stringify(['appDigest', 'appName', 'contract', 'createdAttempt', 'files', 'identity'])
  )
    throw new Error('Unexpected checkpoint receipt fields');
  if (receipt.contract !== CONTRACT || JSON.stringify(receipt.identity) !== JSON.stringify(expected))
    throw new Error('Checkpoint producer/source/target identity differs');
  if (
    !Number.isSafeInteger(attempt) ||
    attempt < 1 ||
    !Number.isSafeInteger(receipt.createdAttempt) ||
    receipt.createdAttempt < 1 ||
    receipt.createdAttempt > attempt ||
    (restoring && receipt.createdAttempt === attempt)
  )
    throw new Error('Checkpoint must come from a prior attempt of this producer');
  if (receipt.appName !== 'Wayland.app' || !/^[a-f0-9]{64}$/.test(receipt.appDigest || ''))
    throw new Error('Invalid checkpoint app identity');
  const zip = `Wayland-${expected.version}-mac-${expected.arch}.zip`;
  const names = { 'payload.zip': zip, 'zip.blockmap': `${zip}.blockmap`, 'zip-update.yml': 'latest-mac.yml' };
  if (JSON.stringify(Object.keys(receipt.files).toSorted()) !== JSON.stringify(Object.keys(names).toSorted()))
    throw new Error('Invalid checkpoint inventory');
  for (const [key, name] of Object.entries(names)) {
    const file = receipt.files[key];
    if (
      file.name !== name ||
      !/^[a-f0-9]{64}$/.test(file.sha256 || '') ||
      !Number.isSafeInteger(file.size) ||
      file.size <= 0
    )
      throw new Error('Invalid checkpoint file identity');
  }
  return receipt;
}

function validateZipUpdate(update, expected, zipFile) {
  const name = path.basename(zipFile),
    sha512 = digest(zipFile, 'sha512', 'base64');
  if (
    update.version !== expected.version ||
    update.path !== name ||
    update.sha512 !== sha512 ||
    !Array.isArray(update.files) ||
    update.files.length !== 1 ||
    update.files[0].url !== name ||
    update.files[0].sha512 !== sha512 ||
    update.files[0].size !== fs.statSync(zipFile).size
  )
    throw new Error('ZIP update metadata differs from preserved ZIP');
}

function inspectCheckpoint(checkpoint, expected, attempt, restoring = false) {
  const receipt = JSON.parse(
    execFileSync('python3', [archiveScript, 'inspect', checkpoint], {
      encoding: 'utf8',
      stdio: 'pipe',
      maxBuffer: 1024 * 1024,
    })
  );
  return validateReceipt(receipt, expected, attempt, restoring);
}

function prepareVerificationSource(expected, prepare) {
  const materialize = prepare || require('../build-with-builder.js').prepareWhatsAppBridgeResources;
  return materialize({ platform: 'darwin', arch: expected.arch, verificationOnly: true });
}

function saveCheckpoint({ out, checkpoint, expected, attempt, verify = verifyApp, app }) {
  app ||= resolvePackagedTarget(out, 'darwin', expected.arch).appDir;
  verify(app, expected);
  const zip = `Wayland-${expected.version}-mac-${expected.arch}.zip`;
  const files = { 'payload.zip': zip, 'zip.blockmap': `${zip}.blockmap`, 'zip-update.yml': 'latest-mac.yml' };
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-mac-checkpoint-'));
  try {
    const receipt = {
      contract: CONTRACT,
      identity: expected,
      createdAttempt: attempt,
      appName: path.basename(app),
      appDigest: appDigest(app),
      files: {},
    };
    for (const [member, name] of Object.entries(files)) {
      const file = path.join(out, name);
      if (!fs.lstatSync(file).isFile() || fs.lstatSync(file).isSymbolicLink())
        throw new Error('Checkpoint source must be regular');
      receipt.files[member] = { name, sha256: digest(file), size: fs.statSync(file).size };
      fs.copyFileSync(file, path.join(temp, member), fs.constants.COPYFILE_EXCL);
    }
    const update = yaml.load(fs.readFileSync(path.join(temp, 'zip-update.yml'), 'utf8'));
    validateZipUpdate(update, expected, path.join(out, zip));
    validateReceipt(receipt, expected, attempt);
    fs.writeFileSync(path.join(temp, 'checkpoint.json'), JSON.stringify(receipt));
    fs.mkdirSync(path.dirname(checkpoint), { recursive: true });
    execFileSync('python3', [archiveScript, 'create', checkpoint, temp]);
    inspectCheckpoint(checkpoint, expected, attempt);
    return { app, receipt };
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

function restoreCheckpoint({
  out,
  checkpoint,
  expected,
  attempt,
  verify = verifyApp,
  extractZip,
  prepare = prepareVerificationSource,
}) {
  const receipt = inspectCheckpoint(checkpoint, expected, attempt, true);
  // Extract beside the output so the final move stays on one filesystem and
  // preserves the signed app's extended attributes and stapled ticket.
  const temp = fs.mkdtempSync(path.join(path.dirname(path.resolve(out)), '.wayland-mac-restore-'));
  try {
    execFileSync('python3', [archiveScript, 'extract', checkpoint, temp]);
    const extracted = path.join(temp, 'app');
    fs.mkdirSync(extracted);
    (extractZip || ((zip, dest) => execFileSync('/usr/bin/ditto', ['-x', '-k', zip, dest])))(
      path.join(temp, 'payload.zip'),
      extracted
    );
    const app = path.join(extracted, receipt.appName);
    if (appDigest(app) !== receipt.appDigest) throw new Error('Restored app differs from checkpoint');
    prepare(expected);
    verify(app, expected);
    const appParent = path.join(out, `mac-checkpoint-${expected.arch}`);
    if (fs.existsSync(appParent)) throw new Error('Refusing to overwrite an existing app');
    for (const file of Object.values(receipt.files))
      if (fs.existsSync(path.join(out, file.name))) throw new Error('Refusing to overwrite an existing release asset');
    fs.mkdirSync(out, { recursive: true });
    fs.mkdirSync(appParent);
    fs.renameSync(app, path.join(appParent, receipt.appName));
    if (appDigest(path.join(appParent, receipt.appName)) !== receipt.appDigest)
      throw new Error('Copy changed restored app');
    for (const [member, file] of Object.entries(receipt.files))
      fs.copyFileSync(path.join(temp, member), path.join(out, file.name), fs.constants.COPYFILE_EXCL);
    return { app: path.join(appParent, receipt.appName), receipt };
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

function finalizeCheckpoint({ out, checkpoint, expected, attempt, app }) {
  const receipt = inspectCheckpoint(checkpoint, expected, attempt);
  if (appDigest(app) !== receipt.appDigest) throw new Error('DMG packaging changed the accepted app');
  const zip = receipt.files['payload.zip'],
    blockmap = receipt.files['zip.blockmap'];
  for (const file of [zip, blockmap])
    if (digest(path.join(out, file.name)) !== file.sha256) throw new Error('DMG packaging changed the accepted ZIP');
  const original = execFileSync(
    'python3',
    [
      '-c',
      'import tarfile,sys; a=tarfile.open(sys.argv[1]); sys.stdout.buffer.write(a.extractfile("zip-update.yml").read())',
      checkpoint,
    ],
    { encoding: 'utf8' }
  );
  const update = yaml.load(original);
  validateZipUpdate(update, expected, path.join(out, zip.name));
  const dmg = `Wayland-${expected.version}-mac-${expected.arch}.dmg`,
    file = path.join(out, dmg);
  if (!fs.lstatSync(file).isFile() || fs.lstatSync(file).isSymbolicLink()) throw new Error('Missing regular DMG');
  update.files = [
    ...update.files.filter((entry) => entry.url !== dmg),
    { url: dmg, sha512: digest(file, 'sha512', 'base64'), size: fs.statSync(file).size },
  ];
  fs.writeFileSync(path.join(out, 'latest-mac.yml'), yaml.dump(update));
  return { app, receipt };
}

if (require.main === module) {
  const [action, ...args] = process.argv.slice(2),
    options = {};
  for (let i = 0; i < args.length; i += 2) {
    if (!['--arch', '--out', '--checkpoint', '--app'].includes(args[i]) || !args[i + 1])
      throw new Error('Invalid checkpoint arguments');
    options[args[i].slice(2)] = args[i + 1];
  }
  const expected = identity(options.arch),
    attempt = Number(process.env.GITHUB_RUN_ATTEMPT);
  const operation = { save: saveCheckpoint, restore: restoreCheckpoint, finalize: finalizeCheckpoint }[action];
  if (!operation || !options.out || !options.checkpoint)
    throw new Error('Use save|restore|finalize --arch --out --checkpoint [--app]');
  const result = operation({
    ...options,
    out: path.resolve(options.out),
    checkpoint: path.resolve(options.checkpoint),
    expected,
    attempt,
  });
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `app_path=${result.app}\n`);
  console.log(JSON.stringify({ action, app: result.app, identity: expected }));
}

module.exports = {
  appDigest,
  identity,
  inspectCheckpoint,
  validateReceipt,
  saveCheckpoint,
  restoreCheckpoint,
  finalizeCheckpoint,
  prepareVerificationSource,
};
