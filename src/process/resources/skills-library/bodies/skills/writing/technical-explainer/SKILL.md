---
name: technical-explainer
description: |
  Making complex topics accessible to any audience. Covers analogy creation, layered explanation (ELI5 to expert), visual communication strategies, the Feynman technique, jargon translation, audience assessment, FAQ design, and explainer formats (video, article, infographic) for technical communication. Use when the user asks about technical explainer or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "technical-writing writing guide"
  category: "writing"
  subcategory: "business-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Technical Explainer

## When to Use


## Process

1. **Gather requirements.** Ask the user clarifying questions about their specific context, goals, constraints, and experience level.

2. **Analyze the situation.** Review the information provided and identify key factors, challenges, and opportunities relevant to technical explainer.

3. **Develop the framework.** Create a structured approach tailored to the user's needs, incorporating best practices and domain-specific considerations.

4. **Deliver actionable output.** Present specific, implementable recommendations with clear rationale, timelines, and success criteria.

5. **Address edge cases.** Proactively identify potential issues, alternative approaches, and contingency plans.

**Use this skill when:**
- User needs guidance on technical explainer
- User asks about technical explainer best practices or techniques
- User wants a structured approach to technical explainer

**Do NOT use this skill when:**
- A more specialized skill exists for the specific subtopic
- The request is outside the scope of technical explainer

## Questions to Ask First

Before explaining any technical topic, clarify:

1. **What is the topic?** (The specific concept, system, technology, or process to explain)
2. **Who is the audience?** (Complete beginner, informed layperson, adjacent expert, decision-maker, mixed)
3. **What is the audience's existing knowledge?** (What can I assume they already understand?)
4. **What is the purpose?** (Understanding, decision-making, implementation, teaching others, troubleshooting)
5. **What format will this be delivered in?** (Conversation, article, presentation, video, documentation, email)
6. **How much depth is needed?** (High-level overview, working understanding, deep technical detail)
7. **What misconceptions might they have?** (Common wrong mental models about this topic)
8. **What should they be able to do after the explanation?** (The success metric)

## The Feynman Technique

Richard Feynman's method for truly understanding and explaining anything:

```
STEP 1: CHOOSE THE CONCEPT
  Write the name of the concept at the top of a blank page.

STEP 2: EXPLAIN IT IN SIMPLE LANGUAGE
  Write an explanation as if teaching a 12-year-old.
  Use plain words. No jargon. Short sentences.

STEP 3: IDENTIFY GAPS
  When you get stuck or resort to jargon, you've found a gap
  in your own understanding. Go back and study that part.

STEP 4: SIMPLIFY AND USE ANALOGIES
  Rewrite your explanation, making it even simpler.
  Create analogies that connect to everyday experience.

STEP 5: REPEAT
  Keep cycling until you can explain the entire concept
  fluently in plain language.

THE FEYNMAN TEST:
  If you cannot explain something simply, you do not
  understand it well enough. Complexity in explanation
  often masks incomplete understanding.
```

## Layered Explanation Framework

### The Five Levels of Explanation

```
LEVEL 1: ELI5 (Explain Like I'm 5)
  - One core analogy or metaphor
  - Zero jargon
  - Focus on "what does it do" not "how does it work"
  - 2-3 sentences maximum

LEVEL 2: INFORMED LAYPERSON
  - Real terminology introduced with immediate definitions
  - Simple analogies with accurate boundaries
  - "Why it matters" context
  - 1-2 paragraphs

LEVEL 3: ADJACENT PROFESSIONAL
  - Technical terminology used normally
  - Comparison to concepts they already know
  - Architecture/structure explained
  - Key tradeoffs and design decisions
  - Several paragraphs with examples

LEVEL 4: PRACTITIONER
  - Full technical depth
  - Implementation details
  - Edge cases and caveats
  - Performance characteristics
  - References to documentation and specs

LEVEL 5: EXPERT
  - Cutting-edge nuances
  - Open problems and debates
  - Comparison of competing approaches
  - Mathematical/formal treatment where appropriate
  - Primary research references
```

### Layered Explanation Example: Blockchain

