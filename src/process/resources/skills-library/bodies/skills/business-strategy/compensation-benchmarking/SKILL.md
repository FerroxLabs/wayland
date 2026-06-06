---
name: compensation-benchmarking
description: |
  Builds a total compensation analysis structure with market data interpretation, compensation band setting, and pay equity review using total compensation framework methodology. Use when the user asks about compensation benchmarking, salary bands, pay equity, market rate analysis, or total compensation structuring.
  Do NOT use for personal salary negotiation (use salary-negotiation), job offer writing (use offer-letter), or financial modeling (use financial-model-structure).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "analysis strategy planning research spreadsheets"
  category: "business-strategy"
  subcategory: "human-resources"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Compensation Benchmarking

## When to Use

**Use this skill when:**
- A company (startup, growth-stage, or mature) needs to establish or redesign salary bands for one or more job families from scratch
- An HR leader, People Ops team, or founder needs to benchmark existing salaries against current market data and identify underpaid, overpaid, or at-risk employees
- A compensation committee or executive team needs to design or update a total compensation philosophy (cash, equity, bonus, benefits) tied to a stated market position
- A company is conducting an annual or mid-cycle compensation review and needs a structured framework to evaluate current pay against updated market benchmarks
- An organization needs to run a pay equity analysis across gender, race/ethnicity, or tenure cohorts to identify unexplained compensation gaps and prioritize remediation
- A company is restructuring its job architecture (adding levels, splitting job families, merging functions) and needs to remap employees to new bands with updated market anchors
- A business is entering a new labor market (new city, new country, or shift to full remote) and needs a geographic pay policy with a cost-of-labor indexing methodology
- A pre-IPO company needs to formalize compensation structure before public scrutiny, board presentations, or proxy advisor review

**Do NOT use this skill when:**
- A user wants help negotiating their own salary or evaluating a job offer they received -- use `salary-negotiation`
- A user needs a written employment offer letter with specific compensation language -- use `offer-letter`
- A user needs to model headcount costs as part of a financial forecast or operating plan -- use `financial-model-structure`
- A user wants general HR policy writing (PTO policy, leave policy, performance review templates) -- use an HR policy skill
- A user is asking about executive compensation, proxy-disclosed CEO pay ratios, or SEC-regulated compensation disclosure -- this requires securities law expertise beyond scope
- A user needs a full workforce planning model (headcount growth, role mix, span of control) -- use a workforce planning skill
- A user needs help with individual performance reviews or promotion decisions for a specific employee -- use a performance management skill

---

## Process

### Step 1: Gather Context and Define Scope

Before building anything, collect the inputs that determine every subsequent decision.

- **Company stage and funding:** Pre-seed and seed startups have zero comp data and need simple frameworks; Series B+ companies need rigor; public companies need defensibility for board and proxy advisors. Stage determines how much complexity is warranted.
- **Industry vertical:** Software engineering comp in San Francisco is structurally different from healthcare administration in Nashville. Industry determines which benchmarking surveys to reference. Do not mix surveys across industries without adjustment.
- **Role scope:** Identify every job family to be benchmarked (engineering, sales, marketing, finance, operations, etc.). Clarify the number of levels within each family (individual contributor track vs. management track). A "senior engineer" in one company is an "E5" in another -- level definitions matter more than titles.
- **Geographic footprint:** List every city or metro where employees work. Classify them by labor market tier (Tier 1: SF, NYC, Seattle, Boston; Tier 2: Austin, Denver, Chicago, LA, Atlanta; Tier 3: all other US metros; Tier 4: international). Determine whether the company pays location-based rates or a uniform national rate.
- **Current compensation philosophy (if one exists):** Ask explicitly. Many companies have an informal philosophy ("we try to be competitive") that has never been documented. Surface it.
- **Existing data:** Request a current employee roster with title, level, location, hire date, current base salary, bonus target, equity grant details, and demographic information if available and legally permissible to use. This is the baseline for all gap analysis.
- **Budget and timeline:** Is this an immediate remediation exercise with a hard budget cap, or a strategic redesign with flexibility? The answer shapes how aggressive the recommendations can be.
- **Equity plan details:** For equity-granting companies, get the current 409A valuation (or stock price for public companies), vesting schedules, option strike prices, and grant size ranges by level. Equity value calculations depend on these inputs.

---

### Step 2: Establish the Compensation Philosophy

The philosophy is the decision framework that governs every subsequent choice. It must be explicit, not implied.

- **Market position (the percentile target):** The three canonical stances are:
  - **Lead market (75th percentile or above):** Total compensation exceeds most competitors. Appropriate when competing for scarce talent (deep ML/AI engineers, rare domain specialists), when a company needs to move fast and cannot afford recruiting delays, or when equity upside is uncertain (e.g., post-IPO lockup, mature company with low growth). High cost, high retention, less equity dilution.
  - **Match market (50th percentile):** Competitive with the median. Appropriate for most well-funded growth companies where compensation is one of several talent levers. The most common stance.
  - **Lag market on cash, lead on equity (25th-40th percentile cash, 75th+ percentile equity):** Appropriate for early-stage startups where cash conservation is critical and equity upside is meaningful. Must be stated transparently to candidates or it creates trust damage when discovered. Requires that equity value be honestly communicated.
  - The percentile target should be stated separately for base salary, target total cash (base + bonus), and total compensation (base + bonus + equity + benefits). These can differ: e.g., "50th percentile base, 65th percentile total cash."
