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
 * Idempotent: skips files already present with a non-zero size.
 * Pattern follows prepareWaylandCore.js / prepareBundledBun.js.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// transformers.js loads Whisper-tiny multilingual from this HF repo.
// Multilingual (not .en) so non-English users get a usable floor.
const HF_REPO = 'Xenova/whisper-tiny';
const HF_BASE = `https://huggingface.co/${HF_REPO}/resolve/main`;

const OUTPUT_DIR = path.join(__dirname, '..', 'resources', 'voice-models', 'whisper-tiny');

// Exact file set transformers.js needs for the automatic-speech-recognition
// pipeline. Quantized ONNX keeps the bundle near ~44 MB.
const FILES = [
  'config.json',
  'generation_config.json',
  'preprocessor_config.json',
  'tokenizer.json',
  'tokenizer_config.json',
  'vocab.json',
  'merges.txt',
  'added_tokens.json',
  'normalizer.json',
  'special_tokens_map.json',
  'onnx/encoder_model_quantized.onnx',
  'onnx/decoder_model_merged_quantized.onnx',
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function download(url, destPath, redirectsLeft = 5) {
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
          download(nextUrl, destPath, redirectsLeft - 1).then(resolve, reject);
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
          out.close(() => {
            fs.renameSync(tmpPath, destPath);
            resolve();
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

async function prepareVoiceModel() {
  ensureDir(OUTPUT_DIR);
  let downloaded = 0;
  let skipped = 0;

  for (const file of FILES) {
    const destPath = path.join(OUTPUT_DIR, file);
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 0) {
      skipped += 1;
      continue;
    }
    process.stdout.write(`[prepareVoiceModel] downloading ${file} ... `);
    await download(`${HF_BASE}/${file}`, destPath);
    const mb = (fs.statSync(destPath).size / 1024 / 1024).toFixed(1);
    process.stdout.write(`ok (${mb} MB)\n`);
    downloaded += 1;
  }

  const totalBytes = FILES.reduce((sum, f) => {
    const p = path.join(OUTPUT_DIR, f);
    return sum + (fs.existsSync(p) ? fs.statSync(p).size : 0);
  }, 0);
  console.log(
    `[prepareVoiceModel] done - ${downloaded} downloaded, ${skipped} cached, ` +
      `${(totalBytes / 1024 / 1024).toFixed(1)} MB total at ${OUTPUT_DIR}`
  );
}

module.exports = prepareVoiceModel;

// Allow running directly: `node scripts/prepareVoiceModel.js`
if (require.main === module) {
  prepareVoiceModel().catch((err) => {
    console.error(`[prepareVoiceModel] FAILED: ${err.message}`);
    process.exitCode = 1;
  });
}
