---
name: learn-from-losses
description: Post-trade review — pull losing trades from the strategy tester, screenshot each entry in context, and cluster common failure patterns. Use when the user asks "why am I losing?", "review my losses", or "what's wrong with my strategy?".
---

# Learn From Losses

You are running a post-trade forensic review to identify patterns in losing trades.

## Step 1: Pull Trade History

1. `data_get_trades` — fetch trade log from the active strategy (capped 20 per request; paginate if needed)
2. Filter to losses only: `pnl < 0`
3. Sort by `abs(pnl)` descending — biggest losses first, these teach the most

If the strategy tester isn't open: `ui_open_panel` with `panel: "strategy-tester"` first.

## Step 2: Set Up Review Chart

1. `chart_get_state` — confirm symbol/timeframe match the strategy run
2. Optionally `state_snapshot` the current chart state with `name` `pre-review` so you can restore cleanly at the end
3. Add context indicators if missing (e.g., EMA200 for trend, ATR for volatility):
   - `chart_manage_indicator({ action: "add", indicator: "Moving Average Exponential" })`, then set
     length 200 with `indicator_set_inputs({ entity_id, inputs: '{"length": 200}' })`
   - `chart_manage_indicator({ action: "add", indicator: "Average True Range" })`

## Step 3: Walk Each Loss

For each losing trade (limit to top 10 by size to stay focused):

1. `chart_scroll_to_date` — jump to the entry bar (ISO date from the trade record)
2. `chart_set_visible_range({ from, to })` — both are unix timestamps in SECONDS and both are
   required; take ~50 bars either side of the entry bar
3. `draw_shape` with `shape: "horizontal_line"` at entry price (label "E"). `point.time` is required
   even for a horizontal line — use the entry bar time
4. `draw_shape` with `shape: "horizontal_line"` at stop price (label "SL")
5. `draw_shape` with `shape: "horizontal_line"` at exit price (label "X")
6. `capture_screenshot` — save the annotated context

Example — reviewing a $ES1!` long that stopped out:

```
chart_scroll_to_date({ date: "2025-03-14T09:45:00" })
chart_set_visible_range({ from: 1741937400, to: 1741989600 })
draw_shape({ shape: "horizontal_line", point: { time: 1741962300, price: 5812.50 }, text: "E" })
draw_shape({ shape: "horizontal_line", point: { time: 1741962300, price: 5805.00 }, text: "SL" })
capture_screenshot()
```

If `CHART_LOADING` errors fire between scrolls, wait 1s and retry.

## Step 4: Read Each Context

For each loss, pull the state at entry:

1. `data_get_study_values` — what were RSI, MACD, EMA readings saying at entry?
2. `data_get_pine_labels` with `study_filter` — any "Bias" or "Regime" label on that bar?
3. `data_get_ohlcv` with `summary: true, count: 20` — recent price action leading in

Collect into a per-trade record: `{date, side, entry_regime, rsi, trend_vs_ema200, atr_multiple_of_sl, outcome}`.

## Step 5: Cluster Patterns

Look for recurring failure modes across the loss set:

- **Counter-trend entries** — longs taken below EMA200 (or vice versa)
- **Overbought/oversold shorts/longs** — RSI > 70 on longs, < 30 on shorts
- **Tight stops in high vol** — SL < 1 ATR when ATR is elevated
- **Chop zone trades** — entries inside a recently flat range
- **News/session edge** — clustering around open, close, or pre-economic releases

Count frequencies. A pattern that appears in 6 of 10 losses is a real leak.

## Step 6: Report

Produce a structured writeup:

- **Top 3 failure patterns** with counts (e.g., "Counter-trend longs: 5/10, avg -$180")
- **Specific rule violations** (e.g., "40% of losses taken below EMA200 — rule says longs only above")
- **Screenshot references** for the 2-3 most illustrative examples
- **Concrete filter proposals** — e.g., "Add `close > ema200` gate; would have skipped 4 losses totaling -$620"

## Cleanup

- `draw_clear` — remove all the E/SL/X markers
- `state_restore` with `name` `pre-review` to return to the prior layout
- Offer to codify the proposed filter into the Pine strategy (hand off to the `pine-develop` skill)
