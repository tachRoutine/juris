# Juris Plugin Submission Guidelines

> **Guidelines for creating and submitting headless components to the Juris ecosystem**

## 📋 Table of Contents

- [Overview](#overview)
- [Plugin Structure](#plugin-structure)
- [Naming Conventions](#naming-conventions)
- [Code Standards](#code-standards)
- [Documentation Requirements](#documentation-requirements)
- [Testing Guidelines](#testing-guidelines)
- [Submission Process](#submission-process)
- [Review Criteria](#review-criteria)
- [Examples](#examples)

## 🎯 Overview

Juris plugins are headless components that provide specific functionality without UI dependencies. They follow the **Headless Service Pattern** and integrate seamlessly with the Juris ecosystem.

### Plugin Types

- **Data Services** - API clients, storage adapters, caching
- **UI Utilities** - Form validation, state management, animations
- **Integration Services** - Third-party APIs, authentication, analytics
- **Developer Tools** - Debugging, performance monitoring, testing helpers

## 🏗️ Plugin Structure

### Required Files

```
juris-plugin-name/
├── README.md              # Plugin documentation
├── package.json           # NPM package configuration
├── src/
│   ├── index.js          # Main plugin export
│   ├── plugin-name.js    # Core plugin implementation
│   └── types.js          # Type definitions (optional)
├── examples/
│   ├── basic-usage.html  # Basic implementation example
│   └── advanced-usage.html # Advanced features demo
├── tests/
│   └── plugin.test.js    # Unit tests
└── LICENSE               # MIT license recommended
```

### Main Export Structure

```javascript
// src/index.js
export { default as PluginName } from './plugin-name.js';
export { PluginNameUtils } from './utils.js';

// For CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PluginName, PluginNameUtils };
}
```

## 📛 Naming Conventions

### Repository Names
- **Format:** `juris-[category]-[name]`
- **Examples:**
  - `juris-http-client`
  - `juris-form-validator`
  - `juris-analytics-tracker`
  - `juris-storage-manager`

### Component Names
- **PascalCase** for component names
- **Descriptive and specific**
- **Avoid generic names**

```javascript
// ✅ Good
const FormValidator = (props, context) => ({ ... });
const HttpClient = (props, context) => ({ ... });
const AnalyticsTracker = (props, context) => ({ ... });

// ❌ Avoid
const Helper = (props, context) => ({ ... });
const Utils = (props, context) => ({ ... });
const Manager = (props, context) => ({ ... });
```

## 💻 Code Standards

### 1. Headless Service Pattern

All plugins must follow the headless service pattern:

```javascript
const PluginName = (props, context) => ({
    onRegistered: async (props, context) => {
        // Initialization logic
        console.log('🔌 PluginName registered');
        
        // Setup cleanup
        return () => {
            console.log('🧹 PluginName cleanup');
        };
    },

    // Public API methods
    methodName: (param1, param2) => {
        // Implementation
    },

    // Event handlers
    onSomeEvent: (data) => {
        // Handle events
    }
});

export default PluginName;
```

### 2. Context Usage

Properly destructure context and use appropriate services:

```javascript
// ✅ Preferred - Destructured context
const MyPlugin = (props, { getState, setState, subscribe }) => ({
    onRegistered: () => {
        // Use destructured methods
        const currentValue = getState('my.state.path');
        setState('my.state.path', newValue);
    }
});

// ✅ Acceptable - Full context
const MyPlugin = (props, context) => ({
    onRegistered: () => {
        const currentValue = context.getState('my.state.path');
        context.setState('my.state.path', newValue);
    }
});
```

### 3. Error Handling

Implement comprehensive error handling:

```javascript
const ApiClient = (props, { setState }) => ({
    fetchData: async (url, options = {}) => {
        try {
            setState('api.loading', true);
            setState('api.error', null);
            
            const response = await fetch(url, options);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            setState('api.data', data);
            setState('api.loading', false);
            
            return data;
        } catch (error) {
            setState('api.error', error.message);
            setState('api.loading', false);
            
            if (props.onError) {
                props.onError(error);
            }
            
            throw error;
        }
    }
});
```

### 4. State Management

Follow Juris state patterns:

```javascript
// ✅ Use dot notation for nested state
setState('user.profile.name', value);
setState('api.cache.users', userData);

// ✅ Provide sensible defaults
const currentValue = getState('config.retryAttempts', 3);

// ✅ Use flat state when possible
setState('isLoading', true);
setState('lastUpdate', timestamp);
```

### 5. Props Configuration

Support flexible configuration:

```javascript
const ConfigurablePlugin = (props, context) => {
    // Provide defaults
    const config = {
        timeout: 5000,
        retries: 3,
        debug: false,
        ...props
    };

    return {
        onRegistered: () => {
            if (config.debug) {
                console.log('🐛 Debug mode enabled', config);
            }
        },

        // Use config throughout
        makeRequest: async (url) => {
            const controller = new AbortController();
            setTimeout(() => controller.abort(), config.timeout);
            
            // Implementation using config.retries, etc.
        }
    };
};
```

## 📚 Documentation Requirements

### README.md Structure

```markdown
# Juris [Plugin Name]

> Brief description of what the plugin does

## 🚀 Quick Start

\`\`\`javascript
import { PluginName } from 'juris-plugin-name';

const app = new Juris({
    components: {
        myPlugin: PluginName
    }
});
\`\`\`

## 📖 API Reference

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| timeout | number | 5000 | Request timeout in ms |
| retries | number | 3 | Number of retry attempts |

### Methods

#### methodName(param1, param2)
Description of what the method does.

**Parameters:**
- `param1` (type): Description
- `param2` (type): Description

**Returns:** Description of return value

**Example:**
\`\`\`javascript
context.myPlugin.methodName('value1', { option: true });
\`\`\`

## 💡 Usage Examples

### Basic Usage
[Include basic example]

### Advanced Usage
[Include advanced example]

## 🛠️ Integration

### With Other Plugins
[Show how it works with other plugins]

### State Management
[Explain state usage]

## 🧪 Testing

[Explain how to test the plugin]

## 🤝 Contributing

[Contribution guidelines]

## 📄 License

MIT License
```

### Inline Code Documentation

```javascript
/**
 * HTTP Client for making API requests with automatic retries
 * @param {Object} props - Configuration options
 * @param {number} [props.timeout=5000] - Request timeout in milliseconds
 * @param {number} [props.retries=3] - Number of retry attempts
 * @param {Function} [props.onError] - Error callback function
 * @param {Object} context - Juris context with state management
 */
const HttpClient = (props, context) => ({
    /**
     * Makes a GET request and stores result in state
     * @param {string} url - The URL to fetch
     * @param {Object} data - Query parameters
     * @param {string} statePath - State path to store the response
     * @param {Object} [options] - Additional fetch options
     * @returns {Promise<string>} The response data
     * @example
     * await context.client.getHtml('/api/users', {page: 1}, 'users.list');
     */
    getHtml: async (url, data, statePath, options) => {
        // Implementation
    }
});
```

## 🧪 Testing Guidelines

### Required Test Coverage

1. **Basic functionality tests**
2. **Error handling tests**
3. **State management tests**
4. **Configuration options tests**
5. **Cleanup tests**

### Test Example

```javascript
// tests/plugin.test.js
import { describe, it, expect, beforeEach } from 'your-test-framework';
import { PluginName } from '../src/index.js';

describe('PluginName', () => {
    let mockContext;
    let plugin;

    beforeEach(() => {
        mockContext = {
            getState: jest.fn(),
            setState: jest.fn(),
            subscribe: jest.fn()
        };
        
        plugin = PluginName({}, mockContext);
    });

    it('should register successfully', async () => {
        expect(plugin.onRegistered).toBeDefined();
        
        const cleanup = await plugin.onRegistered({}, mockContext);
        expect(typeof cleanup).toBe('function');
    });

    it('should handle errors gracefully', async () => {
        const errorCallback = jest.fn();
        const pluginWithError = PluginName({ onError: errorCallback }, mockContext);
        
        // Test error scenarios
        await expect(pluginWithError.someMethod()).rejects.toThrow();
        expect(errorCallback).toHaveBeenCalled();
    });

    it('should manage state correctly', () => {
        plugin.updateSomething('test value');
        
        expect(mockContext.setState).toHaveBeenCalledWith(
            'expected.state.path', 
            'test value'
        );
    });
});
```

## 📤 Submission Process

### 1. Pre-Submission Checklist

- [ ] Plugin follows headless service pattern
- [ ] Comprehensive README with examples
- [ ] All code is documented
- [ ] Tests cover main functionality
- [ ] Examples work correctly
- [ ] No console errors or warnings
- [ ] Performance considerations addressed

### 2. Repository Setup

```bash
# Create repository
git init
git add .
git commit -m "Initial commit: Add [Plugin Name]"

# Add origin (your GitHub repo)
git remote add origin https://github.com/username/juris-plugin-name.git
git push -u origin main
```

### 3. Package.json Configuration

```json
{
  "name": "juris-plugin-name",
  "version": "1.0.0",
  "description": "Brief description of the plugin",
  "main": "src/index.js",
  "type": "module",
  "keywords": [
    "juris",
    "plugin",
    "headless",
    "component",
    "your-category"
  ],
  "author": "Your Name <email@example.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/username/juris-plugin-name.git"
  },
  "bugs": {
    "url": "https://github.com/username/juris-plugin-name/issues"
  },
  "homepage": "https://github.com/username/juris-plugin-name#readme",
  "peerDependencies": {
    "juris": ">=1.0.0"
  },
  "files": [
    "src/",
    "examples/",
    "README.md",
    "LICENSE"
  ]
}
```

### 4. GitHub Submission

1. **Open an issue** in the main Juris repository with:
   - Plugin name and description
   - Link to your repository
   - Category (data, ui, integration, tools)
   - Brief explanation of functionality

2. **Include in the issue:**
   - [ ] Link to working examples
   - [ ] Test results
   - [ ] Performance considerations
   - [ ] Breaking changes (if any)

## ✅ Review Criteria

### Code Quality
- [ ] Follows Juris patterns and conventions
- [ ] Clean, readable, and well-documented code
- [ ] Proper error handling
- [ ] No console errors or warnings

### Functionality
- [ ] Solves a real problem
- [ ] Works as documented
- [ ] Doesn't conflict with core Juris functionality
- [ ] Performance considerations addressed

### Documentation
- [ ] Clear and comprehensive README
- [ ] Working examples provided
- [ ] API documentation complete
- [ ] Installation and usage instructions

### Testing
- [ ] Basic functionality tested
- [ ] Error cases covered
- [ ] Examples work correctly
- [ ] No breaking changes to Juris core

## 📊 Examples

### Simple Plugin Example

```javascript
// src/local-storage.js
const LocalStorage = (props, { setState, subscribe }) => {
    const prefix = props.prefix || 'juris_';
    
    return {
        onRegistered: () => {
            console.log('💾 LocalStorage plugin registered');
            
            // Subscribe to state changes and persist
            const unsubscribe = subscribe('*', (path, value) => {
                if (props.persist && props.persist.includes(path)) {
                    localStorage.setItem(`${prefix}${path}`, JSON.stringify(value));
                }
            });
            
            return () => {
                unsubscribe();
                console.log('💾 LocalStorage plugin cleanup');
            };
        },
        
        save: (key, value) => {
            localStorage.setItem(`${prefix}${key}`, JSON.stringify(value));
        },
        
        load: (key, defaultValue = null) => {
            try {
                const item = localStorage.getItem(`${prefix}${key}`);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('Failed to load from localStorage:', error);
                return defaultValue;
            }
        },
        
        remove: (key) => {
            localStorage.removeItem(`${prefix}${key}`);
        },
        
        clear: () => {
            Object.keys(localStorage)
                .filter(key => key.startsWith(prefix))
                .forEach(key => localStorage.removeItem(key));
        }
    };
};

export default LocalStorage;
```

### Usage Example

```javascript
// Basic usage
const app = new Juris({
    components: {
        storage: LocalStorage
    },
    props: {
        prefix: 'myapp_',
        persist: ['user.preferences', 'app.settings']
    }
});

// In components
app.enhance('.settings-form', (props, { storage }) => ({
    onSubmit: (e) => {
        const formData = new FormData(e.target);
        const settings = Object.fromEntries(formData);
        
        storage.save('user_settings', settings);
    }
}));
```

## 🎯 Best Practices

### Performance
- Keep plugins lightweight
- Avoid unnecessary computations in hot paths
- Use cleanup functions to prevent memory leaks
- Consider lazy loading for heavy operations

### Compatibility
- Test with different browsers
- Ensure ES6+ compatibility
- Provide fallbacks for missing APIs
- Document browser requirements

### Security
- Validate all inputs
- Sanitize data before storage
- Use secure defaults
- Document security considerations

### User Experience
- Provide helpful error messages
- Support graceful degradation
- Include loading states where appropriate
- Offer configuration options

---

## 🤝 Community

Join the Juris community for support and collaboration:

- **GitHub Discussions:** [Ask questions and share ideas]
- **Issues:** [Report bugs and request features]
- **Examples:** [Share your plugin implementations]

## 📄 License

All submitted plugins should use MIT License or compatible open-source license.

---

**Happy coding!** 🚀 Thank you for contributing to the Juris ecosystem!