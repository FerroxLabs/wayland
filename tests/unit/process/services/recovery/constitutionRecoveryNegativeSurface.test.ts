/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const SURFACE_FILES = [
  'native/constitution-fs/src/main.rs',
  'src/bootstrap.ts',
  'src/common/types/electron.ts',
  'src/index.ts',
  'src/preload/main.ts',
  'src/process/bridge/constitutionBridge.ts',
  'src/process/bridge/index.ts',
  'src/process/services/constitution/constitutionArchiveRecoveryService.ts',
  'src/process/services/constitution/constitutionArchiveRestoreAuthority.ts',
  'src/process/services/constitution/constitutionRevisionAuthority.ts',
  'src/process/services/recovery/classicConstitutionPromotion.ts',
  'src/process/services/recovery/externalRecoveryCrypto.ts',
  'src/process/services/recovery/externalRecoveryRecordCodec.ts',
  'src/process/services/recovery/index.ts',
  'src/process/services/recovery/startupCompatibility.ts',
  'src/process/services/autoUpdaterService.ts',
  'src/process/services/workspaceRetention.ts',
  'src/process/extensions/lifecycle/legacyBundledCopyCleanup.ts',
  'src/process/providers/scheduler/ModelRefreshScheduler.ts',
  'src/process/team/ritualScheduler.ts',
  'src/process/utils/initBridge.ts',
  'src/process/webserver/routes/constitutionRoutes.ts',
  'src/renderer/pages/settings/ConstitutionSettings/ConstitutionRecovery.tsx',
  'src/renderer/pages/settings/ConstitutionSettings/ConstitutionClassicRecovery.tsx',
  'src/renderer/pages/settings/ConstitutionSettings/index.tsx',
  'src/renderer/services/ConstitutionService.ts',
] as const;

const FORBIDDEN_WAVE_ZERO_SURFACES = [
  /export-rescue/i,
  /import-rescue/i,
  /delete-rescue/i,
  /rescue-deletion/i,
  /deleteClassicRescue/i,
  /constitutionRevisionRecovery/i,
  /createPortableRecoveryWrap/i,
  /openPortableRecoveryWrap/i,
  /exportPortableRecoveryEnvelope/i,
  /rewrapPortableRecoveryEnvelope/i,
  /recovery-portable-wrap/i,
  /classic-recovery\/(?:export|import|delete|purge|prune|gc)/i,
  /constitution:classic-recovery:(?:export|import|delete|purge|prune|gc)/i,
  /(?:export|import|delete|purge|prune|gc)[_-](?:classic[_-])?rescue/i,
] as const;

describe('Wave 0 Constitution recovery negative surface', () => {
  it.each(SURFACE_FILES)('%s exposes no portable or destructive rescue entrypoint', (relativePath) => {
    const source = readFileSync(path.join(ROOT, relativePath), 'utf8');
    for (const forbidden of FORBIDDEN_WAVE_ZERO_SURFACES) {
      expect(source, `${relativePath} matched forbidden ${forbidden}`).not.toMatch(forbidden);
    }
  });

  it('retains only the non-portable keep-v2 Classic disposition', () => {
    const source = readFileSync(
      path.join(ROOT, 'src/process/services/recovery/classicConstitutionPromotion.ts'),
      'utf8'
    );
    expect(source).toContain("Readonly<{ kind: 'keep-v2' }>");
    expect(source).not.toMatch(/kind: 'keep-v2'[^}]*destinationPath/);
    expect(source).toContain("disposition: 'indefinite-local-preservation'");
  });
});
