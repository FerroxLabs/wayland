# Validation rubric — when has it validated, when has it failed, and when to kill

## When to load this mode

A test finished. The team is staring at numbers and reaching for a story. Load whenever someone asks "did it work," "is that enough," "what does this number mean," or — most importantly — "should we keep going."

## The three honest verdicts

Every test ends in one of three places. Name it plainly.

- **Go (validated).** Result met or exceeded the pre-registered threshold within the sample and window. Hypothesis survived. Move to the next leap of faith.
- **Kill (falsified).** Result fell below the kill criterion. Hypothesis is dead. Don't redesign the test to save the idea — that's confirmation bias wearing a lab coat. Write the kill memo.
- **Pivot (ambiguous, but learning).** Result missed threshold, but a specific signal inside the data points to a neighboring hypothesis worth testing next. You're using the corpse to find a better idea.

"Directionally positive," "trending toward," and "just need more data" aren't verdicts. They're excuses dressed as analysis. If you reach for them, the kill criterion wasn't tight enough or the team isn't ready to hear it.

## The rubric

Score every completed test against six criteria. All six must be satisfied for the read to be trustworthy.

1. **Pre-registered threshold.** Was the kill criterion written down before the test ran? If not, the result is unfalsifiable theater. Re-run with a pre-registered number.
2. **Adequate sample size.** Did the test reach the minimum sample defined upfront? Under-sampled, the result is rumor no matter how good it looks.
3. **Clean stimulus.** Was the stimulus held constant across the window? Mid-test edits invalidate the read.
4. **Behavioral measurement.** Did you measure an action — click, sign-up, payment, return visit — or did you measure an opinion? Opinions don't count.
5. **Matched audience.** Did the traffic match the audience the hypothesis named? Wrong audience answers a different question.
6. **Honest threshold comparison.** Is the result being compared to the pre-registered number, or to a number invented after the fact to make the result look better? Only the original number counts.

A test that passes all six is a test you can decide on. A test that fails any of them needs to be re-run, not narrated around.

## Decision rules

- **Validated, all six satisfied:** ship to the next leap of faith. Update `TEAM_MEMORY.md` with the dated entry. Hand customer-language insight to Scout, pricing implications to Offer, message learnings to Copy.
- **Validated, but one of the six failed:** the result is provisional. Re-run with the fix. Don't act on shaky validation; it costs more downstream than a re-run costs now.
- **Falsified, all six satisfied:** write the kill memo. Name what was tested, what threshold failed, what the team learned that's worth keeping, and what won't be re-tested without new information. The kill is a deliverable, not a defeat.
- **Falsified, but one of the six failed:** the kill is unsafe. Re-run cleanly. A bad test that says "no" is no more useful than a bad test that says "yes."
- **Pivot territory:** the test missed threshold, but inside the data lives a specific, falsifiable next hypothesis. State the new hypothesis in the same template. Run a new test. Don't pivot more than twice on the same idea without an external sanity check.

## Anti-patterns

- **Don't move the threshold after the result is in.** Renegotiating the kill criterion to match the number you got is the most common failure mode. Guarantees you'll never kill anything.
- **Don't aggregate failed tests into a "promising trend."** Three failed tests are three failed tests, not a heat-check.
- **Don't validate on vanity metrics.** Impressions, reach, engagement-without-action — none of these tell you whether the value hypothesis holds.
- **Don't re-run hoping for a better day.** If the test was clean, the answer is the answer. Re-running for a better result is gambling.
- **Don't skip the memo.** Unwritten learnings evaporate within a week. Written ones survive into the next milestone.

## Before / after

**Before (narrated rescue of a failed test):**

> "We hit 1.8% sign-up against a 3% target, but engagement on the page was strong and we think with better copy we could get there — let's keep iterating."

**After (honest read):**

> "Pre-registered threshold: 3%. Actual: 1.8%. Sample 412, window 7 days, all six rubric criteria satisfied. Hypothesis falsified. Kill memo filed. Specific pivot candidate: the page got 4× the time-on-page for parents of 5–8-year-olds vs. 1–4. New hypothesis worth testing: same offer, older child segment. New test designed, kill criterion 3%, runs next week."

Same data, two responses. One traps the team on the wrong hill. The other walks them to the right one.
