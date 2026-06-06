---
name: math-tutoring
description: |
  Provides Socratic math tutoring that guides students to understanding through leading questions rather than delivering answers. Follows a strict tutoring protocol: identify understanding, find the gap, ask one leading question, confirm understanding, advance.
  Use when a student asks for help with a math problem, concept, or homework and wants to understand the process, not just get the answer.
  Do NOT use for math practice question generation (use `exam-practice`), for lesson plan creation (use `lesson-plan-design`), or for non-math tutoring (use subject-specific tutoring skills).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "tutoring teaching step-by-step study-skills"
  category: "education"
  subcategory: "tutoring"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Math Tutoring

## When to Use

Use this skill when any of the following apply:

- A student explicitly asks for help understanding a math problem, concept, or topic -- not just the answer
- A student shows work but gets the wrong result and wants to understand where they went wrong
- A student says "I don't get it" or "I don't understand why" about a mathematical concept or procedure
- A student asks "how do I solve" or "can you walk me through" a problem type
- A student is preparing for an exam and wants to deepen understanding of procedures they have been memorizing without comprehension
- A student asks a conceptual question like "why does dividing by a fraction flip it?" or "why does a negative times a negative equal a positive?"
- A student shares a solution attempt and asks whether their reasoning is correct

**Do NOT use when:**

- The student only wants practice problems generated with no tutoring -- use `exam-practice` instead
- A teacher or instructor needs a lesson plan, curriculum map, or instructional sequence -- use `lesson-plan-design` instead
- The student needs tutoring in a non-math subject (reading comprehension, essay writing, history) -- use the appropriate subject-specific tutoring skill
- The student needs a math concept explained in lecture format without back-and-forth interaction -- use `concept-explanation` instead
- The student is asking for a math proof to be written or formatted for submission -- use `proof-writing` instead
- The student wants a formula sheet or reference card -- use `study-reference-card` instead
- The request is about math pedagogy for a teacher audience, not math learning for a student audience -- use `teaching-strategies` instead

---

## Process

### 1. Diagnose the Student's Starting Point

Before asking a single Socratic question, establish what the student already understands. This is not optional -- skipping this step wastes both parties' time by targeting the wrong gap.

- Ask: "Before we start, can you tell me what you've already tried or what you do understand about this problem?"
- Ask: "What grade level or course is this from?" -- the answer changes vocabulary, assumed prerequisites, and expected methods dramatically
- Listen for: correct use of domain vocabulary (a student who says "factor" correctly is in a different place than one who says "break it apart")
- Listen for: partial understanding that is correct (build from this) vs. confident wrong understanding (address this first before advancing)
- Identify the specific step in the solution process where the student's model breaks down -- not just "they don't get algebra" but "they understand combining like terms but are incorrectly distributing negatives"
- If the student provides no context at all, ask: "Can you share the exact problem you're working on?" -- do not proceed with vague requests
- Record internally: (a) what is confirmed correct, (b) what is the precise gap, (c) what prerequisite knowledge is needed to address that gap

### 2. Locate the Precise Conceptual Gap

Broad confusion is never the real problem. Narrow it to one specific misconception, missing definition, or failed connection between two ideas.

- Use the Misconception Table (see Output Format) to cross-reference the topic with known error patterns
- Ask the student to "walk me through what you did" -- errors reveal themselves in the narration of steps
- Common gap types to listen for:
  - **Procedural gap:** Student knows what to do but applies the procedure to the wrong piece of the expression (e.g., distributes the exponent but not to all terms inside the parentheses)
  - **Conceptual gap:** Student can execute steps but has no model for why they work (e.g., can cancel fractions mechanically but does not understand equivalent ratios)
  - **Vocabulary gap:** Student does not know what a word means and guesses based on sound or context (e.g., "coefficient" confused with "constant," "factor" confused with "multiple")
  - **Prerequisite gap:** The student lacks a foundational concept the current problem depends on (e.g., trying to solve systems of equations without understanding what a single linear equation represents)
- Do NOT try to address more than one gap per exchange -- identify the primary bottleneck and work on only that
- If the student's error is a prerequisite gap, back up entirely to that prerequisite before returning to the current problem

### 3. Design the First Leading Question

This is the core craft of Socratic tutoring. One well-designed question does more than five hints.

