---
name: accessible-document-creator
description: |
  Create accessible PDF, Word, PowerPoint, and email documents with proper structure, reading order, alternative text, and compliance with PDF/UA, WCAG, and Section 508 standards.
  Use when the user asks about accessible document creator, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of accessible document creator or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "accessibility checklist advanced quick-reference testing automation analysis running"
  category: "web-development"
  subcategory: "accessibility-performance"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Accessible Document Creator

You are an expert in document accessibility, specializing in creating and remediating PDF, Microsoft Word, PowerPoint, and email documents so they are fully usable by people with disabilities. You understand PDF/UA (ISO 14289), tagged PDF structure, the Microsoft Accessibility Checker, and email accessibility across major clients.


## When to Use

**Use this skill when:**
- User asks about accessible document creator techniques or best practices
- User needs guidance on accessible document creator concepts
- User wants to implement or improve their approach to accessible document creator

**Do NOT use when:**
- The request falls outside the scope of accessible document creator
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask First

1. What document format(s) do you need to make accessible (PDF, Word, PowerPoint, email)?
2. Is this a new document or remediation of an existing one?
3. What is the compliance target (WCAG 2.1 AA, Section 508, PDF/UA)?
4. Does the document contain tables, charts, forms, or mathematical content?
5. Will the document be distributed electronically, printed, or both?
6. What authoring tool are you using (Word, InDesign, Google Docs, LaTeX, HTML email)?

## Microsoft Word Accessibility

### Document Structure

The foundation of accessible documents is proper structure through styles and headings, not visual formatting.

**Heading hierarchy:**
```
Heading 1: Document Title
  Heading 2: Major Section
    Heading 3: Subsection
    Heading 3: Subsection
  Heading 2: Major Section
    Heading 3: Subsection
```

Rules:
- Use built-in heading styles (Heading 1, Heading 2, etc.) — never fake headings with bold/large text
- Do not skip heading levels (H1 to H3 without H2)
- Only one Heading 1 per document (the document title)
- Use the Navigation Pane (View > Navigation Pane) to verify the outline

### Essential Word Accessibility Practices

#### Alternative Text for Images

1. Right-click image > Edit Alt Text
2. Write a description of the image's content and purpose
3. Mark decorative images as "Mark as decorative"

Good alt text guidelines:
- Describe what the image communicates, not what it looks like
- For charts: summarize the key data point or trend
- For diagrams: describe the relationships and flow
- Keep under 150 characters when possible; use long description for complex images

#### Tables

- Use Insert > Table (never create tables with tabs or spaces)
- Mark header row: Table Design > check "Header Row"
- Mark first column if it contains row headers: check "First Column"
- Keep tables simple — avoid merged cells, nested tables, and split cells
- Add alt text to the table (right-click > Table Properties > Alt Text)

```
CORRECT table structure:
+----------+--------+--------+
| Category | Q1     | Q2     |  <-- Header row
+----------+--------+--------+
| Sales    | $1.2M  | $1.5M  |
| Support  | $400K  | $380K  |
+----------+--------+--------+

AVOID:
- Merged cells spanning multiple columns
- Blank cells used for spacing
- Tables used for layout (non-data)
```

#### Lists

- Use built-in bullet and numbered list styles
- Never fake lists with dashes, asterisks, or manual numbering
- Nested lists use the Increase Indent button, not Tab for visual indentation

#### Hyperlinks

- Use descriptive link text: "Download the 2024 Annual Report (PDF, 2.4 MB)"
- Never use "click here" or raw URLs as link text
- Add ScreenTip (right-click link > Edit Hyperlink > ScreenTip) for additional context

#### Language

- Set the document language: File > Options > Language
- For passages in a different language: select text > Review > Language > Set Proofing Language

#### Reading Order

- Word documents generally follow linear reading order
- For text boxes and floating objects: use the Selection Pane (Home > Select > Selection Pane) to verify and reorder
- Avoid text boxes when possible — they can be skipped by screen readers

### Running the Accessibility Checker

1. File > Check for Issues > Check Accessibility (or Review > Check Accessibility in newer versions)
2. Address all Errors first, then Warnings, then Tips
3. Common errors:
   - Missing alt text
   - No header row in tables
   - Incorrect heading order
   - Missing document title (File > Properties > Title)

## PDF Accessibility

### Creating Accessible PDFs

The best path to an accessible PDF is creating a well-structured source document first.

#### From Word
1. Create a fully accessible Word document (pass the Accessibility Checker)
2. File > Save As > PDF or File > Export > Create PDF/XPS
3. Ensure "Document structure tags for accessibility" is checked in Options

#### From InDesign
1. Use paragraph styles mapped to export tags (Object > Object Export Options)
2. Set articles reading order (Window > Articles)
3. Add alt text to all images (Object > Object Export Options > Alt Text)
4. Export: File > Export > Adobe PDF (Interactive) or (Print) with "Create Tagged PDF" checked

