---
name: print-design-spec
description: |
  Produces print-ready design specifications with dimensions, bleed, CMYK color values, resolution requirements, file format, and fold/cut mark placement.
  Use when the user asks to prepare a design for print, create a print specification, define print-ready file requirements, or check print production settings.
  Do NOT use for digital screen design (use wireframe-specification), color palette creation (use color-palette-design), or typography selection (use typography-system).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "design template checklist"
  category: "design-creative"
  subcategory: "graphic-design"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Print Design Spec

## When to Use

**Use this skill when:**
- A user needs complete print-ready file specifications for a physical print product -- business cards, letterhead, brochures, flyers, posters, packaging, labels, booklets, envelopes, or specialty items
- A user asks what bleed, trim, or safe area values to use for a specific product type or printer
- A user is converting an existing digital design to print and needs to know what settings to apply (color mode conversion, resolution upscaling assessment, ICC profile selection)
- A user wants to specify printing method, paper stock, and finishing options for a job and needs those choices translated into technical file requirements
- A user needs a deliverable spec to hand to a print vendor or a designer -- a complete technical brief covering all production parameters
- A user is preparing a multi-piece print campaign (e.g., A4 flyer + DL envelope + business card) and needs consistent specifications across all formats
- A user asks about fold mechanics, panel ordering, scoring thresholds, or die-cut requirements
- A user is troubleshooting a print rejection -- mismatched color mode, insufficient bleed, font embedding failure, excessive ink coverage

**Do NOT use when:**
- The user wants to design a screen-based layout, wireframe, or UI (use `wireframe-specification`)
- The user needs a color palette created or refined for digital or brand use (use `color-palette-design`)
- The user is selecting or pairing typefaces without a defined print context (use `typography-system`)
- The user is designing a web or mobile layout with responsive breakpoints (use `responsive-layout-design`)
- The user only wants file export settings for a single, already-fully-specified design and the spec already exists from a vendor -- that is a file export task, not a spec creation task
- The user is asking about digital advertising formats, social media image sizes, or email graphics -- these are entirely screen-domain concerns
- The user wants video, animation, or motion graphics output -- no print application exists

---

## Process

### Step 1 -- Identify the Print Product and Run Context

Before writing a single dimension, gather the production context. The wrong printing method invalidates every downstream decision.

- **Product type:** Get a precise name -- not just "brochure" but "A4 tri-fold brochure," not just "card" but "standard business card" or "square business card." If the user is unsure, present the most common options: business card (standard 89x51mm or square 65x65mm), DL flyer (99x210mm), A5 flyer (148x210mm), A4 flyer/letterhead, A3 poster, A2/A1 large poster, tri-fold brochure, bi-fold brochure (A4 folded to A5), roll-fold brochure, Z-fold, booklet/saddle-stitch, perfect-bound book, self-mailer, postcard, label, packaging carton, or large-format banner.
- **Quantity (print run size):** This is the single most important determinant of printing method. Under 50 copies: digital on-demand. 51-500: short-run digital or gang-run offset. 500-2,000: short-run offset or digital. Over 2,000: offset lithography becomes cost-effective. Over 10,000: offset is almost always mandatory.
- **Printing method:** Establish this explicitly -- offset lithography, digital (laser/inkjet toner), screen printing (textiles and specialty substrates), flexography (packaging, labels), gravure (very high-volume packaging), or large-format inkjet (banners, point-of-sale). Each method has different ink coverage limits, resolution thresholds, registration tolerances, and acceptable file formats.
- **Substrate (paper stock and weight):** Coated gloss (reflects light, vibrant colors, typical 115-300gsm), coated silk/matte (less reflective, softer feel), uncoated (absorbs ink, slightly muted colors, typical for letterhead and forms), board (250-400gsm for covers, packaging, business cards), synthetic/plastic stock (polyester, polypropylene -- requires special inks), transparent/frosted (requires white ink under-layer specification). Weight in gsm (grams per square meter) matters: text weight is 80-130gsm, cover weight is 200-350gsm, board is 300-600gsm.
- **Finishing options:** Gloss lamination (film over surface, increases CMYK vibrancy), matte lamination (soft-touch, reduces glare), spot UV varnish (high-gloss coating on specific areas over laminate), soft-touch matte lamination (velvet-like finish), foil stamping (hot foil or cold foil, metallic or holographic), embossing/debossing (dimensional relief), die-cut (custom shape or window), perforation (tear-off), and saddle-stitch or perfect binding for booklets. Each finishing option adds layer and file requirements.
- **Turnaround and proof type:** Is a physical wet proof or digital soft proof required? Wet proofs are critical for spot color and packaging work. Digital proofs are acceptable for standard CMYK work. Rush turnaround sometimes eliminates proofing -- flag this risk.

---

### Step 2 -- Define the Three-Zone Dimension System

Every print document exists within three concentric zones. Document size equals trim plus bleed. Safe area is inside trim. Never confuse these.

