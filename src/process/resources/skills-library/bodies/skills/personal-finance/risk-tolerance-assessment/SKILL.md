---
name: risk-tolerance-assessment
description: |
  Guides the user through a structured questionnaire to identify their investment
  risk tolerance based on time horizon, income stability, financial cushion, and
  emotional response to portfolio fluctuations. Produces a risk profile
  classification from conservative to aggressive.
  Use when the user asks about their risk tolerance, wants to assess how much
  investment risk they can handle, or needs a risk profile before building a
  portfolio allocation.
  Do NOT use for choosing specific investments (use portfolio-allocation-framework),
  understanding account types (use investment-account-types), or calculating
  retirement targets (use retirement-savings-calculator).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "investing personal-finance analysis planning"
  category: "personal-finance"
  subcategory: "investing"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "beginner"
---
# Risk Tolerance Assessment

> **Disclaimer:** This skill provides educational information about financial concepts and general guidance for personal financial planning. It does NOT constitute financial advice, investment recommendations, or tax guidance. Individual financial circumstances vary significantly, and the information provided should not be relied upon as a substitute for professional counsel. Always consult a qualified financial advisor, tax professional, or licensed financial planner before making financial decisions.

---

## When to Use

**Use this skill when:**
- A user explicitly asks to assess, understand, or quantify their investment risk tolerance before making portfolio decisions
- A user is starting their investing journey and needs a structured framework to understand where they fall on the risk spectrum before choosing asset allocations
- A user questions whether their current portfolio matches their actual risk comfort level (for example, they feel anxious about their holdings or feel underinvested for their goals)
- A user has experienced a major life event -- job change, inheritance, divorce, retirement, having children -- and needs to reassess whether their existing risk profile still applies
- A user has two components of risk in tension ("I know I should be aggressive but I panic when markets drop") and needs a structured way to understand the capacity vs. willingness distinction
- A user explicitly describes themselves using risk language ("I think I'm moderate," "I'm pretty conservative," "I can handle volatility") and needs to verify that self-description against a structured framework
- A user is preparing to use the `portfolio-allocation-framework` skill and needs a validated risk profile as an input

**Do NOT use this skill when:**
- The user already has a confirmed risk profile and wants to apply it to specific holdings -- use `portfolio-allocation-framework` instead
- The user wants to choose between specific securities, funds, or ETFs -- that is an investment selection question, not a risk profile question
- The user is asking about tax-advantaged account types (401k, IRA, Roth IRA) or which account to use -- use `investment-account-types` instead
- The user is calculating how much money they need for retirement -- use `retirement-savings-calculator` instead, then return here if a risk profile is needed as an input
- The user is discussing business risk, credit risk, or insurance risk -- this skill covers personal investment portfolio risk only
- The user is asking about risk in the context of an emergency fund or short-term savings -- money needed within 12-24 months should not be in risk assets regardless of profile; direct them toward liquidity planning
- The user is asking about risk management for a business or employer-sponsored plan as a fiduciary -- that is an institutional question requiring professional advisory services

---

## Process

### Step 1: Orient the User With a Precise Explanation of Risk Tolerance

Before asking a single question, establish shared vocabulary. This prevents the user from answering based on misunderstanding.

- Define **risk tolerance** precisely: it is the degree of variability in investment returns -- including temporary or permanent loss of principal -- that an individual can sustain without abandoning their investment strategy or suffering meaningful psychological harm.
- Distinguish the two components that almost every serious practitioner separates:
  - **Risk capacity** -- the objective, financial dimension. How much loss can your balance sheet actually absorb without disrupting your life goals? This is determined by time horizon, income stability, liquidity, and the size of the investment relative to total net worth.
  - **Risk willingness** -- the subjective, behavioral dimension. How much volatility can you emotionally withstand without making panic-driven decisions that permanently impair your returns? This is determined by past behavior, emotional responses to hypothetical scenarios, and knowledge level.
- Explain the crucial asymmetry: the BINDING constraint between capacity and willingness is whichever is LOWER. A person with 30-year time horizon and high capacity who panics and sells at every correction will achieve worse outcomes than a truly moderate investor who stays the course. The famous research on investor behavior (the gap between fund returns and investor returns, frequently measured at 1-2% annually) is almost entirely caused by willingness-capacity mismatches.
- State clearly that this assessment produces a starting profile, not a permanent label. Risk tolerance is dynamic -- it typically decreases approaching retirement, after experiencing actual large losses, or when income becomes less stable.

### Step 2: Establish Context Before the Questionnaire

Gather brief contextual information that will help interpret ambiguous answers and provide personalized commentary in the final results. Ask these as a brief preamble, not scored questions:

- Approximate age bracket (20s, 30s, 40s, 50s, 60+) -- this contextualizes time horizon answers
- Whether the investment under discussion is for a specific goal (retirement, home purchase, college, general wealth building) -- different goals warrant separate assessments
- Whether the user has invested before and experienced a real market downturn -- prior experience with actual losses is one of the strongest predictors of true willingness; self-reported willingness from someone who has never experienced a 30-40% portfolio decline is systematically overstated
- Whether they are assessing solo or as part of a couple -- if a couple, both partners should respond independently before comparing results

