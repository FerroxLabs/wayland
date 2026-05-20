---
name: create-online-course
description: |
  Guides the user through creating an online course from concept validation
  through student feedback collection, chaining 7 atomic skills across
  education, design-creative, and business categories. Step 1 serves as a
  validation gate with a hard stop if concept validation fails. Covers
  self-hosted vs. platform decisions, video vs. text format, and cohort-based
  vs. self-paced models. Use when the user wants to create and launch an
  online course. Do NOT use for in-person teaching (use lesson plan skills),
  writing a book or guide (use writing workflows), or creating a single tutorial
  (use tutorial-writing skill).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "teaching curriculum step-by-step planning"
  category: "creative-project"
  depends: "online-course-design curriculum-mapping video-script-writing video-storyboard slide-deck-structure product-launch-checklist student-feedback"
  disclaimer: "none"
  difficulty: "advanced"
---

# Create an Online Course

**Estimated time:** 4-12 weeks (depending on course length, video production quality, and whether the user has existing content to adapt)

This workflow orchestrates 7 skills across education, design-creative, and business categories into a complete course creation pipeline. Creating an online course is one of the highest-effort creative projects a person can undertake -- it combines curriculum design expertise, content production skills, and marketing knowledge into a single multi-week project. The workflow's most critical feature is the validation gate at Step 1: before the user invests weeks in production, they must validate that a market exists for the course concept. If validation fails, the workflow stops.

## When to Use

- User wants to create and launch an online course on a topic they have expertise in
- User has knowledge they want to package into a structured learning experience for others
- User wants to monetize their expertise through course sales on platforms like Udemy, Teachable, Skillshare, or their own website
- User has been teaching informally (workshops, blog posts, conference talks) and wants to create a comprehensive course
- Do NOT use when: user wants to design a lesson plan for in-person teaching (use lesson plan and curriculum skills directly), user wants to write a book or long-form guide (use writing workflows), user wants to create a single tutorial or how-to video (use tutorial-writing or video-script-writing skills directly)

## Prerequisites

Before starting this workflow, ensure:

1. **Subject matter expertise:** The user has genuine expertise in the topic they want to teach. They do not need to be the world's foremost expert, but they must know significantly more than their target students.
2. **Target audience identified:** The user has a clear picture of who will take this course -- their current skill level, learning goals, and willingness to pay (if this is a paid course).
3. **Production time available:** Creating a quality course requires 4-12 weeks of focused effort. The user must be able to dedicate at least 10-15 hours per week to the project.
4. **Basic content creation tools:** A computer, microphone (for narration), screen recording software (free options work), and presentation software. Professional video equipment is not required for most course types.

## Steps

**Step 1: Validate Course Concept and Design Framework** (uses: online-course-design)

**VALIDATION GATE:** This step determines whether the course should be built at all. Before investing weeks in production, the user must validate that: (a) a market exists for this topic, (b) the user's approach is differentiated from existing courses, and (c) the target audience is willing to invest time or money in learning this material.

**If concept validation fails (no market signal, no differentiation, no audience interest), STOP THE WORKFLOW HERE.** Do not proceed to Step 2. The user should either pivot the concept, choose a different topic, or invest in audience building before attempting course creation. Production without validation wastes weeks of effort.

If validation passes, design the course framework: learning objectives, target outcomes, format decisions, and high-level module structure.

- Input: Course topic, user's expertise and unique angle, target student profile, existing courses on the same topic (competitive landscape), and any audience feedback or pre-existing demand signals (blog post engagement, workshop attendees, email list survey results)
- Output: Course validation report (pass or fail with evidence), and if passed: course design document with learning objectives, target outcomes, module structure (3-8 modules), format decisions (video, text, interactive), and estimated total course length
- Key focus: Validation requires evidence, not just the user's belief that the topic is valuable. Evidence includes: survey results from the target audience, engagement metrics on related content, existing course sales data in the niche (competitor courses with reviews indicate demand), or direct conversations with 5-10 potential students. A course with no validated demand will have no students regardless of quality.

