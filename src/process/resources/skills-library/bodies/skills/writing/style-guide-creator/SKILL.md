---
name: style-guide-creator
description: |
  Expert technical style guide creation covering tone and voice definition, terminology glossary, formatting standards, code sample conventions, inclusive language, abbreviation rules, numbering/list conventions, cross-reference patterns, and review checklist.
  Use when the user asks about style guide creator, style guide creator best practices, or needs guidance on style guide creator implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "technical-writing documentation best-practices"
  category: "writing"
  subcategory: "technical-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Style Guide Creator

## Overview

This skill provides comprehensive expertise in creating technical style guides that ensure consistency, clarity, and professionalism across all documentation produced by a team or organization. A style guide eliminates subjective debates, accelerates writing and review, and delivers a cohesive experience for readers regardless of which team member authored the content.

## Style Guide Structure

### Recommended Sections

```
Technical Style Guide Table of Contents:

1. Purpose and Scope
2. Audience Definitions
3. Tone and Voice
4. Grammar and Mechanics
5. Terminology and Glossary
6. Formatting Standards
7. Code Sample Conventions
8. Inclusive Language
9. Abbreviations and Acronyms
10. Numbers and Lists
11. Cross-References and Links
12. Visual Content (images, diagrams)
13. Accessibility
14. Review Checklist
15. Exceptions and Updates
```

## Tone and Voice

### Defining Your Documentation Voice

```markdown
## Voice Attributes

Our documentation voice is:

| Attribute | We are... | We are NOT... |
|-----------|-----------|---------------|
| **Clear** | Direct, specific, unambiguous | Vague, wordy, jargon-heavy |
| **Helpful** | Anticipating questions, providing context | Condescending, overly brief |
| **Professional** | Confident, accurate, trustworthy | Stiff, bureaucratic, cold |
| **Inclusive** | Welcoming to all skill levels | Assuming expertise, exclusionary |
| **Concise** | Saying enough, then stopping | Verbose, repetitive, padded |

### Voice in Practice

**Too casual:**
> So basically, you just grab the API key and slap it in the header
> and you're good to go!

**Too formal:**
> The aforementioned authentication credential shall be transmitted
> via the HTTP Authorization header in accordance with RFC 7235.

**Just right:**
> Include your API key in the `Authorization` header of each request.
> See [Authentication](#authentication) for details.
```

### Tone Adjustments by Context

| Context | Tone Adjustment | Example |
|---------|----------------|---------|
| Error messages | Empathetic, solution-focused | "This field requires a value. Enter a product name to continue." |
| Tutorials | Encouraging, step-by-step | "You now have a working API. Next, you will add authentication." |
| API reference | Precise, factual | "Returns a paginated list of products. Maximum 100 per page." |
| Release notes | Informative, forward-looking | "You can now search products by category. This replaces the legacy filter parameter." |
| Warnings | Direct, clear about consequences | "Deleting a workspace removes all projects within it. This action cannot be undone." |

### Second Person and Active Voice

```markdown
## Person and Voice Rules

1. Address the reader as "you" (second person)
   - GOOD: "You can configure the timeout in settings."
   - BAD: "The user can configure the timeout in settings."
   - BAD: "One can configure the timeout in settings."

2. Use active voice
   - GOOD: "The server returns a 200 status code."
   - BAD: "A 200 status code is returned by the server."

3. Use present tense for descriptions
   - GOOD: "This function validates the input."
   - BAD: "This function will validate the input."

4. Use imperative mood for instructions
   - GOOD: "Run the migration script."
   - BAD: "You should run the migration script."
   - BAD: "The migration script should be run."

5. Refer to the product by name (not "we" or "our")
   - GOOD: "Acme API supports pagination."
   - ACCEPTABLE: "We support pagination." (in conversational contexts)
   - BAD: "Our product supports pagination." (in reference docs)
```

## Terminology and Glossary

### Building a Terminology Glossary

```markdown
## Terminology Standards

Use these terms consistently. The "Preferred" column is the only acceptable
form in our documentation.

| Preferred | Avoid | Notes |
|-----------|-------|-------|
| API key | api key, API Key, Api Key | Always "API key" (noun) |
| app | application | Use "app" in user-facing docs |
| back end (noun) | back-end | Two words as a noun |
| back-end (adj) | backend | Hyphenated as an adjective |
| command line (noun) | commandline | Two words as a noun |
# ... (condensed) ...
### Product-Specific Terms

| Term | Definition | Usage |
|------|-----------|-------|
| Workspace | A container for projects and team members | "Create a workspace for your team." |
| Pipeline | An automated sequence of build and deploy steps | "The pipeline runs on every push to main." |
| Runner | A compute instance that executes pipeline jobs | "Self-hosted runners run in your infrastructure." |
```

## Formatting Standards

### Heading Conventions

