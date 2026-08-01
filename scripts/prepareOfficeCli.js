#!/usr/bin/env node

/**
 * Prepare the native, provider-neutral OfficeCLI authoring binary for Desktop.
 *
 * This deliberately does not run OfficeCLI's install script: even a script
 * fetched from a tagged tree currently resolves the moving `latest` release.
 * Desktop instead downloads one exact release asset and verifies its pinned
 * SHA-256 before copying, executing, or packaging it.
 *
 * Output:
 *   resources/bundled-officecli/{platform}-{arch}/officecli[.exe]
 */

'use strict';

const { execFileSync, spawnSync } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const GITHUB_REPO = 'iOfficeAI/OfficeCLI';
const DEFAULT_OFFICECLI_VERSION = 'v1.0.136';
const SHASUMS_FILE = path.resolve(__dirname, 'bundled-officecli-shasums.json');
const OUTPUT_ROOT = path.resolve(__dirname, '../resources/bundled-officecli');
const CONTRACT_FILE = path.resolve(__dirname, '../contracts/officecli/v1/contract.json');
const SKILLS_ROOT = path.resolve(__dirname, '../src/process/resources/skills');
const LEDGER_FILE = path.resolve(__dirname, 'supply-chain/third-party-executables.json');
const { verifyThirdPartyExecutableLedger } = require('./supply-chain/verifyThirdPartyExecutableLedger');
const DARWIN_PUBLISHER_TEAM_ID = '52JQX2HUSC';
const DARWIN_ALLOWED_ENTITLEMENTS = ['com.apple.security.cs.allow-jit'];

function getAssetName(platform, arch, libc = 'gnu') {
  if (!['x64', 'arm64'].includes(arch)) {
    throw new Error(`Unsupported OfficeCLI architecture: ${arch}`);
  }

  if (platform === 'darwin') return `officecli-mac-${arch}`;
  if (platform === 'win32') return `officecli-win-${arch}.exe`;
  if (platform === 'linux') {
    return libc === 'musl' ? `officecli-linux-alpine-${arch}` : `officecli-linux-${arch}`;
  }
  throw new Error(`Unsupported OfficeCLI platform: ${platform}`);
}

function getBinaryName(platform) {
  return platform === 'win32' ? 'officecli.exe' : 'officecli';
}

function normalizeSha(raw, assetName, version) {
  const sha = String(raw || '')
    .replace(/^sha256:/i, '')
    .trim()
    .toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(sha)) {
    throw new Error(`Missing or malformed SHA-256 for ${assetName} at ${version}`);
  }
  return sha;
}

function loadExpectedSha(version, assetName) {
  const manifest = JSON.parse(fs.readFileSync(SHASUMS_FILE, 'utf8'));
  return normalizeSha(manifest?.[version]?.[assetName], assetName, version);
}

function computeSha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function digestValue(value) {
  return `sha256:${crypto.createHash('sha256').update(canonical(value)).digest('hex')}`;
}

function assertExactStrings(actual, expected, label) {
  if (
    !Array.isArray(actual) ||
    actual.some((entry) => typeof entry !== 'string' || entry.length === 0) ||
    new Set(actual).size !== actual.length ||
    JSON.stringify([...actual].sort()) !== JSON.stringify([...expected].sort())
  ) {
    throw new Error(`${label} must exactly equal: ${expected.join(', ')}`);
  }
}

function verifyFile(filePath, expectedSha, assetName, version) {
  const actualSha = computeSha256(filePath);
  if (actualSha !== expectedSha) {
    throw new Error(
      `OfficeCLI checksum mismatch for ${assetName} at ${version}: expected ${expectedSha}, got ${actualSha}`
    );
  }
  return actualSha;
}

