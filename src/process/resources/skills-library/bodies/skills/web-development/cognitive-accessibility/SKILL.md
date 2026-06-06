---
name: cognitive-accessibility
description: |
  Design interfaces that support users with cognitive and learning disabilities through plain language, clear navigation, predictable behavior, focus management, and effective error prevention.
  Use when the user asks about cognitive accessibility, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of cognitive accessibility or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "accessibility stress-management checklist step-by-step advanced javascript testing automation"
  category: "web-development"
  subcategory: "accessibility-performance"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Cognitive Accessibility

You are an expert in cognitive accessibility, specializing in designing digital experiences that work for people with attention deficits, learning disabilities, memory challenges, executive function difficulties, and cognitive fatigue. You apply WCAG 2.2 cognitive criteria, the Cognitive Accessibility Guidance from W3C, and plain language principles to reduce mental load and prevent errors.


## When to Use

**Use this skill when:**
- User asks about cognitive accessibility techniques or best practices
- User needs guidance on cognitive accessibility concepts
- User wants to implement or improve their approach to cognitive accessibility

**Do NOT use when:**
- The request falls outside the scope of cognitive accessibility
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask First

1. Who are your primary users, and what cognitive challenges might they face?
2. Is this a complex workflow (forms, multi-step processes) or primarily content?
3. What is the reading level of your current content?
4. Are users under time pressure or stress when using this interface?
5. Do you have analytics on where users abandon tasks or make errors?
6. What is the regulatory context (healthcare, government, education, finance)?

## Core Principles

### The Eight Objectives (from W3C Cognitive Accessibility Guidance)

1. **Help users understand what things are and how to use them** - clear labels, familiar patterns
2. **Help users find what they need** - consistent navigation, search, clear hierarchy
3. **Use clear and understandable content** - plain language, short sentences, definitions
4. **Help users avoid mistakes** - validation, confirmation, undo
5. **Help users focus** - minimize distractions, one task at a time
6. **Ensure processes do not rely on memory** - persistent info, no recall-dependent steps
7. **Provide help and support** - contextual help, human assistance access
8. **Support adaptation and personalization** - user preferences, multiple modalities

## Plain Language

### Writing Guidelines

| Principle | Bad | Good |
|-----------|-----|------|
| Short sentences | "In the event that you wish to cancel your subscription, which can be done at any time, you should navigate to the account settings page." | "To cancel your subscription, go to Account Settings." |
| Common words | "Utilize the authentication mechanism" | "Log in" |
| Active voice | "The form must be submitted by the user" | "Submit the form" |
| One idea per sentence | "Click Save to save your work and you'll be redirected to the dashboard where you can see your projects." | "Click Save. You'll go to the dashboard." |
| Avoid jargon | "Configure your CI/CD pipeline parameters" | "Set up your automatic build and deploy settings" |
| Define technical terms | "Enable MFA for your account" | "Enable multi-factor authentication (MFA) - a second step to verify your identity when you log in" |

### Reading Level Targets

| Audience | Target Grade Level | Tool |
|----------|-------------------|------|
| General public | 6th-8th grade | Hemingway Editor, readability-scores npm |
| Healthcare consumers | 5th-6th grade | CDC Clear Communication Index |
| Legal notices for consumers | 8th grade or lower | Plain Language Action and Information Network |
| Internal tools | 10th-12th grade | Flesch-Kincaid in MS Word |

```javascript
// Automated readability check in CI
// add the package dependency text-readability
const rs = require('text-readability');

const text = "Click Save to keep your changes. You will return to the home page.";
console.log('Flesch-Kincaid Grade:', rs.fleschKincaidGrade(text));
console.log('Dale-Chall:', rs.daleChallReadabilityScore(text));
console.log('Coleman-Liau:', rs.colemanLiauIndex(text));
// Target: Flesch-Kincaid Grade <= 8 for general audiences
```

## Clear Navigation

### Consistent Layout Patterns

```
+-------------------------------------------------------+
| Logo    [Nav Link] [Nav Link] [Nav Link]    [Search]  |
+-------------------------------------------------------+
| Breadcrumb: Home > Section > Current Page             |
+-------------------------------------------------------+
|                                                       |
| # Page Title                                          |
|                                                       |
| [Main content area - single column for reading]      |
|                                                       |
+-------------------------------------------------------+
| [Help] [Contact] [Sitemap]                            |
+-------------------------------------------------------+
```

Design rules for cognitive accessibility:
- Navigation is in the same position on every page (WCAG 3.2.3)
- Help mechanisms are in the same relative location on every page (WCAG 3.2.6)
- Breadcrumbs show current location in the hierarchy
- Current page is visually distinct in the navigation
- Search is available on every page

### Wayfinding Aids

```html
<!-- Breadcrumb with current page indicated -->
<nav aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li><a href="/settings">Settings</a></li>
    <li><a href="/settings/profile" aria-current="page">Profile</a></li>
  </ol>
</nav>

<!-- Progress indicator for multi-step processes -->
<nav aria-label="Progress">
  <ol class="progress-steps">
    <li class="completed">
      <span class="sr-only">Completed:</span> Shipping
    </li>
    <li class="current" aria-current="step">
      <span class="sr-only">Current:</span> Payment
    </li>
    <li class="upcoming">
      <span class="sr-only">Upcoming:</span> Review
    </li>
  </ol>
</nav>
<!-- Visual: [1. Shipping ✓] - [2. Payment ●] - [3. Review ○] -->
```

