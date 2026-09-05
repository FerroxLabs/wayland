/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import LaunchpadPicker from '@/renderer/pages/guid/components/newChatStarter/LaunchpadPicker';
import { LAUNCHPAD_MAX_ENTRIES } from '@/renderer/hooks/launchpad/useLaunchpadBar';
import type { AssistantListItem } from '@/renderer/pages/settings/AssistantSettings/types';

const assistants: AssistantListItem[] = [
  { id: 'ext-copy', name: 'Copywriter', nameI18n: { 'en-US': 'Copywriter' } },
  { id: 'ext-sales', name: 'Sales', nameI18n: { 'en-US': 'Sales' } },
  { id: 'ext-forge', name: 'Forge', nameI18n: { 'en-US': 'Forge' } },
  { id: 'ext-coin', name: 'Coin', nameI18n: { 'en-US': 'Coin' } },
  { id: 'ext-quiet-money', name: 'Quiet Money', nameI18n: { 'en-US': 'Quiet Money' } },
  { id: 'ext-product-launch', name: 'Launch', nameI18n: { 'en-US': 'Launch' } },
];

describe('LaunchpadPicker', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renders the drawer with the search input and a populated grid', () => {
    render(
      <LaunchpadPicker onClose={vi.fn()} onPick={vi.fn()} pinnedIds={[]} assistants={assistants} localeKey='en-US' />
    );

    expect(screen.getByTestId('launchpad-picker')).toBeInTheDocument();
    expect(screen.getByTestId('launchpad-picker-search')).toBeInTheDocument();
    // Cowork default-anchor + 6 catalogue entries (with dedupe) = at least 7 cards.
    const cards = document.querySelectorAll('[data-testid^="launchpad-picker-card-"]');
    expect(cards.length).toBeGreaterThanOrEqual(7);
  });

  it('shows pinned cards with the pinned tag and disables them', () => {
    render(
      <LaunchpadPicker
        onClose={vi.fn()}
        onPick={vi.fn()}
        pinnedIds={['ext-copy', 'builtin-cowork']}
        assistants={assistants}
        localeKey='en-US'
      />
    );

    const copyCard = screen.getByTestId('launchpad-picker-card-ext-copy');
    expect(copyCard.getAttribute('data-pinned')).toBe('true');
    expect(copyCard).toBeDisabled();
  });

  it('clicking an unpinned card calls onPick with the assistantId', () => {
    const onPick = vi.fn();
    render(
      <LaunchpadPicker onClose={vi.fn()} onPick={onPick} pinnedIds={[]} assistants={assistants} localeKey='en-US' />
    );

    const forge = screen.getByTestId('launchpad-picker-card-ext-forge');
    fireEvent.click(forge);
    expect(onPick).toHaveBeenCalledWith('ext-forge');
  });

  it('shows the accepted-pick flash for 600ms and then clears it', () => {
    vi.useFakeTimers();
    const { unmount } = render(
      <LaunchpadPicker onClose={vi.fn()} onPick={vi.fn()} pinnedIds={[]} assistants={assistants} localeKey='en-US' />
    );
    const forge = screen.getByTestId('launchpad-picker-card-ext-forge');
    const restingClass = forge.className;

    fireEvent.click(forge);
    expect(forge.className).not.toBe(restingClass);
    act(() => vi.advanceTimersByTime(599));
    expect(forge.className).not.toBe(restingClass);
    act(() => vi.advanceTimersByTime(1));
    expect(forge.className).toBe(restingClass);
    unmount();
  });

  it('replaces the prior flash timer so its deadline cannot clear the latest pick', () => {
    vi.useFakeTimers();
    const setTimeoutSpy = vi.spyOn(window, 'setTimeout');
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
    const { unmount } = render(
      <LaunchpadPicker onClose={vi.fn()} onPick={vi.fn()} pinnedIds={[]} assistants={assistants} localeKey='en-US' />
    );
    const forge = screen.getByTestId('launchpad-picker-card-ext-forge');
    const sales = screen.getByTestId('launchpad-picker-card-ext-sales');
    const salesRestingClass = sales.className;
    const flashTimerHandles = () =>
      setTimeoutSpy.mock.calls.flatMap((call, index) =>
        call[1] === 600 ? [setTimeoutSpy.mock.results[index]?.value] : []
      );

    fireEvent.click(forge);
    const firstFlashTimer = flashTimerHandles()[0];
    expect(flashTimerHandles()).toHaveLength(1);
    expect(firstFlashTimer).toBeDefined();
    act(() => vi.advanceTimersByTime(300));
    fireEvent.click(sales);
    const secondFlashTimer = flashTimerHandles()[1];
    expect(flashTimerHandles()).toHaveLength(2);
    expect(secondFlashTimer).toBeDefined();
    expect(secondFlashTimer).not.toBe(firstFlashTimer);
    expect(clearTimeoutSpy).toHaveBeenCalledWith(firstFlashTimer);
    expect(sales.className).not.toBe(salesRestingClass);

    act(() => vi.advanceTimersByTime(300));
    expect(sales.className).not.toBe(salesRestingClass);
    act(() => vi.advanceTimersByTime(300));
    expect(sales.className).toBe(salesRestingClass);
    unmount();
  });

  it('cancels a pending flash on unmount and isolates a reopened picker', () => {
    vi.useFakeTimers();
    const first = render(
      <LaunchpadPicker onClose={vi.fn()} onPick={vi.fn()} pinnedIds={[]} assistants={assistants} localeKey='en-US' />
    );
    const baselineTimers = vi.getTimerCount();
    fireEvent.click(screen.getByTestId('launchpad-picker-card-ext-forge'));
    expect(vi.getTimerCount()).toBe(baselineTimers + 1);

    first.unmount();
    expect(vi.getTimerCount()).toBe(baselineTimers);
    const second = render(
      <LaunchpadPicker onClose={vi.fn()} onPick={vi.fn()} pinnedIds={[]} assistants={assistants} localeKey='en-US' />
    );
    const sales = screen.getByTestId('launchpad-picker-card-ext-sales');
    const restingClass = sales.className;
    act(() => vi.advanceTimersByTime(1_000));
    expect(sales.className).toBe(restingClass);
    second.unmount();
  });

  it('clicking a pinned card does NOT call onPick', () => {
    const onPick = vi.fn();
    render(
      <LaunchpadPicker
        onClose={vi.fn()}
        onPick={onPick}
        pinnedIds={['ext-copy']}
        assistants={assistants}
        localeKey='en-US'
      />
    );

    const copyCard = screen.getByTestId('launchpad-picker-card-ext-copy');
    fireEvent.click(copyCard);
    expect(onPick).not.toHaveBeenCalled();
  });

  it('does not schedule flash work for pinned or cap-locked cards', () => {
    vi.useFakeTimers();
    const { rerender, unmount } = render(
      <LaunchpadPicker
        onClose={vi.fn()}
        onPick={vi.fn()}
        pinnedIds={['ext-copy']}
        assistants={assistants}
        localeKey='en-US'
      />
    );
    const baselineTimers = vi.getTimerCount();
    fireEvent.click(screen.getByTestId('launchpad-picker-card-ext-copy'));
    expect(vi.getTimerCount()).toBe(baselineTimers);

    rerender(
      <LaunchpadPicker
        onClose={vi.fn()}
        onPick={vi.fn()}
        pinnedIds={Array.from({ length: LAUNCHPAD_MAX_ENTRIES }, (_, i) => `placeholder-${i}`)}
        assistants={assistants}
        localeKey='en-US'
      />
    );
    fireEvent.click(screen.getByTestId('launchpad-picker-card-ext-forge'));
    expect(vi.getTimerCount()).toBe(baselineTimers);
    unmount();
  });

  it('search filters the visible cards', () => {
    render(
      <LaunchpadPicker onClose={vi.fn()} onPick={vi.fn()} pinnedIds={[]} assistants={assistants} localeKey='en-US' />
    );

    fireEvent.change(screen.getByTestId('launchpad-picker-search'), { target: { value: 'forge' } });

    const visible = document.querySelectorAll('[data-testid^="launchpad-picker-card-"]');
    expect(visible).toHaveLength(1);
    expect(visible[0].getAttribute('data-testid')).toBe('launchpad-picker-card-ext-forge');
  });

  it('shows the empty state when the filter matches nothing', () => {
    render(
      <LaunchpadPicker onClose={vi.fn()} onPick={vi.fn()} pinnedIds={[]} assistants={assistants} localeKey='en-US' />
    );

    fireEvent.change(screen.getByTestId('launchpad-picker-search'), {
      target: { value: 'zzznothingmatches' },
    });
    expect(screen.getByTestId('launchpad-picker-empty')).toBeInTheDocument();
  });

  it('close button fires onClose', () => {
    const onClose = vi.fn();
    render(
      <LaunchpadPicker onClose={onClose} onPick={vi.fn()} pinnedIds={[]} assistants={assistants} localeKey='en-US' />
    );

    fireEvent.click(screen.getByTestId('launchpad-picker-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows the cap banner and locks unpinned cards when the bar is at the cap', () => {
    const onPick = vi.fn();
    const pinned = Array.from({ length: LAUNCHPAD_MAX_ENTRIES }, (_, i) => `placeholder-${i}`);
    render(
      <LaunchpadPicker onClose={vi.fn()} onPick={onPick} pinnedIds={pinned} assistants={assistants} localeKey='en-US' />
    );

    expect(screen.getByTestId('launchpad-picker-cap-banner')).toBeInTheDocument();
    // None of the catalogue ids match the placeholder pinned ids, so every
    // visible card should be cap-locked (not pinned) and disabled.
    const forge = screen.getByTestId('launchpad-picker-card-ext-forge');
    expect(forge.getAttribute('data-cap-locked')).toBe('true');
    expect(forge).toBeDisabled();

    fireEvent.click(forge);
    expect(onPick).not.toHaveBeenCalled();
  });

  it('does not show the cap banner when the bar has room', () => {
    render(
      <LaunchpadPicker
        onClose={vi.fn()}
        onPick={vi.fn()}
        pinnedIds={['ext-copy']}
        assistants={assistants}
        localeKey='en-US'
      />
    );
    expect(screen.queryByTestId('launchpad-picker-cap-banner')).toBeNull();
  });

  it('Esc key fires onClose', () => {
    const onClose = vi.fn();
    render(
      <LaunchpadPicker onClose={onClose} onPick={vi.fn()} pinnedIds={[]} assistants={assistants} localeKey='en-US' />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('replaces and removes the exact Escape listener as onClose changes', () => {
    const firstClose = vi.fn();
    const secondClose = vi.fn();
    const { rerender, unmount } = render(
      <LaunchpadPicker onClose={firstClose} onPick={vi.fn()} pinnedIds={[]} assistants={assistants} localeKey='en-US' />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(firstClose).toHaveBeenCalledTimes(1);
    rerender(
      <LaunchpadPicker
        onClose={secondClose}
        onPick={vi.fn()}
        pinnedIds={[]}
        assistants={assistants}
        localeKey='en-US'
      />
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(firstClose).toHaveBeenCalledTimes(1);
    expect(secondClose).toHaveBeenCalledTimes(1);

    unmount();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(firstClose).toHaveBeenCalledTimes(1);
    expect(secondClose).toHaveBeenCalledTimes(1);
  });
});
