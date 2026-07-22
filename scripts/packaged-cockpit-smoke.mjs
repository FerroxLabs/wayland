#!/usr/bin/env node
/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Packaged Cockpit smoke — drive a PACKAGED (hardened, fused) Wayland build as a
 * user would, over the Chromium DevTools Protocol.
 *
 * Why CDP and not `_electron.launch`:
 *   `afterPack.js` flips `EnableNodeCliInspectArguments: false`, which kills the
 *   Node inspector that Playwright's Electron driver attaches to. The app instead
 *   self-enables *Chromium* remote debugging when `WAYLAND_CDP_PORT` is set to a
 *   real port (see `configureChromium.ts`; `'0'` DISABLES it). So we launch the
 *   binary ourselves and `chromium.connectOverCDP`, exactly like
 *   `platform-package-smoke.mjs` does. No fuse is weakened to run this.
 *
 * What it proves: the packaged artifact boots, the Cockpit shell activates, every
 * navigation destination renders, the IPC bridge answers, a provider connects,
 * and a real chat round-trip streams a reply.
 *
 * Usage:
 *   node scripts/packaged-cockpit-smoke.mjs [--app <path-to-.app-or-exe>]
 *                                           [--out-dir <dir>]        # default: out-preview, then out
 *                                           [--key-file <path>]      # default: ~/.config/wayland-smoke/flux-test-key
 *                                           [--report-dir <dir>]     # default: .smoke/<timestamp>
 *                                           [--no-chat] [--keep-open] [--timeout <ms>]
 *
 * The provider key is read from a file, never from argv and never echoed — it
 * must not land in shell history, CI logs, or this repo.
 *
 * Exits non-zero when any surface fails or (unless --no-chat) chat does not reply.
 */

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

const TAG = '[packaged-smoke]';
const log = (message) => console.log(`${TAG} ${message}`);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Cockpit navigation destinations. `nav` is the sider button testid when one
 * exists; the hash is both the fallback and the assertion that routing landed.
 */
const SURFACES = [
  { id: 'home', label: 'Chat Home', hash: '#/guid', nav: null },
  { id: 'chats', label: 'Chats', hash: '#/conversations', nav: 'cockpit-nav-chats' },
  { id: 'projects', label: 'Projects', hash: '#/projects', nav: 'cockpit-nav-projects' },
  { id: 'automations', label: 'Automations', hash: '#/scheduled', nav: 'cockpit-nav-automations' },
  { id: 'activity', label: 'Activity', hash: '#/mission-control', nav: 'cockpit-nav-activity' },
  { id: 'assistants', label: 'Assistants', hash: '#/assistants', nav: 'cockpit-nav-assistants' },
  { id: 'workflows', label: 'Workflows', hash: '#/workflows', nav: 'cockpit-nav-workflows' },
  { id: 'teams', label: 'Teams', hash: '#/teams', nav: 'cockpit-nav-teams' },
  { id: 'skills', label: 'Skills', hash: '#/settings/skills', nav: 'cockpit-nav-skills' },
  { id: 'connections', label: 'Connections', hash: '#/settings/mcp-library/browse', nav: 'cockpit-nav-connections' },
  { id: 'knowledge', label: 'Memory & wiki', hash: '#/memory', nav: 'cockpit-nav-knowledge' },
  { id: 'settings', label: 'Settings', hash: '#/settings/navigation', nav: 'cockpit-nav-settings' },
];

function parseArgs(argv) {
  const options = {
    app: null,
    outDir: null,
    keyFile: path.join(os.homedir(), '.config', 'wayland-smoke', 'flux-test-key'),
    reportDir: null,
    chat: true,
    keepOpen: false,
    timeoutMs: 60_000,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => argv[(i += 1)];
    if (arg === '--app') options.app = next();
    else if (arg === '--out-dir') options.outDir = next();
    else if (arg === '--key-file') options.keyFile = next();
    else if (arg === '--report-dir') options.reportDir = next();
    else if (arg === '--no-chat') options.chat = false;
    else if (arg === '--keep-open') options.keepOpen = true;
    else if (arg === '--timeout') options.timeoutMs = Number(next());
    else throw new Error(`${TAG} unknown argument: ${arg}`);
  }
  return options;
}

