---
name: traction-channel-analysis
description: |
  Applies the Bullseye Framework to rank all 19 traction channels by potential, cost, and time-to-results for a specific business, producing a prioritized acquisition strategy with test designs for top channels. Use when the user asks about traction channels, customer acquisition channels, the Bullseye Framework, growth channels, or how to get customers.
  Do NOT use for marketing strategy (use marketing-strategy), paid ad copy (use paid-ad-copy), or growth experiments (use growth-experiment).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "entrepreneurship strategy planning analysis marketing"
  category: "business-strategy"
  subcategory: "entrepreneurship"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Traction Channel Analysis

## When to Use

**Use this skill when:**
- User asks about how to get their first customers or grow their customer base
- User wants to evaluate which marketing and distribution channels are best for their business
- User asks about the Bullseye Framework or traction channels
- User needs to prioritize acquisition channels with limited budget and time
- User wants a structured approach to testing growth channels rather than guessing

**Do NOT use this skill when:**
- User needs a comprehensive marketing strategy document (use `marketing-strategy`)
- User wants to write ad copy for a specific platform (use `paid-ad-copy`)
- User needs to design a specific growth experiment (use `growth-experiment`)
- User needs SEO content planning (use `seo-content-strategy`)

## Process

1. **Understand the business context.** Ask the user for:
   - What is the product or service?
   - Who is the target customer? (specific segment)
   - What is the price point? (determines which channels are economically viable)
   - What is the current stage? (pre-launch, early traction, growth)
   - What channels have been tried? (and what were the results?)
   - What is the budget for channel testing? (bootstrapped vs funded)
   - What is the timeline pressure? (need customers this month vs this quarter?)
   - B2B or B2C? (dramatically affects channel selection)

