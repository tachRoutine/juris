/**
 * Caution: This is not  just a framework, its also a platform. 
 * Juris (JavaScript Unified Reactive Interface Solution) 
 * transforms web development through its comprehensive object-first architecture that makes 
 * reactivity an intentional choice rather than an automatic behavior. By expressing interfaces 
 * as pure JavaScript objects where functions explicitly define reactivity, Juris delivers a 
 * complete solution for applications that are universally deployable, precisely controlled,
 * and designed from the ground up for seamless AI collaboration—all while maintaining the 
 * simplicity and debuggability of native JavaScript patterns.
 * 
 * Author: Resti Guay
 * Maintained by: Juris Github Team
 * Version: 0.1.1
 * License: MIT
 */
class Juris {
    constructor(config = {}) {
        // Core state
        this.state = config.states || {};
        this.components = new Map();
        this.services = config.services || {};
        this.layout = config.layout;
        this.middleware = config.middleware || [];

        this.xssProtection = {
            enabled: config.xssProtection?.enabled !== false, // Default: enabled
            strictMode: config.xssProtection?.strictMode || false,
            customSanitizer: config.xssProtection?.customSanitizer || null
        };
        
        // Router configuration
        this.router = config.router;
        this.routes = {};
        this.routeGuards = {};
        this.routeMiddleware = [];
        this.routeParams = {};
        this.currentRoute = '/';
        this._rendering = false;
        
        this.nestedRoutes = new Map(); // For nested routing support
        this.routeAliases = new Map(); // For route aliases
        this.routeTransitions = new Map(); // For route transitions
        this.routeOutlets = new Map(); // For RouterOutlet instances
        
        // State management
        this.subscribers = new Map();
        this.elementSubscriptions = new WeakMap();
        this.currentlyTracking = null;
        
        // External subscribers
        this.externalSubscribers = new Map();
        
        // Enhancement system with memory management
        this.selectorObservers = new Map();
        this.enhancementQueue = new Set();
        this.elementLifecycleHooks = new WeakMap(); // Store lifecycle hooks per element
        this.elementMountState = new WeakMap();     // Track mount state per element
        this.lifecycleEventQueue = [];              // Simple event queue
        this.processingLifecycle = false;          // Prevent recursion
        this.cleanupScheduled = false;
        this.trackedElements = new Set();
        this.isDestroyed = false;
        
        // Performance optimization
        this.updateBatches = new Map();
        this.batchTimeout = null;
        
        // Component lifecycle management
        this.componentInstances = new Map();
        this.componentApis = new WeakMap();
        this.lifecycleCleanup = new WeakMap();
        this.mountedComponents = new Set();

        
        this.headlessComponents = new Map();
        this.headlessCleanup = new Map();
        // Register components
        if (config.components) {
            Object.entries(config.components).forEach(([name, component]) => {
                this.registerComponent(name, component);
            });
        }
        
        // Register components from services (for backwards compatibility)
        if (config.services) {
            //this.registerComponentsFromServices(config.services);
        }
        
        // Setup router if enabled
        if (this.router) {
            this.setupRouter();
        }
        
        // Setup cleanup handlers
        this.setupCleanupHandlers();
        
        console.log('🚀 Juris framework initialized');
    }
    
    // =================================================================
    // LIFECYCLE AND CLEANUP MANAGEMENT
    // =================================================================    
    setupCleanupHandlers() {
        // Page unload cleanup
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => {
                this.destroy();
            });
            
