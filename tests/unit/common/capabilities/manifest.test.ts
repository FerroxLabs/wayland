import { describe, expect, it } from 'vitest';
import { OFFICECLI_CAPABILITY, WAYLAND_CAPABILITY_MANIFEST, validateCapabilityManifest } from '@/common/capabilities';

describe('shared capability manifest', () => {
  it('validates the sealed Office contract with target digests and explicit requirements', () => {
    const result = validateCapabilityManifest(WAYLAND_CAPABILITY_MANIFEST);
    expect(result.ok).toBe(true);
    expect(OFFICECLI_CAPABILITY.enforceability).toBe('enforced');
    expect(OFFICECLI_CAPABILITY.platforms).toHaveLength(6);
  });

  it('rejects a changed definition under the old fixture digest', () => {
    const manifest = structuredClone(WAYLAND_CAPABILITY_MANIFEST);
    manifest.capabilities[0].operations.push('attacker-operation');
    expect(validateCapabilityManifest(manifest)).toMatchObject({
      ok: false,
      reason: expect.stringContaining('digest'),
    });
  });

  it('rejects unknown critical fields', () => {
    const manifest = { ...structuredClone(WAYLAND_CAPABILITY_MANIFEST), grantsAdmin: true };
    expect(validateCapabilityManifest(manifest)).toMatchObject({ ok: false });
  });
});
