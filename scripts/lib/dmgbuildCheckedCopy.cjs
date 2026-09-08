#!/usr/bin/env node
const path = require('path');
const { spawnSync } = require('child_process');
const CHECKSUMS = {
  'dmgbuild-bundle-x86_64-75c8a6c.tar.gz': '87b3bb72148b11451ee90ede79cc8d59305c9173b68b0f2b50a3bea51fc4a4e2',
  'dmgbuild-bundle-arm64-75c8a6c.tar.gz': 'a785f2a385c8c31996a089ef8e26361904b40c772d5ea65a36001212f1fc25e0',
};
async function main() {
  const { downloadBuilderToolset } = require('app-builder-lib/out/util/electronGet');
  const nativeArch = process.arch === 'arm64' ? 'arm64' : 'x86_64';
  const root = await downloadBuilderToolset({
    releaseName: 'dmg-builder@1.2.0',
    filenameWithExt: `dmgbuild-bundle-${nativeArch}-75c8a6c.tar.gz`,
    checksums: CHECKSUMS,
    githubOrgRepo: 'electron-userland/electron-builder-binaries',
  });
  const result = spawnSync(
    path.join(root, 'python/bin/python3'),
    [path.join(__dirname, 'dmgbuild_checked_copy.py'), ...process.argv.slice(2)],
    { stdio: 'inherit', env: { ...process.env, PYTHONPATH: path.join(root, 'python/lib') } }
  );
  if (result.error) throw result.error;
  process.exitCode = result.status === null ? 1 : result.status;
}
if (require.main === module)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
module.exports = { CHECKSUMS };
