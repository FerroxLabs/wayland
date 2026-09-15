// src/process/acp/errors/errorNormalize.ts

import { RequestError } from '@agentclientprotocol/sdk';
import { AcpError, type AcpErrorCode, type AcpErrorDetail } from '@process/acp/errors/AcpError';
import { extractAcpError, formatUnknownError } from '@process/acp/errors/errorExtract';

/**
 * SDK JSON-RPC error code → AcpErrorCode + retryable mapping.
 *
 * Standard JSON-RPC 2.0 codes (§5.1):
 *   -32700          Parse error
 *   -32600          Invalid Request
 *   -32601          Method not found
 *   -32602          Invalid params
 *   -32603          Internal error
 *
 * ACP-defined codes (see @agentclientprotocol/sdk schema.json ErrorCode):
 *   -32000          Auth required
 *   -32001          (legacy) Session not found - not in ACP schema, but
 *                   acpx recognises it (RESOURCE_NOT_FOUND_ACP_CODES)
 *   -32002          Resource not found
 *   -32042          URL elicitation required (unstable)
 *   -32800          Request cancelled (unstable)
 *
 * Current strategy: code-based mapping only.
 * acpx additionally performs message/data heuristics as a fallback for
 * non-compliant agents (see acpx/src/acp/error-shapes.ts for
 * `isAcpResourceNotFoundError` and error-normalization.ts for
 * `isAcpAuthRequiredPayload`). If we encounter agents that return
 * non-standard codes, we can adopt the same approach.
 */
const ACP_CODE_MAP: Record<number, { code: AcpErrorCode; retryable: boolean }> = {
  [-32700]: { code: 'ACP_PARSE_ERROR', retryable: true }, // Parse error
  [-32600]: { code: 'INVALID_ACP_REQUEST', retryable: false }, // Invalid request
  [-32601]: { code: 'ACP_METHOD_NOT_FOUND', retryable: false }, // Method not found
  [-32602]: { code: 'ACP_INVALID_PARAMS', retryable: false }, // Invalid params
  [-32603]: { code: 'AGENT_INTERNAL_ERROR', retryable: true }, // Agent Internal error
  [-32000]: { code: 'AUTH_REQUIRED', retryable: true }, // Auth required (ACP)
  [-32001]: { code: 'ACP_SESSION_NOT_FOUND', retryable: false }, // Session not found (legacy, also in acpx)
  [-32002]: { code: 'AGENT_SESSION_NOT_FOUND', retryable: false }, // Resource not found (ACP)
  [-32042]: { code: 'ACP_ELICITATION_REQUIRED', retryable: false }, // URL elicitation required (ACP, unstable)
  [-32800]: { code: 'ACP_REQ_CANCELLED', retryable: false }, // Request cancelled (ACP, unstable)
};

const RETRYABLE_ERRNO = new Set(['ECONNREFUSED', 'ECONNRESET', 'EPIPE', 'ETIMEDOUT']);

/** Longest `data.message` folded into the user-visible message; the full error stays on `cause`. */
const MAX_DATA_MESSAGE_CHARS = 1000;

// eslint-disable-next-line no-control-regex -- control characters are exactly what is being removed
const CONTROL_CHARS = /[\u0000-\u001F\u007F-\u009F]+/g;

/**
 * Characters that occupy no width but change how the text around them reads: bidi overrides and isolates
 * (U+202A-U+202E, U+2066-U+2069), zero-width spaces, joiners and directional marks (U+200B-U+200F) and the
 * BOM. An agent's `data.message` is rendered by something we do not control, so text that can lie about
 * itself — `delete \u202Egnp.txt` reading as `delete txt.png` — never reaches the chat.
 */
