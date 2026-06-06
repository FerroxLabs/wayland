---
name: jupyter-workflow-master
description: |
  Guide for productive Jupyter notebook workflows including kernel management, reproducibility patterns, nbconvert pipelines, parameterized execution, and collaborative notebook practices.
  Use when the user asks about jupyter workflow master, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of jupyter workflow master or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "data-science statistics checklist template python api-design testing automation"
  category: "data-analysis"
  subcategory: "statistics-modeling"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Jupyter Workflow Master

You are an expert in Jupyter notebook workflows, specializing in reproducibility, automation, and professional notebook practices that scale from exploration to production.


## When to Use

**Use this skill when:**
- User asks about jupyter workflow master techniques or best practices
- User needs guidance on jupyter workflow master concepts
- User wants to implement or improve their approach to jupyter workflow master

**Do NOT use when:**
- The request falls outside the scope of jupyter workflow master
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Notebook Project Structure

```
project/
├── notebooks/
│   ├── 01-data-collection.ipynb
│   ├── 02-exploration.ipynb
│   ├── 03-analysis.ipynb
│   └── 04-reporting.ipynb
├── src/
│   └── helpers/
│       ├── __init__.py
│       ├── data.py
│       └── viz.py
├── data/
│   ├── raw/
│   ├── processed/
│   └── external/
├── outputs/
│   ├── figures/
│   └── reports/
├── requirements.txt
└── pyproject.toml
```

## Kernel Management

### Creating Dedicated Kernels

```shell
# Create a project-specific virtual environment
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
.venv\Scripts\activate     # Windows

# Install ipykernel and register
install the package via pip ipykernel
python -m ipykernel install --user --name=project-name --display-name="Project Name (Python 3.11)"

# List available kernels
jupyter kernelspec list

# Remove a kernel
jupyter kernelspec uninstall project-name
```

### Kernel Spec Configuration

```json
{
  "argv": ["python", "-m", "ipykernel_launcher", "-f", "{connection_file}"],
  "display_name": "Project Name (Python 3.11)",
  "language": "python",
  "metadata": {
    "debugger": true
  },
  "env": {
    "PYTHONPATH": "${PROJECT_DIR}/src"
  }
}
```

## Reproducibility Patterns

### Cell Execution Discipline

```python
# Cell 1: Always pin your environment
import sys
print(f"Python: {sys.version}")
print(f"Working dir: {os.getcwd()}")

# Pin package versions
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

print(f"pandas: {pd.__version__}")
print(f"numpy: {np.__version__}")
```

### Deterministic Randomness

```python
import numpy as np
import random

SEED = 42

def set_all_seeds(seed=SEED):
    """Set seeds for full reproducibility."""
    random.seed(seed)
    np.random.seed(seed)
    environment-variables['PYTHONHASHSEED'] = str(seed)
    # If using torch:
    # torch.manual_seed(seed)
    # torch.cuda.manual_seed_all(seed)

set_all_seeds()
```

### Watermarking Notebooks

```python
# Install: install the package via pip watermark
%load_ext watermark
%watermark -v -p pandas,numpy,scikit-learn,matplotlib -g -r -b
```

Output example:
```
Python implementation: CPython
Python version       : 3.11.5
pandas  : 2.1.1
numpy   : 1.25.2
Last updated: 2025-01-15T10:30:00
Git hash: a1b2c3d
Git branch: main
```

## nbconvert Pipelines

### Command-Line Conversion

```shell
# Convert to HTML report
jupyter nbconvert --to html --no-input notebook.ipynb

# Convert to PDF (requires LaTeX)
jupyter nbconvert --to pdf notebook.ipynb

# Convert to Python script
jupyter nbconvert --to script notebook.ipynb

# Execute and convert in one step
jupyter nbconvert --to html --execute notebook.ipynb \
  --ExecutePreprocessor.timeout=600

# Convert with custom template
jupyter nbconvert --to html --template=classic notebook.ipynb
```

### Programmatic Conversion

```python
import nbformat
from nbconvert import HTMLExporter
from nbconvert.preprocessors import ExecutePreprocessor

# Load notebook
with open('analysis.ipynb') as f:
    nb = nbformat.read(f, as_version=4)

# Execute it
ep = ExecutePreprocessor(timeout=600, kernel_name='python3')
ep.preprocess(nb, {'metadata': {'path': './'}})

# Export to HTML
html_exporter = HTMLExporter()
html_exporter.exclude_input = True  # Hide code cells
(body, resources) = html_exporter.from_notebook_node(nb)

with open('report.html', 'w') as f:
    f.write(body)
```

## Parameterized Execution

### Using Papermill

```shell
install the package via pip papermill

# Execute with parameters
papermill input.ipynb output.ipynb \
  -p start_date "2025-01-01" \
  -p end_date "2025-01-31" \
  -p region "us-west"
```

### Parameter Cell Pattern

```python
# Tag this cell as "parameters" in notebook metadata
# Papermill will inject values after this cell
start_date = "2025-01-01"
end_date = "2025-01-31"
region = "us-west"
output_dir = "./outputs"
```

### Batch Execution Script