```
LEVEL 1 (ELI5):
  "Imagine a notebook that everyone in class has an exact copy of.
   When someone writes something new, everyone's notebook updates
   at the same time. Nobody can erase what was written because
   everyone would notice their copy is different."

LEVEL 2 (Informed Layperson):
  "A blockchain is a shared digital record that is stored across
   many computers simultaneously. When new information is added,
   it's grouped into a 'block' and linked to the previous block
   using a mathematical fingerprint. This chain of blocks creates
   a permanent, tamper-resistant history. Changing any past entry
   would require changing every copy on every computer -- making
   fraud essentially impossible."

LEVEL 3 (Adjacent Professional -- e.g., a software developer):
  "A blockchain is a distributed append-only data structure where
   each block contains a cryptographic hash of the previous block,
   a timestamp, and transaction data. Consensus mechanisms (Proof
   of Work, Proof of Stake) ensure all nodes agree on the current
   state. The key properties are immutability, transparency, and
   decentralization. The tradeoff is throughput: Bitcoin processes
   ~7 transactions/second vs. Visa's ~65,000."

LEVEL 4 (Practitioner):
  "The Merkle tree structure within each block enables efficient
   verification of transaction inclusion via O(log n) proof paths.
   Consensus varies significantly: PoW (Nakamoto consensus) offers
   probabilistic finality with 51% attack threshold; PoS validators
   stake collateral with slashing conditions; BFT variants provide
   deterministic finality with 2/3 honest node assumptions..."

LEVEL 5 (Expert):
  "Current research on sharding approaches (Ethereum's Danksharding
   roadmap) addresses the scalability trilemma through data availability
   sampling using KZG polynomial commitments..."
```

## Analogy Creation

### The BRIDGE Method

```
B - BASE: Identify the complex concept's key mechanism
R - RELATE: Find an everyday experience with a similar mechanism
I - ILLUSTRATE: Map specific elements from base to analogy
D - DIFFERENTIATE: Explicitly state where the analogy breaks down
G - GROUND: Connect back to the real concept
E - EXTEND: Use the analogy to explain additional aspects

EXAMPLE: Explaining an API

  BASE: An API allows software to request data/services from
        another software system using a defined protocol.

  RELATE: A restaurant menu.

  ILLUSTRATE:
    - The menu = API documentation (what you can order)
    - Your order = API request (specific data you want)
    - The kitchen = the server (does the actual work)
    - The waiter = the API itself (carries requests and responses)
    - Your meal = the API response (what you get back)
    - You don't enter the kitchen = abstraction (you don't see
      how the server processes your request)

  DIFFERENTIATE:
    "Unlike a restaurant, APIs can serve thousands of 'customers'
     simultaneously, and the 'menu' is defined in strict formats
     that machines can read."

  GROUND: "So when you hear 'API call,' think of it as placing
          a very specific order from a very organized restaurant."

  EXTEND: "Rate limiting? That's like the restaurant saying
          'maximum 10 orders per customer per hour' to prevent
          one person from overwhelming the kitchen."
```

### Analogy Quality Checklist

```
A GOOD ANALOGY:
  [ ] Uses something the audience already understands
  [ ] Maps the KEY mechanism correctly (not surface similarity)
  [ ] Is simple enough to hold in working memory
  [ ] Has clearly stated limitations
  [ ] Can extend to explain related concepts
  [ ] Does not introduce new confusion

A BAD ANALOGY:
  [x] Requires explanation itself
  [x] Maps incorrectly (misleading mental model)
  [x] Is taken too far (breaks down on important points)
  [x] Uses another technical concept as the base
  [x] Is culturally specific in a cross-cultural context

ANALOGY BANK -- COMMON TECHNICAL CONCEPTS:
  Encryption:     A lock and key (symmetric) or a mailbox with
                  a slot anyone can drop into but only key holder
                  can open (asymmetric/public key)
  Cache:          A sticky note on your desk (vs. filing cabinet
                  in the basement)
  Load Balancer:  A host at a restaurant directing diners to
                  available tables
  DNS:            A phone book for the internet
  Recursion:      Russian nesting dolls, or looking up a word in
                  a dictionary and the definition uses another word
                  you need to look up
  Machine Learning: Teaching a child to recognize dogs by showing
                    thousands of photos, not by describing rules
  Latency:       The time between ordering and receiving your food,
                  not how much food you can get per hour (that's throughput)
  Version Control: Track changes in a document, but for code, with
                   the ability to branch into parallel versions
```

## Jargon Translation

### The Jargon Decision Framework

```
WHEN TO USE JARGON:
  - The audience knows the term and expects it
  - The term is more precise than any plain alternative
  - You are building the audience's vocabulary intentionally
  - The term will appear in their work and they need to know it

WHEN TO AVOID JARGON:
  - The audience doesn't know the term
  - A plain equivalent exists without loss of meaning
  - You're trying to sound impressive rather than communicate
  - The jargon creates an in-group/out-group dynamic

WHEN TO TRANSLATE JARGON:
  - Mixed audience (define on first use)
  - The term is necessary but new to the audience
  - Building a shared vocabulary for collaboration

TRANSLATION FORMAT:
  "[Jargon term] -- which means [plain definition] --"

  Example: "We use idempotent operations -- meaning you can
  run them multiple times and get the same result, like
  pressing an elevator button that's already lit."
```

### Jargon Translation Table Template

