import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { afterEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const helper = require('../../../scripts/macReleaseCheckpoint.cjs');
const yaml = require('js-yaml');
const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});
const expected = {
  repository: 'FerroxLabs/wayland',
  producerRunId: '123',
  sourceCommit: 'a'.repeat(40),
  sourceTree: 'b'.repeat(40),
  platform: 'darwin',
  arch: 'arm64',
  version: '0.12.18',
  teamId: 'PX6SP9GPWJ',
};
const hash = (file: string, algorithm = 'sha256', encoding: 'hex' | 'base64' = 'hex') =>
  crypto.createHash(algorithm).update(fs.readFileSync(file)).digest(encoding);
const python = (script: string, args: string[]) => execFileSync('python3', ['-c', script, ...args], { stdio: 'pipe' });

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mac-checkpoint-test-'));
  roots.push(root);
  const out = path.join(root, 'out'),
    app = path.join(out, 'mac-arm64/Wayland.app');
  fs.mkdirSync(path.join(app, 'Contents/MacOS'), { recursive: true });
  fs.writeFileSync(path.join(app, 'Contents/MacOS/Wayland'), 'fixture executable', { mode: 0o755 });
  const zip = path.join(out, 'Wayland-0.12.18-mac-arm64.zip');
  python(
    'import zipfile,pathlib,sys; app=pathlib.Path(sys.argv[1]); z=zipfile.ZipFile(sys.argv[2],"w"); [z.write(p,str(p.relative_to(app.parent))) for p in app.rglob("*")]; z.close()',
    [app, zip]
  );
  fs.writeFileSync(zip + '.blockmap', 'original blockmap');
  const zipEntry = { url: path.basename(zip), size: fs.statSync(zip).size, sha512: hash(zip, 'sha512', 'base64') };
  fs.writeFileSync(
    path.join(out, 'latest-mac.yml'),
    yaml.dump({ version: expected.version, files: [zipEntry], path: zipEntry.url, sha512: zipEntry.sha512 })
  );
  const checkpoint = path.join(root, 'checkpoint.tar'),
    verify = vi.fn();
  helper.saveCheckpoint({ out, app, checkpoint, expected, attempt: 1, verify });
  return { root, out, app, zip, zipEntry, checkpoint, verify };
}

function extractZip(zip: string, dest: string) {
  python(
    'import zipfile,sys,os; z=zipfile.ZipFile(sys.argv[1]); z.extractall(sys.argv[2]); [os.chmod(os.path.join(sys.argv[2],i.filename), (i.external_attr>>16)&0o777) for i in z.infolist()]',
    [zip, dest]
  );
}

