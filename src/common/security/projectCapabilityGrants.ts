/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * SBX-02 — purpose-scoped Project localhost/toolchain grants (desktop side).
 *
 * A developer can grant, and revoke, exactly ONE Project-scoped localhost or
 * toolchain capability. This module is the fail-closed policy core: given the
 * set of grants and a concrete request, it decides allow/deny and — critically
 * — keeps every sibling vector blocked even when a grant exists. A localhost
 * grant must never become an SSRF/rebinding foothold.
 *
 * The eight vectors that stay blocked regardless of any grant (SBX-02 contract):
 *   metadata, private-network, redirect/rebinding, other-Project, remote,
 *   channel, schedule, Cloud.
 *
 * IMPORTANT — where enforcement actually lands. The browser/network egress gate
 * is owned by the bundled wayland-core engine, which today ships with no safe
 * localhost exception (see SecurityPane). This module is the desktop-side
 * decision + the shape passed to Core via the desktop contract; it decides
 * whether to REQUEST the exception for a given call. End-to-end localhost egress
 * only works once Core honors the scoped grant. Until then this resolver still
 * runs and still fails closed — it can only ever narrow, never widen, the
 * engine's own block. The one Core hook needed: accept a per-request
 * `project_localhost_grant` token on the browser tool call and permit loopback
 * (only) when present and valid.
 */

/** The two capability kinds a Project grant may cover. Nothing else is grantable. */
export type ProjectGrantCapability = 'localhost' | 'toolchain';

/** A single, purpose-scoped grant. One capability, one Project, revocable. */
export type ProjectCapabilityGrant = {
  projectId: string;
  capability: ProjectGrantCapability;
  /** Millisecond epoch the grant was created. */
  grantedAtMs: number;
  /** Free-text purpose the developer stated (audit trail). */
  purpose?: string;
};

/** Context of a network/toolchain request being checked against the grants. */
export type GrantCheckRequest = {
  /** The Project this request originates from. A grant is only for its own Project. */
  projectId: string | null;
  capability: ProjectGrantCapability;
  /** Target host for a localhost check (hostname or IP literal). Ignored for toolchain. */
  targetHost?: string;
  /**
   * Origin channel of the request. Only the interactive desktop Project surface
   * may exercise a grant; a grant never applies to remote/paired-device,
   * messaging-channel, or scheduled/cron execution.
   */
  origin: 'project-interactive' | 'remote' | 'channel' | 'schedule' | 'cloud';
  /**
   * True when this call is the result of a server redirect / DNS-rebind, i.e.
   * the effective target differs from the originally-approved one. A grant never
   * covers a redirected target — the classic SSRF pivot.
   */
  viaRedirect?: boolean;
};

export type GrantDecision = {
  allowed: boolean;
  /** Stable reason code — 'granted' on allow, otherwise the blocking vector. */
  reason:
    | 'granted'
    | 'no-grant'
    | 'other-project'
    | 'remote'
    | 'channel'
    | 'schedule'
    | 'cloud'
    | 'redirect'
    | 'metadata'
    | 'private-network'
    | 'non-loopback'
    | 'invalid-target';
};

const DENY = (reason: GrantDecision['reason']): GrantDecision => ({ allowed: false, reason });
const ALLOW: GrantDecision = { allowed: true, reason: 'granted' };

/** Cloud-metadata service address — the canonical SSRF target. Always blocked. */
const METADATA_HOSTS = new Set(['169.254.169.254', 'metadata.google.internal', '[fd00:ec2::254]', 'fd00:ec2::254']);

type HostClass = 'loopback' | 'metadata' | 'private' | 'public' | 'invalid';

/**
 * Classify a requested host for the localhost gate. Loopback is the ONLY class a
 * localhost grant may reach; everything else (including other private ranges and
 * the metadata address) is denied even with a grant.
 */