### Step 3: Administer the 10-Question Scored Assessment

Present questions one at a time or in clear grouped sections. Record every answer before scoring. Do not reveal interim scores because it can anchor subsequent answers.

**Category A -- Time Horizon and Liquidity Dependency (Questions 1-3)**
This category captures how long losses can be left to recover and whether the portfolio is the person's primary financial safety net. Maximum category score: 12.

Q1. **Primary time horizon:** When do you need to access the majority of this money?
- (a) Fewer than 3 years -- Score: 1 *(capital must be protected; volatility is unacceptable because there is insufficient time to recover)*
- (b) 3 to 7 years -- Score: 2 *(moderate losses possible but significant downturns could meaningfully impair the goal)*
- (c) 8 to 15 years -- Score: 3 *(can absorb a major correction with time for recovery)*
- (d) More than 15 years -- Score: 4 *(historically, any diversified equity portfolio has recovered within this window, including from the Great Depression and 2008-2009)*

Q2. **Withdrawal pattern:** When you begin using this money, how will you draw it down?
- (a) I will need most or all of it within 1-2 years of accessing it -- Score: 1
- (b) I will draw it down over roughly 5-10 years -- Score: 2
- (c) I will draw it down over 10-20 years (typical retirement drawdown) -- Score: 3
- (d) I will draw it gradually over 20+ years and the remainder may be inherited -- Score: 4

*Note: A 30-year time horizon to retirement but a lump-sum withdrawal pattern (e.g., buying a home) collapses the effective time horizon. Q2 corrects for this.*

Q3. **Financial redundancy:** If this portfolio dropped 35% today and stayed there for 3 years, could you fund your essential goals from other sources?
- (a) No -- this is my primary or only significant financial asset -- Score: 1
- (b) Partially -- I have some other savings but would be forced to delay or reduce goals -- Score: 2
- (c) Yes, mostly -- I have other savings, income, or resources to cover essential needs -- Score: 3
- (d) Yes, completely -- this portfolio is a fraction of my total net worth -- Score: 4

**Category B -- Financial Stability and Cushion (Questions 4-5)**
This category assesses the strength of the financial foundation surrounding the portfolio. Maximum category score: 8.

Q4. **Income stability:** Which best describes your current employment and income situation?
- (a) Highly variable or uncertain -- freelance, commission-only, contract work without renewal certainty, recently started a business -- Score: 1
- (b) Somewhat variable -- significant bonus dependency, seasonal work, or employment in a cyclical or volatile industry -- Score: 2
- (c) Generally stable with some uncertainty -- salaried employee in a sector with occasional layoffs, or self-employed with established, recurring client base -- Score: 3
- (d) Very stable -- long-tenured employment, government or academic position, multiple independent income streams, or retired with predictable pension/Social Security income -- Score: 4

Q5. **Emergency fund depth:** How many months of your total living expenses could you fund from liquid, accessible savings (excluding this investment portfolio)?
- (a) Fewer than 2 months -- Score: 1 *(critically undercushioned; any disruption forces portfolio liquidation)*
- (b) 2 to 3 months -- Score: 2 *(below the standard 3-6 month guideline; limited buffer)*
- (c) 3 to 6 months -- Score: 3 *(meets the standard guidance for emergency reserves)*
- (d) More than 6 months or significant other liquid assets -- Score: 4 *(substantial cushion; portfolio does not need to serve an emergency role)*

**Category C -- Emotional and Behavioral Response (Questions 6-8)**
This is the willingness dimension. Behavioral finance research consistently shows that self-reported emotional tolerance overpredicts actual behavior. Present concrete dollar scenarios wherever possible to make responses more accurate. Maximum category score: 12.

Q6. **Behavioral response to a sharp decline:** Imagine you invested $50,000 and within three months it dropped to $37,500 -- a 25% loss. Markets are uncertain and recovery timeline is unknown. What would you most likely do?
- (a) Sell the entire position to stop further losses and wait on the sidelines -- Score: 1
- (b) Sell a portion to reduce exposure and feel more secure -- Score: 2
- (c) Hold your current position and wait for recovery without making changes -- Score: 3
- (d) Invest additional money at the lower prices (dollar-cost average into the decline) -- Score: 4

*Note: If the user has been through a real crash (2008-2009, March 2020), ask what they actually did rather than what they would hypothetically do. Actual past behavior is far more predictive than hypothetical response.*

Q7. **Monitoring frequency as a behavioral proxy:** How often do you check your portfolio balances during normal (non-crisis) market conditions?
- (a) Daily or multiple times per day -- Score: 1 *(high-frequency checking correlates strongly with reactive selling; this is a behavioral red flag)*
- (b) Several times per week -- Score: 2
- (c) Roughly once a month -- Score: 3
- (d) Quarterly or less, or only when rebalancing -- Score: 4 *(associated with significantly better long-term investor returns)*

Q8. **Loss aversion calibration:** Which statement best captures your emotional relationship with investment losses?
- (a) Even modest losses cause me significant anxiety; I find it very hard to hold through any drawdown -- Score: 1 *(high loss aversion; corresponds to the behavioral finance finding that losses feel roughly 2x as painful as equivalent gains feel good)*
- (b) Small losses are tolerable, but a drop of 15% or more would cause meaningful stress and make me question my strategy -- Score: 2
- (c) I understand losses are part of investing; I feel uncomfortable during downturns but stay focused on long-term results -- Score: 3
- (d) Market declines don't affect me emotionally; I view them as normal and even as opportunity -- Score: 4 *(honest score 4 responses are rare; verify with Q6 for consistency)*

