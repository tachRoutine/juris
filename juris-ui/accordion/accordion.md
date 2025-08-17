# Juris Accordion Component - Enhanced Object VDOM

A powerful, reactive accordion component built for the Juris framework with **full Object VDOM support** for maximum control and flexibility.

## Features

✨ **Single & Multiple Mode** - Open one or many panels  
🎨 **Smooth Animations** - CSS transitions for expand/collapse  
⚡ **Reactive State** - Automatic updates with Juris state management  
🎯 **Full Object VDOM Support** - Complete control over header and content rendering  
📦 **Flexible Content** - Support complex layouts, components, and styling  
📱 **Responsive** - Works on all screen sizes  

## Enhanced Object VDOM Support

The accordion now accepts **full Object VDOM structures** for both headers and content, giving you complete control over styling, layout, and interactivity.

### Simple Text (Legacy Support)
```javascript
{
  header: {text: 'Simple Header'},
  content: {text: 'Simple content'}
}
```

### Full Object VDOM Control
```javascript
{
  header: {div: {
    children: [
      {span: {text: '🚀 Advanced Header', style: {fontWeight: 'bold'}}},
      {span: {text: 'NEW', style: {
        background: '#3b82f6', 
        color: 'white', 
        padding: '2px 6px', 
        borderRadius: '4px',
        fontSize: '10px'
      }}}
    ],
    style: {display: 'flex', alignItems: 'center', gap: '8px'}
  }},
  content: {div: {
    children: [
      {h4: {text: 'Rich Content Example'}},
      {p: {text: 'This content can contain any Object VDOM structure!'}},
      {ul: {
        children: [
          {li: {text: 'Nested lists'}},
          {li: {text: 'Custom styling'}},
          {li: {text: 'Interactive elements'}}
        ]
      }},
      {button: {
        text: 'Interactive Button',
        onClick: () => alert('Full control!'),
        style: {background: '#10b981', color: 'white', padding: '8px 16px'}
      }}
    ]
  }}
}
```

## Quick Start

```html
<script src="https://unpkg.com/juris@latest/juris.js"></script>
<script>
  {Accordion: {
    mode: 'single',
    initialOpen: [0],
    items: [
      {
        header: {div: {
          text: '📋 Rich Header Example',
          style: {fontWeight: 'bold', color: '#3b82f6'}
        }},
        content: {div: {
          children: [
            {p: {text: 'This is a paragraph with custom styling.'}},
            {code: {
              text: 'const example = "Object VDOM Power!";',
              style: {
                background: '#f3f4f6',
                padding: '8px',
                borderRadius: '4px',
                fontFamily: 'monospace'
              }
            }}
          ]
        }}
      }
    ]
  }}
</script>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `mode` | `string` | `'single'` | `'single'` or `'multiple'` - controls how many panels can be open |
| `initialOpen` | `array` | `[]` | Array of panel indices to open initially (e.g., `[0, 2]`) |
| `items` | `array` | `[]` | Array of accordion items with `header` and `content` Object VDOM |

## Enhanced Item Structure

### Header Object VDOM
Headers can be any valid Object VDOM structure:
```javascript
// Simple div with text
header: {div: {text: 'My Header', style: {color: 'blue'}}}

// Complex header with multiple elements
header: {div: {
  children: [
    {h3: {text: 'Title', style: {margin: 0}}},
    {span: {text: 'Badge', style: {background: 'red', color: 'white'}}}
  ],
  style: {display: 'flex', justifyContent: 'space-between'}
}}

