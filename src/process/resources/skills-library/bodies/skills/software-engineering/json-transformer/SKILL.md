---
name: json-transformer
description: |
  Reshape, query, validate, and transform JSON data using jq, JavaScript, and Python - with ready-to-use recipes for common data transformation tasks.
  Use when the user asks about json transformer, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of json transformer or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "quickstart best-practices python javascript testing"
  category: "software-engineering"
  subcategory: "developer-tools"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---

# JSON Transformer

You are a data transformation specialist. Help the user reshape JSON data quickly using the right tool for the job. Provide exact commands and code snippets. Default to jq for CLI work, JavaScript/Python for application code.


## When to Use

**Use this skill when:**
- User asks about json transformer techniques or best practices
- User needs guidance on json transformer concepts
- User wants to implement or improve their approach to json transformer

**Do NOT use when:**
- The request falls outside the scope of json transformer
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## jq Quick Reference

### Installation

```shell
# macOS
brew install jq

# Ubuntu/Debian
sudo apt install jq

# Windows
choco install jq
# or: winget install jqlang.jq
```

### Basic Operations

```shell
# Pretty print
echo '{"a":1}' | jq '.'

# Extract a field
echo '{"name":"Jo","age":30}' | jq '.name'          # "Jo"
echo '{"name":"Jo","age":30}' | jq -r '.name'       # Jo (raw, no quotes)

# Nested access
echo '{"user":{"name":"Jo"}}' | jq '.user.name'

# Array access
echo '[1,2,3]' | jq '.[0]'          # 1
echo '[1,2,3]' | jq '.[-1]'         # 3 (last element)
echo '[1,2,3]' | jq '.[1:3]'        # [2,3] (slice)
```

### Filtering Arrays

```shell
# Iterate array elements
echo '[{"a":1},{"a":2}]' | jq '.[]'

# Filter by condition
echo '[{"name":"Jo","age":30},{"name":"Al","age":25}]' | jq '[.[] | select(.age > 27)]'

# Map: transform each element
echo '[1,2,3]' | jq '[.[] | . * 2]'                  # [2,4,6]

# Map shorthand
echo '[{"a":1,"b":2},{"a":3,"b":4}]' | jq '[.[].a]'  # [1,3]
echo '[{"a":1,"b":2}]' | jq 'map(.a)'                 # [1]
```

### Reshaping Objects

```shell
# Pick specific fields
echo '{"a":1,"b":2,"c":3}' | jq '{a,c}'              # {"a":1,"c":3}

# Rename fields
echo '{"firstName":"Jo"}' | jq '{name: .firstName}'

# Add/update fields
echo '{"a":1}' | jq '. + {b: 2}'                      # {"a":1,"b":2}
echo '{"a":1}' | jq '.b = 2'                          # {"a":1,"b":2}

# Delete fields
echo '{"a":1,"b":2,"c":3}' | jq 'del(.b)'            # {"a":1,"c":3}

# Flatten nested structure
echo '{"user":{"name":"Jo","addr":{"city":"NYC"}}}' | jq '{name: .user.name, city: .user.addr.city}'
```

### Common Transformations

```shell
# Array of objects -> object (key by field)
echo '[{"id":"a","val":1},{"id":"b","val":2}]' | jq 'INDEX(.id)'

# Group by field
echo '[{"type":"a","v":1},{"type":"b","v":2},{"type":"a","v":3}]' | jq 'group_by(.type)'

# Sort
echo '[{"n":3},{"n":1},{"n":2}]' | jq 'sort_by(.n)'

# Unique values
echo '[1,2,2,3,3,3]' | jq 'unique'

# Length / count
echo '[1,2,3]' | jq 'length'                          # 3

# Keys of an object
echo '{"a":1,"b":2}' | jq 'keys'                      # ["a","b"]

# Flatten nested arrays
echo '[[1,2],[3,[4,5]]]' | jq 'flatten'               # [1,2,3,4,5]
```

### String Operations in jq

```shell
# Split and join
echo '"a,b,c"' | jq 'split(",")'                      # ["a","b","c"]
echo '["a","b"]' | jq 'join("-")'                      # "a-b"

# String interpolation
echo '{"n":"Jo","a":30}' | jq '"\(.n) is \(.a)"'      # "Jo is 30"

# Test with regex
echo '"hello123"' | jq 'test("[0-9]+")'                # true

# Capture with regex
echo '"2024-01-15"' | jq 'capture("(?<y>[0-9]{4})-(?<m>[0-9]{2})")'
```

### Combining Files / Streams

```shell
# Merge two JSON files
jq -s '.[0] * .[1]' file1.json file2.json

# Concatenate arrays from two files
jq -s '.[0] + .[1]' array1.json array2.json

# Process JSONL (newline-delimited JSON)
jq -c '.' file.jsonl           # compact output per line
jq -s '.' file.jsonl           # slurp into array
```

## JavaScript Recipes

```javascript
// Deep clone and transform
const transformed = JSON.parse(JSON.stringify(data));

// Pick fields
const pick = (obj, keys) => Object.fromEntries(keys.map(k => [k, obj[k]]));

// Rename keys
const rename = (obj, map) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [map[k] || k, v]));

// Flatten nested object
function flatten(obj, prefix = '') {
  return Object.entries(obj).reduce((acc, [key, val]) => {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      Object.assign(acc, flatten(val, newKey));
    } else {
      acc[newKey] = val;
    }
    return acc;
  }, {});
}

// Group array of objects by key
const groupBy = (arr, key) =>
  arr.reduce((acc, item) => {
    (acc[item[key]] ??= []).push(item);
    return acc;
  }, {});

// Array to lookup object
const toLookup = (arr, key) =>
  Object.fromEntries(arr.map(item => [item[key], item]));
```

## Python Recipes

```python
import json

# Read and write
data = json.loads(json_string)
data = json.load(open('file.json'))
json.dumps(data, indent=2)

# Flatten nested dict
def flatten(d, parent_key='', sep='.'):
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten(v, new_key, sep).items())
        else:
            items.append((new_key, v))
    return dict(items)

# JSONPath-style access (install the package via pip jsonpath-ng)
from jsonpath_ng import parse
expr = parse('$.store.book[*].author')
matches = [m.value for m in expr.find(data)]
```

## Validation Quick Check

```shell
# Validate JSON syntax
echo '{"a":1}' | jq empty           # silent = valid
echo '{bad}' | jq empty             # error = invalid

# Python validation
python -m json.tool file.json

# Node.js validation
node -e "JSON.parse(require('fs').readFileSync('file.json','utf8'))"
```

## Common Scenarios

| Task | jq Command |
|------|-----------|
| Count items | `jq 'length'` |
| Get all values of key | `jq '[.[].keyname]'` |
| Remove nulls from array | `jq '[.[] | select(. != null)]'` |
| Convert object to key-value pairs | `jq 'to_entries'` |
| Convert key-value pairs to object | `jq 'from_entries'` |
| Min/Max from array | `jq 'min'` or `jq 'max'` |
| Sum numbers | `jq 'add'` |
| CSV-like output | `jq -r '.[] | [.a, .b] | @csv'` |
| TSV output | `jq -r '.[] | [.a, .b] | @tsv'` |
| Base64 encode | `jq -r '@base64'` |


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to json transformer
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Json Transformer Analysis

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

**Input:** "Help me with json transformer for my current situation"

**Output:**

Based on your situation, here is a structured approach to json transformer:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
