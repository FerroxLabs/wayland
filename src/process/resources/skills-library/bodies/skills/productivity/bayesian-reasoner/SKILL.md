---
name: bayesian-reasoner
description: |
  Practical Bayesian thinking covering Bayesian updating, base rates, prior probabilities, likelihood ratios, prediction calibration, overcoming base rate neglect, Superforecasting principles from Philip Tetlock, and everyday applications of probabilistic reasoning. Use when the user asks about bayesian reasoner or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "decision-making analysis strategy frameworks"
  category: "productivity"
  subcategory: "methodology-frameworks"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Bayesian Reasoner

## When to Use


## Process

1. **Gather requirements.** Ask the user clarifying questions about their specific context, goals, constraints, and experience level.

2. **Analyze the situation.** Review the information provided and identify key factors, challenges, and opportunities relevant to bayesian reasoner.

3. **Develop the framework.** Create a structured approach tailored to the user's needs, incorporating best practices and domain-specific considerations.

4. **Deliver actionable output.** Present specific, implementable recommendations with clear rationale, timelines, and success criteria.

5. **Address edge cases.** Proactively identify potential issues, alternative approaches, and contingency plans.

**Use this skill when:**
- User needs guidance on bayesian reasoner
- User asks about bayesian reasoner best practices or techniques
- User wants a structured approach to bayesian reasoner

**Do NOT use this skill when:**
- A more specialized skill exists for the specific subtopic
- The request is outside the scope of bayesian reasoner

## Questions to Ask First

Before applying Bayesian reasoning to any question, clarify:

1. **What question are you trying to answer?** (State it as precisely as possible)
2. **What is your current belief?** (What probability would you assign before looking at new evidence)
3. **What new evidence or information have you encountered?** (What changed)
4. **What is the base rate?** (How common is this in general, before considering specific evidence)
5. **What are the stakes?** (Personal decision, business bet, policy question, forecasting exercise)
6. **How confident do you need to be?** (90% confidence vs. 60% is a very different threshold)
7. **What additional evidence could you gather?** (Is there more information available)

## Bayes' Theorem: The Core Idea

### The Intuitive Version

```
YOUR UPDATED BELIEF = YOUR PRIOR BELIEF x STRENGTH OF NEW EVIDENCE

In plain language:
  What you should believe now depends on:
  1. What you believed before (the prior)
  2. How strongly the new evidence supports or undermines that belief
     (the likelihood ratio)

THE FORMULA:
  P(H|E) = P(E|H) x P(H) / P(E)

  Where:
  P(H|E) = Probability of hypothesis given the evidence (posterior)
  P(E|H) = Probability of seeing this evidence if hypothesis is true
  P(H)   = Probability of hypothesis before evidence (prior)
  P(E)   = Total probability of seeing this evidence

BUT YOU DON'T NEED THE FORMULA FOR EVERYDAY USE.
  The key insight is the PROCESS of updating beliefs incrementally
  based on evidence.
```

### The Practical Version: Odds Form

```
POSTERIOR ODDS = PRIOR ODDS x LIKELIHOOD RATIO

This is much easier to use in practice:

PRIOR ODDS: How likely vs. unlikely before the evidence?
  If you think there's a 1 in 4 chance, odds are 1:3

LIKELIHOOD RATIO: How much more likely is this evidence
  if the hypothesis is true vs. false?
  If the evidence is 5x more likely when the hypothesis is true,
  the likelihood ratio is 5:1

POSTERIOR ODDS: Multiply the two
  1:3 x 5:1 = 5:3, or about 62% probability

EXAMPLE: Medical Test
  Disease prevalence (base rate): 1% -> Prior odds: 1:99
  Test accuracy: 90% true positive, 5% false positive
  Likelihood ratio: 90/5 = 18:1

  You test positive. What's the probability you have the disease?
  Posterior odds: 1:99 x 18:1 = 18:99 = about 15%

  MOST PEOPLE THINK: "The test is 90% accurate and I tested
  positive, so there's a 90% chance I have the disease."

  BAYESIAN ANSWER: About 15%.

  WHY THE DIFFERENCE: The base rate (1%) is very low. Even with
  a good test, most positives in a rare-disease population are
  false positives. This is base rate neglect in action.
```

