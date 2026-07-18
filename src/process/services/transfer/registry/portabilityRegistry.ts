/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  REQUIRED_LOGICAL_STATE,
  REQUIRED_STATE_AUTHORITIES,
  type LogicalStateId,
  type StateAuthorityId,
} from '@process/services/recovery/recoveryManifest';

export type PortabilityDisposition = 'portable' | 'reference-only' | 'reconnect-required' | 'excluded';
export type PortabilityImplementationState = 'available' | 'blocked';

export type PortabilityDescriptor = {
  logicalStateId: LogicalStateId;
  descriptorVersion: 1;
  authorityIds: readonly StateAuthorityId[];
  disposition: PortabilityDisposition;
  producer: { id: string; state: PortabilityImplementationState };
  consumer: { id: string; state: PortabilityImplementationState };
  quiescence: readonly ('desktop' | 'core')[];
  secretPolicy: 'encrypted' | 'redacted-reconnect' | 'none';
  dependencies: readonly LogicalStateId[];
  maxObjectBytes: number;
  compatibility: { minimumFormat: 1; maximumFormat: 1 };
  conflictPolicy: 'remap' | 'merge' | 'replace' | 'reference' | 'exclude';
  activationPolicy: 'normal' | 'paused-review' | 'quarantine-review' | 'not-applicable';
};

export type PortabilityRegistryIssue = {
  code: string;
  logicalStateId?: LogicalStateId;
  message: string;
};

export type PortabilityRegistryValidation = {
  valid: boolean;
  issues: PortabilityRegistryIssue[];
  descriptors: readonly PortabilityDescriptor[];
};

const LOGICAL_STATE = new Set<string>(REQUIRED_LOGICAL_STATE);
const AUTHORITIES = new Set<string>(REQUIRED_STATE_AUTHORITIES);
const SAFE_ID = /^[a-z0-9][a-z0-9._/-]{2,127}$/;
const MAX_OBJECT_BYTES_LIMIT = 8 * 1024 * 1024 * 1024;

function issue(code: string, message: string, logicalStateId?: LogicalStateId): PortabilityRegistryIssue {
  return { code, message, ...(logicalStateId ? { logicalStateId } : {}) };
}

function hasCycle(descriptors: readonly PortabilityDescriptor[]): LogicalStateId | undefined {
  const graph = new Map(descriptors.map((entry) => [entry.logicalStateId, entry.dependencies]));
  const visiting = new Set<LogicalStateId>();
  const visited = new Set<LogicalStateId>();
  const visit = (id: LogicalStateId): LogicalStateId | undefined => {
    if (visiting.has(id)) return id;
    if (visited.has(id)) return undefined;
    visiting.add(id);
    for (const dependency of graph.get(id) ?? []) {
      const cycle = visit(dependency);
      if (cycle) return cycle;
    }
    visiting.delete(id);
    visited.add(id);
    return undefined;
  };
  for (const id of graph.keys()) {
    const cycle = visit(id);
    if (cycle) return cycle;
  }
  return undefined;
}

