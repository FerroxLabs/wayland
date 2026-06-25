import { describe, expect, it } from 'vitest';

import {
  getLastDirectoryName,
  getWorkspaceDisplayName,
  isTemporaryWorkspace,
} from '@/renderer/utils/workspace/workspace';

describe('workspace utils', () => {
  it('shows only the last directory for Unix-style workspace paths', () => {
    expect(getWorkspaceDisplayName('/Users/demo/projects/Wayland')).toBe('Wayland');
  });

  it('shows only the last directory for Windows-style workspace paths', () => {
    expect(getWorkspaceDisplayName('E:\\code\\taichuCode\\Wayland')).toBe('Wayland');
  });

  it('detects temporary workspaces on Windows-style paths', () => {
    expect(isTemporaryWorkspace('C:\\Users\\demo\\codex-temp-1741680000000')).toBe(true);
  });

  it('extracts the last directory name from Windows-style paths', () => {
    expect(getLastDirectoryName('D:\\workspace\\feature-demo')).toBe('feature-demo');
  });

  // #274: prefer the user-defined project name over the folder basename.
  it('prefers the project name over the folder basename when provided', () => {
    expect(getWorkspaceDisplayName('/Users/demo/projects/myapp/src', undefined, 'My Cool App')).toBe('My Cool App');
  });

  it('falls back to the folder basename when no project name is given', () => {
    expect(getWorkspaceDisplayName('/Users/demo/projects/myapp/src')).toBe('src');
  });
});
