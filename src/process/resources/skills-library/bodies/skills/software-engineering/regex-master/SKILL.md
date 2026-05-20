---
name: regex-master
description: |
  Regular expression expert covering syntax reference, common patterns, performance optimization, lookaround assertions, named groups, language-specific flavors, and testing strategies.
  Use when the user asks about regex master, regex master best practices, or needs guidance on regex master implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "best-practices guide step-by-step"
  category: "software-engineering"
  subcategory: "languages-runtimes"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Regex Master

You are an expert in regular expressions. Craft precise, performant, and readable regex patterns. Prefer correctness over cleverness. Always consider edge cases, Unicode, and performance.

## Regex Syntax Quick Reference

### Character Classes
| Pattern | Matches | Example |
|---------|---------|---------|
| `.` | Any character except newline | `a.c` matches `abc`, `a1c` |
| `\d` | Digit `[0-9]` | `\d{3}` matches `123` |
| `\D` | Non-digit `[^0-9]` | `\D+` matches `abc` |
| `\w` | Word character `[a-zA-Z0-9_]` | `\w+` matches `hello_1` |
| `\W` | Non-word character | `\W` matches `@`, ` ` |
| `\s` | Whitespace `[ \t\n\r\f\v]` | `\s+` matches spaces/tabs |
| `\S` | Non-whitespace | `\S+` matches `hello` |
| `[abc]` | Any of a, b, c | `[aeiou]` matches vowels |
| `[^abc]` | Not a, b, or c | `[^0-9]` matches non-digits |
| `[a-z]` | Range a through z | `[A-Za-z]` matches letters |

### Quantifiers
| Pattern | Meaning | Greedy | Lazy |
|---------|---------|--------|------|
| `*` | 0 or more | `.*` | `.*?` |
| `+` | 1 or more | `.+` | `.+?` |
| `?` | 0 or 1 | `a?` | `a??` |
| `{n}` | Exactly n | `\d{3}` | N/A |
| `{n,}` | n or more | `\d{3,}` | `\d{3,}?` |
| `{n,m}` | Between n and m | `\d{3,5}` | `\d{3,5}?` |

### Anchors
| Pattern | Matches |
|---------|---------|
| `^` | Start of string (or line with `m` flag) |
| `$` | End of string (or line with `m` flag) |
| `\b` | Word boundary |
| `\B` | Non-word boundary |

### Groups and Alternation
| Pattern | Meaning |
|---------|---------|
| `(abc)` | Capturing group |
| `(?:abc)` | Non-capturing group |
| `(?P<name>abc)` | Named group (Python) |
| `(?<name>abc)` | Named group (JS, .NET, Java) |
| `a\|b` | Alternation (a or b) |
| `\1` | Backreference to group 1 |

### Lookaround Assertions
| Pattern | Name | Meaning |
|---------|------|---------|
| `(?=abc)` | Positive lookahead | Followed by `abc` |
| `(?!abc)` | Negative lookahead | NOT followed by `abc` |
| `(?<=abc)` | Positive lookbehind | Preceded by `abc` |
| `(?<!abc)` | Negative lookbehind | NOT preceded by `abc` |

Lookarounds are zero-width: they assert a condition but do not consume characters.

### Flags
| Flag | Meaning |
|------|---------|
| `i` | Case-insensitive |
| `g` | Global (find all matches) |
| `m` | Multiline (`^`/`$` match line boundaries) |
| `s` | Dotall (`.` matches newline) |
| `u` | Unicode mode |
| `x` | Extended (allow whitespace and comments) |

## Common Patterns

### Email (Practical, Not RFC 5322)
```regex
^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$
```
Note: A truly RFC-compliant email regex is over 6,000 characters. For validation, use a library. For basic matching, the above is sufficient.

### URL
```regex
https?://(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)
```

### IPv4 Address
```regex
\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b
```

### IPv6 Address (Simplified)
```regex
(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}
```

### Date (YYYY-MM-DD)
```regex
\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])
```
Note: This validates format only, not semantic correctness (e.g., Feb 30 would match).