**Category D -- Knowledge, Experience, and Investment Goals (Questions 9-10)**
Investment knowledge reduces panic during volatility because the investor understands WHY prices fluctuate and that fluctuation is not evidence of permanent impairment. Maximum category score: 8.

Q9. **Investment literacy:** How would you honestly describe your understanding of how capital markets and investment products work?
- (a) Very limited -- I am new to investing and do not yet understand the basics of stocks, bonds, or diversification -- Score: 1
- (b) Basic -- I understand that stocks can grow but also lose value, and that bonds are generally more stable, but I do not understand asset allocation, volatility, or how portfolio construction works -- Score: 2
- (c) Intermediate -- I understand asset classes, diversification, the risk-return tradeoff, and the general effect of time horizon on appropriate risk levels -- Score: 3
- (d) Advanced -- I understand portfolio theory including correlation, standard deviation as a measure of volatility, factor investing, and how market cycles typically behave -- Score: 4

Q10. **Goal orientation:** What best describes your primary financial goal for this money?
- (a) Preserve what I have -- I am not trying to grow it significantly; avoiding loss is my top priority -- Score: 1
- (b) Generate modest, stable growth with income; I prefer predictability over maximum return -- Score: 2
- (c) Grow my wealth over time meaningfully; I understand that achieving this requires tolerating periodic significant fluctuations of 20-30% -- Score: 3
- (d) Maximize long-term wealth accumulation; I am explicitly willing to tolerate 40-50%+ drawdowns in pursuit of the highest achievable long-term return -- Score: 4

### Step 4: Score the Assessment

Sum all 10 responses (range: 10 to 40).

Separately calculate:
- **Capacity score** = Q1 + Q2 + Q3 + Q4 + Q5 (maximum 20) -- represents financial ability to sustain losses
- **Willingness score** = Q6 + Q7 + Q8 + Q9 + Q10 (maximum 20) -- represents emotional and behavioral tolerance

The overall risk profile is determined by the total score. The capacity/willingness split is analyzed separately in Step 5.

### Step 5: Map Total Score to a Risk Profile Tier

| Score Range | Profile | Core Characteristic |
|-------------|---------|---------------------|
| 10 -- 16 | **Conservative** | Capital preservation is the primary objective; principal protection outweighs growth |
| 17 -- 22 | **Moderately Conservative** | Modest growth acceptable; stability and income prioritized over appreciation |
| 23 -- 29 | **Moderate** | Balanced between growth and stability; accepts periodic significant fluctuations |
| 30 -- 35 | **Moderately Aggressive** | Growth-focused; comfortable with substantial short-term volatility |
| 36 -- 40 | **Aggressive** | Maximum long-term growth; willing to sustain severe drawdowns without altering course |

**Profile Characteristics to communicate:**

**Conservative (10-16):** The portfolio's primary job is to not lose money. Even inflation-beating growth is secondary. This investor experiences significant stress from any portfolio decline and likely needs to see stability to remain invested. Typical suitable portfolio construction emphasizes short-duration bonds, CDs, money market instruments, and Treasury securities, with a small equity allocation if time horizon warrants. The critical risk for Conservative investors is NOT portfolio volatility -- it is inflation erosion of purchasing power over multi-decade periods.

**Moderately Conservative (17-22):** Accepts modest fluctuations to achieve returns above pure cash or bonds, but comfort collapses at drawdowns beyond roughly 10-12%. This investor prioritizes income generation alongside modest appreciation. Dividend-paying equities and balanced funds fit this profile. The primary tension is accepting enough risk to outpace inflation without triggering the behavioral responses that crystallize losses.

**Moderate (23-29):** The most common profile among long-term investors aged 35-55. Accepts that portfolios will periodically decline 20-30% and can sustain those drawdowns without panic-selling if they understand the recovery pattern. This investor benefits from rules-based rebalancing to prevent emotional override during corrections. The classic 60% equity / 40% bond allocation was designed around this profile, though its appropriateness has evolved with changing fixed-income yields.

**Moderately Aggressive (30-35):** Growth-oriented with genuine ability to hold through major corrections. This investor has a long time horizon, stable income, substantial emergency fund, and a track record (or strong evidence) of non-reactive behavior. Portfolios are predominantly equity-weighted with broad global diversification. The primary risk is overconfidence -- this investor may not have been tested by a severe multi-year bear market.

**Aggressive (36-40):** Genuine aggressive profiles are rare and require all conditions to align: long time horizon (15+ years), high income stability, large emergency fund, substantial investment knowledge, low reliance on this portfolio, and demonstrated behavioral composure during past drawdowns. Total equity portfolios -- including international, small-cap, and emerging market exposures -- are appropriate. This investor must genuinely understand that a 50-60% drawdown (as occurred in 2000-2002 and 2007-2009) is possible and can last multiple years.

### Step 6: Analyze Capacity vs. Willingness and Flag Mismatches

