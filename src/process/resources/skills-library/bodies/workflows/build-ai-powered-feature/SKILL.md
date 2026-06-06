---
name: build-ai-powered-feature
description: >-
  Workflow for integrating AI/ML capabilities into an existing product, from
  problem definition through data preparation, model selection, integration, and
  production monitoring. Covers both LLM-based features and traditional ML
  approaches with emphasis on responsible deployment and reliability.

  Use when the user wants to build ai powered feature or needs a structured
  multi-step process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: >-
  requirements-analyst prompt-engineer llm-integrator rag-architect
  feature-engineer ml-pipeline mlops-engineer model-evaluator
  monitoring-engineer ai-agent-builder security-auditor
trigger_phrases: >-
  I want to add AI to my product I need to build an AI feature How do I
  integrate an LLM into my app I want to add machine learning to my application
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: step-by-step planning
  category: software-project
  depends: >-
    requirements-analyst prompt-engineer llm-integrator rag-architect
    feature-engineer ml-pipeline mlops-engineer model-evaluator
    monitoring-engineer ai-agent-builder security-auditor
  disclaimer: none
  difficulty: advanced
---
# Build Ai Powered Feature

**Estimated time:** 4-10 weeks

Adding AI to a product is not about bolting on a chatbot -- it is about identifying where intelligence creates genuine value for users, then building reliable, safe, and cost-effective AI capabilities. This workflow covers both LLM-based features (summarization, classification, generation, conversation) and traditional ML features (recommendations, predictions, anomaly detection), guiding you from problem definition through production monitoring.

The workflow follows a pragmatic sequence: define the problem clearly, evaluate whether AI is the right solution, choose the approach (LLM vs traditional ML), build and evaluate the solution, integrate it into the product, and then monitor it in production. At each step, you are asked to validate that AI is still the right answer -- sometimes a well-crafted heuristic outperforms a model.

## When to Use

- User wants to build ai powered feature
- User needs a structured, step-by-step process for build ai powered feature
- User wants to add AI to my product
- I need to build an AI feature
- How do I integrate an LLM into my app
- Do NOT use when: the request is outside the scope of build ai powered feature or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- An existing product or application to integrate AI features into
- Clear user problem that might benefit from AI (not "add AI for AI's sake")
- Access to relevant data (user data, domain data, or training data)
- Cloud provider account with access to AI/ML services
- Budget for API costs or compute (LLM APIs: $50-500/month; custom models: $200-2000/month)
- At least one team member comfortable with Python and AI/ML concepts

## Steps

**Step 1: Define the Problem and Success Criteria** (uses: requirements-analyst)

clearly define the problem, not the solution. What user outcome are you trying to improve? Define measurable success criteria: task completion rate, time saved, accuracy required, acceptable latency, and cost per inference. Identify the failure modes: what happens when the AI is wrong, and what is the blast radius? Write acceptance criteria that distinguish between "AI working" and "AI providing value."

- Input: User pain points that might benefit from AI, Current solution (if any) and its limitations, Business metrics that the feature should impact
- Output: Problem statement (user-centric, not technology-centric), Success metrics with targets (accuracy, latency, cost), Failure mode analysis (what happens when AI is wrong)
- Key focus: Use the Requirements Analyst skill to clearly define the problem, not the solution

**Step 2: Choose the AI Approach** (uses: llm-integrator)

Evaluate three approaches: (1) LLM API (OpenAI, Anthropic, Google) for language tasks with prompt engineering, (2) pre-trained models with fine-tuning for domain-specific tasks, (3) custom ML models for structured data problems. assess API-based approaches and the ML Pipeline skill to evaluate custom model approaches. Choose based on data availability, accuracy requirements, latency constraints, and cost. Often, start with the simplest approach (LLM API) and only build custom models if needed.

