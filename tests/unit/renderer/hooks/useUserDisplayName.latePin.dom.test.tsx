/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * THE GREETING MUST USE THE NAME THE BUYER TYPED, IN SESSION ONE.
 *
 * Measured on a fresh buyer profile: the wizard was given "Matty",
 * `user.displayName` on disk read 'Matty', and the home screen still greeted
 * "Rise and shine, Sean" - the macOS account name - until the app was
 * relaunched.
 *
 * The precedence in the hook was never wrong (`configuredName || osName`). The
 * read was: a `useEffect` with `[]` deps, running once on mount. `GuidPage` is
 * mounted BEHIND the onboarding modal, so it read the key before onboarding
 * wrote it, got '', fell back to the OS name, and never re-read.
 *
 * This test holds that shape: mount first, write second, assert the rendered
 * name changed WITHOUT a remount. It fails on the one-shot `useEffect`.
 */

import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mutate as globalMutate } from 'swr';

const store = new Map<string, string>();
vi.mock('@/common/config/storage', () => ({
  ConfigStorage: {
    get: vi.fn(async (k: string) => store.get(k)),
    set: vi.fn(async (k: string, v: string) => {
      store.set(k, v);
    }),
  },
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    application: { systemInfo: { invoke: vi.fn(async () => ({ userName: 'Sean' })) } },
  },
}));

import { ConfigStorage } from '@/common/config/storage';
import {
  USER_DISPLAY_NAME_SWR_KEY,
  announceUserDisplayName,
  useUserDisplayName,
} from '@renderer/hooks/system/useUserDisplayName';

function Greeting() {
  const { resolvedName } = useUserDisplayName();
  return <div data-testid='greeting'>{resolvedName}</div>;
}

const mount = () => render(<Greeting />);

const settle = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

describe('useUserDisplayName — the name written during onboarding', () => {
  beforeEach(() => {
    store.clear();
  });
  // SWR's cache is module-global, exactly as it is in the app. Drop the key
  // between tests or test two reads the name test one stored and passes for
  // the wrong reason.
  afterEach(async () => {
    cleanup();
    await globalMutate(USER_DISPLAY_NAME_SWR_KEY, undefined, { revalidate: false });
    vi.clearAllMocks();
  });

  it('re-reads the stored name when onboarding announces it, with no remount', async () => {
    // The home page is already mounted behind the onboarding modal, and the
    // key is not written yet: it can only resolve to the OS account name.
    mount();
    await settle();
    expect(screen.getByTestId('greeting').textContent).toBe('Sean');

    // Onboarding finishes and writes the name the buyer typed.
    await act(async () => {
      await ConfigStorage.set('user.displayName', 'Matty');
      announceUserDisplayName();
    });
    await settle();

    expect(screen.getByTestId('greeting').textContent).toBe('Matty');
  });

  it('keeps the OS account name when the buyer typed nothing', async () => {
    mount();
    await settle();
    expect(screen.getByTestId('greeting').textContent).toBe('Sean');

    await act(async () => {
      announceUserDisplayName();
    });
    await settle();
    expect(screen.getByTestId('greeting').textContent).toBe('Sean');
  });
});
