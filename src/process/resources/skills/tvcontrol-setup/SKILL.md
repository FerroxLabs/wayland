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

**Search the tool catalogue first.** Connector tools are not handed to you up front — they sit
in a searchable catalogue and only enter your toolset once you ask for them. An empty toolset is
therefore what you see BEFORE looking, whether or not TVControl is installed, so it proves
nothing on its own.

Search by name for `tv_health_check`, `chart_get_state` and `tv_launch`, and search by intent
("tradingview chart"). Then read the result:

- **The search returns them** — TVControl IS installed. Skip the install entirely, go to Step 2,
  and never emit a proposal block. Re-proposing an install over a working connector is the worst
  outcome this skill can produce.
- **The search returns nothing** — TVControl is not installed. That is the whole test. Do not run
  a shell command to look for it, and do not guess from a failed call.

**Only when the search came back empty**, offer the install and emit exactly one proposal block:

```
[CONCIERGE_PROPOSE]
kind: add_mcp
name: com.ferroxlabs-tvcontrol
command: npx
args: @ferroxlabs/tvcontrol@2.3.1
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
- **A control port that is already open returns `action: "already_running"` with
  `launched: false`.** That is a success, not a no-op to retry — TradingView is answering and
  nothing was started. Do not call again with `kill_existing` to "make sure".

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

**Default to TradingView's own import. Do not add the symbols yourself.**

TradingView takes the `.txt` export directly — the user picks Import from the watchlist menu,
chooses the file, and it is done in one step. It takes the raw `.txt`, it keeps the `###`
section structure exactly as written, and it needs no conversion — none of which is true of
the connector's own import.

1. Tell them where the file is, and that it imports as-is with no conversion.
2. Walk them to it: **the watchlist panel, the three-dot menu at its top, then "Import
   list…"**. Say which control, in order.
3. **Then verify, and this part is yours to do**: `watchlist_get`, compare the count against
   the file, and name anything missing. That is the half they cannot easily check themselves.

It is worth being clear about why this is not the agent doing less. The connector needs the
file converted first, it posts an exchange-prefixed ticker that does not exist without
complaint (see below), and the list it writes to is the one the user sees in every layout they
own. Handing them a one-click native import and then checking the result honestly is the better
outcome, not the lazier one.

TVControl 2.3.0 did make the connector path materially safer than it was — the adds and
removals go through TradingView's own symbols API now instead of driving the UI, they are
verified from a fresh read, and a removal that did not happen throws instead of reporting
success. It is no longer slow and it is no longer one-way. It is still the second choice,
because the native import is one click and preserves their sections.

**Use the connector's own import only when they ask you to do it for them**, or for topping up
a handful of symbols later. If you do, everything below applies.

---

### If you are driving the import yourself

**The export file will not import as-is through the CONNECTOR.** This is the trap — note it
does not apply to TradingView's native import above, which takes the raw `.txt`.

`watchlist_import` wants a JSON file with a `schema_version` of 1 or 2 and a `symbols` array:

```json
{ "schema_version": 1, "symbols": [{ "symbol": "NASDAQ:AAPL" }] }
```

That is the shape `scripts/parse-watchlist.mjs` writes, and it is accepted. `watchlist_export`
itself now writes **schema 2**, which adds an `entries` array holding the stored list verbatim
with the `###` section headers in place. Import prefers `entries` when it is present, so an
export/import round-trip keeps the user's sections; the converter's schema-1 file carries the
symbols only, so importing it does not recreate section structure.

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

