---
name: ai-prompt-crafter
description: |
  Advanced prompting techniques for any AI model covering system prompts, chain-of-thought reasoning, few-shot examples, structured output formats, context management, multi-turn conversation strategies, and a reusable prompt template library.
  Use when the user asks about ai prompt crafter, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of ai prompt crafter or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "ai-ml template step-by-step beginner-friendly advanced api-design automation analysis"
  category: "ai-machine-learning"
  subcategory: "llm-engineering"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# AI Prompt Crafter


## When to Use

**Use this skill when:**
- User asks about ai prompt crafter techniques or best practices
- User needs guidance on ai prompt crafter concepts
- User wants to implement or improve their approach to ai prompt crafter

**Do NOT use when:**
- The request falls outside the scope of ai prompt crafter
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask First

Before crafting any prompt strategy, establish context:

1. What AI model(s) are you primarily working with? (ChatGPT, Claude, Gemini, Llama, Mistral)
2. What is the primary use case? (Writing, coding, analysis, creative, research, automation)
3. What is your technical comfort level? (Beginner, intermediate, power user, developer)
4. Are you prompting through a chat interface, API, or integrated tool?
5. What quality bar do you need? (Quick drafts vs publication-ready vs mission-critical)
6. Are you working with sensitive or confidential information?
7. Do you need consistent, repeatable outputs or creative variety?
8. What has frustrated you about AI outputs so far? Where does it fail?

## Prompting Fundamentals

### The CRAFT Framework

Every strong prompt contains these elements:

- **C**ontext: Background information the AI needs
- **R**ole: Who the AI should act as
- **A**ction: What specifically you want it to do
- **F**ormat: How the output should be structured
- **T**one: The voice and style of the response

### Prompt Quality Spectrum

```
BAD:    "Write me a marketing email"
BETTER: "Write a marketing email for our SaaS product launch"
GOOD:   "Write a marketing email announcing our project management
         tool to small business owners. Tone: professional but
         friendly. Include a subject line, 3 key benefits,
         and a CTA to start a free trial. Keep under 200 words."
GREAT:  [Includes all of the above plus a system prompt with
         brand voice guidelines, 2 examples of previous emails
         that performed well, and specific constraints]
```

## System Prompts

### What System Prompts Do

System prompts set the persistent context and behavior for an AI conversation. They act as a "configuration file" that shapes every response.

### System Prompt Template

```
You are [role/identity].

Your expertise includes:
- [Skill/knowledge area 1]
- [Skill/knowledge area 2]

Your communication style:
- [Tone characteristic]
- [Format preference]

Rules you must follow:
- [Constraint 1]
- [Constraint 2]

When you don't know something:
- [How to handle uncertainty]

Context about the user/project:
- [Relevant background information]
```

### Example: Technical Writing Assistant

```
You are a senior technical writer with 15 years of experience
in software documentation. You write for developer audiences.

Style: Active voice. One idea per sentence. Define acronyms
on first use. Use code blocks for code references. Prefer
concrete examples over abstract explanations.

Format: H2/H3 headers for structure. Code examples for any
technical concept. "Note:" callouts for warnings. Paragraphs
under 4 sentences. If ambiguous, ask clarifying questions.
```

## Chain-of-Thought Prompting

### What It Is

Chain-of-thought (CoT) prompting asks the AI to show its reasoning step by step before arriving at a conclusion. This dramatically improves accuracy on complex tasks.

### When to Use

- Mathematical or logical reasoning
- Multi-step analysis or complex decision-making
- Debugging and troubleshooting
- Comparing multiple options

### CoT Prompt Patterns

**Explicit CoT:**
```
Analyze whether this business should enter the European market.

Think through this step by step:
1. Assess current market conditions in Europe for this product
2. Evaluate the company's readiness (resources, team, product-market fit)
3. Identify the top 3 risks and mitigations
4. Estimate financial implications (costs, timeline to profitability)
5. Give your recommendation with a confidence level

Show your reasoning for each step.
```

**Zero-shot CoT (simple trigger):**
```
[Your question or task]

Let's work through this step by step.
```

**Structured CoT:**
```
Organize your thinking into:
- OBSERVATIONS: What do we know from the given information?
- ASSUMPTIONS: What are we assuming?
- ANALYSIS: What does the evidence suggest?
- CONCLUSION: What is the answer, and how confident are we?
```

## Few-Shot Prompting

### What It Is

Few-shot prompting provides the AI with examples of the desired input-output pattern before asking it to perform the task. One of the most powerful techniques for consistent, formatted outputs.

### Few-Shot Template

```
I need you to [task description]. Here are examples:

Example 1:
Input: [example input 1]
Output: [example output 1]

Example 2:
Input: [example input 2]
Output: [example output 2]

Now do the same for:
Input: [your actual input]
Output:
```

### Best Practices

