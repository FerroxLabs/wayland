#!/usr/bin/env node
const path = require('path');
const { execFileSync } = require('child_process');
const { configureDmgEnvironment } = require('./macDmgPackaging.cjs');
function main(args = process.argv.slice(2)) {
  const read = (flag) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : null;
  };
  const app = read('--app'),
    arch = read('--arch'),
    out = read('--out');
  if (!app || !out || !['x64', 'arm64'].includes(arch) || process.platform !== 'darwin')
    throw new Error('Usage on macOS: packageMacDmg.cjs --app <verified.app> --arch <x64|arm64> --out <directory>');
  const options = [
    '--mac',
    'dmg',
    `--${arch}`,
    '--prepackaged',
    path.resolve(app),
    '--publish=never',
    `--config.directories.output=${path.resolve(out)}`,
  ];
  if (process.env.WAYLAND_RELEASE_TRACK === 'preview') options.push('--config', 'electron-builder.preview.cjs');
  execFileSync(process.execPath, [require.resolve('electron-builder/out/cli/cli.js'), ...options], {
    stdio: 'inherit',
    env: configureDmgEnvironment(path.resolve(out)),
  });
}
if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
module.exports = { main };
