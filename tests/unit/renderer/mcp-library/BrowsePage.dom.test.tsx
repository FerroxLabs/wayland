import { test, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BrowsePage } from '@renderer/pages/settings/McpLibrary/BrowsePage';

test('BrowsePage renders Recommended section + multiple category headings', () => {
  render(
    <MemoryRouter>
      <BrowsePage />
    </MemoryRouter>,
  );
  expect(screen.getByText(/Recommended for you/)).toBeInTheDocument();
  expect(
    screen.getAllByText(/^Communication$|^Productivity|^Developer|^Search|^Personal/).length,
  ).toBeGreaterThanOrEqual(3);
});

test('BrowsePage renders Google Workspace card', () => {
  render(
    <MemoryRouter>
      <BrowsePage />
    </MemoryRouter>,
  );
  // Multiple cards may have the name (one in recommended, one in category) - getAllByText
  expect(screen.getAllByText('Google Workspace').length).toBeGreaterThan(0);
});
