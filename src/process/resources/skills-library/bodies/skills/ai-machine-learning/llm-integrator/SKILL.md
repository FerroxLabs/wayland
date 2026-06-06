---
name: llm-integrator
description: |
  LLM API integration covering OpenAI, Anthropic, and Google API patterns, streaming responses, function calling and tool use, token counting, cost optimization, fallback strategies, rate limit handling, response caching, and multi-model routing.
  Use when the user asks about llm integrator, llm integrator best practices, or needs guidance on llm integrator implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "ai-ml deep-learning guide"
  category: "ai-machine-learning"
  subcategory: "llm-engineering"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# LLM Integrator

## Overview

Integrating LLMs into production applications requires robust API handling, cost management, and reliability patterns. This skill covers practical integration with major LLM providers, including streaming, tool use, error handling, and multi-model architectures for production systems.

## Provider API Patterns

### OpenAI

```python
from openai import OpenAI, AsyncOpenAI

client = OpenAI(api_key=environment-variables["OPENAI_API_KEY"])

# Basic completion
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Explain quantum computing."},
    ],
    # ... (condensed) ...
        for p in prompts
    ]
    responses = await asyncio.gather(*tasks)
    return [r.choices[0].message.content for r in responses]
```

### Anthropic

```python
from anthropic import Anthropic, AsyncAnthropic

client = Anthropic(api_key=environment-variables["ANTHROPIC_API_KEY"])

response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    system="You are an expert software architect.",
    messages=[
        {"role": "user", "content": "Design a microservices architecture for e-commerce."},
    ],
# ... (condensed) ...
    if block.type == "thinking":
        print(f"Thinking: {block.thinking}")
    elif block.type == "text":
        print(f"Answer: {block.text}")
```

### Google Gemini

```python
import google.generativeai as genai

genai.configure(api_key=environment-variables["GOOGLE_API_KEY"])
model = genai.GenerativeModel("gemini-2.0-flash")

response = model.generate_content("Explain neural networks.")
print(response.text)

# Multi-modal input
import PIL.Image
image = PIL.Image.open("diagram.png")
response = model.generate_content(["Describe this diagram:", image])
print(response.text)
```

## Streaming Responses

### OpenAI Streaming

```python
def stream_openai(prompt: str):
    """Stream response tokens as they are generated."""
    stream = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        stream=True,
    )

    full_response = ""
    for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            full_response += delta
            print(delta, end="", flush=True)

    return full_response
```

### Anthropic Streaming

```python
def stream_anthropic(prompt: str):
    """Stream with Anthropic's event-based API."""
    with client.messages.stream(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        full_response = ""
        for text in stream.text_stream:
            full_response += text
            print(text, end="", flush=True)

    return full_response
```

### Server-Sent Events (SSE) for Web Apps

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse

app = FastAPI()

@app.get("/chat/stream")
async def chat_stream(prompt: str):
    async def event_generator():
        async with async_client.messages.stream(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            # ... (condensed) ...
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
    )
```

## Function Calling / Tool Use

### OpenAI Function Calling

```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get current weather for a location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        # ... (condensed) ...
                    "content": json.dumps(result),
                })
        else:
            return message.content
