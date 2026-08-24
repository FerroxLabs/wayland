---
name: strategy-ab-test
description: Head-to-head strategy comparison on a live chart — gate the preconditions first, then sweep and compare metrics side-by-side. Use when the user asks "which strategy is better?", "A/B test these two", or "which settings win?". Stops in a few turns with a plain answer when the comparison is not possible on this chart.
---

# Strategy A/B Test

You are comparing two strategy configurations head-to-head on the same symbol and timeframe and reporting a data-backed winner.

Most of the value in this skill is in Step 1. A comparison here needs two things that are not always true: the strategy must expose inputs you can vary, and `strategy_sweep` must actually run on this chart. Both fail regularly, and both fail in ways that look like something you can work around. They are not. Establish them first, in four calls, and say so plainly if either one is missing. Three turns of "I cannot do this, here is why" beats twenty-five turns of investigation that ends with nothing measured.

## Step 1: Precondition Gate (do this before anything else)

Run these four calls in order and stop at the first one that fails.

1. `tv_health_check` — confirms CDP is attached and the market-data connection is live. If it fails, nothing below can work; report that TradingView is not reachable and stop.
2. `chart_get_state` — read the symbol, the timeframe, and the studies on the chart. Find the strategy the user means and record its `entity_id`. Also read its input list. **Gate A: does the strategy expose settable inputs?** Some scripts hard-code their parameters, and protected or invite-only scripts often expose nothing through the study API at all. If the input list is empty, Gate A has failed. Do not go looking for the inputs anywhere else.
3. `data_get_strategy_results` with that `entity_id` — proves TradingView is really computing a strategy report for it, and gives you the baseline row you will need later anyway. An indicator that merely looks like a strategy returns nothing here. If it returns no metrics, stop and say the study on the chart is not a backtestable strategy.
4. A one-combination probe sweep. **Gate B: does `strategy_sweep` run on this chart?** Call it with the chart's own symbol and timeframe, a single input pinned to a single value, `max_combinations: 1`, and `use_cache: false`. Cache must be off, because a cached hit would return a row without touching the chart and would prove nothing about whether a real sweep can run.

```
strategy_sweep({
  entity_id: "<strategy entity_id from chart_get_state>",
  symbols: ["<chart symbol>"],
  timeframes: ["<chart timeframe>"],
  inputs: { "<one input id>": [<its current value>] },
  max_combinations: 1,
  use_cache: false
})
```

If the probe returns a result row, both gates are green. Go to Step 2. If it fails, follow the retry contract below, and if it still fails, stop and report.

### When Gate A fails (no settable inputs)

Say it directly: this strategy does not expose any inputs through the study API, so there are no two settings of it to compare. Then offer one concrete alternative and let the user pick:

- Compare it against a **different** saved strategy, head to head at their current settings (Mode B in Step 3). This works without any exposed inputs.
- Run the `strategy-report` skill on it instead, which reports the single strategy's performance in full without needing a second arm.

### When Gate B fails (the sweep will not run)

The common failure is `{"success": false, "error": "Chart did not finish loading timeframe <tf>", "category": "chart_loading"}`. After the retry contract is exhausted, run `tv_chart_health`. It is read-only and it finds the specific failure that produces this error forever: a pane whose data session dies on every reconnect because a study id never registered with the server. If it names an affected pane, report that to the user and offer `tv_repair_chart`, naming the cost — it removes the unregistered studies from that pane, and they have to be added back with `indicator_add_from_search`. Ask before running it. Do not run a repair that removes the user's studies on your own initiative.

If `tv_chart_health` reports every pane healthy, stop anyway. Report that `strategy_sweep` will not run on this chart right now, quote the exact error you got, and offer the `strategy-report` alternative on the strategy as it currently sits.

## The `chart_loading` Retry Contract

When any call fails with `category: "chart_loading"`, the tool's own hint is to wait about two seconds and retry. Follow it exactly twice: retry, and if that fails retry once more, so three attempts in total. Then stop retrying. A third failure is not a slow chart, it is a pane that is not going to finish loading, and looping on it is how a run burns its whole budget without producing an answer.

Count retries against your turn budget. Two retries at the gate is fine. Two retries per combination inside a sweep is not, so if the sweep in Step 3 fails mid-run, treat it the same way: three attempts, then report partial results.

## The Pine Editor Is Off Limits Here

Do not call `pine_open`, `pine_get_source`, `pine_set_source`, `pine_smart_compile`, `pine_save` or `pine_new` from this skill, for any reason, including reading a strategy's inputs out of its source.

Two reasons. First, it is what ate the budget in the failure this rule exists to prevent: the editor had an unrelated script open, `pine_get_source` errored, and the run spent every remaining turn there and produced nothing. Second, and worse, `pine_set_source` followed by `pine_smart_compile` **saves over the saved script bound to the editor buffer**. A sibling skill did exactly that and destroyed a user's script. Comparing strategies is a read-and-measure job. It never needs to write Pine.