This analysis produces the most actionable insight from the entire assessment. Do not skip it.

- Calculate the raw difference: |Capacity score -- Willingness score|
- A difference of **0-3 points** indicates good alignment; the total score profile is reliable
- A difference of **4-6 points** indicates moderate misalignment; note it and recommend the user weight toward the LOWER of the two scores
- A difference of **7+ points** is a significant mismatch that must be explicitly flagged and discussed

**Interpreting the mismatch direction:**

*High Capacity, Low Willingness (Capacity score significantly exceeds Willingness score):*
The user's financial situation CAN support more risk than they are emotionally comfortable with. This is extremely common and is a completely valid position. The correct response is NOT to push the user toward their capacity level. Emotional discomfort that triggers reactive selling destroys more value than a conservatively positioned portfolio. The user should invest at their willingness level and potentially work toward closing the gap through education and gradual exposure. Frame this as: "Your finances could support a more aggressive approach, but your emotional comfort is the binding constraint -- and that is a legitimate constraint."

*High Willingness, Low Capacity (Willingness score significantly exceeds Capacity score):*
This is the more dangerous mismatch. The user WANTS to take more risk than their situation can actually sustain. Examples: a freelancer with no emergency fund who wants to invest aggressively, or someone with a 3-year goal horizon who selected aggressive answers because they feel comfortable with volatility. This mismatch must be clearly flagged as a potential financial hazard. The user may be forced to liquidate risk assets at the worst possible time -- during a market decline -- due to an income disruption or liquidity need. Recommend addressing capacity weaknesses (build emergency fund, stabilize income) before increasing portfolio risk.

### Step 7: Deliver Results With Contextual Interpretation

Present the full scored results table, the profile classification with its detailed description, the capacity/willingness analysis, and concrete next steps. Tailor the "What This Means for You" commentary to the specific combination of answers -- do not give generic profile descriptions without referencing the user's individual responses.

---

## Output Format

```
## Risk Tolerance Assessment Results

> This assessment is a structured self-reflection tool, not a professional risk evaluation.
> Results should be used as a starting point for conversations with a qualified financial advisor.

---

### Your Responses

| # | Question | Your Answer | Score |
|---|----------|-------------|-------|
| 1 | Time horizon | [answer text] | [1-4] |
| 2 | Withdrawal pattern | [answer text] | [1-4] |
| 3 | Financial redundancy | [answer text] | [1-4] |
| 4 | Income stability | [answer text] | [1-4] |
| 5 | Emergency fund depth | [answer text] | [1-4] |
| 6 | Response to 25% decline | [answer text] | [1-4] |
| 7 | Monitoring frequency | [answer text] | [1-4] |
| 8 | Loss aversion | [answer text] | [1-4] |
| 9 | Investment literacy | [answer text] | [1-4] |
| 10 | Primary goal | [answer text] | [1-4] |

---

### Score Breakdown

| Category | Questions | Your Score | Maximum |
|----------|-----------|------------|---------|
| Time Horizon & Liquidity | Q1-Q3 | [X] | 12 |
| Financial Stability & Cushion | Q4-Q5 | [X] | 8 |
| Emotional & Behavioral Response | Q6-Q8 | [X] | 12 |
| Knowledge & Goal Orientation | Q9-Q10 | [X] | 8 |
| **TOTAL** | **Q1-Q10** | **[X]** | **40** |

---

### Capacity vs. Willingness Split

| Dimension | Questions | Your Score | Maximum | Percentage |
|-----------|-----------|------------|---------|------------|
| Financial Capacity | Q1-Q5 | [X] | 20 | [X]% |
| Emotional Willingness | Q6-Q10 | [X] | 20 | [X]% |
| **Divergence** | | **[|diff|]** | | **[Aligned / Moderate Mismatch / Significant Mismatch]** |

---

### Your Risk Profile: [PROFILE TIER]

**Total Score: [X] / 40**

[2-3 sentence description specific to this profile tier, written in plain language.]

---

### Capacity vs. Willingness Analysis

[Paragraph interpreting the specific divergence. If aligned, confirm reliability of the
profile. If mismatched, explain the direction of the mismatch and what it means.
If capacity > willingness by 7+, explain that emotional comfort is the binding constraint.
If willingness > capacity by 7+, explicitly flag this as a financial risk concern.]

---

### What This Profile Means for Your Situation

Based on your specific answers:

- **Time horizon insight:** [Specific commentary on their Q1/Q2 combination]
- **Financial cushion insight:** [Specific commentary on their Q4/Q5 combination]
- **Behavioral insight:** [Specific commentary on their Q6/Q7/Q8 pattern]
- **Knowledge and goal insight:** [Specific commentary on their Q9/Q10 combination]
- **Key tension or alignment to watch:** [Any notable pattern across all 10 answers]

---

### The Real Risk You Face at This Profile

[Conservative]: At this profile, the primary risk is NOT that your portfolio will decline
dramatically. It is that inflation will erode your purchasing power over time. A portfolio
returning 2-3% annually while inflation runs at 3-4% means your real purchasing power
declines every year.

[Moderately Conservative]: The primary tension is accepting enough return to outpace
inflation without triggering the behavioral responses that lock in losses. Even a small
equity allocation (20-30%) meaningfully improves long-run outcomes if you can remain
invested through corrections.

[Moderate]: The greatest threat to a moderate investor is abandoning a sound strategy
during a significant correction. At this profile, a rules-based rebalancing policy
(rather than discretionary judgment calls) significantly improves outcomes.

[Moderately Aggressive/Aggressive]: The primary risk is overconfidence before having
lived through a severe multi-year bear market. A 40-50% portfolio decline that persists
for 2-3 years tests even the most analytically prepared investors.

---

### Important Notes

- This is a self-assessment snapshot. Risk tolerance changes with age, income,
  family circumstances, and direct experience with market volatility.
- Reassess this profile annually and after any major life event.
- If your capacity and willingness scores diverge significantly, prioritize
  resolving the capacity weakness before increasing portfolio risk.
- Discuss your results with a qualified financial advisor for personalized guidance.

---

### Recommended Next Steps

- [ ] Carry this risk profile into `portfolio-allocation-framework` to explore suitable
      asset allocation ranges
- [ ] If emergency fund is under 3 months, address that before increasing investment risk
- [ ] If this is a joint household, ensure your partner completes this assessment
      independently before comparing results
- [ ] If willingness score significantly exceeded capacity, consider steps to strengthen
      financial capacity before increasing portfolio risk level
- [ ] Revisit this assessment in 12 months or after any of: job change, marriage,
      divorce, birth of child, inheritance, home purchase, or major market event
```