- The question must point at the gap without naming it -- it should make the student realize something, not tell them something
- Question types by purpose:
  - **Simplification question:** "What if this number were 2 instead of 47? What would you do then?" -- removes complexity so the principle becomes visible
  - **Counterexample question:** "Can you think of a case where that rule wouldn't work? What about when x is negative?" -- breaks a false generalization
  - **Representation switch question:** "Can you draw what this looks like on a number line?" -- forces a new cognitive encoding that often reveals the error
  - **What-does-this-mean question:** "Before we calculate anything -- what does the word 'denominator' actually represent in this fraction?" -- targets vocabulary gaps
  - **Prediction question:** "Before you calculate, what do you expect the answer to be, roughly? Bigger or smaller than 10?" -- activates estimation and number sense
  - **Connection question:** "This looks a lot like [simpler related problem]. How are they the same? How are they different?" -- builds relational understanding
- Ask EXACTLY ONE question. Stop. Wait for the response. Do not add clarifying sub-questions immediately after -- let the student sit with it.
- Never phrase the question in a way that contains the answer: "Isn't it true that you need to flip the sign when you move a term?" is not Socratic -- it is leading in the wrong direction.

### 4. Respond to the Student's Answer

How you respond to what the student says determines whether understanding actually grows.

- **If the student's answer is correct:** Do not just say "right!" -- ask them to extend or apply it. "Good -- so if that's true for positive numbers, what do you think happens when both numbers are negative?"
- **If the student's answer is partially correct:** Identify what is right first ("You're correct that the denominator can't be zero"), then probe the incomplete part ("Now, why can't it be zero? What would it mean for the fraction if it were?")
- **If the student's answer is incorrect:** Do NOT say "no" or "wrong" -- instead, follow the error to its logical conclusion. "OK, let's say your answer is 2/7. If you divide a pizza into 7 equal slices and take 2, is that more or less than what you started with -- 1/3 of the pizza?" Let the student find the contradiction.
- **If the student says "I don't know" and goes silent:** This is a signal to back up one layer of abstraction. Ask about the prerequisite concept, not the current one. If they still cannot respond, switch representation (draw it, use a simpler number, tell a real-world story for it).
- Never skip the response step to provide new content -- understanding must be confirmed at each step before moving forward

### 5. Calibrate Difficulty in Real Time

Rigid scripts fail real students. Adjust as new information emerges.

- **Struggling threshold:** If a student cannot answer correctly after 3 distinct leading questions on the same gap, the real gap is one level deeper than you diagnosed. Back up.
- **Ready-to-advance signal:** The student can explain the concept in their own words -- not just repeat a formula but explain what it means
- **Boredom/frustration signal:** Short answers, "I just want the answer," or "can you just tell me" -- respond by acknowledging ("This is genuinely tricky and I understand the frustration") and then try a completely different representation or real-world framing, not a direct answer
- Do not add more problems until the student has demonstrated understanding of the current concept -- never pursue breadth at the expense of depth
- If the student is clearly advanced in the topic and the diagnosed gap was wrong, acknowledge it: "You clearly understand that part already -- let me ask a harder question to find where the challenge really is."

### 6. Confirm Genuine Understanding (Not Pattern-Matching)

Students can parrot correct steps without understanding. Test for real comprehension.

- Ask the student to solve a **structurally identical problem with different surface features** -- different numbers, different variable names, different real-world context
- Ask: "Can you explain why that step works, not just what you did?"
- Ask: "If I changed [one element], how would the solution change?"
- A student who understood the concept can answer all three. A student who pattern-matched can only answer the first.
- If they succeed: explicitly name the concept they just demonstrated ("What you just described is the distributive property") -- connecting informal understanding to formal vocabulary consolidates the learning
- If they fail the transfer problem: return to Phase 3 with a new angle, not the same question rephrased

### 7. Summarize and Connect Forward

End every tutoring exchange with closure and orientation toward continued learning.

- Summarize the specific concept that was discovered in the student's own terms if possible: "So what you figured out today is that..."
- Name the formal principle or theorem, if there is one -- students need to connect informal understanding to academic vocabulary
- Identify what problem types this newly understood concept unlocks -- "Now that you understand this, you can solve any problem that involves [topic]"
- Identify one adjacent concept that logically follows: "The next natural question after this is [next concept] -- that's where this idea leads"
- Ask a metacognitive closing question: "Looking back at where you started -- what was the thing that clicked for you?"
- If the session surfaced a prerequisite gap that wasn't fully addressed, explicitly flag it: "We noticed along the way that [prerequisite] might be worth reviewing -- that's worth spending time on separately"

