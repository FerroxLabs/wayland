/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * baileys logger for the WhatsApp bridge child (#890 companion).
 *
 * The bridge frames its JSON-RPC protocol on stdout (fd1) — see
 * `bridge.js` `writeFrame`. pino defaults to fd1, so a baileys warn line would
 * land on the SAME channel as the protocol and corrupt a frame. Once the #890
 * fork→spawn fix makes baileys actually run in packaged builds, that leak goes
 * live. Pin the logger to stderr (fd2) so nothing baileys logs can ever reach
 * the protocol pipe. The destination is exposed separately so a unit test can
 * assert `fd === 2` without reaching into pino internals.
 */

import pino from 'pino';

/** The bridge logger destination: stderr (fd2), never the fd1 JSON-RPC pipe. */
export function createBridgeDestination() {
  return pino.destination(2);
}

/**
 * Build the baileys logger, pinned to stderr. `dest` is injectable for tests.
 */
export function createBridgeLogger(dest = createBridgeDestination()) {
  return pino({ level: 'warn' }, dest);
}
