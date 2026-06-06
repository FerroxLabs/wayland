---
slash_command: false
name: sales-contacts
description: "Map the buying committee for a target company using OSINT only - no scraping of platforms whose ToS forbid it (LinkedIn §8.2, Glassdoor, G2). Identifies decision makers from public sources, classifies them by buying role (Economic Buyer, Champion, Technical Evaluator, End User, Blocker, Coach), finds public-information personalization anchors per contact (no impersonation, no fabricated mutual connections), and proposes a multi-threading outreach sequence subject to downstream sales-outreach Phase 0 jurisdiction gates. Templates and analytical tools only - not legal, marketing-compliance, or data-protection advice. Trigger phrases: 'who are the decision makers at <url>', 'find the buying committee', 'map contacts at <company>', '/sales contacts <url>', '/sales-contacts <url>'. Also runs as the Contact Access dimension subagent under /sales prospect."
version: 1.1.0
as_of: 2026-05-03
author: Wayland Business Pack (port of zubair-trabzada/ai-sales-team-claude)
license: MIT
metadata:
  wayland:
    tags: [sales, contacts, decision-makers, persona, outreach, business, smb, osint, gdpr-art14]
    related_skills: [sales-prospect, sales-research, sales-outreach]
prerequisites:
  python_packages: []
attribution:
  lineage: "Wayland Business Suite (Original)"
---

> **Templates and analytical tools only - not legal, marketing-compliance, or data-protection advice.** Contact mapping touches LinkedIn ToS §8.2 (no scraping), GDPR Art. 14 (indirect-collection notice for EU/UK persons), CCPA/CPRA (CA persons), and CAN-SPAM / CASL / UWG §7 / ePrivacy on any downstream outreach. Never fabricate mutual connections, impersonate referrals, or claim shared experience that is not factually verifiable.

# Sales Contacts

Identify and map the buying committee at a prospect company. Score contact access, build personalization anchors per contact, and propose a multi-threading outreach sequence. Runs standalone via `/sales-contacts <url>` or as the Contact Access subagent during `/sales prospect`.

## When to Use

Trigger phrases: "who are the decision makers at <url>", "map the buying committee at <company>", "find contacts for outreach at <url>", `/sales contacts <url>` (verb form), `/sales-contacts <url>` (flat form).

Do NOT use for: full prospect qualification across all dimensions (`sales-prospect`), pure company research with no people focus (`sales-research`), drafting the actual outreach copy (`sales-outreach`).

## Invocation Modes

This skill is **dual-mode**.

**Standalone mode** (`/sales-contacts <url>`)
- User passes a URL or company name. Skill fetches team / about / contact / press / leadership pages, runs LinkedIn searches, classifies the buying committee, and writes a Markdown report.
- Default output path: `build_report_path("business-sales", instruction)` - typically `.wayland/business-sales/<timestamp>-<slug>.md`. Caller may override via `out_path`.

**Subagent mode** (invoked by `sales-prospect` via `delegate_task(tasks=[...])`)
- Parent pre-fetches team / about / contact pages and passes them in `context.pages` so the child does not re-fetch.
- Child receives a fully self-contained `context` payload - no parent context leaks otherwise.
- Child may still run targeted `web_search` queries for LinkedIn discovery (children have `web` in their toolset). Toolset is `[terminal, file, web]` - `execute_code` is blocked.
- Child returns JSON matching `output_schema` AND writes a per-dimension Markdown file to `out_path`.

## Inputs

Standalone: `url` (required), `company_name` (optional), `pages` (optional pre-fetched `{role: text}`), `icp_context` (optional ICP doc to match buyer personas), `out_path` (optional).

Subagent `context`: `company_name`, `company_url`, `pages` (e.g. `{team, about, contact, press, leadership, careers}`), `page_map`, `icp_context`, `scoring_rubric`, `output_schema`, `out_path`.

## Workflow

### Phase 1: Contact Discovery

**1.1 Team page analysis.** Fetch (standalone via `web_extract`, falling back to `terminal` + `curl --max-filesize 200000` for large pages) or read from `context.pages` (subagent):

