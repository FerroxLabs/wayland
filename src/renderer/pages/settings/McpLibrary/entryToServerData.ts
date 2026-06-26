/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IMcpServer, IMcpServerTransport } from '@/common/config/storage';
import type { CatalogEntry } from './types';

// Catalog uses hyphenated transport types ('streamable-http'); storage uses
// underscored ('streamable_http'). Normalize between them to avoid invalid
// transport.type values reaching the connection layer.
export function normalizeRemoteType(t: string): 'sse' | 'http' | 'streamable_http' {
  if (t === 'streamable-http' || t === 'streamable_http') return 'streamable_http';
  if (t === 'sse') return 'sse';
  return 'http';
}

/** Append `name=value` to a URL, choosing `?` or `&` based on existing query. */
function appendQueryParam(url: string, name: string, value: string): string {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
}

/**
 * Translate a catalog entry + the user's setup-guide inputs into the persisted
 * MCP server record (transport + metadata). Pure and side-effect-free so it can
 * be unit-tested without the DetailPage component tree.
 */
export function entryToServerData(
  entry: CatalogEntry,
  envValues: Record<string, string>
): Omit<IMcpServer, 'id' | 'createdAt' | 'updatedAt'> {
  const pkg = entry.packages.length > 0 ? entry.packages[0] : undefined;
  const remote = entry.remotes && entry.remotes.length > 0 ? entry.remotes[0] : undefined;

  if (!pkg && !remote) {
    throw new Error(`Catalog entry ${entry.name} has no installable target.`);
  }

  // Trim user-entered credential values. A stray space/newline picked up when
  // pasting (e.g. a Google OAuth client secret) would otherwise be persisted
  // verbatim onto transport.env and silently break the subprocess's own auth
  // with `invalid_client` - the visible characters look correct, so it's a
  // brutal one to diagnose. Empty values are preserved so an unset optional var
  // still round-trips.
  const cleanEnv: Record<string, string> = Object.fromEntries(
    Object.entries(envValues).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
  );

  // Prefer remote (hosted MCP) if both are present - no local spawn required.
  // For an api-key hosted server the user's token is sent as a Bearer
  // Authorization header (McpProtocol forwards transport.headers for
  // streamable-http/sse). Static catalog headers are merged first so an entry
  // can still pin extra headers. A user-entered Authorization wins.
  const remoteHeaders: Record<string, string> =
    remote?.headers && remote.headers.length > 0
      ? Object.fromEntries(remote.headers.map((h) => [h.name, h.value]))
      : {};
  // A hosted server that authenticates via a URL query parameter (e.g. Exa)
  // gets the token injected into the URL instead of a header.
  let remoteUrl = remote?.url;
  if (remote && entry['x-wayland'].auth?.method === 'api-key') {
    const token = Object.values(envValues).find((v) => typeof v === 'string' && v.trim().length > 0);
    if (token) {
      const queryParam = entry['x-wayland'].auth.queryParam?.trim();
      if (queryParam) {
        // URL-keyed auth (Exa: ?exaApiKey=<token>). A header would be ignored.
        remoteUrl = appendQueryParam(remote.url, queryParam, token.trim());
      } else {
        // Most hosted api-key servers want `Authorization: Bearer <token>`, but
        // some use a custom header with the raw token (New Relic `Api-Key`,
        // Readwise `X-Access-Token`). Honour the per-entry override.
        const headerName = entry['x-wayland'].auth.header?.trim() || 'Authorization';
        remoteHeaders[headerName] = headerName === 'Authorization' ? `Bearer ${token.trim()}` : token.trim();
      }
    }
  }
  // Extra CLI args after the package id (subcommand / toolset flag / cred flag),
  // with `{{VAR}}` substituted from the user's setup-guide inputs. Empty args
  // (an unfilled optional `{{VAR}}`) are dropped so we never pass a bare flag value.
  const runtimeArgs = (pkg?.runtimeArguments ?? [])
    .map((a) => a.replace(/\{\{(\w+)\}\}/g, (_m, k) => cleanEnv[k] ?? ''))
    .filter((a) => a.length > 0);
  const transport: IMcpServerTransport = remote
    ? {
        type: normalizeRemoteType(remote.type),
        url: remoteUrl ?? remote.url,
        ...(Object.keys(remoteHeaders).length > 0 ? { headers: remoteHeaders } : {}),
      }
    : pkg!.runtimeHint === 'native'
      ? {
          // Bundled @wayland MCP: spawn via the local Node runtime against the
          // bare bundle filename. The main-process spawn layer
          // (McpProtocol.testStdioConnection) rewrites args[0] to an absolute
          // path under out/main (dev) or app.asar.unpacked/out/main (prod).
          type: 'stdio',
          command: 'node',
          args: [pkg!.identifier, ...runtimeArgs],
          env: cleanEnv,
        }
      : {
          type: 'stdio',
          command: pkg!.runtimeHint,
          args: [...(pkg!.identifier ? [pkg!.identifier] : []), ...runtimeArgs],
          env: cleanEnv,
        };

  // The catalog id is reverse-DNS with a slash (com.vendor/name), but an MCP
  // server name written into a CLI agent's config must match
  // /^[A-Za-z0-9_.-]+$/ (validateMcpServer). Sanitize to the safe form (same
  // convention as the entry filename) so the agent-sync step doesn't reject it.
  // libraryEntryId keeps the canonical slug for install/dedup matching.
  const safeName = entry.name.replace(/[^A-Za-z0-9_.-]/g, '-');

  return {
    name: safeName,
    description: entry.description,
    enabled: false,
    transport,
    originalJson: JSON.stringify({ source: 'library', entry: entry.name }),
    source: 'library',
    libraryEntryId: entry.name,
  };
}
