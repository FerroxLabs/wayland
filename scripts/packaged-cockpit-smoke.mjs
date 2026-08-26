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
 *                                           [--out-dir <dir>]        # default: the requested track's output dir
 *                                           [--release-track stable|preview]  # default: $WAYLAND_RELEASE_TRACK, else stable
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

import { resolveTrackedPackagedApp } from './lib/packagedAppResolver.mjs';

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
    releaseTrack: null,
    keyFile: path.join(os.homedir(), '.config', 'wayland-smoke', 'flux-test-key'),
    reportDir: null,
    chat: true,
    surfaces: true,
    keepOpen: false,
    timeoutMs: 60_000,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    // A flag missing its value must be an error, not a silent fallback: an
    // unnoticed `--app` with nothing after it would smoke a different binary
    // than the one asked for, and a bad `--timeout` becomes NaN and "fails"
    // instantly against a perfectly healthy app.
    const next = () => {
      const value = argv[(i += 1)];
      if (value === undefined || value.startsWith('--')) throw new Error(`${TAG} ${arg} requires a value`);
      return value;
    };
    if (arg === '--app') options.app = next();
    else if (arg === '--out-dir') options.outDir = next();
    else if (arg === '--release-track') options.releaseTrack = next();
    else if (arg === '--key-file') options.keyFile = next();
    else if (arg === '--report-dir') options.reportDir = next();
    else if (arg === '--no-chat') options.chat = false;
    else if (arg === '--no-surfaces') options.surfaces = false;
    else if (arg === '--keep-open') options.keepOpen = true;
    else if (arg === '--timeout') {
      options.timeoutMs = Number(next());
      if (!Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0) {
        throw new Error(`${TAG} --timeout must be a positive number of milliseconds`);
      }
    } else throw new Error(`${TAG} unknown argument: ${arg}`);
  }
  return options;
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
const ENV_ALLOWLIST = [
  'PATH',
  'HOME',
  'TMPDIR',
  'USER',
  'LOGNAME',
  'LANG',
  'LC_ALL',
  'SHELL',
  // Linux: Chromium needs a session bus and display handles.
  'DISPLAY',
  'XAUTHORITY',
  'XDG_RUNTIME_DIR',
  'DBUS_SESSION_BUS_ADDRESS',
  'WAYLAND_DISPLAY',
  // Windows: Chromium will not start without SystemRoot, and Electron needs the
  // per-user app-data roots.
  'SystemRoot',
  'windir',
  'APPDATA',
  'LOCALAPPDATA',
  'USERPROFILE',
  'TEMP',
  'TMP',
  'COMSPEC',
  'ProgramData',
  'NUMBER_OF_PROCESSORS',
];

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
          // `ShellRecoveryFallback` is the only rendered recovery testid. Route
          // ErrorBoundary has none and its copy is ~67 chars, i.e. comfortably
          // over the blank floor — so match its text too, or a contained route
          // crash reports as a healthy page.
          errorBoundary:
            !!document.querySelector('[data-testid="shell-recovery-fallback"]') ||
            /Something went wrong/i.test(main?.innerText ?? ''),
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

    // Router.tsx has a catch-all that redirects unknown paths to /guid. Without
    // comparing the landed hash, a deleted or renamed route silently reports OK
    // while the harness is really looking at the home page 12 times over.
    const landed = probe.hash === surface.hash;

    const verdict = probe.errorBoundary
      ? 'ERROR-FALLBACK'
      : !probe.contentFound
        ? 'NO-CONTENT-REGION'
        : !landed
          ? 'WRONG-ROUTE'
          : probe.bodyLen < 40
            ? 'BLANK'
            : navErrors.length
              ? 'RENDERED+ERRORS'
              : 'OK';
    findings.push({ ...surface, verdict, navMethod, landed, ...probe, navErrors });
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
 * Chat round-trip proof.
 *
 * Getting this assertion right is harder than it looks; three earlier versions
 * reported a reply that never happened:
 *   1. `message-text-content` is shared by the user and assistant bubbles, so
 *      matching it returned our own prompt.
 *   2. Any sentinel named in the prompt is echoed back by the transcript (bubble,
 *      tab label, progress entry), and TRUNCATED echoes defeat exact-string
 *      stripping.
 *   3. Counting sentinel-vs-prompt-marker occurrences still fails, because the
 *      app generates an LLM conversation TITLE from the first user message
 *      (`useAutoTitle` -> `titleGenerationService`, which runs whenever the
 *      message exceeds 30 chars). That title is a *different, cheaper model
 *      call*: it can succeed while chat itself is broken, and it may quote the
 *      sentinel without the prompt marker — tipping the count and turning a dead
 *      chat green, non-deterministically.
 *
 * So: the sentinel is a per-run RANDOM nonce that appears nowhere in the prompt
 * text (the model is asked to derive nothing — it is told to echo a token), and
 * the search is scoped to the message transcript with the title/tab chrome
 * excluded. A title that happens to quote the nonce therefore cannot satisfy it.
 */