- **Trim size (the final product):** The dimensions of the piece after all cutting is done. Use the standard size reference below. If the user specifies a custom size, verify it is within the printer's sheet size and impose limitations. Always confirm whether measurements are width x height (portrait: height > width) or width x height (landscape: width > height). State orientation explicitly.

  | Product                | Trim Size (mm)          | Trim Size (inches)         | Notes                          |
  |------------------------|-------------------------|----------------------------|--------------------------------|
  | Business card (standard) | 89 x 51 mm            | 3.5 x 2 in                 | US standard                    |
  | Business card (EU)     | 85 x 55 mm              | 3.35 x 2.17 in             | ISO standard                   |
  | Business card (square) | 65 x 65 mm              | 2.56 x 2.56 in             | Boutique format                |
  | Postcard (A6)          | 148 x 105 mm            | 5.83 x 4.13 in             |                                |
  | DL flyer/compliment slip | 210 x 99 mm           | 8.27 x 3.9 in              | Fits DL envelope               |
  | A5 flyer               | 210 x 148 mm            | 8.27 x 5.83 in             |                                |
  | A4 flyer/letter        | 297 x 210 mm            | 11.69 x 8.27 in            |                                |
  | US Letter              | 279 x 216 mm            | 11 x 8.5 in                |                                |
  | A3 poster              | 420 x 297 mm            | 16.54 x 11.69 in           |                                |
  | A2 poster              | 594 x 420 mm            | 23.39 x 16.54 in           |                                |
  | A1 poster              | 841 x 594 mm            | 33.11 x 23.39 in           |                                |
  | Large banner (roll-up) | 850 x 2000 mm           | 33.46 x 78.74 in           | Varies by stand                |
  | Tri-fold brochure      | 297 x 210 mm (flat)     | 11.69 x 8.27 in (flat)     | Folds to 99 x 210 mm          |
  | Bi-fold (half-fold) A4 | 297 x 210 mm (flat)    | 11.69 x 8.27 in (flat)     | Folds to 148.5 x 210 mm       |
  | Booklet (A5 saddle)    | A4 flat, A5 finished    | --                          | Page count divisible by 4      |
  | CD/DVD insert          | 120 x 120 mm            | 4.72 x 4.72 in             |                                |

- **Bleed zone:** Background artwork, images, and color fills that reach the edge of the final product must extend into the bleed zone. This prevents white slivers appearing when the cutter is even fractionally off-position. Standard bleed values:
  - Standard offset/digital print (business cards, flyers, brochures): 3mm (0.125 in) on all four sides
  - Large format inkjet (banners, posters above A2): 5-10mm; some vendors require 10-15mm
  - Packaging (cartons, boxes): 3-5mm on face panels; confirm die-line bleed separately
  - Labels and stickers: 2-3mm; confirm with label printer as bleed interacts with the die
  - US vendors sometimes specify 0.125 in (3.175mm) -- treat as equivalent to 3mm
  - If a product has a deliberate white border by design, bleed can be suppressed but this must be explicitly flagged to the printer to avoid being rejected

- **Document size:** Always expressed as trim size plus bleed on all applicable sides. A 297x210mm sheet with 3mm bleed becomes a 303x216mm document. This is what the designer sets as their artboard or page size in their layout application. Never set the document to trim size and then add bleed padding manually -- this creates incorrect bleed marks.

- **Safe area (live area / safety zone):** The inner boundary where all critical content -- text, logos, essential graphic elements, faces in photographs -- must reside. Guillotine cutters and print presses have registration tolerances. Standard safe area margins:
  - Most print products: 3-5mm inside the trim line on all sides (5mm recommended)
  - Business cards: 3mm safe area (smaller product, less absolute margin)
  - Large format (A2 and above): 10-15mm safe area
  - Folded products: increase safe area near fold lines by 2-3mm to prevent text from disappearing into the fold
  - Booklet/book inner margins: add an additional 3-5mm on the gutter side to account for binding

---

### Step 3 -- Define Color Specifications

Color is the most technically complex part of print specification. Wrong color mode causes immediate print rejection or dramatic color shift on press.

- **Color mode selection:** Always CMYK for offset and digital print. Never submit RGB files to print. RGB gamut is larger than CMYK -- colors that look vivid on screen (especially electric blues, bright greens, luminous oranges) will shift when converted. The conversion must happen before file submission, not by the printer's RIP (Raster Image Processor), because automatic RIP conversion is unpredictable. Pantone spot colors (Pantone Matching System, PMS) are used when precise color matching is required beyond CMYK gamut, typically for brand colors, single or two-color jobs, and fluorescent/metallic inks.

- **Black definitions -- the most common production error:**
  - K-only black (0, 0, 0, 100): Use for all body text, fine type, thin rules, and small graphic elements. K-only prints on a single plate. Multi-plate blacks on fine type cause registration misalignment, producing visible color fringing ("fuzzy" edges).
  - Rich black (typically C:60 M:40 Y:40 K:100, total = 240%): Use ONLY for large solid background areas above approximately 30mm square. Rich black uses all four plates and produces a denser, warmer black than K-only. On large areas, the multi-plate depth is worth it. On small elements, it creates registration nightmares.
  - Cool rich black (C:60 M:0 Y:0 K:100): Produces a blue-leaning black, sometimes preferred for tech or fashion brands.
  - Warm rich black (C:0 M:30 Y:30 K:100): Produces a brown-leaning black, preferred for heritage or editorial aesthetics.
  - Never use K:100 for large background fills on offset -- the single-plate coverage may appear slightly inconsistent at scale. Rich black is the solution.