- **Equity strategy:** Define whether equity is a universal component (all employees receive grants) or selective (management and above). Define grant refreshes (annual refresh grants vs. promotion-only). Define the vesting schedule (4-year with 1-year cliff is standard; some companies use 3-year monthly or biannual vesting). Define how equity is positioned in the total comp narrative.
- **Bonus structure:** Determine whether variable pay is part of the package (common in sales, finance, executive roles) or absent (common in early-stage engineering). If present, define target bonus as a percentage of base by level (e.g., IC1: 5%, IC2: 8%, IC3: 10-15%, M1: 15-20%, Director+: 20-30%).
- **Geographic pay policy:** Three options:
  - **Location-based pay:** Salary is indexed to where the employee lives. SF employee earns more than Dallas employee in the same role. Most administratively defensible and market-consistent.
  - **Role-based (national) pay:** Everyone in a role receives the same salary regardless of location. Simpler to administer, costs more because you pay SF rates to everyone, or you lose talent by paying Dallas rates to SF employees.
  - **Hybrid:** Location tiers (Tier 1 / Tier 2 / Tier 3) with band midpoint adjustments per tier. The most common practical approach for distributed companies.
  - Document the geographic index explicitly. Typical Tier 2 adjustment is 85-92% of Tier 1. Tier 3 is 75-85%. These are cost-of-labor adjustments, not cost-of-living. Cost of labor reflects what other employers pay in a location; cost of living reflects what an employee spends. They do not move in parallel -- Tier 2 cities have seen rapid labor cost increases even where cost-of-living remains lower than SF.
- **Pay transparency level:** Define before publishing any bands. Options range from fully transparent (every employee sees every salary, used by Buffer and Whole Foods) to band-transparent (employees know their band, not others' salaries) to manager-visible (managers see their team's position in band) to confidential (no disclosure). Note: several US states (California, Colorado, New York, Washington) now require salary range disclosure in job postings regardless of internal policy.
- **Write the philosophy as a 1-paragraph statement** that can be shared with employees and used to make comp decisions consistently. This becomes the anchor document.

---

### Step 3: Select and Evaluate Benchmarking Data Sources

Market data quality determines the quality of every band built from it. Source selection is not arbitrary.

- **Tier 1 sources -- compensation surveys (most reliable):** These are structured surveys where companies submit actual pay data in exchange for aggregated results. Data is validated, role-matched by job code, and reported at multiple percentiles (25th, 50th, 75th, 90th). They typically lag the market by 6-12 months because data is collected annually.
  - Radford (Aon): The gold standard for tech, biotech, and financial services. Deep level-of-work matching. Expensive ($5,000-$25,000 per survey module). Worth it for companies with 100+ employees.
  - Mercer: Strong across industries. Particularly good for non-tech functions.
  - Willis Towers Watson (WTW): Strong for executive and management roles.
  - Culpepper: Affordable option for mid-market tech companies.
  - SHRM Compensation Surveys: Best for HR roles and non-profit contexts.
  - Industry-specific surveys (e.g., BioPharm, financial services, legal): Use when a company operates in a specialized industry.
  - For startups that cannot afford paid surveys, look for peer companies participating in shared survey consortiums.
- **Tier 2 sources -- aggregated public data (directional):** Useful for validation and for roles where paid surveys lack coverage.
  - LinkedIn Salary, Glassdoor, Levels.fyi (tech-specific), Radford's free published ranges, H-1B public disclosure data, and job board aggregators all provide directional signals.
  - Limitations: Levels.fyi skews toward FAANG compensation. Glassdoor has self-reporting bias (unhappy employees and outliers over-report). H-1B data is real but only covers visa-sponsored roles. Job posting salary data reflects the asking price for new hires, not the full existing employee distribution.
  - Use Tier 2 sources to gut-check Tier 1 survey data, not to replace it.
- **Tier 3 sources -- peer company data:** Compensation data shared directly between peer companies (often through HR networks, VC-sponsored comp databases for portfolio companies like Carta Total Comp or Option Impact, or trusted recruiter relationships).
  - High relevance (same stage, same location, same talent pool) but low statistical validity (small N, selection bias toward companies willing to share).
  - Weight peer data qualitatively: "Three Series B SaaS companies are targeting $175K-$200K for senior engineers in SF" is useful context, not a definitive market rate.
- **Blending sources:** The most defensible approach is to weight Tier 1 survey data at 60-70%, validate with Tier 2 public data for directional consistency, and use Tier 3 peer data for final calibration on competitive roles. Document the blend in the methodology section of the output.
- **Recency adjustment:** If using survey data older than 12 months, apply a market movement adjustment. Engineering and technical roles moved 8-15% per year in 2020-2022; the market cooled in 2023-2024 but non-technical roles continued rising. Use BLS Employment Cost Index or published pay trend reports to estimate the adjustment factor and document it explicitly.

---

### Step 4: Build the Job Architecture Before Building Bands

Compensation bands are meaningless without a clear job architecture. Many companies skip this step and build inconsistent bands as a result.

