import { describe, it, expect } from 'vitest';
// @ts-expect-error - plain .mjs release-acceptance script, no type declarations
import { describeDirtyShutdown } from '../../../scripts/release-acceptance/produceNativeUpdaterObservation.mjs';

/**
 * v0.12.9 died on this assertion on win32-arm64 with all six builds green,
 * both smoke gates green and the package observer 6/6. The message was the
 * fixed string 'native app did not shut down cleanly', so the log could not
 * say which of the three boots it was - initial 0.11.18, 0.11.8 rollback, or
 * the candidate re-upgrade - nor how the process actually exited.
 *
 * Every call site already passes a distinct `label`, and the exit code and
 * signal are both in hand at the throw. These assertions pin all of it.
 */
describe('updater observation - dirty shutdown evidence', () => {
  it('names which boot failed, not a generic label', () => {
    const message = describeDirtyShutdown({ label: 'initial boot', platform: 'win32' }, { code: 1, signal: null }, 4);
    expect(message).toContain('initial boot');
    expect(message).toContain('(win32)');
    // The old fixed string must not come back.
    expect(message).not.toBe('native app did not shut down cleanly');
  });

  it('reports the exit code and the signal, so the failure mode is readable', () => {
    expect(
      describeDirtyShutdown({ label: 'rollback boot', platform: 'win32' }, { code: 3221225477, signal: null }, 0)
    ).toContain('exitCode=3221225477');
    expect(
      describeDirtyShutdown({ label: 'reupgrade boot', platform: 'darwin' }, { code: null, signal: 'SIGKILL' }, 2)
    ).toContain('signal=SIGKILL');
  });

  it('reports how many descendants were observed, to separate a dirty exit from a leak', () => {
    // A dirty exit with survivors is a different bug from a dirty exit with
    // none, and the two had been indistinguishable in CI.
    expect(describeDirtyShutdown({ label: 'initial boot', platform: 'win32' }, { code: 1, signal: null }, 4)).toContain(
      'descendantsObserved=4'
    );
    expect(describeDirtyShutdown({ label: 'initial boot', platform: 'win32' }, { code: 1, signal: null }, 0)).toContain(
      'descendantsObserved=0'
    );
  });

  it('falls back to a generic label only when a call site supplies none', () => {
    expect(describeDirtyShutdown({ platform: 'linux' }, { code: 1, signal: null }, 0)).toContain('native app (linux)');
  });
});
