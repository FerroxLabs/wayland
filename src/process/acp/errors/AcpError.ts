// src/process/acp/errors/AcpError.ts

import { redactSecrets } from '@process/utils/secretRedaction';

export type AcpErrorCode =
  | 'CONNECTION_FAILED'
  | 'AUTH_FAILED'
  | 'AUTH_REQUIRED'
  | 'SESSION_EXPIRED'
  | 'PROMPT_TIMEOUT'
  | 'PROCESS_CRASHED'
  | 'INVALID_STATE'
  | 'INTERNAL_ERROR'
  // Granular ACP JSON-RPC error codes
  | 'ACP_PARSE_ERROR' // -32700
  | 'INVALID_ACP_REQUEST' // -32600
  | 'ACP_METHOD_NOT_FOUND' // -32601
  | 'ACP_INVALID_PARAMS' // -32602
  | 'AGENT_INTERNAL_ERROR' // -32603
  | 'ACP_SESSION_NOT_FOUND' // -32001
  | 'AGENT_SESSION_NOT_FOUND' // -32002
  | 'ACP_ELICITATION_REQUIRED' // -32042
  | 'ACP_REQ_CANCELLED' // -32800
  | 'AGENT_ERROR'; // fallback for unmapped agent codes

export class AcpError extends Error {
  readonly retryable: boolean;
  /**
   * C7: the typed nano error payload (`error.data.nanoError`) when the
   * engine attached one — closed fields only (`kind`, `retryable`). Its
   * presence means retryability was already classified by the engine's
   * error-code table; consumers must NOT re-derive it from message text.
   */
  readonly nanoError?: { kind: string; retryable: boolean };

  constructor(
    public readonly code: AcpErrorCode,
    message: string,
    options?: { cause?: unknown; retryable?: boolean; nanoError?: { kind: string; retryable: boolean } }
  ) {
    super(message, { cause: options?.cause });
    this.name = 'AcpError';
    this.retryable = options?.retryable ?? false;
    this.nanoError = options?.nanoError;
  }
}

// ─── Proactive Error Subclasses (from AcpClient) ────────────────

/** spawn() itself failed (command not found, permission denied, etc.). */
export class AgentSpawnError extends AcpError {
  constructor(
    public readonly agentCommand: string,
    cause?: unknown
  ) {
    const msg = `Failed to spawn agent "${agentCommand}": ${cause instanceof Error ? cause.message : String(cause)}`;
    super('CONNECTION_FAILED', msg, { cause, retryable: true });
    this.name = 'AgentSpawnError';
  }
}

/**
 * Process exited before initialize completed. Includes stderr + exit code.
 *
 * #984: the agent's stderr is scrubbed HERE, at the single point where it enters
 * the error, rather than at each of the call sites that build one. An agent
 * subprocess prints to stderr exactly when credentials are in play (auth
 * failures echoing a token, an SDK logging request headers), and this message
 * is both shown to the user and written to the daily log file a bug report gets
 * attached to. `stderrSummary` is stored redacted for the same reason - a
 * consumer must not be able to reach the raw text by reading the field.
 */
export class AgentStartupError extends AcpError {
  /** Agent stderr, ALREADY redacted (#984). The raw text is never retained. */
  readonly stderrSummary: string;

  constructor(
    public readonly agentCommand: string,
    public readonly exitCode: number | null,
    public readonly signal: string | null,
    stderrSummary: string,
    cause?: unknown
  ) {
    const redactedStderr = stderrSummary ? redactSecrets(stderrSummary) : stderrSummary;
    const exitSummary = signal ? `signal: ${signal}` : `code: ${exitCode}`;
    const stderrSuffix = redactedStderr ? `\n${redactedStderr}` : '';
    super('PROCESS_CRASHED', `Agent exited before initialize completed (${exitSummary})${stderrSuffix}`, {
      cause,
      retryable: true,
    });
    this.name = 'AgentStartupError';
    this.stderrSummary = redactedStderr;
  }
}

/** Process died during an active request. Includes exit info. */
export class AgentDisconnectedError extends AcpError {
  constructor(
    public readonly reason: string,
    public readonly exitCode: number | null,
    public readonly signal: string | null,
    options?: { cause?: unknown; outputAlreadyEmitted?: boolean }
  ) {
    const exitSummary = signal ? `signal: ${signal}` : `code: ${exitCode}`;
    super('PROCESS_CRASHED', `Agent disconnected (${reason}, ${exitSummary})`, {
      cause: options?.cause,
      retryable: true,
    });
    this.name = 'AgentDisconnectedError';
    this.outputAlreadyEmitted = options?.outputAlreadyEmitted ?? false;
  }

  readonly outputAlreadyEmitted: boolean;
}