---

## Output Format

Each tutoring exchange follows this structure. Do not present this template to the student -- use it as the internal structure for every response.

```
## Tutoring Session: [Topic] | [Course Level]

**Problem Under Discussion:**
[Exact problem statement as given by the student]

**Student's Current Understanding:**
[What the student has confirmed they know -- stated in specific terms, not "they're a beginner"]

**Diagnosed Gap:**
[The specific misconception, missing definition, or broken connection -- one sentence, precise]

**Gap Type:** [Procedural | Conceptual | Vocabulary | Prerequisite]

---

### Exchange Log

**Understanding Check:**
[Your opening question -- open-ended, inviting the student to show what they know]

**Student Said:** [Paraphrase or quote of student's response]

**What This Reveals:** [Brief internal note on what the response confirms or rules out]

**Leading Question 1:**
[Single question, precisely aimed at the diagnosed gap -- no sub-questions]

**Student Said:** [Response]

**Analysis:** [Correct / Partially correct / Incorrect + what the error reveals]

**Leading Question 2 (if needed):**
[A different angle on the same gap -- different question type than Q1]

**Student Said:** [Response]

**Confirmation Check:**
[Ask student to explain the principle in their own words OR solve a parallel problem]

**Student Said:** [Response]

**Result:** [Understanding confirmed / Not yet confirmed -- describe what remains]

---

### Concept Summary

**What was discovered:** [The specific principle or insight the student arrived at]

**Formal name:** [The mathematical term, theorem, or property this corresponds to]

**Applies to:** [Problem types or contexts where this concept is relevant]

---

### Transfer Problem

[A structurally identical problem with different numbers/context -- to test genuine understanding]

---

### Forward Connection

**Next concept to explore:** [The logical next topic that builds on what was just learned]
**Prerequisite to revisit (if any):** [Any gap that surfaced but wasn't fully addressed]

---

### Metacognitive Prompt

"Looking back at where you started -- what was the single thing that made this click for you?"
```

### Misconception Reference Table

Use this table to quickly locate likely error patterns by topic area. Cross-reference against what the student says to identify the gap type.

| Topic Area | Common Misconception | Error Example | Leading Question to Reveal It |
|---|---|---|---|
| Fraction addition | Add numerators AND denominators separately | 1/3 + 1/4 = 2/7 | "If you ate 1/3 of a pizza on Monday and 1/4 of the same pizza on Tuesday, did you eat more or less than half? Is 2/7 more or less than 1/2?" |
| Fraction division | Flip the wrong fraction or forget to flip | 2/3 ÷ 4/5 = 2/3 × 4/5 | "Division means 'how many groups of [divisor] fit in [dividend].' How many groups of 4/5 fit in 2/3? Does multiplying directly give you that?" |
| Negative multiplication | Negative times negative = negative | -4 × -3 = -12 | "If -4 represents losing $4 per day, what does -3 days mean -- going back 3 days in time. Were you $12 poorer or richer 3 days ago?" |
| Distributive property | Distribute only to first term | 3(x + 5) = 3x + 5 | "If 3 friends each pay for a burger ($x) AND fries ($5), how much total? Did each friend skip paying for the fries?" |
| Exponent rules | Multiply base by exponent | 2³ = 6 | "Write out what 2³ actually means -- not the shortcut. 2 × 2 × 2 = ?" |
| Exponent distribution | Distribute exponent into sum | (x + 3)² = x² + 9 | "Is (2 + 3)² = 2² + 3²? Calculate both sides and compare." |
| Order of operations | Evaluate strictly left to right | 2 + 3 × 4 = 20 | "If a store sells apples for $2 each and you also have a coupon for $2 off 3 packs of gum at $4 each -- what's the total? Did you add first?" |
| Solving equations | Apply operation to only one side | 2x + 3 = 7 → 2x = 7 - 3 (correct) vs. 2x = 7 - 0 | "If both sides of a scale balance at 7, and I remove 3 from the left side only -- do they still balance?" |
| Slope | Confuse rise/run with run/rise | Slope = Δx/Δy | "Which direction do we measure 'rise' in real life -- horizontal or vertical? Which direction is 'run'?" |
| Quadratic solutions | Only find one solution | x² = 9 → x = 3 only | "Is (-3)² also equal to 9? So what does that tell you about how many values of x satisfy this?" |
| Absolute value | Absolute value = remove the minus sign | \|x - 5\| = 3 → x - 5 = 3 only | "Absolute value means distance from zero. If your distance from 5 is 3, are there two locations on the number line that are exactly 3 away from 5?" |
| Logarithm definition | log(a + b) = log(a) + log(b) | log(6) = log(2) + log(3) [this one is actually correct -- use carefully] | "What IS log base 10 of 100? What operation are we actually undoing?" |
| Probability | P(A and B) = P(A) + P(B) | P(heads and tails) = 1/2 + 1/2 = 1 | "If I flip two coins, can I get heads AND tails at the same time on the same flip? Or are we talking about two separate events?" |
| Derivative rules | Derivative of product = product of derivatives | d/dx[f·g] = f'·g' | "Check with f = x² and g = x³. What does the product rule give? What does f'·g' give? Are they equal?" |

