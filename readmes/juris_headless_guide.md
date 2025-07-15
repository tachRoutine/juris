# Juris Headless Components - Complete Developer Guide

## Core Concepts

### Headless vs Traditional Components

**Traditional Components:**
- Tightly coupled to DOM structure
- Mix logic with presentation
- Limited reusability across different UIs

**Juris Headless Components:**
- Pure logic and state management
- Complete separation of concerns
- Universal reusability across any UI framework
- Cross-platform compatibility

### Headless Components vs Services

While headless components and services may seem similar, they serve different architectural purposes in Juris:

#### Headless Components

**Definition**: Reactive, stateful entities that participate in the component lifecycle and state management system.

**Characteristics:**
- **Lifecycle Management**: Full lifecycle hooks (onRegister, onUpdate, onUnregister)
- **State Integration**: Deep integration with Juris's reactive state system
- **Context Injection**: Automatic injection into component contexts
- **Instance Management**: Managed instances with cleanup handling
- **Reactive Dependencies**: Automatic dependency tracking and updates

```javascript
// Headless Component Example
const userProfileComponent = (props, context) => {
  const { getState, setState, subscribe } = context;
  
  // Reactive state management
  const profileData = () => getState('user.profile', {});
  
  // Subscribe to changes
  const unsubscribe = subscribe('user.profile', (newProfile) => {
    // React to profile changes
    validateProfile(newProfile);
  });
  
  return {
    api: {
      updateProfile: async (data) => {
        setState('user.profile.updating', true);
        try {
          const updated = await updateUserProfile(data);
          setState('user.profile', updated);
          setState('user.profile.lastUpdated', Date.now());
        } finally {
          setState('user.profile.updating', false);
        }
      },
      
      getProfile: () => profileData(),
      isUpdating: () => getState('user.profile.updating', false)
    },
    
    hooks: {
      onRegister: () => {
        // Initialize profile data
        loadInitialProfile();
      },
      
      onUnregister: () => {
        // Cleanup subscriptions
        unsubscribe();
      }
    }
  };
};
```

#### Services

**Definition**: Stateless utility functions or objects that provide specific functionality without lifecycle management.

**Characteristics:**
- **Stateless Operations**: Pure functions or utility objects
- **Direct Injection**: Provided via the services configuration
- **No Lifecycle**: No managed lifecycle or cleanup
- **Immediate Availability**: Available from framework initialization
- **Functional Approach**: Focus on operations rather than state

```javascript
// Service Example
class HttpService {
  constructor(config) {
    this.baseURL = config.baseURL;
    this.defaultHeaders = config.headers || {};
  }
  
  async get(endpoint, options = {}) {
    return this.request('GET', endpoint, null, options);
  }
  
  async post(endpoint, data, options = {}) {
    return this.request('POST', endpoint, data, options);
  }
  
  async request(method, endpoint, data, options) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = { ...this.defaultHeaders, ...options.headers };
    
    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }
}

// Usage in Juris configuration
const juris = new Juris({
  services: {
    http: new HttpService({ 
      baseURL: '/api',
      headers: { 'Content-Type': 'application/json' }
    }),
    logger: new LoggerService(),
    validator: new ValidationService()
  }
});
```

#### When to Use Each

**Use Headless Components When:**
- You need reactive state management
- Component lifecycle management is required
- You want automatic dependency tracking
- The functionality should be lazily initialized
- You need cleanup on unmount
- The logic is stateful and evolving
- **Grouping multi-domain functionality that handles the same data**

```javascript
// Good headless component use case: Multi-domain user management
const UserDomainComponent = (props, context) => {
  const { getState, setState, subscribe, httpClient } = context;
  
  // All user-related functionality grouped together
  return {
    api: {
      // Authentication domain
      login: async (credentials) => {
        setState('user.auth.loading', true);
        try {
          const response = await httpClient.post('/auth/login', credentials);
          const tokens = response.data;
          setState('user.auth.tokens', tokens);
          setState('user.auth.isAuthenticated', true);
          setState('user.auth.lastLogin', Date.now());
        } finally {
          setState('user.auth.loading', false);
        }
      },
      
      logout: () => {
        setState('user.auth.tokens', null);
        setState('user.auth.isAuthenticated', false);
        setState('user.profile', null);
        setState('user.preferences', {});
      },
      
      // Profile management domain
      updateProfile: async (profileData) => {
        setState('user.profile.updating', true);
        try {
          const response = await httpClient.put('/user/profile', profileData);
          const updated = response.data;
          setState('user.profile.data', updated);
          setState('user.profile.lastUpdated', Date.now());
          
          // Cross-domain effect: update auth user info
          const currentAuth = getState('user.auth.tokens');
          if (currentAuth) {
            setState('user.auth.userInfo', {
              name: updated.name,
              email: updated.email
            });
          }
        } finally {
          setState('user.profile.updating', false);
        }
      },
      
      // Preferences domain
      updatePreferences: async (preferences) => {
        setState('user.preferences.updating', true);
        try {
          const response = await httpClient.put('/user/preferences', preferences);
          const updated = response.data;
          setState('user.preferences.data', updated);
          
          // Cross-domain effect: apply theme preference
          if (updated.theme) {
            setState('app.theme', updated.theme);
          }
        } finally {
          setState('user.preferences.updating', false);
        }
      },
      
      // Notifications domain
      markNotificationRead: (notificationId) => {
        const notifications = getState('user.notifications', []);
        const updated = notifications.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        );
        setState('user.notifications', updated);
        setState('user.notifications.unreadCount', 
          updated.filter(n => !n.read).length
        );
      },
      
      // Cross-domain data access
      getUserData: () => ({
        auth: getState('user.auth', {}),
        profile: getState('user.profile.data', {}),
        preferences: getState('user.preferences.data', {}),
        notifications: getState('user.notifications', []),
        isAuthenticated: getState('user.auth.isAuthenticated', false),
        isLoading: getState('user.profile.updating', false) || 
                   getState('user.auth.loading', false)
      }),
      
      // Aggregate operations across domains
      initializeUser: async (userId) => {
        setState('user.initializing', true);
        try {
          // Load data from multiple domains
          const [profileRes, preferencesRes, notificationsRes] = await Promise.all([
            httpClient.get(`/user/${userId}/profile`),
            httpClient.get(`/user/${userId}/preferences`),
            httpClient.get(`/user/${userId}/notifications`)
          ]);
          
          // Set all related data atomically
          setState('user.profile.data', profileRes.data);
          setState('user.preferences.data', preferencesRes.data);
          setState('user.notifications', notificationsRes.data);
          setState('user.notifications.unreadCount', 
            notificationsRes.data.filter(n => !n.read).length
          );
          setState('user.initialized', true);
        } finally {
          setState('user.initializing', false);
        }
      }
    },
    
    hooks: {
      onRegister: () => {
        // Subscribe to cross-domain changes
        subscribe('user.auth.isAuthenticated', (isAuth) => {
          if (!isAuth) {
            // Clear all user data when logged out
            setState('user.profile', null);
            setState('user.preferences', {});
            setState('user.notifications', []);
          }
        });
      }
    }
  };
};
```

**Use Services When:**
- You need pure utility functions
- No state management is required
- The functionality is stateless
- You want immediate availability
- The operations are computational or transformative

```javascript
// Good service use case: Data transformation utilities
class DataTransformService {
  normalize(data, schema) {
    // Pure transformation logic
    return this.applySchema(data, schema);
  }
  
  validate(data, rules) {
    // Stateless validation
    return this.checkRules(data, rules);
  }
  
  sanitize(input, options = {}) {
    // Pure sanitization
    return this.cleanInput(input, options);
  }
  
  format(value, type, options = {}) {
    // Formatting utilities
    switch (type) {
      case 'currency': return this.formatCurrency(value, options);
      case 'date': return this.formatDate(value, options);
      case 'number': return this.formatNumber(value, options);
      default: return value;
    }
  }
}
```

