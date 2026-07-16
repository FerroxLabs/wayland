import { describe, expect, it } from 'vitest';
import { migrateLegacyEnabledExtensionPermissionReview } from '../../../src/process/extensions/ExtensionRegistry';
import type { ExtensionState, LoadedExtension } from '../../../src/process/extensions/types';

function makeExtension(permissions: Record<string, unknown>): LoadedExtension {
  return {
    directory: '/tmp/ext',
    source: 'appdata',
    manifest: {
      name: 'legacy-extension',
      version: '1.0.0',
      displayName: 'Legacy Extension',
      description: 'Legacy extension fixture',
      permissions,
      contributes: {},
    },
  } as LoadedExtension;
}

describe('migrateLegacyEnabledExtensionPermissionReview', () => {
  it('grandfathers previously installed enabled dangerous extensions', () => {
    const approvedAt = new Date('2026-06-30T00:00:00.000Z');
    const state: ExtensionState = {
      enabled: true,
      installed: true,
      lastVersion: '1.0.0',
    };

    const migrated = migrateLegacyEnabledExtensionPermissionReview(
      makeExtension({
        storage: true,
        shell: { commands: ['node'] },
      }),
      state,
      approvedAt
    );

    expect(migrated.enabled).toBe(true);
    expect(migrated.permissionReview).toEqual({
      approvedAt,
      approvedRiskLevel: 'dangerous',
      approvedPermissions: ['events', 'shell', 'storage'],
    });
  });

  it('does not approve disabled dangerous extensions', () => {
    const state: ExtensionState = {
      enabled: false,
      installed: true,
      disabledReason: 'User disabled',
    };

    const migrated = migrateLegacyEnabledExtensionPermissionReview(
      makeExtension({
        storage: true,
        shell: { commands: ['node'] },
      }),
      state
    );

    expect(migrated).toBe(state);
    expect(migrated.permissionReview).toBeUndefined();
  });

  it('does not approve first-run dangerous extensions', () => {
    const state: ExtensionState = {
      enabled: true,
      installed: false,
    };

    const migrated = migrateLegacyEnabledExtensionPermissionReview(
      makeExtension({
        storage: true,
        shell: { commands: ['node'] },
      }),
      state
    );

    expect(migrated).toBe(state);
    expect(migrated.permissionReview).toBeUndefined();
  });

  it('preserves explicit permission reviews', () => {
    const approvedAt = new Date('2026-06-01T00:00:00.000Z');
    const state: ExtensionState = {
      enabled: true,
      installed: true,
      permissionReview: {
        approvedAt,
        approvedRiskLevel: 'dangerous',
        approvedPermissions: ['storage'],
      },
    };

    const migrated = migrateLegacyEnabledExtensionPermissionReview(
      makeExtension({
        storage: true,
        shell: { commands: ['node'] },
      }),
      state
    );

    expect(migrated).toBe(state);
  });
});