- **Job families:** A job family is a cluster of roles that perform related work (e.g., Software Engineering, Product Management, Sales, Finance). Each family should have its own leveling rubric.
- **Levels within a family:** Define a career ladder with distinct level criteria before assigning pay. Typical IC engineering ladder: E1 (Entry), E2 (Junior), E3 (Mid), E4 (Senior), E5 (Staff), E6 (Principal). Typical management ladder: M1 (Engineering Manager), M2 (Senior Manager), M3 (Director), M4 (VP). For smaller companies, 4-5 IC levels and 3 management levels are sufficient.
- **Level definitions:** Each level needs a written profile that describes scope of work, decision-making authority, complexity of problems, and leadership expectations -- not just years of experience. Years of experience is a proxy variable, not a definition. "Owns end-to-end features independently" is a definition. "3-5 years" is not.
- **Market job code matching:** When using compensation surveys, you must match each internal level to a survey job code. Radford codes engineering levels as P1 (entry) through P6 (distinguished). Do not match your "Senior Engineer" to the P4 code without checking whether the level definition aligns. Over-matching inflates midpoints; under-matching compresses them.
- **Dual-track architecture:** Define whether individual contributors can progress to principal/distinguished/fellow levels that are comp-competitive with management levels (common in engineering). Without this, senior ICs get promoted into management only for the pay, which destroys team structure.
- **Scope of this step in practice:** If the user has no existing job architecture, build a simple one before proceeding. If they have a partial one, identify the gaps. If they have a mature one, confirm survey code matching and proceed.

---

### Step 5: Build Compensation Bands

With job architecture confirmed and market data sourced, construct bands for each level in each job family.

- **Midpoint = the market anchor:** The midpoint should reflect the market rate for a fully proficient employee at that level, at the target percentile. Pull the relevant survey percentile (50th percentile for a match-market company). This is your midpoint. For a lead-market company, use the 65th or 75th percentile as your midpoint.
- **Band minimums and maximums -- the spread ratio:**
  - Calculate the spread from minimum to maximum as a percentage of the midpoint.
  - Entry-level IC roles: 20-30% spread. A narrow band reflects limited performance variance. Min = midpoint × 0.87, Max = midpoint × 1.13.
  - Mid-level IC roles: 25-35% spread. Min = midpoint × 0.85, Max = midpoint × 1.17.
  - Senior IC and management: 35-50% spread. Min = midpoint × 0.82, Max = midpoint × 1.20-1.25. Wide bands accommodate both newly-promoted employees and veterans with exceptional scope.
  - Director and VP: 50-60% spread. Executives: up to 100% spread (maximum can be double minimum) to reflect the wide variance in executive scope.
- **Overlap between adjacent bands:** Adjacent bands should overlap by 15-25%. This is intentional -- it allows a high-performing E3 to earn more than a newly-promoted E4. No overlap creates compression cliffs that trigger immediate pay raises on every promotion, which is expensive and creates gaming.
- **Rounding conventions:** Round midpoints to the nearest $5,000 for roles above $100K base. Round minimums and maximums to the nearest $2,500. Avoid false precision ($137,842 as a band minimum signals the inputs are more precise than they are).
- **Geographic adjustment application:** If using location-tiered pay, the SF-anchored band is the Tier 1 baseline. Apply the tier multiplier to the midpoint and then recalculate the band around the adjusted midpoint using the same spread percentage.
  - Example: Tier 1 (SF) Senior Engineer midpoint = $200,000. Tier 2 (Austin) = $200,000 × 0.88 = $176,000. Tier 3 (Raleigh) = $200,000 × 0.80 = $160,000. The band spread percentage remains constant; the absolute numbers shift.
- **Validate bands against reality:** Before finalizing, run the proposed bands against current employee data. If 40% of current employees fall above the proposed maximum, either the market data source is wrong, the level definitions are misaligned, or the company has been paying above market and has a retention problem waiting to happen. Investigate before proceeding.
- **Document market data source and date for each band:** Every midpoint should be traceable to a specific survey, a specific percentile, and a specific date. This is essential for future reviews and for explaining pay decisions to employees or leadership.

---

### Step 6: Model Total Compensation

Base salary is one input into total compensation. A complete benchmarking analysis quantifies every component.

- **Base salary:** The annualized fixed cash amount. Express as a point-in-time salary, not an hourly rate (unless the role is hourly or the company uses hourly classification).
- **Target bonus / variable pay:**
  - Express as a target percentage of base (e.g., 10% target bonus for E3).
  - Report at target, not at maximum. Max bonus is theoretical; target bonus is the expected value in a normal performance year.
  - For sales roles, variable pay may equal or exceed base. On-target earnings (OTE) = base + target variable. Always model OTE for sales roles.
  - Apply bonus opportunity consistently by level. The delta between IC and management bonus opportunity is typically 5-10 percentage points per level step.
- **Equity / long-term incentive:**
  - For pre-IPO companies: Equity is expressed as options or RSUs. To calculate annual value, take the current 409A fair market value (FMV) or preferred share value divided by a liquidity discount factor (typically 0.4-0.6 for early-stage, 0.6-0.8 for late-stage pre-IPO to account for illiquidity and dilution risk), then multiply by grant size and divide by vesting period.
  - Example: 10,000 options × ($20 FMV - $2 strike price) × 0.5 liquidity discount / 4-year vest = $22,500 estimated annual equity value.
  - For public companies: Use current 30-day average stock price × shares granted / vesting period for RSU annual value.
  - For options (public): Annual value = (current price - strike price) × shares / vesting period. If out of the money, value is zero for modeling purposes.
  - Express equity grants at each level in both dollar value and share count. Share count without a price is meaningless for comparison; dollar value without share count obscures dilution.