#### Hybrid Approach

You can combine both patterns for maximum flexibility:

```javascript
// Service for pure operations
class UserService {
  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  
  hashPassword(password) {
    // Pure password hashing
    return bcrypt.hash(password, 10);
  }
  
  generateUserSlug(name) {
    return name.toLowerCase().replace(/\s+/g, '-');
  }
}

// Headless component for stateful user management
const userManagerComponent = (props, context) => {
  const { getState, setState, userService } = context;
  
  return {
    api: {
      createUser: async (userData) => {
        // Use service for validation
        if (!userService.validateEmail(userData.email)) {
          throw new Error('Invalid email format');
        }
        
        // Use component for state management
        setState('user.creating', true);
        
        try {
          const hashedPassword = await userService.hashPassword(userData.password);
          const slug = userService.generateUserSlug(userData.name);
          
          const newUser = {
            ...userData,
            password: hashedPassword,
            slug,
            createdAt: Date.now()
          };
          
          const created = await createUserAPI(newUser);
          setState('user.current', created);
          setState('user.lastCreated', Date.now());
          
          return created;
        } finally {
          setState('user.creating', false);
        }
      },
      
      getCurrentUser: () => getState('user.current', null),
      isCreating: () => getState('user.creating', false)
    }
  };
};

// Configuration combining both
const juris = new Juris({
  services: {
    userService: new UserService()
  },
  headlessComponents: {
    userManager: userManagerComponent
  }
});
```

#### Architectural Decision Matrix

| Criteria | Headless Component | Service |
|----------|-------------------|---------|
| State Management | ✅ Reactive state | ❌ Stateless |
| Lifecycle Hooks | ✅ Full lifecycle | ❌ No lifecycle |
| Dependency Tracking | ✅ Automatic | ❌ Manual |
| Lazy Loading | ✅ On-demand init | ❌ Immediate |
| Cleanup Required | ✅ Automatic | ❌ Not applicable |
| Pure Functions | ❌ Can be stateful | ✅ Encouraged |
| Performance | 🔶 Moderate overhead | ✅ Minimal overhead |
| Testability | ✅ Easy to test | ✅ Easy to test |
| Reusability | 🔶 Context dependent | ✅ Highly reusable |
| Multi-Domain Coordination | ✅ Excellent | ❌ Poor |
| Shared Data Management | ✅ Centralized | ❌ Fragmented |
| Cross-Domain Effects | ✅ Automatic | ❌ Manual coordination |

### Component Types in Juris

1. **Standard Components**: DOM-rendering components with lifecycle hooks
2. **Headless Components**: Logic-only components with exposed APIs and state management
3. **Services**: Stateless utility functions and classes
4. **Hybrid Components**: Components that can operate in both headless and rendering modes

## Architecture Overview

### HeadlessManager Structure

The HeadlessManager is the core orchestrator for headless components:

```javascript
class HeadlessManager {
  constructor(juris) {
    this.juris = juris;
    this.components = new Map();     // Component definitions
    this.instances = new Map();      // Active instances
    this.context = {};              // Shared context
    this.initQueue = new Set();     // Auto-initialization queue
    this.lifecycleHooks = new Map(); // Lifecycle management
  }
}
```

### Registration Process

Components can be registered in multiple ways:

**Method 1: Direct Registration**
```javascript
headlessManager.register(name, componentFn, options = {})
```

**Method 2: Via Juris Instance**
```javascript
juris.registerHeadlessComponent(name, componentFn, options = {})
```

**Method 3: During Juris Initialization**
```javascript
const juris = new Juris({
  headlessComponents: {
    componentName: {
      fn: componentFn,
      options: { autoInit: true }
    }
  }
});
```

**Parameters:**
- `name`: Unique identifier for the component
- `componentFn`: Factory function that returns component instance
- `options`: Configuration object with optional `autoInit` flag

### Component Factory Function

Every headless component is defined as a factory function:

```javascript
(props, context) => {
  // Component logic here
  return {
    api: {}, // Public interface (required)
    hooks: {} // Lifecycle hooks (optional)
  };
}
```

### Basic Headless Component Structure

```javascript
const HeadlessComponent = (props, context) => {
  // Use context for state management and services
  const { getState, setState } = context;
  
  return {
    // Required: Public API
    api: {
      doSomething: () => {
        // Component logic here
      }
    },
    
    // Optional: Lifecycle hooks
    hooks: {
      onRegister: () => {
        console.log('Component registered');
      },
      
      onUnregister: () => {
        console.log('Component cleanup');
      }
    }
  };
};
```

### Minimal Headless Component (API only)

```javascript
// Simplest form - just API, no hooks
const simpleHeadlessComponent = (props, context) => {
  const { getState, setState } = context;
  
  return {
    api: {
      getValue: () => getState('simple.value', props.defaultValue || ''),
      setValue: (value) => setState('simple.value', value)
    }
    // No hooks needed for simple components
  };
};
```

### Hooks-Only Component (No Public API)

```javascript
// Component that only provides lifecycle behavior
const lifecycleOnlyComponent = (props, context) => {
  return {
    api: {}, // Empty API - component doesn't expose methods
    
    hooks: {
      onRegister: () => {
        // Set up global listeners, initialize background processes
        window.addEventListener('beforeunload', handleBeforeUnload);
        startBackgroundSync();
      },
      
      onUnregister: () => {
        // Cleanup global listeners
        window.removeEventListener('beforeunload', handleBeforeUnload);
        stopBackgroundSync();
      }
    }
  };
};
```

### Component Structure Patterns

**1. Service Pattern (Stateless utilities)**
```javascript
const UtilityService = (props, context) => {
  return {
    api: {
      formatDate: (date) => new Intl.DateTimeFormat().format(date),
      validateEmail: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
      generateId: () => Math.random().toString(36).substr(2, 9)
    }
    // No hooks needed for stateless utilities
  };
};
```

**2. Manager Pattern (Stateful coordination)**
```javascript
const DataManager = (props, context) => {
  const { getState, setState, subscribe } = context;
  
  return {
    api: {
      // State accessors
      getData: (key) => getState(`data.${key}`),
      setData: (key, value) => setState(`data.${key}`, value),
      
      // Operations
      clearAll: () => setState('data', {}),
      export: () => ({ ...getState('data', {}) })
    },
    
    hooks: {
      onRegister: () => {
        // Initialize default data structure
        setState('data', props.initialData || {});
      }
    }
  };
};
```

**3. Controller Pattern (Complex logic)**
```javascript
const WorkflowController = (props, context) => {
  const { getState, setState, executeBatch } = context;
  
  return {
    api: {
      startWorkflow: async (workflowId) => {
        executeBatch(() => {
          setState('workflow.current', workflowId);
          setState('workflow.status', 'running');
          setState('workflow.startTime', Date.now());
        });
        
        // Execute workflow steps...
      },
      
      getStatus: () => getState('workflow.status', 'idle'),
      getCurrentStep: () => getState('workflow.currentStep', 0)
    },
    
    hooks: {
      onRegister: () => {
        setState('workflow.status', 'idle');
        setState('workflow.steps', []);
      },
      
      onUnregister: () => {
        // Cancel any running workflows
        if (getState('workflow.status') === 'running') {
          setState('workflow.status', 'cancelled');
        }
      }
    }
  };
};
```

### Component Structure Guidelines

**Required Elements:**
- Factory function accepting `(props, context)`
- Return object with `api` property (even if empty: `api: {}`)

**Optional Elements:**
- `hooks` object with lifecycle methods
- `hooks.onRegister` - called immediately after initialization
- `hooks.onUnregister` - called during cleanup/reinitialization

**Best Practices:**
- Always return consistent structure (`{ api, hooks }`)
- Keep `api` focused on public interface only
- Use `hooks.onRegister` for initialization that needs lifecycle management
- Use `hooks.onUnregister` for cleanup (subscriptions, timers, connections)
- Make `hooks` optional for simple components
- Destructure context for cleaner code

