# Juris HTTP Client

> **A headless HTTP client component for Juris applications**

Simple, declarative HTTP requests that store responses directly in Juris state. Supports both HTML and JSON responses with automatic state management.

## 🚀 Quick Start

```javascript
const app = new Juris({
    components: {
        client: HttpClient
    }
});
```

## 📖 API Reference

### HTML Methods

Store HTML responses as strings in state:

```javascript
// GET request with query parameters
context.client.getHtml('/api/users', {page: 1}, 'users.list');

// POST request with data
context.client.postHtml('/api/users', {name: 'John'}, 'users.created');

// PUT request (full update)
context.client.updateHtml('/api/users/123', {name: 'Jane'}, 'users.updated');

// DELETE request
context.client.deleteHtml('/api/users/123', {}, 'users.deleted');

// PATCH request (partial update)
context.client.patchHtml('/api/users/123', {status: 'active'}, 'users.patched');
```

### JSON Methods

Store JSON responses as strings in state:

```javascript
// GET JSON data
context.client.getJson('/api/users', {filter: 'active'}, 'users.data');

// POST JSON data
context.client.postJson('/api/users', {name: 'John', email: 'john@example.com'}, 'users.response');

// PUT JSON data
context.client.updateJson('/api/users/123', {name: 'Jane'}, 'users.updated');

// DELETE with JSON response
context.client.deleteJson('/api/users/123', {}, 'users.deleteResponse');

// PATCH JSON data
context.client.patchJson('/api/users/123', {lastLogin: new Date()}, 'users.patched');
```

## 📝 Method Signatures

All methods follow the same pattern:

```javascript
methodName(url, data, statePath, options?)
```

- **`url`** (string): The endpoint URL
- **`data`** (object): Request data (query params for GET/DELETE, body for POST/PUT/PATCH)
- **`statePath`** (string): Dot-notation path in Juris state to store response
- **`options`** (object, optional): Additional fetch options

## 🔧 Request Behavior

### GET and DELETE Requests
Data is automatically converted to query parameters:

```javascript
// This request:
context.httpClient.getHtml('/api/users', {page: 1, limit: 10}, 'users.list');

// Becomes:
// GET /api/users?page=1&limit=10
```

### POST, PUT, and PATCH Requests
Data is sent as JSON in the request body:

```javascript
// This request:
context.httpClient.postJson('/api/users', {name: 'John', email: 'john@example.com'}, 'users.created');

// Sends JSON body:
// {"name": "John", "email": "john@example.com"}
```

## 🎯 State Management

Responses are automatically stored in Juris state as strings:

```javascript
// After this request:
context.httpClient.getHtml('/api/users', {}, 'users.list');

// You can access the HTML in components:
app.enhance('.user-container', (props, { getState }) => ({
    innerHTML: () => getState('users.list')
}));
```

For JSON responses stored as strings, parse when needed:

```javascript
app.enhance('.user-data', (props, { getState }) => {
    const jsonString = getState('users.data');
    const userData = jsonString ? JSON.parse(jsonString) : null;
    
    return {
        textContent: () => userData ? userData.name : 'Loading...'
    };
});
```

## ⚙️ Configuration

### Custom Headers

```javascript
context.client.postJson('/api/users', userData, 'users.created', {
    headers: {
        'Authorization': 'Bearer token123',
        'X-Custom-Header': 'value'
    }
});
```

### Error Handling

Pass an `onError` callback when registering the component:

```javascript
const app = new Juris({
    components: {
        client: HttpClient
    },
    props: {
        onError: (error, method) => {
            console.error(`${method} failed:`, error);
            // Custom error handling logic
        }
    }
});
```

## 💡 Usage Examples

### Loading User List

```javascript
// Headless service that loads users when registered
const UserListLoader = (props, { client }) => ({
    onRegistered: () => {
        // Load users on service registration
        client.getHtml('/api/users', {}, 'users.list');
    }
});

// Enhancement that displays the user list
app.enhance('.user-list', (props, { getState }) => ({
    innerHTML: () => getState('users.list', '<p>Loading users...</p>')
}));
```

### Creating New User

```javascript
// Enhancement for form submission
app.enhance('.user-form', (props, { useState, client }) => {
    const [getName, setName] = useState('form.name', '');
    const [getEmail, setEmail] = useState('form.email', '');
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            await client.postJson('/api/users', {
                name: getName(),
                email: getEmail()
            }, 'users.created');
            
            // Clear form on success
            setName('');
            setEmail('');
        } catch (error) {
            console.error('Failed to create user:', error);
        }
    };
    
    return {
        onSubmit: handleSubmit,
        querySelector: {
            'input[name="name"]': {
                value: () => getName(),
                onInput: (e) => setName(e.target.value)
            },
            'input[name="email"]': {
                value: () => getEmail(),
                onInput: (e) => setEmail(e.target.value)
            }
        }
    };
});
```

### Real-time Data Updates

```javascript
// Headless service for polling data
const StatsPoller = (props, { client }) => {
    let intervalId = null;
    
    return {
        onRegistered: () => {
            // Initial load
            client.getJson('/api/stats', {}, 'dashboard.stats');
            
            // Refresh every 30 seconds
            intervalId = setInterval(() => {
                client.getJson('/api/stats', {}, 'dashboard.stats');
            }, 30000);
            
            // Cleanup function
            return () => {
                if (intervalId) {
                    clearInterval(intervalId);
                }
            };
        }
    };
};

// Enhancement that reactively displays the stats
app.enhance('.live-stats', (props, { getState }) => ({
    textContent: () => {
        const statsJson = getState('dashboard.stats');
        if (!statsJson) return 'Loading statistics...';
        
        const stats = JSON.parse(statsJson);
        return `Users: ${stats.userCount} | Orders: ${stats.orderCount}`;
    }
}));
```

## 🔒 Security Notes

- All requests include `Content-Type: application/json` by default
- CORS policies apply as with any fetch request
- Always validate and sanitize data on your server
- Consider implementing request timeouts for production use

## 🎨 Integration with Juris Patterns

### Progressive Enhancement Pattern

```javascript
// Enhance existing HTML with dynamic data loading
app.enhance('.product-details', (props, { client, getState }) => {
    const productId = props.element.dataset.productId;
    
    return {
        onRegistered: () => {
            if (productId) {
                client.getHtml(`/api/products/${productId}`, {}, `products.${productId}`);
            }
        },
        
        innerHTML: () => getState(`products.${productId}`, props.element.innerHTML)
    };
});
```

### Component-First Pattern

```javascript
// Headless data loader service
const DataLoader = (props, { client }) => ({
    onRegistered: () => {
        // Load data when service is registered
        if (props.url && props.statePath) {
            client.getJson(props.url, props.params || {}, props.statePath);
        }
    },
    
    // Expose reload method for manual refreshing
    reload: () => {
        if (props.url && props.statePath) {
            client.getJson(props.url, props.params || {}, props.statePath);
        }
    }
});

// Enhancement that displays the loaded data
app.enhance('.data-display', (props, { getState }) => {
    const statePath = props.element.dataset.statePath;
    
    return {
        textContent: () => {
            const dataJson = getState(statePath);
            if (!dataJson) return 'Loading...';
            
            const data = JSON.parse(dataJson);
            return data.name || 'No data';
        }
    };
});
```

## 🤝 Contributing

Found a bug or want to contribute? Please check the main Juris repository for contribution guidelines.

## 📄 License

Same license as Juris framework.