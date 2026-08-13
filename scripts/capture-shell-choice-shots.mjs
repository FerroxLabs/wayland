#!/usr/bin/env node
/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Regenerate the Classic / Cockpit preview images used by the shell chooser
 * (Settings > Navigation, first-run onboarding, and the one-time prompt for
 * existing installs).
 *
 * These images are PRODUCT ASSETS and ship in the bundle, so they must never be
 * captured from a real profile: a developer's own screenshot carries their
 * display name and their conversation titles. This script drives a throwaway
 * dev profile that has no chats and no account, which is also the honest thing
 * to show — the difference between the two shells is the navigation structure,
 * and an empty profile shows exactly that and nothing else.
 *
 * Usage (from the repo root, with a dev server NOT already running):
 *
 *   node scripts/capture-shell-choice-shots.mjs
 *
 * It expects the app to already be up on the capture profile:
 *
 *   WAYLAND_DEV_PROFILE=Wayland-Shots WAYLAND_CDP_PORT=9231 npx electron-vite dev
 *
 * Re-run this whenever either shell's navigation changes. A stale pair is worse
 * than none: it promises the user a layout the app no longer has.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const PORT = process.env.WAYLAND_CDP_PORT || '9231';
const OUT_DIR = resolve(process.cwd(), 'src/renderer/assets/shell-choice');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function pageWs() {
  const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
  if (!page) throw new Error(`no page target on :${PORT} — is the capture profile running?`);
  return page.webSocketDebuggerUrl;
}

let seq = 0;
function send(ws, method, params = {}) {
  const id = ++seq;
  return new Promise((res, rej) => {
    const onMsg = (ev) => {
      const m = JSON.parse(typeof ev.data === 'string' ? ev.data : ev.data.toString());
      if (m.id !== id) return;
      ws.removeEventListener('message', onMsg);
      m.error ? rej(new Error(`${method}: ${JSON.stringify(m.error)}`)) : res(m.result);
    };
    ws.addEventListener('message', onMsg);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

const evaluate = async (ws, expression) => {
  const r = await send(ws, 'Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'evaluate failed');
  return r.result.value;
};

/**
 * Find the Classic / Cockpit segmented control in Settings > Navigation and
 * return the centre of the requested option. We drive the real control rather
 * than importing the writer module or poking storage, so the capture goes
 * through exactly the path a user's click does.
 */
const FIND_SHELL_BUTTON = (label) => `
  (() => {
    const el = [...document.querySelectorAll('*')]
      .filter((e) => e.children.length === 0 && new RegExp('^' + ${JSON.stringify(label)} + '$', 'i').test((e.textContent || '').trim()))
      .pop();
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) });
  })()
`;

async function click(ws, x, y) {
  for (const type of ['mousePressed', 'mouseReleased']) {
    await send(ws, 'Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
    await sleep(40);
  }
}

/** Switch shells via Settings > Navigation, the way a user would. */
async function setShell(ws, label) {
  await evaluate(ws, "location.hash = '#/settings/navigation'; 'nav'");
  await sleep(2500);
  const found = await evaluate(ws, FIND_SHELL_BUTTON(label));
  if (!found) throw new Error(`could not find the "${label}" option in Settings > Navigation`);
  const { x, y } = JSON.parse(found);
  await click(ws, x, y);
  await sleep(2500);
}

async function capture(ws, name) {
  // `clip` fixes the captured REGION to the layout viewport (so the frame is
  // always the whole window and never a scrolled fragment), but note the output
  // still comes back at the display's devicePixelRatio — clip.scale does not
  // override DPR. On a retina machine that means ~2400px wide for a ~400px card.
  // That is deliberate: these are the only two hero images in the bundle and
  // crisp beats small. Forcing 1x would mean setDeviceMetricsOverride, which
  // resizes the real viewport and risks baking a clipped layout into the asset.
  const size = JSON.parse(
    await evaluate(ws, 'JSON.stringify({ w: window.innerWidth, h: window.innerHeight })')
  );
  const shot = await send(ws, 'Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: 0, width: size.w, height: size.h, scale: 1 },
  });
  const out = resolve(OUT_DIR, `${name}.png`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, Buffer.from(shot.data, 'base64'));
  console.log(`wrote ${out} (${size.w}x${size.h})`);
}

async function main() {
  const ws = new WebSocket(await pageWs());
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = (e) => rej(new Error(String(e.message || e)));
  });

  // Guard the privacy contract: these frames ship, so refuse to capture from a
  // profile that carries a real person's data. Poll until the home screen has
  // actually rendered — reading too early reports "no history" as "history",
  // which is the wrong way round for a guard to fail.
  await evaluate(ws, "location.hash = '#/guid'; 'nav'");
  let audit = null;
  for (let i = 0; i < 15; i++) {
    await sleep(1000);
    audit = JSON.parse(
      await evaluate(
        ws,
        `JSON.stringify({
           rendered: /(Good (morning|afternoon|evening)|Welcome back)/.test(document.body.innerText),
           greeting: (document.body.innerText.match(/(Good (morning|afternoon|evening)|Welcome back)[^\\n]*/) || ['none'])[0],
           empty: document.body.innerText.includes('No chat history'),
         })`
      )
    );
    if (audit.rendered) break;
  }
  if (!audit?.rendered) throw new Error('home screen never rendered — cannot audit the capture profile');
  console.log(`greeting: ${audit.greeting}`);
  if (!audit.empty) {
    throw new Error('capture profile has chat history — refusing to bake real conversation titles into a shipped asset');
  }

  for (const [shell, label] of [
    ['classic', 'Classic'],
    ['cockpit', 'Cockpit preview'],
  ]) {
    await setShell(ws, label);
    await evaluate(ws, "location.hash = '#/guid'; 'nav'");
    await sleep(4000); // let the shell root swap and settle before the frame
    await capture(ws, shell);
  }

  // Leave the capture profile on Classic so a re-run starts from the default.
  await setShell(ws, 'Classic');
  ws.close();
  console.log('done');
}

main().catch((e) => {
  console.error('ERR', e.message);
  process.exit(1);
});
