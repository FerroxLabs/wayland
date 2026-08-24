/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1099 follow-up — the two defects a live run found on the folder-grant card,
 * both of which every test in `PathBoundaryConfirmCard.dom.test.tsx` passed
 * straight through:
 *
 *   1. PRESSING A ROW ANSWERED NOTHING. The card was activated by the `click`
 *      event alone, and a `click` reaches a control only when the browser
 *      resolves BOTH the press and the release to it. The card re-renders on
 *      every engine frame while the call is pending, so a row that moves under
 *      the pointer sends `click` to an ancestor with no handler: the press
 *      landed (it moved focus), and the decision was never answered. The
 *      existing suite could not see it — `fireEvent.click` dispatches the
 *      `click` the real browser had withheld.
 *
 *   2. EVERY ROW ADVERTISED THE SAME `Space`. The key handler is per-row and
 *      only ever reaches the row that HAS FOCUS, which is the REFUSAL by
 *      design. So the badge on a grant row was a false statement: read "Space"
 *      beside "Allow this folder", press it, get a denial.
 *
 * WHAT MUST NOT MOVE. The refusal keeps focus, and a stray Space still DENIES.
 * That is the whole reason Enter and Y are unbound, and the fix for the press
 * defect is that a DELIBERATE PRESS is not a stray key — not that the grant
 * becomes easier to reach by accident. Pinned at the bottom of this file.
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const confirmInvoke = vi.fn(() => Promise.resolve({ success: true }));
const listInvoke = vi.fn();
const checkInvoke = vi.fn(() => Promise.resolve(false));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    conversation: {
      confirmation: {
        list: { invoke: (...a: unknown[]) => listInvoke(...a) },
        confirm: { invoke: (...a: unknown[]) => confirmInvoke(...a) },
        add: { on: vi.fn(() => () => {}) },
        remove: { on: vi.fn(() => () => {}) },
        update: { on: vi.fn(() => () => {}) },
      },
      approval: { check: { invoke: (...a: unknown[]) => checkInvoke(...a) } },
    },
  },
}));

vi.mock('@/renderer/hooks/context/ConversationContext', () => ({
  useConversationContextSafe: () => ({ type: 'wcore' }),
}));

vi.mock('@/renderer/utils/common', () => ({ removeStack: () => () => {} }));

vi.mock('@arco-design/web-react', () => ({
  Divider: () => <hr />,
  Typography: { Ellipsis: ({ children }: React.PropsWithChildren) => <div>{children}</div> },
}));

import ConversationChatConfirm from '@/renderer/pages/conversation/components/ConversationChatConfirm';
import {
  PATH_BOUNDARY_DENY,
  PATH_BOUNDARY_GRANT_FOLDER,
  PATH_BOUNDARY_REMEMBER_FOLDER,
} from '@/common/chat/pathBoundaryConsent';

const CONVERSATION_ID = 'conv-1099-activation';
const ROOT = '/private/var/folders/8h/T/wayland-results';
const TARGET = `${ROOT}/call_f59c3edf6c164950820b8758.txt`;

const boundaryConfirmation = {
  conversation_id: CONVERSATION_ID,
  id: 'call-boundary',
  callId: 'call-boundary',
  title: 'Read call_f59c3edf6c164950820b8758.txt',
  description: TARGET,
  options: [
    {
      label: 'messages.confirmation.grantFolderAlways',
      value: PATH_BOUNDARY_GRANT_FOLDER,
      params: { folder: ROOT },
      description: 'messages.confirmation.grantFolderAlwaysHint',
    },
    {
      label: 'messages.confirmation.grantFolderRemember',
      value: PATH_BOUNDARY_REMEMBER_FOLDER,
      params: { folder: ROOT },
      description: 'messages.confirmation.grantFolderRememberHint',
    },
    { label: 'messages.confirmation.grantFolderDeny', value: PATH_BOUNDARY_DENY },
  ],
};

const renderCard = () =>
  render(
    <ConversationChatConfirm conversation_id={CONVERSATION_ID}>
      <div>child</div>
    </ConversationChatConfirm>
  );

/**
 * A REAL press on a row, as the browser delivers it when the `click` is lost.
 *
 * Deliberately dispatches NO `click`: that is the live failure this reproduces.
 * A test that also fired `click` would pass on the broken card and prove
 * nothing.
 */
const press = (element: Element) => {
  fireEvent.pointerDown(element, { pointerId: 1, button: 0 });
  fireEvent.pointerUp(element, { pointerId: 1, button: 0 });
};