### Step-by-Step Processes

Break complex tasks into discrete steps:

1. **One question or action per screen** when possible
2. **Show progress** - "Step 2 of 4"
3. **Allow going back** without losing data
4. **Save progress automatically** so users can return later
5. **Summarize before final submission** - "Review your order"

```html
<div class="step-container" role="group" aria-label="Step 2 of 4: Payment details">
  <div class="step-header">
    <p class="step-counter">Step 2 of 4</p>
    <h1>Payment Details</h1>
    <p class="step-help">Enter your card information. Your data is encrypted.</p>
  </div>

  <form>
    <!-- One focused set of fields -->
    <div class="field-group">
      <label for="card-number">Card number</label>
      <input id="card-number" type="text" inputmode="numeric"
             autocomplete="cc-number" aria-describedby="card-hint">
      <p id="card-hint" class="hint">16 digits on the front of your card</p>
    </div>

    <!-- Clear actions -->
    <div class="step-actions">
      <a href="/checkout/step-1">Back to Shipping</a>
      <button type="submit">Continue to Review</button>
    </div>
  </form>
</div>
```

## Focus Management

### When to Move Focus

Move focus programmatically in these situations:

| Scenario | Move Focus To |
|----------|---------------|
| Page load (SPA navigation) | Main heading or skip target |
| Modal opens | First focusable element inside modal |
| Modal closes | The element that triggered the modal |
| Inline error after form submission | First error message or the error summary |
| Content deleted | The nearest remaining logical element |
| New content loaded (infinite scroll) | Do NOT move focus; announce via live region |
| Step change in a wizard | The new step heading |

```javascript
// Focus management for SPA route changes
function onRouteChange() {
  const mainHeading = document.querySelector('main h1');
  if (mainHeading) {
    mainHeading.setAttribute('tabindex', '-1');
    mainHeading.focus();
    // Remove tabindex after blur to keep natural tab order clean
    mainHeading.addEventListener('blur', () => {
      mainHeading.removeAttribute('tabindex');
    }, { once: true });
  }
}
```

### Reducing Focus Confusion

```css
/* Always provide a visible focus indicator */
:focus-visible {
  outline: 3px solid #1a73e8;
  outline-offset: 2px;
}

/* Never remove outlines without replacement */
/* BAD: *:focus { outline: none; } */

/* Reduce motion for users who request it */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

## Error Prevention and Recovery

### Design Principles for Error Prevention

1. **Constrain input** - Use dropdowns, date pickers, and toggles instead of free text when possible
2. **Provide defaults** - Pre-fill with the most common or previously used value
3. **Validate inline** - Show feedback as the user types, not after submission
4. **Explain before, not just after** - Give format hints before input, not only as error messages
5. **Allow undo** - For destructive actions, provide undo within a grace period
6. **Confirm significant actions** - "Delete 12 files? This cannot be undone."

### Error Message Patterns

```html
<!-- Error summary at the top of the form -->
<div role="alert" aria-labelledby="error-heading" class="error-summary">
  <h2 id="error-heading">There are 2 problems with your form</h2>
  <ul>
    <li><a href="#email">Enter a valid email address</a></li>
    <li><a href="#password">Password must be at least 8 characters</a></li>
  </ul>
</div>

<!-- Inline error on a specific field -->
<div class="field-group field-error">
  <label for="email">Email address</label>
  <input id="email" type="email" aria-invalid="true"
         aria-describedby="email-error email-hint"
         autocomplete="email" value="user@">
  <p id="email-hint" class="hint">Example: name@company.com</p>
  <p id="email-error" class="error-message">
    Enter a complete email address, like name@company.com
  </p>
</div>
```

### Error message writing rules:
- Say what went wrong in plain language
- Tell the user exactly how to fix it
- Never use error codes alone ("Error 422")
- Never blame the user ("Invalid input")
- Be specific ("Enter a date after today" not "Invalid date")

### Undo Pattern for Destructive Actions

```html
<!-- Instead of immediate deletion, show undo option -->
<div role="status" class="undo-toast" aria-live="polite">
  <p>Email moved to Trash.
    <button type="button" onclick="undoDelete()">Undo</button>
    <span class="countdown">Undoing is available for 10 seconds</span>
  </p>
</div>
```

## Reducing Cognitive Load

### Information Architecture

- **Chunk content** - Group related items in sets of 3-5
- **Progressive disclosure** - Show only what is needed now; let users expand for more
- **Clear hierarchy** - Use headings, whitespace, and visual grouping
- **Reduce choices** - Apply Hick's Law: fewer options = faster decisions

```html
<!-- Progressive disclosure with details/summary -->
<details>
  <summary>Advanced shipping options</summary>
  <div class="advanced-options">
    <label>
      <input type="checkbox" name="signature">
      Require signature on delivery
    </label>
    <label>
      <input type="checkbox" name="insurance">
      Add shipping insurance ($4.99)
    </label>
  </div>
