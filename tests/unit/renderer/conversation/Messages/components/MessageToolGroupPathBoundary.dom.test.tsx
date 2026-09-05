/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1099 — the `path_boundary` arm in MessageToolGroup's useConfirmationButtons
 * is a GUARD, not a formality, and this file exists so deleting it goes red.
 *
 * `default:` in that switch IS the mcp case. Drop the boundary arm and a
 * filesystem-boundary escalation falls through to it: the inline card asks
 * `messages.confirmation.allowMCPTool` and renders radios for proceed_once /
 * proceed_always_tool / proceed_always_server. `proceed_always*` is exactly the
 * vocabulary Wayland's auto-approve paths match on, so the one decision that
 * widens filesystem authority OUTSIDE the workspace would be answerable here,
 * in the words that get approved without a human. The boundary is answered by
 * PathBoundaryConfirmCard and nowhere else.
 *
 * Every assertion is paired with an `mcp` positive control in this same file.
 * Without one, these tests could pass because the fixture never reached the
 * switch at all — which is how the pre-existing suite stayed green with the arm
 * deleted.
 */
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { IMessageToolGroup } from '@/common/chat/chatLib';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    geminiConversation: { confirmMessage: { invoke: vi.fn(() => Promise.resolve()) } },
    fs: { getImageBase64: { invoke: vi.fn(() => Promise.resolve('')) } },
  },
}));

// MessageToolGroup pulls ImagePreviewContext from MessageList, whose module
// graph reaches the whole conversation surface. Only the context is needed.
vi.mock('@/renderer/pages/conversation/Messages/MessageList', () => ({
  ImagePreviewContext: React.createContext({ inPreviewGroup: false }),
}));

vi.mock('@renderer/components/Markdown', () => ({
  default: ({ children }: React.PropsWithChildren) => <pre>{children}</pre>,
}));

vi.mock('@renderer/components/chat/CollapsibleContent', () => ({
  default: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

vi.mock('@arco-design/web-react', () => {
  const Radio = ({ value, children }: { value: string; children?: React.ReactNode }) => (
    <label data-testid='confirm-option' data-value={String(value)}>
      {children}
    </label>
  );
  Radio.Group = ({ children }: React.PropsWithChildren) => <div>{children}</div>;
  return {
    Alert: ({ content }: { content?: React.ReactNode }) => <div>{content}</div>,
    Button: ({ children }: React.PropsWithChildren) => <button type='button'>{children}</button>,
    Image: () => null,
    Message: { useMessage: () => [{ success: vi.fn(), error: vi.fn() }, null] },
    Radio,
    Tag: ({ children }: React.PropsWithChildren) => <span>{children}</span>,
    Tooltip: ({ children }: React.PropsWithChildren) => <>{children}</>,
  };
});

import MessageToolGroup from '@/renderer/pages/conversation/Messages/components/MessageToolGroup';

const ROOT = '/Users/sean/Documents/reports';
const TARGET = `${ROOT}/q3.md`;
const MCP_LABEL_KEY = 'messages.confirmation.allowMCPTool';
const WIDENING_OUTCOMES = ['proceed_once', 'proceed_always', 'proceed_always_tool', 'proceed_always_server'];

const boundaryDetails = {
  type: 'path_boundary',
  title: `Read ${TARGET}`,
  target: TARGET,
  suggestedRoot: ROOT,
  access: 'read',
};

const mcpDetails = {
  type: 'mcp',
  title: 'Run search',
  toolName: 'search',
  toolDisplayName: 'Search the web',
  serverName: 'brave-search',
};

function renderConfirming(confirmationDetails: Record<string, unknown>) {
  const message = {
    id: 'msg-1099',
    conversation_id: 'conv-1099',
    type: 'tool_group',
    position: 'left',
    content: [
      {
        callId: 'call-1',
        name: 'Read',
        description: TARGET,
        renderOutputAsMarkdown: false,
        status: 'Confirming',
        confirmationDetails,
      },
    ],
  } as unknown as IMessageToolGroup;
  return render(<MessageToolGroup message={message} />);
}

function optionValues() {
  return screen.queryAllByTestId('confirm-option').map((el) => el.getAttribute('data-value'));
}

describe('#1099 MessageToolGroup never renders a path boundary as an MCP prompt', () => {
  it('offers a path_boundary NO options at all', () => {
    renderConfirming(boundaryDetails);
    expect(optionValues()).toEqual([]);
  });

  it('never offers a path_boundary proceed_once / proceed_always / _tool / _server', () => {
    renderConfirming(boundaryDetails);
    const values = optionValues();
    for (const outcome of WIDENING_OUTCOMES) {
      expect(values, `a folder grant must never speak ${outcome}`).not.toContain(outcome);
    }
  });

  it('never labels a path_boundary with the MCP string', () => {
    renderConfirming(boundaryDetails);
    expect(screen.queryByText(MCP_LABEL_KEY)).toBeNull();
  });

  it('CONTROL: an mcp confirmation IS labelled with the MCP string and keeps its options', () => {
    renderConfirming(mcpDetails);
    expect(screen.getByText(MCP_LABEL_KEY)).toBeTruthy();
    expect(optionValues()).toEqual(['proceed_once', 'proceed_always_tool', 'proceed_always_server', 'cancel']);
  });
});

describe('#1189 announced tool cards retain inputs and outcomes', () => {
  it.each(['Executing', 'Success', 'Error'] as const)(
    'shows the command and available output for %s without offering approval',
    (status) => {
      const message: IMessageToolGroup = {
        id: 'announcement-message',
        conversation_id: 'announcement-conversation',
        type: 'tool_group',
        content: [
          {
            callId: 'announced-call',
            name: 'Bash',
            description: 'Run the command',
            status,
            renderOutputAsMarkdown: true,
            resultDisplay: 'captured tool outcome',
            confirmationDetails: {
              type: 'exec',
              title: 'Run the command',
              command: 'printf reliable',
              rootCommand: 'printf',
            },
          },
        ],
      };
      render(<MessageToolGroup message={message} />);
      expect(screen.getByText(/printf reliable/)).toBeTruthy();
      expect(screen.getByText('captured tool outcome')).toBeTruthy();
      expect(optionValues()).toEqual([]);
      expect(screen.queryByRole('button', { name: 'messages.confirm' })).toBeNull();
    }
  );
});
