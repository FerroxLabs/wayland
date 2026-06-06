---
name: ecommerce-advisor
description: |
  E-commerce strategy covering platform selection, product listing optimization, conversion rate optimization, cart abandonment strategies, payment processing, shipping, inventory management, customer retention, and analytics KPIs. Use when the user asks about ecommerce advisor or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "entrepreneurship strategy seo marketing"
  category: "business-strategy"
  subcategory: "entrepreneurship"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Ecommerce Advisor

## When to Use

**Use this skill when:**
- The user wants to launch or optimize an e-commerce store with platform selection, product listings, or conversion rate optimization
- The user needs help with cart abandonment strategies, payment processing, or shipping logistics
- The user wants guidance on e-commerce analytics KPIs, customer retention, or inventory management
- The user needs to choose between Shopify, WooCommerce, BigCommerce, or other e-commerce platforms

**Do NOT use this skill when:**
- The user is running a dropshipping business specifically (use dropshipping-guide instead)
- The user is selling handmade goods on Etsy or craft fairs (use handmade-seller instead)
- The user is building a two-sided marketplace rather than a single-seller store (use marketplace-builder instead)

## Process

1. **Gather requirements.** Ask the user clarifying questions about their specific context, goals, constraints, and experience level.

2. **Analyze the situation.** Review the information provided and identify key factors, challenges, and opportunities relevant to ecommerce advisor.

3. **Develop the framework.** Create a structured approach tailored to the user's needs, incorporating best practices and domain-specific considerations.

4. **Deliver actionable output.** Present specific, implementable recommendations with clear rationale, timelines, and success criteria.

5. **Address edge cases.** Proactively identify potential issues, alternative approaches, and contingency plans.

**Use this skill when:**
- User needs guidance on ecommerce advisor
- User asks about ecommerce advisor best practices or techniques
- User wants a structured approach to ecommerce advisor

**Do NOT use this skill when:**
- A more specialized skill exists for the specific subtopic
- The request is outside the scope of ecommerce advisor
## Questions to Ask the User First

1. **What are you selling?** (Physical products, digital products, services, subscriptions)
2. **How many products/SKUs?** (1-10, 10-100, 100-1000, 1000+)
3. **What is your current stage?** (Planning, launching, operating, scaling)
4. **What is your monthly revenue?** (Pre-revenue, $0-5K, $5K-50K, $50K-500K, $500K+)
5. **Who is your target customer?** (Demographics, geography)
6. **What is your average order value?** (Or expected AOV)
7. **How do you fulfill orders?** (Self-fulfilled, 3PL, dropshipping, digital delivery)
8. **What is your current tech stack?** (Platform, tools, integrations)
9. **What is your biggest challenge?** (Traffic, conversion, operations, retention)
10. **What is your marketing budget?** (Monthly)
---
## Step 1: Platform Selection

### Platform Comparison Matrix
```
E-COMMERCE PLATFORM DECISION MATRIX

Score each platform 1-5 for your specific needs:

| Criteria              | Weight | Shopify | WooCommerce | BigCommerce | Squarespace | Custom |
|-----------------------|--------|---------|-------------|-------------|-------------|--------|
| Ease of setup         | {{w}}  | 5       | 3           | 4           | 5           | 1      |
| Customization         | {{w}}  | 3       | 5           | 4           | 2           | 5      |
| Scalability           | {{w}}  | 4       | 3           | 5           | 2           | 5      |
| Cost (low = better)   | {{w}}  | 3       | 4           | 3           | 4           | 1      |
| App ecosystem         | {{w}}  | 5       | 5           | 4           | 2           | 5      |
| SEO capabilities      | {{w}}  | 4       | 5           | 4           | 3           | 5      |
| Payment flexibility   | {{w}}  | 4       | 5           | 5           | 3           | 5      |
| Support quality       | {{w}}  | 4       | 2           | 4           | 3           | 1      |
| WEIGHTED SCORE        |        | {{}}    | {{}}        | {{}}        | {{}}        | {{}}   |
```