- **Benefits:**
  - Employer-paid health insurance: Typical employer contribution is $5,000-$10,000/year for individual coverage; $12,000-$25,000/year for family coverage. Use the actual employer cost, not the employee-visible premium.
  - 401(k) match: Express as the maximum employer match in dollars at the expected contribution level (e.g., 4% match on $100,000 salary = $4,000/year).
  - PTO: Quantify unbounded or above-market PTO as a value. 5 extra PTO days above industry standard at $200,000 salary = approximately $3,846 additional value.
  - Parental leave: Express paid leave weeks above the statutory minimum as a value. 12 weeks fully paid for a $150,000 employee = $34,615 incremental value over a statutory 0-week baseline.
- **Perks with quantifiable value:** Remote stipend ($500-$3,000/year), home office setup ($1,500-$3,000 one-time), learning and development budget ($1,000-$5,000/year), commuter benefits ($300/month pre-tax in states where applicable).
- **Total compensation (TC):** Sum all components. Present TC alongside base salary in all benchmarking comparisons. A company offering $150,000 base with 15% bonus, $30,000 equity, and $20,000 benefits has $218,000 in total compensation -- a number that cannot be compared to a $175,000 base offer without the same analysis.
- **Competitive comparison:** If market data is available for total compensation (Radford reports TC percentiles alongside base), present the TC comparison at the same percentile. Many companies match market on base but fall behind on TC because their equity and bonus programs are thin.

---

### Step 7: Conduct Pay Equity Analysis

Pay equity analysis identifies unexplained compensation gaps within the same role and level. It is a legal, ethical, and retention obligation.

- **Define the comparison groups:** The correct comparator is employees at the same job family, same level, and same location tier. Comparing a Senior Engineer to a Junior Engineer is not a pay equity analysis -- it is an expected pay difference. The equity question is: among all Senior Engineers at the same level and location tier, are there unexplained gaps by protected class?
- **Use compa-ratio as the normalizing metric:** Compa-ratio = employee salary / band midpoint. A compa-ratio of 1.00 means the employee is paid exactly at midpoint. Below 0.90 is typically considered underpaid relative to band. Above 1.10 is above midpoint. Compa-ratio allows comparison across roles that have different midpoints.
- **Analyze compa-ratio distributions by dimension:**
  - **Gender:** Is the average compa-ratio for women in a given level materially lower than for men? A gap of more than 2-3 percentage points within the same role/level warrants investigation.
  - **Race/ethnicity:** If demographic data is available and employees have consented to its use in this analysis, compare compa-ratio distributions. Note: collecting and using race/ethnicity data for compensation analysis is legally permissible in the US (EEOC-compliant) and many other jurisdictions, but must be handled with appropriate data governance.
  - **Tenure cohort:** Compare employees hired in the last 2 years vs. employees with 5+ years of tenure in the same role/level. Tenure bias (long-tenured employees being paid less than recent hires due to market increases outpacing merit raises) is extremely common and often the largest pay equity issue a company will find.
  - **Manager assignment:** Compare compa-ratios across teams with different managers. Manager discretion in compensation recommendations is a significant source of pay inequity.
- **Statistical approach for larger datasets:** For companies with 50+ employees in a role family, run a multivariate regression with base salary as the dependent variable and level, location tier, tenure, and performance rating as the independent variables. The residuals -- the portion of salary variance not explained by these legitimate factors -- are the unexplained pay gap. Gaps exceeding 3-5% in the residual analysis warrant remediation.
- **Report gaps precisely:** Express gaps as percentage differences in compa-ratio, not just raw dollar amounts. "$8,000 gap between male and female engineers" is less informative than "female engineers at E3 have an average compa-ratio of 0.93 vs. 0.99 for male engineers at E3 -- a 6.5% unexplained gap."
- **Interpret gaps carefully:** A statistical gap is not prima facie evidence of intentional discrimination. It is a flag for investigation. Common legitimate explanations include: inherited pay from acquisition, different offer negotiation outcomes (which themselves may reflect systemic bias), different performance rating histories. Common illegitimate explanations: manager bias, inconsistent offer-making, failure to give merit increases equally. Document the investigation, not just the gap.
- **Establish a tolerance threshold:** Define what gap size is acceptable vs. requires action. Common thresholds: less than 2% gap = within tolerance; 2-5% = monitor and include in next review cycle; greater than 5% = prioritize for current cycle remediation.

---

### Step 8: Build Adjustment Recommendations and Budget

Translate the analysis into actionable decisions with costs, priorities, and rationale.

- **Bring all employees to band minimum first:** This is the non-negotiable first priority. An employee below band minimum is paid outside the company's stated policy. This creates legal risk (particularly in jurisdictions with pay transparency laws), retention risk, and morale risk if discovered.
- **Address pay equity gaps second:** After mandatory compliance (minimum floor), address statistically significant pay equity gaps. These have legal risk exposure and cultural cost.
- **Market adjustment for below-midpoint employees third:** Employees with compa-ratios below 0.90 in good standing are retention risks. Prioritize employees who are also high-performing and/or in roles with active recruiting competition.
- **Employees above band maximum:** Do not reduce pay. Options: (a) promote them if their scope warrants it, (b) freeze merit increases until the band catches up through annual market adjustments, (c) convert future merit budget to lump-sum bonuses that do not compound into base, (d) flag for a band review if multiple employees in a role are above max (may indicate the band midpoint is below market).
- **Budget modeling:**
  - Sum the annual cost of all proposed increases, including employer payroll taxes (7.65% on amounts below $168,600 for Social Security + Medicare; Medicare-only above the cap). This is the true cost to the company, not just the employee-visible increase.
  - Express both the annualized cost and the out-of-pocket cost through fiscal year end (if increases are mid-cycle).
  - Sequence increases by priority when total budget is constrained. Provide the minimum budget (priority 1 and 2 only) and the recommended budget (all priorities).
