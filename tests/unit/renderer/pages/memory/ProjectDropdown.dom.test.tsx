/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * DOM tests for ProjectDropdown.
 */

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ProjectSummary } from '@/common/types/memory';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string) => fallback ?? _key,
  }),
}));

vi.mock('@arco-design/web-react', async () => {
  const React2 = await import('react');

  const MenuItem = ({
    children,
    onClick,
    'data-testid': testId,
    disabled,
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
    'data-testid'?: string;
    disabled?: boolean;
  }) =>
    React2.createElement('div', { 'data-testid': testId, onClick: disabled ? undefined : onClick, role: 'menuitem' }, children);

  const Menu = ({
    children,
    onClickMenuItem,
    selectedKeys: _selectedKeys,
  }: {
    children: React.ReactNode;
    onClickMenuItem?: (key: string) => void;
    selectedKeys?: string[];
  }) =>
    React2.createElement(
      'div',
      { 'data-testid': 'arco-menu' },
      React2.Children.map(children, (child) => {
        if (React2.isValidElement(child)) {
          const childKey = (child as React2.ReactElement).key ?? '';
          return React2.cloneElement(child as React2.ReactElement<Record<string, unknown>>, {
            onClick: () => onClickMenuItem?.(childKey),
          });
        }
        return child;
      }),
    );
  (Menu as { Item: typeof MenuItem }).Item = MenuItem;

  return {
    Dropdown: ({
      children,
      droplist,
    }: {
      children: React.ReactNode;
      droplist: React.ReactNode;
    }) => React2.createElement(React2.Fragment, null, children, droplist),
    Menu,
    Input: ({ placeholder, onChange, 'data-testid': testId }: {
      placeholder?: string;
      size?: string;
      onChange?: (val: string) => void;
      allowClear?: boolean;
      'data-testid'?: string;
    }) =>
      React2.createElement('input', {
        placeholder,
        'data-testid': testId,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value),
      }),
  };
});

import ProjectDropdown from '@renderer/pages/memory/components/ProjectDropdown';

const MOCK_PROJECTS: ProjectSummary[] = [
  { path: '/dev/wayland/app', basename: 'wayland-app', count: 42, lastActive: Date.now() },
  { path: '/dev/wayland/engine', basename: 'wayland-engine', count: 18, lastActive: Date.now() },
];

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ProjectDropdown', () => {
  it('renders the trigger button', () => {
    render(
      <ProjectDropdown
        projects={MOCK_PROJECTS}
        selected={null}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByTestId('project-dropdown-btn')).toBeTruthy();
  });

  it('shows "All projects" when nothing selected', () => {
    render(
      <ProjectDropdown
        projects={MOCK_PROJECTS}
        selected={null}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByTestId('project-dropdown-btn').textContent).toContain('All projects');
  });

  it('renders a search input in the panel', () => {
    render(
      <ProjectDropdown
        projects={MOCK_PROJECTS}
        selected={null}
        onSelect={vi.fn()}
      />,
    );
    // Panel is always rendered in DOM via our mock
    expect(screen.getByTestId('project-dropdown-panel')).toBeTruthy();
  });

  it('renders project options', () => {
    render(
      <ProjectDropdown
        projects={MOCK_PROJECTS}
        selected={null}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByTestId('project-option-wayland-app')).toBeTruthy();
    expect(screen.getByTestId('project-option-wayland-engine')).toBeTruthy();
  });

  it('shows project count in row', () => {
    render(
      <ProjectDropdown
        projects={MOCK_PROJECTS}
        selected={null}
        onSelect={vi.fn()}
      />,
    );
    const appOption = screen.getByTestId('project-option-wayland-app');
    expect(appOption.textContent).toContain('42');
  });

  it('shows selected project label in trigger', () => {
    render(
      <ProjectDropdown
        projects={MOCK_PROJECTS}
        selected='/dev/wayland/app'
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByTestId('project-dropdown-btn').textContent).toContain('wayland-app');
  });
});
