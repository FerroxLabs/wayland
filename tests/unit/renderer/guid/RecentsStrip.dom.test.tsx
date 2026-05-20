/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? _key,
  }),
}));

// RecentsStrip calls useRecentConversations unconditionally for clean hook
// ordering. The dom test always passes the `recents` prop, so the hook's
// return value is ignored — we still need to stub the module to avoid the
// real implementation (which pulls SWR + IPC + the conversation list store).
vi.mock('@/renderer/pages/guid/hooks/useRecentConversations', () => ({
  useRecentConversations: () => ({ recents: [] }),
}));

import RecentsStrip from '@/renderer/pages/guid/components/newChatStarter/RecentsStrip';
import type { RecentConversation } from '@/renderer/pages/guid/hooks/useRecentConversations';

const sample: RecentConversation[] = [
  {
    id: 'conv-1',
    name: 'Cold outbound draft',
    assistantId: 'cold-outbound',
    assistantName: 'Cold Outbound',
    assistantIcon: '📨',
    modifyTime: 3,
  },
  {
    id: 'conv-2',
    name: 'Pipeline review',
    assistantId: 'sales-pipeline',
    assistantName: 'Sales Pipeline',
    assistantIcon: undefined,
    modifyTime: 2,
  },
];

describe('<RecentsStrip>', () => {
  it('renders nothing when there are no recents (empty state hidden)', () => {
    const { container } = render(<RecentsStrip onSelect={() => {}} recents={[]} />);
    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId('recents-strip')).toBeNull();
  });

  it('renders one card per recent conversation', () => {
    render(<RecentsStrip onSelect={() => {}} recents={sample} />);
    const cards = screen.getAllByTestId('recents-card');
    expect(cards).toHaveLength(sample.length);
    expect(cards[0].getAttribute('data-conversation-id')).toBe('conv-1');
    expect(cards[1].getAttribute('data-conversation-id')).toBe('conv-2');
  });

  it('shows the conversation name and assistant attribution', () => {
    render(<RecentsStrip onSelect={() => {}} recents={sample} />);
    expect(screen.getByText('Cold outbound draft')).toBeTruthy();
    expect(screen.getByText('Cold Outbound')).toBeTruthy();
    expect(screen.getByText('Pipeline review')).toBeTruthy();
  });

  it('fires onSelect with the conversation when a card is clicked', () => {
    const onSelect = vi.fn();
    render(<RecentsStrip onSelect={onSelect} recents={sample} />);
    fireEvent.click(screen.getAllByTestId('recents-card')[1]);
    expect(onSelect).toHaveBeenCalledWith(sample[1]);
  });
});
