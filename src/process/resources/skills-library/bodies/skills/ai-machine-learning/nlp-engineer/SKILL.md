---
name: nlp-engineer
description: |
  NLP processing covering tokenization, named entity recognition, sentiment analysis, text classification, summarization, topic modeling, language detection, text preprocessing, transformer architecture, and Hugging Face pipeline usage.
  Use when the user asks about nlp engineer, nlp engineer best practices, or needs guidance on nlp engineer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "ai-ml deep-learning guide"
  category: "ai-machine-learning"
  subcategory: "applied-ai"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# NLP Engineer

## Overview

Natural Language Processing (NLP) encompasses techniques for understanding, generating, and transforming human language with computers. This skill covers both classical NLP methods and modern transformer-based approaches, with practical implementations using Hugging Face, spaCy, and NLTK.

## Text Preprocessing

### Standard Pipeline

```python
import re
import unicodedata

class TextPreprocessor:
    """Standard text preprocessing pipeline."""

    def __init__(self, lowercase: bool = True, remove_urls: bool = True,
                 remove_html: bool = True, remove_special_chars: bool = False):
        self.lowercase = lowercase
        self.remove_urls = remove_urls
        self.remove_html = remove_html
        # ... (condensed) ...
        return text

    def process_batch(self, texts: list[str]) -> list[str]:
        return [self.process(t) for t in texts]
```

### Stopword Removal and Stemming

```python
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer, PorterStemmer

nltk.download('stopwords')
nltk.download('wordnet')

class LinguisticPreprocessor:
    def __init__(self, language: str = "english", use_lemma: bool = True):
        self.stop_words = set(stopwords.words(language))
        self.lemmatizer = WordNetLemmatizer() if use_lemma else None
        # ... (condensed) ...
        elif self.stemmer:
            tokens = [self.stemmer.stem(t) for t in tokens]

        return tokens
```

### When to Preprocess

| Task | Lowercase | Remove Stop Words | Stemming | Remove Punctuation |
|------|-----------|------------------|----------|-------------------|
| Transformer models | NO | NO | NO | NO |
| TF-IDF classification | YES | YES | Optional | YES |
| Topic modeling | YES | YES | YES | YES |
| Sentiment analysis (classical) | YES | Sometimes | NO | NO |
| Named entity recognition | NO | NO | NO | NO |
| Search indexing | YES | Sometimes | Optional | Optional |

**Key insight**: Modern transformer models handle raw text best. Only preprocess for classical ML or information retrieval tasks.

## Tokenization

### Tokenizer Types

```python
# Word-level tokenization
text = "The cat sat on the mat."
word_tokens = text.split()  # ['The', 'cat', 'sat', 'on', 'the', 'mat.']

# Subword tokenization (BPE - used by GPT models)
from transformers import AutoTokenizer
tokenizer = AutoTokenizer.from_pretrained("gpt2")
bpe_tokens = tokenizer.tokenize("unhappiness")
# ['un', 'h', 'app', 'iness']

# WordPiece tokenization (used by BERT)
# ... (condensed) ...
# SentencePiece (used by T5, LLaMA)
tokenizer = AutoTokenizer.from_pretrained("t5-base")
sp_tokens = tokenizer.tokenize("unhappiness")
# ['_un', 'happiness']
```

### Tokenizer Comparison

| Tokenizer | Algorithm | Models | Vocabulary | Handles Unknown |
|-----------|-----------|--------|-----------|-----------------|
| BPE | Byte-Pair Encoding | GPT, RoBERTa | 30K-50K | Subword fallback |
| WordPiece | Greedy longest match | BERT | 30K | [UNK] token |
| SentencePiece | Unigram or BPE | T5, LLaMA | 32K | Subword fallback |
| Tiktoken | BPE (optimized) | GPT-4, GPT-4o | 100K+ | Byte fallback |

### Practical Token Counting

```python
import tiktoken

def count_tokens(text: str, model: str = "gpt-4o") -> int:
    """Count tokens for a given model."""
    encoding = tiktoken.encoding_for_model(model)
    return len(encoding.encode(text))

def truncate_to_tokens(text: str, max_tokens: int, model: str = "gpt-4o") -> str:
    """Truncate text to fit within token limit."""
    encoding = tiktoken.encoding_for_model(model)
    tokens = encoding.encode(text)
    if len(tokens) <= max_tokens:
        return text
    return encoding.decode(tokens[:max_tokens])
```

## Named Entity Recognition (NER)

### spaCy NER

