# Theme System

## Architecture Overview

The theme system separates light/dark mode from color schemes for better extensibility.

### Two Dimensions

1. **Light/Dark Mode** (`theme`)
   - Controlled by `useTheme` hook
   - Values: `'light'` | `'dark'`
   - Controls: `[data-theme]` attribute on `<html>` and `arco-theme` attribute on `<body>`

2. **Color Scheme** (`colorScheme`)
   - Controlled by `useColorScheme` hook
   - Values: `'default'`
   - Controls: `[data-color-scheme]` attribute on `<html>`

### File Structure

```
styles/themes/
├── index.css                 # Entry point
├── base.css                  # Theme-independent base styles
└── color-schemes/            # Color scheme definitions
    └── default.css           # Default color scheme (AOU brand)
```

## How to Add a New Color Scheme

When you need to add a new color scheme in the future, follow these steps:

1. Create a new CSS file in `color-schemes/` directory (e.g., `blue.css`)

2. Define CSS variables for both light and dark modes, following the structure in `default.css`

3. Import the new file in `index.css`

4. Update the `ColorScheme` type in `hooks/useColorScheme.ts`

5. Add UI selector option and translations

## CSS Variable Naming Convention

### Brand Colors

- `--aou-1` to `--aou-10`: Brand color palette (1=lightest, 10=darkest)

### Background Colors

- `--bg-base`: Main background
- `--bg-1`: Secondary background
- `--bg-2`: Tertiary background
- `--bg-3`: Border/divider
- `--bg-hover`: Hover state
- `--bg-active`: Active/pressed state

### Text Colors

- `--text-primary`: Primary text
- `--text-secondary`: Secondary text
- `--text-disabled`: Disabled text

### Semantic Colors

- `--primary`: Primary action color
- `--success`: Success state
- `--warning`: Warning state
- `--danger`: Danger state

### Brand-specific Colors

- `--brand`: Main brand color
- `--brand-light`: Light brand background
- `--brand-hover`: Brand hover state

### Component-specific Colors

- `--message-user-bg`: User message background
- `--message-tips-bg`: Tips message background
- `--workspace-btn-bg`: Workspace button background

## Best Practices

1. **Always define both light and dark variants** for each color scheme

2. **Maintain consistent lightness progression** in brand color scales (1→10)

3. **Test in both light and dark modes** before finalizing

4. **Use semantic names** for component-specific colors

5. **Keep background colors neutral** (grays) to maintain readability

## Current Status

- ✅ Infrastructure ready
- ✅ Default color scheme implemented
- ⏸️ Additional color schemes pending designer input
- 💡 UI selector commented out, ready to enable
