/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi } from 'vitest';

vi.mock('@/common/platform', () => ({
  getPlatformServices: () => ({
    paths: { getDataDir: () => '/tmp/wayland-weixin-test' },
  }),
}));

vi.mock('../../../../../../src/process/channels/plugins/weixin/WeixinMonitor', () => ({
  startMonitor: () => undefined,
}));

import {
  DEFAULT_DISPLAY_NAME,
  MENU_ACTIONS,
  WeixinPlugin,
} from '../../../../../../src/process/channels/plugins/weixin/WeixinPlugin';

function makePlugin(credentials: Record<string, unknown>): WeixinPlugin {
  const plugin = new WeixinPlugin();
  // BasePlugin keeps `config` protected; cast via unknown to seed it for the
  // narrow getBotInfo() unit under test without exercising initialize().
  (plugin as unknown as { config: { credentials: Record<string, unknown> } }).config = {
    credentials,
  };
  return plugin;
}

describe('WeixinPlugin.getBotInfo', () => {
  it('returns DEFAULT_DISPLAY_NAME when no override is configured', () => {
    const plugin = makePlugin({ accountId: 'a', botToken: 't' });
    expect(plugin.getBotInfo()).toEqual({ displayName: DEFAULT_DISPLAY_NAME });
  });

  it('returns the configured displayName when credentials.displayName is set', () => {
    const plugin = makePlugin({
      accountId: 'a',
      botToken: 't',
      displayName: '智能助手',
    });
    expect(plugin.getBotInfo()).toEqual({ displayName: '智能助手' });
  });

  it('falls back to DEFAULT_DISPLAY_NAME when displayName is blank', () => {
    const plugin = makePlugin({
      accountId: 'a',
      botToken: 't',
      displayName: '   ',
    });
    expect(plugin.getBotInfo()).toEqual({ displayName: DEFAULT_DISPLAY_NAME });
  });
});

describe('MENU_ACTIONS', () => {
  it('exposes the full menu action surface with the expected shape', () => {
    expect(Object.keys(MENU_ACTIONS).sort()).toEqual(
      ['agent.show', 'help.show', 'pairing.check', 'session.new', 'session.status'].sort(),
    );
    expect(MENU_ACTIONS['session.new']).toEqual({ type: 'system', action: 'session.new' });
    expect(MENU_ACTIONS['pairing.check']).toEqual({ type: 'platform', action: 'pairing.check' });
  });
});