```
Create this for any technical domain:

| Jargon          | Plain English              | Analogy                    |
|-----------------|---------------------------|----------------------------|
| Latency         | Delay/wait time            | Time to get your order     |
| Throughput      | How much flows per second  | Cars per hour on highway   |
| Scalability     | Can it handle more load    | Can the restaurant add     |
|                 |                           | tables at rush hour?       |
| Technical debt  | Shortcuts that need fixing | Dishes piling up because   |
|                 | later                     | you were in a rush         |
| Regression      | Something that used to     | A fixed pothole that opens |
|                 | work broke again          | up again                   |
| Refactoring     | Reorganizing without       | Reorganizing your closet   |
|                 | changing what it does     | without buying new clothes |
```

## Audience Assessment

### The PARK Framework

```
P - PRIOR KNOWLEDGE: What do they already know?
    Ask: "How familiar are you with X?" or observe their questions
    Listen for: terminology they use, concepts they reference

A - ATTITUDE: How do they feel about this topic?
    Enthusiastic? Anxious? Skeptical? Mandated to be here?
    Adjust: Enthusiastic audiences want depth; anxious ones
    need reassurance; skeptical ones need evidence

R - REASON: Why do they need to understand this?
    Decide something? Build something? Troubleshoot?
    Approve budget? Teach others?
    Adjust: Decision-makers need implications, not implementation

K - KNOWLEDGE GAPS: What specific misunderstandings exist?
    Common misconceptions? Wrong mental models?
    Address: Name and correct misconceptions directly
    "You might think X. That's actually not quite right because..."
```

### Explaining to Different Audiences

```
TO EXECUTIVES / DECISION-MAKERS:
  - Lead with business impact, not technical details
  - Use the "So what?" framework for every point
  - Provide options with tradeoffs, not just recommendations
  - Quantify: time, money, risk, opportunity
  - One page maximum for written communication
  - "This means we can ship 3x faster at half the infrastructure cost"

TO NON-TECHNICAL TEAM MEMBERS:
  - Start with what it does for them specifically
  - Use analogies from their domain
  - Focus on inputs and outputs, not internal mechanisms
  - Provide clear next steps that are relevant to their role
  - "When you click 'publish,' the system now automatically..."

TO TECHNICAL PEERS IN A DIFFERENT DOMAIN:
  - Find shared vocabulary (both domains use "architecture," "testing")
  - Map concepts to their domain equivalents
  - Acknowledge what's different about your domain
  - Provide resources for deeper exploration
  - "It's similar to how you use X in [their field], except..."

TO COMPLETE BEGINNERS:
  - Start with why they should care
  - One concept at a time with confirmation of understanding
  - Build from familiar to unfamiliar
  - Use stories and examples before abstractions
  - Check understanding: "Does that make sense so far?"
```

## Visual Communication

### When to Visualize

```
VISUALIZE WHEN:
  - The concept involves spatial relationships
  - There are processes with steps or flows
  - Comparisons between multiple items exist
  - Data patterns are easier seen than described
  - The relationship between parts matters
  - The audience thinks visually

VISUALIZATION TYPES AND WHEN TO USE THEM:
  Flowchart:      Processes, decision trees, workflows
  Diagram:        System architecture, relationships, structure
  Timeline:       Sequential events, project phases, history
  Comparison:     Tables, side-by-side, before/after
  Hierarchy:      Org charts, taxonomy, classification
  Venn diagram:   Overlap and distinction between concepts
  Infographic:    Data-rich overviews for general audiences
  Animation:      Processes that change over time
  Screenshot:     Specific UI or interface references
```

### Visual Explanation Principles

```
1. ONE IDEA PER VISUAL
   Don't overload a single diagram with every aspect

2. PROGRESSIVE DISCLOSURE
   Start with the simple version, add complexity layer by layer
   Slide 1: Three boxes connected by arrows
   Slide 2: Same diagram with details inside each box
   Slide 3: Same diagram with edge cases and exceptions

3. CONSISTENT VISUAL LANGUAGE
   - Same color = same type of thing
   - Same shape = same category
   - Left-to-right or top-to-bottom = time/process flow
   - Size = importance or magnitude

4. ANNOTATE, DON'T ASSUME
   Label everything. Add callouts for important parts.
   Guide the eye with numbers, arrows, or highlights.

5. USE BEFORE/AFTER
   For transformations, show the old state and new state
   side by side. The contrast creates understanding.
```

## FAQ Design

### The Effective FAQ Process