---

## Rules

1. **Never recommend specific investment products, funds, or allocations based on the risk profile output.** The profile is an INPUT to portfolio planning, not a portfolio plan. Statements like "you should put 70% in stocks" are out of scope for this skill -- redirect to `portfolio-allocation-framework`.

2. **Present all 10 questions and record all answers before calculating or revealing any score.** Revealing interim scores anchors subsequent answers and systematically biases results toward whichever direction the user wants to confirm.

3. **Use concrete dollar amounts in emotional response scenarios, not just percentages.** Ask the user to imagine $50,000 dropping to $37,500, not just "a 25% decline." Research in behavioral finance consistently shows that abstract percentages underestimate actual emotional response compared to concrete loss amounts.

4. **Always calculate and report the capacity/willingness split separately from the total score.** This is the single most clinically useful output of the assessment. Burying it inside a total score destroys the signal. A user with a total score of 24 (Moderate) but a capacity of 17 and willingness of 7 has a radically different situation than a user with a capacity of 12 and willingness of 12.

5. **Flag willingness-exceeds-capacity mismatches of 7+ points as a financial hazard, not just a note.** When a user's emotional willingness to take risk exceeds their objective financial capacity by a large margin, they are at risk of forced liquidation during a downturn -- which is the mechanism that converts temporary paper losses into permanent real losses. This must be communicated clearly, not softened.

6. **For users who have never experienced a real market downturn, apply a downward adjustment note to willingness scores.** Self-reported willingness from someone who has never seen their portfolio decline 30-40% systematically overstates actual behavioral tolerance. Flag this explicitly: "Because you have not experienced a major market correction, your willingness score may be somewhat optimistic. Consider starting at a slightly more conservative allocation and adjusting after you have observed your own behavior through a real downturn."

7. **Never conflate time horizon alone with risk tolerance.** A user with a 25-year time horizon who has zero emergency fund, variable freelance income, and severe anxiety about portfolio losses does NOT have a high risk tolerance despite their long horizon. Time horizon is one of five capacity inputs, and willingness can override it entirely.

8. **If the user is assessing risk for multiple goals with different time horizons, run separate assessments for each goal or explicitly note the mismatch.** A single risk profile applied to both a 30-year retirement fund and a 3-year home down payment fund produces the wrong answer for at least one of those goals. The down payment money should be treated as Conservative regardless of the overall profile.

9. **If Q6 and Q8 answers are inconsistent (e.g., Q6 = "buy more at the lower price" but Q8 = "any loss causes significant anxiety"), investigate the discrepancy before finalizing the score.** Ask a clarifying question: "You said you would buy more during a decline, but also that losses cause significant anxiety -- can you help me understand how those two things coexist for you?" Inconsistency often reveals aspiration vs. reality, and the Q8 answer (emotional relationship) is typically more predictive than the behavioral intention in Q6.

10. **Do not present the risk profile as a permanent classification.** Explicitly state that risk tolerance is dynamic. It tends to decrease when: the user ages and approaches the spending phase, income becomes less stable, the user experiences actual significant losses for the first time, family obligations increase, or the user simply becomes more risk-aware through financial education. Annual reassessment or reassessment after major life events is a legitimate standard practice, not an afterthought.

---

## Edge Cases

### User Has Never Invested and Cannot Answer Emotional Questions

When a user has no investing experience, questions about emotional response to a 25% portfolio decline are hypothetical in a way that makes them difficult to answer honestly. Use concrete grounding techniques:

- Reframe Q6 as: "Think about a time you lost $500 or more on something -- maybe a car repair you did not expect, a purchase that did not work out, or a gambling or gaming loss. How did that feel, and what did you do?" The behavioral pattern in familiar loss contexts transfers reasonably well to portfolio behavior.
- For truly novice investors, score Q6, Q7, and Q8 at 2 (moderately conservative default) and note clearly: "Because you have no direct investment experience, your emotional response scores are estimated conservatively. Your actual tolerance will become clearer after you have held a real portfolio through at least one significant downturn. Starting with a profile one tier more conservative than your total score suggests is a reasonable prudential approach."

