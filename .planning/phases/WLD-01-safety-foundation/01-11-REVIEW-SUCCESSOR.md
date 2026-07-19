# Plan 01-11 Independent Review

Status: REJECTED

Audited evidence successor: `8dd82a875b79090aac9138591fae3bb50fac8622`

## Findings

### HIGH — failed publication restoration is silently hidden

When an enabled MCP probe fails, `useMcpConnection` attempts to revoke the
connector from every adapter. If that removal rejects after partially changing
adapters, the hook attempts to restore the prior definition. A second failure
during restoration is swallowed. Local storage remains `enabled: true` and its
only error is the original probe failure, so neither the user nor a later
reconciler can distinguish a clean restoration from externally divergent MCP
publication.

Executable reproduction:

```text
bunx vitest run tests/unit/useMcpServerCRUD.dom.test.tsx
```

Expected: an incomplete rollback is persisted and surfaced as such.

Observed: `lastError` is only `probe unavailable`; the rollback failure is
discarded. The hostile regression in this review fails at that assertion.

Violated claim: the summary says a failed revocation restores the previous
definition everywhere or surfaces rollback failure.

### MEDIUM — declared ownership does not cover the accepted source delta

The plan's `files_modified` manifest is not exhaustive for the exact successor.
The actual baseline delta additionally changes shared authority, migration,
archive, UI, and test files including:

- `src/common/adapter/ipcBridge.ts`
- `src/process/bridge/conciergeConfigBridge.ts`
- `src/process/services/import/migration/migrationImporter.ts`
- `src/process/services/mcpServices/agents/WaylandMcpAgent.ts`
- `src/process/services/mcpServices/mcpConfigAuthority.ts`
- `src/process/services/mcpServices/mcpConnectorArchive.ts`
- `src/process/utils/atomicWrite.ts`
- `src/renderer/components/settings/SettingsModal/contents/ToolsModalContent.tsx`
- `src/renderer/pages/settings/ImageGenSettings/index.tsx`
- the corresponding authority, archive, durability, and Concierge tests

The summary describes the scope expansion, but the machine-readable ownership
manifest does not. Repair must enumerate the complete accepted delta before a
successor can be independently accepted.

## Non-findings

- The main-process MCP configuration authority serializes functional mutations
  and the renderer CAS path publishes only confirmed durable snapshots.
- Current production callers use functional config updaters; the array retry
  path is not presently an observed lost-update defect.
- No Windows durability finding is asserted without executable platform proof.

Plan 01-11 must not enter the serial integration queue until both findings are
repaired and a different independent reviewer accepts the exact successor.