- **Total ink coverage (TIC) limits:** The sum of all four CMYK channels must not exceed the printer's stated limit. Standard limits by method:
  - Offset lithography (coated paper): 300-340% maximum. Most printers set 300% as the safe universal limit.
  - Offset lithography (uncoated paper): 260-280% maximum. Uncoated stock absorbs more ink; excess causes bleed, show-through, and drying failure.
  - Digital laser/toner print: 250-280% maximum. Toner is a dry process but excessive coverage causes cracking and adhesion failure.
  - Large format inkjet: 200-250%. Solvent and UV inks on vinyl often have lower limits. Confirm with vendor.
  - Rich black (C:60 M:40 Y:40 K:100) = 240% -- well within limits.
  - Deep shadow areas in photography often need TIC review. A dark CMYK photo shadow can easily hit 380-400% if unconverted.

- **Pantone specification:** When specifying Pantone colors, always provide three values: the Pantone PMS number (e.g., Pantone 485 C), the CMYK equivalent (for proofing), and the RGB equivalent (for digital proofing reference only). Note "C" (coated) vs. "U" (uncoated) suffix -- the same PMS number prints noticeably differently on coated vs. uncoated stock.

- **ICC color profiles:** The ICC profile embedded in the file tells the RIP how to interpret and reproduce the color values.
  - US offset on coated paper: SWOP v2 or GRACoL 2006 Coated1v2 (GRACoL is more accurate for modern sheetfed offset)
  - European offset on coated paper: Fogra39 (ISO 12647-2 standard for coated paper)
  - European offset on uncoated paper: Fogra47
  - US/EU digital print: Ask the vendor for their profile, or use a generic CMYK profile as fallback
  - Always embed the profile. Never leave profile untagged for print work.

- **Special ink layers:**
  - White ink: Required for printing on dark substrates (black stock, kraft paper) or transparent/clear stock. Must be specified as a named spot color layer ("White Ink"). Offset white requires special equipment (not all printers offer it). Digital UV flatbed printers handle white ink routinely.
  - Metallic inks (silver, gold): Available in offset as specialty inks, specified by Pantone Metallic number. Not reproducible in standard CMYK -- a close CMYK approximation is not acceptable for metallic appearance.
  - Fluorescent inks: Available in offset as spot inks, extend beyond CMYK gamut into UV-reactive range. Must be specified as spot colors.
  - Varnish: Flood varnish (over entire sheet) or spot varnish (specific areas). Flood varnish is often a press unit coat. Spot varnish requires a separate artwork layer.

---

### Step 4 -- Define Resolution and Image Technical Requirements

Resolution errors are the second most common cause of print rejection or poor output quality. Resolution must always be assessed at final print size.

- **Standard print resolution:** 300 DPI (dots per inch) at 100% of final print size. This is not negotiable for photography, illustrations, and raster artwork in standard print products. A 1500x1000 pixel image placed at 5x3.33 inches (127x84.7mm) at 100% print size is exactly 300 DPI. If that same image is placed at 200% (10x6.67 inches), it is 150 DPI -- below threshold.
- **Resolution assessment rule:** Actual DPI = (pixel dimension) / (print dimension in inches). Always calculate this for every placed image. Flag anything below 280 DPI for standard print, below 200 DPI for large format.
- **Line art and bitmap graphics:** Technical drawings, 1-bit bitmaps, barcode artwork, and high-contrast line work should be 1200 DPI at final size. At 600 DPI, stairstepping on diagonal lines becomes visible under inspection. Vector artwork (AI/EPS/PDF) is resolution-independent and preferred.
- **Vector requirements:** Logos, icons, illustrations, and type-as-outlines should always be provided in vector format. Acceptable vector formats: PDF (vector), EPS, AI, SVG (confirm with vendor). Vector files must have all fonts outlined (converted to paths) before submission. Any embedded raster images within a vector file still require 300 DPI.
- **Large format resolution:** At viewing distances of 1 meter or more, 100-150 DPI at final size is acceptable for large format inkjet. At 2 meters viewing distance, 72-100 DPI can be acceptable. Always specify the intended viewing distance in a large-format spec.
- **Image file formats for print:**
  - TIFF: Preferred for raster images going into print layouts. Supports CMYK, LAB, and 16-bit color. Use LZW compression for file size (lossless). Do not use ZIP compression for TIFF in print workflows -- compatibility issues with older RIPs.
  - EPS: Acceptable legacy format for vector content. Still widely supported. Fonts must be embedded or outlined.
  - JPEG: Only acceptable at maximum quality (quality 12 in most applications, which means maximum/100%). JPEG compression is lossy and cumulative -- do not re-save a JPEG as a JPEG.
  - PDF: Acceptable as placed artwork only if it is a vector PDF with embedded images at correct resolution.
  - PNG, GIF, BMP, WebP: Do not use for print. These are screen formats.
- **Overprint and transparency settings:**
  - Black text should be set to overprint (so it prints on top of background colors without knocking out). Most professional layout applications handle this automatically for K-100 text.
  - Transparency effects (drop shadows, opacity blends) must be flattened in PDF/X-1a workflows. Unflattened transparency can cause RIP errors or unexpected output.
  - Spot color objects should generally not use transparency -- blend modes on spot colors produce unpredictable results on press.

