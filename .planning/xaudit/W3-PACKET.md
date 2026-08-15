# Cross-audit packet — W-3: TVControl as a first-class MCP catalog connector

Repo: FerroxLabs/wayland (Electron + TypeScript desktop app).
Commits under review: `2353f2a72` and `1267b2496`. Nothing pushed. Nothing released.

## What this packet is supposed to achieve

Make TVControl installable from Wayland's built-in MCP Library (Settings -> MCP Library)
with one click, the same way the other 107 catalog connectors install, on macOS,
Windows and Linux.

TVControl is an MCP server that drives the **TradingView Desktop** app on the user's own
machine over the Chrome DevTools Protocol. It is published on npm as
`@ferroxlabs/tvcontrol` (version 2.2.1 is live on the public registry, verified by clean
install: 101 tools over stdio).

**TVControl only works if TradingView Desktop was _started with_ a debugging port open.**
Merely having TradingView running is not enough - the port is only opened at process
start. This is a precondition Wayland cannot satisfy on the user's behalf, and the
catalog schema has no field to express a precondition. The setup guide is the only place
that instruction can live.

## The diff (207 added lines, 4 new files, no existing file modified)

```
 src/renderer/mcp-catalog/entries/com.ferroxlabs-tvcontrol.json  | 64 ++++
 src/renderer/mcp-catalog/guides/com.ferroxlabs-tvcontrol.md     | 61 ++++
 src/renderer/mcp-catalog/icons/com.ferroxlabs-tvcontrol.svg     |  1 +
 tests/unit/renderer/mcp-library/tvcontrolConnector.test.ts      | 81 ++++
```

Plus a regeneration of `src/renderer/mcp-catalog/catalog.json`, which is a **generated
index** produced by `src/renderer/mcp-catalog/scripts/build-catalog-index.ts`. It is not
hand-edited.

---

### File 1 — `entries/com.ferroxlabs-tvcontrol.json` (new)

```json
{
  "$schema": "../schema/entry.schema.json",
  "name": "com.ferroxlabs/tvcontrol",
  "title": "TVControl",
  "description": "Drive TradingView Desktop from chat: read the live chart, change symbol and timeframe, add indicators, pull OHLCV and Pine output, and take screenshots. Requires TradingView Desktop running with control enabled.",
  "version": "2.2.1",
  "websiteUrl": "https://github.com/FerroxLabs/tvcontrol",
  "repository": { "url": "https://github.com/FerroxLabs/tvcontrol", "source": "github" },
  "packages": [
    {
      "registryType": "npm",
      "identifier": "@ferroxlabs/tvcontrol",
      "version": "latest",
      "runtimeHint": "npx",
      "transport": { "type": "stdio" }
    }
  ],
  "remotes": [],
  "x-wayland": {
    "tier": "worker",
    "categories": ["data", "research", "automation"],
    "tags": ["tradingview", "charts", "trading", "pine-script", "markets"],
    "maintainerType": "wayland",
    "license": "MIT",
    "verifiedAt": "2026-08-04",
    "verifiedBy": "Wayland",
    "popularityRank": 140,
    "installRate": 0,
    "iconUrl": "icons/com.ferroxlabs-tvcontrol.svg",
    "brand": { "logoBackground": "#131722", "logoForeground": "#2962ff" },
    "auth": { "method": "none" },
    "setupGuide": {
      "path": "guides/com.ferroxlabs-tvcontrol.md",
      "estimatedMinutes": 3,
      "stepCount": 3
    },
    "platforms": ["macos", "windows", "linux"],
    "minWaylandVersion": "0.9.0"
  }
}
```

### File 2 — `guides/com.ferroxlabs-tvcontrol.md` (new)

YAML frontmatter carries the interactive steps the Library renders; the markdown body is
the prose shown under them.

