# Juris `newState()` Hook

React-like local component state for the Juris framework. Each component instance gets its own isolated state while maintaining Juris's intentional reactivity paradigm.

## Overview

The `newState()` hook provides component-scoped state variables that are:
- ✅ **Isolated per component instance**
- ✅ **Stored in global state with unique paths**
- ✅ **Automatically reactive when used with functions**
- ✅ **Automatically cleaned up when component unmounts**

## Basic Usage

```javascript
const MyComponent = (props, context) => {
    // Create local state variables
    const [getCount, setCount] = context.newState('count', 0);
    const [getName, setName] = context.newState('name', 'Anonymous');
    
    return {
        div: {
            children: [
                // Reactive - updates when state changes
                { h1: { text: () => `Hello ${getName()}` } },
                { p: { text: () => `Count: ${getCount()}` } },
                
                // Interactive elements
                { 
                    button: { 
                        text: 'Increment',
                        onclick: () => setCount(getCount() + 1)
                    }
                },
                {
                    input: {
                        value: () => getName(),
                        oninput: (e) => setName(e.target.value)
                    }
                }
            ]
        }
    };
};
```

## API Reference

### `context.newState(key, initialValue)`

Creates a local state variable for the current component instance.

**Parameters:**
- `key` (string): The state variable name (unique within the component instance)
- `initialValue` (any): The initial value for the state variable

**Returns:**
- Array `[getter, setter]` where:
  - `getter()`: Function that returns the current state value
  - `setter(newValue)`: Function that updates the state value

**Example:**
```javascript
const [getValue, setValue] = context.newState('myValue', 'default');

// Read state
const currentValue = getValue();

// Update state
setValue('new value');
```

## State Storage

Local state is stored in the global state manager with unique paths:

```javascript
// Global state structure
{
    "app": {
        "title": "My App"  // Your regular global state
    },
    "__local": {
        "ComponentName_1": {
            "count": 5,
            "name": "Alice"
        },
        "ComponentName_2": {
            "count": 10,
            "name": "Bob"
        }
    }
}
```

### Path Pattern: `__local.{ComponentName}_{InstanceNumber}.{stateKey}`

## Intentional Reactivity

Juris uses **intentional reactivity** - you explicitly choose what should be reactive:

```javascript
const [getCount, setCount] = context.newState('count', 0);

// ✅ REACTIVE - Function wrapper makes it update when state changes
text: () => `Count: ${getCount()}`

// ❌ STATIC - Evaluated once at creation, never updates
text: `Count: ${getCount()}`
```

## Complete Examples

### Counter Component

```javascript
const Counter = (props, context) => {
    const [getCount, setCount] = context.newState('count', props.initialCount || 0);
    const [getStep, setStep] = context.newState('step', 1);
    
    return {
        div: {
            className: 'counter',
            children: [
                { 
                    h2: { text: () => `Count: ${getCount()}` }
                },
                {
                    div: {
                        children: [
                            {
                                button: {
                                    text: () => `-${getStep()}`,
                                    onclick: () => setCount(getCount() - getStep())
                                }
                            },
                            {
                                button: {
                                    text: () => `+${getStep()}`,
                                    onclick: () => setCount(getCount() + getStep())
                                }
                            }
                        ]
                    }
                },
                {
                    input: {
                        type: 'number',
                        value: () => getStep(),
                        oninput: (e) => setStep(parseInt(e.target.value) || 1)
                    }
                }
            ]
        }
    };
};
```

### Form Component

```javascript
const UserForm = (props, context) => {
    const [getName, setName] = context.newState('name', '');
    const [getEmail, setEmail] = context.newState('email', '');
    const [getIsValid, setIsValid] = context.newState('isValid', false);
    
    // Computed validation
    const validateForm = () => {
        const valid = getName().length > 0 && getEmail().includes('@');
        setIsValid(valid);
    };
    
    return {
        form: {
            children: [
                {
                    input: {
                        type: 'text',
                        placeholder: 'Name',
                        value: () => getName(),
                        oninput: (e) => {
                            setName(e.target.value);
                            validateForm();
                        }
                    }
                },
                {
                    input: {
                        type: 'email',
                        placeholder: 'Email',
                        value: () => getEmail(),
                        oninput: (e) => {
                            setEmail(e.target.value);
                            validateForm();
                        }
                    }
                },
                {
                    button: {
                        text: 'Submit',
                        disabled: () => !getIsValid(),
                        onclick: () => {
                            if (getIsValid()) {
                                console.log('Form data:', {
                                    name: getName(),
                                    email: getEmail()
                                });
                            }
                        }
                    }
                }
            ]
        }
    };
};
```

