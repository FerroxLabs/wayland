---
name: porting-pine-versions
description: Migrate Pine Script v4 / v5 source to v6 — analyze, apply migration rules, compile-check, iterate until clean. Use when the user hands over an older script or asks to "upgrade to v6" / "port this Pine code".
---

# Porting Pine v4 / v5 → v6

You are migrating an older Pine Script to v6. Work iteratively: analyze → rewrite → compile → fix.

> **Power-toolkit shortcut:** `pine_check` does a server-side compile without touching the chart — use it between rewrite passes to fail fast on syntax errors before doing a full `pine_smart_compile` round. `pine_analyze` (offline) covers v4/v5 deprecation flags.

## Step 1: Pull + Identify the Version

1. `pine_get_source` — read the current source (skip if the user pasted it in chat)
2. `pine_analyze` — the analyzer flags `v<6` scripts explicitly; also surfaces deprecated calls
3. Look at the first non-comment line:
   - `//@version=4` → v4
   - `//@version=5` → v5
   - missing / `//@version=6` → nothing to do

## Step 2: Apply Migration Rules

Update the version header first: `//@version=6`. Then apply these rewrites.

### v4 → v6 Cheat Sheet

| v4 | v6 |
|----|----|
| `study("Name", overlay=true)` | `indicator("Name", overlay=true)` |
| `security(...)` | `request.security(...)` |
| `sma(x, n)` | `ta.sma(x, n)` |
| `ema(x, n)` | `ta.ema(x, n)` |
| `rsi(x, n)` | `ta.rsi(x, n)` |
| `crossover(a, b)` | `ta.crossover(a, b)` |
| `crossunder(a, b)` | `ta.crossunder(a, b)` |
| `highest(x, n)` | `ta.highest(x, n)` |
| `lowest(x, n)` | `ta.lowest(x, n)` |
| `atr(n)` | `ta.atr(n)` |
| `tostring(x)` | `str.tostring(x)` |
| `tonumber(x)` | `str.tonumber(x)` |
| `nz(x)` | `nz(x)` (unchanged) |
| `input(..., type=input.integer)` | `input.int(...)` |
| `input(..., type=input.float)` | `input.float(...)` |
| `input(..., type=input.bool)` | `input.bool(...)` |
| `iff(cond, a, b)` | ternary `cond ? a : b` |
| `valuewhen(cond, src, n)` | `ta.valuewhen(cond, src, n)` |

### v5 → v6 (smaller gap)

Most `ta.*`, `str.*`, `math.*`, `array.*`, `input.*` namespaces already exist in v5. Main v6 changes:

- `//@version=5` → `//@version=6`
- Some drawing/style constants renamed — trust the compiler errors to guide you
- `plot.style_*` constants: verify they still exist; the compiler will flag drops
- Strict type inference — add explicit types (`float`, `int`, `bool`) on `var` declarations where the compiler now requires them
- `request.security` lookahead param default tightened; be explicit: `lookahead=barmerge.lookahead_off`

### Structural rules that stay

- 4-space indentation (never braces)
- Every script declares exactly one of `indicator()`, `strategy()`, or `library()`
- Series vs simple typing is stricter in v6 — if compiler complains, often you need `input.int(..., defval=14)` instead of raw `int` assignments

## Step 3: Rewrite Locally

Edit the source as a single coherent pass — don't piecemeal if the script is short. For long scripts (500+ lines), port function-by-function and re-check after each.

## Step 4: Compile-Check Server-Side

1. `pine_check` — server-side compile of the rewritten source. Cheaper than a full `pine_set_source` + `pine_smart_compile` cycle because it doesn't mutate the live editor.
2. Read errors. Common post-migration breakage:
   - `Could not find function 'xxx'` → likely still a v4 bareword; prefix with `ta.` / `str.` / `math.`
   - `Cannot call 'input' with arguments...` → switch to the typed variants `input.int` / `input.float` / `input.bool` / `input.string`
   - `Syntax error at input 'study'` → rename to `indicator`
   - `Series type required` → explicit cast, e.g., `float src = close`

## Step 5: Iterate Until Clean

Loop:

1. Fix the next error in the local source
2. `pine_check` again
3. Stop when error count is 0 and warnings are acceptable

Don't push to the editor until `pine_check` is clean — saves round-trips.

## Step 6: Push + Verify

1. `pine_set_source` — inject the clean v6 source. It **refuses to overwrite a buffer holding
   real content unless you pass `confirm_overwrite: true`**, which on this workflow it always
   does: the v4/v5 original is sitting in it. Read it with `pine_get_source` and keep the copy
   before you confirm. Compiling SAVES over the bound saved script, so the v4/v5 source stops
   existing anywhere except TradingView's own version history for that script — say that to the
   user in the same breath as reporting the port, and name the script you replaced.
2. `pine_smart_compile` — final in-editor compile (catches anything `pine_check` missed)
3. `pine_get_errors` — confirm zero
4. `capture_screenshot` — visual sanity check that plots still render as expected
5. If it's a strategy: `data_get_strategy_results` — compare metrics vs the v4/v5 baseline the user recorded previously (regressions here usually indicate a subtle porting bug like lookahead semantics)

## Step 7: Report

- **Version bumped**: v4 → v6 (or v5 → v6)
- **Rewrites applied**: count of `study`→`indicator`, `security`→`request.security`, `ta.*` prefix adds, `input.*` typed conversions, etc.
- **Behavioral deltas to watch**: flag any `lookahead`, `barmerge`, or `math.round_to_mintick` changes that could shift backtest numbers
- **Final compile status** and screenshot path

## Error Notes

- `PINE_COMPILE_ERROR` — iterate; don't declare done
- If `pine_get_source` returns a huge blob, work in a local file and avoid re-reading unless needed