**Step 2: Map the Curriculum** (uses: curriculum-mapping)

Transform the course design framework into a detailed curriculum: module-by-module breakdown with lesson objectives, content types, assessments, and time estimates.

- Input: Course design document from Step 1, detailed knowledge of the subject matter, any existing content the user can adapt (blog posts, presentations, workshop materials)
- Output: Complete curriculum map with: module titles and descriptions, lesson-by-lesson breakdown within each module, learning objectives per lesson, content format per lesson (video, text, exercise, quiz), estimated student time per lesson, and assessment strategy
- Key focus: Structure the curriculum using the principle of progressive mastery: each module builds on the previous one, and students should never encounter a concept that requires prerequisite knowledge they have not yet covered. Include practical exercises in every module -- passive video consumption does not produce learning. Design at least one assessment per module to verify student understanding before advancing.

**Step 3: Write Lesson Scripts** (uses: video-script-writing)

Write detailed scripts for all video lessons. Even if the user plans to teach from notes rather than read a script, writing the full script ensures completeness, proper pacing, and accurate time estimation.

- Input: Curriculum map from Step 2, the user's teaching style and voice, any visual aids or demonstrations planned for each lesson
- Output: Complete scripts for all video lessons with: introduction hooks, main content organized by learning objective, transition phrases between sections, demonstration cues (where to show screen, switch to slides, or demonstrate a concept), and recap summaries
- Key focus: Write for spoken delivery, not reading. Use conversational language, short sentences, and natural pause points. Include cues for visual elements: "[SHOW SCREEN: demonstrate the formula in a spreadsheet]" or "[SWITCH TO SLIDES: comparison chart]." Keep individual video lessons under 15 minutes -- students learn better in shorter segments and completion rates drop sharply after 15 minutes.

**Step 4: Create Visual Storyboards** (uses: video-storyboard)

Plan the visual presentation for each lesson: what appears on screen, when slides are shown, where demonstrations happen, and how visual variety maintains student attention.

- Input: Lesson scripts from Step 3, list of demonstrations, examples, and exercises planned for each lesson
- Output: Storyboard for each lesson showing: shot-by-shot visual plan (talking head, slides, screen share, whiteboard, animation), timing for each visual element, transition types between visual elements, and production notes (what needs to be prepared before recording)
- Key focus: Visual variety prevents student fatigue. Do not present 10 minutes of slides followed by 10 minutes of talking head. Alternate between visual types every 2-3 minutes: slides for concepts, screen share for demonstrations, talking head for stories and emphasis, and text overlays for key takeaways. The storyboard ensures visual changes are planned, not improvised during recording.

**Step 5: Design Presentation Materials** (uses: slide-deck-structure)

Create all slide decks, visual aids, and supporting materials used in the video lessons. These become both the recording assets and the downloadable resources students can reference.

- Input: Storyboards from Step 4, course branding (colors, fonts, logo if applicable), key concepts and diagrams needed per lesson
- Output: Complete slide decks for all lessons, designed for video recording (larger fonts, simpler layouts than presentation slides), plus downloadable resources: cheat sheets, exercise templates, and reference guides
- Key focus: Course slides differ from presentation slides. Presentation slides complement a live speaker; course slides must stand on their own when students review them after watching. Use larger text (minimum 24pt), more whitespace, one concept per slide, and consistent visual branding across all lessons. Create downloadable versions that include additional notes students can reference without re-watching videos.

**Step 6: Plan and Execute Course Launch** (uses: product-launch-checklist)

Plan the course launch as a product launch: pricing strategy, sales page, launch timeline, promotional campaign, and early-access or beta student recruitment.

- Input: Completed course content (from Steps 1-5), target student profile, pricing research (what competing courses charge), user's existing audience (email list, social media, professional network)
- Output: Launch plan with: pricing strategy (one-time vs. subscription vs. tiered), sales page structure and copy, pre-launch timeline (2-4 weeks of audience warming), launch sequence (emails, social posts, partner promotions), and post-launch monitoring plan
- Key focus: The launch is where most course creators fail. A good course with no launch strategy sells zero copies. The minimum viable launch includes: a sales page that clearly communicates who the course is for, what they will learn, and what the outcome is; an email sequence to the user's existing audience (even if small); and social proof (testimonials from beta students, preview lessons, or free samples). Price based on the outcome value, not the content volume.

