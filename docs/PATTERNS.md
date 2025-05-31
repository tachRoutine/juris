# Juris Patterns

> **Design patterns and best practices for building applications with Juris**

This document outlines proven patterns for using Juris effectively across different types of applications and use cases.

## 🎯 Enhancement Patterns

### **Progressive Enhancement Pattern**
Start with working HTML, enhance with JavaScript.

**When to use:** Existing websites, CMS integration, legacy modernization

```html
<!-- HTML works without JavaScript -->
<div class="status-badge">Active</div>

<script>
// Enhancement adds reactive behavior
app.enhance('.status-badge', (props, { getState }) => ({
  textContent: () => getState('user.status', 'Active'),
  style: { 
    backgroundColor: () => getState('user.status') === 'Active' ? 'green' : 'red'
  }
}));
</script>
```

**Structure:**
- HTML content works without JavaScript
- Enhancement adds reactive behavior
- Graceful degradation for accessibility

### **Selective Enhancement Pattern**
Enhance specific elements while leaving others static.

**When to use:** Large websites where only certain sections need interactivity

```javascript
// Only enhance interactive elements
app.enhance('.interactive-button', (props, { useState }) => {
  const [getClicks, setClicks] = useState('clicks', 0);
  const [getPressed, setPressed] = useState('isPressed', false);
  
  return {
    onClick: () => setClicks(getClicks() + 1),
    onMouseDown: () => setPressed(true),
    onMouseUp: () => setPressed(false),
    style: { 
      backgroundColor: () => getClicks() > 5 ? 'gold' : 'blue',
      transform: () => getPressed() ? 'scale(0.95)' : 'scale(1)'
    }
  };
});

// Leave static content unchanged
// <p>This paragraph stays static</p>
```

**Key principle:** Only enhance what needs to be reactive

### **Layered Enhancement Pattern**
Apply multiple enhancement layers to the same elements.

**When to use:** Complex interactions that build upon each other

**Structure:**
- Base enhancement for core functionality
- Additional enhancements for advanced features
- Clean separation of concerns

## 🏗️ Application Architecture Patterns

### **Component-First Pattern**
Build applications as collections of reusable components.

**When to use:** New applications, design systems, scalable architectures

```javascript
const StatusCard = (props, { useState }) => {
  const [getMessage] = useState(`status.${props.id}.message`, 'No status');
  
  return {
    render: () => ({
      div: {
        className: 'status-card',
        style: { 
          backgroundColor: () => props.type === 'error' ? 'red' : 'green',
          borderLeft: () => `4px solid ${props.type === 'error' ? 'darkred' : 'darkgreen'}`
        },
        children: [
          { h3: { text: props.title } },
          { p: { text: () => getMessage() } }
        ]
      }
    })
  };
});
```

**Structure:**
- Components define UI as objects
- State flows down through props
- Events bubble up through callbacks

### **Layout-Driven Pattern**
Define application structure through layout configuration.

**When to use:** Applications with consistent overall structure

**Structure:**
- Root layout component
- Nested routing areas
- Shared navigation and footer

### **Feature Module Pattern**
Organize code by features rather than technical layers.

**When to use:** Large applications, team collaboration, maintainability

**Structure:**
- Each feature has its own components, state, and services
- Clear boundaries between features
- Shared utilities and common components

## 🔄 State Management Patterns

### **Flat State Pattern**
Keep state structure flat and simple.

**When to use:** Most applications, especially those with simple data relationships

```javascript
// Good: Flat structure
states: {
  'user.name': 'John',
  'user.email': 'john@example.com',
  'cart.items': ['item1', 'item2'],
  'ui.theme': 'dark'
}

// Enhancement with flat state
app.enhance('.user-profile', (props, { getState }) => ({
  style: () => ({
    backgroundColor: getState('ui.theme') === 'dark' ? '#333' : '#fff',
    color: getState('ui.theme') === 'dark' ? '#fff' : '#333'
  }),
  textContent: () => `Welcome, ${getState('user.name')}!`
}));
```

**Benefits:**
- Easy to debug and understand
- Predictable updates
- Minimal nesting complexity

