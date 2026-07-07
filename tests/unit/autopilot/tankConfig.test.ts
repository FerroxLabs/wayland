import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setTankConfigOverride, tankConfig, tankEnabled } from '@process/services/autopilot/tankClient';

/** env var → persisted override → default. Env must always win. */
describe('tankConfig precedence', () => {
  const origUrl = process.env.WAYLAND_TANK_URL;
  const origToken = process.env.WAYLAND_TANK_TOKEN;

  beforeEach(() => {
    delete process.env.WAYLAND_TANK_URL;
    delete process.env.WAYLAND_TANK_TOKEN;
    setTankConfigOverride(undefined);
  });

  afterEach(() => {
    if (origUrl === undefined) delete process.env.WAYLAND_TANK_URL;
    else process.env.WAYLAND_TANK_URL = origUrl;
    if (origToken === undefined) delete process.env.WAYLAND_TANK_TOKEN;
    else process.env.WAYLAND_TANK_TOKEN = origToken;
    setTankConfigOverride(undefined);
  });

  it('falls back to the default local URL and no token', () => {
    expect(tankConfig()).toEqual({ baseUrl: 'http://127.0.0.1:7879', token: '' });
    expect(tankEnabled()).toBe(false);
  });

  it('uses the persisted override when no env var is set (trailing slash trimmed)', () => {
    setTankConfigOverride({ url: 'http://tank.example:9000/', token: 'persisted' });
    expect(tankConfig()).toEqual({ baseUrl: 'http://tank.example:9000', token: 'persisted' });
    expect(tankEnabled()).toBe(true);
  });

  it('lets the env var win over the persisted override', () => {
    setTankConfigOverride({ url: 'http://persisted:1', token: 'persisted' });
    process.env.WAYLAND_TANK_URL = 'http://env:2';
    process.env.WAYLAND_TANK_TOKEN = 'envtoken';
    expect(tankConfig()).toEqual({ baseUrl: 'http://env:2', token: 'envtoken' });
  });
});
