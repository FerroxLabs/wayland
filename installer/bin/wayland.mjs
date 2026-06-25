#!/usr/bin/env node
/**
 * getwayland - self-host Wayland's headless server on any Linux box / VPS.
 *
 *   wayland setup   Interactive: paste a provider key (Flux recommended) → writes
 *                   env, ensures the bun runtime, prints your login + QR.
 *   wayland start   Run the server (foreground). Reads the env written by setup.
 *   wayland help
 *
 * Design: the server reads provider credentials from the environment, so the
 * key never touches the OS keychain (which isn't available headless). Flux is
 * an OpenAI-compatible endpoint, so a Flux key is wired as the OpenAI provider
 * pointed at https://api.fluxrouter.ai/v1 with model flux-auto - no wcore binary
 * required. (wcore, if present, is fetched by postinstall as an enhancement.)
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PAYLOAD = join(PKG_ROOT, 'payload');
const SERVER = join(PAYLOAD, 'dist-server', 'server.mjs');
const DATA_DIR = process.env.DATA_DIR || join(homedir(), '.wayland-server');
const ENV_FILE = join(DATA_DIR, 'wayland.env');
const FLUX_OPENAI_BASE = 'https://api.fluxrouter.ai/v1';
const FLUX_SIGNUP = 'https://fluxrouter.ai';

const c = {
  b: (s) => `\x1b[1m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  o: (s) => `\x1b[38;5;208m${s}\x1b[0m`,
  g: (s) => `\x1b[32m${s}\x1b[0m`,
  r: (s) => `\x1b[31m${s}\x1b[0m`,
};

// One readline for the whole session. A fresh interface per prompt would end
// stdin on the first EOF, leaving every later prompt hanging on an already-closed
// stream. A single shared interface reads sequential piped answers correctly and,
// once stdin closes, makes every prompt resolve to its default - so `wayland setup`
// is fully scriptable (piped answers OR a closed stdin both work) and never hangs.
let _rl = null;
let _stdinEnded = false;
function rlInstance() {
  if (!_rl) {
    _rl = createInterface({ input: process.stdin, output: process.stdout });
    _rl.on('close', () => { _stdinEnded = true; });
  }
  return _rl;
}
function closeRl() {
  if (_rl) { _rl.close(); _rl = null; }
}
function ask(question) {
  if (_stdinEnded) return Promise.resolve('');
  return new Promise((res) => {
    const rl = rlInstance();
    let done = false;
    const finish = (v) => { if (!done) { done = true; res(v); } };
    rl.question(question, (a) => finish(a.trim()));
    rl.once('close', () => finish(''));
  });
}

/** Map a pasted key to the env vars the server reads. Flux is the default lens. */
function keyToEnv(rawKey, providerHint) {
  const key = rawKey.replace(/\s+/g, '');
  const hint = (providerHint || '').toLowerCase();
  const isFlux = hint === 'flux' || /^sk-flux/i.test(key);
  if (isFlux) {
    return {
      provider: 'Flux Router',
      env: { OPENAI_API_KEY: key, OPENAI_BASE_URL: FLUX_OPENAI_BASE, OPENAI_MODEL: 'flux-auto' },
    };
  }
  if (hint === 'anthropic' || /^sk-ant-/i.test(key)) return { provider: 'Anthropic', env: { ANTHROPIC_API_KEY: key } };
  if (hint === 'gemini' || /^AIza/i.test(key)) return { provider: 'Google Gemini', env: { GEMINI_API_KEY: key } };
  if (hint === 'openai' || /^sk-/i.test(key)) return { provider: 'OpenAI', env: { OPENAI_API_KEY: key } };
  return null; // unknown - caller asks for the provider
}

function writeEnvFile(env) {
  mkdirSync(DATA_DIR, { recursive: true });
  const base = {
    PORT: process.env.PORT || '3000',
    ALLOW_REMOTE: process.env.ALLOW_REMOTE || 'true',
    NODE_ENV: 'production',
    DATA_DIR,
  };
  const merged = { ...base, ...env };
  const body =
    '# Written by `wayland setup`. Loaded by `wayland start`.\n' +
    Object.entries(merged).map(([k, v]) => `${k}=${v}`).join('\n') + '\n';
  writeFileSync(ENV_FILE, body, { mode: 0o600 });
}

