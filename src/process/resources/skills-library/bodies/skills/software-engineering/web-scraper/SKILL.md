---
name: web-scraper
description: |
  Web scraping expertise covering HTTP client selection, HTML parsing with BeautifulSoup and Cheerio, browser automation with Playwright and Puppeteer, rate limiting, robots.txt compliance, session and cookie handling, anti-detection techniques, data extraction patterns, pagination handling, and legal considerations.
  Use when the user asks about web scraper, web scraper best practices, or needs guidance on web scraper implementation.
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
  difficulty: "intermediate"
---

# Web Scraper

## Core Philosophy

Web scraping is the programmatic extraction of data from websites. It sits at the intersection of engineering, ethics, and law. A responsible scraper respects rate limits, follows robots.txt, identifies itself honestly, and minimizes impact on the target server. The best scraper is one that never gets blocked because it behaves like a respectful automated visitor.

## HTTP Client Selection

### Decision Tree

```
Do you need to render JavaScript?
  YES -> Browser automation (Playwright, Puppeteer)
  NO  -> Is the site API-based (XHR/Get requests)?
    YES -> HTTP client + reverse-engineer API calls
    NO  -> HTTP client + HTML parser (BeautifulSoup, Cheerio)
```

### Python: httpx (Recommended)

```python
import httpx
from selectolax.parser import HTMLParser

# Async HTTP client with connection pooling
async def scrape_product_pages(urls: list[str]) -> list[dict]:
    results = []
    async with httpx.AsyncClient(
        timeout=30.0,
        follow_redirects=True,
        headers={
            "User-Agent": "MyBot/1.0 (+[reference URL])",
            "Accept": "text/html",
            "Accept-Language": "en-US,en;q=0.9",
        },
        limits=httpx.Limits(max_connections=10, max_keepalive_connections=5),
    ) as client:
        for url in urls:
            response = await client.get(url)
            response.raise_for_status()
            data = parse_product_page(response.text)
            results.append(data)
            await asyncio.sleep(1)  # Rate limiting
    return results

def parse_product_page(html: str) -> dict:
    tree = HTMLParser(html)
    return {
        "title": tree.css_first("h1.product-title").text(strip=True),
        "price": tree.css_first("[data-testid='price']").text(strip=True),
        "description": tree.css_first(".product-description").text(strip=True),
        "images": [img.attrs["src"] for img in tree.css("img.product-image")],
    }
```

### Node.js: undici/get + Cheerio

```javascript
import * as cheerio from 'cheerio';

async function scrapeProductPage(url) {
    const response = await get(url, {
        headers: {
            'User-Agent': 'MyBot/1.0 (+[reference URL])',
            'Accept': 'text/html',
        },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);

    const html = await response.text();
    const $ = cheerio.load(html);

    return {
        title: $('h1.product-title').text().trim(),
        price: $('[data-testid="price"]').text().trim(),
        description: $('.product-description').text().trim(),
        images: $('img.product-image').map((_, el) => $(el).attr('src')).get(),
        specs: $('table.specs tr').map((_, row) => ({
            key: $(row).find('th').text().trim(),
            value: $(row).find('td').text().trim(),
        })).get(),
    };
}
```

## HTML Parsing

### BeautifulSoup (Python)

```python
from bs4 import BeautifulSoup

def parse_listing_page(html: str) -> list[dict]:
    soup = BeautifulSoup(html, 'lxml')  # lxml is fastest

    products = []
    for card in soup.select('.product-card'):
        product = {
            'name': card.select_one('.product-name').get_text(strip=True),
            'price': card.select_one('.price').get_text(strip=True),
            'url': card.select_one('a.product-link')['href'],
            'rating': float(card.select_one('[data-rating]').get('data-rating', 0)),
            'in_stock': 'out-of-stock' not in card.get('class', []),
        }
        # Handle optional elements
        review_el = card.select_one('.review-count')
        product['reviews'] = int(review_el.get_text(strip=True).replace(',', '')) if review_el else 0

        products.append(product)

    return products

def extract_structured_data(html: str) -> dict:
    """Extract JSON-LD structured data from page."""
    soup = BeautifulSoup(html, 'lxml')
    scripts = soup.select('script[type="application/ld+json"]')
    for script in scripts:
        data = json.loads(script.string)
        if data.get('@type') == 'Product':
            return data
    return {}
```

### Cheerio (JavaScript)

