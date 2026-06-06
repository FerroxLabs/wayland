---
name: csv-data-cleaner
description: |
  Quick techniques for cleaning CSV files - deduplication, normalization, encoding fixes, merging, and common data quality repairs using command-line tools and scripting.
  Use when the user asks about csv data cleaner, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of csv data cleaner or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "quickstart data-science python email"
  category: "data-analysis"
  subcategory: "statistics-modeling"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# CSV Data Cleaner

You are a data cleaning specialist. Help the user fix messy CSV files quickly using the most appropriate tool. Provide exact commands and scripts. Prioritize one-liners for simple tasks, scripts for complex ones.


## When to Use

**Use this skill when:**
- User asks about csv data cleaner techniques or best practices
- User needs guidance on csv data cleaner concepts
- User wants to implement or improve their approach to csv data cleaner

**Do NOT use when:**
- The request falls outside the scope of csv data cleaner
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Quick Diagnosis

```shell
# Preview file structure
head -5 data.csv

# Count rows (excluding header)
wc -l data.csv

# Check encoding
file -i data.csv                   # Linux/Mac
# Windows PowerShell:
[System.IO.File]::ReadAllBytes("data.csv")[0..2]   # check BOM

# Count columns (assuming comma delimiter)
head -1 data.csv | awk -F',' '{print NF}'

# Check for inconsistent column counts
awk -F',' '{print NF}' data.csv | sort | uniq -c
```

## Encoding Fixes

```shell
# Convert to UTF-8 from unknown encoding
iconv -f ISO-8859-1 -t UTF-8 input.csv > output.csv

# Remove BOM (byte order mark)
sed '1s/^\xEF\xBB\xBF//' input.csv > output.csv

# Fix Windows line endings (CRLF -> LF)
sed 's/\r$//' input.csv > output.csv
# Or:
dos2unix input.csv

# Python (handles any encoding)
python3 -c "
import csv, codecs
with codecs.open('input.csv','r','latin-1') as f:
    data = f.read()
with codecs.open('output.csv','w','utf-8') as f:
    f.write(data)
"
```

## Deduplication

```shell
# Remove exact duplicate rows (keeps first occurrence)
awk '!seen[$0]++' data.csv > deduped.csv

# Remove duplicates based on specific column (column 1)
awk -F',' '!seen[$1]++' data.csv > deduped.csv

# Python: deduplicate with more control
python3 << 'EOF'
import csv
seen = set()
with open('data.csv') as f, open('deduped.csv', 'w', newline='') as out:
    reader = csv.reader(f)
    writer = csv.writer(out)
    header = next(reader)
    writer.writerow(header)
    key_col = 0  # column index to deduplicate on
    for row in reader:
        key = row[key_col].strip().lower()  # normalize before checking
        if key not in seen:
            seen.add(key)
            writer.writerow(row)
EOF
```

## Normalization

### Whitespace Cleanup

```shell
# Trim whitespace from all fields
python3 -c "
import csv, sys
reader = csv.reader(open('data.csv'))
writer = csv.writer(sys.stdout)
for row in reader:
    writer.writerow([cell.strip() for cell in row])
" > cleaned.csv
```

### Case Normalization

```python
# Python: normalize specific columns
import csv
with open('data.csv') as f, open('out.csv', 'w', newline='') as out:
    reader = csv.DictReader(f)
    writer = csv.DictWriter(out, fieldnames=reader.fieldnames)
    writer.writeheader()
    for row in reader:
        row['email'] = row['email'].strip().lower()
        row['name'] = row['name'].strip().title()
        row['state'] = row['state'].strip().upper()
        writer.writerow(row)
```

### Date Normalization

```python
from datetime import datetime
import csv

formats_to_try = ['%m/%d/%Y', '%d-%m-%Y', '%Y-%m-%d', '%B %d, %Y', '%m/%d/%y']

def normalize_date(value, target_format='%Y-%m-%d'):
    for fmt in formats_to_try:
        try:
            return datetime.strptime(value.strip(), fmt).strftime(target_format)
        except ValueError:
            continue
    return value  # return original if no format matches

# Apply to column index 3
with open('data.csv') as f, open('out.csv', 'w', newline='') as out:
    reader = csv.reader(f)
    writer = csv.writer(out)
    writer.writerow(next(reader))  # header
    for row in reader:
        row[3] = normalize_date(row[3])
        writer.writerow(row)
```

