# Juris Alert Component

A flexible, accessible alert component built for the Juris framework with full Object VDOM support and interactive features.

## Features

🎨 **6 Color Variants** - Info, success, warning, danger, primary, secondary  
📏 **3 Size Options** - Small, medium, and large with proper scaling  
⚡ **Interactive** - Closable alerts with custom actions  
🎯 **Icon Support** - Default icons, custom emojis, or Object VDOM icons  
🔧 **Customizable** - Borders, shadows, radius, and styling options  
📦 **Object VDOM** - Full support for rich, complex content  
♿ **Accessible** - ARIA attributes and semantic markup  

## Quick Start

```javascript
// Basic alert
{Alert: {
  variant: 'info',
  title: 'Information',
  message: 'This is an informational message.'
}}

// Rich content alert
{Alert: {
  variant: 'success',
  title: 'Upload Complete',
  children: [
    {p: {text: 'Your file has been uploaded successfully.'}},
    {button: {text: 'View File', onClick: () => console.log('View')}}
  ]
}}

// Interactive alert with actions
{Alert: {
  variant: 'warning',
  title: 'Confirm Action',
  message: 'Are you sure you want to proceed?',
  closable: true,
  actions: [
    {button: {text: 'Confirm', onClick: () => console.log('Confirmed')}},
    {button: {text: 'Cancel', onClick: () => console.log('Cancelled')}}
  ]
}}
```

## Props

| Prop | Type | Default | Options |
|------|------|---------|---------|
| `variant` | `string` | `'info'` | `info`, `success`, `warning`, `danger`, `primary`, `secondary` |
| `size` | `string` | `'md'` | `sm`, `md`, `lg` |
| `title` | `string` | `''` | Alert title text |
| `message` | `string` | `''` | Alert message text |
| `children` | `array/object` | `null` | Object VDOM content |
| `icon` | `string/object/boolean` | `null` | Custom icon (string emoji, Object VDOM, or `false` to hide) |
| `closable` | `boolean` | `false` | Show close button |
| `dismissible` | `boolean` | `false` | Alias for closable |
| `border` | `boolean` | `true` | Show border |
| `shadow` | `boolean` | `true` | Show shadow |
| `rounded` | `string` | `'default'` | `none`, `sm`, `default`, `md`, `lg`, `xl` |
| `actions` | `array/object` | `null` | Action buttons |
| `onClose` | `function` | `null` | Close handler |
| `onDismiss` | `function` | `null` | Dismiss handler |

## Variants

```javascript
// All available variants
{Alert: {variant: 'info', title: 'Info', message: 'Information message'}}
{Alert: {variant: 'success', title: 'Success', message: 'Success message'}}
{Alert: {variant: 'warning', title: 'Warning', message: 'Warning message'}}
{Alert: {variant: 'danger', title: 'Error', message: 'Error message'}}
{Alert: {variant: 'primary', title: 'Primary', message: 'Primary message'}}
{Alert: {variant: 'secondary', title: 'Secondary', message: 'Secondary message'}}
```

## Sizes

```javascript
{Alert: {size: 'sm', title: 'Small', message: 'Compact alert'}}
{Alert: {size: 'md', title: 'Medium', message: 'Standard alert'}}
{Alert: {size: 'lg', title: 'Large', message: 'Spacious alert'}}
```

## Icons

```javascript
// Default variant icon (automatic)
{Alert: {variant: 'success', title: 'Default Icon'}}

// Custom emoji icon
{Alert: {variant: 'info', icon: '🎉', title: 'Custom Emoji'}}

// Object VDOM icon
{Alert: {
  variant: 'warning',
  icon: {div: {
    style: {
      width: '20px',
      height: '20px',
      borderRadius: '50%',
      backgroundColor: '#f59e0b',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: 'bold'
    },
    text: '!'
  }},
  title: 'Custom VDOM Icon'
}}

// No icon
{Alert: {variant: 'info', icon: false, title: 'No Icon'}}
```

## Interactive Features

```javascript
// Closable alert
{Alert: {
  variant: 'warning',
  title: 'Dismissible',
  message: 'Click × to close',
  closable: true,
  onClose: () => console.log('Alert closed')
}}

// Alert with action buttons
{Alert: {
  variant: 'info',
  title: 'Update Available',
  message: 'A new version is ready to install',
  actions: [
    {button: {
      text: 'Update Now',
      style: {background: '#3b82f6', color: 'white', padding: '6px 12px'},
      onClick: () => console.log('Update clicked')
    }},
    {button: {
      text: 'Later',
      style: {background: 'transparent', border: '1px solid #ccc', padding: '6px 12px'},
      onClick: () => console.log('Later clicked')
    }}
  ]
}}
```