⚠ **The file must live under the user's home directory or the OS temp directory.**
`watchlist_import` rejects anything else outright ("Paths must resolve under home directory
or system tmp"), and `/tmp` on macOS does **not** count — it wants the real `os.tmpdir()`.
An app-owned userData folder satisfies this on every platform.

⚠ **The watchlist is NOT part of the chart layout.** It belongs to the account, so it is
shared by every layout they own. Doing this work on a scratch layout does not protect it.
Adding seventy symbols changes the list they use every day, so ask before you write, and say
that plainly — "this will add 44 names to the watchlist you use everywhere" — not "I'll set
up your watchlist".

Then load it, either way:

- **`watchlist_import`** with `file_path` = the JSON you just wrote. `mode` defaults to
  `merge` (adds what is missing). `replace` syncs the list to the file and therefore
  **deletes** symbols that are not in it.
- **`watchlist_add_bulk`** with the symbol list. **Maximum 100 symbols per call**; the
  converter's stderr line tells you how many calls that is.

### Three things about this API, and what changed in 2.3.0

1. **An exchange-prefixed symbol that does not exist still lands as a dead row.**
   `watchlist_add_bulk` resolves a *bare* ticker through symbol search now and refuses it with
   `SYMBOL_UNKNOWN` when it does not resolve, so `"AAPL"` becomes `NASDAQ:AAPL` or errors. But
   anything already carrying a colon is posted verbatim, and the verification only asks whether
   that literal string came back — so `NASDAQ:NOTREAL` verifies as added.

   Read `not_added` and the per-symbol `results[].added` (there is **no** `error_count` on this
   call; that field is on `watchlist_import`). Then confirm with `watchlist_get`.

   ⚠ **`watchlist_get` no longer carries a per-row `last` price.** Membership comes from the
   symbols API and is complete even with the panel closed, but prices are best effort: rows get
   a `cells` array **only when the watchlist panel is open**. Check `quotes_available` first. If
   it is false, you cannot tell a resolved row from an unresolved one from this call — say so
   rather than implying you checked. If it is true, a row with no `cells` is the one that did
   not resolve, and immediately after launch **every** row is priceless until the datafeed
   populates, so read it twice if the app has just started.

2. **Removal works now, and it is verified.** `watchlist_remove` and `watchlist_remove_bulk` go
   through the symbols API rather than a UI right-click, read the list back, and throw if the
   symbol survived. `watchlist_remove_bulk` reports `removed_count`, `not_found` (never there)
   and `survived` (there, and still there) as separate outcomes. **So an add IS undoable from
   here** — but only tell the user something was removed when the call came back clean, and
   never on the strength of having asked.

   ⚠ **Read `survived`, not `success`, to decide whether removal worked.** `success` is
   `every symbol removed`, so asking for one name that was never in the list turns it `false`
   (and `verified` with it) even when every symbol that WAS there came out correctly. Verified
   live: removing three present symbols plus one that never existed returned
   `success: false, removed_count: 3, not_found: ["…"], survived: []`, and the three were
   genuinely gone. **`survived: []` means nothing failed to remove.** Reporting that call as a
   failure is wrong and is the easiest mistake to make here — say which ones came out, and name
   the `not_found` ones as "not in the list" rather than as errors.

   ⚠ **More generally on this connector, `success: false` does not mean nothing happened.**
   Verified live in two different tools on the same chart: `watchlist_remove_bulk` above, and
   `chart_set_timeframe`, which returned
   `success: false, "Chart did not finish loading timeframe 60"` while `chart_get_state`
   immediately after showed the chart **already on 60** — the switch applied, and only the data
   that follows it never arrived. Both directions of the round trip behaved the same way. So
   before reporting a failure, read the state back and say what is actually true now. Telling
   someone their timeframe did not change when it did is worse than saying nothing.

3. **`dry_run` on `replace` does NOT show what would be deleted.** It reports only
   `would_add` and `would_skip`. The destructive half of the operation is invisible in the
   preview, so a dry run is *not* a safety check for `replace`. Treat `replace` as
   unpreviewable and only run it on an explicit, informed request. `replace` also removes
   section headers that are not in the file, and `import` can only append, so restored headers
   land at the end of the list unless the watchlist started empty — the result carries an
   `order_note` saying so when that happens.

**Be honest about the result.** Never say "imported all 74". Say how many landed, name the ones
that did not, and offer to retry just those. Confirm with `watchlist_get` and compare the count
against what the converter reported.

---

## Step 4 — TC-TIDE (the order here is fixed)

TC-TIDE is published **privately** at
<https://www.tradingview.com/script/7qX9c9mf-TC-TIDE/>. It is reachable by direct link only,
it is not public, and it is not invite-only — that URL is the sole way in. There is no
URL-based "add this script" anywhere in TVControl.

**For the user in front of you, it will NOT be in search.** The script is private, so until
they favourite it from that URL it does not exist as far as their indicator dialog is
concerned. The favourite is not a fallback and not a recovery step — it is the precondition,
and it comes first. This order is not negotiable:

1. **Open the URL for them** and say what it is.

2. **Tell them the exact control to click: "Add to favourite indicators"** on that page. Say
   plainly that this is the one step nobody can do for them, because the script is private to
   their account. Wait for them to confirm they clicked it.

3. **`indicator_search`** with query `TC-TIDE` — **hyphenated, exactly as the title is
   written**. Pass no section; do not constrain it.

   ⚠ **The search is literal and does NOT normalise punctuation.** `TC TIDE` with a space
   returns **zero results even when the script is definitely present** — verified by running
   both against a machine that has it. Getting this wrong does not look like a typo, it looks
   like the favourite failed, so the user gets sent round the loop again for something they
   already did correctly.

4. **Report which section it actually came back under** (`Favorites`, `My scripts`,
   `Community`, whatever the result says) and pass that same section back to the add call.
   Never assume which one.

5. **`indicator_add_from_search`** with query `TC-TIDE`, `match` set to the exact title from
   the search result, and `section` set to **the section you just observed**. `TC-TIDE PRO` is
   a different script with a different title; match the one they asked for.

6. **If the search still returns nothing, the favourite did not take.** Say exactly that,
   reopen the page, and walk them through the click again.

⚠ **Never substitute a lookalike.** Searching `TIDE` on its own returns a dozen unrelated
community scripts — `Tide Tracker Zones`, `TideMaster`, `ROC Tide`, `Market Tide` and others.
**None of them is TC-TIDE.** Only `TC-TIDE` and `TC-TIDE PRO` under the user's own
`Favorites` or `My scripts` are the real thing. Adding a community script with a similar name
and carrying on is worse than stopping, because every number the user then reads is from the
wrong indicator.

**Note for anyone testing this on the machine TC-TIDE was developed on:** there it already
sits under `My scripts` with no favouriting, so steps 1 and 2 will look unnecessary. That is
the author's box and it is the exception, not what a user sees. Do not "simplify" this step
on the strength of it.

**Check:** `chart_get_state` lists TC-TIDE among the indicators. If it does not, the chart
does not have it, whatever the add call returned.

⚠ **Present in the list is not the same as healthy.** A study that never finished registering
with the server is reported with `id: null` and `addressable_by: "name"`, and it kills the
pane's data session on every reconnect. `chart_get_state` carries a `chart_health` block when
the pane it describes is broken. If TC-TIDE comes back that way, do not report the setup as
done: run `tv_chart_health`, then `tv_repair_chart`, then add it again with
`indicator_add_from_search`.

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
- whether `chart_get_state` returned a `chart_health` block saying the pane is broken
- the watchlist count from `watchlist_get`

If any of it is short, say which part and why, and offer the specific next action. A setup
that is three-quarters done and described as finished is worse than one that stopped and
said so.

---

## Step 7 — run it, so they SEE it work

**Do not stop at "you are set up."** Nobody believes a green tick. Run the morning report now
with the `market-open-report` skill and put the result in front of them: how many names it
scanned, the bar date, and the brief itself.

It needs no chart and no watchlist of their own — a default list of seventy-four names ships
with that skill — so this works even when part of the setup above did NOT. If TradingView
would not start, or the connector is still broken, **run the report anyway**. Ending with a
real brief plus one honest sentence about what is still unfinished beats ending with an error
and nothing to show for the last ten minutes.

Then, and only then, offer the daily schedule. Someone who has just watched it produce a brief
needs no persuading that they want one every morning.

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
