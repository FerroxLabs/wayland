/**
 * @vitest-environment jsdom
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import express from 'express';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const harness = vi.hoisted(() => ({
  desktop: false,
  handlers: new Map<string, (...args: unknown[]) => unknown>(),
  archiveRestore: vi.fn(),
  classicDecide: vi.fn(),
  classicMetadata: vi.fn(),
}));

vi.mock('@renderer/utils/platform', () => ({ isElectronDesktop: () => harness.desktop }));
vi.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, handler: (...args: unknown[]) => unknown) => harness.handlers.set(channel, handler),
  },
}));
vi.mock('@process/bridge/webuiDirectAuth', () => ({ enforceRateLimit: () => true }));
vi.mock('@process/webserver/middleware/security', () => ({
  apiRateLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
}));
vi.mock('@process/webserver/routes/configWriteGuards', () => ({
  redactSecrets: (value: string) => value,
  requireDestructive: async () => true,
  requireSecureConfigWrite: () => true,
  verifyStepUp: async () => true,
}));
vi.mock('@process/webserver/routes/constitutionEditGrant', () => ({
  authorizeConstitutionEditGrant: () => ({ authorized: true }),
  CONSTITUTION_EDIT_GRANT_HEADER: 'x-wayland-constitution-edit-grant',
  isConstitutionEditScope: () => true,
  issueConstitutionEditGrant: () => null,
  revokeConstitutionEditGrant: () => undefined,
}));
vi.mock('@process/webserver/middleware/detectNetworkContext', () => ({
  detectNetworkContext: () => ({ reachedVia: 'direct' }),
}));
vi.mock('@process/webserver/audit/auditLog', () => ({ appendAudit: async () => true }));
vi.mock('@process/webserver/middleware/csrfClient', () => ({ getCsrfToken: () => 'journey-csrf' }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback: string) => fallback }),
}));
vi.mock('@arco-design/web-react', () => {
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- Vitest mock factories cannot reference outer bindings.
  const TextInput = ({
    value,
    onChange,
    placeholder,
    disabled,
  }: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
  }) => (
    <input
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    />
  );
  TextInput.Password = TextInput;
  return {
    Button: ({
      children,
      onClick,
      disabled,
      loading,
      'aria-label': ariaLabel,
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; status?: string }) => (
      <button type='button' onClick={onClick} disabled={disabled || loading} aria-label={ariaLabel}>
        {children}
      </button>
    ),
    Input: TextInput,
  };
});

import { initConstitutionBridge } from '@process/bridge/constitutionBridge';
import { registerConstitutionRoutes } from '@process/webserver/routes/constitutionRoutes';
import ConstitutionClassicRecovery from '@renderer/pages/settings/ConstitutionSettings/ConstitutionClassicRecovery';
import ConstitutionRecovery from '@renderer/pages/settings/ConstitutionSettings/ConstitutionRecovery';

const operationId = '11111111-1111-4111-8111-111111111111';
const projectionReceiptSha256 = `sha256:${'a'.repeat(64)}` as const;
const journalHeadSha256 = `sha256:${'b'.repeat(64)}` as const;
const archive = {
  archiveId: '22222222-2222-4222-8222-222222222222',
  archivedAt: '2026-07-17T01:02:03.004Z',
  targetKind: 'constitution' as const,
  specialistId: null,
  sourceName: 'CONSTITUTION.md',
  bytes: 42,
  targetRevision: 'rev:v1:archive',
};
const inventory = {
  success: true as const,
  data: {
    contract: 'wayland-constitution-archive-recovery-dto/1.0' as const,
    archives: [archive],
  },
};
const metadata = {
  success: true as const,
  data: {
    contract: 'wayland-constitution-classic-recovery-dto/1.0' as const,
    recoveryRevision: 'recovery:v1',
    projectionReceiptSha256,
    promotionId: null,
    journalHeadSha256: null,
    state: 'awaiting-decision' as const,
    items: [
      {
        objectId: 'constitution',
        operation: 'replace' as const,
        state: 'pending' as const,
        resultRevision: null,
        receiptId: null,
        conflictCode: null,
      },
    ],
    rescue: null,
    allowedActions: ['promote', 'keep-v2', 'discard'] as const,
    discardChallenge: 'DISCARD constitution',
  },
};
const classicCommitted = {
  success: true as const,
  data: {
    status: 'committed' as const,
    operationId,
    recoveryRevision: 'recovery:v2',
    promotionId: '33333333-3333-4333-8333-333333333333',
    journalHeadSha256,
    receiptId: 'receipt:classic:journey',
    items: [
      {
        objectId: 'constitution',
        operation: 'replace' as const,
        state: 'committed' as const,
        resultRevision: 'rev:v1:classic-restored',
        receiptId: 'receipt:classic:item',
        conflictCode: null,
      },
    ],
    rescue: null,
  },
};
const desktopPrincipal = {
  kind: 'desktop-installation' as const,
  installationId: '44444444-4444-4444-8444-444444444444',
};

const archiveRecovery = {
  listArchives: () => inventory,
  desktopPrincipalBinding: () => desktopPrincipal,
  hostedPrincipalBinding: (subject: string) => ({ kind: 'hosted-subject' as const, subject }),
  restore: (...args: unknown[]) => harness.archiveRestore(...args),
};
const classicRecovery = {
  metadata: (...args: unknown[]) => harness.classicMetadata(...args),
  decide: (...args: unknown[]) => harness.classicDecide(...args),
  resume: vi.fn(),
};
const constitutionFs = {
  capability: () => ({ supported: true }),
} as never;

const executeExclusive = async <T,>(
  action: () => Promise<{ committed: boolean; value: T }>
): Promise<{ committed: boolean; value: T }> => action();

function invoke(channel: string, ...args: unknown[]): Promise<unknown> {
  const handler = harness.handlers.get(channel);
  if (!handler) throw new Error(`Missing IPC handler: ${channel}`);
  return Promise.resolve(handler({ sender: { id: 1 } }, ...args));
}

describe('Constitution recovery actual consumer journeys', () => {
  let server: http.Server;
  let baseUrl: string;
  const originalFetch = globalThis.fetch;

  beforeAll(async () => {
    initConstitutionBridge(
      constitutionFs,
      archiveRecovery as never,
      () => true,
      async () => classicRecovery as never
    );
    Object.defineProperty(window, 'electronAPI', {
      configurable: true,
      value: {
        listConstitutionArchives: () => invoke('constitution:archives:list'),
        restoreConstitutionArchive: (request: unknown) => invoke('constitution:archives:restore', request),
        getConstitutionClassicRecovery: () => invoke('constitution:classic-recovery:get'),
        decideConstitutionClassicRecovery: (request: unknown) =>
          invoke('constitution:classic-recovery:decision', request),
        resumeConstitutionClassicRecovery: (request: unknown) =>
          invoke('constitution:classic-recovery:resume', request),
      },
    });

    const app = express();
    app.use(express.json());
    registerConstitutionRoutes(
      app,
      (req, _res, next) => {
        req.user = { id: 'hosted-user' } as never;
        next();
      },
      constitutionFs,
      archiveRecovery as never,
      async () => classicRecovery as never
    );
    server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    globalThis.fetch = (input, init) => originalFetch(new URL(String(input), baseUrl), init);
  });

  afterAll(async () => {
    globalThis.fetch = originalFetch;
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  });

  beforeEach(() => {
    window.localStorage.clear();
    harness.archiveRestore.mockReset();
    harness.archiveRestore.mockResolvedValue({
      revision: 'rev:v1:restored',
      receiptId: 'receipt:archive:journey',
    });
    harness.classicMetadata.mockReset();
    harness.classicMetadata.mockResolvedValue(metadata);
    harness.classicDecide.mockReset();
    harness.classicDecide.mockResolvedValue(classicCommitted);
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(operationId);
  });

  it.each([
    ['hosted HTTP', false],
    ['Desktop IPC', true],
  ] as const)(
    'carries archive operation identity through the actual %s client and mounted renderer',
    async (_lane, desktop) => {
      harness.desktop = desktop;
      const onRestored = vi.fn();
      render(
        <ConstitutionRecovery
          expectedRevision='rev:v1:live'
          principalScope={desktop ? 'desktop:installation' : 'hosted:hosted-user'}
          executeExclusive={executeExclusive}
          onRestored={onRestored}
        />
      );

      fireEvent.click(await screen.findByRole('button', { name: /Main Constitution/i }));
      fireEvent.change(screen.getByPlaceholderText('Current Wayland password'), { target: { value: 'correct' } });
      fireEvent.click(screen.getByRole('button', { name: 'Restore archive' }));

      await waitFor(() => expect(onRestored).toHaveBeenCalledTimes(1));
      expect(harness.archiveRestore).toHaveBeenCalledTimes(1);
      expect(harness.archiveRestore.mock.calls[0]![1]).toEqual({
        operationId,
        archiveId: archive.archiveId,
        expectedArchiveRevision: archive.targetRevision,
        password: 'correct',
        expectedRevision: 'rev:v1:live',
      });
      expect(harness.archiveRestore.mock.calls[0]![0]).toMatchObject(
        desktop ? desktopPrincipal : { kind: 'hosted-subject', subject: 'hosted-user' }
      );
      expect(window.localStorage.length).toBe(0);
    }
  );

  it.each([
    ['hosted HTTP', false],
    ['Desktop IPC', true],
  ] as const)(
    'carries Classic operation identity through the actual %s client and mounted renderer',
    async (_lane, desktop) => {
      harness.desktop = desktop;
      const onRestored = vi.fn();
      render(
        <ConstitutionClassicRecovery
          principalScope={desktop ? 'desktop:installation' : 'hosted:hosted-user'}
          executeExclusive={executeExclusive}
          onRestored={onRestored}
        />
      );

      fireEvent.click(await screen.findByRole('button', { name: 'Apply Classic work' }));
      fireEvent.change(screen.getByPlaceholderText('Current Wayland password'), { target: { value: 'correct' } });
      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

      await waitFor(() => expect(onRestored).toHaveBeenCalledTimes(1));
      expect(harness.classicDecide).toHaveBeenCalledTimes(1);
      expect(harness.classicDecide.mock.calls[0]![1]).toMatchObject({
        operationId,
        projectionReceiptSha256,
        expectedRecoveryRevision: 'recovery:v1',
        password: 'correct',
        decision: { kind: 'promote' },
      });
      expect(harness.classicDecide.mock.calls[0]![0]).toMatchObject(
        desktop ? desktopPrincipal : { kind: 'hosted-subject', subject: 'hosted-user' }
      );
      expect(window.localStorage.length).toBe(0);
    }
  );
});