### Platform Recommendations by Business Type
```
QUICK PLATFORM GUIDE:

Just starting, < 100 products, non-technical:
  RECOMMENDATION: Shopify
  Why: Fastest to launch, excellent app ecosystem, managed hosting
  Cost: $39-399/month + 2.9% + $0.30 per transaction

WordPress site exists, need to add commerce:
  RECOMMENDATION: WooCommerce
  Why: Integrates with existing WordPress, maximum flexibility
  Cost: Hosting $20-100/month + extensions $0-300/year each

High-volume, complex catalog:
  RECOMMENDATION: BigCommerce
  Why: Built-in features reduce app dependency, no transaction fees
  Cost: $39-399/month (enterprise custom)

Service-based with simple products:
  RECOMMENDATION: Squarespace Commerce
  Why: Beautiful templates, built-in scheduling, simple setup
  Cost: $33-65/month

High customization needs, tech team available:
  RECOMMENDATION: Custom (headless commerce)
  Options: Medusa, Saleor, or headless Shopify + custom frontend
  Cost: $500-5000/month infrastructure + development costs
```
---
## Step 2: Product Listing Optimization

### Product Page Template
```
PRODUCT PAGE OPTIMIZATION CHECKLIST
PRODUCT TITLE:
  Format: {{Brand}} {{Product Name}} - {{Key Feature}} - {{Size/Color/Variant}}
PRODUCT IMAGES:
  Required images:
  - [ ] Hero image (white background, product centered)
  - [ ] Lifestyle image (product in use)
  - [ ] Scale image (product with size reference)
  - [ ] Detail image (close-up of key feature)
  - [ ] Package contents image (everything included)
  - [ ] Variant images (every color/option)
  Specifications:
  - [ ] Minimum 1000x1000px (2000x2000 recommended)
  - [ ] Consistent styling across products
  - [ ] Zoom capability enabled
  - [ ] Alt text on every image (SEO)
PRODUCT DESCRIPTION:
  Structure:
  1. Opening hook (address the problem/desire)
  2. Key benefits (3-5 bullets, benefit-first format)
  3. Feature details (specifications, materials)
  4. Social proof (review snippet, "As seen in...")
  5. Use case / who it is for
  Benefit-first bullet format:
  "{{Benefit}} -- {{Feature that enables it}}"
PRICING DISPLAY:
  - [ ] Price is prominent and easy to find
  - [ ] Compare-at price shown if on sale (with strikethrough)
  - [ ] Per-unit price for multi-packs
  - [ ] Shipping cost or "free shipping" noted
  - [ ] Payment installment options shown (Shop Pay, Afterpay)
TRUST ELEMENTS:
  - [ ] Customer reviews and star rating visible
  - [ ] Review count displayed
  - [ ] User-generated photos in reviews
  - [ ] Shipping and return policy linked
  - [ ] Satisfaction guarantee badge
  - [ ] Secure checkout badge
  - [ ] Stock status (creates urgency)
CALLS TO ACTION:
  - [ ] "Add to Cart" button is large and prominent
  - [ ] Button color contrasts with page background
  - [ ] Buy now / express checkout option
  - [ ] Wishlist/save option
  - [ ] Size guide link (if applicable)
```

### SEO for Product Pages
```
PRODUCT PAGE SEO CHECKLIST

ON-PAGE ELEMENTS:
- [ ] Title tag: {{Primary Keyword}} - {{Brand}} | {{Store Name}}
- [ ] Meta description: 150-160 chars with primary keyword and CTA
- [ ] H1: Product name with primary keyword
- [ ] URL: /products/{{primary-keyword-product-name}}
- [ ] Image alt text: Descriptive, keyword-included
- [ ] Schema markup: Product schema with price, availability, reviews
- [ ] Internal links: Related products, category pages

CONTENT:
- [ ] Unique product description (not manufacturer copy)
- [ ] Minimum 300 words of descriptive content
- [ ] FAQ section with common questions
- [ ] Keyword variations used naturally throughout
```
---
## Step 3: Conversion Rate Optimization (CRO)