**Step 7: Collect and Act on Student Feedback** (uses: student-feedback)

After launch, systematically collect student feedback to improve the course, generate testimonials, and identify content gaps or confusion points.

- Input: Student enrollment data, completion rates per module, any support questions or complaints received, and a feedback collection mechanism (survey, end-of-module prompts, discussion forum analysis)
- Output: Student feedback analysis with: module-by-module satisfaction scores, identified confusion points (lessons where students get stuck or drop off), suggested improvements prioritized by impact, testimonial collection for marketing, and a revision plan for the next course version
- Key focus: Track completion rates per module, not just overall enrollment. If Module 4 has a 60% drop-off rate but Modules 1-3 have 90%+ completion, the problem is in Module 4 specifically. Student feedback falls into three categories: (1) content gaps ("I wish you covered X"), (2) confusion points ("I did not understand Y"), and (3) quality issues ("The audio in Lesson 7 was hard to hear"). Prioritize confusion points first because they block learning.

## Decision Points

- **At Step 1 (CRITICAL):** If concept validation fails -- no market signal, no differentiation from existing courses, or no audience interest -- STOP. Do not proceed to Step 2. The user should either: (a) pivot the concept to address a more specific niche, (b) build an audience first through free content and then validate demand, or (c) choose a different course topic entirely. Proceeding without validation is the most expensive mistake in course creation.

- **At Step 1:** If the user is choosing between self-hosted (Teachable, Thinkific, own website) and marketplace (Udemy, Skillshare), the decision affects pricing, audience, and production requirements. Self-hosted gives higher margins but requires the user to bring their own audience. Marketplace provides built-in discoverability but takes a significant revenue cut and controls pricing. For users with an existing audience of 1,000+, self-hosted is typically better. For users with no audience, marketplace provides initial visibility.

- **Before Step 3:** If the user's course is text-heavy or code-heavy rather than video-heavy, adapt Steps 3-5 accordingly. Replace video scripts with written lesson content, replace storyboards with interactive exercise design, and replace slide design with code playground or worksheet creation. The curriculum structure (Step 2) and launch process (Step 6) remain unchanged.

- **Before Step 5:** If the user is choosing between self-paced and cohort-based delivery, this affects the entire production approach. Self-paced requires polished, standalone content (no live interaction). Cohort-based can use rougher content supplemented by live sessions, discussions, and group accountability. Cohort-based courses typically have higher completion rates (60-80%) than self-paced (5-15%).

- **After Step 6:** If launch enrollment is below expectations (fewer than 20 students in the first week for a course with a 500+ person audience), diagnose: (a) pricing too high (test a launch discount), (b) messaging unclear (audit the sales page), or (c) audience not activated (the email sequence or social posts did not reach them). Adjust and re-launch rather than assuming the course is flawed.

## Failure Handling

- **Step 1 fails (concept validation failure -- HARD STOP):** This is not a failure of the workflow; it is the workflow working correctly by preventing wasted production effort. If validation fails, the user should: (a) interview 5-10 potential students to understand what they actually want to learn, (b) create 2-3 free content pieces on the topic and measure engagement, (c) run a pre-sale or waitlist to test willingness to pay. Return to Step 1 only when new evidence supports demand.

- **Step 3-4 stalls (production fatigue):** Course creation is a marathon, not a sprint. If the user stalls during content production (a very common failure mode), break the remaining work into smaller chunks: script one lesson per day, not one module per day. Consider launching with a minimum viable course (the first 3 modules) and adding modules over time. An incomplete launched course that helps students is better than a complete unfinished course that helps no one.