### Partners or Spouses With Divergent Risk Profiles

This is extremely common and practically important. Do not combine answers or average the scores without highlighting the divergence.

- Run both assessments separately and present both complete profiles.
- If the profiles diverge by one tier (e.g., one Moderate and one Moderately Conservative), a Moderately Conservative joint approach is typically appropriate since the more conservative partner's willingness is the binding constraint for joint financial wellbeing.
- If profiles diverge by two or more tiers, flag this explicitly: "A two-tier difference in risk profiles within a household is meaningful and often a source of financial disagreement. A financial advisor can help you develop a joint investment policy statement that both partners can commit to."
- Note that some households manage this by maintaining separate investment accounts with profiles matched to each individual's tolerance, in addition to a joint account managed at the more conservative profile.

### User's Total Score Is Near a Tier Boundary

Scores that fall within 2-3 points of a tier boundary (e.g., a score of 22 which is near the 17-22 / 23-29 boundary between Moderately Conservative and Moderate) should be treated as a range rather than a single point classification.

- Present the profile the score maps to but note: "Your score places you near the boundary between Moderately Conservative and Moderate. This means you likely have flexibility in either direction and might consider starting at Moderately Conservative and moving toward Moderate as you gain experience or as your financial cushion grows."
- The appropriate response to boundary scores is conservatism: place the user in the lower-risk tier and note the path to moving up.

### User Is Nearing or In Retirement (Decumulation Phase)

The questionnaire was designed primarily for the accumulation phase. Users within 5-10 years of retirement or already in retirement face the sequence-of-returns risk, which fundamentally changes how losses matter. A 30% decline during the first three years of retirement can permanently impair a portfolio even if it eventually recovers, because withdrawals made during the drawdown sell shares at depressed prices.

- Flag this context explicitly: "For investors near or in retirement, the question is not just emotional tolerance for losses -- it is whether a significant early-retirement drawdown would force you to reduce withdrawals or run out of assets. This is called sequence-of-returns risk."
- In this context, capacity should weight more heavily than willingness in the final assessment, and the effective risk profile should lean conservative even if willingness scores are high.
- Suggest that users in this phase consult a financial planner specifically about withdrawal strategy and portfolio glide path, not just asset allocation.

### User Selects the Most Aggressive Answer to Every Question (Score of 40)

A perfect aggressive score of 40 is an extreme result that should be validated, not simply accepted.

- Check for internal consistency: If the user answered Q4 as "highly variable income" (score 1) but achieved 40 overall, the score is impossible and something is miscalculated.
- If genuinely achieved, note: "A score of 40 represents a maximally aggressive profile. This is appropriate only when: your time horizon exceeds 15 years, you have 6+ months of emergency reserves entirely separate from this portfolio, you have very stable income or your portfolio represents a small fraction of your total net worth, AND you have direct experience holding through at least one major market drawdown without selling. If all these conditions are true, the score is valid. If any are not, revisit those specific questions."
- Flag the behavioral research: people frequently overestimate their loss tolerance before experiencing a severe drawdown. The 2008-2009 financial crisis produced widespread panic selling from investors who had described themselves as aggressive.

### User Is Assessing Risk for a Windfall or Inheritance

An inheritance or one-time windfall creates a unique psychological context. Research consistently shows that people are more loss-averse with windfall money than with earned income, perceiving inherited wealth as "not really theirs to lose." This psychological dynamic can cause willingness scores to understate actual long-term behavioral tolerance.

- Flag this context: "Money received as an inheritance or windfall often triggers higher loss aversion than earned income, even when the financial situation is identical. Your willingness scores for inherited funds may be somewhat lower than they would be for money you accumulated yourself."
- Suggest a staged deployment approach: rather than investing the full windfall immediately at whatever risk profile the assessment produces, a 6-12 month systematic investment program can reduce the regret risk of a poorly-timed lump-sum investment and give the investor time to calibrate their actual emotional response to portfolio fluctuations.
- If the user explicitly says they are "afraid to lose the inheritance," score Q8 as 1 regardless of their selected answer, as this statement is direct behavioral evidence of high loss aversion.

### User Asks to Skip Questions or Says "Just Tell Me My Profile"

Some users will resist the questionnaire and want an immediate classification. Do not comply with this.

- Explain briefly why skipping questions produces unreliable results: "Each question captures a distinct dimension of risk tolerance that the others cannot substitute for. A high time-horizon answer does not tell us about your emergency fund, and a stable-income answer does not tell us about your emotional response to losses. Skipping questions produces a profile that may not reflect your actual situation."
- If the user is truly resistant, offer to run an abbreviated 5-question version (Q1, Q3, Q5, Q6, Q8 -- one from each key dimension), but be explicit that this produces a less reliable result and the output should be validated against the full questionnaire.
- Never assign a risk profile based solely on demographic information (age, income) without the behavioral and emotional dimensions. Age-based rules like "100 minus your age equals equity percentage" are crude heuristics that ignore the willingness dimension entirely.