| Page | Common URLs | Data to Extract |
|------|-------------|-----------------|
| **Team page** | /team, /about/team, /leadership, /people, /our-team | Names, titles, photos, bios, social links |
| **About page** | /about, /company, /about-us | Founders, leadership mentions, team size |
| **Contact page** | /contact, /get-in-touch | Individual contact emails, department contacts |
| **Press page** | /press, /news, /newsroom | Spokesperson names, quoted executives |
| **Board page** | /investors, /board, /advisors | Board members, advisors, investors |
| **Careers page** | /careers, /jobs | Hiring manager names, team structure clues |

For each page: identify all person names + titles, capture LinkedIn profile links, capture bio text for personalization, note email patterns, record whether profile photos are present.

**1.2 LinkedIn research.** Use `web_search` (capped at 5 results per call) with these queries:

```
Search 1: "[company name] CEO founder LinkedIn"
Search 2: "[company name] CTO VP Engineering LinkedIn"
Search 3: "[company name] VP Sales Chief Revenue Officer LinkedIn"
Search 4: "[company name] VP Marketing CMO LinkedIn"
Search 5: "[company name] Head of [relevant department] LinkedIn"
Search 6: "[company name] Director [relevant function] LinkedIn"
Search 7: "[company name] [specific title from team page] LinkedIn"
```

For each person: full name, current title and tenure, previous companies and roles, education, location, LinkedIn headline, recent posts or articles (last 3-6 months), shared connections or groups, skills and endorsements.

**1.3 Org chart mapping.** Step 1: identify the CEO/Founder. Step 2: map direct reports (CTO, CRO/VP Sales, CMO, CFO, COO, CPO). Step 3: map next level (Directors / Heads of). Step 4: identify individual contributors of interest (technical leads who evaluate tools, sales managers who feel the pain, marketing managers who influence decisions).

```
[CEO/Founder] - CEO/Co-founder
├── [CTO] - CTO / VP Engineering
│   ├── [Engineering Lead] - Director of Engineering
│   ├── [DevOps Lead] - Head of DevOps/Infrastructure
│   └── [Product Lead] - VP Product / Director of Product
├── [CRO] - CRO / VP Sales
│   ├── [Sales Manager] - Director of Sales / Head of Sales
│   ├── [SDR Lead] - SDR Manager / Head of Business Development
│   └── [CS Lead] - VP Customer Success / Head of CS
├── [CMO] - CMO / VP Marketing
│   ├── [Demand Gen] - Director of Demand Generation
│   ├── [Content Lead] - Head of Content
│   └── [Growth Lead] - Head of Growth
├── [CFO] - CFO / VP Finance
└── [COO] - COO / VP Operations
```

Use "[Unknown - likely exists]" for roles that almost certainly exist but where no name was found. Leave out roles unlikely to exist given the company size.

**1.4 Email pattern detection.**

| Pattern | Example |
|---------|---------|
| firstname@company.com | john@acme.com |
| firstname.lastname@company.com | john.smith@acme.com |
| firstinitial.lastname@company.com | j.smith@acme.com |
| firstname.lastinitial@company.com | john.s@acme.com |
| firstinitiallastname@company.com | jsmith@acme.com |

Detect via emails on contact page, author emails on blog posts, mailto links, press release PR contacts, signatures in case studies.

### Phase 2: Buying Committee Role Classification

Classify each contact into one or more of the 6 roles:

**Economic Buyer.** Controls budget, gives final sign-off. Titles: CEO, CFO, CRO, VP of [department], General Manager. Identify: budget authority for the relevant department; "Chief", "VP", or "General Manager" in title; in startups: CEO or CTO; in mid-market: VP/Director of the using department; in enterprise: committee with VP+ sign-off. Why: without their approval, the deal stalls. Cares about ROI, risk, strategic alignment.

**Champion.** Internal advocate who pushes for your solution. Titles: Manager, Senior Manager, Team Lead, Director (mid-level with the pain). Identify: works in the department that uses your product daily; experiences the pain first-hand; has influence to recommend solutions to leadership; may have used your product or a competitor at a previous company; posts about the problem space on LinkedIn or industry forums. Why: champions sell for you when you are not in the room. Without one, deals are 3x less likely to close. They provide insider intelligence on the buying process.

**Technical Evaluator.** Assesses technical fit, integrations, security, implementation. Titles: CTO, VP Engineering, IT Director, Solutions Architect, Security Officer. Identify: technical role with evaluation authority; responsible for tech stack/infra decisions; veto power on technical grounds; runs POC or technical demo sessions. Why: can kill a deal on technical grounds. Cares about APIs, integrations, security, scalability, uptime.

