---
name: publish-blog-post
description: |
  Guides the user through the complete blog post creation pipeline from
  research and briefing through writing, SEO optimization, proofreading,
  and scheduling for publication. Use when the user wants to publish a
  blog post end-to-end, needs a structured content pipeline, or wants
  to go from topic idea to published article with quality gates at each
  stage.
  Do NOT use for writing a blog post without a publishing workflow (use
  blog-post-writing), for SEO-only optimization (use seo-blog-post), or
  for building an ongoing content calendar (use create-content-calendar).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "blog-post writing seo editing step-by-step"
  category: "content-creation"
  depends: "content-brief blog-post-writing seo-blog-post proofreading editorial-calendar"
  disclaimer: "none"
  difficulty: "beginner"
---

# Publish a Blog Post

A five-step workflow that takes a topic idea through research, drafting, SEO optimization, proofreading, and publication scheduling. Each step produces a concrete output that feeds directly into the next, with quality gates preventing weak content from reaching publication.

**Estimated time:** 2-6 hours (depending on research depth and topic complexity)

## When to Use

- User has a topic idea and wants to turn it into a published blog post
- User needs a repeatable content pipeline from idea to publish
- User wants quality gates between drafting, optimization, and publication
- User is building a blog and needs a structured process for each post
- Do NOT use when: the user only needs to write a draft (use blog-post-writing), only needs SEO analysis (use seo-blog-post), or is planning multiple posts over time (use create-content-calendar)

## Prerequisites

Before starting this workflow, ensure:

1. **Topic idea or assignment:** The user has at least a rough topic, angle, or content brief request. A single sentence is enough ("I want to write about remote work productivity tips").
2. **Target audience clarity:** The user knows who they are writing for -- even a rough description like "small business owners" or "beginner developers" is sufficient.
3. **Publication platform access:** The user has access to their publishing platform (WordPress, Ghost, Medium, Substack, or custom CMS). The workflow produces content ready for any platform, but the final scheduling step assumes the user can log in and publish.
4. **Time commitment:** Reserve 2-6 hours for the full pipeline. The workflow can be paused between any two steps without losing progress.

## Steps

**Step 1: Research and Brief** (uses: content-brief)

Define the topic scope, target audience, key arguments, and source material before any writing begins. The content brief is the blueprint that prevents scope creep and ensures the draft stays focused.

- Input: Topic idea, target audience description, and any existing notes or research the user has gathered
- Output: A completed content brief with working title, target reader profile, 3-5 key points to cover, competitor content analysis (2-3 existing posts on the same topic), and a recommended angle that differentiates this post
- Key focus: Spend 80% of research time on identifying the unique angle. A blog post that covers the same ground as existing content without a differentiated perspective will underperform regardless of writing quality.

**Step 2: Draft the Post** (uses: blog-post-writing)

Write the complete first draft using the content brief as the structural guide. The draft should follow the brief's outline but allow creative expansion where the writing flows naturally.

- Input: Completed content brief from Step 1, including key points, angle, and target reader profile
- Output: A complete blog post draft with title, introduction hook, H2-structured body sections covering all key points from the brief, supporting evidence or examples for each section, and a closing call-to-action
- Key focus: Write for the target reader identified in the brief. Match vocabulary and complexity to their expertise level. Do not self-edit during drafting -- capture all ideas first, refine in later steps.

**Step 3: SEO Optimization** (uses: seo-blog-post)

Optimize the draft for search engine visibility without sacrificing readability. SEO optimization happens after drafting, not during, to prevent keyword-stuffing from degrading the writing quality.

- Input: Complete blog post draft from Step 2, plus the target keyword or topic cluster from the content brief
- Output: SEO-optimized version of the draft with target keyword naturally integrated into title, meta description, H2 headings, introduction, and conclusion. Internal linking suggestions where the user has existing related content. Image alt-text recommendations for any planned visuals.
- Key focus: Readability score must remain above 60 (Flesch-Kincaid) after optimization. If keyword integration drops readability below this threshold, reduce keyword density rather than sacrificing clarity. Search engines reward content that humans actually read.

**Step 4: Proofread and Polish** (uses: proofreading)

Review the optimized draft for grammar, spelling, punctuation, consistency, and factual accuracy. This is the quality gate that catches errors before publication.

- Input: SEO-optimized draft from Step 3
- Output: A clean, publication-ready post with all grammar and spelling errors corrected, consistent formatting and style throughout, fact-checked claims with source verification notes, and a final readability assessment
- Key focus: Read the post from the target reader's perspective, not the author's. Flag any sentence that requires re-reading to understand. Check that the introduction delivers on the title's promise and the conclusion delivers on the introduction's promise.