```python
import papermill as pm
from pathlib import Path
from datetime import datetime, timedelta

regions = ["us-west", "us-east", "eu-west", "apac"]
output_dir = Path("outputs") / datetime.now().strftime("%Y%m%d")
output_dir.mkdir(parents=True, exist_ok=True)

for region in regions:
    print(f"Processing {region}...")
    pm.execute_notebook(
        'template.ipynb',
        str(output_dir / f'report_{region}.ipynb'),
        parameters={
            'region': region,
            'start_date': '2025-01-01',
            'end_date': '2025-01-31'
        },
        kernel_name='project-kernel'
    )
```

## Magic Commands Reference

### Essential Magics

```python
# Timing
%time result = slow_function()          # Single run timing
%timeit result = fast_function()        # Statistical timing (multiple runs)
%%time                                  # Time entire cell

# Debugging
%debug                                  # Post-mortem debugger
%pdb on                                 # Auto-trigger debugger on exception

# Shell commands
!install the package via pip package-name
!ls -la data/

# Environment
%env API_KEY=your-api-key-here
%matplotlib inline
%autoreload 2                           # Auto-reload imported modules
```

### Custom Magic for Data Profiling

```python
from IPython.core.magic import register_cell_magic

@register_cell_magic
def profile_df(line, cell):
    """Quick DataFrame profiling magic."""
    import pandas as pd
    # Execute the cell code and inspect the resulting DataFrame
    result = get_ipython().run_cell(cell)
    df = result.result
    print(f"Shape: {df.shape}")
    print(f"Memory: {df.memory_usage(deep=True).sum() / 1e6:.1f} MB")
    print(f"Nulls:\n{df.isnull().sum()[df.isnull().sum() > 0]}")
    print(f"Dtypes:\n{df.dtypes.value_counts()}")
    return df
```

## Notebook Testing

### Using nbval for Regression Testing

```shell
install the package via pip nbval

# Test that notebook outputs match saved outputs
pytest --nbval notebook.ipynb

# Test that notebooks execute without error (ignore output)
pytest --nbval-lax notebook.ipynb

# Test specific notebooks
pytest --nbval-lax notebooks/*.ipynb -v
```

### CI Pipeline Integration

```yaml
# GitHub Actions example
name: Notebook Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: install the package via pip -r requirements.txt
      - run: pytest --nbval-lax notebooks/ -v --timeout=300
```

## Collaborative Notebook Practices

### Git-Friendly Notebooks

```shell
# Install nbstripout to remove outputs before committing
install the package via pip nbstripout
nbstripout --install              # Git filter (auto-strip on commit)
nbstripout --install --attributes .gitattributes
```

### .gitattributes for Notebooks

```
*.ipynb filter=nbstripout
*.ipynb diff=ipynb
```

### Review-Friendly Diffs

```shell
# Install nbdime for meaningful notebook diffs
install the package via pip nbdime
nbdime config-git --enable --global

# Use in terminal
nbdiff notebook_v1.ipynb notebook_v2.ipynb

# Launch visual diff tool
nbdiff-web notebook_v1.ipynb notebook_v2.ipynb
```

## Performance Optimization

### Memory Management

```python
import gc

# Monitor memory in notebook
%load_ext memory_profiler
%memit large_operation()

# Explicit cleanup between heavy cells
del large_dataframe
gc.collect()

# Check variable sizes
from sys import getsizeof
%who_ls  # List all variables in the notebook namespace
```

### Async Execution

```python
import nest_asyncio
nest_asyncio.apply()  # Enable async in Jupyter

import asyncio
import aiohttp

async def fetch_all(urls):
    async with aiohttp.ClientSession() as session:
        tasks = [session.get(url) for url in urls]
        return await asyncio.gather(*tasks)

results = await fetch_all(urls)
```

## Notebook Quality Checklist

| Check | Description |
|-------|-------------|
| Linear execution | Restart kernel and run all cells top-to-bottom |
| No hidden state | No reliance on cell execution order |
| Pinned versions | All package versions recorded |
| Clear narrative | Markdown cells explain the why, not just the what |
| Clean outputs | Remove debug prints before sharing |
| Parameterized | Hard-coded values extracted to parameter cells |
| Tested | Notebook passes nbval or manual re-execution |
| Stripped outputs | Outputs removed from version control |
| Documented | README explains how to set up and run |
| Portable | Relative paths, environment-agnostic |

## Anti-Patterns to Avoid

1. **Global state mutations** - Avoid modifying global variables across cells unpredictably
2. **Out-of-order execution** - Always verify notebooks run linearly
3. **Mega-notebooks** - Split notebooks exceeding 50 cells into logical stages
4. **Copy-paste between notebooks** - Extract shared logic to importable modules
5. **Uncommitted data paths** - Use relative paths and config files
6. **Missing kernel specs** - Document the kernel and environment setup
7. **No error handling** - Wrap data loading and API calls in try/except
8. **Secrets in cells** - Use environment variables or secret managers


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to jupyter workflow master
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Jupyter Workflow Master Analysis

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

**Input:** "Help me with jupyter workflow master for my current situation"

**Output:**

Based on your situation, here is a structured approach to jupyter workflow master:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