const REPLY_NONCE = `WLD${Math.floor(Math.random() * 1e9)
  .toString(36)
  .toUpperCase()}`;
// The distinctive instruction phrase. The agent's reasoning block quotes it back
// (`The task is: Reply with this exact token…`), so an assistant message that
// contains the nonce but NOT this phrase is the actual answer, not the echo.
const PROMPT_MARKER = 'Reply with this exact token';
const PROMPT = `${PROMPT_MARKER} on its own line: ${REPLY_NONCE} - then one short sentence about what you are.`;

/** The persisted default-model pin — what the composer will actually send with. */
async function readModelPin(page) {
  const pin = await invokeBridge(page, 'agent.config.storage.get', { key: 'wcore.defaultModel' }, 10_000);
  return pin.ok ? (pin.value ?? null) : { error: pin.error };
}

/**
 * Dismiss the first-run "Try the new Cockpit layout?" prompt.
 *
 * This smoke launches with a FRESH `mkdtemp` userData directory every run, so the
 * shell-choice prompt (`ShellChoiceOverlay`) is ALWAYS eligible and always opens
 * over the home composer. It is an Arco `Modal` with `maskClosable={false}`, so
 * its mask swallows pointer events aimed at anything underneath.
 *
 * That made the chat step unpassable in a way that looked like a product bug:
 * `sendButton.isEnabled()` returns TRUE (it does not test occlusion), so the
 * enable loop succeeds and only the subsequent `click()` fails, timing out on all
 * three retries with "locator.click: Timeout 10000ms exceeded". The composer was
 * fine the whole time; the click simply could not reach it.
 *
 * Dismiss via the modal's close control, which is wired to the same `close`
 * handler as the "Not now" button: it records that the user answered and leaves
 * the CURRENT shell in place, so the smoke keeps exercising the default layout
 * rather than opting itself into Cockpit. Matching on the button text would break
 * on any non-English locale, so key off the modal's `data-testid` instead.
 *
 * Returns true when a prompt was found and closed. Absence is not a failure - the
 * prompt is skipped once answered, so a reused profile legitimately has none.
 */
async function dismissShellChoicePrompt(page) {
  const prompt = page.locator('[data-testid="shell-choice-prompt"]');
  if (!(await prompt.count().catch(() => 0))) return false;
  const modal = page.locator('.arco-modal').filter({ has: prompt }).first();
  await modal
    .locator('.arco-modal-close-btn')
    .first()
    .click({ timeout: 5_000 })
    .catch(() => page.keyboard.press('Escape').catch(() => {}));
  // Wait for it to actually leave the DOM: clicking and assuming would just move
  // the same occlusion failure a few lines down.
  await prompt.waitFor({ state: 'detached', timeout: 10_000 }).catch(() => {});
  const stillOpen = Boolean(await prompt.count().catch(() => 0));
  log(stillOpen ? 'shell choice: STILL OPEN after dismiss' : 'shell choice: dismissed');
  return !stillOpen;
}