**Step 5: Schedule and Publish** (uses: editorial-calendar)

Determine the optimal publication timing and schedule the post within the broader content calendar. Publication is not just clicking "publish" -- it includes timing strategy and distribution planning.

- Input: Publication-ready post from Step 4, plus the user's existing content calendar (if any) and audience engagement data (if available)
- Output: A scheduled publication date and time based on audience activity patterns, a distribution checklist (social media shares, email newsletter inclusion, community posts), and the post added to the editorial calendar with metadata (topic, keywords, target audience, publication date)
- Key focus: If the user has no existing editorial calendar, create one with this post as the first entry. If the user has an existing calendar, check for topic overlap or cannibalization with recently published posts. Space posts on similar topics at least 2 weeks apart.

## Output Format

```
## Blog Post Publishing Pipeline: [Topic]

### Content Brief
- **Working Title:** [title]
- **Target Audience:** [audience description]
- **Differentiated Angle:** [what makes this post unique]
- **Key Points:**
  1. [point 1]
  2. [point 2]
  3. [point 3]
- **Competitor Posts Reviewed:** [count] posts analyzed
- **Word Count Target:** [number] words

### Draft Status
- **Actual Word Count:** [number]
- **Sections:** [count] H2 sections
- **Evidence Types Used:** [statistics, anecdotes, case studies, expert quotes]

### SEO Optimization
- **Target Keyword:** [keyword]
- **Keyword Placements:** Title, meta description, [H2 headings], introduction
- **Internal Links:** [count] links to existing content
- **Readability Score:** [score]/100 (Flesch-Kincaid)

### Proofread Results
- **Errors Corrected:** [count]
- **Facts Verified:** [count] claims checked
- **Quality Assessment:** [pass/needs revision]

### Publication Plan
- **Publish Date:** [date and time]
- **Platform:** [platform name]
- **Distribution Checklist:**
  - [ ] Social media share: [platform] with [hook]
  - [ ] Email newsletter inclusion
  - [ ] Community post: [community name]
- **Editorial Calendar Entry:** Added with tags [tag1, tag2, tag3]
```

## Decision Points

- **Before Step 1:** If the user already has a detailed content brief or outline, skip Step 1 and begin at Step 2 with the existing brief as input. Verify the brief includes a target audience and differentiated angle before proceeding.
- **After Step 1:** If competitor analysis reveals the topic is saturated with no clear differentiation opportunity, pivot the angle or choose a different topic before investing time in drafting. Return to Step 1 with a revised topic.
- **After Step 2:** If the draft exceeds 3,000 words, consider splitting into a two-part series. Each part should stand alone as a complete post. Restart Step 2 for Part 2 with a brief derived from the overflow content.
- **After Step 3 (platform decision):** If publishing on Medium or Substack, de-emphasize internal linking (these platforms have limited internal link value) and emphasize headline optimization instead. If publishing on a personal blog, prioritize internal linking to existing content for SEO authority building.
- **After Step 3 (audience decision):** If the target audience is new (fewer than 100 regular readers), weight SEO optimization heavily -- organic search is the primary discovery channel. If the audience is established (500+ subscribers), weight email distribution and social sharing -- the existing audience is the primary amplification channel.
- **After Step 4:** If proofreading reveals structural issues (sections out of order, missing key arguments from the brief), return to Step 2 for a focused revision rather than trying to fix structural problems during proofreading.

## Failure Handling

- **Step 1 fails (no differentiated angle found):** If research reveals no gap in existing content for the chosen topic, do not proceed to drafting. Instead: (a) narrow the topic to a specific sub-topic with less competition, (b) choose a different format (case study, data-driven analysis, personal experience) that existing content does not use, or (c) select a different topic entirely. Restarting Step 1 with a refined scope is better than producing undifferentiated content.

- **Step 2 produces poor quality output:** If the draft does not coherently cover the brief's key points, check whether the brief was too ambitious (too many key points for the target word count). Reduce the brief to 3 core points and redraft. If the writing quality itself is weak, review the target audience definition -- mismatched tone or complexity is the most common cause.

- **Step 3 degrades readability:** If SEO optimization makes the post feel unnatural or keyword-stuffed, revert to the pre-optimization draft and re-apply with a lighter touch. Use the target keyword in the title and one H2 heading only, and let the rest of the post use natural language variations. Over-optimization hurts both reader experience and modern search rankings.

