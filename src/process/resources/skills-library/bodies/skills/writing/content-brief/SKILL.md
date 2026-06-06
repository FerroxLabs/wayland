---
name: content-brief
description: |
  Creates writer-ready content briefs with audience definition, content angle,
  detailed outline, keyword targets, source suggestions, and tone guidance. Use
  when the user needs to brief a writer, plan a content piece before drafting,
  or create an assignment document for content creation. Do NOT use for editorial
  calendars (use `editorial-calendar`), content audits (use `content-audit`), or
  writing the actual content piece (use `blog-post-writing`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "content-marketing writing template"
  category: "writing"
  subcategory: "content-marketing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Content Brief

## When to Use

Use this skill when any of the following conditions apply:

- A user needs to commission a content piece from a writer, freelancer, or agency and wants a structured assignment document that eliminates back-and-forth revision cycles
- A user is planning a content piece themselves and wants to think through structure, angle, and audience before starting the draft -- treating the brief as a thinking tool, not just a handoff document
- A user has a specific keyword or search intent they want to target and needs a document that translates SEO goals into concrete writing instructions
- A user is managing a content team and wants consistent output quality across multiple writers by standardizing the assignment format
- A user needs to align stakeholders (marketing, product, leadership) on what a piece will say before writing begins, using the brief as a pre-approval checkpoint
- A user is building a content program at scale and needs a repeatable format they can apply across 10, 50, or 200 pieces without starting from scratch each time
- A user has received poor-quality first drafts from writers and wants to understand why -- often because the original assignment lacked specificity at the outline level

**Do NOT use this skill when:**

- The user wants a calendar showing what to publish and when -- use `editorial-calendar` instead, which handles scheduling, capacity planning, and content mix across time periods
- The user wants to audit existing content for gaps, quality issues, or optimization opportunities -- use `content-audit` instead
- The user is ready to write the actual piece and just needs help drafting -- use `blog-post-writing` instead; a brief is an input to writing, not a substitute for it
- The user wants a persona document that profiles their audience in depth -- use `audience-analysis` instead; this skill captures only the audience detail needed to direct a writer
- The user wants to develop a brand voice guide that applies across all content -- this skill applies voice guidance to a single piece, not the brand as a whole
- The user is writing ad copy, email sequences, or social posts -- those formats have distinct structural requirements not covered by this skill

---

## Process

### Step 1: Gather the Brief's Foundational Requirements

Before writing a single line of the brief, collect the inputs that determine every downstream decision. Do not begin outlining without these. If the user cannot answer a question, surface the assumption you are making and flag it in the Writer Notes section.

- **Topic and content type:** Get the specific subject and format -- blog post, pillar page, comparison page, case study, how-to guide, listicle, thought leadership op-ed, newsletter, or product-led content. Each has a different structural logic. A comparison page is built around decision criteria; a how-to guide is built around sequential steps; a case study is built around before/after transformation.
- **Business goal:** Nail down the single primary goal. Options include: organic search traffic, email list growth, sales enablement (something sales reps send to prospects), direct conversion, backlink acquisition, brand authority in a category, or internal education. The goal determines what the CTA is, what success looks like, and how aggressive the writing can be.
- **Primary keyword or search intent:** Even for non-SEO content, define the core question the piece answers. For SEO content, get the exact keyword phrase, not a topic area. "Remote onboarding" is a topic. "Remote onboarding best practices for small business" is a keyword with defined intent.
- **Audience definition:** Get the job title, company size, industry, experience level with the topic, and what they are trying to accomplish. If the user says "our customers," push for specifics -- which customer segment, at what stage, with what problem?
- **Word count range and format constraints:** These are not arbitrary. They flow from content type, keyword competition level, and audience attention tolerance. A listicle for a busy operations manager tops out at 1,200 words. A pillar page targeting a highly competitive keyword needs 2,500-4,000 words to compete. Capture both the target and the constraints.
- **Timeline and reviewer chain:** Who approves this before publish? One stakeholder approval loop versus three changes the brief requirements entirely.

---

### Step 2: Define the Angle with Rigor -- Not Just a Topic Statement

The angle is the single most important element in a content brief and the most frequently skipped. A topic is what the content is about. An angle is the specific claim, perspective, or framing that makes this particular piece worth reading when ten other pieces on the same topic already exist.

- Run a fast competitive content scan: what are the top 3-5 results for the target keyword, and what approach do they share? The angle must diverge from that dominant approach in a meaningful way -- not cosmetically ("our guide is more comprehensive") but structurally (a different framework, an underrepresented audience, a counterintuitive claim, a more specific use case).
- Apply one of five proven angle types based on the content goal:
  - **Reframe:** Challenge the dominant assumption ("Most onboarding checklists measure activities, not outcomes -- here's why that's backward")
  - **Specificity arbitrage:** Target a narrower audience than competing content serves ("Remote onboarding for companies with distributed teams across more than 3 time zones")
  - **Mechanism reveal:** Name and explain the underlying process that others describe only at the surface level ("The three-phase competency ladder that separates effective remote onboarding from expensive orientation theater")
  - **Data-led:** Lead with a surprising or counterintuitive data point that competing content does not cite
  - **Before/after:** Contrast the broken state with the desired state in concrete terms, then position the content as the bridge
- Write the angle as a single sentence of 20-35 words that a writer could use as their editorial north star throughout the draft. If the angle sentence is vague enough to apply to three different topics, it is not specific enough.
- Define the key takeaway -- the one sentence the reader should be able to repeat to a colleague after finishing. This is different from the angle: the angle is what makes the content interesting; the takeaway is what the reader internalizes.

---

### Step 3: Build a Detailed, Section-Level Outline

The outline is where most content briefs fail. Vague outlines ("Introduction," "Key Points," "Conclusion") produce vague first drafts. A brief's outline must be specific enough that two different writers would produce structurally similar pieces from it -- not identical, but substantively aligned.

- **Start from the reader's journey, not from a logical content hierarchy.** Map the sequence of questions a reader has as they move through the piece. What do they need to believe at the end of Section 1 before Section 2 will make sense to them? This reader-journey structure produces more coherent content than top-down outlining.
- **Write a one-to-two sentence scope statement for every H2 section.** This statement must specify: (1) what the section covers, (2) what the reader will be able to do or understand after reading it, and (3) what kind of evidence or example should appear in it.
- **Assign section-level word counts.** The rule: all section word counts must sum to within 10% of the total target word count. If the total is 1,800 words, the section totals should sum to between 1,620 and 1,980. Distribute based on section complexity, not equal splits.
- **Standard section architecture by content type:**
  - How-to guide: Problem statement (10%) → Why existing solutions fail (10%) → Framework introduction (15%) → Step-by-step implementation (50%) → Common failure modes (10%) → CTA (5%)
  - Listicle: Hook (5%) → Context/why this list matters (10%) → List items with equal depth per item (75%) → Synthesis/next step (10%)
  - Comparison/versus page: Reader context and stakes (10%) → Evaluation criteria table (15%) → Side-by-side treatment of each option (50%) → Decision matrix (15%) → Recommendation (10%)
  - Pillar/ultimate guide: Topic definition and scope (5%) → Multiple H2 chapters with H3 subsections (80%) → Summary and resource links (15%)
- **Flag evidence requirements at the section level.** Specify whether a section needs a statistic, a customer quote, a screenshot, a worked example, a definition, or an expert citation. Do not leave this for the writer to infer.
- **Designate the primary CTA placement.** Most content needs two: a soft CTA mid-piece (newsletter, download) and a hard CTA at the close (demo, trial, purchase, consultation). Specify both and what the surrounding context should be.

---

### Step 4: Define Audience and Tone with Enough Precision to Constrain Decisions

Audience and tone definitions in content briefs are chronically underspecified. "Our audience is marketers" is not actionable. The audience definition must be specific enough that the writer can make micro-decisions -- whether to define a term, whether to include a beginner-level analogy, whether to hedge a claim or make it boldly -- without asking.

- **Define the reader's prior knowledge level for this specific topic.** Not their general expertise level. An experienced HR director may be a complete beginner when it comes to asynchronous onboarding tools. Specify what they already know and what they are coming to learn.
- **Define the reader's emotional state when they arrive.** Are they frustrated (something broke), curious (exploring options), urgent (a deadline is forcing action), or skeptical (they have tried this before and it did not work)? The emotional register of the piece should match the reader's state.
- **Specify register on a five-point scale:** Clinical/technical → Formal professional → Conversational professional → Informal → Casual/colloquial. Most B2B content lives between formal professional and conversational professional. Most consumer content lives between conversational professional and informal. Name the level explicitly.
- **Provide vocabulary standards with examples.** Terms to use and terms to avoid. If your brand says "practitioners" not "users," or "revenue operations" not "sales ops," document it. If a term is jargon that your audience uses among themselves (and therefore belongs), confirm it is in-scope.
- **Specify person and perspective:** Second person ("you will learn") for instructional content, first person plural ("we recommend") for brand authority content, third person for case studies and research-style pieces.
- **Set a Flesch-Kincaid reading level target.** For general professional audiences: Grade 10-12. For technical specialists: Grade 12-14. For consumer audiences: Grade 7-9. For executive audiences: Grade 11-13 with shorter sentences than typical technical writing.

---

### Step 5: Add Keyword and SEO Specifications Where Applicable

Not all content is SEO-driven, but when it is, the brief must translate keyword data into actionable writing instructions -- not just a list of terms.

- **Primary keyword:** Specify the exact phrase (match type: exact or close variant) and required placement locations: H1 title (preferred position: first 3 words when possible), first H2, within the first 100 words of body copy, and naturally throughout at a keyword density of 0.5-1.5% of total word count. Avoid telling writers to "sprinkle the keyword naturally" -- that is not instruction, it is hope.
- **Secondary keywords and semantic coverage:** Provide 3-5 secondary keywords drawn from the same keyword cluster. These are not synonyms of the primary keyword -- they are related subtopics that search engines expect to see covered in depth-optimized content. A brief for "remote onboarding best practices" should include secondary terms like "new hire 30 60 90 day plan," "virtual onboarding checklist," and "onboarding software for remote teams."
- **Search intent classification:** Classify the primary intent as informational (reader wants to learn), commercial investigation (reader is evaluating options), transactional (reader is ready to act), or navigational (reader is looking for a specific resource). Each intent type demands a different content architecture and CTA approach.
- **Internal linking targets:** Specify 2-4 existing pages on the site that this piece should link to, with the anchor text guidance. Do not leave anchor text to the writer's discretion -- inconsistent anchor text undermines internal link equity.
- **Meta description guidance:** Provide either a draft meta description (150-160 characters) or specify three required elements: the primary keyword, a value proposition, and a soft CTA. Meta descriptions do not affect rankings but directly affect click-through rate.
- **Featured snippet targeting:** If the keyword triggers a featured snippet in search results (definitions, numbered lists, tables), indicate the section and format that should be optimized for it. Ordered list snippets require 8 or fewer items. Definition snippets require a direct one-to-two sentence answer immediately after an H2 that mirrors the keyword as a question.

---

### Step 6: Curate Reference Materials That Actually Help the Writer

Reference sections are often populated with links and left unexplained. A writer who opens three competitor URLs without guidance will imitate the best one -- which may not align with the brief's angle. Curate and annotate references.

- **Competitive content references:** Provide 2-3 specific articles that rank for the target keyword. For each one, note: what it does well that the writer should match or exceed, what gap it leaves that this piece should fill, and what approach to avoid because it is already saturated.
- **Data and statistics sources:** Specify the exact data point to use (not just the source), including the year of the study, the sample size if known, and whether the data supports or contradicts the piece's angle. A statistic that seems relevant but undermines the argument should be flagged, not silently included.
- **Subject matter expert contacts:** If internal SME access is available, name the person, their specific area of expertise relevant to this piece, and whether the writer should quote them, paraphrase their input, or use them only for fact-checking.
- **Brand and style constraints:** Reference the specific style guide sections that apply. If the organization uses AP Style for punctuation but has custom rules for product names, call out both. Do not assume the writer knows.
- **Content to avoid duplicating:** List any existing published pieces on similar topics by URL or title so the writer does not re-cover ground, and specify whether this piece should link to, supersede, or differentiate from those existing pieces.

---

### Step 7: Set Measurable Success Criteria

A content brief without success metrics is a creative brief, not a business document. The metrics section closes the loop between the content piece and the business goal defined in Step 1.

- **Define one primary metric** that directly connects to the business goal. If the goal is organic traffic: target monthly organic sessions within 90 days of publish. If the goal is conversion: target conversion rate on the piece's primary CTA. If the goal is sales enablement: target usage rate by the sales team within 60 days.
- **Set specific numeric targets** using available benchmarks. For organic search: 500-2,000 sessions/month for a mid-competition keyword is realistic within 3-6 months for a domain with established authority. For email content: 15-25% click-through on the embedded CTA is a reasonable benchmark for engaged lists. Do not invent targets -- use the site's existing content performance as the baseline.
- **Specify the measurement timeframe.** Organic content needs 90-180 days to reach performance maturity. Promotional content (tied to a launch or campaign) should be measured at 14 and 30 days. Evergreen content should be reviewed quarterly.
- **Define the review trigger:** What performance level at what timeframe signals that the piece needs to be updated, promoted more aggressively, or retired?

---

## Output Format

```
## Content Brief: [Working Title]

**Date created:** [YYYY-MM-DD]
**Assigned to:** [Writer name or TBD]
**Reviewed by:** [Editor or stakeholder who approves before publish]
**Due date:** [First draft deadline]
**Content type:** [Blog post / Pillar page / Case study / Comparison page / How-to guide / Newsletter / etc.]
**Target word count:** [Low end]-[High end] words
**Business goal:** [Single primary goal: traffic / conversion / sales enablement / authority]

---

### Objective

[2-3 sentences. State what this piece accomplishes, what gap it fills in the
existing content landscape (not the brand's content catalog -- the open web),
and why it matters to the reader AND the business. Both must be present.]

---

### Target Audience

| Attribute            | Detail                                                      |
|----------------------|-------------------------------------------------------------|
| Role / Job title     | [Specific role, not "marketers" or "business owners"]       |
| Company context      | [Company size, industry, stage if relevant]                 |
| Experience with topic| [Beginner / Intermediate / Advanced -- for THIS topic]      |
| Emotional state      | [Frustrated / Curious / Urgent / Skeptical / Evaluating]   |
| What they already know | [What NOT to re-explain]                                  |
| What they need to learn | [The specific gap this piece fills for them]             |
| Key question         | [The exact question they are typing or asking]              |

---

### Angle and Differentiation

**Content angle:** [One sentence, 20-35 words, that defines the specific
framing or claim that distinguishes this piece from the dominant approach
in existing content. Include the angle type: reframe / specificity arbitrage /
mechanism reveal / data-led / before-after.]

**Key takeaway:** [The one sentence the reader should be able to repeat to a
colleague after finishing. This is what the piece argues, proves, or shows.]

**Competing content analysis:**

| Competitor Article              | What it does well       | What it misses / leaves open |
|---------------------------------|-------------------------|------------------------------|
| [Title or description, Rank #1] | [Specific strength]     | [Specific gap]               |
| [Title or description, Rank #2] | [Specific strength]     | [Specific gap]               |
| [Title or description, Rank #3] | [Specific strength]     | [Specific gap]               |

---

### Voice and Tone

| Element           | Guideline                                                              |
|-------------------|------------------------------------------------------------------------|
| Register          | [1-5 scale: Clinical → Formal professional → Conversational professional → Informal → Casual] |
| Person            | [First person / Second person / Third person -- with examples]         |
| Sentence length   | [Avg. target: e.g., "15-20 words average, max 35 words per sentence"] |
| Vocabulary        | Use: [terms]. Avoid: [terms]. Define on first use: [terms]            |
| Reading level     | [Flesch-Kincaid Grade [X]-[Y]]                                        |
| Tone prohibitions | [Things the writer must NOT do: hedge every claim / use passive voice / start with statistics] |

---

### Detailed Outline

**H1 (Title option 1):** [Full proposed title -- primary keyword in first 3 words preferred]
**H1 (Title option 2):** [Alternative if editor wants a choice]

---

**H2: [Section 1 Title]** (~[word count] words | [~X%] of total)

*Section purpose:* [What the reader should understand or be able to do after this section]
*What to cover:*
- [Specific point 1 -- not a topic, a specific claim or instruction]
- [Specific point 2]
- [Specific point 3]
*Evidence required:* [Statistic / Example / Customer quote / Screenshot / Definition]
*Do NOT include:* [What to avoid in this section]

---

**H2: [Section 2 Title]** (~[word count] words | [~X%] of total)

*Section purpose:* [What the reader should understand or be able to do after this section]
*What to cover:*
- [Specific point 1]
- [Specific point 2]
- [Specific point 3]

  **H3: [Subsection title]**
  - [Specific sub-point]
  - [Specific sub-point]

*Evidence required:* [Type of evidence]
*Do NOT include:* [What to avoid]

---

**H2: [Section 3 Title]** (~[word count] words | [~X%] of total)

[Continue same structure]

---

**H2: [Closing Section -- e.g., Common Mistakes / What to Do Next]** (~[word count] words | [~X%] of total)

[Continue same structure]

---

*Word count verification:* [Sum of all section counts] / [Total target] = [X%] ✓

**CTA placement:**
- Mid-piece (after H2 [X]): [Soft CTA -- what it is, exact text or guideline]
- End of piece: [Hard CTA -- what it is, exact text or guideline]

---

### SEO Requirements

| Element              | Target / Instruction                                                    |
|----------------------|-------------------------------------------------------------------------|
| Primary keyword      | [Exact phrase]                                                          |
| Keyword placement    | H1 (first 3 words), first H2, within first 100 words, 0.5-1.5% density|
| Secondary keywords   | [Keyword 1] / [Keyword 2] / [Keyword 3] / [Keyword 4]                 |
| Search intent        | [Informational / Commercial / Transactional / Navigational]            |
| Featured snippet target | [Yes/No -- if yes: which H2, what format: list/table/definition]   |
| Meta description     | [150-160 char draft OR: must include keyword + value prop + soft CTA] |
| Title tag (if different from H1) | [60 characters max]                                      |
| Internal links       | [Page 1 title → anchor text]; [Page 2 title → anchor text]            |
| External links       | [X authoritative external citations recommended]                       |

---

### Reference Materials

**Competitive content (analyze, do not copy):**
- [Article 1 title/description]: Match [specific element]. Exceed by [specific approach]. Do not replicate [specific thing].
- [Article 2 title/description]: Match [specific element]. Exceed by [specific approach].

**Data and statistics to cite:**
- [Specific data point]: From [source name], [year]. Use in [section name].
- [Specific data point]: From [source name], [year]. Use in [section name].

**Internal knowledge sources:**
- [SME name, role]: Can speak to [specific topic]. [Quote / paraphrase / fact-check only].
- [Existing brand asset]: Located at [description]. Use for [purpose].

**Content to NOT duplicate:**
- [Existing piece title]: Covers [topic]. This piece should [link to it / differentiate by / supersede].

---

### Success Metrics

| Metric              | Target                     | Measurement Timeframe      | Review Trigger                            |
|---------------------|----------------------------|----------------------------|-------------------------------------------|
| [Primary metric]    | [Specific number]          | [X days / months post-pub] | [If below X at Y days, escalate by doing Z]|
| [Secondary metric]  | [Specific number]          | [X days / months post-pub] | [Threshold]                               |

---

### Writer Notes

**Mandatory elements:** [Things that must appear in the final draft -- a specific framework, a specific data table, a CTA form]

**Hard constraints:** [What the writer must NOT do -- mention competitors by name, make performance claims without citing data, use the phrase "in today's world"]

**First draft review focus:** [What the editor will prioritize in the first review -- structure fidelity, angle execution, evidence quality]

**Stakeholder sensitivities:** [Legal review required / Product positioning rules / Topics that require pre-approval]
```

---

## Rules

1. **Never accept a topic as an angle.** "Write about remote onboarding" is a topic. "Remote onboarding fails because companies measure activities, not competency milestones" is an angle. If the user provides only a topic, develop the angle using the five angle-type framework (reframe, specificity arbitrage, mechanism reveal, data-led, before/after) before writing the brief.

2. **Never write an outline section as a heading plus a vague description.** Every H2 section must have a purpose statement ("After reading this section, the reader will be able to..."), a minimum of three specific points to cover (not topics -- claims or instructions), and an evidence type requirement. A section labeled "Benefits of Remote Onboarding" with no further specification is not a brief -- it is a note.

3. **Never allow section word counts to miss the total target by more than 10%.** Verify the arithmetic explicitly in the brief. Unbalanced outlines produce structurally distorted drafts -- 800-word introductions and 100-word conclusions that the editor must then restructure at review.

4. **Never include more than 5 secondary keywords.** Beyond 5, writers begin optimizing for keywords rather than reader value, which degrades content quality and triggers search engine quality signals. If the user provides a larger keyword list, select the 3-5 most semantically relevant to the piece's specific angle.

5. **Never define the audience above the level of a job title.** "Marketers" is not an audience definition. "B2B demand generation managers at SaaS companies with 50-200 employees who are moving from outbound-led to inbound-led growth" is. The test: could two different people with different roles both read this audience definition and think it describes them? If yes, it is too broad.

6. **Always include the reader's emotional state in the audience section.** A reader who arrives frustrated needs validation before instruction. A reader who arrives skeptical needs evidence before recommendation. A reader who arrives urgent needs the answer in the first 200 words. Emotional state shapes structure, not just tone.

7. **Always flag when the business goal and the content type are misaligned.** A case study does not generate organic search traffic. A listicle does not move prospects through a complex buying decision. A how-to guide does not build brand authority for an executive audience. If the user's stated goal and chosen content type are in tension, name the tension and recommend a resolution before completing the brief.

8. **Always specify CTA placement and text guidance.** A brief that says "include a CTA" without specifying where, what offer, and what context surrounds it will produce writer-inserted CTAs that are either too aggressive, too weak, or placed where they interrupt the reader's learning momentum.

9. **Always include at least one "do not include" instruction per major section.** The absence of exclusionary guidance is the primary reason first drafts include the wrong material. Writers fill sections with what they know, not what the brief implies they should leave out. Explicit exclusions reduce revision cycles significantly.

10. **Always make the competitive content analysis actionable, not just descriptive.** Saying "Competitor X is good" is not useful. The competitive analysis must answer three questions per reference piece: what to match (quality bar), what to exceed (the gap to close), and what to avoid (the approach that is saturated). If the user has not done competitive research, ask for the top keyword and perform a conceptual competitive analysis based on what typically dominates that category.

11. **Always verify that the primary metric connects directly to the business goal stated in the Objective.** A piece with a business goal of "sales enablement" should not have organic traffic as its primary metric. A piece with a goal of "thought leadership" should not measure conversions. Metric-goal misalignment is the most common cause of content being deemed unsuccessful despite strong performance on the wrong measure.

12. **Keep the brief's total length under 1,000 words of prose.** Tables, outline structures, and reference lists can extend beyond this, but the narrative explanation should be compressed. A brief longer than the content it describes has the wrong center of gravity -- the brief exists to serve the writing, not to replace it.

---

## Edge Cases

### The user does not know their audience

When a user says "our customers" or "people interested in [topic]" without further specification, do not proceed with a vague persona. Instead, ask three diagnostic questions: (1) "Who specifically has the problem this content solves -- what is their job title and company situation?" (2) "What have they already tried before finding this content, and why did it not work?" (3) "What would they do differently the day after reading this?" The answers to these three questions contain all the information needed to construct an actionable audience definition. If the user genuinely cannot answer, default to building the audience section around the keyword's search intent -- the type of person who searches that phrase is the audience, and search intent data is a reliable proxy.

### The content is part of a content cluster or pillar strategy

When the brief is for a piece that belongs to a cluster (a supporting article linked to and from a pillar page), the brief must include a cluster context section that is absent in standalone briefs. Add the following elements: (1) the pillar page title and URL that this piece supports, with a mandatory internal link instruction; (2) the other supporting pieces in the cluster, noting where this piece sits in the reader's journey (earlier, middle, or later-stage content); (3) instructions not to re-explain concepts covered in the pillar; and (4) a reminder that the cluster strategy depends on focused topical depth -- this piece should cover its subtopic exhaustively rather than touching adjacent subtopics that other cluster pieces own.

### The user wants a brief for a highly regulated topic (legal, financial, medical, compliance)

Regulated content requires an additional brief section: Legal and Compliance Review Requirements. Specify: (1) the claim types that require legal review before publish (performance claims, comparative claims, specific numerical guarantees); (2) the required disclaimers and where they must appear; (3) the terms that cannot be used without qualification (e.g., "guaranteed," "proven," "safe," "best"); (4) who the content must be reviewed by before it goes live; and (5) the approval timeline, which is typically 5-10 business days and must be factored into the deadline. Do not treat legal review as a Writer Note -- it deserves its own section with the same prominence as SEO requirements.

### Multiple writers are assigned to the same piece

When a piece is divided across multiple contributors -- for example, a 4,000-word pillar with four H2 sections written by four different practitioners -- the brief must include a writer assignment table and a coordination section. The table maps each H2 section to a named writer with their word count allocation, draft deadline, and whether they are responsible for draft only or draft plus review of adjacent sections. The coordination section specifies: who holds the editorial authority to reconcile voice differences across sections, what the handoff format is (shared doc, email, content management system), and whether writers should see each other's sections before or after drafting. Without this structure, multi-writer pieces are the most common source of tone fragmentation and structural redundancy.

### The user has no SEO goals and no distribution strategy defined

When SEO is not a goal -- for example, a thought leadership piece for an executive audience, a sales enablement document, or a newsletter -- remove the SEO Requirements section entirely and replace it with a Distribution and Context section. This section specifies: where the piece will be published (company blog, LinkedIn, partner publication, sales deck), how it will be distributed (email list, paid promotion, sales reps forwarding, PR placement), what surrounding content or context the reader will encounter before reaching this piece, and whether it needs to stand alone or assumes prior relationship with the brand. These distribution factors change structural decisions -- a piece distributed by sales reps needs a shareable summary or executive abstract at the top; a piece published in a partner publication needs more brand context than a piece on the company's own blog.

### The user wants a brief for content that will be substantially AI-assisted

When a user intends to use AI tools to generate the first draft from the brief, the brief itself needs greater constraint density than a brief written for a human writer. Add two additional brief elements: (1) an explicit constraint list of claims the AI should not make without human verification (typically any statistics, product comparisons, legal or medical statements, or claims about competitors); and (2) a list of the specific sections that require human input before the draft is usable (sections requiring original examples, customer quotes, or proprietary data cannot be AI-generated). The outline section-level word counts also become more important, as AI tools tend to produce evenly balanced sections regardless of the actual importance distribution. Specify not just word counts but relative emphasis: "This section is the core argument of the piece and should feel twice as developed as Section 2, even if the word counts are similar."

### The user receives poor first drafts despite having a brief

When a user reports that their briefs produce consistently poor first drafts, the problem is almost always one of three things: (1) the outline is too vague at the H3 level, meaning the writer is making too many structural decisions that should have been pre-decided; (2) the audience definition does not include the reader's prior knowledge, so the writer misjudges what to explain versus what to assume; or (3) the angle is stated as a topic area rather than a specific claim, so the writer defaults to the most common approach they have seen before. Diagnose which of the three is the failure mode by asking to see the brief and the failing draft side by side, then identify the first section where the draft diverges from the brief's intent. The first divergence point usually reveals the root cause.

---

## Example

**Input from user:**

"I need a content brief for a blog post targeting 'B2B email marketing best practices.' Our audience is marketing managers at SaaS companies, around 50-300 employees. The goal is organic traffic and to generate demo requests for our email automation platform. Target 1,800 words."

---

**Output:**

## Content Brief: B2B Email Marketing Best Practices

**Date created:** 2025-01-15
**Assigned to:** TBD
**Reviewed by:** Content Lead + Product Marketing (for CTA alignment)
**Due date:** First draft within 10 business days
**Content type:** How-to guide (SEO-optimized blog post)
**Target word count:** 1,700-1,900 words
**Business goal:** Organic search traffic → Demo request conversion

---

### Objective

Create a practical how-to guide for B2B email marketing that differentiates on specificity: most ranking content for this keyword targets email marketers broadly, mixing B2C tactics with B2B advice in a way that produces generic, low-trust guidance. This piece serves SaaS marketing managers specifically, addressing the distinct challenges of low send volumes, long sales cycles, and the need to move buying committees -- not individual consumers -- through a decision. The business goal is ranking for a high-intent keyword and converting organic visitors into demo requests for our email automation platform.

---

### Target Audience

| Attribute              | Detail                                                                                                         |
|------------------------|----------------------------------------------------------------------------------------------------------------|
| Role / Job title       | Marketing Manager or Demand Generation Manager                                                                 |
| Company context        | B2B SaaS company, 50-300 employees, funded or bootstrapped but resource-constrained                           |
| Experience with topic  | Intermediate -- has sent email campaigns before, may use a basic ESP, is not getting the results they expected |
| Emotional state        | Mildly frustrated -- knows email should work better but is not sure where the breakdown is                    |
| What they already know | Open rates, subject line optimization, list segmentation basics, CAN-SPAM compliance                          |
| What they need to learn | Why B2B email behaves differently from B2C and what to change in their current program                        |
| Key question           | "What specifically should I do differently to make our B2B email program perform better?"                      |

---

### Angle and Differentiation

**Content angle (mechanism reveal):** B2B email marketing underperforms not because marketers send the wrong content, but because they apply B2C metrics (open rate, click rate) to a B2B buying context where the meaningful signal is buying committee engagement across a 30-90 day sales cycle -- a fundamentally different game.

**Key takeaway:** Stop optimizing B2B email for clicks. Optimize it for buying committee progression -- the right people moving forward in the sales process together.

**Competing content analysis:**

| Competitor Article                              | What it does well                                               | What it misses / leaves open                                                             |
|-------------------------------------------------|-----------------------------------------------------------------|------------------------------------------------------------------------------------------|
| Generic "B2B email best practices" listicle     | Covers fundamentals well: segmentation, subject lines, timing  | Treats B2B and B2C email identically; no buying cycle integration                        |
| ESP vendor blog post (general market)           | Strong on technical deliverability (SPF, DKIM, DMARC)          | Zero guidance on content strategy for multi-stakeholder buying decisions                 |
| "Email marketing tips" roundup                  | Good diversity of tactical advice                               | 28 disconnected tips with no framework; SaaS marketer cannot prioritize what to do first |

---

### Voice and Tone

| Element           | Guideline                                                                                                       |
|-------------------|-----------------------------------------------------------------------------------------------------------------|
| Register          | Conversational professional (3/5) -- peer-to-peer, the tone of a senior colleague, not a vendor selling a tool |
| Person            | Second person ("your email program," "your buyers") throughout                                                  |
| Sentence length   | 15-20 word average; max 30 words; short sentences for key claims ("That metric does not predict revenue.")      |
| Vocabulary        | Use: "buying committee," "revenue impact," "multi-threaded outreach." Avoid: "blast," "nurture drip," "leverage" |
| Reading level     | Flesch-Kincaid Grade 11-12 (professional audience, no padding or over-explanation)                             |
| Tone prohibitions | Do NOT hedge every recommendation with "it depends." Do NOT open with a statistic. Do NOT use rhetorical questions as section headers. |

---

### Detailed Outline

**H1 (Title option 1):** B2B Email Marketing Best Practices: A Framework for SaaS Teams
**H1 (Title option 2):** Why Your B2B Email Isn't Working (and the Framework to Fix It)

---

**H2: Why B2B Email Is a Different Game Than B2C** (~280 words | ~16% of total)

*Section purpose:* Establish the core reframe -- B2C email metrics mislead B2B marketers -- so that the reader accepts the new framework before encountering it.
*What to cover:*
- B2C email optimizes for individual consumer action within 24-72 hours; B2B email moves a buying committee over 30-120 days -- two completely different optimization targets
- The three B2B-specific signals that matter more than open rate: reply rate, forwarding rate (multi-threading indicator), and meeting-to-close rate from email-sourced opportunities
- Why applying a 20% open rate benchmark from B2C to B2B leads to false confidence: a B2B email read by 4 people in a buying committee may show as one open

*Evidence required:* One industry statistic on average B2B sales cycle length (cite Gartner or Forrester; do not invent -- if unavailable, use "research from major analyst firms"). One concrete example comparing a B2C and B2B email campaign result using the same metric.
*Do NOT include:* Deliverability mechanics (SPF, DKIM) -- that belongs in a technical deliverability guide, not a best practices post for marketing managers.

---

**H2: The Four Pillars of High-Performing B2B Email Programs** (~150 words | ~8% of total)

*Section purpose:* Introduce the framework structure that organizes the rest of the piece, so the reader has a mental map before the detailed sections begin.
*What to cover:*
- Name the four pillars: Segmentation by buying stage, Content aligned to committee role, Cadence built around sales cycle length, and Measurement tied to pipeline contribution
- One sentence per pillar explaining what it does and why it matters
- Brief framing note: most email programs are strong on one pillar and weak on the other three

*Evidence required:* No external citation needed here -- this is the piece's proprietary framework. Present it as such.
*Do NOT include:* Detail on any individual pillar -- that is what H2 Sections 3-6 exist for. Keep this orientation tight.

---

**H2: Pillar 1 -- Segmentation by Buying Stage, Not by Job Title** (~280 words | ~16% of total)

*Section purpose:* Replace the default "segment by persona" instinct with a buying-stage segmentation model that produces more relevant email content.
*What to cover:*
- Three buying stages for B2B SaaS: Problem Aware (knows they have an issue, not actively shopping), Solution Aware (evaluating options), and Decision Stage (shortlisting vendors) -- and what each stage's email content goal is
- Why job-title segmentation alone fails: a CFO and a VP of Engineering at the same buying-stage are better served by the same stage-appropriate content than by role-specific content with the wrong timing
- Practical instruction: how to assign buying stage to contacts using behavioral signals (page visits, content downloads, sales touchpoints) rather than manual qualification

*Evidence required:* A brief example: "A contact who downloaded your pricing page three times in two weeks is decision-stage, regardless of their job title. Sending them an educational overview email at that moment loses the deal."
*Do NOT include:* Specific CRM or MAP tool recommendations -- keep tool-agnostic.

  **H3: The Stage-Content Matrix**
  - Present a simple 3x3 table: Buying Stage (rows) × Content Goal / Email Type / Success Signal (columns)
  - This gives the writer a structural element that will also function as a featured snippet candidate

---

**H2: Pillar 2 -- Content That Addresses the Buying Committee, Not Just the Champion** (~280 words | ~16% of total)

*Section purpose:* Teach the marketer to think about email content as material that their champion will forward, not just read themselves.
*What to cover:*
- The B2B email reality: your contact forwards your email to 2-4 colleagues before a purchase decision; your email must survive being read without context by someone who has never heard of your company
- Three content elements that make emails forwardable: a concrete business case (not a product feature), a clear "why now" trigger, and a referenceable resource (a one-pager, a ROI calculator, a case study) the champion can share
- How to write the subject line for the champion, not the committee: the champion's goal is internal credibility, not just information

*Evidence required:* Research from Gartner or similar on the number of stakeholders involved in B2B SaaS purchase decisions (the 6-10 stakeholders finding is well-established; verify the current figure). One specific example of a "forwardable" vs. "non-forwardable" email comparison.
*Do NOT include:* Advice on email design or HTML rendering -- that is a deliverability and design topic, not a content strategy topic.

---

**H2: Pillar 3 -- Cadence Built Around Sales Cycle Length, Not Batch-and-Blast Schedules** (~250 words | ~14% of total)

*Section purpose:* Replace arbitrary send frequency (weekly newsletter) with a cadence logic tied to the actual length of the buyer's decision timeline.
*What to cover:*
- The mismatch between a 90-day sales cycle and a weekly email cadence: weekly sends create noise, not momentum
- A cadence framework: map email touchpoints to decision milestones rather than calendar dates. Example: send at initial engagement, at the 30-day re-engagement point, immediately after any behavioral trigger (pricing page visit, demo request), and 7 days before a trial end date
- The right send volume for B2B: typically 4-8 emails over a 60-90 day prospect journey, not 12 weekly sends

*Evidence required:* A worked example cadence timeline for a 90-day sales cycle (week 1 / week 4 / week 8 / week 12 with email type for each). This is original; the writer constructs it from the guidance above.
*Do NOT include:* Send-time optimization advice (Tuesday morning vs. Thursday afternoon); this is a B2C tactic with minimal impact on B2B sales cycle-driven cadence.

---

**H2: Pillar 4 -- Measuring Email Performance Against Pipeline, Not Vanity Metrics** (~200 words | ~11% of total)

*Section purpose:* Give the reader a concrete measurement framework they can implement immediately, replacing open rate as the primary KPI.
*What to cover:*
- The three metrics that connect email to revenue: email-sourced pipeline (deals where email was the first meaningful touchpoint), email-influenced pipeline (deals where email accelerated a deal already in progress), and meeting-booked rate from email sequences
- How to calculate email-sourced pipeline attribution: a straightforward methodology using UTM parameters plus CRM opportunity source fields
- What to stop measuring: open rate as a primary KPI (especially post-iOS 15 Mail Privacy Protection, which inflates open rates artificially)

*Evidence required:* Reference to iOS 15 Mail Privacy Protection's impact on open rate reliability (well-established; do not cite a date-specific statistic, as the impact is ongoing). One benchmark: a realistic email-sourced pipeline contribution percentage for a well-run B2B SaaS email program (5-15% of pipeline is a defensible range; verify before publishing).
*Do NOT include:* Detailed instructions on CRM configuration -- link to documentation instead.

---

**H2: Putting It Together -- Your 30-Day B2B Email Audit** (~200 words | ~11% of total)

*Section purpose:* Give the reader an immediate action plan so the piece ends with momentum, not just insight.
*What to cover:*
- Week 1: Audit current segmentation -- are contacts bucketed by buying stage or by persona?
- Week 2: Review last 10 sent emails -- do they serve the buying committee or only the champion? Would they survive being forwarded without context?
- Week 3: Map cadence to sales cycle -- does send frequency match the 60-90 day decision timeline?
- Week 4: Reset the measurement dashboard -- remove open rate as primary KPI, add pipeline contribution

*Evidence required:* None -- this is a synthesis section. The writer pulls from the framework already introduced.
*Do NOT include:* New concepts not introduced in prior sections. This is a consolidation section, not a place to introduce additional advice.

---

*Word count verification:* 280 + 150 + 280 + 280 + 250 + 200 + 200 = 1,640 words / 1,800 target = 91% ✓ (within 10% tolerance; writer should expand the pillar sections with additional examples)

**CTA placement:**
- Mid-piece (after Pillar 2 section): Soft CTA -- "Download the B2B Email Content Matrix" (a one-page PDF of the stage-content table). Suggested text: "We've turned this matrix into a one-page reference you can share with your team. [Download it here]."
- End of piece: Hard CTA -- Demo request. Suggested text: "If you're ready to automate the cadence logic described above, [see how our platform handles it] in a 20-minute walkthrough."

---

### SEO Requirements

| Element                  | Target / Instruction                                                                                           |
|--------------------------|----------------------------------------------------------------------------------------------------------------|
| Primary keyword          | b2b email marketing best practices                                                                             |
| Keyword placement        | H1 (first 5 words), first H2 or within first 100 words of body, 0.5-1% density (~9-18 mentions in 1,800 words)|
| Secondary keywords       | b2b email marketing strategy / email marketing for saas / b2b email campaigns / email open rate benchmarks b2b |
| Search intent            | Informational with commercial undertone (reader is learning; secondary intent is evaluating tools)             |
| Featured snippet target  | Yes -- the Stage-Content Matrix table in Pillar 1's H3 section; format it as a clean markdown table           |
| Meta description         | "B2B email marketing requires a different playbook than B2C. Here's the 4-pillar framework SaaS marketing teams use to connect email to pipeline." (155 characters) |
| Title tag                | B2B Email Marketing Best Practices: A Framework for SaaS Teams (62 characters)                                |
| Internal links           | Email automation features page → "automate the cadence logic"; Pricing page → "see our plans"; Case study → anchor text matches company or outcome |
| External links           | 2-3 external citations: analyst data on buying committee size, iOS 15 privacy impact source, one academic or industry research source on email cadence |

---

### Reference Materials

**Competitive content (analyze, do not copy):**
- Top-ranking "B2B email marketing best practices" listicle (check current SERP): Match its comprehensive structure and readable formatting. Exceed it by adding the pillar framework and pipeline measurement section, which no current top-3 result includes. Do NOT replicate its mix of B2C and B2B advice -- the differentiation depends on B2B specificity throughout.
- ESP vendor blog post in top 5 results: It is technically strong on deliverability. Do not compete on that ground -- the technical reader is not this piece's audience. Ignore deliverability mechanics entirely.

**Data and statistics to cite:**
- Buying committee size in B2B SaaS purchases: Gartner research on average number of stakeholders (6-10); verify current year's figure. Use in Pillar 2 section.
- iOS 15 Mail Privacy Protection's inflation of open rates: Reference the policy change (September 2021, ongoing); source from Apple documentation or major email industry publication. Use in Pillar 4 section.
- B2B sales cycle length benchmark: Use a current analyst source; 30-120 days is the defensible range for SaaS mid-market deals. Use in Introduction.

**Internal knowledge sources:**
- Product team contact (confirm name before assigning): Can speak to how the platform handles buying-stage segmentation and cadence automation. Use for fact-checking only -- do not quote in the piece.
- Existing customer case study (confirm availability): If a customer result on email-sourced pipeline attribution exists, include it in the Pillar 4 section as a real-world example. This would be the piece's strongest evidence.

**Content to NOT duplicate:**
- "Email Deliverability Guide" (confirm URL): Covers SPF, DKIM, DMARC in depth. This piece must link to it in the Pillar 3 section and explicitly defer technical deliverability questions there -- do not re-explain deliverability concepts.
- "Email Subject Line Best Practices" (confirm URL): If this exists