```markdown
## Heading Rules

1. Use sentence case for headings
   - GOOD: "Create a new project"
   - BAD: "Create a New Project"
   - BAD: "CREATE A NEW PROJECT"

2. Heading hierarchy
   - H1: Page title only (one per page)
   - H2: Major sections
   - H3: Subsections
   - H4: Rarely needed; consider restructuring
   - Never skip levels (H2 → H4 without H3)

3. Do not end headings with punctuation
   - GOOD: "Configure the database"
   - BAD: "Configure the database."
   - BAD: "How do I configure the database?"

4. Keep headings short (under 8 words)
   - GOOD: "Configure authentication"
   - BAD: "How to configure authentication for your application"
```

### Text Formatting Rules

```markdown
## When to Use Bold, Italic, and Code

**Bold** for:
- UI element names: Click **Save**.
- Key terms on first use: A **workspace** contains projects.
- Emphasis (sparingly): Do **not** delete the configuration file.

*Italic* for:
- Introducing new terms: This is called a *circuit breaker*.
- Titles of books or documents: See *The Pragmatic Programmer*.
- Mathematical variables: Where *n* is the number of retries.

`Code font` for:
- Inline code: Set the `timeout` parameter to `30`.
- File names: Edit `config.yaml`.
- Command names: Run `add the package dependency`.
- Environment variables: Set `DATABASE_URL`.
- HTTP methods and paths: Send a `GET` request to `/api/products`.
- Status codes: Returns `200 OK`.
- Boolean values: Set to `true`.
- Key names in JSON/YAML: The `name` field is required.

> Blockquotes for:
> - Notes, tips, warnings
> - Quoted text from external sources
```

### Admonition Conventions

```markdown
## Callout Types

Use these callout types consistently:

> **Note:** Supplementary information that is useful but not critical.
> Use for clarifications and additional context.

> **Tip:** A suggestion that helps the reader work more efficiently.
> Use for best practices and shortcuts.

> **Important:** Information the reader must know to succeed.
> Use for prerequisites and critical configuration.

> **Warning:** Information about potential data loss, security risk,
> or irreversible action. Use sparingly for maximum impact.

> **Caution:** Information about potential unexpected behavior.
> Less severe than a warning but still requires attention.

Rules:
- Maximum one callout per section (overuse reduces impact)
- Place callouts BEFORE the action they relate to
- Keep callout text to 1-3 sentences
- Never nest callouts
```

## Code Sample Conventions

### Code Block Standards

```markdown
## Code Sample Rules

1. Always specify the language for syntax highlighting
   \```python   ← Language identifier required
   print("hello")
   \```

2. Include a comment with the file path for file-based examples
   \```python
   # src/config.py
   DATABASE_URL = environment-variables["DATABASE_URL"]
   \```

3. Keep code blocks under 30 lines
   - Split longer examples into multiple blocks with explanations between them

4. Use obviously-fake example values, not realistic-looking credentials
   - GOOD: `api_key = "sk_test_EXAMPLE_KEY_REPLACE_ME"`
   # ... (condensed) ...
   - `<placeholder>` for values the reader must replace
   - Describe each placeholder below the code block
   - Example: Replace `<project-id>` with your project ID from the dashboard.

7. Line length maximum: 80 characters
   - Break long lines for readability
   - Use continuation characters appropriate to the language
```

## Inclusive Language

### Language Guidelines

```markdown
## Inclusive Language Standards

### Terms to Replace

| Avoid | Use Instead | Reason |
|-------|-------------|--------|
| whitelist | allowlist | Racial connotation |
| blacklist | denylist, blocklist | Racial connotation |
| master (branch) | main | Loaded term |
| slave | replica, secondary, follower | Loaded term |
| master/slave | primary/replica, leader/follower | Loaded term |
# ... (condensed) ...

- Do not assume all readers use a mouse
  - GOOD: "Select the option" or "Choose the option"
  - BAD: "Click the option" (in general instructions)
  - ACCEPTABLE: "Click" when specifically describing mouse interaction
- Describe visual content in text (for screen readers)
- Do not use color alone to convey meaning
```

## Abbreviations and Acronyms

### Rules

```markdown
## Abbreviation Rules

1. Spell out on first use, then abbreviate
   - "Application Programming Interface (API)" → then "API" throughout
   - Exception: universally known abbreviations (URL, HTML, CSS)
     need not be spelled out

2. Do not create custom abbreviations
   - If a term does not have a standard abbreviation, write it in full

3. Do not abbreviate in headings
   - GOOD: "Configure the Application Programming Interface"
   - OK: "Configure the API" (if already introduced earlier in the page)
   - BAD: "Configure the API" (if first mention)

4. Do not use Latin abbreviations in body text
   - Use "for example" instead of "e.g."
   - Use "that is" instead of "i.e."
   - Use "and so on" instead of "etc."
   - Exception: Acceptable in parenthetical asides
     (e.g., in a quick reference table)

5. Pluralize acronyms without an apostrophe
   - GOOD: "APIs", "URLs", "IDs"
   - BAD: "API's", "URL's", "ID's"
```