### **Domain State Pattern**
Organize state by business domains.

**When to use:** Complex applications with multiple business areas

```javascript
states: {
  auth: {
    isAuthenticated: false,
    user: null,
    token: null
  },
  products: {
    items: [],
    selectedCategory: 'all',
    loading: false
  },
  cart: {
    items: [],
    total: 0,
    isOpen: false
  },
  ui: {
    theme: 'light',
    sidebarOpen: false,
    notifications: []
  }
}

// Access with dot notation
getState('auth.isAuthenticated')
getState('products.items')
getState('cart.total')
```

**Structure:**
- `auth.*` - Authentication and user data
- `products.*` - Product catalog and details
- `cart.*` - Shopping cart functionality
- `ui.*` - Interface state and preferences

### **Computed State Pattern**
Derive state from other state using functions.

**When to use:** Values that depend on multiple state properties

**Benefits:**
- Automatic recalculation
- No state duplication
- Consistent derived values

### **Event-Driven State Pattern**
Update state through explicit events.

**When to use:** Complex workflows, audit trails, undo/redo functionality

**Structure:**
- Actions describe what happened
- State changes are explicit
- Event history can be tracked

## 🎛️ Service Patterns

### **Headless Service Pattern**
Background services without UI components.

**When to use:** Data synchronization, analytics, system monitoring

```javascript
const ThemeService = (props, context) => ({
  onRegistered: async () => {
    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    context.setState('ui.theme', savedTheme);
    
    // Watch for theme changes and persist
    const unsubscribe = context.subscribe('ui.theme', (theme) => {
      localStorage.setItem('theme', theme);
      document.body.style.backgroundColor = theme === 'dark' ? '#1a1a1a' : '#ffffff';
    });
    
    return unsubscribe; // Cleanup function
  }
});
```

**Structure:**
- `onRegistered` hook for initialization
- Background processing and data management
- Return cleanup function

### **Singleton Service Pattern**
Single instance services across the application.

**When to use:** Authentication, configuration, global state management

**Implementation:**
- Register once at application startup
- Share state across components
- Centralized resource management

### **Factory Service Pattern**
Services that create and manage multiple instances.

**When to use:** Dynamic content creation, data collection management

**Structure:**
- Factory function creates instances
- Instance management and lifecycle
- Resource cleanup and disposal

## 🌐 Routing Patterns

### **Nested Routing Pattern**
Hierarchical route structures with parent-child relationships.

**When to use:** Applications with complex navigation hierarchies

**Structure:**
- Parent routes define layout
- Child routes provide content
- Shared components and state

### **Guard-Protected Pattern**
Route access control through guards.

**When to use:** Authentication-required pages, role-based access

**Types:**
- Authentication guards
- Authorization guards
- Data validation guards

### **Lazy Loading Pattern**
Load route components on demand.

**When to use:** Large applications, performance optimization

**Benefits:**
- Reduced initial bundle size
- Faster application startup
- Progressive feature loading

## 🔌 Integration Patterns

### **Micro-Frontend Pattern**
Independent applications that compose together.

**When to use:** Large teams, legacy integration, independent deployment

**Structure:**
- Each team owns specific routes or features
- Shared state through services
- Independent testing and deployment

### **CMS Integration Pattern**
Enhance content management system output.

**When to use:** WordPress, Drupal, or other CMS-driven sites

**Approach:**
- Enhance existing CMS markup
- Add interactive features to static content
- Preserve content editing workflows

### **Third-Party Integration Pattern**
Work alongside other frameworks and libraries.

**When to use:** Gradual migration, legacy systems, team preferences

**Strategy:**
- Enhance specific sections only
- Avoid conflicts with existing code
- Progressive replacement over time

## 📊 Performance Patterns

### **Surgical Update Pattern**
Update only the specific elements that changed.

**When to use:** Always - this is Juris's default behavior

