# Modern CSS Extractor - Complete Developer Guide

## Table of Contents

1. [Overview](#overview)
2. [Installation & Setup](#installation--setup)
3. [Core Concepts](#core-concepts)
4. [Current Limitations](#current-limitations)
5. [Static CSS Features](#static-css-features)
6. [Reactive Styles](#reactive-styles)
7. [Interactive States](#interactive-states)
8. [Browser Compatibility](#browser-compatibility)
9. [Performance Guidelines](#performance-guidelines)
10. [API Reference](#api-reference)
11. [Best Practices](#best-practices)
12. [Troubleshooting](#troubleshooting)
13. [Real-World Examples](#real-world-examples)

---

## Overview

The Modern CSS Extractor is a CSS-in-JS solution that intelligently separates static and reactive styles for optimal performance. It extracts static CSS features to native stylesheets while preserving reactivity where needed.

### What It Does

- ✅ **Extracts static styles** to CSS classes (fast rendering)
- ✅ **Preserves reactive styles** as JavaScript functions
- ✅ **Handles modern CSS features** with automatic fallbacks
- ✅ **Provides interactive states** via event handlers
- ✅ **Generates scoped CSS** with unique class names

### What It Doesn't Do

- ❌ **Reactive functions in pseudo-selectors** (CSS limitation)
- ❌ **Runtime CSS rule modification** (performance choice)
- ❌ **Full container query observers** (basic implementation only)
- ❌ **Automatic polyfills** (provides fallbacks only)

---

## Installation & Setup

### Basic Setup with Juris

```javascript
// Include the CSS Extractor
<script src="path/to/juris-cssextractor.js"></script>

// Initialize with Juris
const juris = new Juris({
  features: {
    cssExtract: CSSExtractor
  }
});
```

### Verification

```javascript
// Verify CSS Extractor is working
const testElement = juris.domRenderer.render({
  div: {
    style: {
      background: 'blue',                    // → CSS class
      color: () => getState('theme.color')   // → reactive style
    }
  }
});

// Check for generated CSS
const cssElement = document.querySelector('style[data-juris-css-extractor]');
console.log('CSS generated:', !!cssElement);
```

---

## Core Concepts

### The Three-Layer System

The CSS Extractor separates styles into three distinct layers:

```javascript
{
  // Layer 1: Static Styles → Extracted to CSS classes
  background: 'linear-gradient(45deg, #667eea, #764ba2)',
  padding: '1rem',
  borderRadius: '8px',
  display: 'flex',
  
  // Layer 2: Reactive Styles → Preserved as functions
  color: () => getState('theme.textColor'),
  opacity: () => getState('ui.isVisible') ? 1 : 0.5,
  
  // Layer 3: Interactive States → Event handlers
  $hover: {
    background: 'rgba(255,255,255,0.1)',
    transform: 'translateY(-2px)'
  }
}
```

### Processing Flow

1. **Style Analysis** - Categorize each style property
2. **CSS Generation** - Extract static styles to CSS classes  
3. **Props Modification** - Return className + reactive styles
4. **Event Handler Setup** - Convert interactive states to events

### Generated Output

```javascript
// Input:
{
  style: {
    padding: '1rem',                      // Static
    color: () => getState('theme.color'), // Reactive
    $hover: { background: 'blue' }        // Interactive
  }
}

// Output:
{
  className: 'j-component-abc123',        // CSS class for static styles
  style: {
    color: () => getState('theme.color')  // Preserved reactive styles
  },
  onmouseenter: (e) => { ... },          // Generated event handler
  onmouseleave: (e) => { ... }
}
```

---

## Current Limitations

### 1. Reactive Functions in Pseudo-Selectors

**❌ This doesn't work:**

```javascript
{
  '&:hover': {
    color: () => getState('theme.hoverColor'),    // ❌ Function in CSS
    background: () => computeHoverColor()         // ❌ Won't work
  }
}
```

**✅ Workarounds:**

```javascript
// Option A: CSS Variables (simple values only)
{
  '--hover-color': () => getState('theme.hoverColor'), // Reactive variable
  '&:hover': {
    color: 'var(--hover-color)'                        // Static CSS reference
  }
}

// Option B: Interactive States (full flexibility)
{
  $hover: {
    color: () => getState('theme.hoverColor'),          // ✅ Full reactivity
    background: () => computeComplexHoverColor()       // ✅ Complex logic
  }
}

// Option C: Event Handlers (manual approach)
{
  onmouseenter: (e) => {
    e.target.style.color = getState('theme.hoverColor');
  },
  onmouseleave: (e) => {
    e.target.style.color = '';
  }
}
```

### 2. Container Query Observers

The current implementation provides basic container query CSS generation but **does not include full ResizeObserver integration**:

```javascript
// ✅ This generates CSS:
'@container (min-width: 300px)': {
  fontSize: '1.2rem'
}
// Generates: @container (min-width: 300px) { .j-comp-123 { font-size: 1.2rem; } }

// ❌ But automatic responsive updates require manual observer setup
```

### 3. Browser Support Reality

Many modern CSS features have limited support:

| Feature | Chrome | Firefox | Safari | Notes |
|---------|--------|---------|--------|-------|
| `color-mix()` | 111+ | 113+ | 16.4+ | Recent support |
| `@container` | 105+ | 110+ | 16.0+ | Still emerging |
| `:has()` | 105+ | 121+ | 15.4+ | Very recent |
| `dvh` units | 108+ | 101+ | 15.4+ | Mobile-specific |

### 4. Performance Considerations

Not all reactive styles are equal:

```javascript
// ✅ Efficient: Simple reactive values
color: () => getState('theme.color')

// ⚠️ Less efficient: Complex computations
transform: () => {
  const x = getState('ui.mouseX');
  const y = getState('ui.mouseY');  
  return `translate(${x * 0.1}px, ${y * 0.1}px) rotate(${x + y}deg)`;
}

// ❌ Inefficient: Reactive static values
padding: () => '1rem'  // Should be static: padding: '1rem'
```

---

## Static CSS Features

### Modern Layout

```javascript
{
  // CSS Grid with modern features
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gridTemplateRows: 'subgrid',  // Subgrid support with fallback
  gap: 'clamp(1rem, 3vw, 2rem)',
  
  // Flexbox with gap
  display: 'flex',
  gap: '1rem',
  alignItems: 'center',
  justifyContent: 'space-between'
}
```

### Modern Units and Sizing

```javascript
{
  // Dynamic viewport units (with fallbacks)
  height: '100dvh',        // Falls back to: 100vh
  width: '100dvw',         // Falls back to: 100vw
  
  // Container query units (with fallbacks)  
  padding: '2cqi 3cqb',    // Falls back to: 2vi 3vb
  fontSize: '4cqw',        // Falls back to: 4vw
  
  // Modern sizing
  aspectRatio: '16/9',
  objectFit: 'cover',
  
  // Math functions
  width: 'clamp(300px, 50vw, 800px)',
  borderRadius: 'max(8px, 1rem)'
}
```

### Advanced Typography

```javascript
{
  // System fonts
  fontFamily: 'system-ui, sans-serif',
  
  // Responsive typography
  fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
  lineHeight: 'calc(1em + 0.5rem)',
  
  // Advanced text features
  fontVariationSettings: '"wght" 400, "slnt" 0',
  textWrap: 'balance',
  hangingPunctuation: 'first last'
}
```

### Modern Colors

```javascript
{
  // color-mix() with fallbacks
  background: 'color-mix(in srgb, #4c51bf 70%, white)',
  // Auto-generates fallback: background: #8b93d6;
  
  // oklch() color space  
  color: 'oklch(0.7 0.15 180)',
  // Auto-generates fallback: color: #4a90a4;
  
  // CSS gradients with modern colors
  background: 'linear-gradient(45deg, oklch(0.7 0.15 180), color-mix(in srgb, red 50%, blue))'
}
```

---

## Reactive Styles

### Function-Based Reactivity

```javascript
{
  // Simple reactive properties
  color: () => getState('theme.textColor', '#333'),
  background: () => getState('theme.background', '#fff'),
  
  // Computed reactive styles  
  transform: () => {
    const scale = getState('ui.scale', 1);
    const rotation = getState('ui.rotation', 0);
    return `scale(${scale}) rotate(${rotation}deg)`;
  },
  
  // Conditional reactive styles
  display: () => getState('ui.isVisible', true) ? 'block' : 'none',
  opacity: () => getState('ui.isLoading', false) ? 0.5 : 1
}
```

### CSS Variables for Theming

```javascript
{
  // Reactive CSS variables
  '--primary-hue': () => getState('theme.primaryHue', 220),
  '--primary-sat': () => `${getState('theme.saturation', 70)}%`,
  '--primary-light': () => `${getState('theme.lightness', 50)}%`,
  
  // Using the variables in static styles
  background: 'hsl(var(--primary-hue) var(--primary-sat) var(--primary-light))',
  color: 'hsl(var(--primary-hue) var(--primary-sat) calc(var(--primary-light) - 30%))',
  
  // Modern color functions with variables
  borderColor: 'color-mix(in srgb, hsl(var(--primary-hue) var(--primary-sat) var(--primary-light)) 30%, transparent)'
}
```

### Reactive Pseudo-Selector Pattern

Since reactive functions don't work directly in pseudo-selectors, use this pattern:

```javascript
{
  // Define reactive variables at root level
  '--hover-color': () => getState('theme.hoverColor', '#2d3748'),
  '--hover-scale': () => getState('ui.hoverIntensity', 1.05),
  
  // Use variables in pseudo-selectors (static CSS)
  '&:hover': {
    color: 'var(--hover-color)',
    transform: 'scale(var(--hover-scale))',
    transition: 'all 0.2s ease'
  },
  
  // Or use interactive states for complex logic
  $hover: {
    color: () => {
      const baseColor = getState('theme.hoverColor', '#2d3748');
      const isDark = getState('theme.mode') === 'dark';
      return isDark ? lighten(baseColor, 20) : darken(baseColor, 10);
    }
  }
}
```

---

## Interactive States

### Understanding the Difference

**CSS Pseudo-selectors (static only):**
```javascript
{
  '&:hover': {
    background: 'blue',           // ✅ Static values
    color: 'var(--hover-color)',  // ✅ CSS variables  
    transform: 'scale(1.05)'      // ✅ Static transforms
    // color: () => getState()    // ❌ Functions don't work
  }
}
```

**Juris Interactive States (full reactivity):**
```javascript
{
  $hover: {
    background: () => getState('theme.hoverBg'),     // ✅ Functions work
    color: () => computeContrastColor(),             // ✅ Complex logic
    transform: () => `scale(${getState('ui.scale')})` // ✅ Dynamic values
  }
}
```

### Standard Interactive States

```javascript
{
  // Base styles
  padding: '1rem 2rem',
  background: '#4c51bf',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  
  // Interactive states → Converted to event handlers
  $hover: {
    background: '#434190',
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(76, 81, 191, 0.3)'
  },
  
  $active: {
    transform: 'translateY(0)',
    boxShadow: '0 4px 15px rgba(76, 81, 191, 0.2)'
  },
  
  $focus: {
    outline: '3px solid rgba(76, 81, 191, 0.5)',
    outlineOffset: '2px'
  },
  
  $disabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    transform: 'none'
  }
}
```

### When to Use Which Approach

| Scenario | Recommended | Reason |
|----------|-------------|---------|
| Static hover effect | `&:hover` | Best performance, native CSS |
| Simple color change | CSS variable + `&:hover` | Good balance |
| Complex reactive hover | `$hover` interactive state | Full JS flexibility |
| Touch interactions | `$pressed` + event handlers | Mobile-optimized |
| Multiple state combinations | CSS pseudo-selectors | Better specificity control |

### Mobile and Touch Optimization

```javascript
{
  // Touch-friendly sizing
  minHeight: '44px',
  minWidth: '44px',
  
  // Touch behavior optimization
  touchAction: 'manipulation',
  webkitTapHighlightColor: 'transparent',
  
  // Mobile-specific interactions
  $pressed: {
    background: () => getState('theme.pressedBg'),
    transform: 'scale(0.98)'
  },
  
  // Hover only on devices that support it
  '@media (hover: hover)': {
    '&:hover': {
      background: 'var(--hover-bg)'
    }
  }
}
```

---

## Browser Compatibility

### Automatic Feature Detection

The CSS Extractor detects browser support for:

```javascript
const detectedFeatures = [
  'container-queries',     // @container support
  'css-nesting',          // Native CSS nesting  
  'css-layers',           // @layer support
  'has-selector',         // :has() pseudo-class
  'subgrid',              // CSS Subgrid
  'aspect-ratio',         // aspect-ratio property
  'backdrop-filter'       // backdrop-filter support
];

// Check what's supported
console.log('Supported:', cssExtractor.getSupportedFeatures());
```

### Fallback Strategy

```javascript
{
  // Modern feature with automatic fallback
  height: '100dvh',
  // CSS Extractor generates:
  // height: 100vh; /* fallback */
  // height: 100dvh;
  
  // Color functions with fallbacks
  background: 'color-mix(in srgb, #4c51bf 50%, white)',
  // CSS Extractor generates:
  // background: #8b93d6; /* fallback */
  // background: color-mix(in srgb, #4c51bf 50%, white);
  
  // Container query units with fallbacks  
  padding: '2cqi',
  // CSS Extractor generates:
  // padding: 2vi; /* fallback */
  // padding: 2cqi;
}
```

### Progressive Enhancement

```javascript
{
  // Base styles (universally supported)
  padding: '1rem',
  background: '#f0f0f0',
  borderRadius: '8px',
  
  // Enhanced styles with feature queries
  '@supports (container-type: inline-size)': {
    containerType: 'inline-size'
  },
  
  '@supports (backdrop-filter: blur(10px))': {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)'
  },
  
  '@supports selector(:has(*))': {
    '&:has(.featured)': {
      borderColor: 'gold'
    }
  }
}
```

### Browser Support Table

| Feature | Chrome | Firefox | Safari | Status |
|---------|--------|---------|--------|--------|
| CSS Grid | 57+ | 52+ | 10.1+ | ✅ Stable |
| Flexbox Gap | 84+ | 63+ | 14.1+ | ✅ Stable |
| `clamp()` | 79+ | 75+ | 13.1+ | ✅ Stable |
| `aspect-ratio` | 88+ | 89+ | 15.0+ | ✅ Stable |
| Container Queries | 105+ | 110+ | 16.0+ | ⚠️ Recent |
| `color-mix()` | 111+ | 113+ | 16.4+ | ⚠️ Very Recent |
| `:has()` | 105+ | 121+ | 15.4+ | ⚠️ Very Recent |
| `dvh` units | 108+ | 101+ | 15.4+ | ⚠️ Very Recent |
| Subgrid | ❌ | 71+ | 16.0+ | ⚠️ Limited |

---

## Performance Guidelines

### Optimal Style Organization

```javascript
// ✅ Performance-optimized structure
{
  // Group 1: Static styles (fastest - extracted to CSS)
  display: 'flex',
  alignItems: 'center',
  padding: '1rem',
  borderRadius: '8px',
  background: 'linear-gradient(45deg, #667eea, #764ba2)',
  fontSize: '1rem',
  fontWeight: '600',
  transition: 'all 0.3s ease',
  
  // Group 2: Modern CSS features (fast - CSS with fallbacks)
  aspectRatio: '16/9',
  containerType: 'inline-size',
  gap: 'clamp(0.5rem, 2vw, 1rem)',
  
  // Group 3: Pseudo/media queries (fast - static CSS rules)
  '&:hover': { 
    transform: 'scale(1.02)',
    boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
  },
  '@media (min-width: 768px)': { 
    fontSize: '1.1rem' 
  },
  
  // Group 4: Reactive styles (moderate - only when state changes)
  color: () => getState('theme.textColor'),
  opacity: () => getState('ui.isVisible') ? 1 : 0.5,
  
  // Group 5: Interactive states (moderate - event-driven)
  $hover: { 
    background: () => getState('theme.hoverBg') 
  }
}
```

### Performance Anti-Patterns

```javascript
// ❌ Everything reactive (slow)
{
  padding: () => '1rem',              // Static but treated as reactive
  background: () => '#4c51bf',        // Static but treated as reactive  
  fontSize: () => '1rem',             // Static but treated as reactive
  color: () => getState('theme.color') // Actually needs reactivity
}

// ❌ Complex computations in render path
{
  transform: () => {
    // Heavy computation on every render
    const matrix = computeComplexMatrix();
    const result = performExpensiveCalculation(matrix);
    return `matrix3d(${result.join(',')})`;
  }
}

// ✅ Optimized version
{
  padding: '1rem',                    // Static → CSS class
  background: '#4c51bf',              // Static → CSS class
  fontSize: '1rem',                   // Static → CSS class
  color: () => getState('theme.color'), // Reactive only when needed
  
  // Pre-compute expensive operations
  transform: () => getState('ui.precomputedTransform', 'none')
}
```

### Cache Management

```javascript
// Monitor CSS Extractor performance
const stats = cssExtractor.getStats();
console.log(`Cached classes: ${stats.cachedClasses}`);
console.log(`Total CSS rules: ${stats.totalRules}`);

// Clear cache if it grows too large
if (stats.cachedClasses > 500) {
  console.warn('CSS cache growing large, consider clearing');
  cssExtractor.clear();
}

// In development, clear cache on hot reload
if (process.env.NODE_ENV === 'development') {
  // Clear cache periodically during development
  setInterval(() => cssExtractor.clear(), 30000);
}
```

---

## API Reference

### Core Methods

#### `new CSSExtractor(options?)`

Creates a new CSS Extractor instance.

```javascript
const cssExtractor = new CSSExtractor();

// Get statistics
const stats = cssExtractor.getStats();
// Returns: { cachedClasses, totalRules, supportedFeatures, pseudoVariables }
```

#### `processProps(props, elementName, domRenderer)`

Main method that processes component props and extracts CSS.

```javascript
const originalProps = {
  style: {
    background: 'red',
    color: () => getState('theme.color'),
    $hover: { background: 'blue' }
  }
};

const modifiedProps = cssExtractor.processProps(
  originalProps,
  'MyComponent', 
  domRenderer
);

// Returns:
// {
//   className: 'j-MyComponent-abc123',
//   style: { color: [Function] },
//   onmouseenter: [Function],
//   onmouseleave: [Function]
// }
```

#### `extractCSS(componentName, styleObj)`

Core extraction method (used internally by `processProps`).

```javascript
const result = cssExtractor.extractCSS('Button', {
  background: 'blue',                     // → CSS class
  color: () => getState('theme.color'),   // → reactiveStyle  
  $hover: { background: 'darkblue' }      // → interactiveHandlers
});

// Returns:
// {
//   className: 'j-Button-xyz789',
//   reactiveStyle: { color: [Function] },
//   interactiveHandlers: { 
//     onmouseenter: [Function], 
//     onmouseleave: [Function] 
//   }
// }
```

### Utility Methods

#### `separateStyles(styleObj)`

Categorizes styles into different types.

```javascript
const separated = cssExtractor.separateStyles({
  background: 'red',                    // → staticStyles
  color: () => getState('theme.color'), // → reactiveStyles  
  '&:hover': { opacity: 0.8 },         // → pseudoStyles
  '@media (min-width: 768px)': {...},  // → mediaQueries
  $focus: { outline: 'blue' }           // → interactiveStates
});

// Returns object with categorized styles
```

#### `getSupportedFeatures()`

Returns array of detected browser features.

```javascript
const features = cssExtractor.getSupportedFeatures();
// Returns: ['container-queries', 'css-nesting', 'has-selector', ...]

// Check specific feature
const hasContainerQueries = features.includes('container-queries');
```

#### `getStats()`

Returns extraction and performance statistics.

```javascript
const stats = cssExtractor.getStats();
// Returns:
// {
//   cachedClasses: 25,
//   totalRules: 47,  
//   supportedFeatures: [...],
//   pseudoVariables: 3,
//   activeObservers: 0
// }
```

#### `clear()`

Clears all cached styles and removes injected CSS.

```javascript
// Clear everything
cssExtractor.clear();

// Verify cleanup
const clearedStats = cssExtractor.getStats();
console.log(clearedStats.cachedClasses); // 0
```

---

## Best Practices

### 1. Optimize Style Categories

```javascript
// ✅ Well-organized component styles
function OptimizedButton({ variant, size }, { getState }) {
  return {
    button: {
      style: {
        // Static base styles (extracted to CSS)
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontWeight: '600',
        textDecoration: 'none',
        transition: 'all 0.2s ease',
        
        // Size variants (static, extracted)
        ...(size === 'small' && {
          padding: '0.5rem 1rem',
          fontSize: '0.875rem'
        }),
        ...(size === 'large' && {
          padding: '1rem 2rem', 
          fontSize: '1.125rem'
        }),
        
        // Modern CSS features (extracted with fallbacks)
        aspectRatio: size === 'square' ? '1' : 'auto',
        containerType: 'inline-size',
        
        // Static pseudo-selectors
        '&:hover:not(:disabled)': {
          transform: 'translateY(-1px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
        },
        
        '&:focus-visible': {
          outline: '3px solid rgba(76, 81, 191, 0.5)',
          outlineOffset: '2px'
        },
        
        // Reactive theming (minimal)
        '--theme-primary': () => getState('theme.primaryColor', '#4c51bf'),
        color: () => getState('theme.buttonTextColor', 'white'),
        
        // Use CSS variable in static styles
        background: 'var(--theme-primary)',
        
        // Interactive state for complex reactivity
        $hover: {
          background: () => {
            const primary = getState('theme.primaryColor', '#4c51bf');
            const isDark = getState('theme.mode') === 'dark';
            return isDark ? lighten(primary, 10) : darken(primary, 10);
          }
        }
      }
    }
  };
}
```

### 2. Handle Responsive Design

```javascript
// ✅ Effective responsive patterns
{
  // Base mobile-first styles
  padding: '1rem',
  fontSize: '1rem',
  
  // CSS breakpoints (static, fast)
  '@media (min-width: 768px)': {
    padding: '2rem',
    fontSize: '1.25rem'
  },
  
  // Container queries for component-level responsiveness
  containerType: 'inline-size',
  '@container (min-width: 300px)': {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr'
  },
  
  // Reactive breakpoints for complex logic
  display: () => {
    const screenSize = getState('ui.screenSize');
    const showSidebar = getState('layout.showSidebar');
    
    if (screenSize === 'mobile') return 'block';
    if (screenSize === 'tablet' && !showSidebar) return 'flex';
    return 'grid';
  }
}
```

### 3. Manage CSS Variables Effectively

```javascript
// ✅ Strategic CSS variable usage
{
  // Define reactive variables at component root
  '--primary-hue': () => getState('theme.primaryHue', 220),
  '--primary-sat': () => `${getState('theme.saturation', 70)}%`,
  '--primary-light': () => `${getState('theme.lightness', 50)}%`,
  '--spacing-unit': () => `${getState('ui.spacingScale', 1)}rem`,
  
  // Use variables throughout static styles
  background: 'hsl(var(--primary-hue) var(--primary-sat) var(--primary-light))',
  padding: 'calc(var(--spacing-unit) * 2)',
  gap: 'var(--spacing-unit)',
  
  // Pseudo-selectors can reference reactive variables
  '&:hover': {
    background: 'hsl(var(--primary-hue) var(--primary-sat) calc(var(--primary-light) - 10%))'
  },
  
  // Media queries can use variables
  '@media (min-width: 768px)': {
    padding: 'calc(var(--spacing-unit) * 3)'
  }
}
```

### 4. Debug and Monitor Performance

```javascript
// Development debugging helper
function debugCSSExtraction(cssExtractor, componentName, styles) {
  if (process.env.NODE_ENV !== 'development') return;
  
  console.group(`🎨 CSS Debug: ${componentName}`);
  
  // Show style separation
  const separated = cssExtractor.separateStyles(styles);
  console.log('📊 Style categories:', {
    static: Object.keys(separated.staticStyles).length,
    reactive: Object.keys(separated.reactiveStyles).length,
    pseudo: Object.keys(separated.pseudoStyles).length,
    interactive: Object.keys(separated.interactiveStates).length
  });
  
  // Show extraction result
  const result = cssExtractor.extractCSS(componentName, styles);
  console.log('🏗️ Extraction result:', {
    hasClassName: !!result.className,
    reactiveStylesCount: Object.keys(result.reactiveStyle || {}).length,
    interactiveHandlersCount: Object.keys(result.interactiveHandlers || {}).length
  });
  
  // Show performance stats
  const stats = cssExtractor.getStats();
  console.log('📈 Performance stats:', stats);
  
  // Warn about performance issues
  if (Object.keys(separated.reactiveStyles).length > 5) {
    console.warn('⚠️ High reactive style count - consider optimization');
  }
  
  console.groupEnd();
}

// Usage
debugCSSExtraction(cssExtractor, 'MyComponent', styles);
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: Styles Not Applying

**Problem:** Styles defined but not visible in browser

```javascript
// ❌ Common mistakes
{
  style: {
    background: 'red',
    '&:hover': 'blue'        // ❌ Should be object
  }
}
```

**Solution:**
```javascript
// ✅ Correct structure
{
  style: {
    background: 'red',
    '&:hover': {             // ✅ Object with properties
      background: 'blue'
    }
  }
}
```

**Debug steps:**
```javascript
// 1. Check for generated CSS
const cssElement = document.querySelector('style[data-juris-css-extractor]');
console.log('CSS exists:', !!cssElement);
console.log('CSS content:', cssElement?.textContent);

// 2. Check element has className
const element = document.querySelector('[data-component-name]');
console.log('Element classes:', element?.className);

// 3. Check CSS Extractor stats
const stats = cssExtractor.getStats();
console.log('Extractor stats:', stats);
```

#### Issue 2: Reactive Styles Not Updating

**Problem:** Functions defined but values don't change when state updates

```javascript
// ❌ Wrong: Static value
{
  color: getState('theme.color')     // ❌ Evaluated once
}

// ✅ Right: Reactive function
{
  color: () => getState('theme.color') // ✅ Re-evaluated on state change
}
```

**Debug reactive styles:**
```javascript
// Check if state is actually changing
const unsubscribe = juris.subscribe('theme.color', (newValue, oldValue) => {
  console.log('State changed:', { oldValue, newValue });
});

// Check if reactive function is being called
{
  color: () => {
    const color = getState('theme.color');
    console.log('Reactive style called:', color);
    return color;
  }
}
```

#### Issue 3: Interactive States Not Working

**Problem:** `$hover`, `$focus` states not triggering

**Check event handler attachment:**
```javascript
// Verify handlers were created
const result = cssExtractor.extractCSS('TestComponent', {
  $hover: { background: 'blue' }
});
console.log('Interactive handlers:', result.interactiveHandlers);

// Check if handlers are attached to element
const element = document.querySelector('.test-element');
console.log('Event listeners:', getEventListeners(element)); // Chrome DevTools only
```

**Manual testing:**
```javascript
// Test event handlers manually
const handlers = cssExtractor.createInteractiveHandlers({
  $hover: { background: 'blue' }
}, 'test-class');

// Simulate events
const mockElement = document.createElement('div');
handlers.onmouseenter?.({ target: mockElement });
console.log('Element style after hover:', mockElement.style.background);
```

#### Issue 4: Performance Problems

**Problem:** Slow rendering or high memory usage

**Identify performance bottlenecks:**
```javascript
// Monitor CSS cache growth
setInterval(() => {
  const stats = cssExtractor.getStats();
  if (stats.cachedClasses > 100) {
    console.warn('CSS cache growing:', stats);
  }
}, 5000);

// Profile reactive style execution
{
  transform: () => {
    const start = performance.now();
    const result = computeExpensiveTransform();
    const end = performance.now();
    
    if (end - start > 1) {
      console.warn('Slow reactive style:', end - start + 'ms');
    }
    
    return result;
  }
}

// Find unnecessary reactive styles
const separated = cssExtractor.separateStyles(styles);
const staticAsReactive = Object.entries(separated.reactiveStyles)
  .filter(([key, fn]) => {
    // Check if function always returns same value
    const result1 = fn();
    const result2 = fn();
    return result1 === result2 && typeof result1 === 'string';
  });

if (staticAsReactive.length > 0) {
  console.warn('Static values treated as reactive:', staticAsReactive.map(([k]) => k));
}
```

### Browser-Specific Issues

#### Safari Issues

```javascript
// Safari-specific fallbacks
{
  // Safari doesn't support all container query features
  '@supports (container-type: inline-size)': {
    containerType: 'inline-size'
  },
  
  // Safari color-mix() fallback
  background: '#8b93d6',  // Fallback
  background: 'color-mix(in srgb, #4c51bf 50%, white)',
  
  // Safari viewport unit issues
  height: '100vh',        // Fallback  
  height: '100dvh'        // Modern
}
```

#### Firefox Issues

```javascript
// Firefox-specific considerations
{
  // Firefox subgrid support check
  '@supports (grid-template-rows: subgrid)': {
    gridTemplateRows: 'subgrid'
  },
  
  // Firefox backdrop-filter
  '@supports (backdrop-filter: blur(10px))': {
    backdropFilter: 'blur(10px)'
  },
  '@supports (-moz-backdrop-filter: blur(10px))': {
    mozBackdropFilter: 'blur(10px)'
  }
}
```

---

## Real-World Examples

### Example 1: Responsive Card Component

```javascript
function ResponsiveCard({ title, content, featured, image }, { getState }) {
  return {
    article: {
      style: {
        // Container setup for component-level responsiveness
        containerType: 'inline-size',
        
        // Base layout (extracted to CSS)
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'max(8px, 1rem)',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        
        // Modern shadows and borders
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        border: '1px solid color-mix(in srgb, transparent 80%, black)',
        
        // Container queries for layout changes
        '@container (min-width: 400px)': {
          flexDirection: 'row',
          alignItems: 'stretch'
        },
        
        // Featured card styling
        ...(featured && {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          
          '&::before': {
            content: '"✨"',
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            fontSize: '1.5rem'
          }
        }),
        
        // Hover effects (static CSS)
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
        },
        
        // Focus for accessibility
        '&:focus-within': {
          outline: '3px solid color-mix(in srgb, var(--accent-color) 50%, transparent)',
          outlineOffset: '2px'
        },
        
        // Reactive theming
        '--accent-color': () => getState('theme.accentColor', '#4c51bf'),
        backgroundColor: () => {
          if (featured) return 'transparent'; // Use gradient
          
          const isDark = getState('theme.mode') === 'dark';
          const bgColor = getState('theme.cardBackground');
          
          return isDark 
            ? (bgColor || '#2d3748')
            : (bgColor || '#ffffff');
        },
        
        // Reactive border for theme changes  
        borderColor: () => {
          const accent = getState('theme.accentColor', '#4c51bf');
          const opacity = getState('theme.borderOpacity', 0.1);
          return `color-mix(in srgb, ${accent} ${opacity * 100}%, transparent)`;
        }
      },
      children: [
        // Image section (if provided)
        image && {
          div: {
            style: {
              flex: '0 0 auto',
              aspectRatio: '16/9',
              
              '@container (min-width: 400px)': {
                aspectRatio: '4/3',
                width: '200px'
              },
              
              // Modern object-fit
              '& img': {
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }
            },
            children: [{
              img: {
                src: image,
                alt: title,
                loading: 'lazy'
              }
            }]
          }
        },
        
        // Content section
        {
          div: {
            style: {
              flex: '1 1 auto',
              padding: 'clamp(1rem, 4cqw, 2rem)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            },
            children: [
              // Title
              {
                h3: {
                  style: {
                    fontSize: 'clamp(1.25rem, 4cqw, 1.75rem)',
                    fontWeight: '700',
                    margin: 0,
                    lineHeight: '1.2',
                    
                    // Responsive line clamping
                    display: '-webkit-box',
                    webkitBoxOrient: 'vertical',
                    webkitLineClamp: '2',
                    overflow: 'hidden',
                    
                    // Reactive color
                    color: () => featured 
                      ? 'white'
                      : getState('theme.headingColor', '#1a202c')
                  },
                  text: title
                }
              },
              
              // Content  
              {
                p: {
                  style: {
                    fontSize: 'clamp(0.875rem, 3cqw, 1rem)',
                    lineHeight: '1.6',
                    margin: 0,
                    
                    // Line clamping for consistent heights
                    display: '-webkit-box',
                    webkitBoxOrient: 'vertical', 
                    webkitLineClamp: '3',
                    overflow: 'hidden',
                    
                    // Reactive color
                    color: () => featured
                      ? 'rgba(255, 255, 255, 0.9)'
                      : getState('theme.textColor', '#4a5568')
                  },
                  text: content
                }
              }
            ]
          }
        }
      ].filter(Boolean)
    }
  };
}
```

### Example 2: Advanced Navigation Component

```javascript
function AdvancedNavigation({ items, logo }, { getState, setState }) {
  return {
    nav: {
      style: {
        // Modern sticky header with safe areas
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        insetInlineStart: 0,
        insetInlineEnd: 0,
        
        // Safe area support for mobile
        paddingTop: 'max(0.5rem, env(safe-area-inset-top))',
        paddingInlineStart: 'max(1rem, env(safe-area-inset-left))',
        paddingInlineEnd: 'max(1rem, env(safe-area-inset-right))',
        
        // Modern backdrop with glassmorphism
        background: () => {
          const opacity = getState('nav.backgroundOpacity', 0.95);
          const isDark = getState('theme.mode') === 'dark';
          const baseColor = isDark ? '#1a202c' : '#ffffff';
          return `color-mix(in srgb, ${baseColor} ${opacity * 100}%, transparent)`;
        },
        backdropFilter: 'blur(12px) saturate(1.8)',
        
        // Container queries for responsive navigation
        containerType: 'inline-size',
        
        // Base layout
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 'clamp(60px, 8vh, 80px)',
        paddingBlock: '0.5rem',
        
        // Border with theme integration
        borderBottom: () => {
          const borderColor = getState('theme.borderColor', '#e2e8f0');
          const isDark = getState('theme.mode') === 'dark';
          return `1px solid color-mix(in srgb, ${borderColor} ${isDark ? 20 : 50}%, transparent)`;
        },
        
        // Container-based responsive behavior
        '@container (max-width: 768px)': {
          flexDirection: 'column',
          paddingBlock: '1rem',
          gap: '1rem'
        }
      },
      children: [
        // Logo section
        logo && {
          div: {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              
              '& img': {
                height: 'clamp(32px, 5cqh, 48px)',
                width: 'auto'
              }
            },
            children: [
              typeof logo === 'string' ? {
                img: { src: logo, alt: 'Logo' }
              } : logo
            ]
          }
        },
        
        // Navigation items
        {
          ul: {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(0.5rem, 2cqw, 1.5rem)',
              listStyle: 'none',
              margin: 0,
              padding: 0,
              
              // Mobile menu transformation
              '@container (max-width: 768px)': {
                flexDirection: 'column',
                width: '100%',
                gap: '0.5rem',
                
                // Mobile menu animation
                transform: () => getState('nav.mobileMenuOpen', false) 
                  ? 'translateY(0)' 
                  : 'translateY(-100%)',
                transition: 'transform 0.3s ease'
              }
            },
            children: items.map((item, index) => ({
              li: {
                key: item.href,
                children: [{
                  a: {
                    href: item.href,
                    style: {
                      // Typography
                      fontSize: 'clamp(0.875rem, 2.5cqw, 1rem)',
                      fontWeight: '500',
                      textDecoration: 'none',
                      
                      // Spacing and layout
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.5rem',
                      
                      // Base colors (reactive)
                      color: () => getState('theme.navLinkColor', '#4a5568'),
                      background: 'transparent',
                      
                      // Modern transitions
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      
                      // Advanced hover states
                      '&:hover': {
                        background: () => {
                          const accent = getState('theme.accentColor', '#4c51bf');
                          return `color-mix(in srgb, ${accent} 10%, transparent)`;
                        },
                        transform: 'translateY(-1px)',
                        
                        // Nested hover for icons
                        '& .nav-icon': {
                          transform: 'scale(1.1)'
                        }
                      },
                      
                      // Focus states for accessibility
                      '&:focus-visible': {
                        outline: '2px solid var(--focus-color)',
                        outlineOffset: '2px'
                      },
                      
                      // Active page styling
                      '&[aria-current="page"]': {
                        background: () => getState('theme.accentColor', '#4c51bf'),
                        color: 'white',
                        fontWeight: '600',
                        
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          bottom: '0',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '4px',
                          height: '4px',
                          borderRadius: '50%',
                          background: 'currentColor'
                        }
                      },
                      
                      // CSS variables for dynamic theming
                      '--focus-color': () => getState('theme.focusColor', '#4c51bf')
                    },
                    
                    // Reactive aria-current
                    'aria-current': () => getState('router.currentPath') === item.href ? 'page' : undefined,
                    
                    children: [
                      // Icon (if provided)
                      item.icon && {
                        span: {
                          className: 'nav-icon',
                          style: {
                            display: 'inline-flex',
                            transition: 'transform 0.2s ease'
                          },
                          innerHTML: item.icon
                        }
                      },
                      
                      // Label
                      {
                        span: {
                          text: item.label
                        }
                      }
                    ].filter(Boolean)
                  }
                }]
              }
            }))
          }
        },
        
        // Mobile menu toggle (only on mobile)
        {
          button: {
            style: {
              display: 'none',
              
              '@container (max-width: 768px)': {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '44px',
                height: '44px',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                
                // Reactive styling
                background: () => {
                  const accent = getState('theme.accentColor', '#4c51bf');
                  return `color-mix(in srgb, ${accent} 10%, transparent)`;
                },
                color: () => getState('theme.textColor', '#1a202c')
              },
              
              // Interactive state for mobile toggle
              $pressed: {
                background: () => {
                  const accent = getState('theme.accentColor', '#4c51bf');
                  return `color-mix(in srgb, ${accent} 20%, transparent)`;
                },
                transform: 'scale(0.95)'
              }
            },
            
            onclick: () => {
              const isOpen = getState('nav.mobileMenuOpen', false);
              setState('nav.mobileMenuOpen', !isOpen);
            },
            
            children: [{
              span: {
                // Hamburger menu icon
                innerHTML: () => getState('nav.mobileMenuOpen', false) 
                  ? '✕'  // Close icon
                  : '☰'  // Hamburger icon
              }
            }]
          }
        }
      ].filter(Boolean)
    }
  };
}
```

### Example 3: Theme-Aware Form Component

```javascript
function ThemedForm({ fields, onSubmit }, { getState, setState }) {
  return {
    form: {
      onsubmit: (e) => {
        e.preventDefault();
        onSubmit(new FormData(e.target));
      },
      
      style: {
        // Container setup
        containerType: 'inline-size',
        
        // Base layout
        display: 'flex',
        flexDirection: 'column',
        gap: 'clamp(1rem, 3cqw, 2rem)',
        padding: 'clamp(1.5rem, 5cqw, 3rem)',
        maxWidth: '100%',
        
        // Modern form styling
        background: () => {
          const isDark = getState('theme.mode') === 'dark';
          const opacity = getState('theme.formBackgroundOpacity', 0.02);
          const accent = getState('theme.accentColor', '#4c51bf');
          
          return isDark
            ? `color-mix(in srgb, ${accent} ${opacity * 100}%, #1a202c)`
            : `color-mix(in srgb, ${accent} ${opacity * 100}%, #ffffff)`;
        },
        
        borderRadius: 'max(12px, 1rem)',
        border: () => {
          const accent = getState('theme.accentColor', '#4c51bf');
          const isDark = getState('theme.mode') === 'dark';
          return `1px solid color-mix(in srgb, ${accent} ${isDark ? 15 : 25}%, transparent)`;
        },
        
        // Modern shadows
        boxShadow: () => {
          const isDark = getState('theme.mode') === 'dark';
          return isDark
            ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
            : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        },
        
        // Container queries for responsive layout
        '@container (min-width: 600px)': {
          padding: '3rem',
          
          // Two-column layout for wide forms
          '& .form-row': {
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '2rem'
          }
        }
      },
      
      children: [
        // Form title
        {
          h2: {
            style: {
              fontSize: 'clamp(1.5rem, 4cqw, 2rem)',
              fontWeight: '700',
              marginBottom: '2rem',
              textAlign: 'center',
              
              // Reactive theming
              color: () => getState('theme.headingColor', '#1a202c')
            },
            text: 'Contact Form'
          }
        },
        
        // Form fields
        ...fields.map(field => ({
          div: {
            className: field.width === 'half' ? 'form-row' : '',
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            },
            children: [
              // Label
              {
                label: {
                  htmlFor: field.name,
                  style: {
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    
                    // Reactive label color
                    color: () => getState('theme.labelColor', '#374151')
                  },
                  text: field.label
                }
              },
              
              // Input field
              {
                input: {
                  id: field.name,
                  name: field.name,
                  type: field.type || 'text',
                  required: field.required,
                  placeholder: field.placeholder,
                  
                  style: {
                    // Typography
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    
                    // Spacing
                    padding: 'clamp(0.75rem, 2cqw, 1rem)',
                    
                    // Modern input styling
                    border: () => {
                      const accent = getState('theme.accentColor', '#4c51bf');
                      const isDark = getState('theme.mode') === 'dark';
                      return `2px solid color-mix(in srgb, ${accent} ${isDark ? 20 : 30}%, transparent)`;
                    },
                    borderRadius: '0.5rem',
                    
                    // Background with theme awareness
                    background: () => {
                      const isDark = getState('theme.mode') === 'dark';
                      return isDark ? '#2d3748' : '#ffffff';
                    },
                    
                    // Text color
                    color: () => getState('theme.inputTextColor', '#1a202c'),
                    
                    // Modern transitions
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    
                    // Focus states
                    '&:focus': {
                      outline: 'none',
                      borderColor: () => getState('theme.accentColor', '#4c51bf'),
                      boxShadow: () => {
                        const accent = getState('theme.accentColor', '#4c51bf');
                        return `0 0 0 3px color-mix(in srgb, ${accent} 25%, transparent)`;
                      },
                      transform: 'translateY(-1px)'
                    },
                    
                    // Error states (reactive)
                    ...(field.error && {
                      borderColor: () => getState('theme.errorColor', '#ef4444'),
                      '&:focus': {
                        boxShadow: () => {
                          const error = getState('theme.errorColor', '#ef4444');
                          return `0 0 0 3px color-mix(in srgb, ${error} 25%, transparent)`;
                        }
                      }
                    }),
                    
                    // Placeholder styling
                    '&::placeholder': {
                      color: () => {
                        const text = getState('theme.textColor', '#6b7280');
                        return `color-mix(in srgb, ${text} 60%, transparent)`;
                      }
                    }
                  }
                }
              },
              
              // Error message
              field.error && {
                span: {
                  style: {
                    fontSize: '0.875rem',
                    color: () => getState('theme.errorColor', '#ef4444'),
                    marginTop: '0.25rem'
                  },
                  text: field.error
                }
              }
            ].filter(Boolean)
          }
        })),
        
        // Submit button
        {
          button: {
            type: 'submit',
            style: {
              // Layout
              alignSelf: 'stretch',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              
              // Spacing
              padding: 'clamp(1rem, 3cqw, 1.25rem) clamp(2rem, 6cqw, 3rem)',
              marginTop: '1rem',
              
              // Typography
              fontSize: 'clamp(1rem, 2.5cqw, 1.125rem)',
              fontWeight: '600',
              fontFamily: 'inherit',
              
              // Modern button styling
              background: () => {
                const accent = getState('theme.accentColor', '#4c51bf');
                const isLoading = getState('form.isSubmitting', false);
                
                if (isLoading) {
                  return `color-mix(in srgb, ${accent} 60%, transparent)`;
                }
                
                return `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 80%, #764ba2))`;
              },
              
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              cursor: () => getState('form.isSubmitting', false) ? 'not-allowed' : 'pointer',
              
              // Modern transitions
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              
              // Hover states
              '&:hover:not(:disabled)': {
                transform: 'translateY(-2px)',
                boxShadow: () => {
                  const accent = getState('theme.accentColor', '#4c51bf');
                  return `0 8px 25px color-mix(in srgb, ${accent} 30%, transparent)`;
                }
              },
              
              // Active states
              '&:active': {
                transform: 'translateY(0)'
              },
              
              // Disabled state
              '&:disabled': {
                opacity: 0.6,
                cursor: 'not-allowed',
                transform: 'none'
              }
            },
            
            disabled: () => getState('form.isSubmitting', false),
            
            children: [
              // Loading spinner
              () => getState('form.isSubmitting', false) && {
                span: {
                  style: {
                    display: 'inline-block',
                    width: '1rem',
                    height: '1rem',
                    border: '2px solid transparent',
                    borderTop: '2px solid currentColor',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }
                }
              },
              
              // Button text
              {
                span: {
                  text: () => getState('form.isSubmitting', false) ? 'Submitting...' : 'Submit'
                }
              }
            ].filter(Boolean)
          }
        }
      ]
    }
  };
}
```