## Numbers and Lists

### Number Conventions

```markdown
## Number Rules

1. Spell out zero through nine; use numerals for 10 and above
   - "The API returns up to three errors."
   - "The response includes 15 fields."

2. Always use numerals for:
   - Technical values: "Set timeout to 5 seconds."
   - Code references: "Port 8080"
   - Versions: "Version 2.1"
   - Measurements: "3 GB of RAM"
   - Percentages: "5% error rate"

3. Do not start a sentence with a numeral
   - GOOD: "Fifteen users reported the issue."
   - BAD: "15 users reported the issue."
   - BETTER: Rephrase: "The issue was reported by 15 users."

4. Use commas in numbers 1,000 and above
   - "10,000 requests per second"
```

### List Conventions

```markdown
## List Rules

1. Use ordered (numbered) lists for:
   - Sequential steps ("First do X, then do Y")
   - Ranked items ("The top 3 causes are...")

2. Use unordered (bulleted) lists for:
   - Non-sequential items
   - Feature lists
   - Requirement lists

3. List formatting
   - Capitalize the first word of each item
   - Use parallel structure (all items start with a verb, or all are nouns)
   - End items with periods only if they are complete sentences
   - If one item needs a period, all items in that list get periods

4. Minimum 2 items; maximum 10 items per list
   # ... (condensed) ...
   - Set the API key
   - Start the server

   BAD (mixed structures):
   - Database configuration
   - Set the API key
   - The server should be started
```

## Cross-References and Links

### Link Conventions

```markdown
## Cross-Reference Rules

1. Use descriptive link text (not "click here")
   - GOOD: "See the [authentication guide](/docs/auth) for details."
   - BAD: "For details, [click here](/docs/auth)."
   - BAD: "See [this page](/docs/auth)."

2. Indicate external links
   - Internal: [Configuration guide](/docs/config)
   - External: [PostgreSQL documentation]([reference URL]) (external)

3. Use relative URLs for internal links
   - GOOD: `/docs/api/products`
   - BAD: `[reference URL]

4. Link to the most specific location
   - GOOD: "See [rate limiting](/docs/api/rate-limits#headers)"
   - BAD: "See [the API docs](/docs/api)"
# ... (condensed) ...
6. Verify links regularly
   - Run automated link checker in CI
   - Broken links are documentation bugs

7. When referencing other documentation sections:
   - Use the section heading name exactly
   - "As described in [Configure authentication](#configure-authentication)"
```

## Review Checklist

### Documentation Review Process

```markdown
## Review Checklist

### Content Accuracy
- [ ] Technical information is correct and verified
- [ ] Code samples run without errors
- [ ] Commands produce the described output
- [ ] Version numbers and URLs are current
- [ ] Screenshots match the current UI

### Style Compliance
- [ ] Headings use sentence case
- [ ] Active voice used throughout
- [ ] Reader addressed as "you"
- [ ] Terminology matches the glossary
- [ ] Abbreviations spelled out on first use
- [ ] Numbers follow formatting rules
- [ ] Lists use parallel structure

# ... (condensed) ...
- [ ] Heading structure supports screen readers

### Completeness
- [ ] All steps include verification ("you should see...")
- [ ] Error scenarios are addressed
- [ ] Prerequisites are listed
- [ ] Next steps / further reading provided
```

## Style Guide Maintenance

### Update Process

```
Style Guide Governance:
├── Owner: Documentation team lead (or designated style owner)
├── Review cadence: Semi-annual comprehensive review
├── Change process:
│   ├── Anyone can propose changes via PR to the style guide
│   ├── Changes discussed in documentation team meeting
│   ├── Approved changes take effect immediately
│   └── Existing docs are updated during regular maintenance
├── Exception process:
│   ├── Request exception with rationale in the PR
│   ├── Exceptions documented in the "Exceptions" section
│   └── Re-evaluate exceptions annually
└── Distribution:
    ├── Style guide lives in the documentation repository
    ├── Linting rules encode automatable guidelines
    ├── New team members read style guide during onboarding
    └── Key rules posted in documentation PR template
```

## Production Checklist

- [ ] Voice and tone attributes defined with examples
- [ ] Terminology glossary created with 50+ entries
- [ ] Formatting rules cover headings, text, code, and callouts
- [ ] Code sample conventions documented
- [ ] Inclusive language guidelines with replacement terms
- [ ] Abbreviation and number rules specified
- [ ] List formatting conventions established
- [ ] Cross-reference patterns documented
- [ ] Review checklist created and integrated into PR template
- [ ] Linting rules configured (markdownlint, Vale, or similar)
- [ ] Style guide reviewed by at least 3 team members
- [ ] New team member onboarding includes style guide review
- [ ] Update cadence and governance process established

## Output Format

```markdown
# Style Guide Creator Analysis

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

**Input:** "Help me implement style guide creator for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended style guide creator approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When style guide creator must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