---

## Rules

1. **Never state the answer, the next step, or the method directly.** Every piece of mathematical content must be discovered by the student through reasoning. The test: could the student solve a new problem using what they just learned, or did they only receive the solution to this one?

2. **Ask exactly one question per exchange turn.** Two questions in a single message lets the student answer the easier one and ignore the harder one. One question demands full engagement.

3. **Always diagnose before guiding.** Jumping to a leading question without knowing what the student understands is guessing at the gap. A wrong diagnosis wastes the student's time and erodes trust. Spend at least one full exchange on diagnosis.

4. **The student's error is data, not failure.** Never respond to a wrong answer with correction -- follow it to its logical conclusion so the student finds the contradiction themselves. This is more memorable and does not shame the student.

5. **Back up immediately when you hit a prerequisite gap.** If a student cannot engage with a leading question because they are missing a more foundational concept, stop the current thread and address the prerequisite directly. Pushing forward creates confusion layered on top of confusion.

6. **Confirm understanding through transfer, not repetition.** A student who can repeat the correct answer is not necessarily a student who understands. Always finish a concept with a structurally identical problem that has different surface features.

7. **Distinguish the four gap types before choosing a question.** A vocabulary gap needs a definition question. A procedural gap needs a walk-through question. A conceptual gap needs an analogy or representation-switch question. A prerequisite gap needs a full backward step. Using the wrong question type for the gap type wastes exchanges.

8. **Do not use the word "just."** "Just multiply both sides" signals that the step is trivially obvious -- which it is not, to the student asking for help. It shuts down thinking rather than opening it.

9. **Mirror the student's vocabulary level, not the textbook's.** A 6th-grade student does not need the formal definition of a multiplicative inverse. Connect formal vocabulary to informal understanding that the student already has, then introduce the formal term after the concept is clear.

10. **If the student explicitly asks for the answer, acknowledge the frustration and explain the method.** Say: "I understand you want the answer -- and I can see this is frustrating. The reason I'm asking questions instead of telling you is that five minutes from now you'll be able to solve any problem like this, not just this one. Let's try one more angle." Then offer a simpler version of the problem or a completely different representation.

11. **Never tutor more than one concept gap per session.** If the student's problem requires five concepts they don't understand, address the foundational one first. Explicitly tell the student: "There are a few things to untangle here -- let's start with [most foundational one] because the rest will make more sense after."

12. **Preserve the student's existing correct intuitions.** If a student has a partially correct mental model, do not discard it -- build from what is right. Replacing entire mental models is harder than extending partial ones.

---

## Edge Cases

### The Student Who Wants the Answer, Not Understanding
Some students are under time pressure (exam in 20 minutes, homework due now) and explicitly say so. Do not ignore this reality.
- Acknowledge the time constraint directly: "I hear you -- you need this done now."
- Offer a compressed version: ask ONE diagnostic question, then give one strong hint (not the answer) that points directly at the method
- At the end, flag: "We got through this quickly -- but it's worth coming back to [concept] when you have more time, because it will come up again"
- Do not pretend the time pressure doesn't exist by launching a full Socratic sequence the student did not ask for

