/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Strip connector secrets out of anything sent to a REMOTE (paired-device
 * WebSocket) client.
 *
 * Closing the execution path did not close exfiltration. `mcp.compare-and-set-config`
 * is now remote-denied, so a paired peer can no longer CHOOSE what the host
 * spawns - but three READ channels stayed remote-allowed and each returns
 * `IMcpServer[]` with `transport.env` and `transport.headers` verbatim:
 *
 *   mcp.get-config-snapshot      remoteDenied = false
 *   mcp.get-agent-configs        remoteDenied = false
 *   agent.config.storage.get     remoteDenied = false  (no gate at all - the
 *                                config gate matches `.set` only)
 *
 * Those fields carry API keys, bearer tokens and provider credentials. A token
 * that proves a paired BROWSER could read every connector secret on the machine.
 *
 * DENYING the keys was the other option and it is worse: the paired WebUI needs
 * that list to render the MCP page at all, so a denial ships a dead surface.
 * The remote client needs to know a connector EXISTS, what transport it uses and
 * whether it is healthy. It never needs the secret. So the value is replaced and
 * the SHAPE is preserved - the key names survive, so a UI can still say "3
 * environment variables set" without ever holding one.
 *
 * This lives at the wire because that is the only place the per-call remote
 * signal exists - the same reason `isRemoteDeniedConfigWrite` lives in the
 * adapter and not in the storage provider.
 */

/** Replaces every secret value. Not a real credential, and the same length for any input. */
export const REDACTED = '[redacted]';

/**
 * Outbound callback keys whose payload may carry connector secrets.
 *
 * Matched against the `subscribe.callback-<key><id>` name the adapter broadcasts,
 * by PREFIX, because the platform appends an 8-hex invocation id.
 */
const SECRET_BEARING_CALLBACK_PREFIXES: readonly string[] = [
  'subscribe.callback-mcp.get-config-snapshot',
  'subscribe.callback-mcp.get-agent-configs',
  'subscribe.callback-agent.config.storage.get',
  // The mutation path is remote-denied, but its RESPONSE echoes a full snapshot.
  // A denial that still returns the snapshot on some other path would be a hole,
  // so redact this one too rather than rely on the denial holding forever.
  'subscribe.callback-mcp.compare-and-set-config',
];

/** True iff this outbound wire name can carry connector secrets. */
export function isSecretBearingCallback(name: unknown): boolean {
  if (typeof name !== 'string') return false;
  return SECRET_BEARING_CALLBACK_PREFIXES.some((prefix) => name.startsWith(prefix));
}

/**
 * Field names whose VALUES are replaced wherever they appear in the payload.
 *
 * `env` and `headers` are the documented carriers. `apiKey`/`token`/`authorization`
 * are included because a connector record that grows one later must not become a
 * new hole silently - this is the one place where guessing wide is correct, since
 * over-redacting a remote payload costs a label and under-redacting costs a key.
 */
const SECRET_FIELDS = new Set(['env', 'headers', 'apiKey', 'apikey', 'token', 'authorization', 'password', 'secret']);

/**
 * Deep-clone `value`, replacing every secret-bearing field.
 *
 * For `env`/`headers` the KEY NAMES are kept and only the values replaced, so the
 * remote UI can still count and name them. For scalar secret fields the whole
 * value is replaced.
 *
 * Cycles are tolerated: a repeated object reference resolves to the string
 * '[cycle]' rather than recursing forever, because this runs on every outbound
 * message and must never be able to hang the socket.
 */
export function redactSecrets(value: unknown, seen: WeakSet<object> = new WeakSet()): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value as object)) return '[cycle]';
  seen.add(value as object);

  if (Array.isArray(value)) return value.map((entry) => redactSecrets(entry, seen));

  const out: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (!SECRET_FIELDS.has(key)) {
      out[key] = redactSecrets(entry, seen);
      continue;
    }
    if (entry !== null && typeof entry === 'object' && !Array.isArray(entry)) {
      // Keep the shape - the names of the variables are not the secret.
      const masked: Record<string, unknown> = {};
      for (const name of Object.keys(entry as Record<string, unknown>)) masked[name] = REDACTED;
      out[key] = masked;
      continue;
    }
    out[key] = entry === undefined ? undefined : REDACTED;
  }
  return out;
}

/**
 * Redact an outbound WebSocket payload if its wire name can carry secrets.
 * Any other message is returned UNCHANGED and untouched.
 */
export function redactForRemote(name: unknown, data: unknown): unknown {
  if (!isSecretBearingCallback(name)) return data;
  return redactSecrets(data);
}