1. **Use 2-5 examples** (diminishing returns after 5)
2. **Cover edge cases** (don't just show the happy path)
3. **Keep examples consistent** in format and quality
4. **Order matters**: Put the most representative example last
5. **Vary your examples**: Show different scenarios to help the AI generalize

## Structured Output

### Forcing Specific Output Formats

**JSON Output:**
```
Analyze this product review and return as JSON:
{
  "sentiment": "positive" | "negative" | "mixed",
  "confidence": 0.0-1.0,
  "key_themes": ["theme1", "theme2"],
  "summary": "one sentence summary"
}

Review: [paste review text]
```

**Table Output:**
```
Compare these 5 tools across these dimensions.
Return as a markdown table:
Columns: Tool Name | Free Tier | Best For | Key Limitation | Rating (1-5)
```

### Common Output Constraints

```
Length:    "Keep your response under 200 words"
Format:   "Use markdown headers, bullets, and code blocks"
Structure: "Use the following template: [template]"
Language:  "Write at an 8th-grade reading level"
Exclusion: "Do not include disclaimers or caveats"
Inclusion: "Must include at least 3 specific examples"
```

## Context Management

### The Context Window Challenge

Every AI model has a limited context window. Managing context effectively is critical for complex tasks.

### Context Prioritization

```
HIGHEST PRIORITY (always include):
  - The specific task/question
  - Critical constraints and requirements
  - Most relevant examples

HIGH PRIORITY (include when space allows):
  - Background context
  - Previous relevant conversation

MEDIUM/LOW PRIORITY (summarize or omit):
  - Supplementary information, edge cases
  - General knowledge the AI already has
```

### Techniques for Long Documents

- **Chunking:** Split into logical sections, process each independently, summarize, then synthesize
- **Progressive summarization:** Summarize long doc -> identify key arguments -> drill into specific sections
- **Reference and retrieve:** Share document in sections, have AI extract key facts, then ask questions

## Multi-Turn Conversation Strategies

### Building on Previous Responses

**Refinement Loop:**
```
Turn 1: Initial generation (broad prompt)
Turn 2: "Expand section 3 with more detail"
Turn 3: "Make the tone more conversational"
Turn 4: "Add a conclusion that ties back to the opening"
Turn 5: "Fix any inconsistencies and polish"
```

**Interview Method:**
```
Turn 1: "I need help with [topic]. Before you start, ask me
         5 questions that will help you give better advice."
Turn 2: [Answer the AI's questions]
Turn 3: "Based on my answers, provide your recommendations."
```

### Maintaining Quality Over Multiple Turns

1. **Periodically recap**: "To summarize where we are: [summary]"
2. **Reset context**: "Set aside the tangent about X. Refocus on Y."
3. **Be explicit**: "In your last response, you mentioned [point]. Expand on that."
4. **Number iterations**: "This is revision 3. Here's what still needs work..."

## Prompt Template Library

### Template: Content Creator

```
Role: Experienced content creator and strategist.
Task: Create a [content type] about [topic] for [audience].
Tone: [professional / casual / authoritative / friendly]
Length: [word count]   Platform: [where published]
Goal: [what this should achieve]   Keywords: [list]
Examples of similar content I've liked: [optional]
```

### Template: Code Generation

```
Language: [language]   Framework: [if applicable]
Task: [what the code should do]
Requirements: [functional requirements]
Constraints: [performance, security, style]
Include: Code with comments, brief explanation, example usage, caveats
```

### Template: Analysis and Research

```
Analyze [subject] with focus on: [objective]
Framework: [specific framework or lenses]
Deliverable: Executive summary, detailed analysis, key findings
(ranked), recommendations with confidence levels, risks/caveats
```

## Advanced Techniques

### Prompt Chaining

Use the output of one prompt as input for the next:
```
Chain 1: "Generate 10 blog post title ideas about [topic]"
Chain 2: "For title #3, create a detailed outline"
Chain 3: "Write section 2 of this outline in full"
Chain 4: "Review and suggest improvements"
```

### Role-Playing for Better Outputs

```
"You are three experts debating this topic:
- Expert A: A skeptical data scientist who wants evidence
- Expert B: A creative marketer who thinks about narrative
- Expert C: A pragmatic CEO who cares about ROI

Have them discuss [topic] and reach a consensus recommendation."
```

### Meta-Prompting

```
"I need to create a prompt for [task]. Generate a prompt that
includes all necessary context, uses the most effective technique,
specifies output format, and includes relevant constraints.
Also explain why you chose this approach."
```

### Negative Prompting

Tell the AI what NOT to do:
```
Do NOT: Use cliches, start with "In today's digital age...",
include generic disclaimers, use passive voice, pad with
unnecessary words, or list obvious information.
```

## Troubleshooting Common Issues

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| Output too generic | Prompt too vague | Add specific context, examples, constraints |
| Output too long | No length constraint | Specify word count or section limits |
| Inconsistent format | No format specification | Provide a template or examples |
| Hallucinated facts | Requires specific knowledge | Ask AI to flag uncertainty |
| Ignoring instructions | Too many instructions | Prioritize and number instructions |
| Wrong tone | No tone guidance | Include explicit tone instructions with example |
| Shallow analysis | No depth instruction | Ask for step-by-step reasoning |


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to ai prompt crafter
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Ai Prompt Crafter Analysis

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

**Input:** "Help me with ai prompt crafter for my current situation"

**Output:**

Based on your situation, here is a structured approach to ai prompt crafter:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
