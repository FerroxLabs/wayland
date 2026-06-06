/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * IJFW IPC verb schemas - trust boundary for renderer → main verb invocations.
 * Fixes SEC-002 (positive-root path containment), SEC-011 (prototype pollution),
 * SEC-012 (byte-count not utf16-unit count).
 */

import * as path from 'node:path';
import { app } from 'electron';
import { z } from 'zod';
import { IJFW_ERROR_REASONS, type IjfwErrorReason } from '@/common/types/ijfw';

export const ALLOWED_VERBS = [
  'think',
  'links',
  'wiki.get',
  'wiki.compile',
  'wiki.promote',
  'wiki.export',
  'wiki.shareReadme',
  'conflict.resolve',
  // Wave 7 B1: memory.* family - used by every Memory tab via `useIjfwBrain`.
  // The renderer's `IjfwVerb` union (src/renderer/pages/memory/types/brain.ts)
  // declared these as legal but they were silently rejected by the bridge zod
  // gate because they were absent from this allowlist. MemoryPage's routing
  // gate uses `memory_facts` - without it MemoryPage collapses to the
  // degraded fallback.
  'memory_recall',
  'memory_search',
  'memory_store',
  'memory_facts',
  'memory_prelude',
  // Wave 7 B1: diagnostics / lifecycle.
  'state',
  'metrics',
  'prompt_check',
  'update_check',
  'update_apply',
  // Wave 7 B1: cross-project audit + search.
  'cross_audit_converge',
  'cross_project_search',
] as const;
export type IjfwVerb = (typeof ALLOWED_VERBS)[number];

const slugSchema = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9][a-z0-9-]*$/);

const queryStringSchema = z.string().min(1).max(2000);

// SEC-002: positive-root containment, not denylist.
function getAllowedExportRoots(): string[] {
  return [app.getPath('downloads'), app.getPath('documents')].map((p) => path.resolve(p));
}

const exportPathSchema = z.string().refine((p) => {
  const resolved = path.resolve(p);
  const roots = getAllowedExportRoots();
  return roots.some((root) => {
    const rel = path.relative(root, resolved);
    return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
  });
}, 'Path must be inside Downloads or Documents');

const COMPILE_TYPES = ['summary', 'timeline', 'entity', 'concept', 'candidate'] as const;

// Wave 7 B1: memory_store payload byte cap. Server already enforces a 256KB
// limit; reject early so the IPC layer never enqueues an oversized write to
// the MCP child.
const MEMORY_STORE_MAX_BYTES = 262_144;
const memoryStoreContentSchema = z
  .string()
  .min(1)
  .refine((s) => Buffer.byteLength(s, 'utf8') <= MEMORY_STORE_MAX_BYTES, 'content exceeds 256KB');

export const verbSchemas: Record<IjfwVerb, z.ZodTypeAny> = {
  think: z.object({ query: queryStringSchema, k: z.number().int().min(1).max(50).optional() }).passthrough(),
  // Wave 7 B4: HomeTab calls `links` with `{}` to get the recent-links view;
  // entity-link mode (with `of`) still works for memory cross-references.
  links: z.object({ of: slugSchema.optional() }).passthrough(),
  // Wave 7 B2: slug is optional - HomeTab + WikiTab call wiki.get with `{}`
  // to fetch the entry list. Detail-mode (with slug) still works for
  // single-entry compile reads.
  'wiki.get': z.object({ slug: slugSchema.optional() }).passthrough(),
  'wiki.compile': z.object({
    subject: z.string().min(1).max(500),
    type: z.enum(COMPILE_TYPES).optional(),
  }),
  // Wave 7 B1: HomeTab + PromotionsTab call wiki.promote with `{id}`; WikiTab
  // calls it with `{slug}`. Accept either; let the MCP server pick lookup mode.
  'wiki.promote': z
    .object({
      slug: slugSchema.optional(),
      id: z.string().min(1).max(200).optional(),
    })
    .passthrough()
    .refine((v) => v.slug !== undefined || v.id !== undefined, {
      message: 'wiki.promote requires `slug` or `id`',
    }),
  // Wave 7 B3: outFile is server-decided when absent. WikiTab passes {slug}
  // only (server picks destination under Downloads/Documents); explicit
  // outFile still enforces positive-root containment (SEC-002).
  'wiki.export': z.object({ slug: slugSchema, outFile: exportPathSchema.optional() }).passthrough(),
  'wiki.shareReadme': z.object({}),
  // Wave 7 B1: ConflictsTab passes `{conflictId, winnerVariantId}`. Prior
  // schema demanded `{subject, predicate, winnerId}` - never matched any call
  // site. Accept both arg shapes; server owns the contract.
  'conflict.resolve': z
    .object({
      conflictId: z.string().min(1).max(500).optional(),
      winnerVariantId: z.string().min(1).max(500).optional(),
      subject: z.string().min(1).max(500).optional(),
      predicate: z.string().min(1).max(500).optional(),
      winnerId: z.string().min(1).max(200).optional(),
      supersede: z.boolean().optional(),
    })
    .passthrough(),
  // Wave 7 B1: memory.* family. Server-owned argument shapes documented next
  // to each verb. `passthrough()` lets the contract evolve without breaking
  // the bridge gate (the gate stays a containment perimeter - size, prototype
  // pollution, byte cap - not an exhaustive contract).
  // PromotionsTab / ConflictsTab / HomeTab / MemoryPage:
  //   { any?, promotable?, conflicts?, pending_promotion?, id?, skipPromotion? }
  memory_facts: z.object({}).passthrough(),
  memory_store: z.object({ content: memoryStoreContentSchema }).passthrough(),
  memory_search: z
    .object({
      query: queryStringSchema,
      k: z.number().int().min(1).max(50).optional(),
    })
    .passthrough(),
  memory_recall: z
    .object({
      query: queryStringSchema.optional(),
      limit: z.number().int().min(1).max(200).optional(),
    })
    .passthrough(),
  memory_prelude: z.object({}).passthrough(),
  // Wave 7 B1: diagnostics / lifecycle.
  state: z.object({}).passthrough(),
  metrics: z.object({}).passthrough(),
  prompt_check: z.object({ prompt: z.string().min(1).max(8000).optional() }).passthrough(),
  update_check: z.object({}).passthrough(),
  update_apply: z.object({ version: z.string().min(1).max(64).optional() }).passthrough(),
  // P3 verification gate: the real `ijfw_cross_audit_converge` contract is a
  // git-diff auditor - it hard-requires a `commitRange` string and dispatches
  // codex/gemini/claude lenses against that diff. The prior `{findings}` schema
  // passed Wayland validation but the MCP server then rejected it with
  // `commitRange (string) is required`, so the gate could never succeed.
  cross_audit_converge: z
    .object({
      commitRange: z.string().min(1).max(256),
      lenses: z.array(z.string()).max(5).optional(),
      maxIterations: z.number().int().min(1).max(10).optional(),
      autoFix: z.boolean().optional(),
    })
    .passthrough(),
  // Real `ijfw_cross_project_search` schema: `{ pattern, limit? }`. Older
  // versions validated `{ query, scope, path }` - never what the server
  // accepted - so every call failed at the validation layer before reaching
  // MCP. The renderer now sends `{ pattern, limit }`; the schema mirrors that.
  cross_project_search: z
    .object({
      pattern: queryStringSchema,
      limit: z.number().int().min(1).max(50).optional(),
    })
    .passthrough(),
};

