/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IMcpServer } from '@/common/config/storage';

export type McpTransportCapabilities = {
  stdio: boolean;
  http: boolean;
  sse: boolean;
};

export type McpProjection =
  | { kind: 'direct'; transport: IMcpServer['transport']['type'] }
  | { kind: 'relay'; from: 'http' | 'streamable_http' | 'sse'; to: 'stdio' }
  | { kind: 'unsupported'; reason: string };

export type McpProjectionOptions = {
  /** True only after the version-pinned Wayland relay has passed its release gate. */
  relayAvailable?: boolean;
};

/**
 * Select a capability-honest connector projection.
 *
 * This function is deliberately side-effect free and does not activate the
 * relay. It is the proof seam for M1M: callers may project directly only when
 * the runtime advertises the transport, may relay remote transports only when
 * a proven stdio relay is available, and otherwise must fail visibly.
 */
export function selectMcpProjection(
  server: Pick<IMcpServer, 'name' | 'transport'>,
  capabilities: McpTransportCapabilities,
  options: McpProjectionOptions = {}
): McpProjection {
  const transport = server.transport.type;
  if (transport === 'stdio') {
    return capabilities.stdio
      ? { kind: 'direct', transport }
      : { kind: 'unsupported', reason: `${server.name} requires stdio MCP, which this agent does not support.` };
  }

  const directSupported = transport === 'sse' ? capabilities.sse : capabilities.http;
  if (directSupported) return { kind: 'direct', transport };

  if (options.relayAvailable && capabilities.stdio) {
    return { kind: 'relay', from: transport, to: 'stdio' };
  }

  const label = transport === 'sse' ? 'SSE' : 'Streamable HTTP';
  const relayReason = capabilities.stdio
    ? 'the Wayland remote-to-stdio relay is not available'
    : 'this agent also lacks the stdio fallback required by the Wayland relay';
  return {
    kind: 'unsupported',
    reason: `${server.name} requires ${label} MCP, which this agent does not support, and ${relayReason}.`,
  };
}
