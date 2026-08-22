---
name: strategy-ab-test
description: Head-to-head strategy comparison — snapshot state, sweep params on strategy A, restore, sweep strategy B, then compare metrics side-by-side. Use when the user asks "which strategy is better?" or "A/B test these two".
---

# Strategy A/B Test

You are running two Pine strategies head-to-head on the same symbol/timeframe and reporting a data-backed winner.

## Step 1: Lock the Environment

The comparison is only valid if both strategies run on the same chart state.

1. `chart_get_state` — confirm symbol, timeframe, and chart type
2. `state_snapshot` with `name` `abtest-baseline` — so you can roll back cleanly between A and B, and at the end

Example baseline: `ES1!`, `15m`, Candles.

## Step 2: Define What "Winner" Means

Ask the user (or use defaults) for the ranking metric. Common options:

- **Net Profit** — simplest, ignores risk
- **Sharpe Ratio** — risk-adjusted, preferred
- **Max Drawdown** — lower is better (use absolute value)
- **Profit Factor** — gross profit / gross loss
- **Composite** — rank each metric, sum ranks, lowest wins

Default: report all four, pick winner by **Sharpe**, break ties by **lower max drawdown**.

## Step 3: Run Strategy A

1. Load A's source: paste via `pine_set_source` (or `pine_open` if saved by name). `pine_set_source`
   refuses to overwrite a buffer holding real content unless you pass `confirm_overwrite: true` —
   read the buffer with `pine_get_source` and keep a copy before you confirm
2. `pine_smart_compile` — auto-detect type, compile, surface errors
3. If errors: iterate via the `pine-develop` loop until clean
4. `strategy_sweep` — parameter sweep with cooldown + resume. `symbols`, `timeframes` and `entity_id`
   are all REQUIRED; the param grid rides in `inputs` (e.g., `inputs: { ema_len: [20, 50, 100], atr_mult: [1.5, 2.0, 2.5] }`).
   Get `entity_id` from `chart_get_state` after the strategy compiles — it is the study's id, not its name
5. Collect results — `strategy_sweep` returns per-combination `{net_profit, sharpe, max_dd, profit_factor, trades}`

Example — strategy A (trend-follow):

```
pine_set_source(<A source>)
pine_smart_compile()
chart_get_state()   // read the compiled strategy's entity_id
strategy_sweep({
  entity_id: "<A entity_id>",
  symbols: ["ES1!"],
  timeframes: ["60"],
  inputs: { ema_len: [50, 100, 200], atr_mult: [1.5, 2.0] }
})
```

Pick A's best row by the chosen metric. Record it.

## Step 4: Restore, Then Run Strategy B

1. `state_restore` with `name` `abtest-baseline` — wipe A off the chart. It is DESTRUCTIVE by design here: it makes the chart match the snapshot, which is exactly what removes A
2. Load B's source: `pine_set_source` (with `confirm_overwrite: true`, since A is in the buffer)
   + `pine_smart_compile`
3. `strategy_sweep` over B's param grid, in `inputs`, with B's own `entity_id` from `chart_get_state`
   (the restore wiped A, so A's id is gone)
4. Pick B's best row

Example — strategy B (mean-reversion):

```
state_restore({ name: "abtest-baseline" })
pine_set_source(<B source>)
pine_smart_compile()
chart_get_state()   // read the compiled strategy's entity_id
strategy_sweep({
  entity_id: "<B entity_id>",
  symbols: ["ES1!"],
  timeframes: ["60"],
  inputs: { rsi_len: [7, 14, 21], rsi_ob: [70, 75, 80] }
})
```

If `strategy_sweep` pauses mid-sweep due to cooldown, it will auto-resume — just wait.

## Step 5: Compare Side-By-Side

Produce a metrics table:

| Metric | Strategy A (best) | Strategy B (best) | Winner |
|--------|-------------------|-------------------|--------|
| Net Profit | $8,420 | $6,110 | A |
| Sharpe | 1.42 | 1.78 | **B** |
| Max DD | -$2,100 | -$980 | B |
| Profit Factor | 1.65 | 1.89 | B |
| Trades | 84 | 142 | — |

Pull each row from each strategy's `data_get_strategy_results` for the best-params run.

## Step 6: Declare Winner + Caveats

- **Winner by default rule (Sharpe)**: Strategy B
- **Caveats**:
  - Trade count — if B has far more trades, is it over-trading? Factor commission
  - Regime — was the test window mostly trending or chop? A's edge may only show in trends
  - Robustness — check variance across the sweep, not just the single best row. Cherry-picked best params can overfit

## Step 7: Report + Cleanup

1. Show the table + winner call + caveats
2. `capture_screenshot` of the winning strategy loaded so the user has a visual
3. `state_restore` with `name` `abtest-baseline` if the user wants their original chart
4. Optionally `state_delete` with `name` `abtest-baseline` once confirmed

## Error Notes

- `PINE_COMPILE_ERROR` — fix source, retry compile before sweeping
- `STRATEGY_SWEEP_COOLDOWN` — expected; the tool resumes automatically
- `CHART_LOADING` after restore — wait 1-2s and continue
