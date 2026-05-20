---
name: data-scrubber
description: |
  Data cleaning automation expertise covering missing value strategies, outlier detection methods, duplicate detection and deduplication, data type correction, text normalization, date parsing across formats, encoding fixes, validation rules, pipeline design patterns, and data quality reporting.
  Use when the user asks about data scrubber, data scrubber best practices, or needs guidance on data scrubber implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "automation shell-scripting data-science"
  category: "software-engineering"
  subcategory: "developer-tools"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Data Scrubber

## Core Philosophy

Data cleaning is the unglamorous but critical foundation of any data-driven system. Raw data is messy: missing values, inconsistent formats, duplicates, encoding errors, and outliers. A systematic data cleaning pipeline transforms raw chaos into reliable, analysis-ready data. The goal is not perfection -- it is fitness for purpose. Every cleaning decision should be documented, reversible, and auditable.

## Data Cleaning Pipeline Design

### Pipeline Architecture

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any
import pandas as pd

@dataclass
class CleaningReport:
    """Track all changes made during cleaning."""
    total_rows_in: int = 0
    total_rows_out: int = 0
    steps: list[dict] = field(default_factory=list)

    def add_step(self, name: str, rows_affected: int, details: str = ""):
        self.steps.append({
            "step": name,
            "rows_affected": rows_affected,
            "details": details,
        })
# ... (condensed) ...
pipeline.add_step(NormalizeText(columns=['name', 'city']))
pipeline.add_step(ParseDates(columns=['created_at', 'updated_at']))
pipeline.add_step(DetectOutliers(column='amount', method='iqr'))
pipeline.add_step(ValidateConstraints())

clean_df, report = pipeline.run(raw_df)
print(report.summary())
```

## Missing Value Strategies

### Detection

```python
import pandas as pd
import numpy as np

def analyze_missing_values(df: pd.DataFrame) -> pd.DataFrame:
    """Generate a missing value report for each column."""
    missing = df.isnull().sum()
    percent = (missing / len(df)) * 100
    dtypes = df.dtypes

    report = pd.DataFrame({
        'column': missing.index,
        'missing_count': missing.values,
        'missing_pct': percent.values.round(2),
        'dtype': dtypes.values,
    }).sort_values('missing_pct', ascending=False)

    return report[report['missing_count'] > 0]

# Example output:
#       column  missing_count  missing_pct  dtype
# phone          2340          23.40        object
# address         890           8.90        object
# age             120           1.20        float64
```

### Strategies by Data Type

```python
class HandleMissingValues(CleaningStep):
    def name(self) -> str:
        return "Handle Missing Values"

    def execute(self, df: pd.DataFrame, report: CleaningReport) -> pd.DataFrame:
        total_fixed = 0

        for col in df.columns:
            missing = df[col].isnull().sum()
            if missing == 0:
                continue

            pct_missing = missing / len(df) * 100

            if pct_missing > 50:
                # Drop column if >50% missing
                df = df.drop(columns=[col])
                report.add_step(self.name(), missing, f"Dropped column '{col}' ({pct_missing:.1f}% missing)")
                # ... (condensed) ...
                if remaining > 0:
                    df = df.dropna(subset=[col])

            total_fixed += missing

        report.add_step(self.name(), total_fixed, "Total missing values handled")
        return df
```

### Advanced Imputation

```python
from sklearn.impute import KNNImputer
from sklearn.experimental import enable_iterative_imputer
from sklearn.impute import IterativeImputer

def impute_numeric_columns(df: pd.DataFrame, method: str = 'knn') -> pd.DataFrame:
    """Impute missing numeric values using ML-based methods."""
    numeric_cols = df.select_dtypes(include=[np.number]).columns

    if method == 'knn':
        imputer = KNNImputer(n_neighbors=5, weights='distance')
    elif method == 'iterative':
        imputer = IterativeImputer(max_iter=10, random_state=42)
    else:
        raise ValueError(f"Unknown method: {method}")

    df[numeric_cols] = imputer.fit_transform(df[numeric_cols])
    return df