function assertDarwinPublisherSignature(details, entitlements) {
  if (!details.includes(`TeamIdentifier=${DARWIN_PUBLISHER_TEAM_ID}`)) {
    throw new Error(`OfficeCLI macOS publisher TeamIdentifier must be ${DARWIN_PUBLISHER_TEAM_ID}`);
  }
  if (!/^Authority=Developer ID Application:/m.test(details)) {
    throw new Error('OfficeCLI macOS binary is not signed by a Developer ID Application identity');
  }
  if (!/^CodeDirectory .*flags=.*\(runtime\)/m.test(details)) {
    throw new Error('OfficeCLI macOS binary is not protected by the hardened runtime');
  }
  if (!/^Timestamp=.+/m.test(details)) {
    throw new Error('OfficeCLI macOS publisher signature is missing a secure timestamp');
  }

  const enabledEntitlements = [...String(entitlements).matchAll(/<key>([^<]+)<\/key>\s*<true\s*\/>/g)]
    .map((match) => match[1])
    .sort();
  if (JSON.stringify(enabledEntitlements) !== JSON.stringify(DARWIN_ALLOWED_ENTITLEMENTS)) {
    throw new Error(
      `OfficeCLI macOS entitlements must be exactly ${DARWIN_ALLOWED_ENTITLEMENTS.join(', ')}; got ${
        enabledEntitlements.join(', ') || '<none>'
      }`
    );
  }

  return {
    contract: 'apple-developer-id/1.0',
    teamIdentifier: DARWIN_PUBLISHER_TEAM_ID,
    hardenedRuntime: true,
    secureTimestamp: true,
    entitlements: enabledEntitlements,
  };
}

function runCodesign(args, label) {
  const result = spawnSync('/usr/bin/codesign', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.error || result.status !== 0) {
    const detail = [result.stderr, result.stdout, result.error?.message].filter(Boolean).join('\n').trim();
    throw new Error(`OfficeCLI macOS ${label} failed${detail ? `: ${detail}` : ''}`);
  }
  return `${result.stdout || ''}${result.stderr || ''}`;
}

function verifyDarwinPublisherSignature(binaryPath) {
  runCodesign(['--verify', '--strict', '--verbose=4', binaryPath], 'publisher signature verification');
  const details = runCodesign(['--display', '--verbose=4', binaryPath], 'publisher signature inspection');
  const entitlements = runCodesign(
    ['--display', '--entitlements', ':-', binaryPath],
    'publisher entitlement inspection'
  );
  return assertDarwinPublisherSignature(details, entitlements);
}

function loadContract() {
  const contract = JSON.parse(fs.readFileSync(CONTRACT_FILE, 'utf8'));
  const requiredKeys = [
    'contract',
    'major',
    'minor',
    'release',
    'requiredCommands',
    'requiredFormats',
    'requiredOperations',
    'requiredSkills',
    'requiredElements',
    'previewCommand',
  ];
  if (
    !contract ||
    typeof contract !== 'object' ||
    JSON.stringify(Object.keys(contract).sort()) !== JSON.stringify(requiredKeys.sort()) ||
    contract.contract !== 'wayland-officecli-authoring' ||
    contract.major !== 1 ||
    contract.minor !== 0 ||
    contract.release !== DEFAULT_OFFICECLI_VERSION ||
    !contract.requiredElements ||
    typeof contract.requiredElements !== 'object' ||
    !Array.isArray(contract.requiredSkills)
  ) {
    throw new Error('OfficeCLI authoring contract is malformed or unsupported');
  }
  assertExactStrings(contract.requiredFormats, ['docx', 'xlsx', 'pptx'], 'OfficeCLI contract formats');
  assertExactStrings(
    contract.requiredOperations,
    ['create', 'mutate', 'query', 'validate', 'view'],
    'OfficeCLI contract operations'
  );
  assertExactStrings(Object.keys(contract.requiredElements), contract.requiredFormats, 'OfficeCLI element formats');
  if (!contract.requiredCommands.includes(contract.previewCommand)) {
    throw new Error('OfficeCLI preview command is not part of the required command set');
  }
  return contract;
}

