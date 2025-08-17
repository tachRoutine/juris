// ===================================================================
// ENHANCED FLUENTSTATE WITH DEEP PATH CREATION & BETTER ERROR HANDLING
// ===================================================================

function createFluentStateHeadless(props, context) {
    console.log('🏗️ Initializing Enhanced FluentState with deep path support...');
    
    // FluentState class with proxy-based reactive interface + subscriptions
    class FluentState {
        constructor(jurisInstance, basePath = '', skipTracking = false) {
            this._juris = jurisInstance;
            this._path = basePath;
            this._cache = new Map();
            this._skipTracking = skipTracking;
            this._subscriptions = new Map(); // Direct subscriptions storage
            this._pendingTriggers = null; // For batch support
            
            return new Proxy(this, {
                get: this._createGetHandler(),
                set: this._createSetHandler()
            });
        }

        _createGetHandler() {
            return (target, prop) => {
                // Handle proxy methods and properties
                if (this._isInternalProperty(prop)) {
                    return this._handleInternalProperty(target, prop);
                }

                // Handle FluentState methods (including new subscribe)
                if (this._isFluentMethod(prop)) {
                    return this._handleFluentMethod(target, prop);
                }

                // Handle state property access
                return this._handleStateAccess(target, prop);
            };
        }

        _createSetHandler() {
            return (target, prop, value) => {
                if (typeof prop === 'string' && !prop.startsWith('_')) {
                    const newPath = target._path ? `${target._path}.${prop}` : prop;
                    const oldValue = this._juris.getState(newPath);
                    const label = target._skipTracking ? '$.x' : '$';
                    console.log(`✏️ ${label} setting: ${newPath} =`, value);
                    
                    // ENHANCED: Create parent paths if they don't exist
                    this._ensurePathExists(newPath);
                    
                    // Set the new value
                    target._juris.setState(newPath, value);
                    
                    // ENHANCED: Check if we're in batch mode
                    if (!target._juris.stateManager.isBatchingActive()) {
                        // Trigger immediately if not batching
                        this._triggerDirectSubscriptions(newPath, value, oldValue);
                    } else {
                        // Queue for batch processing
                        this._queueSubscriptionTrigger(newPath, value, oldValue);
                    }
                    
                    target._cache.clear();
                    return true;
                }
                target[prop] = value;
                return true;
            };
        }

        // ENHANCED: Ensure parent paths exist
        _ensurePathExists(fullPath) {
            const parts = fullPath.split('.');
            let currentPath = '';
            
            for (let i = 0; i < parts.length - 1; i++) {
                currentPath = currentPath ? `${currentPath}.${parts[i]}` : parts[i];
                const current = this._juris.getState(currentPath);
                
                // If path doesn't exist or is null/primitive, create an object
                if (current === null || current === undefined || typeof current !== 'object') {
                    console.log(`📁 Creating parent path: ${currentPath}`);
                    this._juris.setState(currentPath, {});
                }
            }
        }

        // ENHANCED: Queue subscription triggers for batching
        _queueSubscriptionTrigger(path, newValue, oldValue) {
            if (!this._pendingTriggers) {
                this._pendingTriggers = new Map();
                
                // Register a one-time callback for when batch completes
                setTimeout(() => {
                    if (this._pendingTriggers && this._pendingTriggers.size > 0) {
                        this._processPendingTriggers();
                    }
                }, 0);
            }
            
            // Store only the latest value for each path
            this._pendingTriggers.set(path, { newValue, oldValue });
        }

        // ENHANCED: Process pending triggers after batch
        _processPendingTriggers() {
            if (!this._pendingTriggers) return;
            
            const triggers = this._pendingTriggers;
            this._pendingTriggers = null;
            
            // Trigger subscriptions for each unique path
            triggers.forEach(({ newValue, oldValue }, path) => {
                this._triggerDirectSubscriptions(path, newValue, oldValue);
            });
        }

        _isInternalProperty(prop) {
            return prop === 'valueOf' || prop === Symbol.toPrimitive || prop === 'toString' ||
                   prop === Symbol.toStringTag || prop === 'constructor';
        }

        _handleInternalProperty(target, prop) {
            if (prop === 'valueOf' || prop === Symbol.toPrimitive) {
                return () => target._juris.getState(target._path, null, !target._skipTracking);
            }
            if (prop === 'toString') {
                return () => String(target._juris.getState(target._path, null, !target._skipTracking) || '');
            }
            // ENHANCED: Support Array.isArray detection
            if (prop === Symbol.toStringTag) {
                const value = target._juris.getState(target._path, null, false);
                return Array.isArray(value) ? 'Array' : undefined;
            }
        }

        _isFluentMethod(prop) {
            const methods = ['push', 'filterBy', 'getLength', 'removeAt', 'update', 'x', 
                           'subscribe', 'unsubscribe', 'watch', 'onChange', 'raw', 
                           'exists', 'clear', 'getType','getSubscriptionInfo'];
            return typeof prop === 'string' && (
                prop.startsWith('_') || 
                methods.includes(prop)
            );
        }

        _handleFluentMethod(target, prop) {
            if (prop === 'x') {
                return this._createNonReactiveProxy(target);
            }
            
            // NEW: Direct subscription methods
            if (prop === 'subscribe' || prop === 'watch') {
                return this._createSubscribeMethod(target);
            }
            
            if (prop === 'unsubscribe') {
                return this._createUnsubscribeMethod(target);
            }
            
            if (prop === 'onChange') {
                return this._createOnChangeMethod(target);
            }
            
            // ENHANCED: Additional utility methods
            if (prop === 'raw') {
                return () => target._juris.getState(target._path, null, !target._skipTracking);
            }
            
            if (prop === 'exists') {
                return () => {
                    const value = target._juris.getState(target._path);
                    return value !== null && value !== undefined;
                };
            }
            
            if (prop === 'clear') {
                return () => {
                    target._juris.setState(target._path, null);
                    target._cache.clear();
                };
            }
            
            if (prop === 'getType') {
                return () => {
                    const value = target._juris.getState(target._path);
                    if (value === null) return 'null';
                    if (Array.isArray(value)) return 'array';
                    return typeof value;
                };
            }
            
            if (typeof target[prop] === 'function') {
                return target[prop].bind(target);
            }
            
            return target[prop];
        }

        _createNonReactiveProxy(target) {
            if (!target._nonReactiveProxy) {
                const nonReactiveProxy = new FluentState(target._juris, target._path, true);
                // Share subscriptions between reactive and non-reactive proxies
                nonReactiveProxy._subscriptions = target._subscriptions;
                nonReactiveProxy._pendingTriggers = target._pendingTriggers;
                target._nonReactiveProxy = nonReactiveProxy;
            }
            return target._nonReactiveProxy;
        }

        // Create subscribe method
        _createSubscribeMethod(target) {
            return (callback, options = {}) => {
                const subscriptionId = this._generateSubscriptionId();
                const fullPath = target._path || '';
                
                const subscription = {
                    id: subscriptionId,
                    path: fullPath,
                    callback,
                    options: {
                        immediate: options.immediate ?? false,
                        deep: options.deep ?? true,
                        once: options.once ?? false,
                        ...options
                    },
                    active: true
                };
                
                // Store subscription
                if (!target._subscriptions.has(fullPath)) {
                    target._subscriptions.set(fullPath, new Map());
                }
                target._subscriptions.get(fullPath).set(subscriptionId, subscription);
                
                console.log(`📡 Direct subscription created: ${fullPath} (${subscriptionId})`);
                
                // Call immediately if requested
                if (subscription.options.immediate) {
                    const currentValue = target._juris.getState(fullPath);
                    try {
                        callback(currentValue, undefined, fullPath);
                    } catch (error) {
                        console.error('Error in immediate subscription callback:', error);
                    }
                }
                
                // Return unsubscribe function
                return () => this._removeSubscription(target, fullPath, subscriptionId);
            };
        }

        // Create unsubscribe method
        _createUnsubscribeMethod(target) {
            return (subscriptionId) => {
                const fullPath = target._path || '';
                return this._removeSubscription(target, fullPath, subscriptionId);
            };
        }

        // Create onChange method (alias for subscribe with immediate: false)
        _createOnChangeMethod(target) {
            return (callback, options = {}) => {
                return this._createSubscribeMethod(target)(callback, { 
                    immediate: false, 
                    ...options 
                });
            };
        }

        // Generate unique subscription ID
        _generateSubscriptionId() {
            return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }

        // Remove subscription
        _removeSubscription(target, path, subscriptionId) {
            const pathSubscriptions = target._subscriptions.get(path);
            if (pathSubscriptions && pathSubscriptions.has(subscriptionId)) {
                pathSubscriptions.delete(subscriptionId);
                console.log(`📡 Direct subscription removed: ${path} (${subscriptionId})`);
                
                // Clean up empty path entries
                if (pathSubscriptions.size === 0) {
                    target._subscriptions.delete(path);
                }
                return true;
            }
            return false;
        }

        // Trigger direct subscriptions
        _triggerDirectSubscriptions(changedPath, newValue, oldValue) {
            // Check all subscription paths to see if they should be triggered
            for (const [subscriptionPath, pathSubscriptions] of this._subscriptions) {
                for (const [subscriptionId, subscription] of pathSubscriptions) {
                    if (!subscription.active) continue;
                    
                    const shouldTrigger = this._shouldTriggerSubscription(
                        changedPath, 
                        subscriptionPath, 
                        subscription.options
                    );
                    
                    if (shouldTrigger) {
                        try {
                            const relevantValue = subscriptionPath === changedPath 
                                ? newValue 
                                : this._juris.getState(subscriptionPath);
                                
                            const relevantOldValue = subscriptionPath === changedPath 
                                ? oldValue 
                                : undefined;
                                
                            subscription.callback(relevantValue, relevantOldValue, changedPath);
                            
                            // Remove if it's a once subscription
                            if (subscription.options.once) {
                                this._removeSubscription(this, subscriptionPath, subscriptionId);
                            }
                        } catch (error) {
                            console.error(`Error in direct subscription callback for ${subscriptionPath}:`, error);
                        }
                    }
                }
            }
        }

        // Determine if subscription should be triggered
        _shouldTriggerSubscription(changedPath, subscriptionPath, options) {
            // Exact match
            if (changedPath === subscriptionPath) {
                return true;
            }
            
            // Deep watching: subscription path is parent of changed path
            if (options.deep && changedPath.startsWith(subscriptionPath + '.')) {
                return true;
            }
            
            // Bubble up: subscription path is child of changed path (parent changed)
            if (subscriptionPath.startsWith(changedPath + '.')) {
                return true;
            }
            
            return false;
        }

        // Keep original simple behavior
        _handleStateAccess(target, prop) {
            const newPath = target._path ? `${target._path}.${prop}` : String(prop);
            const value = target._juris.getState(newPath, null, !target._skipTracking);
            
            const label = target._skipTracking ? '$.x' : '$';
            const isTracking = !target._skipTracking && !!target._juris.stateManager.currentTracking;
            console.log(`🔍 ${label} accessing: ${newPath} =`, value, `(tracking: ${isTracking})`);
            
            // Return primitives and null directly
            if (value !== undefined && (typeof value !== 'object' || value === null)) {
                return value;
            }
            
            // Undefined becomes null
            if (value === undefined) {
                return null;
            }
            
            // Objects/arrays become proxies
            return this._getOrCreateProxy(target, newPath, value);
        }

        // Add this helper method to FluentState class
        _checkPathExists(path) {
            if (!path) return true; // Root path always exists
            
            const parts = path.split('.');
            let current = this._juris.stateManager.state;
            
            for (let i = 0; i < parts.length; i++) {
                // If we hit null/undefined/primitive before the end, path doesn't exist
                if (current === null || current === undefined || typeof current !== 'object') {
                    return false;
                }
                
                // Check if the property exists
                if (!current.hasOwnProperty(parts[i])) {
                    return false;
                }
                
                // Move to next level
                current = current[parts[i]];
            }
            
            return true;
        }

        // Add helper method to check if path exists
        _pathExists(path) {
            const parts = path.split('.');
            let current = this._juris.stateManager.state;
            
            for (const part of parts) {
                if (!current || !current.hasOwnProperty(part)) {
                    return false;
                }
                current = current[part];
            }
            
            return true;
        }

        _getOrCreateProxy(target, newPath, value) {
            const cacheKey = target._skipTracking ? `${newPath}_notrack` : newPath;
            
            if (target._cache.has(cacheKey)) {
                const cached = target._cache.get(cacheKey);
                if (cached.isProxy) return cached.proxy;
            }
            
            const newProxy = new FluentState(target._juris, newPath, target._skipTracking);
            // Share subscriptions across all proxies in the tree
            newProxy._subscriptions = target._subscriptions;
            newProxy._pendingTriggers = target._pendingTriggers;
            
            target._cache.set(cacheKey, { proxy: newProxy, isProxy: true });
            return newProxy;
        }

        // ENHANCED: Array manipulation methods with better error handling
        push(item) {
            const array = this._juris.getState(this._path, null, !this._skipTracking);
            
            if (!Array.isArray(array)) {
                console.warn(`Cannot push to non-array at ${this._path}`);
                // Convert to array if null/undefined
                if (array == null) {
                    const newArray = [item];
                    this._juris.setState(this._path, newArray);
                    this._triggerDirectSubscriptions(this._path, newArray, array);
                    this._cache.clear();
                    return;
                }
                return;
            }
            
            const oldValue = [...array];
            const newArray = [...array, item];
            
            this._juris.setState(this._path, newArray);
            
            if (!this._juris.stateManager.isBatchingActive()) {
                this._triggerDirectSubscriptions(this._path, newArray, oldValue);
            } else {
                this._queueSubscriptionTrigger(this._path, newArray, oldValue);
            }
            
            this._cache.clear();
        }

        filterBy(predicate) {
            const array = this._juris.getState(this._path, null, !this._skipTracking);
            if (!Array.isArray(array)) {
                console.warn(`Cannot filter non-array at ${this._path}`);
                return [];
            }
            return array.filter(predicate);
        }

        getLength() {
            const array = this._juris.getState(this._path, null, !this._skipTracking);
            if (!Array.isArray(array)) {
                console.warn(`Cannot get length of non-array at ${this._path}`);
                return 0;
            }
            return array.length;
        }

        removeAt(index) {
            const array = this._juris.getState(this._path, null, !this._skipTracking);
            if (!Array.isArray(array)) {
                console.warn(`Cannot removeAt on non-array at ${this._path}`);
                return;
            }
            
            const oldValue = [...array];
            const filtered = array.filter((_, i) => i !== index);
            
            this._juris.setState(this._path, filtered);
            
            if (!this._juris.stateManager.isBatchingActive()) {
                this._triggerDirectSubscriptions(this._path, filtered, oldValue);
            } else {
                this._queueSubscriptionTrigger(this._path, filtered, oldValue);
            }
            
            this._cache.clear();
        }

        update(updates) {
            const current = this._juris.getState(this._path, null, !this._skipTracking);
            
            // Handle null/undefined by creating new object
            const oldValue = current && typeof current === 'object' ? { ...current } : null;
            const baseObject = current && typeof current === 'object' ? current : {};
            const newValue = { ...baseObject, ...updates };
            
            this._juris.setState(this._path, newValue);
            
            if (!this._juris.stateManager.isBatchingActive()) {
                this._triggerDirectSubscriptions(this._path, newValue, oldValue);
            } else {
                this._queueSubscriptionTrigger(this._path, newValue, oldValue);
            }
            
            this._cache.clear();
        }

        // Get subscription info for debugging
        getSubscriptionInfo() {
            const info = {};
            for (const [path, pathSubs] of this._subscriptions) {
                info[path] = Array.from(pathSubs.values()).map(sub => ({
                    id: sub.id,
                    options: sub.options,
                    active: sub.active
                }));
            }
            return info;
        }
    }

    // Create main FluentState instances
    const reactiveProxy = new FluentState(context.juris);

    return {
        api: {
            // Main reactive proxy
            getFluentStates: () => {
                return reactiveProxy;
            },

            // Utility functions
            createProxy: (basePath = '', skipTracking = false) => {
                const proxy = new FluentState(context.juris, basePath, skipTracking);
                // Share subscriptions with main proxy
                proxy._subscriptions = reactiveProxy._subscriptions;
                return proxy;
            },
            
            batch: (callback) => context.executeBatch(callback),
            
            // Enhanced debug utilities
            debug: {
                getStats: () => ({
                    reactiveCache: reactiveProxy._cache.size,
                    hasNonReactive: !!reactiveProxy._nonReactiveProxy,
                    subscriptions: reactiveProxy._subscriptions.size,
                    totalSubscriptions: Array.from(reactiveProxy._subscriptions.values())
                        .reduce((total, pathSubs) => total + pathSubs.size, 0),
                    pendingTriggers: reactiveProxy._pendingTriggers ? reactiveProxy._pendingTriggers.size : 0
                }),
                
                getSubscriptions: () => reactiveProxy.getSubscriptionInfo(),
                
                clearCache: () => {
                    reactiveProxy._cache.clear();
                    console.log('🧹 FluentState caches cleared');
                },
                
                clearSubscriptions: () => {
                    reactiveProxy._subscriptions.clear();
                    console.log('🧹 Direct subscriptions cleared');
                }
            }
        },

        hooks: {
            onRegister: () => {
                console.log('✅ Enhanced FluentState with deep paths registered');
                if (typeof window !== 'undefined') {
                    window.$ = reactiveProxy;
                    console.log('🌍 Enhanced $ exposed globally');
                }
            },
            
            onUnregister: () => {
                console.log('🧹 Enhanced FluentState cleaning up');
                if (typeof window !== 'undefined' && window.$ === reactiveProxy) {
                    delete window.$;
                }
                reactiveProxy._cache.clear();
                reactiveProxy._subscriptions.clear();
            }
        }
    };
}

if (typeof window !== 'undefined') {
    window.createFluentStateHeadless = createFluentStateHeadless;
    Object.freeze(window.createFluentStateHeadless);
    Object.freeze(window.createFluentStateHeadless.prototype);
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports.createFluentStateHeadless = createFluentStateHeadless;
    module.exports.default = createFluentStateHeadless;
}