---

### Step 5 -- Define Fold, Score, Perforation, and Die-Cut Specifications

Mechanical finishing is where design and production engineering intersect. Errors here cause physical defects that cannot be corrected post-press.

- **Fold types and panel mechanics:**
  - Single fold (half-fold): One fold divides the sheet into two panels. A4 sheet folds to A5.
  - Tri-fold (letter fold): Two parallel folds create three panels. The inner (right) panel folds in first, so it must be 1-3mm shorter than the outer panels to avoid buckling. On A4 landscape: outer panels are typically 100mm each; inner panel is 97mm.
  - Z-fold (accordion fold): Two parallel folds in opposite directions, like a Z shape. All three panels can be equal width since no panel folds inside another.
  - Gate fold: Two outer panels fold inward to meet at the center. The center panel is typically the widest. The two gate panels are typically half the center width.
  - Roll fold (barrel fold): Four or more panels fold in the same direction, each inner panel progressively shorter. For a four-panel roll fold at 297mm total width, panels from outer to inner: 76mm, 75mm, 74mm, 72mm -- the innermost is the shortest.
  - Accordion (multi-panel Z-fold): All panels are equal width. Six-panel accordion on A4 landscape: each panel is 49.5mm wide.

- **Score line specifications:**
  - Paper stock above 170gsm must be scored before folding. Without scoring, the paper fiber on the outer fold compresses and cracks, especially on coated stocks.
  - Score line goes on the outside of the fold (the valley side), not the mountain side.
  - Score line position must be exact to the fold position on the artwork. Specify the score line position in mm from the document edge.
  - For coated laminated stocks (laminated after printing), score AFTER lamination. If scoring before, the laminate film can crack or peel at the fold.

- **Perforation:**
  - Tear-off lines, coupon lines, and reply card separations require perforation marks.
  - Specify perf position in mm from edge. Indicate whether perf is horizontal, vertical, or curved.
  - Minimum perf-to-trim distance: 5mm. Perf too close to trim makes tearing uncontrollable.
  - Perf strength: tight perf (more material between cuts, harder to tear, cleaner edge) vs. loose perf (easier to tear, slightly ragged edge). Standard for coupons and forms: 36-40 cuts per inch.

- **Die-cut specifications:**
  - Die-cut shapes deviate from standard rectangular trim. Custom shaped stickers, round-corner business cards, packaging windows, and shaped hang tags all require a die.
  - Die line (also called cut line or knife line): A vector path showing exactly where the die will cut. Must be on a separate, named layer in the document (typically named "Die Line," "Cut Line," or "Dieline"). Color the die line with a spot color named "Die" or "Dieline" -- it will not print, it is just a guide for the die-maker.
  - Die line must be a closed path with no gaps or overlapping nodes.
  - Minimum die-cut feature size: 1.5mm for most commercial dies. Narrower features can break during cutting or tear the substrate.
  - Crease lines (fold lines for packaging): Use a different line style (dashed) and a different spot color ("Crease" or "Fold") to distinguish from cut lines.
  - Safety: All artwork should be within the die cut area. No visible artwork should extend beyond the cut path (unless it is intentional bleed for the die, which should extend 3mm beyond the die line path).

---

### Step 6 -- Define File Delivery Specifications

File delivery is the final technical bridge between design and press. Errors at this stage cause production delays, reprints, or press damage.

- **PDF/X standards -- choosing correctly:**
  - PDF/X-1a:2001: The most universally accepted print-ready format. Requires: CMYK only (no RGB), all fonts embedded, transparency flattened, ICC profile embedded, no OPI comments, no encryption. Single file, all content self-contained. Use this as the default for any standard print job.
  - PDF/X-3:2002: Allows RGB and LAB color spaces alongside CMYK, with ICC profile management. Less commonly required but useful for color-managed workflows.
  - PDF/X-4:2010: Supports live transparency, layers, and RGB images (with embedded ICC profiles). Required for variable data printing, jobs with transparency effects that cannot be flattened without quality loss, and PDF/VT (variable and transactional printing) workflows. Use when the print vendor specifically supports PDF/X-4.
  - PDF/X-5: Supports external referenced content. Rarely required for standard commercial work.

- **Font handling:**
  - All fonts must be embedded in the PDF. Submitting a PDF without embedded fonts causes text to reflow or be replaced with a substitute font on the RIP.
  - Converting fonts to outlines (paths) before PDF export eliminates font embedding issues entirely and is the safest approach for logos and display type. It also prevents any font licensing conflict on the RIP server.
  - Do NOT outline body text that uses OpenType features (ligatures, small caps) if those features affect final appearance -- outline only after all text editing is final.
  - Minimum font size for legibility in print: 6pt for coated stock, 7pt for uncoated stock (ink spread on uncoated absorbs fine serifs).

- **Layer structure:**
  - Artwork layer: All printable content.
  - Spot color layers: Each spot color, specialty ink, or varnish on its own named layer.
  - Die line layer: Vector cut/crease paths only, no printable content, hidden from print output.
  - Registration marks and bleed marks: Handled by PDF export settings, not manual layer content.
  - Do not submit documents with hidden layers containing content -- printers may unhide layers and print unexpected content.

