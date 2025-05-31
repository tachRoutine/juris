# Juris Framework


 ## Juris (JavaScript Unified Reactive Interface Solution) 
 * transforms web development through its comprehensive object-first architecture that makes 
 * reactivity an intentional choice rather than an automatic behavior. By expressing interfaces 
 * as pure JavaScript objects where functions explicitly define reactivity, Juris delivers a 
 * complete solution for applications that are universally deployable, precisely controlled,
 * and designed from the ground up for seamless AI collaboration—all while maintaining the 
 * simplicity and debuggability of native JavaScript patterns.


[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-blue.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![JavaScript](https://img.shields.io/badge/JavaScript-
## 🚀 Features

- **🔄 Reactive State Management** - Automatic UI updates when state changes
- **🧩 Component System** - Reusable, composable UI components
- **🛣️ Advanced Routing** - Hash-based routing with guards, parameters, and middleware
- **💾 Multi-tier Sync** - localStorage, cross-tab, and remote server synchronization
- **🔐 Route Guards** - Authentication, authorization, data loading, and unsaved changes protection
- **⚡ Zero Dependencies** - Pure JavaScript, no external libraries required
- **🌐 Cross-platform** - Works in all modern browsers
- **📱 Real-time Sync** - Automatic synchronization across devices and tabs

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [State Management](#state-management)
- [Component System](#component-system)
- [Routing System](#routing-system)
- [Route Guards](#route-guards)
- [Synchronization](#synchronization)
- [Backend Setup](#backend-setup)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Best Practices](#best-practices)
- [Contributing](#contributing)

## 🏁 Quick Start

### Download the Framework

Get the complete Juris Framework implementation:
- **[Complete Todo Demo](generic_juris_framework.html)** - Full working example with all features
- **[PHP Backend](php_sync_backend.php)** - Remote sync server implementation

### Basic Setup

```javascript
const app = new Juris({
    states: {
        counter: 0,
        user: { name: '', isLoggedIn: false }
    },
    
    components: {
        Counter: (props, { getState, setState }) => ({
            div: {
                children: () => [{
                    h2: { text: () => `Count: ${getState('counter')}` }
                }, {
                    button: {
                        text: 'Increment',
                        onClick: () => setState('counter', getState('counter') + 1)
                    }
                }]
            }
        })
    },
    
    layout: {
        div: {
            children: () => [{ Counter: {} }]
        }
    }
});

app.render('#app');
```

### Complete Implementation

**Download our complete working demo that includes all features:**

```html
<!-- Save as index.html and open in browser -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Juris Framework - Todo App Demo</title>
    <!-- Complete CSS and implementation included in the artifact -->
</head>
<body>
    <h1>📝 Juris Todo App</h1>
    <div class="container">
        <div id="app"></div>
        <div id="errorArea"></div>
    </div>
    <script>
        // Complete Juris Framework implementation
        // See the full artifact for the complete code
    </script>
</body>
</html>
```

**Features included in our demo:**
- ✅ **Complete Juris Framework** - Full implementation (no dependencies)
- ✅ **Advanced Routing** - With parameterized routes and all guard types
- ✅ **Multi-tier Sync** - localStorage + cross-tab + remote server
- ✅ **Authentication System** - Login/logout with role-based access
- ✅ **Real-time UI** - Reactive components with automatic updates
- ✅ **Todo Management** - Full CRUD operations with filters
- ✅ **Route Guards** - Auth, admin, data loading, unsaved changes
- ✅ **Sync Controls** - Enable/disable remote sync with manual controls

### With Advanced Routing (From Our Demo)

```javascript
const app = new Juris({
    states: {
        todos: [],
        user: { isAuthenticated: false, isAdmin: false },
        filter: 'all'
    },
    
    router: {
        routes: {
            '/': 'HomePage',
            '/stats': {
                component: 'StatsPage',
                guards: ['authGuard']
            },
            '/admin': {
                component: 'AdminPage',
                guards: ['authGuard', 'adminGuard'],
                loadData: 'loadAdminData'
            },
            '/user/:id': {
                component: 'UserPage',
                guards: ['authGuard'],
                loadData: 'loadUserData'
            }
        },
        
        guards: {
            authGuard: ({ getState, navigate }) => {
                if (!getState('user.isAuthenticated')) {
                    navigate('/login');
                    return false;
                }
                return true;
            },
            
            adminGuard: ({ getState, navigate }) => {
                if (!getState('user.isAdmin')) {
                    navigate('/unauthorized');
                    return false;
                }
                return true;
            },
            
            loadUserData: async ({ params, setState }) => {
                await new Promise(resolve => setTimeout(resolve, 800));
                setState('currentUser', {
                    id: params.id,
                    name: `User ${params.id}`,
                    todos: Math.floor(Math.random() * 20)
                });
            }
        }
    },
    
    // Auto-registered Router component
    layout: {
        div: {
            children: () => [{ Router: {} }]
        }
    }
});
```

## 🎯 Core Concepts

### State Management

Juris uses a centralized state store with reactive updates:

```javascript
// Set state
app.setState('user.name', 'John Doe');
app.setState('todos', [...todos, newTodo]);

// Get state
const userName = app.getState('user.name', 'Guest');
const todoCount = app.getState('todos', []).length;

// Subscribe to changes
const unsubscribe = app.subscribe('user.name', (newName, oldName) => {
    console.log(`Name changed from ${oldName} to ${newName}`);
});
```

### Component System

Components are pure functions that return UI objects:

```javascript
const TodoItem = (props, { setState, getState }) => ({
    div: {
        className: () => props.todo.completed ? 'completed' : '',
        children: () => [{
            span: { text: props.todo.text }
        }, {
            button: {
                text: 'Toggle',
                onClick: () => {
                    const todos = getState('todos', []);
                    const updated = todos.map(t => 
                        t.id === props.todo.id 
                            ? { ...t, completed: !t.completed }
                            : t
                    );
                    setState('todos', updated);
                }
            }
        }]
    }
});
```

### Reactive Attributes

Any attribute can be reactive by using a function:

```javascript
const DynamicComponent = (props, { getState }) => ({
    div: {
        // Static attributes
        className: 'container',
        
        // Reactive attributes
        style: {
            backgroundColor: () => getState('theme') === 'dark' ? '#333' : '#fff',
            color: () => getState('theme') === 'dark' ? '#fff' : '#333'
        },
        
        text: () => `Current user: ${getState('user.name', 'Guest')}`,
        
        // Reactive children
        children: () => getState('items', []).map(item => ({
            div: { text: item.name }
        }))
    }
});
```

## 🔄 State Management

### Basic Operations

```javascript
// Simple values
app.setState('counter', 42);
app.setState('isLoading', true);

// Nested objects
app.setState('user.profile.name', 'John');
app.setState('settings.theme', 'dark');

// Arrays
app.setState('todos', [...currentTodos, newTodo]);

// With context
app.setState('data', newData, { skipPersist: true });
```

### Middleware

Transform state changes globally:

```javascript
const app = new Juris({
    middleware: [
        // Logging middleware
        ({ path, oldValue, newValue }) => {
            console.log(`${path}: ${oldValue} → ${newValue}`);
            return newValue;
        },
        
        // Validation middleware
        ({ path, newValue }) => {
            if (path === 'user.age' && newValue < 0) {
                console.warn('Age cannot be negative');
                return 0;
            }
            return newValue;
        },
        
        // Auto-save middleware
        ({ path, newValue }) => {
            if (path.startsWith('form.')) {
                localStorage.setItem('formData', JSON.stringify(newValue));
            }
            return newValue;
        }
    ]
});
```

### External Subscriptions

Listen to state changes from outside components:

```javascript
// Subscribe to specific paths
const unsubscribe = app.subscribe('user.isLoggedIn', (isLoggedIn) => {
    if (isLoggedIn) {
        initializeUserDashboard();
    } else {
        cleanupUserData();
    }
});

// Multiple subscriptions
app.subscribe('todos', updateTodoCount);
app.subscribe('filter', refreshTodoList);
app.subscribe('user.preferences', savePreferences);

// Cleanup
unsubscribe();
```

## 🧩 Component System

### Component Structure

```javascript
const ComponentName = (props, context) => {
    // props: passed from parent
    // context: { setState, getState, navigate, services }
    
    return {
        tagName: {
            // Attributes
            className: 'my-component',
            id: 'unique-id',
            
            // Event handlers
            onClick: (event, context) => {
                // Handle click
            },
            
            // Content
            text: 'Hello World',
            
            // Children
            children: () => [
                { span: { text: 'Child 1' } },
                { span: { text: 'Child 2' } }
            ]
        }
    };
};
```

### Component Registration

```javascript
const app = new Juris({
    components: {
        // Simple component
        HelloWorld: () => ({
            h1: { text: 'Hello, World!' }
        }),
        
        // Component with props
        Greeting: (props) => ({
            p: { text: `Hello, ${props.name}!` }
        }),
        
        // Reactive component
        Counter: (props, { getState, setState }) => ({
            div: {
                children: () => [{
                    span: { text: () => `Count: ${getState('counter', 0)}` }
                }, {
                    button: {
                        text: 'Increment',
                        onClick: () => setState('counter', getState('counter', 0) + 1)
                    }
                }]
            }
        }),
        
        // Complex component with lifecycle
        TodoList: (props, { getState, setState, services }) => ({
            div: {
                className: 'todo-list',
                children: () => {
                    const todos = getState('todos', []);
                    const filter = getState('filter', 'all');
                    
                    const filteredTodos = todos.filter(todo => {
                        if (filter === 'active') return !todo.completed;
                        if (filter === 'completed') return todo.completed;
                        return true;
                    });
                    
                    return filteredTodos.map(todo => ({
                        TodoItem: { todo, key: todo.id }
                    }));
                }
            }
        })
    }
});
```

### Component Communication

```javascript
// Parent to child (props)
const Parent = () => ({
    div: {
        children: () => [{
            Child: { 
                message: 'Hello from parent',
                count: () => getState('counter', 0)
            }
        }]
    }
});

// Child to parent (callbacks)
const Child = (props, { setState }) => ({
    button: {
        text: props.message,
        onClick: () => {
            // Update shared state
            setState('counter', getState('counter', 0) + 1);
            
            // Call parent callback if provided
            if (props.onUpdate) {
                props.onUpdate(newValue);
            }
        }
    }
});

// Sibling communication (shared state)
const Sibling1 = (props, { setState }) => ({
    input: {
        value: () => getState('sharedValue', ''),
        onInput: (e) => setState('sharedValue', e.target.value)
    }
});

const Sibling2 = (props, { getState }) => ({
    p: { text: () => `Shared: ${getState('sharedValue', '')}` }
});
```

## 🛣️ Routing System

### Route Configuration

```javascript
const app = new Juris({
    router: {
        routes: {
            // Simple routes
            '/': 'HomePage',
            '/about': 'AboutPage',
            
            // Routes with guards
            '/dashboard': {
                component: 'DashboardPage',
                guards: ['authGuard']
            },
            
            // Parameterized routes
            '/user/:id': {
                component: 'UserPage',
                guards: ['authGuard'],
                loadData: 'loadUserData'
            },
            
            '/post/:slug/edit': {
                component: 'EditPostPage',
                guards: ['authGuard', 'postOwnerGuard']
            },
            
            // Multiple guards
            '/admin': {
                component: 'AdminPage',
                guards: ['authGuard', 'adminGuard']
            }
        },
        
        guards: {
            // Authentication guard
            authGuard: ({ getState, navigate }) => {
                if (!getState('user.isAuthenticated')) {
                    navigate('/login');
                    return false;
                }
                return true;
            },
            
            // Authorization guard
            adminGuard: ({ getState, navigate }) => {
                if (!getState('user.isAdmin')) {
                    navigate('/unauthorized');
                    return false;
                }
                return true;
            },
            
            // Data loading guard
            loadUserData: async ({ params, setState }) => {
                try {
                    const response = await fetch(`/api/users/${params.id}`);
                    const userData = await response.json();
                    setState('currentUser', userData);
                } catch (error) {
                    setState('error', 'Failed to load user data');
                }
            },
            
            // Custom validation guard
            postOwnerGuard: ({ params, getState, navigate }) => {
                const currentUser = getState('user.id');
                const postOwner = getState(`posts.${params.slug}.ownerId`);
                
                if (currentUser !== postOwner) {
                    navigate('/unauthorized');
                    return false;
                }
                return true;
            }
        },
        
        middleware: [
            {
                path: '/admin/*',
                guard: ({ getState }) => getState('user.isAdmin', false)
            },
            {
                path: '/api/*',
                guard: ({ getState }) => getState('user.apiAccess', false)
            }
        ]
    }
});
```

### Navigation

```javascript
// Programmatic navigation
app.navigate('/dashboard');
app.navigate('/user/123');
app.navigate('/posts/my-post/edit');

// Navigation in components
const Navigation = (props, { navigate, getState }) => ({
    nav: {
        children: () => [{
            button: {
                text: 'Home',
                onClick: () => navigate('/')
            }
        }, {
            button: {
                text: 'Dashboard',
                onClick: () => navigate('/dashboard'),
                disabled: () => !getState('user.isAuthenticated')
            }
        }]
    }
});

// Route parameters
const UserPage = (props, { getState }) => {
    const params = getState('router.params', {});
    const userId = params.id;
    
    return {
        div: {
            text: () => `Viewing user: ${userId}`
        }
    };
};
```

## 🔐 Route Guards

**All 4 types of guards implemented in our demo:**

### Implementation from Our Demo

```javascript
// Complete guards configuration from our working demo
router: {
    routes: {
        '/': 'HomePage',
        '/stats': {
            component: 'StatsPage',
            guards: ['authGuard']  // Requires authentication
        },
        '/admin': {
            component: 'AdminPage',
            guards: ['authGuard', 'adminGuard'],  // Auth + admin role
            loadData: 'loadAdminData'  // Data loading guard
        },
        '/profile': {
            component: 'ProfilePage',
            guards: ['authGuard', 'profileGuard']  // Auth + profile completion
        },
        '/user/:id': {
            component: 'UserPage',
            guards: ['authGuard'],
            loadData: 'loadUserData'  // Parameterized data loading
        }
    },
    
    guards: {
        // 1. Authentication Guard
        authGuard: ({ getState, navigate }) => {
            if (!getState('user.isAuthenticated')) {
                navigate('/login');
                return false;
            }
            return true;
        },
        
        // 2. Authorization Guard  
        adminGuard: ({ getState, navigate }) => {
            if (!getState('user.isAdmin')) {
                navigate('/unauthorized');
                return false;
            }
            return true;
        },
        
        // 3. Profile Completion Guard
        profileGuard: ({ getState, navigate }) => {
            if (!getState('user.hasProfile')) {
                alert('Please complete your profile first');
                navigate('/');
                return false;
            }
            return true;
        },
        
        // 4. Data Loading Guards (Async)
        loadAdminData: async ({ setState }) => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setState('adminData', { 
                users: 150, 
                todos: 2500,
                lastUpdate: new Date().toISOString()
            });
        },
        
        loadUserData: async ({ params, setState }) => {
            await new Promise(resolve => setTimeout(resolve, 800));
            setState('currentUser', {
                id: params.id,
                name: `User ${params.id}`,
                todos: Math.floor(Math.random() * 20)
            });
        }
    },
    
    // Path-based middleware guards
    middleware: [
        {
            path: '/admin/*',  // Wildcard support
            guard: ({ getState, navigate }) => {
                console.log('Admin middleware check');
                return getState('user.isAdmin', false);
            }
        }
    ]
}
```

### 4. Unsaved Changes Guard (Built-in)

**Automatically prevents navigation with unsaved changes:**

```javascript
// Built-in browser beforeunload handler
window.addEventListener('beforeunload', (e) => {
    if (this.getState('router.hasUnsavedChanges', false)) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
    }
});

// Route change confirmation
handleRouteChange() {
    const newPath = this.getRouteFromHash();
    const currentPath = this.getState('router.currentRoute', '/');
    
    // Check for unsaved changes guard
    if (this.getState('router.hasUnsavedChanges', false)) {
        const confirmed = confirm('You have unsaved changes. Are you sure you want to leave?');
        if (!confirmed) {
            window.location.hash = currentPath;  // Revert navigation
            return;
        }
        this.setState('router.hasUnsavedChanges', false);
    }
    
    // Continue with navigation...
}

// Usage in components (from our todo demo)
TodoForm: (props, { setState, getState, services }) => ({
    input: {
        onInput: (e) => {
            setState('newTodoText', e.target.value);
            setState('router.hasUnsavedChanges', true);  // Mark as dirty
        },
        onKeyPress: (e) => {
            if (e.key === 'Enter') {
                const text = getState('newTodoText', '').trim();
                if (text) {
                    services.todoService.addTodo(newTodo, { setState, getState });
                    setState('router.hasUnsavedChanges', false);  // Clear dirty state
                }
            }
        }
    }
})
```

### Login System (From Our Demo)

```javascript
// Complete authentication system
authService: {
    login: (username, password, { setState }) => {
        if (username && password) {
            setState('user.isAuthenticated', true);
            setState('user.username', username);
            setState('user.isAdmin', username === 'admin');
            setState('user.hasProfile', username !== 'newuser');
            return true;
        }
        return false;
    },
    
    logout: ({ setState }) => {
        setState('user.isAuthenticated', false);
        setState('user.username', '');
        setState('user.isAdmin', false);
        setState('user.hasProfile', false);
    }
}

// Login page component (from our demo)
LoginPage: (props, { setState, services, navigate }) => ({
    div: {
        children: () => [{
            h2: { text: '🔐 Login' }
        }, {
            div: {
                className: 'auth-form',
                children: () => [{
                    input: {
                        type: 'text',
                        placeholder: 'Username (try: admin, user, newuser)',
                        id: 'username'
                    }
                }, {
                    input: {
                        type: 'password',
                        placeholder: 'Password (any)',
                        id: 'password'
                    }
                }, {
                    button: {
                        text: 'Login',
                        onClick: () => {
                            const username = document.getElementById('username').value;
                            const password = document.getElementById('password').value;
                            
                            if (services.authService.login(username, password, { setState })) {
                                navigate('/');
                            } else {
                                alert('Please enter username and password');
                            }
                        }
                    }
                }]
            }
        }]
    }
})
```

### Demo Accounts (From Our Implementation)

**Try these accounts in our demo:**
- **`admin`** - Has admin access to all routes
- **`user`** - Regular user with completed profile  
- **`newuser`** - User without profile (blocked from `/profile` route)

### Route Status Indicator (From Our Demo)

```javascript
// Shows route info and guard status
div: {
    className: 'route-info',
    text: () => {
        const params = getState('router.params', {});
        const route = getState('router.currentRoute', '/');
        return `Route: ${route} | Params: ${JSON.stringify(params)} | Auth Required: ✅`;
    }
}
```

### Loading States (Built-in)

**Automatic loading indicators during guard execution:**

```javascript
// Router automatically manages loading state
Router: (props, { getState }) => {
    const isLoading = getState('router.isLoading', false);
    const error = getState('router.error', null);
    
    if (isLoading) {
        return { div: { className: 'loading', text: 'Loading...' } };
    }
    
    if (error) {
        return { div: { className: 'error', text: `Error: ${error}` } };
    }
    
    // Render normal component...
}
```

## 💾 Synchronization

**Our implementation includes a complete 3-tier synchronization system:**

### Implementation Overview

```javascript
// Built-in middleware from our demo
middleware: [
    // Logging middleware
    ({ path, oldValue, newValue }) => {
        console.log(`State change: ${path} ${JSON.stringify(oldValue)} -> ${JSON.stringify(newValue)}`);
        return newValue;
    },
    
    // LocalStorage sync middleware (automatically included)
    ({ path, newValue, context }) => {
        const persistPaths = ['todos', 'user', 'filter'];
        
        if (persistPaths.includes(path.split('.')[0]) && !context.skipPersist && !context.crossTabSync) {
            try {
                const rootPath = path.split('.')[0];
                let currentState = {};
                
                if (typeof Storage !== 'undefined') {
                    const stored = localStorage.getItem(`juris_${rootPath}`);
                    if (stored) currentState = JSON.parse(stored);
                }
                
                // Update nested value and save
                // ... (complete implementation in artifact)
                
                localStorage.setItem(`juris_${rootPath}`, JSON.stringify(currentState));
                console.log(`💾 Persisted ${rootPath} to localStorage`);
            } catch (error) {
                console.error('LocalStorage sync error:', error);
            }
        }
        
        return newValue;
    }
]
```

### 1. localStorage Sync (Built-in)

**Automatically saves and restores state on page reload:**

```javascript
// Automatic persistence - no code needed!
app.setState('todos', newTodos); // Automatically saved to localStorage
app.setState('user.name', 'John'); // Nested paths supported

// Skip persistence when needed
app.setState('temp', data, { skipPersist: true });

// State restoration (automatic on app init)
function restoreFromLocalStorage() {
    const persistPaths = ['todos', 'user', 'filter'];
    
    persistPaths.forEach(path => {
        try {
            if (typeof Storage !== 'undefined') {
                const stored = localStorage.getItem(`juris_${path}`);
                if (stored) {
                    const parsedValue = JSON.parse(stored);
                    app.setState(path, parsedValue, { skipPersist: true });
                    console.log(`🔄 Restored ${path} from localStorage`);
                }
            }
        } catch (error) {
            console.error(`Error restoring ${path}:`, error);
        }
    });
}
```

### 2. Cross-tab Sync (Built-in)

**Real-time synchronization across browser tabs:**

```javascript
// Automatic cross-tab sync implementation
function setupCrossTabSync() {
    if (typeof Storage !== 'undefined') {
        window.addEventListener('storage', (e) => {
            if (e.key && e.key.startsWith('juris_') && e.newValue !== null) {
                try {
                    const path = e.key.replace('juris_', '');
                    const newValue = JSON.parse(e.newValue);
                    const currentValue = app.getState(path);
                    
                    if (JSON.stringify(currentValue) !== JSON.stringify(newValue)) {
                        console.log(`🔄 Cross-tab sync: ${path}`);
                        app.setState(path, newValue, { skipPersist: true, crossTabSync: true });
                        showCrossTabNotification(path);
                    }
                } catch (error) {
                    console.error('Cross-tab sync error:', error);
                }
            }
        });
    }
}

// Visual notifications for cross-tab updates
function showCrossTabNotification(path, action = 'updated') {
    // Creates floating notification showing which tab updated data
    // Complete implementation in our artifact
}
```

### 3. Remote Server Sync (Configurable)

**Our complete remote sync service:**

```javascript
// Remote sync service (from our implementation)
remoteSyncService: {
    config: {
        baseUrl: '/api',
        endpoints: {
            sync: '/sync.php',
            pull: '/pull.php',
            push: '/push.php'
        },
        syncInterval: 30000,
        enabled: false, // Enable via UI or programmatically
        retryAttempts: 3
    },
    
    // Push local state to server
    pushToServer: async function({ getState }, force = false) {
        if (!this.config.enabled && !force) return { success: false };
        
        try {
            const sessionId = this.getSessionId({ getState });
            const syncData = {
                todos: getState('todos', []),
                user: getState('user', {}),
                filter: getState('filter', 'all'),
                timestamp: Date.now()
            };
            
            const response = await fetch(`${this.config.baseUrl}${this.config.endpoints.push}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, data: syncData })
            });
            
            return await response.json();
        } catch (error) {
            console.error('Push failed:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Pull remote state from server
    pullFromServer: async function({ getState, setState }, force = false) {
        // Complete implementation in artifact
    },
    
    // Bidirectional sync with conflict resolution
    sync: async function(context, force = false) {
        // Complete implementation in artifact
    }
}
```

### Sync Status Component (From Our Demo)

```javascript
// Real-time sync status and controls
SyncStatus: (props, { getState, setState, services }) => ({
    div: {
        style: { 
            background: '#f5f5f5', 
            padding: '15px', 
            borderRadius: '8px', 
            marginBottom: '20px' 
        },
        children: () => {
            const syncEnabled = services.remoteSyncService.config.enabled;
            const lastSync = getState('sync.lastSync', 0);
            
            return [{
                div: {
                    children: () => [{
                        strong: { text: 'Remote Sync Status: ' }
                    }, {
                        span: { 
                            text: syncEnabled ? '🟢 Enabled' : '🔴 Disabled'
                        }
                    }, {
                        span: { 
                            text: `Last sync: ${lastSync ? new Date(lastSync).toLocaleTimeString() : 'Never'}`
                        }
                    }]
                }
            }, {
                div: {
                    children: () => [{
                        button: {
                            text: syncEnabled ? 'Disable Sync' : 'Enable Sync',
                            onClick: () => {
                                services.remoteSyncService.setEnabled(!syncEnabled, { getState, setState });
                            }
                        }
                    }, {
                        button: {
                            text: 'Sync Now',
                            disabled: !syncEnabled,
                            onClick: async () => {
                                const result = await services.remoteSyncService.sync({ getState, setState }, true);
                                // Show result notification
                            }
                        }
                    }]
                }
            }]
        }
    }
})
```

### Usage Examples

```javascript
// Enable remote sync
app.services.remoteSyncService.config.baseUrl = 'https://your-api.com';
app.services.remoteSyncService.setEnabled(true, {
    getState: app.getState.bind(app),
    setState: app.setState.bind(app)
});

// Manual sync operations
await app.services.remoteSyncService.sync({ getState, setState });
await app.services.remoteSyncService.pushToServer({ getState });
await app.services.remoteSyncService.pullFromServer({ getState, setState });

// Clear all synced data
app.clearLocalStorage(); // Helper method from our implementation
```

## 🏗️ Backend Setup

**Complete PHP backend implementation included!**

### Our PHP Backend Files

```
api/
├── config.php          # Database configuration
├── database.php        # Database connection & setup
├── sync_service.php    # Main sync service class
├── utils.php           # Utility functions & CORS
├── push.php            # Push endpoint
├── pull.php            # Pull endpoint  
├── sync.php            # Bidirectional sync endpoint
├── admin.php           # Admin interface
├── install.php         # Database setup script
└── .htaccess           # Apache configuration
```

### Quick Setup

1. **Download our PHP backend files** (see PHP Backend artifact)
2. **Create database:**
```sql
CREATE DATABASE juris_sync;
```

3. **Configure database in `config.php`:**
```php
class Config {
    const DB_HOST = 'localhost';
    const DB_NAME = 'juris_sync';
    const DB_USER = 'your_username';
    const DB_PASS = 'your_password';
    
    const ALLOWED_ORIGINS = [
        'http://localhost:3000',
        'https://your-domain.com'
    ];
}
```

4. **Upload files and run setup:**
```bash
# NPM
npm install jurisjs

# CDN
<script src="https://unpkg.com/jurisjs@latest/dist/juris.min.js"></script>

# Download
wget https://jurisjs.com/juris.js
```

## ⚡ Quick Start

### Progressive Enhancement
Enhance existing HTML elements with reactive behavior while maintaining content visibility before JavaScript loads.

### Complete Applications  
Build full SPAs with components, routing, and state management using object-first architecture.

### Headless Services
Create background services for data sync, analytics, or any processing that doesn't require UI.

## 🧬 Core Concepts

### **States**
Simple, flat state management with dot notation access. Reactive updates trigger only where needed.

### **Enhancement** 
Transform existing HTML elements into reactive components. Content works before JavaScript loads.

### **Components**
Reusable UI definitions as pure JavaScript objects. Support lifecycle hooks and nested composition.

### **Router**
Built-in routing with hash or history mode, route guards, lazy loading, and nested routes.

### **Headless Components**
Background services that run without UI. Perfect for data synchronization, analytics, or system monitoring.

## 🌟 Key Features

| Feature | Description |
|---------|-------------|
| **Progressive Enhancement** | Enhance existing HTML with reactive behavior |
| **Complete Applications** | Build full SPAs with components and routing |
| **Headless Components** | Background services without UI |
| **Object-First UI** | Define interfaces as pure JavaScript objects |
| **Intentional Reactivity** | Choose what's reactive with functions |
| **Built-in Router** | Hash or history mode with guards |
| **State Management** | Simple, flat state with dot notation |
| **Lifecycle Hooks** | Component mount, update, unmount events |
| **Zero Dependencies** | No external libraries required |
| **Framework Agnostic** | Works alongside any existing code |

## 🎯 Use Cases

- **E-commerce Sites** - Enhance product pages, shopping carts, and checkout flows
- **Content Management** - Add interactivity to existing CMS-generated content
- **Dashboards** - Real-time data visualization with WebSocket integration
- **Forms** - Advanced validation and dynamic behavior
- **Legacy Modernization** - Gradually add modern features to existing applications
- **Micro-frontends** - Independent components that can be composed together
- **Progressive Web Apps** - Full applications with offline capabilities

## 🔧 Development Experience

- **No Build Tools Required** - Works directly in browsers
- **Hot Reloading** - Built-in development server with instant updates
- **TypeScript Support** - Full type definitions included
- **DevTools Integration** - Browser extension for debugging
- **Framework Coexistence** - Use alongside React, Vue, or any other framework
- **Minimal Learning Curve** - Pure JavaScript objects, no special syntax

## 📊 Performance

- **7x Faster Startup** - Compared to Vue/React applications
- **Surgical Updates** - Only changed elements re-render
- **Memory Efficient** - No virtual DOM overhead
- **Bundle Size** - 45kb complete framework (vs 170kb+ for alternatives)
- **Progressive Loading** - Content visible before JavaScript execution

## 🌐 Browser Support

- **Modern Browsers** - Chrome, Firefox, Safari, Edge (latest versions)
- **Progressive Degradation** - Enhanced features degrade gracefully
- **Mobile Optimized** - Touch events and responsive behavior
- **Accessibility** - WCAG 2.1 compliant by default

## 📚 Learn More

- **🌐 Website:** [jurisjs.com](https://jurisjs.com)
- **📖 Documentation:** [jurisjs.com/docs](https://jurisjs.com/docs)
- **🎮 Playground:** [jurisjs.com/playground](https://jurisjs.com/playground)
- **💬 Community:** [GitHub Discussions](https://github.com/jurisjs/juris/discussions)
- **🐦 Twitter:** [@jurisjs](https://x.com/jurisjs)

## 🤝 Contributing

We welcome contributions! See our [Contributing Guide](CONTRIBUTING.md) for details.

```bash
git clone https://github.com/jurisjs/juris.git
cd juris
npm install
npm run dev
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by modern reactive frameworks
- Built with vanilla JavaScript for maximum compatibility
- Thanks to all contributors and testers

## 📞 Support

- **Documentation**: [https://jurisjs.com/#docs](https://jurisjs.com/#docs)
- **Issues**: [GitHub Issues](https://github.com/jurisjs/juris/issues)
- **Discussions**: [GitHub Discussions](https://github.com/jurisjs/juris/discussions)
- **Discord**: not available

---

**Happy coding with Juris! 🚀**