### Time (HH:MM:SS, 24-hour)
```regex
(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d
```

### Phone Number (US)
```regex
(?:\+1[-.\s]?)?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}
```

### UUID (v4)
```regex
[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}
```

### Semantic Version
```regex
(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*)?(?:\+[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*)?
```

### Password Strength (Min 8 chars, upper, lower, digit, special)
```regex
^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$
```

### Slug (URL-safe string)
```regex
^[a-z0-9]+(?:-[a-z0-9]+)*$
```

### HTML Tag (Simple, Not for Parsing)
```regex
</?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>
```
Warning: Do not use regex to parse HTML. Use a DOM parser. Regex is suitable only for simple extraction tasks.

### CSV Field (Handling Quoted Fields)
```regex
(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^,]*))
```

## Performance Optimization

### Catastrophic Backtracking

Regex engines using backtracking (most languages) can exhibit exponential behavior on certain patterns.

**Dangerous pattern**:
```regex
(a+)+b
```
On input `aaaaaaaaaaaaaaaaac`, the engine tries every possible way to partition the `a`s among the nested groups before failing. This is O(2^n).

**Detection rules**:
1. Nested quantifiers: `(a+)+`, `(a*)*`, `(a+)*`
2. Overlapping alternatives: `(a|a)+`
3. Quantified groups with optional overlap: `(\w+\s*)+`

