#!/usr/bin/env node
'use strict';

// Pre-packaging dependency startup only. No prompt, provider credential, tool
// call, local model server, or installed-app readiness claim is involved.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawn, execFileSync } = require('node:child_process');
const { createInterface } = require('node:readline');

const digest = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isolatedEnvironment(home, inherited = process.env) {
  const env = {};
  // Deliberately allowlist OS bootstrap values, never provider or Core settings.
  for (const key of ['SYSTEMROOT', 'WINDIR', 'COMSPEC', 'PATHEXT', 'PROCESSOR_ARCHITECTURE']) {
    const found = Object.keys(inherited).find((name) => name.toUpperCase() === key);
    if (found) env[key] = inherited[found];
  }
  env.PATH = path.join(env.SYSTEMROOT || 'C:\\Windows', 'System32');
  for (const key of [
    'HOME',
    'USERPROFILE',
    'WAYLAND_HOME',
    'WAYLAND_PROFILE_HOME',
    'APPDATA',
    'LOCALAPPDATA',
    'TEMP',
    'TMP',
    'TMPDIR',
  ])
    env[key] = home;
  env.TERM = 'dumb';
  env.NO_COLOR = '1';
  return env;
}

function expectedToolsFromFixture(fixture, version) {
  const header = fixture?._header;
  if (
    header?.package !== '@ferroxlabs/tvcontrol' ||
    header.version !== version ||
    !Number.isSafeInteger(header.toolCount) ||
    header.toolCount <= 0 ||
    !fixture.tools ||
    typeof fixture.tools !== 'object' ||
    Array.isArray(fixture.tools) ||
    Object.keys(fixture.tools).length !== header.toolCount
  ) {
    throw new Error('Pinned TVControl tools fixture header/version/count mismatch');
  }
  return header.toolCount;
}

function inspectEvent(event, server, expectedTools) {
  if (event.type === 'error' || event.type === 'mcp_failed')
    throw new Error(`Core startup failed: ${JSON.stringify(event)}`);
  if (event.type !== 'mcp_ready') return false;
  if (event.name !== server) throw new Error('Unexpected MCP server registered');
  if (
    !Array.isArray(event.tools) ||
    event.tools.some((tool) => typeof tool !== 'string' || tool.trim().length === 0) ||
    event.tools.length !== expectedTools ||
    new Set(event.tools).size !== expectedTools
  ) {
    throw new Error(`Core registered an unexpected tool set (expected ${expectedTools})`);
  }
  return true;
}

// Only return identities belonging to this fresh fixture or its descendants.
// No unrelated command lines, environment, or configuration enter the receipt.
function ownedSnapshot(rootPid, root, observed = [], execute = execFileSync) {
  const script =
    'Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,CreationDate,ExecutablePath,CommandLine | ConvertTo-Json -Compress';
  const raw = execute('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
    encoding: 'utf8',
    timeout: 10000,
    windowsHide: true,
  });
  const all = [].concat(JSON.parse(raw || '[]')).filter(Boolean);
  const owned = new Set();
  const identities = new Set(observed.map((entry) => `${entry.pid}\0${entry.identity}`));
  for (const entry of all) {
    if (
      identities.has(`${entry.ProcessId}\0${entry.CreationDate}\0${entry.ExecutablePath}`) ||
      String(entry.ExecutablePath || '')
        .toLowerCase()
        .startsWith(root.toLowerCase() + path.sep) ||
      String(entry.CommandLine || '').includes(root)
    )
      owned.add(entry.ProcessId);
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const entry of all)
      if (owned.has(entry.ParentProcessId) && !owned.has(entry.ProcessId)) {
        owned.add(entry.ProcessId);
        changed = true;
      }
  }
  return all
    .filter((entry) => owned.has(entry.ProcessId))
    .map((entry) => ({
      pid: entry.ProcessId,
      parentPid: entry.ParentProcessId,
      identity: `${entry.CreationDate}\0${entry.ExecutablePath}`,
      executable: entry.ExecutablePath,
    }));
}