- **Trim marks and registration marks:**
  - Trim marks (crop marks) indicate where the cutter should cut. They sit outside the bleed area, typically 3-5mm beyond the bleed edge.
  - Registration marks (circular target) allow press operators to align plates. Required for offset multicolor work.
  - Color bar (CMYK color scale strip): Used by press operators to verify ink density during the run. Required for high-end offset work.
  - These marks are generated by the PDF export engine -- do not draw them manually.

- **Preflight before submission:**
  - Run a full preflight check using the PDF/X-1a or PDF/X-4 profile. Common preflight tools exist within professional layout applications.
  - Preflight should verify: color mode compliance, resolution minimums, bleed presence, font embedding, ICC profile presence, overprint settings, total ink coverage.
  - If a preflight report comes back with warnings vs. errors -- errors must be fixed before submission; warnings are advisory and should be reviewed case by case.

---

### Step 7 -- Compile and Deliver the Print Design Specification

Assemble all gathered information into the structured output format. Include the preflight checklist as the final section.

- Write every dimension in both mm and inches for international usability.
- Flag any information the user could not provide (e.g., exact brand CMYK values) with a placeholder and a note to confirm before production.
- If the printing method is unknown, provide the most conservative specifications (300 DPI, PDF/X-1a, 300% max ink coverage) -- these work across all methods.
- Include a note about proof approval: always recommend requesting a color proof before approving a full print run, especially for brand colors and packaging.
- If any design element conflicts with print requirements (e.g., RGB-only logo file, 72 DPI web image), flag it explicitly with the corrective action required.

---

## Output Format

