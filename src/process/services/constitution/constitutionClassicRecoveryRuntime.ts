/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'node:path';
import type { ConstitutionFsService } from './constitutionFsService';
import { ConstitutionClassicRecoveryOperationAuthority } from './constitutionClassicRecoveryAuthority';
import {
  ConstitutionClassicRecoveryService,
  ConstitutionClassicRecoveryServiceError,
} from './constitutionClassicRecoveryService';
import { constitutionMutationQuiescence } from './constitutionMutationQuiescence';
import { ClassicRecoveryLocatorAuthority } from '../recovery/classicRecoveryLocator';
import { createProductionExternalRecoveryVaultBackend } from '../recovery/recoveryCapture';
import type { ExternalRecoveryVaultBackend } from '../recovery/externalRecoveryAuthority';
import type { ConstitutionArchiveSecretBackend } from './constitutionFsTransaction';
import type { ConstitutionRestorePrincipalBinding } from './constitutionArchiveRestoreAuthority';

export type ProductionClassicRecoveryRuntimeDependencies = Readonly<{
  userDataRoot: string;
  constitutionFsService: ConstitutionFsService;
  secretBackend: ConstitutionArchiveSecretBackend;
  verifyDesktopPassword: (password: string) => Promise<boolean>;
  externalRecoveryVault?: ExternalRecoveryVaultBackend;
}>;

function requireDesktopPrincipal(principal: ConstitutionRestorePrincipalBinding): void {
  if (principal.kind !== 'desktop-installation') {
    throw new ConstitutionClassicRecoveryServiceError('AUTH_FAILED', 'Fresh destructive authentication failed.');
  }
}

/**
 * Discover the sole principal-bound Classic preparation from the external
 * locator. Absence is non-creating; any malformed or unauthenticated retained
 * evidence rejects the readiness promise and therefore fails every adapter
 * closed.
 */
export async function createProductionConstitutionClassicRecoveryService(
  dependencies: ProductionClassicRecoveryRuntimeDependencies
): Promise<ConstitutionClassicRecoveryService | null> {
  const vault = dependencies.externalRecoveryVault ?? (await createProductionExternalRecoveryVaultBackend());
  const locatorAuthority = new ClassicRecoveryLocatorAuthority({
    liveUserDataRoot: dependencies.userDataRoot,
    authorityUserDataRoot: dependencies.userDataRoot,
    vault,
  });
  const operationAuthority = new ConstitutionClassicRecoveryOperationAuthority(
    path.join(dependencies.userDataRoot, 'constitution', 'classic-recovery-operations.enc'),
    dependencies.secretBackend
  );
  return ConstitutionClassicRecoveryService.fromLocator({
    locatorAuthority,
    destinationAuthority: 'profile:default',
    promotionService: dependencies.constitutionFsService,
    operationAuthority,
    authorizeDestructivePassword: async (principal, password) => {
      requireDesktopPrincipal(principal);
      if (!(await dependencies.verifyDesktopPassword(password))) {
        throw new ConstitutionClassicRecoveryServiceError('AUTH_FAILED', 'Fresh destructive authentication failed.');
      }
    },
    acquireQuiescence: () => constitutionMutationQuiescence.acquireRecoveryQuiescence(),
  });
}
