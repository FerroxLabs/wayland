# K-04 / RCI-01 — Release-candidate integration decision

**Milestone:** WLD-K — Core First
**Requirement:** RCI-01
**Decided:** 2026-08-08
**Status:** DECIDED. Documented, no code change required.

---

## The decision

**Release candidates of Wayland Core are validated in dev mode only. A signed, packaged Desktop
build can never carry a pre-release engine, and that stays true.**

We are not giving RCs an attestation policy. The gap is real but it is the correct gap.

---

## What is actually true today (verified by execution, not by reading)

| claim | how it was established | result |
|---|---|---|
| The packaged path pins the engine **in source** and cannot be steered by environment | `grep -c 'env\.WCORE_VERSION'` on `scripts/build-with-builder.js`, with a positive control proving the same method finds **1** occurrence in `scripts/prepareWaylandCore.js` | **0** — confirmed |
| The packaged path demands a verified engine | read `scripts/build-with-builder.js:766-771` — passes `version: prepareWaylandCore.DEFAULT_WCORE_VERSION` with `requireVerified: true` | confirmed |
| Dev/integration runs *can* select an RC | `scripts/prepareWaylandCore.js:216` resolves `process.env.WCORE_VERSION || DEFAULT_WCORE_VERSION` | confirmed |
| Pre-release tags are refused unless explicitly opted in | `scripts/prepareWaylandCore.js:228-238` and `scripts/stage-wcore-bump.mjs:85-101` | confirmed |
| The opt-in is off by default and says so | `WCORE_ALLOW_PRERELEASE=1` warns *"bundling PRE-RELEASE wayland-core … for INTEGRATION ONLY (never ship it)"* | confirmed |
| The committed pin | `scripts/prepareWaylandCore.js:213` → `'v0.12.25'` | confirmed |

> **Method note.** The first attempt at row 1 counted the bare substring `WCORE_VERSION` and returned
> **1**, which read as "the packaged path does consult the environment". That match was inside
> `DEFAULT_WCORE_VERSION` on line 769 — a substring false positive. The corrected search
> (`env\.WCORE_VERSION`, with a positive control) returned 0. Recorded because the milestone's proof
> standard exists precisely for this: a count is not a finding until you look at what it matched.

## Why this is the right gap

The packaging path is the trust boundary. `requireVerified: true` plus a source-pinned tag means the
engine inside a signed artifact is always a published release with a checksum we verified before it
was extracted, copied or executed. Loosening that to admit release candidates would mean:

- a signed Desktop build could ship an engine that was never released, and
- the attestation covering that build would be asserting something weaker than it does today.

An RC exists precisely because it has not finished its own verification. Putting one inside an
artifact that carries our signature inverts the meaning of the signature. **No shipping deadline is
worth that trade**, and the cost of *not* making it is small: dev-mode RC validation catches engine
regressions perfectly well, which is exactly how the 0.12.26-rc.2 acceptance was run.

## What we give up, stated plainly

We cannot produce a **signed, packaged** build against an RC. So an engine defect that only appears
in a packaged context — code signing, notarization, sandbox, the `asar`-unpacked resource layout, or
platform path handling — will not be caught until the engine reaches stable and we bump the pin.

That risk is accepted, and it is not theoretical: this project has previously found defects that only
appeared in packaged builds. The mitigation is **not** to relax the packaging path, it is to keep the
pin bump on a short leash — bump promptly after a stable release, then run the full packaged sweep
before shipping Desktop, so the exposure window is measured in days.

## The escape hatch, and its limits

`WCORE_ALLOW_PRERELEASE=1` exists for integration builds and defaults OFF. It is legitimate for local
and CI **integration** verification. It is not a shipping path:

- It never runs in the packaging path, which does not consult the environment at all.
- It warns loudly on every use.
- No release job sets it, and none may.

**Any future change that lets a pre-release tag reach a signed artifact must be treated as a change
to the release trust boundary** and reviewed as such — not as a build-script convenience.

## Standing rules this decision locks in

1. `DEFAULT_WCORE_VERSION` only ever names a **published stable release**.
2. The packaged path keeps `requireVerified: true` and keeps pinning in source. It must never read
   `WCORE_VERSION`.
3. RC validation runs in dev mode via `WCORE_VERSION`, or in an explicitly-flagged integration build.
4. Any new flag in this area defaults **OFF**.
5. Bump the pin promptly once a stable engine publishes, then re-run the packaged live sweep.

## Consequence for the Master Class

Core 0.12.26 is in final CI. Desktop's pin stays `v0.12.25` until it publishes. K-01 is built and
accepted against **both** 0.12.25 and 0.12.26, so the bump is a one-line change plus a checksum
refresh whenever Core is ready — the demo does not depend on that timing in either direction.

**K-01 remains the blocker on the bump, not this decision.** Until K-01 lands, a Desktop built
against 0.12.26 dies at bootstrap.
