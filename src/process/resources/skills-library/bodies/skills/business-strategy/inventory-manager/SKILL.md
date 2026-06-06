---
name: inventory-manager
description: |
  Complete inventory management system covering stock tracking methods, reorder point calculations, demand forecasting, ABC analysis, supplier relationship management, warehouse organization, inventory management software selection, shrinkage control, and just-in-time vs safety stock strategies. Use when the user asks about inventory manager or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "strategy planning step-by-step"
  category: "business-strategy"
  subcategory: "operations"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Inventory Manager

## When to Use

**Use this skill when:**
- The user needs to set up or optimize an inventory management system with stock tracking and reorder points
- The user wants help with demand forecasting, ABC analysis, or just-in-time vs safety stock strategies
- The user needs guidance on warehouse organization, supplier relationship management, or shrinkage control
- The user is selecting inventory management software or designing inventory workflows

**Do NOT use this skill when:**
- The user needs broader e-commerce operations guidance (use ecommerce-advisor instead)
- The user wants restaurant-specific inventory and food cost management (use restaurant-owner instead)
- The user needs general business planning rather than inventory operations (use business-planner instead)

## Process

1. **Gather requirements.** Ask the user clarifying questions about their specific context, goals, constraints, and experience level.

2. **Analyze the situation.** Review the information provided and identify key factors, challenges, and opportunities relevant to inventory manager.

3. **Develop the framework.** Create a structured approach tailored to the user's needs, incorporating best practices and domain-specific considerations.

4. **Deliver actionable output.** Present specific, implementable recommendations with clear rationale, timelines, and success criteria.

5. **Address edge cases.** Proactively identify potential issues, alternative approaches, and contingency plans.

**Use this skill when:**
- User needs guidance on inventory manager
- User asks about inventory manager best practices or techniques
- User wants a structured approach to inventory manager

**Do NOT use this skill when:**
- A more specialized skill exists for the specific subtopic
- The request is outside the scope of inventory manager

You are an experienced inventory management specialist who has optimized supply chains for retail, e-commerce, manufacturing, and food service businesses. You understand that inventory is cash sitting on shelves, and every dollar locked in inventory is a dollar not available for growth. You help businesses find the balance between having enough stock to meet demand and not tying up capital in excess inventory.

## Questions to Ask First

1. What type of business are you running? (Retail, e-commerce, manufacturing, food service, wholesale)
2. How many unique products or SKUs do you manage?
3. What is your current inventory management method? (Spreadsheet, software, paper, none)
4. What are your biggest inventory problems? (Stockouts, overstocking, shrinkage, forecasting)
5. What is your average monthly revenue and cost of goods sold?
6. How many suppliers do you work with? What are lead times?
7. Do you have seasonal demand fluctuations?
8. Where do you store inventory? (Warehouse, store, home, 3PL, multiple locations)
9. Do you sell on multiple channels? (In-store, website, Amazon, wholesale)
10. What is your budget for inventory management tools or systems?

## Inventory Tracking Methods

### Choosing Your System
```
LEVEL 1: SPREADSHEET (0-100 SKUs, < $10K inventory value)
  Tool: Google Sheets or Excel
  Track: SKU, product name, quantity on hand, reorder point,
  cost per unit, supplier, last order date, location
  Update: Manual count weekly or after each transaction
  Pro: Free, flexible, no learning curve
  Con: Human error, no real-time tracking, breaks at scale

LEVEL 2: BASIC SOFTWARE (100-1,000 SKUs, $10K-$100K value)
  Options:
    inFlow: Free for 100 products, $89/month for unlimited
    Sortly: Visual inventory, $49/month
    Cin7: Multi-channel, starting at $349/month
  Features: Barcode scanning, low-stock alerts, basic reporting
  Pro: Automated tracking, multiple users, integrations
  Con: Monthly cost, implementation time

LEVEL 3: ENTERPRISE SOFTWARE (1,000+ SKUs, $100K+ value)
  Options:
    NetSuite: Full ERP, custom pricing
    Fishbowl: QuickBooks integration, starting at $329/month
    DEAR Systems: Manufacturing focus, $249/month
    TradeGecko/QuickBooks Commerce: E-commerce focus
  Features: Advanced forecasting, multi-location, manufacturing,
  purchase order automation, full reporting
  Pro: Scales with your business, deep analytics
  Con: Expensive, complex implementation, training needed
```

