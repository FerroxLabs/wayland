#!/usr/bin/env bun
/**
 * E2E smoke test - verifies the Gemini retry-noise fix (commit d0f2fad1d).
 *
 * Connects to the running Wayland dev app via Chrome DevTools Protocol on
 * port 9230, snapshots the renderer DOM + console for a window after the
 * user (or this script) sends a Gemini prompt, and asserts:
 *
 *   1. The new main-process code path is live (console marker
 *      "[GeminiStream] aioncli-core retrying" or
 *      "[GeminiStream] aioncli-core invalid-stream" appears at least once
 *      when the model goes through an internal retry - OR the run is so
 *      clean that aioncli-core never retried, both are passes).
 *   2. NEITHER of the legacy user-facing strings
 *      "Invalid response stream detected" or
 *      "Request is being retried after a temporary failure"
 *      appears in the renderer DOM.
 *
 * Usage:
 *   bun run scripts/smoke-gemini-retry-noise.ts
 *
 * The script does NOT type into the conversation - that depends on having
 * an existing Gemini chat open with focus, which is fragile to automate.
 * Instead, it waits for you to drive the UI manually for ~30 seconds while
 * it watches. If no Gemini turn happens in that window, the result is
 * INCONCLUSIVE (not FAIL).
 */

const CDP_HOST = '127.0.0.1';
const CDP_PORT = 9230;
const WATCH_MS = 30_000;

const BAD_STRINGS = [
  'Invalid response stream detected',
  'Request is being retried after a temporary failure',
];
const GOOD_MARKERS = [
  '[GeminiStream] aioncli-core retrying',
  '[GeminiStream] aioncli-core invalid-stream',
];

interface PageInfo {
  id: string;
  title: string;
  type: string;
  url: string;
  webSocketDebuggerUrl: string;
}

async function getPage(): Promise<PageInfo> {
  const res = await fetch(`http://${CDP_HOST}:${CDP_PORT}/json/list`);
  const pages: PageInfo[] = await res.json();
  const renderer = pages.find((p) => p.type === 'page' && p.title === 'Wayland');
  if (!renderer) {
    throw new Error('No Wayland renderer page found at CDP port ' + CDP_PORT);
  }
  return renderer;
}

type CdpResponse = { id: number; result?: unknown; error?: { message: string } };
type CdpEvent = { method: string; params: Record<string, unknown> };

async function runSmoke() {
  console.log('[smoke] resolving Wayland renderer via CDP …');
  const page = await getPage();
  console.log(`[smoke] attached to "${page.title}" @ ${page.url}`);

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let nextId = 1;
  const pending = new Map<number, (r: CdpResponse) => void>();
  const consoleMessages: string[] = [];

  ws.addEventListener('message', (ev) => {
    const data = JSON.parse(String(ev.data));
    if ('id' in data) {
      const cb = pending.get(data.id);
      if (cb) {
        pending.delete(data.id);
        cb(data);
      }
    } else if ('method' in data) {
      const evt = data as CdpEvent;
      if (evt.method === 'Runtime.consoleAPICalled') {
        const args = (evt.params.args as Array<{ value?: unknown }>) ?? [];
        const text = args.map((a) => String(a.value ?? '')).join(' ');
        consoleMessages.push(text);
      }
    }
  });

  await new Promise<void>((resolve, reject) => {
    ws.addEventListener('open', () => resolve());
    ws.addEventListener('error', (e) => reject(new Error('ws error: ' + e)));
  });

  function send(method: string, params: Record<string, unknown> = {}): Promise<CdpResponse> {
    return new Promise((resolve) => {
      const id = nextId++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send('Runtime.enable');
  await send('Page.enable');

  console.log(`[smoke] watching for ${WATCH_MS / 1000}s - open a Gemini conversation and send any prompt now`);
  console.log('[smoke] (the script will report what it sees regardless of whether you act)');

  const start = Date.now();
  while (Date.now() - start < WATCH_MS) {
    await new Promise((r) => setTimeout(r, 1000));
    const elapsed = Math.round((Date.now() - start) / 1000);
    process.stdout.write(`\r[smoke] watching … ${elapsed}s elapsed, ${consoleMessages.length} console msgs captured`);
  }
  console.log('');

  // Pull DOM text for bad-string check
  const domResp = await send('Runtime.evaluate', {
    expression: 'document.body.innerText',
    returnByValue: true,
  });
  const domText = String(
    (domResp.result as { result?: { value?: string } })?.result?.value ?? ''
  );

  const foundBad = BAD_STRINGS.filter((s) => domText.includes(s));
  const foundMarkers = GOOD_MARKERS.filter((m) => consoleMessages.some((c) => c.includes(m)));

  console.log('');
  console.log('=== RESULT ===');
  console.log(`renderer DOM length: ${domText.length} chars`);
  console.log(`bad strings in DOM (should be 0): ${foundBad.length}`);
  for (const s of foundBad) console.log(`  ❌ "${s}"`);
  console.log(`good console markers (>=0 expected): ${foundMarkers.length}`);
  for (const m of foundMarkers) console.log(`  ✅ "${m}"`);
  console.log(`total console messages captured: ${consoleMessages.length}`);

  if (foundBad.length > 0) {
    console.log('');
    console.log('🔴 FAIL - legacy retry-noise strings still appear in the UI');
    process.exit(1);
  }

  if (foundMarkers.length === 0) {
    console.log('');
    console.log('🟡 INCONCLUSIVE - no aioncli-core retry events fired during the watch window');
    console.log('   (either the model never retried, or no Gemini turn was sent)');
    console.log('   The DOM is clean of legacy strings, so the fix is structurally OK,');
    console.log('   but we did not directly observe the new code path.');
    process.exit(0);
  }

  console.log('');
  console.log('🟢 PASS - new code path observed, no legacy strings in DOM');
  process.exit(0);
}

runSmoke().catch((err) => {
  console.error('[smoke] FATAL:', err);
  process.exit(2);
});
