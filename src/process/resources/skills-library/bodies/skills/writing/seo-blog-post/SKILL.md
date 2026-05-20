---
name: seo-blog-post
description: |
  Writes SEO-optimized blog posts with strategic keyword placement, meta
  description, internal linking plan, and search-intent alignment. Use when the
  user wants a blog post designed to rank in search engines, asks for keyword-
  focused content, or needs organic traffic growth content. Do NOT use for
  general blog posts without SEO goals (use `blog-post-writing`), social media
  content (use `linkedin-post` or `twitter-thread`), or technical documentation
  (use `readme-writing`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "blog-post seo writing"
  category: "writing"
  subcategory: "content-marketing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# SEO Blog Post

## When to Use

Use this skill when any of the following conditions are true:

- The user explicitly wants a blog post designed to rank in Google or other search engines, whether they say "SEO post," "keyword-optimized article," or "content that can drive organic traffic"
- The user provides a target keyword or asks you to find one -- they understand their goal is search visibility, not just publication
- The user is building a content marketing strategy and needs posts that serve as organic acquisition channels, pillar pages, or topic cluster spokes
- The user wants to outrank specific competitors or capture featured snippets, People Also Ask boxes, or other SERP features
- The user is updating or refreshing an existing blog post that is underperforming in rankings and needs a full SEO audit and rewrite
- The user is launching a new website or blog section and needs foundational content aligned to a keyword map or topic cluster architecture
- The user explicitly references terms like "search intent," "keyword difficulty," "domain authority," "E-E-A-T," or "search volume" -- they are thinking in SEO terms already

**Do NOT use this skill when:**

- The user wants a general-purpose blog post with no search ranking goal -- use `blog-post-writing` instead, which optimizes for reader experience and brand voice without keyword architecture constraints
- The user wants a LinkedIn article or platform-native essay -- use `linkedin-post`, where algorithm signals and engagement mechanics differ entirely from Google SEO
- The user wants a Twitter/X thread -- use `twitter-thread`, which operates on recency, virality, and compression rather than topical depth
- The user wants a how-to tutorial with step-numbered instructions as the primary format and no ranking strategy behind it -- use `how-to-guide` for clean procedural writing
- The user wants technical documentation, API reference, or README content -- use `readme-writing`, where discoverability comes from developer platforms, not Google web search
- The user wants a listicle with thin treatment of many items and no keyword architecture -- use `listicle-writing`, though note that a well-structured listicle CAN be SEO-optimized if the user confirms that goal
- The user needs a press release, product announcement, or news article with inverted-pyramid structure -- SEO blog structure conflicts with journalism conventions; use a dedicated PR or news skill

---

## Process

### Step 1: Gather the SEO Brief

Before writing a single word, establish the full context. Missing inputs here compound into structural problems that cannot be fixed with light editing.

- **Primary keyword:** The exact phrase the post must rank for. Ask for it verbatim, not paraphrased. "Email marketing tips" and "email marketing best practices" have different SERPs, different intents, and different competing pages.
- **Monthly search volume and keyword difficulty:** Ask if the user has this data from a tool such as Ahrefs, Semrush, Moz, or Google Keyword Planner. If not, ask for the topic so you can suggest keyword variations with realistic ranking potential. For new or low-authority sites, target KD (keyword difficulty) below 30. For established sites with strong backlink profiles, KD up to 60 can be viable.
- **Secondary keywords and LSI terms:** Ask for 3-5 related terms. These are not synonyms -- they are semantically related phrases that signal topical authority. "Project management software" as a primary keyword has LSI terms like "task tracking," "team collaboration tool," "Gantt chart," and "sprint planning."
- **Search intent classification:** Confirm one of four categories: (1) Informational -- user wants to learn something (how, what, why queries); (2) Commercial investigation -- user is comparing options before buying (best, vs., review, top queries); (3) Transactional -- user is ready to act (buy, download, sign up queries); (4) Navigational -- user is looking for a specific site. Most blog posts target informational or commercial investigation intent. The structure, depth, and CTA differ dramatically between them.
- **Target audience and expertise level:** The same keyword written for a novice reads completely differently from one written for a practitioner. "Kubernetes networking" for a DevOps engineer needs no definition of containers; for a junior developer it needs a two-sentence grounding. Establish this before writing.
- **Competing posts to reference or outperform:** Ask for 1-3 URLs of ranking competitors if the user has them. These inform structural gaps -- sections that competitors miss or handle poorly represent an opportunity to differentiate.
- **Target word count:** Default by intent: informational how-to posts: 1,500-2,500 words; definitive guides: 2,500-4,000 words; commercial comparison posts: 1,800-3,000 words; news or trending posts: 700-1,200 words. Never inflate word count with padding -- every paragraph must earn its place.
- **Internal linking context:** Ask what other pages exist on their site that could be linked to or from this post. Internal links are a primary ranking signal that most clients underestimate.

---

### Step 2: Conduct Search Intent Analysis and SERP Feature Targeting

Understanding what Google already ranks for a keyword reveals what the algorithm considers the "right" answer. Your post must satisfy the same intent signal -- or consciously challenge it with superior content.

- **Match the dominant content format on the SERP:** If the top 5 results for a keyword are all listicles, write a listicle-style structure. If they are long-form guides, write a guide. If the SERP shows a mix, choose the format that best fits the user's content strategy and differentiate on depth.
- **Identify featured snippet opportunities:** Featured snippets (position zero) appear for queries where Google extracts a direct answer. They come in three types: paragraph snippets (40-50 word definition or answer), list snippets (numbered or bulleted steps), and table snippets (comparative data). Design at least one section specifically to capture the snippet for the primary keyword.
- **Identify People Also Ask (PAA) questions:** PAA boxes appear in over 50% of SERPs and represent explicit question clusters around a topic. Include 3-5 PAA-format questions in the FAQ section, using the exact phrasing patterns Google surfaces ("How do I...," "What is the best...," "Why does...").
- **Note SERP features that indicate commercial intent bleed:** If the SERP shows product carousels, shopping ads, or comparison tables alongside blog results, the keyword has commercial intent mixed in. Add a comparison or recommendation section even if the user considers the post purely informational.
- **Assess competitor content gaps:** What does the top-ranking content not cover? Common gaps include: lacking real examples, avoiding specifics in favor of generality, not addressing edge cases, and missing the "what to do after" follow-through. These gaps are where the post should add depth.

---

### Step 3: Build the Keyword Placement Map

Keyword placement is architecture, not decoration. Map each keyword to a specific structural location before writing.

- **Primary keyword mandatory placements:** (1) H1 title -- as close to the front as possible; (2) within the first 100 words of body text -- ideally within the first 50; (3) in at least one H2 subheading; (4) in the meta description within the first 70 characters; (5) in the URL slug suggestion (hyphenated, lowercase, no stop words); (6) in the conclusion or summary section.
- **Secondary keyword placements:** Distribute across H2 headings, opening sentences of major sections, and body paragraphs. Each secondary keyword should appear at minimum once. Do not cluster multiple secondary keywords in the same paragraph.
- **LSI and semantic variation placements:** Spread throughout the body naturally. Google's Natural Language Processing evaluates semantic co-occurrence -- posts that use topically related vocabulary score higher for topical authority than posts that repeat the exact primary keyword phrase.
- **Keyword density target:** Primary keyword at 0.5%-1.5% of total word count. At 1,500 words, that is 7-22 occurrences. If you reach 15+ natural occurrences, stop -- you are likely forcing it. Secondary keywords at 0.3%-0.8% each.
- **Image alt text:** Every suggested image must have alt text incorporating a keyword variation. Alt text serves accessibility first and SEO second; write it descriptively with the keyword included, not the other way around.
- **Title tag vs. H1 distinction:** The title tag (meta title) and the H1 can differ slightly. The title tag must be under 60 characters to avoid truncation in SERPs. The H1 can be slightly longer for readability. Provide both when they differ.

---

### Step 4: Build the Content Outline

A structured outline prevents keyword drift, ensures full topical coverage, and makes the final post easier to navigate.

- **Open with the "answer first" principle:** The first 150 words should establish what the post covers and why it matters. Do not bury the lede. Informational posts must signal immediately that the reader is in the right place.
- **Use H2 headings as SERP-friendly section labels:** Write H2s as either keyword-containing statements ("How to Build an Employee Onboarding Checklist") or natural language questions ("What Should a Remote Onboarding Checklist Include?"). Both formats align with how users search.
- **Plan section sequence by user journey:** Early sections address the "what" and "why." Middle sections address the "how" with specifics. Late sections address objections, edge cases, or advanced applications. The final section before the conclusion should contain the highest-value or most differentiated insight.
- **Plan one unique angle section:** Every post must have at least one section that competing articles do not have. This can be: a proprietary framework, a counterintuitive finding, a case study, a checklist not found elsewhere, or a deeper dive into a subtopic competitors treat superficially.
- **Include a FAQ section in every post:** FAQ sections address long-tail question variations that the main post does not cover as H2s. Each FAQ answer is a featured snippet candidate. Structure each answer as: direct one-sentence answer, then 1-2 sentences of supporting context. Total: 40-60 words per answer.
- **Plan for scanners as well as readers:** Include a Key Takeaways section (bulleted, 5-7 points) and ensure every H2 heading communicates value on its own -- a reader skimming only the headings should understand the post's full value proposition.

---

### Step 5: Write the Meta Description and Title Tag

These are the first copy the user sees in search results. They determine click-through rate, which is a ranking signal.

- **Meta description formula:** [Primary keyword + specific benefit statement + implicit CTA] in 150-160 characters. Count characters precisely. Under 150 wastes space; over 160 gets truncated. Write it as a complete, compelling sentence.
- **Title tag formula for informational posts:** [Primary Keyword]: [Benefit or Scope Qualifier]. Example: "Remote Employee Onboarding Checklist: The 30-Day HR Guide." Colon-separated titles consistently outperform em dash or parenthetical titles in CTR tests.
- **Title tag formula for commercial investigation posts:** [Number] + [Adjective] + [Primary Keyword] + [Year or Qualifier]. Example: "7 Best Project Management Tools for Small Teams (2024)." The number signals a listicle structure, which drives higher CTR for comparison queries.
- **Never keyword-stuff the title tag:** The title must be a readable human sentence first. "SEO Blog Post Writing SEO Content SEO Strategy" is a spam signal that Google ignores or penalizes.
- **Use power words strategically:** Words like "Complete," "Ultimate," "Proven," "Step-by-Step," "Essential," and "Definitive" increase CTR. Use one per title. Using more than one reads as clickbait.

---

### Step 6: Write the Post Body

Follow the outline and keyword map, writing section by section. Readability and helpfulness drive E-E-A-T signals as much as technical keyword placement.

- **Paragraph length discipline:** 2-4 sentences per paragraph for informational content. Never exceed 6 sentences. Long paragraphs destroy mobile readability and increase bounce rate, which is a negative engagement signal.
- **Sentence variety:** Mix short declarative sentences with longer explanatory ones. A pattern of three long sentences followed by one short one creates rhythm. Avoid strings of 25+ word sentences -- they test poorly with screen-reading users.
- **Evidence requirements:** Every major claim needs a supporting data point, specific example, or concrete scenario. Avoid writing "many companies find that..." -- instead write "companies with structured onboarding programs report 50% higher retention in the first year (SHRM, 2022)." Specific numbers are more persuasive and more credible to both readers and search algorithms evaluating E-E-A-T.
- **E-E-A-T signals (Experience, Expertise, Authoritativeness, Trustworthiness):** Google's quality rater guidelines use E-E-A-T to evaluate content quality. Demonstrate experience by referencing real scenarios. Demonstrate expertise with specific, technical depth. Demonstrate authority with accurate attribution. Demonstrate trustworthiness with balanced, honest coverage including limitations and caveats.
- **Transition quality:** Each section must end with a sentence that bridges naturally to the next section or closes the section's argument. Cold section endings (a paragraph that just stops) signal low-quality writing to both readers and algorithmic quality signals.
- **Internal link placement:** Place internal link suggestions immediately after the most relevant paragraph in each section. Use `[INTERNAL LINK: topic]` notation so the user can map them to existing site content. Target 3-5 internal links per post minimum.
- **CTAs:** For commercial investigation posts, include one contextual CTA near the post's midpoint and one at the end. For informational posts, a single end-of-post CTA is sufficient. CTAs should not be generic ("contact us") -- they should be specific to the post's topic ("Download the free remote onboarding checklist template").

---

### Step 7: Add Structured Content Enhancements for SERP Features

These additions directly target rich results, featured snippets, and enhanced SERP real estate.

- **Key Takeaways / Summary box:** Place it either at the very top (before the introduction) as a TL;DR, or at the bottom as a conclusion. Top placement increases dwell time by giving scanners a reason to read more deeply. The box should use exactly 5-7 bullet points, each 10-20 words.
- **FAQ schema preparation:** Structure the FAQ section with bold question, then direct answer. This formatting maps to FAQ schema markup -- when the post is published, schema can be applied to this section to unlock FAQ rich results in Google.
- **Table insertion:** If the post compares options, phases, or criteria, include a markdown table. Tables increase the probability of a table featured snippet and dramatically improve readability for comparative content.
- **Numbered lists for processes:** Any procedural content should use numbered lists, not prose. Numbered lists are extracted as ordered list snippets by Google for "how to" queries.
- **Suggest image placement with SEO alt text:** Specify where images should be placed (after which section), what the image should show (screenshot, infographic, diagram, real photo), and provide the exact alt text string, including the target keyword where it reads naturally.

---

### Step 8: Final SEO and Quality Audit

Before delivering the output, verify against every rule in the Rules section. This step is not optional.

- Confirm primary keyword appears in H1, first 100 words, at least one H2, meta description, and conclusion
- Confirm title tag is under 60 characters; if not, provide a truncated alternative
- Confirm meta description is 150-160 characters
- Confirm no paragraph uses the primary keyword phrase more than once
- Confirm keyword density is 0.5%-1.5% for the primary keyword
- Confirm no banned opening phrases are present
- Confirm at least one FAQ section and one Key Takeaways section are included
- Confirm 3-5 internal link suggestions are present
- Confirm the post opens with the primary topic within the first 100 words without a rhetorical question lead

---

## Output Format

```
**URL Slug Suggestion:** /blog/[hyphenated-primary-keyword-phrase]

**Title Tag (for SERP, max 60 characters):**
[Keyword-Leading Title: Scope or Benefit Qualifier]

**Meta Description (150-160 characters):**
[Primary keyword within first 70 characters. Value proposition. Implicit or explicit CTA.]

**Primary Keyword:** [exact phrase] | **KD Estimate:** [Low/Medium/High] | **Search Intent:** [Informational/Commercial/Transactional]
**Secondary Keywords:** [keyword 1] | [keyword 2] | [keyword 3] | [keyword 4]
**Target Word Count:** [X words]

---

# [H1: Full Title With Primary Keyword Near the Front]

> **Key Takeaways**
> - [Most important insight from the post -- 10-20 words]
> - [Second key point]
> - [Third key point]
> - [Fourth key point]
> - [Fifth key point]

[Introduction paragraph 1: Hook with a specific statistic, scenario, or provocative fact. Establish stakes. Primary keyword appears here, naturally embedded.]

[Introduction paragraph 2: What this post covers and who it is for. Set expectations. 2-3 sentences.]

---

## [H2: First Major Section -- Secondary Keyword or Question Format]

[Paragraph 1: Core concept of this section. 2-4 sentences. Specific data point or example.]

[Paragraph 2: Expansion or second dimension of the concept. 2-4 sentences.]

[Paragraph 3 (optional): Edge, nuance, or counterpoint. 2-4 sentences.]

[INTERNAL LINK: suggest related topic -- e.g., "link to pillar page on [topic]"]

---

## [H2: Second Major Section]

[Paragraph 1]

[Paragraph 2]

### [H3: Subsection If Needed -- Only Within This H2]

[Paragraph or bulleted list]

[INTERNAL LINK: suggest related topic]

---

## [H2: Third Major Section -- Contains Unique Angle Not in Competitors]

[Paragraph 1]

[Paragraph 2]

[Data table if comparative content:]

| [Column 1]        | [Column 2]        | [Column 3]        |
|-------------------|-------------------|-------------------|
| [Row 1, Cell 1]   | [Row 1, Cell 2]   | [Row 1, Cell 3]   |
| [Row 2, Cell 1]   | [Row 2, Cell 2]   | [Row 2, Cell 3]   |

[INTERNAL LINK: suggest related topic]

---

## [H2: Fourth Major Section]

[Paragraph 1]

[Paragraph 2]

[Numbered list if procedural:]
1. [Step 1 with specific detail]
2. [Step 2 with specific detail]
3. [Step 3 with specific detail]

---

## Frequently Asked Questions

**[Question 1: natural language, mirrors how users actually search]**
[Direct one-sentence answer. 1-2 sentences of context. Total 40-60 words.]

**[Question 2]**
[Direct one-sentence answer. 1-2 sentences of context.]

**[Question 3]**
[Direct one-sentence answer. 1-2 sentences of context.]

**[Question 4]**
[Direct one-sentence answer. 1-2 sentences of context.]

**[Question 5]**
[Direct one-sentence answer. 1-2 sentences of context.]

---

## [Conclusion H2: Phrased as a Benefit or Next Step, Not "Conclusion"]

[Paragraph 1: Brief synthesis of the post's core argument. Do not simply repeat bullet points.]

[Paragraph 2: Forward-looking statement or call to action specific to the topic.]

[CTA: specific, relevant to the post -- not "contact us"]

---

**Internal Linking Plan:**

| Link Text                        | Target Page Topic                            | Placement Section       |
|----------------------------------|----------------------------------------------|-------------------------|
| [anchor text 1]                  | [existing or planned page on this topic]     | [Section name]          |
| [anchor text 2]                  | [existing or planned page on this topic]     | [Section name]          |
| [anchor text 3]                  | [existing or planned page on this topic]     | [Section name]          |
| [anchor text 4]                  | [existing or planned page on this topic]     | [Section name]          |
| [anchor text 5 (optional)]       | [existing or planned page on this topic]     | [Section name]          |

**Image Suggestions:**

| Placement (after section)        | Image Description                            | Alt Text                                        |
|----------------------------------|----------------------------------------------|-------------------------------------------------|
| [Section name]                   | [What the image shows -- be specific]        | "[Alt text with keyword where natural]"         |
| [Section name]                   | [What the image shows]                       | "[Alt text]"                                    |
| [Section name]                   | [What the image shows]                       | "[Alt text]"                                    |

**Schema Markup Recommendations:**
- Article schema: Yes (all posts)
- FAQ schema: Yes (apply to FAQ section)
- HowTo schema: [Yes/No, depending on whether procedural steps are present]
- Breadcrumb schema: Yes (if site has category architecture)
```

---

## Rules

1. **Never use the primary keyword more than once per paragraph.** Repetition within a paragraph is the most common keyword stuffing signal. Each occurrence must be in a different paragraph, and only the required placement locations (H1, first 100 words, one H2, meta description, conclusion) are guaranteed; all other occurrences must arise naturally.

2. **Never open with a generic landscape statement.** Banned openings include: "In today's digital landscape," "In recent years," "As the world becomes more...," "Whether you're a seasoned professional or a beginner," and any variant of "In today's [adjective] [noun]." These phrases signal low-quality AI content to both readers and Google's quality evaluators.

3. **Never open the post body with a rhetorical question.** "Have you ever wondered why...?" is a weak hook that signals the writer has nothing specific to say. Open instead with a statistic, a counterintuitive claim, a concrete scenario, or a direct statement of what the post delivers.

4. **Never write a "What Is [Topic]?" section as the first H2 unless the keyword itself is a definitional query.** For keywords like "what is blockchain" or "what is drip irrigation," a definitional H2 is appropriate because it matches search intent. For keywords like "best project management practices" or "how to reduce churn," a definitional opening ignores search intent and pushes the valuable content too far down the page.

5. **Never target multiple search intents in a single post.** A post targeting "email marketing software" (commercial investigation) and "how to write a welcome email" (informational) in the same article creates intent confusion. Google will struggle to rank it correctly for either keyword. If the user requests this, split them into two posts and note the recommendation.

6. **Never exceed 60 characters in the title tag.** Google displays approximately 600px of title width in SERPs, which corresponds to roughly 55-60 characters depending on character width. Titles that exceed this truncate with an ellipsis, reducing CTR and hiding the keyword. Provide a truncated alternative if the user's preferred title is too long.

7. **Always match the content format to the dominant SERP format for the keyword.** If the top 5 results are all listicles, the post should use a numbered or bulleted structure as the primary format. Publishing a long-form prose guide against a SERP dominated by listicles signals format mismatch to Google's ranking algorithm.

8. **Always write FAQ answers in 40-60 words with a direct first sentence.** The first sentence of every FAQ answer must directly answer the question -- not build context before answering. Google extracts the first complete answer it finds; burying the answer in sentence three disqualifies the section from featured snippet eligibility.

9. **Always include at least one data point per major H2 section.** Vague, assertion-only writing fails the E-E-A-T standard. Every section must contain at least one specific number, study reference, named methodology, or concrete scenario. "Research shows that onboarding affects retention" is insufficient. "Companies with structured 90-day onboarding programs report 58% higher retention in year one (SHRM, 2023)" is sufficient.

10. **Never use passive voice for more than 10% of sentences.** Passive voice degrades readability, increases Flesch-Kincaid reading difficulty, and creates ambiguity about who does what -- a critical failure in instructional or procedural content. Use active constructions: "The checklist guides managers" not "Managers are guided by the checklist."

11. **Always provide a URL slug suggestion** in the output header, using hyphens, lowercase, no stop words (a, the, and, of, for), and the primary keyword phrase. A clean slug is a lightweight ranking signal and improves click-through from SERPs.

12. **Always recommend schema markup types** appropriate to the post structure. Article schema is baseline for all posts. FAQ schema applies when a FAQ section is present. HowTo schema applies when numbered procedural steps are present. Schema markup unlocks rich results that can double click-through rates from SERPs.

13. **Never pad word count.** If the content is complete at 1,400 words, do not inflate it to 1,800 with restated paragraphs or filler transitions. Word count targets are minimums, not mandates. Content quality, not quantity, is the ranking signal. Google's Helpful Content guidelines specifically penalize content that exists to hit a word count rather than to serve the user.

---

## Edge Cases

### The User Has No Keyword Research

If the user provides only a topic and no keyword data, do not invent a primary keyword without explanation. Instead:

1. Identify 3-5 candidate keywords across a difficulty spectrum: one high-volume/high-difficulty (e.g., KD 60+), one mid-tier (KD 20-40), and one long-tail/low-difficulty (KD under 20).
2. Describe the trade-off for each: high-volume keywords require strong domain authority to rank; long-tail keywords have lower volume but higher conversion rates and faster ranking timelines.
3. Recommend the long-tail keyword for sites with domain authority under 30 (roughly: fewer than 100 external linking domains). Recommend the mid-tier keyword for established sites.
4. Proceed with the user's selection or, if they defer, proceed with the long-tail option and explain your reasoning.

### The Primary Keyword Is Highly Competitive (KD 70+)

A keyword with difficulty above 70 will not rank for a new or low-authority domain within any reasonable timeframe regardless of content quality. In this case:

- Flag the competition level explicitly. Do not silently write the post and let the user discover the problem six months later.
- Offer a long-tail variation that addresses the same intent with lower competition. "Project management software" (KD 85) becomes "project management software for nonprofit teams" (KD 22) -- same buyer intent, fraction of the competition.
- If the user insists on the high-competition keyword, write the post anyway but note in your output: "This post targets a high-difficulty keyword. Ranking will require strong backlink acquisition and may take 12-18 months for sites with low domain authority."

### The User Wants to Refresh an Existing Post

When the user provides an existing URL or post text instead of a new brief:

1. Identify the current primary keyword the post is targeting (or attempting to target).
2. Audit for structural gaps: missing FAQ section, absent Key Takeaways, missing primary keyword in first 100 words, title tag over 60 characters, or no internal links.
3. Identify content freshness issues: outdated statistics, deprecated tool references, or missing coverage of developments since publication.
4. Provide a revised version with changes marked using the notation `[UPDATED: ...]` for modified sections and `[ADDED: ...]` for new sections. Do not silently rewrite -- the user needs to see what changed and why.
5. Recommend a canonical URL preservation strategy: refreshing an existing URL is always preferable to creating a new URL for the same topic. Publishing the same content at a new URL loses any existing link equity.

### The Search Intent Is Ambiguous

Some keywords straddle intent categories. "Project management templates" could be informational (user wants to understand what they are), commercial investigation (user is comparing template options), or transactional (user wants to download one immediately). When intent is ambiguous:

- Describe all plausible intents to the user and ask which applies to their audience.
- If the user cannot determine intent, default to the intent shown by the majority of top-ranking results for that keyword -- the SERP is the clearest signal of what Google believes users want.
- Structure the post to satisfy the primary intent, but include a transitional CTA that addresses the secondary intent (e.g., an informational post about templates that includes a download link to satisfy transactional users in the audience).

### The Post Must Serve Both SEO and a Pillar Page / Topic Cluster Role

When the user indicates the post will function as a pillar page -- the central, comprehensive resource that links out to cluster content -- the structure must change:

- Word count should be at the upper end: 3,000-5,000 words to cover the topic comprehensively.
- Every major subtopic gets its own H2 section that briefly covers the subtopic and explicitly links to a dedicated cluster post for deeper coverage.
- The pillar page does not go maximally deep on any one subtopic -- it goes moderately deep on all subtopics and signals "for more depth, see [linked cluster post]."
- Include a table of contents immediately after the introduction with anchor links to each H2.
- Internal linking is bidirectional: the pillar links to all cluster posts; each cluster post links back to the pillar.

### The Topic Has YMYL (Your Money or Your Life) Classification

Keywords in health, finance, legal, safety, or medical categories are subject to Google's YMYL quality standards -- the highest scrutiny level in the quality rater guidelines. For these topics:

- E-E-A-T signals are not optional -- they are essential. Every claim requires attribution to a named, credible source. "Studies show" is insufficient. "A 2022 meta-analysis published in the Journal of Internal Medicine found" is the minimum standard.
- Recommend that the user attribute the post to a named author with relevant credentials, and include a byline with that author's title and credentials.
- Add a disclaimer section where appropriate (e.g., "This article is for informational purposes only and does not constitute medical/legal/financial advice. Consult a licensed [professional] before acting on this information.").
- Do not speculate or make probabilistic claims without hedging language. YMYL content that overstates certainty is a quality violation.

### The User Requests a Post in a Non-English Language

SEO principles are consistent across languages, but execution details differ:

- Keyword research must be conducted in the target language -- direct translation of English keywords does not produce equivalent search volume or intent.
- Keyword density thresholds remain the same (0.5%-1.5%), but natural keyword density varies by language due to morphology. German compound words, for instance, will produce lower exact-match keyword density than English equivalents.
- Title tag character limits are based on pixel width, not character count -- character-dense scripts (Chinese, Japanese) will hit the display limit at fewer characters.
- Ask whether the user has language-specific keyword data or requires English-language keyword data as a proxy. Proceed with available data and flag gaps.

---

## Example

**Input:**
"Write an SEO blog post targeting 'content calendar for social media.' Secondary keywords: social media content calendar template, how to plan social media content, social media scheduling. Target audience: marketing managers at B2B SaaS companies. The company also has pages on 'social media analytics' and 'content marketing strategy guide' that should be linked. No existing keyword research -- please recommend intent and approach."

---

**SEO Briefing (presented before writing):**

Primary keyword "content calendar for social media" carries an estimated KD of 38-45 (medium difficulty) with approximately 9,900 monthly searches. Search intent is informational with commercial investigation undertones -- users want to understand what a content calendar is and find one they can use. The SERP shows a mix of long-form guides and template-forward posts. Recommended approach: a hybrid post (guide + embedded template structure) at 1,800-2,200 words. The secondary keywords support a process-oriented structure.

---

**Output:**

**URL Slug Suggestion:** /blog/content-calendar-for-social-media

**Title Tag (58 characters):**
Content Calendar for Social Media: A Manager's Guide

**Meta Description (157 characters):**
A content calendar for social media turns inconsistent posting into a repeatable system. Learn how to plan, schedule, and optimize content across channels.

**Primary Keyword:** content calendar for social media | **KD Estimate:** Medium (38-45) | **Search Intent:** Informational / Commercial Investigation
**Secondary Keywords:** social media content calendar template | how to plan social media content | social media scheduling
**Target Word Count:** 1,900 words

---

# Content Calendar for Social Media: A Manager's Guide

> **Key Takeaways**
> - A social media content calendar reduces reactive posting and improves publishing consistency by 40-60% for most marketing teams
> - Plan content four weeks in advance minimum; six to eight weeks for campaign-heavy quarters
> - Organize your calendar by channel, content type, and search intent -- not just publish date
> - Batch content creation into weekly sprints to reduce context-switching and improve output quality
> - Review calendar performance monthly against engagement and pipeline data, not just post volume

Marketing teams that publish without a content calendar average 2.3 posts per week. Teams with a documented calendar average 6.1 posts per week and report 42% higher audience engagement scores (Content Marketing Institute, 2023). The difference is not effort -- it is infrastructure. A content calendar for social media is that infrastructure.

This guide covers how to build a calendar that handles B2B social media across multiple channels, how to structure it for a team rather than a solo operator, and how to connect it to campaign timelines so content supports pipeline, not just brand awareness.

---

## What a Social Media Content Calendar Actually Does

A content calendar is not a spreadsheet of post ideas. It is a planning system that links business goals to publishing schedules, assigns ownership, tracks content status, and creates a feedback loop between what you publish and what performs.

For B2B SaaS marketing managers, the calendar must serve three functions simultaneously: support demand generation by amplifying content that drives pipeline, maintain brand presence between campaign pushes, and create a content inventory that can be repurposed across channels without duplicating effort.

The distinction between a functional calendar and a filled-in template matters. A functional calendar tells every team member what is publishing this week, who owns it, where the asset lives, and how it connects to the quarter's priority campaign. A template with dates and vague content categories is a planning artifact, not a planning system.

[INTERNAL LINK: link to "content marketing strategy guide" for context on how the calendar fits into broader strategy]

---

## How to Plan Social Media Content Four Weeks Out

Planning a four-week content calendar for social media starts with the goal layer, not the content layer. Before filling in dates, answer three questions: What is the primary conversion goal for this period (demo requests, newsletter signups, event registrations)? Which channels does your audience actually use for business decisions? What content assets already exist that can anchor the calendar?

**Set the content mix ratio first.** B2B social media typically performs best with a 4-1-1 ratio: four educational or value-driven posts, one soft promotion, one direct CTA. Applying this ratio across a four-week period on LinkedIn -- with five posts per week -- produces approximately 16 educational posts, four soft promotions, and four direct CTAs per month. The ratio creates discipline against the tendency to over-promote.

**Map content to the buyer journey.** Awareness-stage content (trend analysis, thought leadership, industry data) belongs early in the week when feed activity is highest -- Tuesday through Thursday mornings for LinkedIn B2B audiences. Decision-stage content (case studies, ROI comparisons, product demonstrations) belongs mid-week when engagement rates for intent-heavy content peak.

**Reserve 20% of the calendar for reactive slots.** Leaving two to three slots per week unassigned allows the team to respond to industry news, trending conversations, or campaign performance signals without disrupting the pre-planned content sequence.

[INTERNAL LINK: link to "social media analytics" page for data on optimal posting times by channel]

---

## Building Your Social Media Content Calendar Template

A functional social media content calendar template includes six fields at minimum: publish date, channel, content type, topic/angle, asset link or status, and owner. Optional fields that scale well for larger teams: campaign tag, buyer stage, and performance notes column for post-publish tracking.

Here is the field structure for a team-managed B2B calendar:

| Field           | Purpose                                      | Example Entry                          |
|-----------------|----------------------------------------------|----------------------------------------|
| Publish Date    | Exact date and time                          | Tuesday, March 12 -- 9:00 AM ET       |
| Channel         | Platform                                     | LinkedIn                               |
| Content Type    | Format category                              | Carousel / Thought Leadership          |
| Topic / Angle   | What the post covers and the specific hook   | "3 metrics CMOs ignore in pipeline reporting" |
| Asset Status    | Draft / In Review / Approved / Scheduled     | In Review                              |
| Owner           | Who is responsible for this post             | Sarah M.                               |
| Campaign Tag    | Which campaign this supports (if any)        | Q2 Pipeline Push                       |
| Buyer Stage     | Awareness / Consideration / Decision         | Awareness                              |

Build this in the tool your team already uses -- Notion, Airtable, Google Sheets, or a dedicated tool like CoSchedule or Buffer. The tool matters less than adoption. A calendar in a tool nobody opens is not a calendar.

**Avoid building a separate calendar per channel.** A unified calendar with a channel column outperforms channel-specific spreadsheets because it reveals content imbalances instantly. If LinkedIn has twelve posts planned and Twitter has two, you see the gap. In siloed calendars, you miss it.

---

## Social Media Scheduling: Turning the Calendar Into a Publishing System

A calendar without a scheduling process creates a bottleneck every week. Social media scheduling should be handled through a batch workflow: one day per week dedicated to creating assets for the following week, and a half-day for scheduling everything in the publishing tool.

The batch workflow for a B2B social team of two to four people:

1. Monday: Pull performance data from the prior week. Identify the highest-performing post type and topic. Carry that insight into this week's planning.
2. Monday afternoon: Finalize the content plan for the week using the calendar template. Confirm all asset types and owners.
3. Tuesday and Wednesday: Content creation and design sprint. Copy is written, graphics are built, links are verified.
4. Thursday: Internal review pass. All posts are approved by end of day.
5. Friday morning: All approved posts are scheduled in the social publishing tool for the following week.

This workflow eliminates the "what are we posting today?" conversation that consumes 20-40 minutes daily when no calendar system exists.

For social media scheduling tools, the choice depends on channel breadth and analytics needs. LinkedIn-heavy B2B teams find native LinkedIn scheduling plus a lightweight tool sufficient for most needs. Multi-channel operations with six or more active profiles benefit from a unified dashboard that centralizes approval workflows and performance tracking.

[INTERNAL LINK: link to "social media analytics" page for tool comparison]

---

## Frequently Asked Questions

**How far in advance should I plan a social media content calendar?**
Plan four weeks ahead as a minimum, eight weeks ahead during heavy campaign periods. Rolling four-week planning -- where you add week five every time week one ends -- maintains momentum without requiring quarterly planning marathons. Shorter planning windows (one to two weeks) create perpetual reactive publishing that degrades content quality.

**What is the right posting frequency for B2B social media?**
LinkedIn research suggests three to five posts per week maximizes organic reach for company pages without algorithmic suppression from over-posting. Twitter/X performs best at five to ten posts per week due to content decay speed. Instagram for B2B averages three to four posts per week. The right frequency is the maximum your team can sustain at high quality -- volume without quality consistently underperforms lower-frequency, high-quality publishing.

**How do I measure whether my content calendar is working?**
Track three metrics: publishing consistency rate (percentage of planned posts that published on schedule -- target 90% or above), engagement rate by content type (to identify which format and angle resonates), and channel-attributed pipeline (how many qualified leads entered the funnel after engaging with social content). Volume metrics like total posts or impressions are vanity metrics without the pipeline layer.

**Should each social channel have a different content calendar?**
Use a unified calendar with channel-specific columns rather than separate calendars per channel. A single calendar surface reveals content balance gaps across channels and prevents the duplication of effort that separate calendars create. Where channel-specific nuances apply -- format requirements, audience differences, optimal posting times -- handle them as calendar fields, not separate documents.

**How do I handle evergreen content versus campaign content in the same calendar?**
Tag each piece with its content category (evergreen, campaign, reactive, product update). Evergreen content fills the structural base of the calendar -- educational posts that perform independently of campaign timing. Campaign content overlays the evergreen base during specific campaign windows. Keeping these distinct prevents evergreen content from being deprioritized every time a campaign launches.

---

## Build the Calendar Before You Need It

The most common calendar failure is building it in crisis mode -- when the team is already behind on posting, when a campaign just launched without supporting content, or when leadership asks for a monthly report and there is no data to show. Built reactively, a content calendar becomes a catch-up tool. Built proactively, it becomes a competitive advantage.

Start with a four-week rolling calendar in whatever tool your team will actually open. Use the 4-1-1 ratio to balance educational and promotional content. Reserve reactive slots. Review performance monthly and let the data revise the plan.

The content calendar for social media is not the creative work -- it is the system that makes creative work sustainable, measurable, and repeatable at scale.

**Next step:** Download the content calendar template [link to template download or internal resource] and map your next four weeks before your next team meeting.

---

**Internal Linking Plan:**

| Link Text                              | Target Page Topic                          | Placement Section                     |
|----------------------------------------|--------------------------------------------|---------------------------------------|
| "content marketing strategy guide"    | Content marketing strategy pillar page     | What a Social Media Content Calendar Actually Does |
| "social media analytics"              | Social media analytics tools/guide page    | How to Plan Social Media Content      |
| "social media analytics"              | Social media analytics tools/guide page    | Social Media Scheduling section       |
| "content calendar template"           | Downloadable template or tool landing page | Conclusion CTA                        |
| "social media scheduling tools"       | Tool comparison or product feature page    | Scheduling section                    |

**Image Suggestions:**

| Placement (after section)                    | Image Description                                              | Alt Text                                                              |
|----------------------------------------------|----------------------------------------------------------------|-----------------------------------------------------------------------|
| After intro paragraphs                       | Screenshot of a completed content calendar in Notion or Airtable showing multi-channel view | "social media content calendar template in Notion with channel columns" |
| After the content mix ratio paragraph        | Infographic showing the 4-1-1 content ratio visually across a four-week grid | "4-1-1 social media content ratio applied to four-week calendar"    |
| After the calendar template table            | Annotated screenshot of the six-field calendar structure       | "content calendar for social media fields explained with example entries" |
| After the batch workflow numbered list       | Simple timeline graphic showing the Monday-Friday batch workflow | "social media content creation and scheduling weekly workflow"       |

**Schema Markup Recommendations:**
- Article schema: Yes
- FAQ schema: Yes (apply to all five FAQ entries)
- HowTo schema: Yes (apply to the numbered batch workflow in the Scheduling section)
- Breadcrumb schema: Yes (assuming site architecture: Home > Blog > Content Marketing > [This Post])