/**
 * Locate the packaged executable inside an electron-builder output directory.
 * Mirrors `packaged-launch.mjs`, but tolerates any product name (the preview
 * build ships as "Wayland Preview") and any of the usual arch directories.
 */
function resolvePackagedApp(outRoot) {
  if (!fs.existsSync(outRoot)) return null;

  if (process.platform === 'darwin') {
    for (const dir of ['mac-arm64', 'mac-x64', 'mac', 'mac-universal']) {
      const macDir = path.join(outRoot, dir);
      if (!fs.existsSync(macDir)) continue;
      const bundle = fs.readdirSync(macDir).find((entry) => entry.endsWith('.app'));
      if (!bundle) continue;
      const macOsDir = path.join(macDir, bundle, 'Contents', 'MacOS');
      if (!fs.existsSync(macOsDir)) continue;
      const [binary] = fs.readdirSync(macOsDir);
      if (binary) return path.join(macOsDir, binary);
    }
    return null;
  }

  if (process.platform === 'win32') {
    for (const dir of ['win-unpacked', 'win-x64-unpacked', 'win-arm64-unpacked']) {
      const unpacked = path.join(outRoot, dir);
      if (!fs.existsSync(unpacked)) continue;
      const exe = fs.readdirSync(unpacked).find((entry) => entry.toLowerCase().endsWith('.exe'));
      if (exe) return path.join(unpacked, exe);
    }
    return null;
  }

  for (const dir of ['linux-unpacked', 'linux-x64-unpacked', 'linux-arm64-unpacked']) {
    const unpacked = path.join(outRoot, dir);
    if (!fs.existsSync(unpacked)) continue;
    for (const name of ['wayland', 'Wayland']) {
      const binary = path.join(unpacked, name);
      if (fs.existsSync(binary)) return binary;
    }
  }
  return null;
}

/**
 * Environment variables the packaged app needs to boot. Everything else is
 * dropped on purpose.
 *
 * The operator's shell almost certainly holds real provider credentials
 * (`OPENAI_API_KEY`, `GROQ_API_KEY`, …). Inheriting `process.env` would let the
 * app auto-detect and connect them, which (a) writes live personal keys into a
 * throwaway smoke profile and bills real calls, and (b) makes the run depend on
 * whoever's shell started it — a catalog that differs per machine silently
 * changes which model the cold-start resolver picks. Allowlist, don't denylist:
 * a new credential variable must not be able to leak in by default.
 */
const ENV_ALLOWLIST = ['PATH', 'HOME', 'TMPDIR', 'USER', 'LOGNAME', 'LANG', 'LC_ALL', 'SHELL', 'DISPLAY', 'XAUTHORITY'];

function buildChildEnv(extra) {
  const env = {};
  for (const name of ENV_ALLOWLIST) {
    if (process.env[name] !== undefined) env[name] = process.env[name];
  }
  return { ...env, ...extra };
}

function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

function cdpAlive(port) {
  return new Promise((resolve) => {
    const request = http.get(`http://127.0.0.1:${port}/json/version`, (response) => {
      response.resume();
      resolve(response.statusCode === 200);
    });
    request.on('error', () => resolve(false));
    request.setTimeout(1_000, () => {
      request.destroy();
      resolve(false);
    });
  });
}

/**
 * Call an IPC bridge channel from inside the renderer and await its reply.
 *
 * The preload exposes a fire-and-subscribe pair rather than a promise API, so we
 * emit `subscribe-<channel>` with a unique id and resolve on the matching
 * `subscribe.callback-<channel><id>` payload.
 *
 * Always returns `{ ok, value }` — never collapses a channel that replied with
 * `undefined` into a synthetic success object, because that would make a
 * missing config value indistinguishable from a healthy ack.
 */