```

### Anthropic Tool Use

```python
tools = [
    {
        "name": "get_weather",
        "description": "Get current weather for a location",
        "input_schema": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "City and state"
                }
            # ... (condensed) ...
            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": tool_results})
        else:
            return next(b.text for b in response.content if b.type == "text")
```

## Token Counting and Cost Management

### Token Counting

```python
import tiktoken

class TokenCounter:
    """Count tokens for OpenAI models."""

    COST_PER_1M = {
        "gpt-4o":       {"input": 2.50, "output": 10.00},
        "gpt-4o-mini":  {"input": 0.15, "output": 0.60},
        "gpt-4-turbo":  {"input": 10.00, "output": 30.00},
    }

    # ... (condensed) ...
        return (
            input_tokens * costs["input"] / 1_000_000 +
            output_tokens * costs["output"] / 1_000_000
        )
```

### Cost Optimization Strategies

```python
class CostOptimizedClient:
    """Route requests to minimize cost while maintaining quality."""

    def __init__(self):
        self.openai = OpenAI()
        self.anthropic = Anthropic()
        self.token_counter = TokenCounter()

    def complete(
        self,
        prompt: str,
        # ... (condensed) ...
            for kw in ["architecture", "complex", "multi-step"]
        ):
            return "complex"
        return "medium"
```

## Rate Limit Handling

### Retry with Exponential Backoff

```python
import time
from tenacity import (
    retry, stop_after_attempt, wait_exponential,
    retry_if_exception_type,
)
from openai import RateLimitError, APITimeoutError, InternalServerError

@retry(
    retry=retry_if_exception_type((RateLimitError, APITimeoutError, InternalServerError)),
    wait=wait_exponential(multiplier=1, min=1, max=60),
    stop=stop_after_attempt(6),
    # ... (condensed) ...
)
def resilient_completion(client, **kwargs):
    """LLM call with automatic retry on transient errors."""
    return client.chat.completions.create(**kwargs)
```

### Token Bucket Rate Limiter

```python
import asyncio
import time

class TokenBucketRateLimiter:
    """Rate limiter for API calls respecting tokens-per-minute limits."""

    def __init__(self, tokens_per_minute: int, requests_per_minute: int):
        self.tpm = tokens_per_minute
        self.rpm = requests_per_minute
        self.token_bucket = tokens_per_minute
        self.request_bucket = requests_per_minute
        # ... (condensed) ...
            self.rpm,
            self.request_bucket + elapsed * self.rpm / 60
        )
        self.last_refill = now
```

## Fallback Strategies

### Multi-Provider Fallback

```python
class LLMRouter:
    """Route LLM calls with automatic fallback across providers."""

    def __init__(self):
        self.providers = [
            {
                "name": "openai",
                "client": OpenAI(),
                "model": "gpt-4o",
                "priority": 1,
                "healthy": True,
                # ... (condensed) ...
                max_tokens=kwargs.get("max_tokens", 1024),
                messages=messages,
            )
            return resp.content[0].text
```

## Response Caching

### Semantic Cache

```python
import hashlib
import json
import redis

class LLMCache:
    """Cache LLM responses with exact matching."""

    def __init__(self, redis_url: str, ttl: int = 86400):
        self.redis = redis.from_url(redis_url)
        self.ttl = ttl

    # ... (condensed) ...
        result = response.choices[0].message.content

        self.set(messages, model, result)
        return result
```

## Multi-Model Routing

### Complexity-Based Router

```python
class SmartRouter:
    """Route requests to optimal model based on task analysis."""

    MODEL_CONFIGS = {
        "fast_cheap": {
            "provider": "openai",
            "model": "gpt-4o-mini",
            "max_tokens": 1024,
            "cost_input": 0.15,
            "cost_output": 0.60,
        },
        # ... (condensed) ...
        )
        classification = resp.choices[0].message.content.strip().lower()
        mapping = {"simple": "fast_cheap", "medium": "balanced", "complex": "max_quality"}
        return mapping.get(classification, "balanced")
```

## Production Architecture

### Complete Integration Layer

```python
class LLMService:
    """Production-ready LLM service with all reliability patterns."""

    def __init__(self, config: dict):
        self.router = SmartRouter()
        self.cache = LLMCache(config["redis_url"])
        self.rate_limiter = TokenBucketRateLimiter(
            tokens_per_minute=config["tpm"],
            requests_per_minute=config["rpm"],
        )
        self.fallback = LLMRouter()
        # ... (condensed) ...
        self.metrics.record("latency", latency)
        self.metrics.record("model_used", config["model"])

        return result
```

## Checklist

- [ ] Set up API clients for all required providers with proper auth
- [ ] Implement streaming for user-facing interactions
- [ ] Add function calling / tool use for agentic workflows
- [ ] Build token counting for cost estimation before calls
- [ ] Configure retry logic with exponential backoff for transient errors
- [ ] Implement multi-provider fallback chain
- [ ] Add response caching for repeated queries
- [ ] Set up rate limiting to respect API quotas
- [ ] Build cost monitoring and alerting
- [ ] Route requests to optimal model based on task complexity
- [ ] Log all API calls for debugging and cost analysis
- [ ] Test failover paths regularly

## When to Use

**Use this skill when:**
- Designing or implementing llm integrator solutions
- Reviewing or improving existing llm integrator approaches
- Making architectural or implementation decisions about llm integrator
- Learning llm integrator patterns and best practices
- Troubleshooting llm integrator-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Llm Integrator Analysis

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

**Input:** "Help me implement llm integrator for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended llm integrator approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When llm integrator must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