async function runChat(page, reportDir) {
  const result = {
    ok: false,
    selectedModel: null,
    sendMethod: null,
    sendLanded: false,
    messageBlocks: 0,
    answerVerifiedInDom: false,
    reply: '',
    error: null,
  };
  try {
    await page.evaluate(() => {
      window.location.hash = '#/guid';
    });
    await sleep(3_000);

    result.shellChoiceDismissed = await dismissShellChoicePrompt(page);

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

    // Identify the assistant's ANSWER robustly.
    //
    // Every message wrapper carries `data-message-position` (MessageList.tsx:114):
    // 'left' = assistant, 'right' = user. But the agent puts TWO messages on the
    // left — its reasoning ("Thought for Ns") and the actual answer — and the
    // reasoning restates the prompt, nonce and all. So position alone is not
    // enough (three earlier schemes false-greened on the echo). The clean
    // discriminator: the answer contains the nonce but does NOT quote the
    // instruction phrase, whereas the reasoning quotes it verbatim
    // ("The task is: Reply with this exact token…"). `innerText`, not
    // `textContent`, so a collapsed reasoning body cannot bleed in.
    //
    // This proves the full round-trip: the message pipeline accepted our input
    // (a right-side bubble carries the nonce) AND the backend produced a real
    // answer that followed the instruction.
    const findAnswer = () =>
      page
        .evaluate(
          ({ nonce, marker }) => {
            // 4th false verdict, opposite direction: the assistant's rendered
            // markdown lives in a SHADOW ROOT, and neither innerText nor
            // textContent traverses one - so the answer was invisible to this
            // probe while being plainly on screen (and in the screenshot). Walk
            // shadow roots explicitly rather than leaning on a selector engine's
            // piercing behaviour.
            const deepText = (root) => {
              let out = '';
              const visit = (node) => {
                if (node.nodeType === Node.TEXT_NODE) {
                  out += node.nodeValue ?? '';
                  return;
                }
                if (node.shadowRoot) visit(node.shadowRoot);
                for (const child of node.childNodes) visit(child);
              };
              visit(root);
              return out;
            };
            const rightHasNonce = Array.from(document.querySelectorAll('[data-message-position="right"]')).some(
              (node) => deepText(node).includes(nonce)
            );
            const lefts = Array.from(document.querySelectorAll('[data-message-position="left"]'));
            const answerNode = lefts.find((node) => {
              const text = deepText(node);
              return text.includes(nonce) && !text.includes(marker);
            });
            return {
              rightHasNonce,
              leftCount: lefts.length,
              answer: answerNode ? deepText(answerNode).trim().slice(0, 300) : null,
            };
          },
          { nonce: REPLY_NONCE, marker: PROMPT_MARKER }
        )
        .catch(() => ({ rightHasNonce: false, leftCount: 0, answer: null }));

    result.sendLanded = false;
    // Flux Auto answers as an agent and reasons first, so allow ~5 minutes.
    for (let attempt = 0; attempt < 150; attempt += 1) {
      await sleep(2_000);
      const probe = await findAnswer();
      if (probe.rightHasNonce) result.sendLanded = true;
      result.messageBlocks = probe.leftCount;
      if (result.sendLanded && probe.answer) {
        result.ok = true;
        result.reply = probe.answer;
        result.answerVerifiedInDom = true;
        break;
      }
    }
    if (!result.ok) {
      const probe = await findAnswer();
      result.transcriptTail = await page
        .evaluate(() =>
          Array.from(document.querySelectorAll('[data-message-position="left"]'))
            .map((node) => node.innerText ?? '')
            .join(' | ')
            .replace(/\s+/g, ' ')
            .slice(-400)
        )
        .catch(() => '');
      // Self-documenting: if the nonce is anywhere on screen, record the ancestor
      // chain (tag + testid + message-position) of the node holding it. A clean
      // backend run then reveals exactly which container the agentic answer lives
      // in, so the discriminator above can be anchored precisely without guessing.
      result.nonceLocation = await page
        .evaluate((nonce) => {
          const hit = Array.from(document.querySelectorAll('*')).find(
            (node) => node.childElementCount === 0 && (node.textContent ?? '').includes(nonce)
          );
          if (!hit) return null;
          const chain = [];
          for (let node = hit; node && chain.length < 8; node = node.parentElement) {
            const testid = node.getAttribute?.('data-testid');
            const pos = node.getAttribute?.('data-message-position');
            chain.push(`${node.tagName.toLowerCase()}${testid ? `#${testid}` : ''}${pos ? `@${pos}` : ''}`);
          }
          return chain.join(' < ');
        }, REPLY_NONCE)
        .catch(() => null);
      // nonceLocation above stops at the FIRST leaf in document order, which is
      // always the user's own right-side bubble - so it never reveals where the
      // assistant answer lives. Dump every left node with the two discriminator
      // flags so a failure names the exact container to anchor on.
      // EVERY leaf holding the nonce, with its ancestor chain - the first one is
      // always the user bubble, so only the later ones can reveal the answer's
      // container. Also compare textContent (layout-independent) against
      // innerText (layout-dependent) to tell "not in the DOM" from "not rendered".
      result.nonceLeaves = await page
        .evaluate((nonce) => {
          const chainOf = (start) => {
            const chain = [];
            for (let node = start; node && chain.length < 9; node = node.parentElement) {
              const testid = node.getAttribute?.('data-testid');
              const pos = node.getAttribute?.('data-message-position');
              chain.push(`${node.tagName.toLowerCase()}${testid ? `#${testid}` : ''}${pos ? `@${pos}` : ''}`);
            }
            return chain.join(' < ');
          };
          const leaves = Array.from(document.querySelectorAll('*')).filter(
            (node) => node.childElementCount === 0 && (node.textContent ?? '').includes(nonce)
          );
          return {
            count: leaves.length,
            chains: leaves.map(chainOf),
            bodyTextContentHits: (document.body.textContent ?? '').split(nonce).length - 1,
            bodyInnerTextHits: (document.body.innerText ?? '').split(nonce).length - 1,
          };
        }, REPLY_NONCE)
        .catch(() => null);
      result.leftNodes = await page
        .evaluate(
          ({ nonce, marker }) =>
            Array.from(document.querySelectorAll('[data-message-position="left"]')).map((node, index) => {
              const text = node.innerText ?? '';
              return {
                index,
                testid: node.getAttribute('data-testid'),
                type: node.getAttribute('data-message-type'),
                hasNonce: text.includes(nonce),
                hasMarker: text.includes(marker),
                text: text.replace(/\s+/g, ' ').slice(0, 200),
              };
            }),
          { nonce: REPLY_NONCE, marker: PROMPT_MARKER }
        )
        .catch(() => null);
      // Name why: no user bubble means the send never registered (input/model
      // gate); a user bubble but no answer message means the backend produced no
      // reply (provider/routing, or a stall).
      result.error = result.sendLanded
        ? `send landed but no answer message appeared within ~5min (leftMessages=${probe.leftCount})`
        : await page
            .evaluate(() => {
              const textarea = document.querySelector('.guid-input-card-shell textarea');
              const toast = document.querySelector('.arco-message, [role="alert"]');
              return `send never registered: composer=${JSON.stringify(
                textarea?.value?.slice(0, 80) ?? ''
              )} toast=${JSON.stringify(toast?.textContent?.trim()?.slice(0, 120) ?? '')}`;
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

  // #1034: resolve exactly the requested track, or fail naming the directory
  // that should have held it. The previous `out-preview ?? out` chain meant a
  // preview smoke with no preview package silently certified the STABLE app.
  // An unknown track throws here rather than degrading to stable.
  let executable;
  let track = 'stable';
  if (options.app) {
    executable = options.app;
    if (!fs.existsSync(executable)) {
      console.error(`${TAG} --app ${executable} does not exist`);
      return 1;
    }
  } else {
    const resolved = resolveTrackedPackagedApp({
      projectRoot,
      track: options.releaseTrack ?? process.env.WAYLAND_RELEASE_TRACK ?? null,
      outDir: options.outDir,
    });
    executable = resolved.executablePath;
    track = resolved.track;
  }
  log(`release track: ${track}`);

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportDir = path.resolve(projectRoot, options.reportDir ?? path.join('.smoke', stamp));
  fs.mkdirSync(reportDir, { recursive: true });
  // The profile holds the provider credential (encrypted with a key stored in
  // that same directory when safeStorage is unavailable, i.e. headless CI). Keep
  // it OUT of the report directory, which is exactly what gets tarred and
  // uploaded as a CI artifact alongside the screenshots.
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-smoke-'));

  const key = readKeyFile(options.keyFile);
  if (!key && options.chat) {
    console.error(`${TAG} no provider key at ${options.keyFile} — pass --no-chat or provision one.`);
    return 1;
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
  launchedChild = child;
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
    await shutdown(child);
    fs.writeFileSync(path.join(reportDir, 'app-output.log'), appOutput.join(''));
    console.error(`${TAG} CDP endpoint never came up within ${options.timeoutMs}ms — see app-output.log`);
    return 1;
  }

  // A freshly signed .app pays a one-time macOS Gatekeeper verification on FIRST
  // launch that can exceed 20s on a large bundle, so the very first smoke after a
  // build failed with "no renderer page appeared" against a perfectly healthy app
  // (the identical run passed once the OS had cached that verification). Budget
  // for the cold case; a healthy warm launch still attaches in ~1s.
  const { browser, page } = await attachRenderer(port, 120_000);
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

  // --no-surfaces exists to iterate on the chat assertion without paying for the
  // full navigation walk every time. It weakens the run, so it is never a pass:
  // the final verdict below treats a skipped walk as not-a-green-gate.
  // Dismiss BEFORE the surface walk, not just before chat. The prompt becomes
  // eligible at the reload above (`eligible = !prompted && onboarded`, and this
  // smoke sets onboardingCompleted), so it is open for the whole walk. Its mask
  // swallows pointer events, every sider `click()` times out, and walkSurfaces'
  // silent hash fallback rescues the navigation — so all 12 surfaces come back
  // OK with `navMethod: 'hash'` and the sider is never actually exercised.
  // Verified on a real packaged Windows build: 12 of 12 reported `hash`.
  const shellChoiceDismissed = await dismissShellChoicePrompt(page);

  const findings = options.surfaces ? await walkSurfaces(page, consoleErrors, reportDir) : [];
  if (!options.surfaces) log('surfaces: SKIPPED (--no-surfaces) — this run cannot certify the cockpit');
  const chat = options.chat ? await runChat(page, reportDir) : { ok: null, skipped: true };
  if (options.chat) log(`chat: ${chat.ok ? `replied (${chat.sendMethod})` : `NO REPLY — ${chat.error}`}`);

  const failures = findings.filter((finding) =>
    ['BLANK', 'ERROR-FALLBACK', 'NO-CONTENT-REGION', 'WRONG-ROUTE'].includes(finding.verdict)
  );
  // Everything the header claims this harness proves must actually gate the
  // exit code. Previously providerConnected and the catalog were computed,
  // logged, written to the report - and ignored.
  const catalogOk = Array.isArray(catalogProviders) && catalogProviders.some((p) => (p?.modelCount ?? 0) > 0);
  const modelConfigOk = Array.isArray(modelConfig.value) && modelConfig.value.some((p) => (p?.model?.length ?? 0) > 0);
  const passed =
    bridgeOk &&
    siderPresent &&
    // An empty findings list satisfies `failures.length === 0`, so --no-surfaces
    // would otherwise buy a green gate by asserting nothing. Never pass on it.
    options.surfaces &&
    failures.length === 0 &&
    chat.ok !== false &&
    (key ? providerConnected === true && catalogOk && modelConfigOk : true);

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
    shellChoiceDismissed,
    surfacesWalked: options.surfaces,
    surfaces: findings,
    catalogOk,
    modelConfigOk,
    consoleErrorCount: consoleErrors.length,
    consoleErrors: consoleErrors.slice(0, 25),
  };
  fs.writeFileSync(path.join(reportDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(path.join(reportDir, 'app-output.log'), appOutput.join(''));
  log(`report written: ${path.join(reportDir, 'report.json')}`);

  if (!options.keepOpen) {
    await browser.close().catch(() => {});
    await shutdown(child);
  }

  log(passed ? 'PASS' : 'FAIL');
  return passed ? 0 : 1;
}

/**
 * Terminate the packaged app and wait for it to actually go. SIGTERM alone can
 * be ignored or merely slow, and the previous code exited the parent
 * immediately afterwards - leaving a live Electron process holding a provider
 * credential and an open CDP port.
 */
async function shutdown(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  const exited = new Promise((resolve) => child.once('exit', resolve));
  child.kill('SIGTERM');
  const timer = new Promise((resolve) => setTimeout(() => resolve('timeout'), 10_000));
  if ((await Promise.race([exited, timer])) === 'timeout') {
    child.kill('SIGKILL');
    await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, 3_000))]);
  }
}

// `child` is hoisted so the failure path can still reap it: previously every
// throw inside main() (no renderer page, a destroyed page context, a failed
// report write) left the packaged app running.
let launchedChild = null;
main()
  .then(async (code) => {
    process.exitCode = code;
  })
  .catch(async (error) => {
    console.error(`${TAG} failed:`, error);
    await shutdown(launchedChild);
    process.exitCode = 1;
  });
