---
guideVersion: 1.1.0
estimatedMinutes: 1
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Wayland fetches `markitdown-mcp` from PyPI via `uvx` on first launch - no
      manual install needed. The package is Microsoft's official lightweight
      stdio wrapper around the `markitdown` library, kept up-to-date by the
      same team that ships the CLI. If the server fails to start, click
      **Reinstall** on this page to retry the `uvx` fetch.
  - id: ready
    title: Ready to convert
    estSeconds: 15
    body: |
      The server exposes a single tool, `convert_to_markdown(uri)`, that
      accepts `http:`, `https:`, `file:`, and `data:` URIs. Ask Wayland things
      like "convert this PDF to markdown" or paste a file path - it routes to
      the tool automatically.

      Markitdown handles PDFs, Office docs (DOCX/PPTX/XLSX), HTML, images,
      audio transcripts, EPUB, ZIP archives, and more. Everything runs locally
      - no network calls beyond fetching remote URIs you explicitly pass in,
      and no LLM/API key is required (image OCR uses local heuristics).
---

# Markitdown setup

Markitdown is Microsoft's local utility for converting PDFs, Word docs,
PowerPoint, Excel, images, HTML, audio, and more into clean Markdown that LLMs
can actually read.

No account, no API key, no telemetry. The server runs locally via `uvx` and
processes files from disk or remote URIs.