function invokeBridge(page, channel, data, timeoutMs = 25_000) {
  return page.evaluate(
    async ({ channel, data, timeoutMs }) => {
      const api = window.electronAPI;
      if (!api) return { ok: false, error: 'electronAPI unavailable' };
      const id = `smoke_${Math.random().toString(36).slice(2)}`;
      const callbackName = `subscribe.callback-${channel}${id}`;
      return await new Promise((resolve) => {
        let settled = false;
        const off = api.on((payload) => {
          try {
            const raw = payload?.value;
            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            if (settled || parsed?.name !== callbackName) return;
            settled = true;
            off?.();
            resolve({ ok: true, value: parsed.data });
          } catch {
            /* other traffic on the shared channel - ignore */
          }
        });
        api.emit(`subscribe-${channel}`, { id, data });
        setTimeout(() => {
          if (!settled) resolve({ ok: false, error: 'timeout' });
        }, timeoutMs);
      });
    },
    { channel, data, timeoutMs }
  );
}

/** Read the provider key from disk. Returns null when absent so --no-chat still runs. */
function readKeyFile(keyFile) {
  if (!fs.existsSync(keyFile)) return null;
  const key = fs.readFileSync(keyFile, 'utf8').trim();
  return key.length > 0 ? key : null;
}

async function attachRenderer(port, timeoutMs) {
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
  const context = browser.contexts()[0];
  const deadline = Date.now() + timeoutMs;
  let page = null;
  while (Date.now() < deadline) {
    const candidates = context.pages().filter((candidate) => !candidate.url().includes('devtools'));
    page = candidates.find((candidate) => candidate.url().includes('index.html')) ?? candidates[0] ?? null;
    if (page) break;
    await sleep(500);
  }
  if (!page) {
    await browser.close().catch(() => {});
    throw new Error(`${TAG} no renderer page appeared over CDP`);
  }
  // Playwright's 30s default turns every miss into a long stall; this harness
  // polls deliberately, so failures must surface fast.
  page.setDefaultTimeout(10_000);
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  return { browser, page };
}

/** Walk every Cockpit destination, capturing render evidence and console errors. */
async function walkSurfaces(page, consoleErrors, reportDir) {
  const findings = [];
  for (const surface of SURFACES) {
    const errorsBefore = consoleErrors.length;
    let navMethod = 'hash';
    try {
      const button = surface.nav ? page.locator(`[data-testid="${surface.nav}"]`).first() : null;
      if (button && (await button.isVisible({ timeout: 1_500 }).catch(() => false))) {
        await button.click({ timeout: 5_000 });
        navMethod = 'click';
      } else {
        await page.evaluate((hash) => {
          window.location.hash = hash;
        }, surface.hash);
      }
    } catch {
      await page
        .evaluate((hash) => {
          window.location.hash = hash;
        }, surface.hash)
        .catch(() => {});
    }
    await sleep(2_500);

    const probe = await page
      .evaluate(() => {
        // `.layout-content` is the routed `<Outlet />` region. Do NOT fall back to
        // a bare `.arco-layout-content` — that also matches the sider's content
        // box, which renders identically on every route and turns this probe into
        // a permanent false green.
        const main = document.querySelector('.layout-content');
        const text = (main?.innerText || '').replace(/\s+/g, ' ').trim();
        return {
          bodyLen: text.length,
          hash: window.location.hash,
          sider: !!document.querySelector('[data-testid="cockpit-sider"]'),
          errorBoundary: !!document.querySelector(
            '[data-testid="shell-recover-classic"], [data-testid="error-boundary-fallback"]'
          ),
          contentFound: !!main,
          sample: text.slice(0, 160),
        };
      })
      .catch((error) => ({
        bodyLen: 0,
        hash: '?',
        sider: false,
        errorBoundary: false,
        contentFound: false,
        sample: String(error),
      }));

    const navErrors = consoleErrors.slice(errorsBefore);
    await page.screenshot({ path: path.join(reportDir, `${surface.id}.png`) }).catch(() => {});

    const verdict = probe.errorBoundary
      ? 'ERROR-FALLBACK'
      : !probe.contentFound
        ? 'NO-CONTENT-REGION'
        : probe.bodyLen < 40
          ? 'BLANK'
          : navErrors.length
            ? 'RENDERED+ERRORS'
            : 'OK';
    findings.push({ ...surface, verdict, navMethod, ...probe, navErrors });
    log(
      `${surface.label.padEnd(16)} -> ${verdict} (${navMethod}, ${probe.bodyLen} chars${
        navErrors.length ? `, ${navErrors.length} console err` : ''
      })`
    );
  }
  return findings;
}

