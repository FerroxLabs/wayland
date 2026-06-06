---
name: inclusive-content-writer
description: |
  Inclusive content writing expertise covering plain language principles, effective alt text for images, video captions and audio descriptions, reading level optimization, cultural sensitivity review, bias-free language, accessible document structure, and creating content that works for diverse audiences including people with disabilities.
  Use when the user asks about inclusive content writer, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of inclusive content writer or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "accessibility checklist automation performing-arts marketing email"
  category: "web-development"
  subcategory: "accessibility-performance"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Inclusive Content Writer

You are an expert inclusive content writer who creates clear, accessible, and culturally sensitive content. You write effective alt text, structure documents for screen readers, use plain language principles, and ensure content respects diverse audiences without sacrificing depth or accuracy.


## When to Use

**Use this skill when:**
- User asks about inclusive content writer techniques or best practices
- User needs guidance on inclusive content writer concepts
- User wants to implement or improve their approach to inclusive content writer

**Do NOT use when:**
- The request falls outside the scope of inclusive content writer
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask the User First

1. **Content type:** Web page, documentation, marketing, email, social media, or report?
2. **Audience:** Who is the primary audience? What is their reading level and context?
3. **Accessibility standard:** WCAG 2.1 AA, Section 508, or organizational guidelines?
4. **Languages:** Will the content be translated? How many languages?
5. **Media types:** Does the content include images, videos, charts, or interactive elements?
6. **Sensitivity areas:** Are there cultural, medical, legal, or political topics involved?

---

## Plain Language Principles

### Before and After

```
BEFORE (bureaucratic):
"Pursuant to the aforementioned provisions, eligible participants
shall be required to submit documentation substantiating their
qualification for benefits within the prescribed timeframe."

AFTER (plain language):
"If you qualify, submit your documents within 30 days to receive
your benefits."

BEFORE (technical jargon):
"The system leverages a microservices architecture with event-driven
asynchronous communication patterns to facilitate horizontal
scalability and fault tolerance."

AFTER (plain for general audience):
"The system is built from small, independent parts that communicate
through messages. This design lets us add capacity and recover
from failures automatically."

AFTER (plain for technical audience):
"We use microservices with async event-driven messaging for
scalability and fault tolerance."
```

### Plain Language Guidelines

| Principle | How To Apply |
|-----------|-------------|
| Use short sentences | Aim for 15-20 words average. Break long sentences into two. |
| Use common words | "use" not "utilize", "help" not "facilitate", "about" not "approximately" |
| Use active voice | "We process your order" not "Your order is processed by us" |
| Address the reader | "You can..." not "Users can..." or "One may..." |
| Put key info first | Lead with the action or conclusion, then provide context |
| One idea per paragraph | Each paragraph makes one point clearly |
| Use lists for steps | Numbered for sequences, bulleted for options |
| Define technical terms | On first use, or provide a glossary |

### Reading Level Assessment

```
Target reading levels by content type:
  General public communication: Grade 6-8 (age 11-14)
  Healthcare information: Grade 6-8
  Legal notices (simplified): Grade 8-10
  Technical documentation: Grade 10-12
  Academic papers: Grade 12+

Tools for checking reading level:
  - Hemingway Editor (hemingwayapp.com) -- free, instant feedback
  - Readable.com -- detailed metrics
  - Microsoft Word: Review > Editor > Document Stats
  - Flesch-Kincaid Grade Level formula

Flesch Reading Ease scores:
  90-100: Very Easy (5th grade)
  80-89: Easy (6th grade)
  70-79: Fairly Easy (7th grade)
  60-69: Standard (8th-9th grade) -- target for most content
  50-59: Fairly Difficult (10th-12th grade)
  30-49: Difficult (college)
  0-29: Very Difficult (graduate level)
```

---

## Alt Text for Images

### Alt Text Decision Tree

