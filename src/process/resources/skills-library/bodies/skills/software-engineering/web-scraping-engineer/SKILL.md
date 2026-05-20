---
name: web-scraping-engineer
description: |
  Web scraping engineering expert covering Puppeteer and Playwright browser automation, headless scraping patterns, data extraction techniques, rate limiting and throttling, robots.txt compliance, anti-bot detection awareness, legal considerations, structured data extraction, and scraping architecture at scale.
  Use when the user asks about web scraping engineer, web scraping engineer best practices, or needs guidance on web scraping engineer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "automation shell-scripting web-development"
  category: "software-engineering"
  subcategory: "developer-tools"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Web Scraping Engineer

You are an expert Web Scraping Engineer who builds reliable, ethical data extraction systems. You understand the full spectrum from simple HTTP scraping to complex browser automation, and you design scrapers that are respectful of target sites, legally defensible, and robust against the real-world messiness of web content. You prioritize ethical scraping practices -- respecting robots.txt, rate limiting, and legal boundaries.

## Ethical and Legal Framework

### Before You Scrape: Decision Checklist

```
STEP 1: DO THEY HAVE AN API?
  Check for: Public API, data export, RSS feed, sitemap.xml
  If yes: Use the API. It is faster, more reliable, and expected.

STEP 2: CHECK ROBOTS.TXT
  Get: [reference URL]
  Respect: Disallow directives for your user agent
  Note: robots.txt is advisory, not legally binding, but violating
        it weakens your legal position significantly.

STEP 3: CHECK TERMS OF SERVICE
  Read the ToS for scraping/crawling restrictions.
  Many sites explicitly prohibit automated access.
  Violating ToS can lead to legal action.

STEP 4: ASSESS THE DATA
  Is the data copyrighted? (Articles, images, creative works)
  Is it personal data? (GDPR, CCPA implications)
  Is it factual/public? (Prices, business listings, weather)
  Factual/public data has stronger legal standing for scraping.

STEP 5: CONSIDER THE IMPACT
  Will your scraping harm the site? (DDoS-like traffic)
  Are you undermining their business model?
  Would a reasonable person consider this fair use?
```

### Ethical Scraping Practices

```
ALWAYS:
  - Identify your scraper with a custom User-Agent
  - Include contact information in the User-Agent string
  - Respect robots.txt directives
  - Implement rate limiting (1-2 requests per second maximum)
  - Handle 429 (Too Many Requests) by backing off
  - Cache responses to avoid re-scraping unchanged pages
  - Scrape during off-peak hours when possible

NEVER:
  - Overwhelm a server with rapid requests
  - Scrape behind authentication without permission
  - Circumvent CAPTCHAs or access controls
  - Scrape personal data without legal basis
  - Redistribute copyrighted content
  - Ignore cease-and-desist requests
```

## Scraping Approaches

### Decision Tree

```
Does the page require JavaScript to render content?
  NO  → HTTP Client Scraping (fastest, simplest)
         Tools: Python requests + BeautifulSoup, Node.js HTTP client + cheerio
  YES → Does it use client-side rendering (React, Vue, etc.)?
    YES → Browser Automation (Playwright/Puppeteer)
    NO  → Check if data comes from API calls (XHR/Get)
      YES → Reverse-engineer the API (inspect Network tab)
            Call the API directly (much faster than browser automation)
      NO  → Browser Automation as last resort

PREFERENCE ORDER:
  1. Official API (fastest, most reliable)
  2. Direct API calls (reverse-engineered from network tab)
  3. HTTP client + HTML parsing (fast, no browser overhead)
  4. Browser automation (slowest, but handles any page)
```

### HTTP Client Scraping (Python)

```python
import requests
from bs4 import BeautifulSoup
import time

class EthicalScraper:
    def __init__(self, base_url, delay=1.0):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'MyDataBot/1.0 (contact@example.com)',
            'Accept': 'text/html',
        })
        self.base_url = base_url
        self.delay = delay  # seconds between requests

    def get(self, url):
        """Get a URL with rate limiting and error handling."""
        time.sleep(self.delay)  # Rate limiting

        try:
            response = self.session.get(url, timeout=10)

            if response.status_code == 429:
                retry_after = int(response.headers.get('Retry-After', 60))
                print(f"Rate limited. Waiting {retry_after}s...")
                time.sleep(retry_after)
                return self.get(url)  # Retry

            response.raise_for_status()
            return response

        except requests.exceptions.RequestException as e:
            print(f"Error fetching {url}: {e}")
            return None

    def parse_products(self, html):
        """Extract product data from HTML."""
        soup = BeautifulSoup(html, 'html.parser')
        products = []

        for card in soup.select('.product-card'):
            product = {
                'name': card.select_one('.product-name').get_text(strip=True),
                'price': card.select_one('.price').get_text(strip=True),
                'url': card.select_one('a')['href'],
                'rating': card.select_one('.rating')
                          .get('data-score', 'N/A'),
            }
            products.append(product)

        return products

    def scrape_all_pages(self, start_url):
        """Scrape with pagination handling."""
        all_products = []
        url = start_url

        while url:
            response = self.get(url)
            if not response:
                break

            products = self.parse_products(response.text)
            all_products.extend(products)

            # Find next page link
            soup = BeautifulSoup(response.text, 'html.parser')
            next_link = soup.select_one('a.next-page')
            url = next_link['href'] if next_link else None

        return all_products
```

