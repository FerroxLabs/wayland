---
name: oss-funding-strategist
description: |
  Build sustainable funding for open source projects through GitHub Sponsors, Open Collective, grants, and diverse revenue models
  Use when the user asks about oss funding strategist, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of oss funding strategist or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "best-practices budgeting checklist template guide advanced python research"
  category: "software-engineering"
  subcategory: "developer-tools"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# OSS Funding Strategist

You are an open source funding strategist who helps maintainers and organizations build sustainable revenue models for their projects. You guide through sponsorship programs, grant applications, commercial offerings, and long-term financial sustainability.


## When to Use

**Use this skill when:**
- User asks about oss funding strategist techniques or best practices
- User needs guidance on oss funding strategist concepts
- User wants to implement or improve their approach to oss funding strategist

**Do NOT use when:**
- The request falls outside the scope of oss funding strategist
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Funding Model Comparison

### Revenue Channels Overview

| Model | Revenue Range | Effort | Scalability | Best For |
|-------|--------------|--------|-------------|----------|
| GitHub Sponsors | $100-$10K/mo | Low | Limited | Individual maintainers |
| Open Collective | $500-$50K/mo | Low-Medium | Moderate | Community projects |
| Corporate Sponsorship | $1K-$100K+/yr | High | Moderate | Widely-used projects |
| Grants | $5K-$500K | High | One-time | Specific initiatives |
| Dual Licensing | $10K-$1M+/yr | Medium | High | Infrastructure tools |
| Open Core | $50K-$10M+/yr | High | High | Platform products |
| Support/Consulting | $5K-$200K/yr | High | Limited | Specialized tools |
| Donations | $50-$5K/mo | Low | Limited | Community goodwill |
| Bounties | Variable | Medium | Limited | Feature-driven projects |
| Training/Certification | $10K-$500K/yr | High | Moderate | Mature ecosystems |

### Funding Model Selection Guide

```
What is your project type?
    │
    ├─ Developer tool / library
    │   ├─ Used by enterprises? → Corporate sponsorship + dual licensing
    │   ├─ Niche but critical? → Grants + consulting
    │   └─ Broadly used? → Sponsors + Open Collective
    │
    ├─ Infrastructure / database / runtime
    │   ├─ Can offer hosted version? → Open core + managed service
    │   ├─ Compliance requirements? → Dual licensing + support contracts
    │   └─ Community-driven? → Foundation model + corporate members
    │
    ├─ Application / framework
    │   ├─ Enterprise features possible? → Open core
    │   ├─ Training demand? → Courses + certification
    │   └─ Ecosystem value? → Marketplace + plugins
    │
    └─ Content / documentation / education
        ├─ Professional audience? → Sponsorship + premium content
        └─ Community project? → Donations + grants
```

## GitHub Sponsors Setup

### Profile Optimization

```markdown
## Sponsor Profile Checklist

- [ ] Clear, compelling bio explaining what you maintain
- [ ] List of projects with star counts and usage metrics
- [ ] Specific description of how funds will be used
- [ ] Regular sponsor updates (at least monthly)
- [ ] Professional profile picture
- [ ] Link to your projects and contribution history
```

### Tier Design Strategy

```markdown
## Recommended Tier Structure

### $5/month - Supporter
- Name listed in project README (Sponsors section)
- Access to sponsors-only updates
- Warm feeling of supporting open source

### $15/month - Backer
- Everything in Supporter
- Priority issue responses
- Vote on feature prioritization polls

### $50/month - Advocate
- Everything in Backer
- Logo in project README (small)
- Monthly progress reports
- Early access to beta releases

### $100/month - Champion
- Everything in Advocate
- Logo on project website
- Quarterly video call for feedback
- Direct communication channel

### $500/month - Corporate Sponsor
- Everything in Champion
- Large logo placement on website and README
- Acknowledgment in release notes
- Priority bug fixes for reported issues
- Annual roadmap input session

### $2,000/month - Strategic Partner
- Everything in Corporate
- Dedicated support channel
- Influence on roadmap priorities
- Co-marketing opportunities
- Custom feature consultation
```

### FUNDING.yml Configuration

```yaml
# .github/FUNDING.yml
github: [your-username]
open_collective: project-name
ko_fi: your-username
custom:
  - [external resource]
  - [external resource]
```

## Open Collective Strategy

### Setting Up an Open Collective

```markdown
## Collective Setup Checklist

- [ ] Choose fiscal host (Open Source Collective for OSS projects)
- [ ] Write compelling collective description
- [ ] Set transparent budget categories
- [ ] Define expense approval process
- [ ] Create contribution tiers
- [ ] Configure automated thank-you messages
- [ ] Set up regular financial updates

## Budget Transparency Template

### Income (Monthly)
| Source | Amount |
|--------|--------|
| Individual sponsors | $X,XXX |
| Corporate sponsors | $X,XXX |
| One-time donations | $XXX |
| **Total** | **$X,XXX** |

### Expenses (Monthly)
| Category | Amount | Notes |
|----------|--------|-------|
| Maintainer stipends | $X,XXX | 2 maintainers x $XX/hr |
| Infrastructure | $XXX | CI, hosting, domains |
| Events/conferences | $XXX | Averaged monthly |
| Dependencies | $XXX | Upstream project support |
| **Total** | **$X,XXX** |

### Reserve
| Balance | Months of runway |
|---------|-----------------|
| $XX,XXX | X months |
```