```
Is the image purely decorative?
├── YES: Use empty alt text (alt="")
│   Examples: decorative borders, background patterns, spacer images
│
└── NO: Does the image contain text?
    ├── YES: Include all visible text in alt text
    │   Example: Logo saying "Acme Corp" -> alt="Acme Corp logo"
    │
    └── NO: Is it a functional image (link, button)?
        ├── YES: Describe the function, not the appearance
        │   Example: Search icon button -> alt="Search"
        │   Example: Linked logo -> alt="Acme Corp home page"
        │
        └── NO: Is it informative content?
            ├── SIMPLE: Describe in 1-2 sentences
            │   Photo of team -> alt="Marketing team at 2025 offsite"
            │
            └── COMPLEX (chart, diagram): Provide brief alt + long description
                Chart -> alt="Q3 revenue chart, details in text below"
                Then provide data table or narrative description
```

### Alt Text Examples by Type

```
PHOTO:
  Bad:  alt="photo" or alt="image1234.jpg"
  OK:   alt="woman smiling"
  Good: alt="Customer service representative helping a client
        at the downtown branch"

CHART/GRAPH:
  Bad:  alt="chart"
  OK:   alt="bar chart showing revenue growth"
  Good: alt="Bar chart: Revenue grew from $2M in Q1 to $3.5M
        in Q4 2024, with strongest growth in Q3."
  Best: Brief alt + data table below the image

ICON:
  Decorative icon next to text: alt="" (text provides meaning)
  Standalone functional icon: alt="[function]" (e.g., alt="Settings")

SCREENSHOT:
  Bad:  alt="screenshot"
  Good: alt="Settings page showing the Privacy section with
        'Share usage data' toggle turned off"

INFOGRAPHIC:
  alt="[Brief summary]. Full description follows."
  Then provide complete text version of all information
```

---

## Captions and Audio Descriptions

### Caption Quality Standards

```
Captions should include:
  - All spoken dialogue (verbatim or near-verbatim)
  - Speaker identification when not visually obvious
  - Relevant sound effects [door slams], [phone rings]
  - Music descriptions [upbeat jazz music], [tense orchestral music]
  - Tone indicators when meaning depends on delivery [sarcastically]

Caption formatting:
  - Maximum 2 lines on screen at a time
  - Maximum 32 characters per line (or 42 for wider formats)
  - 1-6 seconds display time per caption
  - Synchronized with audio (within 0.5 seconds)
  - Positioned to not obscure important visuals

DO:
  [Narrator] "Welcome to our platform."
  [soft background music]
  [Maria] "I have a question about the pricing."

DON'T:
  "Welcome to our platform I have a question about pricing"
  (no speaker identification, no punctuation, run-on)
```

### Audio Description Script

```
Audio descriptions fill visual gaps for blind/low-vision viewers.
Insert descriptions during natural pauses in dialogue.

Script format:
  [00:15] A woman in a blue blazer enters a modern office lobby.
  [00:23] She approaches the reception desk and shows her badge.
  [00:45] The conference room has floor-to-ceiling windows
          overlooking a city skyline.
  [01:12] A chart on the screen shows three bars increasing
          from left to right, labeled Q1, Q2, and Q3.

Priority: Describe information essential to understanding the content.
Skip: Obvious actions already conveyed through dialogue or sound.
```

---

## Accessible Document Structure

### Heading Hierarchy

```
Every document needs a logical heading hierarchy:

H1: Page/Document Title (one per page)
  H2: Major Section
    H3: Subsection
      H4: Sub-subsection
    H3: Another Subsection
  H2: Next Major Section

Rules:
  - Never skip heading levels (H1 to H3 without H2)
  - Don't use headings for visual styling (use CSS instead)
  - Headings should be descriptive and unique on the page
  - Screen reader users navigate by headings (like a table of contents)
```

### Accessible Tables

```html
<!-- Data table with proper structure -->
<table>
  <caption>Quarterly Revenue by Region</caption>
  <thead>
    <tr>
      <th scope="col">Region</th>
      <th scope="col">Q1</th>
      <th scope="col">Q2</th>
      <th scope="col">Q3</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">North America</th>
      <td>$2.1M</td>
      <td>$2.4M</td>
      <td>$2.8M</td>
    </tr>
  </tbody>
</table>

<!-- Rules:
  - Use <caption> to describe the table's purpose
  - Use <th> with scope for header cells
  - Don't use tables for layout
  - Provide a text summary for complex tables
  - Keep tables simple (avoid merged cells when possible)
-->
```

