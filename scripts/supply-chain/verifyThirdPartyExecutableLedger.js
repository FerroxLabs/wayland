'use strict';

const fs = require('node:fs');
const path = require('node:path');

const LEDGER_FILE = path.resolve(__dirname, 'third-party-executables.json');
const CONTRACT = 'wayland-third-party-executables/1.0';
const EXPECTED_IDS = ['7zip-recovery', 'bun', 'officecli', 'signal-cli'];
const EXPECTED_NAMES = {
  officecli: new Set(['officecli', 'officecli.exe']),
  bun: new Set(['bun', 'bun.exe']),
  '7zip-recovery': new Set(['7za.exe']),
  'signal-cli': new Set(['signal-cli']),
};
const SHA256 = /^[0-9a-f]{64}$/;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeSha(value) {
  return String(value || '')
    .replace(/^sha256:/, '')
    .toLowerCase();
}

function validateLedger(ledger, { projectRoot = path.resolve(__dirname, '../..') } = {}) {
  if (ledger?.contract !== CONTRACT || !Array.isArray(ledger.entries)) {
    throw new Error(`Unsupported executable authority ledger: expected ${CONTRACT}`);
  }
  const ids = ledger.entries.map((entry) => entry?.id).sort();
  if (JSON.stringify(ids) !== JSON.stringify(EXPECTED_IDS)) {
    throw new Error(`Executable authority ledger coverage mismatch: expected ${EXPECTED_IDS.join(', ')}`);
  }
  for (const entry of ledger.entries) {
    for (const key of ['owner', 'repository', 'version', 'updateOwner', 'authorityFile', 'verification']) {
      if (typeof entry[key] !== 'string' || entry[key].trim() === '') throw new Error(`${entry.id} is missing ${key}`);
    }
    if (!entry.license?.spdx || !entry.license?.evidence) throw new Error(`${entry.id} is missing license authority`);
    if (!Array.isArray(entry.executables) || entry.executables.length === 0)
      throw new Error(`${entry.id} has no executables`);
    if (!entry.hostedFallback || typeof entry.hostedFallback.available !== 'boolean') {
      throw new Error(`${entry.id} is missing hosted fallback facts`);
    }
    if (
      (!entry.hostedFallback.available &&
        (entry.hostedFallback.owner !== null || entry.hostedFallback.endpoint !== null)) ||
      (entry.hostedFallback.available && (!entry.hostedFallback.owner || !entry.hostedFallback.endpoint))
    ) {
      throw new Error(`${entry.id} has contradictory hosted fallback facts`);
    }
    const consent = entry.networkCostConsent;
    if (!consent || ['networkAccess', 'mayIncurCost', 'required'].some((key) => typeof consent[key] !== 'boolean')) {
      throw new Error(`${entry.id} is missing network/cost consent facts`);
    }
    if (typeof consent.disclosure !== 'string' || consent.disclosure.trim() === '') {
      throw new Error(`${entry.id} is missing network/cost disclosure`);
    }
    if ((!consent.networkAccess && consent.mayIncurCost) || (consent.mayIncurCost && !consent.required)) {
      throw new Error(`${entry.id} has contradictory network/cost consent facts`);
    }
    const authorityPath = path.resolve(projectRoot, entry.authorityFile);
    if (!authorityPath.startsWith(`${projectRoot}${path.sep}`) || !fs.statSync(authorityPath).isFile()) {
      throw new Error(`${entry.id} authority file is invalid`);
    }
    const authority = readJson(authorityPath);
    for (const executable of entry.executables) {
      if (!executable.asset || !EXPECTED_NAMES[entry.id].has(executable.name)) {
        throw new Error(`${entry.id} declares the wrong executable: ${executable.name || '<missing>'}`);
      }
      if (!SHA256.test(executable.sha256 || '')) throw new Error(`${entry.id}/${executable.asset} has invalid SHA-256`);
      let authoritative;
      if (entry.id === 'officecli') authoritative = authority?.[entry.version]?.[executable.asset];
      if (entry.id === 'bun') authoritative = authority?.[entry.version]?.[executable.asset]?.sha256;
      if (entry.id === 'signal-cli') authoritative = authority.binarySha256;
      if (entry.id === '7zip-recovery') {
        const packageManifest = readJson(path.resolve(projectRoot, 'package.json'));
        if (
          authority.contract !== 'wayland-classic-recovery-tools/1.0' ||
          authority.package !== '7zip-bin' ||
          authority.version !== entry.version ||
          packageManifest.dependencies?.['7zip-bin'] !== entry.version
        ) {
          throw new Error('7zip-recovery authority contract or version is unsupported');
        }
        authoritative = authority.executables?.[executable.asset]?.sha256;
      }
      if (normalizeSha(authoritative) !== executable.sha256) {
        throw new Error(`${entry.id}/${executable.asset} digest disagrees with ${entry.authorityFile}`);
      }
      if (executable.size !== undefined && (!Number.isSafeInteger(executable.size) || executable.size <= 0)) {
        throw new Error(`${entry.id}/${executable.asset} has invalid size`);
      }
      if (entry.id === 'bun') {
        const item = authority?.[entry.version]?.[executable.asset];
        if (item?.size !== executable.size)
          throw new Error(`${entry.id}/${executable.asset} size disagrees with authority`);
      }
      if (entry.id === '7zip-recovery') {
        const item = authority.executables?.[executable.asset];
        if (item?.name !== executable.name || item?.size !== executable.size) {
          throw new Error(`${entry.id}/${executable.asset} identity disagrees with authority`);
        }
      }
    }
    let authorityAssets;
    if (entry.id === 'officecli') authorityAssets = Object.keys(authority?.[entry.version] || {});
    if (entry.id === 'bun') authorityAssets = Object.keys(authority?.[entry.version] || {});
    if (entry.id === 'signal-cli') authorityAssets = [authority.asset];
    if (entry.id === '7zip-recovery') authorityAssets = Object.keys(authority.executables || {});
    const ledgerAssets = entry.executables.map((item) => item.asset).sort();
    if (JSON.stringify(ledgerAssets) !== JSON.stringify(authorityAssets.sort())) {
      throw new Error(`${entry.id} executable coverage disagrees with ${entry.authorityFile}`);
    }
  }
  return { contract: CONTRACT, entries: EXPECTED_IDS.length, ids: [...EXPECTED_IDS] };
}

function verifyThirdPartyExecutableLedger(options = {}) {
  const ledger = options.ledger || readJson(options.ledgerFile || LEDGER_FILE);
  return validateLedger(ledger, options);
}

module.exports = { CONTRACT, EXPECTED_IDS, LEDGER_FILE, validateLedger, verifyThirdPartyExecutableLedger };

if (require.main === module) {
  try {
    const receipt = verifyThirdPartyExecutableLedger();
    console.log(JSON.stringify(receipt));
  } catch (error) {
    console.error(`Executable authority verification failed: ${error.message}`);
    process.exit(1);
  }
}
