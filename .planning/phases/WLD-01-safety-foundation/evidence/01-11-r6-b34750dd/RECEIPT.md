# Plan 01-11 R6 Successor Evidence Receipt

Source commit: `b34750dd4bfa925825343a1cfa6766c1b85a6285`

Source tree: `7fd377f4b0ed23d109d149da617c17828aa0c783`

Executable audit-test parent: `42d2d4ff265680b06123d65d2ac86a05d45b081e`

Environment: macOS Darwin 25.3.0 arm64, Bun `1.3.11`, Node `v25.8.1`.
The complete environment record is `ENVIRONMENT.md` with SHA-256
`ee5b452e0fdef8ebcb7813fa5240e7dac89914ffe1ece7c2498b0fa7553c7900`.

Every command below completed with exit code `0` at the exact clean source
commit in `/Users/seandonahoe/gsd-workspaces/wayland-desktop-audit-01-11-r3/app`.
The aggregate log replaces generated credentials with explicit redaction
markers; command results, counts, warnings, and timings are retained.

| Log | Command | SHA-256 |
| --- | --- | --- |
| `01a-focused-process.log` | `bunx vitest run tests/unit/acpBuiltinMcp.test.ts tests/unit/conciergeConfigBridge.test.ts tests/unit/mcpServiceNormalize.test.ts tests/unit/process/bridge/mcpBridgeByoPersist.test.ts tests/unit/process/services/mcpServices/McpService.syncResult.test.ts tests/unit/process/services/mcpServices/mcpConfigAuthority.test.ts tests/unit/process/services/mcpServices/mcpConnectorArchive.test.ts tests/unit/process/services/mcpServices/mcpSessionTruthGate.test.ts` | `1a0f00307ecbcaef54373a86a5822f59f1dc242b990746614c5862909732ae11` |
| `01b-focused-crypto.log` | `bunx vitest run tests/unit/process/services/mcpServices/mcpStdioSpawn.test.ts tests/unit/process/services/transfer/crypto/recoveryCrypto.vector.test.ts tests/unit/process/utils/atomicWrite.durability.test.ts` | `f28ab592cb817549a995a1232320c068c14a6ef778debd5dbecfe2c44bfdb45e` |
| `01c-focused-dom.log` | `bunx vitest run tests/unit/renderer/mcp-hooks/useMcpServers.dom.test.tsx tests/unit/renderer/mcp-library/DetailPage.stdioOauth.dom.test.tsx tests/unit/renderer/pages/settings/mcp/useConnectedMcps.dom.test.tsx tests/unit/useMcpOperations.dom.test.tsx tests/unit/useMcpServerCRUD.dom.test.tsx` | `31a6654b647a26396120a3d7be77eea9f7e086d5efa65bcb6f026a5a7010353e` |
| `02-typecheck.log` | `bun run typecheck` | `c67398a876270961ec43a24a93502c20fd8778371cede4bd977ddd4f2d2680b5` |
| `03-lint.log` | `bunx oxlint --deny-warnings src/renderer/hooks/mcp/useMcpConnection.ts src/renderer/hooks/mcp/useMcpServerCRUD.ts src/renderer/pages/settings/McpLibrary/BrowsePage.tsx src/renderer/pages/settings/McpLibrary/DetailPage.tsx src/renderer/pages/settings/McpLibrary/hooks/useConnectedMcps.ts tests/unit/useMcpServerCRUD.dom.test.tsx` | `8c6bb3df8c2c3330211d40e794afbad6676a5d00f5666cc7b2c8eeaa09793384` |
| `04-format.log` | `bunx oxfmt --check src/renderer/hooks/mcp/useMcpConnection.ts src/renderer/hooks/mcp/useMcpServerCRUD.ts src/renderer/pages/settings/McpLibrary/BrowsePage.tsx src/renderer/pages/settings/McpLibrary/DetailPage.tsx src/renderer/pages/settings/McpLibrary/hooks/useConnectedMcps.ts tests/unit/useMcpServerCRUD.dom.test.tsx` | `4e54cd00d0a19169f0d0feb00456f2188d55471bb53364508b9a0989730e7b2f` |
| `05-diff-check.log` | `git diff --check 42d2d4ff265680b06123d65d2ac86a05d45b081e..b34750dd4bfa925825343a1cfa6766c1b85a6285` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `06-aggregate.log` | `GSD_RUNTIME=codex bun run test` | `27e42e2e41abd95a7c39704c4d1b30c7618573b299e2996943e180f52dd19eb1` |

Observed results:

- Focused: 16 files and 153 tests passed across three resource-isolated shards. The R6 matrix covers successful and partial revocation, durable CAS win/loss, storage rejection, concurrent enabled/disabled/deleted/renamed/canonical-replacement winners, reconciliation failure, and ordinary successful probe truth.
- Typecheck: passed.
- Changed-file lint: zero warnings and zero errors.
- Format and diff check: passed.
- Aggregate: 1,434 Vitest files and 15,200 tests passed, with 21 files and 145 tests skipped; 226 Bun-native tests passed and zero failed.

This receipt proves construction at the exact source commit only. Independent
review and serial integration remain separate acceptance gates.