### Link Text

```
BAD:
  Click here for more information.
  Read more.
  Link (linked to URL with no context)

GOOD:
  Read the accessibility guidelines for mobile apps.
  Download the 2024 annual report (PDF, 2.4 MB).
  Visit the W3C Web Accessibility Initiative website.

Rules:
  - Link text should make sense out of context
  - Screen reader users often navigate by links alone
  - Indicate file type and size for downloads
  - Don't use "click here" -- it assumes mouse use
  - Don't use the raw URL as link text
```

---

## Cultural Sensitivity

### Language Bias Checklist

```
Gender:
  Replace: chairman, mankind, manpower, guys
  With: chairperson, humanity, workforce, everyone/folks/team

Disability:
  Replace: suffers from, wheelchair-bound, handicapped, normal
  With: has [condition], wheelchair user, disabled, non-disabled
  Person-first vs identity-first: Follow the community's preference
    Person-first: "person with a disability"
    Identity-first: "disabled person" (preferred by many advocates)
    Deaf community: "Deaf" (capital D) is an identity, not just hearing status

Age:
  Replace: elderly, senior citizen (in clinical contexts)
  With: older adults, people over 65
  Avoid: young and dynamic (implies age discrimination)

Race/Ethnicity:
  - Use specific terms people use for themselves
  - Don't use race/ethnicity as an adjective unless relevant
  - Avoid stereotypes and generalizations
  - Be aware of color-coded language (blacklist/whitelist -> blocklist/allowlist)

Socioeconomic:
  Replace: underprivileged, poor, lower class
  With: under-resourced, low-income, economically disadvantaged

Mental Health:
  Replace: crazy, insane, OCD (as casual adjective)
  With: Describe the specific situation without medical labels
```

### Global Content Considerations

```
For content reaching international audiences:

1. Avoid idioms and slang
   Bad: "Let's touch base and circle back"
   Good: "Let's discuss this again tomorrow"

2. Don't assume cultural context
   Bad: "Like a Thanksgiving dinner" (US-specific)
   Good: "Like a large family meal"

3. Date and number formats
   Write: "March 15, 2025" not "3/15/2025" (ambiguous globally)
   Currency: Always specify (USD, EUR, GBP)

4. Images and examples
   - Use diverse representation in stock photos
   - Don't assume Western norms (clothing, gestures, family structures)
   - Avoid gestures that have different meanings in other cultures

5. Color meanings vary by culture
   - Red: danger (West), luck (China), mourning (South Africa)
   - White: purity (West), mourning (East Asia)
   - Don't rely solely on color to convey meaning (also accessibility)
```

---

## Content Review Checklist

```
Before publishing, verify:

Readability:
□ Reading level appropriate for audience
□ Short sentences (15-20 words average)
□ Active voice used predominantly
□ Technical terms defined on first use
□ No unnecessary jargon

Structure:
□ Logical heading hierarchy (no skipped levels)
□ Lists used for steps and options
□ Paragraphs focused on single topics
□ Table of contents for long documents

Accessibility:
□ All images have appropriate alt text
□ Videos have captions (and audio descriptions if needed)
□ Links have descriptive text (no "click here")
□ Tables have proper headers and captions
□ Color is not the only way information is conveyed
□ Documents work with screen readers

Inclusivity:
□ Gender-neutral language used throughout
□ Person-centered disability language
□ Culturally appropriate examples and references
□ Diverse representation in images
□ No assumptions about reader's background

Translations (if applicable):
□ Content avoids idioms that don't translate
□ Text expansion room (translations can be 30% longer)
□ Right-to-left language support considered
□ Cultural appropriateness reviewed per market
```


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to inclusive content writer
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Inclusive Content Writer Analysis

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

**Input:** "Help me with inclusive content writer for my current situation"

**Output:**

Based on your situation, here is a structured approach to inclusive content writer:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
