# Pre-demo checklist

Run this on the demo machine, on the packaged build being demoed. Record each
command's output. A checklist item nobody can fail is not a check.

---

## 1. START A FRESH CHAT. Do not demo in a chat that predates the build.

This is the single easiest way for the whole release to be silently absent on
stage.

`src/process/agent/wcore/index.ts:1149` is:

```ts
if (this.options.presetRules && !this.options.resume) {
```

The `[Assistant System Rules]` injection — which carries the Constitution, the
assistant's own rules AND the honesty floor — is **skipped on resume**, because
those rules were already written into that session's history when the chat was
created. A chat created before this build therefore replays the OLD rules
forever. `WCoreManager.ts:918` routes the composed prompt through the same
`presetRules` field, so the floor rides the same gate.

**Control (must actually be run):** on the upgraded build, open a chat that
PREDATES the upgrade and ask _"Do you remember things between our chats?"_. Then
ask the identical question in a NEW chat. The resumed chat must reproduce the OLD
behaviour and the new chat the fixed behaviour. **If both behave the same, either
the fix did not land or the resume gate is not doing what the code says** —
investigate before demoing.

## 2. Do not demo in raw-engine mode.

`WCoreManager.ts:903` and `:918` hard-null both `systemInstructions` and
`effectivePresetRules` under `rawEngineMode`. That path gets no Constitution, no
assistant rules and no honesty floor. It is a deliberate escape hatch, not a
regression — but nothing from this release is present in it.

## 3. Decide the memory branch BEFORE the copy freezes.

Core defaults memory **ON** (`crates/wcore-config/src/config.rs`, `MemoryConfig::default`,
"F-091 (CRIT, D4 decision): default ON"), and gates the write tools on
`want_memory = memory.enabled || observability.skills_lifecycle`
(`crates/wcore-agent/src/bootstrap.rs:1328`). Both default true. **A fresh install
has working memory.**

Sean's own profile is the outlier: `~/Library/Application Support/wayland-core/config.toml`
has `[memory] enabled = false` AND `[observability] skills_lifecycle = false`,
both written values, not defaults. That is why "Saved to memory" saved nothing
there.

**DECISION MADE 2026-08-26: memory is ON for the demo.**

`~/Library/Application Support/wayland-core/config.toml` line 193 flipped
`[memory] enabled = false` -> `true`. Backup kept alongside it as
`config.toml.bak-memory-on-20260826-144443`. Exactly one line changed, verified
by diff, and the first three bytes re-checked for a BOM (`91 100 101`, not
`239 187 191`) because a BOM here silently breaks TOML parsing and takes the
whole chat down with a profile-splice error.

**Proof executed, not assumed.** On the packaged 0.13.7 build: stated the fact in
a fresh chat, fully quit the app, relaunched, asked in a NEW chat, and got back
"Trading account: Ferrox-Alpha. Per-trade risk cap: 2.75%." The engine store went
from `facts = 0` to `facts = 3`. Before the flip the identical script returned
"I don't have any prior knowledge or memory of the user."

`[observability] skills_lifecycle` was deliberately left `false`. `want_memory`
is the OR of the two, so flipping `memory.enabled` alone is sufficient, and it is
the switch the Settings UI actually drives. Minimal change.

### What was deliberately NOT done: no fleet-wide auto-repair

New installs already default memory ON, so nothing needs changing for them. The
population at risk is users whose config was rewritten by an OLDER Core, whose
typed re-serialize stamped the then-current `false` into their file permanently.

Do NOT silently flip those profiles to `true` on upgrade. Settings -> Wayland
Core -> Memory has a real user-facing toggle (`MemoryPane.tsx:132`), so an
`enabled = false` on disk can equally be a DELIBERATE privacy choice, and there
is no way to tell the two apart from the file. Silently re-enabling a privacy
feature a user switched off would be a worse trust defect than the one this
release fixes. The Memory page's new scope line points at Settings; that is the
honest remedy, and a real migration is its own project with its own consent step.

## 4. Verify the honesty floor is actually in the prompt.

In a fresh chat ask the assistant to remember something it has no tool for. It
must not say it saved anything. Getting the honest answer once does **not** close
the underlying issue — this is a prompt floor, it lowers the rate of over-claiming
and does not eliminate it.

Kill switch if it misbehaves on the day: relaunch with `WAYLAND_HONESTY_FLOOR=off`.
That is a relaunch, not a rebuild.

## 5. Do not over-claim in the release notes.

Do not describe this release as having fixed fabrication or as adding memory. It
removes a specific false promise from the Concierge prompt and adds a floor that
reduces over-claiming. Saying more would be the same defect class as the bug, at
the level of the release.
