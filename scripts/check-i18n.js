#!/usr/bin/env node
/**
 * i18n validation script
 * Used by pre-commit hooks to validate i18n translation completeness and consistency.
 *
 * Usage: node scripts/check-i18n.js
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { REQUIRED_MODULES, collectReferenceKeys, getAllKeys } = require('./generate-i18n-types');
const i18nConfig = require('../src/common/config/i18n-config.json');

const REPO_ROOT = path.resolve(__dirname, '..');
const LOCALES_DIR = path.resolve(__dirname, '../src/renderer/services/i18n/locales');
const I18N_KEYS_DTS = path.resolve(__dirname, '../src/renderer/services/i18n/i18n-keys.d.ts');
const RENDERER_DIR = path.resolve(__dirname, '../src/renderer');
const SUPPORTED_LANGUAGES = i18nConfig.supportedLanguages;
const REFERENCE_LANGUAGE = i18nConfig.referenceLanguage;

let hasErrors = false;
let hasWarnings = false;

function logError(message) {
  console.error(`❌ ${message}`);
  hasErrors = true;
}

function logWarning(message) {
  console.warn(`⚠️  ${message}`);
  hasWarnings = true;
}

function logSuccess(message) {
  console.log(`✅ ${message}`);
}

function logInfo(message) {
  console.log(`ℹ️  ${message}`);
}

function extractTypeUnionValues(content, typeName) {
  const match = content.match(new RegExp(`export type ${typeName} =([\\s\\S]*?);`));
  if (!match) {
    return [];
  }

  const values = [];
  const valueRegex = /'([^']+)'/g;
  for (const item of match[1].matchAll(valueRegex)) {
    values.push(item[1]);
  }

  return values;
}

function isSameSet(a, b) {
  if (a.size !== b.size) {
    return false;
  }

  for (const item of a) {
    if (!b.has(item)) {
      return false;
    }
  }

  return true;
}

function checkI18nTypeDefinitionInSync() {
  console.log('\n🧩 Checking i18n key type definition sync...\n');

  if (!fs.existsSync(I18N_KEYS_DTS)) {
    logError(`Missing i18n key type file: ${path.relative(process.cwd(), I18N_KEYS_DTS)}`);
    logError('Run: vx node scripts/generate-i18n-types.js');
    return;
  }

  const actual = fs.readFileSync(I18N_KEYS_DTS, 'utf-8');
  const actualKeys = new Set(extractTypeUnionValues(actual, 'I18nKey'));
  const expectedKeys = new Set(collectReferenceKeys());

  if (!isSameSet(actualKeys, expectedKeys)) {
    logError(`Outdated i18n key type file: ${path.relative(process.cwd(), I18N_KEYS_DTS)}`);
    logError('Run: vx node scripts/generate-i18n-types.js');
    return;
  }

  const actualModules = new Set(extractTypeUnionValues(actual, 'I18nModule'));
  const expectedModules = new Set(REQUIRED_MODULES);
  if (!isSameSet(actualModules, expectedModules)) {
    logError(`Outdated i18n module type file: ${path.relative(process.cwd(), I18N_KEYS_DTS)}`);
    logError('Run: vx node scripts/generate-i18n-types.js');
    return;
  }

  logSuccess('i18n key type definition is in sync');
}

// Validate directory and file structure
function checkDirectoryStructure() {
  console.log('\n📁 Checking directory structure...\n');

  // Validate each locale directory
  for (const lang of SUPPORTED_LANGUAGES) {
    const langDir = path.join(LOCALES_DIR, lang);

    if (!fs.existsSync(langDir)) {
      logError(`Missing locale directory: ${lang}`);
      continue;
    }

    logSuccess(`Locale directory exists: ${lang}`);

    // Validate required module files
    for (const moduleName of REQUIRED_MODULES) {
      const moduleFile = path.join(langDir, `${moduleName}.json`);

      if (!fs.existsSync(moduleFile)) {
        logError(`Missing module file: ${lang}/${moduleName}.json`);
        continue;
      }

      // Validate JSON syntax
      try {
        const content = fs.readFileSync(moduleFile, 'utf-8');
        JSON.parse(content);
      } catch (error) {
        logError(`Invalid JSON: ${lang}/${moduleName}.json - ${error.message}`);
      }
    }

    // Validate index.ts
    const indexFile = path.join(langDir, 'index.ts');
    if (!fs.existsSync(indexFile)) {
      logWarning(`Missing index file: ${lang}/index.ts`);
    }
  }

  // Validate legacy single JSON files are removed
  for (const lang of SUPPORTED_LANGUAGES) {
    const oldFile = path.join(LOCALES_DIR, `${lang}.json`);
    if (fs.existsSync(oldFile)) {
      logError(`Found legacy JSON file, please remove: ${lang}.json`);
    }
  }
}

// Validate translation key consistency across locales
function checkTranslationKeys() {
  console.log('\n🔑 Checking translation key consistency...\n');

  const referenceLang = REFERENCE_LANGUAGE;
  const referenceKeys = {};

  // Collect baseline keys from reference locale
  for (const moduleName of REQUIRED_MODULES) {
    const moduleFile = path.join(LOCALES_DIR, referenceLang, `${moduleName}.json`);
    if (fs.existsSync(moduleFile)) {
      try {
        const content = JSON.parse(fs.readFileSync(moduleFile, 'utf-8'));
        referenceKeys[moduleName] = getAllKeys(content);
      } catch {
        logError(`Failed to read reference module: ${referenceLang}/${moduleName}.json`);
      }
    }
  }

  // Validate other locales against baseline
  for (const lang of SUPPORTED_LANGUAGES) {
    if (lang === referenceLang) continue;

    logInfo(`Checking ${lang}...`);

    let missingCount = 0;

    for (const moduleName of REQUIRED_MODULES) {
      const moduleFile = path.join(LOCALES_DIR, lang, `${moduleName}.json`);
      const expectedKeys = referenceKeys[moduleName] || [];

      if (fs.existsSync(moduleFile)) {
        try {
          const content = JSON.parse(fs.readFileSync(moduleFile, 'utf-8'));
          const actualKeySet = new Set(getAllKeys(content));

          const missing = expectedKeys.filter((key) => !actualKeySet.has(key));
          missingCount += missing.length;

          if (missing.length > 0) {
            logWarning(
              `${lang}/${moduleName}.json is missing ${missing.length} keys: ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? '...' : ''}`
            );
          }
        } catch {
          logError(`Failed to read module: ${lang}/${moduleName}.json`);
        }
      }
    }

    const totalKeys = Object.values(referenceKeys).flat().length;
    const missingPercent = totalKeys > 0 ? ((missingCount / totalKeys) * 100).toFixed(1) : '0.0';

    if (missingCount > 0) {
      logWarning(`${lang} is missing ${missingCount} keys (${missingPercent}%)`);
    } else {
      logSuccess(`${lang} translations are complete`);
    }
  }
}

function collectEmptyValuePaths(obj, prefix = '') {
  const emptyPaths = [];

  if (typeof obj !== 'object' || obj === null) {
    return emptyPaths;
  }

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'object' && value !== null) {
      emptyPaths.push(...collectEmptyValuePaths(value, fullKey));
      continue;
    }

    if (typeof value === 'string' && value.trim() === '') {
      emptyPaths.push(fullKey);
    }
  }

  return emptyPaths;
}

function emptyModuleSnapshot() {
  return { keys: new Set(), emptyValues: new Set() };
}

function createModuleSnapshot(data) {
  return {
    keys: new Set(getAllKeys(data)),
    emptyValues: new Set(collectEmptyValuePaths(data)),
  };
}

function readGitObjectsAtCommit(commitSha, relativePaths) {
  const contents = new Map();
  if (relativePaths.length === 0) {
    return contents;
  }

  const objectSpecs = relativePaths.map((relativePath) => `${commitSha}:${relativePath}`);
  let output;

  try {
    output = execFileSync('git', ['cat-file', '--batch'], {
      cwd: REPO_ROOT,
      input: `${objectSpecs.join('\n')}\n`,
      maxBuffer: 256 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (error) {
    logError(`Failed to read base Git objects: ${error.message}`);
    return contents;
  }

  let offset = 0;
  for (let index = 0; index < relativePaths.length; index += 1) {
    const relativePath = relativePaths[index];
    const headerEnd = output.indexOf(0x0a, offset);
    if (headerEnd === -1) {
      logError(`Malformed Git batch response while reading ${relativePath}`);
      break;
    }

    const header = output.subarray(offset, headerEnd).toString('utf8');
    offset = headerEnd + 1;

    if (header.endsWith(' missing')) {
      contents.set(relativePath, null);
      continue;
    }

    const headerMatch = header.match(/^[0-9a-f]+ blob (\d+)$/);
    if (!headerMatch) {
      logError(`Unexpected Git batch response for ${relativePath}: ${header}`);
      break;
    }

    const byteLength = Number.parseInt(headerMatch[1], 10);
    const contentEnd = offset + byteLength;
    if (contentEnd > output.length) {
      logError(`Truncated Git batch response while reading ${relativePath}`);
      break;
    }

    contents.set(relativePath, output.subarray(offset, contentEnd).toString('utf8'));
    offset = contentEnd;

    if (output[offset] !== 0x0a) {
      logError(`Malformed Git batch separator while reading ${relativePath}`);
      break;
    }
    offset += 1;
  }

  return contents;
}

function readCurrentModuleSnapshot(lang, moduleName) {
  const moduleFile = path.join(LOCALES_DIR, lang, `${moduleName}.json`);
  if (!fs.existsSync(moduleFile)) {
    return emptyModuleSnapshot();
  }

  try {
    return createModuleSnapshot(JSON.parse(fs.readFileSync(moduleFile, 'utf8')));
  } catch {
    // Syntax and read errors are reported by the existing structure checks.
    return emptyModuleSnapshot();
  }
}

const baseModuleSnapshotCache = new Map();

function loadBaseModuleSnapshots(baseSha) {
  const cached = baseModuleSnapshotCache.get(baseSha);
  if (cached) {
    return cached;
  }

  const relativePaths = [];
  for (const lang of SUPPORTED_LANGUAGES) {
    for (const moduleName of REQUIRED_MODULES) {
      relativePaths.push(path.posix.join('src/renderer/services/i18n/locales', lang, `${moduleName}.json`));
    }
  }

  const objectContents = readGitObjectsAtCommit(baseSha, relativePaths);
  const snapshots = new Map();

  for (const relativePath of relativePaths) {
    const content = objectContents.get(relativePath);
    if (content === null || content === undefined) {
      snapshots.set(relativePath, emptyModuleSnapshot());
      continue;
    }

    try {
      snapshots.set(relativePath, createModuleSnapshot(JSON.parse(content)));
    } catch (error) {
      logError(`Failed to parse base module ${relativePath}: ${error.message}`);
      snapshots.set(relativePath, emptyModuleSnapshot());
    }
  }

  baseModuleSnapshotCache.set(baseSha, snapshots);
  return snapshots;
}

function readBaseModuleSnapshot(baseSha, lang, moduleName) {
  const relativePath = path.posix.join('src/renderer/services/i18n/locales', lang, `${moduleName}.json`);
  return loadBaseModuleSnapshots(baseSha).get(relativePath) ?? emptyModuleSnapshot();
}

function difference(left, right) {
  return new Set([...left].filter((value) => !right.has(value)));
}

function formatRegressionKeys(keys) {
  const sorted = [...keys].sort();
  const visible = sorted.slice(0, 20).join(', ');
  return sorted.length > 20 ? `${visible}... (${sorted.length} total)` : visible;
}

function checkTranslationRegressions(baseSha) {
  console.log('\n🛡️  Checking PR translation regressions...\n');

  if (!/^[0-9a-f]{40}$/.test(baseSha)) {
    logError('I18N_BASE_SHA must be an immutable 40-character lowercase Git SHA');
    return;
  }

  try {
    execFileSync('git', ['cat-file', '-e', `${baseSha}^{commit}`], {
      cwd: REPO_ROOT,
      stdio: 'ignore',
    });
  } catch {
    logError(`I18N_BASE_SHA is not an available commit: ${baseSha}`);
    return;
  }

  for (const moduleName of REQUIRED_MODULES) {
    const baseReference = readBaseModuleSnapshot(baseSha, REFERENCE_LANGUAGE, moduleName);
    const currentReference = readCurrentModuleSnapshot(REFERENCE_LANGUAGE, moduleName);
    const removedReferenceKeys = difference(baseReference.keys, currentReference.keys);

    if (removedReferenceKeys.size > 0) {
      logError(
        `${REFERENCE_LANGUAGE}/${moduleName}.json removed reference keys: ${formatRegressionKeys(removedReferenceKeys)}`
      );
    }

    for (const lang of SUPPORTED_LANGUAGES) {
      const baseLocale = readBaseModuleSnapshot(baseSha, lang, moduleName);
      const currentLocale = readCurrentModuleSnapshot(lang, moduleName);

      if (lang !== REFERENCE_LANGUAGE) {
        const baseMissing = difference(baseReference.keys, baseLocale.keys);
        const currentMissing = difference(currentReference.keys, currentLocale.keys);
        const newlyMissing = difference(currentMissing, baseMissing);
        if (newlyMissing.size > 0) {
          logError(`${lang}/${moduleName}.json newly missing: ${formatRegressionKeys(newlyMissing)}`);
        }
      }

      const newlyEmpty = difference(currentLocale.emptyValues, baseLocale.emptyValues);
      if (newlyEmpty.size > 0) {
        logError(`${lang}/${moduleName}.json newly empty: ${formatRegressionKeys(newlyEmpty)}`);
      }
    }
  }
}

// Validate empty translation modules and empty string values
function checkEmptyTranslations() {
  console.log('\n📭 Checking for empty translations...\n');

  for (const lang of SUPPORTED_LANGUAGES) {
    for (const moduleName of REQUIRED_MODULES) {
      const moduleFile = path.join(LOCALES_DIR, lang, `${moduleName}.json`);

      if (fs.existsSync(moduleFile)) {
        try {
          const content = fs.readFileSync(moduleFile, 'utf-8');
          const data = JSON.parse(content);

          if (Object.keys(data).length === 0) {
            logWarning(`Empty module: ${lang}/${moduleName}.json`);
            continue;
          }

          const emptyValuePaths = collectEmptyValuePaths(data);
          if (emptyValuePaths.length > 0) {
            logWarning(
              `${lang}/${moduleName}.json has ${emptyValuePaths.length} empty values: ${emptyValuePaths.slice(0, 3).join(', ')}${emptyValuePaths.length > 3 ? '...' : ''}`
            );
          }
        } catch {
          // Already reported by other checks
        }
      }
    }
  }
}

function collectAllCodeFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === 'i18n-keys.d.ts') {
      continue;
    }

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'out') {
        continue;
      }
      files.push(...collectAllCodeFiles(fullPath));
      continue;
    }

    if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }

  return files;
}

function stripComments(code) {
  return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function buildReferenceKeySet() {
  const keySet = new Set();

  for (const moduleName of REQUIRED_MODULES) {
    const moduleFile = path.join(LOCALES_DIR, REFERENCE_LANGUAGE, `${moduleName}.json`);
    if (!fs.existsSync(moduleFile)) {
      continue;
    }

    const content = JSON.parse(fs.readFileSync(moduleFile, 'utf-8'));
    const keys = getAllKeys(content);
    for (const key of keys) {
      keySet.add(`${moduleName}.${key}`);
    }
  }

  return keySet;
}

function collectTKeyPrefixes(code) {
  const prefixes = new Set();
  const hookRegex = /\bconst\s*\{\s*t\s*\}\s*=\s*useTranslation\(([^)]*)\)/g;
  let bindingCount = 0;
  let prefixedBindingCount = 0;

  for (const match of code.matchAll(hookRegex)) {
    bindingCount += 1;
    const prefixMatch = match[1].match(/\bkeyPrefix\s*:\s*(['"`])([^'"`]+)\1/);
    if (prefixMatch) {
      prefixedBindingCount += 1;
      prefixes.add(prefixMatch[2].trim());
    }
  }

  // File-level matching is safe only when every unaliased `t` binding uses
  // the same prefix. Mixed bindings remain warning-only rather than risk
  // suppressing a genuinely unresolved literal.
  return prefixes.size === 1 && prefixedBindingCount === bindingCount ? prefixes : new Set();
}

function collectUnknownLiteralKeys(code, referenceKeySet) {
  const strippedCode = stripComments(code);
  const keyPrefixes = collectTKeyPrefixes(strippedCode);
  const keyRegex = /\b(?:i18n\.)?t\(\s*(['"`])([^'"`]+)\1/g;
  const unknownKeys = [];

  for (const match of strippedCode.matchAll(keyRegex)) {
    const key = match[2].trim();
    const followingCode = strippedCode.slice((match.index ?? 0) + match[0].length);

    if (!key || key.includes('${') || key.startsWith('http://') || key.startsWith('https://')) {
      continue;
    }

    // This is a dynamic expression, not a complete literal key. Its runtime
    // variants are validated by the generated-key type and focused tests.
    if (/^\s*\+/.test(followingCode) || !key.includes('.')) {
      continue;
    }

    const matchesReference =
      referenceKeySet.has(key) || Array.from(keyPrefixes).some((prefix) => referenceKeySet.has(`${prefix}.${key}`));

    if (!matchesReference) {
      unknownKeys.push(key);
    }
  }

  return unknownKeys;
}

function relativeRendererPath(file) {
  return path.relative(REPO_ROOT, file).split(path.sep).join('/');
}

function addUnknownLiteralUsages(usages, relativePath, code, referenceKeySet) {
  for (const key of collectUnknownLiteralKeys(code, referenceKeySet)) {
    const identity = `${relativePath}\0${key}`;
    usages.set(identity, (usages.get(identity) ?? 0) + 1);
  }
}

function collectCurrentUnknownLiteralUsages(referenceKeySet) {
  const usages = new Map();

  for (const file of collectAllCodeFiles(RENDERER_DIR)) {
    const relativePath = relativeRendererPath(file);
    const code = fs.readFileSync(file, 'utf8');
    addUnknownLiteralUsages(usages, relativePath, code, referenceKeySet);
  }

  return usages;
}

function buildBaseReferenceKeySet(baseSha) {
  const keySet = new Set();

  for (const moduleName of REQUIRED_MODULES) {
    const snapshot = readBaseModuleSnapshot(baseSha, REFERENCE_LANGUAGE, moduleName);
    for (const key of snapshot.keys) {
      keySet.add(`${moduleName}.${key}`);
    }
  }

  return keySet;
}

function collectBaseUnknownLiteralUsages(baseSha, referenceKeySet) {
  const usages = new Map();
  let files;

  try {
    files = execFileSync('git', ['ls-tree', '-r', '--name-only', '-z', baseSha, '--', 'src/renderer'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
      .split('\0')
      .filter((file) => (file.endsWith('.ts') || file.endsWith('.tsx')) && !file.endsWith('/i18n-keys.d.ts'));
  } catch (error) {
    logError(`Failed to list base renderer files: ${error.message}`);
    return usages;
  }

  const objectContents = readGitObjectsAtCommit(baseSha, files);
  for (const file of files) {
    const code = objectContents.get(file);
    if (code === null || code === undefined) {
      logError(`Failed to read base renderer file ${file}`);
      continue;
    }
    addUnknownLiteralUsages(usages, file, code, referenceKeySet);
  }

  return usages;
}

function checkLiteralKeyRegressions(baseSha) {
  console.log('\n🛡️  Checking PR literal-key regressions...\n');

  if (!/^[0-9a-f]{40}$/.test(baseSha)) {
    return;
  }

  try {
    execFileSync('git', ['cat-file', '-e', `${baseSha}^{commit}`], {
      cwd: REPO_ROOT,
      stdio: 'ignore',
    });
  } catch {
    return;
  }

  const currentUnknown = collectCurrentUnknownLiteralUsages(buildReferenceKeySet());
  const baseUnknown = collectBaseUnknownLiteralUsages(baseSha, buildBaseReferenceKeySet(baseSha));

  for (const [usage, currentCount] of currentUnknown) {
    const baseCount = baseUnknown.get(usage) ?? 0;
    if (currentCount <= baseCount) {
      continue;
    }

    const [file, key] = usage.split('\0');
    const addedCount = currentCount - baseCount;
    const countSuffix = addedCount > 1 ? ` (${addedCount} new usages)` : '';
    logError(`new unknown literal i18n key: ${key} (${file})${countSuffix}`);
  }
}

function checkLiteralKeyUsages() {
  console.log('\n🧪 Checking literal t() key usages...\n');

  const referenceKeySet = buildReferenceKeySet();
  const files = collectAllCodeFiles(RENDERER_DIR);

  let invalidCount = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    for (const key of collectUnknownLiteralKeys(content, referenceKeySet)) {
      invalidCount += 1;
      logWarning(`Unknown i18n key: ${key} (${path.relative(process.cwd(), file)})`);
    }
  }

  if (invalidCount === 0) {
    logSuccess('No invalid literal i18n keys found in renderer code');
  } else {
    logInfo(`Found ${invalidCount} unknown literal i18n keys (warning only)`);
  }
}

// Validate i18n runtime config
function checkIndexConfig() {
  console.log('\n⚙️  Checking i18n configuration...\n');

  const indexFile = path.join(__dirname, '../src/renderer/services/i18n/index.ts');

  if (!fs.existsSync(indexFile)) {
    logError('Missing i18n config file: src/renderer/services/i18n/index.ts');
    return;
  }

  const content = fs.readFileSync(indexFile, 'utf-8');

  if (!content.includes('i18n-config.json')) {
    logError('i18n config should load shared constants from src/common/config/i18n-config.json');
  }

  if (!content.includes('export const supportedLanguages')) {
    logError('i18n config should export supportedLanguages');
  }

  // Ensure lazy loading support exists
  if (!content.includes('loadLocaleModules') && !content.includes('import(')) {
    logWarning('i18n config may not be using lazy loading');
  }

  logSuccess('i18n configuration check passed');
}

function main() {
  console.log('\n🔍 i18n validation started\n');
  console.log('========================================');

  checkDirectoryStructure();
  checkTranslationKeys();
  checkEmptyTranslations();
  if (process.env.I18N_BASE_SHA) {
    checkTranslationRegressions(process.env.I18N_BASE_SHA);
    checkLiteralKeyRegressions(process.env.I18N_BASE_SHA);
  }
  checkLiteralKeyUsages();
  checkI18nTypeDefinitionInSync();
  checkIndexConfig();

  console.log('\n========================================');
  console.log('\n📊 Validation summary:\n');

  if (hasErrors) {
    console.log('❌ Validation failed. Please fix the issues before committing.');
    process.exit(1);
  }

  if (hasWarnings) {
    console.log('⚠️  Warnings found.');
  }

  console.log('✅ i18n validation passed\n');
  process.exit(0);
}

main();
