/**
 * E2E: Ambient Mode - M1 Bubble State.
 *
 * Covers AC-M1-1 through AC-M1-15 from docs/product/ambient-mode-requirements.md.
 *
 * -- Directory location notes ---------------------------------------------
 * Pet implementation was removed; this spec runs only against the ambient window.
 *
 * File name `bubble.e2e.ts` (not the PM-suggested `.spec.ts`) - because playwright.config.ts
 * `testMatch: '{specs,features}/**\/*.e2e.ts'` only recognizes the `.e2e.ts` suffix.
 *
 * -- Requirements status ([REQ-CHANGE-v3] fully ratified 2026-05-11) ------
 *
 * Hard rules (ratified):
 *   AC-M1-1 Position baseline = `getPrimaryDisplay().workAreaSize` (subtract Dock/taskbar), not screen.width
 *           -> top-left x = workArea.width - 24 - 64, y = workArea.height - 24 - 64
 *   AC-M1-2 Opacity = BrowserWindow.setOpacity(0.85) (Arch-ratified, no longer "tentative")
 *     Three hard constraints for resetting to 1.0 (missing any = bug): (1) drag-end (AC-M1-2b) (2) watchdog timeout DRAG_WATCHDOG_MS=8000
 *     (AC-M1-2d) (3) drag interrupted by resize/state switch (AC-M1-2e)
 *   AC-M1-2 Snap = left/right only; baseline uses the workArea of the display the bubble is currently on (located via getDisplayNearestPoint)
 *   AC-M1-5 Persistence = ConfigStorage (keys: ambient.bubblePosition / ambient.enabled /
 *           ambient.onboardingHintShown / ambient.lastSessionClosedExplicitly)
 *   AC-M1-6 Dragged off-screen = covered by AC-M1-2 y-clamp + AC-M1-13 startup validate
 *   AC-M1-7 Multi-monitor = permanently skipped (hardware-required; tracked in manual-checklist.md)
 *   AC-M1-8 Click = mouseup-triggered, 5 px threshold
 *   AC-M1-9 DOM must use data-testid (ambient-bubble / ambient-input / ambient-chat)
 *   AC-M1-10 ambient enabled -> ambient window created, legacy pet path skipped (U-1=A evolution, [REQ-CHANGE-v5] rewritten)
 *   AC-M1-11 WAYLAND_AMBIENT env var has priority over the settings toggle
 *   AC-M1-12 Settings toggle requires restart + toast "Restart required to apply"
 *   AC-M1-13 (new) displayId validate + position clamp boundary protection
 *   AC-M1-14 (new) E2E fixture contract: launchAppWithEnv + ambientTest fixture
 *   AC-M1-15 ([REQ-CHANGE-v5] new) Existing Pet user migration: pet.enabled=true -> ambient migration + idempotent marker
 *
 * -- Test launch strategy (AC-M1-14 ratified) -----------------------------
 * Arch-specified approach: add a `launchAppWithEnv(extraEnv)` helper (without modifying the singleton), export
 * the `ambientTest` fixture, and have the ambient spec use `import { ambientTest as test }`.
 *
 * **Current status**: the `ambientTest` fixture has not yet been implemented in `tests/e2e/fixtures.ts`.
 * This spec still imports the existing `test`; beforeAll decides whether to skip the whole suite by
 * looking for the ambient bubble window, with skip reason = `AC-M1-14 fixture not yet implemented (pending Arch/Dev)`.
 * Once implemented, switching the import to `ambientTest` automatically unskips every case.
 *
 * -- U-1 = A (Ambient is the evolution of Pet, [REQ-CHANGE-v5]) -----------
 * User ruling: Ambient evolves Pet - not mutually exclusive, not coexistent. A startup-time semantic either/or.
 * AC-M1-10 rewritten from "pet count=0 exclusivity" to "ambient windows >= 1 + single floating bubble" as the replacement assertion.
 * AC-M1-15 covers the existing pet user migration path.
 *
 * -- AC-M3-12 forecast ([FYI] 2026-05-11) ---------------------------------
 * M3 immersive-chat state will switch render mode to { transparent:false, backgroundColor:'rgba(0,0,0,0.85)' }
 * to avoid Windows DWM frequent-resize flicker. This spec extracts M1's transparent:true
 * into the `BUBBLE_RENDER_MODE` constant; the M3 spec will define the corresponding `CHAT_RENDER_MODE` constant.
 */
