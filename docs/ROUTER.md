# Juris Router Documentation

The Juris Router is a powerful, feature-rich routing system that provides modern web application routing capabilities including parameter validation, query string handling, route guards, lazy loading, and more.

## Table of Contents

- [Quick Start](#quick-start)
- [Basic Configuration](#basic-configuration)
- [Routing Modes](#routing-modes)
- [Route Definition](#route-definition)
- [Parameters & Validation](#parameters--validation)
- [Query Parameters](#query-parameters)
- [Route Guards](#route-guards)
- [Navigation](#navigation)
- [Components](#components)
- [Advanced Features](#advanced-features)
- [API Reference](#api-reference)
- [Examples](#examples)

## Quick Start

```javascript
// Basic router setup
const app = new Juris({
  router: {
    mode: 'hash', // or 'history'
    routes: {
      '/': 'HomePage',
      '/users/:id': 'UserPage',
      '/products/:category?': 'ProductPage'
    }
  },
  components: {
    HomePage: () => ({ div: { text: 'Welcome!' } }),
    UserPage: (props, context) => ({
      div: { text: `User: ${context.getState('router.params.id')}` }
    })
  },
  layout: {
    div: {
      children: [
        { Navigation: {} },
        { Router: {} }
      ]
    }
  }
});

app.render();
```

## Basic Configuration

### Router Options

```javascript
const app = new Juris({
  router: {
    mode: 'hash',           // 'hash' | 'history' | 'memory'
    base: '',               // Base path for history mode
    routes: {},             // Route definitions
    guards: {},             // Route guards
    middleware: [],         // Global middleware
    lazy: {},              // Lazy loading configuration
    transitions: true,      // Enable route transitions
    scrollBehavior: 'top'   // 'top' | 'none' | 'maintain' | function
  }
});
```

## Routing Modes

### Hash Mode (Default)
```javascript
router: {
  mode: 'hash'
}
// URLs: /#/users/123
```

### History Mode
```javascript
router: {
  mode: 'history',
  base: '/app'  // Optional base path
}
// URLs: /app/users/123
```

### Memory Mode (Testing/SSR)
```javascript
router: {
  mode: 'memory'
}
// No URL changes, stored in memory
```

## Route Definition

### Simple Routes
```javascript
routes: {
  '/': 'HomePage',
  '/about': 'AboutPage',
  '/contact': 'ContactPage'
}
```

### Advanced Route Configuration
```javascript
routes: {
  '/users/:id': {
    component: 'UserPage',
    meta: { title: 'User Profile', requiresAuth: true },
    params: {
      id: { type: 'number', required: true, min: 1 }
    },
    guards: ['authGuard'],
    loadData: 'loadUserData',
    transitions: { enter: 'fadeIn', leave: 'fadeOut' }
  }
}
```

### Pattern Types

#### Parameter Routes
```javascript
'/users/:id'           // Required parameter
'/users/:id?'          // Optional parameter  
'/posts/:id/comments/:commentId'  // Multiple parameters
```

#### Wildcard Routes
```javascript
'/admin/*'             // Matches /admin/anything
'/docs/*'              // Matches /docs/path/to/file
```

#### Optional Parameters
```javascript
'/products/:category?' // Matches /products and /products/electronics
'/blog/:year?/:month?' // Matches /blog, /blog/2023, /blog/2023/12
```

#### Regex Routes
```javascript
'RegExp:^/files/(.+)\\.(jpg|png|gif)$'  // Custom regex patterns
```

## Parameters & Validation

### Parameter Configuration
```javascript
params: {
  id: {
    type: 'number',        // 'string' | 'number' | 'boolean' | 'date'
    required: true,        // Parameter is required
    min: 1,               // Minimum value (numbers)
    max: 9999,            // Maximum value (numbers)
    pattern: /^\d+$/,     // Regex pattern
    enum: ['active', 'inactive'],  // Allowed values
    default: 1            // Default value if not provided
  },
  category: {
    type: 'string',
    optional: true,
    enum: ['electronics', 'books', 'clothing'],
    maxLength: 50
  }
}
```

### Parameter Types & Validation

#### Number Parameters
```javascript
params: {
  page: { 
    type: 'number', 
    min: 1, 
    max: 1000, 
    default: 1 
  }
}
```

#### String Parameters
```javascript
params: {
  slug: { 
    type: 'string', 
    pattern: /^[a-z0-9-]+$/, 
    minLength: 3,
    maxLength: 50
  }
}
```

#### Boolean Parameters
```javascript
params: {
  published: { 
    type: 'boolean', 
    default: false 
  }
}
```

#### Date Parameters
```javascript
params: {
  date: { 
    type: 'date', 
    required: true 
  }
}
```

## Query Parameters

### Query Configuration
```javascript
'/search': {
  component: 'SearchPage',
  query: {
    q: { type: 'string', required: true },
    page: { type: 'number', default: 1, min: 1 },
    sort: { type: 'string', enum: ['date', 'name', 'relevance'] },
    filters: { type: 'array' }  // For multiple values
  }
}
```

### Accessing Query Parameters
```javascript
// In component
const SearchPage = (props, context) => {
  const query = context.getState('router.query', {});
  const searchTerm = query.q;
  const page = query.page || 1;
  
  return {
    div: {
      text: `Searching "${searchTerm}" - Page ${page}`
    }
  };
};
```

### Building Query Strings
```javascript
// Programmatic navigation with query
context.navigate('/search', {
  query: {
    q: 'javascript',
    page: 2,
    filters: ['recent', 'popular']
  }
});

// Manual query building
const queryString = app.buildQueryString({
  q: 'search term',
  page: 1,
  tags: ['tag1', 'tag2']
});
// Result: "q=search%20term&page=1&tags[]=tag1&tags[]=tag2"
```

## Route Guards

### Defining Guards
```javascript
const guards = {
  authGuard: async (context) => {
    const isAuthenticated = app.getState('auth.isAuthenticated');
    
    if (!isAuthenticated) {
      context.navigate('/login?returnUrl=' + encodeURIComponent(context.route));
      return false;
    }
    
    return true;
  },
  
  adminGuard: async (context) => {
    const user = app.getState('auth.user');
    
    if (!user || user.role !== 'admin') {
      alert('Admin access required');
      context.navigate('/');
      return false;
    }
    
    return true;
  }
};

// Router configuration
router: {
  guards,
  routes: {
    '/admin': {
      component: 'AdminPage',
      guards: ['authGuard', 'adminGuard']
    }
  }
}
```

### Guard Context
Guards receive a context object with:
- `route` - Current route path
- `from` - Previous route
- `to` - Target route  
- `params` - Route parameters
- `query` - Query parameters
- `navigate(path)` - Navigation function
- `getState(path)` - State getter
- `setState(path, value)` - State setter

### Multiple Guards
```javascript
routes: {
  '/protected': {
    component: 'ProtectedPage',
    guards: ['authGuard', 'permissionGuard', 'subscriptionGuard']
  }
}
```

## Navigation

### Programmatic Navigation
```javascript
// Basic navigation
context.navigate('/users/123');

// Navigation with options
context.navigate('/users/123', {
  replace: true,      // Replace current history entry
  query: { tab: 'profile' },  // Add query parameters
  state: { fromDashboard: true }  // History state
});

// Navigation with return URL
context.navigate(`/login?returnUrl=${encodeURIComponent(currentRoute)}`);
```

### Building Routes
```javascript
// Build route with parameters
const userRoute = app.buildRoute('/users/:id', { id: 123 });
// Result: "/users/123"

// Build route with query parameters
const searchRoute = app.buildRoute('/search', {}, { q: 'test', page: 2 });
// Result: "/search?q=test&page=2"
```

### Navigation Guards
```javascript
// Global navigation guards
const globalGuard = (from, to) => {
  // Check unsaved changes
  if (app.getState('editor.hasUnsavedChanges')) {
    return confirm('You have unsaved changes. Continue?');
  }
  return true;
};
```

## Components

### Router Component
The main router component that renders the current route:

```javascript
{
  Router: {
    loadingComponent: 'LoadingPage',    // Component for loading state
    errorComponent: 'ErrorPage',        // Component for errors
    notFoundComponent: 'NotFoundPage'   // Component for 404s
  }
}
```

### RouterLink Component
Navigation links with automatic active state:

```javascript
{
  RouterLink: {
    to: '/users/123',                   // Target route
    params: { id: 123 },               // Route parameters
    query: { tab: 'profile' },         // Query parameters
    exact: false,                      // Exact match for active state
    activeClass: 'router-link-active', // CSS class for active state
    replace: false,                    // Replace history entry
    text: 'View User'                  // Link text
  }
}
```

### RouterOutlet Component (Nested Routes)
For rendering nested route content:

```javascript
{
  RouterOutlet: {
    name: 'default',                   // Outlet name
    fallback: { div: { text: 'Loading...' } }  // Fallback content
  }
}
```

## Advanced Features

### Lazy Loading
```javascript
router: {
  lazy: {
    AdminPage: {
      loader: () => import('./components/AdminPage.js')
    },
    UserDashboard: {
      loader: async () => {
        const module = await import('./components/UserDashboard.js');
        return module.UserDashboard;
      }
    }
  }
}
```

### Route Data Loading
```javascript
routes: {
  '/users/:id': {
    component: 'UserPage',
    loadData: async (context) => {
      const userId = context.params.id;
      const userData = await fetchUser(userId);
      context.setState('user.current', userData);
    }
  }
}
```

### Route Transitions
```javascript
routes: {
  '/page': {
    component: 'Page',
    transitions: {
      enter: 'slideInRight',
      leave: 'slideOutLeft',
      duration: 300
    }
  }
}
```

### Route Middleware
```javascript
router: {
  middleware: [
    {
      path: '/admin/*',
      guard: async (context) => {
        // Log admin access
        console.log('Admin area accessed:', context.route);
        return true;
      }
    }
  ]
}
```

### Redirects and Aliases
```javascript
routes: {
  '/old-path': {
    redirectTo: '/new-path'
  },
  '/users/:id': {
    component: 'UserPage',
    alias: ['/profile/:id', '/member/:id']
  }
}
```

### Nested Routing
```javascript
routes: {
  '/admin': {
    component: 'AdminLayout',
    children: {
      'dashboard': { component: 'AdminDashboard' },
      'users': { component: 'AdminUsers' },
      'settings': { component: 'AdminSettings' }
    }
  }
}
```

### Scroll Behavior
```javascript
router: {
  scrollBehavior: (to, from) => {
    if (to.hash) {
      return { x: 0, y: document.querySelector(to.hash).offsetTop };
    }
    return { x: 0, y: 0 };
  }
}
```

## API Reference

### Router Instance Methods

#### `navigate(path, options = {})`
Navigate to a route programmatically.

```javascript
app.navigate('/users/123', {
  replace: false,
  query: { tab: 'profile' },
  state: { previous: 'dashboard' }
});
```

#### `buildRoute(pattern, params = {}, query = {})`
Build a route URL with parameters and query.

```javascript
const url = app.buildRoute('/users/:id', { id: 123 }, { tab: 'profile' });
// Result: "/users/123?tab=profile"
```

#### `matchRoute(path)`
Match a path against route patterns.

```javascript
const match = app.matchRoute('/users/123');
// Returns: { route, params, query, config }
```

#### `getCurrentRoute()`
Get the current route path.

```javascript
const currentRoute = app.getCurrentRoute();
```

### State Management

#### Router State
The router maintains the following state:

```javascript
{
  router: {
    currentRoute: '/users/123',      // Current route path
    params: { id: 123 },            // Route parameters  
    query: { tab: 'profile' },      // Query parameters
    hash: 'section1',               // URL hash
    isLoading: false,               // Loading state
    error: null,                    // Error message
    notFound: false                 // 404 state
  }
}
```

#### Accessing Router State
```javascript
// In components
const currentRoute = context.getState('router.currentRoute');
const params = context.getState('router.params', {});
const query = context.getState('router.query', {});

// Subscribe to changes
app.subscribe('router.currentRoute', (newRoute) => {
  console.log('Route changed to:', newRoute);
});
```

### Component Props

#### Router Component Props
```javascript
{
  Router: {
    loadingComponent: 'LoadingPage',
    errorComponent: 'ErrorPage', 
    notFoundComponent: 'NotFoundPage'
  }
}
```

#### RouterLink Component Props
```javascript
{
  RouterLink: {
    to: '/path',                    // Target route (required)
    params: {},                     // Route parameters
    query: {},                      // Query parameters
    exact: false,                   // Exact match for active state
    activeClass: 'router-link-active',  // Active CSS class
    replace: false,                 // Replace history entry
    text: 'Link Text',             // Link content
    onClick: (e) => {}             // Click handler
  }
}
```

## Examples

### Complete Authentication Flow
```javascript
const app = new Juris({
  states: {
    auth: {
      isAuthenticated: false,
      user: null
    }
  },
  
  router: {
    mode: 'history',
    guards: {
      authGuard: async (context) => {
        if (!app.getState('auth.isAuthenticated')) {
          context.navigate(`/login?returnUrl=${encodeURIComponent(context.route)}`);
          return false;
        }
        return true;
      }
    },
    
    routes: {
      '/': 'HomePage',
      '/login': 'LoginPage',
      '/profile': {
        component: 'ProfilePage',
        guards: ['authGuard']
      },
      '/admin/*': {
        component: 'AdminPage',
        guards: ['authGuard'],
        children: {
          'dashboard': { component: 'AdminDashboard' },
          'users': { component: 'AdminUsers' }
        }
      }
    }
  },
  
  components: {
    LoginPage: (props, context) => ({
      form: {
        onSubmit: async (e) => {
          e.preventDefault();
          // Login logic
          const success = await login(username, password);
          if (success) {
            const returnUrl = context.getState('router.query.returnUrl', '/');
            context.navigate(returnUrl);
          }
        }
      }
    })
  }
});
```

### E-commerce Product Catalog
```javascript
const app = new Juris({
  router: {
    routes: {
      '/': 'HomePage',
      '/products': {
        component: 'ProductListPage',
        query: {
          category: { type: 'string', optional: true },
          sort: { type: 'string', enum: ['price', 'name', 'rating'], default: 'name' },
          page: { type: 'number', min: 1, default: 1 },
          limit: { type: 'number', min: 10, max: 100, default: 20 }
        }
      },
      '/products/:id': {
        component: 'ProductDetailPage',
        params: {
          id: { type: 'number', required: true, min: 1 }
        },
        loadData: async (context) => {
          const product = await fetchProduct(context.params.id);
          context.setState('product.current', product);
        }
      },
      '/cart': 'CartPage',
      '/checkout': {
        component: 'CheckoutPage',
        guards: ['authGuard']
      }
    }
  }
});
```

### Blog with Categories and Tags
```javascript
const app = new Juris({
  router: {
    routes: {
      '/': 'HomePage',
      '/blog': {
        component: 'BlogListPage',
        query: {
          category: { type: 'string', optional: true },
          tag: { type: 'string', optional: true },
          page: { type: 'number', min: 1, default: 1 }
        }
      },
      '/blog/:slug': {
        component: 'BlogPostPage',
        params: {
          slug: { 
            type: 'string', 
            pattern: /^[a-z0-9-]+$/, 
            required: true 
          }
        }
      },
      '/categories/:category': {
        component: 'CategoryPage',
        params: {
          category: { type: 'string', required: true }
        }
      },
      '/tags/:tag': {
        component: 'TagPage',
        params: {
          tag: { type: 'string', required: true }
        }
      }
    }
  }
});
```

### Multi-tenant Application
```javascript
const app = new Juris({
  router: {
    routes: {
      '/:tenant/dashboard': {
        component: 'DashboardPage',
        params: {
          tenant: { 
            type: 'string', 
            pattern: /^[a-z0-9-]+$/, 
            required: true 
          }
        },
        guards: ['tenantGuard', 'authGuard']
      },
      '/:tenant/users/:userId': {
        component: 'UserPage',
        params: {
          tenant: { type: 'string', required: true },
          userId: { type: 'number', required: true }
        }
      }
    },
    
    guards: {
      tenantGuard: async (context) => {
        const tenant = context.params.tenant;
        const isValidTenant = await validateTenant(tenant);
        
        if (!isValidTenant) {
          context.navigate('/not-found');
          return false;
        }
        
        context.setState('app.currentTenant', tenant);
        return true;
      }
    }
  }
});
```

## Best Practices

### 1. Route Organization
```javascript
// Group related routes
const routes = {
  // Public routes
  '/': 'HomePage',
  '/about': 'AboutPage',
  '/contact': 'ContactPage',
  
  // Authentication routes
  '/login': { component: 'LoginPage', guards: ['guestGuard'] },
  '/register': { component: 'RegisterPage', guards: ['guestGuard'] },
  
  // Protected routes  
  '/profile': { component: 'ProfilePage', guards: ['authGuard'] },
  '/dashboard': { component: 'DashboardPage', guards: ['authGuard'] },
  
  // Admin routes
  '/admin/*': { 
    component: 'AdminLayout', 
    guards: ['authGuard', 'adminGuard'] 
  }
};
```

### 2. Parameter Validation
```javascript
// Always validate parameters
params: {
  id: { 
    type: 'number', 
    required: true, 
    min: 1,
    max: 999999
  },
  slug: { 
    type: 'string', 
    pattern: /^[a-z0-9-]+$/, 
    minLength: 3,
    maxLength: 100
  }
}
```

### 3. Error Handling
```javascript
// Comprehensive error handling
const guards = {
  dataGuard: async (context) => {
    try {
      const data = await fetchData(context.params.id);
      context.setState('page.data', data);
      return true;
    } catch (error) {
      context.setState('router.error', 'Failed to load data');
      return false;
    }
  }
};
```

### 4. State Management
```javascript
// Use consistent state structure
states: {
  router: {
    currentRoute: '/',
    params: {},
    query: {},
    isLoading: false,
    error: null
  },
  auth: {
    isAuthenticated: false,
    user: null,
    token: null
  },
  app: {
    theme: 'light',
    language: 'en'
  }
}
```

### 5. Component Design
```javascript
// Keep components focused and reusable
const UserPage = (props, context) => {
  const userId = context.getState('router.params.id');
  const user = context.getState('user.current');
  
  return {
    div: {
      className: 'user-page',
      children: [
        { UserHeader: { user } },
        { UserDetails: { user } },
        { UserActions: { userId } }
      ]
    }
  };
};
```

## Troubleshooting

### Common Issues

#### 1. Routes Not Matching
- Check route pattern syntax
- Verify parameter names match
- Ensure patterns are ordered correctly (specific before general)

#### 2. Guards Not Working
- Verify guard functions return boolean values
- Check guard registration in router config
- Ensure async guards return promises

#### 3. Parameters Not Updating
- Subscribe to router state changes
- Use reactive functions in components
- Check parameter validation configuration

#### 4. Navigation Issues
- Verify routing mode matches server configuration
- Check base path settings for history mode
- Ensure RouterLink components have correct props

### Debug Tips

```javascript
// Enable router debugging
app.subscribe('router.currentRoute', (route) => {
  console.log('Route changed:', route);
});

// Check current router state
console.log('Router state:', app.getState('router'));

// Inspect route matching
const match = app.matchRoute('/users/123');
console.log('Route match:', match);
```

---

## License

MIT License - see LICENSE file for details.

## Contributing

Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.