### CRO Audit Framework
```
CONVERSION RATE OPTIMIZATION AUDIT
CURRENT METRICS:
  Overall conversion rate: {{pct}}% (benchmark: 2-3% average)
  Add-to-cart rate: {{pct}}% (benchmark: 8-10%)
  Cart-to-checkout rate: {{pct}}% (benchmark: 50-60%)
  Checkout completion rate: {{pct}}% (benchmark: 45-55%)
  Average order value: ${{aov}}
  Revenue per visitor: ${{rpv}}
HOMEPAGE AUDIT:
- [ ] Value proposition clear within 5 seconds
- [ ] Primary CTA visible above the fold
- [ ] Navigation is intuitive (max 7 top-level categories)
- [ ] Search bar is prominent
- [ ] Social proof visible (reviews, press logos, customer count)
- [ ] Mobile-responsive and fast-loading
CATEGORY PAGE AUDIT:
- [ ] Filters are relevant and functional
- [ ] Sort options include price, popularity, newest
- [ ] Product images are consistent in style
- [ ] Prices visible without clicking through
- [ ] Quick-view or add-to-cart from listing
PRODUCT PAGE AUDIT:
- [ ] (See Product Listing Optimization section above)
- [ ] Page load time < 3 seconds
- [ ] Sticky add-to-cart button on scroll
- [ ] Related/recommended products section
- [ ] Recently viewed products section
CART PAGE AUDIT:
- [ ] Cart accessible from any page (icon with count)
- [ ] Easy quantity adjustment
- [ ] Remove item option is clear
- [ ] Subtotal and estimated shipping shown
- [ ] Continue shopping button
- [ ] Promo code field (but not too prominent)
- [ ] Cross-sell / upsell suggestions
- [ ] Trust badges near checkout button
- [ ] Express checkout options (Apple Pay, Google Pay, PayPal)
CHECKOUT AUDIT:
- [ ] Guest checkout option (do NOT force account creation)
- [ ] Progress indicator (Step 1 of 3)
- [ ] Minimal form fields (only what is necessary)
- [ ] Auto-fill enabled
- [ ] Address validation
- [ ] Multiple payment options
- [ ] Order summary visible throughout
- [ ] Security badges visible
- [ ] Clear return/refund policy link
- [ ] Shipping cost shown before final step
```

### CRO Testing Roadmap
```
CRO TEST PRIORITY MATRIX

| Test Idea                           | Impact | Effort | Priority |
|-------------------------------------|--------|--------|----------|
| Add guest checkout                  | High   | Low    | DO FIRST |
| Add express payment (Apple Pay etc) | High   | Low    | DO FIRST |
| Add product reviews/ratings         | High   | Medium | HIGH     |
| Improve product photography         | High   | High   | HIGH     |
| Add free shipping threshold         | High   | Low    | DO FIRST |
| Simplify navigation                 | Medium | Medium | MEDIUM   |
| Add size guide                      | Medium | Low    | MEDIUM   |
| Sticky add-to-cart on mobile        | Medium | Low    | MEDIUM   |
| Optimize page load speed            | High   | Medium | HIGH     |
| Add live chat/chatbot               | Medium | Medium | MEDIUM   |
| Add urgency indicators              | Low    | Low    | LOW      |
| Redesign homepage                   | Medium | High   | LOW      |
```
---
## Step 4: Cart Abandonment Strategy
```
CART ABANDONMENT RECOVERY PLAN
AVERAGE CART ABANDONMENT RATE: 70% (industry average)
YOUR CURRENT RATE: {{pct}}%
PREVENTION (reduce abandonment before it happens):
1. Show shipping costs early (not at checkout)
2. Offer free shipping threshold: "Free shipping on orders over ${{amount}}"
3. Display trust badges throughout funnel
4. Provide multiple payment options
5. Enable guest checkout
6. Show stock levels / urgency cues
7. Simplify checkout to minimum steps
8. Save cart for returning visitors
RECOVERY (win back abandoners):
EMAIL SEQUENCE:
  Email 1 (1 hour after abandonment):
    Subject: "You left something behind"
    Content: Cart contents with images, direct link back
    CTA: "Complete your order"
    Incentive: None (test without discount first)
  Email 2 (24 hours after):
    Subject: "Still thinking about {{product_name}}?"
    Content: Social proof, reviews, benefits reminder
    CTA: "Return to your cart"
    Incentive: Free shipping or small discount (optional)
  Email 3 (72 hours after):
    Subject: "Last chance -- your cart is about to expire"
    Content: Urgency, limited stock, final offer
    CTA: "Complete your order now"
    Incentive: {{discount_pct}}% off or free gift (optional)
RETARGETING ADS:
  Platform: Facebook/Instagram, Google Display
  Audience: Cart abandoners (exclude purchasers)
  Creative: Show exact products left in cart
  Offer: Match email sequence incentive
  Duration: 7-14 days post-abandonment
  Budget: ${{daily_budget}}/day
EXIT-INTENT POPUP:
  Trigger: Mouse moves toward close/back button
  Offer: "Wait! Get {{discount}}% off your order"
  Or: "Free shipping on your first order"
  Capture: Email address for follow-up
```
---
## Step 5: Payment & Shipping Strategy

