/**
 * Red-team probe - extension iframe sandbox.
 *
 * Verifies the H2 fix in commit f0923bdc9 (and the related 9310d700b that
 * dropped allow-same-origin from srcDoc preview iframes). The ExtensionSettings
 * tab content and ExtensionSettingsPage both render the extension's HTML via
 * `<iframe sandbox='allow-scripts'>` - note the *absence* of
 * `allow-same-origin`. That combination assigns the iframe a unique opaque
 * origin so the embedded script:
 *   - cannot reach `parent.document` (cross-origin throw)
 *   - cannot navigate `top.location`
 *   - cannot set `document.domain` to coerce same-originness
 *   - cannot read host-page cookies
 * but
 *   - CAN postMessage to the parent (the designated cross-origin channel).
 *
 * Approach: build the iframe inside the renderer, point it at the harmless
 * fixture HTML under tests/e2e/fixtures/extensions/redteam.html (served via
 * wayland-asset://), and observe the postMessage results from the probe.
 *
 * The fixture itself contains no working exploits; every probe script tries a
 * vector and reports BLOCKED/BYPASSED - the assertions below treat any
 * BYPASSED as a P0 finding.
 */
import { test, expect } from '../fixtures';
import * as path from 'path';
import * as fs from 'fs';
import { toAssetUrl } from '@process/extensions/protocol/assetProtocol';

const FIXTURE_REL = 'tests/e2e/fixtures/extensions/redteam.html';

type ProbeMessage = {
  source: 'redteam-probe';
  probe: 'parent-document' | 'postmessage' | 'top-location' | 'document-domain' | 'document-cookie' | 'done';
  status: 'BLOCKED' | 'BYPASSED' | 'OK';
  detail?: string;
};

test.describe('Red-team: extension iframe sandbox (commits f0923bdc9 + 9310d700b)', () => {
  test('sandbox="allow-scripts" enforces unique-origin restrictions', async ({ page }) => {
    // Resolve the absolute path to the fixture from the project root so we
    // can hand it to the wayland-asset:// loader. We mint the absolute path
    // in the test context (Node fs is available here, just not in the
    // renderer).
    const projectRoot = path.resolve(__dirname, '../../..');
    const fixtureAbs = path.join(projectRoot, FIXTURE_REL);
    // Sanity: the fixture must exist before the renderer attempts to load
    // it - saves debugging a confused "BLOCKED at network" outcome.
    if (!fs.existsSync(fixtureAbs)) {
      throw new Error(`redteam fixture not found at ${fixtureAbs} - did the file get checked in?`);
    }

    // Load the fixture the way PRODUCTION loads extension HTML: through
    // wayland-asset://.
    //
    // The comment that used to sit here claimed this fixture was NOT under an
    // asset allowlist root. That was wrong. `fixtures.ts` sets
    // `wrapperDir = tests/e2e/fixtures/extensions` and puts it on
    // WAYLAND_EXTENSIONS_PATH; `getExtensionScanSources()` feeds exactly those
    // dirs into `buildAssetAllowlist()`. The fixture lives inside that dir, so
    // the protocol serves it.
    //
    // The old srcdoc approach could never work: a srcdoc frame inherits the
    // embedder's CSP, and the renderer CSP has no 'unsafe-inline'
    // (`buildRendererCsp`, src/index.ts), so the fixture's inline <script>
    // probe was refused and the spec proved NOTHING in either direction while
    // still failing loudly.
    const assetUrl = toAssetUrl(fixtureAbs);

    // Inject the iframe into the renderer and wait for the probe to finish.
    const results = await page.evaluate(async (frameSrc) => {
      return new Promise<unknown[]>((resolve) => {
        const messages: unknown[] = [];
        const handler = (evt: MessageEvent) => {
          const data = evt.data as { source?: string; probe?: string };
          if (data && data.source === 'redteam-probe') {
            messages.push(evt.data);
            if (data.probe === 'done') {
              window.removeEventListener('message', handler);
              if (iframe.parentElement) iframe.parentElement.removeChild(iframe);
              resolve(messages);
            }
          }
        };
        window.addEventListener('message', handler);

        // Build the iframe with the EXACT sandbox string the production code
        // uses for extension HTML (see ExtensionSettingsTabContent.tsx and
        // ExtensionSettingsPage.tsx - both `allow-scripts` only).
        const iframe = document.createElement('iframe');
        iframe.setAttribute('sandbox', 'allow-scripts');
        iframe.setAttribute('id', 'redteam-frame');
        iframe.style.position = 'absolute';
        iframe.style.left = '-9999px';
        iframe.style.width = '1px';
        iframe.style.height = '1px';
        iframe.src = frameSrc;
        document.body.appendChild(iframe);

        // Safety net: if the probe never reports `done`, time out so the
        // test doesn't hang the worker.
        setTimeout(() => {
          window.removeEventListener('message', handler);
          if (iframe.parentElement) iframe.parentElement.removeChild(iframe);
          resolve(messages);
        }, 5_000);
      });
    }, assetUrl);

    const messages = results as ProbeMessage[];
    const byProbe = new Map<string, ProbeMessage>();
    for (const m of messages) byProbe.set(m.probe, m);

    // The probe runner must have finished - otherwise we have an
    // inconclusive result.
    expect(byProbe.has('done'), 'redteam probe must run to completion').toBe(true);

    // ── Negative probes: every one of these must be BLOCKED ────────────
    for (const probe of ['parent-document', 'top-location'] as const) {
      const msg = byProbe.get(probe);
      expect(msg, `probe '${probe}' must have reported a result`).toBeDefined();
      expect(
        msg!.status,
        `probe '${probe}' must be BLOCKED - '${msg!.status}' with detail "${msg!.detail ?? ''}" is a P0 sandbox-escape finding`
      ).toBe('BLOCKED');
    }

    // document.domain and document.cookie: BLOCKED is the spec'd outcome
    // on a unique-origin frame, but browsers historically diverge on
    // whether they throw vs. silently return empty. Accept both.
    const cookieMsg = byProbe.get('document-cookie');
    expect(cookieMsg, 'document-cookie probe must have reported').toBeDefined();
    expect(
      cookieMsg!.status,
      'sandboxed iframe must not be able to read parent cookies'
    ).toBe('BLOCKED');

    const domainMsg = byProbe.get('document-domain');
    expect(domainMsg, 'document-domain probe must have reported').toBeDefined();
    expect(
      domainMsg!.status,
      'sandboxed iframe must not be able to coerce document.domain'
    ).toBe('BLOCKED');

    // ── Positive probe: postMessage must work (cross-origin allowed) ───
    const postMsg = byProbe.get('postmessage');
    expect(postMsg, 'postmessage probe must have reported').toBeDefined();
    expect(
      postMsg!.status,
      'postMessage MUST remain functional for extension <-> host communication'
    ).toBe('OK');
  });
});
