# Vendored wayland-core Desktop contract

Everything under `v1/` is a **verbatim byte copy** of Core's generated corpus.
Nothing here is authored in this repo. Do not hand-edit any file under `v1/` —
`scripts/vendor-wcore-contract.mjs --check` recomputes Core's own
`fixture_digest` and `schema_digest` over these bytes and fails on any drift.

|                        |                                                                           |
| ---------------------- | ------------------------------------------------------------------------- |
| Source repo            | `FerroxLabs/wayland-core`                                                 |
| Source path            | `crates/wcore-protocol/contracts/desktop/v1`                              |
| Source commit          | `e7bc6d883027102ff1e5bbaa2dd19f9265268cab`                                |
| Contract               | `wayland-desktop-core` v1.10                                              |
| Generator              | `wcore-desktop-contract-gen/11`                                           |
| `fixture_digest`       | `sha256:eb3f72074f894226c2f6874f88558a0a61ddb9dc146c737786667a2607c123e2` |
| `schema_digest`        | `sha256:217c15c13a057c53c8c077854c0948877ed0f890eb9c3d6e113ad43a6b23a1c4` |
| `source_inputs_digest` | `sha256:da3aa11425a938cef30c97d1eb9ed240286ee63dff7579d54e6eb30bdb5d413c` |
| Files                  | 164 (111 `.json`, 52 `.jsonl`, 1 `.md`)                                   |
| Fixtures in digest     | 159                                                                       |

## Re-vendoring

```bash
node scripts/vendor-wcore-contract.mjs --from /path/to/wayland-core
node scripts/vendor-wcore-contract.mjs --check
bun run test:contract
```

Then update the commit / digest rows above. Expect `tests/contract` to fail
until the new event types are either handled in
`src/process/agent/wcore/index.ts` or added to `UNHANDLED_CONTRACT_EVENTS` in
`src/process/agent/wcore/contract/coverage.ts` — that failure is the point.

Until Core publishes this corpus as a signed release asset (see
`docs/core-contract-integration.md`, C1), vendoring is a manual copy from a
Core checkout and its authenticity rests on that checkout, not on a signature.
