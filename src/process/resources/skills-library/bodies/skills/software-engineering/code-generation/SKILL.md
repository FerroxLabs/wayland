---
name: code-generation
description: |
  Scaffolding, templates, and code generation strategies with project bootstrapping, boilerplate automation, template engines, AST-based generation, and maintainable codegen pipelines.
  Use when the user asks about code generation, code generation best practices, or needs guidance on code generation implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "best-practices clean-code automation"
  category: "software-engineering"
  subcategory: "developer-tools"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Code Generation

You are an expert in code generation, scaffolding, and template-based automation. Design and implement code generation systems that eliminate repetitive boilerplate, enforce consistency across projects, and accelerate development without sacrificing readability or maintainability. Generated code must be as clean and idiomatic as handwritten code. If a human cannot comfortably read and modify the output, the generator has failed.

## Questions to Ask First

Before building or recommending code generation, understand the context:

1. **What repetitive patterns exist?** (CRUD endpoints, data models, test scaffolds, config files)
2. **How often are new instances of this pattern created?** (Daily, weekly, per-project)
3. **Who will run the generator?** (Developers, CI pipeline, non-technical users)
4. **What is the target language/framework?** (Generators must produce idiomatic output)
5. **How much customization is needed per instance?** (Identical copies vs heavily parameterized)
6. **What is the maintenance plan?** (Who updates templates when conventions change?)
7. **Should generated code be committed or generated at build time?** (Source-controlled vs derived)
8. **Are there existing generators or CLI tools in the ecosystem?** (Do not reinvent what exists)

## Code Generation Strategy Decision Matrix

```
                    | Template    | AST-Based   | Schema-     | CLI
                    | Engine      | Generation  | Driven      | Scaffolding
--------------------|-------------|-------------|-------------|-------------
Complexity          | Low         | High        | Medium      | Low
Flexibility         | High        | Very High   | Medium      | Low
Type safety         | None        | Full        | Partial     | None
Learning curve      | Low         | High        | Medium      | Low
Maintenance cost    | Low         | High        | Medium      | Low
Best for            | Files,      | Transforms, | APIs, DB    | Project
                    | boilerplate | refactoring | models      | bootstrap
--------------------|-------------|-------------|-------------|-------------
Examples            | Handlebars, | Babel,      | OpenAPI,    | create-*,
                    | Jinja2,     | ts-morph,   | Protobuf,   | Yeoman,
                    | EJS,        | libCST,     | GraphQL     | Cookiecutter
                    | Mustache    | Roslyn      | codegen     |
```

## Template-Based Code Generation

### Project Structure Template

```
my-generator/
  templates/
    component/
      {{name}}.tsx.hbs
      {{name}}.test.tsx.hbs
      {{name}}.module.css.hbs
      index.ts.hbs
    service/
      {{name}}Service.ts.hbs
      {{name}}Service.test.ts.hbs
    api-endpoint/
      {{name}}Controller.ts.hbs
      {{name}}Validator.ts.hbs
      {{name}}Route.ts.hbs
      {{name}}.integration.test.ts.hbs
  generator.config.js
  helpers/
    caseHelpers.js
    typeHelpers.js
```

### Template Engine Example (Handlebars-style)

```handlebars
{{!-- templates/component/{{name}}.tsx.hbs --}}
import React from 'react';
{{#if hasStyles}}
import styles from './{{name}}.module.css';
{{/if}}
{{#if hasState}}
import { useState } from 'react';
{{/if}}

interface {{pascalCase name}}Props {
{{#each props}}
  {{camelCase this.name}}: {{this.type}};
{{/each}}
}

export function {{pascalCase name}}({{ "{{" }} {{#each props}}{{camelCase this.name}}{{#unless @last}}, {{/unless}}{{/each}} }: {{pascalCase name}}Props) {
{{#if hasState}}
  const [isLoading, setIsLoading] = useState(false);
{{/if}}

  return (
    <div{{#if hasStyles}} className={styles.container}{{/if}}>
      <h2>{{pascalCase name}}</h2>
      {/* Generated component - customize as needed */}
    </div>
  );
}
```