````markdown
---
guideVersion: 1.0.0
estimatedMinutes: 3
steps:
  - id: install-tradingview
    title: 'Install TradingView Desktop'
    body: |
      TVControl drives the **desktop** app on this machine - not tradingview.com in a browser. If you do not have it yet, get it from [tradingview.com/desktop](https://www.tradingview.com/desktop/).

      Any TradingView plan works, including the free one. TVControl reads and drives whatever your account already has.
  - id: enable-control
    title: 'Restart TradingView with control enabled'
    body: |
      This is the one step that actually matters, and TVControl does nothing without it.

      TradingView must be started with its control port open. **Quit TradingView completely first** - relaunching from the Dock is not enough, the port is only opened at startup.

      **macOS** - in Terminal:

      ```
      open -a TradingView --args --remote-debugging-port=9222
      ```

      **Windows** - in PowerShell:

      ```
      & "$env:LOCALAPPDATA\Programs\TradingView\TradingView.exe" --remote-debugging-port=9222
      ```

      **Linux** - in a terminal:

      ```
      /opt/TradingView/tradingview --remote-debugging-port=9222
      ```

      If TradingView came from the Microsoft Store, the command above will not find it. Use the `launch_tv_debug.bat` script shipped in the package, which locates the Store install for you.

      Leave TradingView running. If you quit it, or restart it normally, the tools go quiet until you launch it this way again.
  - id: verify
    title: 'Ask for your chart'
    body: |
      In any chat, ask: **"What symbol and timeframe is my TradingView chart on?"**

      A correct answer means everything is wired up. If the assistant says it cannot reach TradingView, it is almost always step 2 - the app is running, but was not started with the control port.
---

# TVControl setup

Drive TradingView Desktop from a conversation: read the live chart, change symbol and timeframe, add and configure indicators, pull OHLCV and the output of your Pine scripts, and take screenshots.

## What it needs

TradingView **Desktop**, running, started with its control port open. There is no account to connect, no API key, and no token - TVControl talks to the copy of TradingView already on this machine.

## Good to know

**It only sees the desktop app.** A chart open in a browser tab is invisible to it.

**It can change your chart.** Asking for a different symbol or timeframe moves the chart you are looking at. It does not place orders, and it cannot access your broker.

**Running arbitrary page JavaScript is off by default.** TVControl ships a `ui_evaluate` tool that is not registered unless you set `TV_MCP_ADVANCED=1` yourself. Leave it unset unless you know precisely why you want it.
````

### File 3 — `icons/com.ferroxlabs-tvcontrol.svg` (new, single line)

An inline `currentColor` monitor-with-a-chart glyph, `viewBox="0 0 24 24"`, no external
refs, no script, no `<image>`, no `<foreignObject>`. Same shape as the other 107 icons.

### File 4 — `tests/unit/renderer/mcp-library/tvcontrolConnector.test.ts` (new, 5 tests)

```ts
const entry = tvcontrolEntry as unknown as CatalogEntry;

describe('TVControl catalog connector', () => {
  it('spawns the published npm package over stdio', () => {
    const data = entryToServerData(entry, {});
    expect(data.transport.type).toBe('stdio');
    expect((data.transport as { command: string }).command).toBe('npx');
    expect(JSON.stringify(data.transport)).toContain('@ferroxlabs/tvcontrol');
  });

  it('declares no auth, so the install card does not demand a token', () => {
    expect(entry['x-wayland'].auth.method).toBe('none');
    expect(entry.packages[0].environmentVariables ?? []).toEqual([]);
  });

  it('declares a setup guide, without which the precondition never reaches the user', () => {
    expect(entry['x-wayland'].setupGuide?.path).toBe('guides/com.ferroxlabs-tvcontrol.md');
  });

  it('the guide actually tells the user to start TradingView with the control port', () => {
    const raw = readFileSync(
      join(__dirname, '../../../../src/renderer/mcp-catalog/guides/com.ferroxlabs-tvcontrol.md'),
      'utf-8'
    );
    const front = yaml.load(raw.split('---')[1]) as { steps: Array<{ id: string; body: string }> };
    const bodies = front.steps.map((s) => s.body).join('\n');
    expect(bodies).toContain('--remote-debugging-port=9222');
    expect(bodies).toContain('launch_tv_debug.bat');
  });

  it('does not enable the arbitrary-page-JS tool', () => {
    expect(JSON.stringify(entry)).not.toContain('TV_MCP_ADVANCED');
  });
});
```

---

## Verified surrounding facts (checked in the live tree, use these as given)

1. `entryToServerData.ts:118-124` maps a non-`native` `runtimeHint` straight through:
   `{ type: 'stdio', command: pkg.runtimeHint, args: [pinnedIdentifier(pkg), ...runtimeArgs] }`.
   So `runtimeHint: "npx"` produces `command: "npx"`.

2. `pinnedIdentifier()` (`entryToServerData.ts:18-25`) returns the **bare** identifier when
   `version` is absent or `"latest"`; it only appends `@x.y.z` for a concrete version.
   So this entry spawns `npx @ferroxlabs/tvcontrol` - unpinned, resolving the npm
   `latest` dist-tag at every launch. **17 of the 108 catalog entries also use
   `"version": "latest"`** in their `packages[]`, so this matches an existing convention
   rather than inventing one. The top-level `"version": "2.2.1"` is the connector's own
   version and is a separate field.

3. `resolveMcpStdioSpawn()` (`mcpStdioSpawn.ts:33-43`) rewrites `command === 'npx'` into
   Wayland's **bundled Bun** (`bun x --bun ...`). Verified consumers, and only these:
   - `McpProtocol.ts:334` - the reachability probe
   - `GeminiAgentManager.ts:93`
   - `acp/mcpSessionConfig.ts:117,194` and `acp/session/McpConfig.ts:143`
   - `WCoreMcpAgent.ts:98` (via the `resolvePersisted…` variant)

   It is **NOT** used by `ClaudeMcpAgent`, `CodexMcpAgent` or `GeminiMcpAgent` - the three
   agents that write an MCP server into an external CLI's own config file
   (`~/.claude.json`, `~/.codex/config.toml`, `~/.gemini/settings.json`). Those receive
   the literal string `npx`, and the external CLI spawns it from its own PATH.

4. `x-wayland.auth.method` drives the install card. Any value other than `"none"` makes
   `DetailPage` render "Sign-in or a token is required after install." and route the
   Install button through the OAuth branch.

5. `x-wayland.setupGuide.path` is what makes a guide render at all. `DetailPage` reads a
   guide only when the field is present; `build-catalog-index.ts` derives the index's
   `guideUrl` from it. Omit it and the connector still installs, still shows green, and
   silently never works.

6. `npx tsx src/renderer/mcp-catalog/scripts/validate-catalog.ts` prints
   **"All catalog files valid."** with this entry in place.

7. TVControl's `ui_evaluate` tool executes arbitrary JavaScript in the TradingView page.
   Upstream leaves it unregistered unless `TV_MCP_ADVANCED=1` is set in the environment.
   The project has a hard rule that nothing in Wayland may flip that on.

8. Regenerating `catalog.json` also folded in a **pre-existing, unrelated** one-word
   change to the Raindrop entry's `shortDescription` (an earlier edit to
   `entries/com.raindrop-raindrop-mcp.json` that had never been regenerated). The
   generator also stamps `publishedAt: new Date().toISOString()` on every run, so the
   file is non-deterministic by construction. Both are pre-existing properties of the
   generator, not introduced here.

