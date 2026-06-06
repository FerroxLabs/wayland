---
name: embedding-engineer
description: |
  Vector embedding specialist covering embedding model comparison, dimensionality reduction, similarity metrics (cosine, euclidean, dot product), embedding fine-tuning, multi-modal embeddings, embedding visualization, and index optimization.
  Use when the user asks about embedding engineer, embedding engineer best practices, or needs guidance on embedding engineer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "ai-ml data-science guide"
  category: "ai-machine-learning"
  subcategory: "llm-engineering"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Embedding Engineer

## Overview

Vector embeddings are dense numerical representations of data (text, images, audio) that capture semantic meaning in a continuous vector space. This skill covers the full lifecycle of working with embeddings: model selection, generation, similarity computation, fine-tuning, visualization, and production index optimization.

## Embedding Fundamentals

### What Embeddings Capture

Embeddings map discrete objects (words, sentences, images) into a continuous vector space where geometric relationships encode semantic relationships. Objects with similar meanings cluster together; dissimilar objects are far apart.

```python
from openai import OpenAI

client = OpenAI()

def get_embedding(text: str, model: str = "text-embedding-3-small") -> list[float]:
    """Generate an embedding vector for a text string."""
    response = client.embeddings.create(
        model=model,
        input=text,
    )
    return response.data[0].embedding
# ... (condensed) ...
emb2 = get_embedding("A feline rested on the rug")
emb3 = get_embedding("Stock prices rose sharply today")

# emb1 and emb2 will be much closer than emb1 and emb3
```

## Embedding Model Comparison

### Text Embedding Models

| Model | Provider | Dimensions | Max Tokens | MTEB Score | Cost/1M tokens | Best For |
|-------|----------|-----------|------------|------------|----------------|----------|
| text-embedding-3-large | OpenAI | 3072 | 8191 | 64.6 | $0.13 | High quality |
| text-embedding-3-small | OpenAI | 1536 | 8191 | 62.3 | $0.02 | Cost-effective |
| voyage-3 | Voyage AI | 1024 | 32000 | 67.4 | $0.06 | Long documents |
| all-MiniLM-L6-v2 | HuggingFace | 384 | 256 | 56.3 | Free (OSS) | Local/fast |
| bge-large-en-v1.5 | BAAI | 1024 | 512 | 64.2 | Free (OSS) | Self-hosted |
| e5-mistral-7b-instruct | Microsoft | 4096 | 32768 | 66.6 | Free (OSS) | Max quality (OSS) |
| Cohere embed-v3 | Cohere | 1024 | 512 | 64.5 | $0.10 | Multilingual |
| jina-embeddings-v3 | Jina AI | 1024 | 8192 | 65.5 | $0.02 | Long docs (OSS) |

### Selection Decision Tree

```
What is your budget constraint?
  FREE -> Continue to open-source options
  PAID -> Continue to API options

--- Open-Source Path ---
Need max quality regardless of compute?
  YES -> e5-mistral-7b-instruct (GPU required)
  NO  -> Continue

Need fast inference (CPU)?
  YES -> all-MiniLM-L6-v2 (384-dim, very fast)
  # ... (condensed) ...

Need multilingual?
  YES -> Cohere embed-v3
  NO  -> text-embedding-3-small (best cost/quality ratio)
```

### Matryoshka (Dimensional Reduction at Generation)

OpenAI text-embedding-3 models support shortening embeddings without retraining:

```python
# Full dimensions
full = client.embeddings.create(
    model="text-embedding-3-large",
    input="Hello world",
    dimensions=3072,  # Full size
)

# Reduced dimensions (still useful!)
reduced = client.embeddings.create(
    model="text-embedding-3-large",
    input="Hello world",
    dimensions=256,  # 12x smaller, ~5% quality loss
)
```

## Similarity Metrics

### Cosine Similarity

Measures the angle between two vectors. Invariant to vector magnitude. Most common for text embeddings.

```python
import numpy as np

def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Range: [-1, 1]. 1 = identical direction, 0 = orthogonal, -1 = opposite."""
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
```

### Euclidean Distance

Measures straight-line distance. Sensitive to magnitude. Best when magnitude matters.

```python
def euclidean_distance(a: np.ndarray, b: np.ndarray) -> float:
    """Range: [0, inf). 0 = identical. Lower = more similar."""
    return np.linalg.norm(a - b)
```

### Dot Product

Measures both direction and magnitude similarity. Fastest to compute.

```python
def dot_product(a: np.ndarray, b: np.ndarray) -> float:
    """Range: (-inf, inf). Higher = more similar (when vectors are normalized)."""
    return np.dot(a, b)
```

### When to Use Which Metric

| Metric | When to Use | Properties |
|--------|-------------|------------|
| Cosine | Default for text/semantic search | Normalized, magnitude-invariant |
| Euclidean | Spatial data, clustering | Sensitive to magnitude |
| Dot Product | Pre-normalized vectors, speed-critical | Fastest, assumes normalization |