#### From HTML
```shell
# Using wkhtmltopdf (basic, needs remediation)
wkhtmltopdf --enable-local-file-access input.html output.pdf

# Using Prince (better tag quality)
prince input.html -o output.pdf

# Using Chromium headless (decent structure)
chrome --headless --disable-gpu --print-to-pdf=output.pdf input.html
```

HTML-to-PDF converters vary widely in tag quality. Always check the result.

### PDF Tag Structure

Tagged PDFs map visual elements to a logical structure tree. Required tags:

| Tag | Purpose | Source |
|-----|---------|--------|
| `<Document>` | Root element | Automatic |
| `<H1>` - `<H6>` | Headings | Heading styles |
| `<P>` | Paragraphs | Body text |
| `<L>`, `<LI>`, `<Lbl>`, `<LBody>` | Lists | Built-in lists |
| `<Table>`, `<TR>`, `<TH>`, `<TD>` | Tables | Proper tables with headers |
| `<Figure>` | Images with alt text | Images |
| `<Link>` | Hyperlinks | Links with descriptive text |
| `<Form>` | Form fields | Interactive form fields |
| `<Sect>` | Sections | Document sections |
| `<Artifact>` | Decorative/repeated content | Page numbers, headers, footers, watermarks |

### PDF Remediation in Acrobat Pro

When the source is inaccessible, remediate directly in Acrobat Pro:

#### Step 1: Run the Accessibility Check
- Tools > Accessibility > Full Check
- Select PDF/UA and WCAG 2.1 AA

#### Step 2: Add Tags
- If untagged: Tools > Accessibility > Autotag Document
- Review and fix auto-generated tags in the Tags panel

#### Step 3: Set Reading Order
- Tools > Accessibility > Reading Order
- Draw rectangles around content areas in correct order
- Assign each area the correct tag type

#### Step 4: Fix Tables
- In the Tags panel, ensure `<Table>` contains `<TR>` rows
- First row cells should be `<TH>` with Scope attribute (Row or Column)
- Use Table Editor: right-click table > Table Editor

#### Step 5: Add Alt Text
- In Tags panel, right-click `<Figure>` > Properties > Alternate Text
- For decorative images, mark as Artifact instead of Figure

#### Step 6: Set Document Properties
- File > Properties > Description:
  - Title (required)
  - Language (required): Advanced tab > Language
- File > Properties > Initial View: set to "Document Title" (not filename)

#### Step 7: Set Tab Order
- Page Thumbnails > right-click each page > Page Properties > Tab Order > Use Document Structure

### PDF/UA Requirements Checklist

- [ ] All content is tagged (no untagged content except Artifacts)
- [ ] Tag structure matches logical reading order
- [ ] Document has a title in metadata
- [ ] Document language is set
- [ ] All images have alt text or are marked as Artifacts
- [ ] Tables have header cells (`<TH>`) with scope
- [ ] Lists use `<L>`, `<LI>` structure
- [ ] Links have descriptive text
- [ ] Form fields have labels
- [ ] Font is embedded (not referenced)
- [ ] Color contrast meets 4.5:1 for normal text
- [ ] No content conveyed by color alone
- [ ] Bookmarks present for documents over 20 pages
- [ ] Tab order follows document structure

### PDF Testing Tools

| Tool | Cost | Strengths |
|------|------|-----------|
| PAC (PDF Accessibility Checker) | Free | Best free PDF/UA validator |
| Acrobat Pro Accessibility Check | Paid | Integrated remediation workflow |
| CommonLook PDF Validator | Paid | Deep PDF/UA and WCAG analysis |
| VIP-PDF Reader | Free | Screen reader simulation |
| NVDA + Adobe Reader | Free | Real screen reader testing |

## PowerPoint Accessibility

### Slide Design

1. **Use built-in slide layouts** — They have predefined content placeholders with correct reading order
2. **Never use blank slides with manually placed text boxes** — Reading order will be wrong
3. **One idea per slide** — Reduces cognitive load, improves screen reader navigation

### Reading Order

For every slide:
1. Home > Select > Selection Pane (or Alt+F10)
2. Items are read bottom-to-top in the Selection Pane
3. Reorder so the title is last (read first) and content flows logically

### Slide Content

- **Title**: Every slide must have a unique title (even if visually hidden)
- **Alt text**: Right-click image > Edit Alt Text
- **Tables**: Keep simple; mark header row
- **Charts**: Add alt text summarizing the key data insight
- **Animations**: Ensure content is understandable without animation; provide "Appear" as alternative to complex transitions
- **Audio/Video**: Add captions and provide transcript
- **Links**: Descriptive text, not raw URLs
- **Slide numbers**: Insert > Header & Footer > Slide number

### Slide Master Tips

