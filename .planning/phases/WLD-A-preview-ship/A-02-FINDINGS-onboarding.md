# Finding — onboarding restarts from step 1 (reported by Sean, 2026-07-23)

> "the onboarding sequence seems to pop up twice. It'll pop up and then when it enters
> multi-agent mode, it seems to pop up again and reload the onboarding"

## Confirmed mechanism (why it hurts)

`src/renderer/components/onboarding/OnboardingOverlay.tsx`

- The completion marker is written **only** by `dismiss()`, which is reached only via
  `OnboardingFlow`'s `finishAll` on the **last** screen (`OnboardingFlow.tsx:335-339`).
- All flow progress — `screen`, `name`, `picks`, `work`, … — is component-local `useState`
  (`OnboardingFlow.tsx:131-142`) with **no persistence**.

Therefore **any remount or renderer reload before the user reaches the final screen
restarts onboarding at step 1**, and re-runs detection. There is no resume.

This is the part that turns a benign remount into a visible "onboarding reloaded".

## Triggers ruled out (each verified by reading the code)

| Candidate | Verdict |
| --- | --- |
| `index.html` blank-root recovery `location.reload()` | **No.** Gated on an existing service-worker registration; Electron never registers one (`index.html:58-72`). |
| Auth `status` flipping back to `'checking'` (would unmount `ProtectedLayout`'s subtree) | **No.** On desktop `refresh()` short-circuits straight to `authenticated` (`AuthContext.tsx:106-112`). |
| Detection identity churn re-firing the open effect | **No.** `useOnboardingDetection` runs once, deps `[]`. |
| Shell-switch `Suspense` boundary unmounting the overlay | **No.** The boundary is inside `ShellExperienceLayout`, i.e. *below* `OnboardingOverlay`, which is its sibling (`Router.tsx:83-88`). |

## Empirical check on the PACKAGED build

180-second timeline probe, fresh profile, onboarding left open, including a
shell-experience-changed event at t=30s:

```
t=0   modalOpen=true  "First - what should I call you?"  nonce=mzggrn
t=1   modalOpen=true  "First - what should I call you?"  nonce=mzggrn  hash=#/guid
(no further changes through t=180)
```

The nonce (per-document) never changed → **no reload, no remount, no second appearance on
the packaged build while idle.**

## Where that leaves it

The restart mechanism is confirmed; the specific trigger in Sean's session is **not yet
reproduced**. Two leading candidates, in order:

1. **Dev-mode only.** Sean's report is against `bun run start`. A Vite full-reload (HMR
   falling back to a page reload, e.g. on a chunk/dependency change) remounts everything —
   and because progress is unpersisted, onboarding restarts. This fits "boots the dev
   server → onboarding → later it reloads onboarding" exactly.
2. **The real in-app shell switch.** The probe dispatched a synthetic
   `wayland:shell-experience-changed` event; the genuine path (config write → shell root
   swap) was not exercised.

Next step to confirm: run the same timeline probe against `bun run start` and against a
real in-UI switch into multi-agent/Cockpit mode.

## Recommended fix (Sean's call — not implemented)

Persist onboarding progress so a remount resumes instead of restarting. Cheapest version:
write the current `screen` (and the already-captured fields) to `ConfigStorage` on each
step transition, and rehydrate on mount. A blunter alternative — mark onboarding completed
as soon as it *starts* — stops the loop but silently drops anyone who quits halfway.

Independent of the trigger, this fix removes the user-visible symptom.

## FIXED — 2026-07-23 (`OnboardingFlow.tsx`)

Implemented the persistence fix, mirrored to **localStorage** rather than
`ConfigStorage` — synchronous and always-local, exactly like the existing
`onboardingCompleted` marker, so it survives a remount with no async window that
could jump the user backward. Details:

- `onboarding.progress` = `{ screen, name, picks, work }` written on every
  step/answer change; the cold-start API key (a secret being typed) and transient
  UI state (busy/errors/scan progress) are excluded.
- Read once in a lazy `useState` initializer so a remount RESUMES at the stored
  screen; an invalid/corrupt entry falls back to `quickstart`.
- Cleared in `finishAll` so a completed user can't reopen a stale mid-flow state.

Trigger-independent by design: any remount (dev Vite reload OR the real
multi-agent shell swap) now resumes instead of restarting. Proven by
`tests/unit/renderer/onboarding/onboardingResume.dom.test.tsx` (3 tests: restore
mid-flow, persist-on-mount, reject-corrupt). Full suite green.