/** Validate the complete registry without executing a producer or consumer. */
export function validatePortabilityRegistry(
  descriptors: readonly PortabilityDescriptor[]
): PortabilityRegistryValidation {
  const issues: PortabilityRegistryIssue[] = [];
  const seen = new Set<string>();

  for (const descriptor of descriptors) {
    const id = descriptor.logicalStateId;
    if (!LOGICAL_STATE.has(id)) {
      issues.push(issue('REGISTRY_UNKNOWN_LOGICAL_STATE', `Unknown logical state ${String(id)}.`));
      continue;
    }
    if (seen.has(id)) issues.push(issue('REGISTRY_DUPLICATE_LOGICAL_STATE', `${id} is registered twice.`, id));
    seen.add(id);
    if (descriptor.descriptorVersion !== 1) {
      issues.push(issue('REGISTRY_DESCRIPTOR_VERSION_INVALID', `${id} has an unsupported descriptor version.`, id));
    }
    if (!SAFE_ID.test(descriptor.producer.id) || !SAFE_ID.test(descriptor.consumer.id)) {
      issues.push(issue('REGISTRY_IMPLEMENTATION_ID_INVALID', `${id} has a malformed implementation id.`, id));
    }
    if (
      descriptor.authorityIds.length === 0 ||
      new Set(descriptor.authorityIds).size !== descriptor.authorityIds.length
    ) {
      issues.push(issue('REGISTRY_AUTHORITY_SET_INVALID', `${id} must declare unique authorities.`, id));
    }
    for (const authorityId of descriptor.authorityIds as readonly string[]) {
      if (!AUTHORITIES.has(authorityId)) {
        issues.push(issue('REGISTRY_AUTHORITY_UNKNOWN', `${id} references unknown ${authorityId}.`, id));
      }
    }
    for (const dependency of descriptor.dependencies as readonly string[]) {
      if (!LOGICAL_STATE.has(dependency)) {
        issues.push(issue('REGISTRY_DEPENDENCY_UNKNOWN', `${id} depends on unknown ${dependency}.`, id));
      }
      if (dependency === id) issues.push(issue('REGISTRY_DEPENDENCY_SELF', `${id} depends on itself.`, id));
    }
    if (
      !Number.isSafeInteger(descriptor.maxObjectBytes) ||
      descriptor.maxObjectBytes <= 0 ||
      descriptor.maxObjectBytes > MAX_OBJECT_BYTES_LIMIT
    ) {
      issues.push(issue('REGISTRY_OBJECT_LIMIT_INVALID', `${id} has an unsafe object-size limit.`, id));
    }
    if (descriptor.disposition === 'excluded' && descriptor.activationPolicy !== 'not-applicable') {
      issues.push(issue('REGISTRY_EXCLUDED_ACTIVATION_INVALID', `${id} is excluded but has an activation policy.`, id));
    }
    if (descriptor.disposition === 'reconnect-required' && descriptor.secretPolicy !== 'redacted-reconnect') {
      issues.push(issue('REGISTRY_RECONNECT_SECRET_POLICY_INVALID', `${id} must redact portable secrets.`, id));
    }
  }

  for (const id of REQUIRED_LOGICAL_STATE) {
    if (!seen.has(id)) issues.push(issue('REGISTRY_LOGICAL_STATE_MISSING', `${id} is not registered.`, id));
  }
  const cycle = hasCycle(descriptors);
  if (cycle) issues.push(issue('REGISTRY_DEPENDENCY_CYCLE', `Dependency cycle includes ${cycle}.`, cycle));
  return { valid: issues.length === 0, issues, descriptors };
}

const blocked = (id: string) => ({ id, state: 'blocked' as const });

/**
 * Format-v1 registry. Blocked implementation states are intentional: they are
 * the machine-readable reason the UI cannot yet claim a complete transfer.
 */
