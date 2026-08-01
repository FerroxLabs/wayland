import { createHmac, randomBytes } from 'node:crypto';
import type { IMcpServer } from '@/common/config/storage';
import { mcpServerCollisionKey } from '@/common/mcp';
import type { McpConnectionTestResult, McpPrepublicationTruth } from './McpProtocol';
import { MCP_PREPUBLICATION_TRUTH_VERSION } from './McpProtocol';
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

const RAW_PROBE_FIELDS = new Set(['success', 'tools', 'error', 'needsAuth', 'authMethod', 'wwwAuthenticate']);
const TOOL_FIELDS = new Set(['name', 'description', '_meta']);

function assertPlainRecord(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Invalid MCP ${label}: expected an object`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error(`Invalid MCP ${label}: expected a plain object`);
  }
}

function assertNoUnknownFields(value: Record<string, unknown>, allowed: Set<string>, label: string): void {
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length > 0) {
    throw new Error(`Invalid MCP ${label}: unknown field(s): ${unknown.toSorted().join(', ')}`);
  }
}

function validateProbeTools(value: unknown): McpConnectionTestResult['tools'] {
  if (!Array.isArray(value)) throw new Error('Invalid MCP probe result: successful probe requires a tools array');
  const names = new Set<string>();
  return value.map((candidate, index): NonNullable<McpConnectionTestResult['tools']>[number] => {
    assertPlainRecord(candidate, `probe tool ${index}`);
    assertNoUnknownFields(candidate, TOOL_FIELDS, `probe tool ${index}`);
    if (typeof candidate.name !== 'string' || candidate.name.trim().length === 0) {
      throw new Error(`Invalid MCP probe tool ${index}: name is required`);
    }
    if (names.has(candidate.name)) throw new Error(`Invalid MCP probe result: duplicate tool "${candidate.name}"`);
    names.add(candidate.name);
    if (candidate.description !== undefined && typeof candidate.description !== 'string') {
      throw new Error(`Invalid MCP probe tool "${candidate.name}": description must be a string`);
    }
    let metadata: Record<string, unknown> | undefined;
    if (candidate._meta !== undefined) {
      assertPlainRecord(candidate._meta, `probe tool "${candidate.name}" metadata`);
      metadata = candidate._meta;
    }
    const tool: NonNullable<McpConnectionTestResult['tools']>[number] = {
      name: candidate.name,
    };
    if (typeof candidate.description === 'string') tool.description = candidate.description;
    if (metadata !== undefined) tool._meta = metadata;
    return tool;
  });
}

/**
 * Validate an adapter's raw standalone-probe result and bind it to the exact
 * saved declaration that was probed. This is deliberately pre-publication:
 * the returned evidence cannot authorize an agent adapter or an active chat.
 */
export function bindMcpPrepublicationProbeTruth(
  server: IMcpServer,
  rawResult: McpConnectionTestResult,
  observedAt: number = Date.now()
): McpConnectionTestResult & { prepublication: McpPrepublicationTruth } {
  assertPlainRecord(rawResult, 'probe result');
  assertNoUnknownFields(rawResult, RAW_PROBE_FIELDS, 'probe result');
  if (typeof server.id !== 'string' || server.id.trim().length === 0) {
    throw new Error('Invalid MCP probe declaration: server id is required');
  }
  if (!Number.isSafeInteger(server.updatedAt) || server.updatedAt <= 0) {
    throw new Error('Invalid MCP probe declaration: updatedAt must be a positive integer');
  }
  if (typeof rawResult.success !== 'boolean') throw new Error('Invalid MCP probe result: success must be boolean');
  if (rawResult.needsAuth !== undefined && typeof rawResult.needsAuth !== 'boolean') {
    throw new Error('Invalid MCP probe result: needsAuth must be boolean');
  }
  if (rawResult.error !== undefined && typeof rawResult.error !== 'string') {
    throw new Error('Invalid MCP probe result: error must be a string');
  }
  if (rawResult.wwwAuthenticate !== undefined && typeof rawResult.wwwAuthenticate !== 'string') {
    throw new Error('Invalid MCP probe result: wwwAuthenticate must be a string');
  }
  if (!Number.isSafeInteger(observedAt) || observedAt <= 0) {
    throw new Error('Invalid MCP probe result: observedAt must be a positive integer');
  }

  const base = {
    version: MCP_PREPUBLICATION_TRUTH_VERSION,
    serverId: server.id,
    serverName: server.name,
    serverUpdatedAt: server.updatedAt,
    observedAt,
  } as const;

  if (rawResult.success) {
    if (
      rawResult.needsAuth === true ||
      rawResult.error !== undefined ||
      rawResult.authMethod !== undefined ||
      rawResult.wwwAuthenticate !== undefined
    ) {
      throw new Error('Invalid MCP probe result: success contradicts authentication or error evidence');
    }
    const tools = validateProbeTools(rawResult.tools);
    return {
      success: true,
      tools,
      prepublication: {
        ...base,
        state: 'probed',
        authentication: 'validated',
        probe: 'succeeded',
        toolCount: tools.length,
      },
    };
  }

  if (rawResult.tools !== undefined) {
    throw new Error('Invalid MCP probe result: failed or incomplete probe cannot report tools');
  }
  if (rawResult.needsAuth === true) {
    if (rawResult.authMethod !== undefined && rawResult.authMethod !== 'oauth' && rawResult.authMethod !== 'basic') {
      throw new Error('Invalid MCP probe result: unsupported authentication method');
    }
    return {
      success: false,
      needsAuth: true,
      ...(rawResult.error === undefined ? {} : { error: rawResult.error }),
      ...(rawResult.authMethod === undefined ? {} : { authMethod: rawResult.authMethod }),
      ...(rawResult.wwwAuthenticate === undefined ? {} : { wwwAuthenticate: rawResult.wwwAuthenticate }),
      prepublication: {
        ...base,
        state: 'authentication-required',
        authentication: 'required',
        probe: 'not-completed',
        ...(rawResult.authMethod === undefined ? {} : { authMethod: rawResult.authMethod }),
      },
    };
  }

  if (rawResult.authMethod !== undefined || rawResult.wwwAuthenticate !== undefined) {
    throw new Error('Invalid MCP probe result: authentication evidence requires needsAuth=true');
  }

  if (typeof rawResult.error !== 'string' || rawResult.error.trim().length === 0) {
    throw new Error('Invalid MCP probe result: failure requires a non-empty error');
  }
  return {
    success: false,
    error: rawResult.error,
    prepublication: {
      ...base,
      state: 'probe-failed',
      authentication: 'unavailable',
      probe: 'failed',
      error: rawResult.error,
    },
  };
}

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
export function mcpServerDefinitionDigest(server: IMcpServer, sessionKey: Uint8Array): McpSessionDefinitionDigest {
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
