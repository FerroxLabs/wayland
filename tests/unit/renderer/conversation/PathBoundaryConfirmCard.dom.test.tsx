/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1099 — the three commitments made to the Core team about the folder-grant
 * card, each asserted as a property that can be broken:
 *
 *   1. it uses its OWN option values, never `proceed_once` / `proceed_always`;
 *   2. it is excluded from every auto-confirm path;
 *   3. it binds neither Enter nor Y.
 *
 * The stakes: Wayland Desktop auto-approves confirmations from seven places,
 * and two of them would fire on this card without these guards — the renderer's
 * stored-approval replay (value-keyed) and the yolo gate (INDEX-keyed, so it
 * would pick the grant button itself). Either one silently hands the session
 * standing read access to a folder outside the workspace.
 *
 * COMMITMENT 4 (added with the a11y fix): the decision must be REACHABLE from
 * the keyboard. Click-only satisfied 1-3 by making the card unusable for
 * keyboard-only and screen-reader users — they could not answer a security
 * question about their own filesystem at all. The card is now focusable and
 * activates on SPACE, the one key none of those seven paths and none of this
 * app's shortcut handlers bind. Commitment 3 is unchanged and re-asserted
 * below: Enter and Y still do nothing, from the window AND from the control.
 */
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const confirmInvoke = vi.fn(() => Promise.resolve({ success: true }));
const listInvoke = vi.fn();
const checkInvoke = vi.fn(() => Promise.resolve(false));

// A `t` that COMPOSES its interpolations, the way i18next does. The card builds
// the grant's accessible name by interpolating the already-translated visible
// label into another string; a mock that dropped params would make the
// Label-in-Name assertion below pass on any implementation.
const translate = (key: string, options?: Record<string, unknown>): string => {
  const base = typeof options?.defaultValue === 'string' ? options.defaultValue : key;
  const params = Object.entries(options ?? {}).filter(([name]) => name !== 'defaultValue');
  if (!params.length) return base;
  return `${base}(${params.map(([name, value]) => `${name}=${String(value)}`).join(', ')})`;
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, options?: Record<string, unknown>) => translate(key, options) }),
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

const CONVERSATION_ID = 'conv-1099';
const ROOT = '/Users/sean/Documents/reports';
const TARGET = '/Users/sean/Documents/reports/q3.md';