```python
import spacy

nlp = spacy.load("en_core_web_trf")  # Transformer-based (best quality)
# Or: nlp = spacy.load("en_core_web_sm")  # Smaller, faster

def extract_entities(text: str) -> list[dict]:
    """Extract named entities with spaCy."""
    doc = nlp(text)
    entities = []
    for ent in doc.ents:
        entities.append({
            # ... (condensed) ...
#   {"text": "Tim Cook", "label": "PERSON", ...},
#   {"text": "Cupertino", "label": "GPE", ...},
#   {"text": "January 15, 2025", "label": "DATE", ...},
# ]
```

### Hugging Face NER

```python
from transformers import pipeline

ner_pipeline = pipeline(
    "ner",
    model="dslim/bert-base-NER",
    aggregation_strategy="simple",
)

results = ner_pipeline("Elon Musk founded SpaceX in Hawthorne, California.")
# [
#   {"entity_group": "PER", "word": "Elon Musk", "score": 0.99},
#   {"entity_group": "ORG", "word": "SpaceX", "score": 0.98},
#   {"entity_group": "LOC", "word": "Hawthorne, California", "score": 0.97},
# ]
```

### Custom NER Training

```python
import spacy
from spacy.training import Example

def train_custom_ner(
    train_data: list[tuple[str, dict]],
    model: str = "en_core_web_sm",
    n_iter: int = 30,
    output_dir: str = "./custom_ner",
):
    """Train a custom NER model with new entity types."""
    nlp = spacy.load(model)
# ... (condensed) ...
train_data = [
    ("Order #12345 shipped via FedEx", {"entities": [(6, 12, "ORDER_ID"), (25, 30, "CARRIER")]}),
    ("Tracking number TRK-9876 for UPS", {"entities": [(16, 24, "TRACKING"), (29, 32, "CARRIER")]}),
]
```

## Sentiment Analysis

### Hugging Face Sentiment

```python
from transformers import pipeline

# General sentiment
sentiment = pipeline("sentiment-analysis", model="cardiffnlp/twitter-roberta-base-sentiment-latest")
result = sentiment("This product exceeded my expectations!")
# [{"label": "positive", "score": 0.97}]

# Fine-grained sentiment (1-5 stars)
fine_grained = pipeline("sentiment-analysis", model="nlptown/bert-base-multilingual-uncased-sentiment")
result = fine_grained("The food was okay but nothing special.")
# [{"label": "3 stars", "score": 0.45}]
```

### Aspect-Based Sentiment

```python
def aspect_sentiment(text: str, aspects: list[str], client) -> dict:
    """Analyze sentiment for specific aspects of a review."""
    prompt = f"""Analyze the sentiment for each aspect in this review.
For each aspect, output: positive, negative, neutral, or not_mentioned.

Review: "{text}"

Aspects to analyze: {json.dumps(aspects)}

Output JSON: {{"aspect": "sentiment"}}"""

    # ... (condensed) ...
    "Great camera quality but battery life is terrible. Screen is decent.",
    ["camera", "battery", "screen", "price"]
)
# {"camera": "positive", "battery": "negative", "screen": "neutral", "price": "not_mentioned"}
```

## Text Classification

### Zero-Shot Classification

```python
from transformers import pipeline

classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

result = classifier(
    "The company announced record quarterly earnings today.",
    candidate_labels=["business", "sports", "technology", "politics"],
)
# {"labels": ["business", "politics", "technology", "sports"],
#  "scores": [0.92, 0.04, 0.03, 0.01]}
```

### Training a Custom Classifier

```python
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
)
from datasets import Dataset

def train_classifier(
    train_data: list[dict],
    model_name: str = "distilbert-base-uncased",
    # ... (condensed) ...

    trainer.train()
    trainer.save_model(output_dir)
    return trainer
```

## Summarization

### Extractive vs Abstractive

| Approach | Method | Pros | Cons |
|----------|--------|------|------|
| Extractive | Select key sentences | Faithful to source | May be disjointed |
| Abstractive | Generate new text | Fluent, concise | Risk of hallucination |

### Abstractive Summarization

```python
from transformers import pipeline

summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

long_text = """[Long article text here...]"""

summary = summarizer(
    long_text,
    max_length=150,
    min_length=50,
    do_sample=False,
)
print(summary[0]["summary_text"])
```

### Hierarchical Summarization for Long Documents