### Payment Processing
```
PAYMENT STRATEGY

REQUIRED PAYMENT METHODS:
- [ ] Credit/debit cards (Visa, Mastercard, Amex)
- [ ] PayPal
- [ ] Apple Pay
- [ ] Google Pay
- [ ] Shop Pay (Shopify stores)

CONSIDER ADDING:
- [ ] Buy now, pay later (Afterpay, Klarna, Affirm)
      Impact: Can increase AOV 20-30%
- [ ] Cryptocurrency (if relevant to audience)
- [ ] Wire transfer / ACH (B2B, high-value orders)
- [ ] Local payment methods (for international markets)

PAYMENT PROCESSOR COMPARISON:
| Feature           | Stripe    | PayPal    | Square    | Shopify Payments |
|-------------------|-----------|-----------|-----------|-----------------|
| Transaction fee   | 2.9%+30c | 2.99%+49c| 2.9%+30c  | 2.9%+30c        |
| International fee | +1.5%    | +1.5%    | +1.0%    | +1.5%           |
| Payout time       | 2 days   | Instant  | 1-2 days | 2-3 days        |
| Chargeback fee    | $15      | $20      | $0       | $15             |
| PCI compliance    | Included | Included | Included | Included        |

FRAUD PREVENTION:
- [ ] Enable 3D Secure (Verified by Visa, Mastercard SecureCode)
- [ ] Set up address verification (AVS)
- [ ] Enable CVV verification
- [ ] Set fraud filters (high-risk countries, mismatched billing/shipping)
- [ ] Review high-value orders manually
- [ ] Use fraud detection service (Stripe Radar, Signifyd)
```

