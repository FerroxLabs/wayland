#!/usr/bin/env node
/**
 * ijfw-memory-smoke.mjs - packaged Memory smoke.
 *
 * THE ONLY CALLER of `WAYLAND_DISABLE_IJFW=0`, and the reason that knob exists.
 *
 * Memory used to be structurally untestable: `WAYLAND_E2E_TEST=1` both isolated
 * the profile and disabled IJFW, so every packaged smoke ran with Memory off.
 * A dead Memory surface therefore shipped while packaged-cockpit-smoke.mjs
 * reported PASS on the same build. This harness closes that hole.
 *
 * What it asserts, as a user would see it:
 *   1. With `ijfw.skipSetup` persisted true, the Settings page reports the
 *      opted-out state (this is the shipped 0.11.18 symptom).
 *   2. ONE click of the Skip switch recovers it with no app restart: the install
 *      row goes "Installed and up to date" and the switch stays OFF.
 *   3. The runtime row reaches "Live" and the Test button actually passes.
 *
 * ISOLATION - both halves are required, and the guard enforces the second:
 *   - `WAYLAND_E2E_USER_DATA_DIR` isolates the profile. Redirecting HOME alone
 *     does NOT: Electron resolves userData independently of $HOME on macOS, and
 *     an early version of this script consequently attached to the real profile
 *     and rewrote a live config value.
 *   - a redirected HOME isolates `~/.ijfw`, which the MCP client resolves via
 *     `os.homedir()`. `shouldDisableIjfw` REFUSES force-ON unless HOME differs
 *     from the passwd home, so a mis-wired run degrades to Memory-off rather
 *     than running `npx ijfw-install` against a real home.
 *
 * Usage: node scripts/ijfw-memory-smoke.mjs <path-to-.app> [sandbox-dir]
 */

import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import { WebSocket } from 'ws';

const APP = process.argv[2];
const PORT = 9351;
const HOME = process.argv[3] ?? path.join(os.tmpdir(), `wayland-ijfw-smoke-${process.pid}`);
const REAL_HOME = process.env.REAL_HOME ?? os.userInfo().homedir;

