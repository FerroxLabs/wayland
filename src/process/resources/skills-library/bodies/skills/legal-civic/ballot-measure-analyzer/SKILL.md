---
name: ballot-measure-analyzer
description: |
  Breaks down ballot measures into plain language, explaining what the measure proposes, who supports and opposes it, the fiscal impact, and how to evaluate the arguments on each side. Teaches users to dissect ballot language, identify stakeholders, and understand fiscal notes without recommending which way to vote.
  Use when the user wants to understand a ballot measure, proposition, or referendum, needs help reading ballot language, or wants to evaluate the fiscal impact of a ballot measure.
  Do NOT use for recommending how to vote, analyzing candidates, interpreting election results, or providing campaign strategy.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "civic-engagement research guide analysis"
  category: "legal-civic"
  subcategory: "civic-engagement"
  depends: ""
  disclaimer: "not-legal-advice"
  difficulty: "beginner"
---
# Ballot Measure Analyzer

> **Disclaimer:** This skill provides civic education and general legal literacy to help you understand ballot measures as a matter of democratic participation. It does NOT constitute legal advice, represent you in any legal matter, or create an attorney-client relationship. Ballot measure law, fiscal rules, and procedural requirements vary significantly by state and locality. Always consult a qualified attorney licensed in your jurisdiction for advice on specific legal matters, and verify current information through official government sources before voting.

---

## When to Use

**Use this skill when:**
- A user has a ballot measure, proposition, initiative, referendum, constitutional amendment, or bond measure in front of them and wants to understand what it actually does -- including when the ballot title or summary language is confusing, circular, or misleading
- A user wants a plain-language translation of the operative legal text of a measure, including the specific statutory or constitutional sections being amended or repealed
- A user wants a structured fiscal impact breakdown, including bond amortization totals, tax rate projections, or funding mechanism explanations that go beyond what the official summary provides
- A user wants to understand who is behind a measure -- financially and organizationally -- and evaluate the credibility and motivations of the arguments made by each campaign
- A user wants to build their own framework for evaluating all the measures on a given ballot, not just one measure in isolation
- A user is a voter guide contributor, civics educator, journalist, or community organizer who needs a structured analysis they can communicate to others
- A user encountered a measure in a prior election cycle and wants to understand its historical context, implementation outcome, or comparison to a new version of the same issue

**Do NOT use when:**
- The user explicitly wants a recommendation on how to vote -- redirect to the evaluation framework and ask which values and priorities are most important to them, but do not express a preference (see Rules)
- The user wants to analyze candidates, their records, or compare candidate positions -- use a candidate research or voter guide skill instead
- The user wants to interpret election results, map outcomes, or understand why a measure passed or failed after the fact -- that is election analytics, not ballot measure education
- The user wants to write political messaging, campaign ads, or persuasion materials for a measure campaign -- that is campaign strategy, not civic education
- The user needs a constitutional law opinion on whether a measure is legally valid, will survive court challenge, or is preempted by federal law -- that requires licensed legal counsel in the relevant jurisdiction
- The user is asking about the process of qualifying a measure for the ballot (signature gathering, petition requirements, certification) -- use a ballot initiative process skill instead
- The user is asking about ranked-choice voting rules, electoral systems, or how votes are counted -- those are election administration topics

---

## Process

### Step 1: Gather the Measure Text and Context

Before any analysis, collect the right raw material. The quality of analysis depends entirely on the quality of input.

- **Ask for the full official text** of the measure, not just the title or summary. Official text is found in the official voter guide (mailed to registered voters or available from the county clerk, city clerk, or Secretary of State), the state legislature's enrolled bill or initiative text, or the local elections office's official ballot materials. A news headline or advocacy group summary is insufficient.
- **Identify the jurisdiction precisely:** state ballot measure, county measure, city/municipality measure, special district measure (water district, school district, fire district), or a regional authority measure. Rules for passage, amendment thresholds, and fiscal analysis requirements differ at each level.
- **Identify the measure type** from the following taxonomy -- this determines the analytical lens:
  - *Initiated statute:* Voters directly enact a law, bypassing the legislature. Can typically be amended by the legislature after a waiting period (often 3-5 years, or requiring a supermajority).
  - *Initiated constitutional amendment:* Voters directly amend the state constitution. Harder to change -- requires another voter approval. Much more consequential than a statute.
  - *Legislative referral (statute):* Legislature placed the measure on the ballot for voter approval. Common for laws requiring voter ratification.
  - *Legislative referral (constitutional amendment):* Legislature proposes a constitutional change; voters must ratify. Requires a supermajority in the legislature (often 60% or two-thirds) before going to voters.
  - *Popular referendum:* Voters are asked to approve or reject a law the legislature already passed. A "yes" vote upholds the law; a "no" vote repeals it -- the opposite framing from most measures.
  - *General obligation bond:* Authorizes government borrowing backed by the full taxing authority. Repaid through property taxes. Often requires a supermajority (55% in California for school bonds; two-thirds in many other states).
  - *Revenue bond:* Authorizes borrowing backed by a specific revenue stream (tolls, utility fees), not general taxes. Different risk profile and typically does not require voter approval in all jurisdictions.
  - *Advisory measure:* Non-binding. The result does not change any law but signals voter opinion to elected officials.
  - *Recall:* Asks whether an elected official should be removed. Different rules apply -- see Edge Cases.