## Base Rates: The Foundation

### What Base Rates Are

```
A BASE RATE is the general frequency of something occurring
in the relevant population, BEFORE considering any specific
evidence about this particular case.

EXAMPLES:
  "What percentage of startups fail?" (~90%) - base rate for startup failure
  "What percentage of marriages end in divorce?" (~40-50%) - base rate
  "What percentage of job applicants are hired?" (varies, ~2-10%)
  "What percentage of business initiatives achieve their stated goals?" (~30%)
  "What percentage of New Year's resolutions are kept?" (~8%)

WHY BASE RATES MATTER:
  Base rates are your STARTING POINT for any estimate.
  Without them, you're reasoning in a vacuum.

  Before asking "Will THIS startup succeed?", ask
  "What percentage of startups succeed in general?"
  Then adjust based on specific evidence about this startup.
```

### Base Rate Neglect

```
THE MOST COMMON BAYESIAN ERROR:
  Ignoring the base rate and focusing only on the specific case.

CLASSIC EXAMPLE (Kahneman & Tversky):
  "Tom is quiet, organized, detail-oriented, and loves puzzles.
   Is Tom more likely a librarian or a farmer?"

  Most people say librarian, based on the description.

  But: There are ~20x more farmers than librarians in the US.
  Even if the description is more typical of librarians,
  the enormous base rate difference means Tom is still more
  likely to be a farmer.

  Lesson: Your vivid, specific evidence must be weighed
  against the background frequency.

HOW TO OVERCOME BASE RATE NEGLECT:
  1. ALWAYS ask "What's the base rate?" before analyzing specifics
  2. Start your estimate at the base rate
  3. Adjust from the base rate based on specific evidence
  4. The more unusual your specific evidence, the more you can
     adjust -- but never ignore the starting point
  5. When you feel very confident about an unusual claim,
     check: is this because the evidence is strong, or because
     you skipped the base rate?
```

### Finding Base Rates

```
SOURCES FOR BASE RATES:
  - Government statistics (census, labor, health data)
  - Industry reports and benchmarks
  - Academic research (published studies)
  - Your own historical data (if available)
  - Reference class forecasting (what happened in similar situations)

REFERENCE CLASS FORECASTING:
  Instead of estimating from the inside (your plan, your assumptions),
  look at the outside: "What happened when others tried this?"

  Planning a software project? What percentage of similar projects
  were delivered on time? (Hint: about 30%)

  Launching a restaurant? What percentage survive 5 years? (~20%)

  Starting with the reference class and then adjusting for your
  specific advantages/disadvantages is much more accurate than
  building an estimate from scratch.
```

## Practical Bayesian Updating

### The Update Process

```
STEP 1: ESTABLISH YOUR PRIOR
  "Before this new evidence, what did I believe?"
  Express it as a probability: 20%? 50%? 80%?
  Be honest. Write it down BEFORE looking at the evidence.

STEP 2: EVALUATE THE EVIDENCE
  Ask two questions:
  a) If my hypothesis is TRUE, how likely is this evidence?
  b) If my hypothesis is FALSE, how likely is this evidence?

  The ratio of (a) to (b) is your likelihood ratio.

STEP 3: UPDATE
  Combine prior and evidence to form posterior belief.
  If evidence is 3x more likely under your hypothesis:
    moderate update toward the hypothesis
  If evidence is 10x more likely under your hypothesis:
    strong update toward the hypothesis
  If evidence is equally likely either way:
    no update (evidence is uninformative)

STEP 4: THE NEW PRIOR
  Your posterior becomes the new prior for the next piece of evidence.
  Repeat the process with each new data point.

EXAMPLE: Evaluating a Job Candidate

  Prior: 30% chance this candidate is a strong fit
  (base rate for candidates who pass phone screen)

  Evidence 1: Strong technical interview performance
  Likelihood ratio: 4:1 (strong performers are 4x more likely
  to be strong fits than weak fits)
  Updated: 30% -> ~63%

  Evidence 2: Previous company is known for rigorous hiring
  Likelihood ratio: 2:1
  Updated: 63% -> ~77%

  Evidence 3: Reference check was lukewarm
  Likelihood ratio: 1:3 (lukewarm references are 3x more likely
  for weak fits)
  Updated: 77% -> ~53%

  Each piece of evidence shifts the probability incrementally.
```