## Headless Component Lifecycle

### Registration Phase

```javascript
juris.registerHeadlessComponent('dataManager', (props, context) => {
  const { getState, setState, subscribe } = context;
  
  return {
    api: {
      loadData: async (endpoint) => { /* implementation */ },
      getData: (key) => getState(`data.${key}`),
      clearCache: () => setState('data', {})
    },
    hooks: {
      onRegister: () => console.log('DataManager registered'),
      onUnregister: () => console.log('DataManager cleaned up')
    }
  };
});
```

### Initialization Phase

Components can be initialized in several ways:

**Manual Initialization:**
```javascript
const dataManager = juris.initializeHeadlessComponent('dataManager', {
  cacheTimeout: 5000,
  endpoint: '/api/data'
});
```

## Manual Headless Component Initialization

While autoInit components start automatically, manual initialization gives you complete control over when and how components are created. Here are the key patterns:

### Basic Manual Initialization

```javascript
// 1. Register the component (without autoInit)
juris.registerHeadlessComponent('userManager', userManagerComponent);

// 2. Initialize manually when needed
const userManager = juris.initializeHeadlessComponent('userManager');

// 3. Use the API
userManager.api.loadUser(123);
```

### Manual Initialization with Props

```javascript
// Initialize with custom configuration
const dataAPI = juris.initializeHeadlessComponent('dataService', {
  apiEndpoint: 'https://api.example.com',
  timeout: 5000,
  retries: 3
});

console.log(dataAPI.api.getEndpoint()); // 'https://api.example.com'
```

### Conditional Initialization

```javascript
// Initialize different components based on conditions
const initializeUserFeatures = async (userId) => {
  const user = await fetchUser(userId);
  
  if (user.subscription === 'premium') {
    const premium = juris.initializeHeadlessComponent('premiumFeatures', {
      userId: user.id,
      features: user.enabledFeatures
    });
    return premium.api;
  } else {
    const basic = juris.initializeHeadlessComponent('basicFeatures', {
      userId: user.id
    });
    return basic.api;
  }
};

// Usage
const userFeatures = await initializeUserFeatures(123);
userFeatures.getAvailableFeatures();
```

### Lazy Initialization Pattern

```javascript
// Create a lazy loader for expensive components
class LazyComponentManager {
  constructor(juris) {
    this.juris = juris;
    this.cache = new Map();
  }
  
  async getComponent(name, props = {}) {
    if (this.cache.has(name)) {
      return this.cache.get(name);
    }
    
    console.log(`Lazy loading component: ${name}`);
    const component = this.juris.initializeHeadlessComponent(name, props);
    this.cache.set(name, component);
    
    return component;
  }
}

// Setup
const lazyLoader = new LazyComponentManager(juris);

// Initialize only when needed
const handleAnalyticsRequest = async () => {
  const analytics = await lazyLoader.getComponent('heavyAnalytics', {
    dataset: 'user-behavior'
  });
  
  return analytics.api.generateReport();
};
```

### Error Handling in Manual Initialization

```javascript
const safeInitializeComponent = (componentName, props = {}) => {
  try {
    const component = juris.initializeHeadlessComponent(componentName, props);
    
    if (!component || !component.api) {
      throw new Error(`Component '${componentName}' failed to initialize properly`);
    }
    
    console.log(`✓ ${componentName} initialized successfully`);
    return component.api;
    
  } catch (error) {
    console.error(`✗ Failed to initialize ${componentName}:`, error.message);
    
    // Return fallback API
    return createFallbackAPI(componentName);
  }
};

// Usage with error handling
const analytics = safeInitializeComponent('analytics', { trackingId: 'GA-123' });
```

### Checking Component Status

```javascript
const initializeIfNeeded = (componentName, props = {}) => {
  const status = juris.getHeadlessStatus();
  
  // Check if already initialized
  if (status.initialized.includes(componentName)) {
    console.log(`${componentName} already initialized`);
    return juris.headlessManager.getInstance(componentName);
  }
  
  // Check if registered
  if (!status.registered.includes(componentName)) {
    throw new Error(`Component '${componentName}' is not registered`);
  }
  
  // Initialize if needed
  return juris.initializeHeadlessComponent(componentName, props);
};
```

### Multiple API Access Patterns

```javascript
// Initialize component
const component = juris.initializeHeadlessComponent('myService', props);

// Access pattern 1: Direct from initialization
component.api.doSomething();

// Access pattern 2: From headlessAPIs
const { myService } = juris.headlessAPIs;
myService.doSomething();

// Access pattern 3: From context (in other components)
const otherComponent = (props, context) => {
  const { myService } = context;
  return {
    api: {
      useService: () => myService.doSomething()
    }
  };
};

// Access pattern 4: Direct getter
const api = juris.headlessManager.getAPI('myService');
api.doSomething();
```

## Consuming Headless Component APIs

Once headless components are initialized, their APIs can be consumed in multiple ways depending on your use case:

### 1. Direct API Access

```javascript
// After initialization, APIs are immediately available
const userService = juris.initializeHeadlessComponent('userService');

// Direct method calls
const user = await userService.api.fetchUser(123);
const isValid = userService.api.validateEmail('user@example.com');

// Access state getters
const currentUser = userService.api.getCurrentUser();
const isLoading = userService.api.isLoading();
```

### 2. Context-Based Consumption (Recommended)

```javascript
// In standard components - APIs injected automatically
const userProfileComponent = (props, context) => {
  const { userService, dataService } = context; // Auto-injected APIs
  
  return {
    render: () => ({
      div: {
        children: [
          {
            h1: { text: () => `Welcome ${userService.getCurrentUser()?.name || 'Guest'}` }
          },
          {
            button: {
              text: 'Load Profile',
              onclick: async () => {
                const data = await dataService.fetch('/user/profile');
                userService.updateProfile(data);
              }
            }
          }
        ]
      }
    })
  };
};

// In headless components - access via context
const notificationComponent = (props, context) => {
  const { userService, emailService } = context;
  
  return {
    api: {
      sendWelcomeEmail: async (userId) => {
        const user = await userService.fetchUser(userId);
        return emailService.send({
          to: user.email,
          template: 'welcome',
          data: { name: user.name }
        });
      }
    }
  };
};
```

### 3. Global Access Pattern

```javascript
// Access from anywhere in your application
const handleGlobalAction = async () => {
  // Get all available APIs
  const apis = juris.headlessManager.getAllAPIs();
  
  // Or access specific APIs
  const { userService, cartService, paymentService } = juris.headlessAPIs;
  
  // Coordinate multiple services
  const user = userService.getCurrentUser();
  const cartItems = cartService.getItems();
  
  if (user && cartItems.length > 0) {
    await paymentService.processPayment({
      userId: user.id,
      items: cartItems,
      total: cartService.getTotal()
    });
  }
};

// In vanilla JavaScript (outside framework)
window.addEventListener('beforeunload', () => {
  const { analytics } = window.juris.headlessAPIs;
  analytics.track('page_exit', { timestamp: Date.now() });
});
```

### 4. Reactive Consumption with State Subscriptions

```javascript
// React to headless component state changes
const dashboardComponent = (props, context) => {
  const { userService, subscribe } = context;
  
  // Subscribe to user state changes
  const unsubscribe = subscribe('user.profile', (newProfile) => {
    console.log('Profile updated:', newProfile);
    // Trigger UI updates automatically
  });
  
  return {
    api: {
      refreshDashboard: () => {
        // Access current state
        const user = userService.getCurrentUser();
        const isLoading = userService.isLoading();
        
        return {
          user,
          isLoading,
          lastUpdated: Date.now()
        };
      }
    },
    
    hooks: {
      onUnregister: () => unsubscribe()
    }
  };
};
```

### 5. Framework Integration Patterns

