import { test, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { McpCard } from '@renderer/pages/settings/McpLibrary/components/McpCard';

const fakeEntry = {
  id: 'test/x',
  name: 'Test Service',
  shortDescription: 'Does a thing.',
  iconUrl: 'icons/test.svg',
  tier: 'core' as const,
  categories: ['communication'],
  maintainerType: 'wayland' as const,
  verifiedByWayland: '2026-05-01',
  popularityRank: 5,
  installRate: 0.42,
  entryUrl: 'entries/x.json',
  guideUrl: 'guides/x.md',
};

test('renders title, description, tier and maintainer badges', () => {
  render(<McpCard entry={fakeEntry} installed={false} onClick={() => {}} />);
  expect(screen.getByText('Test Service')).toBeInTheDocument();
  expect(screen.getByText('Does a thing.')).toBeInTheDocument();
  expect(screen.getByText(/Core/)).toBeInTheDocument();
  expect(screen.getByText(/Built by Wayland/)).toBeInTheDocument();
});

test('shows Installed pill when installed=true', () => {
  render(<McpCard entry={fakeEntry} installed={true} onClick={() => {}} />);
  expect(screen.getByText(/Installed/)).toBeInTheDocument();
});
