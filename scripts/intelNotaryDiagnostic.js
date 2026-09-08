// Opt-in incident diagnostics. Never modify a staged or mounted app.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

function enabled() {
  return process.env.WAYLAND_INTEL_NOTARY_DIAGNOSTIC === '1';
}
function directory(outDir) {
  const dir = path.join(outDir, 'intel-notary-diagnostic');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
function failure(message) {
  const error = new Error(message);
  // The hooks must not misclassify failed integrity checks as Apple outages.
  error.notarizationFatal = true;
  return error;
}
function inspect(appPath, execute) {
  const binary = path.join(appPath, 'Contents', 'MacOS', 'Wayland');
  const result = {
    appPath,
    sha256: crypto.createHash('sha256').update(fs.readFileSync(binary)).digest('hex'),
  };
  try {
    result.signature =
      execute('/usr/bin/codesign', ['--verify', '--deep', '--strict', '--verbose=2', appPath], {
        encoding: 'utf8',
        timeout: 120000,
        stdio: 'pipe',
      }) || '';
    result.valid = true;
  } catch (error) {
    result.valid = false;
    result.signature = String(error.stderr || error.message);
  }
  return result;
}
function recordStage(outDir, appPath, stage, execute = execFileSync) {
  if (!enabled()) return;
  const dir = directory(outDir);
  const result = inspect(appPath, execute);
  fs.writeFileSync(path.join(dir, `${stage}.json`), JSON.stringify(result, null, 2) + '\n');
  if (!result.valid) throw failure(`Intel diagnostic: ${stage} app signature is invalid`);
}
function verifyDmg(outDir, dmg, execute = execFileSync) {
  if (!enabled()) return;
  const dir = directory(outDir);
  const report = { dmg, dmgSha256: crypto.createHash('sha256').update(fs.readFileSync(dmg)).digest('hex') };
  const mount = fs.mkdtempSync(path.join(dir, 'mount-'));
  let attached = false;
  try {
    const signed = JSON.parse(fs.readFileSync(path.join(dir, 'post-sign.json'), 'utf8'));
    const stapled = JSON.parse(fs.readFileSync(path.join(dir, 'post-staple.json'), 'utf8'));
    report.staged = inspect(stapled.appPath, execute);
    execute('/usr/bin/hdiutil', ['attach', '-readonly', '-nobrowse', '-mountpoint', mount, dmg], {
      encoding: 'utf8',
      timeout: 120000,
      stdio: 'pipe',
    });
    attached = true;
    report.embedded = inspect(path.join(mount, 'Wayland.app'), execute);
    report.matches =
      signed.sha256 === stapled.sha256 &&
      stapled.sha256 === report.staged.sha256 &&
      report.staged.sha256 === report.embedded.sha256;
    if (!signed.valid || !stapled.valid || !report.staged.valid || !report.embedded.valid || !report.matches) {
      throw failure('Intel diagnostic: staged/DMG executable digest or strict signature mismatch');
    }
  } catch (error) {
    report.error = String(error.message);
    throw failure(`Intel diagnostic failed: ${error.message}`);
  } finally {
    try {
      if (attached)
        execute('/usr/bin/hdiutil', ['detach', mount], { encoding: 'utf8', timeout: 120000, stdio: 'pipe' });
      fs.rmdirSync(mount);
    } catch (error) {
      report.cleanupError = String(error.message);
    }
    fs.writeFileSync(path.join(dir, `${path.basename(dmg)}.json`), JSON.stringify(report, null, 2) + '\n');
    if (report.cleanupError) throw failure(`Intel diagnostic: mount cleanup failed: ${report.cleanupError}`);
  }
}
function preserveAcceptedZip(outDir, zipPath) {
  if (!enabled()) return;
  const destination = path.join(directory(outDir), 'Wayland-notary-accepted.zip');
  fs.copyFileSync(zipPath, destination);
  fs.writeFileSync(
    path.join(directory(outDir), 'accepted-zip.json'),
    JSON.stringify(
      {
        file: path.basename(destination),
        sha256: crypto.createHash('sha256').update(fs.readFileSync(destination)).digest('hex'),
        note: 'Exact Apple-accepted app archive before stapling; no signing or rearchiving.',
      },
      null,
      2
    ) + '\n'
  );
}
module.exports = { recordStage, verifyDmg, preserveAcceptedZip };
