---
name: math-solver
description: |
  Math problem solving and explanation skill providing step-by-step solutions, concept explanations from algebra through calculus and statistics, word problem strategies, visualization techniques, common mistake identification, and practice problem generation organized by topic and difficulty.
  Use when the user asks about math solver, or needs help with math problem solving and explanation skill providing step-by-step solutions, concept explanations from algebra through calculus and statistics, word problem strategies, visualization techniques, common mistake identification, and practice problem generation organized by topic and difficulty.
  Do NOT use when the request requires professional specialized advice or falls outside the scope of math solver.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "study-skills academic-writing guide"
  category: "education"
  subcategory: "academic-skills"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Math Solver

## When to Use

**Use this skill when:**
- User needs help solving a math problem with step-by-step explanation
- User wants to understand a mathematical concept or formula
- User needs help with algebra, calculus, statistics, or other math topics
- User wants to check their work and understand where they went wrong

**Do NOT use this skill when:**
- User wants a pure numerical answer without understanding -- this skill teaches the process
- User needs data analysis or statistics on a dataset -- use data analysis skills
- User needs financial calculations -- use personal finance skills with built-in formulas

## Process

1. **Step 1:** Identify the problem type, difficulty level, and what the user already understands
2. **Step 2:** Break the problem into clear sequential steps with reasoning for each
3. **Step 3:** Show the work: every algebraic manipulation, substitution, and simplification
4. **Step 4:** Verify the answer using a different method or by checking against constraints
5. **Step 5:** Explain the underlying concept so the user can solve similar problems independently

## Purpose

This skill helps students understand and solve math problems by providing clear, step-by-step solutions with explanations of the reasoning behind each step. It prioritizes understanding over answer-getting, teaching the user to think mathematically rather than just apply formulas mechanically.

---

## Questions to Ask the User First

1. **What level of math?** (Pre-algebra, Algebra 1, Algebra 2, Geometry, Precalculus, Calculus, Statistics, or other)
2. **Specific topic or problem:** What concept or problem are you working on?
3. **What have you tried?** Show me your work so far, even if it is wrong. (Understanding where you went wrong is critical)
4. **What specifically confuses you?** Is it the concept, the steps, or a particular calculation?
5. **Learning goal:** Do you want me to solve this for you with explanation, guide you through solving it yourself, or explain the underlying concept?
6. **Context:** Is this for homework, test prep, or self-study? (Affects how much I should help vs. guide)
7. **Prerequisites:** Are you comfortable with the foundational topics this builds on?
8. **Notation preferences:** Are you in a class that uses specific notation or methods?

---

## Problem-Solving Framework

### The Polya Method (How to Solve It)

George Polya's classic four-step problem-solving framework:

```
POLYA'S FOUR STEPS
====================

STEP 1: UNDERSTAND THE PROBLEM
  - What are you asked to find or show?
  - What information is given?
  - What information is missing?
  - Can you draw a picture or diagram?
  - Can you restate the problem in your own words?
  - Have you seen a similar problem before?

STEP 2: DEVISE A PLAN
  - What strategy will you use?
    [ ] Write an equation
    [ ] Look for a pattern
    [ ] Work backwards
    [ ] Guess and check
    [ ] Break into smaller parts
    [ ] Draw a diagram
    [ ] Make a table
    [ ] Use a formula
    [ ] Eliminate possibilities
    [ ] Solve a simpler version first

STEP 3: CARRY OUT THE PLAN
  - Execute your chosen strategy step by step
  - Check each step as you go
  - If stuck, go back to Step 2 and try a different strategy
  - Show all work clearly

STEP 4: LOOK BACK
  - Does your answer make sense?
  - Can you check it by substituting back?
  - Can you estimate to verify reasonableness?
  - Could you solve it a different way?
  - What can you learn from this problem?
```

---

## Step-by-Step Solution Format

### How to Present Solutions

Every solution should follow this format:

```
SOLUTION FORMAT
===============

PROBLEM: [State the problem clearly]

GIVEN: [List all given information]
FIND: [State what we need to find]

STEP 1: [Action - what we're doing and WHY]
  [Mathematical work]
  [= result]

STEP 2: [Action - what we're doing and WHY]
  [Mathematical work]
  [= result]

STEP 3: [Continue until solved]
  [Mathematical work]
  [= result]

ANSWER: [Clearly stated final answer with units if applicable]

CHECK: [Verify the answer makes sense]
  [Substitute back, estimate, or alternative method]

KEY CONCEPT: [What principle or formula was used and when to use it]
```

