import { beforeEach, describe, expect, it, vi } from 'vitest';
import { _resetOfficecliInstallerForTests, installOfficecli } from '../../src/process/bridge/officecliInstaller';

describe('OfficeCLI recovery boundary', () => {
  beforeEach(() => {
    _resetOfficecliInstallerForTests();
  });

  it('fails closed without downloading mutable runtime code and reports only once per session', async () => {
    const emit = vi.fn();
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(installOfficecli(emit)).resolves.toBe(false);
    expect(emit).toHaveBeenCalledWith({
      state: 'error',
      message: expect.stringContaining('runtime auto-install is disabled'),
    });
    expect(error).toHaveBeenCalledTimes(1);

    emit.mockClear();
    await expect(installOfficecli(emit)).resolves.toBe(false);
    expect(emit).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledTimes(1);
    error.mockRestore();
  });
});
