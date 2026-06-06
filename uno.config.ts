// uno.config.ts
import { defineConfig, presetMini, presetWind3, transformerDirectives, transformerVariantGroup } from 'unocss';
import { presetExtra } from 'unocss-preset-extra';

// ==================== Semantic Text Colors ====================
// Usage: Body text, headings, etc. (Recommended for text)
const textColors = {
  // Custom semantic text colors
  't-primary': 'var(--text-primary)', // text-t-primary - primary text
  't-secondary': 'var(--text-secondary)', // text-t-secondary - secondary text
  't-tertiary': 'var(--text-muted)', // text-t-tertiary - tertiary description/hint text (muted but WCAG-AA readable)
  't-disabled': 'var(--text-disabled)', // text-t-disabled - disabled text
};

// ==================== Semantic State Colors ====================
// Usage: Status indicators, buttons, tags, etc.
const semanticColors = {
  primary: 'var(--primary)', // bg-primary, text-primary, border-primary
  success: 'var(--success)', // bg-success, text-success
  warning: 'var(--warning)', // bg-warning, text-warning
  danger: 'var(--danger)', // bg-danger, text-danger
  info: 'var(--info)', // bg-info, text-info
};

// ==================== Background Color System ====================
// Usage: Backgrounds, containers, layout elements
// ⚠️ Numeric keys support both bg-* and border-* (e.g. bg-1, border-1)
// text-1 to text-4 are supported via custom rules, pointing to Arco's --color-text-*
const backgroundColors = {
  base: 'var(--bg-base)', // bg-base, border-base - primary background
  1: 'var(--bg-1)', // bg-1, border-1 - secondary background
  2: 'var(--bg-2)', // bg-2, border-2 - tertiary background
  3: 'var(--bg-3)', // bg-3, border-3 - border/divider
  4: 'var(--bg-4)', // bg-4, border-4
  5: 'var(--bg-5)', // bg-5, border-5
  6: 'var(--bg-6)', // bg-6, border-6
  8: 'var(--bg-8)', // bg-8, border-8
  9: 'var(--bg-9)', // bg-9, border-9
  10: 'var(--bg-10)', // bg-10, border-10
  hover: 'var(--bg-hover)', // bg-hover - hover background
  active: 'var(--bg-active)', // bg-active - active background
};

// ==================== Border Colors ====================
const borderColors = {
  'b-base': 'var(--border-base)', // border-b-base - base border
  'b-light': 'var(--border-light)', // border-b-light - light border
  'b-1': 'var(--bg-3)', // border-b-1 - based on bg-3
  'b-2': 'var(--bg-4)', // border-b-2 - based on bg-4
  'b-3': 'var(--bg-5)', // border-b-3 - based on bg-5
};

// ==================== Brand Colors ====================
const brandColors = {
  brand: 'var(--brand)',
  'brand-light': 'var(--brand-light)',
  'brand-hover': 'var(--brand-hover)',
};

// ==================== AOU Brand Colors ====================
const aouColors = {
  aou: {
    1: 'var(--aou-1)',
    2: 'var(--aou-2)',
    3: 'var(--aou-3)',
    4: 'var(--aou-4)',
    5: 'var(--aou-5)',
    6: 'var(--aou-6)',
    7: 'var(--aou-7)',
    8: 'var(--aou-8)',
    9: 'var(--aou-9)',
    10: 'var(--aou-10)',
  },
};

// ==================== UI Component Specific Colors ====================
const componentColors = {
  'message-user': 'var(--message-user-bg)',
  'message-tips': 'var(--message-tips-bg)',
  'workspace-btn': 'var(--workspace-btn-bg)',
};

// ==================== Special Colors ====================
const specialColors = {
  fill: 'var(--fill)',
  inverse: 'var(--inverse)',
};

