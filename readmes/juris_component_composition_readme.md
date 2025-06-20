# Juris Component Composition & Control Flow

A comprehensive guide to building declarative, composable applications with Juris's powerful component architecture.

## Overview

Juris provides a unique **object-first composition system** that separates control flow logic from UI components, enabling highly readable and maintainable applications through **component injection patterns**.

## Core Principles

### 1. **Pure Control Flow Components**
Logic components that handle "when" and "how" to render, accepting injected UI components as props.

### 2. **Component Injection**
UI components are injected at the layout level, making the entire application flow visible and self-documenting.

### 3. **Declarative Composition**
The main layout serves as both structure and documentation of what renders under what conditions.

---

## Control Flow Components

### ConditionalRenderer
Renders different components based on boolean conditions.

```javascript
{ ConditionalRenderer: {
    condition: () => getState('user.isLoggedIn', false),
    whenTrue: { Dashboard: {} },
    whenFalse: { LoginForm: {} }
}}
```

**Props:**
- `condition` - Boolean or function returning boolean
- `whenTrue` - Component(s) to render when true
- `whenFalse` - Component(s) to render when false

### SwitchRenderer
Renders components based on value matching (like switch/case).

```javascript
{ SwitchRenderer: {
    value: () => getState('user.role', 'guest'),
    admin: { AdminPanel: {} },
    user: { UserDashboard: {} },
    guest: { WelcomePage: {} },
    default: { ErrorPage: { message: 'Unknown role' } }
}}
```

**Props:**
- `value` - Value to match against prop keys
- `[key]` - Component to render when value matches key
- `default` - Fallback component when no match found

### ListRenderer
Maps arrays to components with custom rendering.

```javascript
{ ListRenderer: {
    items: () => getState('todos', []),
    empty: { EmptyState: { message: 'No todos yet' } },
    itemComponent: 'TodoItem',
    itemProps: (item, index) => ({ todo: item, onDelete: removeTodo })
}}
```

**Props:**
- `items` - Array or function returning array
- `empty` - Component to show when list is empty
- `itemComponent` - Name of component to render for each item
- `itemProps` - Function returning props for each item

### RouteRenderer
Simple client-side routing with component mapping.

```javascript
{ RouteRenderer: {
    '/': { HomePage: {} },
    '/about': { AboutPage: {} },
    '/profile': { ProfilePage: {} },
    notFound: { NotFoundPage: {} }
}}
```

**Props:**
- `[route]` - Component to render for specific route
- `notFound` - Component for unmatched routes

### AsyncRenderer
Handles loading, success, and error states for async operations.

```javascript
{ AsyncRenderer: {
    loading: () => getState('api.loading', false),
    error: () => getState('api.error', null),
    data: () => getState('api.data', null),
    loadingComponent: { Spinner: {} },
    errorComponent: { ErrorMessage: {} },
    successComponent: { DataDisplay: {} },
    emptyComponent: { EmptyState: {} }
}}
```

**Props:**
- `loading` - Boolean indicating loading state
- `error` - Error value (truthy = error state)
- `data` - Data value (truthy = success state)
- `loadingComponent` - Component for loading state
- `errorComponent` - Component for error state
- `successComponent` - Component for success state
- `emptyComponent` - Component for initial/empty state

### PermissionRenderer
Shows content based on user roles/permissions.

```javascript
{ PermissionRenderer: {
    allowedRoles: ['admin', 'moderator'],
    authorized: { AdminTools: {} },
    unauthorized: { AccessDenied: {} }
}}
```

**Props:**
- `allowedRoles` - Array of roles that can access content
- `authorized` - Component to show when authorized
- `unauthorized` - Component to show when not authorized

### MultiStateRenderer
Handles complex conditions with priority ordering.

```javascript
{ MultiStateRenderer: {
    conditions: [
        {
            when: () => getState('app.loading', false),
            render: { LoadingSpinner: {} }
        },
        {
            when: () => getState('app.error', null),
            render: { ErrorBanner: {} }
        },
        {
            when: () => getState('app.ready', false),
            render: { MainContent: {} }
        }
    ],
    fallback: { WelcomeScreen: {} }
}}
```