async function runStartup(options, dependencies = {}) {
  const launch = dependencies.spawn || spawn;
  const snapshot = dependencies.snapshot || ownedSnapshot;
  const kill =
    dependencies.kill ||
    ((pid) =>
      execFileSync('taskkill.exe', ['/PID', String(pid), '/T', '/F'], {
        windowsHide: true,
        stdio: 'pipe',
        timeout: 10000,
      }));
  const { root, home, core, server, expectedTools, timeoutMs = 60000, shutdownMs = 15000 } = options;
  if (!Number.isSafeInteger(expectedTools) || expectedTools <= 0)
    throw new Error('Expected tool count must be a positive integer');
  const stdout = fs.createWriteStream(path.join(root, 'stdout.jsonl'));
  const stderr = fs.createWriteStream(path.join(root, 'stderr.log'));
  const child = launch(core, ['--json-stream', '--model', 'ollama:qwen3-coder:30b', '--assistant', 'prepack-mcp'], {
    cwd: home,
    env: isolatedEnvironment(home),
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true,
  });
  const receipt = {
    contract: 'wayland-windows-core-mcp-smoke/1',
    pid: child.pid,
    server,
    expectedTools,
    accepted: false,
    cleanupVerified: false,
  };
  let exited = false;
  let ready = false;
  let failure;
  const observed = new Map();
  const collect = () => {
    const entries = snapshot(child.pid, root, [...observed.values()]);
    for (const entry of entries) observed.set(`${entry.pid}\0${entry.identity}`, entry);
    return entries;
  };
  child.stdout.pipe(stdout);
  child.stderr.pipe(stderr);
  child.on('error', (error) => {
    failure = error;
  });
  child.stdin.on('error', (error) => {
    failure ||= error;
  });
  child.on('close', (code, signal) => {
    exited = true;
    receipt.exitCode = code;
    receipt.signal = signal;
  });
  const lines = createInterface({ input: child.stdout });
  lines.on('line', (line) => {
    try {
      const event = JSON.parse(line);
      if (inspectEvent(event, server, expectedTools)) {
        if (ready) throw new Error('Duplicate MCP ready receipt');
        ready = true;
        receipt.mcpReady = event;
        child.stdin.end(); // EOF only after the real Core registration receipt.
      }
    } catch (error) {
      failure ||= error;
    }
  });
  try {
    const deadline = Date.now() + timeoutMs;
    let shutdownDeadline;
    while (!failure && !exited) {
      collect();
      if (ready && !shutdownDeadline) shutdownDeadline = Date.now() + shutdownMs;
      if (Date.now() >= (shutdownDeadline || deadline))
        throw new Error(ready ? 'Core did not exit after EOF' : 'Core MCP initialization timed out');
      await sleep(100);
    }
    if (failure) throw failure;
    if (!ready) throw new Error('Core exited before MCP ready');
    if (receipt.exitCode !== 0) throw new Error(`Core exited with ${receipt.exitCode}`);
    const drainDeadline = Date.now() + shutdownMs;
    while (collect().length && Date.now() < drainDeadline) await sleep(100);
    if (collect().length) throw new Error('Owned Core/MCP processes survived EOF');
    receipt.accepted = true;
  } catch (error) {
    receipt.error = error.message;
  } finally {
    try {
      // Failure cleanup only kills identities still belonging to the fixture.
      for (const entry of collect()) {
        if (
          !snapshot(child.pid, root, [...observed.values()]).some(
            (live) => live.pid === entry.pid && live.identity === entry.identity
          )
        )
          continue;
        try {
          kill(entry.pid);
        } catch {
          /* final inventory decides */
        }
      }
      await sleep(100);
      receipt.survivors = collect();
      receipt.cleanupVerified = receipt.survivors.length === 0;
    } catch (error) {
      receipt.cleanupError = error.message;
    }
    receipt.accepted &&= receipt.cleanupVerified;
    receipt.observedProcesses = [...observed.values()];
    lines.close();
    child.stdin.destroy();
    stdout.end();
    stderr.end();
  }
  return receipt;
}