---

## Topic-Specific Strategies

### Algebra

```
ALGEBRA FUNDAMENTALS
=====================

SOLVING LINEAR EQUATIONS:
  Goal: Isolate the variable on one side
  Process: Undo operations in reverse order (PEMDAS backwards)

  Example: 3(x + 2) - 5 = 16
  Step 1: Distribute      --> 3x + 6 - 5 = 16
  Step 2: Combine like terms --> 3x + 1 = 16
  Step 3: Subtract 1        --> 3x = 15
  Step 4: Divide by 3       --> x = 5
  Check: 3(5 + 2) - 5 = 3(7) - 5 = 21 - 5 = 16  ✓

COMMON ALGEBRA MISTAKES:
  - skipping to distribute the negative sign: -(x + 3) = -x - 3, NOT -x + 3
  - Dividing only part of an equation by a number
  - Flipping inequality sign when multiplying/dividing by negative
  - Mixing up "and" (intersection) vs. "or" (union) in inequalities
```

### Systems of Equations

```
SYSTEMS OF EQUATIONS METHODS
==============================

METHOD 1: SUBSTITUTION
  Best when: One equation easily solves for one variable
  Steps:
    1. Solve one equation for one variable
    2. Substitute into the other equation
    3. Solve for the remaining variable
    4. Back-substitute to find the first variable

METHOD 2: ELIMINATION
  Best when: Variables have matching or easily-matched coefficients
  Steps:
    1. Multiply one or both equations so a variable's coefficients match
    2. Add or subtract equations to eliminate that variable
    3. Solve for the remaining variable
    4. Back-substitute

METHOD 3: GRAPHING
  Best when: You need a visual understanding or approximate answer
  Steps:
    1. Graph both equations
    2. Find the intersection point
    3. The coordinates of the intersection are the solution
```

### Quadratics

```
QUADRATIC EQUATIONS (ax² + bx + c = 0)
========================================

METHOD 1: FACTORING
  When: The expression factors nicely
  Look for: Two numbers that multiply to ac and add to b

METHOD 2: QUADRATIC FORMULA
  When: Always works (universal method)
  x = (-b ± √(b² - 4ac)) / 2a

  The DISCRIMINANT (b² - 4ac) tells you:
    > 0: Two real solutions
    = 0: One repeated real solution
    < 0: Two complex solutions (no real x-intercepts)

METHOD 3: COMPLETING THE SQUARE
  When: Converting to vertex form or deriving the quadratic formula
  Steps:
    1. Move c to the other side
    2. Take half of b, square it, add to both sides
    3. Factor the perfect square trinomial
    4. Solve by taking square roots

VISUALIZATION:
  The graph of y = ax² + bx + c is a parabola
  a > 0: Opens upward (minimum)
  a < 0: Opens downward (maximum)
  Vertex: x = -b/(2a)
  Solutions (roots) are where the parabola crosses the x-axis
```

### Calculus

```
CALCULUS FUNDAMENTALS
======================

LIMITS:
  Concept: What value does f(x) approach as x approaches a value?
  Strategy: Try direct substitution first
  If 0/0: Factor, rationalize, or use L'Hôpital's Rule
  If ∞/∞: Use L'Hôpital's Rule

DERIVATIVES:
  Concept: Instantaneous rate of change (slope of tangent line)
  Power Rule: d/dx[x^n] = nx^(n-1)
  Product Rule: d/dx[f·g] = f'g + fg'
  Quotient Rule: d/dx[f/g] = (f'g - fg')/g²
  Chain Rule: d/dx[f(g(x))] = f'(g(x)) · g'(x)

  COMMON DERIVATIVES TO MEMORIZE:
    d/dx[sin x] = cos x
    d/dx[cos x] = -sin x
    d/dx[e^x] = e^x
    d/dx[ln x] = 1/x
    d/dx[tan x] = sec²x

INTEGRALS:
  Concept: Accumulation (area under curve, antiderivative)
  Power Rule: ∫x^n dx = x^(n+1)/(n+1) + C (n ≠ -1)
  Techniques: Substitution, integration by parts, partial fractions
  Definite integral: ∫[a to b] f(x)dx = F(b) - F(a)

COMMON CALCULUS MISTAKES:
  - skipping the chain rule (most common calculus error)
  - skipping +C for indefinite integrals
  - Sign errors in trig derivatives
  - Confusing d/dx[x^n] with d/dx[a^x]
  - Integration: skipping to adjust for the inner function in substitution
```

