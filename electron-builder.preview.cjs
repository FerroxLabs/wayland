const fs = require('node:fs');
const path = require('node:path');
const YAML = require('js-yaml');

// Do not use electron-builder's `extends` for this overlay: it concatenates
// arrays, which made Preview claim the stable `wayland://` protocol as well as
// `wayland-preview://`. Compose explicitly so identity-sensitive arrays replace
// their stable counterparts.
const stable = YAML.load(fs.readFileSync(path.join(__dirname, 'electron-builder.yml'), 'utf8'));

module.exports = {
  ...stable,
  appId: 'com.ferroxlabs.wayland.preview',
  productName: 'Wayland Preview',
  executableName: 'Wayland Preview',
  protocols: [
    {
      name: 'Wayland Preview Protocol',
      schemes: ['wayland-preview'],
    },
  ],
  directories: {
    ...stable.directories,
    output: 'out-preview',
  },
  publish: {
    provider: 'github',
    owner: 'FerroxLabs',
    repo: 'wayland',
    channel: 'preview',
    publishAutoUpdate: true,
    releaseType: 'prerelease',
  },
};