2. **Present the 19 traction channels.** The Bullseye Framework, from the book "Traction" by Gabriel Weinberg and Justin Mares, identifies 19 channels through which every business acquires customers. Every business should consider all 19 before committing to a strategy:

   **Channel 1: Viral Marketing**
   - Users invite other users as part of the product experience
   - Best for: products with built-in sharing mechanics, social products, collaboration tools
   - Metrics: viral coefficient (K-factor), cycle time
   - Example: Dropbox referral program, Slack team invitations

   **Channel 2: Public Relations (PR)**
   - Media coverage in publications read by the target audience
   - Best for: novel products with a compelling story, B2C with broad appeal
   - Metrics: press mentions, referral traffic from articles, domain authority
   - Example: Launch coverage in TechCrunch, industry trade publications

   **Channel 3: Unconventional PR**
   - Publicity stunts, creative campaigns, or viral content that generates attention
   - Best for: consumer products that benefit from word-of-mouth, brands with personality
   - Metrics: social shares, media pickups, brand mentions
   - Example: Dollar Shave Club launch video, Blendtec "Will It Blend" series

   **Channel 4: Search Engine Marketing (SEM)**
   - Paid ads on search engines (Google Ads, Bing Ads)
   - Best for: products where customers actively search for solutions, high-intent keywords
   - Metrics: CPC, CTR, conversion rate, CAC
   - Example: Google Ads for "best project management software"

   **Channel 5: Social and Display Ads**
   - Paid ads on social platforms (Facebook, Instagram, LinkedIn, Twitter/X) and display networks
   - Best for: B2C with visual products, B2B on LinkedIn, broad awareness campaigns
   - Metrics: CPM, CPC, CTR, conversion rate, ROAS
   - Example: Facebook ads targeting small business owners, LinkedIn ads for B2B SaaS

   **Channel 6: Offline Ads**
   - Traditional advertising: billboards, radio, TV, print, direct mail
   - Best for: local businesses, mass-market consumer products, brand building at scale
   - Metrics: reach, brand awareness surveys, attribution (difficult)
   - Example: Local radio ads for a regional service business

   **Channel 7: Search Engine Optimization (SEO)**
   - Organic search traffic from ranking for relevant keywords
   - Best for: content-rich products, products where customers search for information before purchasing
   - Metrics: organic traffic, keyword rankings, domain authority, conversion from organic
   - Example: HubSpot ranking for "how to write a marketing plan"

   **Channel 8: Content Marketing**
   - Creating and distributing valuable content (blog posts, videos, podcasts, guides) to attract and retain customers
   - Best for: B2B SaaS, products that require education, markets with information-seeking behavior
   - Metrics: traffic, engagement, email signups, content-attributed revenue
   - Example: Buffer's social media marketing blog, Intercom's product management content

   **Channel 9: Email Marketing**
   - Direct email communication with prospects and customers
   - Best for: any business with an email list, B2B nurture sequences, e-commerce
   - Metrics: open rate, click rate, conversion rate, list growth rate
   - Example: Weekly newsletter with product tips, drip campaigns for trial users

   **Channel 10: Engineering as Marketing**
   - Building free tools, calculators, or widgets that attract the target audience
   - Best for: technical products where the target audience values utility
   - Metrics: tool usage, signups from tool users, conversion rate
   - Example: HubSpot's Website Grader, Moz's Domain Authority checker

   **Channel 11: Targeting Blogs**
   - Guest posting or sponsoring content on blogs read by the target audience
   - Best for: niche markets with established blog communities
   - Metrics: referral traffic, signups from guest posts, brand mentions
   - Example: Guest post on a popular industry blog with a call to action

   **Channel 12: Business Development (BD)**
   - Strategic partnerships with complementary businesses
   - Best for: B2B, platform businesses, products that integrate with existing workflows
   - Metrics: partnership revenue, co-marketing reach, integration adoption
   - Example: Salesforce AppExchange partnerships, Shopify app partnerships

   **Channel 13: Sales**
   - Direct sales (outbound calls, emails, demos, meetings)
   - Best for: B2B with high contract values (> $1,000/year), enterprise products
   - Metrics: pipeline value, close rate, average deal size, sales cycle length
   - Example: Outbound sales team calling target accounts

   **Channel 14: Affiliate Programs**
   - Paying third parties a commission for referring customers
   - Best for: e-commerce, SaaS with self-serve signup, products with clear value proposition
   - Metrics: affiliate signups, referred customers, revenue per affiliate, commission costs
   - Example: Amazon Associates, SaaS affiliate programs paying 20-30% recurring

   **Channel 15: Existing Platforms**
   - Building on or distributing through established platforms (app stores, marketplaces, Chrome extensions)
   - Best for: products that enhance existing platforms, mobile apps, browser extensions
   - Metrics: platform-specific downloads, reviews, rankings
   - Example: Slack App Directory, Chrome Web Store, Shopify App Store

   **Channel 16: Trade Shows**
   - Industry events, conferences, and exhibitions
   - Best for: B2B, products that benefit from in-person demonstration, industry-specific markets
   - Metrics: leads collected, demos given, deals initiated, cost per lead
   - Example: Booth at SaaStr Annual, industry-specific trade shows

   **Channel 17: Offline Events**
   - Hosting or sponsoring meetups, workshops, dinners, and community events
   - Best for: local businesses, community-driven products, B2B networking
   - Metrics: attendees, leads generated, community growth
   - Example: Hosting a monthly meetup for target customers, workshop series

   **Channel 18: Speaking Engagements**
   - Founder or team members speaking at conferences, webinars, and podcasts
   - Best for: B2B where the founder has domain expertise, thought leadership positioning
   - Metrics: leads from speaking events, brand mentions, inbound inquiries
   - Example: Speaking at industry conferences, podcast guest appearances

   **Channel 19: Community Building**
   - Creating and nurturing a community around the product or problem space
   - Best for: products with engaged user bases, developer tools, passion-driven markets
   - Metrics: community size, active members, engagement rate, community-attributed conversions
   - Example: Figma community, dbt community, Product Hunt community