### Shipping Strategy
```
SHIPPING STRATEGY

SHIPPING OPTIONS TO OFFER:
  [ ] Free shipping (absorb cost, best for conversion)
      Implementation: Build shipping cost into product price
      Or: Free shipping on orders over ${{threshold}}

  [ ] Flat rate shipping: ${{amount}} per order

  [ ] Calculated shipping: Real-time carrier rates

  [ ] Expedited/express: ${{amount}} for {{delivery_days}}-day delivery
      Important for: Gift purchases, time-sensitive products

  [ ] Local delivery/pickup: Free or ${{amount}}
      Good for: Businesses with local presence

CARRIER SELECTION:
| Need                  | Recommended          | Why                      |
|-----------------------|---------------------|--------------------------|
| Best overall value    | USPS (small/light)  | Cheapest for < 1 lb      |
| Reliable tracking     | UPS                 | Consistent, good tracking |
| International         | DHL / FedEx Intl    | Customs handling          |
| Same/next day         | Local courier       | Speed                    |
| Multi-carrier rates   | ShipStation/Shippo  | Rate comparison tools    |

SHIPPING PAGE CONTENT:
- [ ] Processing time: {{business_days}} business days
- [ ] Estimated delivery times by method
- [ ] Shipping cost table or calculator
- [ ] International shipping availability
- [ ] Tracking information provided via email
- [ ] Holiday/peak season shipping deadlines
```
---
## Step 6: Inventory Management
```
INVENTORY MANAGEMENT BASICS

INVENTORY METHODS:
  [ ] Just-in-time (JIT): Order as needed, minimal stock
  [ ] Safety stock: Buffer above expected demand
      Formula: Safety stock = Z x stddev(demand) x sqrt(lead time)
  [ ] Economic Order Quantity (EOQ):
      Formula: EOQ = sqrt((2 x annual demand x order cost) / holding cost)
  [ ] Dropshipping: No inventory, supplier ships direct

KEY METRICS:
  Inventory turnover: {{turns}}/year (benchmark: 4-6 for retail)
    Formula: COGS / Average inventory
  Days sales of inventory: {{days}} (benchmark: 30-60)
    Formula: 365 / Inventory turnover
  Stockout rate: {{pct}}% (target: < 2%)
  Carrying cost: {{pct}}% of inventory value/year (typical: 20-30%)

REORDER POINT CALCULATION:
  Average daily sales: {{units}}/day
  Lead time from supplier: {{days}} days
  Safety stock: {{units}}
  Reorder point = (Daily sales x Lead time) + Safety stock
  = ({{daily}} x {{lead}}) + {{safety}} = {{reorder_point}} units

INVENTORY TOOLS:
  Shopify: Built-in inventory tracking
  TradeGecko/QuickBooks Commerce: Multi-channel inventory
  Cin7: Warehouse management
  ShipBob: 3PL with inventory management
```
---
## Step 7: Customer Retention
```
CUSTOMER RETENTION STRATEGY
RETENTION METRICS:
  Repeat purchase rate: {{pct}}% (target: 25-30%+)
  Customer lifetime value: ${{ltv}}
  Average time between purchases: {{days}} days
  Customer retention rate: {{pct}}% (target: 80%+ annually)
RETENTION TACTICS:
1. EMAIL MARKETING:
   - Post-purchase thank you (immediate)
   - Product education / how-to (Day 3)
   - Review request (Day 7-14)
   - Cross-sell recommendation (Day 21)
   - Replenishment reminder (Day {{reorder_cycle}})
   - Win-back for lapsed customers (Day 60-90)
2. LOYALTY PROGRAM:
   Structure: Points per dollar spent
3. SUBSCRIPTION/AUTO-REPLENISH:
   Offer: {{discount_pct}}% off for subscribe-and-save
   Frequency options: Every {{2/4/6/8}} weeks
   Easy pause/cancel (reduces friction to sign up)

4. POST-PURCHASE EXPERIENCE:
   - Branded packaging / unboxing experience
   - Handwritten thank-you note (for high-value orders)
   - Product insert with discount code for next purchase
   - Easy returns process (prepaid label included)

5. CUSTOMER SERVICE EXCELLENCE:
   - Response time target: < {{hours}} hours
   - Channels: Email, chat, phone (based on AOV)
   - Proactive outreach for shipping delays
   - Generous return/exchange policy
   - Surprise and delight moments
```
---
## Step 8: Analytics & KPIs
```
E-COMMERCE KPI DASHBOARD
TRAFFIC METRICS:
  Total sessions: {{count}} (trend: {{up/down/flat}})
  Unique visitors: {{count}}
  Traffic sources:
    Organic search: {{pct}}%
    Paid search: {{pct}}%
    Social: {{pct}}%
    Email: {{pct}}%
    Direct: {{pct}}%
    Referral: {{pct}}%
  Bounce rate: {{pct}}% (target: < 40%)
  Pages per session: {{count}} (target: > 3)
CONVERSION METRICS:
  Overall conversion rate: {{pct}}% (target: 2-3%+)
  Add-to-cart rate: {{pct}}% (target: 8-10%+)
  Cart abandonment rate: {{pct}}% (target: < 70%)
  Checkout completion rate: {{pct}}% (target: > 45%)
REVENUE METRICS:
  Revenue: ${{revenue}} (period: {{period}})
  Average order value: ${{aov}} (target: +10% QoQ)
  Revenue per visitor: ${{rpv}}
  Gross margin: {{pct}}%
  Customer acquisition cost: ${{cac}}
  Customer lifetime value: ${{ltv}}
  LTV:CAC ratio: {{ratio}}:1 (target: > 3:1)
PRODUCT METRICS:
  Top 10 products by revenue: {{list}}
  Top 10 products by units: {{list}}
  Products with highest return rate: {{list}}
  Products with lowest conversion: {{list}}
REVIEW CADENCE:
  Daily: Revenue, orders, conversion rate, traffic
  Weekly: Traffic sources, top products, cart abandonment
  Monthly: Full KPI review, LTV/CAC, cohort analysis
  Quarterly: Channel ROI, retention analysis, competitive benchmarking
TOOLS:
  Analytics: Google Analytics 4, Shopify Analytics
  Heatmaps: Hotjar, Microsoft Clarity (free)
  A/B Testing: Google Optimize, Optimizely
  Email: Klaviyo, Mailchimp
  Reviews: Yotpo, Judge.me, Stamped.io
```
---
## E-Commerce Launch Checklist
```
PRE-LAUNCH (2-4 weeks before):
- [ ] Platform set up and configured
- [ ] All products listed with optimized descriptions and images
- [ ] Payment processing tested (place test orders)
- [ ] Shipping rates configured
- [ ] Tax settings configured (use TaxJar or built-in)
- [ ] Email marketing set up (welcome, abandoned cart, post-purchase)
- [ ] Analytics installed (GA4, Facebook Pixel)
- [ ] Legal pages: Privacy policy, Terms of service, Return policy
- [ ] Mobile experience tested on multiple devices
- [ ] Page speed optimized (< 3 seconds)
- [ ] SEO basics: Meta titles, descriptions, sitemaps
- [ ] Social media profiles created and linked
- [ ] Customer support channels set up

LAUNCH DAY:
- [ ] Final QA: Place orders from multiple devices/browsers
- [ ] Monitor for errors (checkout, payment, confirmation emails)
- [ ] Announce to email list, social media, communities
- [ ] Enable any launch promotions/discounts
- [ ] Monitor analytics in real-time

POST-LAUNCH (first 30 days):
- [ ] Review daily metrics
- [ ] Respond to all customer inquiries within 24 hours
- [ ] Collect and respond to customer feedback
- [ ] Fix any UX issues discovered through real usage
- [ ] Begin cart abandonment email sequence
- [ ] Start collecting reviews
- [ ] Plan first retention campaign
```
---
## Output Checklist

