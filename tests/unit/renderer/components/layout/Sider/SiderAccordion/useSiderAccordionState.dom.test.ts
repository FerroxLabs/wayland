import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  useSiderAccordionState,
  ACCORDION_STORAGE_KEY,
} from '@renderer/components/layout/Sider/SiderAccordion/useSiderAccordionState';

describe('useSiderAccordionState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('reads stored state synchronously in useState initializer (no flash)', () => {
    localStorage.setItem(ACCORDION_STORAGE_KEY, JSON.stringify({ scheduled: true, workflows: false, teams: true }));
    const { result } = renderHook(() => useSiderAccordionState());
    expect(result.current.state).toEqual({ scheduled: true, workflows: false, teams: true });
  });

  it('defaults to all-collapsed when no stored state exists', () => {
    const { result } = renderHook(() => useSiderAccordionState());
    expect(result.current.state).toEqual({ scheduled: false, workflows: false, teams: false });
  });

  it('toggle persists to localStorage', () => {
    const { result } = renderHook(() => useSiderAccordionState());
    act(() => {
      result.current.toggle('workflows');
    });
    expect(JSON.parse(localStorage.getItem(ACCORDION_STORAGE_KEY)!)).toEqual({
      scheduled: false,
      workflows: true,
      teams: false,
    });
  });

  it('reconciles cross-window via storage event', () => {
    const { result } = renderHook(() => useSiderAccordionState());
    act(() => {
      const newState = { scheduled: true, workflows: true, teams: false };
      localStorage.setItem(ACCORDION_STORAGE_KEY, JSON.stringify(newState));
      window.dispatchEvent(
        new StorageEvent('storage', { key: ACCORDION_STORAGE_KEY, newValue: JSON.stringify(newState) })
      );
    });
    expect(result.current.state).toEqual({ scheduled: true, workflows: true, teams: false });
  });

  it('reconciles via storage event when e.key === null (localStorage.clear)', () => {
    localStorage.setItem(ACCORDION_STORAGE_KEY, JSON.stringify({ scheduled: true, workflows: true, teams: true }));
    const { result } = renderHook(() => useSiderAccordionState());
    expect(result.current.state).toEqual({ scheduled: true, workflows: true, teams: true });
    act(() => {
      localStorage.clear();
      window.dispatchEvent(new StorageEvent('storage', { key: null, newValue: null }));
    });
    expect(result.current.state).toEqual({ scheduled: false, workflows: false, teams: false });
  });

  it('rejects non-boolean tampered values (defaults instead of preserving truthy strings)', () => {
    localStorage.setItem(ACCORDION_STORAGE_KEY, JSON.stringify({ scheduled: 'yes', workflows: 1, teams: {} }));
    const { result } = renderHook(() => useSiderAccordionState());
    expect(result.current.state).toEqual({ scheduled: false, workflows: false, teams: false });
  });

  it('rejects non-object tampered payloads (e.g. JSON.stringify(true))', () => {
    localStorage.setItem(ACCORDION_STORAGE_KEY, JSON.stringify(true));
    const { result } = renderHook(() => useSiderAccordionState());
    expect(result.current.state).toEqual({ scheduled: false, workflows: false, teams: false });
  });

  it('storage key matches SPEC (sider.accordion.state.v1, no wayland prefix)', () => {
    expect(ACCORDION_STORAGE_KEY).toBe('sider.accordion.state.v1');
  });

  it('forward-tolerant: extra keys ignored, missing keys default to false', () => {
    localStorage.setItem(ACCORDION_STORAGE_KEY, JSON.stringify({ scheduled: true, futureSection: true }));
    const { result } = renderHook(() => useSiderAccordionState());
    expect(result.current.state).toEqual({ scheduled: true, workflows: false, teams: false });
  });
});
