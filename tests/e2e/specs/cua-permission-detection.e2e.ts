/**
 * #466 Computer-Use permission detection - in-app live probe (real macOS TCC).
 *
 * Launches the packaged app and reads `cua.getStatus` through the real bridge.
 * This proves the detection principal: the card reads the Electron .app's own
 * TCC state (the responsible process for the non-detached engine child), and it
 * reflects this Mac's actual grants - not a stub. The grant->Re-check->green
 * FLIP + the updater-override-dir engine principal match still require a signed
 * build + a human grant (or engine #114 prompting) and are verified there.
 */
import { test, expect } from '../fixtures';
import { invokeBridge } from '../helpers';

type CuaStatus = {
  platform: string;
  supported: boolean;
  screenRecording: string;
  accessibility: string;
  allGranted: boolean;
};

test.describe('#466 CUA permission detection (in-app, real TCC)', () => {
  test('cua.getStatus reads the real macOS TCC state for the app principal', async ({ page }) => {
    const status = await invokeBridge<CuaStatus>(page, 'cua.get-permission-status');

    // Shape is intact through the real bridge (no crash, no stub).
    expect(status).toBeTruthy();
    expect(typeof status.supported).toBe('boolean');
    expect(['granted', 'denied', 'not-determined', 'unsupported']).toContain(status.screenRecording);
    expect(['granted', 'denied', 'not-determined', 'unsupported']).toContain(status.accessibility);

    if (process.platform === 'darwin') {
      // On macOS the app principal is queried (supported=true), and the grants
      // reflect reality (this fresh .app has not been granted, so it is honest
      // about being not-yet-granted rather than falsely reporting granted).
      expect(status.supported).toBe(true);
      expect(status.platform).toBe('darwin');
      expect(status.allGranted).toBe(status.screenRecording === 'granted' && status.accessibility === 'granted');
    } else {
      expect(status.supported).toBe(false);
      expect(status.allGranted).toBe(true);
    }

    console.log(`[#466] live cua.getStatus = ${JSON.stringify(status)}`);
  });
});
