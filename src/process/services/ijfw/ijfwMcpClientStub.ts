/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * MCP client stub — placeholder shape for Wave 2 of v0.6.3.
 *
 * `applyPendingUpgrade()` in `ijfwSystemService` must shut down any live MCP
 * client before swapping the install directory. Wave 2 will land a real
 * client; this stub keeps the surface stable so Wave 1 can wire the call
 * sites today without leaking an `as any`. The stub's methods are no-ops
 * that report "drained" immediately.
 */

export const ijfwMcpClient = {
  /** Stop accepting new requests + flush in-flight. Real client lands in Wave 2. */
  async shutdown(): Promise<void> {
    /* no-op until Wave 2 wires the real client */
  },

  /**
   * Wait up to `_timeoutMs` for the client to fully drain.
   * Returns true if drained, false on timeout. Stub always reports true.
   */
  async waitForExit(_timeoutMs: number): Promise<boolean> {
    return true;
  },
};
