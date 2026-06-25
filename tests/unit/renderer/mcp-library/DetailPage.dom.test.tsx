import { test, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { DetailPage } from '@renderer/pages/settings/McpLibrary/DetailPage';

test('renders Google Workspace detail page', () => {
  const id = encodeURIComponent('io.github.taylorwilsdon/google-workspace-mcp');
  render(
    <MemoryRouter initialEntries={[`/settings/mcp-library/${id}`]}>
      <Routes>
        <Route path="/settings/mcp-library/:entryId" element={<DetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
  expect(screen.getByText('Google Workspace')).toBeInTheDocument();
  // Redesigned detail page: the setup tab label is now "Setup".
  expect(screen.getByText(/^Setup$/i)).toBeInTheDocument();
  // The old "Wayland verified" badge text is gone; the hero now renders a
  // maintainer tag (this entry is community-maintained) alongside a
  // verified-tick icon. Assert the maintainer tag to prove the hero rendered.
  expect(screen.getByText(/^Community$/)).toBeInTheDocument();
});
