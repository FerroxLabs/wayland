/**
 * A watched file on a removable volume must never be handed to fs.watch.
 *
 * fs.watch registers a kqueue watch through libuv. When the volume under the
 * path is unmounted, libuv calls abort() inside uv__fs_event - native code, so
 * no try/catch and no 'error' listener can intercept it, and the whole app dies
 * with "Abort trap: 6". All six Wayland crash reports on the reporting machine
 * carry that frame, and its ~/.ijfw/registry.md listed 19 project paths under
 * one external drive - so pulling that drive crashed Wayland every time.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';

const watch = vi.fn();
const watchFile = vi.fn();
const unwatchFile = vi.fn();

vi.mock('node:fs', () => ({
  watch: (...a: unknown[]) => watch(...a),
  watchFile: (...a: unknown[]) => watchFile(...a),
  unwatchFile: (...a: unknown[]) => unwatchFile(...a),
  promises: { readFile: vi.fn(), readdir: vi.fn(), stat: vi.fn(), mkdir: vi.fn(), writeFile: vi.fn() },
  existsSync: vi.fn(() => false),
  readdirSync: vi.fn(() => []),
  readFileSync: vi.fn(() => ''),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  statSync: vi.fn(),
  default: {},
}));

const { __testing } = await import('@process/services/memory/ijfwArchiveService');

describe('ijfw archive watcher never kqueue-watches a removable volume', () => {
  beforeEach(() => {
    watch.mockReset().mockReturnValue({ on: vi.fn(), close: vi.fn() });
    watchFile.mockReset();
    unwatchFile.mockReset();
  });

  it('polls a path under /Volumes instead of registering a kernel watch', () => {
    __testing.defaultWatcherFactory('/Volumes/Mando/AIengine/knowledge.md', { persistent: false }, () => {});
    expect(watchFile).toHaveBeenCalledTimes(1);
    expect(watch).not.toHaveBeenCalled();
  });

  it('CONTROL: a path on the boot volume still uses fs.watch', () => {
    __testing.defaultWatcherFactory('/Users/someone/proj/knowledge.md', { persistent: false }, () => {});
    expect(watch).toHaveBeenCalledTimes(1);
    expect(watchFile).not.toHaveBeenCalled();
  });

  it('attaches an error handler to the boot-volume watcher', () => {
    const on = vi.fn();
    watch.mockReturnValue({ on, close: vi.fn() });
    __testing.defaultWatcherFactory('/Users/someone/proj/a.md', { persistent: false }, () => {});
    expect(on).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('close() stops the poll it started', () => {
    const w = __testing.defaultWatcherFactory('/Volumes/Mando/a.md', { persistent: false }, () => {});
    w.close();
    expect(unwatchFile).toHaveBeenCalledTimes(1);
  });
});
