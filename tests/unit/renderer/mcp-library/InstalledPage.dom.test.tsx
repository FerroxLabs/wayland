import { test, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { InstalledPage } from '@renderer/pages/settings/McpLibrary/InstalledPage';

test('groups installed servers into From Library and Custom', () => {
  render(
    <MemoryRouter>
      <InstalledPage />
    </MemoryRouter>,
  );
  expect(screen.getByText(/From Library/)).toBeInTheDocument();
  expect(screen.getByText(/^Custom$/)).toBeInTheDocument();
});
