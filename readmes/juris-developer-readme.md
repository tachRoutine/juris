# Juris Developer Guide

> **The only SPA that feels SSR** - 3ms mobile rendering, 2,254 LOC core framework

Juris is a paradigm-shifting JavaScript framework that transforms web development through object-first architecture and path-based reactivity. Build applications that are blazing fast, universally deployable, and designed for seamless AI collaboration.

## 🚀 Quick Start

```bash
# Include Juris (single file, no build tools required)
<script src="https://cdn.jsdelivr.net/gh/jurisjs/juris/dist/juris.min.js"></script>
```

```javascript
// Create your first Juris app
const app = new Juris({
  states: {
    counter: { value: 0 },
    user: { name: 'Developer' }
  },
  
  components: {
    'hello-world': (props, ctx) => ({
      div: {
        children: [
          { h1: { text: () => `Hello, ${ctx.getState('user.name')}!` } },
          { p: { text: () => `Count: ${ctx.getState('counter.value')}` } },
          { 
            button: { 
              text: 'Click me!',
              onclick: () => {
                const current = ctx.getState('counter.value');
                ctx.setState('counter.value', current + 1);
              }
            }
          }
        ]
      }
    })
  },
  
  layout: { 'hello-world': {} }
});

app.render('#app');
```

## ⚡ Core Concepts

### 1. Path-Based State Management

```javascript
// Automatic dependency tracking - no manual subscriptions
const ProfileCard = (props, ctx) => ({
  div: {
    className: 'profile-card',
    children: [
      // Each getState() creates automatic subscriptions
      { h2: { text: () => ctx.getState('user.profile.name') } },
      { p: { text: () => ctx.getState('user.profile.bio') } },
      { span: { text: () => `Age: ${ctx.getState('user.profile.age')}` } }
    ]
  }
});

// Updates automatically trigger re-renders
ctx.setState('user.profile.name', 'New Name'); // ✅ ProfileCard updates
ctx.setState('user.profile.age', 30);          // ✅ ProfileCard updates  
ctx.setState('user.settings.theme', 'dark');   // ❌ ProfileCard unaffected
```

### 2. Component-Scoped State with `newState()`

```javascript
const Counter = (props, ctx) => {
  // Component-scoped state (isolated, auto-cleanup)
  const [getCount, setCount] = ctx.newState('count', 0);
  const [getName, setName] = ctx.newState('name', 'Counter');
  
  return {
    div: {
      className: 'counter-widget',
      children: [
        { h3: { text: () => getName() } },
        { p: { text: () => `Count: ${getCount()}` } },
        {
          button: {
            text: '+1',
            onclick: () => setCount(getCount() + 1)
          }
        }
      ]
    }
  };
};

// Multiple instances = isolated state
// Counter_1: __local.Counter_1.count = 5
// Counter_2: __local.Counter_2.count = 2
```

### 3. Object-First Architecture

```javascript
// Everything is plain JavaScript objects
const TodoApp = (props, ctx) => ({
  div: {
    className: 'todo-app',
    style: {
      padding: '20px',
      backgroundColor: () => ctx.getState('theme.bg')
    },
    children: () => {
      const todos = ctx.getState('todos');
      return [
        { h1: { text: 'My Todos' } },
        ...todos.map(todo => ({
          'todo-item': { 
            key: todo.id,
            todo: todo 
          }
        })),
        { 'add-todo-form': {} }
      ];
    }
  }
});
```

### 4. Reactive Functions

```javascript
const UserProfile = (props, ctx) => ({
  div: {
    // Reactive text content
    text: () => `Hello, ${ctx.getState('user.name')}!`,
    
    // Reactive styling
    style: {
      color: () => ctx.getState('user.isOnline') ? 'green' : 'gray',
      fontSize: '18px'
    },
    
    // Reactive attributes
    className: () => ctx.getState('user.isPremium') ? 'premium-user' : 'basic-user',
    
    // Reactive event handlers
    onclick: () => {
      const isOnline = ctx.getState('user.isOnline');
      ctx.setState('user.isOnline', !isOnline);
    }
  }
});
```

## 🎯 Advanced Features

### State Middleware

```javascript
const app = new Juris({
  states: { counter: 0 },
  
  middleware: [
    // Logging middleware
    ({ path, oldValue, newValue }) => {
      console.log(`${path}: ${oldValue} → ${newValue}`);
      return newValue;
    },
    
    // Validation middleware
    ({ path, newValue }) => {
      if (path === 'counter' && newValue < 0) {
        console.warn('Counter cannot be negative');
        return 0;
      }
      return newValue;
    }
  ]
});
```

### Lifecycle Components