```python
def hierarchical_summarize(
    text: str,
    chunk_size: int = 3000,
    model_name: str = "facebook/bart-large-cnn",
) -> str:
    """Summarize long documents by chunking, summarizing, then re-summarizing."""
    summarizer = pipeline("summarization", model=model_name)

    # Split into chunks
    chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]

    # ... (condensed) ...
    if len(combined.split()) > 500:
        final = summarizer(combined, max_length=200, min_length=50)[0]["summary_text"]
        return final
    return combined
```

## Topic Modeling

### BERTopic (Modern Approach)

```python
from bertopic import BERTopic

def discover_topics(documents: list[str], n_topics: int = "auto") -> dict:
    """Discover topics in a collection of documents using BERTopic."""
    topic_model = BERTopic(
        language="english",
        nr_topics=n_topics if n_topics != "auto" else None,
        verbose=True,
    )

    topics, probs = topic_model.fit_transform(documents)
# ... (condensed) ...
        "topics": topic_docs,
        "assignments": topics,
        "probabilities": probs,
    }
```

### LDA (Classical Approach)

```python
from sklearn.decomposition import LatentDirichletAllocation
from sklearn.feature_extraction.text import CountVectorizer

def lda_topics(documents: list[str], n_topics: int = 10) -> dict:
    """Classical LDA topic modeling."""
    vectorizer = CountVectorizer(max_df=0.95, min_df=2, max_features=5000, stop_words="english")
    doc_term_matrix = vectorizer.fit_transform(documents)

    lda = LatentDirichletAllocation(
        n_components=n_topics,
        random_state=42,
        # ... (condensed) ...
        top_words = [feature_names[i] for i in topic.argsort()[:-11:-1]]
        topics[topic_idx] = top_words

    return topics
```

## Language Detection

```python
from langdetect import detect, detect_langs

def detect_language(text: str) -> dict:
    """Detect the language of input text."""
    language = detect(text)
    all_langs = detect_langs(text)  # With probabilities

    return {
        "primary": language,
        "all": [{"lang": str(l).split(":")[0], "prob": l.prob} for l in all_langs],
    }

# For higher accuracy with short text:
from transformers import pipeline
lang_detector = pipeline("text-classification", model="papluca/xlm-roberta-base-language-detection")
result = lang_detector("Bonjour le monde")
# [{"label": "fr", "score": 0.99}]
```

## Transformer Architecture Overview

### Core Components

```
Input Text
    |
[Tokenization]
    |
[Token Embeddings + Position Embeddings]
    |
+-- Transformer Block (x N layers) --+
|                                      |
|  [Multi-Head Self-Attention]         |
|  [Add & Layer Norm]                  |
|  [Feed-Forward Network]             |
# ... (condensed) ...
    |
[Task-Specific Head]
    |
Output
```

### Architecture Families

| Architecture | Type | Examples | Best For |
|-------------|------|----------|----------|
| Encoder-only | BERT-style | BERT, RoBERTa, DeBERTa | Classification, NER, extraction |
| Decoder-only | GPT-style | GPT-4, LLaMA, Mistral | Text generation, chat |
| Encoder-Decoder | Seq2Seq | T5, BART, mBART | Translation, summarization |

## Hugging Face Pipeline Quick Reference

```python
from transformers import pipeline

# Sentiment Analysis
sentiment = pipeline("sentiment-analysis")
sentiment("I love this movie!")

# Named Entity Recognition
ner = pipeline("ner", aggregation_strategy="simple")
ner("John works at Google in New York.")

# Question Answering
# ... (condensed) ...

# Feature Extraction (embeddings)
extractor = pipeline("feature-extraction")
embeddings = extractor("Hello world")
```

## Checklist

- [ ] Choose preprocessing level based on the task (minimal for transformers)
- [ ] Select the right tokenizer for your model family
- [ ] Use spaCy or Hugging Face for NER based on accuracy vs speed needs
- [ ] Implement sentiment analysis with appropriate granularity
- [ ] Build text classification with zero-shot first, fine-tune if needed
- [ ] Apply hierarchical summarization for long documents
- [ ] Use BERTopic for modern topic modeling, LDA for interpretability
- [ ] Add language detection for multilingual pipelines
- [ ] Choose the right transformer architecture for your task type
- [ ] Profile inference latency and optimize (distillation, quantization)
- [ ] Version models and track performance metrics over time

## When to Use

**Use this skill when:**
- Designing or implementing nlp engineer solutions
- Reviewing or improving existing nlp engineer approaches
- Making architectural or implementation decisions about nlp engineer
- Learning nlp engineer patterns and best practices
- Troubleshooting nlp engineer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Nlp Engineer Analysis

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

**Input:** "Help me implement nlp engineer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended nlp engineer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When nlp engineer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