```javascript
// React Hook for Juris headless components
const useJurisHeadless = (componentName) => {
  const [api, setApi] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    try {
      const instance = window.juris.initializeHeadlessComponent(componentName);
      setApi(instance.api);
    } catch (error) {
      console.error(`Failed to initialize ${componentName}:`, error);
    } finally {
      setLoading(false);
    }
  }, [componentName]);
  
  return { api, loading };
};

// React component using headless service
function UserProfile() {
  const { api: userService, loading } = useJurisHeadless('userService');
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    if (userService) {
      userService.getCurrentUser().then(setUser);
    }
  }, [userService]);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>Welcome {user?.name}</h1>
      <button onClick={() => userService.refreshProfile()}>
        Refresh
      </button>
    </div>
  );
}

// Vue.js composition API
function useUserService() {
  const userService = computed(() => window.juris.headlessAPIs.userService);
  const currentUser = ref(null);
  
  watch(userService, async (service) => {
    if (service) {
      currentUser.value = await service.getCurrentUser();
    }
  }, { immediate: true });
  
  return {
    userService,
    currentUser,
    refreshUser: () => userService.value?.refreshProfile()
  };
}
```

### 6. API Chaining and Composition

```javascript
// Chain multiple headless component APIs
const checkoutFlow = async () => {
  const { userService, cartService, paymentService, emailService } = juris.headlessAPIs;
  
  try {
    // 1. Validate user
    const user = userService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');
    
    // 2. Get cart items
    const items = cartService.getItems();
    if (items.length === 0) throw new Error('Cart is empty');
    
    // 3. Calculate total
    const total = cartService.getTotal();
    
    // 4. Process payment
    const payment = await paymentService.charge({
      amount: total,
      customer: user.id,
      description: `Order for ${items.length} items`
    });
    
    // 5. Clear cart
    cartService.clear();
    
    // 6. Send confirmation email
    await emailService.sendOrderConfirmation({
      user,
      payment,
      items
    });
    
    return { success: true, orderId: payment.id };
    
  } catch (error) {
    // Handle errors across multiple services
    console.error('Checkout failed:', error);
    return { success: false, error: error.message };
  }
};
```

### 7. Conditional API Usage

```javascript
// Use APIs conditionally based on availability
const handleFeatureRequest = async (featureName) => {
  const apis = juris.headlessAPIs;
  
  // Check if premium features are available
  if (apis.premiumFeatures && apis.userService.isPremiumUser()) {
    return apis.premiumFeatures.executeFeature(featureName);
  }
  
  // Fall back to basic features
  if (apis.basicFeatures) {
    return apis.basicFeatures.executeFeature(featureName);
  }
  
  // No feature service available
  throw new Error('Feature service not available');
};

// Feature detection pattern
const getAvailableFeatures = () => {
  const features = [];
  const apis = juris.headlessAPIs;
  
  if (apis.userService) features.push('user-management');
  if (apis.paymentService) features.push('payments');
  if (apis.analyticsService) features.push('analytics');
  if (apis.chatService) features.push('real-time-chat');
  
  return features;
};
```

## Testing Headless Components

Comprehensive testing strategies for headless components ensure reliability and maintainability:

### 1. Unit Testing Individual Components

```javascript
describe('UserService Headless Component', () => {
  let userService;
  let mockContext;
  
  beforeEach(() => {
    // Create mock context
    mockContext = {
      getState: jest.fn(),
      setState: jest.fn(),
      subscribe: jest.fn(() => jest.fn()), // returns unsubscribe function
      executeBatch: jest.fn((callback) => callback()),
      httpClient: {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn()
      },
      logger: {
        info: jest.fn(),
        error: jest.fn()
      }
    };
    
    // Initialize component with mock context
    const component = UserServiceComponent({}, mockContext);
    userService = component.api;
  });
  
  test('should fetch user data successfully', async () => {
    // Setup mocks
    const userData = { id: 1, name: 'John Doe', email: 'john@example.com' };
    mockContext.httpClient.get.mockResolvedValue(userData);
    
    // Execute
    const result = await userService.fetchUser(1);
    
    // Assert
    expect(result).toEqual(userData);
    expect(mockContext.httpClient.get).toHaveBeenCalledWith('/users/1');
    expect(mockContext.setState).toHaveBeenCalledWith('user.profile', userData);
  });
  
  test('should handle fetch errors gracefully', async () => {
    // Setup error mock
    const error = new Error('Network error');
    mockContext.httpClient.get.mockRejectedValue(error);
    
    // Execute and assert
    await expect(userService.fetchUser(1)).rejects.toThrow('Network error');
    expect(mockContext.setState).toHaveBeenCalledWith('user.error', error.message);
  });
  
  test('should validate email correctly', () => {
    expect(userService.validateEmail('valid@example.com')).toBe(true);
    expect(userService.validateEmail('invalid-email')).toBe(false);
    expect(userService.validateEmail('')).toBe(false);
  });
  
  test('should manage user state correctly', () => {
    mockContext.getState.mockReturnValue({ id: 1, name: 'John' });
    
    const user = userService.getCurrentUser();
    
    expect(mockContext.getState).toHaveBeenCalledWith('user.profile', null);
    expect(user).toEqual({ id: 1, name: 'John' });
  });
});
```

### 2. Integration Testing Multiple Components

```javascript
describe('E-commerce Service Integration', () => {
  let juris;
  let cartService;
  let userService;
  let paymentService;
  
  beforeEach(() => {
    // Setup Juris with mock services
    juris = new Juris({
      services: {
        httpClient: new MockHttpClient(),
        paymentGateway: new MockPaymentGateway()
      }
    });
    
    // Register components
    juris.registerHeadlessComponent('cart', CartServiceComponent);
    juris.registerHeadlessComponent('user', UserServiceComponent);
    juris.registerHeadlessComponent('payment', PaymentServiceComponent);
    
    // Initialize all services
    cartService = juris.initializeHeadlessComponent('cart').api;
    userService = juris.initializeHeadlessComponent('user').api;
    paymentService = juris.initializeHeadlessComponent('payment').api;
  });
  
  test('should complete checkout flow', async () => {
    // Setup user
    await userService.login({ email: 'test@example.com', password: 'pass' });
    expect(userService.isAuthenticated()).toBe(true);
    
    // Add items to cart
    cartService.addItem({ id: 1, price: 10.99, name: 'Product 1' });
    cartService.addItem({ id: 2, price: 15.99, name: 'Product 2' });
    
    expect(cartService.getItemCount()).toBe(2);
    expect(cartService.getTotal()).toBe(26.98);
    
    // Process payment
    const paymentResult = await paymentService.processPayment({
      amount: cartService.getTotal(),
      items: cartService.getItems()
    });
    
    expect(paymentResult.success).toBe(true);
    expect(paymentResult.transactionId).toBeDefined();
    
    // Verify cart is cleared
    cartService.clear();
    expect(cartService.getItemCount()).toBe(0);
  });
  
  test('should handle authentication required scenarios', async () => {
    // Try checkout without authentication
    cartService.addItem({ id: 1, price: 10.99 });
    
    await expect(paymentService.processPayment({
      amount: cartService.getTotal()
    })).rejects.toThrow('Authentication required');
  });
});
```

### 3. State Management Testing

```javascript
describe('Headless Component State Management', () => {
  let juris;
  let component;
  
  beforeEach(() => {
    juris = new Juris();
    juris.registerHeadlessComponent('testComponent', testComponent);
    component = juris.initializeHeadlessComponent('testComponent').api;
  });
  
  test('should manage reactive state correctly', async () => {
    const stateChanges = [];
    
    // Subscribe to state changes
    const unsubscribe = juris.subscribe('test.data', (newValue) => {
      stateChanges.push(newValue);
    });
    
    // Trigger state changes
    await component.updateData('first');
    await component.updateData('second');
    
    expect(stateChanges).toEqual(['first', 'second']);
    expect(component.getData()).toBe('second');
    
    unsubscribe();
  });
  
  test('should handle batch state updates', () => {
    const updateSpy = jest.spyOn(juris.stateManager, 'setState');
    
    component.batchUpdate({
      value1: 'a',
      value2: 'b',
      value3: 'c'
    });
    
    // Verify batching reduces setState calls
    expect(updateSpy).toHaveBeenCalledTimes(1);
  });
});
```