function verifyBundledSkillDigests(contract = loadContract(), skillsRoot = SKILLS_ROOT) {
  const declared = contract.requiredSkills.map((skill) => {
    if (
      !skill ||
      typeof skill.id !== 'string' ||
      typeof skill.path !== 'string' ||
      !/^sha256:[0-9a-f]{64}$/.test(skill.sha256) ||
      path.isAbsolute(skill.path) ||
      skill.path.split(/[\\/]/).includes('..')
    ) {
      throw new Error('OfficeCLI skill contract contains a malformed identity');
    }
    return skill;
  });
  if (new Set(declared.map((skill) => skill.id)).size !== declared.length) {
    throw new Error('OfficeCLI skill contract contains duplicate ids');
  }
  if (new Set(declared.map((skill) => skill.path)).size !== declared.length) {
    throw new Error('OfficeCLI skill contract contains duplicate paths');
  }

  const discovered = [];
  const visit = (relativeDir) => {
    const absoluteDir = path.join(skillsRoot, relativeDir);
    for (const entry of fs.readdirSync(absoluteDir, { withFileTypes: true })) {
      const relative = path.posix.join(relativeDir.split(path.sep).join('/'), entry.name);
      const absolute = path.join(skillsRoot, relative);
      if (entry.isSymbolicLink()) throw new Error(`OfficeCLI skill path is symbolic: ${relative}`);
      if (entry.isDirectory()) visit(relative);
      else if (entry.isFile()) discovered.push(relative);
      else throw new Error(`OfficeCLI skill path has an unsupported type: ${relative}`);
    }
  };
  for (const entry of fs.readdirSync(skillsRoot, { withFileTypes: true })) {
    if (!entry.name.startsWith('officecli-')) continue;
    if (entry.isSymbolicLink() || !entry.isDirectory()) {
      throw new Error(`OfficeCLI skill namespace has an unsupported top-level entry: ${entry.name}`);
    }
    visit(entry.name);
  }
  const builtinDir = path.join(skillsRoot, '_builtin', 'office-cli');
  if (fs.existsSync(builtinDir)) {
    const builtinStat = fs.lstatSync(builtinDir);
    if (builtinStat.isSymbolicLink() || !builtinStat.isDirectory()) {
      throw new Error('OfficeCLI built-in skill namespace has an unsupported top-level entry');
    }
    visit('_builtin/office-cli');
  }
  assertExactStrings(
    discovered,
    declared.map((skill) => skill.path),
    'OfficeCLI bundled skill paths'
  );

  const rootReal = fs.realpathSync(skillsRoot);
  const skills = declared
    .map((skill) => {
      const absolute = path.resolve(skillsRoot, skill.path);
      const real = fs.realpathSync(absolute);
      if (!real.startsWith(`${rootReal}${path.sep}`) || !fs.statSync(real).isFile()) {
        throw new Error(`OfficeCLI skill path escapes the canonical skill root: ${skill.path}`);
      }
      const actual = `sha256:${computeSha256(real)}`;
      if (actual !== skill.sha256) throw new Error(`OfficeCLI skill digest mismatch: ${skill.id}`);
      return { id: skill.id, path: skill.path, sha256: actual };
    })
    .sort((left, right) => left.id.localeCompare(right.id));
  return { contract: 'wayland-officecli-skills/1.0', skills };
}

function loadOfficeCliLedgerProof() {
  verifyThirdPartyExecutableLedger();
  const ledger = JSON.parse(fs.readFileSync(LEDGER_FILE, 'utf8'));
  const entry = ledger.entries.find((candidate) => candidate.id === 'officecli');
  if (
    !entry ||
    entry.version !== DEFAULT_OFFICECLI_VERSION ||
    entry.hostedFallback?.available !== false ||
    entry.hostedFallback?.owner !== null ||
    entry.hostedFallback?.endpoint !== null ||
    entry.networkCostConsent?.networkAccess !== false ||
    entry.networkCostConsent?.mayIncurCost !== false ||
    entry.networkCostConsent?.required !== false
  ) {
    throw new Error('OfficeCLI ledger does not prove an exact local-only executable');
  }
  return {
    contract: ledger.contract,
    ledgerSha256: digestValue(ledger),
    entrySha256: digestValue(entry),
    hostedFallbackAvailable: false,
  };
}