</details>
```

### Minimizing Distractions

- No auto-playing media (WCAG 1.4.2)
- No content that moves, blinks, or scrolls for more than 5 seconds without a pause mechanism (WCAG 2.2.2)
- No auto-updating content without user control
- Minimal use of notifications and alerts
- Clean layouts with generous whitespace

```css
/* Support prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .animated-banner,
  .auto-carousel {
    animation: none;
    transition: none;
  }

  .auto-carousel {
    /* Show all slides statically instead of auto-rotating */
    overflow: visible;
  }
}
```

### Supporting Memory

- Do not require users to remember information from a previous step (WCAG 3.3.7 Redundant Entry)
- Show previously entered information when users return to a step
- Pre-fill fields with information you already have
- Use `autocomplete` attributes so browsers can auto-fill

```html
<!-- Leverage autocomplete to reduce memory burden -->
<form>
  <label for="name">Full name</label>
  <input id="name" autocomplete="name">

  <label for="email">Email</label>
  <input id="email" type="email" autocomplete="email">

  <label for="address">Street address</label>
  <input id="address" autocomplete="street-address">

  <label for="city">City</label>
  <input id="city" autocomplete="address-level2">

  <label for="zip">ZIP code</label>
  <input id="zip" autocomplete="postal-code" inputmode="numeric">
</form>
```

## Time and Timing

### WCAG Requirements (2.2.1, 2.2.6)

- If a session will time out, warn users at least 20 seconds before
- Allow users to extend the time limit at least 10 times
- Ideally, allow turning off time limits entirely

```html
<!-- Session timeout warning -->
<div role="alertdialog" aria-modal="true"
     aria-labelledby="timeout-title" aria-describedby="timeout-desc">
  <h2 id="timeout-title">Your session is about to expire</h2>
  <p id="timeout-desc">
    You will be logged out in <span id="countdown">60</span> seconds.
    Any unsaved work will be lost.
  </p>
  <button onclick="extendSession()">Stay logged in</button>
  <button onclick="logout()">Log out now</button>
</div>
```

## WCAG Criteria Most Relevant to Cognitive Accessibility

| Criterion | Level | Summary |
|-----------|-------|---------|
| 1.3.5 Identify Input Purpose | AA | Use autocomplete attributes |
| 1.3.6 Identify Purpose | AAA | UI components have programmatic purpose |
| 2.2.1 Timing Adjustable | A | Users can extend, adjust, or disable time limits |
| 2.2.6 Timeouts | AAA | Warn about data loss from inactivity |
| 2.4.6 Headings and Labels | AA | Headings and labels describe purpose |
| 3.1.3 Unusual Words | AAA | Define jargon and idioms |
| 3.1.4 Abbreviations | AAA | Expand abbreviations |
| 3.1.5 Reading Level | AAA | Supplemental version for lower secondary reading level |
| 3.2.3 Consistent Navigation | AA | Navigation in same relative order |
| 3.2.4 Consistent Identification | AA | Same function = same label |
| 3.2.6 Consistent Help | A | Help in same relative location |
| 3.3.1 Error Identification | A | Errors described in text |
| 3.3.2 Labels or Instructions | A | Labels for user input |
| 3.3.3 Error Suggestion | AA | Suggest corrections |
| 3.3.4 Error Prevention (Legal, Financial) | AA | Reversible, checked, confirmed |
| 3.3.7 Redundant Entry | A | Don't make users re-enter data |
| 3.3.8 Accessible Authentication | AA | No cognitive function tests for login |

## Testing for Cognitive Accessibility

### Heuristic Evaluation Checklist

- [ ] Can the main task be completed in under 3 minutes by a first-time user?
- [ ] Is every page's purpose clear from its heading?
- [ ] Can the user always tell where they are (breadcrumbs, active nav state)?
- [ ] Are form fields labeled with what to enter, not just a field name?
- [ ] Do error messages tell the user exactly what to do to fix the problem?
- [ ] Can the user undo or go back from any step?
- [ ] Is there a way to get help on every page?
- [ ] Does content pass a readability check (grade 8 or lower)?
- [ ] Are there fewer than 7 navigation items at each level?
- [ ] Does the page work without auto-playing content or timed interactions?
- [ ] Are icons accompanied by text labels?
- [ ] Is the most important action on each page visually prominent?

### User Testing Considerations

When testing with participants who have cognitive disabilities:
- Allow extra time for each task
- Provide written instructions they can refer back to
- Use think-aloud protocol gently - do not pressure
- Have a clear, simple consent process
- Test in a quiet, distraction-free environment
- Include participants with diverse cognitive profiles (ADHD, dyslexia, traumatic brain injury, autism, Down syndrome, age-related cognitive decline)


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to cognitive accessibility
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Cognitive Accessibility Analysis

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

**Input:** "Help me with cognitive accessibility for my current situation"

**Output:**

Based on your situation, here is a structured approach to cognitive accessibility:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
