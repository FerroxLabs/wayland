/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  isAllowedPopoutRoute,
  POPOUT_ALLOWED_ROUTES,
  routePopoutHash,
  routePopoutKey,
  routePopoutLoadFileHash,
} from '../../src/process/utils/popoutRoutes';

describe('popout route helpers (#157)', () => {
  it('allows mission-control', () => {
    expect(isAllowedPopoutRoute('mission-control')).toBe(true);
  });

  it('rejects routes not on the allowlist (renderer-supplied input)', () => {
    expect(isAllowedPopoutRoute('settings')).toBe(false);
    expect(isAllowedPopoutRoute('../etc/passwd')).toBe(false);
    expect(isAllowedPopoutRoute('conversation/abc')).toBe(false);
    expect(isAllowedPopoutRoute('')).toBe(false);
    expect(isAllowedPopoutRoute('mission-control?mode=evil')).toBe(false);
  });

  it('namespaces the registry key so it cannot collide with a conversation id', () => {
    expect(routePopoutKey('mission-control')).toBe('route:mission-control');
  });

  it('builds the chrome-less hash deep link', () => {
    expect(routePopoutHash('mission-control')).toBe('#/mission-control?mode=popout');
  });

  it('builds the loadFile hash without a leading #', () => {
    expect(routePopoutLoadFileHash('mission-control')).toBe('/mission-control?mode=popout');
  });

  it('keeps every allowlisted route consistent across the three builders', () => {
    for (const route of POPOUT_ALLOWED_ROUTES) {
      expect(routePopoutKey(route)).toBe(`route:${route}`);
      expect(routePopoutHash(route)).toBe(`#/${route}?mode=popout`);
      expect(routePopoutLoadFileHash(route)).toBe(`/${route}?mode=popout`);
    }
  });
});