### Generator Configuration

```javascript
// generator.config.js
module.exports = {
  generators: {
    component: {
      description: "Create a React component with optional styles and tests",
      templateDir: "templates/component",
      outputDir: "src/components/{{pascalCase name}}",
      prompts: [
        {
          name: "name",
          type: "string",
          message: "Component name:",
          validate: (v) => ./^[A-Za-z][A-Za-z0-9]*$/.test(v) || "Alphanumeric only",
        },
        {
          name: "hasStyles",
          type: "boolean",
          message: "Include CSS module?",
          default: true,
        },
        {
          name: "hasState",
          type: "boolean",
          message: "Include state management?",
          default: false,
        },
        {
          name: "props",
          type: "array",
          message: "Define props (name:type):",
          itemPrompts: [
            { name: "name", type: "string", message: "Prop name:" },
            { name: "type", type: "string", message: "Prop type:", default: "string" },
          ],
        },
      ],
    },

    service: {
      description: "Create a service class with repository pattern",
      templateDir: "templates/service",
      outputDir: "src/services",
      prompts: [
        { name: "name", type: "string", message: "Service name:" },
        { name: "hasDatabase", type: "boolean", message: "Include database access?", default: true },
      ],
    },
  },
};
```

## Schema-Driven Code Generation

### Common Schema-to-Code Patterns

```
SCHEMA SOURCE         | GENERATED OUTPUT          | TOOLS
----------------------|---------------------------|---------------------------
OpenAPI/Swagger       | Client SDKs, server stubs | openapi-generator, orval
                      | types, validators         |
Protobuf              | Client/server code,       | protoc, buf
                      | serializers               |
GraphQL schema        | Types, hooks, resolvers   | graphql-codegen
JSON Schema           | Types, validators         | quicktype, json-schema-to-ts
SQL schema            | Models, repositories      | sqlc, prisma, drizzle
                      | migrations                |

KEY PRINCIPLE: Define the contract (schema) once, generate all
implementations. The schema is the single source of truth.
```

## AST-Based Code Generation

### When to Use AST Manipulation

```
USE AST-BASED GENERATION WHEN:
- Modifying existing code (adding methods to classes, imports)
- Performing codemods (automated refactoring across files)
- Ensuring syntactic correctness is critical
- You need to preserve formatting and comments in existing code
- The transformation rules are complex and context-dependent

AVOID AST-BASED GENERATION WHEN:
- Generating entire files from scratch (templates are simpler)
- The target audience cannot maintain AST manipulation code
- The transformation is simple string substitution
```

### AST Manipulation Tools by Language

```
LANGUAGE     | AST TOOLS
-------------|---------------------------------------------
TypeScript   | ts-morph, TypeScript Compiler API
JavaScript   | Babel, jscodeshift, recast
Python       | libCST, ast module, RedBaron
Java         | JavaParser, Spoon
C#           | Roslyn
Go           | go/ast, dst

TYPICAL WORKFLOW:
1. Parse source file into AST
2. Navigate to target node (class, function, import block)
3. Add/modify/remove nodes programmatically
4. Write modified AST back to source preserving formatting
```

## Scaffolding CLI Design

### CLI Interface Pattern

```
USAGE:
  generate <type> <name> [options]

COMMANDS:
  generate component <name>     Create a React component
  generate service <name>       Create a service with repository
  generate endpoint <name>      Create an API endpoint with tests
  generate migration <name>     Create a database migration
  generate model <name>         Create a data model with validations

OPTIONS:
  --dry-run         Show what would be generated without writing files
  --force           Overwrite existing files
  --output-dir      Supersede default output directory
  --template        Use alternative template variant
  --no-tests        Skip test file generation

EXAMPLES:
  generate component UserProfile --no-tests
  generate endpoint CreateOrder --dry-run
  generate model Product --output-dir=src/domain
```

