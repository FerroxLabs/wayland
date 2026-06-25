/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * Guards the onboarding "Gemini key" door. Google retired the free OAuth Gemini
 * path (June 2026), so the door must send the user to Google AI Studio for a
 * real key and advance to the paste step - never the old one-click OAuth.
 */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockOpenExternalUrl = vi.fn();
vi.mock('@renderer/utils/platform', () => ({
  openExternalUrl: (...args: unknown[]) => mockOpenExternalUrl(...args),
}));

const mockConnectFlux = vi.fn();
const mockRegistryConnect = vi.fn();
vi.mock('@/common', () => ({
  ipcBridge: {
    onboarding: { connectFlux: { invoke: (...a: unknown[]) => mockConnectFlux(...a) } },
    modelRegistry: { connect: { invoke: (...a: unknown[]) => mockRegistryConnect(...a) } },
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? _key,
  }),
}));

// eslint-disable-next-line import/first
import ConnectDoors from '@renderer/components/onboarding/ConnectDoors';
// eslint-disable-next-line import/first
import type { DetectionResult } from '@/common/types/onboarding';

// envKeys empty -> the "detected key" door doesn't render; flux + Gemini doors do.
const detection = { envKeys: [] } as unknown as DetectionResult;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ConnectDoors - Gemini key door', () => {
  it('opens Google AI Studio for a key and advances to the paste step', () => {
    const onPasteKey = vi.fn();
    const onConnected = vi.fn();
    render(<ConnectDoors detection={detection} onConnected={onConnected} onPasteKey={onPasteKey} />);

    fireEvent.click(screen.getByTestId('connect-door-google'));

    expect(mockOpenExternalUrl).toHaveBeenCalledWith('https://aistudio.google.com/apikey');
    expect(onPasteKey).toHaveBeenCalledTimes(1);
    // It must NOT silently "connect" a provider (the dead OAuth path did this).
    expect(mockRegistryConnect).not.toHaveBeenCalled();
    expect(onConnected).not.toHaveBeenCalled();
  });

  it('labels the door as a free Gemini key, not a Google sign-in', () => {
    render(<ConnectDoors detection={detection} onConnected={vi.fn()} onPasteKey={vi.fn()} />);
    const door = screen.getByTestId('connect-door-google');
    expect(door.textContent).toContain('Gemini key');
    expect(door.textContent).not.toContain('Continue with Google');
  });
});