const boundaryConfirmation = {
  conversation_id: CONVERSATION_ID,
  id: 'call-boundary',
  callId: 'call-boundary',
  // No `action`: there is no approval-store key that could honestly describe
  // "which folder", so the card carries none.
  title: 'Read q3.md',
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

/**
 * Wait until the window-level key handler is actually installed.
 *
 * `findBy*` resolves as soon as the card is in the DOM, and testing-library
 * resolves it from EITHER a MutationObserver microtask OR a 50ms real-timer
 * macrotask - whichever fires first. React installs `ConversationChatConfirm`'s
 * `keydown` listener in a PASSIVE effect, which React's scheduler flushes on a
 * macrotask of its own. On the microtask path the listener is therefore not
 * attached yet, and a key dispatched at `window` lands on nothing.
 *
 * That coin flip made the ordinary-card CONTROL below fail on one loaded ubuntu
 * shard while passing on every other. The worse half is silent: it would make
 * the two "binds no key" assertions pass VACUOUSLY, reporting a security
 * exclusion that was never exercised. Flushing the pending passive effects
 * makes every dispatch meet a live handler. Measured on this component: without
 * this the microtask path sees 0 listeners and Enter does nothing; with it, 1.
 */
const keyHandlerInstalled = () => act(async () => {});

const renderCard = () =>
  render(
    <ConversationChatConfirm conversation_id={CONVERSATION_ID}>
      <div>child</div>
    </ConversationChatConfirm>
  );

describe('#1099 folder-grant card', () => {
  beforeEach(() => {
    confirmInvoke.mockClear();
    checkInvoke.mockReset();
    checkInvoke.mockResolvedValue(false);
    listInvoke.mockReset();
    listInvoke.mockResolvedValue([boundaryConfirmation]);
  });

  it('renders the dedicated card, naming the target and the folder a grant opens separately', async () => {
    renderCard();

    expect(await screen.findByTestId('path-boundary-card')).toBeTruthy();
    expect(screen.getByTestId('path-boundary-target').textContent).toBe(TARGET);
    // The ROOT is what the grant actually opens, and it is NOT the target — a
    // card showing only the target would understate what it hands over.
    expect(screen.getByTestId('path-boundary-root').textContent).toBe(ROOT);
    expect(ROOT).not.toBe(TARGET);
  });

  // ── COMMITMENT 1: its own option values ──────────────────────────────
  it('uses option values that no proceed_* matcher in the app can ever match', async () => {
    renderCard();
    await screen.findByTestId('path-boundary-card');

    const values = boundaryConfirmation.options.map((o) => o.value);
    expect(values).toEqual([PATH_BOUNDARY_GRANT_FOLDER, PATH_BOUNDARY_REMEMBER_FOLDER, PATH_BOUNDARY_DENY]);
    expect(values).not.toContain('proceed_once');
    expect(values).not.toContain('proceed_always');
    expect(values).not.toContain('cancel');
  });

  it('sends its own grant value, not proceed_always, when the folder is granted', async () => {
    renderCard();

    fireEvent.click(await screen.findByTestId('path-boundary-grant'));

    await waitFor(() => expect(confirmInvoke).toHaveBeenCalled());
    expect(confirmInvoke.mock.calls[0][0]).toMatchObject({
      callId: 'call-boundary',
      data: PATH_BOUNDARY_GRANT_FOLDER,
    });
  });

  // ── COMMITMENT 2: excluded from auto-confirm ─────────────────────────
  it('is never auto-confirmed by the stored-approval replay, even when the store says approved', async () => {
    // The store answering "yes" is the exact condition that auto-confirms an
    // ordinary card. Here it must change nothing: the card still renders and
    // nothing is sent.
    checkInvoke.mockResolvedValue(true);

    renderCard();

    expect(await screen.findByTestId('path-boundary-card')).toBeTruthy();
    expect(confirmInvoke).not.toHaveBeenCalled();
  });

  it('stays excluded even if the card ever starts carrying an `action`', async () => {
    // As shipped, WCoreManager emits a boundary card with NO `action`, and
    // checkAndAutoConfirm bails on a missing action before it reaches any value
    // match. That makes the explicit exclusion redundant TODAY — and redundant
    // only until someone adds an action for logging, telemetry or grouping.
    //
    // This fixture is deliberately NOT the shape the product emits. It is the
    // shape one plausible future edit produces, and it exists so the explicit
    // guard is the single thing standing between that edit and a silent
    // filesystem grant. Without the guard this test auto-confirms.
    checkInvoke.mockResolvedValue(true);
    listInvoke.mockResolvedValue([{ ...boundaryConfirmation, action: 'info' }]);

    renderCard();

    expect(await screen.findByTestId('path-boundary-card')).toBeTruthy();
    expect(confirmInvoke).not.toHaveBeenCalled();
    expect(checkInvoke).not.toHaveBeenCalled();
  });

  it('does not even consult the approval store for a boundary card', async () => {
    checkInvoke.mockResolvedValue(true);

    renderCard();
    await screen.findByTestId('path-boundary-card');

    expect(checkInvoke).not.toHaveBeenCalled();
  });

  // ── COMMITMENT 3: binds neither Enter nor Y ──────────────────────────
  it('binds neither Enter nor Y nor A nor a number key', async () => {
    renderCard();
    await screen.findByTestId('path-boundary-card');
    await keyHandlerInstalled();

    for (const key of ['Enter', 'y', 'Y', 'a', 'A', '1', '2']) {
      fireEvent.keyDown(window, { key });
    }

    expect(confirmInvoke).not.toHaveBeenCalled();
  });

  it('binds neither Enter nor Y ON THE FOCUSED CONTROL ITSELF', async () => {
    // The window-level assertion above cannot see this: making the option a
    // real control gave it its OWN key handler, and a handler that answered
    // Enter would re-open exactly the hole commitment 3 closes — Enter is the
    // key a user hits meaning "send my message", and on this card the first
    // (default) option is the GRANT.
    renderCard();
    const grant = await screen.findByTestId('path-boundary-grant');
    grant.focus();

    for (const key of ['Enter', 'y', 'Y', 'a', 'A', '1', '2', 'Escape', 'n']) {
      fireEvent.keyDown(grant, { key });
    }

    expect(confirmInvoke).not.toHaveBeenCalled();
  });

  it('FOCUSES the refusal when it appears, so the key it advertises actually works', async () => {
    // Found by driving the real app, not by reading code: the card was
    // focusable and Space-activatable, and `document.activeElement` was BODY,
    // so the advertised shortcut did nothing until the user tabbed onto a
    // button. Every existing keyboard test here focuses a control by hand
    // first, which is exactly why none of them could see it.
    renderCard();
    const deny = await screen.findByTestId('path-boundary-deny');

    await waitFor(() => expect(document.activeElement).toBe(deny));
  });

  it('focuses the REFUSAL, never the grant, so a stray Space cannot hand over a folder', async () => {
    // The mechanism, not the outcome. "Something is focused" would pass just as
    // happily on a card that focuses the grant - which is the one arrangement
    // that turns the single bound key into an accidental grant, and undoes the
    // reason Enter and Y are unbound at all.
    renderCard();
    const deny = await screen.findByTestId('path-boundary-deny');
    const grant = await screen.findByTestId('path-boundary-grant');

    await waitFor(() => expect(document.activeElement).toBe(deny));
    expect(document.activeElement).not.toBe(grant);

    // And the focused control really is live: the advertised key works on it
    // with no Tab first. Without this the two assertions above are satisfied by
    // focusing an inert div.
    fireEvent.keyDown(document.activeElement as Element, { key: ' ' });
    expect(confirmInvoke).toHaveBeenCalled();
  });

  it('advertises only the key it actually binds', async () => {
    renderCard();
    const card = await screen.findByTestId('path-boundary-card');

    // The badge is FOCUS-GATED - the card renders `Space` on the focused row
    // only, and focus arrives from an effect. `findByTestId` resolves as soon
    // as the card exists, which is one state update too early, so asserting the
    // badge straight off it is a race: green on an idle machine, red on a busy
    // CI runner (it failed exactly one shard of twelve, ubuntu 2/4, on #1191 -
    // a PR touching only the readme and a script). Wait for the badge, then
    // assert the negatives on the settled text.
    await waitFor(() => expect(card.textContent).toContain('Space'));

    // Enter / Esc / Y badges would be a promise the card does not keep.
    expect(card.textContent).not.toContain('Enter');
    expect(card.textContent).not.toContain('Esc');
    expect(screen.getByTestId('path-boundary-grant').getAttribute('aria-keyshortcuts')).toBe('Space');
  });

  it('still grants on a click — the exclusions disable keys, not the button', async () => {
    renderCard();
    fireEvent.click(await screen.findByTestId('path-boundary-deny'));

    await waitFor(() => expect(confirmInvoke).toHaveBeenCalled());
    expect(confirmInvoke.mock.calls[0][0]).toMatchObject({ data: PATH_BOUNDARY_DENY });
  });

  // ── COMMITMENT 4: reachable from the keyboard, on Space alone ─────────
  it('exposes both options as focusable controls, so the decision is reachable at all', async () => {
    renderCard();
    await screen.findByTestId('path-boundary-card');

    for (const testId of ['path-boundary-grant', 'path-boundary-remember', 'path-boundary-deny']) {
      const el = screen.getByTestId(testId);
      expect(el.getAttribute('role')).toBe('button');
      expect(el.getAttribute('tabindex')).toBe('0');
      el.focus();
      expect(document.activeElement).toBe(el);
    }
  });

  it('grants on a Space keydown on the focused grant option', async () => {
    renderCard();
    const grant = await screen.findByTestId('path-boundary-grant');
    grant.focus();

    fireEvent.keyDown(grant, { key: ' ' });

    await waitFor(() => expect(confirmInvoke).toHaveBeenCalled());
    expect(confirmInvoke.mock.calls[0][0]).toMatchObject({
      callId: 'call-boundary',
      data: PATH_BOUNDARY_GRANT_FOLDER,
    });
  });

  it('denies on a Space keydown on the focused deny option', async () => {
    renderCard();
    const deny = await screen.findByTestId('path-boundary-deny');
    deny.focus();

    fireEvent.keyDown(deny, { key: ' ' });

    await waitFor(() => expect(confirmInvoke).toHaveBeenCalled());
    expect(confirmInvoke.mock.calls[0][0]).toMatchObject({ data: PATH_BOUNDARY_DENY });
  });

  it('swallows the Space keystroke so it cannot also scroll the page', async () => {
    renderCard();
    const grant = await screen.findByTestId('path-boundary-grant');

    const notHandled = fireEvent.keyDown(grant, { key: 'Enter' });
    const handled = fireEvent.keyDown(grant, { key: ' ' });

    // fireEvent returns false when a handler called preventDefault.
    expect(notHandled).toBe(true);
    expect(handled).toBe(false);
  });

  it('names the granted folder in the accessible name, from the same accessor that grants it', async () => {
    renderCard();
    const grant = await screen.findByTestId('path-boundary-grant');

    const name = grant.getAttribute('aria-label') ?? '';
    // ROOT, not TARGET: a name that announced the file while the grant opened
    // the directory would understate the authority being handed over. The
    // component reads it through `pathBoundaryRootOf`, the same accessor the
    // root line renders and WCoreManager grants.
    expect(name).toContain(ROOT);
    expect(name).not.toContain(TARGET);
    // WCAG 2.5.3 (Label in Name): the accessible name must contain the visible
    // label, or voice-control users cannot activate the control by reading it.
    const visible = within(grant).getByTestId('path-boundary-option-label').textContent ?? '';
    expect(visible).not.toBe('');
    expect(name).toContain(visible);
  });

  // ── THE DURABLE GRANT ────────────────────────────────────────────────
  it('renders a second grant option, distinct from the session one', async () => {
    renderCard();
    await screen.findByTestId('path-boundary-card');

    const session = screen.getByTestId('path-boundary-grant');
    const remember = screen.getByTestId('path-boundary-remember');
    expect(session).not.toBe(remember);
    // The two buttons differ ONLY in how long the grant lasts, so identical
    // visible text would make the card impossible to answer correctly.
    const sessionText = within(session).getByTestId('path-boundary-option-label').textContent;
    const rememberText = within(remember).getByTestId('path-boundary-option-label').textContent;
    expect(sessionText).toBeTruthy();
    expect(rememberText).toBeTruthy();
    expect(rememberText).not.toBe(sessionText);
    // ...and the hint under each states its own duration.
    expect(session.textContent).not.toBe(remember.textContent);
  });

  it('remembers on a Space keydown, sending its own durable value', async () => {
    renderCard();
    const remember = await screen.findByTestId('path-boundary-remember');
    remember.focus();

    fireEvent.keyDown(remember, { key: ' ' });

    await waitFor(() => expect(confirmInvoke).toHaveBeenCalled());
    expect(confirmInvoke.mock.calls[0][0]).toMatchObject({
      callId: 'call-boundary',
      data: PATH_BOUNDARY_REMEMBER_FOLDER,
    });
  });

  it('binds neither Enter nor Y on the durable option either', async () => {
    // The durable grant is the higher-stakes of the two - it keeps the folder
    // open to every future session of this workspace - so commitment 3 has to
    // hold on it at least as hard as on the session grant.
    renderCard();
    const remember = await screen.findByTestId('path-boundary-remember');
    remember.focus();

    for (const key of ['Enter', 'y', 'Y', 'a', 'A', '1', '2', '3', 'Escape', 'n']) {
      fireEvent.keyDown(remember, { key });
    }
    expect(confirmInvoke).not.toHaveBeenCalled();

    // CONTROL, same element: Space still works, so the silence above is the
    // handler refusing those keys and not a control that answers nothing.
    fireEvent.keyDown(remember, { key: ' ' });
    await waitFor(() => expect(confirmInvoke).toHaveBeenCalledTimes(1));
  });

  it('gives the durable option its OWN accessible name, naming the same folder', async () => {
    renderCard();
    await screen.findByTestId('path-boundary-card');

    const sessionName = screen.getByTestId('path-boundary-grant').getAttribute('aria-label') ?? '';
    const rememberName = screen.getByTestId('path-boundary-remember').getAttribute('aria-label') ?? '';

    // Both name the folder the grant opens...
    expect(sessionName).toContain(ROOT);
    expect(rememberName).toContain(ROOT);
    expect(rememberName).not.toContain(TARGET);
    // ...and each is built from its OWN template, which is the mechanism.
    //
    // Asserting only `rememberName !== sessionName` proved nothing: the names
    // interpolate their own visible LABEL, and the labels already differ, so a
    // card that fed both buttons the session template still produced two
    // different strings and the assertion passed. It would have shipped a
    // durable button whose screen-reader name says "until this chat ends".
    // The `t` mock echoes the key it was given, so the key is checkable here.
    expect(sessionName.startsWith('messages.confirmation.pathBoundaryGrantAria')).toBe(true);
    expect(rememberName.startsWith('messages.confirmation.pathBoundaryRememberAria')).toBe(true);
    // WCAG 2.5.3 (Label in Name), same rule as the session grant.
    const visible = within(screen.getByTestId('path-boundary-remember')).getByTestId(
      'path-boundary-option-label'
    ).textContent;
    expect(visible).toBeTruthy();
    expect(rememberName).toContain(visible);
  });

  it('leaves the deny option named by its own visible text, never by the grant folder', async () => {
    renderCard();
    await screen.findByTestId('path-boundary-card');

    const deny = screen.getByTestId('path-boundary-deny');
    expect(deny.getAttribute('aria-label')).toBeNull();
    expect(deny.textContent).not.toContain(ROOT);
  });
});

/**
 * The renderer's three exclusions, pinned with a card that carries the DURABLE
 * grant value and nothing else from the vocabulary.
 *
 * All three read `isPathBoundaryConfirmation`, so a new option value extends
 * them by itself. That is the claim; this is the fixture that can falsify it.
 * Every other test in this file would still pass if an exclusion were keyed on
 * `PATH_BOUNDARY_GRANT_FOLDER` specifically, because every other fixture
 * carries that value too.
 */
describe('#1099 a durable-only card is excluded by the same three renderer guards', () => {
  const rememberOnly = {
    ...boundaryConfirmation,
    options: [
      {
        label: 'messages.confirmation.grantFolderRemember',
        value: PATH_BOUNDARY_REMEMBER_FOLDER,
        params: { folder: ROOT },
        description: 'messages.confirmation.grantFolderRememberHint',
      },
      { label: 'messages.confirmation.grantFolderDeny', value: PATH_BOUNDARY_DENY },
    ],
  };

  beforeEach(() => {
    confirmInvoke.mockClear();
    checkInvoke.mockReset();
    // The store saying "approved" is the exact condition that auto-confirms an
    // ordinary card, and an `action` is what lets the replay reach a value match.
    checkInvoke.mockResolvedValue(true);
    listInvoke.mockReset();
    listInvoke.mockResolvedValue([{ ...rememberOnly, action: 'info' }]);
  });

  it('routes to the dedicated card, not the generic allow/deny prompt', async () => {
    renderCard();
    expect(await screen.findByTestId('path-boundary-card')).toBeTruthy();
    expect(screen.getByTestId('path-boundary-remember')).toBeTruthy();
    expect(screen.queryByTestId('path-boundary-grant')).toBeNull();
  });

  it('is never auto-confirmed by the stored-approval replay', async () => {
    renderCard();
    await screen.findByTestId('path-boundary-card');

    expect(confirmInvoke).not.toHaveBeenCalled();
    expect(checkInvoke).not.toHaveBeenCalled();
  });

  it('binds no window-level key, so Enter cannot fire options[0]', async () => {
    renderCard();
    await screen.findByTestId('path-boundary-card');
    await keyHandlerInstalled();

    for (const key of ['Enter', 'y', 'Y', 'a', 'A', '1', 'Escape', 'n']) {
      fireEvent.keyDown(window, { key });
    }
    expect(confirmInvoke).not.toHaveBeenCalled();

    // CONTROL, same card: Space on the control still answers it, so the card is
    // live and the silence above is the exclusions deciding.
    const remember = screen.getByTestId('path-boundary-remember');
    remember.focus();
    fireEvent.keyDown(remember, { key: ' ' });
    await waitFor(() => expect(confirmInvoke).toHaveBeenCalledTimes(1));
    expect(confirmInvoke.mock.calls[0][0]).toMatchObject({ data: PATH_BOUNDARY_REMEMBER_FOLDER });
  });
});

describe('#1099 control — an ordinary approval card keeps every behaviour', () => {
  const ordinary = {
    conversation_id: CONVERSATION_ID,
    id: 'call-ordinary',
    callId: 'call-ordinary',
    action: 'exec',
    title: 'Run a command',
    description: 'ls',
    options: [
      { label: 'messages.confirmation.yesAllowOnce', value: 'proceed_once' },
      { label: 'messages.confirmation.yesAllowAlways', value: 'proceed_always' },
      { label: 'messages.confirmation.no', value: 'cancel' },
    ],
  };

  beforeEach(() => {
    confirmInvoke.mockClear();
    checkInvoke.mockReset();
    checkInvoke.mockResolvedValue(false);
    listInvoke.mockReset();
    listInvoke.mockResolvedValue([ordinary]);
  });

  // These two are the positive controls for the exclusions above: they prove
  // the keyboard handler and the stored-approval replay are both alive, so the
  // boundary card's silence is an exclusion and not a dead code path.
  it('CONTROL: Enter still confirms the first option on an ordinary card', async () => {
    renderCard();
    await screen.findByText('messages.confirmation.yesAllowOnce');
    await keyHandlerInstalled();

    fireEvent.keyDown(window, { key: 'Enter' });

    await waitFor(() => expect(confirmInvoke).toHaveBeenCalled());
    expect(confirmInvoke.mock.calls[0][0]).toMatchObject({ data: 'proceed_once' });
  });

  it('CONTROL: the stored-approval replay still auto-confirms an ordinary card', async () => {
    checkInvoke.mockResolvedValue(true);

    renderCard();

    await waitFor(() => expect(confirmInvoke).toHaveBeenCalled());
    expect(confirmInvoke.mock.calls[0][0]).toMatchObject({ data: 'proceed_once' });
    expect(screen.queryByTestId('path-boundary-card')).toBeNull();
  });
});
