const fs = require('node:fs');
const path = require('node:path');
const authority = require('./authority.json');
const { download, decode, digest, TARGETS } = require('../../src/process/agent/fuigo/distribution.cjs');
const { signDarwinStagedBinary, darwinSigningIdentifier } = require('../signDarwinStagedBinary');
async function prepareFuigo({
  platform = process.platform,
  arch = process.arch,
  projectRoot = path.resolve(__dirname, '../..'),
} = {}) {
  const runtime = `${platform}-${arch}`;
  const pin = authority.platforms[runtime];
  if (!pin || !TARGETS.includes(runtime)) throw new Error('Fuigo target has no pinned release');
  const decoded = decode(await download(pin.url, 128 * 1024 * 1024), pin, authority.version, runtime);
  if (decoded.binarySha256 !== pin.binarySha256 || decoded.archiveSha256 !== pin.archiveSha256)
    throw new Error('Fuigo independently pinned binary mismatch');
  const dir = path.join(projectRoot, 'resources/bundled-fuigo', runtime);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, decoded.name);
  fs.writeFileSync(file, decoded.binary, { mode: 0o755 });
  if (platform === 'darwin')
    signDarwinStagedBinary(file, {
      identifier: darwinSigningIdentifier(decoded.name, decoded.binarySha256),
      label: `Fuigo ${runtime}`,
    });
  for (const [name, bytes] of decoded.notices) {
    const dest = path.join(dir, 'notices', name.slice('package/'.length));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, bytes);
  }
  const receipt = {
    contract: 'fuigo-bundle/1.0',
    version: authority.version,
    runtime,
    packageIntegrity: pin.integrity,
    archiveSha256: decoded.archiveSha256,
    binarySha256: decoded.binarySha256,
    stagedSha256: digest(fs.readFileSync(file)),
    binary: decoded.name,
  };
  fs.writeFileSync(path.join(dir, 'bundle.json'), JSON.stringify(receipt, null, 2) + '\n');
  return receipt;
}
module.exports = prepareFuigo;
if (require.main === module)
  prepareFuigo({ platform: process.argv[2], arch: process.argv[3] })
    .then((r) => console.log(JSON.stringify(r)))
    .catch((e) => {
      console.error(e.message);
      process.exitCode = 1;
    });
