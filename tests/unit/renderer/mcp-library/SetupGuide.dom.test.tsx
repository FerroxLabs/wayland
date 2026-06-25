import { test, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SetupGuide } from '@renderer/pages/settings/McpLibrary/components/SetupGuide';
import type { SetupGuide as GuideT } from '@renderer/pages/settings/McpLibrary/types';

const guide: GuideT = {
  guideVersion: '1.0.0',
  estimatedMinutes: 5,
  steps: [
    {
      id: 'install',
      title: 'Install the server',
      estSeconds: 30,
      autoCompletedByInstall: true,
    },
    {
      id: 'key',
      title: 'Paste your API key',
      estSeconds: 60,
      inputs: [{ name: 'API_KEY', label: 'API Key', secret: true }],
    },
    {
      id: 'go',
      title: 'Start the server',
      estSeconds: 10,
      primaryAction: { label: 'Start', action: 'start' },
    },
  ],
  body: '# Setup\n\nFollow the steps.',
};

test('renders all 3 steps', () => {
  render(
    <SetupGuide guide={guide} envValues={{}} onEnvChange={() => {}} onPrimary={() => {}} />,
  );
  expect(screen.getByText('Install the server')).toBeInTheDocument();
  expect(screen.getByText('Paste your API key')).toBeInTheDocument();
  expect(screen.getByText('Start the server')).toBeInTheDocument();
});

test('marks autoCompletedByInstall step as done', () => {
  const { container } = render(
    <SetupGuide guide={guide} envValues={{}} onEnvChange={() => {}} onPrimary={() => {}} />,
  );
  // A completed step renders the Check icon (an <svg>) in its number badge
  // instead of the numeric index. Assert on that rendered signal rather than a
  // CSS Module class name (which is hashed at build time).
  const installStep = container.querySelector('[data-step-id="install"]');
  const goStep = container.querySelector('[data-step-id="go"]');
  expect(installStep?.querySelector('svg')).not.toBeNull();
  expect(goStep?.querySelector('svg')).toBeNull();
});

test('calls onEnvChange when user types in input', () => {
  let captured: { name: string; value: string } | null = null;
  const onEnvChange = (name: string, value: string) => {
    captured = { name, value };
  };
  render(
    <SetupGuide
      guide={guide}
      envValues={{}}
      onEnvChange={onEnvChange}
      onPrimary={() => {}}
    />,
  );
  const input = screen.getByPlaceholderText(/API Key/i);
  fireEvent.change(input, { target: { value: 'sk_test' } });
  expect(captured).toEqual({ name: 'API_KEY', value: 'sk_test' });
});