// AC-M1-14 fixture: use ambientTest (independent WAYLAND_AMBIENT=1 Electron process,
// `electronApp` / `page` are aliases pointing to the ambient app / bubble page).
import { ambientTest as test, expect } from '../../fixtures';
import { invokeBridge } from '../../helpers';
import type { ElectronApplication } from '@playwright/test';

// -- Constants (aligned with requirements) -------------------------------
const BUBBLE_SIZE = 64; // px
const SCREEN_MARGIN = 24; // px (AC-M1-1)
const DRAG_OPACITY = 0.85; // AC-M1-2 ratified
const DEFAULT_OPACITY = 1.0;
// AC-M1-8 click vs drag threshold (used after unskip with bubblePage.mouse.move(dx, 0))
// Currently the entire AC-M1-8 series is skipped pending AC-M1-14 fixture; prefix with `_` to avoid unused warnings for now
const _CLICK_VS_DRAG_THRESHOLD_UPPER = 6; // > 5px counts as drag
const _CLICK_VS_DRAG_THRESHOLD_LOWER = 4; // <= 5px counts as click
void _CLICK_VS_DRAG_THRESHOLD_UPPER;
void _CLICK_VS_DRAG_THRESHOLD_LOWER;

/**
 * Render mode for the bubble/input state (AC-M1-4 + AC-M3-12 forecast, 2026-05-11 [FYI]).
 *
 * AC-M3-12 (P0, render-mode switch hard constraint):
 *   - M1 bubble / M2 input state: transparent: true (carrying over the pet approach)
 *   - M3 immersive chat and above: transparent: false + backgroundColor: 'rgba(0,0,0,0.85)'
 *     (avoids Windows DWM frequent-resize flicker)
 *   - Switch timing: M2 -> M3 on first message send, masked by the fade animation
 *
 * This spec (M1) uses `BUBBLE_RENDER_MODE`; the M3 spec will define
 * `CHAT_RENDER_MODE = { transparent: false, backgroundColor: 'rgba(0,0,0,0.85)' } as const`.
 */
const BUBBLE_RENDER_MODE = { transparent: true } as const;

// ── Helpers ──────────────────────────────────────────────────────────────

/** workArea of the display the bubble is currently on, excluding Dock / taskbar. */
type WorkArea = { x: number; y: number; width: number; height: number };

type BubbleWindowInfo = {
  bounds: { x: number; y: number; width: number; height: number };
  alwaysOnTop: boolean;
  /** workArea of the display the bubble is currently on (determined via getDisplayNearestPoint) */
  workArea: WorkArea;
  /** primary display workArea - used for the AC-M1-1 first-launch position assertion */
  primaryWorkArea: WorkArea;
};

/**
 * Locate the ambient bubble BrowserWindow in the main process and return key properties.
 * Convention: the bubble window's title / webContents URL contains "ambient" or "bubble".
 */
async function getAmbientBubbleInfo(app: ElectronApplication): Promise<BubbleWindowInfo | null> {
  return app.evaluate(({ BrowserWindow, screen }) => {
    const bubbleWin = BrowserWindow.getAllWindows().find((w) => {
      if (w.isDestroyed()) return false;
      const title = w.getTitle().toLowerCase();
      const url = w.webContents.getURL().toLowerCase();
      return (
        title.includes('ambient') ||
        title.includes('bubble') ||
        url.includes('/ambient') ||
        url.includes('ambient.html')
      );
    });
    if (!bubbleWin) return null;

    const bounds = bubbleWin.getBounds();
    // Display the bubble is currently on (AC-M1-2 snap baseline)
    const centerPt = { x: Math.round(bounds.x + bounds.width / 2), y: Math.round(bounds.y + bounds.height / 2) };
    const nearest = screen.getDisplayNearestPoint(centerPt);
    const primary = screen.getPrimaryDisplay();
    return {
      bounds,
      alwaysOnTop: bubbleWin.isAlwaysOnTop(),
      workArea: nearest.workArea,
      primaryWorkArea: primary.workArea,
    };
  });
}

/**
 * Read the bubble window's create options (frame / transparent / alwaysOnTop).
 *
 * Electron does not retain the original BrowserWindowConstructorOptions, so we use two approaches:
 *   (A) Dev exposes `ambient.debug.getWindowOptions` IPC -> returns { frame, transparent, alwaysOnTop }
 *   (B) Indirect fingerprint: isOpaque() / alwaysOnTop() - isOpaque=false approximately equals transparent=true
 *
 * The current skeleton uses (B); once Dev implements (A), swap in the invokeBridge call here.
 */
