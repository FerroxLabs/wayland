import type { WaylandNanoActivationSetupState, WaylandNanoBinding } from './types';

const OPAQUE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const ISSUER_ID = /^[a-z][a-z0-9-]{0,63}$/;
const KEY_REFERENCE = /^wayland-nano-key:v1:[A-Za-z0-9_-]{1,128}$/;

export function validateWaylandNanoBinding(value: unknown): WaylandNanoBinding | null {
  if (!isRecord(value) || Object.keys(value).length !== 6) return null;
  const { productSubjectId, principalId, projectId, issuerId, issuerKeyRef, backend } = value;
  if (
    !isOpaqueId(productSubjectId) ||
    !isOpaqueId(principalId) ||
    !isOpaqueId(projectId) ||
    typeof issuerId !== 'string' ||
    !ISSUER_ID.test(issuerId) ||
    typeof issuerKeyRef !== 'string' ||
    !KEY_REFERENCE.test(issuerKeyRef) ||
    backend !== 'wayland-nano'
  ) {
    return null;
  }
  return Object.freeze({ productSubjectId, principalId, projectId, issuerId, issuerKeyRef, backend });
}

export function resolveWaylandNanoSetup(
  binding: unknown,
  retiredProductSubjects: ReadonlySet<string>,
  keyAvailable: (keyRef: string) => boolean
): WaylandNanoActivationSetupState {
  const parsed = validateWaylandNanoBinding(binding);
  if (!parsed) return Object.freeze({ enabled: false, reason: binding ? 'binding_invalid' : 'binding_missing' });
  if (retiredProductSubjects.has(parsed.productSubjectId)) {
    return Object.freeze({ enabled: false, reason: 'binding_retired' });
  }
  if (!keyAvailable(parsed.issuerKeyRef)) {
    return Object.freeze({ enabled: false, reason: 'issuer_key_unavailable' });
  }
  return Object.freeze({ enabled: true, binding: parsed });
}

function isOpaqueId(value: unknown): value is string {
  return typeof value === 'string' && OPAQUE_ID.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
