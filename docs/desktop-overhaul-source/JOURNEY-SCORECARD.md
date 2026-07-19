# v0.11.18 journey scorecard

## Release and build proof

| Evidence | Result | Interpretation |
|---|---|---|
| Tag/main identity | Pass | `v0.11.18` and `main` resolved to `1b1c1e91119e3352bec3958188254ee91f150492` at audit start. |
| Official build/release workflow | Pass | Manual platform jobs and build matrix were green. |
| macOS signing/notarization | Pass | x64 and arm64 apps/DMGs were notarized and stapled; Gatekeeper smoke gates passed. |
| Windows signing | Pass | x64 and arm64 artifacts were signed by Ferrox Labs and smoke-verified. |
| Install | Pass | Frozen Bun install completed with 2,117 packages. |
| Typecheck | Pass | No TypeScript errors under the current non-strict configuration. |
| Lint | Warning | Zero errors, 2,610 warnings across 3,264 files. |
| Unit/component tests | Pass | 13,100 passed and 140 skipped in the standard run. |
| Coverage | Weak | 52.07% lines, 51.16% statements, 43.86% branches, 46.32% functions; thresholds are zero. |
| Electron/Vite package build | Pass with warnings | 13,388 renderer modules; largest entry chunk about 4.09 MB; static/dynamic import warnings. |
| Dependency audit | Fail | 101 advisories: 1 critical, 24 high, 63 moderate, 13 low; exploitability still needs exposure triage. |

## Live Desktop journeys

### Current-route capture

One live Electron process visited 18 current routes at 1440x960. All routes rendered and screenshots were produced. One console error appeared: update checking failed because `AutoUpdaterService` was not initialized.

| Surface | Visible controls | Unlabelled controls | Body characters | Finding |
|---|---:|---:|---:|---|
| Home `/guid` | 67 | 3 | 2,936 | Strong launchpad, excessive pre-intent choice. |
| Projects | 34 | 0 | 2,775 | Clearer, outcome-adjacent surface. |
| Assistants | 263 | 1 | 25,822 | 97-item catalogue; requires search/filter literacy. |
| Workflows | 224 | 1 | 99,044 | 176 items appear heavily rendered; virtualization and progressive disclosure needed. |
| Teams | 97 | 2 | 13,673 | 60 teams plus persistent sidebar state. |
| Memory | 52 | 3 | 4,658 | Rich archive surface but no semantic heading detected. |
| Wiki | 62 | 0 | 3,546 | Present; artifact journey not proven. |
| Scheduled | 46 | 14 | 4,140 | Useful grid; highest unlabeled-control count in the route capture. |
| Mission Control | 36 | 0 | 6,810 | Strong operational concept and clear attention states. |
| Models | 25 | 2 | 1,571 | Good provider-neutral setup and Flux prominence. |
| Agents | 30 | 1 | 2,087 | Reasonable settings density. |
| Skills | 44 | 2 | 2,791 | Substantial capability management. |
| Wayland Core | 17 | 0 | 2,162 | Strong distinct engine surface; version/protocol semantics need hardening. |
| MCP Library | 82 | 1 | 4,412 | 107 connectors already form a credible community base. |
| Channels | 17 | 0 | 1,246 | Clean entry surface; delivery outcomes not tested. |
| Theme | 36 | 4 | 798 | Dense but contained. |
| General | 24 | 16 | 1,789 | Many switch controls are not labelled by the audit heuristic. |
| About | 6 | 1 | 595 | Live updater error surfaced in console. |

The control heuristic counts visible interactive elements without accessible name, title, or text. It is a triage signal, not a WCAG conformance result.

### Focused representative suite

Result: 24 passed, 7 failed, 3 skipped in 7.9 minutes.

Passed:

- app launch basics;
- project creates a real non-temp workspace;
- project chat resolves to that workspace;
- 16 settings/persistence/namespace checks across restart;
- Cowork quick launch;
- WebUI stop releases its port.

Failed:

1. Two scheduled-task conversational CRUD journeys timed out waiting for a real AI response. The suite infers readiness from a visible Gemini pill instead of proving usable credentials and backend health.
2. The Cold Outbound golden path expected a team card that was not installed/rendered.
3. Quick launch expected six cards but the product rendered seven.
4. The Write Copy test expected retired extension ID `ext-copy`.
5. The Core AskUserQuestion journey could not select the `wcore` agent.
6. WebUI `start` returned a port of `0`, so its HTTP login/CSRF/rate-limit follow-ups were skipped.

### Navigation suite

Result: 7 passed, 7 failed. The suite still clicks retired settings IDs such as `gemini`, `model`, `agent`, `display`, and `system`, while the current information architecture uses `models`, `agents`, `theme`, and `general`. Router redirects exist, but the helper searches for nonexistent `data-settings-path` elements. This is test drift, and it means the suite cannot certify current settings navigation.

## Cloud journey

| Step | Result | Evidence |
|---|---|---|
| Build official Dockerfile | Fail | Vite transformed 13,384 modules, then Node aborted at its roughly 2 GB heap limit. |
| Reproducibility | Fail | Runtime uses mutable `oven/bun:latest`; audit resolved 1.3.14 while Desktop pins 1.3.11. Installs do not use `--frozen-lockfile`. |
| Build renderer on host | Pass | Same renderer completed with available host memory. |
| Build standalone server | Pass with warnings | 69.2 MB server bundle plus 28.1 MB Gemini bundle; direct-eval warnings. |
| Boot standalone server | Partial | HTTP server started on localhost:3000 and returned 200 with CSP, CSRF, origin, frame, MIME, rate-limit, and referrer protections. |
| Runtime completeness | Fail | Startup reported five missing built-in MCP scripts and identified itself as version unknown. The Dockerfile does not build those scripts. |

## Release-gate recommendation

At minimum, every release should block on clean packaged journeys for:

1. provider-neutral conversation to durable artifact;
2. project/workspace task with file/tool approval and receipt;
3. Core execution with question/approval and protocol transcript;
4. scheduled task creation, restart, execution, and mission-control result using a deterministic fake provider;
5. Web UI start/login/CSRF/WebSocket/stop;
6. extension/MCP install, scoped invocation, disable, and revoke;
7. update metadata and supported-platform smoke.

Real-provider canaries should be a separate credentialed lane, never confused with deterministic release proof.

