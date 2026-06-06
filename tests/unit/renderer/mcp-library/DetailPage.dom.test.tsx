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
  // Tab label uses "Setup guide" - case-insensitive regex
  expect(screen.getByText(/Setup guide/i)).toBeInTheDocument();
  expect(screen.getByText(/Wayland verified/)).toBeInTheDocument();
});