### Modal Component

```javascript
const Modal = (props, context) => {
    const [getIsOpen, setIsOpen] = context.newState('isOpen', false);
    const [getTitle, setTitle] = context.newState('title', props.title || 'Modal');
    
    return {
        div: {
            children: [
                {
                    button: {
                        text: 'Open Modal',
                        onclick: () => setIsOpen(true)
                    }
                },
                {
                    div: {
                        className: () => `modal ${getIsOpen() ? 'modal-open' : 'modal-closed'}`,
                        style: () => ({
                            display: getIsOpen() ? 'block' : 'none',
                            position: 'fixed',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            background: 'white',
                            padding: '20px',
                            border: '1px solid #ccc',
                            borderRadius: '8px'
                        }),
                        children: [
                            { h3: { text: () => getTitle() } },
                            { p: { text: 'This is modal content' } },
                            {
                                button: {
                                    text: 'Close',
                                    onclick: () => setIsOpen(false)
                                }
                            }
                        ]
                    }
                }
            ]
        }
    };
};
```

## Multiple Instances

Each component instance automatically gets its own isolated state:

```javascript
const app = new Juris({
    layout: {
        div: {
            children: [
                { Counter: { initialCount: 0 } },    // Counter_1 with count: 0
                { Counter: { initialCount: 100 } },  // Counter_2 with count: 100
                { Counter: { initialCount: -50 } }   // Counter_3 with count: -50
            ]
        }
    },
    components: { Counter }
});
```

## Debugging Local State

Access any component's local state for debugging:

```javascript
// Get specific component state
const counter1State = app.getState('__local.Counter_1.count');
const modal2IsOpen = app.getState('__local.Modal_2.isOpen');

// Get all local state
const allLocalState = app.getState('__local', {});
console.log('All component states:', allLocalState);

// Set state directly (for debugging)
app.setState('__local.Counter_1.count', 999);
```

## Best Practices

### 1. Use Local State for Component-Specific Data
```javascript
// ✅ Good - UI state specific to this component
const [getIsExpanded, setIsExpanded] = context.newState('isExpanded', false);
const [getInputValue, setInputValue] = context.newState('inputValue', '');
```

### 2. Use Global State for Shared Data
```javascript
// ✅ Good - Data shared across components
const user = () => context.getState('app.user');
const settings = () => context.getState('app.settings');
```

### 3. Combine Local and Global State
```javascript
const TodoItem = (props, context) => {
    // Local state for UI
    const [getIsEditing, setIsEditing] = context.newState('isEditing', false);
    
    // Global state for data
    const todo = () => context.getState(`todos.${props.todoId}`);
    
    const saveTodo = (newText) => {
        context.setState(`todos.${props.todoId}.text`, newText);
        setIsEditing(false);
    };
    
    return {
        div: {
            children: getIsEditing() ? [
                // Edit mode UI using local state
            ] : [
                // Display mode UI using global state
            ]
        }
    };
};
```

### 4. Always Use Functions for Reactivity
```javascript
// ✅ Reactive - updates when state changes
text: () => `Count: ${getCount()}`
className: () => getIsActive() ? 'active' : 'inactive'
style: () => ({ opacity: getIsVisible() ? 1 : 0 })

// ❌ Static - frozen at creation time
text: `Count: ${getCount()}`
className: getIsActive() ? 'active' : 'inactive'
```

## Implementation Notes

- State is automatically cleaned up when components are unmounted
- Each component type gets its own counter (Counter_1, Modal_1, UserForm_1, etc.)
- State paths are predictable and debuggable
- Works with all Juris render modes (fine-grained and batch)
- Integrates seamlessly with existing global state management

## Migration from Global State

If you have component state in global state, you can easily migrate:

```javascript
// Before - manual global state management
const MyComponent = (props, context) => {
    const componentId = `mycomponent_${Math.random()}`;
    
    // Set initial state manually
    context.setState(`components.${componentId}.count`, 0);
    
    const getCount = () => context.getState(`components.${componentId}.count`);
    const setCount = (value) => context.setState(`components.${componentId}.count`, value);
    
    // Rest of component...
};

// After - using newState hook
const MyComponent = (props, context) => {
    const [getCount, setCount] = context.newState('count', 0);
    
    // Same component logic, much cleaner!
};
```

The `newState()` hook makes Juris components as easy to write as React components while maintaining the framework's unique intentional reactivity approach!