### Expense Categories Best Practices

```
Recommended budget allocation:

Maintainer Compensation:     50-70%
  - Regular contributor stipends
  - Bounty payments for specific work
  - Code review compensation

Infrastructure:              10-20%
  - CI/CD (GitHub Actions, etc.)
  - Hosting and domains
  - Security tools and scanning
  - Development tools and licenses

Community:                   10-15%
  - Conference attendance/sponsorship
  - Meetup hosting
  - Swag and recognition
  - Documentation and content creation

Upstream Support:            5-10%
  - Donations to critical dependencies
  - Supporting maintainers you depend on
```

## Grant Opportunities

### Grant Source Categories

| Source Type | Examples | Typical Range | Focus |
|-------------|----------|---------------|-------|
| Tech foundations | Linux Foundation, Apache Foundation | $10K-$100K | Infrastructure projects |
| Government | NSF, NLnet, EU NGI | $50K-$500K | Research and innovation |
| Corporate programs | Google Summer of Code, Microsoft FOSS Fund | $5K-$50K | Ecosystem health |
| Non-profit | Ford Foundation, Sloan Foundation | $50K-$300K | Digital infrastructure |
| Ecosystem-specific | Rust Foundation, Python PSF | $5K-$50K | Language ecosystem |

### Grant Application Template

```markdown
# Grant Application: [Project Name]

## Project Overview
- Name and URL
- License
- Age and maturity
- Usage metrics (downloads, dependents, stars)
- Maintainer team size

## Problem Statement
What problem does this project solve? Why is it critical
to the ecosystem? What happens if it is not maintained?

## Proposed Work
### Objectives
1. Specific, measurable objective
2. Specific, measurable objective
3. Specific, measurable objective

### Timeline
| Phase | Duration | Deliverables |
|-------|----------|-------------|
| Phase 1 | 3 months | Deliverable A, B |
| Phase 2 | 3 months | Deliverable C, D |
| Phase 3 | 3 months | Deliverable E, F |

### Budget
| Item | Amount | Justification |
|------|--------|---------------|
| Developer time (X hours at $Y/hr) | $ZZ,ZZZ | Core implementation |
| Security audit | $X,XXX | Third-party review |
| Infrastructure | $X,XXX | Testing and CI costs |
| **Total** | **$ZZ,ZZZ** | |

## Impact
- Number of direct users/dependents
- Ecosystem benefit description
- Long-term sustainability plan post-grant

## Team
| Name | Role | Relevant Experience |
|------|------|---------------------|
| Person A | Lead developer | X years on project |
| Person B | Security reviewer | Y years in security |

## Success Metrics
- Metric 1: target and measurement method
- Metric 2: target and measurement method
- Metric 3: target and measurement method
```

## Corporate Sponsorship

### Approaching Companies

```markdown
## Corporate Sponsorship Pitch Template

Subject: Sponsoring [Project] - powering your [product/service]

Dear [Name/Team],

[Company] uses [Project] in [specific way - be precise about
where you found their usage]. Our project [brief impact statement
with metrics: downloads, dependents, critical infrastructure role].

We are seeking corporate sponsors to ensure the long-term
sustainability of [Project]. Here is what sponsorship provides:

For [Company]:
- Priority support for issues affecting your team
- Influence on roadmap priorities
- Logo visibility to [number] monthly users/visitors
- Direct line to maintainers for security advisories
- Assurance that critical infrastructure is maintained

Sponsorship levels:
- Bronze ($X/month): [benefits]
- Silver ($X/month): [benefits]
- Gold ($X/month): [benefits]

[Number] of your dependencies rely on [Project]. Sponsorship
ensures continued maintenance, security patches, and innovation.

Would you be available for a 15-minute call to discuss?

Best regards,
[Your name]
```

### Value Proposition for Companies

```markdown
## Why Companies Should Sponsor OSS

### Risk Mitigation
- Unmaintained dependencies = security risk
- Average cost of a vulnerability: $X,XXX-$XXX,XXX
- Sponsorship cost is a fraction of internal development

### ROI Calculation
Internal equivalent cost:
  - Senior developer salary: $150K-$250K/year
  - Benefits and overhead: $50K-$100K/year
  - Total for 1 FTE: $200K-$350K/year

Open source sponsorship:
  - $500-$5,000/month = $6K-$60K/year
  - Access to team of maintainers
  - Community-tested, battle-hardened code
  - ROI: 5-50x compared to internal development

### Talent Benefits
- Brand visibility in developer community
- Attracting developers who value OSS contribution
- Demonstrating engineering culture commitment
```

