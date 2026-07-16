import { createHmac, randomBytes } from 'node:crypto';
import type { IMcpServer } from '@/common/config/storage';
import { mcpServerCollisionKey } from '@/common/mcp';
import type {
  McpSessionBackend,
  McpSessionDefinitionDigest,
  McpSessionExpectedServer,
} from '@/common/mcp/sessionReceipt';
import { getPlatformServices } from '@/common/platform';

/**
 * Automatic task restart on MCP drift remains experimental. Passive Core v1
 * publication/registration receipts are production-safe and are deliberately
 * not controlled by this gate; they report evidence without driving a session.
 */
export const MCP_SESSION_TRUTH_PREVIEW_ENV = 'WAYLAND_MCP_SESSION_TRUTH_PREVIEW';

function isAuthoritativelyPackaged(): boolean {
  try {
    return getPlatformServices().paths.isPackaged();
  } catch {
    // Platform authority unavailable is not evidence that preview behavior is safe.
    return true;
  }
}

export function isMcpSessionTruthPreviewEnabled(
  env: NodeJS.ProcessEnv = process.env,
  packaged: boolean = isAuthoritativelyPackaged()
): boolean {
  // Test harness only. Development and packaged applications cannot activate
  // automatic task restart based on connector drift before MCP-2.
  return packaged === false && env.NODE_ENV === 'test' && env[MCP_SESSION_TRUTH_PREVIEW_ENV] === '1';
}

function sortedStringRecord(source?: Record<string, string>): Array<[string, string]> {
  return Object.entries(source ?? {}).toSorted(([left], [right]) => left.localeCompare(right));
}

/**
 * Build the integrity identity for the exact definition supplied to a session.
 * Credential values affect the digest, but a process-local random HMAC key
 * prevents the persisted value from becoming an offline secret verifier.
 */
export function mcpServerDefinitionDigest(
  server: IMcpServer,
  sessionKey: Uint8Array
): McpSessionDefinitionDigest {
  const transport =
    server.transport.type === 'stdio'
      ? {
          type: server.transport.type,
          command: server.transport.command,
          args: server.transport.args ?? [],
          env: sortedStringRecord(server.transport.env),
        }
      : {
          type: server.transport.type,
          url: server.transport.url,
          headers: sortedStringRecord(server.transport.headers),
        };
  const definition = {
    id: server.id,
    name: server.name,
    enabled: server.enabled === true,
    builtin: server.builtin === true,
    source: server.source ?? null,
    allowedTools: server.allowedTools?.toSorted() ?? null,
    transport,
  };
  return `hmac-sha256:${createHmac('sha256', sessionKey).update(JSON.stringify(definition)).digest('hex')}`;
}

/** Secret material lives only on the manager instance for this process launch. */
export function createMcpSessionDigestKey(): Uint8Array {
  return randomBytes(32);
}

/** Create the exact declaration/session binding consumed by the receipt reducer. */
export function createMcpSessionExpectedServer(
  server: IMcpServer,
  backend: McpSessionBackend,
  sessionKey: Uint8Array
): McpSessionExpectedServer {
  return {
    serverId: server.id,
    serverName: server.name,
    runtimeName: server.name,
    canonicalName: mcpServerCollisionKey(server.name),
    definitionDigest: mcpServerDefinitionDigest(server, sessionKey),
    backend,
    transport: server.transport.type,
    scope: 'conversation',
  };
}
