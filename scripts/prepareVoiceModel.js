/**
 * Prepare the bundled voice STT model for Electron packaging.
 *
 * Downloads the Whisper-tiny multilingual ONNX model (transformers.js layout)
 * into resources/voice-models/whisper-tiny/ so it ships inside the installer.
 * This is the always-available "floor" engine - voice dictation works on a
 * fresh install with zero download, fully offline.
 *
 * Larger/faster models (Whisper-base, Moonshine) are NOT bundled - they
 * download on-demand via VoiceAssetRegistry. This script only handles the
 * one bundled tiny model.
 *
 * Idempotent: skips files only when their pinned size and SHA-256 match.
 * Pattern follows prepareWaylandCore.js / prepareBundledBun.js.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');
const pinnedRelease = require('./voice-model-pinned-release.json');

// transformers.js loads Whisper-tiny multilingual from this HF repo.
// Multilingual (not .en) so non-English users get a usable floor.
const HF_REPO = 'Xenova/whisper-tiny';
const HF_BASE = `https://huggingface.co/${HF_REPO}/resolve/${pinnedRelease.revision}`;

const OUTPUT_DIR = path.join(__dirname, '..', 'resources', 'voice-models', 'whisper-tiny');

// Exact file set transformers.js needs for the automatic-speech-recognition
// pipeline. Quantized ONNX keeps the bundle near ~44 MB.
const FILES = Object.keys(pinnedRelease.files);

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

async function verifyPinnedFile(filePath, expected) {
  try {
    const stat = fs.statSync(filePath);
    return stat.isFile() && stat.size === expected.size && (await sha256File(filePath)) === expected.sha256;
  } catch {
    return false;
  }
}

function download(url, destPath, expected, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'wayland-build' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          if (redirectsLeft <= 0) {
            reject(new Error(`Too many redirects for ${url}`));
            return;
          }
          res.resume();
          // HF can return a relative Location - resolve against the current URL.
          const nextUrl = new URL(res.headers.location, url).href;
          download(nextUrl, destPath, expected, redirectsLeft - 1).then(resolve, reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          res.resume();
          return;
        }
        ensureDir(path.dirname(destPath));
        const tmpPath = destPath + '.tmp';
        const out = fs.createWriteStream(tmpPath);
        res.pipe(out);
        out.on('finish', () => {
          out.close(async () => {
            try {
              if (!(await verifyPinnedFile(tmpPath, expected))) {
                throw new Error(`Pinned size or SHA-256 mismatch for ${url}`);
              }
              fs.renameSync(tmpPath, destPath);
              resolve();
            } catch (error) {
              fs.rmSync(tmpPath, { force: true });
              reject(error);
            }
          });
        });
        out.on('error', (err) => {
          fs.rmSync(tmpPath, { force: true });
          reject(err);
        });
      })
      .on('error', reject);
  });
}

async function prepareVoiceModel(options = {}) {
  const authority = options.authority || pinnedRelease;
  const outputDir = options.outputDir || OUTPUT_DIR;
  const downloadImpl = options.downloadImpl || download;
  if (
    authority.contract !== 'wayland-voice-model-pin/1.0' ||
    authority.repository !== HF_REPO ||
    !/^[0-9a-f]{40}$/.test(authority.revision || '')
  ) {
    throw new Error('Invalid pinned voice-model authority');
  }
  const files = Object.keys(authority.files || {});
  if (files.length === 0) throw new Error('Pinned voice-model authority has no files');
  const baseUrl = `https://huggingface.co/${authority.repository}/resolve/${authority.revision}`;
  ensureDir(outputDir);
  let downloaded = 0;
  let skipped = 0;

  for (const file of files) {
    const expected = authority.files[file];
    const destPath = path.join(outputDir, file);
    if (await verifyPinnedFile(destPath, expected)) {
      skipped += 1;
      continue;
    }
    fs.rmSync(destPath, { force: true });
    process.stdout.write(`[prepareVoiceModel] downloading ${file} ... `);
    await downloadImpl(`${baseUrl}/${file}`, destPath, expected);
    if (!(await verifyPinnedFile(destPath, expected))) {
      fs.rmSync(destPath, { force: true });
      throw new Error(`Downloaded voice model failed pinned verification: ${file}`);
    }
    const mb = (fs.statSync(destPath).size / 1024 / 1024).toFixed(1);
    process.stdout.write(`ok (${mb} MB)\n`);
    downloaded += 1;
  }

  const totalBytes = files.reduce((sum, f) => {
    const p = path.join(outputDir, f);
    return sum + (fs.existsSync(p) ? fs.statSync(p).size : 0);
  }, 0);
  console.log(
    `[prepareVoiceModel] done - ${downloaded} downloaded, ${skipped} cached, ` +
      `${(totalBytes / 1024 / 1024).toFixed(1)} MB total at ${outputDir}`
  );
}

module.exports = prepareVoiceModel;
module.exports.FILES = FILES;
module.exports.HF_BASE = HF_BASE;
module.exports.verifyPinnedFile = verifyPinnedFile;

// Allow running directly: `node scripts/prepareVoiceModel.js`
if (require.main === module) {
  prepareVoiceModel().catch((err) => {
    console.error(`[prepareVoiceModel] FAILED: ${err.message}`);
    process.exitCode = 1;
  });
}