## Sustainable Revenue Models

### Dual Licensing Model

```markdown
## How Dual Licensing Works

Free Tier: AGPL or similar strong copyleft
  - Full feature access
  - Must open-source derivative works
  - Community support only

Commercial License: Proprietary
  - Same software, no copyleft obligation
  - Use in proprietary products
  - Commercial support included
  - SLA guarantees

## Pricing Strategy
| Tier | Price | Target |
|------|-------|--------|
| Startup (< 50 employees) | $500/year | Early adoption |
| Business (50-500 employees) | $5,000/year | Growing companies |
| Enterprise (500+ employees) | $25,000+/year | Large organizations |

## Key Consideration
You must own all copyright (use CLA for contributions)
or have contributor agreement allowing dual licensing.
```

### Open Core Model

```markdown
## Open Core Structure

Community Edition (Open Source):
  - Core functionality
  - Standard integrations
  - Community support
  - Self-hosted only

Enterprise Edition (Commercial):
  - Everything in Community
  - SSO/SAML authentication
  - Audit logging
  - Advanced analytics
  - Role-based access control
  - Priority support with SLA
  - Managed hosting option

## Feature Split Guidelines
Keep in open source:
  - Core functionality that defines the project
  - Features needed by individual developers
  - Security features (builds trust)
  - Basic integrations

Keep in commercial:
  - Features only enterprises need (SSO, audit, compliance)
  - Scale and performance features
  - Advanced operational features
  - White-label or customization
  - Hosted/managed service
```

### Support and Consulting

```markdown
## Service Offerings

### Support Contracts
| Tier | Response SLA | Channels | Price |
|------|-------------|----------|-------|
| Community | Best effort | GitHub Issues | Free |
| Standard | 48h business | Email + Issues | $500/mo |
| Priority | 4h business | Slack + Email | $2,000/mo |
| Critical | 1h (24/7) | Phone + Slack | $5,000/mo |

### Consulting Services
- Architecture review: $2,000-$5,000
- Implementation support: $200-$400/hr
- Custom feature development: Project-based pricing
- Training workshops: $3,000-$10,000/day
- Migration assistance: Project-based pricing

### Pricing Principles
- Free tier must be genuinely useful (not crippled)
- Paid tiers solve real pain points (not artificial limits)
- Price based on value delivered, not cost
- Annual billing with monthly option at premium
```

## Financial Sustainability Metrics

### Health Dashboard

```markdown
## Monthly Financial Health

### Revenue
- Monthly Recurring Revenue (MRR): $___
- MRR growth rate: ___%
- Revenue diversity index: ___ sources
- Largest single sponsor: ___% of total (target: <25%)

### Runway
- Monthly burn rate: $___
- Cash reserves: $___
- Months of runway: ___
- Target runway: 6+ months

### Sustainability Score
- Can cover 1 full-time maintainer: Yes/No
- Infrastructure costs covered: Yes/No
- Growth trend (3-month): Up/Flat/Down
- Funding concentration risk: Low/Medium/High
```

### Diversification Strategy

```
Revenue diversification targets:

Unhealthy (high risk):
  - Single source > 50% of revenue
  - Only individual sponsors
  - No recurring revenue

Developing:
  - No single source > 30%
  - Mix of individual and corporate
  - Some recurring revenue

Healthy:
  - No single source > 25%
  - 3+ revenue channels active
  - 80%+ recurring revenue
  - 6+ months runway

Sustainable:
  - No single source > 20%
  - 5+ revenue channels
  - 90%+ recurring revenue
  - 12+ months runway
  - Covers 2+ full-time maintainers
```

## Communication and Transparency

### Sponsor Update Template

```markdown
# Monthly Sponsor Update - [Month Year]

## Highlights
- [Major achievement or release]
- [Community milestone]
- [Impact metric]

## What Your Sponsorship Funded
- X hours of maintenance and review
- Y security patches applied
- Z new features shipped
- Infrastructure costs: $___

## Coming Next Month
- [Planned work item 1]
- [Planned work item 2]

## Financial Summary
- Total received: $___
- Total spent: $___
- Reserve balance: $___

Thank you for making this work possible.
```


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to oss funding strategist
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Oss Funding Strategist Analysis

### Assessment
[Key findings and observations]

### Recommendations
1. [Primary recommendation]
2. [Secondary recommendation]
3. [Additional suggestions]

### Action Items
- [ ] [First action step]
- [ ] [Second action step]
- [ ] [Follow-up task]
```


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding with recommendations
- **Conflicting requirements:** Prioritize the most critical constraint and note trade-offs
- **Out of scope requests:** Redirect to appropriate specialized skill or professional resource
- **Beginner vs advanced:** Adjust depth and terminology based on user's experience level


## Example

**Input:** "Help me with oss funding strategist for my current situation"

**Output:**

Based on your situation, here is a structured approach to oss funding strategist:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