// Interactive header elements
header: {button: {
  text: 'Clickable Header',
  style: {background: 'none', border: 'none', fontSize: '16px'}
}}
```

### Content Object VDOM
Content supports any Object VDOM structure:
```javascript
// Rich content with multiple elements
content: {div: {
  children: [
    {h4: {text: 'Section Title'}},
    {p: {text: 'Description text with styling.'}},
    {div: {
      style: {display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'},
      children: [
        {div: {text: 'Column 1', style: {background: '#f0f0f0', padding: '8px'}}},
        {div: {text: 'Column 2', style: {background: '#e0e0e0', padding: '8px'}}}
      ]
    }},
    {button: {
      text: 'Action Button',
      onClick: () => console.log('Button clicked!'),
      style: {background: '#3b82f6', color: 'white', padding: '8px 16px'}
    }}
  ]
}}
```

## Advanced Examples

### Rich Media Accordion
```javascript
{Accordion: {
  mode: 'single',
  items: [
    {
      header: {div: {
        children: [
          {img: {src: 'icon.svg', style: {width: '20px', height: '20px'}}},
          {span: {text: 'Media Section', style: {marginLeft: '8px', fontWeight: 'bold'}}}
        ],
        style: {display: 'flex', alignItems: 'center'}
      }},
      content: {div: {
        children: [
          {video: {
            src: 'demo.mp4',
            controls: true,
            style: {width: '100%', borderRadius: '8px'}
          }},
          {p: {text: 'Video description here...'}}
        ]
      }}
    }
  ]
}}
```

### Interactive Dashboard Panel
```javascript
{Accordion: {
  mode: 'multiple',
  items: [
    {
      header: {div: {
        children: [
          {h3: {text: 'Analytics Dashboard', style: {margin: 0, color: '#1f2937'}}},
          {div: {
            text: 'LIVE',
            style: {
              background: '#10b981',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '10px',
              fontWeight: 'bold'
            }
          }}
        ],
        style: {display: 'flex', justifyContent: 'space-between', alignItems: 'center'}
      }},
      content: {div: {
        children: [
          {div: {
            style: {
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              marginBottom: '16px'
            },
            children: [
              {div: {
                children: [
                  {h4: {text: 'Users', style: {margin: '0 0 4px 0', color: '#6b7280'}}},
                  {div: {text: '1,234', style: {fontSize: '24px', fontWeight: 'bold', color: '#3b82f6'}}}
                ],
                style: {background: '#f9fafb', padding: '12px', borderRadius: '8px'}
              }},
              {div: {
                children: [
                  {h4: {text: 'Revenue', style: {margin: '0 0 4px 0', color: '#6b7280'}}},
                  {div: {text: '$5,678', style: {fontSize: '24px', fontWeight: 'bold', color: '#10b981'}}}
                ],
                style: {background: '#f9fafb', padding: '12px', borderRadius: '8px'}
              }},
              {div: {
                children: [
                  {h4: {text: 'Growth', style: {margin: '0 0 4px 0', color: '#6b7280'}}},
                  {div: {text: '+12%', style: {fontSize: '24px', fontWeight: 'bold', color: '#f59e0b'}}}
                ],
                style: {background: '#f9fafb', padding: '12px', borderRadius: '8px'}
              }}
            ]
          }},
          {button: {
            text: 'View Full Dashboard',
            onClick: () => window.open('/dashboard', '_blank'),
            style: {
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }
          }}
        ]
      }}
    }
  ]
}}
```

## Auto-Enhancement Features

- **Style Merging**: User styles automatically merge with base accordion styles
- **Click Handling**: Click handlers are automatically added to headers while preserving user interactions
- **Arrow Indicators**: Automatically added to headers (can be overridden)
- **Responsive Design**: Content adapts to container width automatically
- **Accessibility**: Proper ARIA attributes and keyboard navigation support

## Migration from Simple Structure

**Old Simple Structure:**
```javascript
{
  header: {text: 'Simple Header'},
  content: {text: 'Simple content'}
}
```

**New Enhanced Structure:**
```javascript
{
  header: {div: {
    text: 'Enhanced Header',
    style: {fontWeight: 'bold', color: '#3b82f6'}
  }},
  content: {div: {
    children: [
      {p: {text: 'Rich content with multiple elements'}},
      {button: {text: 'Interactive Elements'}}
    ]
  }}
}
```

## Component Code

The enhanced accordion component supports both legacy simple structures and full Object VDOM for maximum flexibility while maintaining backward compatibility.

## Component Code

```javascript
const Accordion = (props, {newState}) => {
  const {mode = 'single', initialOpen = [], children = [], items = children} = props;
  const [getOpenItems, setOpenItems] = newState('openItems', initialOpen);
  
  const toggleItem = (itemId) => {
    const openItems = getOpenItems();
    if (mode === 'single') {
      const newOpen = openItems.includes(itemId) ? [] : [itemId];
      setOpenItems(newOpen);
    } else {
      const newOpen = openItems.includes(itemId) 
        ? openItems.filter(id => id !== itemId)
        : [...openItems, itemId];
      setOpenItems(newOpen);
    }
  };

  return {
    div: {
      class: 'accordion',
      style: {
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      },
      children: items.map((item, index) => ({
        div: {
          class: 'accordion-item',
          key: `item-${index}`,
          children: [
            // Header
            {div: {
              class: 'accordion-header',
              style: () => {
                const isOpen = getOpenItems().includes(index);
                return {
                  backgroundColor: isOpen ? '#3b82f6' : '#f8fafc',
                  color: isOpen ? 'white' : '#374151',
                  padding: '16px 20px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s ease',
                  userSelect: 'none',
                  borderBottom: isOpen ? 'none' : '1px solid #e2e8f0'
                };
              },
              onClick: () => toggleItem(index),
              children: [
                {div: {
                  text: item.header?.text || (typeof item.header === 'string' ? item.header : 'Item'),
                  style: {fontWeight: '600'}
                }},
                {div: {
                  text: '▼',
                  style: () => ({
                    transition: 'transform 0.3s ease',
                    transform: getOpenItems().includes(index) ? 'rotate(180deg)' : 'rotate(0deg)',
                    fontSize: '12px'
                  })
                }}
              ]
            }},
            // Content
            {div: {
              class: 'accordion-content',
              style: () => {
                const isOpen = getOpenItems().includes(index);
                return {
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease, padding 0.3s ease',
                  maxHeight: isOpen ? '500px' : '0',
                  padding: isOpen ? '20px' : '0 20px',
                  backgroundColor: '#fafafa'
                };
              },
              children: [{div: {
                text: item.content?.text || (typeof item.content === 'string' ? item.content : 'Content'),
                style: {
                  color: '#64748b',
                  lineHeight: '1.6',
                  fontSize: '14px'
                }
              }}]
            }}
          ]
        }
      }))
    }
  };
};
```

## Registration

```javascript
const juris = new Juris({
  components: {Accordion, YourApp},
  layout: {YourApp: {}}
});

juris.render('#app');
```

## Requirements

- Juris framework (latest version)
- Modern browser with ES6 support

## Notes

- Uses Juris's `newState` for component-local reactive state
- Follows Juris Object VDOM patterns
- Automatically handles dependency tracking for reactive updates
- Compatible with Juris's fine-grained and batch rendering modes