### 4. Lifecycle Testing

```javascript
describe('Headless Component Lifecycle', () => {
  let juris;
  let lifecycleEvents;
  
  beforeEach(() => {
    lifecycleEvents = [];
    juris = new Juris();
    
    const lifecycleComponent = (props, context) => ({
      api: { getData: () => 'test' },
      hooks: {
        onRegister: () => lifecycleEvents.push('registered'),
        onUnregister: () => lifecycleEvents.push('unregistered')
      }
    });
    
    juris.registerHeadlessComponent('lifecycle', lifecycleComponent);
  });
  
  test('should trigger lifecycle hooks correctly', () => {
    // Initialize component
    const component = juris.initializeHeadlessComponent('lifecycle');
    expect(lifecycleEvents).toContain('registered');
    
    // Cleanup component
    juris.headlessManager.reinitialize('lifecycle');
    expect(lifecycleEvents).toContain('unregistered');
    expect(lifecycleEvents).toContain('registered'); // reinitialize triggers both
  });
  
  test('should handle lifecycle errors gracefully', () => {
    const errorComponent = (props, context) => ({
      api: { test: () => 'ok' },
      hooks: {
        onRegister: () => { throw new Error('Registration error'); }
      }
    });
    
    juris.registerHeadlessComponent('errorComponent', errorComponent);
    
    // Should not throw, but log error
    const component = juris.initializeHeadlessComponent('errorComponent');
    expect(component.api.test()).toBe('ok'); // Component still works
  });
});
```

### 5. Async Operations Testing

```javascript
describe('Async Headless Component Operations', () => {
  let component;
  let mockTimer;
  
  beforeEach(() => {
    mockTimer = jest.useFakeTimers();
    
    const asyncComponent = (props, context) => ({
      api: {
        delayedOperation: async (delay = 1000) => {
          return new Promise(resolve => {
            setTimeout(() => resolve('completed'), delay);
          });
        },
        
        fetchWithTimeout: async (url, timeout = 5000) => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);
          
          try {
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            return response.json();
          } catch (error) {
            throw new Error(`Request failed: ${error.message}`);
          }
        }
      }
    });
    
    const juris = new Juris();
    juris.registerHeadlessComponent('async', asyncComponent);
    component = juris.initializeHeadlessComponent('async').api;
  });
  
  afterEach(() => {
    mockTimer.useRealTimers();
  });
  
  test('should handle delayed operations', async () => {
    const promise = component.delayedOperation(1000);
    
    // Fast-forward time
    mockTimer.advanceTimersByTime(1000);
    
    const result = await promise;
    expect(result).toBe('completed');
  });
  
  test('should handle timeout scenarios', async () => {
    // Mock fetch to never resolve
    global.fetch = jest.fn(() => new Promise(() => {}));
    
    const promise = component.fetchWithTimeout('/api/data', 1000);
    
    // Fast-forward past timeout
    mockTimer.advanceTimersByTime(1000);
    
    await expect(promise).rejects.toThrow('Request failed');
  });
});
```

### 6. Error Handling Testing

```javascript
describe('Headless Component Error Handling', () => {
  test('should handle API errors gracefully', async () => {
    const errorComponent = (props, context) => ({
      api: {
        riskyOperation: async () => {
          throw new Error('Something went wrong');
        },
        
        safeOperation: async () => {
          try {
            await this.riskyOperation();
          } catch (error) {
            context.setState('error', error.message);
            return { success: false, error: error.message };
          }
        }
      }
    });
    
    const juris = new Juris();
    juris.registerHeadlessComponent('error', errorComponent);
    const component = juris.initializeHeadlessComponent('error').api;
    
    const result = await component.safeOperation();
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Something went wrong');
    expect(juris.getState('error')).toBe('Something went wrong');
  });
});
```

### 7. Mock and Test Utilities

```javascript
// Test utilities for headless components
class HeadlessTestUtils {
  static createMockContext(overrides = {}) {
    return {
      getState: jest.fn((path, defaultValue) => defaultValue),
      setState: jest.fn(),
      subscribe: jest.fn(() => jest.fn()),
      executeBatch: jest.fn((callback) => callback()),
      logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
      },
      ...overrides
    };
  }
  
  static createMockJuris(services = {}) {
    return new Juris({
      services: {
        httpClient: new MockHttpClient(),
        ...services
      }
    });
  }
  
  static async waitForStateChange(juris, path, expectedValue, timeout = 1000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`State change timeout for ${path}`));
      }, timeout);
      
      const unsubscribe = juris.subscribe(path, (newValue) => {
        if (newValue === expectedValue) {
          clearTimeout(timeoutId);
          unsubscribe();
          resolve(newValue);
        }
      });
    });
  }
}

// Usage in tests
test('should update state reactively', async () => {
  const juris = HeadlessTestUtils.createMockJuris();
  const component = juris.initializeHeadlessComponent('test').api;
  
  component.updateValue('new-value');
  
  const stateValue = await HeadlessTestUtils.waitForStateChange(
    juris, 
    'test.value', 
    'new-value'
  );
  
  expect(stateValue).toBe('new-value');
});
```

These testing approaches ensure your headless components are reliable, maintainable, and work correctly in isolation and integration scenarios.

**Auto-Initialization:**
```javascript
// Essential system services that should start immediately
juris.registerHeadlessComponent('logger', LoggerComponent, { 
  autoInit: true 
});

juris.registerHeadlessComponent('errorHandler', ErrorHandlerComponent, { 
  autoInit: true 
});

juris.registerHeadlessComponent('analytics', AnalyticsComponent, { 
  autoInit: true 
});

// Auto-initialization example: Global error handler
const ErrorHandlerComponent = (props, context) => {
  const { setState, getState } = context;
  
  return {
    api: {
      handleError: (error, context = {}) => {
        const errorLog = getState('errors.log', []);
        const errorEntry = {
          id: Date.now(),
          message: error.message,
          stack: error.stack,
          timestamp: Date.now(),
          context,
          userAgent: navigator.userAgent,
          url: window.location.href
        };
        
        setState('errors.log', [...errorLog.slice(-99), errorEntry]);
        setState('errors.lastError', errorEntry);
        
        // Send to monitoring service
        if (props.reportToService) {
          sendErrorToService(errorEntry);
        }
      },
      
      getErrorLog: () => getState('errors.log', []),
      getLastError: () => getState('errors.lastError', null),
      clearErrors: () => setState('errors.log', [])
    },
    
    hooks: {
      onRegister: () => {
        // Set up global error handlers immediately
        window.addEventListener('error', (event) => {
          this.handleError(event.error, { type: 'unhandled' });
        });
        
        window.addEventListener('unhandledrejection', (event) => {
          this.handleError(new Error(event.reason), { type: 'promise' });
        });
        
        console.log('Global error handler initialized');
      }
    }
  };
};

// Framework initialization with autoInit components
const juris = new Juris({
  headlessComponents: {
    errorHandler: {
      fn: ErrorHandlerComponent,
      options: { autoInit: true, reportToService: true }
    },
    logger: {
      fn: LoggerComponent, 
      options: { autoInit: true }
    }
  }
});

// Auto-initialized components are immediately available
// No need to manually initialize - they start with the framework
setTimeout(() => {
  const { errorHandler, logger } = juris.headlessAPIs;
  logger.info('Application started');
  console.log('Error log:', errorHandler.getErrorLog());
}, 100);
```

**Context-Based Access:**
```javascript
// Within any component context
const { dataManager } = context; // Auto-injected if initialized
```

