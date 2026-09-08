#!/usr/bin/env node
// Keep electron-builder's checksummed vendor/runtime; replace only its unchecked app copy.
const path = require('path');
const { spawnSync } = require('child_process');

async function main() {
  if (process.env.WAYLAND_INTEL_NOTARY_DIAGNOSTIC !== '1') throw new Error('Intel diagnostic opt-in required');
  // Avoid resolving this CUSTOM_DMGBUILD_PATH wrapper recursively.
  delete process.env.CUSTOM_DMGBUILD_PATH;
  const { getDmgVendorPath } = require('dmg-builder/out/dmgUtil');
  const vendor = await getDmgVendorPath();
  const root = path.dirname(vendor);
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
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