If a strategy is not already on the chart, put it there with `indicator_add_from_search`, which adds a saved or community script from the Indicators dialog without opening the editor.

## Step 2: Lock the Baseline and Define "Winner"

1. `state_snapshot` with `name` `abtest-baseline` — the comparison only means something if both arms run on the same chart state, and you need a clean way back at the end. Pass `overwrite: true` if the name is already taken.
2. Pick the ranking metric. Default: report Net Profit, Sharpe, Max Drawdown, Profit Factor and trade count, pick the winner by **Sharpe**, break ties by **lower max drawdown**. Take the user's metric instead if they named one.

## Step 3: Run Both Arms

**Mode A — two settings of one strategy.** This is one `strategy_sweep` call, not two. Put both candidate values in the same grid and the tool returns a row per combination. Do not snapshot and restore between them, because there is nothing to swap.

```
strategy_sweep({
  entity_id: "<strategy entity_id>",
  symbols: ["<chart symbol>"],
  timeframes: ["<chart timeframe>"],
  inputs: { ema_len: [50, 200] }
})
```

Keep the grid small. Every extra value multiplies the combination count and each combination costs a cooldown, so two or three values on one or two inputs is the working size. `strategy_sweep` returns `{net_profit, sharpe, max_dd, profit_factor, trades}` per combination.

**Mode B — two different strategies.** Sweep the first, then swap and sweep the second:

1. Sweep strategy A as above (or read `data_get_strategy_results` for it if there is nothing to vary).
2. `chart_manage_indicator` with `action: "remove"` and A's `entity_id`.
3. `indicator_add_from_search` for B, with `section: "My scripts"` for a saved script.
4. `chart_get_state` again to read B's new `entity_id`. A's id is gone; do not reuse it.
5. Sweep B, or `data_get_strategy_results` for B.

Pick each arm's best row by the chosen metric and record it.

## Step 4: Compare Side-By-Side

| Metric | Arm A (best) | Arm B (best) | Winner |
|--------|--------------|--------------|--------|
| Net Profit | $8,420 | $6,110 | A |
| Sharpe | 1.42 | 1.78 | **B** |
| Max DD | -$2,100 | -$980 | B |
| Profit Factor | 1.65 | 1.89 | B |
| Trades | 84 | 142 | — |

Every number in that table comes from a sweep row or a `data_get_strategy_results` call you actually made. If you did not measure a cell, leave it blank and say why. Do not report an estimate to the user as a measurement.

## Step 5: Declare a Winner, With Caveats

State the winner by the agreed rule, then the caveats that matter:

- **Trade count.** If the winner trades far more often, commission and slippage may eat the edge the backtest shows.
- **Regime.** A trending test window flatters trend-following. Say what the window was.
- **Robustness.** Look at the spread across the sweep, not only the single best row. A best row that is far above its neighbours is usually overfit, not better.

## Step 6: Report and Clean Up

1. Show the table, the winner call, and the caveats.
2. `capture_screenshot` with `region: "chart"` so the user has a visual of the winning arm.
3. Put the chart back. This is destructive by design: it makes the chart MATCH the snapshot, which is
   exactly what removes whatever the comparison left behind — and exactly why you must not run it
   against a snapshot the user did not ask for.

```
state_restore({ name: "abtest-baseline" })
```

4. Once the user confirms they are done with it, drop the snapshot so it cannot be restored over a
   later chart by mistake.

```
state_delete({ name: "abtest-baseline" })
```

   Say what came back from `state_restore` rather than assuming it worked: it reports a `skipped`
   list, and a private script that TradingView never registered comes back in it. If a study is in
   that list, the chart is NOT as the user left it, and telling them otherwise is worse than the
   missing indicator.

## Turn Budget

The gate is four calls. Give the whole comparison **twenty turns**, and treat turn eighteen as the point where you stop measuring and start writing.

If you run out, report honestly rather than going quiet: name what you did measure, name what you did not, and give the partial table with the missing arm marked as not measured. A half-finished comparison that says which half is missing is usable. A run that ends at the turn limit having reported nothing is not.

## Error Notes

- `chart_loading` — three attempts total, about two seconds apart, then `tv_chart_health` and stop.
- `STRATEGY_SWEEP_COOLDOWN` — expected between combinations; the tool resumes on its own, so wait rather than retrying.
- A sweep that stops part way returns a `run_id`. Continue it with `resume_from_run_id` instead of starting the grid over.
- No inputs on the study, or no metrics from `data_get_strategy_results` — that is Gate A or the step-3 report check failing late. Stop and fall back to the alternatives in Step 1.
