---
name: design-patterns-catalog
description: |
  Guides expert-level design patterns catalog implementation: design-patterns and clean-code decision frameworks, production-ready patterns, and concrete templates for design patterns catalog workflows.
  Use when the user asks about design patterns catalog, design patterns catalog configuration, or design-patterns best practices for design projects.
  Do NOT use when the user needs a different architecture design capability -- check sibling skills in the architecture design subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "design-patterns clean-code architecture"
  category: "software-engineering"
  subcategory: "architecture-design"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Design Patterns Catalog

## When to Use

**Use this skill when:**
- A user needs to select the right design pattern for a specific structural or behavioral problem in their codebase (e.g., "I have objects that need to notify each other without tight coupling")
- A user is performing a code review or refactoring and wants to identify which canonical pattern applies to an existing implementation so they can align it with established conventions
- A user is designing a new system component and needs a catalog-driven decision framework to choose between competing patterns (e.g., Factory vs. Abstract Factory vs. Builder for object construction)
- A user wants to understand the trade-offs between patterns that solve similar problems -- such as Strategy vs. State vs. Command for behavioral variation
- A user is creating internal architecture documentation or an Architecture Decision Record (ADR) and needs the formal name, intent, and structure of a pattern to reference precisely
- A user is onboarding engineers and wants to build a team-specific design pattern guide grounded in the Gang of Four (GoF) catalog, POSA, or domain-driven design (DDD) patterns
- A user asks to identify a pattern from a code snippet or class diagram and explain what problem it solves

**Do NOT use this skill when:**
- The user needs guidance on system-level architectural styles like microservices, event-driven architecture, or CQRS -- use the system-architecture skill instead
- The user needs concrete refactoring mechanics (extract method, inline variable, replace conditional with polymorphism) -- use the refactoring skill instead
- The user is asking about database normalization patterns, query optimization, or schema design -- use the database-design skill
- The user needs API design guidance (REST resource modeling, GraphQL schema design, versioning strategies) -- use the api-design skill
- The user is asking about concurrency primitives (locks, semaphores, actor model) at the operating system or runtime level rather than at the object design level
- The user is asking about infrastructure or deployment patterns (blue-green deployment, sidecar containers, circuit breakers in service meshes) -- use the infrastructure-patterns skill

---

## Process

### 1. Identify the Problem Category and Intent

Before naming or recommending any pattern, precisely classify the problem the user is trying to solve.