- [ ] Platform recommendation matches business needs and technical capability
- [ ] Product listings follow optimization best practices
- [ ] Conversion funnel has been audited with specific improvement recommendations
- [ ] Cart abandonment recovery plan includes email, ads, and prevention
- [ ] Payment and shipping strategies are configured for target market
- [ ] Retention plan addresses email, loyalty, and post-purchase experience
- [ ] KPI dashboard tracks the right metrics at the right frequency
- [ ] All recommendations are prioritized by impact and effort


## Output Format

Deliver the response as a structured document with clear headings and actionable content. Use tables for comparisons, numbered lists for sequential steps, and bullet points for options. Include specific examples where applicable.

```
[Ecommerce Advisor deliverable]
1. Context and objectives
2. Analysis or framework
3. Specific recommendations with rationale
4. Action items with timeline
```


## Example

**Input:** "Help me with ecommerce advisor for a mid-size project."

**Output:** A complete ecommerce advisor framework tailored to the specific context, with actionable steps, relevant considerations, and measurable outcomes.


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding rather than making assumptions
- **Conflicting requirements:** Identify trade-offs explicitly and present options with pros and cons
- **Scale mismatch:** Adapt recommendations to match the user's context (individual vs. team vs. organization)
- **Domain crossover:** When the request overlaps with other skill domains, address what falls within scope and reference specialized skills for the rest