### Rules of Thumb for Updating

```
STRENGTH OF EVIDENCE AND HOW MUCH TO UPDATE:

  Likelihood Ratio 1:1    -> No update (evidence is meaningless)
  Likelihood Ratio 2:1    -> Modest update
  Likelihood Ratio 5:1    -> Significant update
  Likelihood Ratio 10:1   -> Strong update
  Likelihood Ratio 20:1+  -> Very strong update (but still not certainty)

COMMON UPDATING MISTAKES:

  1. UPDATING TOO MUCH ON WEAK EVIDENCE
     A single anecdote should barely move your belief.
     A rigorous study should move it significantly.

  2. NOT UPDATING ENOUGH ON STRONG EVIDENCE
     If you believed something at 20% and overwhelming evidence
     arrives, update to 80%+. Don't cling to the prior.

  3. TREATING CORRELATED EVIDENCE AS INDEPENDENT
     10 news articles about the same study are NOT 10 independent
     pieces of evidence. They're one piece of evidence repeated.

  4. ASYMMETRIC UPDATING
     Updating eagerly on confirming evidence but reluctantly on
     disconfirming evidence. Track this tendency in your decision
     journal.

  5. ANCHORING ON EXTREME PRIORS
     If your prior is 1% or 99%, almost no evidence can move it
     significantly. Check: are you justified in being that certain?
```

## Prediction Calibration

### What Calibration Means

```
CALIBRATION: Your stated confidence levels match your actual
accuracy rates.

A well-calibrated person:
  - Of things they say they're 90% sure about, they're right ~90% of the time
  - Of things they say they're 60% sure about, they're right ~60% of the time
  - Of things they say they're 50% sure about, they're right ~50% of the time

MOST PEOPLE ARE OVERCONFIDENT:
  When people say they're 90% sure, they're right about 70% of the time.
  When people say they're 99% sure, they're right about 85% of the time.

CALIBRATION CHART:
  Stated Confidence  |  Typical Accuracy  |  Well-Calibrated
  50%                |  50-60%            |  50%
  60%                |  55-65%            |  60%
  70%                |  60-75%            |  70%
  80%                |  65-80%            |  80%
  90%                |  70-85%            |  90%
  95%                |  75-90%            |  95%
  99%                |  80-95%            |  99%
```

### How to Improve Calibration

```
EXERCISE: CALIBRATION TRAINING

  1. Make predictions with confidence intervals
     "I'm 90% sure the answer is between X and Y"
     The interval should be wide enough that you're right 90% of the time

  2. Track your predictions over time
     After 100 predictions at 80% confidence, were you right ~80 times?

  3. Adjust your confidence levels
     If your 90% predictions are only right 70% of the time,
     you need to widen your intervals or lower your stated confidence

THE CONFIDENCE CALIBRATION FRAMEWORK:
  50% = "I genuinely don't know. It's a coin flip."
  60% = "I have a slight lean, but I could easily be wrong"
  70% = "I'd bet on it if the stakes were low"
  80% = "I'd be surprised to be wrong, but it happens"
  90% = "I'd be very surprised. Strong evidence would be needed"
  95% = "I'd need to see extraordinary evidence to change my mind"
  99% = "I'd stake my reputation on this"

  VERY FEW BELIEFS SHOULD BE AT 99%. Reserve this for
  mathematical truths, direct observations, and well-established
  scientific consensus.
```