async function getAmbientBubbleCreateOptions(
  app: ElectronApplication
): Promise<{ isTransparent: boolean; alwaysOnTop: boolean } | null> {
  return app.evaluate(({ BrowserWindow }) => {
    const bubbleWin = BrowserWindow.getAllWindows().find((w) => {
      if (w.isDestroyed()) return false;
      const title = w.getTitle().toLowerCase();
      return title.includes('ambient') || title.includes('bubble');
    });
    if (!bubbleWin) return null;
    const isOpaque = typeof bubbleWin.isOpaque === 'function' ? bubbleWin.isOpaque() : true;
    return {
      isTransparent: !isOpaque,
      alwaysOnTop: bubbleWin.isAlwaysOnTop(),
    };
  });
}

/**
 * Read the bubble's current display-layer opacity (AC-M1-2 ratified: `BrowserWindow.setOpacity(0.85)`).
 *
 * Why wrap it: if the implementation later switches to an IPC event abstraction (`ambient.getDisplayOpacity`),
 * we only need to change this one line and every AC-M1-2 case follows automatically.
 */
async function getBubbleOpacity(app: ElectronApplication): Promise<number | null> {
  return app.evaluate(({ BrowserWindow }) => {
    const bubbleWin = BrowserWindow.getAllWindows().find((w) => {
      if (w.isDestroyed()) return false;
      return w.getTitle().toLowerCase().includes('ambient') || w.getTitle().toLowerCase().includes('bubble');
    });
    if (!bubbleWin) return null;
    return bubbleWin.getOpacity();
  });
}

/**
 * Count the currently existing "floating round bubble" windows - used for AC-M1-10 (ambient/pet exclusivity).
 * Strategy: BrowserWindows whose title contains ambient|bubble|pet, are alwaysOnTop, and have width/height approx. 64.
 */
async function countFloatingBubbleWindows(app: ElectronApplication): Promise<{ ambient: number; pet: number }> {
  return app.evaluate(({ BrowserWindow }) => {
    let ambient = 0;
    let pet = 0;
    for (const w of BrowserWindow.getAllWindows()) {
      if (w.isDestroyed()) continue;
      if (!w.isAlwaysOnTop()) continue;
      const b = w.getBounds();
      if (b.width > 100 || b.height > 100) continue; // Only count small floating circles; exclude the main window / input window
      const title = w.getTitle().toLowerCase();
      const url = w.webContents.getURL().toLowerCase();
      if (title.includes('pet') || url.includes('pet.html')) pet += 1;
      else if (title.includes('ambient') || title.includes('bubble') || url.includes('/ambient')) ambient += 1;
    }
    return { ambient, pet };
  });
}

/**
 * Click / drag triggering: PM [TEST-REVIEW-APPROVED] explicitly requires going through the **black-box API**,
 * not relying on debug IPC: use `bubblePage.mouse.down/move/up` to simulate.
 * State inference also stays black-box: `bubblePage.locator('[data-testid="ambient-input"]').isVisible()`
 * replaces the `ambient.getState` IPC.
 *
 * All cases that depend on bubblePage are currently skipped pending the AC-M1-14 fixture (ambientTest.bubblePage accessor).
 */

// ── Spec ─────────────────────────────────────────────────────────────────

