'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

function gh(args, output, input) {
  const result = spawnSync(
    'gh',
    args,
    output === undefined
      ? { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, input }
      : { stdio: ['ignore', output, 'pipe'] }
  );
  if (result.error || result.status !== 0) {
    const error = new Error(`GitHub request failed: ${String(result.stderr || result.error)}`);
    error.notFound = /\(HTTP 404\)/.test(String(result.stderr));
    throw error;
  }
  return output === undefined ? JSON.parse(result.stdout || 'null') : undefined;
}

function validateDraft(release, tag, candidate, tagCommit) {
  if (!/^[a-f0-9]{40}$/.test(candidate) || tagCommit !== candidate)
    throw new Error('Release tag differs from candidate');
  if (release && (release.draft !== true || release.tag_name !== tag))
    throw new Error('Refusing to modify a public or different release');
}

function draftMetadata(tag, commit, name, prerelease) {
  return {
    tag_name: tag,
    target_commitish: commit,
    name: name || tag,
    draft: true,
    prerelease,
    generate_release_notes: true,
  };
}

function assetMatches(local, remote, download) {
  if (remote.size !== local.size) throw new Error(`Existing asset differs: ${local.name}`);
  if (remote.digest) {
    if (!/^sha256:[a-f0-9]{64}$/i.test(remote.digest) || remote.digest.toLowerCase() !== `sha256:${local.sha256}`)
      throw new Error(`Existing asset digest differs: ${local.name}`);
  } else if (download(remote) !== local.sha256) throw new Error(`Existing asset bytes differ: ${local.name}`);
}

function publishMissingAssets(files, assets, { upload, lookup, download }) {
  const byName = new Map();
  for (const asset of assets) {
    if (byName.has(asset.name)) throw new Error('Duplicate release asset name');
    byName.set(asset.name, asset);
  }
  // Validate every existing match before uploading anything.
  for (const local of files) if (byName.has(local.name)) assetMatches(local, byName.get(local.name), download);
  const result = { reused: [], uploaded: [] };
  for (const local of files) {
    if (byName.has(local.name)) {
      result.reused.push(local.name);
      continue;
    }
    upload(local);
    const matches = lookup().filter((asset) => asset.name === local.name);
    if (matches.length !== 1) throw new Error(`Uploaded asset cannot be uniquely verified: ${local.name}`);
    assetMatches(local, matches[0], download);
    result.uploaded.push(local.name);
  }
  return result;
}

function localAssets(directory) {
  const files = [],
    names = new Set();
  const visit = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) throw new Error('Release assets must not be symlinks');
      if (entry.isDirectory()) visit(file);
      else if (entry.isFile() && /\.(exe|msi|dmg|deb|AppImage|rpm|zip|yml|blockmap)$/.test(entry.name)) {
        if (names.has(entry.name)) throw new Error('Duplicate local release asset name');
        names.add(entry.name);
        files.push({ name: entry.name, file, size: fs.statSync(file).size, sha256: sha256(file) });
      }
    }
  };
  visit(directory);
  if (!files.length) throw new Error('No release assets found');
  return files;
}

function main() {
  const [action, ...args] = process.argv.slice(2),
    options = {};
  for (let i = 0; i < args.length; i += 2) {
    if (!['--repository', '--tag', '--commit', '--dir', '--name', '--prerelease'].includes(args[i]) || !args[i + 1])
      throw new Error('Invalid draft asset arguments');
    options[args[i].slice(2)] = args[i + 1];
  }
  const { repository, tag, commit } = options;
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository || '') || !/^v[\w.+-]+$/.test(tag || ''))
    throw new Error('Invalid repository/tag');
  const prefix = `repos/${repository}`;
  let object = gh(['api', `${prefix}/git/ref/tags/${encodeURIComponent(tag)}`]).object;
  for (let depth = 0; object.type === 'tag' && depth < 5; depth++)
    object = gh(['api', `${prefix}/git/tags/${object.sha}`]).object;
  if (object.type !== 'commit') throw new Error('Release tag did not resolve to a commit');
  let release;
  try {
    release = gh(['api', `${prefix}/releases/tags/${encodeURIComponent(tag)}`]);
  } catch (error) {
    if (!error.notFound) throw error;
  }
  validateDraft(release, tag, commit, object.sha);
  if (action === 'prepare') {
    if (!release) {
      // Create-only POST cannot implicitly edit a racing published release.
      release = gh(
        ['api', '--method', 'POST', `${prefix}/releases`, '--input', '-'],
        undefined,
        JSON.stringify(draftMetadata(tag, commit, options.name, options.prerelease === 'true'))
      );
      validateDraft(release, tag, commit, object.sha);
    }
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `exists=${Boolean(release)}\n`);
    return;
  }
  if (action !== 'upload' || !release || !options.dir) throw new Error('Draft must exist before asset upload');
  const files = localAssets(path.resolve(options.dir));
  const lookup = () => gh(['api', '--paginate', '--slurp', `${prefix}/releases/${release.id}/assets`]).flat();
  const download = (asset) => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-draft-asset-'));
    const file = path.join(directory, 'asset');
    try {
      const fd = fs.openSync(file, 'wx', 0o600);
      try {
        gh(['api', `${prefix}/releases/assets/${asset.id}`, '-H', 'Accept: application/octet-stream'], fd);
      } finally {
        fs.closeSync(fd);
      }
      return sha256(file);
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  };
  const result = publishMissingAssets(files, lookup(), {
    lookup,
    download,
    upload: (local) => {
      validateDraft(gh(['api', `${prefix}/releases/${release.id}`]), tag, commit, object.sha);
      // No --clobber. A racing upload fails rather than replacing accepted bytes.
      const uploaded = spawnSync('gh', ['release', 'upload', tag, local.file, '--repo', repository], {
        encoding: 'utf8',
      });
      if (uploaded.error || uploaded.status !== 0)
        throw new Error(`Asset upload failed: ${uploaded.stderr || uploaded.error}`);
    },
  });
  fs.writeFileSync(
    path.join(options.dir, 'immutable-assets.json'),
    JSON.stringify(
      { repository, tag, commit, assets: files.map(({ file: _file, ...rest }) => rest), ...result },
      null,
      2
    )
  );
  console.log(JSON.stringify(result));
}

if (require.main === module) main();
module.exports = { validateDraft, draftMetadata, assetMatches, publishMissingAssets, localAssets };