**End User.** Will use the product daily; their adoption determines long-term success. Titles: individual contributors, analysts, coordinators, specialists. Identify: role aligns with daily use case; may not have buying authority but has influence on adoption. Why: their feedback influences champion + economic buyer. Poor UX = churn risk even after closing. Can provide bottom-up demand (PLG motion).

**Blocker.** May resist due to competing priorities, incumbent vendor loyalty, or change aversion. Titles: any level - often the person who chose the current solution or benefits from the status quo. Identify: championed the current vendor; vested interest in maintaining the status quo; threatened by a new tool; risk-averse "if it's not broken" mindset. Why: unidentified blockers cause deals to die silently. Must be neutralized or converted early. Understanding their objections helps you address them proactively.

**Coach.** Internal contact who shares info on buying process, competitors, internal dynamics. Titles: any level - often someone you already know. Identify: former colleague or mutual connection; responded positively to outreach; engages with your content/webinars; junior or mid-level person willing to share insights. Why: invaluable insider information. Helps navigate the org and avoid landmines. Often becomes a champion if nurtured correctly.

**Role assignment matrix.**

| Contact Name | Title | Primary Role | Secondary Role | Confidence |
|-------------|-------|--------------|----------------|------------|
| [name] | [title] | [Economic Buyer/Champion/...] | [optional second role] | [High/Medium/Low] |

**Role-mapping by company size:**
- One person can fill multiple roles (especially in smaller companies).
- Under 20 people: the CEO often fills Economic Buyer + Champion + Technical Evaluator.
- Under 50 people: expect 2-3 people in the buying committee.
- 50-200: expect 3-5 people in the buying committee.
- 200+: expect 5-8+ people in the buying committee.

### Phase 3: Personalization Anchors

For each priority contact (top 3-5), research: **Recent LinkedIn Activity**, **Career History**, **Published Content** (blog posts, podcast appearances, conference talks), **Shared Connections** (mutual LinkedIn, alumni, communities), **Interests and Hobbies**, **Recent Trigger Events** (new role, promotion, funding, launch, awards).

Rate each anchor:

| Rating | Definition | Example |
|--------|-----------|---------|
| **Strong** | Specific, recent, directly relevant - can carry an entire email opener | Contact posted about the exact problem you solve 2 weeks ago |
| **Moderate** | Somewhat specific - requires a bridge to the outreach | Contact recently changed jobs (trigger event, but not directly related) |
| **Weak** | Generic or old - better than nothing but no compelling hook | Contact attended a well-known university |

**Minimum standard:** every outreach email must contain at least one Strong anchor or two Moderate anchors. If only Weak anchors exist, flag as a limitation and recommend additional research.

### Phase 4: Multi-Threading Strategy (Gatekeeper Navigation)

Multi-threading means engaging multiple stakeholders in parallel or sequence. Deals with 3+ engaged contacts are 2-3x more likely to close than single-threaded deals.

| Company Size | Recommended Threads | Approach |
|-------------|---------------------|----------|
| **1-20 employees** | 1-2 contacts | Founder/CEO + one other key person. Keep it simple. |
| **21-100 employees** | 2-3 contacts | Economic buyer + champion + technical evaluator. Stagger outreach by 2-3 days. |
| **101-500 employees** | 3-4 contacts | Economic buyer + champion + technical evaluator + end user. Use different channels per role. |
| **500+ employees** | 4-6 contacts | Full buying committee coverage. Different messaging angle per role. Coordinate timing. |

