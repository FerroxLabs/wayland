/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const processConfigToJson = vi.hoisted(() => vi.fn());

vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: { toJson: processConfigToJson },
}));

import {
  createProcessConfigSettingsSnapshotReader,
  DESKTOP_SETTINGS_SNAPSHOT_CONTRACT,
  DesktopSettingsSnapshotError,
  produceDesktopSettingsSnapshot,
  type DesktopSettingsSnapshotReader,
  type DesktopSettingsTransferDocument,
} from '@process/services/transfer/producers/settings';

const decode = (bytes: Uint8Array): DesktopSettingsTransferDocument =>
  JSON.parse(new TextDecoder().decode(bytes)) as DesktopSettingsTransferDocument;

const readerFrom = (...values: unknown[]): DesktopSettingsSnapshotReader => {
  let index = 0;
  return {
    readConfigSnapshot: vi.fn(async () => values[Math.min(index++, values.length - 1)]),
  };
};

const largeIdentifierList = (prefix: string): string[] =>
  Array.from({ length: 512 }, (_, index) => `${prefix}${index}-${'界'.repeat(245)}`);

async function expectCode(promise: Promise<unknown>, code: DesktopSettingsSnapshotError['code']): Promise<void> {
  const error = await promise.catch((caught: unknown) => caught);
  expect(error).toBeInstanceOf(DesktopSettingsSnapshotError);
  expect(error).toMatchObject({ code });
}

