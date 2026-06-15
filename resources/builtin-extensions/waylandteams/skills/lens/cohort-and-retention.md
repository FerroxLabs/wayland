As of: 2026-05-16

# cohort-and-retention

**Mode skill.** Default-enabled on the Analyst specialist.

## When to use

Use any time a user asks "are people sticking?", "what does retention look like?", "what's our churn?", "what's the magic moment in the product?", or makes growth claims that ignore the leaky bucket underneath. Use *before* recommending acquisition spend — if retention is broken, acquisition is throwing fuel into a hole.

Trigger phrases:

- "Our retention is bad / good / unclear."
- "We need to grow faster."
- "What's the right LTV assumption?"
- "Should we focus on acquisition or retention?"
- "What's the activation event?"

If a cohort definition and a current retention curve are already in `TEAM_MEMORY.md` under `## Analyst`, skip to step 4.

## Procedure

**1. Define the cohort precisely.** A cohort is a group joined by a shared event in a shared window. Three parts: the *joining event* (signup, first purchase, first paid week), the *window* (week-of, month-of), the *segment* (channel, tier — only if volume supports it). One sentence. Ambiguous cohort definitions ruin every chart downstream.

**2. Build the retention curve, not the rate.** Retention is a curve, not a number. Plot the percentage of the cohort that performed the *retained behavior* in week 1, 2, 4, 8. Shape matters more than level: a curve that flattens shows a stable retained core; one that keeps declining shows there is no core yet. Refuse to report retention as one number — show the curve, or at minimum W1 / W4 / W8 anchors.

**3. Pick the retained behavior on purpose.** "Logged in" is rarely it. The retained behavior is the action that correlates with long-term value — repeated use of the core feature, repeat purchase, paid renewal, content consumed beyond onboarding. If a teammate has not named it, that is the first decision; lock it in `TEAM_MEMORY.md` before computing.

**4. Find the magic moment.** The earliest behavior that, when reached in the first cohort window, predicts long-term retention. Procedure: split the cohort into retained-at-week-8 and not, look backward at early behaviors. The behavior with the largest gap in early-completion rate between the two groups is the candidate. Validate on a second cohort. One cohort proves nothing — magic-moment claims must hold on a hold-out cohort or they are pattern-matched noise.

**5. Check sample at every cut.** Cohorts shrink as you slice. A 1,200-signup cohort cut by channel into four gives 300 each; cut again by tier gives 75. Below 30 retained users in a cell, the curve is noise. Refuse the cut, or aggregate.

**6. Stamp it.** Write cohort definition, retained behavior, curve anchors (W1 / W4 / W8), magic-moment candidate, and cohort sample to `TEAM_MEMORY.md` under `## Analyst`. Product, Channels, and Forge will read this before LTV assumptions, channel payback math, or activation builds.

## Decision rules

- **Curve, not number.** A flat 30% retention at week 8 is healthier than a declining curve passing through 50% at week 2. Show the shape.
- **One cohort is a sample of one.** Magic-moment candidates do not become decisions until a second cohort confirms.
- **Define retention by the value behavior, not the login event.** Logins inflate retention and underweight the build problem.
- **Acquisition spend follows retention, not the other way around.** If week-4 retention is below the threshold the business model requires, acquisition is the wrong investment until the curve fixes.
- **Below-30 cells get aggregated, not interpreted.** "Trending up" on n=18 is not trending.

## Anti-patterns

- Reporting "retention is 40%" with no window. Retention is always retention-at-some-point.
- Using churn as the inverse of retention without defining the time horizon. Monthly churn and annualized churn are not the same number.
- Claiming a magic moment from a single cohort, especially the founder's favorite cohort.
- Defining the retained behavior post-hoc after seeing the curve. Pick the behavior first.
- Cutting cohorts until a cell looks good. Slicing to a flattering segment with n=22 is not analysis.

## Before / after

**Brief:** "What's our retention?"

**Before** (single number, no curve):
> *Our retention is about 35%.*

**After** (definition + curve + magic-moment work):
> *Cohort: signups in week of March 9, 2026. Retained behavior: created ≥1 core artifact. W1 62% (n=910/1,470), W4 38% (n=559), W8 31% (n=456). Flattening between W4 and W8 suggests a retained core forming. Magic-moment candidate: created ≥3 artifacts in first 7 days — 78% W8-retained vs. 19% of those who created fewer. Needs validation on March 16 cohort before any activation build. Stamping to TEAM_MEMORY. Recheck in 8 weeks.*