**Key insight**: If vectors are L2-normalized, cosine similarity and dot product produce the same ranking. Most embedding models output normalized vectors, so dot product is preferred for speed.

## Batch Embedding Pipeline

```python
import numpy as np
from typing import Generator

class EmbeddingPipeline:
    """Production embedding pipeline with batching and caching."""

    def __init__(self, model: str = "text-embedding-3-small", batch_size: int = 100):
        self.client = OpenAI()
        self.model = model
        self.batch_size = batch_size
        self.cache = {}
# ... (condensed) ...

    def _batch(self, items, size) -> Generator:
        for i in range(0, len(items), size):
            yield items[i:i + size]
```

## Dimensionality Reduction

### PCA

```python
from sklearn.decomposition import PCA

def reduce_with_pca(embeddings: np.ndarray, target_dims: int = 128) -> np.ndarray:
    """Reduce embedding dimensions using PCA."""
    pca = PCA(n_components=target_dims)
    reduced = pca.fit_transform(embeddings)

    # Report variance retained
    explained_variance = sum(pca.explained_variance_ratio_)
    print(f"Retained {explained_variance:.1%} of variance with {target_dims} dims")

    return reduced
```

### UMAP (for visualization and moderate reduction)

```python
import umap

def reduce_with_umap(
    embeddings: np.ndarray,
    target_dims: int = 2,
    n_neighbors: int = 15,
    min_dist: float = 0.1,
) -> np.ndarray:
    """Reduce dimensions with UMAP (preserves local structure)."""
    reducer = umap.UMAP(
        n_components=target_dims,
        n_neighbors=n_neighbors,
        min_dist=min_dist,
        metric="cosine",
        random_state=42,
    )
    return reducer.fit_transform(embeddings)
```

### Choosing Reduction Method

```
Purpose: Visualization (2D/3D)?
  YES -> UMAP or t-SNE
  NO  -> Continue

Purpose: Storage/speed optimization?
  YES -> Continue

Reduction factor < 4x (e.g., 1536 -> 512)?
  YES -> PCA (linear, fast, preserves global structure)
  NO  -> Continue

Reduction factor > 10x?
  YES -> Consider Matryoshka embeddings or re-embedding with smaller model
  NO  -> PCA with quality check on downstream task
```

## Embedding Fine-Tuning

### Sentence Transformers Fine-Tuning

```python
from sentence_transformers import SentenceTransformer, InputExample, losses
from torch.utils.data import DataLoader

def fine_tune_embeddings(
    base_model: str = "all-MiniLM-L6-v2",
    train_pairs: list[tuple[str, str, float]] = None,
    output_path: str = "fine-tuned-model",
    epochs: int = 3,
    batch_size: int = 16,
):
    """Fine-tune embedding model on domain-specific similarity pairs."""
    # ... (condensed) ...
        show_progress_bar=True,
    )

    return model
```

### Contrastive Fine-Tuning (Triplet Loss)

```python
from sentence_transformers import losses

def fine_tune_contrastive(
    base_model: str,
    triplets: list[tuple[str, str, str]],
    output_path: str,
):
    """Fine-tune using anchor, positive, negative triplets."""
    model = SentenceTransformer(base_model)

    # Each triplet: (anchor, positive, negative)
    # ... (condensed) ...
        output_path=output_path,
    )

    return model
```

### Generating Training Data

```python
def generate_training_pairs(documents: list[dict]) -> list[tuple[str, str, float]]:
    """Generate similarity pairs from domain documents."""
    pairs = []

    # Positive pairs: chunks from same document
    for doc in documents:
        chunks = chunk_document(doc)
        for i in range(len(chunks)):
            for j in range(i + 1, min(i + 3, len(chunks))):
                pairs.append((chunks[i], chunks[j], 0.8))

    # ... (condensed) ...
                    0.2,
                ))

    return pairs
```

## Multi-Modal Embeddings

### CLIP for Text-Image Embeddings

```python
from transformers import CLIPModel, CLIPProcessor
import torch

class MultiModalEmbedder:
    """Generate embeddings for both text and images in shared space."""

    def __init__(self, model_name: str = "openai/clip-vit-large-patch14"):
        self.model = CLIPModel.from_pretrained(model_name)
        self.processor = CLIPProcessor.from_pretrained(model_name)

    def embed_text(self, texts: list[str]) -> np.ndarray:
        # ... (condensed) ...
    def text_image_similarity(self, text: str, image) -> float:
        text_emb = self.embed_text([text])
        image_emb = self.embed_image([image])
        return cosine_similarity(text_emb[0], image_emb[0])
```

### ImageBind (Text, Image, Audio, Video)