```
## Print Design Spec: [Product Name]

### Product Overview
| Parameter          | Value                                           |
|--------------------|-------------------------------------------------|
| Product type       | [specific product name and configuration]       |
| Print run quantity | [number of copies]                              |
| Printing method    | [offset lithography / digital / large format]   |
| Substrate          | [paper type, weight in gsm]                     |
| Finishing          | [list all finishes or "None"]                   |
| Proof required     | [wet proof / digital PDF proof / none]          |
| Delivery region    | [US / EU / specify -- affects ICC profile]      |

---

### Dimensions
| Zone              | Width (mm)  | Width (in)  | Height (mm) | Height (in) | Notes                              |
|-------------------|-------------|-------------|-------------|-------------|------------------------------------|
| Trim size         | [X]mm       | [X]in       | [X]mm       | [X]in       | Final cut dimensions               |
| Bleed             | +[X]mm each | +[X]in each | +[X]mm each | +[X]in each | Extends beyond trim                |
| Document/artboard | [X]mm       | [X]in       | [X]mm       | [X]in       | Trim + bleed all sides             |
| Safe area margin  | [X]mm inside| [X]in inside| [X]mm inside| [X]in inside| All critical content within        |

---

### Color Specifications
| Element              | Mode   | C   | M   | Y   | K   | PMS (if applicable) | TIC  | Notes                     |
|----------------------|--------|-----|-----|-----|-----|---------------------|------|---------------------------|
| Body text            | CMYK   | 0   | 0   | 0   | 100 | --                  | 100% | K-only, no registration risk |
| Large black areas    | CMYK   | 60  | 40  | 40  | 100 | --                  | 240% | Rich black, large fills only |
| Brand primary        | CMYK   | [C] | [M] | [Y] | [K] | PMS [XXX C/U]       | [X]% | Verify with press proof   |
| Brand secondary      | CMYK   | [C] | [M] | [Y] | [K] | PMS [XXX C/U]       | [X]% | Verify with press proof   |
| [Spot varnish/foil]  | Spot   | --  | --  | --  | --  | Named: "[Name]"     | --   | Separate vector layer     |
| Maximum ink coverage | --     | --  | --  | --  | --  | --                  | [X]% | Hard limit for this method|

**ICC Color Profile:** [SWOP v2 / GRACoL 2006 Coated1v2 / Fogra39 / Fogra47 / vendor-supplied]
**Notes:** [any color conversion warnings or out-of-gamut flags]

---

### Resolution and Image Requirements
| Content Type          | Minimum DPI | Preferred Format        | Color Mode | Notes                             |
|-----------------------|-------------|-------------------------|------------|-----------------------------------|
| Photography           | 300 DPI     | TIFF (LZW) or JPEG Q12  | CMYK       | At 100% final print size          |
| Illustrations (raster)| 300 DPI     | TIFF (LZW)              | CMYK       | At 100% final print size          |
| Logos / icons         | Vector      | PDF, EPS, AI            | CMYK       | Fonts outlined                    |
| Fine line art         | 1200 DPI    | TIFF (1-bit bitmap)     | Greyscale  | For technical drawings, barcodes  |
| Background textures   | 300 DPI     | TIFF                    | CMYK       | Must extend into bleed zone       |
| [Large format only]   | 100-150 DPI | TIFF                    | CMYK       | At final print size; viewing [X]m |

**⚠ Image flags:** [List any images known to be below resolution threshold, with corrective action]

---

### Fold / Score / Die-Cut Specifications (if applicable)
| Feature              | Specification                      | Notes                                          |
|----------------------|------------------------------------|------------------------------------------------|
| Fold type            | [fold type name]                   | [direction of fold]                            |
| Number of panels     | [X] panels per side                | [X] front, [X] back                            |
| Panel widths (flat)  | Panel 1: [X]mm / Panel 2: [X]mm / Panel 3: [X]mm | Left to right, front facing up    |
| Fold line positions  | [X]mm and [X]mm from left edge     | Measured from document left edge               |
| Score required       | [Yes / No]                         | [Required for stock above 170gsm]              |
| Score position       | [same as fold line position]       | Score on outside/valley side of fold           |
| Die-cut line         | [Yes / No -- layer name]           | Spot color named "[Die Line]", no print        |
| Perforation          | [Yes / No -- position in mm]       | [X] cuts per inch, [X]mm from trim             |

---

### File Delivery Specifications
| Parameter            | Requirement                                                   |
|----------------------|---------------------------------------------------------------|
| File format          | [PDF/X-1a:2001 / PDF/X-4:2010]                               |
| Color mode           | CMYK only (no RGB, no LAB in PDF/X-1a)                       |
| Transparency         | [Flattened (PDF/X-1a) / Preserved (PDF/X-4)]                 |
| Fonts                | All embedded or all converted to outlines                     |
| ICC profile          | Embedded -- [profile name]                                    |
| Bleed marks          | Yes -- generated by PDF export, not manual                    |
| Trim marks           | Yes -- generated by PDF export                               |
| Registration marks   | [Yes / No -- required for offset, optional for digital]       |
| Color bars           | [Yes / No -- required for offset press runs]                 |
| Layers               | Artwork layer + [list any additional: die, spot, varnish]     |
| Hidden layers        | None permitted                                                |
| Pages                | [1 page (single-sided) / 2 pages (front + back) / [X] pages] |
| Naming convention    | [ProductName]_[version]_[date]_[side].pdf                    |

---

### Preflight Checklist
**Must ALL be checked before file submission:**

**Color**
- [ ] All elements are in CMYK mode (no RGB objects, no RGB embedded images)
- [ ] Body text and fine type use K-only black (C:0 M:0 Y:0 K:100)
- [ ] Large solid black fills use rich black (C:60 M:40 Y:40 K:100)
- [ ] Total ink coverage (TIC) does not exceed [X]% on any element
- [ ] ICC profile is embedded ([profile name])
- [ ] Pantone / spot colors are named correctly and on correct layers
- [ ] No unintended spot colors present (check swatch panel for stray colors)

**Dimensions and Bleed**
- [ ] Document/artboard size is [X]mm x [X]mm (trim + [X]mm bleed all sides)
- [ ] All background fills and edge imagery extend to bleed edge
- [ ] All critical content (text, logos, faces) is within [X]mm safe area
- [ ] Fold panel widths match specification: [panel widths]
- [ ] Fold/score line positions are at [X]mm and [X]mm from left edge

**Images**
- [ ] All photographic images are minimum 300 DPI at final print size
- [ ] All logos are in vector format (or minimum 600 DPI raster)
- [ ] All images are saved in TIFF or maximum-quality JPEG format
- [ ] No web-format images (PNG, GIF, WebP, BMP) placed in document

**Text and Fonts**
- [ ] All fonts are embedded OR all text is converted to outlines
- [ ] No font size below 6pt on coated stock / 7pt on uncoated stock
- [ ] Overprint is set correctly for black text (K-100 overprint ON)

**File and Format**
- [ ] File is exported as [PDF/X-1a or PDF/X-4]
- [ ] Transparency is [flattened / preserved as appropriate]
- [ ] Trim marks and bleed marks are present (outside bleed area)
- [ ] No hidden layers containing printable content
- [ ] Die line layer is present, correctly named, and excluded from print output
- [ ] File naming follows convention: [convention]
- [ ] Preflight report run and all errors resolved (warnings reviewed)
```

---

## Rules

1. **CMYK is mandatory for all print specifications -- no exceptions.** Never include RGB values in the color specification table. If the user provides RGB or hex values, convert them to CMYK and note that conversion may cause color shift. The formula for conversion is not a simple calculation -- use the formula as a starting point and always recommend press proofing for critical colors. RGB-to-CMYK conversion is profile-dependent.

2. **K-only black (0, 0, 0, 100) for all body text, fine type, and elements smaller than approximately 30mm.** Rich black on small type is one of the most common and most visible production errors. Registration tolerance on offset press is typically ±0.1-0.25mm -- which becomes visible misalignment on a 9pt font character that is 2-3mm tall.

3. **Total ink coverage limits must be stated and enforced based on printing method and substrate.** Do not use a generic 300% limit without qualifying it. Uncoated stock limits are 260-280%. Digital print limits are 250-280%. Large format inkjet may be as low as 200%. Provide the correct limit for the method specified.

4. **Bleed must be specified for every product that has any design element reaching the trim edge.** If the user's design has a deliberate white border with no edge-to-edge content, state this explicitly and note it must be communicated to the printer as an intentional choice -- otherwise the printer may reject the file or request bleed addition.

5. **Resolution must always be stated at final print size.** Never accept a user's claim that an image is "high resolution" without asking for pixel dimensions and placed print size to calculate actual DPI. The formula is: DPI = pixel dimension ÷ print dimension in inches. A 2000px wide image placed at 20 inches wide is 100 DPI -- inadequate.