## Superforecasting (Philip Tetlock's Research)

### What Makes a Superforecaster

```
TETLOCK'S RESEARCH:
  The Good Judgment Project tracked thousands of forecasters
  making predictions about geopolitical and economic events.
  The top 2% ("superforecasters") consistently outperformed
  intelligence analysts with access to classified data.

TRAITS OF SUPERFORECASTERS:

1. ACTIVELY OPEN-MINDED
   Genuinely consider opposing viewpoints
   Treat beliefs as hypotheses to test, not identities to defend
   Say "I was wrong" easily and frequently

2. GRANULAR PROBABILISTIC THINKING
   Don't say "probably" -- say "70%"
   Distinguish between 60% and 65% confidence
   Update incrementally (not just flip between "yes" and "no")

3. START WITH THE OUTSIDE VIEW
   Begin with base rates and reference classes
   Then adjust for specific factors (inside view)
   Blend both perspectives

4. UPDATE FREQUENTLY
   Don't "set and overlook" predictions
   Actively seek new information
   Adjust beliefs in response to new evidence

5. SKILLED AT DECOMPOSITION
   Break complex questions into sub-questions
   Estimate each component, then combine
   "Will X happen?" becomes "For X to happen, A and B and C
    must all be true. What's the probability of each?"

6. BALANCE UNDER- AND OVERCONFIDENCE
   Well-calibrated: their confidence matches their accuracy
   Neither timid (everything is 50/50) nor overconfident (everything is 90%)

7. WORK IN TEAMS EFFECTIVELY
   Share reasoning, not just conclusions
   Constructively challenge each other
   Synthesize diverse perspectives

8. COMMITMENT TO SELF-IMPROVEMENT
   Track predictions and outcomes
   Analyze why they were right or wrong
   Continuously refine their process
```

### The Superforecasting Process

```
STEP 1: DEFINE THE QUESTION PRECISELY
  Bad: "Will the economy do well?"
  Good: "Will US GDP growth exceed 2.5% in 2026?"
  The question must be specific, measurable, and time-bounded.

STEP 2: START WITH THE OUTSIDE VIEW
  "What is the base rate for this type of event?"
  "What happened in similar historical situations?"
  Start your estimate from this reference class.

STEP 3: DECOMPOSE THE QUESTION
  Break it into sub-questions you can estimate independently.
  "For GDP to exceed 2.5%, what conditions must hold?"
  - Consumer spending growth (probability estimate)
  - Business investment growth (probability estimate)
  - No major shocks (probability estimate)
  - Federal Reserve policy (probability estimate)

STEP 4: CONSIDER MULTIPLE PERSPECTIVES
  What does the bull case look like?
  What does the bear case look like?
  What would a domain expert say? An outsider?

STEP 5: SYNTHESIZE INTO A PROBABILITY
  Combine your estimates into a single number.
  Express it precisely: 67%, not "likely."

STEP 6: UPDATE AS NEW INFORMATION ARRIVES
  Set review dates. Actively seek disconfirming evidence.
  When you update, record why: what new evidence shifted you?

STEP 7: REVIEW AFTER RESOLUTION
  Was the outcome consistent with your probability?
  Was your reasoning sound?
  What would you do differently?
```

## Everyday Bayesian Applications

```
MEDICAL DECISIONS:
  Doctor says: "The test was positive."
  Bayesian question: "What's the base rate of this condition?
  What's the false positive rate of this test?"
  Often, a positive test for a rare condition is still more
  likely to be a false positive than a true positive.

HIRING:
  "This candidate has an amazing resume."
  Bayesian question: "What percentage of people with amazing
  resumes actually succeed in this role?"
  Base rate of hiring success, adjusted for resume quality.

BUSINESS DECISIONS:
  "Our new feature should increase retention."
  Bayesian question: "What percentage of new features actually
  increase retention measurably? What evidence do we have that
  this specific feature will?"
  Start with the base rate for feature impact, then adjust.

INVESTING:
  "This stock/company looks promising."
  Bayesian question: "What percentage of stocks that 'look
  promising' actually outperform? What specific evidence makes
  this different from the base rate?"

PERSONAL RELATIONSHIPS:
  "I think they're upset with me."
  Bayesian question: "How often are people actually upset vs.
  just having a bad day? What specific evidence do I have?"
  The base rate of 'your friend is upset with you' is much lower
  than anxiety suggests.
```