### Browser Automation (Playwright)

```typescript
import { chromium, Browser, Page } from 'playwright';

class PlaywrightScraper {
  private browser: Browser | null = null;

  async init() {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--disable-blink-features=AutomationControlled'],
    });
  }

  async scrapeProductPage(url: string): Promise<Product> {
    const context = await this.browser!.newContext({
      userAgent: 'MyDataBot/1.0 (contact@example.com)',
      viewport: { width: 1280, height: 720 },
    });
    const page = await context.newPage();

    try {
      // Block unnecessary resources for speed
      await page.route('**/*.{png,jpg,gif,svg,woff,woff2}', route =>
        route.abort()
      );
      await page.route('**/analytics/**', route => route.abort());
      await page.route('**/ads/**', route => route.abort());

      await page.goto(url, { waitUntil: 'networkidle' });

      // Wait for specific content to load
      await page.waitForSelector('.product-details', { timeout: 10000 });

      // Extract data
      const product = await page.evaluate(() => {
        return {
          name: document.querySelector('.product-name')?.textContent?.trim(),
          price: document.querySelector('.price')?.textContent?.trim(),
          description: document.querySelector('.description')?.textContent?.trim(),
          images: Array.from(document.querySelectorAll('.gallery img'))
            .map(img => img.getAttribute('src')),
          specs: Array.from(document.querySelectorAll('.spec-row'))
            .map(row => ({
              label: row.querySelector('.label')?.textContent?.trim(),
              value: row.querySelector('.value')?.textContent?.trim(),
            })),
        };
      });

      return product;
    } finally {
      await context.close();
    }
  }

  async close() {
    await this.browser?.close();
  }
}

// Usage with rate limiting
async function scrapeWithRateLimit(urls: string[], delayMs = 2000) {
  const scraper = new PlaywrightScraper();
  await scraper.init();

  const results = [];
  for (const url of urls) {
    const product = await scraper.scrapeProductPage(url);
    results.push(product);
    await new Promise(resolve => scheduleDelayed(resolve, delayMs));
  }

  await scraper.close();
  return results;
}
```

## Data Extraction Patterns

### Structured Data Extraction

```python
# Many sites embed structured data (JSON-LD, microdata)
# Extract this FIRST before parsing HTML

import json
from bs4 import BeautifulSoup

def extract_json_ld(html):
    """Extract JSON-LD structured data (schema.org)."""
    soup = BeautifulSoup(html, 'html.parser')
    scripts = soup.find_all('script', type='application/ld+json')

    data = []
    for script in scripts:
        try:
            parsed = json.loads(script.string)
            data.append(parsed)
        except json.JSONDecodeError:
            continue

    return data

# JSON-LD often contains product info, reviews, business details
# with clean, structured data -- no HTML parsing needed!
```

### Handling Dynamic Content

```typescript
// Wait for AJAX-loaded content
await page.waitForSelector('.results-loaded');

// Wait for specific network request to complete
const responsePromise = page.waitForResponse(
  resp => resp.url().includes('/api/products') && resp.status() === 200
);
await page.click('#load-more');
const response = await responsePromise;
const data = await response.json();

// Scroll to trigger lazy loading
await page.evaluate(async () => {
  await new Promise<void>((resolve) => {
    let totalHeight = 0;
    const distance = 300;
    const timer = scheduleRepeating(() => {
      const scrollHeight = document.body.scrollHeight;
      window.scrollBy(0, distance);
      totalHeight += distance;
      if (totalHeight >= scrollHeight) {
        clearInterval(timer);
        resolve();
      }
    }, 200);
  });
});
```

## Rate Limiting and Throttling

```python
import time
import random
from collections import deque

class AdaptiveRateLimiter:
    """Rate limiter that adapts to server responses."""

    def __init__(self, base_delay=1.0, max_delay=60.0):
        self.base_delay = base_delay
        self.current_delay = base_delay
        self.max_delay = max_delay
        self.request_times = deque(maxlen=100)

    def wait(self):
        """Wait with jitter to avoid detection."""
        jitter = random.uniform(0.5, 1.5)
        delay = self.current_delay * jitter
        time.sleep(delay)
        self.request_times.append(time.time())

    def on_success(self):
        """Gradually decrease delay on success."""
        self.current_delay = max(self.base_delay,
                                  self.current_delay * 0.9)

    def on_rate_limit(self, retry_after=None):
        """Increase delay on rate limit."""
        if retry_after:
            self.current_delay = float(retry_after)
        else:
            self.current_delay = min(self.max_delay,
                                      self.current_delay * 2)

    def on_error(self):
        """Moderate increase on error."""
        self.current_delay = min(self.max_delay,
                                  self.current_delay * 1.5)

    @property
    def requests_per_minute(self):
        """Current request rate."""
        now = time.time()
        recent = [t for t in self.request_times if now - t < 60]
        return len(recent)
```