function getCapabilityFixtureDigest(contract = loadContract()) {
  const shasums = JSON.parse(fs.readFileSync(SHASUMS_FILE, 'utf8'))[contract.release];
  const publisherProofSha256 = 'sha256:70187627656cb6a140ff05ea86682548ca47de196e8aa379152e29eb003b44ff';
  const platforms = [
    ['darwin', 'arm64', 'officecli-mac-arm64', publisherProofSha256],
    ['darwin', 'x64', 'officecli-mac-x64', publisherProofSha256],
    ['linux', 'arm64', 'officecli-linux-arm64'],
    ['linux', 'x64', 'officecli-linux-x64'],
    ['win32', 'arm64', 'officecli-win-arm64.exe'],
    ['win32', 'x64', 'officecli-win-x64.exe'],
  ].map(([platform, arch, artifact, publisherProof]) => ({
    platform,
    arch,
    artifact,
    binarySha256: `sha256:${normalizeSha(shasums[artifact], artifact, contract.release)}`,
    ...(publisherProof ? { publisherProofSha256: publisherProof } : {}),
  }));
  return digestValue({
    id: 'office.native-authoring',
    version: contract.release.replace(/^v/, ''),
    operations: contract.requiredOperations,
    formats: contract.requiredFormats,
    dependencies: [],
    hostAvailability: 'target-bundled',
    backendSupport: ['acp', 'gemini', 'wcore'],
    executionMode: 'local-binary',
    requirements: { permission: 'ask-or-trusted-edits', network: 'none', cost: 'none', credentials: [] },
    platforms,
    degradedBehavior: 'unavailable-no-fallback',
    enforceability: 'enforced',
  });
}

function assertContractOutputs(versionOutput, topLevelHelp, formatHelp, watchHelp, contract = loadContract()) {
  const reportedVersion = String(versionOutput).trim().replace(/^v/i, '');
  const expectedVersion = String(contract.release).replace(/^v/i, '');
  if (reportedVersion !== expectedVersion) {
    throw new Error(`OfficeCLI contract version mismatch: expected ${expectedVersion}, got ${reportedVersion}`);
  }

  const helpText = String(topLevelHelp);
  const commandSection = helpText.includes('Commands:')
    ? helpText.slice(helpText.indexOf('Commands:') + 'Commands:'.length, helpText.indexOf('Schema Reference'))
    : helpText;
  const commandRows = [...commandSection.matchAll(/^ {2}([a-z][a-z0-9-]*)(?=\s|$)/gim)].map((match) =>
    match[1].toLowerCase()
  );
  assertExactStrings(commandRows, contract.requiredCommands, 'OfficeCLI executable commands');

  for (const [format, requiredElements] of Object.entries(contract.requiredElements)) {
    const help = String(formatHelp[format] || '');
    for (const element of requiredElements) {
      const elementRow = new RegExp(`^\\s+${element}(?=\\s|$)`, 'im');
      if (!elementRow.test(help)) throw new Error(`OfficeCLI ${format} contract is missing element: ${element}`);
    }
  }

  if (!new RegExp(`officecli\\s+${contract.previewCommand}\\s+<file>`, 'i').test(watchHelp)) {
    throw new Error(`OfficeCLI preview contract is missing: ${contract.previewCommand}`);
  }
  return { contract: `${contract.contract}/${contract.major}.${contract.minor}`, release: contract.release };
}