**Props:**
- `conditions` - Array of `{ when, render }` objects checked in order
- `fallback` - Component when no conditions match

---

## Component Patterns

### Basic UI Components

```javascript
const Button = (props, context) => ({
    render: () => ({
        button: {
            className: () => `btn ${resolveValue(props.variant) || ''}`,
            text: () => resolveValue(props.text) || 'Button',
            onclick: props.onClick || (() => {}),
            disabled: () => resolveValue(props.disabled) || false
        }
    })
});

// Helper for reactive props
const resolveValue = (value) => typeof value === 'function' ? value() : value;
```

### Lifecycle Components

```javascript
const Timer = (props, context) => {
    let interval;
    
    return {
        render: () => ({
            div: {
                text: () => `Timer: ${context.getState('timer.seconds', 0)}s`,
                children: [
                    { Button: { text: 'Start', onClick: startTimer } },
                    { Button: { text: 'Stop', onClick: stopTimer } }
                ]
            }
        }),
        
        hooks: {
            onMount: () => {
                interval = setInterval(() => {
                    const current = context.getState('timer.seconds', 0);
                    context.setState('timer.seconds', current + 1);
                }, 1000);
            },
            
            onUnmount: () => {
                if (interval) clearInterval(interval);
            }
        }
    };
};
```

### Form State Controller (Render Props)

```javascript
{ FormStateController: {
    formKey: 'userForm',
    children: (form) => [
        { Input: {
            label: 'Name',
            value: () => form.getValue('name'),
            onInput: (e) => form.setValue('name', e.target.value),
            error: () => form.errors.name
        }},
        { Button: {
            text: 'Submit',
            onClick: () => submitForm(form),
            disabled: () => form.isSubmitting
        }}
    ]
}}
```

---

## Composition Examples

### Complex Nested Flow

```javascript
const App = (props, context) => ({
    render: () => ({
        div: {
            children: [
                // Authentication flow
                { ConditionalRenderer: {
                    condition: () => context.getState('auth.isAuthenticated', false),
                    whenTrue: [
                        // Route-based content for authenticated users
                        { RouteRenderer: {
                            '/dashboard': { PermissionRenderer: {
                                allowedRoles: ['user', 'admin'],
                                authorized: { AsyncRenderer: {
                                    loading: () => context.getState('dashboard.loading', false),
                                    data: () => context.getState('dashboard.data', null),
                                    loadingComponent: { DashboardSkeleton: {} },
                                    successComponent: { DashboardContent: {} },
                                    errorComponent: { DashboardError: {} }
                                }},
                                unauthorized: { UpgradePlan: {} }
                            }},
                            '/settings': { SettingsPage: {} },
                            notFound: { UserNotFound: {} }
                        }}
                    ],
                    whenFalse: { AuthFlow: {} }
                }}
            ]
        }
    })
});
```

### Dynamic Lists with State

```javascript
{ Card: {
    title: 'User Management',
    children: [
        { Button: { text: 'Add User', onClick: openUserModal } },
        
        { ListRenderer: {
            items: () => context.getState('users.list', []),
            empty: { EmptyUserState: {} },
            itemComponent: 'UserCard',
            itemProps: (user, index) => ({
                user,
                onEdit: () => editUser(user.id),
                onDelete: () => deleteUser(user.id),
                canEdit: () => hasPermission('edit_users')
            })
        }},
        
        { ConditionalRenderer: {
            condition: () => context.getState('users.showModal', false),
            whenTrue: { UserModal: {
                onClose: () => context.setState('users.showModal', false),
                onSave: saveUser
            }}
        }}
    ]
}}
```

---

## Best Practices

### 1. **Inject Components at Layout Level**
Always pass UI components as props to control flow components for maximum readability.

