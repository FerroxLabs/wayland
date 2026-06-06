---
name: restaurant-owner
description: |
  Complete restaurant operations expertise covering menu engineering, food cost management, staffing models, health code compliance, POS selection, inventory control, marketing strategy, and seasonal planning for independent restaurant operators. Use when the user asks about restaurant owner or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "entrepreneurship strategy planning"
  category: "business-strategy"
  subcategory: "operations"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Restaurant Owner

## When to Use

**Use this skill when:**
- The user wants to open or operate an independent restaurant and needs menu engineering or food cost management
- The user needs help with staffing models, health code compliance, POS selection, or inventory control
- The user wants restaurant marketing strategy, seasonal planning, or operational efficiency improvements
- The user needs financial planning, break-even analysis, or vendor management for a restaurant

**Do NOT use this skill when:**
- The user is starting a food truck rather than a restaurant (use food-truck-operator instead)
- The user wants home cooking or recipe development guidance (use relevant home-household skill)
- The user needs general business planning not specific to restaurants (use business-planner instead)

## Process

1. **Gather requirements.** Ask the user clarifying questions about their specific context, goals, constraints, and experience level.

2. **Analyze the situation.** Review the information provided and identify key factors, challenges, and opportunities relevant to restaurant owner.

3. **Develop the framework.** Create a structured approach tailored to the user's needs, incorporating best practices and domain-specific considerations.

4. **Deliver actionable output.** Present specific, implementable recommendations with clear rationale, timelines, and success criteria.

5. **Address edge cases.** Proactively identify potential issues, alternative approaches, and contingency plans.

**Use this skill when:**
- User needs guidance on restaurant owner
- User asks about restaurant owner best practices or techniques
- User wants a structured approach to restaurant owner

**Do NOT use this skill when:**
- A more specialized skill exists for the specific subtopic
- The request is outside the scope of restaurant owner

## Questions to Ask First

Before providing guidance, establish the operator's situation:

1. What type of restaurant? (Fast casual, fine dining, counter service, bar & grill, ghost kitchen)
2. Are you in planning/pre-opening or already operating?
3. What is your seating capacity and average covers per day?
4. What is your current food cost percentage and labor cost percentage?
5. Do you own or lease the space? What are your monthly fixed costs?
6. How many BOH and FOH staff do you currently employ?
7. What POS system are you using, if any?
8. What is your average check size and target demographic?
9. Are you in an urban, suburban, or rural location?
10. What are your peak service times and slow periods?

## Menu Engineering Framework

### The BCG Matrix for Menus (Star/Plow/Puzzle/Dog)

Classify every menu item by two axes: **popularity** (mix percentage) and **profitability** (contribution margin).

```
                    HIGH PROFITABILITY     LOW PROFITABILITY
HIGH POPULARITY  |  STARS                  PLOWHORSES
                 |  Keep prominent,        Reengineer to reduce
                 |  maintain quality,      cost or raise price
                 |  feature on menu        subtly
                 |
LOW POPULARITY   |  PUZZLES                DOGS
                 |  Reposition, rename,    Remove or replace
                 |  better description,    unless operationally
                 |  server push            necessary
```

### Menu Engineering Workflow

1. Pull 90-day item mix report from POS
2. Calculate food cost per item (recipe costing card)
3. Calculate contribution margin (price minus food cost)
4. Find average popularity (total items sold / number of menu items)
5. Find average contribution margin across all items
6. Plot each item into the four quadrants
7. Action plan per quadrant

### Recipe Costing Card Template

```
Item: ________________________
Yield: ______ portions

Ingredient        | Unit Cost | Qty Used | Extended Cost
------------------|-----------|----------|-------------
                  |           |          |
                  |           |          |
                  |           |          |
TOTAL FOOD COST:                          $________
MENU PRICE:                               $________
FOOD COST %:                              ________%
CONTRIBUTION MARGIN:                      $________
```

### Menu Pricing Strategies

- **Food cost method**: Price = Raw food cost / Target food cost %
- **Contribution margin method**: Price = Food cost + Target dollar margin
- **Competition pricing**: Survey 5 comparable restaurants within 3 miles
- **Psychological pricing**: $14.95 vs $15.00; remove dollar signs; use nested pricing
- **Menu design**: Eyes go to upper right first, then center, then upper left (the "Golden Triangle")

## Food Cost Management

### Target Food Cost Percentages by Type

| Restaurant Type      | Target Food Cost % | Target Labor % | Target Prime Cost % |
|---------------------|--------------------|----------------|---------------------|
| Fine Dining         | 28-32%             | 30-35%         | 60-65%              |
| Casual Dining       | 28-35%             | 25-30%         | 55-65%              |
| Fast Casual         | 25-30%             | 22-28%         | 50-58%              |
| Quick Service       | 25-32%             | 20-25%         | 48-55%              |
| Bar/Nightclub       | 20-25% (food)      | 18-24%         | 40-48%              |

### Food Cost Formula

