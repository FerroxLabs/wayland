---
name: csv-transformer
description: |
  Expert data format transformation covering CSV parsing edge cases, encoding detection, JSON/XML/Parquet/Avro conversion, data type inference, schema validation, large file handling with streaming parsers, delimiter detection, and handling of malformed data across all common data interchange formats.
  Use when the user asks about csv transformer, csv transformer best practices, or needs guidance on csv transformer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "data-science sql guide"
  category: "data-engineering"
  subcategory: "pipelines-etl"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# CSV Transformer

## Overview

Data format transformation is deceptively complex. What appears to be a simple task -- reading a CSV and writing Parquet -- actually involves dozens of edge cases around encoding, quoting, escaping, type inference, and schema handling. This skill covers the full landscape of data format operations needed for production data engineering.

## CSV Parsing: The Hard Parts

### RFC 4180 Compliance and Real-World Deviations

```python
import csv
import io

# RFC 4180 standard CSV
# - Fields separated by commas
# - Records terminated by CRLF
# - Fields MAY be enclosed in double quotes
# - Double quotes within quoted fields are escaped by doubling

# Real-world CSV problems and solutions:

# ... (condensed) ...
        # 'utf-8-sig' strips BOM if present, works normally if absent
        reader = csv.DictReader(f)
        for row in reader:
            yield row
```

### Delimiter Detection

```python
import csv
from collections import Counter

def detect_delimiter(filepath, sample_size=10000):
    """
    Detect CSV delimiter by analyzing character frequency patterns.
    Works for comma, tab, pipe, semicolon, and other single-char delimiters.
    """
    candidates = [',', '\t', '|', ';', ':']

    with open(filepath, 'r', encoding='utf-8-sig') as f:
        # ... (condensed) ...
        dialect = csv.Sniffer().sniff(sample, delimiters=',\t|;:')
        return dialect.delimiter
    except csv.Error:
        return ','  # fallback
```

### Encoding Detection

```python
import chardet
from pathlib import Path

def detect_encoding(filepath, sample_size=100000):
    """
    Detect file encoding using chardet with confidence threshold.
    Falls back to common encodings if confidence is low.
    """
    raw = Path(filepath).read_bytes()[:sample_size]

    result = chardet.detect(raw)
# ... (condensed) ...
    with open(input_path, 'r', encoding=source_encoding, errors='replace') as src:
        with open(output_path, 'w', encoding=target_encoding) as dst:
            for chunk in iter(lambda: src.read(65536), ''):
                dst.write(chunk)
```

## Data Type Inference

```python
import re
from datetime import datetime
from typing import Optional, List, Dict, Any

class TypeInferrer:
    """Infer column types from sample data."""

    DATE_FORMATS = [
        '%Y-%m-%d',
        '%m/%d/%Y',
        '%d/%m/%Y',
        # ... (condensed) ...
        for col, values in columns.items():
            schema[col] = TypeInferrer.infer_type(values)

        return schema
```

## Format Conversions

### CSV to Parquet

```python
import pyarrow as pa
import pyarrow.csv as pcsv
import pyarrow.parquet as pq

def csv_to_parquet(csv_path, parquet_path, schema=None, chunk_size=100000):
    """
    Convert CSV to Parquet with optimal settings.
    Handles large files via streaming reads.
    """
    read_options = pcsv.ReadOptions(
        block_size=64 * 1024 * 1024,  # 64 MB read blocks
        # ... (condensed) ...
            writer.write_table(table)
    finally:
        if writer:
            writer.close()
```

### JSON to Parquet

```python
import json
import pyarrow as pa
import pyarrow.parquet as pq

def jsonl_to_parquet(jsonl_path, parquet_path, batch_size=50000):
    """Convert JSON Lines (newline-delimited JSON) to Parquet."""
    batch = []
    writer = None

    with open(jsonl_path, 'r', encoding='utf-8') as f:
        for line in f:
            # ... (condensed) ...
        max_level=3,
    )

    df.to_parquet(parquet_path, engine='pyarrow', compression='snappy', index=False)
```

### XML Parsing

```python
import xml.etree.ElementTree as ET
from lxml import etree
import pandas as pd

def xml_to_dataframe(xml_path, record_tag, namespace=None):
    """
    Parse XML to DataFrame. Uses iterparse for memory efficiency.
    """
    nsmap = namespace or {}
    records = []

    # ... (condensed) ...
                record[col_name] = None
        records.append(record)

    return pd.DataFrame(records)
```

### Avro Operations

```python
import fastavro
from fastavro import writer, reader, parse_schema

# Avro schema definition
avro_schema = {
    "type": "record",
    "name": "Customer",
    "namespace": "com.company.data",
    "fields": [
        {"name": "customer_id", "type": "int"},
        {"name": "name", "type": "string"},
        # ... (condensed) ...
                record[name] = coercer(raw) if raw else None
            records.append(record)

    write_avro(records, avro_path, parse_schema(schema))
```

## Schema Validation

```python
import jsonschema
from dataclasses import dataclass
from typing import List, Optional

@dataclass
class ValidationError:
    row: int
    column: str
    value: str
    expected_type: str
    message: str
# ... (condensed) ...
            if allowed and value not in allowed:
                self.errors.append(ValidationError(
                    row_num, col_name, value, f'enum', f'Not in {allowed}'
                ))
```

## Large File Handling

### Streaming Processing

```python
def process_large_csv(filepath, process_fn, chunk_size=50000):
    """Process CSV files of any size using chunked reading."""
    import pandas as pd

    results = []
    encoding = detect_encoding(filepath)
    delimiter = detect_delimiter(filepath)

    for chunk in pd.read_csv(
        filepath,
        encoding=encoding,
        # ... (condensed) ...
        while mm.readline():
            count += 1
        mm.close()
    return count
```

### Parallel Processing

```python
from concurrent.futures import ProcessPoolExecutor
import os

def split_and_process(filepath, process_fn, workers=None):
    """Split large CSV and process chunks in parallel."""
    if workers is None:
        workers = os.cpu_count()

    # Split file into chunks by byte offset
    file_size = os.path.getsize(filepath)
    chunk_size = file_size // workers
# ... (condensed) ...

        results = [f.result() for f in futures]

    return results
```

## Format Comparison Decision Matrix

| Format | Schema | Compression | Splittable | Column Pruning | Best For |
|--------|--------|-------------|------------|----------------|----------|
| CSV | No | No (unless gzipped) | Yes (uncompressed) | No | Interchange, human readability |
| JSON/JSONL | Self-describing | No (unless gzipped) | JSONL: Yes | No | APIs, semi-structured data |
| Parquet | Embedded | Snappy/ZSTD/Gzip | Yes | Yes | Analytics, data lakes |
| Avro | Embedded | Deflate/Snappy | Yes | No | Streaming, schema evolution |
| ORC | Embedded | ZLIB/Snappy/LZO | Yes | Yes | Hive ecosystems |
| Arrow/IPC | Embedded | LZ4/ZSTD | No | Yes | In-memory analytics, IPC |

**Default recommendation**: Use Parquet with Snappy compression for analytical workloads. Use Avro for streaming and message systems. Use CSV only for human interchange or legacy system requirements.

## When to Use

**Use this skill when:**
- Designing or implementing csv transformer solutions
- Reviewing or improving existing csv transformer approaches
- Making architectural or implementation decisions about csv transformer
- Learning csv transformer patterns and best practices
- Troubleshooting csv transformer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Csv Transformer Analysis

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

**Input:** "Help me implement csv transformer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended csv transformer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When csv transformer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