describe('#1099 the folder-grant card answers a deliberate press', () => {
  beforeEach(() => {
    confirmInvoke.mockClear();
    checkInvoke.mockReset();
    checkInvoke.mockResolvedValue(false);
    listInvoke.mockReset();
    listInvoke.mockResolvedValue([boundaryConfirmation]);
  });

  it('GRANTS when the grant row is pressed and released, with no click event at all', async () => {
    renderCard();

    press(await screen.findByTestId('path-boundary-grant'));

    await waitFor(() => expect(confirmInvoke).toHaveBeenCalled());
    expect(confirmInvoke.mock.calls[0][0]).toMatchObject({
      callId: 'call-boundary',
      data: PATH_BOUNDARY_GRANT_FOLDER,
    });
  });

  it('DENIES when the refusal row is pressed and released, with no click event at all', async () => {
    renderCard();

    press(await screen.findByTestId('path-boundary-deny'));

    await waitFor(() => expect(confirmInvoke).toHaveBeenCalled());
    expect(confirmInvoke.mock.calls[0][0]).toMatchObject({ data: PATH_BOUNDARY_DENY });
  });

  it('answers the durable grant on a press too', async () => {
    renderCard();

    press(await screen.findByTestId('path-boundary-remember'));

    await waitFor(() => expect(confirmInvoke).toHaveBeenCalled());
    expect(confirmInvoke.mock.calls[0][0]).toMatchObject({ data: PATH_BOUNDARY_REMEMBER_FOLDER });
  });

  it('answers ONCE for one press, even when the browser also delivers its click', async () => {
    // The card claims the pointer on press, so the release answers; the browser
    // then dispatches `click` as well. Two answers for one press would send a
    // second `confirm` for a callId the engine has already resolved.
    renderCard();
    const grant = await screen.findByTestId('path-boundary-grant');

    fireEvent.pointerDown(grant, { pointerId: 1, button: 0 });
    fireEvent.pointerUp(grant, { pointerId: 1, button: 0 });
    fireEvent.click(grant);

    await waitFor(() => expect(confirmInvoke).toHaveBeenCalled());
    expect(confirmInvoke).toHaveBeenCalledTimes(1);
  });

  it('still answers a plain click, for the surfaces that synthesize one', async () => {
    // Assistive tech and voice control activate a `role=button` by synthesizing
    // a `click` with no pointer events at all. That path must keep working.
    renderCard();

    fireEvent.click(await screen.findByTestId('path-boundary-grant'));

    await waitFor(() => expect(confirmInvoke).toHaveBeenCalled());
    expect(confirmInvoke.mock.calls[0][0]).toMatchObject({ data: PATH_BOUNDARY_GRANT_FOLDER });
  });

  it('does NOT answer a press that is released away from the row', async () => {
    // Press-then-drag-off-then-release means "I changed my mind". The card
    // captures the pointer, so this release is delivered to the row anyway and
    // the escape hatch only exists because the card checks where it landed.
    renderCard();
    const grant = await screen.findByTestId('path-boundary-grant');
    // A real rect, so the release below is measurably outside it. jsdom lays
    // nothing out, and a zero-sized rect is deliberately treated as a hit.
    grant.getBoundingClientRect = () =>
      ({ left: 0, top: 0, right: 200, bottom: 40, width: 200, height: 40 }) as DOMRect;

    fireEvent.pointerDown(grant, { pointerId: 1, button: 0, clientX: 10, clientY: 10 });
    fireEvent.pointerUp(grant, { pointerId: 1, button: 0, clientX: 10, clientY: 900 });

    expect(confirmInvoke).not.toHaveBeenCalled();
  });
});

describe('#1099 the folder-grant card advertises its key on one row only', () => {
  beforeEach(() => {
    confirmInvoke.mockClear();
    checkInvoke.mockReset();
    checkInvoke.mockResolvedValue(false);
    listInvoke.mockReset();
    listInvoke.mockResolvedValue([boundaryConfirmation]);
  });

  it('shows the Space badge on exactly ONE row', async () => {
    renderCard();
    await screen.findByTestId('path-boundary-card');

    // Two rows promising the same key cannot both be telling the truth: the
    // handler that reads it only ever reaches the focused row.
    await waitFor(() => expect(screen.getAllByText('Space')).toHaveLength(1));
  });

  it('shows it on the REFUSAL, which is the row that key actually answers', async () => {
    renderCard();
    const deny = await screen.findByTestId('path-boundary-deny');
    const grant = await screen.findByTestId('path-boundary-grant');
    const remember = await screen.findByTestId('path-boundary-remember');

    await waitFor(() => expect(document.activeElement).toBe(deny));
    expect(within(deny).queryByText('Space')).not.toBeNull();
    expect(within(grant).queryByText('Space')).toBeNull();
    expect(within(remember).queryByText('Space')).toBeNull();
  });

  it('moves the badge with focus, so it names the row the key would answer', async () => {
    renderCard();
    const deny = await screen.findByTestId('path-boundary-deny');
    const grant = await screen.findByTestId('path-boundary-grant');

    await waitFor(() => expect(document.activeElement).toBe(deny));
    grant.focus();

    await waitFor(() => expect(within(grant).queryByText('Space')).not.toBeNull());
    expect(within(deny).queryByText('Space')).toBeNull();
    // ...and the key really does answer THAT row now.
    fireEvent.keyDown(grant, { key: ' ' });
    await waitFor(() => expect(confirmInvoke).toHaveBeenCalled());
    expect(confirmInvoke.mock.calls[0][0]).toMatchObject({ data: PATH_BOUNDARY_GRANT_FOLDER });
  });
});

describe('#1099 the safety property the press fix must not weaken', () => {
  beforeEach(() => {
    confirmInvoke.mockClear();
    checkInvoke.mockReset();
    checkInvoke.mockResolvedValue(false);
    listInvoke.mockReset();
    listInvoke.mockResolvedValue([boundaryConfirmation]);
  });

  it('still focuses the REFUSAL, so a stray Space denies rather than grants', async () => {
    renderCard();
    const deny = await screen.findByTestId('path-boundary-deny');

    await waitFor(() => expect(document.activeElement).toBe(deny));

    fireEvent.keyDown(document.activeElement as Element, { key: ' ' });
    await waitFor(() => expect(confirmInvoke).toHaveBeenCalled());
    expect(confirmInvoke.mock.calls[0][0]).toMatchObject({ data: PATH_BOUNDARY_DENY });
  });

  it('binds no key but Space on a pressed row — a press does not arm Enter', async () => {
    // The press path moves focus to the grant, which is exactly the state in
    // which an Enter binding would be one keystroke from a folder grant.
    renderCard();
    const grant = await screen.findByTestId('path-boundary-grant');
    grant.focus();

    for (const key of ['Enter', 'y', 'Y', 'a', 'A', '1', '2', '3', 'Escape', 'n']) {
      fireEvent.keyDown(grant, { key });
    }

    expect(confirmInvoke).not.toHaveBeenCalled();
  });
});