export default defineConfig({
  presets: [presetMini(), presetExtra(), presetWind3()],
  transformers: [transformerVariantGroup(), transformerDirectives({ enforce: 'pre' })],
  content: {
    pipeline: {
      // Use RegExp instead of glob strings so patterns match against absolute
      // module IDs regardless of the Vite root directory.  electron-vite sets
      // the renderer root to src/renderer/, which causes glob patterns like
      // 'src/**/*.tsx' to resolve to the non-existent src/renderer/src/ path.
      include: [/\.[jt]sx?($|\?)/, /\.vue($|\?)/, /\.css($|\?)/],
      exclude: [/[\\/]node_modules[\\/]/, /\.html($|\?)/],
    },
  },
  // Custom rules
  rules: [
    // Arco Design official text colors: text-1, text-2, text-3, text-4
    [/^text-([1-4])$/, ([, d]: RegExpExecArray) => ({ color: `var(--color-text-${d})` })],

    // Arco Design official fill colors: bg-fill-1, bg-fill-2, bg-fill-3, bg-fill-4
    [/^bg-fill-([1-4])$/, ([, d]: RegExpExecArray) => ({ 'background-color': `var(--color-fill-${d})` })],

    // Arco Design official border colors: border-arco-1, border-arco-2, border-arco-3, border-arco-4
    // (prefixed with border-arco-* to avoid conflicts with project-custom border utilities)
    [/^border-arco-([1-4])$/, ([, d]: RegExpExecArray) => ({ 'border-color': `var(--color-border-${d})` })],

    // Arco Design light variants: bg-primary-light-1, bg-success-light-1, etc.
    [
      /^bg-(primary|success|warning|danger|link)-light-([1-4])$/,
      ([, color, d]: RegExpExecArray) => ({ 'background-color': `var(--color-${color}-light-${d})` }),
    ],

    // Arco Design color levels: bg-primary-1, text-primary-1, border-primary-1, etc.
    [
      /^(bg|text|border)-(primary|success|warning|danger)-([1-9])$/,
      ([, prefix, color, d]: RegExpExecArray) => {
        const prop = prefix === 'bg' ? 'background-color' : prefix === 'text' ? 'color' : 'border-color';
        return { [prop]: `rgb(var(--${color}-${d}))` };
      },
    ],

    // Arco Design white and black: bg-color-white, text-color-white, bg-color-black, text-color-black
    ['bg-color-white', { 'background-color': 'var(--color-white)' }],
    ['text-color-white', { color: 'var(--color-white)' }],
    ['bg-color-black', { 'background-color': 'var(--color-black)' }],
    ['text-color-black', { color: 'var(--color-black)' }],

    // Arco Design popup/dialog background color: bg-popup
    ['bg-popup', { 'background-color': 'var(--color-bg-popup)' }],

    // Project custom colors
    ['bg-dialog-fill-0', { 'background-color': 'var(--dialog-fill-0)' }],
    ['text-0', { color: 'var(--text-0)' }],
    ['text-white', { color: 'var(--text-white)' }],
    ['bg-fill-0', { 'background-color': 'var(--fill-0)' }],
    ['bg-fill-white-to-black', { 'background-color': 'var(--fill-white-to-black)' }],
    ['border-special', { 'border-color': 'var(--border-special)' }],

    // Wiggle animation for attention indicators (e.g. pending permission badge)
    // Shakes briefly then pauses - 3s cycle, active in first ~20%
    ['animate-wiggle', { animation: 'wiggle 3s ease-in-out infinite' }],
  ],
  // Preflights - Global base styles
  preflights: [
    {
      getCSS: () => `
        * {
          /* Set default text color to follow theme - all elements inherit the theme text color by default */
          color: inherit;
        }
        @keyframes wiggle {
          0%, 20%, 100% { transform: rotate(0deg); }
          4% { transform: rotate(8deg); }
          8% { transform: rotate(-8deg); }
          12% { transform: rotate(6deg); }
          16% { transform: rotate(-4deg); }
        }
      `,
    },
  ],
  // Base configuration
  shortcuts: {
    'flex-center': 'flex items-center justify-center',
  },
  theme: {
    colors: {
      // Merge all color configurations
      ...textColors,
      ...semanticColors,
      ...backgroundColors,
      ...borderColors,
      ...brandColors,
      ...aouColors,
      ...componentColors,
      ...specialColors,
    },
  },
});
