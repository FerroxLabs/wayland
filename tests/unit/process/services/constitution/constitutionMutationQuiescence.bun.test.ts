/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// Bun-only suite: the filename keeps Vitest from collecting this native test authority.
import { describe, expect, it } from 'bun:test';
import { ConstitutionMutationQuiescenceAuthority } from '@process/services/constitution/constitutionMutationQuiescence';

describe('Constitution mutation quiescence authority', () => {
  it('excludes recovery while an interactive mutation owns the authority', async () => {
    const authority = new ConstitutionMutationQuiescenceAuthority();
    const release = authority.acquireInteractiveMutation();
    await expect(authority.acquireRecoveryQuiescence()).rejects.toMatchObject({ code: 'CONSTITUTION_FS_CONFLICT' });
    release();
    const releaseRecovery = await authority.acquireRecoveryQuiescence();
    releaseRecovery();
  });

  it('excludes every interactive mutation for the complete recovery lease', async () => {
    const authority = new ConstitutionMutationQuiescenceAuthority();
    const release = await authority.acquireRecoveryQuiescence();
    expect(() => authority.acquireInteractiveMutation()).toThrow(
      expect.objectContaining({ code: 'CONSTITUTION_FS_CONFLICT' })
    );
    release();
    expect(authority.runInteractiveMutation(() => 'committed')).toBe('committed');
  });

  it('releases both synchronous and asynchronous interactive failures', async () => {
    const authority = new ConstitutionMutationQuiescenceAuthority();
    expect(() =>
      authority.runInteractiveMutation(() => {
        throw new Error('sync failure');
      })
    ).toThrow('sync failure');
    await expect(
      authority.runInteractiveMutationAsync(async () => {
        throw new Error('async failure');
      })
    ).rejects.toThrow('async failure');
    const release = await authority.acquireRecoveryQuiescence();
    release();
  });
});
