---
name: ai-agent-builder
description: |
  AI agent architecture covering agent patterns (ReAct, Plan-and-Execute, LATS), tool design, memory systems (short-term, long-term, episodic), multi-agent coordination, guardrails, LangChain and LangGraph patterns, and error recovery.
  Use when the user asks about ai agent builder, ai agent builder best practices, or needs guidance on ai agent builder implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "ai-ml automation guide"
  category: "ai-machine-learning"
  subcategory: "applied-ai"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# AI Agent Builder

## Overview

AI agents are systems that use LLMs as reasoning engines to accomplish goals through iterative tool use, planning, and self-correction. This skill covers agent architecture patterns, tool design, memory systems, multi-agent coordination, and production safeguards.

## Agent Architecture Patterns

### ReAct (Reasoning + Acting)

The most fundamental agent pattern. The LLM alternates between reasoning (thinking) and acting (tool use) in a loop.

```
Observation: [User question or tool result]
Thought: [Reasoning about what to do next]
Action: [Tool name and input]
Observation: [Tool result]
Thought: [Reasoning about the result]
... (repeat until done)
Answer: [Final response]
```

```python
class ReActAgent:
    """Simple ReAct agent implementation."""

    def __init__(self, client, tools: dict, system_prompt: str, max_steps: int = 10):
        self.client = client
        self.tools = tools  # {"tool_name": callable}
        self.system_prompt = system_prompt
        self.max_steps = max_steps

    def run(self, user_message: str) -> str:
        messages = [
            # ... (condensed) ...
            result = self.tools[name](**args)
            return {"result": result}
        except Exception as e:
            return {"error": str(e)}
```

### Plan-and-Execute

Separates planning from execution. First create a plan, then execute each step.

```python
class PlanAndExecuteAgent:
    """Agent that creates a plan first, then executes step by step."""

    def __init__(self, client, tools: dict):
        self.client = client
        self.tools = tools
        self.planner_model = "gpt-4o"
        self.executor_model = "gpt-4o-mini"

    def run(self, task: str) -> str:
        # Step 1: Create plan
        # ... (condensed) ...
            tools=self._format_tools(),
        )

        return self._process_response(response)
```

### LATS (Language Agent Tree Search)

Uses tree search with self-reflection to explore multiple reasoning paths.

```python
class LATSAgent:
    """Language Agent Tree Search: explore multiple paths with backtracking."""

    def __init__(self, client, tools: dict, max_depth: int = 5, n_branches: int = 3):
        self.client = client
        self.tools = tools
        self.max_depth = max_depth
        self.n_branches = n_branches

    def run(self, task: str) -> str:
        root = {"state": task, "children": [], "score": 0, "depth": 0}
        # ... (condensed) ...
        try:
            return float(response.choices[0].message.content.strip())
        except ValueError:
            return 5.0
```

## Tool Design

### Principles

1. **Single responsibility**: Each tool does one thing well
2. **Clear descriptions**: LLMs select tools based on descriptions
3. **Typed parameters**: Use JSON Schema for input validation
4. **Graceful errors**: Return structured error messages, never crash
5. **Bounded scope**: Limit what tools can access/modify

### Tool Definition Pattern

```python
from dataclasses import dataclass
from typing import Any, Callable

@dataclass
class Tool:
    name: str
    description: str
    parameters: dict  # JSON Schema
    function: Callable
    requires_confirmation: bool = False

# ... (condensed) ...
        function=readonly_db_query,
    )

    return tools
```

### Tool Output Standards

```python
def standardize_tool_output(result: Any, max_length: int = 5000) -> str:
    """Standardize tool output for the LLM context."""
    if isinstance(result, dict) and "error" in result:
        return json.dumps({"status": "error", "message": result["error"]})

    output = json.dumps(result, indent=2, default=str)

    # Truncate if too long
    if len(output) > max_length:
        output = output[:max_length] + "\n... [truncated]"

    return output
```

## Memory Systems

### Short-Term Memory (Conversation Buffer)

```python
class ConversationMemory:
    """Sliding window conversation memory."""

    def __init__(self, max_tokens: int = 8000):
        self.messages: list[dict] = []
        self.max_tokens = max_tokens

    def add(self, message: dict):
        self.messages.append(message)
        self._trim()

    # ... (condensed) ...
            self.messages.pop(1)  # Remove second message (oldest non-system)

    def _total_tokens(self) -> int:
        return sum(count_tokens(json.dumps(m)) for m in self.messages)
```

### Long-Term Memory (Vector Store)

```python
class LongTermMemory:
    """Persistent memory using vector similarity search."""

    def __init__(self, embedding_fn, vector_store):
        self.embed = embedding_fn
        self.store = vector_store

    def remember(self, content: str, metadata: dict = None):
        """Store a memory."""
        embedding = self.embed(content)
        self.store.upsert({
            # ... (condensed) ...
            top_k=top_k,
            include_metadata=True,
        )
        return [r["metadata"]["content"] for r in results["matches"]]
```

### Episodic Memory (Experience Replay)