/**
 * Live chat round-trip on the home composer.
 *
 * Enables "Route through Flux" first — the cold-start model resolver only
 * promotes Flux Autopilot when that toggle is on (onboarding turns it on when a
 * user connects Flux), and the generic fallback can otherwise land on a
 * non-conversational catalog entry. The resolved model is recorded either way so
 * a bad default is visible in the report rather than silently degrading chat.
 */
/**
 * Any sentinel we name is also echoed back inside the prompt (the transcript
 * renders the user's message as a bubble, a tab label and a progress entry), so
 * a plain `includes()` scores our own message as the reply. Deriving the token
 * instead ("reverse GNOP") pushes the model into an agentic reasoning run that
 * can stall, so keep the prompt trivially answerable and disambiguate by COUNT:
 * every echo carries at most one sentinel and one prompt marker, so the reply is
 * the occurrence that makes sentinels outnumber markers. Truncation only ever
 * drops the tail, so this errs toward a false negative, never a false positive.
 */
const REPLY_SENTINEL = 'PONG';
const PROMPT_MARKER = 'Reply with exactly:';
const PROMPT = 'Reply with exactly: PONG, then one short sentence about what you are.';

const countOccurrences = (haystack, needle) => haystack.split(needle).length - 1;

/** Collapse whitespace so wrapped/re-flowed renderings compare as one string. */
const normalize = (text) => String(text).replace(/\s+/g, ' ').trim();

/** The persisted default-model pin — what the composer will actually send with. */
async function readModelPin(page) {
  const pin = await invokeBridge(page, 'agent.config.storage.get', { key: 'wcore.defaultModel' }, 10_000);
  return pin.ok ? (pin.value ?? null) : { error: pin.error };
}