```javascript
const DataLoader = (props, ctx) => ({
  render: () => ({
    div: {
      text: () => ctx.getState('data.status') || 'Loading...'
    }
  }),
  
  hooks: {
    onMount: () => {
      fetch('/api/data')
        .then(res => res.json())
        .then(data => ctx.setState('data', data));
    },
    
    onUnmount: () => {
      console.log('Cleaning up data loader');
    }
  }
});
```

### Headless Components

```javascript
const app = new Juris({
  headlessComponents: {
    geolocation: (props, ctx) => ({
      api: {
        getCurrentPosition() {
          navigator.geolocation.getCurrentPosition(
            pos => ctx.setState('geo.position', pos.coords)
          );
        },
        
        watchPosition() {
          return navigator.geolocation.watchPosition(
            pos => ctx.setState('geo.position', pos.coords)
          );
        }
      },
      
      hooks: {
        onRegister: () => console.log('Geolocation service ready')
      }
    })
  }
});

// Use in components
const LocationDisplay = (props, ctx) => ({
  div: {
    children: [
      { 
        button: { 
          text: 'Get Location',
          onclick: () => ctx.geolocation.getCurrentPosition()
        }
      },
      {
        p: {
          text: () => {
            const pos = ctx.getState('geo.position');
            return pos ? `${pos.latitude}, ${pos.longitude}` : 'No location';
          }
        }
      }
    ]
  }
});
```

### Progressive Enhancement

```javascript
// Enhance existing HTML
app.enhance('[data-counter]', (ctx) => ({
  text: () => ctx.getState('counter.value'),
  onclick: () => {
    const current = ctx.getState('counter.value');
    ctx.setState('counter.value', current + 1);
  }
}));

// HTML: <div data-counter>0</div>
// Becomes reactive automatically!
```

## 🔧 Performance Optimization

### Render Modes

```javascript
// Fine-grained mode (default) - maximum compatibility
app.setRenderMode('fine-grained');

// Batch mode - maximum performance  
app.setRenderMode('batch');

// Auto-fallback on failures
// Juris automatically switches modes if needed
```

### Batching Configuration

```javascript
app.stateManager.configureBatching({
  maxBatchSize: 50,    // Max updates per batch
  batchDelayMs: 0      // Delay before processing batch
});
```

### Subscription Patterns

```javascript
// ✅ Efficient: Specific path subscription
const name = ctx.getState('user.name');

// ✅ Efficient: Parent object subscription (gets all child changes)
const user = ctx.getState('user');

// ✅ Efficient: Multiple specific subscriptions
const UserCard = (props, ctx) => ({
  div: {
    children: [
      { p: { text: () => ctx.getState('user.name') } },    // Individual subscription
      { p: { text: () => ctx.getState('user.email') } },   // Individual subscription
      { p: { text: () => ctx.getState('user.age') } }      // Individual subscription
    ]
  }
});
```

## 📊 Real-World Example

```javascript
const TodoApp = new Juris({
  states: {
    todos: [],
    filter: 'all',
    newTodo: ''
  },
  
  components: {
    'todo-app': (props, ctx) => ({
      div: {
        className: 'todo-app',
        children: [
          { 'todo-header': {} },
          { 'todo-list': {} },
          { 'todo-footer': {} }
        ]
      }
    }),
    
    'todo-header': (props, ctx) => ({
      header: {
        children: [
          { h1: { text: 'Todos' } },
          {
            input: {
              type: 'text',
              placeholder: 'What needs to be done?',
              value: () => ctx.getState('newTodo'),
              oninput: (e) => ctx.setState('newTodo', e.target.value),
              onkeypress: (e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  const todos = ctx.getState('todos');
                  const newTodo = {
                    id: Date.now(),
                    text: e.target.value.trim(),
                    completed: false
                  };
                  ctx.setState('todos', [...todos, newTodo]);
                  ctx.setState('newTodo', '');
                }
              }
            }
          }
        ]
      }
    }),
    
    'todo-list': (props, ctx) => ({
      ul: {
        className: 'todo-list',
        children: () => {
          const todos = ctx.getState('todos');
          const filter = ctx.getState('filter');
          
          const filteredTodos = todos.filter(todo => {
            if (filter === 'active') return !todo.completed;
            if (filter === 'completed') return todo.completed;
            return true;
          });
          
          return filteredTodos.map(todo => ({
            'todo-item': { key: todo.id, todo }
          }));
        }
      }
    }),
    
    'todo-item': (props, ctx) => {
      const { todo } = props;
      
      return {
        li: {
          className: () => todo.completed ? 'completed' : '',
          children: [
            {
              input: {
                type: 'checkbox',
                checked: todo.completed,
                onchange: (e) => {
                  const todos = ctx.getState('todos');
                  const updated = todos.map(t => 
                    t.id === todo.id ? { ...t, completed: e.target.checked } : t
                  );
                  ctx.setState('todos', updated);
                }
              }
            },
            {
              span: {
                text: todo.text,
                ondblclick: () => {
                  // Enter edit mode
                  ctx.setState(`editing.${todo.id}`, true);
                }
              }
            },
            {
              button: {
                text: '×',
                onclick: () => {
                  const todos = ctx.getState('todos');
                  ctx.setState('todos', todos.filter(t => t.id !== todo.id));
                }
              }
            }
          ]
        }
      };
    },
    
    'todo-footer': (props, ctx) => ({
      footer: {
        children: () => {
          const todos = ctx.getState('todos');
          const remaining = todos.filter(t => !t.completed).length;
          
          return [
            {
              span: {
                text: `${remaining} item${remaining !== 1 ? 's' : ''} left`
              }
            },
            {
              div: {
                className: 'filters',
                children: ['all', 'active', 'completed'].map(filter => ({
                  button: {
                    text: filter,
                    className: () => ctx.getState('filter') === filter ? 'selected' : '',
                    onclick: () => ctx.setState('filter', filter)
                  }
                }))
              }
            }
          ];
        }
      }
    })
  },
  
  layout: { 'todo-app': {} }
});

TodoApp.render('#app');
```

