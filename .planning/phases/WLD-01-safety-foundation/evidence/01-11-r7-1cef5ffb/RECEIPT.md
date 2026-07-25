# Plan 01-11 R7 Successor Evidence Receipt

Source commit: `1cef5ffb0a5d9bbc1319544bbcbeb167398795ea`

Source tree: `a56ee55e8d8192a0ec218d29d3244da34aff571d`

Executable audit-test parent: `1d61bae52fb1fb3c8b5dceebc683d17ae0eb9c9d`

Environment: macOS Darwin 25.3.0 arm64, Bun `1.3.11`, Node `v25.8.1`.
The complete environment record is `ENVIRONMENT.md` with SHA-256
`972146b9088ac8bce4b25f21d9bc84ec2f4d062b8136c831d1eca81b6ff800c6`.

Every accepted command below completed with exit code `0` against the exact
source commit in
`/Users/seandonahoe/gsd-workspaces/wayland-desktop-audit-01-11-r3/app`.
The aggregate log replaces generated credentials with explicit redaction
markers; the raw aggregate output was removed after sanitization.

| Log | Command | SHA-256 |
| --- | --- | --- |
| `01a-focused-process.log` | `bunx vitest run tests/unit/acpBuiltinMcp.test.ts tests/unit/conciergeConfigBridge.test.ts tests/unit/mcpServiceNormalize.test.ts tests/unit/process/bridge/mcpBridgeByoPersist.test.ts tests/unit/process/services/mcpServices/McpService.syncResult.test.ts tests/unit/process/services/mcpServices/mcpConfigAuthority.test.ts tests/unit/process/services/mcpServices/mcpConnectorArchive.test.ts tests/unit/process/services/mcpServices/mcpSessionTruthGate.test.ts` | `d287f1561bab67c7c4537754c7d1923f015aba26db83cc06908678b005a766b4` |
| `01b-focused-crypto.log` | `bunx vitest run tests/unit/process/services/mcpServices/mcpStdioSpawn.test.ts tests/unit/process/services/transfer/crypto/recoveryCrypto.vector.test.ts tests/unit/process/utils/atomicWrite.durability.test.ts` | `dea3ca0dc783f072cb30fcc38d482c222b6b4e4638ee1465a41c410352caf302` |
| `01c-focused-dom.log` | `bunx vitest run tests/unit/renderer/mcp-hooks/useMcpServers.dom.test.tsx tests/unit/renderer/mcp-library/DetailPage.stdioOauth.dom.test.tsx tests/unit/renderer/pages/settings/mcp/useConnectedMcps.dom.test.tsx tests/unit/useMcpOperations.dom.test.tsx tests/unit/useMcpServerCRUD.dom.test.tsx` | `5ce70529add0efa9574033657f0bdbb1fac43d6a8c43840b24e46c2cbc9ab49c` |
| `02-typecheck.log` | `bun run typecheck` | `c67398a876270961ec43a24a93502c20fd8778371cede4bd977ddd4f2d2680b5` |
| `03-lint.log` | `bunx oxlint --deny-warnings src/renderer/hooks/mcp/useMcpConnection.ts src/renderer/hooks/mcp/useMcpServerCRUD.ts src/renderer/pages/settings/McpLibrary/BrowsePage.tsx src/renderer/pages/settings/McpLibrary/DetailPage.tsx src/renderer/pages/settings/McpLibrary/hooks/useConnectedMcps.ts tests/unit/useMcpServerCRUD.dom.test.tsx` | `a476633a488a1dedda0c3a2df38d60d87850ec04652d750c4f86343067b0e777` |
| `04-format.log` | `bunx oxfmt --check src/renderer/hooks/mcp/useMcpConnection.ts src/renderer/hooks/mcp/useMcpServerCRUD.ts src/renderer/pages/settings/McpLibrary/BrowsePage.tsx src/renderer/pages/settings/McpLibrary/DetailPage.tsx src/renderer/pages/settings/McpLibrary/hooks/useConnectedMcps.ts tests/unit/useMcpServerCRUD.dom.test.tsx` | `ae3b6e4e9bcf3f73b1699b57dacd3fa77cd1314b020b62565890bd8536eea18e` |
| `05-diff-check.log` | `git diff --check 1d61bae52fb1fb3c8b5dceebc683d17ae0eb9c9d..1cef5ffb0a5d9bbc1319544bbcbeb167398795ea` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `06b-aggregate-bounded.log` | `GSD_RUNTIME=codex bunx vitest run --maxWorkers=2 && bun scripts/run-bun-native-tests.mjs` | `7186a6709ef8cbeb2e0570b398952d6c5a18f615edbc3de36e5eaa392100d2ab` |
| `06c-aggregate-verifier.log` | mechanical assertion of the sanitized aggregate totals and absence of failure markers | `df50fe3c6dcfc13279d1664347ea16c35949c7c1f8e053b02902de5d6b5abb9f` |

Observed accepted results:

- Focused: 16 files and 158 tests passed across three resource-isolated shards.
- Typecheck: passed.
- Changed-file lint: zero warnings and zero errors.
- Format and diff check: passed.
- Aggregate: 1,434 Vitest files and 15,205 tests passed, with 21 files and 145 tests skipped; 226 Bun-native tests passed and zero failed.
- The R7 stateful matrix proves exact-key cleanup for a partially removed and restored publication across case-only replacement, true rename, disabled/deleted winners, and reconciliation failure.

## Non-authoritative attempt

`06a-aggregate-contended-failed.log` (SHA-256
`eb3553be1df14006eaa9b928fa47593d892bf1526e2701586365efd0f819daa5`)
records the first `GSD_RUNTIME=codex bun run test` attempt. Multiple unrelated
full suites were active at the same time. A mission-control ledger test exceeded
its timing invariant, after which the process stalled and this lane terminated
only its own process group. That attempt is retained as a failed environmental
observation and is not used as acceptance evidence.

This receipt proves construction at the exact source commit only. Independent
review and serial integration remain separate acceptance gates.
