/**
 * Generic APIClient Headless Component for Juris
 * Integrates with Juris HeadlessManager architecture
 * When cancel() is called, data will NOT be updated when it arrives
 * FIXED: Circular dependency issue in updateRequestState
 */

function APIClient(props, context) {
  const { 
    baseURL = '', 
    defaultHeaders = {}, 
    timeout = 30000,
    retries = 0,
    retryDelay = 1000,
    cache = true,
    cacheTimeout = 300000
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

  // Create request state with cancellation tracking
  const createRequestState = (requestId, url, options = {}) => {
    const requestState = {
      id: requestId,
      url,
      options,
      data: null,
      error: null,
      loading: true,
      cancelled: false,        // User-triggered cancellation
      aborted: false,          // System/timeout cancellation
      completed: false,        // Request completed (success or error)
      timestamp: Date.now(),
      retryCount: 0,
      group: options.group || 'default'
    };

    setState(`${requestsPath}.${requestId}`, requestState);
    
    // Add to group tracking
    const groups = getState(groupsPath, {});
    const currentGroup = groups[requestState.group] || [];
    setState(`${groupsPath}.${requestState.group}`, [...currentGroup, requestId]);
    
    return requestState;
  };

  // Update request state - but only if not cancelled
  // FIXED: Use async update to prevent circular dependency
  const updateRequestState = (requestId, updates) => {
    const currentState = getState(`${requestsPath}.${requestId}`, {});
    
    // CRITICAL: If cancelled, don't update data/error, only internal states
    if (currentState.cancelled) {
      // Only allow updates to internal tracking states
      const allowedUpdates = {};
      const allowedKeys = ['aborted', 'completed', 'loading', 'retryCount'];
      
      Object.keys(updates).forEach(key => {
        if (allowedKeys.includes(key)) {
          allowedUpdates[key] = updates[key];
        }
      });
      
      if (Object.keys(allowedUpdates).length > 0) {
        // Use setTimeout to break potential circular dependencies
        setTimeout(() => {
          setState(`${requestsPath}.${requestId}`, { ...currentState, ...allowedUpdates });
        }, 0);
      }
      
      return; // Don't update data/error for cancelled requests
    }
    
    // Normal update for non-cancelled requests
    // Use setTimeout to prevent circular dependency issues
    setTimeout(() => {
      const latestState = getState(`${requestsPath}.${requestId}`, {});
      // Double-check cancellation status after timeout
      if (!latestState.cancelled) {
        setState(`${requestsPath}.${requestId}`, { ...latestState, ...updates });
      }
    }, 0);
  };

  // Cancel request - prevents future state updates
  const cancelRequest = (requestId) => {
    const currentState = getState(`${requestsPath}.${requestId}`, {});
    
    // Mark as cancelled - this prevents future data updates
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

  // Cancel all requests in a group
  const cancelGroup = (groupName) => {
    const groups = getState(groupsPath, {});
    const requestIds = groups[groupName] || [];
    
    requestIds.forEach(requestId => {
      cancelRequest(requestId);
    });
    
    setState(`${groupsPath}.${groupName}`, []);
  };

  // Cancel all active requests
  const cancelAll = () => {
    const groups = getState(groupsPath, {});
    Object.keys(groups).forEach(groupName => {
      cancelGroup(groupName);
    });
  };

  // Core fetch implementation with cancellation awareness
  const performRequest = async (requestId, method, url, data = null, requestOptions = {}) => {
    const fullUrl = baseURL + url;
    
    // Check if already cancelled before starting
    const initialState = getState(`${requestsPath}.${requestId}`);
    if (initialState?.cancelled) {
      return; // Don't even start the request
    }

    // Create abort controller
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

    // Set up timeout
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
      // Check cancellation before fetch
      const preRequestState = getState(`${requestsPath}.${requestId}`);
      if (preRequestState?.cancelled) {
        clearTimeout(timeoutId);
        return;
      }

      // Perform fetch
      const response = await fetch(fullUrl, config);
      clearTimeout(timeoutId);

      // Check cancellation after fetch but before processing
      const postRequestState = getState(`${requestsPath}.${requestId}`);
      if (postRequestState?.cancelled) {
        return; // Discard response, don't update state
      }

      // Process response
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        // Update error state (if not cancelled)
        updateRequestState(requestId, {
          error: errorData,
          loading: false,
          completed: true
        });
        return;
      }

      // Parse response data
      const contentType = response.headers.get('content-type');
      let responseData;
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      // Final cancellation check before updating data
      const finalState = getState(`${requestsPath}.${requestId}`);
      if (finalState?.cancelled) {
        return; // Data arrived but request was cancelled - discard it
      }

      // Update success state
      updateRequestState(requestId, {
        data: responseData,
        error: null,
        loading: false,
        completed: true
      });

    } catch (error) {
      clearTimeout(timeoutId);

      // Check if it was an abort (cancellation or timeout)
      if (error.name === 'AbortError') {
        // Could be user cancellation or timeout
        const currentState = getState(`${requestsPath}.${requestId}`);
        if (!currentState?.cancelled) {
          // It was a timeout abort, not user cancellation
          updateRequestState(requestId, {
            aborted: true,
            loading: false,
            completed: true
          });
        }
        return;
      }

      // Network or other error - only update if not cancelled
      updateRequestState(requestId, {
        error: error.message || 'Network request failed',
        loading: false,
        completed: true
      });
    }
  };

  // Create reactive request tracker with cancellation
  const createRequestTracker = (requestId) => {
    return {
      data: () => getState(`${requestsPath}.${requestId}.data`, null),
      error: () => getState(`${requestsPath}.${requestId}.error`, null),
      loading: () => getState(`${requestsPath}.${requestId}.loading`, false),
      cancelled: () => getState(`${requestsPath}.${requestId}.cancelled`, false),
      completed: () => getState(`${requestsPath}.${requestId}.completed`, false),
      cancel: () => cancelRequest(requestId)
    };
  };

  // Enhanced HTTP Methods with group management
  const get = (url, options = {}) => {
    const { group = 'default', cancelPrevious = false } = options;
    
    // Cancel previous requests in this group if requested
    if (cancelPrevious) {
      cancelGroup(group);
    }
    
    const requestId = generateRequestId();
    createRequestState(requestId, url, { ...options, group });
    setTimeout(() => performRequest(requestId, 'GET', url, null, options), 0);
    return createRequestTracker(requestId);
  };

  const post = (url, data, options = {}) => {
    const { group = 'default', cancelPrevious = false } = options;
    
    if (cancelPrevious) {
      cancelGroup(group);
    }
    
    const requestId = generateRequestId();
    createRequestState(requestId, url, { ...options, data, group });
    setTimeout(() => performRequest(requestId, 'POST', url, data, options), 0);
    return createRequestTracker(requestId);
  };

  const put = (url, data, options = {}) => {
    const { group = 'default', cancelPrevious = false } = options;
    
    if (cancelPrevious) {
      cancelGroup(group);
    }
    
    const requestId = generateRequestId();
    createRequestState(requestId, url, { ...options, data, group });
    setTimeout(() => performRequest(requestId, 'PUT', url, data, options), 0);
    return createRequestTracker(requestId);
  };

  const patch = (url, data, options = {}) => {
    const { group = 'default', cancelPrevious = false } = options;
    
    if (cancelPrevious) {
      cancelGroup(group);
    }
    
    const requestId = generateRequestId();
    createRequestState(requestId, url, { ...options, data, group });
    setTimeout(() => performRequest(requestId, 'PATCH', url, data, options), 0);
    return createRequestTracker(requestId);
  };

  const del = (url, options = {}) => {
    const { group = 'default', cancelPrevious = false } = options;
    
    if (cancelPrevious) {
      cancelGroup(group);
    }
    
    const requestId = generateRequestId();
    createRequestState(requestId, url, { ...options, group });
    setTimeout(() => performRequest(requestId, 'DELETE', url, null, options), 0);
    return createRequestTracker(requestId);
  };

  // Cleanup function for headless lifecycle
  const cleanup = () => {
    cancelAll();
    setState(requestsPath, {});
    setState(cachePath, {});
    setState(groupsPath, {});
  };

  // Public API object that will be returned
  const api = {
    // HTTP methods with built-in group management
    get,
    post,
    put,
    patch,
    delete: del,
    
    // Group management utilities
    cancelGroup,
    cancelAll,
    
    // Utility methods
    cleanup,
    
    // Access to state paths for advanced usage
    requestsPath,
    cachePath,
    groupsPath,
    componentId
  };

  // Return headless component structure
  return {
    // Public API that gets exposed
    api,
    
    // Lifecycle hooks for HeadlessManager
    hooks: {
      onRegister: () => {
        console.log(`APIClient ${componentId} registered`);
      },
      
      onUnregister: () => {
        console.log(`APIClient ${componentId} cleaning up`);
        cleanup();
      }
    }
  };
}

if (typeof window !== 'undefined') {
  window.APIClient = APIClient;
  Object.freeze(window.APIClient);
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports.APIClient = APIClient;
  module.exports.default = APIClient;
}