export const MAX_ARGS_BYTES = 1_048_576;

// SEC-012: byte-count not utf16-unit count.
function byteSize(serialized: string): number {
  return Buffer.byteLength(serialized, 'utf8');
}

// SEC-011: prototype-pollution reject.
const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

function rejectDangerousKeys(value: unknown): boolean {
  if (value === null || typeof value !== 'object') return false;
  if (Array.isArray(value)) {
    return value.some((entry) => rejectDangerousKeys(entry));
  }
  for (const key of Object.keys(value as Record<string, unknown>)) {
    if (DANGEROUS_KEYS.has(key)) return true;
    if (rejectDangerousKeys((value as Record<string, unknown>)[key])) return true;
  }
  return false;
}

export type ValidatedInvocation =
  | { ok: true; verb: IjfwVerb; args: Record<string, unknown> }
  | { ok: false; reason: string };

export function validateInvocation(verb: string, args: unknown): ValidatedInvocation {
  if (!(ALLOWED_VERBS as readonly string[]).includes(verb)) {
    return { ok: false, reason: 'verb_not_allowed' };
  }
  if (rejectDangerousKeys(args)) {
    return { ok: false, reason: 'unsafe_keys' };
  }
  const serialized = JSON.stringify(args ?? {});
  if (byteSize(serialized) > MAX_ARGS_BYTES) {
    return { ok: false, reason: 'args_too_large' };
  }
  const schema = verbSchemas[verb as IjfwVerb];
  const result = schema.safeParse(args);
  if (!result.success) return { ok: false, reason: `schema_invalid: ${result.error.message}` };
  return { ok: true, verb: verb as IjfwVerb, args: result.data as Record<string, unknown> };
}

// SEC-011 also applies to JSON-RPC responses coming back from the MCP server.
export const jsonRpcResponseSchema = z
  .object({
    jsonrpc: z.literal('2.0'),
    id: z.number().int().nonnegative(),
    result: z.unknown().optional(),
    error: z
      .object({ code: z.number().int(), message: z.string() })
      .optional(),
  })
  .strict();

export type JsonRpcResponse = z.infer<typeof jsonRpcResponseSchema>;

// Standardized errorReason enum (mirrors @/common/types/ijfw IjfwErrorReason).
export const ijfwErrorReasonSchema = z.enum(
  IJFW_ERROR_REASONS as unknown as readonly [IjfwErrorReason, ...IjfwErrorReason[]],
);

// Renderer → main argument schema for `brain.invoke`. Pre-flight only - the
// real validation happens via `validateInvocation` against the per-verb schema.
export const brainInvokeArgsSchema = z
  .object({
    verb: z.string().min(1).max(200),
    args: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export type BrainInvokeArgs = z.infer<typeof brainInvokeArgsSchema>;