describe('Desktop settings snapshot producer', () => {
  beforeEach(() => {
    processConfigToJson.mockReset();
  });

  it('emits deterministic, versioned bytes with transfer authority metadata', async () => {
    const config = {
      theme: 'dark',
      language: 'en-US',
      'ui.zoomFactor': 1.25,
      'ui.shell': 'cockpit',
      'notifications.quietHours': { start: '22:30', end: '07:15' },
      'skills.preferences': { pinned: ['research'], disabled: ['legacy-tool'], revision: 4 },
      'wcore.outputBudget': { mode: 'fixed', value: 16_384 },
    };
    const capture = await produceDesktopSettingsSnapshot(readerFrom(config, { ...config }));

    expect(capture).toMatchObject({
      key: 'desktop-preferences-v1',
      logicalStateId: 'desktop.preferences',
      authorityId: 'desktop.config',
      kind: 'state',
      provenance: 'snapshot-state',
    });
    expect(Object.isFrozen(capture)).toBe(true);
    expect(decode(capture.bytes)).toEqual({
      contract: DESKTOP_SETTINGS_SNAPSHOT_CONTRACT,
      logicalStateId: 'desktop.preferences',
      schemaVersion: 1,
      values: {
        language: 'en-US',
        'notifications.quietHours': { end: '07:15', start: '22:30' },
        'skills.preferences': { disabled: ['legacy-tool'], pinned: ['research'], revision: 4 },
        theme: 'dark',
        'ui.shell': 'cockpit',
        'ui.zoomFactor': 1.25,
        'wcore.outputBudget': { mode: 'fixed', value: 16_384 },
      },
    });
    expect(new TextDecoder().decode(capture.bytes)).toBe(
      '{"contract":"wayland-transfer-desktop-preferences/1.0","logicalStateId":"desktop.preferences","schemaVersion":1,"values":{"language":"en-US","notifications.quietHours":{"end":"07:15","start":"22:30"},"skills.preferences":{"disabled":["legacy-tool"],"pinned":["research"],"revision":4},"theme":"dark","ui.shell":"cockpit","ui.zoomFactor":1.25,"wcore.outputBudget":{"mode":"fixed","value":16384}}}'
    );
  });

  it('uses the authoritative atomic ProcessConfig adapter and reads twice', async () => {
    processConfigToJson.mockResolvedValue({ theme: 'dark' });

    const capture = await produceDesktopSettingsSnapshot(createProcessConfigSettingsSnapshotReader());

    expect(processConfigToJson).toHaveBeenCalledTimes(2);
    expect(decode(capture.bytes).values).toEqual({ theme: 'dark' });
  });

  it('is stable across insertion order and ignored secret changes', async () => {
    const first = await produceDesktopSettingsSnapshot(
      readerFrom(
        { theme: 'dark', language: 'en-US', 'model.config': [{ apiKey: 'secret-one' }] },
        { theme: 'dark', language: 'en-US', 'model.config': [{ apiKey: 'secret-two' }] }
      )
    );
    const second = await produceDesktopSettingsSnapshot(
      readerFrom({ language: 'en-US', theme: 'dark' }, { language: 'en-US', theme: 'dark' })
    );

    expect(second.bytes).toEqual(first.bytes);
  });

  it('never reads or emits credential, MCP, token, install, workspace-path, or executable config', async () => {
    const poisonous = Object.create(null) as Record<string, unknown>;
    Object.assign(poisonous, {
      theme: 'dark',
      'model.config': [{ apiKey: 'sk-live-super-secret', baseUrl: 'https://provider.invalid' }],
      'mcp.config': [{ env: { FIRECRAWL_API_KEY: 'fc-secret' }, command: '/Users/alice/bin/npx' }],
      'acp.config': { authToken: 'acp-secret', cliPath: '/opt/private/agent' },
      'workspace.trustLevel': { '/Users/alice/Clients/Acme': 'trusted-edits' },
      'wayland.dir': { workDir: '/Users/alice/work', cacheDir: '/private/tmp/wayland' },
      'webhook.connectionTokens': [{ token: 'webhook-secret' }],
      'app.installUuid': 'install-uuid-secret',
      'oauth.state': 'oauth-secret',
    });
    Object.defineProperty(poisonous, 'mcp.runtimeFingerprint', {
      enumerable: true,
      get: () => {
        throw new Error('ignored secret field was read');
      },
    });

    const capture = await produceDesktopSettingsSnapshot(readerFrom(poisonous, poisonous));
    const serialized = new TextDecoder().decode(capture.bytes);

    expect(decode(capture.bytes).values).toEqual({ theme: 'dark' });
    for (const forbidden of [
      'sk-live-super-secret',
      'fc-secret',
      'acp-secret',
      'webhook-secret',
      'oauth-secret',
      'install-uuid-secret',
      '/Users/',
      '/private/',
      '/opt/',
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it.each(['/', '/Users/alice/private', '/opt/agent/bin', 'C:\\Users\\alice\\secret', '\\\\server\\share'])(
    'rejects an absolute path in portable text: %s',
    async (displayName) => {
      await expectCode(
        produceDesktopSettingsSnapshot(readerFrom({ 'user.displayName': displayName })),
        'SETTINGS_VALUE_INVALID'
      );
    }
  );

  it('fails closed when projected settings mutate during capture', async () => {
    await expectCode(
      produceDesktopSettingsSnapshot(readerFrom({ theme: 'dark' }, { theme: 'light' })),
      'SETTINGS_MUTATED_DURING_SNAPSHOT'
    );
  });

  it('returns defensive bytes that cannot be changed through the source config', async () => {
    const config = { pinnedModels: ['provider:model-one'] };
    const capture = await produceDesktopSettingsSnapshot(readerFrom(config, config));
    const original = Uint8Array.from(capture.bytes);

    config.pinnedModels[0] = 'provider:model-two';

    expect(capture.bytes).toEqual(original);
    expect(decode(capture.bytes).values.pinnedModels).toEqual(['provider:model-one']);
  });

  it('rejects a snapshot whose bounded values still exceed the byte ceiling', async () => {
    const config = {
      'launchpad.barOrder': largeIdentifierList('launch'),
      'onboarding.focusArea': largeIdentifierList('focus'),
      pinnedModels: largeIdentifierList('model'),
    };

    await expectCode(produceDesktopSettingsSnapshot(readerFrom(config, config)), 'SETTINGS_SNAPSHOT_TOO_LARGE');
  });

  it.each([
    [{ theme: Symbol('dark') }, 'symbol'],
    [{ 'ui.zoomFactor': Number.NaN }, 'non-finite number'],
    [{ 'ui.shell': 'expert' }, 'unknown shell'],
    [{ 'notifications.quietHours': { start: '25:00', end: '07:00' } }, 'invalid quiet hours'],
    [
      { 'skills.preferences': { pinned: ['same'], disabled: ['same'], revision: 1 } },
      'contradictory skill preferences',
    ],
    [{ 'wcore.outputBudget': { mode: 'auto', value: 123 } }, 'contradictory output budget'],
  ])('rejects unsupported portable values: %s', async (config) => {
    await expectCode(produceDesktopSettingsSnapshot(readerFrom(config)), 'SETTINGS_VALUE_INVALID');
  });

  it('rejects accessors instead of invoking mutable code while capturing', async () => {
    const config = {} as Record<string, unknown>;
    const getter = vi.fn(() => 'dark');
    Object.defineProperty(config, 'theme', { enumerable: true, get: getter });

    await expectCode(produceDesktopSettingsSnapshot(readerFrom(config)), 'SETTINGS_VALUE_INVALID');
    expect(getter).not.toHaveBeenCalled();
  });

  it('normalizes hostile object traps without leaking their details', async () => {
    const secret = '/Users/alice/.ssh/private-key';
    const hostile = new Proxy(
      {},
      {
        getPrototypeOf: () => {
          throw new Error(secret);
        },
      }
    );

    const error = await produceDesktopSettingsSnapshot(readerFrom(hostile)).catch((caught: unknown) => caught);

    expect(error).toMatchObject({ code: 'SETTINGS_VALUE_INVALID' });
    expect(String(error)).not.toContain(secret);
  });

  it('fails closed on an invalid root snapshot', async () => {
    await expectCode(produceDesktopSettingsSnapshot(readerFrom(['theme', 'dark'])), 'SETTINGS_ROOT_INVALID');
  });

  it('normalizes first- and second-read failures without leaking their details', async () => {
    const secret = '/Users/alice/.config/wayland/provider-secret';
    const firstFailure: DesktopSettingsSnapshotReader = {
      readConfigSnapshot: vi.fn(async () => {
        throw new Error(secret);
      }),
    };
    const secondFailure: DesktopSettingsSnapshotReader = {
      readConfigSnapshot: vi.fn().mockResolvedValueOnce({ theme: 'dark' }).mockRejectedValueOnce(new Error(secret)),
    };

    const errors = await Promise.all(
      [firstFailure, secondFailure].map(async (reader) =>
        produceDesktopSettingsSnapshot(reader).catch((caught: unknown) => caught)
      )
    );
    for (const error of errors) {
      expect(error).toMatchObject({ code: 'SETTINGS_READ_FAILED' });
      expect(String(error)).not.toContain(secret);
      expect(error).not.toHaveProperty('cause');
    }
  });
});
