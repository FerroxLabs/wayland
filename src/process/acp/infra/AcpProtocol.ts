// src/process/acp/infra/AcpProtocol.ts

import type {
  Client,
  ForkSessionResponse,
  InitializeResponse,
  LoadSessionResponse,
  McpServer,
  NewSessionResponse,
  PromptResponse,
  SetSessionConfigOptionRequest,
  Stream,
} from '@agentclientprotocol/sdk';
import { ClientSideConnection, PROTOCOL_VERSION } from '@agentclientprotocol/sdk';
import type { PromptContent, ProtocolHandlers } from '@process/acp/types';
import type { SignedWaylandNanoActivation } from '@process/agent/activation/types';

// ─── Protocol-layer Params ────────────────────────────────────

export type CreateSessionParams = {
  cwd: string;
  mcpServers?: McpServer[];
  additionalDirectories?: string[];
  /** Untrusted caller metadata; reserved Nano authority keys are always removed. */
  metadata?: Readonly<Record<string, unknown>>;
};

export type LoadSessionParams = {
  sessionId: string;
  cwd: string;
  mcpServers?: McpServer[];
  additionalDirectories?: string[];
  /** Untrusted caller metadata; reserved Nano authority keys are always removed. */
  metadata?: Readonly<Record<string, unknown>>;
};

const RESERVED_NANO_METADATA = new Set(['waylandNanoActivation', 'waylandNanoControl']);
const RESERVED_SESSION_METHODS = new Set(['session/new', 'session/load', 'session/cancel', 'session/pause']);

/** Sole closed projection from untrusted caller metadata to final ACP session metadata. */
export function projectSessionMetadata(
  metadata: Readonly<Record<string, unknown>> | undefined,
  activation?: SignedWaylandNanoActivation
): Record<string, unknown> | undefined {
  const projected: Record<string, unknown> = {};
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
    for (const [key, value] of Object.entries(metadata)) {
      if (!RESERVED_NANO_METADATA.has(key)) projected[key] = value;
    }
  }
  if (activation) projected.waylandNanoActivation = activation;
  return Object.keys(projected).length > 0 ? projected : undefined;
}

export function assertAcpExtensionMethodAllowed(method: string): void {
  if (RESERVED_SESSION_METHODS.has(method)) {
    throw new Error(`ACP method ${method} must use its authority-mediating typed API`);
  }
}

export type ForkSessionParams = {
  sessionId: string;
  cwd: string;
  mcpServers?: McpServer[];
  additionalDirectories?: string[];
};

export type ProtocolFactory = (stream: Stream, handlers: ProtocolHandlers) => AcpProtocol;

// ─── AcpProtocol Class ─────────────────────────────────────────

export class AcpProtocol {
  private readonly sdk: ClientSideConnection;

  constructor(stream: Stream, handlers: ProtocolHandlers) {
    this.sdk = new ClientSideConnection(
      (_agent): Client => ({
        sessionUpdate: async (params) => handlers.onSessionUpdate(params),
        requestPermission: async (params) => handlers.onRequestPermission(params),
        readTextFile: async (params) => handlers.onReadTextFile(params),
        writeTextFile: async (params) => handlers.onWriteTextFile(params),
      }),
      stream
    );
  }

  async initialize(): Promise<InitializeResponse> {
    const result = await this.sdk.initialize({
      clientInfo: { name: 'Wayland', version: '2.0.0' },
      protocolVersion: PROTOCOL_VERSION,
      clientCapabilities: {
        fs: {
          readTextFile: true,
          writeTextFile: true,
        },
      },
    });
    console.log(`[AcpProtocol] Initialized: \n<- ${JSON.stringify(result)}`);
    return result;
  }

  async authenticate(methodId: string): Promise<unknown> {
    return this.sdk.authenticate({ methodId });
  }

  async createSession(params: CreateSessionParams): Promise<NewSessionResponse> {
    return this.sdk.newSession({
      cwd: params.cwd,
      mcpServers: params.mcpServers ?? [],
      additionalDirectories: params.additionalDirectories,
      _meta: projectSessionMetadata(params.metadata),
    });
  }

  async loadSession(params: LoadSessionParams): Promise<LoadSessionResponse> {
    return this.sdk.loadSession({
      sessionId: params.sessionId,
      cwd: params.cwd,
      mcpServers: params.mcpServers ?? [],
      additionalDirectories: params.additionalDirectories,
      _meta: projectSessionMetadata(params.metadata),
    });
  }

  async forkSession(params: ForkSessionParams): Promise<ForkSessionResponse> {
    return this.sdk.unstable_forkSession({
      sessionId: params.sessionId,
      cwd: params.cwd,
      mcpServers: params.mcpServers ?? [],
      additionalDirectories: params.additionalDirectories,
    });
  }

  async prompt(sessionId: string, content: PromptContent): Promise<PromptResponse> {
    return this.sdk.prompt({
      sessionId,
      prompt: content,
    });
  }

  async cancel(sessionId: string): Promise<void> {
    await this.sdk.cancel({ sessionId });
  }

  async setModel(sessionId: string, modelId: string): Promise<void> {
    await this.sdk.unstable_setSessionModel({ sessionId, modelId });
  }

  async setMode(sessionId: string, modeId: string): Promise<void> {
    await this.sdk.setSessionMode({ sessionId, modeId });
  }

  async setConfigOption(sessionId: string, configId: string, value: string | boolean): Promise<void> {
    const params: SetSessionConfigOptionRequest =
      typeof value === 'boolean' ? { sessionId, configId, type: 'boolean', value } : { sessionId, configId, value };
    await this.sdk.setSessionConfigOption(params);
  }

  async closeSession(sessionId: string): Promise<void> {
    await this.sdk.unstable_closeSession({ sessionId });
  }

  async extMethod(method: string, params: Record<string, unknown>): Promise<unknown> {
    assertAcpExtensionMethodAllowed(method);
    return this.sdk.extMethod(method, params);
  }

  get closed(): Promise<void> {
    return this.sdk.closed;
  }

  get signal(): AbortSignal {
    return this.sdk.signal;
  }
}

/** Default factory for production use. */
export const defaultProtocolFactory: ProtocolFactory = (stream, handlers) => new AcpProtocol(stream, handlers);