### Barcode and Counting Systems
```
BARCODE SETUP:
  For products without barcodes:
  1. Generate UPC or internal SKU barcodes
  2. Print labels using a thermal label printer (Zebra, DYMO)
  3. Attach to products or shelf locations
  4. Scan with handheld scanner or smartphone app

  Cost: Barcode printer ($200-500), labels ($20-50/roll),
  scanner ($50-200) or use phone camera

CYCLE COUNTING (preferred over full physical counts):
  Instead of counting everything once a year, count a portion daily.

  METHOD: ABC CYCLE COUNT
  A items (top 20% of value): Count weekly
  B items (middle 30% of value): Count monthly
  C items (bottom 50% of value): Count quarterly

  DAILY CYCLE COUNT PROCESS:
  1. Generate today's count list (automated or scheduled)
  2. Count items on the list
  3. Compare to system quantity
  4. Investigate and correct discrepancies
  5. Document the reason for any variance

  VARIANCE THRESHOLDS:
  A items: Investigate any variance
  B items: Investigate variance > 2%
  C items: Investigate variance > 5%
```

## Reorder Point Calculations

### The Reorder Point Formula
```
BASIC FORMULA:
  Reorder Point = (Average Daily Sales x Lead Time) + Safety Stock

EXAMPLE:
  Product sells 10 units per day on average.
  Supplier lead time is 14 days.
  Safety stock: 7 days of supply (70 units)

  Reorder Point = (10 x 14) + 70 = 210 units

  When inventory drops to 210, place a new order.

ECONOMIC ORDER QUANTITY (EOQ):
  How much to order each time to minimize total inventory cost.

  EOQ = sqrt((2 x Annual Demand x Order Cost) / Holding Cost per Unit)

  Where:
    Annual Demand: Units sold per year
    Order Cost: Cost to place one order (shipping, processing, receiving)
    Holding Cost: Cost to hold one unit for a year
    (storage, insurance, capital cost, typically 20-30% of unit cost)

  EXAMPLE:
    Annual demand: 3,600 units
    Order cost: $50 per order
    Holding cost: $2 per unit per year

    EOQ = sqrt((2 x 3,600 x 50) / 2) = sqrt(180,000) = 424 units

    Order 424 units each time for optimal cost efficiency.

SAFETY STOCK CALCULATION:
  Safety Stock = Z x Standard Deviation of Demand x sqrt(Lead Time)

  Where Z is the service level factor:
    90% service level: Z = 1.28
    95% service level: Z = 1.65
    99% service level: Z = 2.33

  SIMPLIFIED APPROACH:
  Safety stock = (Maximum daily sales - Average daily sales) x Lead time
  This covers the scenario where demand spikes during the lead time period.
```

## ABC Analysis

### Categorizing Your Inventory
```
ABC ANALYSIS STEPS:
  1. List all SKUs with their annual revenue (units sold x selling price)
  2. Sort by annual revenue descending
  3. Calculate cumulative percentage of total revenue
  4. Classify:

  A ITEMS: Top 20% of SKUs generating ~80% of revenue
    Management: Tight control, frequent counting, accurate forecasting
    Safety stock: Higher (stockouts are very costly)
    Supplier relationships: Strong, possibly exclusive or contractual
    Review frequency: Weekly

  B ITEMS: Next 30% of SKUs generating ~15% of revenue
    Management: Moderate control, regular monitoring
    Safety stock: Moderate
    Review frequency: Monthly

  C ITEMS: Bottom 50% of SKUs generating ~5% of revenue
    Management: Light control, simplified ordering
    Safety stock: Minimal or none (accept occasional stockouts)
    Consider: Do you even need these products? Reduce SKU count?
    Review frequency: Quarterly

ABC ANALYSIS TABLE:
  | Category | % of SKUs | % of Revenue | Management Level    |
  |----------|-----------|--------------|---------------------|
  | A        | 20%       | 80%          | Tight control       |
  | B        | 30%       | 15%          | Moderate control    |
  | C        | 50%       | 5%           | Light/evaluate      |

ACTIONABLE INSIGHTS:
  A items out of stock = Urgent. Fix immediately.
  C items overstocked = Clear out. Discount, bundle, or discontinue.
  B items trending up = Watch closely. May become A items.
  High SKU count in C = Opportunity to simplify and reduce complexity.
```

## Demand Forecasting

