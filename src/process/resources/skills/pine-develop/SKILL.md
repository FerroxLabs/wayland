---
name: pine-develop
description: Full Pine Script development loop — write code, compile, fix errors, iterate. Use when building a new indicator or strategy in TradingView.
---

# Pine Script Development Loop

You are developing a Pine Script indicator or strategy in TradingView. Follow this loop precisely.

> **Power-toolkit shortcut:** before applying significant edits, call `pine_check` for a server-side compile check (no chart needed) and run `pine_analyze` for offline static analysis. If you're about to overwrite an existing chart's indicators, use `state_snapshot` first so the user can revert with `state_restore`.

## Step 1: Understand the Goal

If not already clear, ask the user:
- What type? (indicator, strategy, library)
- What does it do? (entry/exit logic, overlay, oscillator, etc.)
- Overlay or separate pane?
- Any specific inputs or visual elements?

## Step 2: Pull Current Source (if modifying)

If modifying an existing script, read the editor buffer with `pine_get_source` and keep a copy
in your working notes before you change anything. `pine_open` opens a saved script by name first
if the one you want is not already loaded.

If creating new: start from scratch. Note that `pine_new` does NOT create a new saved script —
it replaces the editor buffer with a blank template, and a following `pine_save` or
`pine_compile` persists that overwrite to the cloud. Read the buffer first.

## Step 3: Write the Pine Script

Write the complete script to a working file of your own. Every script MUST include:
- `//@version=6` header
- Proper `indicator()` or `strategy()` declaration
- All user inputs with `input.*()` functions and groups
- Clear comments for each logical section

For strategies, include:
- `strategy.entry()` and `strategy.exit()` calls
- Position sizing via `strategy()` declaration
- Default commission and slippage settings

## Step 4: Push and Compile

1. `pine_check` — compile server-side first. It does not touch the editor or the chart, so a
   syntax error costs nothing.
2. `pine_set_source` — inject the code into the Pine Editor. **It refuses to overwrite a buffer
   that holds real content unless you pass `confirm_overwrite: true`.** That refusal is the
   feature: read the buffer with `pine_get_source` first, keep the copy, and only then confirm.
3. `pine_smart_compile` — compile and report study changes. Like `pine_compile` it SAVES the
   buffer to the bound saved script first, so it is not a dry run.

## Step 5: Fix Errors

If errors are reported:
1. `pine_get_errors` — read the messages (line number + description)
2. Edit your working file — fix the specific lines
3. `pine_check` again, then `pine_set_source` + `pine_smart_compile`
4. Repeat until 0 errors

Common Pine Script errors:
- **"Mismatched input"** — usually indentation (Pine uses 4-space indentation, not braces)
- **"Could not find function or function reference"** — typo in function name or wrong version
- **"Undeclared identifier"** — variable used before declaration
- **"Cannot call X with argument type Y"** — wrong parameter type

## Step 6: Verify on Chart

After clean compilation:
1. `capture_screenshot` — take a screenshot to verify it looks right
2. `data_get_strategy_results` — if it's a strategy, check performance
3. Show the user the results

## Step 7: Iterate

If the user wants changes:
1. Pull fresh: `pine_get_source` (in case TradingView modified anything)
2. Edit locally
3. `pine_check`, then `pine_set_source` + `pine_smart_compile`
4. Screenshot to verify

IMPORTANT: Always compile after every change. Never claim "done" without a clean compile.
