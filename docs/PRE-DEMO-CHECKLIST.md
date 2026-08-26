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
PREDATES the upgrade and ask *"Do you remember things between our chats?"*. Then
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

Pick one and write the choice here:

- **Memory ON for the demo** — flip both flags, then run the proof below. Do not
  skip it: if recall still fails after the flip, the model now gets a genuine
  `assert_fact` success receipt and still cannot recall, which is strictly worse
  than today.
- **Memory OFF for the demo** — no flip, no proof needed, and **the demo must not
  include a cross-chat recall beat.**

**Proof (only if ON):** in a fresh chat, state a distinctive fact. Fully quit the
app. Relaunch. In a NEW chat, ask for the fact back. It must come back.

Known-positive control for the flags actually being read: with memory ON, ask
something that should trigger a memory write and confirm a tool call appears in
the turn (`assert_fact` or `record_episode`). No tool call means the gate is
still closed regardless of what the file says.

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