- **Step 4 fails (video quality below acceptable standard):** If recording quality is consistently poor (bad audio, awkward delivery, confusing visuals), the user has three options: (a) invest in better equipment and practice delivery, (b) switch to screen-share-only format (removes the talking head requirement), or (c) hire a video editor to polish raw recordings. Many successful courses use simple screen recordings with narration -- professional video production is not required for effective teaching.

- **Step 6 fails (low enrollment despite good content):** The course exists but nobody is buying. This is almost always a marketing problem, not a content problem. Return to Step 6 and rebuild the launch: create a free preview or mini-course as a lead magnet, invest in the sales page copy, collect and display social proof, and consider partnerships with influencers or communities in the target niche.

- **User wants to change direction mid-workflow:** If the user discovers during Steps 2-3 that the topic is larger than expected, split into multiple shorter courses rather than one massive course. A series of focused 2-hour courses often sells better than one 15-hour comprehensive course, and the first course can be produced faster.

## Output Format

```
## Online Course Production: [Course Title]

### Step 1: Concept Validation
- Validation status: [PASS / FAIL - STOP]
- Market evidence: [survey results, competitor analysis, demand signals]
- Differentiation: [how this course differs from existing options]
- Target student: [description]
- Course framework: [N modules, estimated N hours total]
- Platform decision: [self-hosted / marketplace / undecided]

### Step 2: Curriculum Map
- Modules: [count]
- Total lessons: [count]
- Estimated student time: [hours]
- Assessments: [count and types]
- Content formats: [video, text, exercises, quizzes]

### Step 3: Lesson Scripts
- Scripts completed: [N of total]
- Average script length: [words per lesson]
- Estimated recording time: [hours]

### Step 4: Storyboards
- Storyboards completed: [N of total]
- Visual types: [talking head, slides, screen share, demos]
- Production assets needed: [list]

### Step 5: Presentation Materials
- Slide decks created: [count]
- Downloadable resources: [count]
- Branding applied: [yes / no]

### Step 6: Launch Plan
- Pricing: $[amount] ([one-time / subscription / tiered])
- Launch date: [date]
- Pre-launch timeline: [N weeks]
- Promotional channels: [list]

### Step 7: Student Feedback
- Enrollment: [count]
- Completion rate: [percentage by module]
- Satisfaction score: [rating]
- Top improvement: [description]

### Production Status
- Current step: [Step N]
- Weeks elapsed: [N] / [estimated total]
- Modules complete: [N of total]
```

## Edge Cases

- **User has no existing audience or email list:** Step 6 launch strategy must be entirely acquisition-focused. Options: marketplace platform (Udemy, Skillshare) for built-in discoverability, free mini-course as a lead magnet to build an email list first, or partnerships with creators who have audiences in the same niche. Consider launching on a marketplace first to validate and build testimonials, then migrating to self-hosted for higher margins.

- **User wants to create a free course (no monetization):** Skip pricing strategy in Step 6 but keep the launch process. Free courses still need marketing to reach students. The validation in Step 1 shifts from "willingness to pay" to "genuine interest in learning this." Free courses can be lead magnets for paid offerings or community building tools.

- **User's course topic requires hands-on practice (coding, design, music):** Steps 3-5 must include interactive exercise design, not just video content. Each module needs a practical project that students complete independently. Consider platforms that support embedded code environments, design canvases, or practice tools. Completion rates for practice-based courses are significantly higher than passive video courses.

- **User wants to co-create the course with another expert:** Double the coordination time at every step. The curriculum map (Step 2) must clearly assign which expert teaches which modules. Recording (Step 4) must maintain consistency in audio quality and visual style across two presenters. The sales page (Step 6) must position both experts credibly.

- **User is creating a course in a rapidly changing field (AI, crypto, regulations):** Build the course in a modular structure so individual lessons can be updated without re-recording the entire course. Note update frequency expectations in the course description. Consider a cohort-based model where live sessions address the latest developments while recorded content covers stable fundamentals.