### Lifecycle Hooks

Headless components support three lifecycle hooks:

1. **onRegister**: Called when component instance is created
2. **onUpdate**: Called when component props change (if supported)
3. **onUnregister**: Called during cleanup

### API Exposure

Once initialized, component APIs are automatically injected into:
- The global headless context
- Component creation contexts
- The main Juris instance

```javascript
// All these provide access to the same API
const api1 = juris.headlessAPIs.dataManager;
const api2 = context.dataManager;
const api3 = juris.getHeadlessComponent('dataManager').api;
```

## State Management Integration

### Reactive State Access

Headless components have full access to Juris's reactive state system:

```javascript
const searchComponent = (props, context) => {
  const { getState, setState, subscribe } = context;
  
  // Reactive state access with automatic dependency tracking
  const searchTerm = () => getState('search.term', '');
  const results = () => getState('search.results', []);
  
  return {
    api: {
      search: async (term) => {
        setState('search.term', term);
        setState('search.loading', true);
        
        try {
          const data = await fetchSearchResults(term);
          setState('search.results', data);
        } catch (error) {
          setState('search.error', error.message);
        } finally {
          setState('search.loading', false);
        }
      },
      
      getSearchState: () => ({
        term: searchTerm(),
        results: results(),
        loading: getState('search.loading', false),
        error: getState('search.error', null)
      })
    }
  };
};
```

### State Subscriptions

Components can subscribe to state changes for reactive behavior:

```javascript
const notificationComponent = (props, context) => {
  const { subscribe, setState } = context;
  
  // Subscribe to user state changes
  const unsubscribe = subscribe('user', (newValue, oldValue, path) => {
    if (path === 'user.notifications.unread') {
      // Trigger notification logic
      if (newValue > oldValue) {
        showNotificationBadge(newValue);
      }
    }
  });
  
  return {
    api: {
      getUnreadCount: () => getState('user.notifications.unread', 0)
    },
    hooks: {
      onUnregister: () => unsubscribe()
    }
  };
};
```

### Batch State Updates

For performance optimization, use batch updates:

```javascript
const formComponent = (props, context) => {
  const { executeBatch, setState } = context;
  
  return {
    api: {
      submitForm: async (formData) => {
        // Batch multiple state updates
        executeBatch(() => {
          setState('form.submitting', true);
          setState('form.errors', {});
          setState('form.lastSubmitted', Date.now());
        });
        
        try {
          await submitToAPI(formData);
          executeBatch(() => {
            setState('form.success', true);
            setState('form.submitting', false);
          });
        } catch (error) {
          setState('form.errors', parseErrors(error));
          setState('form.submitting', false);
        }
      }
    }
  };
};
```

## API Design Patterns

### Service-Oriented Architecture

Design headless components as services with clear responsibilities:

```javascript
const authService = (props, context) => {
  const { getState, setState, services } = context;
  
  return {
    api: {
      // Authentication methods
      login: async (credentials) => { /* implementation */ },
      logout: () => { /* implementation */ },
      refresh: async () => { /* implementation */ },
      
      // State accessors
      isAuthenticated: () => getState('auth.isLoggedIn', false),
      getCurrentUser: () => getState('auth.user', null),
      getToken: () => getState('auth.token', null),
      
      // Permission helpers
      hasPermission: (permission) => {
        const user = getState('auth.user');
        return user?.permissions?.includes(permission) || false;
      },
      
      hasRole: (role) => {
        const user = getState('auth.user');
        return user?.roles?.includes(role) || false;
      }
    }
  };
};
```

### Data Management Patterns

Implement robust data management with caching and synchronization:

```javascript
const dataService = (props, context) => {
  const { getState, setState, subscribe } = context;
  const cache = new Map();
  
  return {
    api: {
      // CRUD operations
      fetch: async (endpoint, options = {}) => {
        const cacheKey = `${endpoint}:${JSON.stringify(options)}`;
        
        if (cache.has(cacheKey) && !options.force) {
          return cache.get(cacheKey);
        }
        
        setState(`loading.${endpoint}`, true);
        
        try {
          const data = await fetchData(endpoint, options);
          cache.set(cacheKey, data);
          setState(`data.${endpoint}`, data);
          return data;
        } catch (error) {
          setState(`errors.${endpoint}`, error.message);
          throw error;
        } finally {
          setState(`loading.${endpoint}`, false);
        }
      },
      
      // Cache management
      invalidateCache: (pattern) => {
        for (const key of cache.keys()) {
          if (key.includes(pattern)) {
            cache.delete(key);
          }
        }
      },
      
      // State helpers
      isLoading: (endpoint) => getState(`loading.${endpoint}`, false),
      getError: (endpoint) => getState(`errors.${endpoint}`, null),
      getData: (endpoint) => getState(`data.${endpoint}`, null)
    }
  };
};
```

### Event-Driven Architecture

Implement event systems for loose coupling:

```javascript
const eventBus = (props, context) => {
  const listeners = new Map();
  
  return {
    api: {
      emit: (eventType, payload) => {
        const eventListeners = listeners.get(eventType) || [];
        eventListeners.forEach(listener => {
          try {
            listener(payload);
          } catch (error) {
            console.error(`Event listener error for ${eventType}:`, error);
          }
        });
      },
      
      on: (eventType, listener) => {
        if (!listeners.has(eventType)) {
          listeners.set(eventType, []);
        }
        listeners.get(eventType).push(listener);
        
        // Return unsubscribe function
        return () => {
          const eventListeners = listeners.get(eventType);
          const index = eventListeners.indexOf(listener);
          if (index > -1) {
            eventListeners.splice(index, 1);
          }
        };
      },
      
      off: (eventType, listener) => {
        const eventListeners = listeners.get(eventType);
        if (eventListeners) {
          const index = eventListeners.indexOf(listener);
          if (index > -1) {
            eventListeners.splice(index, 1);
          }
        }
      },
      
      once: (eventType, listener) => {
        const wrapper = (payload) => {
          listener(payload);
          this.off(eventType, wrapper);
        };
        return this.on(eventType, wrapper);
      }
    }
  };
};
```

## Context System

### Context Structure

The context object provided to headless components contains:

```javascript
const context = {
  // State management
  getState: (path, defaultValue, track) => {},
  setState: (path, value, context) => {},
  executeBatch: (callback) => {},
  subscribe: (path, callback) => {},
  
  // Services
  services: {},
  ...services, // Spread services as direct properties
  
  // Headless APIs
  headless: {},
  ...headlessAPIs, // Spread APIs as direct properties
  
  // Component management
  components: {
    register: (name, component) => {},
    registerHeadless: (name, component, options) => {},
    get: (name) => {},
    getHeadless: (name) => {},
    initHeadless: (name, props) => {},
    reinitHeadless: (name, props) => {},
    getHeadlessAPI: (name) => {},
    getAllHeadlessAPIs: () => {}
  },
  
  // Utilities
  utils: {
    render: (container) => {},
    cleanup: () => {},
    forceRender: () => {},
    getHeadlessStatus: () => {}
  },
  
  // Framework instance
  juris: jurisInstance,
  
  // Logging
  logger: {
    log, warn, error, info, debug,
    subscribe, unsubscribe
  },
  
  // Environment
  isSSR: boolean
};
```

### Service Injection

Services are automatically injected into the context:

```javascript
const juris = new Juris({
  services: {
    httpClient: new HttpClient(),
    storage: new StorageService(),
    analytics: new AnalyticsService()
  }
});

// Services available in headless components
const apiComponent = (props, context) => {
  const { httpClient, storage, analytics } = context;
  
  return {
    api: {
      trackEvent: (event) => analytics.track(event),
      saveToStorage: (key, value) => storage.set(key, value),
      apiCall: (endpoint) => httpClient.get(endpoint)
    }
  };
};
```

## Advanced Features

### Asynchronous Initialization

Headless components can perform async initialization:

