// ===================================================================
// FLUENTSTATE - MINIMAL FIX TO THE WORKING VERSION
// ===================================================================

function createFluentStateHeadless(props, context) {
    console.log('🏗️ Initializing Clean FluentState...');
    
    // GLOBAL BATCHING SYSTEM
    let batchActive = false;
    let batchQueue = [];
    let mainFluentState = null;
    
    const batch = (callback) => {
        batchActive = true;
        batchQueue = [];
        
        try {
            const result = callback();
            
            // Process all batched changes
            if (batchQueue.length > 0) {
                console.log(`🔄 Processing ${batchQueue.length} batched changes`);
                const affectedPaths = new Set(batchQueue.map(item => item.path));
                mainFluentState._processBatch(affectedPaths);
            }
            
            return result;
        } finally {
            batchActive = false;
            batchQueue = [];
        }
    };

    // MAIN FLUENTSTATE CLASS
    class FluentState {
        constructor(juris, basePath = '', isNonReactive = false) {
            this._juris = juris;
            this._basePath = basePath;
            this._isNonReactive = isNonReactive;
            this._subscriptions = new Map();
            this._cache = new Map();
            
            return this._createProxy();
        }
        
        _createProxy() {
            return new Proxy(this, {
                get: (target, prop) => this._handleGet(prop),
                set: (target, prop, value) => this._handleSet(prop, value),
                has: (target, prop) => true,
                ownKeys: (target) => {
                    const state = this._getState();
                    return state && typeof state === 'object' ? Object.keys(state) : [];
                }
            });
        }
        
        _handleGet(prop) {
            // Internal JS properties
            if (this._isInternalProp(prop)) {
                return this._handleInternalProp(prop);
            }
            
            // FluentState methods
            if (this._isFluentMethod(prop)) {
                return this._handleFluentMethod(prop);
            }
            
            // For primitive values, we need special handling
            const currentValue = this._getState();
            
            // If current value is primitive and we're accessing a property that doesn't exist on primitives,
            // return undefined (like accessing 'foo' on a string)
            if (currentValue !== null && typeof currentValue !== 'object') {
                // Check if this property exists on the primitive type
                if (!(prop in Object(currentValue))) {
                    return undefined;
                }
                // Return the property from the primitive (like 'length' on strings)
                return currentValue[prop];
            }
            
            // State property access for objects
            return this._handlePropertyAccess(prop);
        }
        
        _handleSet(prop, value) {
            // Ignore internal properties
            if (typeof prop === 'symbol' || prop.startsWith('_')) {
                this[prop] = value;
                return true;
            }
            
            const fullPath = this._getFullPath(prop);
            const oldValue = this._juris.getState(fullPath);
            
            console.log(`${this._isNonReactive ? '$.x' : '$'} SET ${fullPath} =`, value);
            
            // Create parent paths if needed - BEFORE setting the value
            this._ensureParentPaths(fullPath);
            
            // Set the value in Juris state
            this._juris.setState(fullPath, value);
            
            // Handle subscriptions (only for reactive instances)
            if (!this._isNonReactive) {
                this._handleSubscriptions(fullPath, value, oldValue);
            }
            
            // Clear cache after successful set
            this._cache.clear();
            
            return true;
        }
        
        _handlePropertyAccess(prop) {
            const fullPath = this._getFullPath(prop);
            let value = this._juris.getState(fullPath);
            
            console.log(`${this._isNonReactive ? '$.x' : '$'} GET ${fullPath} =`, value);
            
            // If value is primitive, return it directly
            if (value !== null && value !== undefined && typeof value !== 'object') {
                return value;
            }
            
            // If value is object/array, return a child FluentState
            if (value !== null && value !== undefined && typeof value === 'object') {
                return this._getChildFluentState(fullPath);
            }
            
            // If value doesn't exist, return a "lazy" proxy
            return this._createLazyProxy(fullPath);
        }

        _createLazyProxy(fullPath) {
            const self = this;
            
            return new Proxy({}, {
                get(target, prop) {
                    // Handle exists() method specially - check without creating
                    if (prop === 'exists') {
                        return () => {
                            const state = self._juris.getState(fullPath);
                            return state !== null && state !== undefined;
                        };
                    }
                    
                    // FIRST: Check if the path actually exists now (might have been created)
                    const currentState = self._juris.getState(fullPath);
                    if (currentState !== null && currentState !== undefined && typeof currentState === 'object') {
                        // Path exists now, delegate to real FluentState
                        const realProxy = self._getChildFluentState(fullPath);
                        return realProxy[prop];
                    }
                    
                    // Handle array methods specially - create as array
                    if (['push', 'pop', 'shift', 'unshift', 'splice'].includes(prop)) {
                        console.log(`📁 Auto-creating missing path as ARRAY for method ${prop}: ${fullPath}`);
                        self._juris.setState(fullPath, []);
                        const realProxy = self._getChildFluentState(fullPath);
                        return realProxy[prop];
                    }
                    
                    // Check if we're trying to access a property that was already set
                    const childPath = fullPath ? `${fullPath}.${prop}` : String(prop);
                    const childValue = self._juris.getState(childPath);
                    
                    if (childValue !== null && childValue !== undefined) {
                        // The child property exists! Create parent and return real proxy
                        if (currentState === null || currentState === undefined) {
                            self._juris.setState(fullPath, {});
                        }
                        const realProxy = self._getChildFluentState(fullPath);
                        return realProxy[prop];
                    }
                    
                    // For other method/property access, auto-create as object ONLY if it doesn't exist
                    console.log(`📁 Auto-creating missing path as OBJECT: ${fullPath}`);
                    self._juris.setState(fullPath, {});
                    
                    // Now return the real FluentState proxy
                    const realProxy = self._getChildFluentState(fullPath);
                    return realProxy[prop];
                },
                
                set(target, prop, value) {
                    // Check if parent path exists, if not create it
                    const currentState = self._juris.getState(fullPath);
                    if (currentState === null || currentState === undefined || typeof currentState !== 'object') {
                        console.log(`📁 Auto-creating missing path as OBJECT on SET: ${fullPath}`);
                        self._juris.setState(fullPath, {});
                    }
                    
                    // Set the property directly using the parent path logic
                    const childPath = fullPath ? `${fullPath}.${prop}` : String(prop);
                    self._juris.setState(childPath, value);
                    
                    // Handle subscriptions if needed
                    if (!self._isNonReactive) {
                        self._handleSubscriptions(childPath, value, undefined);
                    }
                    
                    // Clear cache
                    self._cache.clear();
                    
                    return true;
                }
            });
        }
        
        _isInternalProp(prop) {
            return typeof prop === 'symbol' || 
                   prop === 'valueOf' || 
                   prop === 'toString' || 
                   prop === 'toJSON' ||
                   prop === 'constructor' ||
                   prop === Symbol.toStringTag ||
                   prop === Symbol.toPrimitive ||
                   prop.startsWith('_');
        }
        
        _handleInternalProp(prop) {
            const state = this._getState();
            
            switch (prop) {
                case 'valueOf':
                case Symbol.toPrimitive:
                    return () => state;
                case 'toString':
                    return () => String(state || '');
                case 'toJSON':
                    return () => state;
                case Symbol.toStringTag:
                    if (state === null) return 'null';
                    if (Array.isArray(state)) return 'Array';
                    if (typeof state === 'object') return 'Object';
                    return typeof state; // 'string', 'number', etc.
                default:
                    // For primitive values, delegate to the primitive's properties
                    if (state !== null && typeof state !== 'object') {
                        return state[prop];
                    }
                    return this[prop];
            }
        }
        
        _isFluentMethod(prop) {
            const methods = [
                'x', 'subscribe', 'watch', 'onChange', 'unsubscribe',
                'push', 'pop', 'shift', 'unshift', 'splice',
                'update', 'clear', 'exists', 'raw'
            ];
            return typeof prop === 'string' && methods.includes(prop);
        }
        
        _handleFluentMethod(prop) {
            switch (prop) {
                case 'x':
                    return this._getNonReactiveProxy();
                    
                case 'subscribe':
                case 'watch':
                    return this._createSubscriptionMethod(prop);
                    
                case 'onChange':
                    return this._createSubscriptionMethod('onChange');
                    
                case 'unsubscribe':
                    return (id) => this._removeSubscription(id);
                    
                case 'push':
                    return this._createPushMethod();
                    
                case 'update':
                    return this._createUpdateMethod();
                    
                case 'clear':
                    return this._createClearMethod();
                    
                case 'exists':
                    return () => {
                        const state = this._getState();
                        return state !== null && state !== undefined;
                    };
                    
                case 'raw':
                    return () => this._getState();
                    
                default:
                    return undefined;
            }
        }
        
        _getNonReactiveProxy() {
            if (!this._nonReactiveProxy) {
                this._nonReactiveProxy = new FluentState(this._juris, this._basePath, true);
                // Share subscriptions between reactive and non-reactive
                this._nonReactiveProxy._subscriptions = this._subscriptions;
            }
            return this._nonReactiveProxy;
        }
        
        _createSubscriptionMethod(type) {
            // Block subscription methods on non-reactive proxies
            if (this._isNonReactive) {
                console.warn('⚠️ Subscription methods not available on non-reactive proxy ($.x)');
                return undefined;
            }
            
            return (callback, options = {}) => {
                const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                
                const subscription = {
                    id: subscriptionId,
                    path: this._basePath,
                    callback,
                    active: true,
                    options: {
                        immediate: type === 'subscribe' ? options.immediate ?? false : false,
                        deep: options.deep ?? true,
                        once: options.once ?? false,
                        ...options
                    }
                };
                
                // Store subscription
                if (!this._subscriptions.has(this._basePath)) {
                    this._subscriptions.set(this._basePath, new Map());
                }
                this._subscriptions.get(this._basePath).set(subscriptionId, subscription);
                
                console.log(`📡 Subscription created: ${this._basePath} (${subscriptionId})`);
                
                // Immediate callback
                if (subscription.options.immediate) {
                    try {
                        const currentValue = this._getState();
                        callback(currentValue, undefined, this._basePath);
                    } catch (error) {
                        console.error('Error in immediate subscription:', error);
                    }
                }
                
                // Return unsubscribe function
                return () => this._removeSubscription(subscriptionId);
            };
        }
        
        _removeSubscription(subscriptionId) {
            for (const [path, pathSubs] of this._subscriptions) {
                if (pathSubs.has(subscriptionId)) {
                    pathSubs.delete(subscriptionId);
                    if (pathSubs.size === 0) {
                        this._subscriptions.delete(path);
                    }
                    console.log(`📡 Subscription removed: ${subscriptionId}`);
                    return true;
                }
            }
            return false;
        }
        
        _createPushMethod() {
            return (...items) => {
                let currentArray = this._getState();
                
                // Convert non-arrays to arrays
                if (!Array.isArray(currentArray)) {
                    currentArray = currentArray == null ? [] : [currentArray];
                }
                
                const newArray = [...currentArray, ...items];
                const oldValue = currentArray;
                
                this._juris.setState(this._basePath, newArray);
                
                if (!this._isNonReactive) {
                    this._handleSubscriptions(this._basePath, newArray, oldValue);
                }
                
                return newArray.length;
            };
        }
        
        _createUpdateMethod() {
            return (updates) => {
                const currentState = this._getState();
                const oldValue = currentState;
                const newValue = { ...(currentState || {}), ...updates };
                
                this._juris.setState(this._basePath, newValue);
                
                if (!this._isNonReactive) {
                    this._handleSubscriptions(this._basePath, newValue, oldValue);
                }
                
                return newValue;
            };
        }
        
        _createClearMethod() {
            return () => {
                const oldValue = this._getState();
                this._juris.setState(this._basePath, null);
                
                if (!this._isNonReactive) {
                    this._handleSubscriptions(this._basePath, null, oldValue);
                }
                
                this._cache.clear();
            };
        }
        
        _handleSubscriptions(path, newValue, oldValue) {
            if (batchActive) {
                // Queue for batch processing
                batchQueue.push({ path, newValue, oldValue });
                return;
            }
            
            // Process immediately
            this._triggerSubscriptions(path, newValue, oldValue);
        }
        
        _processBatch(affectedPaths) {
            const triggeredSubscriptions = new Set();
            
            // Check all subscriptions to see which should be triggered
            for (const [subPath, pathSubs] of this._subscriptions) {
                for (const [subId, subscription] of pathSubs) {
                    if (!subscription.active) continue;
                    
                    const uniqueKey = `${subPath}_${subId}`;
                    if (triggeredSubscriptions.has(uniqueKey)) continue;
                    
                    // Check if any affected path should trigger this subscription
                    for (const affectedPath of affectedPaths) {
                        if (this._shouldTriggerSubscription(affectedPath, subPath, subscription.options)) {
                            console.log(`🎯 Batch triggering: ${subPath} due to ${affectedPath}`);
                            
                            try {
                                const currentValue = this._juris.getState(subPath);
                                subscription.callback(currentValue, undefined, affectedPath);
                                
                                if (subscription.options.once) {
                                    pathSubs.delete(subId);
                                }
                                
                                triggeredSubscriptions.add(uniqueKey);
                                break;
                            } catch (error) {
                                console.error('Error in batched subscription:', error);
                            }
                        }
                    }
                }
            }
        }
        
        _triggerSubscriptions(changedPath, newValue, oldValue) {
            for (const [subPath, pathSubs] of this._subscriptions) {
                for (const [subId, subscription] of pathSubs) {
                    if (!subscription.active) continue;
                    
                    if (this._shouldTriggerSubscription(changedPath, subPath, subscription.options)) {
                        console.log(`🔔 Triggering: ${subPath} due to ${changedPath}`);
                        
                        try {
                            const relevantValue = subPath === changedPath ? newValue : this._juris.getState(subPath);
                            const relevantOldValue = subPath === changedPath ? oldValue : undefined;
                            
                            subscription.callback(relevantValue, relevantOldValue, changedPath);
                            
                            if (subscription.options.once) {
                                pathSubs.delete(subId);
                            }
                        } catch (error) {
                            console.error('Error in subscription callback:', error);
                        }
                    }
                }
            }
        }
        
        _shouldTriggerSubscription(changedPath, subscriptionPath, options) {
            // Exact match
            if (changedPath === subscriptionPath) return true;
            
            // Deep watching: changed path is child of subscription path
            if (options.deep && changedPath.startsWith(subscriptionPath + '.')) return true;
            
            // Parent changed: subscription path is child of changed path
            if (subscriptionPath.startsWith(changedPath + '.')) return true;
            
            return false;
        }
        
        _getChildFluentState(path) {
            const cacheKey = this._isNonReactive ? `${path}_nonreactive` : path;
            
            if (this._cache.has(cacheKey)) {
                return this._cache.get(cacheKey);
            }
            
            const childFluentState = new FluentState(this._juris, path, this._isNonReactive);
            // Share subscriptions
            childFluentState._subscriptions = this._subscriptions;
            
            this._cache.set(cacheKey, childFluentState);
            return childFluentState;
        }
        
        _getState() {
            return this._juris.getState(this._basePath);
        }
        
        _getFullPath(prop) {
            // Handle special cases for empty or problematic property names
            if (prop === '' || prop === null || prop === undefined) {
                console.warn(`⚠️ Invalid property name: "${prop}" - using fallback`);
                return this._basePath ? `${this._basePath}.__empty__` : '__empty__';
            }
            
            return this._basePath ? `${this._basePath}.${prop}` : String(prop);
        }
        
        _ensureParentPaths(fullPath) {
            const parts = fullPath.split('.');
            let currentPath = '';
            
            for (let i = 0; i < parts.length - 1; i++) {
                currentPath = currentPath ? `${currentPath}.${parts[i]}` : parts[i];
                const currentValue = this._juris.getState(currentPath);
                
                if (currentValue === null || currentValue === undefined || typeof currentValue !== 'object') {
                    console.log(`📁 Creating parent path: ${currentPath}`);
                    this._juris.setState(currentPath, {});
                }
            }
        }
    }

    // Create the main FluentState instance
    const mainInstance = new FluentState(context.juris);
    mainFluentState = mainInstance;

    return {
        api: {
            getFluentStates: () => mainInstance,
            batch,
            debug: {
                getStats: () => ({
                    subscriptions: mainInstance._subscriptions.size,
                    cache: mainInstance._cache.size,
                    batchActive,
                    batchQueueSize: batchQueue.length
                }),
                clearCache: () => mainInstance._cache.clear(),
                clearSubscriptions: () => mainInstance._subscriptions.clear()
            }
        },

        hooks: {
            onRegister: () => {
                console.log('✅ FluentState registered successfully');
            },
            
            onUnregister: () => {
                console.log('🧹 FluentState cleanup');
                mainInstance._cache.clear();
                mainInstance._subscriptions.clear();
                mainFluentState = null;
            }
        }
    };
}

// Export for browser and Node.js
if (typeof window !== 'undefined') {
    window.createFluentStateHeadless = createFluentStateHeadless;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createFluentStateHeadless };
}