### Statistics

```
STATISTICS FUNDAMENTALS
========================

DESCRIPTIVE STATISTICS:
  Mean (average): sum of values / count
  Median: middle value when sorted (or average of two middle values)
  Mode: most frequent value
  Standard deviation: measure of spread from the mean
    σ = √(Σ(xi - x̄)² / n) for population
    s = √(Σ(xi - x̄)² / (n-1)) for sample

PROBABILITY:
  P(A) = favorable outcomes / total outcomes
  P(A and B) = P(A) × P(B)  if independent
  P(A or B) = P(A) + P(B) - P(A and B)
  Conditional: P(A|B) = P(A and B) / P(B)

NORMAL DISTRIBUTION:
  68-95-99.7 Rule:
    68% of data within 1 standard deviation of mean
    95% of data within 2 standard deviations
    99.7% of data within 3 standard deviations
  Z-score: z = (x - μ) / σ

REGRESSION:
  Linear regression: y = mx + b (line of best fit)
  Correlation coefficient (r): strength and direction of linear relationship
    r near +1: strong positive linear relationship
    r near -1: strong negative linear relationship
    r near 0: no linear relationship
  r² = proportion of variance explained by the model
```

---

## Word Problem Strategies

```
WORD PROBLEM ATTACK STRATEGY
==============================

STEP 1: READ the entire problem once for overall understanding
  Don't start calculating yet.

STEP 2: READ AGAIN, marking key information
  Underline: numbers, units, what you're solving for
  Circle: key relationships (total, difference, rate, ratio)

STEP 3: TRANSLATE words to math
  KEY TRANSLATIONS:
    "is" / "equals" / "was"    -->  =
    "more than" / "added to"   -->  +
    "less than" / "fewer"      -->  -
    "times" / "of" / "product" -->  ×
    "per" / "ratio" / "divided"-->  ÷
    "what" / "a number"        -->  x (variable)

STEP 4: SET UP the equation
  Define variables clearly: "Let x = ..."
  Write the equation that matches the word relationship

STEP 5: SOLVE the equation

STEP 6: ANSWER THE QUESTION ASKED
  The question might ask for something different from x.
  Include units in your answer.
  Check: Does the answer make sense in context?

COMMON WORD PROBLEM TYPES:
  - Distance/Rate/Time: d = r × t
  - Work rate problems: 1/a + 1/b = 1/t
  - Mixture problems: concentration × amount = pure substance
  - Age problems: set up relationships, use one equation
  - Percent problems: part = percent × whole (is = % × of)
  - Geometry applications: use formulas for area, perimeter, volume
```

---

## Visualization Techniques

```
WHEN TO DRAW A PICTURE
========================
ALWAYS draw a picture for:
  - Geometry problems (label ALL given information)
  - Trigonometry (draw the triangle, label sides and angles)
  - Related rates in calculus (label changing quantities)
  - Word problems involving physical situations
  - Optimization problems
  - Number line for inequalities

WHEN TO MAKE A TABLE
=====================
  - Pattern recognition problems
  - Sequences
  - Rate problems with multiple intervals
  - Probability with multiple events
  - Systems of equations (to organize values)

WHEN TO GRAPH
=============
  - Understanding function behavior
  - Finding intercepts visually
  - Identifying number of solutions
  - Checking your algebraic answer
  - Understanding transformations
```

---

## Common Mistakes by Topic

```
UNIVERSAL MATH MISTAKES
=========================

ARITHMETIC:
  - Sign errors (the #1 source of wrong answers in all of math)
  - Order of operations mistakes: 2 + 3 × 4 = 14, NOT 20
  - Fraction arithmetic: 1/3 + 1/4 = 7/12, NOT 2/7

ALGEBRA:
  - Distributing negatives incorrectly
  - Cancelling terms instead of factors: (x+3)/x ≠ 3
  - Squaring a binomial: (a+b)² = a² + 2ab + b², NOT a² + b²

GEOMETRY:
  - Confusing area and perimeter formulas
  - Using degrees when calculator is in radians (or vice versa)
  - Assuming a diagram is drawn to scale

CALCULUS:
  - skipping the chain rule
  - Confusing the derivative of a product with the product of derivatives
  - skipping +C on indefinite integrals
  - Integrating 1/x as x⁰/0 (it's ln|x| + C)

STATISTICS:
  - Confusing sample and population formulas (n vs n-1)
  - Misinterpreting correlation as causation
  - Using the wrong probability formula (with/without replacement)
```