- Input: Problem definition from Step 1, Available data (type, volume, quality), Latency and cost constraints
- Output: Approach comparison matrix (LLM API vs fine-tuned vs custom), Selected approach with rationale, Cost projection (per inference and monthly)
- Key focus: Evaluate three approaches: (1) LLM API (OpenAI, Anthropic, Google) for language tasks with prompt engineering, (2) pre-trained models with fine-tuning for domain-specific tasks, (3) custom ML models for structured data problems

**Step 3: Build the AI Component** (uses: prompt-engineer)

**For LLM-based features**: design system prompts, few-shot examples, and output parsing. If the feature needs domain knowledge, use the RAG Architect skill to build a retrieval-augmented generation pipeline with document chunking, embeddings, and vector search. **For custom ML features**: Use the Feature Engineer skill to prepare features and the ML Pipeline skill to build training, evaluation, and inference pipelines. In both cases, build evaluation datasets that represent real-world usage.

- Input: Selected approach from Step 2, Available data and data access, Accuracy and latency targets
- Output: AI component implementation (prompts, RAG pipeline, or ML model), Evaluation dataset (100+ examples covering edge cases), Evaluation results against success metrics
- Key focus: **For LLM-based features**: Use the Prompt Engineer skill to design system prompts, few-shot examples, and output parsing

**Step 4: Evaluate and Validate** (uses: model-evaluator)

rigorously evaluate the AI component. Go beyond aggregate metrics: analyze failure cases, check for bias across user segments, evaluate edge cases, and test adversarial inputs. For LLM features, evaluate hallucination rates and factual accuracy. For ML models, evaluate precision/recall tradeoffs for your specific use case. Conduct a human evaluation with real users (or domain experts as proxy) on a sample of 50+ outputs.

- Input: AI component from Step 3, Evaluation dataset, Success metrics from Step 1
- Output: Evaluation report with aggregate and segment-level metrics, Failure case analysis (categorized by type), Bias evaluation across user segments
- Key focus: Use the Model Evaluator skill to rigorously evaluate the AI component

**Step 5: Integrate into the Product** (uses: llm-integrator)

build production-grade integration: API abstraction (so you can swap providers), streaming responses for user-facing features, caching for repeated queries, retry logic with exponential backoff, and graceful degradation when the AI service is unavailable. If building an agentic feature, use the AI Agent Builder skill to design the agent loop, tool use, and guardrails. Implement rate limiting, cost controls, and content safety filters.

- Input: Validated AI component from Step 4, Product architecture and API layer, User experience requirements
- Output: Production integration code with provider abstraction, Caching layer for repeated or similar queries, Graceful degradation (fallback when AI is unavailable)
- Key focus: Use the LLM Integrator skill to build production-grade integration: API abstraction (so you can swap providers), streaming responses for user-facing features, caching for repeated queries, retry logic with exponential backoff, and graceful degradation when the AI service is unavailable

**Step 6: Secure the AI Feature** (uses: security-auditor)

audit AI-specific security risks: prompt injection attacks (direct and indirect), data exfiltration via prompts, PII leakage in AI outputs, model inversion risks, and unauthorized access to AI capabilities. Implement input sanitization, output filtering, and audit logging for all AI interactions. Ensure user data sent to AI providers complies with privacy policies.

- Input: Integrated feature from Step 5, User-facing inputs and outputs, Data privacy requirements
- Output: AI security audit report, Prompt injection test results and mitigations, PII detection and filtering rules
- Key focus: Use the Security Auditor skill to audit AI-specific security risks: prompt injection attacks (direct and indirect), data exfiltration via prompts, PII leakage in AI outputs, model inversion risks, and unauthorized access to AI capabilities

**Step 7: Deploy with Feature Flags and Monitor** (uses: mlops-engineer)

deploy the AI feature behind a feature flag for gradual rollout. Start with 5% of users, monitor key metrics, then increase to 25%, 50%, and 100%. Use the Monitoring Engineer skill to build AI-specific monitoring: inference latency, error rates, cost per request, output quality scores (automated where possible), and user feedback signals. Set up alerts for quality degradation, cost spikes, and latency increases.