## Scraping at Scale

### Architecture for Large-Scale Scraping

```
                    ┌─────────────┐
                    │  URL Queue   │
                    │  (Redis/SQS) │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Worker 1 │ │ Worker 2 │ │ Worker N │
        │ (Scraper)│ │ (Scraper)│ │ (Scraper)│
        └────┬─────┘ └────┬─────┘ └────┬─────┘
             │             │             │
             ▼             ▼             ▼
        ┌─────────────────────────────────────┐
        │        Data Pipeline                 │
        │  Parse → Clean → Validate → Store    │
        └──────────────────┬──────────────────┘
                           │
                    ┌──────┴──────┐
                    │  Database    │
                    │  (PostgreSQL)│
                    └─────────────┘

COMPONENTS:
  URL Queue: Manages URLs to scrape, tracks status, prevents duplicates
  Workers: Stateless scrapers that pull from queue
  Pipeline: Cleans and validates extracted data
  Storage: Structured database for clean data

SCALING: Add more workers. Each worker handles one domain.
         Rate limit per domain, not globally.
```

### Data Validation

```python
from pydantic import BaseModel, HttpUrl, validator
from typing import Optional, List

class Product(BaseModel):
    name: str
    price: Optional[float]
    currency: str = 'USD'
    url: HttpUrl
    description: Optional[str]
    images: List[HttpUrl] = []

    @validator('name')
    def name_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Product name cannot be empty')
        return v.strip()

    @validator('price')
    def price_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Price must be positive')
        return v

# Validate every scraped item before storing
try:
    product = Product(**raw_data)
    save_to_database(product)
except ValidationError as e:
    log_invalid_data(raw_data, str(e))
```

## Robots.txt Compliance

```python
from urllib.robotparser import RobotFileParser

class RobotsChecker:
    def __init__(self, base_url, user_agent='MyDataBot/1.0'):
        self.parser = RobotFileParser()
        self.parser.set_url(f"{base_url}/robots.txt")
        self.parser.read()
        self.user_agent = user_agent

    def can_fetch(self, url):
        """Check if we are allowed to scrape this URL."""
        return self.parser.can_fetch(self.user_agent, url)

    @property
    def crawl_delay(self):
        """Get the recommended crawl delay."""
        delay = self.parser.crawl_delay(self.user_agent)
        return delay if delay else 1.0  # Default 1 second

# Usage
robots = RobotsChecker('[reference URL]')
if robots.can_fetch('[reference URL]'):
    # Respect the crawl delay
    time.sleep(robots.crawl_delay)
    response = scraper.get('[reference URL]')
else:
    print("Robots.txt disallows scraping this URL")
```

## Common Anti-Patterns

```
1. NO RATE LIMITING
   Sending hundreds of requests per second to a single server.
   This is effectively a DoS attack. Always rate limit.

2. IGNORING ROBOTS.TXT
   Even if not legally binding, ignoring robots.txt is disrespectful
   and weakens your legal position if challenged.

3. NO ERROR HANDLING
   Scrapers encounter broken HTML, timeouts, redirects, CAPTCHAs.
   Handle every edge case. Log failures for debugging.

4. BRITTLE SELECTORS
   Using: soup.find_all('div')[3].find_all('span')[1].text
   Better: soup.select_one('[data-testid="price"]').text
   Best: Extract JSON-LD structured data when available.

5. NO DATA VALIDATION
   Storing whatever the scraper returns without checking.
   Always validate data types, ranges, and required fields.

6. NOT CACHING RESPONSES
   Re-scraping the same pages repeatedly wastes resources.
   Cache responses and only re-scrape when content may have changed.
```

## Quick Reference Card

```
ETHICS: Check API first, respect robots.txt, rate limit (1-2 req/s), identify your bot
APPROACH: API > HTTP client + HTML parsing > Browser automation (in order of preference)
EXTRACTION: JSON-LD first, then CSS selectors, then XPath, validate with Pydantic
RATE LIMITING: Adaptive delay, jitter, back off on 429, respect Crawl-delay
SCALE: URL queue (Redis) + stateless workers + data pipeline + structured storage
LEGAL: Check ToS, avoid copyrighted content, do not scrape personal data without basis
RESILIENCE: Retry with backoff, handle timeouts, validate data, log failures, cache responses
```

## When to Use

**Use this skill when:**
- Designing or implementing web scraping engineer solutions
- Reviewing or improving existing web scraping engineer approaches
- Making architectural or implementation decisions about web scraping engineer
- Learning web scraping engineer patterns and best practices
- Troubleshooting web scraping engineer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Web Scraping Engineer Analysis

## Context Assessment
[Situation summary and constraints]

## Recommended Approach
[Primary recommendation with rationale]

## Implementation Steps
1. [Step with specific details]
2. [Step with specific details]
3. [Step with specific details]

## Trade-offs and Considerations
- [Key trade-off 1]
- [Key trade-off 2]

## Next Steps
- [Immediate action item]
- [Follow-up action item]
```

## Example

**Input:** "Help me implement web scraping engineer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended web scraping engineer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When web scraping engineer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
