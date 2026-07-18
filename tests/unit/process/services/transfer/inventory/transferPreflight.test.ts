import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { WaylandTransferPreflightRequest } from '@/common/types/transfer';
import { REQUIRED_LOGICAL_STATE, type LogicalStateId } from '@process/services/recovery/recoveryManifest';
import type { RecoveryCaptureCapabilities } from '@process/services/recovery/recoveryDryRun';
import { inventoryRecoveryAuthorities } from '@process/services/recovery/stateAuthorityInventory';
import {
  buildWaylandTransferInventoryPreflight,
  evaluateWaylandTransferInventoryPreflight,
} from '@process/services/transfer/inventory/transferPreflight';

const NOW = new Date('2026-07-19T00:00:00.000Z');
const capabilities: RecoveryCaptureCapabilities = {
  sqliteOnlineBackup: true,
  desktopQuiescence: true,
  coreQuiescence: true,
  mutationEpoch: true,
  sealedSensitiveCopies: true,
};

describe('Wayland Transfer inventory preflight', () => {
  const roots: string[] = [];

  afterEach(() => {
    for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
  });

  async function fixture() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-transfer-preflight-'));
    roots.push(root);
    const userDataRoot = path.join(root, 'user-data');
    const constitutionRoot = path.join(root, 'constitution');
    const coreDefaultProfileRoot = path.join(root, 'core-default');
    const coreNamedProfilesRoot = path.join(root, 'core-profiles');
    const workspace = path.join(root, 'workspace');
    const agentConfig = path.join(root, 'external-agent.json');
    fs.mkdirSync(path.join(userDataRoot, 'wayland'), { recursive: true });
    fs.mkdirSync(path.join(userDataRoot, 'config'), { recursive: true });
    fs.mkdirSync(constitutionRoot, { recursive: true });
    fs.mkdirSync(coreDefaultProfileRoot, { recursive: true });
    fs.mkdirSync(coreNamedProfilesRoot, { recursive: true });
    fs.mkdirSync(workspace, { recursive: true });
    fs.writeFileSync(path.join(userDataRoot, 'wayland', 'wayland.db'), 'sqlite-database');
    fs.writeFileSync(path.join(userDataRoot, 'config', 'wayland-config.txt'), 'config');
    fs.writeFileSync(path.join(userDataRoot, 'webui.config.json'), '{}');
    fs.writeFileSync(path.join(coreDefaultProfileRoot, 'config.toml'), 'model = "local"');
    fs.writeFileSync(agentConfig, '{}');
    const inputs = {
      userDataRoot,
      constitutionRoot,
      coreDefaultProfileRoot,
      coreNamedProfilesRoot,
      externalWorkspaces: [{ projectId: 'project-1', path: workspace }],
      externalAgentConfigs: [{ backendId: 'codex', path: agentConfig }],
      sourceReleaseTrack: 'stable' as const,
    };
    return { root, inputs, inventory: await inventoryRecoveryAuthorities(inputs) };
  }

  function request(overrides: Partial<WaylandTransferPreflightRequest> = {}): WaylandTransferPreflightRequest {
    return {
      mode: 'destination-bound',
      scope: 'selected',
      selectedLogicalState: ['desktop.chats-projects'],
      ownerConfirmed: true,
      stepUpAuthenticated: true,
      destination: {
        instanceId: 'destination-1',
        principalId: 'owner-1',
        publicKeyFingerprint: 'sha256:destination-key',
        expiresAt: '2026-07-19T00:10:00.000Z',
        approvedLogicalState: [...REQUIRED_LOGICAL_STATE],
      },
      ...overrides,
    };
  }

  it('builds a read-only destination preview without exposing source paths', async () => {
    const { root, inputs } = await fixture();
    const result = await buildWaylandTransferInventoryPreflight({
      request: request(),
      inventory: inputs,
      recoveryCapabilities: capabilities,
      now: NOW,
    });

    expect(result).toMatchObject({
      contract: 'wayland-transfer-preflight/1.0',
      formatVersion: 1,
      dryRunOnly: true,
      suite: 'WT-D1',
      readyToExport: false,
    });
    expect(result.families).toHaveLength(REQUIRED_LOGICAL_STATE.length);
    expect(result.summary.included).toMatchObject({ familyCount: 1, fileCount: 1 });
    expect(result.blockers.map(({ code }) => code)).toContain('PORTABILITY_REGISTRY_PRODUCER_UNAVAILABLE');
    expect(result.summary.excluded.familyCount).toBe(REQUIRED_LOGICAL_STATE.length - 1);
    expect(JSON.stringify(result)).not.toContain(root);
    expect(JSON.stringify(result)).not.toContain('wayland.db');
  });

  it('fails closed without owner confirmation, step-up, or a valid short-lived binding', async () => {
    const { inventory } = await fixture();
    const result = evaluateWaylandTransferInventoryPreflight(
      request({
        ownerConfirmed: false,
        stepUpAuthenticated: false,
        destination: {
          instanceId: '',
          principalId: '',
          publicKeyFingerprint: '',
          expiresAt: '2026-07-19T00:16:00.000Z',
          approvedLogicalState: [...REQUIRED_LOGICAL_STATE],
        },
      }),
      inventory,
      capabilities,
      NOW
    );

    expect(result.readyToExport).toBe(false);
    expect(result.blockers.map(({ code }) => code)).toEqual(
      expect.arrayContaining([
        'OWNER_CONFIRMATION_REQUIRED',
        'STEP_UP_REQUIRED',
        'DESTINATION_IDENTITY_INVALID',
        'DESTINATION_BINDING_TOO_LONG',
      ])
    );
  });

  it('rejects expired and malformed destination expiry values', async () => {
    const { inventory } = await fixture();
    const expired = evaluateWaylandTransferInventoryPreflight(
      request({ destination: { ...request().destination!, expiresAt: '2026-07-18T23:59:59.000Z' } }),
      inventory,
      capabilities,
      NOW
    );
    const malformed = evaluateWaylandTransferInventoryPreflight(
      request({ destination: { ...request().destination!, expiresAt: 'not-a-time' } }),
      inventory,
      capabilities,
      NOW
    );

    expect(expired.blockers.map(({ code }) => code)).toContain('DESTINATION_BINDING_EXPIRED');
    expect(malformed.blockers.map(({ code }) => code)).toContain('DESTINATION_EXPIRY_INVALID');
  });

  it('rejects unknown, duplicate, empty, and widened selections', async () => {
    const { inventory } = await fixture();
    const selectedLogicalState = [
      'desktop.chats-projects',
      'desktop.chats-projects',
      'future.unregistered-state',
    ] as LogicalStateId[];
    const result = evaluateWaylandTransferInventoryPreflight(
      request({
        selectedLogicalState,
        destination: { ...request().destination!, approvedLogicalState: ['desktop.scheduler'] },
      }),
      inventory,
      capabilities,
      NOW
    );
    const empty = evaluateWaylandTransferInventoryPreflight(
      request({ selectedLogicalState: [] }),
      inventory,
      capabilities,
      NOW
    );

    expect(result.blockers.map(({ code }) => code)).toEqual(
      expect.arrayContaining(['SELECTION_DUPLICATE_STATE', 'SELECTION_UNKNOWN_STATE', 'DESTINATION_SCOPE_WIDENING'])
    );
    expect(empty.blockers.map(({ code }) => code)).toContain('SELECTION_EMPTY');
  });

  it('fails closed instead of throwing on malformed runtime input', async () => {
    const { inventory } = await fixture();
    const malformed = {
      mode: 'future-mode',
      scope: 'future-scope',
      selectedLogicalState: [42],
      ownerConfirmed: 'yes',
      stepUpAuthenticated: 1,
      destination: {
        instanceId: 7,
        principalId: null,
        publicKeyFingerprint: [],
        expiresAt: 17,
        approvedLogicalState: 'all',
      },
    } as unknown as WaylandTransferPreflightRequest;

    const result = evaluateWaylandTransferInventoryPreflight(malformed, inventory, capabilities, NOW);
    expect(result.readyToExport).toBe(false);
    expect(result.blockers.map(({ code }) => code)).toEqual(
      expect.arrayContaining([
        'MODE_INVALID',
        'SCOPE_INVALID',
        'SELECTION_INVALID',
        'OWNER_CONFIRMATION_REQUIRED',
        'STEP_UP_REQUIRED',
        'DESTINATION_IDENTITY_INVALID',
        'DESTINATION_EXPIRY_INVALID',
        'DESTINATION_SCOPE_INVALID',
      ])
    );
  });

  it('requires every family for full scope', async () => {
    const { inventory } = await fixture();
    const result = evaluateWaylandTransferInventoryPreflight(
      request({ scope: 'full', selectedLogicalState: ['desktop.chats-projects'] }),
      inventory,
      capabilities,
      NOW
    );

    expect(result.readyToExport).toBe(false);
    expect(result.blockers.filter(({ code }) => code === 'FULL_SCOPE_INCOMPLETE')).toHaveLength(
      REQUIRED_LOGICAL_STATE.length - 1
    );
  });

  it('fails closed on registry drift and unavailable recovery primitives', async () => {
    const { inventory } = await fixture();
    inventory.logicalState.push({
      id: 'future.unregistered-state' as LogicalStateId,
      authorityIds: [],
      state: 'mapped',
      note: 'hostile registry drift',
    });
    inventory.logicalState.push({ ...inventory.logicalState[0] });
    inventory.authorities.push({ ...inventory.authorities[0] });
    const result = evaluateWaylandTransferInventoryPreflight(
      request(),
      inventory,
      { ...capabilities, sqliteOnlineBackup: false, mutationEpoch: false },
      NOW
    );

    expect(result.blockers.map(({ code }) => code)).toEqual(
      expect.arrayContaining([
        'LOGICAL_STATE_UNREGISTERED',
        'LOGICAL_STATE_DUPLICATE',
        'AUTHORITY_DUPLICATE',
        'RECOVERY_SQLITE_ONLINE_BACKUP_UNAVAILABLE',
        'RECOVERY_MUTATION_EPOCH_UNAVAILABLE',
      ])
    );
  });

  it('marks credentials, references, exclusions, and executable state explicitly', async () => {
    const { inventory } = await fixture();
    const selectedLogicalState: LogicalStateId[] = [
      'credentials.secrets',
      'external.workspaces',
      'external.backend-handles',
      'updater.release-channel',
      'desktop.scheduler',
      'core.engine-state',
    ];
    const result = evaluateWaylandTransferInventoryPreflight(
      request({ selectedLogicalState }),
      inventory,
      capabilities,
      NOW
    );

    expect(result.families.find(({ id }) => id === 'credentials.secrets')?.disposition).toBe('reconnect-required');
    expect(result.families.find(({ id }) => id === 'external.workspaces')?.disposition).toBe('reference-only');
    expect(result.families.find(({ id }) => id === 'updater.release-channel')?.disposition).toBe('excluded');
    expect(result.families.find(({ id }) => id === 'desktop.scheduler')).toMatchObject({
      disposition: 'included',
      executableCapable: true,
      activation: 'paused-quarantine-required',
    });
    expect(result.summary).toMatchObject({
      included: { familyCount: 2 },
      reference: { familyCount: 2 },
      excluded: { familyCount: REQUIRED_LOGICAL_STATE.length - 4 },
    });
    expect(result.warnings.map(({ code }) => code)).toEqual(
      expect.arrayContaining(['CREDENTIAL_RECONNECT_REQUIRED', 'EXECUTABLE_IMPORT_QUARANTINED'])
    );
  });

  it('keeps recovery mode credential-bound and destination-free', async () => {
    const { inventory } = await fixture();
    const result = evaluateWaylandTransferInventoryPreflight(
      request({ mode: 'recovery', recoveryCredentialReady: false }),
      inventory,
      capabilities,
      NOW
    );

    expect(result.suite).toBe('WT-R1');
    expect(result.readyToExport).toBe(false);
    expect(result.blockers.map(({ code }) => code)).toEqual(
      expect.arrayContaining(['RECOVERY_CREDENTIAL_REQUIRED', 'DESTINATION_NOT_ALLOWED'])
    );
  });
});
