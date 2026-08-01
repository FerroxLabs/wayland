/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash, randomBytes } from 'crypto';
import type { Request } from 'express';

const GRANT_TTL_MS = 5 * 60 * 1000;
const MAX_ACTIVE_GRANTS = 4096;
const MAX_ACTIVE_GRANTS_PER_PRINCIPAL = 32;
const GRANT_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const SPECIALIST_SCOPE_PATTERN = /^specialist\.write:([A-Za-z0-9_-]+)$/;

export const CONSTITUTION_EDIT_GRANT_HEADER = 'x-wayland-constitution-edit-grant';

export type ConstitutionEditScope = 'constitution.write' | `specialist.write:${string}`;

type StoredGrant = {
  userId: string;
  directPeer: string;
  expiresAt: number;
  scopes: ReadonlySet<ConstitutionEditScope>;
};

export type ConstitutionEditGrantAuthorization =
  | { authorized: true; expiresAt: number }
  | {
      authorized: false;
      reason: 'missing' | 'invalid' | 'expired' | 'identity-mismatch' | 'scope-mismatch';
    };

const grantsByDigest = new Map<string, StoredGrant>();

function digestGrant(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

function directPeer(req: Request): string | null {
  const peer = req.socket?.remoteAddress;
  return typeof peer === 'string' && peer.length > 0 ? peer : null;
}

export function isConstitutionEditScope(value: unknown): value is ConstitutionEditScope {
  return value === 'constitution.write' || (typeof value === 'string' && SPECIALIST_SCOPE_PATTERN.test(value));
}

function pruneExpired(now: number): void {
  for (const [digest, grant] of grantsByDigest) {
    if (grant.expiresAt <= now) grantsByDigest.delete(digest);
  }
}

/**
 * Mint a short-lived opaque edit grant after the caller has already passed the
 * destructive/operator step-up gate. Only its SHA-256 digest is retained.
 */
export function issueConstitutionEditGrant(
  req: Request,
  requestedScopes: readonly ConstitutionEditScope[],
  now = Date.now()
): { token: string; expiresAt: number } | null {
  const userId = req.user?.id;
  const peer = directPeer(req);
  const scopes = [...new Set(requestedScopes)];
  if (!userId || !peer || scopes.length === 0 || scopes.length > 32 || !scopes.every(isConstitutionEditScope)) {
    return null;
  }

  pruneExpired(now);
  let principalGrantCount = 0;
  for (const grant of grantsByDigest.values()) {
    if (grant.userId === userId && grant.directPeer === peer) principalGrantCount += 1;
  }
  if (grantsByDigest.size >= MAX_ACTIVE_GRANTS || principalGrantCount >= MAX_ACTIVE_GRANTS_PER_PRINCIPAL) {
    return null;
  }

  const token = randomBytes(32).toString('base64url');
  const expiresAt = now + GRANT_TTL_MS;
  grantsByDigest.set(digestGrant(token), {
    userId,
    directPeer: peer,
    expiresAt,
    scopes: new Set(scopes),
  });
  return { token, expiresAt };
}

/** Validate one exact edit scope without consuming the reusable autosave grant. */
export function authorizeConstitutionEditGrant(
  req: Request,
  token: string,
  scope: ConstitutionEditScope,
  now = Date.now()
): ConstitutionEditGrantAuthorization {
  if (!token) return { authorized: false, reason: 'missing' };
  if (!GRANT_TOKEN_PATTERN.test(token)) return { authorized: false, reason: 'invalid' };

  const digest = digestGrant(token);
  const grant = grantsByDigest.get(digest);
  if (!grant) return { authorized: false, reason: 'invalid' };
  if (grant.expiresAt <= now) {
    grantsByDigest.delete(digest);
    return { authorized: false, reason: 'expired' };
  }
  if (grant.userId !== req.user?.id || grant.directPeer !== directPeer(req)) {
    return { authorized: false, reason: 'identity-mismatch' };
  }
  if (!grant.scopes.has(scope)) return { authorized: false, reason: 'scope-mismatch' };
  return { authorized: true, expiresAt: grant.expiresAt };
}

/** Revoke a grant only from the authenticated user/direct peer it was bound to. */
export function revokeConstitutionEditGrant(req: Request, token: string): boolean {
  if (!GRANT_TOKEN_PATTERN.test(token)) return false;
  const digest = digestGrant(token);
  const grant = grantsByDigest.get(digest);
  if (!grant || grant.userId !== req.user?.id || grant.directPeer !== directPeer(req)) return false;
  grantsByDigest.delete(digest);
  return true;
}

/** Test-only visibility exposes digests and metadata, never plaintext tokens. */
export const __test__ = {
  clear(): void {
    grantsByDigest.clear();
  },
  expireAll(): void {
    for (const grant of grantsByDigest.values()) grant.expiresAt = 0;
  },
  snapshot(): ReadonlyMap<string, StoredGrant> {
    return new Map(grantsByDigest);
  },
  digestGrant,
  ttlMs: GRANT_TTL_MS,
  maxActiveGrants: MAX_ACTIVE_GRANTS,
  maxActiveGrantsPerPrincipal: MAX_ACTIVE_GRANTS_PER_PRINCIPAL,
};
