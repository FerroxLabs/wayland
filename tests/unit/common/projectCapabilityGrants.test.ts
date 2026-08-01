/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  classifyHost,
  resolveGrant,
  grantProjectCapability,
  revokeProjectCapability,
  type ProjectCapabilityGrant,
  type GrantCheckRequest,
} from '@/common/security/projectCapabilityGrants';

const localhostGrant: ProjectCapabilityGrant = {
  projectId: 'proj-1',
  capability: 'localhost',
  grantedAtMs: 1_000,
};

const req = (over: Partial<GrantCheckRequest> = {}): GrantCheckRequest => ({
  projectId: 'proj-1',
  capability: 'localhost',
  origin: 'project-interactive',
  targetHost: '127.0.0.1',
  ...over,
});

describe('SBX-02 classifyHost', () => {
  it.each(['127.0.0.1', '127.7.7.7', 'localhost', '::1', '::ffff:127.0.0.1', '[::1]'])('treats %s as loopback', (h) =>
    expect(classifyHost(h)).toBe('loopback')
  );

  it.each(['169.254.169.254', 'metadata.google.internal', '169.254.10.20'])('treats %s as metadata/link-local', (h) =>
    expect(classifyHost(h)).toBe('metadata')
  );

  it.each(['10.0.0.5', '172.16.0.1', '172.31.255.255', '192.168.1.1', 'fd00::1', 'fe80::1'])(
    'treats %s as private',
    (h) => expect(classifyHost(h)).toBe('private')
  );

  it.each(['8.8.8.8', '1.1.1.1', 'example.com', 'evil.internal', '2606:4700::1111'])('treats %s as public', (h) =>
    expect(classifyHost(h)).toBe('public')
  );

  it.each(['', undefined, '999.1.1.1', '0.0.0.0'])('treats %s as invalid', (h) =>
    expect(classifyHost(h)).toBe('invalid')
  );

  it('does not treat 172.15 / 172.32 as private (boundary)', () => {
    expect(classifyHost('172.15.0.1')).toBe('public');
    expect(classifyHost('172.32.0.1')).toBe('public');
  });
});

describe('SBX-02 resolveGrant — allow path', () => {
  it('allows loopback for the granted Project', () => {
    expect(resolveGrant([localhostGrant], req()).allowed).toBe(true);
  });

  it('allows a toolchain grant without a host', () => {
    const g: ProjectCapabilityGrant = { projectId: 'proj-1', capability: 'toolchain', grantedAtMs: 1 };
    expect(resolveGrant([g], req({ capability: 'toolchain', targetHost: undefined })).allowed).toBe(true);
  });
});

describe('SBX-02 resolveGrant — fail closed by default', () => {
  it('denies when there is no grant', () => {
    expect(resolveGrant([], req())).toEqual({ allowed: false, reason: 'no-grant' });
  });

  it('denies a null-Project request', () => {
    expect(resolveGrant([localhostGrant], req({ projectId: null })).reason).toBe('no-grant');
  });
});

describe('SBX-02 resolveGrant — the eight sibling vectors stay blocked even with a grant', () => {
  it('other-Project: a grant for proj-1 does not cover proj-2', () => {
    expect(resolveGrant([localhostGrant], req({ projectId: 'proj-2' }))).toEqual({
      allowed: false,
      reason: 'other-project',
    });
  });

  it.each(['remote', 'channel', 'schedule', 'cloud'] as const)('%s origin is blocked', (origin) => {
    expect(resolveGrant([localhostGrant], req({ origin })).allowed).toBe(false);
    expect(resolveGrant([localhostGrant], req({ origin })).reason).toBe(origin);
  });

  it('redirect/rebinding is blocked', () => {
    expect(resolveGrant([localhostGrant], req({ viaRedirect: true }))).toEqual({
      allowed: false,
      reason: 'redirect',
    });
  });

  it('metadata address is blocked despite a localhost grant', () => {
    expect(resolveGrant([localhostGrant], req({ targetHost: '169.254.169.254' })).reason).toBe('metadata');
  });

  it('private-network targets are blocked despite a localhost grant', () => {
    expect(resolveGrant([localhostGrant], req({ targetHost: '192.168.1.10' })).reason).toBe('private-network');
    expect(resolveGrant([localhostGrant], req({ targetHost: '10.0.0.1' })).reason).toBe('private-network');
  });

  it('public/remote hosts are blocked despite a localhost grant', () => {
    expect(resolveGrant([localhostGrant], req({ targetHost: '8.8.8.8' })).reason).toBe('non-loopback');
    expect(resolveGrant([localhostGrant], req({ targetHost: 'example.com' })).reason).toBe('non-loopback');
  });

  it('a toolchain grant does not unlock localhost', () => {
    const g: ProjectCapabilityGrant = { projectId: 'proj-1', capability: 'toolchain', grantedAtMs: 1 };
    expect(resolveGrant([g], req()).reason).toBe('no-grant'); // no localhost grant present
  });
});

describe('SBX-02 grant/revoke', () => {
  it('grant replaces a prior grant of the same kind (single scoped grant)', () => {
    const g1 = grantProjectCapability([], localhostGrant);
    const g2 = grantProjectCapability(g1, { ...localhostGrant, grantedAtMs: 2_000, purpose: 'dev server' });
    expect(g2).toHaveLength(1);
    expect(g2[0].purpose).toBe('dev server');
  });

  it('revoke removes exactly the named grant and re-blocks', () => {
    const granted = grantProjectCapability([], localhostGrant);
    expect(resolveGrant(granted, req()).allowed).toBe(true);
    const revoked = revokeProjectCapability(granted, 'proj-1', 'localhost');
    expect(revoked).toHaveLength(0);
    expect(resolveGrant(revoked, req()).allowed).toBe(false);
  });

  it('revoking one capability leaves another intact', () => {
    let grants = grantProjectCapability([], localhostGrant);
    grants = grantProjectCapability(grants, { projectId: 'proj-1', capability: 'toolchain', grantedAtMs: 5 });
    grants = revokeProjectCapability(grants, 'proj-1', 'localhost');
    expect(grants).toHaveLength(1);
    expect(grants[0].capability).toBe('toolchain');
  });
});
