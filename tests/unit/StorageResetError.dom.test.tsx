/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback || key }),
}));

vi.mock('@renderer/pages/settings/StorageSettings/UsageCard', () => ({ default: () => <div /> }));
vi.mock('@renderer/pages/settings/StorageSettings/ManagedWorkspacesCard', () => ({ default: () => <div /> }));
vi.mock('@renderer/pages/settings/StorageSettings/DirectoriesCard', () => ({ default: () => <div /> }));
vi.mock('@renderer/pages/settings/StorageSettings/BackupCard', () => ({ default: () => <div /> }));
vi.mock('@renderer/pages/settings/StorageSettings/SyncCard', () => ({ default: () => <div /> }));
vi.mock('@renderer/pages/settings/components/SettingsPageShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import StorageSettings from '@renderer/pages/settings/StorageSettings/index';

describe('StorageSettings reset recovery gate', () => {
  it('explains the recovery requirement and exposes no destructive reset action', () => {
    render(<StorageSettings />);

    expect(screen.getByText('settings.storagePage.resetRecoveryRequired')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'settings.storagePage.resetUnavailable' })).toBeDisabled();
    expect(screen.queryByText('settings.storagePage.resetAction')).not.toBeInTheDocument();
  });
});
