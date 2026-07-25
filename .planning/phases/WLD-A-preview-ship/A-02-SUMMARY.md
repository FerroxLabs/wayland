# A-02 SUMMARY — packaged preview smoke

Status: **functional risk CLOSED. Sealed-candidate authority still owner/CI-only.**
Date: 2026-07-23 (overnight). All work LOCAL; nothing pushed.

## What A-02 asked

Prove a PACKAGED preview build with the matched engine actually works, rather than
inferring it from a green dev-mode run.

## Result

The packaged, hardened (`--dir`, unsealed) preview build was driven end-to-end as a user.
**It works.**

| Check | Result |
| --- | --- |
| Boots with matched engine (`wayland-core` v0.12.25) | ✅ |
| Cockpit shell activates | ✅ |
| 12 navigation destinations render real content | ✅ 12/12 |
| IPC bridge answers | ✅ (`modelRegistry.list` → provider array) |
| Provider connect (Flux Router) | ✅ `state: connected`, 84 models, 66 callable |
| **Live chat round-trip** | ✅ replied `PONG / "I'm Wayland, your local AI assistant for this app."` (screenshot evidence) |
| Console errors | 1 benign (CSP blocks the web-only blank-root recovery inline script) |

Evidence: `.smoke/<timestamp>/report.json` + per-surface screenshots (gitignored).

## How — and why it needed a new harness

`scripts/afterPack.js` unconditionally flips `EnableNodeCliInspectArguments: false`, so
Playwright's `_electron.launch` cannot attach to a packaged build — it drives the **Node
inspector**. The app separately self-enables **Chromium** remote debugging when
`WAYLAND_CDP_PORT` is a real port (`configureChromium.ts`; `'0'` disables it). So the
harness launches the binary directly and uses `chromium.connectOverCDP`, exactly as
`scripts/platform-package-smoke.mjs` does.

**No Electron fuse is weakened to test a packaged build.** The hardened artifact is
testable as shipped.

Harness: `scripts/packaged-cockpit-smoke.mjs` (`30dbcd256`, hardened in `22bbb3bfa`).
Run: `node scripts/packaged-cockpit-smoke.mjs` — writes a report, exits non-zero on failure.

### Automated chat assertion — known limitation

Chat **works** (verified twice by screenshot), but the harness cannot yet assert it
automatically. Routing through Flux Auto answers as an **agent**: the reply renders into the
workflow/progress panel, not into an assistant `message-text-content` node, so there is
nothing message-shaped to match. Three earlier assertions all produced FALSE GREENS —
matching the user's own bubble, matching a truncated prompt echo, and matching the
LLM-generated conversation title (a separate cheap model call that succeeds even when chat
is broken). The current assertion is deliberately conservative: it fails loudly rather than
passing silently.

**Use `--no-chat` for the surface gate** until the agentic reply body carries a `data-testid`;
adding one is the clean fix and turns this back on.

An independent adversarial audit of the harness (2026-07-23) found four false-green paths —
unasserted routing, two dead error-boundary testids, an ignored provider/catalog result, and
the title-collision above — all closed in `22bbb3bfa`.

## Still owner-gated (unchanged)

A **sealed, distributable** candidate needs the release trust root and Sigstore attestation
of capability receipts (`--signer-workflow … --source-ref refs/heads/release-trust-v1`).
Receipts can be generated locally but never attested locally. Two independent audits
confirmed this is a genuine authority boundary, not a workaround gap. **Sean triggers CI.**

What A-02 closes is the *functional* risk — "does the packaged app with the matched engine
actually work" — which no longer blocks the preview ship decision.

## Findings raised (not fixed here)

1. **Onboarding restarts from step 1 on any remount/reload.** Completion is recorded only
   on the final screen; all progress is unpersisted component state. See A-02-FINDINGS.
2. **Stale e2e selectors.** `tests/e2e/helpers/selectors.ts:60,63` export
   `message-text-left` / `message-text-right`; neither testid exists in `src/` any more.
3. **Cold-start model default can pick a non-conversational model.** `resolveSafeDefault`
   marquee rules match on provider platform/name, so a catalog with no marquee provider
   falls through to "first non-experimental model" — which selected Groq's
   `meta-llama/llama-prompt-guard-2-22m` (a 22M safety classifier) in one run.
