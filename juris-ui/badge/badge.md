# Juris Badge Component

A flexible, interactive badge component built for the Juris framework with full Object VDOM support.

## Features

🎨 **9 Color Variants** - Complete color palette for any use case  
📏 **5 Size Options** - From extra small to extra large  
⚡ **Interactive** - Clickable, closable, and animated badges  
🎯 **Icon Support** - Emoji or Object VDOM icons  
🔲 **Customizable** - Border radius, outline styles, and more  
📦 **Object VDOM** - Full support for complex nested content  

## Quick Start

```javascript
// Basic badge
{Badge: {text: 'Hello'}}

// Styled badge
{Badge: {
  variant: 'primary',
  size: 'lg',
  text: 'Primary Badge'
}}

// Interactive badge
{Badge: {
  variant: 'success',
  icon: '✅',
  text: 'Verified',
  onClick: () => alert('Clicked!')
}}

// Complex content
{Badge: {
  variant: 'warning',
  children: [
    {span: {text: 'Progress: '}},
    {strong: {text: '75%'}}
  ]
}}
```

## Props

| Prop | Type | Default | Options |
|------|------|---------|---------|
| `variant` | `string` | `'default'` | `default`, `primary`, `secondary`, `success`, `warning`, `danger`, `info`, `dark`, `light` |
| `size` | `string` | `'md'` | `xs`, `sm`, `md`, `lg`, `xl` |
| `text` | `string` | `''` | Any text content |
| `children` | `array/object` | `null` | Object VDOM content |
| `icon` | `string/object` | `null` | Emoji string or Object VDOM |
| `closable` | `boolean` | `false` | Show close button |
| `pulse` | `boolean` | `false` | Pulsing animation |
| `outline` | `boolean` | `false` | Outline style |
| `rounded` | `string` | `'default'` | `none`, `sm`, `default`, `md`, `lg`, `xl`, `full` |
| `onClick` | `function` | `null` | Click handler |
| `onClose` | `function` | `null` | Close handler |

## Variants

```javascript
// Color variants
{Badge: {variant: 'primary', text: 'Primary'}}
{Badge: {variant: 'success', text: 'Success'}}
{Badge: {variant: 'warning', text: 'Warning'}}
{Badge: {variant: 'danger', text: 'Danger'}}
```

## Sizes

```javascript
{Badge: {size: 'xs', text: 'Extra Small'}}
{Badge: {size: 'sm', text: 'Small'}}
{Badge: {size: 'md', text: 'Medium'}}
{Badge: {size: 'lg', text: 'Large'}}
{Badge: {size: 'xl', text: 'Extra Large'}}
```

## Interactive Features

```javascript
// Clickable
{Badge: {
  variant: 'primary',
  text: 'Click Me',
  onClick: () => console.log('Clicked!')
}}

// Closable
{Badge: {
  variant: 'warning',
  text: 'Dismissible',
  closable: true,
  onClose: () => console.log('Closed!')
}}

// Pulsing animation
{Badge: {
  variant: 'danger',
  text: 'Live',
  pulse: true
}}

// Outline style
{Badge: {
  variant: 'info',
  text: 'Outline',
  outline: true
}}
```

## Object VDOM Content

```javascript
// Complex nested content
{Badge: {
  variant: 'success',
  children: {div: {
    style: {display: 'flex', alignItems: 'center', gap: '4px'},
    children: [
      {div: {
        style: {
          width: '8px',
          height: '8px',
          backgroundColor: '#10b981',
          borderRadius: '50%'
        }
      }},
      {span: {text: 'Online'}}
    ]
  }}
}}

// Mixed content
{Badge: {
  variant: 'primary',
  children: [
    {span: {text: '🎯 '}},
    {strong: {text: 'Important'}},
    {span: {text: ' Message'}}
  ]
}}
```

## Real-World Examples

### User Profile
```javascript
{div: {
  children: [
    {span: {text: 'John Doe'}},
    {Badge: {variant: 'success', size: 'xs', icon: '✅', text: 'Verified'}},
    {Badge: {variant: 'warning', size: 'xs', text: 'Pro'}}
  ]
}}
```

### Notification
```javascript
{div: {
  children: [
    {Badge: {variant: 'danger', pulse: true, text: 'URGENT'}},
    {span: {text: 'System maintenance required'}}
  ]
}}
```

### Product Tags
```javascript
{div: {
  children: [
    {Badge: {variant: 'success', icon: '🚚', text: 'Free Shipping'}},
    {Badge: {variant: 'danger', text: '50% OFF'}},
    {Badge: {variant: 'info', text: 'Best Seller'}}
  ]
}}
```

## Component Registration

```javascript
const juris = new Juris({
  components: {Badge, YourApp},
  layout: {YourApp: {}}
});

juris.render('#app');
```

## Styling

The component includes:
- **Smooth transitions** on all interactive states
- **Hover effects** for clickable badges
- **Focus management** for accessibility
- **Responsive design** that adapts to container
- **Custom CSS classes** support via `className` prop

## Browser Support

- Modern browsers with ES6 support
- Requires Juris framework (latest version)

## Notes

- All props are optional with sensible defaults
- Object VDOM content takes precedence over `text` prop
- Event handlers receive standard DOM events
- Custom styles merge with component defaults
- Supports nested badges and complex layouts