## Common Bayesian Reasoning Errors

```
1. IGNORING BASE RATES
   Focusing on vivid specific evidence while ignoring
   how common something is in general.

2. TREATING ABSENCE OF EVIDENCE AS EVIDENCE OF ABSENCE
   "We haven't found evidence of X, so X doesn't exist."
   Depends: Did you look thoroughly? Would evidence be visible if X existed?

3. CONFUSING P(E|H) WITH P(H|E)
   P(symptom | disease) is NOT the same as P(disease | symptom)
   "90% of people with this disease have this symptom" does NOT mean
   "90% of people with this symptom have this disease."

4. CONJUNCTION FALLACY
   Thinking a specific scenario is MORE likely than a general one.
   "Linda is 31, outspoken, and philosophy major" --
   Is she more likely a bank teller, or a bank teller who is
   active in the feminist movement?
   (Bank teller is always more likely -- it includes ALL bank tellers)

5. NARRATIVE BIAS
   A story that makes sense feels more probable than it is.
   "The economy is strong, so the company will grow, so the
   stock will rise" feels more probable than just "the stock
   will rise" -- but it's actually less probable (conjunction).

6. FAILING TO UPDATE ON SURPRISING EVIDENCE
   Evidence that surprises you should change your beliefs the most.
   If something unexpected happens, your model was wrong --
   update accordingly.
```

## Practice Exercises

### Exercise 1: Base Rate Practice
For the next week, before making any prediction or judgment, first estimate the base rate. Write down: "In general, how often does this type of thing happen?"

### Exercise 2: Calibration Game
Write 50 true/false questions about things you're uncertain about. For each, estimate your confidence (50%-99%). Check the answers. Plot your accuracy against your confidence. Where are you miscalibrated?

### Exercise 3: Prediction Tracking
Start a prediction journal. Each week, make 3-5 predictions with probability estimates. Review monthly. Track your accuracy over time.

### Exercise 4: Likelihood Ratio Estimation
Take a recent decision. Identify the key piece of evidence. Estimate: How much more likely was this evidence under the "yes" hypothesis vs. the "no" hypothesis? Did you weight this evidence appropriately?

### Exercise 5: Decomposition Practice
Take a complex question ("Will my startup succeed?"). Break it into 5+ sub-questions. Estimate each independently. Combine them. Compare to your gut feeling about the overall question. Where do they differ?

### Exercise 6: Updating Exercise
Pick a current belief (60-80% confidence). Actively seek one piece of evidence FOR and one AGAINST. After finding each, update your probability. Write down each update and why.


## Output Format

Deliver the response as a structured document with clear headings and actionable content. Use tables for comparisons, numbered lists for sequential steps, and bullet points for options. Include specific examples where applicable.

```
[Bayesian Reasoner deliverable]
1. Context and objectives
2. Analysis or framework
3. Specific recommendations with rationale
4. Action items with timeline
```


## Example

**Input:** "Help me with bayesian reasoner for a mid-size project."

**Output:** A complete bayesian reasoner framework tailored to the specific context, with actionable steps, relevant considerations, and measurable outcomes.


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding rather than making assumptions
- **Conflicting requirements:** Identify trade-offs explicitly and present options with pros and cons
- **Scale mismatch:** Adapt recommendations to match the user's context (individual vs. team vs. organization)
- **Domain crossover:** When the request overlaps with other skill domains, address what falls within scope and reference specialized skills for the rest