6. **Fold panel widths are not always equal.** Any folded piece where one panel folds inside another panel requires the inner panel to be shorter. This is not a preference -- it is a physical requirement. A tri-fold with equal panels will buckle on the inner panel. Always calculate and specify panel widths individually.

7. **File format must be PDF/X-1a as the default, with PDF/X-4 specified only when the print vendor explicitly supports it and the job requires live transparency or variable data.** Submitting a standard PDF (non-X) is unreliable because it may contain RGB elements, unembedded fonts, live transparency, and other non-print-safe features that the RIP will handle inconsistently.

8. **Die lines, score lines, and varnish/foil layers must always be on separate, clearly named spot color layers.** Never draw die lines in a process color (black or CMYK). Never mix die line content with printable artwork on the same layer. Die lines should be set to overprint:off and excluded from the print output -- they exist as production guidance only.

9. **Every spec must include a preflight checklist as the final deliverable.** A spec without a preflight checklist is a spec that may never be correctly implemented. The checklist is the production team's final quality gate. All checklist items must reference the specific values in the spec (e.g., "bleed extends 3mm" not just "bleed is present").

10. **If any critical information is missing, state it explicitly as a flag rather than assuming a default silently.** If the user has not provided brand CMYK values, mark those fields as [CONFIRM WITH BRAND GUIDELINES]. If the printing method is unknown, note "Most conservative specifications applied -- confirm with printer." Silent assumptions create production errors that cost money and time. Every flag is an explicit action item for the user.

---

## Edge Cases

### Large Format Printing (Banners, Trade Show Displays, Signage)
Large format inkjet printing on vinyl, fabric, or rigid substrates follows different rules from sheet-fed print. Resolution at final size drops to 100-150 DPI because viewing distance compensates for lower pixel density -- at 2 meters, 72-100 DPI is often acceptable; at 3+ meters, even lower. Always state the intended viewing distance in the spec so the resolution requirement is contextually justified. Bleed increases to 10-15mm (some roll-up banner stands require 50-80mm at the bottom for the cassette). Ink coverage limits are lower (180-220% for solvent inks on vinyl). Color management is less precise -- large format inkjet RIPs use their own proprietary color calibration and the printer's profile should be requested and used. Total ink coverage concerns shift from drying time to ink pooling and dry time on substrate. Pantone spot colors are not available -- CMYK (or extended gamut RGB where the printer uses a 6- or 8-color inkset) only.

### Packaging with Die-Cut, Crease, and Multiple Panels
Packaging specifications are structurally more complex than flat print products. The dieline is the engineering document -- it specifies cut lines, crease lines (valley and mountain folds), glue tabs, and window cutouts. Each type of line must be on a separate layer with a distinct spot color: "Die Cut," "Valley Fold," "Mountain Fold," "Glue Area," "Window." Artwork for each face must account for panel bleed independently -- background color and patterns must extend 3mm beyond every cut and crease line. The "bleed" on a packaging dieline is relative to each face panel's trim, not the overall sheet. Specify the structure flat (how it unfolds) and confirm the assembly direction. Registration is critical for multi-pass packaging (e.g., white base + CMYK over-print on metallic substrate). Always request a physical mock-up proof (a white dummy or unprinted cut-and-fold) before press approval. Ink coverage limits on folded carton board can be as low as 240-260% due to board weight and finishing interactions.

### Two-Color and Single-Color Spot Color Jobs
When budget constrains a job to one or two Pantone spot colors instead of full CMYK, the entire color workflow changes. There are no CMYK channels -- only spot color plates. Every design element must be either 100% of Spot Color 1, 100% of Spot Color 2, a screen tint (percentage) of either, or an overprint mix of both. Gradients must be expressed as tints of a single spot color or a transition from one spot to another. Photographs must be converted to duotone (two-color halftone) or monotone using one of the spot colors. Total ink coverage limits still apply but are simpler to manage. The file must contain only the named spot colors in the swatch panel -- no stray CMYK or RGB objects. PDF/X-1a handles spot-only jobs correctly. Pantone swatch books must be used for color selection -- screen display of Pantone colors is not reliable for approval decisions.

### Variable Data Printing (VDP) and Personalization
Variable data printing -- where recipient name, address, offer code, or image varies per printed piece -- requires PDF/X-4 (or PDF/VT-1) format to support the variable layers. The spec must distinguish fixed (invariant) artwork from variable zones. Variable fields must be clearly marked in the design with bounding box dimensions, font specification, maximum character counts, and text overflow handling rules (what happens if a name is 40 characters vs. 10). All variable data fonts must be embedded in the PDF or pre-approved for printer-resident fonts. Images in variable zones (personalized photos) must all be pre-converted to CMYK at 300 DPI and named to match the data merge fields exactly. Bleed handling for variable items near the trim edge requires confirmation with the VDP vendor. Pantone spot colors are typically not available in digital VDP workflows.

