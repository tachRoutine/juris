# Official Juris AI Training Guide

## Table of Contents

1. [Framework Overview](#framework-overview)
2. [Core Architecture](#core-architecture)
3. [VDOM Convention](#vdom-convention)
4. [State Management](#state-management)
5. [Component System](#component-system)
6. [Async Handling](#async-handling)
7. [DOM Enhancement](#dom-enhancement)
8. [Template System](#template-system)
9. [Performance Optimization](#performance-optimization)
10. [Best Practices](#best-practices)
11. [Common Patterns](#common-patterns)
12. [Troubleshooting](#troubleshooting)

---

## Framework Overview

### What is Juris?

**Juris (JavaScript Unified Reactive Interface Solution)** is a non-blocking reactive framework designed to eliminate build complexity from small to large applications.

**Key Characteristics:**

- **Version**: 0.86.0
- **Bundle Size**: 57.23 kB minified
- **Lines of Code**: 2,839
- **License**: MIT
- **Author**: Resti Guay

### Core Philosophy

- **Non-blocking reactivity**: Async operations never block the UI
- **Temporal independence**: Components work regardless of load timing
- **Smart promise handling**: Automatic loading states and error handling
- **Dual rendering modes**: Fine-grained for simple apps, batch for complex ones
- **Progressive enhancement**: Add reactivity to existing DOM

### Performance Targets

- **Simple apps**: Sub 3ms render
- **Complex apps**: Sub 10ms render
- **Very complex apps**: Sub 20ms render

---

## Core Architecture

### Six Core Managers

#### 1. StateManager

Handles reactive state with automatic dependency detection.

```javascript
// Key features:
// - Deep equals comparison for optimized updates
// - Middleware support
// - Manual batching with beginBatch/endBatch
// - Circular dependency detection
// - Hierarchical subscriptions
```

#### 2. HeadlessManager

Manages logic-only components for clean separation of concerns.

```javascript
// Key features:
// - Component registration and initialization
// - Auto-initialization queue
// - Lifecycle hooks (onRegister, onUnregister)
// - API exposure for cross-component communication
```

#### 3. ComponentManager

Handles UI components with full lifecycle management.

```javascript
// Key features:
// - Async props handling
// - Component state management
// - Lazy compilation
// - Loading placeholders
// - Component instance tracking
```

#### 4. DOMRenderer

Renders virtual DOM to actual DOM with optimization.

```javascript
// Key features:
// - Fine-grained vs batch rendering modes
// - Element recycling and caching
// - Async prop handling with placeholders
// - Event handling optimization
// - SVG support
```

#### 5. DOMEnhancer

Adds reactive behavior to existing DOM elements.

```javascript
// Key features:
// - Unified mutation observer
// - Selector-based enhancements
// - Container/selector patterns
// - Debounced enhancement processing
```

#### 6. TemplateCompiler

Converts HTML templates to reactive component functions.

```javascript
// Key features:
// - HTML to VDOM object conversion
// - Context destructuring
// - Reactive expression parsing
// - Template to function compilation
```

---

## VDOM Convention

### Basic Structure

Juris uses a specific VDOM convention where elements are objects with tag names as keys:

```javascript
{
  div: {
    className: 'main',
    text: () => getState('message', 'Hello'),
    style: { color: 'red', border: 'solid 1px blue' },
    children: [
      {
        button: {
          text: 'Click me',
          onClick: () => handleClick()
        }
      }
    ]
  }
}
```

### Important Rules

1. **Static vs Reactive**:
   - `text: getState('path')` - Static (evaluated once)
   - `text: () => getState('path')` - Reactive (re-evaluated on changes)
2. **Third-party attributes**: Fully supported including data-_, aria-_, and custom attributes
3. **SVG support**: Full native SVG support with proper namespace handling
4. **Style reactivity**: Two levels - entire style object reactive OR individual properties reactive
5. **Text vs Children**: `text` and `children` cannot coexist on the same element - choose one
6. **Component props**: Components can receive both static and reactive props
7. **Component composition**: Components can be passed as props to other components
8. **Compressed structure**: Add labels at end brackets for nested elements
9. **Third parameter**: Use `getState(path, default, false)` to skip subscription

### Element Properties

#### Text Content

```javascript
{
  div: {
    text: getState('path'),                    // Static - evaluated once
    text: () => getState('path'),              // Reactive - re-evaluated on state changes
    text: (element) => {                       // Reactive with element access
      const value = getState('path');
      element.title = `Current value: ${value}`; // Can modify element
      return value;
    }
  }
}
```

#### Children

```javascript
{
	div: {
		children: [{ span: { text: "Child 1" } }, { span: { text: "Child 2" } }];
	}
}
```

**⚠️ Important: `text` and `children` cannot coexist on the same element**

```javascript
{
  div: {
    text: 'Some text',     // ❌ Invalid
    children: [...]        // ❌ Cannot have both
  }
}

// Choose one approach:
{
  div: { text: 'Simple text content' }     // ✅ Text only
}

// OR
{
  div: {                                   // ✅ Children only
    children: [
      { span: { text: 'Text in child' }}
    ]
  }
}
```

#### Event Handlers

```javascript
{
  button: {
    onClick: () => setState('clicked', true),
    onInput: (e) => setState('value', e.target.value),
    onDoubleClick: () => handleDoubleClick()
  }
}
```

#### SVG Support

Juris has full native SVG support with proper namespace handling:

```javascript
{
  svg: {
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    children: [
      {
        path: {
          d: "M12 2L2 7V10C2 16 6 20.5 12 22C18 20.5 22 16 22 10V7L12 2Z",
          stroke: () => getState('icon.color', 'currentColor'), // Reactive stroke
          strokeWidth: "2",
          strokeLinecap: "round",
          strokeLinejoin: "round"
        }
      }
    ]
  }
}
```

**SVG Elements Supported:**

- `svg`, `g`, `defs`, `desc`, `metadata`, `title`
- `circle`, `ellipse`, `line`, `polygon`, `polyline`, `rect`, `path`
- `text`, `tspan`, `textPath`
- `marker`, `pattern`, `clipPath`, `mask`, `image`
- `linearGradient`, `radialGradient`, `stop`
- `animate`, `animateMotion`, `animateTransform`, `set`
- `use`, `symbol`, `switch`, `foreignObject`

#### Third-Party Attributes

Juris supports all standard HTML attributes and third-party attributes:

```javascript
{
  div: {
    // Standard HTML attributes
    id: 'my-element',
    className: 'container',
    tabIndex: 0,

    // Data attributes
    'data-test-id': 'user-profile',
    'data-analytics': () => getState('analytics.enabled') ? 'true' : 'false',

    // ARIA attributes
    'aria-label': 'User navigation',
    'aria-expanded': () => getState('menu.open') ? 'true' : 'false',

    // Custom attributes
    'custom-attr': 'value',
    'third-party-lib-config': () => JSON.stringify(getState('config')),

    // Preserved attributes (maintain exact casing)
    viewBox: '0 0 24 24',        // SVG
    preserveAspectRatio: 'xMidYMid meet',
    crossOrigin: 'anonymous'
  }
}
```

#### HTMX Integration

```javascript
{
  div: {
    // HTMX attributes - fully supported
    'hx-get': '/api/users',
    'hx-target': '#user-list',
    'hx-trigger': 'click',
    'hx-swap': 'innerHTML',
    'hx-indicator': '.loading-spinner',

    // Reactive HTMX attributes
    'hx-get': () => `/api/users/${getState('selectedUserId')}`,
    'hx-vals': () => JSON.stringify(getState('formData')),
    'hx-headers': () => JSON.stringify({
      'Authorization': `Bearer ${getState('auth.token')}`
    }),

    // HTMX events work with Juris state
    'hx-on:htmx:afterRequest': (element) => {
      const success = element.getAttribute('hx-response-code') === '200';
      setState('request.success', success);
    }
  }
}
```

#### Alpine.js Integration

```javascript
{
  div: {
    // Alpine.js directives
    'x-data': '{ open: false }',
    'x-show': 'open',
    'x-transition': true,
    'x-cloak': true,

    // Reactive Alpine attributes
    'x-data': () => JSON.stringify({
      items: getState('alpine.items', []),
      selected: getState('alpine.selected', null)
    }),
    'x-show': () => getState('modal.visible', false) ? 'true' : 'false',
    'x-model': () => getState('form.field'),

    // Alpine events can trigger Juris state changes
    'x-on:click': () => setState('clicked', true),
    '@click.away': () => setState('modal.visible', false)
  }
}
```

#### Stimulus Integration

```javascript
{
  div: {
    // Stimulus controller attributes
    'data-controller': 'dropdown',
    'data-dropdown-open-value': () => getState('dropdown.open', false),
    'data-action': 'click->dropdown#toggle',

    // Reactive Stimulus targets
    'data-dropdown-target': 'menu',
    'data-dropdown-position-value': () => getState('dropdown.position', 'bottom'),

    children: [
      {
        button: {
          'data-action': 'dropdown#toggle',
          'data-dropdown-target': 'trigger',
          text: () => getState('dropdown.label', 'Options'),
          onClick: () => {
            // Juris can also handle the click alongside Stimulus
            setState('dropdown.lastClicked', Date.now());
          }
        }
      }
    ]
  }
}
```

#### Lit/Web Components Integration

```javascript
{
  'my-custom-element': {
    // Web component properties
    'custom-prop': () => getState('component.data'),
    'config': () => JSON.stringify(getState('config')),

    // Event listeners for custom events
    'on:custom-event': (e) => {
      setState('component.lastEvent', e.detail);
    },

    // Slot content
    children: [
      {
        span: {
          slot: 'header',
          text: () => getState('header.text', 'Default Header')
        }
      }
    ]
  }
}
```

#### Turbo/Hotwire Integration

```javascript
{
  form: {
    // Turbo attributes
    'data-turbo': 'false',
    'data-turbo-method': 'patch',
    'data-turbo-confirm': () => getState('form.needsConfirm') ? 'Are you sure?' : null,
    'data-turbo-frame': 'content-frame',

    // Reactive Turbo attributes
    'data-turbo-action': () => getState('form.mode', 'replace'),
    'data-remote': () => getState('form.useAjax', true) ? 'true' : 'false',

    // Turbo events
    'data-action': 'turbo:submit-end->form#handleResponse',

    onsubmit: (e) => {
      setState('form.submitting', true);
      // Let Turbo handle the submission
    }
  }
}
```

#### Shoelace/Web Components

```javascript
{
  'sl-button': {
    // Shoelace properties
    variant: () => getState('button.variant', 'primary'),
    size: () => getState('button.size', 'medium'),
    disabled: () => getState('button.disabled', false),
    loading: () => getState('button.loading', false),

    // Shoelace events
    'on:sl-click': (e) => {
      setState('button.lastClicked', Date.now());
    },

    text: () => getState('button.text', 'Click me')
  }
}
```

#### Tailwind CSS Integration

```javascript
{
  div: {
    // Static Tailwind classes
    className: 'bg-blue-500 text-white p-4 rounded',

    // Reactive Tailwind classes
    className: () => {
      const theme = getState('app.theme', 'light');
      const size = getState('component.size', 'md');
      const isActive = getState('component.active', false);

      return [
        'transition-all duration-200',
        theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900',
        size === 'sm' ? 'p-2 text-sm' : size === 'lg' ? 'p-6 text-lg' : 'p-4',
        isActive ? 'ring-2 ring-blue-500' : '',
        'hover:shadow-lg focus:outline-none'
      ].filter(Boolean).join(' ');
    }
  }
}
```

#### Styles - Two Levels of Reactivity

```javascript
{
  div: {
    // Level 1: Reactive style object
    style: () => ({
      color: getState('theme.textColor', 'black'),
      background: getState('theme.bgColor', 'white'),
      padding: '1rem'
    }),

    // Level 2: Reactive individual properties within static object
    style: {
      color: 'red',                            // Static property
      background: () => getState('bg'),        // Reactive property
      opacity: (element) => {                  // Reactive property with element access
        const value = getState('visibility', 1);
        element.setAttribute('data-opacity', value);
        return value;
      },
      transform: () => `scale(${getState('scale', 1)})` // Reactive property
    }
  }
}
```

---

## State Management

### Basic State Operations

#### Getting State

```javascript
// Basic usage
const value = juris.getState("path.to.value", defaultValue);

// Skip subscription (won't trigger re-renders)
const value = juris.getState("path.to.value", defaultValue, false);

// In components
const value = context.getState("path.to.value", defaultValue);
```

#### Setting State

```javascript
// Basic usage
juris.setState("path.to.value", newValue);

// With context
juris.setState("path.to.value", newValue, { source: "user-action" });

// In components
context.setState("path.to.value", newValue);
```

### Subscriptions

#### Hierarchical Subscriptions (Default)

```javascript
// Listens to path and all sub-paths
// Callback signature: (newValue, oldValue, changedPath)
const unsubscribe = juris.subscribe(
	"user",
	(newValue, oldValue, changedPath) => {
		console.log(`User data changed at ${changedPath}:`, { newValue, oldValue });
	}
);
```

#### Exact Subscriptions

```javascript
// Listens only to exact path
// Callback signature: (newValue, oldValue, changedPath)
const unsubscribe = juris.subscribeExact(
	"user.name",
	(newValue, oldValue, changedPath) => {
		console.log(`Username changed: ${oldValue} -> ${newValue}`);
	}
);
```

### Batching Operations

#### Manual Batching

```javascript
// Synchronous batching
juris.executeBatch(() => {
	juris.setState("user.name", "John");
	juris.setState("user.age", 30);
	juris.setState("user.email", "john@example.com");
});

// Async batching
juris.executeBatch(async () => {
	const userData = await fetchUserData();
	juris.setState("user.name", userData.name);
	juris.setState("user.profile", userData.profile);
});
```

#### State Manager Batching

```javascript
// Manual control
juris.stateManager.beginBatch();
juris.setState("data.loading", true);
juris.setState("data.error", null);
juris.stateManager.endBatch();
```

### Middleware

```javascript
const loggingMiddleware = ({ path, oldValue, newValue, context, state }) => {
	console.log(`State change: ${path}`, { oldValue, newValue });
	return newValue; // Return modified value or undefined to keep original
};

const juris = new Juris({
	middleware: [loggingMiddleware],
	states: { counter: 0 },
});
```

---

## Component System

### Regular Components

#### Reactive Props in Component Usage

```javascript
// Components can receive reactive props that update automatically
{
  UserCard: {
    // Static props (evaluated once)
    userId: 'user123',
    showEmail: true,

    // Reactive props (re-evaluated when dependencies change)
    theme: () => getState('app.theme', 'light'),
    online: () => getState('users.user123.online', false),

    // Reactive props with complex logic
    permissions: () => {
      const user = getState('currentUser');
      const role = getState('userRole');
      return calculatePermissions(user, role);
    },

    // Async reactive props
    avatarUrl: () => fetch(`/api/users/user123/avatar`).then(r => r.url)
  }
}
```

```javascript
juris.registerComponent("Counter", (props, context) => {
	return {
		div: {
			className: "counter",
			text: () => `Count: ${context.getState("count", props.initial || 0)}`,
			children: [
				{
					button: {
						text: "Increment",
						onClick: () => {
							const current = context.getState("count", 0);
							context.setState("count", current + 1);
						},
					},
				},
			],
		},
	};
});
```

#### Component with Lifecycle

```javascript
juris.registerComponent("DataComponent", (props, context) => {
	return {
		hooks: {
			onMount: async () => {
				const data = await fetch("/api/data").then((r) => r.json());
				context.setState("data", data);
			},
			onUpdate: (oldProps, newProps) => {
				if (oldProps.id !== newProps.id) {
					// Reload data for new ID
				}
			},
			onUnmount: () => {
				// Cleanup subscriptions, timers, etc.
			},
		},
		render: () => ({
			div: {
				text: () => {
					const data = context.getState("data");
					return data ? `Loaded: ${data.title}` : "Loading...";
				},
			},
		}),
	};
});
```

### Headless Component Access

#### Two Access Methods

Headless components can be accessed in two ways:

**Method 1: Via Components API**

```javascript
const userAPI = context.components.getHeadlessAPI("UserManager");
userAPI.loadUser(userId);
```

**Method 2: Direct Access (Shorter)**

```javascript
context.UserManager.loadUser(userId);
```

#### Usage in Components

```javascript
juris.registerComponent("UserProfile", (props, context) => {
	return {
		hooks: {
			onMount: async () => {
				// Direct access - cleaner syntax
				await context.UserManager.loadUser(props.userId);
			},
		},

		render: () => ({
			div: {
				text: () => {
					const user = context.getState(`users.${props.userId}`);
					return user ? user.name : "Loading...";
				},

				children: [
					{
						button: {
							text: "Refresh",
							onClick: () => context.UserManager.refreshUser(props.userId),
						},
					},
				],
			},
		}),
	};
});
```

```javascript
juris.registerHeadlessComponent("ApiService", (props, context) => {
	return {
		api: {
			fetchUser: async (id) => {
				const response = await fetch(`/api/users/${id}`);
				const user = await response.json();
				context.setState(`users.${id}`, user);
				return user;
			},

			updateUser: async (id, updates) => {
				const response = await fetch(`/api/users/${id}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(updates),
				});
				const user = await response.json();
				context.setState(`users.${id}`, user);
				return user;
			},
		},

		hooks: {
			onRegister: () => {
				console.log("API Service registered");
			},
		},
	};
});
```

#### Business Logic Component

```javascript
juris.registerHeadlessComponent("ShoppingCart", (props, context) => {
	return {
		api: {
			addItem: (product, quantity = 1) => {
				const cart = context.getState("cart.items", []);
				const existingItem = cart.find((item) => item.id === product.id);

				if (existingItem) {
					existingItem.quantity += quantity;
				} else {
					cart.push({ ...product, quantity });
				}

				context.setState("cart.items", [...cart]);
				context.setState("cart.total", calculateTotal(cart));
			},

			removeItem: (productId) => {
				const cart = context.getState("cart.items", []);
				const updatedCart = cart.filter((item) => item.id !== productId);
				context.setState("cart.items", updatedCart);
				context.setState("cart.total", calculateTotal(updatedCart));
			},

			getTotal: () => context.getState("cart.total", 0),
		},
	};
});
```

### Component Usage with Reactive Props

#### Static vs Reactive Props

```javascript
// Using components with different prop types
{
	div: {
		children: [
			{
				UserCard: {
					// Static props
					userId: "user123",
					showEmail: true,
					size: "large",

					// Reactive props - re-evaluated when state changes
					theme: () => getState("app.theme", "light"),
					isOnline: () => getState("users.user123.online", false),
					lastSeen: () => getState("users.user123.lastSeen"),

					// Reactive props with element access
					position: (element) => {
						const scrollY = getState("window.scrollY", 0);
						return scrollY > 100 ? "sticky" : "static";
					},
				},
			},

			{
				ProductList: {
					// Static configuration
					itemsPerPage: 10,
					showPagination: true,

					// Reactive data
					items: () => getState("products.filtered", []),
					loading: () => getState("products.loading", false),
					searchQuery: () => getState("search.query", ""),
					sortBy: () => getState("products.sortBy", "name"),

					// Reactive event handlers
					onItemClick: () => (item) => {
						setState("selectedProduct", item.id);
						setState("modal.visible", true);
					},

					onLoadMore: () => () => {
						const currentPage = getState("products.page", 1);
						setState("products.page", currentPage + 1);
					},
				},
			},
		];
	}
}
```

#### Component Receiving Reactive Props

```javascript
juris.registerComponent("UserCard", (props, context) => {
	// Props can be static values or reactive functions
	// Juris automatically handles both

	return {
		div: {
			className: () => {
				// Access props normally - Juris resolves reactive props automatically
				const theme = props.theme || "light";
				const isOnline = props.isOnline || false;
				const size = props.size || "medium";

				return `user-card ${theme} ${size} ${isOnline ? "online" : "offline"}`;
			},

			children: [
				{
					img: {
						src: () => context.getState(`users.${props.userId}.avatar`),
						alt: "User Avatar",
					},
				},
				{
					div: {
						className: "user-info",
						children: [
							{
								h3: {
									text: () =>
										context.getState(
											`users.${props.userId}.name`,
											"Unknown User"
										),
								},
							},
							{
								p: {
									// Reactive prop used in reactive context
									text: () => {
										const isOnline = props.isOnline;
										const lastSeen = props.lastSeen;

										if (isOnline) {
											return "Online now";
										} else if (lastSeen) {
											return `Last seen ${new Date(lastSeen).toLocaleString()}`;
										} else {
											return "Offline";
										}
									},
								},
							},
						],
					},
				},
			],
		},
	};
});
```

#### Advanced Reactive Props Example

```javascript
juris.registerComponent('DynamicChart', (props, context) => {
  return {
    div: {
      className: 'chart-container',

      children: () => {
        // All props can be reactive
        const data = props.data || [];        // Could be reactive: () => getState('chart.data')
        const chartType = props.type || 'bar'; // Could be reactive: () => getState('chart.type')
        const theme = props.theme || 'light';  // Could be reactive: () => getState('app.theme')
        const loading = props.loading || false; // Could be reactive: () => getState('chart.loading')

        if (loading) {
          return [{ div: { text: 'Loading chart...', className: 'loading' }}];
        }

        if (!data.length) {
          return [{ div: { text: 'No data available', className: 'no-data' }}];
        }

        // Render different chart types based on reactive prop
        switch (chartType) {
          case 'bar':
            return [{ BarChart: { data, theme }}];
          case 'line':
            return [{ LineChart: { data, theme }}];
          case 'pie':
            return [{ PieChart: { data, theme }}];
          default:
            return [{ div: { text: `Unknown chart type: ${chartType}` }}];
        }
      }
    }
  };
});

// Usage with reactive props
{
  DynamicChart: {
    // Mix of static and reactive props
    type: () => getState('dashboard.chartType', 'bar'),
    data: () => getState('dashboard.chartData', []),
    theme: () => getState('app.theme', 'light'),
    loading: () => getState('dashboard.loading', false),

    // Static props
    width: 400,
    height: 300,
    showLegend: true
  }
}
```

#### Components as Props

```javascript
// Components can be passed as props to other components
{
  UserCard: {
    // Static props
    userId: 'user123',
    showEmail: true,

    // Reactive props
    theme: () => getState('app.theme', 'light'),
    online: () => getState('users.user123.online', false),

    // Component as prop - single component
    avatar: {
      UserAvatar: {
        userId: 'user123',
        size: 'large',
        showBadge: true
      }
    },

    // Component as prop - with reactive props
    statusBadge: {
      StatusBadge: {
        status: () => getState('users.user123.status', 'offline'),
        lastSeen: () => getState('users.user123.lastSeen')
      }
    },

    // Multiple components as prop array
    actions: [
      {
        Button: {
          text: 'Message',
          onClick: () => setState('chat.activeUser', 'user123')
        }
      },
      {
        Button: {
          text: 'Block',
          variant: 'danger',
          onClick: () => setState('users.user123.blocked', true)
        }
      }
    ],

    // Reactive component as prop
    toolbar: () => {
      const isAdmin = getState('currentUser.isAdmin', false);
      if (isAdmin) {
        return {
          AdminToolbar: {
            targetUserId: 'user123',
            permissions: () => getState('admin.permissions', [])
          }
        };
      } else {
        return {
          UserToolbar: {
            actions: ['favorite', 'share']
          }
        };
      }
    }
  }
}
```

#### Component Implementation Receiving Component Props

```javascript
juris.registerComponent("UserCard", (props, context) => {
	return {
		div: {
			className: "user-card",
			children: [
				// Render component prop directly
				props.avatar,

				{
					div: {
						className: "user-details",
						children: [
							{
								h3: {
									text: () =>
										context.getState(`users.${props.userId}.name`, "Unknown"),
								},
							},

							// Render component prop in specific location
							props.statusBadge,

							{
								p: {
									text: () => context.getState(`users.${props.userId}.email`),
								},
							},
						],
					},
				},

				// Render reactive component prop
				props.toolbar,

				{
					div: {
						className: "user-actions",
						// Render array of component props
						children: props.actions || [],
					},
				},
			],
		},
	};
});
```

#### Advanced Component Composition Patterns

```javascript
// Layout component that accepts component props
juris.registerComponent('Layout', (props, context) => {
  return {
    div: {
      className: 'layout',
      children: [
        // Header component prop
        {
          header: {
            className: 'layout-header',
            children: [props.header]
          }
        },

        // Main content area
        {
          main: {
            className: 'layout-main',
            children: [
              // Sidebar component prop (optional)
              ...(props.sidebar ? [{
                aside: {
                  className: 'layout-sidebar',
                  children: [props.sidebar]
                }
              }] : []),

              // Content component prop
              {
                section: {
                  className: 'layout-content',
                  children: [props.content]
                }
              }
            ]
          }
        },

        // Footer component prop
        {
          footer: {
            className: 'layout-footer',
            children: [props.footer]
          }
        }
      ]
    }
  };
});

// Usage with component props
{
  Layout: {
    header: {
      AppHeader: {
        title: 'My Application',
        showSearch: true,
        user: () => getState('currentUser')
      }
    },

    sidebar: () => {
      const sidebarCollapsed = getState('ui.sidebar.collapsed', false);
      return sidebarCollapsed ? null : {
        Navigation: {
          items: () => getState('navigation.items', []),
          activeItem: () => getState('navigation.active')
        }
      };
    },

    content: {
      Dashboard: {
        widgets: () => getState('dashboard.widgets', []),
        layout: () => getState('dashboard.layout', 'grid')
      }
    },

    footer: {
      AppFooter: {
        showLinks: true,
        version: () => getState('app.version')
      }
    }
  }
}
```

#### Modal/Dialog with Component Content

```javascript
juris.registerComponent('Modal', (props, context) => {
  return {
    div: {
      className: () => `modal ${context.getState('modal.visible', false) ? 'visible' : ''}`,
      onClick: (e) => {
        if (e.target.classList.contains('modal')) {
          context.setState('modal.visible', false);
        }
      },
      children: [
        {
          div: {
            className: 'modal-content',
            children: [
              {
                div: {
                  className: 'modal-header',
                  children: [
                    {
                      h3: { text: props.title || 'Modal' }
                    },
                    {
                      button: {
                        className: 'close-button',
                        text: '×',
                        onClick: () => context.setState('modal.visible', false)
                      }
                    }
                  ]
                }
              },
              {
                div: {
                  className: 'modal-body',
                  // Render component prop as modal content
                  children: [props.content]
                }
              },
              {
                div: {
                  className: 'modal-footer',
                  // Render array of action components
                  children: props.actions || []
                }
              }
            ]
          }
        }
      ]
    }
  };
});

// Usage with different content components
{
  Modal: {
    title: 'User Profile',
    content: {
      UserProfileForm: {
        userId: () => getState('modal.userId'),
        onSave: (data) => {
          setState('users.' + getState('modal.userId'), data);
          setState('modal.visible', false);
        }
      }
    },
    actions: [
      {
        Button: {
          text: 'Cancel',
          onClick: () => setState('modal.visible', false)
        }
      },
      {
        Button: {
          text: 'Save',
          variant: 'primary',
          onClick: () => {
            // Trigger save from the form component
            const event = new CustomEvent('save');
            document.querySelector('.user-profile-form').dispatchEvent(event);
          }
        }
      }
    ]
  }
}
```

```javascript
// Components can receive async reactive props
{
  UserProfile: {
    // Async reactive prop - automatically shows loading state
    userData: () => fetch(`/api/users/${getState('selectedUserId')}`)
      .then(r => r.json()),

    // Reactive prop that depends on async data
    permissions: () => {
      const user = getState('currentUser');
      return user ? fetch(`/api/permissions/${user.id}`).then(r => r.json()) : null;
    },

    // Static fallback values
    showAvatar: true,
    showEmail: false
  }
}
```

#### Component Props Update Handling

```javascript
juris.registerComponent("SmartComponent", (props, context) => {
	return {
		hooks: {
			onUpdate: (oldProps, newProps) => {
				// Handle reactive prop changes
				if (oldProps.userId !== newProps.userId) {
					// User changed - reload data
					context.UserManager.loadUser(newProps.userId);
				}

				if (oldProps.theme !== newProps.theme) {
					// Theme changed - update UI state
					context.setState("ui.themeTransition", true);
					setTimeout(() => context.setState("ui.themeTransition", false), 300);
				}
			},
		},

		render: () => ({
			div: {
				className: () => {
					const theme = props.theme;
					const transitioning = context.getState("ui.themeTransition", false);
					return `smart-component ${theme} ${
						transitioning ? "transitioning" : ""
					}`;
				},

				text: () => {
					const user = context.getState(`users.${props.userId}`);
					return user ? `Hello, ${user.name}!` : "Loading user...";
				},
			},
		}),
	};
});
```

```javascript
juris.registerComponent("LocalStateExample", (props, context) => {
	// Create local state
	const [getLocalCount, setLocalCount] = context.newState("localCount", 0);

	return {
		div: {
			text: () => `Local count: ${getLocalCount()}`,
			children: [
				{
					button: {
						text: "Increment Local",
						onClick: () => setLocalCount(getLocalCount() + 1),
					},
				},
			],
		},
	};
});
```

---

## Async Handling

### Async Props

Juris automatically handles async props with loading states:

```javascript
// Component with async props
juris.registerComponent("UserProfile", (props, context) => {
	const userDataPromise = fetch(`/api/users/${props.userId}`).then((r) =>
		r.json()
	);

	return {
		div: {
			className: "user-profile",
			// Async text - automatically shows loading state
			text: userDataPromise.then((user) => user.name),
			children: [
				{
					img: {
						// Async src
						src: userDataPromise.then((user) => user.avatar),
						alt: "User Avatar",
					},
				},
			],
		},
	};
});
```

### Async Components

```javascript
juris.registerComponent("AsyncDataComponent", async (props, context) => {
	// Async component function
	const data = await fetch("/api/data").then((r) => r.json());

	return {
		div: {
			text: `Loaded: ${data.title}`,
			children: data.items.map((item) => ({
				div: { text: item.name },
			})),
		},
	};
});
```

### Loading Indicators

```javascript
// Configure custom loading indicators
juris.setupIndicators("my-component", {
	className: "custom-loading",
	style: "opacity: 0.5; background: #f0f0f0;",
	text: "Please wait...",
	children: {
		div: {
			className: "spinner",
			text: "⟳",
		},
	},
});
```

### Promise Tracking

```javascript
// Component with render method returning promise
juris.registerComponent("AsyncRenderComponent", (props, context) => {
	return {
		render: async () => {
			const data = await context.services.dataService.load();
			return {
				div: {
					text: `Data: ${data.value}`,
				},
			};
		},
		indicator: {
			div: {
				className: "loading-spinner",
				text: "Loading data...",
			},
		},
	};
});
```

---

## DOM Enhancement

### Enhancement Methods

Juris `enhance()` supports two parameter types:

#### 1. Selector String

```javascript
// Enhance all elements matching selector
juris.enhance(".my-class", enhancementDefinition);
juris.enhance("#my-id", enhancementDefinition);
juris.enhance("button[data-reactive]", enhancementDefinition);
```

#### 2. Element Instance

```javascript
// Enhance specific element instance
const element = document.getElementById("specific-element");
juris.enhance(element, enhancementDefinition);

// Returns cleanup function
const cleanup = juris.enhance(element, enhancementDefinition);
// Later: cleanup(); // Removes enhancement
```

```javascript
// Enhance by selector
juris.enhance(".reactive-button", (context) => ({
	text: () => context.getState("button.text", "Click me"),
	onClick: () => context.setState("button.clicked", true),
	className: () => (context.getState("button.active", false) ? "active" : ""),
}));

// Enhance specific element instance
const buttonElement = document.getElementById("my-button");
juris.enhance(buttonElement, (context) => ({
	text: () => context.getState("button.text", "Click me"),
	onClick: () => context.setState("button.clicked", true),
	className: () => (context.getState("button.active", false) ? "active" : ""),
}));
```

### Headless Component Access Methods

Juris provides two convenient ways to access headless component APIs:

#### Method 1: Via Components API

```javascript
const cartAPI = context.components.getHeadlessAPI("ShoppingCart");
cartAPI.addItem(product);
```

#### Method 2: Direct Access (Shorter Syntax)

```javascript
context.ShoppingCart.addItem(product);
```

Both methods access the same headless component API. The direct access method is shorter and more convenient for frequent usage.

**Example comparing both approaches:**

```javascript
juris.registerComponent("ProductCard", (props, context) => {
	return {
		div: {
			className: "product-card",
			children: [
				{ h3: { text: props.product.name } },
				{ p: { text: `${props.product.price}` } },
				{
					button: {
						// Method 1: Via components API
						text: () => {
							const cartAPI = context.components.getHeadlessAPI("ShoppingCart");
							return cartAPI.isInCart(props.product.id)
								? "In Cart"
								: "Add to Cart";
						},

						// Method 2: Direct access (cleaner)
						onClick: () => context.ShoppingCart.toggleItem(props.product),

						disabled: () => context.ShoppingCart.isProcessing(),
					},
				},
			],
		},
	};
});
```

#### Accessing Services in Enhancement

```javascript
// Services are available in enhancement context
juris.enhance(".data-widget", (context) => ({
	text: () => {
		// Access injected services
		const apiService = context.services.apiService;
		const data = context.getState("widget.data");
		return data ? apiService.formatData(data) : "Loading...";
	},

	onClick: async () => {
		// Use services for complex operations
		const userService = context.services.userService;
		const analyticsService = context.services.analyticsService;

		context.setState("widget.loading", true);
		try {
			const result = await userService.updatePreferences({
				widgetClicked: true,
			});
			analyticsService.track("widget_interaction", { result });
			context.setState("widget.lastInteraction", Date.now());
		} finally {
			context.setState("widget.loading", false);
		}
	},
}));
```

#### Accessing Headless Components

```javascript
// Headless components available via context
juris.enhance(".shopping-item", (context) => ({
	className: () => {
		// Access headless component APIs
		const cartAPI = context.components.getHeadlessAPI("ShoppingCart");
		const itemId = context.element?.dataset.itemId;
		const inCart = cartAPI.isInCart(itemId);
		return `shopping-item ${inCart ? "in-cart" : ""}`;
	},

	children: (element) => {
		const itemId = element.dataset.itemId;
		const dataAPI = context.components.getHeadlessAPI("DataService");
		const item = context.getState(`items.${itemId}`);

		if (!item) {
			// Use headless component to fetch data
			dataAPI.fetchItem(itemId);
			return [{ div: { text: "Loading...", className: "loading" } }];
		}

		return [
			{ h3: { text: item.name } },
			{ p: { text: `${item.price}` } },
			{
				button: {
					text: () => {
						const cartAPI = context.components.getHeadlessAPI("ShoppingCart");
						return cartAPI.isInCart(itemId)
							? "Remove from Cart"
							: "Add to Cart";
					},
					onClick: () => {
						const cartAPI = context.components.getHeadlessAPI("ShoppingCart");
						cartAPI.toggleItem(item);
					},
				},
			},
		];
	},
}));
```

#### Component Composition in Enhancement

```javascript
// Use registered components within enhancements
juris.enhance(".user-profile-container", (context) => ({
	children: (element) => {
		const userId = element.dataset.userId;
		const user = context.getState(`users.${userId}`);

		if (!user) return [{ div: { text: "User not found" } }];

		// Compose using registered components
		return [
			{
				UserAvatar: {
					userId: userId,
					size: "large",
				},
			},
			{
				UserInfo: {
					userId: userId,
					showEmail: true,
				},
			},
			{
				UserActions: {
					userId: userId,
					actions: ["message", "block", "report"],
				},
			},
		];
	},
}));

// Components can also be passed as props to other components
juris.enhance(".dashboard-widget", (context) => ({
	children: () => [
		{
			Widget: {
				title: "User Stats",
				// Pass component as prop
				content: {
					UserStatsChart: {
						data: () => context.getState("stats.users", []),
						theme: () => context.getState("app.theme", "light"),
					},
				},
				// Pass multiple components as prop
				actions: [
					{
						Button: {
							text: "Refresh",
							onClick: () => context.UserStats.refresh(),
						},
					},
					{
						Button: {
							text: "Export",
							onClick: () => context.ReportService.exportUserStats(),
						},
					},
				],
			},
		},
	],
}));
```

#### Advanced Service Integration

```javascript
// Complex enhancement with multiple services
juris.enhance(".analytics-dashboard", (context) => ({
	children: () => {
		// Direct access to services and headless components
		const { analyticsService, reportingService, authService } =
			context.services;

		// Check permissions
		if (!authService.hasPermission("view_analytics")) {
			return [{ div: { text: "Access denied", className: "error" } }];
		}

		const dateRange = context.getState("dashboard.dateRange", "last7days");
		const metrics = context.getState("dashboard.metrics", []);

		return [
			{
				DateRangePicker: {
					value: dateRange,
					onChange: (range) => {
						context.setState("dashboard.dateRange", range);
						// Direct access to headless component
						context.AnalyticsManager.fetchMetrics(range).then((data) =>
							context.setState("dashboard.metrics", data)
						);
					},
				},
			},
			{
				MetricsGrid: {
					metrics: metrics,
					onExport: (format) => {
						// Use direct service access
						reportingService.exportReport(metrics, format);
					},
				},
			},
		];
	},

	hooks: {
		onMount: () => {
			// Direct headless component access
			context.AnalyticsManager.fetchMetrics("last7days").then((data) =>
				context.setState("dashboard.metrics", data)
			);
		},
	},
}));
```

#### Headless Component Initialization in Enhancement

```javascript
// Initialize headless components within enhancement
juris.enhance(".notification-center", (context) => ({
	children: () => {
		// Initialize headless component if not already done
		if (!context.components.getHeadless("NotificationManager")) {
			context.components.initHeadless("NotificationManager", {
				maxNotifications: 10,
				autoClose: true,
			});
		}

		// Both access methods work:
		// Method 1: Via components API
		const notificationAPI = context.components.getHeadlessAPI(
			"NotificationManager"
		);
		// Method 2: Direct access
		// const notificationAPI = context.NotificationManager;

		const notifications = context.getState("notifications.items", []);

		return notifications.map((notification) => ({
			NotificationItem: {
				key: notification.id,
				notification: notification,
				onDismiss: () => context.NotificationManager.dismiss(notification.id),
				onAction: (action) =>
					context.NotificationManager.handleAction(notification.id, action),
			},
		}));
	},

	className: () => {
		const count = context.getState("notifications.items", []).length;
		return `notification-center ${count > 0 ? "has-notifications" : ""}`;
	},
}));
```

#### Service-Driven Enhancement Composition

```javascript
// Enhancement that adapts based on service configuration
juris.enhance(".feature-widget", (context) => ({
	children: (element) => {
		const featureService = context.services.featureService;
		const userService = context.services.userService;
		const widgetType = element.dataset.widgetType;

		// Get feature configuration from service
		const config = featureService.getWidgetConfig(widgetType);
		const user = userService.getCurrentUser();

		// Filter features based on user permissions
		const availableFeatures = config.features.filter((feature) =>
			userService.hasFeature(user, feature.id)
		);

		return availableFeatures.map((feature) => {
			// Dynamically compose components based on feature type
			switch (feature.type) {
				case "chart":
					return {
						ChartWidget: {
							key: feature.id,
							config: feature.config,
							data: () => context.getState(`widgets.${feature.id}.data`),
						},
					};

				case "form":
					return {
						FormWidget: {
							key: feature.id,
							schema: feature.schema,
							onSubmit: (data) => {
								const apiService = context.services.apiService;
								return apiService.submitForm(feature.endpoint, data);
							},
						},
					};

				case "list":
					return {
						ListWidget: {
							key: feature.id,
							items: () => context.getState(`widgets.${feature.id}.items`, []),
							onItemClick: (item) => {
								const routerService = context.services.routerService;
								routerService.navigate(feature.itemRoute, { id: item.id });
							},
						},
					};

				default:
					return {
						GenericWidget: {
							key: feature.id,
							config: feature,
						},
					};
			}
		});
	},
}));
```

#### Direct Element Enhancement

```javascript
// Get reference to specific elements
const headerElement = document.querySelector("header");
const navElement = document.getElementById("navigation");
const formElements = document.querySelectorAll("form.reactive");

// Enhance specific element instances
juris.enhance(headerElement, (context) => ({
	className: () => {
		const scrolled = context.getState("page.scrolled", false);
		return `header ${scrolled ? "scrolled" : ""}`;
	},
	style: {
		backgroundColor: () => context.getState("theme.headerBg", "#fff"),
		boxShadow: () =>
			context.getState("page.scrolled", false)
				? "0 2px 4px rgba(0,0,0,0.1)"
				: "none",
	},
}));

// Enhance multiple elements with same definition
const enhancement = (context) => ({
	"data-enhanced": "true",
	onClick: () => context.setState("lastClicked", Date.now()),
});

formElements.forEach((form) => {
	juris.enhance(form, enhancement);
});
```

#### Dynamic Element Enhancement

```javascript
// Enhance elements as they're created
function createAndEnhanceElement() {
	const newElement = document.createElement("div");
	newElement.className = "dynamic-item";
	newElement.textContent = "New Item";

	// Enhance immediately after creation
	juris.enhance(newElement, (context) => ({
		text: () => context.getState("dynamic.text", "Default Text"),
		className: () => {
			const active = context.getState("dynamic.active", false);
			return `dynamic-item ${active ? "active" : ""}`;
		},
		onClick: () => {
			context.setState("dynamic.active", !context.getState("dynamic.active"));
		},
	}));

	document.body.appendChild(newElement);
	return newElement;
}
```

#### Conditional Element Enhancement

```javascript
// Enhance elements based on conditions
document.querySelectorAll("[data-enhance-if]").forEach((element) => {
	const condition = element.dataset.enhanceIf;

	if (shouldEnhance(condition)) {
		juris.enhance(element, (context) => ({
			className: () => {
				const theme = context.getState("app.theme", "light");
				return `${element.className} enhanced ${theme}`;
			},
			"data-enhanced-at": new Date().toISOString(),
			onClick: (el) => {
				context.setState("lastEnhanced", {
					element: el.tagName,
					id: el.id,
					timestamp: Date.now(),
				});
			},
		}));
	}
});
```

#### Element-Specific Context Enhancement

```javascript
// Create element-specific enhancement based on element properties
function enhanceBasedOnElement(element) {
	const elementType = element.tagName.toLowerCase();
	const elementId = element.id;

	let enhancement;

	switch (elementType) {
		case "button":
			enhancement = (context) => ({
				disabled: () => context.getState("buttons.disabled", false),
				"data-button-id": elementId,
				onClick: () => {
					context.setState(`buttons.${elementId}.clicked`, true);
					context.setState("buttons.lastClicked", elementId);
				},
			});
			break;

		case "input":
			enhancement = (context) => ({
				value: () => context.getState(`forms.${elementId}.value`, ""),
				oninput: (e) => {
					context.setState(`forms.${elementId}.value`, e.target.value);
					context.setState(`forms.${elementId}.lastModified`, Date.now());
				},
				className: () => {
					const value = context.getState(`forms.${elementId}.value`, "");
					const isValid = value.length >= 3;
					return `${element.className} ${isValid ? "valid" : "invalid"}`;
				},
			});
			break;

		default:
			enhancement = (context) => ({
				"data-enhanced": "true",
				"data-element-type": elementType,
			});
	}

	juris.enhance(element, enhancement);
}

// Apply to existing elements
document
	.querySelectorAll("button, input, textarea")
	.forEach(enhanceBasedOnElement);
```

#### Cleanup and Re-enhancement

```javascript
// Store enhancement references for cleanup
const enhancementCleanups = new Map();

function enhanceElementWithCleanup(element, definition) {
	// Clean up any existing enhancement
	if (enhancementCleanups.has(element)) {
		enhancementCleanups.get(element)();
	}

	// Apply new enhancement
	const cleanup = juris.enhance(element, definition);
	enhancementCleanups.set(element, cleanup);

	return cleanup;
}

// Re-enhance an element with new definition
function reEnhanceElement(element, newDefinition) {
	return enhanceElementWithCleanup(element, newDefinition);
}

// Cleanup all enhancements
function cleanupAllEnhancements() {
	enhancementCleanups.forEach((cleanup) => cleanup());
	enhancementCleanups.clear();
}
```

```javascript
juris.enhance(".product-list", (context) => ({
	// Container-level properties
	className: () =>
		`product-list ${context.getState("loading") ? "loading" : ""}`,

	// Selector-based enhancements
	selectors: {
		".product-item": {
			text: (element) => {
				const productId = element.dataset.productId;
				const product = context.getState(`products.${productId}`);
				return product ? product.name : "Loading...";
			},
			onClick: (event) => {
				const productId = event.target.dataset.productId;
				context.setState("selectedProduct", productId);
			},
		},

		".product-price": {
			text: (element) => {
				const productId = element.closest(".product-item").dataset.productId;
				const product = context.getState(`products.${productId}`);
				return product ? `$${product.price}` : "";
			},
		},

		".add-to-cart": {
			onClick: (event) => {
				const productId =
					event.target.closest(".product-item").dataset.productId;
				const cart = context.getState("cart", []);
				context.setState("cart", [...cart, productId]);
			},
		},
	},
}));
```

### Enhancement Options

```javascript
// Configure enhancement behavior
juris.configureEnhancement({
	debounceMs: 10, // Debounce DOM mutations
	batchUpdates: true, // Batch element updates
	observeSubtree: true, // Observe entire subtree
	observeChildList: true, // Observe child list changes
	observeNewElements: true, // Auto-enhance new elements
});
```

### Interactive SVG Components

#### Animated SVG Icon

```javascript
juris.registerComponent("AnimatedIcon", (props, context) => {
	return {
		svg: {
			width: props.size || "24",
			height: props.size || "24",
			viewBox: "0 0 24 24",
			className: () =>
				`icon ${context.getState("icon.animate", false) ? "spinning" : ""}`,
			onClick: () => {
				context.setState(
					"icon.animate",
					!context.getState("icon.animate", false)
				);
			},
			children: [
				{
					circle: {
						cx: "12",
						cy: "12",
						r: () => context.getState("icon.radius", 8),
						fill: () => context.getState("icon.color", "#3498db"),
						stroke: "white",
						strokeWidth: "2",
					},
				},
				{
					path: {
						d: "M12 6V12L16 14",
						stroke: "white",
						strokeWidth: "2",
						strokeLinecap: "round",
						transform: () =>
							`rotate(${context.getState("icon.rotation", 0)} 12 12)`,
					},
				},
			],
		},
	};
});
```

#### Dynamic SVG Chart

```javascript
juris.registerComponent("BarChart", (props, context) => {
	return {
		svg: {
			width: props.width || "400",
			height: props.height || "200",
			viewBox: `0 0 ${props.width || 400} ${props.height || 200}`,
			children: () => {
				const data = context.getState("chart.data", []);
				const maxValue = Math.max(...data.map((d) => d.value));
				const barWidth = (props.width || 400) / data.length;

				return data.map((item, index) => ({
					g: {
						key: item.id,
						children: [
							{
								rect: {
									x: index * barWidth,
									y:
										(props.height || 200) -
										(item.value / maxValue) * (props.height || 200),
									width: barWidth - 2,
									height: (item.value / maxValue) * (props.height || 200),
									fill: () =>
										context.getState(`chart.colors.${index}`, "#3498db"),
									onClick: () => context.setState("chart.selected", item.id),
								},
							},
							{
								text: {
									x: index * barWidth + barWidth / 2,
									y: (props.height || 200) - 5,
									textAnchor: "middle",
									fontSize: "12",
									fill: "#333",
									text: item.label,
								},
							},
						],
					},
				}));
			},
		},
	};
});
```

#### SVG with Gradients and Filters

```javascript
juris.registerComponent("GradientSVG", (props, context) => {
	return {
		svg: {
			width: "200",
			height: "200",
			viewBox: "0 0 200 200",
			children: [
				{
					defs: {
						children: [
							{
								linearGradient: {
									id: "myGradient",
									x1: "0%",
									y1: "0%",
									x2: "100%",
									y2: "100%",
									children: [
										{
											stop: {
												offset: "0%",
												stopColor: () =>
													context.getState("gradient.start", "#ff6b6b"),
											},
										},
										{
											stop: {
												offset: "100%",
												stopColor: () =>
													context.getState("gradient.end", "#4ecdc4"),
											},
										},
									],
								},
							},
						],
					},
				},
				{
					circle: {
						cx: "100",
						cy: "100",
						r: () => context.getState("circle.size", 80),
						fill: "url(#myGradient)",
						onClick: () => {
							const currentSize = context.getState("circle.size", 80);
							context.setState("circle.size", currentSize === 80 ? 60 : 80);
						},
					},
				},
			],
		},
	};
});
```

#### Analytics Libraries

```javascript
{
  button: {
    text: 'Track Me',
    'data-analytics-event': 'button-click',
    'data-analytics-category': () => getState('user.segment', 'default'),
    onClick: (e) => {
      // Juris state update
      setState('clicks', getState('clicks', 0) + 1);

      // Third-party analytics
      if (window.gtag) {
        gtag('event', 'click', {
          event_category: e.target.dataset.analyticsCategory
        });
      }
    }
  }
}
```

#### UI Component Libraries

```javascript
{
  div: {
    // Bootstrap classes
    className: () => `btn ${getState('button.variant', 'primary')}`,

    // Material-UI data attributes
    'data-mui-component': 'Button',
    'data-mui-color': () => getState('theme.primary'),

    // Custom component library attributes
    'ui-lib-theme': () => getState('app.theme'),
    'ui-lib-size': 'large'
  }
}
```

#### Testing Attributes

```javascript
{
  form: {
    'data-testid': 'contact-form',
    'data-qa': 'user-input-form',
    children: [
      {
        input: {
          'data-testid': 'email-input',
          'data-cy': 'user-email',  // Cypress
          'data-test': 'email-field', // General testing
          type: 'email',
          value: () => getState('form.email', '')
        }
      }
    ]
  }
}
```

```javascript
// Enhance a server-rendered form
juris.enhance("#contact-form", (context) => ({
	selectors: {
		'input[name="email"]': {
			oninput: (e) => {
				context.setState("form.email", e.target.value);
				// Validate email
				const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value);
				context.setState("form.emailValid", isValid);
			},
		},

		".email-error": {
			text: () => {
				const email = context.getState("form.email", "");
				const isValid = context.getState("form.emailValid", true);
				return email && !isValid ? "Please enter a valid email" : "";
			},
			style: () => ({
				display: context.getState("form.emailValid", true) ? "none" : "block",
			}),
		},

		'button[type="submit"]': {
			disabled: () => !context.getState("form.emailValid", false),
			onClick: async (e) => {
				e.preventDefault();
				context.setState("form.submitting", true);

				try {
					await submitForm(context.getState("form"));
					context.setState("form.success", true);
				} catch (error) {
					context.setState("form.error", error.message);
				} finally {
					context.setState("form.submitting", false);
				}
			},
		},
	},
}));
```

---

## Template System

### HTML Templates

```html
<!-- Define component as HTML template -->
<template data-component="UserCard" data-context="getState, setState">
	<div class="user-card">
		<h3>{getState('user.name', 'Anonymous')}</h3>
		<p>{getState('user.email')}</p>
		<button onclick="setState('user.active', !getState('user.active'))">
			{getState('user.active') ? 'Deactivate' : 'Activate'}
		</button>
	</div>

	<script>
		// Component logic
		const userId = props.userId || "default";

		// Load user data on mount
		if (!getState(`users.${userId}`)) {
			fetch(`/api/users/${userId}`)
				.then((r) => r.json())
				.then((user) => setState(`users.${userId}`, user));
		}
	</script>
</template>
```

### Template Compilation Process

1. **Parse**: Extract HTML, script, and context configuration
2. **Convert**: Transform HTML to VDOM objects
3. **Compile**: Generate component function with context
4. **Register**: Auto-register component with Juris

### Reactive Expressions in Templates

```html
<template data-component="Counter">
	<div class="counter">
		<!-- Reactive text -->
		<span>{text: () => getState('count', 0)}</span>

		<!-- Reactive children -->
		{children: () => getState('items', []).map(item => `
		<div class="item">${item.name}</div>
		` )}

		<!-- Event handlers -->
		<button onclick="setState('count', getState('count', 0) + 1)">
			Increment
		</button>
	</div>
</template>
```

---

## Performance Optimization

### Rendering Modes

#### Fine-Grained Mode (Default for Simple Apps)

```javascript
// Immediate updates, good for simple apps
juris.setRenderMode("fine-grained");

// Check current mode
if (juris.isFineGrained()) {
	console.log("Using fine-grained rendering");
}
```

#### Batch Mode (Better for Complex Apps)

```javascript
// Optimized updates with reconciliation
juris.setRenderMode("batch");

// Check current mode
if (juris.isBatchMode()) {
	console.log("Using batch rendering");
}
```

### Element Recycling

Juris automatically recycles DOM elements to improve performance:

```javascript
// Elements are automatically recycled by tag name
// No manual intervention needed

// Check recycling stats (for debugging)
const stats = juris.componentManager.getAsyncStats();
console.log("Recycling stats:", stats);
```

### Optimizing State Updates

#### Avoid Unnecessary Subscriptions

```javascript
// Skip subscription when you don't need reactivity
const staticValue = context.getState("config.apiUrl", "", false);

// Use exact subscriptions when possible
juris.subscribeExact("user.preferences.theme", handleThemeChange);
```

#### Batch Related Updates

```javascript
// Instead of multiple setState calls
juris.setState("user.name", newName);
juris.setState("user.email", newEmail);
juris.setState("user.lastModified", Date.now());

// Use batching
juris.executeBatch(() => {
	juris.setState("user.name", newName);
	juris.setState("user.email", newEmail);
	juris.setState("user.lastModified", Date.now());
});
```

### Memory Management

#### Component Cleanup

```javascript
juris.registerComponent("ManagedComponent", (props, context) => {
	let interval;

	return {
		hooks: {
			onMount: () => {
				interval = setInterval(() => {
					context.setState("timestamp", Date.now());
				}, 1000);
			},

			onUnmount: () => {
				if (interval) {
					clearInterval(interval);
				}
			},
		},

		render: () => ({
			div: {
				text: () => `Time: ${context.getState("timestamp", Date.now())}`,
			},
		}),
	};
});
```

#### Subscription Management

```javascript
// Always cleanup subscriptions
const unsubscribe = juris.subscribe("data.updates", handleUpdate);

// Later...
unsubscribe();
```

---

## Best Practices

### Component Design

#### 1. Keep Components Focused

```javascript
// Good: Single responsibility
juris.registerComponent("UserAvatar", (props, context) => ({
	img: {
		src: () => context.getState(`users.${props.userId}.avatar`),
		alt: "User Avatar",
		className: "user-avatar",
	},
}));

// Better: Compose larger components from smaller ones
juris.registerComponent("UserProfile", (props, context) => ({
	div: {
		className: "user-profile",
		children: [
			{ UserAvatar: { userId: props.userId } },
			{ UserInfo: { userId: props.userId } },
			{ UserActions: { userId: props.userId } },
		],
	},
}));
```

#### 2. Use Headless Components for Business Logic

```javascript
// Separate business logic
juris.registerHeadlessComponent("UserManager", (props, context) => ({
	api: {
		loadUser: async (userId) => {
			const user = await fetch(`/api/users/${userId}`).then((r) => r.json());
			context.setState(`users.${userId}`, user);
			return user;
		},

		updateUser: async (userId, updates) => {
			const user = await fetch(`/api/users/${userId}`, {
				method: "PATCH",
				body: JSON.stringify(updates),
			}).then((r) => r.json());

			context.setState(`users.${userId}`, user);
			return user;
		},
	},
}));

// Use in UI components
juris.registerComponent("EditableProfile", (props, context) => ({
	div: {
		children: [
			{
				input: {
					value: () => context.getState(`users.${props.userId}.name`, ""),
					oninput: (e) => {
						context.setState(`users.${props.userId}.name`, e.target.value);
					},
				},
			},
			{
				button: {
					text: "Save",
					onClick: async () => {
						const user = context.getState(`users.${props.userId}`);
						await context.components
							.getHeadlessAPI("UserManager")
							.updateUser(props.userId, user);
					},
				},
			},
		],
	},
}));
```

### State Management

#### 1. Use Hierarchical State Structure

```javascript
// Good: Organized hierarchy
const initialState = {
	user: {
		profile: { name: "", email: "" },
		preferences: { theme: "light", language: "en" },
		permissions: { admin: false, moderator: false },
	},
	app: {
		loading: false,
		error: null,
		navigation: { currentPage: "home" },
	},
};
```

#### 2. Use Meaningful Default Values

```javascript
// Good: Provide sensible defaults
const username = context.getState("user.profile.name", "Anonymous");
const theme = context.getState("user.preferences.theme", "light");
const items = context.getState("cart.items", []);
```

#### 3. Validate State Changes

```javascript
// Use middleware for validation
const validationMiddleware = ({ path, newValue }) => {
	if (path === "user.email" && newValue) {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(newValue)) {
			console.warn("Invalid email format");
			return undefined; // Reject the change
		}
	}
	return newValue;
};
```

### Async Operations

#### 1. Use Loading States

```javascript
juris.registerComponent("DataLoader", (props, context) => {
	return {
		hooks: {
			onMount: async () => {
				context.setState("loading", true);
				try {
					const data = await fetch("/api/data").then((r) => r.json());
					context.setState("data", data);
				} catch (error) {
					context.setState("error", error.message);
				} finally {
					context.setState("loading", false);
				}
			},
		},

		render: () => {
			const loading = context.getState("loading", false);
			const error = context.getState("error");
			const data = context.getState("data");

			if (loading) {
				return { div: { text: "Loading...", className: "loading" } };
			}

			if (error) {
				return { div: { text: `Error: ${error}`, className: "error" } };
			}

			return { div: { text: `Data: ${data?.title || "No data"}` } };
		},
	};
});
```

#### 2. Handle Errors Gracefully

```javascript
juris.registerHeadlessComponent("ErrorHandler", (props, context) => ({
	api: {
		handleAsync: async (asyncFn, errorPath = "app.error") => {
			try {
				context.setState(errorPath, null);
				return await asyncFn();
			} catch (error) {
				context.setState(errorPath, error.message);
				console.error("Async operation failed:", error);
				throw error;
			}
		},
	},
}));
```

### Performance

#### 1. Minimize Reactive Dependencies

```javascript
// Avoid: Creates dependency on entire user object
const userDisplay = () => {
	const user = context.getState("user");
	return user.name;
};

// Better: Only depend on specific property
const userDisplay = () => context.getState("user.name", "");
```

#### 2. Use Batching for Multiple Updates

```javascript
// Avoid: Multiple separate updates
const handleFormSubmit = (formData) => {
	context.setState("user.name", formData.name);
	context.setState("user.email", formData.email);
	context.setState("user.phone", formData.phone);
	context.setState("app.lastSaved", Date.now());
};

// Better: Batch the updates
const handleFormSubmit = (formData) => {
	context.executeBatch(() => {
		context.setState("user.name", formData.name);
		context.setState("user.email", formData.email);
		context.setState("user.phone", formData.phone);
		context.setState("app.lastSaved", Date.now());
	});
};
```

---

## Common Patterns

### Form Handling

```javascript
juris.registerComponent("ContactForm", (props, context) => {
	return {
		form: {
			onsubmit: async (e) => {
				e.preventDefault();

				context.executeBatch(() => {
					context.setState("form.submitting", true);
					context.setState("form.error", null);
				});

				try {
					const formData = {
						name: context.getState("form.name", ""),
						email: context.getState("form.email", ""),
						message: context.getState("form.message", ""),
					};

					await fetch("/api/contact", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(formData),
					});

					context.setState("form.success", true);
				} catch (error) {
					context.setState("form.error", error.message);
				} finally {
					context.setState("form.submitting", false);
				}
			},

			children: [
				{
					input: {
						type: "text",
						placeholder: "Your Name",
						value: () => context.getState("form.name", ""),
						oninput: (e) => context.setState("form.name", e.target.value),
					},
				},
				{
					input: {
						type: "email",
						placeholder: "Your Email",
						value: () => context.getState("form.email", ""),
						oninput: (e) => context.setState("form.email", e.target.value),
					},
				},
				{
					textarea: {
						placeholder: "Your Message",
						value: () => context.getState("form.message", ""),
						oninput: (e) => context.setState("form.message", e.target.value),
					},
				},
				{
					button: {
						type: "submit",
						disabled: () => context.getState("form.submitting", false),
						text: () =>
							context.getState("form.submitting", false)
								? "Sending..."
								: "Send Message",
					},
				},
			],
		},
	};
});
```

### List Management

```javascript
juris.registerComponent("TodoList", (props, context) => {
	return {
		div: {
			className: "todo-list",
			children: [
				// Add new todo
				{
					input: {
						type: "text",
						placeholder: "Add new todo...",
						value: () => context.getState("newTodo", ""),
						oninput: (e) => context.setState("newTodo", e.target.value),
						onkeypress: (e) => {
							if (e.key === "Enter" && e.target.value.trim()) {
								const todos = context.getState("todos", []);
								const newTodo = {
									id: Date.now(),
									text: e.target.value.trim(),
									completed: false,
								};

								context.executeBatch(() => {
									context.setState("todos", [...todos, newTodo]);
									context.setState("newTodo", "");
								});
							}
						},
					},
				},

				// Todo list
				{
					div: {
						className: "todo-items",
						children: () => {
							const todos = context.getState("todos", []);
							return todos.map((todo) => ({
								div: {
									key: todo.id,
									className: () =>
										`todo-item ${todo.completed ? "completed" : ""}`,
									children: [
										{
											input: {
												type: "checkbox",
												checked: todo.completed,
												onchange: (e) => {
													const todos = context.getState("todos", []);
													const updatedTodos = todos.map((t) =>
														t.id === todo.id
															? { ...t, completed: e.target.checked }
															: t
													);
													context.setState("todos", updatedTodos);
												},
											},
										},
										{
											span: {
												text: todo.text,
												className: "todo-text",
											},
										},
										{
											button: {
												text: "×",
												className: "delete-button",
												onClick: () => {
													const todos = context.getState("todos", []);
													const filteredTodos = todos.filter(
														(t) => t.id !== todo.id
													);
													context.setState("todos", filteredTodos);
												},
											},
										},
									],
								},
							}));
						},
					},
				},
			],
		},
	};
});
```

### Modal/Dialog Pattern

```javascript
juris.registerComponent("Modal", (props, context) => {
	return {
		div: {
			className: () =>
				`modal ${context.getState("modal.visible", false) ? "visible" : ""}`,
			style: () => ({
				display: context.getState("modal.visible", false) ? "flex" : "none",
			}),
			onClick: (e) => {
				if (e.target.classList.contains("modal")) {
					context.setState("modal.visible", false);
				}
			},
			children: [
				{
					div: {
						className: "modal-content",
						children: [
							{
								div: {
									className: "modal-header",
									children: [
										{
											h3: {
												text: () => context.getState("modal.title", "Modal"),
											},
										},
										{
											button: {
												className: "close-button",
												text: "×",
												onClick: () => context.setState("modal.visible", false),
											},
										},
									],
								},
							},
							{
								div: {
									className: "modal-body",
									text: () => context.getState("modal.content", ""),
								},
							},
						],
					},
				},
			],
		},
	};
});

// Usage
juris.registerComponent("App", (props, context) => ({
	div: {
		children: [
			{
				button: {
					text: "Open Modal",
					onClick: () => {
						context.executeBatch(() => {
							context.setState("modal.title", "Example Modal");
							context.setState("modal.content", "This is modal content");
							context.setState("modal.visible", true);
						});
					},
				},
			},
			{ Modal: {} },
		],
	},
}));
```

### Data Fetching Pattern

```javascript
juris.registerHeadlessComponent("DataFetcher", (props, context) => ({
	api: {
		fetch: async (url, cacheKey, options = {}) => {
			// Check cache first
			const cached = context.getState(`cache.${cacheKey}`);
			if (cached && !options.force) {
				return cached;
			}

			// Set loading state
			context.setState(`loading.${cacheKey}`, true);
			context.setState(`error.${cacheKey}`, null);

			try {
				const response = await fetch(url);
				if (!response.ok) {
					throw new Error(`HTTP ${response.status}: ${response.statusText}`);
				}

				const data = await response.json();

				// Cache the result
				context.setState(`cache.${cacheKey}`, data);
				return data;
			} catch (error) {
				context.setState(`error.${cacheKey}`, error.message);
				throw error;
			} finally {
				context.setState(`loading.${cacheKey}`, false);
			}
		},

		clearCache: (cacheKey) => {
			if (cacheKey) {
				context.setState(`cache.${cacheKey}`, null);
			} else {
				context.setState("cache", {});
			}
		},
	},
}));

// Usage in component
juris.registerComponent("UserList", (props, context) => {
	return {
		hooks: {
			onMount: async () => {
				try {
					await context.components
						.getHeadlessAPI("DataFetcher")
						.fetch("/api/users", "users");
				} catch (error) {
					console.error("Failed to load users:", error);
				}
			},
		},

		render: () => {
			const loading = context.getState("loading.users", false);
			const error = context.getState("error.users");
			const users = context.getState("cache.users", []);

			if (loading) {
				return { div: { text: "Loading users...", className: "loading" } };
			}

			if (error) {
				return {
					div: {
						className: "error",
						children: [
							{ p: { text: `Error: ${error}` } },
							{
								button: {
									text: "Retry",
									onClick: async () => {
										await context.components
											.getHeadlessAPI("DataFetcher")
											.fetch("/api/users", "users", { force: true });
									},
								},
							},
						],
					},
				};
			}

			return {
				div: {
					className: "user-list",
					children: users.map((user) => ({
						div: {
							key: user.id,
							className: "user-item",
							text: user.name,
						},
					})),
				},
			};
		},
	};
});
```

---

## Troubleshooting

### Common Issues

#### 1. Component Not Re-rendering

**Problem**: Component doesn't update when state changes.

**Solutions**:

```javascript
// Check if you're using getState correctly
// Wrong: Direct state access
const value = context.state.someValue;

// Right: Use getState
const value = context.getState("someValue");

// Check if you're subscribing properly
// Wrong: Skip subscription when you need reactivity
const value = context.getState("someValue", defaultValue, false);

// Right: Allow subscription (default)
const value = context.getState("someValue", defaultValue);
```

#### 2. Infinite Re-render Loop

**Problem**: Component keeps re-rendering infinitely.

**Solutions**:

```javascript
// Check for circular dependencies
// Wrong: Creating new objects in render
text: () => {
  const data = context.getState('data', {});
  return Object.keys(data).join(', '); // Creates new array each time
}

// Right: Use stable references
text: () => {
  const keys = context.getState('data.keys', []);
  return keys.join(', ');
}

// Wrong: Calling setState in render
text: () => {
  context.setState('rendered', true); // Causes infinite loop
  return 'Hello';
}

// Right: Use lifecycle hooks
hooks: {
  onMount: () => {
    context.setState('rendered', true);
  }
},
render: () => ({ div: { text: 'Hello' }})
```

#### 3. Async Props Not Working

**Problem**: Async props show permanent loading state.

**Solutions**:

```javascript
// Check promise rejection handling
// Wrong: Unhandled promise rejection
const dataPromise = fetch('/api/data'); // No .catch()

// Right: Handle rejections
const dataPromise = fetch('/api/data')
  .then(r => r.json())
  .catch(error => ({ error: error.message }));

// Check promise caching
// Wrong: Creating new promise each render
text: () => fetch('/api/data').then(r => r.text())

// Right: Cache promise or use state
hooks: {
  onMount: async () => {
    const data = await fetch('/api/data').then(r => r.text());
    context.setState('data', data);
  }
},
render: () => ({
  div: { text: () => context.getState('data', 'Loading...') }
})
```

#### 4. Enhancement Not Working

**Problem**: DOM enhancement doesn't apply to elements.

**Solutions**:

```javascript
// Check selector specificity
// Wrong: Too generic
juris.enhance("div", enhancementDef);

// Right: Specific selector
juris.enhance(".reactive-div", enhancementDef);

// Check timing
// Wrong: Enhancing before DOM ready
juris.enhance(".my-element", enhancementDef);

// Right: Wait for DOM or use mutation observer
document.addEventListener("DOMContentLoaded", () => {
	juris.enhance(".my-element", enhancementDef);
});
```

#### 5. Memory Leaks

**Problem**: Application uses increasing memory over time.

**Solutions**:

```javascript
// Clean up subscriptions
const MyComponent = (props, context) => {
  let unsubscribe;

  return {
    hooks: {
      onMount: () => {
        unsubscribe = context.subscribe('data', handleDataChange);
      },
      onUnmount: () => {
        if (unsubscribe) unsubscribe();
      }
    }
  };
};

// Clean up intervals/timeouts
hooks: {
  onMount: () => {
    this.interval = setInterval(() => {
      context.setState('time', Date.now());
    }, 1000);
  },
  onUnmount: () => {
    if (this.interval) clearInterval(this.interval);
  }
}
```

### Global State Monitoring

Since subscribing to empty string `''` is not supported (fails `isValidPath` validation), use these alternatives for global state monitoring:

#### Method 1: Middleware (Recommended)

```javascript
const globalStateMiddleware = ({
	path,
	oldValue,
	newValue,
	context,
	state,
}) => {
	console.log(`Global state change: ${path}`, { oldValue, newValue });

	// Optional: Filter or react to specific changes
	if (path.startsWith("user.")) {
		console.log("User-related change detected");
	}

	return newValue; // Always return the value to continue
};

const juris = new Juris({
	middleware: [globalStateMiddleware],
	// ... other config
});
```

#### Method 2: Subscribe to Top-Level Paths

```javascript
// Structure your state with top-level containers
const juris = new Juris({
	states: {
		app: { theme: "light", loading: false },
		user: { name: "", email: "" },
		data: { items: [], cache: {} },
	},
});

// Subscribe to each top-level path
["app", "user", "data"].forEach((rootPath) => {
	juris.subscribe(rootPath, (newValue, oldValue, changedPath) => {
		console.log(`${rootPath} state change at ${changedPath}:`, {
			newValue,
			oldValue,
		});
	});
});
```

#### Method 3: Custom Global Subscriber

```javascript
// Create a utility for global monitoring
function createGlobalStateMonitor(juris) {
	const topLevelPaths = Object.keys(juris.stateManager.state);
	const unsubscribers = [];

	topLevelPaths.forEach((path) => {
		const unsubscribe = juris.subscribe(
			path,
			(newValue, oldValue, changedPath) => {
				console.log(`Global monitor - ${changedPath}:`, { newValue, oldValue });
			}
		);
		unsubscribers.push(unsubscribe);
	});

	return () => unsubscribers.forEach((unsub) => unsub());
}

// Usage
const stopGlobalMonitoring = createGlobalStateMonitor(juris);
// Later: stopGlobalMonitoring();
```

#### 1. State Inspection

```javascript
// Log state changes
const juris = new Juris({
	middleware: [
		({ path, oldValue, newValue }) => {
			console.log(`State change: ${path}`, { oldValue, newValue });
			return newValue;
		},
	],
});

// Inspect current state
console.log("Current state:", juris.stateManager.state);

// Subscribe to all changes
juris.subscribe("", (newValue, oldValue, path) => {
	console.log(`Global state change: ${path}`, newValue);
});
```

#### 2. Component Debugging

```javascript
// Debug component rendering
juris.registerComponent("DebugComponent", (props, context) => {
	console.log("Component props:", props);
	console.log("Component context:", context);

	return {
		hooks: {
			onMount: () => console.log("Component mounted"),
			onUpdate: (oldProps, newProps) =>
				console.log("Component updated", { oldProps, newProps }),
			onUnmount: () => console.log("Component unmounted"),
		},
		render: () => {
			const data = context.getState("debug.data");
			console.log("Rendering with data:", data);
			return { div: { text: JSON.stringify(data) } };
		},
	};
});
```

#### 3. Performance Monitoring

```javascript
// Monitor render performance
const originalRender = juris.render;
juris.render = function (...args) {
	const start = performance.now();
	const result = originalRender.apply(this, args);
	const duration = performance.now() - start;
	console.log(`Render took ${duration.toFixed(2)}ms`);
	return result;
};

// Get framework stats
console.log("Enhancement stats:", juris.getEnhancementStats());
console.log("Async stats:", juris.componentManager.getAsyncStats());
```

### Error Handling Patterns

#### Global Error Handler

```javascript
juris.registerHeadlessComponent("ErrorHandler", (props, context) => ({
	api: {
		handleError: (error, source = "unknown") => {
			console.error(`Error from ${source}:`, error);

			context.executeBatch(() => {
				context.setState("app.error", {
					message: error.message,
					source,
					timestamp: Date.now(),
				});
				context.setState("app.hasError", true);
			});
		},

		clearError: () => {
			context.setState("app.hasError", false);
			context.setState("app.error", null);
		},
	},

	hooks: {
		onRegister: () => {
			// Global error handling
			window.addEventListener("error", (event) => {
				this.api.handleError(event.error, "window");
			});

			window.addEventListener("unhandledrejection", (event) => {
				this.api.handleError(event.reason, "promise");
			});
		},
	},
}));
```

#### Component Error Boundaries

```javascript
juris.registerComponent("ErrorBoundary", (props, context) => {
	return {
		hooks: {
			onMount: () => {
				context.setState("error.hasError", false);
			},
		},

		render: () => {
			const hasError = context.getState("error.hasError", false);
			const error = context.getState("error.details");

			if (hasError) {
				return {
					div: {
						className: "error-boundary",
						children: [
							{ h2: { text: "Something went wrong" } },
							{ p: { text: error?.message || "An unknown error occurred" } },
							{
								button: {
									text: "Try Again",
									onClick: () => {
										context.setState("error.hasError", false);
										context.setState("error.details", null);
									},
								},
							},
						],
					},
				};
			}

			try {
				return props.children || { div: { text: "No content" } };
			} catch (error) {
				context.executeBatch(() => {
					context.setState("error.hasError", true);
					context.setState("error.details", error);
				});

				return {
					div: {
						className: "error-boundary",
						text: "Error rendering content",
					},
				};
			}
		},
	};
});
```

This comprehensive guide should provide AI systems with detailed knowledge of Juris framework patterns, best practices, and troubleshooting approaches. The framework's unique approach to non-blocking reactivity and dual-mode rendering makes it particularly suitable for applications requiring smooth async operations and progressive enhancement capabilities.
