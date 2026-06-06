---
name: opinion-piece
description: |
  Writes structured opinion articles with a clear thesis, supporting evidence,
  counterargument acknowledgment, and a persuasive conclusion. Use when the user
  wants to argue a position, write an editorial, draft a thought leadership piece,
  or compose a persuasive article. Do NOT use for neutral informational posts
  (use `blog-post-writing`), listicles (use `listicle-writing`), or academic
  arguments with citations (use `academic-argument`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "blog-post writing guide"
  category: "writing"
  subcategory: "content-marketing"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Opinion Piece Writing

## When to Use

Use this skill when the user explicitly wants to argue, advocate, or persuade -- not inform, explain, or entertain neutrally.

**Trigger scenarios where this skill applies:**
- The user wants to argue a specific position on an industry trend, business practice, social behavior, or professional norm -- for example, "write a piece arguing remote work is permanently changing office real estate" or "I want to argue that product managers have too much power in most tech companies"
- The user asks for an editorial, op-ed, or thought leadership article intended for publication in a newsletter, trade publication, corporate blog, or professional platform like Substack or Medium
- The user has a contrarian position they want to defend against mainstream consensus -- the piece needs to earn credibility by confronting the consensus directly, not sidestepping it
- The user wants to write a "hot take" that responds to a specific recent event, trend, or widely held belief -- time-sensitive opinion pieces require the hook to reference the triggering event immediately
- The user is a practitioner, founder, executive, or domain expert who wants their point of view captured as a public-facing piece -- the goal is to establish a distinct perspective, not just summarize what is known
- The user asks for a persuasive piece for internal audiences -- a memo arguing for a budget decision, a case for a new policy, or an argument for changing an organizational practice -- where the same argumentative structure applies even if the format differs

**Do NOT use this skill when:**
- The user wants a balanced, neutral informational post that explains multiple perspectives without taking a position -- use `blog-post-writing` instead
- The user wants a listicle format ("7 reasons why...") even if the list argues a point -- use `listicle-writing`, which handles enumerated persuasion differently
- The user wants scholarly argumentation with citations, footnotes, and a formal literature review -- use `academic-argument` instead
- The user wants a short-form persuasion piece under 400 words for LinkedIn -- use `linkedin-post` instead, which handles the platform's specific constraints
- The user wants to write a case study, success story, or narrative that persuades through demonstration rather than direct argument -- use `case-study-writing` instead
- The user wants a speech or presentation script -- the rhetorical structure, pacing, and audience management of spoken argument differs fundamentally from written opinion

---

## Process

### Step 1: Extract the Position, Audience, and Stakes

Before writing a single word of the piece, establish three things with precision. These determine everything that follows.

- **The thesis.** Ask the user to state their position in one sentence without hedging. If they say "I want to talk about AI in healthcare," push them: "What do you believe is true about AI in healthcare that most people in your audience either don't know, don't believe, or actively disagree with?" The thesis must be falsifiable -- if no one could reasonably disagree, it is not an argument, it is a truism.
- **The audience.** Identify specifically who this piece is for and what their current belief state is. An audience of skeptics requires more evidence pillars and a more robust counterargument. An audience of the undecided requires a stronger emotional hook and clearer stakes. An audience of believers needs less persuasion and more call to action -- a rallying piece rather than a conversion piece.
- **The publication context.** Where will this appear? A trade publication op-ed (800-1,200 words) has different norms than a Substack essay (1,500-3,000 words) or an internal memo (500-800 words). Length, formality, and evidence standards all shift with context.
- **The stakes frame.** Ask the user: "What happens if your audience reads this and does nothing?" The answer shapes the conclusion. If the stakes are high and urgent, the close should be urgent. If the stakes are slow-moving but serious, the close should be sobering.
- **Credibility anchor.** Establish what gives the author standing to make this argument -- lived experience, professional expertise, research familiarity, or contrarian observation. This shapes whether the piece should be written in first person (practitioner credibility) or third-person analytical (idea credibility).

### Step 2: Identify the Strongest Counterargument First

Most opinion pieces fail because the author defeats a straw man rather than the real objection. Identify the counterargument before drafting the thesis section.

- Ask the user: "What would the smartest, most informed person who disagrees with you say? Not what would a critic say -- what would a thoughtful opponent say?" This distinction is critical. Critics attack motives. Thoughtful opponents attack the logic.
- Run the "NYT op-ed test": Would a senior editor at a major publication look at your counterargument section and say "that's the real objection"? If not, the counterargument is too weak.
- The strongest counterargument typically falls into one of four categories: (1) empirical -- the evidence points the other way; (2) practical -- the position is theoretically correct but unworkable; (3) values -- the author and opponent weight different priorities; (4) scope -- the position is true in limited conditions but the author is overgeneralizing. Identify which category applies and structure the rebuttal accordingly.
- Steel-man the opposition before writing the rebuttal. Write the best version of the counterargument you can, then find the specific weak joint in that argument. The rebuttal should attack the weak joint, not the weakened version of the argument the author wishes the opponent had made.

### Step 3: Assemble the Evidence Architecture

Each evidence pillar must use a different evidence type. Three pillars of identical evidence type (three statistics, three anecdotes) creates a repetitive, unconvincing argument. Mix and sequence deliberately.

- **Evidence types available:** empirical data (studies, surveys, statistics), case studies (specific named situations with outcomes), analogical reasoning (mapping the claim onto a parallel domain where the truth is clearer), expert testimony (specific attributed positions, not vague "experts say"), first-person testimony (the author's direct experience), logical deduction (if X is true and Y is true, then Z follows), and historical precedent (a prior situation with a documented outcome that parallels the claim).
- **Sequence the evidence strategically.** Lead with the evidence type that is most immediately credible to your specific audience. For technical audiences, lead with empirical data. For practitioner audiences, lead with case studies or first-person testimony. For general audiences, lead with analogy or narrative.
- **Each pillar must pass the "So What" test.** After each supporting argument, the reader should be able to articulate not just what is true, but why it matters for the thesis. Evidence that does not connect back to the thesis is filler.
- **Assign evidence quality tiers.** Primary evidence (directly measures the thing being argued) is stronger than secondary evidence (measures a proxy). Acknowledge when you are using secondary evidence -- readers notice when you do not, and it damages credibility more than honesty would.
- **Identify the weakest pillar.** Every argument has one. Place it second in a three-pillar structure, not last. The first pillar establishes credibility, the last pillar lands the argument. The middle can carry the weakest evidence.

### Step 4: Calibrate Voice and Register

The same argument written in different registers reaches different audiences. Voice calibration is not cosmetic -- it determines whether the piece persuades or alienates.

- **Registers for opinion writing:** (1) Analytical practitioner -- evidence-heavy, precise language, minimal emotional appeal, appropriate for trade publications, B2B audiences, and technical readers; (2) Passionate advocate -- more rhetorical flourish, personal stakes visible, appropriate for consumer audiences, social causes, and cultural commentary; (3) Measured authority -- confident but not strident, acknowledges complexity without abandoning the position, appropriate for executive audiences and publications that prize nuance; (4) Provocateur -- deliberately challenges conventions of the discourse, appropriate for contrarian pieces where the goal is to reframe the conversation entirely.
- If the user provides a writing sample, extract voice markers: average sentence length, use of first person, frequency of rhetorical questions (use sparingly), vocabulary register (technical vs. accessible), and whether the writer tends toward declarative or interrogative constructions.
- If no voice sample is provided, default to **analytical practitioner** register with a first-person credibility anchor -- it is the most broadly effective register for professional opinion writing.
- Decide upfront: first person or third person. First person is appropriate when the author's experience is part of the evidence or when the platform (Substack, personal blog, LinkedIn long-form) expects a human voice. Third person analytical is appropriate when the author wants the argument to stand independent of their personal authority.

### Step 5: Construct the Opening

The opening paragraph is the highest-stakes writing in the piece. It must accomplish four things in 3-5 sentences, with no sentence wasted.

- **Hook.** Open with a specific scene, a striking data point, a concrete contradiction, or a recent triggering event -- never with a generalization, historical sweep, or rhetorical question. The hook should make the reader feel something immediately: surprise, recognition, discomfort, or curiosity.
- **Thesis.** State the central position within the first three sentences. Not a hint of it, not a framing of the debate -- the actual position, stated directly. An editor should be able to pull the thesis sentence and use it as a pull quote.
- **Stakes.** Establish why this argument matters right now. "Right now" is critical -- opinion pieces are inherently time-sensitive. The piece should feel like it is responding to the present moment, not explaining a timeless truth.
- **Reader invitation.** Even a reader who initially disagrees should feel that continuing is worth their time. This does not mean softening the position -- it means signaling that the piece will give them something to think with, not just argue at them.
- Avoid these specific opening patterns: any sentence starting with "In today's world," "Throughout history," "It is widely known," or "Many people believe." Avoid opening with a rhetorical question -- it signals the author is not confident enough to lead with the claim. Avoid starting with a definition.

### Step 6: Draft the Body Sections

Write each section with a deliberate internal structure. Each body section is a mini-argument, not a paragraph dump.

- **Each section opens with a claim, not a transition.** "The problem with annual reviews is timing" is a claim. "Now let's turn to timing" is a transition. Claim-first openings are stronger.
- **Evidence-Analysis-Connection structure within each section:** state the evidence, explain what it means (analysis), then explicitly connect it to the thesis. Readers do not self-service the connection between evidence and argument -- the author must make it explicit.
- **Paragraph length discipline.** Online opinion pieces should avoid paragraphs longer than 5-6 sentences. Print pieces can sustain 8-10 sentence paragraphs. Vary paragraph length deliberately: a two-sentence paragraph after three longer ones signals emphasis.
- **Section length parity.** The three evidence pillars should be roughly similar in length unless one is deliberately weighted for emphasis. An argument with a 500-word pillar, a 100-word pillar, and a 300-word pillar signals that the author ran out of ideas for the short one.
- **Write the counterargument section last among the body sections, just before the conclusion.** This placement is strategic: it means the reader has absorbed the full positive case before encountering the strongest objection, and the rebuttal leads directly into the closing argument.
- **Rebuttal technique options:** (1) concede and distinguish -- "This objection is right about X but wrong about Y, and here is why Y matters more"; (2) scope limitation -- "This objection applies in situation A but not in situation B, and situation B is the relevant case here"; (3) evidence rebuttal -- "This objection rests on the assumption that X is true; here is evidence that X is not true"; (4) consequence rebuttal -- "Even if this objection is correct, acting on it leads to outcome Z, which is worse than the alternative." Use the rebuttal technique that matches the counterargument category identified in Step 2.

### Step 7: Write the Conclusion

The conclusion is not a summary. A conclusion that restates what was argued fails the reader by giving them nothing new. The conclusion should deliver the emotional and logical payoff of the argument.

- **Restate the thesis in new language.** The thesis should appear three times in the piece: in the opening (stated directly), in the body (developed through evidence), and in the conclusion (restated with the weight of everything argued behind it). Each restatement should feel different -- not synonymous substitution, but the same idea expressed at a higher level of confidence or urgency.
- **Raise the stakes explicitly.** The closing paragraph should articulate the cost of inaction or the consequence of ignoring the argument. This is not fear-mongering -- it is completing the logic of the piece. If the author's position is correct, what follows from continued rejection of it?
- **End with a sentence that lands, not a sentence that fades.** The final sentence should be the most carefully written sentence in the piece. It should be short (under 20 words), declarative, and memorable. Avoid ending with a question, a hedge, a qualification, or a summary phrase.
- Never end with: "Only time will tell," "The debate will continue," "Ultimately, it is up to each of us," or any construction that retreats from the position at the moment of maximum impact.

### Step 8: Edit for Persuasive Integrity and Compression

After drafting, review the complete piece against a specific checklist before delivering it.

- **Thesis consistency check.** Read only the first and last paragraphs. Do they make the same argument? If the conclusion feels weaker or more hedged than the opening, the body sections drifted. Restore alignment.
- **Evidence specificity audit.** Scan every paragraph for vague assertions -- "research shows," "many companies find," "experts agree." Every one of these must be replaced with a specific datum, a named case, or a concrete example. Vague evidence is worse than no evidence because it signals the author knows they should have evidence but does not.
- **Counterargument strength test.** Read the counterargument section aloud. Would a thoughtful opponent find it fair? If the opponent would say "that is not my argument," rewrite it.
- **Compression pass.** Opinion pieces that run 20% over their target length are usually 20% less persuasive. Cut adverbs, redundant transitions, and sentences that restate what the previous sentence just said. Target one sentence per claim.
- **First-sentence audit.** Read only the first sentence of every paragraph. Those sentences should form a coherent skeleton of the argument. If a paragraph's first sentence is a transition, make it a claim.

---

## Output Format

```
# [Title: A Declarative Claim, Not a Neutral Description]

[OPENING BLOCK -- 3-5 sentences]
[Hook: specific scene, data point, or contradiction]
[Thesis: the position, stated directly and without hedge]
[Stakes: why this matters now, for this audience]

---

## [Evidence Pillar 1 Heading -- States the Sub-Claim]

[CLAIM SENTENCE -- opens the section]

[PARAGRAPH 1: Evidence presented with specificity -- data, case, or analogy]
[PARAGRAPH 2: Analysis -- what the evidence means and why it supports the thesis]
[PARAGRAPH 3 (if needed): Extension or complication of the sub-claim]

[TRANSITION SENTENCE -- connects to next pillar's logic, not just announces it]

---

## [Evidence Pillar 2 Heading -- States the Sub-Claim]

[CLAIM SENTENCE -- opens the section]

[PARAGRAPH 1: Evidence of a DIFFERENT TYPE than Pillar 1]
[PARAGRAPH 2: Analysis connecting evidence to thesis]
[PARAGRAPH 3 (if needed): Extension or additional example]

---

## [Evidence Pillar 3 Heading -- States the Sub-Claim] *(include if argument requires three pillars)*

[CLAIM SENTENCE -- opens the section]

[PARAGRAPH 1: Evidence of a DIFFERENT TYPE than Pillars 1 and 2]
[PARAGRAPH 2: Analysis connecting evidence to thesis]

---

## The Case Against [Author's Position] -- and Why It Falls Short

[COUNTERARGUMENT STATEMENT -- the strongest version the opponent would make]

[PARAGRAPH 1: State the opposing position fairly and completely. Do not caricature.]
[PARAGRAPH 2: Acknowledge what the counterargument gets right -- the valid core]
[PARAGRAPH 3: Identify the specific weak joint and explain precisely where and why it fails]

---

## [Conclusion Heading -- Conveys Stakes or Calls to Thought/Action]

[PARAGRAPH 1: Thesis restated at a higher level of confidence, with the full weight of the argument behind it]
[PARAGRAPH 2: Stakes -- what follows from continued rejection of the position]
[CLOSING SENTENCE: The most carefully written sentence in the piece. Short. Declarative. No hedge.]
```

**Length guidelines by context:**

| Publication Context | Target Word Count | Pillar Count | Counterargument Length |
|---|---|---|---|
| Trade publication op-ed | 800--1,000 words | 2 pillars | 1 paragraph |
| Newsletter / Substack essay | 1,200--2,000 words | 3 pillars | 2 paragraphs |
| Corporate thought leadership blog | 900--1,400 words | 2--3 pillars | 1--2 paragraphs |
| Internal memo / policy argument | 500--800 words | 2 pillars | 1 paragraph |
| Long-form magazine piece | 2,000--3,500 words | 3--4 pillars | 2--3 paragraphs |

---

## Rules

1. **NEVER hedge the thesis.** "I think," "It seems like," "One could argue," "It might be the case that," and "Many would say" all belong to a different genre. State the position as a fact the author is prepared to defend -- because that is what opinion writing is.

2. **NEVER open with a generalization or historical sweep.** "In today's fast-paced world," "Throughout history, humans have debated," "Technology is changing everything" -- these openings signal that the author is stalling before committing to a position. The hook must be specific: a date, a number, a named situation, a direct scene.

3. **NEVER open with a rhetorical question.** "Why do so many companies still use annual performance reviews?" sounds engaging but is actually a hedge -- the author is asking the reader to supply the urgency rather than delivering it. State the position; do not ask about it.

4. **NEVER build the counterargument around the weakest version of the opposing view.** If the counterargument section could be dismissed by an informed opponent as "that's not what we argue," the entire piece loses credibility. The counterargument must be the one a reasonable, knowledgeable opponent would actually make.

5. **NEVER end by retreating from the position.** "Ultimately it is up to each individual," "There are no easy answers," and "Only time will tell" are conclusion-killers. The piece committed to a position -- the conclusion must deliver on that commitment with maximum confidence, not dissolve it.

6. **NEVER use more than one exclamation point in the entire piece.** Emphasis through punctuation signals that the writing cannot carry the weight on its own. Let sentence structure and word choice create emphasis.

7. **ALWAYS ensure each evidence pillar uses a different evidence type.** Three statistics, three anecdotes, or three analogies in a row creates a monotonous argument that feels thin regardless of how good the individual evidence is. Mix: empirical data, case study, analogical reasoning, historical precedent, expert position, logical deduction.

8. **ALWAYS state the thesis within the first three sentences.** Not a hint of it. Not a framing of the question. The actual position, the author's actual claim. A reader who stops after three sentences should know exactly what the piece argues.

9. **ALWAYS make the counterargument section the steel-man version, then identify the specific weak joint.** The rebuttal should attack a precise logical flaw in the strongest version of the opposing argument -- not a simplified version created to be easy to defeat.

10. **ALWAYS make the final sentence of the piece the most carefully edited sentence.** It should be under 20 words, declarative, and free of qualifiers. It is the sentence the reader carries out of the piece. If the final sentence is generic, the entire argument fades.

11. **MATCH the intensity of the claim to the quality of the evidence.** Extraordinary claims require extraordinary support. If the author is making a strong, counterintuitive claim, the evidence must be correspondingly rigorous -- not one study from 2019 and a personal observation.

12. **DO NOT confuse the conclusion with a summary.** Summarizing the three pillars in the conclusion is a structural mistake that leaves the reader where they started rather than where the argument should have taken them. The conclusion should deliver a consequence of the argument, not a recap of it.

---

## Edge Cases

### The User Has a Position but No Evidence
Ask the user to explain their reasoning -- what experiences, observations, or logic led them to the position. Practitioner-based observation is valid evidence in opinion writing, but it must be stated as such ("In five years of managing distributed teams, I have seen this pattern consistently") rather than asserted as universal fact. If the user has neither evidence nor reasoning, do not proceed with the opinion piece format. Instead, help them either (a) research the topic until they can support the claim, or (b) reframe as a "question worth examining" essay that explores a problem without declaring a resolution -- and note explicitly that the `blog-post-writing` skill is more appropriate until they have evidence.

### The User Wants an Extremely Contrarian or Provocative Take
Contrarian pieces carry higher credibility risk because the burden of proof is reversed -- the author must not only support their claim but also explain why the mainstream view, which has presumably accumulated supporting evidence, is wrong. For these pieces: (a) expand the counterargument section to 2-3 paragraphs to demonstrate deep familiarity with the mainstream position; (b) identify precisely where the author's evidence differs from the consensus -- is it newer data, a different framing of the same data, or a different values weighting?; (c) avoid rhetorical contrarianism (arguing the opposite of consensus because it sounds interesting) and ensure the position is one the author can genuinely defend under challenge.

### The User Wants to "Argue Both Sides"
This is not an opinion piece. An op-ed that gives equal weight to two positions is a compare-and-contrast essay with no editorial function. Ask the user: "If you had to bet on one of these positions being closer to correct, which one?" Use their answer to write the opinion piece. If the user genuinely cannot choose, redirect to `blog-post-writing` with a balanced framing. Do not write a false-balance opinion piece -- it persuades no one and teaches nothing.

### The Topic Is Politically, Socially, or Ethically Sensitive
Do not soften the argument -- that would defeat the purpose. Instead: (a) distinguish between empirical claims (what is true) and values claims (what matters more) -- each requires different evidence; (b) ensure every empirical claim is grounded in verifiable data, and every values claim is explicitly labeled as a values position rather than an empirical one; (c) apply extra scrutiny to the counterargument section -- politically sensitive topics tend to have strong, well-developed opposing arguments that have been made by thoughtful people for a long time. Those arguments deserve more than one paragraph.

### The User Provides a Draft That Buries the Thesis
This is the most common structural problem in opinion writing. Authors frequently write toward their thesis rather than from it -- they present context, background, and evidence before stating what they actually think. Identify the thesis sentence (often in the second-to-last or last paragraph of the draft), move it to within the first three sentences of the piece, and then reconstruct the opening paragraph around it. The existing opening material is usually not wasted -- it typically functions better as a body section's context paragraph or as evidence rather than as an introduction.

### The User Needs a Specific Word Count That Does Not Match Standard Formats
Compress or expand the evidence architecture to fit: under 600 words, use one evidence pillar and one short counterargument paragraph, with the opening and closing doing more argumentative work; 600-900 words, use two pillars and one counterargument paragraph; 900-1,400 words, use two strong pillars and two counterargument paragraphs; 1,400+ words, add a third pillar or expand each section. Never cut the counterargument section to save space -- it is not optional. If space is critically constrained, cut from the evidence body sections rather than from the opening, counterargument, or closing.

### The User Wants to Write in Someone Else's Voice (Ghostwriting)
Request a writing sample of at least 300 words from the named author. Extract: (1) average sentence length, (2) frequency of first-person statements, (3) vocabulary register, (4) use of rhetorical questions (many or none?), (5) whether they tend to state or imply conclusions, and (6) characteristic transition patterns. Write to match these markers. Do not impose a generic "executive voice" or "thought leader voice" -- these are generic defaults that erase individual voice markers. The ghostwritten piece should be indistinguishable from something the named author produced themselves.

---

## Example

**Input:** "Write an opinion piece arguing that product managers should not own the product roadmap -- engineers should have more input and authority over what gets built. Audience: founders and CTOs at B2B software companies, 1,000-1,200 words, professional but direct tone."

**Output:**

---

# The Product Roadmap Belongs to the Engineers Who Build It

Last quarter, a senior engineer at a 200-person SaaS company spent six weeks building a feature he privately estimated had a 10% chance of being used by more than a handful of customers. He was right -- the feature launched, collected dust, and was quietly removed eight months later. The product manager who put it on the roadmap had moved on to the next initiative before the data came back. This is not a story about a bad product manager or a poor process. It is a story about what happens when the people who understand technical trade-offs are systematically excluded from the decisions that determine what gets built. The engineers who write the code should have meaningful authority over the roadmap, not just a seat at the sprint planning table.

## Engineers Are Closest to the Constraints That Determine What Is Possible

Every roadmap decision is actually two decisions: what to build and how long it will take. Product managers have been trained to own the first. But those two decisions are inseparable, and engineers are the only people in the building with direct access to the information that connects them.

When engineers are excluded from roadmap authority, technical debt accumulates quietly below the surface of the product. A product manager who owns the roadmap has structural incentives to deliver features -- that is how product performance is measured. An engineer who has authority over the roadmap has direct knowledge that three of the next six planned features are sitting on top of a data model that will fail at scale if it is not refactored first. Without roadmap authority, the engineer raises that concern in a planning meeting. With roadmap authority, the engineer can act on it.

A 2022 survey of 600 software teams by the firm Stripe found that engineers estimated they spent 42% of their time on maintenance work that was not reflected in the product roadmap. That means nearly half of engineering effort is invisible to the planning process. The people closest to that invisible work should have authority over the plan, not just input into it.

## Accountability Follows Authority -- or It Does Not Exist

Product managers who own the roadmap make decisions about what gets built. Engineers who do not own the roadmap are accountable for delivering those decisions on schedule and to quality standards. This arrangement creates an accountability asymmetry that corrodes team performance over time.

When a feature ships late, the postmortem almost always focuses on engineering execution. When a shipped feature fails to drive business outcomes, the retrospective is shorter and softer -- "we learned something, let's iterate." The result is an organizational signal that shipping on time is more important than shipping the right thing, because the consequences of the former are immediate and attributable while the consequences of the latter are diffuse and delayed.

Distributing roadmap authority to engineering does not eliminate accountability -- it realigns it. When an engineer has advocated for a particular feature, allocated team time to build it, and owns the outcome, they have skin in the game that a delivery-focused execution role does not create. Companies like Basecamp and Intercom have published extensively on what they call "shape up" and "dual-track" models, where engineering leads participate in scope decisions rather than receiving scoped work as deliverables. The common thread in those accounts is that engineers who share roadmap authority take a different posture toward product outcomes.

## The Case Against Engineer-Owned Roadmaps -- and Its Critical Flaw

The strongest objection to this argument is well-grounded: engineers optimize for technical elegance and underweight customer problems. Left to build whatever they find interesting, engineering-driven roadmaps produce impressively architected products that solve problems customers do not have. This critique has real historical basis -- the 1990s and early 2000s produced a generation of enterprise software that was technically sophisticated and deeply unusable, in part because customer feedback was filtered through developers who were more interested in the engineering challenges than the user needs.

This objection is correct about the failure mode. It is wrong about the remedy.

The solution to engineering teams that underweight customer problems is better customer exposure for engineers -- not permanently removing engineers from roadmap authority to create a dedicated class of customer-problem interpreters. Product managers were invented to solve an information gap: engineers were not talking to customers. In many modern software organizations, that gap no longer exists at the same scale. Engineers at growth-stage B2B companies sit in customer calls, review support tickets, and read NPS feedback directly. The information asymmetry that justified concentrating roadmap authority in product management has narrowed considerably.

The real flaw in PM-owned roadmaps is not that product managers are bad at understanding customers -- many are excellent at it. The flaw is that concentrating roadmap authority in a single role creates a single point of failure for one of the most consequential decisions a software company makes repeatedly. Distributing that authority does not mean engineers overrule product managers. It means both parties share the accountability for what gets built, which is the only arrangement that makes the decision legible to everyone who has to execute it.

## The Cost of Keeping the Current Arrangement

Every year that engineers execute roadmaps they had no authority to shape is a year of accumulated distance between the people who understand the product's technical reality and the people who decide its direction. That distance does not stay stable -- it grows. Technical debt that engineers could not put on the roadmap compounds. Features that engineers privately knew were wrong get built anyway, shipped, and eventually removed at twice the cost of not building them.

Founders and CTOs who defend PM-owned roadmaps often say they want engineers focused on building, not planning. But an engineer who is focused only on building, and not on what gets built, is not an engineer making good decisions -- they are a line worker executing instructions. The best engineers you have hired do not want that role, and the market for engineers who do want that role is increasingly aware of what it is worth.

Give the people who build the product meaningful authority over what gets built. Not advisory input. Not a vote in a planning meeting. Real authority, with the accountability that comes with it. The alternative is a product shaped by people who are one step removed from the code -- and a team of engineers who know it.