```javascript
const databaseComponent = (props, context) => {
  const { setState } = context;
  
  // Async initialization
  const initPromise = (async () => {
    setState('db.connecting', true);
    
    try {
      const connection = await connectToDatabase(props.connectionString);
      setState('db.connected', true);
      setState('db.connection', connection);
      return connection;
    } catch (error) {
      setState('db.error', error.message);
      throw error;
    } finally {
      setState('db.connecting', false);
    }
  })();
  
  return {
    api: {
      query: async (sql, params) => {
        const connection = await initPromise;
        return connection.query(sql, params);
      },
      
      isConnected: () => getState('db.connected', false),
      getError: () => getState('db.error', null)
    },
    
    hooks: {
      onUnregister: async () => {
        try {
          const connection = await initPromise;
          await connection.close();
        } catch (error) {
          // Handle cleanup error
        }
      }
    }
  };
};
```

### Component Communication

Enable communication between headless components:

```javascript
const messagingHub = (props, context) => {
  const channels = new Map();
  
  return {
    api: {
      createChannel: (channelName) => {
        if (!channels.has(channelName)) {
          channels.set(channelName, new Set());
        }
        
        return {
          subscribe: (callback) => {
            channels.get(channelName).add(callback);
            return () => channels.get(channelName).delete(callback);
          },
          
          publish: (message) => {
            channels.get(channelName).forEach(callback => {
              try {
                callback(message);
              } catch (error) {
                console.error(`Channel ${channelName} callback error:`, error);
              }
            });
          }
        };
      },
      
      destroyChannel: (channelName) => {
        channels.delete(channelName);
      }
    }
  };
};

// Usage in other components
const userComponent = (props, context) => {
  const { messagingHub } = context;
  const userChannel = messagingHub.createChannel('user-updates');
  
  return {
    api: {
      updateUser: (userData) => {
        // Update user data
        setState('user.data', userData);
        
        // Notify other components
        userChannel.publish({
          type: 'USER_UPDATED',
          data: userData,
          timestamp: Date.now()
        });
      }
    }
  };
};
```

### Plugin Architecture

Create extensible components with plugin support:

```javascript
const pluginManager = (props, context) => {
  const plugins = new Map();
  const hooks = new Map();
  
  return {
    api: {
      registerPlugin: (name, plugin) => {
        plugins.set(name, plugin);
        
        // Initialize plugin hooks
        if (plugin.hooks) {
          Object.entries(plugin.hooks).forEach(([hookName, handler]) => {
            if (!hooks.has(hookName)) {
              hooks.set(hookName, []);
            }
            hooks.get(hookName).push(handler);
          });
        }
      },
      
      executeHook: async (hookName, ...args) => {
        const handlers = hooks.get(hookName) || [];
        const results = [];
        
        for (const handler of handlers) {
          try {
            const result = await handler(...args);
            results.push(result);
          } catch (error) {
            console.error(`Hook ${hookName} error:`, error);
          }
        }
        
        return results;
      },
      
      getPlugin: (name) => plugins.get(name),
      getAllPlugins: () => Array.from(plugins.keys())
    }
  };
};
```

## Best Practices

### 1. Single Responsibility Principle

Each headless component should have a single, well-defined responsibility:

```javascript
// Good: Focused authentication service
const authService = (props, context) => { /* auth logic only */ };

// Good: Focused data caching service  
const cacheService = (props, context) => { /* caching logic only */ };

// Avoid: Mixed responsibilities
const authAndDataService = (props, context) => { /* auth + data + UI logic */ };
```

### 2. Dependency Injection

Use the context system for dependency injection:

```javascript
const userService = (props, context) => {
  const { httpClient, authService, cacheService } = context;
  
  return {
    api: {
      fetchUser: async (id) => {
        if (!authService.isAuthenticated()) {
          throw new Error('Not authenticated');
        }
        
        const cached = cacheService.get(`user:${id}`);
        if (cached) return cached;
        
        const user = await httpClient.get(`/users/${id}`);
        cacheService.set(`user:${id}`, user);
        return user;
      }
    }
  };
};
```

### 3. Error Handling

Implement comprehensive error handling:

```javascript
const resilientService = (props, context) => {
  const { setState, logger } = context;
  
  return {
    api: {
      performOperation: async (data) => {
        try {
          setState('operation.loading', true);
          setState('operation.error', null);
          
          const result = await riskOperation(data);
          setState('operation.result', result);
          return result;
          
        } catch (error) {
          logger.error('Operation failed:', error);
          setState('operation.error', {
            message: error.message,
            code: error.code,
            timestamp: Date.now()
          });
          throw error;
          
        } finally {
          setState('operation.loading', false);
        }
      }
    }
  };
};
```

### 4. Resource Cleanup

Always clean up resources in onUnregister:

```javascript
const resourceManager = (props, context) => {
  const intervals = [];
  const subscriptions = [];
  const connections = [];
  
  return {
    api: {
      startPolling: (callback, interval) => {
        const id = setInterval(callback, interval);
        intervals.push(id);
        return id;
      }
    },
    
    hooks: {
      onUnregister: () => {
        // Clean up intervals
        intervals.forEach(id => clearInterval(id));
        
        // Clean up subscriptions  
        subscriptions.forEach(unsub => unsub());
        
        // Close connections
        connections.forEach(conn => conn.close());
      }
    }
  };
};
```

### 5. Type Safety Patterns

Use consistent API patterns for better maintainability:

```javascript
const typedApiComponent = (props, context) => {
  // Define clear interface
  const api = {
    // Data operations
    create: async (data) => { /* implementation */ },
    read: async (id) => { /* implementation */ },
    update: async (id, data) => { /* implementation */ },
    delete: async (id) => { /* implementation */ },
    
    // Query operations
    list: async (options = {}) => { /* implementation */ },
    search: async (query) => { /* implementation */ },
    filter: async (criteria) => { /* implementation */ },
    
    // State accessors
    getItems: () => getState('items', []),
    getLoading: () => getState('loading', false),
    getError: () => getState('error', null)
  };
  
  return { api };
};
```

### 6. Avoid Global Function Access - Use Service Registration

**❌ Bad Practice: Accessing global functions directly**

```javascript
// Global functions scattered throughout codebase
window.formatCurrency = (amount, currency) => { /* implementation */ };
window.validateEmail = (email) => { /* implementation */ };
window.debounce = (func, delay) => { /* implementation */ };

// Components accessing globals directly (creates spaghetti code)
const badComponent = (props, context) => {
  return {
    api: {
      processUser: (userData) => {
        // Direct global access - hard to test, track, and maintain
        if (!window.validateEmail(userData.email)) {
          throw new Error('Invalid email');
        }
        
        const formatted = window.formatCurrency(userData.salary, 'USD');
        // More spaghetti code...
      }
    }
  };
};
```

**✅ Good Practice: Register utilities as services and group related functions**

```javascript
// Group related utility functions into cohesive services
class ValidationService {
  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  
  validatePhone(phone) {
    return /^\+?[\d\s-()]+$/.test(phone);
  }
  
  validateRequired(value) {
    return value != null && value !== '';
  }
  
  validateLength(value, min, max) {
    const len = value?.length || 0;
    return len >= min && len <= max;
  }
}

class FormattingService {
  formatCurrency(amount, currency = 'USD', locale = 'en-US') {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  }
  
  formatDate(date, format = 'short') {
    return new Intl.DateTimeFormat('en-US', { 
      dateStyle: format 
    }).format(new Date(date));
  }
  
  formatNumber(number, decimals = 2) {
    return Number(number).toFixed(decimals);
  }
}

class UtilityService {
  debounce(func, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }
  
  throttle(func, limit) {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
  
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
}

// Register services with Juris
const juris = new Juris({
  services: {
    validator: new ValidationService(),
    formatter: new FormattingService(),
    utils: new UtilityService()
  }
});

// Clean component using injected services
const goodComponent = (props, context) => {
  const { validator, formatter, utils } = context;
  
  return {
    api: {
      processUser: (userData) => {
        // Clean, testable, traceable dependencies
        if (!validator.validateEmail(userData.email)) {
          throw new Error('Invalid email');
        }
        
        if (!validator.validateRequired(userData.name)) {
          throw new Error('Name is required');
        }
        
        const formatted = formatter.formatCurrency(userData.salary, 'USD');
        const debouncedSave = utils.debounce(saveUser, 500);
        
        return {
          ...userData,
          formattedSalary: formatted,
          save: debouncedSave
        };
      }
    }
  };
};
```