```

## Outlier Detection

### Statistical Methods

```python
class DetectOutliers(CleaningStep):
    def __init__(self, column: str, method: str = 'iqr', action: str = 'flag'):
        self.column = column
        self.method = method
        self.action = action  # 'flag', 'remove', 'cap'

    def name(self) -> str:
        return f"Outlier Detection ({self.column})"

    def execute(self, df: pd.DataFrame, report: CleaningReport) -> pd.DataFrame:
        if self.method == 'iqr':
            outlier_mask = self._iqr_method(df)
        elif self.method == 'zscore':
            outlier_mask = self._zscore_method(df)
        elif self.method == 'modified_zscore':
            outlier_mask = self._modified_zscore_method(df)
        else:
            raise ValueError(f"Unknown method: {self.method}")
# ... (condensed) ...
        Q1 = df[self.column].quantile(0.25)
        Q3 = df[self.column].quantile(0.75)
        IQR = Q3 - Q1
        lower = Q1 - 1.5 * IQR
        upper = Q3 + 1.5 * IQR
        df[self.column] = df[self.column].clip(lower=lower, upper=upper)
        return df
```

## Duplicate Detection

```python
class RemoveDuplicates(CleaningStep):
    def __init__(self, subset: list[str] | None = None, strategy: str = 'exact'):
        self.subset = subset
        self.strategy = strategy

    def name(self) -> str:
        return "Remove Duplicates"

    def execute(self, df: pd.DataFrame, report: CleaningReport) -> pd.DataFrame:
        before = len(df)

        if self.strategy == 'exact':
            df = df.drop_duplicates(subset=self.subset, keep='first')
        elif self.strategy == 'fuzzy':
            df = self._fuzzy_dedup(df)

        removed = before - len(df)
        report.add_step(self.name(), removed,
                       # ... (condensed) ...
            for j in range(i + 1, len(values)):
                if j in to_remove:
                    continue
                if fuzz.ratio(str(values[i]).lower(), str(values[j]).lower()) > 90:
                    to_remove.add(j)

        return df.drop(index=list(to_remove)).reset_index(drop=True)
```

## Text Normalization

```python
import re
import unicodedata

class NormalizeText(CleaningStep):
    def __init__(self, columns: list[str]):
        self.columns = columns

    def name(self) -> str:
        return "Normalize Text"

    def execute(self, df: pd.DataFrame, report: CleaningReport) -> pd.DataFrame:
        total_modified = 0
        for col in self.columns:
            if col not in df.columns:
                continue
            original = df[col].copy()
            df[col] = df[col].apply(self._normalize)
            modified = (original != df[col]).sum()
            # ... (condensed) ...
        return None
    local, domain = email.rsplit('@', 1)
    # Remove dots in Gmail local part
    if domain in ('gmail.com', 'googlemail.com'):
        local = local.replace('.', '').split('+')[0]
        domain = 'gmail.com'
    return f"{local}@{domain}"
```

## Date Parsing

```python
from dateutil import parser as dateparser

class ParseDates(CleaningStep):
    COMMON_FORMATS = [
        '%Y-%m-%d',
        '%Y-%m-%dT%H:%M:%S',
        '%Y-%m-%dT%H:%M:%SZ',
        '%Y-%m-%dT%H:%M:%S%z',
        '%m/%d/%Y',
        '%d/%m/%Y',
        '%m-%d-%Y',
        '%d-%m-%Y',
        '%B %d, %Y',
        '%b %d, %Y',
        '%d %B %Y',
        '%Y%m%d',
    ]

    # ... (condensed) ...
            except (ValueError, TypeError):
                continue
        # Fallback to dateutil parser (slower but handles more formats)
        try:
            return pd.Timestamp(dateparser.parse(value, dayfirst=self.dayfirst))
        except (ValueError, TypeError):
            return None
```

## Encoding Fixes

```python
import chardet

def detect_and_fix_encoding(file_path: str) -> pd.DataFrame:
    """Detect file encoding and read with correct encoding."""
    # Detect encoding
    with open(file_path, 'rb') as f:
        raw_data = f.read(100000)  # Read first 100KB for detection
    detected = chardet.detect(raw_data)
    encoding = detected['encoding']
    confidence = detected['confidence']

    print(f"Detected encoding: {encoding} (confidence: {confidence:.0%})")

    # Try detected encoding, fall back to common alternatives
    encodings_to_try = [encoding, 'utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
    for enc in encodings_to_try:
        try:
            df = pd.read_csv(file_path, encoding=enc)
            # ... (condensed) ...
        'Ã¶': 'o',  'Ã¼': 'u',  'Ã±': 'n',  'Ã§': 'c',
        'â€™': "'",  'â€œ': '"',  'â€\x9d': '"',  'â€"': '-',
        'â€"': '--', 'â€¦': '...',
    }
    for bad, good in replacements.items():
        text = text.replace(bad, good)
    return text
```

## Validation Rules

```python
class ValidateConstraints(CleaningStep):
    def name(self) -> str:
        return "Validate Constraints"

    def execute(self, df: pd.DataFrame, report: CleaningReport) -> pd.DataFrame:
        violations = []

        # Email format
        if 'email' in df.columns:
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            invalid_emails = ~df['email'].str.match(email_pattern, na=False)
            count = invalid_emails.sum()
            if count > 0:
                violations.append(f"Invalid emails: {count}")
                df.loc[invalid_emails, 'email'] = None

        # Numeric ranges
        if 'age' in df.columns:
            # ... (condensed) ...
                missing = df[col].isnull().sum()
                if missing > 0:
                    violations.append(f"Missing required '{col}': {missing}")

        report.add_step(self.name(), len(violations),
                       "; ".join(violations) if violations else "All constraints satisfied")
        return df
```

## Data Quality Reporting

```python
def generate_quality_report(df: pd.DataFrame) -> dict:
    """Generate a comprehensive data quality report."""
    return {
        "overview": {
            "total_rows": len(df),
            "total_columns": len(df.columns),
            "total_cells": len(df) * len(df.columns),
            "total_missing": df.isnull().sum().sum(),
            "completeness_pct": round((1 - df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100, 2),
        },
        "columns": {
            col: {
                "dtype": str(df[col].dtype),
                "non_null": int(df[col].notna().sum()),
                "null_count": int(df[col].isnull().sum()),
                "null_pct": round(df[col].isnull().sum() / len(df) * 100, 2),
                "unique_count": int(df[col].nunique()),
                "unique_pct": round(df[col].nunique() / max(df[col].notna().sum(), 1) * 100, 2),
                "sample_values": df[col].dropna().head(3).tolist(),
            }
            for col in df.columns
        },
    }
```

## Best Practices

1. **Never modify raw data in place**: Always work on copies, keep originals
2. **Document every cleaning decision**: Why was this value removed/changed?
3. **Make cleaning reproducible**: Scripts, not manual edits
4. **Generate quality reports before AND after cleaning**: Measure improvement
5. **Handle edge cases explicitly**: Empty strings, whitespace-only, special characters
6. **Validate after cleaning**: Ensure constraints are satisfied
7. **Use appropriate methods per data type**: Median for numeric, mode for categorical
8. **Be conservative with outlier removal**: Flag first, remove only when justified
9. **Test cleaning pipeline on sample data**: Verify behavior before full run
10. **Version control cleaning scripts**: Track changes to cleaning logic

## When to Use

**Use this skill when:**
- Designing or implementing data scrubber solutions
- Reviewing or improving existing data scrubber approaches
- Making architectural or implementation decisions about data scrubber
- Learning data scrubber patterns and best practices
- Troubleshooting data scrubber-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Data Scrubber Analysis

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

**Input:** "Help me implement data scrubber for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended data scrubber approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When data scrubber must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