3. **Apply the Bullseye Framework.** Three concentric rings:

   **Outer Ring: What is possible (all 19 channels)**
   - For each channel, brainstorm one specific tactic the business could use
   - Rate each channel on three dimensions:
     - **Potential:** How many target customers could this channel reach? (High/Medium/Low)
     - **Cost:** What would it cost to test this channel? ($, $$, $$$)
     - **Time:** How quickly could you see results? (Days, Weeks, Months)
   - This step takes 15-30 minutes and forces the team to consider channels they might otherwise overlook

   **Middle Ring: What is probable (top 6)**
   - From the 19 channels, select the 6 with the best combination of potential, cost, and time
   - For each of the 6, define a specific, cheap test that could validate or invalidate the channel within 2-4 weeks
   - The test should cost less than $500 (or less than $100 for bootstrapped businesses)

   **Inner Ring: What is working (top 3)**
   - After running the 6 tests, identify the 3 channels that showed the strongest signal
   - Double down on these 3 channels. Allocate 80% of growth effort and budget to the top 3.
   - Optimization begins: A/B test messaging, refine targeting, improve conversion, scale spend

4. **Design channel tests.** For each of the top 6 channels:
   - **Hypothesis:** "We believe [channel] can acquire customers at a CAC of [$X] because [reasoning]."
   - **Test:** Specific, concrete action (run $200 in Google Ads, publish 3 blog posts, send 100 cold emails)
   - **Duration:** 2-4 weeks
   - **Budget:** $100-$500 per channel test
   - **Success metric:** Signups, trials, purchases, or another conversion event
   - **Decision:** If [metric] > [threshold], move to Inner Ring. If not, deprioritize.

5. **Create the prioritized channel strategy.** After testing, build the ongoing acquisition plan:
   - Primary channel (most effort and budget)
   - Secondary channel (supports primary)
   - Experimental channel (testing the next potential winner)
   - Review and re-evaluate every quarter

## Output Format

```
## Traction Channel Analysis: [Business Name]

### Business Context
| Field | Value |
|-------|-------|
| **Product** | [What it does] |
| **Target customer** | [Specific segment] |
| **Price point** | [$X per unit/month] |
| **Stage** | [Pre-launch / Early traction / Growth] |
| **Budget for testing** | [$X] |
| **B2B or B2C** | [B2B / B2C / Both] |
| **Channels tried** | [What has been attempted and results] |

---

### Outer Ring: All 19 Channels Ranked

| # | Channel | Potential | Cost | Time | Specific Tactic | Ring |
|---|---------|-----------|------|------|-----------------|------|
| 1 | Viral Marketing | [H/M/L] | [$-$$$] | [D/W/M] | [Specific tactic] | [Middle/Outer] |
| 2 | PR | [H/M/L] | [$-$$$] | [D/W/M] | [Specific tactic] | [Middle/Outer] |
| 3 | Unconventional PR | [H/M/L] | [$-$$$] | [D/W/M] | [Specific tactic] | [Middle/Outer] |
| 4 | SEM | [H/M/L] | [$-$$$] | [D/W/M] | [Specific tactic] | [Middle/Outer] |
| 5 | Social/Display Ads | [H/M/L] | [$-$$$] | [D/W/M] | [Specific tactic] | [Middle/Outer] |
| 6 | Offline Ads | [H/M/L] | [$-$$$] | [D/W/M] | [Specific tactic] | [Middle/Outer] |
| 7 | SEO | [H/M/L] | [$-$$$] | [D/W/M] | [Specific tactic] | [Middle/Outer] |
| 8 | Content Marketing | [H/M/L] | [$-$$$] | [D/W/M] | [Specific tactic] | [Middle/Outer] |
| 9 | Email Marketing | [H/M/L] | [$-$$$] | [D/W/M] | [Specific tactic] | [Middle/Outer] |
| 10 | Engineering as Marketing | [H/M/L] | [$-$$$] | [D/W/M] | [Specific tactic] | [Middle/Outer] |
| 11 | Targeting Blogs | [H/M/L] | [$-$$$] | [D/W/M] | [Specific tactic] | [Middle/Outer] |
| 12 | Business Development | [H/M/L] | [$-$$$] | [D/W/M] | [Specific tactic] | [Middle/Outer] |
| 13 | Sales | [H/M/L] | [$-$$$] | [D/W/M] | [Specific tactic] | [Middle/Outer] |
| 14 | Affiliate Programs | [H/M/L] | [$-$$$] | [D/W/M] | [Specific tactic] | [Middle/Outer] |
| 15 | Existing Platforms | [H/M/L] | [$-$$$] | [D/W/M] | [Specific tactic] | [Middle/Outer] |
| 16 | Trade Shows | [H/M/L] | [$-$$$] | [D/W/M] | [Specific tactic] | [Middle/Outer] |
| 17 | Offline Events | [H/M/L] | [$-$$$] | [D/W/M] | [Specific tactic] | [Middle/Outer] |
| 18 | Speaking Engagements | [H/M/L] | [$-$$$] | [D/W/M] | [Specific tactic] | [Middle/Outer] |
| 19 | Community Building | [H/M/L] | [$-$$$] | [D/W/M] | [Specific tactic] | [Middle/Outer] |

---

### Middle Ring: Top 6 Channels to Test

#### Channel Test 1: [Channel Name]
| Field | Value |
|-------|-------|
| **Hypothesis** | [We believe X can acquire customers at $Y CAC because Z] |
| **Test** | [Specific action: run $200 in ads, send 100 emails, publish 3 posts] |
| **Duration** | [2-4 weeks] |
| **Budget** | [$X] |
| **Success metric** | [X signups/trials/purchases] |
| **Success threshold** | [If > X, move to Inner Ring] |

*(Repeat for all 6 channels)*

---

### Inner Ring: Top 3 Channels (after testing)

| Rank | Channel | Test Result | Next Step | Monthly Budget |
|------|---------|-------------|-----------|---------------|
| 1 | [Primary channel] | [Results from test] | [Scale: specific actions] | [$X] |
| 2 | [Secondary channel] | [Results from test] | [Optimize: specific actions] | [$X] |
| 3 | [Experimental channel] | [Results from test] | [Continue testing] | [$X] |

---

### Channel Strategy Summary

| Category | Channel | Allocation |
|----------|---------|-----------|
| **Primary (60% effort)** | [Channel] | [$X/month] |
| **Secondary (25% effort)** | [Channel] | [$X/month] |
| **Experimental (15% effort)** | [Channel] | [$X/month] |

**Review cadence:** Re-evaluate channel performance monthly. Re-run full Bullseye analysis quarterly.
```