export const WAYLAND_PORTABILITY_REGISTRY: readonly PortabilityDescriptor[] = [
  {
    logicalStateId: 'desktop.chats-projects',
    descriptorVersion: 1,
    authorityIds: ['desktop.database'],
    disposition: 'portable',
    producer: blocked('transfer.desktop-sqlite-producer/v1'),
    consumer: blocked('transfer.desktop-sqlite-consumer/v1'),
    quiescence: ['desktop'],
    secretPolicy: 'encrypted',
    dependencies: [],
    maxObjectBytes: 512 * 1024 * 1024,
    compatibility: { minimumFormat: 1, maximumFormat: 1 },
    conflictPolicy: 'remap',
    activationPolicy: 'normal',
  },
  {
    logicalStateId: 'desktop.scheduler',
    descriptorVersion: 1,
    authorityIds: ['desktop.database'],
    disposition: 'portable',
    producer: blocked('transfer.desktop-scheduler-producer/v1'),
    consumer: blocked('transfer.desktop-scheduler-consumer/v1'),
    quiescence: ['desktop'],
    secretPolicy: 'encrypted',
    dependencies: ['desktop.chats-projects'],
    maxObjectBytes: 64 * 1024 * 1024,
    compatibility: { minimumFormat: 1, maximumFormat: 1 },
    conflictPolicy: 'remap',
    activationPolicy: 'paused-review',
  },
  {
    logicalStateId: 'desktop.workflows-teams',
    descriptorVersion: 1,
    authorityIds: ['desktop.database'],
    disposition: 'portable',
    producer: blocked('transfer.desktop-workflows-producer/v1'),
    consumer: blocked('transfer.desktop-workflows-consumer/v1'),
    quiescence: ['desktop'],
    secretPolicy: 'encrypted',
    dependencies: ['desktop.chats-projects'],
    maxObjectBytes: 128 * 1024 * 1024,
    compatibility: { minimumFormat: 1, maximumFormat: 1 },
    conflictPolicy: 'remap',
    activationPolicy: 'paused-review',
  },
  {
    logicalStateId: 'desktop.artifacts-receipts',
    descriptorVersion: 1,
    authorityIds: ['desktop.database', 'desktop.runtime-files', 'external.workspaces'],
    disposition: 'portable',
    producer: blocked('transfer.desktop-artifacts-producer/v1'),
    consumer: blocked('transfer.desktop-artifacts-consumer/v1'),
    quiescence: ['desktop'],
    secretPolicy: 'encrypted',
    dependencies: ['desktop.chats-projects'],
    maxObjectBytes: 8 * 1024 * 1024 * 1024,
    compatibility: { minimumFormat: 1, maximumFormat: 1 },
    conflictPolicy: 'remap',
    activationPolicy: 'normal',
  },
  {
    logicalStateId: 'desktop.webui',
    descriptorVersion: 1,
    authorityIds: ['desktop.config', 'desktop.runtime-files'],
    disposition: 'portable',
    producer: blocked('transfer.desktop-webui-producer/v1'),
    consumer: blocked('transfer.desktop-webui-consumer/v1'),
    quiescence: ['desktop'],
    secretPolicy: 'encrypted',
    dependencies: [],
    maxObjectBytes: 64 * 1024 * 1024,
    compatibility: { minimumFormat: 1, maximumFormat: 1 },
    conflictPolicy: 'replace',
    activationPolicy: 'normal',
  },
  {
    logicalStateId: 'desktop.preferences',
    descriptorVersion: 1,
    authorityIds: ['desktop.config', 'desktop.runtime-files'],
    disposition: 'portable',
    producer: blocked('transfer.desktop-preferences-producer/v1'),
    consumer: blocked('transfer.desktop-preferences-consumer/v1'),
    quiescence: ['desktop'],
    secretPolicy: 'encrypted',
    dependencies: [],
    maxObjectBytes: 64 * 1024 * 1024,
    compatibility: { minimumFormat: 1, maximumFormat: 1 },
    conflictPolicy: 'merge',
    activationPolicy: 'normal',
  },
  {
    logicalStateId: 'core.engine-state',
    descriptorVersion: 1,
    authorityIds: ['constitution.filesystem', 'core.default-profile', 'core.named-profiles'],
    disposition: 'portable',
    producer: blocked('transfer.core-state-producer/v1'),
    consumer: blocked('transfer.core-state-consumer/v1'),
    quiescence: ['desktop', 'core'],
    secretPolicy: 'encrypted',
    dependencies: [],
    maxObjectBytes: 8 * 1024 * 1024 * 1024,
    compatibility: { minimumFormat: 1, maximumFormat: 1 },
    conflictPolicy: 'remap',
    activationPolicy: 'quarantine-review',
  },
  {
    logicalStateId: 'external.backend-handles',
    descriptorVersion: 1,
    authorityIds: ['external.agent-configs', 'desktop.runtime-files'],
    disposition: 'reference-only',
    // A descriptor is not an implementation. This stays blocked until the
    // producer registry imports an executable, accepted serializer.
    producer: blocked('transfer.backend-reference-producer/v1'),
    consumer: blocked('transfer.backend-reference-consumer/v1'),
    quiescence: ['desktop'],
    secretPolicy: 'none',
    dependencies: [],
    maxObjectBytes: 16 * 1024 * 1024,
    compatibility: { minimumFormat: 1, maximumFormat: 1 },
    conflictPolicy: 'reference',
    activationPolicy: 'paused-review',
  },
  {
    logicalStateId: 'credentials.secrets',
    descriptorVersion: 1,
    authorityIds: [
      'credentials.key-material',
      'credentials.os-keychain',
      'constitution.revision-authority',
      'constitution.filesystem',
      'desktop.config',
      'desktop.database',
    ],
    disposition: 'reconnect-required',
    producer: blocked('transfer.credential-inventory-producer/v1'),
    consumer: blocked('transfer.credential-inventory-consumer/v1'),
    quiescence: ['desktop'],
    secretPolicy: 'redacted-reconnect',
    dependencies: [],
    maxObjectBytes: 16 * 1024 * 1024,
    compatibility: { minimumFormat: 1, maximumFormat: 1 },
    conflictPolicy: 'exclude',
    activationPolicy: 'paused-review',
  },
  {
    logicalStateId: 'updater.release-channel',
    descriptorVersion: 1,
    authorityIds: ['updater.state'],
    disposition: 'excluded',
    producer: blocked('transfer.updater-exclusion/v1'),
    consumer: blocked('transfer.updater-exclusion/v1'),
    quiescence: [],
    secretPolicy: 'none',
    dependencies: [],
    maxObjectBytes: 1024,
    compatibility: { minimumFormat: 1, maximumFormat: 1 },
    conflictPolicy: 'exclude',
    activationPolicy: 'not-applicable',
  },
  {
    logicalStateId: 'external.workspaces',
    descriptorVersion: 1,
    authorityIds: ['external.workspaces'],
    disposition: 'reference-only',
    producer: blocked('transfer.workspace-reference-producer/v1'),
    consumer: blocked('transfer.workspace-reference-consumer/v1'),
    quiescence: [],
    secretPolicy: 'none',
    dependencies: ['desktop.chats-projects'],
    maxObjectBytes: 64 * 1024 * 1024,
    compatibility: { minimumFormat: 1, maximumFormat: 1 },
    conflictPolicy: 'reference',
    activationPolicy: 'normal',
  },
];

