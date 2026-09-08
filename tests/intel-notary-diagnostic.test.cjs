const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { recordStage, verifyDmg } = require('../scripts/intelNotaryDiagnostic');
const roots = [];
afterEach(() => {
  delete process.env.WAYLAND_INTEL_NOTARY_DIAGNOSTIC;
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});
function setup({ mutated = false, invalid = false } = {}) {
  process.env.WAYLAND_INTEL_NOTARY_DIAGNOSTIC = '1';
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'intel-diag-test-'));
  roots.push(root);
  const app = path.join(root, 'mac', 'Wayland.app');
  const writeBinary = (appPath, bytes) => {
    const binary = path.join(appPath, 'Contents', 'MacOS', 'Wayland');
    fs.mkdirSync(path.dirname(binary), { recursive: true });
    fs.writeFileSync(binary, bytes);
  };
  writeBinary(app, 'signed fixture bytes');
  const dmg = path.join(root, 'fixture.dmg');
  fs.writeFileSync(dmg, 'fake image; mount behavior provided by fixture');
  const calls = [];
  const execute = (cmd, args) => {
    calls.push([cmd, args]);
    if (args[0] === 'attach')
      writeBinary(path.join(args[4], 'Wayland.app'), mutated ? 'changed' : 'signed fixture bytes');
    if (args[0] === 'detach') fs.rmSync(path.join(args[1], 'Wayland.app'), { recursive: true });
    if (cmd.endsWith('codesign') && args.at(-1).includes('mount-') && invalid) {
      const error = new Error('invalid signature');
      error.stderr = 'code or signature modified';
      throw error;
    }
    return '';
  };
  recordStage(root, app, 'post-sign', execute);
  recordStage(root, app, 'post-staple', execute);
  return { root, app, dmg, execute, calls };
}
test('equal staged and embedded bytes with strict signatures pass and detach', () => {
  const f = setup();
  verifyDmg(f.root, f.dmg, f.execute);
  const report = JSON.parse(fs.readFileSync(path.join(f.root, 'intel-notary-diagnostic', 'fixture.dmg.json')));
  assert.equal(report.matches, true);
  assert.equal(report.embedded.valid, true);
  assert.ok(f.calls.some(([, args]) => args[0] === 'detach'));
  assert.ok(
    f.calls
      .filter(([cmd]) => cmd.endsWith('codesign'))
      .every(([, args]) => args.includes('--deep') && args.includes('--strict'))
  );
});
for (const [name, options] of [
  ['changed embedded bytes', { mutated: true }],
  ['invalid embedded signature', { invalid: true }],
]) {
  test(`${name} fail fatally before submission and preserve diagnostics`, () => {
    const f = setup(options);
    assert.throws(() => verifyDmg(f.root, f.dmg, f.execute), { notarizationFatal: true });
    assert.ok(f.calls.some(([, args]) => args[0] === 'detach'));
    assert.ok(fs.existsSync(f.dmg));
    const report = JSON.parse(fs.readFileSync(path.join(f.root, 'intel-notary-diagnostic', 'fixture.dmg.json')));
    assert.ok(report.error);
  });
}
test('post-sign to post-staple mutation fails even when mounted bytes match current staged bytes', () => {
  const f = setup();
  const file = path.join(f.root, 'intel-notary-diagnostic', 'post-sign.json');
  const signed = JSON.parse(fs.readFileSync(file));
  signed.sha256 = 'old digest';
  fs.writeFileSync(file, JSON.stringify(signed));
  assert.throws(() => verifyDmg(f.root, f.dmg, f.execute), { notarizationFatal: true });
});
test('disabled diagnostics touch no files or processes', () => {
  recordStage('/nonexistent', '/nonexistent', 'post-sign', () => assert.fail());
  verifyDmg('/nonexistent', '/nonexistent', () => assert.fail());
});
test('hook integration verifies DMG before notary submission and records both app stages', () => {
  const hook = fs.readFileSync(path.join(__dirname, '../scripts/notarizeDmg.js'), 'utf8');
  assert.ok(hook.indexOf('verifyDmg(buildResult.outDir, dmg)') < hook.indexOf('await notarizeAndStapleWithRetry'));
  const afterSign = fs.readFileSync(path.join(__dirname, '../scripts/afterSign.js'), 'utf8');
  assert.ok(afterSign.indexOf("appPath, 'post-sign'") < afterSign.indexOf('submitToNotary({'));
  assert.ok(afterSign.indexOf("['stapler', 'staple', appPath]") < afterSign.indexOf("appPath, 'post-staple'"));
});

test('accepted notary ZIP is preserved byte-for-byte outside the app', () => {
  const f = setup();
  const { preserveAcceptedZip } = require('../scripts/intelNotaryDiagnostic');
  const source = path.join(f.root, 'accepted.zip');
  const bytes = Buffer.from('Apple accepted archive fixture');
  fs.writeFileSync(source, bytes);
  preserveAcceptedZip(f.root, source);
  assert.deepEqual(fs.readFileSync(path.join(f.root, 'intel-notary-diagnostic', 'Wayland-notary-accepted.zip')), bytes);
  assert.ok(fs.existsSync(source));
});

test('wrapper requests the exact checksum-pinned Intel vendor through the exported downloader', async () => {
  const { resolveVendor, VENDOR_OPTIONS } = require('../scripts/intelDmgbuildCheckedCopy.cjs');
  let options;
  assert.equal(
    await resolveVendor(async (value) => {
      options = value;
      return '/fixture/vendor';
    }),
    '/fixture/vendor'
  );
  assert.equal(options.releaseName, 'dmg-builder@1.2.0');
  assert.equal(options.filenameWithExt, 'dmgbuild-bundle-x86_64-75c8a6c.tar.gz');
  assert.equal(
    options.checksums[options.filenameWithExt],
    '87b3bb72148b11451ee90ede79cc8d59305c9173b68b0f2b50a3bea51fc4a4e2'
  );
  assert.equal(options, VENDOR_OPTIONS);
});