**Fixes**:
- Use atomic groups `(?>...)` or possessive quantifiers `a++` (where supported).
- Restructure the pattern to eliminate ambiguity.
- Use a regex engine with linear-time guarantees (RE2, Rust's `regex` crate).

### Performance Best Practices

1. **Anchor your patterns** when possible. `^prefix` is much faster than `prefix` (engine does not try every position).
2. **Use character classes** instead of alternation. `[abc]` is faster than `a|b|c`.
3. **Put the most likely alternative first** in alternation. `common|rare` is faster than `rare|common`.
4. **Avoid capturing groups** when you do not need the capture. Use `(?:...)` instead.
5. **Be specific**: `\d{3}` is faster than `\d+` when you know the length.
6. **Avoid `.* `at the start** of a pattern. It forces the engine to try every starting position.
7. **Compile regex once**, not inside loops.

```python
# Bad: recompile on every iteration
for line in lines:
    match = re.search(r'\d{3}-\d{4}', line)

# Good: compile once
pattern = re.compile(r'\d{3}-\d{4}')
for line in lines:
    match = pattern.search(line)
```

### Regex Engine Types

| Engine | Type | Backtracking | Language |
|--------|------|-------------|---------|
| PCRE | NFA + backtracking | Yes | PHP, R |
| V8 | NFA + backtracking | Yes | JavaScript |
| Python `re` | NFA + backtracking | Yes | Python |
| Java `Pattern` | NFA + backtracking | Yes | Java |
| RE2 | DFA (Thompson NFA) | No | Go, C++ |
| Rust `regex` | DFA (Thompson NFA) | No | Rust |

DFA engines guarantee linear time but do not support backreferences or lookaround.

## Named Groups

Use named groups for readability and maintenance.

### Python
```python
import re
pattern = r'(?P<year>\d{4})-(?P<month>\d{2})-(?P<day>\d{2})'
match = re.match(pattern, '2024-01-15')
print(match.group('year'))   # 2024
print(match.group('month'))  # 01
```

### JavaScript
```javascript
const pattern = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/;
const match = '2024-01-15'.match(pattern);
console.log(match.groups.year);   // 2024
console.log(match.groups.month);  // 01
```

### Java
```java
Pattern pattern = Pattern.compile("(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})");
Matcher matcher = pattern.matcher("2024-01-15");
if (matcher.matches()) {
    String year = matcher.group("year");  // 2024
}
```

## Language-Specific Regex Flavors

### JavaScript Specifics
- No lookbehind in older engines (available in ES2018+).
- Named groups with `(?<name>...)` syntax (ES2018+).
- `\d` does NOT match Unicode digits. Use `\p{Nd}` with `u` flag.
- `String.prototype.matchAll()` for iterating all matches.

### Python Specifics
- Use raw strings `r'...'` to avoid double-escaping.
- `re.VERBOSE` (`re.X`) flag allows comments and whitespace.
- `re.findall()` returns list; `re.finditer()` returns iterator.
- `re` module caches compiled patterns (last ~512).

### Java Specifics
- Double-escape backslashes: `\\d` not `\d`.
- `Pattern.COMMENTS` flag for verbose patterns.
- Possessive quantifiers supported: `a++`, `a*+`.
- `Matcher.find()` for searching (not anchored to start).

### Go Specifics
- Uses RE2 engine (no backtracking, guaranteed linear time).
- No lookahead/lookbehind.
- No backreferences.
- Use backtick strings to avoid escaping: `` `\d+` ``.

## Testing Strategies

### Test Matrix for Regex
For every regex pattern, test:

1. **Exact matches**: Input that should match fully.
2. **Partial matches**: Input containing the pattern within larger text.
3. **Non-matches**: Input that should NOT match.
4. **Edge cases**: Empty string, single character, maximum length.
5. **Unicode**: Accented characters, CJK, emojis.
6. **Boundary conditions**: Start/end of string, word boundaries.
7. **Performance**: Long input that could trigger backtracking.

### Test Example
```python
import re
import pytest

PHONE_PATTERN = re.compile(r'(?:\+1[-.\s]?)?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}')

@pytest.mark.parametrize("input,expected", [
    # Should match
    ("555-123-4567", True),
    ("(555) 123-4567", True),
    ("+1-555-123-4567", True),
    ("555.123.4567", True),
    ("5551234567", True),
    # Should not match
    ("123-456-7890", False),    # Area code starts with 1
    ("55-123-4567", False),     # Area code too short
    ("555-123-456", False),     # Last group too short
    ("", False),                # Empty
    ("not a phone", False),     # Text
])
def test_phone_pattern(input, expected):
    assert bool(PHONE_PATTERN.fullmatch(input)) == expected
```

### Regex Debugging Tools
- **regex101.com**: Interactive regex tester with explanation and debugger.
- **regexr.com**: Visual regex tool with community patterns.
- **Debuggex**: Visual regex railroad diagrams.
- Use verbose mode (`x` flag) for complex patterns with inline comments.

### Verbose Regex Example
```python
DATE_PATTERN = re.compile(r"""
    (?P<year>\d{4})       # Year: 4 digits
    [-/.]                  # Separator
    (?P<month>0[1-9]|1[0-2])  # Month: 01-12
    [-/.]                  # Separator
    (?P<day>0[1-9]|[12]\d|3[01])  # Day: 01-31
""", re.VERBOSE)
```

## When NOT to Use Regex

1. **Parsing nested structures** (HTML, XML, JSON): Use a parser.
2. **Complex validation** (email per RFC 5322): Use a library.
3. **Natural language processing**: Use NLP tools.
4. **When a simple string method works**: `str.startswith()`, `str.contains()`, `str.split()`.
5. **When readability matters more than compactness**: A 200-character regex is write-only code.

## Regex Construction Strategy

When building a complex regex:

1. Start with the simplest pattern that matches the happy path.
2. Add one constraint at a time.
3. Test after each addition.
4. Use named groups and verbose mode for documentation.
5. Consider building from smaller, composable patterns:

```python
YEAR = r'(?P<year>\d{4})'
MONTH = r'(?P<month>0[1-9]|1[0-2])'
DAY = r'(?P<day>0[1-9]|[12]\d|3[01])'
SEP = r'[-/.]'

DATE = re.compile(f'^{YEAR}{SEP}{MONTH}{SEP}{DAY}$')
```

## When to Use

**Use this skill when:**
- Designing or implementing regex master solutions
- Reviewing or improving existing regex master approaches
- Making architectural or implementation decisions about regex master
- Learning regex master patterns and best practices
- Troubleshooting regex master-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Regex Master Analysis

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

**Input:** "Help me implement regex master for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended regex master approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When regex master must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
