---
name: tvcontrol-setup
description: 'Set up TVControl end to end: install the connector, start TradingView Desktop with its control port open, load a watchlist export, add the TC-TIDE indicator, and leave a working chart. Use when a user wants TradingView connected, says TVControl or the chart tools are not working, or asks to load their watchlist or get TC-TIDE onto the chart.'
---

# TVControl setup

You walk one person from "nothing" to "a live TradingView chart the assistant can read",
in a fixed order, without them having to know what any of it is. Do the steps in order.
Each step has a check. Do not move on until the check passes, and do not describe a step
as done because the tool call returned.

## The two things you cannot do

Say these out loud when you reach them, rather than working around them.

1. **You cannot install the connector.** You propose it; the user clicks Apply on a card.
2. **You cannot put TC-TIDE in the user's TradingView account.** It is a private script.
   Only they can click "Add to favourite indicators", in their own signed-in TradingView.

Everything else in this skill you can do for them.

---

## Step 1 — is TVControl installed?

**Check your own toolset.** If `tv_health_check`, `chart_get_state` and `tv_launch` are not
in your tools, TVControl is not installed. That is the whole test. Do not run a shell
command to look for it, and do not guess from a failed call.

**If the tools are missing**, offer the install and emit exactly one proposal block:

```
[CONCIERGE_PROPOSE]
kind: add_mcp
name: com.ferroxlabs-tvcontrol
command: npx
args: @ferroxlabs/tvcontrol@2.2.2
[/CONCIERGE_PROPOSE]
```

Then stop and wait for them to Apply. Notes that matter:

- The version is **pinned**. Do not propose `@latest`, and do not "upgrade" the pin to be
  helpful. It is the version the catalog entry ships and the one the setup guide describes.
- The connector needs no account, no API key and no token. Say so; people expect a signup.
- New tools become available to you once the connector is installed. If they are still
  absent right after Apply, ask the user to send one more message so the turn picks up the
  new toolset. Do not conclude the install failed on the first look.

**If the tools are present**, say so and go to step 2. Do not re-install and do not propose
anything.

---

## Step 2 — TradingView Desktop, running, with control enabled

TVControl drives the **desktop app on this machine**. A chart open in a browser tab is
invisible to it. Any TradingView plan works, including the free one.

**`tv_launch` is both the detector and the launcher.** Call it once with defaults.

- **Leave `kill_existing` at its default `false`.** Setting it true kills the running
  TradingView and can discard unsaved state — layouts, drawings, a live session someone is
  actually trading. Never pass true to "make it clean".
- **Read the `message`, not the `category`.** The category is `TV_NOT_RUNNING` for both
  "not installed" and "installed but no control port". Only the message text tells them
  apart.