```javascript
// ✅ Good - Components visible at layout level
{ ConditionalRenderer: {
    condition: () => isLoggedIn(),
    whenTrue: { Dashboard: {} },
    whenFalse: { LoginForm: {} }
}}

// ❌ Bad - Hidden inside component
{ AuthGate: {} } // What does this render? Need to check definition
```

### 2. **Use Descriptive Component Names**
Name components to clearly indicate their purpose.

```javascript
// ✅ Good
{ LoadingSpinner: {} }
{ UserNotFoundError: {} }
{ EmptyShoppingCart: {} }

// ❌ Bad
{ Spinner: {} }
{ Error: {} }
{ Empty: {} }
```

### 3. **Separate Logic from Presentation**
Control flow components handle logic, UI components handle presentation.

```javascript
// ✅ Good - Separated concerns
{ AsyncRenderer: {
    loading: () => apiState.loading,
    successComponent: { UserProfile: { user: apiState.data } }
}}

// ❌ Bad - Mixed concerns
{ UserProfileWithLoading: {} } // Handles both logic and UI
```

### 4. **Use Helper Functions for Complex Logic**
Extract complex state manipulation into helper functions.

```javascript
const App = (props, context) => {
    // Helper functions for complex operations
    const addTodo = (text) => {
        const todos = context.getState('todos', []);
        context.setState('todos', [...todos, { id: Date.now(), text }]);
    };
    
    const removeTodo = (id) => {
        const todos = context.getState('todos', []);
        context.setState('todos', todos.filter(todo => todo.id !== id));
    };
    
    return {
        render: () => ({
            div: {
                children: [
                    { TodoForm: { onSubmit: addTodo } },
                    { ListRenderer: {
                        items: () => context.getState('todos', []),
                        itemComponent: 'TodoItem',
                        itemProps: (todo) => ({ todo, onRemove: removeTodo })
                    }}
                ]
            }
        })
    };
};
```

### 5. **Handle Edge Cases Gracefully**
Always provide fallbacks for empty states, errors, and loading conditions.

```javascript
{ AsyncRenderer: {
    loading: () => getState('api.loading', false),
    error: () => getState('api.error', null),
    data: () => getState('api.data', null),
    loadingComponent: { LoadingSpinner: {} },
    errorComponent: { ErrorMessage: { 
        text: () => `Failed to load: ${getState('api.error', '')}`
    }},
    successComponent: { DataTable: { 
        data: () => getState('api.data', [])
    }},
    emptyComponent: { EmptyState: { 
        text: 'No data available',
        action: { Button: { text: 'Reload', onClick: fetchData } }
    }}
}}
```

---

## Advanced Patterns

### Render Props for Complex State Injection

```javascript
{ FormStateController: {
    formKey: 'registration',
    children: (form) => [
        { StepRenderer: {
            currentStep: () => form.getValue('currentStep', 1),
            steps: {
                1: { PersonalInfoStep: { form } },
                2: { ContactInfoStep: { form } },
                3: { ConfirmationStep: { form } }
            }
        }}
    ]
}}
```

### Nested Control Flow

```javascript
{ ConditionalRenderer: {
    condition: () => isAuthenticated(),
    whenTrue: { SwitchRenderer: {
        value: () => getUserRole(),
        admin: { AdminDashboard: {} },
        user: { UserDashboard: {} },
        default: { RoleSelectionPage: {} }
    }},
    whenFalse: { AsyncRenderer: {
        loading: () => authLoading(),
        loadingComponent: { AuthSpinner: {} },
        emptyComponent: { LoginPage: {} }
    }}
}}
```

### Component Composition with State Synchronization

```javascript
{ MultiStateRenderer: {
    conditions: [
        {
            when: () => getState('app.offline', false),
            render: { OfflineBanner: {} }
        },
        {
            when: () => getState('app.maintenance', false),
            render: { MaintenancePage: {} }
        },
        {
            when: () => getState('app.updateAvailable', false),
            render: { UpdatePrompt: {} }
        }
    ],
    fallback: { MainApplication: {} }
}}
```

This composition system enables building complex, maintainable applications where the control flow is immediately visible and the separation of concerns is crystal clear.