describe('opaque Mac release checkpoints', () => {
  it('materializes only the pinned verification source, never the app builder or signer', () => {
    const prepare = vi.fn();
    helper.prepareVerificationSource(expected, prepare);
    expect(prepare).toHaveBeenCalledExactlyOnceWith({ platform: 'darwin', arch: 'arm64', verificationOnly: true });
  });
  it('checks the GitHub artifact digest before unwrapping its sole fixed member', () => {
    const f = fixture(),
      outer = path.join(f.root, 'artifact.zip'),
      restored = path.join(f.root, 'unwrapped.tar');
    python('import zipfile,sys; z=zipfile.ZipFile(sys.argv[1],"w"); z.write(sys.argv[2],"checkpoint.tar"); z.close()', [
      outer,
      f.checkpoint,
    ]);
    const script = path.resolve('scripts/macReleaseCheckpointArchive.py');
    expect(() =>
      execFileSync('python3', [script, 'unwrap', outer, restored, `sha256:${'0'.repeat(64)}`], { stdio: 'pipe' })
    ).toThrow();
    expect(fs.existsSync(restored)).toBe(false);
    execFileSync('python3', [script, 'unwrap', outer, restored, `sha256:${hash(outer)}`], { stdio: 'pipe' });
    expect(hash(restored)).toBe(hash(f.checkpoint));
  });
  it('restores the verified app/ZIP after DMG failure without a build and preserves ZIP metadata', () => {
    const f = fixture(),
      original = hash(f.zip),
      out = path.join(f.root, 'retry');
    const prepare = vi.fn();
    const restored = helper.restoreCheckpoint({
      out,
      checkpoint: f.checkpoint,
      expected,
      attempt: 2,
      verify: f.verify,
      prepare,
      extractZip,
    });
    expect(f.verify).toHaveBeenCalledTimes(2);
    expect(prepare).toHaveBeenCalledExactlyOnceWith(expected);
    expect(hash(path.join(out, path.basename(f.zip)))).toBe(original);
    expect(helper.appDigest(restored.app)).toBe(helper.appDigest(f.app));
    fs.writeFileSync(path.join(out, 'Wayland-0.12.18-mac-arm64.dmg'), 'new DMG container');
    // A DMG-only builder can replace its feed; finalize must recover the ZIP entry.
    fs.writeFileSync(path.join(out, 'latest-mac.yml'), 'version: wrong\n');
    helper.finalizeCheckpoint({ out, checkpoint: f.checkpoint, expected, attempt: 2, app: restored.app });
    const metadata = yaml.load(fs.readFileSync(path.join(out, 'latest-mac.yml'), 'utf8'));
    expect(metadata.files[0]).toEqual(f.zipEntry);
    expect(metadata.path).toBe(f.zipEntry.url);
    expect(metadata.files).toHaveLength(2);
    expect(hash(path.join(out, path.basename(f.zip)))).toBe(original);
    fs.appendFileSync(path.join(restored.app, 'Contents/MacOS/Wayland'), 'tampered');
    expect(() =>
      helper.finalizeCheckpoint({ out, checkpoint: f.checkpoint, expected, attempt: 2, app: restored.app })
    ).toThrow(/changed the accepted app/);
  });

  it.each(['repository', 'producerRunId', 'sourceCommit', 'sourceTree', 'arch', 'version'])(
    'rejects a different %s before extracting',
    (key) => {
      const f = fixture(),
        extract = vi.fn();
      expect(() =>
        helper.restoreCheckpoint({
          out: path.join(f.root, 'retry'),
          checkpoint: f.checkpoint,
          expected: { ...expected, [key]: 'different' },
          attempt: 2,
          verify: f.verify,
          prepare: vi.fn(),
          extractZip: extract,
        })
      ).toThrow(/identity differs/);
      expect(extract).not.toHaveBeenCalled();
    }
  );

  it('requires a prior attempt and refuses invalid signature/resource verification', () => {
    const f = fixture();
    expect(() =>
      helper.restoreCheckpoint({
        out: path.join(f.root, 'retry'),
        checkpoint: f.checkpoint,
        expected,
        attempt: 1,
        verify: f.verify,
        prepare: vi.fn(),
        extractZip,
      })
    ).toThrow(/prior attempt/);
    const verify = vi.fn(() => {
      throw new Error('signature/resource failure');
    });
    expect(() =>
      helper.restoreCheckpoint({
        out: path.join(f.root, 'retry'),
        checkpoint: f.checkpoint,
        expected,
        attempt: 2,
        verify,
        prepare: vi.fn(),
        extractZip,
      })
    ).toThrow(/signature\/resource failure/);
    expect(fs.existsSync(path.join(f.root, 'retry'))).toBe(false);
  });

  it.each(['duplicate', 'traversal', 'symlink', 'hardlink', 'unexpected', 'digest'])(
    'refuses %s in the real TAR before extraction',
    (kind) => {
      const f = fixture(),
        bad = path.join(f.root, 'bad.tar'),
        extract = vi.fn();
      python(
        `import tarfile,sys,io
src,dst,kind=sys.argv[1:]
with tarfile.open(src) as a, tarfile.open(dst,'w') as b:
 for m in a.getmembers():
  data=a.extractfile(m).read()
  if m.name=='payload.zip' and kind=='digest': data=b'X'+data[1:]
  if m.name=='payload.zip' and kind in ('symlink','hardlink'):
   m.type=tarfile.SYMTYPE if kind=='symlink' else tarfile.LNKTYPE; m.linkname='/tmp/outside'; m.size=0
  b.addfile(m,io.BytesIO(data) if m.isfile() else None)
 if kind in ('duplicate','traversal','unexpected'):
  m=tarfile.TarInfo('checkpoint.json' if kind=='duplicate' else ('../outside' if kind=='traversal' else 'extra')); m.size=1; b.addfile(m,io.BytesIO(b'x'))`,
        [f.checkpoint, bad, kind]
      );
      expect(() =>
        helper.restoreCheckpoint({
          out: path.join(f.root, 'retry'),
          checkpoint: bad,
          expected,
          attempt: 2,
          verify: f.verify,
          prepare: vi.fn(),
          extractZip: extract,
        })
      ).toThrow();
      expect(extract).not.toHaveBeenCalled();
      expect(fs.existsSync(path.join(f.root, 'retry'))).toBe(false);
    }
  );

  it('rejects an unsafe ZIP even when its receipt digest agrees', () => {
    const f = fixture(),
      bad = path.join(f.root, 'bad-zip.tar');
    python(
      `import tarfile,zipfile,sys,io,json,hashlib
with tarfile.open(sys.argv[1]) as a: files={m.name:a.extractfile(m).read() for m in a.getmembers()}
z=io.BytesIO()
with zipfile.ZipFile(z,'w') as archive: archive.writestr('../outside','bad')
files['payload.zip']=z.getvalue(); receipt=json.loads(files['checkpoint.json']); receipt['files']['payload.zip']['size']=len(z.getvalue()); receipt['files']['payload.zip']['sha256']=hashlib.sha256(z.getvalue()).hexdigest(); files['checkpoint.json']=json.dumps(receipt).encode()
with tarfile.open(sys.argv[2],'w') as b:
 for name,data in files.items():
  m=tarfile.TarInfo(name); m.size=len(data); b.addfile(m,io.BytesIO(data))`,
      [f.checkpoint, bad]
    );
    expect(() => helper.inspectCheckpoint(bad, expected, 2, true)).toThrow();
  });
});