### Dry Run Output Format

```
$ generate component UserProfile --dry-run

Files to be created:
  CREATE  src/components/UserProfile/UserProfile.tsx (42 lines)
  CREATE  src/components/UserProfile/UserProfile.test.tsx (28 lines)
  CREATE  src/components/UserProfile/UserProfile.module.css (15 lines)
  CREATE  src/components/UserProfile/index.ts (1 line)

Files to be modified:
  UPDATE  src/components/index.ts (add export)

Run without --dry-run to create these files.
```

## Generated Code Best Practices

### Mark Generated Code Clearly

```
EVERY GENERATED FILE MUST:
1. Have a header comment indicating it was generated
2. Include the source (template, schema, command)
3. Include the generation timestamp
4. State whether it should be edited or regenerated

HEADER TEMPLATE:
// AUTO-GENERATED by [generator-name] from [source]
// Generated at: [timestamp]
// DO NOT EDIT - changes will be overwritten on regeneration
// To modify, update [source] and regenerate

OR (for editable scaffolds):
// Generated by [generator-name] on [timestamp]
// This file is safe to edit - it will not be regenerated
```

### Separation of Generated and Handwritten Code

```
STRATEGY 1: Separate directories
  src/generated/   <- Never edit, regenerate from source
  src/custom/      <- Handwritten code that uses generated code

STRATEGY 2: Extension pattern
  generated/UserBase.ts   <- auto-generated, do not edit
  models/User.ts          <- extends UserBase with custom logic

STRATEGY 3: Generate once (scaffold)
  Generated files are starting points. Once created, they belong
  to the developer. Generator will not overwrite. Use --force to
  regenerate from scratch.
```

### Codegen Verification in CI

```
CI PIPELINE STEP:
1. Run the code generator
2. Check git diff for uncommitted changes
3. Fail the build if generated code is out of date
4. This ensures the committed generated code matches the source schema/templates
```

## Anti-Patterns to Avoid

### 1. Generating Unreadable Code

```
BAD: Generated code with no formatting, meaningless names,
or patterns that no developer would write by hand.

GOOD: Generated code should be indistinguishable from well-written
handwritten code. Run it through the same linter and formatter.
```

### 2. Over-Generation

```
BAD: Generating 500 lines of code when the developer only needs 50.
The generator creates a "full CRUD" when you only need a read endpoint.

GOOD: Generate the minimum useful unit. Let developers add what
they need. Provide flags to include optional pieces.
```

### 3. Template Sprawl

```
BAD: 50 templates that are 90% identical with minor variations.
Changing a convention requires updating all 50.

GOOD: Use template inheritance/composition. A base template with
overridable blocks. Shared partials for common patterns.
```

### 4. No Escape Hatch

```
BAD: Generator that cannot be bypassed. If the generated code does
not fit, the developer has no way to customize without forking
the generator.

GOOD: Support supersedes at every level. Allow generated files to
be excluded. Support extension points. Make it easy to eject
from the generator entirely.
```

## Measuring Generator Effectiveness

```
METRICS:
- Time saved per generation (measure manually for 5 instances)
- Adoption rate: What percentage of new [components/services] use the generator?
- Defect rate: Are generated files involved in more or fewer bugs?
- Template staleness: How often do templates need updating?
- Developer satisfaction: Do developers prefer using the generator?

SUCCESS CRITERIA:
- Generator saves at least 10 minutes per use
- More than 80% of new instances use the generator
- Generated code passes all linting and testing standards
- Templates are updated within 1 week of convention changes
```

## When to Use

**Use this skill when:**
- Designing or implementing code generation solutions
- Reviewing or improving existing code generation approaches
- Making architectural or implementation decisions about code generation
- Learning code generation patterns and best practices
- Troubleshooting code generation-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Code Generation Analysis

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

**Input:** "Help me implement code generation for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended code generation approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When code generation must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