- **Step 4 reveals factual errors:** If proofreading uncovers claims that cannot be verified, remove the claim or replace it with a weaker but verifiable statement. Do not publish unverified statistics, quotes, or data points. Flag the gap for future research if the claim is central to the post's argument.

- **User wants to change direction mid-workflow:** If the user decides to change the topic or angle after Step 2 (drafting), Steps 1-2 must be repeated. Steps 3-5 are not salvageable from a different topic. If the user only wants to change the tone or style, return to Step 2 and revise using the same brief with updated style notes.

## Expected Outcome

When this workflow is complete, the user will have:

1. A completed content brief documenting the topic, angle, audience, and competitive landscape
2. A fully written, SEO-optimized, proofread blog post ready for publication
3. A scheduled publication date with a distribution checklist for promoting the post
4. An editorial calendar entry tracking this post's metadata for future content planning
5. A repeatable five-step process they can follow for every subsequent blog post

## Edge Cases

- **User has no topic idea.** Ask the user about their expertise, audience questions they frequently answer, and recent industry developments. Use these to generate 3-5 topic ideas ranked by differentiation potential. Select one and proceed to Step 1.
- **User wants to publish immediately with no scheduling.** Skip the timing optimization portion of Step 5. Still create the editorial calendar entry and distribution checklist -- the value of tracking and promoting the post is independent of scheduled timing.
- **User's blog has no existing content for internal linking.** In Step 3, skip internal linking suggestions. Instead, identify 2-3 topics for future posts that would create natural linking opportunities with this post. Add these to the editorial calendar as future content ideas.
- **User provides a completed draft instead of a topic.** Skip Steps 1-2. Evaluate the draft for a clear angle and audience targeting. If both are present, proceed to Step 3. If either is missing, create a retroactive brief (Step 1) from the draft content to establish the angle and audience before optimizing.
- **Topic requires expert interviews or original research.** Add a research sub-step between Steps 1 and 2. The content brief from Step 1 identifies what information is needed. The user gathers that information. Step 2 drafting begins only after the research inputs are available. Estimate an additional 1-3 days for research-dependent posts.
- **User wants to co-author with another writer.** Assign Step 1 and Step 2 to different authors, with the content brief serving as the handoff document. Steps 3-5 should be handled by the same person for consistency. Add a review checkpoint between Steps 2 and 3 for the co-author to approve the draft.

## Example

**Input:** "I run a small SaaS company and want to write a blog post about reducing customer churn for our company blog. Our audience is SaaS founders and product managers."

**Output:**

## Blog Post Publishing Pipeline: Reducing Customer Churn

### Content Brief
- **Working Title:** How We Reduced Churn 23% by Fixing Our Onboarding Emails
- **Target Audience:** SaaS founders and product managers
- **Differentiated Angle:** Specific case study on email-driven churn reduction with real metrics, not generic churn advice
- **Key Points:**
  1. Identifying the onboarding email drop-off point using cohort data
  2. Rewriting the email sequence with action-oriented CTAs
  3. A/B testing the new sequence against the original
  4. Measuring the 23% churn reduction over 90 days
- **Competitor Posts Reviewed:** 3 posts analyzed (all generic advice, none with specific email case study data)
- **Word Count Target:** 1,800 words

### Draft Status
- **Actual Word Count:** 1,820
- **Sections:** 4 H2 sections plus introduction and conclusion
- **Evidence Types Used:** Internal data, before/after email screenshots, cohort analysis chart

### SEO Optimization
- **Target Keyword:** reduce SaaS churn
- **Keyword Placements:** Title, meta description, H2 heading "Why Onboarding Emails Reduce SaaS Churn," introduction paragraph
- **Internal Links:** 3 links (customer success guide, email marketing basics, product onboarding checklist)
- **Readability Score:** 68/100 (Flesch-Kincaid) -- above 60 threshold

### Proofread Results
- **Errors Corrected:** 2 grammatical, 1 formatting inconsistency
- **Facts Verified:** 4 data points checked against source spreadsheet
- **Quality Assessment:** Pass -- CTA refined from generic to specific template offer

### Publication Plan
- **Publish Date:** Tuesday at 10:00 AM (peak B2B SaaS engagement window)
- **Platform:** Company blog (WordPress)
- **Distribution Checklist:**
  - [ ] LinkedIn post with key stat hook ("23% churn reduction from 5 email changes")
  - [ ] Email newsletter feature for Tuesday edition
  - [ ] Post in 2 SaaS communities (IndieHackers, SaaS Growth Slack)
- **Editorial Calendar Entry:** Added with tags churn, onboarding, email, case-study
