/**
 * Juris (JavaScript Unified Reactive Interface Solution) 
 * transforms web development through its comprehensive object-first architecture that makes 
 * reactivity an intentional choice rather than an automatic behavior. By expressing interfaces 
 * as pure JavaScript objects where functions explicitly define reactivity, Juris delivers a 
 * complete solution for applications that are universally deployable, precisely controlled,
 * and designed from the ground up for seamless AI collaboration—all while maintaining the 
 * simplicity and debuggability of native JavaScript patterns.
 * 
 * Author: Resti Guay
 * Version: 0.0.1
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
        
        // Router configuration
        this.router = config.router;
        this.routes = {};
        this.routeGuards = {};
        this.routeMiddleware = [];
        this.routeParams = {};
        this.currentRoute = '/';
        
        // State management
        this.subscribers = new Map();
        this.elementSubscriptions = new WeakMap();
        this.currentlyTracking = null;
        
        // External subscribers
        this.externalSubscribers = new Map();
        
        // Enhancement system with memory management
        this.selectorObservers = new Map();
        this.enhancementQueue = new Set();
        this.cleanupScheduled = false;
        this.trackedElements = new Set();
        this.isDestroyed = false;
        
        // Performance optimization
        this.updateBatches = new Map();
        this.batchTimeout = null;
        
        // Component lifecycle management
        this.componentInstances = new Map();
        this.componentApis = new WeakMap(); // Store component APIs for external access
        this.lifecycleCleanup = new WeakMap();
        this.mountedComponents = new Set();
        
        // Register components
        if (config.components) {
            Object.entries(config.components).forEach(([name, component]) => {
                this.registerComponent(name, component);
            });
        }
        
        // Register components from services (for backwards compatibility)
        if (config.services) {
            this.registerComponentsFromServices(config.services);
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
    
    // =================================================================
    // ENHANCED OBSERVER SYSTEM
    // =================================================================
    
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
            this.enhanceSingleElement(element, definitionFn, config);
        });
        
        // Setup observer for future elements
        if (config.useObserver) {
            this.observeForSelector(selector, definitionFn, config);
        }
        
        return () => this.stopEnhancementObserver(selector);
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
            
            const context = {
                getState: (path, defaultValue) => this.getState(path, defaultValue),
                setState: (path, value, context) => this.setState(path, value, context),
                services: this.services
            };
            
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
    // OPTIMIZED STATE MANAGEMENT
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
        if (this.currentlyTracking) {
            this.currentlyTracking.add(path);
        }
        
        const keys = path.split('.');
        let current = this.state;
        
        for (const key of keys) {
            if (current[key] === undefined) {
                return defaultValue;
            }
            current = current[key];
        }
        
        return current;
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
    // ENHANCED REACTIVITY SYSTEM
    // =================================================================
    
    createReactiveAttribute(element, attributeName, valueFn) {
        if (this.isDestroyed) return;
        
        const dependencies = new Set();
        this.currentlyTracking = dependencies;
        
        const updateAttribute = () => {
            if (this.isDestroyed) return;
            
            try {
                this.currentlyTracking = dependencies;
                const value = valueFn();
                this.currentlyTracking = null;
                
                this.applyAttributeValue(element, attributeName, value);
                
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
    
    applyAttributeValue(element, attributeName, value) {
        if (attributeName === 'textContent') {
            element.textContent = value;
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
            element.style[styleProp] = value;
        } else if (this.isAttribute(attributeName)) {
            if (value === null || value === undefined || value === false) {
                element.removeAttribute(attributeName);
            } else if (value === true) {
                element.setAttribute(attributeName, '');
            } else {
                element.setAttribute(attributeName, String(value));
            }
        } else {
            element[attributeName] = value;
        }
    }
    
    cleanupElement(element) {
        if (!element) return;
        
        // Trigger component unmount if this is a component
        if (element.hasAttribute && element.hasAttribute('data-component-instance')) {
            this.triggerUnmountHook(element);
        }
        
        // Cleanup subscriptions
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
    }
    
    // =================================================================
    // COMPONENT SYSTEM WITH LIFECYCLE SUPPORT
    // =================================================================
    
    registerComponent(name, componentFn) {
        this.components.set(name, componentFn);
        console.log(`📦 Component registered: ${name}`);
    }
    
    registerComponentsFromServices(services) {
        const findComponents = (obj, prefix = '') => {
            Object.entries(obj).forEach(([key, value]) => {
                if (typeof value === 'function' && key !== key.toLowerCase()) {
                    this.registerComponent(key, value);
                } else if (typeof value === 'object' && value !== null) {
                    findComponents(value, prefix ? `${prefix}.${key}` : key);
                }
            });
        };
        
        findComponents(services);
    }
    
    renderComponent(componentName, props, parentProps = null) {
        const componentFn = this.components.get(componentName);
        
        if (!componentFn) {
            console.error(`❌ Component not found: ${componentName}`);
            return this.createErrorElement(`Component not found: ${componentName}`);
        }
        
        try {
            const context = {
                setState: (path, value, context) => this.setState(path, value, context),
                getState: (path, defaultValue) => this.getState(path, defaultValue),
                navigate: (path) => this.navigate(path),
                subscribe: (path, callback) => this.subscribe(path, callback),
                services: this.services,
                
                // Advanced Component Management APIs
                getComponents: (filter) => this.getComponents(filter),
                scanComponentElementProps: (selector, options) => this.scanComponentElementProps(selector, options),
                invokeElementProp: (element, propName, ...args) => this.invokeElementProp(element, propName, ...args),
                updateComponent: (selector, newProps, options) => this.updateComponent(selector, newProps, options),
                removeComponent: (selector, options) => this.removeComponent(selector, options),
                getComponentInfo: (selector) => this.getComponentInfo(selector),
                getComponent: (selector) => this.getComponent(selector),
                
                // Framework instance access for advanced usage
                juris: this
            };
            
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
                ['onMount', 'onUpdate', 'onBeforeUpdate', 'onUnmount', 'onError'].forEach(hook => {
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
                ['onMount', 'onUpdate', 'onBeforeUpdate', 'onUnmount', 'onError'].forEach(hook => {
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
            this.triggerErrorHook(element, error, props, context);
            
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
    // ADVANCED COMPONENT API MANAGEMENT
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
                id: el.id,
                className: el.className,
                depth,
                attributes: {},
                props: {},
                events: {},
                reactive: {},
                isComponent: el.hasAttribute('data-component-instance'),
                componentName: el.getAttribute('data-component-name'),
                element: el
            };
            
            // Scan attributes
            Array.from(el.attributes).forEach(attr => {
                elementInfo.attributes[attr.name] = {
                    value: attr.value,
                    isInvocable: false
                };
            });
            
            // Scan element subscriptions for reactive properties
            const subscriptions = this.elementSubscriptions.get(el);
            if (subscriptions) {
                subscriptions.forEach(subscription => {
                    subscription.unsubscribeFns.forEach((unsub, index) => {
                        // Try to extract reactive property info
                        const propName = `reactive_${index}`;
                        elementInfo.reactive[propName] = {
                            isInvocable: true,
                            type: 'reactive',
                            dependencies: [] // Would need to track this separately
                        };
                    });
                });
            }
            
            // Scan event listeners (this is limited to what we can detect)
            const eventTypes = [
                'click', 'input', 'change', 'submit', 'keydown', 'keyup', 'keypress',
                'mousedown', 'mouseup', 'mouseover', 'mouseout', 'mousemove',
                'focus', 'blur', 'load', 'unload', 'resize', 'scroll'
            ];
            
            eventTypes.forEach(eventType => {
                // Check if element has event listener (limited detection)
                const hasListener = el[`on${eventType}`] !== null || 
                                  el.getAttribute(`on${eventType}`) !== null;
                if (hasListener) {
                    elementInfo.events[eventType] = {
                        isInvocable: true,
                        type: 'event',
                        canSimulate: true
                    };
                }
            });
            
            // Scan for reactive text content
            if (el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE) {
                elementInfo.props.textContent = {
                    value: el.textContent,
                    isInvocable: false,
                    type: 'static'
                };
            }
            
            // Scan for reactive style properties
            if (el.style.length > 0) {
                Array.from(el.style).forEach(styleProp => {
                    elementInfo.props[`style.${styleProp}`] = {
                        value: el.style[styleProp],
                        isInvocable: false,
                        type: 'style'
                    };
                });
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
                api: instance ? Object.keys(instance.api) : []
            },
            scan: scanElement(element),
            timestamp: Date.now()
        };
    }
    
    invokeElementProp(elementSelector, propName, ...args) {
        let element;
        if (typeof elementSelector === 'string') {
            element = document.querySelector(elementSelector);
        } else if (elementSelector instanceof HTMLElement) {
            element = elementSelector;
        }
        
        if (!element) {
            console.warn(`Element not found: ${elementSelector}`);
            return false;
        }
        
        try {
            // Handle different types of invocations
            if (propName.startsWith('on')) {
                // Event handler invocation
                const eventType = propName.substring(2).toLowerCase();
                const event = new Event(eventType, { bubbles: true, cancelable: true });
                
                // Add any additional properties to the event
                if (args.length > 0 && typeof args[0] === 'object') {
                    Object.assign(event, args[0]);
                }
                
                console.log(`🔄 Invoking event: ${eventType} on`, element);
                element.dispatchEvent(event);
                return true;
                
            } else if (propName.includes('reactive') || propName.includes('function')) {
                // Try to trigger reactive updates by changing related state
                console.log(`🔄 Triggering reactive update for: ${propName} on`, element);
                
                // Find component instance
                const instanceId = element.getAttribute('data-component-instance') ||
                                 element.closest('[data-component-instance]')?.getAttribute('data-component-instance');
                
                if (instanceId) {
                    const instance = this.componentInstances.get(instanceId);
                    if (instance) {
                        // Trigger a dummy state change to force re-render
                        const dummyPath = `component.${instanceId}.forceUpdate`;
                        this.setState(dummyPath, Date.now());
                        return true;
                    }
                }
                
            } else if (element[propName] && typeof element[propName] === 'function') {
                // Direct method invocation
                console.log(`🔄 Invoking method: ${propName} on`, element);
                return element[propName](...args);
                
            } else {
                console.warn(`Property ${propName} is not invocable on element`, element);
                return false;
            }
            
        } catch (error) {
            console.error(`Error invoking ${propName}:`, error);
            return false;
        }
        
        return false;
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
    
    // Helper method to get detailed component info
    getComponentInfo(componentSelector) {
        let element;
        if (typeof componentSelector === 'string') {
            element = document.querySelector(`[data-component-name="${componentSelector}"]`);
            if (!element) {
                element = document.querySelector(componentSelector);
            }
        } else if (componentSelector instanceof HTMLElement) {
            element = componentSelector;
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
    
    getParentComponent(element) {
        const parentComponentEl = element.closest('[data-component-instance]');
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
    
    getAllComponents() {
        // This method is now an alias for getComponents() for backward compatibility
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
    
    createElement(tagName, props = {}) {
        if (this.isDestroyed) return null;
        
        const element = document.createElement(tagName);
        element.setAttribute('data-created', Date.now());
        
        const injectedProps = {
            ...props,
            setState: (path, value, context) => this.setState(path, value, context),
            getState: (path, defaultValue) => this.getState(path, defaultValue),
            navigate: (path) => this.navigate(path),
            services: this.services,
            
            // Advanced Component Management APIs
            getComponents: (filter) => this.getComponents(filter),
            scanComponentElementProps: (selector, options) => this.scanComponentElementProps(selector, options),
            invokeElementProp: (element, propName, ...args) => this.invokeElementProp(element, propName, ...args),
            updateComponent: (selector, newProps, options) => this.updateComponent(selector, newProps, options),
            removeComponent: (selector, options) => this.removeComponent(selector, options),
            getComponentInfo: (selector) => this.getComponentInfo(selector),
            getComponent: (selector) => this.getComponent(selector),
            
            // Framework instance access
            juris: this
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
        
        // Handle events
        if (injectedProps.onClick) {
            element.addEventListener('click', (e) => injectedProps.onClick(e, injectedProps));
        }
        
        Object.keys(injectedProps).forEach(key => {
            if (key.startsWith('on') && key !== 'onClick' && typeof injectedProps[key] === 'function') {
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
            if (['text', 'onClick', 'style', 'children', 'setState', 'getState', 'navigate', 'services', 'routeParams'].includes(key) || 
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
        
        // Handle children
        if (injectedProps.children) {
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
            } else if (key === 'children') {
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
            } else if (key === 'onClick') {
                element.addEventListener('click', (e) => value(e, context));
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
        if (this.isDestroyed) return;
        
        const containerEl = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;
        
        if (!containerEl) {
            console.error('Juris: Container not found:', container);
            return;
        }
        
        // Clean up existing content
        Array.from(containerEl.children).forEach(child => this.cleanupElement(child));
        containerEl.innerHTML = '';
        
        try {
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
            containerEl.innerHTML = `<div class="error">Render error: ${error.message}</div>`;
        }
    }
    
    // =================================================================
    // ROUTER SYSTEM
    // =================================================================
    
    setupRouter() {
        if (this.router.routes) {
            this.routes = this.router.routes;
        }
        
        if (this.router.guards) {
            this.routeGuards = this.router.guards;
        }
        
        if (this.router.middleware) {
            this.routeMiddleware = this.router.middleware;
        }
        
        this.registerComponent('Router', (props, context) => this.createRouterComponent(props, context));
        
        if (typeof window !== 'undefined') {
            window.addEventListener('hashchange', () => {
                if (!this.isDestroyed) {
                    this.handleRouteChange();
                }
            });
            
            window.addEventListener('beforeunload', (e) => {
                if (this.getState('router.hasUnsavedChanges', false)) {
                    e.preventDefault();
                    e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                    return e.returnValue;
                }
            });
        }
        
        this.currentRoute = this.getRouteFromHash();
        this.setState('router.currentRoute', this.currentRoute);
        this.setState('router.isLoading', false);
    }
    
    matchRoute(path) {
        if (this.routes[path]) {
            return { route: path, params: {}, config: this.routes[path] };
        }
        
        for (const [routePattern, config] of Object.entries(this.routes)) {
            const params = this.extractParams(routePattern, path);
            if (params) {
                return { route: routePattern, params, config };
            }
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
    
    matchesMiddlewarePath(middlewarePath, currentRoute) {
        if (middlewarePath.endsWith('/*')) {
            const basePath = middlewarePath.slice(0, -2);
            return currentRoute.startsWith(basePath);
        }
        return middlewarePath === currentRoute;
    }
    
    async handleRouteChange() {
        if (this.isDestroyed) return;
        
        const newPath = this.getRouteFromHash();
        const currentPath = this.getState('router.currentRoute', '/');
        
        if (this.getState('router.hasUnsavedChanges', false)) {
            const confirmed = confirm('You have unsaved changes. Are you sure you want to leave?');
            if (!confirmed) {
                window.location.hash = currentPath;
                return;
            }
            this.setState('router.hasUnsavedChanges', false);
        }
        
        this.setState('router.isLoading', true);
        this.setState('router.error', null);
        
        try {
            const matchResult = this.matchRoute(newPath);
            
            if (!matchResult) {
                this.setState('router.error', `Route not found: ${newPath}`);
                this.setState('router.isLoading', false);
                return;
            }
            
            const { route, params, config } = matchResult;
            
            const guardsPassed = await this.runGuards(config, params, {
                route: newPath,
                from: currentPath,
                to: newPath
            });
            
            if (!guardsPassed) {
                window.location.hash = currentPath;
                this.setState('router.isLoading', false);
                return;
            }
            
            if (typeof config === 'object' && config.loadData) {
                const dataLoader = typeof config.loadData === 'string' 
                    ? this.routeGuards[config.loadData] 
                    : config.loadData;
                
                if (dataLoader) {
                    await dataLoader({
                        params,
                        route: newPath,
                        getState: (path, defaultValue) => this.getState(path, defaultValue),
                        setState: (path, value, context) => this.setState(path, value, context)
                    });
                }
            }
            
            this.currentRoute = newPath;
            this.routeParams = params;
            this.setState('router.currentRoute', newPath);
            this.setState('router.params', params);
            this.setState('router.isLoading', false);
            
            this.render();
            
        } catch (error) {
            console.error('Route change error:', error);
            this.setState('router.error', error.message);
            this.setState('router.isLoading', false);
        }
    }
    
    createRouterComponent(props, context) {
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
    
    navigate(path) {
        if (typeof window !== 'undefined') {
            window.location.hash = path;
        }
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Juris;
}

// Example usage:
/*
const juris = new Juris({
    components: {
        UserCard,
        DataList,
        ContactForm,
        Modal
    },
    layout: {
        div: {
            className: 'app',
            children: () => [
                { UserCard: { userId: '123', name: 'John Doe' } },
                { DataList: { endpoint: '/api/items' } }
            ]
        }
    }
});

juris.render('#app');

// Access component APIs
const userCard = juris.getComponent('UserCard');
if (userCard) {
    userCard.toggleStatus();
}

const dataList = juris.getComponent('DataList');
if (dataList) {
    dataList.refresh();
}
*/