- **Implementation timeline:** Specify when adjustments take effect (first of next month, next pay cycle, next performance review date). Retroactive adjustments are sometimes appropriate for significant underpayment -- note the cash-flow impact.
- **Communication guidance:** Briefly note how adjustments should be communicated to employees. Equity adjustments and below-minimum corrections should be presented as "the company correcting a gap in our process," not as performance-driven merit increases. Conflating the two creates confusion.

---

## Output Format

```
## Compensation Benchmarking: [Company Name / Job Family]
**Analysis date:** [Month YYYY]
**Prepared for:** [HR / Compensation Committee / Exec Team]

---

### 1. Compensation Philosophy

**Market position:**
- Base salary: [X]th percentile
- Target total cash (base + bonus): [X]th percentile
- Total compensation (including equity and benefits): [X]th percentile

**Equity strategy:** [e.g., All employees receive RSUs / Options reserved for E4 and above / No equity program]

**Bonus structure:**
| Level | Target Bonus (% of base) | Min Payout | Max Payout |
|-------|--------------------------|------------|------------|
| IC1-IC2 | [X]% | 0% | [X]% |
| IC3-IC4 | [X]% | 0% | [X]% |
| M1-M2 | [X]% | 0% | [X]% |
| Director+ | [X]% | 0% | [X]% |

**Geographic pay policy:** [Location-based / National / Tiered]

| Tier | Cities / Region | Index |
|------|----------------|-------|
| Tier 1 | [SF, NYC, Seattle, Boston] | 100% |
| Tier 2 | [Austin, Denver, Chicago, LA] | [X]% |
| Tier 3 | [All other US metros] | [X]% |

**Pay transparency level:** [Open / Band-transparent / Manager-visible / Confidential]

**Market data sources used:**
- Primary: [Survey name, date, job code(s)]
- Secondary: [Public aggregator, method]
- Peer data: [Source description, sample size]

---

### 2. Job Architecture

| Level | Track | Title | Level Definition Summary | Survey Code Match |
|-------|-------|-------|--------------------------|-------------------|
| IC1 | IC | [e.g., Associate Engineer] | [Scope description] | [e.g., Radford P1] |
| IC2 | IC | [e.g., Engineer] | [Scope description] | [e.g., Radford P2] |
| IC3 | IC | [e.g., Senior Engineer] | [Scope description] | [e.g., Radford P3] |
| IC4 | IC | [e.g., Staff Engineer] | [Scope description] | [e.g., Radford P4] |
| M1 | Mgmt | [e.g., Engineering Manager] | [Scope description] | [e.g., Radford M3] |
| M2 | Mgmt | [e.g., Senior EM / Director] | [Scope description] | [e.g., Radford M4] |

---

### 3. Compensation Bands (Tier 1 Baseline)

| Level | Band Min | Midpoint | Band Max | Spread | Market Source | Percentile Anchored |
|-------|---------|----------|---------|--------|---------------|---------------------|
| IC1 | $[X] | $[X] | $[X] | [X]% | [Survey / Date] | [X]th |
| IC2 | $[X] | $[X] | $[X] | [X]% | [Survey / Date] | [X]th |
| IC3 | $[X] | $[X] | $[X] | [X]% | [Survey / Date] | [X]th |
| IC4 | $[X] | $[X] | $[X] | [X]% | [Survey / Date] | [X]th |
| M1 | $[X] | $[X] | $[X] | [X]% | [Survey / Date] | [X]th |
| M2 | $[X] | $[X] | $[X] | [X]% | [Survey / Date] | [X]th |

**Band overlap between adjacent levels:**
| Pair | Overlap Range | Overlap % |
|------|--------------|-----------|
| IC2 → IC3 | $[X] -- $[X] | [X]% |
| IC3 → IC4 | $[X] -- $[X] | [X]% |
| IC4 → M1 | $[X] -- $[X] | [X]% |

---

### 4. Total Compensation Model (Midpoint, Tier 1)

| Component | IC1 | IC2 | IC3 | IC4 | M1 | M2 |
|-----------|-----|-----|-----|-----|----|----|
| Base salary | $[X] | $[X] | $[X] | $[X] | $[X] | $[X] |
| Target bonus (value) | $[X] | $[X] | $[X] | $[X] | $[X] | $[X] |
| Equity (annual value) | $[X] | $[X] | $[X] | $[X] | $[X] | $[X] |
| Health insurance (employer cost) | $[X] | $[X] | $[X] | $[X] | $[X] | $[X] |
| 401(k) match | $[X] | $[X] | $[X] | $[X] | $[X] | $[X] |
| Other benefits / perks | $[X] | $[X] | $[X] | $[X] | $[X] | $[X] |
| **Total compensation** | **$[X]** | **$[X]** | **$[X]** | **$[X]** | **$[X]** | **$[X]** |

**Equity value methodology:** [Describe calculation method -- e.g., RSU value = 30-day avg price × grant shares / vest years; Options = (FMV - strike) × shares × liquidity discount / vest years]

---

### 5. Current Employee Analysis

| Employee ID | Level | Location Tier | Current Salary | Adj. Midpoint | Compa-Ratio | Position | Flag |
|-------------|-------|--------------|---------------|---------------|-------------|----------|------|
| EMP-001 | IC3 | Tier 1 | $[X] | $[X] | [X.XX] | [X]% above/below mid | [Below min / At band / Above max] |
| EMP-002 | IC3 | Tier 2 | $[X] | $[X] | [X.XX] | [X]% above/below mid | |
| ... | | | | | | | |

**Compa-ratio distribution:**

| Segment | Count | % of Group |
|---------|-------|------------|
| Below 0.85 (at risk -- significantly underpaid) | [X] | [X]% |
| 0.85-0.90 (below midpoint, monitor) | [X] | [X]% |
| 0.90-1.10 (at market) | [X] | [X]% |
| 1.10-1.20 (above midpoint) | [X] | [X]% |
| Above 1.20 (above band max or near ceiling) | [X] | [X]% |

---

### 6. Pay Equity Analysis

| Dimension | Group A | Group B | Avg Compa-Ratio A | Avg Compa-Ratio B | Gap (pp) | Status |
|-----------|---------|---------|-------------------|-------------------|----------|--------|
| Gender (controlling for level + location) | [Men] | [Women] | [X.XX] | [X.XX] | [X] pp | [Within tolerance / Investigate / Remediate] |
| Tenure (<2 yrs vs. 5+ yrs) | [<2 yr] | [5+ yr] | [X.XX] | [X.XX] | [X] pp | |
| [Race/ethnicity -- if data available] | [Group] | [Group] | [X.XX] | [X.XX] | [X] pp | |

**Methodology note:** [Describe the comparison method -- e.g., compa-ratio comparison within same level and location tier; multivariate regression controls used]

**Tolerance threshold used:** Gaps < [X]% = within tolerance; [X-Y]% = monitor; > [Y]% = remediate

---

### 7. Adjustment Recommendations

| Priority | Description | Employees Affected | Current Avg | Proposed Avg | Annual Cost | Employer Tax Cost | Total Cost |
|----------|-------------|-------------------|-------------|--------------|-------------|-------------------|------------|
| 1 -- Band minimum | Bring below-minimum employees to band min | [X] employees | $[X] | $[X] | $[X] | $[X] | $[X] |
| 2 -- Pay equity remediation | Address [X]-gap findings | [X] employees | $[X] | $[X] | $[X] | $[X] | $[X] |
| 3 -- Market adjustment | Compa-ratio < 0.90, high retention risk | [X] employees | $[X] | $[X] | $[X] | $[X] | $[X] |
| **Subtotal (Priority 1+2 -- minimum required)** | | | | | **$[X]** | **$[X]** | **$[X]** |
| **Subtotal (Priority 1+2+3 -- recommended)** | | | | | **$[X]** | **$[X]** | **$[X]** |

**Employees above band maximum ([X] total):**
[Describe the approach: freeze base merit, offer lump-sum, evaluate for promotion, or initiate band review]

**Implementation timeline:** [Date and sequencing]

---

### 8. Methodology Notes and Caveats

- Market data source(s) and date(s):
- Market movement adjustment applied (if any):
- Limitations of analysis:
- Recommended review cadence:
- Next full benchmarking update due:
```