- Input: Secured AI feature from Step 6, Deployment infrastructure, Monitoring requirements
- Output: Feature flag configuration for gradual rollout, AI-specific monitoring dashboard, Automated quality scoring pipeline
- Key focus: Use the MLOps Engineer skill to deploy the AI feature behind a feature flag for gradual rollout

## Decision Points

- **After Step ?:** 
  - If **After Step 1**: Reconsider whether AI is the right solution
  - If **After Step 2**: Explore alternative approaches or simplify the problem
  - If **After Step 4**: Iterate on AI component until targets are met
  - If **After Step 6**: Fix security issues before user exposure

## Failure Handling

- **Solution looking for a problem:** -- Starting with "let's add AI" rather than "this user problem would benefit from intelligence" leads to features nobody uses.
- **No evaluation dataset:** -- Without a rigorous evaluation set, you cannot measure improvement or catch regressions. Build this before building the feature.
- **Ignoring cost:** -- LLM API costs can surprise you at scale. Monitor cost per inference and implement caching, shorter prompts, and cheaper models where quality allows.
- **No fallback:** -- When the AI service is down or slow, the feature should degrade gracefully, not crash. Always have a non-AI fallback path.
- **Prompt injection blindness:** -- User-facing LLM features are vulnerable to prompt injection. Test adversarial inputs and implement input sanitization.

## Expected Outcome

When this workflow is complete, the user will have:

1. AI feature meets accuracy targets defined in Step 1
2. User engagement with the feature shows the intended outcome improvement
3. Cost per inference is within budget and trending down with optimization
4. AI failures are caught and handled gracefully (users never see raw errors)
5. Security audit passes with no critical findings
6. Business metrics improve measurably compared to control group

## Output Format

```
BUILD AI POWERED FEATURE TRACKER
================================

[ ] Step 1: Define the Problem and Success Criteria
    Status: [pending/in-progress/complete]
[ ] Step 2: Choose the AI Approach
    Status: [pending/in-progress/complete]
[ ] Step 3: Build the AI Component
    Status: [pending/in-progress/complete]
[ ] Step 4: Evaluate and Validate
    Status: [pending/in-progress/complete]
[ ] Step 5: Integrate into the Product
    Status: [pending/in-progress/complete]
[ ] Step 6: Secure the AI Feature
    Status: [pending/in-progress/complete]
[ ] Step 7: Deploy with Feature Flags and Monitor
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Solution looking for a problem:** -- Starting with "let's add AI" rather than "this user problem would benefit from intelligence" leads to features nobody uses.
- **No evaluation dataset:** -- Without a rigorous evaluation set, you cannot measure improvement or catch regressions. Build this before building the feature.
- **Ignoring cost:** -- LLM API costs can surprise you at scale. Monitor cost per inference and implement caching, shorter prompts, and cheaper models where quality allows.
- **No fallback:** -- When the AI service is down or slow, the feature should degrade gracefully, not crash. Always have a non-AI fallback path.

## Example

**Input:** "I want to build ai powered feature and need a structured plan to follow step by step."

**Output:**

**Step 1 (requirements-analyst):** Define the Problem and Success Criteria -- produces concrete deliverables for this phase.

**Step 2 (llm-integrator-ml-pipeline):** Choose the AI Approach -- produces concrete deliverables for this phase.

**Step 3 (prompt-engineer-rag-architect-feature-engineer-ml-pipeline):** Build the AI Component -- produces concrete deliverables for this phase.

**Step 4 (model-evaluator):** Evaluate and Validate -- produces concrete deliverables for this phase.

**Step 5 (llm-integrator-ai-agent-builder):** Integrate into the Product -- produces concrete deliverables for this phase.

**Step 6 (security-auditor):** Secure the AI Feature -- produces concrete deliverables for this phase.

**Step 7 (mlops-engineer-monitoring-engineer):** Deploy with Feature Flags and Monitor -- produces concrete deliverables for this phase.

**Result:** User has a complete build ai powered feature plan with all deliverables produced, validated, and ready for implementation.
