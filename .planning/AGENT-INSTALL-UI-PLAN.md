# Agent install — UI and seam. Approved plan, 2026-08-11

Branch `packet/agent-installers`. Mock approved by Sean: the Agents settings page
gains a third band, **Available to install**, below **More detected**.

**The install SERVICE is already built and proven** (`77795650e`): pinned
versions, `--ignore-scripts`, per-agent prefix, launch-spec resolution, uninstall
by manifest. Verified by real installs of all three agents against the real
registry — each resolved a launch spec, spawned with `shell: false`, and
uninstalled cleanly. **Do not rebuild it.** This plan is the seam and the UI.

---

## Decisions already made. Do NOT relitigate.

| #   | Decision                                                                                                       | Why                                                                                                                    |
| --- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| D1  | A detected **system copy wins**. Card reads "your system copy" + a version chip. No competing Install button.  | Never break a working setup. Sean has all six installed; the version chip exists so support starts from a fact.        |
| D2  | Consent = one plain sentence + four facts (package, pinned version, destination, "install scripts blocked").   | It executes code. A bare "Install / Cancel" hides that.                                                                |
| D3  | Band sits **below** More detected.                                                                             | Keeps the shipped page order intact. Revisit only if the clean-machine empty state reads badly.                        |
| D4  | Install goes to Wayland's own prefix, never a global install.                                                  | Global installs need elevation on Windows and produce `.cmd` shims Node cannot spawn with `shell:false`.               |
| D5  | The installer emits an **`AcpLaunchSpec`**, never a `cliPath` string.                                          | `parseWindowsCliPath` shreds spaced paths; a test pins that broken output because T1 fixed it by BYPASSING the parser. |
| D6  | Sign-in runs the **agent's own** `claude login` / `codex login` / `kimi login` in Wayland's existing terminal. | Standing hard NO on building Claude Pro/Max subscription OAuth (ToS). We launch their flow, never reimplement it.      |
| D7  | `setup-*` / `remove-*` channels are **denied to remote** WS callers; `*-status` stays allowed.                 | They write a credential/config on the host. Matches `onboarding.connect-flux`, already denied.                         |

---

## T-A — the process seam (do FIRST; everything else depends on the channel names)

1. **Resolve the `AcpLaunchSpec` env gap.** `resolveJsRuntime()` returns
   `{command, env, kind}`; unpackaged that is the Electron binary plus
   `ELECTRON_RUN_AS_NODE=1`. `AcpLaunchSpec` is `{command, args}` with nowhere to
   put it, so a **dev-mode kimi/openclaw spec would launch an Electron window
   instead of Node**. Packaged is unaffected (bundled-bun and system-node both
   return `env: {}`).
   Pick ONE and state why: (a) merge the runtime env at the spawn seam, or
   (b) add an optional `env` to `AcpLaunchSpec` and honour it in
   `createGenericSpawnConfig`. **(b) changes a shared ACP contract — if you take
   it, `isAcpLaunchSpec` must accept specs without `env` unchanged.**
   Codex is unaffected either way: it is a native binary.
2. **IPC channels** on `ipcBridge.agentInstaller`: `status`, `install`,
   `uninstall`. Mirror the `fluxConnector` declarations exactly.
3. **Bridge handlers** + registration, mirroring `fluxConnectorBridge.ts`.
4. **Allowlist**: add `agent-installer:install` and `agent-installer:uninstall`
   to `REMOTE_DENIED_KEYS`. **Fully-qualified keys** — matching is exact, and an
   unqualified entry is decorative protection that never fires. A redteam test
   must reproduce that exact mistake as a mutation.
5. **Status must distinguish three things**: installed-by-Wayland (receipt
   present), present-on-system (detected, no receipt), and absent. D1 depends
   entirely on that distinction being real in the data, not inferred in the view.

## T-B — data model + UI

1. `LocalAgents.tsx` today renders **detected only**. Merge the catalogue
   (`AGENT_PACKAGES`) with detection into one list carrying an explicit state per
   agent: `system` | `installed` | `absent` | `installing` | `failed` | `unavailable`.
2. Render the three bands: Your agents · More detected · **Available to install**.
3. Card states per the approved mock (`~/Desktop/wayland-agents-mock.html`):
   dashed border + dimmed mark + Install button for `absent`; progress + pinned
   version while `installing`; named cause + Retry on `failed`; "your system
   copy" + version chip for `system`; "Not available on this build" + Why? for
   `unavailable` (win32-arm64 and non-AVX2 win32-x64 ship no bundled bun).
4. **The Flux chip renders BEFORE install**, on an `absent` card. The reason to
   install must be visible at the moment of deciding.
5. Consent sheet per D2, gating **execution** — not merely shown before it.
6. i18n: every new string gets a real key in all 12 locales. The parity test
   (`tests/unit/renderer/i18n/localeKeyParity.test.ts`) will fail otherwise, and
   its frozen baseline must NOT be widened to hide new keys.

## T-C — verification (this is the point, not an afterthought)

- Unit + mutation for every guard, as always: mutate, confirm RED, restore from a
  **saved copy** (never `git checkout` on an uncommitted file), confirm GREEN,
  and verify each mutation actually applied.
- **A clean-profile live run.** Every agent on this machine is already installed,
  so detection-only testing proves nothing about a clean machine. Use an isolated
  `WAYLAND_DEV_PROFILE` and assert the `absent` state renders and Install works.
- Full suite green. Baseline at plan time: **16,557 / 0 failed** on this branch.

---

## Out of scope here

Mechanic B/C/D (tarball, PyPI, Grok's script), and the ACP handshake over stdio
— `--version` proves the binary runs, not that ACP negotiates. Both are next.
