import { test, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMcpLibrary } from '@renderer/pages/settings/McpLibrary/hooks/useMcpLibrary';

test('returns 56 entries sorted by popularityRank', () => {
  const { result } = renderHook(() => useMcpLibrary());
  expect(result.current.entries.length).toBe(56);
  expect(result.current.entries[0].popularityRank).toBeLessThanOrEqual(result.current.entries[1].popularityRank);
});

test('recommended returns first 6 by rank', () => {
  const { result } = renderHook(() => useMcpLibrary());
  expect(result.current.recommended.length).toBe(6);
  expect(result.current.recommended[0].id).toContain('google-workspace');
});

test('byTier groups correctly', () => {
  const { result } = renderHook(() => useMcpLibrary());
  expect(result.current.byTier.core.length).toBe(11);
  expect(result.current.byTier.worker.length).toBe(21);
  expect(result.current.byTier.builder.length).toBe(24);
});

test('getEntry returns full detail for a known id', () => {
  const { result } = renderHook(() => useMcpLibrary());
  const entry = result.current.getEntry('io.github.taylorwilsdon/google-workspace-mcp');
  expect(entry?.title).toBe('Google Workspace');
  expect(entry?.['x-wayland'].auth.method).toBe('oauth2-byo');
});

test('getGuide parses frontmatter steps', () => {
  const { result } = renderHook(() => useMcpLibrary());
  const guide = result.current.getGuide('io.github.taylorwilsdon/google-workspace-mcp');
  expect(guide.steps.length).toBe(4);
  expect(guide.steps[0].id).toBe('install');
  expect(guide.steps[2].inputs?.[0].name).toBe('GOOGLE_OAUTH_CLIENT_ID');
});

test('iconUrl is resolved through Vite, not left as a literal "icons/*.svg" path', () => {
  const { result } = renderHook(() => useMcpLibrary());
  for (const e of result.current.entries) {
    expect(e.iconUrl.startsWith('icons/')).toBe(false);
  }
  const detail = result.current.getEntry('io.github.taylorwilsdon/google-workspace-mcp');
  expect(detail?.['x-wayland'].iconUrl.startsWith('icons/')).toBe(false);
});