```
STEP 1: COLLECT REAL QUESTIONS
  Sources: support tickets, user interviews, search queries,
  sales team feedback, community forums, onboarding calls

  Do NOT guess what people ask. Use real data.

STEP 2: GROUP AND PRIORITIZE
  - Sort by frequency (most asked first)
  - Group by theme (getting started, troubleshooting, billing)
  - Identify which questions indicate confusion vs. feature requests

STEP 3: WRITE ANSWERS USING THE AIDA STRUCTURE
  A - Acknowledge the question directly
  I - Inform with the clear answer first (don't bury the lead)
  D - Detail the explanation if needed
  A - Action: tell them what to do next

EXAMPLE:
  Q: "Can I use the free plan for commercial projects?"
  A: "Yes, the free plan can be used for commercial projects.
      There are no restrictions on commercial use at any plan
      level. The paid plans add [features], but commercial use
      is included in all plans. To get started, [action]."

STEP 4: STRUCTURE FOR SCANNABILITY
  - Use clear categories with descriptive headings
  - Put the most common questions first in each category
  - Use expandable/collapsible format for long FAQs
  - Include a search function for 20+ questions
  - Link to detailed documentation where appropriate
```

## Explainer Formats

### Written Article/Blog Post

```
STRUCTURE:
  1. Hook: Why should the reader care? (1-2 sentences)
  2. Context: Who is this for and what will they learn? (1 paragraph)
  3. Foundation: Establish necessary background (if needed)
  4. Core explanation: The main concept, broken into sections
  5. Practical application: How to use this knowledge
  6. Summary: Key takeaways in bullet points
  7. Next steps: Where to learn more or what to do next

WRITING PRINCIPLES:
  - Short paragraphs (3-4 sentences max)
  - One idea per paragraph
  - Active voice: "The system processes the request" not
    "The request is processed by the system"
  - Concrete examples for every abstract concept
  - Subheadings every 200-300 words
  - Use formatting (bold, bullets, code blocks) for scannability
```

### Explainer Video Script

```
STRUCTURE (3-5 minute explainer):
  0:00 - Hook (10 seconds): Surprising fact or relatable problem
  0:10 - Setup (20 seconds): What we're explaining and why
  0:30 - Foundation (60 seconds): Essential background
  1:30 - Core concept (90 seconds): The main explanation
  3:00 - Example (45 seconds): Concrete application
  3:45 - Recap (15 seconds): Key takeaways
  4:00 - CTA (10 seconds): What to do next

SCRIPT PRINCIPLES:
  - Write for the ear, not the eye (read aloud while writing)
  - Shorter sentences than written content
  - Signpost transitions: "Now that we understand X, let's look at Y"
  - Pair narration with visuals (don't show what you're saying;
    show what complements what you're saying)
  - Pace: 130-150 words per minute for narration
```

### Infographic

```
DESIGN PRINCIPLES:
  - One core message supported by 3-5 data points
  - Visual hierarchy: most important information largest/top
  - Consistent color palette (max 3-4 colors)
  - Minimal text: let visuals carry the weight
  - Left-to-right or top-to-bottom flow
  - Include source citations for all data
  - Mobile-friendly dimensions if digital

CONTENT FLOW:
  1. Title: Clear, specific, intriguing
  2. Introduction: 1-2 sentences of context
  3. Data sections: 3-5 key points with visualizations
  4. Conclusion: The main takeaway
  5. Sources and attribution
```

## Practice Exercises

### Exercise 1: The Five-Level Challenge
Pick a concept from your field. Write explanations at all 5 levels (ELI5 through Expert). Share each version with someone at that level and get feedback.

### Exercise 2: Analogy Workshop
Take 5 technical concepts and create 2 different analogies for each. Test them with non-technical people. Which ones create "aha" moments?

### Exercise 3: Jargon Purge
Take a technical document you've written. Highlight every piece of jargon. Rewrite the document with zero jargon, then add back only the terms that are truly necessary, with definitions.

### Exercise 4: Teach-Back Test
Explain a concept to someone, then ask them to explain it back to you in their own words. The gaps between your explanation and their understanding reveal where your explanation needs work.

### Exercise 5: Format Translation
Take the same technical concept and create three versions: a 200-word written explanation, a 1-minute video script outline, and a sketch of an infographic layout.


## Output Format

Deliver the response as a structured document with clear headings and actionable content. Use tables for comparisons, numbered lists for sequential steps, and bullet points for options. Include specific examples where applicable.

```
[Technical Explainer deliverable]
1. Context and objectives
2. Analysis or framework
3. Specific recommendations with rationale
4. Action items with timeline
```


## Example

**Input:** "Help me with technical explainer for a mid-size project."

**Output:** A complete technical explainer framework tailored to the specific context, with actionable steps, relevant considerations, and measurable outcomes.


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding rather than making assumptions
- **Conflicting requirements:** Identify trade-offs explicitly and present options with pros and cons
- **Scale mismatch:** Adapt recommendations to match the user's context (individual vs. team vs. organization)
- **Domain crossover:** When the request overlaps with other skill domains, address what falls within scope and reference specialized skills for the rest