- **User's first language is not the language the course will be taught in:** Script everything in Step 3 (do not ad-lib) and practice pronunciation of domain-specific terms. Consider adding subtitles in Step 4 editing. Many successful courses are taught by non-native speakers -- accent is rarely a barrier, but unclear pronunciation of key terms can be.

## Example

**Input:** "I'm a senior data analyst with 10 years of experience. I want to create a course teaching mid-career professionals how to transition into data analytics. I have an email list of 800 subscribers from my blog."

**Output:**

**Step 1 (online-course-design):**
Validation: PASS. Evidence: blog posts about career transitions into data analytics get 3x higher engagement than other topics. Survey of 120 email subscribers: 34% expressed interest in a paid course, 68% said they would pay $100-200. Competitive analysis: existing courses focus on technical skills (SQL, Python) but none address the career transition angle (how to actually land a data analytics job from a non-technical background). Differentiation: career transition focus, not just technical training. Course framework: 6 modules, estimated 8 hours total, intermediate difficulty, self-paced on Teachable.

**Step 2 (curriculum-mapping):**
Six modules: (1) Is Data Analytics Right for You? (assessment and career mapping), (2) SQL Foundations for Career Switchers (hands-on exercises), (3) Data Visualization That Gets You Hired (portfolio-ready projects), (4) The Analytics Interview (preparation and practice), (5) Building Your Data Portfolio (3 guided projects), (6) Landing Your First Analytics Role (job search strategy). Each module has 3-5 video lessons, 1-2 exercises, and a quiz. Total: 24 lessons, 8 exercises, 6 quizzes.

**Step 3 (video-script-writing):**
24 lesson scripts written, averaging 1,200 words per script (8-10 minutes of video each). Scripts include screen share demonstrations for SQL and visualization tools, talking head segments for career advice, and exercise introduction segments. Each script starts with a hook connecting the lesson to the student's career transition goal.

**Step 4 (video-storyboard):**
Storyboards plan visual variety: talking head for career advice segments, screen share for SQL demonstrations, slides for frameworks and comparison charts, and split-screen for before and after portfolio reviews. Whiteboard-style overlays planned for explaining analytical concepts visually.

**Step 5 (slide-deck-structure):**
6 module slide decks (consistent branding: blue and white, clean sans-serif typography). Downloadable resources: SQL cheat sheet, data visualization checklist, portfolio project templates (3 complete datasets with analysis guides), interview question bank with sample answers, and job search tracker spreadsheet.

**Step 6 (product-launch-checklist):**
Price: $149 (positioned between free YouTube tutorials and $500+ bootcamps). Launch timeline: 2-week pre-launch (email sequence to 800 subscribers), launch week (sales page live, promotional posts, early-bird discount of $99 for first 50 students), post-launch (ongoing enrollment, student testimonials added as they complete the course). Sales page structure: headline addressing the career transition pain point, 3 student outcomes, module overview, instructor credentials, FAQ, and money-back guarantee.

**Step 7 (student-feedback):**
After 6 weeks: 85 students enrolled, 62% completion rate for Module 1-3, 41% completion rate for the full course. Highest-rated module: Module 5 (portfolio projects) with 4.8 out of 5. Lowest completion: Module 2 (SQL foundations) -- students report it moves too fast. Revision plan: split Module 2 into 2 modules with additional practice exercises, add a "SQL readiness check" at the start so students know if they need extra preparation.

**Result:** Course launched in 8 weeks, generating $8,500 in first-month revenue (85 students at blended price of $100 average). Student feedback drives a v1.1 revision addressing the SQL module pacing issue, improving completion rates for subsequent cohorts.

## Expected Outcome

When this workflow is complete, the user will have:

1. A validated course concept with evidence of market demand and clear differentiation
2. A complete curriculum map with module and lesson structure, learning objectives, and assessment strategy
3. Detailed lesson scripts for all video content, written for natural spoken delivery
4. Visual storyboards ensuring varied and engaging presentation across all lessons
5. Professional slide decks and downloadable resources for students
6. A launched course on the chosen platform with pricing, sales page, and promotional campaign
7. A student feedback system producing actionable insights for course improvement
