/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createExecutionSnapshot, type ExecutionSnapshot, type TrustedArtifactReceipt } from '@/common/execution';
import ConsequentialPolicyPreview from '@/renderer/components/execution/ConsequentialPolicyPreview';
import ReceiptTrustSurface from '@/renderer/components/execution/ReceiptTrustSurface';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

const identity = { runId: 'run-1', turnId: 'turn-1', correlationId: 'corr-1' } as const;
const digest = `sha256:${'a'.repeat(64)}`;

describe('M6 trust surfaces', () => {
  it('keeps verified and stale receipt states visually distinct', () => {
    const receipt: TrustedArtifactReceipt = {
      id: 'receipt-1',
      kind: 'artifact',
      authority: 'core',
      identity,
      observedAt: 1,
      origin: 'core/anvil',
      contractVersion: '1.0',
      producerSessionId: 'session-1',
      producerRunId: 'producer-run-1',
      producerTaskId: 'task-1',
      producerSequence: 0,
      artifactDigest: digest,
      gateClosureDigest: digest,
      bodyDigest: digest,
      status: 'source-dependency-stale',
    };
    render(
      <ReceiptTrustSurface
        receipt={receipt}
        trust={{ receiptId: receipt.id, artifactDigest: digest, status: 'source-dependency-stale' }}
      />
    );
    expect(screen.getByTestId('receipt-trust-surface').dataset.trustStatus).toBe('source-dependency-stale');
    expect(screen.getByText('Source dependency stale')).toBeTruthy();
    expect(screen.getByText('Integrity checked')).toBeTruthy();
  });

  it('shows Needs you when trusted policy or scope proof is unavailable', () => {
    const snapshot = createExecutionSnapshot({
      identity,
      actor: { backend: 'wcore', agentId: 'core' },
      scope: { workspaceId: 'workspace-1', host: 'desktop', trust: 'unknown', scheduled: false },
      requestedGovernance: { mode: 'ask', enforceability: 'advisory' },
    }) as ExecutionSnapshot;
    render(
      <ConsequentialPolicyPreview
        snapshot={snapshot}
        now={10}
        action={{
          identity,
          destination: 'https://example.test',
          effect: 'Publish',
          requestedMode: 'autopilot',
          scope: { host: 'web', scheduled: true, surface: 'browser' },
        }}
      />
    );
    const preview = screen.getByTestId('consequential-policy-preview');
    expect(preview.dataset.policyStatus).toBe('needs-you');
    expect(screen.getByText('Needs you')).toBeTruthy();
    expect(screen.getByText('host-scope-widening')).toBeTruthy();
  });
});