**Benefits of Service Registration:**
- **Dependency Injection**: Clear, testable dependencies
- **Namespace Organization**: Related functions grouped logically
- **Easy Mocking**: Services can be easily mocked for testing
- **Consistent Access**: All components use the same service interface
- **Maintainability**: Changes to utilities are centralized
- **Type Safety**: Services can be typed for better IDE support
- **Performance**: Services are instantiated once and reused
- **Testability**: Each service can be unit tested independently

**Service Organization Guidelines:**
```javascript
// Group by domain/responsibility
const juris = new Juris({
  services: {
    // Data validation
    validator: new ValidationService(),
    
    // UI formatting
    formatter: new FormattingService(),
    
    // HTTP communication
    http: new HttpService(),
    
    // Local storage
    storage: new StorageService(),
    
    // Analytics tracking
    analytics: new AnalyticsService(),
    
    // Utility functions
    utils: new UtilityService(),
    
    // Business logic helpers
    business: new BusinessLogicService()
  }
});
```

## Performance Considerations

### 1. State Management Optimization

Use selective state tracking to avoid unnecessary re-renders:

```javascript
const optimizedComponent = (props, context) => {
  const { getState } = context;
  
  return {
    api: {
      // Track specific paths only
      getSpecificData: () => getState('specific.path.only'),
      
      // Skip tracking when just reading
      getDataForComparison: () => getState('data', null, false),
      
      // Batch state updates
      updateMultipleValues: () => {
        context.executeBatch(() => {
          setState('value1', data1);
          setState('value2', data2);
          setState('value3', data3);
        });
      }
    }
  };
};
```

### 2. Memory Management

Implement proper cleanup to prevent memory leaks:

```javascript
const memoryEfficientComponent = (props, context) => {
  const cache = new WeakMap();
  const timers = [];
  
  return {
    api: {
      cacheWithWeakRef: (object, data) => {
        cache.set(object, data); // Automatically cleaned when object is GC'd
      }
    },
    
    hooks: {
      onUnregister: () => {
        timers.forEach(timer => clearTimeout(timer));
        // WeakMap cleans itself up
      }
    }
  };
};
```

### 3. Lazy Loading

Implement lazy initialization for expensive operations:

```javascript
const lazyComponent = (props, context) => {
  let heavyResource = null;
  
  const getHeavyResource = async () => {
    if (!heavyResource) {
      heavyResource = await initializeExpensiveResource();
    }
    return heavyResource;
  };
  
  return {
    api: {
      useResource: async () => {
        const resource = await getHeavyResource();
        return resource.doSomething();
      }
    }
  };
};
```

## Testing Strategies

### 1. Unit Testing Headless Components

Test components in isolation:

```javascript
describe('UserService', () => {
  let userService;
  let mockContext;
  
  beforeEach(() => {
    mockContext = {
      getState: jest.fn(),
      setState: jest.fn(),
      httpClient: {
        get: jest.fn(),
        post: jest.fn()
      }
    };
    
    const component = userServiceComponent({}, mockContext);
    userService = component.api;
  });
  
  test('should fetch user data', async () => {
    const userData = { id: 1, name: 'Test User' };
    mockContext.httpClient.get.mockResolvedValue(userData);
    
    const result = await userService.fetchUser(1);
    
    expect(result).toEqual(userData);
    expect(mockContext.httpClient.get).toHaveBeenCalledWith('/users/1');
  });
});
```

### 2. Integration Testing

Test component interactions:

```javascript
describe('Service Integration', () => {
  let juris;
  
  beforeEach(() => {
    juris = new Juris({
      services: {
        httpClient: new MockHttpClient()
      }
    });
    
    juris.registerHeadlessComponent('auth', authComponent);
    juris.registerHeadlessComponent('user', userComponent);
  });
  
  test('should coordinate authentication and user data', async () => {
    const auth = juris.initializeHeadlessComponent('auth');
    const user = juris.initializeHeadlessComponent('user');
    
    await auth.api.login({ username: 'test', password: 'pass' });
    const userData = await user.api.fetchCurrentUser();
    
    expect(userData).toBeDefined();
  });
});
```

### 3. State Testing

Test reactive state behavior:

```javascript
describe('State Reactivity', () => {
  test('should react to state changes', async () => {
    const juris = new Juris();
    const notifications = [];
    
    const testComponent = (props, context) => {
      const { subscribe } = context;
      
      subscribe('test.value', (newValue) => {
        notifications.push(newValue);
      });
      
      return { api: {} };
    };
    
    juris.registerHeadlessComponent('test', testComponent);
    juris.initializeHeadlessComponent('test');
    
    juris.setState('test.value', 'hello');
    juris.setState('test.value', 'world');
    
    expect(notifications).toEqual(['hello', 'world']);
  });
});
```

## Migration & Integration

### 1. Incremental Adoption

Start by creating headless services for specific functionality:

```javascript
// Step 1: Extract existing logic into headless service
const existingFeatureService = (props, context) => {
  return {
    api: {
      // Migrate existing functions
      doSomething: existingDoSomething,
      processData: existingProcessData
    }
  };
};

// Step 2: Register and use
juris.registerHeadlessComponent('feature', existingFeatureService);

// Step 3: Update existing code to use service
const { feature } = context;
feature.doSomething();
```

### 2. Framework Integration

Use headless components with other frameworks:

```javascript
// React integration
const useJurisHeadless = (componentName) => {
  const [api, setApi] = useState(null);
  
  useEffect(() => {
    const instance = window.juris.initializeHeadlessComponent(componentName);
    setApi(instance.api);
    
    return () => {
      window.juris.headlessManager.cleanup();
    };
  }, [componentName]);
  
  return api;
};

// Vue integration
const jurisPlugin = {
  install(app, options) {
    app.config.globalProperties.$juris = window.juris;
    
    app.mixin({
      created() {
        this.headlessServices = {};
        options.services?.forEach(serviceName => {
          this.headlessServices[serviceName] = 
            window.juris.initializeHeadlessComponent(serviceName);
        });
      }
    });
  }
};
```

### 3. Server-Side Rendering

Headless components work seamlessly with SSR:

```javascript
// Node.js SSR setup
const Juris = require('juris');

const juris = new Juris({
  services: {
    database: databaseService,
    cache: redisCache
  }
});

// Register headless components
juris.registerHeadlessComponent('user', userService);
juris.registerHeadlessComponent('content', contentService);

// Initialize for request
const userAPI = juris.initializeHeadlessComponent('user');
const contentAPI = juris.initializeHeadlessComponent('content');

// Use during rendering
const userData = await userAPI.fetchUser(userId);
const pageContent = await contentAPI.getPageContent(pageId);
```

## Conclusion

Juris's headless component system provides a powerful foundation for building scalable, maintainable applications. By separating logic from presentation, you can create reusable services that work across different UI frameworks and environments.

The key to success with Juris headless components is:

1. **Clear separation of concerns** - Keep logic separate from UI
2. **Consistent API design** - Use standard patterns for predictability
3. **Proper lifecycle management** - Handle initialization and cleanup correctly
4. **Performance optimization** - Use reactive state efficiently
5. **Comprehensive testing** - Test components in isolation and integration

This architecture enables you to build robust applications that can evolve and scale while maintaining clean, testable code.