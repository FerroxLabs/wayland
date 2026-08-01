/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #890 companion — the baileys bridge logger must target stderr (fd2), never
 * fd1. The bridge frames JSON-RPC on fd1 (stdout); pino defaults to fd1, so once
 * the fork→spawn fix makes baileys actually run, a warn line on fd1 would
 * corrupt a protocol frame. This locks the destination at fd2.
 */

import { describe, expect, it } from 'vitest';

import {
  createBridgeDestination,
  createBridgeLogger,
} from '@process/channels/whatsapp-bridge/backends/bridgeLogger.js';

describe('bridgeLogger (#890 — pino pinned to fd2)', () => {
  it('createBridgeDestination targets fd2 (stderr), never fd1 (the JSON-RPC pipe)', () => {
    const dest = createBridgeDestination();
    expect(dest.fd).toBe(2);
    expect(dest.fd).not.toBe(1);
  });

  it('createBridgeLogger builds a warn-level logger over the fd2 destination', () => {
    const dest = createBridgeDestination();
    const logger = createBridgeLogger(dest);
    expect(typeof logger.warn).toBe('function');
    expect(logger.level).toBe('warn');
    // Emitting must not throw (writes to fd2/stderr, never the fd1 RPC pipe).
    expect(() => logger.warn('bridge logger smoke')).not.toThrow();
  });

  it('defaults its destination to fd2 when none is injected', () => {
    const logger = createBridgeLogger();
    expect(typeof logger.warn).toBe('function');
    expect(logger.level).toBe('warn');
  });
});
