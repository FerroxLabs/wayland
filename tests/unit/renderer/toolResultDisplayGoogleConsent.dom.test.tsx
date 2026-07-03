/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockOpenExternalUrl = vi.fn();

vi.mock('@/common', () => ({ ipcBridge: {} }));
// CollapsibleContent pulls ThemeProvider context; mock it to children-only so
// the test stays focused on the consent button, not the collapsible internals.
vi.mock('@renderer/components/chat/CollapsibleContent', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => React.createElement('div', {}, children),
}));
vi.mock('@/renderer/utils/platform', () => ({
  openExternalUrl: (url: string) => mockOpenExternalUrl(url),
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import { ToolResultDisplay } from '@/renderer/pages/conversation/Messages/components/MessageToolGroup';

const consentUrl =
  'https://accounts.google.com/o/oauth2/auth?client_id=123.apps.googleusercontent.com&scope=gmail&response_type=code';

const content = (over: Record<string, unknown>) => ({ type: 'tool', status: 'success', ...over }) as never;

describe('ToolResultDisplay Google consent button (#475)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders an "open in browser" button for a start_google_auth consent result and opens the URL', () => {
    render(
      <ToolResultDisplay
        content={content({
          name: 'io-github-taylorwilsdon-google-workspace-mcp__start_google_auth',
          resultDisplay: `Authorize here: ${consentUrl}`,
        })}
      />
    );

    const btn = screen.getByText('conversation.tool.openGoogleConsent');
    expect(btn).toBeInTheDocument();

    fireEvent.click(btn);
    expect(mockOpenExternalUrl).toHaveBeenCalledWith(consentUrl);
  });

  it('does not render the button for an unrelated tool result', () => {
    render(
      <ToolResultDisplay content={content({ name: 'search_gmail_messages', resultDisplay: `see ${consentUrl}` })} />
    );
    expect(screen.queryByText('conversation.tool.openGoogleConsent')).not.toBeInTheDocument();
    expect(mockOpenExternalUrl).not.toHaveBeenCalled();
  });

  it('does not render the button when start_google_auth returned no consent URL', () => {
    render(
      <ToolResultDisplay content={content({ name: 'start_google_auth', resultDisplay: 'Already authenticated.' })} />
    );
    expect(screen.queryByText('conversation.tool.openGoogleConsent')).not.toBeInTheDocument();
  });
});