async function runGate(options) {
  const {
    platform = process.platform,
    arch = process.arch,
    resources,
    evidenceRoot = os.tmpdir(),
    coreSha256,
    bunSha256,
    tvAuthority,
  } = options;
  if (platform !== 'win32' || process.platform !== 'win32' || arch !== process.arch)
    throw new Error('UNSUPPORTED: requires the native Windows target architecture');
  if (arch !== 'x64') throw new Error('UNSUPPORTED: early probe requires native win32-x64');
  const { verifyTvControl } = require('../prepareTvControl.js');
  const sourceCore = options.coreBinary || path.join(resources, `bundled-wayland-core/win32-${arch}/wayland-core.exe`);
  const sourceBun = path.join(resources, `bundled-bun/win32-${arch}/bun.exe`);
  const sourceTv = path.join(resources, 'bundled-tvcontrol');
  if (!/^[a-f0-9]{64}$/.test(coreSha256 || '') || digest(sourceCore) !== coreSha256)
    throw new Error('Core source pin mismatch');
  if (!/^[a-f0-9]{64}$/.test(bunSha256 || '') || digest(sourceBun) !== bunSha256)
    throw new Error('Bun source pin mismatch');
  if (!verifyTvControl(sourceTv, tvAuthority)) throw new Error('TVControl source pin mismatch');
  fs.mkdirSync(evidenceRoot, { recursive: true });
  const root = fs.realpathSync(fs.mkdtempSync(path.join(evidenceRoot, 'windows-core-mcp-')));
  const runtime = path.join(root, 'Program Files', 'Wayland', 'resources');
  const home = path.join(root, 'profile');
  fs.mkdirSync(runtime, { recursive: true });
  fs.mkdirSync(home);
  const core = path.join(runtime, 'wayland-core.exe');
  const bun = path.join(runtime, 'bun.exe');
  const tv = path.join(runtime, 'bundled-tvcontrol');
  fs.copyFileSync(sourceCore, core);
  fs.copyFileSync(sourceBun, bun);
  fs.cpSync(sourceTv, tv, { recursive: true, dereference: false });
  if (digest(core) !== coreSha256 || digest(bun) !== bunSha256 || !verifyTvControl(tv, tvAuthority))
    throw new Error('Staged resource pin mismatch');
  const server = `prepack_${crypto.randomBytes(8).toString('hex')}`;
  const entry = path.join(tv, 'node_modules', '@ferroxlabs', 'tvcontrol', 'src', 'server.js');
  fs.writeFileSync(
    path.join(home, 'config.toml'),
    `[default]\nmodel = "ollama:qwen3-coder:30b"\n\n[mcp.servers.${server}]\ntransport = "stdio"\ncommand = ${JSON.stringify(bun)}\nargs = [${JSON.stringify(entry)}]\n`
  );
  const receipt = await runStartup({ root, home, core, server, expectedTools: options.expectedTools });
  Object.assign(receipt, { platform, arch, coreSha256, bunSha256, tvAuthority, root });
  fs.writeFileSync(path.join(root, 'result.json'), JSON.stringify(receipt, null, 2) + '\n');
  console.log(`[windows-core-mcp] ${receipt.accepted ? 'PASS' : 'FAIL'} ${path.join(root, 'result.json')}`);
  if (!receipt.accepted) throw new Error(receipt.error || receipt.cleanupError || 'MCP smoke cleanup failed');
  return receipt;
}

async function main() {
  const [resources, arch] = process.argv.slice(2);
  const prepareCore = require('../prepareWaylandCore.js');
  const prepareBun = require('../prepareBundledBun.js');
  const version = prepareCore.DEFAULT_WCORE_VERSION;
  const triple = arch === 'arm64' ? 'aarch64' : 'x86_64';
  const corePin = require('../bundled-wcore-shasums.json')[version]?.[
    `wayland-core-${version}-${triple}-pc-windows-msvc.zip`
  ];
  const bunPins = require('../bundled-bun-binaries.json')[prepareBun.PINNED_BUN_VERSION];
  const asset = prepareBun.getPlatformAsset('win32', arch);
  const tvAuthority = require('../tvcontrol/authority.json');
  const fixture = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '..', '..', 'tests', 'fixtures', `tvcontrol-${tvAuthority.version}-tools.json`),
      'utf8'
    )
  );
  const expectedTools = expectedToolsFromFixture(fixture, tvAuthority.version);
  await runGate({
    resources,
    expectedTools,
    arch,
    coreSha256: corePin?.binarySha256.replace(/^sha256:/, ''),
    bunSha256: bunPins?.[asset]?.sha256,
    tvAuthority,
  });
}

module.exports = { expectedToolsFromFixture, isolatedEnvironment, inspectEvent, ownedSnapshot, runStartup, runGate };
if (require.main === module)
  main().catch((error) => {
    console.error(`[windows-core-mcp] ${error.message}`);
    process.exitCode = 1;
  });