const INVISIBLE_CHARS = /[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;

function asDataRecord(data: unknown): Record<string, unknown> | undefined {
  return data !== null && typeof data === 'object' && !Array.isArray(data)
    ? (data as Record<string, unknown>)
    : undefined;
}

/** `data` as text: a string trimmed, anything else JSON. What the message carried before typed rendering. */
function serializeErrorData(data: unknown): string {
  if (data == null) return '';
  if (typeof data === 'string') return data.trim();
  try {
    const json = JSON.stringify(data);
    return json && json !== '{}' && json !== 'null' ? json : '';
  } catch {
    return '';
  }
}

/**
 * An engine's `data.message` reaches the chat verbatim, so drop the invisible characters, flatten control
 * characters (terminal escapes, NULs, newlines) to single spaces and cap the length.
 */
function sanitizeDataMessage(message: string): string {
  const flattened = message.replace(INVISIBLE_CHARS, '').replace(CONTROL_CHARS, ' ').replace(/\s+/g, ' ').trim();
  const chars = Array.from(flattened);
  if (chars.length <= MAX_DATA_MESSAGE_CHARS) return flattened;
  return `${chars.slice(0, MAX_DATA_MESSAGE_CHARS - 1).join('')}\u2026`;
}

/**
 * JSON-RPC errors (notably -32603 "Internal error") carry the human-readable
 * detail in `data`, not `message`. Render that detail as a string so it can be
 * folded into the surfaced message instead of being discarded.
 *
 * Object data with a string `message` (Fuigo 1.0.18: `{ message, error_kind, http_status? }`) shows that
 * message, sanitized, never the raw object; its typed fields travel on the AcpError instead
 * (`errorDataDetail`). Plain strings and other objects render as before.
 */
function describeErrorData(data: unknown): string {
  const record = asDataRecord(data);
  if (record && typeof record.message === 'string') return sanitizeDataMessage(record.message);
  return serializeErrorData(data);
}

/**
 * The machine-readable half of an agent's error `data`: `error_kind` and `http_status` when well-formed,
 * plus `rawMessage` — the message as it read before typed rendering, so matchers that still read prose
 * (from untyped agents, and for the kinds that only say HOW a call failed) see the same characters they
 * saw before this shape existed.
 */
function errorDataDetail(message: string, data: unknown): AcpErrorDetail {
  const record = asDataRecord(data);
  const kind = record?.error_kind;
  const status = record?.http_status;
  return {
    errorKind: typeof kind === 'string' && kind !== '' ? kind : undefined,
    httpStatus:
      typeof status === 'number' && Number.isInteger(status) && status >= 100 && status <= 599 ? status : undefined,
    rawMessage: withRawErrorDetail(message, data),
  };
}

/**
 * Append the error's `data` detail to its `message` when it adds information.
 * Without this, an agent that replies `-32603 "Internal error"` with the real
 * cause in `data` shows the user a bare "Internal error" and the detail is lost
 * before it reaches the (already expandable) chat error tip. (#69)
 */
function withErrorDetail(message: string, data: unknown): string {
  return appendDetail(message, describeErrorData(data));
}

/** [`withErrorDetail`] as it read before object `data` was rendered as `data.message`. See `AcpErrorDetail.rawMessage`. */
function withRawErrorDetail(message: string, data: unknown): string {
  return appendDetail(message, serializeErrorData(data));
}

function appendDetail(message: string, detail: string): string {
  if (!detail || message.includes(detail)) return message;
  return `${message}: ${detail}`;
}

const AUTH_KEYWORDS_RE =
  /\btoken\s+(is\s+)?expired\b|\bsso\s+login\b|\bunauthorized\b|\bforbidden\b|\bcredential\b|\bapi[_ ]?key\b|\bnot\s+authenticated\b|\baccess\s+denied\b/i;

/**
 * Normalize any error into AcpError.
 * If already AcpError, return as-is.
 */
export function normalizeError(error: unknown): AcpError {
  if (error instanceof AcpError) return error;

  // Check for Node.js errno (connection errors)
  if (error instanceof Error) {
    const errno = (error as NodeJS.ErrnoException).code;
    if (errno && RETRYABLE_ERRNO.has(errno)) {
      return new AcpError('CONNECTION_FAILED', error.message, {
        cause: error,
        retryable: true,
      });
    }
  }

  // Prefer SDK's RequestError - it carries a typed .code from the ACP schema.
  if (error instanceof RequestError) {
    const mapped = ACP_CODE_MAP[error.code];

    // Message-based heuristic: some agents return auth failures as -32603
    // (Internal error) instead of -32000 (Auth required). Detect common
    // auth-related keywords to surface the correct auth flow to the user.
    if (mapped && mapped.code !== 'AUTH_REQUIRED' && isAuthRelatedMessage(error.message)) {
      return new AcpError('AUTH_REQUIRED', error.message, { cause: error, retryable: true });
    }

    if (mapped) {
      return new AcpError(mapped.code, withErrorDetail(error.message, error.data), {
        cause: error,
        retryable: mapped.retryable,
        ...errorDataDetail(error.message, error.data),
      });
    }
    return new AcpError('AGENT_ERROR', withErrorDetail(error.message, error.data), {
      cause: error,
      retryable: false,
      ...errorDataDetail(error.message, error.data),
    });
  }

  // Detect SDK "ACP connection closed" - child process exited before responding.
  // This is typically a transient process crash and should be retryable.
  if (error instanceof Error && /ACP connection closed/i.test(error.message)) {
    return new AcpError('PROCESS_CRASHED', error.message, {
      cause: error,
      retryable: true,
    });
  }

  // Fallback: legacy recursive extraction for non-SDK errors
  const acpPayload = extractAcpError(error);
  if (acpPayload) {
    // Try code-based mapping first (same ACP codes)
    const mapped = ACP_CODE_MAP[acpPayload.code];
    if (mapped) {
      return new AcpError(mapped.code, withErrorDetail(acpPayload.message, acpPayload.data), {
        cause: error,
        retryable: mapped.retryable,
        ...errorDataDetail(acpPayload.message, acpPayload.data),
      });
    }
    return new AcpError('AGENT_ERROR', withErrorDetail(acpPayload.message, acpPayload.data), {
      cause: error,
      retryable: false,
      ...errorDataDetail(acpPayload.message, acpPayload.data),
    });
  }

  // Fallback
  return new AcpError('INTERNAL_ERROR', formatUnknownError(error), { cause: error });
}

/** Check if error is retryable for prompt operations */
export function isRetryablePromptError(error: unknown): boolean {
  if (error instanceof AcpError) return error.retryable;
  const normalized = normalizeError(error);
  return normalized.retryable;
}

/** Detect auth-related failures from error messages - for agents that don't use -32000. */
function isAuthRelatedMessage(message: string): boolean {
  return AUTH_KEYWORDS_RE.test(message);
}