---

## Example

**Input:** "I want to figure out my risk tolerance before investing. I'm 34, I work as a software engineer at a stable tech company, I've got about 8 months of emergency savings, and I'm investing for retirement about 31 years away. I've been investing for about 4 years. I went through COVID in March 2020 and actually bought more during the crash."

**Output:**

Great -- you have given me several useful context signals already. Let me run through all 10 questions with you, and I will note where your context informs the answers. I am recording all answers before calculating the score.

---

**Context noted:**
- Age 34 -- long accumulation runway ahead
- Software engineer, stable employer -- strong capacity signal
- 8 months emergency fund -- above the 6-month threshold
- 31-year retirement horizon
- 4 years of investment experience including March 2020 -- this is genuinely significant; you have behavioral data from a real crash

Let me work through the remaining questions. Based on what you have shared, I can pre-fill some answers for confirmation:

---

**Q1 -- Time horizon:** You said 31 years until retirement.
→ **(d) More than 15 years -- Score: 4** ✓ Please confirm.

**Q2 -- Withdrawal pattern:** For retirement savings, how do you plan to draw this down?
*(Typical answer is over 20-30 years of retirement spending)*
→ **Please select:** All at once / Over 5-10 years / Over 10-20 years / Gradually over 20+ years

**User response:** Gradually over 20+ years.
→ **(d) Gradually over 20+ years -- Score: 4**

**Q3 -- Financial redundancy:** If this portfolio dropped 35% today and stayed there for 3 years, could you fund your essential goals from other sources?
→ **Please select:** No, this is primary / Partially / Yes, mostly / Yes, completely

**User response:** Yes, mostly -- I have the emergency fund and my income would continue.
→ **(c) Significant other resources -- Score: 3**

**Q4 -- Income stability:** You said you are a software engineer at a stable tech company.
→ **(c) Generally stable with some uncertainty** *(tech layoffs do occur)* **-- Score: 3**

*Note: I am scoring this as 3 rather than 4 because tech employment, while well-compensated, has experienced notable layoff cycles. If you have been at this company 5+ years and feel your position is very secure, this could be scored as 4. Please confirm which feels more accurate.*

**User response:** Yeah, there have been layoffs at my company before -- 3 feels right.
→ **Score: 3 confirmed**

**Q5 -- Emergency fund:** You said 8 months.
→ **(d) More than 6 months -- Score: 4** ✓ Confirmed.

**Q6 -- Response to a 25% decline:** You said you actually bought more during March 2020 when your portfolio was declining. This is the most reliable possible answer to this question -- actual behavior during a real crash.
→ **(d) Bought more at lower prices -- Score: 4** ✓

**Q7 -- Monitoring frequency:** How often do you typically check your portfolio balance?
→ **Please select:** Daily / Several times per week / About once a month / Quarterly or less

**User response:** About once a month, maybe less.
→ **(c) Monthly -- Score: 3**

**Q8 -- Loss aversion:** Which statement fits you?
→ **Please select:** Any loss causes significant anxiety / Small losses fine, large drops stressful / Accept losses, focus on long-term / Losses don't affect me emotionally

**User response:** Honestly, I feel a little uncomfortable during big drops but I stay focused on the long term. The third one.
→ **(c) Accept losses, focus on long-term results -- Score: 3**

**Q9 -- Investment literacy:** How would you describe your knowledge level?
→ **Please select:** Very limited / Basic / Intermediate / Advanced

**User response:** Intermediate -- I understand diversification and why I'm holding index funds, but I wouldn't say I'm into portfolio theory.
→ **(c) Intermediate -- Score: 3**

**Q10 -- Primary goal:** What is your primary goal for this money?
→ **Please select:** Preserve capital / Modest stable growth / Grow meaningfully with moderate fluctuations / Maximize long-term growth accepting large drawdowns

**User response:** Grow meaningfully -- I'm not trying to preserve capital, I'm trying to build wealth.
→ **(c) Grow meaningfully over time -- Score: 3**

---

## Risk Tolerance Assessment Results

> This assessment is a structured self-reflection tool, not a professional risk evaluation.
> Results should be used as a starting point for conversations with a qualified financial advisor.

---

### Your Responses

| # | Question | Your Answer | Score |
|---|----------|-------------|-------|
| 1 | Time horizon | More than 15 years (31 years) | 4 |
| 2 | Withdrawal pattern | Gradually over 20+ years | 4 |
| 3 | Financial redundancy | Significant other resources | 3 |
| 4 | Income stability | Generally stable, some uncertainty (tech) | 3 |
| 5 | Emergency fund depth | More than 6 months (8 months) | 4 |
| 6 | Response to 25% decline | Bought more (actual behavior, March 2020) | 4 |
| 7 | Monitoring frequency | Monthly | 3 |
| 8 | Loss aversion | Accept losses, focus on long-term | 3 |
| 9 | Investment literacy | Intermediate | 3 |
| 10 | Primary goal | Grow meaningfully with moderate fluctuations | 3 |

---

### Score Breakdown