```python
class EpisodicMemory:
    """Store and get complete task episodes for learning."""

    def __init__(self):
        self.episodes: list[dict] = []

    def record_episode(self, task: str, steps: list[dict], outcome: str, success: bool):
        """Record a complete task episode."""
        self.episodes.append({
            "task": task,
            "steps": steps,
            # ... (condensed) ...
                    f"Successful approach:\n{steps_text}\n"
                    f"Outcome: {ep['outcome']}"
                )
        return "\n\n".join(examples)
```

## Multi-Agent Coordination

### Supervisor Pattern

```python
class SupervisorAgent:
    """Coordinator that delegates to specialized sub-agents."""

    def __init__(self, client):
        self.client = client
        self.agents = {
            "researcher": ResearchAgent(client),
            "coder": CodingAgent(client),
            "writer": WritingAgent(client),
            "reviewer": ReviewAgent(client),
        }
# ... (condensed) ...
- reviewer: Reviews work for quality and accuracy

Delegate tasks to the appropriate agent. You may delegate to multiple
agents in sequence. Synthesize their outputs into a final response."""
```

### LangGraph Multi-Agent

```python
from langgraph.graph import StateGraph, MessagesState, START, END

def build_multi_agent_graph():
    """Build a multi-agent workflow with LangGraph."""

    graph = StateGraph(MessagesState)

    # Define agent nodes
    graph.add_node("planner", planner_agent)
    graph.add_node("researcher", researcher_agent)
    graph.add_node("writer", writer_agent)
    # ... (condensed) ...
        }
    )

    return graph.compile()
```

## Guardrails

### Input Validation

```python
class AgentGuardrails:
    """Safety checks for agent inputs and outputs."""

    BLOCKED_ACTIONS = [
        "delete_database",
        "send_email",
        "modify_production",
    ]

    DANGEROUS_SQL_KEYWORDS = ["DROP", "DELETE", "UPDATE", "INSERT", "ALTER"]

    # ... (condensed) ...
        """Validate agent output before returning to user."""
        if contains_pii(output):
            return False, "Output contains PII that should be redacted."
        return True, "OK"
```

### Cost and Iteration Limits

```python
class AgentBudget:
    """Track and enforce agent resource budgets."""

    def __init__(self, max_steps: int = 20, max_cost: float = 1.0):
        self.max_steps = max_steps
        self.max_cost = max_cost
        self.current_steps = 0
        self.current_cost = 0.0

    def can_continue(self) -> tuple[bool, str]:
        if self.current_steps >= self.max_steps:
            # ... (condensed) ...

    def record_step(self, input_tokens: int, output_tokens: int, model: str):
        self.current_steps += 1
        self.current_cost += estimate_cost(input_tokens, output_tokens, model)
```

## Error Recovery

### Retry with Reflection

```python
class ErrorRecoveryAgent:
    """Agent that learns from errors and retries with reflection."""

    def run_with_recovery(self, task: str, max_retries: int = 3) -> str:
        errors = []

        for attempt in range(max_retries + 1):
            try:
                if errors:
                    augmented_task = self._augment_with_errors(task, errors)
                    result = self.agent.run(augmented_task)
                # ... (condensed) ...
            f"IMPORTANT: Previous attempts failed with these errors:\n"
            f"{error_context}\n\n"
            f"Avoid repeating these mistakes."
        )
```

## Observability

### Agent Tracing

```python
import time
from dataclasses import dataclass, field

@dataclass
class AgentTrace:
    """Complete trace of an agent run for debugging."""
    task: str
    steps: list[dict] = field(default_factory=list)
    total_tokens: int = 0
    total_cost: float = 0.0
    start_time: float = field(default_factory=time.time)
    # ... (condensed) ...
            "total_cost": self.total_cost,
            "duration_seconds": self.end_time - self.start_time,
            "n_steps": len(self.steps),
        }
```

## Checklist

- [ ] Choose agent pattern (ReAct for simple, Plan-and-Execute for complex)
- [ ] Design tools with clear descriptions, typed parameters, and error handling
- [ ] Implement appropriate memory system (short-term, long-term, or both)
- [ ] Add guardrails for input validation and output safety
- [ ] Set budget limits (steps, cost, time)
- [ ] Implement error recovery with reflection
- [ ] Add observability (log every agent step, tool call, and decision)
- [ ] Test with adversarial inputs and edge cases
- [ ] Consider multi-agent architecture for complex workflows
- [ ] Monitor agent performance and cost in production
- [ ] Implement human-in-the-loop for high-stakes actions

## When to Use

**Use this skill when:**
- Designing or implementing ai agent builder solutions
- Reviewing or improving existing ai agent builder approaches
- Making architectural or implementation decisions about ai agent builder
- Learning ai agent builder patterns and best practices
- Troubleshooting ai agent builder-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Ai Agent Builder Analysis

## Context Assessment
[Situation summary and constraints]

## Recommended Approach
[Primary recommendation with rationale]

## Implementation Steps
1. [Step with specific details]
2. [Step with specific details]
3. [Step with specific details]

## Trade-offs and Considerations
- [Key trade-off 1]
- [Key trade-off 2]

## Next Steps
- [Immediate action item]
- [Follow-up action item]
```

## Example

**Input:** "Help me implement ai agent builder for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended ai agent builder approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When ai agent builder must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
