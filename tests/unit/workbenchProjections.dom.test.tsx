/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="@testing-library/jest-dom/vitest" />

import {
  createExecutionSnapshot,
  type ExecutionActivity,
  type ExecutionOutcome,
  type ExecutionOutcomeTrust,
  type ExecutionSnapshot,
  type TrustedArtifactReceipt,
} from '@/common/execution';
import WorkbenchHost from '@/renderer/pages/conversation/components/WorkbenchHost';
import ExecutionWorkbenchProjections, {
  deriveWorkbenchProjections,
} from '@/renderer/pages/conversation/components/WorkbenchHost/projections';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const identity = { runId: 'run-projection', turnId: 'turn-1', correlationId: 'corr-1' } as const;
const digest = `sha256:${'a'.repeat(64)}`;

const snapshot = (
  overrides: Partial<{
    actor: ExecutionSnapshot['actor'];
    scope: ExecutionSnapshot['scope'];
    lifecycle: ExecutionSnapshot['lifecycle'];
    activities: readonly ExecutionActivity[];
    outcomes: readonly ExecutionOutcome[];
    outcomeTrust: readonly ExecutionOutcomeTrust[];
    receipts: ExecutionSnapshot['receipts'];
  }> = {}
): ExecutionSnapshot => {
  const base = createExecutionSnapshot({
    identity,
    actor: overrides.actor ?? { backend: 'acp', agentId: 'agent-1' },
    scope: overrides.scope ?? {
      workspaceId: 'workspace-1',
      host: 'desktop',
      trust: 'unknown',
      scheduled: false,
    },
    requestedGovernance: { mode: 'ask', enforceability: 'advisory' },
  });
  return {
    ...base,
    ...(overrides.lifecycle ? { lifecycle: overrides.lifecycle } : {}),
    activities: overrides.activities ?? base.activities,
    outcomes: overrides.outcomes ?? base.outcomes,
    outcomeTrust: overrides.outcomeTrust ?? base.outcomeTrust,
    receipts: overrides.receipts ?? base.receipts,
  };
};

const renderProjections = (value: ExecutionSnapshot) =>
  render(
    <WorkbenchHost conversationId='projection-test'>
      <main data-testid='chat'>chat</main>
      <ExecutionWorkbenchProjections snapshot={value} />
    </WorkbenchHost>
  );

describe('M6 relevant-only workbench projections', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => cleanup());

  it('omits unsupported lanes instead of presenting empty power surfaces', () => {
    const value = snapshot({
      activities: [{ id: 'terminal-1', kind: 'tool', name: 'Run terminal command', status: 'completed' }],
      outcomes: [{ id: 'file-1', kind: 'file', label: 'report.ts', uri: '/workspace/report.ts' }],
    });

    expect(deriveWorkbenchProjections(value).map((item) => item.id)).toEqual(['development']);
  });

  it('discloses automation, team, Core, and browser lanes only from canonical scope evidence', () => {
    const value = snapshot({
      actor: { backend: 'wcore', agentId: 'core' },
      scope: {
        workspaceId: 'workspace-1',
        host: 'desktop',
        trust: 'trusted',
        scheduled: true,
        surface: 'automation',
        teamId: 'team-1',
        browserSessionId: 'browser-1',
      },
      activities: [{ id: 'cron-1', kind: 'system', name: 'Scheduled trigger', status: 'running' }],
    });

    expect(deriveWorkbenchProjections(value).map((item) => item.id)).toEqual([
      'browser-cua',
      'automation',
      'team',
      'core',
    ]);
  });

  it('switches registry-provided lanes and facets without mounting a second host', async () => {
    renderProjections(
      snapshot({
        activities: [
          { id: 'research-1', kind: 'tool', name: 'Research sources', status: 'completed' },
          { id: 'terminal-1', kind: 'tool', name: 'Run terminal command', status: 'completed' },
        ],
        outcomes: [
          { id: 'report-1', kind: 'report', label: 'Research report' },
          { id: 'citation-1', kind: 'report', label: 'Citation index' },
          { id: 'file-1', kind: 'file', label: 'report.ts', uri: '/workspace/report.ts' },
        ],
      })
    );

    expect(await screen.findByTestId('projection-development')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Knowledge' }));
    expect(await screen.findByTestId('projection-knowledge')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Citations' }));
    expect(screen.getByText('Citation index')).toBeInTheDocument();
    expect(document.querySelectorAll('[data-testid="workbench-host"]')).toHaveLength(1);
    expect(document.querySelectorAll('[data-testid="workbench-panel"]')).toHaveLength(1);
  });

  it.each(['verified', 'receipt-stale', 'source-dependency-stale'] as const)(
    'passes canonical %s receipt trust through unchanged',
    async (status) => {
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
        producerSequence: 1,
        artifactDigest: digest,
        gateClosureDigest: digest,
        bodyDigest: digest,
        status,
      };
      renderProjections(
        snapshot({
          actor: { backend: 'wcore', agentId: 'core' },
          receipts: [receipt],
          outcomes: [{ id: 'artifact-1', kind: 'artifact', label: 'Output', receiptId: receipt.id }],
          outcomeTrust: [{ receiptId: receipt.id, outcomeId: 'artifact-1', artifactDigest: digest, status }],
        })
      );

      fireEvent.click(await screen.findByRole('button', { name: 'Core' }));
      fireEvent.click(screen.getByRole('button', { name: 'Receipts' }));
      expect(await screen.findByTestId('receipt-trust-surface')).toHaveAttribute('data-trust-status', status);
    }
  );

  it('refuses a verified display when the canonical trust claim has no matching Core receipt', async () => {
    renderProjections(
      snapshot({
        actor: { backend: 'wcore', agentId: 'core' },
        outcomes: [{ id: 'artifact-1', kind: 'artifact', label: 'Output', receiptId: 'missing-receipt' }],
        outcomeTrust: [
          { receiptId: 'missing-receipt', outcomeId: 'artifact-1', artifactDigest: digest, status: 'verified' },
        ],
      })
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Core' }));
    fireEvent.click(screen.getByRole('button', { name: 'Receipts' }));
    expect(await screen.findByTestId('receipt-trust-surface')).toHaveAttribute('data-trust-status', 'unvalidated');
    expect(screen.getByText('Trusted Core receipt unavailable.')).toBeInTheDocument();
  });

  it('uses the actual run scope for a fail-closed consequential approval preview', async () => {
    renderProjections(
      snapshot({
        scope: {
          workspaceId: 'workspace-1',
          host: 'desktop',
          trust: 'unknown',
          scheduled: false,
          surface: 'browser',
          browserSessionId: 'browser-1',
        },
        activities: [
          {
            id: 'approval-1',
            kind: 'approval',
            name: 'Publish customer report',
            detail: 'Send to https://example.test/report',
            status: 'waiting',
          },
        ],
      })
    );

    const preview = await screen.findByTestId('consequential-policy-preview');
    expect(preview).toHaveAttribute('data-policy-status', 'needs-you');
    expect(screen.getByText('https://example.test/report')).toBeInTheDocument();
    expect(screen.getByText('Trusted Core policy unavailable')).toBeInTheDocument();
    expect(screen.getByText('trusted-core-policy-unavailable')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByTestId('workbench-panel')).toHaveAttribute('data-section-id', 'projection:consequential')
    );
  });
});