| Category | Questions | Your Score | Maximum |
|----------|-----------|------------|---------|
| Time Horizon & Liquidity | Q1-Q3 | 11 | 12 |
| Financial Stability & Cushion | Q4-Q5 | 7 | 8 |
| Emotional & Behavioral Response | Q6-Q8 | 10 | 12 |
| Knowledge & Goal Orientation | Q9-Q10 | 6 | 8 |
| **TOTAL** | **Q1-Q10** | **34** | **40** |

---

### Capacity vs. Willingness Split

| Dimension | Questions | Your Score | Maximum | Percentage |
|-----------|-----------|------------|---------|------------|
| Financial Capacity | Q1-Q5 | 18 | 20 | 90% |
| Emotional Willingness | Q6-Q10 | 16 | 20 | 80% |
| **Divergence** | | **2** | | **Well Aligned** |

---

### Your Risk Profile: MODERATELY AGGRESSIVE

**Total Score: 34 / 40**

You have a strong, well-aligned risk profile. Your financial foundation -- a 31-year time horizon, 8-month emergency fund, and stable professional income -- gives your portfolio the structural capacity to absorb significant short-term volatility. Your emotional profile, supported by actual behavior during the March 2020 crash, confirms that your willingness is close to your capacity. A moderately aggressive profile is well-suited to investors who genuinely prioritize long-term wealth accumulation and can remain invested -- or invest more -- during major market downturns.

---

### Capacity vs. Willingness Analysis

Your capacity score (18/20) and willingness score (16/20) diverge by only 2 points, indicating strong alignment. This means your total score is a reliable signal -- you are not in the common situation where emotional discomfort or financial fragility constrains what your situation could otherwise support. The slight edge of capacity over willingness is healthy: it means your financial situation can support your chosen risk level even if your emotional comfort dips somewhat in a severe downturn.

The strongest signal in your entire assessment is Q6: you did not just say you would buy more during a crash -- you actually did it in March 2020. Actual behavior during real market stress is more predictive than any hypothetical scenario, and your behavior in that event is highly consistent with a Moderately Aggressive profile.

---

### What This Profile Means for Your Situation

- **Time horizon insight:** A 31-year horizon to the start of retirement, followed by a 20+ year gradual drawdown, means your effective investment time horizon exceeds 40 years for a meaningful portion of this portfolio. This is one of the strongest possible arguments for tolerating equity volatility -- historically, every major equity market decline has recovered within this window.
- **Financial cushion insight:** Your 8-month emergency fund is a genuine asset in risk tolerance terms. It means this portfolio does not need to serve as your emergency backstop, which is the primary mechanism through which short-horizon financial fragility forces long-horizon investors to sell risk assets at the worst possible time.
- **Behavioral insight:** Monthly monitoring frequency is healthy -- you are engaged but not compulsively tracking daily price movements, which is associated with much higher rates of reactive trading. Combined with your March 2020 behavior, this suggests your investment psychology is well-calibrated.
- **Knowledge and goal insight:** Intermediate knowledge means you understand WHY you are holding diversified assets and why fluctuations do not represent permanent impairment -- which is the cognitive foundation that makes emotional composure during downturns possible. As your knowledge grows toward advanced, your willingness scores will likely trend upward.
- **Key tension to watch:** Your tech employment score is the only moderate note in an otherwise strong profile. Tech sector layoffs have been cyclical, and a job loss combined with a severe market decline (which often occur together in tech-heavy economic contractions) is the specific scenario where your financial resilience would be most tested. Your 8-month emergency fund is specifically well-positioned to buffer this scenario.

---

### The Real Risk You Face at This Profile

At a Moderately Aggressive profile, the primary risk is not that you will be too conservative -- it is overconfidence before being tested by a severe, prolonged multi-year bear market. March 2020 was a sharp but fast crash (roughly 34% decline, recovery in approximately 5 months). The 2000-2002 dot-com bust and 2007-2009 financial crisis were 50%+ declines that lasted 2-3 years with no clear recovery in sight during the drawdown. Those environments test even analytically prepared investors. Your current profile is well-suited to your situation -- staying consistent with it through a multi-year bear market, should one occur, is the key behavioral challenge ahead.

---

### Important Notes

- This profile snapshot reflects your situation today at age 34. Reassess in your mid-to-late 40s as the balance between accumulation and preservation shifts.
- If you experience a major income disruption -- particularly a tech-sector layoff -- temporarily reconsidering your investment contributions is appropriate, even if your long-term risk profile remains unchanged.
- If you change your primary goal (e.g., targeting a home purchase within 5-7 years), any funds earmarked for that goal should be assessed separately at a much more conservative profile, regardless of your retirement profile.
- Discuss this result with a financial advisor before finalizing any portfolio construction.

---

### Recommended Next Steps

- [x] Carry this Moderately Aggressive risk profile into `portfolio-allocation-framework` to explore suitable equity/bond allocation ranges
- [ ] Consider what a prolonged 2-3 year drawdown of 40-50% would mean for your specific situation -- mentally rehearsing this scenario is more useful than abstract reassurance
- [ ] If your employment stability changes significantly (layoff, career change, starting a company), reassess the capacity dimension of this profile immediately
- [ ] If you plan to purchase a home in the next 5-7 years, run a separate Conservative risk assessment for your down payment savings
- [ ] Revisit this full assessment at age 40 or after any major life event
