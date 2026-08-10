# START HERE — 2026-08-10 (evening)

Branch `packet/attribution-audit`, head **`32f3c22a2`**, pushed to ferrox.
**Full suite 16,515 tests / 0 failed / 0 failed suites. Typecheck clean.**
Nothing merged, tagged, or PR'd. `constitutionFsAuthority.generated.ts` and
`AGENTS.md` are modified and MUST stay unstaged.

---

## Where the build is

Building `.planning/VOICE-COMPOSER-PLAN.md`. **Do not re-plan it.**

| Phase | Steps | State |
|---|---|---|
| P0 — readiness truth | V1, V2, V3 | **done** |
| P1 — the lift | V4, V5, V6, V7 | **done** |
| P2 — composer surface | V8, V9 done · V10–V18 remaining | in progress |
| P3 — chunking | V19 done · H3 gate, V20, V21, V22 | blocked on H3 |
| P4 — hardening | V24, V25 | not started |

**9 of 22 MUST steps landed**, one commit each, every one with its test.

## The next step is V10

V10 is where the composer starts showing voice state. It is also where the
interim risk below closes, so it is the right next thing.

**Carry these forward — they are decided, not open:**
- Status goes in a `role='status'` live region, NOT the placeholder. A
  placeholder does not render over a non-empty value, so a placeholder-based
  design deletes its own status channel on the first keystroke. Assert that
  typing a draft leaves the status text present.
- Never render `runningIndicator` and the voice status at once.
- Compute status in `renderVoiceControls()`, not in the six platform wrappers.

## ⚠️ Interim risk that exists RIGHT NOW

`X` ends the session and `Chat` collapses it (V7). Collapsing keeps the mic
live — which is the point — but **until V10 lands there is no visible
indicator of a collapsed live session**. Escape still ends it and the header
entry button is still there, so it is reachable, but do not ship in this
state. V10 closes it.

## Verified this session, by execution

- **macOS**: full suite 16,515 / 0 failed on real hardware.
- **Windows** (real box, synced to head): full suite 16,513 tests, 5 failed —
  all pre-existing platform artifacts (`pathConfinement` asserting hardcoded
  POSIX paths, a missing `custom` CLI, a tray sync). **All 18 voice suites: 0
  failed.** None of the 29 changed files touch path, tray, or MCP code.
- **Linux** (DigitalOcean KVM droplet, created and destroyed in-session,
  ~$0.07): **54/54 on the voice logic** — readiness including its linux rows,
  the sentence splitter, prosody, consent, and the state machine.
  The DOM suites were NOT run on Linux: the source transfer truncated and the
  uplink was too slow to be worth repeating. They are jsdom and already green
  on two different operating systems.
- **Case-sensitive imports** — the one failure mode that macOS and Windows both
  hide — are caught by tsc 5.9.3 (TS1261/TS1149), proven with a deliberate
  wrong-case probe. It runs on every commit.

## Still not verified by a human ear

**H3 and H10 are both open, and both need Sean.**
- **H3** blocks V22: does the seam between two independently synthesised `say`
  clips sound like one speaker? Runs at the START of P3, before the queue is
  written. M2 already had Sean grade one-shot vs gapless as indistinguishable
  on five sentences, so this is confirmation on a packaged build with a long
  answer, not an open question.
- **H10**: no audio has been HEARD on Windows or Linux. Neither has a local
  synthesizer, so conversation there is hosted OpenAI only — needs a key and
  speakers.

## Defects found by executing, that reading would not have caught

1. The lift broke `useNavigate` outside a Router — and **the test written for
   exactly that invariant passed**, because it mounted the provider with a
   plain `<div>` instead of the orb. A throwaway probe rendering the real
   `ChatLayout` caught it.
2. On Windows/Linux the default config **read as ready**, so the mic opened and
   the failure only landed mid-turn as `TTS_SYSTEM_NATIVE_UNAVAILABLE`.
3. Consent was read BEFORE the prompt, so accepting a disclosure left readiness
   refusing the session just agreed to. Fixed by folding in what `ensureConsent`
   confirmed rather than depending on a read-after-write round trip.
4. The effective transcriber was resolved twice and could disagree with itself.
5. `beginCapture` read config from React state, a render behind entry, so a
   first tap reported "Speech input is off" to a user whose input was on.
6. The existing session suite was implicitly asserting the macOS story, because
   jsdom's navigator is not a Mac.

## Known flake, identified and NOT mine

`tests/unit/webserver/constitutionRecoveryConsumerJourney.dom.test.tsx` fails
intermittently under full-suite load only; passes 5/5 in isolation. It does
real HTTP with a mounted renderer. **Zero references to ChatLayout or voice**
(control: 19 matches for "Constitution", so the grep works). Carried as
pre-existing, not green-washed.

## Method notes that paid off again

- **A test that cannot go red proves nothing.** Every guard this session was
  mutation-checked: reverting it turns a named test red, and the controls stay
  green so the test discriminates the defect rather than the feature.
- **RTK truncates piped output at 1 MB on one line**, so `grep -c` against it
  returns 1 regardless. Have vitest write JSON itself
  (`--reporter=json --outputFile=`) — that is how the flake was finally named.
- Before believing a zero, prove the method finds a known positive.