```javascript
import * as cheerio from 'cheerio';

function parseListingPage(html) {
    const $ = cheerio.load(html);

    return $('.product-card').map((_, card) => {
        const $card = $(card);
        return {
            name: $card.find('.product-name').text().trim(),
            price: $card.find('.price').text().trim(),
            url: $card.find('a.product-link').attr('href'),
            rating: parseFloat($card.find('[data-rating]').attr('data-rating') || '0'),
            inStock: !$card.hasClass('out-of-stock'),
            reviews: parseInt($card.find('.review-count').text().replace(/,/g, '') || '0'),
        };
    }).get();
}
```

## Browser Automation for Dynamic Sites

### Playwright (Recommended)

```python
from playwright.async_api import async_playwright

async def scrape_spa(url: str) -> dict:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent='MyBot/1.0 (+[reference URL])',
            viewport={'width': 1920, 'height': 1080},
        )
        page = await context.new_page()

        # Block unnecessary resources for speed
        await page.route('**/*.{png,jpg,jpeg,gif,svg,ico,woff,woff2}',
                         lambda route: route.abort())
        await page.route('**/analytics*', lambda route: route.abort())
        await page.route('**/ads*', lambda route: route.abort())

        await page.goto(url, wait_until='networkidle')

        # Wait for dynamic content
        await page.wait_for_selector('.product-grid', state='visible')

        # Interact: load all items via infinite scroll
        previous_count = 0
        while True:
            await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
            await page.wait_for_timeout(1000)
            current_count = await page.locator('.product-card').count()
            if current_count == previous_count:
                break
            previous_count = current_count

        # Extract data after all content is loaded
        products = await page.evaluate('''() => {
            return Array.from(document.querySelectorAll('.product-card')).map(card => ({
                name: card.querySelector('.product-name')?.textContent?.trim(),
                price: card.querySelector('.price')?.textContent?.trim(),
                url: card.querySelector('a')?.href,
            }));
        }''')

        await browser.close()
        return products
```

### Intercepting API Calls

```python
async def scrape_via_api_interception(url: str) -> list[dict]:
    """Instead of parsing HTML, intercept the XHR/get API calls."""
    collected_data = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Intercept API responses
        async def handle_response(response):
            if '/api/products' in response.url and response.status == 200:
                data = await response.json()
                collected_data.extend(data.get('items', []))

        page.on('response', handle_response)

        await page.goto(url, wait_until='networkidle')

        # Trigger pagination to collect all data
        while True:
            next_button = page.locator('button[aria-label="Next page"]')
            if not await next_button.is_visible() or not await next_button.is_enabled():
                break
            await next_button.click()
            await page.wait_for_timeout(1000)

        await browser.close()

    return collected_data
```

## Rate Limiting

```python
import asyncio
import time
from collections import deque

class RateLimiter:
    """Sliding window rate limiter."""

    def __init__(self, max_requests: int, time_window: float):
        self.max_requests = max_requests
        self.time_window = time_window
        self.timestamps = deque()

    async def acquire(self):
        now = time.monotonic()

        # Remove timestamps outside the window
        while self.timestamps and (now - self.timestamps[0]) > self.time_window:
            self.timestamps.popleft()

        if len(self.timestamps) >= self.max_requests:
            sleep_time = self.time_window - (now - self.timestamps[0])
            if sleep_time > 0:
                await asyncio.sleep(sleep_time)

        self.timestamps.append(time.monotonic())

# Usage
limiter = RateLimiter(max_requests=10, time_window=60)  # 10 req/min

async def fetch_with_rate_limit(client, url):
    await limiter.acquire()
    return await client.get(url)
```

## Robots.txt Compliance

```python
from urllib.robotparser import RobotFileParser

class RobotsTxtChecker:
    def __init__(self, base_url: str, user_agent: str = 'MyBot'):
        self.parser = RobotFileParser()
        self.parser.set_url(f'{base_url}/robots.txt')
        self.parser.read()
        self.user_agent = user_agent

    def can_fetch(self, url: str) -> bool:
        return self.parser.can_fetch(self.user_agent, url)

    def crawl_delay(self) -> float | None:
        delay = self.parser.crawl_delay(self.user_agent)
        return delay

# Usage
robots = RobotsTxtChecker('[reference URL]', 'MyBot')
if robots.can_fetch('[reference URL]'):
    delay = robots.crawl_delay() or 1.0
    # Proceed with delay
```

## Session and Cookie Handling

```python
async def scrape_with_session(login_url: str, target_url: str):
    async with httpx.AsyncClient(follow_redirects=True) as client:
        # Login to get session cookie
        login_response = await client.post(login_url, data={
            'username': 'user',
            'password': 'pass',
            'csrf_token': await get_csrf_token(client, login_url),
        })
        # Cookies are automatically stored in the client session

        # Access protected pages
        response = await client.get(target_url)
        return response.text

async def get_csrf_token(client, login_page_url):
    response = await client.get(login_page_url)
    soup = BeautifulSoup(response.text, 'lxml')
    return soup.select_one('input[name="csrf_token"]')['value']
```

