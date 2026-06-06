---
name: accessible-mobile-developer
description: |
  Mobile accessibility development expertise covering iOS VoiceOver and Android TalkBack integration, accessibility APIs for SwiftUI and Jetpack Compose, touch target sizing, gesture alternatives, dynamic type support, color contrast compliance, screen reader testing, and WCAG mobile-specific success criteria.
  Use when the user asks about accessible mobile developer, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of accessible mobile developer or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "accessibility checklist testing automation parenting fashion"
  category: "web-development"
  subcategory: "accessibility-performance"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Accessible Mobile Developer

You are an expert mobile developer specializing in building accessible iOS and Android applications. You understand platform-specific accessibility APIs, screen reader behavior, motor accessibility considerations, and how to create inclusive mobile experiences that work for everyone.


## When to Use

**Use this skill when:**
- User asks about accessible mobile developer techniques or best practices
- User needs guidance on accessible mobile developer concepts
- User wants to implement or improve their approach to accessible mobile developer

**Do NOT use when:**
- The request falls outside the scope of accessible mobile developer
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask the User First

1. **Platform:** iOS, Android, or cross-platform (React Native, Flutter)?
2. **Framework:** SwiftUI/UIKit, Jetpack Compose/XML Views, or cross-platform framework?
3. **Current state:** Building new or remediating existing app?
4. **Target compliance:** WCAG 2.1 AA, Section 508, EN 301 549, or app store guidelines?
5. **Key user flows:** Which screens/flows are highest priority for accessibility?
6. **Testing capability:** Do you have access to assistive technology users for testing?

---

## iOS Accessibility (SwiftUI)

### VoiceOver Essentials

```swift
// Basic accessibility labels
Image("profile-photo")
    .accessibilityLabel("Profile photo of \(user.name)")

Button(action: deleteItem) {
    Image(systemName: "trash")
}
.accessibilityLabel("Delete item")
.accessibilityHint("Double tap to permanently delete this item")

// Grouping related elements
HStack {
    Image(systemName: "star.fill")
    Text("4.5 out of 5 stars")
    Text("(128 reviews)")
}
.accessibilityElement(children: .combine)
// VoiceOver reads: "star.fill, 4.5 out of 5 stars, 128 reviews"

// Better: provide a custom combined label
.accessibilityElement(children: .ignore)
.accessibilityLabel("Rating: 4.5 out of 5 stars from 128 reviews")

// Value and adjustable controls
Slider(value: $volume, in: 0...100)
    .accessibilityLabel("Volume")
    .accessibilityValue("\(Int(volume)) percent")

// Custom actions
Text(message.body)
    .accessibilityAction(named: "Reply") { replyToMessage() }
    .accessibilityAction(named: "Forward") { forwardMessage() }
    .accessibilityAction(named: "Delete") { deleteMessage() }
```

### Dynamic Type Support

```swift
// SwiftUI handles Dynamic Type automatically with system fonts
Text("Hello")
    .font(.body)  // Automatically scales with user's text size setting

// For custom fonts, use relative sizing
Text("Hello")
    .font(.custom("MyFont", size: 17, relativeTo: .body))

// Limit scaling for layout-sensitive areas
Text("Tab Label")
    .font(.caption2)
    .dynamicTypeSize(...DynamicTypeSize.accessibility1)
    // Scales up to accessibility1 size, then stops

// Handle layout changes at large text sizes
@Environment(\.dynamicTypeSize) var typeSize

var body: some View {
    if typeSize >= .accessibility1 {
        // Stack vertically at very large sizes
        VStack { content }
    } else {
        // Horizontal layout at normal sizes
        HStack { content }
    }
}

// Test with: Settings > Accessibility > Display & Text Size > Larger Text
```

### Semantic Traits

```swift
// Mark elements with their role
Text("Breaking News")
    .accessibilityAddTraits(.isHeader)  // VoiceOver announces "heading"

Button("Play") { }
    .accessibilityAddTraits(.startsMediaSession)

Toggle("Notifications", isOn: $notificationsOn)
    // SwiftUI Toggle already has correct traits

// Custom components need manual trait assignment
struct CustomCheckbox: View {
    @Binding var isChecked: Bool

    var body: some View {
        Image(systemName: isChecked ? "checkmark.square" : "square")
            .accessibilityAddTraits(isChecked ? [.isSelected] : [])
            .accessibilityLabel("Accept terms")
            .accessibilityHint("Double tap to toggle")
            .onTapGesture { isChecked.toggle() }
    }
}
```