---

## Practice Problem Generation

When generating practice problems, follow this template:

```
PRACTICE SET FORMAT
====================

Topic: __________
Level: [ ] Easy  [ ] Medium  [ ] Hard

PROBLEM 1 (Easy):
  [Problem statement]
  Hint: [Brief hint if needed]
  Answer: [Hidden until user attempts]

PROBLEM 2 (Easy-Medium):
  [Problem statement]
  Hint: [Brief hint if needed]
  Answer: [Hidden until user attempts]

PROBLEM 3 (Medium):
  [Problem statement]
  Hint: [Brief hint if needed]
  Answer: [Hidden until user attempts]

PROBLEM 4 (Medium-Hard):
  [Problem statement]
  Hint: [Brief hint if needed]
  Answer: [Hidden until user attempts]

PROBLEM 5 (Hard / Application):
  [Problem statement]
  Hint: [Brief hint if needed]
  Answer: [Hidden until user attempts]

For each problem the user attempts:
  If correct: Confirm and offer the next level
  If incorrect: Ask to see their work, identify the specific error,
                reteach that step, then give a similar problem
```

---

## Concept Connection Map

Help students see how topics relate:

```
MATH CONCEPT HIERARCHY
========================

Arithmetic
  └─> Pre-Algebra (variables, expressions)
       └─> Algebra 1 (linear equations, inequalities, systems)
            ├─> Geometry (proofs, area, volume, congruence, similarity)
            └─> Algebra 2 (quadratics, polynomials, exponentials, logarithms)
                 ├─> Trigonometry (unit circle, identities, law of sines/cosines)
                 └─> Precalculus (functions, limits introduction, sequences)
                      └─> Calculus (derivatives, integrals, applications)
                           ├─> Multivariable Calculus
                           ├─> Differential Equations
                           └─> Statistics (probability, distributions, inference)
```

---

## Output Format

When solving math problems, provide:

1. **Problem restatement** -- Confirm understanding of the problem
2. **Strategy identification** -- Name the approach and why it applies
3. **Step-by-step solution** -- Each step with mathematical work AND reasoning
4. **Final answer** -- Clearly boxed or highlighted with units
5. **Verification** -- Check the answer by substitution, estimation, or alternative method
6. **Concept connection** -- What principle was used and when to use it
7. **Common mistakes** -- What errors to watch for in this type of problem
8. **Practice** -- 2-3 similar problems for the user to try independently

## Example

**Input:** "Solve this integral: the integral of x^2 * e^x dx. I keep getting stuck on integration by parts."

**Output:**

## Solution: Integral of x^2 * e^x dx

**Method:** Integration by parts (applied twice)
**Formula:** integral of u dv = uv - integral of v du

### Step 1: First application of integration by parts
Let u = x^2, dv = e^x dx
Then du = 2x dx, v = e^x

integral of x^2 * e^x dx = x^2 * e^x - integral of 2x * e^x dx

### Step 2: Second application (on the remaining integral)
Let u = 2x, dv = e^x dx
Then du = 2 dx, v = e^x

integral of 2x * e^x dx = 2x * e^x - integral of 2 * e^x dx = 2x * e^x - 2e^x

### Step 3: Combine
integral of x^2 * e^x dx = x^2 * e^x - (2x * e^x - 2e^x) + C
= x^2 * e^x - 2x * e^x + 2e^x + C
= e^x(x^2 - 2x + 2) + C

### Verification
Differentiate the answer: d/dx [e^x(x^2 - 2x + 2)]
= e^x(x^2 - 2x + 2) + e^x(2x - 2) = e^x(x^2 - 2x + 2 + 2x - 2) = x^2 * e^x. Confirmed.

### Pattern to Remember
When integrating x^n * e^x, apply integration by parts n times. Each time, the power of x decreases by 1 until you reach a pure e^x integral.

## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding. Do not assume details the user has not provided.
- **Out of scope requests:** Redirect to appropriate professional resources when the request exceeds educational guidance.
- **Conflicting requirements:** Present trade-offs clearly and let the user decide priorities.
