---
name: feynman-technique
description: |
  Applies the Feynman technique to help learners explain complex concepts in simple language, identify knowledge gaps, and refine understanding through iterative simplification. Produces a simple-language explanation with analogy, then an expert revision.
  Use when a learner asks to explain a concept simply, use the Feynman technique, test their understanding by teaching, or simplify complex material.
  Do NOT use for general concept explanation (the learner should do the explaining, not the AI), for flashcard creation (use `flashcard-generation`), or for note taking (use `cornell-notes`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "study-skills active-recall step-by-step teaching"
  category: "education"
  subcategory: "self-learning"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Feynman Technique

## When to Use

Use this skill when any of the following triggers apply:

- The learner explicitly asks to "use the Feynman technique," "teach back" a concept, or "explain it simply" as a study exercise
- A student has studied material and wants to test whether they actually understand it versus recognizing it from repeated reading
- A learner is preparing for an exam that requires explanation, application, or transfer of concepts -- not just recall of definitions
- A user is stuck on a concept and has re-read the source material multiple times without breakthrough understanding
- A learner wants to find out exactly where their understanding breaks down before investing more study time
- Someone explicitly asks you to "play student" while they explain a concept, and correct their gaps
- A learner wants to build an analogy for a complex topic to make it memorable or communicable to others

**Do NOT use when:**
- The user wants a concept explained TO them without doing any explaining themselves -- that is a general explanation request, not this skill. The learner must do the work of explaining; the AI coaches and corrects.
- The user wants flashcard sets for key terms -- use `flashcard-generation` instead, which is purpose-built for encoding discrete facts
- The user wants structured note-taking from a lecture or reading -- use `cornell-notes` for that workflow
- The user wants exam-style practice questions -- use `exam-practice`, which tests retrieval under simulated exam conditions
- The content is purely procedural and motor-skill-dependent (surgical technique, musical performance) -- Feynman works for understanding mechanisms, not physical execution
- The user is an educator designing a lesson for others -- the technique is for the learner's self-assessment, not curriculum design; check teaching subcategory skills
- The user wants a study schedule or a plan for covering a large body of material -- use a study-planning skill, then return to Feynman for individual concepts

---

## Process

### Step 1: Orient the Learner and Gather Precise Context

Before generating anything, collect the information you need to make this useful rather than generic.

- Ask for the **specific concept** (not just a subject area): "classical conditioning" not "psychology," "the Black-Scholes pricing model" not "finance"
- Ask for the **source material** -- the learner's own notes, a textbook chapter, a lecture recording transcript. You cannot apply the technique to nothing. If they have no source material, stop and direct them to gather it first.
- Ask for the learner's **current knowledge level** in plain terms: "I just read the chapter once," "I've seen this in class three times but can't explain it," or "I studied this last semester"
- Ask for **purpose**: exam in 48 hours, deep understanding for a project, teaching someone else, integrating with related material
- Ask **what they already understand** and **where they feel it breaks down** -- this seeds the gap-detection phase later

If the learner says they want to go through the technique interactively (they explain, you correct), switch to the interactive mode described in Step 3B. If they want a document to study from, proceed to Step 3A.

### Step 2: Explain the Technique Briefly If the Learner Is Unfamiliar

If there is any sign the learner does not know what the Feynman technique is, give a crisp, functional explanation in exactly three sentences before proceeding -- do not lecture:

> "The Feynman technique works by forcing you to explain a concept in the simplest possible language, then using every point where your explanation breaks down as a map of what you don't yet understand. You then return to source material to fill only those gaps, then re-explain with cleaner language and an analogy. The technique's power is that it bypasses the illusion of knowing -- where re-reading something feels like understanding but produces no real recall."

Then proceed without further preamble.

### Step 3A: Generate the Feynman Document (Document Mode)

When the learner wants a structured study artifact, build it in the following sequence:

- **Write the concept name at the top** -- this is Feynman's own first instruction. Naming it precisely forces scope.
- **Draft the simple-language explanation**: explain the concept as if the audience is a curious 12-year-old with no background in the field. Specific constraints: no undefined jargon, no circular definitions, no skipped steps in any process, every term explained by what it does or what it is made of, not what it is called.
- **Flag knowledge gaps explicitly**: use a consistent marker (★ or [GAP]) for any point in the explanation that relies on jargon without definition, skips a logical step, or uses hedging language ("basically," "in a sense," "kind of like"). Name what the gap is, not just that one exists.
- **Fill the gaps from source material**: for each flagged gap, provide the filled-in explanation with appropriate depth. Make the gap-and-fill visible as a teaching mechanism -- do not silently absorb the gap into a rewrite.
- **Build the analogy using the structural mapping framework** (see Rules): the analogy must map a structural relationship, not just a surface similarity. Check that it holds across at least three structural features of the target concept.
- **Write the refined expert explanation**: this is NOT just the simple explanation with jargon added back. It is the simple explanation elevated -- concepts are named using their actual technical terms now, but each term is defined inline by its function or mechanism.

### Step 3B: Interactive Coaching Mode

When the learner wants to explain and be coached:

- Ask the learner to explain the concept in their own words without referring to their notes
- Read their explanation carefully. Do not immediately correct -- first identify every place where: a term is used but not defined, a step is skipped, an analogy breaks down, or the explanation would confuse a non-expert
- Ask targeted Socratic questions for each gap. Do not give the answer -- ask: "You mentioned neurons 'fire' -- what is actually happening physically when that happens?" or "You said the pH drops -- what is releasing the hydrogen ions?"
- Only after the learner attempts an answer, confirm, redirect, or provide the explanation
- After all gaps are addressed, ask the learner to give the full explanation again from scratch without notes -- this is the test. The re-explanation should be noticeably more fluent.
- Rate the re-explanation on gap density: 0 gaps = strong understanding, 1-2 gaps = targeted review needed, 3+ gaps = the concept needs another full pass

### Step 4: Analogy Construction

Analogy is not decoration -- it is load-bearing for retention. Build the analogy systematically:

- Identify the **core structural relationships** in the concept: what causes what, what constrains what, what flows into what
- Find a domain that has the same structural relationships in a familiar context
- Test the analogy by checking at least 3 structural mappings explicitly. If a mapping breaks down, note exactly where and why -- partial analogies taught without acknowledging breakdowns create misconceptions
- Avoid analogies the learner's own source material already uses -- they have already processed that one
- For mathematical or quantitative concepts, use a concrete numerical scenario, not just a word analogy

### Step 5: Gap Detection Review

Before presenting the output, review the simple-language explanation against the Gap Detection Signals (see Rules). Specifically:

- Count how many times hedging language ("basically," "essentially," "in a way") appears -- each instance is a candidate gap
- Check that every process is explained as a sequence of steps with causes between them, not just outcomes
- Verify that no term appears undefined at its first use
- Check that the analogy covers the mechanism, not just the outcome ("osmosis is like water trying to balance itself" covers the outcome but not the mechanism of concentration gradient)

### Step 6: Build the Self-Check and Spaced Repetition Plan

Self-check questions must be **generative**, not recognition-based:

- "List the four stages in sequence without looking" tests recall
- "Explain why extinction is not the same as forgetting" tests conceptual depth
- "Create a novel example of generalization that is not the one in your notes" tests transfer -- this is the highest-level check and the most diagnostic

Spaced repetition timing for Feynman-processed material follows the standard forgetting curve intervals: review at 1 day, 3 days, 7 days, 14 days, and 30 days. Feynman sessions are best scheduled at the Day 7 and Day 30 checkpoints, where understanding (not just recall) should be re-tested. Flag this explicitly.

### Step 7: Recommend Complementary Techniques

The Feynman technique diagnoses and builds understanding -- it does not by itself build retrieval speed, procedural fluency, or long-term retention. Always recommend at minimum:

- **Active recall / flashcards** (`flashcard-generation`) for the key terms and facts surfaced during the Feynman session
- **Practice problems** if the concept has mathematical, analytical, or procedural application
- **Concept mapping** for topics with many interacting components -- after Feynman clarifies each component, a map shows how they fit together
- Name the specific follow-on technique, not just "more studying"

### Step 8: Confirm Completeness and Offer Follow-Up

After delivering the artifact:

- Ask: "Does any section feel like it glossed over something you were confused about?" -- this reopens the gap-filling loop
- Offer to run the interactive coaching version so the learner can test themselves out loud (or in text) against the document they now have
- If the topic has multiple components (e.g., a chapter with six sub-topics), confirm whether to run separate Feynman sessions for each or treat the whole as one -- for anything over 4-5 linked concepts, separate sessions produce better results

---

## Output Format

```
## Feynman Technique: [Exact Concept Name]

**Subject:** [Field -- e.g., Organic Chemistry, Macroeconomics, Constitutional Law]
**Topic:** [Specific concept -- narrow enough to explain in a single session]
**Source Material:** [Learner's notes / textbook chapter / lecture content identified]
**Knowledge Level at Start:** [Learner's self-reported level]
**Purpose:** [Exam prep / deep understanding / teaching someone else / integration]

---

### Step 1 -- Simple-Language Explanation
*(Written as if explaining to a curious 12-year-old with no background in this field)*

[Full explanation in plain language. Complete sentences, no undefined terms, no skipped steps.
Each time a gap was detected during drafting, it appears inline as:]

★ GAP: [Name of gap] -- [Why this point could not be explained without returning to source material]
★ FILLED: [The explanation that fills the gap, in plain language]

---

### Step 2 -- Analogy

**Analogy:** [Familiar domain that maps onto the concept]

**Structural Mappings:**
| Target Concept Element | Analogy Element | How the Mapping Holds |
|------------------------|-----------------|----------------------|
| [Element 1]            | [Mapped item 1] | [Explanation]        |
| [Element 2]            | [Mapped item 2] | [Explanation]        |
| [Element 3]            | [Mapped item 3] | [Explanation]        |

**Where the analogy breaks down:** [Every analogy has a limit -- name it explicitly]

---

### Step 3 -- Refined Expert Explanation
*(Technical language reintroduced, but each term is defined by its function or mechanism inline)*

[Full expert-level explanation. This should be a natural evolution of the simple explanation --
the same logical flow, now with correct terminology defined at first use in parentheses.
No term should appear that was not first earned through the simple explanation.]

---

### Knowledge Gap Summary

| Gap ID | Gap Description | Source Used to Fill | Confidence After Filling |
|--------|----------------|---------------------|--------------------------|
| ★1     | [Description]  | [Section/page]      | High / Medium / Low      |
| ★2     | [Description]  | [Section/page]      | High / Medium / Low      |

---

### Self-Check Questions

**Level 1 -- Recall (Can you retrieve it?)**
- [Question requiring unaided recall of a key sequence, definition, or fact]
- [Second recall question]

**Level 2 -- Conceptual Depth (Do you understand it?)**
- [Question requiring explanation of a distinction, mechanism, or cause-effect relationship]
- [Second conceptual question]

**Level 3 -- Transfer (Can you apply it to something new?)**
- [Question asking the learner to create a novel example, apply to an unfamiliar case, or explain a scenario not in the source material]

---

### Review Schedule (Spaced Repetition)

| Review | Days From Now | What to Test |
|--------|--------------|--------------|
| 1st    | 1 day        | Recall key terms and sequence unaided |
| 2nd    | 3 days       | Re-explain the concept aloud without notes |
| 3rd ★  | 7 days       | Full Feynman re-test: explain it simply, check for gaps |
| 4th    | 14 days      | Answer Level 2 and 3 self-check questions cold |
| 5th ★  | 30 days      | Full Feynman re-test: explanation should require no gap-filling |

★ = Schedule a full Feynman session at this interval

---

### Next Steps

**Complementary techniques for this material:**
1. [Specific technique + what to do with it + skill reference if applicable]
2. [Second technique]

**Connection to other topics:** [How this concept links to related material the learner has studied or will study]
```

---

## Rules

1. **The learner must do the explaining -- the AI coaches, corrects, and structures, but never replaces the learner's effort.** If asked to "just explain it," redirect: "I can coach you through the Feynman technique for this, but the explanation should come from you. Tell me what you understand so far and I'll identify the gaps."

2. **Never use undefined jargon in the simple-language explanation, not even once.** If the correct technical term must appear, put the plain-language definition in parentheses immediately after. "The mitochondria (the organelle that converts glucose and oxygen into usable cell energy)" not "the powerhouse of the cell."

3. **Do not silently smooth over gaps.** If the source material does not explain something clearly enough to fill a gap, say so explicitly: "The source material defines X as Y but does not explain the mechanism -- this is an open gap and should be flagged for targeted review." Hiding gaps defeats the entire technique.

4. **Never produce the document before receiving source material.** The technique requires the learner's actual content. A Feynman document built from generic knowledge about a topic trains the AI's knowledge, not the learner's understanding. Ask for notes, slides, textbook chapter, or lecture content before proceeding.

5. **The analogy must be tested against at least three structural mappings -- not one.** A single-point analogy ("it's like a key and a lock") is almost always incomplete and often creates misconceptions at exactly the edges it fails to cover. Map three structural features and name where the analogy breaks down.

6. **Gap Detection Signal List -- flag any of these as probable gaps:**
   - Hedging words: "basically," "essentially," "kind of," "in a way," "you could say"
   - Circular definitions: "X is when X-ness occurs" or defining a term using the same root word
   - Skipped steps in a process: jumping from A to C without explaining B
   - Outcome-only descriptions: saying what happens without saying why or how
   - Cannot give a novel example: the learner can only cite the textbook example, never a new one
   - Passive voice masking agency: "glucose is converted" -- by what? using what? under what conditions?

7. **Self-check questions must include at least one Level 3 transfer question.** Questions that only require recall or recognition test familiarity, not understanding. Transfer questions -- create a new example, diagnose a scenario, apply to an unfamiliar case -- are the only honest test of whether the Feynman technique worked.

8. **Spaced repetition timing must be explicit and dated, not approximate.** "Review in about a week" is not actionable. The schedule must give specific day counts from the session date: Day 1, Day 3, Day 7, Day 14, Day 30. Mark Day 7 and Day 30 as full Feynman re-test sessions.

9. **The refined expert explanation is not a jargon restoration of the simple explanation -- it is an integration.** The learner should be able to read the simple and expert versions side by side and see the same logical structure with increasing precision. If the expert version introduces concepts or steps not present in the simple version, those are gaps that were skipped.

10. **For topics with more than 4-5 interacting components, insist on scoping down before proceeding.** A Feynman document covering "the entire immune system" or "all of classical mechanics" will be shallow across the board. Better to do three tight Feynman sessions on specific mechanisms than one sprawling session that never identifies a single real gap. Ask: "Which specific aspect do you want to start with?"

---

## Edge Cases

### The Learner Wants the AI to Explain, Not Be Coached

This is the most common misuse. The learner says: "Can you use the Feynman technique to explain quantum entanglement to me?"

**Handling:** The Feynman technique is a self-learning tool for the learner, not a presentation style for the AI. Redirect: "The Feynman technique works by having you explain it -- that's where the learning happens. Tell me what you understand about quantum entanglement so far, even if it's very rough, and I'll help you find the gaps and build a complete explanation." If they push back, offer the document mode as a scaffold: "I can build a Feynman document for this topic using a source you provide, so you have a model to study and then try explaining yourself."

### Source Material Is Too Thin or Generic

The learner provides only a Wikipedia-level summary or says "I know it's about X" without actual notes.

**Handling:** Do not proceed with a Feynman document based on general knowledge. Say: "For the Feynman technique to map your understanding rather than mine, I need your actual study material -- your notes, the textbook section, or even a paste of the key paragraphs you're working from. Do you have that available?" If they genuinely have nothing and are starting from zero, redirect to having them first study the source material and return.

### The Learner's Own Explanation Is Largely Correct But Slightly Wrong in a Critical Way

In interactive mode, the learner explains something that is 90% accurate but has one conceptual error that would propagate into major misunderstandings later (for example, describing natural selection as "animals trying to adapt" rather than differential reproductive success).

**Handling:** Do not let a subtle error pass because the overall explanation was strong. Flag it precisely and at the right level: "Your explanation of the mechanism is mostly right, but one phrase is doing something important -- you said organisms 'try to adapt.' That implies intention. What is actually happening at the population level that produces adaptation without any individual trying?" Correct the misconception explicitly before moving on, and note it in the Gap Summary even if the learner fills it correctly on the second attempt.

### The Topic Is Heavily Mathematical

The learner wants to apply Feynman to a quantitative topic like Bayes' theorem, integration by parts, or the Capital Asset Pricing Model.

**Handling:** Feynman applies to mathematics at the conceptual level -- what the formula means, why it has the structure it does, what each term represents physically or logically -- not the mechanical execution of computation. Split the session explicitly: first a Feynman explanation of the concept and the meaning of the formula's structure, then a separate recommendation to do worked examples (practice problems skill) for procedural fluency. For example: "Before explaining Bayes' theorem, tell me in plain words what the theorem is trying to calculate -- what problem does it solve?" This separates understanding from calculation.

### The Learner Has Studied a Concept in a Second Language

The learner studied organic chemistry in German and is now preparing for an English-language exam, or vice versa.

**Handling:** Allow the learner to draft the Feynman explanation in whichever language produces the clearest thinking -- the goal is revealing gaps in conceptual understanding, not testing linguistic fluency. Note in the document header which language was used and flag any terms that may not transfer cleanly between languages (German "Bindungsenergie" and English "bond energy" are the same concept; some terms have no direct equivalent). The refined expert explanation should appear in the target exam language with glossary mappings if needed.

### The Concept Has Multiple Competing Definitions or Models

Some concepts are genuinely contested or have multiple valid frameworks -- the definition of "species," the interpretation of quantum mechanics, different macroeconomic schools of thought on inflation.

**Handling:** The Feynman technique must be anchored to a specific framework for the session to be coherent. Name the framework at the top of the document: "This Feynman session uses the biological species concept (reproductive isolation) -- not the phylogenetic or morphological species concept." Note the alternative definitions exist and are legitimate, but explicitly defer them: "There are competing definitions -- your exam or course likely specifies which one to use, so confirm with your syllabus."

### The Learner Is a Subject-Matter Expert Trying to Communicate to Non-Experts

An engineer, researcher, or clinician wants to use the Feynman technique not to learn but to prepare a communication -- an explainer, a presentation, a patient conversation.

**Handling:** This is a legitimate use case but flips the technique's purpose. Here the "gap" is not missing knowledge but missing bridges between expert vocabulary and the audience's vocabulary. Run the technique with the audience explicitly in mind: "Who is the 12-year-old in your case -- a patient? a policymaker? a first-year student?" Build the analogy specifically for that audience's existing knowledge base. The self-check becomes: "Would your target audience have any follow-up questions after this explanation?" If yes, those are the gaps to fill.

### The Feynman Session Reveals a Deep Foundational Gap

During gap-filling, it becomes clear that the learner is missing a prerequisite concept that the current topic depends on -- they cannot understand enzyme kinetics because they do not understand what a catalyst is, or they cannot explain compound interest because they do not understand what an exponent represents.

**Handling:** Stop the current Feynman session and name the prerequisite explicitly. Do not try to fill the foundational gap inside the current session -- that produces a document that skips the real work. Say: "Your explanation of [current concept] is hitting a wall at [foundational concept] -- that's actually the more fundamental thing to understand first. I'd recommend doing a separate Feynman session on [prerequisite] before returning to this one. Should we start there?" Document the prerequisite gap in the Gap Summary so it is not lost.

---

## Example

**Input:** "I need to apply the Feynman technique to the Black-Scholes option pricing model. I'm a finance student who just read the chapter but can't explain why the formula looks the way it does or what each term is actually doing. I have an exam in five days."

**Output:**

---

## Feynman Technique: The Black-Scholes Option Pricing Model

**Subject:** Financial Economics / Derivatives
**Topic:** Black-Scholes model -- conceptual structure and meaning of each term
**Source Material:** Finance textbook chapter on options pricing (learner-provided)
**Knowledge Level at Start:** "Read the chapter once, cannot explain the formula's structure"
**Purpose:** Exam in 5 days -- conceptual understanding of why the model works, not just computation

---

### Step 1 -- Simple-Language Explanation

*(Written as if explaining to a curious 12-year-old who understands what a bet is but has never heard of an options contract)*

Imagine you want to buy the right -- but not the obligation -- to buy a concert ticket for $50, even if its price goes up before the show. You are not buying the ticket now; you are buying the *option* to buy it at $50 later. That right is worth something, and the question is: how much should you pay for it today?

That is the exact problem Black-Scholes solves. It calculates the fair price of an option today, given what you know about the asset it covers.

The formula needs five pieces of information:

**1. The current price of the asset (S)**
This is simply what the thing you might buy is worth right now. If the stock is trading at $100 today, S = 100.

**2. The strike price (K)**
This is the price you have locked in for the future -- the price you would pay when you exercise the option. If you locked in $95, K = 95.

**3. Time until expiration (T)**
How long does this option last? Measured in years -- so six months is T = 0.5. More time means more opportunity for the price to move in your favor, so options with more time are worth more.

**4. Volatility (σ -- sigma)**
★ GAP: Volatility -- the textbook defines it as "standard deviation of returns" but that description does not explain what it means for option value.
★ FILLED: Volatility measures how wildly a stock's price jumps around day to day. A stock that moves 1% per day is low-volatility; one that swings 5% per day is high-volatility. For an option buyer, volatility is good: if the price can swing a lot, there is a real chance it swings far in your favor. You can only lose what you paid for the option, but the upside is unlimited. So high-volatility stocks have more expensive options.

**5. Risk-free interest rate (r)**
This is the return you could get by putting money in a completely safe investment (like a government bond) instead of buying the option. It matters because money you hold today is worth more than money you receive in the future -- this is called the time value of money.

Now for the formula itself. Black-Scholes says the option price (C) is:

C = S × N(d1) -- K × e^(--rT) × N(d2)

Scary-looking, but every piece has a job:

**S × N(d1)**: The current stock price multiplied by a probability-weighted factor. Think of N(d1) as an adjusted probability that you will actually want to exercise the option -- it tells you how much of the current stock price you are effectively "claiming" by owning the option.

★ GAP: What d1 and d2 actually calculate -- the textbook gives the formula for d1 but not an intuition for what it represents.
★ FILLED: d1 and d2 are the formula's way of asking: "Given the current price, the strike, the time, and the volatility, how far in the money are we likely to end up?" They combine all five inputs into a single number that can be converted to a probability using a standard probability table (N(x) looks up that number in the bell curve). d1 and d2 differ by a small adjustment -- d1 accounts for holding the stock itself, d2 accounts for paying the strike price. The gap between them is exactly the volatility scaled by time.

**K × e^(--rT)**: The strike price you will pay in the future, discounted back to what it is worth in today's money. You are not paying K today -- you are paying it in T years. e^(--rT) shrinks K back to its present value. This is the "you don't pay until later, so it's worth a bit less now" adjustment.

**N(d2)**: The risk-adjusted probability that the option ends up "in the money" -- meaning the stock price at expiration will actually be above the strike price, making it worth exercising.

So in plain terms: the option's value equals *what you expect to receive* (the probability-weighted claim on the stock) minus *what you expect to pay* (the present value of the strike price, weighted by the probability you actually pay it).

---

### Step 2 -- Analogy

**Analogy:** A Black-Scholes option is like paying a deposit on a vacation rental that lets you back out if you find something better.

**Structural Mappings:**

| Target Concept Element | Analogy Element | How the Mapping Holds |
|------------------------|-----------------|----------------------|
| Option premium (C) | Deposit amount you pay upfront | Both are a certain cost paid now for an uncertain future right |
| Volatility (σ) | How unpredictable vacation pricing is in that destination | More price swings in the rental market = deposit worth more, because if prices spike you benefit; your maximum loss is still just the deposit |
| Time to expiration (T) | How far in advance you're booking | More time before your decision deadline = more chances for the situation to change in your favor; deposits on longer-lead bookings are more valuable |
| Strike price (K) discounted | The locked-in price you negotiated, adjusted for the fact that you don't pay until checkout | Paying a fixed rate six months from now is not the same as paying it today -- a lower-cost equivalent today would be slightly less |
| N(d2) probability | Your assessed probability you'll actually stay there rather than canceling | The deposit's practical value depends on how likely you are to follow through |

**Where the analogy breaks down:** Vacation rental deposits typically have no upside beyond "you secured a price" -- they do not scale with how far below market you end up. Stock options have unlimited upside: if the stock goes to $500 and your strike is $95, your gain is enormous. The deposit analogy captures the structure of the cost and the option logic, but it does not capture the asymmetric payoff profile, which is Black-Scholes's most important feature.

---

### Step 3 -- Refined Expert Explanation

The Black-Scholes model (Fischer Black and Myron Scholes, 1973) prices a European call option -- an option that can only be exercised at expiration, not before.

The model rests on the assumption that the underlying asset's price follows **geometric Brownian motion**: it moves randomly but with a consistent volatility (σ), and the logarithm of price changes is normally distributed. Under this assumption, Black-Scholes derives a **partial differential equation** that any correctly priced derivative must satisfy, then solves it in closed form.

The closed-form solution is:

**C = S·N(d₁) -- K·e^(--rT)·N(d₂)**

Where:
- **C** is the fair value (premium) of the call option today
- **S** is the current spot price of the underlying asset
- **K** is the strike price -- the agreed purchase price the option holder pays upon exercise
- **T** is time to expiration measured in years
- **r** is the continuously compounded risk-free rate (the drift adjustment under risk-neutral measure)
- **σ** is the annualized implied or historical volatility of the underlying's log returns
- **N(x)** is the cumulative standard normal distribution function -- the probability that a standard normal variable falls below x
- **d₁ = [ln(S/K) + (r + σ²/2)·T] / (σ·√T)**
- **d₂ = d₁ -- σ·√T**

The term **N(d₁)** represents the option's **delta** -- the sensitivity of option price to changes in the underlying price, and can be interpreted as the risk-neutral probability of exercise adjusted for the optionality of receiving the stock itself. **N(d₂)** is the risk-neutral probability that the option expires in the money, used to weight the present value of the strike payment. The spread between d₁ and d₂ is exactly σ√T -- wider spread means higher uncertainty means larger difference between the stock-receipt probability and the strike-payment probability.

The model's foundational insight is **risk-neutral pricing**: regardless of investors' actual risk preferences, the option can be perfectly replicated by a continuously rebalanced portfolio of the underlying stock and a risk-free bond. The cost of building and maintaining that replicating portfolio is exactly C. This arbitrage argument is why the model does not require knowing the stock's expected return (μ) -- it cancels out in the replication argument.

---

### Knowledge Gap Summary

| Gap ID | Gap Description | Source Used to Fill | Confidence After Filling |
|--------|-----------------|---------------------|--------------------------|
| ★1 | Volatility defined statistically but not economically -- why high σ helps option buyers | Chapter section on payoff diagrams + limited liability argument | High |
| ★2 | d₁ and d₂: what they calculate and why they differ by σ√T | Chapter derivation section + risk-neutral probability interpretation | Medium -- the derivation is clear; the intuition for why d₁ ≠ d₂ takes more work |

---

### Self-Check Questions

**Level 1 -- Recall (Can you retrieve it?)**
- Without looking, state the five inputs to the Black-Scholes formula and what each one represents.
- What does the term K·e^(--rT) represent and why is it discounted rather than just K?

**Level 2 -- Conceptual Depth (Do you understand it?)**
- An option on a highly volatile biotech stock costs more than an option on a stable utility company, all else equal. Explain why using the model's structure, not just "more risk."
- Why does Black-Scholes not require you to know the stock's expected return (mu)? What argument eliminates it?

**Level 3 -- Transfer (Can you apply it to something new?)**
- You are told that a stock's implied volatility has just jumped from 20% to 35% after an earnings announcement. The stock price itself did not change, nor did the strike or time to expiration. Using only your understanding of the model's structure, explain what happens to the option price and why -- without plugging into a calculator.

---

### Review Schedule (Spaced Repetition)

| Review | Days From Now | What to Test |
|--------|--------------|--------------|
| 1st    | 1 day        | Recall the five inputs and explain what each one does without the formula in front of you |
| 2nd    | 3 days       | Explain the plain-language meaning of N(d₁) and N(d₂) without notes |
| 3rd ★  | 5 days (exam) | Full Feynman re-test: explain the model from scratch; the exam is the real Level 3 transfer test |
| 4th    | 14 days      | Answer Level 2 and Level 3 self-check questions cold |
| 5th ★  | 30 days      | Full Feynman re-test: explanation should flow without any gap-filling |

★ = Schedule a full Feynman session at this interval
*Note: Day 7 interval adjusted to Day 5 to align with exam date.*

---

### Next Steps

**Complementary techniques for this material:**
1. **Worked examples / practice problems:** The Feynman session has built conceptual understanding of the formula's structure. Now do 5-8 numerical problems using different input combinations -- pay attention to how C changes as you vary σ and T individually. This builds intuition for option sensitivity (the Greeks) without requiring you to memorize the Greek formulas yet.
2. **Flashcard generation** (`flashcard-generation`): Create cards for the five inputs, the definitions of N(d₁) and N(d₂), the risk-neutral pricing argument in one sentence, and the two knowledge gaps that were identified above -- these are high-probability exam targets precisely because they are conceptually subtle.

**Connection to other topics:** Black-Scholes is the foundation for the **Greeks** (delta, gamma, vega, theta, rho) -- each Greek is a partial derivative of the Black-Scholes formula with respect to one input. Your Feynman explanation of σ's role maps directly to **vega** (sensitivity of option price to volatility changes). The risk-neutral pricing argument connects to the broader concept of **no-arbitrage pricing**, which is the same logic used in forward pricing, bond duration, and swap valuation. Understanding that μ cancels out here is key to understanding why derivative pricing differs fundamentally from equity valuation.