```python
# ImageBind supports 6 modalities in a single embedding space
from imagebind.models import imagebind_model
from imagebind import data as imagebind_data

model = imagebind_model.imagebind_huge(pretrained=True)
model.to("cuda")

# Load different modalities
inputs = {
    imagebind_data.ModalityType.TEXT: imagebind_data.load_and_transform_text(
        ["a dog barking"], "cuda"
    # ... (condensed) ...

# Compare across modalities
text_emb = embeddings[imagebind_data.ModalityType.TEXT]
audio_emb = embeddings[imagebind_data.ModalityType.AUDIO]
```

## Embedding Visualization

### Interactive Visualization with Plotly

```python
import plotly.express as px
import pandas as pd

def visualize_embeddings(
    embeddings: np.ndarray,
    labels: list[str],
    texts: list[str] = None,
    method: str = "umap",
) -> None:
    """Create interactive 2D visualization of embeddings."""

    # ... (condensed) ...
        title=f"Embedding Space ({method.upper()})",
        width=900, height=700,
    )
    fig.show()
```

### Cluster Analysis

```python
from sklearn.cluster import KMeans, DBSCAN

def analyze_embedding_clusters(
    embeddings: np.ndarray,
    method: str = "kmeans",
    n_clusters: int = 10,
) -> dict:
    """Analyze natural clusters in embedding space."""

    if method == "kmeans":
        clusterer = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        # ... (condensed) ...
        "n_clusters": len(set(labels)) - (1 if -1 in labels else 0),
        "silhouette_score": sil_score,
        "centroids": centroids,
    }
```

## Index Optimization

### HNSW Parameters

```python
# HNSW (Hierarchical Navigable Small World) is the most common ANN index

# Key parameters:
# M: Number of bi-directional links per element (higher = better quality, more memory)
# ef_construction: Size of dynamic candidate list during build (higher = better quality, slower build)
# ef_search: Size of dynamic candidate list during search (higher = better quality, slower search)

HNSW_CONFIGS = {
    "speed_priority": {
        "M": 8,
        "ef_construction": 100,
        # ... (condensed) ...
        "ef_search": 200,
        # ~99.5% recall, slower
    },
}
```

### Memory Estimation

```python
def estimate_index_memory(
    n_vectors: int,
    dimensions: int,
    M: int = 16,
    bytes_per_dim: int = 4,
) -> dict:
    """Estimate memory requirements for HNSW index."""

    # Raw vector storage
    vector_bytes = n_vectors * dimensions * bytes_per_dim

    # ... (condensed) ...

# Example: 10M vectors at 1536 dimensions
mem = estimate_index_memory(10_000_000, 1536)
# ~68 GB total
```

### Quantization for Memory Reduction

```python
# Product Quantization (PQ) can reduce memory 4-16x
# with minimal quality loss

# Scalar quantization: float32 -> int8 (4x reduction)
def scalar_quantize(vectors: np.ndarray) -> tuple[np.ndarray, dict]:
    """Quantize float32 vectors to int8."""
    mins = vectors.min(axis=0)
    maxs = vectors.max(axis=0)
    ranges = maxs - mins
    ranges[ranges == 0] = 1

    # ... (condensed) ...

def scalar_dequantize(quantized: np.ndarray, params: dict) -> np.ndarray:
    """Restore float32 from int8 quantized vectors."""
    return quantized.astype(np.float32) / 255 * params["ranges"] + params["mins"]
```

## Benchmarking Embeddings

```python
def benchmark_embedding_quality(
    model_fn,
    test_pairs: list[tuple[str, str, float]],
) -> dict:
    """Benchmark embedding model on similarity task."""
    from scipy.stats import spearmanr

    predicted_scores = []
    true_scores = []

    for text_a, text_b, true_score in test_pairs:
        # ... (condensed) ...
        "p_value": p_value,
        "mean_predicted_similarity": np.mean(predicted_scores),
        "std_predicted_similarity": np.std(predicted_scores),
    }
```

## Checklist

- [ ] Select embedding model based on quality, cost, latency, and context length needs
- [ ] Choose the right similarity metric (cosine for most text tasks)
- [ ] Implement batched embedding generation with caching
- [ ] Apply dimensionality reduction if storage/speed is a concern
- [ ] Fine-tune embeddings on domain data if generic models underperform
- [ ] Visualize embedding space to verify semantic clustering
- [ ] Configure HNSW index parameters (M, ef_construction, ef_search) appropriately
- [ ] Estimate and plan for memory requirements at scale
- [ ] Consider quantization for large-scale deployments
- [ ] Benchmark embedding quality on domain-specific similarity tasks
- [ ] Monitor embedding drift as source data evolves

## When to Use

**Use this skill when:**
- Designing or implementing embedding engineer solutions
- Reviewing or improving existing embedding engineer approaches
- Making architectural or implementation decisions about embedding engineer
- Learning embedding engineer patterns and best practices
- Troubleshooting embedding engineer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Embedding Engineer Analysis

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

**Input:** "Help me implement embedding engineer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended embedding engineer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When embedding engineer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