9. The **production** parser for a guide's frontmatter is
   `useMcpLibrary.ts:127`: `yaml.load(match[1], { schema: yaml.FAILSAFE_SCHEMA })`.
   FAILSAFE_SCHEMA resolves every scalar to a **string** - no booleans, no numbers, no
   nulls. The new test parses the same file with a bare `yaml.load(...)` (js-yaml 4.1.1,
   where `load` is the safe parser and `safeLoad` no longer exists), i.e. DEFAULT_SCHEMA,
   which does type-coerce. The test therefore reads the guide through a **different and
   looser** parser than the app does.

---

## What I want from you

Give a verdict of **GO**, **FIX-FIRST**, or **NO-GO**, then the findings that justify it.
No nits: anything you raise should be something that must be fixed before merge or
consciously deferred. For each finding give file, line if you can, the concrete failure
scenario (inputs/state -> wrong outcome), and severity.

Judge specifically:

**A. Does this actually install and run on all three declared platforms?**
`platforms: ["macos","windows","linux"]` is a claim. `npx @ferroxlabs/tvcontrol` is the
mechanism. Is the claim true, and is anything about the npx/Bun split in fact 3 going to
make it false-green on one of them - install succeeds, probe goes green, but the tool
never works for the agent the user actually chats with?

**B. Is `"version": "latest"` the right call here?** It follows the existing convention
for 17 entries, but it means an unpinned package is fetched and executed. TVControl is
first-party (FerroxLabs publishes it). Weigh supply-chain risk against the alternative -
a hard pin that goes stale and needs a Wayland release to move.

**C. Is the precondition adequately conveyed?** The whole connector is useless if the
user does not do step 2. Is putting it in the setup guide enough, given the guide only
renders because of one optional schema field? What happens to a user who skips the guide,
clicks Install, sees green, and asks a question?

**D. Are the tests worth anything?** They assert schema wiring, not behaviour. Is there a
defect class here they would not catch that they should? Is anything asserted so loosely
it would pass while broken? Note `expect(JSON.stringify(entry)).not.toContain('TV_MCP_ADVANCED')`
in particular - is that a real guard or theatre?

**E. Security.** The icon SVG, the guide markdown (is it rendered as HTML? does it get
sanitized?), the shell commands the guide tells a user to paste, and the fact that this
connector can read and modify a live financial chart. Anything that widens the attack
surface, and specifically anything that could re-enable `ui_evaluate`.

**F. Anything committed that should not have been**, or any claim in the entry that is
not true (`license: MIT`, `verifiedBy`, `minWaylandVersion: 0.9.0`, `popularityRank`).

Be adversarial. I would rather you refute something I believe than confirm it.
