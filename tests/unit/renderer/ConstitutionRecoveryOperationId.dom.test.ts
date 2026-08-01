import { afterEach, describe, expect, it, vi } from 'vitest';
import { createConstitutionRecoveryOperationId } from '@renderer/services/ConstitutionRecoveryOperationId';

describe('createConstitutionRecoveryOperationId', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses and validates native randomUUID when the context exposes it', () => {
    const randomUUID = vi.fn(() => '11111111-1111-4111-8111-111111111111');
    vi.stubGlobal('crypto', { randomUUID, getRandomValues: vi.fn() });

    expect(createConstitutionRecoveryOperationId()).toBe('11111111-1111-4111-8111-111111111111');
    expect(randomUUID).toHaveBeenCalledTimes(1);
  });

  it('mints an RFC 4122 UUID v4 from cryptographic bytes when randomUUID is unavailable', () => {
    const getRandomValues = vi.fn((bytes: Uint8Array) => {
      bytes.fill(0xab);
      return bytes;
    });
    vi.stubGlobal('crypto', { getRandomValues });

    expect(createConstitutionRecoveryOperationId()).toBe('abababab-abab-4bab-abab-abababababab');
    expect(getRandomValues).toHaveBeenCalledTimes(1);
  });

  it('fails closed when cryptographic randomness is unavailable', () => {
    vi.stubGlobal('crypto', undefined);
    expect(() => createConstitutionRecoveryOperationId()).toThrow(
      'Cryptographic operation-ID generation is unavailable.'
    );
  });

  it('fails closed when native randomUUID violates the UUID v4 contract', () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'candidate-claim', getRandomValues: vi.fn() });
    expect(() => createConstitutionRecoveryOperationId()).toThrow(
      'Cryptographic operation-ID generation returned an invalid UUID.'
    );
  });
});