## 🎨 Best Practices

### 1. Component Organization
```javascript
// ✅ Small, focused components
const UserAvatar = (props, ctx) => ({
  img: {
    src: () => ctx.getState(`users.${props.userId}.avatar`),
    alt: () => ctx.getState(`users.${props.userId}.name`)
  }
});

// ✅ Compose larger components
const UserProfile = (props, ctx) => ({
  div: {
    children: [
      { 'user-avatar': { userId: props.userId } },
      { 'user-details': { userId: props.userId } },
      { 'user-actions': { userId: props.userId } }
    ]
  }
});
```

### 2. State Structure
```javascript
// ✅ Good: Normalized, flat structure
const goodState = {
  users: {
    1: { id: 1, name: 'Alice', email: 'alice@example.com' },
    2: { id: 2, name: 'Bob', email: 'bob@example.com' }
  },
  posts: {
    1: { id: 1, title: 'Hello', authorId: 1 },
    2: { id: 2, title: 'World', authorId: 2 }
  },
  ui: {
    selectedUserId: 1,
    isLoading: false
  }
};

// ❌ Avoid: Deeply nested, denormalized
const badState = {
  users: [
    {
      id: 1,
      name: 'Alice',
      posts: [
        { id: 1, title: 'Hello', comments: [...] }
      ]
    }
  ]
};
```

### 3. Performance Tips
```javascript
// ✅ Use specific paths for fine-grained updates
const UserName = (props, ctx) => ({
  span: { text: () => ctx.getState(`users.${props.userId}.name`) }
});

// ✅ Batch related updates
const updateUser = (ctx, userId, updates) => {
  Object.entries(updates).forEach(([key, value]) => {
    ctx.setState(`users.${userId}.${key}`, value);
  });
};

// ✅ Use keys for dynamic lists
const TodoList = (props, ctx) => ({
  ul: {
    children: () => ctx.getState('todos').map(todo => ({
      'todo-item': { key: todo.id, todo }  // ← Key for efficient updates
    }))
  }
});
```

## 📚 API Reference

### Core Classes

- **`Juris`** - Main framework class
- **`StateManager`** - Path-based reactive state
- **`ComponentManager`** - Component registration & lifecycle
- **`DOMRenderer`** - Optimized DOM rendering
- **`HeadlessManager`** - Headless component system
- **`DOMEnhancer`** - Progressive enhancement

### Context Methods

- **`ctx.getState(path, defaultValue)`** - Get reactive state
- **`ctx.setState(path, value)`** - Update state
- **`ctx.subscribe(path, callback)`** - Manual subscription
- **`ctx.newState(key, initialValue)`** - Component-scoped state
- **`ctx.services`** - Access to services
- **`ctx.headless`** - Access to headless APIs

### Configuration Options

```javascript
new Juris({
  states: {},           // Initial state
  components: {},       // UI components
  headlessComponents: {}, // Headless components
  middleware: [],       // State middleware
  services: {},         // Dependency injection
  layout: {},          // Root layout
  renderMode: 'fine-grained' // Render mode
})
```

## 🔗 Links

- **Website**: [https://jurisjs.com](https://jurisjs.com)
- **Documentation**: [https://jurisjs.com/#docs](https://jurisjs.com/#docs)
- **GitHub**: [https://github.com/jurisjs/juris](https://github.com/jurisjs/juris)
- **Examples**: [https://jurisjs.com/#examples](https://jurisjs.com/#examples)
- **Playground**: [https://jurisjs.com/#playground](https://jurisjs.com/#playground)

---

**Built with Juris** - 3ms mobile rendering, 2,254 LOC core framework that eliminates complexity and makes traditional problems a thing of the past.
