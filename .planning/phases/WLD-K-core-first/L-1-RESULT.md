# L-1 live verification — FAILED, with a corrected diagnosis

**Run 2026-08-08 against commit `95c745fd5`, rebuilt (`bun run package`) first.**
**Verdict: L-1 does not pass on either engine. Neither cause is a K-01/K-02/K-03 defect.**

| check | 0.12.25 | 0.12.26 stable |
|---|---|---|
| bootstrap + MCP publish | **PASS** — `Connected to 'tvcontrol': 102 tools`, clean `stream_end` | **FAIL** — `contract_minor_mismatch`, dies before any turn |
| tool actually executes | **FAIL** — ToolSearch never indexes TVControl | not reached |
| global `config.toml` hygiene | **PASS** — no residual profile after 5 turns; real config byte-identical (`0bc1051d…`) | **PASS** |

**K-01 itself works.** The config plumbing did its job on both engines: the profile is written,
the turn runs where bootstrap gets that far, and the reserved table is gone afterwards. The real
global config was never touched — the run used an isolated `WAYLAND_HOME`.

## Corrected diagnosis — the two defects are not equals

### D-1. ToolSearch not indexing TVControl on 0.12.25 is **W-0, already closed**

The live-verify agent reported this as a newly-discovered blocker "orthogonal to K-01/K-02/K-03".
That framing is wrong, and the correction matters.

W-0 *is* "ToolSearch cannot see MCP tools". It was fixed in Core **rc.2** and verified standalone end
to end — see `HANDOFF-TO-CORE-2026-08-05-rc2-acceptance-PASSED.md` ("W-0 is closed from our end").
**0.12.25 predates that fix**, so ToolSearch failing to index TVControl on 0.12.25 is the expected,
already-understood behaviour of that engine — not a new defect and not something to open work on.

**Consequence:** the milestone's headline claim — a non-technical user driving a real tool through
Wayland Core — is only demonstrable on **0.12.26**, because it needs W-0's fix. 0.12.25 can prove
bootstrap and config hygiene, and that is all it can ever prove.

### D-2. Desktop's Core contract pin is stale — **the real blocker**

`desktopContractV1.ts:20` pins `major:1, minor:0`, generated 2026-08-01 from Core producer commit
`d0aa0abc75af…`. Stable v0.12.26 (source `98ad1c283…`) negotiates a different contract minor, so
`assertDescriptor` (`desktopContractV1.ts:181`) hard-rejects the handshake before any chat runs.

The fixture is a week old against a same-day engine release. Regenerating it is the single change
that unblocks the entire stable-engine half of L-1.

**Do not "fix" this by loosening the minor check.** That check exists to stop Desktop talking to an
engine whose contract it does not actually implement. The fixture gets regenerated against current
Core; the assertion stays exactly as strict as it is.

### D-3. A genuine K-02 gap, found by this run

On the contract-mismatch path the UI shows the user **nothing at all** — the chat sits at "queued"
indefinitely. K-02 exists to make engine failures honest, and it does so for the stderr/start-failure
paths it covers; this path is not one of them. A silent hang is exactly the failure mode K-02 was
written to eliminate, so this belongs to K-02 and is in scope.

## Next actions, in order

1. **Regenerate the Core contract fixture against stable 0.12.26** (D-2). Unblocks L-1 on the only
   engine that can demonstrate the headline claim.
2. **Extend K-02 to the contract-rejection path** (D-3), so a handshake refusal reaches the user
   instead of hanging at "queued".
3. **Re-run L-1 on 0.12.26 only** for the tool-execution half. Keep 0.12.25 in the matrix for
   bootstrap and config hygiene, where it remains meaningful.
4. Then L-2 … L-6.

## Provenance and hygiene of the run

- Stable 0.12.26 was hand-verified before use: GitHub asset digest, the release's own
  `wayland-core-checksums.txt`, and `wayland-core-v0.12.26-release-manifest.json` all agree, and the
  binary's `--build-info` reports source `98ad1c283…`.
- `bundled-wcore-shasums.json` was **not** edited, and `DEFAULT_WCORE_VERSION` was **not** bumped.
- The bundled engine was restored to the original rc.2 artifact afterwards.
- Real global `config.toml` byte-identical before and after. Sean's TradingView chart
  (`NASDAQ:QQQ` 1D) unchanged.
- `out/` had to be rebuilt first — the pre-existing build predated the K-02/K-03 commits. **Anyone
  re-running this must rebuild, or they are testing stale code.**