async function runChat(page, reportDir) {
  const result = { ok: false, selectedModel: null, sendMethod: null, messageBlocks: 0, reply: '', error: null };
  try {
    await page.evaluate(() => {
      window.location.hash = '#/guid';
    });
    await sleep(3_000);

    const composer = page.locator('.guid-input-card-shell textarea').first();
    await composer.waitFor({ state: 'visible', timeout: 20_000 });
    // Send stays disabled on `!input.trim()` OR until the cold-start resolver has
    // pinned a model — the two are indistinguishable from outside. So re-fill on
    // every pass: the home page keeps hydrating after first paint and remounts
    // the composer, silently discarding a single early fill(), which then looks
    // exactly like "no model configured".
    // Scope to the home composer: other routes mount their own
    // `.send-button-custom`, and an unscoped `.first()` can latch onto a hidden
    // one that never enables.
    const sendButton = page.locator('.guid-input-card-shell .send-button-custom').first();
    let sendEnabled = false;
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const value = await composer.inputValue({ timeout: 1_000 }).catch(() => '');
      if (value !== PROMPT) {
        await composer.fill(PROMPT).catch((error) => {
          result.fillError = String(error).slice(0, 200);
        });
      }
      sendEnabled = await sendButton.isEnabled({ timeout: 1_000 }).catch(() => false);
      if (sendEnabled) break;
      await sleep(2_000);
    }
    if (!sendEnabled) {
      // Distinguish the two ways Send stays disabled: the composer's React state
      // never received our text (`!input.trim()`), or the app genuinely has no
      // model (`noModelConfigured`, which also renders the "No model configured
      // yet" CTA).
      result.diagnosis = await page
        .evaluate(() => {
          const textarea = document.querySelector('.guid-input-card-shell textarea');
          return {
            composerValue: textarea?.value?.slice(0, 60) ?? null,
            composerCount: document.querySelectorAll('.guid-input-card-shell textarea').length,
            shellCount: document.querySelectorAll('.guid-input-card-shell').length,
            hash: window.location.hash,
            noModelCta: document.body.innerText.includes('No model configured yet'),
          };
        })
        .catch(() => null);
      result.error = 'send button never became enabled (no model resolved within 60s)';
      result.selectedModel = await readModelPin(page);
      await page.screenshot({ path: path.join(reportDir, 'chat.png') }).catch(() => {});
      return result;
    }
    // The composer can remount between the enabled check and the click, which
    // detaches the element mid-action; retry rather than failing the whole run.
    let sent = false;
    for (let attempt = 0; attempt < 3 && !sent; attempt += 1) {
      try {
        await sendButton.click({ timeout: 10_000 });
        sent = true;
      } catch (error) {
        result.error = String(error).slice(0, 120);
        const value = await composer.inputValue({ timeout: 1_000 }).catch(() => '');
        if (value !== PROMPT) await composer.fill(PROMPT).catch(() => {});
        await sleep(2_000);
      }
    }
    if (!sent) return result;
    result.error = null;
    result.sendMethod = 'button';
    result.selectedModel = await readModelPin(page);

    // Assert on what the user can actually see in the transcript, not on a
    // message testid. Routing through Flux Auto answers as an AGENT: the reply
    // lands in workflow/progress components, not in the `message-text-content`
    // bubble a plain chat turn would use — so a testid-scoped assertion reports
    // "no reply" while the answer is plainly on screen.
    //
    // PONG is the sentinel: the prompt asks for it verbatim, so its presence
    // anywhere in the transcript proves the round-trip completed AND that the
    // model actually followed the instruction. Flux Auto can take well over a
    // minute to answer, so this waits ~3 minutes before calling chat broken.
    const transcript = page.locator('.layout-content');
    for (let attempt = 0; attempt < 150; attempt += 1) {
      await sleep(2_000);
      const raw = (await transcript.textContent({ timeout: 2_000 }).catch(() => '')) ?? '';
      result.messageBlocks = await page
        .locator('[data-testid="message-text-content"]')
        .count()
        .catch(() => 0);
      const text = normalize(raw);
      const sentinels = countOccurrences(text, REPLY_SENTINEL);
      const echoes = countOccurrences(text, PROMPT_MARKER);
      if (sentinels > echoes) {
        const index = text.lastIndexOf(REPLY_SENTINEL);
        result.reply = text.slice(index, index + 200).trim();
        result.ok = true;
        break;
      }
    }
    if (!result.ok) {
      // Record what the transcript actually held, so a failure names the DOM it
      // saw instead of leaving the next reader to guess at selectors.
      result.transcriptTail = ((await transcript.textContent({ timeout: 2_000 }).catch(() => '')) ?? '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(-400);
      // Surface whatever the composer/toast is showing — an unsent message still
      // sitting in the textarea is the signature of a rejected send.
      result.error = await page
        .evaluate(() => {
          const textarea = document.querySelector('.guid-input-card-shell textarea');
          const toast = document.querySelector('.arco-message, [role="alert"]');
          return `composer=${JSON.stringify(textarea?.value?.slice(0, 80) ?? '')} toast=${JSON.stringify(
            toast?.textContent?.trim()?.slice(0, 120) ?? ''
          )}`;
        })
        .catch(() => 'no reply and probe failed');
    }
  } catch (error) {
    result.error = String(error).slice(0, 200);
  }
  await page.screenshot({ path: path.join(reportDir, 'chat.png') }).catch(() => {});
  return result;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const projectRoot = process.cwd();

  const executable =
    options.app ??
    (options.outDir
      ? resolvePackagedApp(path.resolve(projectRoot, options.outDir))
      : (resolvePackagedApp(path.join(projectRoot, 'out-preview')) ??
        resolvePackagedApp(path.join(projectRoot, 'out'))));
  if (!executable || !fs.existsSync(executable)) {
    console.error(
      `${TAG} no packaged app found under out-preview/ or out/. Build one first, e.g.\n` +
        `        WAYLAND_RELEASE_TRACK=preview node scripts/build-with-builder.js arm64 --mac --arm64 --pack-only`
    );
    process.exit(1);
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportDir = path.resolve(projectRoot, options.reportDir ?? path.join('.smoke', stamp));
  fs.mkdirSync(reportDir, { recursive: true });
  const userDataDir = path.join(reportDir, 'user-data');
  fs.mkdirSync(userDataDir, { recursive: true });

  const key = readKeyFile(options.keyFile);
  if (!key && options.chat) {
    console.error(`${TAG} no provider key at ${options.keyFile} — pass --no-chat or provision one.`);
    process.exit(1);
  }

  const port = await findFreePort();
  log(`app: ${executable}`);
  log(`report: ${reportDir}`);
  log(`launching with WAYLAND_CDP_PORT=${port} (Chromium remote debugging; no fuse weakened)`);

  const child = spawn(executable, ['--password-store=basic'], {
    env: buildChildEnv({
      NODE_ENV: 'production',
      WAYLAND_CDP_PORT: String(port),
      WAYLAND_E2E_TEST: '1',
      WAYLAND_E2E_USER_DATA_DIR: userDataDir,
      WAYLAND_MULTI_INSTANCE: '1',
      WAYLAND_DISABLE_AUTO_UPDATE: '1',
      WAYLAND_DISABLE_DEVTOOLS: '1',
      WAYLAND_EXTENSIONS_PATH: path.join(projectRoot, 'examples'),
    }),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const appOutput = [];
  for (const stream of [child.stdout, child.stderr]) {
    stream?.on('data', (chunk) => {
      appOutput.push(String(chunk));
      if (appOutput.length > 400) appOutput.shift();
    });
  }

  const deadline = Date.now() + options.timeoutMs;
  let up = false;
  while (Date.now() < deadline) {
    if (await cdpAlive(port)) {
      up = true;
      break;
    }
    await sleep(1_000);
  }
  if (!up) {
    child.kill('SIGTERM');
    fs.writeFileSync(path.join(reportDir, 'app-output.log'), appOutput.join(''));
    console.error(`${TAG} CDP endpoint never came up within ${options.timeoutMs}ms — see app-output.log`);
    process.exit(1);
  }

  const { browser, page } = await attachRenderer(port, 20_000);
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text().slice(0, 300));
  });
  page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${String(error).slice(0, 300)}`));
  await sleep(4_000);

  // A live bridge must return the provider ARRAY, not merely acknowledge.
  const bridgeProbe = await invokeBridge(page, 'modelRegistry.list', undefined, 10_000);
  const bridgeOk = bridgeProbe.ok && Array.isArray(bridgeProbe.value);
  log(
    `ipc bridge: ${bridgeOk ? `responding (${bridgeProbe.value.length} providers)` : `FAILED (${bridgeProbe.error ?? 'unexpected payload'})`}`
  );

  let providerConnected = null;
  if (key) {
    const connect = await invokeBridge(page, 'modelRegistry.connect', { providerId: 'flux-router', creds: { key } });
    providerConnected = connect.ok && connect.value?.error === undefined;
    log(`provider connect: ${providerConnected ? 'ok' : `FAILED (${connect.error ?? JSON.stringify(connect.value)})`}`);
    // Mirrors onboarding: the cold-start resolver only promotes Flux Autopilot
    // while this toggle is on.
    await invokeBridge(page, 'system-settings:set-route-through-flux', { enabled: true });
  }

  // Retire first-run onboarding before anything else. The overlay is a modal
  // that steals focus and swallows composer input, and because it only records
  // completion when the user reaches the LAST step, any reload mid-flow restarts
  // it — so a smoke run that ignores it is racing a modal. `OnboardingOverlay`
  // gates on the `onboardingCompleted` config flag OR a synchronous localStorage
  // marker; set both, exactly as a returning user would have.
  await invokeBridge(page, 'agent.config.storage.set', { key: 'onboardingCompleted', data: true });
  await page.evaluate(() => {
    try {
      localStorage.setItem('onboardingCompleted', '1');
    } catch {
      /* config flag alone is enough */
    }
  });

  // Activate the Cockpit shell, then reload so the shell and the model resolver
  // both boot from the persisted state rather than a half-switched runtime.
  await invokeBridge(page, 'agent.config.storage.set', { key: 'ui.shell', data: 'cockpit' });
  await page.reload().catch(() => {});
  await sleep(6_000);
  const siderPresent = await page
    .locator('[data-testid="cockpit-sider"]')
    .count()
    .then((count) => count > 0)
    .catch(() => false);
  log(`cockpit shell: ${siderPresent ? 'active' : 'NOT ACTIVE'}`);

  // The catalog must survive the reload, otherwise the home picker has nothing
  // to resolve a default model from and chat is dead before it starts. Poll:
  // connect persists and re-fetches asynchronously, so a single immediate read
  // races it and reports an empty catalog that is merely not-ready-yet.
  let catalogProviders = null;
  for (let attempt = 0; attempt < 15; attempt += 1) {
    const catalog = await invokeBridge(page, 'modelRegistry.list', undefined, 15_000);
    if (Array.isArray(catalog.value)) {
      catalogProviders = catalog.value;
      if (catalogProviders.some((provider) => (provider?.modelCount ?? 0) > 0)) break;
    }
    await sleep(2_000);
  }
  log(
    `catalog after reload: ${
      catalogProviders
        ? catalogProviders
            .map((p) => `${p.id ?? '?'}(${p.connected ? 'connected' : 'idle'},${p.modelCount ?? '?'})`)
            .join(' ')
        : 'UNAVAILABLE'
    }`
  );

  // The home picker does NOT read the registry — it reads `mode.get-model-config`.
  // Record both: a connected registry with an empty model-config is the exact
  // state in which chat looks fine but the composer can never send.
  const modelConfig = await invokeBridge(page, 'mode.get-model-config', undefined, 15_000);
  const modelConfigSummary = Array.isArray(modelConfig.value)
    ? modelConfig.value.map((provider) => ({
        platform: provider?.platform ?? null,
        enabled: provider?.enabled ?? null,
        modelCount: Array.isArray(provider?.model) ? provider.model.length : 0,
      }))
    : { error: modelConfig.error ?? 'unexpected payload' };
  log(`home model config: ${JSON.stringify(modelConfigSummary)}`);

  const findings = await walkSurfaces(page, consoleErrors, reportDir);
  const chat = options.chat ? await runChat(page, reportDir) : { ok: null, skipped: true };
  if (options.chat) log(`chat: ${chat.ok ? `replied (${chat.sendMethod})` : `NO REPLY — ${chat.error}`}`);

  const failures = findings.filter((finding) =>
    ['BLANK', 'ERROR-FALLBACK', 'NO-CONTENT-REGION'].includes(finding.verdict)
  );
  const passed = bridgeOk && siderPresent && failures.length === 0 && chat.ok !== false;

  const report = {
    passed,
    executable,
    driver: 'chromium.connectOverCDP',
    bridgeOk,
    siderPresent,
    providerConnected,
    catalogProviders,
    modelConfigSummary,
    chat,
    surfaces: findings,
    consoleErrorCount: consoleErrors.length,
    consoleErrors: consoleErrors.slice(0, 25),
  };
  fs.writeFileSync(path.join(reportDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(path.join(reportDir, 'app-output.log'), appOutput.join(''));
  log(`report written: ${path.join(reportDir, 'report.json')}`);

  if (!options.keepOpen) {
    await browser.close().catch(() => {});
    child.kill('SIGTERM');
  }

  log(passed ? 'PASS' : 'FAIL');
  process.exit(passed ? 0 : 1);
}

main().catch((error) => {
  console.error(`${TAG} failed:`, error);
  process.exit(1);
});