- Determine which of the three canonical categories applies: **Creational** (how objects are constructed and configured), **Structural** (how objects and classes are composed into larger structures), or **Behavioral** (how objects communicate and distribute responsibility)
- Extract the core pain point the user is experiencing: tight coupling, rigid hierarchies, combinatorial subclass explosion, fragile switch statements, inability to vary algorithms independently, difficulty unit testing, etc.
- Ask clarifying questions if the category is ambiguous -- for example, "Is the problem about creating the right object type, or about varying what that object does at runtime?"
- Identify the programming paradigm in use (OOP, functional, or hybrid) because several GoF patterns have idiomatic functional equivalents (Strategy becomes first-class functions, Command becomes lambdas/closures)
- Confirm the language and ecosystem because some patterns have language-native implementations (e.g., Iterator is built into Python's `__iter__`/`__next__` protocol, Observer maps directly to C# events/delegates)

### 2. Narrow the Candidate Patterns Using the Decision Framework

Apply a structured decision tree to filter from the full catalog to 2-3 genuine candidates.

- **Object creation problems:** Start with Simple Factory for single-type creation with conditional logic. Escalate to Factory Method when subclasses must control what gets instantiated. Escalate to Abstract Factory when the system must remain independent of how families of related objects are created. Use Builder when construction requires more than 4-5 parameters, has optional fields, or produces objects in multiple valid configurations. Use Prototype when cloning a configured object is cheaper than constructing from scratch (especially when initialization is expensive).
- **Structural composition problems:** Use Adapter when interface mismatch prevents collaboration between two existing classes. Use Facade when a subsystem has too many entry points and a simplified interface suffices for most callers. Use Decorator when behavior must be added to individual objects without altering the class and stacking multiple behaviors is required. Use Composite when you need to treat individual objects and trees of objects uniformly. Use Bridge when abstraction and implementation must vary independently to avoid a multiplicative subclass explosion (n abstractions × m implementations = n+m classes instead of n×m).
- **Behavioral variation problems:** Use Strategy when the algorithm is interchangeable and the caller should remain unaware of the implementation. Use State when an object changes behavior based on internal state transitions and those transitions follow a defined state machine. Use Command when operations must be queued, logged, undone, or remoted. Use Template Method when the skeleton of an algorithm is fixed but specific steps must be overridden by subclasses. Use Observer when an event source must notify an open-ended list of dependents without knowing their types.
- **Cross-cutting access problems:** Use Singleton only when a single instance is architecturally required AND global access is necessary -- not merely convenient. Use Proxy when access control, lazy initialization, logging, or remote access needs to be interposed transparently. Use Flyweight when a very large number of fine-grained objects (thousands to millions) share extrinsic state and memory is constrained.

### 3. Present the Pattern Catalog Entry

For the recommended pattern(s), provide a complete, structured catalog entry.

- **Intent:** One or two sentences precisely stating what problem the pattern solves
- **Also Known As:** List alternate names (e.g., Policy for Strategy, Wrapper for Adapter/Decorator, Handle/Body for Bridge)
- **Motivation:** A concrete scenario with domain context that illustrates why the pattern is needed -- not an abstract description
- **Applicability:** Explicit conditions under which this pattern is the right choice, and conditions under which it is not
- **Structure:** Describe the participants (roles), their responsibilities, and the collaboration sequence. Use UML class diagram notation in ASCII or describe it textually with precision (class names, method signatures, relationships)
- **Consequences:** List specific benefits AND liabilities. Never omit the trade-offs. For example: Decorator adds flexibility but makes it harder to inspect what an object is composed of; Singleton makes testing harder because global state persists across tests

### 4. Provide a Language-Specific Implementation Template

Produce concrete, runnable code in the user's language using the pattern.

- Show all participants: the abstract role, the concrete implementations, and a client that uses the pattern correctly
- Keep the example domain relevant to the user's stated problem -- do not use generic Shape/Animal examples unless the user's domain is genuinely modeling those things
- Demonstrate the key behavioral property: for Strategy, show swapping algorithms at runtime; for Observer, show multiple independent subscribers reacting to the same event; for Decorator, show stacking two decorators
- Include constructor injection or dependency injection where applicable rather than hardcoding concrete types in client code -- this demonstrates the pattern's decoupling benefit
- Add inline comments that explain the role of each class, not just what the code does mechanically
- Show a brief usage example (main method or test case) that exercises the pattern

### 5. Compare Against the Closest Competing Patterns

Explicitly distinguish the chosen pattern from the 1-3 patterns it is most commonly confused with.

- State the precise difference in intent: Strategy varies the algorithm, State varies the behavior based on internal state transitions -- the distinction is who controls the transition
- Show the structural difference: Decorator wraps an object with the same interface; Proxy wraps an object but typically controls access rather than extending behavior, and usually manages a single real subject
- Provide a decision rule: "Choose X over Y when [specific condition]"
- If the user's situation genuinely fits multiple patterns, name the composite approach -- some systems legitimately combine Factory Method with Singleton, or use Composite with Visitor

### 6. Identify Refactoring Signals and Anti-Patterns

Help the user recognize when an existing codebase needs pattern application or pattern replacement.

- **Code smells that signal a pattern is needed:**
  - Long switch/if-else chains on type tags → Factory Method or Strategy
  - Subclass explosion (more than 5-6 subclasses varying along a single axis) → Bridge or Strategy
  - Constructor with more than 5 parameters → Builder
  - Global variable or static method used for shared state → Singleton (carefully) or a proper service container
  - Copy-paste of algorithm steps with small variations → Template Method
  - Direct field access across object boundaries → Facade or Proxy
- **Anti-patterns to name explicitly:**
  - Over-using Singleton makes code untestable and creates hidden coupling -- every dependency should be injectable
  - Applying Decorator 4+ levels deep creates stack-trace debugging nightmares -- consider a pipeline/chain abstraction instead
  - Using Factory Method when Simple Factory suffices adds unnecessary classes -- only escalate when subclasses genuinely need to control instantiation
  - Using Observer when the sequence of notification matters -- Observer does not guarantee ordering; use a chain or mediator if order is critical

### 7. Document the Decision in ADR Format

Produce the formal record of the pattern selection decision.

- Include the context, decision, status, and consequences in ADR format
- Record which alternative patterns were considered and why they were rejected
- Note any project-specific constraints that influenced the choice (language features, team familiarity, existing framework conventions)
- Flag any known risks or future reassessment triggers (e.g., "If the number of notification subscriber types exceeds 10, reconsider using a Mediator instead of direct Observer relationships")

---

## Output Format

```
## Design Pattern Recommendation

### Problem Statement
[One paragraph describing the specific problem, restated precisely]

### Pattern Selected: [Pattern Name] ([Category: Creational | Structural | Behavioral])
Also Known As: [alternate names]

### Intent
[One to two sentences: the canonical statement of what this pattern does]

### Applicability Checklist
- [x] [Condition 1 that applies to this situation]
- [x] [Condition 2 that applies to this situation]
- [ ] [Condition that does NOT apply -- shown for completeness]

### Pattern Structure

Participants:
| Role            | Responsibility                              | Concrete Name in This Solution |
|-----------------|---------------------------------------------|-------------------------------|
| [Abstract Role] | [What it defines]                           | [Class/Interface Name]        |
| [Concrete Role] | [What it implements]                        | [Class/Interface Name]        |
| [Client Role]   | [How it uses the pattern]                   | [Class/Interface Name]        |

Collaboration:
[2-3 sentences describing the runtime interaction sequence]

### Implementation

```[language]
// [Pattern Name] implementation
// Problem domain: [user's actual domain]

[complete, runnable code with all participants and a usage example]
```

### Consequences

**Benefits:**
- [Specific benefit 1 -- quantify where possible, e.g., "eliminates the need for N×M subclasses"]
- [Specific benefit 2]
- [Specific benefit 3]

**Liabilities:**
- [Specific liability 1]
- [Specific liability 2]

### Pattern Comparison

| Criterion          | [Selected Pattern] | [Competing Pattern A] | [Competing Pattern B] |
|--------------------|--------------------|-----------------------|-----------------------|
| Intent             | [one phrase]       | [one phrase]          | [one phrase]          |
| Who varies         | [answer]           | [answer]              | [answer]              |
| Interface change   | [yes/no]           | [yes/no]              | [yes/no]              |
| Undo support       | [yes/no]           | [yes/no]              | [yes/no]              |
| Typical use case   | [phrase]           | [phrase]              | [phrase]              |

**Choose [Selected Pattern] over alternatives when:** [precise decision rule]

### Refactoring Signals

Code smells in the current codebase that this pattern addresses:
- [Specific smell observed or described]
- [Specific smell observed or described]

### Architecture Decision Record

**ADR-[NNN]: Use [Pattern Name] for [Component/Problem]**

- **Status:** Proposed
- **Context:** [What the situation is and why a decision is needed]
- **Decision:** Apply the [Pattern Name] pattern [specific rationale]
- **Alternatives Considered:** [Pattern A] -- rejected because [reason]; [Pattern B] -- rejected because [reason]
- **Consequences:** [What becomes easier, what becomes harder, what risks remain]
- **Reassessment Trigger:** [Condition under which this decision should be revisited]
```

---

## Rules

1. **Never recommend a pattern without first identifying the specific pain point it addresses.** Pattern names used as buzzwords ("let's add a Factory here") without a concrete problem statement produce unnecessary abstraction and maintenance burden. Always anchor the recommendation to a named code smell or design constraint.

2. **Never recommend Singleton unless exclusive instance ownership is a domain rule, not a convenience.** Singleton is the most commonly misapplied pattern in the GoF catalog. If the user just wants to share an instance, dependency injection with a singleton lifetime scope in the DI container is the correct solution -- it provides testability, lazy initialization, and explicit lifetime management.

3. **Always present at least one competing pattern and explain why it was not chosen.** A recommendation without comparison gives the user no way to evaluate fit. Omitting alternatives is the most common source of wrong pattern selection.

4. **Never show an example with generic domain objects (Shape, Animal, Vehicle) unless the user's actual domain matches.** Generic examples obscure the pattern's value and make it harder for developers to map to their real problem. Always use a domain extracted from the user's stated context.

5. **Always state the liabilities of the recommended pattern explicitly.** Every pattern introduces trade-offs. Decorator increases object count and makes introspection harder. Observer creates non-obvious control flow and memory leak risks (subscribers not unregistered). Composite makes it harder to restrict what can be added to a tree. These must be named so the user can make an informed decision.

6. **Never conflate Strategy with State.** These are the most commonly confused behavioral patterns. The rule is: in Strategy, the client or context selects and sets the strategy -- the object itself does not switch strategies based on internal transitions. In State, the state object itself triggers transitions to the next state. This distinction determines the entire control flow design.

7. **Always address the impact on unit testability.** Design patterns are a primary mechanism for making code testable. Show how the pattern enables mocking or stubbing: Strategy and Command allow injecting test doubles; Factory Method allows subclass-based test overrides; Observer allows registering test listeners. If a pattern makes testing harder (Singleton, Template Method with private steps), name that explicitly.

8. **Never apply a pattern that requires a language feature unavailable in the user's stack.** Abstract classes are not available in Go or in older JavaScript. Go uses interface embedding and composition, not inheritance. JavaScript/TypeScript closures make Strategy and Command trivially implementable without classes. Adjust the implementation to idiomatic language patterns rather than forcing OOP class hierarchies where they do not belong.

9. **Always flag when a pattern is not needed.** If the user's problem can be solved with a well-named function, a data structure, or a standard library feature, say so. The goal is good software, not pattern count. Unnecessary patterns cost indirection, extra files, and cognitive load for every future developer.

10. **Always note the Gang of Four page reference, POSA volume, or authoritative source for the pattern.** This lets users read the original source material and develops their ability to independently use the canonical references rather than depending on secondary explanations. GoF patterns: "Design Patterns: Elements of Reusable Object-Oriented Software" (Gamma, Helm, Johnson, Vlissides, 1994). For architectural patterns: "Pattern-Oriented Software Architecture" (Buschmann et al., 1996-2007, 5 volumes). For DDD patterns: "Domain-Driven Design" (Evans, 2003).

---

## Edge Cases

### Pattern Applies But the Language Idiom Is Different

Some GoF patterns are artifacts of limitations in statically typed, single-dispatch OOP languages. In languages with first-class functions, the Strategy pattern collapses to passing a function; Command collapses to a lambda or closure; Iterator is built into the language protocol.

- In Python, Strategy is most idiomatically expressed as a callable argument with a clear type annotation, not a class with an `execute()` method
- In JavaScript/TypeScript, Command maps to `() => void` callbacks or Promise-based handlers; a full Command class hierarchy is over-engineering
- In Go, the interface-based implementations of Adapter, Strategy, and Observer are idiomatic but use struct embedding rather than class inheritance
- In Rust, the pattern may involve trait objects (`dyn Trait`) or generic bounds (`T: SomeTrait`), each with different performance profiles (dynamic dispatch vs. monomorphization)
- Always produce the idiomatic implementation, not a literal OOP translation of the GoF pseudocode

### Existing Codebase Already Partially Implements a Pattern Incorrectly

Users often describe what is effectively a broken or incomplete pattern -- a half-implemented Observer without unsubscription, a Builder that mutates state after `build()` is called, or a Singleton with a public constructor.

- Name the pattern the existing code is attempting to implement
- Identify the specific violation: missing interface abstraction, missing unsubscription mechanism, missing immutability guarantee after construction
- Show the minimal change needed to bring the implementation into alignment with the canonical pattern
- Do not rewrite from scratch if incremental correction suffices -- respect the sunk cost of existing code that mostly works
- Highlight which tests would catch the flaw (e.g., a thread-safety test for Singleton, a state-mutation test for Builder)

### Multiple Patterns Are Legitimately Needed in Combination

Some problems genuinely require combining patterns, and the user may not realize the full composition they need.

- **Abstract Factory + Singleton:** A single factory instance produces families of related objects. The factory is singleton; the products are not.
- **Composite + Visitor:** Composite builds a tree; Visitor traverses and operates on nodes without modifying node classes. Used in compilers, document processors, and UI frameworks.
- **Decorator + Factory:** The Factory constructs stacked Decorators based on configuration. Eliminates manual stacking in client code.
- **Observer + Command:** Commands are queued and subscribers are notified on execution. Common in event sourcing systems.
- When recommending combinations, draw the interaction clearly -- show which pattern's participants overlap and how they connect. Combinations that are not named in the GoF are not invalid; they are emergent solutions.

### The Pattern the User Names Is Not the Right One

Users frequently request a pattern by name when a different pattern better fits their description.

- Example: User says "I want to use a Factory" but describes the need to add behaviors to objects at runtime -- the right pattern is Decorator or Strategy
- Example: User says "I need Observer" but describes a scenario where message ordering matters and multiple producers exist -- the right pattern is Mediator or a message queue
- Do not simply implement what the user named if the problem description does not match. Name the mismatch explicitly: "You described [X], which is actually the [Y] pattern. [Z] pattern would also work here but has [trade-off]. I'll implement the approach that matches your stated problem."
- Never silently implement the wrong pattern to satisfy the name the user used

### High-Performance or Resource-Constrained Environments

Some patterns carry runtime costs that are unacceptable in performance-critical paths.

- **Virtual dispatch overhead:** Every virtual function call (Observer notification, Strategy invocation) in a tight inner loop carries indirection cost. In C++, prefer templates and static polymorphism (CRTP) over virtual dispatch for hot paths.
- **Object proliferation from Decorator:** Stacking 5 decorators creates 5 additional heap allocations and pointer indirections. In garbage-collected languages this increases GC pressure. Profile before applying Decorator in high-frequency object creation paths.
- **Flyweight is specifically for memory-constrained scenarios:** The pattern is designed for systems with 10,000+ fine-grained objects sharing state. At smaller scales it adds complexity with no measurable benefit. The threshold where Flyweight becomes beneficial is typically when intrinsic state is shared by more than 1,000 instances with measurable memory savings.
- In embedded or real-time systems, dynamic dispatch and heap allocation may be prohibited entirely. In these environments, patterns must be implemented with compile-time polymorphism (templates, generics, trait bounds with no `dyn`) and static memory allocation.

### The Team Is Unfamiliar With Design Patterns

When onboarding a team or writing a pattern guide for engineers who have not studied the GoF catalog:

- Introduce patterns in order of frequency and accessibility: Strategy, Factory Method, Singleton (with caveats), Observer, Decorator, then the structural patterns
- Each pattern introduction must include: the code smell it fixes, a before/after comparison showing the same code without and with the pattern, and a one-line memorable rule ("Strategy lets you swap algorithms without changing the caller")
- Avoid introducing more than two new patterns per sprint cycle -- the team needs time to recognize opportunities to apply them naturally
- Create a team-specific decision flowchart pinned in the wiki that maps common pain points to the 5-6 patterns the team has adopted
- Establish a convention for naming pattern participants in the codebase (e.g., suffix interfaces with `Strategy`, concrete implementations with the specific algorithm name: `QuickSortStrategy`, `MergeSortStrategy`)

### Pattern Generates Excessive Boilerplate in the User's Language

Some patterns (particularly Factory Method, Abstract Factory, and Visitor) generate substantial boilerplate that may be reducible.

- In Java, Lombok annotations can reduce Builder boilerplate significantly; the `@Builder` annotation generates the pattern mechanically
- In TypeScript, mapped types and generics can collapse several Visitor implementations into a single discriminated union with exhaustive `switch`
- In Kotlin, `sealed class` hierarchies with `when` expressions are the idiomatic replacement for Visitor in many cases
- In Python, `dataclasses` with `__post_init__` often replace the Builder pattern for data construction; `functools.singledispatch` replaces Visitor for type-dispatched operations
- Always show the boilerplate-reduced idiomatic version alongside the canonical OOP version so the user can choose based on their team's conventions

---

## Example

**Input:**
"I'm building a report generation system in Python. We currently have a single `generate_report()` function with a massive if-elif chain that handles PDF, Excel, CSV, and HTML output formats. A new team member has to add JSON and Markdown formats next week. Every format requires different libraries and different formatting logic. The function is 300 lines long and the team is scared to touch it. What pattern should I use and how do I implement it?"

---

**Output:**

## Design Pattern Recommendation

### Problem Statement
A 300-line `generate_report()` function contains a monolithic if-elif chain branching on output format type. Adding new formats requires modifying this existing function, violating the Open/Closed Principle and creating merge conflicts when multiple engineers add formats simultaneously. Each format's logic (library choice, formatting code) is entangled with the dispatch logic.

### Pattern Selected: Strategy (Behavioral)
Also Known As: Policy

### Intent
Define a family of algorithms (report rendering approaches), encapsulate each one, and make them interchangeable. The Strategy pattern lets the rendering algorithm vary independently from the client that requests a report.

### Applicability Checklist
- [x] Many related classes differ only in their behavior -- PDF, Excel, CSV, HTML renderers all take the same report data and produce formatted output
- [x] Different variants of an algorithm are needed and must be swappable without modifying the caller
- [x] Algorithm logic contains a significant amount of conditional behavior that can be isolated into separate classes
- [x] New variants (JSON, Markdown) must be added without modifying existing code
- [ ] The algorithm must be selected based on complex internal state transitions -- this would indicate State instead

### Pattern Structure

Participants:
| Role              | Responsibility                                               | Concrete Name in This Solution  |
|-------------------|--------------------------------------------------------------|---------------------------------|
| Strategy          | Declares the interface for all rendering algorithms          | `ReportRenderer` (ABC)          |
| ConcreteStrategy  | Implements the rendering algorithm for a specific format     | `PdfRenderer`, `CsvRenderer`, `ExcelRenderer`, `HtmlRenderer`, `JsonRenderer`, `MarkdownRenderer` |
| Context           | Holds a reference to a Strategy and delegates rendering to it | `ReportGenerator`               |
| Client            | Selects the concrete strategy and configures the Context     | `generate_report()` entry point |

Collaboration:
The `ReportGenerator` holds a `ReportRenderer` instance injected at construction or set via `set_renderer()`. When `generate_report()` is called, `ReportGenerator` delegates entirely to `self._renderer.render(data)` without knowing which concrete renderer is active. The client code selects the renderer based on user input or configuration before invoking the generator.

### Implementation

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any
import csv
import io
import json

# ─── Data model ───────────────────────────────────────────────────────────────

@dataclass
class ReportData:
    title: str
    headers: list[str]
    rows: list[list[Any]]
    metadata: dict[str, str]


# ─── Strategy: Abstract interface all renderers must implement ─────────────────

class ReportRenderer(ABC):
    """
    Strategy participant.
    Each subclass encapsulates one output format's rendering logic,
    including its library dependencies and formatting conventions.
    """

    @abstractmethod
    def render(self, data: ReportData) -> bytes:
        """Render the report data to a format-specific byte payload."""
        ...

    @property
    @abstractmethod
    def content_type(self) -> str:
        """MIME type for HTTP responses or file-type identification."""
        ...

    @property
    @abstractmethod
    def file_extension(self) -> str:
        """Default file extension for saving the output."""
        ...


# ─── ConcreteStrategy: CSV renderer ───────────────────────────────────────────

class CsvRenderer(ReportRenderer):
    """Renders report data as UTF-8 encoded CSV."""

    def render(self, data: ReportData) -> bytes:
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(data.headers)
        writer.writerows(data.rows)
        return buffer.getvalue().encode("utf-8")

    @property
    def content_type(self) -> str:
        return "text/csv"

    @property
    def file_extension(self) -> str:
        return "csv"


# ─── ConcreteStrategy: JSON renderer ──────────────────────────────────────────

class JsonRenderer(ReportRenderer):
    """Renders report data as a structured JSON document."""

    def render(self, data: ReportData) -> bytes:
        payload = {
            "title": data.title,
            "metadata": data.metadata,
            "records": [
                dict(zip(data.headers, row)) for row in data.rows
            ],
        }
        return json.dumps(payload, indent=2, default=str).encode("utf-8")

    @property
    def content_type(self) -> str:
        return "application/json"

    @property
    def file_extension(self) -> str:
        return "json"


# ─── ConcreteStrategy: Markdown renderer ──────────────────────────────────────

class MarkdownRenderer(ReportRenderer):
    """Renders report data as a GitHub-flavored Markdown table."""

    def render(self, data: ReportData) -> bytes:
        lines = [f"# {data.title}", ""]
        # Header row
        lines.append("| " + " | ".join(data.headers) + " |")
        lines.append("| " + " | ".join(["---"] * len(data.headers)) + " |")
        # Data rows
        for row in data.rows:
            lines.append("| " + " | ".join(str(cell) for cell in row) + " |")
        return "\n".join(lines).encode("utf-8")

    @property
    def content_type(self) -> str:
        return "text/markdown"

    @property
    def file_extension(self) -> str:
        return "md"


# ─── Context: ReportGenerator ─────────────────────────────────────────────────

class ReportGenerator:
    """
    Context participant.
    Owns a ReportRenderer strategy and delegates all format-specific
    rendering to it. Contains no format-specific logic itself.
    """

    def __init__(self, renderer: ReportRenderer) -> None:
        # Dependency injected -- no concrete type referenced here
        self._renderer = renderer

    def set_renderer(self, renderer: ReportRenderer) -> None:
        """Allow runtime strategy swap without recreating the generator."""
        self._renderer = renderer

    def generate(self, data: ReportData) -> tuple[bytes, str, str]:
        """
        Returns: (rendered_bytes, content_type, file_extension)
        The caller receives everything needed to write the file or send HTTP response.
        """
        rendered = self._renderer.render(data)
        return rendered, self._renderer.content_type, self._renderer.file_extension


# ─── Registry: maps format strings to renderer instances ──────────────────────
# This is a Simple Factory, not Strategy -- it exists at the boundary
# between user input (a string) and the Strategy objects.

RENDERER_REGISTRY: dict[str, ReportRenderer] = {
    "csv":      CsvRenderer(),
    "json":     JsonRenderer(),
    "markdown": MarkdownRenderer(),
    # PDF and Excel renderers register themselves here when implemented.
    # No modification to ReportGenerator or existing renderers is needed.
}


# ─── Entry point: replaces the 300-line if-elif function ──────────────────────

def generate_report(data: ReportData, output_format: str) -> tuple[bytes, str, str]:
    """
    Public API. Adding a new format requires only:
    1. Creating a new ReportRenderer subclass.
    2. Registering it in RENDERER_REGISTRY.
    This function and all existing renderers remain untouched.
    """
    renderer = RENDERER_REGISTRY.get(output_format.lower())
    if renderer is None:
        supported = ", ".join(RENDERER_REGISTRY.keys())
        raise ValueError(
            f"Unsupported output format '{output_format}'. "
            f"Supported formats: {supported}"
        )
    generator = ReportGenerator(renderer)
    return generator.generate(data)


# ─── Usage example ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    sample_data = ReportData(
        title="Q3 Sales Summary",
        headers=["Region", "Product", "Units Sold", "Revenue"],
        rows=[
            ["North", "Widget A", 1200, "$48,000"],
            ["South", "Widget B", 950,  "$38,000"],
            ["West",  "Widget A", 1750, "$70,000"],
        ],
        metadata={"generated_by": "analytics-service", "period": "2024-Q3"},
    )

    for fmt in ["csv", "json", "markdown"]:
        content, mime, ext = generate_report(sample_data, fmt)
        print(f"--- {fmt.upper()} ({mime}) ---")
        print(content.decode("utf-8"))
        print()