```
Actual Food Cost % = (Beginning Inventory + Purchases - Ending Inventory) / Food Sales x 100

Theoretical Food Cost % = Sum of (Items Sold x Recipe Cost) / Food Sales x 100

Variance = Actual - Theoretical (should be under 2%)
```

### Reducing Food Cost Without Cutting Quality

1. **Cross-utilization**: Use same proteins/produce across multiple dishes
2. **Portion control**: Standardize with scoops, ladles, scales
3. **Vendor negotiation**: Get 3 quotes; negotiate net-30 terms
4. **Waste tracking**: Log all waste by category daily
5. **Specials for aging inventory**: Use approaching-date items in daily features
6. **Prep yield testing**: Measure actual yield vs. purchased weight
7. **Menu trimming**: Remove low-sellers that require unique inventory

## Inventory Management

### Par Level System

```
Par Level = (Average Daily Usage x Lead Time in Days) + Safety Stock
Order Quantity = Par Level - Current On-Hand

Example:
  Chicken breast usage: 40 lbs/day
  Delivery lead time: 2 days
  Safety stock: 20 lbs
  Par Level = (40 x 2) + 20 = 100 lbs
  On-hand: 35 lbs
  Order: 100 - 35 = 65 lbs
```

### Inventory Counting Schedule

- **Daily**: High-value proteins, seafood, daily specials items
- **Weekly**: All perishables, alcohol, paper goods
- **Monthly**: Full inventory count (required for accurate P&L)

### FIFO Protocol (First In, First Out)

- Date-label everything upon receipt
- New stock goes behind old stock
- Walk-in organized: raw proteins bottom, ready-to-eat top
- Check dates during every shift's opening sidework

## Staffing Models

### Labor Cost Calculation

```
Labor Cost % = (Total Labor Cost including taxes, benefits, insurance) / Total Revenue x 100
```

### Scheduling Framework

```
Covers Forecast Method:
1. Pull same day/week from prior year
2. Adjust for weather, events, holidays
3. Staff to 80% of forecast (flex up with on-call)

Labor Per Cover Targets:
  FOH: 1 server per 15-20 covers (casual), 1 per 10-12 (fine dining)
  BOH: 1 cook per 30-40 covers (casual), 1 per 20-25 (fine dining)
  Dishwasher: 1 per 50-75 covers
```

### Staff Positions and Roles

**FOH**: Host, Server, Busser, Bartender, Barback, Food Runner, Manager
**BOH**: Executive Chef, Sous Chef, Line Cook, Prep Cook, Dishwasher, Expeditor

### Retention Strategies

- Pre-meal meetings every shift (menu knowledge, specials, goals)
- Tip pooling vs. individual tips (know your state law)
- Cross-training for schedule flexibility
- Clear advancement path (busser to server, prep to line)
- Quarterly performance reviews with raise benchmarks
- Staff meal every shift

## Health Code Compliance

### Critical Control Points

| Risk Area            | Standard                        | Frequency      |
|---------------------|---------------------------------|----------------|
| Cooler temps        | 41F or below                    | 2x daily       |
| Freezer temps       | 0F or below                     | 2x daily       |
| Hot holding         | 135F or above                   | Continuous      |
| Cooking temps       | Varies by protein (see below)   | Every batch     |
| Sanitizer strength  | 200 ppm quat / 50-100 ppm bleach| Every 2 hours  |
| Handwashing         | 20 seconds, soap, warm water    | Continuous      |

### Minimum Internal Cooking Temperatures

```
Poultry (whole/ground):      165F for 15 seconds
Ground meat (beef, pork):    155F for 15 seconds
Steaks, chops, fish:         145F for 15 seconds
Eggs for immediate service:  145F for 15 seconds
Reheated foods:              165F for 15 seconds within 2 hours
```

### Health Inspection Preparation Checklist

- [ ] All food date-labeled and within shelf life
- [ ] No food stored on floor (6 inches minimum clearance)
- [ ] Handwashing sinks stocked and accessible
- [ ] Employee health policy posted and signed
- [ ] Thermometers calibrated (ice bath method)
- [ ] Pest control log current
- [ ] Hood system inspection current
- [ ] Fire suppression system tagged
- [ ] MSDS/SDS sheets accessible
- [ ] Manager food safety certification displayed

## POS System Selection

### Evaluation Criteria

| Feature              | Must-Have | Nice-to-Have | Weight |
|---------------------|-----------|--------------|--------|
| Menu modification   | X         |              | 10     |
| Table management    | X         |              | 9      |
| Inventory tracking  |           | X            | 7      |
| Online ordering     | X         |              | 9      |
| Payroll integration |           | X            | 6      |
| Reporting suite     | X         |              | 10     |
| Offline mode        | X         |              | 8      |
| KDS integration     | X         |              | 8      |

### Common POS Systems by Restaurant Type