function loadEnvFile() {
  if (!existsSync(ENV_FILE)) return {};
  const out = {};
  for (const line of readFileSync(ENV_FILE, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i > 0) out[t.slice(0, i)] = t.slice(i + 1);
  }
  return out;
}

function has(cmd) {
  return spawnSync(process.platform === 'win32' ? 'where' : 'which', [cmd], { stdio: 'ignore' }).status === 0;
}
/** bun's canonical install dir. The bun.sh installer drops the binary here and
 *  only edits shell rc files (.bashrc/.zshrc) - so it is NOT on the PATH of this
 *  node process, nor of a systemd service (which starts with a minimal env). */
function bunBinDir() {
  return join(homedir(), '.bun', 'bin');
}
/** Resolve the bun executable: PATH first, then ~/.bun/bin. Relying on `which
 *  bun` alone made `wayland setup` report "bun install failed" right after a
 *  clean install, and the systemd service die with "bun runtime not found",
 *  because neither context has ~/.bun/bin on PATH yet (#201). Returns the
 *  command/path to spawn, or null when bun truly isn't installed. */
function resolveBun() {
  if (has('bun')) return 'bun';
  const local = join(bunBinDir(), process.platform === 'win32' ? 'bun.exe' : 'bun');
  return existsSync(local) ? local : null;
}
function hasBun() {
  return resolveBun() !== null;
}
/** Return env with ~/.bun/bin prepended to PATH, so a freshly-installed bun (and
 *  any bun/node subprocess the server spawns) resolves without a new shell. */
function withBunPath(env) {
  const dir = bunBinDir();
  if (!existsSync(dir)) return env;
  const sep = process.platform === 'win32' ? ';' : ':';
  const cur = env.PATH || '';
  return cur.split(sep).includes(dir) ? env : { ...env, PATH: dir + sep + cur };
}

/** bun's installer needs unzip + curl. On a fresh Debian/Ubuntu box neither is
 *  guaranteed - install them via apt (the smoke test caught this). */
function ensureUnzipCurl() {
  if (has('unzip') && has('curl')) return;
  if (!has('apt-get')) return; // non-Debian: user handles prereqs
  const root = typeof process.getuid === 'function' && process.getuid() === 0;
  const sudo = root ? '' : 'sudo ';
  console.log(c.dim('  Installing prerequisites (unzip, curl)…'));
  spawnSync('bash', ['-c', `${sudo}apt-get update -qq >/dev/null 2>&1; ${sudo}apt-get install -y -qq unzip curl >/dev/null 2>&1`], { stdio: 'inherit' });
}

/** The bundled wayland-core engine binary links libasound (ALSA). A minimal
 *  Debian/Ubuntu server image ships without it, so the engine aborts on the
 *  first chat turn with "wcore exited with code 127". Install it the same way we
 *  install bun's unzip/curl prereqs - idempotent, apt-only (other distros: the
 *  user installs the equivalent package). */
function ensureEngineRuntimeLibs() {
  if (!has('apt-get')) return; // non-Debian: user handles prereqs
  const root = typeof process.getuid === 'function' && process.getuid() === 0;
  const sudo = root ? '' : 'sudo ';
  console.log(c.dim('  Ensuring engine runtime libraries (libasound2)…'));
  // libasound2t64 on Ubuntu 24.04+ (the t64 ABI transition); libasound2 elsewhere.
  spawnSync(
    'bash',
    [
      '-c',
      `${sudo}apt-get install -y -qq libasound2t64 >/dev/null 2>&1 || ${sudo}apt-get install -y -qq libasound2 >/dev/null 2>&1`,
    ],
    { stdio: 'inherit' }
  );
}