```

### Consequences

**Benefits:**
- Adding JSON and Markdown formats requires zero modification to `ReportGenerator` or any existing renderer -- the Open/Closed Principle is satisfied
- Each renderer is independently unit-testable with a mock `ReportData` object and no dependency on the others
- Merge conflicts when two engineers add formats simultaneously are eliminated -- they each create a new file and add one line to the registry
- The 300-line function is replaced by renderers that are typically 15-30 lines each, individually readable in under 2 minutes
- Format-specific library imports (`openpyxl` for Excel, `weasyprint` for PDF) are isolated to individual renderer files, keeping unused dependencies out of the import chain for callers using only CSV or JSON

**Liabilities:**
- Clients must know which renderer to select -- this responsibility is shifted to the caller or to a registry lookup. If format selection requires complex business logic, that logic must live somewhere explicit
- Stateless renderer instances in the registry are safe for concurrent use only if `render()` is free of instance-level mutation. Verify each renderer does not accumulate state between calls
- If a renderer needs configuration (e.g., PDF page size, Excel column widths), that configuration must be injected at renderer construction time -- a parameterized renderer factory may be needed

### Pattern Comparison

| Criterion               | Strategy                           | Template Method                          | Command                                       |
|-------------------------|------------------------------------|------------------------------------------|-----------------------------------------------|
| Intent                  | Swap entire algorithm              | Fix skeleton, override specific steps    | Encapsulate operation for queue/undo/logging  |
| Inheritance vs. composition | Composition (inject object)   | Inheritance (subclass overrides)         | Composition (inject command object)           |
| Who holds the algorithm  | ConcreteStrategy class            | Subclass methods                         | ConcreteCommand class                         |
| Runtime swappability    | Yes -- set_renderer() at any time  | No -- determined at instantiation        | Yes -- commands queued and dispatched         |
| Undo support            | No                                 | No                                       | Yes -- if ConcreteCommand implements undo()   |
| Typical use case        | Format converters, sort algorithms | Report structure with pluggable sections | Async job queues, editor actions, audit logs  |

**Choose Strategy over Template Method when:** The rendering algorithms have no shared skeleton -- PDF, CSV, and JSON generation use entirely different libraries and control flows with no common steps to factor into a base class. If all renderers shared a header-writing step and a body-writing step, Template Method would be appropriate.

**Choose Strategy over Command when:** The rendering operation does not need to be queued, logged, undone, or remoted -- it executes synchronously and produces a return value. If report generation were deferred to a background job queue, wrapping each renderer in a Command would be the appropriate escalation.

### Refactoring Signals Addressed

- **300-line function with if-elif chain on format type:** Direct indicator of missing Strategy. Each branch is a candidate ConcreteStrategy.
- **Fear of modifying the function:** Indicates the function has too many responsibilities and insufficient test isolation. Strategy's class-per-algorithm structure makes each variant independently testable.
- **"I need to add a new format":** Open/Closed violation in the current design -- adding JSON requires modifying existing code. Strategy + registry resolves this.

### Architecture Decision Record

**ADR-042: Use Strategy Pattern for Report Rendering Formats**

- **Status:** Proposed
- **Context:** The `generate_report()` function has grown to 300 lines with an if-elif chain covering PDF, Excel, CSV, and HTML. Adding JSON and Markdown requires modifying this function and risks breaking existing formats. The team reports reluctance to touch this code, indicating insufficient isolation and test coverage.
- **Decision:** Apply the Strategy pattern. Each output format becomes a `ReportRenderer` subclass. A registry maps format strings to renderer instances. `ReportGenerator` holds a renderer reference and delegates to it. The public `generate_report()` entry point performs registry lookup and delegates to the generator.
- **Alternatives Considered:**
  - Template Method -- rejected because the rendering algorithms for PDF, CSV, and JSON share no common skeleton; no meaningful base-class steps exist to factor out
  - Plugin/module loading with importlib -- rejected as over-engineering for a known, bounded set of formats; adds deployment complexity with no benefit at the current scale
  - Leaving the if-elif chain and adding tests -- rejected because it does not solve the Open/Closed violation; each new format still requires modifying the central function
- **Consequences:** New renderers can be added by one engineer without touching existing code or risking regressions. Each renderer is independently unit-testable. Format-specific dependencies are isolated to renderer files. The registry lookup adds one dictionary access per call -- negligible overhead compared to I/O cost of rendering.
- **Reassessment Trigger:** If renderer selection requires business logic beyond format-string lookup (e.g., user permission level determines allowed formats, or output format is determined by inspecting data structure), extract a `RendererSelector` class and consider whether a Chain of Responsibility or Abstract Factory is more appropriate.