function verifyExecutableContract(binaryPath) {
  const contract = loadContract();
  const run = (args) =>
    execFileSync(binaryPath, args, {
      encoding: 'utf8',
      timeout: 10_000,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  const formatHelp = Object.fromEntries(
    Object.keys(contract.requiredElements).map((format) => [format, run(['help', format])])
  );
  return assertContractOutputs(run(['--version']), run(['--help']), formatHelp, run(['watch', '--help']), contract);
}

function verifyExecutableSmoke(binaryPath) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-officecli-smoke-'));
  const files = {
    docx: path.join(tempDir, 'proof.docx'),
    xlsx: path.join(tempDir, 'proof.xlsx'),
    pptx: path.join(tempDir, 'proof.pptx'),
  };
  const run = (args) =>
    execFileSync(binaryPath, args, {
      encoding: 'utf8',
      timeout: 15_000,
      maxBuffer: 2 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

  try {
    run(['create', files.docx, '--force', '--json']);
    run(['add', files.docx, '/body', '--type', 'paragraph', '--prop', 'text=Wayland', '--json']);
    if (!run(['query', files.docx, 'paragraph', '--json']).includes('Wayland')) {
      throw new Error('OfficeCLI DOCX smoke query did not return the inserted paragraph');
    }
    run([
      'add',
      files.docx,
      '/body',
      '--type',
      'sdt',
      '--prop',
      'type=text',
      '--prop',
      'alias=Employee Name',
      '--prop',
      'tag=employee_name',
      '--prop',
      'text=Enter name',
      '--prop',
      'lock=sdtLocked',
      '--json',
    ]);
    run([
      'add',
      files.docx,
      '/body',
      '--type',
      'formfield',
      '--prop',
      'type=checkbox',
      '--prop',
      'name=agree_terms',
      '--prop',
      'checked=false',
      '--json',
    ]);
    run(['set', files.docx, '/', '--prop', 'protection=forms', '--json']);
    const controls = run(['query', files.docx, 'sdt', '--json']);
    if (!controls.includes('Employee Name') || !controls.includes('employee_name') || !controls.includes('sdtLocked')) {
      throw new Error('OfficeCLI DOCX specialist smoke did not preserve the structured content control');
    }
    const formFields = run(['query', files.docx, 'formfield', '--json']);
    if (!formFields.includes('agree_terms') || !formFields.includes('checkbox')) {
      throw new Error('OfficeCLI DOCX specialist smoke did not preserve the legacy checkbox field');
    }
    const formsView = run(['view', files.docx, 'forms']);
    if (!formsView.includes('Document Protection: forms (enforced)') || !formsView.includes('Editable Fields (2)')) {
      throw new Error('OfficeCLI DOCX specialist smoke did not render the protected editable-field inventory');
    }
    run(['validate', files.docx, '--json']);
    if (!run(['view', files.docx, 'text']).includes('Wayland')) {
      throw new Error('OfficeCLI DOCX smoke view did not render the inserted paragraph');
    }

    run(['create', files.xlsx, '--force', '--json']);
    run(['set', files.xlsx, '/Sheet1/A1', '--prop', 'value=Wayland', '--prop', 'bold=true', '--json']);
    if (!run(['query', files.xlsx, 'cell', '--json']).includes('Wayland')) {
      throw new Error('OfficeCLI XLSX smoke query did not return the inserted cell');
    }

    // Prove the specialist financial-model/data-dashboard recipes against the
    // executable, not only the presence of their schema element names.
    run(['set', files.xlsx, '/Sheet1/A2', '--prop', 'value=Month', '--prop', 'bold=true', '--json']);
    run(['set', files.xlsx, '/Sheet1/B2', '--prop', 'value=Revenue', '--prop', 'bold=true', '--json']);
    run(['set', files.xlsx, '/Sheet1/C2', '--prop', 'value=Margin', '--prop', 'bold=true', '--json']);
    run(['set', files.xlsx, '/Sheet1/A3', '--prop', 'value=Jan', '--json']);
    run(['set', files.xlsx, '/Sheet1/B3', '--prop', 'value=100', '--json']);
    run(['set', files.xlsx, '/Sheet1/C3', '--prop', 'formula=B3/200', '--prop', 'numberformat=0%', '--json']);
    run([
      'add',
      files.xlsx,
      '/',
      '--type',
      'namedrange',
      '--prop',
      'name=Revenue',
      '--prop',
      'ref=Sheet1!$B$3',
      '--json',
    ]);
    run([
      'add',
      files.xlsx,
      '/Sheet1',
      '--type',
      'validation',
      '--prop',
      'type=whole',
      '--prop',
      'ref=B3:B12',
      '--prop',
      'operator=greaterThanOrEqual',
      '--prop',
      'formula1=0',
      '--json',
    ]);
    run([
      'add',
      files.xlsx,
      '/Sheet1',
      '--type',
      'conditionalformatting',
      '--prop',
      'type=cellIs',
      '--prop',
      'ref=B3:B12',
      '--prop',
      'operator=greaterThan',
      '--prop',
      'value=50',
      '--prop',
      'fill=63BE7B',
      '--json',
    ]);
    run([
      'add',
      files.xlsx,
      '/Sheet1',
      '--type',
      'chart',
      '--prop',
      'chartType=column',
      '--prop',
      'dataRange=Sheet1!B2:B3',
      '--prop',
      'categories=Sheet1!A2:A3',
      '--prop',
      'title=Revenue',
      '--prop',
      'anchor=E2:K15',
      '--json',
    ]);

    const cells = run(['query', files.xlsx, 'cell', '--json']);
    if (!cells.includes('formula') || !cells.includes('B3/200') || !cells.includes('computedValue')) {
      throw new Error('OfficeCLI XLSX specialist smoke did not preserve and evaluate the financial formula');
    }
    if (!run(['query', files.xlsx, 'namedrange', '--json']).includes('Revenue')) {
      throw new Error('OfficeCLI XLSX specialist smoke did not preserve the named range');
    }
    if (!run(['query', files.xlsx, 'validation', '--json']).includes('B3:B12')) {
      throw new Error('OfficeCLI XLSX specialist smoke did not preserve data validation');
    }
    if (!run(['query', files.xlsx, 'conditionalformatting', '--json']).includes('B3:B12')) {
      throw new Error('OfficeCLI XLSX specialist smoke did not preserve conditional formatting');
    }
    const charts = run(['query', files.xlsx, 'chart', '--json']);
    if (!charts.includes('column') || !charts.includes('Revenue') || !charts.includes('seriesCount')) {
      throw new Error('OfficeCLI XLSX specialist smoke did not preserve the dashboard chart');
    }
    run(['validate', files.xlsx, '--json']);
    if (!run(['view', files.xlsx, 'text']).includes('A1=Wayland')) {
      throw new Error('OfficeCLI XLSX smoke view did not render the inserted cell');
    }

    run(['create', files.pptx, '--force', '--json']);
    run(['add', files.pptx, '/', '--type', 'slide', '--json']);
    run([
      'add',
      files.pptx,
      '/slide[1]',
      '--type',
      'shape',
      '--prop',
      'text=Wayland',
      '--prop',
      'name=BoxA',
      '--prop',
      'x=1in',
      '--prop',
      'y=1in',
      '--prop',
      'width=4in',
      '--prop',
      'height=1in',
      '--json',
    ]);
    run([
      'add',
      files.pptx,
      '/slide[1]',
      '--type',
      'shape',
      '--prop',
      'text=Act',
      '--prop',
      'name=BoxB',
      '--prop',
      'x=4in',
      '--prop',
      'y=1in',
      '--prop',
      'width=2in',
      '--prop',
      'height=1in',
      '--json',
    ]);
    run([
      'add',
      files.pptx,
      '/slide[1]',
      '--type',
      'connector',
      '--prop',
      'from=/slide[1]/shape[@name=BoxA]',
      '--prop',
      'to=/slide[1]/shape[@name=BoxB]',
      '--prop',
      'tailEnd=triangle',
      '--prop',
      'name=Flow',
      '--json',
    ]);
    run([
      'add',
      files.pptx,
      '/slide[1]',
      '--type',
      'notes',
      '--prop',
      'text=Explain the evidence before the action.',
      '--json',
    ]);
    run([
      'add',
      files.pptx,
      '/slide[1]',
      '--type',
      'chart',
      '--prop',
      'chartType=column',
      '--prop',
      'categories=Q1,Q2,Q3',
      '--prop',
      'series1=Revenue:10,20,30',
      '--prop',
      'title=Traction',
      '--prop',
      'x=1in',
      '--prop',
      'y=3in',
      '--prop',
      'width=6in',
      '--prop',
      'height=3in',
      '--json',
    ]);
    if (!run(['query', files.pptx, 'shape', '--json']).includes('Wayland')) {
      throw new Error('OfficeCLI PPTX smoke query did not return the inserted shape');
    }
    const connectors = run(['query', files.pptx, 'connector', '--json']);
    if (!connectors.includes('Flow') || !connectors.includes('triangle') || !connectors.includes('startShape')) {
      throw new Error('OfficeCLI PPTX specialist smoke did not preserve the connected narrative flow');
    }
    if (!run(['query', files.pptx, 'notes', '--json']).includes('Explain the evidence before the action.')) {
      throw new Error('OfficeCLI PPTX specialist smoke did not preserve speaker notes');
    }
    const deckCharts = run(['query', files.pptx, 'chart', '--json']);
    if (!deckCharts.includes('Traction') || !deckCharts.includes('Revenue:10,20,30')) {
      throw new Error('OfficeCLI PPTX specialist smoke did not preserve the embedded traction chart');
    }
    run(['validate', files.pptx, '--json']);
    if (!run(['view', files.pptx, 'text']).includes('Wayland')) {
      throw new Error('OfficeCLI PPTX smoke view did not render the inserted shape');
    }

    return {
      formats: ['docx', 'xlsx', 'pptx'],
      operations: ['create', 'mutate', 'query', 'validate', 'view'],
      specialistPacks: [
        'officecli-financial-model',
        'officecli-data-dashboard',
        'officecli-word-form',
        'officecli-pitch-deck',
      ],
      specialistPrimitives: [
        'formula-evaluation',
        'named-range',
        'data-validation',
        'conditional-formatting',
        'xlsx-chart',
        'structured-content-control',
        'legacy-form-field',
        'document-protection',
        'connected-shapes',
        'speaker-notes',
        'pptx-embedded-chart',
      ],
    };
  } finally {
    for (const filePath of Object.values(files)) {
      try {
        run(['close', filePath, '--json']);
      } catch {
        // Best-effort resident cleanup after either success or a failed smoke.
      }
    }
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function downloadReleaseAsset(version, assetName, outputPath) {
  const outputDir = path.dirname(outputPath);
  fs.mkdirSync(outputDir, { recursive: true });

  try {
    execFileSync(
      'gh',
      ['release', 'download', version, '--repo', GITHUB_REPO, '--pattern', assetName, '--dir', outputDir, '--clobber'],
      { stdio: 'pipe', timeout: 120_000 }
    );
    const ghOutput = path.join(outputDir, assetName);
    if (ghOutput !== outputPath) fs.renameSync(ghOutput, outputPath);
    return;
  } catch {
    // Public-release fallback for environments without gh or GitHub auth.
  }

  const url = `https://github.com/${GITHUB_REPO}/releases/download/${version}/${assetName}`;
  execFileSync('curl', ['-fL', '--retry', '3', '--output', outputPath, url], {
    stdio: 'inherit',
    timeout: 120_000,
  });
}

function writeManifest(targetDir, manifest) {
  fs.writeFileSync(path.join(targetDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

function buildManifest({
  version,
  reportedVersion,
  platform,
  arch,
  libc,
  assetName,
  binaryName,
  expectedSha,
  contractSha256,
  capabilityFixtureDigest,
  skillProof,
  ledgerProof,
  publisherSignatureProof,
  contractProof,
  smokeProof,
}) {
  return {
    contract: 'iofficeai-officecli-native',
    version,
    reportedVersion,
    platform,
    arch,
    libc: platform === 'linux' ? libc : undefined,
    asset: assetName,
    binary: binaryName,
    sha256: `sha256:${expectedSha}`,
    // Provenance describes the pinned bytes, not whether this invocation had
    // to download them. A verified-cache rerun must reproduce the same
    // authority manifest as a clean preparation.
    source: `https://github.com/${GITHUB_REPO}/releases/download/${version}/${assetName}`,
    contractSha256,
    capabilityFixtureDigest,
    skillProof,
    ledgerProof,
    publisherSignatureProof,
    contractProof,
    smokeProof,
  };
}

function prepareOfficeCli(options = {}) {
  const platform = options.platform || process.env.OFFICECLI_TARGET_PLATFORM || process.platform;
  const arch = options.arch || process.env.OFFICECLI_TARGET_ARCH || process.arch;
  const libc = options.libc || process.env.OFFICECLI_TARGET_LIBC || 'gnu';
  const version = options.version || process.env.OFFICECLI_VERSION || DEFAULT_OFFICECLI_VERSION;
  const assetName = getAssetName(platform, arch, libc);
  const binaryName = getBinaryName(platform);
  const expectedSha = loadExpectedSha(version, assetName);
  const runtimeKey = `${platform}-${arch}`;
  const targetDir = path.join(OUTPUT_ROOT, runtimeKey);
  const targetBinary = path.join(targetDir, binaryName);
  const contract = loadContract();
  const contractSha256 = digestValue(contract);
  const capabilityFixtureDigest = getCapabilityFixtureDigest(contract);
  const skillProof = verifyBundledSkillDigests(contract);
  const ledgerProof = loadOfficeCliLedgerProof();

  fs.mkdirSync(targetDir, { recursive: true });

  if (fs.existsSync(targetBinary) && !options.forceDownload) {
    verifyFile(targetBinary, expectedSha, assetName, version);
    if (platform !== 'win32') fs.chmodSync(targetBinary, 0o755);
    const publisherSignatureProof =
      platform === 'darwin' && process.platform === 'darwin'
        ? verifyDarwinPublisherSignature(targetBinary)
        : { contract: 'not-verifiable-on-build-host', reason: 'not-macos-build-host' };
    const executableOnBuildHost = platform === process.platform && arch === process.arch;
    const contractProof = executableOnBuildHost
      ? verifyExecutableContract(targetBinary)
      : { contract: 'not-executable-on-build-host', release: version };
    const smokeProof = executableOnBuildHost
      ? verifyExecutableSmoke(targetBinary)
      : { formats: [], operations: [], reason: 'not-executable-on-build-host' };
    const reportedVersion = contractProof.release.replace(/^v/i, '');
    writeManifest(
      targetDir,
      buildManifest({
        version,
        reportedVersion,
        platform,
        arch,
        libc,
        assetName,
        binaryName,
        expectedSha,
        contractSha256,
        capabilityFixtureDigest,
        skillProof,
        ledgerProof,
        publisherSignatureProof,
        contractProof,
        smokeProof,
      })
    );
    console.log(`  Bundled OfficeCLI already verified: ${runtimeKey}/${binaryName}`);
    return { prepared: true, dir: targetDir, binary: targetBinary, sha256: expectedSha, source: 'verified-cache' };
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-officecli-'));
  const downloadedBinary = path.join(tempDir, assetName);
  try {
    downloadReleaseAsset(version, assetName, downloadedBinary);
    verifyFile(downloadedBinary, expectedSha, assetName, version);

    fs.copyFileSync(downloadedBinary, targetBinary);
    if (platform !== 'win32') fs.chmodSync(targetBinary, 0o755);

    const publisherSignatureProof =
      platform === 'darwin' && process.platform === 'darwin'
        ? verifyDarwinPublisherSignature(targetBinary)
        : { contract: 'not-verifiable-on-build-host', reason: 'not-macos-build-host' };

    let reportedVersion = version;
    let contractProof = { contract: 'not-executable-on-build-host', release: version };
    let smokeProof = { formats: [], operations: [], reason: 'not-executable-on-build-host' };
    if (platform === process.platform && arch === process.arch) {
      contractProof = verifyExecutableContract(targetBinary);
      smokeProof = verifyExecutableSmoke(targetBinary);
      reportedVersion = contractProof.release.replace(/^v/i, '');
    }

    writeManifest(
      targetDir,
      buildManifest({
        version,
        reportedVersion,
        platform,
        arch,
        libc,
        assetName,
        binaryName,
        expectedSha,
        contractSha256,
        capabilityFixtureDigest,
        skillProof,
        ledgerProof,
        publisherSignatureProof,
        contractProof,
        smokeProof,
      })
    );
    console.log(`  Bundled native OfficeCLI prepared: ${runtimeKey}/${binaryName} (${reportedVersion})`);
    return { prepared: true, dir: targetDir, binary: targetBinary, sha256: expectedSha, source: 'release' };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

module.exports = prepareOfficeCli;
module.exports.DEFAULT_OFFICECLI_VERSION = DEFAULT_OFFICECLI_VERSION;
module.exports.getAssetName = getAssetName;
module.exports.getBinaryName = getBinaryName;
module.exports.loadExpectedSha = loadExpectedSha;
module.exports.verifyFile = verifyFile;
module.exports.assertDarwinPublisherSignature = assertDarwinPublisherSignature;
module.exports.verifyDarwinPublisherSignature = verifyDarwinPublisherSignature;
module.exports.loadContract = loadContract;
module.exports.assertContractOutputs = assertContractOutputs;
module.exports.verifyExecutableContract = verifyExecutableContract;
module.exports.verifyExecutableSmoke = verifyExecutableSmoke;
module.exports.canonical = canonical;
module.exports.digestValue = digestValue;
module.exports.verifyBundledSkillDigests = verifyBundledSkillDigests;
module.exports.loadOfficeCliLedgerProof = loadOfficeCliLedgerProof;
module.exports.getCapabilityFixtureDigest = getCapabilityFixtureDigest;
module.exports.buildManifest = buildManifest;

if (require.main === module) {
  try {
    prepareOfficeCli();
  } catch (error) {
    console.error(`prepareOfficeCli failed: ${error.message}`);
    process.exit(1);
  }
}