            // Visibility change cleanup for mobile
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.pauseObservers();
                } else {
                    this.resumeObservers();
                }
            });
        }
        
        // Periodic cleanup of dead references
        this.schedulePeriodicCleanup();
    }
    
    destroy() {
        if (this.isDestroyed) return;
        
        console.log('🔄 Destroying Juris framework...');
        this.isDestroyed = true;
        
        // Unmount all components
        this.mountedComponents.forEach(instanceId => {
            const instance = this.componentInstances.get(instanceId);
            if (instance) {
                this.triggerUnmountHook(instance.element);
            }
        });
        
        // Stop all observers
        this.stopAllObservers();
        
        // Clear all subscriptions
        this.subscribers.clear();
        this.externalSubscribers.clear();
        
        // Clear enhancement tracking
        this.trackedElements.clear();
        this.enhancementQueue.clear();
        
        // Clear batched updates
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
        }
        this.updateBatches.clear();
        
        // Clear component tracking
        this.componentInstances.clear();
        this.mountedComponents.clear();
        
        // Clear periodic cleanup
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        
        console.log('✅ Juris framework destroyed and cleaned up');
    }
    
    schedulePeriodicCleanup() {
        if (typeof window === 'undefined') return;
        
        this.cleanupInterval = setInterval(() => {
            this.performCleanup();
        }, 30000); // Every 30 seconds
    }
    
    performCleanup() {
        if (this.isDestroyed) return;
        
        // Clean up dead element references
        const deadElements = new Set();
        this.trackedElements.forEach(item => {
            if (item.ref && !item.ref.deref()) {
                if (item.cleanup) item.cleanup();
                deadElements.add(item);
            }
        });
        
        deadElements.forEach(item => this.trackedElements.delete(item));
        
        // Clean up disconnected observers
        this.selectorObservers.forEach((observer, selector) => {
            if (!document.querySelector(selector)) {
                observer.disconnect();
                this.selectorObservers.delete(selector);
            }
        });
        
        // Clean up disconnected component instances
        const disconnectedInstances = new Set();
        this.componentInstances.forEach((instance, instanceId) => {
            if (instance.element && !instance.element.isConnected) {
                disconnectedInstances.add(instanceId);
            }
        });
        
        disconnectedInstances.forEach(instanceId => {
            this.componentInstances.delete(instanceId);
            this.mountedComponents.delete(instanceId);
        });
        
        if (deadElements.size > 0 || disconnectedInstances.size > 0) {
            console.log(`🧹 Cleaned up ${deadElements.size} dead references and ${disconnectedInstances.size} disconnected components`);
        }
    }
    

    /**
     * Simple HTML sanitizer that removes the most dangerous XSS vectors
     */
    sanitizeHTML(html, options = {}) {
        if (!this.xssProtection.enabled && !options.force) {
            return html;
        }
        
        if (typeof html !== 'string') {
            return '';
        }
        
        // Use custom sanitizer if provided
        if (this.xssProtection.customSanitizer) {
            return this.xssProtection.customSanitizer(html, options);
        }
        
        // Create temporary container for safe parsing
        const container = document.createElement('div');
        container.innerHTML = html;
        
        // Remove dangerous elements and attributes
        this.removeDangerousContent(container);
        
        return container.innerHTML;
    }

    /**
     * Remove the most dangerous XSS vectors
     */
    removeDangerousContent(element) {
        // Remove script tags completely
        const scripts = element.querySelectorAll('script');
        scripts.forEach(script => script.remove());
        
        // Remove dangerous elements
        const dangerousSelectors = [
            'object', 'embed', 'applet', 'iframe', 'frame', 'frameset',
            'meta', 'link[rel="stylesheet"]', 'style'
        ];
        
        dangerousSelectors.forEach(selector => {
            const elements = element.querySelectorAll(selector);
            elements.forEach(el => el.remove());
        });
        
        // Remove dangerous attributes from all elements
        const allElements = element.querySelectorAll('*');
        allElements.forEach(el => this.sanitizeElementAttributes(el));
    }

    /**
     * Sanitize attributes on a single element
     */
    sanitizeElementAttributes(element) {
        const dangerousAttributes = [
            'onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur',
            'onchange', 'onsubmit', 'onreset', 'onselect', 'onunload'
        ];
        
        // Remove event handler attributes
        dangerousAttributes.forEach(attr => {
            if (element.hasAttribute(attr)) {
                element.removeAttribute(attr);
            }
        });
        
        // Check all attributes for dangerous patterns
        Array.from(element.attributes).forEach(attr => {
            const name = attr.name.toLowerCase();
            const value = attr.value;
            
            // Remove any attribute starting with 'on'
            if (name.startsWith('on')) {
                element.removeAttribute(name);
                return;
            }
            
            // Sanitize href and src attributes
            if (name === 'href' || name === 'src') {
                if (this.isDangerousUrl(value)) {
                    element.removeAttribute(name);
                }
            }
            
            // Remove attributes with javascript: or other dangerous protocols
            if (this.containsDangerousContent(value)) {
                element.removeAttribute(name);
            }
        });
    }

    /**
     * Check if URL contains dangerous protocols
     */
    isDangerousUrl(url) {
        if (!url || typeof url !== 'string') return false;
        
        const dangerous = /^(javascript|vbscript|data|file):/i;
        return dangerous.test(url.trim());
    }

    /**
     * Check if content contains dangerous patterns
     */
    containsDangerousContent(content) {
        if (!content || typeof content !== 'string') return false;
        
        const dangerousPatterns = [
            /javascript:/i,
            /vbscript:/i,
            /on\w+\s*=/i,  // event handlers
            /<script/i,
            /expression\s*\(/i  // CSS expressions
        ];
        
        return dangerousPatterns.some(pattern => pattern.test(content));
    }
    
    enhance(selector, definitionFn, options = {}) {
        if (this.isDestroyed) return;
        
        const config = { 
            useObserver: true, 
            debounce: null,
            throttle: null,
            scope: null,
            ...options 
        };
        
        // Enhance existing elements
        const scope = config.scope ? document.querySelector(config.scope) : document;
        const elements = scope.querySelectorAll(selector);
        
        elements.forEach(element => {
            this.enhanceSingleElementWithLifecycle(element, definitionFn, config);
        });
        
        // Setup observer for future elements  
        if (config.useObserver) {
            this.observeForSelector(selector, definitionFn, config);
        }
        
        return () => this.stopEnhancementObserver(selector);
    }
    
    enhanceSingleElementWithLifecycle(element, definitionFn, config) {
        if (this.isDestroyed || element.hasAttribute('data-juris-enhanced')) {
            return;
        }
        
        try {
            const props = {
                element,
                id: element.id,
                className: element.className,
                tagName: element.tagName.toLowerCase(),
                dataset: { ...element.dataset }
            };
            
            const context = this.createContext();
            const definition = definitionFn(props, context);
            
            // NEW: Extract and store lifecycle hooks (reuse existing pattern)
            const { lifecycleHooks, cleanDefinition } = this.extractLifecycleHooks(definition);
            
            if (lifecycleHooks) {
                this.elementLifecycleHooks.set(element, { lifecycleHooks, props, context });
            }
            
            // REUSE: Existing definition application
            this.applyDefinitionToElement(element, cleanDefinition, context);
            
            element.setAttribute('data-juris-enhanced', 'true');
            this.trackElement(element);
            
            // NEW: Trigger onMount if connected
            if (element.isConnected && lifecycleHooks?.onMount) {
                this.scheduleLifecycleEvent(element, 'mount');
            }
            
        } catch (error) {
            console.error('Enhancement error:', error);
            this.triggerLifecycleHook(element, 'error', { error });
        }
    }

    extractLifecycleHooks(definition) {
        const lifecycleHookNames = ['onMount', 'onUpdate', 'onUnmount', 'onError', 'onDestroy'];
        const lifecycleHooks = {};
        const cleanDefinition = { ...definition };
        
        lifecycleHookNames.forEach(hookName => {
            if (definition[hookName] && typeof definition[hookName] === 'function') {
                lifecycleHooks[hookName] = definition[hookName];
                delete cleanDefinition[hookName];
            }
        });
        
        return {
            lifecycleHooks: Object.keys(lifecycleHooks).length > 0 ? lifecycleHooks : null,
            cleanDefinition
        };
    }

    scheduleLifecycleEvent(element, eventType, data = {}) {
        if (this.isDestroyed) return;
        
        this.lifecycleEventQueue.push({
            element,
            eventType,
            data,
            timestamp: Date.now()
        });
        
        // Process events on next tick to batch them
        if (!this.processingLifecycle) {
            setTimeout(() => this.processLifecycleEvents(), 0);
        }
    }


    processLifecycleEvents() {
        if (this.processingLifecycle || this.lifecycleEventQueue.length === 0) return;
        
        this.processingLifecycle = true;
        const events = [...this.lifecycleEventQueue];
        this.lifecycleEventQueue.length = 0;
        
        events.forEach(({ element, eventType, data }) => {
            this.executeLifecycleHook(element, eventType, data);
        });
        
        this.processingLifecycle = false;
    }
    
    triggerLifecycleHook(element, eventType, data = {}) {
        // Immediate execution for critical events, batched for others
        if (eventType === 'error' || eventType === 'unmount') {
            this.executeLifecycleHook(element, eventType, data);
        } else {
            this.scheduleLifecycleEvent(element, eventType, data);
        }
    }


    async executeLifecycleHook(element, eventType, data = {}) {
        const lifecycleData = this.elementLifecycleHooks.get(element);
        if (!lifecycleData) return;
        
        const { lifecycleHooks, props, context } = lifecycleData;
        const hookName = `on${eventType.charAt(0).toUpperCase() + eventType.slice(1)}`;
        const hook = lifecycleHooks[hookName];
        
        if (!hook || typeof hook !== 'function') return;
        
        try {
            let result;
            
            switch (eventType) {
                case 'mount':
                    const mountState = this.elementMountState.get(element);
                    if (mountState?.mounted) return; // Already mounted
                    
                    console.log(`🔄 Mounting enhanced element:`, element);
                    result = await hook(element, props, context);
                    
                    // Store cleanup function and mount state
                    this.elementMountState.set(element, { 
                        mounted: true, 
                        cleanup: typeof result === 'function' ? result : null 
                    });
                    break;
                    
                case 'update':
                    await hook(element, props, context, data);
                    break;
                    
                case 'unmount':
                    const unmountState = this.elementMountState.get(element);
                    if (!unmountState?.mounted) return; // Not mounted
                    
                    console.log(`🔄 Unmounting enhanced element:`, element);
                    
                    // Call onUnmount hook
                    await hook(element, props, context);
                    
                    // Call stored cleanup function
                    if (unmountState.cleanup) {
                        await unmountState.cleanup();
                    }
                    
                    this.elementMountState.delete(element);
                    break;
                    
                case 'error':
                    console.log(`❌ Error in enhanced element:`, element, data.error);
                    await hook(data.error, element, props, context);
                    break;
                    
                case 'destroy':
                    await hook(element, props, context);
                    break;
            }
            
        } catch (error) {
            console.error(`❌ Lifecycle hook error (${hookName}):`, error);
        }
    }
    
    
    observeForSelector(selector, definitionFn, config = {}) {
        if (this.selectorObservers.has(selector)) {
            return;
        }
        
        const targetContainer = config.scope 
            ? document.querySelector(config.scope)
            : document.querySelector('#app') || document.body;
            
        if (!targetContainer) {
            console.warn(`Juris: Cannot find container for selector ${selector}`);
            return;
        }
        
        const observer = new MutationObserver(this.createDebouncedMutationHandler(
            selector, definitionFn, config
        ));
        
        observer.observe(targetContainer, { 
            childList: true, 
            subtree: true,
            attributes: false,
            characterData: false
        });
        
        this.selectorObservers.set(selector, {
            observer,
            container: targetContainer,
            config
        });
        
        console.log(`👁️ Observing ${selector} in`, targetContainer);
    }
    
    createDebouncedMutationHandler(selector, definitionFn, config) {
        let timeoutId;
        const delay = config.debounce || 16;
        
        return (mutations) => {
            if (this.isDestroyed) return;
            
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                this.processMutationsForSelectorWithLifecycle(mutations, selector, definitionFn, config);
            }, delay);
        };
    }

    processMutationsForSelectorWithLifecycle(mutations, selector, definitionFn, config) {
        const elementsToEnhance = new Set();
        
        mutations.forEach(mutation => {
            // Handle added nodes (existing logic)
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.matches && node.matches(selector)) {
                        elementsToEnhance.add(node);
                    }
                    
                    if (node.querySelectorAll) {
                        const children = node.querySelectorAll(selector);
                        children.forEach(child => elementsToEnhance.add(child));
                    }
                }
            });
            
            // NEW: Handle removed nodes for unmount detection
            mutation.removedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // Check if removed node or its children have lifecycle hooks
                    const enhancedElements = [
                        ...(node.hasAttribute?.('data-juris-enhanced') ? [node] : []),
                        ...(node.querySelectorAll ? Array.from(node.querySelectorAll('[data-juris-enhanced]')) : [])
                    ];
                    
                    enhancedElements.forEach(element => {
                        if (this.elementLifecycleHooks.has(element)) {
                            this.triggerLifecycleHook(element, 'unmount');
                        }
                    });
                }
            });
        });
        
        // Enhance new elements
        elementsToEnhance.forEach(element => {
            if (!element.hasAttribute('data-juris-enhanced')) {
                this.enhanceSingleElementWithLifecycle(element, definitionFn, config);
            }
        });
    }


    /**
     * Get enhanced elements with lifecycle hooks
     */
    getEnhancedElementsWithLifecycle() {
        const elements = [];
        
        // REUSE: Walk through existing tracked elements
        this.trackedElements.forEach(item => {
            const element = item.ref?.deref();
            if (element && this.elementLifecycleHooks.has(element)) {
                const lifecycleData = this.elementLifecycleHooks.get(element);
                const mountState = this.elementMountState.get(element);
                
                elements.push({
                    element,
                    lifecycleHooks: Object.keys(lifecycleData.lifecycleHooks),
                    mounted: mountState?.mounted || false,
                    hasCleanup: !!mountState?.cleanup
                });
            }
        });
        
        return elements;
    }

    /**
     * Manually trigger lifecycle events (for testing)
     */
    triggerLifecycleEventManually(element, eventType, data = {}) {
        this.triggerLifecycleHook(element, eventType, data);
    }

    createDebouncedMutationHandler(selector, definitionFn, config) {
        let timeoutId;
        const delay = config.debounce || 16;
        
        return (mutations) => {
            if (this.isDestroyed) return;
            
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                this.processMutationsForSelector(mutations, selector, definitionFn, config);
            }, delay);
        };
    }
    
    processMutationsForSelector(mutations, selector, definitionFn, config) {
        const elementsToEnhance = new Set();
        
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.matches && node.matches(selector)) {
                        elementsToEnhance.add(node);
                    }
                    
                    if (node.querySelectorAll) {
                        const children = node.querySelectorAll(selector);
                        children.forEach(child => elementsToEnhance.add(child));
                    }
                }
            });
        });
        
        elementsToEnhance.forEach(element => {
            if (!element.hasAttribute('data-juris-enhanced')) {
                this.enhanceSingleElement(element, definitionFn, config);
            }
        });
    }
    
    enhanceSingleElement(element, definitionFn, config = {}) {
        if (this.isDestroyed || element.hasAttribute('data-juris-enhanced')) {
            return;
        }
        
        try {
            const props = {
                element,
                id: element.id,
                className: element.className,
                tagName: element.tagName.toLowerCase(),
                dataset: { ...element.dataset }
            };
            
            // Use unified context creation
            const context = this.createContext();
            
            const definition = definitionFn(props, context);
            this.applyDefinitionToElement(element, definition, context);
            
            element.setAttribute('data-juris-enhanced', 'true');
            this.trackElement(element);
            
        } catch (error) {
            console.error('Enhancement error:', error);
        }
    }
    
    trackElement(element) {
        if (typeof WeakRef === 'undefined') return;
        
        const elementRef = new WeakRef(element);
        const cleanup = () => {
            this.cleanupElement(element);
        };
        
        this.trackedElements.add({ ref: elementRef, cleanup });
    }
    
    stopEnhancementObserver(selector) {
        const observerData = this.selectorObservers.get(selector);
        if (observerData) {
            observerData.observer.disconnect();
            this.selectorObservers.delete(selector);
            console.log(`🛑 Stopped observing ${selector}`);
        }
    }
    
    stopAllObservers() {
        this.selectorObservers.forEach(({ observer }, selector) => {
            observer.disconnect();
        });
        this.selectorObservers.clear();
        console.log('🛑 All observers stopped');
    }
    
    pauseObservers() {
        this.selectorObservers.forEach(({ observer }) => {
            observer.disconnect();
        });
        console.log('⏸️ Observers paused');
    }
    
    resumeObservers() {
        this.selectorObservers.forEach((observerData, selector) => {
            const { observer, container, config } = observerData;
            if (container && container.isConnected) {
                observer.observe(container, { 
                    childList: true, 
                    subtree: true,
                    attributes: false,
                    characterData: false
                });
            }
        });
        console.log('▶️ Observers resumed');
    }
    
    // =================================================================
    //  STATE MANAGEMENT
    // =================================================================
    
    setState(path, value, context = {}) {
        if (this.isDestroyed) return;
        
        const oldValue = this.getState(path);
        
        // Run middleware
        let finalValue = value;
        for (const middleware of this.middleware) {
            const result = middleware({ path, oldValue, newValue: finalValue, context, juris: this });
            if (result !== undefined) {
                finalValue = result;
            }
        }
        
        // Set the value
        const keys = path.split('.');
        let current = this.state;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (current[key] === undefined) {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[keys[keys.length - 1]] = finalValue;
        
        // Batch updates for performance
        if (oldValue !== finalValue) {
            this.scheduleUpdate(path);
        }
    }
    
    scheduleUpdate(path) {
        if (!this.updateBatches.has(path)) {
            this.updateBatches.set(path, true);
        }
        
        if (this.batchTimeout) return;
        
        this.batchTimeout = setTimeout(() => {
            this.flushUpdates();
        }, 0);
    }
    
    flushUpdates() {
        if (this.isDestroyed) return;
        
        const pathsToUpdate = Array.from(this.updateBatches.keys());
        this.updateBatches.clear();
        this.batchTimeout = null;
        
        pathsToUpdate.forEach(path => {
            this.triggerSubscribersForPath(path);
            this.triggerExternalSubscribers(path, this.getState(path), null);
        });
        
    }
    
    triggerSubscribersForPath(changedPath) {
        if (this.isDestroyed) return;
        
        const exactSubscribers = this.subscribers.get(changedPath);
        if (exactSubscribers) {
            exactSubscribers.forEach(updateFn => {
                try {
                    updateFn();
                } catch (error) {
                    console.error('Subscriber error:', error);
                }
            });
        }
        
        // Trigger parent path subscribers
        const pathParts = changedPath.split('.');
        for (let i = pathParts.length - 1; i > 0; i--) {
            const parentPath = pathParts.slice(0, i).join('.');
            const parentSubscribers = this.subscribers.get(parentPath);
            if (parentSubscribers) {
                parentSubscribers.forEach(updateFn => {
                    try {
                        updateFn();
                    } catch (error) {
                        console.error('Parent subscriber error:', error);
                    }
                });
            }
        }
    }
    
    getState(path, defaultValue = null) {
        // Track the base path
        if (this.currentlyTracking) {
            this.currentlyTracking.add(path);
        }
        
        // Navigate to the value
        const keys = path.split('.');
        let current = this.state;
        
        for (const key of keys) {
            if (current[key] === undefined) {
                return defaultValue;
            }
            current = current[key];
        }
        
        // If defaultValue is an object (not array), track all its properties
        if (defaultValue && 
            typeof defaultValue === 'object' && 
            !Array.isArray(defaultValue) && 
            this.currentlyTracking) {
            
            this.trackObjectProperties(path, defaultValue);
        }
        
        // If the returned value is an object and we have a default object, 
        // also track the actual object properties
        if (current && 
            typeof current === 'object' && 
            !Array.isArray(current) && 
            defaultValue && 
            typeof defaultValue === 'object' && 
            !Array.isArray(defaultValue) && 
            this.currentlyTracking) {
            
            this.trackObjectProperties(path, current);
        }
        
        return current;
    }
    

    useState(path, defaultValue = null) {
        // Initialize with default value if needed
        const currentValue = this.getState(path, defaultValue);
        if (currentValue === null && defaultValue !== null) {
            this.setState(path, defaultValue);
        }
        
        const getter = () => this.getState(path, defaultValue);
        
        const setter = (value) => {
            let finalValue = value;
            
            // Support functional updates like React
            if (typeof value === 'function') {
                const currentValue = this.getState(path, defaultValue);
                finalValue = value(currentValue);
            }
            
            // Use normal setState - let Juris handle reactivity
            this.setState(path, finalValue);
            
            return finalValue;
        };
        
        return [getter, setter];
    }
    // Helper method to track all properties of an object
    trackObjectProperties(basePath, obj) {
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
            return;
        }
        
        Object.keys(obj).forEach(key => {
            const childPath = `${basePath}.${key}`;
            this.currentlyTracking.add(childPath);
            
            // Recursively track nested object properties
            const childValue = obj[key];
            if (childValue && typeof childValue === 'object' && !Array.isArray(childValue)) {
                this.trackObjectProperties(childPath, childValue);
            }
        });
    }
    
    subscribe(path, callback) {
        if (this.isDestroyed) return () => {};
        
        if (!this.externalSubscribers.has(path)) {
            this.externalSubscribers.set(path, new Set());
        }
        this.externalSubscribers.get(path).add(callback);
        
        return () => {
            const pathSubscribers = this.externalSubscribers.get(path);
            if (pathSubscribers) {
                pathSubscribers.delete(callback);
                if (pathSubscribers.size === 0) {
                    this.externalSubscribers.delete(path);
                }
            }
        };
    }
    
    subscribeInternal(path, updateFn) {
        if (this.isDestroyed) return () => {};
        
        if (!this.subscribers.has(path)) {
            this.subscribers.set(path, new Set());
        }
        this.subscribers.get(path).add(updateFn);
        
        return () => {
            const pathSubscribers = this.subscribers.get(path);
            if (pathSubscribers) {
                pathSubscribers.delete(updateFn);
                if (pathSubscribers.size === 0) {
                    this.subscribers.delete(path);
                }
            }
        };
    }
    
    triggerExternalSubscribers(path, newValue, oldValue) {
        if (this.isDestroyed) return;
        
        const pathSubscribers = this.externalSubscribers.get(path);
        if (pathSubscribers) {
            pathSubscribers.forEach(callback => {
                try {
                    callback(newValue, oldValue, path);
                } catch (error) {
                    console.error('External subscriber error:', error);
                }
            });
        }
    }
    
    // =================================================================
    //  REACTIVITY SYSTEM
    // =================================================================
    
    createReactiveAttribute(element, attributeName, valueFn) {
        if (this.isDestroyed) return;
        
        const dependencies = new Set();
        this.currentlyTracking = dependencies;
        
        const updateAttribute = () => {
            if (this.isDestroyed) return;
            
            try {
                dependencies.clear();
                this.currentlyTracking = dependencies;
                
                const value = valueFn();
                this.currentlyTracking = null;
                
                this.applyAttributeValue(element, attributeName, value);
                
                // CHANGE: Schedule render if needed
                if (this._rendering) return; // Don't render during render
                
            } catch (error) {
                this.currentlyTracking = null;
                console.error(`Error updating attribute ${attributeName}:`, error);
            }
        };
        
        updateAttribute();
        this.currentlyTracking = null;
        
        const unsubscribeFns = Array.from(dependencies).map(path => 
            this.subscribeInternal(path, updateAttribute)
        );
        
        if (!this.elementSubscriptions.has(element)) {
            this.elementSubscriptions.set(element, new Set());
        }
        this.elementSubscriptions.get(element).add({ unsubscribeFns });
        
        return () => {
            unsubscribeFns.forEach(unsub => unsub());
        };
    }
    
    createReactiveAttribute(element, attributeName, valueFn) {
        if (this.isDestroyed) return;
        
        const dependencies = new Set();
        this.currentlyTracking = dependencies;
        
        const updateAttribute = () => {
            if (this.isDestroyed) return;
            
            try {
                // REUSE: Existing dependency tracking
                dependencies.clear();
                this.currentlyTracking = dependencies;
                
                const value = valueFn();
                this.currentlyTracking = null;
                
                this.applyAttributeValue(element, attributeName, value);
                
                // NEW: Trigger onUpdate lifecycle hook if available
                this.triggerLifecycleHook(element, 'update', {
                    attributeName,
                    value,
                    dependencies: Array.from(dependencies)
                });
                
            } catch (error) {
                this.currentlyTracking = null;
                console.error(`Error updating attribute ${attributeName}:`, error);
                
                // NEW: Trigger onError lifecycle hook
                this.triggerLifecycleHook(element, 'error', { error, attributeName });
            }
        };
        
        updateAttribute();
        this.currentlyTracking = null;
        
        // REUSE: Existing subscription system
        const unsubscribeFns = Array.from(dependencies).map(path => 
            this.subscribeInternal(path, updateAttribute)
        );
        
        // REUSE: Existing subscription tracking
        if (!this.elementSubscriptions.has(element)) {
            this.elementSubscriptions.set(element, new Set());
        }
        this.elementSubscriptions.get(element).add({ unsubscribeFns });
        
        return () => {
            unsubscribeFns.forEach(unsub => unsub());
        };
    }


    applyAttributeValue(element, attributeName, value) {
        if (attributeName === 'textContent') {
            element.textContent = value;
        } else if (attributeName === 'innerHTML' || attributeName === 'html') {
            // SECURITY FIX: Sanitize HTML content
            const sanitizedValue = this.sanitizeHTML(value);
            
            // Clean up existing children before setting innerHTML
            Array.from(element.children).forEach(child => {
                this.cleanupElement(child);
            });
            element.innerHTML = sanitizedValue;
        } else if (attributeName === 'dangerousHtml') {
            // SECURITY FIX: Always sanitize, even when marked as "dangerous"
            if (this.xssProtection.strictMode) {
                console.warn('🚨 dangerousHtml blocked in strict mode. Use customSanitizer if needed.');
                return;
            }
            
            const sanitizedValue = this.sanitizeHTML(value, { force: true });
            Array.from(element.children).forEach(child => {
                this.cleanupElement(child);
            });
            element.innerHTML = sanitizedValue;
        } else if (attributeName === 'children') {
            while (element.firstChild) {
                this.cleanupElement(element.firstChild);
                element.removeChild(element.firstChild);
            }
            
            if (Array.isArray(value)) {
                value.forEach((child, index) => {
                    const childElement = this.renderUIObject(child, null);
                    if (childElement) {
                        element.appendChild(childElement);
                    }
                });
            }
        } else if (attributeName.startsWith('style.')) {
            const styleProp = attributeName.substring(6);
            element.style[styleProp] = this.sanitizeCSSValue(value);
        } else if (attributeName === 'value') {
            // FIX: Handle input value properly
            element.value = value;
        } else if (this.isAttribute(attributeName)) {
            if (value === null || value === undefined || value === false) {
                element.removeAttribute(attributeName);
            } else if (value === true) {
                element.setAttribute(attributeName, '');
            } else {
                const sanitizedValue = this.sanitizeAttributeValue(attributeName, String(value));
                element.setAttribute(attributeName, sanitizedValue);
            }
        } else {
            element[attributeName] = value;
        }
    }
    
    /**
     * Sanitize CSS values to prevent CSS-based XSS
     */
    sanitizeCSSValue(value) {
        if (!value || typeof value !== 'string') return value;
        
        // Remove dangerous CSS patterns
        const dangerousCSS = [
            /javascript:/gi,
            /expression\s*\(/gi,
            /behavior\s*:/gi,
            /@import/gi,
            /binding\s*:/gi
        ];
        
        let sanitized = value;
        dangerousCSS.forEach(pattern => {
            sanitized = sanitized.replace(pattern, '');
        });
        
        return sanitized;
    }

    /**
     * Sanitize individual attribute values
     */
    sanitizeAttributeValue(attributeName, value) {
        if (!value || typeof value !== 'string') return value;
        
        // For URL attributes, check for dangerous protocols
        const urlAttributes = ['href', 'src', 'action', 'formaction', 'cite', 'background'];
        if (urlAttributes.includes(attributeName.toLowerCase())) {
            if (this.isDangerousUrl(value)) {
                console.warn(`🚨 Dangerous URL blocked in ${attributeName}: ${value}`);
                return '';
            }
        }
        
        // Remove dangerous content patterns
        if (this.containsDangerousContent(value)) {
            console.warn(`🚨 Dangerous content blocked in ${attributeName}: ${value}`);
            return value.replace(/javascript:/gi, '').replace(/on\w+\s*=/gi, '');
        }
        
        return value;
    }

    cleanupElement(element) {
        if (!element) return;
        
        // NEW: Trigger onUnmount before cleanup
        this.triggerLifecycleHook(element, 'unmount');
        
        // Trigger component unmount if this is a component
        if (element.hasAttribute && element.hasAttribute('data-component-instance')) {
            this.triggerUnmountHook(element);
        }
        
        // REUSE: Existing cleanup logic
        const subscriptions = this.elementSubscriptions.get(element);
        if (subscriptions) {
            subscriptions.forEach(({ unsubscribeFns }) => {
                unsubscribeFns.forEach(unsub => unsub());
            });
            this.elementSubscriptions.delete(element);
        }
        
        // Cleanup child elements
        if (element.children) {
            Array.from(element.children).forEach(child => {
                this.cleanupElement(child);
            });
        }
        
        // NEW: Clean up lifecycle tracking
        this.elementLifecycleHooks.delete(element);
        this.elementMountState.delete(element);
    }
    
    // =================================================================
    // COMPONENT SYSTEM WITH LIFECYCLE SUPPORT
    // =================================================================
    
    registerComponent(name, componentFn) {
        this.components.set(name, componentFn);
        //console.log(`📦 Component registered: ${name}`);
        
        // NEW: Call onRegistered hook if it exists
        this.triggerRegisteredHook(name, componentFn);
    }
    
    // =================================================================
    // NEW METHODS
    // =================================================================

    async triggerRegisteredHook(componentName, componentFn) {
        try {
            // Use unified context creation
            const context = this.createContext();
            
            // Call the component function to check for onRegistered hook
            const componentResult = componentFn({}, context);
            
            if (componentResult && typeof componentResult.onRegistered === 'function') {
                console.log(`🔄 Calling onRegistered for: ${componentName}`);
                
                // Call the onRegistered hook with the same parameters
                const cleanupFn = await componentResult.onRegistered({}, context);
                
                // Store the component instance and cleanup function for headless components
                this.headlessComponents.set(componentName, {
                    name: componentName,
                    componentFn,
                    componentResult,
                    context,
                    registered: true
                });
                
                // Store cleanup function if returned
                if (typeof cleanupFn === 'function') {
                    this.headlessCleanup.set(componentName, cleanupFn);
                }
                
                console.log(`✅ onRegistered completed for: ${componentName}`);
            }
            
        } catch (error) {
            console.error(`❌ onRegistered error for ${componentName}:`, error);
        }
    }

    async cleanupHeadlessComponents() {
        console.log('🔄 Cleaning up headless components...');
        
        // Call cleanup functions for all headless components
        for (const [componentName, cleanupFn] of this.headlessCleanup) {
            try {
                console.log(`🔄 Cleaning up headless component: ${componentName}`);
                await cleanupFn();
                console.log(`✅ Cleaned up headless component: ${componentName}`);
            } catch (error) {
                console.error(`❌ Cleanup error for headless component ${componentName}:`, error);
            }
        }
        
        // Clear headless component tracking
        this.headlessComponents.clear();
        this.headlessCleanup.clear();
        
        console.log('✅ All headless components cleaned up');
    }

    getHeadlessComponents(filter = null) {
        const components = [];
        
        this.headlessComponents.forEach((instance, componentName) => {
            const componentInfo = {
                name: componentName,
                registered: instance.registered,
                hasCleanup: this.headlessCleanup.has(componentName),
                context: instance.context
            };
            
            if (filter) {
                if (typeof filter === 'string') {
                    if (componentName === filter) {
                        components.push(componentInfo);
                    }
                } else if (typeof filter === 'function') {
                    if (filter(componentInfo)) {
                        components.push(componentInfo);
                    }
                }
            } else {
                components.push(componentInfo);
            }
        });
        
        return components;
    }

    getHeadlessComponent(componentName) {
        return this.headlessComponents.get(componentName) || null;
    }
    
    renderComponent(componentName, props, parentProps = null) {
        const componentFn = this.components.get(componentName);
        
        if (!componentFn) {
            console.error(`❌ Component not found: ${componentName}`);
            return this.createErrorElement(`Component not found: ${componentName}`);
        }
        
        try {
            // Use unified context creation
            const context = this.createContext();
            
            const componentResult = componentFn(props, context);
            
            if (!componentResult || typeof componentResult !== 'object') {
                console.error(`❌ Component ${componentName} must return an object`);
                return this.createErrorElement(`Component ${componentName} returned invalid result`);
            }
            
            // Check if it's a lifecycle component (has render method) or legacy component
            let uiStructure;
            let lifecycleHooks = {};
            let componentApi = {};
            
            if (typeof componentResult.render === 'function') {
                // New lifecycle component format
                uiStructure = componentResult.render();
                
                // Extract lifecycle hooks
                ['onMount', 'onUpdate', 'onBeforeUpdate', 'onUnmount', 'onError', 'onRegistered'].forEach(hook => {
                    if (typeof componentResult[hook] === 'function') {
                        lifecycleHooks[hook] = componentResult[hook];
                    }
                });
                
                // Extract custom API methods
                Object.keys(componentResult).forEach(key => {
                    if (key !== 'render' && !key.startsWith('on') && typeof componentResult[key] === 'function') {
                        componentApi[key] = componentResult[key];
                    }
                });
                
            } else {
                // Legacy component format - assume the result is the UI structure
                uiStructure = componentResult;
                
                // Check for lifecycle hooks attached to the UI structure
                ['onMount', 'onUpdate', 'onBeforeUpdate', 'onUnmount', 'onError', 'onRegistered'].forEach(hook => {
                    if (typeof componentResult[hook] === 'function') {
                        lifecycleHooks[hook] = componentResult[hook];
                    }
                });
            }
            
            if (!uiStructure) {
                console.error(`❌ Component ${componentName} render method returned nothing`);
                return this.createErrorElement(`Component ${componentName} render failed`);
            }
            
            // Render the UI structure
            const element = this.renderUIObject(uiStructure, componentName);
            
            if (element) {
                // Generate unique instance ID
                const instanceId = `${componentName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                element.setAttribute('data-component-instance', instanceId);
                element.setAttribute('data-component-name', componentName);
                
                // Store component instance
                this.componentInstances.set(instanceId, {
                    name: componentName,
                    element,
                    props,
                    lifecycle: lifecycleHooks,
                    api: componentApi,
                    mounted: false,
                    context
                });
                
                // Store component API for external access
                if (Object.keys(componentApi).length > 0) {
                    this.componentApis.set(element, componentApi);
                }
                
                // Schedule mount hook
                setTimeout(() => this.triggerMountHook(instanceId), 0);
            }
            
            return element;
            
        } catch (error) {
            console.error(`❌ Component ${componentName} error:`, error);
            
            // Try to trigger error hook if available
            const element = this.createErrorElement(`Component Error: ${componentName} - ${error.message}`);
            this.triggerErrorHook(element, error, props, this.createContext());
            
            return element;
        }
    }
    
    createErrorElement(message) {
        const element = document.createElement('div');
        element.className = 'juris-component-error';
        element.style.cssText = 'color: red; border: 1px solid red; padding: 8px; margin: 4px;';
        element.textContent = message;
        return element;
    }
    
    // =================================================================
    // LIFECYCLE HOOK EXECUTION
    // =================================================================
    
    async triggerMountHook(instanceId) {
        const instance = this.componentInstances.get(instanceId);
        if (!instance || this.isDestroyed || !instance.element.isConnected) {
            return;
        }
        
        if (instance.lifecycle.onMount && !instance.mounted) {
            try {
                console.log(`🔄 Mounting ${instance.name}`);
                
                const cleanup = await instance.lifecycle.onMount(instance.element, instance.props, instance.context);
                
                if (typeof cleanup === 'function') {
                    this.lifecycleCleanup.set(instance.element, cleanup);
                }
                
                instance.mounted = true;
                this.mountedComponents.add(instanceId);
                
                console.log(`✅ Mounted ${instance.name}`);
                
            } catch (error) {
                console.error(`❌ Mount error for ${instance.name}:`, error);
                this.triggerErrorHook(instance.element, error, instance.props, instance.context);
            }
        }
    }
    
    async triggerUpdateHook(instanceId, newProps) {
        const instance = this.componentInstances.get(instanceId);
        if (!instance || this.isDestroyed) return false;
        
        const oldProps = instance.props;
        
        try {
            // onBeforeUpdate hook
            if (instance.lifecycle.onBeforeUpdate) {
                console.log(`🔄 Before update ${instance.name}`);
                const shouldUpdate = await instance.lifecycle.onBeforeUpdate(instance.element, newProps, oldProps, instance.context);
                
                if (shouldUpdate === false) {
                    console.log(`🛑 Update cancelled for ${instance.name}`);
                    return false;
                }
            }
            
            // onUpdate hook
            if (instance.lifecycle.onUpdate) {
                console.log(`🔄 Updating ${instance.name}`);
                await instance.lifecycle.onUpdate(instance.element, newProps, oldProps, instance.context);
                console.log(`✅ Updated ${instance.name}`);
            }
            
            // Update stored props
            instance.props = newProps;
            
            return true;
            
        } catch (error) {
            console.error(`❌ Update error for ${instance.name}:`, error);
            this.triggerErrorHook(instance.element, error, newProps, instance.context);
            return false;
        }
    }
    
    async triggerUnmountHook(element) {
        if (this.isDestroyed) return;
        
        const instanceId = element.getAttribute('data-component-instance');
        const instance = this.componentInstances.get(instanceId);
        
        if (instance && instance.mounted) {
            try {
                console.log(`🔄 Unmounting ${instance.name}`);
                
                if (instance.lifecycle.onUnmount) {
                    await instance.lifecycle.onUnmount(element, instance.props, instance.context);
                }
                
                // Run mount cleanup function
                const cleanup = this.lifecycleCleanup.get(element);
                if (cleanup && typeof cleanup === 'function') {
                    await cleanup();
                }
                
                console.log(`✅ Unmounted ${instance.name}`);
                
            } catch (error) {
                console.error(`❌ Unmount error for ${instance.name}:`, error);
            }
        }
        
        // Clean up tracking
        if (instanceId) {
            this.componentInstances.delete(instanceId);
            this.mountedComponents.delete(instanceId);
        }
        this.componentApis.delete(element);
        this.lifecycleCleanup.delete(element);
    }
    
    triggerErrorHook(element, error, props, context) {
        const instanceId = element.getAttribute && element.getAttribute('data-component-instance');
        const instance = instanceId ? this.componentInstances.get(instanceId) : null;
        
        if (instance && instance.lifecycle.onError) {
            try {
                console.log(`🔄 Error hook for ${instance.name}`);
                instance.lifecycle.onError(error, element, props, context);
                console.log(`✅ Error handled for ${instance.name}`);
            } catch (hookError) {
                console.error(`❌ Error hook failed for ${instance.name}:`, hookError);
            }
        }
    }
    
    // =================================================================
    // COMPONENT API MANAGEMENT
    // =================================================================
    
    getComponents(filter = null) {
        const components = [];
        this.componentInstances.forEach((instance, instanceId) => {
            const componentInfo = {
                id: instanceId,
                name: instance.name,
                element: instance.element,
                props: instance.props,
                mounted: instance.mounted,
                api: instance.api,
                lifecycle: Object.keys(instance.lifecycle),
                isConnected: instance.element ? instance.element.isConnected : false
            };
            
            if (filter) {
                if (typeof filter === 'string') {
                    // Filter by component name
                    if (instance.name === filter) {
                        components.push(componentInfo);
                    }
                } else if (typeof filter === 'function') {
                    // Filter by function
                    if (filter(componentInfo)) {
                        components.push(componentInfo);
                    }
                } else if (typeof filter === 'object') {
                    // Filter by criteria object
                    let matches = true;
                    Object.keys(filter).forEach(key => {
                        if (componentInfo[key] !== filter[key]) {
                            matches = false;
                        }
                    });
                    if (matches) {
                        components.push(componentInfo);
                    }
                }
            } else {
                components.push(componentInfo);
            }
        });
        
        return components;
    }
    
    getComponent(selector) {
        let element;
        
        if (typeof selector === 'string') {
            // Find by component name
            element = document.querySelector(`[data-component-name="${selector}"]`);
            if (!element) {
                // Try CSS selector
                element = document.querySelector(selector);
            }
        } else if (selector instanceof HTMLElement) {
            element = selector;
        } else {
            console.warn(`Invalid selector type: ${typeof selector}. Expected string or HTMLElement.`);
            return null;
        }
        
        if (!element) {
            console.warn(`Component not found: ${selector}`);
            return null;
        }
        
        const api = this.componentApis.get(element);
        const instanceId = element.getAttribute('data-component-instance');
        const instance = instanceId ? this.componentInstances.get(instanceId) : null;
        
        if (api) {
            return api;
        } else if (instance) {
            return instance.api;
        }
        
        console.warn(`Component API not found for: ${selector}`);
        return null;
    }
    
    updateComponent(componentSelector, newProps = {}, options = {}) {
        const { forceUpdate = false, mergeProps = true } = options;
        
        let element;
        if (typeof componentSelector === 'string') {
            element = document.querySelector(`[data-component-name="${componentSelector}"]`);
            if (!element) {
                element = document.querySelector(componentSelector);
            }
        } else if (componentSelector instanceof HTMLElement) {
            element = componentSelector;
        } else {
            console.warn(`Invalid component selector type: ${typeof componentSelector}`);
            return false;
        }
        
        if (!element) {
            console.warn(`Component not found: ${componentSelector}`);
            return false;
        }
        
        const instanceId = element.getAttribute('data-component-instance');
        const instance = instanceId ? this.componentInstances.get(instanceId) : null;
        
        if (!instance) {
            console.warn(`Component instance not found for: ${componentSelector}`);
            return false;
        }
        
        try {
            const oldProps = instance.props;
            const finalProps = mergeProps ? { ...oldProps, ...newProps } : newProps;
            
            console.log(`🔄 Updating component: ${instance.name}`, { oldProps, newProps: finalProps });
            
            // Update stored props
            instance.props = finalProps;
            
            // Trigger update hook if available
            if (instance.lifecycle.onUpdate || forceUpdate) {
                const updateResult = this.triggerUpdateHook(instanceId, finalProps);
                
                if (updateResult === false) {
                    // Update was cancelled, revert props
                    instance.props = oldProps;
                    console.log(`🛑 Component update cancelled: ${instance.name}`);
                    return false;
                }
            }
            
            // Force re-render by triggering state change
            const forceUpdatePath = `component.${instanceId}.lastUpdate`;
            this.setState(forceUpdatePath, Date.now());
            
            console.log(`✅ Component updated: ${instance.name}`);
            return true;
            
        } catch (error) {
            console.error(`Error updating component ${instance.name}:`, error);
            return false;
        }
    }
    
    removeComponent(componentSelector, options = {}) {
        const { cleanup = true, triggerUnmount = true } = options;
        
        let element;
        if (typeof componentSelector === 'string') {
            element = document.querySelector(`[data-component-name="${componentSelector}"]`);
            if (!element) {
                element = document.querySelector(componentSelector);
            }
        } else if (componentSelector instanceof HTMLElement) {
            element = componentSelector;
        } else {
            console.warn(`Invalid component selector type: ${typeof componentSelector}`);
            return false;
        }
        
        if (!element) {
            console.warn(`Component not found: ${componentSelector}`);
            return false;
        }
        
        const instanceId = element.getAttribute('data-component-instance');
        const instance = instanceId ? this.componentInstances.get(instanceId) : null;
        
        try {
            console.log(`🔄 Removing component: ${instance ? instance.name : 'unknown'}`);
            
            // Trigger unmount hook if requested
            if (triggerUnmount && instance && instance.mounted) {
                this.triggerUnmountHook(element);
            }
            
            // Remove from DOM
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            
            // Cleanup tracking if requested
            if (cleanup) {
                this.cleanupElement(element);
                
                if (instanceId) {
                    this.componentInstances.delete(instanceId);
                    this.mountedComponents.delete(instanceId);
                }
            }
            
            console.log(`✅ Component removed: ${instance ? instance.name : 'unknown'}`);
            return true;
            
        } catch (error) {
            console.error(`Error removing component:`, error);
            return false;
        }
    }
    
    getComponentInfo(componentSelector) {
        let element;
        if (typeof componentSelector === 'string') {
            element = document.querySelector(`[data-component-name="${componentSelector}"]`);
            if (!element) {
                element = document.querySelector(componentSelector);
            }
        } else if (componentSelector instanceof HTMLElement) {
            element = componentSelector;
        } else {
            console.warn(`Invalid component selector type: ${typeof componentSelector}`);
            return null;
        }
        
        if (!element) {
            return null;
        }
        
        const instanceId = element.getAttribute('data-component-instance');
        const instance = instanceId ? this.componentInstances.get(instanceId) : null;
        
        if (!instance) {
            return null;
        }
        
        return {
            id: instanceId,
            name: instance.name,
            element: instance.element,
            props: instance.props,
            mounted: instance.mounted,
            api: instance.api,
            lifecycle: instance.lifecycle,
            context: instance.context,
            isConnected: instance.element.isConnected,
            parentComponent: this.getParentComponent(element),
            childComponents: this.getChildComponents(element),
            stateKeys: this.getComponentStateKeys(instanceId)
        };
    }
    
    scanComponentElementProps(componentSelector, options = {}) {
        const { includeChildren = false, includeEvents = true, includeReactive = true } = options;
        
        let element;
        if (typeof componentSelector === 'string') {
            element = document.querySelector(`[data-component-name="${componentSelector}"]`);
            if (!element) {
                element = document.querySelector(componentSelector);
            }
        } else if (componentSelector instanceof HTMLElement) {
            element = componentSelector;
        } else {
            console.warn(`Invalid component selector type: ${typeof componentSelector}`);
            return null;
        }
        
        if (!element) {
            console.warn(`Component element not found: ${componentSelector}`);
            return null;
        }
        
        const instanceId = element.getAttribute('data-component-instance');
        const instance = instanceId ? this.componentInstances.get(instanceId) : null;
        
        const scanElement = (el, depth = 0) => {
            const elementInfo = {
                tagName: el.tagName.toLowerCase(),
                id: el.id || null,
                className: el.className || null,
                depth,
                attributes: {},
                events: {},
                reactive: {},
                isComponent: el.hasAttribute('data-component-instance'),
                componentName: el.getAttribute('data-component-name') || null,
                element: el
            };
            
            // Scan all attributes
            Array.from(el.attributes).forEach(attr => {
                if (attr.name.startsWith('on') && includeEvents) {
                    // Event attribute
                    const eventType = attr.name.substring(2).toLowerCase();
                    elementInfo.events[eventType] = {
                        isInvocable: true,
                        type: 'event',
                        source: 'attribute',
                        canSimulate: true,
                        value: attr.value
                    };
                } else {
                    // Regular attribute
                    elementInfo.attributes[attr.name] = {
                        value: attr.value,
                        isInvocable: false,
                        type: 'attribute'
                    };
                }
            });
            
            // Scan element properties for events (if includeEvents)
            if (includeEvents) {
                // Get all own properties and prototype properties up to HTMLElement
                const props = new Set();
                let current = el;
                
                // Collect own properties
                Object.getOwnPropertyNames(current).forEach(prop => props.add(prop));
                
                // Check collected properties for event handlers
                props.forEach(prop => {
                    if (prop.startsWith('on') && prop.length > 2) {
                        const eventType = prop.substring(2).toLowerCase();
                        
                        // Check if there's an actual handler assigned
                        if (typeof el[prop] === 'function' || el[prop] !== null) {
                            if (!elementInfo.events[eventType]) {
                                elementInfo.events[eventType] = {
                                    isInvocable: true,
                                    type: 'event',
                                    source: 'property',
                                    canSimulate: true,
                                    hasHandler: typeof el[prop] === 'function'
                                };
                            } else {
                                // Merge with existing (attribute-based) event info
                                elementInfo.events[eventType].source = 'both';
                                elementInfo.events[eventType].hasHandler = typeof el[prop] === 'function';
                            }
                        }
                    }
                });
            }
            
            // Scan for reactive subscriptions (if includeReactive)
            if (includeReactive) {
                const subscriptions = this.elementSubscriptions.get(el);
                if (subscriptions && subscriptions.size > 0) {
                    let reactiveIndex = 0;
                    subscriptions.forEach((subscription) => {
                        const propName = `reactive_${reactiveIndex}`;
                        elementInfo.reactive[propName] = {
                            isInvocable: false,
                            type: 'reactive',
                            hasUnsubscribe: Array.isArray(subscription.unsubscribeFns) && subscription.unsubscribeFns.length > 0,
                            subscriptionCount: Array.isArray(subscription.unsubscribeFns) ? subscription.unsubscribeFns.length : 0
                        };
                        reactiveIndex++;
                    });
                }
            }
            
            const result = {
                element: elementInfo,
                children: []
            };
            
            // Recursively scan children if requested
            if (includeChildren && el.children.length > 0) {
                Array.from(el.children).forEach(child => {
                    result.children.push(scanElement(child, depth + 1));
                });
            }
            
            return result;
        };
        
        return {
            component: {
                id: instanceId,
                name: instance ? instance.name : 'unknown',
                mounted: instance ? instance.mounted : false,
                props: instance ? instance.props : {},
                api: instance ? Object.keys(instance.api) : [],
                lifecycleHooks: instance ? Object.keys(instance.lifecycle) : []
            },
            scan: scanElement(element),
            metadata: {
                timestamp: Date.now(),
                options: {
                    includeChildren,
                    includeEvents,
                    includeReactive
                },
                totalElements: includeChildren ? element.querySelectorAll('*').length + 1 : 1
            }
        };
    }
    
    createContext(additionalMethods = {}) {
        const baseContext = {
            setState: (path, value, context) => this.setState(path, value, context),
            getState: (path, defaultValue) => this.getState(path, defaultValue),
            navigate: (path) => this.navigate(path),
            subscribe: (path, callback) => this.subscribe(path, callback),
            services: this.services,
            
            // NEW: Add useState to context
            useState: (path, defaultValue) => this.useState(path, defaultValue),
            
            // Component management APIs
            getComponents: (filter) => this.getComponents(filter),
            getComponent: (selector) => this.getComponent(selector),
            updateComponent: (selector, newProps, options) => this.updateComponent(selector, newProps, options),
            removeComponent: (selector, options) => this.removeComponent(selector, options),
            getComponentInfo: (selector) => this.getComponentInfo(selector),
            scanComponentElementProps: (selector, options) => this.scanComponentElementProps(selector, options),
            invokeElementProp: (element, propName, ...args) => this.invokeElementProp(element, propName, ...args),
            
            // Framework instance access for advanced usage
            juris: this
        };
        
        this.headlessComponents.forEach((instance, componentName) => {
            if (instance.componentResult) {
                baseContext[componentName] = instance.componentResult;
            }
        });
        // Merge any additional methods or overrides
        return { ...baseContext, ...additionalMethods };
    }

    invokeElementProp(elementSelector, propName, ...args) {
        let element;
        if (typeof elementSelector === 'string') {
            element = document.querySelector(elementSelector);
        } else if (elementSelector instanceof HTMLElement) {
            element = elementSelector;
        } else {
            console.warn(`Invalid element selector type: ${typeof elementSelector}`);
            return false;
        }
        
        if (!element) {
            console.warn(`Element not found: ${elementSelector}`);
            return false;
        }
        
        try {
            // TRULY GENERIC EVENT HANDLER INVOCATION
            if (propName.startsWith('on')) {
                const eventType = propName.substring(2).toLowerCase();
                
                // Build event configuration
                const eventConfig = { 
                    bubbles: true, 
                    cancelable: true 
                };
                
                // Merge any provided event properties
                if (args.length > 0 && typeof args[0] === 'object') {
                    Object.assign(eventConfig, args[0]);
                }
                
                // Create event using generic Event constructor
                // Let the browser handle event type specifics
                const event = new Event(eventType, eventConfig);
                
                // Copy any additional properties from args to the event object
                if (args.length > 0 && typeof args[0] === 'object') {
                    Object.keys(args[0]).forEach(key => {
                        if (!eventConfig.hasOwnProperty(key)) {
                            try {
                                event[key] = args[0][key];
                            } catch (e) {
                                // Some properties might be read-only, ignore silently
                            }
                        }
                    });
                }
                
                console.log(`🔄 Invoking event: ${eventType} on`, element);
                const result = element.dispatchEvent(event);
                return result;
                
            } else if (element[propName] && typeof element[propName] === 'function') {
                // Direct method invocation
                console.log(`🔄 Invoking method: ${propName} on`, element);
                return element[propName](...args);
                
            } else if (element[propName] !== undefined) {
                // Property access/setting
                if (args.length === 0) {
                    // Get property value
                    console.log(`🔄 Getting property: ${propName} from`, element);
                    return element[propName];
                } else {
                    // Set property value
                    console.log(`🔄 Setting property: ${propName} on`, element);
                    element[propName] = args[0];
                    return true;
                }
            } else {
                console.warn(`Property ${propName} does not exist on element`, element);
                return false;
            }
            
        } catch (error) {
            console.error(`Error invoking ${propName}:`, error);
            return false;
        }
    }
    
    // Helper methods for component info
    getParentComponent(element) {
        const parentComponentEl = element.parentElement?.closest('[data-component-instance]');
        if (parentComponentEl && parentComponentEl !== element) {
            const parentInstanceId = parentComponentEl.getAttribute('data-component-instance');
            const parentInstance = this.componentInstances.get(parentInstanceId);
            return parentInstance ? {
                id: parentInstanceId,
                name: parentInstance.name,
                element: parentComponentEl
            } : null;
        }
        return null;
    }
    
    getChildComponents(element) {
        const childComponentEls = element.querySelectorAll('[data-component-instance]');
        const children = [];
        
        childComponentEls.forEach(childEl => {
            const childInstanceId = childEl.getAttribute('data-component-instance');
            const childInstance = this.componentInstances.get(childInstanceId);
            if (childInstance) {
                children.push({
                    id: childInstanceId,
                    name: childInstance.name,
                    element: childEl
                });
            }
        });
        
        return children;
    }
    
    getComponentStateKeys(instanceId) {
        // Find state keys that might be related to this component
        const stateKeys = [];
        const findKeys = (obj, prefix = '') => {
            Object.keys(obj).forEach(key => {
                const fullPath = prefix ? `${prefix}.${key}` : key;
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    findKeys(obj[key], fullPath);
                } else {
                    stateKeys.push(fullPath);
                }
            });
        };
        
        findKeys(this.state);
        return stateKeys;
    }
    
    // Alias for backward compatibility
    getAllComponents() {
        return this.getComponents();
    }
    
    // =================================================================
    // UI RENDERING SYSTEM
    // =================================================================
    
    isAttribute(key) {
        return key.startsWith('data-') ||      
               key.startsWith('aria-') ||      
               key.includes('-') ||            
               this.isCustomAttribute(key);    
    }
    
    isCustomAttribute(key) {
        const testElement = document.createElement('div');
        return !(key in testElement) && !key.startsWith('on') && 
               !['text', 'children', 'style', 'setState', 'getState', 'navigate', 'services', 'routeParams'].includes(key);
    }

    handleElementEvent(element, eventKey, handler, injectedProps) {
        const eventName = eventKey.substring(2).toLowerCase();
        element.addEventListener(eventName, (e) => handler(e, injectedProps));
    }

    handleDefinitionEvent(element, eventKey, handler, context) {
        const eventName = eventKey.substring(2).toLowerCase();
        element.addEventListener(eventName, (e) => handler(e, context));
    }


    createElement(tagName, props = {}) {
        if (this.isDestroyed) return null;
        
        const element = document.createElement(tagName);
        element.setAttribute('data-created', Date.now());
        
        const injectedProps = {
            ...props,
            setState: (path, value, context) => this.setState(path, value, context),
            getState: (path, defaultValue) => this.getState(path, defaultValue),
            navigate: (path) => this.navigate(path),
            services: this.services
        };
        
        injectedProps.getState.juris = this;
        
        // Handle text content
        if (injectedProps.text) {
            if (typeof injectedProps.text === 'function') {
                this.createReactiveAttribute(element, 'textContent', () => injectedProps.text(injectedProps));
            } else {
                element.textContent = injectedProps.text;
            }
        }
        
        // Handle HTML content (innerHTML)
        if (injectedProps.html || injectedProps.dangerousHtml) {
            const htmlValue = injectedProps.html || injectedProps.dangerousHtml;
            if (typeof htmlValue === 'function') {
                this.createReactiveAttribute(element, 'innerHTML', () => this.sanitizeHTML(htmlValue(injectedProps)));
            } else {
                element.innerHTML = this.sanitizeHTML(htmlValue);
            }
        }
        
        // Handle events
        Object.keys(injectedProps).forEach(key => {
            if (key.startsWith('on') && typeof injectedProps[key] === 'function') {
                const eventName = key.substring(2).toLowerCase();
                element.addEventListener(eventName, (e) => injectedProps[key](e, injectedProps));
            }
        });
        
        // Handle styles
        if (injectedProps.style) {
            Object.keys(injectedProps.style).forEach(key => {
                const value = injectedProps.style[key];
                if (typeof value === 'function') {
                    this.createReactiveAttribute(element, `style.${key}`, () => value(injectedProps));
                } else {
                    element.style[key] = value;
                }
            });
        }
        
        // Handle other properties and attributes
        Object.keys(injectedProps).forEach(key => {
            if (['text', 'html', 'dangerousHtml', 'style', 'children', 'setState', 'getState', 'navigate', 'services', 'routeParams'].includes(key) || 
                key.startsWith('on')) {
                return;
            }
            
            const value = injectedProps[key];
            
            if (typeof value === 'function') {
                this.createReactiveAttribute(element, key, () => value(injectedProps));
            } else if (value !== null && value !== undefined && typeof value !== 'object') {
                if (this.isAttribute(key)) {
                    if (value === true) {
                        element.setAttribute(key, '');
                    } else if (value === false) {
                        element.removeAttribute(key);
                    } else {
                        element.setAttribute(key, String(value));
                    }
                } else {
                    element[key] = value;
                }
            }
        });
        
        // Handle children (only if no HTML content)
        if (injectedProps.children && !injectedProps.html && !injectedProps.dangerousHtml) {
            if (typeof injectedProps.children === 'function') {
                this.createReactiveAttribute(element, 'children', () => {
                    const childrenResult = injectedProps.children(injectedProps);
                    return childrenResult;
                });
            } else {
                const children = injectedProps.children;
                if (Array.isArray(children)) {
                    children.forEach(child => {
                        const childElement = this.renderUIObject(child, null);
                        if (childElement) {
                            element.appendChild(childElement);
                        }
                    });
                }
            }
        }
        
        return element;
    }
    
    applyDefinitionToElement(element, definition, context) {
        Object.keys(definition).forEach(key => {
            const value = definition[key];
            
            if (key === 'text') {
                if (typeof value === 'function') {
                    this.createReactiveAttribute(element, 'textContent', () => value(context));
                } else {
                    element.textContent = value;
                }
            } else if (key === 'html' || key === 'dangerousHtml') {
                if (typeof value === 'function') {
                    this.createReactiveAttribute(element, 'innerHTML', () => this.sanitizeHTML(value(context)));
                } else {
                    element.innerHTML = this.sanitizeHTML(value);
                }
            } else if (key === 'children') {
                // Only process children if no HTML content
                if (!definition.html && !definition.dangerousHtml) {
                    if (typeof value === 'function') {
                        this.createReactiveAttribute(element, 'children', () => value(context));
                    } else if (Array.isArray(value)) {
                        while (element.firstChild) {
                            this.cleanupElement(element.firstChild);
                            element.removeChild(element.firstChild);
                        }
                        value.forEach(child => {
                            const childElement = this.renderUIObject(child, null);
                            if (childElement) {
                                element.appendChild(childElement);
                            }
                        });
                    }
                }
            } else if (key.startsWith('on') && typeof value === 'function') {
                const eventName = key.substring(2).toLowerCase();
                element.addEventListener(eventName, (e) => value(e, context));
            } else if (key === 'style' && typeof value === 'object') {
                Object.keys(value).forEach(styleProp => {
                    const styleValue = value[styleProp];
                    if (typeof styleValue === 'function') {
                        this.createReactiveAttribute(element, `style.${styleProp}`, () => styleValue(context));
                    } else {
                        element.style[styleProp] = styleValue;
                    }
                });
            } else if (typeof value === 'function') {
                this.createReactiveAttribute(element, key, () => value(context));
            } else if (value !== null && value !== undefined && typeof value !== 'object') {
                if (this.isAttribute(key)) {
                    if (value === true) {
                        element.setAttribute(key, '');
                    } else if (value === false) {
                        element.removeAttribute(key);
                    } else {
                        element.setAttribute(key, String(value));
                    }
                } else {
                    element[key] = value;
                }
            }
        });
        
        element.setAttribute('data-juris-enhanced', 'true');
    }
    
    renderUIObject(obj, componentName = null) {
        if (!obj || typeof obj !== 'object' || this.isDestroyed) {
            return null;
        }
        
        const tagName = Object.keys(obj)[0];
        const props = obj[tagName];
        
        if (this.components.has(tagName)) {
            return this.renderComponent(tagName, props, componentName);
        }
        
        const element = this.createElement(tagName, props);
        
        if (componentName && element) {
            element.setAttribute('data-juris-parent-component', componentName);
        }
        
        return element;
    }
    
    render(container = '#app') {
        if (this.isDestroyed || this._rendering) return; // ADD: Guard line
        
        try {
            this._rendering = true; // ADD: Set flag
            
            // ... ALL existing render code unchanged ...
            const containerEl = typeof container === 'string' 
                ? document.querySelector(container) 
                : container;
            
            if (!containerEl) {
                //console.error('Juris: Container not found:', container);
                return;
            }
            
            Array.from(containerEl.children).forEach(child => this.cleanupElement(child));
            containerEl.innerHTML = '';
            
            let uiObject = this.layout;
            
            if (!uiObject) {
                containerEl.innerHTML = '<p>No layout found</p>';
                return;
            }
            
            const element = this.renderUIObject(uiObject);
            
            if (element) {
                containerEl.appendChild(element);
                console.log('✅ Layout rendered successfully');
            } else {
                console.error('❌ Layout render failed');
                containerEl.innerHTML = '<div class="error">Render failed - element is null</div>';
            }
            
        } catch (error) {
            console.error('Render error:', error);
            const containerEl = typeof container === 'string' 
                ? document.querySelector(container) 
                : container;
            if (containerEl) {
                containerEl.innerHTML = `<div class="error">Render error: ${error.message}</div>`;
            }
        } finally {
            this._rendering = false; // ADD: Reset flag
        }
    }
    
    // =================================================================
    // ROUTER SYSTEM
    // =================================================================
    
    /**
     * Enhanced router setup - replace your existing setupRouter method with this
     */
    setupRouter() {
        const { mode = 'hash', base = '', routes = {}, guards = {}, middleware = [], 
                lazy = {}, transitions = true, scrollBehavior = 'top', maxHistorySize = 50 } = this.router;
        
        Object.assign(this, { routingMode: mode, basePath: base, lazyComponents: lazy, 
                             enableTransitions: transitions, scrollBehavior, maxHistorySize,
                             routeHistory: [], routeGuards: guards });
        
        this.routes = Object.fromEntries(
            Object.entries(routes).map(([path, config]) => [path, this.normalizeRouteConfig(config)])
        );
        
        this.processNestedRoutes();
        this.processRouteAliases();
        
        // FIX: Ensure middleware array is properly initialized
        this.routeMiddleware = [];
        
        if (middleware && middleware.length > 0) {
            middleware.forEach(mw => this.addRouteMiddleware(mw));
        }
        
        ['Router', 'RouterOutlet', 'RouterLink'].forEach(name => 
            this.registerComponent(name, (props, context) => this[`create${name}Component`](props, context))
        );
        
        if (typeof window !== 'undefined') {
            this.setupEventListeners();
            setTimeout(() => this.handleRouteChange(null, { initial: true }), 0);
        }
        
        this.currentRoute = this.getCurrentRoute();
        this.setState('router.currentRoute', this.currentRoute);
        this.setState('router.isLoading', false);
        
        console.log(`🚀 Router initialized in ${mode} mode with enhanced features`);
        console.log(`📊 Middleware registered: ${this.routeMiddleware.length}`);
    }


    /**
     * Unified event listener setup
     */
    setupEventListeners() {
        const eventMap = {
            history: ['popstate', (e) => this.handleRouteChange(e.state)],
            hash: ['hashchange', () => this.handleRouteChange()]
        };
        
        const [event, handler] = eventMap[this.routingMode] || [];
        if (event) window.addEventListener(event, handler);
        
        // History mode link interception
        if (this.routingMode === 'history') {
            document.addEventListener('click', (e) => this.handleLinkClick(e));
        }
        
        // Unified beforeunload handler
        window.addEventListener('beforeunload', (e) => {
            if (this.getState('router.hasUnsavedChanges', false)) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            }
        });
    }
    normalizeRouteConfig(config) {
        if (typeof config === 'string') return { component: config };
        
        return {
            component: config.component,
            guards: [].concat(config.guards || config.guard || []),
            loadData: config.loadData,
            meta: config.meta || {},
            params: config.params || {},
            query: config.query || {},
            children: config.children || {},
            lazy: config.lazy || false,
            transitions: config.transitions,
            beforeEnter: config.beforeEnter,
            beforeLeave: config.beforeLeave,
            redirectTo: config.redirectTo,
            alias: config.alias
        };
    }
    
    matchRoute(path) {
        const { pathname, query, hash } = this.parseUrl(path);
        
        // Check redirects and aliases first
        const redirect = this.checkRedirects ? this.checkRedirects(pathname) : null;
        if (redirect) return { redirect };
        
        const alias = this.checkAliases ? this.checkAliases(pathname) : null;
        if (alias) {
            return this.buildMatchResult(alias.originalPath, {}, query, hash, this.routes[alias.originalPath], { alias: alias.alias });
        }
        
        // Exact match check
        if (this.routes[pathname]) {
            return this.buildMatchResult(pathname, {}, query, hash, this.routes[pathname], { exact: true });
        }
        
        // Pattern matching
        for (const [pattern, config] of Object.entries(this.routes)) {
            if (pattern === '*') continue; // Handle wildcard last
            
            const match = this.matchPattern ? this.matchPattern(pattern, pathname) : null;
            if (match) {
                try {
                    // FIX: Ensure query is properly passed through
                    const validatedParams = this.validateParams ? this.validateParams(match.params, config.params || {}) : match.params || {};
                    const validatedQuery = this.validateParams ? this.validateParams(query, config.query || {}) : query || {};
                    return this.buildMatchResult(pattern, validatedParams, validatedQuery, hash, config, { matchType: match.type });
                } catch (error) {
                    console.warn(`Validation failed for ${pattern}:`, error.message);
                    continue;
                }
            }
        }
        
        // Handle wildcard route (404 fallback)
        if (this.routes['*']) {
            return this.buildMatchResult('*', {}, query, hash, this.routes['*'], { wildcard: true });
        }
        
        return null;
    }
    /**
     * : Unified parameter validation for both route and query params
     */
    validateParams(params, configParams = {}) {
        if (!configParams || Object.keys(configParams).length === 0) return params;
        
        const result = { ...params };
        const errors = [];
        
        for (const [key, config] of Object.entries(configParams)) {
            const value = params[key];
            
            // Required check
            if (config.required && (value === undefined || value === null || value === '')) {
                errors.push(`Parameter '${key}' is required`);
                continue;
            }
            
            // Apply default
            let processedValue = value ?? config.default;
            if (processedValue === undefined || processedValue === null) {
                result[key] = processedValue;
                continue;
            }
            
            // Type transformation and validation
            try {
                result[key] = this.transformValue(processedValue, config, key);
            } catch (error) {
                errors.push(error.message);
            }
        }
        
        if (errors.length > 0) throw new Error(`Validation failed: ${errors.join(', ')}`);
        return result;
    }

    /**
     * : Consolidated value transformation with all validation rules
     */
    transformValue(value, config, paramName) {
        let transformed = value;
        
        // Type conversion
        const typeMap = {
            number: () => { const n = Number(value); if (isNaN(n)) throw new Error(`'${paramName}' must be a number`); return n; },
            int: () => { const n = parseInt(value, 10); if (isNaN(n)) throw new Error(`'${paramName}' must be an integer`); return n; },
            float: () => { const n = parseFloat(value); if (isNaN(n)) throw new Error(`'${paramName}' must be a float`); return n; },
            boolean: () => typeof value === 'boolean' ? value : ['true', '1', 'yes'].includes(String(value).toLowerCase()),
            date: () => { const d = new Date(value); if (isNaN(d.getTime())) throw new Error(`'${paramName}' must be a valid date`); return d; },
            string: () => String(value)
        };
        
        if (config.type && typeMap[config.type]) {
            transformed = typeMap[config.type]();
        }
        
        // Validation rules
        const validators = [
            () => config.pattern && !new RegExp(config.pattern).test(String(transformed)) && `'${paramName}' does not match pattern`,
            () => config.enum && !config.enum.includes(transformed) && `'${paramName}' must be one of: ${config.enum.join(', ')}`,
            () => typeof transformed === 'number' && config.min !== undefined && transformed < config.min && `'${paramName}' must be at least ${config.min}`,
            () => typeof transformed === 'number' && config.max !== undefined && transformed > config.max && `'${paramName}' must be at most ${config.max}`,
            () => typeof transformed === 'string' && config.minLength !== undefined && transformed.length < config.minLength && `'${paramName}' must be at least ${config.minLength} characters`,
            () => typeof transformed === 'string' && config.maxLength !== undefined && transformed.length > config.maxLength && `'${paramName}' must be at most ${config.maxLength} characters`
        ];
        
        for (const validator of validators) {
            const error = validator();
            if (error) throw new Error(error);
        }
        
        return transformed;
    }

    // =================================================================
    //  URL PARSING AND BUILDING
    // =================================================================

    /**
     * : Enhanced URL parsing with query array support
     */
    parseUrl(url) {
        // Handle both hash and normal URLs
        let workingUrl = url;
        
        // If this is a hash URL, extract the hash part
        if (workingUrl.includes('#') && !workingUrl.startsWith('#')) {
            workingUrl = workingUrl.split('#')[1] || '/';
        } else if (workingUrl.startsWith('#')) {
            workingUrl = workingUrl.substring(1) || '/';
        }
        
        const [pathAndQuery, hash] = workingUrl.split('#');
        const [pathname, queryString] = pathAndQuery.split('?');
        
        return {
            pathname: pathname || '/',
            query: this.parseQueryString(queryString || ''),
            hash: hash || ''
        };
    }

    /**
     * : Streamlined query string parsing
     */
    parseQueryString(queryString) {
        if (!queryString || queryString.trim() === '') return {};
        
        try {
            const params = {};
            const pairs = queryString.split('&');
            
            for (const pair of pairs) {
                if (!pair) continue;
                
                const [key, value = ''] = pair.split('=');
                if (!key) continue;
                
                try {
                    const decodedKey = decodeURIComponent(key);
                    const decodedValue = decodeURIComponent(value);
                    
                    // Handle array parameters
                    if (decodedKey.includes('[')) {
                        const arrayMatch = decodedKey.match(/([^[]+)\[([^\]]*)\]/);
                        if (arrayMatch) {
                            const [, arrayKey, index] = arrayMatch;
                            if (!params[arrayKey]) {
                                params[arrayKey] = index === '' ? [] : {};
                            }
                            if (index === '') {
                                params[arrayKey].push(decodedValue);
                            } else {
                                params[arrayKey][index] = decodedValue;
                            }
                            continue;
                        }
                    }
                    
                    // Handle duplicate keys
                    if (params[decodedKey] !== undefined) {
                        if (!Array.isArray(params[decodedKey])) {
                            params[decodedKey] = [params[decodedKey]];
                        }
                        params[decodedKey].push(decodedValue);
                    } else {
                        params[decodedKey] = decodedValue;
                    }
                } catch (decodeError) {
                    console.warn('Failed to decode query parameter:', pair, decodeError);
                    // Add raw value if decoding fails
                    params[key] = value;
                }
            }
            
            return params;
        } catch (error) {
            console.error('Query string parsing error:', error);
            return {};
        }
    }

    /**
     * Complete implementation of route aliases
     */
    processRouteAliases() {
        // Process aliases from route configurations
        Object.entries(this.routes).forEach(([routePath, config]) => {
            if (config.alias) {
                const aliases = Array.isArray(config.alias) ? config.alias : [config.alias];
                aliases.forEach(alias => {
                    this.routeAliases.set(alias, {
                        originalPath: routePath,
                        config: config,
                        alias: alias
                    });
                });
            }
        });
    }

    /**
     * : Streamlined query string building
     */
    buildQueryString(params) {
        return Object.entries(params)
            .filter(([, value]) => value !== null && value !== undefined)
            .flatMap(([key, value]) => {
                if (Array.isArray(value)) {
                    return value.map(v => `${encodeURIComponent(key)}[]=${encodeURIComponent(v)}`);
                }
                if (typeof value === 'object') {
                    return Object.entries(value).map(([subKey, subValue]) => 
                        `${encodeURIComponent(key)}[${encodeURIComponent(subKey)}]=${encodeURIComponent(subValue)}`
                    );
                }
                return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
            })
            .join('&');
    }

    // =================================================================
    //  NAVIGATION
    // =================================================================

    /**
     * : Unified navigation for all modes
     */
    navigate(path, options = {}) {
        if (typeof window === 'undefined') return false;
        
        const { replace = false, query, hash, force = false, silent = false } = options;
        
        let fullPath = path;
        
        // FIX: Properly handle query parameter building
        if (query && Object.keys(query).length > 0) {
            const queryString = this.buildQueryString(query);
            if (queryString) {
                fullPath += (fullPath.includes('?') ? '&' : '?') + queryString;
            }
        }
        
        if (hash) fullPath += '#' + hash;
        
        if (!force && !silent && !this.runNavigationGuards(this.currentRoute, fullPath)) return false;
        
        const navigators = {
            history: () => {
                const url = this.basePath + fullPath;
                window.history[replace ? 'replaceState' : 'pushState'](options.state, '', url);
                if (!silent) {
                    setTimeout(() => this.handleRouteChange(options.state), this._routeState?.debounceMs || 10);
                }
            },
            hash: () => {
                if (replace) {
                    const newUrl = window.location.href.split('#')[0] + '#' + fullPath;
                    window.history.replaceState(null, '', newUrl);
                    if (!silent) {
                        setTimeout(() => this.handleRouteChange(), this._routeState?.debounceMs || 10);
                    }
                } else {
                    window.location.hash = fullPath;
                }
            },
            memory: () => {
                if (replace && this.routeHistory?.length > 0) {
                    this.routeHistory[this.routeHistory.length - 1] = fullPath;
                } else {
                    this.routeHistory = this.routeHistory || [];
                    this.routeHistory.push(fullPath);
                    if (this.routeHistory.length > (this.maxHistorySize || 50)) this.routeHistory.shift();
                }
                if (!silent) {
                    this.currentRoute = fullPath;
                    setTimeout(() => this.handleRouteChange(), this._routeState?.debounceMs || 10);
                }
            }
        };
        
        const navigator = navigators[this.routingMode || 'hash'];
        if (navigator) {
            navigator();
            return true;
        }
        
        return false;
    }


    async _processRouteChange(historyState = null, options = {}) {
        const { initial = false, force = false } = options;
        const newPath = this.getCurrentRoute();
        const currentPath = this.getState('router.currentRoute', '/');
        
        if (!force && newPath === currentPath && !initial) return;
        
        console.log(`🔄 Route change: ${currentPath} → ${newPath}`);
        
        if (!initial && currentPath) {
            this.saveScrollPosition(currentPath);
        }
        
        if (!initial && !force && this.getState('router.hasUnsavedChanges', false)) {
            if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
                this.revertNavigation(currentPath);
                return;
            }
            this.setState('router.hasUnsavedChanges', false);
        }
        
        this.setState('router.isLoading', true);
        this.setState('router.error', null);
        
        try {
            const matchResult = this.matchRoute(newPath);
            
            if (matchResult?.redirect) {
                console.log(`🔄 Redirecting to: ${matchResult.redirect}`);
                this.navigate(matchResult.redirect, { replace: true });
                return;
            }
            
            if (!matchResult) {
                this.handleRouteNotFound(newPath);
                return;
            }
            
            const { route, params, query, hash, config } = matchResult;
            
            // FIX: Ensure context has all required data
            const middlewareContext = {
                route: newPath,
                from: currentPath,
                to: newPath,
                params: params || {},
                query: query || {},
                hash: hash || '',
                historyState,
                navigate: (path, navOptions) => this.navigate(path, navOptions),
                getState: (path, defaultValue) => this.getState(path, defaultValue),
                setState: (path, value, context) => this.setState(path, value, context)
            };
            
            console.log('🔄 Middleware context:', middlewareContext);
            
            // FIX: Ensure middleware execution
            const middlewarePassed = await this.executeRouteMiddleware(middlewareContext);
            if (!middlewarePassed) {
                this.revertNavigation(currentPath);
                return;
            }
            
            if (config && !(await this.runGuards(config, params || {}, middlewareContext))) {
                this.revertNavigation(currentPath);
                return;
            }
            
            if (config?.component) await this.loadRouteComponent(config.component, config);
            if (config?.loadData) await this.loadRouteData(config.loadData, { params: params || {}, query: query || {}, route: newPath });
            
            // FIX: Ensure proper state updates with all data
            this.updateRouteState(newPath, params || {}, query || {}, hash || '', route, historyState);
            this.updateNestedRouteState(matchResult);
            
            this.handleScrollBehavior(newPath, currentPath, { savedPosition: historyState?.scrollPosition });
            
            if (this.enableTransitions && config?.transitions && !initial) {
                await this.performRouteTransition(currentPath, newPath, config.transitions);
            }
            
            setTimeout(() => this.render(), 0);
            
            console.log(`✅ Route changed successfully: ${newPath}`);
            
        } catch (error) {
            console.error('❌ Route change error:', error);
            this.setState('router.error', error.message);
        } finally {
            this.setState('router.isLoading', false);
        }
    }

    /**
     * : Unified current route detection
     */
    getCurrentRoute() {
        if (typeof window === 'undefined') return this.routeHistory?.[this.routeHistory.length - 1] || '/';
        
        const routeMap = {
            history: () => {
                const path = window.location.pathname.replace(this.basePath || '', '') || '/';
                const search = window.location.search;
                const hash = window.location.hash;
                return path + search + hash;
            },
            hash: () => { 
                const hash = window.location.hash;
                return hash.startsWith('#') ? hash.substring(1) || '/' : '/';
            },
            memory: () => this.routeHistory?.[this.routeHistory.length - 1] || '/'
        };
        
        return routeMap[this.routingMode || 'hash']?.() || '/';
    }

    // =================================================================
    //  ROUTE CHANGE HANDLING
    // =================================================================

    /**
     * : Streamlined route change handling
     */
    async handleRouteChange(historyState = null, options = {}) {
        if (this.isDestroyed) return;
        
        const { initial = false, force = false } = options;
        const newPath = this.getCurrentRoute();
        const currentPath = this.getState('router.currentRoute', '/');
        
        if (!force && newPath === currentPath && !initial) return;
        
        console.log(`🔄 Route change: ${currentPath} → ${newPath}`);
        
        if (!initial && currentPath) {
            this.saveScrollPosition(currentPath);
        }
        
        if (!initial && !force && this.getState('router.hasUnsavedChanges', false)) {
            if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
                this.revertNavigation(currentPath);
                return;
            }
            this.setState('router.hasUnsavedChanges', false);
        }
        
        this.setState('router.isLoading', true);
        this.setState('router.error', null);
        
        try {
            const matchResult = this.matchRoute(newPath);
            
            if (matchResult?.redirect) {
                console.log(`🔄 Redirecting to: ${matchResult.redirect}`);
                this.navigate(matchResult.redirect, { replace: true });
                return;
            }
            
            if (!matchResult) {
                this.handleRouteNotFound(newPath);
                return;
            }
            
            const { route, params, query, hash, config } = matchResult;
            
            const middlewareContext = {
                route: newPath,
                from: currentPath,
                to: newPath,
                params,
                query,
                hash,
                historyState,
                navigate: (path) => this.navigate(path),
                getState: (path, defaultValue) => this.getState(path, defaultValue),
                setState: (path, value, context) => this.setState(path, value, context)
            };
            
            this.updateRouteState(newPath, params, query, hash, route, historyState);
            const middlewarePassed = await this.executeRouteMiddleware(middlewareContext);
            if (!middlewarePassed) {
                this.revertNavigation(currentPath);
                return;
            }
            
            if (!(await this.runGuards(config, params, middlewareContext))) {
                this.revertNavigation(currentPath);
                return;
            }
            
            if (config.component) await this.loadRouteComponent(config.component, config);
            if (config.loadData) await this.loadRouteData(config.loadData, { params, query, route: newPath });
            
            this.updateNestedRouteState(matchResult);
            
            this.handleScrollBehavior(newPath, currentPath, { savedPosition: historyState?.scrollPosition });
            
            if (this.enableTransitions && config.transitions && !initial) {
                await this.performRouteTransition(currentPath, newPath, config.transitions);
            }
            
            // CHANGE: Schedule render instead of immediate
            setTimeout(() => this.render(), 0); // CHANGED: Was this.render()
            
            console.log(`✅ Route changed successfully: ${newPath}`);
            
        } catch (error) {
            console.error('❌ Route change error:', error);
            this.setState('router.error', error.message);
        } finally {
            this.setState('router.isLoading', false);
        }
    }

    // =================================================================
    //  COMPONENT CREATION
    // =================================================================

    /**
     * : Streamlined Router component
     */
    createRouterComponent(props, context) {
        return {
            render: () => {
                const state = ['currentRoute', 'isLoading', 'error', 'notFound', 'params', 'query']
                    .reduce((acc, key) => ({ ...acc, [key]: context.getState(`router.${key}`, key === 'params' || key === 'query' ? {} : key === 'currentRoute' ? '/' : false) }), {});
                
                // Handle loading, error, and 404 states
                const stateComponents = {
                    loading: () => props.loadingComponent ? { [props.loadingComponent]: {} } : { div: { className: 'router-loading', text: 'Loading...' } },
                    error: () => props.errorComponent ? { [props.errorComponent]: { error: state.error } } : this.createErrorComponent(state.error),
                    notFound: () => props.notFoundComponent ? { [props.notFoundComponent]: { route: state.currentRoute } } : this.createNotFoundComponent(state.currentRoute)
                };
                
                if (state.isLoading) return stateComponents.loading();
                if (state.error) return stateComponents.error();
                if (state.notFound) return stateComponents.notFound();
                
                // Render matched component
                const matchResult = this.matchRoute(state.currentRoute);
                if (!matchResult) return { div: { text: 'No route matched' } };
                
                const { config } = matchResult;
                const componentName = config.component;
                
                if (!componentName || !this.components.has(componentName)) {
                    return this.createErrorComponent(`Component not found: ${componentName}`);
                }
                
                return { [componentName]: { ...props, routeParams: state.params, routeQuery: state.query, routePath: state.currentRoute } };
            }
        };
    }

    /**
     * : Streamlined RouterLink component
     */
    createRouterLinkComponent(props, context) {
        return {
            render: () => {
                const { to, params = {}, query = {}, replace = false, exact = false, activeClass = 'router-link-active', ...otherProps } = props;
                
                // Build href
                let href = to;
                try {
                    href = this.buildRoute(to, params, query);
                } catch (error) {
                    href = to; // Fallback
                }
                
                // Check active state
                const currentRoute = context.getState('router.currentRoute', '/');
                const isActive = exact ? currentRoute === href : currentRoute.startsWith(href);
                
                return {
                    a: {
                        ...otherProps,
                        href,
                        className: `${otherProps.className || ''} ${isActive && activeClass ? activeClass : ''}`.trim(),
                        onClick: (e) => {
                            e.preventDefault();
                            this.navigate(href, { replace });
                            if (otherProps.onClick) otherProps.onClick(e);
                        }
                    }
                };
            }
        };
    }

    // =================================================================
    //  UTILITY METHODS
    // =================================================================

    /**
     * : Consolidated helper methods
     */
    buildMatchResult(route, params, query, hash, config, meta = {}) {
        return { route, params, query, hash, config, ...meta };
    }

    createErrorComponent(message) {
        return {
            div: {
                className: 'juris-component-error',
                style: 'color: red; border: 1px solid red; padding: 8px; margin: 4px;',
                text: message
            }
        };
    }

    createNotFoundComponent(route) {
        return {
            div: {
                className: 'router-not-found',
                children: [
                    { h1: { style: { fontSize: '4rem' }, text: '404' } },
                    { h2: { text: 'Page Not Found' } },
                    { p: { text: `The route "${route}" does not exist.` } },
                    { a: { href: '#/', text: '🏠 Go Home' } }
                ]
            }
        };
    }

    checkRedirects(path) {
        for (const [routePath, config] of Object.entries(this.routes)) {
            if (config.redirectTo && routePath === path) return config.redirectTo;
        }
        return null;
    }

    checkAliases(path) {
        const aliasInfo = this.routeAliases.get(path);
        if (aliasInfo) {
            return {
                originalPath: aliasInfo.originalPath,
                alias: aliasInfo.alias,
                config: aliasInfo.config
            };
        }
        return null;
    }

    /**
     * Process nested routes from configuration
     */
    processNestedRoutes() {
        Object.entries(this.routes).forEach(([parentPath, config]) => {
            if (config.children) {
                this.processChildRoutes(parentPath, config.children, config);
            }
        });
    }

    /**
     * Process child routes recursively
     */
    processChildRoutes(parentPath, children, parentConfig, depth = 1) {
        Object.entries(children).forEach(([childPath, childConfig]) => {
            const fullPath = this.buildNestedPath(parentPath, childPath);
            
            // Normalize child config
            const normalizedConfig = this.normalizeRouteConfig(childConfig);
            
            // Inherit parent properties
            normalizedConfig.parent = parentPath;
            normalizedConfig.depth = depth;
            normalizedConfig.guards = [...(parentConfig.guards || []), ...(normalizedConfig.guards || [])];
            
            // Store nested route
            this.routes[fullPath] = normalizedConfig;
            this.nestedRoutes.set(fullPath, {
                parent: parentPath,
                depth: depth,
                path: childPath,
                fullPath: fullPath
            });
            
            // Process nested children recursively
            if (normalizedConfig.children) {
                this.processChildRoutes(fullPath, normalizedConfig.children, normalizedConfig, depth + 1);
            }
        });
    }

    /**
     * Build nested path properly
     */
    buildNestedPath(parentPath, childPath) {
        // Handle absolute child paths
        if (childPath.startsWith('/')) {
            return childPath;
        }
        
        // Remove trailing slash from parent
        const cleanParent = parentPath.endsWith('/') ? parentPath.slice(0, -1) : parentPath;
        
        // Add leading slash to child if needed
        const cleanChild = childPath.startsWith('/') ? childPath : '/' + childPath;
        
        return cleanParent + cleanChild;
    }

    /**
     * Find parent routes for nested routing
     */
    findParentRoutes(path) {
        const parents = [];
        let currentPath = path;
        
        while (currentPath && currentPath !== '/') {
            const nestedInfo = this.nestedRoutes.get(currentPath);
            if (nestedInfo && nestedInfo.parent) {
                parents.unshift(nestedInfo.parent);
                currentPath = nestedInfo.parent;
            } else {
                break;
            }
        }
        
        return parents;
    }

    buildRoute(routeName, params = {}, query = {}) {
        let path = routeName;
        Object.entries(params).forEach(([key, value]) => {
            path = path.replace(`:${key}`, encodeURIComponent(value));
        });
        if (Object.keys(query).length > 0) path += '?' + this.buildQueryString(query);
        return path;
    }

    runNavigationGuards(from, to) {
        // Simplified guard implementation
        return true;
    }

    revertNavigation(previousPath) {
        const revertMap = {
            history: () => window.history.replaceState(null, '', this.basePath + previousPath),
            hash: () => window.location.hash = previousPath,
            memory: () => this.routeHistory.length > 1 && this.routeHistory.pop()
        };
        revertMap[this.routingMode]?.();
        this.setState('router.isLoading', false);
    }

    handleRouteNotFound(path) {
        console.warn(`❌ Route not found: ${path}`);
        const notFoundRoute = this.routes['*'] || this.routes['/404'] || this.routes['404'];
        
        if (notFoundRoute) {
            this.setState('router.currentRoute', path);
            this.setState('router.notFound', true);
        } else {
            this.setState('router.error', `Route not found: ${path}`);
        }
        this.setState('router.isLoading', false);
        this.render();
    }

    updateRouteState(newPath, params, query, hash, route, historyState) {
        this.currentRoute = newPath;
        this.routeParams = params || {};
        
        // FIX: Ensure all router state is properly set with fallbacks
        this.setState('router.currentRoute', newPath);
        this.setState('router.params', params || {});
        this.setState('router.query', query || {}); // CRITICAL: Ensure query is always set
        this.setState('router.hash', hash || '');
        this.setState('router.route', route);
        this.setState('router.historyState', historyState);
        
        this.setState('router.notFound', false);
        this.setState('router.isLoading', false);
        
        // Update page title if needed
        const config = this.routes[route];
        if (config?.meta?.title) {
            document.title = config.meta.title.replace(/\{([^}]+)\}/g, (match, path) => {
                const keys = path.split('.');
                let value = { params: params || {}, query: query || {} };
                for (const key of keys) value = value?.[key];
                return value !== undefined ? String(value) : match;
            });
        }
        
        // DEBUG: Log state update for troubleshooting
        console.log('🔄 Router state updated:', {
            route: newPath,
            params: params || {},
            query: query || {},
            hash: hash || ''
        });
    }

    handleScrollBehavior(newPath, currentPath, options = {}) {
        if (typeof window === 'undefined') return;
        
        const scrollConfig = this.router?.scrollBehavior || 'top';
        
        // Handle function-based scroll behavior
        if (typeof scrollConfig === 'function') {
            try {
                const position = scrollConfig({
                    to: newPath,
                    from: currentPath,
                    savedPosition: options.savedPosition,
                    params: this.getState('router.params', {}),
                    query: this.getState('router.query', {})
                });
                
                if (position) {
                    this.scrollToPosition(position);
                }
            } catch (error) {
                console.error('Scroll behavior function error:', error);
                this.scrollToTop(); // Fallback
            }
            return;
        }
        
        // Handle predefined scroll behaviors
        const behaviors = {
            'top': () => this.scrollToTop(),
            'none': () => {},
            'maintain': () => {},
            'smooth-top': () => this.scrollToTop(true),
            'hash': () => this.scrollToHash(newPath),
            'element': () => this.scrollToElement(scrollConfig.selector),
            'previous': () => this.restorePreviousScroll(currentPath)
        };
        
        const behavior = behaviors[scrollConfig] || behaviors['top'];
        
        // Delay scroll to allow DOM updates
        setTimeout(() => {
            behavior();
        }, 0);
    }

    /**
     * Scroll to specific position
     */
    scrollToPosition(position) {
        const options = {
            top: position.y || position.top || 0,
            left: position.x || position.left || 0,
            behavior: position.smooth ? 'smooth' : 'auto'
        };
        
        window.scrollTo(options);
    }

    /**
 * Scroll to top with optional smooth behavior
 */
scrollToTop(smooth = false) {
    window.scrollTo({
        top: 0,
        left: 0,
        behavior: smooth ? 'smooth' : 'auto'
    });
}

/**
 * Scroll to hash anchor
 */
scrollToHash(path) {
    const hashIndex = path.indexOf('#');
    if (hashIndex === -1) {
        this.scrollToTop();
        return;
    }
    
    const hash = path.substring(hashIndex + 1);
    const element = document.getElementById(hash);
    
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    } else {
        this.scrollToTop();
    }
}

/**
 * Scroll to specific element
 */
scrollToElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

/**
 * Save current scroll position
 */
saveScrollPosition(path) {
    if (typeof window === 'undefined') return;
    
    const position = {
        x: window.pageXOffset,
        y: window.pageYOffset,
        timestamp: Date.now()
    };
    
    this.setState(`router.scrollPositions.${this.encodePathForStorage(path)}`, position);
}

/**
 * Restore previous scroll position
 */
restorePreviousScroll(path) {
    const position = this.getState(`router.scrollPositions.${this.encodePathForStorage(path)}`);
    
    if (position) {
        this.scrollToPosition(position);
    } else {
        this.scrollToTop();
    }
}

/**
 * Encode path for storage key
 */
encodePathForStorage(path) {
    return path.replace(/[^a-zA-Z0-9]/g, '_');
}

    handleLinkClick(event) {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        
        const link = event.target.closest('a');
        if (!link) return;
        
        const href = link.getAttribute('href');
        if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || 
            link.hasAttribute('data-router-ignore') || link.target === '_blank') return;
        
        event.preventDefault();
        this.navigate(href);
    }

    // Lazy loading and data loading methods (simplified)
    async loadRouteComponent(componentName, routeConfig) {
        if (this.components.has(componentName)) return this.components.get(componentName);
        
        const lazyConfig = routeConfig.lazy || this.lazyComponents?.[componentName];
        if (lazyConfig) {
            try {
                this.setState('router.isLoading', true);
                const loader = typeof lazyConfig === 'function' ? lazyConfig : lazyConfig.loader;
                const module = await loader();
                const component = module.default || module[componentName] || module;
                
                if (typeof component === 'function') {
                    this.registerComponent(componentName, component);
                    console.log(`✅ Lazy loaded component: ${componentName}`);
                    return component;
                }
            } catch (error) {
                console.error(`❌ Failed to load component ${componentName}:`, error);
                this.setState('router.error', `Failed to load component: ${error.message}`);
                throw error;
            } finally {
                this.setState('router.isLoading', false);
            }
        }
        
        throw new Error(`Component not found: ${componentName}`);
    }

    async loadRouteData(loadDataConfig, context) {
        try {
            const dataLoader = typeof loadDataConfig === 'string' ? this.routeGuards[loadDataConfig] : loadDataConfig;
            if (dataLoader) {
                console.log('🔄 Loading route data...');
                await dataLoader({
                    ...context,
                    setState: (path, value, context) => this.setState(path, value, context),
                    getState: (path, defaultValue) => this.getState(path, defaultValue),
                    services: this.services
                });
                console.log('✅ Route data loaded');
            }
        } catch (error) {
            console.error('❌ Route data loading failed:', error);
            throw new Error(`Data loading failed: ${error.message}`);
        }
    }

    async runGuards2(config, params, context) {
        const guards = config.guards || [];
        
        for (const guardName of guards) {
            const guardFn = typeof guardName === 'string' ? this.routeGuards[guardName] : guardName;
            if (guardFn) {
                const result = await guardFn({
                    ...context,
                    params,
                    navigate: (path) => this.navigate(path),
                    getState: (path, defaultValue) => this.getState(path, defaultValue),
                    setState: (path, value, context) => this.setState(path, value, context)
                });
                
                if (result === false) return false;
            }
        }
        
        return true;
    }

    /**
 * Complete route transition system
 */
async performRouteTransition(fromRoute, toRoute, transitionConfig) {
    if (!transitionConfig || this.isDestroyed) return;
    
    const config = typeof transitionConfig === 'string' 
        ? { name: transitionConfig }
        : transitionConfig;
    
    const {
        name = 'fade',
        duration = 300,
        easing = 'ease-in-out',
        beforeEnter,
        enter,
        afterEnter,
        beforeLeave,
        leave,
        afterLeave
    } = config;
    
    try {
        console.log(`🎬 Starting route transition: ${name} (${fromRoute} → ${toRoute})`);
        
        // Find the main router container
        const routerContainer = this.findRouterContainer();
        if (!routerContainer) {
            console.warn('Router container not found for transitions');
            return;
        }
        
        // Create transition elements
        const { outgoingElement, incomingElement } = this.prepareTransitionElements(routerContainer);
        
        // Execute transition
        await this.executeTransition({
            name,
            duration,
            easing,
            outgoingElement,
            incomingElement,
            beforeEnter,
            enter,
            afterEnter,
            beforeLeave,
            leave,
            afterLeave
        });
        
        console.log(`✅ Route transition completed: ${name}`);
        
    } catch (error) {
        console.error('Route transition error:', error);
        // Ensure DOM is in a clean state
        this.cleanupTransition();
    }
}

/**
 * Execute the actual transition
 */
async executeTransition(config) {
    const {
        name,
        duration,
        easing,
        outgoingElement,
        incomingElement,
        beforeEnter,
        enter,
        afterEnter,
        beforeLeave,
        leave,
        afterLeave
    } = config;
    
    // Predefined transitions
    const transitions = {
        fade: () => this.fadeTransition(outgoingElement, incomingElement, duration, easing),
        slide: () => this.slideTransition(outgoingElement, incomingElement, duration, easing),
        'slide-left': () => this.slideTransition(outgoingElement, incomingElement, duration, easing, 'left'),
        'slide-right': () => this.slideTransition(outgoingElement, incomingElement, duration, easing, 'right'),
        'slide-up': () => this.slideTransition(outgoingElement, incomingElement, duration, easing, 'up'),
        'slide-down': () => this.slideTransition(outgoingElement, incomingElement, duration, easing, 'down'),
        zoom: () => this.zoomTransition(outgoingElement, incomingElement, duration, easing),
        flip: () => this.flipTransition(outgoingElement, incomingElement, duration, easing)
    };
    
    // Custom transition hooks
    if (beforeLeave) await beforeLeave(outgoingElement);
    if (beforeEnter) await beforeEnter(incomingElement);
    
    // Execute transition
    if (leave && enter) {
        // Custom transition
        await Promise.all([
            leave(outgoingElement),
            enter(incomingElement)
        ]);
    } else if (transitions[name]) {
        // Predefined transition
        await transitions[name]();
    } else {
        // Fallback to fade
        await transitions.fade();
    }
    
    // Post-transition hooks
    if (afterLeave) await afterLeave(outgoingElement);
    if (afterEnter) await afterEnter(incomingElement);
    
    // Cleanup
    this.cleanupTransition();
}

/**
 * Fade transition implementation
 */
async fadeTransition(outgoing, incoming, duration, easing) {
    return new Promise(resolve => {
        // Set initial states
        outgoing.style.opacity = '1';
        incoming.style.opacity = '0';
        
        // Apply transition
        const transition = `opacity ${duration}ms ${easing}`;
        outgoing.style.transition = transition;
        incoming.style.transition = transition;
        
        // Trigger transition
        requestAnimationFrame(() => {
            outgoing.style.opacity = '0';
            incoming.style.opacity = '1';
        });
        
        // Complete transition
        setTimeout(resolve, duration);
    });
}

/**
 * Slide transition implementation
 */
async slideTransition(outgoing, incoming, duration, easing, direction = 'left') {
    return new Promise(resolve => {
        const transforms = {
            left: { out: 'translateX(-100%)', in: 'translateX(100%)' },
            right: { out: 'translateX(100%)', in: 'translateX(-100%)' },
            up: { out: 'translateY(-100%)', in: 'translateY(100%)' },
            down: { out: 'translateY(100%)', in: 'translateY(-100%)' }
        };
        
        const { out, in: inTransform } = transforms[direction];
        
        // Set initial states
        outgoing.style.transform = 'translateX(0)';
        incoming.style.transform = inTransform;
        
        // Apply transition
        const transition = `transform ${duration}ms ${easing}`;
        outgoing.style.transition = transition;
        incoming.style.transition = transition;
        
        // Trigger transition
        requestAnimationFrame(() => {
            outgoing.style.transform = out;
            incoming.style.transform = 'translateX(0)';
        });
        
        // Complete transition
        setTimeout(resolve, duration);
    });
}

/**
 * Zoom transition implementation
 */
async zoomTransition(outgoing, incoming, duration, easing) {
    return new Promise(resolve => {
        // Set initial states
        outgoing.style.transform = 'scale(1)';
        outgoing.style.opacity = '1';
        incoming.style.transform = 'scale(0.8)';
        incoming.style.opacity = '0';
        
        // Apply transition
        const transition = `transform ${duration}ms ${easing}, opacity ${duration}ms ${easing}`;
        outgoing.style.transition = transition;
        incoming.style.transition = transition;
        
        // Trigger transition
        requestAnimationFrame(() => {
            outgoing.style.transform = 'scale(1.2)';
            outgoing.style.opacity = '0';
            incoming.style.transform = 'scale(1)';
            incoming.style.opacity = '1';
        });
        
        // Complete transition
        setTimeout(resolve, duration);
    });
}

/**
 * Flip transition implementation
 */
async flipTransition(outgoing, incoming, duration, easing) {
    return new Promise(resolve => {
        const halfDuration = duration / 2;
        
        // First half - flip out
        outgoing.style.transition = `transform ${halfDuration}ms ${easing}`;
        outgoing.style.transform = 'rotateY(0deg)';
        
        requestAnimationFrame(() => {
            outgoing.style.transform = 'rotateY(-90deg)';
        });
        
        // Second half - flip in
        setTimeout(() => {
            outgoing.style.display = 'none';
            incoming.style.transform = 'rotateY(90deg)';
            incoming.style.transition = `transform ${halfDuration}ms ${easing}`;
            
            requestAnimationFrame(() => {
                incoming.style.transform = 'rotateY(0deg)';
            });
        }, halfDuration);
        
        // Complete transition
        setTimeout(resolve, duration);
    });
}

/**
 * Cleanup transition elements
 */
cleanupTransition() {
    const transitionElements = document.querySelectorAll('.route-transition-outgoing, .route-transition-incoming');
    transitionElements.forEach(element => {
        if (element.parentNode) {
            element.parentNode.removeChild(element);
        }
    });
}


/**
 * Prepare elements for transition
 */
prepareTransitionElements(container) {
    // Clone current content as outgoing
    const outgoingElement = container.cloneNode(true);
    outgoingElement.classList.add('route-transition-outgoing');
    
    // Create placeholder for incoming content
    const incomingElement = document.createElement('div');
    incomingElement.classList.add('route-transition-incoming');
    
    // Setup transition container
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    
    // Position elements
    outgoingElement.style.position = 'absolute';
    outgoingElement.style.top = '0';
    outgoingElement.style.left = '0';
    outgoingElement.style.width = '100%';
    outgoingElement.style.zIndex = '1';
    
    incomingElement.style.position = 'absolute';
    incomingElement.style.top = '0';
    incomingElement.style.left = '0';
    incomingElement.style.width = '100%';
    incomingElement.style.zIndex = '2';
    
    // Add to container
    container.appendChild(outgoingElement);
    container.appendChild(incomingElement);
    
    return { outgoingElement, incomingElement };
}

/**
 * Add route middleware (different from guards)
 */
addRouteMiddleware(middleware) {
    // FIX: Ensure middleware array exists
    if (!this.routeMiddleware) {
        this.routeMiddleware = [];
    }
    
    if (typeof middleware === 'function') {
        this.routeMiddleware.push({
            path: '*',
            handler: middleware,
            priority: 0
        });
    } else if (typeof middleware === 'object' && middleware.handler) {
        this.routeMiddleware.push({
            path: middleware.path || '*',
            handler: middleware.handler,
            priority: middleware.priority || 0,
            before: middleware.before,
            after: middleware.after
        });
    } else {
        console.warn('Invalid middleware format:', middleware);
        return;
    }
    
    // Sort by priority (higher priority first)
    this.routeMiddleware.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    
    console.log(`📋 Middleware added. Total: ${this.routeMiddleware.length}`);
}

/**
 * Execute route middleware
 */
async executeRouteMiddleware(context) {
    // FIX: Ensure middleware array exists
    if (!this.routeMiddleware || !Array.isArray(this.routeMiddleware)) {
        console.log('⚠️ No middleware registered');
        return true;
    }
    
    const { route, from, to, params, query } = context;
    console.log(`🔄 Executing middleware for route: ${route}`);
    console.log(`📊 Available middleware: ${this.routeMiddleware.length}`);
    
    for (const [index, middleware] of this.routeMiddleware.entries()) {
        const matchesPath = this.matchesMiddlewarePath(middleware.path, route);
        console.log(`🔍 Middleware ${index}: path="${middleware.path}", matches=${matchesPath}`);
        
        if (matchesPath) {
            try {
                // Execute before middleware
                if (middleware.before) {
                    console.log(`🔄 Running before middleware for ${middleware.path}`);
                    await middleware.before(context);
                }
                
                // Execute main middleware
                if (middleware.handler) {
                    console.log(`🔄 Running main middleware for ${middleware.path}`);
                    const result = await middleware.handler(context);
                    if (result === false) {
                        console.log(`🛑 Middleware ${middleware.path} returned false, stopping execution`);
                        return false;
                    }
                }
                
                // Execute after middleware
                if (middleware.after) {
                    console.log(`🔄 Running after middleware for ${middleware.path}`);
                    await middleware.after(context);
                }
                
            } catch (error) {
                console.error(`❌ Route middleware error (${middleware.path}):`, error);
                return false;
            }
        }
    }
    
    console.log('✅ All middleware executed successfully');
    return true;
}

/**
 * Enhanced middleware path matching
 */
matchesMiddlewarePath(middlewarePath, currentRoute) {
    if (!middlewarePath || !currentRoute) return false;
    
    // Wildcard matches everything
    if (middlewarePath === '*') {
        console.log(`🔍 Wildcard middleware matches: ${currentRoute}`);
        return true;
    }
    
    // Exact match
    if (middlewarePath === currentRoute) {
        console.log(`🔍 Exact middleware match: ${currentRoute}`);
        return true;
    }
    
    // Glob pattern matching
    if (middlewarePath.endsWith('/*')) {
        const basePath = middlewarePath.slice(0, -2);
        const matches = currentRoute.startsWith(basePath);
        console.log(`🔍 Glob pattern "${middlewarePath}" matches "${currentRoute}": ${matches}`);
        return matches;
    }
    
    // Parameter pattern matching
    if (middlewarePath.includes(':')) {
        const match = this.matchPattern ? this.matchPattern(middlewarePath, currentRoute) : null;
        const matches = !!match;
        console.log(`🔍 Parameter pattern "${middlewarePath}" matches "${currentRoute}": ${matches}`);
        return matches;
    }
    
    console.log(`🔍 No middleware match: "${middlewarePath}" vs "${currentRoute}"`);
    return false;
}
/**
 * Find the main router container
 */
findRouterContainer() {
    // Look for Router component
    const routerElement = document.querySelector('[data-component-name="Router"]');
    if (routerElement) return routerElement;
    
    // Look for common app containers
    const containers = ['#app', '.app', '[data-juris-app]', 'main'];
    for (const selector of containers) {
        const element = document.querySelector(selector);
        if (element) return element;
    }
    
    return document.body;
}

    /**
     * Create RouterOutlet component for nested routing
     */
    createRouterOutletComponent(props, context) {
        const outletName = props.name || 'default';
        
        return {
            render: () => {
                const currentRoute = context.getState('router.currentRoute', '/');
                const nestedRouteData = context.getState('router.nestedRoutes', {});
                const params = context.getState('router.params', {});
                const query = context.getState('router.query', {});
                
                // Find the child route for this outlet
                const childRoute = nestedRouteData[outletName];
                
                if (!childRoute) {
                    // No child route, render fallback or empty
                    if (props.fallback) {
                        return typeof props.fallback === 'string' 
                            ? { [props.fallback]: { ...props, routeParams: params, routeQuery: query } }
                            : props.fallback;
                    }
                    return { div: { className: 'router-outlet-empty', 'data-outlet': outletName } };
                }
                
                // Render the child component
                const componentName = childRoute.component;
                if (!componentName || !this.components.has(componentName)) {
                    return this.createErrorComponent(`Component not found for outlet '${outletName}': ${componentName}`);
                }
                
                return {
                    [componentName]: {
                        ...props,
                        routeParams: { ...params, ...childRoute.params },
                        routeQuery: { ...query, ...childRoute.query },
                        routePath: childRoute.path,
                        outlet: outletName
                    }
                };
            },
            
            onMount: (element, props, context) => {
                // Register this outlet
                const outletName = props.name || 'default';
                this.routeOutlets.set(outletName, {
                    element,
                    props,
                    context,
                    lastRenderedRoute: null
                });
                
                console.log(`🔌 RouterOutlet '${outletName}' mounted`);
            },
            
            onUnmount: (element, props, context) => {
                // Unregister this outlet
                const outletName = props.name || 'default';
                this.routeOutlets.delete(outletName);
                
                console.log(`🔌 RouterOutlet '${outletName}' unmounted`);
            }
        };
    }

    /**
     * Update nested route state for outlets
     */
    updateNestedRouteState(matchResult) {
        const nestedRoutes = {};
        
        if (matchResult && this.nestedRoutes.has(matchResult.route)) {
            const parentRoutes = this.findParentRoutes(matchResult.route);
            
            // Build nested route structure
            parentRoutes.forEach((parentPath, index) => {
                const parentConfig = this.routes[parentPath];
                if (parentConfig && parentConfig.outlets) {
                    Object.entries(parentConfig.outlets).forEach(([outletName, childPath]) => {
                        const childConfig = this.routes[childPath];
                        if (childConfig) {
                            nestedRoutes[outletName] = {
                                path: childPath,
                                component: childConfig.component,
                                params: matchResult.params || {},
                                query: matchResult.query || {}
                            };
                        }
                    });
                }
            });
        }
        
        this.setState('router.nestedRoutes', nestedRoutes);
    }

        /**
     * : Unified pattern matching for all route types
     */
    matchPattern(pattern, path) {
        // Wildcard routes
        if (pattern.includes('*')) {
            const basePattern = pattern.substring(0, pattern.indexOf('*'));
            if (path.startsWith(basePattern)) {
                return { params: { wildcard: path.substring(basePattern.length) }, type: 'wildcard' };
            }
        }
        
        // Regex routes
        if (pattern.startsWith('RegExp:')) {
            try {
                const regex = new RegExp(pattern.substring(7));
                const match = path.match(regex);
                if (match) {
                    const params = {};
                    match.slice(1).forEach((value, index) => params[`match${index}`] = value);
                    return { params, type: 'regex' };
                }
            } catch (error) {
                console.error('Invalid regex pattern:', pattern, error);
            }
        }
        
        // Parameter routes (handles both required and optional)
        if (pattern.includes(':')) {
            const patternParts = pattern.split('/');
            const pathParts = path.split('/');
            
            if (patternParts.length !== pathParts.length) return null;
            
            const params = {};
            for (let i = 0; i < patternParts.length; i++) {
                const patternPart = patternParts[i];
                const pathPart = pathParts[i];
                
                if (patternPart.startsWith(':')) {
                    const paramMatch = patternPart.match(/:(\w+)([?+*])?/);
                    if (paramMatch) {
                        const [, paramName, modifier] = paramMatch;
                        if (modifier === '?' && !pathPart) {
                            params[paramName] = undefined;
                        } else {
                            params[paramName] = decodeURIComponent(pathPart);
                        }
                    }
                } else if (patternPart !== pathPart) {
                    return null;
                }
            }
            
            return { params, type: 'parameter' };
        }
        
        return null;
    }

    extractParams(pattern, path) {
        const patternParts = pattern.split('/');
        const pathParts = path.split('/');
        
        if (patternParts.length !== pathParts.length) {
            return null;
        }
        
        const params = {};
        for (let i = 0; i < patternParts.length; i++) {
            const patternPart = patternParts[i];
            const pathPart = pathParts[i];
            
            if (patternPart.startsWith(':')) {
                const paramName = patternPart.substring(1);
                params[paramName] = pathPart;
            } else if (patternPart !== pathPart) {
                return null;
            }
        }
        
        return params;
    }
    
    async runGuards(routeConfig, params, context) {
        const guards = [];
        
        if (typeof routeConfig === 'object' && routeConfig.guard) {
            guards.push(routeConfig.guard);
        }
        if (typeof routeConfig === 'object' && routeConfig.guards) {
            guards.push(...routeConfig.guards);
        }
        
        for (const middleware of this.routeMiddleware) {
            if (this.matchesMiddlewarePath(middleware.path, context.route)) {
                if (middleware.guard) {
                    guards.push(middleware.guard);
                }
            }
        }
        
        for (const guardName of guards) {
            const guardFn = typeof guardName === 'string' ? this.routeGuards[guardName] : guardName;
            if (guardFn) {
                const result = await guardFn({
                    ...context,
                    params,
                    route: context.route,
                    navigate: (path) => this.navigate(path),
                    getState: (path, defaultValue) => this.getState(path, defaultValue),
                    setState: (path, value, context) => this.setState(path, value, context)
                });
                
                if (result === false) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    
    createRouterComponent2(props, context) {
        // Capture 'this' reference for use in component methods
        const juris = this;
        
        return {
            render() {
                const currentRoute = context.getState('router.currentRoute', '/');
                const isLoading = context.getState('router.isLoading', false);
                const error = context.getState('router.error', null);
                const params = context.getState('router.params', {});
                
                if (isLoading) {
                    return {
                        div: {
                            className: 'loading',
                            text: 'Loading...'
                        }
                    };
                }
                
                if (error) {
                    return {
                        div: {
                            className: 'error',
                            children: () => [{
                                h3: { text: 'Router Error' }
                            }, {
                                p: { text: error }
                            }, {
                                button: {
                                    text: 'Go Home',
                                    onClick: () => juris.navigate('/')
                                }
                            }]
                        }
                    };
                }
                
                const matchResult = juris.matchRoute(currentRoute);
                if (!matchResult) {
                    return {
                        div: {
                            className: 'error',
                            text: `404 - Route not found: ${currentRoute}`
                        }
                    };
                }
                
                const { config } = matchResult;
                const componentName = typeof config === 'string' ? config : config.component;
                
                if (!componentName || !juris.components.has(componentName)) {
                    return {
                        div: {
                            className: 'error',
                            text: `Component not found: ${componentName}`
                        }
                    };
                }
                
                return {
                    [componentName]: { ...props, routeParams: params }
                };
            }
        };
    }
    
    getRouteFromHash() {
        if (typeof window === 'undefined') return '/';
        const hash = window.location.hash;
        return hash.startsWith('#') ? hash.substring(1) : '/';
    }

    getStats(options = {}) {
        const { 
            includeDetails = false,
            includeMemoryInfo = false,
            includePerformanceMetrics = false 
        } = options;
        
        // Basic statistics
        const stats = {
            // Framework state
            framework: {
                isDestroyed: this.isDestroyed,
                version: '0.1.1', // Could be dynamic
                initialized: !!this.state
            },
            
            // Enhanced elements (from enhance() system)
            enhanced: {
                total: this.trackedElements ? this.trackedElements.size : 0,
                withLifecycle: (() => {
                    if (!this.elementLifecycleHooks) return 0;
                    let count = 0;
                    document.querySelectorAll('[data-juris-enhanced]').forEach(el => {
                        if (this.elementLifecycleHooks.has(el)) count++;
                    });
                    return count;
                })(),
                mounted: (() => {
                    if (!this.elementMountState) return 0;
                    let count = 0;
                    document.querySelectorAll('[data-juris-enhanced]').forEach(el => {
                        const state = this.elementMountState.get(el);
                        if (state && state.mounted) count++;
                    });
                    return count;
                })()
            },
            
            // Component system statistics
            components: {
                registered: this.components ? this.components.size : 0,
                instances: this.componentInstances ? this.componentInstances.size : 0,
                mounted: this.mountedComponents ? this.mountedComponents.size : 0,
                headless: this.headlessComponents ? this.headlessComponents.size : 0
            },
            
            // State management statistics
            state: {
                subscribers: this.subscribers ? this.subscribers.size : 0,
                externalSubscribers: this.externalSubscribers ? this.externalSubscribers.size : 0,
                elementSubscriptions: (() => {
                    if (!this.elementSubscriptions) return 0;
                    let count = 0;
                    document.querySelectorAll('[data-juris-enhanced]').forEach(el => {
                        if (this.elementSubscriptions.has(el)) count++;
                    });
                    return count;
                })(),
                pendingUpdates: this.updateBatches ? this.updateBatches.size : 0
            },
            
            // Observer system statistics
            observers: {
                selectors: this.selectorObservers ? this.selectorObservers.size : 0,
                enhancement: this.enhancementObservers ? this.enhancementObservers.size : 0,
                route: this.routeOutlets ? this.routeOutlets.size : 0
            },
            
            // Router statistics (if enabled)
            router: this.router ? {
                enabled: true,
                mode: this.routingMode || 'hash',
                currentRoute: this.currentRoute || '/',
                registeredRoutes: Object.keys(this.routes || {}).length,
                routeGuards: Object.keys(this.routeGuards || {}).length,
                routeMiddleware: this.routeMiddleware ? this.routeMiddleware.length : 0,
                routeHistory: this.routeHistory ? this.routeHistory.length : 0
            } : {
                enabled: false
            }
        };
        
        // Add detailed information if requested
        if (includeDetails) {
            stats.details = {
                // Enhanced elements details
                enhancedElements: this.getEnhancedElementsDetails(),
                
                // Component details
                componentDetails: this.getComponents(),
                
                // Headless component details
                headlessDetails: this.getHeadlessComponents(),
                
                // State tree structure
                stateStructure: this.getStateStructure(),
                
                // Observer details
                observerDetails: this.getObserverDetails()
            };
        }
        
        // Add memory information if requested
        if (includeMemoryInfo && typeof performance !== 'undefined') {
            stats.memory = {
                // WeakMap sizes (estimated)
                weakMaps: {
                    elementSubscriptions: this.estimateWeakMapSize(this.elementSubscriptions),
                    componentApis: this.estimateWeakMapSize(this.componentApis),
                    lifecycleCleanup: this.estimateWeakMapSize(this.lifecycleCleanup),
                    elementLifecycleHooks: this.estimateWeakMapSize(this.elementLifecycleHooks)
                },
                
                // DOM element count
                dom: {
                    enhancedElements: document.querySelectorAll('[data-juris-enhanced]').length,
                    componentElements: document.querySelectorAll('[data-component-instance]').length,
                    totalElements: document.querySelectorAll('*').length
                },
                
                // Browser memory (if available)
                browser: this.getBrowserMemoryInfo()
            };
        }
        
        // Add performance metrics if requested
        if (includePerformanceMetrics) {
            stats.performance = {
                // Framework initialization time
                initTime: this._initTime || null,
                
                // Lifecycle event metrics
                lifecycle: this.getLifecycleMetrics(),
                
                // Update performance
                updates: {
                    totalBatched: this._totalBatchedUpdates || 0,
                    averageBatchSize: this._averageBatchSize || 0,
                    lastUpdateTime: this._lastUpdateTime || null
                },
                
                // Enhancement performance
                enhancement: {
                    totalEnhanced: this._totalEnhanced || 0,
                    averageEnhancementTime: this._averageEnhancementTime || 0,
                    lastEnhancementTime: this._lastEnhancementTime || null
                }
            };
        }
        
        return stats;
    }
    
    // Helper method: Get enhanced elements details
    getEnhancedElementsDetails() {
        if (!this.trackedElements) return [];
        
        const details = [];
        this.trackedElements.forEach(item => {
            const element = item.ref?.deref();
            if (element) {
                const lifecycleData = this.elementLifecycleHooks?.get(element);
                const mountState = this.elementMountState?.get(element);
                
                details.push({
                    tagName: element.tagName.toLowerCase(),
                    id: element.id || null,
                    className: element.className || null,
                    isConnected: element.isConnected,
                    hasLifecycle: !!lifecycleData,
                    lifecycleHooks: lifecycleData ? Object.keys(lifecycleData.lifecycleHooks) : [],
                    mounted: mountState?.mounted || false,
                    hasCleanup: !!mountState?.cleanup
                });
            }
        });
        
        return details;
    }
    
    // Helper method: Get state structure
    getStateStructure() {
        const getStructure = (obj, path = '') => {
            const structure = {};
            
            Object.keys(obj).forEach(key => {
                const fullPath = path ? `${path}.${key}` : key;
                const value = obj[key];
                
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    structure[key] = {
                        type: 'object',
                        path: fullPath,
                        children: getStructure(value, fullPath),
                        hasSubscribers: this.subscribers ? this.subscribers.has(fullPath) : false
                    };
                } else {
                    structure[key] = {
                        type: Array.isArray(value) ? 'array' : typeof value,
                        path: fullPath,
                        value: Array.isArray(value) ? `Array(${value.length})` : value,
                        hasSubscribers: this.subscribers ? this.subscribers.has(fullPath) : false
                    };
                }
            });
            
            return structure;
        };
        
        return getStructure(this.state || {});
    }
    
    // Helper method: Get observer details
    getObserverDetails() {
        const details = {
            selectors: [],
            enhancement: [],
            routes: []
        };
        
        // Selector observers
        if (this.selectorObservers) {
            this.selectorObservers.forEach((data, selector) => {
                details.selectors.push({
                    selector,
                    container: data.container?.tagName || 'unknown',
                    isConnected: data.container?.isConnected || false
                });
            });
        }
        
        // Enhancement observers
        if (this.enhancementObservers) {
            this.enhancementObservers.forEach((observers, enhancementId) => {
                details.enhancement.push({
                    enhancementId,
                    observerCount: observers.length
                });
            });
        }
        
        // Route observers
        if (this.routeOutlets) {
            this.routeOutlets.forEach((data, outletName) => {
                details.routes.push({
                    outletName,
                    isConnected: data.element?.isConnected || false,
                    lastRenderedRoute: data.lastRenderedRoute || null
                });
            });
        }
        
        return details;
    }
    
    // Helper method: Estimate WeakMap size (rough approximation)
    estimateWeakMapSize(weakMap) {
        if (!weakMap) return 0;
        
        // Since WeakMaps don't have a size property, we estimate by checking
        // known elements that might be in the WeakMap
        let count = 0;
        const elements = document.querySelectorAll('[data-juris-enhanced], [data-component-instance]');
        
        elements.forEach(element => {
            if (weakMap.has(element)) {
                count++;
            }
        });
        
        return count;
    }
    
    // Helper method: Get browser memory info (if available)
    getLifecycleMetrics() {
        return {
            totalMounts: this._lifecycleStats?.mounts || 0,
            totalUnmounts: this._lifecycleStats?.unmounts || 0,
            totalUpdates: this._lifecycleStats?.updates || 0,
            totalErrors: this._lifecycleStats?.errors || 0,
            averageMountTime: this._lifecycleStats?.avgMountTime || 0,
            averageUpdateTime: this._lifecycleStats?.avgUpdateTime || 0
        };
    }
    
    // Helper method: Get lifecycle metrics
    getLifecycleMetrics() {
        return {
            totalMounts: this._lifecycleStats?.mounts || 0,
            totalUnmounts: this._lifecycleStats?.unmounts || 0,
            totalUpdates: this._lifecycleStats?.updates || 0,
            totalErrors: this._lifecycleStats?.errors || 0,
            averageMountTime: this._lifecycleStats?.avgMountTime || 0,
            averageUpdateTime: this._lifecycleStats?.avgUpdateTime || 0
        };
    }
    
    // Helper method: Add performance tracking to lifecycle hooks
    trackLifecyclePerformance(eventType, startTime, endTime) {
        if (!this._lifecycleStats) {
            this._lifecycleStats = {
                mounts: 0,
                unmounts: 0, 
                updates: 0,
                errors: 0,
                avgMountTime: 0,
                avgUpdateTime: 0
            };
        }
        
        const duration = endTime - startTime;
        
        switch (eventType) {
            case 'mount':
                this._lifecycleStats.mounts++;
                this._lifecycleStats.avgMountTime = 
                    (this._lifecycleStats.avgMountTime + duration) / 2;
                break;
            case 'unmount':
                this._lifecycleStats.unmounts++;
                break;
            case 'update':
                this._lifecycleStats.updates++;
                this._lifecycleStats.avgUpdateTime = 
                    (this._lifecycleStats.avgUpdateTime + duration) / 2;
                break;
            case 'error':
                this._lifecycleStats.errors++;
                break;
        }
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Juris;
}