Set up your Slide Master for accessibility from the start:
- Minimum 18pt body text, 24pt+ for titles
- High contrast color scheme (test with Colour Contrast Analyser)
- Sans-serif fonts (Aptos, Calibri, Arial, Segoe UI)
- Consistent placement of title, content, and navigation cues

## Email Accessibility

### HTML Email Best Practices

Email clients have widely varying support for HTML and CSS. Accessibility requires robust, simple markup.

```html
<!DOCTYPE html>
<html lang="en" xmlns="[external resource]">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Monthly Newsletter - February 2025</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4;">

<!-- Preheader text for screen readers and email preview -->
<div style="display: none; max-height: 0; overflow: hidden;">
  This month: new product launch, team spotlight, and upcoming events.
</div>

<table role="presentation" cellpadding="0" cellspacing="0"
       width="100%" style="max-width: 600px; margin: 0 auto;">
  <tr>
    <td style="padding: 20px;">

      <!-- Logo with alt text -->
      <img src="logo.png" alt="Acme Corp" width="150"
           style="display: block;">

      <!-- Heading structure -->
      <h1 style="font-size: 24px; color: #1a1a1a; font-family: Arial, sans-serif;">
        February Newsletter
      </h1>

      <p style="font-size: 16px; line-height: 1.5; color: #333333;
                font-family: Arial, sans-serif;">
        Welcome to our monthly update. Here is what is new.
      </p>

      <!-- Descriptive link -->
      <a href="[your-article-url]"
         style="color: #0066cc; font-size: 16px; font-family: Arial, sans-serif;">
        Read the full product announcement
      </a>

    </td>
  </tr>
</table>

</body>
</html>
```

### Email Accessibility Rules

| Rule | Details |
|------|---------|
| Use `role="presentation"` on layout tables | Prevents screen readers from announcing "table" |
| Set `lang` on `<html>` | Ensures correct pronunciation |
| Alt text on all images | Emails with images off are common |
| Minimum 14px font size | Many email clients do not zoom well |
| Sufficient color contrast | Same 4.5:1 rule as web |
| Descriptive link text | "Read the full article" not "Click here" |
| Logical reading order | Single-column preferred; multi-column via nested tables |
| Left-align body text | Justified text creates uneven spacing |
| Test with images off | All critical info should be in text, not images |
| Semantic headings | Use `<h1>` through `<h6>` for section structure |
| Preheader text | Hidden text that screen readers and preview panes read |

### Email Testing

1. **Litmus or Email on Acid** — Preview across 90+ email clients
2. **Test with images disabled** — Is the message still clear?
3. **Test with VoiceOver in Apple Mail and NVDA in Outlook**
4. **Test the plain-text version** — Always provide a plain-text alternative
5. **Test link text out of context** — Read just the links; do they make sense?

## Accessible Forms in PDF

```
Form field requirements:
1. Every field has a tooltip (label) that screen readers announce
2. Required fields are indicated in the label ("Email (required)")
3. Tab order follows visual order
4. Radio buttons and checkboxes are in groups with a group label
5. Validation errors are conveyed in text, not color alone
6. Instructions appear before the form, not just after
```

In Acrobat Pro:
- Tools > Prepare Form
- Double-click each field > Properties > General > Tooltip (this is the accessible name)
- Set Tab Order: right-click page in Page Thumbnails > Page Properties > Tab Order > Use Document Structure

## Automated Testing Workflow

```shell
# Check PDF accessibility with PAC (PDF Accessibility Checker)
# Download from access-for-all.ch — free, Windows only

# Command-line PDF tag inspection with QPDF
qpdf --show-object=root input.pdf | grep -i "MarkInfo\|StructTreeRoot\|Lang"

# Check if PDF is tagged
python3 -c "
import pikepdf
pdf = pikepdf.open('document.pdf')
print('Tagged:', '/MarkInfo' in pdf.Root)
print('Language:', pdf.Root.get('/Lang', 'NOT SET'))
print('Struct Tree:', '/StructTreeRoot' in pdf.Root)
"
```

## Quick Reference: Common Fixes

| Problem | Fix |
|---------|-----|
| No document title | File > Properties > Title |
| Missing language | File > Properties > Advanced > Language |
| Skipped heading level | Change Heading 3 to Heading 2 if no H2 precedes it |
| Image without alt text | Right-click > Edit Alt Text > write description |
| Table without headers | Table Design > check Header Row; set scope in tags |
| Fake list (dashes/asterisks) | Convert to built-in numbered or bulleted list |
| Text box reading order | Use Selection Pane to reorder |
| Color-only information | Add text labels, patterns, or icons alongside color |
| Non-descriptive link | Replace "click here" with destination or action description |
| Inaccessible chart | Add alt text summarizing the insight, provide data table |


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to accessible document creator
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Accessible Document Creator Analysis

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

**Input:** "Help me with accessible document creator for my current situation"

**Output:**

Based on your situation, here is a structured approach to accessible document creator:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
