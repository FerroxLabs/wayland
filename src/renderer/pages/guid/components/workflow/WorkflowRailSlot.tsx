/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Rail-slot bridge for Build #116 (one-panel workflow layout).
 *
 * The workflow step rail is built inside {@link WorkflowSurface} (it owns the
 * single `useWorkflowSession` instance plus the derived `needsInput` flag and
 * jump/continue handlers). But visually it must live in ChatLayout's single
 * collapsible right sider, as the "Steps" tab beside "Workspace" — NOT in a
 * second fixed rail squeezing the chat.
 *
 * WorkflowSurface and the sider are sibling subtrees under ChatLayout, so we
 * bridge them with a portal: the sider's Steps tab mounts a host element and
 * registers it here; WorkflowSurface reads that element and `createPortal`s its
 * rail into it. React context flows THROUGH the portal, so the rail keeps its
 * session/handlers intact.
 *
 * `hasSlotHost` distinguishes "a tabbed sider is present, portal the rail" from
 * "no sider bridge in this tree" (legacy standalone mount → render inline).
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type WorkflowRailSlotContextValue = {
  /** The DOM node the Steps tab exposes as the portal target; null until it mounts. */
  slotEl: HTMLElement | null;
  /** Register / clear the portal target (called by the Steps-tab host ref). */
  setSlotEl: (el: HTMLElement | null) => void;
  /** True when a rail-slot provider wraps this subtree (i.e. a tabbed sider exists). */
  hasSlotHost: boolean;
};

const WorkflowRailSlotContext = createContext<WorkflowRailSlotContextValue>({
  slotEl: null,
  setSlotEl: () => {},
  hasSlotHost: false,
});

/** Wraps ChatLayout so its sider (Steps tab) and its children (WorkflowSurface) share one slot. */
export const WorkflowRailSlotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [slotEl, setSlotEl] = useState<HTMLElement | null>(null);
  const value = useMemo<WorkflowRailSlotContextValue>(() => ({ slotEl, setSlotEl, hasSlotHost: true }), [slotEl]);
  return <WorkflowRailSlotContext.Provider value={value}>{children}</WorkflowRailSlotContext.Provider>;
};

export function useWorkflowRailSlot(): WorkflowRailSlotContextValue {
  return useContext(WorkflowRailSlotContext);
}

/**
 * The Steps-tab portal target. Mounts a full-height host div and registers it
 * with the provider so WorkflowSurface's portal lands here. Clears the
 * registration on unmount so a stale node is never portaled into.
 */
export const WorkflowRailSlotHost: React.FC<{ className?: string }> = ({ className }) => {
  const { setSlotEl } = useWorkflowRailSlot();
  // Stable ref callback: an inline arrow would be a new function each render, so
  // React would detach (ref(null)) then re-attach (ref(el)) every render and
  // thrash the slot state. `setSlotEl` is memoized by the provider, so this is
  // called only on real mount/unmount.
  const setRef = useCallback((el: HTMLElement | null) => setSlotEl(el), [setSlotEl]);
  return (
    <div
      className={className}
      style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}
      ref={setRef}
      data-testid='workflow-rail-slot-host'
    />
  );
};