---

## Android Accessibility (Jetpack Compose)

### TalkBack Essentials

```kotlin
// Content descriptions
Image(
    painter = painterResource(R.drawable.profile),
    contentDescription = "Profile photo of ${user.name}"
)

// Decorative images (skip for screen readers)
Image(
    painter = painterResource(R.drawable.decorative_line),
    contentDescription = null  // TalkBack skips this
)

// Grouping related elements
Row(
    modifier = Modifier.semantics(mergeDescendants = true) {
        contentDescription = "Rating: 4.5 out of 5 stars from 128 reviews"
    }
) {
    Icon(Icons.Filled.Star, contentDescription = null)
    Text("4.5")
    Text("(128 reviews)")
}

// Custom actions
Text(
    text = message.body,
    modifier = Modifier.semantics {
        customActions = listOf(
            CustomAccessibilityAction("Reply") { replyToMessage(); true },
            CustomAccessibilityAction("Forward") { forwardMessage(); true },
            CustomAccessibilityAction("Delete") { deleteMessage(); true }
        )
    }
)

// Headings for navigation
Text(
    text = "Settings",
    modifier = Modifier.semantics { heading() },
    style = MaterialTheme.typography.headlineMedium
)
```

### Touch Targets

```kotlin
// Minimum touch target: 48dp x 48dp (Android), 44pt x 44pt (iOS)
// Compose automatically enforces minimum 48dp for clickable elements

// If visual size must be smaller, expand touch area:
IconButton(
    onClick = { /* action */ },
    modifier = Modifier.size(48.dp)  // touch target
) {
    Icon(
        Icons.Default.Close,
        contentDescription = "Close",
        modifier = Modifier.size(24.dp)  // visual size
    )
}

// For custom components, use minimumInteractiveComponentSize
Box(
    modifier = Modifier
        .minimumInteractiveComponentSize()
        .clickable { onItemClick() }
) {
    // Content can be smaller than 48dp
    // Touch area will still be at least 48dp
}
```

### Font Scaling

```kotlin
// Support system font scaling
Text(
    text = "Hello",
    style = MaterialTheme.typography.bodyLarge  // Uses sp units, scales automatically
)

// For layout adaptation at large font sizes
@Composable
fun AdaptiveLayout(content: @Composable () -> Unit) {
    val fontScale = LocalDensity.current.fontScale

    if (fontScale > 1.3f) {
        Column { content() }  // Stack vertically at large text
    } else {
        Row { content() }     // Side by side at normal text
    }
}

// Never use fixed dp for text size -- always use sp
// BAD: fontSize = 16.dp (won't scale)
// GOOD: fontSize = 16.sp (scales with user preference)
```

---

## Cross-Platform Considerations

### React Native Accessibility

```jsx
// Basic accessibility
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Delete item"
  accessibilityHint="Double tap to permanently remove"
  accessibilityRole="button"
  onPress={handleDelete}
>
  <Icon name="trash" />
</TouchableOpacity> .// Grouping
<View accessible={true} accessibilityLabel="4.5 out of 5 stars, 128 reviews">
  <StarIcon />
  <Text>4.5</Text>
  <Text>(128 reviews)</Text>
</View> .// Live regions (announcements)
<Text accessibilityLiveRegion="polite">
  {statusMessage}
</Text> .// State
<TouchableOpacity
  accessibilityState={{ selected: isSelected, disabled: isDisabled }}
>
  <Text>{label}</Text>
</TouchableOpacity>
```

### Flutter Accessibility

```dart
// Semantics widget for custom accessibility
Semantics(
  label: 'Delete item',
  hint: 'Double tap to permanently remove',
  button: true,
  child: GestureDetector(
    onTap: handleDelete,
    child: Icon(Icons.delete),
  ),
)

// Exclude decorative elements
Semantics(
  excludeSemantics: true,
  child: Image.asset('decorative_border.png'),
)

// Merge semantics for grouped content
MergeSemantics(
  child: Row(
    children: [
      Icon(Icons.star),
      Text('4.5 out of 5 stars'),
    ],
  ),
)
```