- **Toast**: Best all-around for full-service; restaurant-specific
- **Square for Restaurants**: Best for budget-conscious, simple operations
- **Clover**: Good for counter service and fast casual
- **Lightspeed Restaurant**: Strong inventory and analytics
- **Revel**: Enterprise-level for multi-unit operations

### True Cost of POS

```
Monthly Software Fee:           $___/month
Hardware (amortized monthly):   $___/month
Payment Processing:             ___% + $0.__ per transaction
Add-on Modules:                 $___/month
Support Plan:                   $___/month
TOTAL MONTHLY POS COST:         $___/month
```

## Restaurant Marketing

### Local Marketing Playbook

1. **Google Business Profile**: Complete with photos, menu, hours; respond to every review
2. **Social media**: Post 4-5x/week; behind-the-scenes, plating shots, staff features
3. **Email list**: Collect at POS; monthly newsletter with specials and events
4. **Community events**: Host charity nights, live music, themed dinners
5. **Partnerships**: Cross-promote with nearby businesses, hotels, event venues
6. **Loyalty program**: Simple punch card or digital (Square Loyalty, Toast)

### Review Management Protocol

```
Response Timeline:
  Positive reviews: Thank within 24 hours, be specific about their experience
  Negative reviews: Respond within 4 hours, acknowledge, invite offline resolution
  Never: Argue, make excuses, or reveal private details

Review Generation:
  Train servers to mention reviews at check drop
  Include review link on receipts
  Follow-up email 24 hours post-visit
  Target: 4.3+ stars on Google with 100+ reviews
```

## Seasonal Planning

### Quarterly Planning Calendar

```
Q1 (Jan-Mar): New Year health menus, Valentine's Day prix fixe,
              equipment maintenance, menu refresh, tax prep

Q2 (Apr-Jun): Patio opening, Mother's Day, Father's Day,
              summer menu launch, hiring for summer volume

Q3 (Jul-Sep): Peak season execution, back-to-school,
              Labor Day, begin holiday planning

Q4 (Oct-Dec): Halloween, Thanksgiving (dine-in or catering),
              holiday parties, New Year's Eve, year-end inventory
```

### Seasonal Menu Transition

- Announce new menus 2 weeks before launch
- Photograph all new items before service
- Train staff on new ingredients, allergens, and descriptions
- Run outgoing favorites as limited-time specials
- Track first 2 weeks of sales data for fast adjustments

## Financial Management

### Monthly P&L Template

```
REVENUE
  Food Sales:                    $________
  Beverage Sales:                $________
  Catering/Events:               $________
  TOTAL REVENUE:                 $________

COST OF GOODS SOLD
  Food Cost:                     $________ (___%)
  Beverage Cost:                 $________ (___%)
  TOTAL COGS:                    $________ (___%)

LABOR
  Salaried:                      $________
  Hourly:                        $________
  Benefits/Taxes:                $________
  TOTAL LABOR:                   $________ (___%)

PRIME COST (COGS + LABOR):      $________ (___%)

OPERATING EXPENSES
  Rent:                          $________
  Utilities:                     $________
  Insurance:                     $________
  Marketing:                     $________
  Repairs/Maintenance:           $________
  Supplies (paper, cleaning):    $________
  Technology (POS, wifi):        $________
  Licenses/Permits:              $________
  Professional Services:         $________
  TOTAL OPERATING:               $________ (___%)

NET OPERATING INCOME:            $________ (___%)
Target: 10-15% for independent restaurants
```

### Key Metrics to Track Weekly

- Revenue per available seat hour (RevPASH)
- Average check size
- Table turn time
- Labor cost percentage
- Food cost percentage (actual vs. theoretical)
- Covers per labor hour
- Waste dollar amount
- Online order percentage

## Common Mistakes to Avoid

1. Overcomplicating the menu (20-35 items is the sweet spot)
2. Underpricing to compete instead of adding value
3. Not tracking food cost weekly
4. Hiring friends and family without clear expectations
5. Ignoring online reviews and social presence
6. Skipping daily line checks and prep lists
7. Not having a cash handling policy
8. Expanding too fast before systems are solid
9. Neglecting equipment maintenance schedules
10. Failing to build a cash reserve (target 3 months of fixed costs)


## Output Format

Deliver the response as a structured document with clear headings and actionable content. Use tables for comparisons, numbered lists for sequential steps, and bullet points for options. Include specific examples where applicable.

```
[Restaurant Owner deliverable]
1. Context and objectives
2. Analysis or framework
3. Specific recommendations with rationale
4. Action items with timeline
```


## Example

**Input:** "Help me with restaurant owner for a mid-size project."

**Output:** A complete restaurant owner framework tailored to the specific context, with actionable steps, relevant considerations, and measurable outcomes.


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding rather than making assumptions
- **Conflicting requirements:** Identify trade-offs explicitly and present options with pros and cons
- **Scale mismatch:** Adapt recommendations to match the user's context (individual vs. team vs. organization)
- **Domain crossover:** When the request overlaps with other skill domains, address what falls within scope and reference specialized skills for the rest
