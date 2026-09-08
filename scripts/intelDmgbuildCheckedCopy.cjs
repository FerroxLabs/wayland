#!/usr/bin/env node
// Keep electron-builder's checksummed vendor/runtime; replace only its unchecked app copy.
const path = require('path');
const { spawnSync } = require('child_process');

const VENDOR_OPTIONS = {
  releaseName: 'dmg-builder@1.2.0',
  filenameWithExt: 'dmgbuild-bundle-x86_64-75c8a6c.tar.gz',
  checksums: {
    'dmgbuild-bundle-x86_64-75c8a6c.tar.gz': '87b3bb72148b11451ee90ede79cc8d59305c9173b68b0f2b50a3bea51fc4a4e2',
  },
  githubOrgRepo: 'electron-userland/electron-builder-binaries',
};
async function resolveVendor(download) {
  return download(VENDOR_OPTIONS);
}
async function main() {
  if (process.env.WAYLAND_INTEL_NOTARY_DIAGNOSTIC !== '1') throw new Error('Intel diagnostic opt-in required');
  const { downloadBuilderToolset } = require('app-builder-lib/out/util/electronGet');
  const root = await resolveVendor(downloadBuilderToolset);
  const result = spawnSync(
    path.join(root, 'python/bin/python3'),
    [path.join(__dirname, 'intel_dmgbuild_checked_copy.py'), ...process.argv.slice(2)],
    {
      stdio: 'inherit',
      env: { ...process.env, PYTHONPATH: path.join(root, 'python/lib') },
    }
  );
  if (result.error) throw result.error;
  process.exitCode = result.status === null ? 1 : result.status;
}
if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
module.exports = { resolveVendor, VENDOR_OPTIONS };