---

## Rules

1. **Never benchmark base salary in isolation.** Any compensation recommendation that does not include an estimated total compensation value (base + bonus + equity + benefits) is incomplete and will produce misleading comparisons. An employee evaluating an offer or a company evaluating its competitiveness cannot make sound decisions from base salary alone.

2. **Midpoints must be traceable to a specific data source.** Every band midpoint must reference a survey name, survey date, job code, and target percentile. "We looked at Glassdoor" is not a data source methodology. Untraced midpoints cannot be defended to leadership, employees, or regulators.

3. **Compa-ratio is the universal normalization metric -- always calculate it.** Employee salary divided by adjusted band midpoint (adjusted for location tier if applicable). An employee at $175,000 against a $200,000 midpoint has a compa-ratio of 0.875 -- which means they are 12.5% below midpoint, not just "$25,000 behind." The ratio enables cross-role comparison; raw dollar gaps do not.

4. **Pay equity analysis must control for level and location before comparing groups.** Comparing average salaries across gender groups without controlling for level distribution is a common and misleading error. If more men are at senior levels, the raw gender gap will look worse than the within-level gap. Always use compa-ratio at the same level and location tier as the comparison unit.

5. **Band spreads must increase with seniority.** Entry-level bands should be narrow (20-25% spread); senior and management bands should be wider (35-50%). Applying a uniform 20% spread across all levels compresses senior bands and prevents appropriate differentiation for experienced employees. This is one of the most common compensation architecture errors.

6. **Adjacent bands must overlap by at least 15%.** A band structure with no overlap between adjacent levels creates mechanical step-ups on every promotion and does not allow for high-performing employees who earn above their current band without being ready for promotion. Overlapping bands require clear guidance on how promotion and within-band advancement decisions interact.

