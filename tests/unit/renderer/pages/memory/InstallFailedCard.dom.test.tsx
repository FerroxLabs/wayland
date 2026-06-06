/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * Wave 4 - DOM tests for the InstallFailedCard error surface.
 *
 * Covers:
 *   - A known `errorReason` (e.g. `spawn_error`) renders the matching
 *     `memory.error.<reason>` i18n key.
 *   - An unknown reason falls back to `memory.error.unknown`.
 *   - Clicking Retry invokes `ipcBridge.ijfw.triggerInstall`.
 *   - The Details collapse only mounts when a non-empty stderr is supplied.
 */

import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { triggerInstallInvoke } = vi.hoisted(() => ({
  triggerInstallInvoke: vi.fn<() => Promise<{ ok: true } | { ok: false; error: string }>>(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    ijfw: {
      triggerInstall: { invoke: triggerInstallInvoke },
    },
  },
}));

// Lightweight Arco Collapse surrogate - mirrors the props InstallFailedCard
// depends on (`name`, `header`, `onChange`). The body is always rendered so
// tests can assert on the stderr <pre> content without driving a header click.
vi.mock('@arco-design/web-react', () => {
  type CollapseItemProps = {
    name: string;
    header: React.ReactNode;
    children?: React.ReactNode;
  };
  type CollapseProps = {
    onChange?: (key: string, keys: string[]) => void;
    children?: React.ReactNode;
    className?: string;
    bordered?: boolean;
    ['data-testid']?: string;
  };
  type ButtonProps = {
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    disabled?: boolean;
    children?: React.ReactNode;
    ['data-testid']?: string;
  };

  const Collapse: React.FC<CollapseProps> & { Item: React.FC<CollapseItemProps> } = ({
    children,
    className,
    ...rest
  }) => (
    <div className={className} data-testid={rest['data-testid'] ?? 'mock-collapse'}>
      {children}
    </div>
  );

  const CollapseItem: React.FC<CollapseItemProps> = ({ header, children }) => (
    <div>
      <div data-testid='mock-collapse-header'>{header}</div>
      <div data-testid='mock-collapse-body'>{children}</div>
    </div>
  );
  Collapse.Item = CollapseItem;

  const Button: React.FC<ButtonProps> = ({ children, ...props }) => (
    <button type='button' {...props}>
      {children}
    </button>
  );

  return { Collapse, Button };
});

import InstallFailedCard from '@renderer/pages/memory/state-branches/InstallFailedCard';

beforeEach(() => {
  triggerInstallInvoke.mockReset();
  triggerInstallInvoke.mockResolvedValue({ ok: true });
});

afterEach(() => {
  cleanup();
});

describe('InstallFailedCard', () => {
  it('renders the localized message for a known errorReason', () => {
    render(<InstallFailedCard errorReason='spawn_error' />);
    const msg = screen.getByTestId('memory-install-failed-message');
    expect(msg.textContent).toBe('memory.error.spawn_error');
  });

  it('falls back to memory.error.unknown for an unknown errorReason', () => {
    render(<InstallFailedCard errorReason='gibberish' />);
    const msg = screen.getByTestId('memory-install-failed-message');
    expect(msg.textContent).toBe('memory.error.unknown');
  });

  it('falls back to memory.error.unknown when errorReason is missing', () => {
    render(<InstallFailedCard />);
    const msg = screen.getByTestId('memory-install-failed-message');
    expect(msg.textContent).toBe('memory.error.unknown');
  });

  it('invokes ipcBridge.ijfw.triggerInstall when Retry is clicked', async () => {
    render(<InstallFailedCard errorReason='spawn_error' />);
    const retry = screen.getByTestId('memory-install-failed-retry');
    await act(async () => {
      fireEvent.click(retry);
    });
    expect(triggerInstallInvoke).toHaveBeenCalledTimes(1);
  });

  it('renders the Details collapse and raw stderr when stderr prop is present', () => {
    render(<InstallFailedCard errorReason='install_exit_nonzero' stderr='npm ERR! boom' />);
    expect(screen.getByTestId('memory-install-failed-details')).toBeTruthy();
    const pre = screen.getByTestId('memory-install-failed-stderr');
    expect(pre.tagName.toLowerCase()).toBe('pre');
    expect(pre.textContent).toBe('npm ERR! boom');
  });

  it('omits the Details section entirely when stderr is absent', () => {
    render(<InstallFailedCard errorReason='install_exit_nonzero' />);
    expect(screen.queryByTestId('memory-install-failed-details')).toBeNull();
    expect(screen.queryByTestId('memory-install-failed-stderr')).toBeNull();
  });

  it('omits the Details section when stderr is an empty string', () => {
    render(<InstallFailedCard errorReason='install_exit_nonzero' stderr='' />);
    expect(screen.queryByTestId('memory-install-failed-details')).toBeNull();
  });
});