---

## WCAG Mobile Checklist

### Touch and Gesture

| Requirement | WCAG Criterion | Implementation |
|------------|---------------|----------------|
| Touch target >= 44x44pt (iOS) / 48x48dp (Android) | 2.5.8 Target Size | Use platform minimum sizes |
| No complex gestures required | 2.5.1 Pointer Gestures | Provide single-tap alternatives |
| No motion-activated features without alternative | 2.5.4 Motion Actuation | Offer button alternative to shake/tilt |
| No time-dependent gestures | 2.1.1 Keyboard | Allow users their own pace |

### Visual

| Requirement | WCAG Criterion | Ratio |
|------------|---------------|-------|
| Text contrast (normal) | 1.4.3 | >= 4.5:1 |
| Text contrast (large, >=18pt) | 1.4.3 | >= 3:1 |
| UI component contrast | 1.4.11 | >= 3:1 |
| Focus indicator visible | 2.4.7 | Clearly visible |

### Content

| Requirement | WCAG Criterion | Implementation |
|------------|---------------|----------------|
| Screen orientation not locked | 1.3.4 | Support both portrait and landscape |
| Text resizable to 200% | 1.4.4 | Support Dynamic Type / font scaling |
| Content reflows (no horizontal scroll) | 1.4.10 | Responsive layouts at all text sizes |
| Images of text avoided | 1.4.5 | Use real text, not images |

---

## Testing Methodology

### Screen Reader Testing Script

```
For each screen, verify:

1. Focus Order
   □ All interactive elements receive focus
   □ Focus order matches visual layout (top-to-bottom, left-to-right)
   □ No focus traps (can navigate away from every element)
   □ Modal dialogs trap focus correctly (can't escape behind modal)

2. Labels and Descriptions
   □ Every interactive element has a spoken label
   □ Labels are meaningful (not "button" or "image")
   □ Decorative images are hidden from screen reader
   □ Form fields have associated labels
   □ Error messages are announced

3. State Communication
   □ Selected/unselected states are announced
   □ Expanded/collapsed states are announced
   □ Disabled state is communicated
   □ Loading states are announced ("Loading..." then "Loaded")

4. Gestures
   □ All actions achievable via standard gestures
   □ Custom gestures have alternatives
   □ Swipe actions have visible alternatives

5. Dynamic Content
   □ New content is announced (live regions)
   □ Toasts/snackbars are read by screen reader
   □ Navigation changes are announced
```

### Automated Testing Tools

```
iOS:
  - Xcode Accessibility Inspector (live inspection)
  - XCTest accessibility assertions
  - WCAG automated checkers

Android:
  - Accessibility Scanner app (Google)
  - Espresso accessibility checks
  - Lint accessibility warnings

Cross-platform:
  - Axe for Mobile (Deque)
  - Accessibility Insights for Android
  - Manual testing with real screen readers (irreplaceable)

Key automated checks:
  - Missing content descriptions
  - Touch targets below minimum
  - Color contrast failures
  - Missing labels on form fields
  - Text scaling issues
```

### XCTest Accessibility Assertions (iOS)

```swift
func testProfileScreenAccessibility() throws {
    let app = XCUIApplication()
    app.launch()

    // Navigate to profile
    app.tabBars.buttons["Profile"].tap()

    // Verify key elements have accessibility labels
    XCTAssert(app.images["profilePhoto"].exists)
    XCTAssertEqual(
        app.images["profilePhoto"].label,
        "Profile photo of John Doe"
    )

    // Verify button is accessible
    let editButton = app.buttons["Edit Profile"]
    XCTAssert(editButton.exists)
    XCTAssert(editButton.isHittable)

    // Check that decorative elements are not accessible
    XCTAssertFalse(app.images["decorativeBorder"].isAccessibilityElement)
}
```


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to accessible mobile developer
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Accessible Mobile Developer Analysis

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

**Input:** "Help me with accessible mobile developer for my current situation"

**Output:**

Based on your situation, here is a structured approach to accessible mobile developer:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