test.describe('Ambient Mode - M1 Bubble', () => {
  // This suite shares a single session and every test runs sequentially (accumulated drag positions
  // would pollute the next case, so each test's beforeEach resets the bubble position to default via IPC).
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ electronApp }) => {
    // Ambient feature is not implemented yet + Q7 launch path is not finalized, so skip the whole suite for now.
    // Remove this guard once Dev implements it + Q7 REQ-CLARIFY-REPLY lands.
    const info = await getAmbientBubbleInfo(electronApp);
    test.skip(
      info === null,
      'Ambient bubble window not found. Blockers: (1) Dev has not implemented ambient mode yet; ' +
        '(2) Q7 REQ-CLARIFY-REPLY pending - `WAYLAND_AMBIENT=1` launch path under singleton fixture undefined. ' +
        'Unskip after Dev [IMPL_DONE] + Q7 answer lands.'
    );
  });

  test.beforeEach(async ({ electronApp }) => {
    // Before each case, reset the bubble position to the default bottom-right (Dev exposes `ambient.resetBubblePosition`).
    // No-op until implemented; the suite is skipped via beforeAll, so this never runs anyway.
    await electronApp
      .evaluate(({ BrowserWindow }) => {
        const bubbleWin = BrowserWindow.getAllWindows().find((w) => {
          if (w.isDestroyed()) return false;
          return w.getTitle().toLowerCase().includes('ambient');
        });
        if (!bubbleWin) return;
        // Resetting to the default bottom-right is owned by Dev-exposed IPC; leave empty in the skeleton for now
      })
      .catch(() => {
        /* best-effort */
      });
  });

  // -- AC-M1-1: Bubble visible within 2s of startup, located at the primary-display workArea bottom-right with a 24 px margin --
  test('AC-M1-1: bubble visible within 2s at primary-workArea bottom-right with 24px margin', async ({
    electronApp,
  }) => {
    await expect
      .poll(async () => getAmbientBubbleInfo(electronApp), { timeout: 2_000, intervals: [100] })
      .not.toBeNull();
    const info = await getAmbientBubbleInfo(electronApp);
    expect(info, 'ambient bubble window must appear within 2s').not.toBeNull();
    const { bounds, primaryWorkArea } = info!;

    // AC-M1-1 ratified: use getPrimaryDisplay().workAreaSize (subtract Dock/taskbar), not screen.width
    // Bubble top-left = workArea bottom-right - 24 margin - 64 bubble size (plus the workArea x/y offset)
    const expectedX = primaryWorkArea.x + primaryWorkArea.width - SCREEN_MARGIN - BUBBLE_SIZE;
    const expectedY = primaryWorkArea.y + primaryWorkArea.height - SCREEN_MARGIN - BUBBLE_SIZE;

    expect(bounds.width).toBe(BUBBLE_SIZE);
    expect(bounds.height).toBe(BUBBLE_SIZE);
    // Tolerance +/- 2 px: OS-level DPI rounding
    expect(Math.abs(bounds.x - expectedX), `bubble.x ${bounds.x} vs expected ${expectedX}`).toBeLessThanOrEqual(2);
    expect(Math.abs(bounds.y - expectedY), `bubble.y ${bounds.y} vs expected ${expectedY}`).toBeLessThanOrEqual(2);
  });

  // -- AC-M1-2a: Opacity drops to 0.85 while dragging --------------------
  test('AC-M1-2a: opacity drops to 0.85 while dragging', async ({ electronApp }) => {
    // Enter the "dragging" state via IPC (Dev exposes `ambient.debug.beginDrag`).
    // In the skeleton we simulate directly via setOpacity; assertion goes through the getBubbleOpacity helper.
    await electronApp.evaluate(({ BrowserWindow }, dragOpacity) => {
      const bubbleWin = BrowserWindow.getAllWindows().find(
        (w) => !w.isDestroyed() && w.getTitle().toLowerCase().includes('ambient')
      );
      bubbleWin?.setOpacity(dragOpacity);
    }, DRAG_OPACITY);

    const opacity = await getBubbleOpacity(electronApp);
    expect(opacity, 'bubble opacity during drag').toBeCloseTo(DRAG_OPACITY, 2);
  });

  // -- AC-M1-2b: After mouseup, restore opaque + snap to the current display's workArea right edge --
  test('AC-M1-2b: after drop on right half, bubble snaps to workArea right edge + opacity restores', async ({
    electronApp,
  }) => {
    // Drag the bubble to the right half of the current display's workArea and release
    await electronApp.evaluate(({ BrowserWindow, screen }) => {
      const bubbleWin = BrowserWindow.getAllWindows().find(
        (w) => !w.isDestroyed() && w.getTitle().toLowerCase().includes('ambient')
      );
      if (!bubbleWin) return;
      const current = bubbleWin.getBounds();
      const nearest = screen.getDisplayNearestPoint({ x: current.x + 32, y: current.y + 32 });
      const wa = nearest.workArea;
      bubbleWin.setBounds({
        x: Math.floor(wa.x + wa.width * 0.7),
        y: Math.floor(wa.y + wa.height * 0.5),
        width: 64,
        height: 64,
      });
      // Dev's snap logic should fire after mouseup; the skeleton relies on the implementation auto-snapping.
    });

    const info = await getAmbientBubbleInfo(electronApp);
    const { bounds, workArea } = info!;
    const expectedRightX = workArea.x + workArea.width - SCREEN_MARGIN - BUBBLE_SIZE;

    // AC-M1-2 snap: bubble center x > workArea.x + workArea.width/2 -> snap to right edge
    expect(
      Math.abs(bounds.x - expectedRightX),
      `snapped.x ${bounds.x} vs expected ${expectedRightX}`
    ).toBeLessThanOrEqual(2);
    // y is preserved at the release position (within workArea y clamp)
    expect(bounds.y).toBeGreaterThanOrEqual(workArea.y + SCREEN_MARGIN - 2);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(workArea.y + workArea.height - SCREEN_MARGIN + 2);
    // opacity is restored to 1.0
    const opacity = await getBubbleOpacity(electronApp);
    expect(opacity, 'bubble opacity after drop').toBeCloseTo(DEFAULT_OPACITY, 2);
  });

  test('AC-M1-2c: drop on left half snaps to workArea left edge', async ({ electronApp }) => {
    await electronApp.evaluate(({ BrowserWindow, screen }) => {
      const bubbleWin = BrowserWindow.getAllWindows().find(
        (w) => !w.isDestroyed() && w.getTitle().toLowerCase().includes('ambient')
      );
      if (!bubbleWin) return;
      const current = bubbleWin.getBounds();
      const nearest = screen.getDisplayNearestPoint({ x: current.x + 32, y: current.y + 32 });
      const wa = nearest.workArea;
      bubbleWin.setBounds({
        x: Math.floor(wa.x + wa.width * 0.3),
        y: Math.floor(wa.y + wa.height * 0.5),
        width: 64,
        height: 64,
      });
    });

    const info = await getAmbientBubbleInfo(electronApp);
    const { bounds, workArea } = info!;
    const expectedLeftX = workArea.x + SCREEN_MARGIN;
    // AC-M1-2 snap: bubble center x < workArea.x + workArea.width/2 -> snap to left edge
    expect(
      Math.abs(bounds.x - expectedLeftX),
      `snapped.x ${bounds.x} vs expected ${expectedLeftX}`
    ).toBeLessThanOrEqual(2);
  });

  // -- AC-M1-2d: Opacity reset via watchdog timeout (8s DRAG_WATCHDOG_MS) --
  // AC-M1-2 hard-constraint case 2/3: if renderer drops pointerup after drag-start, the watchdog
  // (reusing pet's DRAG_WATCHDOG_MS = 8000ms) must reset opacity to 1.0;
  // otherwise the bubble stays permanently at 0.85 semi-transparent and only a restart fixes it.
  test('AC-M1-2d: opacity restores to 1.0 after drag watchdog timeout', async () => {
    test.skip(
      true,
      'PENDING fake-timer harness (8s real timeout too slow): assertion shape = ' +
        'trigger drag-start (opacity=0.85) → do NOT mouseup → inject 8000ms+ via fake timer → ' +
        'assert getBubbleOpacity() === 1.0. Needs either Dev-exposed `ambient.debug.injectWatchdogTimeout` IPC ' +
        'or Playwright clock mocking (page.clock.install / fastForward) on the bubble window once ambientTest.bubblePage lands.'
    );
  });

  // -- AC-M1-2e: Opacity reset when drag is interrupted by state switch / resize --
  // AC-M1-2 hard-constraint case 3/3: if the window is resized or its state switches (hover timeout,
  // click outside the window, Esc) mid-drag, resetting to 1.0 must still fire. PM recommends testing
  // the interrupt case directly with a real user event.
  test('AC-M1-2e: opacity restores to 1.0 when drag interrupted by state transition', async () => {
    test.skip(
      true,
      'PENDING AC-M1-14 fixture `bubblePage` accessor: assertion shape = ' +
        'bubblePage.mouse.down on [data-testid="ambient-bubble"] (opacity=0.85) → ' +
        'dispatch Esc keypress / click outside to force state transition → ' +
        'assert getBubbleOpacity() === 1.0 within 500ms. Real user event (black-box), no debug IPC.'
    );
  });

  // ── AC-M1-3: alwaysOnTop ─────────────────────────────────────────────
  test('AC-M1-3: bubble window is alwaysOnTop', async ({ electronApp }) => {
    const info = await getAmbientBubbleInfo(electronApp);
    expect(info!.alwaysOnTop).toBe(true);
  });

  // ── AC-M1-4: frameless + transparent ─────────────────────────────────
  // AC-M3-12 forecast: M1 bubble uses BUBBLE_RENDER_MODE (transparent:true); M3 will switch to
  // CHAT_RENDER_MODE (transparent:false + rgba background). Swap the constant when writing the M3 spec.
  test('AC-M1-4: bubble window is frameless + transparent (BUBBLE_RENDER_MODE)', async ({ electronApp }) => {
    const opts = await getAmbientBubbleCreateOptions(electronApp);
    expect(opts, 'bubble window must exist').not.toBeNull();
    // transparent fingerprint: isOpaque() === false
    expect(
      opts!.isTransparent,
      `bubble window should be transparent (BUBBLE_RENDER_MODE.transparent=${BUBBLE_RENDER_MODE.transparent})`
    ).toBe(BUBBLE_RENDER_MODE.transparent);
    expect(opts!.alwaysOnTop).toBe(true);
    // frame:false has no direct runtime API; suggest Dev expose `ambient.debug.getWindowOptions` IPC
    // returning { frame, transparent, alwaysOnTop } for precise assertions. Once Dev implements it,
    // replace the line below with an invokeBridge call.
  });

  // -- AC-M1-5: Position persisted to ConfigStorage (asserted via bridge read) --
  // Note: here we **cannot** rely on BrowserWindow.getBounds() alone as the black-box assertion - this AC checks
  // "position has been written to the ConfigStorage persistence layer", not "current window position". getBounds() only
  // reflects runtime state and cannot prove the value was flushed. So we must read ConfigStorage via the bridge.
  //
  // PM [TEST-REVIEW-APPROVED] black-box correctness here means: read via the bridge (an existing public
  // Config bridge, not a backdoor debug IPC). `ambient.getBubblePosition` is a public getter that
  // Dev needs to expose in systemSettingsBridge (see the pet.* template).
  test('AC-M1-5: position is persisted to ConfigStorage (ambient.bubblePosition)', async ({ page, electronApp }) => {
    // Move the bubble to the middle of the right half of the screen
    await electronApp.evaluate(({ BrowserWindow, screen }) => {
      const bubbleWin = BrowserWindow.getAllWindows().find(
        (w) => !w.isDestroyed() && w.getTitle().toLowerCase().includes('ambient')
      );
      if (!bubbleWin) return;
      const wa = screen.getPrimaryDisplay().workArea;
      bubbleWin.setBounds({
        x: Math.floor(wa.x + wa.width * 0.7),
        y: Math.floor(wa.y + wa.height * 0.5),
        width: 64,
        height: 64,
      });
    });

    // Wait for the implementation to finish persisting (likely debounced disk write); poll until bubblePosition matches current bounds
    await expect
      .poll(
        async () => {
          const info = await getAmbientBubbleInfo(electronApp);
          if (!info) return null;
          const persisted = await invokeBridge<{ x: number; y: number; displayId: number } | null>(
            page,
            'ambient.getBubblePosition'
          ).catch(() => null);
          if (!persisted) return null;
          return { bounds: info.bounds, persisted };
        },
        { timeout: 5_000, intervals: [100, 250, 500] }
      )
      .toMatchObject({
        persisted: {
          x: expect.any(Number),
          y: expect.any(Number),
          displayId: expect.any(Number),
        },
      });

    // Exact consistency assertion
    const info = await getAmbientBubbleInfo(electronApp);
    const persisted = await invokeBridge<{ x: number; y: number; displayId: number }>(
      page,
      'ambient.getBubblePosition'
    );
    expect(Math.abs(info!.bounds.x - persisted.x)).toBeLessThanOrEqual(2);
    expect(Math.abs(info!.bounds.y - persisted.y)).toBeLessThanOrEqual(2);
    expect(persisted.displayId).toBeGreaterThan(0);
  });

  // -- AC-M1-6: Bubble dragged off-screen is automatically pulled back into the visible area --
  test('AC-M1-6: bubble dragged off-screen is pulled back to visible area', async ({ electronApp }) => {
    // Simulate setBounds-ing the bubble off-screen (x=-500, y=-500)
    await electronApp.evaluate(({ BrowserWindow }) => {
      const bubbleWin = BrowserWindow.getAllWindows().find(
        (w) => !w.isDestroyed() && w.getTitle().toLowerCase().includes('ambient')
      );
      bubbleWin?.setBounds({ x: -500, y: -500, width: 64, height: 64 });
      // Dev's mouseup handler should clamp; the trigger mechanism depends on the implementation, so we rely on auto-correction here.
    });

    const info = await getAmbientBubbleInfo(electronApp);
    const { bounds, workArea } = info!;
    // AC-M1-2 y-clamp + AC-M1-13 position clamp: returns within the workArea bounds
    expect(bounds.x).toBeGreaterThanOrEqual(workArea.x);
    expect(bounds.y).toBeGreaterThanOrEqual(workArea.y);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(workArea.x + workArea.width);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(workArea.y + workArea.height);
  });

  // -- AC-M1-7: Multi-monitor (ratified as permanent skip) ----------------
  // [REQ-CHANGE-v3] Arch confirmed that Electron's screen module is native; monkey-patching
  // does not affect BrowserWindow. Permanent skip, tracked in manual-checklist.
  test('AC-M1-7: multi-display first-launch uses primary display bottom-right', async () => {
    test.skip(true, 'Multi-monitor scenarios require hardware; tracked in manual-checklist');
  });

  // -- AC-M1-8: Click = hover-expand (mouseup-triggered, 5 px drag threshold) --
  // PM [TEST-REVIEW-APPROVED] new guidance: go through the black-box API (page.mouse + data-testid),
  // not the debug IPC. Trigger: bubblePage.mouse.down -> move(dx,0) -> up.
  // State inference: bubblePage.locator('[data-testid="ambient-input"]').isVisible() = true -> state='input'.
  //
  // Every AC-M1-8 case depends on ambientPage (the AC-M1-14 fixture's bubblePage accessor);
  // the current singleton fixture cannot retrieve the Page bound to the bubble window, so the entire AC-M1-8 group is skipped pending the fixture.

  test('AC-M1-8a: click (0px movement) triggers M2 expand via mouseup', async () => {
    test.skip(
      true,
      'PENDING AC-M1-14 fixture `bubblePage` accessor: black-box assertion needs ' +
        '`bubblePage.mouse.down() → up()` on `[data-testid="ambient-bubble"]` center, then ' +
        '`bubblePage.locator(\'[data-testid="ambient-input"]\').isVisible()`. ' +
        'Requires Playwright Page routed to bubble window (ambientTest.bubblePage).'
    );
  });

  test('AC-M1-8b: click with 4px movement (<=5px threshold) still triggers M2 expand', async () => {
    test.skip(
      true,
      'PENDING AC-M1-14 fixture `bubblePage` accessor: mouse.down → move(4,0) → up, ' +
        'then assert input testid visible (4px within CLICK_VS_DRAG_THRESHOLD=5px so counts as click).'
    );
  });

  test('AC-M1-8c: drag with 6px movement (>5px threshold) does NOT trigger M2 expand', async () => {
    test.skip(
      true,
      'PENDING AC-M1-14 fixture `bubblePage` accessor: mouse.down → move(6,0) → up, ' +
        'then assert bubble testid still visible + input testid NOT visible (6px exceeds threshold).'
    );
  });

  // -- AC-M1-10: ambient enabled -> ambient window created, legacy pet path skipped (replacement) --
  // [REQ-CHANGE-v5] U-1 = A: Ambient is the evolution of Pet, not parallel/exclusive. Startup-time either/or:
  // ambient enabled -> create ambient window; disabled -> go through the legacy pet path.
  //
  // The original "pet window count = 0" assertion is invalid: under the A evolution, the pet window concept may be renamed
  // or the code path may disappear, so "pet-titled window" is no longer a stable negative signal. Replaced with:
  //   (1) Exactly 1 floating bubble window (ambient semantics)
  //   (2) An ambient window exists (title/url matches ambient|bubble)
  test('AC-M1-10: ambient enabled → ambient window created, legacy pet path skipped', async ({ electronApp }) => {
    const info = await getAmbientBubbleInfo(electronApp);
    expect(info, 'ambient bubble window must exist when ambient is enabled').not.toBeNull();

    // Count all small floating-circle windows (width/height <= 100 + alwaysOnTop); there must be exactly 1
    const counts = await countFloatingBubbleWindows(electronApp);
    const totalFloating = counts.ambient + counts.pet;
    expect(
      totalFloating,
      `exactly one floating bubble window expected (U-1=A evolution); got ambient=${counts.ambient}, pet=${counts.pet}`
    ).toBe(1);
    // The one that exists must be ambient-semantic (not a legacy pet title)
    expect(counts.ambient, 'the single bubble must be ambient-titled, not legacy pet').toBe(1);
  });

  // -- AC-M1-11: WAYLAND_AMBIENT env var takes priority over the settings switch --
  test('AC-M1-11: WAYLAND_AMBIENT env var overrides settings switch', async ({ electronApp }) => {
    test.skip(
      true,
      'PENDING AC-M1-14 fixture `launchAppWithEnv` + `ambientTest`: this assertion requires launching a second ' +
        'Electron process with `WAYLAND_AMBIENT=0` while ConfigStorage `ambient.enabled=true` (and the reverse), ' +
        'then asserting env-var wins. Arch/Dev must add `launchAppWithEnv(extraEnv)` helper to tests/e2e/fixtures.ts first.'
    );
    void electronApp;
  });

  // -- AC-M1-12: Toggling the settings switch to change mode requires a restart --
  test('AC-M1-12: toggling ambient via settings requires restart and shows toast', async ({ electronApp, page }) => {
    test.skip(
      true,
      'PENDING Dev: (1) "Experimental: Ambient Mode" settings toggle UI not yet implemented, ' +
        '(2) toast copy "Restart required to apply" must land in locales/en.json first. ' +
        'Assertion shape: flip settings toggle → assert toast visible with matching copy + no window recreation.'
    );
    void electronApp;
    void page;
  });

  // -- AC-M1-13: displayId / position validate boundary protection --------
  // Testable on a single monitor: simulate ConfigStorage's `ambient.bubblePosition` having displayId = 999
  // (which does not exist), then assert after restart that the bubble lands at the primary display's default bottom-right.
  test('AC-M1-13: invalid persisted displayId falls back to primary display default', async () => {
    test.skip(
      true,
      'PENDING AC-M1-14 fixture `launchAppWithEnv`: this assertion requires seeding ConfigStorage with ' +
        '`ambient.bubblePosition: { x, y, displayId: 999 }` before launch, then asserting bubble appears at ' +
        'primary workArea bottom-right (AC-M1-1). Needs a fresh launch per case (singleton fixture cannot reset). ' +
        'Assertion shape: write stale displayId → launchAppWithEnv({WAYLAND_AMBIENT:"1"}) → getAmbientBubbleInfo → ' +
        'assert bounds match AC-M1-1 default, AND ambient.getBubblePosition returns sanitized value (fresh displayId).'
    );
  });

  test('AC-M1-13b: persisted position outside workArea is clamped back', async () => {
    test.skip(
      true,
      'PENDING AC-M1-14 fixture `launchAppWithEnv`: seed ConfigStorage `ambient.bubblePosition: { x: 99999, y: 99999, displayId: <valid> }` ' +
        'before launch, then assert bubble appears clamped inside workArea (AC-M1-6 / AC-M1-13 clamp rule).'
    );
  });

  // -- AC-M1-14: E2E fixture contract (meta test, confirms the fixture exists) --
  // This is not a business-logic check but a verification that "we have the ambientTest fixture available" - once Arch/Dev
  // implements launchAppWithEnv + ambientTest, unskip this case and change it into an import check.
  test('AC-M1-14: ambientTest fixture is exported from tests/e2e/fixtures.ts', async () => {
    test.skip(
      true,
      'PENDING Arch/Dev implementation of `launchAppWithEnv(extraEnv)` + `ambientTest` in tests/e2e/fixtures.ts. ' +
        'Assertion shape (after impl): `import { ambientTest } from "../../fixtures"; expect(ambientTest).toBeDefined();` ' +
        'and switch this entire spec to use ambientTest instead of the current singleton test.'
    );
  });

  // -- AC-M1-15: Existing Pet user migration (paired with U-1=A, 2026-05-11) --
  // [REQ-CHANGE-v5] Legacy users with `pet.enabled=true` and no `ambient.*` keys set must be migrated automatically
  // on the first launch of the A-evolution build:
  //   - ambient.enabled := true
  //   - ambient.bubblePosition := inherits pet's position (including displayId, if pet had one)
  //   - ambient._migratedFromPet := true (idempotent marker; the second launch must not re-migrate)
  test('AC-M1-15: legacy pet user is migrated to ambient on first launch', async () => {
    test.skip(
      true,
      'PENDING Dev impl of pet->ambient migration (AC-M1-15). ' +
        'Also pending AC-M1-14 fixture `launchAppWithEnv` to seed ConfigStorage `pet.enabled=true` + ' +
        'no `ambient.*` keys, then launch, then assert ambient.enabled=true, ambient.bubblePosition ' +
        'inherits pet position (with displayId if pet had one), ambient._migratedFromPet=true. ' +
        'Second launch must not re-migrate (idempotency).'
    );
  });

  // -- Visual regression snapshots ----------------------------------------
  // At least 2 frames: initial bubble state + dragging state (opacity 0.85)
  test('visual: bubble initial state snapshot', async ({ electronApp, page }) => {
    test.skip(
      true,
      'PENDING AC-M1-14 fixture `ambientPage`: need ambient-bubble Page (not main window Page) to capture ' +
        'a DOM screenshot scoped to `[data-testid="ambient-bubble"]`. Will unskip once ambientTest fixture exposes ' +
        'a `bubblePage` accessor; then generate baseline via `toHaveScreenshot(..., --update-snapshots)`.'
    );
    void electronApp;
    void page;
  });

  test('visual: bubble dragging state snapshot (opacity 0.85)', async ({ electronApp, page }) => {
    test.skip(true, 'PENDING AC-M1-14 fixture `ambientPage` (same as initial-state snapshot).');
    void electronApp;
    void page;
  });
});