### Phone Number Normalization

```python
import re, csv

def normalize_phone(phone):
    digits = re.sub(r'\D', '', phone)
    if len(digits) == 11 and digits[0] == '1':
        digits = digits[1:]
    if len(digits) == 10:
        return f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
    return phone  # return original if unexpected format
```

## Merging CSV Files

```shell
# Stack files with same columns (skip header on 2nd+ files)
head -1 file1.csv > merged.csv
tail -n +2 -q file1.csv file2.csv file3.csv >> merged.csv

# Python: merge/join on a key column
python3 << 'EOF'
import csv

# Load lookup data
lookup = {}
with open('lookup.csv') as f:
    for row in csv.DictReader(f):
        lookup[row['id']] = row

# Merge with main data
with open('main.csv') as f, open('merged.csv', 'w', newline='') as out:
    reader = csv.DictReader(f)
    extra_fields = ['extra_col1', 'extra_col2']  # fields from lookup
    writer = csv.DictWriter(out, fieldnames=reader.fieldnames + extra_fields)
    writer.writeheader()
    for row in reader:
        match = lookup.get(row['id'], {})
        for field in extra_fields:
            row[field] = match.get(field, '')
        writer.writerow(row)
EOF
```

## Common Data Quality Fixes

### Remove Empty Rows

```shell
awk -F',' 'NF && $0 !~ /^[,\s]*$/' data.csv > cleaned.csv
```

### Fill Missing Values

```python
import csv
default_values = {'status': 'unknown', 'count': '0', 'category': 'other'}

with open('data.csv') as f, open('filled.csv', 'w', newline='') as out:
    reader = csv.DictReader(f)
    writer = csv.DictWriter(out, fieldnames=reader.fieldnames)
    writer.writeheader()
    for row in reader:
        for field, default in default_values.items():
            if not row.get(field, '').strip():
                row[field] = default
        writer.writerow(row)
```

### Split Column into Multiple

```python
# Split "Full Name" into "First" and "Last"
import csv
with open('data.csv') as f, open('out.csv', 'w', newline='') as out:
    reader = csv.DictReader(f)
    fields = [fn for fn in reader.fieldnames if fn != 'full_name'] + ['first_name', 'last_name']
    writer = csv.DictWriter(out, fieldnames=fields)
    writer.writeheader()
    for row in reader:
        parts = row.pop('full_name', '').strip().split(None, 1)
        row['first_name'] = parts[0] if parts else ''
        row['last_name'] = parts[1] if len(parts) > 1 else ''
        writer.writerow(row)
```

## Quick Validation Checks

```shell
# Find rows with wrong column count
expected=5
awk -F',' -v exp="$expected" 'NF != exp {print NR": "NF" cols - "$0}' data.csv

# Find rows with empty required fields (column 1 and 3)
awk -F',' '$1=="" || $3=="" {print NR": "$0}' data.csv

# Summary statistics for a numeric column (column 2)
awk -F',' 'NR>1 {sum+=$2; count++; if($2>max||NR==2)max=$2; if($2<min||NR==2)min=$2} END {print "count:"count, "sum:"sum, "avg:"sum/count, "min:"min, "max:"max}' data.csv
```

## Tool Recommendations

| Task | Best Tool |
|------|-----------|
| Simple column extraction | `cut -d',' -f1,3 data.csv` |
| Complex transforms | Python `csv` module |
| Large files (GB+) | `csvkit`, `xsv`, or `miller` |
| Quick exploration | `csvlook` (from csvkit) |
| SQL on CSV | `csvsql` or `q` |
| Excel interop | `pandas` or `openpyxl` |

```shell
# csvkit essentials
install the package via pip csvkit
csvlook data.csv              # pretty print
csvstat data.csv              # column statistics
csvsort -c 2 data.csv         # sort by column 2
csvgrep -c 3 -m "value" data.csv  # filter rows
csvjoin -c id file1.csv file2.csv  # join files
```


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to csv data cleaner
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Csv Data Cleaner Analysis

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

**Input:** "Help me with csv data cleaner for my current situation"

**Output:**

Based on your situation, here is a structured approach to csv data cleaner:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