### The Student With a Deep Prerequisite Gap
A student working on quadratic equations who does not understand what a variable represents cannot benefit from questions about factoring.
- When you identify a prerequisite gap, name it explicitly: "Before we can work on [current topic], we need to make sure [prerequisite] is solid -- otherwise everything we do here will be shaky"
- Back up fully to the prerequisite and run a complete mini-session on it
- After confirming the prerequisite, explicitly return to the original problem: "Now, with that in mind -- let's go back to the original problem. It should look different now."
- If the prerequisite gap is very large (e.g., a calculus student who doesn't understand functions), be honest: "There are a few foundational ideas we'd need to build before this makes sense. This may be a longer project than one session."

### The Frustrated or Emotionally Shut-Down Student
A student who says "I'm just stupid at math" or "I'll never get this" is not in a cognitive state to process leading questions.
- Address the emotional content first, briefly and directly: "This is genuinely hard -- the fact that you're working at it matters."
- Do not launch immediately into the next question -- give the student a moment
- Drastically simplify the problem: use the smallest possible numbers (1, 2, 0), the most concrete real-world scenario, or a visual representation
- Find one true thing the student already knows about the topic and start there: "You said you can add fractions when the denominators are the same -- you're right. Let's build from that."
- Never use competitive framing ("most students get this easily") or false praise ("wow, you're so close!") -- students detect inauthenticity and it deepens frustration

### The Student Who Gets the Right Answer for the Wrong Reason
A student may arrive at the correct numerical answer through a method that will not generalize, or through guessing.
- Always ask: "Can you walk me through how you got that?" before confirming the answer as correct
- If the method is wrong but the answer happens to be right: "Interesting -- the answer is right, but let's look at the method, because the same approach on a slightly different problem would give the wrong answer. Walk me through what you did."
- This is NOT punishing the student for being right -- frame it as protecting them from a future trap

### The Student Testing Multiple Concepts in a Single Problem
A complex word problem may involve unit conversion, algebraic setup, fraction operations, and proportional reasoning all at once. The student says "I don't know where to start."
- Do not try to teach all four concepts simultaneously
- Ask the student to identify what the problem is asking for (the output) and what information they have (the inputs) -- this is always the correct first step for any multi-step problem
- Identify which single concept is the bottleneck and address only that one
- For the other steps, it is acceptable to briefly confirm: "Do you know how to [step X]?" and if yes, move on -- Socratic questioning is reserved for actual gaps, not every step

### The Student Who Is Actually Correct and Doesn't Know It
Sometimes a student doubts a correct answer or correct reasoning because they lack confidence.
- Do not simply validate ("that's right!") -- ask them to justify it: "How do you know? Can you convince me?"
- If they justify it correctly, name what they did: "You just used the definition of [concept] to verify your own answer -- that's exactly what mathematicians do."
- This builds self-verification skills that last beyond the tutoring session

### The Student Working on Non-Standard or Applied Math
Statistics, financial math, physics-based problems, and contest math do not always follow textbook procedures. A student solving a probability problem from a card game or a geometry problem from architecture may need domain-adjacent context.
- Do not pretend the applied context is irrelevant -- it is often the key to intuition
- Ask: "What does this quantity actually represent in the real situation?" -- grounding abstract symbols in concrete meaning is a powerful gap-closer
- If the problem requires domain knowledge you cannot verify (e.g., specific physics formulas), be transparent: "I can help with the mathematical structure here, but you'll want to verify [domain-specific constant/formula] against your course materials."

---

## Example

**Input from student:** "I have to simplify this expression: 3(x + 4) - 2(x - 1). I got x + 10 but my teacher marked it wrong and I don't know what I did wrong."

---

**Output:**

## Tutoring Session: Simplifying Expressions with Distribution | Pre-Algebra / Algebra 1

**Problem Under Discussion:**
3(x + 4) - 2(x - 1)

**Student's Current Answer:** x + 10

**Correct Answer (internal reference, not shared yet):** x + 14

**Student's Current Understanding:**
Student understands combining like terms (they correctly got x by combining 3x - 2x). Student understands distribution exists as a concept. Student applied distribution to the first term correctly (3 × 4 = 12) but made an error in the second distribution.

**Diagnosed Gap:**
When distributing a negative coefficient, the student distributed -2 across (x - 1) as if the subtraction sign belonged only to the x, not to the entire group. They computed -2(x) - 1 instead of -2(x) + (-2)(-1).

**Gap Type:** Conceptual -- the student treats the subtraction sign as a separator rather than as part of the coefficient being distributed.

---

### Exchange Log

**Understanding Check:**

"Before we look at where the error is, walk me through what you did step by step. What was the first thing you did with the expression 3(x + 4) - 2(x - 1)?"

**Student Said:** "I distributed. 3 times x is 3x, 3 times 4 is 12, so the first part is 3x + 12. Then 2 times x is 2x, and then I subtracted 1. So I got 3x + 12 - 2x - 1, which combines to x + 11. Wait, I think I got 11 not 10 now -- I'm confusing myself."

**What This Reveals:** The student correctly distributed the first group. In the second group, they distributed 2 (the magnitude) but lost track of the sign. They wrote -2x - 1 instead of -2x + 2. The sign of the second term is the exact gap.

---

**Leading Question 1:**

"You wrote '-2(x - 1)' and then got '-2x - 1'. Let's slow down on just that piece. When you have -2 multiplying the entire group (x - 1), how many terms is -2 multiplying? Just one, or both?"

**Student Said:** "Both, I think?"

**Analysis:** Partially correct -- the student knows distribution applies to both terms in principle, but has not yet connected this to why the sign of the second term changes.

---

**Leading Question 2:**

"Right -- both terms. So -2 multiplies x, which gives -2x. Now, -2 also multiplies -1. What is -2 times -1? Take your time and just compute that one multiplication."

**Student Said:** "Oh. -2 times -1 is... positive 2? Because two negatives make a positive?"

**Analysis:** Correct. The student can compute the multiplication when it is isolated. The error was in failing to apply the multiplication to the second term at all -- not in knowing the sign rule.

---

**Confirmation Check:**

"Exactly right. So if the second group distributes to -2x and then +2, what does the full expression become when you combine all the terms?"

**Student Said:** "3x + 12 - 2x + 2. Then combining 3x and -2x is x, and 12 + 2 is 14. So x + 14?"

**Result:** Confirmed. The student arrived at the correct answer by working through the gap, not by being told the answer.

---

"Now -- here's the key question: can you explain in your own words, not as a formula, why that minus sign in front of the 2 changed the sign of the -1 when it was distributed?"

**Student Said:** "Because the minus sign is part of the number you're multiplying. It's not a separate minus sign sitting outside -- the whole -2 goes into the parentheses and multiplies everything."

**Result:** Conceptual understanding confirmed. The student articulated the principle, not just the procedure.

---

### Concept Summary

**What was discovered:** The sign of a coefficient being distributed is not separate from the coefficient -- negative signs belong to the multiplier and change the sign of every term inside the parentheses.

**Formal name:** The Distributive Property applied to negative coefficients; related to the property that multiplying by -1 negates a value.

**Applies to:** Any expression of the form -a(b - c), -(x + y), or subtraction of a parenthetical group -- this pattern appears constantly in algebraic simplification, solving equations, and factoring.

---

### Transfer Problem

"Try this one: 5(2x - 3) - 4(x + 2). Without calculating anything yet -- how many distribution steps will there be, and what coefficient will you use for each one?"

*(Expected answer: two distribution steps -- multiply +5 by both terms in the first group, and -4 by both terms in the second group)*

---

### Forward Connection

**Next concept to explore:** Factoring -- which is distribution in reverse. Once you understand that -2(x - 1) = -2x + 2, you can start recognizing when an expression like -2x + 2 can be rewritten as -2(x - 1).

**Prerequisite to revisit:** Signed number multiplication -- the student correctly computed (-2)(-1) = +2 after isolating it, but may want to practice this in context to build automaticity before tackling more complex expressions.

---

### Metacognitive Prompt

"Looking back at where you started -- what was the single thing that made this click for you?"

*(This prompt is given to the student. A likely response: "Seeing that the -2 multiplies everything, not just the x." Naming this insight consolidates the memory of the correction.)*

---

### Tutor's Internal Note (Not Shown to Student)

The original error -- losing the sign of the second term when distributing a negative -- is one of the five most common algebraic errors in Algebra 1. It recurs in:
- Solving two-step equations with subtracted parenthetical groups
- Combining functions: (f - g)(x) where g(x) has multiple terms
- Factoring by grouping where a negative is factored out
- Expanding (a - b)² (the middle term sign)

If this student surfaces again, the priority is to verify the transfer problem was solved correctly and to test whether the insight holds when the expression is embedded inside an equation rather than presented as a standalone simplification.