export function classifyHost(rawHost: string | undefined): HostClass {
  if (!rawHost) return 'invalid';
  let host = rawHost.trim().toLowerCase();
  if (!host) return 'invalid';
  // Strip an IPv6 bracket wrapper and any zone id.
  if (host.startsWith('[') && host.endsWith(']')) host = host.slice(1, -1);
  host = host.split('%')[0];

  if (METADATA_HOSTS.has(rawHost.trim().toLowerCase()) || METADATA_HOSTS.has(host)) return 'metadata';

  if (host === 'localhost') return 'loopback';
  if (host === '::1' || host === '0:0:0:0:0:0:0:1') return 'loopback';

  // IPv4 (incl. IPv4-mapped IPv6 like ::ffff:127.0.0.1).
  const mapped = host.startsWith('::ffff:') ? host.slice('::ffff:'.length) : host;
  const v4 = mapped.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const octets = v4.slice(1).map((n) => Number(n));
    if (octets.some((o) => o > 255)) return 'invalid';
    const [a, b] = octets;
    if (a === 127) return 'loopback';
    if (a === 169 && b === 254) return 'metadata'; // link-local incl. metadata
    if (a === 10) return 'private';
    if (a === 172 && b >= 16 && b <= 31) return 'private';
    if (a === 192 && b === 168) return 'private';
    if (a === 0) return 'invalid';
    return 'public';
  }

  // IPv6 private/link-local ranges (fc00::/7 unique-local, fe80::/10 link-local).
  if (/^f[cd][0-9a-f]*:/.test(host)) return 'private';
  if (/^fe[89ab][0-9a-f]*:/.test(host)) return 'private';
  if (host.includes(':')) return 'public'; // some other global IPv6

  // A bare hostname (not localhost, not an IP literal). A localhost grant is for
  // loopback only; a name could resolve anywhere, so it is not loopback here.
  return 'public';
}

/**
 * Decide whether a request is permitted by the current grants. FAIL CLOSED: any
 * unrecognized state, missing grant, or sibling vector denies. Grants only ever
 * narrow the engine's own block — this never widens beyond loopback for a
 * matching Project.
 */
export function resolveGrant(
  grants: readonly ProjectCapabilityGrant[],
  request: GrantCheckRequest
): GrantDecision {
  // Sibling vectors that a grant NEVER covers — checked before the grant lookup
  // so they deny even for a legitimately-granted Project.
  if (request.origin === 'remote') return DENY('remote');
  if (request.origin === 'channel') return DENY('channel');
  if (request.origin === 'schedule') return DENY('schedule');
  if (request.origin === 'cloud') return DENY('cloud');
  if (request.viaRedirect) return DENY('redirect');

  if (!request.projectId) return DENY('no-grant');

  const grant = grants.find((g) => g.projectId === request.projectId && g.capability === request.capability);
  if (!grant) {
    // Distinguish "granted to a different Project" from "no grant at all" so the
    // UI/telemetry can be honest, but both deny.
    const grantedElsewhere = grants.some((g) => g.capability === request.capability);
    return DENY(grantedElsewhere ? 'other-project' : 'no-grant');
  }

  // Toolchain grants carry no host; the Project match above is sufficient.
  if (request.capability === 'toolchain') return ALLOW;

  // Localhost: only loopback, and only for this Project.
  const hostClass = classifyHost(request.targetHost);
  switch (hostClass) {
    case 'loopback':
      return ALLOW;
    case 'metadata':
      return DENY('metadata');
    case 'private':
      return DENY('private-network');
    case 'invalid':
      return DENY('invalid-target');
    default:
      return DENY('non-loopback');
  }
}

/** Grant a capability to a Project, replacing any prior grant of the same kind. */
export function grantProjectCapability(
  grants: readonly ProjectCapabilityGrant[],
  grant: ProjectCapabilityGrant
): ProjectCapabilityGrant[] {
  const rest = grants.filter((g) => !(g.projectId === grant.projectId && g.capability === grant.capability));
  return [...rest, grant];
}

/** Revoke a Project's grant of a given capability. */
export function revokeProjectCapability(
  grants: readonly ProjectCapabilityGrant[],
  projectId: string,
  capability: ProjectGrantCapability
): ProjectCapabilityGrant[] {
  return grants.filter((g) => !(g.projectId === projectId && g.capability === capability));
}