7. **Geographic pay adjustments must be based on cost of labor, not cost of living.** These are different indexes. Cost of living measures what employees spend; cost of labor measures what other employers pay for the same talent in that market. In the 2020-2024 period, cities like Austin and Miami saw cost-of-labor increases outpace cost-of-living increases dramatically. Using cost-of-living data to set location adjustments will underpay employees in competitive secondary markets.

8. **Equity value must include a liquidity or risk discount for pre-IPO companies.** 10,000 stock options at a $30 FMV with a $2 strike price is worth $280,000 gross -- but for an employee at a Series B startup, the probability-weighted, time-discounted value might be $40,000-$80,000 after accounting for dilution, liquidity risk, tax events, and the length of time to exit. Present equity value conservatively and explain the methodology. Overstating equity value damages trust when liquidity events disappoint.

9. **Employees above band maximum should never receive pay cuts.** The correct responses are: freeze base merit increases, offer lump-sum bonuses from merit budget, promote the employee if scope warrants it, or initiate a band review if multiple employees are above max (which suggests the market has moved and the band is stale). Reducing pay creates immediate legal risk and destroys retention.

10. **Market data must be refreshed at least annually; high-competition roles should be reviewed every 6 months.** Compensation survey data is typically 12-18 months old by the time it reaches users. In hot talent markets (ML engineering, cybersecurity, clinical data science), a 12-month-old benchmark can be 10-20% below the current market. Set a review schedule in the output and flag which roles warrant mid-cycle review based on their market volatility.

11. **A pay equity gap requires documentation of the investigation, not just the number.** Finding a 7% compa-ratio gap between male and female engineers at the same level does not automatically mean discrimination, but it does require a documented investigation of its causes. The output must include next steps -- who will investigate, by what date, and what a remediation decision will look like. Producing a gap analysis without a response plan creates liability without action.

12. **Bonus targets must be expressed as target payout, not maximum.** Presenting a 20% max bonus as the "bonus opportunity" misrepresents expected value. Always express bonus as target (expected payout in a normal performance year) alongside the range (0% to maximum). This is particularly important in total compensation comparisons where inflated bonus assumptions would overstate competitive positioning.

---

## Edge Cases

### Early-Stage Startup with No Compensation Infrastructure
A pre-Series A or seed company often has 5-20 employees, no HR function, no formal levels, and no survey access. Do not build a 6-level architecture with Radford survey data -- it will be irrelevant in 12 months and waste the team's time.

Instead: Build a simple 4-level structure (Associate, Mid, Senior, Lead/Manager) using free and low-cost data sources: Levels.fyi for engineering, LinkedIn Salary, and VC portfolio comp databases (Carta Total Comp, Option Impact) if accessible. Acknowledge that equity is a significant component of the value proposition and build an equity value model using the most recent 409A valuation with an explicit risk disclosure. State the philosophy as: "We pay Xth percentile on cash today; our equity represents our commitment to sharing in the outcome." Review quarterly in the first two years -- the market will move faster than the business.

### Fully Distributed / International Team
When a company has employees in multiple countries, a single US-anchored comp structure does not work. Each country has:
- Different statutory benefits (pension contributions, healthcare, parental leave mandates, vacation minimums) that affect the true cost to employer and value to employee
- Different tax treatment of equity (UK EMI schemes, French BSPCEs, German Mitarbeiterbeteiligungen all have distinct tax consequences)
- Different labor law governing classification, termination, and comp transparency

For international compensation: build separate band structures for each country. Use local salary surveys (e.g., Radford Global Technology Survey, Robert Half local salary guides, Mercer International) rather than applying an exchange-rate conversion to US data. Statutory benefits are not optional -- they must be included in the total compensation model and they often exceed what US employers voluntarily provide. Do not express international salaries in USD in the primary output; use local currency with USD equivalent in parentheses for reference.

### Acquired Company Integration
When a company is acquired and must merge compensation structures, the acquiring company's bands may not accommodate all acquired employees cleanly. Common issues: acquired company paid above-market cash with less equity; acquired company had flat band structure without levels; acquired employees fall outside the acquirer's leveling rubric.

Approach: Map each acquired employee to the acquiring company's closest level using both job description and current salary as inputs. Do not use title matching alone -- an acquired "Senior Engineer" may map to IC3 or IC4 depending on scope. For employees who fall above band maximum after mapping, use a transition period (typically 12-24 months) with frozen base merit but with lump-sum bonuses or accelerated equity grants to maintain retention. Never cut pay on acquisition close -- it immediately surfaces as a retention risk and is often contractually prohibited by deal terms.

### Non-Profit, Government, or Mission-Driven Organizations
Total compensation comparison for non-profits must explicitly quantify the value of benefits that typically exceed private-sector packages: PSLF loan forgiveness eligibility (present value of up to $120,000 in student debt forgiveness over 10 years), defined-benefit pension plans (actuarial value of a 2% per-year DB pension can be $50,000-$150,000 in present value), above-market PTO, and strong job security. Without quantifying these, non-profit compensation appears to be simply below-market, which undervalues the full package.

Benchmarking sources: use SHRM's Non-Profit Compensation Survey, GuideStar salary data, and sector-specific surveys (YMCA, hospital systems, universities, foundations each have sector surveys). For government roles, use OPM GS-scale data for federal benchmarking and BLS Occupational Employment Statistics for state and local.