```javascript
// Traditional framework: Entire list re-renders when any item changes
// Juris: Only the specific item that changed updates

app.enhance('.todo-item', (props, { getState }) => {
  const id = props.element.dataset.id;
  
  return {
    className: () => {
      const todo = getState(`todos.${id}`);
      return `todo-item ${todo?.completed ? 'completed' : 'active'}`;
    },
    style: () => ({
      backgroundColor: getState(`todos.${id}.priority`) === 'high' ? '#fee' : '#fff',
      borderLeft: `4px solid ${getState(`todos.${id}.completed`) ? 'green' : 'orange'}`
    })
  };
});
```

**Benefits:**
- Minimal DOM manipulation
- Consistent performance
- Reduced layout thrashing

### **Batched State Pattern**
Group multiple state changes together.

**When to use:** Complex updates, animation sequences

**Implementation:**
- Collect all changes
- Apply as single update
- Trigger rendering once

### **Virtualization Pattern**
Render only visible items in large lists.

**When to use:** Large datasets, infinite scrolling, performance-critical lists

**Approach:**
- Calculate visible range
- Render only visible items
- Reuse DOM elements

## 🔍 Testing Patterns

### **Enhancement Testing Pattern**
Test enhanced elements in isolation.

**Strategy:**
- Create test HTML fixtures
- Apply enhancements
- Verify reactive behavior

### **Component Testing Pattern**
Test components with mock state and context.

**Approach:**
- Render components with test props
- Mock state and services
- Verify output and interactions

### **Integration Testing Pattern**
Test complete application flows.

**Scope:**
- Multi-component interactions
- State flow between features
- Route navigation and guards

## 🛡️ Security Patterns

### **XSS Prevention Pattern**
Protect against cross-site scripting attacks.

**Built-in protection:**
- HTML sanitization by default
- Safe attribute handling
- Content validation

### **Input Validation Pattern**
Validate all user inputs at multiple layers.

**Layers:**
- Client-side validation for UX
- Server-side validation for security
- State validation for consistency

### **Authentication Pattern**
Secure user authentication and session management.

**Components:**
- Login/logout flows
- Token management
- Route protection

## 📱 Mobile Patterns

### **Responsive Enhancement Pattern**
Progressive enhancement for mobile devices.

**Approach:**
- Mobile-first base styles
- Enhanced interactions for larger screens
- Touch-optimized controls

### **Offline-First Pattern**
Applications that work without network connectivity.

**Strategy:**
- Local state persistence
- Sync when online
- Conflict resolution

## 🧪 Development Patterns

### **Feature Flag Pattern**
Control feature rollout and experimentation.

**Implementation:**
- Conditional component rendering
- State-driven feature toggles
- A/B testing capability

### **Debug-Friendly Pattern**
Structure code for easy debugging and development.

**Practices:**
- Clear component naming
- State logging and inspection
- Development-only debugging features

## 🚀 Deployment Patterns

### **Static Deployment Pattern**
Deploy as static files with no server requirements.

**Benefits:**
- CDN distribution
- High availability
- Low cost

### **Progressive Deployment Pattern**
Gradual rollout of new features and updates.

**Strategy:**
- Feature flags for controlled rollout
- Monitoring and rollback capabilities
- User segment targeting

---

## 📋 Pattern Selection Guide

| Use Case | Recommended Patterns |
|----------|---------------------|
| **New SPA** | Component-First, Layout-Driven, Flat State |
| **Existing Website** | Progressive Enhancement, Selective Enhancement |
| **E-commerce** | Domain State, Guard-Protected, Performance Optimization |
| **Dashboard** | Headless Services, Real-time Updates, Virtualization |
| **CMS Integration** | CMS Integration, Progressive Enhancement |
| **Mobile App** | Responsive Enhancement, Offline-First |
| **Enterprise** | Feature Modules, Security Patterns, Testing Patterns |

## 🤝 Contributing Patterns

Found a useful pattern not documented here? We welcome contributions!

1. **Document the pattern** with clear use cases and implementation
2. **Provide rationale** for when and why to use it
3. **Include considerations** for trade-offs and alternatives
4. **Submit a pull request** with your pattern addition

---

**Need help choosing patterns for your project?** Join our [community discussions](https://github.com/jurisjs/juris/discussions) for guidance!