**Sequence:**
- **Day 0-1: Engage the Champion.** Start with the person most likely to feel the pain. Most personalized message. Goal: get a response and establish dialogue.
- **Day 2-3: Connect with the Economic Buyer.** LinkedIn connection request with custom note; separate email thread (not CC'd with champion). Goal: get on their radar with a strategic message.
- **Day 5-7: Engage the Technical Evaluator.** Technical content or case study; mention integrations and security. Goal: pre-empt technical objections.
- **Day 7-10: Warm the End Users.** Share a relevant resource or webinar invite; focus on daily workflow improvements. Goal: build bottom-up demand.

**Coordination rules.** Never CC multiple contacts in the same thread unless they are already in conversation. Each contact gets messaging tailored to role. If one thread goes cold, reference it obliquely in another ("Your team has been exploring..."). Share different but complementary content per contact. Track all touchpoints to avoid over-contacting.

## Scoring rubric

Preserved verbatim from the source agent - used as the contract in subagent mode and to populate the score breakdown in standalone reports.

- **Decision Makers Identified (0-10)** - Have you identified the key people involved in a purchase? Can you name the economic buyer, technical buyer, and likely champion?
- **Contact Info Quality (0-10)** - How easy would it be to actually reach these people? Public email, LinkedIn, active on social?
- **Personalization Depth (0-10)** - How many strong personalization anchors? Can you write a message that feels personal, not templated?
- **Warm Paths (0-10)** - Are there feasible warm intro paths? Mutual connections, shared communities, events?
- **Multi-Threading Potential (0-10)** - Can you reach multiple people in the buying committee? Is there a multi-threaded strategy available?

Calibration: 9-10 exceptional (multiple decision makers named, strong anchors, clear warm paths, ready to write a highly personalized email); 7-8 strong (key decision makers identified, good hooks, at least one warm path); 5-6 moderate (some contacts but missing roles, limited personalization); 3-4 weak (few contacts, generic info only, cold outreach is the only option); 1-2 poor (almost no info, opaque company); 0 nothing found.

**Contact Access Score** = (Decision Makers Identified + Contact Info Quality + Personalization Depth + Warm Paths + Multi-Threading Potential) / 5 × 10. Yields 0-100. Weighted **20%** in the `sales-prospect` aggregate.

## Output

### Standalone mode - Markdown report

Write to the resolved `out_path` via `file_tools.write`:

```markdown
# Decision Maker Intelligence: <Company>
**URL:** <url> | **Date:** <YYYY-MM-DD>
**Contact Access Score: X/100** | **Buying Committee Size:** <N>
**Email Pattern:** <pattern or "Unknown">

## Executive Summary
<2-3 paragraphs: who the key decision makers are, contact access quality,
recommended engagement approach, multi-threading strategy>

## Buying Committee Map
<table: Name | Title | Buying Role | Personalization Anchor | Approach | Priority>

## Org Chart
<ASCII tree>

## Top 3 Priority Contacts
### Priority 1: <Name> - <Title>
<dossier: tenure, previous company, LinkedIn, estimated email,
personalization anchors w/ strength, career background, recommended approach,
suggested opening message>
### Priority 2 / Priority 3 - same format

## Multi-Threading Strategy
<engagement sequence table: Day | Contact | Channel | Action | Goal>
<messaging by role table: Role | Primary Message | Content to Share | CTA>

## Contact Access Score: X/100
<sub-dimension breakdown table>

## Recommended Outreach Order
<numbered list with rationale>
```

Emit a condensed terminal summary: company, buying committee size, score breakdown (Decision Makers / Contact Info / Personalization / Warm Paths), buying committee names by role, email pattern, recommended first contact and channel, full report path.

### Subagent mode - JSON return + Markdown file

Return JSON matching `context.output_schema` (parent's contract - typical shape):

```json
{
  "dimension": "contacts",
  "dimension_score": 74,
  "subscores": {
    "decision_makers_identified": {"score": 80, "rationale": "<one-line>"},
    "contact_info_quality":       {"score": 70, "rationale": "<one-line>"},
    "personalization_depth":      {"score": 70, "rationale": "<one-line>"},
    "warm_paths":                 {"score": 60, "rationale": "<one-line>"},
    "multi_threading_potential":  {"score": 80, "rationale": "<one-line>"}
  },
  "key_findings": ["<one-line>", "..."],
  "buying_committee": [
    {"role": "Economic Buyer", "name": "...", "title": "...", "confidence": "High"}
  ],
  "priority_contacts": [
    {"name": "...", "title": "...", "buying_role": "...", "anchors": [{"text": "...", "strength": "Strong"}], "opening_angle": "..."}
  ],
  "warm_paths_detail": [
    {"path_type": "...", "detail": "...", "feasibility": "Easy", "strength": "Strong"}
  ],
  "recommendations": [
    {"tier": "immediate|short_term|long_term", "title": "...", "impact": "high|medium|low", "effort": "low|medium|high"}
  ],
  "gaps": ["<missing role or data point>"],
  "report_path": "<absolute out_path>"
}
```

**Scale conversion.** The Contact Access rubric grades each of the 5 sub-dimensions on a 0-10 band. For the canonical JSON above:
- `subscores.<bucket>.score = rubric_value * 10` to land on the 0-100 scale.
- Top-level `dimension_score = round(mean(subscores.*.score))` - equivalent to the historical Contact Access Score (sum / 5 × 10). Both yield the same 0-100 integer.

The aggregator (`sales-prospect` Phase 3) reads `dimension_score` directly. Contact Access is weighted **20%** in the Prospect Score.

Also write the same content as Markdown to `context.out_path`. Section structure: Contact Access Score → Dimension Scores → Buying Committee Map → Priority Contacts → Org Chart (Inferred) → Personalization Anchor Summary → Warm Path Opportunities → Multi-Threading Strategy → Contact Intelligence Gaps.

## Notes

- **Only report contacts you actually found.** Never invent names, titles, or email addresses. If you cannot find a role, say "Not identified" - do not make up a name.
- **Cite sources for every contact** (company website, LinkedIn search result, news article, conference speaker list).
- **Respect privacy.** No personal phone numbers, personal emails, or home addresses. Professional/public information only.
- **Quality over quantity.** 3 well-researched contacts with strong personalization beats 10 names with no context.
- **Be realistic about warm paths.** Don't claim "mutual connections" without evidence - recommend the user check their own network.
- **Note confidence levels.** Inferred titles or roles get "Low confidence" or "Inferred."
- **Flag stale data.** If LinkedIn shows the person left the company, do not include them as a current contact.
- **Personalization must be genuine.** "They work in tech" is not personalization. "They wrote a blog post last month about migrating from monolith to microservices" IS.
- **Adapt by company size.** 1-5 person companies: founder fills most roles. 5000+: focus on the specific division most relevant to your solution.
- **In subagent mode** the child cannot call `execute_code` and should not re-fetch pages already in `context.pages`. If a page role is missing, mark the finding "not analyzable - page not provided" rather than hallucinating.
- **Cross-skill integration.** If `COMPANY-RESEARCH.md` or `IDEAL-CUSTOMER-PROFILE.md` exists in the run dir, read via `file_tools.read` to pre-populate contacts and match buyer personas. Suggested follow-ups after a standalone run: `/sales-outreach` for the email sequence, `/sales-research` for deeper company context.
- **Source legitimacy.** Refuse to ingest contact data scraped from LinkedIn / Glassdoor / G2 / Capterra / Crunchbase free-tier. Use the platform's official API or OSINT (company website, press releases, public registry filings).
- **No fabricated mutual connections.** Warm-path / "shared connections" entries must reference a real, documented relationship - never invent ties to seem familiar with the prospect.

## Output footer (REQUIRED on every contacts report)

End every generated contacts/decision-maker report with this block, verbatim:

```
---
**CONTACT INTELLIGENCE - NOT LEGAL, MARKETING-COMPLIANCE, OR DATA-PROTECTION ADVICE**

Before using these contacts for outreach, the user must:

1. Confirm contact data was sourced via OSINT or official API - not scraped from LinkedIn (§8.2), Glassdoor, G2, Capterra, or Crunchbase free-tier.
2. If any contact is in the EU/UK, satisfy GDPR Art. 14 indirect-collection notice within one month (or before first contact). Document a lawful basis under Art. 6 (typically Art. 6(1)(f) legitimate interest with a documented LIA for B2B; opt-in for B2C).
3. If any contact is in California, satisfy CCPA/CPRA §1798.100(b) notice-at-collection.
4. Honor right-to-object (GDPR Art. 21) and right-to-delete on first request.
5. Outreach derived from this report inherits sales-outreach Phase 0 - refuse cold to DE/AT/CH, refuse without sender postal address for US (CAN-SPAM §5(a)(5)), refuse Framework 4 / mutual-connection without documented referrer permission.

Generated by Wayland business-sales plugin. No warranty, express or implied. Wayland and the plugin authors disclaim all liability for use of this report.
```

---

> _**Templates and analytical tools only - not legal, marketing-compliance, or data-protection advice.** OSINT only; no impersonation; satisfy GDPR Art. 14 / CCPA before processing personal data of identified individuals._
