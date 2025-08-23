/**
 * Enhanced APIClient with implemented caching and retry logic
 * Based on the original APIClient but with missing features added
 */

function APIClient(props, context) {
  const { 
    baseURL = '', 
    defaultHeaders = {}, 
    timeout = 30000,
    retries = 3,              // Increased default retries
    retryDelay = 1000,
    cache = true,
    cacheTimeout = 300000,
    retryOn = [408, 429, 500, 502, 503, 504], // Default retry status codes
    cacheStrategy = 'memory'   // 'memory' or 'session'
  } = props;

  const { getState, setState } = context;
  
  // Initialize component state with unique ID
  const componentId = `apiClient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const requestsPath = `apiClient.${componentId}.requests`;
  const cachePath = `apiClient.${componentId}.cache`;
  const groupsPath = `apiClient.${componentId}.groups`;

  setState(requestsPath, {});
  setState(cachePath, {});
  setState(groupsPath, {});

  let requestIdCounter = 0;
  const generateRequestId = () => `req_${++requestIdCounter}_${Date.now()}`;

  // Enhanced cache key generation
  const generateCacheKey = (method, url, data = null, options = {}) => {
    const key = {
      method: method.toUpperCase(),
      url: baseURL + url,
      data,
      headers: { ...defaultHeaders, ...options.headers }
    };
    return btoa(JSON.stringify(key)).replace(/[+/=]/g, '');
  };

  // Check cache before making request
  const getCachedResponse = (cacheKey) => {
    if (!cache) return null;
    
    const cached = getState(`${cachePath}.${cacheKey}`, null, false);
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > cacheTimeout;
    if (isExpired) {
      setState(`${cachePath}.${cacheKey}`, null);
      return null;
    }
    
    return cached.data;
  };

  // Store successful response in cache
  const setCachedResponse = (cacheKey, data) => {
    if (!cache) return;
    
    setState(`${cachePath}.${cacheKey}`, {
      data,
      timestamp: Date.now()
    });
  };

  // Enhanced retry logic with exponential backoff
  const shouldRetry = (error, attempt, statusCode = null) => {
    if (attempt >= retries) return false;
    
    // Network errors
    if (error.name === 'TypeError' || error.name === 'NetworkError') {
      return true;
    }
    
    // HTTP status codes
    if (statusCode && retryOn.includes(statusCode)) {
      return true;
    }
    
    return false;
  };

  const calculateRetryDelay = (attempt) => {
    // Exponential backoff with jitter
    const baseDelay = retryDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 0.1 * baseDelay;
    return baseDelay + jitter;
  };

  // Create request state with enhanced metadata
  const createRequestState = (requestId, url, options = {}) => {
    const requestState = {
      id: requestId,
      url,
      options,
      data: null,
      error: null,
      loading: true,
      cancelled: false,
      aborted: false,
      completed: false,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: retries,
      group: options.group || 'default',
      cacheKey: options.cacheKey || null,
      fromCache: false
    };

    setState(`${requestsPath}.${requestId}`, requestState);
    
    // Add to group tracking
    const groups = getState(groupsPath, {});
    const currentGroup = groups[requestState.group] || [];
    setState(`${groupsPath}.${requestState.group}`, [...currentGroup, requestId]);
    
    return requestState;
  };

  // Update request state with enhanced validation
  const updateRequestState = (requestId, updates) => {
    const currentState = getState(`${requestsPath}.${requestId}`, {});
    
    if (currentState.cancelled) {
      const allowedUpdates = {};
      const allowedKeys = ['aborted', 'completed', 'loading', 'retryCount'];
      
      Object.keys(updates).forEach(key => {
        if (allowedKeys.includes(key)) {
          allowedUpdates[key] = updates[key];
        }
      });
      
      if (Object.keys(allowedUpdates).length > 0) {
        setTimeout(() => {
          setState(`${requestsPath}.${requestId}`, { ...currentState, ...allowedUpdates });
        }, 0);
      }
      return;
    }
    
    setTimeout(() => {
      const latestState = getState(`${requestsPath}.${requestId}`, {});
      if (!latestState.cancelled) {
        setState(`${requestsPath}.${requestId}`, { ...latestState, ...updates });
      }
    }, 0);
  };

  // Enhanced cancel functionality
  const cancelRequest = (requestId) => {
    const currentState = getState(`${requestsPath}.${requestId}`, {});
    
    setState(`${requestsPath}.${requestId}`, { 
      ...currentState,
      cancelled: true,
      loading: false 
    });
    
    // Remove from group tracking
    const group = currentState.group;
    if (group) {
      const groups = getState(groupsPath, {});
      const currentGroup = groups[group] || [];
      setState(`${groupsPath}.${group}`, currentGroup.filter(id => id !== requestId));
    }
  };

  const cancelGroup = (groupName) => {
    const groups = getState(groupsPath, {});
    const requestIds = groups[groupName] || [];
    
    requestIds.forEach(requestId => cancelRequest(requestId));
    setState(`${groupsPath}.${groupName}`, []);
  };

  const cancelAll = () => {
    const groups = getState(groupsPath, {});
    Object.keys(groups).forEach(groupName => cancelGroup(groupName));
  };

  // Enhanced core fetch with retry logic
  const performRequest = async (requestId, method, url, data = null, requestOptions = {}, attempt = 0) => {
    const fullUrl = baseURL + url;
    const currentState = getState(`${requestsPath}.${requestId}`);
    
    if (currentState?.cancelled) return;

    // Check cache for GET requests
    if (method.toUpperCase() === 'GET' && cache && attempt === 0) {
      const cacheKey = generateCacheKey(method, url, data, requestOptions);
      const cachedData = getCachedResponse(cacheKey);
      
      if (cachedData) {
        updateRequestState(requestId, {
          data: cachedData,
          error: null,
          loading: false,
          completed: true,
          fromCache: true,
          cacheKey
        });
        return;
      }
      
      // Store cache key for later use
      updateRequestState(requestId, { cacheKey });
    }

    const controller = new AbortController();
    const config = {
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        ...defaultHeaders,
        ...requestOptions.headers
      },
      signal: controller.signal,
      ...requestOptions
    };

    if (data && method.toUpperCase() !== 'GET') {
      config.body = JSON.stringify(data);
    }

    const timeoutId = setTimeout(() => {
      controller.abort();
      updateRequestState(requestId, {
        error: `Request timeout after ${timeout}ms`,
        loading: false,
        aborted: true,
        completed: true
      });
    }, timeout);

    try {
      if (getState(`${requestsPath}.${requestId}`)?.cancelled) {
        clearTimeout(timeoutId);
        return;
      }

      const response = await fetch(fullUrl, config);
      clearTimeout(timeoutId);

      if (getState(`${requestsPath}.${requestId}`)?.cancelled) return;

      if (!response.ok) {
        // Check if we should retry
        if (shouldRetry(null, attempt, response.status)) {
          updateRequestState(requestId, { retryCount: attempt + 1 });
          
          const delay = calculateRetryDelay(attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          return performRequest(requestId, method, url, data, requestOptions, attempt + 1);
        }

        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { 
            message: errorText,
            status: response.status,
            statusText: response.statusText
          };
        }

        updateRequestState(requestId, {
          error: errorData,
          loading: false,
          completed: true
        });
        return;
      }

      // Parse response
      const contentType = response.headers.get('content-type');
      let responseData;
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      if (getState(`${requestsPath}.${requestId}`)?.cancelled) return;

      // Cache successful GET responses
      if (method.toUpperCase() === 'GET' && cache) {
        const state = getState(`${requestsPath}.${requestId}`);
        if (state?.cacheKey) {
          setCachedResponse(state.cacheKey, responseData);
        }
      }

      updateRequestState(requestId, {
        data: responseData,
        error: null,
        loading: false,
        completed: true,
        retryCount: attempt
      });

    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        const currentState = getState(`${requestsPath}.${requestId}`);
        if (!currentState?.cancelled) {
          updateRequestState(requestId, {
            aborted: true,
            loading: false,
            completed: true
          });
        }
        return;
      }

      // Check if we should retry on network errors
      if (shouldRetry(error, attempt)) {
        updateRequestState(requestId, { retryCount: attempt + 1 });
        
        const delay = calculateRetryDelay(attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return performRequest(requestId, method, url, data, requestOptions, attempt + 1);
      }

      updateRequestState(requestId, {
        error: {
          message: error.message || 'Network request failed',
          type: error.name,
          retryCount: attempt
        },
        loading: false,
        completed: true
      });
    }
  };

  // Enhanced request tracker with additional metadata
  const createRequestTracker = (requestId) => {
    return {
      data: () => getState(`${requestsPath}.${requestId}.data`, null),
      error: () => getState(`${requestsPath}.${requestId}.error`, null),
      loading: () => getState(`${requestsPath}.${requestId}.loading`, false),
      cancelled: () => getState(`${requestsPath}.${requestId}.cancelled`, false),
      completed: () => getState(`${requestsPath}.${requestId}.completed`, false),
      retryCount: () => getState(`${requestsPath}.${requestId}.retryCount`, 0),
      fromCache: () => getState(`${requestsPath}.${requestId}.fromCache`, false),
      cancel: () => cancelRequest(requestId),
      retry: () => {
        const state = getState(`${requestsPath}.${requestId}`, {});
        if (state.completed || state.cancelled) {
          // Reset state for retry
          updateRequestState(requestId, {
            loading: true,
            completed: false,
            error: null,
            data: null,
            retryCount: 0
          });
          // Restart request
          setTimeout(() => performRequest(requestId, 'GET', state.url, null, state.options), 0);
        }
      }
    };
  };

  // HTTP Methods with enhanced options
  const get = (url, options = {}) => {
    const { group = 'default', cancelPrevious = false } = options;
    
    if (cancelPrevious) cancelGroup(group);
    
    const requestId = generateRequestId();
    const cacheKey = generateCacheKey('GET', url, null, options);
    createRequestState(requestId, url, { ...options, group, cacheKey });
    setTimeout(() => performRequest(requestId, 'GET', url, null, options), 0);
    return createRequestTracker(requestId);
  };

  const post = (url, data, options = {}) => {
    const { group = 'default', cancelPrevious = false } = options;
    
    if (cancelPrevious) cancelGroup(group);
    
    const requestId = generateRequestId();
    createRequestState(requestId, url, { ...options, data, group });
    setTimeout(() => performRequest(requestId, 'POST', url, data, options), 0);
    return createRequestTracker(requestId);
  };

  const put = (url, data, options = {}) => {
    const { group = 'default', cancelPrevious = false } = options;
    
    if (cancelPrevious) cancelGroup(group);
    
    const requestId = generateRequestId();
    createRequestState(requestId, url, { ...options, data, group });
    setTimeout(() => performRequest(requestId, 'PUT', url, data, options), 0);
    return createRequestTracker(requestId);
  };

  const patch = (url, data, options = {}) => {
    const { group = 'default', cancelPrevious = false } = options;
    
    if (cancelPrevious) cancelGroup(group);
    
    const requestId = generateRequestId();
    createRequestState(requestId, url, { ...options, data, group });
    setTimeout(() => performRequest(requestId, 'PATCH', url, data, options), 0);
    return createRequestTracker(requestId);
  };

  const del = (url, options = {}) => {
    const { group = 'default', cancelPrevious = false } = options;
    
    if (cancelPrevious) cancelGroup(group);
    
    const requestId = generateRequestId();
    createRequestState(requestId, url, { ...options, group });
    setTimeout(() => performRequest(requestId, 'DELETE', url, null, options), 0);
    return createRequestTracker(requestId);
  };

  // Cache management utilities
  const clearCache = (pattern = null) => {
    const cache = getState(cachePath, {});
    if (pattern) {
      const regex = new RegExp(pattern);
      Object.keys(cache).forEach(key => {
        if (regex.test(key)) {
          setState(`${cachePath}.${key}`, null);
        }
      });
    } else {
      setState(cachePath, {});
    }
  };

  const getCacheStats = () => {
    const cache = getState(cachePath, {});
    const keys = Object.keys(cache);
    const totalSize = JSON.stringify(cache).length;
    const validEntries = keys.filter(key => {
      const entry = cache[key];
      return entry && (Date.now() - entry.timestamp < cacheTimeout);
    });

    return {
      totalEntries: keys.length,
      validEntries: validEntries.length,
      expiredEntries: keys.length - validEntries.length,
      approximateSize: `${(totalSize / 1024).toFixed(2)} KB`
    };
  };

  // Enhanced cleanup
  const cleanup = () => {
    cancelAll();
    setState(requestsPath, {});
    setState(cachePath, {});
    setState(groupsPath, {});
  };

  // Public API with enhanced methods
  const api = {
    // HTTP methods
    get, post, put, patch, delete: del,
    
    // Group management
    cancelGroup, cancelAll,
    
    // Cache management
    clearCache, getCacheStats,
    
    // Utilities
    cleanup,
    
    // Access to state paths
    requestsPath, cachePath, groupsPath, componentId,
    
    // Enhanced utilities
    getRequestState: (requestId) => getState(`${requestsPath}.${requestId}`, null),
    getAllRequests: () => getState(requestsPath, {}),
    getGroupRequests: (group) => {
      const groups = getState(groupsPath, {});
      const requestIds = groups[group] || [];
      return requestIds.map(id => getState(`${requestsPath}.${id}`, null)).filter(Boolean);
    }
  };

  return {
    api,
    hooks: {
      onRegister: () => {
        console.log(`Enhanced APIClient ${componentId} registered with caching and retry support`);
      },
      onUnregister: () => {
        console.log(`Enhanced APIClient ${componentId} cleaning up`);
        cleanup();
      }
    }
  };
}

// Export for both browser and Node.js environments
if (typeof window !== 'undefined') {
  window.APIClient = APIClient;
  Object.freeze(window.APIClient);
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports.APIClient = APIClient;
  module.exports.default = APIClient;
}