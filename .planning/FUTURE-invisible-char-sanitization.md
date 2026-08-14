# Parked — invisible-character sanitisation

**Status: PARKED, not scheduled.** Raised 2026-08-14 off
`github.com/guillaumemeyer/watermarks-remover` (MIT). Sean's call: put it on the block.

Nothing here is started. This file exists so the decisions below are not re-litigated.

---

## What we would build

A `sanitizeInvisible()` in the existing text path, applied in two places:

1. **Agent output** — before it is persisted, copied, or written to a file.
2. **Anything entering agent context** — pasted text, fetched pages, read files.

Direction 2 is the one that matters. It is a security control, not a cosmetic one.

## Why — the real justification

The watermark framing is the weak argument. Models emitting zero-width marks is real but
sporadic, and much of what gets called an "AI watermark" in text is artifact rather than
deliberate signature. Do not build the case on it.

The strong argument is **tag characters (U+E0000–U+E007F) are an invisible prompt-injection
vector**: an entire ASCII payload encodes into them, it survives copy-paste, and it renders
as nothing in every editor. An agent that ingests a web page or a file is eating whatever
is in there. We would want this control if no vendor had ever watermarked anything.

Data hygiene rides along free — these characters corrupt diffs, JSON and CSV.

**Verified 2026-08-14: Wayland does NO invisible-character sanitisation anywhere.** Grepped
`src/` for the codepoints and for `zero-width`/`invisible`; every hit is CSS or prose. This
is a genuine gap, not a duplicate.

## The actual engineering risk is OVER-stripping

Not under-stripping. "Is the deny-list thorough enough" is the wrong question. These are all
load-bearing in real user content:

- **ZWJ (U+200D)** — emoji sequences (family = MAN + ZWJ + WOMAN + ZWJ + GIRL) and
  Indic/Arabic shaping. Written out as codepoints deliberately: a literal family emoji in
  this file contains real ZWJs and trips injection scanners, which is the premise proving
  itself but is noise in a spec.
- **Variation selectors (U+FE00–FE0F)** — emoji presentation.
- **Bidi controls (U+202A–202E, U+2066–2069)** — Hebrew and Arabic.
- **NBSP (U+00A0)** — deliberate typography.

A blunt strip quietly corrupts someone's name or someone's language. **The work is the
allow-list, not the deny-list**, and the tests are per script family (emoji ZWJ sequence,
Devanagari, Arabic, Hebrew RTL) — not per character.

## Character inventory to start from

Taken as a SPEC from the upstream repo's Layer A, not as code:

| Range | What | Disposition |
|---|---|---|
| U+E0000–E007F | Tag characters | **Strip always.** Injection vector, no legitimate use in our surfaces. |
| U+200B, U+2060, U+FEFF | ZWSP, word joiner, BOM | Strip (BOM only when not leading a file). |
| U+200C, U+200D | ZWNJ, ZWJ | **Context-sensitive** — keep inside emoji and Indic/Arabic runs. |
| U+FE00–FE0F, U+E0100–E01EF | Variation selectors | Keep FE0x on emoji; strip the E01xx plane. |
| U+202A–202E, U+2066–2069 | Bidi controls | Keep in RTL runs; strip stray/unbalanced. |
| U+2000–200A, U+202F, U+205F, U+3000, U+00A0 | Exotic spaces | Normalise, do not delete. |
| U+00AD | Soft hyphen | Strip. |

## Explicitly OUT of scope

- **Do not vendor the repo.** It is Python 3.10 stdlib scripts packaged as an agent skill,
  shelling out to `exiftool` and `c2patool`. Wayland is TS/Electron. That is a Python runtime
  plus two external binaries for ~40 lines of TypeScript. On 2026-08-14 the bundled officecli
  self-updated in place mid-build and broke the package — we do not need another out-of-process
  dependency for something this small. Reimplement in TS.

- **Image watermark removal: NO.** Not by default, not behind a flag. Two separate reasons:
  - **C2PA/EXIF/XMP stripping** — C2PA is a disclosed, standardised, cryptographically signed
    provenance manifest the user can inspect. It is not hidden the way tag characters are, so
    the injection argument does not transfer and the "it's dodgy" argument does not hold.
  - **Pixel-domain removal** (CtrlRegen against SynthID / StegaStamp / Tree-Ring /
    StableSignature) — straightforwardly detection evasion; upstream itself concedes it
    "cannot certify vendor detectors will fail." Shipping it puts Wayland in the business of
    passing AI images off as real, against the direction EU AI Act Article 50 transparency
    obligations are heading. A flag is still us shipping it.

- **Layer B (statistical / token-sampling watermarks)** — upstream removes these by rewriting
  the text, which it admits "degrades text quality and tone." Not worth it.

## Size

S/M. The sanitiser is small; the allow-list and the per-script test matrix are the work.