const log = (...a) => console.log(...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- seed the sandbox ----------
fs.rmSync(HOME, { recursive: true, force: true });
const USER_DATA = path.join(HOME, 'userData');
const cfgDir = path.join(USER_DATA, 'config');
fs.mkdirSync(cfgDir, { recursive: true });
const payload = { 'ijfw.skipSetup': true };
const encoded = Buffer.from(encodeURIComponent(JSON.stringify(payload))).toString('base64');
fs.writeFileSync(path.join(cfgDir, 'wayland-config.txt'), encoded);
log('seeded ijfw.skipSetup=true');

// Real IJFW install so detection has something true to find and the runtime is
// genuinely spawnable (a stub would prove nothing about the runtime row).
if (!fs.existsSync(path.join(REAL_HOME, '.ijfw', 'mcp-server'))) {
  console.error(`SKIP: no IJFW install at ${REAL_HOME}/.ijfw/mcp-server to exercise.`);
  process.exit(0);
}
// Copy a REAL install: a stub would prove nothing about the runtime row.
execFileSync('cp', ['-R', path.join(REAL_HOME, '.ijfw'), path.join(HOME, '.ijfw')]);
log(
  'copied real ~/.ijfw (v' + JSON.parse(fs.readFileSync(path.join(HOME, '.ijfw/mcp-server/package.json'))).version + ')'
);

// ---------- launch ----------
const child = spawn(path.join(APP, 'Contents/MacOS/Wayland'), [`--remote-debugging-port=${PORT}`], {
  env: {
    ...process.env,
    HOME,
    // Redirecting HOME alone does NOT isolate the profile - Electron resolves
    // userData independently of $HOME on macOS, which is how an earlier run of
    // this script attached to the real profile. Isolate it explicitly.
    WAYLAND_E2E_TEST: '1',
    WAYLAND_E2E_USER_DATA_DIR: USER_DATA,
    // ...and force IJFW back ON, which only became possible once the guard
    // stopped piggybacking on WAYLAND_E2E_TEST.
    WAYLAND_DISABLE_IJFW: '0',
    WAYLAND_MULTI_INSTANCE: '1',
    WAYLAND_DISABLE_AUTO_UPDATE: '1',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
  detached: false,
});
let appErr = '';
child.stderr.on('data', (d) => (appErr += d.toString()));

const cdpList = () =>
  new Promise((resolve, reject) => {
    http
      .get(`http://127.0.0.1:${PORT}/json/list`, (res) => {
        let b = '';
        res.on('data', (d) => (b += d));
        res.on('end', () => {
          try {
            resolve(JSON.parse(b));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });

async function findPage(timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const list = await cdpList();
      const page = list.find((t) => t.type === 'page' && /index\.html/.test(t.url));
      if (page?.webSocketDebuggerUrl) return page;
    } catch {
      /* not up yet */
    }
    await sleep(1000);
  }
  return null;
}

let idc = 0;
function makeClient(ws) {
  const pending = new Map();
  ws.on('message', (raw) => {
    const msg = JSON.parse(raw.toString());
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    }
  });
  return (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++idc;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => pending.has(id) && (pending.delete(id), reject(new Error(method + ' timeout'))), 30000);
    });
}

const READ_STATE = `(() => {
  const q = (sel) => document.querySelector(sel);
  const row = (k) => {
    const el = q('[data-testid="ijfw-status-item-' + k + '"]');
    return el ? { status: el.getAttribute('data-status'), text: el.innerText.replace(/\\n/g, ' | ') } : null;
  };
  const sw = q('[data-testid="ijfw-settings-skip-switch"]');
  const res = q('[data-testid="ijfw-settings-test-result"]');
  return JSON.stringify({
    panel: !!q('[data-testid="ijfw-settings-panel"]'),
    skipOn: sw ? sw.getAttribute('aria-checked') : null,
    install: row('install'),
    clis: row('clis'),
    runtime: row('runtime'),
    testResult: res ? { result: res.getAttribute('data-result'), text: res.innerText } : null,
  });
})()`;

(async () => {
  try {
    const page = await findPage(120000);
    if (!page) throw new Error('no renderer page over CDP. stderr: ' + appErr.slice(-500));
    log('CDP attached');
    const ws = new WebSocket(page.webSocketDebuggerUrl, { perMessageDeflate: false });
    await new Promise((r, j) => (ws.once('open', r), ws.once('error', j)));
    const send = makeClient(ws);
    await send('Runtime.enable');

    const evalJs = async (expr) => {
      const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      return r.result?.value;
    };

    await sleep(6000);
    await evalJs(`location.hash = '#/settings/ijfw'; true`);
    await sleep(4000);

    const before = JSON.parse(await evalJs(READ_STATE));
    log("\n=== BEFORE (Sean's state: skipSetup=true) ===");
    log(JSON.stringify(before, null, 2));

    log('\n--- clicking the Skip switch OFF ---');
    await evalJs(`document.querySelector('[data-testid="ijfw-settings-skip-switch"]').click(); true`);

    // bootstrap: detect -> emit installing/installed_current
    for (const wait of [4000, 6000, 8000, 10000]) {
      await sleep(wait);
      const s = JSON.parse(await evalJs(READ_STATE));
      log(
        `  +${wait}ms  skipOn=${s.skipOn}  install=${s.install?.status} (${s.install?.text})  runtime=${s.runtime?.status}`
      );
      if (s.install?.status === 'ok') break;
    }

    const after = JSON.parse(await evalJs(READ_STATE));
    log('\n=== AFTER TOGGLE ===');
    log(JSON.stringify(after, null, 2));

    log('\n--- clicking Test ---');
    await evalJs(`document.querySelector('[data-testid="ijfw-settings-test-button"]').click(); true`);
    await sleep(12000);
    const tested = JSON.parse(await evalJs(READ_STATE));
    log('=== AFTER TEST ===');
    log(JSON.stringify(tested, null, 2));

    const pass =
      before.install?.status === 'pending' &&
      before.skipOn === 'true' &&
      after.install?.status === 'ok' &&
      after.skipOn === 'false';
    const runtimeLive = tested.runtime?.status === 'ok';
    const probePassed = tested.testResult?.result === 'pass';
    log('\nTOGGLE RECOVERY: ' + (pass ? 'PASS' : 'FAIL'));
    log('MEMORY TEST PROBE: ' + (tested.testResult?.result ?? 'no result') + ' -> ' + (tested.testResult?.text ?? ''));
    log('RUNTIME ROW: ' + tested.runtime?.status + ' (' + tested.runtime?.text + ')');
    log('OVERALL: ' + (pass && runtimeLive && probePassed ? 'PASS' : 'FAIL'));
    process.exitCode = pass && runtimeLive && probePassed ? 0 : 1;
  } catch (e) {
    console.error('LIVE TEST ERROR:', e.message);
    process.exitCode = 2;
  } finally {
    try {
      child.kill('SIGTERM');
    } catch {}
    await sleep(1500);
    try {
      child.kill('SIGKILL');
    } catch {}
  }
})();