export const WAYLAND_PORTABILITY_REGISTRY_VALIDATION = validatePortabilityRegistry(WAYLAND_PORTABILITY_REGISTRY);

export function unavailableTransferProducers(selected: readonly LogicalStateId[]): PortabilityRegistryIssue[] {
  const validation = WAYLAND_PORTABILITY_REGISTRY_VALIDATION;
  if (!validation.valid) return [...validation.issues];
  const selectedSet = new Set(selected);
  const issues = validation.descriptors
    .filter((descriptor) => selectedSet.has(descriptor.logicalStateId))
    .filter((descriptor) => descriptor.producer.state !== 'available')
    .map((descriptor) =>
      issue(
        'REGISTRY_PRODUCER_UNAVAILABLE',
        `${descriptor.logicalStateId} has no accepted transfer producer.`,
        descriptor.logicalStateId
      )
    );
  for (const descriptor of validation.descriptors.filter(({ logicalStateId }) => selectedSet.has(logicalStateId))) {
    for (const dependency of descriptor.dependencies) {
      if (!selectedSet.has(dependency)) {
        issues.push(
          issue(
            'REGISTRY_DEPENDENCY_OUT_OF_SCOPE',
            `${descriptor.logicalStateId} requires ${dependency} in the same transfer scope.`,
            descriptor.logicalStateId
          )
        );
      }
    }
  }
  return issues;
}