## Rules

1. ALWAYS evaluate all 19 channels before selecting the top candidates. The most common mistake in customer acquisition is defaulting to familiar channels (Facebook ads, Google ads) without considering alternatives. The best channel for a specific business is often not the obvious one.
2. NEVER recommend a channel without a specific tactic. "Try content marketing" is not actionable. "Publish a weekly blog post targeting the keyword 'how to [solve problem]' and promote each post in [specific community]" is actionable.
3. ALWAYS design cheap, fast tests. A channel test should cost $100-$500 and take 2-4 weeks. If a test requires $10,000 or 3 months, the scope is too large. The goal is signal detection, not full optimization.
4. The Bullseye Framework requires iteration. The first analysis identifies channels to test. After testing, the analysis is updated based on actual data. Channels that performed well in theory may fail in practice, and vice versa.
5. ALWAYS tailor channel ratings to the specific business. SEO is high-potential for a content-driven B2B product but low-potential for a consumer mobile game. Social ads are high-potential for a visual B2C product but low-potential for an enterprise infrastructure tool. Context determines everything.
6. Include the cost dimension for every channel. A channel with high potential but high cost is only viable for funded businesses. Bootstrapped businesses must prioritize low-cost channels with faster time to results.
7. ALWAYS separate B2B and B2C channel strategies. B2B businesses typically succeed with sales, content marketing, SEO, business development, and speaking engagements. B2C businesses typically succeed with social ads, viral marketing, PR, and community building. Overlap exists, but the primary channels differ significantly.
8. Include a "what has been tried" assessment. If the business has already tested channels, those results are the most valuable data. Do not recommend re-testing a channel that has already failed unless the test was poorly designed.
9. The top 3 channels get 80% of resources. Spreading effort across 8 channels produces mediocre results on all of them. Concentrated effort on 3 channels produces excellence on at least one.
10. Re-evaluate channels quarterly. Markets shift, competitors emerge, and channels saturate. A channel that works well in year one may degrade in year two.

