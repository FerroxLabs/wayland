import { beforeEach, describe, expect, it } from 'vitest';
import type { Request } from 'express';
import {
  __test__,
  authorizeConstitutionEditGrant,
  isConstitutionEditScope,
  issueConstitutionEditGrant,
  revokeConstitutionEditGrant,
} from '@process/webserver/routes/constitutionEditGrant';

function request(userId = 'user-1', peer = '127.0.0.1'): Request {
  return {
    user: { id: userId, username: userId },
    socket: { remoteAddress: peer },
  } as unknown as Request;
}

describe('Constitution hosted edit grants', () => {
  beforeEach(() => __test__.clear());

  it('stores only a digest and binds the grant to exact scopes', () => {
    const req = request();
    const issued = issueConstitutionEditGrant(req, ['constitution.write', 'specialist.write:copy'], 1_000);
    expect(issued?.token).toMatch(/^[A-Za-z0-9_-]{43}$/);

    const stored = [...__test__.snapshot().entries()];
    expect(stored).toHaveLength(1);
    expect(stored[0][0]).toBe(__test__.digestGrant(issued!.token));
    expect(JSON.stringify(stored)).not.toContain(issued!.token);

    expect(authorizeConstitutionEditGrant(req, issued!.token, 'constitution.write', 1_001)).toEqual({
      authorized: true,
      expiresAt: 1_000 + __test__.ttlMs,
    });
    expect(authorizeConstitutionEditGrant(req, issued!.token, 'specialist.write:copy', 1_001).authorized).toBe(true);
    expect(authorizeConstitutionEditGrant(req, issued!.token, 'specialist.write:spark', 1_001)).toEqual({
      authorized: false,
      reason: 'scope-mismatch',
    });
  });

  it('rejects invalid and over-broad requested scopes', () => {
    expect(isConstitutionEditScope('constitution.write')).toBe(true);
    expect(isConstitutionEditScope('specialist.write:copy-team')).toBe(true);
    expect(isConstitutionEditScope('specialist.write:../copy')).toBe(false);
    expect(isConstitutionEditScope('constitution.reset')).toBe(false);
    expect(issueConstitutionEditGrant(request(), ['constitution.reset' as never], 1_000)).toBeNull();
    expect(issueConstitutionEditGrant(request(), [], 1_000)).toBeNull();
  });

  it('fails closed on expiry and removes the expired digest', () => {
    const req = request();
    const issued = issueConstitutionEditGrant(req, ['constitution.write'], 10)!;
    expect(authorizeConstitutionEditGrant(req, issued.token, 'constitution.write', issued.expiresAt)).toEqual({
      authorized: false,
      reason: 'expired',
    });
    expect(__test__.snapshot()).toHaveLength(0);
  });

  it('rejects authenticated-user and direct-peer changes', () => {
    const issued = issueConstitutionEditGrant(request(), ['constitution.write'], 1_000)!;
    expect(authorizeConstitutionEditGrant(request('user-2'), issued.token, 'constitution.write', 1_001)).toEqual({
      authorized: false,
      reason: 'identity-mismatch',
    });
    expect(
      authorizeConstitutionEditGrant(request('user-1', '127.0.0.2'), issued.token, 'constitution.write', 1_001)
    ).toEqual({
      authorized: false,
      reason: 'identity-mismatch',
    });
  });

  it('revokes only for the bound user and peer', () => {
    const req = request();
    const issued = issueConstitutionEditGrant(req, ['constitution.write'], 1_000)!;
    expect(revokeConstitutionEditGrant(request('user-2'), issued.token)).toBe(false);
    expect(authorizeConstitutionEditGrant(req, issued.token, 'constitution.write', 1_001).authorized).toBe(true);
    expect(revokeConstitutionEditGrant(req, issued.token)).toBe(true);
    expect(authorizeConstitutionEditGrant(req, issued.token, 'constitution.write', 1_001)).toEqual({
      authorized: false,
      reason: 'invalid',
    });
  });

  it('rejects missing identity and malformed tokens without storing anything', () => {
    const noUser = { socket: { remoteAddress: '127.0.0.1' } } as unknown as Request;
    const noPeer = { user: { id: 'user-1' }, socket: {} } as unknown as Request;
    expect(issueConstitutionEditGrant(noUser, ['constitution.write'])).toBeNull();
    expect(issueConstitutionEditGrant(noPeer, ['constitution.write'])).toBeNull();
    expect(authorizeConstitutionEditGrant(request(), '', 'constitution.write')).toEqual({
      authorized: false,
      reason: 'missing',
    });
    expect(authorizeConstitutionEditGrant(request(), 'not-a-token', 'constitution.write')).toEqual({
      authorized: false,
      reason: 'invalid',
    });
  });

  it('bounds active grants per authenticated user and direct peer', () => {
    const req = request();
    for (let index = 0; index < __test__.maxActiveGrantsPerPrincipal; index += 1) {
      expect(issueConstitutionEditGrant(req, ['constitution.write'], 1_000)).not.toBeNull();
    }
    expect(issueConstitutionEditGrant(req, ['constitution.write'], 1_000)).toBeNull();

    // A different authenticated principal retains its own bounded allowance.
    expect(issueConstitutionEditGrant(request('user-2'), ['constitution.write'], 1_000)).not.toBeNull();
  });
});