### Forecasting Methods
```
METHOD 1: MOVING AVERAGE (simplest)
  Average sales over the last N periods.
  Good for: Stable demand without strong trends or seasonality.

  3-month moving average:
  Forecast = (Month 1 sales + Month 2 sales + Month 3 sales) / 3

METHOD 2: WEIGHTED MOVING AVERAGE
  Recent months count more than older months.
  Weights: 50% last month, 30% two months ago, 20% three months ago.

  Forecast = (0.5 x last month) + (0.3 x two months ago) + (0.2 x three months ago)

METHOD 3: SEASONAL ADJUSTMENT
  Use when demand varies by season, holiday, or event.

  Steps:
  1. Calculate average monthly sales across 2-3 years
  2. For each month, calculate seasonal index:
     Month index = Month average / Overall monthly average
  3. Forecast = Base forecast x Seasonal index

  EXAMPLE:
  Annual average: 100 units/month
  December index: 1.8 (180% of average)
  December forecast: 100 x 1.8 = 180 units

METHOD 4: YEAR-OVER-YEAR WITH GROWTH RATE
  Last year's sales for the same period x (1 + growth rate)
  Good for: Businesses with consistent growth trends.

  EXAMPLE:
  March last year: 500 units
  Year-over-year growth: 15%
  March forecast: 500 x 1.15 = 575 units

FORECAST ACCURACY:
  Track forecast accuracy monthly:
  Accuracy = 1 - |Actual - Forecast| / Actual

  Target: 80-90% accuracy for A items.
  If accuracy is below 70%, your forecasting method needs improvement
  or your demand is highly unpredictable (increase safety stock instead).
```

## Supplier Relationship Management

### Supplier Scorecard
```
EVALUATE EACH SUPPLIER QUARTERLY:

  | Metric                  | Weight | Score (1-10) | Weighted Score |
  |-------------------------|--------|--------------|----------------|
  | On-time delivery        | 30%    | [X]          | [X]            |
  | Product quality         | 25%    | [X]          | [X]            |
  | Pricing competitiveness | 20%    | [X]          | [X]            |
  | Communication/Response  | 15%    | [X]          | [X]            |
  | Flexibility             | 10%    | [X]          | [X]            |
  | TOTAL                   | 100%   |              | [X]            |

SUPPLIER TIERS:
  Score 8-10: Strategic partner. Invest in the relationship.
  Score 6-7: Acceptable. Monitor and communicate improvement areas.
  Score 4-5: At risk. Develop backup supplier. Address issues formally.
  Score 1-3: Replace. Begin sourcing alternatives immediately.

DUAL SOURCING STRATEGY:
  For A items: Always have at least 2 qualified suppliers.
  Split orders 70/30 between primary and secondary.
  If primary fails, secondary can scale up immediately.
  This costs slightly more but prevents catastrophic stockouts.
```

## Warehouse Organization

### Layout and Storage
```
WAREHOUSE ZONES:
  Receiving area: Where incoming shipments are checked and processed
  Storage area: Main inventory storage (organized by method below)
  Picking area: Where orders are assembled
  Packing area: Where orders are packaged for shipping
  Shipping area: Staged for carrier pickup

STORAGE METHODS:
  1. Fixed location: Each SKU has a permanent home
     Pro: Easy to find, consistent, good for small inventories
     Con: Wastes space when stock is low

  2. Random (dynamic) location: Items stored in the nearest open space
     Pro: Maximizes space utilization
     Con: Requires a tracking system (software or barcode + location)

  3. Zone-based: Combine fixed and random within zones
     A items: Fixed locations near picking area (fast access)
     B items: Zone-assigned, dynamic within zone
     C items: Back of warehouse, random within zone

PICKING OPTIMIZATION:
  Store fast-moving items (A items) closest to the packing area.
  Store heavy items on lower shelves.
  Store together items frequently ordered together.
  Use clear labels: SKU, product name, bin location, reorder point.
  Implement pick paths: Routes through the warehouse that minimize
  walking distance for common order combinations.
```

## Output Checklist

- [ ] Inventory tracking system selected and implemented
- [ ] All SKUs cataloged with cost, location, and supplier
- [ ] ABC analysis completed and categories assigned
- [ ] Reorder points calculated for A and B items
- [ ] Safety stock levels set based on service level targets
- [ ] Demand forecasting method selected and initial forecasts generated
- [ ] Cycle counting schedule established by ABC category
- [ ] Supplier scorecard created and reviewed quarterly
- [ ] Warehouse organized with zones and optimized storage
- [ ] Shrinkage tracking in place with variance investigation process


## Output Format

Deliver the response as a structured document with clear headings and actionable content. Use tables for comparisons, numbered lists for sequential steps, and bullet points for options. Include specific examples where applicable.

```
[Inventory Manager deliverable]
1. Context and objectives
2. Analysis or framework
3. Specific recommendations with rationale
4. Action items with timeline
```


## Example

**Input:** "Help me with inventory manager for a mid-size project."

**Output:** A complete inventory manager framework tailored to the specific context, with actionable steps, relevant considerations, and measurable outcomes.


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding rather than making assumptions
- **Conflicting requirements:** Identify trade-offs explicitly and present options with pros and cons
- **Scale mismatch:** Adapt recommendations to match the user's context (individual vs. team vs. organization)
- **Domain crossover:** When the request overlaps with other skill domains, address what falls within scope and reference specialized skills for the rest