## Object VDOM Content

```javascript
// Rich content with lists and links
{Alert: {
  variant: 'info',
  title: 'Rich Content',
  children: [
    {p: {text: 'This alert contains:'}},
    {ul: {
      children: [
        {li: {text: 'Formatted text'}},
        {li: {text: 'Nested elements'}},
        {li: {text: 'Interactive components'}}
      ]
    }},
    {p: {
      children: [
        {span: {text: 'Learn more in our '}},
        {a: {
          text: 'documentation',
          href: '/docs',
          style: {color: '#3b82f6', textDecoration: 'underline'}
        }}
      ]
    }}
  ]
}}

// Progress indicator
{Alert: {
  variant: 'success',
  title: 'Upload Progress',
  children: {div: {
    children: [
      {div: {
        style: {display: 'flex', justifyContent: 'space-between', marginBottom: '8px'},
        children: [
          {span: {text: 'Uploading...'}},
          {span: {text: '75%', style: {fontWeight: 'bold'}}}
        ]
      }},
      {div: {
        style: {
          width: '100%',
          height: '8px',
          backgroundColor: '#e5e7eb',
          borderRadius: '4px',
          overflow: 'hidden'
        },
        children: [{div: {
          style: {
            width: '75%',
            height: '100%',
            backgroundColor: '#10b981',
            transition: 'width 0.3s ease'
          }
        }}]
      }}
    ]
  }}
}}
```

## Styling Options

```javascript
// No border
{Alert: {variant: 'info', title: 'Clean', border: false}}

// No shadow
{Alert: {variant: 'success', title: 'Flat', shadow: false}}

// Large border radius
{Alert: {variant: 'warning', title: 'Rounded', rounded: 'lg'}}

// Custom styles
{Alert: {
  variant: 'danger',
  title: 'Custom',
  style: {
    background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
    borderLeft: '4px solid #dc2626'
  }
}}
```

## Real-World Examples

### Form Validation
```javascript
{Alert: {
  variant: 'danger',
  title: 'Form Validation Error',
  closable: true,
  children: [
    {p: {text: 'Please correct the following errors:'}},
    {ul: {
      children: [
        {li: {text: 'Email address is required'}},
        {li: {text: 'Password must be at least 8 characters'}}
      ]
    }}
  ]
}}
```

### System Notification
```javascript
{Alert: {
  variant: 'info',
  title: 'System Maintenance',
  icon: '🔧',
  children: [
    {p: {text: 'Scheduled maintenance tonight from 2:00 AM to 4:00 AM EST.'}},
    {div: {
      style: {background: '#f0f9ff', padding: '8px', borderRadius: '4px'},
      children: [
        {strong: {text: 'Impact: '}},
        {span: {text: 'Some features may be temporarily unavailable.'}}
      ]
    }}
  ],
  actions: [{button: {
    text: 'Learn More',
    onClick: () => window.open('/maintenance', '_blank')
  }}]
}}
```

### Success with Details
```javascript
{Alert: {
  variant: 'success',
  title: 'File Upload Complete',
  icon: '📁',
  children: [
    {div: {
      style: {display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px'},
      children: [
        {div: {
          children: [
            {p: {text: 'document.pdf (2.4 MB)', style: {fontWeight: '500'}}},
            {p: {text: 'Uploaded to /uploads/documents/', style: {fontSize: '0.875rem'}}}
          ]
        }},
        {div: {
          children: [
            {span: {text: '✓', style: {fontSize: '1.25rem', color: '#059669'}}},
            {span: {text: '100%', style: {fontWeight: 'bold'}}}
          ]
        }}
      ]
    }}
  ],
  actions: [
    {button: {text: 'View File', onClick: () => console.log('View')}},
    {button: {text: 'Share', onClick: () => console.log('Share')}}
  ]
}}
```

## Accessibility

The Alert component includes:
- **ARIA attributes** - `role="alert"` and `aria-live` regions
- **Semantic markup** - Proper heading and content structure
- **Keyboard navigation** - Focus management for interactive elements
- **Screen reader support** - Descriptive text and announcements
- **Color contrast** - WCAG compliant color combinations

## Component Registration

```javascript
const juris = new Juris({
  components: {Alert, YourApp},
  layout: {YourApp: {}}
});

juris.render('#app');
```

## Browser Support

- Modern browsers with ES6 support
- Requires Juris framework (latest version)

## Notes

- All props are optional with sensible defaults
- Object VDOM content takes precedence over `message` prop
- Event handlers receive standard DOM events
- Custom styles merge with component defaults
- Automatically manages ARIA live regions for accessibility
- Supports nested alerts and complex layouts