async function ensureBun() {
  if (hasBun()) return true;
  console.log(c.dim('\n  The server runs on the bun runtime, which isn\'t installed.'));
  const yes = (await ask('  Install bun now? [Y/n] ')).toLowerCase();
  if (yes === 'n' || yes === 'no') {
    console.log(c.r('\n  Skipped. Install bun (https://bun.sh) then re-run `wayland setup`.'));
    return false;
  }
  ensureUnzipCurl();
  console.log(c.dim('  Installing bun…'));
  const r = spawnSync('bash', ['-c', 'curl -fsSL https://bun.sh/install | bash'], { stdio: 'inherit' });
  if (r.status !== 0 || !hasBun()) {
    console.log(c.r('\n  bun install failed. Install it manually: https://bun.sh, then re-run setup.'));
    console.log(c.dim('  (You may need to open a new shell so `bun` is on your PATH.)'));
    return false;
  }
  return true;
}

async function setup() {
  console.log(c.o('\n  Wayland - self-host setup\n'));
  if (!existsSync(SERVER)) {
    console.log(c.r(`  Server payload missing at ${SERVER}.`));
    console.log(c.dim('  Reinstall: npm i -g getwayland'));
    process.exit(1);
  }
  if (!(await ensureBun())) process.exit(1);

  // The bundled engine needs ALSA at runtime; install it now so the first chat
  // turn does not fail with "wcore exited with code 127" on a minimal box.
  ensureEngineRuntimeLibs();

  console.log(c.dim(`  Bring a model. Flux Router is the easy path - one key, every model,`));
  console.log(c.dim(`  best-fit routing. Free account: ${c.o(FLUX_SIGNUP)}\n`));
  let entry = await ask('  Paste your Flux key (or any OpenAI / Anthropic / Gemini key), or Enter to skip: ');

  let resolved = null;
  if (entry) {
    resolved = keyToEnv(entry);
    if (!resolved) {
      const which = (await ask('  Which provider is this key for? [flux/openai/anthropic/gemini] ')).toLowerCase();
      resolved = keyToEnv(entry, which);
    }
  }

  if (resolved) {
    writeEnvFile(resolved.env);
    console.log(c.g(`\n  ✓ ${resolved.provider} key wired.`) + c.dim(`  (stored in ${ENV_FILE})`));
  } else {
    writeEnvFile({});
    console.log(c.dim('\n  No key set - the server will run, add one later in Settings → Models'));
    console.log(c.dim(`  (in-app key add on a headless box is a known fast-follow; for now re-run`));
    console.log(c.dim('   `wayland setup` to add a key via env).'));
  }

  printNext();
  const staged = await maybeSystemd();

  // Match the "install → setup → it's running → grab your QR → go" flow: unless
  // they staged a systemd service, offer to boot it right now so the login QR
  // prints in this terminal immediately instead of after a separate `start`.
  if (!staged) {
    const go = (await ask('  Start Wayland now and show your login QR? [Y/n] ')).toLowerCase();
    if (go !== 'n' && go !== 'no') {
      console.log(c.dim('\n  Starting… scan the QR below to log in. Ctrl+C to stop.\n'));
      closeRl();
      start();
      return;
    }
    console.log(c.dim(`\n  When you're ready: ${c.o('wayland start')}  ${c.dim('(prints your QR + admin login)')}\n`));
  }
  closeRl();
}