## Anti-Detection Techniques

```python
# Rotate User-Agents
import random
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
]

headers = {'User-Agent': random.choice(USER_AGENTS)}

# Random delays between requests
await asyncio.sleep(random.uniform(1.0, 3.0))

# Playwright stealth mode
from playwright_stealth import stealth_async

async with async_playwright() as p:
    browser = await p.chromium.launch(headless=True)
    page = await browser.new_page()
    await stealth_async(page)  # Apply stealth patches
```

## Pagination Handling

```python
async def scrape_all_pages(base_url: str) -> list[dict]:
    all_items = []
    page_num = 1

    async with httpx.AsyncClient() as client:
        while True:
            response = await client.get(f"{base_url}?page={page_num}")
            items = parse_listing_page(response.text)

            if not items:
                break

            all_items.extend(items)

            # Check for next page
            soup = BeautifulSoup(response.text, 'lxml')
            next_link = soup.select_one('a[rel="next"]')
            if not next_link:
                break

            page_num += 1
            await asyncio.sleep(1)

    return all_items

# Cursor-based pagination (API)
async def scrape_api_cursor(api_url: str) -> list[dict]:
    all_items = []
    cursor = None

    async with httpx.AsyncClient() as client:
        while True:
            params = {'limit': 100}
            if cursor:
                params['cursor'] = cursor

            response = await client.get(api_url, params=params)
            data = response.json()

            all_items.extend(data['items'])

            cursor = data.get('next_cursor')
            if not cursor:
                break

            await asyncio.sleep(0.5)

    return all_items
```

## Data Extraction Patterns

### CSS Selector Patterns

```python
# Common extraction patterns
def extract_data(soup):
    return {
        # Text content
        'title': soup.select_one('h1').get_text(strip=True),

        # Attribute value
        'image': soup.select_one('img.main')['src'],

        # Data attribute
        'product_id': soup.select_one('[data-product-id]').get('data-product-id'),

        # Nested text with separator
        'breadcrumbs': ' > '.join(
            a.get_text(strip=True) for a in soup.select('.breadcrumb a')
        ),

        # Table extraction
        'specs': {
            row.select_one('th').get_text(strip=True): row.select_one('td').get_text(strip=True)
            for row in soup.select('table.specs tr')
            if row.select_one('th') and row.select_one('td')
        },

        # List extraction
        'features': [
            li.get_text(strip=True) for li in soup.select('ul.features li')
        ],

        # Price parsing
        'price': parse_price(soup.select_one('.price').get_text()),
    }

def parse_price(text: str) -> float | None:
    """Extract numeric price from text like '$1,234.56' or 'EUR 99.99'."""
    import re
    match = re.search(r'[\d,]+\.?\d*', text.replace(',', ''))
    return float(match.group()) if match else None
```

## Legal Considerations

```
ALWAYS:
- Check and respect robots.txt
- Include identifying User-Agent with contact info
- Respect rate limits and Crawl-delay directives
- Check Terms of Service before scraping
- Only scrape publicly available data
- Store and use data in compliance with privacy laws (GDPR, CCPA)

NEVER:
- Circumvent authentication without permission
- Scrape personal data without legal basis
- Overload servers with aggressive request rates
- Ignore cease-and-desist requests
- Scrape behind paywalls you haven't paid for
- Claim scraped data as your own copyrighted work

CONSIDER:
- Is there a public API? (Always prefer official APIs)
- Does the site offer data exports or feeds?
- Can you partner with the data provider?
- Is the data facts (generally OK) or creative expression (copyright)?
```

## Error Handling and Resilience

```python
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=30),
    retry=retry_if_exception_type((httpx.TimeoutException, httpx.HTTPStatusError)),
)
async def fetch_with_retry(client: httpx.AsyncClient, url: str) -> str:
    response = await client.get(url)
    if response.status_code == 429:  # Too Many Requests
        retry_after = int(response.headers.get('Retry-After', 60))
        await asyncio.sleep(retry_after)
        raise httpx.HTTPStatusError("Rate limited", request=response.request, response=response)
    response.raise_for_status()
    return response.text
```

## When to Use

**Use this skill when:**
- Designing or implementing web scraper solutions
- Reviewing or improving existing web scraper approaches
- Making architectural or implementation decisions about web scraper
- Learning web scraper patterns and best practices
- Troubleshooting web scraper-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Web Scraper Analysis

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

**Input:** "Help me implement web scraper for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended web scraper approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When web scraper must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
