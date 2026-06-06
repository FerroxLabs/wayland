---
name: regex-cheatsheet
description: |
  Practical regex patterns for common tasks - validation, extraction, replacement - with language-specific syntax differences and ready-to-use recipes.
  Use when the user asks about regex cheatsheet, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of regex cheatsheet or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "quickstart best-practices python javascript testing email"
  category: "software-engineering"
  subcategory: "developer-tools"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---

# Regex Cheatsheet

You are a regex specialist. Help the user build, test, and debug regular expressions. Provide exact patterns with explanations, test cases, and language-specific syntax where relevant. Favor readability over cleverness.


## When to Use

**Use this skill when:**
- User asks about regex cheatsheet techniques or best practices
- User needs guidance on regex cheatsheet concepts
- User wants to implement or improve their approach to regex cheatsheet

**Do NOT use when:**
- The request falls outside the scope of regex cheatsheet
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Quick Reference

| Pattern | Matches | Example |
|---------|---------|---------|
| `.` | Any character except newline | `a.c` matches `abc`, `a1c` |
| `\d` | Digit [0-9] | `\d{3}` matches `123` |
| `\w` | Word char [a-zA-Z0-9_] | `\w+` matches `hello_1` |
| `\s` | Whitespace | `\s+` matches spaces, tabs |
| `\b` | Word boundary | `\bcat\b` matches `cat` not `catch` |
| `^` | Start of line | `^Hello` |
| `$` | End of line | `world$` |
| `*` | 0 or more | `ab*c` matches `ac`, `abc`, `abbc` |
| `+` | 1 or more | `ab+c` matches `abc` not `ac` |
| `?` | 0 or 1 | `colou?r` matches both spellings |
| `{n,m}` | n to m times | `\d{2,4}` matches 2-4 digits |
| `(...)` | Capture group | `(ab)+` captures `ab` |
| `(?:...)` | Non-capturing group | `(?:ab)+` groups without capture |
| `(?=...)` | Lookahead | `\d(?=px)` digit before `px` |
| `(?<=...)` | Lookbehind | `(?<=\$)\d+` digits after `$` |
| `[abc]` | Character class | `[aeiou]` matches vowels |
| `[^abc]` | Negated class | `[^0-9]` matches non-digits |
| `\1` | Backreference | `(\w)\1` matches `aa`, `bb` |

## Common Recipes

### Email Validation (Practical)

```regex
^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$
```

### URL Extraction

```regex
https?://[^\s<>"{}|\\^`\[\]]+
```

### Phone Numbers (US)

```regex
(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}
```
Matches: `(555) 123-4567`, `555.123.4567`, `+1-555-123-4567`

### IPv4 Address

```regex
\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b
```

### Date Formats

```regex
# YYYY-MM-DD
\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])

# MM/DD/YYYY
(?:0[1-9]|1[0-2])/(?:0[1-9]|[12]\d|3[01])/\d{4}

# Flexible (multiple formats)
\d{1,4}[-/\.]\d{1,2}[-/\.]\d{1,4}
```

### Password Strength Validation

```regex
# Minimum 8 chars, at least 1 upper, 1 lower, 1 digit, 1 special
^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$
```

### HTML Tag Extraction

```regex
# Match opening tags with attributes
<(\w+)(?:\s+[^>]*)?>

# Match content between specific tags
<title>(.*?)</title>

# Strip all HTML tags (replacement: empty string)
<[^>]+>
```

### CSV Field Parsing

```regex
(?:^|,)("(?:[^"]*(?:""[^"]*)*)"|[^,]*)
```

### Whitespace Cleanup

```regex
# Multiple spaces to single
\s{2,}  ->  (single space)

# Trim leading/trailing whitespace per line
^\s+|\s+$

# Remove blank lines
^\s*\n
```

### Log Parsing

```regex
# Common log format: timestamp level message
^(\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2}[.\d]*)\s+(\w+)\s+(.*)$

# Extract stack trace class/method
at\s+([\w.$]+)\(([\w.]+):(\d+)\)
```

### File Path Extraction

```regex
# Unix paths
(?:/[\w.-]+)+/?

# Windows paths
[A-Za-z]:\\(?:[\w.-]+\\)*[\w.-]+

# File extension
\.([a-zA-Z0-9]{1,10})$
```

### Credit Card (Format Check Only)

```regex
\b(?:\d{4}[-\s]?){3}\d{4}\b
```

### Semantic Version

```regex
\bv?(\d+)\.(\d+)\.(\d+)(?:-([\w.]+))?(?:\+([\w.]+))?\b
```

## Language-Specific Syntax

### JavaScript

```javascript
// Literal syntax
const re = /pattern/flags;

// Constructor (dynamic patterns)
const re = new RegExp('pattern', 'flags');

// Common methods
str.match(re);          // returns matches array
str.replace(re, 'new'); // replace matches
re.test(str);           // returns boolean
str.split(re);          // split by pattern

// Named groups (ES2018+)
const re = /(?<year>\d{4})-(?<month>\d{2})/;
const { year, month } = str.match(re).groups;

// Flags: g (global), i (case-insensitive), m (multiline), s (dotAll), u (unicode)
```

### Python

```python
import re

re.search(pattern, string)     # first match
re.findall(pattern, string)    # all matches as list
re.sub(pattern, repl, string)  # replace
re.split(pattern, string)      # split
re.compile(pattern)            # precompile

# Raw strings (always use)
pattern = r'\d+\.\d+'

# Named groups
pattern = r'(?P<year>\d{4})-(?P<month>\d{2})'
match.group('year')

# Flags: re.IGNORECASE, re.MULTILINE, re.DOTALL, re.VERBOSE
```

### shell / grep / sed

```shell
# grep (POSIX basic by default, -E for extended, -P for PCRE)
grep -E 'pattern' file
grep -P '\d+' file              # Perl-compatible (Linux)
grep -oP '(?<=key=)\w+' file   # extract with lookbehind

# sed
sed 's/pattern/replacement/g' file
sed -E 's/([0-9]+)/[\1]/g' file  # extended regex

# Differences: POSIX basic requires escaping: \( \) \{ \} \+
```

## Testing Tools

| Tool | URL | Best For |
|------|-----|----------|
| regex101 | regex101.com | Detailed explanation, multiple flavors |
| regexr | regexr.com | Interactive learning |
| debuggex | debuggex.com | Visual railroad diagrams |

## Gotchas

| Trap | Problem | Fix |
|------|---------|-----|
| Greedy `.*` | Matches too much | Use `.*?` (lazy) |
| Unescaped `.` | Matches any char | Use `\.` for literal dot |
| `^$` in multiline | Matches line vs string | Use `\A` and `\z` for string boundaries |
| Backtracking | Catastrophic performance | Avoid nested quantifiers `(a+)+` |
| Character class `-` | Interpreted as range | Put `-` first or last: `[-abc]` |
| Lookbehind length | Variable length not always supported | Use `\K` in PCRE instead |

## Build-a-Pattern Workflow

1. **Start with literals**: Match the exact text first
2. **Identify variable parts**: Replace with character classes
3. **Add quantifiers**: Specify how many times each part repeats
4. **Add anchors**: `^` and `$` to prevent partial matches
5. **Test edge cases**: Empty strings, special characters, unexpected input
6. **Add groups** only if you need to capture or reference parts


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to regex cheatsheet
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Regex Cheatsheet Analysis

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

**Input:** "Help me with regex cheatsheet for my current situation"

**Output:**

Based on your situation, here is a structured approach to regex cheatsheet:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
