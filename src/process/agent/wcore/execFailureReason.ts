/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * #853 - exec/process-failure surfacing ONLY.
 *
 * These two pure helpers translate a Node spawn errno (`err.code`) and a process
 * exit `(code, signal)` into the honest, human-readable launch/exit reason that
 * the chat error surface should show - so a spawn `ENOENT` (missing/AV-blocked
 * binary) or an AV `SIGKILL` names its real cause instead of a generic string or
 * "exited with code null". They are deliberately spawn-free and dependency-free
 * so both the agent (`index.ts`) and the manager (`WCoreManager.ts`) route
 * through the exact same wording and can be unit-tested without a process.
 *
 * This is NOT an error taxonomy/catalog (Sean-locked scope). Provider / model
 * API errors are a different surface entirely - they arrive as engine stream
 * `type:'error'` events and already render verbatim - and must not pass through
 * here. Redaction is not done here (errno codes and signal names carry no
 * secrets); the callers redact the composed string at the point it is surfaced.
 */

/**
 * Human launch-failure reason for a child-process spawn `'error'` event. Maps the
 * telling errnos to a missing/blocked lead and always keeps the raw errno token;
 * any other or absent code falls back to a generic lead that still carries the
 * original message so the reason is never empty or bare.
 */
export function describeSpawnError(err: NodeJS.ErrnoException): string {
  const code = err?.code;
  switch (code) {
    case 'ENOENT':
      return 'Wayland Core could not be launched: the engine binary is missing or was blocked by antivirus, a firewall, or a code-signature check (ENOENT).';
    case 'EACCES':
    case 'EPERM':
      return `Wayland Core could not be launched: the engine binary is not executable or was blocked by antivirus or an OS code-signature check (${code}).`;
    default: {
      const message = err?.message?.trim() ? err.message.trim() : 'unknown error';
      const codeSuffix = code ? ` (${code})` : '';
      return `Wayland Core could not be launched: ${message}${codeSuffix}`;
    }
  }
}

/**
 * Human exit reason for a process `'exit'` event. A kill signal is the most
 * telling AV/OS-block signal, so when `signal` is set it wins and names the
 * signal - never "code null". Otherwise the numeric exit code is reported
 * byte-exactly as `exited with code <code>` (the #484 init-reject composition
 * depends on that exact wording).
 */
export function describeExitReason(code: number | null, signal: NodeJS.Signals | null): string {
  if (signal) {
    return `killed by ${signal} (likely antivirus, firewall, or OS code-signature block)`;
  }
  return `exited with code ${code}`;
}
