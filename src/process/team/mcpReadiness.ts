// src/process/team/mcpReadiness.ts
//
// Simple wait/notify mechanism for MCP tool readiness.
// When codex-acp receives mcpServers in session/new, it spawns the stdio
// subprocess asynchronously. The stdio script sends a TCP "mcp_ready"
// notification to TeamMcpServer after server.connect() completes.
// createOrResumeSession() awaits waitForMcpReady() so the first user
// message is not dispatched until MCP tools are registered.

/** Pending wait entry keyed by slotId */
const pendingReady = new Map<string, { resolve: () => void; timer: ReturnType<typeof setTimeout> }>();

/** Slots that notified readiness before waitForMcpReady was called */
const alreadyReady = new Set<string>();

/**
 * #7 - slots whose MCP readiness handshake TIMED OUT (the agent started without
 * team tools registered). This is the "team tools unavailable" flag: set on
 * timeout, cleared on a (late) notifyMcpReady, and read via {@link isMcpDegraded}
 * by status/finalizeTurn so a degraded agent is surfaced instead of silently
 * running toolless. We still resolve (never hard-fail) so the session degrades
 * gracefully; the flag is how callers learn it degraded.
 */
const degradedSlots = new Set<string>();

/**
 * Wait for MCP tools to become ready for the given agent slot.
 * Resolves when `notifyMcpReady(slotId)` is called, or after timeout.
 * Timeout resolves (not rejects) so the session degrades gracefully; on timeout
 * the slot is flagged degraded (see {@link isMcpDegraded}).
 */
export function waitForMcpReady(slotId: string, timeoutMs = 30_000): Promise<void> {
  // A fresh wait supersedes any stale degraded verdict from a prior attempt.
  degradedSlots.delete(slotId);

  // If already notified before wait was registered, resolve immediately
  if (alreadyReady.delete(slotId)) return Promise.resolve();

  return new Promise<void>((resolve) => {
    const timer = setTimeout(() => {
      pendingReady.delete(slotId);
      // Only mark degraded if readiness never arrived (a late notifyMcpReady
      // clears the entry + resolves before this fires).
      degradedSlots.add(slotId);
      console.warn(`[mcpReadiness] Timed out waiting for MCP ready: ${slotId} (proceeding without team tools)`);
      resolve();
    }, timeoutMs);
    pendingReady.set(slotId, { resolve, timer });
  });
}

/**
 * Signal that MCP tools are ready for the given agent slot.
 * Called by TeamMcpServer when it receives the TCP mcp_ready notification.
 */
export function notifyMcpReady(slotId: string): void {
  // Readiness arrived - clear any prior degraded verdict for this slot.
  degradedSlots.delete(slotId);
  const entry = pendingReady.get(slotId);
  if (entry) {
    clearTimeout(entry.timer);
    pendingReady.delete(slotId);
    entry.resolve();
  } else {
    // Notification arrived before wait - stash for immediate resolve
    alreadyReady.add(slotId);
    setTimeout(() => alreadyReady.delete(slotId), 60_000);
  }
}

/**
 * #7 - true when the given slot's MCP readiness handshake timed out and it is
 * running without team tools. Readable by status/finalizeTurn so a degraded
 * teammate can be surfaced. Cleared by a later successful notifyMcpReady or a
 * fresh waitForMcpReady.
 */
export function isMcpDegraded(slotId: string): boolean {
  return degradedSlots.has(slotId);
}
