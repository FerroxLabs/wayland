// src/process/resources/builtinMcp/conciergeDiagServer.redact.bun.test.ts
// Run with: bun test src/process/resources/builtinMcp/conciergeDiagServer.redact.bun.test.ts
//
// Regression for #701 (Doctor report): the base64url catch-all masked
// legitimate all-lowercase identifiers, garbling the report. Concretely the
// `model_registry_providers` source label rendered as `••••ders` and long
// reverse-DNS MCP server names as `com.••••-mcp`, hiding the very names the
// report exists to surface. Real high-entropy tokens must still be masked.

import { describe, it, expect } from 'bun:test';
import { redact } from './conciergeDiagServer';

describe('redact - lowercase identifiers are not over-masked (#701)', () => {
  const preserved = [
    'model_registry_providers', // our own diag source label (exactly 24 chars)
    'com.acme-something-really-long-mcp', // reverse-DNS MCP server name
    'projects-and-conversations-store', // hyphenated lowercase identifier
  ];
  for (const id of preserved) {
    it(`keeps ${id}`, () => {
      expect(redact(id)).toBe(id);
    });
  }
});

describe('redact - real secrets are still masked', () => {
  const secrets = [
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9abcdef', // JWT header (mixed case + digits)
    'AKIAIOSFODNN7EXAMPLExxxxxxxx', // AWS-style key (uppercase + digit)
    'aGVsbG93b3JsZGZvb2JhcmJhenp123', // base64 blob with digits
  ];
  for (const s of secrets) {
    it(`masks ${s.slice(0, 8)}…`, () => {
      const out = redact(s);
      expect(out).not.toBe(s);
      expect(out).toContain('••••');
    });
  }
});