function printNext() {
  const port = process.env.PORT || '3000';
  console.log(c.b('\n  Next:'));
  console.log(`    ${c.o('wayland start')}        ${c.dim('# run it now (foreground)')}`);
  console.log(`    ${c.dim(`then open  http://<this-box-ip>:${port}  on your phone or laptop`)}`);
  console.log(c.dim('    First boot prints a QR code + admin login in this terminal.'));
  console.log(c.dim('\n  Lock it down (recommended): put it behind Tailscale so it never touches'));
  console.log(c.dim('  the public internet - https://tailscale.com  →  tailscale serve ' + port + '\n'));
}

async function maybeSystemd() {
  if (process.platform !== 'linux') return false;
  const yes = (await ask('  Install a systemd service so it runs 24/7 + restarts on reboot? [y/N] ')).toLowerCase();
  if (yes !== 'y' && yes !== 'yes') return false;
  const bin = process.argv[1];
  const unit = `[Unit]
Description=Wayland headless server
After=network-online.target

[Service]
Type=simple
ExecStart=${process.execPath} ${bin} start
Restart=always
RestartSec=3
Environment=DATA_DIR=${DATA_DIR}
# systemd starts with a minimal PATH that excludes ~/.bun/bin (where the bun.sh
# installer drops bun), so the start command would die with bun-runtime-not-found (#201).
Environment=PATH=${bunBinDir()}:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

[Install]
WantedBy=multi-user.target
`;
  const path = '/etc/systemd/system/wayland.service';
  try {
    writeFileSync('/tmp/wayland.service', unit);
    console.log(c.dim(`\n  Run these (need sudo):`));
    console.log(`    sudo mv /tmp/wayland.service ${path}`);
    console.log(`    sudo systemctl daemon-reload && sudo systemctl enable --now wayland`);
    console.log(c.dim(`    sudo journalctl -u wayland -f      # logs (incl. the QR + admin login)`));
    return true;
  } catch (e) {
    console.log(c.r('  Could not stage the unit file: ' + e.message));
    return false;
  }
}

function start() {
  if (!existsSync(SERVER)) {
    console.log(c.r(`Server payload missing at ${SERVER}. Reinstall: npm i -g getwayland`));
    process.exit(1);
  }
  const bunExe = resolveBun();
  if (!bunExe) {
    console.log(c.r('bun runtime not found. Run `wayland setup` (it installs bun) or see https://bun.sh'));
    process.exit(1);
  }
  const env = withBunPath({ ...process.env, ...loadEnvFile() });
  env.DATA_DIR = env.DATA_DIR || DATA_DIR;
  env.PORT = env.PORT || '3000';
  env.ALLOW_REMOTE = env.ALLOW_REMOTE || 'true';
  env.NODE_ENV = env.NODE_ENV || 'production';
  const child = spawn(bunExe, [SERVER], { cwd: PAYLOAD, env, stdio: 'inherit' });
  child.on('exit', (code) => process.exit(code ?? 0));
  process.on('SIGINT', () => child.kill('SIGINT'));
  process.on('SIGTERM', () => child.kill('SIGTERM'));
}

/** Break-glass admin password reset. Local-only by construction: this is a
 *  process-launch argument, not an HTTP/WS route, so it can only be triggered
 *  by someone with shell access to the box. The server (--resetpass) sets a new
 *  random password + rotates the JWT secret and prints them to this terminal.
 *  An optional username is forwarded (defaults to 'admin'). */
function resetpass() {
  if (!existsSync(SERVER)) {
    console.log(c.r(`Server payload missing at ${SERVER}. Reinstall: npm i -g getwayland`));
    process.exit(1);
  }
  const bunExe = resolveBun();
  if (!bunExe) {
    console.log(c.r('bun runtime not found. Run `wayland setup` (it installs bun) or see https://bun.sh'));
    process.exit(1);
  }
  const env = withBunPath({ ...process.env, ...loadEnvFile() });
  env.DATA_DIR = env.DATA_DIR || DATA_DIR;
  env.NODE_ENV = env.NODE_ENV || 'production';
  // Forward any extra args (e.g. a username) after the subcommand.
  const child = spawn(bunExe, [SERVER, '--resetpass', ...process.argv.slice(3)], { cwd: PAYLOAD, env, stdio: 'inherit' });
  child.on('exit', (code) => process.exit(code ?? 0));
}

function help() {
  console.log(`
  ${c.o('wayland')} - self-host Wayland's headless server

  ${c.b('wayland setup')}       Paste a provider key (Flux recommended), wire it, get your login
  ${c.b('wayland start')}       Run the server (reads the env from setup)
  ${c.b('wayland resetpass')}   Reset the admin password (prints a new one). Optional: ${c.dim('wayland resetpass <username>')}
  ${c.b('wayland help')}        This message

  Data dir: ${c.dim(DATA_DIR)}   ${c.dim('(override with DATA_DIR=…)')}
  Flux Router (free): ${c.o(FLUX_SIGNUP)}
`);
}

const cmd = (process.argv[2] || 'help').toLowerCase();
if (cmd === 'setup') await setup();
else if (cmd === 'start') start();
else if (cmd === 'resetpass' || cmd === 'reset-password' || cmd === '--resetpass') resetpass();
else if (cmd === 'version' || cmd === '--version' || cmd === '-v')
  console.log(JSON.parse(readFileSync(join(PKG_ROOT, 'package.json'), 'utf8')).version);
else help();
