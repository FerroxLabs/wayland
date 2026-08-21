---
name: chart-analysis
description: Analyze a chart — set up symbol/timeframe, add indicators, scroll to key dates, annotate, and screenshot. Use when the user wants technical analysis or chart review.
---

# Chart Analysis Workflow

You are performing technical analysis on a TradingView chart.

> **Power-toolkit shortcut:** if you only need a snapshot read (state + quote + indicators + Pine graphics + OHLCV), call `chart_vision_read` once instead of stepping through `chart_get_state` → `data_get_study_values` → `data_get_pine_*` → `data_get_ohlcv`.

## Step 1: Set Up the Chart

1. `chart_set_symbol` — switch to the requested symbol
2. `chart_set_timeframe` — set the appropriate timeframe
3. Wait for the chart to load (the tool handles this)

## Step 2: Add Indicators

Use `chart_manage_indicator` to add studies. Common names (must use FULL names):
- "Relative Strength Index" (not RSI)
- "Moving Average Exponential" (not EMA)
- "Moving Average" (for SMA)
- "MACD"
- "Bollinger Bands"
- "Volume"
- "VWAP"
- "Average True Range"

After adding, use `indicator_set_inputs` to customize settings (e.g., change EMA length to 200).

## Step 3: Navigate to Key Areas

- `chart_scroll_to_date` — jump to a specific date of interest
- `chart_set_visible_range` — zoom to a specific date window
- `chart_get_visible_range` — check what's currently visible

## Step 4: Annotate

Use drawing tools to mark up the chart:
- `draw_shape` with `horizontal_line` for support/resistance
- `draw_shape` with `trend_line` for trend channels (needs two points)
- `draw_shape` with `text` for annotations

## Step 5: Capture and Analyze

1. `capture_screenshot` — screenshot the annotated chart
2. `data_get_ohlcv` — pull recent price data for quantitative analysis
3. `quote_get` — the price the **chart** currently holds, which is not the same thing as the
   live price. It reads the chart's own series, so it is only as fresh as the chart's data
   connection, and it returns `success: true` with a stale bar and no warning when that
   connection has dropped. Compare its `time` against the current bar, or read
   `tv_health_check` first and treat a `datafeed.state` of `disconnected` as "every price on
   this chart is stale". For a price that does not depend on the chart's connection, use
   `quote_batch`, which goes to TradingView's scanner API instead.
4. `symbol_info` — get symbol metadata (exchange, type, session)

## Step 6: Report

Provide the analysis:
- Current price and recent range
- Key support/resistance levels identified
- Indicator readings (RSI overbought/oversold, MACD crossover, etc.)
- Overall bias (bullish/bearish/neutral) with reasoning

## Cleanup

If you added indicators the user didn't ask for, remove them:
- `chart_manage_indicator` with action "remove" and the `entity_id` from `chart_get_state`
- `draw_clear` to remove all drawings if they were temporary

`chart_get_state` reports `id: null` with `addressable_by: "name"` for a study that never
finished registering with the server. That study is damage, not a quirk: it kills the pane's
data session on every reconnect. Do not try to work around the missing id — run
`tv_chart_health`, then `tv_repair_chart`, and add the study back with
`indicator_add_from_search`. `chart_get_state` also carries a `chart_health` block when the
pane it is describing is broken; read it before reporting the chart as fine.