- **Identify the passage threshold:** Most statutes and constitutional amendments require a simple majority (50% + 1). School bonds in California require 55%. Constitutional amendments in some states require 60%. Tax increases in some states (Colorado's TABOR, for example) require specific supermajorities. This is not a minor detail -- a measure polling at 52% support may fail if the threshold is 55%.
- **Note the election date and cycle** -- primary elections, special elections, and off-year elections have dramatically lower turnout, which affects which coalition of voters decides the outcome and is relevant context for the user.

### Step 2: Deconstruct the Official Ballot Title and Summary

The ballot title and summary are written under specific legal constraints and often involve contested political processes. Treat them as legally significant documents, not neutral descriptions.

- **Identify the ballot title:** In most states, the Attorney General or Secretary of State drafts the title using a specific formula. In some states (Oregon, California), the title is drafted by the Attorney General; in others, by a legislative committee; in others, by the measure's proponents subject to state review. Who writes the title matters because it affects framing.
- **Identify the fiscal summary:** Many states require a separate fiscal impact statement drafted by an independent fiscal office (California's Legislative Analyst Office, Colorado's Legislative Council Staff, Oregon's Legislative Revenue Office). These are generally more reliable than campaign-produced estimates. Note if no independent fiscal analysis exists -- it is a significant gap.
- **Check for title challenges:** Major ballot measures are often challenged in court over the accuracy of the ballot title before the election. Knowing whether a title has been contested and revised (or upheld despite challenge) tells you something about its accuracy.
- **Parse the summary for what it omits:** Official summaries have word limits (often 100 words in many states). Identify what substantive provisions of the full text are not reflected in the summary. Voters who read only the summary may not know about sunset clauses, amendment-restriction provisions, or administrative details that have major practical consequences.
- **Check the fiscal note framing:** Does the summary say costs are "unknown" when a reasonable range could be estimated? Does it only show the first-year cost when long-term costs are much higher? Does it include or omit one-time vs. recurring costs?

### Step 3: Analyze the Full Operative Text

This is the core analytical work. Read the actual text, not summaries.

- **Map every operative section** to a plain-language description. Operative sections usually begin with phrases like "Section 1 is amended to read...," "There is hereby appropriated...," or "No person shall...." Each operative section should be translated individually before synthesizing into a summary.
- **Identify the effective date:** Immediate upon passage? January 1 of the following year? Phased in over multiple years (common with tax measures)? Contingent on another event? Delayed effective dates can significantly affect fiscal impact calculations.
- **Identify all defined terms:** Most well-drafted measures include a definitions section. The legal definition of a term may be narrower or broader than its common usage. "Affordable housing," "small business," "firearm," "single-family residence" -- all have specific legal definitions that may surprise users.
- **Identify every government entity affected:** Which agencies are required to take action? Which are prohibited from taking action? Which receive new funding or lose existing funding?
- **Look for these seven structural flags that voters frequently miss:**
  1. *Supermajority lock:* "This measure may only be amended by a two-thirds vote of the legislature" or "may only be amended by a subsequent ballot measure." These are common in initiatives and dramatically limit future flexibility.
  2. *Sunset clause:* "The provisions of this measure shall expire on [date]." If present, note it prominently -- the measure may appear permanent but is actually temporary.
  3. *Appropriation:* Does the measure itself appropriate money, or does it only authorize appropriation subject to future legislative action? The former is a direct fiscal commitment; the latter depends on future political will.
  4. *Preemption clause:* "No local ordinance may conflict with this measure." Preemption removes local government authority on the subject.
  5. *Severability clause:* "If any provision is found unconstitutional, the remaining provisions shall remain in effect." Absence of severability means a court ruling against one provision could invalidate the whole measure.
  6. *Private right of action:* Does the measure allow private citizens to sue for enforcement? This has major implications for litigation costs and enforcement dynamics.
  7. *Enactment contingency:* Is the measure contingent on another measure passing? Some jurisdictions allow measures to be paired, where one only takes effect if the other passes or fails.

### Step 4: Construct the Fiscal Analysis

Fiscal analysis is the area where voters most often receive incomplete information. Build a complete fiscal picture.

- **Distinguish cost categories precisely:**
  - *One-time implementation costs:* Infrastructure, systems, employee training, compliance buildout. These appear large but are not recurring.
  - *Annual ongoing operational costs:* Staffing, administration, enforcement, program delivery. These are the true long-term commitment.
  - *Capital costs:* Land, construction, equipment. Often financed through bonds; analyze total cost including financing.
  - *Revenue impacts:* Tax revenues raised, fees collected, or -- critically -- revenue foregone if the measure reduces an existing tax or restricts a revenue-generating activity.
- **For bond measures, always compute the total debt service cost:**
  - A 30-year general obligation bond at a 4% interest rate costs approximately 1.75x the principal. A $100 million bond will cost approximately $175 million to repay.
  - A 25-year bond at 3.5% costs approximately 1.55x the principal.
  - Current interest rate environment significantly affects this calculation -- use the range provided in the fiscal note, or note that the total will depend on rates at issuance.
  - For school bonds specifically, California's 55% threshold (Proposition 39, 2000) was adopted in exchange for requiring independent citizen oversight committees and annual independent audits -- note whether similar accountability provisions exist.
- **Identify who bears the cost vs. who receives the benefit:**
  - Property tax measures: costs fall on property owners, though landlords often pass increases to renters, making renters indirect cost-bearers.
  - Sales tax measures: costs fall disproportionately on lower-income households (who spend a higher percentage of income) -- this is a standard distributional analysis point.
  - Income tax measures: evaluate rate structure (flat vs. progressive), income thresholds, and whether capital gains are treated as ordinary income.
  - Fee-based measures: costs fall on users of a specific service (bridge tolls, utility fees, development impact fees).
- **Evaluate the reliability of the fiscal projections:**
  - Was the fiscal estimate prepared by an independent legislative analyst or by the measure's proponents?
  - What are the underlying assumptions about participation rates, economic growth, compliance rates, or population projections?
  - Is there precedent from similar measures in other states that can validate or challenge the projections?
  - What is the range of estimates -- "high, medium, low" scenarios -- and what would trigger the high-cost vs. low-cost outcome?
- **Note unfunded mandates:** If the measure requires local governments to take actions without providing funding, those local governments must absorb the costs -- typically through property taxes, service cuts, or reserve spending.

### Step 5: Map the Stakeholder Landscape

Understanding who supports and opposes a measure, and why, is essential civic literacy. This step requires separating organizational interest from argument quality.

- **Identify official campaign committees:** Every ballot measure campaign must register a ballot measure committee with the relevant elections authority. The committee name, treasurers, and major donors are public record in most states. Check the Secretary of State's campaign finance database.
- **Categorize supporters by type:**
  - *Direct beneficiaries:* Entities that will directly receive money, regulatory relief, or competitive advantage if the measure passes. Their support is expected and should be noted -- not as a disqualifier, but as context.
  - *Indirect beneficiaries:* Entities whose business interests improve as a consequence of the measure. Real estate developers supporting affordable housing tax credits have indirect financial interests worth examining.
  - *Values-driven supporters:* Advocacy organizations, religious institutions, and civic groups supporting a measure based on policy values without direct financial benefit. Their arguments tend to reflect broad public interest concerns.
  - *Political party endorsements:* Note which parties have endorsed. This reflects partisan alignment but is not itself an argument about the measure's merits.
- **Apply the same framework to opponents.**
- **Follow the money with specificity:**
  - California's FPPC (Fair Political Practices Commission) and most Secretary of State offices require disclosure of contributions over a threshold (typically $100 to $1,000 depending on jurisdiction).
  - A measure with 90% of its funding from a single industry group deserves note. A measure with broad small-donor funding also deserves note.
  - Out-of-state funding is legally permissible in most ballot measure campaigns but is often politically controversial -- note its presence.
  - "Dark money" (funds from 501(c)(4) organizations that do not disclose donors) is a real phenomenon in ballot measure campaigns. If a major campaign committee is funded by a nonprofit that does not disclose its donors, note that the ultimate funding source is not publicly known.
- **Evaluate the arguments structurally, not politically:**
  - Does the supporting argument accurately describe what the measure does?
  - Does the opposing argument accurately describe what the measure does?
  - Are the cost or benefit figures used in campaign materials consistent with the independent fiscal analysis?
  - Do campaign materials make predictions about consequences (jobs created, crimes prevented, costs avoided) that are speculative vs. based on documented evidence from comparable programs?

### Step 6: Apply the Structural Evaluation Framework

Give the user tools to synthesize everything into their own informed judgment. Do not synthesize it into a voting recommendation.

- **The Problem-Solution Test:** Does the measure address a clearly identified problem? Is the proposed mechanism proportionate to the problem? Are there documented examples of the mechanism working in comparable jurisdictions? (A measure that bans a practice already illegal under existing law, for example, addresses no real problem.)
- **The Implementation Test:** Who is responsible for implementing this measure? Does that entity have the capacity, funding, and legal authority to do so? Is there a regulatory framework for enforcement, or does the measure rely on voluntary compliance?
- **The Reversibility Test:** Is this a statute (amendable by legislature, usually with a waiting period) or a constitutional amendment (requires another vote of the people)? A constitutional amendment that turns out to have unintended consequences may take 6-10 years to fix.
- **The Bundling Test:** Does the measure combine provisions that, if separated, might receive different voter majorities? A "parks and police" bond might combine high-popularity items (parks) with lower-popularity items (police stations) to ensure passage. Note when measures bundle popular and unpopular provisions.
- **The Framing Test:** Is the measure written as a yes-for vs. yes-against? (In some referenda, voting "yes" means voting to repeal something. Confusion about this causes significant misaligned voting.) Make this explicit in your analysis.
- **The Comparison Test:** Have other states or cities tried similar measures? What happened? California's Prop 13 (1978) on property tax limitations, Colorado's TABOR (1992) on spending limits, Massachusetts' 1978 Proposition 2½ on property taxes -- these are documented policy experiments with measurable outcomes that can inform analysis of similar proposals.

### Step 7: Assemble and Present the Structured Analysis

Compile all analysis into the output format. Maintain strict neutrality on the voting recommendation while ensuring both sides are presented with equal analytical depth and rigor. If one side's arguments are factually inaccurate (conflict with the independent fiscal analysis, misquote the measure's text, or make empirically falsifiable claims that are contradicted by data), note the factual discrepancy without characterizing it as a reason to vote one way or another.

---

## Output Format

```
## Ballot Measure Analysis: [Measure Number] -- [Official Title]

**Jurisdiction:** [State / County / City / District]
**Election Date:** [Date]
**Measure Type:** [Initiated Statute / Constitutional Amendment / Bond / Referendum / Advisory / etc.]
**Passage Threshold:** [Simple majority (50% + 1) / 55% / Two-thirds / Other]
**Amendment Difficulty:** [Can be amended by legislature after X years / Requires another ballot measure / Legislative supermajority required]

---

### Plain-Language Summary

**In one sentence:** [The most direct plain-language description of what the measure does,
written without using legal jargon or the value-laden language of the campaign materials.]

**If it passes:** [2-4 sentences describing the concrete changes that would occur -- 
who is affected, what they must or may do differently, when changes take effect.]

**If it fails:** [1-2 sentences describing what remains the same -- make explicit what 
the status quo is, since "failure" is not uniformly the absence of action.]

**Framing alert (if applicable):** [Note if this is a popular referendum where 
"yes" means approving repeal of an existing law, or if the ballot title uses 
language that could cause confusion about which vote achieves which outcome.]

---

### Current Law vs. Proposed Change

| Topic | Current Law / Status Quo | If Measure Passes |
|-------|--------------------------|-------------------|
| [Specific legal provision 1] | [Exact current rule or situation] | [Specific change] |
| [Specific legal provision 2] | [Exact current rule or situation] | [Specific change] |
| [Who administers / enforces] | [Current agency / mechanism] | [Changed agency / mechanism] |
| [Funding source] | [Current source] | [New source or reallocation] |
| [Who is covered] | [Current covered population] | [Expanded / narrowed population] |

---

### Structural Flags

*(Mark each with ✓ Present / ✗ Absent / ? Not determinable from available text)*

| Structural Feature | Status | Notes |
|--------------------|--------|-------|
| Supermajority amendment lock | | |
| Sunset clause | | |
| Direct appropriation (vs. authorization) | | |
| Preemption of local authority | | |
| Severability clause | | |
| Private right of action | | |
| Contingency on another measure | | |
| Independent oversight / audit requirement | | |

---

### Fiscal Analysis

**Measure type fiscal context:** [Bond / Tax increase / Tax decrease / Spending mandate /
Revenue neutral / Unfunded mandate / etc.]

| Cost/Revenue Category | Estimated Amount | Time Horizon | Source of Estimate |
|-----------------------|-----------------|--------------|-------------------|
| One-time implementation cost | $[X] | Year 1 | [Fiscal office / proponent / unknown] |
| Annual ongoing operational cost | $[X]/year | Ongoing | [Source] |
| Capital cost (if applicable) | $[X] | [Years] | [Source] |
| Bond principal (if bond measure) | $[X] | Total | [Ballot text] |
| Total debt service (if bond) | $[X] -- $[Y] | [25-30 years] | [Based on [X]% interest rate range] |
| Annual debt payment (if bond) | $[X]/year | [Bond term] | [Fiscal note] |
| Revenue generated / raised | $[X]/year | Ongoing | [Source] |
| Net annual fiscal impact | $[X] cost OR $[X] savings | Ongoing | [Source] |

**Who pays:**
- *Direct:* [Property owners / income taxpayers / sales taxpayers / fee payers / industry]
- *Indirect:* [Renters through rent pass-through / consumers through price pass-through / etc.]
- *Distributional note:* [Which income groups bear proportionally more or less of the cost]

**Funding mechanism detail:** [Explanation of how the money is collected and where it goes]

**Key fiscal assumptions:** [List the 3-5 most important assumptions in the fiscal analysis
and what would need to be true for the high-end vs. low-end cost estimates to apply]

**Fiscal estimate reliability:** [Independent legislative analyst / proponent-produced /
no estimate available -- and whether the estimate has been challenged by credible sources]

---

### Stakeholder Analysis

**Supporting Coalition:**

| Organization | Type | Nature of Interest | Primary Argument Made |
|-------------|------|--------------------|----------------------|
| [Org name] | [Direct beneficiary / Indirect beneficiary / Values-driven / Political] | [Specific interest] | [Argument] |
| [Org name] | ... | ... | ... |

**Opposing Coalition:**

| Organization | Type | Nature of Interest | Primary Argument Made |
|-------------|------|--------------------|----------------------|
| [Org name] | [Direct beneficiary / Indirect beneficiary / Values-driven / Political] | [Specific interest] | [Argument] |
| [Org name] | ... | ... | ... |

**Campaign Finance Summary:**
- *Yes campaign:* Top funders: [Names/amounts if available]. Total raised: $[X]. Funding concentration: [% from top donor]
- *No campaign:* Top funders: [Names/amounts if available]. Total raised: $[X]. Funding concentration: [% from top donor]
- *Funding source flags:* [Out-of-state funding / Single-industry dominance / Dark money present / Broad small-donor base -- note whichever apply]

---

### Arguments In Depth

**Arguments for the measure:**
1. [Argument 1 -- stated precisely as proponents make it, with the specific claim (numeric or policy)]
   - *Factual basis:* [What evidence supports this claim? Is it consistent with the independent fiscal analysis?]
2. [Argument 2]
   - *Factual basis:* [Same treatment]
3. [Argument 3]
   - *Factual basis:* [Same treatment]

**Arguments against the measure:**
1. [Argument 1 -- stated precisely as opponents make it]
   - *Factual basis:* [What evidence supports this claim? Is it consistent with the independent fiscal analysis?]
2. [Argument 2]
   - *Factual basis:* [Same treatment]
3. [Argument 3]
   - *Factual basis:* [Same treatment]

*Note: Where campaign claims from either side diverge from the independent fiscal analysis
or the measure's actual text, the discrepancy is noted above. This is not an endorsement
of either campaign's position.*

---

### Evaluation Framework

**Problem-Solution Assessment:**
- Problem identified: [Yes/No/Partial -- what is the problem the measure claims to address?]
- Mechanism proportionality: [Is the proposed mechanism calibrated to the scale of the problem?]
- Evidence from comparable jurisdictions: [What happened when similar measures were tried elsewhere?]

**Implementation Assessment:**
- Responsible entity: [Which government body must implement this?]
- Implementation capacity concerns: [Yes / No / Unknown]
- Enforcement mechanism: [Regulatory agency / Private right of action / Criminal penalty / Civil penalty / None specified]

**Reversibility Assessment:**
- Measure type: [Statute (legislature can amend) / Constitutional amendment (requires new vote)]
- Amendment restriction: [Yes -- requires [X] supermajority or new ballot measure / No restriction]
- Practical timeline to reverse if unintended consequences emerge: [Estimate in years]

**Comparison to Similar Measures:**
[If comparable measures exist in other jurisdictions, summarize outcomes -- 
e.g., "Colorado passed a similar measure in 2016; within three years, implementation costs 
exceeded projections by 40% due to litigation over the enforcement provisions."]

---

### Questions to Consider Before Voting

*(These questions are designed to help you apply your own values and priorities to
the measure's substance -- not to steer you toward a particular conclusion.)*

1. [Question specific to the primary contested empirical claim in this measure]
2. [Question about whether the measure's mechanism is likely to achieve its stated purpose]
3. [Question about the fiscal burden and whether the cost-benefit trade-off aligns with your priorities]
4. [Question about who bears the costs vs. who receives the benefits, and whether that distribution reflects your values]
5. [Question about what happens if the projections are wrong -- what is the downside scenario?]
6. [Question about reversibility -- how important is it to you that this could be changed later if it does not work?]
7. [Question specific to a structural flag identified above, if present]

---

### Where to Verify This Analysis

- Official voter guide: [State / County / City elections office -- name the specific office]
- Independent fiscal analysis: [Name of fiscal office that prepared official estimate, if applicable]
- Full measure text: [Where to find the enrolled text]
- Campaign finance records: [Secretary of State campaign finance portal, or local equivalent]
- Nonpartisan voter education: [Note that League of Women Voters, state-specific nonpartisan groups, and some news organizations produce voter guides -- without linking, users can search "[jurisdiction] nonpartisan voter guide [year]"]
```

---

## Rules

1. **Never express a voting preference, even implicitly.** Phrases like "reasonable voters might wonder," "it is worth considering whether," or "the evidence suggests" can all encode a directional lean. Write every evaluative statement as a question for the voter, not a conclusion. The job is to inform judgment, not form it.

2. **Always identify the measure type before any other analysis.** The type (initiated statute, constitutional amendment, popular referendum, bond, advisory) determines the passage threshold, amendment difficulty, and what "yes" and "no" actually mean -- all of which must be established before any substantive analysis.

3. **Always distinguish the ballot title from the operative text.** The ballot title is a political and legal artifact subject to contestation; the operative text is the actual law. Lead every analysis from the operative text and note where the title accurately or inaccurately reflects it.

4. **Never present bond principal without total debt service cost.** Presenting a "$50 million bond" without noting that total repayment over 30 years at 4% interest will be approximately $87 million is materially incomplete and misleading. Always calculate and present the total cost range.

5. **Present arguments for and against at identical analytical depth.** If you spend three sentences on the supporting argument's fiscal basis, spend three sentences on the opposing argument's fiscal basis. Asymmetry in analysis depth constitutes implicit bias, regardless of which side receives more treatment.

6. **Flag factual inaccuracies in campaign materials without characterizing them as reasons to vote either way.** If the Yes campaign claims a measure "will create 5,000 jobs" but the independent fiscal analysis makes no such projection, note the discrepancy. Then note if the No campaign makes similarly unsubstantiated claims. Document the discrepancy; do not weaponize it.

7. **Always identify the passage threshold and amendment difficulty together.** A measure that passes with 51% but can only be amended with a two-thirds legislative vote is structurally very different from a statute that passes at 51% and can be amended by a simple legislative majority. The combination of these two numbers defines how locked-in the policy is.

8. **Never use the value-laden language of either campaign in your own analysis.** If supporters call it a "commonsense reform" and opponents call it a "dangerous power grab," use neither phrase. Use the neutral operative description: "a measure that would transfer authority to regulate [X] from [Y] to [Z]."

9. **Always note when no independent fiscal analysis exists.** In many jurisdictions -- particularly local measures and states without a legislative analyst function -- fiscal impact estimates are produced by the measure's proponents or opponents, not by an independent office. This is a significant limitation that voters must know. Do not present proponent-produced estimates with the same authority as independent estimates.

10. **Always address the "what happens if the projections are wrong" scenario.** Every fiscal projection carries assumptions. Identify the two or three most consequential assumptions and explain what the high-end cost or low-end revenue scenario would look like, and who bears the risk if projections miss. Voters who understand the downside scenario make more durable decisions.

11. **Always distinguish a popular referendum from an initiative.** In a popular referendum, voting "yes" typically means voting to uphold a law the legislature passed, and voting "no" means voting to repeal it -- the opposite of the typical initiative framing. Confusion about this framing causes a documented pattern of voters inadvertently voting opposite to their intent. Flag it prominently whenever it applies.

12. **Always note whether a measure bundles provisions that, if separated, might have different outcomes.** Omnibus bond measures, combined tax-and-spending measures, and "parks and public safety" packages may combine high-popularity and low-popularity items. Voters have no option to split their vote, so note what they are accepting or rejecting as a package.

---

## Edge Cases

### The User Has Only the Ballot Title, No Full Text

The ballot title is a legally constrained marketing document, not a measure summary. Titles in many states are limited to 75 or 100 words and are sometimes written by partisan officials or subject to negotiated compromise that leaves out critical provisions. Do not conduct substantive analysis from the title alone. Explain this to the user and guide them to the full text: the official voter guide (available from the county clerk or Secretary of State, usually online by 40 days before the election under California's rules -- similar timeframes apply in most states), the enrolled initiative text filed with the elections office, or the state legislative website if it is a legislative referral. If the user genuinely cannot access the full text, provide the general evaluation framework and note explicitly that any analysis based on the title alone is provisional.

### The Measure Is a Popular Referendum (Yes = Uphold, No = Repeal)

This is the most dangerous source of voter confusion in ballot measure law. When a legislature passes a law and it is referred to voters (either because the legislature chose to refer it, or because opponents gathered signatures to force a vote), the framing is typically: "Shall [the law the legislature passed] be approved?" Voting "yes" upholds the law; voting "no" repeals it. This is the structural opposite of an initiative, where "yes" creates something new. Make this framing explicit, bold, and prominent at the top of your analysis. Give concrete examples: "If you want [the law] to remain in effect, vote YES. If you want [the law] to be repealed, vote NO." Then continue with neutral analysis of the law's substance.

### The Bond Measure Has No Specified Project List

Some bond measures authorize a dollar amount and name broad categories ("parks and recreation," "school facilities," "infrastructure") without specifying exactly which projects will be funded. This gives the governing body broad discretion. Flag this prominently: the voter is approving both the debt obligation and the discretion to spend it. Key questions to highlight: Does the measure include an independent citizens' oversight committee with authority to review expenditures? Does it require competitive bidding? Does it require annual independent audits? Proposition 39 (California, 2000) established a model for school bond accountability provisions -- note whether similar provisions exist in the bond under analysis. A bond with no project list and no oversight mechanism is a very different fiscal commitment from one with both.

### The Measure Amends the State Constitution

Constitutional amendments require a different analytical posture. First, confirm the passage threshold -- most state constitutions require a simple majority of voters to amend (unlike the federal constitution), but some require 60% or a specific supermajority. Second, and most importantly, note that a constitutional amendment preempts the legislature: once a provision is in the constitution, the legislature cannot override, modify, or repeal it without another ballot measure. This means that drafting errors, unintended consequences, and changing circumstances cannot be corrected by normal legislative process. Examples where this has mattered: California's Proposition 13 (1978) locked in property tax calculation rules that were never updated for 45+ years because amendment requires another ballot measure; Florida's constitutional amendment process has been used to entrench very specific policy details (animal welfare rules, class size requirements) that are administratively inflexible. Ask the user to consider: is this provision appropriate for constitutional entrenchment, or is it a policy choice that should remain subject to legislative revision?

### The Measure Was Written or Heavily Funded by a Single Industry

This is an increasingly common pattern in ballot initiative states (California, Oregon, Arizona, Colorado, Florida). Industries that face legislative or regulatory resistance sometimes turn to the initiative process to write their own rules directly into law. Pharmaceutical industry campaigns, gig economy company campaigns (Proposition 22 in California, 2020, funded by app companies at approximately $200 million -- the most expensive ballot measure in California history at the time), and utility industry campaigns are documented examples. When a measure is funded at 80%+ by a single industry, the conflict of interest is relevant context. Do not suggest this automatically makes the measure bad policy -- sometimes industry-backed measures have genuine public benefit -- but note the funding concentration and ensure the user understands who wrote the rules and why. Also note when the opposition is itself dominated by a competing industry (e.g., one union opposing a measure primarily funded by a rival union).

### The Measure Conflicts with or May Be Preempted by Federal Law

This happens more often than voters realize. State marijuana legalization measures (Propositions 215, 64 in California; Amendment 64 in Colorado) were enacted despite federal Controlled Substances Act prohibition. State minimum wage ballot measures may interact with federal Fair Labor Standards Act rules. State immigration-related measures have faced preemption challenges. If the measure appears to operate in an area of federal regulatory activity, note that: (a) the measure may be subject to legal challenge on preemption grounds, (b) implementation may be delayed or limited during litigation, and (c) the ultimate enforceability of the measure is a legal question for courts. Do not predict the outcome of litigation -- that requires licensed legal counsel -- but flag the issue and recommend the user consult an attorney if the preemption question is central to their evaluation.

### The User Is Comparing Multiple Measures on the Same Ballot

When a user has five to ten measures to analyze, provide a ballot-level overview first: a summary table listing measure number, type, passage threshold, fiscal impact direction (cost vs. revenue), and subject area. This allows the user to prioritize which measures most need deep analysis and to see whether any measures interact (e.g., two competing measures on the same subject where one may override the other if both pass). Note: many states have a "competing measures" rule where if two conflicting measures both pass, the one with the higher vote total prevails. California, Oregon, and Washington all have versions of this rule. If two measures on the same ballot address the same subject, analyze them together and explicitly address the competing-measures question.

### The Measure Is from a Prior Election Cycle

When a user is analyzing a measure that has already been voted on -- either to understand its implementation, compare it to a new version of the same issue, or understand a historical policy decision -- adjust the analysis accordingly. Note the final vote margin, whether it passed or failed, and if it passed, what the implementation experience has been. Documented implementation outcomes are more valuable than projections. Cite specific known outcomes where available (e.g., "Colorado's TABOR, passed in 1992, has been repeatedly described by state fiscal officers as constraining emergency spending flexibility, and voters passed Referendum C in 2005 to temporarily suspend some of its provisions"). If analyzing a historical measure for comparison to a new one, structure the comparison explicitly: what was the same, what was changed, and why (based on what implementation experience revealed).

---

## Example

**Input:** "My state has a ballot measure called Proposition 47: 'Funding for Public School Arts and Music Education.' The voter guide says it 'authorizes $1 billion in general obligation bonds for arts and music programs in K-12 public schools, including purchase of instruments and equipment, teacher training, and facility improvements. Requires an independent Citizens Oversight Committee and annual independent audits. Repaid through property taxes.' I want to understand what I'm actually voting for."

---

**Output:**

## Ballot Measure Analysis: Proposition 47 -- Funding for Public School Arts and Music Education

**Jurisdiction:** State (K-12 public schools statewide)
**Measure Type:** General Obligation Bond
**Passage Threshold:** 55% (school bonds in this state require a 55% supermajority, consistent with the California model established by Proposition 39 in 2000 -- verify your state's specific threshold in the official voter guide)
**Amendment Difficulty:** Bond terms are set at issuance; the spending categories and oversight requirements in the enabling legislation can typically be amended by the legislature, though any expansion of bond authority requires a new ballot measure

---

### Plain-Language Summary

**In one sentence:** Proposition 47 authorizes the state to borrow $1 billion by issuing bonds, spend the proceeds on arts and music education in K-12 public schools, and repay the debt through property taxes collected over the life of the bonds.

**If it passes:** The state can sell up to $1 billion in general obligation bonds to financial markets. The proceeds flow to a state education department-administered grant program for school districts. Districts apply for funds to purchase instruments, audio and visual equipment, hire or train music and arts teachers, and renovate dedicated arts and music facilities. A Citizens Oversight Committee reviews expenditures. Annual independent audits are required. Property owners statewide pay a small additional property tax assessment each year for the life of the bonds (typically 25-30 years) to repay the debt and interest.

**If it fails:** No bonds are issued, no new property tax assessment occurs, and the proposed grant program does not receive this funding. Existing arts and music programs funded through district operating budgets and other state or federal grants continue as before -- failure of the bond does not eliminate existing programs, only the proposed expansion.

**Framing note:** This is a standard initiative bond measure -- voting "yes" approves borrowing and spending; voting "no" maintains the status quo. There is no inverted framing issue with this measure.

---

### Current Law vs. Proposed Change

| Topic | Current Law / Status Quo | If Proposition 47 Passes |
|-------|--------------------------|--------------------------|
| Arts/music capital funding | No dedicated statewide bond; districts fund from operating budgets, local bonds, or federal Title IV grants | $1 billion available through state grant program for capital and training purposes |
| Property tax rate | Current rate based on existing obligations | Increases by an estimated $5.20 per $100,000 of assessed property value annually during bond repayment period |
| Oversight mechanism | Standard state audit processes | New independent Citizens Oversight Committee required; annual independent audits required |
| District eligibility | Any district may apply for existing categorical grants | Any K-12 public school district eligible to apply; priority rules TBD by implementing agency |
| Grant administration | Multiple state and federal grant programs through the Department of Education | New dedicated grant program administered by the Department of Education under the terms of Proposition 47 |
| Teacher training scope | Available through existing credential programs and district professional development budgets | Eligible use of bond funds, expanding available resources for credential upgrades and in-service training |

---

### Structural Flags

| Structural Feature | Status | Notes |
|--------------------|--------|-------|
| Supermajority amendment lock | ✗ Absent | Bond spending categories are in enabling statute, amendable by legislature |
| Sunset clause | ✗ Absent | Bond authority is permanent once authorized; expires when bonds are fully repaid |
| Direct appropriation | ✓ Present | Bond proceeds are directly appropriated to education department upon sale |
| Preemption of local authority | ✗ Absent | Districts retain control over whether to apply for grants |
| Severability clause | ? Not determinable | Verify in full text |
| Private right of action | ✗ Absent | Enforcement through audit and oversight committee, not private lawsuits |
| Contingency on another measure | ✗ Absent | Proposition 47 is independent |
| Independent oversight / audit requirement | ✓ Present | Citizens Oversight Committee and annual independent audits are explicitly required |

---

### Fiscal Analysis

**Measure type fiscal context:** General Obligation Bond -- this is a debt instrument, not a tax increase in itself. The property tax increase is the mechanism for debt repayment, not the primary action of the measure. The state's credit rating determines the interest rate at issuance.

| Cost/Revenue Category | Estimated Amount | Time Horizon | Source of Estimate |
|-----------------------|-----------------|--------------|-------------------|
| Bond principal | $1,000,000,000 | Total | Ballot text |
| Total debt service (principal + interest) | $1,600,000,000 -- $1,900,000,000 | 25-30 years | Based on 3.5%--5.0% interest rate range; exact rate determined at issuance |
| Annual debt service payment | ~$53M -- $76M/year | Bond term | Derived from above range |
| Property tax increase (per $100,000 assessed value) | ~$5.20/year | Bond term | State fiscal office estimate |
| Average property tax increase per homeowner | ~$52 -- $130/year | Bond term | Depends on assessed value; median home, approximately $78/year |
| Revenue generated | $0 | -- | Bond is borrowing, not revenue; repaid through taxes |
| Net annual fiscal impact on state budget | ~$53M -- $76M/year additional obligation | Bond term | State fiscal office |

**Who pays:**
- *Direct:* All real property owners in the state pay the increased property tax assessment during the bond repayment period. Commercial property owners, residential homeowners, and landlords all pay.
- *Indirect:* Renters may see rent increases as landlords pass through the additional property tax cost. This is not guaranteed by law, but is common practice in tight rental markets. The distributional effect means renters in high-rent markets may bear some cost without receiving the direct benefit of homeownership tax deductions.
- *Distributional note:* Property taxes are often described as regressive in high-cost housing markets because a $5.20 assessment per $100,000 of assessed value represents a larger share of income for a homeowner whose home appreciation has outpaced income growth, though the absolute dollar amount is the same regardless of income.

**Funding mechanism detail:** The state sells bonds to institutional investors. The state's general obligation bond rating (typically AA or higher for most states) determines the interest rate. Bond proceeds are deposited in a dedicated fund and distributed to school districts via competitive or formula grants administered by the Department of Education. The state levies an additional property tax assessment each year, calculated to cover annual debt service, and remits those funds to bondholders. When all bonds are repaid, the additional assessment ends automatically.

**Key fiscal assumptions:**
1. Interest rate at issuance: the $1.6B -- $1.9B total cost range assumes a 3.5% -- 5.0% interest rate. In a higher-rate environment (above 5%), total cost could exceed $2.0B. In a lower-rate environment, total could fall below $1.6B.
2. Bond term: a 30-year term is assumed. A 25-year term reduces total interest paid but increases annual payments.
3. Property value assessment base: the per-property tax estimate assumes a specific total statewide assessed value. If the assessment base grows (more development, rising property values), the per-property rate decreases. If it shrinks (recession, declining values), the rate increases to cover the fixed debt service.
4. Full bond issuance: the estimate assumes all $1 billion in bonds are eventually issued. If the state issues bonds in tranches over multiple years, interest costs may differ.
5. Administrative costs: grant program administration, Citizens Oversight Committee staffing, and annual audit costs are ongoing expenses that are typically not included in headline bond cost figures. These are usually 1-3% of program value and would be drawn from bond proceeds or the state general fund.

**Fiscal estimate reliability:** This analysis assumes an independent state fiscal office prepared the official estimate. If the estimate in the voter guide was prepared by the Department of Finance or a legislative analyst office, it is substantially more reliable than a proponent-produced estimate. Verify the source in the official voter guide.

---

### Stakeholder Analysis

**Supporting Coalition:**

| Organization | Type | Nature of Interest | Primary Argument Made |
|-------------|------|--------------------|----------------------|
| State Teachers Association | Values-driven / Indirect beneficiary | Teachers benefit from expanded programs and training funds | Arts and music education improves student outcomes; schools cannot fund this from operating budgets alone |
| Parent Teacher Association (statewide) | Values-driven | No direct financial interest | Students in underfunded districts lack access to arts and music programs available in wealthier districts; bond creates equity |
| Music instrument manufacturers and retailers | Direct beneficiary | Bond funds will be spent on instruments | Students need quality instruments to participate in music programs |
| Performing arts venues and nonprofit arts organizations | Indirect beneficiary | Larger school arts pipeline benefits future audiences and performers | Community cultural life benefits from stronger arts education |
| State Board of Education | Legislative / institutional | Implements the grant program if passed | Supports expanded resources for K-12 programs |

**Opposing Coalition:**

| Organization | Type | Nature of Interest | Primary Argument Made |
|-------------|------|--------------------|----------------------|
| Taxpayer advocacy organizations | Values-driven | Oppose tax increases and debt generally | Adding $1.6B+ in debt for non-essential programs is fiscally irresponsible; arts can be funded through operating budgets |
| Some school district administrators (small districts) | Indirect stakeholder | Concern about grant application burden | Grant application processes favor large districts with administrative staff; small rural districts may not benefit proportionally |
| Property owner associations | Direct cost-bearer | Pay increased property taxes | Property taxes are already high; additional debt service increases homeownership costs |
| Fiscal conservative policy organizations | Values-driven | Oppose bond financing of ongoing program costs | General obligation bonds should fund capital infrastructure (roads, buildings), not teacher training or equipment purchases |

**Campaign Finance Summary:**
- *Yes campaign:* Check Secretary of State campaign finance portal for current filings. Key indicators to look for: significant contributions from instrument manufacturers or music industry associations (direct beneficiaries whose support should be contextualized), contributions from teachers unions (who have an employment interest in expanded arts programs), and broad small-donor contributions from parents and community members (reflecting grassroots support independent of financial interest).
- *No campaign:* Check for funding from property owner associations, anti-tax political organizations, and any competing spending priorities. Note whether the opposition is primarily funded by groups with a broad anti-bond ideology vs. groups specifically concerned about arts education policy.
- *Funding source flags:* If instrument manufacturers constitute more than 20-30% of Yes campaign funding, note the direct financial interest. If opposition is primarily funded by organizations that oppose all bond measures regardless of subject, note that their argument is structural (anti-debt) rather than substantive (anti-arts education).

---

### Arguments In Depth

**Arguments for the measure:**

1. **Arts and music education improves student academic outcomes and is inequitably distributed.**
   - *Factual basis:* There is substantial peer-reviewed research (National Endowment for the Arts, RAND Corporation analyses) linking participation in arts education to improved reading and math outcomes, reduced dropout rates, and social-emotional development. The equity argument is supported by documented funding disparities between high-income and low-income school districts -- wealthier districts fund arts through parent foundations and local operating budgets; lower-income districts frequently cut arts programs during budget shortfalls. A statewide bond levels the resource floor. This argument is generally well-supported by evidence.

2. **School operating budgets cannot fund capital and equipment costs for arts programs at the required scale.**
   - *Factual basis:* This is a standard argument for bond financing vs. operational spending. A grand piano costs $20,000 -- $80,000; a music room acoustic renovation may cost $100,000 -- $500,000; a school ceramics kiln costs $5,000 -- $20,000. These are capital expenditures with multi-decade useful lives -- they match the profile of bond-financed assets. Teacher training, however, is an ongoing operational cost, and bond financing of operational items is more controversial (see opposing argument below). The measure bundles capital and training -- whether the training component is appropriate for bond financing is a legitimate question.

3. **The Citizens Oversight Committee and audit requirements protect taxpayers.**
   - *Factual basis:* The California experience with Proposition 39 school bonds (passed 2000) provides direct evidence that oversight committee requirements reduce misuse of bond funds and increase public accountability. Bond measures with oversight provisions have a documented track record of fewer audit findings than bond measures without them. This argument is well-grounded in precedent.

**Arguments against the measure:**

1. **General obligation bonds should fund permanent infrastructure, not equipment or teacher training.**
   - *Factual basis:* This is a principled fiscal argument. Standard bond financing doctrine holds that bond debt should be matched to the useful life of the asset being financed: a 30-year bond for a 30-year building is appropriate; a 30-year bond for a clarinet with a 15-year useful life means future taxpayers pay for an asset that is already replaced. Many fiscal analysts and bond rating agencies consider using long-term debt for equipment or training as poor fiscal practice. The measure's inclusion of "teacher training" as an eligible expense is a genuine structural concern, though the measure may permit bond issuance only for capital items with training funded separately -- check the full text.

2. **Property taxes are already a significant burden, and this adds $78/year for the average homeowner for 30 years.**
   - *Factual basis:* This is an empirical claim requiring context: the $78/year average estimate is derived from the fiscal note; the burden varies significantly by property value. The argument is strongest in high-cost housing markets where property taxes are already a significant homeownership cost. It is weakest as a standalone argument without comparing the cost to the value of the programs funded -- the question is whether the $78/year is worth what it buys, which is a values question, not a factual dispute.

3. **Large districts with grant-writing staff will benefit disproportionately; small and rural districts will be left out.**
   - *Factual basis:* This is a documented