**If the message says it cannot find TradingView**, it is not installed. Point them at
[tradingview.com/desktop](https://www.tradingview.com/desktop/) and wait.

**If the message says it is not running, or that it cannot reach the control port**, this is
the one step that actually matters. TradingView must be *started* with its control port
open. **Quit TradingView completely first** — relaunching from the Dock is not enough, the
port is only opened at startup. Give them the line for their platform:

**macOS** — in Terminal:

```
open -a TradingView --args --remote-debugging-port=9222
```

**Windows** — in PowerShell:

```
& "$env:LOCALAPPDATA\Programs\TradingView\TradingView.exe" --remote-debugging-port=9222
```

**Linux** — in a terminal:

```
/opt/TradingView/tradingview --remote-debugging-port=9222
```

If TradingView came from the Microsoft Store, the Windows command above will not find it.
Use the `launch_tv_debug.bat` script shipped in the package, which locates the Store install.

Tell them once, plainly, what this trade is: while the control port is open, any program on
this computer can drive their signed-in TradingView. The assistant can change the chart —
symbol, timeframe, indicators. It cannot place orders and cannot reach their broker. Leave
TradingView running; quitting it or restarting it normally takes the tools offline again.

**Check:** `tv_health_check` returns and reports a chart. Only then go on.

---

## Step 3 — the watchlist

**The export file will not import as-is.** This is the trap.

`watchlist_import` wants a JSON file in the shape `watchlist_export` writes:

```json
{ "schema_version": 1, "symbols": [{ "symbol": "NASDAQ:AAPL" }] }
```

What the user has is TradingView's own UI export — one line, a `###` section header, then
comma-separated tickers:

```
###TC MASTER,NASDAQ:SOUN,NYSE:IONQ,NASDAQ:ARM,...
```

Convert it first:

```bash
node scripts/parse-watchlist.mjs "<path to the .txt export>" --json <OUT>/watchlist.json
```

It prints the plain symbol list to stdout (one per line) and a summary to stderr, and writes
the import JSON only when `--json` is given. Node only, no dependencies. Write `<OUT>` to an
app-owned directory — never into a git repository, and never next to the user's own file.
It exits non-zero if the file parsed to zero symbols, which means it was not the export.

Then load it, either way:

- **`watchlist_import`** with `file_path` = the JSON you just wrote. `mode` defaults to
  `merge` (adds what is missing). `replace` syncs the list to the file and therefore
  **deletes** symbols that are not in it — only use it if the user explicitly asks to
  replace their watchlist. A `dry_run: true` pass first is cheap and shows what would change.
- **`watchlist_add_bulk`** with the symbol list. **Maximum 100 symbols per call**; the
  converter's stderr line tells you how many calls that is.

**Be honest about the result.** Adds are driven through the TradingView UI one symbol at a
time under the hood. Seventy-plus symbols is slow — warn them it will take a few minutes —
and it fails in parts: a few symbols can bounce while the rest land. `watchlist_add_bulk`
reports per-symbol results; read them.

Never say "imported all 74". Say how many landed, name the ones that did not, and offer to
retry just those. Confirm with `watchlist_get` and compare the count against what the
converter reported.

---

## Step 4 — TC-TIDE (the order here is fixed)

TC-TIDE is published **privately** at
<https://www.tradingview.com/script/7qX9c9mf-TC-TIDE/>. It is reachable by direct link only
and **it is not searchable** until the user has favourited it. There is no URL-based "add
this script" anywhere in TVControl. So the favourite is not a fallback, it is a
precondition, and this order is not negotiable:

1. **Open the URL for them** and say what it is.
2. **Tell them the exact control to click: "Add to favourite indicators"** on that page.
   Say plainly that this is the one step nobody can do for them, because the script is
   private to their account. Wait for them to confirm they clicked it.
3. **`indicator_search`** with query `TC TIDE`. Pass **no section** — do not constrain it.
   Report which section it actually came back under (Favorites, My scripts, Community
   Scripts, whatever the result says). Do not assume which one.
4. **`indicator_add_from_search`** with query `TC TIDE`, `match` set to the exact title from
   the search result, and `section` set to **the section you just observed** — not a guessed one.
5. **If the search returns nothing, the favourite did not take.** Say exactly that, reopen
   the page, and walk them through the click again. Do not fall back to a different
   indicator, and do not carry on as if the chart has TC-TIDE on it.

**Check:** `chart_get_state` lists TC-TIDE among the indicators. If it does not, the chart
does not have it, whatever the add call returned.

---

## Step 5 — the chart, and the save only they can do

Set up the chart with `chart_set_symbol`, `chart_set_timeframe`, and whatever indicators
they asked for on top of TC-TIDE.

Then **ask them to press Cmd+S (Ctrl+S on Windows)** to save the layout.

This is not politeness, it is the only way it gets saved. TVControl has no `layout_save`, no
`layout_create` and no save-chart tool of any kind. `state_snapshot` writes a **TVControl-local
JSON file** that TradingView never sees: it is a local restore point for TVControl, useful if
they want to come back to this arrangement, and it is **not** a saved TradingView layout.
Never describe it as "saved to your account" or "saved your layout". If you take one, say
what it actually is.

---

## Step 6 — verify, and report what is true

Re-run `tv_health_check` and `chart_get_state`, and report from the results, not from memory
of what you asked for:

- symbol and timeframe the chart is actually on
- the indicators actually listed, and whether TC-TIDE is among them
- the watchlist count from `watchlist_get`

If any of it is short, say which part and why, and offer the specific next action. A setup
that is three-quarters done and described as finished is worse than one that stopped and
said so.

---

## If it stops working later

Almost always step 2: TradingView is running, but it was restarted normally and no longer
has the control port open. Symptom is every chart tool failing at once. Fix is to quit it
fully and relaunch with the platform command above.

Otherwise, in order: are the tools still in your toolset (connector still installed), does
`tv_health_check` answer, and is the chart the desktop app rather than a browser tab.

## Never say

- "installed" when you emitted a proposal the user has not applied yet
- "imported all of them" without per-symbol results in front of you
- "added TC-TIDE" when the search came back empty
- "saved your layout" for `state_snapshot`
- anything about the connector needing an account, key or subscription