## Edge Cases

- **Pre-launch product (no customers yet):** Focus the analysis on channels that can generate pre-launch signups, waitlist members, or beta testers. Content marketing, PR, community building, and social ads are common pre-launch channels. The "test" at this stage is landing page conversion, not product adoption.

- **Very small niche market (< 10,000 potential customers):** Mass-market channels (social ads, PR, offline ads) are inefficient for tiny markets. Focus on direct channels: sales, business development, trade shows, speaking engagements, and community building. In a small niche, personal relationships and reputation are the primary traction channels.

- **Marketplace (two-sided):** Run the Bullseye analysis separately for supply and demand sides. The channels that attract suppliers (BD, sales, trade shows) are often different from those that attract buyers (social ads, SEO, PR). Prioritize whichever side is harder to acquire.

- **Developer tool or API product:** The target audience is developers, who are famously resistant to traditional marketing. Prioritize: engineering as marketing (free tools), content marketing (technical blog posts and tutorials), community building (Discord, forums), existing platforms (GitHub, npm), and speaking engagements (conference talks). Traditional ads are usually low-performing for developer audiences.

- **Local business (geographic constraint):** Eliminate channels that are not geographically targetable. Prioritize: local SEO, offline events, offline ads (local radio, signage), community building (local groups), and partnerships with complementary local businesses. Trade shows in the region are high-value. National PR has limited value unless it drives local awareness.

## Example

**Input:** "I built a SaaS tool that helps real estate agents automate their follow-up emails with leads. It costs $49/month. I have 12 customers from my personal network but need to figure out how to grow beyond people I know. I have $2,000/month for marketing."

**Output:**

## Traction Channel Analysis: Real Estate Follow-Up SaaS

### Business Context
| Field | Value |
|-------|-------|
| **Product** | Automated follow-up email sequences for real estate agents |
| **Target customer** | Independent real estate agents and small brokerages |
| **Price point** | $49/month |
| **Stage** | Early traction (12 customers) |
| **Budget** | $2,000/month |
| **B2B or B2C** | B2B (small business) |
| **Channels tried** | Personal network only |

### Middle Ring: Top 6 Channels to Test

#### Test 1: Facebook/Instagram Ads
| Field | Value |
|-------|-------|
| **Hypothesis** | Real estate agents are active on Facebook and respond to productivity-focused ads |
| **Test** | $300 in Facebook ads targeting real estate agents, 3 ad variants, 2-week run |
| **Success threshold** | 5+ free trial signups at < $60 CAC |

#### Test 2: Content Marketing (SEO)
| Field | Value |
|-------|-------|
| **Hypothesis** | Agents search for "real estate follow up email templates" and similar queries |
| **Test** | Publish 4 blog posts targeting high-intent keywords, promote in real estate forums |
| **Success threshold** | 200+ organic visitors and 10+ email signups in 4 weeks |

#### Test 3: Existing Platforms (Real Estate Tech Marketplaces)
| Field | Value |
|-------|-------|
| **Hypothesis** | Agents discover tools through platforms they already use |
| **Test** | List on real estate tech directories and Zapier integrations marketplace |
| **Success threshold** | 3+ signups from platform referrals in 4 weeks |

#### Test 4: Affiliate/Referral Program
| Field | Value |
|-------|-------|
| **Hypothesis** | Current customers will refer agents in their network for an incentive |
| **Test** | Offer existing 12 customers one free month for each referral that converts |
| **Success threshold** | 3+ referred customers in 4 weeks |

#### Test 5: Targeting Real Estate Blogs
| Field | Value |
|-------|-------|
| **Hypothesis** | Guest posts on popular real estate blogs reach the target audience |
| **Test** | Pitch and publish 2 guest posts on real estate agent blogs |
| **Success threshold** | 100+ referral visitors and 5+ signups |

#### Test 6: Speaking at Real Estate Events
| Field | Value |
|-------|-------|
| **Hypothesis** | Real estate agents attend local association meetings and would value a talk on lead follow-up |
| **Test** | Offer a free 20-minute presentation at 2 local real estate association meetings |
| **Success threshold** | 5+ demo requests from attendees |
