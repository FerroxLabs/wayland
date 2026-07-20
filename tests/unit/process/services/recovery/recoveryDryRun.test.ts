import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { evaluateRecoveryDryRun, type RecoveryCaptureCapabilities } from '@process/services/recovery/recoveryDryRun';
import {
  inventoryRecoveryAuthorities,
  type RecoveryInventory,
} from '@process/services/recovery/stateAuthorityInventory';

const allCapabilities: RecoveryCaptureCapabilities = {
  sqliteOnlineBackup: true,
  desktopQuiescence: true,
  coreQuiescence: true,
  mutationEpoch: true,
  sealedSensitiveCopies: true,
};

describe('recovery capture dry run', () => {
  const roots: string[] = [];

  afterEach(() => {
    for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
  });

  async function fixture(options: { core?: boolean } = { core: true }) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wayland-recovery-dry-run-'));
    roots.push(root);
    const userDataRoot = path.join(root, 'user-data');
    const coreDefaultProfileRoot = path.join(root, 'core-default');
    const coreNamedProfilesRoot = path.join(root, 'core-profiles');
    const workspace = path.join(root, 'workspace');
    fs.mkdirSync(path.join(userDataRoot, 'wayland'), { recursive: true });
    fs.mkdirSync(path.join(userDataRoot, 'config'), { recursive: true });
    fs.mkdirSync(workspace, { recursive: true });
    fs.writeFileSync(path.join(userDataRoot, 'wayland', 'wayland.db'), 'sqlite');
    fs.writeFileSync(path.join(userDataRoot, 'config', 'wayland-config.txt'), 'config');
    fs.writeFileSync(path.join(userDataRoot, 'webui.config.json'), '{}');
    if (options.core) {
      fs.mkdirSync(coreDefaultProfileRoot, { recursive: true });
      fs.mkdirSync(coreNamedProfilesRoot, { recursive: true });
      fs.writeFileSync(path.join(coreDefaultProfileRoot, 'config.toml'), 'model = "local"');
    }

    return inventoryRecoveryAuthorities({
      userDataRoot,
      constitutionRoot: path.join(root, 'constitution-filesystem'),
      coreDefaultProfileRoot,
      coreNamedProfilesRoot,
      externalWorkspaces: [{ projectId: 'project-1', path: workspace }],
      sourceReleaseTrack: 'preview',
    });
  }

  it('becomes ready only when every consistency and sealing primitive is available', async () => {
    const dryRun = evaluateRecoveryDryRun(await fixture(), allCapabilities);

    expect(dryRun).toMatchObject({ dryRunOnly: true, readyToCapture: true, sourceReleaseTrack: 'preview' });
    expect(dryRun.blockers).toEqual([]);
    expect(dryRun.warnings.map(({ code }) => code)).toContain('OS_KEYCHAIN_EXTERNAL');
    expect(dryRun.authorities.find(({ id }) => id === 'desktop.database')?.coverage).toBe('encrypted-copy');
  });

  it('fails closed when online backup, epochs, quiescence, or sealing are unavailable', async () => {
    const dryRun = evaluateRecoveryDryRun(await fixture(), {
      sqliteOnlineBackup: false,
      desktopQuiescence: false,
      coreQuiescence: false,
      mutationEpoch: false,
      sealedSensitiveCopies: false,
    });

    expect(dryRun.readyToCapture).toBe(false);
    expect(dryRun.blockers.map(({ code }) => code)).toEqual(
      expect.arrayContaining([
        'SQLITE_ONLINE_BACKUP_UNAVAILABLE',
        'DESKTOP_QUIESCENCE_UNAVAILABLE',
        'CORE_QUIESCENCE_UNAVAILABLE',
        'MUTATION_EPOCH_UNAVAILABLE',
        'SEALED_COPY_UNAVAILABLE',
      ])
    );
  });

  it('rejects truncated copied authorities and unmapped logical state', async () => {
    const inventory = await fixture();
    inventory.authorities.find(({ id }) => id === 'desktop.config')!.evidence[0].truncated = true;
    inventory.logicalState = inventory.logicalState.filter(({ id }) => id !== 'desktop.webui');

    const dryRun = evaluateRecoveryDryRun(inventory, allCapabilities);
    expect(dryRun.readyToCapture).toBe(false);
    expect(dryRun.blockers.map(({ code }) => code)).toEqual(
      expect.arrayContaining(['AUTHORITY_INVENTORY_TRUNCATED', 'LOGICAL_STATE_UNMAPPED'])
    );
  });

  it('warns when a configured external reference is absent', async () => {
    const inventory = await fixture();
    inventory.authorities.find(({ id }) => id === 'external.workspaces')!.evidence[0].state = 'absent';

    const dryRun = evaluateRecoveryDryRun(inventory, allCapabilities);
    expect(dryRun.warnings).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'EXTERNAL_REFERENCE_UNSAFE' })])
    );
  });

  it('rejects missing, reordered, duplicate, and contradictory external reference evidence', async () => {
    const missing = await fixture();
    missing.authorities.find(({ id }) => id === 'external.workspaces')!.evidence = [];
    expect(evaluateRecoveryDryRun(missing, allCapabilities).blockers.map(({ code }) => code)).toContain(
      'EXTERNAL_REFERENCE_COUNT_MISMATCH'
    );

    const contradictory = await fixture();
    contradictory.externalWorkspaces[0].state = 'file';
    expect(evaluateRecoveryDryRun(contradictory, allCapabilities).blockers.map(({ code }) => code)).toContain(
      'EXTERNAL_REFERENCE_EVIDENCE_MISMATCH'
    );

    const duplicate = await fixture();
    duplicate.externalWorkspaces.push({ ...duplicate.externalWorkspaces[0] });
    expect(evaluateRecoveryDryRun(duplicate, allCapabilities).blockers.map(({ code }) => code)).toEqual(
      expect.arrayContaining(['EXTERNAL_REFERENCE_DUPLICATE', 'EXTERNAL_REFERENCE_COUNT_MISMATCH'])
    );
  });

  it('rejects missing, duplicate, unknown, and non-read-only authority classifications', async () => {
    const inventory = await fixture({ core: false });
    const database = inventory.authorities.find(({ id }) => id === 'desktop.database')!;
    inventory.authorities = inventory.authorities.filter(({ id }) => id !== 'updater.state');
    inventory.authorities.push({ ...database });
    inventory.authorities.push({ ...database, id: 'producer.unknown' } as unknown as typeof database);
    (inventory as { readOnly: boolean }).readOnly = false;

    const dryRun = evaluateRecoveryDryRun(inventory, allCapabilities);
    expect(dryRun.readyToCapture).toBe(false);
    expect(dryRun.blockers.map(({ code }) => code)).toEqual(
      expect.arrayContaining([
        'INVENTORY_NOT_READ_ONLY',
        'AUTHORITY_UNKNOWN',
        'AUTHORITY_UNDISCOVERED',
        'AUTHORITY_DUPLICATE',
      ])
    );
  });

  it('rejects forged evidence state, skipped present state, and duplicate or unknown logical mappings', async () => {
    const inventory = await fixture({ core: false });
    const config = inventory.authorities.find(({ id }) => id === 'desktop.config')!;
    config.state = 'absent';
    config.recommendedCoverage = 'absent';
    inventory.logicalState.push({ ...inventory.logicalState[0] });
    inventory.logicalState.push({
      id: 'desktop.unknown',
      authorityIds: ['desktop.database'],
      state: 'mapped',
      note: 'hostile unknown logical state',
    } as unknown as RecoveryInventory['logicalState'][number]);

    const dryRun = evaluateRecoveryDryRun(inventory, allCapabilities);
    expect(dryRun.readyToCapture).toBe(false);
    expect(dryRun.blockers.map(({ code }) => code)).toEqual(
      expect.arrayContaining([
        'AUTHORITY_STATE_MISMATCH',
        'AUTHORITY_POLICY_MISMATCH',
        'LOGICAL_STATE_DUPLICATE',
        'LOGICAL_STATE_UNKNOWN',
        'DESKTOP_CONFIG_MISSING',
      ])
    );
  });
});
