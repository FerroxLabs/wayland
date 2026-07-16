import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

type ProtocolRegistration = {
  name: string;
  schemes: string[];
};

type BuilderConfig = {
  appId: string;
  productName: string;
  executableName: string;
  protocols: ProtocolRegistration[];
  directories: { output: string };
  publish: {
    provider: string;
    channel: string;
    releaseType: string;
  };
};

const require = createRequire(import.meta.url);
const previewConfig = require('../../electron-builder.preview.cjs') as BuilderConfig;

describe('preview package isolation', () => {
  it('replaces every stable identity surface instead of merging it', () => {
    expect(previewConfig).toMatchObject({
      appId: 'com.ferroxlabs.wayland.preview',
      productName: 'Wayland Preview',
      executableName: 'Wayland Preview',
      directories: { output: 'out-preview' },
      publish: {
        provider: 'github',
        channel: 'preview',
        releaseType: 'prerelease',
      },
    });

    expect(previewConfig.protocols).toEqual([
      {
        name: 'Wayland Preview Protocol',
        schemes: ['wayland-preview'],
      },
    ]);
    expect(previewConfig.protocols.flatMap(({ schemes }) => schemes)).not.toContain('wayland');
  });
});

describe('release package fail-closed gates', () => {
  it('never converts a non-zero macOS package or provenance result into CI success', () => {
    const workflow = fs.readFileSync(path.resolve('.github/workflows/_build-reusable.yml'), 'utf8');
    expect(workflow).toContain('rm -f out/*.dmg');
    expect(workflow).toContain('exit $BUILD_EXIT_CODE');
    expect(workflow).not.toContain('grep -qiE "notariz|staple"');
    expect(workflow).not.toContain('exit 0  # Allow CI to continue');
  });

  it('runs multi-architecture convenience builds as isolated package invocations', () => {
    const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts['build-mac']).toBe(
      'node scripts/build-with-builder.js arm64 --mac --arm64 && node scripts/build-with-builder.js x64 --mac --x64'
    );
    expect(pkg.scripts.build).toBe('bun run build-mac');
  });
});