### Specialty Finishes -- Spot UV, Foil Stamping, Soft-Touch Lamination
These finishes each add a file layer and production complexity. Spot UV is applied over a laminated surface: the artwork must include a separate vector layer ("Spot UV") showing exactly which areas receive the gloss varnish coating. This layer should be 100% black fill (or a named spot color), vector outlines only -- no gradients or raster content. Minimum feature size for spot UV is 1mm lines and 8pt text. Foil stamping is similar but presses a metallic foil onto the substrate using heat and pressure -- the foil layer must be vector closed paths with no gradients or transparency. Minimum text size for foil is 8-10pt depending on foil type and press capability. Soft-touch matte lamination changes the surface feel but also affects color perception -- printed colors appear slightly darker under soft-touch laminate than they do under gloss. If a job has soft-touch lamination, add 5-10% lightness to dark colors to compensate. Always specify the order of finishes: print, then laminate, then spot UV or foil, then die-cut. Never spot UV before lamination (the varnish has nothing to bond to). Embossing and debossing require the finish to happen after lamination and after any foil.

### Double-Sided Print and Booklet Imposition
Double-sided print requires front and back to be separate pages in the PDF. Page 1 = front (or outside), Page 2 = back (or inside). The orientation relationship between front and back must be explicitly specified: head-to-head (both pages read with the same edge at top when flipped vertically, standard for portrait) or head-to-foot (flip horizontally, sometimes used for landscape pieces). For booklets and books in saddle-stitch binding, pages must be in reading order (1, 2, 3, 4...) and the printer will impose them into signature sheets -- do not attempt to manually reorder pages into printer spreads unless explicitly requested. Page count for saddle-stitch must be divisible by 4 (each sheet provides 4 pages). Add blank pages if needed and note which pages are intentionally blank. For perfect binding, the spine width must be calculated based on page count and paper stock -- approximately 0.1mm per page for 80gsm uncoated text stock. Gutter safe area on bound documents adds 3-5mm on the spine side beyond the standard 5mm safe margin. Bleeds on the spine (inside) edge of perfect-bound documents may not be achievable -- confirm trimming with the binder.

### Offset Press Registration and Critical Color Tolerance
When specifying color for offset print, understand that press registration tolerance (the accuracy with which plates align) is typically ±0.15-0.25mm on a well-maintained sheetfed offset press. This means any design element thinner than 0.5mm that uses more than one color plate risks visible misregistration. Thin color outlines, fine serif type in color, and hairline rules in CMYK must be treated with caution. Converting a thin colored rule to a single spot color eliminates this risk. Color tolerance on press is measured in delta-E (ΔE) -- a ΔE of 2 or below is considered a match; ΔE of 3-5 is a near match; above 5 is a visible deviation. When proofing for critical brand colors, specify the acceptable ΔE tolerance in the spec (typically ΔE ≤ 3 for brand compliance). Colors near the CMYK gamut boundary (saturated cyan-greens, bright oranges, vivid purples) will shift noticeably from screen appearance -- always proof these colors before approving the run.

---

## Example

**Input:** "I need a print spec for a business card. Square format, premium feel -- we want soft-touch matte lamination with spot UV on the logo on the front, and a solid brand blue on the back. Full color, both sides. We'll print 500 copies. Based in Europe."

**Output:**

---

## Print Design Spec: Square Business Card (Double-Sided, Soft-Touch + Spot UV)

### Product Overview
| Parameter          | Value                                                              |
|--------------------|--------------------------------------------------------------------|
| Product type       | Square business card, double-sided                                 |
| Print run quantity | 500 copies                                                         |
| Printing method    | Digital short-run or short-run offset (confirm with vendor at 500) |
| Substrate          | 400gsm silk coated board (recommended for lamination)              |
| Finishing          | Soft-touch matte lamination (both sides) + spot UV (front, logo area only) |
| Proof required     | Digital PDF proof minimum; wet proof recommended for spot UV placement |
| Delivery region    | EU -- Fogra39 ICC profile                                          |

---

### Dimensions
| Zone              | Width (mm)  | Width (in)  | Height (mm) | Height (in) | Notes                              |
|-------------------|-------------|-------------|-------------|-------------|------------------------------------|
| Trim size         | 65mm        | 2.56in      | 65mm        | 2.56in      | Square format, final cut size      |
| Bleed             | +3mm each   | +0.125in each | +3mm each | +0.125in each | All four sides                  |
| Document/artboard | 71mm        | 2.795in     | 71mm        | 2.795in     | 65mm + 3mm bleed each side         |
| Safe area margin  | 3mm inside trim | 0.118in inside | 3mm inside trim | 0.118in inside | Smaller product; 3mm sufficient |

---

### Color Specifications
| Element              | Mode   | C   | M   | Y   | K   | PMS (if applicable)  | TIC  | Notes                         |
|----------------------|--------|-----|-----|-----|-----|----------------------|------|-------------------------------|
| Body text (name, title, contact) | CMYK | 0 | 0 | 0 | 100 | -- | 100% | K-only black mandatory for fine type |
| Brand blue (back fill)| CMYK | 100 | 72 | 0   | 18  | PMS 2945 C           | 190% | Solid flood fill on back; verify with proof |
| Brand blue (front accents) | CMYK | 100 | 72 | 0 | 18 | PMS 2945 C         | 190% | Match back exactly            |
| Logo (spot UV area)  | CMYK   | [logo CMYK]