### Highly Specialized or Emerging Roles with No Market Comparables
Some roles have no direct survey match (Machine Learning Safety Researcher, Autonomous Vehicle Sensor Fusion Engineer, Climate Finance Analyst). When direct benchmarking is impossible:

1. Identify the 2-3 closest analogous roles with survey data. A Sensor Fusion Engineer might be benchmarked as a hybrid of Senior Software Engineer (Radford P3) and Systems Researcher at 50/50 weight.
2. Apply a supply/demand scarcity premium. If the role requires skills with fewer than 10,000 qualified professionals globally and the company has active competition from 5+ named competitors, justify a 10-20% premium above the blended benchmark.
3. Use competitive offer data if available. Three concrete offers the role has received in the last 6 months is better market data than any survey for a unique role. Document them as N=3 data points with the caveat that this is not statistically significant.
4. Review annually -- emerging roles often have survey coverage added within 2-3 years as the talent market matures.

### Compensation Band Compression from Rapid Market Growth
When a company has operated with the same bands for 2-3 years during a period of rapid market growth (e.g., 2020-2022 tech market), the result is often: new hires entering at band midpoint at current market rates, while 3-5 year tenured employees are stuck near the same midpoint due to 3-5% annual merit increases. This is inversion or compression -- long-tenured employees earning the same as or less than recent hires in similar roles.

Resolution: The only correct fix is to update the bands to current market and then assess every employee's compa-ratio against the new midpoints. Many long-tenured employees will show below-midpoint compa-ratios on the updated bands and require market adjustments. This is expensive but the alternative (flight of experienced employees) is more expensive. Model the full cost of market adjustments vs. the cost of replacing a senior employee (typically 50-200% of annual salary in recruiting and ramp time). Present this trade-off explicitly in the budget recommendation.

### Pay Transparency Law Compliance
As of 2024, California, Colorado, New York, Washington, and several other jurisdictions require salary range disclosure in job postings. Some require disclosure to internal employees upon request or promotion. If the company operates in these states, compensation bands are no longer an internal-only document -- they become public-facing.

This creates several requirements:
- Bands must be defensible as a real range -- a band of $50,000 to $500,000 is not compliant in spirit and may trigger regulatory attention in some jurisdictions
- The range posted in a job description must match the actual band for the role, not a narrower window
- Internal pay transparency policy must align with external posting requirements or employees will discover mismatches
- Review all bands for defensibility before advising the company to go live with external job postings

Flag this as a compliance item in any output where the company is hiring in affected jurisdictions.

---

## Example

**Input:**
"We're a 90-person Series C SaaS company ($45M ARR, SF HQ, hybrid remote). I need to build out compensation bands for the engineering organization. We have 8 IC1s (entry), 18 IC2s (mid), 14 IC3s (senior), 6 IC4s (staff), and 4 Engineering Managers (M1). We want to be at the 50th percentile for base, 60th for total cash. Our current 409A is $18/share, option strike price for new grants is $18, and we grant monthly-vesting 4-year options. We do a 4% 401k match up to IRS limits. We have geographic tiers -- about 40% are SF Bay Area, 35% are Tier 2 cities (Austin, Denver, Atlanta), and 25% are Tier 3 (smaller metros). We haven't done a formal comp review in 18 months and suspect we have some compression from 2021 hires."

---

**Output:**

## Compensation Benchmarking: [Company] Engineering Organization
**Analysis date:** Q1 2025
**Prepared for:** VP Engineering, Head of People

---

### 1. Compensation Philosophy

**Market position:**
- Base salary: 50th percentile (match market)
- Target total cash (base + bonus): 60th percentile
- Total compensation: Modeled below; equity is below-cash-value pre-liquidity and should be supplemented with competitive cash

**Bonus structure:**
| Level | Target Bonus (% of base) | Min Payout | Max Payout |
|-------|--------------------------|------------|------------|
| IC1-IC2 | 5% | 0% | 10% |
| IC3-IC4 | 8% | 0% | 16% |
| M1 | 15% | 0% | 30% |

*Note: To reach 60th percentile target total cash from 50th percentile base, bonus targets must be executed at or above 100% of target. Validate that bonus plan mechanics deliver expected payout in average performance years.*

**Geographic pay policy:** Three-tier location-based pay

| Tier | Cities / Region | Index |
|------|----------------|-------|
| Tier 1 | SF Bay Area, NYC, Seattle, Boston | 100% |
| Tier 2 | Austin, Denver, Atlanta, Chicago, LA | 88% |
| Tier 3 | All other US metros | 80% |

*Cost-of-labor index sourced from Radford North America Technology Survey geographic differentials (2024). Note: Austin and Denver Tier 2 indices have increased from ~82% in 2021 to ~88% today -- 18-month-old bands likely understate current Tier 2 market rates.*

**Pay transparency level:** Band-transparent (employees see their own band; individual salaries are confidential). Required for CA job postings under EPCA. Bands must be published in all external job postings for roles based in California.

**Market data sources:**
- Primary: Radford North America Technology Survey, Q3 2024, Engineering job codes P2-P5 (IC levels), M3 (EM)
- Secondary: Levels.fyi public aggregated data for SF Software Engineering (directional validation)
- Peer data: VC network comp consortium data (5 comparable Series C SaaS companies, N=280 engineers) -- used for calibration only

---

### 2. Job Architecture

| Level | Track | Title | Level Definition Summary | Survey Code Match |
