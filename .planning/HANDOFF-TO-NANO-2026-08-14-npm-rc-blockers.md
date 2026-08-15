# Wayland Nano — two npm packaging blockers on v0.1.0-rc.0

**Date:** 2026-08-14 · **From:** Wayland Desktop (Mac, M5 / 24 GB, macOS 15)
**Against:** `waylandnano@0.1.0-rc.0` as published on npm today
**Desktop:** `packet/wl-integration` @ `0267ca86b`

Two things block the RC from being usable through Wayland Desktop. Both are on
your side, both are small, and **neither is visible if you only test with npm.**

Everything marked **[V]** was established by running it on this machine.

---

## 1. 🔴 BLOCKER — the published binary has no execute bit

`waylandnano@0.1.0-rc.0` ships `binaries/darwin-arm64/wayland-nano` as **`-rw-r--r--`**
[V] and relies on `postinstall: node bin/install.js` to `chmod 0755` it
(`bin/install.js:84`). The only chmod in the package is in that lifecycle script —
the launcher `bin/wayland-nano.js` never chmods at runtime [V].

**Desktop does not run npm.** It routes every `npx <pkg>` launcher through its
BUNDLED BUN runtime (`createGenericSpawnConfig`, `acpConnectors.ts:286` →
`bun x --bun <pkg> <args>`). **Bun does not run postinstall scripts for
untrusted packages**, and `bun x` has no flag to opt in — verified against the
bundled bun 1.3.14's own `--help` [V]. So the exec bit is never set and the
launcher dies:

```
wayland-nano [WAYLAND_NANO_SPAWN_FAILED]: EACCES: permission denied,
posix_spawn '/private/var/.../bunx-501-waylandnano@0.1.0-rc.0/
             node_modules/waylandnano/binaries/darwin-arm64/wayland-nano'
```

[V] — exact stderr, driving the real Desktop spawn shape.

**Control, so this is not mistaken for a broken package:** plain
`npx -y waylandnano@0.1.0-rc.0 --version` → `wayland-nano 0.1.0`, exit 0 [V].
The package is fine **under npm**. It is npm-only by accident.

### The fix (yours, one line)

**Ship the binary with mode 0755 inside the tarball.** `npm pack` preserves the
executable bit, so this needs no lifecycle script at all. Keep `install.js` if you
like — it becomes a harmless no-op — but it must stop being load-bearing.

This is worth doing for its own sake, not just for us. A package that only works
when lifecycle scripts run is broken under **bun**, under **pnpm** (which blocks
build scripts by default), and under any `npm ci --ignore-scripts` policy —
which plenty of corporate environments enforce. Right now Nano silently requires
the least strict installer.

Belt and braces if you want it: have `bin/wayland-nano.js` check
`fs.accessSync(binary, fs.constants.X_OK)` and chmod before spawning. That makes
the package self-healing regardless of installer.

---

## 2. 🟠 npm's `latest` still points at the OLD alpha

`waylandnano@latest` resolves to **`0.1.0-alpha.0`**; the RC sits on `next` [V].

So anyone following your own install instructions — `npm i -g waylandnano`, or a
bare `npx waylandnano` — silently gets the older alpha. One command fixes it:

```
npm dist-tag add waylandnano@0.1.0-rc.0 latest
```

Desktop is insulated from this: we hard-pin `waylandnano@0.1.0-rc.0`
(`WNANO_NPM_VERSION`, `acpTypes.ts`) rather than tracking a moving tag, matching
how we pin every other agent bridge. We are **not** switching to `@next` — a
moving tag would remove the per-release Desktop commit that is the only review
gate between a Nano publish and every Desktop user. But the tag is still wrong
for everyone installing Nano directly.

---

## 3. What Desktop changed on its side

`29099ca48` — builtin backends now fall back to their declared `defaultCliPath`
(`npx <pkg>@<pin>`) when the bare `cliCommand` does not resolve on PATH. Before
this, `defaultCliPath` was consulted for extension and custom-agent rows only, so
the Nano npm pin declared a distribution that nothing ever launched from and a
machine without a locally built binary died on ENOENT.

A copy the user installed themselves still wins — we only reach for npm in the
case that was otherwise a guaranteed failure. Once §1 is fixed, that path works
end to end with no further Desktop change.

---

## 4. Confirmed WORKING, so you can discount it as a suspect

Driving `wayland-nano 0.1.0` (the PATH binary) over stdio on a real Flux turn [V]:

- `initialize` advertises `_wayland/session/list`, `_wayland/session/review`,
  `session/steer`, `loadSession: true`, text-only prompt capabilities.
- `session/new` → `session/prompt` → `agent_message_chunk` → `stopReason: end_turn`.
- **The budget migration is correct and live:**
  ```
  _wayland/session/budget {"limit":null,"microcents":0,"observed":null,
    "priced":false,"sessionId":"wayland-nano-session-1786698730864103000-1",
    "session_tokens":4143}
  ```
  with **zero** remaining `sessionUpdate: 'budget'` frames [V].

Desktop consumes all three `_wayland/session/budget*` methods, and honours your
honesty rule in code: `priced: false` renders `unpriced`, never `$0.000`. That is
now pinned by a test that drives the REAL ACP SDK over a real ndJsonStream, so an
SDK bump that starts schema-validating vendor extensions fails our build rather
than silently dropping your metering again (`0267ca86b`).

---

## 5. What we need from you

1. Republish with the executable bit set in the tarball (§1). This is the blocker.
2. Promote the `latest` dist-tag (§2).
3. Tell us the new version string and we will move the pin in one Desktop commit.

Until §1 lands, Nano is launchable from Wayland Desktop **only** on a machine
where someone has already built or installed the binary onto PATH.
